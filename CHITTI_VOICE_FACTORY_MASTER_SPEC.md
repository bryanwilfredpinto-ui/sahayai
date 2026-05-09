# CHITTI Voice Factory — Master Specification

**Version:** 1.0
**Date:** 2026-05-09
**Author:** Bryan Wilfred Pinto · drafted by Claude
**Status:** LIVING DOCUMENT — every Claude session that touches Chitti voice / TTS / multi-language must read this first.

> "Every Indian's mother tongue, spoken back to them — legally, consensually, at zero marginal cost where we can."

---

## 0. Where this product sits

```
Chitti (parent brand at sahayai.in)
├── Chitti Shares
│   ├── Chitti Technical    (chitti_complete_technical.html)
│   └── Chitti Fundamentals (chitti_fundamentals.html)
├── Chitti MedUPI           (chitti_medupi.html)
├── Chitti News             (chitti_news.html)
├── Chitti Vaani            (chitti_vaani.html  +  chitti-vaani-android/)
└── Chitti Voice Factory    (this spec)               ← SHARED VOICE SUBSTRATE
    │
    ├── Primary 12   Hindi · Bangla · Telugu · Tamil · Kannada · Malayalam ·
    │                Marathi · Gujarati · Odia · Assamese · Punjabi · Urdu
    └── Cousin 14    Bhojpuri · Chhattisgarhi · Maithili · Konkani · Tulu ·
                     Kodava · Dogri · Sindhi · Kashmiri · Manipuri · Bodo · Santhali ·
                     Sanskrit · Oraon (Kurukh)
```

**Chitti `<lang>` pages (e.g. `chitti_bangla.html`, `chitti_tulu.html`) are localised front doors over the same backend** — not 24 new products.

---

## 1. Product Overview

| Field | Value |
|---|---|
| **Product Name** | Chitti Voice Factory |
| **Tagline** | "Your mother tongue, spoken back to you." |
| **Category** | Multi-language voice substrate (TTS + STT + voice routing) |
| **Mission** | Give every Indian a Chitti that speaks the language they think in — using only legal, consented, openly-licensed voice. |
| **Target users** | All Chitti users — prioritised for the four-user contract (Blind / Deaf / Mute / Illiterate). |
| **Backend** | `chitti-voice-factory/backend/` · Flask · `https://chitti-voice-factory.onrender.com` |
| **Frontend** | 24 generated `chitti_<lang>.html` pages + status dashboard `chitti_voice_factory.html` |

**Positioning:**
- ✅ IS a router over **legal, consented voice sources** (Bhashini, AI4Bharat, Sarvam, opt-in donors).
- ✅ IS the language-routing substrate every other Chitti product calls.
- ❌ NOT a voice-cloning product. We do not clone real anchors. We do not scrape Doordarshan / AIR / YouTube.
- ❌ NOT a deepfake platform. The "Chitti Male" personality voice comes from consenting volunteer donors.

---

## 2. Things we EXPLICITLY DECIDED NOT to do (and why)

This section exists so future Claude / future contributors do not "improve" these back in.

### 2.1 ❌ NO Doordarshan / Prasar Bharati / YouTube audio scraping
**Why blocked:** anchor voices are personality rights (cf. *Anil Kapoor v. Simply Life India*, Delhi HC 2023; *Arijit Singh v. Codible Ventures*, Bombay HC 2024). Prasar Bharati holds broadcast copyright. Risk = takedown + named defendant.
**Use instead:** Bhashini, AI4Bharat, Sarvam, Mozilla Common Voice, opt-in donors.

### 2.2 ❌ NO "cousin = primary + grammar swap + voice morph"
**Why blocked:** Tulu is a separate Dravidian language, not Kannada-with-a-filter. Konkani has 4 dialects across 4 scripts. Morph output sounds like mockery to actual speakers.
**Use instead:** real per-language models from Bhashini / AI4Bharat. For Tulu + Kodava (no model exists): voice-donor program, NOT silent fallback.

### 2.3 ❌ NO claim of "<100 ms on-device, native-quality, cloned, 12 languages, 50–100 MB"
**Why blocked:** XTTS-v2 weights are ~1.8 GB. The maths doesn't work.
**Use instead:** measured per-language latency in the ledger. Cascade picks the supplier that actually meets target.

---

## 3. Suppliers (cascade order)

Four named suppliers. The cascade tries them in this priority and records every attempt.

| # | Supplier | Role | Cost | Status today |
|---|---|---|---|---|
| 1 | `on_device` | downloaded ONNX model running in-browser via `onnxruntime-web` | zero (after one-time download) | placeholder — returns `unavailable` until models packaged |
| 2 | `bhashini` | Govt of India NLTM — primary source of truth | zero (citizen use) | **MOCK** until ULCA credentials issued. Mock returns a `client_directive: speech_synthesis` so the client uses browser TTS, with `supplier=mock_bhashini` honestly labelled in every response. |
| 3 | `ai4bharat` | IIT Madras IndicTTS / IndicParler-TTS — open weights | zero (self-hosted) or low (HF inference) | not yet wired |
| 4 | `sarvam` | paid commercial TTS — last resort | metered ₹/char | disabled in v1 |

**Cascade rule:** the router walks 1→2→3→4. First supplier that returns `ok=True` wins. The supplier that won is recorded in the ledger and surfaced to the client as `supplier` and to the user as a verbal disclaimer.

---

## 4. Languages — per-language honest tiers (26 total)

### 4.1 Tier A — Production-ready (12 Primary)
All covered by Bhashini AND AI4Bharat IndicTTS. Web Speech API fallback exists for most.

| Language | ISO | Bhashini | AI4Bharat | Web Speech |
|---|---|---|---|---|
| Hindi | hi | ✅ | ✅ | ✅ |
| Bangla | bn | ✅ | ✅ | ✅ |
| Telugu | te | ✅ | ✅ | ✅ |
| Tamil | ta | ✅ | ✅ | ✅ |
| Kannada | kn | ✅ | ✅ | ✅ |
| Malayalam | ml | ✅ | ✅ | ✅ |
| Marathi | mr | ✅ | ✅ | ✅ |
| Gujarati | gu | ✅ | ✅ | ✅ |
| Odia | or | ✅ | ✅ | ⚠️ thin on iOS |
| Assamese | as | ✅ | ✅ | ❌ |
| Punjabi | pa | ✅ | ⚠️ Gurmukhi only | ✅ |
| Urdu | ur | ✅ | ❌ | ✅ |

### 4.2 Tier B — Covered but quality varies (11 Cousins)

| Language | ISO | Bhashini | AI4Bharat | Notes |
|---|---|---|---|---|
| Bhojpuri | bho | ⚠️ partial | ✅ Indic-Parler | AI4Bharat primary |
| Chhattisgarhi | hne | ⚠️ partial | ⚠️ corpus only | Donor program for top-up |
| Maithili | mai | ✅ | ⚠️ partial | Bhashini primary |
| Konkani | kok | ✅ Devanagari | ⚠️ partial | Flag for Roman/Kannada users |
| Dogri | doi | ✅ | ❌ | Bhashini-only |
| Sindhi | sd | ✅ Devanagari | ❌ | Arabic script flagged |
| Kashmiri | ks | ⚠️ partial | ❌ | Weakest Tier B — flag in honest_status |
| Manipuri (Meitei) | mni | ✅ | ✅ | Both scripts supported |
| Bodo | brx | ⚠️ partial | ✅ | AI4Bharat primary |
| Santhali | sat | ⚠️ partial | ❌ | Ol Chiki — donor program planned |
| Sanskrit | sa  | ✅ partial | ⚠️ IndicTTS partial | Scheduled-22; Web Speech rarely has a Sanskrit voice |

### 4.3 Tier C — No production model (3 Cousins)

| Language | ISO | Plan |
|---|---|---|
| Tulu | tcy | **Donor program required.** v1 ships text-only with banner. NO silent fallback. |
| Kodava | kfa | **Donor program required.** v1 ships text-only with banner. NO silent fallback. |
| Oraon (Kurukh) | kru | **Donor program required.** Dravidian, ~2M speakers across Jharkhand/Chhattisgarh/Odisha/WB. v1 ships text-only with banner. |

---

## 5. Honest Status Ledger (SQLite — `voice_factory.sqlite`)

**Hard rule: NO fake data. Every "available" claim is backed by a real synthesis row.**

```sql
CREATE TABLE synthesis_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  language_code   TEXT NOT NULL,
  supplier        TEXT NOT NULL,        -- 'on_device' | 'bhashini' | 'mock_bhashini' | 'ai4bharat' | 'sarvam'
  text_sha256     TEXT NOT NULL,        -- never log raw user text
  text_chars      INTEGER NOT NULL,
  bytes_out       INTEGER,              -- bytes of audio produced (0 if client-side directive)
  latency_ms      INTEGER,              -- measured wall-clock
  ok              INTEGER NOT NULL,     -- 1 success, 0 failure
  error_code      TEXT,                 -- short token if !ok
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_log_lang_time ON synthesis_log(language_code, created_at);

CREATE TABLE donor_consents (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  donor_handle    TEXT NOT NULL,        -- public attribution name
  language_code   TEXT NOT NULL,
  consent_text_sha256 TEXT NOT NULL,
  audio_proof_url TEXT NOT NULL,        -- donor verbally states consent
  recorded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at      TIMESTAMP
);
```

`/api/voice/status` returns `available:true` for a language ONLY IF **all four** are true:
1. Successful synthesis row in last 24 h (`ok=1`).
2. `latency_ms IS NOT NULL`.
3. Known supplier (one of the five listed).
4. Disclaimer text non-empty.

Otherwise `available:false` with a `reason`. **No language returns `available:true` from a hard-coded boolean.**

---

## 6. API Surface

Base: `https://chitti-voice-factory.onrender.com`

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Banner: name, version, link to ledger |
| GET | `/health` | Liveness |
| GET | `/api/voice/status` | Per-language honest status (all 24) |
| GET | `/api/voice/status/<lang>` | One language detailed status |
| POST | `/api/voice/speak` | Synthesise (cascade); body `{text, language}` |
| GET | `/api/voice/languages` | The 24-language registry |
| GET | `/api/voice/ledger` | Full ledger (anonymised — sha256 only) |
| GET | `/api/voice/honest-banner/<lang>` | Per-language verbal disclaimer text |
| POST | `/api/voice/donate` | Volunteer donor signup (CC-BY-4.0 + audio proof) |
| GET | `/api/voice/donations` | Public donor list (no audio, just credit) |

### 6.1 `POST /api/voice/speak` response shapes

**Success (mock supplier — client-side TTS directive):**
```json
{
  "ok": true,
  "supplier": "mock_bhashini",
  "client_directive": "speech_synthesis",
  "text": "नमस्ते, मैं चिट्टी हूँ।",
  "language": "hi",
  "voice_lang_code": "hi-IN",
  "latency_ms": 18,
  "disclaimer": "MOCK supplier — replaces real Bhashini once NLTM credentials are issued. Voice is your device's built-in TTS. Not a real person."
}
```

**Success (real Bhashini, future):**
```json
{
  "ok": true,
  "supplier": "bhashini",
  "audio_url": "https://cdn.sahayai.in/voice/cache/sha256.../audio.mp3",
  "language": "hi",
  "latency_ms": 612,
  "disclaimer": "Voice via Bhashini (Govt of India NLTM). Not a real person."
}
```

**Failure (Tier C, no supplier available):**
```json
{
  "ok": false,
  "supplier": null,
  "language": "tcy",
  "reason": "voice_not_available",
  "human_message_en": "Chitti is still learning Tulu. We need volunteer voice donors.",
  "donor_url": "https://sahayai.in/voice_donor.html?lang=tcy"
}
```

---

## 7. Frontend pages

Each `chitti_<lang>.html`:
- Sticky **honest banner** in that language: status pill that reads `/api/voice/status/<lang>` every 60 s. Never a fake green tick.
- Four-user contract row (blind / deaf / mute / illiterate symbol header).
- One **🔊 Speak this** button on a textbox.
- One **🎙️ Donate my voice** button → `/api/voice/donate` (skippable).
- One **⬇️ Download voice model** button (when on-device model exists).
- All buttons have aria-labels. All verdicts are spoken first, written second.
- AI-not-a-doctor / AI-not-a-lawyer banner via `chitti_disclaimer.js`.
- SEBI banner NOT shown (this is not a finance product).

A status dashboard `chitti_voice_factory.html` shows the full 24-language ledger publicly.

---

## 8. Deploy

```yaml
# chitti-voice-factory/render.yaml
services:
  - type: web
    name: chitti-voice-factory
    runtime: python
    rootDir: chitti-voice-factory/backend
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn main:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.10
      - key: ALLOWED_ORIGINS
        value: https://sahayai.in,https://www.sahayai.in
      - key: BHASHINI_USER_ID
        sync: false
      - key: BHASHINI_API_KEY
        sync: false
      - key: BHASHINI_INFERENCE_KEY
        sync: false
      - key: SARVAM_API_KEY
        sync: false
      - key: VOICE_FACTORY_DB
        value: /tmp/chitti_voice_factory.sqlite
      - key: VOICE_FACTORY_USE_MOCK_BHASHINI
        value: "1"
```

Frontend is static — `chitti_<lang>.html × 24` + `chitti_voice_factory.html` deploy alongside other Chitti pages on GitHub Pages.

---

## 9. Bhashini registration

To go from MOCK → real Bhashini we need:
- A registered Bhashini ULCA citizen account
- Inference API key
- Stated use case: **accessibility infrastructure for blind / illiterate users in 24 Indian languages, free at point of use, attribution to Bhashini on every audio response, no commercial redistribution**

Application body draft lives at `chitti-voice-factory/README.md` §3.

Until creds arrive, env var `VOICE_FACTORY_USE_MOCK_BHASHINI=1` keeps the mock active. Setting it to `0` and providing real keys flips Bhashini live with no other code change.

---

## 10. Build phases

| Phase | Scope | Status |
|---|---|---|
| **1. Spec** | This document | ✅ done 2026-05-09 |
| **2. Backend skeleton** | Flask app, SQLite ledger, 24-language registry, supplier interface, all 4 suppliers stubbed, `/api/voice/status` honestly returning `available:false` until real synthesis happens | ✅ in this commit |
| **3. Mock Bhashini supplier** | `mock_bhashini.py` returns `client_directive: speech_synthesis` so client uses browser TTS. Records to ledger with `supplier=mock_bhashini`. Hindi flips `available:true` after first successful call. | ✅ in this commit |
| **4. 24 HTML pages** | Generated from one template + i18n bundle | ✅ in this commit |
| **5. Status dashboard** | `chitti_voice_factory.html` rendering full ledger | ✅ in this commit |
| **6. Real Bhashini** | Wire `bhashini.py` ULCA client. Set `VOICE_FACTORY_USE_MOCK_BHASHINI=0`. | ⏳ awaiting NLTM creds |
| **7. AI4Bharat** | IndicTTS + IndicParler-TTS wrapper for Tier B | next |
| **8. Sarvam (paid)** | Last-resort fallback, rate-limited 100 chars/req | next |
| **9. Donor flow** | `/api/voice/donate` + Supabase audio storage | next |
| **10. On-device** | Quantised IndicTTS via `onnxruntime-web`, IndexedDB cache | next |

---

## 11. Non-negotiables

1. **No fake data.** A language is `available:true` only after a real (or honestly-labelled mock) synthesis row exists. The mock supplier is named `mock_bhashini` everywhere — never silently labelled `bhashini`.
2. **No scraping.** Doordarshan / AIR / YouTube are forbidden corpora.
3. **No closed-source costs hidden.** Sarvam is logged + rate-limited + only used after free suppliers fail.
4. **Volunteer-only donors for v1.** Compensation revisited at 100 donors.
5. **Donor revocation in 30 days.** `DELETE /api/voice/donate/<id>` removes the voice from rotation in 24 h, retrains within 30 days.
6. **Tier C never silently falls back.** Tulu / Kodava users see the donor banner, not a Kannada voice with their text.
7. **The four-user contract holds.** No exceptions.
8. **Every audio response carries a disclaimer naming the supplier.** Spoken first, written second.

---

## 12. File layout (after Phase 2-5)

```
sahayai/
├── CHITTI_VOICE_FACTORY_MASTER_SPEC.md             ← this file
├── chitti_voice_factory.html                       ← public status dashboard
├── chitti_<lang>.html × 24                         ← Phase 4 front doors
├── chitti-voice-factory/
│   ├── README.md
│   ├── render.yaml
│   ├── tools/
│   │   └── generate_lang_pages.py                  ← Phase 4 generator
│   └── backend/
│       ├── main.py                                 ← Flask app
│       ├── requirements.txt
│       ├── runtime.txt
│       ├── languages.py                            ← 24-language registry
│       ├── ledger.py                               ← SQLite synthesis_log
│       ├── router.py                               ← supplier cascade
│       ├── routes/
│       │   ├── __init__.py
│       │   └── voice.py
│       └── suppliers/
│           ├── __init__.py
│           ├── base.py
│           ├── on_device.py
│           ├── bhashini.py                         ← real (skipped if no creds)
│           ├── mock_bhashini.py                    ← active until creds
│           ├── ai4bharat.py                        ← stub for Phase 7
│           └── sarvam.py                           ← stub for Phase 8
```