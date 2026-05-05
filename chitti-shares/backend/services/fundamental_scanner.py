"""
services/fundamental_scanner.py
-------------------------------
Scans an entire universe (or all universes combined) and returns the
stocks that match a chosen investing strategy's filter.

Strategy slugs match the dropdown values in chitti_fundamentals.html
(buffett, munger, graham, lynch, fisher, greenblatt, pabrai, marks,
rj, kedia, rkd, rmd, ns, hdfc, mirae, motilal, jpm, gs, cs1..cs4,
pli, china1, infra, green, defence, digital, div-aristo, turnaround,
insider, debt-free, hidden).

Uses the same cache key (`public_fund:{symbol}`) as
/api/fundamentals/{symbol}, so a scan also warms the per-stock detail
view. Concurrent fetches with a thread pool keep the first scan
under ~30s on a warm dyno.
"""
from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from services import yahoo_client
from services.cache import cache
from services.universes import UNIVERSES, get_universe

log = logging.getLogger("fund_scanner")

CACHE_KEY_PREFIX = "public_fund:"
CACHE_TTL = 60 * 60  # 1 hr — same TTL as the per-stock detail endpoint


# ─────────────────────────────────────────────────────────────
# Predicate helpers
# ─────────────────────────────────────────────────────────────
def _f(d, key):
    v = d.get(key) if d else None
    return v if v is not None else None


def _ge(d, key, val):
    v = _f(d, key)
    return v is not None and v >= val


def _le(d, key, val):
    v = _f(d, key)
    return v is not None and v <= val


def _between(d, key, lo, hi):
    v = _f(d, key)
    return v is not None and lo < v < hi


def _de_norm(d):
    """yfinance debt_to_equity is sometimes quoted in % (50 = 0.5x). Normalise."""
    de = _f(d, "debt_to_equity")
    if de is None:
        return None
    return de / 100 if de > 5 else de


def _de_le(d, val):
    de = _de_norm(d)
    return de is not None and de <= val


def _mcap_lt(d, cr):
    """Market cap less than `cr` crore."""
    mc = _f(d, "market_cap")
    return mc is not None and mc < (cr * 1e7)


# ─────────────────────────────────────────────────────────────
# Strategy filters — best-effort using available yfinance fundamentals
# ─────────────────────────────────────────────────────────────
def _buffett(d):    return _ge(d, "roe", 15)  and _de_le(d, 0.5) and _between(d, "pe", 0, 25) and _ge(d, "profit_margin", 10)
def _munger(d):     return _ge(d, "roce", 18) and _de_le(d, 0.5) and _ge(d, "profit_margin", 10)
def _graham(d):
    pe = _f(d, "pe"); pb = _f(d, "pb")
    if pe is None or pb is None or pe <= 0 or pb <= 0: return False
    return pe * pb < 22.5 and pe < 15 and pb < 1.5
def _lynch(d):      return _le(d, "peg_ratio", 1) and _ge(d, "earnings_growth", 15) and _de_le(d, 0.5)
def _fisher(d):     return _ge(d, "roe", 15)  and _ge(d, "operating_margin", 12) and _ge(d, "earnings_growth", 12)
def _greenblatt(d): return _ge(d, "roce", 18) and _between(d, "pe", 0, 15)
def _pabrai(d):     return _between(d, "pe", 0, 12) and _de_le(d, 0.3)
def _marks(d):      return _between(d, "pe", 0, 20) and _de_le(d, 0.5) and _le(d, "beta", 1.2)
def _rj(d):         return _ge(d, "roce", 15) and _de_le(d, 0.5) and _ge(d, "roe", 15)
def _kedia(d):      return _ge(d, "roe", 15)  and _mcap_lt(d, 75000)
def _rkd(d):        return _de_le(d, 0.1)     and _ge(d, "roce", 15)
def _rmd(d):        return _ge(d, "revenue_growth", 20)
def _ns(d):         return _ge(d, "roce", 18) and _de_le(d, 0.3)
def _hdfc(d):       return _ge(d, "roe", 15)  and _ge(d, "earnings_growth", 12) and _between(d, "pe", 0, 30)
def _mirae(d):      return _mcap_lt(d, 75000) and _ge(d, "roe", 15)
def _motilal(d):    return _ge(d, "roce", 18) and _ge(d, "earnings_growth", 15) and _between(d, "pe", 0, 35)
def _jpm(d):        return _ge(d, "roe", 15)  and _de_le(d, 0.5)
def _gs(d):         return _between(d, "pe", 0, 20) and _ge(d, "roe", 15) and _ge(d, "revenue_growth", 0)
def _cs1(d):        return _ge(d, "roe", 15)  and _de_le(d, 0.1)
def _cs2(d):        return _ge(d, "roe", 12)  and _de_le(d, 1) and _ge(d, "revenue_growth", 0)
def _cs3(d):        return _ge(d, "revenue_growth", 20) and _ge(d, "operating_margin", 10)
def _cs4(d):        return _between(d, "pe", 0, 20) and _ge(d, "roe", 12)
def _pli(d):        return _ge(d, "revenue_growth", 15)
def _china1(d):     return _ge(d, "revenue_growth", 15)
def _infra(d):      return _ge(d, "revenue_growth", 10)
def _green(d):      return _ge(d, "revenue_growth", 20)
def _defence(d):    return _ge(d, "revenue_growth", 10)
def _digital(d):    return _ge(d, "revenue_growth", 25)
def _div_aristo(d): return _ge(d, "dividend_yield", 1) and _ge(d, "profit_margin", 10)
def _turnaround(d): return _ge(d, "earnings_growth", 50)
def _insider(d):    return False  # promoter / insider buying data not yet wired
def _debt_free(d):  return _de_le(d, 0.1) and _ge(d, "current_ratio", 1.5)
def _hidden(d):     return _mcap_lt(d, 5000) and _ge(d, "roe", 18) and _ge(d, "revenue_growth", 15)


STRATEGY_FILTERS = {
    "buffett":    {"name": "Warren Buffett",                  "fn": _buffett,    "note": None},
    "munger":     {"name": "Charlie Munger",                  "fn": _munger,     "note": None},
    "graham":     {"name": "Benjamin Graham",                 "fn": _graham,     "note": None},
    "lynch":      {"name": "Peter Lynch (GARP)",              "fn": _lynch,      "note": None},
    "fisher":     {"name": "Philip Fisher",                   "fn": _fisher,     "note": None},
    "greenblatt": {"name": "Joel Greenblatt (Magic Formula)", "fn": _greenblatt, "note": None},
    "pabrai":     {"name": "Mohnish Pabrai (Dhando)",         "fn": _pabrai,     "note": None},
    "marks":      {"name": "Howard Marks",                    "fn": _marks,      "note": None},
    "rj":         {"name": "Rakesh Jhunjhunwala",             "fn": _rj,         "note": None},
    "kedia":      {"name": "Vijay Kedia (SMILE)",             "fn": _kedia,      "note": "Small/Mid cap = market cap < ₹75,000 cr."},
    "rkd":        {"name": "Radhakishan Damani",              "fn": _rkd,        "note": None},
    "rmd":        {"name": "Ramesh Damani (Sector Inflection)", "fn": _rmd,      "note": "Best-effort: high revenue growth used as inflection proxy."},
    "ns":         {"name": "Nemish Shah",                     "fn": _ns,         "note": None},
    "hdfc":       {"name": "HDFC AMC",                        "fn": _hdfc,       "note": None},
    "mirae":      {"name": "Mirae Asset (Emerging Blue Chip)", "fn": _mirae,     "note": "Mid-cap leadership ≈ market cap < ₹75,000 cr."},
    "motilal":    {"name": "Motilal Oswal (QGLP)",            "fn": _motilal,    "note": None},
    "jpm":        {"name": "JP Morgan (EM Quality)",          "fn": _jpm,        "note": "ESG check needs external data — using quality-only filter."},
    "gs":         {"name": "Goldman Sachs (Quant)",           "fn": _gs,         "note": "Momentum factor uses revenue-growth proxy."},
    "cs1":        {"name": "Roshan + ROE > 15% + Debt-Free",  "fn": _cs1,        "note": "Roshan technical signal not in this scan — fundamental-only filter."},
    "cs2":        {"name": "RSI Oversold + Strong Fundamentals", "fn": _cs2,     "note": "RSI signal needs technical data — using fundamentals-only filter."},
    "cs3":        {"name": "Supertrend + Revenue > 20%",      "fn": _cs3,        "note": "Supertrend signal needs technical data — using revenue + margin proxy."},
    "cs4":        {"name": "MACD + Low PE vs Peers",          "fn": _cs4,        "note": "MACD signal needs technical data — using P/E + ROE proxy."},
    "pli":        {"name": "PLI Beneficiaries",               "fn": _pli,        "note": "PLI list not yet wired — using high revenue growth proxy."},
    "china1":     {"name": "China+1 Export Winners",          "fn": _china1,     "note": "Export-share data not yet wired — using high revenue growth proxy."},
    "infra":      {"name": "India Infrastructure",            "fn": _infra,      "note": "Order-book data not yet wired — using revenue growth proxy."},
    "green":      {"name": "Green Energy Transition",         "fn": _green,      "note": "Renewable revenue split not yet wired — using high revenue growth proxy."},
    "defence":    {"name": "Defence Indigenisation",          "fn": _defence,    "note": "Defence order book not yet wired — using revenue growth proxy."},
    "digital":    {"name": "Digital India",                   "fn": _digital,    "note": "Digital revenue split not yet wired — using high revenue growth proxy."},
    "div-aristo": {"name": "Dividend Aristocrats",            "fn": _div_aristo, "note": "10-year dividend history not yet wired — using current yield + margin proxy."},
    "turnaround": {"name": "Turnaround Stories",              "fn": _turnaround, "note": "Loss history not yet wired — using >50% earnings growth as proxy."},
    "insider":    {"name": "Insider Buying",                  "fn": _insider,    "note": "Promoter / insider buying data not yet wired — no matches available."},
    "debt-free":  {"name": "Debt-Free Champions",             "fn": _debt_free,  "note": None},
    "hidden":     {"name": "Hidden Gems (Microcap)",          "fn": _hidden,     "note": None},
}


# ─────────────────────────────────────────────────────────────
# Per-stock fetch (uses same cache key as /api/fundamentals/{symbol})
# ─────────────────────────────────────────────────────────────
def _fetch_one(symbol: str):
    cached = cache.get(CACHE_KEY_PREFIX + symbol)
    if cached:
        return cached
    try:
        raw = yahoo_client.fundamentals(symbol) or {}
    except Exception as e:  # noqa: BLE001
        log.debug("fetch_one(%s) error: %s", symbol, e)
        return None
    out = {
        "symbol": symbol,
        "name": raw.get("name"),
        "sector": raw.get("sector"),
        "industry": raw.get("industry"),
        "price": raw.get("price"),
        "market_cap": raw.get("market_cap"),
        "fifty_two_week_high": raw.get("fifty_two_week_high"),
        "fifty_two_week_low":  raw.get("fifty_two_week_low"),
        "pe":  raw.get("pe"),
        "forward_pe": raw.get("forward_pe"),
        "pb":  raw.get("pb"),
        "eps": raw.get("eps"),
        "dividend_yield":  raw.get("dividend_yield"),
        "debt_to_equity":  raw.get("debt_to_equity"),
        "roe":  raw.get("roe"),
        "roa":  raw.get("roa"),
        "roce": raw.get("roce"),
        "profit_margin":   raw.get("profit_margin"),
        "operating_margin": raw.get("operating_margin"),
        "current_ratio": raw.get("current_ratio"),
        "quick_ratio":   raw.get("quick_ratio"),
        "book_value":    raw.get("book_value"),
        "beta":          raw.get("beta"),
        "ev_to_ebitda":  raw.get("ev_to_ebitda"),
        "peg_ratio":     raw.get("peg_ratio"),
        "shares_outstanding": raw.get("shares_outstanding"),
        "revenue_growth": raw.get("revenue_growth"),
        "earnings_growth": raw.get("earnings_growth"),
    }
    cache.set(CACHE_KEY_PREFIX + symbol, out, CACHE_TTL)
    return out


# ─────────────────────────────────────────────────────────────
# Verdict per matched stock
# ─────────────────────────────────────────────────────────────
def _verdict(d):
    score = 0
    roe  = d.get("roe")  or 0
    roce = d.get("roce") or 0
    pe   = d.get("pe")   or 0
    de   = _de_norm(d) or 99
    rg   = d.get("revenue_growth") or 0
    pm   = d.get("profit_margin")  or 0
    if roe  > 18: score += 2
    elif roe > 12: score += 1
    if roce > 18: score += 1
    if 0 < pe < 20: score += 1
    if de < 0.3:  score += 1
    if rg > 10:   score += 1
    if pm > 12:   score += 1
    if score >= 6: return "STRONG BUY"
    if score >= 3: return "BUY"
    return "HOLD"


# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────
def all_strategies() -> list[dict]:
    return [{"slug": k, "name": v["name"], "note": v.get("note")} for k, v in STRATEGY_FILTERS.items()]


def scan(universe: str, strategy: str, max_stocks: int = 0, max_workers: int = 16) -> dict:
    strat = STRATEGY_FILTERS.get(strategy)
    if not strat:
        return {"error": f"unknown strategy: {strategy}", "matches": [], "scanned": 0, "matched": 0}

    if universe == "all":
        seen: set = set()
        symbols: list[str] = []
        for u in UNIVERSES.values():
            for s in u:
                if s not in seen:
                    seen.add(s)
                    symbols.append(s)
    else:
        symbols = list(get_universe(universe))

    if max_stocks > 0:
        symbols = symbols[:max_stocks]

    matches: list[dict] = []
    fetched = 0
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {ex.submit(_fetch_one, s): s for s in symbols}
        for f in as_completed(futures):
            d = f.result()
            fetched += 1
            if d is None:
                continue
            try:
                if strat["fn"](d):
                    matches.append({
                        "symbol": d["symbol"],
                        "name":   d.get("name"),
                        "sector": d.get("sector"),
                        "price":  d.get("price"),
                        "market_cap":     d.get("market_cap"),
                        "pe":             d.get("pe"),
                        "pb":             d.get("pb"),
                        "roe":            d.get("roe"),
                        "roce":           d.get("roce"),
                        "debt_to_equity": d.get("debt_to_equity"),
                        "revenue_growth": d.get("revenue_growth"),
                        "earnings_growth": d.get("earnings_growth"),
                        "dividend_yield": d.get("dividend_yield"),
                        "verdict":        _verdict(d),
                    })
            except Exception:
                continue

    # Sort: STRONG BUY first, then BUY, then HOLD; tiebreak by ROE desc
    order = {"STRONG BUY": 0, "BUY": 1, "HOLD": 2}
    matches.sort(key=lambda x: (order.get(x["verdict"], 9), -(x.get("roe") or 0)))

    return {
        "universe": universe,
        "strategy": strategy,
        "strategy_name": strat["name"],
        "note": strat.get("note"),
        "scanned": fetched,
        "matched": len(matches),
        "matches": matches,
    }
