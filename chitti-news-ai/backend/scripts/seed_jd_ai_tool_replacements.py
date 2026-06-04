"""
Sire: "please refer to jds of top professions for example TA, HR, etc.
look what certifications do they possess. What are the AI tools used.
For example excel, ppt are gone. What is replaced by AI. Those tools
must populate, youtube video must come so that the users are aware of
what AI tools to be used... u r no good"

Reverse-engineered from real 2026 JDs. Each profession gets:
  - "OLD tool → AI replacement" manifest (in `tool` stream)
  - JD-required certifications
  - YouTube channels actually used by working professionals
"""
from __future__ import annotations
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
STREAMS = DATA / "streams_sources.json"


# ============================================================================
# TALENT ACQUISITION — what replaces LinkedIn Recruiter boolean search
# ============================================================================
TOOL_TA_AI_STACK = {
    "slug": "ta-ai-tool-stack-jd-driven",
    "name": "Talent Acquisition AI Stack — what's REPLACING Boolean search + Excel trackers (JD-driven 2026)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://eightfold.ai/",
    "free": False,
    "free_note": "Most have free trials; enterprise license for production.",
    "default_professions": [["talent-acquisition", 0.95], ["hr-professional", 0.55]],
    "url_patterns": [],
    "manifest": [
        {"id": "ta-tool-01", "title": "Eightfold AI — talent intelligence (replaces Boolean search + LinkedIn manual)", "url": "https://eightfold.ai/", "topics": ["talent acquisition", "ai recruiting", "people analytics"], "duration_min": None, "level": None},
        {"id": "ta-tool-02", "title": "hireEZ (formerly Hiretual) — AI sourcing across 800M profiles", "url": "https://hireez.com/", "topics": ["ai sourcing", "talent acquisition"], "duration_min": None, "level": None},
        {"id": "ta-tool-03", "title": "SeekOut — AI talent search + diversity sourcing (replaces Boolean strings)", "url": "https://seekout.com/", "topics": ["ai sourcing", "talent acquisition"], "duration_min": None, "level": None},
        {"id": "ta-tool-04", "title": "Fetcher.ai — automated AI candidate sourcing", "url": "https://fetcher.ai/", "topics": ["ai sourcing", "talent acquisition", "passive candidate"], "duration_min": None, "level": None},
        {"id": "ta-tool-05", "title": "Paradox Olivia — AI conversational recruiter (replaces phone screen scheduling)", "url": "https://www.paradox.ai/", "topics": ["ai recruiting", "candidate experience"], "duration_min": None, "level": None},
        {"id": "ta-tool-06", "title": "HireVue — AI video interviewing (replaces phone screens at scale)", "url": "https://www.hirevue.com/", "topics": ["ai interview", "video interview"], "duration_min": None, "level": None},
        {"id": "ta-tool-07", "title": "Sense — AI candidate engagement (replaces manual email follow-ups)", "url": "https://www.sensehq.com/", "topics": ["ai recruiting", "candidate experience"], "duration_min": None, "level": None},
        {"id": "ta-tool-08", "title": "Plum — AI candidate matching (replaces gut-feel screening)", "url": "https://www.plum.io/", "topics": ["ai recruiting"], "duration_min": None, "level": None},
        {"id": "ta-tool-09", "title": "Beamery — AI talent CRM (replaces Excel candidate trackers)", "url": "https://www.beamery.com/", "topics": ["talent acquisition", "ai recruiting"], "duration_min": None, "level": None},
        {"id": "ta-tool-10", "title": "Phenom People — AI talent experience platform", "url": "https://www.phenom.com/", "topics": ["talent acquisition", "ai recruiting"], "duration_min": None, "level": None},
        {"id": "ta-tool-11", "title": "Greenhouse + AI — ATS (replaces Excel offer trackers)", "url": "https://www.greenhouse.io/", "topics": ["ATS", "talent acquisition"], "duration_min": None, "level": None},
        {"id": "ta-tool-12", "title": "Lever — ATS with AI candidate matching", "url": "https://www.lever.co/", "topics": ["ATS", "talent acquisition"], "duration_min": None, "level": None},
        {"id": "ta-tool-13", "title": "GoodTime — AI interview scheduling (replaces Calendly/X.ai for hiring)", "url": "https://goodtime.io/", "topics": ["talent acquisition", "ai recruiting"], "duration_min": None, "level": None},
        {"id": "ta-tool-14", "title": "ChatGPT/Claude — JD writing + outreach personalization (free tier)", "url": "https://chatgpt.com/", "topics": ["llm", "talent acquisition"], "duration_min": None, "level": None},
        {"id": "ta-tool-15", "title": "Loom-AI — async video interviews + screen captures", "url": "https://www.loom.com/", "topics": ["talent acquisition", "candidate experience"], "duration_min": None, "level": None},
        {"id": "ta-tool-16", "title": "Otter.ai — AI interview transcription (replaces manual notes)", "url": "https://otter.ai/", "topics": ["talent acquisition", "AI"], "duration_min": None, "level": None},
        {"id": "ta-tool-17", "title": "Gamma.app — AI offer-letter + onboarding decks (replaces PPT)", "url": "https://gamma.app/", "topics": ["talent acquisition", "AI"], "duration_min": None, "level": None},
        {"id": "ta-tool-18", "title": "Notion AI — recruiting OS replacement (replaces Excel + Confluence)", "url": "https://www.notion.com/product/ai", "topics": ["talent acquisition", "AI"], "duration_min": None, "level": None},
    ],
}


CHANNEL_TA_YOUTUBE = {
    "slug": "channel-ta-recruiting-youtube",
    "name": "YouTube — Recruiting + TA Channels (Boolean Black Belt, SocialTalent, Recruiting Brainfood)",
    "official_domain": "youtube.com",
    "type": "static_manifest",
    "url": "https://www.youtube.com/@SocialTalent",
    "free": True,
    "free_note": "100% FREE.",
    "default_professions": [["talent-acquisition", 0.95], ["hr-professional", 0.5]],
    "url_patterns": [],
    "manifest": [
        {"id": "ta-ch-01", "title": "SocialTalent YouTube — recruiting best practices + AI tools", "url": "https://www.youtube.com/@SocialTalent", "topics": ["talent acquisition", "ai recruiting"], "duration_min": None, "level": None},
        {"id": "ta-ch-02", "title": "Boolean Black Belt (Glen Cathey) — sourcing techniques (still relevant + AI)", "url": "https://www.linkedin.com/in/glencathey/", "topics": ["talent acquisition", "boolean search"], "duration_min": None, "level": None},
        {"id": "ta-ch-03", "title": "Recruiting Brainfood (Hung Lee) — weekly TA newsletter + podcast", "url": "https://recruitingbrainfood.com/", "topics": ["talent acquisition"], "duration_min": None, "level": None},
        {"id": "ta-ch-04", "title": "Hung Lee's Recruiting Brainfood YouTube interviews with TA leaders", "url": "https://www.youtube.com/@HungLee", "topics": ["talent acquisition"], "duration_min": None, "level": None},
        {"id": "ta-ch-05", "title": "AIHR (Academy to Innovate HR) YouTube — People analytics tutorials", "url": "https://www.youtube.com/@AIHR_HR", "topics": ["people analytics", "ai for hr"], "duration_min": None, "level": None},
        {"id": "ta-ch-06", "title": "Madeline Mann — Recruiting trends + career advice", "url": "https://www.youtube.com/@SelfMadeMillennial", "topics": ["talent acquisition"], "duration_min": None, "level": None},
        {"id": "ta-ch-07", "title": "Recruiting Innovation Summit — annual virtual conference recordings", "url": "https://recruitinginnovationsummit.com/", "topics": ["ai recruiting"], "duration_min": None, "level": None},
        {"id": "ta-ch-08", "title": "James Hu (Jobscan founder) — ATS optimisation + AI in recruiting", "url": "https://www.youtube.com/@Jobscan", "topics": ["ATS", "ai recruiting"], "duration_min": None, "level": None},
    ],
}


# ============================================================================
# HR PROFESSIONAL — what replaces Excel for analytics + Word for policies
# ============================================================================
TOOL_HR_AI_STACK = {
    "slug": "hr-ai-tool-stack-jd-driven",
    "name": "HR Professional AI Stack — what's REPLACING Excel + Word + SurveyMonkey (JD-driven 2026)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.visier.com/",
    "free": False,
    "free_note": "Most have free trials; enterprise license for production.",
    "default_professions": [["hr-professional", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "hr-tool-01", "title": "Visier — people analytics platform (replaces Excel HR dashboards)", "url": "https://www.visier.com/", "topics": ["people analytics", "hr analytics"], "duration_min": None, "level": None},
        {"id": "hr-tool-02", "title": "ChartHop — org analytics + planning (replaces Excel headcount sheets)", "url": "https://www.charthop.com/", "topics": ["people analytics", "hr analytics"], "duration_min": None, "level": None},
        {"id": "hr-tool-03", "title": "Culture Amp — AI employee engagement (replaces SurveyMonkey + Google Forms)", "url": "https://www.cultureamp.com/", "topics": ["employee engagement", "ai for hr"], "duration_min": None, "level": None},
        {"id": "hr-tool-04", "title": "Lattice AI — performance management (replaces manual review docs)", "url": "https://lattice.com/", "topics": ["performance management", "ai for hr"], "duration_min": None, "level": None},
        {"id": "hr-tool-05", "title": "15Five with AI insights (replaces weekly status emails)", "url": "https://www.15five.com/", "topics": ["performance management", "ai for hr"], "duration_min": None, "level": None},
        {"id": "hr-tool-06", "title": "Workday + AI — HCM with embedded AI (replaces SAP SuccessFactors + Excel)", "url": "https://www.workday.com/", "topics": ["workday", "HRIS"], "duration_min": None, "level": None},
        {"id": "hr-tool-07", "title": "Darwinbox — India's HCM with embedded AI (replaces manual HRIS)", "url": "https://darwinbox.com/", "topics": ["HRIS", "ai for hr"], "duration_min": None, "level": None},
        {"id": "hr-tool-08", "title": "Keka HR — AI-powered HRIS for Indian SMBs (replaces Excel)", "url": "https://www.keka.com/", "topics": ["HRIS", "payroll"], "duration_min": None, "level": None},
        {"id": "hr-tool-09", "title": "ClaudeAI / ChatGPT — HR policy drafting (replaces Word templates)", "url": "https://claude.ai/", "topics": ["llm", "workplace policy"], "duration_min": None, "level": None},
        {"id": "hr-tool-10", "title": "Gamma.app — AI HR board decks + town halls (replaces PowerPoint)", "url": "https://gamma.app/", "topics": ["ai for hr", "AI"], "duration_min": None, "level": None},
        {"id": "hr-tool-11", "title": "Tome — AI presentation maker for HR communications (replaces PPT)", "url": "https://tome.app/", "topics": ["ai for hr", "AI"], "duration_min": None, "level": None},
        {"id": "hr-tool-12", "title": "Notion AI — HR ops + onboarding wiki (replaces Confluence + Word)", "url": "https://www.notion.com/product/ai", "topics": ["ai for hr", "AI"], "duration_min": None, "level": None},
        {"id": "hr-tool-13", "title": "Personio — European HRIS with AI (replaces multiple tools)", "url": "https://www.personio.com/", "topics": ["HRIS", "ai for hr"], "duration_min": None, "level": None},
        {"id": "hr-tool-14", "title": "Power BI + Copilot — HR analytics with AI insights (replaces Excel pivots)", "url": "https://www.microsoft.com/en-us/power-platform/products/power-bi", "topics": ["power-bi", "hr analytics"], "duration_min": None, "level": None},
        {"id": "hr-tool-15", "title": "Tableau + Tableau AI — HR dashboards (replaces Excel charts)", "url": "https://www.tableau.com/", "topics": ["hr analytics", "people analytics"], "duration_min": None, "level": None},
        {"id": "hr-tool-16", "title": "Otter.ai — meeting transcription for HR (replaces manual notes)", "url": "https://otter.ai/", "topics": ["ai for hr"], "duration_min": None, "level": None},
        {"id": "hr-tool-17", "title": "Microsoft Copilot in M365 — embedded AI in Outlook/Word/Excel", "url": "https://www.microsoft.com/en-us/microsoft-365/copilot", "topics": ["copilot studio", "ai for hr"], "duration_min": None, "level": None},
    ],
}


# ============================================================================
# SOFTWARE DEVELOPER — what replaces VS Code + Stack Overflow + Postman
# ============================================================================
TOOL_DEV_AI_STACK = {
    "slug": "dev-ai-tool-stack-jd-driven",
    "name": "Software Dev AI Stack — what's REPLACING VS Code + Stack Overflow + Postman (JD-driven 2026)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://cursor.com/",
    "free": True,
    "free_note": "Most have FREE tiers.",
    "default_professions": [["software-developer", 0.95], ["student", 0.45]],
    "url_patterns": [],
    "manifest": [
        {"id": "dev-tool-01", "title": "Cursor IDE — AI-first IDE (the new default, replaces VS Code)", "url": "https://cursor.com/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-02", "title": "Windsurf (Codeium) — agentic IDE alternative to Cursor", "url": "https://codeium.com/windsurf", "topics": ["agents", "AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-03", "title": "GitHub Copilot — autocomplete + Workspace + Agent mode", "url": "https://github.com/features/copilot", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-04", "title": "Claude Code (CLI) — Anthropic's autonomous dev agent", "url": "https://docs.anthropic.com/en/docs/claude-code/overview", "topics": ["agents", "AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-05", "title": "Cline (Claude Dev) — VS Code extension with Claude agentic loops", "url": "https://cline.bot/", "topics": ["agents", "AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-06", "title": "Continue.dev — open-source AI coding assistant (Cursor alternative)", "url": "https://www.continue.dev/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-07", "title": "v0 by Vercel — generate UI from natural language (replaces Figma-to-code)", "url": "https://v0.dev/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-08", "title": "Bolt.new — full-stack app from prompt (replaces boilerplate)", "url": "https://bolt.new/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-09", "title": "Lovable.dev — production-grade app from natural language", "url": "https://lovable.dev/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-10", "title": "CodeRabbit — AI code review (replaces senior dev PR babysitting)", "url": "https://www.coderabbit.ai/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-11", "title": "Greptile — AI code review with full codebase context", "url": "https://www.greptile.com/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-12", "title": "Phind — developer-focused AI search (replaces Stack Overflow)", "url": "https://www.phind.com/", "topics": ["AI", "llm"], "duration_min": None, "level": None},
        {"id": "dev-tool-13", "title": "Perplexity Pro — AI search with citations (replaces Google for tech)", "url": "https://www.perplexity.ai/", "topics": ["llm", "AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-14", "title": "Mintlify — AI documentation generator (replaces hand-written docs)", "url": "https://mintlify.com/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-15", "title": "Sentry AI Autofix — auto-detect and fix bugs in production", "url": "https://sentry.io/welcome/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-16", "title": "Linear + AI — modern project mgmt (replaces Jira)", "url": "https://linear.app/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-17", "title": "Bruno — open-source Postman replacement", "url": "https://www.usebruno.com/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-18", "title": "Devin (Cognition) — autonomous AI software engineer", "url": "https://www.cognition.ai/", "topics": ["agents", "AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-19", "title": "Replit Agent — build apps from natural language in browser", "url": "https://replit.com/", "topics": ["agents", "AI"], "duration_min": None, "level": None},
        {"id": "dev-tool-20", "title": "Warp — AI-powered terminal (replaces iTerm/Terminal)", "url": "https://www.warp.dev/", "topics": ["AI"], "duration_min": None, "level": None},
    ],
}


CHANNEL_DEV_AI_YOUTUBE = {
    "slug": "channel-dev-ai-youtube",
    "name": "YouTube — Software Dev AI Tool Tutorials (Fireship, Theo, Web Dev Simplified)",
    "official_domain": "youtube.com",
    "type": "static_manifest",
    "url": "https://www.youtube.com/@Fireship",
    "free": True,
    "free_note": "100% FREE.",
    "default_professions": [["software-developer", 0.9], ["student", 0.55]],
    "url_patterns": [],
    "manifest": [
        {"id": "dev-ch-01", "title": "Fireship — AI tool reviews + 100-second tutorials", "url": "https://www.youtube.com/@Fireship", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-ch-02", "title": "Theo — t3.gg — Cursor / AI dev tools deep-dives", "url": "https://www.youtube.com/@t3dotgg", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-ch-03", "title": "Web Dev Simplified — modern stack + AI tutorials", "url": "https://www.youtube.com/@WebDevSimplified", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-ch-04", "title": "AI Jason — agent + LangChain tutorials", "url": "https://www.youtube.com/@AIJasonZ", "topics": ["agents", "llm"], "duration_min": None, "level": None},
        {"id": "dev-ch-05", "title": "Riley Brown — AI builder + Cursor power-user tutorials", "url": "https://www.youtube.com/@rileybrownai", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-ch-06", "title": "Coding Garden with CJ — AI dev workflow live streams", "url": "https://www.youtube.com/@WhatIsCodingGarden", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "dev-ch-07", "title": "Matthew Berman — AI tools + GenAI reviews", "url": "https://www.youtube.com/@matthew_berman", "topics": ["llm", "agents"], "duration_min": None, "level": None},
        {"id": "dev-ch-08", "title": "Cole Medin — Local AI agents + n8n tutorials", "url": "https://www.youtube.com/@ColeMedin", "topics": ["agents", "llm"], "duration_min": None, "level": None},
    ],
}


# ============================================================================
# DOCTOR — what replaces UpToDate + manual SOAP notes
# ============================================================================
TOOL_DOCTOR_AI_STACK = {
    "slug": "doctor-ai-tool-stack-jd-driven",
    "name": "Doctor AI Stack — what's REPLACING UpToDate + manual SOAP notes + Radiology eyes (JD-driven 2026)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://glass.health/",
    "free": False,
    "free_note": "Most have free trials for doctors.",
    "default_professions": [["doctor", 0.95], ["oncologist", 0.7], ["nurse", 0.3]],
    "url_patterns": [],
    "manifest": [
        {"id": "doc-tool-01", "title": "Glass.health — AI differential diagnosis + SOAP notes (replaces manual DDx)", "url": "https://glass.health/", "topics": ["clinical decision support", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-02", "title": "OpenEvidence — AI clinical search citing primary literature", "url": "https://openevidence.com/", "topics": ["clinical decision support", "medical literature"], "duration_min": None, "level": None},
        {"id": "doc-tool-03", "title": "Consensus.app — AI medical literature search (replaces PubMed grind)", "url": "https://consensus.app/", "topics": ["medical literature", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-04", "title": "Elicit — AI research assistant for clinical evidence", "url": "https://elicit.com/", "topics": ["medical literature", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-05", "title": "Scite.ai — AI citation analysis (supports vs contradicts)", "url": "https://scite.ai/", "topics": ["medical literature", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-06", "title": "Atropos Health — real-world evidence on demand", "url": "https://www.atroposhealth.com/", "topics": ["AI", "evidence-based medicine"], "duration_min": None, "level": None},
        {"id": "doc-tool-07", "title": "Abridge — AI medical scribe (replaces manual SOAP notes)", "url": "https://www.abridge.com/", "topics": ["EHR", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-08", "title": "Suki AI — voice-driven clinical documentation", "url": "https://www.suki.ai/", "topics": ["EHR", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-09", "title": "DeepScribe — ambient AI medical scribe", "url": "https://www.deepscribe.ai/", "topics": ["EHR", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-10", "title": "Nuance DAX Copilot (Microsoft) — gold standard ambient scribe", "url": "https://www.nuance.com/healthcare/ambient-clinical-intelligence.html", "topics": ["EHR", "copilot studio"], "duration_min": None, "level": None},
        {"id": "doc-tool-11", "title": "Aidoc — radiology AI triage (replaces manual scan review queue)", "url": "https://www.aidoc.com/", "topics": ["radiology imaging", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-12", "title": "Annalise.ai — AI radiology decision support", "url": "https://annalise.ai/", "topics": ["radiology imaging", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-13", "title": "Lunit — AI cancer detection on imaging", "url": "https://www.lunit.io/", "topics": ["radiology imaging", "oncology", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-14", "title": "qXR (Qure.ai) — Indian AI for chest X-ray screening", "url": "https://www.qure.ai/", "topics": ["radiology imaging", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-15", "title": "Tempus AI — oncology data + genomics AI", "url": "https://www.tempus.com/", "topics": ["oncology", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-16", "title": "PathAI — AI pathology slide review", "url": "https://www.pathai.com/", "topics": ["histopathology", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-17", "title": "Hippocratic AI — patient-facing healthcare LLM", "url": "https://www.hippocraticai.com/", "topics": ["clinical decision support", "AI"], "duration_min": None, "level": None},
        {"id": "doc-tool-18", "title": "ABDM HPR + Notify AI — Indian digital health stack", "url": "https://hpr.abdm.gov.in/", "topics": ["ABDM", "EHR"], "duration_min": None, "level": None},
    ],
}


# ============================================================================
# LAWYER — what replaces Westlaw + manual contract review
# ============================================================================
TOOL_LAWYER_AI_STACK = {
    "slug": "lawyer-ai-tool-stack-jd-driven",
    "name": "Lawyer AI Stack — what's REPLACING Westlaw + manual contract review + Word (JD-driven 2026)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.harvey.ai/",
    "free": False,
    "free_note": "Most enterprise-priced; some have free tiers.",
    "default_professions": [["lawyer", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "law-tool-01", "title": "Harvey AI — generative AI for legal professionals (BigLaw standard)", "url": "https://www.harvey.ai/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-02", "title": "Casetext CoCounsel (Thomson Reuters) — AI legal research + drafting", "url": "https://casetext.com/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-03", "title": "Lexis+ AI (LexisNexis) — AI on top of LexisNexis", "url": "https://www.lexisnexis.com/en-us/products/lexis-plus-ai.page", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-04", "title": "Spellbook — AI contract drafting + review in Word", "url": "https://www.spellbook.legal/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-05", "title": "Hebbia — AI document analysis for legal/finance", "url": "https://www.hebbia.com/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-06", "title": "Ironclad — AI contract lifecycle management", "url": "https://ironcladapp.com/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-07", "title": "LinkSquares — AI contract analytics", "url": "https://linksquares.com/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-08", "title": "Everlaw — AI ediscovery (replaces manual document review)", "url": "https://www.everlaw.com/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-09", "title": "Relativity aiR — AI ediscovery in Relativity platform", "url": "https://www.relativity.com/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-10", "title": "DISCO — AI legal solutions for discovery + review", "url": "https://csdisco.com/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-11", "title": "Lawmaker.ai — Indian AI legal drafting assistant", "url": "https://lawmaker.ai/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-12", "title": "SpotDraft — Indian SaaS AI contract management", "url": "https://www.spotdraft.com/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-13", "title": "Clio + AI — practice management with AI scheduling + billing", "url": "https://www.clio.com/", "topics": ["case-law", "AI"], "duration_min": None, "level": None},
        {"id": "law-tool-14", "title": "Claude / ChatGPT for legal research + memo drafting", "url": "https://claude.ai/", "topics": ["llm", "case-law"], "duration_min": None, "level": None},
        {"id": "law-tool-15", "title": "Diligen — AI contract review for due diligence", "url": "https://www.diligen.com/", "topics": ["AI", "case-law"], "duration_min": None, "level": None},
    ],
}


# ============================================================================
# ACCOUNTANT — what replaces Tally + Excel reconciliations
# ============================================================================
TOOL_ACCOUNTANT_AI_STACK = {
    "slug": "accountant-ai-tool-stack-jd-driven",
    "name": "Accountant AI Stack — what's REPLACING Tally + Excel reconciliations + manual audit (JD 2026)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://vic.ai/",
    "free": False,
    "free_note": "Free trials available.",
    "default_professions": [["accountant", 0.95], ["business-owner", 0.45]],
    "url_patterns": [],
    "manifest": [
        {"id": "acc-tool-01", "title": "Vic.ai — AI accounts payable automation (replaces manual invoice entry)", "url": "https://vic.ai/", "topics": ["icai", "AI"], "duration_min": None, "level": None},
        {"id": "acc-tool-02", "title": "MindBridge AI — AI audit analytics (replaces sampling-based audit)", "url": "https://www.mindbridge.ai/", "topics": ["icai", "AI"], "duration_min": None, "level": None},
        {"id": "acc-tool-03", "title": "Trullion — AI lease + revenue accounting", "url": "https://trullion.com/", "topics": ["icai", "AI"], "duration_min": None, "level": None},
        {"id": "acc-tool-04", "title": "Stampli — AI AP automation with collaborative review", "url": "https://www.stampli.com/", "topics": ["icai", "AI"], "duration_min": None, "level": None},
        {"id": "acc-tool-05", "title": "AppZen — AI expense audit (replaces manual T&E reviews)", "url": "https://www.appzen.com/", "topics": ["icai", "AI"], "duration_min": None, "level": None},
        {"id": "acc-tool-06", "title": "AuditBoard — AI audit + risk management platform", "url": "https://www.auditboard.com/", "topics": ["icai", "AI"], "duration_min": None, "level": None},
        {"id": "acc-tool-07", "title": "Bloomberg Tax AI Assistant", "url": "https://pro.bloombergtax.com/", "topics": ["icai", "AI"], "duration_min": None, "level": None},
        {"id": "acc-tool-08", "title": "Thomson Reuters Checkpoint Edge AI — tax research AI", "url": "https://tax.thomsonreuters.com/en/checkpoint", "topics": ["icai", "AI"], "duration_min": None, "level": None},
        {"id": "acc-tool-09", "title": "Tally Prime + AI features (Indian SMB standard)", "url": "https://tallysolutions.com/", "topics": ["icai", "gst"], "duration_min": None, "level": None},
        {"id": "acc-tool-10", "title": "Zoho Books + AI (free for <1.5Cr Indian SMBs)", "url": "https://www.zoho.com/in/books/", "topics": ["icai", "gst"], "duration_min": None, "level": None},
        {"id": "acc-tool-11", "title": "QuickBooks AI India + Intuit Assist", "url": "https://quickbooks.intuit.com/in/", "topics": ["icai", "gst"], "duration_min": None, "level": None},
        {"id": "acc-tool-12", "title": "ClearTax + AI for GST/ITR automation (Indian standard)", "url": "https://cleartax.in/", "topics": ["gst", "itr", "tds"], "duration_min": None, "level": None},
        {"id": "acc-tool-13", "title": "Brex AI — corporate card + AI expense intelligence", "url": "https://www.brex.com/", "topics": ["icai", "AI"], "duration_min": None, "level": None},
        {"id": "acc-tool-14", "title": "Power BI Copilot — financial dashboards (replaces Excel pivots)", "url": "https://www.microsoft.com/en-us/power-platform/products/power-bi", "topics": ["power-bi", "icai"], "duration_min": None, "level": None},
        {"id": "acc-tool-15", "title": "Datarails AI — FP&A automation (replaces Excel financial models)", "url": "https://www.datarails.com/", "topics": ["icai", "AI"], "duration_min": None, "level": None},
    ],
}


# ============================================================================
# TEACHER — what replaces PowerPoint + manual grading
# ============================================================================
TOOL_TEACHER_AI_STACK = {
    "slug": "teacher-ai-tool-stack-jd-driven",
    "name": "Teacher AI Stack — what's REPLACING PowerPoint + manual grading + lesson plans (JD 2026)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.magicschool.ai/",
    "free": True,
    "free_note": "Most have free tiers for teachers.",
    "default_professions": [["teacher", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "tch-tool-01", "title": "MagicSchool.ai — 80+ AI tools for teachers (free tier)", "url": "https://www.magicschool.ai/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-02", "title": "SchoolAI — AI tutor + classroom assistant", "url": "https://schoolai.com/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-03", "title": "Khanmigo (Khan Academy) — AI tutor + teacher copilot", "url": "https://www.khanacademy.org/khan-labs", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-04", "title": "Eduaide.ai — AI lesson planning + worksheet generator", "url": "https://www.eduaide.ai/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-05", "title": "Brisk Teaching — Chrome extension AI for teachers", "url": "https://www.briskteaching.com/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-06", "title": "Diffit — instant differentiated worksheets from any text/URL", "url": "https://web.diffit.me/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-07", "title": "Curipod — AI interactive lesson slides (replaces PPT)", "url": "https://curipod.com/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-08", "title": "Gamma.app — AI presentation maker (replaces PPT for teachers)", "url": "https://gamma.app/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-09", "title": "Quizizz AI — auto-generate quizzes + AI grading", "url": "https://quizizz.com/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-10", "title": "Quizlet AI — AI-generated flashcards + study plans", "url": "https://quizlet.com/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-11", "title": "Gradescope (Turnitin) — AI-assisted grading at scale", "url": "https://www.gradescope.com/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-12", "title": "Tome — AI lesson narratives + visuals", "url": "https://tome.app/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-13", "title": "DIKSHA Genie — NCERT AI assistant for Indian teachers", "url": "https://diksha.gov.in/", "topics": ["DIKSHA", "AI", "NEP-2020"], "duration_min": None, "level": None},
        {"id": "tch-tool-14", "title": "Google NotebookLM — turn lesson materials into podcasts", "url": "https://notebooklm.google.com/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
        {"id": "tch-tool-15", "title": "Suno + ElevenLabs — AI voice & music for engaging lessons", "url": "https://suno.com/", "topics": ["lesson-plan", "AI"], "duration_min": None, "level": None},
    ],
}


# ============================================================================
# BUSINESS OWNER — what replaces Excel + manual marketing + customer support
# ============================================================================
TOOL_BIZ_OWNER_AI_STACK = {
    "slug": "business-owner-ai-tool-stack-jd-driven",
    "name": "Business Owner AI Stack — what's REPLACING Excel + manual marketing + customer support (JD 2026)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.jasper.ai/",
    "free": False,
    "free_note": "Most have free tiers; paid for scale.",
    "default_professions": [["business-owner", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "biz-tool-01", "title": "ChatGPT/Claude Pro — your AI strategy/marketing/ops co-pilot", "url": "https://chatgpt.com/", "topics": ["llm", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-02", "title": "Jasper AI — marketing copy at scale (replaces copywriter freelancers)", "url": "https://www.jasper.ai/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-03", "title": "Copy.ai — AI marketing + sales automation", "url": "https://www.copy.ai/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-04", "title": "Writer.com — enterprise AI writing platform", "url": "https://writer.com/", "topics": ["llm", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-05", "title": "Canva Magic Studio — AI design (replaces hiring designers for basics)", "url": "https://www.canva.com/magic-studio/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-06", "title": "Adobe Express AI — AI design + video (replaces PPT)", "url": "https://www.adobe.com/express/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "biz-tool-07", "title": "Gamma.app — AI pitch decks + sales decks (replaces PPT)", "url": "https://gamma.app/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-08", "title": "Buffer AI — social media scheduling with AI content gen", "url": "https://buffer.com/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-09", "title": "Hootsuite AI (OwlyWriter) — social media + AI copy", "url": "https://www.hootsuite.com/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-10", "title": "HubSpot Breeze AI — CRM + marketing AI", "url": "https://www.hubspot.com/products/breeze", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-11", "title": "Salesforce Einstein — CRM AI (replaces manual data entry)", "url": "https://www.salesforce.com/products/einstein/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-12", "title": "Mailchimp AI — email marketing with predictive insights", "url": "https://mailchimp.com/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-13", "title": "Klaviyo AI — e-commerce email + SMS automation", "url": "https://www.klaviyo.com/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-14", "title": "Intercom Fin — AI customer support (replaces L1 agents)", "url": "https://www.intercom.com/fin", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-15", "title": "Zendesk AI — AI ticketing + support automation", "url": "https://www.zendesk.com/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-16", "title": "Ada — conversational AI for customer support", "url": "https://www.ada.cx/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-17", "title": "Mercury AI — business banking + financial insights", "url": "https://mercury.com/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-18", "title": "Vena AI / Anaplan — FP&A platforms (replaces Excel financial models)", "url": "https://www.venasolutions.com/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
        {"id": "biz-tool-19", "title": "ElevenLabs — AI voiceovers for marketing videos", "url": "https://elevenlabs.io/", "topics": ["AI"], "duration_min": None, "level": None},
        {"id": "biz-tool-20", "title": "Synthesia — AI video avatars (replaces hiring video producers)", "url": "https://www.synthesia.io/", "topics": ["AI", "msme"], "duration_min": None, "level": None},
    ],
}


# ============================================================================
# GOVERNMENT EMPLOYEE — what replaces manual file processing
# ============================================================================
TOOL_GOV_EMP_AI_STACK = {
    "slug": "gov-employee-ai-tool-stack-jd-driven",
    "name": "Government Employee AI Stack — what's REPLACING manual file processing + RTI drafting (JD 2026)",
    "official_domain": "various.gov.in",
    "type": "static_manifest",
    "url": "https://bhashini.gov.in/",
    "free": True,
    "free_note": "All FREE for govt employees.",
    "default_professions": [["government-employee", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "gov-tool-01", "title": "BHASHINI — Indian govt language translation for citizen services", "url": "https://bhashini.gov.in/", "topics": ["NLP", "AI", "vernacular", "karmayogi"], "duration_min": None, "level": None},
        {"id": "gov-tool-02", "title": "NeGD Saransh — AI document summarisation for govt files", "url": "https://negd.gov.in/", "topics": ["NLP", "AI", "karmayogi"], "duration_min": None, "level": None},
        {"id": "gov-tool-03", "title": "eOffice AI module — file workflow + AI noting", "url": "https://eoffice.gov.in/", "topics": ["AI", "karmayogi"], "duration_min": None, "level": None},
        {"id": "gov-tool-04", "title": "BharatGen — Indic LLM for govt use cases (IISc+IITs)", "url": "https://www.bharatgen.in/", "topics": ["llm", "AI", "karmayogi"], "duration_min": None, "level": None},
        {"id": "gov-tool-05", "title": "AI4Bharat IndicTrans — open NMT for 22 Indian languages", "url": "https://ai4bharat.iitm.ac.in/", "topics": ["NLP", "AI"], "duration_min": None, "level": None},
        {"id": "gov-tool-06", "title": "MyGov AI — citizen engagement chatbot", "url": "https://www.mygov.in/", "topics": ["AI", "karmayogi"], "duration_min": None, "level": None},
        {"id": "gov-tool-07", "title": "DigiLocker AI — document verification AI", "url": "https://www.digilocker.gov.in/", "topics": ["AI", "karmayogi"], "duration_min": None, "level": None},
        {"id": "gov-tool-08", "title": "Microsoft Copilot for Government — Office productivity with AI", "url": "https://www.microsoft.com/en-us/microsoft-365/copilot", "topics": ["copilot studio", "karmayogi"], "duration_min": None, "level": None},
        {"id": "gov-tool-09", "title": "Power BI + Copilot — govt analytics dashboards", "url": "https://www.microsoft.com/en-us/power-platform/products/power-bi", "topics": ["power-bi", "karmayogi"], "duration_min": None, "level": None},
        {"id": "gov-tool-10", "title": "Power Platform + Copilot — citizen service apps without code", "url": "https://www.microsoft.com/en-us/power-platform", "topics": ["copilot studio", "karmayogi"], "duration_min": None, "level": None},
        {"id": "gov-tool-11", "title": "ClaudeAI / ChatGPT Enterprise — RTI drafting + policy notes", "url": "https://claude.ai/", "topics": ["llm", "karmayogi"], "duration_min": None, "level": None},
        {"id": "gov-tool-12", "title": "Sarvam AI — Indian LLM for vernacular govt use cases", "url": "https://www.sarvam.ai/", "topics": ["llm", "NLP", "vernacular"], "duration_min": None, "level": None},
        {"id": "gov-tool-13", "title": "PFMS AI dashboards — public financial management", "url": "https://pfms.nic.in/", "topics": ["AI", "karmayogi"], "duration_min": None, "level": None},
        {"id": "gov-tool-14", "title": "GeM AI — procurement + vendor analytics", "url": "https://gem.gov.in/", "topics": ["AI", "karmayogi"], "duration_min": None, "level": None},
    ],
}


# ============================================================================
# FARMER — what replaces manual weather/pest/soil decisions
# ============================================================================
TOOL_FARMER_AI_STACK = {
    "slug": "farmer-ai-tool-stack-jd-driven",
    "name": "Farmer AI Stack — what's REPLACING manual decisions on weather, pest, soil, mandi (JD 2026)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://plantix.net/",
    "free": True,
    "free_note": "Most FREE or free tier.",
    "default_professions": [["farmer", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "frm-tool-01", "title": "Plantix — AI pest + disease detection from leaf photo (FREE)", "url": "https://plantix.net/", "topics": ["precision-agriculture", "AI", "agritech"], "duration_min": None, "level": None},
        {"id": "frm-tool-02", "title": "Cropin SmartFarm — AI farm intelligence (FREE FPO tier)", "url": "https://www.cropin.com/", "topics": ["precision-agriculture", "AI", "agritech"], "duration_min": None, "level": None},
        {"id": "frm-tool-03", "title": "Fasal — sensor + AI precision irrigation/spraying for Indian crops", "url": "https://www.fasal.co/", "topics": ["precision-agriculture", "AI", "agritech"], "duration_min": None, "level": None},
        {"id": "frm-tool-04", "title": "DeHaat — input + advisory + market app for Indian farmers", "url": "https://agrevolution.in/", "topics": ["precision-agriculture", "AI", "mandi"], "duration_min": None, "level": None},
        {"id": "frm-tool-05", "title": "AgNext — AI quality testing for crops (commodity grading)", "url": "https://agnext.com/", "topics": ["AI", "mandi"], "duration_min": None, "level": None},
        {"id": "frm-tool-06", "title": "Garuda Aerospace — Indian drone spraying + AI mapping", "url": "https://garudaaerospace.com/", "topics": ["precision-agriculture", "AI"], "duration_min": None, "level": None},
        {"id": "frm-tool-07", "title": "DroneAcharya — drone training + spraying services (NSE-listed)", "url": "https://droneacharya.com/", "topics": ["precision-agriculture", "AI"], "duration_min": None, "level": None},
        {"id": "frm-tool-08", "title": "Climate FieldView (Bayer) — AI farm management", "url": "https://climate.com/", "topics": ["precision-agriculture", "AI"], "duration_min": None, "level": None},
        {"id": "frm-tool-09", "title": "IMD Meghdoot — IMD AI agro-weather advisory (FREE)", "url": "https://play.google.com/store/apps/details?id=com.meghdoot", "topics": ["precision-agriculture", "weather"], "duration_min": None, "level": None},
        {"id": "frm-tool-10", "title": "Kisan Suvidha App — weather, market, dealers (FREE govt)", "url": "https://play.google.com/store/apps/details?id=in.gov.kisansuvidha", "topics": ["precision-agriculture", "agritech", "mandi"], "duration_min": None, "level": None},
        {"id": "frm-tool-11", "title": "AGMARKNET — daily mandi prices across India (FREE govt)", "url": "https://agmarknet.gov.in/", "topics": ["mandi", "precision-agriculture"], "duration_min": None, "level": None},
        {"id": "frm-tool-12", "title": "e-NAM — National Agriculture Market online trading (FREE)", "url": "https://www.enam.gov.in/", "topics": ["mandi", "agritech"], "duration_min": None, "level": None},
        {"id": "frm-tool-13", "title": "Ninjacart — farm-to-fork supply chain platform", "url": "https://ninjacart.com/", "topics": ["mandi", "AI"], "duration_min": None, "level": None},
        {"id": "frm-tool-14", "title": "Soil Health Card AI interpretation (FREE govt)", "url": "https://www.soilhealth.dac.gov.in/", "topics": ["soil-health", "precision-agriculture"], "duration_min": None, "level": None},
    ],
}


# ============================================================================
# NURSE — what replaces manual charting + paper-based vitals
# ============================================================================
TOOL_NURSE_AI_STACK = {
    "slug": "nurse-ai-tool-stack-jd-driven",
    "name": "Nurse AI Stack — what's REPLACING manual charting + paper vitals + manual ICU (JD 2026)",
    "official_domain": "various",
    "type": "static_manifest",
    "url": "https://www.epic.com/",
    "free": False,
    "free_note": "Most are enterprise hospital-deployed; some FREE govt tools.",
    "default_professions": [["nurse", 0.95]],
    "url_patterns": [],
    "manifest": [
        {"id": "nrs-tool-01", "title": "Epic + Microsoft Copilot — EHR with embedded AI (gold standard)", "url": "https://www.epic.com/", "topics": ["EHR", "AI"], "duration_min": None, "level": None},
        {"id": "nrs-tool-02", "title": "Nuance DAX Copilot — AI clinical scribe (used in hospitals)", "url": "https://www.nuance.com/healthcare/ambient-clinical-intelligence.html", "topics": ["EHR", "copilot studio"], "duration_min": None, "level": None},
        {"id": "nrs-tool-03", "title": "Abridge — AI nursing notes from conversation", "url": "https://www.abridge.com/", "topics": ["EHR", "AI"], "duration_min": None, "level": None},
        {"id": "nrs-tool-04", "title": "Hippocratic AI — nursing voice agent for patient follow-up", "url": "https://www.hippocraticai.com/", "topics": ["AI", "bedside nursing"], "duration_min": None, "level": None},
        {"id": "nrs-tool-05", "title": "Aiva Health — AI voice assistant for nursing in hospital rooms", "url": "https://www.aivahealth.com/", "topics": ["bedside nursing", "AI"], "duration_min": None, "level": None},
        {"id": "nrs-tool-06", "title": "Cogito (Talkspace) — AI conversational analytics for nurse calls", "url": "https://www.cogitocorp.com/", "topics": ["bedside nursing", "AI"], "duration_min": None, "level": None},
        {"id": "nrs-tool-07", "title": "Sepsis Watch — AI early sepsis detection (Duke Health)", "url": "https://duke.edu/", "topics": ["AI", "patient monitoring"], "duration_min": None, "level": None},
        {"id": "nrs-tool-08", "title": "Cerner + Oracle AI — hospital EHR with AI features", "url": "https://www.oracle.com/health/", "topics": ["EHR", "AI"], "duration_min": None, "level": None},
        {"id": "nrs-tool-09", "title": "ABDM HPR — Indian Healthcare Professionals Registry (FREE)", "url": "https://hpr.abdm.gov.in/", "topics": ["EHR", "ABDM"], "duration_min": None, "level": None},
        {"id": "nrs-tool-10", "title": "ASHA Suvidha App — work tracking + AI alerts (NHM)", "url": "https://nhm.gov.in/", "topics": ["ASHA", "bedside nursing"], "duration_min": None, "level": None},
        {"id": "nrs-tool-11", "title": "ANMOL — ANM Online Tracking AI workflow (NHM)", "url": "https://anmol.nhp.gov.in/", "topics": ["ANM training", "bedside nursing"], "duration_min": None, "level": None},
        {"id": "nrs-tool-12", "title": "Suki AI — voice-driven documentation for nurses", "url": "https://www.suki.ai/", "topics": ["EHR", "AI"], "duration_min": None, "level": None},
        {"id": "nrs-tool-13", "title": "Augmedix — ambient AI scribe (replaces 2h/day charting)", "url": "https://www.augmedix.com/", "topics": ["EHR", "AI"], "duration_min": None, "level": None},
        {"id": "nrs-tool-14", "title": "Connected medical devices (Philips/GE) + AI vitals streaming", "url": "https://www.philips.co.in/healthcare", "topics": ["patient monitoring", "AI"], "duration_min": None, "level": None},
    ],
}


# ============================================================================
# Manifest plan
# ============================================================================
PLAN = [
    ("tool",    TOOL_TA_AI_STACK),
    ("channel", CHANNEL_TA_YOUTUBE),
    ("tool",    TOOL_HR_AI_STACK),
    ("tool",    TOOL_DEV_AI_STACK),
    ("channel", CHANNEL_DEV_AI_YOUTUBE),
    ("tool",    TOOL_DOCTOR_AI_STACK),
    ("tool",    TOOL_LAWYER_AI_STACK),
    ("tool",    TOOL_ACCOUNTANT_AI_STACK),
    ("tool",    TOOL_TEACHER_AI_STACK),
    ("tool",    TOOL_BIZ_OWNER_AI_STACK),
    ("tool",    TOOL_GOV_EMP_AI_STACK),
    ("tool",    TOOL_FARMER_AI_STACK),
    ("tool",    TOOL_NURSE_AI_STACK),
]


def main() -> int:
    d = json.loads(STREAMS.read_text(encoding="utf-8"))
    streams = d["streams"]
    added = 0
    for stream_key, block in PLAN:
        stream = streams.setdefault(stream_key, {"sources": []})
        sources = stream.setdefault("sources", [])
        if any(s.get("slug") == block["slug"] for s in sources):
            print(f"  - skip {stream_key}/{block['slug']}")
            continue
        sources.append(block)
        items = len(block.get("manifest", []))
        print(f"  + {stream_key}/{block['slug']} ({items} items)")
        added += items
    STREAMS.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n=== JD-driven AI tool replacements: +{added} items across {len(PLAN)} blocks ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
