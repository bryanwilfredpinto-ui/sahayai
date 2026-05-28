🎖️ **World Class Chitti Logo & Video — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Logo & Video — Standard Operating Procedure

## Objective
Stub product — SVG monogram generator + queued mock video — kept honest until a real video-generation API is wired.

## Primary User
Small business / shopkeeper wanting a free logo + short brand video to share on WhatsApp Business.

## Success Metric
(a) Logo download count · (b) mock-video queue length (signal of unmet demand for the real provider) · (c) honest-stub disclosure click-through.

## Quality Standard
- **Observability = None is correct until the product graduates** (YELLOW by design per [QUALITY_STATUS.md §1](../QUALITY_STATUS.md))
- Every response surfaces *"this is a queued mock — real video pending provider integration"*
- No fake demo asset ever shipped as a real generated video
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)

## Operating Rules
1. **NEVER fake AI video.** Mock queue only.
2. **NEVER charge money.**
3. **Honest disclosure mandatory.** Every response surfaces "queued mock — real video pending provider integration".
4. **Observability=None correct.** Don't add Observability prematurely; it would be circular for a stub.
5. **Golden Rule on every action.** Logo regenerate, queue-submit, brand-kit-export — all confirm before fire.

## Error Handling
- SVG generation fails → return error with honest "generator unavailable, try again"
- Queue submit fails → never silently drop; surface "queue unavailable"
- User asks "when will my video be ready?" → honest "real video pending provider integration; mock queue tracks demand"

## Escalation to CTO
- Real video provider API key lands → graduate: wire Observability + HookRegistry + wrap_llm + Layer-5 fallback
- Mock asset detected being passed off as real video (would be critical breach of honest-stub contract)
- Queue length > 1000 (signal to prioritise provider integration)
- WhatsApp Business size standard changes

## Stale Data Rule
Monogram templates updated only on Sire request. Mock-video queue purged monthly (status: *"still waiting"* with the original queue date preserved).

## Evolution Owner
[chitti-logo-video/skills/FEATURES.md](skills/FEATURES.md). Graduates to 🟢 + full Observability when real provider API key is in Railway env.

---

> **World Class Chitti Logo & Video — Commando Discipline. Zero Excuses.**
