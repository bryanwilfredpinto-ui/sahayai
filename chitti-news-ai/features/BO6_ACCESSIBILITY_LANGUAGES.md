# BO6 — Accessibility & Languages

> Chitti News AI · Build Order 6 of 7. Research -> Document -> Wire -> Test.
> Deliverable: title-i18n + RTL wiring on chitti_news_ai.html (layered on the
> chitti_lang.js substrate) + tools/cert_cnai_omnibus.mjs (the BO7 evidence).

## 1. Research — Top 20 accessibility tools (best practice copied)

JAWS (name+role+value + landmarks), NVDA (aria-live for dynamic content),
VoiceOver (group related controls), TalkBack (48dp targets + DOM=visual order),
Be My Eyes (describe-this path), Seeing AI (audio-first structured read), Envision
(tap any text to hear; chunk long content), Google Lookout (proactive announce +
high-contrast), Speechify (read-along highlight), NaturalReader (persistent read
button + speed), Immersive Reader (plain language + picture dictionary), Read&Write
(tap-word -> define+speak), axe DevTools (CI-block serious), WAVE (heading/ARIA),
Lighthouse (a11y >=95), Stark (contrast >=4.5, never colour-only), SignAll (sign
track), Ava (real-time captions), Otter (scrollable transcript), Live Transcribe
(low-latency captions).

## 2. Research — Top 20 AI accessibility apps (copied)

Be My AI / Seeing AI / Envision AI / Lookout (vision description + reading-order
TTS), Ask Envision (Q&A over content), Speechify/ElevenLabs (natural multilingual
voices, cache for offline), Whisper / Live Caption / Otter / Ava (robust captions),
SignAll / Hand Talk (sign-language avatar, honest "approximate" label), Bhashini
(govt 22-lang ASR/TTS/MT — the swappable provider target), Google/Microsoft
Translator, Immersive Reader (AI simplification), Helperbird (reading profiles),
Reverso/DeepL (context translation, preserve structure + proper nouns).

## 3. WCAG 2.2 AA — what the cert enforces

Automated (axe-core): button/link-name, valid ARIA, input labels, image-alt,
**color-contrast >=4.5:1**, heading-order, landmarks, unique ids, html-has-lang,
semantic lists, no positive tabindex. Manual/scripted: **target-size 44x44**,
focus order + visible focus, full keyboard operability, aria-live status, colour
never the only signal, focus-not-obscured by the sticky bars.

## 4. Four-user contract applied to the learning product

- **Blind:** roadmap / course / analogy / career / swarm each fully speakable;
  per-block "🔊 Read aloud"; aria-live announces new cards; logical headings.
- **Deaf:** never audio-only — every spoken output is also on-screen text; ISL
  panel (chitti_a11y.js) + the analogy "breaks down" text; visual progress.
- **Mute:** every input tap + type; voice optional (🎙️), never required; the ✏️
  feedback path always available.
- **Illiterate:** icon + emoji on every control; labels spoken; difficulty as
  dots; plain-language why/milestone/practice; picture chips for popular goals.

## 5. 26-language strategy (layered on the substrate, not fighting it)

chitti_lang.js T-dictionary is canonical auto-translate (wired to `#lang-select`).
The page layers its OWN section strings via a small **CNAI_I18N (en+hi)** bag +
`cnaiApplyLang()` hooked to the `lang-select` change event — it sets the 5
learning-section titles/subs and **`dir="rtl"` for ur / ks / sd**. Proper nouns
(ChatGPT, Gemini, NPTEL, Bhashini) stay English; numbers + roadmap structure are
language-independent; speech uses hi-IN vs en-IN. Canonical 26 codes (verified in
chitti_lang.js): en hi bn te ta mr gu kn ml pa or as ur sa mai kok doi ks ne sd
mni sat bho raj kru hoc. The substrate fills the other 24 languages' chrome.

## 6. Omnibus cert (BO7 evidence) — tools/cert_cnai_omnibus.mjs

Local-serve + offline; renders all 5 learning sections, then checks: 3 engines ·
**ALL 26 languages** (clean switch + html[lang] + RTL for ur/ks/sd) · 4 disability
profiles · 4 viewports + screenshots · axe WCAG 2.1+2.2 AA · tap-targets (learning
sections) · per-card data-chitti-response + read-aloud. Output:
cert_cnai_omnibus_result.json.

## 7. Result (measured 2026-06-09)

**21 / 22 PASS (95.5%).** 3 engines ✅ · 26/26 languages ✅ (RTL ur/ks/sd ✅) ·
4/4 disability profiles ✅ · 4/4 viewports ✅ (no h-scroll) · read-aloud controls
✅ (60) · per-card widget ✅ (54 cards) · **learning-section tap-targets: 0 under
44px** ✅ · **color-contrast: 0** ✅ (fixed: gray #777->#595959, green button
#0b5->#0a7a37).

**The 1 FAIL** = axe `target-size` on **2 shared bottom-nav links**
(chitti_bottom_nav.js → chitti_medupi / chitti_vaani), present on all 23 Chitti
pages — **cross-Chitti substrate debt**, owner = CTO substrate team (same item
flagged in the news-ai + news handovers). The learning product's OWN surface is
100% clean. Documented honestly in BO7 KNOWN_ISSUES, not hidden.

## REAL WEB RESEARCH — verified June 2026 (sources) + the "Degraded" badge fix

WCAG 2.2 AA verified against the standard (not memory):
- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [WAI — What's new in 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) · [WebAIM WCAG 2 Checklist](https://webaim.org/standards/wcag/checklist) · [Level Access — WCAG 2.2 AA checklist 2026](https://www.levelaccess.com/blog/wcag-2-2-aa-summary-and-checklist-for-website-owners/)
- Key facts applied: **Target Size (Min) 2.5.5 AA = 24×24 CSS px** (our learning controls are ≥44px — exceed even 2.5.5 AAA); **2.4.11 Focus Not Obscured**; **2.4.13 Focus Appearance**; accessible name must include the visible label; aria-live for status messages.

**"Degraded ⚠" badge — root cause found + FIXED.** It was NOT the learning
features (the page tests `status:"active"`, 57/57 cards widget-attached in a
clean probe). It was a real **false-positive in chitti_observability.js**: the
`card_detection` baseline ratcheted to the ALL-TIME max card count and never
recovered, so once the news feed loaded many cards then cleared (news backend
down or view switched), the page showed "Degraded" forever. Fix: the baseline
now **decays toward the recent norm** and a drop must persist **2 consecutive
cycles** before breaching — fewer false alarms across all 23 Chitti pages, no
real signal lost.
