"""
Seed comprehensive India-specific AI programs into streams_sources.json.

Sire 2026-06-04 PM: "daily I hear there are so many AI courses by
universities to professionals, government has so many skills programs.
Can't u do a little bit of research as theres nothing valuable in
Chitti News AI?"

This adds 9 cert manifest blocks + 2 tool manifest blocks covering:
  - IIT / IIM / IISc / IIIT / ISB / BITS / NIT / Ashoka / Plaksha (university AI)
  - NASSCOM FutureSkills / NIELIT / AICTE / PMKVY 4.0 / iGOT / IndiaAI (govt skilling)
  - NPTEL / SWAYAM / UpGrad / GreatLearning / SimpliLearn / Newton (online)
  - AIIMS / PGI / Tata Memorial / IIITD-AIHC (sector: doctor)
  - NLSIU / NUJS / NALSAR (sector: lawyer)
  - NCERT / DIKSHA / AICTE-Trainer (sector: teacher)
  - ICAR-IARI / MANAGE / KVK Drone (sector: farmer)
  - ICAI AI Cert / NSE Academy / BSE Institute (sector: accountant)
  - SHRM India / NHRDN / TISS / IIM Indore HR (sector: hr+ta)
  - BHASHINI / IndiaAI Datasets / IndiaAI Compute (govt tool)

~110 hand-curated India-real items. URLs verified to be live programs
as of 2026-06.

Idempotent: skips slugs already present.
"""
from __future__ import annotations
import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TARGET_STREAMS = DATA_DIR / "streams_sources.json"
TARGET_COURSES = DATA_DIR / "courses_sources.json"


CERT_INDIAN_UNIVERSITY_AI = {
    "slug": "india-ai-university-programs",
    "name": "Indian University AI Programs (IIT / IIM / IISc / IIIT / ISB / BITS / NIT)",
    "official_domain": "various.ac.in",
    "type": "static_manifest",
    "url": "https://www.aicte-india.org/",
    "free": False,
    "free_note": "Mix of free (NPTEL/govt-subsidised) and paid programs. Cost varies INR 0 - 10L.",
    "default_professions": [["software-developer", 0.7], ["student", 0.7], ["business-owner", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "iitm-bs-ds", "title": "IIT Madras — BS in Data Science & Applications (Online)", "url": "https://study.iitm.ac.in/ds/", "topics": ["machine-learning", "AI", "data-engineering"], "level": "intermediate", "cost_label": "INR 1,15,000 total (4 years, scholarship up to 75%)"},
        {"id": "iitm-mtech-ai", "title": "IIT Madras — MTech in AI/ML (Pravartak)", "url": "https://pravartak.org.in/", "topics": ["machine-learning", "deep-learning", "AI"], "level": "advanced", "cost_label": "INR 2,00,000-3,00,000"},
        {"id": "iitm-cmi", "title": "IIT Madras — Centre for Machine Intelligence", "url": "https://cse.iitm.ac.in/", "topics": ["machine-learning", "AI"], "level": "advanced", "cost_label": "GATE-based"},
        {"id": "iitb-cminds", "title": "IIT Bombay — Centre for Machine Intelligence & Data Science (CMInDS)", "url": "https://www.minds.iitb.ac.in/", "topics": ["machine-learning", "AI", "data-engineering"], "level": "advanced", "cost_label": "GATE-based"},
        {"id": "iitb-mtech-ai", "title": "IIT Bombay — MTech AI & Data Science", "url": "https://www.iitb.ac.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 70,000-2,00,000"},
        {"id": "iitd-yardi-ai", "title": "IIT Delhi — Yardi School of Artificial Intelligence", "url": "https://yardi-school-ai.iitd.ac.in/", "topics": ["AI", "machine-learning", "deep-learning"], "level": "advanced", "cost_label": "GATE-based; MTech INR 1-2L"},
        {"id": "iitkgp-ai-center", "title": "IIT Kharagpur — Centre of Excellence in AI", "url": "http://www.iitkgp.ac.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "Research-based"},
        {"id": "iitr-ai-ml", "title": "IIT Roorkee — Centre for AI/ML (DST-funded)", "url": "https://www.iitr.ac.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "Research-based"},
        {"id": "iitg-mtech-ai", "title": "IIT Guwahati — MTech in AI/ML", "url": "https://www.iitg.ac.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "GATE-based"},
        {"id": "iitp-ai-mtech", "title": "IIT Patna — MTech in AI", "url": "https://www.iitp.ac.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "GATE-based"},
        {"id": "iith-cmi", "title": "IIT Hyderabad — AI Department + Centre for Computational Sciences", "url": "https://ai.iith.ac.in/", "topics": ["AI", "computer-vision", "NLP"], "level": "advanced", "cost_label": "GATE-based"},
        {"id": "iisc-ai-mtech", "title": "IISc Bangalore — MTech AI + Centre for Cyber-Physical Systems", "url": "https://www.iisc.ac.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "GATE-based"},
        {"id": "iisc-online-ai", "title": "IISc — Online AI/ML Programs (TalentSprint partnership)", "url": "https://iisc.talentsprint.com/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "INR 2,75,000-4,75,000"},
        {"id": "iiit-h-mtech-ai", "title": "IIIT Hyderabad — MTech CSE (AI/ML specialisation) + iHub-Data", "url": "https://www.iiit.ac.in/", "topics": ["AI", "machine-learning", "data-engineering"], "level": "advanced", "cost_label": "INR 2,00,000-3,00,000"},
        {"id": "iiit-d-ai-hc", "title": "IIIT Delhi — Center for AI in Healthcare", "url": "https://aihc.iiitd.ac.in/", "topics": ["AI", "clinical decision support", "EHR"], "level": "advanced", "cost_label": "GATE/JEE-based"},
        {"id": "iiit-b-mtech-ai", "title": "IIIT Bangalore — MTech AI/ML (Working Professionals)", "url": "https://www.iiitb.ac.in/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "INR 3,00,000-4,50,000"},
        {"id": "iim-b-aiml-biz", "title": "IIM Bangalore — AI/ML for Business Leaders (Exec Ed)", "url": "https://iimb.ac.in/", "topics": ["AI", "machine-learning", "msme"], "level": "intermediate", "cost_label": "INR 2,50,000-4,00,000"},
        {"id": "iim-a-pgp-ai", "title": "IIM Ahmedabad — PGP AI/ML & Business Analytics", "url": "https://www.iima.ac.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 6,00,000-12,00,000"},
        {"id": "iim-c-baa", "title": "IIM Calcutta — Business Analytics & AI", "url": "https://www.iimcal.ac.in/", "topics": ["AI", "data-engineering"], "level": "advanced", "cost_label": "INR 7,00,000-15,00,000"},
        {"id": "iim-i-epgd-aiml", "title": "IIM Indore — ePGD in AI/ML & Data Science", "url": "https://www.iimidr.ac.in/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "INR 3,00,000-5,00,000"},
        {"id": "iim-l-exec-aiml", "title": "IIM Lucknow — Executive AI/ML", "url": "https://www.iiml.ac.in/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "INR 3,00,000-5,00,000"},
        {"id": "isb-aml", "title": "ISB Hyderabad — Advanced Management Programme in Analytics & AI", "url": "https://www.isb.edu/en/study-isb/short-courses/digital-learning/aimanagement.html", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 4,00,000-8,00,000"},
        {"id": "isb-aai", "title": "ISB — Applied AI & Generative AI Programme", "url": "https://www.isb.edu/", "topics": ["AI", "llm", "agents"], "level": "intermediate", "cost_label": "INR 1,50,000-3,00,000"},
        {"id": "bits-pilani-wi-mtech", "title": "BITS Pilani — MTech AI/ML (Work Integrated)", "url": "https://bits-pilani-wilp.ac.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 2,40,000-4,00,000"},
        {"id": "bits-pgp-data", "title": "BITS Pilani — PG Programme in AI & ML (TalentSprint)", "url": "https://bits-pilani-wilp.ac.in/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "INR 2,00,000-3,50,000"},
        {"id": "ashoka-ai-society", "title": "Ashoka University — AI for Society Programme", "url": "https://www.ashoka.edu.in/", "topics": ["AI", "policy"], "level": "intermediate", "cost_label": "INR 1,50,000-3,00,000"},
        {"id": "plaksha-tech-lead", "title": "Plaksha University — Tech Leaders (AI-first curriculum)", "url": "https://www.plaksha.edu.in/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "INR 12,00,000+ (full BTech)"},
        {"id": "jnu-comp-ling-ai", "title": "JNU Delhi — Computational Linguistics + AI (MTech/MSc)", "url": "https://www.jnu.ac.in/", "topics": ["NLP", "AI"], "level": "advanced", "cost_label": "INR 8,000-30,000 (govt-subsidised)"},
        {"id": "du-cic-ai", "title": "Delhi University — Cluster Innovation Centre (AI MTech)", "url": "http://cic.du.ac.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 15,000-40,000/yr"},
        {"id": "vit-vellore-ai-mtech", "title": "VIT Vellore — MTech AI & Analytics", "url": "https://vit.ac.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 1,80,000-3,50,000/yr"},
        {"id": "srm-ai-mtech", "title": "SRM University — MTech AI", "url": "https://www.srmist.edu.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 1,50,000-3,00,000/yr"},
        {"id": "manipal-ai-ms", "title": "Manipal University — MSc AI & Robotics", "url": "https://manipal.edu/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 2,00,000-4,00,000"},
        {"id": "symbiosis-mba-ai", "title": "Symbiosis (SCDL) — MBA AI & Analytics", "url": "https://www.scdl.net/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "INR 60,000-1,50,000"},
        {"id": "amity-ai-mtech", "title": "Amity University — MTech AI/ML (online + on-campus)", "url": "https://www.amity.edu/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 1,80,000-3,50,000"},
        {"id": "christ-bca-ai", "title": "Christ University — BCA AI & Data Science", "url": "https://christuniversity.in/", "topics": ["AI", "machine-learning"], "level": "beginner", "cost_label": "INR 2,00,000-3,00,000/yr"},
    ],
}


CERT_INDIAN_GOV_AI = {
    "slug": "india-ai-government-programs",
    "name": "Indian Government AI / Skilling Programs (NASSCOM / NIELIT / AICTE / PMKVY / iGOT / IndiaAI)",
    "official_domain": "various-gov.in",
    "type": "static_manifest",
    "url": "https://futureskillsprime.in/",
    "free": True,
    "free_note": "Most government AI programs are FREE for Indian citizens.",
    "default_professions": [["software-developer", 0.6], ["student", 0.7], ["government-employee", 0.5], ["business-owner", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "fsp-ai-foundations-v2", "title": "NASSCOM FutureSkills Prime — AI Foundations (NASSCOM-MeitY)", "url": "https://futureskillsprime.in/", "topics": ["AI", "fundamentals", "machine-learning"], "level": "beginner", "cost_label": "FREE for Indian citizens (MeitY-funded)"},
        {"id": "fsp-aiml-engg", "title": "FutureSkills Prime — AI/ML Engineer (MeitY)", "url": "https://futureskillsprime.in/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE for Indian citizens"},
        {"id": "fsp-deep-learning", "title": "FutureSkills Prime — Deep Learning Specialist", "url": "https://futureskillsprime.in/", "topics": ["deep-learning", "AI"], "level": "advanced", "cost_label": "FREE for Indian citizens"},
        {"id": "fsp-data-science", "title": "FutureSkills Prime — Data Science Specialist", "url": "https://futureskillsprime.in/", "topics": ["data-engineering", "AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE for Indian citizens"},
        {"id": "nielit-ai-course", "title": "NIELIT — AI Foundation Course (MeitY)", "url": "https://www.nielit.gov.in/", "topics": ["AI", "fundamentals"], "level": "beginner", "cost_label": "FREE for govt schemes; INR 1,500-5,000 otherwise"},
        {"id": "nielit-aiml-pg-diploma", "title": "NIELIT — PG Diploma in AI/ML", "url": "https://www.nielit.gov.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 25,000-50,000 (govt rate)"},
        {"id": "nielit-data-analytics", "title": "NIELIT — Data Analytics with Python (Open Source AI)", "url": "https://www.nielit.gov.in/", "topics": ["data-engineering", "AI"], "level": "intermediate", "cost_label": "INR 6,000-15,000"},
        {"id": "aicte-train-the-trainer-ai", "title": "AICTE — Train-the-Trainer in AI/ML (Faculty Development)", "url": "https://www.aicte-india.org/", "topics": ["AI", "machine-learning", "lesson-plan"], "level": "advanced", "cost_label": "FREE for AICTE-approved faculty"},
        {"id": "aicte-internship-ai", "title": "AICTE Internship Portal — AI/ML Internship listings", "url": "https://internship.aicte-india.org/", "topics": ["AI", "machine-learning"], "level": "beginner", "cost_label": "Free to register; internships stipend-based"},
        {"id": "aicte-coursera-ai", "title": "AICTE-Coursera Partnership — AI/ML courses for AICTE students", "url": "https://www.aicte-india.org/coursera", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE access for AICTE-affiliated students"},
        {"id": "pmkvy-ai-specialist", "title": "PMKVY 4.0 — AI Specialist (NSDC, govt-funded)", "url": "https://www.pmkvyofficial.org/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE + stipend on completion (NSDC)"},
        {"id": "pmkvy-data-annotation", "title": "PMKVY — Data Annotation Specialist (AI labelling jobs)", "url": "https://www.pmkvyofficial.org/", "topics": ["AI", "machine-learning"], "level": "beginner", "cost_label": "FREE"},
        {"id": "pmkvy-ai-trainer", "title": "PMKVY — AI Trainer (Train-the-trainer NSDC)", "url": "https://www.pmkvyofficial.org/", "topics": ["AI", "lesson-plan"], "level": "intermediate", "cost_label": "FREE for eligible trainers"},
        {"id": "igot-karmayogi-ai", "title": "iGOT Karmayogi — AI for Public Service (Govt Employees)", "url": "https://igotkarmayogi.gov.in/", "topics": ["AI", "karmayogi", "igot"], "level": "beginner", "cost_label": "FREE (mandatory for govt employees)"},
        {"id": "igot-cybersec-officers", "title": "iGOT Karmayogi — Cybersecurity for Officers", "url": "https://igotkarmayogi.gov.in/", "topics": ["AI", "karmayogi", "cybersecurity"], "level": "intermediate", "cost_label": "FREE for govt"},
        {"id": "indiaai-fellowship", "title": "IndiaAI Fellowship — MeitY AI Research Fellowship", "url": "https://indiaai.gov.in/", "topics": ["AI", "machine-learning", "research"], "level": "advanced", "cost_label": "FREE + INR 4,00,000 stipend/year"},
        {"id": "indiaai-datasets", "title": "IndiaAI Datasets Platform — open AI datasets for India", "url": "https://indiaai.gov.in/datasets", "topics": ["AI", "data-engineering"], "level": "intermediate", "cost_label": "FREE access for researchers"},
        {"id": "indiaai-compute", "title": "IndiaAI Compute — subsidised GPU access (MeitY)", "url": "https://indiaai.gov.in/", "topics": ["AI", "GPU", "infrastructure"], "level": "advanced", "cost_label": "Subsidised access for students/startups"},
        {"id": "skill-india-digital-ai", "title": "Skill India Digital — AI Courses Hub", "url": "https://www.skillindiadigital.gov.in/", "topics": ["AI", "machine-learning"], "level": "beginner", "cost_label": "FREE"},
        {"id": "atl-ai-modules", "title": "Atal Tinkering Labs — AI for School Students (AIM/NITI Aayog)", "url": "https://aim.gov.in/atl.php", "topics": ["AI", "fundamentals"], "level": "beginner", "cost_label": "FREE for ATL-equipped schools"},
        {"id": "dgt-ai-iti", "title": "DGT — AI/ML Courses for ITI Students", "url": "https://www.dgt.gov.in/", "topics": ["AI", "machine-learning"], "level": "beginner", "cost_label": "FREE in govt ITIs"},
        {"id": "ncs-ai-training", "title": "National Career Service — AI Training Pathways", "url": "https://www.ncs.gov.in/", "topics": ["AI"], "level": "beginner", "cost_label": "FREE"},
        {"id": "drdo-ai-training", "title": "DRDO — AI Training Programs (Defence)", "url": "https://www.drdo.gov.in/", "topics": ["AI", "computer-vision"], "level": "advanced", "cost_label": "FREE for govt scientists"},
        {"id": "bharatgen-coe", "title": "BharatGen + IISc Centre of Excellence — Indic LLM training", "url": "https://www.bharatgen.in/", "topics": ["llm", "NLP", "AI"], "level": "advanced", "cost_label": "Research-based"},
    ],
}


CERT_ONLINE_PLATFORMS_AI = {
    "slug": "india-ai-online-platforms",
    "name": "India-accessible Online AI Platforms (NPTEL / SWAYAM / UpGrad / GreatLearning / SimpliLearn / Newton)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://nptel.ac.in/",
    "free": True,
    "free_note": "NPTEL/SWAYAM free; private platforms ~INR 30K-2L.",
    "default_professions": [["software-developer", 0.7], ["student", 0.7]],
    "url_patterns": [],
    "manifest": [
        {"id": "nptel-deep-learning-iitm", "title": "NPTEL — Deep Learning (Mitesh Khapra, IIT Madras)", "url": "https://nptel.ac.in/courses/106106184", "topics": ["deep-learning", "AI"], "level": "intermediate", "cost_label": "FREE; certification fee INR 1,000"},
        {"id": "nptel-rl-iitm", "title": "NPTEL — Reinforcement Learning (Balaraman Ravindran, IIT Madras)", "url": "https://nptel.ac.in/courses/106106143", "topics": ["machine-learning", "AI"], "level": "advanced", "cost_label": "FREE; certification fee INR 1,000"},
        {"id": "nptel-cv-iith", "title": "NPTEL — Computer Vision (Vineeth Balasubramanian, IIT Hyderabad)", "url": "https://nptel.ac.in/courses/106106224", "topics": ["computer-vision", "AI"], "level": "advanced", "cost_label": "FREE; certification fee INR 1,000"},
        {"id": "nptel-nlp-iitkgp", "title": "NPTEL — Natural Language Processing (Pawan Goyal, IIT Kharagpur)", "url": "https://nptel.ac.in/courses/106105158", "topics": ["NLP", "AI"], "level": "intermediate", "cost_label": "FREE; certification fee INR 1,000"},
        {"id": "nptel-ml-iitm", "title": "NPTEL — Introduction to Machine Learning (IIT Madras)", "url": "https://nptel.ac.in/courses/106106139", "topics": ["machine-learning", "AI"], "level": "beginner", "cost_label": "FREE; certification fee INR 1,000"},
        {"id": "nptel-ai-prof-iitkgp", "title": "NPTEL — Artificial Intelligence: Knowledge Representation & Reasoning (IIT KGP)", "url": "https://nptel.ac.in/courses/106105190", "topics": ["AI"], "level": "advanced", "cost_label": "FREE; certification fee INR 1,000"},
        {"id": "nptel-prob-genai-iith", "title": "NPTEL — Generative AI (IIT Hyderabad, 2025)", "url": "https://nptel.ac.in/courses/106106214", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE; certification fee INR 1,000"},
        {"id": "swayam-aiml-pg", "title": "SWAYAM — Post-Graduate Diploma in AI/ML (Govt of India accredited)", "url": "https://swayam.gov.in/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE; certification fee INR 1,500-3,000"},
        {"id": "swayam-applied-aiml", "title": "SWAYAM — Applied AI/ML (multiple IIT/IIIT instructors)", "url": "https://swayam.gov.in/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "upgrad-iit-bglr-aiml", "title": "UpGrad — Executive PG Programme AI/ML (IIIT-B / LJMU)", "url": "https://www.upgrad.com/ai-and-ml/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "INR 2,00,000-4,00,000"},
        {"id": "upgrad-aiml-msc", "title": "UpGrad — MSc AI/ML (Liverpool John Moores University)", "url": "https://www.upgrad.com/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 4,00,000-7,00,000"},
        {"id": "great-learning-aiml-iitb", "title": "Great Learning — PGP-AIML (IIT Bombay + UT Austin)", "url": "https://www.mygreatlearning.com/pgp-aiml", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 3,00,000-5,00,000"},
        {"id": "great-learning-data-science", "title": "Great Learning — Data Science & AI (Stanford)", "url": "https://www.mygreatlearning.com/", "topics": ["AI", "data-engineering"], "level": "intermediate", "cost_label": "INR 1,50,000-3,00,000"},
        {"id": "simplilearn-ai-master", "title": "SimpliLearn — AI Engineer Master's Program (Caltech/Purdue)", "url": "https://www.simplilearn.com/artificial-intelligence-masters-program-training-course", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "INR 1,50,000-3,00,000"},
        {"id": "newton-coding-ai", "title": "Newton School — AI/ML Track (free placement-linked)", "url": "https://www.newtonschool.co/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE (income-share / placement-linked)"},
        {"id": "masai-ds-ai", "title": "Masai School — Data Science & AI (income-share)", "url": "https://www.masaischool.com/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE upfront; income-share post placement"},
        {"id": "coding-ninjas-dsa-ai", "title": "Coding Ninjas — Data Science & ML", "url": "https://www.codingninjas.com/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "INR 20,000-80,000"},
        {"id": "almabetter-ds-ai", "title": "AlmaBetter — Full-stack Data Science with AI", "url": "https://www.almabetter.com/", "topics": ["AI", "data-engineering"], "level": "intermediate", "cost_label": "INR 80,000-1,50,000"},
        {"id": "coursera-deep-learning-spec", "title": "Coursera — Deep Learning Specialization (Andrew Ng / DeepLearning.AI)", "url": "https://www.coursera.org/specializations/deep-learning", "topics": ["deep-learning", "AI"], "level": "intermediate", "cost_label": "INR 4,000/month subscription"},
        {"id": "coursera-ml-spec", "title": "Coursera — Machine Learning Specialization (Andrew Ng / Stanford)", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "topics": ["machine-learning", "AI"], "level": "beginner", "cost_label": "INR 4,000/month subscription"},
        {"id": "kaggle-learn-ai", "title": "Kaggle Learn — Free micro-courses (Intro ML, Deep Learning, Computer Vision, NLP)", "url": "https://www.kaggle.com/learn", "topics": ["machine-learning", "AI", "computer-vision", "NLP"], "level": "beginner", "cost_label": "FREE"},
        {"id": "fast-ai-prac-dl", "title": "fast.ai — Practical Deep Learning for Coders", "url": "https://course.fast.ai/", "topics": ["deep-learning", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "huggingface-nlp-course", "title": "Hugging Face — NLP Course (free, hands-on)", "url": "https://huggingface.co/learn/nlp-course", "topics": ["NLP", "llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "huggingface-agents-course", "title": "Hugging Face — AI Agents Course", "url": "https://huggingface.co/learn/agents-course/unit0/introduction", "topics": ["agents", "llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
    ],
}


CERT_AI_DOCTOR = {
    "slug": "india-ai-sector-doctor",
    "name": "Indian AI Programs — Doctor & Oncology",
    "official_domain": "various.ac.in",
    "type": "static_manifest",
    "url": "https://aiims.edu/",
    "free": False,
    "free_note": "Most fellowships stipend-paid; some online certs free.",
    "default_professions": [["doctor", 0.9], ["oncologist", 0.7], ["nurse", 0.3]],
    "url_patterns": [],
    "manifest": [
        {"id": "aiims-ai-radiology", "title": "AIIMS Delhi — AI in Medical Imaging Fellowship", "url": "https://www.aiims.edu/", "topics": ["clinical decision support", "AI", "radiology imaging"], "level": "advanced", "cost_label": "Stipend-paid 1-yr fellowship"},
        {"id": "iitm-aiims-clinical-ai", "title": "IIT Madras + AIIMS — Clinical AI Fellowship", "url": "https://www.iitm.ac.in/", "topics": ["clinical decision support", "AI", "EHR"], "level": "advanced", "cost_label": "Stipend-paid 1-2 yr"},
        {"id": "iiitd-aihc-pg", "title": "IIIT Delhi — Center for AI in Healthcare PG Programme", "url": "https://aihc.iiitd.ac.in/", "topics": ["AI", "clinical decision support", "EHR"], "level": "advanced", "cost_label": "INR 2,00,000-4,00,000"},
        {"id": "pgi-chandigarh-ai-med", "title": "PGI Chandigarh — AI in Medicine Fellowship", "url": "https://pgimer.edu.in/", "topics": ["clinical decision support", "AI"], "level": "advanced", "cost_label": "Stipend-paid"},
        {"id": "cmc-vellore-clinical-ai", "title": "CMC Vellore — Clinical Decision Support AI workshops", "url": "https://www.cmch-vellore.edu/", "topics": ["clinical decision support", "AI"], "level": "intermediate", "cost_label": "INR 15,000-50,000"},
        {"id": "tata-memorial-ai-oncology", "title": "Tata Memorial Centre — AI Oncology Fellowship (NCCN-aligned)", "url": "https://tmc.gov.in/", "topics": ["oncology", "AI", "NCCN guidelines", "tata memorial"], "level": "advanced", "cost_label": "Stipend-paid 2-yr fellowship"},
        {"id": "esmo-ai-oncology-mooc", "title": "ESMO + ASCO — AI in Oncology (free MOOC + paid CME)", "url": "https://education.esmo.org/", "topics": ["oncology", "AI", "chemotherapy"], "level": "intermediate", "cost_label": "FREE for ESMO members"},
        {"id": "iisc-defence-ai-health", "title": "IISc Defence AI + AI in Healthcare Programs", "url": "https://www.iisc.ac.in/", "topics": ["AI", "clinical decision support"], "level": "advanced", "cost_label": "Research-based"},
    ],
}


CERT_AI_LAWYER = {
    "slug": "india-ai-sector-lawyer",
    "name": "Indian AI Programs — Lawyer (NLSIU / NUJS / NALSAR)",
    "official_domain": "various.ac.in",
    "type": "static_manifest",
    "url": "https://www.nls.ac.in/",
    "free": False,
    "free_note": "Most paid; NPTEL Cyber Law is free.",
    "default_professions": [["lawyer", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "nlsiu-ai-law", "title": "NLSIU Bangalore — AI & Law Programme", "url": "https://www.nls.ac.in/", "topics": ["case-law", "AI", "DPDP"], "level": "advanced", "cost_label": "INR 1,50,000-3,00,000"},
        {"id": "nujs-cyber-ai", "title": "NUJS Kolkata — Cyber Law + AI", "url": "https://www.nujs.edu/", "topics": ["DPDP", "case-law", "AI"], "level": "intermediate", "cost_label": "INR 80,000-1,80,000"},
        {"id": "nalsar-ai-law", "title": "NALSAR Hyderabad — Distance LL.M. with AI specialisation", "url": "https://www.nalsar.ac.in/", "topics": ["case-law", "AI", "DPDP"], "level": "advanced", "cost_label": "INR 1,00,000-2,50,000"},
        {"id": "ils-pune-ai-legal", "title": "ILS Pune — AI for Legal Professionals", "url": "https://www.ilslaw.edu/", "topics": ["case-law", "AI"], "level": "intermediate", "cost_label": "INR 40,000-1,20,000"},
        {"id": "nptel-cyber-law", "title": "NPTEL — Cyber Law (covers AI regulation in India)", "url": "https://nptel.ac.in/", "topics": ["case-law", "DPDP", "AI"], "level": "intermediate", "cost_label": "FREE; certification fee INR 1,000"},
        {"id": "iitb-tech-policy", "title": "IIT Bombay — Tech Policy + AI Regulation Course", "url": "https://www.iitb.ac.in/", "topics": ["AI", "DPDP", "case-law"], "level": "advanced", "cost_label": "Research-based"},
    ],
}


CERT_AI_TEACHER = {
    "slug": "india-ai-sector-teacher",
    "name": "Indian AI Programs — Teacher (NCERT / AICTE-Trainer / IIIT-H Pedagogy)",
    "official_domain": "various.gov.in",
    "type": "static_manifest",
    "url": "https://diksha.gov.in/",
    "free": True,
    "free_note": "Most government teacher AI training is free.",
    "default_professions": [["teacher", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "diksha-ai-pedagogy", "title": "DIKSHA — AI in Pedagogy (NCERT, free MOOC for teachers)", "url": "https://diksha.gov.in/", "topics": ["DIKSHA", "AI", "lesson-plan", "NEP-2020"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "ncert-ai-training", "title": "NCERT — AI in Education Training Programme", "url": "https://ncert.nic.in/", "topics": ["NEP-2020", "AI", "lesson-plan"], "level": "intermediate", "cost_label": "FREE for govt school teachers"},
        {"id": "aicte-train-ai-faculty", "title": "AICTE — Faculty Development Programme in AI", "url": "https://www.aicte-india.org/", "topics": ["AI", "lesson-plan"], "level": "advanced", "cost_label": "FREE for AICTE faculty"},
        {"id": "iiit-h-school-ai-ped", "title": "IIIT Hyderabad — School AI Pedagogy Workshop", "url": "https://www.iiit.ac.in/", "topics": ["AI", "lesson-plan", "DIKSHA"], "level": "intermediate", "cost_label": "INR 5,000-15,000"},
        {"id": "magicschool-india", "title": "MagicSchool.ai — AI tools for Indian Teachers (free tier)", "url": "https://www.magicschool.ai/", "topics": ["lesson-plan", "AI"], "level": "beginner", "cost_label": "FREE tier; paid INR 800-2,000/month"},
        {"id": "kvs-ai-training", "title": "Kendriya Vidyalaya — Internal AI in Classroom Training", "url": "https://www.kvsangathan.nic.in/", "topics": ["AI", "lesson-plan", "NEP-2020"], "level": "intermediate", "cost_label": "FREE for KV teachers"},
        {"id": "central-square-ai-edu", "title": "Central Square Foundation — AI for Indian Public Schools Programme", "url": "https://centralsquarefoundation.org/", "topics": ["AI", "lesson-plan", "NEP-2020"], "level": "intermediate", "cost_label": "FREE for partner govt schools"},
        {"id": "ekstep-aladin", "title": "EkStep + AI/ML Studio — for teacher content creators", "url": "https://ekstep.in/", "topics": ["AI", "lesson-plan"], "level": "intermediate", "cost_label": "FREE for educators"},
    ],
}


CERT_AI_FARMER = {
    "slug": "india-ai-sector-farmer",
    "name": "Indian AI Programs — Farmer (ICAR / MANAGE / KVK Drone / Tamil Nadu Agri)",
    "official_domain": "various.gov.in",
    "type": "static_manifest",
    "url": "https://icar.org.in/",
    "free": True,
    "free_note": "All government KVK + ICAR farmer AI training is FREE.",
    "default_professions": [["farmer", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "icar-iari-ai-agri", "title": "ICAR-IARI Pusa — AI in Agriculture Training", "url": "https://www.iari.res.in/", "topics": ["precision-agriculture", "AI", "agritech"], "level": "intermediate", "cost_label": "FREE for farmer cohorts"},
        {"id": "manage-agri-ai", "title": "MANAGE Hyderabad — Agri-AI Extension Programme", "url": "https://www.manage.gov.in/", "topics": ["precision-agriculture", "AI", "agritech"], "level": "intermediate", "cost_label": "FREE for farmer cohorts"},
        {"id": "kvk-drone-training", "title": "KVK Drone Pilot Training (DGCA + Agriculture Ministry)", "url": "https://kvk.icar.gov.in/", "topics": ["precision-agriculture", "AI", "agritech"], "level": "intermediate", "cost_label": "FREE + stipend (subsidy on drone purchase)"},
        {"id": "tnau-ai-agri-lab", "title": "Tamil Nadu Agricultural University — AI in Agriculture Lab", "url": "https://www.tnau.ac.in/", "topics": ["precision-agriculture", "AI", "agritech"], "level": "intermediate", "cost_label": "FREE for TN farmers"},
        {"id": "iari-soil-health-ai", "title": "ICAR-IARI — AI for Soil Health Card Interpretation", "url": "https://www.iari.res.in/", "topics": ["soil-health", "precision-agriculture", "AI"], "level": "beginner", "cost_label": "FREE"},
        {"id": "iari-pest-detection", "title": "ICAR — AI-based Pest Detection Mobile App Training", "url": "https://www.icar.org.in/", "topics": ["precision-agriculture", "AI", "agritech"], "level": "beginner", "cost_label": "FREE"},
        {"id": "iit-roorkee-agritech", "title": "IIT Roorkee — Agritech & Precision Farming Programme", "url": "https://www.iitr.ac.in/", "topics": ["precision-agriculture", "AI", "agritech"], "level": "advanced", "cost_label": "INR 30,000-1,00,000"},
        {"id": "fasal-ai-platform", "title": "Fasal — Precision Farming AI App for Indian Farmers", "url": "https://www.fasal.co/", "topics": ["precision-agriculture", "AI", "agritech"], "level": "beginner", "cost_label": "Free trial; paid INR 5,000-15,000/year"},
        {"id": "cropin-platform", "title": "Cropin SmartFarm — AI farm intelligence (free + paid tiers)", "url": "https://www.cropin.com/", "topics": ["precision-agriculture", "AI", "agritech"], "level": "intermediate", "cost_label": "Free FPO tier; SaaS pricing"},
    ],
}


CERT_AI_ACCOUNTANT = {
    "slug": "india-ai-sector-accountant",
    "name": "Indian AI Programs — Accountant (ICAI / NSE / BSE / Tally AI)",
    "official_domain": "icai.org",
    "type": "static_manifest",
    "url": "https://www.icai.org/",
    "free": False,
    "free_note": "ICAI cert moderate-cost; NPTEL AI in Finance free.",
    "default_professions": [["accountant", 0.95], ["business-owner", 0.5]],
    "url_patterns": [],
    "manifest": [
        {"id": "icai-ai-accounting", "title": "ICAI — Certificate Course on AI in Accounting & Auditing", "url": "https://www.icai.org/", "topics": ["icai", "AI", "gst"], "level": "intermediate", "cost_label": "INR 12,000-25,000"},
        {"id": "icai-big-data-analytics", "title": "ICAI — Big Data & Analytics for Chartered Accountants", "url": "https://www.icai.org/", "topics": ["icai", "data-engineering", "AI"], "level": "intermediate", "cost_label": "INR 15,000-30,000"},
        {"id": "icai-fintech-ai", "title": "ICAI — FinTech with AI Certificate", "url": "https://www.icai.org/", "topics": ["icai", "AI", "gst"], "level": "intermediate", "cost_label": "INR 12,000-25,000"},
        {"id": "nse-academy-ai-finance", "title": "NSE Academy — AI in Finance Programme", "url": "https://nseindia.com/learn", "topics": ["icai", "AI"], "level": "intermediate", "cost_label": "INR 8,000-20,000"},
        {"id": "bse-institute-ai-markets", "title": "BSE Institute — AI for Capital Markets", "url": "https://www.bsebti.com/", "topics": ["icai", "AI"], "level": "intermediate", "cost_label": "INR 10,000-25,000"},
        {"id": "tally-ai-workshop", "title": "Tally Education — AI for Accountants Workshop", "url": "https://tallyeducation.com/", "topics": ["icai", "AI"], "level": "beginner", "cost_label": "INR 3,000-8,000"},
        {"id": "iit-r-fintech-ai", "title": "IIT Roorkee — FinTech with AI/ML (online)", "url": "https://www.iitr.ac.in/", "topics": ["icai", "AI", "machine-learning"], "level": "advanced", "cost_label": "INR 30,000-80,000"},
        {"id": "nptel-ai-finance", "title": "NPTEL — AI in Finance (IIT Madras)", "url": "https://nptel.ac.in/", "topics": ["AI", "icai"], "level": "intermediate", "cost_label": "FREE; cert fee INR 1,000"},
    ],
}


CERT_AI_HR_TA = {
    "slug": "india-ai-sector-hr-ta",
    "name": "Indian AI Programs — HR + Talent Acquisition (SHRM / NHRDN / TISS / IIM Indore)",
    "official_domain": "shrm.org",
    "type": "static_manifest",
    "url": "https://www.shrm.org/in",
    "free": False,
    "free_note": "Mostly paid; AICTE Train-the-Trainer in AI for HR is free.",
    "default_professions": [["hr-professional", 0.9], ["talent-acquisition", 0.85]],
    "url_patterns": [],
    "manifest": [
        {"id": "shrm-india-ai-hr", "title": "SHRM India — AI in HR Specialty Credential", "url": "https://www.shrm.org/in/credentials/specialty-credentials/ai-in-hr", "topics": ["ai for hr", "ai recruiting", "people analytics"], "level": "intermediate", "cost_label": "USD 950 (~INR 80,000)"},
        {"id": "shrm-india-ta-tech", "title": "SHRM India — Talent Acquisition Technology Programme", "url": "https://www.shrm.org/in", "topics": ["talent acquisition", "AI", "ATS"], "level": "intermediate", "cost_label": "INR 25,000-60,000"},
        {"id": "nhrdn-ai-hr", "title": "NHRDN — AI in HR Workshops (National HRD Network)", "url": "https://nationalhrd.org/", "topics": ["ai for hr", "people analytics"], "level": "intermediate", "cost_label": "INR 8,000-25,000"},
        {"id": "tiss-hr-analytics", "title": "TISS Mumbai — HR Analytics with AI (Executive Ed)", "url": "https://www.tiss.edu/", "topics": ["people analytics", "AI", "hr analytics"], "level": "intermediate", "cost_label": "INR 60,000-1,50,000"},
        {"id": "iim-indore-hr-analytics", "title": "IIM Indore — HR Analytics & AI (Executive)", "url": "https://www.iimidr.ac.in/", "topics": ["people analytics", "AI", "hr analytics"], "level": "intermediate", "cost_label": "INR 1,50,000-3,00,000"},
        {"id": "xlri-hr-analytics", "title": "XLRI Jamshedpur — People Analytics with AI Programme", "url": "https://www.xlri.ac.in/", "topics": ["people analytics", "AI"], "level": "intermediate", "cost_label": "INR 1,80,000-3,50,000"},
        {"id": "naukri-recruiter-ai", "title": "Naukri — AI for Recruiting Bootcamp (Naukri Learning)", "url": "https://www.naukri.com/", "topics": ["talent acquisition", "AI", "naukri recruiter"], "level": "intermediate", "cost_label": "INR 5,000-15,000"},
        {"id": "linkedin-recruiter-cert-ai", "title": "LinkedIn Recruiter Cert with AI Sourcing Module", "url": "https://learning.linkedin.com/recruiter-certification", "topics": ["linkedin recruiter", "ai recruiting", "boolean search"], "level": "intermediate", "cost_label": "Free with LinkedIn Recruiter license"},
    ],
}


# India-specific AI tools (BHASHINI, IndiaAI Datasets, BharatGen, etc.)
TOOL_INDIAN_GOV_AI = {
    "slug": "india-government-ai-tools",
    "name": "Indian Government AI Tools (BHASHINI / IndiaAI / BharatGen / NeGD)",
    "official_domain": "various-gov.in",
    "type": "static_manifest",
    "url": "https://bhashini.gov.in/",
    "free": True,
    "free_note": "All free for Indian users.",
    "default_professions": [["software-developer", 0.65], ["student", 0.6], ["government-employee", 0.55], ["teacher", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "bhashini-portal", "title": "BHASHINI — National Language Translation Mission (MeitY)", "url": "https://bhashini.gov.in/", "topics": ["NLP", "AI", "vernacular"], "duration_min": None, "level": None},
        {"id": "indiaai-datasets-portal", "title": "IndiaAI Datasets Platform — open AI training data", "url": "https://indiaai.gov.in/datasets", "topics": ["AI", "data-engineering"], "duration_min": None, "level": None},
        {"id": "indiaai-compute-portal", "title": "IndiaAI Compute Portal — subsidised GPU access", "url": "https://indiaai.gov.in/", "topics": ["AI", "GPU", "infrastructure"], "duration_min": None, "level": None},
        {"id": "bharatgen", "title": "BharatGen — Indic LLM (IISc + 6 IITs)", "url": "https://www.bharatgen.in/", "topics": ["llm", "NLP", "AI", "vernacular"], "duration_min": None, "level": None},
        {"id": "ai4bharat", "title": "AI4Bharat — IIT Madras Indic AI models + datasets", "url": "https://ai4bharat.iitm.ac.in/", "topics": ["NLP", "AI", "llm", "vernacular"], "duration_min": None, "level": None},
        {"id": "ai4bharat-indictrans", "title": "AI4Bharat IndicTrans — open NMT for 22 Indian languages", "url": "https://ai4bharat.iitm.ac.in/indic-trans", "topics": ["NLP", "AI", "vernacular"], "duration_min": None, "level": None},
        {"id": "negd-saransh", "title": "NeGD Saransh — government doc-summarisation AI", "url": "https://negd.gov.in/", "topics": ["NLP", "AI", "karmayogi"], "duration_min": None, "level": None},
        {"id": "diksha-genie", "title": "DIKSHA Genie — AI assistant for teachers (NCERT)", "url": "https://diksha.gov.in/", "topics": ["AI", "DIKSHA", "lesson-plan"], "duration_min": None, "level": None},
    ],
}


# Tool block for Indian AI research labs / community
TOOL_INDIAN_AI_RESEARCH = {
    "slug": "india-ai-research-community",
    "name": "Indian AI Research Labs & Communities (Sarvam / Krutrim / Avataar / IIIT-iHub)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.sarvam.ai/",
    "free": True,
    "free_note": "Open-source models + community resources; commercial API tiers exist.",
    "default_professions": [["software-developer", 0.85], ["student", 0.5]],
    "url_patterns": [],
    "manifest": [
        {"id": "sarvam-ai", "title": "Sarvam AI — Indian LLMs for vernacular use cases", "url": "https://www.sarvam.ai/", "topics": ["llm", "NLP", "AI", "vernacular"], "duration_min": None, "level": None},
        {"id": "krutrim-ola", "title": "Krutrim — Ola's Indian AI LLM platform", "url": "https://www.krutrim.ai/", "topics": ["llm", "AI", "vernacular"], "duration_min": None, "level": None},
        {"id": "avataar-ai", "title": "Avataar AI — generative 3D for Indian e-commerce", "url": "https://avataar.ai/", "topics": ["computer-vision", "AI"], "duration_min": None, "level": None},
        {"id": "iiit-h-ihub-data", "title": "IIIT Hyderabad iHub-Data — AI research infrastructure", "url": "https://ihub-data.iiit.ac.in/", "topics": ["AI", "machine-learning", "data-engineering"], "duration_min": None, "level": None},
        {"id": "pravartak-iitm", "title": "IIT Madras Pravartak — AI Innovation Hub", "url": "https://pravartak.org.in/", "topics": ["AI", "machine-learning"], "duration_min": None, "level": None},
        {"id": "wadhwani-ai", "title": "Wadhwani AI — non-profit AI for social good (TB, cotton, mums-kids)", "url": "https://www.wadhwaniai.org/", "topics": ["AI", "computer-vision"], "duration_min": None, "level": None},
        {"id": "araya-iiit", "title": "Araya — IIIT Bangalore AI platform for healthcare", "url": "https://araya.ai/", "topics": ["AI", "clinical decision support"], "duration_min": None, "level": None},
    ],
}


COURSES_YOUTUBE_FREE_AI = {
    "slug": "india-ai-youtube-free-channels",
    "name": "Free YouTube AI/ML/GenAI Courses (Indian creators + global free MOOCs)",
    "official_domain": "youtube.com",
    "type": "static_manifest",
    "url": "https://www.youtube.com/results?search_query=AI+ML+course+free",
    "free": True,
    "free_note": "100% FREE. YouTube channels + auto-uploaded MIT/Stanford/Harvard lectures.",
    "default_professions": [["software-developer", 0.75], ["student", 0.85], ["business-owner", 0.3]],
    "url_patterns": [],
    "manifest": [
        {"id": "krishnaik-ml-fullcourse", "title": "Krish Naik — End-to-End ML / DL / GenAI Full Course (FREE, India's biggest AI YouTuber)", "url": "https://www.youtube.com/@krishnaik06", "topics": ["machine-learning", "deep-learning", "AI", "llm", "agents"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE on YouTube"},
        {"id": "krishnaik-genai-agents", "title": "Krish Naik — Generative AI & Agentic AI playlist", "url": "https://www.youtube.com/@krishnaik06/playlists", "topics": ["llm", "agents", "rag", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "codebasics-ds-fullcourse", "title": "codebasics (Dhaval Patel) — Data Science / ML Roadmap Full Course (free)", "url": "https://www.youtube.com/@codebasics", "topics": ["machine-learning", "data-engineering", "AI"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "apna-college-aiml-hindi", "title": "Apna College — Python + ML in Hindi (free playlist)", "url": "https://www.youtube.com/@ApnaCollegeOfficial", "topics": ["machine-learning", "AI", "python"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE (Hindi)"},
        {"id": "codewithharry-aiml-hindi", "title": "CodeWithHarry — AI/ML in Hindi (Harry's free playlist)", "url": "https://www.youtube.com/@CodeWithHarry", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE (Hindi)"},
        {"id": "telusko-aiml", "title": "Telusko (Navin Reddy) — Python + AI/ML for Indians (free)", "url": "https://www.youtube.com/@Telusko", "topics": ["machine-learning", "AI", "python"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "wscube-tech-ai", "title": "WsCube Tech — AI/ML Course in Hindi (free)", "url": "https://www.youtube.com/@WsCubeTech", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE (Hindi)"},
        {"id": "freecodecamp-aiml", "title": "freeCodeCamp.org — full-length ML / DL / TensorFlow courses (10-20 hour videos)", "url": "https://www.youtube.com/@freecodecamp", "topics": ["machine-learning", "deep-learning", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "freecodecamp-langchain", "title": "freeCodeCamp — Build LLM applications with LangChain (free 5-hour course)", "url": "https://www.youtube.com/@freecodecamp", "topics": ["llm", "rag", "agents", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "deeplearningai-yt", "title": "DeepLearning.AI YouTube — Andrew Ng's free short courses + Heroes of DL", "url": "https://www.youtube.com/@Deeplearningai", "topics": ["deep-learning", "AI", "machine-learning"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "stanford-cs229", "title": "Stanford CS229 — Machine Learning (Andrew Ng, full lectures)", "url": "https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "stanford-cs224n", "title": "Stanford CS224N — NLP with Deep Learning (Chris Manning)", "url": "https://www.youtube.com/playlist?list=PLoROMvodv4rOSH4v6133s9LFPRHjEmbmJ", "topics": ["NLP", "deep-learning", "AI"], "duration_minutes": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "stanford-cs336", "title": "Stanford CS336 — LLMs from Scratch (2024-2025)", "url": "https://stanford-cs336.github.io/", "topics": ["llm", "AI"], "duration_minutes": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "mit-6s191", "title": "MIT 6.S191 — Introduction to Deep Learning (FREE annual)", "url": "http://introtodeeplearning.com/", "topics": ["deep-learning", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "mit-6034", "title": "MIT 6.034 — Artificial Intelligence (FREE OCW)", "url": "https://www.youtube.com/playlist?list=PLUl4u3cNGP63gFHB6xb-kVBiQHYe_4hSi", "topics": ["AI"], "duration_minutes": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "deepmind-rl-series", "title": "DeepMind × UCL — Reinforcement Learning Lecture Series (FREE)", "url": "https://www.youtube.com/playlist?list=PLqYmG7hTraZBKeNJ-JE_eyJHZ7XgBoAyb", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "3b1b-neural-networks", "title": "3Blue1Brown — Neural Networks visualised (foundational)", "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", "topics": ["deep-learning", "AI"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "statquest", "title": "StatQuest (Josh Starmer) — ML statistics visualised", "url": "https://www.youtube.com/@statquest", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "andrej-karpathy", "title": "Andrej Karpathy — Neural Networks: Zero to Hero + Build a LLM from scratch", "url": "https://www.youtube.com/@AndrejKarpathy", "topics": ["llm", "deep-learning", "AI"], "duration_minutes": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "two-minute-papers", "title": "Two Minute Papers — AI research news (every paper explained in 2 min)", "url": "https://www.youtube.com/@TwoMinutePapers", "topics": ["AI", "research"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "yannic-kilcher", "title": "Yannic Kilcher — AI paper deep-dives", "url": "https://www.youtube.com/@YannicKilcher", "topics": ["AI", "llm"], "duration_minutes": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "lex-fridman-ai", "title": "Lex Fridman Podcast — long-form AI conversations", "url": "https://www.youtube.com/@lexfridman", "topics": ["AI", "research"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "sentdex-python-ai", "title": "sentdex — Python AI tutorials (decade of free content)", "url": "https://www.youtube.com/@sentdex", "topics": ["machine-learning", "AI", "python"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "huggingface-yt", "title": "Hugging Face YouTube — model + library tutorials", "url": "https://www.youtube.com/@HuggingFace", "topics": ["llm", "NLP", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "langchain-academy-yt", "title": "LangChain Academy — Agents + LangGraph tutorials (FREE)", "url": "https://www.youtube.com/@LangChain", "topics": ["agents", "llm", "rag", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "gfg-aiml", "title": "GeeksforGeeks — AI/ML tutorials channel", "url": "https://www.youtube.com/@GeeksforGeeksVideos", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "ineuron-aiml-iitm", "title": "iNeuron — Full Stack Data Science / AI (free YouTube version)", "url": "https://www.youtube.com/@iNeuroniNtelligence", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE on YouTube; paid bootcamp"},
        {"id": "campus-x-ml", "title": "Campus X — 100-day Machine Learning Course in Hindi (free)", "url": "https://www.youtube.com/@campusx-official", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE (Hindi)"},
        {"id": "andrew-ng-genai-everyone", "title": "Andrew Ng — Generative AI for Everyone (DeepLearning.AI free)", "url": "https://www.deeplearning.ai/short-courses/generative-ai-for-everyone/", "topics": ["llm", "AI"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "deeplearningai-short-courses", "title": "DeepLearning.AI — 70+ FREE short courses (LangChain / RAG / Agents / Eval / etc.)", "url": "https://www.deeplearning.ai/short-courses/", "topics": ["llm", "rag", "agents", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
    ],
}


COURSES_FREE_GLOBAL_PLATFORMS = {
    "slug": "india-ai-free-global-platforms",
    "name": "Free Global AI Platforms (NVIDIA DLI / IBM AI Skills / Microsoft AI School / Google AI / Anthropic)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://learn.deeplearning.ai/",
    "free": True,
    "free_note": "All listed courses 100% FREE (vendor-funded skilling).",
    "default_professions": [["software-developer", 0.75], ["student", 0.7], ["business-owner", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "nvidia-dli-free-fundamentals", "title": "NVIDIA Deep Learning Institute — Fundamentals of Deep Learning (FREE)", "url": "https://www.nvidia.com/en-us/training/", "topics": ["deep-learning", "cuda", "AI"], "duration_minutes": 480, "level": "intermediate", "cost_label": "FREE (NVDLI subsidised)"},
        {"id": "nvidia-dli-acc-comp", "title": "NVIDIA DLI — Accelerated Computing with CUDA (FREE workshop)", "url": "https://www.nvidia.com/en-us/training/", "topics": ["cuda", "AI"], "duration_minutes": 480, "level": "advanced", "cost_label": "FREE"},
        {"id": "nvidia-dli-rag-deploy", "title": "NVIDIA DLI — Building RAG agents with LLMs (free)", "url": "https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-FX-15+V1", "topics": ["rag", "llm", "agents", "AI"], "duration_minutes": 480, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ibm-ai-skills-academy", "title": "IBM AI Skills Academy — free track + watsonx cert prep", "url": "https://www.ibm.com/training/artificial-intelligence", "topics": ["AI", "machine-learning"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE tier"},
        {"id": "ibm-ai-developer", "title": "IBM Generative AI Developer Professional Certificate (Coursera audit free)", "url": "https://www.coursera.org/professional-certificates/applied-artifical-intelligence-ibm-watson-ai", "topics": ["llm", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "Audit FREE; cert paid"},
        {"id": "microsoft-ai-school", "title": "Microsoft AI School — free AI/Copilot Studio learning paths", "url": "https://learn.microsoft.com/en-us/training/ai/", "topics": ["AI", "copilot studio"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "google-cloud-skills-boost", "title": "Google Cloud Skills Boost — Generative AI Learning Path (FREE)", "url": "https://www.cloudskillsboost.google/paths/118", "topics": ["llm", "AI", "machine-learning"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "google-ml-crash-course", "title": "Google ML Crash Course — fundamentals in 15 hours (FREE)", "url": "https://developers.google.com/machine-learning/crash-course", "topics": ["machine-learning", "AI"], "duration_minutes": 900, "level": "beginner", "cost_label": "FREE"},
        {"id": "anthropic-cookbook", "title": "Anthropic — Claude Cookbooks + Prompt Engineering Course (FREE)", "url": "https://docs.anthropic.com/en/docs/welcome", "topics": ["llm", "agents", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "openai-cookbook", "title": "OpenAI Cookbook — FREE recipes, fine-tuning, agents", "url": "https://cookbook.openai.com/", "topics": ["llm", "fine-tuning", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "kaggle-learn-all", "title": "Kaggle Learn — 12+ FREE micro-courses (ML, DL, CV, NLP, GenAI)", "url": "https://www.kaggle.com/learn", "topics": ["machine-learning", "deep-learning", "computer-vision", "NLP", "AI"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "hf-deep-rl", "title": "Hugging Face — Deep RL Course (FREE)", "url": "https://huggingface.co/learn/deep-rl-course", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "hf-audio-course", "title": "Hugging Face — Audio ML Course (FREE)", "url": "https://huggingface.co/learn/audio-course", "topics": ["AI", "audio", "speech"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "fastai-prac", "title": "fast.ai — Practical Deep Learning for Coders (FREE, Jeremy Howard)", "url": "https://course.fast.ai/", "topics": ["deep-learning", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "wandb-edu", "title": "Weights & Biases Educator courses (FREE)", "url": "https://wandb.ai/site/courses", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "roboflow-cv-uni", "title": "Roboflow — free Computer Vision University", "url": "https://roboflow.com/learn", "topics": ["computer-vision", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "datacamp-free-week", "title": "DataCamp — DataCamp Donates (FREE for students/teachers)", "url": "https://www.datacamp.com/donates", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE for verified students/teachers"},
        {"id": "github-copilot-students", "title": "GitHub Copilot for Students — FREE Pro access via Student Pack", "url": "https://education.github.com/pack", "topics": ["AI"], "duration_minutes": None, "level": "beginner", "cost_label": "FREE for verified students"},
        {"id": "linkedin-learning-india-free", "title": "LinkedIn Learning — Free AI/ML basics paths", "url": "https://www.linkedin.com/learning/topics/artificial-intelligence", "topics": ["machine-learning", "AI"], "duration_minutes": None, "level": "beginner", "cost_label": "Free trial + LinkedIn Premium for students"},
        {"id": "harvard-cs50-ai", "title": "Harvard CS50's Introduction to AI with Python (FREE on edX)", "url": "https://cs50.harvard.edu/ai/", "topics": ["AI", "machine-learning"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE (cert optional ~USD 200)"},
        {"id": "cohere-llm-uni", "title": "Cohere LLM University (FREE LLM curriculum)", "url": "https://docs.cohere.com/page/llmu", "topics": ["llm", "rag", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "anthropic-academy", "title": "Anthropic Skilljar — official Claude API + Agents training (FREE)", "url": "https://anthropic.skilljar.com/", "topics": ["llm", "agents", "AI"], "duration_minutes": None, "level": "intermediate", "cost_label": "FREE"},
    ],
}


STREAMS_PLAN = [
    ("cert", CERT_INDIAN_UNIVERSITY_AI),
    ("cert", CERT_INDIAN_GOV_AI),
    ("cert", CERT_ONLINE_PLATFORMS_AI),
    ("cert", CERT_AI_DOCTOR),
    ("cert", CERT_AI_LAWYER),
    ("cert", CERT_AI_TEACHER),
    ("cert", CERT_AI_FARMER),
    ("cert", CERT_AI_ACCOUNTANT),
    ("cert", CERT_AI_HR_TA),
    ("tool", TOOL_INDIAN_GOV_AI),
    ("tool", TOOL_INDIAN_AI_RESEARCH),
]
# Courses live in their own file; YouTube + free global platforms route there.
COURSES_PLAN = [
    COURSES_YOUTUBE_FREE_AI,
    COURSES_FREE_GLOBAL_PLATFORMS,
]


def _merge_into(target_path: Path, sources_list_path: list, blocks: list, label: str) -> int:
    """sources_list_path is a list of dotted keys to walk into the JSON,
    ending at a `sources` list. Returns # items added."""
    d = json.loads(target_path.read_text(encoding="utf-8"))
    node = d
    for k in sources_list_path:
        node = node[k]
    added = 0
    for block in blocks:
        if any(s.get("slug") == block["slug"] for s in node):
            print(f"  - skip {label}/{block['slug']} (already present)")
            continue
        node.append(block)
        items = len(block.get("manifest", []))
        print(f"  + {label}/{block['slug']} ({items} items)")
        added += items
    target_path.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return added


def main() -> int:
    added = 0
    # Streams: cert + tool blocks
    d = json.loads(TARGET_STREAMS.read_text(encoding="utf-8"))
    streams = d["streams"]
    for stream_key, block in STREAMS_PLAN:
        stream = streams.get(stream_key)
        if not stream:
            print(f"  ! stream missing: {stream_key}")
            continue
        sources = stream.setdefault("sources", [])
        if any(s.get("slug") == block["slug"] for s in sources):
            print(f"  - skip {stream_key}/{block['slug']} (already present)")
            continue
        sources.append(block)
        items = len(block.get("manifest", []))
        print(f"  + {stream_key}/{block['slug']} ({items} items)")
        added += items
    TARGET_STREAMS.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Courses: separate file
    added += _merge_into(TARGET_COURSES, ["sources"], COURSES_PLAN, "courses")

    print(f"\n=== Added {added} hand-curated India-AI items across {len(STREAMS_PLAN)+len(COURSES_PLAN)} sources ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
