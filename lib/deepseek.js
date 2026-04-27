// ═══════════════════════════════════════════════════════════════
// lib/deepseek.js
// The ONE place DeepSeek is called from. Every hat that needs LLM
// goes through here. Never directly from a hat.
//
// Why centralized:
//   - Single retry/timeout policy
//   - Single point to swap providers (DeepSeek → on-device → other)
//   - Single point for cost tracking and rate limits
//   - Single point for PII guard enforcement
// ═══════════════════════════════════════════════════════════════
const axios = require('axios');
const logger = require('./logger').forHat('deepseek');

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_TOKENS = 400;
const DEFAULT_TEMPERATURE = 0.7;

class DeepSeekError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'DeepSeekError';
    this.code = code;
  }
}

/**
 * Call DeepSeek with a system prompt + history + user message.
 * Returns { reply, tokens_used, latency_ms } or throws DeepSeekError.
 *
 * @param {Object} opts
 * @param {string} opts.systemPrompt - the system prompt (hat builds this)
 * @param {Array}  opts.history - prior messages [{role, content}, ...]
 * @param {string} opts.message - user's query
 * @param {string} opts.callerHat - hat id calling this (for logs/cost tracking)
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.temperature]
 */
async function call({ systemPrompt, history = [], message, callerHat, maxTokens, temperature }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new DeepSeekError('DEEPSEEK_API_KEY not configured', 'NO_KEY');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10),  // hard cap on history — never explode
    { role: 'user', content: message },
  ];

  const startedAt = Date.now();
  try {
    const res = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages,
        max_tokens: maxTokens || DEFAULT_MAX_TOKENS,
        temperature: temperature !== undefined ? temperature : DEFAULT_TEMPERATURE,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: DEFAULT_TIMEOUT,
      }
    );

    const reply = res.data?.choices?.[0]?.message?.content;
    if (!reply) throw new DeepSeekError('empty_reply', 'EMPTY_REPLY');

    const latency_ms = Date.now() - startedAt;
    const tokens_used = res.data?.usage?.total_tokens || null;

    logger.info('deepseek_call_ok', {
      caller_hat: callerHat,
      latency_ms,
      tokens_used,
      message_len: message.length,
    });

    return { reply, tokens_used, latency_ms };
  } catch (err) {
    const latency_ms = Date.now() - startedAt;
    logger.error('deepseek_call_failed', {
      caller_hat: callerHat,
      latency_ms,
      error: err.message,
      status: err.response?.status,
    });
    throw new DeepSeekError(err.message, err.response?.status || 'UNKNOWN');
  }
}

module.exports = { call, DeepSeekError };
