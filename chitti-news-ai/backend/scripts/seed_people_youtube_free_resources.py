"""
Sire: "you should make section of people to follow, youtube channels,
courses but free resources..."

Adds THREE new stream kinds with their own dedicated tabs:
  - person         (People to Follow)
  - channel        (YouTube + Podcast channels)
  - free_resource  (Free datasets, models, books, blogs, tools)

Plus updates streams_sources.json to seed them rich.
"""
from __future__ import annotations
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
STREAMS = DATA / "streams_sources.json"


# ─────────────────────────────────────────────────────────────────────────
# PERSON stream — People to Follow (5 sub-manifests by category)
# ─────────────────────────────────────────────────────────────────────────

PERSON_INDIAN_LEADERS = {
    "slug": "person-indian-ai-leaders",
    "name": "People to Follow — Indian AI Leaders + Researchers",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.linkedin.com/in/krishnaik06/",
    "free": True,
    "free_note": "All free to follow on LinkedIn/Twitter/YouTube.",
    "default_professions": [["software-developer", 0.7], ["student", 0.7], ["business-owner", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "ppl-in-01", "title": "Krish Naik — India's biggest AI YouTuber (1M+ subs) + LinkedIn", "url": "https://www.linkedin.com/in/krishnaik06/", "topics": ["AI", "machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-in-02", "title": "Sahil Chand — VP Engineering Krutrim, ex-Meta AI", "url": "https://www.linkedin.com/in/sahilchand/", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-in-03", "title": "Pratyush Kumar — Co-founder AI4Bharat, leader of Indic LLMs", "url": "https://pratyushkumar.com/", "topics": ["llm", "NLP", "AI", "vernacular"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-in-04", "title": "Mitesh Khapra — IIT Madras, NPTEL Deep Learning instructor", "url": "https://www.cse.iitm.ac.in/~miteshk/", "topics": ["deep-learning", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-in-05", "title": "Pushpak Bhattacharyya — IIT Bombay, NLP pioneer in India", "url": "https://www.cse.iitb.ac.in/~pb/", "topics": ["NLP", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-in-06", "title": "Balaraman Ravindran — IIT Madras, NPTEL RL legend", "url": "https://www.cse.iitm.ac.in/~ravi/", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-in-07", "title": "Vineeth Balasubramanian — IIT Hyderabad, CV + Interpretability", "url": "https://www.iith.ac.in/~vineethnb/", "topics": ["computer-vision", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-in-08", "title": "Bhavin Turakhia — entrepreneur, AI in Indian SMB tools (Zeta/Flock)", "url": "https://www.linkedin.com/in/bhavinturakhia/", "topics": ["AI", "msme"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-in-09", "title": "Karan Goel — Sarvam AI co-founder, ex-Apple Foundation Models", "url": "https://krandiash.github.io/", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-in-10", "title": "Pranesh Bhargava — Krutrim AI Lead", "url": "https://www.linkedin.com/in/pranesh-bhargava-72b0bb1/", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-in-11", "title": "Soumen Chakrabarti — IIT Bombay, ML pioneer (PageRank-era)", "url": "https://www.cse.iitb.ac.in/~soumen/", "topics": ["machine-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-in-12", "title": "Soundararajan Krishnan — Research Director, ex-Adobe AI Labs", "url": "https://www.linkedin.com/in/krishnansoundararajan/", "topics": ["AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-in-13", "title": "Reshma Saujani — Girls Who Code founder, Indian-origin", "url": "https://www.linkedin.com/in/reshmasaujani/", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-in-14", "title": "Aravind Srinivas — Perplexity AI CEO + founder", "url": "https://twitter.com/AravSrinivas", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-in-15", "title": "Vinod Khosla — Khosla Ventures, AI investor + thought leader", "url": "https://twitter.com/vkhosla", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-in-16", "title": "Mayank Bidawatka — co-founder Koo, AI for vernacular content", "url": "https://www.linkedin.com/in/mayankbidawatka/", "topics": ["AI", "vernacular"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
    ],
}


PERSON_GLOBAL_RESEARCH = {
    "slug": "person-global-ai-research-giants",
    "name": "People to Follow — Global AI Research Giants",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://twitter.com/karpathy",
    "free": True,
    "free_note": "All free.",
    "default_professions": [["software-developer", 0.7], ["student", 0.65]],
    "url_patterns": [],
    "manifest": [
        {"id": "ppl-rs-01", "title": "Andrej Karpathy — ex-Tesla AI / OpenAI, best DL educator", "url": "https://twitter.com/karpathy", "topics": ["llm", "deep-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-02", "title": "Yann LeCun — Meta Chief AI Scientist, CNN inventor, Turing Award", "url": "https://twitter.com/ylecun", "topics": ["deep-learning", "AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-03", "title": "Geoff Hinton — godfather of DL, Turing Award", "url": "https://www.cs.toronto.edu/~hinton/", "topics": ["deep-learning", "AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-04", "title": "Yoshua Bengio — Mila founder, Turing Award, AI safety advocate", "url": "https://yoshuabengio.org/", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-05", "title": "Ilya Sutskever — SSI co-founder, ex-OpenAI Chief Scientist", "url": "https://www.ssi.inc/", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-06", "title": "Demis Hassabis — Google DeepMind CEO, Turing Award", "url": "https://twitter.com/demishassabis", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-07", "title": "Dario Amodei — Anthropic CEO, safety-first AI", "url": "https://twitter.com/DarioAmodei", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-08", "title": "Daniela Amodei — Anthropic President", "url": "https://twitter.com/DanielaAmodei", "topics": ["AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-09", "title": "Sam Altman — OpenAI CEO", "url": "https://twitter.com/sama", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-rs-10", "title": "Mira Murati — Thinking Machines Lab CEO, ex-OpenAI CTO", "url": "https://twitter.com/miramurati", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-11", "title": "Aidan Gomez — Cohere co-founder, Attention is All You Need co-author", "url": "https://twitter.com/aidangomez", "topics": ["llm", "NLP"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-12", "title": "Stuart Russell — Berkeley, AI safety + Human Compatible book", "url": "https://people.eecs.berkeley.edu/~russell/", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-13", "title": "Fei-Fei Li — Stanford, ImageNet creator, World Labs co-founder", "url": "https://profiles.stanford.edu/fei-fei-li", "topics": ["computer-vision", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-14", "title": "Jeff Dean — Google Chief Scientist, MapReduce + TensorFlow", "url": "https://research.google/people/jeffrey-dean/", "topics": ["AI", "infrastructure"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-15", "title": "Sara Hooker — Cohere For AI, open research", "url": "https://www.sarahooker.me/", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-rs-16", "title": "Noam Shazeer — Google, Transformer architecture co-author, Character.AI", "url": "https://research.google/people/noam-shazeer/", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
    ],
}


PERSON_EDUCATORS = {
    "slug": "person-ai-educators-builders",
    "name": "People to Follow — Educators + Open-Source Builders",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://twitter.com/AndrewYNg",
    "free": True,
    "free_note": "All FREE.",
    "default_professions": [["software-developer", 0.75], ["student", 0.85], ["teacher", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "ppl-ed-01", "title": "Andrew Ng — DeepLearning.AI founder, Coursera co-founder", "url": "https://twitter.com/AndrewYNg", "topics": ["AI", "machine-learning"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "ppl-ed-02", "title": "Sebastian Raschka — best LLM educator alive, Substack + Twitter", "url": "https://magazine.sebastianraschka.com/", "topics": ["llm", "machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-ed-03", "title": "Jeremy Howard — fast.ai co-founder, top-down DL teacher", "url": "https://twitter.com/jeremyphoward", "topics": ["deep-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-ed-04", "title": "Rachel Thomas — fast.ai co-founder, AI ethics + healthcare", "url": "https://twitter.com/math_rachel", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-ed-05", "title": "Chip Huyen — Designing ML Systems, production AI expert", "url": "https://huyenchip.com/", "topics": ["AI", "infrastructure"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-ed-06", "title": "Maxime Labonne — LLM fine-tuning expert, Llama mergekit", "url": "https://www.linkedin.com/in/maxime-labonne/", "topics": ["llm", "fine-tuning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-ed-07", "title": "Philipp Schmid — Hugging Face Tech Lead, blog + tutorials", "url": "https://www.philschmid.de/", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-ed-08", "title": "Lilian Weng — ex-OpenAI Safety, Lil'Log writer", "url": "https://lilianweng.github.io/", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-ed-09", "title": "Aleksa Gordić — The AI Epiphany YouTuber, ex-DeepMind", "url": "https://www.youtube.com/@TheAIEpiphany", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-ed-10", "title": "Yannic Kilcher — best paper-review YouTuber", "url": "https://www.youtube.com/@YannicKilcher", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-ed-11", "title": "Allie K Miller — AI for Business LinkedIn voice", "url": "https://www.linkedin.com/in/alliekmiller/", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-ed-12", "title": "Tim Dettmers — bitsandbytes creator, QLoRA inventor", "url": "https://timdettmers.com/", "topics": ["llm", "fine-tuning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ppl-ed-13", "title": "Letitia Parcalabescu — AI Coffee Break YouTuber, multimodal AI", "url": "https://www.youtube.com/@AICoffeeBreak", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-ed-14", "title": "Harrison Chase — LangChain co-founder", "url": "https://twitter.com/hwchase17", "topics": ["agents", "llm"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-ed-15", "title": "Jerry Liu — LlamaIndex co-founder", "url": "https://twitter.com/jerryjliu0", "topics": ["rag", "llm"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ppl-ed-16", "title": "Soumith Chintala — PyTorch creator, Meta AI", "url": "https://twitter.com/soumithchintala", "topics": ["pytorch", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# CHANNEL stream — YouTube + Podcasts
# ─────────────────────────────────────────────────────────────────────────

CHANNEL_INDIAN_AI = {
    "slug": "channel-indian-ai-youtube",
    "name": "YouTube — Indian AI Educators (Hindi + English)",
    "official_domain": "youtube.com",
    "type": "static_manifest",
    "url": "https://www.youtube.com/@krishnaik06",
    "free": True,
    "free_note": "100% FREE.",
    "default_professions": [["software-developer", 0.75], ["student", 0.85]],
    "url_patterns": [],
    "manifest": [
        {"id": "ch-in-01", "title": "Krish Naik — India's #1 AI YouTuber, end-to-end ML/DL/GenAI/Agents (Hindi+English)", "url": "https://www.youtube.com/@krishnaik06", "topics": ["machine-learning", "deep-learning", "AI", "llm", "agents"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-in-02", "title": "codebasics (Dhaval Patel) — ML/DS roadmap full course (Hindi+English)", "url": "https://www.youtube.com/@codebasics", "topics": ["machine-learning", "data-engineering"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "ch-in-03", "title": "Apna College — Python + ML in Hindi (free playlists)", "url": "https://www.youtube.com/@ApnaCollegeOfficial", "topics": ["machine-learning", "AI", "python"], "duration_min": None, "level": "beginner", "cost_label": "FREE (Hindi)"},
        {"id": "ch-in-04", "title": "CodeWithHarry — AI/ML + Python in Hindi", "url": "https://www.youtube.com/@CodeWithHarry", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE (Hindi)"},
        {"id": "ch-in-05", "title": "Telusko (Navin Reddy) — Python + AI/ML (English+Hindi)", "url": "https://www.youtube.com/@Telusko", "topics": ["machine-learning", "AI", "python"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "ch-in-06", "title": "WsCube Tech — AI/ML in Hindi (large catalog)", "url": "https://www.youtube.com/@WsCubeTech", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE (Hindi)"},
        {"id": "ch-in-07", "title": "Campus X — 100-day Machine Learning Course in Hindi (free)", "url": "https://www.youtube.com/@campusx-official", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE (Hindi)"},
        {"id": "ch-in-08", "title": "iNeuron — Full Stack Data Science + GenAI / Agents (free YouTube)", "url": "https://www.youtube.com/@iNeuroniNtelligence", "topics": ["machine-learning", "AI", "agents"], "duration_min": None, "level": "intermediate", "cost_label": "FREE on YouTube"},
        {"id": "ch-in-09", "title": "Hitesh Choudhary — Python + AI + GenAI Hindi", "url": "https://www.youtube.com/@HiteshCodeLab", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-in-10", "title": "GeeksforGeeks — AI/ML tutorials channel", "url": "https://www.youtube.com/@GeeksforGeeksVideos", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "ch-in-11", "title": "Sahil & Sarra — startup builders, AI agent tutorials", "url": "https://www.youtube.com/@SahilSarra", "topics": ["agents", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-in-12", "title": "GreatLearning — IIT-Bangalore + UT Austin AI/ML clips", "url": "https://www.youtube.com/@GreatLearning", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE clips; paid programs"},
        {"id": "ch-in-13", "title": "Saurabh Shukla AI YouTube — practical agent builds", "url": "https://www.youtube.com/@1littlecoder", "topics": ["llm", "agents", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-in-14", "title": "SimpliLearn — AI Engineer Master clips (paid programs)", "url": "https://www.youtube.com/@SimplilearnOfficial", "topics": ["AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE clips"},
        {"id": "ch-in-15", "title": "Edureka — ML/DL/AI tutorials catalog", "url": "https://www.youtube.com/@edurekaIN", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
    ],
}


CHANNEL_GLOBAL_EDUCATORS = {
    "slug": "channel-global-ai-educators-youtube",
    "name": "YouTube — Global AI Educators + Paper Reviewers",
    "official_domain": "youtube.com",
    "type": "static_manifest",
    "url": "https://www.youtube.com/@AndrejKarpathy",
    "free": True,
    "free_note": "100% FREE.",
    "default_professions": [["software-developer", 0.8], ["student", 0.8]],
    "url_patterns": [],
    "manifest": [
        {"id": "ch-gl-01", "title": "Andrej Karpathy — Zero-to-Hero + Build GPT/Tokenizer from scratch", "url": "https://www.youtube.com/@AndrejKarpathy", "topics": ["llm", "deep-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-gl-02", "title": "3Blue1Brown (Grant Sanderson) — neural networks visualised + math foundations", "url": "https://www.youtube.com/@3blue1brown", "topics": ["deep-learning", "math"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "ch-gl-03", "title": "StatQuest with Josh Starmer — ML statistics visualised", "url": "https://www.youtube.com/@statquest", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "ch-gl-04", "title": "Two Minute Papers — every paper explained in 2 min", "url": "https://www.youtube.com/@TwoMinutePapers", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-gl-05", "title": "Yannic Kilcher — AI paper deep-dives", "url": "https://www.youtube.com/@YannicKilcher", "topics": ["AI", "llm"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-gl-06", "title": "Lex Fridman — long-form AI conversations", "url": "https://www.youtube.com/@lexfridman", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-gl-07", "title": "sentdex — Python AI tutorials (decade of free content)", "url": "https://www.youtube.com/@sentdex", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-gl-08", "title": "DeepLearning.AI YouTube — Andrew Ng + Heroes of DL interviews", "url": "https://www.youtube.com/@Deeplearningai", "topics": ["deep-learning", "machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-gl-09", "title": "Daniel Bourke — practical PyTorch + portfolio building", "url": "https://www.youtube.com/@mrdbourke", "topics": ["deep-learning", "pytorch"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-gl-10", "title": "deeplizard — ML/DL/RL fundamentals", "url": "https://www.youtube.com/@deeplizard", "topics": ["deep-learning", "machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-gl-11", "title": "Patrick Loeber — Python AI tutorials", "url": "https://www.youtube.com/@patloeber", "topics": ["AI", "python"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-gl-12", "title": "AI Coffee Break with Letitia — multi-modal AI explained", "url": "https://www.youtube.com/@AICoffeeBreak", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-gl-13", "title": "The AI Epiphany (Aleksa Gordić) — technical paper reviews", "url": "https://www.youtube.com/@TheAIEpiphany", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-gl-14", "title": "Computerphile — University of Nottingham CS + AI explainers", "url": "https://www.youtube.com/@Computerphile", "topics": ["AI", "computer-science"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-gl-15", "title": "freeCodeCamp — full ML/DL/TF/LangChain courses (10-20 hour videos)", "url": "https://www.youtube.com/@freecodecamp", "topics": ["AI", "machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-gl-16", "title": "Outlier (Welch Labs) — visual math + AI", "url": "https://www.youtube.com/@WelchLabsVideo", "topics": ["math", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
    ],
}


CHANNEL_VENDOR = {
    "slug": "channel-vendor-ai-youtube",
    "name": "YouTube — Vendor Channels (HF · NVIDIA · Anthropic · OpenAI · Google · Microsoft · Meta · IBM)",
    "official_domain": "youtube.com",
    "type": "static_manifest",
    "url": "https://www.youtube.com/@HuggingFace",
    "free": True,
    "free_note": "100% FREE.",
    "default_professions": [["software-developer", 0.85], ["student", 0.5]],
    "url_patterns": [],
    "manifest": [
        {"id": "ch-vd-01", "title": "Hugging Face YouTube — model + library tutorials", "url": "https://www.youtube.com/@HuggingFace", "topics": ["llm", "NLP", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-vd-02", "title": "NVIDIA Developer — DLI workshops + technical demos", "url": "https://www.youtube.com/@NVIDIADeveloper", "topics": ["AI", "deep-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-vd-03", "title": "Anthropic — Claude tutorials + research talks", "url": "https://www.youtube.com/@anthropic-ai", "topics": ["llm", "agents", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-vd-04", "title": "OpenAI — GPT updates + Dev Day talks", "url": "https://www.youtube.com/@OpenAI", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-vd-05", "title": "Google AI — research + product launches", "url": "https://www.youtube.com/@Google", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-vd-06", "title": "Microsoft AI — Build conference talks + Copilot tutorials", "url": "https://www.youtube.com/@Microsoft", "topics": ["AI", "copilot studio"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-vd-07", "title": "Meta AI — Llama + research talks", "url": "https://www.youtube.com/@MetaAI", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-vd-08", "title": "IBM Technology — AI/ML explainers (excellent format)", "url": "https://www.youtube.com/@IBMTechnology", "topics": ["AI", "machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-vd-09", "title": "LangChain — agent + RAG tutorials", "url": "https://www.youtube.com/@LangChain", "topics": ["agents", "rag", "llm"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-vd-10", "title": "Weights & Biases — experiment tracking + GenAI", "url": "https://www.youtube.com/@WeightsBiases", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-vd-11", "title": "Pinecone — vector DB + RAG tutorials", "url": "https://www.youtube.com/@pinecone-io", "topics": ["vector-database", "rag", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "ch-vd-12", "title": "DeepMind — research lectures + Nobel talks", "url": "https://www.youtube.com/@Google_DeepMind", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-vd-13", "title": "Cohere For AI — open research + LLM tutorials", "url": "https://www.youtube.com/@Cohere", "topics": ["llm", "AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-vd-14", "title": "AWS AI/ML — re:Invent talks + Bedrock tutorials", "url": "https://www.youtube.com/@amazonwebservices", "topics": ["AI", "cloud-computing"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
    ],
}


CHANNEL_STANFORD_MIT_ACADEMIC = {
    "slug": "channel-academic-stanford-mit-youtube",
    "name": "YouTube — Academic Lectures (Stanford · MIT · CMU · Berkeley)",
    "official_domain": "youtube.com",
    "type": "static_manifest",
    "url": "https://www.youtube.com/@stanfordonline",
    "free": True,
    "free_note": "100% FREE (full lecture series).",
    "default_professions": [["software-developer", 0.7], ["student", 0.85]],
    "url_patterns": [],
    "manifest": [
        {"id": "ch-ac-01", "title": "Stanford Online — CS229 / CS224N / CS231N / CS336 full lectures", "url": "https://www.youtube.com/@stanfordonline", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-ac-02", "title": "MIT OpenCourseWare — 6.S191 + 6.034 + linear algebra Gilbert Strang", "url": "https://www.youtube.com/@mitocw", "topics": ["AI", "math", "deep-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-ac-03", "title": "CMU Deep RL Course (Sergey Levine + colleagues)", "url": "https://www.youtube.com/c/CMUDeepRL", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-ac-04", "title": "UC Berkeley AI — CS285 Deep RL + CS189 ML", "url": "https://www.youtube.com/@berkeleyrdi", "topics": ["machine-learning", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-ac-05", "title": "NPTEL (IIT/IISc) — full Indian AI lectures catalog", "url": "https://www.youtube.com/@iit", "topics": ["AI", "machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE; cert INR 1,000"},
        {"id": "ch-ac-06", "title": "Harvard CS50 — full intro CS + AI courses", "url": "https://www.youtube.com/@cs50", "topics": ["computer-science", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "ch-ac-07", "title": "Caltech CS — Yaser Abu-Mostafa Learning from Data", "url": "https://work.caltech.edu/telecourse", "topics": ["machine-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-ac-08", "title": "Princeton — AI Lecture Series", "url": "https://www.youtube.com/c/princeton", "topics": ["AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-ac-09", "title": "Oxford — Machine Learning Lectures", "url": "https://www.youtube.com/c/oxford", "topics": ["machine-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "ch-ac-10", "title": "Cambridge — Engineering AI Lectures", "url": "https://www.youtube.com/c/cambridgeuniversity", "topics": ["AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# FREE_RESOURCE stream — Datasets, Models, Books, Blogs
# ─────────────────────────────────────────────────────────────────────────

FREE_RES_DATASETS = {
    "slug": "free-res-datasets",
    "name": "Free Resources — Datasets (Kaggle · HF · Google · UCI · IndiaAI · AI4Bharat)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://huggingface.co/datasets",
    "free": True,
    "free_note": "100% FREE for research + commercial (check licenses).",
    "default_professions": [["software-developer", 0.85], ["student", 0.7]],
    "url_patterns": [],
    "manifest": [
        {"id": "frs-ds-01", "title": "Hugging Face Datasets — 200,000+ open datasets (FREE)", "url": "https://huggingface.co/datasets", "topics": ["AI", "data-engineering"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-ds-02", "title": "Kaggle Datasets — community + competition datasets (FREE)", "url": "https://www.kaggle.com/datasets", "topics": ["AI", "machine-learning"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "frs-ds-03", "title": "Papers With Code Datasets — SOTA paper datasets (FREE)", "url": "https://paperswithcode.com/datasets", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-ds-04", "title": "Google Dataset Search (FREE)", "url": "https://datasetsearch.research.google.com/", "topics": ["AI", "data-engineering"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-ds-05", "title": "AWS Open Data Registry (FREE)", "url": "https://registry.opendata.aws/", "topics": ["AI", "data-engineering"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-ds-06", "title": "UCI ML Repository — classical ML benchmarks (FREE)", "url": "https://archive.ics.uci.edu/", "topics": ["machine-learning"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "frs-ds-07", "title": "IndiaAI Datasets Platform — Indian open AI training data (FREE)", "url": "https://indiaai.gov.in/datasets", "topics": ["AI", "data-engineering"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-ds-08", "title": "AI4Bharat Datasets — Indic language datasets (FREE)", "url": "https://ai4bharat.iitm.ac.in/", "topics": ["NLP", "vernacular"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-ds-09", "title": "Common Crawl — web-scale text corpus (FREE)", "url": "https://commoncrawl.org/", "topics": ["NLP", "llm"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-ds-10", "title": "LAION-5B — open large-scale image-text dataset", "url": "https://laion.ai/", "topics": ["computer-vision", "llm"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-ds-11", "title": "OpenImages — 9M annotated images (Google FREE)", "url": "https://storage.googleapis.com/openimages/web/index.html", "topics": ["computer-vision"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-ds-12", "title": "Open Source Audio: LibriSpeech / Common Voice / VoxCeleb (FREE)", "url": "https://commonvoice.mozilla.org/", "topics": ["speech", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-ds-13", "title": "Data.gov.in — Indian government open data (FREE)", "url": "https://data.gov.in/", "topics": ["data-engineering", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-ds-14", "title": "Zenodo — research data archive (FREE, CC-BY)", "url": "https://zenodo.org/", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
    ],
}


FREE_RES_MODELS_COMPUTE = {
    "slug": "free-res-models-compute",
    "name": "Free Resources — Models + Compute (HF Hub · Replicate · Modal · Colab · Kaggle · Ollama)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://huggingface.co/models",
    "free": True,
    "free_note": "Free tiers + open-weight models.",
    "default_professions": [["software-developer", 0.9], ["student", 0.65]],
    "url_patterns": [],
    "manifest": [
        {"id": "frs-mc-01", "title": "Hugging Face Models Hub — 1M+ open models (FREE)", "url": "https://huggingface.co/models", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-mc-02", "title": "Google Colab — FREE GPU for ML notebooks", "url": "https://colab.research.google.com/", "topics": ["AI", "machine-learning"], "duration_min": None, "level": "beginner", "cost_label": "FREE; Pro USD 10/month"},
        {"id": "frs-mc-03", "title": "Kaggle Notebooks — FREE GPU + cloud notebooks", "url": "https://www.kaggle.com/code", "topics": ["AI", "machine-learning"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "frs-mc-04", "title": "Modal Labs — serverless GPU (USD 30/month FREE tier)", "url": "https://modal.com/", "topics": ["AI", "infrastructure"], "duration_min": None, "level": "intermediate", "cost_label": "FREE tier"},
        {"id": "frs-mc-05", "title": "Replicate — run any open AI model via API (pay-per-use)", "url": "https://replicate.com/", "topics": ["AI"], "duration_min": None, "level": "beginner", "cost_label": "Pay-per-use; FREE explore"},
        {"id": "frs-mc-06", "title": "Ollama — run open LLMs locally (FREE)", "url": "https://ollama.com/", "topics": ["llm", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "frs-mc-07", "title": "LM Studio — desktop local LLM runner (FREE)", "url": "https://lmstudio.ai/", "topics": ["llm", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE"},
        {"id": "frs-mc-08", "title": "Anthropic Claude — FREE tier on claude.ai", "url": "https://claude.ai/", "topics": ["llm", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE tier; Pro USD 20"},
        {"id": "frs-mc-09", "title": "Google Gemini — FREE tier (gemini.google.com)", "url": "https://gemini.google.com/", "topics": ["llm", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE tier"},
        {"id": "frs-mc-10", "title": "OpenAI ChatGPT — FREE tier", "url": "https://chatgpt.com/", "topics": ["llm", "AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE tier; Plus USD 20"},
        {"id": "frs-mc-11", "title": "IndiaAI Compute — subsidised GPU access for Indian researchers", "url": "https://indiaai.gov.in/", "topics": ["AI", "GPU"], "duration_min": None, "level": "advanced", "cost_label": "Subsidised for verified researchers"},
        {"id": "frs-mc-12", "title": "NVIDIA Inception — FREE GPU credits + technical guidance for AI startups", "url": "https://www.nvidia.com/en-us/startups/", "topics": ["AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE for verified AI startups"},
        {"id": "frs-mc-13", "title": "GitHub Copilot for Students — FREE Pro access via GitHub Student Pack", "url": "https://education.github.com/pack", "topics": ["AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE for verified students"},
        {"id": "frs-mc-14", "title": "Cursor Pro — FREE tier (2-week trial then INR 1,600/mo)", "url": "https://cursor.com/", "topics": ["AI"], "duration_min": None, "level": "beginner", "cost_label": "FREE tier; Pro INR 1,600/mo"},
    ],
}


FREE_RES_BOOKS = {
    "slug": "free-res-books-online",
    "name": "Free Resources — Books (FREE online: Goodfellow DL · Jurafsky · Bishop · Hastie · Murphy)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.deeplearningbook.org/",
    "free": True,
    "free_note": "All FREE online (legitimate, author-published).",
    "default_professions": [["software-developer", 0.75], ["student", 0.8]],
    "url_patterns": [],
    "manifest": [
        {"id": "frs-bk-01", "title": "Deep Learning (Goodfellow + Bengio + Courville) — FREE online", "url": "https://www.deeplearningbook.org/", "topics": ["deep-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE online"},
        {"id": "frs-bk-02", "title": "Speech and Language Processing (Jurafsky + Martin, 3rd ed) — FREE", "url": "https://web.stanford.edu/~jurafsky/slp3/", "topics": ["NLP", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-bk-03", "title": "Pattern Recognition and Machine Learning (Bishop) — FREE PDF", "url": "https://www.microsoft.com/en-us/research/people/cmbishop/prml-book/", "topics": ["machine-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-bk-04", "title": "Elements of Statistical Learning (Hastie+Tibshirani+Friedman) — FREE", "url": "https://hastie.su.domains/ElemStatLearn/", "topics": ["machine-learning", "statistics"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-bk-05", "title": "Probabilistic Machine Learning (Kevin Murphy) — FREE PDF", "url": "https://probml.github.io/pml-book/", "topics": ["machine-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-bk-06", "title": "Machine Learning Yearning (Andrew Ng) — FREE PDF", "url": "https://www.mlyearning.org/", "topics": ["machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bk-07", "title": "Dive Into Deep Learning (Zhang+Lipton+Li+Smola) — FREE online", "url": "https://d2l.ai/", "topics": ["deep-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bk-08", "title": "Reinforcement Learning: An Introduction (Sutton+Barto) — FREE PDF", "url": "http://incompleteideas.net/book/the-book.html", "topics": ["machine-learning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-bk-09", "title": "Designing Data-Intensive Apps (Kleppmann) — partial preview FREE", "url": "https://dataintensive.net/", "topics": ["AI", "data-engineering"], "duration_min": None, "level": "advanced", "cost_label": "Preview FREE; book INR 2,500"},
        {"id": "frs-bk-10", "title": "The Hundred-Page Machine Learning Book (Andriy Burkov) — read-first-then-buy", "url": "https://themlbook.com/", "topics": ["machine-learning"], "duration_min": None, "level": "beginner", "cost_label": "FREE preview; book INR 800"},
        {"id": "frs-bk-11", "title": "fastai book (Howard + Gugger) — FREE notebooks", "url": "https://github.com/fastai/fastbook", "topics": ["deep-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE notebooks; print book paid"},
        {"id": "frs-bk-12", "title": "Mathematics for ML (Marc Deisenroth) — FREE PDF", "url": "https://mml-book.github.io/", "topics": ["math", "machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bk-13", "title": "Hands-On Large Language Models (Maarten Grootendorst) — FREE preview", "url": "https://www.llm-book.com/", "topics": ["llm"], "duration_min": None, "level": "intermediate", "cost_label": "Preview FREE; book USD 50"},
        {"id": "frs-bk-14", "title": "Build a Large Language Model From Scratch (Sebastian Raschka) — FREE GitHub", "url": "https://github.com/rasbt/LLMs-from-scratch", "topics": ["llm"], "duration_min": None, "level": "advanced", "cost_label": "FREE GitHub code; book paid"},
    ],
}


FREE_RES_BLOGS = {
    "slug": "free-res-ai-blogs-newsletters",
    "name": "Free Resources — Blogs + Newsletters (Distill · Lil'Log · Sebastian Raschka · Chip Huyen)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://distill.pub/",
    "free": True,
    "free_note": "100% FREE.",
    "default_professions": [["software-developer", 0.75], ["student", 0.65]],
    "url_patterns": [],
    "manifest": [
        {"id": "frs-bl-01", "title": "Distill.pub — interactive ML explainers archive (FREE)", "url": "https://distill.pub/", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-bl-02", "title": "Lil'Log (Lilian Weng, ex-OpenAI Safety) — FREE", "url": "https://lilianweng.github.io/", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-bl-03", "title": "Sebastian Raschka Substack — best LLM teacher newsletter (FREE)", "url": "https://magazine.sebastianraschka.com/", "topics": ["llm", "machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bl-04", "title": "Chip Huyen Blog — production AI + ML Systems (FREE)", "url": "https://huyenchip.com/", "topics": ["AI", "infrastructure"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-bl-05", "title": "Hugging Face Blog (FREE)", "url": "https://huggingface.co/blog", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bl-06", "title": "Anthropic News + Research (FREE)", "url": "https://www.anthropic.com/news", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bl-07", "title": "OpenAI Blog (FREE)", "url": "https://openai.com/blog", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bl-08", "title": "Google AI / Google Research Blog (FREE)", "url": "https://research.google/blog/", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bl-09", "title": "Meta AI Blog (FREE)", "url": "https://ai.meta.com/blog/", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bl-10", "title": "Philipp Schmid Blog — HF Tech Lead practical builds (FREE)", "url": "https://www.philschmid.de/", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bl-11", "title": "Maxime Labonne — LLM fine-tuning blog (FREE)", "url": "https://mlabonne.github.io/blog/", "topics": ["llm", "fine-tuning"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-bl-12", "title": "The Batch by DeepLearning.AI — weekly newsletter (FREE)", "url": "https://www.deeplearning.ai/the-batch/", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bl-13", "title": "Import AI by Jack Clark — weekly AI policy + research newsletter (FREE)", "url": "https://importai.substack.com/", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bl-14", "title": "AlphaSignal — daily AI roundup newsletter (FREE)", "url": "https://alphasignal.ai/", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-bl-15", "title": "Smol AI — DevTools daily newsletter (FREE)", "url": "https://buttondown.email/ainews", "topics": ["AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-bl-16", "title": "AI Snake Oil (Princeton) — skeptical AI takes (FREE)", "url": "https://www.aisnakeoil.com/", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
    ],
}


FREE_RES_PAPERS_COMMUNITIES = {
    "slug": "free-res-papers-communities",
    "name": "Free Resources — Papers + Communities (arXiv · Papers With Code · Discord · Slack · Reddit)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://arxiv.org/list/cs.AI/recent",
    "free": True,
    "free_note": "100% FREE.",
    "default_professions": [["software-developer", 0.75], ["student", 0.65]],
    "url_patterns": [],
    "manifest": [
        {"id": "frs-pc-01", "title": "arXiv cs.AI / cs.CL / cs.LG — daily research papers (FREE)", "url": "https://arxiv.org/list/cs.AI/recent", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-pc-02", "title": "Papers With Code — SOTA tracking + code (FREE)", "url": "https://paperswithcode.com/", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-pc-03", "title": "Hugging Face Daily Papers — curated arXiv (FREE)", "url": "https://huggingface.co/papers", "topics": ["AI", "research"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-pc-04", "title": "Semantic Scholar — research search engine (FREE)", "url": "https://www.semanticscholar.org/", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-pc-05", "title": "Connected Papers — paper graph navigation (FREE)", "url": "https://www.connectedpapers.com/", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-pc-06", "title": "Hugging Face Discord — community + model authors", "url": "https://huggingface.co/join/discord", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-pc-07", "title": "LangChain Discord — production agent builders", "url": "https://discord.gg/langchain", "topics": ["agents", "llm"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-pc-08", "title": "Anthropic Discord — Claude builders", "url": "https://discord.com/invite/anthropic", "topics": ["llm", "agents"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-pc-09", "title": "r/MachineLearning — Reddit research community", "url": "https://www.reddit.com/r/MachineLearning/", "topics": ["AI", "research"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-pc-10", "title": "r/LocalLLaMA — Reddit open-source LLM enthusiast hub", "url": "https://www.reddit.com/r/LocalLLaMA/", "topics": ["llm", "AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-pc-11", "title": "DataTalks.Club Slack — Zoomcamps + jobs + papers", "url": "https://datatalks.club/slack.html", "topics": ["AI", "machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-pc-12", "title": "Kaggle Discussions — competition + dataset community", "url": "https://www.kaggle.com/discussions", "topics": ["machine-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-pc-13", "title": "fast.ai Forum — top-down DL community", "url": "https://forums.fast.ai/", "topics": ["deep-learning"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-pc-14", "title": "EleutherAI Discord — open-source LLM research", "url": "https://discord.gg/zBGx3azzUn", "topics": ["llm", "AI"], "duration_min": None, "level": "advanced", "cost_label": "FREE"},
        {"id": "frs-pc-15", "title": "MLOps Community Slack — production ML practitioners", "url": "https://mlops.community/", "topics": ["AI", "infrastructure"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
        {"id": "frs-pc-16", "title": "Twitter/X #AICommunity — real-time pulse", "url": "https://twitter.com/", "topics": ["AI"], "duration_min": None, "level": "intermediate", "cost_label": "FREE"},
    ],
}


PLAN = [
    ("person", PERSON_INDIAN_LEADERS),
    ("person", PERSON_GLOBAL_RESEARCH),
    ("person", PERSON_EDUCATORS),
    ("channel", CHANNEL_INDIAN_AI),
    ("channel", CHANNEL_GLOBAL_EDUCATORS),
    ("channel", CHANNEL_VENDOR),
    ("channel", CHANNEL_STANFORD_MIT_ACADEMIC),
    ("free_resource", FREE_RES_DATASETS),
    ("free_resource", FREE_RES_MODELS_COMPUTE),
    ("free_resource", FREE_RES_BOOKS),
    ("free_resource", FREE_RES_BLOGS),
    ("free_resource", FREE_RES_PAPERS_COMMUNITIES),
]


def main() -> int:
    d = json.loads(STREAMS.read_text(encoding="utf-8"))
    streams = d["streams"]
    added = 0
    for stream_key, block in PLAN:
        s = streams.setdefault(stream_key, {
            "_doc": f"{stream_key} stream — added 2026-06-04",
            "sources": [],
        })
        sources = s.setdefault("sources", [])
        if any(x.get("slug") == block["slug"] for x in sources):
            print(f"  - skip {stream_key}/{block['slug']}")
            continue
        sources.append(block)
        items = len(block.get("manifest", []))
        print(f"  + {stream_key}/{block['slug']} ({items} items)")
        added += items
    STREAMS.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n=== People + YouTube + Free Resources: +{added} items across {len(PLAN)} blocks ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
