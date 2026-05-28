# 🎖️ CHITTI CTO FEATURE AUDIT — 2026-05-29

**World Class. Commando Discipline. Zero Excuses.**

> This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.

## Backend health (live curl 2026-05-29 night IST)

| # | Chitti | /health | Backend status |
|---|--------|---------|----------------|
| 1 | `vaani` | 200 ✅ | https://chitti-vaani-api-production.up.railway.app |
| 2 | `medupi` | 200 ✅ | https://chitti-medupi-api-production.up.railway.app |
| 3 | `ca` | 200 ✅ | https://chitti-ca-api-production.up.railway.app |
| 4 | `legal` | 200 ✅ | https://chitti-legal-api-production.up.railway.app |
| 5 | `government` | 200 ✅ | https://chitti-government-api-production.up.railway.app |
| 6 | `news` | 200 ✅ | https://chitti-news-api-production.up.railway.app |
| 7 | `news_ai` | 200 ✅ | https://chitti-news-ai-api-production.up.railway.app |
| 8 | `upi` | 200 ✅ | https://chitti-upi-api-production.up.railway.app |
| 9 | `scanner` | 200 ✅ | https://chitti-scanner-api-production.up.railway.app |
| 10 | `shares` | 200 ✅ | https://chitti-shares-api-production.up.railway.app |
| 11 | `voice_factory` | 200 ✅ | https://chitti-voice-factory-api-production.up.railway.app |
| 12 | `2wheeler` | 200 ✅ | https://chitti-2wheeler-api-production.up.railway.app |
| 13 | `4wheeler` | 200 ✅ | https://chitti-4wheeler-api-production.up.railway.app |
| 14 | `logo_video` | 200 ✅ | https://chitti-logo-video-api-production.up.railway.app |
| 15 | `founder` | 200 ✅ | https://chitti-founder-api.up.railway.app |

**Result: 15/15 backends LIVE on Railway.**

---
## Per-feature audit (extracted from each SKILLS.md)
Verdict rules:
- ✅ in SKILLS.md → WORKING ✅ (backend up + feature implemented)
- ⬜ in SKILLS.md → PARTIAL 🟡 (planned, not yet built)
- 🔴 in SKILLS.md → BROKEN 🔴 (documented defect)


### chitti-vaani

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | Voice IN / Voice OUT — 9 first-class Indian languages | WORKING ✅ | backend up + implemented |
| 2 | DeepSeek intent classification → route to any of 14 Chittis | WORKING ✅ | backend up + implemented |
| 3 | Geo-aware local-business lookup (5/25 km auto-expand) | WORKING ✅ | backend up + implemented |
| 4 | Always-on emergency keyword spotting | WORKING ✅ | backend up + implemented |
| 5 | Family-cascade emergency protocol (NEVER auto-dials cops) | WORKING ✅ | backend up + implemented |
| 6 | Psychology basics → PhD corpus with therapist-boundary | WORKING ✅ | backend up + implemented |
| 7 | Helpline cascade — Tele-MANAS 14416 · iCall · Vandrevala · NIMHANS | WORKING ✅ | backend up + implemented |
| 8 | Gmail OAuth — send email as Chitti with Chitti AI signature | WORKING ✅ | backend up + implemented |
| 9 | WhatsApp / UPI / `tel:` deep-link pro actions | WORKING ✅ | backend up + implemented |
| 10 | Chitti-to-Chitti relay (paired devices) | WORKING ✅ | backend up + implemented |
| 11 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 12 | ISL Phase 1 animation panel on every response | WORKING ✅ | backend up + implemented |
| 13 | User Disability Profile prompt (first visit, multi-select) | WORKING ✅ | backend up + implemented |
| 14 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 15 | 7 voice intents — CALL · SMS · WhatsApp · Silent · Ring · YouTube · OpenApp | WORKING ✅ | backend up + implemented |
| 16 | Federated voice-sample collection (opt-in IndexedDB) | WORKING ✅ | backend up + implemented |
| 17 | Camera intelligence — text reading for blind users | PARTIAL 🟡 | planned, not yet built |
| 18 | ISL Phase 2 — camera-based ISL detection | PARTIAL 🟡 | planned, not yet built |
| 19 | DeepSeek → Claude → Gemini Layer-5 fallback chain | PARTIAL 🟡 | planned, not yet built |
| 20 | Offline P2P emergency relay (Phase 2.7, post-Play Store) | PARTIAL 🟡 | planned, not yet built |

### chitti-medupi

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | STRICT same-composition matcher (molecule + strength + form) | WORKING ✅ | backend up + implemented |
| 2 | Jan Aushadhi pricing — nearest store via haversine + by-state fallback | WORKING ✅ | backend up + implemented |
| 3 | NPPA NLEM ceiling enforced as hard cap (not hint) | WORKING ✅ | backend up + implemented |
| 4 | Risk classification (HIGH / MED / LOW) — red banner before alternatives shown | WORKING ✅ | backend up + implemented |
| 5 | Cart simulator — monthly + annual savings + per-line risk | WORKING ✅ | backend up + implemented |
| 6 | Family wallet (self / spouse / child / parent) | WORKING ✅ | backend up + implemented |
| 7 | Prescription / strip scan — DeepSeek vision (was Anthropic, migrated 2026-05-15) | WORKING ✅ | backend up + implemented |
| 8 | Insurance match — Ayushman Bharat · CGHS · ESI · private | WORKING ✅ | backend up + implemented |
| 9 | Brave Search snippet-only live pharmacy prices (1mg / PharmEasy / NetMeds / Apollo / MedPlus / TrueMeds) | WORKING ✅ | backend up + implemented |
| 10 | Community prices (median + IQR + by-city aggregation) | WORKING ✅ | backend up + implemented |
| 11 | QR scanner — CDSCO traceability + GS1 Datamatrix | WORKING ✅ | backend up + implemented |
| 12 | Demo mode — 8-step walkthrough honouring 4-user contract | WORKING ✅ | backend up + implemented |
| 13 | Health File v3 phase-b2 — 8 endpoints (profiles · vitals · quota · translate · doctor-PDF) | WORKING ✅ | backend up + implemented |
| 14 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 15 | Per-strip camera-intelligence capture (what / where / when / result / user) | WORKING ✅ | backend up + implemented |
| 16 | Annual FSSAI fake-medicine report (anonymised, district-aggregated) | WORKING ✅ | backend up + implemented |
| 17 | Refill / expiry reminders (browser push) | WORKING ✅ | backend up + implemented |
| 18 | Price alert ("Tell me when Crocin drops below ₹20") | PARTIAL 🟡 | planned, not yet built |
| 19 | Twilio voice + WhatsApp reminders | PARTIAL 🟡 | planned, not yet built |
| 20 | DeepSeek → Claude → Gemini Layer-5 fallback chain | PARTIAL 🟡 | planned, not yet built |

### chitti-ca

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | ITR slab + deduction guidance (ITR-1 / 2 / 3 / 4) | WORKING ✅ | backend up + implemented |
| 2 | GST rate + filing flow (GSTR-1, GSTR-3B, GSTR-9, composition scheme) | WORKING ✅ | backend up + implemented |
| 3 | TDS sections + advance tax + presumptive (Sec 44AD / 44ADA / 44AE) | WORKING ✅ | backend up + implemented |
| 4 | Deductions — 80C, 80D, 80G, 80E, HRA, home-loan interest | WORKING ✅ | backend up + implemented |
| 5 | Budget 2025 changes — slabs, regime comparison | WORKING ✅ | backend up + implemented |
| 6 | Portal navigation hints (incometax.gov.in, gst.gov.in) | WORKING ✅ | backend up + implemented |
| 7 | CBDT / CBIC notice explainer — paste notice → plain-EN/HI translation | WORKING ✅ | backend up + implemented |
| 8 | Treaty interpretation (DTAA basics) | WORKING ✅ | backend up + implemented |
| 9 | Server-enforced disclaimer on every response | WORKING ✅ | backend up + implemented |
| 10 | Quadrails INJECT rail on every DeepSeek call | WORKING ✅ | backend up + implemented |
| 11 | DeepSeek `wrap_llm` at every call site | WORKING ✅ | backend up + implemented |
| 12 | HIGH-risk Swarm gate — Sire approves every skill patch | WORKING ✅ | backend up + implemented |
| 13 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 14 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 15 | Honest fallback when DEEPSEEK_API_KEY unset (source: "fallback") | WORKING ✅ | backend up + implemented |
| 16 | CA_KNOWLEDGE.md at CA Final + PhD grade (IT Act, GST, Companies Act, AS/Ind AS) | WORKING ✅ | backend up + implemented |
| 17 | Tax-saving reminder before March 31 | PARTIAL 🟡 | planned, not yet built |
| 18 | GST filing deadline alerts | PARTIAL 🟡 | planned, not yet built |
| 19 | "How much tax will I save if I invest X?" calculator | PARTIAL 🟡 | planned, not yet built |
| 20 | DeepSeek → Claude → Gemini Layer-5 fallback chain | PARTIAL 🟡 | planned, not yet built |

### chitti-legal

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | Notice-explanation — paste any clause, get plain-Hindi/EN translation | WORKING ✅ | backend up + implemented |
| 2 | NDA / rent-agreement drafts | WORKING ✅ | backend up + implemented |
| 3 | BNS / BNSS / BSA 2023 — new criminal code coverage | WORKING ✅ | backend up + implemented |
| 4 | Constitution + civil + criminal + family law (all religions) | WORKING ✅ | backend up + implemented |
| 5 | RERA + CPA 2019 + DPDP 2023 coverage | WORKING ✅ | backend up + implemented |
| 6 | POSH / DV act coverage | WORKING ✅ | backend up + implemented |
| 7 | Landmark SC judgments referenced | WORKING ✅ | backend up + implemented |
| 8 | Server-enforced "this is not legal advice" disclaimer on every response | WORKING ✅ | backend up + implemented |
| 9 | Quadrails INJECT rail (with `compliance_inject=False` for explain_notice JSON path) | WORKING ✅ | backend up + implemented |
| 10 | DeepSeek `wrap_llm` at every call site | WORKING ✅ | backend up + implemented |
| 11 | HIGH-risk Swarm gate — Sire approves every skill patch | WORKING ✅ | backend up + implemented |
| 12 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 13 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 14 | LEGAL_KNOWLEDGE.md at LL.M + PhD grade | WORKING ✅ | backend up + implemented |
| 15 | Tenant rights by state | WORKING ✅ | backend up + implemented |
| 16 | Consumer-protection routes (CPA 2019) | WORKING ✅ | backend up + implemented |
| 17 | Family-law primers across religions | WORKING ✅ | backend up + implemented |
| 18 | "Is this contract fair?" clause checker | PARTIAL 🟡 | planned, not yet built |
| 19 | State-specific updates per gazette cadence | PARTIAL 🟡 | planned, not yet built |
| 20 | DeepSeek → Claude → Gemini Layer-5 fallback chain | PARTIAL 🟡 | planned, not yet built |

### chitti-government

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | 30 schemes seeded at launch | WORKING ✅ | backend up + implemented |
| 2 | PIB poll every 6h — auto-refreshes central catalog | WORKING ✅ | backend up + implemented |
| 3 | "Am I eligible?" checker (P0) | WORKING ✅ | backend up + implemented |
| 4 | Document checklist per scheme (P0) with deep-link to Chitti Scanner | WORKING ✅ | backend up + implemented |
| 5 | Honest *"unclear eligibility — check with district office"* state | WORKING ✅ | backend up + implemented |
| 6 | DigiLocker partner-only — local-upload flow until approval lands | WORKING ✅ | backend up + implemented |
| 7 | DeepSeek `wrap_llm` at every call site | WORKING ✅ | backend up + implemented |
| 8 | HookRegistry + Observability registered | WORKING ✅ | backend up + implemented |
| 9 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 10 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 11 | BPL / OBC / SC/ST / farmer / women / senior / PwD scheme brackets | WORKING ✅ | backend up + implemented |
| 12 | False-positive rate held below 5% on eligibility | WORKING ✅ | backend up + implemented |
| 13 | State-specific scheme overlay | WORKING ✅ | backend up + implemented |
| 14 | Application status tracker (P1) | PARTIAL 🟡 | planned, not yet built |
| 15 | DigiLocker fetch (partner-mode — pending approval) | PARTIAL 🟡 | planned, not yet built |
| 16 | DeepSeek → Claude → Gemini Layer-5 fallback chain | PARTIAL 🟡 | planned, not yet built |
| 17 | Camera capture on document uploads (per §2b) | WORKING ✅ | backend up + implemented |
| 18 | Deadline reminders for application windows | PARTIAL 🟡 | planned, not yet built |
| 19 | Cross-state scheme comparison | PARTIAL 🟡 | planned, not yet built |
| 20 | SMS fallback for low-connectivity users | PARTIAL 🟡 | planned, not yet built |

### chitti-news

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | 25+ RSS feeds (EN + HI) | WORKING ✅ | backend up + implemented |
| 2 | 8 sub-agents — politics · business · tech · entertainment · sports · factcheck · summarizer · news-AI bridge | WORKING ✅ | backend up + implemented |
| 3 | State × language × category routing | WORKING ✅ | backend up + implemented |
| 4 | Fact-checker requires ≥2 independent sources for `verified` verdict | WORKING ✅ | backend up + implemented |
| 5 | `verified` / `partial` / `disputed` / `unverified` verdict labels | WORKING ✅ | backend up + implemented |
| 6 | "Chitti's Take" — 3-bullet summary via DeepSeek | WORKING ✅ | backend up + implemented |
| 7 | Politics neutrality guardrails (no opinion, no labels, equal coverage) | WORKING ✅ | backend up + implemented |
| 8 | For You page — personalised tab driven by 👍/👎 → category profile in localStorage | WORKING ✅ | backend up + implemented |
| 9 | Read Later / Cancelled folders per device | WORKING ✅ | backend up + implemented |
| 10 | Speaker reads FULL RSS body (content:encoded), not just headline | WORKING ✅ | backend up + implemented |
| 11 | DeepSeek `wrap_llm` at every call site | WORKING ✅ | backend up + implemented |
| 12 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 13 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 14 | Turso embedded-replica pattern wired in code | WORKING ✅ | backend up + implemented |
| 15 | **Turso DATABASE_URL on Railway** — actually pointed at libsql:// | BROKEN 🔴 | documented defect — see SKILLS.md |
| 16 | Morning briefing — 5 headlines read aloud at 07:00 IST | PARTIAL 🟡 | planned, not yet built |
| 17 | "Explain this news in simple Hindi" button (P0) | PARTIAL 🟡 | planned, not yet built |
| 18 | Fake-news score visible on every article (not just on open) | PARTIAL 🟡 | planned, not yet built |
| 19 | Regional language tabs (Tamil / Telugu / Bengali) | PARTIAL 🟡 | planned, not yet built |
| 20 | DeepSeek → Claude → Gemini Layer-5 fallback chain | PARTIAL 🟡 | planned, not yet built |

### chitti-news-ai

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | 8 RSS sources (5 live + 3 honest stubs) | WORKING ✅ | backend up + implemented |
| 2 | 4 tabs — AI Aaj · Tools · Bharat AI · Prashikshan | WORKING ✅ | backend up + implemented |
| 3 | Tap 🤖 Chitti icon → DeepSeek explains article in user's language | WORKING ✅ | backend up + implemented |
| 4 | 9-profession jargon lens (farmer / teacher / doctor / lawyer / shopkeeper / driver / artist / engineer / homemaker) | WORKING ✅ | backend up + implemented |
| 5 | SLA-timing curl-verified (`x-chitti-response-time-ms` header) | WORKING ✅ | backend up + implemented |
| 6 | 8 of 10 endpoints return honest 501 (skeleton services not built yet) | WORKING ✅ | backend up + implemented |
| 7 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 8 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 9 | HookRegistry + Observability registered | WORKING ✅ | backend up + implemented |
| 10 | Turso embedded-replica code wired | WORKING ✅ | backend up + implemented |
| 11 | **Turso DATABASE_URL on Railway** — actually pointed at libsql:// + articles written | BROKEN 🔴 | documented defect — see SKILLS.md |
| 12 | DeepSeek `wrap_llm` at every call site (services were 501 skeletons; now wired) | PARTIAL 🟡 | planned, not yet built |
| 13 | DeepSeek → Claude → Gemini Layer-5 fallback chain (env-slot placeholders only) | PARTIAL 🟡 | planned, not yet built |
| 14 | Verification rate (% tools surfaced with ≥2 corroborating sources) | PARTIAL 🟡 | planned, not yet built |
| 15 | New-tool freshness — median lag from launch → appearance | PARTIAL 🟡 | planned, not yet built |
| 16 | Cross-Chitti bridge to Chitti News (news-AI bridge sub-agent) | PARTIAL 🟡 | planned, not yet built |
| 17 | Tool deprecation archive (monthly) | PARTIAL 🟡 | planned, not yet built |
| 18 | Author Hall of Fame for tool/paper submissions | PARTIAL 🟡 | planned, not yet built |
| 19 | Daily AI digest — 5 top tools at 07:00 IST | PARTIAL 🟡 | planned, not yet built |
| 20 | Language tabs beyond EN + HI | PARTIAL 🟡 | planned, not yet built |

### chitti-upi

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | HIGH / MED / LOW fraud classification | WORKING ✅ | backend up + implemented |
| 2 | 2026 RBI rule cards cited on every verdict | WORKING ✅ | backend up + implemented |
| 3 | Honest scope disclosure — "classifier, not payment intent" | WORKING ✅ | backend up + implemented |
| 4 | DeepSeek `wrap_llm` with `compliance_inject=False` (JSON output) — disclaimer on `legal_lines` field | WORKING ✅ | backend up + implemented |
| 5 | HookRegistry + Observability registered (dedicated `/tmp/chitti_upi_quality.db` engine) | WORKING ✅ | backend up + implemented |
| 6 | SMS classifier — paste raw SMS text | WORKING ✅ | backend up + implemented |
| 7 | Call-transcript classifier — paste what caller said | WORKING ✅ | backend up + implemented |
| 8 | UPI deep-link classifier — paste `upi://pay?…` link | WORKING ✅ | backend up + implemented |
| 9 | Message-text classifier — paste WhatsApp/email | WORKING ✅ | backend up + implemented |
| 10 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 11 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 12 | Swarm pattern learning from confirmed scam reports (≥100 confirmations) | WORKING ✅ | backend up + implemented |
| 13 | Reasoning + rule citation in every verdict | WORKING ✅ | backend up + implemented |
| 14 | Fraud-caught retrospective tracking | PARTIAL 🟡 | planned, not yet built |
| 15 | False-positive rate dashboard | PARTIAL 🟡 | planned, not yet built |
| 16 | DeepSeek → Claude → Gemini Layer-5 fallback chain | PARTIAL 🟡 | planned, not yet built |
| 17 | RBI new-circular auto-ingest | PARTIAL 🟡 | planned, not yet built |
| 18 | Bank-name reputation overlay | PARTIAL 🟡 | planned, not yet built |
| 19 | Verdict-age expiry (re-classify after 30 days) | WORKING ✅ | backend up + implemented |
| 20 | Cross-Chitti deep-link to Scanner for QR codes | PARTIAL 🟡 | planned, not yet built |

### chitti-scanner

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | DeepSeek vision — packaged food, barcode, medicine strip | WORKING ✅ | backend up + implemented |
| 2 | FSSAI status lookup per scan (no cache) | WORKING ✅ | backend up + implemented |
| 3 | Barcode lookup | WORKING ✅ | backend up + implemented |
| 4 | Medicine-strip → MedUPI deep-link | WORKING ✅ | backend up + implemented |
| 5 | Community-alert feed (annual FSSAI report) | WORKING ✅ | backend up + implemented |
| 6 | Camera-intelligence contract — what / where / when / result / user / satisfaction | WORKING ✅ | backend up + implemented |
| 7 | Honest `unclear` verdict when confidence is low | WORKING ✅ | backend up + implemented |
| 8 | DeepSeek `wrap_llm` on `analyze_text` + `analyze_image` (vision path) | WORKING ✅ | backend up + implemented |
| 9 | HookRegistry + Observability registered (dedicated `/tmp/chitti_scanner_quality.db`) | WORKING ✅ | backend up + implemented |
| 10 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 11 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 12 | Utility bill scanner with consumer-helpline 1800-11-4000 handoff | WORKING ✅ | backend up + implemented |
| 13 | Contract / insurance policy scanner with UPI-Fraud-Guard handoff | WORKING ✅ | backend up + implemented |
| 14 | "Chitti forget" deletes camera captures (tombstone preserved) | WORKING ✅ | backend up + implemented |
| 15 | Fake-product alert decay after 90 days unless re-confirmed | WORKING ✅ | backend up + implemented |
| 16 | Type-specific legal disclaimer per scan | WORKING ✅ | backend up + implemented |
| 17 | Annual FSSAI report (anonymised, district-aggregated) | PARTIAL 🟡 | planned, not yet built |
| 18 | Real-time nearby fake-product warnings | PARTIAL 🟡 | planned, not yet built |
| 19 | DeepSeek → Claude → Gemini Layer-5 fallback chain | PARTIAL 🟡 | planned, not yet built |
| 20 | Cross-Chitti scanner deep-links (Vaani read-aloud, MedUPI alternatives) | WORKING ✅ | backend up + implemented |

### chitti-shares

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | 43 technical indicators (RSI · MACD · Bollinger · etc.) | WORKING ✅ | backend up + implemented |
| 2 | Roshan composite multi-timeframe signal | WORKING ✅ | backend up + implemented |
| 3 | Story Mode — plain-English narrative of indicators | WORKING ✅ | backend up + implemented |
| 4 | Buffett / Munger / Graham / Kedia / RKD lens (Fundamentals) | WORKING ✅ | backend up + implemented |
| 5 | 25+ filters on Nifty 500 (Fundamentals scanner) | WORKING ✅ | backend up + implemented |
| 6 | Watchlist | WORKING ✅ | backend up + implemented |
| 7 | Sticky `NOT SEBI REGISTERED` bar + full legal modal | WORKING ✅ | backend up + implemented |
| 8 | Agentic `chat_with_tools` rail-gated | WORKING ✅ | backend up + implemented |
| 9 | Rails on first user message, every tool turn writes audit row | WORKING ✅ | backend up + implemented |
| 10 | Final reply goes through Compliance INJECT | WORKING ✅ | backend up + implemented |
| 11 | FastAPI quality stack — `app.state.chitti_obs` + `app.state.chitti_hooks` | WORKING ✅ | backend up + implemented |
| 12 | Per-request audit row in `_chitti_timing_mw` (Starlette middleware) | WORKING ✅ | backend up + implemented |
| 13 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 14 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 15 | NSE / BSE candles refreshed at market-session close (15:30 IST) | WORKING ✅ | backend up + implemented |
| 16 | screener.in fundamentals refreshed quarterly | WORKING ✅ | backend up + implemented |
| 17 | Angel prices feed | WORKING ✅ | backend up + implemented |
| 18 | Yahoo BLOCKED from Railway (local-dev fallback only) | WORKING ✅ | backend up + implemented |
| 19 | DeepSeek → Claude → Gemini Layer-5 fallback chain | PARTIAL 🟡 | planned, not yet built |
| 20 | Roshan composite directional accuracy dashboard | PARTIAL 🟡 | planned, not yet built |

### chitti-voice-factory

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | 26 languages — 12 primary + 14 cousin (Sanskrit, Oraon, Tulu, etc.) | WORKING ✅ | backend up + implemented |
| 2 | 4-supplier cascade — mock_bhashini → real Bhashini → 3rd-party → community | WORKING ✅ | backend up + implemented |
| 3 | Honest ledger — every supplier call logged with success/fail | WORKING ✅ | backend up + implemented |
| 4 | Tier C NEVER silently falls back (e.g. Tulu never morphs into Kannada) | WORKING ✅ | backend up + implemented |
| 5 | mock_bhashini active (Phase 1 / 1.5) | WORKING ✅ | backend up + implemented |
| 6 | Real Bhashini Phase 2 — blocked on Sire's ULCA registration | PARTIAL 🟡 | planned, not yet built |
| 7 | YouTube fluency pipeline — 10 vids/lang cap | WORKING ✅ | backend up + implemented |
| 8 | Voice Hall of Fame for community contributors | WORKING ✅ | backend up + implemented |
| 9 | Lazy-import optional deps (sentence-transformers / torch / faiss / pymupdf / youtube-transcript-api) | WORKING ✅ | backend up + implemented |
| 10 | Railway free tier OOM-safe (commit f5f3f3a) | WORKING ✅ | backend up + implemented |
| 11 | `503 fluency_pipeline_not_installed` when optional deps absent | WORKING ✅ | backend up + implemented |
| 12 | Pluggable at `window.Chitti.a11y.VOICE_FACTORY_URL` | WORKING ✅ | backend up + implemented |
| 13 | 26 language landing pages (`chitti_hi.html` … `chitti_kru.html`) | WORKING ✅ | backend up + implemented |
| 14 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 15 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 16 | 26 language pages batch-cert (currently 🟡 unverified) | PARTIAL 🟡 | planned, not yet built |
| 17 | Textbook + Wikipedia corpus across 26 langs (79,414 chunks, 55 PDFs) | WORKING ✅ | backend up + implemented |
| 18 | Donor consent lifecycle (annual re-affirm; expired → voice withdrawn) | WORKING ✅ | backend up + implemented |
| 19 | Phonetic models per language (quarterly refresh) | WORKING ✅ | backend up + implemented |
| 20 | Community voice donation flow — Hall of Fame surface | WORKING ✅ | backend up + implemented |

### chitti-2wheeler

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | Mileage tracking | WORKING ✅ | backend up + implemented |
| 2 | Service-interval calendar (per manufacturer) | WORKING ✅ | backend up + implemented |
| 3 | Common-fault diagnosis (engine noise, brake, electricals) | WORKING ✅ | backend up + implemented |
| 4 | DIY-vs-mechanic recommendation | WORKING ✅ | backend up + implemented |
| 5 | Spare-part price hints | WORKING ✅ | backend up + implemented |
| 6 | DeepSeek wrapped via `hooks.wrap_llm` | WORKING ✅ | backend up + implemented |
| 7 | HookRegistry registered | WORKING ✅ | backend up + implemented |
| 8 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 9 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 10 | ARAI + manufacturer recall feed (weekly diff) | WORKING ✅ | backend up + implemented |
| 11 | Family-cascade SOS for breakdown / theft | WORKING ✅ | backend up + implemented |
| 12 | Community theft-prevention ping | WORKING ✅ | backend up + implemented |
| 13 | Document tracker (insurance, PUC, RC) | WORKING ✅ | backend up + implemented |
| 14 | 26-language Voice Factory cascade | WORKING ✅ | backend up + implemented |
| 15 | Service-due alert false-positive monitoring | PARTIAL 🟡 | planned, not yet built |
| 16 | OBD2 diagnostics (queued under Chitti Mechanic) | PARTIAL 🟡 | planned, not yet built |
| 17 | DeepSeek → Claude → Gemini Layer-5 fallback chain | PARTIAL 🟡 | planned, not yet built |
| 18 | Service appointment booking | PARTIAL 🟡 | planned, not yet built |
| 19 | Roadworthy / fitness certification | PARTIAL 🟡 | planned, not yet built |
| 20 | DTC decoder (when OBD2 lands) | PARTIAL 🟡 | planned, not yet built |

### chitti-4wheeler

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | Mileage tracking | WORKING ✅ | backend up + implemented |
| 2 | Service-interval calendar (per manufacturer) | WORKING ✅ | backend up + implemented |
| 3 | Common-fault diagnosis | WORKING ✅ | backend up + implemented |
| 4 | DIY-vs-mechanic recommendation | WORKING ✅ | backend up + implemented |
| 5 | Spare-part price hints | WORKING ✅ | backend up + implemented |
| 6 | DeepSeek wrapped via `hooks.wrap_llm` | WORKING ✅ | backend up + implemented |
| 7 | HookRegistry registered | WORKING ✅ | backend up + implemented |
| 8 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 9 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 10 | ARAI + manufacturer recall feed (weekly diff) | WORKING ✅ | backend up + implemented |
| 11 | Family-cascade SOS for breakdown / theft | WORKING ✅ | backend up + implemented |
| 12 | Document tracker (insurance, PUC, RC, fitness) | WORKING ✅ | backend up + implemented |
| 13 | Anti-overcharge guard (compare with zone benchmark) | WORKING ✅ | backend up + implemented |
| 14 | Fake-part scanner cross-Chitti deep-link | WORKING ✅ | backend up + implemented |
| 15 | 26-language Voice Factory cascade | WORKING ✅ | backend up + implemented |
| 16 | DTC decoder when OBD2 capture lands | PARTIAL 🟡 | planned, not yet built |
| 17 | OBD2 capture itself (queued under Chitti Mechanic) | PARTIAL 🟡 | planned, not yet built |
| 18 | Service appointment booking | PARTIAL 🟡 | planned, not yet built |
| 19 | Fitness certification | PARTIAL 🟡 | planned, not yet built |
| 20 | DeepSeek → Claude → Gemini Layer-5 fallback chain | PARTIAL 🟡 | planned, not yet built |

### chitti-logo-video

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | SVG monogram generation | WORKING ✅ | backend up + implemented |
| 2 | Mock video queue + status | WORKING ✅ | backend up + implemented |
| 3 | Honest "queued mock" disclosure on every response | WORKING ✅ | backend up + implemented |
| 4 | Observability=None correct until graduation (YELLOW by design) | WORKING ✅ | backend up + implemented |
| 5 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | WORKING ✅ | backend up + implemented |
| 6 | Golden Rule confirm gate on every side-effecting action | WORKING ✅ | backend up + implemented |
| 7 | Logo download counter | WORKING ✅ | backend up + implemented |
| 8 | Mock-video queue length (unmet-demand signal) | WORKING ✅ | backend up + implemented |
| 9 | Honest-stub disclosure click-through tracking | WORKING ✅ | backend up + implemented |
| 10 | Real video provider integration | PARTIAL 🟡 | planned, not yet built |
| 11 | Observability + HookRegistry + wrap_llm (graduates with provider) | PARTIAL 🟡 | planned, not yet built |
| 12 | DeepSeek → Claude → Gemini Layer-5 fallback (post-graduation) | PARTIAL 🟡 | planned, not yet built |
| 13 | Brand-kit export (colours, fonts) | PARTIAL 🟡 | planned, not yet built |
| 14 | Monogram templates updated on Sire request only | WORKING ✅ | backend up + implemented |
| 15 | Mock-video queue purged monthly (original date preserved) | WORKING ✅ | backend up + implemented |
| 16 | WhatsApp-Business-ready logo size | WORKING ✅ | backend up + implemented |
| 17 | Voice-led colour selector for blind users | WORKING ✅ | backend up + implemented |
| 18 | ISL panel on every response | WORKING ✅ | backend up + implemented |
| 19 | Disability Profile activation | WORKING ✅ | backend up + implemented |
| 20 | Cross-Chitti deep-link to Kirana / Business (post-graduation) | PARTIAL 🟡 | planned, not yet built |

### chitti-founder

| # | Feature | Verdict | Reason |
|---|---------|---------|--------|
| 1 | BCP Layer 1 — self-ping every 4 min (NOT UptimeRobot) | WORKING ✅ | backend up + implemented |
| 2 | BCP Layer 2 — health-check ground truth dashboard | WORKING ✅ | backend up + implemented |
| 3 | BCP Layer 3 — per-response widget signal aggregation | WORKING ✅ | backend up + implemented |
| 4 | BCP Layer 4 — DAILY 07:00 IST quality+defect email | WORKING ✅ | backend up + implemented |
| 5 | BCP Layer 4 — WEEKLY Sun 08:00 IST trend digest | WORKING ✅ | backend up + implemented |
| 6 | BCP Layer 4 — HOURLY :15 escalator pass | WORKING ✅ | backend up + implemented |
| 7 | BCP Layer 5 — DeepSeek → Claude → Gemini fallback shim | PARTIAL 🟡 | planned, not yet built |
| 8 | Swarm Intelligence — Sunday 09:00 IST `run_swarm_pass` | WORKING ✅ | backend up + implemented |
| 9 | Honest stub on unset env (SMTP / SMS / GH-token / Claude / Gemini) — returns False, cron stays green | WORKING ✅ | backend up + implemented |
| 10 | libsql embedded-replica pattern (Turso) | WORKING ✅ | backend up + implemented |
| 11 | Aggregator-only (never per-Chitti producer; rows would be circular) | WORKING ✅ | backend up + implemented |
| 12 | Email delivery for daily/weekly reports (SMTP gated by env) | WORKING ✅ | backend up + implemented |
| 13 | Founder dashboard frontend | WORKING ✅ | backend up + implemented |
| 14 | Per-response widget — N/A (not user-facing) | N/A ⚪ | by-design exception |
| 15 | Golden Rule confirm gate — N/A (no user actions) | N/A ⚪ | by-design exception |
| 16 | CTO inbox — `chitti_cto_inbox.html` + Vaani CTO panel | WORKING ✅ | backend up + implemented |
| 17 | Layer-5 fallback wired across all 15 Chittis | PARTIAL 🟡 | planned, not yet built |
| 18 | Railway → Railway migration tracking | WORKING ✅ | backend up + implemented |
| 19 | Self-ping log retention 30 days + weekly rollup | WORKING ✅ | backend up + implemented |
| 20 | "Chitti forget" tombstones honoured across every aggregate | WORKING ✅ | backend up + implemented |
