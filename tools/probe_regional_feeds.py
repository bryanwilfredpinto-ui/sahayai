"""
Probe a list of candidate RSS/feed URLs for major Indian regional publishers.
Uses WordPress /feed convention + known endpoints. Prints per-URL:
  HTTP code · content-type · is_rss (parses as feed) · n_entries · first title.

Run:
  python tools/probe_regional_feeds.py
"""
from __future__ import annotations

import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import feedparser
import requests

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

CANDIDATES = [
    # Telugu (AP / TG)
    ("te", "ap", "sakshi-te",             "https://www.sakshi.com/feed"),
    ("te", "ap", "eenadu-te",             "https://www.eenadu.net/feed"),
    ("te", "ap", "andhrajyothy-te",       "https://www.andhrajyothy.com/feed"),
    ("te", "ap", "ntvtelugu",             "https://ntvtelugu.com/feed"),
    ("te", "ap", "v6velugu",              "https://www.v6velugu.com/feed"),
    ("te", "telangana", "namasthe-telangana", "https://www.ntnews.com/feed"),
    ("te", "telangana", "telugu-samayam", "https://telugu.samayam.com/rssfeedsdefault.cms"),
    # Tamil (TN)
    ("ta", "tn", "vikatan",               "https://www.vikatan.com/feed"),
    ("ta", "tn", "dailythanthi",          "https://www.dailythanthi.com/feed"),
    ("ta", "tn", "polimer-news",          "https://www.polimernews.com/feed"),
    ("ta", "tn", "hindu-tamil",           "https://tamil.thehindu.com/feeder/default.rss"),
    ("ta", "tn", "tamilsamayam",          "https://tamil.samayam.com/rssfeedsdefault.cms"),
    ("ta", "tn", "puthiyathalaimurai",    "https://www.puthiyathalaimurai.com/feed"),
    ("ta", "tn", "dinamani",              "https://www.dinamani.com/rss"),
    # Bengali (WB)
    ("bn", "wb", "bartaman",              "https://www.bartamanpatrika.com/feed"),
    ("bn", "wb", "aajkaal",               "https://www.aajkaal.in/rss/Latest_News"),
    ("bn", "wb", "eisamay",               "https://eisamay.com/rssfeedsdefault.cms"),
    ("bn", "wb", "bengali-samayam",       "https://bengali.samayam.com/rssfeedsdefault.cms"),
    ("bn", "wb", "uttarbanga",            "https://uttarbangasambad.com/feed"),
    ("bn", "wb", "nabbarat",              "https://www.nababarta.in/feed"),
    # Marathi (MH)
    ("mr", "mh", "maharashtratimes",      "https://maharashtratimes.com/rssfeedsdefault.cms"),
    ("mr", "mh", "loksatta",              "https://www.loksatta.com/feed/"),
    ("mr", "mh", "esakal",                "https://www.esakal.com/rss"),
    ("mr", "mh", "saamana",               "https://www.saamana.com/feed/"),
    ("mr", "mh", "abp-marathi",           "https://news.abplive.com/marathi/feed"),
    ("mr", "mh", "marathi-samayam",       "https://marathi.samayam.com/rssfeedsdefault.cms"),
    ("mr", "mh", "tarunbharat-marathi",   "https://tarunbharat.com/feed/"),
    # Kannada (KA)
    ("kn", "ka", "prajavani",             "https://www.prajavani.net/feed"),
    ("kn", "ka", "udayavani",             "https://www.udayavani.com/feed"),
    ("kn", "ka", "kannadaprabha",         "https://www.kannadaprabha.com/rss"),
    ("kn", "ka", "vijayavani",            "https://www.vijayavani.net/feed/"),
    ("kn", "ka", "kannada-samayam",       "https://vijaykarnataka.com/rssfeedsdefault.cms"),
    ("kn", "ka", "varthabharati",         "https://www.varthabharati.in/rss.xml"),
    # Malayalam (KL)
    ("ml", "kl", "madhyamam",             "https://www.madhyamam.com/rss/latest"),
    ("ml", "kl", "deshabhimani",          "https://www.deshabhimani.com/rss"),
    ("ml", "kl", "siraj",                 "https://www.sirajlive.com/feed"),
    ("ml", "kl", "doolnews",              "https://www.doolnews.com/feed"),
    ("ml", "kl", "twentyfournews",        "https://www.twentyfournews.com/feed"),
    # Odia (OR)
    ("or", "or", "sambad-en",             "https://sambadenglish.com/feed"),
    ("or", "or", "otv",                   "https://odishatv.in/rss/news.xml"),
    ("or", "or", "argus-en",              "https://www.theargus.in/feed"),
    ("or", "or", "kalingatv",             "https://kalingatv.com/feed"),
    ("or", "or", "pragativadi",           "https://pragativadi.com/feed"),
    ("or", "or", "odishabytes",           "https://odishabytes.com/feed"),
    # Gujarati (GJ)
    ("gu", "gj", "divyabhaskar-gu",       "https://www.divyabhaskar.co.in/rss-v1--category-1057.xml"),
    ("gu", "gj", "sandesh",               "https://sandesh.com/feed"),
    ("gu", "gj", "abp-asmita",            "https://news.abplive.com/gujarati/feed"),
    ("gu", "gj", "vtv-gujarati",          "https://www.vtvgujarati.com/feed"),
    # Punjabi (PB)
    ("pa", "pb", "rozanaspokesman",       "https://www.rozanaspokesman.com/feed"),
    ("pa", "pb", "jagbani",               "https://www.jagbani.punjabkesari.in/feed"),
    ("pa", "pb", "punjabi-jagran",        "https://www.punjabijagran.com/feed"),
    ("pa", "pb", "abp-sanjha",            "https://news.abplive.com/punjabi/feed"),
    # Hindi extras
    ("hi", "india", "navbharat",          "https://navbharattimes.indiatimes.com/rssfeedsdefault.cms"),
    ("hi", "india", "punjabkesari-hi",    "https://www.punjabkesari.in/feed"),
    ("hi", "india", "zee-hindi",          "https://zeenews.india.com/hindi/rss/india-news.xml"),
    ("hi", "india", "patrika-hi",         "https://www.patrika.com/feed"),
    # English extras (state)
    ("en", "ap", "thehansindia",          "https://www.thehansindia.com/rss/national"),
    ("en", "wb", "telegraph-india",       "https://www.telegraphindia.com/feed"),
    ("en", "mh", "freepressjournal",      "https://www.freepressjournal.in/feed"),
    ("en", "kl", "newindianexpress-kerala","https://www.newindianexpress.com/states/kerala/rssfeed/?id=159&getXmlFeed=true"),
    ("en", "tn", "newindianexpress-tn",   "https://www.newindianexpress.com/states/tamil-nadu/rssfeed/?id=160&getXmlFeed=true"),
    # Urdu
    ("ur", "india", "urdu-siasat",        "https://urdu.siasat.com/feed"),
    ("ur", "india", "etemaad-urdu",       "https://www.etemaaddaily.com/rss.xml"),
    ("ur", "india", "inquilab-urdu",      "https://www.inquilab.com/rss/india-news"),
]


def probe_one(lang: str, state: str, slug: str, url: str) -> dict:
    out = {"lang": lang, "state": state, "slug": slug, "url": url}
    try:
        r = requests.get(url, headers={"User-Agent": UA, "Accept": "*/*"}, timeout=15, allow_redirects=True)
        out["http"] = r.status_code
        out["ctype"] = (r.headers.get("Content-Type") or "")[:80]
        out["size"] = len(r.content)
        if r.status_code != 200:
            out["ok"] = False
            out["reason"] = f"http_{r.status_code}"
            return out
        feed = feedparser.parse(r.content)
        n = len(feed.entries or [])
        out["entries"] = n
        out["bozo"] = bool(getattr(feed, "bozo", 0))
        out["first_title"] = (feed.entries[0].get("title", "") if n else "")[:80]
        out["ok"] = n >= 3
        if not out["ok"]:
            out["reason"] = f"only_{n}_entries"
        return out
    except Exception as e:
        out["ok"] = False
        out["reason"] = f"exception:{type(e).__name__}:{str(e)[:80]}"
        return out


def main():
    results = []
    with ThreadPoolExecutor(max_workers=16) as ex:
        futs = {ex.submit(probe_one, *c): c for c in CANDIDATES}
        for f in as_completed(futs):
            results.append(f.result())
    # Sort by lang, ok desc, slug
    results.sort(key=lambda r: (r["lang"], not r.get("ok", False), r["slug"]))
    live = [r for r in results if r.get("ok")]
    dead = [r for r in results if not r.get("ok")]
    print(f"\n=== LIVE FEEDS: {len(live)} / {len(results)} ===")
    for r in live:
        print(f"  {r['lang']:>3}  {r['state']:>9}  {r['slug']:25}  {r.get('entries','?'):>3}  {r['url']}")
    print(f"\n=== DEAD: {len(dead)} ===")
    for r in dead:
        print(f"  {r['lang']:>3}  {r['state']:>9}  {r['slug']:25}  {r.get('reason','?'):30}  {r['url']}")
    with open("tools/msn_probe/probe_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nFull results written to tools/msn_probe/probe_results.json")


if __name__ == "__main__":
    main()
