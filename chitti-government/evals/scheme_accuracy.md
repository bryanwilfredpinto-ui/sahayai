# EVAL — Scheme accuracy (gate: 99%)

**Claim:** every scheme Chitti surfaces is real, correctly described, and sourced.

## Method
Sample N schemes from [backend/data/schemes_seed.json](../backend/data/schemes_seed.json);
for each verify against its official portal: name, ministry, benefit, eligibility,
documents, `source_url` resolves, `status` correct (`active|closed|verify`),
`last_verified` within cadence.

## Pass = 99%
A single fabricated or wrongly-described scheme is a P0
([guardrails/no_fake_schemes.md](../guardrails/no_fake_schemes.md)), not a 1% miss.

## Known `status: closed` (must be flagged, never promised)
- Mahila Samman Savings Certificate (new deposits ended 31 Mar 2025)
- PM Vaya Vandana Yojana (closed to new entrants 31 Mar 2023)

## Volatile (must carry `verify`)
State flagship amounts (AP/Odisha/Rajasthan reshaped post-election); all state cash
amounts re-confirmed against state portals at ingestion.
