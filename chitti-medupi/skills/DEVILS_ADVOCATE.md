# DEVILS_ADVOCATE — Sharp Self-Critiques

Eight critiques a hostile reviewer (a paediatrician, a chemist union lawyer, a pharma sales rep, a privacy auditor, a disabilities-rights advocate, an investigative journalist) would make. Each is followed by the **honest answer** — not a rebuttal, not a deflection. Where the critique lands, we say so.

---

## 1. "Your strict-match guardrail blocks the user from seeing cheaper-but-equivalent therapeutic alternatives. A patient on Atorvastatin paying ₹400 will never learn that Rosuvastatin at ₹120 is in the same therapeutic class."

**Honest answer:** Yes — and that is the trade-off we choose every time. A therapeutic-class equivalence engine would help in some cases and kill someone in others. We are not licensed to make that call, and the user deserves to have that conversation with a doctor who *is* licensed. MedUPI gives the user the data to walk into the clinic prepared ("doctor, is there a same-class alternative I can switch to?"), not the substitution itself. We lose savings in the average case to prevent harm in the tail case. We will never relax this.

---

## 2. "Your Jan Aushadhi store list is only as fresh as your last loader run. A store that closed last month will still show up. A new store that opened yesterday won't. You are routing Blind users to addresses that may not exist."

**Honest answer:** True, and this is a real risk. We mitigate by (a) logging every loader run with a timestamp visible in the response payload, (b) showing a freshness pill on the geo result, and (c) defaulting to the by-state fallback list when haversine finds nothing within radius. We do not, however, ping each store before showing it — that is impractical. Long-term fix: BPPI store-status API once they publish one. Until then: stale data is acknowledged, never hidden.

---

## 3. "You claim the product works for Blind users, but your vision scanner is the marquee feature. If the LLM key is unset or the model is down, the Blind user is locked out of the headline flow."

**Honest answer:** The Blind user is *not* locked out. The fall-through is voice search: the user speaks "Crocin 650," STT routes to the text-search path, the same strict-match + Jan Aushadhi + risk classification fires. We confirmed this in [PROMPTS.md](../PROMPTS.md) §"Failure modes handled." That said: the vision scanner *is* the easier flow for an Illiterate user holding a strip, and when it's down they are pushed to voice search in Hindi — a degraded experience. We accept the degradation; we do not pretend it doesn't exist.

---

## 4. "Your risk classifier defaults unknown molecules to LOW. That is unsafe — a niche cardiac drug not in your map could be shown with a green 'same composition, save money' banner."

**Honest answer:** Half-true. The default is LOW for display, but every unknown molecule is **logged** to a queryable table so the map can be expanded — never silently treated as safe and forgotten. The risk-band UI also defers to the prescription-required flag (Schedule H/H1/X from CDSCO) which independently gates display. A truly cardiac molecule should be Schedule H and would trip the prescription warning even if our internal risk map missed it. Still — this is the weakest link in the chain, and we treat unknown-class entries as a P1 backlog item, not noise.

---

## 5. "The disclaimer banner is theatre. Users dismiss it in the first session and never see it again. It's a legal shield for you, not protection for them."

**Honest answer:** The banner is **sticky** — it does not dismiss across sessions, and a "got it" tap on the modal does not remove it. Per memory `project_legal_disclaimer.md`, this is a permanent design constraint copied from the SEBI banner pattern on Chitti Shares; it is never moved to a footer. Beyond that: the disclaimer is repeated in short form *under every alternative card*, and the HIGH-risk variant fires inline before the alternative even renders. The banner is not the only line of defence — it's the perimeter; the per-card disclaimer is the wall; the risk-band gate is the door. The critique that "users dismiss it" lands on the perimeter only.

---

## 6. "The Apollo Pharmacy seed dataset is your training base. Apollo is a competitor to Jan Aushadhi. How is MedUPI neutral when its reality model comes from one of the parties it's pricing?"

**Honest answer:** The Apollo CSV is a *catalogue* — brand names, salts, strengths, forms, MRPs. We do not use Apollo's prices as a reference for "fair price." The Jan Aushadhi price comes from BPPI, the NPPA ceiling from NPPA, the live pharmacy snippets from Brave Search across 1mg / PharmEasy / NetMeds / Apollo / MedPlus / TrueMeds (Apollo is one of six). The catalogue is wide because Apollo's catalogue is wide; the pricing pipeline is independent of any one source. That said: the day a BPPI-published catalogue is as wide as Apollo's, we switch.

---

## 7. "You promise not to store medicine images, but you send them to a third-party LLM provider (Anthropic today, DeepSeek tomorrow). Their retention policy is not yours. The image leaves the user's phone."

**Honest answer:** Correct. We do not store the image *on our servers*; we cannot speak to the LLM provider's retention beyond their published policy. The user is informed in the disclaimer flow that vision extraction requires a third-party model call. The migration to DeepSeek (see [TODO.md](../TODO.md) §1) is partly motivated by cost; the privacy posture across providers is similar but not identical. The honest position: we minimise what is sent (one image, no metadata, no user ID) and we discard our copy immediately. The provider's copy is governed by their ToS, and the user has the right to skip the vision flow entirely and use voice/text search.

---

## 8. "Your Hindi is good but your regional-language coverage is paper-thin. A Tamil-speaking grandmother in Madurai cannot use this product. Calling it 'for Indian families' is overreach."

**Honest answer:** True today. The voice substrate is being built in Chitti Voice Factory across 26 languages including Sanskrit and Oraon; until that lands in MedUPI's response pipeline, the product is bilingual (EN + HI) with regional scripts trickling in. Bengali, Marathi, Tamil, Telugu, Kannada, Malayalam, Gujarati, Punjabi are on the roadmap and are paired with the Voice Factory cascade. The honest framing: today MedUPI is *for the Hindi belt + English-comfortable India*. Calling it "for all Indian families" is a future-tense promise, and we should be careful in copy not to overstate present coverage.
