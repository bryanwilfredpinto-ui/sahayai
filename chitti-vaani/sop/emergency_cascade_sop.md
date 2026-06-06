# SOP-V001 — Emergency Cascade

> Standard Operating Procedure for Chitti Vaani's emergency response.
> Per SAHAYAI_MASTER.md §2 (emergency protocol, LOCKED) and CONTEXT.md §Emergency.
> The family-cascade order is fixed and may NOT be re-ordered or abbreviated.

---

## Triggered When

- An emergency keyword is detected in any Chitti-mediated audio (day or night,
  any language — see keyword list below).
- SafeWalk check-in deadline passes without user acknowledgement.
- Daily elderly check-in (V3, planned) produces no response after 3 prompts.
- User taps the large SOS button manually.
- Mute user executes the touch-and-hold emergency gesture.
- Empathy Agent raises distress_level = 3 (crisis signal).

---

## Emergency Keyword List (excerpt — full list in emergency_service.py)

| Language | Words |
|---|---|
| Hindi | bachao, madad, help, dard, hospital, ambulance, emergency |
| English | help me, save me, emergency, ambulance, hurt, danger |
| Tamil | udavi, payanam, valikuthu, help |
| Telugu | sahayam, aapadha, noppuga undi |
| Bengali | bachao, shaho, bipod, helpkaro |
| Marathi | madad, aapatti, bachva |
| Kannada | sahaya, apad, novu |
| Malayalam | sahayam, apakadham, vedana |

New keywords are added by Swarm (HIGH-risk, Sire approval required).

---

## Procedure

### Phase 1 — Detection and Trigger (< 2 seconds)

1. Safety Agent detects emergency keyword OR distress_level = 3 from Empathy Agent.
2. Frontend POSTs `/api/vaani/emergency/trigger` with:
   - `user_id` (hashed)
   - `trigger_reason` (keyword / safewalk / checkin / manual / gesture)
   - `location` (lat/lng if geolocation available, else pincode from `Chitti.location`)
   - `timestamp`
3. Backend writes to `emergency_events.db` and fans event to every paired partner's
   relay inbox immediately.

### Phase 2 — Master Confirm (10 seconds)

4. Vaani speaks (in user's language):
   > *"Master, are you OK? Say 'theek hun' to cancel."*
5. Vaani listens for abort words: "theek hun", "I'm fine", "okay", "sab theek hai",
   "cancel", "nahi chahiye".
6. If abort received within 10 s:
   - POST `/api/vaani/emergency/check-in` -> cascade ABORTED.
   - Notify all paired partners: *"[User] confirmed they are okay."*
   - Write ABORTED to `emergency_events.db`.
   - STOP here.
7. If no abort in 10 s: proceed to Phase 3.

### Phase 3 — Ring Alarm (10 seconds)

8. Web: Web Audio API oscillator at STREAM_ALARM frequency, maximum volume.
   Android (Phase 2): `AudioManager.STREAM_ALARM`, bypasses Do-Not-Disturb.
9. Purpose: alert anyone physically nearby.  10 s continuous alarm.
10. Alarm continues in background while subsequent steps run.

### Phase 4 — Outbound to Trusted Circle

11. Web: `tel:` deep-link opens OS dialer pre-filled with Tier 1 contact (spouse).
    Android (Phase 2): `ChittiNative.makeCall(phone)` direct dial.
12. Vaani announces (over the ongoing alarm):
    > *"Calling [spouse/contact name]."*
13. If Tier 1 call is not answered within 30 s (on Android — web cannot detect
    answer state): proceed to Tier 2 (immediate family), Tier 3 (extended circle).
14. Web fallback: open WhatsApp (`wa.me?text=EMERGENCY:[name] needs help at
    [location_url]`) to all trusted-circle members simultaneously.

### Phase 5 — Chitti-to-Chitti Relay

15. All paired partner Chittis that are polling `/api/vaani/emergency/poll` receive
    the cascade event.
    Android (Phase 2): FCM push channel, even if partner's phone is on silent.
16. Partner Chittis ring their own `STREAM_ALARM` (even on silent) and display:
    > *"[User name] may need help — please call them or check on them."*
17. Partner acknowledges (tap OK or voice "dekh raha hun"): write ACK to relay event.
18. First ACK received -> cascade considered "family aware".  Alarm continues until
    user's own master confirm is received.

### Phase 6 — Unresolved (all family unreachable, > 5 minutes)

19. Continue ringing local alarm on user's device.
20. Display large-tap button: "Call Ambulance 108" (not 112).
21. Tap -> Golden Rule confirm: *"Sire, shall I call Ambulance 108?"*
22. Haan -> `tel:108`.  Nahi or silence -> continue alarm, wait.
23. NEVER auto-dial 112 / 100 / 102 under any circumstances.

---

## Escalation

| Condition | Action |
|---|---|
| Backend `/emergency/trigger` returns 5xx | Frontend continues local cascade (alarm + tel:) without backend; retries POST every 10 s |
| All trusted-circle numbers are cop-denylist hits | Cascade stops at Phase 3 (alarm only); 108 button shown |
| User has zero paired contacts | Cascade runs Phases 1-3 only; 108 button shown after Phase 3 |
| SafeWalk timeout | Skip Phase 2 (master already absent); proceed directly to Phase 3 |

---

## What We NEVER Do

- NEVER auto-dial 112, 100, 101, 102, 1098, 1930, or 139.
- NEVER skip Phase 2 (master confirm) except for SafeWalk timeout.
- NEVER time out the master confirm into a "Yes" — silence = still confirming.
- NEVER create a parallel notification path outside this cascade.
- NEVER show the user a modal asking "should I call the police?".
- NEVER log raw location coordinates to a server — aggregate to district level only.
- NEVER re-prompt the user to reconfigure trusted-circle during an active cascade.

---

## Verification

- Automated: `tools/qa_vaani_emergency.mjs` — triggers via keyword in each P0 language,
  verifies cascade events written to `emergency_events.db`, verifies alarm fires,
  verifies cop-denylist blocks attempted 112 dial.
- Cert artefact: `tools/cert_screenshots/chitti_vaani_emergency_375.png`.

---

Last reviewed: 2026-06-06
