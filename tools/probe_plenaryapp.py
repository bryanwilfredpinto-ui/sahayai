"""
Probe the plenaryapp-harvested Indian RSS candidates with the same
two-stage fetcher (requests → cloudscraper) and feed-discovery the
existing tools use. Keep only feeds with >=3 entries.

Input:  tools/msn_probe/plenaryapp_new_indian.json
Output: tools/msn_probe/plenaryapp_probe_results.json
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


def try_fetch(url: str):
    try:
        r = requests.get(url, headers={"User-Agent": UA, "Accept": "*/*"},
                         timeout=20, allow_redirects=True)
        if r.status_code == 200 and r.content and len(r.content) > 200:
            return r.status_code, r.content, r.headers.get("Content-Type", ""), "requests"
        last_code = r.status_code
    except Exception:
        last_code = 0
    try:
        s = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows"})
        r = s.get(url, timeout=25, allow_redirects=True)
        return r.status_code, r.content, r.headers.get("Content-Type", ""), "cloudscraper"
    except Exception as e:
        return 0, b"", f"exception:{type(e).__name__}:{str(e)[:60]}", "fail"


def parse_for_feeds(html: str, base_url: str):
    feeds = set()
    for m in re.finditer(r'<link[^>]*?type=["\'](?:application/(?:rss|atom)\+xml|text/xml)["\'][^>]*?>',
                         html, re.I):
        href = re.search(r'href=["\']([^"\']+)["\']', m.group(0))
        if href:
            feeds.add(urljoin(base_url, href.group(1)))
    return sorted(feeds)


def validate(content: bytes):
    feed = feedparser.parse(content)
    n = len(feed.entries or [])
    title = (feed.entries[0].get("title") if n else "")
    return n >= 3, n, (title or "")[:80]


def probe_one(c):
    title, url = c.get("title", ""), c["url"]
    out = {"title": title, "url": url}
    code, content, ctype, fetcher = try_fetch(url)
    out["http"] = code
    out["fetcher"] = fetcher
    out["ctype"] = (ctype or "")[:60]
    if not content:
        out["ok"] = False
        out["reason"] = f"fetch_failed:{ctype}"
        return out
    ok, n, first = validate(content)
    out["entries"] = n
    out["first_title"] = first
    if ok:
        out["ok"] = True
        return out
    # Feed-discovery fallback
    text = content[:300_000].decode("utf-8", errors="ignore")
    if "<html" in text.lower() or "<!doctype html" in text.lower():
        discovered = parse_for_feeds(text, url)
        out["discovered"] = discovered[:5]
        for d_url in discovered:
            dc, dcontent, dct, df = try_fetch(d_url)
            if not dcontent:
                continue
            dok, dn, dft = validate(dcontent)
            if dok:
                out["ok"] = True
                out["url"] = d_url
                out["entries"] = dn
                out["first_title"] = dft
                out["fetcher"] = df
                out["discovered_via"] = url
                return out
    out["ok"] = False
    out["reason"] = f"no_feed:entries={n}"
    return out


def main():
    candidates = json.loads(Path("tools/msn_probe/plenaryapp_new_indian.json").read_text(encoding="utf-8"))
    results = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(probe_one, c): c for c in candidates}
        for f in as_completed(futs):
            results.append(f.result())
    results.sort(key=lambda r: (not r.get("ok"), r["url"]))
    live = [r for r in results if r.get("ok")]
    dead = [r for r in results if not r.get("ok")]
    print(f"\n=== LIVE: {len(live)} / {len(results)} ===")
    for r in live:
        via = f" (via {r.get('discovered_via')})" if r.get("discovered_via") else ""
        print(f"  {r['entries']:>4}  {r['fetcher']:13}  {r['url']}{via}")
    print(f"\n=== DEAD: {len(dead)} ===")
    for r in dead:
        print(f"  {r.get('reason','?'):28}  {r['url']}")
    Path("tools/msn_probe/plenaryapp_probe_results.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
