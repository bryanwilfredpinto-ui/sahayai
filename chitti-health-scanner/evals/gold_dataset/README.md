**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Gold Dataset — COMING SOON (placeholder)

> ⚠️ **HONEST STATUS: this dataset does not exist yet.** No samples have been collected,
> labelled, or certified. The numbers in `../EVALS.md` are **research-benchmark TARGETS**,
> not achieved results. Nothing here is "live", "verified", or "GREEN".

Brand palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

## Purpose of this directory

This directory will hold the **expert-labelled gold dataset** used to evaluate Chitti Health
Scanner's vision models — see `../EVALS.md` §11.2 for the full requirements table
(**10,000+ samples** across skin, dental, wounds, moles, eye, nail & hair, pediatric, and
accessibility). Until that dataset is collected, this is a **scaffold only**.

## Hard rules every sample must satisfy (before any sample lands here)

- **Consent (DPDP 2023)** captured and recorded; pediatric samples require **guardian consent**.
- **Anonymised** before any aggregate; **AES-256-GCM encrypted at rest**; user-owned; never sold.
- **"Chitti forget" deletes all** — a sample must be erasable on request.
- **Expert clinical label** required (dermatologist / dentist / clinician / etc.). The
  *accessibility* category carries a **capture-quality** label, not a diagnosis.
- **Fitzpatrick skin-tone metadata (I–VI) is mandatory** on skin / mole / wound / nail samples,
  so Test 7 (Skin Tone Bias) can actually be measured.
- Every public corpus used must be **license-checked** (e.g. ISIC, HAM10000, Fitzpatrick17k,
  PAD-UFES-20, Medetec) and recorded with its source + license here.

## Planned layout (not yet populated)

```
gold_dataset/
  skin/            # dermatologist-confirmed lesions/rashes/infections (target ≥3,000)
  dental/          # dentist-confirmed caries/plaque/gum (target ≥1,500)
  wounds/          # clinician-labelled + time-series healing trend (target ≥1,500)
  moles/           # dermatologist + histopathology, ABCDE/melanoma (target ≥1,500)
  eye/             # ophthalmologist/physician labels (target ≥800)
  nail_hair/       # dermatologist labels (target ≥700)
  pediatric/       # pediatrician labels + guardian consent (target ≥1,000)
  accessibility/   # PWD capture-quality, 9 primary languages (target ≥1,000)
  MANIFEST.csv     # per-sample: id, category, expert label, fitzpatrick, source, license, consent ref
```

## Status

**COMING SOON.** 0 / 10,000+ samples collected. This README is an honest placeholder so the
directory's intent and rules are unambiguous before collection begins.

---

*This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.*
