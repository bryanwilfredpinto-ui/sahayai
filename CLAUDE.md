# STOP. Read `SAHAYAI_MASTER.md` before doing ANYTHING.

This is the **new-session rule — MANDATORY (LOCKED 2026-05-13, EXTENDED 2026-05-14)**.

## MANDATORY FIRST STEP — every new Claude Code session

> 1. **Read [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md)**
> 2. **Read [`QUALITY_STATUS.md`](QUALITY_STATUS.md)** — covers BOTH the backend matrix (§1, six axes) AND the frontend quality gates (§1a — feedback-widget.js + `data-chitti-response`, chitti_a11y.js, User Disability Profile prompt, language auto-detect, ISL plugin). Per SAHAYAI_MASTER.md §7, no page ships without all five frontend gates.
> 3. **Also read [`CHITTI_SOP.md`](CHITTI_SOP.md) before doing anything** — the 7-field standard operating profile (Objective · Primary user · Success metric · Quality standard · Scope · Evolution owner · Stale data rule) for all 15 Chittis. Apply per-Chitti when you touch that Chitti's code or docs.
> 4. **Report to Bryan, before anything else:**
>    - **What is RED** — both BACKEND (substrate missing or never invoked) AND FRONTEND (any of the five §1a gates failing or unverified on any Chitti page)
>    - **What is YELLOW** (wired but unverified in production)
>    - **What needs fixing TODAY** (the next concrete call-site, deploy, or frontend page audit)
>
> Only after this report may you take any other action.

Until both files are read and the report is delivered:

- ❌ **No code changes allowed.**
- ❌ **No new features allowed.**
- ❌ **No deployments allowed.**

`SAHAYAI_MASTER.md` is the single source of truth for:

- Vision · locked decisions · process / build rules
- 12 built Chittis + planned next wave (§4, §5)
- Quality standards (§6) · accessibility contract (§7)
- Agent priority order — what to work on next (§8)

The locked decisions in §2 — LLM provider (DeepSeek only), voice
substrate (Voice Factory), emergency protocol (family cascade, never
cops), four-user accessibility, ISL, per-response widget, camera
intelligence, knowledge-corpus expert grades — **must not be
relitigated**. Read them first. Then proceed.

See `SAHAYAI_MASTER.md` §2c for the full contract.
