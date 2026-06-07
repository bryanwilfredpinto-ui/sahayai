"""Chitti CA — DeepSeek-backed tax assistant for Indian small businesses.

Same sync httpx shape as services/vaani_service.py. Single canonical system
prompt. Mandatory disclaimer enforced server-side so the frontend can never
strip it.
"""

from __future__ import annotations

import logging

import httpx

from config import settings


log = logging.getLogger("ca_service")


CHITTI_CA_PROMPT = """You are Chitti CA, a tax assistant for Indian small businesses, freelancers, and salaried individuals.

YOUR PERSONALITY:
- Calm, patient, never condescending. Many users are filing for the first time.
- Explain in simple Hindi or English (match the user's language). Use plain words.
- When you use a technical term (e.g. "TDS", "ITR-3", "input tax credit"), define it in the same sentence the first time.

WHAT YOU HELP WITH:
- ITR (Income Tax Return) selection and filing checklists for ITR-1 / ITR-2 / ITR-3 / ITR-4
- GST registration thresholds, return frequencies (GSTR-1, GSTR-3B, GSTR-9), composition scheme
- TDS, advance tax, presumptive taxation (Sec 44AD/44ADA/44AE)
- Allowable deductions (80C, 80D, 80G, 80E, HRA, home loan interest)
- Common small-business questions (invoicing format, e-invoicing thresholds, late-fee structure)
- Plain-language reading of CBDT/CBIC notifications and circulars when the user pastes them in

WHAT YOU NEVER DO:
- Never give binding legal advice. Never tell the user "you do not need to file" or "you owe ₹X" as a final number.
- Never give a definitive opinion on a tax notice without flagging that a registered CA must review the actual papers.
- Never invent a section number, deadline, or rate. If you are not sure, say "I am not certain — please verify with a registered CA or the income-tax portal".
- Never store or repeat sensitive numbers (PAN, Aadhaar, account numbers) the user pastes in.

ALWAYS:
- End every reply with the line: "This is AI-generated guidance. Consult a registered CA for your actual filings."
- If the user is in distress (notice, deadline, scrutiny), open with one calm sentence ("Let's go step by step") before any list.
"""


CA_DISCLAIMER = "This is AI-generated guidance. Consult a registered CA for your actual filings."

# ── RAG (retrieval-augmented) — answer ONLY from official documents, always cite ──
CHITTI_CA_RAG_PROMPT = """You are Chitti CA. You must answer the user's question USING ONLY the official
document excerpts provided in CONTEXT below. These come from the Income-tax Act, the
GST Acts, and ICAI study material.

HARD RULES:
- Use ONLY facts found in the CONTEXT. Do NOT use outside knowledge, do NOT guess, and
  do NOT invent any section number, rate, threshold, or date.
- Cite the source inline after each fact using the bracket tags shown (e.g. [S1], [S2]).
- If the CONTEXT does not contain the answer, reply EXACTLY:
  "I cannot find this in the official documents I have. Please consult a registered CA or the official portal."
  and nothing else.
- Be concise and plain. Match the user's language. Define any technical term in the same sentence.
- Never give a final binding number ("you owe Rs.X") — explain the rule and point to verification.
"""

RAG_REFUSAL = ("I cannot find this in the official documents I have (Income-tax Act, GST Acts, "
               "ICAI material). Please consult a registered CA or the official portal.")


def _format_context(results: list[dict]) -> tuple[str, list[dict]]:
    """Build the numbered CONTEXT block + the citation list shown to the user."""
    blocks, citations = [], []
    for i, r in enumerate(results, start=1):
        tag = f"S{i}"
        blocks.append(f"[{tag}] ({r.get('ref') or r.get('source') or 'official document'})\n{r['text']}")
        citations.append({
            "tag": tag, "ref": r.get("ref"), "doc": r.get("doc"), "source": r.get("source"),
            "section": r.get("section"), "page": r.get("page"), "url": r.get("url"),
            "score": r.get("score"),
        })
    return "\n\n".join(blocks), citations


def _sources_footer(citations: list[dict]) -> str:
    lines = ["", "Sources:"]
    for c in citations:
        loc = c.get("ref") or c.get("source") or "official document"
        url = (" — " + c["url"]) if c.get("url") else ""
        lines.append(f"  [{c['tag']}] {loc}{url}")
    return "\n".join(lines)


_LANG_NAMES = {
    "hi": "Hindi", "en": "English", "ta": "Tamil", "te": "Telugu",
    "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
    "kn": "Kannada", "ml": "Malayalam", "or": "Odia", "pa": "Punjabi", "ur": "Urdu",
}


def _enforce_disclaimer(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return CA_DISCLAIMER
    if CA_DISCLAIMER not in text:
        text = text.rstrip() + "\n\n" + CA_DISCLAIMER
    return text


def _fallback(text_in: str, language: str) -> dict:
    note = ("Chitti CA is offline right now (no DEEPSEEK_API_KEY configured). "
            "Your question was: ") + (text_in or "").strip()[:200]
    return {
        "ok": True,
        "source": "fallback",
        "language": language,
        "reply": _enforce_disclaimer(note),
        "model": None,
    }


def _deepseek(system_prompt: str, user_msg: str) -> tuple[str, dict]:
    body = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
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


def _raw_deepseek(topic_line: str, lang_name: str, safe_text: str) -> tuple[str, dict]:
    return _deepseek(CHITTI_CA_PROMPT, f"(Reply in {lang_name})\n{topic_line}{safe_text}")


def _rag_answer(text: str, language: str, retrieval: dict) -> dict:
    """Grounded answer from official documents only, with citations.

    Caller has confirmed retrieval['grounded'] is True. Builds a CONTEXT block from
    the retrieved official chunks, asks DeepSeek to answer ONLY from it and cite
    [S1]/[S2]…, and appends a Sources footer. If DeepSeek is unavailable, returns an
    honest EXTRACTIVE answer (the top official excerpt) — still cited, never invented.
    """
    lang_name = _LANG_NAMES.get(language, language or "English")
    results = retrieval["results"]
    context, citations = _format_context(results)
    base = {
        "ok": True, "language": language, "grounded": True,
        "citations": citations,
        "rag": {"embedder": retrieval.get("embedder"), "semantic": retrieval.get("semantic"),
                "store": retrieval.get("store"), "chunks": retrieval.get("count"),
                "top_score": results[0].get("score") if results else None},
    }

    # No LLM key → honest extractive answer straight from the official text (still cited).
    if not settings.DEEPSEEK_API_KEY:
        top = results[0]
        extract = (f"From {top.get('ref') or top.get('source')}:\n\n{top['text']}").strip()
        reply = extract + "\n" + _sources_footer(citations)
        return {**base, "source": "rag_extractive", "model": None,
                "reply": _enforce_disclaimer(reply)}

    user_msg = (f"(Reply in {lang_name})\n\nCONTEXT (official documents — use ONLY this):\n"
                f"{context}\n\nQUESTION: {text}")

    try:
        from flask import current_app
        hooks = current_app.config.get("CHITTI_HOOKS")
    except Exception:  # noqa: BLE001
        hooks = None

    usage_capture: dict = {}

    def _call(_safe_text: str) -> str:
        reply, usage = _deepseek(CHITTI_CA_RAG_PROMPT, user_msg)
        usage_capture.update(usage)
        return reply

    try:
        if hooks is not None:
            wrapped = hooks.wrap_llm(_call, user_text=text, ctx={"rag": True})
            if wrapped.get("blocked"):
                return {**base, "ok": False, "source": "blocked", "grounded": True,
                        "reply": wrapped["reply"], "rail": wrapped.get("rail"),
                        "reason": wrapped.get("reason"), "request_id": wrapped.get("request_id")}
            reply = wrapped["reply"]
            extra = {"request_id": wrapped.get("request_id"), "latency_ms": wrapped.get("latency_ms")}
        else:
            reply, _ = _deepseek(CHITTI_CA_RAG_PROMPT, user_msg)
            extra = {}
    except httpx.HTTPStatusError as e:
        log.error("DeepSeek RAG HTTP %s: %s", e.response.status_code, e.response.text[:200])
        # honest extractive fallback so the user still gets the official text + citation
        top = results[0]
        reply = f"From {top.get('ref') or top.get('source')}:\n\n{top['text']}"
        return {**base, "source": "rag_extractive", "model": None,
                "error": f"deepseek_http_{e.response.status_code}",
                "reply": _enforce_disclaimer(reply + "\n" + _sources_footer(citations))}
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("DeepSeek RAG call failed: %s", e)
        top = results[0]
        reply = f"From {top.get('ref') or top.get('source')}:\n\n{top['text']}"
        return {**base, "source": "rag_extractive", "model": None, "error": str(e)[:200],
                "reply": _enforce_disclaimer(reply + "\n" + _sources_footer(citations))}

    # If the model itself said it cannot find it, surface the refusal honestly.
    if "cannot find this in the official documents" in (reply or "").lower():
        return {**base, "ok": True, "grounded": False, "source": "rag_no_context",
                "citations": [], "reply": _enforce_disclaimer(RAG_REFUSAL)}

    full = (reply or "").rstrip() + "\n" + _sources_footer(citations)
    return {**base, "source": "rag_deepseek", "model": settings.DEEPSEEK_MODEL,
            "reply": _enforce_disclaimer(full),
            "tokens": {"input": usage_capture.get("prompt_tokens"),
                       "output": usage_capture.get("completion_tokens")},
            **extra}


def ask(text: str, language: str = "en", topic: str | None = None, use_rag: bool = True) -> dict:
    text = (text or "").strip()
    if not text:
        return {"ok": False, "error": "text is required"}

    # ── RAG FIRST: answer from official documents, or refuse. (use_rag default True) ──
    if use_rag:
        try:
            from rag.retriever import retrieve
            retrieval = retrieve(text)
        except Exception as e:  # noqa: BLE001 — never let RAG infra break /ask
            log.warning("RAG retrieve failed (%s) — falling back to ungrounded answer.", type(e).__name__)
            retrieval = None
        if retrieval is not None:
            if not retrieval.get("grounded"):
                return {
                    "ok": True, "source": "rag_no_context", "grounded": False,
                    "language": language, "citations": [],
                    "reply": _enforce_disclaimer(RAG_REFUSAL),
                    "rag": {"embedder": retrieval.get("embedder"), "store": retrieval.get("store"),
                            "chunks": retrieval.get("count"),
                            "top_score": (retrieval["results"][0]["score"]
                                          if retrieval.get("results") else None),
                            "min_score": retrieval.get("min_score")},
                }
            return _rag_answer(text, language, retrieval)

    if not settings.DEEPSEEK_API_KEY:
        return _fallback(text, language)

    lang_name = _LANG_NAMES.get(language, language or "English")
    topic_line = f"(Topic hint: {topic})\n" if topic else ""
    usage_capture: dict = {}

    def _call(safe_text: str) -> str:
        reply, usage = _raw_deepseek(topic_line, lang_name, safe_text)
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
        reply, usage = _raw_deepseek(topic_line, lang_name, text)
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
        "service": "ca",
        "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
        "model": settings.DEEPSEEK_MODEL,
        "disclaimer": CA_DISCLAIMER,
    }
