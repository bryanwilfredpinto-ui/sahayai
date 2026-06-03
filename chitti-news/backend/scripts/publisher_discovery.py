"""
backend/scripts/publisher_discovery.py
--------------------------------------
SHIP gate row #9 — per-language publisher depth (mr / or / bn / kn / ur / gu).

Probe-based discovery of additional vernacular publisher RSS feeds for
the languages currently below the ≥10-publishers SLA target.

For each candidate domain, probes:
  - /feed
  - /feed/
  - /rss
  - /rss.xml
  - /index.xml
  - /atom.xml
  - <link rel="alternate" type="application/rss+xml">

Uses cloudscraper fallback for Cloudflare-protected publishers.

Output: scripts/publisher_discovery_<lang>_<date>.json
Each row: {domain, feed_url_found, content_type, language, suggested_seed_row}

Output is hand-reviewed by the CTO before being merged into
data/sources.json.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx

try:
    import cloudscraper  # type: ignore
    HAS_CLOUDSCRAPER = True
except ImportError:
    HAS_CLOUDSCRAPER = False


# Candidate domains per under-served language (curated, hand-verified live publishers).
# Run is HONEST: not all of these will have public RSS; the probe surfaces which do.
#
# v2 (2026-06-04): expanded 2nd-tier candidate lists per Sire directive to lift
# every under-served language to >=10 publishers. Lists deduplicate with the
# already-merged feeds; the merge script will skip rss_urls already present.
CANDIDATES: dict[str, list[dict]] = {
    "mr": [  # Marathi (existing: 9; target: 10+)
        {"domain": "www.loksatta.com",                  "name": "Loksatta"},
        {"domain": "www.lokmat.com",                    "name": "Lokmat"},
        {"domain": "www.saamana.com",                   "name": "Saamana"},
        {"domain": "www.mumbailive.com",                "name": "Mumbai Live (Marathi)"},
        {"domain": "marathi.abplive.com",               "name": "ABP Majha"},
        {"domain": "marathi.indianexpress.com",         "name": "Loksatta Indian Express"},
        {"domain": "www.jansatta.com",                  "name": "Jansatta Marathi"},
        {"domain": "www.deshdoot.com",                  "name": "Deshdoot"},
        {"domain": "www.maharashtratoday.co.in",        "name": "Maharashtra Today"},
        {"domain": "mr.vikaspedia.in",                  "name": "Vikaspedia Marathi"},
    ],
    "or": [  # Odia (existing: 9; target: 10+)
        {"domain": "odisha.gov.in",                     "name": "Odisha Govt News"},
        {"domain": "odishabytes.com",                   "name": "Odisha Bytes"},
        {"domain": "odishatv.in",                       "name": "Odisha TV"},
        {"domain": "www.orissapost.com",                "name": "Orissa Post"},
        {"domain": "www.newindianexpress.com",          "name": "New Indian Express Odisha"},
        {"domain": "pragativadi.com",                   "name": "Pragativadi"},
    ],
    "bn": [  # Bengali (existing: 8; target: 10+)
        {"domain": "www.zeenews.india.com",             "name": "Zee 24 Ghanta Bangla"},
        {"domain": "bengali.news18.com",                "name": "News18 Bangla"},
        {"domain": "bangla.hindustantimes.com",         "name": "Hindustan Times Bangla"},
        {"domain": "www.aajbikel.com",                  "name": "Aaj Bikel"},
        {"domain": "www.kolkata24x7.com",               "name": "Kolkata 24x7"},
        {"domain": "bangla.aajtak.in",                  "name": "AajTak Bangla"},
        {"domain": "bangla.asianetnews.com",            "name": "Asianet News Bangla"},
        {"domain": "tv9bangla.com",                     "name": "TV9 Bangla"},
    ],
    "kn": [  # Kannada (existing: 6; target: 10+)
        {"domain": "kannada.news18.com",                "name": "News18 Kannada"},
        {"domain": "kannada.oneindia.com",              "name": "OneIndia Kannada"},
        {"domain": "kannada.asianetnews.com",           "name": "Asianet Suvarna News"},
        {"domain": "vijayavani.net",                    "name": "Vijayavani"},
        {"domain": "kannadigaworld.com",                "name": "Kannadiga World"},
        {"domain": "www.deccanherald.com",              "name": "Deccan Herald Karnataka"},
        {"domain": "tv9kannada.com",                    "name": "TV9 Kannada"},
        {"domain": "kannada.hindustantimes.com",        "name": "Hindustan Times Kannada"},
    ],
    "ur": [  # Urdu (existing: 4; target: 10+)
        {"domain": "urdu.news18.com",                   "name": "News18 Urdu"},
        {"domain": "urdu.oneindia.com",                 "name": "OneIndia Urdu"},
        {"domain": "urdu.thequint.com",                 "name": "The Quint Urdu"},
        {"domain": "www.bbc.com",                       "name": "BBC Urdu", "path_hint": "/urdu/rss.xml"},
        {"domain": "urdupoint.com",                     "name": "UrduPoint"},
        {"domain": "www.dailypakistan.com.pk",          "name": "Daily Pakistan Urdu"},
        {"domain": "www.geo.tv",                        "name": "Geo News Urdu"},
        {"domain": "www.express.pk",                    "name": "Express News Urdu"},
        {"domain": "www.aajnews.tv",                    "name": "Aaj News Urdu"},
        {"domain": "www.jang.com.pk",                   "name": "Jang Urdu"},
    ],
    "ta": [  # Tamil (round-3: NEW candidates beyond round-2)
        {"domain": "tamil.indianexpress.com",           "name": "Indian Express Tamil"},
        {"domain": "tamil.boldsky.com",                 "name": "BoldSky Tamil"},
        {"domain": "tamil.filmibeat.com",               "name": "FilmiBeat Tamil"},
        {"domain": "puthiyathalaimurai.com",            "name": "Puthiya Thalaimurai"},
        {"domain": "tamil.gizbot.com",                  "name": "GizBot Tamil"},
        {"domain": "tamil.cricbuzz.com",                "name": "CricBuzz Tamil"},
        {"domain": "tamil.timesnownews.com",            "name": "Times Now Tamil"},
        {"domain": "www.maalaimalar.com",               "name": "Maalai Malar"},
    ],
    "pa": [  # Punjabi (round-3: NEW candidates beyond round-2)
        {"domain": "punjabi.indianexpress.com",         "name": "Indian Express Punjabi"},
        {"domain": "punjabi.aajtak.in",                 "name": "AajTak Punjabi"},
        {"domain": "punjabi.cricbuzz.com",              "name": "CricBuzz Punjabi"},
        {"domain": "punjabi.boldsky.com",               "name": "BoldSky Punjabi"},
        {"domain": "www.thepunjabnews.com",             "name": "The Punjab News"},
        {"domain": "www.tribuneindia.com",              "name": "Tribune India Punjabi"},
        {"domain": "punjabi.hindustantimes.com",        "name": "Hindustan Times Punjabi"},
        {"domain": "www.punjabikhabarsaar.com",         "name": "Punjabi Khabarsaar"},
    ],
    "te": [  # Telugu (existing: 7; target: 10+)
        {"domain": "telugu.news18.com",                 "name": "News18 Telugu"},
        {"domain": "telugu.oneindia.com",               "name": "OneIndia Telugu"},
        {"domain": "telugu.samayam.com",                "name": "Samayam Telugu"},
        {"domain": "telugu.abplive.com",                "name": "ABP Desam"},
        {"domain": "tv9telugu.com",                     "name": "TV9 Telugu"},
        {"domain": "www.sakshi.com",                    "name": "Sakshi"},
        {"domain": "www.andhrajyothy.com",              "name": "Andhra Jyothy"},
        {"domain": "www.eenadu.net",                    "name": "Eenadu"},
        {"domain": "telugu.hindustantimes.com",         "name": "Hindustan Times Telugu"},
        {"domain": "www.namasthetelangaana.com",        "name": "Namaste Telangana"},
    ],
    "gu": [  # Gujarati (existing: 12; supplement)
        {"domain": "gujarati.abplive.com",              "name": "ABP Asmita"},
        {"domain": "gujarati.news18.com",               "name": "News18 Gujarati"},
        {"domain": "tv9gujarati.com",                   "name": "TV9 Gujarati"},
        {"domain": "gujarati.oneindia.com",             "name": "OneIndia Gujarati"},
    ],
}

RSS_PATHS = ["/feed", "/feed/", "/rss", "/rss.xml", "/index.xml", "/atom.xml", "/feeds/posts/default"]
TIMEOUT = 12.0
UA = "Chitti-News/0.4 publisher-discovery (+https://sahayai.in)"


def _try_http(url: str) -> tuple[Optional[str], Optional[str]]:
    """Returns (body, content_type) or (None, err)."""
    try:
        with httpx.Client(timeout=TIMEOUT, follow_redirects=True,
                          headers={"User-Agent": UA}) as c:
            r = c.get(url)
            if r.status_code == 200:
                return r.text, r.headers.get("content-type", "")
    except Exception as e:  # noqa: BLE001
        return None, str(e)[:80]
    return None, f"HTTP not 200"


def _try_cloudscraper(url: str) -> tuple[Optional[str], Optional[str]]:
    if not HAS_CLOUDSCRAPER:
        return None, "cloudscraper not installed"
    try:
        s = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows", "mobile": False})
        r = s.get(url, timeout=TIMEOUT)
        if r.status_code == 200:
            return r.text, r.headers.get("content-type", "")
    except Exception as e:  # noqa: BLE001
        return None, str(e)[:80]
    return None, f"cs HTTP not 200"


def _is_rss(body: str, ctype: str) -> bool:
    if "xml" in (ctype or "").lower() or "rss" in (ctype or "").lower():
        # quick sniff: must contain <rss or <feed (Atom)
        return bool(re.search(r"<rss\s|<feed\s|<channel>", body[:2000], re.I))
    return False


def _discover_via_html(homepage_url: str) -> Optional[str]:
    """Look for <link rel="alternate" type="application/rss+xml">."""
    body, _ = _try_http(homepage_url)
    if not body:
        body, _ = _try_cloudscraper(homepage_url)
    if not body:
        return None
    m = re.search(
        r'<link[^>]+rel=["\']alternate["\'][^>]+(?:type=["\']application/rss\+xml["\'])[^>]+href=["\']([^"\']+)["\']',
        body, re.I,
    )
    if not m:
        m = re.search(
            r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']alternate["\'][^>]+(?:type=["\']application/(?:rss\+xml|atom\+xml)["\'])',
            body, re.I,
        )
    if not m:
        return None
    url = m.group(1)
    if url.startswith("//"):
        url = "https:" + url
    elif url.startswith("/"):
        from urllib.parse import urlparse
        u = urlparse(homepage_url)
        url = f"{u.scheme}://{u.netloc}{url}"
    return url


def probe_domain(domain: str) -> Optional[str]:
    """Try standard RSS paths + HTML <link> discovery. Returns RSS URL or None."""
    base = f"https://{domain}"
    # 1. Standard paths
    for path in RSS_PATHS:
        url = base + path
        body, ctype = _try_http(url)
        if body and _is_rss(body, ctype or ""):
            return url
    # 2. Cloudscraper retry on the canonical /feed
    body, ctype = _try_cloudscraper(base + "/feed")
    if body and _is_rss(body, ctype or ""):
        return base + "/feed"
    # 3. HTML <link rel="alternate"> discovery
    discovered = _discover_via_html(base)
    if discovered:
        b, c = _try_http(discovered)
        if b and _is_rss(b, c or ""):
            return discovered
        b, c = _try_cloudscraper(discovered)
        if b and _is_rss(b, c or ""):
            return discovered
    return None


def main(target_lang: Optional[str] = None) -> int:
    langs_to_probe = [target_lang] if target_lang else list(CANDIDATES.keys())
    out_dir = Path(__file__).resolve().parent
    overall_results: dict[str, list[dict]] = {}

    for lang in langs_to_probe:
        cands = CANDIDATES.get(lang, [])
        print(f"\n=== Probing {lang}: {len(cands)} candidates ===")
        results = []
        for c in cands:
            domain = c["domain"]
            print(f"  {domain}: ", end="", flush=True)
            feed_url = probe_domain(domain)
            ok = feed_url is not None
            if ok:
                print(f"FOUND {feed_url}")
            else:
                print("no public RSS")
            results.append({
                "domain": domain,
                "name": c["name"],
                "language": lang,
                "rss_url_found": feed_url,
                "found": ok,
                "suggested_seed_row": ({
                    "slug": re.sub(r"[^a-z0-9]+", "-", c["name"].lower()).strip("-"),
                    "display_name": c["name"],
                    "rss_url": feed_url,
                    "homepage_url": f"https://{domain}",
                    "language": lang,
                    "state": "india",
                    "category": "national",
                    "enabled": 1,
                } if ok else None),
            })
        overall_results[lang] = results

        out_path = out_dir / f"publisher_discovery_{lang}_{datetime.utcnow().strftime('%Y%m%d')}.json"
        out_path.write_text(json.dumps({
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "language": lang,
            "candidates_probed": len(cands),
            "rss_found": sum(1 for r in results if r["found"]),
            "results": results,
        }, indent=2))
        print(f"  -> {out_path}")

    total_found = sum(sum(1 for r in v if r["found"]) for v in overall_results.values())
    total_probed = sum(len(v) for v in overall_results.values())
    print(f"\n=== Summary: {total_found}/{total_probed} candidate domains have public RSS ===")
    return 0 if total_found > 0 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else None))
