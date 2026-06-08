# BO5 — Swarm Learning

> Chitti News AI · Build Order 5 of 7. Research -> Document -> Code -> Test.
> Deliverable: cnai_swarm.js (orchestrator + consolidator + cross-domain mapper)
> + tools/test_cnai_swarm.mjs + a "Chitti Swarm" UI section. Composes BO1+BO2+BO3.

## 1. Research — Top 20 orchestration frameworks (best practice copied)

LangGraph (**state graph; each node writes only its slice — reducer-merged**),
CrewAI (role+task+expected_output; hierarchical manager), AutoGen/AG2
(GroupChatManager supervisor picks next speaker), OpenAI Swarm/Agents SDK
(hand-off as a tool, pass full context), Semantic Kernel (planner separates plan
from execution -> reproducible), LlamaIndex Workflows (typed events fan-out/
fan-in), Haystack (named-socket DAG), Dify (named variables not chat history),
Flowise (sub-flow with clean schema), n8n (Merge node fan-in, idempotent steps),
Relevance AI (narrow tool allow-list), MetaGPT (structured artifact hand-off),
ChatDev (phase gates), Camel-AI (fixed roles), SuperAGI (max-steps + telemetry),
Agno/Phidata (shared session state), Vertex ADK (root routes; specialists don't
call each other), Bedrock (trace per step), Cohere (reflect before re-call),
Devin/Factory (checkpoint + resume). **Cross-cut:** typed single-writer state,
supervisor routing, reproducible plans, checkpointed graceful failure.

## 2. Research — Top 20 AI agent products (reliability copied)

Devin (plan+diff, checkpoints), Cursor (verify by running tests), Copilot
Workspace (spec->plan->implement, human-approvable), Manus (visible task list),
Claude Code (read before write, scoped perms), Operator (confirm irreversible
actions), Replit (build-run-observe), Lovable/v0 (small diffs / variants),
Cognosys (goal->subtasks->synthesis), Lindy/Bardeen/Gumloop (scoped + idempotent
+ retries), Sierra/Decagon/MultiOn (confidence-gated escalation, confirm
sensitive steps), Adept (action grounding), Imbue (self-verification), HyperWrite
(deterministic replay), Ottogrid (per-cell retry). **Cross-cut:** verify, retry,
human-in-loop, scope — never open-ended autonomy.

## 3. Our swarm pattern

A goal fans out to N learner-agents, each bound to a **BO2 free course** + a slice
of **BO3 concept tags** (e.g. for "Agentic AI": Google GenAI, LangGraph, HF RAG,
Prompt Engineering, practitioner scan). **Hand-off contract:** each agent reads
`{goal, priorOutputs}` read-only and writes exactly ONE field (single-writer,
fixed order, reproducible). The **Coordinator** consolidates: unified ordered
roadmap (via the BO1 engine, foundations-first) + cross-domain insights + deduped
certs. **Failure rule:** no agent failure blocks consolidation — merge ok/empty
slices, report `coverage` ("4 of 5 helpers reported"). Verified by test.

## 4. Cross-domain insights (deterministic, no LLM)

A static adjacency map of `{tagA, tagB, insight}` triples; if both tags appear
across the swarm's combined output, emit the higher-order insight + contributing
agents. 10 rules incl: rag+embeddings -> semantic memory · prompting+tools ->
function calling · agent+orchestrator -> multi-agent systems · tools+agent ->
ReAct loop · guardrails+agent -> safe autonomy (Golden Rule) · fine-tuning+rag ->
when to tune vs retrieve. Set-membership match = explainable + replayable.

## 5. Swarm Intelligence the SAHAYAI way (privacy-safe collective learning)

`proposeToCatalog()` encodes the locked contract: a candidate new roadmap/course
is **rejected if it carries PII**, **held below 100 anonymised confirmations**,
and **queued for human review if HIGH-risk** (professional/financial stakes) —
never auto-pushed. "Chitti forget" removes a contribution and the aggregate
recomputes. The swarm may PROPOSE catalog candidates + rank existing courses; it
never silently rewrites a user's current plan. Locked decisions are not learnable.
This is the honest path to grow the BO1/BO2 catalogs from real learner success.

## 6. Accessibility

Voice-first, never diagram-only. On completion Chitti speaks: "5 helpers learned
5 things. Together they found a deeper way to use RAG, and recommend 3 free
certifications." Progress as spoken aria-live status ("Helper 2 of 5 finished").
Roadmap reads as an ordered spoken list; insights as sentences, not nodes+edges.
A visual swarm graph (if shown) is supplementary with full text/audio equivalents.
Every result box carries data-chitti-response.

## 7. Status

cnai_swarm.js: fanOut (course+concept bound agents) DONE · consolidate (BO1
roadmap + dedupe + coverage) DONE · crossDomain (10 adjacency rules) DONE ·
graceful degradation DONE · proposeToCatalog privacy/threshold gate DONE ·
speakable DONE · UI section DONE · tools/test_cnai_swarm.mjs 21/21.
