🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# RESEARCH — Best apps in the world, and what Chitti Fashion copies

> Purpose: before (re)building, study the world's best — both **fashion/styling apps** and the world's best
> **accessibility-first apps** — and extract the concrete patterns to adopt for our four users:
> 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate (plus elderly / low-vision / low-bandwidth).
> Date: 2026-06-06.

## A. Accessibility-first apps (the foundation — these matter more than the fashion apps)

| App / platform | World-class pattern | What Chitti Fashion adopts |
|---|---|---|
| **BlindSquare / Microsoft Seeing AI** | Everything is **announced**; the screen is optional; one action speaks its result immediately | `aria-live` on every result + auto-read first result; voice-out is the primary channel, screen is secondary |
| **Apple VoiceOver / Android TalkBack** (OS gold standard) | Correct **landmarks + roles**, focus order, "skip to content", `aria-selected` tabs, focus-visible rings | Skip-link, `<h1>`, landmark roles, `role=tab`/`tabpanel`, managed focus, visible focus ring |
| **Be My Eyes** | Zero-literacy entry: a single huge action, voice describes everything | Icon-first huge hero CTA; no required reading; picture menus |
| **Google Lookout** | Camera → spoken result, works one-handed, large targets | 48px targets, tap-only path, camera-optional |
| **WhatsApp (India mass-market)** | Works on 2G, tiny payloads, icon-led, every literacy level | 2G budget, emoji+symbol labels, offline-capable engine |
| **GOV.UK Design System** | The reference for inclusive web: reduced-motion, high-contrast, forced-colors, error-as-text | `prefers-reduced-motion`, `prefers-contrast`, `forced-colors` media queries; never colour-only status |

## B. Fashion / styling apps (the domain — copied selectively, Founder-Rule filtered)

| App | World-class pattern | Adopted? |
|---|---|---|
| **Stylebook / Cladwell / Whering** | On-device **digital wardrobe**, outfit builder from items you own, cost-per-wear, "wear less, buy less" | ✅ hero of the product (Dress-Me, Simulator, ROI, cost-per-wear) |
| **Acloset / Save Your Wardrobe** | Repair-not-replace, sustainability score, capsule wardrobe | ✅ Clothing Doctor, My Impact, capsule (Travel) |
| **Pinterest / Stitch Fix** | Inspiration + "why this suits you" stylist reasoning | ✅ teach-why on every verdict; ❌ NOT the "buy more" loop (Founder Rule) |
| **Zalando / Myntra size advisor** | Cross-brand size guidance to cut returns | ✅ My Size (India/US/UK/EU) |
| **The Yes / Pureple** | Occasion + weather + colour-season styling | ✅ Occasion, Weather, real colour science, palette |

**Founder-Rule filter:** every shopping-app pattern that drives *purchases* is inverted — Chitti's hero is
"dress from what you own," shopping is the **last** option. We copy the *wardrobe intelligence*, not the *cart*.

## C. The synthesis — what "world-class" means for Chitti Fashion

1. **Accessibility is the architecture, not a layer.** The four users are **BO1–BO5** (built first), not a
   final audit. A sighted-first app with an a11y pass bolted on is *not* world-class for our users.
2. **Voice-out + text + symbol on every surface** — never audio-only (deaf), never text-only (illiterate),
   never visual-only (blind). Every result is announced (`aria-live`) AND readable AND symbol-tagged.
3. **The engine is deterministic** — world-class means it works on 2G with the LLM down (Stylebook offline ⊕ Seeing-AI instant).
4. **Reduce consumption** — the Acloset/Whering sustainability ethic, enforced by the Founder Rule.
5. **Prove it** — every increment is **test-gated** (the Build Order), and a real WCAG scanner (axe-core) gates a11y.

→ These conclusions drive **[BUILD_ORDER.md](BUILD_ORDER.md)** (BO1…BOn, each with its test).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
