"""
Final batch append — Session 6 RSS additions.

Combines:
  - 18 verified-live sources from prior NE/GJ/CG probe (7 Gujarat Samachar
    categories + 3 EastMojo + 1 Northeast Now + 1 Assam Rising + 6 CG24News
    categories)
  - 6 verified-live sources from Sire's master list (Guardian India,
    Indian Express main, Mint, Business Standard, Deccan Herald, Bangalore
    Mirror)

Excludes confirmed-alias URLs:
  - bbc_india http:// version  (alias of existing https:// bbc-india)
  - east_mojo www.eastmojo.com/feed  (alias of eastmojo.com/feed/ added below)
  - deccan_chronicle /feed  (alias of just-added deccan-chronicle-main /rss_feed/)
"""
from __future__ import annotations

import json
from pathlib import Path

SOURCES_PATH = Path("chitti-news/backend/data/sources.json")

# All 24 new entries. Tuple form: (slug, display_name, rss_url, state, language, category, note)
NEW_SOURCES = [
    # ── Gujarat Samachar — 7 distinct category feeds (national + top-stories already in sources.json) ──
    ("gujsam-gujarat",     "ગુજરાત સમાચાર · ગુજરાત",      "https://www.gujaratsamachar.com/rss/category/gujarat",       "gj",    "gu", "state",         "Gujarati — Gujarat Samachar gujarat category (20 entries) — Sire master list 2026-06-02"),
    ("gujsam-business",    "ગુજરાત સમાચાર · બિઝનેસ",       "https://www.gujaratsamachar.com/rss/category/business",      "india", "gu", "business",      "Gujarati — Gujarat Samachar business (20)"),
    ("gujsam-sports",      "ગુજરાત સમાચાર · રમતગમત",        "https://www.gujaratsamachar.com/rss/category/sports",        "india", "gu", "sports",        "Gujarati — Gujarat Samachar sports (20)"),
    ("gujsam-entertainment","ગુજરાત સમાચાર · મનોરંજન",       "https://www.gujaratsamachar.com/rss/category/entertainment", "india", "gu", "entertainment", "Gujarati — Gujarat Samachar entertainment (20)"),
    ("gujsam-world",       "ગુજરાત સમાચાર · વિશ્વ",         "https://www.gujaratsamachar.com/rss/category/world",         "india", "gu", "national",      "Gujarati — Gujarat Samachar world (20)"),
    ("gujsam-surat",       "ગુજરાત સમાચાર · સુરત",          "https://www.gujaratsamachar.com/rss/category/surat",         "gj",    "gu", "state",         "Gujarati — Gujarat Samachar Surat city feed (20)"),
    ("gujsam-editorial",   "ગુજરાત સમાચાર · સંપાદકીય",      "https://www.gujaratsamachar.com/rss/category/editorial",     "india", "gu", "national",      "Gujarati — Gujarat Samachar editorial (20)"),

    # ── EastMojo — main + Manipur + Meghalaya (NE-keyword verified) ──
    ("eastmojo",           "EastMojo · NE Main",            "https://eastmojo.com/feed/",                                  "northeast", "en", "state", "English — EastMojo main NE aggregator (10 entries, NE_kw=manipur/meghalaya/nagaland verified)"),
    ("eastmojo-manipur",   "EastMojo · Manipur",            "https://www.eastmojo.com/category/manipur/feed/",             "mn",        "en", "state", "English — EastMojo Manipur-focused (10 entries, NE_kw=manipur/meghalaya verified)"),
    ("eastmojo-meghalaya", "EastMojo · Meghalaya",          "https://www.eastmojo.com/category/meghalaya/feed/",           "mg",        "en", "state", "English — EastMojo Meghalaya-focused (10 entries, NE_kw=manipur/meghalaya verified)"),

    # ── Northeast Now — main feed (NE_kw=arunachal/mizoram verified) ──
    ("northeastnow",       "Northeast Now",                 "https://nenow.in/rss",                                        "northeast", "en", "state", "English — Northeast Now main feed (10 entries, NE_kw=arunachal/mizoram verified)"),

    # ── The Assam Rising — Assam coverage ──
    ("assamrising",        "The Assam Rising",              "https://www.theassamrising.com/rss",                          "as",        "en", "state", "English — The Assam Rising (10 entries, NE_kw=assam/tripura verified)"),

    # ── CG24News — 6 distinct category feeds (front-page /feed already exists as cg24news) ──
    ("cg24-national",      "CG24News · राष्ट्रीय",          "https://cg24news.com/category/national/feed/",                "india", "hi", "national",      "Hindi — CG24News national (10)"),
    ("cg24-sports",        "CG24News · खेल",                "https://cg24news.com/category/sports/feed/",                  "india", "hi", "sports",        "Hindi — CG24News sports (10)"),
    ("cg24-entertainment", "CG24News · मनोरंजन",            "https://cg24news.com/category/entertainment/feed/",           "india", "hi", "entertainment", "Hindi — CG24News entertainment (10)"),
    ("cg24-politics",      "CG24News · राजनीति",            "https://cg24news.com/category/politics/feed/",                "india", "hi", "politics",      "Hindi — CG24News politics (10)"),
    ("cg24-business",      "CG24News · बिज़नेस",             "https://cg24news.com/category/business/feed/",                "india", "hi", "business",      "Hindi — CG24News business (10)"),
    ("cg24-crime",         "CG24News · अपराध",              "https://cg24news.com/category/crime/feed/",                   "india", "hi", "national",      "Hindi — CG24News crime (10) (mapped to national; no 'crime' category in schema)"),

    # ── Sire master list — 6 verified-live new sources ──
    ("guardian-india",     "The Guardian · India",          "https://www.theguardian.com/world/india/rss",                "india", "en", "national", "English — Guardian India RSS (20 entries) — Sire master list 2026-06-02"),
    ("indian-express-main","The Indian Express · Main",     "https://indianexpress.com/feed/",                            "india", "en", "national", "English — Indian Express main feed (200 entries) — Sire master list 2026-06-02"),
    ("mint-news",          "Mint · News",                   "https://www.livemint.com/rss/news",                          "india", "en", "business", "English — Livemint news feed (35 entries) — Sire master list 2026-06-02"),
    ("business-standard",  "Business Standard · Top",       "https://www.business-standard.com/rss/home_page_top_stories.rss", "india", "en", "business", "English — Business Standard top stories (5 entries via cloudscraper) — Sire master list 2026-06-02"),
    ("deccan-herald-main", "Deccan Herald · Main",          "https://www.deccanherald.com/feed",                          "india", "en", "national", "English — Deccan Herald main feed (53 entries via cloudscraper) — Sire master list 2026-06-02"),
    ("bangalore-mirror",   "Bangalore Mirror",              "https://bangaloremirror.indiatimes.com/rssfeed.cms",         "ka",    "en", "state",    "English — Bangalore Mirror Karnataka (15 entries) — Sire master list 2026-06-02"),
]


def main():
    sources = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))
    existing_urls = {s["rss_url"] for s in sources}
    existing_slugs = {s["slug"] for s in sources}

    added, skipped = 0, []
    for slug, display, url, state, lang, cat, note in NEW_SOURCES:
        if url in existing_urls:
            skipped.append((slug, "duplicate_url"))
            continue
        if slug in existing_slugs:
            skipped.append((slug, f"slug_clash:{slug}"))
            continue
        homepage = url.split("/feed", 1)[0].split("/rss", 1)[0].split("/category/", 1)[0]
        entry = {
            "slug": slug, "display_name": display, "rss_url": url,
            "homepage_url": homepage, "state": state, "language": lang,
            "category": cat, "enabled": 1, "note": note,
        }
        sources.append(entry)
        existing_urls.add(url)
        existing_slugs.add(slug)
        added += 1
        print(f"  + {slug:25}  {lang:>3}  {state:>10}  {cat:>14}")

    SOURCES_PATH.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nAdded {added} new sources. Total now: {len(sources)}.")
    if skipped:
        print(f"\nSkipped {len(skipped)}:")
        for s, r in skipped:
            print(f"  - {s}: {r}")


if __name__ == "__main__":
    main()
