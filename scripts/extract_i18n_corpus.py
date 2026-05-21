#!/usr/bin/env python3
"""Extract every unique English string that needs translation from chitti_*.html.

Walks every data-i18n / data-i18n-placeholder / data-i18n-aria / data-i18n-title
attribute, pulls the element's English content (textContent for data-i18n,
attribute value for the others), dedupes by exact string, writes the corpus
to scripts/i18n_corpus.json so the translator step can batch through DeepSeek.

Output schema:
  {
    "strings": [
      {"text": "🔊 How to use", "kind": "text", "pages": ["chitti_vaani.html", ...]},
      ...
    ],
    "total_occurrences": <int>,
    "unique": <int>,
  }
"""
from __future__ import annotations

import html
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "scripts" / "i18n_corpus.json"

# Text-node attributes — extract the element's textContent from the opening tag's match
# Attribute-value attributes — extract the attribute value
TEXT_TAGS = ("button", "label", "h1", "h2", "h3", "h4", "h5", "h6", "span", "a", "p", "strong", "em")
TEXT_TAG_RX = re.compile(
    r"<(" + "|".join(TEXT_TAGS) + r")\b([^>]*?)\bdata-i18n=\"([^\"]+)\"([^>]*)>([^<>]+?)</\1>",
    re.IGNORECASE | re.DOTALL,
)
PLACEHOLDER_RX = re.compile(
    r'<(?:input|textarea)\b[^>]*?\bplaceholder="([^"]+)"[^>]*?\bdata-i18n-placeholder="([^"]+)"|'
    r'<(?:input|textarea)\b[^>]*?\bdata-i18n-placeholder="([^"]+)"[^>]*?\bplaceholder="([^"]+)"',
    re.IGNORECASE,
)
ARIA_RX = re.compile(
    r'<[a-z][a-z0-9-]*\b[^>]*?\baria-label="([^"]+)"[^>]*?\bdata-i18n-aria="([^"]+)"|'
    r'<[a-z][a-z0-9-]*\b[^>]*?\bdata-i18n-aria="([^"]+)"[^>]*?\baria-label="([^"]+)"',
    re.IGNORECASE,
)
TITLE_RX = re.compile(
    r'<[a-z][a-z0-9-]*\b[^>]*?\btitle="([^"]+)"[^>]*?\bdata-i18n-title="([^"]+)"|'
    r'<[a-z][a-z0-9-]*\b[^>]*?\bdata-i18n-title="([^"]+)"[^>]*?\btitle="([^"]+)"',
    re.IGNORECASE,
)


def normalise(text: str) -> str:
    decoded = html.unescape(text)
    return re.sub(r"\s+", " ", decoded).strip()


def should_skip(text: str) -> bool:
    if not text:
        return True
    if len(text) > 400:           # paragraph-length, not a UI string
        return True
    if re.fullmatch(r"[\d\W_]+", text):  # pure numbers/punct/emoji
        return True
    if re.fullmatch(r"[ऀ-ॿ\s\W]+", text):  # already non-Latin
        return True
    return False


def main() -> int:
    corpus: dict[str, dict] = {}

    html_files = sorted(REPO.glob("chitti_*.html"))
    for f in html_files:
        src = f.read_text(encoding="utf-8")

        for m in TEXT_TAG_RX.finditer(src):
            inner = normalise(m.group(5))
            if should_skip(inner):
                continue
            corpus.setdefault(inner, {"text": inner, "kind": "text", "pages": set()})
            corpus[inner]["pages"].add(f.name)

        for m in PLACEHOLDER_RX.finditer(src):
            val = m.group(1) or m.group(4)
            if not val:
                continue
            val = normalise(val)
            if should_skip(val):
                continue
            corpus.setdefault(val, {"text": val, "kind": "placeholder", "pages": set()})
            corpus[val]["pages"].add(f.name)

        for m in ARIA_RX.finditer(src):
            val = m.group(1) or m.group(4)
            if not val:
                continue
            val = normalise(val)
            if should_skip(val):
                continue
            corpus.setdefault(val, {"text": val, "kind": "aria", "pages": set()})
            corpus[val]["pages"].add(f.name)

        for m in TITLE_RX.finditer(src):
            val = m.group(1) or m.group(4)
            if not val:
                continue
            val = normalise(val)
            if should_skip(val):
                continue
            corpus.setdefault(val, {"text": val, "kind": "title", "pages": set()})
            corpus[val]["pages"].add(f.name)

    rows = []
    for k, v in corpus.items():
        v["pages"] = sorted(v["pages"])
        rows.append(v)
    rows.sort(key=lambda r: (-len(r["pages"]), r["text"]))

    out = {
        "strings": rows,
        "unique": len(rows),
        "total_occurrences": sum(len(r["pages"]) for r in rows),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extracted {out['unique']} unique strings ({out['total_occurrences']} occurrences) → {OUT}")
    print("Top 10 by page-spread:")
    for r in rows[:10]:
        text = r["text"] if len(r["text"]) <= 60 else r["text"][:57] + "..."
        print(f"  {len(r['pages']):2d} pages  [{r['kind']:11s}] {text}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
