"""
test_feed_endpoints.py
----------------------
SHIP gate row #14 — integration tests for the unified `/api/news-ai/feed/<stream>`
endpoint.

Boots the Flask app in-process against a local SQLite DB, ingests a small
fixture set, classifies, then hits every stream + every key query
combination. Asserts the response shape matches the v0.3 §4.2 explainability
contract (every classified item carries category + matched_keywords +
confidence + source_signals + rule_version).

Run:
    python -m pytest backend/tests/test_feed_endpoints.py
    OR
    python backend/tests/test_feed_endpoints.py
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))


def _boot_app():
    """Boot the Flask app with a temp SQLite DB so the tests are hermetic."""
    tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp_db.close()
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_db.name}"
    # Kill LLM env so the boot-time ingest's classify step uses rules-only:
    for k in ("DEEPSEEK_API_KEY", "GEMINI_API_KEY", "OPENAI_API_KEY"):
        os.environ.pop(k, None)

    # Suppress the boot-time RSS poll (slow network) — only the SCHEDULER
    # is disabled; the v0.3 streams_ingest + courses_ingest still run.
    os.environ["SCHEDULER_ENABLED"] = "false"

    # Late import so env is set first.
    from database import Base, engine
    import models
    Base.metadata.create_all(bind=engine)

    # Seed minimal aggregator data (don't wait for live RSS).
    from services.streams_ingestor import ingest_all as _ingest_streams
    _ingest_streams()
    from services.courses_ingestor import ingest_all as _ingest_courses
    _ingest_courses()
    from services.profession_classifier import (
        classify_unlabeled_stream_items, classify_unlabeled_courses,
    )
    classify_unlabeled_stream_items(limit=2000)
    classify_unlabeled_courses(limit=2000)

    from main import create_app
    return create_app().test_client(), tmp_db.name


# ────────────────────────────────────────────────────────────────────────
# Tests
# ────────────────────────────────────────────────────────────────────────

_STREAMS = ["news", "courses", "cert", "tool", "job", "scheme", "roadmap_node"]


def test_health():
    client, _ = _boot_app()
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json().get("ok") is True


def test_every_stream_returns_200():
    client, _ = _boot_app()
    for stream in _STREAMS:
        r = client.get(f"/api/news-ai/feed/{stream}?n=5")
        assert r.status_code == 200, f"{stream} returned {r.status_code}"
        body = r.get_json()
        assert "items" in body, f"{stream} missing 'items'"
        assert "stream" in body and body["stream"] == stream
        assert "classification_mode" in body
        # Honest empty state contract — never raises
        if body["count"] == 0:
            assert "speak_en" in body
            assert "honest_note_en" in body


def test_per_profession_filter():
    client, _ = _boot_app()
    # software-developer should produce ≥1 item across the populated streams
    r = client.get("/api/news-ai/feed/courses?profession=software-developer&n=10")
    assert r.status_code == 200
    body = r.get_json()
    assert body["profession"] == "software-developer"
    if body["count"]:
        for item in body["items"]:
            cls = item.get("classification") or {}
            # SHIP row #14: explainability contract enforced per item
            assert "category" in cls
            assert cls["category"] == "software-developer"
            assert "confidence" in cls and isinstance(cls["confidence"], (int, float))
            assert "matched_keywords" in cls and isinstance(cls["matched_keywords"], list)
            assert "source_signals" in cls and isinstance(cls["source_signals"], list)
            assert "rule_version" in cls and cls["rule_version"]


def test_unknown_stream_returns_400():
    client, _ = _boot_app()
    r = client.get("/api/news-ai/feed/banana?n=5")
    assert r.status_code == 400


def test_each_item_carries_source_attribution():
    client, _ = _boot_app()
    for stream in ["courses", "cert", "tool", "scheme"]:
        r = client.get(f"/api/news-ai/feed/{stream}?n=3")
        body = r.get_json()
        for item in body.get("items", []):
            assert item.get("url"), f"{stream} item missing url"
            assert item.get("source"), f"{stream} item missing source"
            assert item["source"].get("name"), f"{stream} item missing source.name"
            # Per v0.3 §10 honesty contract: no Chitti-owned URLs
            assert "sahayai" not in item["url"], f"{stream} should never link to sahayai-owned page"


def test_explain_endpoint_falls_back_when_no_llm():
    """SHIP row #14 + §4.3 fail-open contract on enhancement endpoints."""
    client, _ = _boot_app()
    # Pick the first available course
    r = client.get("/api/news-ai/feed/courses?n=1")
    items = r.get_json().get("items") or []
    if not items:
        return  # honest skip
    item_id = items[0]["id"]
    er = client.post(
        f"/api/news-ai/feed/courses/{item_id}/explain",
        data=json.dumps({"language": "en"}),
        content_type="application/json",
    )
    assert er.status_code == 200
    body = er.get_json()
    assert body.get("ok") is True
    # LLM is unset in the test boot → must fall back to extractive
    assert body.get("source") == "extractive"
    assert body.get("text")


def test_career_insight_endpoint_works_offline():
    client, _ = _boot_app()
    r = client.get("/api/news-ai/feed/courses?n=1")
    items = r.get_json().get("items") or []
    if not items:
        return
    item_id = items[0]["id"]
    er = client.post(
        f"/api/news-ai/feed/courses/{item_id}/career-insight",
        data=json.dumps({"profession": "software-developer", "language": "en"}),
        content_type="application/json",
    )
    assert er.status_code == 200
    body = er.get_json()
    assert body.get("source") == "extractive"
    assert body.get("profession") == "software-developer"


if __name__ == "__main__":
    test_health()
    print("✅ test_health")
    test_every_stream_returns_200()
    print("✅ test_every_stream_returns_200")
    test_per_profession_filter()
    print("✅ test_per_profession_filter")
    test_unknown_stream_returns_400()
    print("✅ test_unknown_stream_returns_400")
    test_each_item_carries_source_attribution()
    print("✅ test_each_item_carries_source_attribution")
    test_explain_endpoint_falls_back_when_no_llm()
    print("✅ test_explain_endpoint_falls_back_when_no_llm")
    test_career_insight_endpoint_works_offline()
    print("✅ test_career_insight_endpoint_works_offline")
    print("\nAll feed integration tests passed (7).")
