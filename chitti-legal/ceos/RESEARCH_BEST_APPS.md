🎖️ World Class Chitti Legal OS — Commando Discipline. Zero Excuses.

# RESEARCH — Best legal apps in the world, and what Chitti Legal OS copies + ADDS

> Per the [new-products process](../../SAHAYAI_MASTER.md) (§2a): before building, study
> the world's best — **legal-help apps** and **accessibility-first apps** — and extract
> concrete patterns for our four users: 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate
> (plus elderly / rural / low-bandwidth). **Section C is Sire's Step-2 ask: the legal
> best-practices for the common man that the CEOS brief did NOT contain — now added.**
> This drives **[BUILD_ORDER.md](BUILD_ORDER.md)**. Date: 2026-06-07.

## A. Accessibility-first apps (the foundation — these matter MORE than the legal apps)

| App / platform | World-class pattern | What Chitti Legal OS adopts |
|---|---|---|
| **Microsoft Seeing AI / Google Lookout** | Camera → spoken result instantly; the screen is optional | Notice scan → Chitti reads it aloud + decodes (BO11 vision); voice-out is primary |
| **Apple VoiceOver / Android TalkBack** | Landmarks, roles, focus order, "skip to content", `aria-selected` tabs | Skip-link, single `<h1>`, landmark roles, `role=tab`/`tabpanel`, managed focus, visible ring |
| **Be My Eyes** | Zero-literacy entry: one huge action, voice describes everything | Icon-first huge hero ("Chitti, help me"); no required reading; picture menus |
| **WhatsApp (India mass-market)** | Works on 2G, tiny payloads, icon-led, every literacy level | Deterministic engine works offline; emoji+symbol+word status; 2G budget |
| **GOV.UK Design System** | The reference for inclusive gov-facing web: error-as-text, never colour-only | `prefers-reduced-motion`/`contrast`/`forced-colors`; status = symbol **and** word |
| **DigiLocker / UMANG (India gov)** | One identity → many gov services; document wallet | Legal Twin as a document/matter wallet; Free-Legal-Aid as one front-door |

## B. Legal-help apps (the domain — copied selectively, Founder-Rule filtered)

| App | World-class pattern | Adopted? |
|---|---|---|
| **DoNotPay (US)** | "Robot lawyer": guided flows that draft/escalate for common consumer problems | ✅ Guided consumer router + complaint steps — but **explain rights first, never auto-file** |
| **Rocket Lawyer / LegalZoom (US)** | Document templates, plain-language explainers, ask-a-lawyer | ✅ Doc checklist + plain-language decoder — templates as guidance, never a signed filing |
| **Nyaaya (India, Vidhi)** | Free, plain-language explainers of Indian law by everyday situation | ✅ Rights Coach KB structured by everyday situation, in 26 languages + voice |
| **Haqdarshak (India)** | Eligibility → the government benefit/entitlement you are owed, vernacular + assisted | ✅ **Free-Legal-Aid + entitlement engine** — the moat; eligibility → free help |
| **Vakilsearch / LawRato / LegalKart (India)** | Lawyer marketplace, doc drafting, consult booking | ⚠️ Inverted — Chitti surfaces FREE aid first; paid referral only for HIGH-risk |
| **NALSA / e-Daakhil / cybercrime.gov.in / Tele-Law** | The authoritative free channels: legal aid, consumer e-filing, cyber reporting | ✅ Wired as first-class destinations (15100 · e-Daakhil · 1930 · Lok Adalat) |
| **Limitation/deadline calculators (legal-tech)** | Compute the time-bar from a cause-of-action date | ✅ **Deterministic Limitation Engine** — the "money math" of law, exact, offline |

**Founder-Rule filter:** every legal-app pattern that drives *spend* (paid consult
upsell, premium drafting, lead-gen marketplace, ad placement) is inverted. Chitti's hero
is *"here is your right, your deadline, and the free help you are owed."* We copy the
*legal intelligence*, not the *monetisation loop*.

## C. HOW CHITTI CAN BENEFIT USERS — best practices the CEOS brief MISSED (Sire's Step 2)

> The CEOS PDF listed 10 features. Below are the additional, India-specific legal
> best-practices for the common man that the brief did **not** contain — each is now a
> PRD module + a BUILD_ORDER item, and each is wired into the deterministic engine.

1. **Limitation / time-bar engine (the silent killer).** The single biggest reason
   ordinary Indians lose valid cases is *limitation* — they act after the deadline. No
   consumer app surfaces it. Chitti computes the exact time-bar from the Limitation Act
   1963 + special acts. *Benefit: a valid claim is not lost to a missed date.* → Module L2.
2. **Cheque-bounce (s.138) timeline.** Crores of small disputes are cheque bounces with
   a strict 30-day-notice → 15-day-pay → 30-day-complaint cascade that people miss.
   Chitti computes the exact dates. *Benefit: the remedy is preserved.* → Module L2b.
3. **Free Legal Aid you are OWED (NALSA s.12).** Every woman, child, SC/ST, person with
   disability, senior, person in custody, disaster victim, and low-income citizen is
   entitled to a FREE lawyer — and almost nobody knows. Chitti checks eligibility and
   routes to 15100/DLSA. *Benefit: a free lawyer instead of fear.* → Module L8 (the moat).
4. **"Digital arrest" & cyber-fraud golden hour.** India's #1 emerging scam in 2024–25
   is the fake "police on a video call / digital arrest." Chitti hard-codes: *police
   never arrest over a call; call 1930 in the golden hour to freeze the money.*
   *Benefit: lakhs of rupees saved.* → Module L9.
5. **Notice Decoder for the scared user.** A 138/IT/GST/eviction/SARFAESI/summons notice
   is terrifying jargon. Chitti says in plain language what it is, the deadline, the
   worst case, and the next 3 steps. *Benefit: panic → plan.* → Module L3.
6. **Police-interaction rights under the NEW codes (BNS/BNSS/BSA 2023).** Most rights
   content still cites the repealed IPC/CrPC. Chitti uses the 2023 codes (s.35 notice,
   s.47 grounds, s.58 24-hour rule). *Benefit: current, correct rights.* → Module L1.
7. **Consumer jurisdiction router (CPA 2019 + 2021 rules).** People file in the wrong
   forum and lose months. Chitti routes by value (District ≤₹50L · State ≤₹2Cr · National
   >₹2Cr) and points to free e-Daakhil. *Benefit: filed right the first time.* → Module L5.
8. **Contract red-flag checker (read before you sign).** Rural/illiterate users sign
   one-sided rent/job/loan contracts. Chitti scores common red flags and what to
   negotiate. *Benefit: a fairer deal, or a refusal to sign blanks.* → Module L4.
9. **Senior-citizen Maintenance Tribunal (lawyer-optional).** Under the 2007 Act parents
   can claim maintenance via a fast tribunal and even cancel a gift-deed if neglected —
   barely known. *Benefit: dignity + a free remedy.* → Module L1 (senior).
10. **Women's Zero-FIR + free aid + DV reliefs.** A woman can file an FIR at ANY station,
    always gets free legal aid, and has continuing DV reliefs with no time bar. *Benefit:
    immediate protection.* → Module L1 (women) + L8.
11. **RTI as a legal weapon for the common man.** 30-day reply, ₹10 fee, first-appeal in
    30 days — a free tool to force government answers. *Benefit: information = power.* → Module L7.
12. **Lok Adalat & mediation (free, binding, fast).** For settling disputes without
    litigation cost. Chitti routes here before any paid referral. *Benefit: cheap, fast
    closure.* → Module L8 + Constitution Founder Rule.

## D. The synthesis — what "world-class" means for Chitti Legal OS

1. **Accessibility is the architecture, not a layer.** The four users are built first
   (BO1–BO5), not audited last.
2. **Deadlines & jurisdiction are deterministic and provenance-tagged.** Computed by the
   engine from a versioned rule table, never by an LLM; works on 2G with DeepSeek down.
3. **Surface the FREE help owed, not the consult to buy.** Free-Legal-Aid + entitlement
   engines are the moat (Haqdarshak/NALSA ethic, enforced by the Founder Rule).
4. **Prevent and explain**, don't just react (Limitation engine, Scam shield, Contract check).
5. **Prove it** — every increment is test-gated (BUILD_ORDER), axe-core gates
   accessibility, and a gold engine test gates every deterministic number.

→ These conclusions drive **[BUILD_ORDER.md](BUILD_ORDER.md)** (BO1…BOn, each with its test).

## Sources (verified 2026-06)

- Limitation Act 1963 (Schedule); Negotiable Instruments Act 1881 ss.138/142.
- Consumer Protection Act 2019 + Jurisdiction Rules 2021 (District ₹50L / State ₹2Cr / National).
- BNS/BNSS/BSA 2023 (effective 1-Jul-2024) — arrest ss.35/47/48/58; Constitution Arts 20–22, 39A.
- Legal Services Authorities Act 1987 s.12; NALSA helpline 15100.
- I4C cyber helpline 1930 / cybercrime.gov.in; RTI Act 2005; POSH Act 2013; PWDV Act 2005;
  Maintenance & Welfare of Senior Citizens Act 2007; Model Tenancy Act 2021; DPDP Act 2023.

---
> **World Class Chitti Legal OS — Commando Discipline. Zero Excuses.**
