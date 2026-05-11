# SALES_BRIEF — Chitti Legal

Plain-language Indian-law explainer. Voice-first, 12 languages, three-layer disclaimer. Frontend [../../chitti_legal.html](../../chitti_legal.html), backend [../README.md](../README.md).

## Ten pain points

1. An advocate charges 1,500–2,500 just to read a notice aloud and tell the user what it is. The user has not yet decided to hire anyone.
2. A first-generation renter signs an 8-page rent agreement without understanding "lock-in", "indemnity", "security deposit forfeiture", or "force majeure".
3. A Section 138 cheque-bounce respondent does not know the 15-day clock has started, let alone what triggers it.
4. An FIR holder cannot tell from the form whether they are the complainant or the accused.
5. A widow served a recovery notice for her late husband's loan does not know which document to bring to a lawyer.
6. A small-shop owner served a District Consumer Disputes Redressal Commission complaint does not know whether to reply within 30 days or 45.
7. A delivery driver handed a motor-accident claim notice cannot afford to lose a weekday wage on a lawyer-meeting before knowing if it is serious.
8. A tenant about to be evicted does not know an eviction notice has a typical response window — and misses it.
9. A blind user has no way to read a paper notice. Family members read it badly or self-serve a "you should ignore this" answer.
10. An illiterate user is asked to sign an affidavit they cannot read and trust the notary to have translated it honestly.

## Ten benefits

1. Plain Hindi / English explanation of any clause, in under 10 seconds.
2. 12 reply languages out of the box — en, hi, ta, te, bn, mr, gu, kn, ml, or, pa, ur.
3. Voice IN (browser `SpeechRecognition`) so a blind or low-literacy user can dictate the notice.
4. Voice OUT (`SpeechSynthesis`) so a deaf-blind path is at least readable on screen and an illiterate user hears it.
5. Deadlines first — for any time-sensitive notice, the reply opens with the response window so the user does not miss the clock.
6. Three-layer disclaimer (prompt + post-processor + UI bar) means the user is always nudged toward a licensed advocate.
7. Stateless — no account, no Aadhaar stored, no replay of sensitive numbers. See [BOUNDARIES.md](BOUNDARIES.md).
8. Free to the citizen. No paywall, no subscription, no upsell.
9. Honest stubs — the page tells the user what Chitti will not do (draft, predict, advise to ignore) up front. See [VALUES.md](VALUES.md).
10. Hand-off questions — every reply closes with two or three questions the user should ask their advocate. The next meeting starts smarter.

