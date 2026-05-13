# SAHAYAI MASTER

**Read this first on every new Claude session.** Single source of truth for what sahayai.in is, what has been decided, what is built, and what to work on next. Last updated: **2026-05-13**.

Cross-references throughout point to auto-memory entries under `~/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/` and to spec files at this repo's root.

---

## 1. Vision

**sahayai.in is Bharat Premium AI — a family of free, voice-first products for every Indian family.**

- Built for Tier-2/3 cities, elderly parents, vernacular speakers, and the four user archetypes: **Blind / Deaf / Mute / Illiterate**.
- No paywalls. No sign-up. Hindi-first. Voice IN + Voice OUT. Plain English when written.
- Stacked on free tiers: GitHub Pages (frontend), Render (backend), Turso (DB), DeepSeek (LLM), Bhashini (voice, pending ULCA creds).
- Founder: **Bryan Wilfred Pinto**.

**End state: a Bharat SuperApp** — voice-first money, health, govt-schemes, jobs, shopkeeper tools, all in the user's language. The 12 products live today are the first wave.

---

## 2. Locked decisions — do NOT relitigate

| Decision | Value | Memory |
|---|---|---|
| LLM provider | **DeepSeek only** (`api.deepseek.com`, OpenAI-compatible). Anthropic fully removed from every backend. | `project_ai_provider_switch_to_deepseek` |
| Database | **Turso libSQL**, one DB per Chitti (8 total incl. medupi). Embedded-replica pattern (`libsql-experimental` + local SQLite file + bg sync), **NOT direct Hrana** — `sqlalchemy-libsql` can't speak PRAGMA / isolation_level / has_table. | `project_db_migration_to_turso`, `project_turso_embedded_replica_pattern`, `project_turso_db_inventory` |
| Voice substrate | **Chitti Voice Factory** — 26 langs (12 primary + 14 cousin incl. Sanskrit & Oraon). 4-supplier cascade. `mock_bhashini` active until ULCA creds. Tier C **never silently falls back**. | `project_voice_factory_complete`, `project_chitti_voice_factory_spec` |
| Data sources | **screener.in** fundamentals · **Angel** prices · **RSS** news. **Yahoo BLOCKED from Render** — `yahoo_client` kept as local-dev fallback only. | `project_data_sources` |
| Emergency protocol (Vaani) | **Family cascade, NEVER cops.** Confirm-with-master → ring alarm bypassing silent → spouse → family → Chitti-to-Chitti relay. **NEVER auto-dial 112 / 100 / 102.** Always-on keyword spotting on any Chitti-mediated audio. | `project_chitti_vaani_emergency_protocol` |
| Legal disclaimer | **Sticky `NOT SEBI REGISTERED` bar + full legal modal** on every Chitti page. **Never move to footer.** | `project_legal_disclaimer` |
| Accessibility contract | **Four users — Blind / Deaf / Mute / Illiterate.** Voice IN + Voice OUT + symbols + plain English. **Never colour-only.** | `project_four_user_contract` |
| Shared a11y substrate | **`chitti_a11y.js` at repo root.** Injects language selector, Voice Required marker, Braille mode toggle, aria-live region. Bhashini swappable at one URL (`window.Chitti.a11y.VOICE_FACTORY_URL`). | `project_chitti_a11y_substrate` |
| Agent vision | **Chitti is a full device control agent.** Copy architecture from Google Assistant, Microsoft Copilot, Apple Siri. Skeleton-first with `COMING SOON` markers; Chitti fills in via `skills/*.md`. **No reinvention — copy the best.** | `project_agent_vision_locked` |
| Voice strategy | **Bhashini is TEMPORARY.** Users donate their voice to Chitti; community voices replace Bhashini over time. Hall of Fame for voice contributors. Architecture must support **swapping voice provider at any time**. | `project_voice_strategy_locked` |
| New products process | **Before building ANY new Chitti product:** (1) research top 3 apps in that category, (2) copy their full feature surface as skeleton, (3) mark unbuilt features as `COMING SOON`, (4) power with DeepSeek + community voices, (5) define capabilities in `skills/*.md`. | `project_new_products_process_locked` |

---

## 2a. Locked decisions — agent vision, voice strategy, new-product process (2026-05-13)

### Agent vision — LOCKED, NEVER REVISIT

Chitti is a **full device control agent**, not a chatbot. Architecture is copied from the proven incumbents — **Google Assistant, Microsoft Copilot, Apple Siri** — not invented from scratch.

- **Skeleton-first with `COMING SOON` markers.** Every product page ships the *full feature surface* of its category on day one. Unbuilt features carry a visible `COMING SOON` badge; they are not hidden.
- **Chitti fills in via `skills/*.md`.** Capabilities are declared as skill files, not hardcoded UI. Adding a capability is a markdown commit, not a frontend rewrite.
- **No reinvention.** If Google/Microsoft/Apple already solved a UX problem (wake word, permission grant, undo window, voice-first onboarding), copy it. See [[feedback_skeleton_first_pass]] — skeletons must be exhaustive on commit #1.

### Voice strategy — LOCKED

Bhashini is the **temporary** voice substrate. The long-term substrate is **community-donated voices**.

- **Users donate their voice to Chitti.** Read-aloud passages on every language page; donated samples train per-language community voices.
- **Hall of Fame for voice contributors.** Surface contributor names on `chitti_voice_hall_of_fame.html` so donating is socially rewarded, not extracted.
- **Architecture must support swapping the voice provider at any time.** Voice Factory's 4-supplier cascade and the single `window.Chitti.a11y.VOICE_FACTORY_URL` hook are the contract. No code path may hard-code Bhashini. See [[project_voice_factory_complete]], [[project_chitti_voice_factory_spec]].

### New-products process — LOCKED

Before building **any** new Chitti product:

1. **Research top 3 apps** in that category (Indian-market and global).
2. **Copy their full feature surface as skeleton** — every tab, every card, every CTA from day one.
3. **Mark unbuilt features as `COMING SOON`** — visible to the user, not silently omitted.
4. **Power with DeepSeek + community voices** — never another LLM, never Bhashini-as-permanent.
5. **Define capabilities in `skills/*.md`** — capability surface lives in markdown, not in code.

Examples already queued under this contract:
- **Chitti Mechanic** — OBD2 diagnostics; reference apps to copy: Torque Pro, Car Scanner, FIXD.
- **Chitti News AI** — deeper AI-augmented news on top of `chitti-news`; reference: Inshorts, Ground News, Artifact (RIP).
- Any future Chitti follows the same five steps. See [[feedback_skeleton_first_pass]], [[project_chitti_product_scope_clarifications]].

---

## 3. Process / build rules

1. **Skeleton-first must be exhaustive.** When Bryan says *"skeleton"* or *"shamelessly copy"*, audit every reference app and ship the **FULL feature surface in commit #1**. Iterating to comprehensive over four turns wastes his time. (`feedback_skeleton_first_pass`)
2. **Verify on live before handover.** Never claim "live" without curl-ing the production endpoint first. Bryan should never be the one to find it broken. (`feedback_verify_before_handover`)
3. **Design from PWD-user perspective.** Generic SaaS safety patterns (per-send modals, OAuth toggle screens) **break** blind/mute/illiterate users. Default to **onboarding-grants + readback + undo**, NOT pre-action confirmations. Chitti is *"a guardian, a commando, a coach"* — not a polite assistant. (`feedback_design_from_pwd_user_perspective`)
4. **Honest stubs over fake demos.** When an API key or feature isn't ready, ship an **honest stub** (chitti-logo-video = SVG monogram + queued mock video). Never pretend.
5. **Never silently fall back across tiers.** Voice Factory Tier C must surface *"not supported in this language"* — never silently morph Tulu from Kannada.
6. **Verify product scope before assuming.** chitti-upi = fraud classifier (not payment intent). chitti-vaani-android = 4 code-level hard refusals (not policy). chitti-logo-video = intentional stub. (`project_chitti_product_scope_clarifications`)

---

## 4. What's built — 12 live products

| # | Product | Frontend | Backend | Status |
|---|---|---|---|---|
| 1 | Chitti Technical | `chitti_complete_technical.html` | `chitti-shares-api` | LIVE — NSE/BSE candles + 43 indicators, Roshan composite, Story Mode |
| 2 | Chitti Fundamentals | `chitti_fundamentals.html` | screener.in scraper | LIVE — Buffett/Munger/Graham/Kedia/RKD, 25+ filters, Nifty 500 |
| 3 | Chitti MedUPI | `chitti_medupi.html` | `chitti-medupi-api` | LIVE — Jan Aushadhi same-composition match, NPPA prices, Family Wallet |
| 4 | Chitti News | `chitti_news.html` | `chitti-news-api` | LIVE — 26+ RSS, 5 langs, Chitti's Take, fact-check verdicts |
| 5 | Chitti Vaani | `chitti_vaani.html` | `chitti-vaani-api` | LIVE — 9 langs, voice-first, emergency cascade |
| 6 | Chitti UPI Fraud Guard | `chitti_upi.html` | fraud classifier | LIVE — HIGH/MED/LOW grading, RBI 2026 rule cards |
| 7 | Chitti Product Scanner | `chitti_scanner.html` | DeepSeek vision | LIVE — FSSAI, MedUPI deep-link |
| 8 | Chitti CA | `chitti_ca.html` | `chitti-ca-api` | LIVE — ITR/GST/TDS, DeepSeek + server-enforced disclaimer |
| 9 | Chitti Legal | `chitti_legal.html` | `chitti-legal-api` | LIVE — notices/NDAs/rent agreements, plain EN/HI |
| 10 | Chitti Logo & Video | `chitti_logo_video.html` | stub | **BETA** — SVG monogram + mock video queue (intentional honest stub) |
| 11 | Chitti Government | `chitti_government.html` | `chitti-government-api` | LIVE — 30 schemes, PIB poll 6h, DigiLocker partner-only |
| 12 | Chitti Voice Factory | `chitti_voice_factory.html` | `chitti-voice-factory` | LIVE — 26 langs, honest ledger, YouTube fluency pipeline |

**Specs** at repo root: `CHITTI_TECHNICAL_MASTER_SPEC.md`, `CHITTI_MEDUPI_MASTER_SPEC.md`, `CHITTI_NEWS_MASTER_SPEC.md`, `CHITTI_VOICE_FACTORY_MASTER_SPEC.md`, `CHITTI_GOVERNMENT_MASTER_SPEC.md`.

---

## 4a. Frontend ↔ folder map (root HTML files)

**Every `chitti_*.html` at the repo root MUST stay at the root** — GitHub Pages serves from `/`. Do not move them into their product folder. Each file carries an `<!-- Frontend for <folder>/ -->` comment on line 2 so the binding is visible without leaving the file.

### Product pages

| Root HTML | Folder it drives |
|---|---|
| `chitti_news.html` | `chitti-news/` |
| `chitti_medupi.html` | `chitti-medupi/` |
| `chitti_vaani.html` | `chitti-vaani/` |
| `chitti_government.html` | `chitti-government/` |
| `chitti_upi.html` | `chitti-upi/` |
| `chitti_scanner.html` | `chitti-scanner/` |
| `chitti_ca.html` | `chitti-ca/` |
| `chitti_legal.html` | `chitti-legal/` |
| `chitti_logo_video.html` | `chitti-logo-video/` |
| `chitti_voice_factory.html` | `chitti-voice-factory/` |
| `chitti_quality.html` | `chitti-quality/` |
| `chitti_fundamentals.html` | `chitti-shares/` (backend: `chitti-shares-api`) |
| `chitti_complete_technical.html` | `chitti-shares/` (backend: `chitti-shares-api`) |
| `chitti_voice_hall_of_fame.html` | `chitti-voice-factory/` |

### Voice Factory language pages → `chitti-voice-factory/frontend/`

Root copies of the 26 language pages are mirrors of the canonical files in `chitti-voice-factory/frontend/`. Edit the mirror in the folder; the root copy is what GitHub Pages serves.

```
chitti_hi  chitti_bn  chitti_te  chitti_ta  chitti_kn  chitti_ml  chitti_mr  chitti_gu
chitti_or  chitti_as  chitti_pa  chitti_ur  chitti_bho chitti_hne chitti_mai chitti_kok
chitti_doi chitti_sd  chitti_ks  chitti_mni chitti_brx chitti_sat chitti_sa  chitti_tcy
chitti_kfa chitti_kru
```

### Standalone — no backing folder

| Root HTML | Purpose |
|---|---|
| `chitti_complete.html` | Sahay AI landing / demo flow (no dedicated backend folder) |
| `chitti_claude_complete.html` | Alternate landing variant (no dedicated backend folder) |
| `chitti_admin_products.html` | Internal admin tool — product catalog editor |
| `chitti_admin_feedback.html` | Internal admin tool — feedback inbox |

---

## 5. What's planned — next wave

From the homepage Vision card:

- 💰 **Money Help** — bills, savings, loans, UDHAR ledger
- 🏥 **Health** — reminders, doctor finder, ABDM-ready
- 💼 **Jobs** — hyperlocal opportunities, skill match
- 🛒 **Inventory** — voice stock control for shopkeepers
- 📲 **WhatsApp Orders** — sell instantly via WhatsApp Business

**Stubs that don't exist yet** (per `project_render_deploy_status_2026_05_10`): Kirana, Pharmacy, Salon, LangHub.

**Voice Factory Phase 2** (blocked on Sire's Bhashini ULCA registration): swap `mock_bhashini` for real Bhashini supplier across 26 langs.

---

## 6. Quality standards

**Chitti Quality v2 (2026-05-13)** — full 8-part operating contract in [chitti-quality/CONTEXT.md](chitti-quality/CONTEXT.md). Lives in code: [lib/chitti_quality.py](lib/chitti_quality.py), [lib/founder_report.py](lib/founder_report.py), [feedback-widget.js](feedback-widget.js), [chitti_quality.html](chitti_quality.html), [chitti-founder/backend/main.py](chitti-founder/backend/main.py).

| Part | What | Where |
|---|---|---|
| 1 | Risk levels (16 products · HIGH/MEDIUM/LOW), agentic rules, incident reporter, carbon tracker, UPI safeguards | `lib/chitti_quality.py` |
| 2 | Daily quality report (07:00 IST) — horizontal table with trend ▲▼▬ + Critical/Warning/Healthy panels + TASKS TODAY | `lib/founder_report.render_email_html` |
| 3 | Defect rate sub-table — type / count / % / affected products / root cause / fix effort | same email, same module |
| 4 | Feedback widget — 4-icon row 🔊 / 🎙️ / 👍 / 👎; 👎 = voice-first apology → listen → "I will learn from this" | `feedback-widget.js` |
| 5 | Weekly trend report (Sunday 08:00 IST) — most-improved / urgent, top lang, top segment, peak hour | `lib/chitti_quality.render_weekly_html` |
| 6 | Escalation — 3-day repeating defect → GitHub issue; <70% 👍 → SMS Sire; >0.5g CO₂ → carbon issue | `lib/chitti_quality.escalate_*` |
| 7 | Trust signals on every page — risk badge, CO₂/reply, last audit, helped today | `feedback-widget.js` trust strip |
| 8 | Monthly learning — top 3 👎 patterns proposed to this file; Sire approves → next sprint | manual today, cron once 90 days of data exist |

Crons (Asia/Kolkata) live in `chitti-founder/backend/main.py`:
- **DAILY 07:00** · daily quality + defect-rate email
- **WEEKLY Sun 08:00** · trend digest
- **HOURLY :15** · escalator pass

Cross-cutting quality rules (unchanged):

- **DeepSeek answers carry server-enforced disclaimers** (CA / Legal especially — never client-controlled).
- **Voice Factory honest ledger** — every supplier call logged with success/fail. No silent fallbacks.
- **News fact-checker** cross-references ≥2 RSS sources before issuing verdicts (verified / partial / disputed / unverified).
- **MedUPI same-composition match is strict** — same molecule + same strength + same form, never approximate.
- **Sub-agents (Chitti News) have hard guardrails** — politics agent is opinion-free, equal coverage, factual only.

---

## 7. Accessibility requirements — non-negotiable

### The four-user contract — every Chitti page

| User | Requirement |
|---|---|
| **Blind** | Every action speaks. `🔊 Read page` button on every page for full audio narration. |
| **Deaf** | Captions on every result. **Symbols + word labels** (✅ / ⚠️ / ❔). **Never colour alone.** |
| **Mute** | Every input is a button or dropdown. **Voice input is optional, never required.** |
| **Illiterate** | Emoji glyphs, plain-English captions, Hindi UI toggle, voice-out for everything. |

### Shared substrate — `chitti_a11y.js` must load on every page

1. **Language selector** wired to Voice Factory (Bhashini today, pluggable via `VOICE_FACTORY_URL`).
2. **Voice Required** prominent marker for voice-contract pages (Vaani, MedUPI scan, Shares scanner, Sales coach).
3. **Braille-friendly mode toggle** — strips emojis from spoken text, single column, raised font, aria-live=polite for refreshable braille displays (BrailleBack on Android).
4. **Speak helper** — defers to `chitti.speak` if present, else SpeechSynthesis in selected language.

### Feedback widget — `feedback-widget.js` must load on every page

- **👍 / 👎** footer for every Chitti response.
- **👎 triggers free-text suggestion modal.** Asks `user_segment` once (sticky per-device via localStorage).
- POSTs to `/api/feedback/collect` (override base via `window.CHITTI_FEEDBACK_API`).

### Vaani-specific — always-on, voice-mediated

- **Keyword spotting** for emergencies (any Chitti-mediated audio, day or night).
- **Cascade:** confirm-with-master → ring alarm bypassing silent → spouse → family → Chitti-to-Chitti relay.
- **NEVER auto-dial 112 / 100 / 102.**

### Legal disclaimer — every Chitti page

- **Sticky `NOT SEBI REGISTERED` bar** at top + **full legal modal** behind it.
- Never demoted to footer.

---

## 8. Agent priority order — what to work on next

**Anchored to the 2026-05-12 homepage audit:** sahayai.in's `index.html` loads **zero scripts**. The four-user contract is broken at the front door.

### P0 — Fix the homepage (this session's audit findings)

1. **Wire `chitti_a11y.js` into `index.html`.** Restores the working language selector (Kannada actually shifts UI), Voice Required marker, Braille mode, and the `🔊 Read page` button on every section.
2. **Wire `feedback-widget.js` into `index.html`.** Restores 👍/👎 plus the 👎 → suggestion modal.
3. **Build the "Explain simply" button.** No substrate exists yet — needs a new helper that re-prompts DeepSeek with a plain-English-for-class-5 system prompt and reads the result aloud. Required on every product card AND every Chitti response.
4. **Audit the other 12 product pages** for the same four gaps. The substrate scripts are loaded on 13 pages already, but verify the language selector actually shifts UI on each, and `Explain simply` is added uniformly.

### P1 — Unblock Voice Factory Phase 2

5. **Embed-pass on Voice Factory fluency pipeline** — needs Render py3.11 to finish the 79,414-chunk corpus across 26 langs (`project_voice_factory_fluency_pipeline`).
6. **Bhashini ULCA registration** by Sire — unblocks swap from `mock_bhashini` to real supplier.

### P2 — Infrastructure cleanup

7. **Per-product Turso cutover verification.** Neon/Supabase stay live until each per-Chitti cutover is verified end-to-end.
8. **Wire the 8 backends that have `render.yaml` but aren't connected** (`project_render_deploy_status_2026_05_10`).

### P3 — Next-wave products

9. Money Help → Health → Jobs → Inventory → WhatsApp Orders (in that order — Money Help most-requested per current backlog).

### Sub-agent routing inside Chitti News

When a news query lands, route in this order:

```
politics → business → tech → entertainment → sports → factcheck (post-hoc) → summarizer (post-hoc)
```

`factcheck` and `summarizer` run *after* the topical agent fetches the article — they are post-processors, not first responders.

---

## 9. Where to find more

- **`MEMORY.md`** at `~/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/` — index of all auto-memory notes, loaded into every Claude session.
- **Spec files at repo root:** `CHITTI_TECHNICAL_MASTER_SPEC.md`, `CHITTI_MEDUPI_MASTER_SPEC.md`, `CHITTI_NEWS_MASTER_SPEC.md`, `CHITTI_VOICE_FACTORY_MASTER_SPEC.md`, `CHITTI_GOVERNMENT_MASTER_SPEC.md`.
- **Skills:** `chitti-news/skills/`, `chitti-vaani/skills/`, `chitti-medupi/skills/`, etc.
- **Live backends:** see footer of `index.html` for `/health` endpoints — curl before claiming "live".
- **Founder contact:** bryanderrylpinto@gmail.com.

---

*This file is the entry point for every new Claude session. If a decision changes, update this file first, then the relevant memory note. If a decision is missing here but appears in chat, ask whether to lock it in.*
