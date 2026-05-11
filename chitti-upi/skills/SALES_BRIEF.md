# SALES BRIEF — Chitti UPI Fraud Guard

India ran ~131 billion UPI transactions in FY24. The same rails carry the country's biggest scam wave. The users who lose the most money are the users Sahay AI is built for: blind, deaf, mute, illiterate, elderly, first-time-digital ([`../CONTEXT.md`](../CONTEXT.md) §1).

Chitti UPI Fraud Guard is the friend who reads the suspicious SMS for you before you tap "Pay".

## 10 pain points

1. **KYC-update SMS.** "Your SBI YONO account will be blocked at 6pm. Update KYC at http://sbi-update-secure.in/kyc" — a domain that is not a bank's, an urgency tactic, a non-bank phone number.
2. **Electricity-disconnect threat.** "Aaj raat 9 baje aapka bijli connection kaat diya jayega. Turant ₹250 bharein." — fear-driven, fake helpline number.
3. **Fake KBC win / lottery.** "Aap KBC ke ₹25 lakh jeet chuke hain. Processing fee ₹2,999 bhejein." — no genuine prize asks for upfront money.
4. **OTP-on-call phishing.** Caller claims to be the bank and asks the user to "confirm" an OTP. Bank/police never ask for OTP by phone.
5. **Collect-disguised-as-send.** A UPI **collect** request shows up while the user thinks they are about to **receive** — one tap and the money leaves the user's account.
6. **Unfamiliar merchant.** A QR scan resolves to a VPA the user has never paid before — no second-opinion layer in the bank app.
7. **Amount-too-large.** A legitimate-looking invoice with an inflated total — the user trusts the merchant and skims the number.
8. **Lookalike VPA.** `paytm-care@ybl` vs `paytmcare@ybl` — invisible to a blind user navigating by TalkBack.
9. **Phone-link in SMS.** A "track your parcel" link that opens a UPI intent instead of a browser — invisible until the bank app is launched.
10. **Caller pretending to be family ("emergency, send ₹5000").** Social-engineering attack a deaf/elderly user cannot verify by voice.

## 10 benefits

1. **HIGH / MEDIUM / LOW verdict in seconds**, spoken aloud first.
2. **Voice IN** — dictate the suspicious SMS, do not type it.
3. **Voice OUT** — the verdict and warning are read aloud in the user's language.
4. **Plain Hinglish** — no "phishing", no "VPA collision", no jargon.
5. **Conservative defaults** — ambiguous cases default to MEDIUM, never falsely LOW ([`../ARCHITECTURE.md`](../ARCHITECTURE.md) §5).
6. **1930 + cybercrime.gov.in** legal lines on every verdict, so the user always knows the official path.
7. **Sample-card scams** — KYC, electricity, KBC, OTP — one tap if the user cannot type.
8. **No payment data ever leaves the device** — Chitti never sees the user's VPA, PIN, OTP, or balance ([`../ARCHITECTURE.md`](../ARCHITECTURE.md) §7).
9. **Free, anonymous, no signup.** No cookie. No session. No PII.
10. **Family-cascade escalation on HIGH** — deep-link into Chitti Vaani so a spouse / adult child is looped in without the user re-dictating the story.
