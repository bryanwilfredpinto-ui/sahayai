# DEVIL'S ADVOCATE — Chitti Product Scanner

Eight critiques an adversarial reviewer would raise. Each one is real; some are mitigated, some are open.

## 1. "PII masking is client-side only — server still sees full text"

The frontend masks Aadhaar/PAN in the rendered output, but the raw text body and the DeepSeek upstream see the unmasked digits. **Mitigation (P1 #5 in [../TODO.md](../TODO.md)):** add server-side scrubbing in `_normalise()` so the response itself carries only masked values; the DeepSeek leg remains the unavoidable upstream trust boundary, documented in [../CONTEXT.md](../CONTEXT.md).

## 2. "No UIDAI verification means a user could be fooled by a fake doc"

True. Chitti reads what is printed. If a fraudster prints a fake Aadhaar with a plausible 12-digit number, Chitti will read the number aloud. **Counter-argument (see [BOUNDARIES.md](BOUNDARIES.md) #3):** a false-positive "verified by Chitti" stamp would be worse. The cure for forgery is the user's issuing-authority check, not an LLM.

## 3. "`render.yaml` exists but the service has never been deployed"

Per [../TODO.md](../TODO.md) P0 #1 and the workspace memory `project_render_deploy_status_2026_05_10.md`, Scanner is in the bucket of "8 with render.yaml unconnected". The frontend at `https://sahayai.in/chitti_scanner.html` is live; the backend `chitti-scanner-api.onrender.com` is **not**. Until then, the production frontend cannot analyse anything. Hard P0.

## 4. "Vision is off in production — the camera button is theatre"

`DEEPSEEK_VISION_MODEL="off"` means every image upload returns `fallback_no_vision`. A blind user who taps the camera button gets a "please type out the label" response — not what the homepage promises. **Mitigation:** the textarea + mic path works today; vision is wired and pending the DeepSeek credentials decision per workspace memory `project_ai_provider_switch_to_deepseek.md`.

## 5. "Stateless = no audit trail when something goes wrong"

If a user later disputes a Chitti reading ("Scanner said expiry 2027, the strip said 2017"), there is no log to replay. Chitti accepts this; the privacy table in [../CONTEXT.md](../CONTEXT.md) rules out persistence. The 20-row `localStorage` ring is the only record, and it lives on the user's device.

## 6. "DeepSeek is a single point of failure (and an upstream PII reader)"

If DeepSeek is down, `_fallback()` returns an "AI offline" envelope — Scanner degrades but does not crash. The deeper concern is that DeepSeek's privacy posture is outside Chitti's control; the user's label text is forwarded to a Chinese-jurisdiction endpoint. Mitigation: no PII-laden Aadhaar/PAN ever forwarded post-server-scrub (P1 #5).

## 7. "No rate limiting — one bad actor can drain the DeepSeek budget"

Per [../TODO.md](../TODO.md) P3 #13, no per-IP token bucket exists today. CORS is the only defence, and CORS is bypassable from any non-browser client. **Open work.**

## 8. "Document-type detection defaults to `other` — but `other` still goes through the model"

Conservative defaulting (see [GUARDRAILS.md](GUARDRAILS.md) #3) is good for routing, but the model still produces a summary for `other`. A motivated adversary could feed a screen of malicious instructions and have Scanner pass them through to the user's speech synthesiser. Mitigation: the 3–4-sentence cap, server-enforced disclaimer, and locked output schema constrain the blast radius — but the attack surface is not zero.
