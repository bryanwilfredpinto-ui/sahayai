#!/usr/bin/env python3
"""
wire_lang_substrate.py — make chitti_lang.js + chitti_a11y.js load on the
13 non-vaani Chitti pages, and ensure each page has a <select> that
chitti_lang.js's wireDropdown can latch onto.

chitti_lang.js auto-wires any select matching:
  select#lang-select, select#lang, select#hdr-lang, select#pick-lang,
  select#onb-lang, select[name="lang"], select[name="language"], or
  certain aria-label values.

Pages with one of these already (news, upi, ca, legal, scanner,
news_ai, voice_factory, 2wheeler, 4wheeler) get the script tags only.
The four pages without any matching select (medupi, government,
fundamentals, complete_technical) ALSO get a small floating-corner
<select id="lang-select"> injected right after <body> so the same
chitti_lang.js + chitti_a11y.js substrate can do its job.

Idempotent.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PAGES = [
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

LANG_SCRIPT_MARKER = '<script src="chitti_lang.js"></script>'
A11Y_SCRIPT_MARKER = '<script src="chitti_a11y.js"></script>'

LANG_SCRIPT_BLOCK = """
<!-- Chitti i18n substrate — chitti_lang.js baked T-table + chitti_a11y.js widget+QR supplement. 2026-05-22 -->
<script src="chitti_lang.js"></script>
<script src="chitti_a11y.js"></script>
"""

LANG_SELECT_MARKER = 'data-chitti-lang-select="auto"'
LANG_SELECT_INJECT = """
<!-- Chitti language selector (auto-injected) — chitti_lang.js wires this. 2026-05-22 -->
<div data-chitti-lang-select="auto" style="position:fixed;top:8px;right:8px;z-index:9001;display:inline-flex;align-items:center;gap:6px;background:#0E2344;color:#fff;border:1px solid #D4AF37;border-radius:8px;padding:5px 9px;font-family:Inter,system-ui,sans-serif;font-size:12px;box-shadow:0 2px 10px rgba(14,35,68,.18)">
  <label for="lang-select" style="font-weight:600">🌐</label>
  <select id="lang-select" aria-label="Language" style="background:#fff;color:#0E2344;border:1px solid #D4AF37;border-radius:6px;padding:3px 8px;font-weight:600;font-size:12px;cursor:pointer">
    <option value="en">English</option>
  </select>
</div>
"""

BODY_OPEN_RE = re.compile(r"<body[^>]*>", re.IGNORECASE)
BODY_CLOSE_RE = re.compile(r"</body\s*>", re.IGNORECASE)
# Only treat lang-select as "already present" — for other id variants
# (pick-lang / hdr-lang / lang / onb-lang) we STILL want our canonical
# lang-select dropdown injected up-top so it wins the chitti_lang.js
# wireDropdown DOM-order race AND so per-page filter UIs (e.g. news's
# pick-lang state-filter) keep their original behaviour.
SELECT_PRESENT_RE = re.compile(
    r'<select\b[^>]*\bid\s*=\s*["\']lang-select["\']',
    re.IGNORECASE,
)


def inject_scripts(html: str) -> tuple[str, bool]:
    if LANG_SCRIPT_MARKER in html and A11Y_SCRIPT_MARKER in html:
        return html, False
    # Skip if the marker comment is already there.
    if 'Chitti i18n substrate — chitti_lang.js baked T-table' in html:
        return html, False
    m = BODY_CLOSE_RE.search(html)
    if not m:
        return html + "\n" + LANG_SCRIPT_BLOCK, True
    return html[:m.start()] + LANG_SCRIPT_BLOCK + "\n" + html[m.start():], True


def inject_select(html: str) -> tuple[str, bool]:
    if LANG_SELECT_MARKER in html:
        return html, False
    if SELECT_PRESENT_RE.search(html):
        return html, False
    m = BODY_OPEN_RE.search(html)
    if not m:
        return html, False
    return html[:m.end()] + "\n" + LANG_SELECT_INJECT + html[m.end():], True


def process(path: Path) -> dict:
    html = path.read_text(encoding="utf-8")
    actions = {}
    html, added_select = inject_select(html)
    actions["select"] = "added" if added_select else "already"
    html, added_scripts = inject_scripts(html)
    actions["scripts"] = "added" if added_scripts else "already"
    path.write_text(html, encoding="utf-8")
    return actions


def main(argv: list[str]) -> int:
    pages = argv[1:] or PAGES
    print(f"{'page':<38} {'select':>10} {'scripts':>10}")
    print("-" * 64)
    for name in pages:
        p = ROOT / name
        if not p.exists():
            print(f"SKIP missing: {name}")
            continue
        a = process(p)
        print(f"{name:<38} {a['select']:>10} {a['scripts']:>10}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
