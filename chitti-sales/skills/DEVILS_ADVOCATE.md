# Chitti Sales — DEVILS_ADVOCATE

Eight honest critiques of the current scaffold. Listed so we do not pretend the docs are more than they are. **As of 2026-05-12 there is no backend code; some of these critiques are about the proposal itself.**

## 1. Top-10 sales books are Western — Indian MSME context is different

The canon ([../SALES_BOOKS.md](../SALES_BOOKS.md)) is dominated by US business writers. Carnegie was a railroad-era American. Rackham studied IBM. Voss negotiated for the FBI. Ross built Salesforce's outbound team. The contexts — Fortune-500 procurement, B2B enterprise SaaS, hostage negotiation — are far from a kirana counter in Indore or a salon in Madurai.

The mitigation is the "Indian MSME reframing" rule in [../PROMPTS.md](../PROMPTS.md) — every tactic must be translated into Indian small-business terms. But this is a model behaviour, not a guarantee. The reframing will sometimes feel forced or stilted; the user might think "this is American advice in Hindi clothing" and bounce.

A genuinely better v2 would add **Indian sales references** to the canon — Subroto Bagchi's *The High-Performance Entrepreneur*, *The Tata Way*, MSME case studies from Stanford India / IIM Bangalore — and reduce the Western weight. This is out of scope for v1 because we are trying to ship a useful coach with a fixed canon first, not curate a culturally perfect one.

## 2. Text-only coaching is not as effective as roleplay

The thing that actually makes someone a better salesperson is **practising the pitch out loud, having someone push back, and adjusting**. A text wall ("here is the SPIN method") is a poor substitute for "let's rehearse your cold-call opening — try it, I'll be the parent".

[../TODO.md](../TODO.md) calls this out: a multi-turn "rehearse with me" mode using the Voice Factory STT + TTS is the obvious v2. Until that lands, the user gets reading material, not practice. Honest stance: ship what works today, name what's missing.

## 3. No CRM integration means user cannot track if advice worked

If a kirana owner tries "ask the second-visit customer about their child's exam" (Carnegie), did it actually bring the customer back a third time? Chitti has no idea. The product cannot measure its own efficacy.

[../DATABASE.md](../DATABASE.md) sketches an opt-in `sales_outcomes` table for a v2. Today there is nothing. The result: we cannot tell which tactics actually work for Indian MSME users vs. which the model just liked the sound of. The B2B-to-B2C flywheel ([../B2B_TO_B2C_FLYWHEEL.md](../B2B_TO_B2C_FLYWHEEL.md)) depends on word-of-mouth from users who saw real results — and we are flying blind on whether those results are happening.

## 4. DeepSeek may hallucinate tactic attributions

The single highest-cost failure mode (see [GUARDRAILS.md](GUARDRAILS.md)). The model knows the 10 books well enough to mostly cite correctly, but it will sometimes attribute a Carnegie tactic to Voss, or invent a "Cialdini's seventh principle" that does not exist. The prompt forbids it. The disclaimer hedges it. But until [OBSERVABILITY.md](OBSERVABILITY.md)'s per-tactic-citation audit is wired, we will not catch a drift early.

A RAG approach (load the 10 books as a retrieved corpus, force the model to cite a specific paragraph) would solve this. Out of scope for v1 — we do not have rights to the book text and we have not built retrieval infrastructure. The honest stance is the prompt rule "if you are not sure, say 'this is general sales wisdom, not from one of the 10 books'."

## 5. The Western canon may push manipulative tactics by default

Cialdini's *Influence* is a famous book partly *because* it documents how to manipulate. The Klaff frame-control method, the Voss tactical-empathy method, the Tracy presumptive-close method — all sit on the edge of "service" and "manipulation" depending on intent.

[BOUNDARIES.md](BOUNDARIES.md) item 2 forbids dark patterns explicitly, and the prompt strips the manipulative reframe. But prompts are leaky. A user who asks "how do I trick this customer into buying" will sometimes get a reply that mostly resists and partly enables. The audit hook in [OBSERVABILITY.md](OBSERVABILITY.md) needs to include a dark-pattern check (substring scan for "fake scarcity", "false urgency", "exaggerate") — not yet wired.

## 6. Twelve-language reply map is narrower than [Voice Factory](../../chitti-voice-factory/)'s 26

Same critique as Chitti CA's devils-advocate item 2. The proposed map covers en/hi/ta/te/bn/mr/gu/kn/ml/or/pa/ur (12 languages). [Chitti Voice Factory](../../chitti-voice-factory/) ships 26 (including Sanskrit and Oraon). A user whose language is in the missing 14 will see their language code passed through verbatim. Graceful but second-class.

## 7. No outcome data means we cannot prioritise tactics

Which of the 10 books has the highest user-reported success rate for Indian MSME owners? Carnegie? Voss? Tracy? Without the outcome table sketched in [../DATABASE.md](../DATABASE.md), we cannot say. The model will weight the books by how strongly it knows them, not by what actually works. A product update cycle without efficacy data is updating on vibes.

## 8. Voice-first promise is browser-only in v1

Same critique as the other coaching Chittis. `webkitSpeechRecognition` and `SpeechSynthesis` have patchy Indian-language coverage — Odia, Punjabi, Urdu, Malayalam suffer most. Until the [Chitti Voice Factory](../../chitti-voice-factory/) cascade is wired (item 5 in [../TODO.md](../TODO.md)), the four-user contract is weaker on phones without Web Speech. This affects exactly the users we are trying to serve — Tier-2 / Tier-3 MSME owners on budget Android.
