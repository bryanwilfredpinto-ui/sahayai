// ═══════════════════════════════════════════════════════════════
// lib/learning.js
// The 6-month graduation curve mechanism.
// When Chitti Bangla (or any specialist) falls back to DeepSeek,
// the query is logged to a Make.com webhook → Google Sheet for review.
// Sire reviews weekly, promotes good answers into the brain.
// ═══════════════════════════════════════════════════════════════
const axios = require('axios');
const logger = require('./logger').forHat('learning');

const WEBHOOK_TIMEOUT_MS = 5000;

/**
 * Log a learning event for graduation.
 *
 * @param {Object} entry
 * @param {string} entry.hat - hat id (e.g. 'bangla')
 * @param {string} entry.query - user's original query
 * @param {number} entry.confidence - brain's confidence score (0..1)
 * @param {'brain'|'fallback'} entry.source - where the reply came from
 * @param {string} [entry.reply] - the reply text (only for fallbacks — to review for graduation)
 * @param {Object} [entry.extra] - hat-specific extra fields
 */
async function log(entry) {
  const webhookUrl = process.env.MAKE_LEARNING_WEBHOOK_URL;

  const payload = {
    timestamp: new Date().toISOString(),
    hat: entry.hat,
    query: entry.query,
    confidence: Number((entry.confidence || 0).toFixed(3)),
    source: entry.source,
    reply: entry.source === 'fallback' ? entry.reply : null,
    needs_graduation: entry.source === 'fallback',
    ...(entry.extra || {}),
  };

  // Always log structured to console — the webhook is best-effort
  logger.info('learning_event', payload);

  if (!webhookUrl) return;

  try {
    await axios.post(webhookUrl, payload, { timeout: WEBHOOK_TIMEOUT_MS });
  } catch (err) {
    logger.warn('learning_webhook_failed', { hat: entry.hat, error: err.message });
  }
}

module.exports = { log };
