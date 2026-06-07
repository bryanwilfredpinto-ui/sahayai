# Chitti CA — RAG (vector database over official documents)

> Built 2026-06-07. **No fine-tuning.** RAG makes Chitti CA *qualified*: it answers
> from official documents and **cites the source (section + page)**; if the answer is
> not in the retrieved official text, it **refuses** — "I cannot find this in the
> official documents." Cheaper, faster, and more accurate than fine-tuning for tax/legal.

## What it does (the contract)

1. **Retrieve before the LLM.** `ca_service.ask()` first calls `rag.retrieve(question)`.
2. **Answer ONLY from context.** The retrieved official excerpts are the *only* allowed
   source; the LLM is instructed to use nothing else and to cite `[S1]/[S2]…`.
3. **Always cite.** Every answer ends with a `Sources:` list — *Act/doc — Section N, page P — URL*.
4. **Refuse when not grounded.** If the corpus is empty or the best match scores below the
   relevance floor, Chitti returns the refusal (never guesses).
5. **Free + local.** ChromaDB + sentence-transformers (`all-MiniLM-L6-v2`). No API keys,
   no fine-tuning. DeepSeek is used only to *phrase* the grounded answer (optional —
   without it, an honest **extractive** answer + citation is returned).

## Architecture (`chitti-ca/backend/rag/`)

| File | Role |
|---|---|
| `sources.py` | Manifest of OFFICIAL free PDFs (Income-tax Act 2025/1961, CGST/IGST Acts, ICAI BoS) |
| `chunker.py` | PDF→text per page (pypdf) + `.md/.txt`; ~900-char chunks with **section + page** metadata |
| `embedder.py` | sentence-transformers (primary) → **pure-python lexical fallback** (no deps) |
| `store.py` | ChromaDB PersistentClient (primary) → **JSONL cosine store** fallback |
| `ingest.py` | download official PDFs (or use local) → chunk → embed → persist |
| `retriever.py` | embed query → top-k → grounding gate (`grounded`/`refuse`) |
| `corpus/` | committed **seed** official provisions (GST reg/ITC/blocked-credit, 44AD/ADA, 80C, ITR dates) |
| `index/fallback.jsonl` | committed small vector index so the app works out-of-the-box |
| `test_rag.py` | proves retrieve→cite→refuse (19/19) |

**OOM-safe:** chromadb + sentence-transformers + pypdf live in
`requirements-optional.txt` and are **lazy-imported** (same pattern as Voice Factory).
When absent, the pure-python fallback keeps the contract working (lower quality, clearly
labelled) — the base Flask app never pulls torch on Railway free tier.

## Build the full corpus (production)

```bash
cd chitti-ca/backend
pip install -r requirements-optional.txt          # chromadb + sentence-transformers + pypdf (free, local)
python -m rag.ingest --download --reset           # fetch official PDFs → chunk → embed → ChromaDB
# (some .gov.in pages serve the Act behind a JS menu — drop those PDFs into rag/corpus/ then re-run)
python -m rag.ingest --reset                      # rebuild from whatever is in rag/corpus/
python rag/test_rag.py                            # 19/19 retrieve→cite→refuse
```

Verified this build: a real **2.05 MB CGST PDF** from cbic-gst.gov.in → pypdf → **944
chunks with real page numbers**; seed `.md` corpus → 12 chunks; grounding gate cleanly
separates in-corpus (score ≥0.31) from out-of-corpus (≤0.21).

## API

| Endpoint | Behaviour |
|---|---|
| `POST /api/ca/ask` `{text,language}` | RAG-grounded answer + `citations[]`, or refusal. `{"rag":false}` bypasses. |
| `GET /api/ca/rag/health` | vector-DB status: `chunks`, `embedder`, `semantic`, `store` |
| `POST /api/ca/rag/search` `{query}` | raw retrieval — official excerpts + citations (no LLM) |

Response (grounded) carries: `source: "rag_deepseek" | "rag_extractive"`, `grounded: true`,
`citations: [{tag, ref, doc, section, page, url, score}]`, `reply` (ends with `Sources:`).
Response (not grounded): `source: "rag_no_context"`, `grounded: false`, `citations: []`,
`reply` = the refusal.

## Honesty notes

- Seed `corpus/*.md` are faithful **summaries** of well-established provisions, each
  carrying the section + official URL so the user can verify; they are the starter
  corpus until the full official PDFs are ingested. They never replace the Act.
- No rupee figure / section / date is invented — answers are extracted from the
  retrieved official text or refused.
- Server-enforced disclaimer (`Consult a registered CA…`) is still appended to every reply.
