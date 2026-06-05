🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# ROUTING_ENGINE — Level 4 · the router + 8-agent swarm

> Given a detected category, decide **which specialist Chitti answers** — with a confidence
> score, an explanation, and an honest COMING-SOON path when the specialist isn't built.
> Subordinate to [CONSTITUTION.md](CONSTITUTION.md). The canonical table lives in
> [routing/routing_table.md](routing/routing_table.md).

## The routing decision

```
detected category + sub-type
        │
        ▼
  8-agent swarm vote  ──►  Classifier · Trust · Safety · Accessibility ·
        │                  Memory · Learning · Explanation · Router
        ▼
  target Chitti + confidence + reason + delivery-mode
        │
        ▼
  deep-link (chitti_*.html?from=scanner) OR Vaani intent OR COMING-SOON card
```

In v1 the vote is **deterministic** (the rules + a fixed priority order). The LLM-graded
vote is **COMING SOON** (needs DeepSeek funding + the Vaani relevance-rail allowlist — the
same standing blocker as Fashion + Mechanic). We never claim a swarm-vote accuracy number
before the eval harness runs.

## Routing table (live destinations)

| Detected category / sub-type | Routes to | Page | Handoff |
|---|---|---|---|
| medicine, prescription, strip | **MedUPI** | `chitti_medupi.html` | inline Jan-Aushadhi panel (existing) |
| human/health: skin, eye, wound, mole, lab report | **Health Scanner** | `chitti_health_scanner.html` | deep-link, non-diagnostic |
| vehicle: 2-wheeler | **Bike Doctor** | `chitti_2wheeler.html` | deep-link |
| vehicle: 4-wheeler / car | **Car Doctor** | `chitti_4wheeler.html` | deep-link |
| fashion: clothing, footwear, jewellery, wardrobe | **Fashion** | `chitti_fashion.html` | deep-link |
| government_doc: PAN, Aadhaar, scheme, form | **Government** | `chitti_government.html` | deep-link |
| legal_doc: notice, summons, contract | **Legal** | `chitti_legal.html` | prefill via `localStorage` + hash (existing) |
| fraud_signal: UPI QR, SMS, invoice, bank screenshot | **UPI Fraud Guard** | `chitti_upi.html` | `sessionStorage` handoff (existing) |
| food, nutrition label, packaged goods | **Scanner food path** | (in-page) | inline result + Vaani read |
| bill / mrp overcharge | **Consumer helpline** | `tel:1800114000` | tel link (existing) |
| news article | **News** | `chitti_news.html` | deep-link |
| any / unsure | **Vaani** | `chitti_vaani.html` | `sessionStorage` handoff (existing) |

## COMING-SOON destinations (honest — no fake routing)

| Detected category | Specialist | Today's honest behaviour |
|---|---|---|
| crop / leaf / pest / soil / animal | **Farmer** | "Chitti Farmer is coming soon. For now I can read the label text or send this to Vaani." |
| homework / diagram / book / certificate | **Education** | "Chitti Education is coming soon. Routing you to Vaani meanwhile." |
| fan / AC / fridge / appliance | **Home Repair** | "Chitti Home-Repair is coming soon. I can read the warranty/model text now." |
| resume / job offer | **Career** | "Chitti Career is coming soon. Vaani can help in the meantime." |
| emergency / safety scene | **Guardian** | Routes to the **Vaani emergency cascade** (family-first, never cops). |

Every COMING-SOON card is **visible**, names the specialist, gives a real fallback, and is
spoken aloud. It never silently degrades and never pretends to answer.

## Confidence + tie-breaks

- **High confidence + live destination** → route directly, speak the route.
- **Medium** → route + offer the runner-up category as a one-tap correction.
- **Low / `unknown`** → ask the user to describe or pick (picture menu).
- **Two strong categories** → present both; the user picks. (Founder Rule: trust > guessing.)
- **Safety veto wins** (Safety agent is supreme): a `fraud_signal` co-detected with a
  payment QR routes to Fraud Guard **before** any commerce handoff.

## The 8 routing agents (full specs in [swarm/](swarm/))

| # | Agent | Question | Veto power |
|---|---|---|---|
| 1 | Classifier | What is it? | — |
| 2 | Trust | Is confidence high enough? (anti-overconfidence) | can force `unknown` |
| 3 | Safety | Any risk? (fraud, health, emergency) | **supreme — can override route** |
| 4 | Accessibility | How should the answer be delivered? | shapes delivery, not destination |
| 5 | Memory | Have we seen this before? | enriches, no veto |
| 6 | Learning | Can routing improve? (swarm feedback) | proposes only |
| 7 | Explanation | How do we teach the user *why*? | blocks if no reason |
| 8 | Router | Send to the best Chitti | final synthesis |

## Hard rules

- **No fake routing.** Unbuilt specialist → honest COMING SOON + real fallback.
- **Safety is supreme.** A detected fraud/emergency signal cannot be overridden by a
  commerce/convenience route.
- **Every route carries a reason** (Explanation agent blocks routes with no "why").
- **Confirm before handoff.** Navigating to another Chitti is a side effect — it passes the
  Golden-Rule confirm gate (or is a user-initiated tap, which is itself the confirmation).
- **Vaani is the canonical surface.** On `chitti_scanner.html` (dev/debug) the router
  deep-links to standalone pages; inside Vaani the same router emits a Vaani intent instead.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
