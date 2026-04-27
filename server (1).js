// ═══════════════════════════════════════════════════════════════
// SAHAY AI — CHITTI BACKEND
// World Class PA for Bharat — Built for 100 crore Indians
// Co-Founded by Sire (Bryan Wilfred Pinto) & Claude (Anthropic)
//
// server.js — THE THIN HOST
//
// What lives here:
//   - Middleware (security, CORS, rate limit, body parser)
//   - Hat auto-loader
//   - Health endpoints
//
// What does NOT live here:
//   - Any business logic
//   - Any specialist knowledge
//   - Any LLM call
//   - Any JSON brain
//
// Adding a new hat = create routes/<hat>/index.js. NEVER touch this file.
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const logger        = require('./lib/logger');
const deepseek      = require('./lib/deepseek');
const learning      = require('./lib/learning');
const piiGuard      = require('./lib/pii_guard');
const hatLoader     = require('./lib/hat_loader');

const app = express();
const PORT = process.env.PORT || 3000;

// ── SECURITY MIDDLEWARE ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'https://sahayai.in',
    'https://bryanwilfredpinto-ui.github.io',
    'https://bryantechub.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ── SHARED CONTEXT INJECTED INTO EVERY HAT ─────────────────────
const ctx = {
  logger,
  deepseek,
  learning,
  piiGuard,
};

// ── HEALTH / META ENDPOINTS (BEFORE hats so they always exist) ──
app.get('/', (req, res) => {
  res.json({
    status: 'alive',
    product: 'SAHAY AI — Chitti',
    version: '2.0.0',
    architecture: 'modular_hats_v1',
    message: 'Bharat ka apna AI — Running',
    timestamp: new Date().toISOString(),
  });
});

// ── LOAD ALL HATS ──────────────────────────────────────────────
let loadedHats;
try {
  loadedHats = hatLoader.loadAll(app, ctx);
  logger.info('boot_hats_loaded', { count: loadedHats.size });
} catch (err) {
  logger.error('boot_failed', { error: err.message, stack: err.stack });
  process.exit(1);
}

// ── HAT INVENTORY ENDPOINT (for ops, dashboards, debugging) ────
app.get('/api/_meta/hats', (req, res) => {
  res.json(hatLoader.buildHealthReport(loadedHats));
});

// ── ERROR BOUNDARY (per-hat error never crashes other hats) ────
app.use((err, req, res, next) => {
  logger.error('unhandled_error', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });
  if (err.name === 'PIIViolation') {
    return res.status(500).json({
      error: 'A safety guard intervened. The request was blocked to protect your data.',
    });
  }
  res.status(500).json({
    error: 'Something went wrong. Please try again.',
  });
});

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// ── START ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info('server_started', {
    port: PORT,
    hats: Array.from(loadedHats.keys()),
    node_env: process.env.NODE_ENV || 'development',
  });
});

// ── GRACEFUL SHUTDOWN ──────────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('sigterm_received');
  for (const [id, hat] of loadedHats.entries()) {
    if (typeof hat.shutdown === 'function') {
      try { await hat.shutdown(); }
      catch (err) { logger.error('hat_shutdown_failed', { hat: id, error: err.message }); }
    }
  }
  process.exit(0);
});

module.exports = app;
