---
name: chitti-scanner
description: Chitti Product Scanner — capture-or-type analyser for Indian families. User uploads a photo (or types out the label, when camera fails) of a product label, medicine strip, bill, or document; Chitti returns product type (food / medicine / legal_doc / bill / mrp / insurance / other), key findings, warnings, and savings suggestions. Cross-links to Chitti MedUPI for Jan-Aushadhi alternatives, to Chitti UPI Fraud Guard for insurance-premium safety checks, and to Chitti Vaani for read-aloud results. Type-specific legal disclaimer appended to every response. Use on chitti_scanner.html or for any "is this expired", "is this MRP correct", "what does this medicine label say", or "explain this bill / contract" question.
---

# Chitti Product Scanner — top-level skill

This skill describes the **Chitti Product Scanner product** as a
whole. It loads when the user asks about scanning a label, reading a
medicine strip, decoding a bill, summarising a contract / policy, or
checking food labels for FSSAI info.

## Repo layout

```
chitti-scanner/
├── frontend/index.html         mirror of workspace-root chitti_scanner.html
└── backend/
    ├── main.py                 Flask app · CORS · /api/scanner/* registration
    ├── config.py               settings (DEEPSEEK_API_KEY · vision model · CORS · MEDUPI_API_BASE)
    ├── requirements.txt        flask · flask-cors · gunicorn · httpx
    ├── runtime.txt             Python 3.11
    ├── render.yaml             Railway Blueprint
    ├── services/
    │   └── scanner_service.py  DeepSeek wrapper + CHITTI_SCANNER_PROMPT + per-type legal lines + cross-product links
    └── routes/
        └── scanner.py          Blueprint /api/scanner/*
```

## Endpoint surface (Flask Blueprint, prefix `/api/scanner`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/analyze` | Either `multipart` image (field `image`, `language` form field) OR JSON `{text, language?}` |
| POST | `/analyze/text` | JSON-only path — `{text, language?}` |
| GET  | `/health` | DeepSeek + vision-model status |

Response shape:

```json
{
  "ok": true,
  "type": "food | medicine | legal_doc | bill | mrp | insurance | other",
  "summary": "...",
  "facts":   { "brand": "...", "expiry": "..." },
  "key_findings": ["...", "..."],
  "warnings":     ["..."],
  "savings":      ["..."],
  "speak_hi": "<read-aloud line>",
  "speak_en": "<read-aloud line>",
  "legal_disclaimer": "<type-specific Hinglish line>",
  "cross_links": [{ "product": "medupi" | "upi_guard" | "vaani" | "consumer_helpline", ... }]
}
```

## Legal disclaimers (type → line)

| Type | Hinglish line |
|---|---|
| food | Yeh FSSAI label ki information hai. Dietary advice ke liye nutritionist se milo. |
| medicine | Yeh sirf label ki information hai. Doctor se confirm karo pehle. |
| legal_doc | Yeh AI summary hai. Final decision apne aap lo ya vakeel se lo. |
| bill / mrp | Agar overcharging hai toh consumer helpline 1800-11-4000 pe call karo. |
| insurance | Premium pay karne se pehle UPI Fraud Guard mein check kar lo. |

## Consent gating

`localStorage.chitti_scanner_consent_given`. T&C modal sections:

  1. What Scanner is (and is not — no diagnosis, no legal verdict)
  2. Legal Compliance (FSSAI · Consumer Protection Act 2019 · DPDP Act 2023)
  3. Permissions Required (Camera access — only when you tap the camera button)
  4. Data Privacy (images not stored on server; processed in-memory)
  5. Emergency and Liability (consumer helpline 1800-11-4000 · medical → doctor)
  6. Grievance Redressal (sire@sahayai.in)

## Cross-product hooks (built-in)

- **Medicine detected** → `cross_links` returns a `medupi_lookup`
  hand-off; the frontend calls
  `${MEDUPI_API_BASE}/api/medupi/medicine/<query>` and renders the
  Jan-Aushadhi panel inline.
- **Insurance detected** → frontend offers a deep-link to
  `chitti_upi.html` with the policy summary pre-filled.
- **Food detected** (or any time the user wants) → "Have Chitti read
  this aloud" deep-links to `chitti_vaani.html?from=scanner` with the
  result handed off via `sessionStorage`.
- **Bill / MRP overcharging** → tel-link to consumer helpline
  1800-11-4000.

## Live URLs

- Frontend: https://sahayai.in/chitti_scanner.html
- Backend:  https://chitti-scanner-api-production.up.railway.app (planned — `render.yaml` ready)
