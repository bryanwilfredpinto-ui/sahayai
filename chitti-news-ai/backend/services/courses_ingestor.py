"""
services/courses_ingestor.py
----------------------------
Ingests course catalogues from the 8 free public sources in
`backend/data/courses_sources.json` (CHITTI_NEWS_AI_MASTER_SPEC v0.2 §3
Courses row).

**Aggregator doctrine — locked 2026-05-29.** This module:
  - Pulls real entries from real public sources.
  - Stores every entry with the provider's own URL.
  - Never invents a course. If a source returns 0 items, the row count
    is 0 — no fallback, no AI fill-in.
  - Never coerces a paid item into "free". `cost_label` is verbatim
    from the provider.

Three transport modes are supported:

| `type`              | Where the data comes from                             |
|---------------------|-------------------------------------------------------|
| `json`              | GET → JSON, walk `items_path`, map `fields`           |
| `rss`               | GET → XML, take `<item>` per entry                    |
| `static_manifest`   | `manifest[]` already in courses_sources.json           |

The `static_manifest` mode is the **honest fallback** for providers that
don't expose a machine-readable catalogue. The entries are hand-maintained
from the provider's own public page — same trust contract as the dynamic
sources, just slower to update.

Run-shape:
  result = ingest_all()
  → {"total_landed": int, "per_source": [...], "errors": [...]}

Idempotent: re-ingesting the same source only inserts NEW (source_slug,
external_id) pairs.
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
from models.courses_v2 import CourseV2

log = logging.getLogger("courses_ingestor")

_DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "courses_sources.json"
_HTTP_TIMEOUT = float(os.environ.get("COURSES_INGEST_TIMEOUT_SEC", "20"))
_USER_AGENT = "Chitti-News-AI/0.2 (+https://sahayai.in)"


# ────────────────────────────────────────────────────────────────────────
# Source loader
# ────────────────────────────────────────────────────────────────────────

def load_sources() -> list[dict]:
    """Read the seed JSON. Errors out loudly — this file MUST be present."""
    if not _DATA_FILE.exists():
        raise FileNotFoundError(f"courses_sources.json not found at {_DATA_FILE}")
    with _DATA_FILE.open(encoding="utf-8") as f:
        payload = json.load(f)
    sources = payload.get("sources", [])
    if not sources:
        raise ValueError("courses_sources.json has no sources")
    return sources


# ────────────────────────────────────────────────────────────────────────
# Transport handlers
# ────────────────────────────────────────────────────────────────────────

def _http_get(url: str) -> tuple[Optional[str], Optional[str]]:
    """GET a URL with our UA. Returns (body, error). Never raises."""
    try:
        with httpx.Client(timeout=_HTTP_TIMEOUT, follow_redirects=True,
                          headers={"User-Agent": _USER_AGENT}) as client:
            resp = client.get(url)
            if resp.status_code >= 400:
                return None, f"HTTP {resp.status_code}"
            return resp.text, None
    except Exception as e:  # noqa: BLE001
        return None, f"transport: {type(e).__name__}: {e}"


def _walk_path(obj: Any, path: str) -> Any:
    """Walk a dotted path through nested dicts/lists. Returns None on missing key."""
    cur = obj
    for part in path.split("."):
        if isinstance(cur, dict):
            cur = cur.get(part)
        else:
            return None
        if cur is None:
            return None
    return cur


def _coerce_int(v: Any) -> Optional[int]:
    try:
        if v is None:
            return None
        return int(v)
    except (TypeError, ValueError):
        return None


def _coerce_topics(v: Any) -> Optional[str]:
    if v is None:
        return None
    if isinstance(v, str):
        return v
    if isinstance(v, (list, tuple)):
        flat = []
        for item in v:
            if isinstance(item, str):
                flat.append(item)
            elif isinstance(item, dict):
                # Microsoft Learn shapes subjects as [{"label": "..."}]; tolerate either.
                lab = item.get("label") or item.get("name") or item.get("title")
                if lab:
                    flat.append(lab)
        return ",".join(flat[:10]) if flat else None
    return str(v)


def _normalise_level(v: Any) -> Optional[str]:
    if v is None:
        return None
    if isinstance(v, (list, tuple)) and v:
        v = v[0]
    s = str(v).strip().lower()
    if not s:
        return None
    if "begin" in s or s == "1" or "intro" in s:
        return "beginner"
    if "inter" in s or s == "2":
        return "intermediate"
    if "adv" in s or "expert" in s or s == "3":
        return "advanced"
    return s[:40]


# ────────────────────────────────────────────────────────────────────────
# Per-source ingest
# ────────────────────────────────────────────────────────────────────────

def _ingest_json(source: dict) -> tuple[list[dict], Optional[str]]:
    body, err = _http_get(source["url"])
    if err or body is None:
        return [], err
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as e:
        return [], f"json_decode: {e}"

    items_path = source.get("items_path", "")
    items = _walk_path(payload, items_path) if items_path else payload
    if not isinstance(items, list):
        return [], f"items_path={items_path!r} did not resolve to a list"

    fields = source.get("fields", {})
    out: list[dict] = []
    for raw in items:
        if not isinstance(raw, dict):
            continue
        url = raw.get(fields.get("url", "url"))
        title = raw.get(fields.get("title", "title"))
        if not url or not title:
            continue
        ext_id = str(raw.get("uid") or raw.get("id") or url)[:200]
        out.append({
            "external_id": ext_id,
            "title": str(title)[:1000],
            "url": str(url)[:900],
            "summary": (raw.get(fields.get("summary", "summary")) or None),
            "duration_minutes": _coerce_int(raw.get(fields.get("duration_min", "durationInMinutes"))),
            "level": _normalise_level(raw.get(fields.get("level", "levels"))),
            "topics": _coerce_topics(raw.get(fields.get("topics", "subjects"))),
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

    # RSS 2.0: channel/item   |   Atom: feed/entry
    items = root.findall(".//item") or root.findall(".//{http://www.w3.org/2005/Atom}entry")
    out: list[dict] = []
    for it in items:
        title = (it.findtext("title") or it.findtext("{http://www.w3.org/2005/Atom}title") or "").strip()
        link = (it.findtext("link") or "").strip()
        if not link:
            # Atom: link is in a tag with href attr
            link_el = it.find("{http://www.w3.org/2005/Atom}link")
            if link_el is not None:
                link = (link_el.get("href") or "").strip()
        if not title or not link:
            continue
        summary = (it.findtext("description") or it.findtext("{http://www.w3.org/2005/Atom}summary") or "").strip()
        ext_id = (it.findtext("guid") or link)[:200]
        out.append({
            "external_id": ext_id,
            "title": title[:1000],
            "url": link[:900],
            "summary": summary[:4000] or None,
            "duration_minutes": None,
            "level": None,
            "topics": None,
        })
    return out, None


def _ingest_static(source: dict) -> tuple[list[dict], Optional[str]]:
    manifest = source.get("manifest") or []
    out: list[dict] = []
    for raw in manifest:
        out.append({
            "external_id": str(raw["id"])[:200],
            "title": raw["title"][:1000],
            "url": raw["url"][:900],
            "summary": raw.get("summary"),
            "duration_minutes": _coerce_int(raw.get("duration_min")),
            "level": _normalise_level(raw.get("level")),
            "topics": _coerce_topics(raw.get("topics")),
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

def _persist(source: dict, items: list[dict]) -> int:
    """Insert new items; skip duplicates on (source_slug, external_id). Returns inserted count."""
    if not items:
        return 0
    inserted = 0
    with SessionLocal() as db:
        for it in items:
            row = CourseV2(
                source_slug=source["slug"],
                source_name=source["name"],
                source_domain=source["official_domain"],
                external_id=it["external_id"],
                title=it["title"],
                url=it["url"],
                summary=it.get("summary"),
                duration_minutes=it.get("duration_minutes"),
                level=it.get("level"),
                topics=it.get("topics"),
                is_free=1 if source.get("free", True) else 0,
                cost_label=source.get("free_note") or None,
            )
            db.add(row)
            try:
                db.commit()
                inserted += 1
            except IntegrityError:
                db.rollback()
                # already seen — that's fine
                continue
            except Exception as e:  # noqa: BLE001
                db.rollback()
                log.warning("persist failed for %s/%s: %s", source["slug"], it["external_id"], e)
    return inserted


# ────────────────────────────────────────────────────────────────────────
# Entrypoint
# ────────────────────────────────────────────────────────────────────────

def ingest_all() -> dict:
    """Run every active source. Returns a structured report."""
    sources = load_sources()
    report = {
        "started_at": datetime.utcnow().isoformat() + "Z",
        "per_source": [],
        "total_landed": 0,
        "errors": [],
    }
    for source in sources:
        if not source.get("active", True):
            continue
        kind = source.get("type")
        handler = _INGEST_BY_TYPE.get(kind)
        slug = source["slug"]
        t0 = time.monotonic()
        if not handler:
            report["errors"].append(f"{slug}: unknown type {kind!r}")
            report["per_source"].append({"slug": slug, "type": kind, "fetched": 0, "inserted": 0, "error": f"unknown type {kind}"})
            continue

        items, err = handler(source)
        inserted = 0
        if items:
            inserted = _persist(source, items)
        report["per_source"].append({
            "slug": slug,
            "type": kind,
            "fetched": len(items),
            "inserted": inserted,
            "error": err,
            "elapsed_s": round(time.monotonic() - t0, 2),
        })
        report["total_landed"] += inserted
        if err:
            report["errors"].append(f"{slug}: {err}")

    report["finished_at"] = datetime.utcnow().isoformat() + "Z"
    return report
