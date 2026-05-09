# Chitti Voice Factory

Multi-language voice substrate for the Chitti family. 24 Indian languages.
Cascade: `on_device → bhashini → ai4bharat → sarvam`. Honest ledger at `/api/voice/status`.

Spec: see `../CHITTI_VOICE_FACTORY_MASTER_SPEC.md`.

## 1. Run locally

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate    # Windows
pip install -r requirements.txt
python main.py                                     # http://localhost:8000
```

Env vars (all optional in dev):

| Var | Default | Meaning |
|---|---|---|
| `VOICE_FACTORY_DB` | `./chitti_voice_factory.sqlite` | SQLite path |
| `VOICE_FACTORY_USE_MOCK_BHASHINI` | `1` | Use mock until real ULCA creds arrive |
| `BHASHINI_USER_ID` | (none) | ULCA citizen ID (Phase 6) |
| `BHASHINI_API_KEY` | (none) | ULCA API key (Phase 6) |
| `BHASHINI_INFERENCE_KEY` | (none) | ULCA inference auth (Phase 6) |
| `SARVAM_API_KEY` | (none) | Sarvam paid API (Phase 8 — disabled by default) |
| `ALLOWED_ORIGINS` | `https://sahayai.in,https://www.sahayai.in,http://localhost:5500` | CORS allowlist |

## 2. Quick verify

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/voice/languages
curl http://localhost:8000/api/voice/status                          # all 24 → available:false initially
curl -X POST http://localhost:8000/api/voice/speak \
     -H "Content-Type: application/json" \
     -d '{"text":"Namaste, main Chitti hoon","language":"hi"}'
curl http://localhost:8000/api/voice/status/hi                       # now available:true
```

## 3. Bhashini ULCA registration (when ready)

When the NLTM citizen-account application is approved, set:

```
BHASHINI_USER_ID=<your ULCA user id>
BHASHINI_API_KEY=<api key>
BHASHINI_INFERENCE_KEY=<inference auth>
VOICE_FACTORY_USE_MOCK_BHASHINI=0
```

The cascade will start preferring real Bhashini over the mock. Ledger entries will switch from `supplier=mock_bhashini` to `supplier=bhashini`.

Application-body draft (paste verbatim into the ULCA application):

> "Chitti Voice Factory is non-commercial accessibility infrastructure built for blind, deaf, mute, and illiterate users across 24 Indian languages. Output audio is delivered free at point of use, attributed to Bhashini (Govt of India NLTM) on every response. We do not redistribute, repackage, or resell any Bhashini output. We comply with the citizen-use rate limits. We will not use Bhashini for any commercial product."

## 4. Deploy (Render)

`render.yaml` at repo root of this folder (already committed). Push to main; Render picks it up.

## 5. Non-negotiables (from spec §11)

1. No fake data — `available:true` only after real synthesis row.
2. No scraping (Doordarshan / AIR / YouTube forbidden).
3. Mock supplier is named `mock_bhashini`, never silently labelled `bhashini`.
4. Tier C languages (Tulu, Kodava) never silently fall back to a related language.
5. Every audio response includes a disclaimer naming the supplier.
