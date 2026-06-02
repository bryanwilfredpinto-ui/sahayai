"""
Append v2 cloudscraper-discovered feeds to sources.json. Dedup by URL.
"""
from __future__ import annotations

import json
from pathlib import Path

SOURCES_PATH = Path("chitti-news/backend/data/sources.json")
PROBE_PATH = Path("tools/msn_probe/probe_v2_results.json")

META = {
    "prajavani-kn":         ("ಪ್ರಜಾವಾಣಿ",           "kn", "ka", "national", "Kannada — Prajavani, 2026-06-02 cloudscraper probe"),
    "varthabharati-home":   ("ವಾರ್ತಾಭಾರತಿ",         "kn", "ka", "national", "Kannada — Varthabharati, discovered via homepage <link rel=alternate>"),
    "vijayavani-home":      ("ವಿಜಯವಾಣಿ",            "kn", "ka", "national", "Kannada — Vijayavani, discovered via homepage <link rel=alternate>"),
    "madhyamam-home":       ("മാധ്യമം",              "ml", "kl", "national", "Malayalam — Madhyamam, discovered via homepage <link rel=alternate> (546 entries)"),
    "saamana-mr":           ("सामना",               "mr", "mh", "state",    "Marathi — Saamana, 2026-06-02 retry succeeded"),
    "tarunbharat-mr":       ("तरुण भारत",           "mr", "mh", "state",    "Marathi — Tarun Bharat, 2026-06-02 retry succeeded"),
    "otv-home":             ("OTV / Odisha TV",      "or", "or", "state",    "Odia — Odisha TV, discovered via homepage <link rel=alternate>"),
    "sambad-en-home":       ("Sambad · English",     "en", "or", "state",    "English — Sambad English (Odisha), discovered via homepage"),
    "rozanaspokesman-home": ("ਰੋਜ਼ਾਨਾ ਸਪੋਕਸਮੈਨ",   "pa", "pb", "state",    "Punjabi — Rozana Spokesman, discovered via homepage <link rel=alternate>"),
    "dinamani-home":        ("தினமணி",              "ta", "tn", "national", "Tamil — Dinamani, discovered via homepage"),
    "etemaad-home":         ("اعتماد ویکلی",         "ur", "india", "national","Urdu — Etemaad Weekly, discovered via homepage"),
}

# Slug remap to make each entry unique + descriptive once it lands in sources.json
SLUG_REMAP = {
    "varthabharati-home": "varthabharati-kn",
    "vijayavani-home":    "vijayavani-kn",
    "madhyamam-home":     "madhyamam-ml",
    "otv-home":           "otv-or",
    "sambad-en-home":     "sambad-english-or",
    "rozanaspokesman-home": "rozanaspokesman-pa",
    "dinamani-home":      "dinamani-ta",
    "etemaad-home":       "etemaad-weekly-ur",
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
        meta = META.get(p["slug"])
        if not meta:
            skipped.append((p["slug"], "no_meta"))
            continue
        display, lang, state, category, note = meta
        new_slug = SLUG_REMAP.get(p["slug"], p["slug"])
        if new_slug in existing_slugs:
            skipped.append((p["slug"], f"slug_clash:{new_slug}"))
            continue
        # Derive homepage URL = the URL we DISCOVERED FROM (if discovered), else strip /feed
        homepage = p.get("discovered_via") or p["url"].rstrip("/").rsplit("/feed", 1)[0].rsplit("/rss", 1)[0]
        entry = {
            "slug": new_slug,
            "display_name": display,
            "rss_url": p["url"],
            "homepage_url": homepage,
            "state": state,
            "language": lang,
            "category": category,
            "enabled": 1,
            "note": note,
        }
        sources.append(entry)
        existing_urls.add(p["url"])
        existing_slugs.add(new_slug)
        added += 1
        print(f"  + {new_slug:25}  {lang:>3}  {state:>9}  {p['url']}")

    SOURCES_PATH.write_text(
        json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"\nAdded {added} new sources. Total now: {len(sources)}.")
    if skipped:
        print(f"\nSkipped {len(skipped)}:")
        for s, reason in skipped:
            print(f"  - {s}: {reason}")


if __name__ == "__main__":
    main()
