"""
chitti-4wheeler / backend / services / doctor_data.py
-----------------------------------------------------
Deterministic knowledge tables for the Car Doctor surface (MECH-5).

NO DeepSeek · NO network · NO LLM. Everything here is a curated table or
a pure scoring helper. The car rupee bands run higher than the bike side
because car parts + labour cost more.

Safety contract: any red-line system (brakes · steering · airbag/SRS ·
overheat · tyre · EV high-voltage) carries can_drive=False so callers can
force a do-not-drive note. Never claim certainty — callers attach a
confidence band ("high" / "medium" / "low").

Tables:
  DASHBOARD_LIGHTS   — ~14 common car telltales
  SOUND_CATALOGUE    — ~9 car sounds + ranked causes
  INSPECT_CATEGORIES — ~100-point used-vehicle checklist
"""
from __future__ import annotations


# ──────────────────────────────────────────────────────────────────────
# 1. Dashboard Doctor — warning-light knowledge base (~14 car telltales)
#    severity: critical / warning / info ; color carries WORD + meaning.
# ──────────────────────────────────────────────────────────────────────
DASHBOARD_LIGHTS: list[dict] = [
    {
        "key": "check_engine", "icon": "🛠️", "name_en": "Check Engine / MIL",
        "name_hi": "Check engine light", "color": "amber", "severity": "warning",
        "can_drive": True, "recommended_within": "1-3 days",
        "risk": "Engine / emissions fault stored. Steady = drive gently to a scan; blinking = misfire, stop soon.",
        "note_en": "MIL is on. If steady, drive gently and get a DTC scan within a few days. If BLINKING, an active misfire is dumping fuel into the catalytic converter — reduce speed and stop soon.",
        "note_hi": "Check-engine light on hai. Steady hai to 2-3 din mein scan karao. BLINK kar rahi hai to misfire chal raha hai — speed kam karo, jaldi rukо.",
    },
    {
        "key": "abs", "icon": "🛑", "name_en": "ABS", "name_hi": "ABS warning",
        "color": "amber", "severity": "warning", "can_drive": True, "recommended_within": "1-3 days",
        "risk": "Anti-lock braking disabled — normal brakes still work but no anti-skid on hard stops.",
        "note_en": "ABS is disabled. Your brakes still stop the car, but anti-lock will not help in a panic stop on a wet road. Avoid hard braking and get it checked.",
        "note_hi": "ABS band hai. Normal brake chalega par hard braking pe skid rok nahi paayega. Zor se brake mat lagao, jald check karao.",
    },
    {
        "key": "airbag_srs", "icon": "💺", "name_en": "Airbag / SRS", "name_hi": "Airbag (SRS)",
        "color": "red", "severity": "critical", "can_drive": False, "recommended_within": "immediately",
        "risk": "SRS fault — airbags may NOT deploy in a crash, or may deploy unexpectedly.",
        "note_en": "SRS fault. Airbags may not deploy in a crash. This is a safety-critical fault — get it inspected before relying on the car for highway driving.",
        "note_hi": "SRS fault. Crash mein airbag nahi khulega. Yeh safety-critical hai — highway pe nikalne se pehle inspect karao.",
    },
    {
        "key": "battery_charging", "icon": "🔋", "name_en": "Battery / Charging", "name_hi": "Battery charging",
        "color": "red", "severity": "warning", "can_drive": True, "recommended_within": "same day",
        "risk": "Alternator not charging — car runs on battery reserve and will stall when it drains.",
        "note_en": "The charging system is not keeping up. The car is running on battery reserve and may stall once it drains. Switch off heavy loads (AC, music) and reach a mechanic the same day.",
        "note_hi": "Charging system kaam nahi kar raha. Battery reserve pe chal rahi hai, khatam hote hi band ho jaayegi. AC/music band karo, aaj hi mechanic tak pahuncho.",
    },
    {
        "key": "oil_pressure", "icon": "🛢️", "name_en": "Oil Pressure", "name_hi": "Oil pressure",
        "color": "red", "severity": "critical", "can_drive": False, "recommended_within": "immediately",
        "risk": "Low oil pressure — engine can seize within minutes. STOP.",
        "note_en": "Low oil pressure. Driving even a few minutes can seize the engine (₹40k-1.5L rebuild). Pull over safely NOW, switch off, check oil level, call assistance.",
        "note_hi": "Oil pressure low. Kuch minute bhi chalaya to engine seize ho jaayega (₹40k-1.5L). Abhi safe jagah rukо, band karo, oil level dekho, RSA bulao.",
    },
    {
        "key": "coolant_temp", "icon": "🌡️", "name_en": "Coolant Temp", "name_hi": "Engine temperature",
        "color": "red", "severity": "critical", "can_drive": False, "recommended_within": "immediately",
        "risk": "Engine overheating — head-gasket / warped head damage within minutes.",
        "note_en": "Engine is overheating. Continuing can blow the head gasket. Pull over, switch off, let it cool 20-30 min before opening the bonnet (never open a hot radiator cap). Check coolant once cool.",
        "note_hi": "Engine overheat ho raha. Aage chalaya to head-gasket ud jaayegi. Rukо, band karo, 20-30 min thanda hone do (garam radiator cap kabhi mat kholo). Thanda hone par coolant dekho.",
    },
    {
        "key": "brake_system", "icon": "🅿️", "name_en": "Brake System / EPB", "name_hi": "Brake system",
        "color": "red", "severity": "critical", "can_drive": False, "recommended_within": "immediately",
        "risk": "Brake fault — low fluid, worn pads, or EPB fault. Stopping power may be compromised.",
        "note_en": "Brake system warning. Could be low brake fluid, badly worn pads, or a handbrake/EPB fault. Brakes are non-negotiable — do not drive until checked; if the pedal feels soft, stop immediately.",
        "note_hi": "Brake system warning. Brake fluid kam, pads ghise, ya EPB fault ho sakta hai. Brake pe samjhauta nahi — check hone tak mat chalao; pedal soft lage to turant rukо.",
    },
    {
        "key": "eps", "icon": "🚗", "name_en": "EPS Power Steering", "name_hi": "Power steering",
        "color": "amber", "severity": "warning", "can_drive": True, "recommended_within": "1-3 days",
        "risk": "Electric power steering reduced or off — steering goes heavy, especially at low speed.",
        "note_en": "Power steering assist is reduced. The wheel will feel heavy, mostly while parking. The car still steers — drive gently and get it checked soon.",
        "note_hi": "Power steering kam ho gaya. Steering bhaari lagega, khaas kar parking mein. Chalti rahegi — dheere chalao, jald check karao.",
    },
    {
        "key": "tpms", "icon": "🛞", "name_en": "TPMS Tyre Pressure", "name_hi": "Tyre pressure",
        "color": "amber", "severity": "warning", "can_drive": False, "recommended_within": "same day",
        "risk": "Tyre pressure low / fault — under-inflated tyre can blow out at highway speed.",
        "note_en": "Tyre pressure is low. An under-inflated tyre overheats and can blow out at speed. Check all four (and spare) at the nearest pump; do not drive fast until corrected.",
        "note_hi": "Tyre pressure low hai. Kam hawa wala tyre garam hokar speed pe phat sakta hai. Sabhi 4 (aur stepney) nazdeeki pump pe check karao; theek hone tak tez mat chalao.",
    },
    {
        "key": "dpf", "icon": "♨️", "name_en": "DPF (Diesel)", "name_hi": "DPF filter (diesel)",
        "color": "amber", "severity": "warning", "can_drive": True, "recommended_within": "soon",
        "risk": "Diesel particulate filter clogging — needs a highway regen run or it blocks fully.",
        "note_en": "Diesel particulate filter is loading up, common in city-only driving. Drive 15-20 min at steady 60-80 km/h to let it regenerate. If the light stays, get it serviced before it blocks fully (expensive).",
        "note_hi": "Diesel DPF bhar raha hai — sirf city driving se aam baat. 60-80 km/h pe 15-20 min chalao taaki saaf ho. Phir bhi rahe to service karao, warna poora block (mehenga).",
    },
    {
        "key": "glow_plug", "icon": "🌀", "name_en": "Glow Plug (Diesel)", "name_hi": "Glow plug (diesel)",
        "color": "amber", "severity": "info", "can_drive": True, "recommended_within": "1-2 weeks",
        "risk": "Diesel glow-plug / pre-heat indicator. Flashing = engine-management fault.",
        "note_en": "Glow-plug indicator. Steady on start is normal (pre-heat) — wait for it to go off before cranking. If it FLASHES while driving, there is an engine-management fault; get it scanned.",
        "note_hi": "Glow-plug light. Start pe steady aana normal hai (pre-heat) — bujhne ke baad crank karo. Chalte hue BLINK kare to engine fault hai; scan karao.",
    },
    {
        "key": "traction_esp", "icon": "🌟", "name_en": "Traction / ESP", "name_hi": "Traction control (ESP)",
        "color": "amber", "severity": "warning", "can_drive": True, "recommended_within": "1-3 days",
        "risk": "Stability/traction control off or active. Blinking = working; steady = system fault.",
        "note_en": "ESP/traction warning. If it BLINKS, the system is actively gripping on a slippery surface — slow down. If it stays STEADY, the stability system has a fault and is disabled; drive gently and get it checked.",
        "note_hi": "ESP/traction warning. BLINK kare to system phisalti road pe kaam kar raha hai — dheere. STEADY rahe to system fault hai aur band hai; dheere chalao, check karao.",
    },
    {
        "key": "ev_battery", "icon": "⚡", "name_en": "EV Battery / Low SoC", "name_hi": "EV battery low",
        "color": "amber", "severity": "warning", "can_drive": True, "recommended_within": "soon",
        "risk": "EV high-voltage battery low state-of-charge — plan a charge before range runs out.",
        "note_en": "EV battery state-of-charge is low. Plan your nearest charger now; range drops faster with AC and on the highway. Drivable, but do not gamble the last few kilometres.",
        "note_hi": "EV battery charge kam hai. Abhi nazdeeki charger plan karo; AC aur highway pe range tezi se girti hai. Chalegi, par aakhri km ka jugaad mat karo.",
    },
    {
        "key": "ev_fault", "icon": "🔌", "name_en": "EV Fault / HV", "name_hi": "EV high-voltage fault",
        "color": "red", "severity": "critical", "can_drive": False, "recommended_within": "immediately",
        "risk": "EV high-voltage system fault — risk of power loss or electrical hazard. Do not drive.",
        "note_en": "EV high-voltage system fault. Risk of sudden power loss or an electrical hazard. Pull over safely, switch off, and call the OEM EV helpline / roadside assistance — do not attempt DIY on a high-voltage system.",
        "note_hi": "EV high-voltage fault. Achanak power jaa sakti hai ya electric hazard. Safe jagah rukо, band karo, OEM EV helpline/RSA bulao — high-voltage par DIY bilkul mat karo.",
    },
]

DASHBOARD_INDEX: dict[str, dict] = {l["key"]: l for l in DASHBOARD_LIGHTS}


def light_summary() -> list[dict]:
    """Public list view — drops the long internal note fields."""
    keep = ("key", "icon", "name_en", "name_hi", "color", "severity", "can_drive", "recommended_within")
    return [{k: l[k] for k in keep} for l in DASHBOARD_LIGHTS]


def light_confidence(light: dict) -> str:
    """Telltale meaning is well-standardised → high; an info-tier hint → medium."""
    return "high" if light["severity"] in ("critical", "warning") else "medium"


# ──────────────────────────────────────────────────────────────────────
# 2. Sound Doctor — deterministic catalogue (~9 car sounds)
#    Each entry: when-it-happens + 2-4 ranked candidate causes (~100%).
#    diy_tier: easy / moderate / mechanic ; cost_band in car rupees.
# ──────────────────────────────────────────────────────────────────────
SOUND_CATALOGUE: list[dict] = [
    {
        "key": "belt_squeal", "name_en": "Belt squeal / chirp", "name_hi": "Belt ki seeti",
        "when": "On cold start or when you turn the AC / steering; a high squeal.",
        "candidates": [
            {"cause": "Worn / glazed accessory (serpentine) belt", "pct": 50, "diy_tier": "mechanic", "cost_band": "₹800-3 000"},
            {"cause": "Loose belt tensioner / idler pulley", "pct": 30, "diy_tier": "mechanic", "cost_band": "₹1 500-6 000"},
            {"cause": "Belt wet from rain (clears on its own)", "pct": 20, "diy_tier": "easy", "cost_band": "₹0"},
        ],
        "safety_note_en": "Not instantly dangerous, but a snapped belt kills the alternator/power-steering — get it checked this week.",
        "safety_note_hi": "Turant khatra nahi, par belt toot gayi to alternator/power-steering band — is hafte check karao.",
        "can_drive": True,
    },
    {
        "key": "bearing_whine", "name_en": "Wheel-bearing whine / hum", "name_hi": "Pahiye ki ghisghisahat",
        "when": "A hum/drone that rises with SPEED and changes when you turn left vs right.",
        "candidates": [
            {"cause": "Worn wheel bearing", "pct": 60, "diy_tier": "mechanic", "cost_band": "₹2 500-8 000"},
            {"cause": "Uneven / cupped tyre wear", "pct": 25, "diy_tier": "mechanic", "cost_band": "₹3 000-12 000"},
            {"cause": "Worn CV joint / driveshaft", "pct": 15, "diy_tier": "mechanic", "cost_band": "₹3 000-10 000"},
        ],
        "safety_note_en": "A failing bearing can seize a wheel. Get it inspected before any long highway run.",
        "safety_note_hi": "Bearing fail hua to pahiya jam ho sakta hai. Lambi highway se pehle inspect karao.",
        "can_drive": True,
    },
    {
        "key": "brake_grind", "name_en": "Brake grind / squeal", "name_hi": "Brake ki chaunk/ghisaai",
        "when": "When you press the brake — a squeal (early) or metal-on-metal grind (late).",
        "candidates": [
            {"cause": "Worn brake pads (wear indicator)", "pct": 55, "diy_tier": "mechanic", "cost_band": "₹2 000-6 000"},
            {"cause": "Scored / warped discs (metal grind)", "pct": 30, "diy_tier": "mechanic", "cost_band": "₹4 000-15 000"},
            {"cause": "Stuck caliper / dust glaze", "pct": 15, "diy_tier": "mechanic", "cost_band": "₹2 000-9 000"},
        ],
        "safety_note_en": "Brakes are a red line. A grind means metal-on-metal — stopping distance is compromised. Do not drive far; get it fixed now.",
        "safety_note_hi": "Brake red-line hai. Grind matlab metal-on-metal — rukne ki doori badh gayi. Door mat chalao; abhi theek karao.",
        "can_drive": False,
    },
    {
        "key": "engine_knock", "name_en": "Engine knock / pinging", "name_hi": "Engine ki khatkhat (knocking)",
        "when": "A metallic knock/ping under acceleration or load, esp. uphill.",
        "candidates": [
            {"cause": "Low-octane / poor fuel causing pre-ignition", "pct": 40, "diy_tier": "easy", "cost_band": "₹0-500"},
            {"cause": "Carbon build-up / wrong spark timing", "pct": 35, "diy_tier": "mechanic", "cost_band": "₹2 000-8 000"},
            {"cause": "Worn bearings / serious internal knock", "pct": 25, "diy_tier": "mechanic", "cost_band": "₹15 000-80 000"},
        ],
        "safety_note_en": "Persistent knock damages the engine. First try a better fuel + injector clean; if it stays, stop and get it diagnosed.",
        "safety_note_hi": "Lagataar knock engine kharab karta hai. Pehle achha fuel + injector clean; phir bhi rahe to rukо aur diagnose karao.",
        "can_drive": True,
    },
    {
        "key": "suspension_knock", "name_en": "Suspension / strut knock", "name_hi": "Suspension ki thakthak",
        "when": "A clunk/knock over bumps or speed-breakers, from under the car.",
        "candidates": [
            {"cause": "Worn strut mount / link rod / bush", "pct": 50, "diy_tier": "mechanic", "cost_band": "₹1 500-6 000"},
            {"cause": "Worn shock absorber", "pct": 30, "diy_tier": "mechanic", "cost_band": "₹4 000-16 000"},
            {"cause": "Loose ball joint / control arm", "pct": 20, "diy_tier": "mechanic", "cost_band": "₹2 000-9 000"},
        ],
        "safety_note_en": "A loose ball joint or control arm can fail and cause loss of control. Get the front end inspected soon.",
        "safety_note_hi": "Ball joint/control arm dheela ho to control jaa sakta hai. Front-end jald inspect karao.",
        "can_drive": True,
    },
    {
        "key": "exhaust_blow", "name_en": "Exhaust blow / drone", "name_hi": "Silencer ki phut-phut",
        "when": "A louder-than-normal puttering/drone from the back, esp. on revs.",
        "candidates": [
            {"cause": "Hole / rust in exhaust pipe or silencer", "pct": 55, "diy_tier": "mechanic", "cost_band": "₹800-5 000"},
            {"cause": "Blown exhaust gasket / loose joint", "pct": 30, "diy_tier": "mechanic", "cost_band": "₹500-3 000"},
            {"cause": "Failed catalytic converter mount", "pct": 15, "diy_tier": "mechanic", "cost_band": "₹3 000-30 000"},
        ],
        "safety_note_en": "An exhaust leak can let fumes into the cabin. Don't drive long with windows up; get it sealed.",
        "safety_note_hi": "Exhaust leak se cabin mein dhuan aa sakta hai. Window band kar ke door mat chalao; seal karao.",
        "can_drive": True,
    },
    {
        "key": "ac_noise", "name_en": "AC compressor noise", "name_hi": "AC compressor ki awaaz",
        "when": "A rattle/squeal/clutch-click only when the AC is switched ON.",
        "candidates": [
            {"cause": "AC compressor clutch / bearing wear", "pct": 50, "diy_tier": "mechanic", "cost_band": "₹3 000-18 000"},
            {"cause": "Low refrigerant / compressor cycling", "pct": 30, "diy_tier": "mechanic", "cost_band": "₹1 500-6 000"},
            {"cause": "Loose / worn AC belt", "pct": 20, "diy_tier": "mechanic", "cost_band": "₹800-3 000"},
        ],
        "safety_note_en": "Not a safety issue, but a seizing compressor can snap the belt. Get it looked at before summer load.",
        "safety_note_hi": "Safety issue nahi, par compressor jam hua to belt toot sakti hai. Garmi se pehle dikhao.",
        "can_drive": True,
    },
    {
        "key": "cvt_drone", "name_en": "CVT / torque-converter drone", "name_hi": "Gearbox ki gunjan",
        "when": "A droning/shudder during gentle acceleration in an automatic (CVT/AT).",
        "candidates": [
            {"cause": "Degraded / overdue transmission fluid", "pct": 45, "diy_tier": "mechanic", "cost_band": "₹3 000-9 000"},
            {"cause": "Torque-converter lock-up shudder", "pct": 30, "diy_tier": "mechanic", "cost_band": "₹8 000-40 000"},
            {"cause": "CVT belt/chain or valve-body wear", "pct": 25, "diy_tier": "mechanic", "cost_band": "₹25 000-1 50 000"},
        ],
        "safety_note_en": "Automatic gearboxes are expensive — a fluid change early can save a rebuild. Get it diagnosed before it worsens.",
        "safety_note_hi": "Automatic gearbox mehenga hai — time pe fluid change rebuild bacha sakta hai. Bigadne se pehle diagnose karao.",
        "can_drive": True,
    },
    {
        "key": "diesel_tick", "name_en": "Diesel injector tick", "name_hi": "Diesel injector ki tik-tik",
        "when": "A sewing-machine tick from a diesel engine, louder when cold/idling.",
        "candidates": [
            {"cause": "Normal diesel injector/valve tick (cold)", "pct": 45, "diy_tier": "easy", "cost_band": "₹0"},
            {"cause": "Injector wear / poor fuel", "pct": 35, "diy_tier": "mechanic", "cost_band": "₹3 000-25 000"},
            {"cause": "Valve clearance / tappet adjustment due", "pct": 20, "diy_tier": "mechanic", "cost_band": "₹1 500-6 000"},
        ],
        "safety_note_en": "Some diesel tick is normal. If it grows louder or comes with power loss/smoke, get the injectors checked.",
        "safety_note_hi": "Thodi diesel tik-tik normal hai. Tez ho ya power-loss/dhuan ke saath aaye to injector check karao.",
        "can_drive": True,
    },
]

SOUND_INDEX: dict[str, dict] = {s["key"]: s for s in SOUND_CATALOGUE}


def sound_catalogue_summary() -> list[dict]:
    keep = ("key", "name_en", "name_hi", "when")
    return [{k: s[k] for k in keep} for s in SOUND_CATALOGUE]


def sound_confidence(sound: dict) -> str:
    """If the top candidate dominates (>=55%) we're more sure; spread → medium."""
    top = max((c["pct"] for c in sound["candidates"]), default=0)
    return "high" if top >= 55 else "medium"


# ──────────────────────────────────────────────────────────────────────
# 3. Used-Vehicle Inspector — ~100-point checklist (deterministic score)
#    Each point: id · q_en · q_hi · weight · critical(bool).
# ──────────────────────────────────────────────────────────────────────
def _pt(pid: str, q_en: str, q_hi: str, weight: int = 1, critical: bool = False) -> dict:
    return {"id": pid, "q_en": q_en, "q_hi": q_hi, "weight": weight, "critical": critical}


INSPECT_CATEGORIES: list[dict] = [
    {"name": "Engine / Start / Smoke", "points": [
        _pt("eng_cold_start", "Cold-starts cleanly without long cranking?", "Cold start saaf hota hai, lamba crank nahi?", 3),
        _pt("eng_idle_smooth", "Idle is steady with no rough vibration?", "Idle steady hai, jhatka nahi?", 2),
        _pt("eng_no_blue_smoke", "No blue smoke from exhaust (oil burning)?", "Exhaust se neela dhuan nahi (oil jal raha)?", 3, True),
        _pt("eng_no_white_smoke", "No white smoke when warm (head gasket / coolant)?", "Garam hone par safed dhuan nahi (head-gasket)?", 3, True),
        _pt("eng_no_black_smoke", "No black smoke (rich mixture / injector)?", "Kaala dhuan nahi (rich mixture)?", 2),
        _pt("eng_oil_clean", "Engine oil on dipstick is clean, not milky?", "Dipstick ka oil saaf hai, doodhiya nahi?", 2, True),
        _pt("eng_no_knock", "No knocking / tapping noise at any rev?", "Kisi bhi rev pe knock/tappet nahi?", 2),
        _pt("eng_coolant_clean", "Coolant is clean, reservoir level correct, no oil film?", "Coolant saaf, level theek, oil film nahi?", 2),
        _pt("eng_no_leaks", "No oil / coolant leaks under the engine bay?", "Engine ke neeche oil/coolant leak nahi?", 2),
        _pt("eng_belts_ok", "Belts and hoses are not cracked or frayed?", "Belt aur hose phate/ghise nahi?", 1),
        _pt("eng_mounts_ok", "Engine mounts firm (no excess shudder in D/R)?", "Engine mount theek (D/R mein zyada shudder nahi)?", 1),
        _pt("eng_no_mil", "No check-engine light on the dash?", "Dashboard pe check-engine light nahi?", 2),
        _pt("eng_battery_age", "Service stickers / battery date suggest sane maintenance age?", "Service sticker/battery date theek maintenance umar dikhati?", 1),
        _pt("eng_air_filter", "Air filter is clean (not choked with dust)?", "Air filter saaf (dhool se choke nahi)?", 1),
        _pt("eng_radiator_ok", "Radiator/condenser fins not bent or leaking?", "Radiator/condenser fins mude ya leak nahi?", 1),
    ]},
    {"name": "Transmission / Clutch / Gearbox", "points": [
        _pt("tx_mt_clutch", "MT: clutch bites mid-travel, not at the very top (worn)?", "MT: clutch beech mein pakadta hai, ekdum upar nahi?", 3),
        _pt("tx_mt_shift", "MT: all gears engage smoothly, no grind into 2nd?", "MT: sabhi gear smooth lagte, 2nd mein grind nahi?", 2),
        _pt("tx_no_slip", "No RPM flare / slip when accelerating?", "Accelerate karte RPM flare/slip nahi?", 3, True),
        _pt("tx_at_shift", "AT/AMT/CVT: shifts are smooth without hard jerks?", "AT/AMT/CVT: shift smooth, hard jerk nahi?", 3),
        _pt("tx_at_engage", "AT: engages D and R within ~1 sec, no delay?", "AT: D aur R ~1 sec mein lagta, delay nahi?", 2),
        _pt("tx_fluid_clean", "Transmission fluid (where checkable) is red/clean, not burnt?", "Gearbox fluid (jahan dikhe) laal/saaf, jala nahi?", 2),
        _pt("tx_no_whine", "No whine / drone from the gearbox under load?", "Load par gearbox se whine/drone nahi?", 1),
        _pt("tx_no_leak", "No transmission oil leak under the car?", "Gaadi ke neeche gearbox oil leak nahi?", 1),
        _pt("tx_clutch_smell", "No burning-clutch smell after a hill start?", "Hill start ke baad jali-clutch ki badbu nahi?", 1),
        _pt("tx_reverse_clean", "Reverse engages cleanly without grind/jerk?", "Reverse saaf lagta, grind/jerk nahi?", 1),
    ]},
    {"name": "Electrical / Battery / Alternator", "points": [
        _pt("el_batt_health", "Battery holds charge, terminals clean, no swelling?", "Battery charge rakhti, terminal saaf, phooli nahi?", 2),
        _pt("el_alt_charge", "Alternator charges (~13.5-14.5V running)?", "Alternator charge karta (~13.5-14.5V)?", 2, True),
        _pt("el_no_warn", "No warning lights stuck on after start?", "Start ke baad koi warning light atki nahi?", 2),
        _pt("el_lights_all", "All lights work — head/tail/brake/indicator/reverse/fog?", "Sabhi light chalti — head/tail/brake/indicator/reverse/fog?", 1),
        _pt("el_power_windows", "All power windows + central locking work?", "Sabhi power window + central locking chalti?", 1),
        _pt("el_horn_wiper", "Horn, wipers and washer spray all work?", "Horn, wiper aur washer chalte?", 1),
        _pt("el_infotainment", "Infotainment / speakers / reverse camera work?", "Music system/speaker/reverse camera chalta?", 1),
        _pt("el_no_aftermarket_mess", "Wiring is tidy, no dodgy aftermarket splices?", "Wiring saaf, ghatiya aftermarket jod nahi?", 1),
        _pt("el_sensors_ok", "Fuel gauge, temp gauge and odometer all read correctly?", "Fuel/temp gauge aur odometer sahi padhte?", 1),
    ]},
    {"name": "Brakes + ABS", "points": [
        _pt("br_pedal_firm", "Brake pedal is firm, not spongy or sinking?", "Brake pedal firm hai, soft/dabakta nahi?", 3, True),
        _pt("br_no_pull", "Car brakes straight, no pulling to one side?", "Brake par gaadi seedhi rukti, ek taraf nahi khinchti?", 3, True),
        _pt("br_no_grind", "No grinding / metal squeal when braking?", "Brake par grind/metal awaaz nahi?", 2, True),
        _pt("br_abs_ok", "ABS light goes off and ABS pulses on a hard stop?", "ABS light bujhti aur hard-stop par ABS pulse karta?", 2, True),
        _pt("br_pads_disc", "Pads have life left and discs are not deeply scored?", "Pads mein life bachi, disc gehri ghisi nahi?", 2),
        _pt("br_handbrake", "Handbrake / EPB holds on a slope?", "Handbrake/EPB dhaal par pakadta?", 2, True),
        _pt("br_fluid_level", "Brake fluid level correct and fluid not dark?", "Brake fluid level theek aur kaala nahi?", 1),
    ]},
    {"name": "Tyres + Spare", "points": [
        _pt("ty_tread_even", "All four tyres have even tread (no inner/outer wear)?", "Chaaron tyre ka tread even (andar/bahar ghisaai nahi)?", 2, True),
        _pt("ty_tread_depth", "Tread depth is above the legal/wear marker?", "Tread depth wear-marker se upar?", 2, True),
        _pt("ty_same_set", "Tyres are a matched set, not mismatched brands/sizes?", "Tyre matched set, alag brand/size nahi?", 1),
        _pt("ty_no_damage", "No bulges, cracks or sidewall cuts on any tyre?", "Kisi tyre par bulge/crack/cut nahi?", 2, True),
        _pt("ty_age", "Tyre manufacture date is within ~5 years?", "Tyre ki banne ki date ~5 saal ke andar?", 1),
        _pt("ty_spare", "Spare tyre present, inflated, with jack + tools?", "Stepney maujood, hawa bhari, jack+tools ke saath?", 1),
        _pt("ty_alloy_ok", "Wheels/alloys not bent or badly cracked?", "Pahiye/alloy mude ya phate nahi?", 1),
    ]},
    {"name": "Suspension / Steering", "points": [
        _pt("su_bounce", "Bounce test: each corner settles in 1-2 rebounds?", "Bounce test: har corner 1-2 baar mein ruk jaata?", 2),
        _pt("su_no_clunk", "No clunks over bumps (struts / links / bushes)?", "Bump par clunk nahi (strut/link/bush)?", 2),
        _pt("st_centered", "Steering is centered and car tracks straight hands-off?", "Steering center, haath chhodne par seedhi chalti?", 3, True),
        _pt("st_no_play", "No free play / vagueness in the steering?", "Steering mein free-play/dheelapan nahi?", 2, True),
        _pt("st_no_vibration", "No vibration through the wheel at highway speed?", "Highway speed par steering vibration nahi?", 1),
        _pt("st_full_lock", "Turns full-lock both ways without noise/binding?", "Dono taraf full-lock bina awaaz/jam ke?", 1),
        _pt("su_ride_height", "Ride height even at all four corners (no sag)?", "Chaaron corner par ride-height even (sag nahi)?", 1),
    ]},
    {"name": "AC / Climate", "points": [
        _pt("ac_cools_fast", "AC cools quickly and holds a cold cabin?", "AC jaldi thanda karta aur cabin thandi rakhta?", 2),
        _pt("ac_blower_all", "Blower works on all speeds without rattle?", "Blower sabhi speed par bina rattle ke chalta?", 1),
        _pt("ac_no_smell", "No musty / burning smell from vents?", "Vent se sila/jalne ki badbu nahi?", 1),
        _pt("ac_heater_demist", "Heater + demister/defogger work?", "Heater + demister/defogger chalte?", 1),
        _pt("ac_rear_vents", "Rear vents (if fitted) blow cold?", "Rear vent (agar hai) thanda dete?", 1),
        _pt("ac_idle_cool", "AC stays cold at idle, not just while moving?", "AC idle par bhi thanda rehta, sirf chalte hue nahi?", 1),
    ]},
    {"name": "Body / Rust / Paint / Flood", "points": [
        _pt("bo_panel_gaps", "Panel gaps are even (no past major accident repair)?", "Panel gaps even (purana bada accident nahi)?", 2),
        _pt("bo_paint_match", "Paint matches across panels (no hidden respray)?", "Paint sabhi panel par match (chhupa respray nahi)?", 2),
        _pt("bo_no_rust", "No rust on sills, wheel arches, boot floor, doors?", "Sill/arch/boot-floor/door par rust nahi?", 2, True),
        _pt("bo_chassis_straight", "Chassis rails / engine bay show no weld or kink?", "Chassis rail/engine bay par weld ya kink nahi?", 3, True),
        _pt("bo_no_flood", "No flood signs — silt in carpets, water-line stains, musty boot?", "Flood ke nishaan nahi — carpet mein silt, water-line daag, sila boot?", 3, True),
        _pt("bo_doors_shut", "All doors, bonnet and boot open + shut + seal properly?", "Sabhi door/bonnet/boot sahi khulte-band hote, seal theek?", 1),
        _pt("bo_glass_ok", "Windscreen + windows free of major cracks?", "Windscreen + window par badi crack nahi?", 1),
        _pt("bo_underbody", "Underbody is solid, no patched or rotten sections?", "Underbody solid, patch/galaa hua hissa nahi?", 2),
        _pt("bo_interior_wear", "Interior wear (seats/pedals/steering) matches the claimed km?", "Interior ghisaai (seat/pedal/steering) claim kiye km se match?", 1),
        _pt("bo_boot_floor", "Boot floor + spare well dry, no rust or water marks?", "Boot floor + spare well sukha, rust/paani ke nishaan nahi?", 1),
    ]},
    {"name": "Airbag / SRS", "points": [
        _pt("sr_light_cycles", "SRS light comes on at ignition then goes OFF?", "Ignition par SRS light aati phir BUJH jaati?", 3, True),
        _pt("sr_not_deployed", "No signs of a past deployment (cut/replaced dash, steering)?", "Pehle airbag khulne ke nishaan nahi (kata/badla dash/steering)?", 3, True),
        _pt("sr_belts_ok", "Seatbelts latch, retract, and are not frayed/cut?", "Seatbelt latch/retract karti, ghisi/kati nahi?", 2, True),
        _pt("sr_count", "All advertised airbags physically present (covers intact)?", "Saare bataaye gaye airbag maujood (cover intact)?", 1),
    ]},
    {"name": "Documents", "points": [
        _pt("doc_rc_match", "RC matches the chassis + engine number on the car?", "RC, gaadi ke chassis+engine number se match?", 3, True),
        _pt("doc_insurance", "Insurance is valid (and any No-Claim-Bonus noted)?", "Insurance valid (NCB note kiya)?", 2),
        _pt("doc_puc", "PUC (pollution) certificate is current?", "PUC (pollution) certificate current?", 1),
        _pt("doc_loan_noc", "If financed, loan-closure NOC / hypothecation cleared?", "Agar financed, loan NOC/hypothecation cleared?", 3, True),
        _pt("doc_service_book", "Service history / book is available and consistent?", "Service history/book maujood aur consistent?", 2),
        _pt("doc_owners", "Number of previous owners is acceptable for the price?", "Pichle owner ki ginti price ke hisaab se theek?", 1),
        _pt("doc_no_challan", "No large pending traffic challans against the vehicle?", "Gaadi par bade pending challan nahi?", 1),
        _pt("doc_road_tax", "Road tax / fitness (commercial) is paid up to date?", "Road tax/fitness (commercial) updated?", 1),
        _pt("doc_keys_two", "Two keys (incl. spare/remote) are handed over?", "Do chaabi (spare/remote samet) milti hai?", 1),
        _pt("doc_no_blacklist", "Vehicle is not flagged blacklisted / theft / accident-total on VAHAN?", "VAHAN par gaadi blacklist/chori/total nahi?", 2, True),
    ]},
    {"name": "Test Drive", "points": [
        _pt("td_pickup", "Pulls cleanly through the rev range, no flat spots?", "Rev range mein saaf pull karti, flat-spot nahi?", 2),
        _pt("td_straight", "Tracks straight on a flat road, no drift?", "Flat road par seedhi chalti, drift nahi?", 2, True),
        _pt("td_brake_test", "Brakes hard and straight from ~40 km/h?", "~40 km/h se hard+seedha brake lagti?", 2, True),
        _pt("td_gear_change", "Up/down shifts are smooth at speed?", "Speed par up/down shift smooth?", 1),
        _pt("td_no_warn", "No new warning lights appear during the drive?", "Drive ke dauraan nayi warning light nahi aati?", 2, True),
        _pt("td_no_overheat", "Temperature stays normal through the drive?", "Drive bhar temperature normal rehta?", 2, True),
        _pt("td_cabin_quiet", "No new rattles, wind-noise or vibrations at speed?", "Speed par naya rattle/wind-noise/vibration nahi?", 1),
        _pt("td_clutch_bite", "Clutch/AT take-up is smooth from a standstill on a slope?", "Dhaal par standstill se clutch/AT take-up smooth?", 1),
        _pt("td_aircon_load", "AC + uphill load together: no power-loss or temperature climb?", "AC + chadhaai ek saath: power-loss/temp badhna nahi?", 1),
    ]},
]


def inspect_total_points() -> int:
    return sum(len(c["points"]) for c in INSPECT_CATEGORIES)


def inspect_index() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for cat in INSPECT_CATEGORIES:
        for p in cat["points"]:
            out[p["id"]] = {**p, "category": cat["name"]}
    return out
