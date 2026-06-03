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
CANDIDATES: dict[str, list[dict]] = {
    "mr": [  # Marathi
        {"domain": "maharashtratimes.indiatimes.com",   "name": "Maharashtra Times (TOI)"},
        {"domain": "www.mid-day.com",                   "name": "Mid-Day Marathi"},
        {"domain": "www.esakal.com",                    "name": "eSakal"},
        {"domain": "www.pudhari.com",                   "name": "Pudhari"},
        {"domain": "www.tarunbharat.com",               "name": "Tarun Bharat"},
        {"domain": "www.pratika.com",                   "name": "Pratika"},
    ],
    "or": [  # Odia
        {"domain": "sambad.in",                         "name": "Sambad"},
        {"domain": "www.dharitri.com",                  "name": "Dharitri"},
        {"domain": "www.samajalive.in",                 "name": "Samaja"},
        {"domain": "kanaknews.com",                     "name": "Kanak News"},
        {"domain": "otv.in",                            "name": "OTV"},
        {"domain": "argusnews.in",                      "name": "Argus News"},
    ],
    "bn": [  # Bengali
        {"domain": "www.anandabazar.com",               "name": "Anandabazar Patrika"},
        {"domain": "www.bartamanpatrika.com",           "name": "Bartaman Patrika"},
        {"domain": "ebela.in",                          "name": "Ebela"},
        {"domain": "www.uttarbangasambad.com",          "name": "Uttar Banga Sambad"},
        {"domain": "www.aajkaal.in",                    "name": "Aajkaal"},
        {"domain": "www.sangbadpratidin.in",            "name": "Sangbad Pratidin"},
    ],
    "kn": [  # Kannada
        {"domain": "vijaykarnataka.com",                "name": "Vijaya Karnataka"},
        {"domain": "www.udayavani.com",                 "name": "Udayavani"},
        {"domain": "www.kannadaprabha.com",             "name": "Kannada Prabha"},
        {"domain": "www.prajavani.net",                 "name": "Prajavani"},
        {"domain": "www.varthabharati.in",              "name": "Vartha Bharati"},
        {"domain": "www.samyukthakarnataka.com",        "name": "Samyuktha Karnataka"},
    ],
    "ur": [  # Urdu
        {"domain": "urdu.siasat.com",                   "name": "The Siasat Daily"},
        {"domain": "inquilab.com",                      "name": "Inquilab Urdu"},
        {"domain": "www.urdufax.com",                   "name": "Urdu Fax"},
        {"domain": "www.urdupost.com",                  "name": "Urdu Post"},
        {"domain": "www.etemaaddaily.com",              "name": "Etemaad Daily"},
        {"domain": "www.qaumiawaz.com",                 "name": "Qaumi Awaz"},
    ],
    "gu": [  # Gujarati — note: most have NO public RSS, app-API capture is the path
        {"domain": "gujaratitelegraph.com",             "name": "Gujarati Telegraph"},
        {"domain": "www.gujaratsamachar.com",           "name": "Gujarat Samachar"},
        {"domain": "akilanews.com",                     "name": "Akila News"},
        {"domain": "www.westerntimesnews.in",           "name": "Western Times"},
        {"domain": "navsarjannews.com",                 "name": "Navsarjan News"},
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
