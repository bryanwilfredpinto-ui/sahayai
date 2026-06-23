"""
services/jobs_deepseek.py  —  BO7  (application drafter)
-------------------------------------------------------
Drafts the application email + cover letter in the USER's voice, adapted
to their level (CEOS §21 / §23B Step 6). DeepSeek is the sole LLM (§2
lock). If the key is missing or the call fails, a deterministic drafter
produces a real, sendable draft — the feature is always LIVE, never a
"coming soon" and never an invented credential.

Constitution enforcement (server-side, non-negotiable):
  Art 3  — first person, the user's own voice.
  Art 4  — NEVER fabricate experience/qualifications. The system prompt
           forbids it and the deterministic fallback only restates facts
           already in the user's profile.
  Art 1/5 — output is a DRAFT. Chitti never sends it; the user reviews,
           edits, approves, and sends via the mailto: hand-off (BO8).

Gap narratives (§23C) are injected when career_situation indicates a gap.
"""
from __future__ import annotations

import logging
import re

import httpx

from config import settings

log = logging.getLogger("services.jobs_deepseek")


_TONE_BY_LEVEL = {
    "fresher": "enthusiastic, potential- and learning-focused, humble but eager; lead with projects, internships, coursework",
    "junior": "efficient and targeted; lead with concrete achievements and tools used",
    "mid": "achievement-focused and metrics-driven; quantify impact, show ownership",
    "senior": "strategic and peer-level; emphasise scope, leadership, and outcomes",
    "cxo": "visionary, board-level gravitas; brief, compelling, results-and-strategy framed",
}

_GAP_SITUATIONS = {"career_change", "returning", "laid_off"}

_GAP_TEMPLATES = {
    "laid_off": (
        "Following a role eliminated in an organisational restructuring, I used the time "
        "productively to keep my skills current, and I am ready to contribute from day one."
    ),
    "returning": (
        "After a planned career break, I have kept my skills current and I am fully "
        "re-energised to bring my experience to this role."
    ),
    "career_change": (
        "I am deliberately transitioning into this field; my prior experience gives me a "
        "perspective most candidates do not have, and I have invested in the relevant skills."
    ),
}


_DRAFTER_PROMPT = """You are Chitti Jobs, drafting a job application AS THE USER (first person, their voice).

HARD RULES (never break):
- NEVER invent experience, employers, degrees, certifications, dates, or metrics. Use ONLY facts from the user's profile/resume provided below. If a detail is missing, write around it — never fabricate.
- Sound like the user wrote it: natural, specific, no robotic template phrasing, no "I am writing to apply for the position of...".
- Adapt the tone to the user's level.
- If a career gap is indicated, address it honestly and confidently in ONE sentence — never apologetic, never hidden.
- Naturally weave in the suggested ATS keywords where TRUTHFUL given the resume — do not keyword-stuff or claim skills not supported by the resume.

OUTPUT FORMAT (exactly, no extra commentary):
SUBJECT: <one-line email subject>
EMAIL:
<3-5 short paragraphs, ready to send>
COVER_LETTER:
<a slightly longer formal cover letter, same facts>
"""


def _profile_block(profile: dict, job: dict, ats: dict | None) -> str:
    parts = [
        f"USER NAME: {profile.get('name') or '(not provided)'}",
        f"LEVEL: {profile.get('user_level') or 'unknown'}  "
        f"(tone: {_TONE_BY_LEVEL.get(profile.get('user_level',''), 'professional, concise')})",
        f"EXPERIENCE (years): {profile.get('experience_years')}",
        f"CURRENT ROLE: {profile.get('current_role') or '(not provided)'}",
        f"CAREER SITUATION: {profile.get('career_situation') or 'actively_hunting'}",
        f"RESUME / BACKGROUND:\n{(profile.get('resume_text') or '(no resume on file)')[:3000]}",
        "",
        f"TARGET JOB TITLE: {job.get('title')}",
        f"COMPANY: {job.get('company') or '(unknown)'}",
        f"LOCATION: {job.get('location') or ''}",
        f"JOB DESCRIPTION:\n{(job.get('jd_text') or '')[:3000]}",
    ]
    if ats and ats.get("suggestions"):
        parts.append("ATS KEYWORDS TO INCLUDE IF TRUTHFUL: " + ", ".join(ats["suggestions"]))
    sit = (profile.get("career_situation") or "").lower()
    if sit in _GAP_SITUATIONS:
        parts.append("GAP GUIDANCE: " + _GAP_TEMPLATES.get(sit, ""))
    return "\n".join(parts)


def _parse_output(text: str) -> dict:
    subj = re.search(r"SUBJECT:\s*(.+)", text)
    email_m = re.search(r"EMAIL:\s*(.+?)(?:COVER_LETTER:|$)", text, re.S)
    cover_m = re.search(r"COVER_LETTER:\s*(.+)$", text, re.S)
    return {
        "subject": (subj.group(1).strip() if subj else "").strip() or None,
        "email_body": (email_m.group(1).strip() if email_m else "").strip() or None,
        "cover_letter": (cover_m.group(1).strip() if cover_m else "").strip() or None,
    }


def _fallback_draft(profile: dict, job: dict, ats: dict | None) -> dict:
    """Deterministic, fact-only draft so BO7 is always LIVE without a key."""
    name = profile.get("name") or "Candidate"
    role = job.get("title") or "the role"
    company = job.get("company") or "your organisation"
    cur = profile.get("current_role")
    yrs = profile.get("experience_years")
    sit = (profile.get("career_situation") or "").lower()

    intro = f"I am writing to express my interest in {role} at {company}."
    cred_bits = []
    if cur:
        cred_bits.append(f"I currently work as {cur}")
    if yrs not in (None, ""):
        cred_bits.append(f"with {yrs} years of experience")
    cred = (", ".join(cred_bits) + ".") if cred_bits else ""
    gap = (" " + _GAP_TEMPLATES[sit]) if sit in _GAP_SITUATIONS else ""
    close = (
        "I have attached my resume and would welcome the chance to discuss how I can "
        f"contribute to {company}. Thank you for your time and consideration."
    )
    email_body = "\n\n".join(p for p in [
        f"Dear Hiring Team,",
        intro + (" " + cred if cred else "") + gap,
        close,
        f"Warm regards,\n{name}",
    ] if p)
    cover_letter = email_body
    subject = f"Application for {role}" + (f" — {name}" if name != "Candidate" else "")
    return {"subject": subject, "email_body": email_body, "cover_letter": cover_letter}


def draft_application(profile: dict, job: dict, ats: dict | None = None) -> dict:
    """Return {ok, source, subject, email_body, cover_letter, model}."""
    if not settings.DEEPSEEK_API_KEY:
        d = _fallback_draft(profile, job, ats)
        return {"ok": True, "source": "deterministic_fallback", "model": None, **d}

    user_msg = _profile_block(profile, job, ats)
    body = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": _DRAFTER_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "max_tokens": settings.DEEPSEEK_MAX_TOKENS,
        "temperature": settings.DEEPSEEK_TEMPERATURE,
    }
    headers = {"Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}", "Content-Type": "application/json"}

    def _call(_safe_text: str) -> str:
        with httpx.Client(timeout=40.0) as client:
            r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]

    try:
        from flask import current_app
        hooks = current_app.config.get("CHITTI_HOOKS")
    except Exception:  # noqa: BLE001
        hooks = None

    try:
        if hooks is not None:
            wrapped = hooks.wrap_llm(_call, user_text=user_msg, ctx={})
            if wrapped.get("blocked"):
                d = _fallback_draft(profile, job, ats)
                return {"ok": True, "source": "deterministic_fallback", "model": None,
                        "rail": wrapped.get("rail"), **d}
            raw = wrapped["reply"]
        else:
            raw = _call(user_msg)
    except (httpx.HTTPError, KeyError, ValueError) as e:
        log.warning("DeepSeek draft failed, using fallback: %s", e)
        d = _fallback_draft(profile, job, ats)
        return {"ok": True, "source": "deterministic_fallback", "model": None,
                "error": str(e)[:160], **d}

    parsed = _parse_output(raw)
    if not parsed.get("email_body"):  # unparseable → safe fallback
        d = _fallback_draft(profile, job, ats)
        return {"ok": True, "source": "deterministic_fallback", "model": None, **d}
    return {"ok": True, "source": "deepseek", "model": settings.DEEPSEEK_MODEL, **parsed}


def health() -> dict:
    return {
        "ok": True,
        "service": "chitti-jobs",
        "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
        "model": settings.DEEPSEEK_MODEL,
    }
