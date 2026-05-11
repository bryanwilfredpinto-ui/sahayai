# Chitti Sales — Changelog

Sourced from `git log --oneline -- chitti-sales/` on the main branch.

## 2026-05-12 — Docs-only initial scaffold

- **New product, no commits yet.** The `chitti-sales/` folder is being created with **documentation only**. There is no backend code, no `chitti_sales.html` frontend page, no Render service, and no deploy.

  Contents shipped in this scaffold (markdown only):

  - Eight top-level docs: [README.md](README.md), [CONTEXT.md](CONTEXT.md), [ARCHITECTURE.md](ARCHITECTURE.md), [CHANGELOG.md](CHANGELOG.md), [TODO.md](TODO.md), [API.md](API.md) (proposal), [DATABASE.md](DATABASE.md) (N/A today), [PROMPTS.md](PROMPTS.md) (proposal).
  - Nine skill files at [skills/](skills/): IDENTITY, PERSONALITY, VALUES, BOUNDARIES, GUARDRAILS, DEVILS_ADVOCATE, TRUTH_SOURCES, OBSERVABILITY, SALES_BRIEF.
  - Three extras: [SALES_BOOKS.md](SALES_BOOKS.md) (the 10-book canon), [B2B_TO_B2C_FLYWHEEL.md](B2B_TO_B2C_FLYWHEEL.md) (go-to-market strategy), [FEEDBACK_CAPTURE.md](FEEDBACK_CAPTURE.md) (how user feedback flows back).

  All endpoint shapes, prompt text, env vars, and file paths in this scaffold are **proposals** — they do not exist in code yet. The docs are the product right now.

  Next commit will be the Flask skeleton — same shape as [chitti-ca](../chitti-ca/) and [chitti-legal](../chitti-legal/).
