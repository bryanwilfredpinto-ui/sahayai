# CHITTI SOP — Standard Operating Profile for all 15 Chittis

**Created:** 2026-05-15 · **Owner:** Bryan Wilfred Pinto (Sire) ·
**Companion docs:** [SAHAYAI_MASTER.md](SAHAYAI_MASTER.md) (vision + locked decisions) · [QUALITY_STATUS.md](QUALITY_STATUS.md) (live audit).

## Purpose

A one-page-per-Chitti contract that fixes the **non-negotiables** of every Chitti
so a new Claude session, a new contributor, or a future Sire can read this file
and know — without re-litigation — what the product is for, who it serves, how
we measure it, what quality bar it must clear, where its scope ends, who owns
its evolution, and when its data is considered stale.

This document does NOT redefine SAHAYAI_MASTER.md §2 locked decisions. It
**applies** them per-Chitti. If anything here contradicts §2, §2 wins.

## How to read each entry

Every Chitti carries the same seven fields:

| Field | Meaning |
|---|---|
| **Objective** | The single sentence the Chitti exists to satisfy. |
| **Primary user** | The archetype the Chitti is built for first (others benefit, but the design call goes to this person). |
| **Success metric** | The number Sire tracks; everything else is supporting telemetry. |
| **Quality standard** | The merge-blocker bar. Below this is a defect, not a feature gap. |
| **Scope** | What the Chitti DOES + what it explicitly does NOT do. |
| **Evolution owner** | Where new capabilities land (skill file, knowledge corpus, swarm, cron) and who approves them. |
| **Stale data rule** | When the underlying data is considered out-of-date and must be refreshed. |

## Vaani-sole-interface implication (LOCKED 2026-05-15)

Per [SAHAYAI_MASTER.md §2 row 1](SAHAYAI_MASTER.md), **Chitti Vaani is the only user-facing surface across the entire platform.** Every other Chitti in this SOP is an **internal service + dev/debug surface** reached through Vaani's intent router. Each Chitti's "Primary user" below is the *archetype the routed answer serves*, not a user who opens that Chitti's HTML page directly. The standalone `chitti_*.html` pages persist for parity testing and substrate development only.

## CHITTI GOLDEN RULE — confirm before every action (LOCKED 2026-05-23)

> **Chitti NEVER acts on its own. Chitti ONLY acts when the user gives a command. Chitti ALWAYS confirms before doing anything.**

Applies to **every Chitti in this SOP** — Vaani, MedUPI, CA, Legal, Government, News, UPI, Scanner, Shares, Voice Factory, 2/4-wheeler, Logo & Video, News AI, Kirana, and any future Chitti. Every side-effecting action that a Chitti performs on the user's behalf (call, SMS, WhatsApp, email, UPI, lock, silent, flashlight, camera, app launch, navigation, alarm, reminder, file write, scheme application, anything) MUST pass through the [`chittiConfirmAndDo()`](chitti_vaani.html) gate:

1. Chitti speaks *"Sire, shall I do X?"* in the user's chosen language
2. A Yes / No modal opens (mute-user safe — tap OR voice)
3. The action fires only on **explicit Yes** (`haan / theek / yes / kar do`)
4. On **No** (`nahi / ruko / stop / mat / cancel`) Chitti drops the action and speaks *"Theek hai, rok diya."*
5. On **silence** Chitti waits. Forever, if needed. **Never defaults to Yes. Never times out into Yes.**

Per Chitti, the "Quality standard" row already encodes the per-response widget (👍 / 👎 / 🔊 / 🤖) — the Golden Rule is the **action-gate** that sits one level lower: even *before* a Chitti produces a response that takes an action on the user's behalf, the action must be confirmed. The widget judges quality after the fact; the Golden Rule guards execution before the fact.

**HIGH-risk Chittis (CA, Legal, MedUPI, Vaani-psychology)** carry an extra rule on top of the Golden Rule: actions that would create a legal, medical, or financial obligation for the user (filing an ITR, sending a legal notice, ordering medicine, dialling a helpline) NEVER bypass the gate even when the user has previously approved a similar action. There is no "approve once, run forever" for HIGH-risk Chittis — every individual action confirms.

See [SAHAYAI_MASTER.md §2g](SAHAYAI_MASTER.md) for the full architectural callout and [[project_chitti_golden_rule_locked]] for the memory entry.

---

## 1. Chitti Vaani — the dost (USER-CANONICAL)

| Field | Value |
|---|---|
| **Objective** | Be every Indian's voice-first dost: one conversation routes every Chitti capability to the right service, in the user's language, with emergency cascade always on. |
| **Primary user** | Tier-2/3 vernacular speaker — elderly parent, blind/illiterate user, anyone in a low-connectivity area. The four-user contract (Blind / Deaf / Mute / Illiterate) is the floor; the Disability Profile (§7) personalises above it. |
| **Success metric** | (a) Intent-route accuracy across all 14 internal Chittis; (b) per-response 👍 rate; (c) emergency-cascade median response time from keyword spot → spouse-tier acknowledgement. |
| **Quality standard** | 4-supplier voice cascade with honest ledger (Tier C surfaces *"not supported in this language"* — never silent fallback); family-cascade emergency protocol (NEVER auto-dials 112 / 100 / 102); ISL Phase 1 panel on every response; per-response widget on every response box; psychology corpus held to therapist-boundary (Tele-MANAS 14416, iCall, Vandrevala, NIMHANS cascade). |
| **Scope** | **Does:** voice IN + voice OUT in 9 languages, DeepSeek intent classification → route to any of the 14 Chittis, geo-aware local-business lookup (5/25 km auto-expand), always-on emergency keyword spotting, psychology basics → PhD corpus. **Does NOT:** auto-dial police/ambulance; act as licensed therapist; bypass family cascade. |
| **Evolution owner** | [chitti-vaani/skills/FEATURES.md](chitti-vaani/skills/FEATURES.md) + [chitti-vaani/skills/PSYCHOLOGY.md](chitti-vaani/skills/PSYCHOLOGY.md). Intent router learns via Swarm (anonymised); HIGH-risk corpus changes (psychology, emergency cascade) require Sire's review. |
| **Stale data rule** | Voice donations replace Bhashini per language as each crosses the quality threshold (Voice Factory ledger is authoritative). Helpline numbers re-verified quarterly. Psychology corpus reviewed quarterly. Locked decisions in §2 are never stale. |

## 2. Chitti MedUPI — medicine cost intelligence

| Field | Value |
|---|---|
| **Objective** | Find the cheapest same-composition generic for any prescribed medicine, with Jan Aushadhi + NPPA-ceiling cross-check and a family medicine wallet. |
| **Primary user** | Family caregiver buying medicines on a fixed budget — Tier-2/3, elderly parents, vernacular. |
| **Success metric** | (a) ₹ saved per cart vs. branded equivalent; (b) same-composition match rate; (c) expiry-reminder follow-through rate. |
| **Quality standard** | **STRICT same-composition** (molecule + strength + form) — never approximate, never inferred from brand name; NPPA ceiling enforced as a hard cap, not a hint; HIGH-risk Swarm gate (human review before any skill update lands); camera-intelligence contract (§2b) on every strip scan; per-response widget. |
| **Scope** | **Does:** Jan Aushadhi lookup, branded ↔ generic comparison, family wallet, prescription / strip scan (DeepSeek vision), expiry reminders, price alerts (P1). **Does NOT:** diagnose, recommend dose changes, sell or fulfil medicines, substitute for a pharmacist. |
| **Evolution owner** | [chitti-medupi/skills/FEATURES.md](chitti-medupi/skills/FEATURES.md) + Swarm Intelligence (HIGH-risk → Sire approves before push to skills/*.md). |
| **Stale data rule** | Jan Aushadhi price catalog: weekly refresh. NPPA NLEM ceiling list: monthly. Brand-to-molecule mapping: monthly diff against drug regulator updates. Medicine composition itself is treated as immutable (matched on master DB, never inferred). |

## 3. Chitti CA — tax assistant (HIGH-risk)

| Field | Value |
|---|---|
| **Objective** | CA Final + PhD-grade plain-English help on ITR / GST / TDS / Companies Act / Budget — for individuals and small businesses without a CA on retainer. |
| **Primary user** | Salaried Indian filing their own ITR; small-business owner managing GST. |
| **Success metric** | (a) Correct-answer rate on filing-deadline + slab questions (judge eval); (b) user-reported *"I filed successfully"* follow-up rate; (c) per-response 👍. |
| **Quality standard** | [chitti-ca/skills/CA_KNOWLEDGE.md](chitti-ca/skills/CA_KNOWLEDGE.md) held at **CA Final + PhD** grade (IT Act, GST, Companies Act, AS/Ind AS, Budget 2025, portal navigation, tax jurisprudence, treaty interpretation); **server-enforced disclaimer on every response** (never client-controlled); HIGH-risk Swarm gate (human review). Quadrails INJECT rail fires unless `compliance_inject=False` is justified for JSON-only output. |
| **Scope** | **Does:** ITR slab + deduction guidance, GST rate + filing flow, TDS sections, Budget 2025 changes, portal navigation hints, treaty interpretation, tax-saving reminders. **Does NOT:** file returns on behalf of the user, sign documents, give legally binding advice, replace a CA for audit / scrutiny. |
| **Evolution owner** | [chitti-ca/skills/CA_KNOWLEDGE.md](chitti-ca/skills/CA_KNOWLEDGE.md) + [chitti-ca/skills/FEATURES.md](chitti-ca/skills/FEATURES.md). Sire approves every Swarm-proposed change before it lands. |
| **Stale data rule** | Annual Budget refresh (Feb each year — slabs / deductions / regime). GST rate changes monthly (Council notifications). ITR form schemas updated per FY before July 31. CBDT / CBIC circulars: weekly diff. |

## 4. Chitti Legal — legal assistant (HIGH-risk)

| Field | Value |
|---|---|
| **Objective** | LL.M + PhD-grade plain-English help on the new criminal code (BNS / BNSS / BSA 2023), Constitution, civil + family + consumer + data-protection law — for Indians facing a notice or contract without a lawyer. |
| **Primary user** | Indian who just received a legal notice / contract / family-law issue, with no lawyer on retainer. |
| **Success metric** | (a) Correct-answer rate on notice-explanation (judge eval); (b) user-reported *"got it resolved"* follow-up rate; (c) per-response 👍. |
| **Quality standard** | [chitti-legal/skills/LEGAL_KNOWLEDGE.md](chitti-legal/skills/LEGAL_KNOWLEDGE.md) held at **LL.M + PhD** grade (full Constitution, BNS/BNSS/BSA 2023, civil + criminal, family law all religions, RERA, CPA 2019, DPDP 2023, POSH/DV, landmark SC); server-enforced *"this is not legal advice"* disclaimer on every response; HIGH-risk Swarm gate (human review). |
| **Scope** | **Does:** Notice-explanation, NDA / rent-agreement drafts, tenant rights by state, family-law primers across religions, consumer-protection routes, data-protection guidance (DPDP 2023). **Does NOT:** represent the user, file in court, sign documents, replace a lawyer for litigation. |
| **Evolution owner** | **CEOS v1.0 (2026-06-07): [chitti-legal/ceos/](chitti-legal/ceos/)** (CONSTITUTION → BUILD_ORDER; deterministic engine `chitti_legal_os_engine.js` on `chitti_legal_os.html`; gates `tools/legal_os_engine_test.mjs` 60/60 + `tools/cert_legal_os.mjs` 27/27). Domain depth: [chitti-legal/skills/LEGAL_KNOWLEDGE.md](chitti-legal/skills/LEGAL_KNOWLEDGE.md). Feature surface: [chitti-legal/ceos/skills/FEATURES.md](chitti-legal/ceos/skills/FEATURES.md). Sire approves every Swarm patch. |
| **Stale data rule** | Landmark SC / HC judgments: monthly diff. RBI / SEBI / MCA circulars: weekly. State-specific updates: per state gazette cadence. Statutory amendment (e.g. new chapter to BNS): on commencement-date publication. |

## 5. Chitti Government — scheme assistant

| Field | Value |
|---|---|
| **Objective** | Surface every central + state scheme the user is eligible for, with plain-English explanation, document checklist, and (where partnered) DigiLocker fetch. |
| **Primary user** | Indian in the BPL / OBC / SC/ST / farmer / women / senior-citizen / PwD brackets who cannot navigate gov portals — and the family member helping them apply. |
| **Success metric** | (a) Eligibility-match accuracy (false-positive rate held below 5%); (b) *"I applied successfully"* follow-up rate; (c) document-checklist completeness (scanner deep-link click-through). |
| **Quality standard** | 30 schemes seeded at launch + PIB poll every 6 h auto-refresh; **DigiLocker partner-only** — local-upload flow used until DigiLocker partner approval lands (no silent stub claiming integration); per-response widget; honest *"unclear eligibility — check with district office"* state, never coerced to *"eligible"*. |
| **Scope** | **Does:** Central + state scheme catalog, *"Am I eligible?"* checker (P0), application status tracker (P1), document checklist (P0) with deep-link into Chitti Scanner. **Does NOT:** submit applications, sign on the user's behalf, pay scheme fees, bypass district-officer verification. |
| **Evolution owner** | [chitti-government/skills/FEATURES.md](chitti-government/skills/FEATURES.md) + PIB feed + per-state gazette. Sire reviews every new scheme before it enters the seed catalog. |
| **Stale data rule** | PIB poll every 6 h auto-refreshes the central catalog. State gazettes: monthly diff per state. Scheme delisting / freeze: daily diff against the central scheme portal. Application-deadline reminders re-validated weekly. |

## 6. Chitti News — state-aware multi-language aggregator

| Field | Value |
|---|---|
| **Objective** | Aggregate trusted RSS feeds across India in the user's state × language × category, with a 3-bullet *"Chitti's Take"* and a fact-check verdict on every article. |
| **Primary user** | Vernacular reader (Hindi today, regional langs in v1.1) who wants state-specific news without paywalls. |
| **Success metric** | (a) Fact-check pass rate (% articles cleared with ≥2 corroborating sources); (b) *"Chitti's Take"* 👍 rate; (c) cross-state coverage breadth (states represented per day). |
| **Quality standard** | Fact-checker requires **≥2 independent RSS sources** before issuing `verified` / `partial` / `disputed` verdicts — single-source articles surface as `unverified`, never auto-elevated; politics sub-agent runs under hard neutrality guardrails (no opinion, no labels, equal coverage); per-response widget; summarizer respects the user's selected language end-to-end. |
| **Scope** | **Does:** 25+ RSS feeds (EN + HI; regional stubbed for v1.1), 8 sub-agents (politics / business / tech / entertainment / sports / factcheck / summarizer / news-AI bridge), state × language × category routing, Read Later / Cancelled folders per device. **Does NOT:** publish original journalism, host comments, push notifications without consent, monetise via ads. |
| **Evolution owner** | [chitti-news/skills/](chitti-news/skills/) — 8 sub-agent SKILL.md files + `sources/RSS_SOURCES.md`. New sources reviewed by Sire before seeding. |
| **Stale data rule** | RSS poll cadence: every 30 min. Articles older than 7 days auto-archive (still searchable, demoted in feed). Sources reviewed monthly for trust score; sources with sustained low fact-check pass rate are deprecated. |

## 7. Chitti News AI — AI tool & model discovery

| Field | Value |
|---|---|
| **Objective** | Track new AI tools, models, and papers from the AI ecosystem (Product Hunt, There's An AI For That, HF Daily Papers) in an Inshorts / Ground News / Artifact-style feed. |
| **Primary user** | Indian AI builder, student, founder watching the AI ecosystem — and downstream Chitti developers looking for new substrate. |
| **Success metric** | (a) New-tool freshness (median lag from launch → appearance in feed); (b) summary 👍 rate; (c) verification rate (% tools surfaced with ≥2 corroborating sources). |
| **Quality standard** | SLA-timing curl-verified (`x-chitti-response-time-ms` header present); skeleton services that aren't built yet return **honest 501** (8 of 10 endpoints today) — never fake demos; per-response widget; **Turso embedded-replica sync UNVERIFIED today** (see [QUALITY_STATUS.md §5 round 2](QUALITY_STATUS.md)) — flagged in red until Railway env var fix lands. |
| **Scope** | **Does:** 17 AI-RSS sources seeded, 10 endpoints (2 LIVE + 8 honest 501), tool / model / paper feed with verification tag. **Does NOT:** review or rank tools subjectively, accept paid placement, duplicate mainstream news (that's Chitti News). |
| **Evolution owner** | [chitti-news-ai/skills/](chitti-news-ai/skills/) — 14 skill files + `RSS_SOURCES_AI.md`. New sources reviewed by Sire. |
| **Stale data rule** | RSS poll every 30 min. Tools not corroborated by ≥2 sources tagged `unverified`. Deprecated / dead models archived monthly. Spec at [CHITTI_NEWS_AI_MASTER_SPEC.md](CHITTI_NEWS_AI_MASTER_SPEC.md). |

## 8. Chitti UPI Fraud Guard — fraud classifier

| Field | Value |
|---|---|
| **Objective** | Tell a worried user HIGH / MEDIUM / LOW fraud risk on any UPI message, call, or link they're unsure about — with the RBI rule citation behind the verdict. |
| **Primary user** | First-time UPI user; elderly parent receiving an unsolicited UPI request; anyone who hesitated before tapping *Pay*. |
| **Success metric** | (a) Fraud-caught rate (verified retrospectively when user reports the outcome); (b) false-positive rate (legitimate transactions flagged HIGH); (c) per-response 👍. |
| **Quality standard** | 2026 RBI rule cards cited on every verdict; **honest scope disclosure** — *"I am a classifier, not a payment intent"* (see `project_chitti_product_scope_clarifications`); per-response widget; `compliance_inject=False` allowed only because the model returns strict JSON — disclaimer rides on the `legal_lines` field outside the JSON. |
| **Scope** | **Does:** Classify SMS / call transcript / UPI deep-link / message text into HIGH / MED / LOW with reasoning + RBI rule citation. **Does NOT:** initiate payments, block transactions, file complaints with banks, access UPI PINs or balances. |
| **Evolution owner** | [chitti-upi/skills/FEATURES.md](chitti-upi/skills/FEATURES.md) + RBI 2026 rule cards. Swarm Intelligence learns fraud patterns from confirmed scam reports; new pattern requires ≥100 confirmations before promotion. |
| **Stale data rule** | RBI rule cards refreshed on every new circular. Scam pattern DB updated weekly from confirmed user reports. Verdicts older than 30 days do not auto-re-classify — user must re-submit. |

## 9. Chitti Scanner — product scanner

| Field | Value |
|---|---|
| **Objective** | Scan packaged food, barcodes, and medicine strips to flag fake / expired / FSSAI-non-compliant items — with a MedUPI deep-link for cheaper generics. |
| **Primary user** | Consumer worried about fake / expired products (urban + rural); shopkeeper verifying incoming stock. |
| **Success metric** | (a) Fake-detection accuracy (precision + recall vs. confirmed FSSAI alerts); (b) MedUPI deep-link click-through (cross-Chitti flywheel); (c) community-alert participation count per district. |
| **Quality standard** | **Honest `unclear` verdict** when model confidence is low — never silently coerced to `safe` (matches §3 *honest stubs over fake demos*); camera-intelligence contract (§2b) — every scan captures what / where / when / result / user / satisfaction, anonymised before aggregation; per-response widget. |
| **Scope** | **Does:** Vision-based scanning (DeepSeek), FSSAI status, barcode lookup, medicine-strip → MedUPI deep-link, community-alert feed, annual FSSAI report. **Does NOT:** authoritatively certify a product safe (only the regulator does); replace a recall notice; sell or recommend purchases. |
| **Evolution owner** | [chitti-scanner/skills/FEATURES.md](chitti-scanner/skills/FEATURES.md) + camera DB cross-product index. Fake-product alert thresholds reviewed monthly. |
| **Stale data rule** | FSSAI status pulled per scan (no cache). Fake-product alerts decay after 90 days unless re-confirmed by a fresh scan in the same pincode. Camera captures forgotten on `"Chitti forget"` (tombstone replaces the row so aggregate counts stay honest). |

## 10. Chitti Shares — Indian equities (Technical + Fundamentals)

| Field | Value |
|---|---|
| **Objective** | Bharat-themed agentic technical + fundamental analysis for Indian equities (NSE / BSE), with plain-English *Story Mode* and a Roshan composite signal. |
| **Primary user** | Retail / new investor in Indian equities — building first conviction, not a professional trader. |
| **Success metric** | (a) Roshan composite directional accuracy (vs. eventual N-day price move); (b) *Story Mode* comprehension 👍 (user understood the explanation); (c) judge-eval scores on indicator interpretation. |
| **Quality standard** | **Sticky `NOT SEBI REGISTERED` bar + full legal modal on every page** — never demoted to footer; 43 indicators + multi-timeframe Roshan composite; agentic `chat_with_tools` loop now rail-gated (rails on first user message, every tool turn writes an audit row, final reply goes through Compliance INJECT); per-response widget. |
| **Scope** | **Does:** Fundamentals lens (Buffett / Munger / Graham / Kedia / RKD) with 25+ filters on Nifty 500; technical scan + 43 indicators + Roshan composite + Story Mode + watchlist. **Does NOT:** broker trades, hold positions, generate buy/sell orders, give registered investment advice. |
| **Evolution owner** | [chitti-shares/skills/](chitti-shares/skills/) + screener.in / Angel data feeds. New indicators reviewed by Sire before promotion to composite. |
| **Stale data rule** | NSE / BSE candles refreshed at market-session close (15:30 IST); intraday refreshed per `chat_with_tools` request. screener.in fundamentals refreshed quarterly per company results filing. **Yahoo BLOCKED from Railway** — `yahoo_client` is local-dev fallback only. |

## 11. Chitti Voice Factory — voice substrate

| Field | Value |
|---|---|
| **Objective** | Free, swappable voice substrate (STT + TTS) for every Chitti — 26 langs (12 primary + 14 cousin, including Sanskrit & Oraon) — with community-donated voices replacing Bhashini over time. |
| **Primary user** | **B2B internal** — every other Chitti backend, plus voice donors (the community contributing voice samples). |
| **Success metric** | (a) STT / TTS uptime per language (honest ledger); (b) community voice-donation count + Hall of Fame growth; (c) % langs migrated from `mock_bhashini` → real Bhashini → community voices. |
| **Quality standard** | **Tier C never silently falls back** — *"not supported in this language"* surfaces honestly (e.g. Tulu never morphs into Kannada); 4-supplier cascade ledger logs every call with success/fail; lazy-import optional deps (sentence-transformers, torch, faiss, pymupdf, youtube-transcript-api) so Railway free tier stays OOM-safe; fluency endpoints return `503 fluency_pipeline_not_installed` honestly when optional deps absent. |
| **Scope** | **Does:** 26 langs, 4-supplier cascade (mock_bhashini → real Bhashini → 3rd-party → community), YouTube fluency pipeline (10 vids/lang cap), Hall of Fame. **Does NOT:** lock in any single voice supplier (architecturally pluggable at `window.Chitti.a11y.VOICE_FACTORY_URL`); never claim a community voice that hasn't crossed the quality threshold. |
| **Evolution owner** | [chitti-voice-factory/skills/FEATURES.md](chitti-voice-factory/skills/FEATURES.md) + community voice donations + spec at [CHITTI_VOICE_FACTORY_MASTER_SPEC.md](CHITTI_VOICE_FACTORY_MASTER_SPEC.md). Phase 2 (real Bhashini) blocked on Sire's ULCA registration. |
| **Stale data rule** | Phonetic models per language refreshed quarterly. YouTube transcripts re-fetched only on explicit user request (never silent re-pull). Donor consent re-affirmed annually; expired consent → voice withdrawn from cascade. |

## 12. Chitti 2-Wheeler — 2-wheeler assistant

| Field | Value |
|---|---|
| **Objective** | Digital mechanic companion (Chitti Bike Doctor): *"Do I need a mechanic, can I fix it myself, and is this quote fair?"* — symptom/dashboard/sound diagnosis + DIY coach + Scam Shield, for 2-wheeler owners. Full CEOS spec: [chitti-2wheeler/](chitti-2wheeler/) (57 docs) under [CHITTI_MECHANIC_MASTER_SPEC.md](CHITTI_MECHANIC_MASTER_SPEC.md). |
| **Primary user** | Delivery rider (bike = livelihood), college student, family with a single bike — non-mechanic owner who needs to know whether the noise is serious + whether the quote is fair. |
| **Success metric** | (a) Diagnostic accuracy ≥90%; (b) **Safety accuracy =100%** (critical safety errors=0); (c) cost-band accuracy ≥85% + ₹ saved vs workshop; (d) mechanic-verification-loop confirmation rate (predicted vs what the mechanic actually fixed); (e) per-response 👍. |
| **Quality standard** | **CQOS 5 layers** ([chitti-2wheeler/evals/](chitti-2wheeler/evals/)): Diagnostic ≥90% · Safety =100% · DIY-safety unsafe-recs=0 · Cost ≥85% · Hallucination <1% (+accessibility=100%). 8-agent diagnostic **swarm** with Safety supreme + Trust anti-overconfidence; **never claim certainty** (confidence bands); six-field answer (Why/Severity/Can-ride/DIY-tier/Cost/Alternatives). DeepSeek wrapped via `hooks.wrap_llm`; HookRegistry; per-response widget. Frontend CEOS Swarm Diagnosis card on [chitti_2wheeler.html](chitti_2wheeler.html). **Eval numbers measured only after the Vaani relevance-rail allowlist + DeepSeek funding land — never claimed before.** |
| **Scope** | **Does:** symptom/dashboard/sound diagnosis (swarm), DIY-vs-mechanic with safety-tier, Scam Shield (quote fairness), Vehicle Twin + Health Passport, mileage/service-interval calendar, spare-part price hints, OBD2 (Mode 2, future on bikes). **Does NOT:** book service, dispatch mechanics, certify fitness, **claim diagnostic certainty**, or auto-dial cops (emergency = family cascade). |
| **Evolution owner** | [chitti-2wheeler/skills/FEATURES.md](chitti-2wheeler/skills/FEATURES.md) + the CEOS doc set ([ROLE.md](chitti-2wheeler/ROLE.md), [swarm/](chitti-2wheeler/swarm/), [evals/](chitti-2wheeler/evals/)). HIGH-risk (safety) swarm changes require Sire's approval. |
| **Stale data rule** | Service interval tables updated per manufacturer revision (annual model refresh). Spare-part prices: monthly diff per zone. Recall notices: tracked weekly against manufacturer + ARAI feeds. |

## 13. Chitti 4-Wheeler — 4-wheeler assistant

| Field | Value |
|---|---|
| **Objective** | Digital mechanic companion (Chitti Car Doctor): *"Do I need a mechanic, can I fix it myself, and is this quote fair?"* — symptom/dashboard/sound + **OBD2 (Mode 2, first-class for cars)** diagnosis + DIY coach + Scam Shield + Used-Car Inspector, for 4-wheeler owners. Full CEOS spec: [chitti-4wheeler/](chitti-4wheeler/) (57 docs) under [CHITTI_MECHANIC_MASTER_SPEC.md](CHITTI_MECHANIC_MASTER_SPEC.md). |
| **Primary user** | Family-car owner in Tier-2/3, taxi/Ola-Uber driver (car = livelihood), small-business fleet manager, used-car buyer — non-mechanic decision-maker. |
| **Success metric** | (a) Diagnostic accuracy ≥90%; (b) **Safety accuracy =100%** (critical safety errors=0); (c) cost-band accuracy ≥85% + ₹ saved vs garage; (d) mechanic-verification-loop confirmation rate; (e) per-response 👍. |
| **Quality standard** | **CQOS 5 layers** ([chitti-4wheeler/evals/](chitti-4wheeler/evals/)): Diagnostic ≥90% · Safety =100% · DIY-safety unsafe-recs=0 (airbag/SRS · ABS · brake lines · fuel rail · EV HV/orange · AC refrigerant NEVER DIY) · Cost ≥85% · Hallucination <1%. 8-agent diagnostic **swarm** (Safety supreme, Trust anti-overconfidence); **never claim certainty**; six-field answer. DeepSeek `hooks.wrap_llm`; HookRegistry; per-response widget. Frontend CEOS Swarm Diagnosis card on [chitti_4wheeler.html](chitti_4wheeler.html). **Eval numbers measured only after the Vaani relevance-rail allowlist + DeepSeek funding land.** |
| **Scope** | **Does:** symptom/dashboard/sound + OBD2 (standard SAE-J2012 DTC library, live coolant/RPM/fuel-trim) diagnosis, DIY-vs-mechanic with safety-tier, Scam Shield, Vehicle Twin + Health Passport, 100-point Used-Car Inspector, mileage/service calendar, spare-part hints. **Does NOT:** book service, dispatch mechanics, certify fitness, **claim diagnostic certainty**, or auto-dial cops (emergency = family cascade). |
| **Evolution owner** | [chitti-4wheeler/skills/FEATURES.md](chitti-4wheeler/skills/FEATURES.md) + the CEOS doc set ([ROLE.md](chitti-4wheeler/ROLE.md), [swarm/](chitti-4wheeler/swarm/), [evals/](chitti-4wheeler/evals/)). HIGH-risk (safety) swarm changes require Sire's approval. |
| **Stale data rule** | Same as 2-wheeler — manufacturer service tables annually, parts monthly, recalls weekly (manufacturer + ARAI). |

## 14. Chitti Logo & Video — intentional honest stub

| Field | Value |
|---|---|
| **Objective** | Stub product — SVG monogram generator + queued mock video — kept honest until a real video-generation API is wired. |
| **Primary user** | Small business / shopkeeper wanting a free logo + short brand video to share on WhatsApp Business. |
| **Success metric** | (a) Logo download count; (b) mock-video queue length (signal of unmet demand for the real provider); (c) honest-stub disclosure click-through. |
| **Quality standard** | **Observability = None is correct until the product graduates** (YELLOW by design per QUALITY_STATUS.md §1); every response surfaces *"this is a queued mock — real video pending provider integration"*; no fake demo asset ever shipped as a real generated video. |
| **Scope** | **Does:** SVG monogram generation, queue + status of a future video request. **Does NOT:** generate real video today, charge money, ship anything claiming to be AI-generated video. |
| **Evolution owner** | [chitti-logo-video/skills/FEATURES.md](chitti-logo-video/skills/FEATURES.md). Graduates to 🟢 + full Observability when real provider API key is in Railway env. |
| **Stale data rule** | Monogram templates updated only on Sire request. Mock-video queue purged monthly (status: *"still waiting"* with the original queue date preserved). |

## 15. Chitti Founder — aggregator + business continuity

| Field | Value |
|---|---|
| **Objective** | Aggregate every Chitti's quality signals (audit, feedback, swarm, carbon) and run the BCP layers — self-ping every 4 min, daily / weekly / hourly reports to Sire, LLM-fallback chain shim. |
| **Primary user** | Sire (Bryan), as the founder dashboard. |
| **Success metric** | (a) 72-h autonomous uptime (BCP target); (b) on-time delivery of DAILY 07:00 / WEEKLY Sun 08:00 / HOURLY :15 reports; (c) alert dispatch latency from non-200 → Sire's inbox (debounced 1 h per Chitti). |
| **Quality standard** | BCP Layer 1 self-ping every 4 min — **NOT UptimeRobot, NOT any external monitor** (matches §2 row "Uptime mechanism"); honest stub returning `False` on unset SMTP / SMS / GH-token / Claude / Gemini env (cron stays green); aggregator-only — never a per-Chitti producer (its own HTTP rows in `quality_audit` would be circular). |
| **Scope** | **Does:** Self-ping all Chitti `/health`, DAILY 07:00 IST quality+defect email, WEEKLY Sun 08:00 IST trend digest, HOURLY :15 escalator pass, Sunday 09:00 IST Swarm pass, LLM fallback shim chain (DeepSeek → Claude → Gemini, surfaces honest fallback notice — never silent). **Does NOT:** expose user-facing endpoints, originate LLM responses, replace per-Chitti observability, swallow failures silently. |
| **Evolution owner** | [chitti-founder/backend/main.py](chitti-founder/backend/main.py), [lib/founder_report.py](lib/founder_report.py), [lib/chitti_quality.py](lib/chitti_quality.py). Sire approves every new cron + report column. |
| **Stale data rule** | Quality slices recomputed per cron tick (no caching of stale slices). Self-ping log retained 30 days, then rolled up to weekly aggregates. Aggregator never caches user data. `"Chitti forget"` tombstones honoured across every aggregate. |

---

## Cross-Chitti rules (apply to every SOP above)

These are not per-Chitti — they are the floor every Chitti inherits. Listed here so a future reader sees them once, not 15 times:

1. **DeepSeek is the sole LLM provider** ([§2 row 2](SAHAYAI_MASTER.md)). Anthropic SDK is removed from every backend. Layer-5 BCP allows Claude → Gemini fallback ONLY when DeepSeek returns 5xx three times in a row, and the fallback is surfaced honestly — never silent.
2. **Turso libSQL is the sole DB** ([§2 row 3](SAHAYAI_MASTER.md)) via the embedded-replica pattern (`libsql-experimental` + local SQLite + bg sync). Direct Hrana via `sqlalchemy-libsql` is not supported. **Railway env `DATABASE_URL` must be the `libsql://…` form** — see [QUALITY_STATUS.md §5 round 2 fleet-wide gap](QUALITY_STATUS.md).
3. **Frontend 5-gate audit (§1a)** is a merge-blocker for every Chitti HTML page: feedback-widget.js + `data-chitti-response`, `chitti_a11y.js`, Disability Profile prompt on first visit, language auto-detect, ISL plugin. Every page is 🔴 until verified on production.
4. **Per-response widget on every response box** ([§7 LOCKED 2026-05-13](SAHAYAI_MASTER.md)). 4 icons (🔊 / 🤖 / 👍 / 👎) + per-box feedback window. No page ships without this. Ever.
5. **Camera Intelligence contract** ([§2b](SAHAYAI_MASTER.md)) on every Chitti with camera access: what / where / when / result / user / satisfaction, anonymised before aggregation, `"Chitti forget"` deletes all (tombstone preserved).
6. **Swarm Intelligence cycle** ([§2f](SAHAYAI_MASTER.md)) — daily collect → weekly validate (≥100 confirmations) → monthly push to `skills/*.md` → quarterly review. HIGH-risk Chittis (Legal / CA / MedUPI) require Sire's approval before any skill update lands.
7. **Honest stubs over fake demos** ([§3 #4](SAHAYAI_MASTER.md)). When data / API / model isn't ready, the response says so. The four-user contract makes silent failures unacceptable — they break blind / illiterate users worst.
8. **Locked decisions in §2 are not learnable.** Swarm can propose new capabilities; it can never override LLM provider, voice substrate, emergency protocol, four-user contract, ISL, per-response widget, camera intelligence, knowledge-corpus expert grades, or Vaani-sole-interface.

## Maintenance

This file is updated when:

- A new Chitti is locked into the platform (add a new section + bump the count; update §4 of [SAHAYAI_MASTER.md](SAHAYAI_MASTER.md) first).
- A Chitti's scope changes materially (e.g. Logo & Video graduates from honest stub; 2-/4-wheeler gains OBD2 capture).
- A locked decision in [SAHAYAI_MASTER.md §2](SAHAYAI_MASTER.md) changes — update the master first, then propagate here.
- A "Stale data rule" cadence is revised because the underlying source moved (e.g. PIB poll interval changes).

If anything below contradicts [SAHAYAI_MASTER.md](SAHAYAI_MASTER.md) or [QUALITY_STATUS.md](QUALITY_STATUS.md), those win. Update this file to match.
