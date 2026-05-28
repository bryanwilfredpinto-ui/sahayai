---
name: chitti-upi
description: Chitti UPI Fraud Guard — Indian-family-friendly fraud-risk classifier for UPI / digital payments. User pastes a payment request, SMS, WhatsApp message, merchant name, or what a caller told them; Chitti returns HIGH (red) / MEDIUM (orange) / LOW (green) risk plus a one-line spoken warning and the next safe step. Educational RBI 2026 rule cards (2FA · 1-hour cooling lag · Trusted Person · Kill Switch). Always appends "Fraud hone par turant 1930 pe call karo ya cybercrime.gov.in pe report karo." and "Chitti ek AI warning tool hai — yeh payment block nahi kar sakta." Use on chitti_upi.html or for any UPI fraud / scam SMS / suspicious caller question.
---

# Chitti UPI Fraud Guard — top-level skill

This skill describes the **Chitti UPI Fraud Guard product** as a whole.
It loads when the user asks about UPI fraud, suspicious payment
requests, KYC / lottery / refund / electricity-disconnection scams, or
the RBI 2026 framework (2FA · cooling lag · Trusted Person · Kill
Switch).

## Repo layout

```
chitti-upi/
├── frontend/index.html         mirror of workspace-root chitti_upi.html
└── backend/
    ├── main.py                 Flask app · CORS · /api/upi/* registration
    ├── config.py               settings (DEEPSEEK_API_KEY · model · CORS · token caps)
    ├── requirements.txt        flask · flask-cors · gunicorn · httpx
    ├── runtime.txt             Python 3.11
    ├── render.yaml             Railway Blueprint
    ├── services/
    │   └── upi_service.py      DeepSeek wrapper + CHITTI_UPI_FRAUD_PROMPT + JSON-mode parsing + RBI 2026 cards
    └── routes/
        └── upi.py              Blueprint /api/upi/*
```

## Endpoint surface (Flask Blueprint, prefix `/api/upi`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/check`  | Body `{text, language?}` → `{risk, reason, warning, indicators[], actions[], legal_lines[]}` |
| GET  | `/rules`  | Static RBI 2026 educational cards (icon · title · body · speak text) |
| GET  | `/health` | DeepSeek key configured? |

`risk` is always one of `HIGH` (red), `MEDIUM` (orange), `LOW` (green).
The frontend MUST render the colour band and read `warning` aloud.
`legal_lines` is always two strings — the frontend appends both to
the visible warning AND speaks them after the warning.

## Consent gating

`localStorage.chitti_upi_consent_given` gates every feature. The T&C
modal has 6 sections (mirrors Vaani structure) with 🔊 buttons:

  1. What Chitti UPI Guard is (and is not — it does NOT block payments)
  2. Legal Compliance (RBI Master Directions on Digital Payments · DPDP Act 2023)
  3. Permissions Required (none — everything is text-pasted by the user)
  4. Data Privacy (no payment data, no UPI handle stored)
  5. Emergency and Liability (cyber-fraud → 1930 / cybercrime.gov.in)
  6. Grievance Redressal (sire@sahayai.in)

## Cross-product hooks

- **UPI Guard → Vaani**: when a HIGH verdict is shown, the page
  surfaces a "🚨 Talk to Chitti Vaani for SOS" deep-link.
- **Scanner → UPI Guard**: when Scanner detects an insurance /
  payment-related document, it can deep-link here for a premium-safety
  check.

## Live URLs

- Frontend: https://sahayai.in/chitti_upi.html
- Backend:  https://chitti-upi-api.onrender.com (planned — `render.yaml` ready)
