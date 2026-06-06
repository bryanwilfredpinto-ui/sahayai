# SKILL 3 — Document Recognition

Identify which canonical documents the citizen holds vs needs, and the **unlock value**
of each missing one. Two paths: (1) **declare** — citizen taps documents held (live);
(2) **scan** — Universal Scanner identifies Aadhaar/PAN/land-record/pension-letter/
GST-notice/scholarship-form via the shared [`chitti_camera.js`](../../chitti_camera.js)
(returns honest `pick_or_describe` until vision is funded — never fabricates a type).
Maps document → blocked schemes + where/how to obtain each. Backed by
[Document Agent](../swarm/document-agent.md).
