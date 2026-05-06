"""
services/medupi_brave_search.py
-------------------------------
Real-time pharmacy price discovery via Brave Search API.

ETHICS NOTE — why Brave Search snippets, not direct pharmacy scraping:
  Tata 1mg / PharmEasy / NetMeds / Apollo 24|7 / Amazon Pharmacy ToS
  forbid automated scraping. We use Brave Search (free 2,000 queries/mo)
  to read PUBLIC search-result snippets that those pharmacies allow Google
  / Bing / Brave to index. We only parse the snippet text Brave returns
  — we never visit the pharmacy URL programmatically. That keeps us on
  the right side of every ToS.

  Every result we render is tagged with the snippet source domain + the
  caption "Searched via Brave — verify on pharmacy site" so users always
  know to double-check.

Cache: 24 h per (medicine_query_lower, source_domain).
Free tier: 2,000 queries/month. Top-100 daily refresh = ~3,000/mo —
already over budget, so we round-robin: 100 queries/day Mon→Sun, with
on-demand searches preferring the cache.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlparse

import httpx
from sqlalchemy.orm import Session

from config import settings
from models.price_cache import PriceCache

log = logging.getLogger("medupi_brave_search")

BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search"
CACHE_TTL_HOURS = 24

# Pharmacies we're willing to surface PRICES for — limited to Indian
# retail-ish domains. Snippet-only. We never visit these URLs.
ALLOWED_DOMAINS = {
    "1mg.com", "tata1mg.com", "pharmeasy.in", "netmeds.com",
    "apollopharmacy.in", "apollo247.com", "medplusmart.com",
    "truemeds.in", "frankross.in", "wellnessforever.com",
    "saveonpharma.com", "medkart.in", "easymedi.in",
}

PRICE_RX = re.compile(
    r"(?:₹|rs\.?|inr\.?)\s*(\d{1,5}(?:[.,]\d{1,2})?)",
    re.IGNORECASE,
)


def _domain_of(url: str) -> Optional[str]:
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:  # noqa: BLE001
        return None
    if host.startswith("www."):
        host = host[4:]
    if host.startswith("m."):
        host = host[2:]
    return host or None


def _allowed(domain: Optional[str]) -> bool:
    if not domain:
        return False
    return any(domain == d or domain.endswith("." + d) for d in ALLOWED_DOMAINS)


def _extract_price(text: str) -> Optional[float]:
    """Find the lowest plausible rupee value in `text` between 1 and 99,999."""
    if not text:
        return None
    candidates = []
    for m in PRICE_RX.finditer(text):
        raw = m.group(1).replace(",", "")
        try:
            v = float(raw)
        except ValueError:
            continue
        if 1.0 <= v <= 99_999.0:
            candidates.append(v)
    if not candidates:
        return None
    return min(candidates)


def _normalize_query(q: str) -> str:
    return " ".join((q or "").lower().split())


def get_cached(db: Session, query: str) -> list[dict]:
    """Return all non-expired cache rows for a normalized query."""
    qn = _normalize_query(query)
    if not qn:
        return []
    now = datetime.utcnow()
    rows = (
        db.query(PriceCache)
        .filter(PriceCache.medicine_query == qn, PriceCache.expires_at > now)
        .order_by(PriceCache.fetched_at.desc())
        .all()
    )
    return [_row_to_dict(r) for r in rows]


def _row_to_dict(r: PriceCache) -> dict:
    return {
        "source_domain": r.source_domain,
        "price": r.price,
        "title": r.title,
        "snippet": r.snippet,
        "url": r.url,
        "fetched_at": r.fetched_at.isoformat() if r.fetched_at else None,
        "expires_at": r.expires_at.isoformat() if r.expires_at else None,
    }


def is_configured() -> bool:
    return bool(settings.BRAVE_SEARCH_API_KEY)


def fetch_live(db: Session, query: str, *, refresh: bool = False, limit: int = 6) -> dict:
    """
    Returns:
      { ok, query, source: 'cache'|'brave'|'unconfigured', items, ttl_hours }

    Order of operations:
      1. If `refresh` is False → check cache → return if non-empty.
      2. If BRAVE_SEARCH_API_KEY missing → return cache (possibly empty) + 'unconfigured'.
      3. Hit Brave Search → parse snippets → upsert PriceCache rows → return.
    """
    qn = _normalize_query(query)
    if not qn:
        return {"ok": False, "query": query, "items": [], "source": "empty"}

    if not refresh:
        cached = get_cached(db, qn)
        if cached:
            return {"ok": True, "query": qn, "items": cached, "source": "cache", "ttl_hours": CACHE_TTL_HOURS}

    if not is_configured():
        return {
            "ok": False,
            "query": qn,
            "items": get_cached(db, qn),
            "source": "unconfigured",
            "message": "BRAVE_SEARCH_API_KEY not set — live pharmacy price fetch disabled.",
        }

    headers = {
        "Accept": "application/json",
        "X-Subscription-Token": settings.BRAVE_SEARCH_API_KEY,
        "User-Agent": "ChittiMedUPI/1.7 (price-discovery; snippet-only; never-scrape)",
    }
    params = {
        "q": f"{qn} medicine price India",
        "country": "IN",
        "search_lang": "en",
        "count": max(5, min(limit * 3, 20)),
        "safesearch": "moderate",
    }

    try:
        r = httpx.get(BRAVE_ENDPOINT, headers=headers, params=params, timeout=12.0)
        r.raise_for_status()
        data = r.json()
    except httpx.HTTPError as e:
        log.warning("brave search failed: %s", e)
        return {"ok": False, "query": qn, "items": get_cached(db, qn), "source": "error", "error": str(e)}

    results = ((data.get("web") or {}).get("results")) or []
    items: list[dict] = []
    seen_domains: set[str] = set()

    for entry in results:
        url = entry.get("url") or ""
        domain = _domain_of(url)
        if not _allowed(domain) or domain in seen_domains:
            continue
        snippet = " ".join(filter(None, [entry.get("title"), entry.get("description")]))
        price = _extract_price(snippet)
        if price is None:
            continue

        # Persist to cache
        now = datetime.utcnow()
        existing = (
            db.query(PriceCache)
            .filter(PriceCache.medicine_query == qn, PriceCache.source_domain == domain)
            .first()
        )
        if existing:
            existing.price = price
            existing.title = (entry.get("title") or "")[:300]
            existing.snippet = (entry.get("description") or "")[:1000]
            existing.url = url[:500]
            existing.fetched_at = now
            existing.expires_at = now + timedelta(hours=CACHE_TTL_HOURS)
        else:
            existing = PriceCache(
                medicine_query=qn,
                source_domain=domain,
                price=price,
                title=(entry.get("title") or "")[:300],
                snippet=(entry.get("description") or "")[:1000],
                url=url[:500],
                fetched_at=now,
                expires_at=now + timedelta(hours=CACHE_TTL_HOURS),
            )
            db.add(existing)

        seen_domains.add(domain)
        items.append(_row_to_dict(existing))
        if len(items) >= limit:
            break

    db.commit()
    return {
        "ok": bool(items),
        "query": qn,
        "items": items,
        "source": "brave" if items else "brave_no_match",
        "ttl_hours": CACHE_TTL_HOURS,
        "disclaimer_en": "Prices snipped from Brave Search results. Verify on the pharmacy site before buying.",
        "disclaimer_hi": "मूल्य Brave Search परिणामों से लिए गए हैं। खरीदने से पहले दुकान की वेबसाइट पर पुष्टि करें।",
    }


def evict_expired(db: Session) -> int:
    """Delete expired cache rows. Returns the number deleted."""
    now = datetime.utcnow()
    n = db.query(PriceCache).filter(PriceCache.expires_at <= now).delete()
    db.commit()
    return n
