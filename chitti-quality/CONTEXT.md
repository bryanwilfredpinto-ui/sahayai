# Chitti Quality — Context

> The guardian of every Chitti's standards. Voice-first, audit-driven, accountable to the four-user contract first, the founder dashboard second, the public quality page third.

## Why Chitti Quality exists

The Chitti family is now 12 products (counting Vaani Web + Vaani Android as one). Each one promises the **four-user contract** — blind, deaf, mute, illiterate must be able to use it before any LLM lands. Each one runs the **quadrails** (Safety → Relevance → Truth → Compliance) from [../lib/quadrails.py](../lib/quadrails.py). Each one emits a thumbs-up/down feedback signal via [../lib/feedback.py](../lib/feedback.py). Each one reports to the founder dashboard via [../lib/founder_report.py](../lib/founder_report.py).

The problem: **without a single owner, those guarantees rot.** A junior contributor adds an LLM call that bypasses the quadrails. A new page ships without `chitti_a11y.js`. The braille audit checklist in [../BRAILLE.md](../BRAILLE.md) sits at 60% green across the family and nobody noticed.

Chitti Quality is the named owner of "did every Chitti, today, meet every standard we promised yesterday".

## Four-user contract (carried over)

Every Chitti app must be built accessibility first before AI features are added. See [../MASTER_CONTEXT.md §1](../MASTER_CONTEXT.md).

| User | What they get from Chitti Quality |
|---|---|
| Blind | Voice-readable public quality page; aria-live announcements on status changes; provider-agnostic voice via [../chitti_a11y.js](../chitti_a11y.js). |
| Deaf | Every status is text + symbol (✅ ⚠️ ⛔); never colour alone; captions on every spoken update. |
| Mute | Read-only product surface — no microphone required; every action is a click. |
| Illiterate | Each compliance status is paired with a plain-Hindi line read aloud by the language selector. |
| Elderly | Large touch targets, high contrast, 18pt in Braille mode. |

## Where Chitti Quality lives

- **Public-facing page:** [../chitti_quality.html](../chitti_quality.html) — trust page anyone can visit at `sahayai.in/chitti_quality.html`.
- **Standards reference:** [STANDARDS.md](STANDARDS.md).
- **Audit checklist:** [CHECKLIST.md](CHECKLIST.md) — run daily against every Chitti.
- **Accountability contract:** [ACCOUNTABILITY.md](ACCOUNTABILITY.md) — what Chitti Quality owns and what it does NOT.
- **Identity:** [IDENTITY.md](IDENTITY.md).

The compliance data shown on the public page is sourced from each Chitti's `/admin/founder` endpoint (planned), aggregated by [../lib/founder_report.py](../lib/founder_report.py). Until those endpoints are wired across all 12, the public page renders the most recent known state with an honest **"as of <date> · next refresh <date>"** caption — never a fake number.

## What Chitti Quality is NOT

- Not a separate LLM. There is no `chitti-quality-api`. The page is static + a tiny JSON loader.
- Not a build-time gate. Chitti Quality is an *audit* layer, not a CI blocker. CI blocking is in each Chitti's own pipeline (planned).
- Not a feature roadmap. Roadmaps belong in each Chitti's `TODO.md`.
- Not an LLM evaluator. Evaluators live in [../lib/evaluators.py](../lib/evaluators.py); Chitti Quality consumes their output.

## Trust as the product

The public quality page is **the trust product**. A user who sees "Chitti follows Singapore + Dubai + China standards, audited weekly, this is today's score" trusts Chitti with health, money, and legal matters. The page must therefore be:

- **Honest.** Stubbed values are labelled stubbed. Red statuses stay red.
- **Quoted.** Every standard links to its source (China GB/T 37668, Dubai AI Charter, Singapore AI Governance Framework).
- **Reachable.** The "Report a quality issue" button is on every Chitti page's footer (via the shared a11y bar's bottom-right slot).

## Chitti Quality's Ongoing Responsibility

Chitti Quality is never done. It continuously:

### 1. MONITORS new global standards

- Checks China, Dubai, Singapore, EU, and India (DPDP Act) for new AI regulations.
- Monthly scan of AI safety publications (OpenAI Safety, Anthropic, DeepMind, partnership-on-AI).
- Quarterly review of the OWASP AI Top 10 (prompt injection, supply-chain risk, etc.).
- Annual review of WCAG, IS 17802 (Indian accessibility), GB/T 37668 revisions.

### 2. PROPOSES improvements

- When a new standard is found → opens a GitHub issue with an implementation plan.
- Tags the affected Chittis on the issue.
- Estimates effort (S / M / L) and priority (P0 hard-block / P1 next-sprint / P2 quarterly).
- Cross-references the relevant section in [STANDARDS.md](STANDARDS.md) so the proposal is traceable.

### 3. IMPLEMENTS across all Chittis

- Once approved by the Founder → implements the change.
- Tests in one Chitti first (the **pilot**) — usually chitti-news (lowest risk) or chitti-medupi (highest signal).
- Rolls out to all 12 after the pilot passes the [CHECKLIST.md](CHECKLIST.md) for seven consecutive days.

### 4. REPORTS to Founder

- **Weekly quality digest** — every Monday 07:00 IST. One paragraph per Chitti + the trend line.
- Example digest line: *"This week Chitti Quality found 2 new standards and implemented 1; chitti-medupi tone score dipped from 0.89 → 0.84 (still green); chitti-vaani-android braille audit blocked on real device test."*
- **Monthly certification report** — full audit results, anomalies, and a one-line recommendation per Chitti.

### 5. NEVER lets standards slip

- If any Chitti drops below threshold → immediate alert to the Founder via [`../lib/founder_report.py`](../lib/founder_report.py).
- **Auto-rollback** is wired into [`../lib/hooks.py`](../lib/hooks.py) for critical failures (disclaimer evaluator drops below 100%, hallucination rate exceeds 5%, /health 502 for > 5 minutes). The last known-good deploy is auto-pinned; the affected Chitti's status flips to red on [`../chitti_quality.html`](../chitti_quality.html).
- No silent recoveries. Even a successful auto-rollback ships an incident note to the founder dashboard.

## Chitti Quality's Motto

> **"Standards are not a destination. They are a daily practice."**

---

## Chitti Quality v2 — operating contract (2026-05-13)

What follows is the full operating contract — eight parts the whole framework runs from. Every section here maps to live code in this repo so it can't drift away from reality.

### Part 1 — Framework extensions

#### 1.1 Agentic rules (what Chitti may do without asking)

Defined in [../lib/chitti_quality.py](../lib/chitti_quality.py) `AGENTIC_RULES`. The helper `may_do(action, chitti)` returns True / False per request. Three tiers:

| Tier | Examples | Behaviour |
|---|---|---|
| **Always do** | `speak_aloud`, `translate_ui`, `explain_simply`, `answer_question`, `save_local_history` | Do without asking, regardless of risk. |
| **Ask for HIGH** | `send_email_summary`, `export_pdf`, `share_link`, `save_to_drive` | Auto-allowed on LOW; asks on HIGH-risk Chittis. |
| **Always ask** | `place_order`, `send_money`, `file_government`, `contact_doctor`, `share_health_data`, `emergency_contact` | Pre-action confirm regardless of risk. |

This list lives in code, not policy — so a new Chitti can't accidentally bypass it.

#### 1.2 Incident reporting

Every page carries a `📣 Report a problem` button (built into [../feedback-widget.js](../feedback-widget.js)). The handler calls `lib.chitti_quality.report_incident(...)` which:

1. Logs structured JSON to stdout (always works).
2. Best-effort emails [bryanwilfredpinto@gmail.com](mailto:bryanwilfredpinto@gmail.com) within ~1h via the same SMTP transport the daily report uses.
3. Adds an entry to chitti-founder's in-process feedback ring (`/admin/founder/json`).

If SMTP env vars aren't set, the helper still returns a stable response — Sire enables transport later without redeploying anything else.

#### 1.3 Carbon tracking

`lib.chitti_quality.co2_for_response(input_tokens, output_tokens)` returns grams of CO₂ per response. The feedback widget surfaces it as `🌿 ~0.2g CO2 for this reply`. Each Chitti's backend should set `window.CHITTI_CO2_G` on the page just before the widget loads so the badge reflects the actual response, not the default.

Budget: **0.5g per response**. Anything above triggers escalation (PART 6).

#### 1.4 Risk levels (16 products)

Single source of truth in [../lib/chitti_quality.py](../lib/chitti_quality.py) `RISK_LEVELS`:

| Tier | Products |
|---|---|
| 🔴 **HIGH**   | chitti-medupi, chitti-upi, chitti-legal, chitti-ca, chitti-government |
| 🟡 **MEDIUM** | chitti-vaani, chitti-kirana, chitti-pharmacy, chitti-saloon, chitti-shares, chitti-technicals, chitti-fundamentals |
| 🟢 **LOW**    | chitti-news, chitti-scanner, chitti-voice-factory, chitti-tourism |

The badge is displayed on the page via the feedback widget's trust strip — `🛡️ HIGH / MEDIUM / LOW RISK`.

#### 1.5 Safeguards (UPI gating + distress)

`block_upi_for_vulnerable(age, segment)`:

- Under-18 → **block**.
- 75+ → **warn + require family co-sign**.
- Self-declared `blind` or `illiterate` → **warn + require per-session unlock** (env override `CHITTI_UPI_UNLOCK_SEGMENTS` for dev).

`scan_distress(text)`:

- Scans for 18+ distress keywords across English + 10 Indian languages.
- ≥2 hits → routes to the **Vaani family cascade**. **Never** to 112 / 100 / 102 — see `project_chitti_vaani_emergency_protocol`.

---

### Part 2 — Daily Quality Report (07:00 IST)

Sent by [../chitti-founder/backend/main.py](../chitti-founder/backend/main.py) cron, rendered by [../lib/founder_report.py](../lib/founder_report.py) `render_email_html`.

Horizontal table (one row per Chitti):

```
PRODUCT | RESPONSES | 👍 RATE | 👎 RATE | TOP ISSUE | TREND | STATUS | ACTION
```

- **Status** symbols: 🟢 >90% · 🟡 80–90% · 🔴 <80%
- **Trend** vs yesterday: ▲ (improved >1pp) · ▼ (declined >1pp) · ▬ (flat)
- **Action** column is auto-generated:
  - 🟢 → "Keep shipping"
  - 🟡 → "Read top complaints; ship patch this week"
  - 🔴 → "URGENT: triage today; SMS escalation if <70%"

Bottom panels in 3 columns:
- 🔴 **Critical** (<80%) — list of Chitti slugs
- 🟡 **Warning** (80–90%) — list of Chitti slugs
- 🟢 **Healthy** (>90%) — list of Chitti slugs

Plus a **YOUR TASKS TODAY** numbered list, hand-picked from today's signals (critical Chitti, hallucination >5%, top defect cluster).

---

### Part 3 — Defect Rate Report (in the same daily email)

Sub-table immediately below Part 2:

```
DEFECT TYPE | COUNT | % | AFFECTED PRODUCTS | ROOT CAUSE | FIX EFFORT
```

- Status by share: 🔴 ≥10% · 🟡 5–10% · 🟢 <5%
- Effort: **S** (1 day) · **M** (1 week) · **L** (1 sprint)
- **Top 3 defect clusters** rendered as a numbered list with fix ETAs.

The classifier `lib.chitti_quality.classify_defect(text)` recognises eight types: `translation`, `hallucination`, `voice`, `accessibility`, `ux`, `performance`, `price`, `emergency` (red-flag — should never fire), plus `other`.

---

### Part 4 — Feedback widget on every response

Lives in [../feedback-widget.js](../feedback-widget.js). On every Chitti page:

```
🔊 Speaker    🎙️ Chitti    👍 Helpful    👎 Not OK
```

**👎 flow (voice-first; PWD-user contract):**

1. Chitti speaks in the user's selected language:
   > "I'm sorry. What was wrong? Please tell me in your language."
2. Mic opens automatically (`webkitSpeechRecognition`).
3. User speaks. Transcript saved to the backend along with the down-vote.
4. Chitti speaks:
   > "Thank you. I will learn from this."

If `SpeechRecognition` is unavailable, a single-line text box is shown so the user is never trapped. The down-vote itself is recorded immediately so the rate metric is honest even when the comment is empty.

The trust strip below the icons shows: `🛡️ RISK · 🌿 CO₂ · 📅 Last audit · 🇮🇳 Helped today` (PART 7).

---

### Part 5 — Weekly Trend Report (Sunday 08:00 IST)

`run_weekly_report()` in [../chitti-founder/backend/main.py](../chitti-founder/backend/main.py), rendered by `render_weekly_html` in [../lib/chitti_quality.py](../lib/chitti_quality.py). Pulls from a 14-day in-process ring buffer of thumbs-up % per Chitti.

Columns:

```
CHITTI | RESPONSES (7d) | 👍 AVG | Δ vs prev week | TOP LANG | TOP SEGMENT | PEAK HR | HEADLINE
```

Headlines auto-attach:
- *Most-improved candidate* — biggest positive Δ
- *Urgent — investigate this week* — biggest negative Δ
- *Below 70% bar* — when an absolute floor is breached

`top_lang`, `top_segment`, `peak_hour_ist` come from each Chitti's `/admin/founder/slice` payload (renders "—" until that field is added to a Chitti's slice).

---

### Part 6 — Escalation

`run_escalator()` runs **hourly at :15 IST**. Three rules:

1. **Repeat defect** — same `DEFECT_TYPE` seen 3 days in a row → opens a GitHub issue tagged `chitti-quality,auto,<type>`. Streak counter resets when the type misses a day.
2. **Critical thumbs-up** — any Chitti with `thumbs_up_pct < 70` → **SMS Sire** via `CHITTI_SMS_URL` / `CHITTI_SMS_KEY` / `CHITTI_SIRE_PHONE` env vars. Not just email — SMS, because <70% is "fix today".
3. **Carbon over budget** — `co2_g_per_response > 0.5g` → GitHub issue tagged `chitti-quality,auto,carbon,perf`. Encourages DeepSeek prompt optimisation.

All three helpers in `lib.chitti_quality` log what they WOULD have done when env vars are missing, so the cron stays green even on first deploy.

---

### Part 7 — User trust signals on every page

The feedback widget renders four chips below the icons:

| Chip | Source |
|---|---|
| `🛡️ HIGH/MEDIUM/LOW RISK` | `RISK_LEVELS` in lib/chitti_quality.py |
| `🌿 ~Xg CO₂ for this reply` | `window.CHITTI_CO2_G` (per response) or default 0.2g |
| `📅 Last audit: YYYY-MM-DD` | `window.CHITTI_LAST_AUDIT` (per page) |
| `🇮🇳 N helped today` | `window.CHITTI_HELPED_TODAY` (per page) |

Each Chitti's page sets these globals just before loading the widget. The widget never invents a number — if the global is missing, the chip shows `—`.

---

### Part 8 — Chitti Quality learns (monthly)

End of each month:

1. Chitti Quality reads every 👎 comment from the last 30 days (`quality_feedback.thumbs == 'down'`).
2. Aggregates via `aggregate_defects` into typed clusters.
3. Picks the **top 3 patterns**.
4. **Proposes fixes** as a draft section appended to [../SAHAYAI_MASTER.md](../SAHAYAI_MASTER.md) under a new "Chitti Quality findings — <month>" subsection.
5. **Sire approves** → fixes go into the next sprint.

Currently triggered manually (`POST /admin/founder/escalate` with `Authorization: Bearer <ADMIN_SECRET>` runs the daily-style pass — header only, never `?secret=` in the URL; the monthly pattern-extract is a planned cron once 90 days of data exist). Until then, the weekly trend headlines surface the same signals at a higher cadence.

---

### Part 9 — Four orchestrated agents (2026-06-13)

Chitti Quality runs four named agents on a schedule. They are **orchestration over the rails that already exist** — the CTO 10-gate check ([../chitti-founder/backend/lib/cto_verifier.py](../chitti-founder/backend/lib/cto_verifier.py)), the Railway `/health` sweep, and the GitHub-issue escalator ([../lib/chitti_quality.py](../lib/chitti_quality.py)). **No new service, database, scheduler, or deploy target was added.** All four report into the **07:00 IST founder email** (folded into `render_email_html`'s output) and onto the **public [../chitti_quality.html](../chitti_quality.html)** page.

| Agent | Cadence | What it does | Reuses |
|---|---|---|---|
| 🚂 **DevOps** | 06:00 IST daily | Checks every Railway service; redeploys crashed ones (Railway GraphQL when `RAILWAY_API_TOKEN`+`RAILWAY_SERVICE_IDS` are set, honest no-op otherwise); reports online/down. | `cto_verifier.check_backend`, `RAILWAY_HEALTH_URLS` |
| 🧪 **QA** | after DevOps confirms ≥1 service online | Runs the 10-gate "How To Use" test on **every product page**; reports PASS / PARTIAL / FAIL; failed gates become bugs. | `cto_verifier.verify_url`, `FRONTEND_PAGES_TO_WATCH` |
| 🛠️ **Developer** | when QA finds bugs | Clusters bugs by failing gate, proposes a fix + effort (S/M/L) per cluster, files one GitHub ticket per cluster. **Triages only — never claims code it didn't write.** | `chitti_quality.open_github_issue` |
| 🎨 **UI** | Sundays 06:30 IST | Audits every page against [../sahayai_design_system.css](../sahayai_design_system.css): hard-fails on a missing stylesheet, flags off-palette colour as drift (amber). | `cto_verifier._fetch`, locked `:root` palette |

Orchestration: DevOps → (online?) → QA → (bugs?) → Developer runs as one 06:00 chain (`run_agents_morning_job`); UI is a separate Sunday cron (`run_ui_agent_job`). Vaani is pinged **only on RED** (service down / QA fail / page missing the design system), consistent with the CTO-hourly rail. On-demand: `POST /admin/founder/agents/run` (`{"which":"all"|"morning"|"ui"}`, header auth). Public read: `GET /api/quality/agents` (unauthenticated, same posture as the Vaani notification rail). Honest empty state until the first 06:00 pass — never a fake "all green".

---

## Where this lives in the code

| Concern | File |
|---|---|
| Risk levels, agentic rules, safeguards, carbon, incident, defects, weekly, escalator | [../lib/chitti_quality.py](../lib/chitti_quality.py) |
| Four orchestrated agents (DevOps / QA / Developer / UI) | [../chitti-founder/backend/lib/quality_agents.py](../chitti-founder/backend/lib/quality_agents.py) |
| 10-gate "How To Use" check + Railway health | [../chitti-founder/backend/lib/cto_verifier.py](../chitti-founder/backend/lib/cto_verifier.py) |
| Daily email renderer (+ agents section) | [../lib/founder_report.py](../lib/founder_report.py) `render_email_html` |
| Daily + weekly + escalator + agents crons | [../chitti-founder/backend/main.py](../chitti-founder/backend/main.py) |
| 4-icon feedback widget + trust strip | [../feedback-widget.js](../feedback-widget.js) |
| Public trust page | [../chitti_quality.html](../chitti_quality.html) |
| Thumbs storage + blueprint per Chitti | [../lib/feedback.py](../lib/feedback.py) |

Every change to the framework starts here. If a Chitti's backend forgets to register the feedback blueprint, the public widget still records via the chitti-founder shim — but the per-Chitti `quality_feedback` table will be empty, which the daily email surfaces as "no slice data".

## Accountability summary

Chitti Quality reports **directly to the Founder** ([bryanwilfredpinto@gmail.com](mailto:bryanwilfredpinto@gmail.com)). No Chitti ships without Chitti Quality approval — meaning: a new Chitti page is not added to [`../index.html`](../index.html), and a new Chitti is not added to [`../MASTER_CONTEXT.md §2`](../MASTER_CONTEXT.md), until Chitti Quality has run a full [CHECKLIST.md](CHECKLIST.md) pass and recorded green or amber (never red) status.

Full detailed accountability matrix lives in [ACCOUNTABILITY.md](ACCOUNTABILITY.md).

---

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
