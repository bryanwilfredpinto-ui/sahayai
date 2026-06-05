# Chitti language packs (`lang/`)

**World Class Chitti — Commando Discipline. Zero Excuses.**

These are the per-language translation packs that power `chitti_lang.js` (the
Vaani-anchored i18n substrate loaded on every Chitti page).

## Why this exists (KI-01)

`chitti_lang.js` used to bake **all 26 languages into one 16 MB file** (`var T = {…}`),
so every visitor downloaded ~2 MB brotli on first load — heavy for the low-end,
rural, low-bandwidth devices Chitti is built for. Split 2026-06-05.

## How it works now

- `chitti_lang.js` is a **~14 KB runtime** (no data). On a page it:
  1. reads the active language from `localStorage.chitti_lang`,
  2. lazy-loads **only that language's pack** (`lang/<code>.js`), English needs none,
  3. translates the DOM, then **background-preloads the other packs** (idle) so
     dropdown switching stays instant.
- Each pack is `window.__chittiLangRegister("<code>", { "English string": "translation", … })`
  — only the strings that actually differ from English (matching the runtime's
  lookup semantics). English (`en`) has no pack.
- Falls back to English (honest) if a pack fails to load. Public API
  (`Chitti.lang.set/current/list/lookupText/extend/theme`) is unchanged.

| | Before | After |
|---|---|---|
| First-load transfer (non-English) | ~2 MB brotli (all 26 langs) | **~170 KB brotli** (one pack) |
| First-load transfer (English) | ~2 MB brotli | **~14 KB** (runtime only) |

## Adding / changing strings

The per-language packs are now the source of truth. To add a UI string:
1. Add the English→translation pair to each relevant `lang/<code>.js` pack
   (at minimum `hi`; others honestly Hindi-fall-back per the Voice-Strategy lock).
2. Keep brand/technical terms English (Chitti, DeepSeek, UPI, AES-256-GCM…).

The packs were generated once by [`../tools/split_lang.mjs`](../tools/split_lang.mjs)
from the pre-split 16 MB `chitti_lang.js` (recoverable from git history if a full
re-generation is ever needed). The old `inject_*_strings.py` tools that edited
`var T = {…}` are superseded by this layout.

## Files
- `<code>.js` — 25 packs (hi, bn, te, ta, mr, gu, kn, ml, pa, or, as, ur, sa, mai,
  kok, doi, ks, ne, sd, mni, sat, bho, raj, kru, hoc).
- `_manifest.json` — per-language string counts (verification).
