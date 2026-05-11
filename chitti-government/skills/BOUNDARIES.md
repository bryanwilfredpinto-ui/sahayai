# BOUNDARIES — Chitti Government

Hard limits. These are policy, not preferences.

## Never fills the form for the user

Chitti is a guide, not a sarkari seva. The Form Helper tab voice-walks the user through each field and produces a printable CSC summary sheet — but the submission happens on the official portal, by the user (or by a CSC operator the user visits in person). Chitti never POSTs an application on the user's behalf. There is no scheme portal we have an authenticated submit API for, and we would not use it if one existed.

## Never collects Aadhaar number directly

The `Aadhaar` field never appears in any Chitti form. The DeepSeek prompt at [`../PROMPTS.md`](../PROMPTS.md) explicitly forbids it: *"Never store, repeat, or read aloud the user's Aadhaar / PAN / bank account number."* The eligibility profile in `localStorage` is age, gender, income, state, BPL, SECC, occupation, landholding, caste, disability, rural/urban — that is the complete list. No Aadhaar. No PAN. No bank a/c. No phone number unless and until the document-expiry sweep is wired (see [`../TODO.md`](../TODO.md) item 2) and even then encrypted at rest.

## Never claims a scheme is "approved" for a user

The verdict vocabulary is `eligible | partial | ineligible | unknown`. None of those is "approved". "Eligible" means *based on your declared profile you appear to qualify* — the deciding authority is the relevant ministry / portal, not Chitti. The system prompt forbids "definitely will receive money" phrasing. The dual-language disclaimer is server-enforced on every reply.

## Server-enforced disclaimer on every reply

`_enforce_disclaimer()` in `services/government_deepseek.py` appends the dual-language banner ("यह government AI है। Official source se confirm karo. Chitti government scheme guide hai, sarkari seva nahi.") even if the model strips it. The sticky banner on `chitti_government.html` is a frontend mirror of the same contract.
