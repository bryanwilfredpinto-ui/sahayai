# Database — Chitti Legal

**N/A.** Chitti Legal is stateless — no database, no cache, no on-disk storage; every request is a single round-trip through [services/legal_service.py](backend/services/legal_service.py) to DeepSeek and back, and nothing about the user's pasted text is persisted by this service.
