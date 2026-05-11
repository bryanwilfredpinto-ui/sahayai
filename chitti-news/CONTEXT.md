# CONTEXT — Why Chitti News exists

> "The news every Indian needs, in the language they think in, with the context to trust it."

This document captures the **why** behind Chitti News. The product decisions in [ARCHITECTURE.md](ARCHITECTURE.md), the schemas in [DATABASE.md](DATABASE.md), and the editorial guardrails in [skills/](skills/) all flow from the constraints stated here.

---

## 1. The problem

India's news consumer is squeezed between three bad options:

1. **English-only national aggregators** (Inshorts, Google News India) — fast, but the language excludes anyone whose first language isn't English.
2. **Vernacular publishers' own apps** (Dainik Bhaskar, Eenadu, Mathrubhumi) — language-native, but each publisher's app shows only that publisher's stories. No cross-source view.
3. **Paywalled English papers** (Hindu, ET, Mint) — high quality, but a paywall + an English wall + a Delhi-centric bias.

None of the three serve the four-user audience Chitti is built for:

| Sub-population | Underserved because |
|---|---|
| Tier-2/3 vernacular reader | No multi-source aggregator in their language |
| Elderly + low-literacy reader | All current apps assume reading; none read aloud |
| Blind user | No screen-reader-friendly news app exists |
| Deaf user | TV news (the cultural default) excludes them; chyron-only sources are rare |
| Mute user | No app accepts voice commands as the primary input — fine for them, but their family flow into the app via shared phones, hence the same constraints apply |

Chitti News is built so every one of those readers can use the same screen.

---

## 2. The four-user accessibility contract

This is the **non-negotiable design constraint** that overrides every aesthetic call. Memorised from `project_four_user_contract.md` in the user's memory.

| User | Constraint | Chitti News expression |
|---|---|---|
| **Blind** | Cannot see the screen | Every control has `aria-label`; every payload includes `speak_en` + `speak_hi`; SpeechSynthesis wired to the picked language |
| **Deaf** | Cannot hear audio | All audio cues have a visible counterpart (no audio-only state); fact-check verdict shows symbol + colour + word, not just colour |
| **Mute** | Cannot speak commands | Every action is reachable by tap; voice is opt-in not required |
| **Illiterate** | Cannot read text | Symbol-led cards; read-aloud is one tap; plain English captions; 3-bullet Chitti's Take in their language |

### What this rules out

- Colour-only state changes (the fact-check verdict colour is **always paired with a symbol + word**: `verified` + `✓` + green; `partial` + `•` + amber; `disputed` + `!` + red; `unverified` + `?` + muted).
- Audio-only confirmations.
- Voice-only inputs without a tap fallback.
- Tap-only inputs without a TTS readback.
- Tiny fonts, low-contrast text, hover-only affordances.

### What this enables (the design dividends)

- Anyone can use the app — including the four target users — on the **same screen**, with no "accessibility mode" toggle. Inclusive by default.
- The product earns word-of-mouth in joint families because the elderly grandparent and the schoolkid can both use it without help.

---

## 3. Language-first design

The first thing the user does on Chitti News is pick a **state + language** in a persistent onboarding modal. Everything that follows is filtered by that choice.

### Why this is the first interaction (not buried in a settings menu)

- Most Indian news apps default to English and bury the language switcher. That tells the vernacular reader "you're a second-class user".
- By making language the very first picker, Chitti News flips that — the English reader has to pick "English" too. No language is privileged.
- The picker writes to `localStorage` (`_chittiLang`, `_chittiState`) so it persists across sessions.

### Languages supported (today + planned)

| Code | Language | Status |
|---|---|---|
| `en` | English | full coverage |
| `hi` | Hindi (Devanagari) | full coverage |
| `bn` | Bangla | partial (BBC vernacular + a few publishers) |
| `te` | Telugu | partial |
| `ta` | Tamil | partial |
| `mr` | Marathi | partial |
| `kn` | Kannada | partial |
| `od` | Odia | partial |
| `ml` | Malayalam | partial (unblocked in commit `570e4a5`) |
| `gu` | Gujarati | partial (unblocked in commit `570e4a5`) |
| `pa` | Punjabi | partial (unblocked in commit `570e4a5`) |
| `ur` | Urdu | partial (unblocked in commit `570e4a5`) |

### Why the regional-language situation is hard

Bangla / Telugu / Tamil / Odia outlets often don't publish public RSS, or they publish broken RSS, or they geoblock the feed. The roadmap in [TODO.md](TODO.md) covers HTML-scraping and partner-API integration in v1.1.

---

## 4. Regional state-aware feed routing

Every article carries `(state, language, category)` as its primary classification. Feeds are queried as:

```
state ∈ {requested_state, "india"}     ← state-specific OR national fallback
AND language == requested_language
AND category == requested_category
```

This is the literal SQL pattern in [`news_db.feed()`](backend/services/news_db.py). Two implications:

1. **State-aware** — a Maharashtra reader picking `state=mh` sees Mumbai / Pune / Marathi-publisher headlines mixed into the national feed, not buried.
2. **National-fallback** — there's never an empty feed; the "india" articles backfill if state coverage is thin.

### Why state matters as a first-class dimension

Indian news consumption is not flat-national. A reader in Karnataka does NOT want a TOI-Delhi-centric national feed alone — they want Bengaluru + Karnataka politics + the parts of national news that reach their state. Most aggregators bury state pages two taps deep. Chitti News makes state the sticky top-bar selector.

### Current state slices

`india`, `mp`, `mh`, `ka`, `tn`, `wb`, `up`, `dl`, `gj`, `pb`, `as`, `od` (growing). The full list is whichever values appear in [`backend/data/sources.json`](backend/data/sources.json) `state` field.

---

## 5. Aggregator-only positioning

Chitti News deliberately **is not** a publisher. We never write the news. We deliver others' RSS feeds.

### Always renders

- Source name + clickable link on every article card.
- "Chitti News aggregates headlines from public RSS feeds. We do not write the news — we deliver it. Verify with the source link before sharing." disclaimer in every API response, in both English and Hindi.
- WhatsApp share footer auto-appended: "Shared via Chitti News. Verify on the original source before sharing further."

### Never does

- Re-publish full article text (only the RSS-provided summary).
- Strip source attribution.
- Misrepresent a fact-check verdict as a truth claim — `verified` means "many outlets are saying this", not "this is true".
- Sell, share, or behaviorally target on user reading history.

See [CHITTI_NEWS_MASTER_SPEC.md](../CHITTI_NEWS_MASTER_SPEC.md) section 7 for the full legal posture.

---

## 6. Editorial guardrails (per category)

The most consequential decision Chitti News makes is **how each category is written about**. These guardrails live in [skills/](skills/) — one SKILL.md per sub-agent — and are non-negotiable.

| Category | Hard rule |
|---|---|
| Politics | No labels (right-wing / left-wing / communal / secular); no opinion verbs (slammed / lashed-out); equal coverage across parties; no predictions; ECI is the only authoritative election-result source |
| Sports | Cricket-first; scoreboard format; no controversy framing; no salary speculation; defer live-scores to ESPN Cricinfo |
| Business | Always cite the unit (₹500 cr / 11.4% YoY); never recommend buy/sell; defer to Chitti Shares for investment analysis |
| Tech | AI/Indian-startups focus; no fanboy tone; no "AI will replace [job]" speculation without sourced quote; neutral on crypto |
| Entertainment | Tasteful celebration of artistic achievement; no paparazzi framing; no personal-life speculation; source-cited box-office figures only |

These show up as `system`-prompt seeds for the per-category sub-agent (the Claude Code skill machinery) and as filtering rules at the ingest layer when we re-write summaries.

---

## 7. Privacy posture

- No tracking pixels.
- No third-party analytics.
- No behavioural targeting.
- No ads.
- The only identity the backend sees is the `X-User-Token` header — a per-device UUID kept in `localStorage`, used only to scope Read Later / Cancelled folders. Bryan never sees reading history.

---

## 8. What Chitti News is **not** (out of scope by design)

- Original reporting / journalism.
- Paywalled or login-walled content.
- Comments / community discussion on articles.
- Live video or TV streaming.
- A general-purpose chatbot — every Anthropic call is narrowly prompted (summary or fact-check rationale) with strict output schema.

---

## 9. Where this product sits in the Chitti family

```
Chitti (parent brand at sahayai.in)
├── Chitti Shares (Technical + Fundamentals)
├── Chitti MedUPI
├── Chitti News                           ← this product
├── Chitti Vaani / UPI Guard / Scanner / ...
└── Chitti Voice Factory (shared substrate)
```

Same Bharat Premium theme. Same Flask backend pattern. Same four-user contract. Same `<product>.*` Postgres schema isolation alongside `medupi.*` and `shares.*`.

---

*Living document. If you change the contract here, update the master spec at [`CHITTI_NEWS_MASTER_SPEC.md`](../CHITTI_NEWS_MASTER_SPEC.md) and the user-memory entry `project_chitti_news_spec.md` in the same session.*


## Accessibility Requirements (Non-Negotiable)
Every Chitti app must be built accessibility first before AI features are added.

### Target Users
- Blind users: Full voice navigation, TalkBack compatible
- Deaf users: Full visual, no audio dependency
- Mute users: Text/gesture input only
- Elderly users: Large touch targets, high contrast

### Android Accessibility Compliance
- Every button must have a text label
- Every image must have alt text
- Logical tab and reading order
- High contrast mode support
- Large touch targets minimum 48x48dp
- Compatible with TalkBack screen reader
- Compatible with BrailleBack for Braille display users
- No image-only content, always have text alternative

### Accountability
Once accessibility is confirmed, AI powers the Chitti.
Chitti is then accountable for keeping all content fresh and updated daily.

### Founder Dashboard
All feature status visible at sahayai.in/founder
