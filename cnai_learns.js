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

  // ══════════════════════════════════════════════════════════════════════════
  // BO3 (2026-06-13): CONSENT GATE (Skill7/SOP6), DUAL JOURNAL (Skill8/SOP8),
  // comprehension check + honest feedback, and ANTI-CHEAT refusal (Pillar 8).
  // Additive — original API (plan/teach/practice/honestStatus) unchanged.
  // ══════════════════════════════════════════════════════════════════════════

  // ── Consent gate: explicit YES only; silence is NEVER consent; no timeout. ──
  const YES_WORDS = ['yes', 'yeah', 'yep', 'ok', 'okay', 'sure', 'go ahead', 'haan', 'haa', 'start', 'begin', "let's go", 'lets go', 'yes register me', 'yes start'];
  const STOP_WORDS = ['stop', 'exit', 'done', 'cancel', 'not now', 'no', 'later', 'quit'];
  function isYes(s) { const x = String(s == null ? '' : s).toLowerCase().trim(); return YES_WORDS.some(w => x === w || x.startsWith(w + ' ') || x === w + '.'); }
  function isStop(s) { const x = String(s == null ? '' : s).toLowerCase().trim(); return STOP_WORDS.some(w => x === w || x.startsWith(w)); }

  function consentPrompt(topic) {
    const tp = topic || 'this concept';
    return {
      topic: tp,
      prompt: 'Chitti can teach you ' + tp + ' in a guided session: an explanation using an analogy, 1–2 questions to check your understanding, and honest feedback. About 10–15 minutes. Shall we start?',
      options: ['Yes', 'Not now'],
      rules: {
        explicit_yes_required: true,
        silence_is_consent: false,         // SILENCE IS NEVER CONSENT
        timeout_to_yes: false,             // no timer ever converts silence to yes
        per_session: true,                 // re-ask if the user pauses and returns
        exit_any_time: ['stop', 'exit', 'done'],
      },
    };
  }

  // startSession(topic, userReply) — refuses to start unless reply is an explicit YES.
  function startSession(topic, userReply) {
    if (isStop(userReply)) {
      return { started: false, reason: 'declined', message: 'No problem. Here is the direct material whenever you want it — no pressure.' };
    }
    if (!isYes(userReply)) {
      // includes empty/silence → NOT consent
      return { started: false, reason: 'no_explicit_yes', consent: consentPrompt(topic),
        message: 'I will wait. I only start when you clearly say "Yes" — silence is never a yes.' };
    }
    const first = teach((Array.isArray(topic) ? topic[0] : topic) || 'rag', 'general');
    return {
      started: true, topic: topic,
      step: 1, total_steps: 4,
      flow: ['concept', 'check', 'feedback', 'deeper-or-move-on'],
      first_concept: first,
      message: 'Registered your YES. Starting now — I will teach, then check your understanding, then give honest feedback.',
    };
  }

  // checkComprehension(conceptId, answer) — NOT graded; honest, specific feedback.
  function checkComprehension(conceptId, answer) {
    const a = String(answer || '').trim();
    const len = a.split(/\s+/).filter(Boolean).length;
    let verdict, feedback;
    if (!a) { verdict = 'empty'; feedback = 'No rush — try saying it in your own words, even one line. There is no wrong answer here.'; }
    else if (len < 3) { verdict = 'partial'; feedback = 'A start! Can you add one more line — what does it DO, in your own words? (This is practice, not a test.)'; }
    else { verdict = 'engaged'; feedback = 'Good — you explained it in your own words, which is the real test of understanding. Let me add one nuance, then you choose: go deeper or move on.'; }
    return {
      concept: conceptId, graded: false,
      note: 'This is PRACTICE to check understanding — never a graded or certificate exam.',
      verdict, feedback,
      next: ['Go deeper', 'Move on'],
    };
  }

  // ── Anti-cheat (Pillar 8 / SOP 6): detect exam/assignment requests, refuse, teach. ──
  const EXAM_SIGNALS = [/from my exam/i, /exam question/i, /\btest\b.*\banswer\b/i, /answer (this|these) for my (exam|test|assignment|quiz|homework)/i, /(do|write|complete|solve) my (assignment|homework|coursework)/i, /give me the answers?/i, /this is graded/i, /proctored/i, /\bMCQ\b.*answer/i, /quiz answer/i, /sit (the|my) exam/i];
  function isExamRequest(text) { const t = String(text || ''); return EXAM_SIGNALS.some(re => re.test(t)); }
  function refuseCheat(text) {
    return {
      refused: isExamRequest(text),
      message: isExamRequest(text)
        ? 'Chitti will not answer exam questions, complete assignments, or sit a graded/proctored exam for you — that would make any certificate invalid and would not build your skill. But I will teach you the concept so you can answer it yourself. Want to understand it through an analogy first?'
        : '',
      offer: 'teach_concept',
    };
  }

  // ── Dual Journal (Skill8/SOP8): What I Learned + What Confused Me. localStorage-only. ──
  const JKEY = 'chitti_journal';           // primary key
  const JKEY_ALT = 'chittiJournal';        // alias the audit also checks
  const _mem = { store: null };            // in-memory fallback (tests / no-DOM)
  function _ls() { try { return (typeof localStorage !== 'undefined') ? localStorage : null; } catch (e) { return null; } }
  function _read() {
    const ls = _ls();
    if (ls) { try { const raw = ls.getItem(JKEY) || ls.getItem(JKEY_ALT); if (raw) return JSON.parse(raw); } catch (e) {} }
    if (_mem.store) return _mem.store;
    return { learned: [], confused: [] };
  }
  function _write(j) {
    _mem.store = j;
    const ls = _ls();
    if (ls) { try { const s = JSON.stringify(j); ls.setItem(JKEY, s); ls.setItem(JKEY_ALT, s); } catch (e) {} }
    return j;
  }
  // journalAdd({type:'learned'|'confused', topic, analogy_used?, key_insight?|confusion_note?, date?})
  function journalAdd(entry) {
    entry = entry || {};
    const j = _read();
    const date = entry.date || nowISO();
    if (entry.type === 'confused' || entry.confusion_note) {
      j.confused.push({ date, topic: entry.topic || 'unknown', confusion_note: entry.confusion_note || entry.note || '' });
    } else {
      j.learned.push({ date, topic: entry.topic || 'unknown', analogy_used: entry.analogy_used || '', key_insight: entry.key_insight || entry.insight || '' });
    }
    return _write(j);
  }
  function journalGet() { return _read(); }
  function journalExport() {
    const j = _read();
    const lines = ['CHITTI LEARNING JOURNAL', '', 'WHAT I LEARNED:'];
    j.learned.forEach(e => lines.push('- [' + e.date.slice(0, 10) + '] ' + e.topic + (e.key_insight ? ' — ' + e.key_insight : '') + (e.analogy_used ? ' (analogy: ' + e.analogy_used + ')' : '')));
    lines.push('', 'WHAT CONFUSED ME (revisit later):');
    j.confused.forEach(e => lines.push('- [' + e.date.slice(0, 10) + '] ' + e.topic + (e.confusion_note ? ' — ' + e.confusion_note : '')));
    lines.push('', 'Your data stays on your device only. Chitti never sends it to any server.');
    return lines.join('\n');
  }
  function journalClear() {
    _mem.store = { learned: [], confused: [] };
    const ls = _ls();
    if (ls) { try { ls.removeItem(JKEY); ls.removeItem(JKEY_ALT); } catch (e) {} }
    return { cleared: true };
  }
  function nowISO() { try { return new Date().toISOString(); } catch (e) { return '1970-01-01T00:00:00.000Z'; } }

  return {
    plan, teach, practice, honestStatus, DEFAULT_CONCEPTS,
    // BO3 additions (backward-compatible):
    consentPrompt, startSession, checkComprehension, isExamRequest, refuseCheat,
    journalAdd, journalGet, journalExport, journalClear,
  };
});
