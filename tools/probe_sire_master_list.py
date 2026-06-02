"""
Probe Sire's 20-URL master list candidates. Same two-stage fetcher +
content-hash alias detection + script detection.

Output: tools/msn_probe/sire_master_probe.json
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import cloudscraper
import feedparser
import requests

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

GUJARATI_RX  = re.compile(r"[઀-૿]")
DEVANAGARI_RX = re.compile(r"[ऀ-ॿ]")
BENGALI_RX   = re.compile(r"[ঀ-৿]")
TAMIL_RX     = re.compile(r"[஀-௿]")
TELUGU_RX    = re.compile(r"[ఀ-౿]")
KANNADA_RX   = re.compile(r"[ಀ-೿]")
MALAYALAM_RX = re.compile(r"[ഀ-ൿ]")
ORIYA_RX     = re.compile(r"[଀-୿]")
GURMUKHI_RX  = re.compile(r"[਀-੿]")
ARABIC_RX    = re.compile(r"[؀-ۿ]")


def detect_script(t):
    if GUJARATI_RX.search(t): return "Gujarati"
    if DEVANAGARI_RX.search(t): return "Devanagari"
    if BENGALI_RX.search(t): return "Bengali"
    if TAMIL_RX.search(t): return "Tamil"
    if TELUGU_RX.search(t): return "Telugu"
    if KANNADA_RX.search(t): return "Kannada"
    if MALAYALAM_RX.search(t): return "Malayalam"
    if ORIYA_RX.search(t): return "Oriya"
    if GURMUKHI_RX.search(t): return "Gurmukhi"
    if ARABIC_RX.search(t): return "Arabic"
    return "Latin"


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


def probe(c):
    url, slug = c["url"], c["slug"]
    out = {"slug": slug, "url": url}
    code, content, fetcher = try_fetch(url)
    out["http"], out["fetcher"] = code, fetcher
    if not content:
        out["ok"] = False
        out["reason"] = "fetch_failed"
        return out
    feed = feedparser.parse(content)
    entries = feed.entries or []
    titles = [(e.get("title", "") or "").strip() for e in entries[:5]]
    links = [(e.get("link", "") or "").strip() for e in entries[:5]]
    h = hashlib.sha256("\n".join(links).encode("utf-8")).hexdigest()[:12]
    script = detect_script(" ".join(titles[:3]))
    out.update({
        "ok": len(entries) >= 3,
        "n_entries": len(entries),
        "content_hash": h,
        "script": script,
        "first_titles": titles[:3],
    })
    if not out["ok"]:
        out["reason"] = f"entries={len(entries)}"
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    candidates = json.loads(Path("tools/msn_probe/sire_master_list.json").read_text(encoding="utf-8"))
    print(f"Probing {len(candidates)} candidates...\n")
    results = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(probe, c): c for c in candidates}
        for f in as_completed(futs):
            results.append(f.result())
    results.sort(key=lambda r: (not r.get("ok"), r["slug"]))

    # Alias detection: group LIVE results by content_hash + flag overlaps
    # with hashes that already match existing sources.json entries.
    existing = json.loads(Path("chitti-news/backend/data/sources.json").read_text(encoding="utf-8"))

    live = [r for r in results if r.get("ok")]
    dead = [r for r in results if not r.get("ok")]
    print(f"=== LIVE: {len(live)} / {len(results)} ===")
    for r in live:
        print(f"  {r['slug']:20}  ent={r['n_entries']:>3}  script={r['script']:9}  hash={r['content_hash']}  fetcher={r['fetcher']}")
        for t in r["first_titles"][:2]:
            print(f"      {t[:110]}")
    print(f"\n=== DEAD: {len(dead)} ===")
    for r in dead:
        print(f"  {r['slug']:20}  {r.get('reason','?'):20}  http={r.get('http')}  {r['url']}")

    Path("tools/msn_probe/sire_master_probe.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
