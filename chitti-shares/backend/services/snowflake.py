"""
services/snowflake.py
---------------------
Three Chitti-Special compute layers for the Fundamentals page:

  - snowflake_5d(symbol)   -> 5-axis radar (Value/Growth/Quality/Health/Income)
                              with each axis 0-10 + a one-line "why".
  - confidence_dial(symbol)-> 0-10 confidence in the verdict, with reasons
                              (data completeness + consistency + history depth).
  - risk_fit(symbol, persona) -> fit/partial/no-fit for the chosen persona
                                 (Conservative / Moderate / Aggressive).

All three layer on top of services/screener_client.py + fundamentals_extras.py.
NO LLM calls — pure deterministic compute over already-fetched ratios. Failure
mode: any axis with insufficient data scores `None` and the "why" says so.

Scoring philosophy (auditable):
  Map raw ratios into 0..10 via piecewise-linear bands. Bands chosen against the
  same investor lenses used elsewhere (Buffett / Lynch / Graham). Bands are
  visible in the BANDS dict below — not opaque magic numbers.
"""
from __future__ import annotations

import logging

from services import fundamentals_extras, screener_client

log = logging.getLogger("snowflake")


# ── Helpers ──────────────────────────────────────────────────────────

def _band(value: float | None, bands: list[tuple[float, float]]) -> float | None:
    """
    Piecewise-linear 0..10 score from a list of (threshold, score) breakpoints
    sorted ASCENDING in threshold. Below the lowest threshold -> bands[0][1].
    Above the highest -> bands[-1][1]. Linear interp between.
    """
    if value is None:
        return None
    if value <= bands[0][0]:
        return float(bands[0][1])
    if value >= bands[-1][0]:
        return float(bands[-1][1])
    for i in range(1, len(bands)):
        x0, y0 = bands[i - 1]
        x1, y1 = bands[i]
        if value <= x1:
            t = (value - x0) / (x1 - x0) if x1 != x0 else 0
            return round(y0 + t * (y1 - y0), 1)
    return None


def _band_inv(value: float | None, bands: list[tuple[float, float]]) -> float | None:
    """Same as _band but lower input -> higher score (e.g. P/E, D/E)."""
    return _band(-value if value is not None else None,
                 [(-b[0], b[1]) for b in reversed(bands)])


# ── Bands (visible — not opaque magic numbers) ─────────────────────

# Each: (raw_value_threshold, score_at_that_threshold), ascending raw.
BANDS = {
    # Value: lower P/E + lower P/B = higher score
    "pe":          [(5, 10), (15, 8), (25, 5), (40, 3), (80, 0)],
    "pb":          [(0.5, 10), (1.5, 8), (3, 5), (6, 2), (12, 0)],
    # Growth: higher CAGR = higher score
    "cagr":        [(0, 0), (5, 3), (10, 6), (18, 9), (30, 10)],
    # Quality: higher ROE / ROCE = higher score
    "roe":         [(0, 0), (8, 3), (15, 7), (22, 9), (35, 10)],
    "roce":        [(0, 0), (10, 4), (18, 7), (25, 9), (35, 10)],
    "op_margin":   [(0, 0), (8, 3), (15, 6), (25, 9), (40, 10)],
    # Health: lower D/E + healthy current ratio = higher score
    "de":          [(0, 10), (0.4, 8), (1, 5), (2, 2), (4, 0)],
    "current":     [(0.5, 0), (1, 4), (1.5, 7), (2.5, 9), (4, 10)],
    # Income: higher dividend yield = higher score
    "div_yield":   [(0, 0), (1, 3), (2.5, 6), (5, 9), (8, 10)],
}


# ===================================================================
# 5D SNOWFLAKE
# ===================================================================

def snowflake_5d(canonical_symbol: str) -> dict:
    """
    Returns:
      {
        symbol, name,
        axes: {
          value:   {score, why},
          growth:  {score, why},
          quality: {score, why},
          health:  {score, why},
          income:  {score, why},
        },
        overall: <average of the five>,
      }
    """
    fund = screener_client.fundamentals(canonical_symbol) or {}
    cagr = fundamentals_extras.cagr(canonical_symbol) or {}

    pe        = fund.get("pe")
    pb        = fund.get("pb")
    roe       = fund.get("roe")
    roce      = fund.get("roce")
    op_margin = fund.get("operating_margin")
    de        = fund.get("debt_to_equity")
    current   = fund.get("current_ratio")
    div_yield = fund.get("dividend_yield")
    sales_5y  = (cagr.get("sales") or {}).get("5y")
    profit_5y = (cagr.get("net_profit") or {}).get("5y")

    # Each axis: combine its sub-scores (mean of available); record why.
    def _avg(parts: list[float | None]) -> float | None:
        good = [p for p in parts if p is not None]
        return round(sum(good) / len(good), 1) if good else None

    val_pe = _band_inv(pe, BANDS["pe"])
    val_pb = _band_inv(pb, BANDS["pb"])
    value_score = _avg([val_pe, val_pb])
    value_why = (
        f"P/E {pe} (band->{val_pe}), P/B {pb} (band->{val_pb})"
        if (pe is not None or pb is not None) else "no P/E or P/B available"
    )

    g_sales  = _band(sales_5y,  BANDS["cagr"])
    g_profit = _band(profit_5y, BANDS["cagr"])
    growth_score = _avg([g_sales, g_profit])
    growth_why = (
        f"5y Sales CAGR {sales_5y}% (->{g_sales}), 5y Profit CAGR {profit_5y}% (->{g_profit})"
        if (sales_5y is not None or profit_5y is not None) else "no 5y CAGR available"
    )

    q_roe  = _band(roe,       BANDS["roe"])
    q_roce = _band(roce,      BANDS["roce"])
    q_om   = _band(op_margin, BANDS["op_margin"])
    quality_score = _avg([q_roe, q_roce, q_om])
    quality_why = f"ROE {roe}% (->{q_roe}), ROCE {roce}% (->{q_roce}), OPM {op_margin}% (->{q_om})"

    h_de   = _band_inv(de, BANDS["de"])
    h_curr = _band(current, BANDS["current"])
    health_score = _avg([h_de, h_curr])
    health_why = f"D/E {de} (->{h_de}), Current ratio {current} (->{h_curr})"

    income_score = _band(div_yield, BANDS["div_yield"])
    income_why = (
        f"Dividend yield {div_yield}% (->{income_score})"
        if div_yield is not None else "no dividend yield available"
    )

    overall = _avg([value_score, growth_score, quality_score, health_score, income_score])

    return {
        "symbol": canonical_symbol,
        "name": fund.get("name"),
        "axes": {
            "value":   {"score": value_score,   "why": value_why},
            "growth":  {"score": growth_score,  "why": growth_why},
            "quality": {"score": quality_score, "why": quality_why},
            "health":  {"score": health_score,  "why": health_why},
            "income":  {"score": income_score,  "why": income_why},
        },
        "overall": overall,
    }


# ===================================================================
# CONFIDENCE DIAL
# ===================================================================

def confidence_dial(canonical_symbol: str) -> dict:
    """
    How confident is Chitti in the data + verdict for this symbol?

    Components (each 0..10):
      - completeness: how many of the 9 key ratios are non-None
      - history_depth: 10y > 5y > 3y CAGR availability
      - growth_consistency: 3y vs 5y net-profit CAGR alignment
        (large gap -> erratic earnings -> lower confidence)
      - margin_stability: operating margin alongside ROE (both present + healthy)
    """
    fund = screener_client.fundamentals(canonical_symbol) or {}
    cagr = fundamentals_extras.cagr(canonical_symbol) or {}

    key_fields = ["pe", "pb", "roe", "roce", "operating_margin",
                  "debt_to_equity", "current_ratio", "dividend_yield",
                  "market_cap"]
    have = sum(1 for k in key_fields if fund.get(k) is not None)
    completeness = round(have / len(key_fields) * 10, 1)

    # History depth — 10y best, 5y good, 3y minimum
    np_b = (cagr.get("net_profit") or {})
    if np_b.get("10y") is not None: history_depth = 10.0
    elif np_b.get("5y") is not None: history_depth = 7.0
    elif np_b.get("3y") is not None: history_depth = 4.0
    else: history_depth = 0.0

    # Growth consistency — gap between 3y and 5y net profit CAGR
    g3, g5 = np_b.get("3y"), np_b.get("5y")
    if g3 is None or g5 is None:
        growth_consistency = None
    else:
        gap = abs(g3 - g5)
        # gap 0 -> 10, gap 30+ -> 0
        growth_consistency = max(0.0, round(10 - gap / 3, 1))

    om = fund.get("operating_margin")
    roe = fund.get("roe")
    if om is None or roe is None:
        margin_stability = None
    elif om > 12 and roe > 12:
        margin_stability = 9.0
    elif om > 8 and roe > 8:
        margin_stability = 7.0
    elif om > 0 and roe > 0:
        margin_stability = 5.0
    else:
        margin_stability = 2.0

    parts = [completeness, history_depth, growth_consistency, margin_stability]
    valid = [p for p in parts if p is not None]
    overall = round(sum(valid) / len(valid), 1) if valid else 0.0

    reasons: list[str] = []
    if completeness < 6: reasons.append(f"Only {have} of {len(key_fields)} key ratios available — data thin.")
    else:                reasons.append(f"{have} of {len(key_fields)} key ratios populated — solid base.")
    if history_depth >= 7: reasons.append("5y+ history available — trend is real, not noise.")
    elif history_depth > 0: reasons.append("Limited history — verdict relies on short-window numbers.")
    else: reasons.append("No usable historical CAGR — recent listing or scraper gap.")
    if growth_consistency is not None:
        if growth_consistency >= 7: reasons.append("3y and 5y profit CAGR agree — earnings are stable.")
        else: reasons.append(f"3y CAGR {g3}% vs 5y CAGR {g5}% — earnings are uneven, treat with caution.")
    if margin_stability is not None and margin_stability >= 7:
        reasons.append("Healthy operating margin + ROE — quality is real.")
    elif margin_stability is not None and margin_stability < 5:
        reasons.append("Thin or negative margins — quality verdict is shaky.")

    return {
        "symbol": canonical_symbol,
        "name": fund.get("name"),
        "score_0_10": overall,
        "components": {
            "completeness":        completeness,
            "history_depth":       history_depth,
            "growth_consistency":  growth_consistency,
            "margin_stability":    margin_stability,
        },
        "reasons": reasons,
    }


# ===================================================================
# RISK-FIT DIAL
# ===================================================================

PERSONA_RULES = {
    "conservative": {
        "label": "Conservative",
        "rules": [
            ("D/E ≤ 0.5",         lambda f: (f.get("debt_to_equity") or 999) <= 0.5),
            ("Dividend yield ≥ 2%", lambda f: (f.get("dividend_yield") or 0)   >= 2),
            ("ROE ≥ 12%",         lambda f: (f.get("roe") or 0)                >= 12),
            ("Beta ≤ 1.0",        lambda f: (f.get("beta") or 99)              <= 1.0),
            ("Current ratio ≥ 1.5", lambda f: (f.get("current_ratio") or 0)    >= 1.5),
        ],
    },
    "moderate": {
        "label": "Moderate",
        "rules": [
            ("D/E ≤ 1.0",         lambda f: (f.get("debt_to_equity") or 999) <= 1.0),
            ("ROE ≥ 10%",         lambda f: (f.get("roe") or 0)                >= 10),
            ("Current ratio ≥ 1.2", lambda f: (f.get("current_ratio") or 0)    >= 1.2),
            ("Operating margin ≥ 8%", lambda f: (f.get("operating_margin") or 0) >= 8),
        ],
    },
    "aggressive": {
        "label": "Aggressive",
        "rules": [
            ("ROE ≥ 8%",          lambda f: (f.get("roe") or 0)                >= 8),
            ("Operating margin ≥ 5%", lambda f: (f.get("operating_margin") or 0) >= 5),
            ("Market cap > ₹500cr (not micro)", lambda f: (f.get("market_cap") or 0) > 5e9),
        ],
    },
}


def risk_fit(canonical_symbol: str, persona: str = "moderate") -> dict:
    persona = (persona or "moderate").lower().strip()
    rules = PERSONA_RULES.get(persona) or PERSONA_RULES["moderate"]
    fund = screener_client.fundamentals(canonical_symbol) or {}
    cagr = fundamentals_extras.cagr(canonical_symbol) or {}

    if persona == "aggressive":
        sales_5y = (cagr.get("sales") or {}).get("5y")
        np_5y    = (cagr.get("net_profit") or {}).get("5y")
        extra: list[tuple[str, bool]] = [
            ("5y Sales CAGR ≥ 15%",     (sales_5y is not None and sales_5y >= 15)),
            ("5y Net Profit CAGR ≥ 15%", (np_5y    is not None and np_5y    >= 15)),
        ]
    else:
        extra = []

    checks: list[dict] = []
    passed = 0
    for label, predicate in rules["rules"]:
        ok = bool(predicate(fund))
        checks.append({"rule": label, "pass": ok})
        if ok: passed += 1
    for label, ok in extra:
        checks.append({"rule": label, "pass": ok})
        if ok: passed += 1

    total = len(checks)
    pct = (passed / total * 100) if total else 0
    if   pct >= 80: verdict = "FITS"
    elif pct >= 50: verdict = "PARTIAL FIT"
    else:           verdict = "DOES NOT FIT"

    return {
        "symbol": canonical_symbol,
        "name": fund.get("name"),
        "persona": rules["label"],
        "verdict": verdict,
        "passed": passed,
        "total": total,
        "score_pct": round(pct, 0),
        "checks": checks,
    }
