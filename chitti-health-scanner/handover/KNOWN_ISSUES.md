**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# 📋 Known Issues — Chitti Health Scanner (Guardian Memory)

**As of:** 2026-06-05. Honest list. **Critical = 0, High (open) = 0.** Everything below is Medium/Low, tech-debt, or by-design, each with a workaround. Nothing here blocks the local-first Guardian Memory release.

---

| ID | Issue | Severity | When it happens | Workaround | Fix plan |
|---|---|---|---|---|---|
| **KI-01** | **`chitti_lang.js` is large** — 16 MB raw, **3.3 MB gzip / 2.0 MB brotli** (the i18n dictionary: 6,396 strings × 26 languages) | 🟠 Medium **tech-debt** (platform-wide, not page-specific) | First visit on a slow connection (the script is `defer`, so it gates DOMContentLoaded until downloaded) | On Wi-Fi/4G it's ~1 s. **Correction:** the earlier "30 s on 3G" came from a local test served **uncompressed (16 MB)**; production (GitHub Pages) serves **brotli ~2 MB / gzip ~3.3 MB**, so the real 3G transfer is far smaller (est. ~10 s on Fast-3G, more on slow-3G) | Split the dictionary per-language / lazy-load the active language only (~250 KB instead of 2 MB). Biggest single perf + scalability win; affects every Chitti page. Requires a 38-page regression pass → dedicated platform task, not a single-page change. |
| **KI-02** | Scan photos are stored **unencrypted** in `localStorage` (local-first) | 🟠 Medium | Photos saved to on-device memory but not pushed to Health File | Data **never leaves the device**; "Chitti forget" wipes it; save to **Chitti Health File** for AES-256-GCM encryption | Encrypt on-device, or make the Health File vault the canonical store (write-back). |
| **KI-03** | Shared substrate (`chitti_lang.js`/`chitti_a11y.js`/widget) is not fully `localStorage`-guarded | 🟡 Medium | Safari private mode / storage disabled — a **substrate** script logs a console error (the **page itself no longer throws** — fixed) | Page renders + degrades gracefully | Wrap substrate storage access platform-wide. |
| **KI-04** | **76 sub-44 px tap targets** flagged by the manual a11y check | 🟢 Low | Mostly the **shared `feedback-widget.js`** icon buttons (🔊/🤖/👍/👎) | The page's own controls (scan, nav, confirm, family) all meet ≥ 48 px | Bump the shared widget's icon-button hit area (platform component). |
| **KI-05** | Long "golden line" Hindi-falls-back for non-Hindi primaries (ta/te/ml/etc.) | 🟢 Low | Switching to a non-Hindi primary shows that **one** long sentence in Hindi | Honest per the Voice-Strategy lock; chrome/labels/buttons are fully in-language (97–98% coverage) | Author the golden line in the remaining 8 primary languages (native QA). |
| **KI-06** | `chitti_2wheeler` / `chitti_4wheeler` cert **16/18** (G4 `Chitti.lang.current()` null) | 🟠 Medium — **OUT OF SCOPE** (different product) | On those two pages only | n/a for Health Scanner — **pre-existing and unrelated** (Health Scanner loads the same `chitti_lang.js` and passes G4 18/18) | Owning team to fix lang-init/load-order on the 2-/4-wheeler pages. |
| **KI-07** | **AI pattern detection** (skin/eye/tooth/…) is **not built** | 🔵 By design | Any scan — `/analyze` returns `501 coming_soon` | Guardian Memory delivers value (remember/compare/connect/escalate) with **no AI claim** | Gated on validated models + diverse-skin-tone dataset + Medical Advisory Board sign-off (`certification/CERTIFICATION.md`). Certification stays **RED** until then. |
| **KI-08** | No `fetch` timeout/retry wrapper for `/api/health-scanner/*` | 🟡 Medium | Not today (local-first; no scanner call is critical) | n/a (no critical network call) | Add **before** AI analysis ships (it will be network-critical). |
| **KI-09** | No multi-device sync of the local health memory | 🟢 Low | User switches devices | Save to Chitti Health File (durable, multi-device) | Health File write-back + sync. |

---

## Specifically requested checks (honest answers)

- **Malayalam / Tamil / Telugu flicker:** **NONE detected.** Sampled a translating element at 0/60/200/300 ms after each switch — value settles once, never flips back to English. Rapid 10× switching in ~1.8 s: no flicker, no errors. (If a specific device shows flicker, capture it and we'll repro — none was reproducible here.)
- **Any other languages with issues:** none functionally; all 9 primary at 97–98% coverage, no Hinglish. Urdu is **not** on this page's dropdown (it's in the 26-language substrate) — by design, documented.
- **Performance bottlenecks:** one — KI-01 (the i18n dictionary: 16 MB raw but **2.0 MB brotli / 3.3 MB gzip** as actually served by GitHub Pages). My initial "30 s on 3G" was measured against an **uncompressed** local server and overstated it; corrected here. Everything else is within target (load ~1 s, switch 103 ms, heap 23 MB).
- **Feature limitations:** AI detection is COMING SOON (KI-07); local-first = single-device until Health File sync (KI-09).

## Not tested in this environment (honest)
- Real **iOS** and **Android** hardware (2 devices each) and the desktop **Safari/Firefox apps** — no device cloud here. Cross-engine was covered via the **WebKit (Safari)** and **Firefox (Gecko)** engines in Playwright (same renderers, not Apple/Mozilla hardware). **Recommend a real-device pass** before public launch.
- **Lighthouse** audit (not installed) — navigation-timing used instead.
- A **human screen-share live demo** — an automated agent cannot screen-share; the screenshots + reproducible scripts (`tools/qa_handover_*.mjs`) are the verifiable proxy.
