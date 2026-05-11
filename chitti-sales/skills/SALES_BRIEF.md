# SALES_BRIEF — Chitti Sales

Plain-language sales coach for Indian MSME owners. Voice-first, 12 languages, server-enforced "coaching, not a guarantee" disclaimer. Distilled from 10 sales books and reframed for the Indian small-business context. Proposed frontend `chitti_sales.html`, proposed backend [../README.md](../README.md). **As of 2026-05-12 the product is docs-only — no backend, no frontend, no deploy.**

## Ten pain points

1. A kirana owner has steady walk-in traffic but the same customer never comes back a third time. No referral happens. Owner does not know that *retention* is a skill, not luck.
2. A salon owner watches 30 percent of bookings turn into no-shows. She has no script for the WhatsApp reminder that gets the no-show client to confirm.
3. A home tutor with five years of perfect parent feedback cannot bring herself to raise prices. She is the cheapest tutor in her area and is being undercut on quality, not price.
4. A small pharmacist's customer asks for the doctor-prescribed brand. The generic equivalent has a 40 percent higher margin. The pharmacist does not know how to offer the generic *honestly* — without lying about composition or making the customer suspicious.
5. A restaurant owner watches weekday lunch service run at 20 percent capacity. The office building next door has 200 employees who order from Swiggy. He does not know how to walk in and pitch a 10-meal corporate tab without sounding desperate.
6. A freelance designer is paralysed by the first cold DM. She has 12 perfect portfolio pieces and zero opening line. She types, deletes, types, deletes, and ends the day with nothing sent.
7. A gym owner sees 80 percent of new members vanish in month two. He thinks the problem is the workout. The problem is that no one called the member after week one to ask how it was going.
8. An MSME manufacturer's biggest distributor is asking for an additional 5 percent margin. The owner is afraid to say no. He has not been taught how to negotiate without poisoning the relationship.
9. A blind kirana owner cannot read a sales-tactics blog. There is no Hindi audio source for him. His nephew reads English MBA articles aloud and translates badly.
10. A first-generation MSME owner with a Class-10 education watches the b-school-educated competitor across the road run loyalty cards, festival campaigns, referral bonuses. She has the better product. She does not have the vocabulary for what he is doing.

## Ten benefits

1. Plain Hindi / English / Tamil / Telugu / Bengali / Marathi explanation of one specific sales tactic per question — never a wall of text.
2. 12 reply languages out of the box — en, hi, ta, te, bn, mr, gu, kn, ml, or, pa, ur. Same set as [chitti-ca](../../chitti-ca/) and [chitti-legal](../../chitti-legal/).
3. Voice IN (browser `SpeechRecognition`) so a blind or low-literacy MSME owner can dictate the question.
4. Voice OUT (`SpeechSynthesis`) so an illiterate user hears the coaching aloud — and a deaf user reads it on screen.
5. Every tactic is attributed to one of 10 named sales books — so the user knows where the idea came from and the model cannot fabricate. See [GUARDRAILS.md](GUARDRAILS.md).
6. Every reply ends with one **concrete action for this week** — small, free, doable without any new tool. Coaching becomes a behaviour change, not a reading list.
7. Indian MSME reframing — Fortune-500 examples become kirana / salon / tutor / dhaba examples; ₹ instead of $; festival cycles instead of fiscal quarters; WhatsApp instead of Salesforce.
8. Stateless — no account, no Aadhaar, no customer data stored. See [../DATABASE.md](../DATABASE.md). Privacy posture matches Chitti CA and Chitti Legal.
9. Server-enforced disclaimer (prompt + post-processor) means the user is always reminded that outcomes depend on their product, price, market, and effort — never on a promised closing rate. See [BOUNDARIES.md](BOUNDARIES.md).
10. Free to the citizen. No paywall, no subscription, no upsell to a paid tool. The product is the coach, not a funnel into something more expensive.
