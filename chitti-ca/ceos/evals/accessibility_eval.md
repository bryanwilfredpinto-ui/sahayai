🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# EVAL — Accessibility eval (router_accuracy N/A — Vaani owns routing)

CA OS has **no intent router of its own** (Vaani routes to CA OS per the sole-interface
lock), so `router_accuracy` is **N/A**; the equivalent accuracy gates are
[tax_accuracy.md](tax_accuracy.md) / [gst_accuracy.md](gst_accuracy.md) /
[scheme_match.md](scheme_match.md).

**Accessibility eval (100% gate)** — automated by `tools/qa_ca_os.mjs` (13 a11y tests)
+ `tools/cert_ca_os.mjs` (axe-core): blind (aria-live + read-aloud on every result),
deaf (symbol+word, never colour-only, ISL hook), mute (tap-only journeys), illiterate
(icon tabs + 🔊 on every control), tap targets ≥44px, axe-core 0 serious/critical, 26-lang
dropdown switches. See full detail in [accessibility.md](accessibility.md). Pass = all
green; any fail blocks release (accessibility is the floor).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
