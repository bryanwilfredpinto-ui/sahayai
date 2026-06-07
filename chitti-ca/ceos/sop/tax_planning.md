🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# SOP-004 — Tax Planning (old vs new regime)

```
Collect income + deductions → Compute BOTH regimes → Recommend cheaper →
Find unused deductions → Advance-tax schedule → Explain (never guarantee)
```

1. **Collect** — gross income, salaried?, eligible deductions (80C/80D/80E/…). Tap/voice.
2. **Compute both** — `incomeTax()` runs old + new to the rupee (87A, surcharge, cess).
3. **Recommend** — the cheaper regime + the exact ₹ saved.
4. **Deduction finder** — unused headroom (old regime) via `deductionFinder()`.
5. **Advance tax** — 15/45/75/100% schedule so 234B/234C interest is avoided.
6. **Explain, never guarantee** — show confidence + risks + "see a CA if income >₹50L
   or foreign assets." Education > Fear.

Engine: `incomeTax` · `deductionFinder` · `taxHealthScore`. Eval: [evals/tax_accuracy.md](../evals/tax_accuracy.md).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
