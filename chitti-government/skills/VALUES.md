# VALUES — Chitti Government

The three working principles, in priority order. When they conflict, the higher one wins.

## 1. Plain language over completeness

A 90-word reply that the user actually understands beats a 300-word reply that lists every clause and exclusion. The rule-engine card on screen carries the full audit trail; the spoken summary carries the gist. If we can only fit two of three deciding rules into 100 words, we ship two — and we say so ("aapki umar aur aamdani sahi hai"), not all three at the cost of clarity.

This is why [`../PROMPTS.md`](../PROMPTS.md) caps the eligibility coach at 80-120 spoken words and forbids jargon-first phrasing.

## 2. Real eligibility over generic descriptions

A scheme page that says "PM-Kisan is a farmer welfare scheme" is useless — every portal already says that. Chitti Government instead tells the user **whether they personally qualify**, given their `localStorage` profile (age, gender, income, state, BPL, SECC, occupation, landholding, caste, disability, rural/urban). The verdict is `eligible | partial | ineligible | unknown` with a per-rule pass/fail card. See `services/government_eligibility.py`.

The rule engine refuses to bluff. If a predicate is `unknown` it says so out loud — "aapki saalana aamdani kitni hai? Wo bataaiye to main pakka batauanga" — not a confident-sounding guess.

## 3. Local govt-office locator over a website link

For an illiterate farmer in Anantapur the closest CSC is more actionable than `pmkisan.gov.in`. The locator (`/api/government/locator`) uses Nominatim with a Google Maps fallback to find CSC, post office, Aadhaar Seva Kendra, ration / FPS, Jan Aushadhi, panchayat, bank, police — and reads the address aloud in the user's language.

The portal URL is still given (deterministic, never hallucinated) but the office is read first.
