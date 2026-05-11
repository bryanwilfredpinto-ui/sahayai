# TODO — Chitti Product Scanner

A grep for `TODO/FIXME/XXX/HACK` across `chitti-scanner/` returns **zero matches**. The list below is sourced from (a) the v1 design comments in `services/scanner_service.py`, (b) the "planned" markers in the skill spec, and (c) the workspace-wide Render deploy status memory dated 2026-05-10.

## P0 — must ship next

### 1. First Render deploy
- `chitti-scanner/render.yaml` has been ready since the skeleton commit (`bc3673b`) but the service has **never been connected to Render**.
- Per the repo memory note `project_render_deploy_status_2026_05_10.md`, Scanner is in the bucket of "8 with render.yaml unconnected".
- Action: provision `chitti-scanner-api.onrender.com`, paste the `DEEPSEEK_API_KEY` secret, verify `/health`, then curl the live `/api/scanner/analyze/text` before declaring the product live (per `feedback_verify_before_handover` rule).

### 2. Frontend production base URL verification
- `chitti_scanner.html` defaults to `https://chitti-scanner-api.onrender.com` in the `API_BASE` constant. Confirm this matches the actual Render URL after deploy; if Render assigns a different slug, either rename the service or update the JS constant.

## P1 — quality / feature

### 3. Wire DeepSeek vision (or replace)
- `analyze_image()` is wired for an OpenAI-compatible vision endpoint but `render.yaml` ships with `DEEPSEEK_VISION_MODEL="off"`.
- Per repo memory note `project_ai_provider_switch_to_deepseek.md`, the team is pending DeepSeek credentials and a scope decision (especially around vision for MedUPI). Once that lands, set `DEEPSEEK_VISION_MODEL=<id>` and verify the multipart path returns `source: "deepseek_vision"`.

### 4. Aadhaar / PAN / KYC redaction in the frontend
- `CONTEXT.md` promises last-4 masking for Aadhaar / PAN / VPA. The HTML does not implement this yet — currently it renders the model's `summary` verbatim. Add a client-side post-processor that masks digit runs matching `\d{4}\s?\d{4}\s?\d{4}` (Aadhaar) and `[A-Z]{5}\d{4}[A-Z]` (PAN) before display.

### 5. Server-side PII scrubbing
- The same masking should also be applied **server-side** in `_normalise()` before `summary` / `facts` are returned, so the protection holds even if the frontend bug-regresses.

### 6. MedUPI hand-off contract test
- The frontend calls `${MEDUPI_API_BASE}/api/medupi/medicine/<query>` and expects `alternatives` or `items`. Add a smoke test that confirms the MedUPI response shape has not drifted (the MedUPI repo is owned separately).

## P2 — polish

### 7. Persist consent language alongside consent flag
- Currently `LANG_KEY` and `CONSENT_KEY` are independent. A returning user gets a localStorage hit on consent but their preferred T&C language is rederived from `chitti_scanner_lang`. Combine for clarity.

### 8. Tamil/Telugu/Bengali/Marathi/Gujarati/Kannada/Malayalam read-aloud quality
- Web SpeechSynthesis voice quality varies by OS. For the languages where the browser has no native voice, queue the text for Bhashini via Chitti Voice Factory (per `project_chitti_voice_factory_spec.md`) instead of falling back to English.

### 9. Camera permission re-prompt UX
- `openCamera()` shows a raw `alert()` on permission denial. Replace with the consent-style modal so blind users hear the explanation.

### 10. Add `/api/scanner/version` endpoint
- For the founder dashboard at `sahayai.in/founder` — return git SHA + DeepSeek model + vision status so deploys can be cross-checked at a glance.

## P3 — future

### 11. Offline scan log export
- Allow the user to email themselves their 20-row local history as a CSV (zero PII; just type + summary + timestamp).

### 12. Per-type prompt fine-tuning
- The single `CHITTI_SCANNER_PROMPT` covers all 7 types. If quality drifts on one (e.g., legal_doc), split into a `_PROMPT_BY_TYPE` dispatch table.

### 13. Rate limiting
- No rate limit today; DeepSeek key is the only cost cap. Add a per-IP token bucket once the service is live.

## Done (since skeleton)
- Nothing; the skeleton is the only commit.

## Notes
- Do not add a database. The privacy posture in [CONTEXT.md](./CONTEXT.md) depends on the service staying stateless.
- Do not move the SEBI sticky banner / legal modal — repo memory rule.
