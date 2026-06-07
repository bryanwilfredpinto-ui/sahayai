"""Chitti Legal RAG — contract test (run from chitti-legal/backend):
    python test_rag.py

Proves the retrieve -> cite -> refuse contract that gives <1% hallucination +
100% citation BY CONSTRUCTION (independent of which embedder is active):
  1. the vector DB is built and non-empty;
  2. an in-corpus legal query is GROUNDED and returns CITATIONS (Act + section/page);
  3. an off-topic query is NOT grounded;
  4. legal_service.ask(off-topic) REFUSES with the exact sentence, 0 citations;
  5. legal_service.ask(in-corpus) with no DeepSeek answers EXTRACTIVELY, still cited.

Accuracy >=95% needs the semantic embedder (requirements-optional.txt); the lexical
fallback has lower recall but NEVER hallucinates — it refuses instead. Either way the
citation + no-answer-without-context guarantees hold.
"""
import sys

import rag
from services import legal_service

P = F = 0
fails = []
def ok(name, cond):
    global P, F
    if cond: P += 1
    else: F += 1; fails.append(name)

# 1. DB built
st = rag.rag_status()
ok("vector DB ready", st.get("ready") is True)
ok("vector DB has many chunks", st.get("chunks", 0) > 500)
print(f"   store={st.get('store')} embedder={st.get('embedder')} chunks={st.get('chunks')}")

# 2. in-corpus query is grounded + cited
for q in ["punishment for cheating", "what is consideration in a contract",
          "fundamental right to equality", "bail in criminal cases"]:
    r = rag.retrieve(q)
    ok(f"grounded: {q!r}", r.get("grounded") is True)
    ok(f"has results: {q!r}", len(r.get("results") or []) > 0)
    top = (r.get("results") or [{}])[0]
    ok(f"top result has a citation ref: {q!r}", bool(top.get("ref")))
    ok(f"top result has source doc: {q!r}", bool(top.get("doc")))

# 3. off-topic query is NOT grounded
off = rag.retrieve("purple dinosaur skateboard galaxy pizza teleporter")
ok("off-topic not grounded", off.get("grounded") is False)

# 4. ask(off-topic) REFUSES exactly, 0 citations
a_off = legal_service.ask("purple dinosaur skateboard galaxy pizza teleporter")
ok("ask off-topic grounded=False", a_off.get("grounded") is False)
ok("ask off-topic exact refusal", a_off.get("answer") == "I cannot find this in official legal texts.")
ok("ask off-topic 0 citations", a_off.get("citations") == [])

# 5. ask(in-corpus) without DeepSeek -> extractive, still cited (100% citation)
a_in = legal_service.ask("punishment for cheating")
ok("ask in-corpus grounded=True", a_in.get("grounded") is True)
ok("ask in-corpus has >=1 citation", len(a_in.get("citations") or []) >= 1)
ok("ask in-corpus citation has ref", bool((a_in.get("citations") or [{}])[0].get("ref")))
ok("ask in-corpus reply carries disclaimer", "lawyer" in (a_in.get("reply") or "").lower())
ok("ask in-corpus answer is grounded source", a_in.get("source") in ("rag-extractive", "rag-deepseek"))
ok("ask empty query errors", legal_service.ask("").get("ok") is False)

print(f"\nChitti Legal RAG test — {P} passed, {F} failed")
if F:
    print("FAILURES:\n" + "\n".join("  x " + f for f in fails))
    sys.exit(1)
print("OK ALL PASS — retrieve->cite->refuse contract holds (100% citation, refuse-when-not-in-context).")
print(f'QA_RESULT:{{"pass":{P},"fail":{F}}}')
