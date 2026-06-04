"""
Round 3 — Vendor AI Academies + Ecosystem.

Sire 2026-06-04: "there also courses from Claude, hugging face, nvidia...
am I supposed to do the research..."

Adds vendor-AI academies + ecosystem courses I should have caught earlier:
  - Anthropic / Claude (Academy + Cookbook + Prompt + Claude for Education)
  - Hugging Face DEEPER (DRL + Audio + CV + Diffusion + Agents + VLMs)
  - NVIDIA DEEPER (DLI ALL FREE + Inception + RAPIDS + AI for All + Riva)
  - OpenAI (Academy + Cookbook + Whisper + Sora + GPT Builder)
  - Cohere LLM University
  - Mistral La Plateforme
  - Stability AI tutorials
  - xAI Grok docs
  - LangChain + LangGraph Academies
  - LlamaIndex bootcamps
  - Pinecone Learning Center
  - Weaviate / Chroma / Activeloop / Together / Groq / Fireworks
  - Perplexity API
  - Replicate / Modal / Ray / Ollama / vLLM
"""
from __future__ import annotations
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
STREAMS = DATA / "streams_sources.json"
COURSES = DATA / "courses_sources.json"


CERT_ANTHROPIC_DEEPER = {
    "slug": "anthropic-claude-deeper",
    "name": "Anthropic / Claude FREE Academy (Cookbook + Skilljar + Prompt + Claude for Education)",
    "official_domain": "anthropic.com",
    "type": "static_manifest",
    "url": "https://anthropic.skilljar.com/",
    "free": True,
    "free_note": "Most Anthropic resources are FREE.",
    "default_professions": [["software-developer", 0.85], ["student", 0.5], ["teacher", 0.35]],
    "url_patterns": [],
    "manifest": [
        {"id": "anthropic-skilljar-courses", "title": "Anthropic Skilljar — FREE official courses (Claude API / Agents / Tool Use)", "url": "https://anthropic.skilljar.com/", "topics": ["llm", "agents", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "anthropic-cookbook-github", "title": "Anthropic Cookbook (GitHub) — recipes for everything (FREE)", "url": "https://github.com/anthropics/anthropic-cookbook", "topics": ["llm", "agents", "rag", "AI"], "level": "intermediate", "cost_label": "FREE open source"},
        {"id": "anthropic-prompt-eng-guide", "title": "Anthropic Prompt Engineering Interactive Tutorial (FREE)", "url": "https://github.com/anthropics/prompt-eng-interactive-tutorial", "topics": ["llm", "prompt-engineering", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "anthropic-docs-courses", "title": "Anthropic Docs — Claude Quickstarts + Tool Use + Vision (FREE)", "url": "https://docs.anthropic.com/en/docs/welcome", "topics": ["llm", "agents", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "anthropic-claude-education", "title": "Claude for Education — FREE Claude for verified students/educators", "url": "https://www.anthropic.com/education", "topics": ["llm", "AI", "lesson-plan"], "level": "beginner", "cost_label": "FREE for verified students/teachers"},
        {"id": "anthropic-prompt-shield", "title": "Anthropic — Building with Claude best practices (FREE webinars)", "url": "https://www.anthropic.com/news", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "anthropic-mcp-tutorial", "title": "Anthropic Model Context Protocol (MCP) tutorial (FREE)", "url": "https://modelcontextprotocol.io/", "topics": ["llm", "agents", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "anthropic-research-papers", "title": "Anthropic Research — Constitutional AI + interpretability papers (FREE)", "url": "https://www.anthropic.com/research", "topics": ["llm", "AI", "research"], "level": "advanced", "cost_label": "FREE"},
    ],
}


CERT_HUGGINGFACE_DEEPER = {
    "slug": "huggingface-deeper-courses",
    "name": "Hugging Face FREE Academy DEEPER (NLP + DRL + Audio + CV + Diffusion + Agents + VLMs)",
    "official_domain": "huggingface.co",
    "type": "static_manifest",
    "url": "https://huggingface.co/learn",
    "free": True,
    "free_note": "100% FREE, run on HF infrastructure.",
    "default_professions": [["software-developer", 0.8], ["student", 0.55]],
    "url_patterns": [],
    "manifest": [
        {"id": "hf-nlp-course-deep", "title": "Hugging Face NLP Course — Transformers + Datasets (FREE)", "url": "https://huggingface.co/learn/nlp-course", "topics": ["NLP", "llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "hf-deep-rl-course-deep", "title": "Hugging Face Deep RL Course (full, FREE)", "url": "https://huggingface.co/learn/deep-rl-course", "topics": ["machine-learning", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "hf-audio-course-deep", "title": "Hugging Face Audio ML Course (FREE)", "url": "https://huggingface.co/learn/audio-course", "topics": ["AI", "audio", "speech"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "hf-cv-course", "title": "Hugging Face Computer Vision Course (FREE)", "url": "https://huggingface.co/learn/computer-vision-course", "topics": ["computer-vision", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "hf-diffusion-models", "title": "Hugging Face Diffusion Models Class (FREE)", "url": "https://github.com/huggingface/diffusion-models-class", "topics": ["computer-vision", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "hf-agents-course-deep", "title": "Hugging Face AI Agents Course — smolagents + LangGraph (FREE)", "url": "https://huggingface.co/learn/agents-course/unit0/introduction", "topics": ["agents", "llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "hf-cookbook", "title": "Hugging Face Cookbook — recipes for everything (FREE)", "url": "https://huggingface.co/learn/cookbook", "topics": ["llm", "agents", "rag", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "hf-llm-fine-tuning", "title": "Hugging Face LLM Fine-Tuning + PEFT Course (FREE)", "url": "https://huggingface.co/learn", "topics": ["llm", "fine-tuning", "AI"], "level": "advanced", "cost_label": "FREE"},
        {"id": "hf-spaces-deploy", "title": "Hugging Face Spaces Deploy Course (FREE)", "url": "https://huggingface.co/learn", "topics": ["AI", "infrastructure"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "hf-datasets-course", "title": "Hugging Face Datasets Tutorial — building open AI training corpora", "url": "https://huggingface.co/learn", "topics": ["data-engineering", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "hf-eval-course", "title": "Hugging Face Evaluation Tutorials (LLM benchmarking)", "url": "https://huggingface.co/docs/evaluate", "topics": ["llm", "AI"], "level": "advanced", "cost_label": "FREE"},
    ],
}


CERT_NVIDIA_DEEPER = {
    "slug": "nvidia-deeper-academy",
    "name": "NVIDIA Deep Learning Institute (DLI) FREE DEEPER (Fundamentals + RAPIDS + Inception + AI for All)",
    "official_domain": "nvidia.com",
    "type": "static_manifest",
    "url": "https://learn.nvidia.com/",
    "free": True,
    "free_note": "Most NVIDIA DLI self-paced courses are FREE. Live workshops have fees.",
    "default_professions": [["software-developer", 0.85], ["student", 0.6]],
    "url_patterns": [],
    "manifest": [
        {"id": "nvidia-dli-genai-llms", "title": "NVIDIA DLI — Generative AI with LLMs (FREE)", "url": "https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-FX-07+V1", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "nvidia-dli-rag-agents-llm", "title": "NVIDIA DLI — Building RAG Agents with LLMs (FREE)", "url": "https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-FX-15+V1", "topics": ["rag", "agents", "llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "nvidia-dli-prompt-eng", "title": "NVIDIA DLI — Prompt Engineering with LLaMA-2 (FREE)", "url": "https://learn.nvidia.com/", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "nvidia-dli-fundamentals-dl", "title": "NVIDIA DLI — Fundamentals of Deep Learning (FREE)", "url": "https://learn.nvidia.com/", "topics": ["deep-learning", "AI"], "level": "intermediate", "cost_label": "FREE self-paced"},
        {"id": "nvidia-dli-cv-deep", "title": "NVIDIA DLI — Computer Vision for Industrial Inspection (FREE)", "url": "https://learn.nvidia.com/", "topics": ["computer-vision", "AI"], "level": "intermediate", "cost_label": "FREE self-paced"},
        {"id": "nvidia-dli-multi-gpu", "title": "NVIDIA DLI — Multi-GPU AI Training (FREE)", "url": "https://learn.nvidia.com/", "topics": ["deep-learning", "AI", "infrastructure"], "level": "advanced", "cost_label": "FREE"},
        {"id": "nvidia-rapids-data-science", "title": "NVIDIA RAPIDS — Accelerated Data Science (FREE)", "url": "https://rapids.ai/", "topics": ["data-engineering", "AI"], "level": "intermediate", "cost_label": "FREE open source"},
        {"id": "nvidia-inception-startup", "title": "NVIDIA Inception — FREE for AI startups (GPU credits + technical guidance)", "url": "https://www.nvidia.com/en-us/startups/", "topics": ["AI", "infrastructure"], "level": "advanced", "cost_label": "FREE for verified AI startups"},
        {"id": "nvidia-ai-for-all", "title": "NVIDIA AI for All — FREE Indian student programme", "url": "https://www.nvidia.com/en-in/training/", "topics": ["AI"], "level": "beginner", "cost_label": "FREE for verified Indian students"},
        {"id": "nvidia-riva-speech", "title": "NVIDIA Riva — Speech AI tutorials (FREE)", "url": "https://developer.nvidia.com/riva", "topics": ["AI", "speech"], "level": "intermediate", "cost_label": "FREE tutorials"},
        {"id": "nvidia-omniverse", "title": "NVIDIA Omniverse — Generative 3D + Simulation Tutorials", "url": "https://www.nvidia.com/en-us/omniverse/", "topics": ["AI", "computer-vision"], "level": "advanced", "cost_label": "FREE for individuals"},
        {"id": "nvidia-triton-inference", "title": "NVIDIA Triton Inference Server — production deployment tutorials", "url": "https://developer.nvidia.com/triton-inference-server", "topics": ["AI", "infrastructure", "llm"], "level": "advanced", "cost_label": "FREE"},
        {"id": "nvidia-nemo-tutorials", "title": "NVIDIA NeMo Megatron — train + deploy custom LLMs (FREE tutorials)", "url": "https://developer.nvidia.com/nemo", "topics": ["llm", "fine-tuning", "AI"], "level": "advanced", "cost_label": "FREE tutorials"},
        {"id": "nvidia-ai-enterprise-tutorials", "title": "NVIDIA AI Enterprise — enterprise deployment tutorials (FREE)", "url": "https://www.nvidia.com/en-us/data-center/products/ai-enterprise/", "topics": ["AI", "infrastructure"], "level": "advanced", "cost_label": "FREE tutorials; enterprise license paid"},
    ],
}


CERT_OPENAI_DEEPER = {
    "slug": "openai-deeper-academy",
    "name": "OpenAI FREE Academy DEEPER (Academy + Cookbook + Whisper + Sora + Builder + GPTs)",
    "official_domain": "openai.com",
    "type": "static_manifest",
    "url": "https://academy.openai.com/",
    "free": True,
    "free_note": "OpenAI Academy + Cookbook FREE. API usage paid.",
    "default_professions": [["software-developer", 0.85], ["student", 0.55], ["business-owner", 0.4]],
    "url_patterns": [],
    "manifest": [
        {"id": "openai-academy", "title": "OpenAI Academy — FREE tutorials + builder workshops", "url": "https://academy.openai.com/", "topics": ["llm", "agents", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "openai-cookbook-deep", "title": "OpenAI Cookbook — official recipes (FREE)", "url": "https://cookbook.openai.com/", "topics": ["llm", "agents", "rag", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "openai-evals", "title": "OpenAI Evals — evaluation framework (FREE)", "url": "https://github.com/openai/evals", "topics": ["llm", "AI"], "level": "advanced", "cost_label": "FREE open source"},
        {"id": "openai-whisper-tutorial", "title": "OpenAI Whisper — speech recognition tutorial (FREE)", "url": "https://platform.openai.com/docs/guides/speech-to-text", "topics": ["AI", "speech"], "level": "intermediate", "cost_label": "FREE study; API usage paid"},
        {"id": "openai-sora-tutorials", "title": "OpenAI Sora — video generation tutorials", "url": "https://platform.openai.com/", "topics": ["AI", "computer-vision"], "level": "intermediate", "cost_label": "FREE tutorials; Sora access paid"},
        {"id": "openai-gpt-builder", "title": "OpenAI GPT Builder — create custom GPTs (FREE on Plus)", "url": "https://platform.openai.com/", "topics": ["llm", "agents", "AI"], "level": "beginner", "cost_label": "FREE with ChatGPT Plus subscription"},
        {"id": "openai-fine-tuning-guide", "title": "OpenAI Fine-Tuning Guide (free tutorial)", "url": "https://platform.openai.com/docs/guides/fine-tuning", "topics": ["llm", "fine-tuning", "AI"], "level": "advanced", "cost_label": "FREE tutorial; fine-tuning API paid"},
        {"id": "openai-realtime-api", "title": "OpenAI Realtime API tutorial (Voice agents)", "url": "https://platform.openai.com/docs/guides/realtime", "topics": ["agents", "llm", "AI", "speech"], "level": "advanced", "cost_label": "FREE study"},
    ],
}


CERT_VENDOR_LLM_DEEPER = {
    "slug": "vendor-llm-deeper",
    "name": "LLM Vendor FREE Academies (Cohere LLM University / Mistral / Stability / xAI / Together / Groq / Fireworks)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://docs.cohere.com/page/llmu",
    "free": True,
    "free_note": "All listed academies FREE; API usage paid.",
    "default_professions": [["software-developer", 0.85], ["student", 0.45]],
    "url_patterns": [],
    "manifest": [
        {"id": "cohere-llm-university-deep", "title": "Cohere LLM University — FREE LLM curriculum", "url": "https://docs.cohere.com/page/llmu", "topics": ["llm", "rag", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "cohere-rag-fundamentals", "title": "Cohere RAG Fundamentals (FREE)", "url": "https://cohere.com/llmu", "topics": ["rag", "llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "mistral-la-plateforme", "title": "Mistral La Plateforme — FREE tutorials + cookbook", "url": "https://docs.mistral.ai/", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE tutorials"},
        {"id": "mistral-cookbook", "title": "Mistral Cookbook (FREE)", "url": "https://github.com/mistralai/cookbook", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE open source"},
        {"id": "stability-tutorials", "title": "Stability AI — Stable Diffusion + Stable Video tutorials", "url": "https://stability.ai/", "topics": ["computer-vision", "AI"], "level": "intermediate", "cost_label": "FREE tutorials"},
        {"id": "xai-grok-docs", "title": "xAI Grok API documentation + tutorials", "url": "https://docs.x.ai/", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE tutorials; API usage paid"},
        {"id": "together-cookbook", "title": "Together AI Cookbook (FREE)", "url": "https://docs.together.ai/", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "groq-quickstart", "title": "Groq Quickstart + LPU tutorials (fast inference)", "url": "https://console.groq.com/docs/", "topics": ["llm", "AI", "infrastructure"], "level": "intermediate", "cost_label": "FREE tutorials"},
        {"id": "fireworks-tutorials", "title": "Fireworks AI tutorials — function-calling + fine-tuning (FREE)", "url": "https://docs.fireworks.ai/", "topics": ["llm", "fine-tuning", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "perplexity-docs", "title": "Perplexity API documentation + tutorials (FREE)", "url": "https://docs.perplexity.ai/", "topics": ["llm", "AI"], "level": "intermediate", "cost_label": "FREE docs"},
        {"id": "replicate-cookbook", "title": "Replicate — run open-source AI models cookbook (FREE)", "url": "https://replicate.com/explore", "topics": ["AI", "infrastructure"], "level": "intermediate", "cost_label": "FREE cookbook; API paid"},
    ],
}


CERT_AI_FRAMEWORKS = {
    "slug": "ai-frameworks-academies",
    "name": "AI Framework Academies (LangChain / LangGraph / LlamaIndex / Pinecone / Weaviate / Chroma / Activeloop)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://academy.langchain.com/",
    "free": True,
    "free_note": "All listed academies FREE (vendor-funded skilling).",
    "default_professions": [["software-developer", 0.85], ["student", 0.5]],
    "url_patterns": [],
    "manifest": [
        {"id": "langchain-academy", "title": "LangChain Academy — FREE courses (Agents + RAG + LangGraph)", "url": "https://academy.langchain.com/", "topics": ["agents", "rag", "llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "langgraph-academy", "title": "LangGraph Academy — agent orchestration (FREE)", "url": "https://academy.langchain.com/courses/intro-to-langgraph", "topics": ["agents", "llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "llamaindex-bootcamp", "title": "LlamaIndex bootcamp — RAG, agents, workflows (FREE)", "url": "https://docs.llamaindex.ai/", "topics": ["rag", "agents", "llm", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "pinecone-learning-center-deep", "title": "Pinecone Learning Center — vector DB + RAG (FREE)", "url": "https://www.pinecone.io/learn/", "topics": ["vector-database", "rag", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "weaviate-academy-deep", "title": "Weaviate Academy — vector DB, hybrid search, RAG (FREE)", "url": "https://weaviate.io/learn", "topics": ["vector-database", "rag", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "chroma-docs", "title": "Chroma docs + tutorials — open-source vector DB (FREE)", "url": "https://docs.trychroma.com/", "topics": ["vector-database", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "activeloop-deep-lake", "title": "Activeloop Deep Lake tutorials — multi-modal data lakes (FREE)", "url": "https://docs.activeloop.ai/", "topics": ["data-engineering", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "qdrant-tutorials", "title": "Qdrant Vector DB tutorials (FREE)", "url": "https://qdrant.tech/documentation/", "topics": ["vector-database", "AI"], "level": "intermediate", "cost_label": "FREE"},
        {"id": "milvus-tutorials", "title": "Milvus + Zilliz tutorials — vector DB at scale (FREE)", "url": "https://milvus.io/docs", "topics": ["vector-database", "AI"], "level": "intermediate", "cost_label": "FREE"},
    ],
}


CERT_AI_INFRA = {
    "slug": "ai-infra-tutorials",
    "name": "AI Infrastructure FREE Tutorials (Ray / Modal / Ollama / vLLM / LM Studio / LocalAI / Skypilot)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://docs.ray.io/",
    "free": True,
    "free_note": "All open-source AI infrastructure tooling, FREE tutorials.",
    "default_professions": [["software-developer", 0.85]],
    "url_patterns": [],
    "manifest": [
        {"id": "ray-anyscale-tutorials", "title": "Ray + Anyscale Academy — distributed AI workloads (FREE)", "url": "https://www.anyscale.com/learn", "topics": ["AI", "infrastructure", "machine-learning"], "level": "advanced", "cost_label": "FREE Anyscale Academy"},
        {"id": "modal-starter", "title": "Modal Labs Starter — serverless GPU + AI (FREE tier)", "url": "https://modal.com/docs", "topics": ["AI", "infrastructure", "llm"], "level": "intermediate", "cost_label": "FREE tier USD 30/month credit"},
        {"id": "ollama-community", "title": "Ollama — run open LLMs locally (FREE)", "url": "https://ollama.com/", "topics": ["llm", "AI", "infrastructure"], "level": "intermediate", "cost_label": "FREE open source"},
        {"id": "vllm-tutorials", "title": "vLLM — high-throughput LLM serving tutorials (FREE)", "url": "https://docs.vllm.ai/", "topics": ["llm", "AI", "infrastructure"], "level": "advanced", "cost_label": "FREE"},
        {"id": "lm-studio-guides", "title": "LM Studio — desktop local LLM runner (FREE)", "url": "https://lmstudio.ai/", "topics": ["llm", "AI"], "level": "beginner", "cost_label": "FREE"},
        {"id": "localai-docs", "title": "LocalAI — OpenAI-compatible local API (FREE)", "url": "https://localai.io/", "topics": ["llm", "AI", "infrastructure"], "level": "intermediate", "cost_label": "FREE open source"},
        {"id": "skypilot-tutorials", "title": "SkyPilot — multi-cloud GPU orchestration (FREE)", "url": "https://docs.skypilot.co/", "topics": ["AI", "infrastructure"], "level": "advanced", "cost_label": "FREE"},
        {"id": "bentoml-tutorials", "title": "BentoML — ML deployment framework (FREE)", "url": "https://docs.bentoml.com/", "topics": ["AI", "infrastructure", "machine-learning"], "level": "intermediate", "cost_label": "FREE open source"},
    ],
}


# Plan
STREAMS_PLAN = [
    ("cert", CERT_ANTHROPIC_DEEPER),
    ("cert", CERT_HUGGINGFACE_DEEPER),
    ("cert", CERT_NVIDIA_DEEPER),
    ("cert", CERT_OPENAI_DEEPER),
    ("cert", CERT_VENDOR_LLM_DEEPER),
    ("cert", CERT_AI_FRAMEWORKS),
    ("cert", CERT_AI_INFRA),
]


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
    print(f"\n=== Round-3 vendor AI academies: added {added} items across {len(STREAMS_PLAN)} sources ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
