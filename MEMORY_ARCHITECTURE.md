# CHITTI MEMORY OS — Architecture Design
## Per-User Episodic Memory for every Chitti
**Status: DESIGN APPROVED — decisions locked (§11). BO1 ready to build.** | Version 1.0 | June 2026
**Author:** Claude (CTO role) | **Read first:** sahay_master.md · process.md (Stage 4 = design before code)

---

## 0. GOALS (from Sire's brief)

1. **Conversation memory** — remember earlier turns within a session.
2. **Cross-session memory** — remember the user across sessions (name, past queries, preferences, health profile, etc.).
3. **Storage** — Turso (structured) + ChromaDB (semantic/vector recall). Both already in the stack.
4. **Injection** — before every response, retrieve relevant memory and inject into the system prompt.
5. **Decay** — recent + important weighted higher; old/irrelevant deprioritised.
6. **Privacy** — user can view / edit / delete memory anytime (DPDP Act 2023).
7. **Cross-Chitti** — Medical-Chitti context yesterday is available to Legal-Chitti today, brokered by Vaani.

## 0a. DESIGN PRINCIPLES (locked-decision alignment)

- **Consent-first** (sahay_master v2.0 §7) → memory is **opt-in**, granular, and *never silent*.
- **Graceful** (the pattern we just shipped) → memory is **best-effort**; if Turso/Chroma fail, Chitti answers *without* memory. Memory **never** blocks or 500s a response.
- **Device-pseudonymous** → no login, no PII required to function (DPDP data-minimisation). A user is a client-generated UUID, not a name.
- **User owns it** → view / edit / delete / export, plus "Chitti sab bhool ja" full wipe (extends the existing *Chitti forget*).
- **Never fabricate** → if memory is empty, behave normally; if memory conflicts with what the user says now, **trust the user** and update.

---

## 1. IDENTITY MODEL

| | v1 (this build) | v2 (later) |
|---|---|---|
| Who is a user? | `chitti_uid` = UUIDv4 in `localStorage`, sent as **`X-User-Token`** header (already allow-listed in CORS) | Account login → same uid synced across devices |
| PII required? | **None** — pseudonymous | Optional (phone/Google) for cross-device sync |
| Scope | per-device | per-person |

The `X-User-Token` header already exists in the backends' CORS allow-headers, so the plumbing is partly there. v1 is one memory per device-user; cross-device sync is an explicit v2 (needs login → out of scope now).

---

## 2. MEMORY TIERS (the agent memory model)

| Tier | What | Lifetime | Store |
|---|---|---|---|
| **Working** | last K turns of the *current* session | session | client `sessionStorage` + mirrored to `mem_episode` |
| **Episodic** | durable log of past interactions (what asked / what Chitti did, which Chitti, when) | retained then summarised | **Turso** `mem_episode` |
| **Profile (semantic facts)** | distilled durable facts — name, language, city, preferences, health/financial profile, family, vehicle | until user deletes | **Turso** `mem_fact` |
| **Vector** | embeddings of episode summaries + facts → similarity recall | mirrors episodic/fact | **ChromaDB** `chitti_memory` |
| **Consolidated** | rolling summaries of old episodes (storage + privacy minimisation) | long | **Turso** `mem_summary` (also embedded) |

---

## 3. STORAGE — TURSO SCHEMA (libSQL / SQLite dialect)

```sql
-- One row per device-user. Consent is granular + default OFF (opt-in).
CREATE TABLE IF NOT EXISTS mem_user (
  uid               TEXT PRIMARY KEY,            -- UUIDv4 (X-User-Token)
  created_at        INTEGER NOT NULL,            -- epoch ms
  last_seen         INTEGER NOT NULL,
  lang              TEXT,                         -- preferred language code
  consent_basic     INTEGER NOT NULL DEFAULT 0,   -- general memory
  consent_health    INTEGER NOT NULL DEFAULT 0,   -- health profile memory
  consent_financial INTEGER NOT NULL DEFAULT 0,   -- CA / tax / investment memory
  consent_crosschitti INTEGER NOT NULL DEFAULT 0  -- surface a domain's memory in another domain
);

-- Durable facts about the user (the "profile"). Upsert on (uid, key).
CREATE TABLE IF NOT EXISTS mem_fact (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  uid         TEXT NOT NULL,
  key         TEXT NOT NULL,                 -- e.g. 'name','lang','city','allergy','diabetic','vehicle','itr_regime'
  value       TEXT NOT NULL,
  category    TEXT NOT NULL,                 -- identity|preference|health|financial|family|vehicle|location|other
  scope       TEXT NOT NULL DEFAULT 'general', -- general|health|financial  (gates cross-Chitti surfacing)
  confidence  REAL NOT NULL DEFAULT 1.0,
  importance  REAL NOT NULL DEFAULT 0.5,     -- 0..1
  pinned      INTEGER NOT NULL DEFAULT 0,    -- pinned facts never decay (name, allergies)
  source_chitti TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  expires_at  INTEGER,                       -- NULL = until user deletes
  UNIQUE(uid, key)
);

-- Turn log (episodic). response_summary is a 1-2 line distillation, not the full transcript.
CREATE TABLE IF NOT EXISTS mem_episode (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  uid           TEXT NOT NULL,
  session_id    TEXT NOT NULL,
  chitti        TEXT NOT NULL,               -- medupi|legal|ca|... |vaani
  query         TEXT,                         -- user input (prunable)
  response_summary TEXT,                      -- what Chitti answered/did
  intent        TEXT,
  scope         TEXT NOT NULL DEFAULT 'general',
  importance    REAL NOT NULL DEFAULT 0.4,
  ts            INTEGER NOT NULL,
  embedded      INTEGER NOT NULL DEFAULT 0    -- mirrored to ChromaDB?
);

-- Rolling consolidations of old episodes (per chitti or GLOBAL).
CREATE TABLE IF NOT EXISTS mem_summary (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  uid          TEXT NOT NULL,
  chitti       TEXT NOT NULL,                -- specific chitti or 'GLOBAL'
  window_start INTEGER NOT NULL,
  window_end   INTEGER NOT NULL,
  summary_text TEXT NOT NULL,
  scope        TEXT NOT NULL DEFAULT 'general',
  ts           INTEGER NOT NULL,
  embedded     INTEGER NOT NULL DEFAULT 0
);

-- DPDP audit trail — every memory access/change.
CREATE TABLE IF NOT EXISTS mem_audit (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  uid     TEXT NOT NULL,
  action  TEXT NOT NULL,                     -- read|write|edit|delete|export|consent_change|wipe
  detail  TEXT,
  chitti  TEXT,
  ts      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_fact_uid     ON mem_fact(uid);
CREATE INDEX IF NOT EXISTS ix_ep_uid_ts    ON mem_episode(uid, ts DESC);
CREATE INDEX IF NOT EXISTS ix_ep_uid_chit  ON mem_episode(uid, chitti);
CREATE INDEX IF NOT EXISTS ix_sum_uid      ON mem_summary(uid);
```

### ChromaDB layout
One collection **`chitti_memory`**. Each document = a memory snippet (episode summary, consolidated summary, or salient fact). Metadata:
```json
{ "uid":"<uuid>", "chitti":"medupi", "category":"health",
  "type":"episode|summary|fact", "scope":"health", "ts":1718900000000, "importance":0.7 }
```
Query = `collection.query(query_texts=[user_query], n_results=K, where={"uid": uid, "scope": {"$in": allowed_scopes}})`. Embeddings via the same lazy `sentence-transformers` used by CA/Legal RAG; **lexical fallback** (the existing OOM-safe pattern) when transformers can't load. (Per-uid metadata filter keeps it one collection — no per-user collection explosion.)

---

## 4. RETRIEVAL + DECAY (the read path)

Called at the **start of every response**, given `(uid, query, chitti, session_id)`:

```python
def retrieve(uid, query, chitti, session_id, token_budget=800):
    try:
        u = load_user(uid)
        if not u or not u.consent_basic:
            return ""                         # no consent → no memory, behave normally
        allowed = scopes_for(chitti, u)       # see §6 cross-Chitti gating

        # A. PROFILE — pinned facts always in; then top facts by importance (cheap, structured)
        facts = load_facts(uid, scopes=allowed)
        profile = [f for f in facts if f.pinned] + top_by_importance(facts, n=6)

        # B. SESSION — last K turns of THIS session (recency, structured)
        session = last_episodes(uid, session_id, k=4)

        # C. RECALL — semantic, cross-session/cross-Chitti, scored with decay
        hits = chroma.query(query, where={uid, scope in allowed}, k=12)
        for h in hits:
            sim  = h.similarity                                  # 0..1
            rec  = exp(-age_days(h.ts) / HALF_LIFE_DAYS)         # 30-day half-life
            imp  = h.importance                                  # 0..1
            h.score = 0.5*sim + 0.3*rec + 0.2*imp
        recall = [h for h in sort_desc(hits) if h.score >= 0.35][:4]

        block = compose_block(profile, session, recall, cap=token_budget)
        audit(uid, "read", chitti)
        return block
    except Exception:
        return ""    # best-effort: memory failure never blocks the answer
```

- **Decay**: `recency = exp(-age_days / 30)`. Pinned profile facts (name, allergies) **bypass decay** and are always included. Importance is set at write time (facts high, chit-chat low).
- **Budget**: profile ≈150 tok + session ≈150 + recall ≈500 = **≤800 tokens** injected. Vector query is the only network cost; target **< 150 ms**, profile cached per session.

### The injected MEMORY CONTEXT block (system-prompt prefix)
```
[CHITTI MEMORY — the user consented to be remembered. Use naturally; do NOT recite verbatim.
 If this conflicts with what the user says now, trust the user and update.]
About this user: name=Ravi · language=Hindi · city=Indore.
(Health, consented) diabetic; allergic to penicillin.
This session: asked Metformin price → showed Jan Aushadhi ₹6.47/strip.
Earlier (relevant): [3 days ago · MedUPI] switched Glycomet→generic, saved ₹400/mo.
Rules: never invent memory; if nothing relevant, ignore this block.
```

---

## 5. WRITE + CONSOLIDATION (the write path)

After each response (async, non-blocking):
1. **Episode** → insert `mem_episode` (query + 1-2 line `response_summary` + intent + importance + scope).
2. **Fact extraction** (gated by consent) → a cheap DeepSeek call: *"Did the user state a durable fact about themselves? Return [{key,value,category,scope,confidence}]."* Upsert `mem_fact` when `confidence ≥ 0.7`; **health/financial facts only if the matching consent is ON**; pin obvious identity/safety facts (name, allergies).
3. **Embed** → episode summary + new facts → ChromaDB upsert; set `embedded=1`.
4. **Audit** → `mem_audit('write')`.

**Consolidation cron** (daily, reuses the existing quality-agent cron pattern):
- Summarise episodes older than **14 days** into `mem_summary` (per Chitti + a GLOBAL summary), embed them.
- **Prune** raw `mem_episode.query` older than **90 days** (keep the summary + facts) → storage + privacy minimisation.
- Re-score importance; expire facts past `expires_at`.

---

## 6. CROSS-CHITTI (brokered by Vaani) — with the key security rule

- Memory is a **single global per-uid store** (not per-Chitti silos) so any Chitti can recall.
- **Scope gating** decides what surfaces where:
  - `scopes_for(chitti, u)` → Health/MedUPI get `{general, health}` if `consent_health`; CA gets `{general, financial}` if `consent_financial`; everyone gets `general`.
  - A domain's sensitive memory crosses into another domain **only if `consent_crosschitti` is ON** (e.g., Legal seeing your health context). Default OFF.
- **Vaani handoff — security rule:** when Vaani opens a specialist (`?from=vaani&input=…`), the URL carries **only the `uid` (X-User-Token) + the current input** — **never** memory content. The specialist's *backend* does its own `retrieve(uid, …)` server-side. → sensitive memory is **never** placed in a client-visible URL/base64. This is non-negotiable.

```
User → Vaani (uid=R) → triage → opens MedUPI panel (?from=vaani, X-User-Token=R)
                                   → MedUPI backend retrieve(R, scopes={general,health})
                                   → injects health memory into MedUPI's system prompt
```

---

## 7. PRIVACY & DPDP ACT 2023 MAPPING

| DPDP principle | How |
|---|---|
| Consent | Granular opt-in toggles: `basic / health / financial / cross-chitti`, all **default OFF**, warm one-time prompt ("Chitti yaad rakhe — taaki baar-baar na poochna pade?"). |
| Purpose limitation | Each memory tagged with `scope`; surfaced only to matching domains. |
| Data minimisation | Store **summaries**, prune raw queries at 90d; pseudonymous uid, no PII required. |
| Right to access | **Memory tab**: "Chitti kya yaad rakhta hai" lists facts + recent episodes. |
| Right to correction | Edit any fact inline. |
| Right to erasure | Delete per-item, or **"Chitti sab bhool ja"** → DELETE all Turso rows + drop ChromaDB vectors for uid + tombstone + audit. |
| Data portability | **Export** memory as JSON (download). |
| Accountability | `mem_audit` logs every read/write/edit/delete/consent change. |
| Residency | Turso `aws-ap-south-1` (Mumbai); Chroma on backend host. |
| Sensitive data | Health/financial = separate consent, stricter retention, never cross-domain without explicit `consent_crosschitti`. |

---

## 8. FAILURE / DEGRADATION

- `retrieve()` and `write()` are wrapped try/except → return empty / no-op on any error (Turso read-block, Chroma down). **A memory failure is invisible to the user** — Chitti just answers without memory (same graceful contract as the `/api/usage/today` fix).
- Latency guard: memory retrieval has a hard timeout (~150 ms); on timeout → empty block.

---

## 9. HOW IT PLUGS INTO CEOS

1. **New LOCKED decision** in `sahay_master.md` §2: *"Per-user episodic memory — device-pseudonymous, granular-consent, DPDP-compliant, user-owned & wipeable, graceful (never blocks a response)."*
2. **New cross-cutting CEOS** `ceos_memory.md` — the memory substrate spec (like the a11y / feedback substrates), referenced by every Chitti.
3. **Per-Chitti Constitution article** added to each CEOS: *"Memory: Chitti remembers only with consent; user owns, edits, and wipes it; health/financial categories are separately consented and never cross domains without explicit permission."*
4. **Substrate files** (vendored/shared, like `turso_http.py` and `chitti_a11y.js`):
   - Frontend `chitti_memory.js` (auto-loaded by `chitti_a11y.js`): mints/stores `chitti_uid`, sends `X-User-Token`, renders the consent prompt + Memory tab + "Chitti sab bhool ja".
   - Backend `lib/memory/`: `memory_store.py` (Turso CRUD over the existing `turso_http` shim), `memory_vector.py` (Chroma + lexical fallback), `memory_service.py` (`retrieve()` / `write()` / `consolidate()`).
5. **Hook point** — each `/api/<chitti>/ask` wraps the LLM call:
   ```python
   ctx = memory_service.retrieve(uid, q, chitti, session_id)
   answer = llm(system_prompt + ctx, q)         # ctx prepended to system prompt
   memory_service.write(uid, q, answer, chitti, session_id)   # async
   ```
   No change to each Chitti's domain logic — memory is a wrapper, exactly like the disclaimer/usage middleware.

---

## 10. BUILD ORDER (phased — each phase shippable + QA'd)

| BO | Scope | Pilot |
|---|---|---|
| **BO1** | Turso schema + `memory_store.py` CRUD + `chitti_memory.js` (uid + `X-User-Token`) + consent model. *No LLM behaviour change yet.* | — |
| **BO2** | Episodic **write** + **structured retrieval** (profile facts + last-N session + recent episodes by recency). Wire into **one pilot Chitti**. | MedUPI *or* Vaani |
| **BO3** | **Vector recall** — ChromaDB collection, embed-on-write, similarity + decay scoring + injection block. | pilot |
| **BO4** | **Fact extraction** (DeepSeek) + **consolidation cron** + decay/prune. | pilot |
| **BO5** | **Privacy** — Memory tab (view/edit/delete/export) + "Chitti sab bhool ja" + audit + DPDP export. | pilot |
| **BO6** | **Cross-Chitti** — global store + scope/consent gating + Vaani server-side handoff. | Vaani + 2 specialists |
| **BO7** | **Roll out** to all CEOS Chittis + publish `ceos_memory.md` + `sahay_master.md` locked decision + full **G0–G10 QA** on memory (incl. a memory-specific G8: never fabricate, never leak sensitive memory cross-domain without consent). | all |

---

## 11. DECISIONS — LOCKED (Sire, June 2026)

| # | Decision | LOCKED choice |
|---|---|---|
| 1 | Consent default | **Opt-in, granular** (basic / health / financial / cross-chitti; default OFF; warm one-time prompt) |
| 2 | Identity | **Device-pseudonymous** (UUID `X-User-Token`, no login, no PII; account sync = v2) |
| 3 | Cross-domain memory default | **OFF** — `consent_crosschitti` toggle required to surface a domain's memory in another |
| 4 | Pilot Chitti (BO2) | **MedUPI** (backend = chitti-shares-api) |
| 5 | Retention | **default** — raw queries 90d → summarise; facts until deleted; **health raw 30d** (stricter) |
| 6 | Embedding model | **reuse** RAG `sentence-transformers` + lexical fallback (no new dep) |

(#5, #6 taken at the recommended defaults — adjustable later.)

---

*Design APPROVED. BO1 = Turso schema + `memory_store.py` CRUD + `chitti_memory.js` (uid + X-User-Token + consent model). No LLM behaviour change in BO1; QA before BO2 wires it into MedUPI.*
