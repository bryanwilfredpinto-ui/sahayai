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
| ISL support | **Indian Sign Language is a first-class accessibility surface — not ASL.** Phase 1: ISL dictionary + animation next to every Chitti response + tap-word-to-sign. Phase 2: camera-based ISL detection (COMING SOON). Phase 3: community-contributed ISL videos + Hall of Fame (COMING SOON). For 6 crore deaf Indians ignored by every app. | `project_chitti_isl_spec` |
| Per-response widget | **Every response box on every page carries 4 icons: 🔊 speaker · 🤖 Chitti (explain further) · 👍 / 👎 thumbs · per-box feedback window** (voice or type, tagged to box ID, into Founder dashboard daily). Implementation: [feedback-widget.js](feedback-widget.js). **No page ships without this.** See §7. | `project_per_response_widget_locked` |
| Camera intelligence | **Every Chitti with camera access captures: what was scanned · location (pincode/district) · date/time · result · user type · user satisfaction.** Fake-product detections feed community alerts, an annual report to FSSAI/government, and real-time warnings to nearby users. All camera data is **user-owned, never sold, anonymised before analysis, "Chitti forget" deletes all**. See §2b. | `project_camera_intelligence_locked` |
| Knowledge corpora locked (2026-05-13) | **CA / Legal / Psychology** ship at expert grade. [chitti-ca/skills/CA_KNOWLEDGE.md](chitti-ca/skills/CA_KNOWLEDGE.md) = **CA Final + PhD** (IT Act, GST, Companies Act, AS/Ind AS, Budget 2025, portal navigation, tax jurisprudence, treaty interpretation). [chitti-legal/skills/LEGAL_KNOWLEDGE.md](chitti-legal/skills/LEGAL_KNOWLEDGE.md) = **LL.M + PhD** (full Constitution, BNS/BNSS/BSA 2023, civil + criminal, family law all religions, RERA, CPA 2019, DPDP 2023, state-specific, POSH/DV, landmark SC). [chitti-vaani/skills/PSYCHOLOGY.md](chitti-vaani/skills/PSYCHOLOGY.md) = **basics → PhD** (Freud/Jung/Maslow/Rogers/Bandura/Skinner/Pavlov/Beck/Ellis, Goleman/Ekman/Gottman/Seligman, Patanjali/Ayurveda/Gita/Buddhist/joint-family, MI/trauma/crisis/financial-stress/rural/women/elder, Kahneman/Thaler/Ariely, neuropsych/cross-cultural/community/health). All three: confidence scoring, devil's-advocate, server-enforced disclaimer (CA + Legal), strict therapist-boundary (Vaani with helpline cascade incl. Tele-MANAS 14416 + iCall + Vandrevala + NIMHANS). | — |
| **New-session rule** | **Every Claude Code session MUST begin with `READ SAHAYAI_MASTER.md`.** Non-negotiable. Without it: no code changes, no new features, no deployments. Auto-enforced via repo-root [`CLAUDE.md`](CLAUDE.md) + [`.claude/CLAUDE.md`](.claude/CLAUDE.md) — both files auto-load on session start; no human instruction needed. See §2c. | `project_new_session_rule_locked` |
| **Feature Discovery Box** | **Every Chitti page carries a `💡 What can Chitti do for you?` button** — floating CTA + a11y-bar mirror. Reads each Chitti's `skills/FEATURES.md` live (nothing hardcoded), groups by LIVE / PLANNED / FUTURE / ANDROID, speaks features aloud in the user's selected language, taps to activate/expand, and **auto-reads on first visit for blind users**. Substrate: [`chitti_features.js`](chitti_features.js); auto-loaded from [`chitti_a11y.js`](chitti_a11y.js) — every product inherits without per-page edits. See §2d. | `project_feature_discovery_box_locked` |
| **Business Continuity Plan** | **5-layer self-healing — platform self-runs 72 hours without human intervention.** Layer 1 self-ping every 4 min (chitti-founder hits every Chitti `/health`, emails Sire on non-200, logs to Turso). Layer 2 health checks all backends. Layer 3 quality score on every response (per-response widget §7). Layer 4 daily/weekly/hourly feedback monitoring (§6). Layer 5 LLM fallback chain **DeepSeek → Claude → Gemini**. See §2e. | `project_business_continuity_plan_locked` |
| **Hosting / deploy** | **Frontend on GitHub Pages, backends on Render free tier.** Every Chitti backend ships a `render.yaml` so the platform is reconstitutable from `main`. No vendor lock — we move providers only if the free tier disappears, never for vanity. | — |
| **Uptime mechanism** | **Self-ping from `chitti-founder` every 4 minutes — NOT UptimeRobot or any external monitor.** Self-ping doubles as a free Render keep-alive (which idles dynos after 15 min), logs to Turso, and emails Sire on non-200 (debounced 1 h per Chitti). External uptime services are explicitly out of scope: they would add a billed subscription, a third-party point of failure, and a data-egress surface for free. See §2e Layer 1. | `project_business_continuity_plan_locked` |
| **Per-product knowledge corpora** | **Every Chitti must publish a [`skills/FEATURES.md`](chitti-medupi/skills/FEATURES.md) (capability surface, parsed live by [chitti_features.js](chitti_features.js)).** Domain-expert Chittis additionally publish a `skills/<DOMAIN>_KNOWLEDGE.md` at the grade locked in row 12 above — currently [CA_KNOWLEDGE.md](chitti-ca/skills/CA_KNOWLEDGE.md), [LEGAL_KNOWLEDGE.md](chitti-legal/skills/LEGAL_KNOWLEDGE.md), [PSYCHOLOGY.md](chitti-vaani/skills/PSYCHOLOGY.md). Missing knowledge corpus = missing product on launch, same merge-blocker status as a missing FEATURES.md. | — |
| **Camera substrate** | **[`chitti_camera.js`](chitti_camera.js) at repo root, auto-loaded by [`chitti_a11y.js`](chitti_a11y.js).** Single capture path for every Chitti with camera access; honest queue when `/api/camera/capture` is unreachable; `Chitti.camera.forget()` writes the tombstone. Pages never hand-roll camera capture or storage. See §2b. | `project_camera_intelligence_locked` |

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
- ✅ **Chitti News AI** — SKELETON shipped 2026-05-14. Top-3 reference apps copied (Product Hunt, There's An AI For That, Hugging Face Daily Papers + Inshorts, Ground News, Artifact). 14 skill files, 17 RSS sources seeded, 10 endpoints (2 LIVE + 8 honest 501), frontend at [`chitti_news_ai.html`](chitti_news_ai.html). Spec: [`CHITTI_NEWS_AI_MASTER_SPEC.md`](CHITTI_NEWS_AI_MASTER_SPEC.md).
- Any future Chitti follows the same five steps. See [[feedback_skeleton_first_pass]], [[project_chitti_product_scope_clarifications]].

---

## 2b. Camera Intelligence Across All Chittis — LOCKED (2026-05-13)

Every Chitti that has camera access **must capture and store** for every scan:

- **What** was scanned
- **Location** (pincode / district)
- **Date and time**
- **Result** (fake / genuine / expired / safe)
- **User type** (per disability profile + role — e.g. consumer / shopkeeper / elderly)
- **User satisfaction** (the per-response 👍 / 👎 from `feedback-widget.js`)

### Fake-product detection feeds three flywheels

1. **Community alert system** — *"3 users near you found fake products this week."* Surfaced on the relevant product page, in the user's language, with the spotted brand/molecule blurred where defamation risk applies.
2. **Annual fake-product report to FSSAI / government** — anonymised, aggregated by district + category. One report per calendar year, published openly on `sahayai.in/reports/` and emailed to relevant regulators (FSSAI for food/meds, BIS for goods, NPPA for medicine pricing).
3. **Real-time warnings to nearby users** — when a fake is confirmed at pincode X, every Chitti user inside the active radius (§8 P0 #5–#9 geo work) gets a voice + text alert next time they open a relevant Chitti page.

### Camera use per Chitti

| Chitti | Camera captures |
|---|---|
| **MedUPI** | Medicine strips, prescriptions |
| **Scanner** | Packaged food, barcodes |
| **Kirana** | Invoices, stock, supplier bills |
| **Legal** | Documents, notices, contracts |
| **CA** | Bills, receipts, Form 16 |
| **Government** | Official documents, forms |
| **Vaani** | Text reading for blind users; ISL Phase 2 (camera-based ISL detection) |

Any new Chitti that adds a camera surface inherits this contract automatically — no exceptions, no opt-out.

### User-ownership contract

All camera data is:

- **Owned by the user** — stored against the per-device `user_token`, exportable on request.
- **Never sold** — no third-party access, no ad targeting, no monetisation surface.
- **Used to protect other users** — community alerts + annual report are the only outward flows, both anonymised.
- **Anonymised before analysis** — face crops blurred, user ID dropped, GPS rounded to pincode centroid before any cross-user aggregate.
- **`"Chitti forget"` deletes all** — voice or button command wipes every capture for that user_token, including the anonymised aggregate row (replaced with a tombstone so counts stay honest). Matches the existing forget-me semantics in Vaani.

### Implementation contract

- Single capture path lives in a shared substrate ([`chitti_camera.js`](chitti_camera.js) at repo root alongside [`chitti_a11y.js`](chitti_a11y.js), shipped 2026-05-14, auto-loaded by the a11y substrate same as Feature Discovery) — pages never hand-roll camera capture or storage.
- Captures POST to `/api/camera/capture` (one endpoint, all Chittis); routing by `product` field. Camera DB is per-Chitti (Turso, matches §2 one-DB-per-Chitti rule) with a thin cross-product index for the community-alert query.
- Honest empty state: if the model isn't confident enough to flag fake/genuine, the result field is `unclear` — never silently coerced to `safe`. Matches the [Honest stubs over fake demos](#3-process--build-rules) rule.
- New-products process applies: see each Chitti's `skills/FEATURES.md` for camera scope; surface unbuilt camera flows as `COMING SOON`, not silently omitted.

See [[project_camera_intelligence_locked]].

---

## 2c. New Session Rule — MANDATORY (2026-05-13)

**Every Claude Code session must begin with:**

> **`Read SAHAYAI_MASTER.md first`**

**This is non-negotiable.** Without reading `SAHAYAI_MASTER.md` first:

- ❌ **No code changes allowed.**
- ❌ **No new features allowed.**
- ❌ **No deployments allowed.**

The first command in every session is:

> **`READ SAHAYAI_MASTER.md`**

### Auto-enforcement

Two files at the repo root auto-load on every Claude Code session start, so no human instruction is needed:

| File | Auto-load mechanism |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Claude Code's standard project-memory location — loaded into the system prompt of every session in this repo. |
| [`.claude/CLAUDE.md`](.claude/CLAUDE.md) | Secondary copy alongside `.claude/settings.json` — mirrors the contract so it survives any tooling that reads the `.claude/` directory first. |

Both files carry the same instruction:

> **STOP. Read `SAHAYAI_MASTER.md` before doing ANYTHING.**

### Why this is locked

Without the master file loaded, every session re-litigates already-locked decisions (LLM provider, voice substrate, emergency protocol, four-user contract, ISL, per-response widget, camera intelligence, knowledge-corpus expert grades). That wastes Bryan's time and risks accidentally rolling back hard-won locks. The new-session rule short-circuits that failure mode — Claude reads the locked decisions before touching any code.

See [[project_new_session_rule_locked]].

---

## 2d. Feature Discovery Box — LOCKED (2026-05-14)

Every Chitti page must carry a **`💡 What can Chitti do for you?`** button. The button opens a modal that reads each Chitti's `skills/FEATURES.md` **live** and speaks every feature aloud in the user's selected language. **Nothing is hardcoded in JavaScript** — the FEATURES.md is the contract.

### Substrate

| File | Role |
|---|---|
| [chitti_features.js](chitti_features.js) | Parser + modal + voice + auto-read; self-contained IIFE under `window.Chitti.features`. |
| [chitti_a11y.js](chitti_a11y.js) | Auto-loads `chitti_features.js` on init — every Chitti page inherits without per-page HTML edits, same default-on contract as the [ISL plugin](#chitti-isl--plugin-locked). |

### Behaviour

1. **Floating CTA** bottom-right + **mirror button in the a11y bar** (next to language / braille / ISL / read-page). Either entry point opens the same modal.
2. **Source: `<folder>/skills/FEATURES.md`** — resolved via the §4a frontend ↔ folder map (`chitti_medupi.html` → `chitti-medupi/skills/FEATURES.md`, etc.). Pages with no auto-map can opt in with `<meta name="chitti-features" content="path/to/FEATURES.md">`.
3. **Parser** handles all three FEATURES.md shapes used today: H2 sections + H3 features (Vaani-style), H2 sections + markdown tables (MedUPI / Government), and H2 sections + top-level bullets. Housekeeping sections (`How to keep this file honest`, `Cross-product hooks`, `Updating this …`) are skipped automatically.
4. **Status badges** inferred from section title — LIVE 🟢 / PLANNED 🟡 / FUTURE 🔵 / ANDROID 📱.
5. **Tap any feature** → expand its body + speak the status + name + first body line aloud, in the user's selected language, via `Chitti.a11y.speak()` (Voice Factory cascade).
6. **`🔊 Read all features aloud`** button at the top of the modal walks through every feature.
7. **Auto-read on first visit for BLIND users** — when the User Disability Profile (§7) has `blind: true`, opening the modal once auto-fires the read-all flow. Tracked in `localStorage.chitti_features_v1.auto_read_done` so it only happens once per device.
8. **Honest empty state** — if the page has no FEATURES.md mapped (e.g. `chitti_complete_technical.html` while [chitti-shares/](chitti-shares/) hasn't shipped its FEATURES.md yet), the modal says so explicitly. **No fake feature list ever.** Matches the [Honest stubs over fake demos](#3-process--build-rules) rule.
9. **Homepage variant — "all 12 Chittis"** (added 2026-05-14). On `index.html`, `chitti_complete.html`, `chitti_claude_complete.html` the same CTA renames itself to **"Chitti se poochho — main kya kar sakta hoon?"** and opens a different modal: one row per Chitti from `ALL_CHITTIS` (§4 order), each filled with the **top 3 features** parsed live from `<folder>/skills/FEATURES.md`. The list itself is still 100% sourced from each Chitti's FEATURES.md — `ALL_CHITTIS` is the routing manifest only (slug, folder, label, emoji), the per-Chitti rows are filled in parallel `fetch` + parse just like the single-Chitti view. Auto-read fires once for blind users on first visit (`auto_read_home_done`). Exposed as `Chitti.features.openAll()`.

### Why this is locked

The new-products process (§2a) requires every Chitti to publish a `skills/FEATURES.md`. Without a discovery surface, that file is invisible to the user — defeating the purpose. This substrate makes the spec visible *to the people the spec is for*, in their language, by voice. For the four-user contract (§7), it is the **primary onboarding affordance for blind / illiterate / elderly users** who cannot read the homepage.

### Hard rules

- **Nothing hardcoded.** If a feature exists in the JS but not in FEATURES.md → bug. If a feature exists in FEATURES.md but not in the modal → parser bug, fix the parser, never the data.
- **Auto-load contract.** Any new Chitti page that loads `chitti_a11y.js` inherits Feature Discovery automatically. There is no opt-out at the page level — same as the ISL substrate.
- **Voice-first.** The modal is usable end-to-end without reading any text. Read-all + per-feature speak buttons cover the read-aloud surface; the floating CTA is `aria-label`-ed for screen readers.

See [[project_feature_discovery_box_locked]].

---

## 2e. Business Continuity Plan — LOCKED (2026-05-14)

Five layers of self-healing run continuously so the platform survives **72 hours without human intervention**. Operationalised in [chitti-founder/backend/main.py](chitti-founder/backend/main.py); reuses the existing APScheduler, the [`feedback-widget.js`](feedback-widget.js) per-response signals, and the §6 daily/weekly cron crystallisation.

### The five layers

| Layer | What | Where |
|---|---|---|
| **1** | **Self-ping every 4 minutes — NOT UptimeRobot, NOT any external monitor.** chitti-founder hits every Chitti `/health` endpoint on its own APScheduler. Non-200 → email Sire (debounced 1 h per Chitti). Every result logged to Turso `chitti-founder` DB. Self-ping also doubles as the Render free-tier keep-alive (Render idles dynos after 15 min); the 4-min interval is comfortably under that threshold. **No external uptime SaaS** — it would add a billed subscription, a third-party point of failure, and a data-egress surface for free. | [chitti-founder/backend/main.py](chitti-founder/backend/main.py) → `run_self_ping()` cron, interval `SELF_PING_INTERVAL_MIN=4` |
| **2** | **Health checks all backends.** Same self-ping loop; ground truth of which Chitti is up *right now*. Surfaces on the Founder dashboard alongside the daily slice. | same job |
| **3** | **Quality scoring every response.** Per-response widget (§7) captures 👍 / 👎 + voice/text feedback on every box, tagged to the box ID. | [feedback-widget.js](feedback-widget.js) |
| **4** | **Feedback monitoring daily.** 07:00 IST quality email + Sunday 08:00 IST weekly trend + hourly :15 escalator (low thumbs → SMS, repeat defect → GH issue, CO₂ > 0.5 g → carbon issue). | §6 — [chitti-founder/backend/main.py](chitti-founder/backend/main.py) |
| **5** | **AI fallback chain — DeepSeek → Claude → Gemini.** DeepSeek is the sole production LLM (§2). Claude + Gemini are configured as fallback shims, triggered only if DeepSeek returns 5xx three times in a row. Honest failure surface if all three fail — never silently degrade. | per-product LLM client |

### Failure scenarios → responses

| Scenario | Response |
|---|---|
| **Single backend down** | Render auto-restarts the service. Layer-1 self-ping logs the gap and emails Sire on the first non-200 (debounced). |
| **Database fails** | Standby takes over within **30 s** — Turso embedded-replica pattern (§2) keeps a local SQLite file; writes continue against the local copy and sync resumes once Turso is reachable. |
| **DeepSeek fails** | Auto-fallback Claude → Gemini in the LLM client. Honest failure if all three are down. |
| **GitHub Pages down** | Cloudflare mirror — **P2**, not yet wired; queued in §8. |
| **Mass outage** | Redeploy from GitHub `main`. Every Chitti backend has a `render.yaml` so the platform is reconstitutable from source. |

### Hard rules

- **72-hour autonomous target.** Every layer above must run unattended for ≥ 72 hours. Anything that needs human intervention sooner is a defect.
- **No silent fallbacks** (Voice Factory rule, §3 #5, applied to the LLM chain too). Layer-5 surfaces *"falling back to Claude because DeepSeek 5xx-d 3× in a row"*, never silent.
- **Honest stubs allowed** for unset env vars (SMTP, SMS, GitHub token, Turso URL, Claude / Gemini keys) — the helper logs what it WOULD have done and returns False so the cron stays green. Matches the §3 *Honest stubs over fake demos* rule.

See [[project_business_continuity_plan_locked]].

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
| 13 | Chitti Kirana (Chitti Business flagship) | `chitti_kirana.html` (TBD) | `chitti-kirana-api` (TBD) | SKELETON — voice/camera/video billing + bill-link flywheel + vernacular-first + honest queueing. Full surface in [chitti-kirana/skills/](chitti-kirana/skills/). |
| 14 | Chitti News AI | `chitti_news_ai.html` | `chitti-news-ai-api` | SKELETON 2026-05-14 — AI-only tool & model discovery. Top-3 reference apps copied (Product Hunt, There's An AI For That, Hugging Face Daily Papers, Inshorts, Ground News, Artifact). 17 RSS sources seeded, 10 endpoints (2 LIVE + 8 honest 501), 14 skill files. Spec: [`CHITTI_NEWS_AI_MASTER_SPEC.md`](CHITTI_NEWS_AI_MASTER_SPEC.md). |

**Specs** at repo root: `CHITTI_TECHNICAL_MASTER_SPEC.md`, `CHITTI_MEDUPI_MASTER_SPEC.md`, `CHITTI_NEWS_MASTER_SPEC.md`, `CHITTI_NEWS_AI_MASTER_SPEC.md`, `CHITTI_VOICE_FACTORY_MASTER_SPEC.md`, `CHITTI_GOVERNMENT_MASTER_SPEC.md`.

### Founder master product docs — single source of truth

Two founder-authored product specs supersede any earlier short-form Chitti PA / Chitti Business notes. Every future Claude session reads these BEFORE building anything for these products.

| Doc | Scope |
|---|---|
| [CHITTI_PA_MASTER.md](CHITTI_PA_MASTER.md) | Personal Assistant — full B2C spec. Soul/DNA, 5 emotional superpowers, address terms (yaara / [name] ji / Master), Postman Principle, Product Truth Engine, Health Guardian, Safety Guardian, Phase 1 WhatsApp → Phase 2 App+Camera+Health → Phase 3 Hardware, 6-phase roadmap (PA → Voluntary Support → B2C → B2B → 29 Hats → Network), support tiers (Dost / Saathi / Parivar / Champion), 12 Commandments. |
| [CHITTI_BUSINESS_MASTER.md](CHITTI_BUSINESS_MASTER.md) | Business product — full B2B spec. 5 roles (CFO / Ops / Customer Service / Growth / Supplier), Proactive Learning Engine, complete inventory + expiry cascade, GST-compliant billing, customer chatbot, Collective Intelligence Network (privacy-safe), per-shop-type roadmap, **Chitti Kirana** as the flagship first instantiation. |

These two docs are the **single source of truth** for their respective products. If anything in the rest of this file disagrees with them, the master docs win — update this file rather than the master.

---

## 4a. Frontend ↔ folder map (root HTML files)

**Every `chitti_*.html` at the repo root MUST stay at the root** — GitHub Pages serves from `/`. Do not move them into their product folder. Each file carries an `<!-- Frontend for <folder>/ -->` comment on line 2 so the binding is visible without leaving the file.

### Product pages

| Root HTML | Folder it drives |
|---|---|
| `chitti_news.html` | `chitti-news/` |
| `chitti_news_ai.html` | `chitti-news-ai/` |
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
| `chitti_isl.html` | `chitti-isl/` |

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

### 5a. Per-Chitti planned wave (queued 2026-05-13)

Full detail + surface needed live in each Chitti's
`<product>/skills/FEATURES.md`. Summary below for routing.

| Product | Item | Priority | Spec link |
|---|---|---|---|
| **MedUPI** | Price alert ("Tell me when Crocin drops below ₹20") | P1 | [features](chitti-medupi/skills/FEATURES.md) |
| **MedUPI** | Expiry reminder for medicines at home | **P0** (safety) | [features](chitti-medupi/skills/FEATURES.md) |
| **MedUPI** | Family medicine cabinet tracker | P1 | [features](chitti-medupi/skills/FEATURES.md) |
| **News** | Morning briefing — 5 headlines read aloud at 07:00 IST | P1 | [features](chitti-news/skills/FEATURES.md) |
| **News** | "Explain this news in simple Hindi" button on every article | **P0** | [features](chitti-news/skills/FEATURES.md) |
| **News** | Fake-news score visible on every article (not just on open) | **P0** | [features](chitti-news/skills/FEATURES.md) |
| **Vaani** | "Remember my preferences" — Chitti learns regular orders | P1 | [features](chitti-vaani/skills/FEATURES.md) |
| **Vaani** | Voice shortcuts — say "usual" / "wahi wala" | P2 | [features](chitti-vaani/skills/FEATURES.md) |
| **Vaani** | Daily check-in for elderly users (reuses emergency cascade) | **P0** (safety) | [features](chitti-vaani/skills/FEATURES.md) |
| **Vaani** | ~~Geo / lat-lng on local-business lookup~~ — GPS + pincode capture, Haversine radius filter (5 km metro / 25 km tier-2/3), distance pill on every card, nearest spoken aloud, 5 → 25 km honest auto-expansion. | ✅ **Shipped** 2026-05-13 | [features §3.2](chitti-vaani/skills/FEATURES.md) |
| **Government** | "Am I eligible?" checker for every scheme | **P0** | [features](chitti-government/skills/FEATURES.md) |
| **Government** | Application status tracker | P1 | [features](chitti-government/skills/FEATURES.md) |
| **Government** | Document checklist per scheme (scanner deep-link) | **P0** | [features](chitti-government/skills/FEATURES.md) |
| **Legal** | Plain-language explainer for any legal notice | **P0** | [features](chitti-legal/skills/FEATURES.md) |
| **Legal** | "Is this contract fair?" clause checker | P1 | [features](chitti-legal/skills/FEATURES.md) |
| **Legal** | Tenant rights by state | P2 | [features](chitti-legal/skills/FEATURES.md) |
| **CA** | Tax-saving reminder before March 31 | P1 | [features](chitti-ca/skills/FEATURES.md) |
| **CA** | GST filing deadline alerts | P1 | [features](chitti-ca/skills/FEATURES.md) |
| **CA** | "How much tax will I save if I invest X?" calculator | P2 | [features](chitti-ca/skills/FEATURES.md) |

### 5b. Cross-cutting — applies to ALL Chittis (queued 2026-05-13)

These ship as shared substrate (`chitti_a11y.js` + a new
`chitti_offline.js` + WhatsApp gateway), not per-product.

| Item | Priority | Notes |
|---|---|---|
| **Offline mode for low-connectivity areas** | P1 | Service-worker cache of last-N responses + an "offline" badge per page. Honest stub when the cache is empty. |
| **WhatsApp integration — use Chitti without internet app** | **P0** | Biggest rural unlock. Bot endpoint per Chitti via WhatsApp Business API. Same DeepSeek + voice substrate. Reuses existing voice-first identity. |
| **Village mode — extra large text, simple language** | **P0** | `chitti_a11y.js` toggle. Class-5 plain-Hindi system prompt across all DeepSeek calls. Companion to the existing Braille mode toggle. |

### 5c. Accessibility adaptation wave (queued 2026-05-13)

Concrete behaviors that activate per **User Disability Profile** (see
[§7](#user-disability-profile--locked) — the profile is the signal, these are
the adaptations). All implementations land in `chitti_a11y.js` so every
Chitti inherits them automatically.

| Triggered by profile | Behavior | Priority |
|---|---|---|
| **BLIND** | Every page auto-announces on open ("You are on Chitti MedUPI. Tap anywhere to start.") | **P0** |
| **BLIND** | Gesture navigation — swipe left/right between sections | P1 |
| **BLIND** | No visual-only errors — every error must be spoken | **P0** (enforce — already in contract) |
| **ELDERLY** | Font-size memory per device | P1 |
| **ELDERLY** | Slow speech mode | **P0** |
| **ELDERLY** | Repeat button ("Say that again Chitti") | **P0** |
| **ELDERLY** | Simple mode — hides advanced features | P1 |
| **ILLITERATE** | Everything in voice — no reading required | **P0** |
| **ILLITERATE** | Voice confirmation ("Say HAAN to confirm") | **P0** |
| **ILLITERATE** | Pictures with every option — visual menus | **P0** |
| **RURAL / LOW CONNECTIVITY** | 2G mode — works on slow internet | P1 |
| **RURAL / LOW CONNECTIVITY** | Missed-call feature — user gives missed call, Chitti calls back | P1 |
| **RURAL / LOW CONNECTIVITY** | SMS fallback — if no internet, Chitti sends SMS | **P0** |

The Rural triggers above attach to the **"I am in a rural area / low
connectivity"** checkbox added to §7's User Disability Profile on
2026-05-13 (Sire's decision). `chitti_a11y.js` can additionally
*suggest* the profile based on network heuristics (`effectiveType ≤ 2g`
or `RTT > 1500 ms`), but the checkbox is the authoritative trigger —
heuristics propose, the user disposes.

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

### Per-response widget — MANDATORY on every page (LOCKED 2026-05-13)

**Every response box / section on every Chitti page must have these 4 elements.** No page ships without this. Ever. Implementation lives in [feedback-widget.js](feedback-widget.js); it applies to ALL pages automatically by attaching to any element marked `data-chitti-response` (or `.chitti-response`) via MutationObserver. Page authors do not hand-roll this.

1. **🔊 Speaker icon** — reads *that specific box* aloud in the page's selected language. Uses `chitti_a11y.speak()` if loaded, else `SpeechSynthesis`.
2. **🤖 Chitti icon** — opens Chitti scoped to *that specific box*. User can say or type *"explain further"*, *"give me an example"*, etc. The box's text + ID is passed as context.
3. **👍 / 👎 thumbs** — on **every response box**, not just in the page footer. Each vote carries the box ID so dashboards can pinpoint which box is failing.
4. **Per-box feedback window** — clicking **👎** opens a popup for **THAT box only**:
   - Header reads: **"Feedback for: [section name]"** (derived from the box's heading or `data-chitti-section` attribute).
   - User can **🎙️ record voice feedback** or **⌨️ type feedback**.
   - Chitti speaks (in the user's language): *"What was wrong with this?"*
   - Feedback is tagged to that **box ID**, saved to the feedback database, and sent to the **Founder dashboard daily** (see [Chitti Quality v2](#6-quality-standards) — DAILY 07:00 IST email).
   - POSTs to `/api/feedback/collect` (legacy) and `/api/feedback` (canonical, `lib/feedback.py`). Override base via `window.CHITTI_FEEDBACK_API`.

**Hard rule:** if a Chitti page has a response box without the 4-icon row attached, it is **broken** and must be fixed before merge — same merge-blocker status as missing the [Sticky NOT SEBI REGISTERED bar](#legal-disclaimer--every-chitti-page).

### Vaani-specific — always-on, voice-mediated

- **Keyword spotting** for emergencies (any Chitti-mediated audio, day or night).
- **Cascade:** confirm-with-master → ring alarm bypassing silent → spouse → family → Chitti-to-Chitti relay.
- **NEVER auto-dial 112 / 100 / 102.**

### Legal disclaimer — every Chitti page

- **Sticky `NOT SEBI REGISTERED` bar** at top + **full legal modal** behind it.
- Never demoted to footer.

### User Disability Profile — LOCKED

On **first visit to ANY Chitti page**, show a simple one-time setup:

> **"How can Chitti help you better?"**
>
> - ☐ I am blind or have low vision
> - ☐ I am deaf or hard of hearing
> - ☐ I am mute or have speech difficulty
> - ☐ I use sign language (ISL)
> - ☐ I have difficulty reading
> - ☐ I am elderly (65+)
> - ☐ I have limited mobility
> - ☐ I have cognitive disability
> - ☐ I am in a rural area / low connectivity
> - ☐ None of the above

- User can **select multiple**.
- **Saved locally** — never asked again.
- **Synced across all Chittis** on the same device (shared `localStorage` key via `chitti_a11y.js`).

#### How Chitti adapts per profile

| Profile | Adaptation |
|---|---|
| **BLIND** | Everything spoken. No visual-only content. |
| **DEAF** | Everything in text + **ISL animations**. No audio-only content. |
| **MUTE** | All input via tap/type. Voice input optional, **never required**. |
| **ISL** | **ISL animations on every response.** |
| **ILLITERATE** | Picture menus, voice everything. |
| **ELDERLY** | Large text, slow speech, simple language, **repeat button**. |
| **LIMITED MOBILITY** | Large touch targets, voice navigation only. |
| **COGNITIVE** | Simple language, one step at a time, no overwhelming information. |
| **RURAL / LOW CONNECTIVITY** | 2G mode (small payloads, deferred images), offline mode (service-worker cache + replay queue), SMS fallback, simple UI, missed-call callback. |

#### Important rules

- Profile setup is **VOICE GUIDED for blind users**.
- Profile setup has **ISL demo for deaf users**.
- **Never force** — always skippable.
- **Always changeable in settings.**
- Chitti says: *"I will remember how to help you best."*

This extends the [Four-user accessibility contract](#the-four-user-contract--every-chitti-page) — the four-user contract is the floor; the disability profile is how Chitti personalises beyond the floor. Implementation lives in `chitti_a11y.js` so every Chitti product inherits it.

### Indian Sign Language (ISL) — LOCKED

**Indian Sign Language — not ASL.** For the 6 crore deaf Indians ignored by every app. ISL ships in three phases, all inheriting from `chitti_a11y.js`.

#### Phase 1 — Build now (skeleton on commit #1)

- **ISL dictionary** of common Indian-life words as animated hand gestures. Lives in `chitti_isl_dictionary.json` at repo root, loaded by `chitti_a11y.js`.
- **Every Chitti response shows an ISL animation panel alongside the text.** Auto-attached by `chitti_a11y.js` to any element marked `data-chitti-response` (or `.chitti-response`) via MutationObserver.
- **Tap any word to see its ISL sign** in an enlarged modal. Unknown words fall back to fingerspelling.
- **ISL mode toggle** in the accessibility bar (next to Braille mode). Auto-on when the user's disability profile has ☑ "I use sign language (ISL)".
- **Honest placeholders.** Animations are emoji-hand CSS keyframe sequences clearly labeled "Placeholder ISL — community video coming soon." Never claim a placeholder is the real sign. Matches the [Honest stubs over fake demos](#3-process--build-rules) rule.

#### Phase 2 — Camera-based ISL (COMING SOON)

- Camera detects user's ISL gestures.
- Chitti interprets and responds (DeepSeek + a frame-stream classifier — supplier TBD).
- Deaf user communicates via ISL; Chitti speaks the response aloud for others in the room.
- Surfaces as a `COMING SOON` card on `chitti_isl.html`; never silently fails.

#### Phase 3 — Community-built ISL (COMING SOON)

- Deaf community contributes ISL videos for words missing from the dictionary.
- **Hall of Fame for ISL contributors** — same social-reward model as the voice donation strategy. Lives on `chitti_voice_hall_of_fame.html` as a dedicated ISL section, mirrored on `chitti_isl.html`.
- Architecture is the **same swappable substrate** as voice donations — provider-agnostic at one URL.

#### Implementation contract

- All ISL behavior lives in `chitti_a11y.js` + `chitti_isl_dictionary.json`. Per-product pages never hand-roll ISL.
- ISL panel renders **next to**, not in place of, the text. Deaf-plus-low-vision users keep large text.
- Dictionary entries declare a sequence of emoji-hand frames + duration; replaced by community video URLs in Phase 3 without any frontend change.
- New-products process applies: see [`chitti-isl/skills/FEATURES.md`](chitti-isl/skills/FEATURES.md) for the full feature surface and COMING SOON markers.

### Chitti ISL — Plugin (LOCKED)

**Chitti ISL is a DEFAULT plugin on ALL Chitti pages. No exceptions.**

#### How it works

- **`chitti_isl_dictionary.json` is the single source of truth.** All ISL words live in this one JSON at repo root.
- **`chitti_a11y.js` loads ISL automatically on every page.** No `<script>` tag per page beyond the standard a11y substrate include.
- **New words added to the JSON = instantly live on ALL pages.** Zero page-by-page updates ever needed — the MutationObserver picks them up on next response.
- **No page-by-page updates ever needed.** Dictionary is the contract; pages never know about ISL specifics.

#### Plugin activation

- **Automatic** for users who selected ☑ "I use sign language (ISL)" in the [User Disability Profile](#user-disability-profile--locked).
- **Manual** via the 🤟 ISL button (in the accessibility bar, next to Braille mode) for anyone else who wants it.

#### Default-on contract for every future Chitti page

Any new Chitti page built in future **inherits the ISL plugin automatically** — no developer needs to remember to add it. The contract is enforced by the [`chitti_a11y.js` substrate](#shared-substrate--chitti_a11yjs-must-load-on-every-page): if a11y is loaded, ISL is loaded. There is no opt-out at the page level.

> The dictionary is the contract. The substrate is the loader. Pages just write content.

---

## 8. Agent priority order — what to work on next

**Anchored to the 2026-05-12 homepage audit:** sahayai.in's `index.html` loads **zero scripts**. The four-user contract is broken at the front door.

### P0 — Fix the homepage (this session's audit findings)

1. **Wire `chitti_a11y.js` into `index.html`.** Restores the working language selector (Kannada actually shifts UI), Voice Required marker, Braille mode, and the `🔊 Read page` button on every section.
2. **Wire `feedback-widget.js` into `index.html`.** Restores 👍/👎 plus the 👎 → suggestion modal.
3. **Build the "Explain simply" button.** No substrate exists yet — needs a new helper that re-prompts DeepSeek with a plain-English-for-class-5 system prompt and reads the result aloud. Required on every product card AND every Chitti response.
4. **Audit the other 12 product pages** for the same four gaps. The substrate scripts are loaded on 13 pages already, but verify the language selector actually shifts UI on each, and `Explain simply` is added uniformly.

### ✅ Geo on the local-business lookup — SHIPPED 2026-05-13

Was P0 (correctness bug — a Mumbai user used to see Chennai kiranas).
All five sub-steps live on `main` across commits `650eec0` (frontend
location helper), `e89fc0d` (schema migration), `4e607dc` (Haversine +
radius + auto-expansion), `6067e14` (distance rendering + speech), and
this commit (docs).

5. ✅ **Capture user location.** `window.Chitti.location.get()` in
   [chitti_a11y.js](chitti_a11y.js) — GPS primary, pincode fallback,
   cached 6 h. Every product page inherits it without re-implementing.
6. ✅ **`lat / lng / pincode / service_radius_km` on `product_gmail_accounts`.**
   Idempotent `ALTER TABLE` in
   [`admin_db.py`](chitti-vaani/backend/services/admin_db.py). Backfill
   endpoint at `PATCH /api/admin/products/<id>/geo`.
7. ✅ **Haversine + radius filter in `local_chitti_service.nearby()`.**
   Default radius 5 km when the user's pincode prefixes a known metro
   (`400/110/560/600/700/500/411/380/201/122`), 25 km otherwise. Honest
   v1 of the `chitti-pincode-tier.json` plan — swap the prefix set for
   a real gazetteer when one ships.
8. ✅ **"X km away" + speak nearest.** `renderLocalChitti()` in
   [chitti_vaani.html](chitti_vaani.html) — three distance states
   (haversine / pincode_exact / unknown). Nearest confirmed match
   spoken aloud for blind users.
9. ✅ **Honest empty state + 5 → 25 km expansion.** Server retries
   internally at 25 km when default was metro and zero confirmed hits;
   `expanded_to_km` flag on the response makes the frontend say
   *"No Chitti business within 5 km — expanded search to 25 km."*
   Empty state explicit and spoken — never silent.

End-to-end verified on a seeded SQLite DB: Mumbai user sees the Mumbai
shop at 0.806 km, Bangalore filtered out, auto-expand fires when the
user has only out-of-radius confirmed matches. Full spec lives in
[chitti-vaani/skills/FEATURES.md §3.2](chitti-vaani/skills/FEATURES.md).

### P1 — Unblock Voice Factory Phase 2

10. **Embed-pass on Voice Factory fluency pipeline** — needs Render py3.11 to finish the 79,414-chunk corpus across 26 langs (`project_voice_factory_fluency_pipeline`).
11. **Bhashini ULCA registration** by Sire — unblocks swap from `mock_bhashini` to real supplier.

### P2 — Infrastructure cleanup

12. **Per-product Turso cutover verification.** Neon/Supabase stay live until each per-Chitti cutover is verified end-to-end.
13. **Wire the 8 backends that have `render.yaml` but aren't connected** (`project_render_deploy_status_2026_05_10`).

### P3 — Next-wave products

14. Money Help → Health → Jobs → Inventory → WhatsApp Orders (in that order — Money Help most-requested per current backlog).

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
