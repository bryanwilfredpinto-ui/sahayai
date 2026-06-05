**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# 🏛️ Solution Architect Review — Chitti Health Scanner (Guardian Memory)

**Reviewer role:** Solution Architect (performed by Chitti CTO / Claude) · **Date:** 2026-06-05
**Scope:** `chitti_health_scanner.html` + `/api/health-scanner/*` (on `chitti-medupi-api`) + shared substrate.
**Verdict:** Architecture is sound for a **local-first, honest-stub** release. No blocking architectural risk for the Guardian Memory scope. AI-detection track remains gated by design.

---

## B1. System architecture & data flows

```
                         ┌──────────────────────────────────────────────┐
                         │  USER (Blind / Deaf / Mute / Illiterate-safe) │
                         │  voice · tap · camera · upload                │
                         └───────────────┬──────────────────────────────┘
                                         │
        ┌────────────────────────────────▼─────────────────────────────────┐
        │  FRONTEND — chitti_health_scanner.html (GitHub Pages, static)      │
        │  • Capture (getUserMedia) / Upload (FileReader) → dataURL          │
        │  • Golden-Rule confirm gate (camera / save / caregiver)            │
        │  • LOCAL-FIRST store: localStorage                                 │
        │      chitti_hs_timeline_v1 (profile → body-area → [photos])        │
        │      chitti_hs_profiles_v1 · chitti_hs_profile_v1 · _caregiver_v1  │
        │  • Substrate: chitti_lang.js (i18n) · chitti_a11y.js · feedback-   │
        │    widget.js · chitti_isl.js · chitti_observability.js             │
        └───────┬───────────────────────────────┬──────────────────────────┘
                │ (only if user taps "Save to Health File" / "Notify")       │
   ┌────────────▼───────────────┐   ┌────────────▼────────────┐   ┌──────────▼─────────┐
   │ Chitti Health File          │   │ Chitti MedUPI (deep-link)│   │ WhatsApp (wa.me)   │
   │ /api/health-file/docs       │   │ medicine strip → price   │   │ caregiver alert    │
   │ AES-256-GCM @ rest (Turso)  │   │                          │   │ (user-sent)        │
   └────────────┬───────────────┘   └──────────────────────────┘   └────────────────────┘
                │
   ┌────────────▼───────────────────────────────────────────────┐
   │ BACKEND — chitti-medupi-api (Flask, Railway)                │
   │ /api/health-scanner/  health(200) · scan-types(200)         │
   │   analyze(501 coming_soon) · save-to-timeline(200/501)      │
   │   timeline(local_first) · compare(501)                      │
   │ Turso libSQL via direct-HTTPS shim · DeepSeek (NOT yet used)│
   └─────────────────────────────────────────────────────────────┘
```

**Primary data flow (today):** `camera/upload → dataURL → localStorage (on device)`. **No health image
leaves the device** unless the user explicitly saves it to Chitti Health File (encrypted) or sends a
WhatsApp alert (text only, no image). The scanner does **no** AI inference yet — `/analyze` is a
deliberate `501 coming_soon`.

## B2. Scalability

| Load | Frontend (static) | Backend (`/api/health-scanner/*`) | First to break |
|---|---|---|---|
| 1,000 concurrent | ✅ trivial (GitHub Pages CDN) | ✅ cheap (stubs, no DB writes) | nothing |
| 100,000 concurrent | ✅ CDN scales | ⚠️ Railway free-tier dyno + Turso connection cap | **(a) the 16 MB `chitti_lang.js` download (bandwidth)**, then **(b) Railway dyno** when AI ships and each scan calls DeepSeek |
| When AI ships | n/a | 🔴 DeepSeek inference rate-limit + cost is the real ceiling | DeepSeek throughput |

**Recommendations:** (1) **split / lazy-load** the 16 MB i18n dictionary (active language only) — biggest single win; (2) long-cache + CDN the static substrate; (3) when AI lands, run inference behind a **queue** (not request-synchronous) with backpressure; (4) keep analysis idempotent + cacheable by image hash.

## B3. Security

| Check | Finding |
|---|---|
| PII stored without consent? | **No.** Health photos are local-first; nothing is transmitted without an explicit user action (Save-to-Health-File or Notify). Caregiver number is entered + saved by the user. |
| localStorage encryption? | **No — plaintext on device.** Key residual risk: scan photos sit unencrypted in `localStorage`. Mitigation today: data never leaves the device; "Chitti forget" wipes it. **Should-fix:** encrypt at rest or make the Health File AES-256-GCM vault the canonical store. |
| Backend auth required? | **No** on the scanner stubs — and they return **no PII** (only `coming_soon`/pointers), so nothing is exposed. Auth becomes required when `/save-to-timeline` writes real bytes (it currently points to the authenticated Health File endpoint). |
| API keys in frontend? | **None.** Verified — the page ships no API key; the DeepSeek key is backend-only. |
| XSS | Caregiver **name** is rendered via `escapeHtml()` into a profile `<option>`; the WhatsApp message is `encodeURIComponent`-ed; image `dataURL` is set as `img.src` (not `innerHTML`). No raw user HTML is injected. **Low risk.** |
| CSRF | N/A for the local-first flows (no cookies/credentials). When write-back lands, the Health File endpoint owns CSRF for the authenticated POST. |

## B4. Data integrity

- **Corruption:** all reads go through `lsGet()` with `try/catch + JSON.parse` → a corrupted entry degrades to default, never crashes.
- **Data-loss scenarios:** clearing the browser/device, "Chitti forget", or a different device → local memory is gone. **Mitigation = save to Chitti Health File** (durable, encrypted, multi-device). Documented in-page.
- **Backup/restore:** none locally by design; Health File is the backup path.
- **Multi-device sync / conflicts:** **none yet** — local-first per device. Documented as a Known Issue; sync arrives with the Health File write-back.

## B5. Integration points & failure behaviour

| Integration | Used for | Failure behaviour | Timeout / retry |
|---|---|---|---|
| GitHub Pages | static hosting | CDN; outage → Cloudflare mirror (P2, platform) | n/a |
| Railway (`chitti-medupi-api`) | scanner stub endpoints | scanner is local-first → **page fully works if API is down** | self-ping keep-alive; no per-call retry needed (no critical call) |
| Turso libSQL | (only when saving to Health File) | Health File path handles; scanner unaffected | direct-HTTPS shim, keepalive |
| DeepSeek | **not used yet** (analysis gated) | n/a today; Layer-5 DeepSeek→Claude→Gemini chain applies when it lands | to be set when AI ships |
| WhatsApp `wa.me` | caregiver alert (user-sent) | opens user's WhatsApp; if absent, browser shows wa.me page | n/a (user-driven) |
| Bhashini / Voice Factory | voice-out (read-aloud) | falls back to Web Speech API `speechSynthesis` | graceful |
| axe-core CDN | **test-only** (a11y scan) | test degrades to manual checklist | n/a (not in product) |

**Honest gap:** no explicit `fetch` timeout/retry wrapper for the scanner stubs — acceptable today because **no scanner call is on the critical path** (local-first). MUST be added before AI analysis ships (network-critical).

## B6. Code quality

| Check | Status |
|---|---|
| Syntax/lint | `node --check` clean on all touched JS; backend `py_compile` clean. No repo-wide linter gate enforced (see tech debt). |
| `console.log` in prod | None added; one defensive `console.warn` in the a11y-init fallback (acceptable). |
| Error handling | `try/catch` around storage, camera (`getUserMedia`), `FileReader`, speech; guarded `lsGet/lsSet/lsGetRaw/lsSetRaw`. |
| Naming | Meaningful (`PENDING_SCAN`, `currentProfile`, `confirmNotifyCaregiver`, `daysBetween`). |
| Comments | Present at each subsystem + every safety/Golden-Rule decision. |

## B7. Deployment architecture

- **Frontend:** GitHub Pages serves repo root; deploy = `git push` to `main`.
- **Backend:** Railway (`chitti-medupi-api`); deploy via `./deploy_to_railway.sh` (one-command, CLI 4.59).
- **Env vars:** Railway dashboard (DeepSeek/Turso keys, SMTP) — never in frontend.
- **Rollback:** `git revert <sha>` + redeploy (frontend auto on push; backend re-run deploy script). Every backend has a `render.yaml`/`railway.json` → reconstitutable from `main`.
- **CI/CD:** self-ping uptime + `tools/cert_*.mjs` cert gates run on demand; **no automated pre-merge CI gate yet** (tech debt).

## B8. Technical-debt log

| Item | Priority | Effort | Note |
|---|---|---|---|
| **16 MB `chitti_lang.js`** loaded whole → slow full-load on 3G | 🔴 Must-fix (platform-wide) | M–L | Split per-language / lazy-load active lang. Biggest perf + scalability win. |
| **localStorage photos unencrypted** at rest | 🟠 Should-fix | M | Encrypt on device or make Health File vault canonical. |
| Shared substrate not fully storage-guarded (errors under Safari private mode) | 🟠 Should-fix | S | Wrap substrate `localStorage` access (page itself is now guarded). |
| No `fetch` timeout/retry wrapper for API | 🟠 Should-fix **before AI ships** | S | Not critical today (local-first); critical when `/analyze` is network-bound. |
| No automated pre-merge CI / lint gate | 🟠 Should-fix | M | Cert scripts exist but run manually. |
| AI detection (L1/L6) gated | 🔵 By design | XL | Needs validated models + diverse-skin dataset + Medical Advisory Board. |
| No multi-device sync | 🟢 Nice-to-fix | M | Arrives with Health File write-back. |

---

## Risk assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| User over-trusts a future AI result | low (gated) | **high** | Constitution + guardrails enforce "never diagnose"; AI stays `COMING SOON`; Medical Board gate before any number ships. |
| Slow load on 2G/3G | medium | medium | Page interactive at DOMContentLoaded (~1 s); fix = split the 16 MB dict. |
| Local data loss (device wipe) | medium | low–medium | Save-to-Health-File is the durable path; documented to user. |
| Storage-blocked browser (Safari private) | low | low | Page now guarded → renders + degrades; substrate guard is tech-debt. |

**Architect sign-off conditional on:** the 16 MB i18n split + a `fetch` timeout/retry wrapper landing **before** the AI-analysis track is switched on. For the **Guardian Memory (local-first) scope shipping now, the architecture is approved.**
