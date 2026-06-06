# SOP-004 — Handle a Vernacular Coverage Gap

> World Class CNOS — Commando Discipline. Zero Excuses.

Mechanical procedure for detecting and honestly handling a thin (state × language × category) coverage cell — including the hard case where no public RSS exists for a language (e.g. Gujarati public RSS = 0).

---

## Profile

| | |
|---|---|
| Owner | News Agent + source maintainer; Personalization Agent for user-facing narration |
| Cadence | Nightly automated check; on-demand when a user hits a thin cell |
| Trigger | Nightly [`scripts/coverage_sla_check.py`](../backend/scripts/coverage_sla_check.py); OR a feed request returns < per-cell minimum |
| Escalation | No public RSS exists for the language → escalate app-API capture (mitmproxy) to Sire — never fake the cell with translation |

---

## Steps

1. **Run the nightly check.** [`scripts/coverage_sla_check.py`](../backend/scripts/coverage_sla_check.py) counts articles per (state, language, category) over the last 24h and writes `coverage_sla_report_<date>.json`.
2. **Identify thin cells.** Any cell below the per-cell minimum (default 5/24h) is a violation. Rank by reader impact (high-population state × high-demand language × news-critical category first).
3. **Attempt publisher discovery.** For each thin cell, run [`scripts/publisher_discovery.py`](../backend/scripts/publisher_discovery.py) targeting that language (`main(target_lang=...)`). Output → `publisher_discovery_<lang>_<date>.json`. If a real RSS/Atom feed is found, hand off to **SOP-001** to onboard it.
4. **Narrate the gap honestly to the user.** While the cell is thin, the feed response carries a `coverage` payload that tells the reader the truth: which languages/states/categories are thin and why. NEVER pad the feed with off-topic, stale, or machine-translated filler to hide a gap. An honest empty cell beats a fake full one.
5. **Track persistence.** If a language stays below SLA for 7 consecutive days, auto-create a TODO entry in [`../TODO.md`](../TODO.md) and surface it on the Founder dashboard.
6. **Escalate when no public RSS exists.** Some languages (e.g. Gujarati) publish only inside mobile apps with no public RSS. When discovery returns nothing across runs, escalate to Sire to capture the publisher's app API via mitmproxy (see the Sandesh / Divya Bhaskar pattern). This is the ONLY sanctioned path to that cell — do not substitute translation.
7. **Re-verify after onboarding.** Once a new source lands (SOP-001 step 9), re-run `coverage_sla_check.py` and confirm the cell is now ≥ minimum. Close the TODO only on a verified green cell.

---

## Hard rules

- An honest coverage gap is reported, never hidden.
- NEVER translate-and-ship another language's feed to fake vernacular coverage (Founder Rule: Truth > Virality).
- NEVER pad a thin cell with stale or off-topic articles to clear the SLA number.
- No public RSS → escalate app-API capture to Sire; do not fabricate the cell.
- The `coverage` payload is mandatory whenever the feed is thin.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
