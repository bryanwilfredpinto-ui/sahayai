# CNOS — Guardrails · Anti-Hallucination

> *"A fabricated source is worse than no source. Trust is the product; once broken, never recovered."*

The single hardest rule in CNOS: **CNOS never invents.** Every claim a reader sees traces to a real publisher URL. This file ties to **Trust > Engagement** and **Truth > Virality**.

---

## 1. NEVER fabricate

| # | Never fabricate | Why |
|---|---|---|
| 1 | A source URL | Every claim → real publisher URL on the card |
| 2 | A statistic / number | Numbers come from the article body or not at all |
| 3 | A verification badge | A badge means corroboration was measured, never asserted |
| 4 | A confidence score | Confidence is computed from source count, never typed in |
| 5 | A publisher name or quote | Attribution F1 ≥ 0.99 — no synthetic outlets |
| 6 | A "Chitti's Take" fact not in the article | Summary is derivative, never generative-of-fact |

---

## 2. "Chitti's Take" — derive only, never invent

The 3-bullet "Chitti's Take" is produced by `backend/services/news_summary.py` (DeepSeek-only, per locked LLM decision). Discipline:

1. The summary derives **ONLY from the article body** (`content:encoded` / `article.summary`) — never the model's world knowledge.
2. The system prompt is a hard contract: *"Do NOT make up facts not present in the source"* + *"Output ONLY the 3 bullets"* (no preamble, no headings).
3. The three bullets are fixed in shape: **What happened · Why it matters · What's next** — and *"What's next"* is emitted **only if the article itself says so**.
4. If `DEEPSEEK_API_KEY` is unset, CNOS returns an **honest fallback** — a trimmed slice of the source's own summary with `source: "fallback"` and a visible note. It **never** fakes a demo "Take".
5. Every model call is wrapped by `lib/quadrails.py` + `lib/hooks.py` (`hooks.wrap_llm`): rail-gated input, audited request_id, blockable output. A blocked call returns `ok: false` with the rail/reason — never a silent hallucination.

---

## 3. Fact-check: corroboration, not assertion

Verdicts come from `backend/services/news_factcheck.py` — a cross-source title-similarity matcher (rapidfuzz `token_set_ratio ≥ 70`, 48h lookback, same language, distinct `source_slug`).

| Verdict | Rule (spec) | Code threshold | Confidence |
|---|---|---|---|
| `verified` | ≥ 2 independent corroborating sources | **≥ 3 distinct sources** | min(95, 60 + n·8) |
| `partial` | corroboration present but thin | 1–2 distinct sources | 55–70 |
| `disputed` | sources contradict | (reserved) | — |
| `unverified` | no cross-source signal | 0 | 25 |

> **Note on thresholds.** The brief sets the floor at ≥2; the shipped code is *stricter* (`n >= 3` for `verified`), which only makes the badge harder to earn — never easier. The 2026-06-04 pillar-audit fix also removed a fake `disputed`/"sources disagree" warning that fired on single-source mainstream stories with **no actual divergence check** — fabricated un-verification is a hallucination too, and it was killed.

Hard rules:

1. **`verified` is never shown without showing WHAT verified it** — the corroborating `matched_sources` + URLs ride with the verdict.
2. **Honest `unverified`** when corroboration is absent: *"No cross-source corroboration yet. Single-source story — may be hyperlocal or just-breaking."* — never auto-upgraded.
3. Confidence is **computed from source count**, never authored.
4. Results cache for 6h (`CACHE_HOURS`); re-running returns the cache, not a fresh guess.

---

## 4. Staleness — never let old read as new

1. Any item older than **30 days** carries a visible stale-data flag (Guardrails README ALWAYS row).
2. Stale items are **never promoted** to the home or For You surface on freshness alone.
3. Fact-check `checked_at` older than 6h is recomputed, not presented as current truth.

---

## 5. CI enforcement

| Rule | Where enforced |
|---|---|
| No fabricated source / badge / confidence | structural — feed response shape carries real URLs only |
| Summary derives from body only | `lib/quadrails.py` + `lib/hooks.py` rail wrap on every LLM call |
| Verdict ↔ corroboration count | `backend/services/news_factcheck.py` (deterministic, no LLM) |
| Verified-shows-evidence | structural — `matched_sources` returned with verdict |
| Staleness flag > 30 days | `tools/cert_chitti_news_v2.mjs` — per release |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
