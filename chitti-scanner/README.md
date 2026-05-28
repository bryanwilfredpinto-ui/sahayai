🎖️ **World Class Chitti Scanner — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> Snap or type any label · DeepSeek vision · FSSAI status · MedUPI deep-link · honest `unclear` verdict when confidence is low · camera-intelligence contract on every scan.

| Field | Value |
|---|---|
| Live URL | https://sahayai.in/chitti_scanner.html |
| Health | https://chitti-scanner-api-production.up.railway.app/health |
| Status | 🟢 GREEN (intentional Railway — Quality Status §1) |
| 4 Users | 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate — voice-first, ISL panel |
| Languages | Hindi + English + 9 Indian languages |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md §9](../CHITTI_SOP.md) |

---

# Chitti Product Scanner

**Snap or type any label. Chitti reads it, warns you, saves you money.**

Chitti Product Scanner is the universal capture-or-type analyser inside the Sahay AI / Chitti family. The user points a phone at — or types out — a food packet, medicine strip, utility bill, contract, MRP sticker, or insurance policy, and Chitti returns a structured verdict in plain Hinglish: what the product is, the key findings, any warnings, possible savings, and a type-specific legal disclaimer. Where it makes sense, the response also hands off to sibling products (MedUPI for Jan Aushadhi alternatives, UPI Fraud Guard for insurance-premium safety, Chitti Vaani for read-aloud, or the consumer helpline 1800-11-4000 for overcharging).

This product is the missing "front door" of the Chitti suite for illiterate, low-vision, and senior users — they cannot fill forms or read fine print, but they can hold a phone in front of a packet and tap one button.

---

## Scope (v1)

| Document / object type | What Chitti returns |
|---|---|
| `food` | FSSAI claims check, sugar/salt/fat in plain words, MRP sanity check |
| `medicine` | Brand, composition, expiry, dosage as printed (never invented), Jan Aushadhi cross-link |
| `legal_doc` | Top 3 risky clauses, red flags (data sharing, auto-renewal, arbitration) |
| `bill` | Itemised oddities, suspected overcharging |
| `mrp` | MRP vs charged price |
| `insurance` | Premium sanity, policy red flags, UPI Fraud Guard deep-link |
| `other` | Generic plain-English summary with the conservative disclaimer |

Aadhaar / PAN / utility-bill numbers are recognised as KYC fragments — Chitti will read them back masked in the UI (last 4 only). Raw scan images are **never** persisted server-side; the backend is intentionally stateless and processes the upload in-memory.

---

## Design choice: text-fallback first

The frontend can capture from camera (or load from gallery), but the backend's **primary path is `analyze_text`** — the user types out (or speaks-to-text) what the label says. This works on every browser, every phone, every literacy level, with zero vision-model spend.

A vision path is wired (`DEEPSEEK_VISION_MODEL`) and **disabled by default** (`"off"` in `render.yaml`); flip it on once a vision-capable endpoint is provisioned. Until then, image uploads return a friendly "type out the label" response.

---

## Repo layout

```
chitti-scanner/
├── README.md                 (this file — overview)
├── CONTEXT.md                (why it exists + accessibility contract)
├── ARCHITECTURE.md           (Flask backend, services, skills, frontend)
├── CHANGELOG.md              (commit history)
├── TODO.md                   (outstanding work)
├── API.md                    (endpoint reference)
├── DATABASE.md               (N/A — stateless)
├── PROMPTS.md                (CHITTI_SCANNER_PROMPT verbatim)
├── render.yaml               (Railway blueprint — not yet connected)
├── frontend/
│   ├── index.html            (mirror of /chitti_scanner.html)
│   └── README.md
├── backend/
│   ├── main.py               (Flask entrypoint, CORS, error handlers)
│   ├── config.py             (env-driven Settings dataclass)
│   ├── requirements.txt      (flask · flask-cors · gunicorn · httpx)
│   ├── runtime.txt           (python-3.11.10)
│   ├── routes/
│   │   ├── __init__.py
│   │   └── scanner.py        (Blueprint /api/scanner/*)
│   └── services/
│       ├── __init__.py
│       └── scanner_service.py (DeepSeek wrapper + prompt + cross-links)
└── skills/
    └── chitti-scanner/
        └── SKILL.md          (top-level sub-agent spec)
```

---

## Quick start (local)

```bash
cd chitti-scanner/backend
pip install -r requirements.txt
DEEPSEEK_API_KEY=sk-... python main.py          # → http://127.0.0.1:8005
```

Open `frontend/index.html?api=http://127.0.0.1:8005` (append `&medupi=http://localhost:8001` if you also run the MedUPI backend locally).

---

## Endpoints (summary)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Service banner |
| `GET` | `/health` | Liveness ping |
| `POST` | `/api/scanner/analyze` | Multipart `image` **or** JSON `{text, language?}` |
| `POST` | `/api/scanner/analyze/text` | JSON-only convenience path |
| `GET` | `/api/scanner/health` | DeepSeek + vision-model status |

Full request/response shapes live in [API.md](./API.md).

---

## Cross-product hooks

Every response includes a `cross_links` array. The frontend renders these as deep-link buttons:

| Trigger `type` | Hand-off | Effect |
|---|---|---|
| `medicine` | `medupi_lookup` | Frontend calls `${MEDUPI_API_BASE}/api/medupi/medicine/<query>` and renders the Jan-Aushadhi panel inline |
| `insurance` | `upi_check` | Deep-link to `chitti_upi.html?from=scanner` with the summary in `sessionStorage` |
| `food` | `vaani_read` | Deep-link to `chitti_vaani.html?from=scanner` so the result can be read aloud |
| `bill` / `mrp` | `tel` | `tel:1800114000` — consumer helpline |

---

## Live URLs

| Surface | URL | Status |
|---|---|---|
| Frontend | https://sahayai.in/chitti_scanner.html | Live |
| Backend | https://chitti-scanner-api-production.up.railway.app | **Planned** — `render.yaml` is ready but the service has not been connected to Railway yet (P0 in [TODO.md](./TODO.md)) |

---

## Related docs

- [CONTEXT.md](./CONTEXT.md) — why this product exists + accessibility contract
- [ARCHITECTURE.md](./ARCHITECTURE.md) — runtime topology
- [API.md](./API.md) — endpoint reference
- [PROMPTS.md](./PROMPTS.md) — `CHITTI_SCANNER_PROMPT` verbatim
- [TODO.md](./TODO.md) — outstanding work
- [CHANGELOG.md](./CHANGELOG.md) — commit history
- [DATABASE.md](./DATABASE.md) — N/A (stateless)
- [skills/chitti-scanner/SKILL.md](./skills/chitti-scanner/SKILL.md) — sub-agent spec
