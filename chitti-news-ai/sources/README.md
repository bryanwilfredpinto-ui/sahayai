# CNAIOS — Sources

Per-stream source registry. **Real, free, public, provider-attributed.**

---

## Live state (2026-06-04)

### Courses ([`backend/data/courses_sources.json`](../backend/data/courses_sources.json))

| Source | Type | Items | Status |
|---|---|---:|---|
| Microsoft Learn | json (live REST) | 3,587 | ✅ live |
| NPTEL | static_manifest | 10 | ⚠️ static |
| Google Cloud Skills Boost | static_manifest | 10 | ⚠️ static |
| MIT OCW | static_manifest | 10 | ⚠️ static |
| fast.ai | static_manifest | 4 | ⚠️ static |
| Hugging Face Learn | static_manifest | 6 | ⚠️ static |
| freeCodeCamp | static_manifest | 8 | ⚠️ static |
| DeepLearning.AI | static_manifest | 7 | ⚠️ static |

### Streams ([`backend/data/streams_sources.json`](../backend/data/streams_sources.json))

| Stream | Sources | Items |
|---|---|---:|
| cert | Microsoft / AWS / NASSCOM / Google Cloud (4 manifests) | 18 |
| tool | Hugging Face Spaces / GitHub Trending (2 manifests) | 9 |
| job | RemoteOK / WeWorkRemotely / Remotive (live RSS) + HN / NCS (manifests) | 80+ |
| scheme | MyGov (manifest of 7) | 7 |
| roadmap_node | roadmap.sh / OSSU (manifests) | 6 |

### News ([`backend/data/sources.json`](../backend/data/sources.json))

8 RSS publishers (Anthropic, OpenAI, DeepMind, Meta, TechCrunch AI, Analytics India, YourStory AI, NASSCOM).

---

## Streams NOT yet built (3 of 9)

| Stream | Status | Plan |
|---|---|---|
| AI Grants | 🔴 | Indian gov grant feeds + research grant boards |
| AI Research | 🔴 | arXiv RSS + HuggingFace Daily Papers + IIT/IISc institute feeds |
| AI Startups | 🔴 | Public funding signals + Indian startup index |

---

## Per-source contract

Each source declares:

| Field | Required |
|---|---|
| `slug` | yes |
| `name` | yes |
| `official_domain` | yes — URL allowlist enforced |
| `type` | json / rss / static_manifest |
| `url` | yes |
| `free` | bool |
| `free_note` | verbatim text |
| `license` | yes |
| `default_professions` | array of (slug, confidence) |
| `url_patterns` | array of `{match, labels: [(slug, confidence)]}` |
| `manifest` | (for static_manifest type) array of items |

---

## How a new source lands

1. Author manifest / find live RSS / find JSON catalogue
2. Add to relevant JSON registry file with full contract
3. Test ingest locally (`python scripts/...`)
4. Run benchmark — verify rules still pass
5. Commit + push

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
