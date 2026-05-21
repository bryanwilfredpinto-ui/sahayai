#!/usr/bin/env python3
"""Bulk-tag HTML elements with data-i18n* attributes for chitti_a11y.js i18n pipeline.

Pattern (matches the 2026-05-21 vaani/medupi/upi sweep, commit 5841eb8):
  - <button> / <label> / <h1>...<h6> with a single text run get data-i18n="<slug>"
  - <input>/<textarea> placeholder="..." get data-i18n-placeholder="<slug>"
  - any [aria-label="..."] gets data-i18n-aria="<slug>"
  - any [title="..."] gets data-i18n-title="<slug>"

Idempotent: skips elements whose opening tag already carries the corresponding
data-i18n* attribute. Pre-existing keys are preserved verbatim.

Usage:
  python scripts/tag_i18n.py chitti_ca.html chitti_legal.html ...
"""
from __future__ import annotations

import html
import html.parser
import re
import sys
from pathlib import Path

# ── slug helper ─────────────────────────────────────────────────────────
_SLUG_RE = re.compile(r"[^a-z0-9]+")


def slugify(text: str, max_len: int = 80) -> str:
    decoded = html.unescape(text).strip().lower()
    slug = _SLUG_RE.sub("-", decoded).strip("-")
    return slug[:max_len] or "tag"


# ── single-text-run detection ───────────────────────────────────────────
# <tag ...>plain text only, no inner elements</tag>
_SINGLE_RUN = {
    "button": re.compile(
        r"(<button\b)([^>]*)(>)([^<>]+?)(</button>)", re.IGNORECASE
    ),
    "label": re.compile(
        r"(<label\b)([^>]*)(>)([^<>]+?)(</label>)", re.IGNORECASE
    ),
    "h1": re.compile(r"(<h1\b)([^>]*)(>)([^<>]+?)(</h1>)", re.IGNORECASE),
    "h2": re.compile(r"(<h2\b)([^>]*)(>)([^<>]+?)(</h2>)", re.IGNORECASE),
    "h3": re.compile(r"(<h3\b)([^>]*)(>)([^<>]+?)(</h3>)", re.IGNORECASE),
    "h4": re.compile(r"(<h4\b)([^>]*)(>)([^<>]+?)(</h4>)", re.IGNORECASE),
    "h5": re.compile(r"(<h5\b)([^>]*)(>)([^<>]+?)(</h5>)", re.IGNORECASE),
    "h6": re.compile(r"(<h6\b)([^>]*)(>)([^<>]+?)(</h6>)", re.IGNORECASE),
}

_HAS_I18N = re.compile(r"\bdata-i18n\s*=", re.IGNORECASE)
_PLACEHOLDER = re.compile(r'(<(?:input|textarea)\b)([^>]*?)\bplaceholder\s*=\s*"([^"]+)"([^>]*>)', re.IGNORECASE)
_HAS_PH = re.compile(r"\bdata-i18n-placeholder\s*=", re.IGNORECASE)
_ARIA = re.compile(r'(<[a-z][a-z0-9\-]*\b)([^>]*?)\baria-label\s*=\s*"([^"]+)"([^>]*>)', re.IGNORECASE)
_HAS_ARIA = re.compile(r"\bdata-i18n-aria\s*=", re.IGNORECASE)
_TITLE = re.compile(r'(<[a-z][a-z0-9\-]*\b)([^>]*?)\btitle\s*=\s*"([^"]+)"([^>]*>)', re.IGNORECASE)
_HAS_TITLE = re.compile(r"\bdata-i18n-title\s*=", re.IGNORECASE)


def tag_file(path: Path) -> dict[str, int]:
    src = path.read_text(encoding="utf-8")
    counts = {"text": 0, "placeholder": 0, "aria": 0, "title": 0}

    # single-text-run elements → data-i18n
    for _name, rx in _SINGLE_RUN.items():
        def repl_text(m: re.Match[str]) -> str:
            open_tag, attrs, gt, inner, close = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
            stripped = inner.strip()
            if not stripped:
                return m.group(0)
            if _HAS_I18N.search(attrs):
                return m.group(0)
            slug = slugify(stripped)
            counts["text"] += 1
            return f'{open_tag}{attrs} data-i18n="{slug}"{gt}{inner}{close}'

        src = rx.sub(repl_text, src)

    # placeholder
    def repl_ph(m: re.Match[str]) -> str:
        open_tag, mid, value, tail = m.group(1), m.group(2), m.group(3), m.group(4)
        full_attrs = mid + tail
        if _HAS_PH.search(full_attrs):
            return m.group(0)
        slug = slugify(value)
        counts["placeholder"] += 1
        return f'{open_tag}{mid}placeholder="{value}" data-i18n-placeholder="{slug}"{tail}'

    src = _PLACEHOLDER.sub(repl_ph, src)

    # aria-label
    def repl_aria(m: re.Match[str]) -> str:
        open_tag, mid, value, tail = m.group(1), m.group(2), m.group(3), m.group(4)
        full_attrs = mid + tail
        if _HAS_ARIA.search(full_attrs):
            return m.group(0)
        slug = slugify(value)
        counts["aria"] += 1
        return f'{open_tag}{mid}aria-label="{value}" data-i18n-aria="{slug}"{tail}'

    src = _ARIA.sub(repl_aria, src)

    # title
    def repl_title(m: re.Match[str]) -> str:
        open_tag, mid, value, tail = m.group(1), m.group(2), m.group(3), m.group(4)
        full_attrs = mid + tail
        # skip <title> element itself + meta-style title attrs that are
        # actually i18n already covered; also skip if already tagged
        if _HAS_TITLE.search(full_attrs):
            return m.group(0)
        # skip the <title> document element (mid is empty + tail is just '>')
        if open_tag.lower() == "<title":
            return m.group(0)
        slug = slugify(value)
        counts["title"] += 1
        return f'{open_tag}{mid}title="{value}" data-i18n-title="{slug}"{tail}'

    src = _TITLE.sub(repl_title, src)

    # html integrity smoke check
    class _Sentinel(html.parser.HTMLParser):
        pass

    _Sentinel().feed(src)

    path.write_text(src, encoding="utf-8")
    return counts


def main(argv: list[str]) -> int:
    if not argv:
        print("usage: tag_i18n.py <file.html> [...]", file=sys.stderr)
        return 2
    grand = {"text": 0, "placeholder": 0, "aria": 0, "title": 0}
    for arg in argv:
        path = Path(arg)
        if not path.exists():
            print(f"SKIP (missing): {arg}", file=sys.stderr)
            continue
        c = tag_file(path)
        for k, v in c.items():
            grand[k] += v
        print(f"{arg:40s}  text={c['text']:3d}  placeholder={c['placeholder']:3d}  aria={c['aria']:3d}  title={c['title']:3d}")
    print("-" * 80)
    print(f"{'TOTAL':40s}  text={grand['text']:3d}  placeholder={grand['placeholder']:3d}  aria={grand['aria']:3d}  title={grand['title']:3d}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
