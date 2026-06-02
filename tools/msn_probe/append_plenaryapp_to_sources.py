"""
Append the 16 live plenaryapp-harvested feeds to sources.json.
Dedups by rss_url and slug.
"""
from __future__ import annotations

import json
from pathlib import Path

SOURCES_PATH = Path("chitti-news/backend/data/sources.json")
PROBE_PATH = Path("tools/msn_probe/plenaryapp_probe_results.json")

# url → (slug, display_name, state, language, category, note)
MAPPING = {
    "https://www.divyabhaskar.co.in/rss-feed/1037/": (
        "divyabhaskar-gu-state", "દિવ્ય ભાસ્કર · ઈન્ડિયા",
        "gj", "gu", "state",
        "Gujarati — Divya Bhaskar /rss-feed/1037/ (48 entries) — found via plenaryapp/awesome-rss-feeds 2026-06-02. Unblocks the Gujarati standing-red flag from session 3.",
    ),
    "https://www.gujaratsamachar.com/rss/top-stories": (
        "gujaratsamachar-top", "ગુજરાત સમાચાર · Top Stories",
        "india", "gu", "national",
        "Gujarati — Gujarat Samachar top-stories feed (20 entries) — plenaryapp harvest 2026-06-02",
    ),
    "https://news18marathi.com/commonfeeds/v1/mar/rss/latest.xml": (
        "news18marathi-latest", "News18 लोकमत · Latest",
        "mh", "mr", "state",
        "Marathi — News18 Marathi latest (200 entries) — discovered via <link rel=alternate> on lokmat.news18.com, plenaryapp 2026-06-02",
    ),
    "https://www.amarujala.com/rss/breaking-news.xml": (
        "amarujala-breaking-hi", "अमर उजाला · Breaking News",
        "india", "hi", "national",
        "Hindi — Amar Ujala breaking news (11 entries) — plenaryapp 2026-06-02",
    ),
    "https://www.indiatoday.in/rss/home": (
        "india-today", "India Today · Home",
        "india", "en", "national",
        "English — India Today home (126 entries) — plenaryapp 2026-06-02",
    ),
    "https://www.deccanchronicle.com/rss_feed/": (
        "deccan-chronicle-main", "Deccan Chronicle · National",
        "india", "en", "national",
        "English — Deccan Chronicle national feed (423 entries) — plenaryapp 2026-06-02",
    ),
    "https://economictimes.indiatimes.com/rssfeedsdefault.cms": (
        "economic-times", "The Economic Times",
        "india", "en", "business",
        "English — Economic Times default feed (76 entries) — plenaryapp 2026-06-02",
    ),
    "https://www.thehindubusinessline.com/feeder/default.rss": (
        "hindu-business-line", "The Hindu BusinessLine",
        "india", "en", "business",
        "English — Hindu BusinessLine (60 entries) — plenaryapp 2026-06-02",
    ),
    "http://www.moneycontrol.com/rss/latestnews.xml": (
        "moneycontrol-latest", "Moneycontrol · Latest News",
        "india", "en", "business",
        "English — Moneycontrol latest news feed (15 entries — different from existing moneycontrol slug which uses MCtopnews) — plenaryapp 2026-06-02",
    ),
    "https://www.sebi.gov.in/sebirss.xml": (
        "sebi-rss", "SEBI · Official RSS",
        "india", "en", "business",
        "English — SEBI government regulator feed (30 entries) — plenaryapp 2026-06-02. Authoritative source for SEBI orders/circulars per the sticky-disclaimer-bar contract.",
    ),
    "https://www.oneindia.com/rss/news-fb.xml": (
        "oneindia-news", "OneIndia · News",
        "india", "en", "national",
        "English — OneIndia top news (30 entries) — plenaryapp 2026-06-02",
    ),
    "https://www.freepressjournal.in/stories.rss": (
        "freepress-journal", "Free Press Journal",
        "mh", "en", "state",
        "English — Free Press Journal Mumbai-focused (48 entries) — plenaryapp 2026-06-02. Maharashtra English coverage.",
    ),
    "https://www.news18.com/rss/world.xml": (
        "news18-world", "News18 · World",
        "india", "en", "national",
        "English — News18 World feed mapped to national (200 entries) — plenaryapp 2026-06-02",
    ),
    "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms": (
        "toi-world", "Times of India · World",
        "india", "en", "national",
        "English — TOI World feed (20 entries) — plenaryapp 2026-06-02",
    ),
    "http://feeds.feedburner.com/ndtvnews-world-news": (
        "ndtv-world", "NDTV · World",
        "india", "en", "national",
        "English — NDTV World news (20 entries) — plenaryapp 2026-06-02",
    ),
    "http://feeds.feedburner.com/ndtvsports-cricket": (
        "ndtv-cricket", "NDTV · Cricket",
        "india", "en", "sports",
        "English — NDTV Cricket feed (20 entries) — plenaryapp 2026-06-02",
    ),
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
        url = p["url"]
        if url in existing_urls:
            skipped.append((url, "duplicate_url"))
            continue
        m = MAPPING.get(url)
        if not m:
            skipped.append((url, "no_mapping"))
            continue
        slug, display, state, lang, cat, note = m
        if slug in existing_slugs:
            skipped.append((slug, f"slug_clash:{slug}"))
            continue
        # Derive homepage_url from the URL (strip /rss, /feed, /feeder/default.rss)
        homepage = url.split("/feed", 1)[0].split("/rss", 1)[0]
        entry = {
            "slug": slug,
            "display_name": display,
            "rss_url": url,
            "homepage_url": homepage,
            "state": state,
            "language": lang,
            "category": cat,
            "enabled": 1,
            "note": note,
        }
        sources.append(entry)
        existing_urls.add(url)
        existing_slugs.add(slug)
        added += 1
        print(f"  + {slug:30}  {lang:>3}  {state:>9}  {cat:>10}  ent={p['entries']}")

    SOURCES_PATH.write_text(
        json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"\nAdded {added} new sources. Total now: {len(sources)}.")
    if skipped:
        print(f"\nSkipped {len(skipped)}:")
        for s, r in skipped:
            print(f"  - {s}: {r}")


if __name__ == "__main__":
    main()
