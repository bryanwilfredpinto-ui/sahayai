# Agent 1 — Role Mapping Agent

> Per COSDF L6 (lines 277-282). The first agent in the swarm pipeline.
> Rules-only. No LLM in the critical path.

---

## Purpose

Map ANY user-typed role to a deterministic domain + keyword set + adjacent-tools list. This is what allows the product to honour the Founder Rule clause *"No Hardcoded Roles — Dynamic for ANY Profession"*.

---

## Input

```json
{
  "role": "Veterinarian",
  "lang": "en"
}
```

The `role` field accepts free text. The `lang` field is optional and used only for normalization (e.g. "हाकीम" → "Doctor" for Urdu users).

---

## Output

```json
{
  "role_normalised": "veterinarian",
  "primary_domain": "healthcare",
  "adjacent_domains": ["agriculture", "biology"],
  "keywords": ["animal", "vet", "veterinary", "livestock", "clinical-decision-support"],
  "tools_filter": ["aidoc-vet", "vetelligent", "abridge"],
  "courses_filter": ["clinical-ai", "animal-imaging-ai"],
  "jobs_filter": ["clinical-ai", "veterinary"],
  "impact_score_template": "healthcare-adjacent",
  "confidence": 0.78,
  "fallback_used": false
}
```

Where:
- `primary_domain` ∈ {healthcare, finance, legal, education, technology, hr, sales-marketing, ops, creative, trades, agriculture, government, hospitality, transport, student, executive, general}
- `confidence ∈ [0, 1]`; below 0.5 the Personalization Agent (downstream) places the result in "Everyone" only.
- `fallback_used = true` when the role wasn't found in the curated map and a heuristic was applied.

---

## Rules (the entire critical path)

The mapping table lives in `backend/services/profession_classifier.py` and `chitti_coach.js` `SKILL_VOCAB` / `GOAL_VOCAB`. Lookup order:

1. **Exact match** — lowercased, normalized for punctuation. `"CA / Chartered Accountant"` → `accountant`.
2. **Multilingual alias** — `"वकील"`, `"hakim"`, `"vakil"` → `lawyer`.
3. **Substring** — `"AI Engineer"` contains `"engineer"` → `software-developer` with adjacent tag `ai-specialist`.
4. **Stem match** — `"Veterinarian"` stems to `"vet"` → `veterinarian` template (Phase 2 dynamic).
5. **Adjacent domain** — `"Pilot"` not directly mapped → `transport` domain; tools filter by `transport` keyword.
6. **Fallback** — `general` domain; confidence forced to 0.3; honest note attached to output: *"I couldn't find specific resources for 'X'. Here are general AI resources for your domain."*

LLM is never called. Even if all rules fail, we emit a `general` mapping rather than ask DeepSeek to "guess" a domain.

---

## Tests

`backend/tests/test_classifier_sire_worked_examples.py` covers:

- Each of the 13 hardcoded hubs gets a deterministic non-empty mapping.
- 10 dynamic roles (Veterinarian, Welder, Pilot, Chef, Pharmacist, Journalist, Designer, Photographer, Electrician, Plumber) each get a non-`general` mapping with confidence ≥ 0.5.
- Multilingual aliases: 5 Hindi + 3 Tamil + 2 Telugu role names map to the right domain.
- Garbage input (`"asdfgh"`, `""`, `"123"`) maps to `general` with confidence 0.3 and `fallback_used = true`.

F1 ≥ 0.85 per profession; software-developer baseline at 0.857.

---

## Downstream contract

The Role Mapping output is passed verbatim to:
- Agent 2 (Certification) — uses `primary_domain` to filter cert catalog.
- Agent 3 (Course) — uses `courses_filter` keywords.
- Agent 4 (Tool) — uses `tools_filter`.
- Agent 5 (Prompt) — uses `role_normalised` to look up the prompt library.
- Agent 8 (Language) — uses `lang` to pick the output translation.

If Agent 1 outputs `confidence < 0.5`, Agent 7 (Trust & Quality) appends a disclaimer to the final response: *"This is a generic AI domain mapping; consider providing a more specific role title for tailored recommendations."*

---

## Failure mode

| Failure | Behavior |
|---|---|
| Role table file missing | Server boots with empty table; `general` mapping for every role; logged as RED in /health. |
| Multilingual alias table missing | English-only path used; logged as YELLOW. |
| Backend rate-limited by upstream classifier (n/a — rules-only, no network) | n/a |

---

Last reviewed: 2026-06-06
