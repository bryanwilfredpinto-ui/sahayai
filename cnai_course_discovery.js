/* ============================================================================
 * cnai_course_discovery.js — Chitti News AI · Build Order 2 · Course Discovery
 * ----------------------------------------------------------------------------
 * Deterministic, offline course finder. Given a topic, returns REAL courses
 * ranked FREE-FIRST by a trust-tier ladder, marking any paid course with its
 * cost + a machine "why no free alternative" string. Plus a consent-gated
 * registration PLANNER — Chitti discovers / plans / coaches / pre-fills, but
 * NEVER autonomously enrols an account or sits a graded exam (ToS + credential
 * fraud + Chitti Golden Rule). See chitti-news-ai/features/BO2_COURSE_DISCOVERY.md.
 *
 * Research: Class Central / Coursera / edX (free-audit surfaced first), Skill
 * India + SWAYAM/NPTEL (govt trust tier), Google / Microsoft Learn / IBM /
 * NVIDIA / Hugging Face / freeCodeCamp / Kaggle (free-with-cert), MIT OCW
 * (free no-cert), Coursera Coach / Degreed / Workera (measure -> gap -> minimal
 * path). Free-first is a SORT KEY, never a quality penalty.
 *
 * API (window.ChittiCourses / module.exports):
 *   find(topic, opts)         -> { topic, results[], paid_shown, free_count }
 *   tierLadder()              -> ordered tier enum
 *   registrationPlan(course, user) -> consent-gated steps (no auto-enrol)
 *   speakable(result, lang)   -> audio-first string
 * ==========================================================================*/
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ChittiCourses = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Trust-tier ladder (lower rank = higher priority). Free-first.
  const TIERS = [
    'govt_free_cert',     // SWAYAM/NPTEL, Skill India — govt-recognised cert
    'govt_free',          // govt, no cert
    'corp_free_cert',     // Google/MS/IBM/NVIDIA/HF/freeCodeCamp/Kaggle — free + badge
    'corp_free',          // DeepLearning.AI short courses, vendor docs
    'uni_free',           // MIT OCW / OpenLearn — free, no cert
    'youtube_free',       // curated channels — free, no cert
    'paid',               // ONLY if no free covers the topic
  ];
  const TIER_RANK = Object.fromEntries(TIERS.map((t, i) => [t, i]));
  const TIER_LABEL = {
    govt_free_cert: 'Government · free · certificate',
    govt_free: 'Government · free',
    corp_free_cert: 'Free · certificate',
    corp_free: 'Free',
    uni_free: 'University · free (no certificate)',
    youtube_free: 'YouTube · free (no certificate)',
    paid: 'Paid',
  };

  // ──────────────────────────────────────────────────────────────────────
  // Seed catalog — REAL 2026 free-first courses (verified_date 2026; treat
  // exam fees / cert policy as stale-checkable per CHITTI_SOP).
  // ──────────────────────────────────────────────────────────────────────
  function c(provider, course, tags, cost, cert, tier, url, why) {
    return { provider, course, tags, cost, cert: !!cert, tier, url, why_no_free: why || '', verified_date: '2026' };
  }
  const CATALOG = [
    // Government, free, recognised certificate
    c('Skill India Digital (NSDC)', 'AI & Emerging-Tech (NSQF)', ['ai', 'ai-literacy', 'employability', 'data'], 'FREE', true, 'govt_free_cert', 'https://www.skillindiadigital.gov.in/'),
    c('IIT Madras · SWAYAM Plus', 'AI for All (5 free AI courses, NCrF-aligned)', ['ai', 'ai-literacy', 'ml', 'data', 'machine learning'], 'FREE · nominal exam fee', true, 'govt_free_cert', 'https://swayam-plus.swayam2.ac.in/ai-for-all-courses'),
    c('SWAYAM / NPTEL (IIT)', 'Machine Learning (IIT, NPTEL)', ['ml', 'ai', 'data', 'python', 'machine learning'], 'FREE to learn · ~₹1000 optional exam fee', true, 'govt_free_cert', 'https://onlinecourses.nptel.ac.in/noc26_cs77/preview'),
    c('SWAYAM / NPTEL (IIT)', 'Deep Learning', ['deep-learning', 'ml', 'ai'], 'FREE to learn · ~₹1000 optional exam fee', true, 'govt_free_cert', 'https://nptel.ac.in/'),
    // Corporate, free, with certificate / badge
    c('Google Cloud Skills Boost', 'Generative AI Learning Path', ['genai', 'llm', 'ai', 'cloud', 'prompting'], 'FREE', true, 'corp_free_cert', 'https://www.cloudskillsboost.google/'),
    c('Microsoft Learn', 'Azure AI Fundamentals path', ['ai', 'ml', 'azure', 'cloud'], 'FREE (AI-900 exam paid)', true, 'corp_free_cert', 'https://learn.microsoft.com/training/'),
    c('IBM SkillsBuild', 'AI Fundamentals', ['ai', 'ai-literacy', 'ethics', 'ml'], 'FREE', true, 'corp_free_cert', 'https://skillsbuild.org/'),
    c('NVIDIA DLI', 'Building RAG Agents with LLMs (free self-paced)', ['rag', 'agents', 'llm', 'deep-learning'], 'FREE', true, 'corp_free_cert', 'https://www.nvidia.com/en-us/training/'),
    c('Hugging Face', 'AI Agents Course', ['agents', 'agentic ai', 'llm', 'ai'], 'FREE', true, 'corp_free_cert', 'https://huggingface.co/learn'),
    c('Hugging Face', 'NLP Course', ['nlp', 'transformers', 'ai'], 'FREE', false, 'corp_free', 'https://huggingface.co/learn'),
    c('freeCodeCamp', 'Machine Learning with Python', ['ml', 'python', 'data', 'ai'], 'FREE', true, 'corp_free_cert', 'https://www.freecodecamp.org/learn/'),
    c('freeCodeCamp', 'Responsive Web Design', ['web development', 'html', 'css', 'frontend'], 'FREE', true, 'corp_free_cert', 'https://www.freecodecamp.org/learn/'),
    c('Kaggle Learn', 'Intro to Machine Learning / Python', ['ml', 'python', 'data'], 'FREE', true, 'corp_free_cert', 'https://www.kaggle.com/learn'),
    c('Elements of AI (Reaktor / U. Helsinki)', 'Introduction to AI', ['ai', 'ai-literacy'], 'FREE', true, 'corp_free_cert', 'https://www.elementsofai.com/'),
    c('AWS Skill Builder', 'Foundations of Prompt Engineering', ['prompting', 'prompt engineering', 'genai', 'llm'], 'FREE (some exams paid)', true, 'corp_free_cert', 'https://skillbuilder.aws/'),
    // Corporate / university, free, no cert
    c('DeepLearning.AI', 'Short Courses (LangChain, Prompting, Agents)', ['llm', 'prompting', 'agents', 'rag'], 'FREE', false, 'corp_free', 'https://www.deeplearning.ai/short-courses/'),
    c('Anthropic Academy', 'AI Fluency / Prompt Engineering (free + certificate)', ['prompting', 'prompt engineering', 'llm', 'ai'], 'FREE', true, 'corp_free_cert', 'https://www.anthropic.com/learn'),
    c('Harvard CS50 (edX)', "CS50's Introduction to AI with Python", ['ai', 'python', 'ml'], 'FREE to audit (paid verified cert)', false, 'uni_free', 'https://cs50.harvard.edu/ai/'),
    c('MIT OpenCourseWare', 'Deep Learning / AI lectures', ['ai', 'deep-learning', 'ml'], 'FREE', false, 'uni_free', 'https://ocw.mit.edu/'),
    c('OpenLearn (Open University)', 'Data science & AI intro modules', ['data', 'ai', 'data analysis'], 'FREE', true, 'uni_free', 'https://www.open.edu/openlearn/'),
    // YouTube tier (always available for any topic via search)
    c('YouTube (curated)', 'Free video tutorials', ['*'], 'FREE', false, 'youtube_free', 'https://www.youtube.com/'),
    // A paid example (only surfaced when nothing free covers a deep specialisation)
    c('Coursera (Specialization)', 'Deep specialisation + verified certificate', ['*'], '₹2000–4000/mo subscription', true, 'paid', 'https://www.coursera.org/'),
  ];

  function norm(s) { return String(s == null ? '' : s).toLowerCase().trim().replace(/\s+/g, ' '); }

  // Synonym expansion so "machine learning" matches the `ml` tag, etc.
  const SYN = {
    'ml': ['machine learning', 'ml'],
    'deep-learning': ['deep learning', 'dl', 'neural networks', 'deep-learning'],
    'genai': ['generative ai', 'gen ai', 'genai'],
    'llm': ['llm', 'large language model', 'large language models', 'chatgpt', 'gpt'],
    'ai': ['ai', 'artificial intelligence'],
    'nlp': ['nlp', 'natural language processing'],
    'agents': ['agents', 'agent', 'agentic ai', 'ai agents'],
    'agentic ai': ['agentic ai', 'agents', 'ai agents'],
    'prompting': ['prompting', 'prompt engineering', 'prompts'],
    'web development': ['web development', 'web dev', 'frontend', 'full stack'],
    'data analysis': ['data analysis', 'data analytics', 'analytics', 'data'],
    'data': ['data', 'data analysis', 'data science'],
    'python': ['python'],
    'rag': ['rag', 'retrieval augmented generation'],
  };
  function expand(term) {
    const t = norm(term);
    const set = new Set([t]);
    for (const key in SYN) { if (SYN[key].indexOf(t) !== -1) SYN[key].forEach(x => set.add(x)); }
    if (SYN[t]) SYN[t].forEach(x => set.add(x));
    return set;
  }

  function matchScore(course, topic) {
    const t = norm(topic);
    if (course.tags.includes('*')) return 0.2; // wildcard (YouTube/Coursera) — low but always eligible
    const topicSet = expand(t);
    let best = 0;
    for (const tag of course.tags) {
      const tg = norm(tag);
      const tagSet = expand(tg);
      // exact / synonym match
      if (t === tg) best = Math.max(best, 1);
      else if (topicSet.has(tg) || tagSet.has(t)) best = Math.max(best, 0.9);
      else if ([...topicSet].some(x => tagSet.has(x))) best = Math.max(best, 0.85);
      else if (t.includes(tg) || tg.includes(t)) best = Math.max(best, 0.7);
      else {
        const a = new Set(t.split(' ')); const overlap = tg.split(' ').filter(w => a.has(w)).length;
        if (overlap) best = Math.max(best, 0.4);
      }
    }
    return best;
  }

  function find(topic, opts) {
    opts = opts || {};
    const scored = CATALOG.map(course => ({ course, score: matchScore(course, topic) }))
      .filter(x => x.score > 0);
    // Sort: relevance bucket first (specific > wildcard), then free-first tier, then cert.
    scored.sort((a, b) => {
      const specA = a.score >= 0.4 ? 1 : 0, specB = b.score >= 0.4 ? 1 : 0;
      if (specA !== specB) return specB - specA;
      const ra = TIER_RANK[a.course.tier], rb = TIER_RANK[b.course.tier];
      if (ra !== rb) return ra - rb;
      if (a.course.cert !== b.course.cert) return (b.course.cert ? 1 : 0) - (a.course.cert ? 1 : 0);
      return b.score - a.score;
    });
    const results = scored.map(x => {
      const out = Object.assign({}, x.course, { relevance: +x.score.toFixed(2), tier_label: TIER_LABEL[x.course.tier], is_free: x.course.tier !== 'paid' });
      if (x.course.tier === 'paid') {
        const freeAlts = scored.filter(s => s.course.tier !== 'paid').slice(0, 2).map(s => s.course.provider);
        out.why_no_free = freeAlts.length
          ? 'Shown last. Free options that cover this topic: ' + freeAlts.join(', ') + '. Pick a paid course only for deeper specialisation.'
          : 'No free course in the catalog covers this topic yet — Chitti will keep looking.';
      }
      return out;
    });
    const free = results.filter(r => r.is_free);
    return {
      topic: String(topic),
      results,
      free_count: free.length,
      paid_shown: results.some(r => !r.is_free),
      free_first: results.length ? results[0].is_free : true,
      generated_by: 'cnai_course_discovery (deterministic, free-first)',
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // Consent-gated registration PLAN. Chitti never auto-enrols or sits exams.
  // Returns the honest, consent-stepped plan the UI walks the user through.
  // ──────────────────────────────────────────────────────────────────────
  function registrationPlan(course, user) {
    user = user || {};
    const name = user.name || 'your name';
    return {
      course: course.provider + ' — ' + course.course,
      ethics: 'Chitti can DISCOVER, PLAN, COACH and PRE-FILL your signup. Chitti will NOT create an account or take a graded exam as you — that would break the platform rules and make any certificate invalid.',
      steps: [
        { id: 'discover', label: 'Found a course for you', auto: true, done: true },
        { id: 'consent', label: 'Sire, shall I open the signup with "' + name + '" pre-filled?', auto: false, gate: 'chittiConfirmAndDo' },
        { id: 'prefill', label: 'Open the official signup (you review + submit)', auto: false, requires: 'consent', url: course.url },
        { id: 'coach', label: 'Chitti learns the material and coaches you (Path 2)', auto: false },
      ],
      refusals: [
        'I cannot sit a graded or proctored exam for you — that would make your certificate invalid.',
        'I will not create an account or store a password as you without your explicit, revocable consent.',
      ],
    };
  }

  const SPK = {
    en: { found: 'Found', courses: 'courses for', free: 'free, with a certificate', freeNoCert: 'free, no certificate', paid: 'paid', from: 'from', dur: '' },
    hi: { found: 'Mile', courses: 'course iske liye', free: 'muft, certificate ke saath', freeNoCert: 'muft, bina certificate', paid: 'paid', from: 'se', dur: '' },
  };
  function speakable(result, lang) {
    const L = SPK[lang] || SPK.en;
    const top = result.results.slice(0, 5).map(r => {
      const kind = r.is_free ? (r.cert ? L.free : L.freeNoCert) : L.paid;
      return r.provider + ' ' + L.from + ': ' + r.course + ' — ' + kind + '.';
    }).join(' ');
    return L.found + ' ' + result.results.length + ' ' + L.courses + ' ' + result.topic + '. ' + top;
  }

  function tierLadder() { return TIERS.slice(); }

  return { find, registrationPlan, speakable, tierLadder, TIER_LABEL, _CATALOG: CATALOG };
});
