# Chitti CA — DEVILS_ADVOCATE

Eight honest critiques of the current build. Listed so we do not pretend the stub is more than it is.

## 1. DeepSeek knowledge cutoff vs the annual budget

Slab rates, surcharges, `87A` rebates, and `44AB` thresholds change every February. The model's training cutoff lags. Until we wire a live cross-ref to the income-tax portal, **the rate Chitti quotes may already be stale on the day it is read**. Current mitigation: prompt forces "verify on portal" caveats; no live lookup.

## 2. Twelve-language map is narrower than Voice Factory's twenty-six

[../backend/services/ca_service.py](../backend/services/ca_service.py) maps 12 Indian languages. Chitti Voice Factory ships 26 (including Sanskrit and Oraon). A user who speaks one of the missing 14 will see their language code passed through verbatim as the language name, which is graceful but second-class. Should be unified.

## 3. No file / PDF upload

The user cannot share their actual Form 16, their 26AS, or a scan of the notice they received. They must paste text. For a notice in image form, or a multi-page PDF return, this is a real blocker. Vision support pending the DeepSeek-vision provider switch.

## 4. Browser-only voice IO

[../TODO.md](../TODO.md) calls this out. `webkitSpeechRecognition` and `SpeechSynthesis` have patchy Indian-language coverage — especially Odia, Punjabi, Urdu, Malayalam. Until we proxy through Chitti Voice Factory's 4-supplier cascade, the four-user contract is weaker on phones without Web Speech.

## 5. No multi-turn

A notice-reading flow ("here's the notice — now what do I do?") naturally wants 2–3 turns. The stateless guarantee makes that impossible. Users must paste full context every time.

## 6. No rate limiting

Free-tier Render exposed without per-IP throttling. A single noisy client can drain the DeepSeek budget. Acceptable while traffic is small, dangerous once linked from `index.html`.

## 7. No disclaimer-injection metric

We assume `_enforce_disclaimer()` runs on every reply. There is no counter or log line proving it. See [OBSERVABILITY.md](OBSERVABILITY.md) — a substring-audit metric is the cheapest fix and is not yet wired.

## 8. Topic chip is a free-text hint, not a constraint

[../routes/ca.py](../backend/routes/ca.py) accepts `topic` as any string and forwards it as a hint. A tighter enum + per-topic prompt-prefix would let us pin the latest GST threshold for the `GST` topic, the right `ITR-x` table for the `ITR` topic, etc.
