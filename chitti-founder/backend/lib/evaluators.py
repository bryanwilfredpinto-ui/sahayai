"""
lib/evaluators.py
-----------------
LLM-as-judge evaluators that score completed responses *asynchronously*
(i.e. they don't block the user request — they run on a background queue
or are invoked nightly by the Founder report).

Four dimensions per response:

  correctness    — is the answer accurate given the question + sources?
                   Score 0.0-1.0. Sources are the same `truth_sources`
                   the TruthRail uses.
  tone           — rude / friendly / professional / patronising. Score 0-1
                   where 1 = warm + professional fit for the Four-User Contract.
  helpfulness    — does the answer move the user toward their goal?
                   Score 0-1. Different from correctness — a correct-but-
                   unhelpful answer (e.g. "I don't know") scores low here.
  hallucination  — fraction of factual claims in the answer NOT supported
                   by sources. Score 0-1 where 0 = no hallucination.

All four use DeepSeek as judge (the same provider Chittis already speak,
keeps the dep surface small). The judge sees: user input + model output +
sources + Chitti name. It returns a strict JSON envelope we parse.

Cost
----
Each evaluation = 1 DeepSeek call. The Founder report runs evaluators
nightly on a *sample* (default 50 responses per Chitti per day) to keep
the bill predictable. To evaluate everything, change EVAL_SAMPLE_RATE.
"""
from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass, asdict
from typing import Any

import httpx


log = logging.getLogger("evaluators")


# ---------- DeepSeek client (minimal, reused across Chittis) --------------


DEEPSEEK_URL = os.environ.get("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
EVAL_SAMPLE_RATE = float(os.environ.get("EVAL_SAMPLE_RATE", "0.10"))  # 10% default


# ---------- Judge prompt --------------------------------------------------


_JUDGE_PROMPT = """You are an evaluator for a Bharat-themed AI assistant family.
The assistant being evaluated is called {chitti} and its job is described below.

Chitti job:
{chitti_job}

Score the assistant's response on FOUR axes. Each score MUST be a float 0.0–1.0.

  correctness   1.0 = factually right (matches sources); 0.0 = wrong.
  tone          1.0 = warm + professional + culturally appropriate for blind/deaf/mute/illiterate users; 0.0 = rude / patronising / robotic.
  helpfulness   1.0 = moves the user toward their goal; 0.0 = useless even if technically correct.
  hallucination 0.0 = every factual claim supported by sources; 1.0 = mostly fabricated.

Output strict JSON only, no prose. Schema:
{{"correctness": float, "tone": float, "helpfulness": float, "hallucination": float, "rationale": "short string"}}

USER INPUT:
{user_input}

ASSISTANT OUTPUT:
{model_output}

GROUND-TRUTH SOURCES:
{sources}
"""


_CHITTI_JOB = {
    "chitti-medupi":   "Medicine cost intelligence. Strict same-composition matching only. Jan Aushadhi pricing. Never recommends a different salt/strength/form.",
    "chitti-news":     "Neutral news aggregator. Cross-references 2+ sources. Never editorialises. Equal coverage across parties.",
    "chitti-government": "Voice-first guide to Indian government schemes (PM-Kisan, Ayushman, ration). Patient explainer. Never names a specific broker / agent.",
    "chitti-vaani":    "Voice-first conversational layer. Reads back actions before executing. Never auto-dials cops. Family cascade for emergencies.",
    "chitti-ca":       "Plain-English Q&A on Indian tax/audit/GST. Never gives binding advice. Always closes with 'consult your CA before filing'.",
    "chitti-legal":    "Plain-English explainer for Indian law (IPC, CrPC, rent disputes, FIRs). Never drafts filings. Always closes with 'consult a licensed advocate'.",
    "chitti-shares":   "Indian equities educator using Buffett/Lynch/Graham/Greenblatt lenses. NEVER SEBI registered — banner is permanent. Never gives buy/sell advice.",
    "chitti-scanner":  "Document/object scanner with PII masking (Aadhaar / PAN last-4 only).",
    "chitti-upi":      "UPI fraud-text classifier. Returns HIGH/MEDIUM/LOW + warning. NEVER generates payment intents. NEVER moves money.",
    "chitti-logo-video": "Honest stub — SVG monogram + queued mock video. No real provider wired today.",
    "chitti-voice-factory": "Shared voice substrate. 4-supplier cascade. Tier C never silently falls back.",
    "chitti-sales":    "Sales coach for Indian MSMEs distilled from top 10 sales books. Never gives manipulative dark-pattern tactics.",
}


# ---------- Public types --------------------------------------------------


@dataclass
class EvalScores:
    correctness: float
    tone: float
    helpfulness: float
    hallucination: float
    rationale: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


# ---------- The evaluator -------------------------------------------------


def evaluate_response(
    chitti: str,
    user_input: str,
    model_output: str,
    sources: list[str] | None = None,
    timeout: float = 30.0,
) -> EvalScores | None:
    """Call DeepSeek-as-judge. Returns None on configuration / API errors."""
    if not DEEPSEEK_KEY:
        log.info("EVAL skipped: no DEEPSEEK_API_KEY")
        return None

    sources_block = "\n".join(f"- {s}" for s in (sources or [])) or "(no sources provided)"
    chitti_job = _CHITTI_JOB.get(chitti, "Bharat-themed AI assistant.")
    prompt = _JUDGE_PROMPT.format(
        chitti=chitti, chitti_job=chitti_job,
        user_input=_clip(user_input, 2000),
        model_output=_clip(model_output, 3000),
        sources=_clip(sources_block, 2000),
    )

    body = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": "You are a strict response evaluator. Output only JSON."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.0,
        "max_tokens": 400,
        "response_format": {"type": "json_object"},
    }
    headers = {"Authorization": f"Bearer {DEEPSEEK_KEY}", "Content-Type": "application/json"}

    try:
        with httpx.Client(timeout=timeout) as client:
            r = client.post(DEEPSEEK_URL, headers=headers, json=body)
        if r.status_code != 200:
            log.warning("EVAL DeepSeek non-200: %s  %s", r.status_code, r.text[:200])
            return None
        content = r.json()["choices"][0]["message"]["content"]
        return _parse_judge_json(content)
    except Exception as e:  # noqa: BLE001
        log.warning("EVAL DeepSeek call failed: %s", e)
        return None


def _parse_judge_json(content: str) -> EvalScores | None:
    """Best-effort JSON parse with regex fallback."""
    txt = content.strip()
    # Models sometimes wrap JSON in ```
    txt = re.sub(r"^```(?:json)?\s*|\s*```$", "", txt, flags=re.IGNORECASE | re.MULTILINE)
    try:
        d = json.loads(txt)
    except json.JSONDecodeError:
        # Find the first {...} block
        m = re.search(r"\{[\s\S]*\}", txt)
        if not m:
            return None
        try:
            d = json.loads(m.group(0))
        except json.JSONDecodeError:
            return None
    try:
        return EvalScores(
            correctness=_clamp01(d.get("correctness", 0.0)),
            tone=_clamp01(d.get("tone", 0.5)),
            helpfulness=_clamp01(d.get("helpfulness", 0.5)),
            hallucination=_clamp01(d.get("hallucination", 0.5)),
            rationale=str(d.get("rationale", ""))[:500],
        )
    except (TypeError, ValueError):
        return None


def _clamp01(x: Any) -> float:
    try:
        v = float(x)
    except (TypeError, ValueError):
        return 0.5
    return max(0.0, min(1.0, v))


def _clip(s: str, n: int) -> str:
    return s if len(s) <= n else s[:n] + "…"


# ---------- Batch helper for the nightly sweep ----------------------------


def evaluate_batch(rows: list[dict]) -> list[dict]:
    """rows: [{chitti, user_input, model_output, sources}]. Returns same shape + scores."""
    out = []
    for row in rows:
        scores = evaluate_response(
            chitti=row["chitti"],
            user_input=row["user_input"],
            model_output=row["model_output"],
            sources=row.get("sources") or [],
        )
        out.append({**row, "scores": scores.to_dict() if scores else None})
    return out
