# Chitti Voice Factory

> "Your mother tongue, spoken back to you — legally, consensually, at zero marginal cost where we can."

The **shared voice substrate** for every Chitti product. Every voice-IN and voice-OUT
moment in Chitti Shares, MedUPI, News, Vaani, CA, Legal, Government, etc. routes
through this service. It is not a standalone consumer product — it is the foundation
that the four-user accessibility contract (Blind / Deaf / Mute / Illiterate) is built
on across **26 Indian languages**.

Spec: [`../CHITTI_VOICE_FACTORY_MASTER_SPEC.md`](../CHITTI_VOICE_FACTORY_MASTER_SPEC.md)

---

## 1. What this product is — and is not

- **IS** a router over **legal, consented voice sources** (Bhashini, AI4Bharat, Sarvam, opt-in community donors).
- **IS** the language-routing substrate every other Chitti product calls.
- **IS** an honest ledger — every "available" claim is backed by a real synthesis row in the last 24 h.
- **IS NOT** a voice-cloning product. We do not clone anchors. We do not scrape Doordarshan / AIR / YouTube.
- **IS NOT** a deepfake platform. The "Chitti Male" personality voice comes from consenting community donors.

---

## 2. 26 Languages

```
Primary 12 (Tier A)   Hindi · Bangla · Telugu · Tamil · Kannada · Malayalam ·
                      Marathi · Gujarati · Odia · Assamese · Punjabi · Urdu

Cousin 11 (Tier B)    Bhojpuri · Chhattisgarhi · Maithili · Konkani · Dogri ·
                      Sindhi · Kashmiri · Manipuri · Bodo · Santhali · Sanskrit

Cousin 3 (Tier C)     Tulu · Kodava · Oraon (Kurukh)
                      (no production model — donor program required, NO silent fallback)
```

Each language has a generated `chitti_<lang>.html` front door at the repo root
(e.g. [`../chitti_hi.html`](../chitti_hi.html), [`../chitti_sa.html`](../chitti_sa.html)).

---

## 3. Four-supplier cascade

The router walks suppliers in this priority order. First supplier that returns
`ok=True` for the requested language wins. Every attempt (success or failure)
is logged to SQLite.

| # | Supplier | Source | Cost | Status today |
|---|---|---|---|---|
| 1 | `on_device` | quantised ONNX in-browser via `onnxruntime-web` | zero after download | placeholder — returns `unavailable` until models packaged (Phase 10) |
| 2 | `bhashini` | Govt of India NLTM (ULCA) | zero (citizen use) | **wired, disabled** until ULCA credentials issued |
| 3 | `mock_bhashini` | client-side Web Speech directive — honestly labelled | zero | **active** stub until real Bhashini comes online |
| 4 | `ai4bharat` | IIT Madras IndicTTS / IndicParler-TTS | zero (self-hosted) | stub — Phase 7 |
| 5 | `sarvam` | paid commercial TTS | metered ₹/char | disabled in v1 |

Tier C languages never silently fall back. They return HTTP 503 with a
`donor_url` pointing at [`../voice_donor.html`](../voice_donor.html).

---

## 4. Phase 2 — Community Voice Contest + Hall of Fame

The newest evolution: instead of paying suppliers or scraping, real Indians
**donate their voice** for the language they speak natively. The strongest
submissions become permanent Hall of Fame voices.

- [`../voice_donor.html`](../voice_donor.html) — 3-stage consent + recording flow
- [`../voice_confirmation.html`](../voice_confirmation.html) — submission receipt
- [`../chitti_voice_hall_of_fame.html`](../chitti_voice_hall_of_fame.html) — public winners gallery
- [`admin/dashboard.html`](admin/dashboard.html) — OAuth-gated admin (GitHub/Google) for picking winners
- Permanent voice locking: winners are stored with `can_delete=0` — never overwritten.

Two-stage consent:

1. **Stage 1** (submitter) — three explicit consents + name + email + recording.
2. **Stage 2** (admin confirms winner) — flips `is_winner=1`, allocates a `winner_id`, updates `voice_synthesis_map[language]`.

---

## 5. Run locally

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate    # Windows
pip install -r requirements.txt
python main.py                                     # http://localhost:8000
```

Environment variables (all optional in dev):

| Var | Default | Meaning |
|---|---|---|
| `VOICE_FACTORY_DB` | `./chitti_voice_factory.sqlite` | SQLite path |
| `VOICE_FACTORY_USE_MOCK_BHASHINI` | `1` | Use mock until real ULCA creds arrive |
| `BHASHINI_USER_ID` / `BHASHINI_API_KEY` / `BHASHINI_INFERENCE_KEY` | none | ULCA citizen creds (Phase 6) |
| `AI4BHARAT_ENDPOINT` | none | Self-hosted or HF inference URL (Phase 7) |
| `SARVAM_ENABLED` + `SARVAM_API_KEY` | none | Paid fallback (Phase 8) |
| `ALLOWED_ORIGINS` | `https://sahayai.in,https://www.sahayai.in,http://localhost:5500` | CORS allowlist |
| `ADMIN_OAUTH_PROVIDER` | `github` | `github` or `google` |
| `ADMIN_OAUTH_ID` / `ADMIN_OAUTH_SECRET` | none | OAuth app credentials |
| `ADMIN_EMAILS` | empty | comma-separated allowlist for `/admin/*` |
| `STORAGE_PROVIDER` | `terabox` | `terabox` or `mega` |
| `TERABOX_API_KEY` / `MEGA_EMAIL` / `MEGA_PASSWORD` | none | audio storage creds |

---

## 6. Quick verify

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/voice/languages
curl http://localhost:8000/api/voice/status                            # all 26 → available:false initially
curl -X POST http://localhost:8000/api/voice/speak \
     -H "Content-Type: application/json" \
     -d '{"text":"Namaste, main Chitti hoon","language":"hi"}'
curl http://localhost:8000/api/voice/status/hi                         # now available:true
curl http://localhost:8000/api/voice/hall-of-fame                      # winners (empty until Phase 2 picks first)
```

---

## 7. Deploy (Render)

[`render.yaml`](render.yaml) lives at the folder root. Push to `main`; Render picks it up.

Production: `https://chitti-voice-factory.onrender.com`

---

## 8. Non-negotiables

1. **No fake data.** A language is `available:true` only after a real (or honestly-labelled mock) synthesis row exists.
2. **No scraping.** Doordarshan / AIR / YouTube are forbidden corpora.
3. **Mock supplier is named `mock_bhashini`**, never silently labelled `bhashini`.
4. **Tier C never silently falls back.** Tulu / Kodava / Oraon users see the donor banner, not a Kannada voice with their text.
5. **Every audio response carries a disclaimer** naming the supplier — spoken first, written second.
6. **Donor recordings are permanent once a winner is confirmed** (`can_delete=0`). Stage-1 submissions can still be discarded by the admin.

See [`CONTEXT.md`](CONTEXT.md) for why these rules exist and what they protect.
