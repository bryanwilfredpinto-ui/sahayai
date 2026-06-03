"""
tools/loadtest_news.py — Locust load test for chitti-news + chitti-news-ai.

SHIP gate row #17 (both products).

Usage (CNOS):
    locust -f tools/loadtest_news.py --host=https://chitti-news-api-production.up.railway.app \
           --users 200 --spawn-rate 20 --run-time 2m --headless --csv=tools/loadtest_news_report

Usage (CNAIOS):
    locust -f tools/loadtest_news.py --host=https://chitti-news-ai-api-production.up.railway.app \
           --users 200 --spawn-rate 20 --run-time 2m --headless --csv=tools/loadtest_news_ai_report

Mixes representative user paths.
"""
from locust import HttpUser, between, task
import random

STATES = ["india", "mh", "tn", "ka", "kl", "wb", "ap", "gj", "pb", "up"]
LANGS = ["en", "hi", "mr", "ta", "te", "ml", "bn", "kn", "gu", "pa"]
CATS = ["national", "state", "politics", "business", "sports", "entertainment"]
PROFESSIONS = [
    "software-developer", "hr-professional", "talent-acquisition",
    "doctor", "oncologist", "nurse", "farmer", "teacher", "lawyer",
    "accountant", "student", "business-owner", "government-employee",
]
STREAMS = ["news", "courses", "cert", "tool", "job", "scheme", "roadmap_node", "grant", "research", "startup"]


class ChittiUser(HttpUser):
    wait_time = between(1, 3)

    @task(10)
    def health(self):
        self.client.get("/health", name="/health")

    @task(40)
    def news_feed(self):
        """CNOS-shape probe — harmless on CNAIOS (404 acceptable; logged)."""
        st = random.choice(STATES)
        lang = random.choice(LANGS)
        cat = random.choice(CATS)
        self.client.get(
            f"/api/news/feed?state={st}&language={lang}&category={cat}&n=20",
            name="/api/news/feed",
        )

    @task(40)
    def ai_feed_stream(self):
        """CNAIOS-shape probe — harmless on CNOS."""
        stream = random.choice(STREAMS)
        prof = random.choice(PROFESSIONS) if random.random() < 0.5 else "everyone"
        self.client.get(
            f"/api/news-ai/feed/{stream}?profession={prof}&n=10",
            name=f"/api/news-ai/feed/<stream>",
        )

    @task(10)
    def opportunity_radar(self):
        """CNAIOS — exercises the v0.4 world-class feature."""
        prof = random.choice(PROFESSIONS)
        self.client.get(
            f"/api/news-ai/feed/opportunity-radar?profession={prof}",
            name="/api/news-ai/feed/opportunity-radar",
        )

    @task(10)
    def ai_impact_score(self):
        prof = random.choice(PROFESSIONS)
        self.client.get(
            f"/api/news-ai/feed/ai-impact-score?profession={prof}",
            name="/api/news-ai/feed/ai-impact-score",
        )
