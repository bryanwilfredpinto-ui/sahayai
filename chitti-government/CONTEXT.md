# Chitti Government — Context

## Why this product exists

India runs more than **2,300 active central + state welfare schemes**. The
people who would benefit the most — small / marginal farmers, BPL households,
elderly widows, persons with disabilities, sanitation workers, street
vendors, Vishwakarma artisans — are precisely the people least able to
navigate the maze:

- they don't read English (most portal UIs are English-first)
- they often can't read at all
- they can't see the screen (cataract, low vision, total blindness)
- they can't hear the IVR (Deaf and Hard-of-Hearing)
- they can't speak into a microphone (Mute / aphasic)
- they don't know the difference between **PM-Kisan** and **PMAY-G**, or
  that **PMJAY** runs on SECC-2011 deprivation, not current income
- they don't know that PM-Kisan excludes "income-tax payer / MP / MLA /
  Group A officer / professional in active practice" — but `pmkisan.gov.in`
  will let them try and then silently reject them

Chitti Government collapses that into one voice-first interaction:

> "Chitti, kya main PM-Kisan ke liye eligible hoon?"
> → deterministic verdict + 80–120-word spoken summary + document checklist
>   + the official portal deep-link.

The rule engine refuses to bluff. If a predicate is `unknown` it says so
("Aapki saalana aamdani kitni hai? Wo bataaiye to main pakka batauanga"),
not a confident-sounding guess.

---

## The four-user accessibility contract

Pinned in `~/.claude/projects/.../project_four_user_contract.md`:

> Every Chitti page must be usable by:
> 1. **Blind** users — screen-reader friendly, voice OUT for every state change.
> 2. **Deaf** users — captions on every voice-OUT, no audio-only signal.
> 3. **Mute** users — voice-IN is never the only input; on-screen buttons
>    must do everything voice can do.
> 4. **Illiterate / very-low-literacy** users — symbols + plain English /
>    Hindi alongside any text. No colour-only signal.
> Plus **elderly** users with cataract / shaky hand / hearing loss as the
> implicit fifth persona that ratifies all four.

How [chitti_government.html](../chitti_government.html) honours it:

| Mechanism | Implementation |
| --- | --- |
| **Sticky disclaimer** | "NOT a sarkari seva — government AI" bar pinned to top. |
| **Six-button accessibility plugin** | read-aloud, captions, voice-in, icons-only, sign-language link, call-support — visible on every screen. |
| **Onboarding modal** | 5 steps: welcome → plugins → terms → pledge → profile + final consent. Persisted via `chitti.gov.onboarded`. |
| **Voice IN + voice OUT for every tab** | Web Speech API; if the device can't TTS we fall back to large-print captions. |
| **Plain-language verdicts** | Eligibility coach is constrained by [PROMPTS.md](PROMPTS.md) to ≤120 spoken words, no jargon. |
| **DOB capture instead of "age"** | Onboarding asks for `dd/mm/yyyy` (per commit `ab8e665`); the backend's `_dob_to_age()` in [routes/government.py](backend/routes/government.py) handles the conversion so the rule engine still sees an integer age. Reason: an illiterate elderly user can recite a DOB they've heard for 60 years more reliably than they can subtract from "current year". |
| **No colour-only signal** | Verdict cards are emoji + word + colour. The rule-by-rule pass/fail card uses an icon, not just a tint. |
| **Privacy footer** | 6-line privacy promise + freshness link on every screen. |

## Design-from-PWD-user-perspective addendum

Pinned in `~/.claude/projects/.../feedback_design_from_pwd_user_perspective.md`:

> Generic SaaS safety patterns (per-send modals, OAuth toggle screens) BREAK
> blind / mute / illiterate users. Default to onboarding-grants + readback +
> undo, not pre-action confirmations.

In Chitti Government this manifests as:

- **Eligibility check is one-tap / one-utterance.** The verdict is computed
  and read aloud immediately. The "are you sure?" intermediate screen is
  never shown — the user already opted in by tapping the scheme.
- **Document upload is local-only** by default; the user does not face a
  "Allow Chitti to access your DigiLocker?" toggle on first run (see below).
- **Helpline button always visible** as the explicit escape hatch — Chitti
  is a guardian / commando / coach, not a polite assistant that hides under
  modal layers.

---

## DigiLocker — partner-only API; honest local-upload fallback

DigiLocker's full document-fetch API is gated to:

- registered entities (GST / incorporation certificate)
- a partner application that takes weeks to clear
- production keys issued only after a sandbox test cycle

Until that registration is approved Chitti Government CANNOT pull a user's
documents directly. The honest replacement, shipped in v1:

1. **Documents tab** uses an `<input type="file">` local picker. Files
   stay on the device — they are never POSTed to the backend.
2. **Expiry tracker** stores `{name, expires_on}` in `localStorage` with
   90 / 30 / 7-day browser-notification alerts.
3. A clearly labelled **"Open DigiLocker"** button deep-links to
   `https://www.digilocker.gov.in/` so users who already have an account
   can fetch their own documents there and return.

When partner registration lands (see [TODO.md](TODO.md)) the local picker
becomes a one-tap "Fetch from DigiLocker" button with **zero UI rework**.
The backend already accepts up to 8 MB uploads
(`MAX_CONTENT_LENGTH = 8 * 1024 * 1024` in [main.py](backend/main.py))
specifically for the DigiLocker XML / PDF reply.

Reasoning is documented in the master spec's "External-data honesty ledger"
table and in [CHITTI_GOVERNMENT_MASTER_SPEC.md](../CHITTI_GOVERNMENT_MASTER_SPEC.md).

---

## What Chitti Government is NOT

- **Not a sarkari seva.** The sticky disclaimer says so. Chitti never
  submits an application on the user's behalf.
- **Not a status fetcher.** No public status API exists for PM-Kisan /
  PMAY / PMJAY / MGNREGA. The "Track Status" tab is a labelled deep-link
  handoff to the official portal, with a spoken handoff line that warns
  the user "Chitti does not see your Aadhaar / registration number."
- **Not a financial advisor.** Predicates like `income_max_annual_inr`
  are inputs to a rule-engine, not financial advice.
- **Not an LLM-overrules-rules system.** DeepSeek can phrase the verdict
  but cannot change it. See the assertion in
  [services/government_deepseek.py](backend/services/government_deepseek.py):
  "the verdict object is still returned to the frontend verbatim so the
  user sees the deterministic pass/fail rules alongside the spoken summary."

---

## Privacy posture

- Profile is `localStorage` only. The eligibility endpoints accept it as
  an anonymous JSON body; nothing is persisted server-side.
- Feedback rows store `{feature, scheme_slug, verdict, note}` only — no
  user identifier, no IP, no name (see [models/feedback.py](backend/models/feedback.py)).
- Note field is capped at 240 chars to keep it safe to display.
- No Aadhaar / PAN / bank account is ever logged or transmitted; the
  DeepSeek prompt explicitly forbids it (see [PROMPTS.md](PROMPTS.md)).


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


---

## Global Best Practices (China · Dubai · Singapore)

Bharat-first, not Bharat-only. The full discussion lives in [../GLOBAL_BEST_PRACTICES.md](../GLOBAL_BEST_PRACTICES.md). Headline rules adopted for every Chitti, including this one:

- **Elder mode as a system default** (China). Our braille-mode toggle in [chitti_a11y.js](../chitti_a11y.js) generalises this to braille + low-vision in a single switch.
- **Minimum 4 Indian languages at launch** (Dubai TAMM principle, 8-language min). The 26-language registry is in [chitti_a11y.js](../chitti_a11y.js). No product is "shipped" until 4 are wired.
- **Happiness meter on every transaction** (Dubai). Three-button voice-first feedback after key flows, aggregated weekly. Wired in chitti-sales; planned in [TODO.md](TODO.md) for the rest.
- **Inclusive Design Mark co-design** (Singapore SG Enable). Our four-user contract is the local equivalent.
- **WCAG 2.1 AA continuous audit** (Singapore Govtech). The [BRAILLE.md](../BRAILLE.md) checklist is the manual equivalent until axe-core CI lands.
- **Provider abstraction is non-negotiable.** Bhashini today, swappable at `chitti-voice-factory`. Frontend never names the supplier.

### What we explicitly refuse

- Super-app monoculture (China). Each Chitti is independently installable, deletable, auditable.
- Mandatory national-ID linking (Dubai UAE Pass). Aadhaar is opt-in everywhere.
- Centralised digital identity (Singapore Singpass). No Chitti-pass; no mandatory biometrics.
- Social-credit feedback aggregation. Happiness meter is anonymised and per-product.

This section is mirrored across every Chitti's CONTEXT.md from a single source — see [GLOBAL_BEST_PRACTICES.md](../GLOBAL_BEST_PRACTICES.md).
