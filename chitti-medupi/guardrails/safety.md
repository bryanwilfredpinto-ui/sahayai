CEOS Level 8 — Guardrails: Safety

Authored 2026-06-06

> The single point on which Chitti MedUPI's legal and ethical posture hangs.
> MedUPI is a **price + composition intelligence** tool — never a doctor, never a
> pharmacist, never a prescription engine. This file is the merge-blocker contract
> for everything that could cause physical harm.

Companion docs: [skills/GUARDRAILS.md](../skills/GUARDRAILS.md) (never-hallucinate field sources) · [skills/BOUNDARIES.md](../skills/BOUNDARIES.md) · [CONTEXT.md §4–§5](../CONTEXT.md) · [CHITTI_SOP.md §2](../../CHITTI_SOP.md) · SAHAYAI_MASTER §2 (Golden Rule, DeepSeek-only) + §2b (camera) + §7 (four-user).

---

## 1. The four absolute NEVERs

MedUPI **never** crosses from price comparison into medicine practice. These are not policy toggles — they are hard product invariants. If any appears in a production response, that is a **P0 incident**.

| NEVER | Why it is catastrophic | Where it is enforced |
|---|---|---|
| **Diagnose** | "You have a thyroid problem" is a medical act MedUPI is not licensed for | No diagnostic intent path exists; vision returns composition fields only, not conditions |
| **Prescribe** | Suggesting *which* medicine to take crosses into CDSCO-regulated practice | Alternatives are surfaced only for a medicine the user *already named/scanned* |
| **Change a dose** | "Telmisartan 40 → 80" or "take twice instead of once" can crash a patient | Strict-match forbids strength change (§2); no dose field is ever emitted |
| **Switch the molecule** | "Aspirin → Paracetamol" in a cardiac patient is lethal | `search_by_composition()` keys on `(salt, strength, form)` — zero cross-molecule leakage |

If Chitti ever recommends a switch, suggests a dosage, or offers a *therapeutic* alternative across molecules — **that is a bug, file an issue.** ([CONTEXT.md §2](../CONTEXT.md))

---

## 2. Strict same-composition matching (the spine)

```
Show alternatives ONLY when:
    same molecule  AND  same strength  AND  same dosage form
NO therapeutic alternatives · NO different molecules · NO different strengths
· NO different dosage forms.  EVER.
```

- Enforced at the DB layer: `services/medupi_database.py → search_by_composition()` against the composite index `ix_medicines_strict_match` on `(salt_composition, strength, dosage_form)`.
- Enforced at the service layer: `services/medupi_alternatives.py → find()` passes the primary row's three keys verbatim — it never relaxes, fuzzes, or "rounds" them.
- **Verified:** the real harness `tools/test_medupi_samples.py` asserts `zero_cross_molecule_leakage` as a per-sample HARD check. Current measured baseline (`tools/test_medupi_samples_result.json`): **25/25 samples pass, leaks=0** across branded queries + prescriptions. See [evals/router_accuracy.md](../evals/router_accuracy.md).

Composition is **matched against the master DB, never inferred from the brand name**. There is no "Crocin → paracetamol" string logic in code; the lookup is by stored row. ([skills/GUARDRAILS.md §5](../skills/GUARDRAILS.md))

---

## 3. NPPA ceiling — a hard cap, not a hint

The NPPA-notified ceiling price (DPCO 2013 schedule) is enforced as an **upper bound**, never as advisory text.

- Stored in `medupi.medicines.nppa_ceiling_price`, sourced from NPPA notifications ([skills/TRUTH_SOURCES.md §4](../skills/TRUTH_SOURCES.md)).
- Any alternative whose price exceeds the molecule's NPPA ceiling is a data defect, not a valid suggestion.
- **Verified:** `nppa_ceiling_respected` is a per-sample HARD check in the harness — `over_ceiling=0` on all 25/25 samples.
- Never **computed** from MRP and never **extrapolated** across molecules. When no ceiling row exists, the line is omitted — never rendered as "approximately ₹X."

---

## 4. Risk-tier molecules — doctor sign-off gate

Even *within* a strict same-composition set, some categories demand a stop-and-think gate. `services/medupi_risk.py` tags every molecule H / M / L (top ~90 molecules cover ~90% of Indian retail; unknown defaults to **L but is logged** so the map expands — never silently treated as safe).

| Class | Examples (from `RISK_MAP`) | UI treatment | Spoken/printed rule |
|---|---|---|---|
| **H — HIGH** | insulin, glargine, metformin, telmisartan, amlodipine, warfarin, clopidogrel, atorvastatin, amoxicillin+clavulanic acid, azithromycin, levothyroxine, fluoxetine, alprazolam, olanzapine, carbamazepine, salbutamol, tamoxifen, imatinib | Red banner · symbol ⛔ · `label_*` HIGH RISK | *"Do NOT change without your doctor. Chitti shows alternatives for information only."* (EN + HI) |
| **M — MEDIUM** | diclofenac, ibuprofen, tramadol, omeprazole, pantoprazole, ondansetron, montelukast | Amber banner · ⚠️ | *"Confirm with your doctor or pharmacist."* |
| **L — LOW** | paracetamol, cetirizine, fexofenadine, vitamin D3, calcium carbonate, ORS, iron+folic acid | Green banner · ✅ | *"Same composition — typically safe to substitute. Confirm if unsure."* |

Cardiac, diabetes/insulin, psychiatric, antibiotics, thyroid, anticoagulants, anti-cancer all sit in **H** and carry the explicit "always ask your doctor before switching" warning in both EN and HI (`WARNING_TEXT_EN` / `WARNING_TEXT_HI`). The risk banner **auto-speaks** for blind users (see [accessibility/blind_user.md](../accessibility/blind_user.md)).

**Roadmap (labelled target, not built):** per-molecule "doctor sign-off" capture (store that the user confirmed with their physician before logging a switch in the family wallet) is a P1 — today the warning is surfaced and the action is left to the user.

---

## 5. Emergency = family cascade, never cops

MedUPI inherits the platform emergency protocol ([SAHAYAI_MASTER §2 / Vaani emergency protocol](../../SAHAYAI_MASTER.md)). If a MedUPI flow ever surfaces a medical emergency signal (e.g. a user types a clear overdose/adverse-reaction phrase), the response routes to Vaani's **family cascade** — confirm-with-user → ring/alert family tier — and surfaces verified helplines as text.

- MedUPI **never auto-dials** 112 / 100 / 102 / any ambulance line. (Per the locked emergency decision.)
- MedUPI is not a poison-control or adverse-event reporting system; it directs the user to a doctor/pharmacist and to family, honestly.

---

## 6. Golden Rule — confirm before every action

Per [CHITTI_SOP.md Golden Rule](../../CHITTI_SOP.md) and SAHAYAI_MASTER §2g, every **side-effecting** MedUPI action gates on `chittiConfirmAndDo()`:

| Side-effecting action | Confirm-before-do |
|---|---|
| Log a purchase / switch into the family wallet | Yes — "Sire, shall I add this to {member}'s wallet?" |
| Create / dismiss a refill or expiry reminder | Yes |
| Set a price alert | Yes |
| Send a reminder via WhatsApp / Twilio voice (roadmap) | Yes — per-fire, never "approve once, run forever" |

Read-only price/composition lookups are not side-effecting and don't gate. **MedUPI is HIGH-risk:** there is no "approve once, run forever" for any action that creates a medical/financial obligation — every individual action confirms. Confirmation is **mute-safe** (tap OR voice) and **never times out into Yes**; silence = wait, forever.

---

## 7. Disclaimer firewall (always-on)

The Gold Standard disclaimer ([CHITTI_MEDUPI_MASTER_SPEC §8](../../CHITTI_MEDUPI_MASTER_SPEC.md)) renders as a sticky amber banner + modal + per-card caption, in HI when `_chittiLang === 'hi'`. **A missing disclaimer banner is a P0 — the product is unshippable without it** ([skills/OBSERVABILITY.md §5](../skills/OBSERVABILITY.md)). For vision JSON responses, the disclaimer rides on the `speak_*` fields *outside* the JSON envelope (the Compliance rail runs with `compliance_inject=False` so it records the decision without corrupting the JSON — `medupi_recognition.py:185–193`).

---

## 8. Done-definition for this guardrail

A change touching alternatives, risk, vision, or wallet is **not done** until:

1. `tools/test_medupi_samples.py` passes 25/25 with `leaks=0` and `over_ceiling=0`.
2. No diagnose / prescribe / dose-change / molecule-switch path was introduced.
3. HIGH-risk molecules still carry the ⛔ banner + doctor warning (EN + HI).
4. Any new side-effecting action routes through `chittiConfirmAndDo()`.
5. The disclaimer banner is present on the page.
