"""
services/medupi_price_freshness.py
----------------------------------
Age-based "last updated" badges + EN/HI captions for every price we surface.

Bryan's freshness rule (CHITTI_MEDUPI_MASTER_SPEC.md):
  - Jan Aushadhi price → "Official Jan Aushadhi price" (always trusted, monthly govt update)
  - NPPA ceiling      → "Maximum legal price — no pharmacy can charge more"
  - Branded MRP       → "Last updated X days ago"
  - Community price   → "Reported by user in <city> on <date>"
  - >30 days old      → amber "Price may have changed"
  - >90 days old      → red    "Verify current price with pharmacy"
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional


def _days_old(ts: Optional[datetime]) -> Optional[int]:
    if not ts:
        return None
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    delta = datetime.now(timezone.utc) - ts
    return max(0, int(delta.total_seconds() // 86400))


def _badge(price_type: str, days_old: Optional[int]) -> dict:
    """
    Returns a dict the frontend uses verbatim:
      { tier: 'official'|'fresh'|'stale'|'verify',
        symbol: '🏥'|'🛡️'|'💊'|'⚠️'|'❗',
        caption_en, caption_hi, color }
    """
    if price_type == "jan_aushadhi":
        return {
            "tier": "official",
            "symbol": "🏥",
            "caption_en": "Official Jan Aushadhi price",
            "caption_hi": "आधिकारिक जन औषधि मूल्य",
            "color": "green",
        }
    if price_type == "nppa":
        return {
            "tier": "official",
            "symbol": "🛡️",
            "caption_en": "Maximum legal price — no pharmacy can charge more",
            "caption_hi": "अधिकतम कानूनी मूल्य — कोई दुकान इससे अधिक नहीं ले सकती",
            "color": "navy",
        }
    if price_type == "community":
        return {
            "tier": "community",
            "symbol": "👥",
            "caption_en": "User reported — verify before purchase",
            "caption_hi": "उपयोगकर्ता द्वारा सूचित — खरीदने से पहले पुष्टि करें",
            "color": "amber",
        }

    # Branded / live / kaggle / manual — age matters
    if days_old is None:
        return {
            "tier": "unknown",
            "symbol": "💊",
            "caption_en": "Price last update unknown",
            "caption_hi": "मूल्य अंतिम अद्यतन अज्ञात",
            "color": "muted",
        }
    if days_old <= 7:
        return {
            "tier": "fresh",
            "symbol": "💊",
            "caption_en": f"Last updated {days_old} day(s) ago",
            "caption_hi": f"{days_old} दिन पहले अद्यतन",
            "color": "green",
        }
    if days_old <= 30:
        return {
            "tier": "fresh",
            "symbol": "💊",
            "caption_en": f"Last updated {days_old} days ago",
            "caption_hi": f"{days_old} दिन पहले अद्यतन",
            "color": "navy",
        }
    if days_old <= 90:
        return {
            "tier": "stale",
            "symbol": "⚠️",
            "caption_en": f"Last updated {days_old} days ago — price may have changed",
            "caption_hi": f"{days_old} दिन पहले अद्यतन — मूल्य बदल सकता है",
            "color": "amber",
        }
    return {
        "tier": "verify",
        "symbol": "❗",
        "caption_en": f"Last updated {days_old} days ago — verify current price with pharmacy",
        "caption_hi": f"{days_old} दिन पहले अद्यतन — कृपया दुकान से वर्तमान मूल्य पुष्टि करें",
        "color": "red",
    }


def annotate(medicine: dict, *, updated_at: Optional[datetime] = None,
             price_source: Optional[str] = None) -> dict:
    """
    Mutates a medicine dict in-place by adding `freshness_*` fields:
      - freshness_jan_aushadhi : when jan_aushadhi_price is set
      - freshness_nppa         : when nppa_ceiling_price is set
      - freshness_mrp          : when mrp is set (uses updated_at + price_source)
    Returns the same dict for fluent chaining.
    """
    if medicine.get("jan_aushadhi_price") is not None:
        medicine["freshness_jan_aushadhi"] = _badge("jan_aushadhi", _days_old(updated_at))

    if medicine.get("nppa_ceiling_price") is not None:
        medicine["freshness_nppa"] = _badge("nppa", _days_old(updated_at))

    if medicine.get("mrp") is not None:
        # Brand price age depends on price_source — kaggle/manual is dated by updated_at
        medicine["freshness_mrp"] = _badge(price_source or "branded", _days_old(updated_at))
        medicine["price_source"] = price_source

    return medicine


def annotate_community_entry(entry: dict) -> dict:
    """For CommunityPrice rows already converted to dict."""
    reported_at = entry.get("reported_at")
    if isinstance(reported_at, str):
        try:
            reported_at = datetime.fromisoformat(reported_at)
        except ValueError:
            reported_at = None
    days = _days_old(reported_at) if isinstance(reported_at, datetime) else None
    badge = _badge("community", days)
    if days is not None:
        badge["caption_en"] = (
            f"Reported by user in {entry.get('city') or 'India'} "
            f"{days} day(s) ago — verify before purchase"
        )
        badge["caption_hi"] = (
            f"उपयोगकर्ता ने {entry.get('city') or 'भारत'} में {days} दिन पहले बताया "
            "— खरीदने से पहले पुष्टि करें"
        )
    entry["freshness"] = badge
    return entry
