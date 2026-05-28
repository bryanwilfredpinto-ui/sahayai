# skills/chitti_mechanic_bike.md

Chitti Mechanic Bike — voice-first diagnostic skill for every Indian rider.
Frontend: `chitti_2wheeler.html`. Backend: any chitti-vaani-api endpoint that can call DeepSeek.

## Operating principle

Chitti Mechanic Bike NEVER ships a hardcoded symptom → diagnosis tree.
Every diagnosis is generated dynamically by DeepSeek, with one
hard-coded layer on top: **safety rules**.

The router (`mbAsk()` in `chitti_2wheeler.html`) sends the user's
utterance to `/api/vaani/ask` with a fixed JSON schema. The model
returns: diagnosis, diy_possible, diy_steps, mechanic_advice,
fair_price_min_inr, fair_price_max_inr, safety_critical, ask_followup.

The frontend then short-circuits `safety_critical` for any utterance
mentioning brakes, steering, tyres, wobble, suspension, fork, or axle —
regardless of what the model says.

## Symptoms Chitti has been trained to diagnose well

This list is illustrative — DeepSeek will handle anything in the wild,
but these are the common Indian-bike complaints we expect.

| Cluster | Common Hindi/Hinglish phrasing |
| --- | --- |
| Chain noise / loose chain | "chain se awaaz aa rahi", "chain dheeli ho gayi" |
| Mileage drop | "mileage kam ho gayi", "petrol jaldi khatam" |
| Won't start (self / kick) | "self nahi le rahi", "start nahi ho rahi" |
| Battery weak | "battery utar gayi", "horn dheere baj raha" |
| Brake noise / fade | "brake awaaz karta hai", "brake pakad nahi raha" |
| Overheating | "engine garam ho raha", "smoke aa raha" |
| Clutch slipping | "clutch dabaane par bhi gear ja raha" |
| Air filter clogged | "pickup kam ho gayi", "smoke kala" |
| Tyre pressure | "tyre soft", "puncture jaisa lag raha" |
| Lights not working | "headlight nahi jal rahi", "indicator nahi" |
| Oil change | "service date aagayi", "oil chalu kya hai" |
| Cold-start issues | "subah start nahi leti", "choke maarna padta" |

## Safety rules — non-negotiable

If the user's utterance mentions any of these tokens (case-insensitive),
the frontend forces `safety_critical=true` and `diy_possible=false`:
brake / brek / steering / handle / tyre / tire / wobble / puncture /
fork / axle / suspension.

When `safety_critical=true`:
- Railway the message in the red SAFETY bubble.
- Never show DIY steps.
- Always tell the rider: "Mechanic ko zaroor dikhao. Safety se samjhota mat karo."
- Never tell the rider to keep riding.

## Helmet gate

Any call to `mbOpenMaps()` is wrapped in `mbHelmetGate(fn)`. That gate
shows the helmet modal; only after the rider taps "हाँ पहना" does the
Maps URL open. Hard rule for bikes — not optional.

## Daily safety tip

`DAILY_TIPS` is a per-language rotation array. The index advances once
per real-world day (`TIP_DAY_KEY` = `YYYY-M-D`). The "▶ अगली" button
forces the next tip even without a day change.

Tips are pure safety advice (helmet, brake fluid, tyre pressure) —
never diagnosis. The diagnosis itself is dynamic.

## Fair-price guardrails

Chitti always returns an INR range (`fair_price_min_inr`,
`fair_price_max_inr`). These are real 2026 Indian rates. Surface as:
"धोखा मत खाओ — यह काम ₹X – ₹Y में होना चाहिए।"

If DeepSeek returns either bound at 0 or omits, hide the price card.

## Documents (Tab 3)

Default 5 docs: Insurance, PUC/Pollution, RC, Driving Licence, FASTag.
Each has an editable `expiry` date and a `reminder_window` (30 / 7 / 1
days). When the user picks an expiry, `mbScheduleReminder()` pushes a
`doc_expiry` record into `chitti_inbox_v1` localStorage — the unified
Chitti inbox. Reminders are NOT sent via WhatsApp — Chitti has its own
inbox by design.

DL is linked to Chitti Vaani's Document Vault (Phase 2).

## Fitness certificate (commercial bikes)

If the rider's profile flags the bike as commercial (delivery, taxi),
also track `fitness_cert` + `permit` documents. Phase 2.

## Voice intents Chitti Mechanic Bike specifically handles

- "Mere bike ki chain awaaz kar rahi hai" → chain diagnosis flow
- "Mileage kam ho gayi" → mileage diagnosis flow
- "Service center kahaan hai" → helmet gate → Maps
- "Insurance expire kab hai" → docs read-out
- "Aaj ka safety tip" → daily safety tip

## Quality v2 — escalation

Any per-card 👎 sends `{chitti:'chitti_mechanic_bike', card, message}`
to `/api/feedback`. Daily founder report aggregates by card so the
weakest-rated card surfaces first. Five 👎 on the same card in 24h →
hourly :15 escalator picks up.
