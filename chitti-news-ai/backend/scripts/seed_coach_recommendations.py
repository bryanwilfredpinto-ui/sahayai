"""
Coach's Recommendations — opinionated, named, prioritised picks.

Sire: "If u were to coach all AI, what certifications, tools, courses
would you have recommended to your users?"

This is the master's OPINION — not a catalog. Every item is here
because I'd put my reputation on it.

Three lists:
  1. THE ESSENTIAL 12 — non-negotiable foundation everyone needs
  2. COACH'S CERTIFICATIONS — what's worth paying for, what isn't
  3. COACH'S TOOLS — actual production stack I'd bet on in 2026

Plus 5 BOOKS, 8 COMMUNITIES, 12 PEOPLE-TO-FOLLOW under separate roadmap blocks.
"""
from __future__ import annotations
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
STREAMS = DATA / "streams_sources.json"


# ─────────────────────────────────────────────────────────────────────────
# COACH'S ESSENTIAL 12 — if you do nothing else, do these
# ─────────────────────────────────────────────────────────────────────────
COACH_ESSENTIAL_12 = {
    "slug": "coach-essential-12",
    "name": "Coach's Essential 12 — non-negotiable foundation for every AI learner (FREE)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi",
    "free": True,
    "free_note": "All 12 are 100% FREE. Total cost to master: zero rupees + 6-9 months focused time.",
    "default_professions": [["software-developer", 0.85], ["student", 0.9], ["business-owner", 0.4], ["doctor", 0.35], ["lawyer", 0.35], ["teacher", 0.35]],
    "url_patterns": [],
    "manifest": [
        {"id": "coach-e01", "title": "Coach Pick #1 — 3Blue1Brown Neural Networks playlist (4hr, watch FIRST)", "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", "topics": ["deep-learning", "math"], "duration_min": 240, "level": "beginner", "cost_label": "FREE"},
        {"id": "coach-e02", "title": "Coach Pick #2 — Andrew Ng Machine Learning Specialization (Coursera, audit FREE)", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "topics": ["machine-learning"], "duration_min": 3600, "level": "beginner", "cost_label": "Audit FREE; cert INR 4,000/month"},
        {"id": "coach-e03", "title": "Coach Pick #3 — Andrej Karpathy Neural Networks: Zero to Hero (best DL teacher alive, FREE)", "url": "https://karpathy.ai/zero-to-hero.html", "topics": ["deep-learning", "llm"], "duration_min": 1500, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-e04", "title": "Coach Pick #4 — fast.ai Practical Deep Learning (top-down, ship in week 1, FREE)", "url": "https://course.fast.ai/", "topics": ["deep-learning"], "duration_min": 1800, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-e05", "title": "Coach Pick #5 — Karpathy: Let's Build GPT from Scratch (the LLM unlock, FREE)", "url": "https://www.youtube.com/watch?v=kCc8FmEb1nY", "topics": ["llm", "deep-learning"], "duration_min": 240, "level": "advanced", "cost_label": "FREE"},
        {"id": "coach-e06", "title": "Coach Pick #6 — Hugging Face NLP Course (Transformers + Datasets, FREE)", "url": "https://huggingface.co/learn/nlp-course", "topics": ["NLP", "llm"], "duration_min": 2400, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-e07", "title": "Coach Pick #7 — Hugging Face AI Agents Course (smolagents + LangGraph, FREE)", "url": "https://huggingface.co/learn/agents-course/unit0/introduction", "topics": ["agents", "llm"], "duration_min": 1800, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-e08", "title": "Coach Pick #8 — LangChain Academy (production agent patterns, FREE)", "url": "https://academy.langchain.com/", "topics": ["agents", "rag", "llm"], "duration_min": 1500, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-e09", "title": "Coach Pick #9 — Anthropic Skilljar + Cookbook (best LLM dev resources, FREE)", "url": "https://github.com/anthropics/anthropic-cookbook", "topics": ["llm", "agents"], "duration_min": 720, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-e10", "title": "Coach Pick #10 — DeepLearning.AI 70 Short Courses (pick 10, each 60-90 min, FREE)", "url": "https://www.deeplearning.ai/short-courses/", "topics": ["llm", "rag", "agents", "AI"], "duration_min": 1200, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-e11", "title": "Coach Pick #11 — Made With ML by Goku Mohandas (end-to-end MLOps, FREE)", "url": "https://madewithml.com/", "topics": ["AI", "infrastructure"], "duration_min": 3000, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-e12", "title": "Coach Pick #12 — Kaggle (first competition → first medal → first SOTA, FREE)", "url": "https://www.kaggle.com/competitions", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE; cash prizes on competitions"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# CERTIFICATIONS — what's worth paying for in 2026
# ─────────────────────────────────────────────────────────────────────────
COACH_CERTIFICATIONS = {
    "slug": "coach-certifications-worth-it",
    "name": "Coach's Certifications — worth paying for vs. NOT (₹ROI honest)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.databricks.com/learn/certification/generative-ai-engineer-associate",
    "free": False,
    "free_note": "Mix of free + paid. Coach's reasoning per item below.",
    "default_professions": [["software-developer", 0.85], ["student", 0.6]],
    "url_patterns": [],
    "manifest": [
        {"id": "coach-c01-db-genai", "title": "Coach WORTH-IT #1 — Databricks Certified Generative AI Engineer Associate ($200) — gold std for production GenAI", "url": "https://www.databricks.com/learn/certification/generative-ai-engineer-associate", "topics": ["llm", "AI"], "duration_min": 3000, "level": "advanced", "cost_label": "Study FREE; exam USD 200 (~INR 17,000)"},
        {"id": "coach-c02-aws-mla", "title": "Coach WORTH-IT #2 — AWS Certified ML Engineer Associate ($150) — recruiter-recognized cloud credential", "url": "https://aws.amazon.com/certification/certified-machine-learning-engineer-associate/", "topics": ["machine-learning", "AI"], "duration_min": 4800, "level": "intermediate", "cost_label": "Study FREE; exam USD 150 (~INR 12,500)"},
        {"id": "coach-c03-google-tf", "title": "Coach WORTH-IT #3 — Google TensorFlow Developer Cert ($100) — quick credibility win", "url": "https://www.tensorflow.org/certificate", "topics": ["deep-learning", "tensorflow"], "duration_min": 3600, "level": "intermediate", "cost_label": "USD 100 (~INR 8,300)"},
        {"id": "coach-c04-azure-ai102", "title": "Coach WORTH-IT #4 — Microsoft Azure AI Engineer (AI-102) — useful if your stack is Azure", "url": "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-engineer/", "topics": ["azure-ai", "AI"], "duration_min": 4800, "level": "intermediate", "cost_label": "Study FREE; exam USD 165 (~INR 13,700)"},
        {"id": "coach-c05-cka", "title": "Coach WORTH-IT #5 — CKA Kubernetes Admin ($395) — infra credential if you serve models", "url": "https://www.cncf.io/certification/cka/", "topics": ["kubernetes", "infrastructure"], "duration_min": 6000, "level": "advanced", "cost_label": "USD 395 (~INR 33,000)"},
        {"id": "coach-c06-nvidia-dli-free", "title": "Coach WORTH-IT #6 — NVIDIA DLI courses (mostly FREE) — credential + technical credibility", "url": "https://learn.nvidia.com/", "topics": ["deep-learning", "llm", "AI"], "duration_min": 480, "level": "intermediate", "cost_label": "FREE self-paced; live workshops paid"},
        {"id": "coach-c07-pmp-free", "title": "Coach WORTH-IT #7 — Google Career Certs via Karunya/JBEC (FREE for Indian students)", "url": "https://www.coursera.org/google-career-certificates", "topics": ["AI", "data-engineering"], "duration_min": 7200, "level": "beginner", "cost_label": "FREE via Karunya/JBEC for verified Indian students"},
        {"id": "coach-c08-ibm-pro-cert", "title": "Coach WORTH-IT #8 — IBM Data Science / AI Engineering Pro Certs (FREE via Karunya, Coursera audit)", "url": "https://www.coursera.org/professional-certificates/ai-engineer", "topics": ["AI", "machine-learning"], "duration_min": 7200, "level": "intermediate", "cost_label": "FREE via Karunya"},
        {"id": "coach-c09-shrm-ai-hr", "title": "Coach WORTH-IT #9 (HR-only) — SHRM AI in HR Specialty ($950) — only if HR is your career", "url": "https://www.shrm.org/credentials/specialty-credentials/ai-in-hr", "topics": ["ai for hr"], "duration_min": 4800, "level": "intermediate", "cost_label": "USD 950 (~INR 80,000)"},
        {"id": "coach-c10-icai-ai-acct", "title": "Coach WORTH-IT #10 (Accountant-only) — ICAI AI in Accounting (INR 12-25K) — for CAs needing edge", "url": "https://www.icai.org/", "topics": ["icai", "AI"], "duration_min": 2400, "level": "intermediate", "cost_label": "INR 12,000-25,000"},
        {"id": "coach-c-skip-01", "title": "Coach SKIP #1 — Generic Coursera certs (audit course FREE; cert ≠ skill)", "url": "https://www.coursera.org/", "topics": ["AI"], "duration_min": None, "level": "beginner", "cost_label": "Skip cert; audit FREE; build portfolio instead"},
        {"id": "coach-c-skip-02", "title": "Coach SKIP #2 — INR 3L+ private bootcamps (SimpliLearn / UpGrad / Scaler) — same content FREE on YouTube", "url": "https://www.youtube.com/@krishnaik06", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "Save INR 3L+ — use FREE YouTube + Kaggle"},
        {"id": "coach-c-skip-03", "title": "Coach SKIP #3 — 'AI Master Class' Instagram / Telegram packages — marketing, not learning", "url": "https://academy.openai.com/", "topics": ["AI"], "duration_min": None, "level": "beginner", "cost_label": "Use OpenAI Academy FREE instead"},
        {"id": "coach-c-skip-04", "title": "Coach SKIP #4 — Generic 'AI for Business Leaders' INR 5L exec programs — fluff over substance", "url": "https://www.coursera.org/specializations/ai-for-business-wharton", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "Audit Wharton AI for Business FREE instead"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# TOOLS — what the production stack actually looks like in 2026
# ─────────────────────────────────────────────────────────────────────────
COACH_TOOLS_STACK = {
    "slug": "coach-tools-2026-stack",
    "name": "Coach's 2026 AI Production Stack — what professionals actually use",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://pytorch.org/",
    "free": True,
    "free_note": "All open-source. Vendor-API usage paid; tooling itself FREE.",
    "default_professions": [["software-developer", 0.9], ["student", 0.55]],
    "url_patterns": [],
    "manifest": [
        {"id": "coach-t01-pytorch", "title": "Coach Tool #1 — PyTorch (over TF in 2026 — bet on it)", "url": "https://pytorch.org/", "topics": ["deep-learning", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE open source"},
        {"id": "coach-t02-hf-transformers", "title": "Coach Tool #2 — Hugging Face Transformers (the model hub)", "url": "https://huggingface.co/docs/transformers", "topics": ["llm", "NLP", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-t03-wandb", "title": "Coach Tool #3 — Weights & Biases (experiment tracking — discipline matters)", "url": "https://wandb.ai/", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE tier"},
        {"id": "coach-t04-langgraph", "title": "Coach Tool #4 — LangGraph (agent orchestration — production-grade)", "url": "https://langchain-ai.github.io/langgraph/", "topics": ["agents", "llm"], "duration_min": None, "level": "intermediate", "cost_label": "FREE open source"},
        {"id": "coach-t05-dspy", "title": "Coach Tool #5 — DSPy (Stanford — prompts as programs, not strings)", "url": "https://dspy.ai/", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE open source"},
        {"id": "coach-t06-vllm", "title": "Coach Tool #6 — vLLM (high-throughput LLM serving — production)", "url": "https://docs.vllm.ai/", "topics": ["llm", "infrastructure"], "duration_min": None, "level": "advanced", "cost_label": "FREE open source"},
        {"id": "coach-t07-modal", "title": "Coach Tool #7 — Modal Labs (serverless GPU — fastest path to production)", "url": "https://modal.com/", "topics": ["AI", "infrastructure"], "duration_min": None, "level": "intermediate", "cost_label": "USD 30/month free tier"},
        {"id": "coach-t08-ray", "title": "Coach Tool #8 — Ray + Anyscale (distributed training/inference at scale)", "url": "https://docs.ray.io/", "topics": ["AI", "infrastructure", "machine-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE open source"},
        {"id": "coach-t09-qdrant", "title": "Coach Tool #9 — Qdrant (vector DB — over Pinecone for self-hosting)", "url": "https://qdrant.tech/", "topics": ["vector-database", "rag"], "duration_min": None, "level": "intermediate", "cost_label": "FREE open source"},
        {"id": "coach-t10-ollama", "title": "Coach Tool #10 — Ollama (local LLMs in 1 command — try before you build)", "url": "https://ollama.com/", "topics": ["llm", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE open source"},
        {"id": "coach-t11-replicate", "title": "Coach Tool #11 — Replicate (cheapest path to 'hosted any open model')", "url": "https://replicate.com/", "topics": ["AI", "infrastructure"], "duration_min": None, "level": "beginner", "cost_label": "Pay-per-use; FREE explore"},
        {"id": "coach-t12-cursor-ide", "title": "Coach Tool #12 — Cursor IDE (AI-first dev environment — try it, never go back)", "url": "https://cursor.com/", "topics": ["AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE tier; USD 20/month Pro"},
    ],
}


# Books, communities, people to follow
COACH_BOOKS_COMMUNITIES_PEOPLE = {
    "slug": "coach-books-communities-people",
    "name": "Coach's Books · Communities · People to Follow (the meta-learning layer)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.deeplearningbook.org/",
    "free": True,
    "free_note": "Many books free online; communities all free.",
    "default_professions": [["software-developer", 0.85], ["student", 0.8]],
    "url_patterns": [],
    "manifest": [
        {"id": "coach-b01-dl-book", "title": "Coach Book #1 — Deep Learning Book (Goodfellow, Bengio, Courville) — FREE online", "url": "https://www.deeplearningbook.org/", "topics": ["deep-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE online"},
        {"id": "coach-b02-handson-ml", "title": "Coach Book #2 — Hands-On ML with Scikit-Learn (Aurélien Géron, 3rd ed)", "url": "https://github.com/ageron/handson-ml3", "topics": ["machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "INR 1,500-3,000 paperback; notebooks FREE"},
        {"id": "coach-b03-designing-ml-systems", "title": "Coach Book #3 — Designing ML Systems (Chip Huyen)", "url": "https://www.amazon.com/Designing-Machine-Learning-Systems-Production-Ready/dp/1098107969", "topics": ["AI", "infrastructure"], "duration_min": None, "level": "advanced", "cost_label": "INR 2,000-4,000"},
        {"id": "coach-b04-jurafsky", "title": "Coach Book #4 — Speech and Language Processing (Jurafsky+Martin, 3rd ed) — FREE", "url": "https://web.stanford.edu/~jurafsky/slp3/", "topics": ["NLP", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE online"},
        {"id": "coach-b05-llm-handbook", "title": "Coach Book #5 — LLM Engineer's Handbook (Maxime Labonne + Paul Iusztin)", "url": "https://www.amazon.com/LLM-Engineers-Handbook-engineering-production/dp/1836200072", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "INR 3,000-5,000"},
        {"id": "coach-com01-hf-discord", "title": "Coach Community #1 — Hugging Face Discord — where models live", "url": "https://huggingface.co/join/discord", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-com02-langchain-discord", "title": "Coach Community #2 — LangChain Discord — production agents", "url": "https://discord.gg/langchain", "topics": ["agents", "llm"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-com03-anthropic-discord", "title": "Coach Community #3 — Anthropic Discord — Claude builders", "url": "https://discord.com/invite/anthropic", "topics": ["llm", "agents"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-com04-r-machinelearning", "title": "Coach Community #4 — r/MachineLearning subreddit", "url": "https://www.reddit.com/r/MachineLearning/", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-com05-datatalks", "title": "Coach Community #5 — DataTalks.Club Slack (Zoomcamps + jobs + papers)", "url": "https://datatalks.club/slack.html", "topics": ["AI", "machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-com06-kaggle-discuss", "title": "Coach Community #6 — Kaggle Discussions (winning kernels = applied learning)", "url": "https://www.kaggle.com/discussions", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-com07-paperswithcode", "title": "Coach Community #7 — Papers With Code (SOTA tracking)", "url": "https://paperswithcode.com/", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "coach-com08-twitter-ml", "title": "Coach Community #8 — Twitter/X #AICommunity — real-time pulse", "url": "https://twitter.com/", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-p01-andrewng", "title": "Coach Follow #1 — Andrew Ng (LinkedIn newsletter, DeepLearning.AI)", "url": "https://www.linkedin.com/in/andrewyng/", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-p02-karpathy", "title": "Coach Follow #2 — Andrej Karpathy (YouTube + Twitter — best DL teacher)", "url": "https://twitter.com/karpathy", "topics": ["llm", "deep-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "coach-p03-lecun", "title": "Coach Follow #3 — Yann LeCun (Twitter — Meta AI Chief, deep perspective)", "url": "https://twitter.com/ylecun", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "coach-p04-raschka", "title": "Coach Follow #4 — Sebastian Raschka (Twitter + Substack — best educator)", "url": "https://magazine.sebastianraschka.com/", "topics": ["machine-learning", "llm"], "duration_min": None, "level": "intermediate", "cost_label": "FREE newsletter"},
        {"id": "coach-p05-jeremy-howard", "title": "Coach Follow #5 — Jeremy Howard (fast.ai founder)", "url": "https://twitter.com/jeremyphoward", "topics": ["deep-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-p06-chip-huyen", "title": "Coach Follow #6 — Chip Huyen (production AI, books + blog)", "url": "https://huyenchip.com/", "topics": ["AI", "infrastructure"], "duration_min": None, "level": "advanced", "cost_label": "FREE blog"},
        {"id": "coach-p07-allie-k-miller", "title": "Coach Follow #7 — Allie K Miller (industry + business AI on LinkedIn)", "url": "https://www.linkedin.com/in/alliekmiller/", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-p08-yannic-kilcher", "title": "Coach Follow #8 — Yannic Kilcher (YouTube — paper deep-dives)", "url": "https://www.youtube.com/@YannicKilcher", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "coach-p09-aleksa-gordic", "title": "Coach Follow #9 — Aleksa Gordić (YouTube + GitHub — technical depth)", "url": "https://www.youtube.com/@TheAIEpiphany", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "coach-p10-lex-fridman", "title": "Coach Follow #10 — Lex Fridman (long-form AI conversations)", "url": "https://www.youtube.com/@lexfridman", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-p11-maxime-labonne", "title": "Coach Follow #11 — Maxime Labonne (LLM fine-tuning + GitHub recipes)", "url": "https://www.linkedin.com/in/maxime-labonne/", "topics": ["llm", "fine-tuning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "coach-p12-philschmid", "title": "Coach Follow #12 — Philipp Schmid (HF Tech Lead — practical LLM builds)", "url": "https://www.philschmid.de/", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE blog"},
    ],
}


# Coaching philosophy as a manifest of principles
COACH_TEN_PRINCIPLES = {
    "slug": "coach-ten-principles",
    "name": "Coach's 10 Non-Negotiable Principles for AI mastery",
    "official_domain": "chitti.coach",
    "type": "static_manifest",
    "url": "https://sahayai.in/chitti_news_ai.html",
    "free": True,
    "free_note": "Principles — apply free.",
    "default_professions": [["software-developer", 0.8], ["student", 0.9]],
    "url_patterns": [],
    "manifest": [
        {"id": "coach-pr01", "title": "Principle #1 — Intuition BEFORE formalism (3B1B → Khan → Stanford, not reverse)", "url": "https://www.3blue1brown.com/", "topics": ["AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "coach-pr02", "title": "Principle #2 — Build BEFORE you understand (fast.ai top-down, Karpathy by example)", "url": "https://course.fast.ai/", "topics": ["AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "coach-pr03", "title": "Principle #3 — Production from Day 1 (Made With ML, W&B, GitHub repo from week 1)", "url": "https://madewithml.com/", "topics": ["AI", "infrastructure"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-pr04", "title": "Principle #4 — Read 1 paper per WEEK starting week 1 (arXiv + Papers With Code)", "url": "https://paperswithcode.com/", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-pr05", "title": "Principle #5 — Ship code to GitHub weekly (recruiters check commits, not certs)", "url": "https://github.com/", "topics": ["AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "coach-pr06", "title": "Principle #6 — Kaggle every month — competitions force real-world data + feedback", "url": "https://www.kaggle.com/competitions", "topics": ["machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE; cash prizes"},
        {"id": "coach-pr07", "title": "Principle #7 — Open source contributions ≥ 1 PR/quarter (HF / LangChain / vLLM)", "url": "https://github.com/huggingface/transformers", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-pr08", "title": "Principle #8 — Pick ONE specialisation in year 2 (NLP / CV / RL / Audio / Safety)", "url": "https://huggingface.co/learn", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "coach-pr09", "title": "Principle #9 — Apply to fellowships (IndiaAI ₹4 LPA · MITACS · DAAD · Erasmus Mundus)", "url": "https://indiaai.gov.in/", "topics": ["AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE + stipend"},
        {"id": "coach-pr10", "title": "Principle #10 — Build in public (LinkedIn weekly, Twitter/X daily, blog monthly)", "url": "https://www.linkedin.com/", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
    ],
}


PLAN = [
    COACH_ESSENTIAL_12,
    COACH_CERTIFICATIONS,
    COACH_TOOLS_STACK,
    COACH_BOOKS_COMMUNITIES_PEOPLE,
    COACH_TEN_PRINCIPLES,
]


def main() -> int:
    d = json.loads(STREAMS.read_text(encoding="utf-8"))
    rm = d["streams"].setdefault("roadmap_node", {"sources": []})
    sources = rm.setdefault("sources", [])
    added = 0
    for block in PLAN:
        if any(s.get("slug") == block["slug"] for s in sources):
            print(f"  - skip {block['slug']} (already)")
            continue
        sources.append(block)
        items = len(block.get("manifest", []))
        print(f"  + roadmap_node/{block['slug']} ({items} items)")
        added += items
    STREAMS.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n=== Coach's recommendations: +{added} items across {len(PLAN)} blocks ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
