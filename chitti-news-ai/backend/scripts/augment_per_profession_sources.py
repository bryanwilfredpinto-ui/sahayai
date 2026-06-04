"""
Augment streams_sources.json with per-profession manifest blocks for the
7 broken professions identified in the 2026-06-04 live audit:

  doctor, oncologist, nurse, farmer, teacher, lawyer, government-employee

Plus reinforcing fills for accountant, student, business-owner (currently
single-stream populated).

Run once:
    python scripts/augment_per_profession_sources.py

Idempotent: skips a manifest block if its slug already exists in the file.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "data" / "streams_sources.json"

# ─────────────────────────────────────────────────────────────────────────
# Manifest blocks per (stream, profession). Each block = one new "source"
# entry in streams_sources.json[streams][<stream>][sources].
# ─────────────────────────────────────────────────────────────────────────

CERTS_DOCTOR = {
    "slug": "doctor-medical-certs",
    "name": "Doctor + Oncologist Certifications & Fellowships",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://nbe.edu.in/",
    "free": False,
    "free_note": "Most fellowships are stipend-paid; some MOOC certs are free.",
    "default_professions": [["doctor", 0.85], ["oncologist", 0.6]],
    "url_patterns": [],
    "manifest": [
        {"id": "nbe-dnb", "title": "DNB — Diplomate of National Board (NBE)", "url": "https://nbe.edu.in/dnb-cet", "topics": ["clinical decision support", "EHR", "evidence-based medicine"], "level": "advanced", "cost_label": "Stipend-paid 3-yr residency; NBE fee ~INR 1,75,000"},
        {"id": "next-aiims", "title": "NExT — National Exit Test (NMC/AIIMS)", "url": "https://www.nmc.org.in/information-desk/next/", "topics": ["clinical", "MBBS", "ICD-10"], "level": "advanced", "cost_label": "Mandatory licensure exam — government-set"},
        {"id": "icmr-research", "title": "ICMR Research Fellowships (SRF/JRF)", "url": "https://main.icmr.nic.in/", "topics": ["medical literature", "clinical trial", "evidence-based medicine"], "level": "advanced", "cost_label": "ICMR stipend INR 31,000-35,000/month"},
        {"id": "ihmm-clinical-ai", "title": "Clinical AI Certificate — IIT-Delhi + AIIMS", "url": "https://www.iitd.ac.in/", "topics": ["clinical decision support", "AI", "EMR"], "level": "intermediate", "cost_label": "INR 50,000 (executive education)"},
        {"id": "fmgr-acls", "title": "ACLS — Advanced Cardiac Life Support (American Heart Assn India)", "url": "https://cpr.heart.org/en/courses/advanced-cardiovascular-life-support-acls-course-options", "topics": ["clinical", "patient triage", "emergency"], "level": "intermediate", "cost_label": "INR 8,000-15,000"},
        {"id": "fmgr-bls", "title": "BLS — Basic Life Support (American Heart Assn India)", "url": "https://cpr.heart.org/en/courses/basic-life-support-bls-course-options", "topics": ["clinical", "patient triage"], "level": "beginner", "cost_label": "INR 4,000-6,000"},
        {"id": "tata-oncology-fellowship", "title": "Tata Memorial Centre Oncology Fellowships", "url": "https://tmc.gov.in/", "topics": ["oncology", "AIIMS oncology", "tata memorial", "NCCN guidelines"], "level": "advanced", "cost_label": "Stipend-paid 2-yr fellowship"},
        {"id": "esmo-asco-certs", "title": "ESMO + ASCO Oncology Education (Free MOOCs)", "url": "https://education.esmo.org/", "topics": ["oncology", "chemotherapy", "immunotherapy", "NCCN guidelines"], "level": "intermediate", "cost_label": "Free + paid live sessions"},
    ],
}

TOOLS_DOCTOR = {
    "slug": "doctor-clinical-tools",
    "name": "Clinical & Oncology Tools (free + freemium)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://abdm.gov.in/",
    "free": True,
    "free_note": "Most tools have free tiers; reference apps free for medical professionals.",
    "default_professions": [["doctor", 0.8], ["oncologist", 0.7], ["nurse", 0.5]],
    "url_patterns": [],
    "manifest": [
        {"id": "abdm-hpr", "title": "ABDM HPR — Healthcare Professionals Registry", "url": "https://hpr.abdm.gov.in/", "topics": ["EHR", "ABDM", "clinical"], "duration_min": None, "level": None},
        {"id": "abdm-hfr", "title": "ABDM HFR — Health Facility Registry", "url": "https://facility.abdm.gov.in/", "topics": ["EHR", "ABDM", "clinical"], "duration_min": None, "level": None},
        {"id": "ehealth-india", "title": "eHealth India — National Digital Health Mission portal", "url": "https://ehealth.gov.in/", "topics": ["EHR", "ICD-10", "clinical"], "duration_min": None, "level": None},
        {"id": "epocrates", "title": "Epocrates — drug interactions + clinical reference", "url": "https://www.epocrates.com/", "topics": ["clinical decision support", "drug interactions"], "duration_min": None, "level": None},
        {"id": "medscape-india", "title": "Medscape — clinical reference + drug interactions", "url": "https://www.medscape.com/", "topics": ["clinical decision support", "drug interactions", "evidence-based medicine"], "duration_min": None, "level": None},
        {"id": "uptodate-india", "title": "UpToDate — evidence-based clinical decision support", "url": "https://www.uptodate.com/", "topics": ["clinical decision support", "evidence-based medicine", "differential diagnosis"], "duration_min": None, "level": None},
        {"id": "pubmed", "title": "PubMed — NIH biomedical literature search", "url": "https://pubmed.ncbi.nlm.nih.gov/", "topics": ["medical literature", "clinical trial", "evidence-based medicine"], "duration_min": None, "level": None},
        {"id": "nccn-guidelines", "title": "NCCN Clinical Practice Guidelines (Oncology)", "url": "https://www.nccn.org/guidelines/category_1", "topics": ["oncology", "NCCN guidelines", "chemotherapy", "TNM staging"], "duration_min": None, "level": None},
        {"id": "openmrs", "title": "OpenMRS — open-source EMR", "url": "https://openmrs.org/", "topics": ["EMR", "EHR", "clinical"], "duration_min": None, "level": None},
    ],
}

CERTS_NURSE = {
    "slug": "nurse-india-certs",
    "name": "Nursing Certifications & Training (India)",
    "official_domain": "indiannursingcouncil.org",
    "type": "static_manifest",
    "url": "https://www.indiannursingcouncil.org/",
    "free": False,
    "free_note": "Government nursing programs are heavily subsidised; private vary.",
    "default_professions": [["nurse", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "inc-anm", "title": "ANM — Auxiliary Nurse Midwife (Indian Nursing Council)", "url": "https://www.indiannursingcouncil.org/programme-details", "topics": ["ANM training", "bedside nursing", "patient monitoring"], "level": "beginner", "cost_label": "Govt: INR 8,000-15,000/yr · Private: INR 30,000-80,000/yr"},
        {"id": "inc-gnm", "title": "GNM — General Nursing & Midwifery (INC)", "url": "https://www.indiannursingcouncil.org/programme-details", "topics": ["GNM training", "bedside nursing", "ICU nursing"], "level": "intermediate", "cost_label": "Govt: INR 20,000-40,000/yr · Private: INR 60,000-1,50,000/yr"},
        {"id": "bsc-nursing", "title": "B.Sc. Nursing — 4-year graduate degree (INC accredited)", "url": "https://www.indiannursingcouncil.org/programme-details", "topics": ["bedside nursing", "patient monitoring", "Indian Nursing Council"], "level": "advanced", "cost_label": "Govt: INR 30,000/yr · Private: INR 1,50,000-3,00,000/yr"},
        {"id": "msc-nursing", "title": "M.Sc. Nursing — Specialisation (INC accredited)", "url": "https://www.indiannursingcouncil.org/programme-details", "topics": ["ICU nursing", "shift handover", "bedside nursing"], "level": "advanced", "cost_label": "Govt: INR 40,000/yr · Private: INR 2,00,000-5,00,000/yr"},
        {"id": "asha-cert", "title": "ASHA Worker Certification — NHSRC", "url": "https://nhsrcindia.org/asha", "topics": ["bedside nursing", "patient monitoring", "community health"], "level": "beginner", "cost_label": "Free + honorarium-paid (NHM)"},
        {"id": "icu-fellowship-aiims", "title": "ICU Nursing Fellowship — AIIMS", "url": "https://www.aiims.edu/", "topics": ["ICU nursing", "patient monitoring", "vital signs documentation"], "level": "advanced", "cost_label": "Stipend-paid 1-2 yr"},
        {"id": "neonatal-nursing-cert", "title": "Neonatal & Pediatric Nursing — IGNOU + INC", "url": "https://ignou.ac.in/", "topics": ["bedside nursing", "patient monitoring", "neonatal"], "level": "intermediate", "cost_label": "INR 12,000-25,000"},
    ],
}

TOOLS_NURSE = {
    "slug": "nurse-clinical-tools",
    "name": "Tools for Nurses (free clinical reference + EMR)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://nhm.gov.in/",
    "free": True,
    "free_note": "All free for clinical use.",
    "default_professions": [["nurse", 0.85]],
    "url_patterns": [],
    "manifest": [
        {"id": "asha-suvidha-app", "title": "ASHA Suvidha App — work tracking + payments (NHM)", "url": "https://nhm.gov.in/", "topics": ["ASHA", "bedside care", "community health"], "duration_min": None, "level": None},
        {"id": "anm-online", "title": "ANM Online — IT-enabled ANM workflow (Health Ministry)", "url": "https://anmol.nhp.gov.in/", "topics": ["ANM training", "bedside nursing", "patient monitoring"], "duration_min": None, "level": None},
        {"id": "nhp-india", "title": "National Health Portal of India (MOHFW)", "url": "https://www.nhp.gov.in/", "topics": ["bedside nursing", "patient monitoring", "vital signs documentation"], "duration_min": None, "level": None},
        {"id": "rch-portal", "title": "RCH Portal — Reproductive & Child Health (Mother & Child Tracking)", "url": "https://rch.nhm.gov.in/", "topics": ["bedside nursing", "patient monitoring"], "duration_min": None, "level": None},
        {"id": "epi-info-cdc", "title": "Epi Info — CDC public health analytics for nurses", "url": "https://www.cdc.gov/epiinfo/", "topics": ["bedside nursing", "patient monitoring"], "duration_min": None, "level": None},
        {"id": "drug-info-app", "title": "WHO Drug Information — global drug reference", "url": "https://www.who.int/teams/regulation-prequalification/regulation-and-safety/pharmacovigilance", "topics": ["medication administration", "bedside care"], "duration_min": None, "level": None},
    ],
}

CERTS_FARMER = {
    "slug": "farmer-india-certs",
    "name": "Farmer Training & Certifications (KVK + ICAR + State Agri)",
    "official_domain": "icar.org.in",
    "type": "static_manifest",
    "url": "https://icar.org.in/",
    "free": True,
    "free_note": "All KVK + ICAR + state govt programs are free for farmers.",
    "default_professions": [["farmer", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "kvk-training", "title": "KVK Farmer Training Programs (ICAR — 731 KVKs)", "url": "https://kvk.icar.gov.in/", "topics": ["precision agriculture", "agritech", "soil health"], "level": "beginner", "cost_label": "Free"},
        {"id": "icar-online", "title": "ICAR Online Farmer Education (Krishi Vigyan Kendra MOOC)", "url": "https://farmer.gov.in/", "topics": ["precision agriculture", "agritech"], "level": "beginner", "cost_label": "Free"},
        {"id": "manage-hyderabad", "title": "MANAGE Hyderabad — Agri Extension Management Training", "url": "https://www.manage.gov.in/", "topics": ["precision agriculture", "agritech"], "level": "intermediate", "cost_label": "Free for farmer cohorts"},
        {"id": "pm-fme-training", "title": "PM-FME Food Processing Skill Training", "url": "https://pmfme.mofpi.gov.in/", "topics": ["agritech", "precision agriculture"], "level": "beginner", "cost_label": "Free + 35% subsidy on enterprise"},
        {"id": "nabard-akrsp", "title": "NABARD Farmer Producer Org (FPO) Training", "url": "https://www.nabard.org/", "topics": ["precision agriculture", "agritech"], "level": "intermediate", "cost_label": "Free for FPO members"},
        {"id": "atari-training", "title": "ATARI Zonal Farmer Training (ICAR)", "url": "https://icar.org.in/atari", "topics": ["precision agriculture", "soil health", "agritech"], "level": "beginner", "cost_label": "Free"},
        {"id": "soil-health-card", "title": "Soil Health Card Training (DAC&FW)", "url": "https://www.soilhealth.dac.gov.in/", "topics": ["soil health", "precision agriculture"], "level": "beginner", "cost_label": "Free"},
    ],
}

TOOLS_FARMER = {
    "slug": "farmer-india-tools",
    "name": "Farmer Tools — apps, mandi prices, soil, weather, schemes",
    "official_domain": "various-gov.in",
    "type": "static_manifest",
    "url": "https://mkisan.gov.in/",
    "free": True,
    "free_note": "All government farmer apps are free.",
    "default_professions": [["farmer", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "mkisan-portal", "title": "mKisan Portal — SMS advisories from Krishi Vigyan Kendras", "url": "https://mkisan.gov.in/", "topics": ["precision agriculture", "agritech"], "duration_min": None, "level": None},
        {"id": "kisan-suvidha", "title": "Kisan Suvidha App — weather, market price, dealer info", "url": "https://play.google.com/store/apps/details?id=in.gov.kisansuvidha", "topics": ["precision agriculture", "agritech", "mandi"], "duration_min": None, "level": None},
        {"id": "agmarknet", "title": "AGMARKNET — daily mandi prices across India", "url": "https://agmarknet.gov.in/", "topics": ["mandi", "precision agriculture"], "duration_min": None, "level": None},
        {"id": "enam-portal", "title": "e-NAM — National Agriculture Market online trading", "url": "https://www.enam.gov.in/", "topics": ["mandi", "agritech"], "duration_min": None, "level": None},
        {"id": "soilhealth-card-portal", "title": "Soil Health Card Portal — free soil test for farmers", "url": "https://www.soilhealth.dac.gov.in/", "topics": ["soil health", "precision agriculture"], "duration_min": None, "level": None},
        {"id": "pmksy-portal", "title": "PMKSY — Pradhan Mantri Krishi Sinchayee Yojana (irrigation)", "url": "https://pmksy.gov.in/", "topics": ["precision agriculture", "agritech"], "duration_min": None, "level": None},
        {"id": "kisan-rath", "title": "Kisan Rath — transport-aggregator for farm produce", "url": "https://play.google.com/store/apps/details?id=in.gov.kisanrath", "topics": ["mandi", "agritech"], "duration_min": None, "level": None},
        {"id": "imd-meghdoot", "title": "Meghdoot — IMD agro-weather advisory app", "url": "https://play.google.com/store/apps/details?id=com.meghdoot", "topics": ["precision agriculture", "weather"], "duration_min": None, "level": None},
    ],
}

CERTS_TEACHER = {
    "slug": "teacher-india-certs",
    "name": "Teacher Certifications & Training (NCTE + NCERT + DIKSHA)",
    "official_domain": "ncte.gov.in",
    "type": "static_manifest",
    "url": "https://ncte.gov.in/",
    "free": True,
    "free_note": "Most government teacher training is free or stipend-paid.",
    "default_professions": [["teacher", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "ctet-cbse", "title": "CTET — Central Teacher Eligibility Test (CBSE)", "url": "https://ctet.nic.in/", "topics": ["lesson-plan", "NEP-2020", "DIKSHA"], "level": "beginner", "cost_label": "INR 1,000-1,200 per paper"},
        {"id": "tet-state", "title": "State TET — State Teacher Eligibility Tests (all 28 states)", "url": "https://ncte.gov.in/", "topics": ["lesson-plan", "NEP-2020"], "level": "beginner", "cost_label": "INR 500-1,200 per state"},
        {"id": "diksha-training", "title": "DIKSHA — NCERT Teacher Training MOOC", "url": "https://diksha.gov.in/", "topics": ["DIKSHA", "lesson-plan", "NEP-2020"], "level": "intermediate", "cost_label": "Free"},
        {"id": "nishtha-training", "title": "NISHTHA — National Initiative for School Heads & Teachers (NCERT)", "url": "https://itpd.ncert.gov.in/", "topics": ["NEP-2020", "DIKSHA", "lesson-plan"], "level": "intermediate", "cost_label": "Free"},
        {"id": "bed-degree", "title": "B.Ed. — Bachelor of Education (NCTE accredited)", "url": "https://ncte.gov.in/", "topics": ["lesson-plan", "NEP-2020"], "level": "advanced", "cost_label": "Govt: INR 8,000-30,000/yr · Private: INR 40,000-1,50,000/yr"},
        {"id": "med-degree", "title": "M.Ed. — Master of Education (NCTE accredited)", "url": "https://ncte.gov.in/", "topics": ["lesson-plan", "NEP-2020"], "level": "advanced", "cost_label": "Govt: INR 12,000-40,000/yr · Private: INR 60,000-2,00,000/yr"},
        {"id": "ncert-pibm", "title": "NCERT Pedagogical Innovation & Best Methods Training", "url": "https://ncert.nic.in/", "topics": ["lesson-plan", "NEP-2020"], "level": "intermediate", "cost_label": "Free"},
        {"id": "tiss-eduleaders", "title": "TISS Education Leadership Program", "url": "https://www.tiss.edu/", "topics": ["NEP-2020", "lesson-plan"], "level": "advanced", "cost_label": "INR 50,000-1,50,000"},
    ],
}

TOOLS_TEACHER = {
    "slug": "teacher-india-tools",
    "name": "Teacher Tools — lesson planners, MOOC platforms, classroom AI",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://diksha.gov.in/",
    "free": True,
    "free_note": "All government tools free; international platforms mostly freemium.",
    "default_professions": [["teacher", 0.85], ["student", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "diksha-app", "title": "DIKSHA App — NCERT digital learning for teachers + students", "url": "https://diksha.gov.in/", "topics": ["DIKSHA", "lesson-plan", "NEP-2020"], "duration_min": None, "level": None},
        {"id": "epathshala", "title": "ePathshala — NCERT textbook + content app", "url": "https://epathshala.nic.in/", "topics": ["lesson-plan", "NEP-2020"], "duration_min": None, "level": None},
        {"id": "swayam", "title": "SWAYAM — Government of India MOOC platform", "url": "https://swayam.gov.in/", "topics": ["lesson-plan", "NEP-2020"], "duration_min": None, "level": None},
        {"id": "khan-academy-india", "title": "Khan Academy India — free K-12 + competitive prep", "url": "https://www.khanacademy.org/", "topics": ["lesson-plan", "NEP-2020"], "duration_min": None, "level": None},
        {"id": "google-classroom", "title": "Google Classroom — free classroom management", "url": "https://classroom.google.com/", "topics": ["lesson-plan"], "duration_min": None, "level": None},
        {"id": "khan-academy-kids", "title": "Khan Academy Kids — free PreK-Grade 5 app", "url": "https://learn.khanacademy.org/khan-academy-kids/", "topics": ["lesson-plan"], "duration_min": None, "level": None},
        {"id": "byjus-think-and-learn", "title": "BYJU'S Think and Learn (free tier)", "url": "https://byjus.com/", "topics": ["lesson-plan"], "duration_min": None, "level": None},
        {"id": "magicschool-ai", "title": "MagicSchool.ai — AI lesson planner + rubric generator (free tier)", "url": "https://www.magicschool.ai/", "topics": ["lesson-plan", "AI", "NEP-2020"], "duration_min": None, "level": None},
    ],
}

CERTS_LAWYER = {
    "slug": "lawyer-india-certs",
    "name": "Lawyer Certifications & Bar (BCI + Universities)",
    "official_domain": "barcouncilofindia.org",
    "type": "static_manifest",
    "url": "http://www.barcouncilofindia.org/",
    "free": False,
    "free_note": "Bar exam mandatory; many LL.M / LL.B programs are govt-subsidised.",
    "default_professions": [["lawyer", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "bci-aibe", "title": "AIBE — All India Bar Examination (BCI)", "url": "https://www.allindiabarexamination.com/", "topics": ["bns", "bnss", "case-law"], "level": "beginner", "cost_label": "INR 3,500-3,950 + INR 15,000 enrollment"},
        {"id": "nlu-llm", "title": "LL.M. at National Law Universities (NLU consortium)", "url": "https://consortiumofnlus.ac.in/", "topics": ["case-law", "bns", "bnss"], "level": "advanced", "cost_label": "INR 1,80,000-3,50,000/yr depending on NLU"},
        {"id": "isb-corporate-law", "title": "Corporate Law Certificate — ISB / NLSIU", "url": "https://www.isb.edu/", "topics": ["case-law", "Companies Act"], "level": "intermediate", "cost_label": "INR 50,000-2,00,000"},
        {"id": "clat-pg", "title": "CLAT-PG — Common Law Admission Test (postgraduate)", "url": "https://consortiumofnlus.ac.in/", "topics": ["case-law", "bns", "bnss"], "level": "intermediate", "cost_label": "INR 4,000"},
        {"id": "iiitb-cyberlaw", "title": "Cyber Law Certificate — IIIT-Bangalore + NLU-Delhi", "url": "https://www.iiitb.ac.in/", "topics": ["DPDP", "case-law"], "level": "intermediate", "cost_label": "INR 30,000-80,000"},
        {"id": "ialm-llm-online", "title": "IALM Online LL.M (Indian + International Law)", "url": "https://ialm.academy/", "topics": ["case-law", "bns", "bnss"], "level": "advanced", "cost_label": "INR 1,50,000-3,00,000"},
        {"id": "bci-aor", "title": "AOR — Advocate-on-Record Exam (Supreme Court of India)", "url": "https://www.sci.gov.in/", "topics": ["case-law", "bns", "bnss"], "level": "advanced", "cost_label": "INR 2,500 + apprenticeship requirement"},
    ],
}

TOOLS_LAWYER = {
    "slug": "lawyer-india-tools",
    "name": "Lawyer Tools — case law search, drafting, e-filing, AI legal",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://indiankanoon.org/",
    "free": True,
    "free_note": "Major case-law databases are free; AI tools mostly freemium.",
    "default_professions": [["lawyer", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "indiankanoon", "title": "Indian Kanoon — free India-wide case-law search", "url": "https://indiankanoon.org/", "topics": ["case-law", "bns", "bnss"], "duration_min": None, "level": None},
        {"id": "ecourts-india", "title": "eCourts India — case status, judgments, e-filing", "url": "https://ecourts.gov.in/", "topics": ["case-law", "bnss"], "duration_min": None, "level": None},
        {"id": "manupatra", "title": "Manupatra — premium India case-law + commentary", "url": "https://www.manupatra.com/", "topics": ["case-law", "bns"], "duration_min": None, "level": None},
        {"id": "scc-online", "title": "SCC Online — Supreme Court Cases premium database", "url": "https://www.scconline.com/", "topics": ["case-law", "bns"], "duration_min": None, "level": None},
        {"id": "sci-gov", "title": "Supreme Court of India — official portal + judgments", "url": "https://main.sci.gov.in/", "topics": ["case-law", "bns", "bnss"], "duration_min": None, "level": None},
        {"id": "lawmaker-india", "title": "Lawmaker.ai — Indian AI legal drafting assistant", "url": "https://lawmaker.ai/", "topics": ["case-law", "AI"], "duration_min": None, "level": None},
        {"id": "spotdraft", "title": "SpotDraft — AI contract management (Indian SaaS)", "url": "https://www.spotdraft.com/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "harvey-ai", "title": "Harvey AI — generative AI for legal professionals", "url": "https://www.harvey.ai/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
    ],
}

CERTS_GOV_EMP = {
    "slug": "gov-employee-certs",
    "name": "Government Employee Training (iGOT Karmayogi + NIRD + LBSNAA)",
    "official_domain": "igotkarmayogi.gov.in",
    "type": "static_manifest",
    "url": "https://igotkarmayogi.gov.in/",
    "free": True,
    "free_note": "All government training is free for government employees.",
    "default_professions": [["government-employee", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "igot-karmayogi", "title": "iGOT Karmayogi — National Capacity Building Programme", "url": "https://igotkarmayogi.gov.in/", "topics": ["karmayogi", "igot"], "level": "beginner", "cost_label": "Free for all govt employees"},
        {"id": "lbsnaa-foundation", "title": "LBSNAA Foundation Course (IAS/IPS/IFS)", "url": "https://www.lbsnaa.gov.in/", "topics": ["karmayogi", "igot"], "level": "advanced", "cost_label": "Free + stipend-paid for trainees"},
        {"id": "nird-pri-training", "title": "NIRD&PRI — Rural Development training", "url": "https://nirdpr.org.in/", "topics": ["karmayogi", "igot"], "level": "intermediate", "cost_label": "Free for govt employees"},
        {"id": "yashada-pune", "title": "YASHADA Pune — Maharashtra govt admin training", "url": "https://yashada.org/", "topics": ["karmayogi"], "level": "intermediate", "cost_label": "Free for govt employees"},
        {"id": "isb-govt-mooc", "title": "ISB Public Policy MOOCs — for govt officers", "url": "https://www.isb.edu/en/study-isb/short-courses/digital-learning/public-policy.html", "topics": ["karmayogi"], "level": "intermediate", "cost_label": "INR 30,000-80,000"},
        {"id": "iim-ahmedabad-govt", "title": "IIM-Ahmedabad Public Systems Group programs", "url": "https://www.iima.ac.in/", "topics": ["karmayogi"], "level": "advanced", "cost_label": "INR 1,50,000-5,00,000 (subsidised seats for govt)"},
        {"id": "diit-cybersec-gov", "title": "Cybersecurity for Govt Officers — DGT + DRDO", "url": "https://www.dgt.gov.in/", "topics": ["karmayogi", "cybersecurity"], "level": "intermediate", "cost_label": "Free for govt employees"},
    ],
}

TOOLS_GOV_EMP = {
    "slug": "gov-employee-tools",
    "name": "Government Employee Tools — eOffice, GeM, PFMS, iGOT",
    "official_domain": "various-gov.in",
    "type": "static_manifest",
    "url": "https://eoffice.gov.in/",
    "free": True,
    "free_note": "All free for government employees.",
    "default_professions": [["government-employee", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "eoffice-india", "title": "eOffice — NIC digital file/workflow for govt", "url": "https://eoffice.gov.in/", "topics": ["karmayogi", "igot"], "duration_min": None, "level": None},
        {"id": "gem-portal", "title": "GeM — Government e-Marketplace for procurement", "url": "https://gem.gov.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "pfms-portal", "title": "PFMS — Public Financial Management System", "url": "https://pfms.nic.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "digilocker-gov", "title": "DigiLocker — govt document verification", "url": "https://www.digilocker.gov.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "umang-app", "title": "UMANG — Unified Mobile App for govt services", "url": "https://web.umang.gov.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "mygov-portal", "title": "MyGov — citizen engagement platform for govt employees", "url": "https://www.mygov.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "rti-online", "title": "RTI Online — Right to Information filing portal", "url": "https://rtionline.gov.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
    ],
}

CERTS_ACCOUNTANT = {
    "slug": "accountant-india-certs",
    "name": "CA / CMA / CS Certifications (India)",
    "official_domain": "icai.org",
    "type": "static_manifest",
    "url": "https://www.icai.org/",
    "free": False,
    "free_note": "Tuition free; exam fees only.",
    "default_professions": [["accountant", 0.95], ["business-owner", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "icai-ca-foundation", "title": "CA Foundation — ICAI", "url": "https://www.icai.org/post/ca-course-foundation", "topics": ["icai", "gst", "tds", "itr"], "level": "beginner", "cost_label": "INR 11,300"},
        {"id": "icai-ca-inter", "title": "CA Intermediate — ICAI", "url": "https://www.icai.org/post/ca-course-intermediate", "topics": ["icai", "gst", "tds"], "level": "intermediate", "cost_label": "INR 27,200"},
        {"id": "icai-ca-final", "title": "CA Final — ICAI", "url": "https://www.icai.org/post/ca-course-final", "topics": ["icai", "gst", "tds", "itr"], "level": "advanced", "cost_label": "INR 39,800"},
        {"id": "icmai-cma", "title": "CMA — Cost & Management Accountant (ICMAI)", "url": "https://icmai.in/", "topics": ["icai", "gst", "tds"], "level": "advanced", "cost_label": "INR 4,000-22,000 per stage"},
        {"id": "icsi-cs", "title": "Company Secretary (CS) — ICSI", "url": "https://www.icsi.edu/", "topics": ["icai", "gst", "tds"], "level": "advanced", "cost_label": "INR 4,500-12,000 per stage"},
        {"id": "fpsb-cfp", "title": "CFP — Certified Financial Planner (FPSB India)", "url": "https://fpsb.in/", "topics": ["icai", "tds", "itr"], "level": "intermediate", "cost_label": "INR 35,000-1,00,000"},
        {"id": "iit-fintech", "title": "Fintech & Financial Modelling — IIT-Roorkee online", "url": "https://www.iitr.ac.in/", "topics": ["power-bi", "icai"], "level": "intermediate", "cost_label": "INR 30,000-80,000"},
    ],
}

TOOLS_ACCOUNTANT = {
    "slug": "accountant-india-tools",
    "name": "Accountant Tools — Tally, Zoho, Quickbooks, GST e-filing",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.gst.gov.in/",
    "free": True,
    "free_note": "Government e-filing portals free; commercial tools have free trials.",
    "default_professions": [["accountant", 0.85], ["business-owner", 0.45]],
    "url_patterns": [],
    "manifest": [
        {"id": "gst-portal", "title": "GST Portal — official GSTR filing", "url": "https://www.gst.gov.in/", "topics": ["gst", "icai"], "duration_min": None, "level": None},
        {"id": "incometax-portal", "title": "Income Tax e-Filing Portal — ITR / TDS", "url": "https://www.incometax.gov.in/", "topics": ["itr", "tds"], "duration_min": None, "level": None},
        {"id": "tally-erp", "title": "Tally Prime — India's #1 SME accounting software", "url": "https://tallysolutions.com/", "topics": ["icai", "gst"], "duration_min": None, "level": None},
        {"id": "zoho-books", "title": "Zoho Books — cloud accounting (free for <1.5 Cr turnover)", "url": "https://www.zoho.com/in/books/", "topics": ["icai", "gst"], "duration_min": None, "level": None},
        {"id": "quickbooks-india", "title": "QuickBooks India — SMB accounting", "url": "https://quickbooks.intuit.com/in/", "topics": ["icai", "gst"], "duration_min": None, "level": None},
        {"id": "clear-tax", "title": "ClearTax — GST + ITR filing automation", "url": "https://cleartax.in/", "topics": ["gst", "itr", "tds"], "duration_min": None, "level": None},
        {"id": "winman-ca-erp", "title": "Winman CA-ERP — practice management for CAs", "url": "https://www.winman.com/", "topics": ["icai", "gst", "tds", "itr"], "duration_min": None, "level": None},
        {"id": "icai-eservices", "title": "ICAI Self Service Portal — CA practice management", "url": "https://eservices.icai.org/", "topics": ["icai"], "duration_min": None, "level": None},
    ],
}

SCHEMES_FARMER = {
    "slug": "farmer-india-schemes",
    "name": "Government Schemes for Farmers (PM-KISAN, MSP, KCC, PMFBY)",
    "official_domain": "various-gov.in",
    "type": "static_manifest",
    "url": "https://pmkisan.gov.in/",
    "free": True,
    "free_note": "All government schemes — registration free for farmers.",
    "default_professions": [["farmer", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "pm-kisan", "title": "PM-KISAN — INR 6,000/year direct benefit for farmers", "url": "https://pmkisan.gov.in/", "topics": ["precision agriculture", "scheme"], "duration_min": None, "level": None},
        {"id": "pmfby-crop-insurance", "title": "PMFBY — Pradhan Mantri Fasal Bima Yojana (crop insurance)", "url": "https://pmfby.gov.in/", "topics": ["precision agriculture", "scheme"], "duration_min": None, "level": None},
        {"id": "kisan-credit-card", "title": "Kisan Credit Card — RBI farmer credit at 4% interest", "url": "https://www.rbi.org.in/", "topics": ["precision agriculture", "scheme"], "duration_min": None, "level": None},
        {"id": "pm-kusum", "title": "PM-KUSUM — solar pumps + grid-linked solar for farmers", "url": "https://www.mnre.gov.in/", "topics": ["agritech", "scheme"], "duration_min": None, "level": None},
        {"id": "soil-health-card-scheme", "title": "Soil Health Card Scheme — free soil testing", "url": "https://www.soilhealth.dac.gov.in/", "topics": ["soil health", "precision agriculture", "scheme"], "duration_min": None, "level": None},
        {"id": "msp-procurement", "title": "MSP Procurement — Govt of India FCI/NAFED", "url": "https://fci.gov.in/", "topics": ["mandi", "scheme"], "duration_min": None, "level": None},
    ],
}

SCHEMES_TEACHER = {
    "slug": "teacher-india-schemes",
    "name": "Government Schemes for Teachers (NEP, Samagra Shiksha, PMVK)",
    "official_domain": "various-gov.in",
    "type": "static_manifest",
    "url": "https://samagra.education.gov.in/",
    "free": True,
    "free_note": "Government schemes — funded by Centre + State.",
    "default_professions": [["teacher", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "nep-2020", "title": "NEP 2020 — National Education Policy", "url": "https://www.education.gov.in/nep/about-nep", "topics": ["NEP-2020", "DIKSHA", "lesson-plan"], "duration_min": None, "level": None},
        {"id": "samagra-shiksha", "title": "Samagra Shiksha — integrated school education scheme", "url": "https://samagra.education.gov.in/", "topics": ["NEP-2020", "lesson-plan"], "duration_min": None, "level": None},
        {"id": "pm-poshan", "title": "PM POSHAN — mid-day meal + schools", "url": "https://pmposhan.education.gov.in/", "topics": ["NEP-2020"], "duration_min": None, "level": None},
        {"id": "pm-shri", "title": "PM SHRI Schools — exemplar NEP-aligned schools", "url": "https://pmshrischools.education.gov.in/", "topics": ["NEP-2020", "DIKSHA"], "duration_min": None, "level": None},
        {"id": "stars-scheme", "title": "STARS — Strengthening Teaching-Learning & Results (World Bank + GoI)", "url": "https://www.education.gov.in/", "topics": ["NEP-2020", "DIKSHA"], "duration_min": None, "level": None},
        {"id": "nipun-bharat", "title": "NIPUN Bharat — National Initiative for Proficiency in Reading", "url": "https://nipunbharat.education.gov.in/", "topics": ["NEP-2020", "lesson-plan"], "duration_min": None, "level": None},
    ],
}

SCHEMES_NURSE = {
    "slug": "nurse-india-schemes",
    "name": "Government Schemes for Nurses (ASHA, NHM, PMSSY)",
    "official_domain": "nhm.gov.in",
    "type": "static_manifest",
    "url": "https://nhm.gov.in/",
    "free": True,
    "free_note": "Government schemes — open enrollment.",
    "default_professions": [["nurse", 0.85]],
    "url_patterns": [],
    "manifest": [
        {"id": "nhm-asha", "title": "ASHA Scheme — Accredited Social Health Activist (NHM)", "url": "https://nhm.gov.in/index1.php?lang=1&level=1&sublinkid=150&lid=226", "topics": ["ASHA", "bedside nursing"], "duration_min": None, "level": None},
        {"id": "pmssy", "title": "PMSSY — Pradhan Mantri Swasthya Suraksha Yojana", "url": "https://pmssy-mohfw.nic.in/", "topics": ["bedside nursing", "patient monitoring"], "duration_min": None, "level": None},
        {"id": "ab-pmjay-nurses", "title": "Ayushman Bharat — PMJAY (nurses as care providers)", "url": "https://pmjay.gov.in/", "topics": ["bedside nursing", "patient monitoring"], "duration_min": None, "level": None},
        {"id": "nhm-incentives", "title": "NHM Performance Incentives for Nurses", "url": "https://nhm.gov.in/", "topics": ["bedside nursing"], "duration_min": None, "level": None},
        {"id": "anm-suvidha-scheme", "title": "ANMOL — ANM Online Tracking (NHM)", "url": "https://anmol.nhp.gov.in/", "topics": ["ANM training", "bedside nursing"], "duration_min": None, "level": None},
    ],
}

SCHEMES_GOV_EMP = {
    "slug": "gov-employee-schemes",
    "name": "Schemes for Government Employees (NPS, CGHS, GPF, LTC)",
    "official_domain": "various-gov.in",
    "type": "static_manifest",
    "url": "https://npscra.nsdl.co.in/",
    "free": True,
    "free_note": "All free for govt employees.",
    "default_professions": [["government-employee", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "nps-pfrda", "title": "NPS — National Pension System for Central Govt employees", "url": "https://npscra.nsdl.co.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "cghs", "title": "CGHS — Central Government Health Scheme", "url": "https://cghs.gov.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "gpf-scheme", "title": "GPF — General Provident Fund (govt employees)", "url": "https://cga.nic.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "ltc-scheme", "title": "LTC — Leave Travel Concession (govt employees)", "url": "https://doptcirculars.nic.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "cea-children", "title": "CEA — Children Education Allowance (govt employees)", "url": "https://doptcirculars.nic.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "house-building-advance", "title": "HBA — House Building Advance for govt employees", "url": "https://mohua.gov.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
    ],
}

SCHEMES_BIZ_OWNER = {
    "slug": "biz-owner-msme-schemes",
    "name": "MSME / Startup Schemes for Business Owners (Mudra, Udyam, CGTMSE, ECLGS)",
    "official_domain": "various-gov.in",
    "type": "static_manifest",
    "url": "https://msme.gov.in/",
    "free": True,
    "free_note": "All government schemes; registration free.",
    "default_professions": [["business-owner", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "pmmy-mudra", "title": "PMMY — Pradhan Mantri Mudra Yojana (loans up to INR 20L)", "url": "https://www.mudra.org.in/", "topics": ["msme", "udyam"], "duration_min": None, "level": None},
        {"id": "udyam-registration", "title": "Udyam Registration — MSME identification + benefits", "url": "https://udyamregistration.gov.in/", "topics": ["udyam", "msme"], "duration_min": None, "level": None},
        {"id": "cgtmse", "title": "CGTMSE — Credit Guarantee Fund for Micro & Small Enterprises", "url": "https://www.cgtmse.in/", "topics": ["msme"], "duration_min": None, "level": None},
        {"id": "startup-india", "title": "Startup India — DPIIT recognition + tax + funding", "url": "https://www.startupindia.gov.in/", "topics": ["msme", "ondc"], "duration_min": None, "level": None},
        {"id": "ondc-portal", "title": "ONDC — Open Network for Digital Commerce", "url": "https://ondc.org/", "topics": ["ondc", "msme"], "duration_min": None, "level": None},
        {"id": "gem-msme", "title": "GeM Seller Onboarding for MSMEs", "url": "https://gem.gov.in/", "topics": ["msme", "udyam"], "duration_min": None, "level": None},
        {"id": "pmegp-khadi", "title": "PMEGP — PM Employment Generation Programme (KVIC)", "url": "https://www.kviconline.gov.in/pmegpeportal/", "topics": ["msme"], "duration_min": None, "level": None},
    ],
}

SCHEMES_STUDENT = {
    "slug": "student-india-schemes",
    "name": "Student Schemes (NSP scholarships, PM-YASASVI, INSPIRE)",
    "official_domain": "scholarships.gov.in",
    "type": "static_manifest",
    "url": "https://scholarships.gov.in/",
    "free": True,
    "free_note": "All scholarships free to apply.",
    "default_professions": [["student", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "nsp-pre-matric", "title": "NSP — National Scholarship Portal (Pre-Matric)", "url": "https://scholarships.gov.in/", "topics": ["scheme"], "duration_min": None, "level": None},
        {"id": "nsp-post-matric", "title": "NSP — National Scholarship Portal (Post-Matric)", "url": "https://scholarships.gov.in/", "topics": ["scheme"], "duration_min": None, "level": None},
        {"id": "pm-yasasvi", "title": "PM-YASASVI — OBC/EBC/DNT scholarship", "url": "https://yet.nta.ac.in/", "topics": ["scheme"], "duration_min": None, "level": None},
        {"id": "inspire-scholarship", "title": "INSPIRE Scholarship — DST science students", "url": "https://online-inspire.gov.in/", "topics": ["scheme"], "duration_min": None, "level": None},
        {"id": "vidya-lakshmi-edu-loan", "title": "Vidya Lakshmi Portal — education loan single window", "url": "https://www.vidyalakshmi.co.in/Students/", "topics": ["scheme"], "duration_min": None, "level": None},
        {"id": "pmkvy-students", "title": "PMKVY 4.0 — Pradhan Mantri Kaushal Vikas Yojana (skill training)", "url": "https://www.pmkvyofficial.org/", "topics": ["scheme"], "duration_min": None, "level": None},
    ],
}

SCHEMES_DOCTOR = {
    "slug": "doctor-india-schemes",
    "name": "Government Schemes — Doctors (AB-PMJAY, NMC, NEXT)",
    "official_domain": "pmjay.gov.in",
    "type": "static_manifest",
    "url": "https://pmjay.gov.in/",
    "free": True,
    "free_note": "Govt schemes — open enrollment for empanelled doctors.",
    "default_professions": [["doctor", 0.85], ["oncologist", 0.75]],
    "url_patterns": [],
    "manifest": [
        {"id": "ab-pmjay-empanel", "title": "Ayushman Bharat PMJAY — empanel as care provider", "url": "https://pmjay.gov.in/", "topics": ["clinical decision support", "EHR"], "duration_min": None, "level": None},
        {"id": "nmc-portal", "title": "NMC — National Medical Commission registration", "url": "https://www.nmc.org.in/", "topics": ["clinical", "MBBS"], "duration_min": None, "level": None},
        {"id": "abdm-hpr-doctor", "title": "ABDM HPR — Healthcare Professionals Registry", "url": "https://hpr.abdm.gov.in/", "topics": ["EHR", "ABDM"], "duration_min": None, "level": None},
        {"id": "esic-empanel", "title": "ESIC Empanelment for private practitioners", "url": "https://www.esic.gov.in/", "topics": ["clinical"], "duration_min": None, "level": None},
        {"id": "cghs-empanel", "title": "CGHS Empanelment — Central Govt Health Service providers", "url": "https://cghs.gov.in/", "topics": ["clinical"], "duration_min": None, "level": None},
    ],
}

SCHEMES_LAWYER = {
    "slug": "lawyer-india-schemes",
    "name": "Legal Aid Schemes & Legal Profession Welfare",
    "official_domain": "nalsa.gov.in",
    "type": "static_manifest",
    "url": "https://nalsa.gov.in/",
    "free": True,
    "free_note": "Govt schemes for lawyers + free legal aid network.",
    "default_professions": [["lawyer", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "nalsa-empanel", "title": "NALSA — National Legal Services Authority empanelment", "url": "https://nalsa.gov.in/", "topics": ["case-law"], "duration_min": None, "level": None},
        {"id": "bci-welfare", "title": "Advocates' Welfare Fund (BCI + states)", "url": "http://www.barcouncilofindia.org/", "topics": ["case-law"], "duration_min": None, "level": None},
        {"id": "tele-law-doj", "title": "Tele-Law — DoJ + NALSA lawyer-on-line for citizens", "url": "https://www.tele-law.in/", "topics": ["case-law"], "duration_min": None, "level": None},
        {"id": "nyaya-bandhu", "title": "Nyaya Bandhu — Pro-bono lawyer registration (DoJ)", "url": "https://nyayabandhu.gov.in/", "topics": ["case-law"], "duration_min": None, "level": None},
        {"id": "lok-adalat-empanel", "title": "Lok Adalat Empanelment (state legal services)", "url": "https://nalsa.gov.in/lok-adalat", "topics": ["case-law"], "duration_min": None, "level": None},
    ],
}

# Tools for accountant-already-covered slot is shared above as TOOLS_ACCOUNTANT.

# Job manifests for the broken-jobs professions
JOBS_HEALTHCARE = {
    "slug": "healthcare-india-jobs",
    "name": "Healthcare Jobs — Doctor / Nurse / Oncology / Allied",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.naukri.com/healthcare-jobs",
    "free": True,
    "free_note": "Public job board listings; free to view, free to apply.",
    "default_professions": [["doctor", 0.6], ["nurse", 0.7], ["oncologist", 0.55]],
    "url_patterns": [],
    "manifest": [
        {"id": "aiims-jobs", "title": "AIIMS Faculty & Doctor Recruitment", "url": "https://www.aiims.edu/", "topics": ["clinical", "patient triage"], "duration_min": None, "level": None},
        {"id": "esic-recruitment", "title": "ESIC Hospital Recruitment (Doctors + Nurses)", "url": "https://www.esic.gov.in/recruitments", "topics": ["clinical", "bedside nursing"], "duration_min": None, "level": None},
        {"id": "tata-memorial-jobs", "title": "Tata Memorial Centre Recruitment (Oncology)", "url": "https://tmc.gov.in/", "topics": ["oncology", "tata memorial"], "duration_min": None, "level": None},
        {"id": "fortis-careers", "title": "Fortis Healthcare Careers", "url": "https://www.fortishealthcare.com/india/careers", "topics": ["clinical", "bedside nursing"], "duration_min": None, "level": None},
        {"id": "apollo-careers", "title": "Apollo Hospitals Careers", "url": "https://www.apollohospitals.com/careers/", "topics": ["clinical", "bedside nursing"], "duration_min": None, "level": None},
        {"id": "uppsc-medical-officer", "title": "UPPSC Medical Officer Recruitment", "url": "https://uppsc.up.nic.in/", "topics": ["clinical"], "duration_min": None, "level": None},
        {"id": "national-health-mission-jobs", "title": "National Health Mission — state-wise recruitment", "url": "https://nhm.gov.in/", "topics": ["bedside nursing", "ANM training", "GNM training"], "duration_min": None, "level": None},
    ],
}

JOBS_TEACHER = {
    "slug": "teacher-india-jobs",
    "name": "Teaching Jobs — Govt + Private (KVS, NVS, CBSE, ICSE, State)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.kvsangathan.nic.in/",
    "free": True,
    "free_note": "Free to apply; some exam fees.",
    "default_professions": [["teacher", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "kvs-recruitment", "title": "KVS — Kendriya Vidyalaya Sangathan Recruitment", "url": "https://www.kvsangathan.nic.in/", "topics": ["lesson-plan", "NEP-2020"], "duration_min": None, "level": None},
        {"id": "nvs-recruitment", "title": "NVS — Navodaya Vidyalaya Samiti Recruitment", "url": "https://navodaya.gov.in/", "topics": ["lesson-plan", "NEP-2020"], "duration_min": None, "level": None},
        {"id": "ssc-teacher", "title": "SSC Teaching Recruitment (TGT/PGT)", "url": "https://ssc.nic.in/", "topics": ["lesson-plan"], "duration_min": None, "level": None},
        {"id": "ugc-net", "title": "UGC NET — Assistant Professor + JRF eligibility", "url": "https://www.nta.ac.in/", "topics": ["NEP-2020"], "duration_min": None, "level": None},
        {"id": "state-tet-recruitment", "title": "State Govt Teacher Recruitment (28 states)", "url": "https://ncte.gov.in/", "topics": ["lesson-plan"], "duration_min": None, "level": None},
        {"id": "delhi-dsssb", "title": "DSSSB Delhi Teacher Recruitment", "url": "https://dsssb.delhi.gov.in/", "topics": ["lesson-plan"], "duration_min": None, "level": None},
    ],
}

JOBS_LAWYER = {
    "slug": "lawyer-india-jobs",
    "name": "Legal Jobs — Law Firms, Govt, In-house Counsel",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.legallyindia.com/jobs",
    "free": True,
    "free_note": "Free to browse + apply.",
    "default_professions": [["lawyer", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "supreme-court-jobs", "title": "Supreme Court of India — Junior Court Assistant / Clerks", "url": "https://main.sci.gov.in/", "topics": ["case-law"], "duration_min": None, "level": None},
        {"id": "high-court-jobs", "title": "High Court Recruitment (25 High Courts)", "url": "https://ecourts.gov.in/ecourts_home/", "topics": ["case-law"], "duration_min": None, "level": None},
        {"id": "upsc-judiciary", "title": "Judicial Services Examination (State PSC)", "url": "https://www.upsc.gov.in/", "topics": ["case-law", "bns"], "duration_min": None, "level": None},
        {"id": "law-firm-jobs", "title": "Legally India — Law Firm Jobs Board", "url": "https://www.legallyindia.com/jobs", "topics": ["case-law"], "duration_min": None, "level": None},
        {"id": "in-house-counsel-jobs", "title": "Live Law — In-house Counsel Jobs", "url": "https://www.livelaw.in/jobs", "topics": ["case-law"], "duration_min": None, "level": None},
        {"id": "lpo-jobs-india", "title": "LPO Jobs — Legal Process Outsourcing (Pangea3, UnitedLex, etc.)", "url": "https://www.naukri.com/lpo-jobs", "topics": ["case-law"], "duration_min": None, "level": None},
    ],
}

JOBS_GOV_EMP = {
    "slug": "gov-emp-jobs",
    "name": "Government Jobs — UPSC, SSC, RRB, State PSC, Banking",
    "official_domain": "upsc.gov.in",
    "type": "static_manifest",
    "url": "https://www.upsc.gov.in/",
    "free": True,
    "free_note": "Free to apply for most central govt exams.",
    "default_professions": [["government-employee", 0.9], ["student", 0.5]],
    "url_patterns": [],
    "manifest": [
        {"id": "upsc-cse", "title": "UPSC CSE — Civil Services Examination", "url": "https://www.upsc.gov.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "ssc-cgl", "title": "SSC CGL — Combined Graduate Level (Central Govt)", "url": "https://ssc.nic.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "ssc-chsl", "title": "SSC CHSL — Combined Higher Secondary Level", "url": "https://ssc.nic.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "rrb-ntpc", "title": "RRB NTPC — Indian Railways Recruitment", "url": "https://www.rrbcdg.gov.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "ibps-po", "title": "IBPS PO — Probationary Officer (Public Sector Banks)", "url": "https://www.ibps.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "rbi-grade-b", "title": "RBI Grade B — Reserve Bank of India officer recruitment", "url": "https://www.rbi.org.in/Scripts/bs_viewcontent.aspx?Id=2", "topics": ["karmayogi"], "duration_min": None, "level": None},
        {"id": "state-psc-jobs", "title": "State PSC Recruitment (28 state Public Service Commissions)", "url": "https://www.upsc.gov.in/", "topics": ["karmayogi"], "duration_min": None, "level": None},
    ],
}


# Plan: (stream_key, source_block)
PLAN = [
    ("cert",   CERTS_DOCTOR),
    ("cert",   CERTS_NURSE),
    ("cert",   CERTS_FARMER),
    ("cert",   CERTS_TEACHER),
    ("cert",   CERTS_LAWYER),
    ("cert",   CERTS_GOV_EMP),
    ("cert",   CERTS_ACCOUNTANT),
    ("tool",   TOOLS_DOCTOR),
    ("tool",   TOOLS_NURSE),
    ("tool",   TOOLS_FARMER),
    ("tool",   TOOLS_TEACHER),
    ("tool",   TOOLS_LAWYER),
    ("tool",   TOOLS_GOV_EMP),
    ("tool",   TOOLS_ACCOUNTANT),
    ("job",    JOBS_HEALTHCARE),
    ("job",    JOBS_TEACHER),
    ("job",    JOBS_LAWYER),
    ("job",    JOBS_GOV_EMP),
    ("scheme", SCHEMES_FARMER),
    ("scheme", SCHEMES_TEACHER),
    ("scheme", SCHEMES_NURSE),
    ("scheme", SCHEMES_GOV_EMP),
    ("scheme", SCHEMES_BIZ_OWNER),
    ("scheme", SCHEMES_STUDENT),
    ("scheme", SCHEMES_DOCTOR),
    ("scheme", SCHEMES_LAWYER),
]


def main() -> int:
    d = json.loads(TARGET.read_text(encoding="utf-8"))
    streams = d["streams"]

    added = 0
    skipped = 0
    for stream_key, block in PLAN:
        stream = streams.get(stream_key)
        if not stream:
            print(f"  ! stream missing: {stream_key}")
            continue
        sources = stream.setdefault("sources", [])
        existing_slugs = {s.get("slug") for s in sources}
        if block["slug"] in existing_slugs:
            print(f"  - skip {stream_key}/{block['slug']} (already present)")
            skipped += 1
            continue
        sources.append(block)
        items = len(block.get("manifest", []))
        print(f"  + {stream_key}/{block['slug']} ({items} items)")
        added += items

    TARGET.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n=== Added {added} new manifest items across {len(PLAN)-skipped} sources ({skipped} skipped) ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
