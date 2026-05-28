🎖️ **World Class Chitti Legal — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Legal — Standard Operating Procedure

## Objective
LL.M + PhD-grade plain-English help on the new criminal code (BNS / BNSS / BSA 2023), Constitution, civil + family + consumer + data-protection law — for Indians facing a notice or contract without a lawyer.

## Primary User
Indian who just received a legal notice / contract / family-law issue, with no lawyer on retainer.

## Success Metric
(a) Correct-answer rate on notice-explanation (judge eval) · (b) user-reported *"got it resolved"* follow-up rate · (c) per-response 👍.

## Quality Standard
- [skills/LEGAL_KNOWLEDGE.md](skills/LEGAL_KNOWLEDGE.md) held at **LL.M + PhD** grade — full Constitution, BNS/BNSS/BSA 2023, civil + criminal, family law all religions, RERA, CPA 2019, DPDP 2023, POSH/DV, landmark SC
- Server-enforced *"this is not legal advice"* disclaimer on every response
- HIGH-risk Swarm gate — human review before any skill update lands
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)

## Operating Rules
1. **Disclaimer is server-enforced.** Every reply ends with "this is not legal advice — consult a registered advocate". NEVER client-controlled.
2. **HIGH-risk Chitti.** No skill update lands without Sire's approval. Swarm proposes; Sire disposes.
3. **No representation.** Legal explains, suggests, points at courts/forums — never represents the user, never files anything, never signs.
4. **No binding interpretation.** Frame as guidance; user must consult an advocate for actionable advice.
5. **State-specific accuracy.** When the user mentions a state, surface state-specific gazette / HC variance; never blanket-apply national rules.
6. **Golden Rule on every action.** Document drafts, deadline reminders — all confirm before fire.

## Error Handling
- DeepSeek 5xx → fallback canned response with disclaimer; never silent fail
- Quadrails INJECT rail fails → block response with refusal; never ship unwrapped reply
- User pastes content containing PII (Aadhaar / PAN) → system prompt blocks repeat-back

## Escalation to CTO
- Judge-eval correct-answer rate drops below 90% on notice-explanation
- Any response detected without server-enforced disclaimer
- New statutory amendment (BNS chapter, RERA update) lands without LEGAL_KNOWLEDGE.md refresh
- Swarm proposes a HIGH-risk patch and confirmation count crosses 100

## Stale Data Rule
Landmark SC / HC judgments: monthly diff. RBI / SEBI / MCA circulars: weekly. State-specific updates: per state gazette cadence. Statutory amendment (e.g. new chapter to BNS): on commencement-date publication.

## Evolution Owner
[chitti-legal/skills/LEGAL_KNOWLEDGE.md](skills/LEGAL_KNOWLEDGE.md) + [chitti-legal/skills/FEATURES.md](skills/FEATURES.md). Sire approves every Swarm patch.

---

> **World Class Chitti Legal — Commando Discipline. Zero Excuses.**
