🎖️ **World Class Chitti Voice Factory — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> Shared voice substrate · 26 languages · 4-supplier cascade · Tier C never silently falls back · community voices replace Bhashini over time.

| Field | Value |
|---|---|
| Live URL | https://sahayai.in/chitti_voice_factory.html + 26 language pages |
| Health | https://chitti-voice-factory-production.up.railway.app/health |
| Status | 🟢 GREEN (intentional Railway) |
| Phase 2 blocker | Sire's Bhashini ULCA registration |
| Primary user | B2B internal — every other Chitti backend |
| Languages | 26 (12 primary + 14 cousin incl. Sanskrit + Oraon) |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md §11](../CHITTI_SOP.md) · [MASTER_SPEC](../CHITTI_VOICE_FACTORY_MASTER_SPEC.md) |

---

# Chitti Voice Factory

**The shared voice layer for every Chitti product in 26 Indian languages.**

- Frontend: 26 generated HTML pages (`chitti_<lang>.html`)
- Backend: Flask on Railway (`chitti-voice-factory-production.up.railway.app`)
- Spec: [CHITTI_VOICE_FACTORY_MASTER_SPEC.md](../CHITTI_VOICE_FACTORY_MASTER_SPEC.md)

---

## Setup

### Local Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
export ALLOWED_ORIGINS="http://localhost:8000,http://localhost:3000"
python main.py
```

Test: `curl http://localhost:8004/health`

### Railway Deployment

1. Ensure `render.yaml` exists in the repo root.
2. Link this repo to Railway (`sahayai.in` or `sahayai-v2`).
3. Create a new web service pointing to this directory tree.
4. Add environment variables in Railway dashboard:
   - `BHASHINI_USER_ID` (once ULCA account is active)
   - `BHASHINI_API_KEY`
   - `BHASHINI_INFERENCE_KEY`
   - `SARVAM_API_KEY` (for later phases)
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`
   - `ALLOWED_ORIGINS` (production URLs)

Deploy will automatically run:

```
pip install -r backend/requirements.txt
gunicorn main:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60
```

---

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Service banner + docs link |
| `GET` | `/health` | Liveness check |
| `GET` | `/api/voice/languages` | 26-language registry |
| `GET` | `/api/voice/status` | All languages honest status |
| `GET` | `/api/voice/status/<lang>` | One language status |
| `POST` | `/api/voice/speak` | Synthesise text (cascade) |
| `GET` | `/api/voice/honest-banner` | Disclaimer text for all Chitti products |
| `GET` | `/api/voice/ledger` | Anonymized synthesis ledger |
| `GET` | `/api/voice/donations` | Public donor list (v1: empty) |
| `POST` | `/api/voice/donate` | Volunteer voice donation (v1: stub) |

### Example: Synthesise Hindi

```bash
curl -X POST https://chitti-voice-factory-production.up.railway.app/api/voice/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "नमस्ते", "language": "hi"}'
```

Response (v1, using mock Bhashini):

```json
{
  "ok": true,
  "language_code": "hi",
  "supplier": "mock_bhashini",
  "directive": "use_web_speech_api",
  "disclaimer": "Yeh AI ki madad hai. Chitti Voice Factory se synthesise kiya gaya hai."
}
```

Frontend then calls browser's `SpeechSynthesisUtterance` API with `lang="hi"`.

---

## Phases

### Phase 1 (Current ✅)

- [x] Master spec written.
- [x] Flask backend with ledger (SQLite).
- [x] Mock Bhashini (returns `directive: use_web_speech_api`).
- [x] 26 language HTML pages.
- [x] Honest status endpoints (all return `available: false` until first real synthesis).
- [x] render.yaml wired.

**Status**: Ready for Railway deployment. Uses browser Web Speech API for v1.

### Phase 2 (Real Bhashini)

- [ ] Bhashini ULCA credentials issued to `sire@sahayai.in`.
- [ ] `bhashini_client.py` updated to call real API.
- [ ] First successful synthesis recorded; Hindi flips to `available: true`.
- [ ] `ledger` endpoint shows real latency + supplier proof.

### Phase 3 (On-device + Donors)

- [ ] ONNX voice models packaged (50–100 MB per language).
- [ ] Uploaded to Supabase Storage under `chitti-voices/` bucket.
- [ ] Frontend downloads + caches in IndexedDB.
- [ ] `/api/voice/donate` accepts audio + CC-BY-4.0 consent.
- [ ] Donor names + counts published in `/api/voice/donations`.

### Phase 4 (Sarvam Fallback)

- [ ] Sarvam API credentials configured.
- [ ] Cascade: on_device → mock_bhashini → ai4bharat → sarvam.
- [ ] Rate-limited to 100 chars/request.
- [ ] Paid supplier usage monitored.

---

## Bhashini ULCA Registration (Draft for Sire)

**What:** Bhashini is India's government NLTM (National Language Technology Mission). We register as a citizen use case.

**Who signs:** Sire (Bryan's father) — co-citizen, registered email `sire@sahayai.in`.

**When:** Once Sire is ready. This unblocks Phase 2.

---

### Draft Application Form (Sire to fill + sign)

**Form Name:** ULCA Anuvaad Tools — Citizen Registration

**Section 1: Applicant**

- **Full Name:** [Sire's name]
- **Email:** sire@sahayai.in
- **Organisation:** Sahayai.in
- **Role:** Co-Founder

**Section 2: Use Case**

- **Project Name:** Chitti Voice Factory
- **Category:** Accessibility Infrastructure
- **Use:** Multi-language text-to-speech for blind, illiterate, and rural Indian users.
- **Languages:** 26 Indian languages (constitutional + cousins).
- **Target Users:** Blind, deaf, mute, illiterate users; rural Bharat.
- **Cost to Users:** ₹0 (fully free).

**Section 3: Data & IP**

- **Data Source:** User text input only (never stored; SHA256-hashed for ledger).
- **Voice Corpus:** Bhashini TTS API; no anchor cloning; no YouTube/Doordarshan scraping.
- **Output License:** CC-BY-4.0 (with Bhashini attribution in every audio response).
- **Commercial Redistribution:** None. Sahayai.in is non-profit; revenue model TBD.

**Section 4: Consent**

- [ ] I confirm all outputs will include attribution to Bhashini + ULCA.
- [ ] I will not resell, clone, or redistribute voice models.
- [ ] Usage is for accessibility only; no commercial TTS product.

**Signature:** _________________________ **Date:** __________

---

### How to Register

1. **Sire:** Go to https://ulca.ai4bharat.org/ → Sign up.
2. **Fill out the form above** (copy into their portal).
3. **Attach:** This README (explaining Chitti's use case).
4. **Attach:** `CHITTI_VOICE_FACTORY_MASTER_SPEC.md` (full product spec).
5. **Submit** for approval.
6. **Approval turnaround:** Usually 3–5 business days.
7. **Once approved:** Bhashini issues API credentials:
   - `BHASHINI_USER_ID`
   - `BHASHINI_API_KEY`
   - `BHASHINI_INFERENCE_KEY`
8. **Paste these into Railway dashboard** → redeploy.

---

## Testing Voice Factory

Once deployed to Railway:

```bash
# Check all languages
curl https://chitti-voice-factory-production.up.railway.app/api/voice/status | jq .

# Check one language
curl https://chitti-voice-factory-production.up.railway.app/api/voice/status/hi | jq .

# Synthesise (v1: uses Web Speech API)
curl -X POST https://chitti-voice-factory-production.up.railway.app/api/voice/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "नमस्ते मित्र", "language": "hi"}'
```

Frontend pages (e.g., `chitti_hindi.html`) can be tested locally or uploaded to GitHub Pages.

---

## License

- **Code (backend):** MIT (Sahayai.in)
- **Voice outputs:** CC-BY-4.0 (via Bhashini ULCA terms)
- **Donor recordings:** CC-BY-4.0 + voluntary

---

## Contact

- **Chitti Voice Factory issues:** GitHub Issues
- **Bhashini questions:** https://bhashini.ai4bharat.org/
- **Donor inquiries:** chitti@sahayai.in

---

**Built with ❤️ for every Indian's mother tongue.**
