# SALES BRIEF — Chitti Government

Why this product exists, in the words of the users it serves. India runs 2,300+ welfare schemes; the people who would benefit most are the ones least equipped to navigate the maze.

## 10 pain points

1. **An illiterate user cannot read the PM-Kisan form.** Every portal UI is English-first; pmkisan.gov.in's registration screen has no Hindi voice prompts.
2. **The user doesn't know which scheme applies to them.** PMAY-G vs PMAY-U vs Indira Awas Yojana — the names blur together; nobody at the gram panchayat has time to explain.
3. **The user cannot find the local CSC / Aadhaar Seva Kendra / post office** that processes the application. Google Maps lists them in English with no voice navigation.
4. **Brokers and middlemen exploit the gap.** A "scheme agent" charges Rs 500–2,000 to fill a form the user could have filed for free at a CSC.
5. **The user doesn't know they are excluded.** PM-Kisan silently rejects income-tax payers, MPs/MLAs, Group A officers — but pmkisan.gov.in lets them try first.
6. **The user cannot check status.** No public API for PM-Kisan, PMAY, PMJAY, MGNREGA. The user travels to the block office to ask.
7. **Document expiry catches the user out** — Aadhaar address mismatch, expired BPL card, missing ration update — and the application is rejected.
8. **Hindi-only IVR helplines** exclude Tamil / Telugu / Bengali speakers in the same scheme.
9. **PIB announcements about new schemes** don't reach the village in time; by the time the local newspaper carries it, the application window has closed.
10. **Blind / deaf / mute users are simply unserved.** No portal honours the four-user contract.

## 10 benefits Chitti Government delivers

1. **Voice-first eligibility check** — one tap, one utterance, deterministic verdict in 80-120 spoken words.
2. **Plain-Hindi explainer** — no jargon; every acronym expanded on first use.
3. **Nearby-office locator** — CSC, post office, Aadhaar Seva Kendra, ration, Jan Aushadhi, panchayat, bank, police — Nominatim + Google Maps fallback.
4. **Free, anonymous, no broker** — profile in `localStorage`; nothing logged server-side.
5. **Exclusions read aloud upfront** — the user hears the disqualifiers before applying.
6. **Honest status handoff** — Chitti opens the official portal and tells the user "Chitti cannot see your Aadhaar; type it there."
7. **Document expiry tracker** — 90 / 30 / 7-day browser alerts so the application isn't rejected on a stale doc.
8. **Multilingual** — 12 Indian languages on the eligibility coach via the Voice Factory substrate.
9. **PIB alerts every 6 hours** — new-scheme headlines reach the user the day they're announced.
10. **Four-user accessibility contract** — Blind / Deaf / Mute / Illiterate, plus the elderly fifth persona — non-negotiable on every screen. See [`../CONTEXT.md`](../CONTEXT.md).
