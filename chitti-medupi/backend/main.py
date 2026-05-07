"""
main.py
-------
FastAPI app entrypoint for the Chitti MedUPI backend.

Mirrors the chitti-shares/backend/main.py pattern: build the app, attach
CORS, create tables, seed the master drug + Jan Aushadhi data on first
startup, mount the /api/medupi/* router. No auth gate — the family-wallet
endpoints use a per-device opaque X-User-Token header.

Spec: ../CHITTI_MEDUPI_MASTER_SPEC.md
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import Base, engine
import models  # noqa: F401 — registers all models with Base.metadata
from routes import medupi as medupi_routes
from services import (
    medupi_database,
    medupi_jan_aushadhi,
    medupi_migrations,
    medupi_scheduler,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("main")

app = FastAPI(
    title="Chitti MedUPI API",
    version="1.4.0",
    description="UPI for your medicine bills — Scan. Compare. Save. Backend for chitti_medupi.html.",
)

allowed = [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed or ["*"],
    allow_credentials=False,            # X-User-Token is the auth shim, not cookies
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """
    Boot order matters:
      1. ensure_schema()             — CREATE SCHEMA IF NOT EXISTS medupi
                                        (Postgres; no-op on SQLite). Must run
                                        BEFORE create_all so the tables have
                                        a schema to land in.
      2. Base.metadata.create_all()  — creates `medupi.medicines` etc.
      3. run_all()                   — column-level migrations on existing rows
      4. seed_if_empty() ×2          — seed 51 medicines + 25 stores on first boot
      5. scheduler.start()           — APScheduler kicks in for the cron jobs
    """
    try:
        medupi_migrations.ensure_schema()
    except Exception as e:  # noqa: BLE001
        log.warning("ensure_schema skipped: %s", e)
    Base.metadata.create_all(bind=engine)
    try:
        result = medupi_migrations.run_all()
        log.info("migrations: %s", result)
    except Exception as e:  # noqa: BLE001
        log.warning("migrations skipped: %s", e)
    try:
        n = medupi_database.seed_if_empty()
        if n:
            log.info("medicines seed loaded: %d rows", n)
    except Exception as e:  # noqa: BLE001
        log.warning("medicines seed skipped: %s", e)
    try:
        n = medupi_jan_aushadhi.seed_if_empty()
        if n:
            log.info("Jan Aushadhi seed loaded: %d stores", n)
    except Exception as e:  # noqa: BLE001
        log.warning("Jan Aushadhi seed skipped: %s", e)
    try:
        medupi_scheduler.start()
    except Exception as e:  # noqa: BLE001
        log.warning("scheduler failed to start: %s", e)


@app.on_event("shutdown")
def on_shutdown() -> None:
    try:
        medupi_scheduler.stop()
    except Exception:  # noqa: BLE001
        pass


@app.get("/")
def root() -> dict:
    return {"app": "Chitti MedUPI API", "version": app.version, "status": "ok"}


@app.get("/health")
def health() -> dict:
    """Lightweight check used by Render + frontend wake-up ping."""
    return {"ok": True}


app.include_router(medupi_routes.router)
