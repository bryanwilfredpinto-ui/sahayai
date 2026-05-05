"""
services/news_client.py
-----------------------
Fetches recent market news for the in-app News tab.

Sources (all free):
  - Moneycontrol RSS  (primary; works reliably from cloud IPs)
  - LiveMint RSS      (fallback)
  - BSE corporate filings RSS (best-effort; sometimes blocked)
  - NSE corporate announcements JSON (best-effort; often blocked)

Failures are silent — caller gets an empty list. Frontend
(chitti_fundamentals.html News tab) shows "no news right now".

Cached 10 min in-process — see TTL.
"""
from __future__ import annotations

import logging
import time
import xml.etree.ElementTree as ET

import httpx

log = logging.getLogger("news_client")

USER_AGENT = "Mozilla/5.0 (compatible; ChittiShares/1.0; +https://shares.sahayai.in)"
_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "application/xml, application/json, text/xml, */*",
}

RSS_FEEDS = [
    ("Moneycontrol", "https://www.moneycontrol.com/rss/marketsnews.xml"),
    ("Moneycontrol", "https://www.moneycontrol.com/rss/business.xml"),
    ("LiveMint",     "https://www.livemint.com/rss/markets"),
    ("BSE",          "https://api.bseindia.com/RssFeed/RssFeed_announcement.aspx"),
]

NSE_HOMEPAGE   = "https://www.nseindia.com"
NSE_JSON_FEED  = "https://www.nseindia.com/api/corporate-announcements?index=equities"

_cache: dict = {"items": None, "ts": 0.0}
TTL = 600  # 10 min


# ─────────────────────────────────────────────────────────────
# HTTP helpers
# ─────────────────────────────────────────────────────────────
def _http_get(url: str, timeout: float = 8.0) -> bytes | None:
    try:
        with httpx.Client(headers=_HEADERS, timeout=timeout, follow_redirects=True) as c:
            r = c.get(url)
            if r.status_code == 200:
                return r.content
            log.debug("news_client GET %s -> %s", url, r.status_code)
    except Exception as e:  # noqa: BLE001
        log.debug("news_client GET %s -> %s", url, e)
    return None


def _parse_rss(content: bytes, source: str) -> list[dict]:
    try:
        root = ET.fromstring(content)
    except ET.ParseError as e:
        log.debug("RSS parse error from %s: %s", source, e)
        return []
    out: list[dict] = []

    # RSS 2.0
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        date  = (item.findtext("pubDate") or "").strip()
        link  = (item.findtext("link") or "").strip()
        if title:
            out.append({
                "symbol": None,
                "headline": title,
                "date": date,
                "source": source,
                "link": link,
            })

    # Atom fallback
    if not out:
        ns = {"a": "http://www.w3.org/2005/Atom"}
        for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):
            title = (entry.findtext("a:title", default="", namespaces=ns) or "").strip()
            date  = (entry.findtext("a:updated", default="", namespaces=ns) or "").strip()
            link_el = entry.find("a:link", namespaces=ns)
            link = link_el.get("href") if link_el is not None else ""
            if title:
                out.append({
                    "symbol": None,
                    "headline": title,
                    "date": date,
                    "source": source,
                    "link": link,
                })
    return out


def _fetch_nse_json() -> list[dict]:
    """NSE JSON endpoint — needs a warm cookie. Often blocked from cloud IPs."""
    try:
        with httpx.Client(headers=_HEADERS, timeout=8.0, follow_redirects=True) as client:
            try:
                client.get(NSE_HOMEPAGE, timeout=5.0)  # warm cookie
            except Exception:  # noqa: BLE001
                pass
            r = client.get(NSE_JSON_FEED)
            if r.status_code != 200:
                return []
            data = r.json()
            out: list[dict] = []
            for item in (data.get("data") or [])[:50]:
                title = (item.get("subject") or item.get("desc") or "").strip()
                if not title:
                    continue
                out.append({
                    "symbol":   (item.get("symbol") or None),
                    "headline": title,
                    "date":     (item.get("an_dt") or "").strip(),
                    "source":   "NSE",
                    "link":     (item.get("attchmntFile") or ""),
                })
            return out
    except Exception as e:  # noqa: BLE001
        log.debug("NSE JSON feed failed: %s", e)
        return []


# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────
def fetch_market_news(limit: int = 20) -> list[dict]:
    """
    Top market-moving headlines, newest first, deduped.

    Each item: {symbol, headline, date, source, link}.
    """
    now = time.time()
    if _cache["items"] is not None and now - _cache["ts"] < TTL:
        return _cache["items"][:limit]

    items: list[dict] = []
    for source, url in RSS_FEEDS:
        content = _http_get(url)
        if content:
            items.extend(_parse_rss(content, source))
    items.extend(_fetch_nse_json())

    # Dedupe by lowered headline
    seen: set[str] = set()
    deduped: list[dict] = []
    for it in items:
        h = (it.get("headline") or "").strip().lower()
        if not h or h in seen:
            continue
        seen.add(h)
        deduped.append(it)

    _cache["items"] = deduped
    _cache["ts"]    = now
    return deduped[:limit]


def fetch_stock_news(symbol: str, limit: int = 10) -> list[dict]:
    """
    Filter market news for headlines that mention the stock symbol.
    Substring match on the headline + exact match on the symbol field.
    """
    sym_short = (symbol.split(":")[-1] if ":" in symbol else symbol).strip().upper()
    if not sym_short:
        return []
    items = fetch_market_news(limit=200)
    matching: list[dict] = []
    for it in items:
        headline = (it.get("headline") or "").upper()
        sy       = (it.get("symbol") or "").upper()
        if sym_short in headline or sy == sym_short:
            matching.append(it)
    return matching[:limit]
