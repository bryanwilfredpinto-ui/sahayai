# Chitti UPI Fraud Guard

> Bharat's first AI fraud-warning second-opinion for UPI / digital payments.
> Paste a payment request, SMS, WhatsApp message, merchant name, or what a
> caller told you. Chitti grades the fraud risk **HIGH** (red) / **MEDIUM**
> (orange) / **LOW** (green) in seconds and **reads the warning aloud**.

Live page: <https://sahayai.in/chitti_upi.html>
Backend (planned): <https://chitti-upi-api.onrender.com>

---

## 1. What this product actually does (verified against code)

The user prompt for these docs described the product as "Pay 200 to Ramesh
→ confirm + open UPI intent." After reading
[`backend/services/upi_service.py`](./backend/services/upi_service.py),
[`backend/routes/upi.py`](./backend/routes/upi.py) and the canonical
frontend at [`../chitti_upi.html`](../chitti_upi.html), the actual shipped
scope is narrower and safer:

| The product **DOES** | The product **DOES NOT** |
|---|---|
| Accept user-pasted (or dictated) text of a suspicious payment / SMS / call | Hold the user's UPI ID, PIN, OTP, bank credentials |
| Call DeepSeek (`deepseek-chat`) with `CHITTI_UPI_FRAUD_PROMPT` | Generate / open a `upi://pay?pa=...` intent |
| Return strict-JSON `{risk, reason, warning, indicators[], actions[]}` | Initiate, sign or block a real payment |
| Read the warning aloud (frontend speech synth via Voice Factory) | Touch any NPCI / bank API |
| Show 4 RBI 2026 educational cards (2FA, 1-hr cooling, Trusted Person, Kill Switch) | Store payment history (fully stateless) |
| Append two legal lines ("1930 / cybercrime.gov.in" + "Chitti is a warning tool only") to every verdict | Replace a bank or police report |

The `chitti_upi.html` consent gate states this verbatim:
> "Chitti UPI Guard is a warning tool. It cannot block a payment."

If a future v2 wants the "Pay 200 to Ramesh → open UPI intent" flow, that
is a brand-new endpoint and a brand-new consent screen — see
[`./TODO.md`](./TODO.md).

---

## 2. Repo layout

```
chitti-upi/
├── README.md                  this file
├── CONTEXT.md                 why it exists + four-user accessibility contract
├── ARCHITECTURE.md            request flow + tech stack
├── CHANGELOG.md               git history
├── TODO.md                    P0/P1/P2 outstanding work
├── API.md                     every HTTP endpoint
├── DATABASE.md                schema (N/A — stateless)
├── PROMPTS.md                 verbatim LLM prompts
├── render.yaml                Render Blueprint (free plan, gunicorn, 2 workers)
├── frontend/
│   ├── README.md              "mirror of root chitti_upi.html"
│   └── index.html             single-page UI, consent gate, verdict bands
├── skills/
│   └── chitti-upi/SKILL.md    sub-agent skill manifest
└── backend/
    ├── main.py                Flask app factory · CORS · error handlers
    ├── config.py              env-driven Settings dataclass
    ├── requirements.txt       flask 3 · flask-cors · gunicorn · httpx
    ├── runtime.txt            python-3.11.10
    ├── routes/
    │   ├── __init__.py
    │   └── upi.py             Blueprint /api/upi/*
    └── services/
        ├── __init__.py
        └── upi_service.py     DeepSeek wrapper + system prompt + RBI cards
```

---

## 3. Quick start

### 3.1 Local dev

```bash
cd chitti-upi/backend
pip install -r requirements.txt
export DEEPSEEK_API_KEY=sk-...
python main.py                 # http://127.0.0.1:8004
```

Then open the frontend pointing at that backend:

```
file://.../chitti_upi.html?api=http://127.0.0.1:8004
```

If `DEEPSEEK_API_KEY` is unset, the service does **not** crash — it returns
a conservative `MEDIUM` "AI offline — defaulting to caution" fallback (see
`_fallback()` in [`backend/services/upi_service.py`](./backend/services/upi_service.py)).
Risk is **never** falsely reassured to `LOW` when the AI is offline.

### 3.2 Production

```yaml
# render.yaml (already committed)
startCommand: gunicorn main:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60
```

`DEEPSEEK_API_KEY` is `sync: false` — must be set in Render dashboard.
Per [memory: Render deploy status 2026-05-10](../CHITTI_TECHNICAL_MASTER_SPEC.md),
this Blueprint is **not yet connected** to Render. See
[`./TODO.md`](./TODO.md) P0.

---

## 4. Endpoint surface

| Method | Path                  | Purpose                                                |
|--------|-----------------------|--------------------------------------------------------|
| GET    | `/`                   | Service banner JSON                                    |
| GET    | `/health`             | Liveness                                               |
| POST   | `/api/upi/check`      | Body `{text, language?}` → risk verdict JSON           |
| GET    | `/api/upi/rules`      | RBI 2026 educational cards (static)                    |
| GET    | `/api/upi/health`     | `{deepseek_configured, model}` diagnostic              |

Full request/response shapes in [`./API.md`](./API.md).

---

## 5. Cross-product hooks

- **UPI Guard → Vaani:** when the verdict is `HIGH`, the frontend surfaces
  a "Talk to Chitti Vaani for SOS" deep-link. Vaani then runs the
  family-cascade emergency protocol (see project memory).
- **Scanner → UPI Guard:** when Chitti Scanner sees an
  insurance / payment document, it can deep-link here for a premium-safety
  check.

---

## 6. Stack

- Python 3.11.10
- Flask 3.0.3 + flask-cors 4.0.1
- gunicorn 22.0.0
- httpx 0.27.2 (DeepSeek call)
- DeepSeek `deepseek-chat` in JSON-mode (`response_format: json_object`)
- No DB, no Redis, no queue — fully stateless

---

## 7. Legal posture

Every verdict response carries `legal_lines: string[]` with two items
hard-coded in [`backend/services/upi_service.py`](./backend/services/upi_service.py):

```
"Fraud hone par turant 1930 pe call karo ya cybercrime.gov.in pe report karo."
"Chitti ek AI warning tool hai — yeh payment block nahi kar sakta."
```

The frontend is required to render both and speak both after the warning.
The SEBI sticky banner is global (not on this page — UPI is not securities)
but the "not a bank / not NPCI / not police" disclaimer is permanent.

---

## 8. Cross-reference docs

- [`./CONTEXT.md`](./CONTEXT.md) — why this exists + four-user accessibility contract
- [`./ARCHITECTURE.md`](./ARCHITECTURE.md) — request flow, fallback, voice-IO
- [`./CHANGELOG.md`](./CHANGELOG.md) — git history
- [`./TODO.md`](./TODO.md) — P0 deploy + voice-biometric v2 research
- [`./API.md`](./API.md) — verbatim endpoints
- [`./DATABASE.md`](./DATABASE.md) — N/A (stateless)
- [`./PROMPTS.md`](./PROMPTS.md) — `CHITTI_UPI_FRAUD_PROMPT` verbatim
