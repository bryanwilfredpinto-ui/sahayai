# CNOS — QUALITY

> *"If we can't measure it, we can't claim it."*

The quality contract for the Chitti News Operating System. No feature is "done" until it clears every stage and every gate below. Green is earned, not declared.

---

## The 10-stage definition of done

Every CNOS feature must pass, **in order**. If any stage fails, the feature is RED. No green without all 10.

> **Read → Skill → SOP → Swarm → Guardrails → Evals → Observability → Accessibility → Memory → Certification**

| # | Stage | What it means in CNOS |
|---|---|---|
| 1 | **Read** | Read SAHAYAI_MASTER §2 + CHITTI_NEWS_MASTER_SPEC + this folder's CONSTITUTION/VISION before touching code |
| 2 | **Skill** | The behavior lives in a `skills/*.md` capability (news / politics / sports / business / tech / entertainment / factcheck / summarizer), not hardcoded |
| 3 | **SOP** | The 7-field Chitti SOP is applied for the News Chitti (Objective · Primary user · Success metric · Quality standard · Scope · Evolution owner · Stale-data rule) |
| 4 | **Swarm** | The story passes the 7-agent swarm: News → Verification → Context → Personalization → Accessibility → Career → Action |
| 5 | **Guardrails** | Neutrality (0 partisan adjectives), no headline rewrite, no unverified promotion, ≥2-source verdicts, staleness flag on >30-day items |
| 6 | **Evals** | Category F1 ≥ 0.95, source-attribution F1 ≥ 0.99, verification F1 ≥ 0.95 against the benchmark sets |
| 7 | **Observability** | `news.ingest_logs` + verdict timestamps + coverage SLA cron emit measurable signal |
| 8 | **Accessibility** | All four user journeys pass (blind / deaf / mute / illiterate); every box carries the 5 elements |
| 9 | **Memory** | For You / Read Later / Cancelled persist on-device; swarm learnings flow per the locked Swarm Intelligence rule |
| 10 | **Certification** | The cert harnesses pass at or above the handover threshold |

---

## Merge gates

A PR does not merge unless **all** of these are green:

| Gate | Bar |
|---|---|
| Cert harness | ≥ 95% pass across the omnibus |
| Accessibility | every `[data-chitti-response]` box has 🔊/🤖/👍/👎/✏️🎙️ + page-level 🌐 |
| Neutrality | 0 partisan adjectives per 100-article sample |
| No headline rewrite | publisher headline byte-identical to source |
| Verdict corroboration | every "verified" verdict cites ≥2 sources |
| Privacy | no For You / Read Later / Cancelled data leaves the device |
| Staleness | >30-day items carry a staleness flag |

---

## The cert harnesses

| Harness | What it certifies |
|---|---|
| `cert_news_omnibus.mjs` | The full omnibus — langs × a11y profiles × engines × viewports × backend × samples × neutrality × Slow-3G |
| `cert_chitti_news_v2.mjs` | Mobile/page cert — per-card `data-chitti-response`, ARIA on pickers, disclaimer bar, multi-language render, Trust Strip <2 s |
| `verify_ceos_compliance_news.mjs` | CEOS-compliance — confirms the CONSTITUTION / VISION / QUALITY / ROADMAP doc set + the 4 accessibility journeys exist and end with the CNOS footer |
| `test_news_samples.mjs` | Sample articles — ingest → classify → Chitti's Take → fact-check verdict end-to-end on real RSS payloads |

---

## The 95% handover threshold

CNOS is **not** handed to Sire for testing until the omnibus cert is ≥ 95% green. Below 95%, the remaining failures are MY defects to fix first — Sire never sees a 401, a network error, or an empty feed. Per the locked handover rule, every QA cell is reported PASS / FAIL / AUTOMATION-LIMITED (with reason) — never a placeholder. Sire's slot is real iPhone/Android hardware only; everything automatable is automated and filled in before handover.

---

## Honest current status

| Area | Status |
|---|---|
| Mobile cert (`cert_chitti_news_v2.mjs`) | ✅ 13/14 PASS |
| Per-card `data-chitti-response` present | ✅ verified live (49+ articles) |
| Accessibility A+ (5 elements/box) | ✅ 13/14 PASS |
| Cancelled-story respect | ✅ 4/4 PASS |
| Politics neutrality | ✅ 0/100 violations |
| Category F1 eval | ⚠️ 30 seed rows only — below statistical confidence |
| Verification F1 eval | ⚠️ 20 seed rows only |
| Coverage SLA (state×lang×cat) | ⚠️ 27/66 cells pass — mostly multi-language vernacular gap (mr/or/bn/kn/ur/gu) |
| Feed query p50/p95 latency | ❌ untested (no load harness run yet) |
| Trust score / Time-to-informed | ❌ no users yet — post-launch survey |
| ISL per-card coverage report | ⚠️ TODO — sample 100 cards |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
