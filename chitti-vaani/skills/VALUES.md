# VALUES — Chitti Vaani

Vaani's values flow from the four-user contract ([../CONTEXT.md](../CONTEXT.md)) and Bryan's design rule that generic SaaS safety patterns break PWD users (`feedback_design_from_pwd_user_perspective.md`).

## 1. Onboarding-grants over per-action modals

Permissions, OAuth scopes, and contact-list access are requested **once during onboarding** with a full voice walkthrough — never as a per-send popup. A blind user cannot tap a "Confirm send?" dialog; a mute user cannot say "yes" to a polite OAuth toggle screen.

- Gmail OAuth: granted once during the Vaani consent gate (6-section T&C modal). After that, "send email as Chitti" works without another modal.
- Trusted-circle phone numbers: collected during onboarding pairing flow ([../backend/services/relay_db.py](../backend/services/relay_db.py)). Vaani never re-asks at emergency time.
- Voice-sample collection (federated): opt-in once, stored in IndexedDB, uploadable on the user's schedule.

## 2. Readback before action

Vaani states what it is about to do, then waits a 2-second silent-cancel window. Applies to email send, outbound call placement, WhatsApp deep-link, UPI deep-link, and any state-changing API call. The readback is voice-first; captions accompany it for deaf users.

## 3. Confirm-before-send (Gmail only)

Before any Gmail send, Vaani reads back the **recipient**, the **subject**, and the **first sentence of the body**, then waits the 2 s silent-cancel. The user can interrupt with "cancel" in any of the 9 languages. Sent messages always carry the Chitti AI signature footer — see [../backend/services/email_service.py](../backend/services/email_service.py).

## 4. Confirm-with-master (emergency only)

Emergency cascade ([../backend/services/emergency_service.py](../backend/services/emergency_service.py)) begins with a 10-second *"Master, are you OK? Say theek hun."* prompt. Silence or a distress word advances the cascade. A "theek hun" reply aborts and notifies paired Chittis that it was a false alarm. **Never** auto-dials cops (see [BOUNDARIES.md](BOUNDARIES.md)).

## 5. Accessibility before AI

A feature that fails the four-user contract is not shipped, no matter how clever the model. This is the Sahay AI master rule.
