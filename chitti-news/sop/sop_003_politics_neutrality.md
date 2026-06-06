# SOP-003 — Politics Coverage Neutrality

> World Class CNOS — Commando Discipline. Zero Excuses.

Mechanical procedure for enforcing zero partisan framing in political coverage. Politics is where trust is most easily lost; this lock is non-negotiable.

---

## Profile

| | |
|---|---|
| Owner | Politics Agent ([`skills/chitti-news-politics/`](../skills/chitti-news-politics/)) |
| Cadence | Weekly automated eval; per-article at summarize time |
| Trigger | Any politics-category article; weekly [`scripts/neutrality_eval.py`](../backend/scripts/neutrality_eval.py) run |
| Escalation | Any partisan-label hit → alert immediately; block release until 0 violations restored; >0 per quarter is a release blocker |

---

## The neutrality standard

| Metric | Target |
|---|---|
| Partisan adjectives per 100-article sample | **0** |
| Equal-coverage rule | Every party / candidate in a story gets the same factual treatment — same fields, same depth, same tone |
| Verdict | Last run: 0/100 violations (2026-06-03) |

---

## Steps

1. **Strip framing at summarize time.** The 3-bullet "Chitti's Take" reports what happened, who said what, and what is verifiable — never who is right. No partisan adjective enters a summary.
2. **Apply the equal-coverage rule.** If a story names multiple parties/candidates, each is described with the same factual fields and the same neutral tone. No party gets a hero or villain frame.
3. **Never label a story partisan.** CNOS does not tag a story, party, or reader as "left," "right," "pro-X," or "anti-Y." Report the claim and the source; let the reader judge.
4. **Run the weekly eval.** [`scripts/neutrality_eval.py`](../backend/scripts/neutrality_eval.py) samples 100 politics articles across the covered states and scans summaries against the curated partisan-label dictionary. Output → `neutrality_report_<date>.json`.
5. **Check the score.** 0 violations = pass. Any hit = fail; the run is RED.
6. **On a violation:**
   1. Alert immediately (Founder dashboard + Sire).
   2. Identify the offending summary and the triggering term.
   3. Fix the summary AND, if the term is a true partisan adjective, add it to the dictionary so the eval catches it next time (expand the eval, don't just patch the row).
   4. Re-run `neutrality_eval.py` until 0/100.
   5. Block any politics release until the score is back to 0.
7. **Log the resolution.** Record root cause → fix → re-test in the per-release report so the same framing cannot recur silently.

---

## Hard rules

- 0 partisan adjectives per 100-article sample. >0 = release blocked.
- NEVER label a story, party, or reader.
- Equal coverage is structural, not optional — same fields, same depth, same tone for every named actor.
- A violation expands the dictionary, not just the single summary.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
