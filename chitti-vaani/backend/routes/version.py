"""
routes/version.py
-----------------
Flask Blueprint: /api/vaani/version — one-shot probe that tells you
EXACTLY which build of chitti-vaani-api is running.

Why this exists
~~~~~~~~~~~~~~~
Bryan 2026-05-22: Railway sometimes runs an older container even after
new commits push. Without a version probe, every diagnostic is
guesswork ("did the deploy land or not?"). With this endpoint, one
curl gives the answer.

Returns
~~~~~~~
  {
    "ok": true,
    "git_sha": "ae0c0f4...",            // RAILWAY_GIT_COMMIT_SHA env var (set by Railway at build)
    "git_short": "ae0c0f4",
    "git_branch": "main",
    "build_ts": "2026-05-22T13:42:00Z", // server boot timestamp (process start)
    "blueprints": ["vaani", "email", "emergency", "local", ...],  // registered blueprint names
    "routes_count": 47,                 // total Flask routes
    "vault_routes_present": true,       // sanity check — are the new endpoints live?
    "channel_verify_routes_present": true,
    "python_version": "3.11.x",
  }

This is intentionally a separate, dependency-free blueprint so it
loads even if other blueprints fail. It does NOT touch the DB. It
does NOT require auth.
"""
from __future__ import annotations

import os
import sys
import time
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify

bp = Blueprint("vaani_version", __name__, url_prefix="/api/vaani")

_BOOT_TS_ISO = datetime.now(timezone.utc).isoformat(timespec="seconds")


@bp.get("/version")
def version_route():
    app = current_app
    rules = list(app.url_map.iter_rules())
    blueprints = sorted({r.endpoint.split(".")[0] for r in rules if "." in r.endpoint})
    paths = [r.rule for r in rules]
    return jsonify({
        "ok": True,
        "git_sha": os.environ.get("RAILWAY_GIT_COMMIT_SHA")
                   or os.environ.get("SOURCE_VERSION")
                   or os.environ.get("GIT_COMMIT")
                   or "unknown",
        "git_short": (os.environ.get("RAILWAY_GIT_COMMIT_SHA")
                      or os.environ.get("SOURCE_VERSION")
                      or os.environ.get("GIT_COMMIT")
                      or "unknown")[:7],
        "git_branch": os.environ.get("RAILWAY_GIT_BRANCH") or "unknown",
        "deployment_id": os.environ.get("RAILWAY_DEPLOYMENT_ID") or "unknown",
        "service_id": os.environ.get("RAILWAY_SERVICE_ID") or "unknown",
        "build_ts": _BOOT_TS_ISO,
        "uptime_s": int(time.time() - _BOOT_TS_EPOCH),
        "blueprints": blueprints,
        "routes_count": len(rules),
        "vault_routes_present": any("/api/vaani/vault/" in p for p in paths),
        "channel_verify_routes_present": any("/api/vaani/channel/" in p for p in paths),
        "python_version": ".".join(map(str, sys.version_info[:3])),
    })


_BOOT_TS_EPOCH = time.time()
