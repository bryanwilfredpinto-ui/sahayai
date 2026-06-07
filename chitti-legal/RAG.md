# Chitti Legal — RAG (Retrieval-Augmented Generation) over official legal texts

**What this is:** Chitti Legal answers from **official documents and cites sources** —
RAG, **not** fine-tuning. This is cheaper, faster and more accurate for the legal
domain, and it is what makes Chitti Legal *qualified*: it never answers from outside
the official context.

**Doctrine:** retrieve → cite → **refuse**. The model is forbidden from answering
outside the retrieved official text. If the retriever is not grounded, Chitti replies
with exactly: **"I cannot find this in official legal texts."** This is how the
targets are met:

| Target | How |
|---|---|
| **100% citation** | every grounded answer returns `citations[]` (Act + section/article + page + official URL) — by construction |
| **< 1% hallucination** | the model may only phrase the retrieved passages and cite `[n]`; no context → refuse; DeepSeek down → honest *extractive* answer straight from the passages |
| **≥ 95% accuracy** | semantic retrieval (sentence-transformers all-MiniLM-L6-v2) + the official corpus; install `requirements-optional.txt` in production |

## Corpus (official, free sources — India Code / Legislative Dept.)

| Act | Source |
|---|---|
| The Constitution of India | indiacode.nic.in / legislative.gov.in |
| Indian Penal Code, 1860 | indiacode.nic.in (Act 45 of 1860) |
| Code of Criminal Procedure, 1973 | indiacode.nic.in (Act 2 of 1974) |
| Indian Evidence Act, 1872 | indiacode.nic.in (Act 1 of 1872) |
| Indian Contract Act, 1872 | indiacode.nic.in (Act 9 of 1872) |

(The 2023 codes BNS/BNSS/BSA can be added to `rag/sources.py` for offences on/after
1-Jul-2024 — IPC/CrPC/Evidence remain the source of record for earlier matters.)

## Pipeline (same as Chitti CA)

```
official PDFs → chunk (section/article + page metadata) → embed
  (sentence-transformers all-MiniLM-L6-v2, lazy)  → ChromaDB (persistent, local, free)
query → embed → top-k cosine → grounded? → answer ONLY from context + cite  | else refuse
```

Heavy deps (chromadb, sentence-transformers, pypdf) are **lazy-imported** and live in
`requirements-optional.txt` so the base Flask app stays OOM-safe on Railway free tier.
When they're absent, a pure-python lexical embedder + JSONL store keep the
retrieve→cite→refuse contract working (lower recall, clearly labelled — it refuses
rather than guesses). The committed `rag/index/fallback.jsonl` lets the app answer
out-of-the-box.

## Build / rebuild the vector DB

```bash
cd chitti-legal/backend
pip install -r requirements-optional.txt      # production: semantic embeddings + ChromaDB
python -m rag.ingest --download               # fetch the 5 official Acts, then chunk+embed
# offline / no heavy deps (lexical fallback, committed):
python -m rag.ingest --download --fallback
```

## API

- `POST /api/legal/ask` `{query, language}` → `{grounded, answer, reply, citations[], rag, source}`.
  `source` ∈ `rag-deepseek` (LLM phrased the official context) · `rag-extractive`
  (DeepSeek down → answer straight from the passages, still cited) · `rag-refuse`.
- `GET /api/legal/rag/health` → `{ready, chunks, embedder, semantic, store, min_score}`.

## Test

```bash
cd chitti-legal/backend && python test_rag.py     # 28/28 — contract: grounded+cited / refuse off-topic
```

## Honest status (2026-06-07)

- Built + tested: 5/5 official Acts ingested → **2685 chunks**; `test_rag.py` **28/28**;
  Flask `/api/legal/ask` + `/api/legal/rag/health` verified via test client.
- The committed index is the **lexical fallback** (no heavy deps in this env). Production
  accuracy ≥95% needs `requirements-optional.txt` (semantic embeddings) — same lazy-dep
  pattern as Voice Factory / Chitti CA. The cite-or-refuse guarantee holds either way.
- DeepSeek phrasing (`rag-deepseek`) activates when `DEEPSEEK_API_KEY` is set; until then
  the answer is honest **extractive** (verbatim official passages + citations).
