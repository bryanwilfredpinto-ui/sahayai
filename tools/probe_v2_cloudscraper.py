"""
Probe v2 — cloudscraper fallback + feed-discovery from HTML.

For each candidate URL:
  1. Try plain requests (fast path).
  2. On SSLError / 403 / empty / non-XML → fall back to cloudscraper.
  3. If response is HTML (not RSS), scan it for <link rel="alternate"
     type="application/rss+xml" href="..."> and probe the discovered URL.
  4. feedparser-validate. Keep only feeds with >=3 entries.

Output: tools/msn_probe/probe_v2_results.json
"""
from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin

import cloudscraper
import feedparser
import requests

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# 45 failures from probe v1, regrouped — plus a handful of new candidates
# (publisher homepage URLs for feed-discovery + WordPress alt paths).
CANDIDATES = [
    # Marathi (MH) — Cloudflare-heavy
    ("mr", "mh", "loksatta-mr",       "https://www.loksatta.com/feed/"),
    ("mr", "mh", "loksatta-mr-home",  "https://www.loksatta.com/"),
    ("mr", "mh", "saamana-mr",        "https://www.saamana.com/feed/"),
    ("mr", "mh", "saamana-mr-home",   "https://www.saamana.com/"),
    ("mr", "mh", "esakal-mr",         "https://www.esakal.com/rss"),
    ("mr", "mh", "esakal-mr-home",    "https://www.esakal.com/"),
    ("mr", "mh", "mahatimes-mr",      "https://maharashtratimes.com/rssfeedsdefault.cms"),
    ("mr", "mh", "tarunbharat-mr",    "https://tarunbharat.com/feed/"),
    ("mr", "mh", "agrowon-mr",        "https://www.agrowon.com/rss"),
    ("mr", "mh", "agrowon-mr-home",   "https://www.agrowon.com/"),
    ("mr", "mh", "divyamarathi",      "https://www.divyamarathi.bhaskar.com/rss-v1--category-1057.xml"),
    ("mr", "mh", "divyamarathi-home", "https://www.divyamarathi.bhaskar.com/"),
    # Gujarati (GJ)
    ("gu", "gj", "sandesh-gu",        "https://sandesh.com/feed"),
    ("gu", "gj", "sandesh-gu-home",   "https://sandesh.com/"),
    ("gu", "gj", "abp-asmita-gu",     "https://news.abplive.com/gujarati/feed"),
    ("gu", "gj", "vtv-gu",            "https://www.vtvgujarati.com/feed"),
    ("gu", "gj", "divyabhaskar-gu-v2","https://www.divyabhaskar.co.in/rss-v1--category-1057.xml"),
    ("gu", "gj", "divyabhaskar-gu-home","https://www.divyabhaskar.co.in/"),
    ("gu", "gj", "nobat-gu",          "https://nobat.com/feed/"),
    # Punjabi (PA)
    ("pa", "pb", "rozanaspokesman-pa","https://www.rozanaspokesman.com/feed"),
    ("pa", "pb", "rozanaspokesman-home","https://www.rozanaspokesman.com/"),
    ("pa", "pb", "jagbani-pa",        "https://www.jagbani.punjabkesari.in/feed"),
    ("pa", "pb", "punjabijagran-pa",  "https://www.punjabijagran.com/feed"),
    ("pa", "pb", "punjabijagran-home","https://www.punjabijagran.com/"),
    ("pa", "pb", "abp-sanjha-pa",     "https://news.abplive.com/punjabi/feed"),
    ("pa", "pb", "abp-sanjha-home",   "https://news.abplive.com/punjabi"),
    # Kannada (KA)
    ("kn", "ka", "prajavani-kn",      "https://www.prajavani.net/feed"),
    ("kn", "ka", "prajavani-home",    "https://www.prajavani.net/"),
    ("kn", "ka", "udayavani-kn",      "https://www.udayavani.com/feed"),
    ("kn", "ka", "udayavani-home",    "https://www.udayavani.com/"),
    ("kn", "ka", "kannadaprabha-kn",  "https://www.kannadaprabha.com/rss"),
    ("kn", "ka", "kannadaprabha-home","https://www.kannadaprabha.com/"),
    ("kn", "ka", "varthabharati-kn",  "https://www.varthabharati.in/rss.xml"),
    ("kn", "ka", "varthabharati-home","https://www.varthabharati.in/"),
    ("kn", "ka", "vijayavani-kn",     "https://www.vijayavani.net/feed/"),
    ("kn", "ka", "vijayavani-home",   "https://www.vijayavani.net/"),
    # Telugu — recover the empty-feed cases
    ("te", "ap", "eenadu-home",       "https://www.eenadu.net/"),
    ("te", "ap", "sakshi-home",       "https://www.sakshi.com/"),
    ("te", "ap", "andhrajyothy-home", "https://www.andhrajyothy.com/"),
    # Bengali (WB) — recover empties + add candidates
    ("bn", "wb", "aajkaal-home",      "https://www.aajkaal.in/"),
    ("bn", "wb", "anandabazar-home",  "https://www.anandabazar.com/"),
    ("bn", "wb", "eisamay-home",      "https://eisamay.com/"),
    # Tamil
    ("ta", "tn", "dinamani-home",     "https://www.dinamani.com/"),
    ("ta", "tn", "hindu-tamil-home",  "https://tamil.thehindu.com/"),
    # Malayalam
    ("ml", "kl", "madhyamam-home",    "https://www.madhyamam.com/"),
    ("ml", "kl", "deshabhimani-home", "https://www.deshabhimani.com/"),
    # Hindi extras
    ("hi", "india", "patrika-home",   "https://www.patrika.com/"),
    ("hi", "india", "zee-hindi-home", "https://zeenews.india.com/hindi"),
    # Odia
    ("or", "or", "otv-home",          "https://odishatv.in/"),
    ("or", "or", "sambad-en-home",    "https://sambadenglish.com/"),
    # Urdu
    ("ur", "india", "inquilab-home",  "https://www.inquilab.com/"),
    ("ur", "india", "etemaad-home",   "https://www.etemaaddaily.com/"),
]


def parse_for_feeds(html: str, base_url: str) -> list[str]:
    """Discover RSS/Atom feed URLs from a publisher homepage's HTML."""
    feeds = set()
    for m in re.finditer(
        r'<link[^>]*?type=["\'](?:application/(?:rss|atom)\+xml|text/xml)["\'][^>]*?>',
        html, re.I,
    ):
        tag = m.group(0)
        href = re.search(r'href=["\']([^"\']+)["\']', tag)
        if href:
            feeds.add(urljoin(base_url, href.group(1)))
    # Also catch <link href=... type=...> orderings:
    for m in re.finditer(
        r'<link[^>]*?href=["\']([^"\']+(?:rss|feed|atom)[^"\']*)["\'][^>]*?>',
        html, re.I,
    ):
        feeds.add(urljoin(base_url, m.group(1)))
    return sorted(feeds)


def try_fetch(url: str) -> tuple[int, bytes, str, str]:
    """
    Returns (http_code, content, content_type, fetcher)
    fetcher = 'requests' or 'cloudscraper' or 'fail'
    """
    try:
        r = requests.get(
            url, headers={"User-Agent": UA, "Accept": "*/*"},
            timeout=20, allow_redirects=True,
        )
        if r.status_code == 200 and r.content:
            return r.status_code, r.content, r.headers.get("Content-Type", ""), "requests"
    except Exception:
        pass
    # Fallback: cloudscraper
    try:
        s = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows"})
        r = s.get(url, timeout=25, allow_redirects=True)
        return r.status_code, r.content, r.headers.get("Content-Type", ""), "cloudscraper"
    except Exception as e:
        return 0, b"", f"exception:{type(e).__name__}:{str(e)[:60]}", "fail"


def validate_as_feed(content: bytes) -> tuple[bool, int, str]:
    feed = feedparser.parse(content)
    n = len(feed.entries or [])
    title = ""
    if n:
        title = (feed.entries[0].get("title") or "")[:80]
    return n >= 3, n, title


def probe_one(lang: str, state: str, slug: str, url: str) -> dict:
    out = {"lang": lang, "state": state, "slug": slug, "url": url}
    code, content, ctype, fetcher = try_fetch(url)
    out["http"] = code
    out["ctype"] = (ctype or "")[:60]
    out["fetcher"] = fetcher
    out["size"] = len(content)
    if not content:
        out["ok"] = False
        out["reason"] = f"fetch_failed:{ctype}"
        return out
    # Try as RSS first
    ok, n, title = validate_as_feed(content)
    out["entries"] = n
    out["first_title"] = title
    if ok:
        out["ok"] = True
        return out
    # If it's HTML, try feed-discovery
    text = content[:300_000].decode("utf-8", errors="ignore")
    if "<html" in text.lower() or "<!doctype html" in text.lower():
        discovered = parse_for_feeds(text, url)
        out["discovered_feeds"] = discovered[:8]
        # Probe each discovered feed
        for f_url in discovered:
            d_code, d_content, d_ctype, d_fetcher = try_fetch(f_url)
            if not d_content:
                continue
            d_ok, d_n, d_title = validate_as_feed(d_content)
            if d_ok:
                out["ok"] = True
                out["url"] = f_url  # rewrite to the discovered URL
                out["entries"] = d_n
                out["first_title"] = d_title
                out["fetcher"] = d_fetcher
                out["discovered_via"] = url
                return out
    out["ok"] = False
    out["reason"] = f"no_feed:entries={n}"
    return out


def main():
    results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(probe_one, *c): c for c in CANDIDATES}
        for f in as_completed(futs):
            results.append(f.result())
    results.sort(key=lambda r: (r["lang"], not r.get("ok", False), r["slug"]))
    live = [r for r in results if r.get("ok")]
    print(f"\n=== LIVE: {len(live)} / {len(results)} ===")
    for r in live:
        via = f" (via {r.get('discovered_via','direct')})" if r.get("discovered_via") else ""
        print(f"  {r['lang']:>3}  {r['state']:>9}  {r['slug']:25}  {r['entries']:>3}  {r['fetcher']:13}  {r['url']}{via}")
    dead = [r for r in results if not r.get("ok")]
    print(f"\n=== DEAD: {len(dead)} ===")
    for r in dead:
        print(f"  {r['lang']:>3}  {r['state']:>9}  {r['slug']:25}  {r.get('reason','?'):28}")
    with open("tools/msn_probe/probe_v2_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
