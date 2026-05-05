"""
services/screener_client.py
---------------------------
Scrapes screener.in for fundamental data.

Why this exists:
  yfinance is blocked from Render's egress IPs (returns empty body
  → "Expecting value: line 1 column 1"). Master spec locks
  screener.in as the free-tier source for Indian fundamentals.

Public API (mirrors yahoo_client shape so callers can swap):
  fundamentals(canonical_symbol) -> dict
  quarterly(canonical_symbol, num_quarters=8) -> list[dict]

HTML parsing is regex-based on screener's stable structure. No
BeautifulSoup dependency — keeps the deploy lean.
"""
from __future__ import annotations

import logging
import re
from typing import Optional

import httpx

log = logging.getLogger("screener_client")

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-IN,en;q=0.9",
}

_NUM = r"-?[\d,]+\.?\d*"


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────
def _to_ticker(canonical: str) -> str:
    """NSE:RELIANCE → RELIANCE; BSE:SENSEX → SENSEX."""
    if not canonical:
        return ""
    return canonical.split(":")[-1].strip().upper()


def _to_float(s: str | None) -> Optional[float]:
    if s is None:
        return None
    try:
        return float(s.strip().replace(",", ""))
    except (ValueError, AttributeError):
        return None


def _fetch_html(ticker: str) -> Optional[str]:
    """Try /consolidated/ first, fall back to standard."""
    if not ticker:
        return None
    for path in ("consolidated/", ""):
        url = f"https://www.screener.in/company/{ticker}/{path}"
        try:
            with httpx.Client(headers=HEADERS, timeout=12.0, follow_redirects=True) as c:
                r = c.get(url)
                if r.status_code == 200 and len(r.text) > 1000:
                    return r.text
                log.debug("screener %s -> %s", url, r.status_code)
        except Exception as e:  # noqa: BLE001
            log.debug("screener fetch %s failed: %s", url, e)
    return None


def _extract_top_ratios(html: str) -> dict:
    """
    Returns {label: float} from the #top-ratios <ul>.
    Handles labels like "Market Cap", "Stock P/E", "ROE", "ROCE",
    "Book Value", "Dividend Yield", "Current Price", "High / Low",
    "Face Value", "Debt to equity".
    """
    out: dict = {}
    m = re.search(
        r'<ul[^>]*id="top-ratios"[^>]*>(.*?)</ul>',
        html, re.DOTALL | re.IGNORECASE,
    )
    if not m:
        return out
    ul = m.group(1)
    items = re.findall(
        r'<li[^>]*>\s*<span[^>]*class="name"[^>]*>(.*?)</span>(.*?)</li>',
        ul, re.DOTALL | re.IGNORECASE,
    )
    for label_html, body_html in items:
        label = re.sub(r"<[^>]+>", "", label_html).strip().rstrip(":")
        # Most cells: <span class="number">12.34</span>
        nm = re.search(r'class="number"[^>]*>\s*(' + _NUM + r")", body_html)
        if nm:
            v = _to_float(nm.group(1))
            if v is not None:
                out[label] = v
        # High / Low has TWO numbers — capture both
        if label.lower().startswith("high"):
            both = re.findall(r'class="number"[^>]*>\s*(' + _NUM + r")", body_html)
            if len(both) >= 2:
                out["__high"] = _to_float(both[0])
                out["__low"] = _to_float(both[1])
    return out


def _extract_company_meta(html: str) -> dict:
    """Pull company name + sector / industry from the header."""
    name = None
    sector = None
    industry = None
    nm = re.search(r"<h1[^>]*>\s*([^<]+?)\s*</h1>", html)
    if nm:
        name = nm.group(1).strip()
    # Sector & industry typically under <a href="/sector/.../>
    sm = re.search(
        r'<a[^>]*href="/sector/[^"]+"[^>]*>([^<]+)</a>',
        html, re.IGNORECASE,
    )
    if sm:
        sector = sm.group(1).strip()
    # Industry hint near the top of the page
    im = re.search(
        r"Industry[^<]*<[^>]*>\s*([^<]+?)\s*<", html, re.IGNORECASE,
    )
    if im:
        industry = im.group(1).strip()
    return {"name": name, "sector": sector, "industry": industry}


def _extract_table_section(html: str, section_id: str) -> Optional[str]:
    """Returns the raw HTML inside <section id="X">…</section>."""
    m = re.search(
        rf'<section[^>]*id="{re.escape(section_id)}"[^>]*>(.*?)</section>',
        html, re.DOTALL | re.IGNORECASE,
    )
    return m.group(1) if m else None


def _table_row_values(section: str, row_label_regex: str) -> list[float | None]:
    """
    Find the row whose first <td> text matches `row_label_regex` and
    return numeric values from the remaining <td>s.

    screener wraps row labels in nested <button>/<span> tags, so we
    iterate every <tr>, strip tags from the first cell, and substring-
    match the cleaned text.
    """
    label_pat = re.compile(row_label_regex, re.IGNORECASE)
    for tr_match in re.finditer(r"<tr[^>]*>(.*?)</tr>", section, re.DOTALL):
        tr = tr_match.group(1)
        first_td = re.match(r"\s*<td[^>]*>(.*?)</td>", tr, re.DOTALL)
        if not first_td:
            continue
        td_text = re.sub(r"<[^>]+>", "", first_td.group(1)).strip()
        if label_pat.search(td_text):
            rest = tr[len(first_td.group(0)):]
            cells = re.findall(r"<td[^>]*>\s*(" + _NUM + r")\s*</td>", rest)
            return [_to_float(c) for c in cells]
    return []


def _quarter_headers(section: str) -> list[str]:
    return re.findall(r"<th[^>]*>\s*(\w+ \d{4})\s*</th>", section)


# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────
def fundamentals(canonical_symbol: str) -> dict:
    """
    Return the fundamentals scorecard inputs in the same shape as
    yahoo_client.fundamentals(). Missing fields → None.

    Crore values (Market Cap) are converted to INR (× 1e7) so the
    rest of the app can format them with the same _fmtCr() helper.
    """
    ticker = _to_ticker(canonical_symbol)
    if not ticker:
        return {}
    html = _fetch_html(ticker)
    if not html:
        log.warning("screener: no HTML for %s", ticker)
        return {}

    ratios = _extract_top_ratios(html)
    meta = _extract_company_meta(html)

    market_cap_cr = ratios.get("Market Cap")
    book_value = ratios.get("Book Value")
    price = ratios.get("Current Price")

    out: dict = {
        "name": meta.get("name"),
        "sector": meta.get("sector"),
        "industry": meta.get("industry"),
        "currency": "INR",
        "market_cap": (market_cap_cr * 1e7) if market_cap_cr else None,
        "pe": ratios.get("Stock P/E"),
        "forward_pe": None,                      # not on screener
        "pb": None,                              # derived below
        "eps": ratios.get("EPS"),
        "dividend_yield": ratios.get("Dividend Yield"),
        "roe": ratios.get("ROE"),
        "roa": None,                             # not on screener top
        "debt_to_equity": ratios.get("Debt to equity"),
        "revenue_growth": None,                  # derived from quarterly below
        "earnings_growth": None,                 # derived from quarterly below
        "profit_margin": None,                   # derived from quarterly below
        "operating_margin": ratios.get("OPM"),
        "current_ratio": None,
        "quick_ratio": None,
        "book_value": book_value,
        "price": price,
        "fifty_two_week_high": ratios.get("__high"),
        "fifty_two_week_low":  ratios.get("__low"),
        "beta": None,
        "ev_to_ebitda": None,
        "peg_ratio": None,
        "shares_outstanding": None,
        "roce": ratios.get("ROCE"),
    }

    # Derive P/B = price / book_value
    if price and book_value and book_value > 0:
        out["pb"] = round(price / book_value, 2)

    # Derive growth + margin from quarterly section
    qsec = _extract_table_section(html, "quarters")
    psec = _extract_table_section(html, "profit-loss")
    rev_q = _table_row_values(qsec, r"Sales|Revenue") if qsec else []
    np_q  = _table_row_values(qsec, r"Net Profit") if qsec else []

    # Latest YoY: most recent quarter vs same quarter previous year (4 back)
    if len(rev_q) >= 5 and rev_q[-1] and rev_q[-5]:
        out["revenue_growth"] = round((rev_q[-1] - rev_q[-5]) / abs(rev_q[-5]) * 100, 2)
    if len(np_q) >= 5 and np_q[-1] is not None and np_q[-5] not in (None, 0):
        out["earnings_growth"] = round((np_q[-1] - np_q[-5]) / abs(np_q[-5]) * 100, 2)

    # Net profit margin (latest quarter)
    if rev_q and np_q and rev_q[-1] and np_q[-1] is not None and rev_q[-1] != 0:
        out["profit_margin"] = round(np_q[-1] / rev_q[-1] * 100, 2)

    return out


def quarterly(canonical_symbol: str, num_quarters: int = 8) -> list[dict]:
    """
    Last N quarters of revenue / net profit / operating profit.
    Newest first, in INR (Crore × 1e7).
    """
    ticker = _to_ticker(canonical_symbol)
    if not ticker:
        return []
    html = _fetch_html(ticker)
    if not html:
        return []
    qsec = _extract_table_section(html, "quarters")
    if not qsec:
        return []

    headers = _quarter_headers(qsec)
    revenue = _table_row_values(qsec, r"Sales|Revenue")
    netprof = _table_row_values(qsec, r"Net Profit")
    opprof  = _table_row_values(qsec, r"Operating Profit")

    if not headers:
        return []

    n = min(len(headers), num_quarters)
    # Source is oldest-first; reverse + slice to take the latest N
    pairs = list(zip(headers, revenue, netprof, opprof))[-n:][::-1]
    out = []
    for q, rev, np_, op in pairs:
        out.append({
            "quarter": q,
            "quarter_iso": q,
            "revenue":          (rev * 1e7) if rev is not None else None,
            "net_income":       (np_ * 1e7) if np_ is not None else None,
            "operating_income": (op * 1e7) if op is not None else None,
            "free_cash_flow": None,
            "operating_cash_flow": None,
            "total_debt": None,
        })
    return out
