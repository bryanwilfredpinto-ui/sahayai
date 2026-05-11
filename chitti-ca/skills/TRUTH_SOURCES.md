# Chitti CA — TRUTH_SOURCES

Chitti CA has **no live integration** with any government portal today. It is a stateless DeepSeek wrapper. The truth chain runs through the model's training data plus manual human cross-referencing during prompt updates.

## 1. DeepSeek (`deepseek-chat`) — primary

The only live source. Called via `https://api.deepseek.com/chat/completions` from [../backend/services/ca_service.py](../backend/services/ca_service.py). All language understanding, section number recall, slab-rate recall, and plain-English explanations come from the model.

Failure modes (HTTP error, network error, missing key, empty reply) all route through `_fallback()` which still appends the server-enforced disclaimer. See [../ARCHITECTURE.md](../ARCHITECTURE.md).

## 2. Income Tax India website — manual cross-reference

`https://www.incometax.gov.in/` is the canonical source for current slab rates, due dates, ITR forms, and notification text. **Chitti does not call this site.** Prompt updates are validated against it by hand. When Chitti tells a user "verify on the income-tax portal," this is the portal it means.

## 3. GST Network (GSTN) portal — manual cross-reference

`https://www.gst.gov.in/` is the canonical source for GST registration thresholds, return frequencies, and rate notifications. Same posture: not called from code, used for manual prompt validation.

## 4. CBDT / CBIC notifications — user-pasted

When a user pastes a notification or circular, Chitti reads the text the user supplied. It does not fetch the notification from the CBDT / CBIC website. The model's job is to translate the language, not to verify authenticity.

## 5. The model training cutoff is the weakest link

Every annual budget shifts numbers. Until a live portal lookup is wired in (no ETA — DigiLocker partner agreement blocks AIS / 26AS access; see [../TODO.md](../TODO.md)), all numerical answers carry the prompt-enforced caveat "verify on the income-tax portal for the current year." This is acknowledged in [DEVILS_ADVOCATE.md](DEVILS_ADVOCATE.md) item 1.

## What is **not** a source

- No `26AS` pull. No `AIS` / `TIS` pull. (DigiLocker partner agreement blocked.)
- No book-of-accounts ingestion. No bank-statement parser.
- No previous-turn memory. Every ask is independent.
- No DB. The service holds zero state. See [../DATABASE.md](../DATABASE.md).
