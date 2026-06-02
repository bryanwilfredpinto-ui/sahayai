"""
Append the 20 live regional feeds (from probe_regional_feeds.py) to
chitti-news/backend/data/sources.json. Preserves all existing entries
verbatim — only appends new objects, deduplicating by rss_url.
"""
from __future__ import annotations

import json
from pathlib import Path

SOURCES_PATH = Path("chitti-news/backend/data/sources.json")
PROBE_PATH = Path("tools/msn_probe/probe_results.json")

# Hand-curated display names + categories for each live probe.
# Slug → (display_name, category, note)
META = {
    "ntvtelugu":          ("NTV తెలుగు",                            "national", "Telugu — Andhra Pradesh broadcaster, WP /feed harvested from MSN partner audit 2026-06-02"),
    "v6velugu":           ("V6 వెలుగు",                              "national", "Telugu — V6 News, WP /feed harvested 2026-06-02"),
    "namasthe-telangana": ("నమస్తే తెలంగాణ",                          "state",    "Telugu — Namasthe Telangana / NTNews, harvested 2026-06-02 (200 entries — biggest single haul)"),
    "telugu-samayam":     ("తెలుగు సమయం",                            "national", "Telugu — Times Internet, harvested 2026-06-02"),
    "vikatan-ta":         ("விகடன்",                                  "national", "Tamil — Vikatan, WP /feed harvested 2026-06-02"),
    "dailythanthi-ta":    ("தினத்தந்தி",                                "national", "Tamil — Daily Thanthi, WP /feed harvested 2026-06-02"),
    "polimer-news-ta":    ("பொலிமர் நியூஸ்",                          "national", "Tamil — Polimer News, WP /feed harvested 2026-06-02 (50 entries)"),
    "puthiyathalaimurai-ta": ("புதிய தலைமுறை",                       "national", "Tamil — Puthiya Thalaimurai, WP /feed harvested 2026-06-02"),
    "tamil-samayam":      ("தமிழ் சமயம்",                            "national", "Tamil — Times Internet, harvested 2026-06-02"),
    "uttarbanga":         ("উত্তরবঙ্গ সংবাদ",                          "state",    "Bengali — Uttar Banga Sambad, WP /feed harvested 2026-06-02"),
    "nabbarat":           ("নববার্তা",                                "state",    "Bengali — Nababarta, WP /feed harvested 2026-06-02"),
    "kannada-samayam":    ("ವಿಜಯ ಕರ್ನಾಟಕ · ಸಮಯಂ",                    "national", "Kannada — Times Internet (vijaykarnataka.com defaults feed), harvested 2026-06-02"),
    "doolnews-ml":        ("ഡൂൾ ന്യൂസ്",                              "national", "Malayalam — Dool News, WP /feed harvested 2026-06-02 (25 entries)"),
    "siraj-ml":           ("സിറാജ് ലൈവ്",                              "national", "Malayalam — Siraj Live, WP /feed harvested 2026-06-02"),
    "twentyfournews-ml":  ("24 ന്യൂസ്",                                "national", "Malayalam — 24 News, WP /feed harvested 2026-06-02"),
    "kalingatv-or":       ("Kalinga TV",                              "state",    "Odia — Kalinga TV, WP /feed harvested 2026-06-02"),
    "odishabytes-or":     ("Odisha Bytes",                            "state",    "Odia — Odisha Bytes, WP /feed harvested 2026-06-02 (40 entries — Odia coverage moved from 1 source to 3)"),
    "urdu-siasat":        ("سیاست اردو",                              "national", "Urdu — Siasat Urdu, WP /feed harvested 2026-06-02"),
    "newindianexp-kerala-en": ("New Indian Express · Kerala",          "state",    "English — Kerala state feed, harvested 2026-06-02 (40 entries)"),
    "newindianexp-tn-en":     ("New Indian Express · Tamil Nadu",      "state",    "English — Tamil Nadu state feed, harvested 2026-06-02 (40 entries)"),
}

# Probe-slug → preferred sources.json slug (avoid clashes with existing rows).
SLUG_REMAP = {
    "vikatan":             "vikatan-ta",
    "dailythanthi":        "dailythanthi-ta",
    "polimer-news":        "polimer-news-ta",
    "puthiyathalaimurai":  "puthiyathalaimurai-ta",
    "tamilsamayam":        "tamil-samayam",
    "doolnews":            "doolnews-ml",
    "siraj":               "siraj-ml",
    "twentyfournews":      "twentyfournews-ml",
    "kalingatv":           "kalingatv-or",
    "odishabytes":         "odishabytes-or",
    "newindianexpress-kerala": "newindianexp-kerala-en",
    "newindianexpress-tn": "newindianexp-tn-en",
}


def main():
    sources = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))
    existing_urls = {s["rss_url"] for s in sources}
    existing_slugs = {s["slug"] for s in sources}

    probes = json.loads(PROBE_PATH.read_text(encoding="utf-8"))
    live = [p for p in probes if p.get("ok")]

    added = 0
    skipped = []
    for p in live:
        if p["url"] in existing_urls:
            skipped.append((p["slug"], "duplicate_url"))
            continue
        slug = SLUG_REMAP.get(p["slug"], p["slug"])
        if slug in existing_slugs:
            skipped.append((p["slug"], f"slug_clash:{slug}"))
            continue
        meta = META.get(slug)
        if not meta:
            skipped.append((p["slug"], "no_meta"))
            continue
        display, category, note = meta
        # Map probe.state ("ap" / "telangana" / "wb" / etc.) → sources.state.
        # Probe state values already match existing schema.
        entry = {
            "slug": slug,
            "display_name": display,
            "rss_url": p["url"],
            "homepage_url": p["url"].rstrip("/").rsplit("/feed", 1)[0].rsplit("/rss", 1)[0],
            "state": p["state"],
            "language": p["lang"],
            "category": category,
            "enabled": 1,
            "note": note,
        }
        sources.append(entry)
        existing_urls.add(p["url"])
        existing_slugs.add(slug)
        added += 1
        print(f"  + {slug:25}  {p['lang']:>3}  {p['state']:>9}  {p['url']}")

    SOURCES_PATH.write_text(
        json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(f"\nAdded {added} new sources. Total now: {len(sources)}.")
    if skipped:
        print(f"Skipped {len(skipped)}:")
        for s, reason in skipped:
            print(f"  - {s}: {reason}")


if __name__ == "__main__":
    main()
