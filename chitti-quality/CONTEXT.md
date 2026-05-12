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
