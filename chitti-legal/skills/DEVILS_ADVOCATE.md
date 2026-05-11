# DEVILS_ADVOCATE — Chitti Legal

Eight honest critiques. Every one of these is a real gap. Some are on [../TODO.md](../TODO.md); the rest are listed here so a future engineer cannot claim "nobody told me."

## 1. Knowledge cutoff vs Bharatiya Nyaya Sanhita 2023

IPC, CrPC, and the Indian Evidence Act were replaced on 1 July 2024 by BNS / BNSS / BSA. Old IPC section numbers (302, 376, 420 etc.) are now under different BNS numbers. DeepSeek's training data may still mostly say "IPC 302". Replies risk being technically stale. Mitigation: [GUARDRAILS.md](GUARDRAILS.md) hedge rule, but no automated check.

## 2. PII scrubbing not implemented

The system prompt forbids *echoing* Aadhaar / PAN. But the user's pasted text — which may contain those numbers — is sent verbatim to DeepSeek. No regex scrub on the inbound `text` in [../backend/services/legal_service.py](../backend/services/legal_service.py). Logging on `httpx` error paths can leak the first 200 chars. On [../TODO.md](../TODO.md).

## 3. No PDF / image upload

The page placeholder says "paste any rent agreement, notice, NDA…" but the only input is a textarea. A blind user with a paper Sec 138 notice cannot get it in. No OCR endpoint, no `multipart/form-data` route. This blocks the very user the product is designed for. On [../TODO.md](../TODO.md).

## 4. No statute look-up

The prompt forbids invented citations, but there is no IndiaCode cross-reference, no Manupatra integration, no LiveLaw feed. The disclaimer is the only safety net for hallucinated section numbers. See [TRUTH_SOURCES.md](TRUTH_SOURCES.md).

## 5. No deadline rule-check

The prompt says "for time-sensitive notices, open with the response window." Nothing in code verifies this. If `doc_type` contains "138" or "summons" and the first sentence does not mention a deadline, nobody catches it.

## 6. Voice-out gaps for or-IN, pa-IN, ur-IN

The frontend calls browser `SpeechSynthesisUtterance` with `lang = <code>-IN`. Real browser voice support for Odia, Punjabi, Urdu is patchy. Deaf-illiterate users on those locales lose the voice-out promise. Routing through Chitti Voice Factory (Tier C never-silently-falls-back) is the fix.

## 7. No rate limit / no abuse guard

Public endpoint, no auth, 8000-char cap, 30s timeout. A single bad actor can burn the free-tier DeepSeek quota in an afternoon.

## 8. No streaming

Long notices take 6–8 seconds. Screen readers wait the full duration before reading anything. Streaming would let a blind user start hearing the reply sooner.

