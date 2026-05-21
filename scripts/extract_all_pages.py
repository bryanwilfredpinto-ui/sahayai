#!/usr/bin/env python3
"""extract_all_pages.py — extract every visible English string from the
14 user-listed Chitti pages (vaani + 13 others) into one combined corpus.

Output: scripts/all_pages_corpus.json — sorted unique English strings.

Builds on the original scripts/extract_vaani_strings.py logic — same
walker / normaliser / JS literal heuristics — just parameterised to
sweep every page at once. Pages that aren't on disk are skipped silently.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Comment

REPO = Path(__file__).resolve().parent.parent

PAGES = [
    "chitti_vaani.html",
    "chitti_medupi.html",
    "chitti_news.html",
    "chitti_upi.html",
    "chitti_ca.html",
    "chitti_legal.html",
    "chitti_government.html",
    "chitti_scanner.html",
    "chitti_fundamentals.html",
    "chitti_complete_technical.html",
    "chitti_news_ai.html",
    "chitti_voice_factory.html",
    "chitti_2wheeler.html",
    "chitti_4wheeler.html",
]

# Page-bundled scripts that inject English text into the DOM at runtime —
# extract from them too so the T-table covers MutationObserver-discovered nodes.
EXTRA_JS = [
    REPO / "chitti_disclaimer.js",
    REPO / "chitti_isl.js",
    REPO / "chitti_warmup.js",
    REPO / "feedback-widget.js",
]

OUT = REPO / "scripts" / "all_pages_corpus.json"

SKIP_TAGS = {"script", "style", "code", "pre", "textarea", "noscript", "head", "title", "meta", "link", "br", "hr"}
ATTR_KEYS = {
    "placeholder", "aria-label", "title", "alt",
    # data-chitti-section is the section name the feedback widget pastes
    # verbatim into its bar's visible <span class="chitti-fb-box-section">.
    # If this attribute value isn't in the T-table, the widget bar shows
    # the English name unchanged on every Indian-language switch.
    "data-chitti-section",
    # data-page is just an identifier (not user-visible) — skip.
}

_WS = re.compile(r"\s+")


def normalise(s):
    if not s:
        return None
    s = _WS.sub(" ", s).strip()
    if not s:
        return None
    if re.fullmatch(r"[\d\W_]+", s):
        return None
    if len(s) > 450:
        return None
    ascii_alpha = sum(1 for ch in s if ch.isascii() and ch.isalpha())
    total_alpha = sum(1 for ch in s if ch.isalpha())
    if total_alpha == 0 or ascii_alpha < 2:
        return None
    if (ascii_alpha / max(total_alpha, 1)) < 0.6:
        return None
    return s


def walk(node, strings, inside_skip=0):
    name = getattr(node, "name", None)
    if name is not None:
        if name.lower() in SKIP_TAGS:
            inside_skip += 1
        attrs = getattr(node, "attrs", {})
        for k, v in attrs.items():
            if k.lower() in ATTR_KEYS:
                val = v if isinstance(v, str) else " ".join(v) if isinstance(v, list) else None
                if val:
                    n = normalise(val)
                    if n:
                        strings.add(n)
    if isinstance(node, NavigableString) and not isinstance(node, Comment):
        if inside_skip == 0:
            n = normalise(str(node))
            if n:
                strings.add(n)
    children = getattr(node, "children", None)
    if children:
        for child in list(children):
            walk(child, strings, inside_skip)


def extract_js_strings(html_src, strings, is_pure_js=False):
    body_rx = re.compile(r"<script\b[^>]*>(.*?)</script>", re.DOTALL | re.IGNORECASE)
    lit_rx = re.compile(r"(['\"])((?:\\.|(?!\1).)+?)\1")
    tpl_rx = re.compile(r"`(\s*<[^`]{0,4000}?)`", re.DOTALL)
    UI_LIKE = re.compile(r"[A-Za-z]{2,}.*?[A-Za-z]{2,}", re.DOTALL)
    BLACKLIST = re.compile(
        r"^(?:[a-z][a-z0-9_-]*|/[\w/.-]+|#[a-zA-Z0-9_-]+|"
        r"[A-Z_]+|true|false|null|undefined|\d+px|rgba?\(|"
        r"https?://|data:|application/|text/|image/|chitti_)"
    )
    bodies = [html_src] if is_pure_js else body_rx.findall(html_src)
    for body in bodies:
        for m in tpl_rx.finditer(body):
            tpl = m.group(1)
            tpl = re.sub(r"\$\{[^}]*\}", "", tpl)
            try:
                bs = BeautifulSoup(tpl, "html.parser")
                walk(bs, strings)
            except Exception:
                pass
        for m in lit_rx.finditer(body):
            raw = m.group(2)
            n = normalise(raw)
            if not n:
                continue
            if BLACKLIST.match(n):
                continue
            if not UI_LIKE.search(n):
                continue
            if "<" in n and ">" in n:
                try:
                    bs = BeautifulSoup(n, "html.parser")
                    walk(bs, strings)
                except Exception:
                    pass
                continue
            if " " not in n and len(n) < 10:
                continue
            strings.add(n)


def main():
    strings = set()
    for name in PAGES:
        path = REPO / name
        if not path.exists():
            print(f"SKIP missing: {name}")
            continue
        html_src = path.read_text(encoding="utf-8")
        soup = BeautifulSoup(html_src, "html.parser")
        body = soup.body
        if body is None:
            continue
        before = len(strings)
        walk(body, strings)
        extract_js_strings(html_src, strings)
        print(f"{name:<38} added {len(strings) - before:>6} unique strings (corpus now {len(strings)})")
    for js_file in EXTRA_JS:
        if js_file.exists():
            before = len(strings)
            extract_js_strings(js_file.read_text(encoding="utf-8"), strings, is_pure_js=True)
            print(f"{js_file.name:<38} added {len(strings) - before:>6} unique strings (corpus now {len(strings)})")
    rows = sorted(strings, key=lambda x: (len(x), x))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nTotal: {len(rows)} unique English strings -> {OUT}")


if __name__ == "__main__":
    sys.exit(main())
