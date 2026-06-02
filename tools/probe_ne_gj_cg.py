"""
Discover + probe feeds for Gujarat Samachar, EastMojo, Northeast Now,
The Assam Rising, CG24News. Per Sire 2026-06-02 (Kashmir-to-Kanyakumari +
Manipur-to-Gujarat ask).

Two-pass:
  PASS 1 — fetch each publisher's homepage and extract every
           <link rel="alternate" type="application/rss+xml">. Also try
           a hardcoded list of WordPress + category candidates per publisher.
  PASS 2 — feedparser-validate every candidate. Keep >=3 entries.

Output: tools/msn_probe/ne_gj_cg_probe.json
"""
from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin

import cloudscraper
import feedparser
import requests

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


# Publisher manifest. Each entry: (publisher_id, homepage, [seed_candidates])
# Seed candidates are common feed paths to try in addition to discovery.
PUBLISHERS = [
    # Gujarat Samachar — Gujarati. We already have /rss/category/national
    # and /rss/top-stories. Hunt for all the other category feeds.
    ("gujaratsamachar", "https://www.gujaratsamachar.com/", [
        "https://www.gujaratsamachar.com/rss/category/gujarat",
        "https://www.gujaratsamachar.com/rss/category/national",
        "https://www.gujaratsamachar.com/rss/category/business",
        "https://www.gujaratsamachar.com/rss/category/sports",
        "https://www.gujaratsamachar.com/rss/category/entertainment",
        "https://www.gujaratsamachar.com/rss/category/world",
        "https://www.gujaratsamachar.com/rss/category/lifestyle",
        "https://www.gujaratsamachar.com/rss/category/technology",
        "https://www.gujaratsamachar.com/rss/category/editorial",
        "https://www.gujaratsamachar.com/rss/category/ahmedabad",
        "https://www.gujaratsamachar.com/rss/category/surat",
        "https://www.gujaratsamachar.com/rss/category/vadodara",
        "https://www.gujaratsamachar.com/rss/category/rajkot",
        "https://www.gujaratsamachar.com/rss/top-stories",
        "https://www.gujaratsamachar.com/rss",
        "https://www.gujaratsamachar.com/feed",
    ]),
    # EastMojo — North-East English aggregator.
    ("eastmojo", "https://www.eastmojo.com/", [
        "https://www.eastmojo.com/feed/",
        "https://www.eastmojo.com/feed",
        "https://www.eastmojo.com/rss",
        "https://www.eastmojo.com/category/assam/feed/",
        "https://www.eastmojo.com/category/manipur/feed/",
        "https://www.eastmojo.com/category/nagaland/feed/",
        "https://www.eastmojo.com/category/meghalaya/feed/",
        "https://www.eastmojo.com/category/arunachal/feed/",
        "https://www.eastmojo.com/category/mizoram/feed/",
        "https://www.eastmojo.com/category/tripura/feed/",
        "https://www.eastmojo.com/category/sikkim/feed/",
    ]),
    # Northeast Now
    ("northeastnow", "https://nenow.in/", [
        "https://nenow.in/feed/",
        "https://nenow.in/feed",
        "https://nenow.in/rss",
        "https://nenow.in/category/north-east-india/feed/",
        "https://nenow.in/north-east-india/assam.html/feed",
    ]),
    ("northeastnow-alt", "https://www.northeastnow.com/", [
        "https://www.northeastnow.com/feed",
    ]),
    # The Assam Rising
    ("assamrising", "https://www.theassamrising.com/", [
        "https://www.theassamrising.com/feed/",
        "https://www.theassamrising.com/feed",
        "https://www.theassamrising.com/rss",
        "https://www.theassamrising.com/category/assam/feed/",
    ]),
    ("assamrising-alt", "https://theassamrising.com/", [
        "https://theassamrising.com/feed/",
    ]),
    # CG24News — Hindi / Chhattisgarh. We already have https://cg24news.com/feed
    # (the front-page feed). Hunt for category feeds.
    ("cg24news", "https://cg24news.com/", [
        "https://cg24news.com/feed",
        "https://cg24news.com/feed/",
        "https://cg24news.com/category/chhattisgarh/feed/",
        "https://cg24news.com/category/raipur/feed/",
        "https://cg24news.com/category/bilaspur/feed/",
        "https://cg24news.com/category/durg/feed/",
        "https://cg24news.com/category/national/feed/",
        "https://cg24news.com/category/sports/feed/",
        "https://cg24news.com/category/entertainment/feed/",
        "https://cg24news.com/category/business/feed/",
        "https://cg24news.com/category/politics/feed/",
        "https://cg24news.com/category/crime/feed/",
    ]),
]


def try_fetch(url: str):
    try:
        r = requests.get(url, headers={"User-Agent": UA, "Accept": "*/*"},
                         timeout=20, allow_redirects=True)
        if r.status_code == 200 and r.content and len(r.content) > 200:
            return r.status_code, r.content, r.headers.get("Content-Type", ""), "requests"
        last = r.status_code
    except Exception:
        last = 0
    try:
        s = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows"})
        r = s.get(url, timeout=25, allow_redirects=True)
        return r.status_code, r.content, r.headers.get("Content-Type", ""), "cloudscraper"
    except Exception as e:
        return 0, b"", f"exception:{type(e).__name__}:{str(e)[:60]}", "fail"


def discover_from_homepage(homepage: str) -> list[str]:
    code, content, ctype, _ = try_fetch(homepage)
    if not content:
        return []
    html = content[:400_000].decode("utf-8", errors="ignore")
    feeds = set()
    # <link rel="alternate" type="application/rss+xml" href="...">
    for m in re.finditer(
        r'<link[^>]*?type=["\'](?:application/(?:rss|atom)\+xml|text/xml)["\'][^>]*?>',
        html, re.I,
    ):
        href = re.search(r'href=["\']([^"\']+)["\']', m.group(0))
        if href:
            feeds.add(urljoin(homepage, href.group(1)))
    # Inline href= ... rss/feed/atom
    for m in re.finditer(
        r'href=["\']([^"\']+(?:/rss[^"\']*|/feed/?[^"\']*|atom\.xml[^"\']*))["\']',
        html, re.I,
    ):
        feeds.add(urljoin(homepage, m.group(1)))
    return sorted(feeds)


def validate(content: bytes):
    feed = feedparser.parse(content)
    n = len(feed.entries or [])
    title = (feed.entries[0].get("title") if n else "") or ""
    return n >= 3, n, title[:80]


def probe_one(publisher: str, url: str, source: str) -> dict:
    out = {"publisher": publisher, "url": url, "source": source}
    code, content, ctype, fetcher = try_fetch(url)
    out["http"] = code
    out["fetcher"] = fetcher
    if not content:
        out["ok"] = False
        out["reason"] = f"fetch_failed:{ctype[:40]}"
        return out
    ok, n, title = validate(content)
    out["entries"] = n
    out["first_title"] = title
    out["ok"] = ok
    if not ok:
        out["reason"] = f"entries={n}"
    return out


def main():
    # PASS 1: discover homepage feeds + collect every candidate
    all_candidates: list[tuple[str, str, str]] = []   # (publisher, url, source)
    print("=== PASS 1: discovering feeds from homepages ===")
    for publisher, homepage, seeds in PUBLISHERS:
        discovered = discover_from_homepage(homepage)
        print(f"  {publisher:18} homepage discovery: {len(discovered)} feeds  +  {len(seeds)} seeded paths")
        for d in discovered:
            all_candidates.append((publisher, d, "discovered"))
        for s in seeds:
            all_candidates.append((publisher, s, "seed"))

    # Dedup by URL across publishers
    seen = set()
    uniq = []
    for p, u, s in all_candidates:
        if u in seen:
            continue
        seen.add(u)
        uniq.append((p, u, s))
    print(f"\nTotal unique candidates: {len(uniq)}\n")

    # PASS 2: probe each
    print("=== PASS 2: probing each candidate ===")
    results = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(probe_one, p, u, s): (p, u) for (p, u, s) in uniq}
        for f in as_completed(futs):
            results.append(f.result())

    results.sort(key=lambda r: (r["publisher"], not r.get("ok"), -r.get("entries", 0)))
    live = [r for r in results if r.get("ok")]
    dead = [r for r in results if not r.get("ok")]

    print(f"\n=== LIVE: {len(live)} / {len(results)} ===")
    for r in live:
        print(f"  {r['publisher']:18}  ent={r['entries']:>4}  src={r['source']:10}  {r['url']}")
    print(f"\n=== DEAD: {len(dead)} ===")
    for r in dead:
        print(f"  {r['publisher']:18}  {r.get('reason','?'):28}  {r['url']}")

    Path("tools/msn_probe/ne_gj_cg_probe.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
