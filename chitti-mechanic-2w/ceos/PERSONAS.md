🎖️ World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.

# PERSONAS — Chitti Mechanic 2 Wheeler

> Per [CONSTITUTION.md](CONSTITUTION.md) Article 1 (Access First, Vehicle Second), no
> feature ships unless it serves **all nine accessibility archetypes**. The
> **design target** is the **gig delivery rider** — if Chitti works flawlessly for a
> rider who is on the road 10 hours a day, often cannot read, on a low-end 3G phone,
> it works for everyone.

---

## The design target — Gig Delivery Rider

**Who:** Ramesh, 26, delivers food on a Honda Activa, 80–100 km a day, 6 days a week.
Class-X dropout, reads Hindi slowly, speaks Hindi + broken English. Low-end Android,
patchy 3G between deliveries.
**Pain points:** Bike downtime = lost income. Overcharged by repair shops who see a
rider as easy money. Forgets PUC until a traffic cop fines him. Renews insurance
blindly at the dealer at inflated rates.
**Goals:** Keep the bike running, minimise downtime, never lose a day to a fine, save
every rupee.
**Frustrations:** No time to read manuals, no trust in mechanics, no idea if a quote
is fair.
**Accessibility needs:** Voice-first, hands-free, glove-friendly large taps, works on
3G, offline reminders.

---

## The nine accessibility archetypes

### 1. BLIND (~5 million)
**Need:** Full audio + screen-reader compatibility; every screen narrated, every
action confirmable by voice. **Design rule:** voice IN and voice OUT for everything —
reading a service bill aloud, speaking a reminder, confirming a call with "haan."
Nothing relies on sight.

### 2. DEAF (~6 million)
**Need:** Captions on all audio + haptic alerts. **Design rule:** every spoken output
also appears as text and (where the brief says "108") a visible, tappable button. A
reminder buzzes; a triage shows a colour + icon + word. ISL panel on every response.

### 3. MUTE (~2 million)
**Need:** Tap + type, never voice-required. **Design rule:** every voice action has a
tap/type equivalent. The "confirm with haan" Golden Rule is satisfied by a tap, never
forcing speech.

### 4. ILLITERATE (~250 million)
**Need:** Icons + voice, minimal text. **Design rule:** the interface is icon-driven;
every icon is also spoken on tap. A service bill, an insurance quote, a fine notice —
all read aloud and explained in plain spoken language.

### 5. ELDERLY (~150 million)
**Need:** Large 48px+ taps, simple flows, patient pacing. **Design rule:** big
targets, no time-outs into action (Golden Rule: silence waits forever), large
readable text, slow clear voice.

### 6. LOW_VISION (~50 million)
**Need:** 400% zoom without breakage, high contrast. **Design rule:** layouts reflow
cleanly at 400% zoom; never colour-only signalling; high-contrast theme available.

### 7. COGNITIVE (~20 million)
**Need:** Simplified language, no flashing, predictable steps. **Design rule:** one
task per screen, plain words, no animations that flash, consistent placement, gentle
confirmations.

### 8. MOTOR (~15 million)
**Need:** Keyboard + voice navigation, large targets, no precision gestures.
**Design rule:** fully operable by keyboard and by voice; no drag/pinch-only actions;
generous tap zones.

### 9. RURAL (~900 million)
**Need:** Offline-first + SMS fallback, works on 3G. **Design rule:** the
deterministic engine answers offline; reminders survive no-network; critical alerts
fall back to SMS; assets are light enough for 3G.

---

## Real-world personas

### Ramesh — Gig Delivery Rider (design target)
Covered above. Income depends on uptime; the most demanding user; if Chitti serves
Ramesh, it serves all.

### Priya — Student commuter
19, rides a TVS Scooty to college, tight budget, tech-comfortable. **Wants:** cheapest
honest insurance, knows when service is due, learns basic DIY (chain lube, tyre
pressure) to save money. **Frustration:** dealer service feels overpriced.

### Lakshmi — Homemaker
38, rides a Honda Activa for errands and school runs, manages the family budget.
**Wants:** never miss PUC/insurance, fair repair quotes, a vault for all family
vehicle documents. **Accessibility:** prefers Hindi voice, reads slowly.

### Suresh — Farmer
52, rides a Bajaj motorcycle on village roads, 2G/3G coverage, low literacy.
**Wants:** offline reminders, plain-spoken advice, durable-tyre guidance for rough
roads, no jargon. **Accessibility:** illiterate + rural — voice + icons + offline.

### Gopal — Senior citizen
68, rides a Hero Splendor occasionally, eyesight failing, cautious. **Wants:** large
text, big taps, patient voice, simple reminders, someone to read the insurance
renewal aloud. **Accessibility:** elderly + low-vision.

### Imran — Small-fleet owner
34, owns 5 bikes rented to delivery riders. **Wants:** track documents and renewals
across all 5 vehicles, schedule servicing, compare insurance in bulk, catch scams on
repair bills. **Frustration:** juggling paperwork for a fleet.

### Anita — Used-bike buyer
28, buying her first second-hand Royal Enfield. **Wants:** fair valuation, odometer/
fraud check, history of the vehicle, what to inspect, scam alerts. **Frustration:**
fear of buying a lemon or a stolen bike.

---

## Coverage rule

Every BO in the [ROADMAP.md](ROADMAP.md) is tested against **all nine archetypes** and
at least the relevant real-world personas before it is called done. A feature that
works for Priya but breaks for Suresh or Ramesh is not done.

---
> **World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.**
