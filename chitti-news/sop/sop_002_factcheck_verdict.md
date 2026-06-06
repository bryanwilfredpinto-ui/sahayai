# SOP-002 — Issue a Fact-Check Verdict

> World Class CNOS — Commando Discipline. Zero Excuses.

Mechanical procedure for the Verification Agent to assign a fact-check verdict to a claim or article. Trust is the product; this SOP is the line between "trustworthy" and "just another aggregator."

---

## Profile

| | |
|---|---|
| Owner | Verification Agent ([`skills/chitti-news-factcheck/`](../skills/chitti-news-factcheck/)) |
| Cadence | Per article at ingest (SOP-001 step 2); re-run on corroboration drift (see CNOS SOP-002 drift rule) |
| Trigger | New article lands in `news.articles`; OR user asks "is this true / fact-check this / any other sources" |
| Escalation | HIGH-risk claim (health, legal, electoral, communal) with conflicting corroboration → flag for human review on Founder dashboard before any `verified` mark |

---

## Verdict bands

| Verdict | Condition |
|---|---|
| **verified** | ≥2 independent sources corroborate the central claim |
| **partial** | ≥2 sources, but they corroborate only part of the claim / disagree on details |
| **disputed** | ≥2 sources and at least one materially contradicts the claim |
| **unverified** | < 2 independent corroborating sources found |

---

## Steps

1. **Extract the central claim.** Reduce the article to its checkable assertion(s). Verify the claim, not the headline phrasing.
2. **Gather ≥2 independent sources.** Cross-reference against other trusted publishers in the CNOS DB. "Independent" means different publisher AND not a syndication of the same wire copy — a PTI/ANI reprint chain counts as ONE source, not many.
3. **Match.** Compare the central claim across the gathered sources. Record `match_count` (how many independent sources corroborate) and capture the corroborating source URLs.
4. **Assign the verdict band.** Apply the table above strictly. `match_count >= 2` is the floor for any verdict above `unverified`.
5. **NEVER verified on a single source.** One source — however reputable — yields `unverified`, never `verified`. No exceptions, no "trusted publisher" override.
6. **Surface what corroborated it.** The verdict ships with the corroborating source URLs and `match_count` visible in the Trust Strip. "Verified" without showing WHAT verified it is forbidden (Explainability rule).
7. **Write the `why` trail.** Log rule + sources + confidence so the verdict is auditable in <1 tap.
8. **Honor drift.** A verdict may downgrade later (new contradicting source) and reflects immediately. It NEVER upgrades silently — every `verified` re-requires the ≥2-source match at verdict time.

---

## Hard rules

- NEVER show a `verified` verdict without ≥2 independent source corroboration.
- NEVER show "Verified" without showing what verified it.
- NEVER fake a confidence score or hallucinate a corroborating source.
- A single source = `unverified`. Always.
- Show uncertainty when present; partial/disputed are honest answers, not failures.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
