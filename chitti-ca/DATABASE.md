# Chitti CA — Database

**N/A.** Chitti CA has no database. It is a stateless DeepSeek wrapper: every `POST /api/ca/ask` is an independent request, nothing is persisted, and there is no schema, migration, ORM, or connection string anywhere in the codebase.

If long-term features ever require state (multi-turn chat history, per-user filing checklists, notice-OCR archives), they are listed in [TODO.md](TODO.md) and would be added as a fresh, isolated schema rather than co-mingled with other Chitti products.
