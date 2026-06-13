🎖️ World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.

# SOP — Document intake & Vault

Covers: **Document Vault intake** and **PUC / Insurance / RC document handling**.

## Goal
Get the user's vehicle papers into the Vault accurately, on-device only, and turn each
document's dates into a Smart Reminder — without ever fabricating a number.

## Flow
1. **Ask what they have** by voice or tap: RC, insurance, PUC, DL, service bill, warranty.
2. **Capture details** — today by voice/tap (number + dates). 🔵 Photo + OCR auto-fill is
   COMING SOON; until then never claim a field was "read" from an image.
3. **Confirm before save** (Golden Rule): read the captured details back aloud, wait for an
   explicit "haan" / tap. Silence = wait, never assume yes.
4. **Store on device only** (`localStorage`). No paper, number, or image leaves the phone.
5. **Derive reminders** — insurance expiry, PUC expiry, RC/registration renewal, next
   service → handed to the Reminder engine (see [reminder_escalation.md](reminder_escalation.md)).
6. **Write the Twin** — append to the Vehicle Twin timeline (see
   [../memory/vehicle_twin.md](../memory/vehicle_twin.md)).

## Rules
- If a date or number is missing or unclear → ask again; **never guess** an expiry.
- If the user asks "is my insurance active?" and we have no live source → say "I have the
  date you gave me, I can't check the live status yet" (🔵 mParivahan/DigiLocker COMING SOON).
- "Chitti forget" deletes the Vault entry and its derived reminders + Twin rows.
- Every saved field carries `{confidence, sources:["user-entered"]}`. No invented sources.

---
> **World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.**
