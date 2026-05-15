"""
Quality & Scope Improvement directive (2026-05-15) — appends a uniform
section to each of 15 Chitti FEATURES.md files. Most items mark COMING
SOON per the new-products process (SAHAYAI_MASTER.md §2a) so the
Feature Discovery Box (§2d) surfaces them as visible-but-honest TODO.

Two items are flagged REJECTED with reasoning (they violate
feedback_design_from_pwd_user_perspective): "Did Chitti understand
you? YES/NO after every routed response" + "Rating after 3 uses". The
per-response widget §7 already collects the same signal without
breaking blind / mute / illiterate users with pre-action confirmations.

Run from repo root:
    python tools/update_features_2026_05_15.py

Idempotent — skips files that already carry the section.
"""
from pathlib import Path
from datetime import date

REPO = Path(__file__).resolve().parents[1]
TODAY = date.today().isoformat()

SECTION_HEADER = """

---

## 2a. Quality & Scope improvements — queued 2026-05-15

Per the *Quality & Scope Improvement directive* dated 2026-05-15. Items
land here first as a capability surface that the [Feature Discovery
Box](../../chitti_features.js) reads live; COMING SOON badges show until
the backend/UI work is wired per the [new-products process
(§2a)](../../SAHAYAI_MASTER.md). Locked decisions in §2 are never
relitigated by this section — the swarm + Sire may *propose* new
capabilities; locks (LLM provider, voice substrate, emergency protocol,
four-user contract, ISL, per-response widget, camera intelligence,
knowledge-corpus expert grades, Vaani sole interface) never move.

"""

CROSS_FOOTER = """

### Cross-Chitti improvements (substrate — every page inherits)

The 2026-05-15 directive's cross-cutting items #1–#10 ship as
substrate features in [`chitti_a11y.js`](../../chitti_a11y.js) so every
Chitti page inherits them without per-page edits:

| # | Cross-Chitti item | Where it lives | Status |
|---|---|---|---|
| 1 | Offline mode for basic queries | `chitti_offline.js` (service-worker cache + connectivity badge) | wired since 2026-05-14 |
| 2 | WhatsApp share on every response | `Chitti.a11y.share(text, opts)` | shipped 2026-05-15 |
| 3 | Save as PDF / print scoped to a node | `Chitti.a11y.print(el, opts)` | shipped 2026-05-15 |
| 4 | Voice input everywhere | Voice Factory cascade via `Chitti.a11y.speak` / Web Speech API on every page | wired since 2026-05-12 |
| 5 | Low-data / 2G mode | `chitti_offline.js` + `effectiveType <= 2g` heuristic; user-overridable via Disability Profile "rural / low connectivity" | wired since 2026-05-14 |
| 6 | Battery saver auto-dark below 20% | `Chitti.a11y.setBatterySaver()` + `html[data-chitti-batt="save"]` CSS | shipped 2026-05-15 |
| 7 | Font size large / medium / small | `Chitti.a11y.setFontSize('lg'\\|'md'\\|'sm')` | shipped 2026-05-15 |
| 8 | "Chitti forget" — one-tap local wipe | `Chitti.a11y.forget(scope)` + tombstone preserved for honest counts | shipped 2026-05-15 |
| 9 | Session history (last 5 questions) | `Chitti.a11y.history.{push,list,clear,mount}` per-Chitti scope | shipped 2026-05-15 |
| 10 | Rating after 3 uses | **REJECTED** — see "Rejected items" below | — |

### Confidence-score chip — shared primitive

The 2026-05-15 directive asks several Chittis to show a confidence
score on every answer (MedUPI strip scan, CA tax answer, Scanner FSSAI
flag, etc.). Rather than each backend hand-rolling a different chip,
the rendering primitive lives in `Chitti.a11y.renderConfidence(target,
pct, opts)` — the backend emits a number, the substrate renders the
coloured pill (green ≥ 80%, amber 50–79%, red < 50%). Below 70% the
chip carries a `Please verify` line; if `opts.verifyWith` is set, the
chip's `title` says where to verify (e.g. "FSSAI portal" / "your CA").

### Rejected items — directive-level reroute (2026-05-15)

The following two items conflict with [`feedback_design_from_pwd_user_perspective`](../../SAHAYAI_MASTER.md):

| Item | Why rejected | What we do instead |
|---|---|---|
| *"Did Chitti understand you? YES/NO after every routed response"* | Pre-action / pre-feedback modals **break blind / mute / illiterate users** — the four-user contract floor. We already collect per-response 👍 / 👎 + voice-or-text feedback on every box via the [per-response widget §7](../../feedback-widget.js). Adding a second YES/NO confirmation is redundant + creates a forced choice every turn. | The existing 4-icon row (🔊 · 🤖 · 👍 · 👎) covers the same intent; a 👎 click opens the per-box feedback window scoped to that response. No second prompt. |
| *"Rating after 3 uses — ask user to rate Chitti 1–5"* | Same anti-pattern as above. Generic SaaS rating prompts assume a literate, tap-fluent user. Forcing a 1–5 modal pesters elderly / illiterate / blind users and lowers honest feedback quality (rate-to-dismiss bias). | The per-response widget already produces a far richer signal — every box's 👍 / 👎 rolls into the Founder's daily 07:00 IST quality slice + the Sunday digest. Per-response signals beat point-in-time rating modals on every dimension. |

Both rejections are documented here, not silently dropped, so any
future revisit knows the reasoning. If Sire wants either of these
shipped anyway, the override lives in `Chitti.a11y` and either can be
wired in a future patch.

"""


def Q(tag, item, how):
    return (tag, item, how)


def S(tag, item, prio, surface):
    return (tag, item, prio, surface)


CHITTI_DATA = {
    "chitti-vaani": {
        "quality": [
            Q("Q1", "Confidence score on every routed response — *e.g. \"90% sure this is a medical question — routed to Chitti MedUPI\"*. Implementation: backend emits a `route_confidence` field on the router response; frontend renders via [`Chitti.a11y.renderConfidence`](../../chitti_a11y.js).", "Wires through the existing `route_intent()` in `vaani_service.py` — add the DeepSeek classifier's top-1 probability to the response payload."),
            Q("Q2", "Confidence < 70% → confirm before routing — *\"I think this is a CA question, shall I route to Chitti CA?\"* spoken aloud + tap-to-confirm. Reuses the existing aria-live region.", "Add a confirmation step in the router when `route_confidence < 0.70`. Voice-confirm by saying \"haan\" (same pattern as the consent gate). Never silently route on low confidence."),
            Q("Q3", "Emergency keyword list — add Bangla / Tamil / Telugu / Marathi regional words (today the spotter is Hindi + English).", "Extend `EMERGENCY_KEYWORDS` in `vaani_service.py` with regional variants. Sourced from `chitti-vaani/skills/PSYCHOLOGY.md` distress lexicon + medical glossary."),
            Q("Q4", "Psychology responses **must always end with helpline cascade** — Tele-MANAS 14416 + iCall + Vandrevala + NIMHANS (per [PSYCHOLOGY.md](PSYCHOLOGY.md) therapist-boundary lock).", "Server-enforced disclaimer at the response footer for any reply where the DeepSeek system prompt selected the psychology corpus path. Never client-controlled."),
        ],
        "rejected_q5": True,
        "scope": [
            S("S1", "Daily Good Morning briefing", "P1", "User's chosen language; weather (open-meteo or IMD) + top news (Chitti News API) + health tip (curated). Time configurable per user (default 07:00 IST)."),
            S("S2", "Birthday + anniversary reminders", "P2", "Local-only storage (`chitti_vaani_dates` localStorage key); never sent to a server; rings on the day at user-chosen time."),
            S("S3", "\"Chitti, remind me\" — voice reminder system", "P1", "Voice-trigger keyword + duration parser (\"in 2 hours\" / \"at 3 pm\" / \"tomorrow morning\"); reminders fire via Notification API + read-aloud."),
            S("S4", "Nearest hospital / police / fire — always available offline (cached)", "**P0** (safety)", "Cached district-level emergency-service list per pincode; `chitti_offline.js` service-worker keeps the last-known list per device. Reads from `Chitti.location` + a bundled `emergency_services_by_pincode.json`."),
            S("S5", "\"Chitti, I am lost\" — current location + nearest landmark", "P1", "Uses `Chitti.location.get()` + reverse-geocode (Nominatim or open-source); spoken aloud + WhatsApp-shareable so a family member can come find them."),
        ],
    },
    "chitti-medupi": {
        "quality": [
            Q("Q1", "Every medicine result shows **Brand price · Generic price · Jan Aushadhi price** — all three, always. Empty value shows `—` honestly, never silently dropped.", "Extend `medupi_pricing.py` to compute all three for every match; render in a 3-column grid on `chitti_medupi.html`."),
            Q("Q2", "Savings amount in big bold numbers — *\"You save ₹340 by switching to generic\"* — spoken aloud for blind users + WhatsApp-shareable.", "Compute `savings = max_price - jan_aushadhi_price`; render as a hero chip; auto-speak in user's language on first display."),
            Q("Q3", "NPPA ceiling violation — red warning if the pharmacy charges above the NPPA ceiling.", "Add `nppa_ceiling_violation` boolean to every pricing payload; frontend renders a red `⚠️ Above NPPA ceiling` chip; copy-to-clipboard a complaint draft pre-addressed to NPPA grievance portal."),
            Q("Q4", "Expiry reminder **at add-to-wallet time** — not just on expiry day. User chooses lead-time (default 7 days).", "Family Wallet already stores `expiry_date`; add a cron in `medupi_wallet.py` that emits an in-app + Notification API reminder lead_time before expiry."),
            Q("Q5", "Strip scan confidence level — render via [`Chitti.a11y.renderConfidence`](../../chitti_a11y.js). If `< 80%`, say *\"I am not fully sure, please verify with pharmacist\"*. Already wired in `medupi_recognition.py` — exposes `confidence` in the vision response.", "Frontend reads `confidence`, calls `renderConfidence(el, confidence, { verifyWith: 'your pharmacist' })`. Below 70% the chip carries the verify hint automatically."),
        ],
        "scope": [
            S("S1", "Medicine interaction checker — *\"Is it safe to take Medicine A with Medicine B?\"*", "**P0** (safety)", "DeepSeek with strict-mode prompt + a curated `drug_interactions.json` seed (built from openFDA / NIH MedlinePlus). HIGH-risk Swarm gate — never auto-promote new patterns."),
            S("S2", "Nearest Jan Aushadhi store locator (5 km / 25 km auto-expand)", "P1", "Uses `Chitti.location.get()` + the Jan Aushadhi store directory (CSV publicly available). 5 km metro / 25 km tier-2/3 — same radius rule as the Vaani local-business lookup."),
            S("S3", "Prescription photo → full medicine list extracted automatically", "P1", "DeepSeek vision (same path as `analyze_image`); strict JSON output `{ medicines: [{ name, strength, form, frequency }] }`; honest `unclear` per row when confidence < 70%."),
            S("S4", "\"Out of stock\" alert — notify when a Jan Aushadhi store gets stock of a searched medicine", "P2", "Per-device watchlist (local-only); periodic poll of the Jan Aushadhi stock API (when partner access lands — **COMING SOON** for inventory feed)."),
            S("S5", "PMJAY / Ayushman Bharat coverage check", "P1", "DeepSeek + curated `pmjay_covered_medicines.json` (seed from the PMJAY package list). Cross-link to Chitti Government's PMJAY eligibility checker."),
        ],
    },
    "chitti-ca": {
        "quality": [
            Q("Q1", "Cite the **exact Section number** on every response — *\"Section 80C of Income Tax Act, 1961\"*. Already in the CA_KNOWLEDGE.md corpus; enforce in the system prompt with a required-format check.", "System-prompt update + an output-schema rail in `lib/quadrails.py` that flags any answer lacking a `Section X` citation for HIGH-risk topics."),
            Q("Q2", "**Disclaimer BEFORE the answer**, not after. Compliance INJECT rail prepends instead of appending.", "[`lib/hooks.py::wrap_llm`](../../lib/hooks.py) — change `compliance_inject` to support `position='prepend'` for HIGH-risk Chittis. CA + Legal flip to prepend; MedUPI keeps the existing `legal_lines` JSON-field position because vision output is structured."),
            Q("Q3", "Built-in calculators for HRA / 80C / 80D / NPS — deterministic numbers, DeepSeek explains. Mirrors the C3 pattern from §2 above.", "Add `services/ca_calculators.py` (pure-Python, no LLM) for each deduction. DeepSeek wraps the result with the user's narrative context."),
            Q("Q4", "Budget 2025 changes highlighted **separately** in every relevant answer — visible `Budget 2025 update` chip.", "Tag every line in CA_KNOWLEDGE.md with a `<!-- budget-2025 -->` HTML comment; the response renderer extracts and re-highlights those lines."),
            Q("Q5", "Confidence score on every answer via [`Chitti.a11y.renderConfidence`](../../chitti_a11y.js) — *\"High confidence (CA Final grade)\"* vs *\"Medium — please verify with your CA\"*.", "Wrap CA responses with a judge call (`lib/evaluators.py`) that emits a 0–1 confidence; frontend renders the chip + auto-attaches `verifyWith: 'your CA'` when below 70%."),
        ],
        "scope": [
            S("S1", "ITR form selector — *\"Which ITR form should I file?\"* based on income type (salary / business / capital gains / etc.).", "P1", "Decision tree in `ca_itr_selector.py` (deterministic — never LLM); LLM only narrates the result. Updated annually for the FY's ITR-1 → ITR-7 form revisions."),
            S("S2", "GST HSN code finder — search by product description.", "P1", "DeepSeek + a curated `hsn_codes.json` seed (from CBIC). User describes the product, Chitti returns the HSN code + GST rate + reasoning."),
            S("S3", "TDS calendar — all TDS due dates for the current month.", "P1", "Cron-generated calendar (no LLM); cross-references Section 192 / 194 / 195 etc. dates per FY. Renders as a tappable date grid."),
            S("S4", "Advance tax calculator — quarterly amounts.", "P1", "Pure calculator + LLM narrative. Reuses Q3 deduction modules."),
            S("S5", "Form 26AS explainer — what each entry means in plain Hindi / regional language.", "P2", "User pastes Form 26AS text (or PDF upload — COMING SOON); LLM explains TDS / TCS / refund entries with citations."),
            S("S6", "New Tax Regime vs Old Tax Regime — comparison with **user's actual numbers**.", "**P0** (annually relevant)", "Deterministic comparator + LLM narrative. Output: side-by-side ₹ difference + recommendation. Already in CA_KNOWLEDGE.md — surface as a tap-to-launch flow."),
        ],
    },
    "chitti-legal": {
        "quality": [
            Q("Q1", "Cite **exact Act + Section** on every response — *\"Section 138 of the Negotiable Instruments Act, 1881\"*. Output-schema rail flags any HIGH-risk reply missing a citation.", "Same enforcement as CA Q1 — `lib/quadrails.py` rail."),
            Q("Q2", "**Disclaimer BEFORE the answer.** Same change as CA Q2 — Compliance INJECT rail `position='prepend'`.", "Shared `lib/hooks.py` update with CA Q2."),
            Q("Q3", "For **BNS 2023** — always show old IPC equivalent section for reference (users know old numbers).", "Add `bns_to_ipc_map.json` (publicly available from MHA gazette); enrich every BNS answer with `(IPC §X equivalent)` parenthetical."),
            Q("Q4", "Landmark SC judgment cited when relevant — year + case name (*\"Vishaka v. State of Rajasthan, 1997\"*).", "LEGAL_KNOWLEDGE.md already carries landmark judgments; system-prompt requires citation when topic matches."),
            Q("Q5", "Multi-state question → ask user's state first, then give state-specific answer.", "State detector in the system prompt; if the topic touches state law (rent, family, etc.) and no state given, ask before answering. Voice-confirm in user's language."),
        ],
        "scope": [
            S("S1", "Legal notice draft generator — user describes situation, Chitti drafts.", "**P0**", "Strict-template DeepSeek output + LEGAL_KNOWLEDGE.md grounding. Add a disclaimer block at the top of the draft + WhatsApp/PDF share via [`Chitti.a11y`](../../chitti_a11y.js)."),
            S("S2", "RTI application draft generator — plain language RTI for any government department.", "P1", "Template-driven (RTI Act §6); user fills 5 fields by voice/tap; output ready to print or email."),
            S("S3", "Consumer complaint draft — RERA / Consumer Forum / NCDRC.", "P1", "Same template approach as S2; choose forum based on value/category."),
            S("S4", "Rent agreement checklist — what must be in a valid rent agreement by state.", "P1", "State-specific checklist from LEGAL_KNOWLEDGE.md state-law section; user's state from Q5 detector."),
            S("S5", "DPDP 2023 explainer — *\"What are my data rights?\"* for common users.", "P1", "Already deep in LEGAL_KNOWLEDGE.md; surface as a tap-to-launch flow with 6 cards (access / correction / deletion / portability / consent withdrawal / grievance)."),
            S("S6", "FIR guide — how to file, what to say, what NOT to say.", "**P0** (safety)", "Procedural walkthrough + a \"what NOT to say\" callout (right against self-incrimination, Article 20(3)). State-specific procedure notes."),
            S("S7", "Anticipatory bail explainer — when to apply, how to apply.", "P1", "CrPC §438 → BNSS §482; explains threshold, court hierarchy, and timing. Lawyer-handover suggestion at the end."),
        ],
    },
    "chitti-government": {
        "quality": [
            Q("Q1", "Eligibility wizard — ask **5 qualifying questions** before showing schemes (age / income / category / state / occupation). Never show the full 30+ scheme list to everyone.", "Decision tree in `government_eligibility.py` (deterministic — no LLM). LLM only narrates the result + missing-document checklist."),
            Q("Q2", "Document checklist must be **specific** — *\"Aadhaar\"*, not *\"ID proof\"*. Each scheme carries an explicit `documents_required: []` array.", "Audit the 30-scheme seed catalog; every scheme gets a typed checklist. PIB poll adds new schemes with the same shape."),
            Q("Q3", "Application deadline shown **prominently** — red badge if within 30 days, amber if within 90, green otherwise.", "Frontend renders `deadline_iso` + auto-coloured badge. No silent expiry — closed schemes carry a `closed_on` field."),
            Q("Q4", "State-specific schemes → ask user's state first.", "Same state-detector pattern as Legal Q5. Already partially wired via `Chitti.location.pincode` — extend to surface the state name."),
            Q("Q5", "*\"Applied\"* button — user marks when they applied; Chitti tracks status across visits.", "Per-device list (local-only); reminder cron checks back in 30 days asking *\"Did you hear back?\"* for status tracker."),
        ],
        "scope": [
            S("S1", "PM-KISAN payment status checker", "P1", "Deep-link into the PM-KISAN portal with prefilled Aadhaar (user-consented; never stored). Read the resulting page aloud."),
            S("S2", "Ayushman Bharat / PMJAY eligibility checker", "**P0** (health)", "Decision tree based on SECC-2011 categorisation; cross-link from MedUPI's PMJAY medicine coverage flow."),
            S("S3", "Ration card status + entitlement checker", "P1", "Per-state portal deep-link; LLM narrates the entitlement table for the user's category (AAY / PHH)."),
            S("S4", "Scholarship finder for students — state + category + class", "P1", "Filter the existing scheme catalog by `category: education`; future: pull from NSP (National Scholarship Portal) directly when API access lands."),
            S("S5", "MGNREGA work availability in user's block", "P1", "Deep-link into the MGNREGA MIS for the user's panchayat (derived from pincode). Narrates job-card status."),
            S("S6", "DigiLocker document fetch — **COMING SOON** until partner approval lands", "P1", "Honest stub; local-upload flow remains the user-facing path. When approval arrives, swap the upload step for an OAuth-bound DigiLocker fetch."),
            S("S7", "Grievance filing guide — which portal for which complaint", "P1", "Decision tree mapping complaint type → CPGRAMS / RBI ombudsman / SACHET / consumer forum / etc."),
        ],
    },
    "chitti-news": {
        "quality": [
            Q("Q1", "Fact-check verdict shows **source count** — *\"Verified by 3 sources\"* vs *\"Only 1 source — treat with caution\"*.", "Extend `news_factcheck.py` output: `corroborating_sources: int`. Frontend renders an inline count chip next to the verdict."),
            Q("Q2", "Politics agent — visible **equal-coverage meter** — *\"Sources: 2 Left · 2 Centre · 2 Right\"*.", "Tag each RSS source in `RSS_SOURCES.md` with a `lean: left|centre|right` field (founder-curated). Factchecker exposes the counts; frontend renders a 3-bar meter."),
            Q("Q3", "*Chitti's Take* **never exceeds 3 bullets**. Truncate at 3, never append a 4th, never silently merge.", "Output-schema rail in `news_summary.py` truncates strictly; honest if the article needed more depth (say *\"More on the full article — tap to read\"*)."),
            Q("Q4", "Articles older than **24 hours** show age prominently — *\"Published 2 days ago\"* chip at top, not buried in metadata.", "Frontend computes `Date.now() - pubDate` per render; renders an age chip with `aria-live='polite'` so screen readers pick it up."),
            Q("Q5", "**Sensitive news** (death / disaster / communal) — *\"This may be distressing\"* warning. Auto-on for Disability Profile users with `cognitive: true` or `elderly: true`.", "Sub-agent emits `sensitivity: 'distressing'|'normal'`; frontend renders an opt-in reveal (\"Tap to read — may be distressing\"). Profile-aware default-on for sensitive readers."),
        ],
        "scope": [
            S("S1", "State filter — show only news from user's state by default. Already partially in [Vaani's geo work](../../chitti-vaani/skills/FEATURES.md) — extend to News.", "**P0**", "Reuse `Chitti.location.pincode` → state mapping; per-device sticky preference."),
            S("S2", "Language filter — show news in user's language (not just Hindi / English).", "**P0**", "Activate the v1.1 regional-language stub feeds for Tamil / Telugu / Bangla / Marathi / Kannada / Malayalam / Gujarati / Punjabi. Per-language source curation needed."),
            S("S3", "Read Later folder — save articles to read later (already partial — surface across pages).", "P1", "Already in `chitti_news.html` as a folder; expose `Chitti.news.readLater.add(article)` so other Chittis can deep-link."),
            S("S4", "Share article via WhatsApp — one tap. Uses [`Chitti.a11y.share`](../../chitti_a11y.js).", "P1", "Add a 📲 button on every article card; tap → `Chitti.a11y.share(title + url)`."),
            S("S5", "*\"More like this\"* — show similar articles after reading.", "P1", "Tag articles with topic + entity vectors during ingestion (today: stemmed keyword overlap; future: embedding-based)."),
            S("S6", "Weekly news digest — Sunday morning summary of the week's top 5 stories in user's language.", "P1", "Cron at Sunday 07:30 IST per language; ranks by per-user category preference + global engagement; emails via the existing Founder SMTP helper. Mirrors the chitti-founder weekly trend cadence."),
        ],
    },
    "chitti-news-ai": {
        "quality": [
            Q("Q1", "Every tool listing shows **Free / Paid / Freemium** clearly.", "Required field on every tool record; honest `unknown` when not yet classified — never silently default to `free`."),
            Q("Q2", "India-relevant tools have an **\"Available in India\"** badge. Tools that geo-block India carry a `\"Not available in India — VPN may be needed\"` honest disclosure.", "Curated `availability: ['IN','GLOBAL']` field per tool; periodic re-check during the existing trust-verification pass."),
            Q("Q3", "Honest 501 endpoints — show estimated launch date OR *\"No ETA\"* — never blank. *\"Tool comparison launching by 2026-06\"* if a date exists; *\"No ETA\"* otherwise.", "Stub responses already return 501; enrich with `eta_iso: null|'2026-06-15'` field surfaced in the UI."),
            Q("Q4", "Verification tag **explains why** — *\"Verified: found on Product Hunt + TechCrunch\"* — not just a green tick.", "Factchecker (mirrors chitti-news verdict shape) returns `corroborating_sources: ['Product Hunt', 'TechCrunch']`. Frontend renders the source list inline."),
        ],
        "scope": [
            S("S1", "*\"Indian AI tools\"* filter — show only India-built AI products.", "P1", "Filter by `origin_country: 'IN'` field; surfaces BharatGPT, Bhashini, Krutrim, Sarvam, etc."),
            S("S2", "Weekly digest — top 5 AI launches of the week, in user's language.", "P1", "Same Sunday-cron pattern as chitti-news S6."),
            S("S3", "*\"Will this replace my job?\"* — honest explainer for each tool category.", "P2", "Curated reasoning per category (writing assistant / code assistant / image gen / data extraction etc.); never speculative — flag tools where the honest answer is *\"unclear yet\"*."),
            S("S4", "AI tool comparison — *\"Compare Tool A vs Tool B\"* — honest table.", "**COMING SOON**", "Endpoint exists as a 501 today; LLM-generated comparison with `sources_n` ≥ 2 required before publishing."),
            S("S5", "Government AI initiatives tracker — BharatGPT, Bhashini, IndiaAI Mission updates.", "P1", "Dedicated RSS sub-feed; surfaces every PIB / MeitY release tagged AI."),
        ],
    },
    "chitti-upi": {
        "quality": [
            Q("Q1", "Verdict cites **exact RBI rule number** — *\"RBI Master Direction on Digital Payment Security Controls, 2021 §6.3\"* — not just *\"RBI says\"*.", "Already in the 2026 RBI rule cards seed; output-schema rail flags any HIGH verdict without a rule citation."),
            Q("Q2", "**HIGH risk** verdict names the **exact fraud pattern** matched — *\"Prize money scam pattern (sender claims lottery winnings, asks for processing fee)\"*.", "Pattern catalog in `upi_fraud_patterns.json` with named entries; classifier returns `pattern_matched: 'prize_scam'` and frontend renders the full description."),
            Q("Q3", "*\"Report this number\"* — sends the user to the RBI SACHET portal pre-filled with the suspect number.", "Deep-link `https://sachet.rbi.org.in/Complaints/Add?mobile=<NUMBER>` (verify exact param shape on the portal). Voice-narrated for blind users."),
            Q("Q4", "Recent similar scam reports from community (anonymised, aggregated) — *\"3 users in your district reported this exact pattern this week\"*.", "Reads the Swarm Intelligence pattern store; matches by stemmed text + pincode bucket. Pure aggregate — no per-user data."),
            Q("Q5", "Response time **under 3 seconds** — fraud decisions cannot be slow. Already measured in [QUALITY_STATUS.md §5](../../QUALITY_STATUS.md) via SLA header; add a SLO breach alert in `chitti-founder` escalator.", "Add `chitti-upi p95_latency_ms > 3000` to the hourly :15 escalator pass. SMS Sire on breach."),
        ],
        "scope": [
            S("S1", "QR code scanner — scan before paying; Chitti checks if the merchant is registered.", "**P0**", "Camera capture via [`chitti_camera.js`](../../chitti_camera.js) + UPI deeplink parser (`upi://pay?pa=...`); check against the NPCI merchant registry (when API access lands — **COMING SOON** for live merchant lookup)."),
            S("S2", "UPI ID validator — *\"Is this UPI ID legitimate?\"*", "P1", "Pattern check (must match `handle@psp` format with known PSP list) + history check (has any user paid this VPA without flagging fraud)."),
            S("S3", "Bank SMS decoder — paste any bank SMS, Chitti explains what happened.", "P1", "Pattern library of all major-bank SMS templates (HDFC / SBI / ICICI / Axis / Kotak / etc.); explains debit / credit / OTP / failed-transaction in plain language."),
            S("S4", "*\"Safe payment checklist\"* — 5 questions before any large UPI payment.", "**P0**", "Voice-walkthrough: *\"Do you know this person? · Did you initiate this? · Is the amount correct? · Did anyone pressure you? · Can you call them to confirm?\"* Locked from the curated UPI fraud-pattern data."),
            S("S5", "Cybercrime helpline **1930** — always shown on HIGH risk verdict, spoken aloud, one-tap call.", "**P0**", "`<a href=\"tel:1930\">` button rendered on every HIGH verdict + spoken in user's language via Voice Factory."),
        ],
    },
    "chitti-scanner": {
        "quality": [
            Q("Q1", "Confidence level on every scan via [`Chitti.a11y.renderConfidence`](../../chitti_a11y.js) — *\"85% confident this is genuine\"*.", "Already exposed in `scanner_service.analyze_text` + `analyze_image` (DeepSeek vision returns `confidence`); frontend renders the chip per scan."),
            Q("Q2", "Confidence < 70% → *\"I cannot be sure. Please check with FSSAI portal directly\"*. Auto-attached by `renderConfidence({ verifyWith: 'FSSAI portal' })`.", "Already in the renderConfidence primitive — pass `verifyWith` per Chitti."),
            Q("Q3", "Community alert if same product flagged by **≥ 3 users in same district** in the last 7 days.", "Reads the Camera Intelligence aggregate (§2b) joined on pincode + product fingerprint; surfaces a red banner before the user pays for the scan."),
            Q("Q4", "MedUPI deep-link **immediately** when a medicine strip is scanned — not buried below FSSAI / pricing.", "Frontend re-orders the result cards when `product_type === 'medicine'`: MedUPI card renders first, FSSAI / community alert below."),
        ],
        "scope": [
            S("S1", "Food label decoder — scan packaged food, explain every ingredient in plain language.", "P1", "DeepSeek vision + curated `food_additives.json` (E-numbers, INS codes, common allergens). Each ingredient gets a *what is it / is it safe for me* card."),
            S("S2", "Calorie + nutrition display — *\"Good for diabetics? · Good for BP patients?\"*", "**P0** (health)", "Reads the nutrition panel via vision + applies dietary heuristics from a curated `dietary_rules.json` (sugar > 5g/100g → caution for diabetics; sodium > 400mg/100g → caution for BP). HIGH-risk Swarm gate."),
            S("S3", "*\"Best before\"* vs *\"Expiry date\"* explainer — many users confuse these.", "P1", "Vision detects which label was printed; renders an inline tooltip with the difference in user's language. Pure UX win for low-literacy users."),
            S("S4", "Fake currency detector — camera scan of a note, check security features.", "P2", "RBI security feature checklist (water-mark / latent image / colour-shifting ink / micro-letters). Honest *\"I am not the final authority — verify at a bank\"*."),
            S("S5", "Gem + jewellery hallmark — BIS certified check.", "P2", "BIS hallmark structure check (purity mark / centre logo / fineness / year). Cross-link to BIS Care app for definitive verification."),
            S("S6", "ISI mark verification for electrical products.", "P2", "Detect ISI mark presence + extract the licence number; cross-link to BIS portal lookup."),
        ],
    },
    "chitti-complete-technical": {
        "quality": [
            Q("Q1", "**NOT SEBI REGISTERED** sticky bar must be **RED** — never white / grey. (Already locked in [`project_legal_disclaimer`](../../SAHAYAI_MASTER.md); audit the CSS on every Shares-backed page.)", "Frontend audit: `chitti_complete_technical.html` + `chitti_fundamentals.html` — verify the `.sebi-bar` background is `#dc2626` or equivalent red; never pastel."),
            Q("Q2", "Every recommendation shows **risk badge** — LOW (green) / MEDIUM (amber) / HIGH (red).", "Backend already classifies; frontend renders a coloured pill alongside the recommendation. Uses the same colour palette as `Chitti.a11y.renderConfidence` for visual consistency."),
            Q("Q3", "**Story Mode** in all 9 Vaani languages — not just English. Already in CHITTI_TECHNICAL_MASTER_SPEC.md as a target; surface the missing-language honestly until each lands.", "Per-language story-mode templates in `chitti-shares/backend/services/story_mode_*.py`. Honest *\"Story Mode in Tamil — COMING SOON\"* when the template is missing."),
            Q("Q4", "Roshan composite shows **confidence interval** — not just a number — *\"Roshan: 72 (range 65–78, high agreement)\"*.", "Composite already aggregates 43 indicators; expose `roshan_low`, `roshan_high` based on the per-indicator vote spread. Frontend renders inline."),
            Q("Q5", "Market closed state shown **clearly** — *\"Market closed. Prices from last close (15:30 IST).\"* Spoken aloud for blind users on first render after-hours.", "Backend already emits `market_status: 'closed'|'open'`; frontend reads + renders a banner; auto-speak via `Chitti.a11y.speak` when first shown."),
        ],
        "scope": [
            S("S1", "SIP calculator — how much to invest monthly to reach a goal.", "P1", "Pure calculator (no LLM) — input goal amount + tenure + expected return → monthly SIP. LLM narrates."),
            S("S2", "FD vs Mutual Fund vs Gold comparison — plain language for new investors.", "P1", "Static comparison table + LLM personalisation for user's risk profile (asked once, stored locally)."),
            S("S3", "Budget 2025 impact on stocks — which sectors benefit / lose.", "P1", "Curated `budget_2025_sector_impact.md` + LLM narrative; surfaces during the post-Budget weeks."),
            S("S4", "IPO tracker — upcoming IPOs with plain-language prospectus summary.", "P1", "Reads from NSE / BSE IPO calendars + DeepSeek summarises the DRHP. Honest *\"This is a summary, not a recommendation\"* footer."),
            S("S5", "*\"Explain this term\"* — user taps any financial term, Chitti gives a plain-Hindi explanation.", "**P0**", "Already partially in Story Mode; extract into a reusable substrate so every chart label / metric is tap-explainable."),
            S("S6", "Portfolio tracker — local-only, never on server. Add stocks → total gain / loss.", "P2", "`localStorage` portfolio; cross-references with the existing prices feed; honest *\"This is your local copy only, never synced\"* footer."),
        ],
    },
    "chitti-fundamentals": {
        "quality": [
            Q("Q1", "Mirror of [chitti-complete-technical Q1–Q5](../../chitti-complete-technical/skills/FEATURES.md) — same RED SEBI bar, risk badges, language coverage, confidence intervals, market-closed banner. The two pages share the chitti-shares backend so the substrate fixes apply once.", "Same enforcement points as chitti-complete-technical."),
        ],
        "scope": [
            S("S1", "Same as [chitti-complete-technical scope](../../chitti-complete-technical/skills/FEATURES.md) — SIP calc, FD/MF/Gold comparison, Budget impact, IPO tracker, Explain-this-term, Portfolio tracker.", "P1–P2", "Backend is shared (chitti-shares-api); both pages surface the same APIs."),
        ],
    },
    "chitti-voice-factory": {
        "quality": [
            Q("Q1", "**Hall of Fame** shows voice-donor count **per language** — motivates more donations (\"Hindi has 142 voices · Bhojpuri has 4 — your voice unlocks a milestone\").", "Aggregate over the donations table (per-language COUNT); render on `chitti_voice_hall_of_fame.html`."),
            Q("Q2", "Quality threshold per donor visible — *\"Your voice needs 5 more recordings to qualify for the public cascade\"*.", "Per-donor progress bar + remaining count; gates promotion from local copy to cascade."),
            Q("Q3", "Tier C honest failure **names the language** — *\"Tulu is not yet supported. Try Kannada?\"* — never silent fallback (already locked).", "Already in the cascade contract; verify the error message is in user's language."),
            Q("Q4", "Fluency score per language shown publicly — builds trust (*\"Hindi: 92/100 · Bhojpuri: 28/100 — early-stage\"*).", "Reads from the fluency-pipeline aggregate; renders on the language picker + Hall of Fame."),
        ],
        "scope": [
            S("S1", "Voice cloning opt-in — user donates their voice, Chitti uses it for **that user only**.", "P1", "Strict consent flow (voice-grant pattern from Vaani T&C). Per-device-only synthesis until the user explicitly approves community use. Honest *\"Your voice will never be used to impersonate you to anyone else\"* contract."),
            S("S2", "Children's voice mode — slower, simpler words for elderly + first-time users.", "**P0**", "Modulates speech rate (× 0.85) + vocabulary substitution (curated *simple word list* per language). Auto-on when Disability Profile has `elderly: true` or `illiterate: true`."),
            S("S3", "Dialect support — Mumbai Hindi vs Delhi Hindi vs Bhojpuri variants.", "P2", "Per-dialect TTS model when available; honest fallback to the parent language otherwise — *\"Speaking in standard Hindi; Bhojpuri TTS is in training\"*."),
            S("S4", "Hall of Fame badge for donors — surface on every Chitti page footer when the donor's recordings are in use.", "P2", "Per-device badge; never tied to identity beyond the donor's chosen handle."),
        ],
    },
    "chitti-2wheeler": {
        "quality": [
            Q("Q1", "Service interval **specific to make / model / year** — never generic. Ask bike details first.", "Onboarding wizard (make + model + year + odometer); decision tree maps to OEM service-book intervals."),
            Q("Q2", "DIY vs Mechanic shows **cost difference** — *\"DIY saves ₹800 vs the mechanic's quoted ₹2,000\"*.", "Per-task cost-band table (parts only vs parts + labour) sourced from a curated `2wheeler_costs.json`."),
            Q("Q3", "Recall notices shown **prominently** if the user's bike model has an active recall (per ARAI / OEM feeds).", "Periodic poll of ARAI recall list + per-OEM announcements; banner on every page when the user's bike model matches."),
        ],
        "scope": [
            S("S1", "Fuel efficiency tracker — user logs fuel fills, Chitti tracks mileage.", "P1", "Local-only log; cross-references against the OEM-claimed mileage; alerts if user's mileage drops > 15% (possible service due)."),
            S("S2", "Insurance renewal reminder — before expiry.", "**P0** (legal compliance)", "Per-policy reminder set at user-entered expiry date; voice + Notification API."),
            S("S3", "Pollution certificate (PUC) reminder.", "**P0**", "Same pattern as S2; PUC validity varies by state — state-aware reminder."),
            S("S4", "Nearest authorised service centre locator.", "P1", "Per-OEM service-centre database (publicly available); uses `Chitti.location` for ranking."),
            S("S5", "Spare-part price comparison — 3 sources shown.", "P1", "OEM-MRP + Amazon / Flipkart prices + local-mechanic estimate; honest *\"local mechanic price is approximate\"* footer."),
            S("S6", "*\"Is this garage overcharging me?\"* — user describes the repair, Chitti gives a fair price range.", "P1", "Reuses the cost-band table from Q2; surfaces median + 25/75 percentile."),
        ],
    },
    "chitti-4wheeler": {
        "quality": [
            Q("Q1–Q3", "Mirror of [chitti-2wheeler Q1–Q3](../../chitti-2wheeler/skills/FEATURES.md) — make/model-specific intervals, DIY-vs-mechanic cost delta, recall notices.", "Same backend pattern; 4wheeler-specific OEM catalogs."),
            Q("Q4", "**OBD2 interpreter** — user describes the error code (P0420 / P0301 / etc.), Chitti explains in plain language. **Interpreter only — not reader.** No phone-to-OBD adapter needed.", "Curated `obd2_codes.json` (~2,000 OBD-II generic + manufacturer-specific codes). LLM narrates severity + likely cause + DIY-vs-mechanic recommendation."),
        ],
        "scope": [
            S("S1–S6", "Mirror of chitti-2wheeler S1–S6 — fuel tracking, insurance / PUC reminders, service centre locator, spare-part comparison, garage-fair-price.", "P0–P1", "Same modules."),
            S("S7", "EMI calculator — loan amount, tenure, interest rate → monthly EMI.", "P1", "Pure calculator + LLM narrative; compares against user's monthly budget when entered."),
            S("S8", "Electric vehicle range estimator — based on AC usage, load, terrain.", "P1", "Per-EV-model lookup table + adjustment factors; honest *\"this is an estimate, real range depends on driving style\"* footer."),
            S("S9", "Traffic-fine checker — how to pay, how to contest.", "P1", "State-specific portal deep-links (vahan.parivahan.gov.in fronts most states). LLM explains the violation + how to contest under the Motor Vehicles Act."),
            S("S10", "FASTag recharge reminder + balance-checker guide.", "P1", "Reminder cron when balance is low (user-entered) + bank/portal-specific recharge instructions."),
        ],
    },
    "chitti-logo-video": {
        "quality": [
            Q("Q1", "Stub endpoints show **queue position** — *\"You are #47 in queue for video generation\"*.", "Honest counter per stub call; never randomised or invented. Increments only when a real request lands; auto-cleared on stub deploy."),
            Q("Q2", "Stub disclosure **spoken aloud for blind users** — not just shown as text.", "Auto-speak via `Chitti.a11y.speak` on first stub response when the Disability Profile has `blind: true`."),
            Q("Q3", "SVG monogram — offer **5 style options** — minimal / bold / traditional (devanagari-aware) / modern / handwritten.", "Add `style` param to the SVG generator; per-style font + stroke + colour palette. Preview gallery on `chitti_logo_video.html`."),
        ],
        "scope": [
            S("S1", "WhatsApp Business banner generator — **COMING SOON** (needs the real video / image provider).", "P1", "Honest stub. SVG composition path could ship sooner (no video needed); raster banners need a provider."),
            S("S2", "Festival greeting card generator — Diwali / Eid / Christmas / Pongal / Bihu / Onam / Pohela Boishakh / Gurpurab / Buddha Purnima / Mahavir Jayanti / etc.", "P1", "Template-driven (festival ⇒ SVG layout + culturally-appropriate motifs); user adds their business name + greeting. Ships SVG immediately; PNG/JPEG export needs a renderer (**COMING SOON**)."),
            S("S3", "Business visiting card generator.", "P1", "Standard 90×54mm SVG template + user data; same SVG-first path as S2."),
            S("S4", "Shop board design in regional language — *\"शर्मा जी की किराना दुकान\"* / *\"ஷர்மா மளிகை கடை\"* — local-script aware.", "P1", "Devanagari / Tamil / Telugu / Kannada / Bengali / Gujarati / Malayalam / Punjabi SVG fonts bundled; LLM proposes a layout based on shop type."),
        ],
    },
    "chitti-founder": {
        "quality": [
            Q("Q1", "Daily 07:00 IST report shows **GREEN / RED / degraded** per Chitti — already partially via the daily slice; surface a one-line status column at the top of the email.", "Add `health_status: 'green'|'amber'|'red'` to each row in `WeeklyTrendRow` + the daily slice; derived from last-7-day `thumbs_up_pct` + BCP Layer-1 `/health` non-200 count."),
            Q("Q2", "Alert debounce — **1 hour per Chitti** — never spam Sire's inbox. Already implemented (BCP Layer-1 `HEALTH_ALERT_COOLDOWN_S`); verified via QUALITY_STATUS.md §5.", "Existing — verify in `chitti-founder/backend/main.py::run_self_ping`."),
            Q("Q3", "Swarm Sunday pass shows **new patterns found + promoted to skills** — shipped in commit `81317b8` (the three new sections in the weekly digest).", "Already live — see [`lib/chitti_quality.render_swarm_section_html`](../../lib/chitti_quality.py)."),
        ],
        "scope": [
            S("S1", "Weekly revenue forecast — **COMING SOON** until monetisation begins.", "P3", "Honest stub; reads from a `revenue_v1.db` table that is empty today."),
            S("S2", "User-growth dashboard — DAU / WAU / MAU per Chitti.", "P1", "Aggregated from the `quality_audit` per-request rows; renders on a new `/admin/founder/growth` endpoint."),
            S("S3", "Feedback sentiment summary — top 3 complaints + compliments per Chitti per week.", "P1", "DeepSeek-clusters the `quality_feedback` table's free-text by sentiment; honest *\"insufficient data\"* below ≥ 20 entries / week."),
            S("S4", "Database-size tracker per Turso DB — alert when approaching free-tier limit (9 GB).", "**P0**", "Daily cron polls `turso db inspect <db>` size; emails Sire at 6 GB / 7.5 GB / 8.5 GB thresholds."),
        ],
    },
}


def render_section(slug, data):
    lines = [SECTION_HEADER.strip("\n")]

    if data.get("quality"):
        lines.append("\n### Quality\n")
        lines.append("| # | Item | How to apply |")
        lines.append("|---|---|---|")
        for tag, item, how in data["quality"]:
            lines.append("| {} | {} | {} |".format(tag, item, how))
        lines.append("")

    if data.get("rejected_q5"):
        lines.append(
            "\n**Q5 *(rejected — see \"Rejected items\" below)*:** *\"Did Chitti understand you? YES/NO after every routed response\"* — conflicts with [`feedback_design_from_pwd_user_perspective`](../../SAHAYAI_MASTER.md). The per-response widget already collects 👍 / 👎 per box; a second YES/NO modal pesters blind / mute / illiterate users with a forced choice every turn.\n"
        )

    if data.get("scope"):
        lines.append("\n### Scope\n")
        lines.append("| # | Item | Priority | Surface needed |")
        lines.append("|---|---|---|---|")
        for tag, item, prio, surface in data["scope"]:
            lines.append("| {} | {} | {} | {} |".format(tag, item, prio, surface))
        lines.append("")

    lines.append(CROSS_FOOTER.strip("\n"))
    return "\n".join(lines) + "\n"


for slug, data in CHITTI_DATA.items():
    fpath = REPO / slug / "skills" / "FEATURES.md"
    section = render_section(slug, data)
    if fpath.exists():
        existing = fpath.read_text(encoding="utf-8")
        if "## 2a. Quality & Scope improvements — queued 2026-05-15" in existing:
            print("SKIP (already has section): {}".format(fpath.relative_to(REPO)))
            continue
        fpath.write_text(existing.rstrip() + "\n" + section, encoding="utf-8")
        print("APPENDED: {}".format(fpath.relative_to(REPO)))
    else:
        if slug == "chitti-founder":
            (REPO / slug / "skills").mkdir(parents=True, exist_ok=True)
            preamble = (
                "# Chitti Founder — FEATURES\n\n"
                "Internal aggregator + BCP Layer-1 self-ping. **Not a user-facing Chitti** — surface only on Sire's dashboard.\n"
                "Honest inventory: **Built** (verified end-to-end) · **Planned** (queued, no working endpoint yet) · **Future** (needs new substrate). Same contract as [`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md).\n\n"
                "Last touched: **{}**.\n\n".format(TODAY) +
                "---\n\n"
                "## 1. Built and working\n"
                "- Self-ping every 4 minutes — hits every Chitti `/health` (BCP Layer 1, SAHAYAI_MASTER §2e).\n"
                "- Daily 07:00 IST quality + defect-rate email to Sire.\n"
                "- Weekly Sunday 08:00 IST trend digest — now embeds the Swarm Intelligence weekly pass (3 sections per [commit 81317b8](../../chitti-founder/backend/main.py)).\n"
                "- Hourly :15 escalator pass — low-thumbs → SMS, repeating defect → GitHub issue, > 0.5 g CO₂ → carbon issue.\n"
                "- On-demand `/admin/founder/swarm` endpoint (auth via `Authorization: Bearer $ADMIN_SECRET`).\n"
                "- LLM fallback shim — DeepSeek → Claude → Gemini honest cascade (BCP Layer 5, never silent).\n\n"
                "---\n\n"
                "## 2. Planned — queued 2026-05-13\n"
                "_See [TODO.md](../TODO.md) once it lands; for now this section is co-located with the 2026-05-15 directive below._\n"
            )
            fpath.write_text(preamble + section, encoding="utf-8")
            print("CREATED: {}".format(fpath.relative_to(REPO)))
        else:
            print("MISSING: {}".format(fpath.relative_to(REPO)))

print("done")
