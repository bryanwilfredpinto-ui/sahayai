# Chitti Sales — B2B-to-B2C Flywheel

## Why this doc exists

Chitti Sales is a B2C product on its face — any small-business owner can land on the page, ask a question, and walk away with one tactic. But B2C acquisition for a vernacular voice-first product is expensive: paid acquisition is poorly targeted in Hindi / Tamil / Telugu; the typical MSME owner does not browse SaaS landing pages; SEO is dominated by US sales blogs.

The cheaper, more honest growth path is **B2B-to-B2C cascade**: sign up **one trusted intermediary** (a CA firm, a CS firm, a microfinance NGO, a District Industries Centre, a Self-Help Group federation) and let *their* network of end-clients become the B2C user base. The intermediary's clients trust the intermediary; the intermediary, in turn, distributes Chitti as a free value-add.

This doc lays out the five stages, with Indian examples, so the product and the partnership team can build the same scaffolding from day one.

## The five stages

```
Stage 1: B2B contract       (sign one trusted intermediary)
   │
   ▼
Stage 2: Onboarding kit     (intermediary's clients meet Chitti)
   │
   ▼
Stage 3: End-user delight   (an MSME owner's first tactic works)
   │
   ▼
Stage 4: Referral cascade   (MSME owner tells family + neighbour)
   │
   ▼
Stage 5: B2C revenue        (broader Sahay AI cross-sell)
```

---

## Stage 1 — B2B contract

**Goal.** Sign one intermediary whose own credibility is the wedge.

**Indian example.** A mid-sized Chartered Accountant firm in Pune signs up to offer "the full Chitti family" to its **200 SMB clients** as a free value-add bundled into its annual retainer. The CA firm is not paying for Chitti — Sahay AI offers it free at this stage. The CA firm is paying with *its own brand trust*.

**Why CA firms first.** CAs are already the most-trusted advisor for an Indian MSME owner. The CA tells the MSME: "Use Chitti Sales for the marketing question you keep asking me but I can't answer." The MSME tries it because the CA said so.

**Other intermediaries to target in parallel.**

- **Company Secretary firms** (similar trust profile to CAs, often serve the same MSME owners).
- **MFI / microfinance NGOs** (BASIX, Bandhan, Ujjivan-style) — they have direct contact with thousands of nano-entrepreneurs who would never find a sales blog on their own.
- **District Industries Centres** (state-government MSME support offices, one per district) — institutional reach.
- **Self-Help Group federations** (SHG federations across rural Tamil Nadu, Telangana, Bengal) — women-owned micro-enterprises who are exactly the user we want to serve.
- **Khadi & Village Industries Commission cells** — artisan-MSME pipeline.

**What "signing" looks like at this stage.** A one-page MoU, no payment, the intermediary agrees to (a) put Chitti links in its client portal / WhatsApp broadcast / quarterly newsletter, and (b) share **anonymised** aggregate usage metrics with Sahay AI quarterly. That's it. No revenue share, no exclusivity. We need the cascade, not the cash.

---

## Stage 2 — Onboarding kit

**Goal.** When the intermediary's client (an MSME owner) first encounters Chitti, the friction is zero.

**Indian example.** The Pune CA firm sends a monthly WhatsApp broadcast to its 200 clients. One Tuesday the broadcast includes:

> *"Apne business mein ek bechain savaal hai jo CA se nahi pooch sakte? Chitti Sales se poochiye — Hindi mein, free, kuchh download nahi karna."*  
> *— A link to chitti_sales.html, with the CA firm's name as the referrer.*

Of the 200 clients, perhaps 40 click the first time, 25 ask a question, 12 come back the second week.

**The onboarding kit Sahay AI builds for the intermediary.**

- **WhatsApp broadcast text** in Hindi + English + 5 regional languages, ready to copy-paste.
- **One-page PDF** the intermediary can print and hand out at meetings — a QR code that goes straight to the relevant Chitti page.
- **A "powered by Chitti" footer** the intermediary can embed in their own client portal.
- **A monthly anonymised usage report** the intermediary can show its clients ("your 200 clients asked Chitti 1,200 questions this month — here are the top 3 themes").
- **Topic chips matched to the intermediary's vertical.** A CA firm's clients see CA-adjacent topics first (pricing for service providers, retention for kirana owners). An MFI's clients see MFI-adjacent topics first (cold-calling a wholesale supplier, asking for credit terms, retention of bulk buyers).

This kit is the difference between a logo on a landing page (which converts ~0%) and a CA's WhatsApp message (which converts ~20% on first send, in our internal estimate — to be validated once live).

---

## Stage 3 — End-user delight

**Goal.** The MSME owner's first Chitti Sales session must produce **one concrete action this week** that the owner can recognise as useful — even before they try it.

**Indian example.** A 38-year-old kirana owner in Pimpri-Chinchwad — let's call her Vandana — asks (in Hindi): "Mere paas customers aate hain, lekin wapas nahi aate. Kya karoon?"

Chitti's reply (one tactic, named, with a book attribution, with one action for this week):

> *"Vandana ji, ek baat try karte hain. Carnegie ki kitaab 'How to Win Friends and Influence People' mein ek simple tactic hai — customer ka naam yaad rakho, aur unke ghar ke kisi expressly cheez ke baare mein next visit pe poochho.*
>
> *Is hafte ka kaam: kal subah jo bhi customer dusri baar aaye, unka pehla naam pata kar lo. Phir Friday tak, unka beta / beti / ghar ka kuchh small detail yaad rakho. Saturday ko jab voh phir aayen, naam se bulao aur unke baare mein poochho — 'Beta ka exam kaisa gaya?'*
>
> *Yeh ek hafta try karo. Dus regulars ke saath start karo, dus mahine mein dukan badal jaayegi.*
>
> *— Tactic adapted from* How to Win Friends and Influence People *by Dale Carnegie.*
>
> *This is sales coaching from distilled books, not a guarantee. Your results depend on your product, price, market, and effort."*

The point: Vandana walks away with one thing to try tomorrow, named to a book she now knows exists, in Hindi, in 30 seconds of reading.

**The "delight" metric.** Thumbs-up rate on the feedback widget ([../feedback-widget.js](../feedback-widget.js)). Internal target: 65% on first session. Below 50% and the prompt needs revision.

---

## Stage 4 — Referral cascade

**Goal.** Vandana tells her brother-in-law (who runs a salon), her neighbour (who runs a tutoring centre), and the local SHG federation she is part of.

**Indian example.** Vandana's "Beta ka exam kaisa gaya?" experiment works. Three of her ten regulars start coming in twice a week, not once. Two of them bring a friend. In her next SHG meeting, she mentions Chitti Sales. The federation has 40 women across 12 SHGs. 25 of them try it. The cascade is now operating without the original Pune CA firm's involvement.

**The product-level levers that drive the cascade.**

1. **Shareable, language-tagged URLs.** When Vandana shares Chitti, the link carries the language tag so her Marathi-speaking neighbour lands directly in Marathi.
2. **No login.** A friend-of-friend who clicks the link is in the product in zero seconds.
3. **Voice-first.** The neighbour who cannot read a long English landing page just taps the mic.
4. **The feedback widget's "Tell a friend"** suggestion button. (Not built yet — see [../TODO.md](../TODO.md). This is a concrete v2 lever.)
5. **The thumbs-up confirmation text.** The toast on a thumbs-up could say "Glad it helped. If a friend would find it useful, share this link: …" — opt-in, not pushed.

**Anti-pattern.** No referral bounty (we are not paying users to refer). No locked content (everything is free, always). No "premium tier". The cascade is fueled by *the tactic worked*, not by a discount code.

---

## Stage 5 — B2C revenue (broader Sahay AI cross-sell)

**Goal.** Vandana, having tried Chitti Sales and found it useful, now uses [Chitti CA](../chitti-ca/) for her quarterly GST question, [Chitti Government](../chitti-government/) when the local government announces a kirana-owner subsidy, and [Chitti MedUPI](../chitti-medupi/) when her mother's medicines get expensive. Across one user, the family of Chittis becomes a household utility.

**Why this is the actual revenue model.**

- Chitti Sales **on its own** is not a paid product. The MSME owner cannot afford to pay for a coach.
- Chitti **as a family** is monetizable through:
  - **Premium B2B contracts** with intermediaries who want SLA, branded versions, custom verticals (Stage 1 graduates).
  - **Government grants** for accessibility-first MSME tooling (the four-user contract is a real differentiator with state-government MSME departments).
  - **Foundation funding** for the financial-inclusion side (medupi, government schemes).
  - **Voluntary contributions** from MSME owners who got real value (an explicit "buy Chitti a chai" button — not yet built).

The flywheel logic: **B2B subsidises B2C, B2C delights the end user, end-user delight drives the referral cascade, the cascade enlarges the B2C base, the B2C base attracts more B2B intermediaries.** Each turn of the wheel widens the next.

---

## Why a CA firm in Pune onboarding 200 SMB clients is the *prototype*

Run the math, generously.

- 200 clients × 20% first-month engagement = **40 active MSME owners**.
- 40 active MSME owners × 1 tactic-that-worked × 2 referrals each = **80 new B2C users** in month two.
- 80 new B2C users × 30% who cross over to [Chitti CA](../chitti-ca/) or [Chitti Government](../chitti-government/) = **24 cross-product users**.
- One CA firm in Pune → **300+ users across the Chitti family** in the first quarter, zero acquisition spend.

Replicate across **10 intermediaries** in year one (3 CA firms, 2 CS firms, 2 MFIs, 2 SHG federations, 1 DIC). Same math, **3,000+ users**. None of this is paid acquisition. All of it is honest distribution by trusted local intermediaries to the exact MSME owners we want to serve.

That is the flywheel. The job of every doc in `chitti-sales/`, of every feedback signal in [FEEDBACK_CAPTURE.md](FEEDBACK_CAPTURE.md), and of every safety guardrail in [skills/GUARDRAILS.md](skills/GUARDRAILS.md) is to make sure that when the cascade reaches an end user, what they encounter is **a coach who serves them honestly** — not a funnel into something they cannot afford.
