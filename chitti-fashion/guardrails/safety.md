🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# GUARDRAIL — Safety (index)

Chitti Fashion is low-physical-risk (styling, not medicine/finance), but safety still governs every output.

## Hard rules (never)
- **Never comment on the body** — size, shape, weight, height, skin tone. Only the garment (cut/colour/fit/fabric/drape). Enforced: [body_shaming.md](body_shaming.md).
- **Never shame** by age, gender, ability, region, religion, or budget. See [age_bias.md](age_bias.md) · [gender_bias.md](gender_bias.md) · [disability_rules.md](disability_rules.md) · [cultural_sensitivity.md](cultural_sensitivity.md).
- **Never require a purchase** — Founder Rule: dress from what you own; shopping is the last option ([../CONSTITUTION.md](../CONSTITUTION.md)).
- **Child/senior safety** — the engine's `judge()` flags unsafe items (heels/sharp/choking for children; non-slip/easy-fasten for seniors).

## Always
- Every recommendation explains **why** (teach, not dictate).
- Every result is announced (blind), captioned+symbol (deaf), tappable (mute), icon+voice (illiterate).
- Accessibility is a **floor**: the swarm holds any verdict whose Accessibility agent scores < 6.

## Enforcement
Deterministic `judge()` axes (cultural/weather/age/accessibility) + the 9-agent swarm + the eval suite
([../evals/safety_eval.md](../evals/safety_eval.md)). No body-comment slip is ever learnable (locked).
