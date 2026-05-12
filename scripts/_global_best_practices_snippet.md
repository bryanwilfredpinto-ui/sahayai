

---

## Global Best Practices (China · Dubai · Singapore)

Bharat-first, not Bharat-only. The full discussion lives in [../GLOBAL_BEST_PRACTICES.md](../GLOBAL_BEST_PRACTICES.md). Headline rules adopted for every Chitti, including this one:

- **Elder mode as a system default** (China). Our braille-mode toggle in [chitti_a11y.js](../chitti_a11y.js) generalises this to braille + low-vision in a single switch.
- **Minimum 4 Indian languages at launch** (Dubai TAMM principle, 8-language min). The 26-language registry is in [chitti_a11y.js](../chitti_a11y.js). No product is "shipped" until 4 are wired.
- **Happiness meter on every transaction** (Dubai). Three-button voice-first feedback after key flows, aggregated weekly. Wired in chitti-sales; planned in [TODO.md](TODO.md) for the rest.
- **Inclusive Design Mark co-design** (Singapore SG Enable). Our four-user contract is the local equivalent.
- **WCAG 2.1 AA continuous audit** (Singapore Govtech). The [BRAILLE.md](../BRAILLE.md) checklist is the manual equivalent until axe-core CI lands.
- **Provider abstraction is non-negotiable.** Bhashini today, swappable at `chitti-voice-factory`. Frontend never names the supplier.

### What we explicitly refuse

- Super-app monoculture (China). Each Chitti is independently installable, deletable, auditable.
- Mandatory national-ID linking (Dubai UAE Pass). Aadhaar is opt-in everywhere.
- Centralised digital identity (Singapore Singpass). No Chitti-pass; no mandatory biometrics.
- Social-credit feedback aggregation. Happiness meter is anonymised and per-product.

This section is mirrored across every Chitti's CONTEXT.md from a single source — see [GLOBAL_BEST_PRACTICES.md](../GLOBAL_BEST_PRACTICES.md).
