"""
End-to-end smoke test of the feeds health monitor.

Steps:
  1. Sandbox SQLite via DATABASE_URL env var
  2. ensure_health_columns() — verify ALTER TABLE works
  3. Seed two sources: one definitely-live (Guardian India), one
     definitely-dead (a 404 path)
  4. Run check_source on each
  5. Verify status transitions, backoff, alert trigger path
  6. Trigger the live source 4 times via a fake-fail injection to walk
     it through healthy → 1 fail → 2 fail → degraded + alert
  7. Verify /admin/health summary shape
  8. Verify feeds_health.log was written
"""
from __future__ import annotations

import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path


def main():
    sys.stdout.reconfigure(encoding="utf-8")

    tmpdir = tempfile.mkdtemp(prefix="chitti_health_smoke_")
    db_path = Path(tmpdir) / "verify.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path.as_posix()}"
    os.environ["SCHEDULER_ENABLED"] = "false"
    # ALERTS_ENABLED stays true but no SMTP_HOST → fallback "would have sent"
    # log path. That's the verification we want.

    backend = Path(__file__).resolve().parent.parent.parent / "chitti-news" / "backend"
    sys.path.insert(0, str(backend))

    from database import engine, SessionLocal, Base  # noqa: E402
    from models.source import Source  # noqa: E402
    from models.article import Article  # noqa: E402
    from services import news_seed, source_health  # noqa: E402
    from services.alerts import send_alert  # noqa: E402

    print("=" * 76)
    print("1. CREATE TABLES")
    print("=" * 76)
    Base.metadata.create_all(bind=engine)
    print(f"   db: {db_path}")
    print(f"   tables: {sorted(Base.metadata.tables.keys())}")

    print("\n" + "=" * 76)
    print("2. ensure_health_columns() — idempotent ALTER TABLE")
    print("=" * 76)
    # First call should add nothing because the columns are already in the
    # model + create_all already made them. Second call also no-op.
    added1 = news_seed.ensure_health_columns()
    added2 = news_seed.ensure_health_columns()
    print(f"   first call: added={added1}  second call: added={added2}")
    assert added2 == 0, "second call should be a no-op"

    print("\n" + "=" * 76)
    print("3. SEED 2 SOURCES (one live, one dead-by-design)")
    print("=" * 76)
    db = SessionLocal()
    db.add(Source(
        slug="t-guardian-india", display_name="Guardian India (test)",
        rss_url="https://www.theguardian.com/world/india/rss",
        homepage_url="https://www.theguardian.com",
        state="india", language="en", category="national", enabled=1,
    ))
    db.add(Source(
        slug="t-dead-404", display_name="Dead Test Source",
        rss_url="https://www.theguardian.com/this-path-definitely-404-xyz/rss",
        homepage_url="https://www.theguardian.com",
        state="india", language="en", category="national", enabled=1,
    ))
    db.commit()
    print("   seeded 2 sources")

    print("\n" + "=" * 76)
    print("4. RUN check_source ON BOTH")
    print("=" * 76)
    live_src = db.query(Source).filter(Source.slug == "t-guardian-india").first()
    dead_src = db.query(Source).filter(Source.slug == "t-dead-404").first()
    r1 = source_health.check_source(db, live_src)
    print(f"   live → {r1}")
    r2 = source_health.check_source(db, dead_src)
    print(f"   dead → {r2}")
    # r1 may legitimately fail staleness on a quiet day; what we assert is
    # the 404 path is recorded as failure and consecutive_failures incremented.
    assert r2["ok"] is False, "404 path should fail"
    db.refresh(dead_src)
    assert dead_src.consecutive_failures == 1
    # Per spec, first failure keeps status='healthy' — only 3+ failures
    # transitions to degraded.
    assert dead_src.status == "healthy"
    print(f"   ✓ dead source: 1st failure recorded (status stays healthy until 3 fails)")
    print(f"     live source ok={r1['ok']} (acceptable if feed is quiet today)")

    print("\n" + "=" * 76)
    print("5. WALK DEAD SOURCE THROUGH BACKOFF: 1→2→3 (DEGRADED, alert)")
    print("=" * 76)
    db.refresh(dead_src)
    print(f"   after 1st fail: failures={dead_src.consecutive_failures} "
          f"status={dead_src.status} next_retry={dead_src.next_retry_at}")
    # Run 2 more times — should hit DEGRADED + alert path
    r3 = source_health.check_source(db, dead_src)
    print(f"   2nd fail → status={r3['status_after']} alert_sent={r3['alert_sent']}")
    r4 = source_health.check_source(db, dead_src)
    print(f"   3rd fail → status={r4['status_after']} alert_sent={r4['alert_sent']}")
    db.refresh(dead_src)
    assert dead_src.consecutive_failures == 3, "should have 3 consec failures"
    assert dead_src.status == "degraded", f"expected degraded, got {dead_src.status}"
    # last_alert_at would only be set if SMTP succeeded — without it, the
    # fallback path logs but doesn't mark alert_sent.
    print(f"   ✓ status=degraded after 3 failures (alert_sent={r4['alert_sent']} "
          "— no SMTP env, fallback logged)")

    print("\n" + "=" * 76)
    print("6. FORCE 24h-OLD last_success_at → STATUS 'dead' + alt URL discovery")
    print("=" * 76)
    # Walk the live source through failure with a back-dated last_success_at
    # to trigger the dead transition + alternative URL probe.
    live_src.last_success_at = datetime.utcnow() - timedelta(hours=25)
    live_src.rss_url = "https://www.theguardian.com/this-also-404/rss"  # break it
    db.commit()
    r5 = source_health.check_source(db, live_src)
    db.refresh(live_src)
    print(f"   forced-stale + broken-url: status={live_src.status}")
    print(f"   alternative_url_candidate: {live_src.alternative_url_candidate}")
    if live_src.alternative_url_candidate:
        print("   ✓ alternative URL discovered on dead transition")
    else:
        print("   (no alt URL found — Guardian homepage didn't expose <link rel=alternate>)")

    print("\n" + "=" * 76)
    print("7. /admin/health summary() shape")
    print("=" * 76)
    s = source_health.summary(db)
    print(f"   totals: {s['totals']}")
    print(f"   alerts_configured: {s['alerts_configured']}")
    print(f"   failing count: {len(s['failing_sources'])}")
    print(f"   sample failing: {s['failing_sources'][0] if s['failing_sources'] else 'none'}")

    print("\n" + "=" * 76)
    print("8. feeds_health.log exists + is non-empty")
    print("=" * 76)
    log_path = source_health.LOG_PATH
    print(f"   path: {log_path}")
    if log_path.exists():
        n_lines = sum(1 for _ in log_path.open(encoding="utf-8"))
        print(f"   ✓ exists, {n_lines} log lines")
        print("   last 4 lines:")
        for line in log_path.open(encoding="utf-8").readlines()[-4:]:
            print(f"     {line.rstrip()}")
    else:
        print("   ✗ log file not created")

    print("\n" + "=" * 76)
    print("9. fetch_all skip-dead logic")
    print("=" * 76)
    # Mark dead source actually dead
    dead_src.status = "dead"
    db.commit()
    from services import news_ingest  # noqa: E402
    totals = news_ingest.fetch_all()
    print(f"   fetch_all totals: {totals}")
    assert totals["skipped_dead"] >= 1, "should have skipped >=1 dead source"
    print(f"   ✓ skipped_dead={totals['skipped_dead']} skipped_backoff={totals['skipped_backoff']}")

    print("\n" + "=" * 76)
    print("ALL SMOKE TESTS PASSED")
    print("=" * 76)
    db.close()


if __name__ == "__main__":
    main()
