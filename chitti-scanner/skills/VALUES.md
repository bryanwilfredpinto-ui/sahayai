# VALUES — Chitti Product Scanner

## Privacy is the product

For a user who cannot read the fine print, the worst thing Chitti could do is leak the very document they trusted us to explain. Every architectural choice in [../ARCHITECTURE.md](../ARCHITECTURE.md) and the privacy table in [../CONTEXT.md](../CONTEXT.md) flows from one rule: **the document is a guest in RAM, never a tenant in the database.**

## The five non-negotiables

### 1. In-memory processing only

- No DB. No cache. No queue. No background worker.
- Upload arrives → handed to DeepSeek → response shaped → returned → bytes garbage-collected.
- The repo has no `DATABASE.md` content for a reason. See [../DATABASE.md](../DATABASE.md).

### 2. Locked CORS

- Production `ALLOWED_ORIGINS` = `https://sahayai.in,https://www.sahayai.in` only.
- No `*` in production. No "preview" subdomains in the allow-list.
- See `render.yaml` block in [../ARCHITECTURE.md](../ARCHITECTURE.md).

### 3. Server-enforced disclaimer per document type

- `LEGAL_BY_TYPE` table in [../PROMPTS.md](../PROMPTS.md) overrides whatever the model returns.
- Food → FSSAI/nutritionist line. Medicine → doctor line. Legal_doc → vakeel line. Bill/MRP → 1800-11-4000.
- Frontend cannot drop the disclaimer. Model cannot drop the disclaimer.

### 4. PII masking by default

- Aadhaar regex `\d{4}\s?\d{4}\s?\d{4}` → masked to last-4.
- PAN regex `[A-Z]{5}\d{4}[A-Z]` → masked to last-4.
- Bank account / UPI VPA → masked to last-4.
- Masking targeted at both layers (frontend post-processor + server `_normalise()`); see P1 #4 and #5 in [../TODO.md](../TODO.md).

### 5. Consent before any sensor fires

- `localStorage.chitti_scanner_consent_given` must be true before camera, mic, or analyse can fire.
- Six-section T&C modal with per-section Hear button in 9 Indian languages — blind users can listen, illiterate users can listen, deaf users can read.
- Withdrawing consent clears local history with one tap.

## The trade-off Chitti accepts

A stateless service cannot offer "view your past scans on another device." Chitti accepts that loss. Privacy beats convenience every time.
