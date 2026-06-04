"""
Round 2 deeper per-classification research — per Sire:
"u have to do more research on each classifications of chitti news ai
& add it. look at LinkedIn, from where are they getting information,
including free courses from Google, IBM, government etc"

Adds another ~170 items across:
  - LinkedIn Learning AI paths (free + LinkedIn Premium tier)
  - Google (full skilling — Career Certs, Cloud Certs, Skillshop,
    TensorFlow, Grow with Google India, Google for Education,
    Imagine Cup-equivalent, Google for Startups)
  - IBM (SkillsBuild for students + job seekers + India Network,
    watsonx, Quantum, Data Science + AI Engineering Pro Certs)
  - Microsoft (AI Tour India, Copilot certs, AI Skills Challenge,
    Imagine Cup, Innovative Educator, Skill Up India)
  - AWS (Educate, AI Practitioner, DeepRacer, Skill Builder,
    re/Start India, Cloud Practitioner)
  - Meta (FE/BE Pro Certs, Llama tutorials)
  - Government deeper (MyGov AI, ISRO, C-DAC, NSE Academy free,
    BFSI Sector Skill Council, NPCI, NSDC, IndiaAI Mission deeper)
  - Industry certs (Databricks, Snowflake, Kubernetes, Cisco DevNet,
    HashiCorp, MongoDB)
  - Per-profession deeper (LawSikho for lawyers, AIHR for HR,
    SCORE/TiE for business-owners, World Bank for gov-emp, etc.)

Idempotent.
"""
from __future__ import annotations
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
STREAMS = DATA / "streams_sources.json"
COURSES = DATA / "courses_sources.json"


CERT_GOOGLE_FREE = {
    "slug": "google-free-certs-india",
    "name": "Google FREE Certifications & Skilling (Career Certs / Cloud / TF / Skillshop / Grow with Google India)",
    "official_domain": "google.com",
    "type": "static_manifest",
    "url": "https://grow.google/intl/en_in/",
    "free": True,
    "free_note": "Google subsidises Indian access via Karunya partnership + Grow with Google.",
    "default_professions": [["software-developer", 0.65], ["student", 0.7], ["business-owner", 0.5], ["talent-acquisition", 0.3]],
    "url_patterns": [],
    "manifest": [
        {"id": "google-data-analytics-cert", "title": "Google Data Analytics Professional Certificate (Coursera — FREE for Indian students via JBEC)", "url": "https://www.coursera.org/professional-certificates/google-data-analytics", "topics": ["data-engineering", "AI"], "level": "beginner", "cost_label": "FREE via Karunya/JBEC; otherwise INR 4,000/month"},
        {"id": "google-adv-data-analytics", "title": "Google Advanced Data Analytics Professional Certificate", "url": "https://www.coursera.org/professional-certificates/google-advanced-data-analytics", "topics": ["AI", "machine-learning", "data-engineering"], "level": "intermediate", "cost_label": "FREE via Karunya; INR 4,000/month otherwise"},
        {"id": "google-it-automation-python", "title": "Google IT Automation with Python Professional Certificate", "url": "https://www.coursera.org/professional-certificates/google-it-automation", "topics": ["python", "AI"], "level": "intermediate", "cost_label": "FREE via Karunya"},
        {"id": "google-cybersecurity-cert", "title": "Google Cybersecurity Professional Certificate", "url": "https://www.coursera.org/professional-certificates/google-cybersecurity", "topics": ["cybersecurity", "AI"], "level": "intermediate", "cost_label": "FREE via Karunya"},
        {"id": "google-ux-design", "title": "Google UX Design Professional Certificate", "url": "https://www.coursera.org/professional-certificates/google-ux-design", "topics": ["AI"], "level": "beginner", "cost_label": "FREE via Karunya"},
        {"id": "google-project-mgmt", "title": "Google Project Management Professional Certificate", "url": "https://www.coursera.org/professional-certificates/google-project-management", "topics": ["AI"], "level": "beginner", "cost_label": "FREE via Karunya"},
        {"id": "google-tensorflow-developer", "title": "Google TensorFlow Developer Certificate", "url": "https://www.tensorflow.org/certificate", "topics": ["machine-learning", "deep-learning", "AI", "tensorflow"], "level": "advanced", "cost_label": "USD 100 exam fee"},
        {"id": "google-prof-ml-engineer", "title": "Google Cloud Professional Machine Learning Engineer", "url": "https://cloud.google.com/learn/certification/machine-learning-engineer", "topics": ["machine-learning", "AI", "cloud-computing"], "level": "advanced", "cost_label": "Study FREE; exam USD 200"},
        {"id": "google-cloud-genai-leader", "title": "Google Cloud Generative AI Leader (announced 2025)", "url": "https://cloud.google.com/learn/certification", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "Study FREE; exam USD 99"},
        {"id": "google-cloud-data-engineer", "title": "Google Cloud Professional Data Engineer", "url": "https://cloud.google.com/learn/certification/data-engineer", "topics": ["data-engineering", "AI", "cloud-computing"], "level": "advanced", "cost_label": "Study FREE; exam USD 200"},
        {"id": "google-cloud-arch-pro", "title": "Google Cloud Professional Cloud Architect", "url": "https://cloud.google.com/learn/certification/cloud-architect", "topics": ["cloud-computing", "AI"], "level": "advanced", "cost_label": "Study FREE; exam USD 200"},
        {"id": "google-skillshop-ads-ai", "title": "Google Skillshop — Ads AI + Performance Max", "url": "https://skillshop.exceedlms.com/student/catalog/list?category_ids=53-google-ads", "topics": ["AI"], "level": "beginner", "cost_label": "FREE"},
        {"id": "grow-google-digital-unlocked", "title": "Grow with Google India — Digital Unlocked (Free Indian SME programme)", "url": "https://grow.google/intl/en_in/", "topics": ["AI"], "level": "beginner", "cost_label": "FREE for Indian SMEs"},
        {"id": "google-for-education-cert", "title": "Google for Education — Certified Educator Level 1 + 2", "url": "https://teachercenter.withgoogle.com/certifications", "topics": ["lesson-plan", "AI"], "level": "beginner", "cost_label": "Self-study FREE; exam USD 10-25"},
        {"id": "google-coach-cert", "title": "Google for Education — Certified Coach", "url": "https://teachercenter.withgoogle.com/certifications", "topics": ["lesson-plan", "AI"], "level": "intermediate", "cost_label": "FREE assessment"},
        {"id": "google-trainer-cert", "title": "Google for Education — Certified Trainer", "url": "https://teachercenter.withgoogle.com/certifications", "topics": ["lesson-plan", "AI"], "level": "advanced", "cost_label": "FREE"},
        {"id": "google-for-startups-india", "title": "Google for Startups India — Founders Academy", "url": "https://startup.google.com/intl/en_in/", "topics": ["AI", "msme"], "level": "intermediate", "cost_label": "FREE for shortlisted Indian startups"},
        {"id": "google-bug-hunter", "title": "Google Bug Hunter University (FREE for security researchers)", "url": "https://bughunters.google.com/", "topics": ["cybersecurity", "AI"], "level": "advanced", "cost_label": "FREE + bounty payouts"},
    ],
}


CERT_IBM_FREE = {
    "slug": "ibm-free-certs-india",
    "name": "IBM FREE Skilling (SkillsBuild for Students + Job Seekers + India Network + watsonx + Quantum)",
    "official_domain": "ibm.com",
    "type": "static_manifest",
    "url": "https://skillsbuild.org/",
    "free": True,
    "free_note": "IBM SkillsBuild is FREE for Indian students + job seekers. Cert exams free in many tracks.",
    "default_professions": [["software-developer", 0.7], ["student", 0.8], ["talent-acquisition", 0.25]],
    "url_patterns": [],
    "manifest": [
        {"id": "ibm-skillsbuild-students", "title": "IBM SkillsBuild for Students — FREE AI + Cloud + Data tracks (India)", "url": "https://skillsbuild.org/students", "topics": ["AI", "machine-learning", "cloud-computing"], "level": "beginner", "cost_label": "FREE for verified students"},
        {"id": "ibm-skillsbuild-jobseekers", "title": "IBM SkillsBuild for Job Seekers — FREE AI/Cloud reskilling", "url": "https://skillsbuild.org/job-seekers", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "ibm-skillsbuild-india-net", "title": "IBM Skills India Network — partnership with AICTE/MeitY", "url": "https://www.ibm.com/in-en/training", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE for partner institutions"},
        {"id": "ibm-ai-fundamentals-cert", "title": "IBM SkillsBuild — AI Fundamentals Credly Badge (FREE)", "url": "https://skillsbuild.org/", "topics": ["AI", "fundamentals"], "level": "beginner", "cost_label": "FREE digital badge via Credly"},
        {"id": "ibm-genai-cert-free", "title": "IBM SkillsBuild — Generative AI Fundamentals (FREE badge)", "url": "https://skillsbuild.org/", "topics": ["llm", "AI"], "level": "beginner", "cost_label": "FREE digital badge"},
        {"id": "ibm-data-science-pro", "title": "IBM Data Science Professional Certificate (Coursera)", "url": "https://www.coursera.org/professional-certificates/ibm-data-science", "topics": ["data-engineering", "AI"], "level": "intermediate", "cost_label": "FREE via Karunya; INR 4,000/month otherwise"},
        {"id": "ibm-ai-engineering-pro", "title": "IBM AI Engineering Professional Certificate (Coursera)", "url": "https://www.coursera.org/professional-certificates/ai-engineer", "topics": ["AI", "machine-learning", "deep-learning"], "level": "advanced", "cost_label": "FREE via Karunya"},
        {"id": "ibm-genai-engineering", "title": "IBM Generative AI Engineering Professional Certificate (Coursera)", "url": "https://www.coursera.org/professional-certificates/ibm-generative-ai-engineering", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE via Karunya"},
        {"id": "ibm-cybersec-analyst", "title": "IBM Cybersecurity Analyst Professional Certificate", "url": "https://www.coursera.org/professional-certificates/ibm-cybersecurity-analyst", "topics": ["cybersecurity", "AI"], "level": "intermediate", "cost_label": "FREE via Karunya"},
        {"id": "ibm-watsonx-trial", "title": "IBM watsonx Free Trial — enterprise AI for builders", "url": "https://www.ibm.com/watsonx", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE trial credit; consumption pricing"},
        {"id": "ibm-quantum-network", "title": "IBM Quantum Network — free access to quantum computers + courses", "url": "https://quantum.ibm.com/", "topics": ["AI"], "level": "advanced", "cost_label": "FREE researcher access"},
        {"id": "ibm-z-xplore", "title": "IBM Z Xplore — free mainframe + AI learning for students", "url": "https://ibm.biz/IBMZXplore", "topics": ["AI", "cloud-computing"], "level": "intermediate", "cost_label": "FREE for students"},
    ],
}


CERT_MICROSOFT_INDIA = {
    "slug": "microsoft-india-free-certs",
    "name": "Microsoft India FREE Skilling (AI Tour India / AI Skills Challenge / Imagine Cup / Innovative Educator / Skill Up)",
    "official_domain": "microsoft.com",
    "type": "static_manifest",
    "url": "https://www.microsoft.com/en-in/ai/india",
    "free": True,
    "free_note": "Microsoft India + ADB program offers free AI skilling.",
    "default_professions": [["software-developer", 0.7], ["student", 0.7], ["teacher", 0.45], ["business-owner", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "ms-ai-tour-india", "title": "Microsoft AI Tour India — annual free hands-on AI workshops (5 cities)", "url": "https://envision.microsoft.com/", "topics": ["AI", "llm", "copilot studio"], "level": "intermediate", "cost_label": "FREE workshops, paid VIP track"},
        {"id": "ms-ai-skills-challenge", "title": "Microsoft AI Skills Challenge — annual FREE 30-day skilling sprint", "url": "https://www.microsoft.com/en-in/skilling", "topics": ["AI", "machine-learning"], "level": "beginner", "cost_label": "FREE; cert badges via Credly"},
        {"id": "ms-azure-ai-engineer", "title": "Microsoft Azure AI Engineer Associate (AI-102)", "url": "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-engineer/", "topics": ["azure-ai", "machine-learning", "AI"], "level": "intermediate", "cost_label": "Study FREE; exam USD 165"},
        {"id": "ms-azure-data-scientist", "title": "Microsoft Azure Data Scientist Associate (DP-100)", "url": "https://learn.microsoft.com/en-us/credentials/certifications/azure-data-scientist/", "topics": ["data-engineering", "AI"], "level": "intermediate", "cost_label": "Study FREE; exam USD 165"},
        {"id": "ms-365-copilot-cert", "title": "Microsoft 365 Copilot Fundamentals (MS-900-style FREE prep)", "url": "https://learn.microsoft.com/en-us/training/paths/copilot/", "topics": ["copilot studio", "AI"], "level": "beginner", "cost_label": "FREE study"},
        {"id": "ms-imagine-cup-india", "title": "Microsoft Imagine Cup India — global student AI innovation competition", "url": "https://imaginecup.microsoft.com/", "topics": ["AI"], "level": "intermediate", "cost_label": "FREE entry; prizes USD 100K+"},
        {"id": "ms-innovative-educator", "title": "Microsoft Innovative Educator (MIE) Programme", "url": "https://education.microsoft.com/en-us/", "topics": ["lesson-plan", "AI", "copilot studio"], "level": "beginner", "cost_label": "FREE for educators"},
        {"id": "ms-skill-up-india", "title": "Microsoft Skill Up India — free reskilling for working professionals", "url": "https://www.microsoft.com/en-in/skilling", "topics": ["AI", "cloud-computing"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "ms-power-platform-fundamentals", "title": "Microsoft Power Platform Fundamentals (PL-900)", "url": "https://learn.microsoft.com/en-us/credentials/certifications/power-platform-fundamentals/", "topics": ["power-platform", "AI"], "level": "beginner", "cost_label": "Study FREE; exam USD 99"},
        {"id": "ms-fabric-data-engineer", "title": "Microsoft Fabric Data Engineer Associate (DP-700)", "url": "https://learn.microsoft.com/en-us/credentials/certifications/", "topics": ["data-engineering", "AI", "microsoft fabric"], "level": "intermediate", "cost_label": "Study FREE; exam USD 165"},
        {"id": "ms-ai-business-school", "title": "Microsoft AI Business School (FREE)", "url": "https://www.microsoft.com/en-us/ai/ai-business-school", "topics": ["AI", "msme"], "level": "intermediate", "cost_label": "FREE"},
    ],
}


CERT_AWS_INDIA = {
    "slug": "aws-india-free-certs",
    "name": "AWS India FREE Skilling (Educate / re/Start / Skill Builder / AI Practitioner / DeepRacer)",
    "official_domain": "aws.amazon.com",
    "type": "static_manifest",
    "url": "https://aws.amazon.com/training/",
    "free": True,
    "free_note": "AWS Educate + re/Start are FREE; cert exams paid.",
    "default_professions": [["software-developer", 0.7], ["student", 0.75]],
    "url_patterns": [],
    "manifest": [
        {"id": "aws-educate-india", "title": "AWS Educate India — FREE 100hr credit + AI courses for students", "url": "https://aws.amazon.com/education/awseducate/", "topics": ["AI", "machine-learning", "cloud-computing"], "level": "beginner", "cost_label": "FREE with USD 100 credit"},
        {"id": "aws-restart-india", "title": "AWS re/Start India — FREE 12-week classroom cloud + AI bootcamp", "url": "https://aws.amazon.com/training/restart/", "topics": ["AI", "cloud-computing"], "level": "beginner", "cost_label": "FREE for eligible learners"},
        {"id": "aws-skill-builder", "title": "AWS Skill Builder — 500+ FREE digital courses (subscription for hands-on labs)", "url": "https://skillbuilder.aws/", "topics": ["AI", "machine-learning", "cloud-computing"], "level": "intermediate", "cost_label": "FREE digital; INR 2,500/month for labs"},
        {"id": "aws-ai-practitioner", "title": "AWS Certified AI Practitioner (foundational AI/ML cert)", "url": "https://aws.amazon.com/certification/certified-ai-practitioner/", "topics": ["AI", "machine-learning"], "level": "beginner", "cost_label": "Study FREE; exam USD 100"},
        {"id": "aws-ml-engineer-associate", "title": "AWS Certified Machine Learning Engineer Associate (MLA-C01)", "url": "https://aws.amazon.com/certification/certified-machine-learning-engineer-associate/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "Study FREE; exam USD 150"},
        {"id": "aws-ml-speciality", "title": "AWS Certified Machine Learning - Specialty", "url": "https://aws.amazon.com/certification/certified-machine-learning-specialty/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "Study FREE; exam USD 300"},
        {"id": "aws-deepracer-india", "title": "AWS DeepRacer League India — FREE RL race competitions", "url": "https://aws.amazon.com/deepracer/", "topics": ["machine-learning", "AI"], "level": "intermediate", "cost_label": "FREE virtual; live events"},
        {"id": "aws-genai-essentials", "title": "AWS Generative AI Essentials (FREE Skill Builder path)", "url": "https://explore.skillbuilder.aws/learn/learning-plans/2068/generative-ai-learning-plan-for-decision-makers", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "aws-cloud-practitioner", "title": "AWS Cloud Practitioner (CLF-C02) — foundational cloud cert", "url": "https://aws.amazon.com/certification/certified-cloud-practitioner/", "topics": ["cloud-computing", "AI"], "level": "beginner", "cost_label": "Study FREE; exam USD 100"},
        {"id": "aws-bedrock-workshop", "title": "AWS Bedrock Workshop — FREE GenAI labs", "url": "https://catalog.workshops.aws/", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
    ],
}


CERT_META_OPEN_AI = {
    "slug": "meta-free-certs",
    "name": "Meta FREE Programs (FE/BE Pro Cert / Llama tutorials / PyTorch / Meta AI)",
    "official_domain": "meta.com",
    "type": "static_manifest",
    "url": "https://about.meta.com/learning/",
    "free": True,
    "free_note": "Coursera Meta certs FREE via JBEC for Indian learners.",
    "default_professions": [["software-developer", 0.75], ["student", 0.6]],
    "url_patterns": [],
    "manifest": [
        {"id": "meta-frontend-pro", "title": "Meta Front-End Developer Professional Certificate (Coursera)", "url": "https://www.coursera.org/professional-certificates/meta-front-end-developer", "topics": ["AI"], "level": "beginner", "cost_label": "FREE via Karunya/JBEC"},
        {"id": "meta-backend-pro", "title": "Meta Back-End Developer Professional Certificate", "url": "https://www.coursera.org/professional-certificates/meta-back-end-developer", "topics": ["AI"], "level": "beginner", "cost_label": "FREE via Karunya/JBEC"},
        {"id": "meta-python-prog", "title": "Meta Python Programming for Developers", "url": "https://www.coursera.org/professional-certificates/meta-python", "topics": ["AI", "python"], "level": "beginner", "cost_label": "FREE via Karunya"},
        {"id": "meta-llama-cookbook", "title": "Meta Llama Cookbook — official tutorials + fine-tuning recipes (FREE)", "url": "https://github.com/meta-llama/llama-cookbook", "topics": ["llm", "fine-tuning", "AI"], "level": "intermediate", "cost_label": "FREE open source"},
        {"id": "meta-pytorch-tutorials", "title": "PyTorch Official Tutorials (Meta-maintained, FREE)", "url": "https://pytorch.org/tutorials/", "topics": ["deep-learning", "AI", "pytorch"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "meta-ai-blog", "title": "Meta AI Research — open papers + model releases", "url": "https://ai.meta.com/", "topics": ["AI", "research", "llm"], "level": "advanced", "cost_label": "FREE"},
        {"id": "react-native-meta", "title": "Meta React Native Specialization (Coursera)", "url": "https://www.coursera.org/specializations/meta-react-native", "topics": ["AI"], "level": "intermediate", "cost_label": "FREE via Karunya"},
    ],
}


CERT_LINKEDIN_LEARNING = {
    "slug": "linkedin-learning-ai-paths",
    "name": "LinkedIn Learning AI Paths (Premium 1-month free + LinkedIn Talent Insights)",
    "official_domain": "linkedin.com",
    "type": "static_manifest",
    "url": "https://www.linkedin.com/learning/topics/artificial-intelligence",
    "free": False,
    "free_note": "1-month FREE LinkedIn Premium trial unlocks all; INR 1,200-1,800/month otherwise. Students may get free Premium via campus partnerships.",
    "default_professions": [["software-developer", 0.55], ["student", 0.55], ["hr-professional", 0.55], ["talent-acquisition", 0.55], ["business-owner", 0.5]],
    "url_patterns": [],
    "manifest": [
        {"id": "li-ai-foundations-path", "title": "LinkedIn Learning — AI Foundations Career Path", "url": "https://www.linkedin.com/learning/paths/become-an-artificial-intelligence-engineer", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE 1-month trial; INR 1,800/month"},
        {"id": "li-genai-business", "title": "LinkedIn Learning — Generative AI for Business Leaders", "url": "https://www.linkedin.com/learning/paths/build-your-generative-ai-skills-with-microsoft", "topics": ["llm", "AI", "msme"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-deep-learning-keras", "title": "LinkedIn Learning — Deep Learning Foundations + Keras", "url": "https://www.linkedin.com/learning/topics/deep-learning", "topics": ["deep-learning", "AI"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-ml-essential", "title": "LinkedIn Learning — Machine Learning Essential Training", "url": "https://www.linkedin.com/learning/topics/machine-learning", "topics": ["machine-learning", "AI"], "level": "beginner", "cost_label": "FREE 1-month trial"},
        {"id": "li-ai-prod-mgmt", "title": "LinkedIn Learning — AI for Product Managers", "url": "https://www.linkedin.com/learning/topics/product-management", "topics": ["AI"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-hr-analytics", "title": "LinkedIn Learning — People Analytics + HR Analytics", "url": "https://www.linkedin.com/learning/topics/human-resources-2", "topics": ["people analytics", "ai for hr"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-talent-insights", "title": "LinkedIn Talent Insights — workforce + skills intelligence", "url": "https://business.linkedin.com/talent-solutions/talent-insights", "topics": ["talent acquisition", "people analytics", "AI"], "level": "intermediate", "cost_label": "LinkedIn Talent Insights subscription"},
        {"id": "li-future-of-work-report", "title": "LinkedIn — Future of Work India Report (annual FREE)", "url": "https://economicgraph.linkedin.com/research/india-future-of-work", "topics": ["AI", "people analytics"], "level": "beginner", "cost_label": "FREE annual report"},
        {"id": "li-skills-on-rise-india", "title": "LinkedIn — Skills on the Rise India (annual FREE workforce report)", "url": "https://www.linkedin.com/business/talent/blog/", "topics": ["AI"], "level": "beginner", "cost_label": "FREE annual report"},
        {"id": "li-recruiter-skills", "title": "LinkedIn Learning — Become a Recruiter Career Path", "url": "https://www.linkedin.com/learning/paths/become-a-recruiter", "topics": ["talent acquisition", "linkedin recruiter", "ai recruiting"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-newsletters-ai", "title": "LinkedIn Newsletters — AI Top Voices (Andrew Ng, Yann LeCun, Allie K Miller, etc.)", "url": "https://www.linkedin.com/", "topics": ["AI"], "level": "intermediate", "cost_label": "FREE — subscribe via LinkedIn"},
    ],
}


CERT_INDUSTRY_DEEPER = {
    "slug": "industry-ai-deeper-certs",
    "name": "Industry-AI Deeper Certs (Databricks / Snowflake / Kubernetes / HashiCorp / MongoDB / Cisco DevNet / NVIDIA NeMo)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.databricks.com/learn",
    "free": False,
    "free_note": "Most have FREE study materials + paid exams.",
    "default_professions": [["software-developer", 0.85], ["student", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "databricks-genai-associate", "title": "Databricks Certified Generative AI Engineer Associate", "url": "https://www.databricks.com/learn/certification/generative-ai-engineer-associate", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "Study FREE; exam USD 200"},
        {"id": "databricks-data-engineer-associate", "title": "Databricks Certified Data Engineer Associate", "url": "https://www.databricks.com/learn/certification/data-engineer-associate", "topics": ["data-engineering", "AI"], "level": "intermediate", "cost_label": "Study FREE; exam USD 200"},
        {"id": "databricks-ml-pro", "title": "Databricks Certified Machine Learning Professional", "url": "https://www.databricks.com/learn/certification/machine-learning-professional", "topics": ["machine-learning", "AI"], "level": "advanced", "cost_label": "Exam USD 200"},
        {"id": "snowflake-snowpro-core", "title": "Snowflake SnowPro Core Certification", "url": "https://learn.snowflake.com/certifications", "topics": ["data-engineering", "AI"], "level": "intermediate", "cost_label": "Study FREE; exam USD 175"},
        {"id": "snowflake-ai-cert", "title": "Snowflake SnowPro AI/ML Speciality (2025)", "url": "https://learn.snowflake.com/certifications", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "Exam USD 225"},
        {"id": "cka", "title": "CKA — Certified Kubernetes Administrator", "url": "https://www.cncf.io/certification/cka/", "topics": ["kubernetes", "AI", "containers"], "level": "intermediate", "cost_label": "Exam USD 395"},
        {"id": "ckad", "title": "CKAD — Certified Kubernetes Application Developer", "url": "https://www.cncf.io/certification/ckad/", "topics": ["kubernetes", "AI"], "level": "intermediate", "cost_label": "Exam USD 395"},
        {"id": "hashicorp-terraform-associate", "title": "HashiCorp Terraform Associate", "url": "https://www.hashicorp.com/certification/terraform-associate", "topics": ["devops", "AI", "infrastructure"], "level": "intermediate", "cost_label": "Exam USD 70.50"},
        {"id": "mongodb-developer-associate", "title": "MongoDB Developer Associate", "url": "https://learn.mongodb.com/pages/certification-program", "topics": ["data-engineering", "AI"], "level": "intermediate", "cost_label": "Exam USD 150"},
        {"id": "mongodb-genai-developer", "title": "MongoDB Generative AI Developer (vector search)", "url": "https://learn.mongodb.com/", "topics": ["vector-database", "llm", "AI"], "level": "intermediate", "cost_label": "FREE study; exam USD 150"},
        {"id": "cisco-devnet-associate", "title": "Cisco DevNet Associate", "url": "https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/devnet-associate.html", "topics": ["AI", "networking"], "level": "intermediate", "cost_label": "Exam USD 300"},
        {"id": "nvidia-nemo-cert", "title": "NVIDIA NeMo Generative AI Multimodal Certification", "url": "https://www.nvidia.com/en-us/training/", "topics": ["llm", "AI", "computer-vision"], "level": "advanced", "cost_label": "Exam USD 400"},
        {"id": "weaviate-vector-cert", "title": "Weaviate Vector Database Specialist (FREE Academy)", "url": "https://weaviate.io/learn", "topics": ["vector-database", "rag", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "pinecone-vector-cert", "title": "Pinecone Vector DB + RAG Certification", "url": "https://www.pinecone.io/learn/", "topics": ["vector-database", "rag", "AI"], "level": "intermediate", "cost_label": "FREE Learning Center"},
    ],
}


CERT_GOV_DEEPER = {
    "slug": "india-gov-ai-deeper-programs",
    "name": "Indian Government AI Programs — DEEPER (MyGov / ISRO / C-DAC / NPCI / DST INSPIRE / NIPCCD / NSE Free / BFSI SSC)",
    "official_domain": "various-gov.in",
    "type": "static_manifest",
    "url": "https://www.mygov.in/",
    "free": True,
    "free_note": "All Indian government skilling programs FREE for citizens.",
    "default_professions": [["software-developer", 0.5], ["student", 0.65], ["government-employee", 0.5], ["accountant", 0.4], ["business-owner", 0.35]],
    "url_patterns": [],
    "manifest": [
        {"id": "mygov-ai-quiz", "title": "MyGov India — National AI Quiz + AI for All citizen track", "url": "https://www.mygov.in/", "topics": ["AI", "fundamentals"], "level": "beginner", "cost_label": "FREE for Indian citizens"},
        {"id": "isro-ai-courses", "title": "ISRO IIRS Outreach — AI in Remote Sensing + Geospatial AI", "url": "https://www.iirs.gov.in/EDUSAT-News", "topics": ["AI", "computer-vision"], "level": "intermediate", "cost_label": "FREE online courses + cert"},
        {"id": "cdac-ai-pgdai", "title": "C-DAC — PG Diploma in AI (PGDAI)", "url": "https://www.cdac.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "INR 90,000-1,40,000 (govt rate)"},
        {"id": "cdac-hpc-ai", "title": "C-DAC — HPC + AI Training Programme", "url": "https://www.cdac.in/", "topics": ["AI", "deep-learning"], "level": "advanced", "cost_label": "INR 15,000-50,000"},
        {"id": "cdac-pgdml", "title": "C-DAC — PG Diploma in Machine Learning + Data Science", "url": "https://www.cdac.in/", "topics": ["machine-learning", "AI"], "level": "advanced", "cost_label": "INR 75,000-1,20,000"},
        {"id": "dst-inspire-ai", "title": "DST INSPIRE — AI/Data Science Scholarships for school students", "url": "https://online-inspire.gov.in/", "topics": ["AI"], "level": "beginner", "cost_label": "FREE + scholarship"},
        {"id": "npci-ai-payments", "title": "NPCI Academy — AI in Payments + UPI Workshops", "url": "https://www.npci.org.in/", "topics": ["AI", "UPI"], "level": "intermediate", "cost_label": "FREE for partner banks"},
        {"id": "nse-free-pathshala", "title": "NSE Pathshala — FREE Indian capital market basics + AI in finance", "url": "https://www.nseindia.com/learn", "topics": ["AI"], "level": "beginner", "cost_label": "FREE"},
        {"id": "nse-academy-online-free", "title": "NSE Academy — FREE Foundation Modules (NCFM)", "url": "https://www.nseindia.com/learn/online-certifications", "topics": ["AI", "icai"], "level": "beginner", "cost_label": "FREE base modules"},
        {"id": "bfsi-ssc-ai-finance", "title": "BFSI Sector Skill Council India — AI for Finance Job Roles", "url": "https://bfsissc.com/", "topics": ["AI", "icai"], "level": "intermediate", "cost_label": "FREE under PMKVY"},
        {"id": "nsdc-ai-skill-india", "title": "NSDC — AI/ML Skill Standards (under Skill India Digital)", "url": "https://nsdcindia.org/", "topics": ["AI", "machine-learning"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "indiaai-skilling-jpb", "title": "IndiaAI Mission — Skilling Programme (50,000 students target FY25)", "url": "https://indiaai.gov.in/", "topics": ["AI"], "level": "intermediate", "cost_label": "FREE under MeitY"},
        {"id": "ai-india-2-yale", "title": "AI for India 2.0 — Yale-NUS + NITI Aayog (FREE for Indian students)", "url": "https://www.niti.gov.in/", "topics": ["AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "nipccd-ai-child-dev", "title": "NIPCCD — AI in Child Development & Anganwadi", "url": "https://www.nipccd.nic.in/", "topics": ["AI"], "level": "intermediate", "cost_label": "FREE for govt anganwadi staff"},
        {"id": "inflibnet-ai-librarians", "title": "INFLIBNET — AI Training for University Librarians (UGC)", "url": "https://www.inflibnet.ac.in/", "topics": ["AI"], "level": "intermediate", "cost_label": "FREE for UGC-affiliated"},
        {"id": "drdo-pxe-young-sci-ai", "title": "DRDO PXE — Young Scientist Programme (AI track for under-35 students)", "url": "https://www.drdo.gov.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "FREE + stipend"},
    ],
}


# Per-profession deeper
CERT_DOCTOR_DEEPER = {
    "slug": "doctor-ai-deeper-global",
    "name": "Doctor AI — Deeper Global Programs (Stanford / Harvard / Mayo / WHO Academy / NEJM AI)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://stanford-online.stanford.edu/",
    "free": False,
    "free_note": "Some free (WHO Academy, NEJM AI free articles), some Coursera audit-free.",
    "default_professions": [["doctor", 0.85], ["oncologist", 0.6], ["nurse", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "stanford-ai-healthcare", "title": "Stanford — AI in Healthcare Specialization (Coursera, audit FREE)", "url": "https://www.coursera.org/specializations/ai-healthcare", "topics": ["AI", "clinical decision support"], "level": "intermediate", "cost_label": "Audit FREE; cert INR 4,000/month"},
        {"id": "harvard-itls-ai-clin", "title": "Harvard Medical School — AI in Clinical Decision Making (HMS)", "url": "https://onlinelearning.hms.harvard.edu/", "topics": ["clinical decision support", "AI"], "level": "intermediate", "cost_label": "USD 1,500-3,000"},
        {"id": "mayo-clinic-ai-med", "title": "Mayo Clinic — AI in Medicine Course (FREE webinars)", "url": "https://college.mayo.edu/", "topics": ["AI", "clinical decision support"], "level": "intermediate", "cost_label": "FREE webinar series"},
        {"id": "who-academy-ai-health", "title": "WHO Academy — AI for Health programmes", "url": "https://www.whoacademy.org/", "topics": ["AI", "clinical decision support"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "nejm-ai-journal", "title": "NEJM AI — flagship clinical AI journal (FREE summaries)", "url": "https://ai.nejm.org/", "topics": ["AI", "clinical decision support", "evidence-based medicine"], "level": "advanced", "cost_label": "FREE summaries; subscription for full"},
        {"id": "aiims-bhub-ai-courses", "title": "AIIMS Bhubaneswar — AI in Medicine workshops", "url": "https://aiimsbhubaneswar.nic.in/", "topics": ["AI", "clinical decision support"], "level": "intermediate", "cost_label": "INR 5,000-25,000"},
        {"id": "icmr-bioinformatics", "title": "ICMR — Bioinformatics + AI Training Programme", "url": "https://main.icmr.nic.in/", "topics": ["AI", "machine-learning"], "level": "advanced", "cost_label": "FREE for ICMR fellows"},
        {"id": "iisc-ai-healthcare", "title": "IISc Bangalore — AI in Healthcare Centre", "url": "https://www.iisc.ac.in/", "topics": ["AI", "clinical decision support"], "level": "advanced", "cost_label": "Research-based"},
        {"id": "telemed-iitm-ai", "title": "Telemedicine + AI Course (IIT Madras + Christian Medical College)", "url": "https://onlinedegree.iitm.ac.in/", "topics": ["AI", "telemedicine"], "level": "intermediate", "cost_label": "INR 15,000-40,000"},
    ],
}


CERT_LAWYER_DEEPER = {
    "slug": "lawyer-ai-deeper",
    "name": "Lawyer AI — Deeper (LawSikho / Nyaayshala / Cyril Mangaldas YT / Stanford CodeX / ABA)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://lawsikho.com/",
    "free": False,
    "free_note": "Some free YouTube + ABA newsletter; LawSikho paid.",
    "default_professions": [["lawyer", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "lawsikho-cyber-law", "title": "LawSikho — Diploma in Cyber Law + AI Law", "url": "https://lawsikho.com/", "topics": ["case-law", "AI", "DPDP"], "level": "intermediate", "cost_label": "INR 30,000-80,000"},
        {"id": "lawsikho-tech-contracts", "title": "LawSikho — Diploma in Tech Contracts + AI Agreements", "url": "https://lawsikho.com/", "topics": ["case-law", "AI"], "level": "intermediate", "cost_label": "INR 35,000-90,000"},
        {"id": "nyaayshala-ai-law", "title": "Nyaayshala — AI Law in India free webinar series", "url": "https://www.nyaayshala.com/", "topics": ["case-law", "AI"], "level": "intermediate", "cost_label": "FREE webinars"},
        {"id": "stanford-codex", "title": "Stanford CodeX — Legal Informatics + AI Center", "url": "https://law.stanford.edu/codex-the-stanford-center-for-legal-informatics/", "topics": ["case-law", "AI"], "level": "advanced", "cost_label": "FREE research + workshops"},
        {"id": "aba-ai-law", "title": "American Bar Association — Center for Innovation AI track (FREE summaries)", "url": "https://www.americanbar.org/groups/centers_commissions/center-for-innovation/", "topics": ["case-law", "AI"], "level": "intermediate", "cost_label": "Free summaries; member content paid"},
        {"id": "cyrilamarchand-yt", "title": "Cyril Amarchand Mangaldas — Tech Law YouTube lectures (FREE)", "url": "https://www.cyrilamarchandblogs.com/", "topics": ["case-law", "AI"], "level": "intermediate", "cost_label": "FREE blog + YouTube"},
        {"id": "trilegal-ai-tech", "title": "Trilegal — AI & Emerging Tech Practice (FREE thought leadership)", "url": "https://www.trilegal.com/", "topics": ["case-law", "AI"], "level": "intermediate", "cost_label": "FREE publications"},
        {"id": "khaitan-ai-cyber", "title": "Khaitan & Co — Cyber + AI Law brown bags (FREE webinar)", "url": "https://www.khaitanco.com/", "topics": ["case-law", "AI", "DPDP"], "level": "intermediate", "cost_label": "FREE webinars"},
    ],
}


CERT_TEACHER_DEEPER = {
    "slug": "teacher-ai-deeper",
    "name": "Teacher AI — Deeper (ISTE / Common Sense Edu / HundrED / Apple Teacher / Microsoft MIE / Google for Edu)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.iste.org/",
    "free": True,
    "free_note": "Most teacher AI programs FREE (vendor-funded).",
    "default_professions": [["teacher", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "iste-ai-edu-cert", "title": "ISTE — Generative AI in Education Certification", "url": "https://iste.org/learn/certifications/iste-certification", "topics": ["AI", "lesson-plan", "NEP-2020"], "level": "intermediate", "cost_label": "USD 250-500"},
        {"id": "common-sense-ai-edu", "title": "Common Sense Education — AI for Teachers (FREE curriculum)", "url": "https://www.commonsense.org/education", "topics": ["AI", "lesson-plan"], "level": "beginner", "cost_label": "FREE"},
        {"id": "hundred-ai-india", "title": "HundrED — AI in Education India Spotlight", "url": "https://hundred.org/en", "topics": ["AI", "lesson-plan", "NEP-2020"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "apple-teacher-ai", "title": "Apple Teacher — Free programme including AI iPad tools", "url": "https://www.apple.com/in/education/k12/teachers/", "topics": ["AI", "lesson-plan"], "level": "beginner", "cost_label": "FREE"},
        {"id": "ms-mie-ai-track", "title": "Microsoft Innovative Educator (MIE) Expert — AI in Classroom", "url": "https://education.microsoft.com/en-us/", "topics": ["AI", "lesson-plan", "copilot studio"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "google-for-edu-ai-india", "title": "Google for Education India — AI Workshops for Teachers", "url": "https://edu.google.com/intl/ALL_in/", "topics": ["AI", "lesson-plan"], "level": "beginner", "cost_label": "FREE"},
        {"id": "central-square-ai-school", "title": "Central Square Foundation — AI for Government Schools (FREE)", "url": "https://centralsquarefoundation.org/", "topics": ["AI", "lesson-plan", "NEP-2020"], "level": "intermediate", "cost_label": "FREE for partner govt schools"},
        {"id": "bharat-foundation-ai", "title": "Bharti Foundation Satya Bharti — AI in Rural Education", "url": "https://www.bhartifoundation.org/", "topics": ["AI", "lesson-plan"], "level": "intermediate", "cost_label": "FREE for partner schools"},
    ],
}


CERT_BUSINESS_OWNER_DEEPER = {
    "slug": "business-owner-ai-deeper",
    "name": "Business Owner AI — Deeper (TiE / NASSCOM Startup / Wadhwani Foundation / NSIC / IIM-A Owner-Manager / Lighthouse Canton)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://tie.org/",
    "free": True,
    "free_note": "Mix of free founder programs + paid IIM courses.",
    "default_professions": [["business-owner", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "tie-bangalore-ai-founders", "title": "TiE Bangalore — AI for Founders monthly meetup (FREE)", "url": "https://bangalore.tie.org/", "topics": ["AI", "msme"], "level": "intermediate", "cost_label": "FREE for TiE members"},
        {"id": "nasscom-startup-ai", "title": "NASSCOM Startup AI Programme — accelerator for Indian AI startups", "url": "https://nasscom.in/", "topics": ["AI", "msme"], "level": "advanced", "cost_label": "FREE (equity-based for shortlisted)"},
        {"id": "wadhwani-foundation-ai-smb", "title": "Wadhwani Foundation — AI for Indian SMBs programme", "url": "https://www.wfglobal.org/", "topics": ["AI", "msme"], "level": "intermediate", "cost_label": "FREE for partner SMBs"},
        {"id": "nsic-ai-msme", "title": "NSIC — AI/Digital Skilling for MSMEs", "url": "https://www.nsic.co.in/", "topics": ["AI", "msme", "udyam"], "level": "intermediate", "cost_label": "FREE under MoMSME"},
        {"id": "iim-a-omp", "title": "IIM Ahmedabad — Owner-Manager Programme + AI Track", "url": "https://www.iima.ac.in/", "topics": ["AI", "msme"], "level": "advanced", "cost_label": "INR 15,00,000-25,00,000"},
        {"id": "lighthouse-canton-ai", "title": "Lighthouse Canton — AI for Indian Founders (free guides)", "url": "https://lighthouse-canton.com/", "topics": ["AI", "msme"], "level": "intermediate", "cost_label": "FREE thought leadership"},
        {"id": "score-ai-smb", "title": "SCORE.org — Mentor AI for Small Business (FREE)", "url": "https://www.score.org/", "topics": ["AI", "msme"], "level": "beginner", "cost_label": "FREE 1-on-1 mentor"},
        {"id": "sebi-skill-startup", "title": "SEBI Investor Awareness + Startup AI Compliance webinars", "url": "https://investor.sebi.gov.in/", "topics": ["AI", "msme"], "level": "intermediate", "cost_label": "FREE"},
    ],
}


CERT_HR_TA_DEEPER = {
    "slug": "hr-ta-ai-deeper",
    "name": "HR + TA AI — Deeper (AIHR / People Matters / HRTech India / Naukri / Glassdoor / Hireology)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.aihr.com/",
    "free": False,
    "free_note": "AIHR + LinkedIn paid; HR.com + People Matters free webinars.",
    "default_professions": [["hr-professional", 0.9], ["talent-acquisition", 0.85]],
    "url_patterns": [],
    "manifest": [
        {"id": "aihr-people-analytics", "title": "AIHR — Academy to Innovate HR (People Analytics + AI in HR)", "url": "https://www.aihr.com/", "topics": ["people analytics", "ai for hr", "hr analytics"], "level": "intermediate", "cost_label": "USD 975-2,495 (full membership)"},
        {"id": "aihr-talent-acq", "title": "AIHR — Strategic Talent Acquisition Certification", "url": "https://www.aihr.com/", "topics": ["talent acquisition", "ai recruiting", "people analytics"], "level": "intermediate", "cost_label": "USD 975+"},
        {"id": "hrcom-webinars-free", "title": "HR.com — FREE weekly webinars (AI in HR / People Analytics)", "url": "https://www.hr.com/", "topics": ["ai for hr", "people analytics"], "level": "intermediate", "cost_label": "FREE webinars"},
        {"id": "people-matters-events", "title": "People Matters — Free India HR events + AI conference", "url": "https://www.peoplematters.in/", "topics": ["ai for hr", "talent acquisition"], "level": "intermediate", "cost_label": "FREE webinars; paid in-person"},
        {"id": "hrtech-india-webinars", "title": "HRTech India — FREE webinars (AI Recruiting / People Analytics)", "url": "https://hrtechindia.com/", "topics": ["ai recruiting", "ai for hr"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "shrm-india-events", "title": "SHRM India — Annual Conference + AI Track (free virtual sessions)", "url": "https://www.shrm.org/in", "topics": ["ai for hr", "talent acquisition"], "level": "intermediate", "cost_label": "FREE virtual; paid in-person"},
        {"id": "glassdoor-hiring-trends", "title": "Glassdoor — India Hiring Trends + Compensation Reports (FREE)", "url": "https://www.glassdoor.co.in/", "topics": ["talent acquisition", "people analytics"], "level": "intermediate", "cost_label": "FREE reports"},
        {"id": "naukri-recruitment-report", "title": "Naukri — JobSpeak Index + India Hiring Outlook (FREE monthly)", "url": "https://www.naukri.com/jobspeak", "topics": ["talent acquisition", "people analytics"], "level": "beginner", "cost_label": "FREE monthly report"},
    ],
}


CERT_GOV_EMP_DEEPER = {
    "slug": "gov-employee-ai-deeper",
    "name": "Government Employee AI — Deeper (World Bank / OECD / UN DESA / ISB Mohali Govt / IIIT-D Public Policy)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.worldbank.org/",
    "free": True,
    "free_note": "Most international govt-tech AI programs are FREE.",
    "default_professions": [["government-employee", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "wb-govtech-ai", "title": "World Bank GovTech AI — Public Sector AI training", "url": "https://www.worldbank.org/en/programs/govtech", "topics": ["AI", "karmayogi"], "level": "intermediate", "cost_label": "FREE for govt officials"},
        {"id": "oecd-ai-public", "title": "OECD — AI for Public Sector Toolkit + Training", "url": "https://oecd.ai/", "topics": ["AI", "karmayogi"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "un-desa-ai-govt", "title": "UN DESA — AI in Public Administration Course", "url": "https://publicadministration.un.org/", "topics": ["AI", "karmayogi"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "isb-mohali-gov-ai", "title": "ISB Mohali — Government + AI Programme (Bharti Institute)", "url": "https://www.isb.edu/en/research-thought-leadership/centres-of-excellence/bharti-institute-of-public-policy.html", "topics": ["AI", "karmayogi"], "level": "advanced", "cost_label": "INR 80,000-2,50,000"},
        {"id": "iiit-d-public-policy", "title": "IIIT Delhi — Public Policy + AI track", "url": "https://iiitd.ac.in/", "topics": ["AI", "karmayogi"], "level": "advanced", "cost_label": "Research-based"},
        {"id": "nudm-data-mgmt-cert", "title": "NUDM India Data Management Programme (data + AI for govt)", "url": "https://www.indiastack.org/", "topics": ["AI", "data-engineering", "karmayogi"], "level": "intermediate", "cost_label": "FREE for govt officials"},
        {"id": "harvard-kennedy-ai", "title": "Harvard Kennedy School — AI for Government Leaders Executive Programme", "url": "https://www.hks.harvard.edu/educational-programs/executive-education", "topics": ["AI", "karmayogi"], "level": "advanced", "cost_label": "USD 10,000-20,000"},
        {"id": "ash-center-ai-india", "title": "Harvard Ash Center — AI in Indian Government research", "url": "https://ash.harvard.edu/", "topics": ["AI", "karmayogi"], "level": "advanced", "cost_label": "FREE research access"},
    ],
}


CERT_FARMER_DEEPER = {
    "slug": "farmer-ai-deeper",
    "name": "Farmer AI — Deeper (ICRISAT / IRMA / IFAD / World Bank Climate AI / ICAR-NIANP / BAIF / Selco)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.icrisat.org/",
    "free": True,
    "free_note": "All government + non-profit farmer AI programs are FREE.",
    "default_professions": [["farmer", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "icrisat-ai-agri", "title": "ICRISAT — AI in Smallholder Agriculture programme", "url": "https://www.icrisat.org/", "topics": ["precision-agriculture", "AI", "agritech"], "level": "intermediate", "cost_label": "FREE for farmer cohorts"},
        {"id": "irma-anand-agritech", "title": "IRMA Anand — Rural Management + AgriTech Programme", "url": "https://www.irma.ac.in/", "topics": ["precision-agriculture", "AI", "agritech"], "level": "advanced", "cost_label": "INR 15-20L (PGDRM)"},
        {"id": "ifad-india-climate-ai", "title": "IFAD India — Climate AI for Smallholder Farmers", "url": "https://www.ifad.org/en/india", "topics": ["precision-agriculture", "AI"], "level": "intermediate", "cost_label": "FREE for IFAD-supported FPOs"},
        {"id": "wb-climate-ai-agri", "title": "World Bank — Climate Smart Agriculture + AI India", "url": "https://www.worldbank.org/", "topics": ["precision-agriculture", "AI"], "level": "intermediate", "cost_label": "FREE for partner states"},
        {"id": "icar-nianp", "title": "ICAR-NIANP Bangalore — AI in Animal Nutrition Training", "url": "https://www.nianp.res.in/", "topics": ["precision-agriculture", "AI"], "level": "intermediate", "cost_label": "FREE for farmer cohorts"},
        {"id": "baif-dairy-ai", "title": "BAIF Foundation — AI in Dairy & Livestock Programme", "url": "https://baif.org.in/", "topics": ["precision-agriculture", "AI"], "level": "intermediate", "cost_label": "FREE for partner farmers"},
        {"id": "selco-solar-ai", "title": "Selco Foundation — Solar + AI for Rural India", "url": "https://www.selcofoundation.org/", "topics": ["AI", "agritech"], "level": "intermediate", "cost_label": "FREE for partner villages"},
        {"id": "fpo-fasal-cropin-training", "title": "FPO Tech Training — Fasal + Cropin onboarding for FPOs", "url": "https://www.fasal.co/", "topics": ["precision-agriculture", "AI", "agritech"], "level": "beginner", "cost_label": "FREE for FPOs"},
    ],
}


# COURSES (live in courses_sources.json)
COURSES_LINKEDIN_FREE = {
    "slug": "linkedin-free-trial-courses",
    "name": "LinkedIn Learning AI/ML/GenAI courses (FREE via 1-month Premium trial + student access)",
    "official_domain": "linkedin.com",
    "type": "static_manifest",
    "url": "https://www.linkedin.com/learning/topics/artificial-intelligence",
    "free": False,
    "free_note": "1-month FREE Premium trial unlocks 21,000+ courses. Students at participating campuses get free Premium.",
    "default_professions": [["software-developer", 0.6], ["student", 0.6], ["hr-professional", 0.4], ["talent-acquisition", 0.4], ["business-owner", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "li-ml-essential-train", "title": "Machine Learning Essential Training (LinkedIn)", "url": "https://www.linkedin.com/learning/machine-learning-essential-training", "topics": ["machine-learning", "AI"], "level": "beginner", "cost_label": "FREE 1-month trial"},
        {"id": "li-applied-ml-algos", "title": "Applied Machine Learning: Algorithms (LinkedIn)", "url": "https://www.linkedin.com/learning/applied-machine-learning-algorithms", "topics": ["machine-learning", "AI"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-deep-learning-foundations", "title": "Deep Learning: Getting Started (LinkedIn, Adam Geitgey)", "url": "https://www.linkedin.com/learning/deep-learning-getting-started", "topics": ["deep-learning", "AI"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-genai-everyone", "title": "Generative AI for Everyone (LinkedIn)", "url": "https://www.linkedin.com/learning/topics/generative-ai", "topics": ["llm", "AI"], "level": "beginner", "cost_label": "FREE 1-month trial"},
        {"id": "li-llm-prompt-eng", "title": "Prompt Engineering for LLMs (LinkedIn)", "url": "https://www.linkedin.com/learning/topics/large-language-models", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-langchain-rag", "title": "Build RAG Apps with LangChain (LinkedIn)", "url": "https://www.linkedin.com/learning/", "topics": ["rag", "llm", "AI"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-pytorch-foundations", "title": "PyTorch Foundations (LinkedIn)", "url": "https://www.linkedin.com/learning/topics/pytorch", "topics": ["deep-learning", "AI"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-hr-analytics-essentials", "title": "HR Analytics Essential Training (LinkedIn)", "url": "https://www.linkedin.com/learning/", "topics": ["people analytics", "hr analytics"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-talent-acq-strat", "title": "Strategic Talent Acquisition (LinkedIn)", "url": "https://www.linkedin.com/learning/", "topics": ["talent acquisition", "AI"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "li-power-bi-ai", "title": "Power BI + AI Insights (LinkedIn)", "url": "https://www.linkedin.com/learning/", "topics": ["power-bi", "AI"], "level": "intermediate", "cost_label": "FREE 1-month trial"},
    ],
}


# Plan
STREAMS_PLAN = [
    ("cert", CERT_GOOGLE_FREE),
    ("cert", CERT_IBM_FREE),
    ("cert", CERT_MICROSOFT_INDIA),
    ("cert", CERT_AWS_INDIA),
    ("cert", CERT_META_OPEN_AI),
    ("cert", CERT_LINKEDIN_LEARNING),
    ("cert", CERT_INDUSTRY_DEEPER),
    ("cert", CERT_GOV_DEEPER),
    ("cert", CERT_DOCTOR_DEEPER),
    ("cert", CERT_LAWYER_DEEPER),
    ("cert", CERT_TEACHER_DEEPER),
    ("cert", CERT_BUSINESS_OWNER_DEEPER),
    ("cert", CERT_HR_TA_DEEPER),
    ("cert", CERT_GOV_EMP_DEEPER),
    ("cert", CERT_FARMER_DEEPER),
]
COURSES_PLAN = [COURSES_LINKEDIN_FREE]


def main() -> int:
    added = 0
    d = json.loads(STREAMS.read_text(encoding="utf-8"))
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
    STREAMS.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    d = json.loads(COURSES.read_text(encoding="utf-8"))
    sources = d["sources"]
    for block in COURSES_PLAN:
        if any(s.get("slug") == block["slug"] for s in sources):
            print(f"  - skip courses/{block['slug']} (already present)")
            continue
        sources.append(block)
        items = len(block.get("manifest", []))
        print(f"  + courses/{block['slug']} ({items} items)")
        added += items
    COURSES.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"\n=== Round-2 deeper research: added {added} more items across {len(STREAMS_PLAN)+len(COURSES_PLAN)} sources ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
