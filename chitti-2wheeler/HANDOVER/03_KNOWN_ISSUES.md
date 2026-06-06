🎖️ World Class Chitti Mechanic (Bike + Car Doctor) — Commando Discipline. Zero Excuses.

# 03 — KNOWN ISSUES (HONEST) — Chitti Mechanic
**Universal Handover Part 6 · 2026-06-06.** Full detail: [CHITTI_MECHANIC_KNOWN_ISSUES.md](../../CHITTI_MECHANIC_KNOWN_ISSUES.md).

| # | Issue | Severity | Workaround / status | Owner |
|---|---|---|---|---|
| 1 | **Slow 3G first-visit load ~37s** | Medium | Service-worker caches after first load → repeat visits instant; bundle-split tracked (tech-debt #1) | CTO |
| 2 | **RC make/model AI auto-read** not built (vision-gated) | Low (by-design stub) | Reg→State/RTO works offline now; AI auto-read wired to `CHITTI_RC_VISION_URL`, honest "coming soon", **never fabricates** | Sire (DeepSeek vision / VAHAN API) |
| 3 | **Dashboard/tyre/leak photo + sound AI** not built | Low (by-design stub) | Deterministic pickers live; AI verdict honest "coming soon" | Sire (vision/audio model) |
| 4 | **17 cousin languages** render UI in **Hindi** (not their own script) | Low | Matches Chitti Vaani; the 9 fully translate; voice/diagnosis use the picked language | CTO (roadmap: translate more) |
| 5 | **Voice OUTPUT audio** not verifiable by headless tests | Low | The speak control firing IS tested; *hearing* it needs a real device | Sire (real device) |
| 6 | **Live LLM diagnosis + measured CQOS accuracy** | — | Blocked: DeepSeek funding + Vaani allowlist; honest "confidence low" fallback until then | Sire |
| 7 | **Turso durable server persistence** | — | `DATABASE_URL` unset → local SQLite (ephemeral on restart); device copy persists | Sire |
| 8 | **Human blind/deaf/illiterate AT-user sessions** | — | Structure/attribute/axe-verified; real moderated sessions not done | Sire (recommend before mass launch) |
| 9 | **Physical iOS/Android device pass** | — | 3 engines headless-tested; real handsets not done | Sire |

**Bug counts: Critical 0 · High 0 · Medium 1 (slow-3G) · Low 4 (by-design stubs/scope).**

**Known Issues Verdict: ✅ Acceptable for pilot/beta.** Mass-launch waits on #6–#9 (all Sire/roadmap).

---
> **World Class Chitti Mechanic — Commando Discipline. Zero Excuses.**
