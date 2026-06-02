"""
services/article_body.py
------------------------
Server-side body extraction for the speaker-reads-full-news contract
(Sire 2026-06-02). When an RSS publisher only ships a short summary,
we fetch the article URL and pull the main content so blind users
hear the entire news through the 🔊 button — not just headline + blurb.

The extractor is heuristic in priority order:
  1. <article> tag (most semantic news sites)
  2. [itemprop="articleBody"] (schema.org NewsArticle)
  3. <div class="*article-content*|*post-content*|*entry-content*|*story-body*">
  4. <main> tag fallback
  5. Largest <div> whose direct text is mostly <p> paragraphs

Strips: <script>, <style>, <nav>, <header>, <footer>, <aside>, <form>,
<noscript>, ad-related classes, share widgets.

Caches the extracted body to Article.content so subsequent reads are
instant. Idempotent: if Article.content is already populated, skip.

Two-stage fetcher mirrors news_ingest._http_get (requests →
cloudscraper) so Cloudflare-protected publishers (Saamana, Prajavani,
Tribune…) still extract.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Optional

import requests
from bs4 import BeautifulSoup

from models.article import Article

try:
    import cloudscraper  # type: ignore
    _HAS_CLOUDSCRAPER = True
except ImportError:
    _HAS_CLOUDSCRAPER = False

log = logging.getLogger("article_body")

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# Tags whose contents are NEVER article body — strip wholesale.
_STRIP_TAGS = (
    "script", "style", "noscript", "iframe", "form", "nav", "header",
    "footer", "aside", "figure",
)

# Class-substring blacklist — remove elements that match anywhere in
# their class attribute. Covers most ad / share / related-posts patterns.
_STRIP_CLASS_HINTS = (
    "advert", "ad-", "ad_", "sidebar", "share", "social", "comment",
    "related", "newsletter", "subscribe", "promo", "popup", "modal",
    "cookie", "consent", "banner-",
)

# Word-count threshold below which we don't trust the extraction.
_MIN_WORDS = 80


def _http_get(url: str) -> tuple[int, bytes, str]:
    """Two-stage fetcher — same pattern as news_ingest._http_get."""
    try:
        r = requests.get(url, headers={"User-Agent": UA, "Accept": "*/*"},
                         timeout=20, allow_redirects=True)
        if r.status_code == 200 and r.content and len(r.content) > 200:
            return r.status_code, r.content, "requests"
        last = r.status_code
    except Exception:
        last = 0
    if not _HAS_CLOUDSCRAPER:
        return last, b"", "no-cloudscraper"
    try:
        s = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows"})
        r = s.get(url, timeout=25, allow_redirects=True)
        return r.status_code, r.content, "cloudscraper"
    except Exception as e:  # noqa: BLE001
        return 0, b"", f"cs-exc:{type(e).__name__}"


def _strip_noise(soup: BeautifulSoup) -> None:
    """Drop tags that never contain article body."""
    for tag in soup.find_all(_STRIP_TAGS):
        tag.decompose()
    # Class-substring blacklist. Snapshot the list because decomposing an
    # ancestor invalidates descendant references mid-iteration (bs4 quirk).
    candidates = list(soup.find_all(class_=True))
    for el in candidates:
        # el.attrs is None if a parent was decomposed already
        if not getattr(el, "attrs", None):
            continue
        classes = " ".join(el.get("class", []) or []).lower()
        if any(h in classes for h in _STRIP_CLASS_HINTS):
            try:
                el.decompose()
            except Exception:
                pass


def _node_text(node) -> str:
    """Flatten a BeautifulSoup node to clean paragraph text."""
    paragraphs: list[str] = []
    for p in node.find_all(["p", "li", "h2", "h3", "h4", "blockquote"]):
        txt = p.get_text(" ", strip=True)
        if not txt:
            continue
        # Skip "Read also:" / "Read More:" / "Watch:" boilerplate
        if re.match(r"^(read\s+(also|more|next)|watch|tags?|share\s+this)", txt, re.I):
            continue
        if len(txt) < 4:
            continue
        paragraphs.append(txt)
    return "\n\n".join(paragraphs)


def _candidates(soup: BeautifulSoup) -> list:
    """Priority-ordered list of extraction candidates."""
    cands: list = []
    # 1. <article>
    for a in soup.find_all("article"):
        cands.append(("article", a))
    # 2. [itemprop="articleBody"]
    for ib in soup.find_all(attrs={"itemprop": "articleBody"}):
        cands.append(("itemprop", ib))
    # 3. Common class-name patterns
    pat = re.compile(
        r"(article|post|entry|story|content)[-_]?(body|content|main|wrap|inner|text)?",
        re.I,
    )
    for d in soup.find_all(["div", "section"], class_=pat):
        cands.append(("class", d))
    # 4. <main>
    for m in soup.find_all("main"):
        cands.append(("main", m))
    return cands


def _best_candidate(soup: BeautifulSoup) -> str:
    """Pick the candidate with the most paragraph text."""
    best_text = ""
    for _src, node in _candidates(soup):
        txt = _node_text(node)
        if len(txt) > len(best_text):
            best_text = txt
    # Fallback — flatten the whole body and take its paragraphs.
    if len(best_text.split()) < _MIN_WORDS:
        body = soup.find("body")
        if body:
            fallback = _node_text(body)
            if len(fallback.split()) > len(best_text.split()):
                best_text = fallback
    return best_text


def _from_json_ld(soup: BeautifulSoup) -> str:
    """
    Many news sites embed schema.org NewsArticle metadata in a
    <script type="application/ld+json"> block server-side, including
    the full articleBody. This bypasses HTML-scraping defences because
    the JSON is part of the initial HTML payload, not JS-rendered.

    Walks every ld+json script in the doc. Returns the longest
    articleBody / description string found.
    """
    best = ""
    for tag in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = tag.string or tag.get_text() or ""
        if not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except Exception:
            # Some sites concatenate multiple JSON objects or have invalid
            # JSON — try to salvage by finding the longest articleBody-like
            # substring via regex.
            for m in re.finditer(r'"articleBody"\s*:\s*"((?:\\.|[^"\\])+)"', raw):
                candidate = m.group(1).encode("utf-8").decode("unicode_escape", errors="ignore")
                if len(candidate.split()) > len(best.split()):
                    best = candidate
            continue
        # data can be a dict, a list of dicts (multiple Things), or
        # a Graph with @graph: [...].
        nodes: list = []
        if isinstance(data, dict):
            nodes = [data] + (data.get("@graph") or [])
        elif isinstance(data, list):
            nodes = data
        for node in nodes:
            if not isinstance(node, dict):
                continue
            for field in ("articleBody", "description"):
                v = node.get(field)
                if isinstance(v, str) and len(v.split()) > len(best.split()):
                    best = v
    return best.strip()


def extract_body(url: str) -> Optional[str]:
    """
    Public entry point. Fetch the URL, extract the article body, return
    plain text (paragraphs joined by blank lines). None on failure.
    """
    if not url:
        return None
    code, content, fetcher = _http_get(url)
    if code != 200 or not content:
        log.info("extract_body fetch failed: url=%s code=%s via=%s", url, code, fetcher)
        return None
    try:
        html_text = content.decode("utf-8", errors="ignore")
        soup = BeautifulSoup(html_text, "html.parser")
        # Try JSON-LD FIRST — sites that JS-render their HTML body almost
        # always still ship schema.org NewsArticle in the initial payload.
        # When this succeeds it's usually the cleanest and longest body.
        json_ld = _from_json_ld(soup)
        if len(json_ld.split()) >= _MIN_WORDS:
            log.info("extract_body via JSON-LD: url=%s words=%d", url, len(json_ld.split()))
            return json_ld
        # Fall back to HTML heuristics.
        _strip_noise(soup)
        body = _best_candidate(soup)
        body = re.sub(r"\n{3,}", "\n\n", body).strip()
        if len(body.split()) < _MIN_WORDS:
            # As a last resort, prefer the JSON-LD body even if it's short —
            # any structured text beats falling through to None.
            if json_ld and len(json_ld) > len(body):
                return json_ld
            log.info("extract_body too short: url=%s html=%d ld=%d",
                     url, len(body.split()), len(json_ld.split()))
            return None
        return body
    except Exception as e:  # noqa: BLE001
        log.exception("extract_body exception: url=%s err=%s", url, e)
        return None


def ensure_body(db, article: Article) -> Optional[str]:
    """
    Lazy-fill Article.content if empty. Caches the extracted body so the
    next read is instant. Returns the body (existing or newly extracted)
    or None if extraction failed.
    """
    if article.content and len(article.content.split()) >= _MIN_WORDS:
        return article.content
    if not article.link:
        return article.content or None
    body = extract_body(article.link)
    if body:
        article.content = body[:50_000]   # bound DB row growth
        db.commit()
        log.info("ensure_body cached %d words for slug=%s id=%d",
                 len(body.split()), article.source_slug, article.id)
        return article.content
    return article.content or article.summary or None
