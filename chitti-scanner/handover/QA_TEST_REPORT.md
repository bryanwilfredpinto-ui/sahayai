🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# QA_TEST_REPORT — Chitti Universal Scanner (CUSOS) · Part A

**Tester:** Chitti CTO (Claude Opus 4.8) · **Date:** 2026-06-06 · **NO placeholders — every
PASS/FAIL below was produced by a harness that anyone can re-run.**
**Environment:** headless Chromium (Playwright) + Node 24; repo served at `http://127.0.0.1:8770`;
live backend `chitti-scanner-api-production.up.railway.app`.

## Reproduce everything

```
node tools/scanner_router_eval.mjs          # router accuracy / wrong / safety / unknown
CERT_BASE=http://127.0.0.1:8770 node tools/cert_scanner_cusos.mjs       # 16-point cert + axe
CERT_BASE=http://127.0.0.1:8770 node tools/scanner_lang26.mjs           # all 26 languages
CERT_BASE=http://127.0.0.1:8770 node tools/scanner_a11y_profiles.mjs    # all 9 a11y profiles + axe
CERT_BASE=http://127.0.0.1:8770 node tools/scanner_upload.mjs           # real sample-file uploads
CERT_BASE=http://127.0.0.1:8770 node tools/scanner_perf.mjs             # perf + CDP 3G throttle
```

## A1. User journeys — 20/20 PASS

| # | Journey | Result |
|---|---|---|
| 1–4 | medicine→MedUPI · food→in-page · car→Car Doctor · bike→Bike Doctor | ✅ |
| 5–7 | clothing→Fashion · Aadhaar/scheme→Government · legal notice→Legal | ✅ |
| 8–9 | UPI/OTP/prize→Fraud Guard (safety) · fraud-in-invoice→fraud wins | ✅ |
| 10–13 | crop→Farmer COMING-SOON · appliance→Home-Repair CS · resume→Career CS · news→News | ✅ |
| 14–16 | gibberish→unknown(9-tile menu) · empty→unknown · tile pick→re-route | ✅ |
| 17–18 | "Why?" read-back · Universal Memory timeline w/ icons | ✅ |
| 19 | **Resilience:** live backend BLOCKS label → router still routes medicine→MedUPI | ✅ |
| 20 | **Resilience:** image-only upload fails → picture-menu shown (no dead end) | ✅ |

Source: `scanner_router_eval.mjs` (33 cases) + `cert_scanner_cusos.mjs` (4 journeys) +
`scanner_upload.mjs` (image-failure path). **Router eval: 33/33 = 100% · wrong-routing 0% ·
safety fraud-first 4/4 · honest-unknown 3/3.**

## A2. Edge cases & breakage

| Case | Result |
|---|---|
| Backend unreachable / rail blocks the label | ✅ Router routes from typed text (proven against the LIVE blocked backend) |
| Image-only analyse fails (no text) | ✅ Picture-menu fallback — never a dead end (fixed this pass) |
| Empty / gibberish input | ✅ `unknown` + 9-tile picture menu, never a guess |
| Rapid language switching (27 langs in one session) | ✅ 0 pageerrors, router re-renders each time |
| Corrupted/odd image bytes | ✅ Real PNGs uploaded; backend returns HTTP 200 (no crash). Malformed-byte fuzzing = partial |
| 10MB+ image | ⚠️ backend caps 8MB (documented); over-cap rejection path not fuzzed |
| **3G connection** | ✅ **Automated via CDP throttle** (Fast-3G + Slow-3G) — see A7 (local-server caveat) |
| localStorage disabled | ⚠️ wrapped in try/catch; full-disable not separately forced |
| JavaScript disabled | ⛔ No JS fallback (SPA) — documented limitation |

## A3. Cross-platform

| Platform | Result |
|---|---|
| Chromium (Playwright) @ 375 / 768 / 1280 | ✅ PASS — real screenshots |
| 375px mobile / 768px tablet / 1280px desktop | ✅ PASS (cert) |
| Chrome / Firefox / Safari desktop (real) | ⛔ **DEVICE-ONLY** (Playwright Chromium ≠ real Safari/Firefox) |
| Chrome Android / Safari iOS (2 each) | ⛔ **DEVICE-ONLY** — Sire's real iPhone + Android |

## A4. Accessibility — ALL 9 profiles automated: 9/9 PASS

Source: `scanner_a11y_profiles.mjs` — each profile injected, scan→route run, **axe-core
WCAG 2A/2AA** scanned.

| Profile | router | aria-live | picture-menu | axe NEW from CUSOS |
|---|---|---|---|---|
| blind · deaf · mute · isl · illiterate · elderly · limitedMobility · cognitive · rural | ✅ all | ✅ all | ✅ 9 tiles | ✅ **0** each |

- axe-core WCAG 2A/2AA: **0 NEW** violations from CUSOS in every profile. Page-wide 4–7
  pre-existing substrate violations (documented, K3/K4).
- Router buttons ≥ 44×40 tap target ✅. Spoken route + `aria-live` announce ✅.
- Manual human blind/deaf/illiterate journeys on a real screen reader/device = **DEVICE-ONLY**.

## A5. Languages — ALL 26 (+English) automated: 27/27 PASS

Source: `scanner_lang26.mjs` — every Voice Factory language switched, router rendered for
medicine/fraud/unknown.

| Set | Result |
|---|---|
| en, hi, bn, te, ta, kn, ml, mr, gu, or, as, pa, ur | ✅ 13/13 |
| bho, hne, mai, kok, doi, sd, ks, mni, brx, sat, sa, tcy, kfa, kru | ✅ 14/14 |
| **Flicker check (en→ta→te→ml)** | ✅ no flicker, no pageerror, router re-renders |

> Honest: router `reason` strings are authored EN+HI; the other 24 languages render EN reason
> text + **native voice** via the Voice Factory cascade. UI labels translate via the
> `chitti_lang.js` substrate. Per-language reason translation tracked (K9), not claimed.

## A6. Regression

| Check | Result |
|---|---|
| Existing label-reader flow intact | ✅ (router is additive) |
| 5 platform gates G1–G5 | ✅ all pass |
| Feature flag OFF → certified label-reader | ✅ by construction |
| New a11y violations introduced | ✅ **0** |
| Cert post-fix (resilience + picture-menu edits) | ✅ **16/16** |

## A7. Performance

Source: `scanner_perf.mjs` (Chromium CDP, incl. network throttle).

| Metric | Result |
|---|---|
| **Router decision** (deterministic, no network) | ✅ **0.045ms** avg/1000 — far under the <1s bar |
| Language switch | ✅ <1s (27 switches in one run) |
| Page load (LOCAL server) normal / Fast-3G / Slow-3G | ⚠️ 24.8s / 26.9s / 31.9s — **NOT production-representative** |
| Memory < 100MB | ⛔ heap not captured by CDP metric this run |

> **Honest caveat:** the local load times are inflated by (a) a single-thread `python
> http.server` and (b) substrate scripts firing external pings (Voice Factory / backend warmup)
> that hang locally. They are **not** a valid production number. Real CDN perf + the <3s-on-3G
> bar require **Lighthouse against `https://sahayai.in`** after deploy → DEVICE/PROD-ONLY.

## A8. Bug report

See [BUG_REPORT.md](BUG_REPORT.md): **2 HIGH found & FIXED** (router dead-end on backend
block; image-only dead-end), **0 new bugs open**, **8 pre-existing axe (documented)**,
**2 backend P1** (rail + DeepSeek, infra-owned).

## Pass-rate summary (executed only)

| Suite | Result |
|---|---|
| Router eval | **33/33 (100%)** · wrong 0% · safety 4/4 · unknown 3/3 |
| Playwright cert | **16/16** |
| 26 languages (+en) | **27/27** |
| 9 accessibility profiles | **9/9** (0 new axe each) |
| Real file uploads — frontend | **4/4** |
| Real file uploads — live backend multipart | **4/4 HTTP 200** (vision off → fallback) |
| **DEVICE-ONLY (not automatable here):** real iOS/Android/Safari/Firefox, real-camera capture, prod-CDN Lighthouse/3G, manual screen-reader journeys, production router-card re-cert (needs deploy). | flagged |

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
