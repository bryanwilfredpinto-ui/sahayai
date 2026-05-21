#!/usr/bin/env python3
"""
neuter_page_i18n.py — disable the page-local applyChittiLang / t(key) i18n
logic on the 13 Chitti pages so chitti_lang.js owns the translation pass.

The page-local applyChittiLang functions (one per page, written before
chitti_lang.js existed) have a structural bug: for any `data-i18n="key"`
element whose key is NOT in the page's tiny `I18N` dict (covering only
en + hi), the function `el.textContent = t(key)` replaces the visible
text with the i18n KEY ITSELF (because `t(key)` returns `key` when no
entry). This corrupts hundreds of strings on every load, BEFORE
chitti_lang.js can snapshot the original English text.

Fix: replace the body of `applyChittiLang(lang)` with a minimal no-op
that:
  - stores lang in localStorage
  - sets document.documentElement.lang
  - toggles any .lang-toggle-bharat active state (cosmetic)
  - delegates to chitti_lang.js if loaded

Idempotent. Re-running is a no-op.
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

# Replacement body. Keeps the side-effects that other in-page code relies
# on (localStorage, html lang, lang-toggle-bharat active toggle) but drops
# the broken textContent-replacement loop.
NEW_APPLY_BODY = r'''function applyChittiLang(lang) {
  _chittiLang = lang;
  try { localStorage.setItem('chitti_lang', lang); } catch (e) {}
  document.documentElement.lang = lang || 'en';
  document.querySelectorAll('.lang-toggle-bharat button').forEach(function(b){
    var active = b.getAttribute('data-lang') === lang;
    b.classList.toggle('active', active);
    b.setAttribute('data-active', active ? 'true' : 'false');
  });
  // Delegate full-body translation to chitti_lang.js (single source of truth).
  if (window.Chitti && window.Chitti.lang && typeof window.Chitti.lang.set === 'function') {
    try { window.Chitti.lang.set(lang); } catch (e) {}
  }
}'''

MARKER = "// neutered 2026-05-22 — chitti_lang.js owns i18n"


def neuter(html: str) -> tuple[str, bool]:
    if MARKER in html:
        return html, False
    # Match the function definition with brace counting.
    m = re.search(r"\bfunction\s+applyChittiLang\s*\(\s*lang\s*\)\s*\{", html)
    if not m:
        return html, False
    start = m.start()
    body_open = m.end() - 1  # position of '{'
    # Walk forward, counting braces.
    depth = 1
    pos = body_open + 1
    in_string = None
    while pos < len(html) and depth > 0:
        c = html[pos]
        if in_string:
            if c == '\\':
                pos += 2
                continue
            if c == in_string:
                in_string = None
        else:
            if c in ('"', "'", '`'):
                in_string = c
            elif c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    break
        pos += 1
    if depth != 0:
        return html, False
    end = pos + 1  # include the closing '}'
    new_func = NEW_APPLY_BODY + " " + MARKER
    return html[:start] + new_func + html[end:], True


def main(argv):
    pages = argv[1:] or PAGES
    print(f"{'page':<38} {'neuter':>10}")
    print("-" * 56)
    for name in pages:
        p = ROOT / name
        if not p.exists():
            print(f"SKIP missing: {name}")
            continue
        html = p.read_text(encoding="utf-8")
        new, changed = neuter(html)
        if changed:
            p.write_text(new, encoding="utf-8")
        print(f"{name:<38} {'patched' if changed else 'already'}")


if __name__ == "__main__":
    sys.exit(main(sys.argv))
