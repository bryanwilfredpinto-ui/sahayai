# TODO

Outstanding work, drawn from:
- [CHITTI_MEDUPI_MASTER_SPEC.md](../CHITTI_MEDUPI_MASTER_SPEC.md) §13 "Pending" and §13 "Open"
- `stub: True` markers in code
- The 2026-05-11 *"DeepSeek for all"* AI-provider switch (see memory `project_ai_provider_switch_to_deepseek.md`)
- The Railway deploy status note (memory `project_render_deploy_status_2026_05_10`)

---

## P0 — Blocking / live verification

### 1. Migrate vision from Anthropic → DeepSeek-VL
**Status:** Open. `services/medupi_recognition.py` still uses the Anthropic SDK.

[`backend/services/medupi_recognition.py`](backend/services/medupi_recognition.py) imports `from anthropic import Anthropic` and posts the image to `client.messages.create(model=settings.ANTHROPIC_MODEL or "claude-sonnet-4-6", ...)`. Per the 2026-05-09 announcement, the project is moving Anthropic → DeepSeek across all surfaces. For MedUPI specifically, the *vision* path is on the critical path because the medicine-strip scanner is the entry point for the four-user contract (Blind + Illiterate users can't type).

Migration checklist:
- [ ] Confirm DeepSeek-VL (or equivalent) supports the same JSON-mode strict output for the [`_VISION_PROMPT`](backend/services/medupi_recognition.py)
- [ ] Swap import: `from anthropic import Anthropic` → DeepSeek client of choice
- [ ] Swap config: `GEMINI_API_KEY` / `ANTHROPIC_MODEL` → `DEEPSEEK_API_KEY` / `DEEPSEEK_VISION_MODEL`
- [ ] Update `_vision_extract()` request shape (base64 + prompt) to DeepSeek's schema
- [ ] Update [`requirements.txt`](backend/requirements.txt) — drop `anthropic==0.39.0`, add DeepSeek SDK
- [ ] Update [`.env.example`](backend/.env.example) and [`render.yaml`](render.yaml)
- [ ] Re-run smoke test on a real Crocin strip + an antibiotic strip + a handwritten prescription
- [ ] Verify EN + HI speak text + medical disclaimer block survive
- [ ] Update [`PROMPTS.md`](PROMPTS.md) once the model and prompt are finalised

**Do not start until Bryan confirms scope** (especially for vision — DeepSeek-VL capabilities and pricing differ from Anthropic vision). Per the memory: *"Do NOT migrate code until Bryan ships credentials and confirms scope (esp. vision for MedUPI)."*

### 2. Top up DeepSeek balance
**Status:** Open. Blocks `POST /api/medupi/ask` (agentic loop) — currently returns structured HTTP 402.
One billing action — no code change required.

### 3. Live verification on production
Per the **"Verify on live before handover"** rule (memory `feedback_verify_before_handover.md`):
- [ ] `curl 'https://chitti-medupi-api-production.up.railway.app/api/medupi/medicine/Crocin%20650'`
- [ ] `curl 'https://chitti-medupi-api-production.up.railway.app/api/medupi/jan_aushadhi?lat=23.26&lng=77.41'`
- [ ] `curl 'https://chitti-medupi-api-production.up.railway.app/api/medupi/insurance/Telmisartan?scheme=ayushman'`
- [ ] Open `https://sahayai.in/chitti_medupi.html` on a phone, verify the sticky medical disclaimer is at top, voice IN works, voice OUT plays, Hindi toggle covers every visible string.

---

## P1 — Pending features (from spec §13)

### 4. Run the loader on real government data
Bryan downloads the four government CSV/XLSX files, then runs:
- [ ] `python scripts/load_real_data.py --source jan_aushadhi --file <path>` → ~11,000 stores
- [ ] `python scripts/load_real_data.py --source bppi_products --file <path>` → ~2,000 medicines · MRP · drug code · therapeutic class
- [ ] `python scripts/load_real_data.py --source nppa --file <path>` → ceiling-price update on existing rows
- [ ] `python scripts/load_real_data.py --source cdsco --file <path>` → schedule H/H1/X + prescription_required
- [ ] `python scripts/load_real_data.py --source kaggle --file <path>` → ~250k branded rows (~5 min batch-committed)
- [ ] `python scripts/load_real_data.py --source rxnorm` → enrichment cache (~7 min)
- [ ] `python scripts/load_real_data.py --source openfda` → enrichment cache (~10 min)

### 5. Browser push reminders
Service worker + Notification API on top of the live `/api/medupi/reminder` CRUD. Models + routes exist already.

### 6. WhatsApp Business + Twilio voice channels
[`services/medupi_reminders.py`](backend/services/medupi_reminders.py) `send_voice_call()` is currently a **stub**:
```python
return {"ok": True, "stub": True, "channel": "twilio_voice"}
```
Wires when `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` env vars are set. Reaches grandparents without smartphones (Chitti Special).

### 7. Prescription decoder
Multi-medicine extraction from a full prescription image. Loop the vision pipeline + return per-line risk / alternatives. Currently the recognition pipeline assumes one strip per image.

### 8. Optimised Cart simulator UI promotion
Backend exists (`/api/medupi/cart-simulator`). Frontend has a drop-list in Phase 7. Promote into a dedicated Compare tab landing if Bryan wants a separate flow.

### 9. Insurance coverage — real data
Replace the seed therapeutic-class proxy in [`data/insurance_coverage_seed.json`](backend/data/insurance_coverage_seed.json) with the official Ayushman empanelled-medicine list when available. Consider adding RxCUI-keyed scheme matching once rxnorm enrichment is folded into the schema.

### 10. Jan Aushadhi stock endpoint — real data
`GET /api/medupi/jan_aushadhi/stock` currently returns a **SKELETON** shape. Wire to BPPI store-level inventory feed when available.

### 11. Family wallet preview — real data
`GET /api/medupi/family/wallet` per-member preview cards (Self / Spouse / Child / Parent) currently use **SKELETON** shape per master spec. Wire to live data once family-profile + medupi_log tables are populated by real users.

---

## P2 — Schema upgrades

### 12. Add `rxcui` column to `medicines`
Write a one-shot migration that folds `data_cache/rxnorm_enrichment.json` into the table. OpenFDA cross-references gain a stable join key.

### 13. Twilio + WhatsApp env config
Add `TWILIO_*` and `WHATSAPP_*` to [`render.yaml`](render.yaml) blueprint + [`.env.example`](backend/.env.example) when notification channels are switched on.

---

## P3 — Out of scope (intentionally NOT building)

Per master spec §13 "Out of Scope":
- Doctor consultations (not a 1mg / Apollo replacement)
- E-pharmacy / cart / checkout / order placement
- Lab tests / diagnostics
- Selling personal health data (privacy-first; never)
- Therapeutic alternatives across molecules (NEVER — see CONTEXT.md §4)

---

## Code-level markers

`grep TODO|FIXME|XXX|HACK` returns **zero results** in [`chitti-medupi/backend/`](backend/). The pending work is tracked via:
1. `stub: True` markers in `services/medupi_reminders.py` (Twilio) and the Phase 7 P1 SKELETON endpoints
2. The "PENDING" list in [CHITTI_MEDUPI_MASTER_SPEC.md](../CHITTI_MEDUPI_MASTER_SPEC.md) §13
3. The four loader_runs-tagged sources that haven't fired yet on the production DB
