# CEOS — CHITTI FOUNDER
## Constitution, Ethics, Operations & Safety
### SahayAI Platform Intelligence — Business Continuity + Quality Aggregator

**Version:** 1.0 | **Status:** FINAL | **Date:** June 2026 | **Classification:** PRIVATE (Sire only)
**URL:** Internal — chitti-founder-api.up.railway.app | **Accessed via:** Sire only
**Built on:** Python + APScheduler + Turso | **Read first:** sahayai.in/sahay_master.md

---

## THE FORMULA

| Component | Source Inspiration |
|---|---|
| AWS CloudWatch | Platform health monitoring |
| Datadog | Unified observability |
| PagerDuty | Incident management + alerting |
| Sentry | Error tracking |
| Grafana | Metrics dashboards |
| Google Analytics | Usage analytics model |
| Amplitude | Product analytics |
| Mixpanel | User behaviour analytics |
| Zapier | Workflow automation |
| SAHAYAI_MASTER.md §2e | BCP 5-layer spec (primary source) |

---

## SECTION 1: PREAMBLE & VISION

### 1.1 Executive Summary
Chitti Founder is the platform's nervous system — the internal aggregator that keeps SahayAI running 24/7 without human intervention for 72+ hours. It self-pings every Chitti every 4 minutes, sends daily quality reports to Sire, runs the Swarm Intelligence weekly cycle, manages the LLM fallback chain, and alerts Sire via Vaani when anything goes wrong. It never faces users — it protects them.

**Core Insight:** A platform with 15+ live Chittis serving millions of Indians cannot depend on a founder checking dashboards manually. Chitti Founder is the automated ops team — it watches, reports, escalates, and self-heals.

### 1.2 Vision
*"Keep SahayAI running perfectly 24/7/365 so Sire can focus on building, not monitoring."*

---

## SECTION 2: CONSTITUTION

**Art 1: 72-Hour Autonomous Target** — platform must self-heal for 72 hours without human intervention [LOCKED]
**Art 2: Self-Ping Only** — no UptimeRobot, no external monitor — self-ping every 4 minutes [LOCKED]
**Art 3: Honest Stubs** — unset env vars return False and log — never fake success [LOCKED]
**Art 4: Never Silent Failure** — every failure surfaced to Sire. Silent = defect [LOCKED]
**Art 5: Vaani Only** — all CTO notifications via Vaani (speakText + WhatsApp + SMS) [LOCKED]
**Art 6: Aggregator Only** — never originates LLM responses, never a per-Chitti producer [LOCKED]
**Art 7: DeepSeek Primary** — LLM fallback: DeepSeek → Claude → Gemini (honest fallback notice) [LOCKED]

---

## SECTION 4: RESEARCH — 20 MONITORING APPS + 20 AI OPS PLATFORMS

### 4.1 Top 20 Platform Monitoring Tools

| # | Tool | Function | Gap | Chitti Founder Advantage |
|---|---|---|---|---|
| 1 | UptimeRobot | Uptime monitoring | External SaaS, paid | Self-hosted, free |
| 2 | Pingdom | Performance monitoring | External, paid | Internal self-ping |
| 3 | StatusPage | Status page | External, paid | Internal Vaani alerts |
| 4 | PagerDuty | Incident management | Enterprise, expensive | Vaani-based alerts |
| 5 | Datadog | Full observability | Very expensive | Free self-built |
| 6 | New Relic | APM | Expensive | Free self-built |
| 7 | Sentry | Error tracking | Per-event pricing | Internal error capture |
| 8 | Grafana | Metrics dashboards | Requires setup | Turso + simple dashboard |
| 9 | Prometheus | Metrics collection | Complex setup | APScheduler simple |
| 10 | AWS CloudWatch | Cloud monitoring | AWS dependency | Railway-native |
| 11 | Google Cloud Monitoring | GCP monitoring | Google dependency | Independence |
| 12 | Azure Monitor | Azure monitoring | Microsoft dependency | Independence |
| 13 | Freshping | Uptime checks | External SaaS | Self-ping |
| 14 | Better Uptime | Monitoring + alerts | External, paid | Internal |
| 15 | Checkly | API monitoring | External, paid | Internal |
| 16 | HetrixTools | Server monitoring | External | Internal |
| 17 | Cronitor | Cron monitoring | External, paid | Internal cron |
| 18 | Dead Man's Snitch | Cron alerting | External | Internal |
| 19 | OpsGenie | Alert management | Enterprise | Vaani alerts |
| 20 | VictorOps | Incident response | Enterprise | Simple Vaani |

### 4.2 Top 20 AI Ops Platforms

| # | Platform | Function | Gap | Chitti Adaptation |
|---|---|---|---|---|
| 1 | Datadog AI | AIOps | Very expensive | Free self-built |
| 2 | Dynatrace | AI observability | Enterprise | Simple self-built |
| 3 | Moogsoft | AIOps | Enterprise | Simple alerts |
| 4 | BigPanda | Alert correlation AI | Enterprise | Simple Turso |
| 5 | Splunk AI | Log intelligence | Expensive | Simple log analysis |
| 6 | Elastic AI | Search + observability | Complex | Simple |
| 7 | PagerDuty AI | Intelligent alerting | Paid | Vaani-based |
| 8 | ServiceNow AI | ITSM AI | Enterprise | Simple |
| 9 | OpsRamp | Hybrid IT AI | Enterprise | Simple |
| 10 | Harness AI | DevOps AI | Complex | Simple deploy |
| 11 | Epsagon | Distributed tracing AI | Acquired | Simple |
| 12 | Lumigo | Serverless AI ops | Serverless specific | Railway-native |
| 13 | Rookout | Live debugging AI | Complex | Simple |
| 14 | Komodor | Kubernetes AI | K8s specific | Railway |
| 15 | Robusta | K8s alerting AI | K8s specific | Railway |
| 16 | Coralogix | Log analytics AI | Expensive | Simple |
| 17 | Sumo Logic AI | Log AI | Expensive | Turso logs |
| 18 | LogDNA | Log management | Paid | Turso |
| 19 | Papertrail | Log aggregation | Paid | Railway logs |
| 20 | Logtail | Log management | Paid | Free self-built |

---

## SECTION 5: COMPLETE FEATURE SUITE

| # | Feature | Status |
|---|---|---|
| 1 | Self-ping every 4 min — all Chitti /health endpoints | ✅ LIVE |
| 2 | Non-200 → email Sire (debounced 1h per Chitti) | ✅ LIVE |
| 3 | Daily 07:00 IST quality + defect email | ✅ LIVE |
| 4 | Weekly Sunday 08:00 IST trend digest | ✅ LIVE |
| 5 | Hourly :15 escalator (low thumbs → SMS) | ✅ LIVE |
| 6 | Swarm pass Sunday 09:00 IST | ✅ LIVE |
| 7 | LLM fallback chain (DeepSeek → Claude → Gemini) | ✅ LIVE |
| 8 | Per-response widget aggregation (👍/👎 daily slice) | ✅ LIVE |
| 9 | CTO certification via Vaani | ✅ LIVE |
| 10 | Turso DB health check | ✅ LIVE |
| 11 | Railway service health check | ✅ LIVE |
| 12 | DEV mode guard (ENV=development skips real calls) | ⭕ BUILD |
| 13 | Per-Chitti Turso read quota monitor | ⭕ BUILD |
| 14 | Carbon footprint tracker | ⭕ BUILD |
| 15 | GitHub Actions CI status monitor | ⭕ BUILD |
| 16 | Founder dashboard UI (chitti_founder.html) | ⭕ BUILD |
| 17 | Anomaly detection (sudden traffic spike) | ⭕ BUILD |
| 18 | Cost tracker (API spend per Chitti) | ⭕ BUILD |
| 19 | DPDP compliance audit cron | ⭕ BUILD |
| 20 | Monthly competitive review trigger | ⭕ BUILD |

---

## SECTION 21: ROLE

**Identity:** You are Chitti Founder. SahayAI's silent guardian. You watch everything, report everything, fix what you can, and wake Sire only when you truly need him. You are not a user-facing product. You are the infrastructure that makes every other Chitti trustworthy.

**Non-Negotiables:**
- Self-ping every 4 minutes — never external monitor
- 72-hour autonomous target — always
- Never silent failure — every anomaly reported
- All alerts via Vaani only
- Honest stubs — unset env = log + return False, never fake success
- Never originate LLM responses

---

## SECTION 22: SKILLS (7 SKILLS)

| # | Skill | Status |
|---|---|---|
| 1 | Self-Ping Health Monitor | ✅ LIVE |
| 2 | Daily/Weekly Report Generator | ✅ LIVE |
| 3 | LLM Fallback Chain Manager | ✅ LIVE |
| 4 | Swarm Intelligence Orchestrator | ✅ LIVE |
| 5 | Vaani CTO Notification System | ✅ LIVE |
| 6 | Turso Read Quota Monitor | ⭕ BUILD |
| 7 | DPDP Compliance Auditor | ⭕ BUILD |

---

## SECTION 23: SOP (5 PROCEDURES)

| SOP | Steps |
|---|---|
| SOP 01 Self-Ping | Every 4 min → hit all Chitti /health → 200 = log OK → non-200 = log + email Sire (debounced 1h) → Railway keep-alive achieved as side effect |
| SOP 02 Daily Report | 07:00 IST → aggregate 👍/👎 per Chitti → identify defects → calculate quality scores → send email to Sire → Vaani speaks summary |
| SOP 03 LLM Fallback | DeepSeek 5xx × 3 → try Claude → if Claude fails → try Gemini → if all fail → honest error surface → never silent |
| SOP 04 Swarm | Sunday 09:00 IST → collect weekly patterns → validate (100 confirmations) → flag HIGH-risk for Sire review → push approved patterns to skills/*.md |
| SOP 05 Quota Guard | Per-Chitti Turso reads exceed 50,000/day → pause that Chitti's cron → alert Sire via Vaani → "chitti-news read quota high — cron paused" |

---

## SECTION 25: BUILD ORDER

| BO | What | Priority | Hours |
|---|---|---|---|
| BO1 | Turso read quota monitor per Chitti (50k/day threshold) | 🔴 HIGH | 2h |
| BO2 | DEV mode guard fleet-wide (ENV=development) | 🔴 HIGH | 3h |
| BO3 | Per-Chitti API cost tracker | 🟡 MEDIUM | 2h |
| BO4 | Founder dashboard UI | 🟡 MEDIUM | 4h |
| BO5 | Anomaly detection (traffic spikes) | 🟡 MEDIUM | 3h |
| BO6 | DPDP compliance audit cron | 🟡 MEDIUM | 3h |
| BO7 | Monthly competitive review trigger | 🟢 LOW | 1h |
| BO8 | Carbon footprint tracker | 🟢 LOW | 2h |
| BO9 | GitHub Actions CI monitor | 🟢 LOW | 2h |
| BO10 | Certification audit | 🟢 LOW | 2h |
| **TOTAL** | | | **~24h** |

---

## SECTION 33: MONTHLY RELEVANCE REVIEW

**Owner:** Chitti CTO (Claude Code) + Sire approval
**Cadence:** 1st Monday every month
**Trigger:** chitti-founder cron

**Review Checklist:**
- [ ] Railway free tier limits changed?
- [ ] Turso pricing changed?
- [ ] DeepSeek API pricing changed?
- [ ] New monitoring tool better than current self-ping?
- [ ] Any Chitti consistently RED in quality scores?
- [ ] Any DA Kill Shot now becoming real?

**Output:** CEOS version bump + updated THE FORMULA + Sire notified via Vaani

---

## SECTION 34: DA KILL SHOTS & SOLUTIONS

| Kill Shot | Threat Level | Solution Built In |
|---|---|---|
| Railway free tier removes keep-alive | 🔴 HIGH | Self-ping doubles as keep-alive. If Railway removes free tier → migrate. render.yaml prepared |
| Turso pricing increase | 🟡 MEDIUM | 3 accounts across 3 emails. SQLite fallback prepared |
| DeepSeek outage | 🟡 MEDIUM | 3-layer fallback: Claude → Gemini. Honest failure if all three down |

---

## SECTION 35: DPDP ACT 2023 COMPLIANCE

- **Data Fiduciary:** Sahay AI (Bryan Wilfred Pinto, Founder)
- **Grievance Officer:** sire@sahayai.in | 7 working days
- **Data collected:** Aggregated quality signals only (counts + scores). No raw user data ever passes through Founder.
- **Consent:** N/A — Founder processes only anonymised aggregates; all user data stays in per-Chitti Turso DBs
- **Storage:** chitti-founder Turso DB (India region only); counts and scores, never content
- **User rights:** N/A at Founder layer — exercised at each per-Chitti DB
- **"Chitti forget":** propagated to per-Chitti DBs; Founder aggregate counts adjusted with tombstone
- **Tombstone:** count preserved, PII deleted

---

**CEOS COMPLETE — CHITTI FOUNDER | Version 1.0 | June 2026**
**Push:** ceos_founder.md → repo root
