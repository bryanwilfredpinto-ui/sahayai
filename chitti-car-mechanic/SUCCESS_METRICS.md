# SUCCESS_METRICS — Chitti Car Mechanic

| Metric | Target | How measured | Status |
|---|---|---|---|
| Safety accuracy (critical) | **100% · critical errors = 0** | gold test + field audit | ✅ engine-side (DIY override, can-drive); ⛔ field |
| Diagnostic accuracy | ≥90% | labelled symptom/OBD eval | ⛔ AUTOMATION-LIMITED (needs field data) |
| Scam detection (overcharge flag) | ≥80% | quote vs FAIR table | ✅ deterministic |
| DIY success rate | ≥70% | user completion follow-up | ⛔ field |
| Insurance saving per user | ₹2,000–8,000 | indicative compare → confirmed switch | ✅ indicative; ⛔ realised |
| PUC fine avoided | ₹1,000–2,000 | reminder → renewed before expiry | ✅ engine |
| Annual ₹ saved per user | ≥₹10,000 | Savings Tracker (logged, realised only) | ✅ tracker; ⛔ aggregate |
| Accessibility profiles / languages | 9/9 · 26/26 | cert | ✅ |
| 30-day retention | >60% | analytics | ⛔ post-launch |

**Honesty rule:** no accuracy/saving number is *claimed* before it is *measured*. Engine-side
correctness is proven (79/79); field/behavioural metrics need real users and are marked AUTOMATION-LIMITED.
