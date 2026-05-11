# DEVILS_ADVOCATE — Chitti Vaani

Eight honest critiques of Vaani's current design. Each names the failure mode + the open mitigation.

## 1. Always-on listener is a battery drain

On-device Vosk keyword spotting in Phase 2 night-mode runs a foreground service 22:00–06:00 IST. On a 4000 mAh phone this can shave 10–15% off overnight standby. Users frustrated by morning battery may **disable the feature** — and lose the emergency cascade with it. Mitigation: schedule, low-frequency wakeups, hardware DSP offload on supported chips. None of this is built yet.

## 2. Family cascade fails if family does not answer

If spouse, parent, sibling are all on silent / DND / driving / asleep, the cascade exhausts the trusted circle and **stops**. There is no cop fallback by design ([BOUNDARIES.md](BOUNDARIES.md)). A user in distress may be left without help. Mitigation: paired-Chitti relay rings on **every** paired device's STREAM_ALARM bypassing silent — but only on Android v2.

## 3. Tier C languages return Tier-A-quality TTS sometimes

The 4-supplier voice cascade in Chitti Voice Factory can silently fall back from a Tier C language (Oraon, Sanskrit) to a Tier A nearest-neighbour engine, producing audio that *sounds* fluent but is in the wrong language. Per the master memory, Tier C must **never silently fall back**. Audit needed against `mock_bhashini` outputs once ULCA creds land.

## 4. DeepSeek SOS prompt still says "dial 112"

The canonical system prompt in [../PROMPTS.md](../PROMPTS.md) contains *"Immediately call the emergency contacts and dial 112"*. The protocol-layer `COP_DENYLIST` overrides this — but the model's narrative voice still says 112 to the user, which is confusing. Tracked: rewrite the SOS block to match the family cascade.

## 5. Gmail "send as Chitti" is a phishing vector

A compromised user_token can send mail with the Chitti AI signature, lending it false authority. Mitigation: token rotation, scope limited to `gmail.send`, audit log per send. Not yet exposed to the user.

## 6. SQLite on /tmp loses state on every Render free-tier deploy

Tokens, pairs, relay inbox, feedback log — all on `/tmp` SQLite ([../ARCHITECTURE.md](../ARCHITECTURE.md)). A deploy mid-cascade can drop a paired-Chitti event. Mitigation: graduate to Supabase Postgres (`ADMIN_DATABASE_URL`) — tracked.

## 7. Per-user OAuth state is keyed by frontend-generated `user_token`

A user clearing localStorage loses their Gmail link. A user copying their `user_token` to a friend grants Gmail-send to that friend. Mitigation: bind `user_token` to a server-side session — not built.

## 8. Web Audio "alarm bypassing silent" is a lie on iOS Safari

Phase 1 web cascade cannot bypass iOS mute switch. iOS users get a visible alarm only. Phase 2 Android is the real fix; the web path is a partial mitigation, not a guarantee.
