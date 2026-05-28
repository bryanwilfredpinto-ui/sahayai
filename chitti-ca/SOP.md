🎖️ **World Class Chitti CA — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti CA — Standard Operating Procedure

## Objective
CA Final + PhD-grade plain-English help on ITR / GST / TDS / Companies Act / Budget — for individuals and small businesses without a CA on retainer.

## Primary User
Salaried Indian filing their own ITR; small-business owner managing GST.

## Success Metric
(a) Correct-answer rate on filing-deadline + slab questions (judge eval) · (b) user-reported *"I filed successfully"* follow-up rate · (c) per-response 👍.

## Quality Standard
- [skills/CA_KNOWLEDGE.md](skills/CA_KNOWLEDGE.md) held at **CA Final + PhD** grade — IT Act, GST, Companies Act, AS/Ind AS, Budget 2025, portal navigation, tax jurisprudence, treaty interpretation
- **Server-enforced disclaimer on every response** — NEVER client-controlled
- HIGH-risk Swarm gate — human review before any skill update lands
- Quadrails INJECT rail fires unless `compliance_inject=False` is justified for JSON-only output
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)

## Operating Rules
1. **Disclaimer is server-enforced.** Every reply ends with the disclaimer pointing user at a registered CA. NEVER client-controlled.
2. **HIGH-risk Chitti.** No skill update lands without Sire's approval. Swarm proposes; Sire disposes.
3. **No filing on user's behalf.** CA explains, suggests, points at portals — never submits returns or signs documents.
4. **No PII storage.** PAN / Aadhaar / bank numbers never stored. System prompt forbids the model from repeating them.
5. **No binding numbers.** "You owe ₹X" or "you don't need to file" are forbidden — always frame as guidance + check with a CA.
6. **Golden Rule on every action.** Tax-saving reminders, deadline alerts — all confirm before fire.

## Error Handling
- DeepSeek 5xx → fallback to canned response with disclaimer (`source: "fallback"`); never silent fail
- DEEPSEEK_API_KEY unset → honest fallback that still includes disclaimer; four-user contract never breaks
- Quadrails INJECT rail fails → block response with refusal message; never ship unwrapped reply

## Escalation to CTO
- Judge-eval correct-answer rate drops below 90% on filing/slab questions
- Any response detected without server-enforced disclaimer
- Swarm proposes a HIGH-risk patch and confirmation count crosses 100
- Budget 2025 → 2026 refresh window approaches and `CA_KNOWLEDGE.md` not yet updated
- Any PII (PAN/Aadhaar/bank) detected in stored logs

## Stale Data Rule
Annual Budget refresh (Feb each year — slabs / deductions / regime). GST rate changes monthly (Council notifications). ITR form schemas updated per FY before July 31. CBDT / CBIC circulars: weekly diff.

## Evolution Owner
[chitti-ca/skills/CA_KNOWLEDGE.md](skills/CA_KNOWLEDGE.md) + [chitti-ca/skills/FEATURES.md](skills/FEATURES.md). Sire approves every Swarm-proposed change before it lands.

---

> **World Class Chitti CA — Commando Discipline. Zero Excuses.**
