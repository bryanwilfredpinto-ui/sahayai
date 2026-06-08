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

  return { parseResume, parseOneLiner, mapProfession, buildReport, speakable, _BUCKETS: BUCKETS, _LEXICON: LEXICON };
});
