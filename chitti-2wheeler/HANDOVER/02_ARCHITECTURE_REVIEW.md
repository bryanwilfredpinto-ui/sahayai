🎖️ World Class Chitti Mechanic (Bike + Car Doctor) — Commando Discipline. Zero Excuses.

# 02 — ARCHITECTURE REVIEW — Chitti Mechanic
**Universal Handover Part 5 · 2026-06-06.** Full detail: [CHITTI_MECHANIC_ARCHITECTURE_REVIEW.md](../../CHITTI_MECHANIC_ARCHITECTURE_REVIEW.md).

## 5.1 Architecture (4)
| # | Item | Status | Notes |
|---|---|---|---|
| 1 | System diagram | ✅ | [B1 in the full review](../../CHITTI_MECHANIC_ARCHITECTURE_REVIEW.md) — frontend (GitHub Pages, static) + offline deterministic engine + online LLM via Vaani→DeepSeek + Railway routes + Turso |
| 2 | Data flows | ✅ | diagnosis (online/offline), Vehicle Twin, Scan-RC (device-local), voice |
| 3 | External dependencies | ✅ | DeepSeek (via Vaani), Railway routes, Turso, Web Speech, Web Bluetooth, RC vision endpoint (unset) |
| 4 | Failure behaviors | ✅ | all degrade gracefully — offline KB + honest fallbacks; no fabricated results (verified) |

## 5.2 Scalability (4)
| # | Item | Status |
|---|---|---|
| 1 | 1,000 concurrent | ✅ static CDN + offline-first; deterministic routes fine |
| 2 | 100,000 concurrent | ⚠️ frontend fine; **first bottleneck = the LLM path** (DeepSeek rate limits) + single dyno |
| 3 | What breaks first | **Documented:** DeepSeek 429s on the online diagnosis path |
| 4 | Scaling recommendations | ✅ keep diagnosis offline-first (done); queue/cache in front of DeepSeek; horizontal backend |

## 5.3 Security (6)
| # | Item | Status |
|---|---|---|
| 1 | No PII without consent | ✅ vehicle data + RC photo are **device-local only**, never uploaded by us |
| 2 | localStorage encrypted? | ❌ No — low-sensitivity vehicle data; do not sync without consent |
| 3 | Backend auth required? | N/A — public deterministic read-mostly routes; admin gated by secret |
| 4 | No API keys in frontend | ✅ DeepSeek key is server-side in chitti-vaani-api |
| 5 | XSS tested | ✅ dynamic render escaped (`swEsc`/`escAttr`/rc esc); model output inserted as escaped text |
| 6 | CSP/CSRF | N/A CSRF (stateless JSON); **CSP header = tech-debt** (recommend on the static host) |

## 5.4 Deployment (4)
| # | Item | Status |
|---|---|---|
| 1 | Deployment process | ✅ push `main` → GitHub Pages auto-deploy (frontend); `deploy_to_railway.sh` (backends) |
| 2 | Rollback | ✅ `git revert` + redeploy; render.yaml/railway.json reconstitutable |
| 3 | Env vars | ✅ Railway dashboard (DEEPSEEK_API_KEY, DATABASE_URL); `CHITTI_RC_VISION_URL` for RC auto-read |
| 4 | CI/CD | ⚠️ harnesses are **manual gates** (run before commit) — GitHub Actions = tech-debt |

## 5.5 Technical Debt
| # | Item | Priority | Effort |
|---|---|---|---|
| 1 | Slow 3G first load (~37s) — split/defer substrate bundle | Must | M |
| 2 | No fetch timeouts/retry on LLM + backend calls | Must | S |
| 3 | Turso `DATABASE_URL` unset → server persistence ephemeral (Sire) | Must | S |
| 4 | No CI/CD (wire harnesses into Actions) | Should | M |
| 5 | CSP header + ESLint + console.log strip | Should | S |
| 6 | Vision/audio AI (RC make/model, dashboard/tyre/leak photo, sound) — funding-gated | Nice | L |

**Architecture Verdict: ✅ PASS** (scalable offline-first; secure for its data class; deployable + rollbackable).

---
> **World Class Chitti Mechanic — Commando Discipline. Zero Excuses.**
