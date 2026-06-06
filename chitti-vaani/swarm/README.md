# Chitti Vaani — Diagnostic & Quality Swarm (CEOS L6)

> Per COSDF v1.1 Level 6. Every user request passes through ALL six Vaani swarm
> agents in order. The output of agent N is the input of agent N+1. The final
> output is what the user hears or reads.
>
> This supersedes the implicit three-step flow (classify -> speak -> confirm) from
> before 2026-06-06. All six agents are now explicit and contractual.

---

## The 6 Agents in Order

| # | Agent | Question it answers | Status | Doc |
|---|---|---|---|---|
| 1 | **Router** | *"Which of the 14 Chittis should answer this, with what confidence?"* | LIVE | [`router_agent.md`](router_agent.md) |
| 2 | **Language** | *"What language is the user speaking? Can Voice Factory serve it?"* | LIVE | [`language_agent.md`](language_agent.md) |
| 3 | **Empathy** | *"Is the user in distress? Does the reply need a helpline strip?"* | LIVE | [`empathy_agent.md`](empathy_agent.md) |
| 4 | **Safety** | *"Does this touch emergency protocol or Golden Rule? Veto or proceed?"* | LIVE | [`safety_agent.md`](safety_agent.md) |
| 5 | **Action** | *"Is there a side-effecting action? Gate it through Golden Rule confirm."* | LIVE | [`action_agent.md`](action_agent.md) |
| 6 | **Trust** | *"Is the response honest? Confidence bands correct? No overconfidence?"* | LIVE | [`trust_agent.md`](trust_agent.md) |

---

## Hand-off Contract

```
user_request (text/voice + lang + disability_profile)
   |
   v
Agent 1 (Router)     -> intent_slug, route_confidence, target_chitti
   |
   v
Agent 2 (Language)   -> lang_normalised, voice_tier, tts_available
   |
   v
Agent 3 (Empathy)    -> distress_level [0-3], empathy_tone, helpline_required
   |
   v
Agent 4 (Safety)     -> safety_verdict [PROCEED / VETO / EMERGENCY], cascade_armed
   |                    (VETO or EMERGENCY block the pipeline here — supreme authority)
   v
Agent 5 (Action)     -> action_gated, confirm_question, awaiting_haan
   |                    (waits for explicit Yes before continuing)
   v
Agent 6 (Trust)      -> response_with_confidence_band, honest_notes, disclaimer_appended
   |
   v
FINAL OUTPUT TO USER (spoken via Voice Factory + rendered with per-response widget)
```

---

## Hard Rules

1. **Safety Agent (Agent 4) is the supreme veto** — it can block any response
   at any point, regardless of what Agents 1-3 produced. Order is fixed:
   Safety AFTER Empathy but BEFORE Action. An empathic response that enables
   a harmful action is blocked.

2. **No agent failure blocks publish** — each agent has an honest empty-state
   fallback. If the Router cannot classify, Vaani answers from its own corpus.
   If Language Agent cannot serve the language, it surfaces the honest Tier C
   message. Never silent failure.

3. **Order is fixed** — Router -> Language -> Empathy -> Safety -> Action -> Trust.
   Re-ordering breaks the contract (Safety must see the empathy context; Trust
   must see the full assembled response).

4. **No LLM in Agents 1, 4, 5 critical paths** — Router classification, Safety
   veto logic, and Golden Rule gate are rules-only. Agents 2, 3, 6 may invoke
   DeepSeek for the non-critical enrichment path but with honest fallback.

5. **Golden Rule is enforced at Agent 5** — if any action card bypasses
   `chittiConfirmAndDo()`, Agent 5 intercepts and corrects or blocks.

---

## Swarm Intelligence — How §2f Applies to Vaani

Per [SAHAYAI_MASTER.md §2f](../../SAHAYAI_MASTER.md), every Chitti of the same
type learns from every other Chitti of the same type.  For Vaani, this means:

### What the Swarm Collects (Daily — 07:00 IST)

- Per-response widget signals (thumbs up/down, per-box, per-language).
- Intent-route decisions and their `route_confidence` scores.
- Language fallback events (which language hit Tier C, how often).
- Distress-level detections (empathy_agent distress_level > 0).
- Safety vetoes and emergency cascade trigger events.
- Golden Rule confirm outcomes (haan / nahi / silence-timeout).
- Trust agent `honest_note` insertions and confidence band corrections.

All signals are **anonymised before collection** (user_id hashed, pincode
aggregated to district, timestamps rounded to hour). "Chitti forget" removes
a user's signals from the swarm entirely.

### What the Swarm Can Learn

- Better intent-classification rules for regional phrasing.
- Better distress-vocabulary coverage (e.g. new regional distress words with
  confirmed empathy escalations).
- Better voice-language auto-detection for code-switching (Hindi-English mix).
- Trust-band calibration (e.g. if route_confidence 0.72 consistently maps to
  user thumbs-down, tighten the confirm threshold).

### The >= 100 Confirmation Gate

A candidate pattern is not promoted until >= 100 same-type confirmations exist
across >= 2 P0 languages with no significant opposing signal over >= 7 days.

### HIGH-Risk Pattern Classes — Sire Approval Required

The following pattern classes require Sire's explicit approval before any
`skills/*.md` update is committed, regardless of sample size:

| Pattern class | Risk | Why |
|---|---|---|
| Psychology response templates | HIGH | Affects 6 crore+ distress users |
| Emergency cascade keyword additions | HIGH | Safety-critical; wrong trigger = harm |
| Helpline phone numbers | HIGH | A wrong number in a crisis = harm |
| DeepSeek system-prompt changes | HIGH | Can inadvertently weaken boundaries |
| Confidence band thresholds | MED | Affects route accuracy at scale |
| Language fallback messages | LOW | UX only; no safety impact |

### Locked Decisions the Swarm Can NEVER Modify

Per [SAHAYAI_MASTER.md §2f](../../SAHAYAI_MASTER.md): the Vaani swarm cannot
modify any of the following, even with 100,000 confirmations:

- The Golden Rule (`chittiConfirmAndDo()` gate, silence = wait, no timeout-to-yes)
- The emergency protocol (family cascade, COP_DENYLIST, never 112/100/102)
- The four-user accessibility contract (blind / deaf / mute / illiterate)
- The therapist-boundary and helpline-cascade requirement for psychology responses
- The DeepSeek-only LLM provider rule
- The Voice Factory Tier C honest-fallback requirement
- The User Disability Profile one-time prompt contract (never re-ask after Skip)
- The per-response widget requirement (no response ships without it)
- The ISL Phase 1 panel requirement

Any candidate pattern that would touch a locked decision is **auto-rejected at
weekly validation** with a reason code: `LOCKED_DECISION_<KEY>`.

---

## Swarm Cycle

| Stage | Frequency | Who runs it | Output |
|---|---|---|---|
| Collect | Daily 07:00 IST | chitti-founder digest job | `swarm_signals.db` |
| Validate | Weekly Sun 08:00 IST | chitti-founder weekly job | Validated patterns flagged `pending_human_review` |
| Push | Monthly 1st, 09:00 IST | CTO + Sire | Committed to `skills/*.md` |
| Quarterly review | Jan 1 / Apr 1 / Jul 1 / Oct 1 | Sire-led | Regressions reverted |

---

## Where the Code Lives

| Agent | Code path |
|---|---|
| 1 — Router | `../backend/services/vaani_service.py` `route_intent()` |
| 2 — Language | `../../chitti_lang.js` substrate + Voice Factory cascade |
| 3 — Empathy | `../backend/services/vaani_service.py` distress detection + `skills/PSYCHOLOGY.md` |
| 4 — Safety | `../backend/services/emergency_service.py` + `COP_DENYLIST` |
| 5 — Action | `chittiConfirmAndDo()` in `../../chitti_vaani.html` |
| 6 — Trust | `_enforce_disclaimer()` in `../backend/services/vaani_service.py` + confidence band |

---

## CI Guardrails

- `test_cop_denylist.py` — Safety Agent never routes to 112/100/102.
- `test_golden_rule_gate.py` — Action Agent never fires without explicit Yes.
- `test_psychology_disclaimer.py` — every psychology-path response carries helpline strip.
- `test_language_agent_tier_c.py` — Tier C returns honest message, never silent.
- `test_fail_open.py` — all six agents must work with all LLM env vars stripped.
- `test_swarm_locked_decisions.py` — no candidate pattern is promoted if it matches a
  locked-decision key.

---

Last reviewed: 2026-06-06
