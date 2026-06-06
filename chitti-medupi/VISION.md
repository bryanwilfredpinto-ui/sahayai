🎖️ World Class Chitti MedUPI — Commando Discipline. Zero Excuses.

# CEOS Level 1 — VISION (Chitti MedUPI)

Authored 2026-06-06

> Mission + Vision for the medicine-cost bodyguard. Bounded above by
> [CONSTITUTION.md](CONSTITUTION.md) (L0) and
> [SAHAYAI_MASTER.md §2](../SAHAYAI_MASTER.md). Everything here is an
> *aspiration the Constitution permits* — never a licence to relitigate a lock.

---

## The problem, in one paragraph

In India, **medicines are 50–70% of out-of-pocket healthcare spend.** A typical
chronic-illness family (diabetes / BP / thyroid) burns **₹8,000–₹15,000 a year on
medicines alone.** For the *same molecule + same strength + same dosage form*,
branded vs generic vs Jan Aushadhi pricing can vary by **up to 5x**. Most people
don't know an equivalent exists, where the nearest Jan Aushadhi store is, or that
an NPPA-notified ceiling price exists at all. The result is skipped doses,
financial stress, and decisions taken on a chemist's word at the counter.
Tier-2/3 families in Bhopal, Indore, Pune, Lucknow — middle and lower-middle
class, elderly parents, daily-wage earners — pay the steepest price for this
information asymmetry.

## Mission

> **Cut out-of-pocket medicine cost for every Indian family — by surfacing the
> cheapest STRICT same-composition generic, the nearest Jan Aushadhi price, and
> the NPPA ceiling cross-check, in one scan, in the user's own language, usable
> by every one of the four users.**

We close the information gap at the counter. We never touch the prescription.
The family keeps more rupees; the doctor and pharmacist keep their authority.

## Vision (the world we are building toward)

> **A Bharat where no family skips a dose because they didn't know a same-molecule
> generic was a fifth of the price — and where a blind grandmother, a deaf
> caregiver, a mute teenager, and a parent who cannot read a label all get the
> same honest number, spoken, captioned, and signed.**

## What guides every call

1. **Savings is the product, not engagement.** The North Star is ₹ saved per
   cart vs branded — un-gameable by time-in-app. We never measure addiction.
2. **Strict match is a safety contract, not a feature.** A cheaper *wrong* answer
   is worse than no answer. Cross-molecule leakage is a hard zero.
3. **Voice-first, Hindi-first, four-user-floor.** The vernacular elderly
   caregiver on a 2G phone is the design centre; everyone else benefits.
4. **Neutral intelligence, never a marketplace.** We surface prices; we never
   sell, cart, or take a cut. No pharmacy pays for placement.
5. **Honest over impressive.** Unconfigured snippets, low-confidence scans, and
   unknown molecules are disclosed, never faked.

## Three-horizon vision

### Horizon 1 — Now (LIVE, GREEN): the bill bodyguard
Strict same-composition compare engine over **211,207 real medicine rows** (Apollo
dataset), Jan Aushadhi price + savings, NPPA ceiling cross-check, risk banding,
family wallet, refill/expiry reminders, insurance match, community prices, and
strip/text recognition — all voice-first across **26 languages** (26/26 verified
at 99–100% coverage). DeepSeek vision degrades honestly until the key is funded.
*Goal: a family saves real rupees on this month's chronic-care cart.*

### Horizon 2 — Next (PARTIAL / queued): the proactive guardian
DeepSeek vision fully funded so a photographed prescription becomes a complete
priced list; price alerts fanned out over WhatsApp / Twilio voice for
grandparents without smartphones; expiry reminders pushed at add-to-wallet time;
a curated, HIGH-risk-gated medicine-interaction checker; deeper community-price
density per pincode. Cross-links into Chitti Health Scanner and Chitti
Government's PMJAY checker mature.
*Goal: Chitti warns the family before the refill, the expiry, or the overcharge.*

### Horizon 3 — Future (needs partnership / regulator): the connected wallet
Live Jan Aushadhi store inventory (PMBI partnership), pharmacist-confirmed
substitution audit trail (a future Chitti Pharmacy shop product), and ABDM-linked
medication history (HFR/HPR enrolment). Community-donated voices replace Bhashini
per language as each crosses the quality threshold.
*Goal: every Indian family carries a lifelong, portable, voice-first medicine
wallet that pays for itself on the first refill.*

## Who we build for, in order

The **family caregiver buying medicines on a fixed budget** — Tier-2/3, elderly
parents, vernacular — is the primary user (CHITTI_SOP §2). The four-user
contract (Blind / Deaf / Mute / Illiterate) is the floor under that. The
standalone `chitti_medupi.html` page is an internal service + dev/debug surface;
in production every capability routes through **Chitti Vaani**, the sole
user-facing interface ([SAHAYAI_MASTER.md §2 row 1](../SAHAYAI_MASTER.md)).

## What success looks like

A daughter in Indore photographs her father's diabetes strip. In her language,
spoken aloud, Chitti says: *"Same composition, four options, the cheapest is Jan
Aushadhi Metformin at ₹12 — you save ₹40, that's ₹480 a year. This is a HIGH-risk
medicine — confirm the switch with your doctor."* She logs it to her father's
wallet, sets a refill reminder, and walks into the pharmacy knowing the number.
**That is the mission, working.**
