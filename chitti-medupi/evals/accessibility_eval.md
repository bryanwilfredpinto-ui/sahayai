CEOS Level 11 — Evals: Accessibility

Authored 2026-06-06

> The four-user contract (Blind / Deaf / Mute / Illiterate) plus 26 languages
> plus axe-core is not a launch checklist that runs once — it is a re-run-every-
> session gate. This file describes how those evals run and cites the real
> artifacts that hold the current numbers.

Companion docs: [accessibility/blind_user.md](../accessibility/blind_user.md) · [deaf_user.md](../accessibility/deaf_user.md) · [mute_user.md](../accessibility/mute_user.md) · [illiterate_user.md](../accessibility/illiterate_user.md) · SAHAYAI_MASTER §7 · harnesses `tools/medupi_lang26.mjs`, `tools/medupi_a11y.mjs`.

---

## 1. The 26-language eval

**Harness:** `tools/medupi_lang26.mjs` loads `chitti_medupi.html`, switches the language substrate across all 26 registered languages, and for each checks coverage against a **72-string** baseline, console errors, raw untranslated keys, overflow, and `html[lang]`/`dir`.

**Artifact:** `tools/medupi_lang26_result.json` — current measured baseline:

| Result | Value |
|---|---|
| Languages tested | **26** |
| Pass | **26** |
| Fail | **0** |
| Coverage | **99% across 25 languages, 100% for English** |
| Raw untranslated keys | 0 |
| Overflow | none |

(Languages span en, hi, bn … through hoc/हो — the full Voice-Factory registry.) The 99% coverage is the measured number; the ~1% gap is non-blocking residual substrate strings, not raw keys.

---

## 2. The four-user + axe-core eval

**Harness:** `tools/medupi_a11y.mjs` drives `chitti_medupi.html` under **9 disability profiles** and runs axe-core (WCAG 2.1 A/AA) per profile, plus 13 named checks (including "colour not the sole indicator" and the per-box widget).

**Artifact:** `tools/medupi_a11y_result.json` — current measured baseline:

| Profile | axe violations | axe serious/critical | page errors |
|---|---|---|---|
| blind | 0 | 0 | 0 |
| deaf | 0 | 0 | 0 |
| mute | 0 | 0 | 0 |
| isl | 0 | 0 | 0 |
| illiterate | 0 | 0 | 0 |
| elderly | 0 | 0 | 0 |
| limitedMobility | 0 | 0 | 0 |
| cognitive | 0 | 0 | 0 |
| (9th profile) | 0 | 0 | 0 |

Headline: **axe-core = 0 serious/critical violations across all 9 profiles** (and 0 total incl. minor/moderate). Named-check #12 *"colour not the sole indicator"* = PASS (word/symbol labels accompany every status colour); #13 *"axe-core WCAG2A/AA = 0 serious"* = PASS.

---

## 3. How the four users map to MedUPI surfaces

| User | Eval evidence | MedUPI surface |
|---|---|---|
| **Blind** | blind profile axe=0; `speak_en/hi` on every result; auto-speak risk banner | Scan / Compare result cards, savings card |
| **Deaf** | deaf profile axe=0; `caption_en/hi` + symbols ⛔⚠️✅ next to every speak | risk banner, expiry buckets |
| **Mute** | mute profile axe=0; file-input + typed search, no voice required | strip-scan upload, search bar |
| **Illiterate** | illiterate profile axe=0; EN↔HI toggle, pictograms, `purpose_hi` | whole page, savings card |

Per-page detail lives in the four [accessibility/](../accessibility/) files.

---

## 4. Supporting harnesses

| Harness | Artifact | What it adds |
|---|---|---|
| `tools/medupi_baseline.mjs` | `tools/medupi_baseline_result.json` | page-load + 5-gate substrate baseline |
| `tools/medupi_crossplatform.mjs` | `tools/medupi_crossplatform_result.json` | engine/viewport spread |
| `tools/qa_medupi_health.mjs` | `tools/qa_medupi_health_result.json` | language-substrate wiring (`chitti_lang.js` `T` dict vs page i18n) |
| `tools/medupi_axe_detail.mjs` | — | per-violation axe drill-down when a regression appears |

---

## 5. The gate

```
medupi_lang26  →  26/26 pass, coverage ≥ 99%        →  required to ship
medupi_a11y    →  axe serious/critical = 0 (9 profs) →  required to ship
colour-only    →  0 colour-only signals             →  required to ship
per-box widget →  🔊/🤖/👍/👎 on every response box   →  required to ship
```

Per the eight-gates done-definition, no MedUPI page change ships until these are re-run green. Real hardware (iPhone TalkBack / Android TalkBack + BrailleBack) is the one slice left for Sire to sign off — everything above is automated and self-run by the CTO before handover.
