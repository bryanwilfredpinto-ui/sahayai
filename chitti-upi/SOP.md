🎖️ **World Class Chitti UPI — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti UPI — Standard Operating Procedure

## Objective
Tell a worried user HIGH / MEDIUM / LOW fraud risk on any UPI message, call, or link they're unsure about — with the RBI rule citation behind the verdict.

## Primary User
First-time UPI user; elderly parent receiving an unsolicited UPI request; anyone who hesitated before tapping *Pay*.

## Success Metric
(a) Fraud-caught rate (verified retrospectively when user reports the outcome) · (b) false-positive rate (legitimate transactions flagged HIGH) · (c) per-response 👍.

## Quality Standard
- 2026 RBI rule cards cited on every verdict
- **Honest scope disclosure** — *"I am a classifier, not a payment intent"*
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)
- `compliance_inject=False` allowed only because the model returns strict JSON — disclaimer rides on the `legal_lines` field outside the JSON

## Operating Rules
1. **Classifier-only.** UPI NEVER initiates payments, NEVER blocks transactions, NEVER files bank complaints, NEVER accesses PINs/balances.
2. **RBI citation every time.** Every verdict carries the relevant 2026 RBI rule card.
3. **Honest scope.** Every response explicitly states "I am a classifier, not a payment intent".
4. **Verdict freshness.** Verdicts older than 30 days do not auto-re-classify; user must re-submit.
5. **Swarm gate.** New scam pattern requires ≥100 confirmations before promotion to `skills/*.md`.
6. **Golden Rule on every action.** Saved-pattern alerts, scam-report submissions — all confirm before fire.

## Error Handling
- DeepSeek 5xx → fallback canned HIGH verdict with explanation "classifier unavailable, treat as suspicious"
- Strict-JSON parse failure → return HIGH precautionary verdict; never silently downgrade
- RBI rule lookup miss → return verdict without citation + honest "rule cite unavailable" flag

## Escalation to CTO
- False-positive rate > 10% on judge eval
- New RBI circular published, scam pattern DB not refreshed within 7 days
- Swarm proposes a HIGH-risk scam pattern with > 100 confirmations
- DEEPSEEK_API_KEY missing on Railway

## Stale Data Rule
RBI rule cards refreshed on every new circular. Scam pattern DB updated weekly from confirmed user reports. Verdicts older than 30 days do not auto-re-classify — user must re-submit.

## Evolution Owner
[chitti-upi/skills/FEATURES.md](skills/FEATURES.md) + RBI 2026 rule cards. Swarm Intelligence learns fraud patterns from confirmed scam reports; new pattern requires ≥100 confirmations before promotion.

---

> **World Class Chitti UPI — Commando Discipline. Zero Excuses.**
