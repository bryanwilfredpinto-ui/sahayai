"""
Verifier — proof of life for each live URL from ne_gj_cg_probe.json.

For each URL it:
  1. Fetches the feed again (canonical request)
  2. Lists the first 3 entry titles + link
  3. Computes content_hash over the first 5 entry links (deduplicates aliases)
  4. Detects Gujarati / Devanagari / Latin script in titles
  5. Flags Manipur / Meghalaya / Assam / Tripura / Sikkim / etc keywords
     in NE feeds to confirm category-routing actually works

Output: tools/msn_probe/ne_gj_cg_verify.json + a readable summary table.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import feedparser
import requests

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# Unicode block detection
GUJARATI_RX  = re.compile(r"[઀-૿]")          # ઐ ઑ etc
DEVANAGARI_RX = re.compile(r"[ऀ-ॿ]")         # Hindi / Marathi
BENGALI_RX   = re.compile(r"[ঀ-৿]")
TAMIL_RX     = re.compile(r"[஀-௿]")
TELUGU_RX    = re.compile(r"[ఀ-౿]")
KANNADA_RX   = re.compile(r"[ಀ-೿]")
MALAYALAM_RX = re.compile(r"[ഀ-ൿ]")
ORIYA_RX     = re.compile(r"[଀-୿]")
GURMUKHI_RX  = re.compile(r"[਀-੿]")          # Punjabi
ARABIC_RX    = re.compile(r"[؀-ۿ]")          # Urdu


def detect_script(text: str) -> str:
    if GUJARATI_RX.search(text): return "Gujarati"
    if DEVANAGARI_RX.search(text): return "Devanagari"
    if BENGALI_RX.search(text): return "Bengali"
    if TAMIL_RX.search(text): return "Tamil"
    if TELUGU_RX.search(text): return "Telugu"
    if KANNADA_RX.search(text): return "Kannada"
    if MALAYALAM_RX.search(text): return "Malayalam"
    if ORIYA_RX.search(text): return "Oriya"
    if GURMUKHI_RX.search(text): return "Gurmukhi"
    if ARABIC_RX.search(text): return "Arabic"
    return "Latin/ASCII"


# NE-state keyword spotter — confirms a "category/manipur/feed/" really has
# Manipur content, not generic feed leaking through.
NE_KEYWORDS = {
    "manipur":   re.compile(r"\b(manipur|imphal|meitei|kuki|moreh|churachandpur|kakching|thoubal|bishnupur)\b", re.I),
    "meghalaya": re.compile(r"\b(meghalaya|shillong|tura|jaintia|garo|khasi|nongpoh)\b", re.I),
    "assam":     re.compile(r"\b(assam|guwahati|dispur|dibrugarh|jorhat|silchar|tinsukia|bodoland)\b", re.I),
    "tripura":   re.compile(r"\b(tripura|agartala|udaipur)\b", re.I),
    "sikkim":    re.compile(r"\b(sikkim|gangtok|namchi)\b", re.I),
    "nagaland":  re.compile(r"\b(nagaland|kohima|dimapur|naga)\b", re.I),
    "arunachal": re.compile(r"\b(arunachal|itanagar|naharlagun)\b", re.I),
    "mizoram":   re.compile(r"\b(mizoram|aizawl|lunglei|mizo)\b", re.I),
}


def fetch_and_inspect(url: str) -> dict:
    try:
        r = requests.get(url, headers={"User-Agent": UA, "Accept": "*/*"},
                         timeout=20, allow_redirects=True)
        if r.status_code != 200 or not r.content:
            return {"url": url, "ok": False, "reason": f"http={r.status_code}"}
        feed = feedparser.parse(r.content)
        entries = feed.entries or []
        titles = [(e.get("title", "") or "").strip() for e in entries[:5]]
        links = [(e.get("link", "") or "").strip() for e in entries[:5]]
        # Content hash over first 5 links (alias-detector)
        h = hashlib.sha256("\n".join(links).encode("utf-8")).hexdigest()[:12]
        # Script detection over concatenated first 3 titles
        joined = " ".join(titles[:3])
        script = detect_script(joined)
        # NE keyword hits
        ne_hits = {k: bool(rx.search(joined)) for k, rx in NE_KEYWORDS.items()}
        return {
            "url": url,
            "ok": True,
            "n_entries": len(entries),
            "content_hash": h,
            "script": script,
            "first_titles": titles[:3],
            "ne_hits": [k for k, v in ne_hits.items() if v],
        }
    except Exception as e:
        return {"url": url, "ok": False, "reason": f"exc:{type(e).__name__}:{str(e)[:60]}"}


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    probe = json.loads(Path("tools/msn_probe/ne_gj_cg_probe.json").read_text(encoding="utf-8"))
    live_urls = [p["url"] for p in probe if p.get("ok")]
    publisher_by_url = {p["url"]: p["publisher"] for p in probe}
    print(f"Verifying {len(live_urls)} live URLs...\n")

    results = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(fetch_and_inspect, u): u for u in live_urls}
        for f in as_completed(futs):
            results.append(f.result())

    # Group by publisher + content_hash for alias detection
    publisher_groups = {}
    for r in results:
        if not r.get("ok"):
            continue
        pub = publisher_by_url.get(r["url"], "?")
        r["publisher"] = pub
        publisher_groups.setdefault(pub, {}).setdefault(r["content_hash"], []).append(r)

    print("=" * 90)
    print("PER-PUBLISHER VERIFICATION (URLs sharing a content_hash are aliases of one feed)")
    print("=" * 90)
    canonical_per_publisher = {}
    for pub, by_hash in publisher_groups.items():
        print(f"\n## {pub}  ({len(by_hash)} unique feed{'s' if len(by_hash) != 1 else ''})")
        canonical_per_publisher[pub] = []
        for h, urls in by_hash.items():
            sample = urls[0]
            ne_tag = f"  NE-keywords: {sample['ne_hits']}" if sample["ne_hits"] else ""
            print(f"  content_hash={h}  n_entries={sample['n_entries']}  script={sample['script']}{ne_tag}")
            print(f"    first titles:")
            for t in sample["first_titles"]:
                print(f"      - {t[:100]}")
            print(f"    {len(urls)} URL{'s' if len(urls) > 1 else ''} return this feed:")
            for u in urls:
                print(f"      {u}")
            # Pick canonical (shortest URL = least path noise)
            canonical = sorted(urls, key=lambda r: len(r["url"]))[0]
            canonical_per_publisher[pub].append({
                "url": canonical["url"],
                "n_entries": canonical["n_entries"],
                "script": canonical["script"],
                "ne_hits": canonical["ne_hits"],
                "first_titles": canonical["first_titles"],
                "content_hash": h,
            })

    Path("tools/msn_probe/ne_gj_cg_verify.json").write_text(
        json.dumps({"all": results, "canonical": canonical_per_publisher},
                   indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print("\n" + "=" * 90)
    print("CANONICAL SUMMARY — unique feeds per publisher")
    print("=" * 90)
    for pub, feeds in canonical_per_publisher.items():
        print(f"  {pub}: {len(feeds)} canonical feeds")


if __name__ == "__main__":
    main()
