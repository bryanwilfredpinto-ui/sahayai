🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# ARCHITECTURE — Chitti CA OS

```
                         User (any of 26 languages, any of 5 abilities)
                                          │  voice / tap / type
                                          ▼
                    ┌──────────────────────────────────────────────┐
                    │  Accessibility & Language layer (Module 0)     │
                    │  chitti_a11y.js · chitti_lang.js · feedback    │
                    │  voice-out · ISL · symbol+word · picture menus │
                    └──────────────────────────────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────────┐
                    │  Chitti CA OS — Financial Brain                │
                    │  DETERMINISTIC ENGINE (chitti_ca_os_engine.js) │
                    │  tax · gst · compliance · audit · doctor ·     │
                    │  govt-benefits · fraud · cfo · twin            │
                    │  ← all rupee math here, provenance-tagged      │
                    └──────────────────────────────────────────────┘
                          │                         │
            LLM ENHANCEMENT (optional)        SWARM (level agents)
            DeepSeek via chitti-ca-api        Bookkeeper→…→CA Partner
            explains, never calculates        + Govt/Fraud/Accessibility/
            honest stub if 429/offline          Trust/Memory agents
                          │                         │
                          ▼                         ▼
                    ┌──────────────────────────────────────────────┐
                    │  Trust Agent validates → Confidence Score      │
                    │  → Risks + Sources + Reasoning → Final Answer  │
                    └──────────────────────────────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────────┐
                    │  Financial Twin (on-device, lifelong memory)   │
                    │  PAN·GST·ITR·ROC·loans·insurance·timelines     │
                    └──────────────────────────────────────────────┘
```

## Final flow (per the CEOS SWARM spec)

```
User query → all relevant level/specialist agents vote → Trust Agent validates
→ confidence score generated → final answer (with risks + sources + reasoning)
```

## Layering principle (Founder Rule: deterministic core)

1. **Engine is the product.** `chitti_ca_os_engine.js` is a pure, dependency-free,
   deterministic library. Every rupee figure is computed here from the user's own
   numbers + a **versioned rule table** (slabs, GST rates, scheme criteria, due
   dates). It runs with the internet down and DeepSeek 429.
2. **LLM is an enhancement.** DeepSeek (via the existing `chitti-ca-api`, OpenAI-
   compatible per §2 lock) only *explains* engine output in the user's language. If
   the LLM is unavailable, the engine's own plain-language strings ship — honest
   stub, never a fabricated number.
3. **Voice/ISL/lang are substrate.** Loaded once from repo-root
   (`chitti_a11y.js`, `chitti_lang.js`, `feedback-widget.js`); every module inherits.

## Components

| Layer | Files | Notes |
|---|---|---|
| Frontend page | [`chitti_ca_os.html`](../../chitti_ca_os.html) | Tabbed, accessible, `#lang-select` (Vaani-canonical) |
| Engine | [`chitti_ca_os_engine.js`](../../chitti_ca_os_engine.js) | Deterministic, pure, testable in node |
| Controller | inline in the HTML | Wires buttons → engine → renders `data-chitti-response` boxes |
| Rule tables | inside the engine (`RULES` object, versioned) | Slabs FY24-25 / FY25-26, GST rates, scheme criteria, due dates |
| Backend (optional) | existing `chitti-ca-api` (Railway) | DeepSeek explain + server-enforced disclaimer + quality stack |
| DB | Turso (per-Chitti) for swarm/feedback; Financial Twin is on-device localStorage | §2 Turso direct-HTTPS shim |

## Data-ownership & privacy

Financial Twin lives in `localStorage` (key `chitti_ca_os_twin_v1`) — never leaves the
device unless the user explicitly exports. No PAN/GST number is sent to any LLM. "Chitti
forget" wipes the twin + tombstones any anonymised aggregate (matches §2b/§2f contract).

## Versioning of rule tables

Every rule table carries a `version` + `fy` + `effective_from`. When the Budget or a
GST-Council notification changes a number, only the table changes — the engine logic is
untouched. The active FY is shown to the user and spoken, so an answer is never silently
stale ([memory/rule_versioning.md](memory/rule_versioning.md)).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
