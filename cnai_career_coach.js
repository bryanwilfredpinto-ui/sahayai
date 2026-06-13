/* ============================================================================
 * cnai_career_coach.js — Chitti News AI · Build Order 4 · Career Coach
 * ----------------------------------------------------------------------------
 * Resume / one-liner -> profile -> the AI TOOLS + free CERTIFICATIONS that fit
 * THAT profession. NEVER hardcodes professions (Constitution Article 2). Only
 * two tables are hardcoded: a capability LEXICON (keyword -> task-type) and 7
 * capability BUCKETS (category -> tools + free alternative + free cert). Every
 * profession is DERIVED from task-type, so it works for HR, pig farmer,
 * oncologist, puppeteer — any field.
 *
 * Privacy-first: parseResume is regex-only (no LLM, no upload); the UI stores
 * the {role, years, skills, domain} profile in localStorage and "Chitti forget"
 * wipes it. Free-first everywhere. Sensitive categories (clinical/legal/finance)
 * carry a human-in-the-loop caveat.
 *
 * API (window.ChittiCareer / module.exports):
 *   parseResume(text) / parseOneLiner(str) -> profile
 *   mapProfession(profile)  -> { categories[], tools[], certs[], caveats[] }
 *   buildReport(profile)    -> full report object (free-first)
 *   speakable(report, lang) -> audio-first summary
 * ==========================================================================*/
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ChittiCareer = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function norm(s) { return String(s == null ? '' : s).toLowerCase(); }

  // ── Capability lexicon: keyword -> task-type/category. Finite + stable. ──
  const LEXICON = {
    writing: ['write', 'draft', 'report', 'content', 'copy', 'email', 'document', 'notes', 'communication', 'teacher', 'teach', 'lawyer', 'legal', 'journalist', 'marketing'],
    data_analysis: ['data', 'analysis', 'analyst', 'forecast', 'optimi', 'yield', 'finance', 'account', 'ca', 'audit', 'excel', 'metrics', 'sales', 'inventory', 'budget', 'statistics'],
    vision: ['inspect', 'diagnose', 'monitor', 'image', 'photo', 'scan', 'x-ray', 'quality', 'detect', 'doctor', 'radiolog', 'farmer', 'farming', 'crop', 'livestock', 'pig', 'cattle', 'manufactur'],
    scheduling: ['schedule', 'roster', 'appointment', 'calendar', 'booking', 'logistics', 'operations', 'ops', 'planning'],
    customer_comms: ['customer', 'support', 'service', 'client', 'sales', 'recruit', 'talent', 'hr', 'patient', 'help', 'chat', 'respond', 'reception'],
    research: ['research', 'review', 'cite', 'study', 'analy', 'investigat', 'lawyer', 'legal', 'doctor', 'scientist', 'student', 'policy', 'government'],
    domain: ['*'],
  };

  // ── 7 capability buckets: category -> tools (free-first) + free cert + caveat ──
  const BUCKETS = {
    writing: {
      label: 'Writing & content',
      tools: [
        { name: 'ChatGPT / Gemini (free tier)', free: true },
        { name: 'Microsoft Copilot in Word', free: true },
        { name: 'Grammarly (free)', free: true },
      ],
      cert: { name: 'Google AI Essentials', provider: 'Google', free: true },
    },
    data_analysis: {
      label: 'Data analysis & forecasting',
      tools: [
        { name: 'Google Sheets / Excel AI (free)', free: true },
        { name: 'ChatGPT data analysis (free tier)', free: true },
        { name: 'Julius AI (free tier)', free: true },
      ],
      cert: { name: 'IBM AI Fundamentals (SkillsBuild)', provider: 'IBM', free: true },
    },
    vision: {
      label: 'Image / vision AI',
      tools: [
        { name: 'Teachable Machine (Google, free)', free: true },
        { name: 'Roboflow (free tier)', free: true },
        { name: 'Hugging Face vision models (free)', free: true },
      ],
      cert: { name: 'NVIDIA: Generative AI / Computer Vision (free self-paced)', provider: 'NVIDIA', free: true },
    },
    scheduling: {
      label: 'Scheduling & operations',
      tools: [
        { name: 'Google Calendar AI / Reclaim (free tier)', free: true },
        { name: 'Zapier AI automations (free tier)', free: true },
      ],
      cert: { name: 'Microsoft AI Fundamentals (Learn)', provider: 'Microsoft', free: true },
    },
    customer_comms: {
      label: 'Customer communication',
      tools: [
        { name: 'ChatGPT / Gemini for replies (free)', free: true },
        { name: 'HubSpot AI (free tier)', free: true },
        { name: 'Bhashini for Indian-language replies (free)', free: true },
      ],
      cert: { name: 'HubSpot AI / Google AI Essentials', provider: 'HubSpot/Google', free: true },
    },
    research: {
      label: 'Research & review',
      tools: [
        { name: 'Perplexity (free)', free: true },
        { name: 'NotebookLM (Google, free)', free: true },
        { name: 'Elicit (free tier)', free: true },
      ],
      cert: { name: 'Elements of AI (free certificate)', provider: 'U. Helsinki/Reaktor', free: true },
    },
    domain: {
      label: 'AI for your specific field',
      tools: [
        { name: 'Search "AI for [your field]" on Hugging Face / GitHub (free)', free: true },
        { name: 'ChatGPT / Gemini as a domain assistant (free tier)', free: true },
      ],
      cert: { name: 'Skill India / NPTEL AI course for your sector (free)', provider: 'Govt of India', free: true },
    },
  };

  // Sensitive professions -> human-in-the-loop caveat (keyword based, not a job list).
  const SENSITIVE = [
    { kw: ['doctor', 'clinic', 'medical', 'nurse', 'patient', 'oncolog', 'radiolog', 'health'], note: 'CLINICAL: AI assists only — it never diagnoses. A doctor must review every output. Patient data must never go into a public AI tool.' },
    { kw: ['lawyer', 'legal', 'advocate', 'court'], note: 'LEGAL: AI can hallucinate fake citations — verify every case and section yourself before relying on it.' },
    { kw: ['account', 'ca ', 'audit', 'finance', 'tax'], note: 'FINANCIAL: never auto-file. A qualified professional must review; keep client data private.' },
    { kw: ['hr', 'recruit', 'talent', 'hiring'], note: 'HIRING: bias-audit AI screening; keep a human in the loop on every hiring decision.' },
    { kw: ['government', 'govt', 'public', 'citizen'], note: 'GOVERNMENT: never put citizen PII into a public AI tool; follow data-handling rules.' },
  ];

  // ── Resume / one-liner parsing — regex only, privacy-first ──
  const TITLE_LINE = /(?:^|\n)\s*(?:title|role|designation|position)\s*[:\-]\s*(.+)/i;
  function parseResume(text) {
    text = String(text || '');
    const t = norm(text);
    let role = '';
    const m = text.match(TITLE_LINE);
    if (m) role = m[1].trim();
    if (!role) {
      // first non-empty line that looks like a title (short, no '@', no digits-heavy)
      const lines = text.split(/\n/).map(s => s.trim()).filter(Boolean);
      role = (lines.find(l => l.length > 2 && l.length < 60 && !/@|\d{4}/.test(l)) || lines[0] || '').trim();
    }
    // years: sum explicit "X years" OR span of year numbers
    let years = 0;
    const yPhrase = t.match(/(\d{1,2})\+?\s*years?/);
    if (yPhrase) years = parseInt(yPhrase[1], 10);
    if (!years) {
      const yrs = (text.match(/\b(19|20)\d{2}\b/g) || []).map(Number);
      if (yrs.length >= 2) years = Math.max(0, Math.max(...yrs) - Math.min(...yrs));
    }
    // skills: from a Skills section, else keyword scan
    let skills = [];
    const sk = text.match(/(?:skills|key skills|technical skills)\s*[:\-]?\s*([\s\S]{0,300})/i);
    if (sk) skills = sk[1].split(/[,\n;•|]/).map(s => s.trim()).filter(s => s && s.length < 30).slice(0, 12);
    return finalizeProfile({ role: role || 'professional', years: years || 0, skills, domain: inferDomain(t), source: 'resume' });
  }

  function parseOneLiner(str) {
    const s = String(str || '');
    const m = s.match(/i\s*am\s*(?:a |an )?(.+?)\s*(?:with\s*(\d{1,2})\s*years?|$)/i);
    if (m) return finalizeProfile({ role: (m[1] || '').trim() || 'professional', years: m[2] ? parseInt(m[2], 10) : 0, skills: [], domain: inferDomain(norm(s)), source: 'one_liner' });
    return finalizeProfile({ role: s.trim() || 'professional', years: 0, skills: [], domain: inferDomain(norm(s)), source: 'one_liner' });
  }

  function inferDomain(t) {
    if (/health|medical|clinic|patient|doctor|nurse/.test(t)) return 'Healthcare';
    if (/farm|crop|livestock|agri/.test(t)) return 'Agriculture';
    if (/legal|law|court/.test(t)) return 'Legal';
    if (/finance|account|tax|audit/.test(t)) return 'Finance';
    if (/teach|school|student|education/.test(t)) return 'Education';
    if (/develop|software|engineer|program/.test(t)) return 'Technology';
    if (/hr|recruit|talent/.test(t)) return 'Human Resources';
    if (/govern|public|citizen/.test(t)) return 'Government';
    return 'General';
  }

  function seniority(years) { return years >= 8 ? 'senior' : years >= 3 ? 'mid' : 'junior'; }
  function finalizeProfile(p) { p.seniority = seniority(p.years); return p; }

  // ── Map profession -> capability categories (derived from task-type) ──
  function mapProfession(profile) {
    const text = norm((profile.role || '') + ' ' + (profile.domain || '') + ' ' + (profile.skills || []).join(' '));
    const cats = [];
    for (const cat in LEXICON) {
      if (cat === 'domain') continue;
      if (LEXICON[cat].some(kw => text.includes(kw))) cats.push(cat);
    }
    // Baseline: every professional benefits from writing + research; always add domain bucket.
    if (cats.indexOf('writing') === -1) cats.push('writing');
    if (cats.indexOf('research') === -1) cats.push('research');
    cats.push('domain');
    const uniq = cats.filter((c, i) => cats.indexOf(c) === i);

    const tools = [];
    const certs = [];
    uniq.forEach(cat => {
      const b = BUCKETS[cat];
      b.tools.forEach(tool => tools.push({ category: b.label, name: tool.name, free: tool.free }));
      certs.push({ category: b.label, name: b.cert.name, provider: b.cert.provider, free: b.cert.free });
    });
    // dedupe certs by name
    const seen = {};
    const certsU = certs.filter(c => (seen[c.name] ? false : (seen[c.name] = true)));

    const caveats = [];
    SENSITIVE.forEach(s => { if (s.kw.some(kw => text.includes(kw.trim()))) caveats.push(s.note); });

    return { categories: uniq.map(c => BUCKETS[c].label), tools, certs: certsU, caveats };
  }

  function buildReport(profile) {
    const mapping = mapProfession(profile);
    const freeTools = mapping.tools.filter(t => t.free);
    return {
      profile,
      title: 'AI Career Report for ' + (profile.role || 'you'),
      sections: {
        your_profile: { role: profile.role, years: profile.years, seniority: profile.seniority, domain: profile.domain, skills: profile.skills },
        ai_tools: mapping.tools,
        certifications: mapping.certs,           // free-first (all free in the catalog)
        roadmap_handoff: { learn_goal: 'AI for ' + (profile.role || 'my field'), note: 'Hand this goal to the Roadmap engine (BO1) for a 30-day plan.' },
        caveats: mapping.caveats.length ? mapping.caveats : ['AI assists — you decide. Always verify important outputs.'],
      },
      free_tools_count: freeTools.length,
      free_certs_count: mapping.certs.filter(c => c.free).length,
      free_first: mapping.tools.length ? mapping.tools[0].free : true,
      generated_by: 'cnai_career_coach (deterministic, free-first, no profession hardcoded)',
    };
  }

  const SPK = {
    en: { you: 'You are a', with: 'with', years: 'years experience', top: 'Your top AI tools are', cert: 'Your free certification is', and: 'and' },
    hi: { you: 'Aap ek', with: 'hain, with', years: 'saal ka anubhav', top: 'Aapke top AI tools hain', cert: 'Aapka muft certificate hai', and: 'aur' },
  };
  function speakable(report, lang) {
    const L = SPK[lang] || SPK.en;
    const p = report.profile;
    const top3 = report.sections.ai_tools.slice(0, 3).map(t => t.name).join(', ');
    const cert = (report.sections.certifications[0] || {}).name || 'a free Google AI course';
    return L.you + ' ' + (p.role || 'professional') + ' ' + L.with + ' ' + (p.years || 0) + ' ' + L.years + '. ' + L.top + ': ' + top3 + '. ' + L.cert + ': ' + cert + '.';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BO4 v2 (2026-06-13): TOOL_REPLACEMENT_MAP, mapUpgradePath, detectPsychology
  // (Skill 11 / SOP 9). Additive — original API unchanged. Free-first, honest.
  // ══════════════════════════════════════════════════════════════════════════

  // TOOL_REPLACEMENT_MAP — per CNAI_UI_UX.md §10 (Task #26). Deterministic, no LLM.
  // Spec shape {aiReplacement, provider, free, hours, why}; legacy {from,to,does}
  // kept so older callers/tests stay green. Free-first; tools stay English.
  function trm(from, aiReplacement, provider, free, hours, why) {
    return { from, aiReplacement, provider, free: free, hours, why,
      to: [{ name: aiReplacement, free: free }], does: why, cost_tag: free ? 'FREE' : 'PAID' };
  }
  const TOOL_REPLACEMENT_MAP = {
    'excel':         trm('Excel', 'Gemini in Sheets', 'Google', true, 1, 'AI formulas, data analysis, chart generation'),
    'word':          trm('Word', 'Gemini in Docs', 'Google', true, 1, 'AI drafting, rewriting, summarising'),
    'powerpoint':    trm('PowerPoint', 'Gamma.app', 'Gamma', true, 0.5, 'AI slide generation from bullet points'),
    'email':         trm('Email', 'Gmail AI / Gemini', 'Google', true, 0.25, 'Draft replies, summarise threads'),
    'whatsapp':      trm('WhatsApp', 'Meta AI in WhatsApp', 'Meta', true, 0.5, 'Answer questions, draft messages'),
    'google search': trm('Google Search', 'NotebookLM', 'Google', true, 1, 'Research with citations from your own docs'),
    'google drive':  trm('Google Drive', 'Gemini in Drive', 'Google', true, 0.5, 'Summarise, search, generate from files'),
    'phone calls':   trm('Phone calls', 'Otter.ai', 'Otter', true, 0.5, 'Transcribe calls, auto-generate notes'),
    'paper forms':   trm('Paper forms', 'Google Forms + AI', 'Google', true, 1, 'AI-generated forms from plain description'),
    'calculator':    trm('Calculator', 'Gemini / ChatGPT', 'Google/OpenAI', true, 0.25, 'Complex calculations + step-by-step explanation'),
    'tally':         trm('Tally', 'Zoho Books AI', 'Zoho', false, 2, 'AI bookkeeping — paid, Indian-market leader'),
    'web browsing':  trm('Web browsing', 'Perplexity AI', 'Perplexity', true, 0.5, 'AI search with cited sources'),
  };
  // Normalised lookup index (strip non-alpha) + aliases so "PPT", "MS Excel",
  // "Google Search" all resolve. Tools NOT in the map → null (caller handles).
  const _TRM_INDEX = {};
  Object.keys(TOOL_REPLACEMENT_MAP).forEach(k => { _TRM_INDEX[k.replace(/[^a-z]/g, '')] = TOOL_REPLACEMENT_MAP[k]; });
  const _TRM_ALIAS = { ppt: 'powerpoint', gsearch: 'googlesearch', gdrive: 'googledrive', phone: 'phonecalls', calc: 'calculator' };
  function replacementFor(tool) {
    let k = norm(tool).replace(/[^a-z]/g, '');
    if (_TRM_ALIAS[k]) k = _TRM_ALIAS[k];
    if (_TRM_INDEX[k]) return _TRM_INDEX[k];
    if (k.includes('powerpoint')) return _TRM_INDEX.powerpoint;
    const keys = Object.keys(_TRM_INDEX).sort((a, b) => b.length - a.length);
    for (const key of keys) { if (k.includes(key)) return _TRM_INDEX[key]; }
    return null;
  }

  // 5–8 free certs per domain (free-first; provider named). Seeds, not a ceiling.
  const PROFESSION_CERTS = {
    General: [
      { name: 'Elements of AI', provider: 'U. Helsinki/Reaktor', free: true },
      { name: 'Google AI Essentials', provider: 'Google', free: true },
      { name: 'IBM AI Fundamentals', provider: 'IBM SkillsBuild', free: true },
      { name: 'Introduction to AI', provider: 'NIELIT (Govt, Hindi+En)', free: true },
      { name: 'AI for Everyone', provider: 'DeepLearning.AI (audit free)', free: true },
    ],
  };
  // Paid options exist too — they are shown LAST (free-first, Pillar 1) and tagged
  // PAID with exact cost (SOP 11: cost disclosed). Free-first is never relaxed.
  const PAID_CERTS = {
    General: [
      { name: 'Google Professional ML Engineer', provider: 'Google Cloud', free: false, cost: '₹16,500 exam' },
      { name: 'AWS ML — Specialty', provider: 'Amazon Web Services', free: false, cost: '₹33,000 exam' },
    ],
    Healthcare: [{ name: 'Stanford AI in Healthcare (Coursera cert)', provider: 'Stanford/Coursera', free: false, cost: '₹4,000/mo (audit FREE)' }],
    Finance: [{ name: 'AI in Finance Professional Cert', provider: 'Coursera', free: false, cost: '₹4,000/mo (audit FREE)' }],
    Technology: [{ name: 'TensorFlow Developer Certificate', provider: 'Google', free: false, cost: '$100 exam' }],
  };
  // Real verification URLs + typical hours per cert (for the [Start this cert] link).
  const CERT_META = {
    'Elements of AI': { url: 'https://www.elementsofai.com/', hours: 6 },
    'Google AI Essentials': { url: 'https://grow.google/ai-essentials/', hours: 5 },
    'IBM AI Fundamentals': { url: 'https://skillsbuild.org/', hours: 4 },
    'Introduction to AI': { url: 'https://www.nielit.gov.in/', hours: 8 },
    'AI for Everyone': { url: 'https://www.coursera.org/learn/ai-for-everyone', hours: 6 },
    'AI in Healthcare': { url: 'https://skillsbuild.org/', hours: 4 },
    'Digital Health & AI': { url: 'https://www.who.int/', hours: 5 },
    'Digital Agriculture': { url: 'https://swayam.gov.in/', hours: 8 },
    'AI in Finance basics': { url: 'https://skillsbuild.org/', hours: 4 },
    'AI & Law intro': { url: 'https://nptel.ac.in/', hours: 8 },
    'AI for Educators': { url: 'https://grow.google/', hours: 2 },
    'Hugging Face AI Agents (cert)': { url: 'https://huggingface.co/learn/agents-course', hours: 10 },
    'ML with Python': { url: 'https://www.freecodecamp.org/learn/', hours: 12 },
    'Digital India AI': { url: 'https://www.nielit.gov.in/', hours: 8 },
    'Google Professional ML Engineer': { url: 'https://cloud.google.com/learn/certification/machine-learning-engineer', hours: 80 },
    'AWS ML — Specialty': { url: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/', hours: 80 },
    'Stanford AI in Healthcare (Coursera cert)': { url: 'https://www.coursera.org/specializations/ai-healthcare', hours: 40 },
    'AI in Finance Professional Cert': { url: 'https://www.coursera.org/', hours: 30 },
    'TensorFlow Developer Certificate': { url: 'https://www.tensorflow.org/certificate', hours: 40 },
  };
  // Every cert carries `free`, a `tag` ('FREE'/'PAID'), plus url + hours for the UI.
  function tagCert(c) { const m = CERT_META[c.name] || {}; return Object.assign({ tag: c.free ? 'FREE' : 'PAID', url: m.url || '', hours: m.hours || null }, c); }
  function certsForDomain(domain) {
    const base = PROFESSION_CERTS.General.slice();
    const d = norm(domain);
    if (/health/.test(d)) base.unshift({ name: 'AI in Healthcare', provider: 'IBM SkillsBuild', free: true }, { name: 'Digital Health & AI', provider: 'WHO Academy', free: true });
    else if (/agri|farm/.test(d)) base.unshift({ name: 'Digital Agriculture', provider: 'SWAYAM (Govt)', free: true });
    else if (/finance/.test(d)) base.unshift({ name: 'AI in Finance basics', provider: 'IBM SkillsBuild', free: true });
    else if (/legal/.test(d)) base.unshift({ name: 'AI & Law intro', provider: 'NPTEL (Govt)', free: true });
    else if (/educat/.test(d)) base.unshift({ name: 'AI for Educators', provider: 'Google', free: true });
    else if (/tech/.test(d)) base.unshift({ name: 'Hugging Face AI Agents (cert)', provider: 'Hugging Face', free: true }, { name: 'ML with Python', provider: 'freeCodeCamp', free: true });
    else if (/govern/.test(d)) base.unshift({ name: 'Digital India AI', provider: 'NIELIT (Govt)', free: true });
    // dedupe FREE by name, cap free list at 6
    const seen = {}; const freeList = base.filter(c => seen[c.name] ? false : (seen[c.name] = true)).slice(0, 6);
    // append PAID options (domain-specific first, then General) — ALWAYS after free.
    const domKey = /health/.test(d) ? 'Healthcare' : /finance/.test(d) ? 'Finance' : /tech/.test(d) ? 'Technology' : null;
    const paid = ((domKey && PAID_CERTS[domKey]) || []).concat(PAID_CERTS.General);
    const paidU = paid.filter(c => seen[c.name] ? false : (seen[c.name] = true)).slice(0, 2);
    return freeList.concat(paidU).map(tagCert);   // free-first, both tags present
  }

  function mentorVoice(profile) {
    const role = (profile && profile.role) || 'professional';
    const yrs = (profile && profile.years) || 0;
    const sen = (profile && profile.seniority) || 'mid';
    if (sen === 'senior' || yrs >= 8) return 'As a ' + role + ' of ' + yrs + ' years, here is what I would tell you: your domain expertise is your unfair advantage. AI is a tool to augment it, not replace it. Learn the few tools that touch your daily work first — nothing more.';
    if (sen === 'junior' || yrs < 3) return 'You are early in your ' + role + ' journey — that is an advantage: you can build AI into your habits from the start. Pick one free tool this week and use it on real work.';
    return 'With ' + yrs + ' years as a ' + role + ', you know the real problems in your field. AI helps you solve them faster. Start with one tool that fits your daily work, free, this week.';
  }

  function first30Days(profile, replacements) {
    const r0 = replacements[0] && replacements[0].to[0] ? replacements[0].to[0].name : 'one free AI tool (ChatGPT/Gemini free tier)';
    return [
      { week: 1, focus: 'Foundations', action: 'Spend 2 hours on a free "AI for Everyone"-style course. Goal: explain AI to a colleague.' },
      { week: 2, focus: 'One tool', action: 'Use ' + r0 + ' on one real task from your work. Check the output yourself.' },
      { week: 3, focus: 'Prompting', action: 'Learn prompt basics (role + task + example + format). Redo last week\'s task better.' },
      { week: 4, focus: 'Free cert + proof', action: 'Enrol in one free certificate for your field and save one example of your AI-assisted work.' },
    ];
  }

  // mapUpgradePath(professionOrProfile, currentTools[]) — the v2 headline output.
  // Per spec, the first arg may be a PROFESSION STRING ("teacher", "I raise pigs")
  // OR an already-parsed profile object. Both work (backward-compatible).
  function mapUpgradePath(professionOrProfile, legacyTools) {
    let profile;
    if (professionOrProfile && typeof professionOrProfile === 'object') profile = professionOrProfile;
    else if (typeof professionOrProfile === 'string' && professionOrProfile.trim()) profile = parseOneLiner(professionOrProfile);
    else profile = finalizeProfile({ role: 'professional', years: 0, skills: [], domain: 'General' });
    const tools = (Array.isArray(legacyTools) ? legacyTools : []).filter(t => norm(t) !== 'none');
    const tool_replacements = tools.map(t => {
      const r = replacementFor(t);
      if (!r) return { tool: String(t), from: String(t), aiReplacement: 'Search "AI for ' + t + '"', provider: 'web', free: true, hours: null, why: 'find a free AI assistant for this task', cost_tag: 'FREE', to: [{ name: 'Search "AI for ' + t + '" (free tools first)', free: true }], does: 'find a free AI assistant for this task', note: 'No mapped replacement yet — Chitti will research it.' };
      return {
        tool: r.from, from: r.from, aiReplacement: r.aiReplacement, provider: r.provider,
        free: r.free, hours: r.hours, why: r.why, does: r.why, to: r.to,
        cost_tag: r.free ? 'FREE' : 'PAID',
        message: 'STOP relying only on ' + r.from + ' → START using ' + r.aiReplacement + ' (' + (r.free ? 'FREE' : 'PAID') + ') to ' + r.why + '.',
      };
    });
    const profession_certs = certsForDomain(profile.domain);
    // free-first = every FREE cert appears before every PAID cert (ordering, not "all free").
    const firstPaidIdx = profession_certs.findIndex(c => !c.free);
    const lastFreeIdx = profession_certs.reduce((acc, c, i) => (c.free ? i : acc), -1);
    const freeFirstOrdered = firstPaidIdx === -1 || lastFreeIdx < firstPaidIdx;
    const freeCertN = profession_certs.filter(c => c.free).length;
    const role = profile.role || 'professional';
    const oneLineSummary = tool_replacements.length
      ? ('As a ' + role + ', swap ' + tool_replacements.length + ' everyday tool' + (tool_replacements.length > 1 ? 's' : '') + ' for free AI — and earn ' + freeCertN + ' free certificate' + (freeCertN > 1 ? 's' : '') + '.')
      : ('As a ' + role + ', start with ' + freeCertN + ' free AI certificate' + (freeCertN > 1 ? 's' : '') + ' for your field.');
    return {
      profile: { role: profile.role, years: profile.years, seniority: profile.seniority, domain: profile.domain },
      tool_replacements,           // spec shape: tool · aiReplacement · provider · free · hours · why
      replacements: tool_replacements,   // CNAI_UI_UX.md §10 alias
      profession_certs,                  // FREE options first, PAID (tagged + cost + url) last
      certs: profession_certs,           // CNAI_UI_UX.md §10 alias
      free_certs_count: freeCertN,
      paid_certs_count: profession_certs.filter(c => !c.free).length,
      mentor_voice: mentorVoice(profile),
      first_30_days_plan: first30Days(profile, tool_replacements),
      free_first: freeFirstOrdered,
      oneLineSummary: oneLineSummary,
      cta: 'Ready to start? Tap a tool above to see your free AI replacement, or build your roadmap.',
      // Exact honest disclaimer from CNAI_UI_UX.md (§MANDATORY CONTRACT + §10).
      disclaimer: 'These tools ASSIST — they don\'t replace your skills. Results depend on your practice and effort.',
      honesty_note: 'These tools and free certs build skills employers seek. Job outcomes depend on your whole profile — Chitti never promises a job.',
      generated_by: 'cnai_career_coach.mapUpgradePath v2 (free-first, no profession hardcoded)',
    };
  }

  // ── Learning Psychology (Skill 11 / SOP 9): overwhelm / imposter / cert-chasing ──
  const PSY = {
    overwhelm: { signals: [/too much/i, /too many/i, /don'?t know where to (start|begin)/i, /so many (options|courses|things)/i, /overwhelm/i, /lost/i, /give up/i, /confus(ed|ing) by all/i] },
    imposter:  { signals: [/not smart enough/i, /everyone (knows|is) (more|better)/i, /i don'?t belong/i, /too old/i, /people like me/i, /not good enough/i, /can'?t do this/i] },
    cert_chasing: { signals: [/which (cert|certificate|certification) (will|should|gets? me a job)/i, /just want the certificate/i, /collect(ing)? certificates?/i, /only (need|want) the cert/i, /how many certs/i] },
  };
  function detectPsychology(text) {
    const t = String(text || '');
    let state = null;
    if (PSY.overwhelm.signals.some(re => re.test(t))) state = 'overwhelm';
    else if (PSY.imposter.signals.some(re => re.test(t))) state = 'imposter';
    else if (PSY.cert_chasing.signals.some(re => re.test(t))) state = 'cert_chasing';
    const responses = {
      overwhelm: { detected: true, state, response: 'That feeling is completely normal — AI has an overwhelming amount of content. Forget all of it for a moment. Tell me ONE thing you want to be able to DO in 2 weeks, and we start there — just one step.', options: ['Use one AI tool at work', 'Understand AI news in my field', 'Build a tiny project'], rule: 'Never show a course list or more than 3 options to an overwhelmed user.' },
      imposter:  { detected: true, state, response: 'Many senior professionals feel exactly this — even top AI researchers describe it. Your experience in your field is real expertise a fresher does not have. That is your unfair advantage. Let us take one small, achievable first win.', rule: 'Validate + reframe to existing competence + one easy win. Never empty "you are great" or dismissal.' },
      cert_chasing: { detected: true, state, response: 'A certificate without the skill behind it will not help your career. Certificates open doors; portfolios keep you inside. Let me teach you the material first, then we pick ONE worthwhile free cert and a small project to prove it.', rule: 'Apply the certification gate + redirect to skills + a portfolio project.' },
    };
    return state ? responses[state] : { detected: false, state: null, response: '', rule: '' };
  }

  return {
    parseResume, parseOneLiner, mapProfession, buildReport, speakable, _BUCKETS: BUCKETS, _LEXICON: LEXICON,
    // BO4 v2 additions (backward-compatible):
    mapUpgradePath, detectPsychology, mentorVoice, certsForDomain, _TOOL_REPLACEMENT_MAP: TOOL_REPLACEMENT_MAP, _PROFESSION_CERTS: PROFESSION_CERTS,
  };
});
