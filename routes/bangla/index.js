// ═══════════════════════════════════════════════════════════════
// HAT: bangla
// Chitti Bangla — language specialist with confidence routing.
// ≥0.80 → brain answers. <0.80 → DeepSeek fallback + log for graduation.
// 6-month graduation: by Oct 27, 2026, brain handles ≥80% on its own.
// ═══════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const log = require('../../lib/logger').forHat('bangla');
const { call: deepseekCall } = require('../../lib/deepseek');
const learning = require('../../lib/learning');
const { findBest } = require('./matcher');

const BRAIN_PATH = path.join(__dirname, 'brain.json');

// Load brain at module load time. Hat loader will fail-fast if this throws.
let BRAIN = null;
try {
  BRAIN = JSON.parse(fs.readFileSync(BRAIN_PATH, 'utf8'));
  log.info('brain_loaded', {
    qa_count: BRAIN.qa_pairs.length,
    version: BRAIN._meta.version,
    graduation_target: BRAIN._meta.honest_status.graduation_target_date,
  });
} catch (err) {
  log.error('brain_load_failed', { error: err.message });
  // Hat loader will catch this on register
  throw err;
}

const MIN_CONFIDENCE = (BRAIN.confidence_thresholds && BRAIN.confidence_thresholds.min_to_serve) || 0.80;

const FALLBACK = 'একটু সমস্যা হয়েছে। আবার চেষ্টা করুন।';
const BANGLA_SYSTEM = `You are CHITTI — a warm Bangla-speaking AI assistant for Bengali users in India and Bangladesh.
ALWAYS respond in Bangla (বাংলা) using Bengali script. Keep responses short (3-4 lines).
Tone: warm, friend-philosopher-guide, like a trusted Bengali elder.
Use 'আপনি' (formal you) by default unless master is younger or asks for 'তুমি'.
NEVER hallucinate facts. If unsure, say "এটা আমি যাচাই করে বলব।"
This is a fallback — every reply you give helps Chitti's own Bangla brain learn for the future.`;

module.exports = {
  meta: {
    hat: 'bangla',
    version: '1.0.0',
    owner: 'sire',
    description: 'Bangla language specialist — confidence-routed brain with DeepSeek fallback. Graduation target: Oct 27, 2026.',
    languages: ['bn'],
    sla: { p99_ms: 30000, availability: 0.99 },
    pii_tier: 'safe',           // user query goes to DeepSeek on fallback — same tier as chat hat
    deepseek_fallback: true,
    graduation_target: BRAIN._meta.honest_status.graduation_target_date,
    qa_pairs: BRAIN.qa_pairs.length,
    min_confidence: MIN_CONFIDENCE,
  },

  register(app, ctx) {
    // CHAT — confidence-routed Bangla
    app.post('/api/bangla/chat', async (req, res) => {
      const { message, history = [], master_profile = {} } = req.body || {};
      if (!message || typeof message !== 'string' || message.length > 2000) {
        return res.status(400).json({ error: 'Invalid message' });
      }

      // Try the brain first
      const match = findBest(message, BRAIN);
      if (match.confidence >= MIN_CONFIDENCE) {
        await learning.log({
          hat: 'bangla',
          query: message,
          confidence: match.confidence,
          source: 'brain',
          extra: { qa_id: match.qa.id, category: match.qa.category },
        });
        return res.json({
          reply: match.qa.a,
          source: 'chitti_bangla',
          confidence: Number(match.confidence.toFixed(3)),
          category: match.qa.category,
          trigger_action: match.qa.trigger_action || null,
          timestamp: new Date().toISOString(),
        });
      }

      // Confidence too low → DeepSeek fallback
      try {
        const { reply } = await deepseekCall({
          systemPrompt: BANGLA_SYSTEM,
          history,
          message,
          callerHat: 'bangla',
        });
        await learning.log({
          hat: 'bangla',
          query: message,
          confidence: match.confidence,
          source: 'fallback',
          reply,
        });
        return res.json({
          reply,
          source: 'deepseek_fallback',
          confidence: Number(match.confidence.toFixed(3)),
          learning_logged: true,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        log.error('fallback_failed', { error: err.message });
        return res.status(503).json({ error: 'Bangla service temporarily unavailable', reply: FALLBACK });
      }
    });

    // STATS — graduation progress dashboard
    app.get('/api/bangla/stats', (req, res) => {
      res.json({
        loaded: true,
        version: BRAIN._meta.version,
        qa_pairs: BRAIN.qa_pairs.length,
        confidence_threshold: MIN_CONFIDENCE,
        graduation_target_date: BRAIN._meta.honest_status.graduation_target_date,
        graduation_criterion: BRAIN._meta.honest_status.graduation_criterion,
        pillars: BRAIN._meta.constitution,
        honest_status: BRAIN._meta.honest_status,
      });
    });
  },

  cron: [],

  health() {
    return {
      ok: BRAIN !== null,
      qa_pairs: BRAIN ? BRAIN.qa_pairs.length : 0,
      confidence_threshold: MIN_CONFIDENCE,
      endpoints: ['POST /api/bangla/chat', 'GET /api/bangla/stats'],
      graduation_target: BRAIN ? BRAIN._meta.honest_status.graduation_target_date : null,
    };
  },
};
