"""
Master AI/ML/DL/GenAI/Agentic/DS Curriculum + per-profession roadmaps.

Sire 2026-06-04: "assume u r a master & world class in AI, ML, DL,
GenAI, agentic AI & data science with 20 years experience. Reverse
engineer the process that got you there & now do your research as to
how chitti news AI can help professionals upgrade their skills using
tools, courses, certifications for free or low cost resources".

Reverse-engineered the 20-year journey backwards from "master" to
"day zero" — encoded as 8 phases. Then adapted per profession.

PHASE STRUCTURE:
  P0  Foundations (math, programming, statistics) -- 2 months
  P1  Classical ML Foundations                     -- 3 months
  P2  Deep Learning Foundations                    -- 4 months
  P3  Specialisation Track (NLP / CV / RL)         -- 6 months
  P4  GenAI + LLMs                                 -- 4 months
  P5  Agentic AI + RAG                             -- 3 months
  P6  Production AI / MLOps                        -- 4 months
  P7  Research / Master Level                      -- ongoing

Each item: title + url + topics + level + duration + prerequisites.
All resources FREE or audit-free (Coursera) or single-exam-fee.

Idempotent.
"""
from __future__ import annotations
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
STREAMS = DATA / "streams_sources.json"


# ─────────────────────────────────────────────────────────────────────────
# Phase 0 — Foundations (Math + Programming + Stats)
# ─────────────────────────────────────────────────────────────────────────
PHASE_0_FOUNDATIONS = {
    "slug": "ai-master-p0-foundations",
    "name": "Phase 0 — Foundations (Math · Programming · Stats) — 2 months",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.3blue1brown.com/",
    "free": True,
    "free_note": "100% FREE foundational resources.",
    "default_professions": [["software-developer", 0.6], ["student", 0.85], ["business-owner", 0.3]],
    "url_patterns": [],
    "manifest": [
        {"id": "p0-3b1b-lin-alg", "title": "P0/M1 — 3Blue1Brown Essence of Linear Algebra (15 episodes, FREE)", "url": "https://www.3blue1brown.com/topics/linear-algebra", "topics": ["linear-algebra", "math"], "duration_min": 180, "level": "beginner", "cost_label": "FREE"},
        {"id": "p0-3b1b-calc", "title": "P0/M1 — 3Blue1Brown Essence of Calculus (12 episodes, FREE)", "url": "https://www.3blue1brown.com/topics/calculus", "topics": ["calculus", "math"], "duration_min": 180, "level": "beginner", "cost_label": "FREE"},
        {"id": "p0-3b1b-prob", "title": "P0/M1 — 3Blue1Brown Probability + Bayes Theorem (FREE)", "url": "https://www.3blue1brown.com/topics/probability", "topics": ["probability", "statistics", "math"], "duration_min": 120, "level": "beginner", "cost_label": "FREE"},
        {"id": "p0-khan-lin-alg", "title": "P0/M1 — Khan Academy Linear Algebra (full course, FREE)", "url": "https://www.khanacademy.org/math/linear-algebra", "topics": ["linear-algebra", "math"], "duration_min": 1800, "level": "beginner", "cost_label": "FREE"},
        {"id": "p0-khan-multivar", "title": "P0/M1 — Khan Academy Multivariable Calculus (FREE)", "url": "https://www.khanacademy.org/math/multivariable-calculus", "topics": ["calculus", "math"], "duration_min": 2400, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p0-khan-statistics", "title": "P0/M2 — Khan Academy Statistics & Probability (FREE)", "url": "https://www.khanacademy.org/math/statistics-probability", "topics": ["statistics", "probability"], "duration_min": 1800, "level": "beginner", "cost_label": "FREE"},
        {"id": "p0-statquest-stats", "title": "P0/M2 — StatQuest with Josh Starmer — Statistics + ML stats (FREE)", "url": "https://www.youtube.com/@statquest", "topics": ["statistics", "machine-learning"], "duration_min": 1200, "level": "beginner", "cost_label": "FREE"},
        {"id": "p0-mosh-python", "title": "P0/M2 — Programming with Mosh Python Tutorial (6h, FREE)", "url": "https://www.youtube.com/watch?v=_uQrJ0TkZlc", "topics": ["python"], "duration_min": 360, "level": "beginner", "cost_label": "FREE"},
        {"id": "p0-freecodecamp-python", "title": "P0/M2 — freeCodeCamp Python for Beginners (4.5h, FREE)", "url": "https://www.freecodecamp.org/learn/scientific-computing-with-python/", "topics": ["python"], "duration_min": 270, "level": "beginner", "cost_label": "FREE"},
        {"id": "p0-corey-schafer-python", "title": "P0/M2 — Corey Schafer Python OOP + Decorators + Generators (FREE)", "url": "https://www.youtube.com/@coreyms", "topics": ["python"], "duration_min": 600, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p0-mit-6001-cs-prog", "title": "P0/M2 — MIT 6.0001 Intro to CS + Programming in Python (FREE OCW)", "url": "https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/", "topics": ["python", "computer-science"], "duration_min": 2400, "level": "beginner", "cost_label": "FREE"},
        {"id": "p0-harvard-cs50", "title": "P0/M2 — Harvard CS50 Intro to Computer Science (FREE on edX)", "url": "https://cs50.harvard.edu/x/", "topics": ["computer-science", "python"], "duration_min": 6000, "level": "beginner", "cost_label": "FREE; optional cert USD 200"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Phase 1 — Classical ML Foundations
# ─────────────────────────────────────────────────────────────────────────
PHASE_1_CLASSICAL_ML = {
    "slug": "ai-master-p1-classical-ml",
    "name": "Phase 1 — Classical ML (scikit-learn, gradient boosting, regression, classification) — 3 months",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.coursera.org/specializations/machine-learning-introduction",
    "free": True,
    "free_note": "Coursera audit FREE; certs paid INR 4,000/month.",
    "default_professions": [["software-developer", 0.75], ["student", 0.7], ["accountant", 0.3]],
    "url_patterns": [],
    "manifest": [
        {"id": "p1-andrew-ng-ml-spec", "title": "P1/M1 — Andrew Ng Machine Learning Specialization (Coursera, audit FREE)", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "topics": ["machine-learning", "regression", "classification"], "duration_min": 3600, "level": "beginner", "cost_label": "Audit FREE; cert INR 4,000/month"},
        {"id": "p1-stanford-cs229", "title": "P1/M1 — Stanford CS229 Machine Learning full lectures (FREE)", "url": "https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU", "topics": ["machine-learning", "math"], "duration_min": 3000, "level": "advanced", "cost_label": "FREE"},
        {"id": "p1-statquest-ml", "title": "P1/M1-2 — StatQuest ML Series (Decision Trees, Random Forest, XGBoost, FREE)", "url": "https://www.youtube.com/@statquest", "topics": ["machine-learning"], "duration_min": 1800, "level": "beginner", "cost_label": "FREE"},
        {"id": "p1-sklearn-tutorial", "title": "P1/M2 — scikit-learn Official Tutorial (FREE)", "url": "https://scikit-learn.org/stable/tutorial/index.html", "topics": ["machine-learning", "python"], "duration_min": 1200, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p1-kaggle-learn-ml", "title": "P1/M2 — Kaggle Learn Intro+Intermediate ML micro-courses (FREE)", "url": "https://www.kaggle.com/learn/intro-to-machine-learning", "topics": ["machine-learning"], "duration_min": 600, "level": "beginner", "cost_label": "FREE"},
        {"id": "p1-aurelien-geron-handson-ml", "title": "P1/M2 — Hands-On ML with Scikit-Learn (Aurelien Geron) — book + Colab notebooks", "url": "https://github.com/ageron/handson-ml3", "topics": ["machine-learning"], "duration_min": 6000, "level": "intermediate", "cost_label": "Book paid; Colab notebooks FREE"},
        {"id": "p1-kaggle-first-comp", "title": "P1/M2 — Kaggle Titanic / House Prices — first competitions (FREE)", "url": "https://www.kaggle.com/competitions", "topics": ["machine-learning"], "duration_min": 1800, "level": "beginner", "cost_label": "FREE"},
        {"id": "p1-codebasics-ml", "title": "P1/M3 — codebasics ML Bootcamp Hindi (free playlist)", "url": "https://www.youtube.com/@codebasics", "topics": ["machine-learning"], "duration_min": 3600, "level": "beginner", "cost_label": "FREE (Hindi available)"},
        {"id": "p1-krish-naik-ml-end-to-end", "title": "P1/M3 — Krish Naik End-to-End ML Projects (free)", "url": "https://www.youtube.com/@krishnaik06", "topics": ["machine-learning"], "duration_min": 4800, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p1-google-ml-crash", "title": "P1/M3 — Google ML Crash Course (15h, FREE)", "url": "https://developers.google.com/machine-learning/crash-course", "topics": ["machine-learning"], "duration_min": 900, "level": "beginner", "cost_label": "FREE"},
        {"id": "p1-mit-6034-ai", "title": "P1/M3 — MIT 6.034 Artificial Intelligence (FREE OCW)", "url": "https://www.youtube.com/playlist?list=PLUl4u3cNGP63gFHB6xb-kVBiQHYe_4hSi", "topics": ["AI", "machine-learning"], "duration_min": 1800, "level": "advanced", "cost_label": "FREE"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Phase 2 — Deep Learning Foundations
# ─────────────────────────────────────────────────────────────────────────
PHASE_2_DEEP_LEARNING = {
    "slug": "ai-master-p2-deep-learning",
    "name": "Phase 2 — Deep Learning Foundations (NN, CNN, RNN, Transformers, PyTorch) — 4 months",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://course.fast.ai/",
    "free": True,
    "free_note": "All listed FREE.",
    "default_professions": [["software-developer", 0.8], ["student", 0.75]],
    "url_patterns": [],
    "manifest": [
        {"id": "p2-andrew-ng-dl-spec", "title": "P2/M1 — DeepLearning.AI Deep Learning Specialization (Coursera audit FREE)", "url": "https://www.coursera.org/specializations/deep-learning", "topics": ["deep-learning", "machine-learning"], "duration_min": 4200, "level": "intermediate", "cost_label": "Audit FREE"},
        {"id": "p2-3b1b-nn", "title": "P2/M1 — 3Blue1Brown Neural Networks visualised (FREE)", "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", "topics": ["deep-learning"], "duration_min": 120, "level": "beginner", "cost_label": "FREE"},
        {"id": "p2-karpathy-zero-hero", "title": "P2/M2 — Andrej Karpathy Neural Networks: Zero to Hero (FREE)", "url": "https://karpathy.ai/zero-to-hero.html", "topics": ["deep-learning", "AI"], "duration_min": 1500, "level": "advanced", "cost_label": "FREE"},
        {"id": "p2-fast-ai-prac-dl", "title": "P2/M2 — fast.ai Practical Deep Learning for Coders (FREE)", "url": "https://course.fast.ai/", "topics": ["deep-learning", "computer-vision", "NLP"], "duration_min": 1800, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p2-mit-6s191", "title": "P2/M2 — MIT 6.S191 Intro to Deep Learning (FREE annual)", "url": "http://introtodeeplearning.com/", "topics": ["deep-learning"], "duration_min": 900, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p2-pytorch-tutorials", "title": "P2/M3 — PyTorch Official Tutorials (FREE)", "url": "https://pytorch.org/tutorials/", "topics": ["deep-learning", "pytorch"], "duration_min": 1800, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p2-pytorch-zero-mastery", "title": "P2/M3 — Daniel Bourke PyTorch Zero-to-Mastery (FREE 26h YouTube)", "url": "https://www.youtube.com/watch?v=Z_ikDlimN6A", "topics": ["deep-learning", "pytorch"], "duration_min": 1560, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p2-tf-developer-cert", "title": "P2/M3 — TensorFlow Developer Certificate Prep (FREE study materials)", "url": "https://www.tensorflow.org/certificate", "topics": ["deep-learning", "machine-learning", "tensorflow"], "duration_min": 3600, "level": "intermediate", "cost_label": "Study FREE; exam USD 100"},
        {"id": "p2-deepmind-rl-series", "title": "P2/M4 — DeepMind × UCL Reinforcement Learning Lecture Series (FREE)", "url": "https://www.youtube.com/playlist?list=PLqYmG7hTraZBKeNJ-JE_eyJHZ7XgBoAyb", "topics": ["machine-learning", "AI"], "duration_min": 1500, "level": "advanced", "cost_label": "FREE"},
        {"id": "p2-nvidia-dli-fundamentals", "title": "P2/M4 — NVIDIA DLI Fundamentals of Deep Learning (FREE)", "url": "https://learn.nvidia.com/", "topics": ["deep-learning"], "duration_min": 480, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p2-kaggle-deep-learning", "title": "P2/M4 — Kaggle Learn Deep Learning + Computer Vision micro-courses (FREE)", "url": "https://www.kaggle.com/learn/deep-learning", "topics": ["deep-learning"], "duration_min": 480, "level": "intermediate", "cost_label": "FREE"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Phase 3 — Specialisation Tracks (NLP / CV / Audio / RL)
# ─────────────────────────────────────────────────────────────────────────
PHASE_3_SPECIALISATIONS = {
    "slug": "ai-master-p3-specialisations",
    "name": "Phase 3 — Specialisation Tracks (NLP · CV · Audio · RL) — pick 1-2, 6 months",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://huggingface.co/learn",
    "free": True,
    "free_note": "All FREE.",
    "default_professions": [["software-developer", 0.8], ["student", 0.6]],
    "url_patterns": [],
    "manifest": [
        {"id": "p3-nlp-cs224n", "title": "P3 (NLP) — Stanford CS224N Natural Language Processing with Deep Learning (FREE)", "url": "https://web.stanford.edu/class/cs224n/", "topics": ["NLP", "deep-learning"], "duration_min": 3000, "level": "advanced", "cost_label": "FREE"},
        {"id": "p3-nlp-hf-course", "title": "P3 (NLP) — Hugging Face NLP Course (Transformers + Datasets, FREE)", "url": "https://huggingface.co/learn/nlp-course", "topics": ["NLP", "llm"], "duration_min": 2400, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p3-nlp-nptel-iitkgp", "title": "P3 (NLP) — NPTEL NLP (Pawan Goyal, IIT Kharagpur, FREE)", "url": "https://nptel.ac.in/courses/106105158", "topics": ["NLP"], "duration_min": 2400, "level": "advanced", "cost_label": "FREE; cert INR 1,000"},
        {"id": "p3-cv-cs231n", "title": "P3 (CV) — Stanford CS231N Convolutional Neural Networks for Visual Recognition (FREE)", "url": "http://cs231n.stanford.edu/", "topics": ["computer-vision", "deep-learning"], "duration_min": 3000, "level": "advanced", "cost_label": "FREE"},
        {"id": "p3-cv-hf-course", "title": "P3 (CV) — Hugging Face Computer Vision Course (FREE)", "url": "https://huggingface.co/learn/computer-vision-course", "topics": ["computer-vision"], "duration_min": 1800, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p3-cv-roboflow", "title": "P3 (CV) — Roboflow Computer Vision University (FREE)", "url": "https://roboflow.com/learn", "topics": ["computer-vision"], "duration_min": 1200, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p3-cv-nptel-iith", "title": "P3 (CV) — NPTEL Computer Vision (Vineeth B, IIT Hyderabad, FREE)", "url": "https://nptel.ac.in/courses/106106224", "topics": ["computer-vision"], "duration_min": 2400, "level": "advanced", "cost_label": "FREE; cert INR 1,000"},
        {"id": "p3-cv-diffusion-hf", "title": "P3 (CV) — Hugging Face Diffusion Models Class (FREE)", "url": "https://github.com/huggingface/diffusion-models-class", "topics": ["computer-vision"], "duration_min": 1200, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p3-audio-hf-course", "title": "P3 (Audio) — Hugging Face Audio ML Course (FREE)", "url": "https://huggingface.co/learn/audio-course", "topics": ["AI", "speech"], "duration_min": 1500, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p3-rl-hf-deep", "title": "P3 (RL) — Hugging Face Deep RL Course (FREE)", "url": "https://huggingface.co/learn/deep-rl-course", "topics": ["machine-learning"], "duration_min": 1800, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p3-rl-nptel-iitm", "title": "P3 (RL) — NPTEL Reinforcement Learning (Balaraman Ravindran, IIT Madras, FREE)", "url": "https://nptel.ac.in/courses/106106143", "topics": ["machine-learning"], "duration_min": 2400, "level": "advanced", "cost_label": "FREE; cert INR 1,000"},
        {"id": "p3-rl-stanford-cs234", "title": "P3 (RL) — Stanford CS234 Reinforcement Learning (FREE)", "url": "https://web.stanford.edu/class/cs234/", "topics": ["machine-learning"], "duration_min": 1800, "level": "advanced", "cost_label": "FREE"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Phase 4 — GenAI + LLMs
# ─────────────────────────────────────────────────────────────────────────
PHASE_4_GENAI_LLMS = {
    "slug": "ai-master-p4-genai-llms",
    "name": "Phase 4 — GenAI + LLMs (Transformers from scratch, prompt eng, fine-tuning) — 4 months",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.deeplearning.ai/short-courses/",
    "free": True,
    "free_note": "DeepLearning.AI short courses + Karpathy + Anthropic all FREE.",
    "default_professions": [["software-developer", 0.85], ["student", 0.7], ["business-owner", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "p4-karpathy-llm-scratch", "title": "P4/M1 — Andrej Karpathy: Let's Build GPT from Scratch (FREE)", "url": "https://www.youtube.com/watch?v=kCc8FmEb1nY", "topics": ["llm", "deep-learning"], "duration_min": 240, "level": "advanced", "cost_label": "FREE"},
        {"id": "p4-karpathy-tokenizer", "title": "P4/M1 — Andrej Karpathy: Let's Build the GPT Tokenizer (FREE)", "url": "https://www.youtube.com/watch?v=zduSFxRajkE", "topics": ["llm"], "duration_min": 120, "level": "advanced", "cost_label": "FREE"},
        {"id": "p4-stanford-cs336", "title": "P4/M1 — Stanford CS336 LLMs from Scratch (2024-2025, FREE)", "url": "https://stanford-cs336.github.io/", "topics": ["llm"], "duration_min": 3000, "level": "advanced", "cost_label": "FREE"},
        {"id": "p4-genai-everyone-ng", "title": "P4/M1 — DeepLearning.AI: Generative AI for Everyone (Andrew Ng, FREE)", "url": "https://www.deeplearning.ai/short-courses/generative-ai-for-everyone/", "topics": ["llm"], "duration_min": 180, "level": "beginner", "cost_label": "FREE"},
        {"id": "p4-dlai-chatgpt-prompt", "title": "P4/M2 — DeepLearning.AI: ChatGPT Prompt Engineering for Developers (FREE)", "url": "https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/", "topics": ["llm", "prompt-engineering"], "duration_min": 90, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p4-dlai-building-systems", "title": "P4/M2 — DeepLearning.AI: Building Systems with the ChatGPT API (FREE)", "url": "https://www.deeplearning.ai/short-courses/building-systems-with-chatgpt/", "topics": ["llm", "agents"], "duration_min": 90, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p4-anthropic-prompt-eng-int", "title": "P4/M2 — Anthropic Prompt Engineering Interactive Tutorial (FREE)", "url": "https://github.com/anthropics/prompt-eng-interactive-tutorial", "topics": ["llm", "prompt-engineering"], "duration_min": 240, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p4-anthropic-skilljar", "title": "P4/M2 — Anthropic Skilljar Academy — Claude API courses (FREE)", "url": "https://anthropic.skilljar.com/", "topics": ["llm", "agents"], "duration_min": 480, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p4-anthropic-cookbook", "title": "P4/M3 — Anthropic Cookbook (GitHub recipes, FREE)", "url": "https://github.com/anthropics/anthropic-cookbook", "topics": ["llm", "agents", "rag"], "duration_min": 720, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p4-openai-cookbook", "title": "P4/M3 — OpenAI Cookbook (FREE)", "url": "https://cookbook.openai.com/", "topics": ["llm", "fine-tuning"], "duration_min": 720, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p4-cohere-llmu", "title": "P4/M3 — Cohere LLM University (FREE curriculum)", "url": "https://docs.cohere.com/page/llmu", "topics": ["llm", "rag"], "duration_min": 1200, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p4-dlai-finetuning", "title": "P4/M4 — DeepLearning.AI: Finetuning LLMs (Sharon Zhou, FREE)", "url": "https://www.deeplearning.ai/short-courses/finetuning-large-language-models/", "topics": ["llm", "fine-tuning"], "duration_min": 90, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p4-hf-peft-finetune", "title": "P4/M4 — Hugging Face LLM Fine-Tuning + PEFT/LoRA Course (FREE)", "url": "https://huggingface.co/learn/cookbook/fine_tuning_llm_to_generate_persian_product_catalogs_in_json_format", "topics": ["llm", "fine-tuning"], "duration_min": 720, "level": "advanced", "cost_label": "FREE"},
        {"id": "p4-nvidia-dli-genai-llms", "title": "P4/M4 — NVIDIA DLI Generative AI with LLMs (FREE)", "url": "https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-FX-07+V1", "topics": ["llm"], "duration_min": 480, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p4-aws-genai-essentials", "title": "P4/M4 — AWS Generative AI Essentials (FREE Skill Builder)", "url": "https://explore.skillbuilder.aws/learn/learning-plans/2068/generative-ai-learning-plan-for-decision-makers", "topics": ["llm"], "duration_min": 600, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p4-google-cloud-genai-lp", "title": "P4/M4 — Google Cloud Generative AI Learning Path (FREE)", "url": "https://www.cloudskillsboost.google/paths/118", "topics": ["llm"], "duration_min": 600, "level": "beginner", "cost_label": "FREE"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Phase 5 — Agentic AI + RAG
# ─────────────────────────────────────────────────────────────────────────
PHASE_5_AGENTIC_RAG = {
    "slug": "ai-master-p5-agentic-rag",
    "name": "Phase 5 — Agentic AI + RAG (LangChain, LangGraph, MCP, vector DBs) — 3 months",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://academy.langchain.com/",
    "free": True,
    "free_note": "All vendor academies + tutorials FREE.",
    "default_professions": [["software-developer", 0.9], ["student", 0.5]],
    "url_patterns": [],
    "manifest": [
        {"id": "p5-hf-agents-course", "title": "P5/M1 — Hugging Face AI Agents Course (smolagents + LangGraph, FREE)", "url": "https://huggingface.co/learn/agents-course/unit0/introduction", "topics": ["agents", "llm"], "duration_min": 1800, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-langchain-academy", "title": "P5/M1 — LangChain Academy (FREE)", "url": "https://academy.langchain.com/", "topics": ["agents", "rag", "llm"], "duration_min": 1500, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-langgraph-academy", "title": "P5/M1 — LangGraph Academy: agent orchestration (FREE)", "url": "https://academy.langchain.com/courses/intro-to-langgraph", "topics": ["agents", "llm"], "duration_min": 720, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-dlai-functions-tools", "title": "P5/M1 — DeepLearning.AI Functions, Tools, Agents with LangChain (FREE)", "url": "https://www.deeplearning.ai/short-courses/functions-tools-agents-langchain/", "topics": ["agents", "llm"], "duration_min": 90, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-dlai-langgraph", "title": "P5/M1 — DeepLearning.AI AI Agents in LangGraph (FREE)", "url": "https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/", "topics": ["agents", "llm"], "duration_min": 90, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-dlai-multi-ai-agent", "title": "P5/M1 — DeepLearning.AI Multi AI Agent Systems with crewAI (FREE)", "url": "https://www.deeplearning.ai/short-courses/multi-ai-agent-systems-with-crewai/", "topics": ["agents", "llm"], "duration_min": 90, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-anthropic-mcp", "title": "P5/M2 — Anthropic Model Context Protocol (MCP) tutorial (FREE)", "url": "https://modelcontextprotocol.io/", "topics": ["agents", "llm"], "duration_min": 360, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-llamaindex-bootcamp", "title": "P5/M2 — LlamaIndex bootcamp (FREE)", "url": "https://docs.llamaindex.ai/", "topics": ["rag", "agents", "llm"], "duration_min": 720, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-dlai-langchain-rag", "title": "P5/M2 — DeepLearning.AI LangChain for LLM App Development (FREE)", "url": "https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/", "topics": ["rag", "agents", "llm"], "duration_min": 90, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-nvidia-dli-rag-agents", "title": "P5/M2 — NVIDIA DLI Building RAG Agents with LLMs (FREE)", "url": "https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-FX-15+V1", "topics": ["rag", "agents", "llm"], "duration_min": 480, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-pinecone-learn", "title": "P5/M3 — Pinecone Learning Center: vector DB + RAG (FREE)", "url": "https://www.pinecone.io/learn/", "topics": ["vector-database", "rag"], "duration_min": 720, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-weaviate-academy", "title": "P5/M3 — Weaviate Academy: hybrid search + RAG (FREE)", "url": "https://weaviate.io/learn", "topics": ["vector-database", "rag"], "duration_min": 720, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-dlai-vector-search", "title": "P5/M3 — DeepLearning.AI Vector Databases: from Embeddings to Applications (FREE)", "url": "https://www.deeplearning.ai/short-courses/vector-databases-embeddings-applications/", "topics": ["vector-database", "rag"], "duration_min": 90, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p5-dlai-evaluating-rag", "title": "P5/M3 — DeepLearning.AI Building & Evaluating Advanced RAG (FREE)", "url": "https://www.deeplearning.ai/short-courses/building-evaluating-advanced-rag/", "topics": ["rag", "llm"], "duration_min": 90, "level": "advanced", "cost_label": "FREE"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Phase 6 — Production AI / MLOps
# ─────────────────────────────────────────────────────────────────────────
PHASE_6_MLOPS = {
    "slug": "ai-master-p6-mlops-production",
    "name": "Phase 6 — Production AI / MLOps (serving, scale, eval, observability) — 4 months",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://madewithml.com/",
    "free": True,
    "free_note": "Most resources FREE; some certs paid.",
    "default_professions": [["software-developer", 0.9], ["student", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "p6-madewithml-goku", "title": "P6/M1 — Made With ML by Goku Mohandas (FREE end-to-end MLOps)", "url": "https://madewithml.com/", "topics": ["AI", "infrastructure"], "duration_min": 3000, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p6-mlops-zoomcamp", "title": "P6/M1 — DataTalksClub MLOps Zoomcamp (FREE)", "url": "https://github.com/DataTalksClub/mlops-zoomcamp", "topics": ["AI", "infrastructure", "machine-learning"], "duration_min": 3600, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p6-llm-zoomcamp", "title": "P6/M1 — DataTalksClub LLM Zoomcamp (FREE)", "url": "https://github.com/DataTalksClub/llm-zoomcamp", "topics": ["llm", "rag"], "duration_min": 3600, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p6-wandb-educator", "title": "P6/M2 — Weights & Biases Educator courses (FREE)", "url": "https://wandb.ai/site/courses", "topics": ["machine-learning", "AI"], "duration_min": 1200, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p6-dlai-llmops", "title": "P6/M2 — DeepLearning.AI LLMOps (FREE short course)", "url": "https://www.deeplearning.ai/short-courses/llmops/", "topics": ["llm", "AI"], "duration_min": 90, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p6-vllm-tutorials", "title": "P6/M2 — vLLM Tutorials: high-throughput LLM serving (FREE)", "url": "https://docs.vllm.ai/", "topics": ["llm", "infrastructure"], "duration_min": 480, "level": "advanced", "cost_label": "FREE"},
        {"id": "p6-nvidia-triton", "title": "P6/M2 — NVIDIA Triton Inference Server tutorials (FREE)", "url": "https://developer.nvidia.com/triton-inference-server", "topics": ["AI", "infrastructure", "llm"], "duration_min": 720, "level": "advanced", "cost_label": "FREE"},
        {"id": "p6-ray-anyscale", "title": "P6/M3 — Ray + Anyscale Academy (FREE)", "url": "https://www.anyscale.com/learn", "topics": ["AI", "infrastructure", "machine-learning"], "duration_min": 1200, "level": "advanced", "cost_label": "FREE"},
        {"id": "p6-databricks-genai-cert", "title": "P6/M3 — Databricks Certified Generative AI Engineer Associate (study free)", "url": "https://www.databricks.com/learn/certification/generative-ai-engineer-associate", "topics": ["llm", "AI"], "duration_min": 3000, "level": "advanced", "cost_label": "Study FREE; exam USD 200"},
        {"id": "p6-cka", "title": "P6/M3 — CKA Certified Kubernetes Administrator (study free)", "url": "https://www.cncf.io/certification/cka/", "topics": ["kubernetes", "AI"], "duration_min": 6000, "level": "advanced", "cost_label": "Exam USD 395"},
        {"id": "p6-dlai-quality-safety", "title": "P6/M4 — DeepLearning.AI Quality and Safety for LLM Apps (FREE)", "url": "https://www.deeplearning.ai/short-courses/quality-safety-llm-applications/", "topics": ["llm", "AI"], "duration_min": 90, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p6-dlai-ai-eval", "title": "P6/M4 — DeepLearning.AI Evaluating + Debugging Generative AI (W&B, FREE)", "url": "https://www.deeplearning.ai/short-courses/evaluating-debugging-generative-ai/", "topics": ["llm", "AI"], "duration_min": 90, "level": "intermediate", "cost_label": "FREE"},
        {"id": "p6-aws-ml-eng-assoc", "title": "P6/M4 — AWS Certified Machine Learning Engineer Associate", "url": "https://aws.amazon.com/certification/certified-machine-learning-engineer-associate/", "topics": ["machine-learning", "AI"], "duration_min": 4800, "level": "intermediate", "cost_label": "Study FREE; exam USD 150"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Phase 7 — Research / Master
# ─────────────────────────────────────────────────────────────────────────
PHASE_7_RESEARCH = {
    "slug": "ai-master-p7-research",
    "name": "Phase 7 — Research / Master Level (papers, contributions, intellectual frontier) — ongoing",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://arxiv.org/list/cs.AI/recent",
    "free": True,
    "free_note": "Research community FREE.",
    "default_professions": [["software-developer", 0.85], ["student", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "p7-arxiv-cs-ai", "title": "P7 — arXiv cs.AI / cs.CL / cs.LG (daily, FREE)", "url": "https://arxiv.org/list/cs.AI/recent", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "p7-papers-with-code", "title": "P7 — Papers With Code (FREE)", "url": "https://paperswithcode.com/", "topics": ["AI", "research", "machine-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "p7-hf-daily-papers", "title": "P7 — Hugging Face Daily Papers (curated, FREE)", "url": "https://huggingface.co/papers", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "p7-distill-pub", "title": "P7 — Distill.pub interactive ML explainers (archive, FREE)", "url": "https://distill.pub/", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "p7-yannic-kilcher", "title": "P7 — Yannic Kilcher AI paper deep-dives (FREE)", "url": "https://www.youtube.com/@YannicKilcher", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "p7-karpathy-yt", "title": "P7 — Andrej Karpathy YouTube (FREE)", "url": "https://www.youtube.com/@AndrejKarpathy", "topics": ["AI", "llm"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "p7-anthropic-research", "title": "P7 — Anthropic Research papers + interpretability (FREE)", "url": "https://www.anthropic.com/research", "topics": ["AI", "research", "llm"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "p7-deepmind-research", "title": "P7 — DeepMind Research (FREE)", "url": "https://deepmind.google/research/", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "p7-openai-research", "title": "P7 — OpenAI Research (FREE)", "url": "https://openai.com/research/", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "p7-google-research-blog", "title": "P7 — Google Research Blog (FREE)", "url": "https://research.google/blog/", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "p7-meta-ai-research", "title": "P7 — Meta AI Research (FREE papers + models)", "url": "https://ai.meta.com/research/", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "p7-fastai-book-research", "title": "P7 — fast.ai book + research papers (FREE)", "url": "https://github.com/fastai/fastbook", "topics": ["AI", "research", "deep-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# PROFESSION-ADAPTED CURRICULA
# ─────────────────────────────────────────────────────────────────────────

# Doctor / Oncologist track — Clinical AI specialisation
PROFESSION_DOCTOR_AI_TRACK = {
    "slug": "doctor-ai-track-curriculum",
    "name": "Doctor's AI Skill-Up Track — Clinical AI from zero to fellowship (FREE-first)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.coursera.org/specializations/ai-healthcare",
    "free": True,
    "free_note": "Most resources FREE/audit-free.",
    "default_professions": [["doctor", 0.95], ["oncologist", 0.8], ["nurse", 0.45]],
    "url_patterns": [],
    "manifest": [
        {"id": "doc-ai-t1", "title": "Doctor Track 1 — Andrew Ng AI for Everyone (Coursera, audit FREE)", "url": "https://www.coursera.org/learn/ai-for-everyone", "topics": ["AI"], "duration_min": 600, "level": "beginner", "cost_label": "Audit FREE"},
        {"id": "doc-ai-t2", "title": "Doctor Track 2 — Stanford AI in Healthcare Specialization (Coursera audit FREE)", "url": "https://www.coursera.org/specializations/ai-healthcare", "topics": ["AI", "clinical decision support", "EHR"], "duration_min": 3600, "level": "intermediate", "cost_label": "Audit FREE"},
        {"id": "doc-ai-t3", "title": "Doctor Track 3 — DeepLearning.AI AI for Medical Diagnosis (FREE audit)", "url": "https://www.coursera.org/learn/ai-for-medical-diagnosis", "topics": ["AI", "clinical decision support", "radiology imaging"], "duration_min": 1200, "level": "intermediate", "cost_label": "Audit FREE"},
        {"id": "doc-ai-t4", "title": "Doctor Track 4 — DeepLearning.AI AI for Medical Treatment (FREE audit)", "url": "https://www.coursera.org/learn/ai-for-medical-treatment", "topics": ["AI", "clinical decision support"], "duration_min": 1200, "level": "intermediate", "cost_label": "Audit FREE"},
        {"id": "doc-ai-t5", "title": "Doctor Track 5 — WHO Academy AI for Health (FREE)", "url": "https://www.whoacademy.org/", "topics": ["AI", "clinical decision support"], "duration_min": 600, "level": "intermediate", "cost_label": "FREE"},
        {"id": "doc-ai-t6", "title": "Doctor Track 6 — Harvard HMS AI in Clinical Decision Making", "url": "https://onlinelearning.hms.harvard.edu/", "topics": ["clinical decision support", "AI"], "duration_min": 1800, "level": "intermediate", "cost_label": "USD 1,500-3,000"},
        {"id": "doc-ai-t7", "title": "Doctor Track 7 — IIIT Delhi AI in Healthcare PG Programme", "url": "https://aihc.iiitd.ac.in/", "topics": ["AI", "clinical decision support", "EHR"], "duration_min": 14400, "level": "advanced", "cost_label": "INR 2,00,000-4,00,000"},
        {"id": "doc-ai-t8", "title": "Doctor Track 8 — IIT Madras + AIIMS Clinical AI Fellowship", "url": "https://www.iitm.ac.in/", "topics": ["clinical decision support", "AI"], "duration_min": 28800, "level": "advanced", "cost_label": "Stipend-paid 1-2 yr"},
        {"id": "doc-ai-t9", "title": "Doctor Track 9 — NEJM AI journal subscription + reading routine", "url": "https://ai.nejm.org/", "topics": ["AI", "evidence-based medicine"], "duration_min": None, "level": "advanced", "cost_label": "FREE summaries; subscription for full"},
        {"id": "doc-ai-t10", "title": "Doctor Track 10 — Tata Memorial Centre AI Oncology Fellowship", "url": "https://tmc.gov.in/", "topics": ["oncology", "AI", "NCCN guidelines"], "duration_min": 28800, "level": "advanced", "cost_label": "Stipend-paid 2-yr"},
    ],
}


# Lawyer track
PROFESSION_LAWYER_AI_TRACK = {
    "slug": "lawyer-ai-track-curriculum",
    "name": "Lawyer's AI Skill-Up Track — Legal AI from zero to specialist (FREE-first)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.nls.ac.in/",
    "free": True,
    "free_note": "Most foundational free; specialty paid.",
    "default_professions": [["lawyer", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "law-ai-t1", "title": "Lawyer Track 1 — Andrew Ng AI for Everyone (Coursera audit FREE)", "url": "https://www.coursera.org/learn/ai-for-everyone", "topics": ["AI"], "duration_min": 600, "level": "beginner", "cost_label": "Audit FREE"},
        {"id": "law-ai-t2", "title": "Lawyer Track 2 — NPTEL Cyber Law (covers AI regulation, FREE)", "url": "https://nptel.ac.in/", "topics": ["case-law", "DPDP", "AI"], "duration_min": 2400, "level": "intermediate", "cost_label": "FREE; cert INR 1,000"},
        {"id": "law-ai-t3", "title": "Lawyer Track 3 — Stanford CodeX Legal Informatics (FREE research + workshops)", "url": "https://law.stanford.edu/codex-the-stanford-center-for-legal-informatics/", "topics": ["case-law", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "law-ai-t4", "title": "Lawyer Track 4 — Nyaayshala AI Law in India free webinar series", "url": "https://www.nyaayshala.com/", "topics": ["case-law", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE webinars"},
        {"id": "law-ai-t5", "title": "Lawyer Track 5 — LawSikho Diploma in Cyber Law + AI Law", "url": "https://lawsikho.com/", "topics": ["case-law", "AI", "DPDP"], "duration_min": 21600, "level": "intermediate", "cost_label": "INR 30,000-80,000"},
        {"id": "law-ai-t6", "title": "Lawyer Track 6 — Hugging Face NLP Course (for legal NLP / contract analysis, FREE)", "url": "https://huggingface.co/learn/nlp-course", "topics": ["NLP", "AI"], "duration_min": 2400, "level": "intermediate", "cost_label": "FREE"},
        {"id": "law-ai-t7", "title": "Lawyer Track 7 — IIIT Bangalore Cyber Law Certificate + NLU-Delhi", "url": "https://www.iiitb.ac.in/", "topics": ["DPDP", "case-law"], "duration_min": 1800, "level": "intermediate", "cost_label": "INR 30,000-80,000"},
        {"id": "law-ai-t8", "title": "Lawyer Track 8 — NLSIU AI & Law Programme (advanced)", "url": "https://www.nls.ac.in/", "topics": ["case-law", "AI", "DPDP"], "duration_min": 14400, "level": "advanced", "cost_label": "INR 1,50,000-3,00,000"},
        {"id": "law-ai-t9", "title": "Lawyer Track 9 — Stanford Law AI Fellowship (FREE applicant tier)", "url": "https://law.stanford.edu/", "topics": ["case-law", "AI"], "duration_min": None, "level": "advanced", "cost_label": "Stipend-paid fellowship"},
        {"id": "law-ai-t10", "title": "Lawyer Track 10 — Cyril Mangaldas Tech Law YouTube + Khaitan AI brown bags (FREE)", "url": "https://www.cyrilamarchandblogs.com/", "topics": ["case-law", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
    ],
}


# Teacher track
PROFESSION_TEACHER_AI_TRACK = {
    "slug": "teacher-ai-track-curriculum",
    "name": "Teacher's AI Skill-Up Track — AI in Classroom from zero to ISTE-certified (FREE-first)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://diksha.gov.in/",
    "free": True,
    "free_note": "All foundational + most advanced FREE.",
    "default_professions": [["teacher", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "tch-ai-t1", "title": "Teacher Track 1 — Andrew Ng Generative AI for Everyone (DeepLearning.AI FREE)", "url": "https://www.deeplearning.ai/short-courses/generative-ai-for-everyone/", "topics": ["AI"], "duration_min": 180, "level": "beginner", "cost_label": "FREE"},
        {"id": "tch-ai-t2", "title": "Teacher Track 2 — Common Sense Education AI for Teachers (FREE curriculum)", "url": "https://www.commonsense.org/education", "topics": ["AI", "lesson-plan"], "duration_min": 900, "level": "beginner", "cost_label": "FREE"},
        {"id": "tch-ai-t3", "title": "Teacher Track 3 — Google for Education Cert Educator L1+L2 (self-study FREE)", "url": "https://teachercenter.withgoogle.com/certifications", "topics": ["lesson-plan", "AI"], "duration_min": 1800, "level": "beginner", "cost_label": "Self-study FREE; exam USD 10-25"},
        {"id": "tch-ai-t4", "title": "Teacher Track 4 — Microsoft Innovative Educator (MIE) Programme (FREE)", "url": "https://education.microsoft.com/en-us/", "topics": ["lesson-plan", "AI", "copilot studio"], "duration_min": 1200, "level": "beginner", "cost_label": "FREE"},
        {"id": "tch-ai-t5", "title": "Teacher Track 5 — DIKSHA AI in Pedagogy NCERT MOOC (FREE)", "url": "https://diksha.gov.in/", "topics": ["DIKSHA", "AI", "lesson-plan", "NEP-2020"], "duration_min": 1200, "level": "intermediate", "cost_label": "FREE"},
        {"id": "tch-ai-t6", "title": "Teacher Track 6 — Apple Teacher programme (FREE iPad-AI integration)", "url": "https://www.apple.com/in/education/k12/teachers/", "topics": ["AI", "lesson-plan"], "duration_min": 600, "level": "beginner", "cost_label": "FREE"},
        {"id": "tch-ai-t7", "title": "Teacher Track 7 — MagicSchool.ai workshop (FREE tier)", "url": "https://www.magicschool.ai/", "topics": ["lesson-plan", "AI"], "duration_min": 300, "level": "beginner", "cost_label": "FREE tier"},
        {"id": "tch-ai-t8", "title": "Teacher Track 8 — AICTE Train-the-Trainer in AI/ML Faculty Development (FREE)", "url": "https://www.aicte-india.org/", "topics": ["AI", "machine-learning", "lesson-plan"], "duration_min": 2400, "level": "intermediate", "cost_label": "FREE for AICTE faculty"},
        {"id": "tch-ai-t9", "title": "Teacher Track 9 — ISTE Generative AI in Education Certification", "url": "https://iste.org/learn/certifications/iste-certification", "topics": ["AI", "lesson-plan", "NEP-2020"], "duration_min": 3000, "level": "intermediate", "cost_label": "USD 250-500"},
        {"id": "tch-ai-t10", "title": "Teacher Track 10 — IIIT-Hyderabad School AI Pedagogy Workshop", "url": "https://www.iiit.ac.in/", "topics": ["AI", "lesson-plan"], "duration_min": 1800, "level": "intermediate", "cost_label": "INR 5,000-15,000"},
    ],
}


# Farmer track
PROFESSION_FARMER_AI_TRACK = {
    "slug": "farmer-ai-track-curriculum",
    "name": "Farmer's AI Skill-Up Track — AgriTech AI from awareness to deployment (FREE govt-funded)",
    "official_domain": "various.gov.in",
    "type": "static_manifest",
    "url": "https://icar.org.in/",
    "free": True,
    "free_note": "100% FREE govt-subsidised + non-profit programmes.",
    "default_professions": [["farmer", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "frm-ai-t1", "title": "Farmer Track 1 — Kisan Suvidha App + mKisan portal (FREE govt)", "url": "https://mkisan.gov.in/", "topics": ["precision-agriculture", "agritech"], "duration_min": 60, "level": "beginner", "cost_label": "FREE"},
        {"id": "frm-ai-t2", "title": "Farmer Track 2 — IMD Meghdoot agro-weather advisory (FREE)", "url": "https://play.google.com/store/apps/details?id=com.meghdoot", "topics": ["precision-agriculture", "weather"], "duration_min": 30, "level": "beginner", "cost_label": "FREE"},
        {"id": "frm-ai-t3", "title": "Farmer Track 3 — Soil Health Card Portal — read your SHC report (FREE)", "url": "https://www.soilhealth.dac.gov.in/", "topics": ["soil-health", "precision-agriculture"], "duration_min": 60, "level": "beginner", "cost_label": "FREE"},
        {"id": "frm-ai-t4", "title": "Farmer Track 4 — KVK Farmer Training Programmes — locate your nearest of 731 (FREE)", "url": "https://kvk.icar.gov.in/", "topics": ["precision-agriculture", "agritech"], "duration_min": 1200, "level": "beginner", "cost_label": "FREE"},
        {"id": "frm-ai-t5", "title": "Farmer Track 5 — KVK Drone Pilot Training (DGCA cert, FREE + stipend)", "url": "https://kvk.icar.gov.in/", "topics": ["precision-agriculture", "AI", "agritech"], "duration_min": 4800, "level": "intermediate", "cost_label": "FREE + stipend; drone subsidy on completion"},
        {"id": "frm-ai-t6", "title": "Farmer Track 6 — ICAR-IARI Pusa AI in Agriculture Training (FREE)", "url": "https://www.iari.res.in/", "topics": ["precision-agriculture", "AI"], "duration_min": 2400, "level": "intermediate", "cost_label": "FREE for cohorts"},
        {"id": "frm-ai-t7", "title": "Farmer Track 7 — Fasal app — start with FREE FPO tier", "url": "https://www.fasal.co/", "topics": ["precision-agriculture", "AI"], "duration_min": 600, "level": "intermediate", "cost_label": "FREE FPO tier; INR 5,000-15,000/yr individual"},
        {"id": "frm-ai-t8", "title": "Farmer Track 8 — NABARD Farmer Producer Org training (form FPO, FREE)", "url": "https://www.nabard.org/", "topics": ["precision-agriculture", "AI"], "duration_min": 3600, "level": "intermediate", "cost_label": "FREE for FPO members"},
        {"id": "frm-ai-t9", "title": "Farmer Track 9 — MANAGE Hyderabad Agri-AI Extension Programme", "url": "https://www.manage.gov.in/", "topics": ["precision-agriculture", "AI"], "duration_min": 6000, "level": "intermediate", "cost_label": "FREE for cohorts"},
        {"id": "frm-ai-t10", "title": "Farmer Track 10 — ICRISAT + Wadhwani AI for Smallholder Agriculture (FREE for partners)", "url": "https://www.icrisat.org/", "topics": ["precision-agriculture", "AI"], "duration_min": 1200, "level": "advanced", "cost_label": "FREE for partner FPOs"},
    ],
}


# Accountant track
PROFESSION_ACCOUNTANT_AI_TRACK = {
    "slug": "accountant-ai-track-curriculum",
    "name": "Accountant's AI Skill-Up Track — AI in Finance + Accounting (FREE-first)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.icai.org/",
    "free": True,
    "free_note": "Most foundational FREE; ICAI certs moderate-cost.",
    "default_professions": [["accountant", 0.95], ["business-owner", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "acc-ai-t1", "title": "Accountant Track 1 — Andrew Ng AI for Everyone (Coursera audit FREE)", "url": "https://www.coursera.org/learn/ai-for-everyone", "topics": ["AI"], "duration_min": 600, "level": "beginner", "cost_label": "Audit FREE"},
        {"id": "acc-ai-t2", "title": "Accountant Track 2 — Excel/Power Query foundational (Microsoft Learn FREE)", "url": "https://learn.microsoft.com/en-us/power-query/", "topics": ["data-engineering", "power-bi", "AI"], "duration_min": 1800, "level": "beginner", "cost_label": "FREE"},
        {"id": "acc-ai-t3", "title": "Accountant Track 3 — Microsoft Power BI Fundamentals (PL-300 study FREE)", "url": "https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/", "topics": ["power-bi", "AI"], "duration_min": 2400, "level": "intermediate", "cost_label": "Study FREE; exam USD 165"},
        {"id": "acc-ai-t4", "title": "Accountant Track 4 — NPTEL AI in Finance (IIT Madras, FREE)", "url": "https://nptel.ac.in/", "topics": ["AI", "icai"], "duration_min": 2400, "level": "intermediate", "cost_label": "FREE; cert INR 1,000"},
        {"id": "acc-ai-t5", "title": "Accountant Track 5 — ICAI Big Data & Analytics for CAs", "url": "https://www.icai.org/", "topics": ["icai", "data-engineering"], "duration_min": 3000, "level": "intermediate", "cost_label": "INR 15,000-30,000"},
        {"id": "acc-ai-t6", "title": "Accountant Track 6 — ICAI Certificate Course on AI in Accounting & Auditing", "url": "https://www.icai.org/", "topics": ["icai", "AI", "gst"], "duration_min": 2400, "level": "intermediate", "cost_label": "INR 12,000-25,000"},
        {"id": "acc-ai-t7", "title": "Accountant Track 7 — Wharton AI for Business (Coursera audit FREE)", "url": "https://www.coursera.org/specializations/ai-for-business-wharton", "topics": ["AI"], "duration_min": 2400, "level": "intermediate", "cost_label": "Audit FREE"},
        {"id": "acc-ai-t8", "title": "Accountant Track 8 — NSE Academy AI in Finance (low-cost)", "url": "https://nseindia.com/learn", "topics": ["icai", "AI"], "duration_min": 1200, "level": "intermediate", "cost_label": "INR 8,000-20,000"},
        {"id": "acc-ai-t9", "title": "Accountant Track 9 — IIT-Roorkee FinTech with AI/ML (online)", "url": "https://www.iitr.ac.in/", "topics": ["icai", "AI", "machine-learning"], "duration_min": 7200, "level": "advanced", "cost_label": "INR 30,000-80,000"},
        {"id": "acc-ai-t10", "title": "Accountant Track 10 — IIM-Calcutta Business Analytics & AI (advanced)", "url": "https://www.iimcal.ac.in/", "topics": ["AI", "data-engineering"], "duration_min": 28800, "level": "advanced", "cost_label": "INR 7,00,000-15,00,000"},
    ],
}


# HR + TA track
PROFESSION_HR_TA_AI_TRACK = {
    "slug": "hr-ta-ai-track-curriculum",
    "name": "HR + Talent Acquisition AI Skill-Up Track — People Analytics + AI Recruiting (FREE-first)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.shrm.org/in",
    "free": True,
    "free_note": "Most foundational FREE; SHRM specialty paid.",
    "default_professions": [["hr-professional", 0.92], ["talent-acquisition", 0.92]],
    "url_patterns": [],
    "manifest": [
        {"id": "hr-ai-t1", "title": "HR Track 1 — Andrew Ng Generative AI for Everyone (DeepLearning.AI FREE)", "url": "https://www.deeplearning.ai/short-courses/generative-ai-for-everyone/", "topics": ["AI"], "duration_min": 180, "level": "beginner", "cost_label": "FREE"},
        {"id": "hr-ai-t2", "title": "HR Track 2 — HR.com FREE weekly webinars (AI in HR / People Analytics)", "url": "https://www.hr.com/", "topics": ["ai for hr", "people analytics"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "hr-ai-t3", "title": "HR Track 3 — LinkedIn Learning HR Analytics Essentials (FREE 1-month)", "url": "https://www.linkedin.com/learning/", "topics": ["people analytics", "hr analytics"], "duration_min": 600, "level": "intermediate", "cost_label": "FREE 1-month trial"},
        {"id": "hr-ai-t4", "title": "HR Track 4 — Excel + Power BI Fundamentals for HR (Microsoft Learn FREE)", "url": "https://learn.microsoft.com/en-us/training/", "topics": ["power-bi", "people analytics"], "duration_min": 2400, "level": "intermediate", "cost_label": "FREE"},
        {"id": "hr-ai-t5", "title": "HR Track 5 — People Matters India FREE events + AI conference", "url": "https://www.peoplematters.in/", "topics": ["ai for hr", "talent acquisition"], "duration_min": None, "level": "intermediate", "cost_label": "FREE virtual; paid in-person"},
        {"id": "hr-ai-t6", "title": "HR Track 6 — AIHR (Academy to Innovate HR) People Analytics", "url": "https://www.aihr.com/", "topics": ["people analytics", "hr analytics"], "duration_min": 7200, "level": "intermediate", "cost_label": "USD 975-2,495"},
        {"id": "hr-ai-t7", "title": "HR Track 7 — SHRM India AI in HR Specialty Credential", "url": "https://www.shrm.org/in/credentials/specialty-credentials/ai-in-hr", "topics": ["ai for hr", "ai recruiting"], "duration_min": 4800, "level": "intermediate", "cost_label": "USD 950 (~INR 80,000)"},
        {"id": "hr-ai-t8", "title": "HR Track 8 — TISS HR Analytics + AI (executive ed)", "url": "https://www.tiss.edu/", "topics": ["people analytics", "hr analytics"], "duration_min": 7200, "level": "intermediate", "cost_label": "INR 60,000-1,50,000"},
        {"id": "hr-ai-t9", "title": "HR Track 9 — IIM Indore HR Analytics & AI (executive)", "url": "https://www.iimidr.ac.in/", "topics": ["people analytics", "AI"], "duration_min": 14400, "level": "advanced", "cost_label": "INR 1,50,000-3,00,000"},
        {"id": "hr-ai-t10", "title": "HR Track 10 — XLRI People Analytics with AI Programme", "url": "https://www.xlri.ac.in/", "topics": ["people analytics", "AI"], "duration_min": 14400, "level": "advanced", "cost_label": "INR 1,80,000-3,50,000"},
    ],
}


# Business Owner track
PROFESSION_BIZ_OWNER_AI_TRACK = {
    "slug": "business-owner-ai-track-curriculum",
    "name": "Business Owner's AI Skill-Up Track — AI for SMB/MSME from awareness to deployment",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.deeplearning.ai/short-courses/generative-ai-for-everyone/",
    "free": True,
    "free_note": "Most foundational FREE; deeper paid.",
    "default_professions": [["business-owner", 0.92]],
    "url_patterns": [],
    "manifest": [
        {"id": "biz-ai-t1", "title": "BizOwner Track 1 — Andrew Ng Generative AI for Everyone (FREE)", "url": "https://www.deeplearning.ai/short-courses/generative-ai-for-everyone/", "topics": ["llm", "AI"], "duration_min": 180, "level": "beginner", "cost_label": "FREE"},
        {"id": "biz-ai-t2", "title": "BizOwner Track 2 — Microsoft AI Business School (FREE)", "url": "https://www.microsoft.com/en-us/ai/ai-business-school", "topics": ["AI", "msme"], "duration_min": 1200, "level": "intermediate", "cost_label": "FREE"},
        {"id": "biz-ai-t3", "title": "BizOwner Track 3 — Grow with Google Digital Unlocked (FREE Indian SME)", "url": "https://grow.google/intl/en_in/", "topics": ["AI"], "duration_min": 1800, "level": "beginner", "cost_label": "FREE for Indian SMEs"},
        {"id": "biz-ai-t4", "title": "BizOwner Track 4 — TiE Bangalore AI for Founders monthly meetup (FREE)", "url": "https://bangalore.tie.org/", "topics": ["AI", "msme"], "duration_min": 240, "level": "intermediate", "cost_label": "FREE for TiE members"},
        {"id": "biz-ai-t5", "title": "BizOwner Track 5 — Wadhwani Foundation AI for Indian SMBs", "url": "https://www.wfglobal.org/", "topics": ["AI", "msme"], "duration_min": 1800, "level": "intermediate", "cost_label": "FREE for partner SMBs"},
        {"id": "biz-ai-t6", "title": "BizOwner Track 6 — NSIC AI/Digital Skilling for MSMEs (FREE)", "url": "https://www.nsic.co.in/", "topics": ["AI", "msme", "udyam"], "duration_min": 2400, "level": "intermediate", "cost_label": "FREE under MoMSME"},
        {"id": "biz-ai-t7", "title": "BizOwner Track 7 — NASSCOM Startup AI Programme (accelerator)", "url": "https://nasscom.in/", "topics": ["AI", "msme"], "duration_min": None, "level": "advanced", "cost_label": "FREE for shortlisted startups"},
        {"id": "biz-ai-t8", "title": "BizOwner Track 8 — Wharton AI for Business Specialization (Coursera audit FREE)", "url": "https://www.coursera.org/specializations/ai-for-business-wharton", "topics": ["AI", "msme"], "duration_min": 2400, "level": "intermediate", "cost_label": "Audit FREE"},
        {"id": "biz-ai-t9", "title": "BizOwner Track 9 — ISB Applied AI & GenAI Programme", "url": "https://www.isb.edu/", "topics": ["AI", "llm"], "duration_min": 14400, "level": "intermediate", "cost_label": "INR 1,50,000-3,00,000"},
        {"id": "biz-ai-t10", "title": "BizOwner Track 10 — IIM-Ahmedabad Owner-Manager Programme + AI Track", "url": "https://www.iima.ac.in/", "topics": ["AI", "msme"], "duration_min": 28800, "level": "advanced", "cost_label": "INR 15,00,000-25,00,000"},
    ],
}


# Government Employee track
PROFESSION_GOV_EMP_AI_TRACK = {
    "slug": "gov-employee-ai-track-curriculum",
    "name": "Government Employee AI Skill-Up Track — AI for Public Service (FREE govt-funded)",
    "official_domain": "various.gov.in",
    "type": "static_manifest",
    "url": "https://igotkarmayogi.gov.in/",
    "free": True,
    "free_note": "100% FREE for govt employees.",
    "default_professions": [["government-employee", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "gov-ai-t1", "title": "GovEmp Track 1 — iGOT Karmayogi AI for Public Service (FREE mandatory)", "url": "https://igotkarmayogi.gov.in/", "topics": ["AI", "karmayogi", "igot"], "duration_min": 600, "level": "beginner", "cost_label": "FREE"},
        {"id": "gov-ai-t2", "title": "GovEmp Track 2 — iGOT Karmayogi Cybersecurity for Officers (FREE)", "url": "https://igotkarmayogi.gov.in/", "topics": ["AI", "karmayogi", "cybersecurity"], "duration_min": 1200, "level": "intermediate", "cost_label": "FREE"},
        {"id": "gov-ai-t3", "title": "GovEmp Track 3 — eOffice + DigiLocker + GeM mastery (FREE)", "url": "https://eoffice.gov.in/", "topics": ["AI", "karmayogi"], "duration_min": 1200, "level": "beginner", "cost_label": "FREE"},
        {"id": "gov-ai-t4", "title": "GovEmp Track 4 — OECD AI for Public Sector Toolkit (FREE)", "url": "https://oecd.ai/", "topics": ["AI", "karmayogi"], "duration_min": 1800, "level": "intermediate", "cost_label": "FREE"},
        {"id": "gov-ai-t5", "title": "GovEmp Track 5 — World Bank GovTech AI training (FREE)", "url": "https://www.worldbank.org/en/programs/govtech", "topics": ["AI", "karmayogi"], "duration_min": 1800, "level": "intermediate", "cost_label": "FREE for govt officials"},
        {"id": "gov-ai-t6", "title": "GovEmp Track 6 — NUDM India Data Management Programme (FREE)", "url": "https://www.indiastack.org/", "topics": ["AI", "data-engineering", "karmayogi"], "duration_min": 3000, "level": "intermediate", "cost_label": "FREE"},
        {"id": "gov-ai-t7", "title": "GovEmp Track 7 — UN DESA AI in Public Administration (FREE)", "url": "https://publicadministration.un.org/", "topics": ["AI", "karmayogi"], "duration_min": 1200, "level": "intermediate", "cost_label": "FREE"},
        {"id": "gov-ai-t8", "title": "GovEmp Track 8 — LBSNAA Foundation Course AI module (in-service)", "url": "https://www.lbsnaa.gov.in/", "topics": ["karmayogi", "AI"], "duration_min": 3600, "level": "intermediate", "cost_label": "FREE for in-service officers"},
        {"id": "gov-ai-t9", "title": "GovEmp Track 9 — ISB Mohali Government + AI Programme (Bharti Institute)", "url": "https://www.isb.edu/en/research-thought-leadership/centres-of-excellence/bharti-institute-of-public-policy.html", "topics": ["AI", "karmayogi"], "duration_min": 14400, "level": "advanced", "cost_label": "INR 80,000-2,50,000"},
        {"id": "gov-ai-t10", "title": "GovEmp Track 10 — Harvard Kennedy School AI for Government Leaders", "url": "https://www.hks.harvard.edu/educational-programs/executive-education", "topics": ["AI", "karmayogi"], "duration_min": 14400, "level": "advanced", "cost_label": "USD 10,000-20,000"},
    ],
}


# Nurse track
PROFESSION_NURSE_AI_TRACK = {
    "slug": "nurse-ai-track-curriculum",
    "name": "Nurse's AI Skill-Up Track — Clinical AI for Nursing (FREE govt + non-profit)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://nhm.gov.in/",
    "free": True,
    "free_note": "All FREE for nurses + ASHA workers.",
    "default_professions": [["nurse", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "nrs-ai-t1", "title": "Nurse Track 1 — Andrew Ng AI for Everyone (Coursera audit FREE)", "url": "https://www.coursera.org/learn/ai-for-everyone", "topics": ["AI"], "duration_min": 600, "level": "beginner", "cost_label": "Audit FREE"},
        {"id": "nrs-ai-t2", "title": "Nurse Track 2 — ABDM HPR registration + use (FREE)", "url": "https://hpr.abdm.gov.in/", "topics": ["EHR", "ABDM"], "duration_min": 240, "level": "beginner", "cost_label": "FREE"},
        {"id": "nrs-ai-t3", "title": "Nurse Track 3 — ASHA Suvidha App + ANMOL (FREE govt)", "url": "https://anmol.nhp.gov.in/", "topics": ["ANM training", "bedside nursing"], "duration_min": 600, "level": "beginner", "cost_label": "FREE"},
        {"id": "nrs-ai-t4", "title": "Nurse Track 4 — WHO Academy AI for Health (FREE)", "url": "https://www.whoacademy.org/", "topics": ["AI", "clinical decision support"], "duration_min": 600, "level": "intermediate", "cost_label": "FREE"},
        {"id": "nrs-ai-t5", "title": "Nurse Track 5 — Stanford AI in Healthcare audit (FREE)", "url": "https://www.coursera.org/specializations/ai-healthcare", "topics": ["AI", "clinical decision support"], "duration_min": 3600, "level": "intermediate", "cost_label": "Audit FREE"},
        {"id": "nrs-ai-t6", "title": "Nurse Track 6 — Neonatal & Pediatric AI Nursing IGNOU + INC", "url": "https://ignou.ac.in/", "topics": ["bedside nursing", "AI"], "duration_min": 7200, "level": "intermediate", "cost_label": "INR 12,000-25,000"},
        {"id": "nrs-ai-t7", "title": "Nurse Track 7 — Epi Info CDC tutorials (FREE)", "url": "https://www.cdc.gov/epiinfo/", "topics": ["bedside nursing", "patient monitoring"], "duration_min": 600, "level": "intermediate", "cost_label": "FREE"},
        {"id": "nrs-ai-t8", "title": "Nurse Track 8 — AIIMS ICU Nursing Fellowship (stipend-paid)", "url": "https://www.aiims.edu/", "topics": ["ICU nursing", "patient monitoring"], "duration_min": 28800, "level": "advanced", "cost_label": "Stipend-paid 1-2 yr"},
        {"id": "nrs-ai-t9", "title": "Nurse Track 9 — M.Sc Nursing AI specialisation (INC accredited)", "url": "https://www.indiannursingcouncil.org/programme-details", "topics": ["bedside nursing", "ICU nursing", "AI"], "duration_min": 100000, "level": "advanced", "cost_label": "Govt: INR 40,000/yr; Private: INR 2-5L/yr"},
        {"id": "nrs-ai-t10", "title": "Nurse Track 10 — ICMR Bioinformatics + AI Training (advanced research)", "url": "https://main.icmr.nic.in/", "topics": ["AI", "machine-learning"], "duration_min": 14400, "level": "advanced", "cost_label": "FREE for ICMR fellows"},
    ],
}


# Student track — direct to-master path
PROFESSION_STUDENT_AI_TRACK = {
    "slug": "student-ai-master-track",
    "name": "Student's AI-to-Master Track — 24-month roadmap from zero to industry-ready (FREE-first)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://course.fast.ai/",
    "free": True,
    "free_note": "All FREE.",
    "default_professions": [["student", 0.95], ["software-developer", 0.65]],
    "url_patterns": [],
    "manifest": [
        {"id": "std-ai-t1", "title": "Student Master Track Month 1 — Harvard CS50 + Mosh Python (FREE)", "url": "https://cs50.harvard.edu/x/", "topics": ["python", "computer-science"], "duration_min": 6000, "level": "beginner", "cost_label": "FREE"},
        {"id": "std-ai-t2", "title": "Student Master Track Month 2-3 — 3B1B Math + Khan Linear Algebra (FREE)", "url": "https://www.3blue1brown.com/", "topics": ["math", "linear-algebra", "calculus"], "duration_min": 3000, "level": "beginner", "cost_label": "FREE"},
        {"id": "std-ai-t3", "title": "Student Master Track Month 4-5 — Andrew Ng ML Specialization (FREE audit)", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "topics": ["machine-learning"], "duration_min": 3600, "level": "intermediate", "cost_label": "Audit FREE"},
        {"id": "std-ai-t4", "title": "Student Master Track Month 6-9 — fast.ai + DeepLearning.AI DL Specialization (FREE)", "url": "https://course.fast.ai/", "topics": ["deep-learning"], "duration_min": 6000, "level": "intermediate", "cost_label": "FREE"},
        {"id": "std-ai-t5", "title": "Student Master Track Month 10-12 — Andrej Karpathy Zero-to-Hero (FREE)", "url": "https://karpathy.ai/zero-to-hero.html", "topics": ["deep-learning", "llm"], "duration_min": 1500, "level": "advanced", "cost_label": "FREE"},
        {"id": "std-ai-t6", "title": "Student Master Track Month 12-14 — Stanford CS224N + CS231N (FREE)", "url": "https://web.stanford.edu/class/cs224n/", "topics": ["NLP", "computer-vision"], "duration_min": 6000, "level": "advanced", "cost_label": "FREE"},
        {"id": "std-ai-t7", "title": "Student Master Track Month 14-17 — HF NLP + Agents + DeepLearning.AI short courses (FREE)", "url": "https://huggingface.co/learn/nlp-course", "topics": ["NLP", "agents", "llm"], "duration_min": 6000, "level": "intermediate", "cost_label": "FREE"},
        {"id": "std-ai-t8", "title": "Student Master Track Month 18-20 — Build LangChain RAG project (FREE)", "url": "https://academy.langchain.com/", "topics": ["rag", "agents", "llm"], "duration_min": 3600, "level": "intermediate", "cost_label": "FREE"},
        {"id": "std-ai-t9", "title": "Student Master Track Month 21-23 — Made With ML + MLOps Zoomcamp (FREE)", "url": "https://madewithml.com/", "topics": ["AI", "infrastructure"], "duration_min": 6000, "level": "intermediate", "cost_label": "FREE"},
        {"id": "std-ai-t10", "title": "Student Master Track Month 24 — First Kaggle Gold + arXiv reading routine + GitHub portfolio", "url": "https://www.kaggle.com/", "topics": ["AI", "machine-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "std-ai-t11", "title": "Student BONUS — IndiaAI Fellowship application (4 LPA stipend)", "url": "https://indiaai.gov.in/", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE + INR 4 LPA stipend"},
        {"id": "std-ai-t12", "title": "Student BONUS — Apply to MITACS Globalink / DAAD / Erasmus Mundus AI fellowships", "url": "https://www.mitacs.ca/en/programs/globalink", "topics": ["AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE + stipend"},
    ],
}


# Plan
ROADMAP_PLAN = [
    PHASE_0_FOUNDATIONS,
    PHASE_1_CLASSICAL_ML,
    PHASE_2_DEEP_LEARNING,
    PHASE_3_SPECIALISATIONS,
    PHASE_4_GENAI_LLMS,
    PHASE_5_AGENTIC_RAG,
    PHASE_6_MLOPS,
    PHASE_7_RESEARCH,
    PROFESSION_DOCTOR_AI_TRACK,
    PROFESSION_LAWYER_AI_TRACK,
    PROFESSION_TEACHER_AI_TRACK,
    PROFESSION_FARMER_AI_TRACK,
    PROFESSION_ACCOUNTANT_AI_TRACK,
    PROFESSION_HR_TA_AI_TRACK,
    PROFESSION_BIZ_OWNER_AI_TRACK,
    PROFESSION_GOV_EMP_AI_TRACK,
    PROFESSION_NURSE_AI_TRACK,
    PROFESSION_STUDENT_AI_TRACK,
]


def main() -> int:
    d = json.loads(STREAMS.read_text(encoding="utf-8"))
    roadmap_stream = d["streams"].get("roadmap_node")
    if not roadmap_stream:
        print("! roadmap_node stream missing -- creating")
        d["streams"]["roadmap_node"] = {"_doc": "Per-profession AI skill-up roadmaps", "sources": []}
        roadmap_stream = d["streams"]["roadmap_node"]
    sources = roadmap_stream.setdefault("sources", [])
    added = 0
    for block in ROADMAP_PLAN:
        if any(s.get("slug") == block["slug"] for s in sources):
            print(f"  - skip {block['slug']} (already present)")
            continue
        sources.append(block)
        items = len(block.get("manifest", []))
        print(f"  + roadmap_node/{block['slug']} ({items} items)")
        added += items
    STREAMS.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n=== Roadmaps + per-profession tracks: added {added} items across {len(ROADMAP_PLAN)} sources ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
