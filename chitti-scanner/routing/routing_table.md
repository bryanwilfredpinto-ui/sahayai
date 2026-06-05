🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# routing_table.md — the canonical category → Chitti map

> The single source of truth the frontend router mirrors. Keep this in sync with the
> `ROUTING_MAP` object in `chitti_scanner.html`. If the JS and this table disagree, fix
> the JS — **this table is the contract.** Subordinate to [ROUTING_ENGINE.md](../ROUTING_ENGINE.md).

## Schema

```
category → {
  label_en, label_hi,         // shown on the route card
  chitti,                     // human name of the specialist
  page,                       // deep-link target, or null if COMING SOON
  state,                      // "live" | "coming_soon"
  handoff,                    // "deeplink" | "prefill" | "session" | "tel" | "inline" | "vaani"
  reason_en, reason_hi        // why-this-route, read by the Explanation Layer
}
```

## Live routes

| category | chitti | page | handoff |
|---|---|---|---|
| `medicine` | MedUPI | `chitti_medupi.html` | inline (Jan-Aushadhi) |
| `health` | Health Scanner | `chitti_health_scanner.html` | deeplink |
| `vehicle_2w` | Bike Doctor | `chitti_2wheeler.html` | deeplink |
| `vehicle_4w` | Car Doctor | `chitti_4wheeler.html` | deeplink |
| `fashion` | Fashion | `chitti_fashion.html` | deeplink |
| `government_doc` | Government | `chitti_government.html` | deeplink |
| `legal_doc` | Legal | `chitti_legal.html` | prefill (localStorage + hash) |
| `fraud_signal` | UPI Fraud Guard | `chitti_upi.html` | session |
| `food` | Scanner food | _(in-page)_ | inline |
| `bill` / `mrp` | Consumer helpline | `tel:1800114000` | tel |
| `news` | News | `chitti_news.html` | deeplink |
| `unknown` / fallback | Vaani | `chitti_vaani.html` | session/vaani |

## COMING-SOON routes (page = null; honest)

| category | chitti | fallback |
|---|---|---|
| `crop` | Farmer | read label text in-page → Vaani |
| `education` | Education | Vaani |
| `appliance` | Home Repair | read warranty/model text in-page |
| `career_doc` | Career | Vaani |
| `emergency` | Guardian | **Vaani emergency cascade (family-first, never cops)** |

## Reason strings (Explanation Layer — examples)

| category | reason_en |
|---|---|
| `medicine` | "I saw a composition + expiry, so this is a medicine. MedUPI finds a cheaper same-composition Jan Aushadhi option." |
| `vehicle_2w` | "Dashboard / engine words tell me this is a 2-wheeler. The Bike Doctor diagnoses it and checks if a repair quote is fair." |
| `fraud_signal` | "I saw UPI / OTP / prize words — these are common scam signals, so I'm sending this to Fraud Guard first for your safety." |
| `crop` | "This looks like a crop/leaf issue. Chitti Farmer is coming soon — for now I can read the label or hand off to Vaani." |
| `unknown` | "I'm not fully sure what this is. Tell me, or pick a category, and I'll route it correctly." |

## Maintenance

Update this table when: a new specialist Chitti goes live (flip `coming_soon → live`, add
the `page`); a category's keyword signals change (update [DETECTION_ENGINE.md](../DETECTION_ENGINE.md));
or the Vaani intent name for a route changes. Then mirror the change into the
`ROUTING_MAP` in `chitti_scanner.html` and re-run [evals/router_accuracy.md](../evals/router_accuracy.md).

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
