#!/usr/bin/env python3
"""Walk chitti_vaani.html via BeautifulSoup and collect every visible English string:
  - text nodes inside non-script/style/code/pre/textarea/noscript/head elements
  - placeholder / aria-label / title / alt / value (where appropriate) attribute values

Output: scripts/vaani_corpus.json — a sorted list of unique English strings.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Comment

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "chitti_vaani.html"
# Page-bundled scripts that inject English text into the DOM at runtime —
# extract from them too so the T table covers MutationObserver-discovered nodes.
EXTRA_JS = [
    REPO / "chitti_disclaimer.js",
]
OUT = REPO / "scripts" / "vaani_corpus.json"

SKIP_TAGS = {"script", "style", "code", "pre", "textarea", "noscript", "head", "title", "meta", "link", "br", "hr"}
ATTR_KEYS = {"placeholder", "aria-label", "title", "alt"}

_WS = re.compile(r"\s+")


def normalise(s: str) -> str | None:
    if not s:
        return None
    s = _WS.sub(" ", s).strip()
    if not s:
        return None
    # Pure punctuation / numbers / emojis — skip
    if re.fullmatch(r"[\d\W_]+", s):
        return None
    # Paragraphs over 450 chars — Google batch will reject
    if len(s) > 450:
        return None
    # Require the string to be mostly ASCII letters — skip already-translated
    # strings or mojibake-decoded escapes.
    ascii_alpha = sum(1 for ch in s if ch.isascii() and ch.isalpha())
    total_alpha = sum(1 for ch in s if ch.isalpha())
    if total_alpha == 0 or ascii_alpha < 2:
        return None
    if (ascii_alpha / max(total_alpha, 1)) < 0.6:
        return None
    return s


def walk(node, strings: set[str], inside_skip: int = 0):
    name = getattr(node, "name", None)

    # Attributes (on Tag nodes only)
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
        # value attribute on certain elements is user-visible (option, button[value])
        if name.lower() == "option" and "value" not in attrs and not node.find_all():
            # option text only
            pass

    # Text content
    if isinstance(node, NavigableString) and not isinstance(node, Comment):
        if inside_skip == 0:
            text = str(node)
            n = normalise(text)
            if n:
                strings.add(n)

    # Recurse
    children = getattr(node, "children", None)
    if children:
        for child in list(children):
            walk(child, strings, inside_skip)


def extract_js_strings(html_src: str, strings: set[str], is_pure_js: bool = False) -> None:
    """Scan inline <script> blocks for English string literals that look like
    user-visible text (heuristic: starts with a capital letter or emoji, has
    at least 2 letter chars, not a CSS/HTML/event-name token).

    If is_pure_js=True, treat the whole input as one script body (skip the
    <script>...</script> regex extraction — avoids being tricked by `</script>`
    appearing inside a JS comment)."""
    # Pull every <script>...</script> body — or treat input as already-pure JS
    body_rx = re.compile(r"<script\b[^>]*>(.*?)</script>", re.DOTALL | re.IGNORECASE)
    # Match single and double-quoted literals on a single line only.
    lit_rx = re.compile(r"(['\"])((?:\\.|(?!\1).)+?)\1")
    # Template literals — multiline, but only those that LOOK like HTML
    # (start with `<` after whitespace) to avoid swallowing arbitrary code.
    tpl_rx = re.compile(r"`(\s*<[^`]{0,4000}?)`", re.DOTALL)
    # Cheap "looks like UI text" filter
    UI_LIKE = re.compile(r"[A-Za-z]{2,}.*?[A-Za-z]{2,}", re.DOTALL)
    BLACKLIST = re.compile(r"^(?:[a-z][a-z0-9_-]*|/[\w/.-]+|#[a-zA-Z0-9_-]+|"
                           r"[A-Z_]+|true|false|null|undefined|\d+px|rgba?\(|"
                           r"https?://|data:|application/|text/|image/|chitti_)")
    bodies = [html_src] if is_pure_js else body_rx.findall(html_src)
    for body in bodies:
        # Extract HTML-shaped template literals via BeautifulSoup walk
        for m in tpl_rx.finditer(body):
            tpl = m.group(1)
            # Strip ${...} interpolations so BS doesn't choke
            tpl = re.sub(r"\$\{[^}]*\}", "", tpl)
            try:
                bs = BeautifulSoup(tpl, "html.parser")
                walk(bs, strings)
            except Exception:
                pass
        for m in lit_rx.finditer(body):
            raw = m.group(2)
            # Don't unicode_escape — that corrupts already-Devanagari source.
            # JS \uXXXX escapes appear as literal text; normalise will filter
            # via the "mostly ASCII alpha" rule below.
            n = normalise(raw)
            if not n:
                continue
            if BLACKLIST.match(n):
                continue
            if not UI_LIKE.search(n):
                continue
            # If literal contains HTML, also extract its plain-text content
            # (BeautifulSoup safely walks tags). Both the raw literal and the
            # plain text get added — the runtime substrate will match whichever
            # form actually appears in the DOM.
            if "<" in n and ">" in n:
                try:
                    bs = BeautifulSoup(n, "html.parser")
                    walk(bs, strings)
                except Exception:
                    pass
                continue  # don't add the HTML-wrapped literal itself
            # Skip if it looks like a key in an object (no spaces, single word)
            if " " not in n and len(n) < 10:
                continue
            strings.add(n)


def main() -> int:
    html_src = SRC.read_text(encoding="utf-8")
    soup = BeautifulSoup(html_src, "html.parser")
    body = soup.body
    if body is None:
        print("FAIL: no <body>", file=sys.stderr)
        return 1
    strings: set[str] = set()
    walk(body, strings)
    extract_js_strings(html_src, strings)
    # Also walk bundled JS files (e.g. chitti_disclaimer.js) that inject UI
    # text at runtime. Wrap each in a synthetic <script> tag so our existing
    # extractor picks up its string literals + HTML payloads.
    for js_file in EXTRA_JS:
        if js_file.exists():
            extract_js_strings(js_file.read_text(encoding="utf-8"), strings, is_pure_js=True)

    rows = sorted(strings, key=lambda x: (len(x), x))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extracted {len(rows)} unique English strings -> {OUT}")
    print("\nSample (first 10):")
    for s in rows[:10]:
        print(f"  {s!r}")
    print("\nSample (last 5 — longest):")
    for s in rows[-5:]:
        print(f"  {s!r}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
