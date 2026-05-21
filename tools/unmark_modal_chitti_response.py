#!/usr/bin/env python3
"""
unmark_modal_chitti_response.py — remove the `chitti-response` class +
`data-chitti-section` attribute from any box that is INSIDE a modal,
overlay, onboarding panel, demo banner, or sticky disclaimer.

These boxes were over-eagerly tagged by tools/mark_chitti_boxes.py:
modals stay hidden behind backdrops most of the time, but the
feedback-widget bar is rendered as a SIBLING after the box in the DOM,
so the bar pops to the top of the page on first paint even though the
modal itself is hidden. This breaks the theme (chitti_news.html showed
"Feedback for: 👋 Welcome — pick your state and language" floating at
the top on first load).

Contexts treated as "inside a modal/overlay" — any of these classes on
any ancestor:
  onb, modal, popup, overlay, dialog, demo-banner, demo-modal,
  med-modal, consent-modal, sample-modal, consent-overlay,
  legal-overlay, disclaimer-bar.

Idempotent: re-running this script after a fresh marker pass is fine.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET_PAGES = [
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

MODAL_CLASSES = [
    "onb", "modal", "popup", "overlay", "dialog", "demo-banner", "demo-modal",
    "med-modal", "consent-modal", "sample-modal", "consent-overlay",
    "legal-overlay", "disclaimer-bar", "med-modal-bg", "chitti-fb-modal-bg",
]

OPEN_RE = re.compile(
    r'<(div|section|article)\b([^>]*)class="([^"]*\bchitti-response\b[^"]*)"([^>]*)>',
    re.IGNORECASE,
)

DATA_SECTION_RE = re.compile(r'\s*data-chitti-section\s*=\s*"[^"]*"', re.IGNORECASE)


def is_inside_modal(html: str, position: int) -> str | None:
    """Return the name of the modal class if `position` is inside one, else None.

    Walk forward from the start of the document, tracking which "modal"
    ancestors are currently open at any given position. We do not pre-compute
    a full DOM, but for each modal ancestor we encounter, we find its
    matching </div> using a depth counter starting at 1.
    """
    # Find every "modal opening" before position. For each, do a depth
    # walk to find its matching close. If position is inside an unclosed one,
    # return the class name.
    modal_pattern = re.compile(
        r'<(div|section|article)\b[^>]*class="[^"]*\b(' + "|".join(MODAL_CLASSES) + r')\b[^"]*"[^>]*>',
        re.IGNORECASE,
    )
    for m in modal_pattern.finditer(html, 0, position):
        # find matching close after m.end()
        tag = m.group(1).lower()
        cls = m.group(2)
        open_re = re.compile(r"<" + tag + r"\b[^>]*?(/?)>", re.IGNORECASE)
        close_re = re.compile(r"</" + tag + r"\s*>", re.IGNORECASE)
        depth = 1
        pos = m.end()
        # Walk until we find depth==0 OR we pass `position`.
        while pos < len(html):
            o = open_re.search(html, pos)
            c = close_re.search(html, pos)
            if not c:
                # Unclosed — treat as still open.
                if pos <= position:
                    return cls
                break
            if o and o.start() < c.start():
                if o.group(1) != "/":
                    depth += 1
                pos = o.end()
                continue
            depth -= 1
            pos = c.end()
            if depth == 0:
                # Modal closed BEFORE position → not inside.
                break
            if pos > position and depth > 0:
                # Modal still open at position → inside.
                return cls
        else:
            # Reached EOF still inside.
            if depth > 0:
                return cls
    return None


def remove_chitti_response_at(html: str, start: int, end: int) -> tuple[str, int]:
    """Surgically remove `chitti-response` + data-chitti-section from the open
    tag spanning [start, end)."""
    tag = html[start:end]
    # Drop chitti-response class token, collapse spaces.
    new_tag = re.sub(
        r'class="([^"]*)"',
        lambda mm: 'class="' + re.sub(r'\s*\bchitti-response\b', '', mm.group(1)).strip().replace("  ", " ") + '"',
        tag,
        count=1,
    )
    new_tag = DATA_SECTION_RE.sub("", new_tag, count=1)
    delta = len(new_tag) - len(tag)
    return html[:start] + new_tag + html[end:], delta


def process(path: Path) -> int:
    html = path.read_text(encoding="utf-8")
    # Collect all chitti-response open tags first; only un-mark those inside modals.
    matches = list(OPEN_RE.finditer(html))
    # Process in reverse so offsets stay stable.
    matches.sort(key=lambda m: m.start(), reverse=True)
    unmarked = 0
    for m in matches:
        ctx = is_inside_modal(html, m.start())
        if not ctx:
            continue
        new_html, _ = remove_chitti_response_at(html, m.start(), m.end())
        html = new_html
        unmarked += 1
    path.write_text(html, encoding="utf-8")
    return unmarked


def main(argv):
    pages = argv[1:] or TARGET_PAGES
    print(f"{'page':<38} {'unmarked-from-modal':>22}")
    print("-" * 64)
    total = 0
    for name in pages:
        p = ROOT / name
        if not p.exists():
            continue
        n = process(p)
        total += n
        print(f"{name:<38} {n:>22}")
    print("-" * 64)
    print(f"{'TOTAL':<38} {total:>22}")


if __name__ == "__main__":
    sys.exit(main(sys.argv))
