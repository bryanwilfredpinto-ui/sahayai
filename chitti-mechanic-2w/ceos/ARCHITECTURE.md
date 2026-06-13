🎖️ World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.

# ARCHITECTURE — Chitti Mechanic 2 Wheeler

```
                         User (any of 26 languages, any of 5 abilities)
                                          │  voice / tap / type
                                          ▼
                    ┌──────────────────────────────────────────────┐
                    │  Accessibility & Language layer (Feature 0)    │
                    │  chitti_a11y.js · chitti_lang.js · feedback    │
                    │  voice-out · ISL · symbol+word · picture menus │
                    │  service worker (offline)                      │
                    └──────────────────────────────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────────┐
                    │  CLIENT — chitti_mechanic_2w.html              │
                    │  vanilla-JS UI + i18n(26) + a11y(audio/haptic) │
                    │  + Core Engine (chitti_mechanic_2w_engine.js)  │
                    │  window.ChittiMech2W — pure, dependency-free   │
                    │  vault·reminders·buy·insure·puc·service·tyre·  │
                    │  battery·fuel·education·diagnose·scam·triage·  │
                    │  sell·savings·twin·scores                      │
                    │  ← ALL km/₹/date math here, provenance-tagged  │
                    │  → every result {confidence, risks[], sources[]}│
                    └──────────────────────────────────────────────┘
                          │                         │
            LLM ENHANCEMENT (optional)        BACKEND (chitti-mechanic-2w-api)
            DeepSeek narrates engine output   Flask, honest 501 stubs:
            in the user's language;           /api/2w/health
            never computes a number;          /api/2w/insure  /api/2w/tyre
            honest stub on 429/offline        /api/2w/service /api/2w/diagnose
                          │                   /api/2w/value
                          │                         │
                          ▼                         ▼
                    ┌──────────────────────────────────────────────┐
                    │  DB — Turso (local SQLite fallback)            │
                    │  Vehicle Twin (server copy on explicit export) │
                    │  + journals (savings, feedback, reminders log) │
                    └──────────────────────────────────────────────┘
```

## Deterministic-first doctrine (Founder Rule: RULES ARE THE PRODUCT)

1. **The engine is the product.** `chitti_mechanic_2w_engine.js` (`window.ChittiMech2W`)
   is a pure, dependency-free, node-testable library. Every km/₹/date is computed here
   from the user's own inputs + the Vehicle Twin + a **versioned rule table** (service
   intervals, tyre/battery life, insurer CSR, OBD codes, scam thresholds). It runs with
   the internet down and DeepSeek 429.
2. **The LLM is an enhancement.** DeepSeek (via `chitti-mechanic-2w-api`,
   OpenAI-compatible per §2 lock) only *narrates* engine output in the user's language.
   If the LLM is unavailable, the engine's own plain-language strings ship — an honest
   stub, never a fabricated number or diagnosis.
3. **Voice/ISL/lang are substrate.** Loaded once from repo-root (`chitti_a11y.js`,
   `chitti_lang.js`, `feedback-widget.js`); every feature inherits all five frontend
   gates by auto-injection.
4. **Every result is self-describing.** No engine function returns a bare value — it
   returns `{value..., confidence, risks[], sources[]}` so the UI can always render
   confidence + risks + sources.

## Backend contract (honest 501 stubs)

| Route | Purpose | Status |
|---|---|---|
| `/api/2w/health` | liveness + version | 🟢 |
| `/api/2w/insure` | insurer compare narration | 🔵 501 honest stub (engine does the math client-side) |
| `/api/2w/tyre` | tyre rec narration | 🔵 501 |
| `/api/2w/service` | service schedule narration | 🔵 501 |
| `/api/2w/diagnose` | symptom/OBD narration | 🔵 501 |
| `/api/2w/value` | sell/buy value narration | 🔵 501 |

The 501s are **honest** — the client engine already produces the deterministic answer;
the backend only adds DeepSeek narration once the key/quota lands. A 501 never blocks a
user from getting the engine's plain-language result.

## Substrate wiring

| Concern | Owner | Rule |
|---|---|---|
| Language dropdown | `chitti_lang.js` owns `#lang-select` (26 langs) | Never replace with a page-local dropdown |
| Accessibility (voice/ISL/profile/braille) | `chitti_a11y.js` | Auto-injected; Disability Profile asked once, synced across Chittis |
| Per-response widget | `feedback-widget.js` | 5-element 🔊/🤖/👍/👎/✏️ on every `[data-chitti-response]` card |
| Offline | service worker | Engine + last Twin cached; reminders compute offline |

## Data-ownership & privacy

The Vehicle Twin lives on-device (localStorage, key `chitti_mech_2w_twin_v1`) — never
leaves the device unless the user explicitly exports. Document Vault is local-only. No
RC/insurance number is sent to any LLM. "Chitti forget" wipes the Twin + Vault and
tombstones any anonymised aggregate (matches §2b / §2f contract).

## Data-table versioning

Every rule table carries `version` + `effective_from` (+ `source`). When a service
interval, tyre/battery-life figure, insurer CSR, OBD code, or scam threshold changes,
**only the table changes — the engine logic is untouched.** The active table version is
shown to the user and spoken, so an answer is never silently stale
([memory/rule_versioning.md](memory/rule_versioning.md)).

---
> **World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.**
