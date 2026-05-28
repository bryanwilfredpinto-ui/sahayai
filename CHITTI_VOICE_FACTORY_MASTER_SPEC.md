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
| **Backend** | `chitti-voice-factory/backend/` · Flask · `https://chitti-voice-factory-production.up.railway.app` |
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

Base: `https://chitti-voice-factory-production.up.railway.app`

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

---

## 13. Fluency Pipeline (added 2026-05-12)

> **Fluency ≠ Pronunciation.** Voice Factory ships *two independent* substrates:
>
> | Substrate | What it owns | Owner module |
> |---|---|---|
> | **Pronunciation** | How a sentence sounds (Bhashini cascade, donor voices, on-device TTS) | `services/voice_factory.py` + `suppliers/*` |
> | **Fluency** | Grammar, vocabulary, sentence patterns in each language | `services/fluency_*` + `data/fluency/<lang>/` |
>
> A Chitti language page draws on both. The pipelines run independently — Bhashini ULCA registration does **not** block fluency ingestion.

### 13.1 Sources (in order of preference) — **textbook_source field**

Every chunk carries a `textbook_source` field with one of three values:

| Value | Meaning | Where it comes from |
|---|---|---|
| `curriculum` | Real curriculum content from a textbook | NCERT direct PDFs OR archive.org mirrors of state-board books |
| `community` | Real in-language text from open community sources | Wikipedia REST API (60 curated topics, native titles via langlinks) |
| `cousin` | Borrowed chunk from a related language | Cousin mapping (hne/doi/kru→hi, brx→as, kfa→kn) |

**No chunk is faked**. Every entry has a real `source` URL on disk.

#### Discovery scripts
- `scripts/discover_ncert_urls.py` — HEAD-checks ~1,380 NCERT URL candidates per known suffix pattern. Records survivors to `data/ncert_urls_discovered.json`.
- `scripts/discover_archive_org.py` — searches archive.org for state-board / NCERT-translation mirrors across 10 regional languages. Records to `data/archive_urls_discovered.json`.
- `scripts/merge_discovered.py` — merges both into `data/discovered_textbook_urls.json`. `services/textbook_sources.py` reads this at import time (utf-8-sig to handle PowerShell-written BOMs).

#### Ingester channels
1. **NCERT direct** (`fluency_ingester.fetch_ncert_pdfs`) — uses Python `requests`, capped at 30 PDFs/lang, 15s timeout.
2. **archive.org mirrors** (`fluency_ingester.fetch_archive_pdfs`) — capped at 10 PDFs/lang, 25s timeout, 2s polite delay between successful downloads. Archive.org has flaky CDN servers; we accept the failures and move on (logged in `honest_status.errors`).
3. **Wikipedia REST API** (`fluency_ingester.fetch_wikipedia`) — native title resolution via `services/wiki_langlinks.py`. The English title is a fallback when no native title is cached.
4. **Cousin mapping** (`fluency_ingester.copy_from_cousin`) — only fires when channels 1-3 produced zero chunks (Tier C languages without their own Wikipedia).

### 13.2 Pipeline stages

```
download → extract → chunk → embed → FAISS index → honest_status.json
  ↑           ↑         ↑       ↑          ↑              ↑
  HTTP +     PyMuPDF   400-600 paraph-MM   IndexFlatIP   per-language ledger
  Wikipedia  (fitz)    char     L12-v2     (numpy        chunks/sources/
  REST                 sliding  CPU        cosine        errors/ready
                       window              fallback)
```

Embeddings use `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` — one model covers 50+ languages including every Chitti language. FAISS is preferred; when `faiss-cpu` is missing we fall back to numpy cosine over `embeddings.npy`.

### 13.3 Layout

```
chitti-voice-factory/backend/
├── services/
│   ├── fluency_corpus.py      ← per-language store + search; degrades when ST/faiss missing
│   ├── fluency_ingester.py    ← NCERT + Wikipedia + cousin channels
│   ├── textbook_sources.py    ← 26-language source registry, WIKI_TOPICS, NCERT_URLS
│   └── wiki_langlinks.py      ← English-title → native-title resolver (cached)
├── routes/
│   └── fluency.py             ← /api/voice/fluency/{status,status/<lang>,search/<lang>,chunks/<lang>}
├── scripts/
│   ├── build_langlinks.py     ← one-shot: warm langlinks cache for 60 topics
│   ├── ingest_textbooks.py    ← orchestrator, parallel workers, two waves (Wikipedia then cousin)
│   ├── embed_all.py           ← embed + FAISS pass after deps install on target host
│   └── report_summary.py      ← per-language ingestion summary
└── data/fluency/
    ├── _report.json
    ├── wiki_langlinks_cache.json   (60 topics × ~150 langs each)
    └── <lang>/
        ├── _pdfs/                  raw downloaded PDFs (NCERT)
        ├── chunks.jsonl            real text chunks with provenance
        ├── embeddings.npy          float32 matrix (created on Railway after pip install)
        ├── index.faiss             FAISS IndexFlatIP (created alongside embeddings)
        └── honest_status.json      what worked / what failed / fluency_ready bool
```

### 13.4 Second-run result (2026-05-12, post-discovery) — 79,414 chunks, 55 curriculum PDFs

29.2-minute parallel run, 8 workers, with NCERT + archive.org discovery merged. Per-language breakdown:

| Lang | Chunks | Curriculum PDFs | textbook sources |
|---|---:|---:|---|
| bn  | 6,966 | 0 | Wikipedia |
| ta  | 5,466 | 0 | Wikipedia (Tamil archive.org URLs all 401/403) |
| **hi**  | **5,310** | **22 NCERT** | NCERT + Wikipedia |
| hne | 5,310 | (cousin) | Cousin from hi |
| kru | 5,310 | (cousin) | Cousin from hi |
| doi | 5,310 | (cousin) | Cousin from hi |
| **kn**  | **5,203** | **2 archive.org** | archive.org + Wikipedia |
| kfa | 5,203 | (cousin) | Cousin from kn |
| **ml**  | **3,830** | **2 archive.org** | archive.org + Wikipedia |
| **mr**  | **3,678** | **3 archive.org** | archive.org + Wikipedia |
| **te**  | **3,562** | **1 archive.org** | archive.org + Wikipedia |
| **ur**  | **3,386** | **8 NCERT** | NCERT + Wikipedia |
| gu  | 3,287 | 0 | Wikipedia |
| sd  | 2,528 | 0 | Wikipedia |
| as  | 2,506 | 0 | Wikipedia |
| brx | 2,506 | (cousin) | Cousin from as |
| **pa**  | **2,286** | **2 archive.org** | archive.org + Wikipedia |
| **sa**  | **1,972** | **25 NCERT** | NCERT (Ruchira Class 7/8/10) + Wikipedia |
| or  | 1,893 | 0 | Wikipedia |
| bho | 1,510 | 0 | Wikipedia |
| sat |   735 | 0 | Wikipedia |
| kok |   537 | 0 | Wikipedia |
| tcy |   406 | 0 | Wikipedia |
| mai |   315 | 0 | Wikipedia |
| ks  |   253 | 0 | Wikipedia |
| mni |   146 | 0 | Wikipedia |

**TOTAL: 79,414 real chunks across all 26 languages. 55 curriculum PDFs ingested. 0 languages failed.**

| `textbook_source` distribution | Lang count |
|---|---:|
| `curriculum` (NCERT/state-board)  | 8 languages: hi, ur, sa, kn, ml, mr, te, pa |
| `community` (Wikipedia)           | 13 languages: bn, ta, gu, or, as, sd, bho, mai, kok, ks, mni, sat, tcy |
| `cousin` (borrowed from related)  | 5 languages: hne, doi, kru, brx, kfa |

`fluency_ready` is `false` for all 26 until the embedding pass runs (deferred to Railway py3.11 because local py3.14 lacks stable torch wheels). Run `python -m scripts.embed_all` on the deploy host to lift to ready.

#### Known gaps

- **Tier A languages with Wikipedia-only corpus** (bn, ta, gu, or, as): their archive.org searches found mostly unrelated items (CIA reading room, legislative proceedings) or items requiring auth (BDRC). Pursuing state-board direct partnerships (WBBSE, TN Board, GSEB, BSE Odisha, SEBA) is the next step.
- **NCERT Urdu**: pattern guessing found 22 URLs (jujp/judp = Class 10 Jaan Pahechan / Door Pas) but earlier classes use different codes. NCERT publishes ~50 Urdu books; we currently capture ~16%.
- **Archive.org reliability**: ~70% of discovered archive.org PDFs failed mid-download (CDN servers ia601400, dn710101 frequently timing out from this network). A retry pass from a different network may recover many of these.

### 13.5 API surface (added)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/voice/fluency/status` | All 26 languages' honest fluency status |
| GET | `/api/voice/fluency/status/<lang>` | One language: chunks, sources, fluency_ready, source plan |
| GET | `/api/voice/fluency/search/<lang>?q=...&k=5` | Top-k similarity search over the language's chunks |
| GET | `/api/voice/fluency/chunks/<lang>?offset=&limit=` | Paginated chunk inspection |
| GET | `/api/voice/fluency/<lang>/videos` | List user-added YouTube videos for this language |
| POST | `/api/voice/fluency/<lang>/videos` | Queue a YouTube URL (rate-limited to 10/lang) |
| DELETE | `/api/voice/fluency/<lang>/videos/<video_id>` | Remove a queued/processed video record |
| POST | `/api/voice/fluency/<lang>/videos/process?embed=1` | Fetch transcripts, append chunks to corpus, optionally re-embed |

### 13.6 YouTube video learning (added 2026-05-12)

Each language page exposes a **"📺 Teach Chitti with YouTube Videos"** section that lets any user feed a YouTube URL into the corpus.

- Storage: `data/fluency/<lang>/videos.json` (auditable; per-language)
- Rate limit: `MAX_VIDEOS_PER_LANG = 10` (in `services/youtube_learner.py`)
- Transcript fetch (`youtube-transcript-api`): prefers a human-authored transcript in the target language, falls back to auto-generated, finally falls back to *translated*. The video record stores `auto_generated` so the UI can flag lower-quality contributions.
- Chunks land with `textbook_source = "community"` and `source = "youtube:<video_id>"`. Audit-trail-equivalent to Wikipedia chunks.
- Embedding rebuild is opt-in (`?embed=1` on `/process`) since it is the slow step. Without `embed=1` the chunks are queryable via the keyword fallback search; FAISS index updates on the next embed pass.
- HTML injection: `scripts/inject_youtube_ui.py` adds the section to all 26 `chitti_<lang>.html` pages idempotently (`data-chitti-section="youtube"` marker prevents double-injection).

#### Error codes returned by `/videos` endpoints

| Code | Meaning |
|---|---|
| `invalid_youtube_url` | URL didn't match any of the 5 known YouTube URL shapes |
| `duplicate` | Video already in queue for this language |
| `rate_limit_exceeded` | 10-videos-per-language cap reached |
| `video_unavailable` | YouTube returned video-unavailable |
| `transcripts_disabled` | The video has captions disabled |
| `no_transcript_for_language` | No transcript available; couldn't translate |
| `transcript_too_short` | Fetched transcript under `MIN_TRANSCRIPT_CHARS` (200) |
| `library_not_installed` | `youtube-transcript-api` missing on the host |

### 13.7 Honesty contract (additions to §11)

9. **No stub PDFs, no fake text.** Every chunk has a real `source` (NCERT URL, Wikipedia page, `cousin:<lang>:<orig-source>`, or `youtube:<video_id>`). The previous `ingest/ingest_master.py` that wrote `"STUB: Hindi Class 1 textbook"` into placeholder PDFs is **deprecated** — the production pipeline lives under `chitti-voice-factory/backend/scripts/`.
10. **`fluency_ready` requires embeddings on disk.** A language flips to `true` only when `chunks ≥ 50` AND `embeddings.npy` exists. Cousin-mapped languages can be ready but the UI must surface the cousin banner.
11. **404 = recorded.** NCERT URL changes, Wikipedia coverage gaps, and YouTube errors are logged to `honest_status.errors` / `videos.json[].error`. We do not invent content for missing sources.
12. **Auto-generated YouTube transcripts are flagged**, not silently mixed with human-authored ones (`video.auto_generated = true`). The UI surfaces this badge.