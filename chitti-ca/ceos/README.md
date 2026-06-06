🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# Chitti CA OS (CEOS)

**One financial companion for every Indian.** Internally: Bookkeeper → Accountant →
Auditor → CA → CFO. Externally: a trusted dost that saves tax legally, prevents
penalties, surfaces the government money you're owed, catches fraud, and remembers
your financial life — in your language, by voice, for free, for the blind / deaf /
mute / illiterate too.

Handles: Accounting · GST · Tax · Audit · Compliance · Funding · Government Schemes ·
Business Growth · Fraud Detection · Financial Planning.

## Read in this order

1. [CONSTITUTION.md](CONSTITUTION.md) — supreme law (Founder Rule, quality gates)
2. [ROLE.md](ROLE.md) — what you're building & the 12 expert lenses
3. [PRODUCT_VISION.md](PRODUCT_VISION.md) · [PERSONAS.md](PERSONAS.md) · [SUCCESS_METRICS.md](SUCCESS_METRICS.md)
4. [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md) — global best practice + the missing features we added
5. [PRD.md](PRD.md) — the 11 modules · [ARCHITECTURE.md](ARCHITECTURE.md) · [SKILLS.md](SKILLS.md)
6. [BUILD_ORDER.md](BUILD_ORDER.md) — BO1→BOn, test-gated, four-users-first
7. [EVALS.md](EVALS.md) · [QUALITY.md](QUALITY.md) · [OBSERVABILITY.md](OBSERVABILITY.md) · [ROADMAP.md](ROADMAP.md)
8. Subdirs: [skills/](skills/) [sop/](sop/) [swarm/](swarm/) [guardrails/](guardrails/) [evals/](evals/) [observability/](observability/) [memory/](memory/) [accessibility/](accessibility/) [handover/](handover/)

## The product

| Surface | File |
|---|---|
| Frontend (GitHub Pages root) | [`chitti_ca_os.html`](../../chitti_ca_os.html) |
| Deterministic engine | [`chitti_ca_os_engine.js`](../../chitti_ca_os_engine.js) |
| Engine test | `node tools/ca_os_engine_test.mjs` |
| Backend (LLM explain, optional) | existing `chitti-ca-api` (Railway) |

## Locked decisions inherited (do not relitigate)

DeepSeek-only LLM · Turso DB · four-user accessibility · Vaani-canonical language
dropdown (`chitti_lang.js`) · per-response widget · Golden Rule (confirm before any
action; never file/sign) · server-enforced disclaimer · honest stubs over fake demos ·
deterministic core. See [SAHAYAI_MASTER.md §2](../../SAHAYAI_MASTER.md).

> **Note:** the legacy small "Chitti CA" tax-assistant docs live one level up in
> `chitti-ca/` (README/SKILLS/SOP) and back the live `chitti-ca-api`. This `ceos/`
> folder is the elevated **Chitti CA OS** that subsumes it.

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
