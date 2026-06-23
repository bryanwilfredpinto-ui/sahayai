# CLAUDE COFOUNDER BRIEF

**The second file every new Claude reads — right after `SAHAYAI_MASTER.md`.**
Read this + `SAHAYAI_MASTER.md` + `CHITTI_SOP.md` and you are up to speed in 15 minutes.
This is the map. `SAHAYAI_MASTER.md` is the law. Don't re-derive either. Last updated **2026-06-23**.

---

## 1 — THE SINGLE MOST IMPORTANT TRUTH

1. **All Chittis are internal tools / skills for Chitti Vaani. Vaani is the ONLY user-facing surface.**
2. Users never open individual Chitti pages — Vaani routes to them internally. Standalone HTML pages = dev/debug surface only.
3. Chitti is a **bridge, not a competitor** to existing apps — it sits on top and helps the user use them.
4. **One onboarding. One memory. One dost.** (Siri/Assistant/Copilot assembly principle.)
5. Built for Bharat: Blind / Deaf / Mute / Illiterate, voice-first, Hindi-first, free always, no sign-up.

---

## 2 — WHAT IS BUILT

Frontend: `https://sahayai.in/<page>.html` (GitHub Pages). Backend: `https://<svc>.up.railway.app`.
CEOS = "Chitti Operating System" doc set. ✅ has full CEOS · ⚠️ partial · ❌ none.

| # | Chitti | Page | CEOS docs | Status |
|---|---|---|---|---|
| 1 | Fundamentals | `chitti_fundamentals.html` | ❌ | LIVE — screener.in, Buffett/Munger/Graham lenses |
| 2 | MedUPI | `chitti_medupi.html` | ❌ | LIVE — Jan Aushadhi match, NPPA prices, Family Wallet |
| 3 | News | `chitti_news.html` | ❌ | LIVE — 26+ RSS, Chitti's Take, fact-check |
| 4 | Vaani | `chitti_vaani.html` | ❌ | LIVE — sole interface, 9 langs, emergency cascade |
| 5 | UPI Fraud Guard | `chitti_upi.html` | ❌ | LIVE — fraud classifier, RBI rule cards |
| 6 | Product Scanner | `chitti_scanner.html` | ❌ | LIVE — DeepSeek vision, FSSAI |
| 7 | CA | `chitti_ca.html` | ✅ `ceos_ca.md` + `chitti-ca/ceos/` | LIVE — Financial OS, RAG, disclaimer-guarded |
| 8 | Legal | `chitti_legal_os.html` | ✅ `ceos_legal.md` + `chitti-legal/ceos/` | LIVE — Legal OS, engine 60/60, RAG |
| 9 | Government | `chitti_government.html` | ✅ `chitti-government/ceos/` | LIVE — Citizen OS, 84 schemes, Fraud Shield |
| 10 | Mechanic 2-Wheeler | `chitti_mechanic_2w.html` | ✅ `ceos_2wheeler.md` + `chitti-mechanic-2w/ceos/` | LIVE — Ownership OS, engine 92/92, cert 38/38 |
| 11 | Mechanic 4-Wheeler | (chitti-4wheeler/) | ⚠️ CEOS+CQOS | BUILT — Car Doctor, eval numbers pending DeepSeek funding |
| 12 | Fashion | `chitti_fashion.html` | ✅ `chitti-fashion/` (CFOS) | LIVE — full Fashion OS |
| 13 | Health Scanner | `chitti_health_scanner.html` | ⚠️ COSDF | LIVE — non-diagnostic AI vision, Guardian Memory |
| 14 | Voice Factory | `chitti_voice_factory.html` | ❌ | LIVE — 26 langs, honest ledger |
| 15 | News AI | `chitti_news_ai.html` | ❌ | LIVE v0.3 — rules-only classifier, 7 streams |
| 16 | Jobs | `chitti_jobs.html` | ✅ `CEOS_CHITTI_JOBS_v2.md` | NEW (branch `feat/chitti-jobs-bo1-bo10`) — BO1–BO10, 41/41 tests |
| — | Kirana (Business flagship) | `chitti_kirana.html` (TBD) | ⚠️ skills/ | SKELETON |
| — | Logo & Video | `chitti_logo_video.html` | ❌ | BETA — intentional honest stub |
| — | ISL · Quality | `chitti_isl.html` · `chitti_quality.html` | ❌ | substrate/internal |

Every Chitti has `skills/` (IDENTITY/PERSONALITY/VALUES/BOUNDARIES/GUARDRAILS/FEATURES). Domain Chittis add `skills/<DOMAIN>_KNOWLEDGE.md`.

---

## 3 — LOCKED DECISIONS (do NOT relitigate — full text in SAHAYAI_MASTER.md §2)

- **Vaani is the only user interface.** Every capability routes through Vaani.
- **DeepSeek is the only LLM** (`api.deepseek.com`, OpenAI-compatible). Anthropic removed.
- **Turso libSQL only** — one DB per Chitti; access via vendored `lib/turso_http.py` (direct-HTTPS shim).
- **Golden Rule:** Chitti NEVER acts on its own. Every side-effect gates on `chittiConfirmAndDo()` — speaks "Sire, shall I…?", waits for explicit haan/tap. Never defaults to yes, never times out into yes.
- **Four-user contract:** Blind / Deaf / Mute / Illiterate. Voice IN + OUT + symbols + plain English. Never colour-only.
- **Emergency = family cascade, NEVER cops.** Never auto-dial 112/100/102.
- **Voice = Voice Factory** (26 langs, `mock_bhashini` until ULCA creds). Bhashini is temporary; community voices replace it. Provider swappable at one URL.
- **Free always.** No paywall, no sign-up. GitHub Pages + Railway + Turso + DeepSeek free tiers.
- **Per-response widget** (🔊 🤖 👍 👎 ✏️) + **chitti_a11y.js** + **Disability Profile** + **ISL plugin** + **Feature Discovery** on every page — substrate auto-injected, no opt-out.
- **Camera intelligence, Swarm intelligence, Business Continuity (5-layer), Offline P2P, knowledge-corpus expert grades** — all locked. See §2b–§2g.
- **Design system:** navy `#002366`, bg `#F7F7F4`, tricolour stripe, 18px min font, 48px min tap, 375px-first. `sahayai_design_system.css` is the one stylesheet.
- **Honest stubs over fake demos. Verify on live before handover. Never silently fall back across tiers.**

---

## 4 — DOCUMENTATION MAP

| What | Where |
|---|---|
| Law / entry point | `SAHAYAI_MASTER.md` (root) — vision, §2 locks, built/planned, §8 priorities |
| This map | `CLAUDE_COFOUNDER_BRIEF.md` (root) |
| Per-product standards + Golden Rule | `CHITTI_SOP.md` (root) |
| Your roles + quality gates | `CTO_OATH.md` (root) |
| CEOS doc sets | root `ceos_*.md` (ca/legal/2wheeler) **or** `chitti-<x>/ceos/` (government/legal/mechanic-2w) **or** product spec (`CEOS_CHITTI_JOBS_v2.md`) |
| Capability surface (parsed live) | `chitti-<x>/skills/FEATURES.md` |
| Domain expertise | `chitti-<x>/skills/<DOMAIN>_KNOWLEDGE.md` |
| Memory OS design | `MEMORY_ARCHITECTURE.md` (root) — design approved, BO1 ready |
| Quality framework | `chitti-quality/` (STANDARDS / CHECKLIST / ACCOUNTABILITY) |
| Shared substrates (repo root JS) | `chitti_a11y.js` · `feedback-widget.js` · `chitti_features.js` · `chitti_camera.js` · `chitti_isl_dictionary.json` · `chitti_lang.js` |
| Memory (cross-session, planned) | Turso `mem_*` tables + ChromaDB `chitti_memory` |
| Auto-memory (Claude's notes) | `~/.claude/projects/.../memory/MEMORY.md` |

**Rule: write the CEOS for any new Chitti BEFORE building it** (new-products process, §2a).

---

## 5 — WHAT IS MISSING RIGHT NOW (honest gaps)

- **CEOS missing** for: Fundamentals, MedUPI, News, Vaani, UPI, Scanner, Voice Factory, News AI, Logo&Video. Only CA, Legal, Government, Mechanic-2W, Fashion, Jobs have full CEOS doc sets.
- **ROLE / SOP / QUALITY files** are not uniform per Chitti — many have skills/ but not a per-folder `SOP.md` + `QUALITY.md`. Coverage is partial.
- **Memory OS:** design approved (`MEMORY_ARCHITECTURE.md`); **BO1 buildable, BO2 NOT wired** into any Chitti yet. No live cross-session memory in production.
- **Universal onboarding** (one consent + one Disability Profile flow across all Chittis via Vaani) — not built end-to-end.
- **DPDP consent system** (granular basic/health/financial/cross-chitti toggles, Memory tab, "Chitti sab bhool ja" wipe) — designed, not built.
- **Vaani routing to ALL Chittis** — covers a subset; intent router must reach every Chitti's `FEATURES.md` (P0, SAHAYAI_MASTER §8).
- **Voice Factory Phase 2** — blocked on Sire's Bhashini ULCA registration; `mock_bhashini` still active.
- **Jobs** is on a feature branch, not merged to `main`.

---

## 6 — CURRENT SPRINT STATUS

- **In flight:** Chitti Jobs (BO1–BO10) on branch `feat/chitti-jobs-bo1-bo10` — 24/7 AI career agent, DeepSeek-only, no-OAuth (mailto + .ics), Naukri/Indeed RSS + manual paste. 41/41 tests pass. **Done:** backend `chitti-jobs/`, `chitti_jobs.html`, CEOS, ATS gate, Art-5 send-confirm, CRM.
- **Next:** merge Jobs to `main` + deploy; then wire Memory BO1→BO2 (pilot = MedUPI); complete Vaani routing to all Chittis.
- **Known infra note:** watch Turso read-quota (org-wide block has bitten before); Railway auto-deploys from `origin/main`.

---

## 7 — HOW TO RESUME AS COFOUNDER

1. Read **`SAHAYAI_MASTER.md`** → **this file** → **`CHITTI_SOP.md`**. (15 min. Done.)
2. For the Chitti you're touching today, also read its `ceos/` + `skills/FEATURES.md`.
3. **Do NOT relitigate §3 locked decisions. Do NOT re-audit what §2 says is built.** Go straight to §6 current sprint.
4. Report to Bryan what's RED / YELLOW / fix-today (per `CLAUDE.md`), then act.
5. Commit + push after every task. Verify on live before saying "done". Sire's phone is the final arbiter.
