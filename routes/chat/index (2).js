// ═══════════════════════════════════════════════════════════════
// HAT: chat
// General-purpose Chitti chat (DeepSeek-backed).
// Used for non-Bangla languages and as fallback for any unrecognized intent.
// ═══════════════════════════════════════════════════════════════
const log = require('../../lib/logger').forHat('chat');
const { call: deepseekCall, DeepSeekError } = require('../../lib/deepseek');

const FALLBACK_REPLIES = {
  en: 'Some technical issue came up. Please try again.',
  hi: 'Kuch technical problem aa gayi. Dobara try karein.',
  bn: 'একটু সমস্যা হয়েছে। আবার চেষ্টা করুন।',
};

function buildSystemPrompt(profile = {}) {
  const {
    nick = 'Friend', name = '', city = '', profession = '',
    productType = 'pa', lang = 'en',
  } = profile;
  const productName = productType === 'biz' ? 'Chitti Business'
    : productType === 'pro' ? 'Chitti Professional' : 'Chitti PA';
  const focusMap = {
    pa:  'Personal reminders, health guidance, legal help, government schemes, fraud protection, family.',
    biz: 'Billing, stock, GST, customers, sales, udhaar recovery, business intelligence.',
    pro: 'Practice management, client records, professional tools, compliance, invoicing.',
  };
  return `You are CHITTI — Bharat ka apna ${productName}.
Your master: ${nick}${name ? ` (${name})` : ''} | City: ${city} | Profession: ${profession}
Language: ${lang === 'hi' ? 'Hindi/Hinglish' : 'English'}

YOUR CHARACTER — Non-negotiable:
- Friend, Philosopher and Guide. Never a robot.
- Warm. Direct. No "Great question!" No padding.
- Short — 3-4 lines unless asked for detail.
- Use ${nick}'s name naturally.

YOUR FOCUS: ${focusMap[productType] || focusMap.pa}

PASSION FIRST: If you know the master's passion — use it as analogy.
NEVER GUESS: If you don't know — say "Bata do, main dhundh leta hoon."
NEVER HALLUCINATE: If unsure — say so. Trust is everything.

FOR THE MASTER. BY THE MASTER. OF THE MASTER.`;
}

module.exports = {
  meta: {
    hat: 'chat',
    version: '1.0.0',
    owner: 'sire',
    description: 'General Chitti chat backed by DeepSeek',
    languages: ['en', 'hi', 'mr', 'te', 'ta', 'kn'],  // Bangla has its own hat
    sla: { p99_ms: 30000, availability: 0.99 },
    pii_tier: 'safe',
    deepseek_fallback: false,  // chat IS deepseek — there's no further fallback
    graduation_target: null,
  },

  register(app, ctx) {
    app.post('/api/chat', async (req, res) => {
      const { message, history = [], master_profile = {} } = req.body || {};
      if (!message || typeof message !== 'string' || message.length > 2000) {
        return res.status(400).json({ error: 'Invalid message' });
      }

      const lang = master_profile.lang || 'en';
      try {
        const { reply } = await deepseekCall({
          systemPrompt: buildSystemPrompt(master_profile),
          history,
          message,
          callerHat: 'chat',
        });
        log.info('chat_ok', { user: master_profile.nick || 'unknown', city: master_profile.city || 'unknown' });
        res.json({ reply, timestamp: new Date().toISOString() });
      } catch (err) {
        log.error('chat_failed', { error: err.message });
        res.status(500).json({
          error: 'Chitti is thinking... please try again.',
          reply: FALLBACK_REPLIES[lang] || FALLBACK_REPLIES.en,
        });
      }
    });
  },

  health() {
    return { ok: true, endpoints: ['POST /api/chat'] };
  },
};
