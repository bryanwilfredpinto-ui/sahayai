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
            # Allow optional trailing "%" so we capture OPM % / margin rows.
            cells = re.findall(r"<td[^>]*>\s*(" + _NUM + r")\s*%?\s*</td>", rest)
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
        "debt_to_equity": ratios.get("Debt to equity") or ratios.get("Debt / Equity"),
        "revenue_growth": None,                  # derived from quarterly below
        "earnings_growth": None,                 # derived from quarterly below
        "profit_margin": None,                   # derived from quarterly below
        "operating_margin": ratios.get("OPM") or ratios.get("OPM Last Year"),
        "current_ratio": None,                   # derived from BS below
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

    # Operating margin fallback — read latest "OPM %" row from annual P&L
    # if the top-ratios block did not carry it.
    if out["operating_margin"] is None and psec:
        opm_y = _table_row_values(psec, r"OPM\s*%|OPM %")
        if opm_y:
            latest = next((v for v in reversed(opm_y) if v is not None), None)
            if latest is not None:
                out["operating_margin"] = round(latest, 2)

    # Debt/Equity fallback — derive from latest annual balance sheet:
    #   D/E = Borrowings / (Reserves + Equity Capital).
    bsec = _extract_table_section(html, "balance-sheet")
    if out["debt_to_equity"] is None and bsec:
        borrow = _table_row_values(bsec, r"^Borrowings|Borrowings\b")
        reserves = _table_row_values(bsec, r"^Reserves|Reserves\b")
        equity = _table_row_values(bsec, r"Equity\s*Capital|Share\s*Capital")
        latest_b = next((v for v in reversed(borrow)   if v is not None), None) if borrow   else None
        latest_r = next((v for v in reversed(reserves) if v is not None), None) if reserves else None
        latest_e = next((v for v in reversed(equity)   if v is not None), None) if equity   else None
        denom = (latest_r or 0) + (latest_e or 0)
        if latest_b is not None and denom > 0:
            out["debt_to_equity"] = round(latest_b / denom, 2)

    # Current ratio fallback — derive from latest annual balance sheet:
    #   CR = Other Assets / Other Liabilities (approximation; screener does
    #   not break out current vs non-current cleanly, so this is the
    #   non-fixed-asset / non-equity-debt residual on each side. Adequate
    #   for a 0..10 health-axis band but tagged as approximate downstream).
    if bsec:
        oth_a = _table_row_values(bsec, r"Other\s*Assets")
        oth_l = _table_row_values(bsec, r"Other\s*Liabilities")
        latest_oa = next((v for v in reversed(oth_a) if v is not None), None) if oth_a else None
        latest_ol = next((v for v in reversed(oth_l) if v is not None), None) if oth_l else None
        if latest_oa is not None and latest_ol and latest_ol > 0:
            out["current_ratio"] = round(latest_oa / latest_ol, 2)

    return out


def _year_headers(section: str) -> list[str]:
    """Annual sections use headers like 'Mar 2018', 'Mar 2019', etc."""
    return re.findall(r"<th[^>]*>\s*(Mar \d{4})\s*</th>", section)


def _extract_full_table(html: str, section_id: str) -> Optional[dict]:
    """
    Pull the whole table from a screener section. Returns
    {headers: [..], rows: [{label, values: [..]}, ..]} or None.
    Quarterly and annual sections share the same markup.
    """
    section = _extract_table_section(html, section_id)
    if not section:
        return None
    headers = _quarter_headers(section)
    if not headers:
        headers = _year_headers(section)
    if not headers:
        return None

    rows: list[dict] = []
    for tr_match in re.finditer(r"<tr[^>]*>(.*?)</tr>", section, re.DOTALL):
        tr = tr_match.group(1)
        first_td = re.match(r"\s*<td[^>]*>(.*?)</td>", tr, re.DOTALL)
        if not first_td:
            continue
        label = re.sub(r"<[^>]+>", "", first_td.group(1)).strip()
        # Strip trailing + or - (expand toggles), and any % suffix on the label
        label = re.sub(r"[\s+\-]+$", "", label).strip()
        if not label:
            continue
        rest = tr[len(first_td.group(0)):]
        cell_strs = re.findall(r"<td[^>]*>\s*([^<]+?)\s*</td>", rest)
        values: list[Optional[float]] = []
        for c in cell_strs:
            c2 = c.strip().replace(",", "").replace("%", "").replace("\xa0", "")
            try:
                values.append(float(c2))
            except ValueError:
                values.append(None)
        # Skip rows with no numeric data
        if any(v is not None for v in values):
            rows.append({"label": label, "values": values})
    return {"headers": headers, "rows": rows}


def _aggregate_halfyearly(qtable: Optional[dict]) -> Optional[dict]:
    """
    Pair quarterly columns into half-year buckets (Q1+Q2, Q3+Q4) for
    P&L-style flow items. Indian fiscal year (Apr-Mar): Jun+Sep = H1,
    Dec + next year's Mar = H2.

    Half-year aggregation only makes sense for FLOW items (sales,
    expenses, profit) — never for STOCK items (assets, debt). The
    caller should only use this on the quarterly P&L table.
    """
    if not qtable or not qtable.get("headers"):
        return None
    headers = qtable["headers"]
    # Build pairs by walking the headers and pairing into 6-month blocks.
    # We honour Indian fiscal year by anchoring on Sep (end of H1) and Mar (end of H2).
    new_headers: list[str] = []
    pair_indices: list[tuple[int, int]] = []
    i = 0
    while i < len(headers) - 1:
        h1 = headers[i]
        h2 = headers[i + 1]
        # Label uses the second (closing) month
        end_month = h2.split()[0]
        end_year  = h2.split()[1] if len(h2.split()) > 1 else ""
        if end_month in ("Sep",):
            label = f"H1 FY{end_year[-2:]}"
        elif end_month == "Mar":
            label = f"H2 FY{end_year[-2:]}"
        else:
            label = f"{h1.split()[0][:3]}–{h2.split()[0][:3]} {end_year}"
        new_headers.append(label)
        pair_indices.append((i, i + 1))
        i += 2

    new_rows: list[dict] = []
    for row in qtable["rows"]:
        vals = row["values"]
        agg: list[Optional[float]] = []
        for pi, pj in pair_indices:
            v1 = vals[pi] if pi < len(vals) else None
            v2 = vals[pj] if pj < len(vals) else None
            if v1 is None or v2 is None:
                agg.append(None)
            else:
                agg.append(round(v1 + v2, 2))
        if any(v is not None for v in agg):
            new_rows.append({"label": row["label"], "values": agg})
    return {"headers": new_headers, "rows": new_rows}


def financials(canonical_symbol: str) -> dict:
    """
    Full financial statements matrix:
      quarterly: { pl, bs, cf }
      halfyearly: { pl (derived), bs (None), cf (None) }
      yearly: { pl, bs, cf }
    Each non-None value is { headers: [..], rows: [{label, values: [..]}] }.

    Half-yearly BS / CF are None — they are stock / period flows that
    cannot be summed cleanly from quarterly without independent reporting.
    """
    ticker = _to_ticker(canonical_symbol)
    if not ticker:
        return {}
    html = _fetch_html(ticker)
    if not html:
        return {}

    q_pl = _extract_full_table(html, "quarters")
    y_pl = _extract_full_table(html, "profit-loss")
    y_bs = _extract_full_table(html, "balance-sheet")
    y_cf = _extract_full_table(html, "cash-flow")
    h_pl = _aggregate_halfyearly(q_pl)

    return {
        "name": _extract_company_meta(html).get("name"),
        "quarterly":  {"pl": q_pl, "bs": None, "cf": None},
        "halfyearly": {"pl": h_pl, "bs": None, "cf": None},
        "yearly":     {"pl": y_pl, "bs": y_bs, "cf": y_cf},
    }


def shareholding(canonical_symbol: str) -> dict:
    """
    Quarterly shareholding pattern from screener.in's 'shareholding' section.
    Standard rows: Promoters, FIIs, DIIs, Government, Public, Shareholders.
    Returns {headers: [..quarter labels..], rows: [{label, values: [..%..]}]}.
    """
    ticker = _to_ticker(canonical_symbol)
    if not ticker:
        return {}
    html = _fetch_html(ticker)
    if not html:
        return {}
    table = _extract_full_table(html, "shareholding")
    if not table:
        return {}
    return {
        "name": _extract_company_meta(html).get("name"),
        "headers": table["headers"],
        "rows": table["rows"],
    }


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
