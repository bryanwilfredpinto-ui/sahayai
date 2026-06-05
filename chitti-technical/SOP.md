🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# SOP — Chitti Technical

Six standard operating procedures. Each is the **exact, ordered method** Chitti
follows so a long-term setup and an intraday setup are judged consistently. Every
SOP ends with the same non-negotiable: **risk block + invalidation + disclaimer.**

---

## SOP 1 — Long-Term Trade (Monthly → Weekly → Daily)

1. **Monthly** — establish the regime. Is the stock in a long-term uptrend
   (price above rising long EMAs, higher highs)? If the monthly is down, a
   long-term *buy* is off the table — say so and stop.
2. **Weekly** — find the position within the regime. Pullback to support inside
   an uptrend = accumulation zone; extended far above the mean = wait.
3. **Daily** — time the **entry**. Trigger only in the direction the monthly set.
4. **Risk** — stop below the *weekly* invalidation (wide); size small; RR ≥ 1:3.
5. **Output** — entry zone, stop, three targets, RR, "this is wrong if weekly
   closes below X," disclaimer.

## SOP 2 — Positional Trade (Weekly → Daily)

1. **Weekly** — direction + momentum. Fresh trend or mature?
2. **Daily** — entry trigger; flag "already extended" if daily is stretched.
3. **Risk** — stop on daily structure; RR ≥ 1:3; size to risk budget.
4. **Output** — full risk block + invalidation + disclaimer.

## SOP 3 — Swing Trade (Daily → 4-Hourly)

1. **Daily** — structure + direction.
2. **4-Hourly** — entry trigger; require agreement with the daily.
3. **Risk** — tighter stop on 4H structure; RR ≥ 1:2.
4. **Output** — full risk block + invalidation + disclaimer.

## SOP 4 — Intraday Trade (4-Hourly → Hourly)

1. **4-Hourly** — session bias.
2. **Hourly** — entry trigger; **hard rule: if 4H bias and 1H trigger disagree,
   NO TRADE.**
3. **Risk** — very tight stop; RR ≥ 1:1.5; mandatory **session-end exit reminder**.
4. **Output** — full risk block + invalidation + "square off by close" + disclaimer.

> **Common rule across SOP 1–4 (Founder Rule #4):** the higher timeframe in the
> ladder governs direction; the lower timeframe only triggers. Disagreement is a
> **HOLD/WAIT**, never a forced signal. The confluence engine encodes this.

---

## SOP 5 — Trade Review

After a signalled trade closes (hit target or stop):

1. Pull the realised outcome from Portfolio Mode (F9).
2. Compare **promised vs realised**: did it reach Target 1 before the stop? Was
   the RR honoured?
3. Log the result to the accuracy eval ([evals/signal_accuracy.md](evals/signal_accuracy.md))
   and the user's private win/loss ledger.
4. **Teach, don't blame:** explain what the chart did vs what was expected. A
   loss that respected the stop is a *good* trade; a win that ignored the stop is
   a *lucky* one. (Founder Rule #1.)

## SOP 6 — Risk Review

Standing discipline check, run on every signal before it ships and surfaced in
Portfolio Mode aggregates:

1. Is there a stop loss on the correct side of entry? (No → block.)
2. Does RR clear the trade-type floor? (No → flag "reward doesn't justify risk.")
3. Is position size within the user's risk budget?
4. Is the invalidation a single, checkable sentence?
5. Is the NOT-SEBI-REGISTERED disclaimer present?
6. Aggregate: is the user over-trading / revenge-trading? ([guardrails/overconfidence.md](guardrails/overconfidence.md)) → gentle, plain-language nudge.

---

## Accessibility overlay (applies to every SOP)

- **Blind:** the SOP output is delivered as an **Audio Trade Summary** in ladder
  order (higher TF → entry → stop → target → confidence).
- **Deaf:** every step rendered as a labelled visual card + ISL panel.
- **Illiterate:** icons (📈 / 🛑 / 🎯) + voice; voice confirmation for any action
  (e.g. setting an alert) per the Golden Rule.
- **Language:** the entire SOP output renders in the user's selected language.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
