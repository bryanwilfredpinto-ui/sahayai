🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Guardrail — Privacy (L8)

**Rule:** the user's trading data is theirs and stays on their device.

- **On-device only.** Portfolio/dual-journal, watchlist, paper trades, system-signal journal, and the
  disability profile are stored in `localStorage` on the user's device. They are never sent to a server.
- **No PII collected.** No name, phone, email, or account is required to use Chitti Technical.
- **Market data is read-only.** Only the public symbol + timeframe is sent to the candle API; no user
  identity is attached.
- **Feedback (👍/👎/✏️/🎤)** is tagged to the box ID, not the person; it is opt-in via the per-response widget.
- **"Forget" honoured.** Clearing the watchlist/journal removes the localStorage keys; nothing persists server-side.
- **No third-party trackers / ads.** No analytics SDKs that exfiltrate behaviour.

**Test:** no network call carries user PII (inspect requests); journals/watchlist survive only in
localStorage; clearing storage removes all user data.
