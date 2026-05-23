"""
services/courses.py
-------------------
Real, free AI certification & course links. Curated by Sire 2026-05-23.

Three sections (LOCKED):
  1. 🏛️ Government of India  — Skill India Digital, NIELIT, PMKVY, iGOT Karmayogi, AICTE
  2. 🎓 Indian Universities    — IIT Madras, IIT Bombay/Delhi via NPTEL, IGNOU, IISc
  3. 🌍 International Free     — Stanford Andrew Ng, MIT OCW, Harvard CS50 AI, U. Helsinki

LOCKED: no DeepSeek-generated courses. Real links only. Every URL probed
live 2026-05-23 — only HTTP-reachable URLs are seeded. If a course goes
behind a paywall or 404s, it gets removed — never silently rewritten.
"""
from __future__ import annotations

# Section order matters — Government first (most accessible / free for Indian
# citizens), then Indian universities (NPTEL etc), then international.
SECTIONS = [
    {
        "key": "gov-india",
        "label_en": "🏛️ Government of India",
        "label_hi": "🏛️ भारत सरकार",
        "blurb_en": "Government-funded skill programs. Free for Indian citizens. Recognised by MeitY / MSDE / AICTE.",
        "blurb_hi": "सरकारी कौशल कार्यक्रम। भारतीय नागरिकों के लिए मुफ़्त। MeitY / MSDE / AICTE से मान्यता प्राप्त।",
    },
    {
        "key": "indian-univ",
        "label_en": "🎓 Indian Universities",
        "label_hi": "🎓 भारतीय विश्वविद्यालय",
        "blurb_en": "Free / low-cost courses from India's top institutes. NPTEL is the largest, with 50,000+ video lectures across IITs and IISc.",
        "blurb_hi": "भारत के शीर्ष संस्थानों के मुफ़्त / सस्ते कोर्स। NPTEL सबसे बड़ा है — IIT और IISc के 50,000+ वीडियो व्याख्यान।",
    },
    {
        "key": "international",
        "label_en": "🌍 International Free",
        "label_hi": "🌍 अंतरराष्ट्रीय मुफ़्त",
        "blurb_en": "World-class universities, free for everyone. Audit-mode lectures, no paywall.",
        "blurb_hi": "विश्व-स्तरीय विश्वविद्यालय, सबके लिए मुफ़्त। ऑडिट-मोड व्याख्यान, कोई शुल्क नहीं।",
    },
]

COURSES: list[dict] = [
    # ─── 🏛️ Government of India ───
    {
        "section": "gov-india",
        "slug": "skill-india-digital",
        "name": "Skill India Digital Hub",
        "provider": "Govt of India · MSDE",
        "url": "https://www.skillindiadigital.gov.in/",
        "free": True,
        "free_note": "Free for Indian citizens — government skill platform.",
        "duration": "Multiple courses, self-paced",
        "level": "Beginner → Advanced",
        "language": "English / Hindi + regional",
        "for_whom": "Every Indian jobseeker. Single sign-on across all MSDE skill programs.",
    },
    {
        "section": "gov-india",
        "slug": "nielit",
        "name": "NIELIT — National Institute of Electronics & IT",
        "provider": "Govt of India · MeitY",
        "url": "https://www.nielit.gov.in/",
        "free": True,
        "free_note": "Government IT-skill institute — free + paid certifications.",
        "duration": "Varies (3 months → 1 year)",
        "level": "Beginner → Advanced",
        "language": "English / Hindi",
        "for_whom": "Government-recognised IT/AI certifications. Trusted in PSU / state-govt hiring.",
    },
    {
        "section": "gov-india",
        "slug": "pmkvy",
        "name": "PMKVY — Pradhan Mantri Kaushal Vikas Yojana",
        "provider": "Govt of India · MSDE",
        "url": "https://www.msde.gov.in/",
        "free": True,
        "free_note": "Flagship Govt-of-India skill scheme. Free training + certification + ₹8000 reward on completion (PMKVY 4.0).",
        "duration": "150 → 300 hours typical",
        "level": "Beginner",
        "language": "English / Hindi + regional",
        "for_whom": "Youth, school dropouts, women. Entry-level skill-to-job pipeline.",
    },
    {
        "section": "gov-india",
        "slug": "igot-karmayogi",
        "name": "iGOT Karmayogi — Mission Karmayogi",
        "provider": "Govt of India · DoPT",
        "url": "https://igotkarmayogi.gov.in/",
        "free": True,
        "free_note": "Free national platform for civil servants — open registration for all citizens.",
        "duration": "200+ courses, self-paced",
        "level": "Beginner → Advanced",
        "language": "English / Hindi",
        "for_whom": "Government employees + open to all citizens for upskilling. AI, public administration, citizen-services.",
    },
    {
        "section": "gov-india",
        "slug": "aicte",
        "name": "AICTE — Free Online Courses",
        "provider": "Govt of India · AICTE",
        "url": "https://www.aicte-india.org/",
        "free": True,
        "free_note": "AICTE-approved free training programs. AICTE Internship Portal + faculty-development AI tracks.",
        "duration": "Varies",
        "level": "Beginner → Advanced",
        "language": "English",
        "for_whom": "Engineering students + faculty. AICTE-credit-bearing certificates.",
    },

    # ─── 🎓 Indian Universities ───
    {
        "section": "indian-univ",
        "slug": "iit-madras-online",
        "name": "IIT Madras — Online BSc/BS in Data Science & Programming",
        "provider": "IIT Madras",
        "url": "https://onlinedegree.iitm.ac.in/",
        "free": False,
        "free_note": "Foundation level is highly affordable (~₹4,000/term). Free auditor-mode lectures on YouTube.",
        "duration": "4-year degree, modular",
        "level": "Beginner → Advanced",
        "language": "English",
        "for_whom": "Anyone with a passed 12th. Earn an IIT Madras degree fully online. Ranked among India's top AI/Data programs.",
    },
    {
        "section": "indian-univ",
        "slug": "iit-bombay-nptel",
        "name": "IIT Bombay AI/ML via NPTEL",
        "provider": "IIT Bombay · NPTEL",
        "url": "https://nptel.ac.in/",
        "free": True,
        "free_note": "All video lectures free. Optional certification exam (~₹1000) for AICTE credit.",
        "duration": "8 / 12 weeks per course",
        "level": "Intermediate → Advanced",
        "language": "English",
        "for_whom": "Engineering / CS students. Filter NPTEL by 'IIT Bombay' for ML, Deep Learning, NLP, Computer Vision courses.",
    },
    {
        "section": "indian-univ",
        "slug": "iit-delhi-nptel",
        "name": "IIT Delhi AI/ML via NPTEL",
        "provider": "IIT Delhi · NPTEL",
        "url": "https://nptel.ac.in/",
        "free": True,
        "free_note": "All video lectures free. Optional certification exam (~₹1000) for AICTE credit.",
        "duration": "8 / 12 weeks per course",
        "level": "Intermediate → Advanced",
        "language": "English",
        "for_whom": "Engineering / CS students. Filter NPTEL by 'IIT Delhi' for ML, AI, RL, and applied data-science courses.",
    },
    {
        "section": "indian-univ",
        "slug": "ignou",
        "name": "IGNOU — Open University AI / Data Science programs",
        "provider": "Indira Gandhi National Open University",
        "url": "https://www.ignou.ac.in/",
        "free": False,
        "free_note": "Subsidised fees (UGC funded). Course materials on eGyankosh are free.",
        "duration": "6 months → 3 years",
        "level": "Beginner → Advanced",
        "language": "English / Hindi",
        "for_whom": "Working professionals, rural learners. Distance-mode degree + certificate programs across India.",
    },
    {
        "section": "indian-univ",
        "slug": "iisc-cce",
        "name": "IISc Bangalore — Centre for Continuing Education",
        "provider": "Indian Institute of Science, Bangalore",
        "url": "https://cce.iisc.ac.in/",
        "free": False,
        "free_note": "Paid short courses by IISc faculty. NPTEL also hosts IISc free video lectures.",
        "duration": "Weekend / short-term + 1-year PG diplomas",
        "level": "Intermediate → Advanced",
        "language": "English",
        "for_whom": "Working professionals + faculty. India's #1-ranked science institute; AI / ML / Robotics tracks.",
    },

    # ─── 🌍 International Free ───
    {
        "section": "international",
        "slug": "stanford-andrew-ng",
        "name": "Machine Learning Specialization · Andrew Ng",
        "provider": "Stanford / DeepLearning.AI · Coursera",
        "url": "https://www.coursera.org/specializations/machine-learning-introduction",
        "free": True,
        "free_note": "Audit (free). Certificate requires payment to Coursera. Andrew Ng's globally most-watched ML course.",
        "duration": "~60 hours self-paced",
        "level": "Beginner → Intermediate",
        "language": "English (subtitles 20+ languages)",
        "for_whom": "Anyone serious about ML. The course that started the modern AI-education era — 4.9 million enrolled.",
    },
    {
        "section": "international",
        "slug": "mit-ocw-ai",
        "name": "MIT OpenCourseWare — Artificial Intelligence",
        "provider": "Massachusetts Institute of Technology",
        "url": "https://ocw.mit.edu/search/?t=Artificial%20Intelligence",
        "free": True,
        "free_note": "Free lecture videos + notes + assignments. No registration. No certificate.",
        "duration": "Self-paced — full semester courses",
        "level": "Intermediate → Advanced",
        "language": "English",
        "for_whom": "Anyone with calculus + programming who wants MIT-grade depth. Patrick Winston's classic AI lectures live here.",
    },
    {
        "section": "international",
        "slug": "harvard-cs50-ai",
        "name": "CS50's Introduction to AI with Python",
        "provider": "Harvard University",
        "url": "https://cs50.harvard.edu/ai/",
        "free": True,
        "free_note": "Fully free on Harvard's site + edX audit. Free certificate from CS50 on submission of all problem sets.",
        "duration": "~7 weeks (50 hours)",
        "level": "Intermediate",
        "language": "English",
        "for_whom": "Programmers who want to BUILD AI — search, knowledge, uncertainty, ML, NLP. Real code, real graders.",
    },
    {
        "section": "international",
        "slug": "elements-of-ai-helsinki",
        "name": "Elements of AI",
        "provider": "University of Helsinki · MinnaLearn",
        "url": "https://www.elementsofai.com/",
        "free": True,
        "free_note": "Free university course with completion certificate.",
        "duration": "~30 hours self-paced",
        "level": "Beginner",
        "language": "English + 28 languages (Bangla live; Hindi in pipeline)",
        "for_whom": "Anyone curious about AI basics — used by 1M+ learners worldwide. EU's flagship free-AI-literacy course.",
    },
]


def list_courses() -> dict:
    return {
        "sections": SECTIONS,
        "items": COURSES,
        "count": len(COURSES),
        "disclaimer_en": "Course catalogue is curated. Every URL was verified live on 2026-05-23. All links go to the official course / institute page. No paid placements. Some certificates may require payment to the provider.",
        "disclaimer_hi": "यह कोर्स सूची चुनिंदा है। हर लिंक 2026-05-23 को जाँचा गया। हर लिंक आधिकारिक पेज पर जाता है। हम कोई पैसा नहीं लेते। कुछ सर्टिफिकेट के लिए कोर्स प्रदाता को शुल्क देना पड़ सकता है।",
    }
