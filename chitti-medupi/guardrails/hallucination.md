CEOS Level 8 — Guardrails: Hallucination

Authored 2026-06-06

> A fabricated price or an invented medicine in a medicine-cost tool is not a
> cosmetic bug — it sends a family to the wrong counter with the wrong number.
> MedUPI's posture is **"sourced or silent"**: every fact traces to a verified
> source, and where the source is silent the UI says so honestly.

Companion docs: [skills/GUARDRAILS.md](../skills/GUARDRAILS.md) (the eight never-hallucinate fields) · [skills/TRUTH_SOURCES.md](../skills/TRUTH_SOURCES.md) (the verified source list) · [guardrails/safety.md](safety.md) · SAHAYAI_MASTER §3 #4 (honest stubs over fake demos).

---

## 1. The hallucination target

| Metric | Target | Status |
|---|---|---|
| Fabricated-value rate on the 8 never-hallucinate fields | **0** (P0 if breached) | invariant by design — fields are DB-sourced, not LLM-generated |
| Overall response hallucination rate | **< 1%** (labelled target) | not yet measured end-to-end; strict-match leakage already measured at **0/25** ([evals/router_accuracy.md](../evals/router_accuracy.md)) |
| Synthesised "approximately ₹X" prices | **0** | enforced — no percentage-of-MRP math anywhere in code |

The < 1% overall figure is a **target**, not a measured claim. The one machine-verified slice today is cross-molecule leakage = 0 across 25/25 harness samples.

---

## 2. No invented medicines

- The catalogue is the **Apollo Pharmacy CSV** (211,207 rows in `medupi.medicines`) plus BPPI generics + Kaggle enrichment ([skills/TRUTH_SOURCES.md §1, §2, §8](../skills/TRUTH_SOURCES.md)).
- If a medicine is **not in the table**, the strict match returns **empty** and the user is routed to voice/text search or a strip scan — MedUPI never invents a row to fill the gap.
- Vision path: when DeepSeek reads a strip whose brand/salt is not in the DB, the response is `ok:false` with the *extracted* text shown and an honest *"recognised it but it isn't in our seeded DB yet — we'll add it on the next refresh"* (`medupi_recognition.py → recognise_image`). It does **not** fabricate alternatives.

---

## 3. No fabricated prices

The four price-bearing fields are **never computed**:

| Field | Source | Forbidden shortcut |
|---|---|---|
| `mrp` | MRP printed on pack (Apollo CSV) | "If Jan Aushadhi is X then MRP ≈ Y" |
| `jan_aushadhi_price` | Official BPPI product list | "MRP × 0.3" or any percentage of branded MRP |
| `nppa_ceiling_price` | NPPA DPCO 2013 notifications | computed from MRP / extrapolated across molecules |
| live pharmacy snippet | Brave Search snippet (never the URL itself) | inventing a current price when quota is exhausted |

When any is absent, the corresponding line is **omitted** — never rendered as "approximately." Savings are computed only when a real primary price *and* a real cheapest price exist; otherwise `medupi_recognition.py → _savings_summary` returns `savings_percent: null` with `savings_status: "price_data_updating"` so the frontend prints *"Price data updating — savings unknown"* instead of a misleading `0%`.

---

## 4. Composition matched, never inferred

Salt composition is the load-bearing key for the entire product. It is **matched against the master DB**, never guessed from a brand name. There is no "Crocin so the salt is paracetamol" string heuristic in the code path — the lookup is by stored row ([skills/GUARDRAILS.md §5](../skills/GUARDRAILS.md)).

**Vision reconciliation:** when DeepSeek extracts a salt/strength/form from a strip photo, the value is *reconciled against the DB row before it is used for the strict-match query*. If the extracted salt is not in the DB, the user is shown the extracted text and asked to confirm — the pipeline never proceeds to alternatives on an unknown salt.

---

## 5. Honest "unavailable" / "unclear" states

Silent failure is unacceptable — it breaks blind and illiterate users worst (four-user contract). Every uncertain path has an explicit honest state, in EN **and** HI:

| Situation | Honest state |
|---|---|
| No brand match | *"No medicine found matching '{q}'. Try a different spelling, or scan the strip."* |
| No NPPA / Jan Aushadhi / MRP row | line omitted; never "approximately" |
| Recognised but not in DB | `ok:false` + extracted text shown + *"we'll add it on the next refresh"* |
| Brave quota exhausted (HTTP 429) | live-prices panel hidden; *"live prices unavailable today"* |
| Insurance coverage unknown | `{"covered": null, "reason_en": "Coverage not on record", "reason_hi": "बीमा की जानकारी उपलब्ध नहीं है"}` — never inferred from class alone |
| Unknown molecule risk | defaults to LOW **but is logged** so the map expands — never silently "safe" |

Two metadata fields ride along on uncertain values and are honoured by the UI, never fabricated: `confidence` (LLM self-rated `high|medium|low` on vision reads — low gates an amber "type it instead" CTA) and `freshness` (Brave snippets older than 7 days tagged stale in red with EN/HI caption).

---

## 6. DeepSeek vision returns honest-unavailable until the key is funded

Per the locked DeepSeek-only decision and the current funding state:

- When `DEEPSEEK_API_KEY` is unset (or the balance is exhausted → HTTP 402), `medupi_recognition.py → _vision_extract` returns `{"_error": ...}` and `recognise_image` degrades to a **text-only honest stub**: the scan tile shows *"Image recognition is not configured on this server — please type the medicine name instead"* (EN + HI). It never returns a fabricated medicine.
- The vision call is rail-gated through `hooks.wrap_llm(..., compliance_inject=False)`; a rail block surfaces honestly as `_error: blocked:<rail>:<reason>`.
- Text-path strict matching, Jan Aushadhi lookup, risk classification, wallet, and reminders all work **without** the vision key — so the honest-unavailable scan path never blocks the core product.

---

## 7. Done-definition

A response generator is **not done** until:

1. None of the eight never-hallucinate fields can emit a fabricated value (verify against [skills/GUARDRAILS.md](../skills/GUARDRAILS.md)).
2. No price is ever computed as a fraction of another price.
3. Every "no data" path renders an explicit EN+HI honest state, not a blank or a `0`.
4. The vision path degrades to honest-unavailable when the key is missing, never to a fake medicine.
5. `tools/test_medupi_samples.py` still shows `leaks=0` (the one measured hallucination slice).
