"""
services/streams_ingestor.py
----------------------------
Generic ingestor for the 5 non-courses/non-news streams
(certifications / tools / jobs / government-schemes / roadmap-nodes) per
CHITTI_NEWS_AI_MASTER_SPEC v0.3 §3 + §7.

Reads `data/streams_sources.json`, ingests each source via its declared
transport (json / rss / static_manifest), and persists into the
`aggregated_items` table with `kind=<stream>`.

Same trust contract as the courses ingestor:
  - Real free public sources, attributed.
  - Honest empty state on source failure (records last_error, never invents).
  - Idempotent (unique constraint on kind + source_slug + external_id).
  - `is_free` derived from source-level `free` flag; `cost_label` verbatim.
"""
from __future__ import annotations

import json
import logging
import os
import time
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import httpx
from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models.aggregated_items import AggregatedItem

log = logging.getLogger("streams_ingestor")

_DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "streams_sources.json"
_HTTP_TIMEOUT = float(os.environ.get("STREAMS_INGEST_TIMEOUT_SEC", "20"))
_USER_AGENT = "Chitti-News-AI/0.3 (+https://sahayai.in)"


def load_streams() -> dict:
    if not _DATA_FILE.exists():
        raise FileNotFoundError(f"streams_sources.json not found at {_DATA_FILE}")
    with _DATA_FILE.open(encoding="utf-8") as f:
        payload = json.load(f)
    return payload.get("streams", {})


# ────────────────────────────────────────────────────────────────────────
# Transport handlers
# ────────────────────────────────────────────────────────────────────────

def _http_get(url: str) -> tuple[Optional[str], Optional[str]]:
    try:
        with httpx.Client(timeout=_HTTP_TIMEOUT, follow_redirects=True,
                          headers={"User-Agent": _USER_AGENT}) as client:
            resp = client.get(url)
            if resp.status_code >= 400:
                return None, f"HTTP {resp.status_code}"
            return resp.text, None
    except Exception as e:  # noqa: BLE001
        return None, f"transport: {type(e).__name__}: {e}"


def _ingest_json(source: dict) -> tuple[list[dict], Optional[str]]:
    body, err = _http_get(source["url"])
    if err or body is None:
        return [], err
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as e:
        return [], f"json_decode: {e}"
    items_path = source.get("items_path") or ""
    cur: Any = payload
    if items_path:
        for part in items_path.split("."):
            if isinstance(cur, dict):
                cur = cur.get(part)
            else:
                cur = None
                break
    if not isinstance(cur, list):
        return [], f"items_path={items_path!r} did not resolve to a list"
    fields = source.get("fields", {})
    out: list[dict] = []
    for raw in cur:
        if not isinstance(raw, dict):
            continue
        url = raw.get(fields.get("url", "url"))
        title = raw.get(fields.get("title", "title"))
        if not url or not title:
            continue
        ext = str(raw.get("uid") or raw.get("id") or url)[:200]
        out.append({
            "external_id": ext,
            "title": str(title)[:1000],
            "url": str(url)[:900],
            "summary": raw.get(fields.get("summary", "summary")),
            "topics": ",".join(raw.get("topics", [])) if isinstance(raw.get("topics"), list) else raw.get("topics"),
        })
    return out, None


def _ingest_rss(source: dict) -> tuple[list[dict], Optional[str]]:
    body, err = _http_get(source["url"])
    if err or body is None:
        return [], err
    try:
        root = ET.fromstring(body)
    except ET.ParseError as e:
        return [], f"xml_parse: {e}"
    items = root.findall(".//item") or root.findall(".//{http://www.w3.org/2005/Atom}entry")
    out: list[dict] = []
    for it in items:
        title = (it.findtext("title") or it.findtext("{http://www.w3.org/2005/Atom}title") or "").strip()
        link = (it.findtext("link") or "").strip()
        if not link:
            le = it.find("{http://www.w3.org/2005/Atom}link")
            if le is not None:
                link = (le.get("href") or "").strip()
        if not title or not link:
            continue
        summary = (it.findtext("description") or it.findtext("{http://www.w3.org/2005/Atom}summary") or "").strip()
        ext = (it.findtext("guid") or link)[:200]
        out.append({
            "external_id": ext,
            "title": title[:1000],
            "url": link[:900],
            "summary": summary[:4000] or None,
            "topics": None,
        })
    return out, None


def _ingest_static(source: dict) -> tuple[list[dict], Optional[str]]:
    out: list[dict] = []
    for raw in source.get("manifest") or []:
        topics_val = raw.get("topics")
        if isinstance(topics_val, list):
            topics_str = ",".join(topics_val)
        else:
            topics_str = topics_val
        out.append({
            "external_id": str(raw["id"])[:200],
            "title": raw["title"][:1000],
            "url": raw["url"][:900],
            "summary": raw.get("summary"),
            "topics": topics_str,
            "duration_minutes": raw.get("duration_min"),
            "level": raw.get("level"),
            "cost_label": raw.get("cost_label"),
            "employer": raw.get("employer"),
            "location": raw.get("location"),
        })
    return out, None


_INGEST_BY_TYPE = {
    "json": _ingest_json,
    "rss": _ingest_rss,
    "static_manifest": _ingest_static,
}


# ────────────────────────────────────────────────────────────────────────
# Persist
# ────────────────────────────────────────────────────────────────────────

def _persist(kind: str, source: dict, items: list[dict]) -> int:
    if not items:
        return 0
    inserted = 0
    with SessionLocal() as db:
        for it in items:
            row = AggregatedItem(
                kind=kind,
                source_slug=source["slug"],
                source_name=source["name"],
                source_domain=source["official_domain"],
                external_id=it["external_id"],
                title=it["title"],
                url=it["url"],
                summary=it.get("summary"),
                topics=it.get("topics"),
                duration_minutes=it.get("duration_minutes"),
                level=it.get("level"),
                employer=it.get("employer"),
                location=it.get("location"),
                is_free=1 if source.get("free", True) else 0,
                cost_label=it.get("cost_label") or source.get("free_note"),
            )
            db.add(row)
            try:
                db.commit()
                inserted += 1
            except IntegrityError:
                db.rollback()
            except Exception as e:  # noqa: BLE001
                db.rollback()
                log.warning("persist failed kind=%s slug=%s/%s: %s",
                            kind, source["slug"], it["external_id"], e)
    return inserted


def ingest_all() -> dict:
    """Run every active source across every stream. Returns a structured report."""
    streams = load_streams()
    report = {
        "started_at": datetime.utcnow().isoformat() + "Z",
        "per_stream": {},
        "total_landed": 0,
        "errors": [],
    }
    for kind, stream_spec in streams.items():
        if kind.startswith("_"):
            continue
        stream_report = {"per_source": [], "landed": 0}
        for source in stream_spec.get("sources", []):
            if not source.get("active", True):
                continue
            kind_handler = _INGEST_BY_TYPE.get(source.get("type"))
            slug = source["slug"]
            t0 = time.monotonic()
            if not kind_handler:
                stream_report["per_source"].append(
                    {"slug": slug, "type": source.get("type"), "fetched": 0,
                     "inserted": 0, "error": f"unknown type {source.get('type')}"})
                continue
            items, err = kind_handler(source)
            inserted = _persist(kind, source, items) if items else 0
            stream_report["per_source"].append({
                "slug": slug, "type": source["type"], "fetched": len(items),
                "inserted": inserted, "error": err,
                "elapsed_s": round(time.monotonic() - t0, 2),
            })
            stream_report["landed"] += inserted
            if err:
                report["errors"].append(f"{kind}:{slug}: {err}")
        report["per_stream"][kind] = stream_report
        report["total_landed"] += stream_report["landed"]
    report["finished_at"] = datetime.utcnow().isoformat() + "Z"
    return report
