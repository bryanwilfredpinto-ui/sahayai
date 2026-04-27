// ═══════════════════════════════════════════════════════════════
// routes/devops/handlers.js
// Parse "Deploy Chitti [NAME] from [DOMAIN]" → classify → scaffold hat files.
// Pure logic. No GitHub calls here (those live in ingestion_runner.js).
// ═══════════════════════════════════════════════════════════════
const path = require('path');
const fs = require('fs');

const RULES = require('./domain_rules.json');

// ── Parse the install command ───────────────────────────────────
// Accepted shapes (case-insensitive):
//   "Deploy Chitti CA"
//   "Deploy Chitti CA from Tax & GST"
//   "Install Chitti News Sports Cricket"
//   "install chitti mf"
function parseInstallCommand(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, error: 'command is empty' };
  }
  const text = raw.trim().replace(/\s+/g, ' ');
  const re = /^(?:deploy|install)\s+chitti\s+([a-z0-9_ \-]+?)(?:\s+from\s+(.+))?$/i;
  const m = text.match(re);
  if (!m) {
    return { ok: false, error: `Could not parse. Expected: "Deploy Chitti [NAME]" or "Deploy Chitti [NAME] from [DOMAIN]". Got: "${raw}"` };
  }
  const namePart = m[1].trim().toLowerCase().replace(/\s+/g, '_');
  const domain = (m[2] || namePart).trim();
  return { ok: true, name: namePart, domain, raw };
}

// ── Look up the rule for a name (handles aliases + 3-level taxonomy) ─
function lookupRule(name) {
  if (RULES.blocked_names.includes(name)) {
    return { matched: false, blocked: true, reason: `'${name}' already exists or is reserved.` };
  }
  // Direct match
  for (const r of RULES.rules) {
    if (r.name === name) return { matched: true, rule: r };
  }
  // Alias match
  for (const r of RULES.rules) {
    if (Array.isArray(r.aliases) && r.aliases.includes(name)) return { matched: true, rule: { ...r, resolved_from_alias: name } };
  }
  // 3-level taxonomy: news_sports_cricket → leaf is 'cricket'
  const tokens = name.split('_');
  if (tokens.length > 1) {
    const leaf = tokens[tokens.length - 1];
    for (const r of RULES.rules) {
      if (r.name === leaf || (Array.isArray(r.aliases) && r.aliases.includes(leaf))) {
        return { matched: true, rule: { ...r, taxonomy_path: tokens } };
      }
    }
  }
  // Fallback: unknown domain → conservative defaults
  return { matched: false, rule: { ...RULES.default_for_unknown, name, sources_planned: [], ingest_script: null, language_codes: ['en', 'hi'] } };
}

// ── Build the plan (Phase 5a approval payload) ──────────────────
function buildPlan(parsed) {
  const lookup = lookupRule(parsed.name);
  if (lookup.blocked) {
    return { ok: false, error: lookup.reason };
  }
  const rule = lookup.rule;
  const category = rule.category || RULES.default_for_unknown.category;

  const plan = {
    name: parsed.name,
    domain: parsed.domain,
    category,
    pii_tier: rule.pii_tier,
    confidence_min: rule.confidence_min,
    update_frequency: rule.update_frequency,
    languages: rule.language_codes || ['en', 'hi'],
    sources_planned: rule.sources_planned || [],
    ingest_script: rule.ingest_script || null,
    channel: rule.channel || null,
    implementation: rule.implementation || null,
    taxonomy_path: rule.taxonomy_path || null,
    rule_matched: lookup.matched,
    files_to_write: [
      `routes/${parsed.name}/index.js`,
      ...(category === 'knowledge' ? [`routes/${parsed.name}/brain.json`, `routes/${parsed.name}/matcher.js`] : []),
      ...(category === 'knowledge' ? [`routes/${parsed.name}/feedback.js`] : [`routes/${parsed.name}/feedback.js`]),
    ],
    will_run_ingestion_on: category === 'knowledge' ? 'github_actions (cloud, NOT laptop)' : 'n/a (action specialist)',
    honest_warnings: lookup.matched ? [] : [
      `'${parsed.name}' not in domain_rules.json — using conservative defaults. Sire should ratify rule before production.`
    ],
  };

  if (!lookup.matched) {
    plan.honest_warnings.push('Brain will be scaffolded with _meta.constitution pillars all marked "not yet ingested".');
  }
  return { ok: true, plan };
}

// ── Scaffolding: build the hat files (returned as in-memory blobs) ─
function scaffoldHat(plan) {
  const files = {};
  const hatId = plan.name;

  // 1. index.js — module contract
  files[`routes/${hatId}/index.js`] = renderIndexJs(plan);

  // 2. feedback.js — shadow feedback (Section 17 rule, every leaf gets one)
  files[`routes/${hatId}/feedback.js`] = renderFeedbackJs(plan);

  if (plan.category === 'knowledge') {
    // 3. brain.json — honest skeleton, all pillars marked "not yet ingested"
    files[`routes/${hatId}/brain.json`] = renderBrainJson(plan);
    // 4. matcher.js — keyword scoring
    files[`routes/${hatId}/matcher.js`] = renderMatcherJs(plan);
  } else if (plan.category === 'action') {
    // action specialists get a handlers stub instead of brain
    files[`routes/${hatId}/handlers.js`] = renderActionHandlersJs(plan);
  }

  return files;
}

// ── Renderers ───────────────────────────────────────────────────
function renderIndexJs(plan) {
  const langArr = JSON.stringify(plan.languages);
  const isKnowledge = plan.category === 'knowledge';

  const handlerBlock = isKnowledge
    ? `    app.post('/api/${plan.name}/ask', async (req, res) => {
      const { query = '', lang = 'en' } = req.body || {};
      try {
        const match = findBest(query, brain);
        if (match.confidence >= ${plan.confidence_min || 0.80}) {
          return res.json({ source: 'brain', confidence: match.confidence, reply: match.qa.a });
        }
        // Fall back to DeepSeek (PII-guarded)
        const safe = ctx.piiGuard.enforce({ query, lang }, '${plan.name}', '${plan.pii_tier}');
        const { reply } = await ctx.deepseek.call({
          systemPrompt: 'You are Chitti ${plan.name}. Answer in ' + lang + '.',
          history: [], message: safe.query, callerHat: '${plan.name}',
        });
        ctx.learning.log({ hat: '${plan.name}', query, confidence: match.confidence, source: 'fallback', reply });
        res.json({ source: 'deepseek_fallback', reply });
      } catch (err) {
        log.error('ask_failed', { error: err.message });
        res.status(503).json({ error: module.exports.fallback[lang] || module.exports.fallback.en });
      }
    });

    // Shadow feedback (Section 17 — every leaf has its own)
    require('./feedback').register(app, ctx);`
    : `    // Action specialist — handlers operate on user's own channels via OAuth/native bridge
    require('./handlers').register(app, ctx, log);

    // Shadow feedback
    require('./feedback').register(app, ctx);`;

  const requireBlock = isKnowledge
    ? `const { findBest } = require('./matcher');
const brain = require('./brain.json');`
    : `// Action specialist — no brain.json`;

  return `// ═══════════════════════════════════════════════════════════════
// HAT: ${plan.name}
// Auto-scaffolded by Chitti DevOps on ${new Date().toISOString()}
// Category: ${plan.category} | PII tier: ${plan.pii_tier}
// ═══════════════════════════════════════════════════════════════
const log = require('../../lib/logger').forHat('${plan.name}');
${requireBlock}

module.exports = {
  meta: {
    hat: '${plan.name}',
    version: '1.0.0',
    owner: 'sire',
    description: 'Auto-scaffolded ${plan.category} specialist for domain: ${plan.domain}',
    languages: ${langArr},
    sla: { p99_ms: 1500, availability: 0.99 },
    pii_tier: '${plan.pii_tier}',
    deepseek_fallback: ${isKnowledge ? 'true' : 'false'},
    graduation_target: ${isKnowledge ? `'${plusMonths(6)}'` : 'null'},
    sources: ${JSON.stringify(plan.sources_planned)},
    honest_status: 'scaffolded by devops; corpus ${isKnowledge ? 'not yet ingested' : 'n/a (action)'}',
  },

  register(app, ctx) {
${handlerBlock}
  },

  fallback: {
    en: 'Chitti ${plan.name} is briefly unavailable. Try again in a moment.',
    hi: 'Chitti ${plan.name} सेवा अभी उपलब्ध नहीं है। कुछ देर बाद कोशिश करें।',
    bn: 'Chitti ${plan.name} পরিষেবা সাময়িকভাবে অনুপলব্ধ। একটু পরে চেষ্টা করুন।',
  },

  health() {
    return {
      ok: true,
      endpoints: ${isKnowledge ? `['POST /api/${plan.name}/ask']` : `['action handlers — see handlers.js']`},
      honest_status: '${isKnowledge ? 'brain scaffolded; ingestion pending GitHub Action run' : 'action stub; OAuth/native bridge pending'}',
    };
  },
};
`;
}

function renderFeedbackJs(plan) {
  return `// ═══════════════════════════════════════════════════════════════
// SHADOW FEEDBACK for routes/${plan.name}/
// Constitutional rule (handover Section 5.4): feedback exists ONLY as a
// shadow inside each specialist. NO standalone feedback hat.
// ═══════════════════════════════════════════════════════════════
const log = require('../../lib/logger').forHat('${plan.name}_feedback');

const FEEDBACK = []; // in-memory v1; v2 → DB

module.exports = {
  register(app, ctx) {
    app.post('/api/${plan.name}/feedback', async (req, res) => {
      const { user_id, query, reply, rating, comment, lang = 'en' } = req.body || {};
      if (rating === undefined) {
        return res.status(400).json({ error: 'rating required (1-5)' });
      }
      const entry = {
        id: Date.now() + '_' + Math.random().toString(36).slice(2,7),
        hat: '${plan.name}',
        user_id, query, reply, rating, comment, lang,
        created_at: new Date().toISOString(),
      };
      FEEDBACK.push(entry);
      log.info('feedback_received', { rating, hat: '${plan.name}' });
      // Forward to learning queue (anonymized)
      try {
        await ctx.learning.log({
          hat: '${plan.name}', query, confidence: null,
          source: 'user_feedback', reply, extra: { rating, comment },
        });
      } catch (e) {
        log.warn('learning_log_failed', { error: e.message });
      }
      res.json({ ok: true, id: entry.id });
    });
  },
  _store: FEEDBACK, // for tests
};
`;
}

function renderBrainJson(plan) {
  const created = new Date().toISOString().slice(0, 10);
  return JSON.stringify({
    _meta: {
      specialist: `chitti_${plan.name}`,
      version: 'v1.0',
      created,
      scaffolded_by: 'chitti_devops',
      honest_status: {
        qa_pairs_count: 0,
        corpus_built: false,
        voice_built: false,
        vector_db_built: false,
        deepseek_fallback_active: true,
        graduation_target_date: plusMonths(6),
        graduation_criterion: `When chitti_${plan.name} handles >= 80% of queries with confidence >= 0.80, DeepSeek fallback is removed.`,
      },
      constitution: {
        pillar_1_vocabulary: { status: 'declared, not yet ingested', sources_planned: plan.sources_planned },
        pillar_2_templates:  { status: 'declared, not yet ingested', sources_planned: [] },
        pillar_3_voice:      { status: 'declared, not yet built', languages: plan.languages },
        pillar_4_cousins:    { parent: plan.taxonomy_path ? plan.taxonomy_path.slice(0, -1).join('/') : null, siblings: [] },
        pillar_5_sleep_mode: 'on-device pattern learning, never sent to server',
        pillar_6_federation: 'anonymous learning queue improves brain over time',
      },
    },
    confidence_thresholds: { min_to_serve: plan.confidence_min || 0.80 },
    qa_pairs: [],
    fallback_template: {
      to_user: `Chitti ${plan.name} is still learning. Falling back to general assistant.`,
      log_for_learning: true,
    },
  }, null, 2);
}

function renderMatcherJs(plan) {
  return `// ═══════════════════════════════════════════════════════════════
// routes/${plan.name}/matcher.js
// Keyword + example scoring. Same shape as routes/bangla/matcher.js.
// ═══════════════════════════════════════════════════════════════
function findBest(query, brain) {
  if (!query || !brain || !Array.isArray(brain.qa_pairs) || brain.qa_pairs.length === 0) {
    return { confidence: 0, qa: null, reason: 'empty_brain' };
  }
  const q = query.toLowerCase();
  let best = { confidence: 0, qa: null };

  for (const qa of brain.qa_pairs) {
    // Exact-example match → high confidence
    if (Array.isArray(qa.q_examples)) {
      for (const ex of qa.q_examples) {
        if (q.includes(ex.toLowerCase())) {
          const c = (qa.confidence_base || 0.95);
          if (c > best.confidence) best = { confidence: c, qa };
        }
      }
    }
    // Keyword overlap
    if (Array.isArray(qa.q_keywords)) {
      let hits = 0;
      for (const kw of qa.q_keywords) {
        if (q.includes(kw.toLowerCase())) hits++;
      }
      if (hits > 0) {
        const c = Math.min(0.95, 0.5 + 0.1 * hits) * (qa.confidence_base || 1);
        if (c > best.confidence) best = { confidence: c, qa };
      }
    }
  }
  return best;
}

module.exports = { findBest };
`;
}

function renderActionHandlersJs(plan) {
  return `// ═══════════════════════════════════════════════════════════════
// routes/${plan.name}/handlers.js
// Action specialist — operates on USER's own channel: ${plan.channel}
// Implementation: ${plan.implementation}
// Constitutional rule (handover 5.5): NO Twilio/Aisensy/Interakt.
// Acts on behalf of master, USING master's own credentials.
// ═══════════════════════════════════════════════════════════════
module.exports = {
  register(app, ctx, log) {
    // Stub — actual OAuth / native bridge wiring is platform work (Android/iOS).
    // Server side exposes intent endpoints; the device-side app fulfills them.
    app.post('/api/${plan.name}/intent', async (req, res) => {
      const { user_id, action, params = {}, lang = 'en' } = req.body || {};
      if (!user_id || !action) {
        return res.status(400).json({ error: 'user_id and action required' });
      }
      // PII-guard (action specialists must NEVER leak channel-level PII)
      try {
        ctx.piiGuard.enforce(params, '${plan.name}', '${plan.pii_tier}');
      } catch (e) {
        return res.status(400).json({ error: 'pii_violation', detail: e.message });
      }
      log.info('intent_received', { user_id, action, channel: '${plan.channel}' });
      // Return an intent envelope the device-side Chitti app executes
      res.json({
        ok: true,
        envelope: {
          channel: '${plan.channel}',
          implementation: '${plan.implementation}',
          action, params,
          honest_note: 'server-side stub; device app must complete the action',
        },
      });
    });
  },
};
`;
}

// ── Helpers ─────────────────────────────────────────────────────
function plusMonths(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

module.exports = {
  parseInstallCommand,
  lookupRule,
  buildPlan,
  scaffoldHat,
};
