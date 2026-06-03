"""
chitti-2wheeler / backend / services / doctor_data.py
-----------------------------------------------------
Deterministic knowledge tables for the Doctor surface (MECH-5). NO
DeepSeek / NO network — every table here is a fixed knowledge corpus
that the routes in routes/doctor.py score against.

Tables:
  DASHBOARD_LIGHTS   — ~12 common 2-wheeler telltales (Dashboard Doctor)
  SOUND_CATALOGUE    — ~8 bike sounds + ranked candidate causes (Sound Doctor)
  INSPECT_CHECKLIST  — ~100-point used-vehicle inspection
  OBD_THRESHOLDS     — live-param red-lines for the OBD2 snapshot interpreter

Safety contract (SAHAYAI_MASTER §6 + the four-user a11y floor):
  - colour NEVER carries meaning alone — every light/severity also has a
    WORD label + symbol.
  - red-line systems (brakes / tyres / steering / fork / HV battery)
    force can_ride:false + a do-not-ride note.
  - nothing here claims certainty: callers attach a confidence band and
    use Likely / Possible language.
"""
from __future__ import annotations

# ── 1. Dashboard Doctor — warning-light KB ────────────────────────────
# color is paired with a WORD label by the route; severity ∈ red/amber/green.
# can_ride:false is forced for any safety red-line telltale.
DASHBOARD_LIGHTS: list[dict] = [
    {
        "key": "mil", "icon": "🛠️", "name_en": "Check-engine (MIL)", "name_hi": "Check-engine (MIL)",
        "color": "amber", "severity": "amber", "can_ride": True, "recommended_within": "within 2-3 days",
        "note_en": "Engine fault stored. Likely a sensor or fuel issue — ride gently, get it scanned soon.",
        "note_hi": "Engine fault stored hai. Sensor ya fuel issue ho sakta — dhire chalao, jaldi scan karwao.",
        "risk": "Possible misfire / emissions fault; long ignore can damage cat-converter.",
    },
    {
        "key": "low_fuel", "icon": "⛽", "name_en": "Low fuel", "name_hi": "Petrol kam",
        "color": "amber", "severity": "amber", "can_ride": True, "recommended_within": "fill at next pump",
        "note_en": "Reserve range only. Fill soon — running dry can starve the fuel pump.",
        "note_hi": "Reserve hi bacha hai. Jaldi petrol bharo — bilkul khaali chalana pump ke liye theek nahi.",
        "risk": "Stranding risk; repeated dry-running stresses the fuel pump.",
    },
    {
        "key": "low_oil", "icon": "🛢️", "name_en": "Low oil pressure", "name_hi": "Oil pressure kam",
        "color": "red", "severity": "red", "can_ride": False, "recommended_within": "STOP now",
        "note_en": "Do NOT ride. Low oil pressure seizes the engine within minutes. Stop and check oil level.",
        "note_hi": "Mat chalao. Oil pressure kam hone se engine minute mein seize ho jata hai. Ruk ke oil dekho.",
        "risk": "Engine seizure — ₹15,000-60,000 rebuild if ridden.",
    },
    {
        "key": "high_temp", "icon": "🌡️", "name_en": "High temperature / coolant", "name_hi": "Engine garam / coolant",
        "color": "red", "severity": "red", "can_ride": False, "recommended_within": "STOP and cool",
        "note_en": "Do NOT ride. Engine overheating. Stop, let it cool 20 min, check coolant. Riding warps the head.",
        "note_hi": "Mat chalao. Engine over-heat ho raha. Ruk ke 20 min thanda hone do, coolant check karo.",
        "risk": "Head warp / gasket blow — ₹4,000-25,000.",
    },
    {
        "key": "battery", "icon": "🔋", "name_en": "Battery / charging", "name_hi": "Battery / charging",
        "color": "amber", "severity": "amber", "can_ride": True, "recommended_within": "within 1-2 days",
        "note_en": "Charging system warning. Likely regulator/rectifier or worn battery. May not restart once off.",
        "note_hi": "Charging warning. Regulator/rectifier ya purani battery. Band karne ke baad start na ho — risk hai.",
        "risk": "Stranding if it stops charging; possible regulator/rectifier failure.",
    },
    {
        "key": "abs", "icon": "🛑", "name_en": "ABS warning", "name_hi": "ABS warning",
        "color": "amber", "severity": "amber", "can_ride": True, "recommended_within": "within a few days",
        "note_en": "ABS disabled — normal brakes still work but no anti-lock. Ride gently, avoid hard braking.",
        "note_hi": "ABS off hai — normal brake chalega par anti-lock nahi. Dhire chalao, zor se brake mat lagao.",
        "risk": "No anti-lock in panic braking; wheel-lock skid risk on loose surfaces.",
    },
    {
        "key": "side_stand", "icon": "🦵", "name_en": "Side-stand down", "name_hi": "Side-stand neeche",
        "color": "amber", "severity": "amber", "can_ride": False, "recommended_within": "lift stand before riding",
        "note_en": "Side-stand is down. BS-VI bikes cut the engine — lift the stand fully before riding off.",
        "note_hi": "Side-stand neeche hai. BS-VI bike band ho jati — chalane se pehle stand poora upar karo.",
        "risk": "Engine cuts under load if ridden with stand down; crash risk in a turn.",
    },
    {
        "key": "high_beam", "icon": "🔆", "name_en": "High beam ON", "name_hi": "High beam ON",
        "color": "green", "severity": "green", "can_ride": True, "recommended_within": "informational only",
        "note_en": "High beam is on. No fault — dip it for oncoming traffic.",
        "note_hi": "High beam on hai. Koi fault nahi — saamne traffic ho to low kar do.",
        "risk": "None — courtesy reminder.",
    },
    {
        "key": "turn_signal", "icon": "➡️", "name_en": "Turn signal", "name_hi": "Indicator",
        "color": "green", "severity": "green", "can_ride": True, "recommended_within": "informational only",
        "note_en": "Indicator is blinking. No fault. Fast blink can mean a fused bulb.",
        "note_hi": "Indicator blink kar raha. Koi fault nahi. Tez blink ho to ek bulb fuse ho sakta.",
        "risk": "None; fast blink hints a blown bulb.",
    },
    {
        "key": "ev_soc", "icon": "🔌", "name_en": "EV battery low (SoC)", "name_hi": "EV battery low (SoC)",
        "color": "amber", "severity": "amber", "can_ride": True, "recommended_within": "charge soon",
        "note_en": "EV state-of-charge low. Plan a charge — speed may be limited in low-power mode.",
        "note_hi": "EV charge kam hai. Charge ka plan karo — low-power mode mein speed kam ho sakti.",
        "risk": "Stranding; deep-discharge harms the pack over time.",
    },
    {
        "key": "ev_fault", "icon": "⚡", "name_en": "EV system fault", "name_hi": "EV system fault",
        "color": "red", "severity": "red", "can_ride": False, "recommended_within": "STOP — service",
        "note_en": "Do NOT ride. High-voltage battery/motor fault. HV systems are dangerous — service centre only.",
        "note_hi": "Mat chalao. High-voltage battery/motor fault. HV system khatarnak — sirf service centre.",
        "risk": "HV fault — fire/shock risk; never DIY a high-voltage pack.",
    },
    {
        "key": "service_due", "icon": "🔧", "name_en": "Service due", "name_hi": "Service due",
        "color": "amber", "severity": "amber", "can_ride": True, "recommended_within": "book service soon",
        "note_en": "Scheduled-service reminder. Not a fault — book your next service.",
        "note_hi": "Service ka reminder hai. Fault nahi — agli service book kar lo.",
        "risk": "Deferred maintenance only; no immediate danger.",
    },
]

# Systems whose telltale must force can_ride:false regardless (red-line).
_RED_LINE_LIGHT_KEYS = {"low_oil", "high_temp", "ev_fault"}


# ── 2. Sound Doctor — sound → ranked candidate causes ─────────────────
# pct values per sound sum to ~100. diy_tier ∈ green/amber/orange/red.
SOUND_CATALOGUE: list[dict] = [
    {
        "key": "chain_rattle", "name_en": "Chain rattle", "name_hi": "Chain ki khhat-khhat",
        "when": "Worse on bumps / acceleration, from the rear",
        "candidates": [
            {"cause": "Loose or dry chain — needs lube + tension", "pct": 60, "diy_tier": "green", "cost_band": "₹0-200"},
            {"cause": "Worn chain & sprocket set (replace)", "pct": 30, "diy_tier": "orange", "cost_band": "₹1,200-4,000"},
            {"cause": "Loose rear sprocket bolts", "pct": 10, "diy_tier": "amber", "cost_band": "₹100-400"},
        ],
        "confidence": "medium",
        "safety_note_en": "A snapped chain can lock the rear wheel — get tension checked before a long ride.",
        "safety_note_hi": "Chain toot gayi to rear wheel lock ho sakta — lambe ride se pehle tension check karwao.",
    },
    {
        "key": "bearing_whine", "name_en": "Bearing whine", "name_hi": "Bearing ki seeti",
        "when": "Constant hum that rises with speed, not engine rpm",
        "candidates": [
            {"cause": "Worn wheel bearing", "pct": 55, "diy_tier": "orange", "cost_band": "₹400-1,500"},
            {"cause": "Worn swingarm / steering bearing", "pct": 30, "diy_tier": "red", "cost_band": "₹800-3,000"},
            {"cause": "Dry/failing gearbox bearing", "pct": 15, "diy_tier": "red", "cost_band": "₹2,000-12,000"},
        ],
        "confidence": "medium",
        "safety_note_en": "A failing wheel bearing can seize the wheel. Possible safety item — inspect soon.",
        "safety_note_hi": "Bearing fail ho to wheel jam ho sakta. Safety ka maamla — jaldi check karwao.",
    },
    {
        "key": "brake_squeal", "name_en": "Brake squeal", "name_hi": "Brake ki cheekh",
        "when": "Only when braking",
        "candidates": [
            {"cause": "Glazed / worn brake pads", "pct": 50, "diy_tier": "amber", "cost_band": "₹250-900"},
            {"cause": "Dust/glaze on disc (clean)", "pct": 30, "diy_tier": "green", "cost_band": "₹0-150"},
            {"cause": "Warped disc / caliper issue", "pct": 20, "diy_tier": "red", "cost_band": "₹800-3,500"},
        ],
        "confidence": "medium",
        "safety_note_en": "Brakes are a safety red-line. If braking feels weak, do NOT ride — get it checked first.",
        "safety_note_hi": "Brake safety ka red-line hai. Brake kamzor lage to mat chalao — pehle check karwao.",
    },
    {
        "key": "tappet_tick", "name_en": "Tappet / valve tick", "name_hi": "Tappet ki tik-tik",
        "when": "Light ticking from the head, steady with rpm",
        "candidates": [
            {"cause": "Valve clearance out of spec (adjust)", "pct": 65, "diy_tier": "orange", "cost_band": "₹300-900"},
            {"cause": "Low / dirty engine oil", "pct": 20, "diy_tier": "green", "cost_band": "₹350-800"},
            {"cause": "Worn cam / rocker (rebuild)", "pct": 15, "diy_tier": "red", "cost_band": "₹3,000-12,000"},
        ],
        "confidence": "medium",
        "safety_note_en": "Not an immediate safety risk, but ignoring valve noise wears the head over time.",
        "safety_note_hi": "Turant khatra nahi, par valve noise ignore karne se head ghista hai.",
    },
    {
        "key": "engine_knock", "name_en": "Engine knock / pinking", "name_hi": "Engine ki khat-khat (knock)",
        "when": "Heavy metallic knock under load / acceleration",
        "candidates": [
            {"cause": "Bad fuel / wrong octane / carbon", "pct": 45, "diy_tier": "amber", "cost_band": "₹100-800"},
            {"cause": "Worn big-end / piston (bottom-end)", "pct": 35, "diy_tier": "red", "cost_band": "₹4,000-25,000"},
            {"cause": "Over-advanced timing / lean mix", "pct": 20, "diy_tier": "orange", "cost_band": "₹300-2,500"},
        ],
        "confidence": "medium",
        "safety_note_en": "Persistent heavy knock can destroy the engine. Ride gently to a mechanic, do not rev hard.",
        "safety_note_hi": "Lagataar bhaari knock engine kharab kar sakta. Dhire mechanic tak jao, zor se mat ghumao.",
    },
    {
        "key": "belt_cvt", "name_en": "Belt / CVT noise (scooter)", "name_hi": "Belt / CVT ki awaaz (scooter)",
        "when": "Whine / rattle from the left CVT case on a scooter",
        "candidates": [
            {"cause": "Worn drive belt", "pct": 50, "diy_tier": "orange", "cost_band": "₹600-1,800"},
            {"cause": "Worn rollers / variator", "pct": 30, "diy_tier": "orange", "cost_band": "₹400-1,500"},
            {"cause": "Worn clutch / bell bearing", "pct": 20, "diy_tier": "red", "cost_band": "₹800-3,000"},
        ],
        "confidence": "medium",
        "safety_note_en": "A snapped CVT belt leaves you stranded but is not a crash risk. Replace on interval.",
        "safety_note_hi": "Belt toot jaye to gaadi ruk jati par crash ka risk nahi. Interval pe badlo.",
    },
    {
        "key": "exhaust_blow", "name_en": "Exhaust blow / popping", "name_hi": "Silencer ki phut-phut",
        "when": "Puffing / popping from the exhaust, louder than normal",
        "candidates": [
            {"cause": "Leaking exhaust gasket / joint", "pct": 55, "diy_tier": "amber", "cost_band": "₹150-700"},
            {"cause": "Rich/lean mixture (afterfire)", "pct": 30, "diy_tier": "orange", "cost_band": "₹300-2,500"},
            {"cause": "Cracked / rusted exhaust pipe", "pct": 15, "diy_tier": "orange", "cost_band": "₹800-4,000"},
        ],
        "confidence": "low",
        "safety_note_en": "Exhaust leaks can blow hot gas onto your leg/luggage — inspect before long rides.",
        "safety_note_hi": "Exhaust leak se garam gas leg/luggage pe aa sakti — lambe ride se pehle dekho.",
    },
    {
        "key": "fork_knock", "name_en": "Suspension / fork knock", "name_hi": "Suspension / fork ki thak-thak",
        "when": "Clunk over bumps from front fork or rear shock",
        "candidates": [
            {"cause": "Worn fork seals / low fork oil", "pct": 45, "diy_tier": "orange", "cost_band": "₹500-2,000"},
            {"cause": "Loose steering head / triple clamp", "pct": 30, "diy_tier": "red", "cost_band": "₹300-1,500"},
            {"cause": "Worn rear shock / linkage", "pct": 25, "diy_tier": "red", "cost_band": "₹800-4,000"},
        ],
        "confidence": "medium",
        "safety_note_en": "Front fork / steering is a safety red-line. If handling feels loose, do NOT ride — inspect first.",
        "safety_note_hi": "Front fork / steering safety red-line hai. Handling dheela lage to mat chalao — pehle dekho.",
    },
]


# ── 3. Used-Vehicle Inspector — ~100-point checklist ──────────────────
# Each point: id, q_en, q_hi, weight (1-3), critical (genuine safety/title).
# critical:true => a "fail" forces verdict avoid (or caution) + named.
def _pt(pid: str, q_en: str, q_hi: str, weight: int = 1, critical: bool = False) -> dict:
    return {"id": pid, "q_en": q_en, "q_hi": q_hi, "weight": weight, "critical": critical}


INSPECT_CHECKLIST: list[dict] = [
    {"name": "Engine / Start", "points": [
        _pt("eng_cold_start", "Starts on first crank when cold?", "Thandi mein pehli baar mein start hoti?", 3),
        _pt("eng_idle", "Idles smoothly without stalling?", "Idle smooth, band nahi hoti?", 2),
        _pt("eng_smoke", "No blue/white smoke from exhaust?", "Exhaust se neela/safed dhuan nahi?", 3),
        _pt("eng_oil_leak", "No oil leaks around engine?", "Engine ke aas-paas oil leak nahi?", 2),
        _pt("eng_noise", "No knocking / tapping noise?", "Knock / tap awaaz nahi?", 3),
        _pt("eng_throttle", "Revs cleanly, no flat spots?", "Throttle clean ghumti, flat-spot nahi?", 2),
        _pt("eng_oil_level", "Oil level + colour look healthy?", "Oil level aur colour theek?", 1),
        _pt("eng_coolant", "Coolant level OK, no overheating?", "Coolant level theek, over-heat nahi?", 2),
        _pt("eng_warning", "No dashboard warning lights stuck on?", "Koi dashboard warning light stuck nahi?", 2),
        _pt("eng_emission", "No strong fuel smell / black soot?", "Tej petrol smell / kaala soot nahi?", 1),
        _pt("eng_filter", "Air filter clean, not clogged?", "Air filter saaf, choked nahi?", 1),
        _pt("eng_hot_start", "Restarts easily after warming up?", "Garam hone ke baad bhi start ho jati?", 2),
        _pt("eng_kill", "Kill switch + ignition key smooth?", "Kill switch + ignition key smooth?", 1),
    ]},
    {"name": "Transmission / Clutch / Chain", "points": [
        _pt("trn_clutch", "Clutch engages smoothly, no slip?", "Clutch smooth lagti, slip nahi?", 3),
        _pt("trn_gears", "All gears shift cleanly up & down?", "Saare gear clean shift hote?", 3),
        _pt("trn_neutral", "Finds neutral easily?", "Neutral aasani se milta?", 1),
        _pt("trn_chain_wear", "Chain not over-stretched / rusted?", "Chain zyada stretch / rust nahi?", 2),
        _pt("trn_sprocket", "Sprocket teeth not hooked/worn?", "Sprocket ke daant ghise/hook nahi?", 2),
        _pt("trn_cvt", "(Scooter) CVT smooth, no jerks?", "(Scooter) CVT smooth, jhatka nahi?", 2),
        _pt("trn_gearbox_noise", "No whine / grind from gearbox?", "Gearbox se whine / grind nahi?", 2),
        _pt("trn_clutch_play", "Clutch lever free-play correct?", "Clutch lever ka play sahi?", 1),
        _pt("trn_chain_slack", "Chain slack within spec, not loose?", "Chain slack spec mein, dheeli nahi?", 1),
        _pt("trn_oil_leak", "No gearbox / final-drive oil leak?", "Gearbox / final-drive oil leak nahi?", 1),
    ]},
    {"name": "Electrical / Battery / Lights", "points": [
        _pt("ele_battery", "Battery healthy, cranks strong?", "Battery healthy, strong crank?", 2),
        _pt("ele_headlight", "Headlight high + low beam work?", "Headlight high + low dono chalti?", 1),
        _pt("ele_indicators", "All 4 indicators blink correctly?", "Chaaron indicator sahi blink?", 1),
        _pt("ele_brake_light", "Brake light works (front + rear lever)?", "Brake light chalti (dono lever)?", 2),
        _pt("ele_horn", "Horn loud and clear?", "Horn loud aur clear?", 1),
        _pt("ele_speedo", "Speedo / odo / fuel gauge work?", "Speedo / odo / fuel gauge chalte?", 1),
        _pt("ele_starter", "Self-start motor works?", "Self-start motor chalta?", 1),
        _pt("ele_charging", "Charging keeps battery topped?", "Charging battery top rakhti?", 2),
        _pt("ele_wiring", "No melted / taped wiring hacks?", "Koi melted / tape-wala wiring jugaad nahi?", 2),
        _pt("ele_switches", "All handlebar switches work?", "Handle ke saare switch chalte?", 1),
        _pt("ele_tail", "Tail light + number-plate light work?", "Tail light + plate light chalti?", 1),
        _pt("ele_fuse", "Fuse box intact, no jumper hacks?", "Fuse box theek, jumper jugaad nahi?", 1),
    ]},
    {"name": "Brakes", "points": [
        _pt("brk_front_feel", "Front brake firm, good bite?", "Front brake firm, achhi bite?", 3, critical=True),
        _pt("brk_rear_feel", "Rear brake firm, no sponginess?", "Rear brake firm, spongy nahi?", 3, critical=True),
        _pt("brk_pads", "Brake pads have life left?", "Brake pad mein life bachi?", 2, critical=True),
        _pt("brk_disc", "Disc not scored / warped?", "Disc scratched / warp nahi?", 2, critical=True),
        _pt("brk_fluid", "Brake fluid level + colour OK?", "Brake fluid level + colour theek?", 1),
        _pt("brk_abs", "(If ABS) no ABS fault light?", "(ABS ho to) ABS fault light nahi?", 1),
        _pt("brk_lever", "Lever doesn't pull to the bar?", "Lever bar tak nahi dabta?", 2, critical=True),
        _pt("brk_lines", "No leaks at brake lines/hose?", "Brake line/hose pe leak nahi?", 2, critical=True),
    ]},
    {"name": "Tyres / Wheels", "points": [
        _pt("tyr_front_tread", "Front tyre tread above limit?", "Front tyre tread limit se upar?", 3, critical=True),
        _pt("tyr_rear_tread", "Rear tyre tread above limit?", "Rear tyre tread limit se upar?", 3, critical=True),
        _pt("tyr_cracks", "No cracks / bulges on sidewall?", "Sidewall pe crack / bulge nahi?", 2, critical=True),
        _pt("tyr_age", "Tyres not older than ~5 years?", "Tyre ~5 saal se purane nahi?", 1),
        _pt("whl_true", "Wheels run true, no wobble?", "Wheel seedha ghumta, wobble nahi?", 2, critical=True),
        _pt("whl_spokes", "Spokes / alloy not cracked/bent?", "Spoke / alloy crack/tedha nahi?", 2, critical=True),
        _pt("whl_bearing", "Wheel bearings tight, no play?", "Wheel bearing tight, play nahi?", 2),
        _pt("tyr_pressure", "Tyres hold pressure (no slow leak)?", "Tyre pressure rukti (slow leak nahi)?", 1),
    ]},
    {"name": "Suspension / Fork", "points": [
        _pt("sus_fork_seal", "Fork seals not leaking oil?", "Fork seal se oil leak nahi?", 2, critical=True),
        _pt("sus_fork_smooth", "Fork compresses smoothly?", "Fork smooth dabti?", 2),
        _pt("sus_rear_shock", "Rear shock not blown / bouncy?", "Rear shock blown / bouncy nahi?", 2),
        _pt("sus_steering", "Steering head not loose/notchy?", "Steering head dheela/notchy nahi?", 3, critical=True),
        _pt("sus_alignment", "Front/rear wheels aligned?", "Aage-peeche wheel align?", 2, critical=True),
        _pt("sus_linkage", "Suspension linkage not worn?", "Suspension linkage ghisa nahi?", 1),
        _pt("sus_swingarm", "Swingarm bushes tight, no play?", "Swingarm bush tight, play nahi?", 1),
    ]},
    {"name": "Frame / Body / Rust", "points": [
        _pt("frm_straight", "Frame straight, no bend/crash repair?", "Frame seedha, bend/crash repair nahi?", 3, critical=True),
        _pt("frm_weld", "No suspicious re-welds on frame?", "Frame pe shaqi re-weld nahi?", 3, critical=True),
        _pt("frm_rust", "No heavy structural rust?", "Bhaari structural rust nahi?", 2),
        _pt("frm_panels", "Body panels aligned, gaps even?", "Body panel align, gap even?", 1),
        _pt("frm_paint", "Paint consistent (no hidden respray)?", "Paint consistent (chhupa respray nahi)?", 1),
        _pt("frm_crash", "No crash marks under fairing?", "Fairing ke neeche crash mark nahi?", 2),
        _pt("frm_seat_lock", "Seat lock + storage work?", "Seat lock + storage chalte?", 1),
        _pt("frm_stand", "Side + centre stand spring OK?", "Side + centre stand spring theek?", 1),
        _pt("frm_handlebar", "Handlebar straight, not bent?", "Handlebar seedha, tedha nahi?", 2, critical=True),
        _pt("frm_footpeg", "Footpegs / levers not bent?", "Footpeg / lever tedhe nahi?", 1),
    ]},
    {"name": "Documents", "points": [
        _pt("doc_rc", "RC original + matches chassis/engine no.?", "RC original + chassis/engine no. match?", 3, critical=True),
        _pt("doc_chassis", "Chassis number readable, not tampered?", "Chassis number readable, tampered nahi?", 3, critical=True),
        _pt("doc_insurance", "Valid insurance present?", "Valid insurance hai?", 2),
        _pt("doc_puc", "Valid PUC certificate?", "Valid PUC certificate?", 1),
        _pt("doc_noc", "Loan NOC / hypothecation cleared?", "Loan NOC / hypothecation cleared?", 3, critical=True),
        _pt("doc_owners", "Number of previous owners acceptable?", "Pichle owners ki ginti theek?", 1),
        _pt("doc_challan", "No pending challans / e-challan?", "Koi pending challan nahi?", 2),
        _pt("doc_blacklist", "Not stolen / not blacklisted (VAHAN)?", "Stolen / blacklist nahi (VAHAN)?", 3, critical=True),
        _pt("doc_state", "Inter-state transfer feasible (if needed)?", "Inter-state transfer ho payega (zarurat ho to)?", 1),
        _pt("doc_keys", "Both keys / spare key available?", "Dono chaabi / spare key hai?", 1),
    ]},
    {"name": "Service history", "points": [
        _pt("svc_book", "Service book / records available?", "Service book / records hai?", 2),
        _pt("svc_regular", "Serviced regularly on schedule?", "Schedule pe regular service hui?", 2),
        _pt("svc_recent", "Recent service within interval?", "Haal mein service interval ke andar?", 1),
        _pt("svc_authorised", "Mostly authorised service centre?", "Zyada-tar authorised service centre?", 1),
        _pt("svc_odo_genuine", "Odometer reading looks genuine?", "Odometer reading genuine lagti?", 3, critical=True),
        _pt("svc_consumables", "Consumables (oil/plug/filter) recent?", "Oil/plug/filter haal mein badle?", 1),
        _pt("svc_accident", "No major accident / claim history?", "Bada accident / claim history nahi?", 2, critical=True),
        _pt("svc_warranty", "Any transferable warranty / AMC left?", "Koi transferable warranty / AMC bachi?", 1),
    ]},
    {"name": "Test-ride", "points": [
        _pt("ride_pull", "Pulls strongly through all gears?", "Saare gear mein strong pull?", 2),
        _pt("ride_straight", "Tracks straight hands-light?", "Haath halka karke seedha chalti?", 3, critical=True),
        _pt("ride_vibration", "No excessive vibration at speed?", "Speed pe zyada vibration nahi?", 1),
        _pt("ride_brake_test", "Stops straight under hard braking?", "Zor se brake pe seedha rukti?", 3, critical=True),
        _pt("ride_clunk", "No clunks from drivetrain?", "Drivetrain se clunk nahi?", 2),
        _pt("ride_heat", "Doesn't overheat on the ride?", "Ride pe over-heat nahi hoti?", 2),
        _pt("ride_starts_hot", "Restarts easily when hot?", "Garam hone par bhi start ho jati?", 1),
        _pt("ride_speedo_track", "Speed/odo track correctly on ride?", "Ride pe speed/odo sahi chalte?", 1),
        _pt("ride_handling", "Handles confidently in turns?", "Turn mein confident handle karti?", 2, critical=True),
        _pt("ride_noises", "No new rattles/squeaks under load?", "Load pe naya rattle/squeak nahi?", 1),
    ]},
]


def total_inspect_points() -> int:
    return sum(len(c["points"]) for c in INSPECT_CHECKLIST)


# ── 4. OBD2 snapshot — live-param thresholds ──────────────────────────
# Used by routes/doctor.py to flag live params vs red-lines.
OBD_THRESHOLDS = {
    "volts_low": 11.8,      # below → charging issue (amber)
    "volts_high": 15.2,     # above → over-charge / regulator fault (amber)
    "rpm_high_idle": 2000,  # if reported as idle and above → high-idle flag
    "coolant_overheat": 110,  # °C above → overheat (RED, can_ride False)
    "coolant_warm": 100,    # °C above → running hot (amber)
}
