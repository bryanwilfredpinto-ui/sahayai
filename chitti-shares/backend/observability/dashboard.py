"""
🎖️ World Class Chitti Observability — Commando Discipline. Zero Excuses.

observability/dashboard.py
==========================
Sire-only HTML dashboard at `/chitti/observability`. Mirrors the live badge
data with a deeper view: recent audits, top slow operations, alert timeline,
retrain queue.

Gated by ADMIN_MOBILE — sent as a `?mobile=` query string OR `X-Admin-Mobile`
header. Matches the existing /api/admin/* pattern in chitti-shares.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from observability.models import Alert, AuditSession, RetrainQueueItem, SlowOp

router = APIRouter(tags=["observability-dashboard"])


def _admin_gate(request: Request) -> None:
    mobile = (request.query_params.get("mobile") or
              request.headers.get("X-Admin-Mobile") or "").strip()
    expected = (getattr(settings, "ADMIN_MOBILE", "") or "").strip()
    if not expected:
        raise HTTPException(503, "ADMIN_MOBILE not configured")
    if mobile != expected:
        raise HTTPException(403, "Sire-only")


@router.get("/chitti/observability", response_class=HTMLResponse)
def sire_dashboard(request: Request, db: Session = Depends(get_db)):
    _admin_gate(request)

    now = datetime.utcnow()
    one_hour_ago  = now - timedelta(hours=1)
    one_day_ago   = now - timedelta(days=1)
    seven_days_ago = now - timedelta(days=7)

    # Active audits (last hour)
    active_audits = (db.query(AuditSession)
                     .filter(AuditSession.last_seen_at >= one_hour_ago)
                     .order_by(desc(AuditSession.last_seen_at))
                     .limit(20).all())

    # Top 20 slow ops in last 24h
    slow_ops = (db.query(SlowOp)
                .filter(SlowOp.ts >= one_day_ago)
                .order_by(desc(SlowOp.elapsed_ms))
                .limit(20).all())

    # Last 20 alerts
    alerts = (db.query(Alert)
              .filter(Alert.ts >= one_day_ago)
              .order_by(desc(Alert.ts))
              .limit(20).all())

    # Retrain queue (pending)
    retrain_queue = (db.query(RetrainQueueItem)
                     .filter(RetrainQueueItem.status == "pending")
                     .order_by(desc(RetrainQueueItem.created_at))
                     .limit(20).all())

    # Stats
    total_audits_24h    = db.query(func.count(AuditSession.audit_id)).filter(
        AuditSession.last_seen_at >= one_day_ago).scalar() or 0
    total_slow_ops_24h  = db.query(func.count(SlowOp.id)).filter(
        SlowOp.ts >= one_day_ago).scalar() or 0
    total_alerts_24h    = db.query(func.count(Alert.id)).filter(
        Alert.ts >= one_day_ago).scalar() or 0
    total_alerts_7d     = db.query(func.count(Alert.id)).filter(
        Alert.ts >= seven_days_ago).scalar() or 0

    # Render — inline HTML to keep it portable (no template engine setup)
    rows_audits = "".join(
        f"<tr><td><code>{a.audit_id}</code></td>"
        f"<td>{a.last_seen_at}</td>"
        f"<td>{a.total_cards}</td>"
        f"<td>{a.total_translations}</td>"
        f"<td>{a.total_alerts}</td>"
        f"<td>{a.status}</td></tr>"
        for a in active_audits
    )
    rows_slow = "".join(
        f"<tr><td>{s.ts}</td><td><code>{s.audit_id}</code></td>"
        f"<td>{s.page or '—'}</td><td>{s.box_id or '—'}</td>"
        f"<td><b style='color:#CC0000'>{s.elapsed_ms} ms</b></td>"
        f"<td>{s.target_lang or '—'}</td><td>{s.kind or '—'}</td></tr>"
        for s in slow_ops
    )
    rows_alerts = "".join(
        f"<tr><td>{a.ts}</td><td><code>{a.audit_id}</code></td>"
        f"<td>{a.page or '—'}</td><td>{a.check_name}</td>"
        f"<td><b style='color:{'#CC0000' if a.severity=='failed' else '#FF9933'}'>{a.severity}</b></td>"
        f"<td>{a.observed_value or '—'}</td><td>{a.threshold or '—'}</td></tr>"
        for a in alerts
    )
    rows_retrain = "".join(
        f"<tr><td>{r.created_at}</td><td>{r.page or '—'}</td>"
        f"<td>{r.box_id or '—'}</td><td>{r.target_lang or '—'}</td>"
        f"<td>{r.thumbs_down_count}</td><td>{r.thumbs_up_count}</td>"
        f"<td>{r.status}</td></tr>"
        for r in retrain_queue
    )

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>🎖️ Chitti Observability — Sire dashboard</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{{font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:0;background:#0E2344;color:#fff}}
  header{{background:linear-gradient(135deg,#FF9933 0%,#138808 100%);padding:18px 24px;color:#fff}}
  header h1{{margin:0;font-size:22px;font-weight:900}}
  header .sub{{font-size:12px;opacity:.92;margin-top:4px}}
  main{{padding:24px;max-width:1280px;margin:0 auto}}
  .stat-row{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px}}
  .stat{{background:#1a3a6e;border:1px solid #2a5a9e;border-radius:10px;padding:14px}}
  .stat .v{{font-size:24px;font-weight:900;color:#FFD700}}
  .stat .l{{font-size:11px;color:#9bb5d6;text-transform:uppercase;letter-spacing:.06em;margin-top:4px}}
  section{{background:#13294f;border:1px solid #2a5a9e;border-radius:10px;padding:18px;margin-bottom:18px}}
  section h2{{margin:0 0 12px;font-size:16px;color:#FFD700}}
  table{{width:100%;border-collapse:collapse;font-size:12px}}
  th,td{{padding:8px 10px;text-align:left;border-bottom:1px solid #2a5a9e;color:#fff}}
  th{{background:#0E2344;color:#9bb5d6;font-size:11px;text-transform:uppercase;letter-spacing:.06em}}
  code{{font-family:'JetBrains Mono',monospace;font-size:11px;background:#0E2344;padding:2px 6px;border-radius:4px;color:#FFD700}}
  .empty{{padding:24px;text-align:center;color:#9bb5d6;font-style:italic}}
  footer{{padding:24px;text-align:center;font-size:11px;color:#9bb5d6}}
</style>
</head>
<body>
<header>
  <h1>🎖️ Chitti Observability — Sire's dashboard</h1>
  <div class="sub">World Class Chitti Observability — Commando Discipline. Zero Excuses. · Auto-refreshes every 30 s</div>
</header>
<main>
  <div class="stat-row">
    <div class="stat"><div class="v">{total_audits_24h}</div><div class="l">Audits · 24 h</div></div>
    <div class="stat"><div class="v">{total_slow_ops_24h}</div><div class="l">Slow ops · 24 h</div></div>
    <div class="stat"><div class="v" style="color:{'#CC0000' if total_alerts_24h > 0 else '#138808'}">{total_alerts_24h}</div><div class="l">Alerts · 24 h</div></div>
    <div class="stat"><div class="v">{total_alerts_7d}</div><div class="l">Alerts · 7 d</div></div>
    <div class="stat"><div class="v">{len(retrain_queue)}</div><div class="l">Retrain pending</div></div>
  </div>

  <section>
    <h2>🟢 Active audits (last hour)</h2>
    <table><thead><tr><th>Audit ID</th><th>Last seen</th><th>Cards</th><th>Translations</th><th>Alerts</th><th>Status</th></tr></thead>
    <tbody>{rows_audits or '<tr><td class="empty" colspan="6">No active audits in the last hour</td></tr>'}</tbody>
    </table>
  </section>

  <section>
    <h2>🐢 Top slow operations (24 h)</h2>
    <table><thead><tr><th>Timestamp</th><th>Audit ID</th><th>Page</th><th>Box</th><th>Elapsed</th><th>Lang</th><th>Kind</th></tr></thead>
    <tbody>{rows_slow or '<tr><td class="empty" colspan="7">No slow operations in the last 24 hours</td></tr>'}</tbody>
    </table>
  </section>

  <section>
    <h2>⚠️ Verification Agent alerts (24 h)</h2>
    <table><thead><tr><th>Timestamp</th><th>Audit ID</th><th>Page</th><th>Check</th><th>Severity</th><th>Observed</th><th>Threshold</th></tr></thead>
    <tbody>{rows_alerts or '<tr><td class="empty" colspan="7">No alerts — all checks passing</td></tr>'}</tbody>
    </table>
  </section>

  <section>
    <h2>🎓 Retrain queue (pending)</h2>
    <table><thead><tr><th>Created</th><th>Page</th><th>Box</th><th>Lang</th><th>👎</th><th>👍</th><th>Status</th></tr></thead>
    <tbody>{rows_retrain or '<tr><td class="empty" colspan="7">No items pending retrain</td></tr>'}</tbody>
    </table>
  </section>
</main>
<footer>World Class Chitti CTO — Commando Discipline. Zero Excuses.</footer>
<script>setTimeout(function(){{ location.reload(); }}, 30000);</script>
</body>
</html>"""
