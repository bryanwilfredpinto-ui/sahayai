# Chitti News AI — BUILD ORDER (BO1 → BO12)

**Authored by:** Chitti (autonomous CTO mode) per Sire's 2026-06-06 directive
**Doctrine:** COSDF.md (canonical) + SAHAYAI_MASTER §7 + CHITTI_SOP §7 + CTO.md
**Approach:** Dismantle existing chitti_news_ai.html; rebuild from scratch BO-by-BO with each BO carrying its own test gate. Reuse `chitti_coach.js` (data engine — IMPACT/MISSIONS/PROJECTS/JOBS_RADAR/COMPARISONS/FORECAST/TOUR/CURRICULA) and `chitti_a11y.js` + `chitti_disability_profile.js` + `feedback-widget.js` substrate.

---

## BO1 — RESEARCH: best-in-class apps studied + lessons taken

### 12 apps benchmarked (and what we borrow)

| # | App | What they do best | What Chitti News AI borrows |
|---|---|---|---|
| 1 | **Inshorts** (India) | 60-second card snap-reads — 1 article = 1 swipeable card with no chrome | Card layout: title + 180-char summary + 1 action; no tab bar above the card. **BO7.** |
| 2 | **SmartNews** (US/JP) | AI feed prioritisation — what you SHOULD read this morning | Hero landing's Day-Today CTA: "Read these 3 first for your role today". **BO5.** |
| 3 | **Apple News** | Editorial discipline — never noisy, never 4 badges on a card | Maximum 1 relevance flag per card (CRITICAL or VERY-IMPORTANT only). **BO7.** |
| 4 | **DailyHunt** (India) | Vernacular-first with native-script lang dropdown in header | Lang dropdown lifted directly from Chitti Vaani's `lang-toggle-bharat` pattern (which DailyHunt inspired). **BO3.** |
| 5 | **Be My Eyes** | Blind-first — every screen reachable by voice in <3 taps from launch | Voice-First Mode auto-activates from `disability_profile.blind=true`; 50+ voice commands route to actions. **BO6.** |
| 6 | **Microsoft Seeing AI** | Multimodal blind support — camera + voice + audio cues | ARIA live region announces tab changes + content load. **BO2 + BO6.** |
| 7 | **Google Lookout** | Blind navigation — minimal labels, single primary action per screen | Hero landing has ONE primary CTA at any given state (see BO5 state machine). |
| 8 | **Khan Academy Kids** | Illiterate-friendly — icon-first nav, voice readback per element | Every Hub section has an emoji ICON before the heading; voice-readback bound to every `data-chitti-response` box. **BO8.** |
| 9 | **Coursiv** | 28-day daily AI tool curriculum with viral hook | Replicated + extended to 7 curricula (28-day flagship, 18-day Coursiv-match, 7-day sprint, 90-day pro, 5-day phone-only, 14-day build, team tour, industry sprint). **BO9.** |
| 10 | **Coursera / Udemy** | Course discovery with FREE filter prominent | Every Tour-day "try-it" URL surfaces FREE option first; PAID labelled explicitly. **BO9.** |
| 11 | **Duolingo** | Gamified daily streak — progress bar + visual reward | Tour progress bar at top of curriculum + dimmed done-days + scaled "today" card. **BO9.** |
| 12 | **BHASHINI** (Govt India) | 22-language Indic translation as substrate, not feature | `chitti_lang.T` dict is canonical; UI labels auto-translate per selected lang. **BO3.** |

### What we DO NOT do (anti-patterns)

| Anti-pattern | Source app (cautionary) | Why we avoid |
|---|---|---|
| Notification badges on tabs | TikTok / Instagram | Distracts blind/illiterate users; adds visual noise |
| 4+ badges per card | Twitter/X | Sire's #1 frustration — "cluttered, too much on screen" |
| Stacked sticky bars | Most news apps | Eats 40% of mobile viewport before content |
| Auto-playing video | Most news apps | Breaks voice-first experience |
| Paywall / signup-gate | Bloomberg / FT / NYT | Violates FREE-first founder rule |
| Hardcoded role list with no "Other" | All career-AI products | Violates COSDF L0 "no hardcoded roles" |

### Test gate BO1

- [x] 12 apps catalogued
- [x] Lessons taken + cited per BO
- [x] Anti-patterns documented
- **PASS** — research notes committed to BUILDORDER.md

---

## BO2 — BONES: fresh HTML skeleton (semantic, accessible by default)

**Spec:** Dismantle existing `chitti_news_ai.html` (was 153 KB, accreted over 6 months). Rebuild fresh, ~600 lines, COSDF-aligned, with:

- Semantic regions: `<header role="banner">` → `<nav role="navigation">` → `<main>` → `<footer>`
- `prefers-reduced-motion` honored (disables floatB animation)
- `:focus-visible` outlines on every interactive element
- `aria-live="polite"` region for content load announcements
- High-contrast palette (WCAG 2.1 AA verified: min 4.5:1)
- `lang="en"` on html (dynamically updated by chitti_lang on language change)

### Test gate BO2

- [ ] HTML validates (W3C)
- [ ] `<script>` tags balanced
- [ ] `chitti_coach.js` + `chitti_a11y.js` + `feedback-widget.js` load
- [ ] `window.ChittiCoach`, `window.Chitti`, `window.ChittiVoiceFirst` all present
- [ ] 0 console errors on load
- [ ] Cert: `cert_news_ai_v2.mjs::bones_load_clean` PASS

---

## BO3 — LANGUAGE DROPDOWN (Vaani-pattern)

**Spec:** Match Chitti Vaani exactly (lines 1068-1078 of chitti_vaani.html).

```html
<select id="lang-select" class="lang-toggle-bharat"
        aria-label="Change language" onchange="changeLanguage(this.value)">
  <option value="hi">हिन्दी</option>
  <option value="en">English</option>
  <option value="ta">தமிழ்</option>
  <option value="te">తెలుగు</option>
  <option value="bn">বাংলা</option>
  <option value="mr">मराठी</option>
  <option value="gu">ગુજરાતી</option>
  <option value="kn">ಕನ್ನಡ</option>
  <option value="ml">മലയാളം</option>
  <!-- + Urdu/Punjabi/Odia/Assamese/Bhojpuri/Sanskrit/etc — 26 total -->
</select>
```

**Difference from prior version:** lang dropdown moves from a separate `picker-bar` row to the header right (where Vaani has it), with native scripts visible (हिन्दी not "Hindi (hi)"). Voice-on-focus announces "Language. Currently English. Use arrow keys to browse 26 Indian languages."

### Test gate BO3

- [ ] Dropdown present in header right
- [ ] 26 options with native scripts
- [ ] aria-label set
- [ ] Voice-on-focus fires
- [ ] `changeLanguage()` calls `chitti_lang.setLang()` + persists to localStorage
- [ ] Cert: `cert_news_ai_v2.mjs::lang_dropdown_vaani_pattern` PASS

---

## BO4 — PROFESSION PICKER (single dropdown, voice-on-focus)

**Spec:** ONE picker only (no Experience / Salary on first view; those move to intake modal). Voice-on-focus. localStorage. 13 hardcoded + "Other (type your role)" for dynamic ANY-role per COSDF L0.

### Test gate BO4

- [ ] Picker present in hero
- [ ] 13 options + "Other"
- [ ] Voice-on-focus
- [ ] Profile persists to localStorage
- [ ] On change: Hero re-renders + Hub re-computes
- [ ] Cert: `cert_news_ai_v2.mjs::profession_picker_works` PASS

---

## BO5 — HERO LANDING (adaptive 4-state CTA)

**Spec:** ONE primary CTA at any given time. State machine:

| State | Trigger | Hero shows |
|---|---|---|
| **S1: No profession** | `profile.profession === 'everyone'` | 3-button grid: "👨‍⚕️ Doctor" / "👩‍🌾 Farmer" / "🎓 Student" + "Other..." text input |
| **S2: Profession set, no tour started** | profession set, `profile.curric_*_days = []` | ONE huge saffron button: **"🎓 Start your 28-Day AI Tour for [Role]"** |
| **S3: Tour in progress** | `done_count > 0 && done_count < total` | ONE huge button: **"📚 Day {next_day} of 28 — continue today's 15-min mission"** + progress bar |
| **S4: Curriculum complete** | `done_count >= total` | **"🏆 Curriculum complete. Claim your certificate."** |

### Test gate BO5

- [ ] Hero renders for each of 4 states
- [ ] CTA text matches state
- [ ] Only 1 primary button shown at a time
- [ ] Cert: `cert_news_ai_v2.mjs::hero_4_states` PASS

---

## BO6 — VOICE-FIRST MODE (blind / illiterate auto-activate)

**Spec:** Reuse `ChittiVoiceFirst` from prior commit `ecb1b86` + `c47f8a5`. Read `localStorage.disability_profile`; if `.blind` or `.illiterate`, auto-activate:

- Welcome announcement (profession-aware)
- 50+ voice commands route to actions
- ARIA-label sweep on all interactive elements
- MutationObserver re-runs sweep on dynamic content
- Floating indicator pill bottom-left

### Test gate BO6

- [ ] Voice-First activates when profile.blind=true
- [ ] 50+ commands registered
- [ ] Aria-labels present on picker + tabs + Hub chips
- [ ] Voice command "tour" opens Tool Tour
- [ ] Cert: `blind_voice_first_activates` + `blind_voice_cmd_news_routes` + `blind_aria_labels_complete` PASS

---

## BO7 — NEWS FEED (decluttered cards)

**Spec:** Card = title (with CRITICAL/VERY-IMPORTANT relevance flag if applicable) + 180-char summary + 1-line meta (source · FREE/PAID · age-if-stale) + 1 saffron "Open at source" + collapsed "ℹ More details" disclosure carrying Trust/category/keywords/signals.

Honors Inshorts (1 card = 1 swipe) + Apple News (no badge spam) + DailyHunt (vernacular by default).

### Test gate BO7

- [ ] Card has ≤3 visual elements above the disclosure
- [ ] 1 primary action button
- [ ] Disclosure carries 4 audit fields
- [ ] Relevance flag shows ONLY for CRITICAL + VERY-IMPORTANT
- [ ] Cert: `news_card_minimal` PASS

---

## BO8 — PROFESSION HUB (4 metric cards + 10 sections, 4 collapsed)

**Spec:** Use existing `ChittiCoach.buildHub()`. Renderer simplified:

- Header: 4 MedUPI metric-cards (Risk · Adoption · Opportunity · Readiness) + verdict + sourced_from
- 10 sub-sections — 6 visible (Mission · Projects · Jobs Radar · Mentor · Explains · Readiness) + 4 collapsed (Impact tasks · Prompts · Comparisons · Forecast)
- Single CTA per section
- Mentor section: ONE big "Start 28-day tour" + "More actions" disclosure

### Test gate BO8

- [ ] Hub renders for all 13 hardcoded professions
- [ ] 4 metric-cards present
- [ ] 6 sections open, 4 collapsed by default
- [ ] Verdict + sourced_from rendered
- [ ] Cert: `hub_renders_4_metric_cards` + `hub_renders_10_sections` PASS

---

## BO9 — 28-DAY TOUR (7 curricula picker)

**Spec:** Use existing `ChittiCoach.curricula()` (7 curricula: 28-day flagship + 18-day Coursiv-match + 7-day sprint + 90-day pro + 5-day phone-only + 14-day build + team tour + industry sprint = 8 total). Replicate Coursiv's promise ("Week 1 unstoppable / Week 2 ahead of 90% / Month 1 certificate"). Day cards dimmed when done, scaled when "today".

### Test gate BO9

- [ ] 8 curricula registered
- [ ] 18-day curriculum carries Sire's 11 creative tools (Lovable→Kling)
- [ ] 28-day for doctor renders 28 day-cards
- [ ] Day cards: done=dim, today=scaled, locked=opaque
- [ ] Mark Done persists
- [ ] Certificate claim works after 28 done
- [ ] Cert: existing 7.6 section in `cert_news_ai_full.mjs` PASS

---

## BO10 — ISL FOR DEAF (auto-attach via chitti_a11y.js)

**Spec:** Inherits from substrate. Every `data-chitti-response` box gets an ISL animation panel auto-attached by `chitti_a11y.js`. No new code needed in chitti_news_ai.html.

### Test gate BO10

- [ ] `chitti_a11y.js` loaded
- [ ] At least 5 `data-chitti-response` boxes on page
- [ ] ISL plugin attached per box (via inspection of `window.Chitti.isl`)
- [ ] Cert: `isl_substrate_attached` PASS

---

## BO11 — BACKEND FAIL-OPEN VERIFICATION

**Spec:** Reuse existing `cert_news_ai_full.mjs::Section 7 API matrix`. Every `/api/news-ai/feed/<stream>` returns 200 with items OR honest empty (post BUG-005 fix). `/health` returns 200.

### Test gate BO11

- [ ] 13 API endpoints all return 200
- [ ] Backend fail-open: `/feed?tab=foryou` returns 200 with empty items + honest_note (not 400)
- [ ] Cert: API matrix 13/13 PASS

---

## BO12 — HANDOVER DOC

**Spec:** Single doc covering:

- Build matrix (BO1-BO12 PASS/FAIL)
- Architecture diagram (ASCII)
- Accessibility matrix per user type (blind/deaf/mute/illiterate/blind+deaf/low-vision/cognitive)
- Browser/device compatibility
- Known issues with workarounds
- COSDF Quality Gate 1-8 attestation
- Sign-off (QA + Solution Architect + Sire's hands-on slot)

### Test gate BO12

- [ ] All 12 BOs marked PASS or honest-fail with mitigation
- [ ] COSDF Gates 1-8 attested
- [ ] Sign-off block present

---

## Build matrix (live status)

| BO | Title | Status | Test gate |
|---|---|---|---|
| BO1 | Research | ✅ shipped (this doc) | PASS |
| BO2 | Bones (fresh HTML) | ⏳ next | — |
| BO3 | Vaani lang dropdown | ⏳ | — |
| BO4 | Profession picker | ⏳ | — |
| BO5 | Hero landing (4 states) | ⏳ | — |
| BO6 | Voice-First mode | ⏳ (reuse) | — |
| BO7 | News feed (decluttered) | ⏳ | — |
| BO8 | Profession Hub | ⏳ (reuse) | — |
| BO9 | 28-Day Tour | ⏳ (reuse) | — |
| BO10 | ISL substrate | ⏳ (substrate) | — |
| BO11 | Backend fail-open | ⏳ (reuse) | — |
| BO12 | Handover doc | ⏳ | — |

Each row's status will be updated as the corresponding commit lands.
