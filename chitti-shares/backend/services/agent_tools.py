"""
services/agent_tools.py
-----------------------
Tool definitions + executors for the three product agents.

Each `*_TOOLS` block is the OpenAI-style schema array passed to the LLM.
Each `*_EXECUTORS` map binds the tool name to a thin wrapper around an
existing service (services/technical, scanner, strength, screener_client,
fundamentals_extras, medupi_*, news_client, ...).

Wrappers stay deliberately thin — never reshape the underlying service
output. The LLM sees the same dict the REST clients see, which keeps
prompts auditable.
"""
from __future__ import annotations

import logging
from typing import Any

from services import (
    angel_client,
    fundamentals_extras,
    levels,
    medupi_alternatives,
    medupi_cart,
    medupi_database,
    medupi_jan_aushadhi,
    medupi_risk,
    news_client,
    scanner,
    screener_client,
    strength,
    technical,
)

log = logging.getLogger("agent_tools")


# ===================================================================
# CHITTI TECHNICAL TOOLS
# ===================================================================

TECHNICAL_TOOLS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "get_quote",
            "description": "Live last price + day change + day high/low for one or more Indian stock symbols (NSE:RELIANCE, BSE:SENSEX, etc.).",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbols": {"type": "array", "items": {"type": "string"},
                                "description": "Canonical symbols, e.g. ['NSE:RELIANCE','NSE:TCS']"}
                },
                "required": ["symbols"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_signal_strength",
            "description": "Composite signal strength 0-10 + how many of the 43 indicators agree, on one timeframe.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {"type": "string"},
                    "timeframe": {"type": "string",
                                  "enum": ["Monthly", "Weekly", "Daily", "4H", "1H"],
                                  "description": "Default Daily."},
                },
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_rating_table",
            "description": "STRONG BUY / BUY / NEUTRAL / SELL / STRONG SELL across every timeframe (Monthly..1H) for one symbol.",
            "parameters": {
                "type": "object",
                "properties": {"symbol": {"type": "string"}},
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_indicator_signals",
            "description": "Per-indicator BUY/SELL/WAIT across all timeframes for one symbol. Use to answer 'what does RSI say?', 'is MACD bullish?', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {"type": "string"},
                    "indicators": {"type": "array", "items": {"type": "string"},
                                   "description": "Optional. e.g. ['RSI','MACD','Roshan Indicator']. Empty = all 43."},
                },
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_levels",
            "description": "Auto support/resistance + trendlines for a symbol/timeframe.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {"type": "string"},
                    "timeframe": {"type": "string",
                                  "enum": ["Monthly", "Weekly", "Daily", "4H", "1H"]},
                },
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "scan_universe",
            "description": "Scan a universe for the Roshan signal on a given call (Long-term/Positional/Swing/Intraday). Returns lists of BUY and SHORT setups.",
            "parameters": {
                "type": "object",
                "properties": {
                    "call":     {"type": "string", "enum": ["Long-term", "Positional", "Swing", "Intraday"]},
                    "universe": {"type": "string", "enum": ["nifty50", "largecap", "midcap", "smallcap", "microcap"]},
                },
                "required": ["call", "universe"],
            },
        },
    },
]


def _exec_get_quote(a: dict) -> Any:
    syms = a.get("symbols") or []
    if isinstance(syms, str): syms = [syms]
    return angel_client.get_quote([str(s) for s in syms])


def _exec_get_signal_strength(a: dict) -> Any:
    return strength.signal_strength(str(a.get("symbol") or ""),
                                    timeframe=str(a.get("timeframe") or "Daily"))


def _exec_get_rating_table(a: dict) -> Any:
    return strength.rating_table(str(a.get("symbol") or ""))


def _exec_get_indicator_signals(a: dict) -> Any:
    indicators = a.get("indicators") or None
    if isinstance(indicators, str): indicators = [indicators]
    return technical.technical_report(str(a.get("symbol") or ""), indicators=indicators)


def _exec_get_levels(a: dict) -> Any:
    return levels.compute_levels(str(a.get("symbol") or ""),
                                 str(a.get("timeframe") or "Daily"))


def _exec_scan_universe(a: dict) -> Any:
    return scanner.scan_roshan(call=str(a.get("call") or "Positional"),
                               universe_name=str(a.get("universe") or "nifty50"))


TECHNICAL_EXECUTORS = {
    "get_quote":              _exec_get_quote,
    "get_signal_strength":    _exec_get_signal_strength,
    "get_rating_table":       _exec_get_rating_table,
    "get_indicator_signals":  _exec_get_indicator_signals,
    "get_levels":             _exec_get_levels,
    "scan_universe":          _exec_scan_universe,
}

TECHNICAL_SYSTEM = (
    "You are Chitti Technical, a fast, calm, India-focused technical-only trader assistant. "
    "You ONLY look at price + volume. Never discuss fundamentals, news, or company quality — "
    "that is Chitti Fundamentals' job. Refer to it explicitly when asked.\n\n"
    "Use the available tools to look up live data. Always cite the Roshan Indicator when relevant: "
    "RSI(14) > SMA(20) of RSI on TF1 AND TF2 + both pair candles green + pullback TF candle red = BUY. "
    "Mirror image = SHORT. Always read the LAST CLOSED candle (iloc[-2]).\n\n"
    "Output shape: 3-line verdict + 1-line risk reminder + this exact closing line: "
    "'NOT SEBI Registered. Educational tool only, not investment advice.'\n\n"
    "Hindi-ready: if the user wrote in Hindi or Devanagari, respond in Hindi."
)


# ===================================================================
# CHITTI FUNDAMENTAL TOOLS
# ===================================================================

FUNDAMENTAL_TOOLS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "get_fundamentals",
            "description": "Identity + ratios (P/E, P/B, ROE, ROCE, D/E, dividend yield, margins, beta) + 4-quarter snapshot for one symbol.",
            "parameters": {
                "type": "object",
                "properties": {"symbol": {"type": "string"}},
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_financials",
            "description": "Full financial statements matrix: quarterly P&L, half-yearly P&L (derived), annual P&L + balance sheet + cash flow.",
            "parameters": {
                "type": "object",
                "properties": {"symbol": {"type": "string"}},
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_cagr",
            "description": "3-year / 5-year / 10-year CAGR for Sales, Operating Profit, Net Profit.",
            "parameters": {
                "type": "object",
                "properties": {"symbol": {"type": "string"}},
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_shareholding",
            "description": "Quarterly Promoter / FII / DII / Public shareholding pattern.",
            "parameters": {
                "type": "object",
                "properties": {"symbol": {"type": "string"}},
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_news",
            "description": "Latest RSS-aggregated headlines for a stock (Moneycontrol + LiveMint).",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {"type": "string"},
                    "limit":  {"type": "integer", "default": 8},
                },
                "required": ["symbol"],
            },
        },
    },
]


def _exec_get_fundamentals(a: dict) -> Any:
    return screener_client.fundamentals(str(a.get("symbol") or ""))


def _exec_get_financials(a: dict) -> Any:
    return screener_client.financials(str(a.get("symbol") or ""))


def _exec_get_cagr(a: dict) -> Any:
    return fundamentals_extras.cagr(str(a.get("symbol") or ""))


def _exec_get_shareholding(a: dict) -> Any:
    return screener_client.shareholding(str(a.get("symbol") or ""))


def _exec_get_news(a: dict) -> Any:
    return news_client.fetch_stock_news(str(a.get("symbol") or ""),
                                        limit=int(a.get("limit") or 8))


FUNDAMENTAL_EXECUTORS = {
    "get_fundamentals":  _exec_get_fundamentals,
    "get_financials":    _exec_get_financials,
    "get_cagr":          _exec_get_cagr,
    "get_shareholding":  _exec_get_shareholding,
    "get_news":          _exec_get_news,
}

FUNDAMENTAL_SYSTEM = (
    "You are Chitti Fundamentals, a patient teacher of Indian equities. "
    "Always explain WHY a number matters — never just state it. Speak through "
    "an investor lens (Buffett / Lynch / Graham / Greenblatt) when one is given; "
    "if the user does not specify, default to Buffett (quality + moat + low debt + ROE>15%).\n\n"
    "Use the tools to look up fresh data — never invent numbers. If a number is missing, "
    "say so honestly.\n\n"
    "Output shape: 1-line verdict (e.g. QUALITY-AT-FAIR-PRICE / EXPENSIVE / TURNAROUND / VALUE-TRAP) "
    "+ 5 bullet 'whys' with the actual numbers + this exact closing line: "
    "'NOT SEBI Registered. Educational tool only, not investment advice.'\n\n"
    "Hindi-ready: if the user wrote in Hindi or Devanagari, respond in Hindi."
)


# ===================================================================
# CHITTI MEDUPI TOOLS
# ===================================================================

MEDUPI_TOOLS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "search_medicine",
            "description": "Brand -> composition lookup. Returns molecule + strength + dosage form for a brand name (e.g. Crocin -> Paracetamol 650mg Tablet).",
            "parameters": {
                "type": "object",
                "properties": {"brand": {"type": "string"}},
                "required": ["brand"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_alternatives",
            "description": "Strict same-composition equivalents (same molecule + strength + dosage form ONLY — never therapeutic substitutes). Sorted Jan Aushadhi cheapest first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "molecule":      {"type": "string"},
                    "strength":      {"type": "string", "description": "e.g. '650mg'"},
                    "dosage_form":   {"type": "string", "description": "e.g. 'Tablet'"},
                    "current_brand": {"type": "string"},
                },
                "required": ["molecule", "strength", "dosage_form"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "classify_risk",
            "description": "HIGH / MEDIUM / LOW risk class + warning text for a molecule. HIGH-risk meds (anticoagulants, anti-epileptics, narrow-therapeutic-index drugs) require doctor-consult before switching.",
            "parameters": {
                "type": "object",
                "properties": {"molecule": {"type": "string"}},
                "required": ["molecule"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_jan_aushadhi_stores",
            "description": "Find nearest Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP / Jan Aushadhi) stores.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat":       {"type": "number"},
                    "lng":       {"type": "number"},
                    "radius_km": {"type": "number", "default": 5},
                    "limit":     {"type": "integer", "default": 10},
                },
                "required": ["lat", "lng"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "simulate_cart",
            "description": "Optimised cart simulator. Drop a list of monthly meds; returns the cheapest equivalent cart + monthly + annual savings.",
            "parameters": {
                "type": "object",
                "properties": {
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "molecule":      {"type": "string"},
                                "strength":      {"type": "string"},
                                "dosage_form":   {"type": "string"},
                                "monthly_qty":   {"type": "number"},
                                "current_price": {"type": "number"},
                                "current_brand": {"type": "string"},
                            },
                            "required": ["molecule", "strength", "dosage_form",
                                         "monthly_qty", "current_price"],
                        },
                    },
                },
                "required": ["items"],
            },
        },
    },
]


def _exec_search_medicine(a: dict) -> Any:
    return medupi_database.search_by_brand(str(a.get("brand") or ""))


def _exec_find_alternatives(a: dict) -> Any:
    return medupi_alternatives.find(
        molecule=str(a.get("molecule") or ""),
        strength=str(a.get("strength") or ""),
        dosage_form=str(a.get("dosage_form") or ""),
        current_brand=str(a.get("current_brand") or ""),
    )


def _exec_classify_risk(a: dict) -> Any:
    return medupi_risk.classify(str(a.get("molecule") or ""))


def _exec_find_jan_aushadhi_stores(a: dict) -> Any:
    return medupi_jan_aushadhi.find_nearby(
        lat=float(a.get("lat") or 0),
        lng=float(a.get("lng") or 0),
        radius_km=float(a.get("radius_km") or 5),
        limit=int(a.get("limit") or 10),
    )


def _exec_simulate_cart(a: dict) -> Any:
    return medupi_cart.simulate(a.get("items") or [])


MEDUPI_EXECUTORS = {
    "search_medicine":          _exec_search_medicine,
    "find_alternatives":        _exec_find_alternatives,
    "classify_risk":            _exec_classify_risk,
    "find_jan_aushadhi_stores": _exec_find_jan_aushadhi_stores,
    "simulate_cart":            _exec_simulate_cart,
}

MEDUPI_SYSTEM = (
    "You are Chitti MedUPI, a warm, family-first medicine-cost intelligence assistant for Indian families. "
    "STRICT same-composition rule: same molecule + same strength + same dosage form ONLY. "
    "NEVER suggest a therapeutic alternative across molecules. EVER.\n\n"
    "Use the tools to look up live data — never invent prices. Always classify risk first; HIGH-risk meds "
    "(anticoagulants, anti-epileptics, narrow-therapeutic-index drugs) get a stronger doctor-consult banner.\n\n"
    "Output shape: brand -> composition (1 line) + alternatives sorted (Jan Aushadhi -> MRP) + monthly savings + "
    "nearest store hint + risk warning + this exact closing line: "
    "'Consult your doctor or pharmacist before any change. Prices indicative — vary by pharmacy + location.'\n\n"
    "Hindi-ready: if the user wrote in Hindi or Devanagari, respond in Hindi."
)
