/* ============================================================================
 * cnai_swarm.js — Chitti News AI · Build Order 5 · Swarm Learning
 * ----------------------------------------------------------------------------
 * Multiple learner-agents "learn" different sub-topics IN PARALLEL (each bound
 * to a BO2 course + BO3 concept tags), then a COORDINATOR consolidates them
 * into one unified roadmap + cross-domain insights + a deduped certifications
 * list. Deterministic — no real LLM needed for the baseline (LLM is an optional
 * later enrichment). Composes BO1 (roadmap), BO2 (courses), BO3 (concepts).
 *
 * Hand-off contract (LangGraph/CrewAI pattern): each agent reads {goal,
 * priorOutputs} read-only and writes exactly ONE field; single-writer, fixed
 * order, reproducible. Failure rule: NO agent failure blocks consolidation —
 * degrade gracefully and report coverage ("4 of 5 helpers reported").
 *
 * Swarm Intelligence (SAHAYAI lock): collective learning is anonymised,
 * gated at >=100 confirmations, HIGH-risk needs human review, never auto-push;
 * "Chitti forget" removes a contribution. proposeToCatalog() encodes that gate.
 *
 * API (window.ChittiSwarm / module.exports):
 *   run(goal, opts)        -> { goal, agents[], roadmap, insights[], certs[], coverage }
 *   crossDomain(tags)      -> insight[]
 *   proposeToCatalog(c)    -> { accepted, reason } (privacy + threshold gate)
 *   speakable(result, lang)-> audio-first summary
 * ==========================================================================*/
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ChittiSwarm = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function dep(name, global) {
    if (typeof require !== 'undefined') { try { return require('./' + name); } catch (e) {} }
    if (typeof window !== 'undefined' && window[global]) return window[global];
    return null;
  }
  function roadmapEngine() { return dep('cnai_roadmap_engine.js', 'ChittiRoadmap'); }
  function courseEngine() { return dep('cnai_course_discovery.js', 'ChittiCourses'); }

  // Concept tags a goal touches (deterministic; reuses BO3 vocabulary).
  const GOAL_CONCEPTS = {
    'agentic ai': ['prompting', 'rag', 'embeddings', 'tools', 'agent', 'orchestrator', 'guardrails', 'evaluation'],
    'python': ['variable', 'function', 'tools', 'data'],
    'data analysis': ['data', 'embeddings', 'evaluation'],
    'web development': ['function', 'tools', 'state-graph'],
    'prompt engineering': ['prompting', 'tools', 'evaluation'],
    'machine learning': ['data', 'fine-tuning', 'embeddings', 'evaluation'],
  };
  function norm(s) { return String(s == null ? '' : s).toLowerCase().trim().replace(/\s+/g, ' '); }
  function conceptsFor(goal) {
    const g = norm(goal);
    if (GOAL_CONCEPTS[g]) return GOAL_CONCEPTS[g].slice();
    for (const k in GOAL_CONCEPTS) { if (g.includes(k) || k.includes(g)) return GOAL_CONCEPTS[k].slice(); }
    // generic goal: derive a sensible learn-anything tag set
    return ['research', 'tools', 'practice', 'evaluation'];
  }

  // ── Cross-domain adjacency (deterministic): {a, b, insight} ──
  const ADJ = [
    { a: 'rag', b: 'embeddings', insight: 'Semantic memory — combine retrieval with embeddings for vector recall.' },
    { a: 'prompting', b: 'tools', insight: 'Function calling — prompts that trigger real tool actions.' },
    { a: 'agent', b: 'orchestrator', insight: 'Multi-agent systems — a captain coordinating specialist agents.' },
    { a: 'embeddings', b: 'data', insight: 'Retrieval quality — good data + embeddings = better context.' },
    { a: 'memory', b: 'state-graph', insight: 'Stateful agents — persistent memory across a graph of steps.' },
    { a: 'evaluation', b: 'prompting', insight: 'Prompt regression testing — measure if a prompt change helped.' },
    { a: 'fine-tuning', b: 'rag', insight: 'Grounded specialisation — know when to retrieve vs when to fine-tune.' },
    { a: 'tools', b: 'agent', insight: 'ReAct loop — an agent that reasons, acts with tools, observes.' },
    { a: 'guardrails', b: 'agent', insight: 'Safe autonomy — agents that confirm before risky actions (Golden Rule).' },
    { a: 'embeddings', b: 'orchestrator', insight: 'Shared swarm memory — many agents reading one vector store.' },
  ];
  function crossDomain(tags) {
    const set = new Set((tags || []).map(norm));
    const out = [];
    ADJ.forEach(r => { if (set.has(r.a) && set.has(r.b)) out.push({ pair: [r.a, r.b], insight: r.insight }); });
    return out;
  }

  // ── Fan-out: build deterministic learner-agents bound to courses + concepts ──
  function fanOut(goal) {
    const CE = courseEngine();
    const courses = CE ? CE.find(goal).results.filter(c => c.is_free).slice(0, 4) : [];
    const concepts = conceptsFor(goal);
    // Distribute concepts across agents; bind each to a free course (if any).
    const agents = [];
    const nAgents = Math.max(4, Math.min(5, courses.length + 1));
    for (let i = 0; i < nAgents; i++) {
      const course = courses[i];
      const myConcepts = concepts.filter((_, idx) => idx % nAgents === i);
      let status = 'ok';
      // Honest: if there is no bound course AND no concepts, this agent is "empty".
      if (!course && myConcepts.length === 0) status = 'empty';
      agents.push({
        id: 'agent-' + (i + 1),
        learned: course ? (course.provider + ' — ' + course.course) : (i === nAgents - 1 ? 'Scan of top practitioners & docs' : 'General study of ' + goal),
        source: course ? course.url : '',
        concepts: myConcepts,
        cert: course && course.cert ? { name: course.course, provider: course.provider, free: course.is_free } : null,
        status,
      });
    }
    return agents;
  }

  function consolidate(goal, agents) {
    const okAgents = agents.filter(a => a.status === 'ok' || a.status === 'empty');
    // unified roadmap (reuse BO1 engine for ordering — foundations-first)
    const RE = roadmapEngine();
    const roadmap = RE ? RE.generate(goal) : null;
    // merge concepts + certs (single-writer already; just union + dedupe)
    const allTags = [];
    agents.forEach(a => (a.concepts || []).forEach(c => { if (allTags.indexOf(c) === -1) allTags.push(c); }));
    const certs = [];
    const seen = {};
    agents.forEach(a => { if (a.cert && !seen[a.cert.name]) { seen[a.cert.name] = true; certs.push(a.cert); } });
    const insights = crossDomain(allTags).map(ins => {
      // attach contributing agents
      const contributors = agents.filter(a => (a.concepts || []).some(c => ins.pair.indexOf(c) !== -1)).map(a => a.id);
      return { insight: ins.insight, pair: ins.pair, agents: contributors };
    });
    return {
      goal: String(goal),
      agents,
      roadmap: roadmap ? { title: roadmap.title, total_stages: roadmap.total_stages, total_topics: roadmap.total_topics, total_est_hours: roadmap.total_est_hours, stages: roadmap.stages } : null,
      insights,
      certs,
      tags: allTags,
      coverage: okAgents.filter(a => a.status === 'ok').length + ' of ' + agents.length + ' helpers reported',
      reported: okAgents.filter(a => a.status === 'ok').length,
      total_agents: agents.length,
      generated_by: 'cnai_swarm (deterministic orchestration; no agent failure blocks consolidation)',
    };
  }

  function run(goal, opts) {
    opts = opts || {};
    const agents = fanOut(goal);
    // simulate one agent failing if requested (for graceful-degradation tests)
    if (opts.failAgent != null && agents[opts.failAgent]) agents[opts.failAgent].status = 'failed';
    return consolidate(goal, agents.filter(a => a.status !== 'failed').concat(agents.filter(a => a.status === 'failed')));
  }

  // ── Swarm Intelligence privacy + threshold gate (documented design) ──
  function proposeToCatalog(candidate) {
    candidate = candidate || {};
    if (candidate.hasPII) return { accepted: false, reason: 'Rejected: contains PII. Swarm contributions must be anonymised.' };
    if ((candidate.confirmations || 0) < 100) return { accepted: false, reason: 'Held: ' + (candidate.confirmations || 0) + '/100 confirmations. Needs >=100 before becoming best-practice.' };
    if (candidate.highRisk) return { accepted: false, reason: 'Queued for human review: HIGH-risk (professional/financial stakes) is never auto-pushed.' };
    return { accepted: true, reason: 'Accepted as a catalog candidate (anonymised, >=100 confirmations, low-risk).' };
  }

  const SPK = {
    en: { helpers: 'helpers learned', things: 'things', together: 'Together they found', insights: 'cross-topic insights', recommend: 'They recommend', certs: 'free certifications', steps: 'Your roadmap has', stages: 'stages' },
    hi: { helpers: 'helpers ne seekha', things: 'cheezein', together: 'Milkar unhone paaye', insights: 'cross-topic insights', recommend: 'Wo recommend karte hain', certs: 'muft certificate', steps: 'Aapke roadmap mein hain', stages: 'charan' },
  };
  function speakable(result, lang) {
    const L = SPK[lang] || SPK.en;
    const parts = [];
    parts.push(result.reported + ' ' + L.helpers + ' ' + result.reported + ' ' + L.things + '.');
    if (result.insights.length) parts.push(L.together + ' ' + result.insights.length + ' ' + L.insights + ': ' + result.insights.map(i => i.insight).join(' '));
    if (result.certs.length) parts.push(L.recommend + ' ' + result.certs.length + ' ' + L.certs + '.');
    if (result.roadmap) parts.push(L.steps + ' ' + result.roadmap.total_stages + ' ' + L.stages + '.');
    return parts.join(' ');
  }

  return { run, fanOut, consolidate, crossDomain, proposeToCatalog, speakable, _ADJ: ADJ };
});
