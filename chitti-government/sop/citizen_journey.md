# SOP — The Citizen Journey (7 steps)

> The standard operating flow every citizen passes through. Each step is voice-first,
> tap-safe, multilingual, and confirm-gated (Golden Rule). Maps to CEOS §9.

```
Step 1  Profile Creation        → Citizen Digital Twin (voice/tap, on-device)
   ↓
Step 2  Document Scan / Declare  → have / missing / unknown + unlock map
   ↓
Step 3  Eligibility Analysis     → deterministic rule-engine, per-rule trace
   ↓
Step 4  Benefits Discovery       → ranked eligible schemes + ₹ value + source
   ↓
Step 5  Action Plan              → documents to get, forms to fill, where to apply
   ↓
Step 6  Reminder / Deadline      → 90/30/7-day reminders (confirm-gated, SMS fallback)
   ↓
Step 7  Citizen Readiness Score  → Documents % · Schemes Claimed % · Benefits Missed · Readiness %
```

## Step contracts
1. **Profile** — never demands name/Aadhaar number; only what eligibility needs;
   blind users guided by voice, mute by tap.
2. **Documents** — declare path live; Universal Scanner honest `pick_or_describe`
   until vision funded.
3. **Eligibility** — `eligible|partial|ineligible|unknown`; missing input → `unknown`,
   never coerced.
4. **Benefits** — each scheme: benefit, eligibility trace, documents, apply link
   (source shown), nearest office.
5. **Action plan** — ordered by deadline urgency; "what to do next" in plain language.
6. **Reminders** — every reminder confirmed before set; delivered visually + by voice.
7. **Readiness** — one headline number; tap to drill into the to-do list.

Each step emits a `data-chitti-response` box (per-response widget) and is consumable by
all four users. The whole journey works **offline** (deterministic core) — DeepSeek
only warms the phrasing.
