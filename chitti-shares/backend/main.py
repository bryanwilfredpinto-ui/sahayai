"""
main.py
-------
FastAPI app entry point.

Phases 1-6 wired:
  - Auth + Device management (Phase 1)
  - Indices + Market view (Phase 2)
  - Stocks + Fundamentals (Phase 3)
  - Technical + Custom rules + Calls (Phase 4)
  - Watchlist + Alerts + Portfolio + Chat (Phase 5)
  - Stock universe seed + Specialists + Quota tracking + Cron (Phase 6)

On startup:
  - Creates DB tables (safe, idempotent)
  - Seeds Nifty 500 universe on first run
  - Loads stock specialists config from config/stock_specialists.json
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import Base, engine
import models  # noqa: F401  (registers models with Base.metadata)
from routes import (
    auth, market, user, stocks, technical, portfolio, chat,
    quota, specialists, cron,
)
from services.usage_tracker import CapExceeded

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("main")

app = FastAPI(
    title="Chitti Shares API",
    version="1.0.0-phase6",
    description="Chitti Shares - Phases 1-6 (auth, market, fundamentals, technical, portfolio, specialists, quota)",
)

# Allowed origins: local dev + production frontend
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "https://chitti-shares-web.onrender.com",
    settings.FRONTEND_URL,
]
allowed_origins = list({o for o in allowed_origins if o})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Public NSE healthcheck (no auth needed; for debugging cloud IP blocks) ----

@app.get("/debug/nse")
def debug_nse():
    """
    Public endpoint. Hits NSE directly from this server and returns the
    raw NIFTY 50 + SENSEX numbers. Use this to verify whether NSE is
    reachable from Render's IPs WITHOUT going through auth.
    """
    from services import nse_client
    health = nse_client.healthcheck()
    sample = {}
    if health.get("ok"):
        try:
            sample = nse_client.get_index_quote([
                "NSE:NIFTY 50", "BSE:SENSEX", "NSE:BANKNIFTY",
            ])
        except Exception as e:  # noqa: BLE001
            sample = {"error": str(e)}
    return {"healthcheck": health, "sample_quotes": sample}


# ---- Global exception handler for budget cap ----

@app.exception_handler(CapExceeded)
async def cap_exceeded_handler(_request: Request, exc: CapExceeded):
    return JSONResponse(
        status_code=503,
        content={
            "detail": str(exc),
            "code": "BUDGET_CAP_EXCEEDED",
        },
    )


@app.on_event("startup")
def on_startup():
    """Create tables and seed initial data. Safe to run repeatedly."""
    Base.metadata.create_all(bind=engine)
    # Seed Nifty 500 stock universe (idempotent)
    try:
        from services.stock_universe import seed_if_empty
        seed_if_empty()
    except Exception as e:  # noqa: BLE001
        log.warning("Stock universe seed skipped: %s", e)
    # Start in-process scheduler (replaces external cron jobs)
    try:
        from services.scheduler import start as start_scheduler
        start_scheduler()
    except Exception as e:  # noqa: BLE001
        log.warning("Scheduler failed to start: %s", e)


@app.on_event("shutdown")
def on_shutdown():
    try:
        from services.scheduler import stop as stop_scheduler
        stop_scheduler()
    except Exception:
        pass


@app.get("/")
def root():
    return {
        "app": "Chitti Shares API",
        "version": "1.0.0-phase6",
        "status": "ok",
    }


@app.get("/health")
def health():
    """Lightweight check used by Render + frontend wake-up ping."""
    return {"ok": True}


# Mount routers (44 + new = ~60 routes)
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(market.router)
app.include_router(stocks.router)
app.include_router(technical.router_tech)
app.include_router(technical.router_calls)
app.include_router(portfolio.router_watchlist)
app.include_router(portfolio.router_alerts)
app.include_router(portfolio.router_portfolio)
app.include_router(chat.router)
app.include_router(quota.router)
app.include_router(specialists.router)
app.include_router(cron.router)
