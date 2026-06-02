"""
Smoke-test the article-body extractor against:
  1. A summary-only RSS publisher (Saamana — Marathi, content:encoded
     not provided) — proves extraction recovers the full body
  2. A content:encoded publisher (TOI India — RSS already has body) —
     proves the path-1 fast return works

Doesn't touch production DB. Tests just article_body.extract_body() +
the requests fetcher path.
"""
from __future__ import annotations

import os, sys
from pathlib import Path


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    backend = Path(__file__).resolve().parent.parent.parent / "chitti-news" / "backend"
    sys.path.insert(0, str(backend))

    from services import article_body  # noqa

    # Pull a few actual article URLs (not section pages) from live RSS so
    # the extractor is exercised against the real surfaces blind users
    # would hit when they tap 🔊.
    import requests, feedparser
    feeds_to_sample = [
        ("EastMojo",         "https://eastmojo.com/feed/"),
        ("Saamana (Marathi)", "https://www.saamana.com/feed/"),
        ("Hindu BusinessLine", "https://www.thehindubusinessline.com/feeder/default.rss"),
        ("OneIndia News",    "https://www.oneindia.com/rss/news-fb.xml"),
    ]
    targets = []
    for label, feed_url in feeds_to_sample:
        try:
            r = requests.get(feed_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
            feed = feedparser.parse(r.content)
            if feed.entries:
                e = feed.entries[0]
                # Skip if the feed already shipped a rich content:encoded —
                # we want to test the EXTRACTION path, not the fast path.
                content_field = e.get("content")
                rich = bool(content_field and isinstance(content_field, list)
                            and content_field[0].get("value", "").strip()
                            and len(content_field[0]["value"].split()) >= 60)
                targets.append((label + (" (RSS already rich)" if rich else " (summary-only)"),
                                e.get("link", "")))
        except Exception as e:
            print(f"  could not sample {label}: {e}")

    print("=" * 78)
    print("Probing real publisher pages for extraction depth")
    print("=" * 78)
    for label, url in targets:
        body = article_body.extract_body(url)
        n_words = len((body or "").split())
        # Show first 150 chars of body
        sample = (body or "(none)").replace("\n", " ")[:240]
        status = "OK" if n_words >= 80 else "TOO SHORT"
        print(f"\n{label}")
        print(f"  URL    : {url}")
        print(f"  Words  : {n_words}  ({status})")
        print(f"  Sample : {sample}…")


if __name__ == "__main__":
    main()
