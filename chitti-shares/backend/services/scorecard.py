"""
services/scorecard.py
---------------------
Turn raw fundamentals into a grade (A+/A/B/C/D/F) per metric and an
overall score 0-100.

Thresholds tuned for Indian large/mid caps. Weak by US standards but
matches what Indian retail traders see on screener.in / tickertape.
"""

# (metric, "higher is better" or "lower is better", thresholds for [A+, A, B, C, D])
RULES = {
    "roe":            ("higher", [25, 18, 12, 8, 5]),     # %
    "roce":           ("higher", [25, 18, 14, 10, 6]),    # %
    "revenue_growth": ("higher", [25, 15, 8, 3, 0]),       # % YoY
    "earnings_growth":("higher", [30, 18, 10, 3, 0]),
    "profit_margin":  ("higher", [20, 12, 8, 4, 0]),
    "debt_to_equity": ("lower",  [0.3, 0.6, 1.0, 1.5, 2.5]),
    "pe":             ("lower",  [12, 18, 25, 35, 50]),
    "pb":             ("lower",  [1.5, 2.5, 4, 6, 10]),
    "current_ratio":  ("higher", [2.0, 1.5, 1.2, 1.0, 0.8]),
}

GRADE_TO_POINTS = {"A+": 100, "A": 85, "B": 70, "C": 55, "D": 40, "F": 20, "—": None}


def grade_metric(metric: str, value):
    if value is None:
        return "—"
    rule = RULES.get(metric)
    if not rule:
        return "—"
    direction, ts = rule
    if direction == "higher":
        if value >= ts[0]: return "A+"
        if value >= ts[1]: return "A"
        if value >= ts[2]: return "B"
        if value >= ts[3]: return "C"
        if value >= ts[4]: return "D"
        return "F"
    else:  # lower
        if value <= ts[0]: return "A+"
        if value <= ts[1]: return "A"
        if value <= ts[2]: return "B"
        if value <= ts[3]: return "C"
        if value <= ts[4]: return "D"
        return "F"


def build_scorecard(fund: dict) -> dict:
    """
    Input: dict from yahoo_client.fundamentals().
    Output: { metrics: [{name, label, value, unit, grade}], overall_score, overall_grade }
    """
    metric_defs = [
        ("roe", "Return on Equity (ROE)", "%", fund.get("roe")),
        ("roce", "Return on Capital (ROCE)", "%", fund.get("roce")),
        ("revenue_growth", "Revenue Growth (YoY)", "%", fund.get("revenue_growth")),
        ("earnings_growth", "Earnings Growth (YoY)", "%", fund.get("earnings_growth")),
        ("profit_margin", "Net Profit Margin", "%", fund.get("profit_margin")),
        ("debt_to_equity", "Debt to Equity", "x", fund.get("debt_to_equity")),
        ("pe", "P/E Ratio", "x", fund.get("pe")),
        ("pb", "P/B Ratio", "x", fund.get("pb")),
        ("current_ratio", "Current Ratio", "x", fund.get("current_ratio")),
    ]

    metrics = []
    points = []
    for key, label, unit, value in metric_defs:
        g = grade_metric(key, value)
        metrics.append({
            "name": key,
            "label": label,
            "value": value,
            "unit": unit,
            "grade": g,
        })
        p = GRADE_TO_POINTS[g]
        if p is not None:
            points.append(p)

    overall_score = round(sum(points) / len(points)) if points else None
    overall_grade = (
        "A+" if overall_score is not None and overall_score >= 90 else
        "A" if overall_score is not None and overall_score >= 80 else
        "B" if overall_score is not None and overall_score >= 65 else
        "C" if overall_score is not None and overall_score >= 50 else
        "D" if overall_score is not None and overall_score >= 35 else
        "F" if overall_score is not None else "—"
    )

    return {
        "metrics": metrics,
        "overall_score": overall_score,
        "overall_grade": overall_grade,
    }


def quarterly_summary(quarters: list[dict]) -> dict:
    """
    Returns { star_rating: 1-5, revenue_trend: 'up/down/flat',
              profit_trend: 'up/down/flat', latest: {...} }
    Reads latest 4 quarters, compares to the 4 before.
    """
    if not quarters:
        return {"star_rating": None, "revenue_trend": "—", "profit_trend": "—", "latest": None}

    # newest first
    recent = quarters[:4]
    older = quarters[4:8]

    def sum_of(field, rows):
        vals = [r.get(field) for r in rows if r.get(field) is not None]
        return sum(vals) if vals else None

    rev_recent = sum_of("revenue", recent)
    rev_older = sum_of("revenue", older)
    profit_recent = sum_of("net_income", recent)
    profit_older = sum_of("net_income", older)

    def trend(a, b):
        if a is None or b is None or b == 0:
            return "—"
        delta = (a - b) / abs(b) * 100
        if delta > 5: return "up"
        if delta < -5: return "down"
        return "flat"

    rev_t = trend(rev_recent, rev_older)
    pr_t = trend(profit_recent, profit_older)

    # Star rating: count positive signals
    score = 0
    if rev_t == "up": score += 2
    elif rev_t == "flat": score += 1
    if pr_t == "up": score += 2
    elif pr_t == "flat": score += 1
    # Bonus: latest quarter is profit-positive
    if recent and recent[0].get("net_income") and recent[0]["net_income"] > 0:
        score += 1
    star_rating = max(1, min(5, score))

    return {
        "star_rating": star_rating,
        "revenue_trend": rev_t,
        "profit_trend": pr_t,
        "latest": recent[0] if recent else None,
        "all": quarters,
    }
