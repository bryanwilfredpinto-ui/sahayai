#!/usr/bin/env python3
"""Bake scripts/i18n_translations.json directly into chitti_a11y.js as the
T_FULL table, and rewrite translatePage() to use English-text-keyed lookup
with the curated T table as a secondary fallback. No MyMemory at runtime.

The output substrate has:
  - T:       curated 70-key short-slug table (preserved verbatim).
  - T_FULL:  baked English-text-keyed table (993 strings × 26 langs).
  - translatePage(lang): tier 1 curated slug lookup → tier 2 T_FULL by
                          original English → fallback to English text.
  - No MyMemory, no MT cache, no throttle, no quota guard.

Idempotent — running twice produces the same output.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SUBSTRATE = REPO / "chitti_a11y.js"
TRANSLATIONS = REPO / "scripts" / "i18n_translations.json"

T_FULL_START = "  // ── T_FULL — BAKED ENGLISH-TEXT-KEYED TRANSLATIONS (DO NOT HAND-EDIT) ──"
T_FULL_END = "  // ── END T_FULL ──"

TRANSLATE_PAGE_END_MARKER = "  // ── INJECT LANGUAGE BAR ───────────────────────────────────────────────────"
# We replace from one of these start markers (whichever appears) down to
# TRANSLATE_PAGE_END_MARKER. Multiple aliases so the script is idempotent
# across substrate revisions.
TRANSLATE_PAGE_START_MARKERS = [
    "  // ── KEY-VARIANT LOOKUP ───────────────────────────────────────────────────",
    "  // ── TRANSLATION RESOLVER ─────────────────────────────────────────────────",
]


def js_string_literal(s: str) -> str:
    # Use JSON encoding then strip outer quotes — handles unicode + escapes safely.
    return json.dumps(s, ensure_ascii=False)


def build_t_full(translations: dict[str, dict[str, str]]) -> str:
    lines = [T_FULL_START, "  const T_FULL = {"]
    for english in sorted(translations.keys()):
        entries = translations[english]
        # Emit: "english": {en: "...", hi: "...", ...}
        kv = []
        # en is the source itself
        kv.append("en:" + js_string_literal(english))
        for lang in ("hi", "bn", "te", "ta", "mr", "gu", "kn", "ml", "pa", "or", "as", "ur",
                     "sa", "mai", "kok", "doi", "ks", "ne", "sd", "mni", "sat", "bho",
                     "raj", "kru", "hoc"):
            v = entries.get(lang) or english  # fallback to English if a lang slipped through
            kv.append(f"{lang}:" + js_string_literal(v))
        lines.append(f"    {js_string_literal(english)}: {{ {', '.join(kv)} }},")
    lines.append("  };")
    lines.append(T_FULL_END)
    return "\n".join(lines)


def build_new_translate_page() -> str:
    """The replacement translatePage block — replaces from KEY-VARIANT LOOKUP comment
    down to (but not including) INJECT LANGUAGE BAR comment."""
    return """  // ── TRANSLATION RESOLVER ─────────────────────────────────────────────────
  // Tier 1: curated slug-keyed T table (short common UI keys hand-translated).
  // Tier 2: baked English-text-keyed T_FULL (993 strings × 26 langs from DeepSeek).
  // Tier 3: leave original English in place (honest — no silent fallback).
  // NO RUNTIME MT calls. No MyMemory. Everything is hardcoded.
  function resolve(lang, slugKey, originalEnglish) {
    // For slug-key lookup do NOT fall back to T["en"] — that would short-
    // circuit any lang that lacks a curated slug entry, leaving the user
    // with English instead of the proper T_FULL translation below.
    const t = T[lang];
    if (t && slugKey && t[slugKey]) return t[slugKey];
    if (originalEnglish) {
      const entry = T_FULL[originalEnglish];
      if (entry && entry[lang]) return entry[lang];
    }
    return null;
  }

  // ── TRANSLATE ENTIRE PAGE ─────────────────────────────────────────────────
  function translatePage(lang) {
    currentLang = lang;
    localStorage.setItem("chitti_lang", lang);

    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === "ur" || lang === "ks" || lang === "sd") ? "rtl" : "ltr";

    function rememberOrig(el, attr, origAttr) {
      if (!el.hasAttribute(origAttr)) {
        const cur = (attr === "__text") ? (el.textContent || "") : (el.getAttribute(attr) || "");
        el.setAttribute(origAttr, cur.replace(/\\s+/g, " ").trim());
      }
      return el.getAttribute(origAttr);
    }

    function applyText(el) {
      if (el.children && el.children.length > 0) return;
      const slug = el.getAttribute("data-i18n");
      const original = rememberOrig(el, "__text", "data-i18n-orig");
      if (lang === "en") { el.textContent = original; return; }
      const v = resolve(lang, slug, original);
      if (v !== null) el.textContent = v;
      // else: leave whatever was there (English) — no silent provider fallback
    }

    function applyAttr(el, attrName, dataAttr, origAttr) {
      const slug = el.getAttribute(dataAttr);
      const original = rememberOrig(el, attrName, origAttr);
      if (lang === "en") { el.setAttribute(attrName, original); return; }
      const v = resolve(lang, slug, original);
      if (v !== null) el.setAttribute(attrName, v);
    }

    document.querySelectorAll("[data-i18n]").forEach(applyText);
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => applyAttr(el, "placeholder", "data-i18n-placeholder", "data-i18n-placeholder-orig"));
    document.querySelectorAll("[data-i18n-aria]").forEach(el => applyAttr(el, "aria-label", "data-i18n-aria", "data-i18n-aria-orig"));
    document.querySelectorAll("[data-i18n-title]").forEach(el => applyAttr(el, "title", "data-i18n-title", "data-i18n-title-orig"));

    document.querySelectorAll(".chitti-lang-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });
    document.dispatchEvent(new CustomEvent("chitti:langchange", { detail: { lang, t: T[lang] || T["en"] } }));
  }

"""


def main() -> int:
    if not TRANSLATIONS.exists():
        print(f"FAIL: {TRANSLATIONS} not found — run translate_via_deepseek.py first", file=sys.stderr)
        return 1

    translations = json.loads(TRANSLATIONS.read_text(encoding="utf-8"))
    print(f"Loaded {len(translations)} translated strings.")

    src = SUBSTRATE.read_text(encoding="utf-8")

    # 1. Strip any existing T_FULL block from a prior run.
    if T_FULL_START in src:
        before, _, rest = src.partition(T_FULL_START)
        _, _, after = rest.partition(T_FULL_END + "\n")
        src = before + after

    # 2. Strip the existing translatePage region.
    start_idx = -1
    for marker in TRANSLATE_PAGE_START_MARKERS:
        idx = src.find(marker)
        if idx >= 0:
            start_idx = idx
            break
    end_idx = src.find(TRANSLATE_PAGE_END_MARKER)
    if start_idx < 0 or end_idx < 0 or end_idx < start_idx:
        print("FAIL: could not locate translatePage region boundaries", file=sys.stderr)
        return 1
    new_block = build_new_translate_page()
    src = src[:start_idx] + new_block + src[end_idx:]

    # 3. Insert T_FULL just before the "// ── STATE ──" block so T_FULL is in scope
    # at translatePage call time. Search for "  // ── STATE ─────".
    state_marker = "  // ── STATE ─────"
    state_idx = src.find(state_marker)
    if state_idx < 0:
        print("FAIL: could not find STATE marker", file=sys.stderr)
        return 1
    t_full_block = build_t_full(translations) + "\n\n"
    src = src[:state_idx] + t_full_block + src[state_idx:]

    SUBSTRATE.write_text(src, encoding="utf-8")
    size_kb = SUBSTRATE.stat().st_size / 1024
    print(f"Wrote {SUBSTRATE} ({size_kb:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
