# Chitti Government — DeepSeek Prompts

Chitti Government uses **DeepSeek** (`deepseek-chat` via
`https://api.deepseek.com/chat/completions`) for one purpose only: turning
the deterministic rule-engine verdict into a friendly 80–120-word spoken
summary for blind / illiterate / elderly users.

> **Architectural rule:** DeepSeek phrases the verdict. It cannot
> overrule it. The verdict object is returned to the frontend verbatim
> alongside the prose so the user sees the deterministic per-rule
> pass/fail card.

Source: [`backend/services/government_deepseek.py`](backend/services/government_deepseek.py).

Call parameters (from [`backend/config.py`](backend/config.py)):

| Parameter | Default | Override env |
| --- | --- | --- |
| Model | `deepseek-chat` | `DEEPSEEK_MODEL` |
| URL | `https://api.deepseek.com/chat/completions` | `DEEPSEEK_URL` |
| `max_tokens` | `700` | `DEEPSEEK_MAX_TOKENS` |
| `temperature` | `0.2` | `DEEPSEEK_TEMPERATURE` |
| HTTP timeout | 30 s | hard-coded in service |

If `DEEPSEEK_API_KEY` is empty the service short-circuits to
`_fallback_reply()` (see "Deterministic fallback" below) — the feature is
never a "coming-soon".

---

## 1. The eligibility-coach system prompt — `CHITTI_GOV_PROMPT`

Used on every `/api/government/eligibility/check` call.

```text
You are Chitti Government, a voice-first AI guide for Indian users
(blind, deaf, mute, illiterate, elderly) who want to understand whether
they qualify for a government scheme.

YOUR PERSONALITY:
- Calm, patient, plain-language. Imagine speaking to a 65-year-old
  farmer who is hearing this through a phone speaker.
- Short sentences. No jargon. Whenever you must use a government term,
  define it in the same sentence the first time.
- Reply in the user's chosen language (Hindi or English by default).
  For Hindi, use simple Devanagari, no Sanskritised vocabulary.

WHAT YOU SAY:
- A single 80-120-word spoken summary that contains:
  1) The verdict in plain words ("Yes you qualify" / "Likely yes, please
     confirm one detail" / "I'm afraid this scheme is not for you").
  2) Which 2-3 rules were the deciding factors. Reference them by
     everyday names ("aapki umar", "aapki saalana aamdani"), not by
     predicate keys.
  3) The next concrete step: which document to keep ready, which
     official portal to visit, or which helpline to call.
  4) ONE short reminder that the user should always confirm with the
     official scheme portal — never on Chitti's word alone.

WHAT YOU NEVER SAY:
- Never invent rupee amounts, helpline numbers, or eligibility rules
  that are not in the structured input I give you.
- Never tell a user they "definitely will" receive money — only the
  government can decide that.
- Never claim Chitti can submit the application or fetch the status
  from a portal we do not have an API for.
- Never store, repeat, or read aloud the user's Aadhaar / PAN / bank
  account number.

ALWAYS:
- End the reply with this exact dual-language disclaimer line:
  "यह government AI है। Official source se confirm karo. Chitti
   government scheme guide hai, sarkari seva nahi."
```

**Design notes**

| Constraint | Why |
| --- | --- |
| "Imagine speaking to a 65-year-old farmer on a phone speaker." | Forces short sentences, removes UI references. |
| "No jargon; define government terms on first use." | "Eligible" / "SECC" / "deprivation" must be expanded inline. |
| "Reply in the user's chosen language." | The user message specifies the target language by name. |
| "80-120 spoken words, single paragraph." | Reads cleanly in TTS at ~150 wpm = ~45-50 s. |
| "Never invent rupee amounts, helpline numbers, eligibility rules." | The deterministic verdict provides them; hallucinated numbers would be unsafe. |
| "Never store / repeat / read aloud Aadhaar / PAN / bank a/c." | Privacy contract — even if the user asks. |
| "End with the exact dual-language disclaimer." | Enforced server-side by `_enforce_disclaimer()` regardless of model output. |

---

## 2. The user-message template — structured rules block

Built per call by `_format_rules_for_llm(verdict_obj)` in
[`backend/services/government_deepseek.py`](backend/services/government_deepseek.py)
and concatenated with a language directive.

```text
(Reply in {language_name}, 80-120 spoken words, single paragraph.)

VERDICT: eligible
SCHEME: Pradhan Mantri Kisan Samman Nidhi (Ministry of Agriculture & Farmers Welfare)
BENEFIT: Rs 6,000 / year direct cash transfer in three Rs 2,000 instalments to land-owning farmer families.
RULES:
  - Occupation: farmer: pass
  - Landholding ≥ 0.01 ha: pass
EXCLUSIONS:
  - income-tax payer
  - central / state government employee (Group A or B)
  - MP, MLA, Mayor, Zilla Parishad chairperson
  - professionals: doctors, engineers, lawyers, CAs in active practice
  - retired pensioner with monthly pension >= Rs 10,000 (excl. Group D)
DOCUMENTS_REQUIRED:
  - Aadhaar
  - Bank passbook
  - Land ownership records (khasra / khatauni)
OFFICIAL_PORTAL: https://pmkisan.gov.in/RegistrationFormnew.aspx
HELPLINE: 155261 / 011-24300606
```

`language_name` is resolved from the `_LANG_NAMES` map:

```python
_LANG_NAMES = {
    "hi": "Hindi (simple Devanagari)",
    "en": "English",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "or": "Odia",
    "pa": "Punjabi",
    "ur": "Urdu",
}
```

Unknown language codes pass through verbatim ("if the user passes 'sa'
the prompt asks for Sanskrit" — sane fallback for Voice Factory's
26-language reach).

---

## 3. Disclaimer enforcement — `_enforce_disclaimer()`

The system prompt asks DeepSeek to end with the dual-language line. We do
not trust the model — we append it server-side too:

```python
GOV_DISCLAIMER = (
    "यह government AI है। Official source se confirm karo. "
    "Chitti government scheme guide hai, sarkari seva nahi."
)

def _enforce_disclaimer(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return GOV_DISCLAIMER
    if "Chitti government scheme guide hai" not in text:
        text = text.rstrip() + "\n\n" + GOV_DISCLAIMER
    return text
```

This guarantees every reply (DeepSeek path or fallback) ends with the
exact sticky-banner copy.

---

## 4. Deterministic fallback — `_fallback_reply()`

When `DEEPSEEK_API_KEY` is empty OR the call fails (HTTP error / network
blip / malformed JSON), the service falls back to a synthesised reply so
the feature never goes dark.

| Verdict | Opening line |
| --- | --- |
| `eligible` | "Good news — based on the details you shared, you appear to qualify for **{scheme}**." |
| `partial` | "You may qualify for **{scheme}**, but I need a couple more details before I can be sure." |
| `ineligible` | "I'm sorry — based on the details you shared, you do not qualify for **{scheme}** right now." |
| `unknown` | "I don't have enough information yet to tell you about **{scheme}**." |

Then concatenated:
`{benefit_summary_en} Official portal: {url} Helpline: {phone}` —
ending with the dual-language disclaimer.

The response envelope flags this case so the frontend can show a "running
in offline mode" badge:

```json
{ "ok": true,
  "source": "rule_engine_fallback",
  "language": "hi",
  "reply": "...",
  "model": null,
  "error": "deepseek_http_429"   // optional, only when DeepSeek failed
}
```

(`source = "deepseek"` when the LLM reply succeeded.)

---

## 5. Voice handoff lines (not LLM — static templates)

Two voice handoff strings ship in
[`backend/routes/government.py`](backend/routes/government.py) for the
status-tracker. These are pre-written, NOT generated by DeepSeek, because
they must be deterministic — the user is about to leave Chitti for a
government portal and we cannot risk an LLM hallucination at the handoff
moment.

When `status_check_url` exists:

```
EN: "I will now open the official {scheme_name} status page. Enter your
     registration number or Aadhaar there. Chitti does not see those
     details."
HI: "Main {name_hi} ka sarkari status page khol raha hoon. Wahaan apna
     registration number ya Aadhaar daaliye. Chitti ko ye details
     nahin dikhti."
```

When no status URL exists:

```
EN: "Application status for {scheme_name} cannot be checked through
     Chitti yet. The official portal at {source_url} is the only
     authoritative source."
HI: "{name_hi} ke aavedan ki sthiti Chitti se nahin dikhayi ja sakti.
     Sarkari portal hi ekmatra sahi srot hai."
```

These guarantee the four-user contract: blind users get a TTS-ready line,
illiterate users get plain Hindi, and the deterministic phrasing is
auditable.

---

## 6. Prompt-tuning checklist (operator)

If the eligibility coach starts misbehaving (hallucinates rupee amounts,
skips the disclaimer, refuses to switch language), check in order:

1. Did `_format_rules_for_llm()` give DeepSeek the right structured input?
   Log the `structured` string from
   [`backend/services/government_deepseek.py`](backend/services/government_deepseek.py)
   line ~143.
2. Was `language` passed correctly through `/eligibility/check`? Default
   is `hi` — verify the frontend body.
3. Did the disclaimer get stripped? `_enforce_disclaimer()` will re-attach
   it, but a model that strips it consistently is a prompt-tuning signal.
4. Lower `temperature` further (currently `0.2`) if the coach is
   inventing amounts. Raise `max_tokens` if it's getting cut off.
5. If DeepSeek is unavailable for >30 s the `_fallback_reply()` text is
   what your users will hear — re-read it and decide whether it's good
   enough; the source field tells you when fallback kicked in.
