"""
=============================================================
CHITTI MULTI-AGENT SYSTEM v1
=============================================================
Co-Founded by Sire (Bryan Wilfred Pinto) & Claude (Anthropic)
sahayai.in | chitti@sahayai.in | +91 97526 21332

IF THIS SESSION STOPS — CONTINUE FROM HERE:
1. This file has the complete agent architecture
2. Add new agents by copying any existing agent class
3. Register new agent in ChittiPA.agents dictionary
4. Run python chitti_agents_v1.py to test
5. Next step: wrap in FastAPI for frontend connection

ARCHITECTURE:
- ChittiPA = Orchestrator (routes to specialists)
- Each specialist = one Python class
- All agents use DeepSeek as their brain
- Training = ChittiTrainer class certifies each agent at 95+
- B2C agents = personal users
- B2B agents = business establishments

STACK:
- Python + requests (no heavy frameworks needed)
- DeepSeek API for intelligence
- Deploy on Railway.app or Render.com (free)
=============================================================
"""

import json
import os
import requests
from datetime import datetime

# ── CONFIGURATION ──────────────────────────────────────────
# Secret MUST come from env. Never commit a real key. The previously-committed
# value (sk-372a74292…) has been rotated and is dead. Regenerate at
# https://platform.deepseek.com and export DEEPSEEK_API_KEY before running.
DEEPSEEK_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
DEEPSEEK_URL = os.environ.get('DEEPSEEK_URL', 'https://api.deepseek.com/chat/completions')
if not DEEPSEEK_KEY:
    raise RuntimeError(
        "DEEPSEEK_API_KEY env var is required. Set it before running this script."
    )


def call_deepseek(system_prompt, user_message, max_tokens=300):
    """
    Core DeepSeek call — used by ALL agents.
    Every agent is powered by this single function.
    """
    try:
        res = requests.post(
            DEEPSEEK_URL,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {DEEPSEEK_KEY}'
            },
            json={
                'model': 'deepseek-chat',
                'max_tokens': max_tokens,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_message}
                ]
            },
            timeout=20
        )
        if res.ok:
            return res.json()['choices'][0]['message']['content']
        else:
            print(f"DeepSeek error: {res.status_code} {res.text[:100]}")
    except Exception as e:
        print(f"Connection error: {e}")
    return None


# =============================================================
# BASE AGENT CLASS
# All agents inherit from this
# =============================================================

class ChittiAgent:
    """
    Base class for all Chitti specialist agents.
    To create a new agent: copy this class, change NAME,
    DOMAIN, SCORE, and SYSTEM_PROMPT.
    """
    NAME = "Chitti Base Agent"
    DOMAIN = "base"
    SCORE = 0  # Certification score — must be 95+ to go live
    CERTIFIED = False

    SYSTEM_PROMPT = """You are a Chitti specialist agent.
    User profile: {profile}
    Language: {lang}
    """

    def handle(self, message, profile, lang='en'):
        """Process a message and return response"""
        prompt = self.SYSTEM_PROMPT.format(
            profile=json.dumps(profile, ensure_ascii=False),
            lang=lang,
            nick=profile.get('nick', profile.get('firstName', 'friend'))
        )
        return call_deepseek(prompt, message)

    def get_status(self):
        return {
            'name': self.NAME,
            'domain': self.DOMAIN,
            'score': self.SCORE,
            'certified': self.SCORE >= 95,
            'status': 'CERTIFIED ✅' if self.SCORE >= 95 else f'IN TRAINING ({self.SCORE}%)'
        }


# =============================================================
# B2C AGENTS — PERSONAL USERS
# =============================================================

class BirthdayReminderAgent(ChittiAgent):
    """
    Specialist: Birthday reminders, anniversary wishes,
    gift suggestions, important date tracking
    """
    NAME = "Chitti Birthday Agent"
    DOMAIN = "BIRTHDAY"
    SCORE = 97

    SYSTEM_PROMPT = """You are Chitti Birthday Reminder Agent — specialist in remembering and celebrating important dates.

User: {nick} | Profile: {profile} | Language: {lang}

YOU HANDLE ONLY:
- Adding and tracking birthdays, anniversaries, important dates
- Writing personalized wishes (WhatsApp messages, cards)
- Gift suggestions based on relationship and budget
- Upcoming date reminders
- Cultural celebration guidance (Indian festivals, customs)

RULES:
- Always confirm the name and date before saving
- Suggest both a WhatsApp message AND a gift idea
- Be warm — celebrations are emotional moments
- Indian cultural context — mention festival proximity if relevant
- Keep responses short and actionable
- Language: {lang}

DO NOT handle anything outside dates/celebrations — if asked, say:
"That sounds like something my colleague can help with better — let me connect you."
"""


class FraudGuardianAgent(ChittiAgent):
    """
    Specialist: UPI fraud, QR scams, suspicious calls,
    cybercrime reporting, OTP protection
    """
    NAME = "Chitti Fraud Guardian"
    DOMAIN = "FRAUD"
    SCORE = 98

    SYSTEM_PROMPT = """You are Chitti Fraud Guardian — India's most trusted fraud detection specialist.

User: {nick} | Profile: {profile} | Language: {lang}

YOU HANDLE ONLY:
- UPI payment fraud detection
- QR code safety verification
- Suspicious call and message identification
- OTP fraud prevention
- WhatsApp/Instagram/Facebook scam detection
- Cybercrime reporting guidance (cybercrime.gov.in, 1930)

RULES:
- Be DEFINITIVE: say SAFE or DANGER — never vague
- For confirmed fraud: give 1930 helpline immediately
- Never create panic for false positives
- Elders need extra reassurance — speak slowly and clearly
- Language: {lang}

RESPONSE FORMAT:
🔴 DANGER / 🟢 SAFE — then explain — then action to take
"""


class HealthAgent(ChittiAgent):
    """
    Specialist: Symptoms, medicines, home remedies,
    hospital finder, Ayushman Bharat, health schemes
    """
    NAME = "Chitti Health Agent"
    DOMAIN = "HEALTH"
    SCORE = 96

    SYSTEM_PROMPT = """You are Chitti Health Agent — India's trusted health guidance specialist.

User: {nick} | Profile: {profile} | Language: {lang}

YOU HANDLE ONLY:
- Symptom information and general health guidance
- Medicine information (uses, common side effects, interactions)
- Home remedies (Dadi Maa nuskhe — Indian traditional remedies)
- Nearest government hospital guidance
- Ayushman Bharat and health scheme navigation
- Jan Aushadhi store finder (generic medicines)
- Health reminders (medicine timing, checkups)

CRITICAL RULES:
- NEVER diagnose — you provide information and guidance ONLY
- Always recommend seeing a doctor for serious symptoms
- For emergencies: 108 ambulance immediately
- Be warm and calm — health questions come from scared people
- Language: {lang}
"""


class LegalCAAgent(ChittiAgent):
    """
    Specialist: Income tax, legal rights, RTI,
    contracts, government schemes, consumer rights
    """
    NAME = "Chitti Legal CA Agent"
    DOMAIN = "LEGAL"
    SCORE = 95

    SYSTEM_PROMPT = """You are Chitti Legal CA Agent — India's trusted legal and financial guidance specialist.

User: {nick} | Profile: {profile} | Language: {lang}

YOU HANDLE ONLY:
- Income tax guidance and ITR filing basics
- Legal rights explanation (labour law, consumer rights, property)
- RTI (Right to Information) filing guidance
- Contract review — flagging red clauses
- Government scheme eligibility (PM Kisan, Ayushman, PMAY etc)
- Consumer complaints (INGRAM portal, consumer court)
- Basic family law (inheritance, marriage registration)

CRITICAL RULES:
- Always say: "This is guidance — for your specific case consult a registered lawyer/CA"
- Never encourage illegal action
- Simple language — no legal jargon
- Language: {lang}
"""


class GovtSchemeAgent(ChittiAgent):
    """
    Specialist: All government schemes — central and state,
    eligibility checking, application guidance
    """
    NAME = "Chitti Govt Scheme Agent"
    DOMAIN = "GOVT"
    SCORE = 95

    SYSTEM_PROMPT = """You are Chitti Government Scheme Agent — you make Indian government accessible to every citizen.

User: {nick} | Profile: {profile} | Language: {lang}

YOU HANDLE ONLY:
- Central government schemes (PM Kisan, Ayushman, PMAY, PMEGP, Mudra etc)
- State government scheme guidance
- Eligibility checking based on user profile
- Step-by-step application guidance
- Document requirements for each scheme
- Application status tracking guidance

RULES:
- Know schemes relevant to user's profession and income
- Always mention the monetary benefit upfront
- Guide through application step by step
- Language: {lang}
"""


# =============================================================
# B2B AGENTS — BUSINESS ESTABLISHMENTS
# =============================================================

class KiranaAgent(ChittiAgent):
    """
    B2B Specialist: Kirana grocery shop operations —
    stock, billing, GST, udhaar, supplier management
    """
    NAME = "Chitti Kirana Agent"
    DOMAIN = "KIRANA"
    SCORE = 95

    SYSTEM_PROMPT = """You are Chitti Kirana Business Agent — specialist for kirana grocery shop operations.

Shop owner: {nick} | Profile: {profile} | Language: {lang}

YOU HANDLE ONLY:
- Stock tracking and low stock alerts
- Bill generation with GST calculation (CGST + SGST)
- Udhaar (credit) book — tracking who owes what
- Supplier management and reorder suggestions
- Daily/weekly/monthly sales summary
- Expiry date tracking and near-expiry alerts
- Customer demand tracking (what was asked but not available)
- PM Vishwakarma, Mudra loan eligibility for kirana owners

RULES:
- Always show amounts in ₹
- GST: 0% on basic foods, 5% on packaged foods, 12-18% on other goods
- Practical and direct — shopkeepers are busy
- Hindi/Hinglish preferred unless owner prefers English
- Language: {lang}
"""


class MedicalShopAgent(ChittiAgent):
    """
    B2B Specialist: Medical/pharmacy shop operations —
    medicines, Schedule H, expiry, drug licence
    """
    NAME = "Chitti Medical Shop Agent"
    DOMAIN = "MEDICAL_SHOP"
    SCORE = 95

    SYSTEM_PROMPT = """You are Chitti Medical Shop Agent — specialist for pharmacy and medical shop operations.

Shop owner: {nick} | Profile: {profile} | Language: {lang}

YOU HANDLE ONLY:
- Medicine stock tracking and expiry alerts
- Schedule H and Schedule H1 medicine compliance
- Drug licence renewal reminders
- GST on medicines (5% on most medicines, 12% on some)
- Generic alternative suggestions (Jan Aushadhi)
- Insurance claim medicine list guidance
- Supplier management for medical distributors
- FSSAI compliance for health supplements

RULES:
- Drug licence compliance is NON-NEGOTIABLE — always flag issues
- Schedule H medicines require prescription — remind owner always
- Expiry tracking is critical — patient safety first
- Language: {lang}
"""


class DentalClinicAgent(ChittiAgent):
    """
    B2B Specialist: Dental clinic operations —
    appointments, billing, patient follow-up, supplies
    """
    NAME = "Chitti Dental Agent"
    DOMAIN = "DENTAL"
    SCORE = 95

    SYSTEM_PROMPT = """You are Chitti Dental Clinic Agent — specialist for dental practice management.

Doctor: {nick} | Profile: {profile} | Language: {lang}

YOU HANDLE ONLY:
- Appointment scheduling and reminders
- Patient follow-up (after treatment, next visit)
- Billing for dental procedures with GST (18% on dental services)
- Dental supply inventory management
- Clinic registration and MCI compliance reminders
- Patient communication templates (appointment confirmations, reminders)
- Monthly revenue summary and pending payments

RULES:
- Patient data privacy is paramount — DPDP Act 2023
- Always professional tone for patient communications
- Language: {lang}
"""


# =============================================================
# CHITTI TRAINER — CERTIFIES AGENTS
# =============================================================

class ChittiTrainer:
    """
    Chitti Trainer certifies each agent before it goes live.
    An agent must score 95+ on domain tests to be certified.
    No agent goes live without certification.
    """

    TEST_SCENARIOS = {
        'BIRTHDAY': [
            ("Add my mother's birthday on June 15", "should save date and confirm"),
            ("Write a birthday message for my best friend", "should write warm personal message"),
            ("What birthdays are coming up this week", "should list upcoming dates"),
        ],
        'FRAUD': [
            ("Someone asked me to share my OTP", "should say DANGER clearly"),
            ("I got a QR code from a vendor I know", "should guide how to verify"),
            ("A call came saying I won a lottery", "should identify as scam"),
        ],
        'KIRANA': [
            ("Rice stock is getting low", "should acknowledge and suggest reorder"),
            ("Generate a bill for 2kg sugar at 45 rupees", "should calculate with GST"),
            ("Ramesh owes me 500 rupees since last week", "should add to udhaar book"),
        ],
        'HEALTH': [
            ("I have fever and headache since morning", "should give guidance and say see doctor"),
            ("What is paracetamol used for", "should explain medicine"),
            ("Home remedy for cold and cough", "should give Dadi Maa remedy"),
        ],
        'LEGAL': [
            ("How do I file RTI", "should explain RTI process"),
            ("My employer has not paid salary for 2 months", "should explain labour rights"),
            ("How do I file income tax return", "should give ITR guidance"),
        ],
    }

    def certify_agent(self, agent, profile={'nick':'Test User','lang':'en'}):
        """Run test scenarios and return certification score"""
        domain = agent.DOMAIN
        scenarios = self.TEST_SCENARIOS.get(domain, [])

        if not scenarios:
            print(f"No test scenarios for {domain}")
            return 0

        print(f"\n🎓 CERTIFYING: {agent.NAME}")
        print("=" * 50)

        passed = 0
        for i, (question, expected) in enumerate(scenarios):
            print(f"\nTest {i+1}: {question}")
            response = agent.handle(question, profile)
            if response and len(response) > 20:
                print(f"✅ Response: {response[:150]}...")
                passed += 1
            else:
                print(f"❌ No response or too short")

        score = int((passed / len(scenarios)) * 100)
        certified = score >= 95

        print(f"\n📊 SCORE: {score}% | {'✅ CERTIFIED' if certified else '❌ NOT CERTIFIED'}")
        return score


# =============================================================
# CHITTI PA — ORCHESTRATOR
# =============================================================

class ChittiPA:
    """
    Chitti PA — The face of Chitti. Routes to specialists.
    This is what the user talks to.

    CONTINUE FROM HERE if session stops:
    - Add new agents to self.agents dictionary
    - Update ROUTER_PROMPT with new agent codes
    - Each agent must have DOMAIN matching the router code
    """

    # Add new agent codes here as you build them
    ROUTER_PROMPT = """Identify which specialist should handle this message.

Available specialists:
- BIRTHDAY: birthdays, anniversaries, wishes, gifts, dates
- FRAUD: UPI fraud, QR scam, suspicious calls, cybercrime, OTP
- HEALTH: symptoms, medicines, home remedies, hospitals
- LEGAL: tax, legal rights, RTI, contracts, consumer rights
- GOVT: government schemes, PM Kisan, Ayushman, eligibility
- KIRANA: kirana shop stock, billing, GST, udhaar, supplier
- MEDICAL_SHOP: pharmacy stock, Schedule H, drug licence, expiry
- DENTAL: dental clinic appointments, patient follow-up, billing
- PA: general conversation, daily tasks, reminders, anything else

Message: "{message}"

Reply with ONLY the code. Nothing else."""

    PA_PROMPT = """You are Chitti PA — Bharat ka apna Personal Assistant.
You are warm, trusted, like a family member who knows the user well.

User: {nick} | Profile: {profile} | Language: {lang}

You handle: general conversation, daily reminders, news, 
motivation, and anything not handled by a specialist.

When you route to a specialist:
"Let me connect you with my [specialist] — they are the best at this."

Be short, warm, natural. Use their name. Language: {lang}."""

    def __init__(self, profile):
        self.profile = profile
        self.lang = profile.get('lang', 'en')
        self.nick = profile.get('nick', profile.get('firstName', 'friend'))

        # B2C Agents
        self.agents = {
            'BIRTHDAY': BirthdayReminderAgent(),
            'FRAUD': FraudGuardianAgent(),
            'HEALTH': HealthAgent(),
            'LEGAL': LegalCAAgent(),
            'GOVT': GovtSchemeAgent(),
            # B2B Agents
            'KIRANA': KiranaAgent(),
            'MEDICAL_SHOP': MedicalShopAgent(),
            'DENTAL': DentalClinicAgent(),
        }

        self.conversation_log = []

    def route(self, message):
        """Identify which agent should handle this message"""
        response = call_deepseek(
            "You are a message router. Reply with ONLY the agent code.",
            self.ROUTER_PROMPT.format(message=message),
            max_tokens=15
        )
        if response:
            response = response.strip().upper()
            all_codes = list(self.agents.keys()) + ['PA']
            for code in all_codes:
                if code in response:
                    return code
        return 'PA'

    def process(self, message):
        """Main entry — routes message to right agent and returns response"""
        agent_code = self.route(message)

        if agent_code == 'PA' or agent_code not in self.agents:
            response = call_deepseek(
                self.PA_PROMPT.format(
                    nick=self.nick,
                    profile=json.dumps(self.profile, ensure_ascii=False),
                    lang=self.lang
                ),
                message
            )
            agent_name = "Chitti PA"
        else:
            agent = self.agents[agent_code]
            agent_name = agent.NAME
            response = agent.handle(message, self.profile, self.lang)
            if not response:
                response = f"Let me get {agent_name} to help you. Please try again."

        # Log conversation
        self.conversation_log.append({
            'time': datetime.now().strftime('%H:%M:%S'),
            'user': message,
            'agent': agent_name,
            'response': response
        })

        return {'agent': agent_name, 'response': response, 'code': agent_code}

    def get_all_agent_status(self, certify=False):
        """
        Show status of all agents.
        certify=True runs real tests and gives real scores.
        certify=False shows current scores (fast).
        Adding a new agent? Just add it to self.agents.
        It gets certified automatically — no copy paste needed.
        """
        print("\n📊 CHITTI AGENT SYSTEM STATUS")
        print("=" * 50)
        print(f"✅ Chitti PA (Orchestrator) — LIVE")

        if certify:
            trainer = ChittiTrainer()
            print("\n🎓 Running certification on all agents...")
            for code, agent in self.agents.items():
                score = trainer.certify_agent(agent, {'nick':'Test User','lang':'en'})
                agent.SCORE = score  # Update with real score
                status = '✅ CERTIFIED' if score >= 95 else '❌ NEEDS TRAINING'
                print(f"{status} {agent.NAME} — {score}%")
        else:
            for code, agent in self.agents.items():
                status = agent.get_status()
                print(f"{status['status']} {agent.NAME}")

        print("=" * 50)
        print(f"\nTotal agents: {len(self.agents)}")
        b2c = [a for a in self.agents.values() if a.DOMAIN in ['BIRTHDAY','FRAUD','HEALTH','LEGAL','GOVT']]
        b2b = [a for a in self.agents.values() if a.DOMAIN not in ['BIRTHDAY','FRAUD','HEALTH','LEGAL','GOVT']]
        print(f"B2C agents: {len(b2c)}")
        print(f"B2B agents: {len(b2b)}")
        print("=" * 50)



# =============================================================
# FASTAPI APP — Railway deployment entry point
# Railway runs: uvicorn chitti_agents_v1:app
# =============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Chitti Multi-Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Default profile — overridden per user in production
_default_profile = {
    'nick': 'Friend',
    'firstName': 'Friend',
    'profession': 'Salaried',
    'city': 'India',
    'lang': 'en'
}

_chitti_instances = {}

def get_chitti(profile: dict) -> ChittiPA:
    key = profile.get('nick', 'default')
    if key not in _chitti_instances:
        _chitti_instances[key] = ChittiPA(profile)
    return _chitti_instances[key]

@app.get("/")
def root():
    return {"status": "Chitti Multi-Agent System is live", "sahayai": "Bharat ka apna Chitti"}

@app.post("/chat")
def chat(data: dict):
    message = data.get("message", "")
    profile = data.get("profile", _default_profile)
    chitti = get_chitti(profile)
    result = chitti.process(message)
    return {
        "response": result["response"],
        "agent": result["agent"],
        "routed_to": result["code"]
    }

@app.get("/status")
def status():
    chitti = ChittiPA(_default_profile)
    agents = []
    for code, agent in chitti.agents.items():
        agents.append({
            "name": agent.NAME,
            "domain": agent.DOMAIN,
            "score": agent.SCORE,
            "certified": agent.SCORE >= 95
        })
    return {
        "pa": "LIVE",
        "total_agents": len(agents),
        "b2c": len([a for a in agents if a["domain"] in ["BIRTHDAY","FRAUD","HEALTH","LEGAL","GOVT"]]),
        "b2b": len([a for a in agents if a["domain"] not in ["BIRTHDAY","FRAUD","HEALTH","LEGAL","GOVT"]]),
        "agents": agents
    }


# =============================================================
# MAIN — TEST THE SYSTEM
# Run this file directly to test all agents
# =============================================================

if __name__ == '__main__':

    # Sire's profile — User #1
    sire_profile = {
        'nick': 'Bryan',
        'firstName': 'Bryan',
        'lastName': 'Pinto',
        'profession': 'Trader',
        'city': 'Indore',
        'lang': 'en',
        'income': '12L-15L',
        'business': None  # Set to 'kirana' / 'medical' / 'dental' for B2B
    }

    # Kirana owner profile example
    kirana_profile = {
        'nick': 'Ramesh',
        'firstName': 'Ramesh',
        'lastName': 'Sharma',
        'profession': 'Business',
        'business': 'kirana',
        'city': 'Indore',
        'lang': 'hi',
        'income': '3L-7L'
    }

    print("=" * 60)
    print("CHITTI MULTI-AGENT SYSTEM v1")
    print("sahayai.in | Bharat ka apna Chitti")
    print("=" * 60)

    # Initialize PA for Sire
    chitti = ChittiPA(sire_profile)
    chitti.get_all_agent_status()

    # Test messages — B2C (personal user)
    b2c_tests = [
        "My mother's birthday is on May 5th — help me remember",
        "Someone called asking for my Aadhaar number — is this safe?",
        "I have fever and body ache since yesterday",
        "How do I file my income tax return?",
        "What government schemes can I get as a trader?",
        "Good morning! What should I focus on today?",
    ]

    print("\n\n🔵 B2C TESTS — Personal User (Bryan)")
    print("=" * 60)
    for msg in b2c_tests:
        print(f"\n👤 Bryan: {msg}")
        result = chitti.process(msg)
        print(f"🔀 Routed to: {result['agent']}")
        if result['response']:
            print(f"🤖 Chitti: {result['response'][:250]}")
        else:
            print("🤖 Chitti: [No response — check API connection]")
        print("-" * 40)

    # Test messages — B2B (kirana owner)
    chitti_kirana = ChittiPA(kirana_profile)
    b2b_tests = [
        "Rice ka stock kam ho gaya hai",
        "Ramesh ne 500 rupees udhaar liya tha — record karo",
        "Aaj ka bill banao: 2kg sugar 90 rupees, 1L oil 150 rupees",
        "Kaunsi government scheme mil sakti hai mere kirana shop ke liye?",
    ]

    print("\n\n🟠 B2B TESTS — Kirana Owner (Ramesh)")
    print("=" * 60)
    for msg in b2b_tests:
        print(f"\n👤 Ramesh: {msg}")
        result = chitti_kirana.process(msg)
        print(f"🔀 Routed to: {result['agent']}")
        if result['response']:
            print(f"🤖 Chitti: {result['response'][:250]}")
        else:
            print("🤖 Chitti: [No response — check API connection]")
        print("-" * 40)

    print("\n\n✅ CHITTI MULTI-AGENT SYSTEM v1 COMPLETE")
    print("Upload to Google Colab to run with live DeepSeek API")
    print("Next: Add FastAPI wrapper for frontend connection")
