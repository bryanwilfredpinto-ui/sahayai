"""
Session 7 multi-target probe — Oneindia regional + Hindusthan Samachar
hidden-RSS sweep + theroyakash/newsapis GitHub JSON feed.

Saves results to tools/msn_probe/session7_probe.json
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin

import cloudscraper
import feedparser
import requests

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")


def try_fetch(url):
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
        return 0, b"", "", f"fail:{type(e).__name__}"


def discover(homepage):
    code, content, _, _ = try_fetch(homepage)
    if not content:
        return []
    html = content[:300_000].decode("utf-8", errors="ignore")
    feeds = set()
    for m in re.finditer(
        r'<link[^>]*?type=["\'](?:application/(?:rss|atom)\+xml|text/xml)["\'][^>]*?>',
        html, re.I,
    ):
        href = re.search(r'href=["\']([^"\']+)["\']', m.group(0))
        if href:
            feeds.add(urljoin(homepage, href.group(1)))
    for m in re.finditer(
        r'href=["\']([^"\']+(?:/rss[^"\']*|/feed/?[^"\']*|atom\.xml[^"\']*))["\']',
        html, re.I,
    ):
        feeds.add(urljoin(homepage, m.group(1)))
    return sorted(feeds)


def validate_rss(content):
    feed = feedparser.parse(content)
    n = len(feed.entries or [])
    title = (feed.entries[0].get("title", "") if n else "") or ""
    return n >= 3, n, title[:80]


def validate_json(content, ctype):
    """For json+ candidates — check if JSON parses to a list of articles."""
    if "json" not in ctype.lower():
        # Try anyway
        pass
    try:
        data = json.loads(content)
    except Exception:
        return False, 0, "not_json"
    # Common shapes: top-level list, or {articles:[]}, or {data:[]}, etc.
    items = None
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        for k in ("articles", "data", "items", "results", "news", "posts"):
            v = data.get(k)
            if isinstance(v, list):
                items = v
                break
    if not items:
        return False, 0, "no_article_list"
    sample = items[0] if items else {}
    title = ""
    for k in ("title", "headline", "name"):
        if isinstance(sample.get(k), str) and sample[k].strip():
            title = sample[k][:80]
            break
    return len(items) >= 3, len(items), title


def probe(label, url, kind="rss"):
    out = {"label": label, "url": url, "kind": kind}
    code, content, ctype, fetcher = try_fetch(url)
    out["http"], out["fetcher"], out["ctype"] = code, fetcher, (ctype or "")[:60]
    if not content:
        out["ok"] = False
        out["reason"] = f"fetch_failed:{fetcher}"
        return out
    if kind == "json":
        ok, n, first = validate_json(content, ctype)
    else:
        ok, n, first = validate_rss(content)
    out["ok"] = ok
    out["n_entries"] = n
    out["first_title"] = first
    if not ok:
        out["reason"] = f"entries={n}_{first}"
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")

    candidates = [
        # ── 1. ONEINDIA regional RSS (Sire spec) ──
        ("oneindia-kn", "https://kannada.oneindia.com/rss.xml", "rss"),
        ("oneindia-ml", "https://malayalam.oneindia.com/rss.xml", "rss"),
        ("oneindia-ta", "https://tamil.oneindia.com/rss.xml", "rss"),
        ("oneindia-te", "https://telugu.oneindia.com/rss.xml", "rss"),
        ("oneindia-gu", "https://gujarati.oneindia.com/rss.xml", "rss"),
        # Sire's URLs used .in TLD — probe both
        ("oneindia-kn-in", "https://kannada.oneindia.in/rss.xml", "rss"),
        ("oneindia-ml-in", "https://malayalam.oneindia.in/rss.xml", "rss"),
        ("oneindia-ta-in", "https://tamil.oneindia.in/rss.xml", "rss"),
        ("oneindia-te-in", "https://telugu.oneindia.in/rss.xml", "rss"),
        ("oneindia-gu-in", "https://gujarati.oneindia.in/rss.xml", "rss"),
        # Common alternates if rss.xml fails
        ("oneindia-kn-feed", "https://kannada.oneindia.com/rss/news-fb.xml", "rss"),
        ("oneindia-ml-feed", "https://malayalam.oneindia.com/rss/news-fb.xml", "rss"),
        ("oneindia-ta-feed", "https://tamil.oneindia.com/rss/news-fb.xml", "rss"),
        ("oneindia-te-feed", "https://telugu.oneindia.com/rss/news-fb.xml", "rss"),
        ("oneindia-hi-feed", "https://hindi.oneindia.com/rss/news-fb.xml", "rss"),
        # Hindi Oneindia (bonus)
        ("oneindia-hi", "https://hindi.oneindia.com/rss.xml", "rss"),
        # Bengali oneindia
        ("oneindia-bn", "https://bengali.oneindia.com/rss.xml", "rss"),
        ("oneindia-bn-feed", "https://bengali.oneindia.com/rss/news-fb.xml", "rss"),

        # ── 2. HINDUSTHAN SAMACHAR hidden RSS sweep ──
        ("hs-feed",       "https://www.hindusthansamachar.in/feed/", "rss"),
        ("hs-feed2",      "https://www.hindusthansamachar.in/feed", "rss"),
        ("hs-rss",        "https://www.hindusthansamachar.in/rss", "rss"),
        ("hs-rssxml",     "https://www.hindusthansamachar.in/rss.xml", "rss"),
        ("hs-en-feed",    "https://en.hindusthansamachar.in/feed/", "rss"),
        ("hs-hi-feed",    "https://hi.hindusthansamachar.in/feed/", "rss"),
        ("hs-bn-feed",    "https://bn.hindusthansamachar.in/feed/", "rss"),
        ("hs-ml-feed",    "https://ml.hindusthansamachar.in/feed/", "rss"),
        ("hs-kn-feed",    "https://kn.hindusthansamachar.in/feed/", "rss"),
        ("hs-pa-feed",    "https://pa.hindusthansamachar.in/feed/", "rss"),
        ("hs-sa-feed",    "https://sa.hindusthansamachar.in/feed/", "rss"),
        ("hs-ne-feed",    "https://ne.hindusthansamachar.in/feed/", "rss"),
        ("hs-as-feed",    "https://as.hindusthansamachar.in/feed/", "rss"),
        ("hs-sd-feed",    "https://sd.hindusthansamachar.in/feed/", "rss"),

        # ── 4. GITHUB JSON FEED (Sire spec) ──
        ("github-india-news-json",
         "https://raw.githubusercontent.com/theroyakash/newsapis/main/india_news.json", "json"),
    ]

    # Homepage discovery for Hindusthan Samachar (no harm trying)
    print("=== Discovering Hindusthan Samachar homepage feeds ===")
    discovered = discover("https://www.hindusthansamachar.in/")
    for i, u in enumerate(discovered[:8]):
        print(f"  + {u}")
        candidates.append((f"hs-disc-{i+1}", u, "rss"))

    print(f"\n=== Probing {len(candidates)} candidates ===")
    results = []
    with ThreadPoolExecutor(max_workers=12) as ex:
        futs = {ex.submit(probe, lbl, url, kind): (lbl, url) for lbl, url, kind in candidates}
        for f in as_completed(futs):
            results.append(f.result())

    # Group: live vs dead
    results.sort(key=lambda r: (not r.get("ok"), r["label"]))
    live = [r for r in results if r.get("ok")]
    dead = [r for r in results if not r.get("ok")]

    print(f"\n=== LIVE: {len(live)} / {len(results)} ===")
    for r in live:
        print(f"  [{r['kind']:4}] {r['label']:24}  ent={r['n_entries']:>4}  via {r['fetcher']:12}  {r['url']}")
        if r['first_title']:
            print(f"           ↳ {r['first_title']}")

    print(f"\n=== DEAD: {len(dead)} ===")
    for r in dead:
        print(f"  [{r['kind']:4}] {r['label']:24}  {r.get('reason','?'):30}  {r['url']}")

    Path("tools/msn_probe/session7_probe.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
