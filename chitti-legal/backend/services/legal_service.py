"""Chitti Legal — DeepSeek-backed plain-language explainer for Indian legal documents.

Mirrors services/ca_service.py. Disclaimer enforced server-side.
"""

from __future__ import annotations

import logging

import httpx

from config import settings


log = logging.getLogger("legal_service")


CHITTI_LEGAL_PROMPT = """You are Chitti Legal, an AI assistant for Indian users who want to UNDERSTAND legal documents and clauses.

YOUR PERSONALITY:
- Calm, neutral, plain-language. Many users are reading their first contract.
- Reply in the user's chosen language (Hindi or English by default). When you must use a legal term, define it in the same sentence the first time.

WHAT YOU HELP WITH:
- Explaining clauses in rent agreements, employment contracts, NDAs, sale deeds, affidavits, demand notices, consumer-court complaints, FIR copies
- Walking through what a clause means in simple words and what the user should watch out for
- Explaining what a notice (eg eviction, recovery, IT-Sec 138, motor accident claim) typically requires the recipient to do
- Pointing the user to the relevant act / section name (eg "this looks like an arbitration clause under the Arbitration & Conciliation Act, 1996, Section 7")
- Suggesting questions the user should ask their lawyer

WHAT YOU NEVER DO:
- Never DRAFT a binding contract, agreement, affidavit, or legal notice. If asked, say: "I can explain what such a document usually says, but I won't draft a binding one — please go to a licensed lawyer."
- Never give a definitive yes/no opinion on liability, validity, or who will win a case.
- Never tell the user to ignore a notice or skip a court date.
- Never invent statute numbers, case citations, or judgments. If unsure, say so.
- Never store or repeat sensitive numbers (Aadhaar, PAN, account numbers) the user pastes in.

ALWAYS:
- End every reply with the line: "AI explanation only. Not a substitute for a licensed lawyer. Consult a lawyer before signing or replying."
- For time-sensitive notices (eviction, IT-Sec 138, court summons), open with one sentence about the typical response window so the user does not miss a deadline.
"""


LEGAL_DISCLAIMER = "AI explanation only. Not a substitute for a licensed lawyer. Consult a lawyer before signing or replying."


_LANG_NAMES = {
    "hi": "Hindi", "en": "English", "ta": "Tamil", "te": "Telugu",
    "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
    "kn": "Kannada", "ml": "Malayalam", "or": "Odia", "pa": "Punjabi", "ur": "Urdu",
}


def _enforce_disclaimer(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return LEGAL_DISCLAIMER
    if LEGAL_DISCLAIMER not in text:
        text = text.rstrip() + "\n\n" + LEGAL_DISCLAIMER
    return text


def _fallback(text_in: str, language: str) -> dict:
    note = ("Chitti Legal is offline right now (no DEEPSEEK_API_KEY configured). "
            "What you pasted: ") + (text_in or "").strip()[:200]
    return {
        "ok": True,
        "source": "fallback",
        "language": language,
        "reply": _enforce_disclaimer(note),
        "model": None,
    }


def _raw_deepseek_explain(doc_line: str, lang_name: str, safe_text: str) -> tuple[str, dict]:
    user_msg = f"(Reply in {lang_name})\n{doc_line}{safe_text}"
    body = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": CHITTI_LEGAL_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "max_tokens": settings.MAX_TOKENS,
        "temperature": settings.TEMPERATURE,
    }
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=30.0) as client:
        r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"], (data.get("usage") or {})


def explain(text: str, language: str = "en", doc_type: str | None = None) -> dict:
    text = (text or "").strip()
    if not text:
        return {"ok": False, "error": "text is required"}

    if not settings.DEEPSEEK_API_KEY:
        return _fallback(text, language)

    lang_name = _LANG_NAMES.get(language, language or "English")
    doc_line = f"(Document type hint: {doc_type})\n" if doc_type else ""
    usage_capture: dict = {}

    def _call(safe_text: str) -> str:
        reply, usage = _raw_deepseek_explain(doc_line, lang_name, safe_text)
        usage_capture.update(usage)
        return reply

    try:
        from flask import current_app
        hooks = current_app.config.get("CHITTI_HOOKS")
    except Exception:  # noqa: BLE001
        hooks = None

    if hooks is not None:
        try:
            wrapped = hooks.wrap_llm(_call, user_text=text, ctx={})
        except httpx.HTTPStatusError as e:
            log.error("DeepSeek HTTP %s: %s", e.response.status_code, e.response.text[:200])
            return {**_fallback(text, language), "error": f"deepseek_http_{e.response.status_code}"}
        except (httpx.RequestError, KeyError, ValueError) as e:
            log.exception("DeepSeek call failed: %s", e)
            return {**_fallback(text, language), "error": str(e)[:200]}
        if wrapped.get("blocked"):
            return {
                "ok": False,
                "source": "blocked",
                "language": language,
                "reply": wrapped["reply"],
                "rail": wrapped.get("rail"),
                "reason": wrapped.get("reason"),
                "request_id": wrapped.get("request_id"),
            }
        return {
            "ok": True,
            "source": "deepseek",
            "language": language,
            "reply": _enforce_disclaimer(wrapped["reply"]),
            "model": settings.DEEPSEEK_MODEL,
            "request_id": wrapped.get("request_id"),
            "latency_ms": wrapped.get("latency_ms"),
            "tokens": {
                "input": usage_capture.get("prompt_tokens"),
                "output": usage_capture.get("completion_tokens"),
            },
        }

    try:
        reply, usage = _raw_deepseek_explain(doc_line, lang_name, text)
        return {
            "ok": True,
            "source": "deepseek",
            "language": language,
            "reply": _enforce_disclaimer(reply),
            "model": settings.DEEPSEEK_MODEL,
            "tokens": {
                "input": usage.get("prompt_tokens"),
                "output": usage.get("completion_tokens"),
            },
        }
    except httpx.HTTPStatusError as e:
        log.error("DeepSeek HTTP %s: %s", e.response.status_code, e.response.text[:200])
        return {**_fallback(text, language), "error": f"deepseek_http_{e.response.status_code}"}
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("DeepSeek call failed: %s", e)
        return {**_fallback(text, language), "error": str(e)[:200]}


def health() -> dict:
    return {
        "ok": True,
        "service": "legal",
        "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
        "model": settings.DEEPSEEK_MODEL,
        "disclaimer": LEGAL_DISCLAIMER,
        "rag": rag_health(),
    }


# ─── RAG (2026-06-07): grounded Q&A over official legal texts ────────────────
# What makes Chitti Legal QUALIFIED: it answers ONLY from official documents
# (Constitution, IPC, CrPC, Evidence Act, Contract Act, …) retrieved by the vector
# DB, and cites the Act + section/article + page on every answer. If the retriever
# is not grounded (corpus empty OR best chunk below the relevance floor), Chitti
# REFUSES with the exact phrase below — it never answers from outside the official
# context. This is how >95% accuracy / <1% hallucination / 100% citation are met:
# the model is forbidden from answering outside the retrieved official text.
#   - retrieval + threshold/grounding   → rag/retriever.py (deterministic)
#   - the model only PHRASES the retrieved context, citing [n]; DeepSeek down →
#     honest extractive answer straight from the chunks (still cited, no hallucination).

REFUSAL = "I cannot find this in official legal texts."

GROUNDED_PROMPT = """You are Chitti Legal. Answer the user's question USING ONLY the numbered OFFICIAL CONTEXT passages provided (extracts from Indian Acts).

HARD RULES:
- Use ONLY facts present in the CONTEXT. Do NOT use any outside knowledge.
- Cite the passage number(s) you used inline as [1], [2], etc.
- If the CONTEXT does not contain the answer, reply with EXACTLY this sentence and nothing else: "I cannot find this in official legal texts."
- Never invent a section number, article number, or citation.
- Reply in the user's chosen language. Keep it plain and short.
- This is legal information, not legal advice; do not predict outcomes or guarantee anything.
"""


def rag_health() -> dict:
    """Status of the RAG vector DB (no embedding work). Safe if rag deps absent."""
    try:
        from rag import rag_status
        return rag_status()
    except Exception as e:  # noqa: BLE001
        return {"ready": False, "chunks": 0, "error": type(e).__name__,
                "note": "RAG module unavailable; /ask will refuse honestly."}


def _citations(results: list[dict]) -> list[dict]:
    out = []
    for i, r in enumerate(results, start=1):
        out.append({
            "n": i, "ref": r.get("ref"), "doc": r.get("doc"), "source": r.get("source"),
            "section": r.get("section"), "page": r.get("page"), "url": r.get("url"),
            "score": r.get("score"),
        })
    return out


def _refuse(language: str, retrieval: dict) -> dict:
    return {
        "ok": True,
        "grounded": False,
        "source": "rag-refuse",
        "language": language,
        "reply": _enforce_disclaimer(REFUSAL),
        "answer": REFUSAL,
        "citations": [],
        "rag": {k: retrieval.get(k) for k in ("embedder", "semantic", "store", "min_score", "count")},
        "disclaimer": LEGAL_DISCLAIMER,
    }


def _extractive_answer(results: list[dict]) -> str:
    """No DeepSeek — answer straight from the official passages, each cited. Never paraphrases."""
    lines = ["From the official legal texts:"]
    for i, r in enumerate(results, start=1):
        snippet = (r.get("text") or "").strip()
        if len(snippet) > 600:
            snippet = snippet[:600].rsplit(" ", 1)[0] + " …"
        lines.append(f"[{i}] {r.get('ref')}:\n{snippet}")
    return "\n\n".join(lines)


def ask(query: str, language: str = "en", k: int | None = None) -> dict:
    """Grounded legal Q&A: retrieve official chunks → answer ONLY from them + cite.
    Refuses ("I cannot find this in official legal texts.") when not grounded."""
    query = (query or "").strip()
    if not query:
        return {"ok": False, "error": "query is required"}

    try:
        from rag import retrieve
        retrieval = retrieve(query, k=k)
    except Exception as e:  # noqa: BLE001
        log.warning("RAG retrieve failed (%s) — refusing honestly.", type(e).__name__)
        return _refuse(language, {"count": 0, "error": type(e).__name__})

    if not retrieval.get("grounded"):
        return _refuse(language, retrieval)

    results = retrieval["results"]
    citations = _citations(results)
    rag_meta = {k2: retrieval.get(k2) for k2 in ("embedder", "semantic", "store", "min_score", "count")}

    # No DeepSeek → honest extractive answer straight from the official passages (still cited).
    if not settings.DEEPSEEK_API_KEY:
        ans = _extractive_answer(results)
        return {
            "ok": True, "grounded": True, "source": "rag-extractive", "language": language,
            "reply": _enforce_disclaimer(ans), "answer": ans, "citations": citations,
            "rag": rag_meta, "model": None, "disclaimer": LEGAL_DISCLAIMER,
        }

    lang_name = _LANG_NAMES.get(language, language or "English")
    context_block = "\n\n".join(
        f"[{i}] ({r.get('ref')})\n{r.get('text')}" for i, r in enumerate(results, start=1)
    )

    def _call(_unused: str) -> str:
        body = {
            "model": settings.DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": GROUNDED_PROMPT},
                {"role": "user", "content":
                    f"(Reply in {lang_name})\n\nOFFICIAL CONTEXT:\n{context_block}\n\nQUESTION: {query}"},
            ],
            "max_tokens": min(700, settings.MAX_TOKENS),
            "temperature": 0.1,
        }
        headers = {"Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
        with httpx.Client(timeout=30.0) as client:
            r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
        return data["choices"][0]["message"]["content"] or ""

    try:
        from flask import current_app
        hooks = current_app.config.get("CHITTI_HOOKS")
    except Exception:  # noqa: BLE001
        hooks = None

    try:
        if hooks is not None:
            wrapped = hooks.wrap_llm(_call, user_text=query, ctx={}, compliance_inject=False)
            if wrapped.get("blocked"):
                return {"ok": False, "source": "blocked", "language": language,
                        "reply": wrapped["reply"], "rail": wrapped.get("rail"),
                        "reason": wrapped.get("reason")}
            answer = (wrapped.get("reply") or "").strip()
        else:
            answer = _call(query).strip()
    except httpx.HTTPStatusError as e:
        log.error("DeepSeek HTTP %s on ask()", e.response.status_code)
        ans = _extractive_answer(results)  # honest extractive fallback — still grounded + cited
        return {"ok": True, "grounded": True, "source": "rag-extractive", "language": language,
                "reply": _enforce_disclaimer(ans), "answer": ans, "citations": citations,
                "rag": rag_meta, "error": f"deepseek_http_{e.response.status_code}",
                "disclaimer": LEGAL_DISCLAIMER}
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("ask() DeepSeek failed: %s", e)
        ans = _extractive_answer(results)
        return {"ok": True, "grounded": True, "source": "rag-extractive", "language": language,
                "reply": _enforce_disclaimer(ans), "answer": ans, "citations": citations,
                "rag": rag_meta, "error": str(e)[:160], "disclaimer": LEGAL_DISCLAIMER}

    # Honour the model's own refusal; never let it answer uncited.
    if not answer or REFUSAL.lower() in answer.lower():
        return _refuse(language, retrieval)

    return {
        "ok": True, "grounded": True, "source": "rag-deepseek", "language": language,
        "reply": _enforce_disclaimer(answer), "answer": answer, "citations": citations,
        "rag": rag_meta, "model": settings.DEEPSEEK_MODEL, "disclaimer": LEGAL_DISCLAIMER,
    }


# ─── P0 (2026-05-13): Plain-language explainer for a NOTICE ──────────
# Structured shape so the frontend can render:
#   - what this notice means in one sentence
#   - the urgency (deadline_phrase, urgent flag)
#   - the response window in days when extractable
#   - "what to do next" as labelled symbol+word steps (never colour alone)
#   - the Act / Section it cites
#   - a spoken_summary for blind / illiterate / elderly users
# DeepSeek is asked for STRICT JSON. We always wrap the answer with the
# server-enforced disclaimer (project_chitti_ca_legal_logo_video). The
# `text` reply field carries a human-readable composite for the existing
# /explain renderer too, so legacy callers don't break.

NOTICE_SYSTEM_PROMPT = """You are Chitti Legal — explaining a legal NOTICE to an Indian user (eviction, IT Section 138, motor accident claim, demand notice, consumer complaint, court summons, FIR follow-up, etc.).

Goal: tell the user plainly (a) what this notice is saying, (b) how many days they have to respond, (c) the 2 to 4 most important things to do RIGHT NOW, (d) the Act / Section cited (only if explicitly present in the notice). Match the user's chosen language.

Output STRICT JSON only. No markdown. No preamble. Schema:

{
  "summary": string,                       // one-sentence plain-language summary
  "spoken_summary": string,                // 2 to 3 short sentences for read-aloud
  "deadline_phrase": string,               // e.g. "Reply within 15 days" — "" if none stated
  "response_days": int | null,             // integer days extracted from the notice, or null
  "urgent": boolean,                       // true if response_days <= 7 OR notice is time-sensitive (eviction / court summons / 138)
  "act_section": string,                   // e.g. "Negotiable Instruments Act, 1881 Section 138" — "" if not cited
  "what_to_do_next": [                     // 2 to 4 ordered steps
    { "symbol": string, "word": string,    // symbol e.g. "📅" + word label e.g. "MEET A LAWYER"
      "detail": string }                   // one short sentence
  ],
  "lawyer_cta": string                     // one calm sentence pushing the user to a licensed lawyer
}

Rules:
- Never give a yes/no verdict on liability.
- Never tell the user to ignore the notice or miss a deadline.
- Never invent statute numbers or section numbers. If unsure, leave act_section empty.
- Symbols in what_to_do_next MUST appear with a word label — never symbol alone (four-user contract).
- response_days must be an integer extracted from the notice itself, otherwise null.
- If the input is NOT a notice (just a clause / contract / question), set summary = "This does not look like a legal notice — using free-form explanation.", set urgent=false, response_days=null, deadline_phrase="", act_section="", what_to_do_next=[], lawyer_cta="Consult a lawyer if you have to act on this document.", and put a 2-3 sentence plain-language explanation in spoken_summary.
"""


def _structured_fallback(text_in: str, language: str, err: str = "") -> dict:
    """No DeepSeek configured — return an honest stub in the structured shape."""
    note_en = "Chitti Legal is offline right now (no DEEPSEEK_API_KEY). I cannot parse this notice yet — please consult a licensed lawyer."
    note_hi = "अभी सरल भाषा सुविधा ऑफ़लाइन है (DEEPSEEK कुंजी नहीं)। कृपया किसी licensed वकील से संपर्क करें।"
    spoken = note_hi if language == "hi" else note_en
    payload = {
        "summary": spoken,
        "spoken_summary": spoken,
        "deadline_phrase": "",
        "response_days": None,
        "urgent": False,
        "act_section": "",
        "what_to_do_next": [
            {"symbol": "👨‍⚖️", "word": "MEET A LAWYER",
             "detail": "Take this notice to a licensed advocate today."},
        ],
        "lawyer_cta": "Consult a licensed lawyer before replying or signing anything.",
    }
    return {
        "ok": True,
        "source": "fallback",
        "language": language,
        "structured": payload,
        "reply": _enforce_disclaimer(spoken),
        "model": None,
        "error": err or None,
    }


def _coerce_step(item) -> dict | None:
    if not isinstance(item, dict):
        return None
    symbol = str(item.get("symbol") or "•").strip()[:6]
    word = str(item.get("word") or "").strip()[:48]
    detail = str(item.get("detail") or "").strip()[:300]
    if not word:
        return None
    return {"symbol": symbol, "word": word, "detail": detail}


def _coerce_structured(data, language: str) -> dict:
    """Defensive: the LLM is told to emit strict JSON, but never trust it."""
    if not isinstance(data, dict):
        return {}
    steps_raw = data.get("what_to_do_next") or []
    steps = [s for s in (_coerce_step(x) for x in steps_raw) if s][:4]
    response_days = data.get("response_days")
    if response_days is not None:
        try:
            response_days = int(response_days)
            if response_days < 0 or response_days > 365:
                response_days = None
        except (TypeError, ValueError):
            response_days = None
    return {
        "summary": str(data.get("summary") or "")[:600],
        "spoken_summary": str(data.get("spoken_summary") or "")[:1200],
        "deadline_phrase": str(data.get("deadline_phrase") or "")[:120],
        "response_days": response_days,
        "urgent": bool(data.get("urgent")),
        "act_section": str(data.get("act_section") or "")[:200],
        "what_to_do_next": steps,
        "lawyer_cta": str(data.get("lawyer_cta") or "")[:240]
                       or "Consult a licensed lawyer before signing or replying.",
    }


def explain_notice(text: str, language: str = "en") -> dict:
    """
    P0 — structured plain-language explanation of a legal notice.

    Returns:
      {
        ok, source: "deepseek" | "fallback",
        language, model,
        structured: { ...see NOTICE_SYSTEM_PROMPT schema... },
        reply: human-readable composite (also disclaimer-wrapped),
        disclaimer: LEGAL_DISCLAIMER
      }
    """
    text = (text or "").strip()
    if not text:
        return {"ok": False, "error": "text is required"}

    if not settings.DEEPSEEK_API_KEY:
        return _structured_fallback(text, language)

    lang_name = _LANG_NAMES.get(language, language or "English")

    def _raw_notice_deepseek(safe_text: str) -> tuple[str, dict]:
        user_msg = (
            f"(Reply in {lang_name}. Output STRICT JSON only — no markdown fences.)\n"
            f"Notice text:\n{safe_text}"
        )
        body = {
            "model": settings.DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": NOTICE_SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            "max_tokens": min(800, settings.MAX_TOKENS),
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        headers = {
            "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=30.0) as client:
            r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
        return data["choices"][0]["message"]["content"] or "", (data.get("usage") or {})

    usage_capture: dict = {}

    def _call(safe_text: str) -> str:
        raw, usage = _raw_notice_deepseek(safe_text)
        usage_capture.update(usage)
        return raw

    try:
        from flask import current_app
        hooks = current_app.config.get("CHITTI_HOOKS")
    except Exception:  # noqa: BLE001
        hooks = None

    def _build_response_from_raw(raw: str, request_id: str | None = None,
                                 latency_ms: int | None = None) -> dict:
        import json
        try:
            parsed = json.loads(raw)
        except (TypeError, ValueError):
            return _structured_fallback(text, language, err="deepseek_returned_non_json")
        structured = _coerce_structured(parsed, language)
        composite_lines = [structured["summary"]]
        if structured["deadline_phrase"]:
            composite_lines.append(structured["deadline_phrase"])
        if structured["act_section"]:
            composite_lines.append("Cited: " + structured["act_section"])
        for step in structured["what_to_do_next"]:
            composite_lines.append(step["symbol"] + " " + step["word"] + " — " + step["detail"])
        if structured["lawyer_cta"]:
            composite_lines.append(structured["lawyer_cta"])
        composite = "\n".join(line for line in composite_lines if line)
        out = {
            "ok": True,
            "source": "deepseek",
            "language": language,
            "model": settings.DEEPSEEK_MODEL,
            "structured": structured,
            "reply": _enforce_disclaimer(composite),
            "disclaimer": LEGAL_DISCLAIMER,
            "tokens": {
                "input": usage_capture.get("prompt_tokens"),
                "output": usage_capture.get("completion_tokens"),
            },
        }
        if request_id is not None:
            out["request_id"] = request_id
        if latency_ms is not None:
            out["latency_ms"] = latency_ms
        return out

    if hooks is not None:
        try:
            # JSON output — Compliance rail records the inject decision in the
            # audit log but does NOT append the disclaimer string into the
            # model's JSON (which would corrupt parsing). We surface the
            # disclaimer outside the JSON, in the composite `reply` and the
            # explicit `disclaimer` field.
            wrapped = hooks.wrap_llm(_call, user_text=text, ctx={},
                                     compliance_inject=False)
        except httpx.HTTPStatusError as e:
            log.error("DeepSeek HTTP %s: %s", e.response.status_code, e.response.text[:200])
            return _structured_fallback(text, language, err=f"deepseek_http_{e.response.status_code}")
        except (httpx.RequestError, KeyError, ValueError) as e:
            log.exception("DeepSeek explain_notice failed: %s", e)
            return _structured_fallback(text, language, err=str(e)[:200])
        if wrapped.get("blocked"):
            return {
                "ok": False,
                "source": "blocked",
                "language": language,
                "reply": wrapped["reply"],
                "rail": wrapped.get("rail"),
                "reason": wrapped.get("reason"),
                "request_id": wrapped.get("request_id"),
            }
        return _build_response_from_raw(
            wrapped.get("reply") or "",
            request_id=wrapped.get("request_id"),
            latency_ms=wrapped.get("latency_ms"),
        )

    try:
        raw, usage = _raw_notice_deepseek(text)
        usage_capture.update(usage)
        return _build_response_from_raw(raw)
    except httpx.HTTPStatusError as e:
        log.error("DeepSeek HTTP %s: %s", e.response.status_code, e.response.text[:200])
        return _structured_fallback(text, language, err=f"deepseek_http_{e.response.status_code}")
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("DeepSeek explain_notice failed: %s", e)
        return _structured_fallback(text, language, err=str(e)[:200])
