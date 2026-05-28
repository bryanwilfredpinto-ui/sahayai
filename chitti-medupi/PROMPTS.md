# Prompts

Inventory of every AI-facing prompt baked into the MedUPI backend. Currently there is **one** — the vision-extraction prompt that drives the medicine-strip scanner.

---

## 1. `_VISION_PROMPT` — medicine-strip extraction

**Location:** [`backend/services/medupi_recognition.py`](backend/services/medupi_recognition.py) (module-level constant, line ~93)

**Current model:** `claude-sonnet-4-6` (configurable via `ANTHROPIC_MODEL` env var, default in [`config.py`](backend/config.py))

**SDK:** `anthropic==0.39.0` Python SDK · `client.messages.create()` with `type=image` content block

**Max tokens:** 600

**Purpose:** Photo of an Indian medicine strip / bottle / label / handwritten prescription → strict JSON object with the fields needed for the STRICT same-composition matcher.

**Migration note (2026-05-11):** Per the *"DeepSeek for all"* decision, this prompt will be re-routed to **DeepSeek-VL** once Bryan ships the credentials and confirms vision scope. The prompt text itself is provider-neutral and should survive the swap; only the SDK call shape changes. See [TODO.md](TODO.md) §1.

---

### Verbatim prompt (from [`services/medupi_recognition.py`](backend/services/medupi_recognition.py) lines 93–108)

```text
You are extracting medicine details from a photograph of an Indian medicine strip, bottle, label, or prescription. Return ONLY a JSON object with the fields below — no prose, no markdown fences. If a field is unreadable, set it to null. Do NOT hallucinate values.

{
  "brand_name": "string|null",
  "salt_composition": "string|null  (lower-case salt, joined with + for combinations)",
  "strength": "string|null  (e.g. 650mg, 100mcg, 500+125mg)",
  "dosage_form": "Tablet|Capsule|Syrup|Injection|Inhaler|Cream|Drops|Sachet|null",
  "pack_size": "string|null",
  "manufacturer": "string|null",
  "expiry_date": "string|null  (MM/YYYY if visible)",
  "confidence": "high|medium|low"
}
```

---

### Design notes

| Principle | Why |
|---|---|
| **JSON-only output, no prose** | Downstream code is `json.loads()` — any preamble breaks the parse. `_strip_json_fences()` defensively removes ` ```json ` wrappers that some models still emit. |
| **"Do NOT hallucinate values"** | A guessed `salt_composition` is worse than `null` — the STRICT matcher's whole reliability rests on this. If the model can't read the salt, the user types it instead (fall-through path). |
| **Lower-case salt, joined with `+`** | Matches the canonical form in `RISK_MAP` (e.g. `"amoxicillin+clavulanic acid"`) so the risk classifier hits on first lookup. |
| **`dosage_form` is enumerated** | Free-text would break the STRICT match query (`Medicine.dosage_form.ilike(form)`). The 8 values cover ~98% of Indian retail. |
| **`expiry_date` as `MM/YYYY`** | Indian medicine packs print expiry in this format. The expiry-alert feature parses this string. |
| **`confidence` field** | Frontend surfaces low-confidence reads with an amber warning + a "Type the name instead" CTA. Driven by the model's self-assessment, not a heuristic on our side. |

---

### Failure modes handled in the wrapper

The wrapper around the prompt in `_vision_extract()` returns a structured error in three cases:

| Failure | Returned dict | Caller behaviour |
|---|---|---|
| `GEMINI_API_KEY` unset | `{"_error": "GEMINI_API_KEY not set on server"}` | Frontend renders *"Image recognition unavailable — please type the medicine name instead."* in EN + HI |
| SDK not installed | `{"_error": "anthropic SDK not installed"}` | Same as above |
| Model returned non-JSON | `{"_error": "model did not return valid JSON", "_raw": "<text>"}` | Same as above; raw kept for debugging |

The fall-through path keeps Blind / Illiterate users functional: voice search ("Crocin 650" → STT → text path) still works without vision.

---

### Post-processing

Output is consumed by [`recognise_image()`](backend/services/medupi_recognition.py) which:

1. Strips fences via `_strip_json_fences()`
2. `json.loads()` the cleaned text
3. Looks the result up in `medicines` table via:
   - First: `medupi_database.search_by_brand(brand)` (more accurate when brand is clearly visible)
   - Then: `medupi_database.search_by_composition(salt, strength, form)` (fallback when brand unreadable)
4. Wraps in the same response shape as the text path so the frontend renderer doesn't branch

---

### Why Anthropic vision was chosen (and why we are leaving)

**Original rationale** (commit `13c3b99`):
- No OS-binary install pain on Railway free tier (vs Tesseract requiring `libtesseract-dev` + language packs)
- Handles strip / bottle / blister / handwritten prescription uniformly — a single API for four input shapes
- Returns strict JSON, no post-OCR LLM extraction step
- Falls back gracefully when key is missing

**Reason for migration** (2026-05-11 "DeepSeek for all"):
- Project-wide consolidation onto DeepSeek to simplify billing + reduce per-call cost
- DeepSeek-VL has matured to the point where strict-JSON output is reliable
- Bryan's directive: do not migrate until credentials + scope confirmed

---

## 2. Future prompts (not yet in the repo)

These are referenced in the master spec but the routes are in a separate agent file (or pending wiring):

| Prompt | Where | Status |
|---|---|---|
| Agentic `/ask` system prompt with STRICT same-composition rule + tool-calling (`search_medicine`, `find_alternatives`, `classify_risk`, `find_jan_aushadhi_stores`, `simulate_cart`) | Master spec §13 Phase 7 P1 | Shipped on DeepSeek tool-calling — currently HTTP 402 (top-up pending). Not yet in [`routes/medupi.py`](backend/routes/medupi.py). |
| Prescription decoder — multi-medicine extraction from a full prescription image | Master spec §13 pending #7 | Not built — loops the vision prompt above per detected medicine line |
| "Why is this cheaper?" educational note | Master spec §9 Advanced Intelligence | Not built — short LLM call seeded from `purpose_en` + freshness badges |

When these ship, document each verbatim here following the same template as §1.
