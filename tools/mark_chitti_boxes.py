#!/usr/bin/env python3
"""
mark_chitti_boxes.py — surgical regex pass that tags every visible "box"
on the 14 user-listed Chitti pages with `class="chitti-response"` and
`data-chitti-section="..."` so feedback-widget.js attaches the 4-icon bar
(🔊 / 🤖 / 👍 / 👎) to each one.

Contract: SAHAYAI_MASTER.md §7 + QUALITY_STATUS.md §1a G1.
Approach: regex only — BeautifulSoup mutates whitespace.
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

BOX_CLASS_TOKENS = {
    # generic
    "card", "box", "panel", "section-card", "feat-card", "status-card",
    "coming-soon-card", "tnc-section", "chitti-special", "tile", "block",
    # response / result / answer
    "reply", "response", "answer", "result", "output", "verdict", "summary",
    "reply-card", "response-card", "answer-card", "result-card", "output-card",
    # product-specific cards seen across the 14 pages
    "metric-card", "story-card", "insight-card", "rec-card", "scheme-card",
    "news-card", "article-card", "scanner-result", "scanner-card", "fraud-card",
    "ca-card", "legal-card", "tech-card", "fund-card", "vehicle-card", "med-card",
    "voice-card", "lang-card", "fund-q-tbl",
    # Chitti News dynamic article cards (built by JS but also a few static seeds)
    "art-card", "art-take", "art-fact", "art-summary", "art-explain",
    # MedUPI / Scanner / Vaani / Government additional patterns
    "med-result", "scanner-out", "scheme-result", "gov-card", "gov-result",
    "vaani-reply", "vaani-card",
    # Page-specific cards uncovered in the 2026-05-21 second-pass survey
    "pro-card", "quick-card", "rule-card", "sample-card", "cap-card",
    "ja-panel", "scan-card", "ind-card", "learn-card", "cv-card",
    "consent-panel",
}

BOX_TAG = r"(?:div|section|article|main|aside)"

OPEN_TAG_RE = re.compile(
    r"<(" + BOX_TAG + r")(\s[^>]*)?>",
    re.IGNORECASE,
)
CLASS_ATTR_RE = re.compile(
    r"\sclass\s*=\s*(['\"])([^'\"]*?)\1",
    re.IGNORECASE,
)

HEADING_RE = re.compile(
    r"<(?:h[1-6])\b[^>]*>(.*?)</(?:h[1-6])>",
    re.IGNORECASE | re.DOTALL,
)
STRONG_RE = re.compile(
    r"<strong\b[^>]*>(.*?)</strong>",
    re.IGNORECASE | re.DOTALL,
)
ID_RE = re.compile(r"\bid\s*=\s*['\"]([^'\"]+)['\"]", re.IGNORECASE)
ARIA_LABEL_RE = re.compile(r"\baria-label\s*=\s*['\"]([^'\"]+)['\"]", re.IGNORECASE)
DATA_SECTION_RE = re.compile(r"\bdata-chitti-section\s*=", re.IGNORECASE)
DATA_RESPONSE_RE = re.compile(r"\bdata-chitti-response\b", re.IGNORECASE)
TAG_STRIP_RE = re.compile(r"<[^>]+>")


def inner_window(text, start, max_len=4000):
    """Return text from start up to min(start+max_len, len(text)).
    Used to scan for a heading inside the box — no need to find the exact
    matching close tag for section-name purposes, and the regex-balanced
    walk is O(n^2) on multi-hundred-KB files."""
    return text[start:start + max_len]


def humanize(s):
    s = re.sub(r"[-_]+", " ", s).strip()
    s = re.sub(r"\s+", " ", s)
    if not s:
        return s
    return s[:1].upper() + s[1:]


def derive_section_name(open_attrs, inner_html, class_tokens):
    m = ARIA_LABEL_RE.search(open_attrs)
    if m:
        return m.group(1).strip()[:80]
    m = HEADING_RE.search(inner_html)
    if m:
        txt = TAG_STRIP_RE.sub("", m.group(1)).strip()
        txt = re.sub(r"\s+", " ", txt)
        if txt:
            return txt[:80]
    m = STRONG_RE.search(inner_html)
    if m:
        txt = TAG_STRIP_RE.sub("", m.group(1)).strip()
        txt = re.sub(r"\s+", " ", txt)
        if txt:
            return txt[:80]
    m = ID_RE.search(open_attrs)
    if m:
        return humanize(m.group(1))[:80]
    for tok in class_tokens:
        if tok in BOX_CLASS_TOKENS:
            return humanize(tok)[:80]
    if class_tokens:
        return humanize(class_tokens[0])[:80]
    return "Section"


def escape_attr(s):
    return (
        s.replace("&", "&amp;")
         .replace('"', "&quot;")
         .replace("<", "&lt;")
         .replace(">", "&gt;")
    )


def process(html):
    edits = []
    marked = 0
    already = 0
    sec_added = 0
    section_counter = 0

    for m in OPEN_TAG_RE.finditer(html):
        tag = m.group(1).lower()
        attrs = m.group(2) or ""
        if attrs.endswith("/"):
            continue  # self-closing
        class_m = CLASS_ATTR_RE.search(attrs)
        if not class_m:
            continue
        quote = class_m.group(1)
        class_value = class_m.group(2)
        class_tokens = class_value.split()
        if not any(tok in BOX_CLASS_TOKENS for tok in class_tokens):
            continue

        inner_html = inner_window(html, m.end())
        has_class = "chitti-response" in class_tokens
        has_data = bool(DATA_RESPONSE_RE.search(attrs))
        has_section = bool(DATA_SECTION_RE.search(attrs))

        if has_class or has_data:
            already += 1
            if has_section:
                continue
            section_counter += 1
            section_name = derive_section_name(attrs, inner_html, class_tokens) or f"Section {section_counter}"
            sec_added += 1
            new_attrs = attrs + f' data-chitti-section="{escape_attr(section_name)}"'
            new_open = f"<{tag}{new_attrs}>"
            edits.append((m.start(), m.end(), new_open))
            continue

        marked += 1
        section_counter += 1
        new_class_value = class_value.rstrip() + " chitti-response"
        section_name = derive_section_name(attrs, inner_html, class_tokens) or f"Section {section_counter}"
        sec_added += 1
        # Replace the class attribute value in `attrs`, then optionally append data-chitti-section.
        new_attrs = (
            attrs[:class_m.start(2)] + new_class_value + attrs[class_m.end(2):]
        )
        if not has_section:
            new_attrs = new_attrs + f' data-chitti-section="{escape_attr(section_name)}"'
        new_open = f"<{tag}{new_attrs}>"
        edits.append((m.start(), m.end(), new_open))

    edits.sort(key=lambda e: e[0], reverse=True)
    out = html
    for start, end, repl in edits:
        out = out[:start] + repl + out[end:]
    return out, marked, already, sec_added


def main(argv):
    pages = argv[1:] or TARGET_PAGES
    total_marked = 0
    total_backfilled = 0
    total_already = 0
    print(f"{'page':<38} {'marked':>8} {'backfilled':>12} {'already':>8}")
    print("-" * 70)
    for name in pages:
        path = ROOT / name
        if not path.exists():
            print(f"SKIP missing: {name}")
            continue
        original = path.read_text(encoding="utf-8")
        new, marked, already, sec_added = process(original)
        if new != original:
            path.write_text(new, encoding="utf-8")
        total_marked += marked
        total_backfilled += sec_added
        total_already += already
        print(f"{name:<38} {marked:>8} {sec_added:>12} {already:>8}")
    print("-" * 70)
    print(f"{'TOTAL':<38} {total_marked:>8} {total_backfilled:>12} {total_already:>8}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
