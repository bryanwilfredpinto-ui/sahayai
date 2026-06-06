# SOP-V002 — Intent Routing

> Standard Operating Procedure for routing a user's request to the correct
> internal Chitti service. Per SAHAYAI_MASTER.md §2 (Vaani sole interface).
> Target: >= 85% intent-route accuracy on held-out judge eval.

---

## Triggered When

- Any user message arrives at `/api/vaani/ask` (text or transcribed voice).
- A follow-up turn arrives within the same conversation session.
- The user's previous intent produced a session context that should influence routing.

---

## Procedure

### Step 1 — Pre-processing (< 50 ms)

1. Strip leading/trailing whitespace and normalise Unicode (NFC).
2. Detect language via Language Agent (Agent 2).
3. Retrieve session context: `last_intent`, `last_target_chitti`, turn count.
4. Sanitise PII: phone numbers, Aadhaar numbers, bank account numbers replaced
   with `<PHONE>`, `<AADHAAR>`, `<ACCOUNT>` tokens for classification.
   Originals are preserved in a separate `pii_vault` payload for action execution.

### Step 2 — Emergency Pre-check (< 5 ms, runs before everything else)

5. Run `is_emergency_keyword(text, lang)` against the Safety Agent keyword list.
6. If True: route IMMEDIATELY to Safety Agent — skip all other steps.
   Emergency routing never waits for the full classification pipeline.

### Step 3 — Intent Classification (rules-only, < 100 ms)

7. Run keyword-tier matching (T1 / T2 / T3 / NEG) against `data/intent_routing_table.json`.
8. Compute `route_confidence` from tier weights + session context boost.
9. Check for negative-keyword veto — veto hard-removes the candidate category.
10. Produce ranked `(intent_slug, target_chitti, confidence)` tuple.

### Step 4 — Confidence Handling

11. If `confidence >= 0.85`: route directly to `target_chitti`, no confirm.
12. If `0.70 <= confidence < 0.85`: route directly but log as "mid-confidence
    route" for swarm monitoring (no user-facing confirm needed at this band).
13. If `0.50 <= confidence < 0.70`: confirm before routing.
    Vaani speaks: *"Yeh [domain] se related lagta hai — kya main [target] ko
    bhejun?"* Wait for haan. If nahi: ask the user to rephrase.
14. If `confidence < 0.50` (fallthrough): Vaani answers from its own DeepSeek
    corpus. `target_chitti = "chitti-vaani-direct"`. No confirm needed.

### Step 5 — HIGH-risk Chitti Extra Gate

15. If `target_chitti` is in `[chitti-ca, chitti-legal, chitti-medupi]`
    AND `confidence >= 0.70`: proceed to routing.
16. If the routed Chitti will PERFORM an action (not just return information):
    Action Agent (Agent 5) will gate that action separately. This step is
    information-routing only.
17. Log the route decision to `routing_audit.db` with `confidence` +
    `matched_keywords` + `rule_version` for swarm analysis.

### Step 6 — Proxy the Request

18. Issue an internal HTTPS GET/POST to the target Chitti's API endpoint
    with the original user text + lang + disability_profile.
    Timeout: 10 s (Vaani surfaces an honest error on timeout, never silently waits).
19. Receive the target Chitti's response payload.

### Step 7 — Response Assembly

20. Prepend the route provenance to the response:
    *"Chitti [target_display_name] se answer aa raha hai:"*
    (spoken for blind users; shown as a small chip for sighted users)
21. Attach `route_confidence` to the response payload for Trust Agent (Agent 6).
22. Pass to Empathy Agent -> Safety Agent -> Action Agent -> Trust Agent in order.

### Step 8 — Fallthrough (Step 14 path)

23. If `fallthrough = true`: POST to DeepSeek with the full Vaani system prompt.
24. DeepSeek returns an answer. Response is assembled WITHOUT a "routed from X"
    prefix — it is a Vaani-direct answer.
25. Trust Agent still runs: disclaimer, confidence band, fabrication check.

---

## Session Context Rules

- Session context (last_intent + last_target_chitti) is maintained for 5 turns
  or until a deliberate topic-change signal is detected.
- Topic-change signals: "kuch aur poochna tha", "alag sawaal", "wapis", "home".
- On topic change: session context is reset. The next intent is classified
  fresh with no inheritance.
- Session context is stored in `localStorage.chitti_vaani_session` on the client.
  It is never sent to the backend (privacy) — only `last_intent` is inferred
  server-side from the conversation turn sequence.

---

## Escalation

| Condition | Action |
|---|---|
| Target Chitti returns 5xx | Vaani speaks: "Chitti [X] abhi uplabdh nahi hai — thodi der mein try karein." Layer-5 fallback chain attempted (DeepSeek -> Claude -> Gemini) |
| Target Chitti returns 404 | Vaani speaks: "Is sawaal ka jawab Chitti ke paas abhi nahi hai." Logged as RED in founder dashboard |
| Classification produces two equal-confidence targets | Tie-broken by session context; if no context, first alphabetically; never asks the user to choose between internal Chittis |
| User corrects Vaani's route ("nahi, yeh legal nahi hai, yeh CA wali baat hai") | Re-route to `chitti-ca`; session context updated; no re-confirm needed on explicit user correction |

---

## What We NEVER Do

- NEVER expose internal Chitti slug names to the user (say "Chitti Tax Expert",
  not "chitti-ca").
- NEVER route an emergency keyword through the normal classification pipeline.
- NEVER use an LLM to decide which Chitti to route to.
- NEVER ask the user "which Chitti do you want?" as a disambiguation strategy.
- NEVER silently drop a query — fallthrough always gets a DeepSeek-direct answer.
- NEVER route a HIGH-risk Chitti query without logging `matched_keywords` and
  `rule_version` to `routing_audit.db`.

---

## Verification

- Automated: `backend/tests/test_router_agent.py` — 4 Sire worked examples must pass.
- Judge eval (manual quarterly): 50 queries per Chitti target; precision >= 85%.
- Cert artefact: `tools/cert_screenshots/chitti_vaani_routing_375.png`.

---

Last reviewed: 2026-06-06
