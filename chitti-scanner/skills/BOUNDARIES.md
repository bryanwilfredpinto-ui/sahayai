# BOUNDARIES — Chitti Product Scanner

Hard limits. These are not aspirations; they are enforced in code or by deliberate absence of code.

## What Chitti Scanner will NEVER do

### 1. Never persists the image after extraction

- The Flask process holds the bytes for the duration of the request.
- No `open(..., 'wb')`. No S3. No Cloudinary. No local disk cache.
- `MAX_CONTENT_LENGTH = 8 MB` bounds the in-memory blob; Werkzeug rejects anything larger with HTTP 413 before bytes hit the handler.
- See `main.py` config in [../ARCHITECTURE.md](../ARCHITECTURE.md).

### 2. Never sends full Aadhaar / PAN to client logs

- Server `_normalise()` (P1 #5 in [../TODO.md](../TODO.md)) scrubs digit runs matching the Aadhaar / PAN regex **before** `summary` / `facts` are returned.
- Frontend post-processor re-scrubs as defence in depth (P1 #4).
- Request bodies are never logged at INFO level. Errors log status codes only, never payloads.

### 3. Never validates Aadhaar / PAN against UIDAI / NSDL

- No UIDAI integration. No NSDL integration. No Aadhaar API key in any env file.
- This is **deliberate**: a false-positive "verified" stamp on a fake doc is far more dangerous than honest illiteracy. See critique #2 in [DEVILS_ADVOCATE.md](DEVILS_ADVOCATE.md).
- Chitti's role is to **read what is printed**, not to authenticate it. Verification is the user's responsibility, with the issuing authority.

### 4. Never drops the server-enforced legal disclaimer

- After the model returns, `_normalise()` **overwrites** `legal_disclaimer` from `LEGAL_BY_TYPE[type]`. The model has no way to suppress, alter, or shorten it.
- See the `LEGAL_BY_TYPE` table in [../PROMPTS.md](../PROMPTS.md).

### 5. Never fabricates a field

- If composition is unreadable, `facts.composition = "unreadable"`. Never invented. See [GUARDRAILS.md](GUARDRAILS.md).

### 6. Never gives medical / legal / investment advice

- Per-type disclaimer always points elsewhere (doctor, vakeel, nutritionist, helpline).
- The SEBI sticky banner at the bottom of `chitti_scanner.html` is permanent (per workspace memory rule).

### 7. Never holds the camera stream open

- Camera stream killed on `closeCamera()` and `beforeunload`.
- No background frame capture, no silent re-open.

### 8. Never widens CORS to `*` in production

- The Render env hard-pins `ALLOWED_ORIGINS` to two domains. Any PR that broadens this must be rejected.
