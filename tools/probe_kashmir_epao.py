"""
Probe Kashmir Patriot main + 2 tag feeds + E-Pao Manipuri.

For E-Pao (no known feed URL), scan homepage for <link rel=alternate>
and try common WordPress paths.
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
            return r.status_code, r.content, "requests"
        last = r.status_code
    except Exception:
        last = 0
    try:
        s = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows"})
        r = s.get(url, timeout=25, allow_redirects=True)
        return r.status_code, r.content, "cloudscraper"
    except Exception as e:
        return 0, b"", f"fail:{type(e).__name__}"


def discover_homepage(homepage):
    code, content, _ = try_fetch(homepage)
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


def probe(label, url):
    out = {"label": label, "url": url}
    code, content, fetcher = try_fetch(url)
    out["http"], out["fetcher"] = code, fetcher
    if not content:
        out["ok"] = False
        out["reason"] = f"fetch_failed:{fetcher}"
        return out
    feed = feedparser.parse(content)
    entries = feed.entries or []
    titles = [(e.get("title", "") or "").strip() for e in entries[:3]]
    out.update({
        "ok": len(entries) >= 3,
        "n_entries": len(entries),
        "first_titles": titles,
    })
    if not out["ok"]:
        out["reason"] = f"entries={len(entries)}"
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")

    # Direct candidates
    direct = [
        ("kashmir-patriot-main",      "https://www.kashmirpatriot.com/feed/"),
        ("kashmir-patriot-armed",     "https://www.kashmirpatriot.com/tag/armed-forces/feed/"),
        ("kashmir-patriot-pmkisan",   "https://www.kashmirpatriot.com/tag/pm-kisan/feed/"),
        # E-Pao seed candidates
        ("epao-feed",                 "https://e-pao.net/feed"),
        ("epao-rss",                  "https://e-pao.net/rss"),
        ("epao-rss-xml",              "https://e-pao.net/rss.xml"),
        ("epao-index-xml",            "https://e-pao.net/index.xml"),
        ("epao-www-feed",             "https://www.e-pao.net/feed"),
        ("epao-www-rss",              "https://www.e-pao.net/rss"),
    ]

    # E-Pao homepage discovery
    print("=== E-Pao homepage discovery ===")
    discovered_epao = discover_homepage("https://e-pao.net") + discover_homepage("https://www.e-pao.net")
    discovered_epao = sorted(set(discovered_epao))
    print(f"  found {len(discovered_epao)} discovered URLs:")
    for d in discovered_epao[:10]:
        print(f"    {d}")
    for i, d in enumerate(discovered_epao):
        direct.append((f"epao-discovered-{i+1}", d))

    # Kashmir Patriot homepage discovery as bonus (may surface category feeds)
    print("\n=== Kashmir Patriot homepage discovery ===")
    discovered_kp = discover_homepage("https://www.kashmirpatriot.com")
    print(f"  found {len(discovered_kp)} discovered URLs:")
    for d in discovered_kp[:10]:
        print(f"    {d}")
    for i, d in enumerate(discovered_kp):
        # Skip ones already in our direct list (by url)
        if d not in [u for _, u in direct]:
            direct.append((f"kashmir-discovered-{i+1}", d))

    print(f"\n=== Probing {len(direct)} candidates ===")
    results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(probe, lbl, url): (lbl, url) for lbl, url in direct}
        for f in as_completed(futs):
            results.append(f.result())

    results.sort(key=lambda r: (not r.get("ok"), r["label"]))
    live = [r for r in results if r.get("ok")]
    dead = [r for r in results if not r.get("ok")]
    print(f"\n=== LIVE: {len(live)} / {len(results)} ===")
    for r in live:
        print(f"  {r['label']:32}  ent={r['n_entries']:>3}  fetcher={r['fetcher']:13}  {r['url']}")
        for t in r["first_titles"][:2]:
            print(f"      {t[:110]}")
    print(f"\n=== DEAD: {len(dead)} ===")
    for r in dead:
        print(f"  {r['label']:32}  {r.get('reason','?'):20}  http={r.get('http')}")

    Path("tools/msn_probe/kashmir_epao_probe.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
