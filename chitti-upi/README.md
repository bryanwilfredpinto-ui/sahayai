# Chitti UPI Fraud Guard

**AI second-opinion before you pay.** Paste a payment request, SMS, WhatsApp text, or what a caller told you. Chitti grades the fraud risk **HIGH** (red) / **MEDIUM** (orange) / **LOW** (green) in a few seconds and reads the warning aloud.

## Run locally

```bash
cd backend
pip install -r requirements.txt
DEEPSEEK_API_KEY=sk-… python main.py     # → http://127.0.0.1:8004
```

Then open `../frontend/index.html?api=http://127.0.0.1:8004`.

## Deploy

`render.yaml` is a Render Blueprint. Push, "New → Blueprint", set `DEEPSEEK_API_KEY` in dashboard.

## Endpoints

- `POST /api/upi/check` — `{text, language?}` → `{ok, risk, reason, warning, indicators[], actions[], legal_lines[]}`
- `GET  /api/upi/rules` — Static RBI 2026 educational cards
- `GET  /api/upi/health`

## What this product is NOT

Chitti UPI Guard is a warning tool. It cannot block a payment. It does not have your UPI ID, PIN, OTP, or bank credentials, and never will. Final decision is always the user's.
