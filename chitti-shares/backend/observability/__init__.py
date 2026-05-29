"""
🎖️ World Class Chitti Observability — Commando Discipline. Zero Excuses.

> This Chitti is someone's lifeline. Build it like your family depends on it.
> Because someone's family does.

chitti-shares/backend/observability/
====================================

Real-time AI observability for Chitti translation/localization. Transforms the
on-demand audit (tools/audit_per_chitti.mjs) into always-on telemetry with a
live footer badge on every Chitti page.

Sire-spec 2026-05-29. See CHITTI_OBSERVABILITY_SPEC.md at repo root.

Layers:
  - models.py     — SQLAlchemy: SlowOp, Alert, Audit, RetrainQueueItem
  - routes.py     — FastAPI router (slow_op, alert, heartbeat, lookup,
                    dashboard, feedback_summary)
  - jobs.py       — APScheduler weekly cron (Fri 18:00 IST aggregation)
  - dashboard.py  — Sire-only HTML at /chitti/observability
"""
from observability.routes import router  # re-exported for main.py
from observability.dashboard import router as dashboard_router

__all__ = ["router", "dashboard_router"]
