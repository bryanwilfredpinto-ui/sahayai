🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# SOP-001 — GST Health Check

```
Collect GST data → Verify returns → Check ITC → Detect mismatch →
Calculate risk → Recommend actions
```

1. **Collect** — GSTIN (validate checksum), turnover, supplies (taxable/exempt),
   purchases, ITC claimed. Tap or voice; never required to type.
2. **Verify returns** — which of GSTR-1 / 3B / 2B are filed; flag gaps.
3. **Check ITC** — eligible vs blocked (Sec 17(5)); 2B-vs-claimed mismatch.
4. **Detect mismatch** — output specific lines, not a vague warning.
5. **Calculate risk** — deterministic GST Health Score 0–100 + risk band.
6. **Recommend actions** — top-3 fixes, each with the rule source + "see a CA if".
   Confidence + risks shown. No guarantee of "no notice".

Engine: `gstHealth()` + `itcAnalysis()`. Eval: [evals/gst_accuracy.md](../evals/gst_accuracy.md).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
