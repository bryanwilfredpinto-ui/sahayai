"""
lib/observability.py
--------------------
Three telemetry layers, all routed through one Observability object:

  1. Audit log    — every request/response, every rail decision, every tool
                    call. Persisted in the Chitti's own DB (Turso libSQL via
                    SQLAlchemy or via the host's existing connection).
                    This is the canonical record the Founder dashboard reads.

  2. Prometheus   — counters + histograms for live ops dashboards. Exposed
                    at /metrics via a Flask blueprint (Chittis wire it in if
                    they want it; not mandatory).

  3. OpenTelemetry — traces around every model call. NO-OP by default — the
                    backend silently swallows traces unless OTEL_EXPORTER_OTLP_ENDPOINT
                    is set in env, in which case we use opentelemetry-sdk to
                    push to a collector. Designed so adding OTel later is one
                    env var, no code changes.

Schema
------
Two tables live in each Chitti's DB:

  quality_audit
    id, request_id, chitti, kind, phase, payload (JSON text), ts

  quality_feedback                  -- written by lib/feedback.py
    id, request_id, chitti, thumbs, comment, ip_hash, ts

`kind` is one of: request | response | rail | tool. Rolled into one table
so the Founder dashboard can pull a single ordered stream per request_id.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import threading
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import Column, Integer, String, Text, DateTime, Index, create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func


log = logging.getLogger("observability")


# ---------- Schema --------------------------------------------------------


_AuditBase = declarative_base()


class QualityAudit(_AuditBase):
    __tablename__ = "quality_audit"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(32), nullable=False, index=True)
    chitti = Column(String(40), nullable=False, index=True)
    kind = Column(String(16), nullable=False)        # request|response|rail|tool
    phase = Column(String(20), nullable=True)        # before_model|after_model|before|after
    rail = Column(String(20), nullable=True)         # safety|relevance|truth|compliance
    action = Column(String(16), nullable=True)       # pass|warn|block|inject|redirect
    reason = Column(String(80), nullable=True)
    payload_json = Column(Text, nullable=True)        # full structured payload
    ts = Column(DateTime, nullable=False, server_default=func.now(), index=True)

    __table_args__ = (
        Index("ix_quality_audit_chitti_ts", "chitti", "ts"),
        Index("ix_quality_audit_req", "request_id"),
    )


# ---------- Prometheus (lazy import) --------------------------------------


_PROM_OK = False
try:
    from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST  # type: ignore
    _PROM_OK = True
except ImportError:
    Counter = None  # type: ignore
    Histogram = None  # type: ignore


_METRICS: dict[str, Any] = {}


def _metric(name: str, fn):
    """Create-once metric registry. Calling .labels() repeatedly is the prom-client way."""
    if not _PROM_OK:
        return None
    if name not in _METRICS:
        _METRICS[name] = fn()
    return _METRICS[name]


def _prom_init():
    if not _PROM_OK:
        return
    _metric("requests_total",
            lambda: Counter("chitti_requests_total", "Requests per Chitti", ["chitti"]))
    _metric("responses_total",
            lambda: Counter("chitti_responses_total", "Responses per Chitti", ["chitti"]))
    _metric("rail_total",
            lambda: Counter("chitti_rail_total", "Rail outcomes per Chitti",
                            ["chitti", "rail", "action"]))
    _metric("latency_ms",
            lambda: Histogram("chitti_latency_ms", "Model latency per Chitti",
                              ["chitti"],
                              buckets=(50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000)))
    _metric("tool_total",
            lambda: Counter("chitti_tool_total", "Tool calls per Chitti",
                            ["chitti", "tool", "phase"]))


# ---------- OpenTelemetry (lazy + optional) -------------------------------


_OTEL_TRACER = None
_OTEL_OK = False


def _otel_init(service_name: str) -> None:
    """Initialise OTel ONLY if OTEL_EXPORTER_OTLP_ENDPOINT is set."""
    global _OTEL_TRACER, _OTEL_OK
    if not os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT"):
        return
    try:
        from opentelemetry import trace  # type: ignore
        from opentelemetry.sdk.resources import Resource  # type: ignore
        from opentelemetry.sdk.trace import TracerProvider  # type: ignore
        from opentelemetry.sdk.trace.export import BatchSpanProcessor  # type: ignore
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter  # type: ignore

        resource = Resource.create({"service.name": service_name})
        provider = TracerProvider(resource=resource)
        provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
        trace.set_tracer_provider(provider)
        _OTEL_TRACER = trace.get_tracer(service_name)
        _OTEL_OK = True
        log.info("OpenTelemetry initialised for %s", service_name)
    except ImportError:
        log.info("OpenTelemetry SDK not installed; traces disabled")
    except Exception as e:  # noqa: BLE001
        log.warning("OpenTelemetry init failed: %s", e)


# ---------- Public API ----------------------------------------------------


@dataclass
class Observability:
    """Owns the audit-log DB session + metrics + traces for one Chitti.

    Usage:
        obs = Observability(chitti="chitti-medupi", engine=engine)
        obs.record_request("chitti-medupi", "abc12345", "what is crocin?", ctx={})

    `engine` is the SQLAlchemy engine the Chitti already created. We piggyback
    on it so audit rows live in the same Turso DB as the rest of that
    Chitti's data — one less DB to manage.
    """

    chitti: str
    engine: Any
    _session_factory: Any = field(init=False, default=None)
    _lock: threading.Lock = field(default_factory=threading.Lock, init=False)

    def __post_init__(self):
        _prom_init()
        _otel_init(self.chitti)
        # Auto-create the quality_audit table if missing.
        try:
            _AuditBase.metadata.create_all(bind=self.engine, tables=[QualityAudit.__table__])
        except Exception as e:  # noqa: BLE001
            log.warning("Failed to create quality_audit table: %s", e)
        self._session_factory = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    # ---- record API ----

    def record_request(self, chitti: str, request_id: str, user_text: str, ctx: dict) -> None:
        if _PROM_OK:
            _METRICS["requests_total"].labels(chitti=chitti).inc()
        self._write(
            request_id=request_id, chitti=chitti, kind="request", phase="before_model",
            payload={"user_text": _truncate(user_text, 4000)},
        )

    def record_response(self, chitti: str, request_id: str, user_text: str,
                        model_output: str, latency_ms: int, ctx: dict) -> None:
        if _PROM_OK:
            _METRICS["responses_total"].labels(chitti=chitti).inc()
            _METRICS["latency_ms"].labels(chitti=chitti).observe(latency_ms)
        self._write(
            request_id=request_id, chitti=chitti, kind="response", phase="after_model",
            payload={
                "user_text": _truncate(user_text, 2000),
                "model_output": _truncate(model_output, 4000),
                "latency_ms": latency_ms,
            },
        )

    def record_rail(self, chitti: str, request_id: str, *, rail: str, action: str,
                    reason: str, payload: dict | None, phase: str) -> None:
        if _PROM_OK:
            _METRICS["rail_total"].labels(chitti=chitti, rail=rail, action=action).inc()
        self._write(
            request_id=request_id, chitti=chitti, kind="rail", phase=phase,
            rail=rail, action=action, reason=reason, payload=payload or {},
        )

    def record_tool_call(self, chitti: str, request_id: str, tool_name: str,
                         args: dict, *, phase: str, result_summary: str | None = None) -> None:
        if _PROM_OK:
            _METRICS["tool_total"].labels(chitti=chitti, tool=tool_name, phase=phase).inc()
        self._write(
            request_id=request_id, chitti=chitti, kind="tool", phase=phase,
            reason=tool_name,
            payload={"args": _shallow_clean(args), "result_summary": result_summary},
        )

    # ---- private ----

    def _write(self, **kwargs) -> None:
        """Insert a quality_audit row. Best-effort — never raises."""
        try:
            payload = kwargs.pop("payload", None)
            row = QualityAudit(
                payload_json=json.dumps(payload, default=str, ensure_ascii=False)[:8000] if payload else None,
                **kwargs,
            )
            with self._lock:
                with self._session_factory() as sess:
                    sess.add(row)
                    sess.commit()
        except Exception as e:  # noqa: BLE001
            log.warning("audit write failed: %s", e)


# ---------- Helpers -------------------------------------------------------


def _truncate(s: str, n: int) -> str:
    if not s:
        return ""
    return s if len(s) <= n else (s[:n] + "…")


def _shallow_clean(d: Any) -> Any:
    """Avoid logging accidentally captured secrets in tool args."""
    if not isinstance(d, dict):
        return d
    out = {}
    for k, v in d.items():
        if isinstance(k, str) and any(s in k.lower() for s in ("token", "secret", "password", "api_key", "auth")):
            out[k] = f"<redacted {len(str(v)) if v else 0} chars>"
        else:
            out[k] = _truncate(str(v), 200) if not isinstance(v, (dict, list, int, float, bool, type(None))) else v
    return out


# ---------- Per-request timing middleware ---------------------------------


def install_request_timing(app, chitti_slug: str, observability: "Observability | None" = None) -> None:
    """Wire Flask before_request + after_request to time every endpoint.

    Adds:
      - `X-Chitti-Response-Time-Ms` response header on every response.
      - One `quality_audit` row per request (`kind="http"`) with method,
        path, status, elapsed_ms — best-effort, never breaks the request.
      - Prometheus histogram `chitti_http_latency_ms` if prometheus_client
        is installed (auto-no-op otherwise).

    One-line wire from each Chitti's main.py:

        install_request_timing(app, CHITTI_SLUG, observability=obs)

    Idempotent: safe to call multiple times — handlers are tagged so a
    second call replaces the previous registration cleanly.
    """
    try:
        from flask import g, request  # type: ignore
    except ImportError:
        log.info("install_request_timing skipped: Flask not available")
        return

    if _PROM_OK:
        _metric(
            "http_latency_ms",
            lambda: Histogram(
                "chitti_http_latency_ms",
                "HTTP request latency per Chitti",
                ["chitti", "method", "endpoint", "status"],
                buckets=(10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000),
            ),
        )

    def _start_timer():
        g._chitti_t0 = time.perf_counter()
        g._chitti_request_id = request.headers.get("X-Request-Id") or uuid.uuid4().hex[:12]

    def _record(response):
        t0 = getattr(g, "_chitti_t0", None)
        if t0 is None:
            return response
        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        response.headers["X-Chitti-Response-Time-Ms"] = str(elapsed_ms)
        request_id = getattr(g, "_chitti_request_id", uuid.uuid4().hex[:12])
        response.headers["X-Chitti-Request-Id"] = request_id

        status_str = str(response.status_code)
        endpoint = request.endpoint or "unknown"
        if _PROM_OK and "http_latency_ms" in _METRICS:
            try:
                _METRICS["http_latency_ms"].labels(
                    chitti=chitti_slug,
                    method=request.method,
                    endpoint=endpoint,
                    status=status_str,
                ).observe(elapsed_ms)
            except Exception:  # noqa: BLE001
                pass

        if observability is not None:
            try:
                observability._write(
                    request_id=request_id,
                    chitti=chitti_slug,
                    kind="http",
                    phase="response",
                    reason=endpoint,
                    payload={
                        "method": request.method,
                        "path": request.path,
                        "status": response.status_code,
                        "elapsed_ms": elapsed_ms,
                    },
                )
            except Exception as e:  # noqa: BLE001
                log.debug("request-timing audit write skipped: %s", e)
        return response

    app.before_request(_start_timer)
    app.after_request(_record)


# ---------- Optional Prometheus Flask blueprint ---------------------------


def make_metrics_blueprint():
    """Return a Flask blueprint exposing /metrics. Mount via app.register_blueprint."""
    if not _PROM_OK:
        return None
    try:
        from flask import Blueprint, Response  # type: ignore
    except ImportError:
        return None
    bp = Blueprint("chitti_metrics", __name__)

    @bp.get("/metrics")
    def metrics():
        return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

    return bp


# ---------- IP hashing helper for /api/feedback ---------------------------


def hash_ip(ip: str | None, salt: str | None = None) -> str:
    """Stable, salted hash of an IP for rate-limit / abuse tracking only.

    Salt comes from FEEDBACK_IP_SALT env var. Rotating the salt resets
    history — by design.
    """
    salt = salt or os.environ.get("FEEDBACK_IP_SALT", "sahay-default-salt")
    if not ip:
        return "anon"
    return hashlib.sha256((salt + "|" + ip).encode("utf-8")).hexdigest()[:24]
