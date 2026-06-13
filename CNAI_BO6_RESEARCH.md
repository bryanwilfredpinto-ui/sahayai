# CNAI_BO6_RESEARCH.md
## BO6 — Accessibility & Languages · Top-20 + Top-20

**Date:** 2026-06-13 · No code before research.

### A. Top 20 — accessible / multilingual learning apps
| # | App | Brilliant at | Misses | Chitti beats by |
|---|---|---|---|---|
| 1 | Duolingo | Best-in-class a11y, bite-size, 40+ langs | Not AI/career; dark patterns | AI-career + 11 Indian langs full-UI, no guilt loops |
| 2 | Be My Eyes / Be My AI | Blind assistance | Not learning | Blind-completable learning journey |
| 3 | TalkBack / VoiceOver | Native screen reader | OS layer | App tested with SR + ARIA |
| 4 | NVDA / JAWS | Windows SR | Tool | axe-core 0 + NVDA target |
| 5 | Microsoft Immersive Reader | Read-aloud + simplify | English-leaning | TTS in 11 Indian langs |
| 6 | Bhashini (Govt) | Indian-lang STT/TTS | Plumbing | Wired as voice substrate |
| 7 | Google Translate | 100+ langs | Generic; mixes scripts | Pure-language curated UI strings |
| 8 | Khan Academy a11y | Captions + transcripts | Limited Indic | Indian-lang + icons |
| 9 | Apple/Android a11y | Platform AT | OS | App-level WCAG 2.2 AA |
| 10 | WebAIM / axe-core | Audit standard | Tooling | 0-violation gate |
| 11 | Wikipedia (Indic) | Vernacular content | Not learning UI | Full-UI translation |
| 12 | StoryWeaver (Pratham) | Multilingual reading | Children | Adult AI literacy |
| 13 | Rocket Learning | Vernacular early-ed | Pre-school | Career |
| 14 | DIKSHA (Govt) | Multilingual school content | School; clunky | Adult, clean i18n |
| 15 | Annie (Thinkerbell) | Braille literacy | Niche | Braille mode (substrate) |
| 16 | Voiceitt | Atypical-speech STT | Niche | Mute users never need voice |
| 17 | Speechify | TTS | Paid | Free TTS |
| 18 | Reverso / Linguee | Translation memory | Not UI | UI_STRINGS map |
| 19 | Mozilla Common Voice | Donated voices | Data | Voice strategy aligns |
| 20 | i18next / FormatJS | i18n frameworks | Dev libs | Lightweight UI_STRINGS, no build |

### B. Top 20 AI apps — multilingual / accessibility AI
| # | App | Brilliant at | Misses | Chitti beats by |
|---|---|---|---|---|
| 1-6 | ChatGPT/Gemini/Claude voice, Whisper, Google USM, Sarvam/Krutrim (Indic LLMs) | multilingual voice/text | English-default; cost | deterministic UI i18n, free, 11 langs full-UI |
| 7 | Bhashini ULCA | Govt Indic models | integration | substrate-ready |
| 8 | AI4Bharat (IndicTrans/ASR) | Indic NLP | research | informs lang list |
| 9 | Seamless (Meta) | speech translation | not UI | UI strings |
| 10 | ElevenLabs Indic TTS | natural voice | paid | Web Speech free + Bhashini |
| 11 | Speechmatics | STT many langs | paid | free STT optional |
| 12 | Otter / Fireflies | captions | English | Indic captions plan |
| 13 | Descript | media a11y | creator | learner a11y |
| 14 | Seeing AI (MS) | blind assist | not learning | learning journey |
| 15 | Envision | blind OCR | not learning | learning |
| 16 | Google LearnLM | pedagogy | English | Indic + a11y |
| 17 | Khanmigo voice | tutor voice | US; paid | free, Indic |
| 18 | Replit a11y | code a11y | dev | broad |
| 19 | Stark / axe DevTools | a11y testing | tooling | CI gate |
| 20 | Smartcat / localization AI | localization | enterprise | self-serve free |

### C. 3 best ideas adopted
1. **Full-UI i18n via a string map + data-i18n (i18next pattern), no build tools** -> `cnai_i18n.js` UI_STRINGS (11 langs) + `applyLanguage()` re-renders every `[data-i18n]`.
2. **Voice synced to UI language (Immersive Reader / Bhashini)** -> `cnai_accessibility.js` TTS+STT use the selected language's BCP-47 code.
3. **axe-core 0-violation gate + WCAG 2.2 AA (WebAIM)** -> enforced in BO7; senior mode, skip-link, touch-target audit, aria-live announcer.

### D. 3 anti-patterns avoided
- **Mixed-script Hinglish** (Google Translate) -> pure language; tech terms English.
- **Color-only meaning** -> text labels always paired.
- **Audio-only or visual-only features** -> every audio has text; every visual has audio.

### E. Mapping (CEOS BO6)
9+ languages (delivered 11), full-UI translation, data-i18n, applyLanguage, localStorage persist, auto-detect -> Hindi default for Indian locales, WCAG 2.2 AA, senior mode, 44px targets, NVDA. New files `cnai_i18n.js`, `cnai_accessibility.js`.

### F. Deviation
Persist to BOTH `cnai_lang` (spec) and `chitti_lang` (the page's existing substrate key) so the chitti_lang.js substrate and this layer stay in sync — documented, intentional.
