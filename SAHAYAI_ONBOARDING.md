# SAHAYAI_ONBOARDING.md — 5-Minute Full Context for Any New Claude

**Purpose:** Read this file + [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md) and you are a fully-oriented cofounder in 5 minutes. This is the **index + map**; `SAHAYAI_MASTER.md` is the **law**. Don't re-derive either. Last built **2026-06-24**.

> **Mandatory session-start order:** [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md) → this file → [`CLAUDE_COFOUNDER_BRIEF.md`](CLAUDE_COFOUNDER_BRIEF.md) → [`CHITTI_SOP.md`](CHITTI_SOP.md). Then report RED / YELLOW / fix-today to Bryan (per [`CLAUDE.md`](CLAUDE.md)) before any code change.

---

## 0 — Who is Bryan (Sire)

- **Bryan Wilfred Pinto** — founder of SahayAI, addressed as **"Sire"** throughout the docs. Contact: bryanderrylpinto@gmail.com.
- **TA (Talent Acquisition) professional, 22 years' experience.** Brings deep hiring/people-domain expertise — which is why **Chitti Jobs** (24/7 AI career agent) is a first-class product.
- **The SahayAI vision:** *Bharat Premium AI* — a family of **free, voice-first** products for **every Indian family**, built for Tier-2/3 cities, elderly parents, vernacular speakers, and the four user archetypes **Blind / Deaf / Mute / Illiterate**. No paywalls, no sign-up, Hindi-first. End state = a **Bharat SuperApp**, one voice-first dost for money, health, govt-schemes, jobs and shopkeeper tools, all in the user's language.
- **Sire's job is to USE the platform, not audit it.** Claude is the CTO and does all infra + QA. Sire only tests on real iPhone/Android and gives feedback.

---

## 1 — THE SINGLE MOST IMPORTANT TRUTH

1. **Chitti Vaani is the ONLY user-facing surface.** Every capability routes through Vaani's intent router; users never open individual Chitti pages. Standalone `chitti_*.html` pages = dev/debug surface only.
2. Chitti is a **bridge, not a competitor** — it sits on top of existing apps and helps the user use them.
3. **One onboarding. One memory. One dost.** (Siri / Assistant / Copilot assembly principle.)
4. Built for **Blind / Deaf / Mute / Illiterate**, voice-first, Hindi-first, free always, no sign-up.

---

## 2 — CORE READING (links + summaries, in order)

### 1. [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md) — vision + locked decisions *(the law; 995 lines)*
Single source of truth. §1 Vision · **§2 Locked decisions** (the table you must never relitigate) · §2a–§2g locked architecture callouts (agent vision, voice strategy, new-products process, camera intelligence, business-continuity, swarm, Golden Rule) · §4 What's built · §5 Planned wave · §6 Quality standards · §7 Accessibility (non-negotiable) · **§8 Agent priority order** (what to work on next).

### 2. [`CLAUDE_COFOUNDER_BRIEF.md`](CLAUDE_COFOUNDER_BRIEF.md) — 15-min cofounder onboarding *(115 lines)*
The map. §1 the single most important truth · §2 a **built-status table for every Chitti** (page · CEOS docs · status) · §3 locked decisions in brief · §4 documentation map · §5 honest gaps (what's missing now) · §6 current sprint · §7 how to resume.

### 3. [`CHITTI_SOP.md`](CHITTI_SOP.md) — all 21 Chittis defined *(335 lines)*
One page per Chitti with the **seven-field Standard Operating Profile**: Objective · Primary user · Success metric · Quality standard · Scope (does / does-not) · Evolution owner · Stale-data rule. Also carries the **Golden Rule** (confirm before every action) and the eight cross-Chitti floor rules every Chitti inherits. Note: Health File = MedUPI Skill 9; Health Scanner = MedUPI Skill 10 (merged 2026-06-24) — neither is a standalone Chitti.

### 4. [`quality.md`](quality.md) — quality framework + standards *(842 lines; mirror of [`QUALITY_STATUS.md`](QUALITY_STATUS.md))*
The live enterprise quality audit. **§1 per-backend matrix — seven audit axes** (six backend + one frontend) · **§1a the five frontend gates** (feedback-widget + `data-chitti-response` · `chitti_a11y.js` · Disability Profile prompt · language auto-detect · ISL plugin) — every page is 🔴 until all five are verified on production · §1b the certified-green page list · §1c how to flip a gate 🔴→🟢. Dated entries log each Chitti's CEOS/RAG build with measured proof (engine pass counts, Playwright cert, axe-core).

### 5. [`CHITTI_CTO_OATH.md`](CHITTI_CTO_OATH.md) — CTO rules and oath *(120 lines)*
The CTO notification doctrine (locked 2026-05-27). Seven rules: Sire never sees uncertified work; Sire never has to ask; **all CTO notifications go through Vaani only** (speakText + wa.me + sms: deep links — no Twilio/Meta/MSG91); three verdicts only (CERTIFIED / CONDITIONAL / REJECTED — REJECTED is fixed silently, Sire not notified until recovery); the 10-gate floor never moves. *"Sire's job is to use the platform, not to audit it."*

### 6. [`cto.md`](cto.md) — CTO operating procedures *(208 lines; the CTO Oath + 20-yr role stack)*
The operational CTO playbook. The CTO oath; **the 10 quality gates** (HTTP 200, <3s load, viewport, a11y.js, lang switcher, per-response widget, blind path, Hindi UI, no 404/console errors, ≥48px taps — un-provable-from-static → `needs_human`, never silent pass); daily 08:00 / weekly Sunday 09:00 health crons; post-push verification (wait 180s, fetch live URL, run gates). Plus the **full 20-years-experience role stack** (PM · BA · Solution Architect · DevOps · UI/UX · QA · Release Manager) and the single question before every task: *"If Sire opens sahayai.in/[product].html on his phone right now — will it work?"*

### 7. The 22 `ceos_*.md` files — Chitti Operating System doc sets *(see §3 below)*

---

## 3 — THE 22 `ceos_*.md` FILES (one-line summaries)

CEOS = "Chitti Operating System" doc set. The canonical CEOS for some Chittis lives in a `chitti-<x>/ceos/` folder; these root `ceos_*.md` files are the per-Chitti entry/spec.

| File | Chitti | Objective | Status |
|---|---|---|---|
| [`ceos_2wheeler.md`](ceos_2wheeler.md) | Mechanic 2-Wheeler | Bike Doctor + 15-feature ownership OS (vault · reminders · insurance · diagnostics). Canonical: `chitti-mechanic-2w/`. | LIVE |
| [`ceos_4wheeler.md`](ceos_4wheeler.md) | 4-Wheeler | Voice-first Car Doctor + ownership OS — OBD2 diagnostics, fair-price detection, Scam Shield. | FINAL / BUILT |
| [`ceos_ca.md`](ceos_ca.md) | CA OS | Financial OS, Bookkeeper→CFO + Govt-Benefits moat + Fraud + Twin. | LIVE |
| [`ceos_empowerment.md`](ceos_empowerment.md) | Empowerment | Daily Ikigai wisdom, book-coaching, festivals/birthdays motivation engine. | DESIGN STAGE (0/12 BOs, no frontend) |
| [`ceos_fashion.md`](ceos_fashion.md) | Fashion | Voice-first styling matching clothing to culture, budget, body type, occasion (26 langs). | FINAL / LIVE |
| [`ceos_founder.md`](ceos_founder.md) | Founder | Internal platform intelligence + business-continuity monitor; 72-h autonomous; quality aggregator. | FINAL / LIVE |
| [`ceos_fundamentals.md`](ceos_fundamentals.md) | Fundamentals | Voice-first stock fundamentals for Nifty 500 — PE/debt/ROE + value/growth/quality scoring. | FINAL / LIVE |
| [`ceos_government.md`](ceos_government.md) | Government | Citizen OS — 84 schemes, eligibility check, document guidance, CPGRAMS, Fraud Shield. | FINAL / LIVE |
| [`ceos_health_file.md`](ceos_health_file.md) | Health File (=MedUPI Skill 9) | Encrypted family health records + plain-language extraction + follow-up reminders. | Reference only (not standalone) |
| [`ceos_isl.md`](ceos_isl.md) | ISL | India's first AI Indian Sign Language layer — dictionary + per-response animation + tap-word. | Phase 1 LIVE |
| [`ceos_kisan.md`](ceos_kisan.md) | Kisan | Voice-first farming dost — weather, mandi prices, organic, livestock, Pashu-1962. | BUILT; data feeds COMING SOON |
| [`ceos_legal.md`](ceos_legal.md) | Legal OS | Rights navigator → notice decoder → limitation/deadline → contract risk → legal-aid → Scam Shield. | LIVE |
| [`ceos_logo_video.md`](ceos_logo_video.md) | Logo & Video | Voice-first logo + (mock) video studio — intentional honest stub until a real video API lands. | BETA stub |
| [`ceos_medupi.md`](ceos_medupi.md) | MedUPI | Medicine cost intelligence — strict same-composition match, Jan Aushadhi, family wallet, scan. | FINAL / LIVE |
| [`ceos_news.md`](ceos_news.md) | News | State-aware multi-language aggregator — 3-bullet "Chitti's Take" + ≥2-source fact-check. | FINAL / LIVE |
| [`ceos_news_ai.md`](ceos_news_ai.md) | News AI | AI-tool/model/career discovery feed + profession-lens learning + swarm. | v0.3 LIVE (rules-only) |
| [`ceos_psychology.md`](ceos_psychology.md) | Psychology | Voice-first emotional support — mood, breathing, affirmations + crisis cascade (Tele-MANAS). | FINAL (HIGH-risk) |
| [`ceos_scanner.md`](ceos_scanner.md) | Scanner | Food/product/medicine-strip scanner — allergens, FSSAI, MedUPI generic deep-link. | FINAL / LIVE |
| [`ceos_shares.md`](ceos_shares.md) | Shares | Financial-literacy teacher (not analyst) — ownership thinking + risk concepts in user's language. | FINAL / LIVE |
| [`ceos_upi.md`](ceos_upi.md) | UPI Fraud Guard | Grade QR/SMS/calls HIGH/MED/LOW with the RBI rule citation behind the verdict. | FINAL / LIVE |
| [`ceos_vaani.md`](ceos_vaani.md) | Vaani | Voice-first PA OS (Android + web) routing to all specialist Chittis; DeepSeek + Bhashini. | FINAL / LIVE (sole interface) |
| [`ceos_voice_factory.md`](ceos_voice_factory.md) | Voice Factory | Community-powered 26-language voice substrate; zero foreign-LLM dependency. | Phase 1 LIVE |

---

## 4 — CURRENT BUILD STATUS OF ALL 21 CHITTIS

Frontend: `https://sahayai.in/<page>.html` (GitHub Pages). Backend: `https://<svc>.up.railway.app`.

| # | Chitti | Status |
|---|---|---|
| 1 | Vaani (USER-CANONICAL) | **LIVE** — sole interface, 9 langs, emergency cascade |
| 2 | MedUPI (+ Health File Skill 9, Health Scanner Skill 10) | **LIVE** — Jan Aushadhi, NPPA, Family Wallet |
| 3 | CA OS | **LIVE** — CEOS v1.0, engine 38/38, RAG, disclaimer-guarded |
| 4 | Legal OS | **LIVE** — CEOS v1.0, engine 60/60 + cert 27/27, RAG 28/28 |
| 5 | Government | **LIVE** — Citizen OS, 84 schemes, Fraud Shield |
| 6 | News | **LIVE** — 26+ RSS, Chitti's Take, ≥2-source fact-check |
| 7 | News AI | **LIVE v0.3** — rules-only classifier, 7 streams |
| 8 | UPI Fraud Guard | **LIVE** — fraud classifier, RBI rule cards |
| 9 | Scanner | **LIVE** — DeepSeek vision, FSSAI |
| 10 | Fundamentals | **LIVE** — screener.in, Buffett/Munger/Graham lenses |
| 11 | Shares (Technical + Fundamentals) | **LIVE** — Roshan composite, 43 indicators, NOT SEBI bar |
| 12 | Mechanic 2-Wheeler | **LIVE** — CEOS v1.0, engine 92/92, cert 38/38 |
| 13 | Mechanic 4-Wheeler | **BUILT** — CQOS 5 layers; eval numbers pending DeepSeek funding |
| 14 | Fashion | **LIVE** — full Fashion OS (CFOS), cert 14/14 |
| 15 | Voice Factory | **LIVE** — 26 langs, honest ledger (Phase 2 blocked on Bhashini ULCA) |
| 16 | Jobs | **MERGED to main 2026-06-23** — BO1–BO11, 41/41 + 11/11; frontend live, backend provisioning |
| 17 | ISL | **Phase 1 LIVE** — dictionary + animation + tap-word (substrate) |
| 18 | Psychology (via Vaani) | **FINAL** — crisis cascade, HIGH-risk |
| 19 | Kisan | **BUILT** — deterministic engine; IMD/Agmarknet feeds being wired |
| 20 | Logo & Video | **BETA stub** — intentional honest stub until real video API |
| 21 | Founder | **LIVE** — aggregator + 5-layer Business Continuity Plan |
| — | Empowerment | **DESIGN STAGE** — CEOS exists, 0/12 BOs, no frontend |
| — | Kirana (Business flagship) | **SKELETON** |

---

## 5 — KEY LOCKED DECISIONS (do NOT relitigate — full text in [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md) §2)

- **Vaani is the only user interface.** Every capability routes through Vaani.
- **DeepSeek is the only LLM** (`api.deepseek.com`, OpenAI-compatible). Anthropic fully removed.
- **Turso libSQL only** — one DB per Chitti; access via vendored `lib/turso_http.py` (direct-HTTPS shim).
- **Golden Rule:** Chitti NEVER acts on its own. Every side-effect gates on `chittiConfirmAndDo()` — speaks *"Sire, shall I…?"*, waits for explicit haan/tap. Never defaults to Yes, never times out into Yes.
- **Four-user contract:** Blind / Deaf / Mute / Illiterate. Voice IN + OUT + symbols + plain English. Never colour-only.
- **Emergency = family cascade, NEVER cops.** Never auto-dial 112/100/102.
- **Voice = Voice Factory** (26 langs, `mock_bhashini` until ULCA creds). Bhashini temporary; community voices replace it; provider swappable at one URL.
- **Free always.** No paywall, no sign-up. GitHub Pages + Railway + Turso + DeepSeek free tiers.
- **Per-response widget** (🔊 🤖 👍 👎 ✏️) + **chitti_a11y.js** + **Disability Profile** + **ISL plugin** + **Feature Discovery** on every page — substrate auto-injected, no opt-out.
- **Camera intelligence · Swarm intelligence · Business Continuity (5-layer) · Offline P2P · knowledge-corpus expert grades (CA Final+PhD / LL.M+PhD / Psychology basics→PhD)** — all locked.
- **Design system:** navy `#002366`, bg `#F7F7F4`, tricolour stripe, 18px min font, 48px min tap, 375px-first. `sahayai_design_system.css` is the one stylesheet.
- **Honest stubs over fake demos. Verify on live before handover. Never silently fall back across tiers. Write the CEOS before building any new Chitti.**

---

## 6 — NEXT SESSION PRIORITIES (from [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md) §8 + current sprint)

**P0 — Vaani-first user journey (sole-interface lock):**
1. **Extend the Vaani intent router to cover every Chitti** — read each Chitti's `skills/FEATURES.md` so one voice/typed query reaches all 21 Chittis (today it covers a subset). The router is the only code path the user touches.
2. **Make `index.html` a Vaani entry, not a Chitti menu** — one CTA into `chitti_vaani.html`; other Chittis surfaced only as "Vaani can also help with…" cards.
3. **"Explain simply" button inside Vaani** on every response (per-response widget).

**Current sprint (post-Jobs merge):**
- Deploy Jobs backend (`chitti-jobs-api` + Turso DB provisioning in progress).
- Wire **Memory OS** BO1→BO2 (pilot = MedUPI) — design approved in [`MEMORY_ARCHITECTURE.md`](MEMORY_ARCHITECTURE.md), not yet live cross-session.
- Complete **Vaani routing to all Chittis** (the P0 above).

**P1:** Voice Factory Phase 2 (embed-pass on py3.11 + Sire's Bhashini ULCA registration). **P2:** Turso cutover verification + wire unconnected `render.yaml` backends. **P3:** next-wave products (Money Help → Health → Jobs → Inventory → WhatsApp Orders).

**Known infra watch:** Turso read-quota (org-wide block has bitten before — see auto-memory); Railway auto-deploys from `origin/main`.

---

## 7 — HOW TO RESUME (the contract)

1. Read [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md) → this file → [`CLAUDE_COFOUNDER_BRIEF.md`](CLAUDE_COFOUNDER_BRIEF.md) → [`CHITTI_SOP.md`](CHITTI_SOP.md). For the Chitti you're touching today, also read its `ceos/` + `skills/FEATURES.md`.
2. **Do NOT relitigate §5 locked decisions. Do NOT re-audit what's built.**
3. Report RED / YELLOW / fix-today to Bryan (per [`CLAUDE.md`](CLAUDE.md)) before any other action.
4. CTO does QA — run ALL automated tests yourself (26 langs, axe-core, real uploads, filled handover); Sire tests ONLY real iPhone/Android then signs off.
5. **Commit + push after every task. Verify on live before saying "done." Sire's phone is the final arbiter.**

---

*Built 2026-06-24 by Claude (Opus 4.8, 1M context) for Bryan Wilfred Pinto. If anything here contradicts [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md) or [`QUALITY_STATUS.md`](QUALITY_STATUS.md), those win — update this file to match.*
