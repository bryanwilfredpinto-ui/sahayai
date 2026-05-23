"""
services/courses.py
-------------------
Real, free AI certification & course links. Curated by Sire 2026-05-23.

LOCKED: no DeepSeek-generated courses. Real links only. If a course goes
behind a paywall or is retired, it gets removed — never silently rewritten.
"""
from __future__ import annotations

COURSES: list[dict] = [
    {
        "slug": "google-ai-essentials",
        "name": "Google AI Essentials",
        "provider": "Google · Coursera",
        "url": "https://www.coursera.org/learn/google-ai-essentials",
        "free": True,
        "free_note": "Audit (free) — certificate requires Coursera Plus subscription.",
        "duration": "~6 hours",
        "level": "Beginner",
        "language": "English",
        "for_whom": "Anyone — no tech background needed. Practical hands-on with AI tools.",
    },
    {
        "slug": "microsoft-ai-900",
        "name": "Microsoft Azure AI Fundamentals (AI-900)",
        "provider": "Microsoft Learn",
        "url": "https://learn.microsoft.com/en-us/training/courses/ai-900t00",
        "free": True,
        "free_note": "Learning path is free. Exam fee applies for the official certification.",
        "duration": "~10 hours self-paced",
        "level": "Beginner",
        "language": "English (+ 27 languages on Learn portal)",
        "for_whom": "IT pros, students, anyone wanting a Microsoft-recognised credential.",
    },
    {
        "slug": "nasscom-futureskills-ai",
        "name": "NASSCOM FutureSkills Prime — AI track",
        "provider": "NASSCOM FutureSkills Prime",
        "url": "https://futureskillsprime.in/courses/ai",
        "free": True,
        "free_note": "Government-of-India backed. Free for Indian citizens.",
        "duration": "Multiple courses, 1–8 weeks each",
        "level": "Beginner → Advanced",
        "language": "English / Hindi (varies per course)",
        "for_whom": "Indian students, professionals, jobseekers. MeitY recognised.",
    },
    {
        "slug": "coursera-ai-for-everyone",
        "name": "AI For Everyone",
        "provider": "Andrew Ng · DeepLearning.AI · Coursera",
        "url": "https://www.coursera.org/learn/ai-for-everyone",
        "free": True,
        "free_note": "Audit (free) — certificate requires payment.",
        "duration": "~6 hours",
        "level": "Beginner",
        "language": "English (subtitles in many languages)",
        "for_whom": "Non-technical learners. Best first-AI-course in the world.",
    },
    {
        "slug": "deeplearning-ai-genai-fundamentals",
        "name": "Generative AI for Everyone",
        "provider": "Andrew Ng · DeepLearning.AI · Coursera",
        "url": "https://www.coursera.org/learn/generative-ai-for-everyone",
        "free": True,
        "free_note": "Audit (free) — certificate requires payment.",
        "duration": "~5 hours",
        "level": "Beginner",
        "language": "English",
        "for_whom": "Anyone who wants to understand ChatGPT-class tools.",
    },
    {
        "slug": "deeplearning-ai-short-courses",
        "name": "DeepLearning.AI — Short Courses Library",
        "provider": "DeepLearning.AI",
        "url": "https://www.deeplearning.ai/short-courses/",
        "free": True,
        "free_note": "All short courses are free.",
        "duration": "1–2 hours each",
        "level": "Beginner → Intermediate",
        "language": "English",
        "for_whom": "Developers exploring specific AI topics (RAG, agents, vector DBs, etc.).",
    },
    {
        "slug": "elements-of-ai",
        "name": "Elements of AI",
        "provider": "University of Helsinki · MinnaLearn",
        "url": "https://www.elementsofai.com/",
        "free": True,
        "free_note": "Free university course with certificate of completion.",
        "duration": "~30 hours self-paced",
        "level": "Beginner",
        "language": "English + 28 languages (incl. Bangla, Hindi-coming)",
        "for_whom": "Anyone curious about AI basics. Used by 1M+ learners worldwide.",
    },
    {
        "slug": "fast-ai-practical-deep-learning",
        "name": "Practical Deep Learning for Coders",
        "provider": "fast.ai · Jeremy Howard",
        "url": "https://course.fast.ai/",
        "free": True,
        "free_note": "Free open-source course. No registration.",
        "duration": "~70 hours self-paced",
        "level": "Intermediate (Python required)",
        "language": "English",
        "for_whom": "Coders who want to actually train models, not just read about them.",
    },
]


def list_courses() -> dict:
    return {
        "items": COURSES,
        "count": len(COURSES),
        "disclaimer_en": "Course catalogue is curated. All links go to the official course page. No paid placements. Some certificates may require payment to the provider.",
        "disclaimer_hi": "यह कोर्स सूची चुनिंदा है। हर लिंक आधिकारिक पेज पर जाता है। हम कोई पैसा नहीं लेते। कुछ सर्टिफिकेट के लिए कोर्स प्रदाता को शुल्क देना पड़ सकता है।",
    }
