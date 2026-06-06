# SOP-V005 — Language Fallback

> Standard Operating Procedure for handling language failures and Tier C
> language requests in Chitti Vaani. The Tier C honest-fallback contract is
> LOCKED — Vaani never silently substitutes a related language.
> Per SAHAYAI_MASTER.md §2 (Voice Factory — Tier C never silently falls back).

---

## Triggered When

- User requests a language in Tier C (Tulu, Kurukh/Oraon, or any other
  language not in Tiers A or B).
- A Tier A or B language supplier fails mid-session.
- All four Voice Factory suppliers fail for a given language.
- Language auto-detection produces a low-confidence language signal.
- User's `browser_lang` or `disability_profile.lang` does not match any
  registered Voice Factory code.

---

## Procedure

### Step 1 — Language Auto-Detection

1. Language Agent runs auto-detection on the first user message.
2. Inputs: user text sample + `browser_lang` header + `disability_profile.lang`.
3. Produces `lang_normalised` (a canonical Voice Factory language code).
4. Produces `voice_tier` (A, B, or C) from the Voice Factory ledger.

### Step 2 — Tier A or B: Normal Path

5. `voice_tier` = A or B: proceed to normal response assembly.
6. If a Tier A/B supplier fails mid-session (HTTP 5xx or timeout > 3 s):

   a. Cascade to next supplier in order:
      `mock_bhashini -> real Bhashini (ULCA) -> 3rd-party TTS -> community voices`.

   b. If all four suppliers fail:
      - Return text-only response for this turn.
      - Speak (or show) honest message: *"Awaaz seva abhi uplabdh nahi hai.
        Text mein jawab diya hai."*
      - Log the failure to `voice_factory_failures.db`.
      - Retry on next turn — do not lock the user into text-only mode permanently.

   c. If supplier recovers in a subsequent turn: resume voice output without
      asking the user to do anything.

### Step 3 — Tier C: Honest Fallback Path

7. `voice_tier` = C: Vaani DOES NOT silently serve a related language.
8. Vaani speaks (in the closest available Tier A language, and shows text):
   > *"[Language name] mein awaaz seva uplabdh nahi hai.
   > Kripya type karein ya doosri bhasha chunein."*

9. Offer the user a language switch:
   - Show the language selector (chitti_a11y.js language dropdown).
   - For blind users: read the available languages aloud and say:
     *"Kaunsi bhasha mein help chahiye? Hindi, English, Tamil..."*
10. If the user selects a Tier A/B language: switch and continue.
11. If the user insists on Tier C (no switch): Vaani continues in text-only mode
    for that language. DeepSeek answers in the user's language even without TTS.
    Text is shown; no voice is played.

### Step 4 — Code-Switch Handling

12. If Language Agent detects code-switching (Hindi-English mix, Tamil-English, etc.):
    - Keep `lang_normalised` as the non-English language.
    - Instruct DeepSeek to reply in the same code-switched register.
    - Voice output: use the non-English language's TTS supplier.
    - Do NOT normalise the code-switch out of the response.

### Step 5 — Unknown Language (Unrecognised Script or Gibberish)

13. If auto-detection confidence is < 0.60 AND the language cannot be mapped
    to any registered code:
    - `lang_normalised = en` (safe fallback to English).
    - Vaani speaks: *"Mujhe samajh nahi aaya — kya aap English mein bol sakte hain?"*
    - `fallback_applied = true` logged.

### Step 6 — Session Language Persistence

14. Once the user's language is confirmed (auto-detected or explicitly selected):
    - Write to `localStorage.chitti_vaani_lang`.
    - All subsequent turns in the session use this language without re-asking.
    - User can change language at any time via the language selector.

### Step 7 — Per-Turn Language Check

15. On each subsequent turn, Language Agent checks if the user's text is in a
    dramatically different language from `localStorage.chitti_vaani_lang`.
16. If yes (user switched mid-session without using the selector):
    - Detect the new language.
    - Update `localStorage.chitti_vaani_lang`.
    - Vaani confirms once: *"Main ab [new language] mein bol raha hun."*
    - No repeated confirmations for the rest of the session (anti-nag).

---

## Honest Fallback Messages (per Tier C scenario)

| Scenario | Message (Hindi, translate to user's closest lang) |
|---|---|
| Tier C requested | "Tulu mein awaaz seva uplabdh nahi hai — type karein ya doosri bhasha chunein." |
| All suppliers failed | "Awaaz seva abhi uplabdh nahi hai. Text mein jawab diya hai." |
| Unknown language | "Mujhe samajh nahi aaya — kya aap English mein bol sakte hain?" |
| Code-switch too high | No message — DeepSeek mirrors the code-switch naturally |

---

## Escalation

| Condition | Action |
|---|---|
| Voice Factory ledger shows > 5% supplier failures over 24 h | CTO escalation via Founder dashboard |
| Bhashini ULCA creds expire | Voice Factory falls back to mock_bhashini; CTO notified; no user-visible disruption |
| A Tier B language supplier degrades to Tier C quality (quality threshold dropped) | Update Voice Factory ledger; Vaani treats it as Tier C from next request; users told honestly |
| Community-donated voice for a language crosses quality threshold | Update Voice Factory ledger; supplier becomes Tier A; no code change needed |
| User reports bad TTS quality for a Tier A language | Log to `voice_quality_reports.db`; fed to Voice Factory quality score; does not trigger Tier C fallback until score drops below threshold |

---

## What We NEVER Do

- NEVER silently substitute Kannada for Tulu without telling the user.
- NEVER suppress the Tier C honest message to "avoid confusing the user".
- NEVER play audio in a language the user did not request.
- NEVER tell the user a language is supported when it has no Tier A/B supplier.
- NEVER hard-code a provider name in the message ("Bhashini nahi hai" is wrong;
  say "awaaz seva" — the provider is never exposed to the user).
- NEVER re-ask the user for their language preference more than once per session
  unless they explicitly changed it.

---

## Voice Factory Ledger Update Process

When a new language crosses the community-voice quality threshold (or a supplier
is added or removed):

1. Update `chitti-voice-factory/backend/services/voice_ledger.py`.
2. Update the 26-language registry in `chitti_a11y.js` `SUPPORTED_LANGS`.
3. Deploy Voice Factory backend (Railway).
4. Deploy chitti_a11y.js (GitHub Pages).
5. No per-Chitti code change needed — Language Agent reads the ledger at request time.

---

## Verification

- Automated: `backend/tests/test_language_agent.py` (Tier C honest message,
  no silent substitution, 26 languages registered).
- Manual: CTO tests Tulu and Kurukh requests — verifies honest fallback, no Kannada audio.
- Cert artefact: `tools/cert_screenshots/chitti_vaani_lang_fallback_375.png`.

---

Last reviewed: 2026-06-06
