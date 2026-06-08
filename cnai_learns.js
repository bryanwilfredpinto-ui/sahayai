/* ============================================================================
 * cnai_learns.js — Chitti News AI · Build Order 3 · "Chitti Learns & Coaches"
 * ----------------------------------------------------------------------------
 * The honest coaching flow that sits on top of cnai_analogy_engine.js:
 *   learn -> teach-by-analogy (with "where it breaks down") -> practice quiz
 *   (NEVER graded) -> switch analogy domain on command (no re-teaching).
 *
 * HONESTY (locked): Chitti can truthfully say "I have read this material" — it
 * must NEVER claim it "watched a video for 2 days" (it did not experience time)
 * and must NEVER sit a graded/proctored exam for the user (BO2 ethics). Practice
 * questions are explicitly labelled "practice, not a graded exam".
 *
 * API (window.ChittiLearns / module.exports):
 *   plan(concepts, domain)   -> lesson plan (ordered concept cards)
 *   teach(concept, domain)   -> teaching card (analogy + breaks-down + practice)
 *   practice(concept)        -> a practice question (not graded)
 *   honestStatus(courseName) -> what Chitti truthfully did
 * ==========================================================================*/
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ChittiLearns = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function analogy() {
    if (typeof require !== 'undefined') { try { return require('./cnai_analogy_engine.js'); } catch (e) {} }
    if (typeof window !== 'undefined' && window.ChittiAnalogy) return window.ChittiAnalogy;
    throw new Error('cnai_learns: ChittiAnalogy engine not available');
  }

  // Default concept curriculum for "learn AI" (ordered foundations-first).
  const DEFAULT_CONCEPTS = ['variable', 'function', 'api', 'prompt', 'token', 'model', 'embedding', 'vector_search', 'rag', 'agent', 'orchestrator', 'memory', 'fine_tuning', 'hallucination'];

  // Practice questions (PRACTICE only — never graded, never a certificate exam).
  const PRACTICE = {
    variable: 'In your own words: what is a variable, and give one example from daily life.',
    function: 'Describe a "function" you use in real life (input -> output). What goes in, what comes out?',
    api: 'Why must you follow an API\'s exact rules? Explain like you are talking to a friend.',
    prompt: 'Rewrite this vague prompt to be specific: "tell me about AI".',
    token: 'True or false: a token is always one whole word. Explain your answer.',
    model: 'In one line: does an LLM "understand" or "guess"? Why?',
    embedding: 'Why do we turn text into numbers (an embedding)? What does it let us do?',
    vector_search: 'How is "meaning search" different from searching for exact words?',
    rag: 'Why does looking it up first (RAG) reduce made-up answers?',
    agent: 'Name one action an AI agent should ALWAYS confirm before doing, and why.',
    orchestrator: 'If 3 agents each make a small mistake, what is the orchestrator\'s job?',
    memory: 'Why might the AI "forget" what you said earlier in a long chat?',
    fine_tuning: 'Give one case where a good prompt would beat fine-tuning.',
    hallucination: 'What is the danger of a hallucination, given it sounds correct?',
  };

  function teach(conceptId, domain) {
    const A = analogy();
    const ex = A.explain(conceptId, domain);
    return {
      concept: ex.concept,
      concept_id: ex.concept_id || conceptId,
      domain: ex.domain,
      domain_label: ex.domain_label,
      found: ex.found,
      analogy: ex.explanation,
      breaks_down: ex.breaks_down,           // bounded analogy — non-negotiable
      practice: PRACTICE[ex.concept_id] || 'Explain this concept back to Chitti in your own words.',
      practice_note: 'This is PRACTICE to check your understanding — not a graded exam.',
      speak: ex.found ? A.speakable(ex, (typeof localStorage !== 'undefined' && localStorage.getItem('chitti_lang')) || 'en') : ex.explanation,
    };
  }

  function plan(concepts, domain) {
    const list = (Array.isArray(concepts) && concepts.length) ? concepts : DEFAULT_CONCEPTS;
    const dom = domain || 'general';
    const cards = list.map((cid, i) => {
      const t = teach(cid, dom);
      return { order: i + 1, concept: t.concept, concept_id: t.concept_id, found: t.found };
    });
    return {
      domain: dom,
      total: cards.length,
      cards,
      teach_first: cards[0] ? cards[0].concept_id : null,
      generated_by: 'cnai_learns (deterministic, analogy-based)',
    };
  }

  function practice(conceptId) {
    const A = analogy();
    const ex = A.explain(conceptId, 'general');
    return {
      concept: ex.concept,
      question: PRACTICE[ex.concept_id] || 'Explain this concept in your own words.',
      graded: false,
      note: 'Practice only. Chitti will never sit a graded or certification exam for you.',
    };
  }

  // The truthful description of what Chitti did — no time-experience fabrication.
  function honestStatus(courseName) {
    return {
      course: courseName || 'this material',
      did: [
        'Read and indexed the material so I can answer from it (RAG).',
        'Prepared to teach each concept through your chosen analogy.',
        'Prepared PRACTICE questions to check your understanding.',
      ],
      did_not: [
        'I did not "watch a video for 2 days" — I read the material; I do not experience time.',
        'I will not sit a graded or proctored exam for you (that would make your certificate invalid).',
        'I will not create an account or act as you without your explicit confirmation.',
      ],
      honest_line: 'I have read this material and can teach it to you. If you ask about something not in it, I will tell you honestly and offer a general explanation instead.',
    };
  }

  return { plan, teach, practice, honestStatus, DEFAULT_CONCEPTS };
});
