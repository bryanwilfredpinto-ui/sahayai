"""
services/specialist.py
----------------------
StockSpecialist: a Chitti instance focused on ONE stock.

When the user opens "Chitti Reliance" and asks a question, we:
  1. Load the spec from config/stock_specialists.json
  2. Pull fundamentals + latest quarterly + today's technical signal
     for THAT stock (cached, so it's cheap on repeat).
  3. Build a system prompt that:
       - Names the specialist ("You are Chitti Reliance")
       - Pins the focus ("you only discuss Reliance Industries")
       - Includes the live numbers
       - Pins the language (English or Hindi)
  4. Call DeepSeek and stream the reply.

Adding an 11th stock:
  - Append to config/stock_specialists.json
  - No code changes required.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

from services import yahoo_client, scorecard, indicators
from services.cache import cache
from services.data_source import DataSourceError, get_history
from services.deepseek_client import DeepSeekError, chat as deepseek_chat

log = logging.getLogger("specialist")

CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "config", "stock_specialists.json",
)


_SPECIALISTS_CACHE: dict | None = None


def get_all() -> dict:
    """Returns {symbol: {display_name, long_name, expertise, key_themes}}."""
    global _SPECIALISTS_CACHE
    if _SPECIALISTS_CACHE is not None:
        return _SPECIALISTS_CACHE
    if not os.path.exists(CONFIG_PATH):
        log.warning("specialists config not found: %s", CONFIG_PATH)
        _SPECIALISTS_CACHE = {}
        return _SPECIALISTS_CACHE
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    _SPECIALISTS_CACHE = data.get("specialists", {})
    return _SPECIALISTS_CACHE


def is_specialist(symbol: str) -> bool:
    return symbol in get_all()


def get_specialist(symbol: str) -> Optional[dict]:
    return get_all().get(symbol)


def _gather_context(symbol: str) -> dict:
    """Build the live numbers Chitti will reason over. Heavy work cached."""
    ck = f"specialist_ctx:{symbol}"
    cached = cache.get(ck)
    if cached:
        return cached

    ctx: dict = {"symbol": symbol}

    try:
        fund = yahoo_client.fundamentals(symbol)
        if fund:
            card = scorecard.build_scorecard(fund)
            ctx["fundamentals"] = {
                "name": fund.get("name"),
                "sector": fund.get("sector"),
                "price": fund.get("price"),
                "market_cap_cr": (fund.get("market_cap") or 0) / 1e7,
                "pe": fund.get("pe"),
                "pb": fund.get("pb"),
                "roe": fund.get("roe"),
                "roce": fund.get("roce"),
                "debt_to_equity": fund.get("debt_to_equity"),
                "revenue_growth": fund.get("revenue_growth"),
                "earnings_growth": fund.get("earnings_growth"),
                "dividend_yield": fund.get("dividend_yield"),
                "fifty_two_week_high": fund.get("fifty_two_week_high"),
                "fifty_two_week_low": fund.get("fifty_two_week_low"),
                "scorecard_grade": card.get("overall_grade"),
                "scorecard_score": card.get("overall_score"),
            }
    except DataSourceError as e:
        log.debug("fundamentals fetch failed for %s: %s", symbol, e)

    try:
        qtrs = yahoo_client.quarterly(symbol, num_quarters=4)
        if qtrs:
            qsum = scorecard.quarterly_summary(qtrs)
            ctx["quarterly"] = {
                "star_rating": qsum.get("star_rating"),
                "revenue_trend": qsum.get("revenue_trend"),
                "profit_trend": qsum.get("profit_trend"),
                "latest": qsum.get("latest"),
            }
    except DataSourceError:
        pass

    try:
        candles = get_history(symbol, days=365, interval="day")
        if len(candles) >= 30:
            tech = indicators.compute_all(candles)
            ctx["technical"] = {
                "summary": tech.get("summary"),
                "rsi_14": tech.get("rsi_14"),
                "macd_hist": tech.get("macd_hist"),
                "sma_20": tech.get("sma_20"),
                "sma_50": tech.get("sma_50"),
                "sma_200": tech.get("sma_200"),
                "latest_close": candles[-1]["close"],
                "latest_date": candles[-1]["date"],
            }
    except DataSourceError:
        pass

    cache.set(ck, ctx, 30 * 60)  # 30-min cache
    return ctx


def _format_context_for_prompt(spec: dict, ctx: dict) -> str:
    parts = []
    f = ctx.get("fundamentals") or {}
    if f:
        parts.append(
            f"FUNDAMENTALS:\n"
            f"  Sector: {f.get('sector', 'N/A')}\n"
            f"  Current price: ₹{_n(f.get('price'))}\n"
            f"  Market Cap: ₹{_n(f.get('market_cap_cr'), 0)} Cr\n"
            f"  P/E: {_n(f.get('pe'))}, P/B: {_n(f.get('pb'))}\n"
            f"  ROE: {_n(f.get('roe'))}%, ROCE: {_n(f.get('roce'))}%\n"
            f"  D/E: {_n(f.get('debt_to_equity'))}\n"
            f"  Revenue growth: {_n(f.get('revenue_growth'))}%, Earnings growth: {_n(f.get('earnings_growth'))}%\n"
            f"  Dividend Yield: {_n(f.get('dividend_yield'))}%\n"
            f"  52w High/Low: ₹{_n(f.get('fifty_two_week_high'), 0)} / ₹{_n(f.get('fifty_two_week_low'), 0)}\n"
            f"  Overall Scorecard: {f.get('scorecard_grade', '—')} ({f.get('scorecard_score', 'N/A')}/100)"
        )
    q = ctx.get("quarterly") or {}
    if q:
        latest = q.get("latest") or {}
        parts.append(
            f"QUARTERLY (last results):\n"
            f"  Quarter: {latest.get('quarter', 'N/A')}\n"
            f"  Revenue: ₹{_compact_cr(latest.get('revenue'))}, "
            f"  Net Income: ₹{_compact_cr(latest.get('net_income'))}\n"
            f"  Quality stars: {q.get('star_rating', 'N/A')}/5\n"
            f"  Revenue trend: {q.get('revenue_trend')}, Profit trend: {q.get('profit_trend')}"
        )
    t = ctx.get("technical") or {}
    if t:
        parts.append(
            f"TECHNICAL (daily, as of {t.get('latest_date')}):\n"
            f"  Latest close: ₹{_n(t.get('latest_close'))}\n"
            f"  Summary signal: {t.get('summary')}\n"
            f"  RSI(14): {_n(t.get('rsi_14'))}, MACD Histogram: {_n(t.get('macd_hist'))}\n"
            f"  SMA20: ₹{_n(t.get('sma_20'))}, SMA50: ₹{_n(t.get('sma_50'))}, SMA200: ₹{_n(t.get('sma_200'))}"
        )
    if not parts:
        parts.append("(Live data unavailable right now - answer from general knowledge but say so.)")
    return "\n\n".join(parts)


def _n(v, decimals=2):
    if v is None: return "N/A"
    try: return f"{float(v):,.{decimals}f}"
    except (TypeError, ValueError): return "N/A"


def _compact_cr(n):
    if n is None: return "N/A"
    cr = n / 1e7
    if abs(cr) >= 1000: return f"{cr/1000:,.1f}k Cr"
    return f"{cr:,.0f} Cr"


# ============== Public chat ==============

async def ask(symbol: str, question: str, *,
              language: str = "en",
              user_id: int | None = None) -> str:
    """Ask a stock specialist a question. Returns reply text."""
    spec = get_specialist(symbol)
    if not spec:
        raise ValueError(f"No specialist configured for {symbol}")

    ctx = _gather_context(symbol)
    ctx_block = _format_context_for_prompt(spec, ctx)

    lang_pin = (
        "Reply in English. Be concise (3-6 sentences)."
        if language == "en"
        else "Reply in clear Hindi (Devanagari script). Be concise (3-6 sentences). "
             "Numbers and ticker symbols may stay in English."
    )

    system = (
        f"You are {spec['display_name']}, a focused AI specialist for "
        f"{spec['long_name']} on Indian stock markets.\n"
        f"You ONLY discuss {spec['long_name']} ({symbol}). If the user asks "
        f"about another stock, politely say you specialise only in this one "
        f"and suggest they open the relevant Chitti specialist or general chat.\n"
        f"Expertise area: {spec.get('expertise', '')}\n"
        f"Key themes you watch: {', '.join(spec.get('key_themes', []))}\n\n"
        f"LIVE CONTEXT (use these specific numbers in your answer):\n"
        f"{ctx_block}\n\n"
        f"{lang_pin}\n"
        f"If asked for a buy/sell call, ALWAYS include rationale, entry zone, "
        f"target, stop loss. No financial-advice disclaimers - the app handles those."
    )

    return await deepseek_chat(
        system, question,
        max_tokens=500, temperature=0.55,
        user_id=user_id,
    )
