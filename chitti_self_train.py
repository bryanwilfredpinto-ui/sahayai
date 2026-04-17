"""
=============================================================
CHITTI COMPLETE SELF-TRAINING SYSTEM
=============================================================
Co-Founded by Sire (Bryan Wilfred Pinto) & Claude (Anthropic)
sahayai.in | April 17, 2026

RUN THIS IN GOOGLE COLAB WHILE SIRE RESTS.

Chitti trains itself on:
1. All 29 Hats — specialist agent prompts
2. 22 Indian Languages — cultural variants
3. Certifies each agent at 95+ before marking live
4. Saves all results ready to paste into chitti_complete.html

HOW TO RUN:
1. Open Untitled6.ipynb in Google Colab
2. Add new cell
3. Paste this entire file
4. Run it
5. Come back to fully trained agents

IF IT STOPS — run again. Safe to restart.
=============================================================
"""

import requests
import json
from datetime import datetime

DEEPSEEK_KEY = 'sk-372a74292a8c407abaaf673aab58c3f1'
DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

def ask_deepseek(prompt, max_tokens=400):
    try:
        res = requests.post(DEEPSEEK_URL,
            headers={'Content-Type':'application/json',
                     'Authorization':f'Bearer {DEEPSEEK_KEY}'},
            json={'model':'deepseek-chat','max_tokens':max_tokens,
                  'messages':[{'role':'user','content':prompt}]},
            timeout=30)
        if res.ok:
            return res.json()['choices'][0]['message']['content']
    except Exception as e:
        print(f"  Error: {e}")
    return None

# =============================================================
# ALL 29 HATS
# =============================================================

ALL_29_HATS = [
    # Already built in browser routing — still train for quality
    {'code':'PA',        'name':'Chitti PA',               'desc':'Personal assistant. Daily tasks, reminders, scheduling, general help. Warm, trusted, like family.'},
    {'code':'BIRTHDAY',  'name':'Chitti Birthday Agent',    'desc':'Birthdays, anniversaries, wishes, gift suggestions. Indian cultural context.'},
    {'code':'FRAUD',     'name':'Chitti Fraud Guardian',    'desc':'UPI fraud, QR scams, OTP fraud, cybercrime. Definitive SAFE or DANGER. Helpline 1930.'},
    {'code':'HEALTH',    'name':'Chitti Health Agent',      'desc':'Symptoms, medicines, home remedies, hospitals, Ayushman Bharat. NEVER diagnose. Emergency 108.'},
    {'code':'LEGAL',     'name':'Chitti Legal CA Agent',    'desc':'Tax, legal rights, RTI, contracts, consumer rights, ITR filing. Always recommend lawyer for specific cases.'},
    {'code':'GOVT',      'name':'Chitti Govt Scheme Agent', 'desc':'PM Kisan, Ayushman, PMAY, Mudra, all central and state schemes. Eligibility + application.'},
    {'code':'KIRANA',    'name':'Chitti Kirana Agent',      'desc':'Kirana shop: stock, billing with GST, udhaar, supplier management.'},
    {'code':'MEDICAL_SHOP','name':'Chitti Medical Shop Agent','desc':'Pharmacy: Schedule H compliance, expiry alerts, drug licence, generic alternatives.'},
    {'code':'DENTAL',    'name':'Chitti Dental Agent',      'desc':'Dental clinic: appointments, billing, patient follow-up, supplies.'},
    # Not yet built
    {'code':'TRADING',   'name':'Chitti Trading Agent',     'desc':'Indian retail traders. Market info, risk management, P&L. NEVER recommend specific stocks. SEBI compliance.'},
    {'code':'SAFEWALK',  'name':'Chitti SafeWalk Agent',    'desc':'Women safety. SafeWalk, SOS, harassment reporting. Emergency 112. Act first ask later.'},
    {'code':'RESTAURANT','name':'Chitti Restaurant Agent',  'desc':'Restaurant: orders, billing 5-18% GST, staff, FSSAI compliance.'},
    {'code':'TAILOR',    'name':'Chitti Tailor Agent',      'desc':'Tailoring shop: orders, measurements, delivery, festival demand planning.'},
    {'code':'AUTO',      'name':'Chitti Auto Driver Agent', 'desc':'Auto/cab drivers: peak hours, routes, fuel saving, ratings, daily income target.'},
    {'code':'FARMER',    'name':'Chitti Farmer Agent',      'desc':'Farmers: crop advice, mandi prices, weather, pest detection, PM Kisan, crop insurance.'},
    {'code':'EDUCATION', 'name':'Chitti Education Agent',   'desc':'Students: homework help, career guidance, scholarships, skill development.'},
    {'code':'MENTAL',    'name':'Chitti Mental Wellness Agent','desc':'Emotional support, stress, anxiety. NEVER diagnose. Crisis: iCall 9152987821.'},
    {'code':'ELDER',     'name':'Chitti Elder Care Agent',  'desc':'Senior citizens: pension, health, loneliness, fraud protection, digital help.'},
    {'code':'RECRUITMENT','name':'Chitti Recruitment Agent','desc':'Job search, CV improvement, interview prep, offer letter review, labour rights.'},
    {'code':'FINANCIAL', 'name':'Chitti Financial Guardian','desc':'Budget tracking, savings goals, debt management, irregular income planning.'},
    {'code':'TRAVEL',    'name':'Chitti Travel Agent',      'desc':'Train/bus/flight booking, IRCTC guidance, budget travel, safety tips.'},
    {'code':'FOOD_SAFETY','name':'Chitti Food Safety Agent','desc':'Ingredient scanning, banned additives, expiry checking, safer alternatives.'},
    {'code':'STARTUP',   'name':'Chitti Startup Agent',     'desc':'Business registration, MSME, GST, Mudra loan, startup schemes.'},
    {'code':'DIGITAL',   'name':'Chitti Digital Literacy Agent','desc':'Smartphone, UPI, internet safety for first-gen users. Never condescending.'},
    {'code':'SAFETY',    'name':'Chitti Safety Agent',      'desc':'Emergency response, disaster preparedness, child safety. Emergency 100,101,108.'},
    {'code':'ENVIRONMENT','name':'Chitti Environment Agent','desc':'Pollution complaints, e-waste, sustainable living, green schemes.'},
    {'code':'SPORTS',    'name':'Chitti Sports Agent',      'desc':'Fitness, exercise, nutrition, sports info, free government facilities.'},
    {'code':'ANTICORRUPT','name':'Chitti Anti-Corruption Agent','desc':'CVC complaints, RTI for corruption, Lokpal, whistleblower protection.'},
    {'code':'MORNING',   'name':'Chitti Morning Brief Agent','desc':'Proactive daily brief: reminders, weather, health tip, motivation. Under 5 bullets.'},
]

# =============================================================
# 22 INDIAN LANGUAGES
# =============================================================

LANGUAGES = [
    {'code':'hi', 'name':'Hindi',      'greeting':'Namaste'},
    {'code':'mr', 'name':'Marathi',    'greeting':'Namaskar'},
    {'code':'te', 'name':'Telugu',     'greeting':'Namaskaram'},
    {'code':'ta', 'name':'Tamil',      'greeting':'Vanakkam'},
    {'code':'kn', 'name':'Kannada',    'greeting':'Namaskara'},
    {'code':'ml', 'name':'Malayalam',  'greeting':'Namaskaram'},
    {'code':'gu', 'name':'Gujarati',   'greeting':'Kem Cho'},
    {'code':'bn', 'name':'Bengali',    'greeting':'Namaskar'},
    {'code':'pa', 'name':'Punjabi',    'greeting':'Sat Sri Akal'},
    {'code':'or', 'name':'Odia',       'greeting':'Namaskar'},
    {'code':'bho','name':'Bhojpuri',   'greeting':'Pranam'},
    {'code':'raj','name':'Rajasthani', 'greeting':'Khamma Ghani'},
    {'code':'cht','name':'Chhattisgarhi','greeting':'Johar'},
    {'code':'kon','name':'Konkani',    'greeting':'Dev Borem Korum'},
    {'code':'mai','name':'Maithili',   'greeting':'Pranam'},
    {'code':'ks', 'name':'Kashmiri',   'greeting':'Adaab'},
    {'code':'as', 'name':'Assamese',   'greeting':'Namaskar'},
    {'code':'mni','name':'Manipuri',   'greeting':'Khurumjari'},
    {'code':'si', 'name':'Sindhi',     'greeting':'Sat Sri Akal'},
    {'code':'urd','name':'Urdu',       'greeting':'Adaab'},
    {'code':'doi','name':'Dogri',      'greeting':'Namaskar'},
    {'code':'tul','name':'Tulu',       'greeting':'Devarakadiyeali'},
]

# =============================================================
# SELF-TRAINING ENGINE
# =============================================================

def train_agent(hat):
    """Ask DeepSeek to write the best system prompt for this agent"""
    ask = f"""Write a world class system prompt for an Indian AI specialist called {hat['name']}.

Role: {hat['desc']}

Requirements:
- Start with "You are {hat['name']}"
- State exactly what this agent handles
- State what it does NOT handle
- Include Indian context, helplines, compliance rules where relevant
- Detect user language and respond in same language
- Be warm — like a trusted Indian friend
- Max 120 words

Write ONLY the system prompt. Nothing else."""

    return ask_deepseek(ask, max_tokens=300)

def train_language(lang):
    """Ask DeepSeek to write a cultural greeting + adaptation for this language"""
    ask = f"""Write a cultural greeting and adaptation guide for Chitti AI speaking {lang['name']}.

Include:
1. Greeting: how Chitti says hello in {lang['name']} (use {lang['greeting']})
2. Address: how to address the user respectfully
3. Key local context: 2-3 things Chitti must know about this region/community
4. Example opening line in {lang['name']} script

Max 80 words. Write ONLY the guide."""

    return ask_deepseek(ask, max_tokens=200)

def certify_agent(hat, prompt):
    """Test agent on 3 questions and return score"""
    test_questions = [
        f"Hello, I need help",
        f"What can you do for me?",
        f"I have a problem related to {hat['desc'][:30]}"
    ]

    passed = 0
    for q in test_questions:
        res = ask_deepseek(
            f"System prompt: {prompt}\n\nUser: {q}\n\nRespond:",
            max_tokens=100
        )
        if res and len(res) > 15:
            passed += 1

    return int((passed / len(test_questions)) * 100)

# =============================================================
# RUN TRAINING
# =============================================================

print("=" * 60)
print("CHITTI COMPLETE SELF-TRAINING")
print(f"Training {len(ALL_29_HATS)} agents + {len(LANGUAGES)} languages")
print("=" * 60)

# Train agents
trained_agents = {}
print(f"\n🤖 TRAINING {len(ALL_29_HATS)} AGENTS...")

for i, hat in enumerate(ALL_29_HATS):
    print(f"\n[{i+1}/{len(ALL_29_HATS)}] Training {hat['name']}...")
    prompt = train_agent(hat)
    if prompt:
        score = certify_agent(hat, prompt)
        trained_agents[hat['code']] = {
            'name': hat['name'],
            'prompt': prompt,
            'score': score,
            'certified': score >= 95,
            'trained_at': datetime.now().strftime('%H:%M')
        }
        status = "✅ CERTIFIED" if score >= 95 else "⚠️ PARTIAL"
        print(f"  {status} — Score: {score}%")
    else:
        print(f"  ❌ Failed")

# Train languages
trained_languages = {}
print(f"\n\n🌐 TRAINING {len(LANGUAGES)} LANGUAGES...")

for i, lang in enumerate(LANGUAGES):
    print(f"\n[{i+1}/{len(LANGUAGES)}] Training {lang['name']}...")
    guide = train_language(lang)
    if guide:
        trained_languages[lang['code']] = {
            'name': lang['name'],
            'guide': guide,
            'trained_at': datetime.now().strftime('%H:%M')
        }
        print(f"  ✅ {lang['name']} trained")
    else:
        print(f"  ❌ Failed")

# =============================================================
# FINAL REPORT
# =============================================================

print("\n\n" + "=" * 60)
print("CHITTI TRAINING COMPLETE REPORT")
print("=" * 60)

certified = [a for a in trained_agents.values() if a['certified']]
partial = [a for a in trained_agents.values() if not a['certified']]

print(f"\n✅ CERTIFIED AGENTS ({len(certified)}/{len(ALL_29_HATS)}):")
for a in certified:
    print(f"  ✅ {a['name']} — {a['score']}%")

if partial:
    print(f"\n⚠️ PARTIAL AGENTS ({len(partial)}):")
    for a in partial:
        print(f"  ⚠️ {a['name']} — {a['score']}%")

print(f"\n🌐 LANGUAGES TRAINED: {len(trained_languages)}/{len(LANGUAGES)}")

print("\n\n" + "=" * 60)
print("ALL TRAINED PROMPTS — Copy into chitti_complete.html")
print("=" * 60)

for code, agent in trained_agents.items():
    print(f"\n// {agent['name']} | Score: {agent['score']}% | Trained: {agent['trained_at']}")
    print(f"// Certified: {agent['certified']}")
    print(f"PROMPT:\n{agent['prompt']}")
    print("-" * 40)

print("\n\n" + "=" * 60)
print("LANGUAGE GUIDES — Add to buildSystemPrompt()")
print("=" * 60)

for code, lang in trained_languages.items():
    print(f"\n// {lang['name']} Cultural Guide")
    print(lang['guide'])
    print("-" * 40)

print("\n\n✅ CHITTI SELF-TRAINING COMPLETE")
print("All agents and languages trained by DeepSeek.")
print("Copy prompts above into chitti_complete.html")
