#!/usr/bin/env python3
"""Bake scripts/vaani_translations.json into chitti_lang.js with:

  - LANGS array (26 entries — matches the SAHAYAI_MASTER.md locked list)
  - T table (English-keyed -> 26-lang object), with:
      * Kashmiri (ks) entries that equal source -> filled from Urdu (Perso-Arabic
        cousin script). Google's `kas` returns source verbatim for most input.
      * Per-lang Hindi fallback for any entry where Google returned source
        verbatim (script-cousin for 16 of 25 target langs).
  - wireDropdown(): finds the page's existing language <select>, populates
    with all 26 langs, wires onchange.
  - translateAll(lang): walks every text node + placeholder/aria-label/title
    attribute, looks up in T, substitutes. Snapshots original English on first
    call so switching back to English restores.
  - Auto-init on DOMContentLoaded.
  - Theme constants exported on window.Chitti.theme for any page that wants
    them: --saffron #E86A17, --navy #0E2344, --gold #D4AF37.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TRANS_FILE = REPO / "scripts" / "vaani_translations.json"
OUT = REPO / "chitti_lang.js"

LANGS = [
    ("en",  "English",   "English"),
    ("hi",  "Hindi",     "हिन्दी"),
    ("bn",  "Bangla",    "বাংলা"),
    ("te",  "Telugu",    "తెలుగు"),
    ("ta",  "Tamil",     "தமிழ்"),
    ("mr",  "Marathi",   "मराठी"),
    ("gu",  "Gujarati",  "ગુજરાતી"),
    ("kn",  "Kannada",   "ಕನ್ನಡ"),
    ("ml",  "Malayalam", "മലയാളം"),
    ("pa",  "Punjabi",   "ਪੰਜਾਬੀ"),
    ("or",  "Odia",      "ଓଡ଼ିଆ"),
    ("as",  "Assamese",  "অসমীয়া"),
    ("ur",  "Urdu",      "اردو"),
    ("sa",  "Sanskrit",  "संस्कृतम्"),
    ("mai", "Maithili",  "मैथिली"),
    ("kok", "Konkani",   "कोंकणी"),
    ("doi", "Dogri",     "डोगरी"),
    ("ks",  "Kashmiri",  "کٲشُر"),
    ("ne",  "Nepali",    "नेपाली"),
    ("sd",  "Sindhi",    "سنڌي"),
    ("mni", "Manipuri",  "মৈতৈলোন্"),
    ("sat", "Santali",   "ᱥᱟᱱᱛᱟᱲᱤ"),
    ("bho", "Bhojpuri",  "भोजपुरी"),
    ("raj", "Rajasthani","राजस्थानी"),
    ("kru", "Kurukh",    "कुड़ुख़"),
    ("hoc", "Ho",        "हो"),
]

# Codes that look right under Hindi for users who can read Devanagari.
HI_FALLBACK_LANGS = {"sa", "mai", "kok", "doi", "ne", "bho", "raj", "kru", "hoc",
                     "mni", "sat", "pa", "or", "as", "gu"}


import re as _re


def _ascii_alpha_ratio(s: str) -> float:
    if not s:
        return 0.0
    alpha = [c for c in s if c.isalpha()]
    if not alpha:
        return 0.0
    ascii_a = [c for c in alpha if c.isascii()]
    return len(ascii_a) / len(alpha)


def post_process(translations: dict) -> dict:
    out = dict(translations)
    for src, entries in out.items():
        # ks fallback to ur (Perso-Arabic cousin)
        if entries.get("ks") == src and entries.get("ur"):
            entries["ks"] = entries["ur"]
        hi = entries.get("hi", "")
        if hi and hi != src:
            for lang in HI_FALLBACK_LANGS:
                v = entries.get(lang, "")
                if not v or v == src:
                    entries[lang] = hi
                    continue
                # Partial-translation fallback — if the translator left more
                # than 25% Latin alphabetic characters in the output, the
                # rendered text is a mixed-script Frankenstein. Fall back to
                # the cleaner Hindi version (script-cousin for most of these
                # under-resourced langs).
                # Odia translator is especially noisy — leaves Latin fragments
                # in the middle of valid words. Use a stricter threshold for it.
                threshold = 0.05 if lang == "or" else 0.25
                if _ascii_alpha_ratio(v) > threshold and _ascii_alpha_ratio(src) > 0.5:
                    entries[lang] = hi
    return out


def js_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def build_t_table(translations: dict) -> str:
    lines = ["  var T = {"]
    for english in sorted(translations.keys()):
        entries = translations[english]
        kv = []
        kv.append("en:" + js_str(english))
        for code, _label, _native in LANGS:
            if code == "en":
                continue
            v = entries.get(code) or english
            kv.append(f"{code}:" + js_str(v))
        lines.append(f"    {js_str(english)}: {{ {', '.join(kv)} }},")
    lines.append("  };")
    return "\n".join(lines)


def build_langs_array() -> str:
    parts = []
    for code, label, native in LANGS:
        parts.append("{ code: " + js_str(code) + ", label: " + js_str(label) + ", native: " + js_str(native) + " }")
    return "  var LANGS = [\n    " + ",\n    ".join(parts) + "\n  ];"


SUBSTRATE = """
(function () {
  'use strict';
  if (window.__chittiLangLoaded) return;
  window.__chittiLangLoaded = true;

  // Brand theme — Bryan's locked palette
  var THEME = { saffron: '#E86A17', navy: '#0E2344', gold: '#D4AF37' };
  var RTL_LANGS = { ur: 1, ks: 1, sd: 1 };

  // ── LANGS — 26 entries (en + 25 targets) ─────────────────────────────
__LANGS_ARRAY__

  // ── T table — every visible English string with hardcoded 26-lang translations
__T_TABLE__

  var LANG_KEY = 'chitti_lang';
  var currentLang = (function () {
    try { return localStorage.getItem(LANG_KEY) || 'en'; } catch (e) { return 'en'; }
  })();

  var SKIP_TAG_SET = { SCRIPT:1, STYLE:1, CODE:1, PRE:1, TEXTAREA:1, NOSCRIPT:1, INPUT:1 };

  function lookup(text, lang) {
    if (!text) return text;
    var trim = text.replace(/\\s+/g, ' ').trim();
    if (!trim) return text;
    var entry = T[trim];
    if (!entry) return null;
    var v = entry[lang];
    if (!v || v === trim) return null;
    return text.replace(trim, v);
  }

  // Snapshot original English on every translatable node (once).
  function snapshotAll() {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAG_SET[p.tagName]) return NodeFilter.FILTER_REJECT;
        var t = (n.nodeValue || '').replace(/\\s+/g, ' ').trim();
        if (!t) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = w.nextNode())) {
      if (node._chittiOrig === undefined) node._chittiOrig = node.nodeValue;
    }
    document.querySelectorAll('[placeholder]').forEach(function (el) {
      if (!el.dataset.chittiPhOrig) el.dataset.chittiPhOrig = el.getAttribute('placeholder') || '';
    });
    document.querySelectorAll('[aria-label]').forEach(function (el) {
      if (!el.dataset.chittiAriaOrig) el.dataset.chittiAriaOrig = el.getAttribute('aria-label') || '';
    });
    document.querySelectorAll('[title]').forEach(function (el) {
      if (!el.dataset.chittiTitleOrig) el.dataset.chittiTitleOrig = el.getAttribute('title') || '';
    });
    document.querySelectorAll('[alt]').forEach(function (el) {
      if (!el.dataset.chittiAltOrig) el.dataset.chittiAltOrig = el.getAttribute('alt') || '';
    });
  }

  function translateAll(lang) {
    snapshotAll();
    currentLang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS[lang] ? 'rtl' : 'ltr';

    // Text nodes
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAG_SET[p.tagName]) return NodeFilter.FILTER_REJECT;
        if (n._chittiOrig === undefined) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = w.nextNode())) {
      var orig = node._chittiOrig;
      if (lang === 'en') { node.nodeValue = orig; continue; }
      var t = lookup(orig, lang);
      node.nodeValue = (t !== null) ? t : orig;
    }
    // Attributes
    document.querySelectorAll('[placeholder]').forEach(function (el) {
      var orig = el.dataset.chittiPhOrig || el.getAttribute('placeholder') || '';
      if (lang === 'en') { el.setAttribute('placeholder', orig); return; }
      var t = lookup(orig, lang);
      el.setAttribute('placeholder', (t !== null) ? t : orig);
    });
    document.querySelectorAll('[aria-label]').forEach(function (el) {
      var orig = el.dataset.chittiAriaOrig || el.getAttribute('aria-label') || '';
      if (lang === 'en') { el.setAttribute('aria-label', orig); return; }
      var t = lookup(orig, lang);
      el.setAttribute('aria-label', (t !== null) ? t : orig);
    });
    document.querySelectorAll('[title]').forEach(function (el) {
      var orig = el.dataset.chittiTitleOrig || el.getAttribute('title') || '';
      if (lang === 'en') { el.setAttribute('title', orig); return; }
      var t = lookup(orig, lang);
      el.setAttribute('title', (t !== null) ? t : orig);
    });
    document.querySelectorAll('[alt]').forEach(function (el) {
      var orig = el.dataset.chittiAltOrig || el.getAttribute('alt') || '';
      if (lang === 'en') { el.setAttribute('alt', orig); return; }
      var t = lookup(orig, lang);
      el.setAttribute('alt', (t !== null) ? t : orig);
    });

    // Notify the page (so any custom JS can react)
    try {
      document.dispatchEvent(new CustomEvent('chitti:langchange', { detail: { lang: lang } }));
    } catch (e) {}
  }

  function populateSelect(sel) {
    sel.innerHTML = '';
    for (var i = 0; i < LANGS.length; i++) {
      var l = LANGS[i];
      var opt = document.createElement('option');
      opt.value = l.code;
      // Native-script only — keeps the dropdown free of Latin English when
      // the user has picked a non-English language.
      opt.textContent = l.native;
      sel.appendChild(opt);
    }
  }

  function wireDropdown() {
    // Find the page's existing language <select>
    var sel = document.querySelector(
      'select#lang-select, select#lang, select#hdr-lang, ' +
      'select#pick-lang, select#onb-lang, ' +
      'select[name=\"lang\"], select[name=\"language\"], ' +
      'select[aria-label=\"Language\"], select[aria-label=\"Choose language\"], select[aria-label=\"Change language\"]'
    );
    if (!sel) return;  // no existing dropdown — page is responsible per Bryan's contract
    populateSelect(sel);
    sel.value = currentLang;
    // Override any page-authored onchange so our handler wins
    sel.onchange = function () { translateAll(this.value); };
    // Apply current lang on init
    if (currentLang && currentLang !== 'en') {
      translateAll(currentLang);
    } else {
      // Even for 'en', snapshot originals so first switch works clean
      snapshotAll();
    }
    // Watch for runtime DOM mutations (JS-injected text like "No history yet"):
    // re-snapshot + re-translate. Throttled to once per animation frame.
    // We DISCONNECT the observer during translateAll so the substrate's own
    // text mutations don't trigger an infinite loop, then reconnect.
    if (typeof MutationObserver === 'function') {
      var _scanPending = false;
      var _observer = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          if ((m.addedNodes && m.addedNodes.length) || m.type === 'characterData') {
            // Ignore mutations caused by our own substitution
            var t = m.target;
            if (t && (t.parentElement || t).closest && (t.parentElement || t).closest('select#lang-select')) continue;
            rescan();
            return;
          }
        }
      });
      function rescan() {
        if (_scanPending) return;
        _scanPending = true;
        (window.requestAnimationFrame || function (fn) { setTimeout(fn, 16); })(function () {
          _scanPending = false;
          _observer.disconnect();
          try { translateAll(currentLang); } finally {
            _observer.observe(document.body, { childList: true, subtree: true, characterData: true });
          }
        });
      }
      _observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  window.Chitti = window.Chitti || {};
  window.Chitti.lang = {
    set: translateAll,
    current: function () { return currentLang; },
    list: LANGS.slice(),
    theme: THEME,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireDropdown);
  } else {
    wireDropdown();
  }
})();
"""


def main() -> int:
    if not TRANS_FILE.exists():
        print("FAIL: scripts/vaani_translations.json not found", file=sys.stderr)
        return 1
    translations = json.loads(TRANS_FILE.read_text(encoding="utf-8"))
    print(f"Loaded {len(translations)} translated strings.")
    translations = post_process(translations)
    print(f"After post-process: {len(translations)} entries.")

    js = SUBSTRATE.replace("__LANGS_ARRAY__", build_langs_array())
    js = js.replace("__T_TABLE__", build_t_table(translations))
    OUT.write_text(js, encoding="utf-8")
    size_kb = OUT.stat().st_size / 1024
    print(f"Wrote {OUT} ({size_kb:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
