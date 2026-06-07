#!/usr/bin/env python
"""Chitti CA RAG test — proves the retrieve → cite → refuse contract.

Runs with the pure-python fallback embedder/store (no heavy deps needed), so it works
in CI and on Python versions without torch/chromadb wheels. The same assertions hold
for the semantic path (sentence-transformers + ChromaDB) once installed.

Run from chitti-ca/backend/:  python -m rag.test_rag   (or)  python rag/test_rag.py
"""
from __future__ import annotations

import os
import sys

# ensure backend/ is importable when run as a script
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag import ingest, retriever  # noqa: E402

PASS = 0
FAIL = 0
def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1; print(f"  PASS {name}")
    else:
        FAIL += 1; print(f"  FAIL {name} — {detail}")


def main() -> int:
    print("Building index from seed corpus (force pure-python fallback)…")
    res = ingest.build(reset=True, force_fallback=True)
    check("index built with chunks", res.get("chunks", 0) >= 6, str(res))

    # force the retriever to use the same fallback embedder/store
    from rag import embedder, store
    embedder._cached = embedder.get_embedder(force_fallback=True)
    store._cached = store.get_store(force_fallback=True)

    # 1) in-corpus queries → grounded, correct section cited
    in_corpus = [
        ("GST registration threshold for services", "22"),
        ("conditions to claim input tax credit", "16"),
        ("blocked credit on motor car and club membership", "17(5)"),
        ("presumptive taxation 44ADA for professionals", None),  # 44AD/44ADA/44AE doc
        ("section 80C deduction limit", "80C"),
        ("when is the income tax return due date", "139"),
    ]
    for q, want_sec in in_corpus:
        r = retriever.retrieve(q)
        top = r["results"][0] if r["results"] else {}
        cited = (top.get("section") or "").upper()
        ok = r["grounded"] and (want_sec is None or want_sec.upper() in cited or want_sec.upper() in (top.get("ref") or "").upper())
        check(f"grounded+cited: {q!r}", ok, f"grounded={r['grounded']} cited={cited!r} ref={top.get('ref')!r} score={top.get('score')}")

    # 2) out-of-corpus queries → REFUSE (not grounded)
    out_corpus = ["how do I bake sourdough bread", "best cricket bat to buy",
                  "weather in Mumbai tomorrow", "who won the football match last night"]
    for q in out_corpus:
        r = retriever.retrieve(q)
        check(f"refuses out-of-corpus: {q!r}", not r["grounded"],
              f"grounded={r['grounded']} top={r['results'][0]['score'] if r['results'] else None}")

    # 3) ca_service.ask() integration (no DEEPSEEK key → extractive + citations / refusal)
    os.environ.pop("DEEPSEEK_API_KEY", None)
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from services import ca_service  # noqa: E402

    a = ca_service.ask("What is the GST registration threshold?", language="en")
    check("ask(): in-corpus is grounded", a.get("grounded") is True, str(a.get("source")))
    check("ask(): returns citations", bool(a.get("citations")), str(a.get("citations")))
    check("ask(): cites a section/source", any((c.get("ref") for c in a.get("citations", []))), "")
    check("ask(): disclaimer enforced", ca_service.CA_DISCLAIMER in (a.get("reply") or ""), "")
    check("ask(): source is extractive (no LLM key)", a.get("source") == "rag_extractive", a.get("source"))

    b = ca_service.ask("recommend a good restaurant in Goa", language="en")
    check("ask(): out-of-corpus refuses", b.get("grounded") is False and b.get("source") == "rag_no_context", str(b.get("source")))
    check("ask(): refusal text correct", "cannot find this in the official documents" in (b.get("reply") or "").lower(), b.get("reply", "")[:80])
    check("ask(): refusal has no citations", b.get("citations") == [], str(b.get("citations")))

    print(f"\nRAG test — {PASS} passed, {FAIL} failed")
    if FAIL:
        return 1
    print('QA_RESULT:{"rag_pass":%d,"rag_fail":%d}' % (PASS, FAIL))
    return 0


if __name__ == "__main__":
    sys.exit(main())
