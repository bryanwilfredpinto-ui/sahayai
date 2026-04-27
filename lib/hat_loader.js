// ═══════════════════════════════════════════════════════════════
// lib/hat_loader.js
// Auto-loads every routes/<hat>/index.js as a hat module.
// Validates the contract. Refuses to boot on violations.
// At 29 hats, the loader IS the contract — it cannot be lax.
// ═══════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const logger = require('./logger').forHat('hat_loader');

const REQUIRED_META_FIELDS = ['hat', 'version', 'languages', 'pii_tier'];
const ALLOWED_PII_TIERS = ['safe', 'sensitive', 'critical'];

/**
 * Load every hat in routes/.
 * @param {Express} app - the express app
 * @param {Object} ctx - shared context (logger, deepseek, learning, etc.)
 * @returns {Map<string, module>} loaded hats keyed by hat id
 */
function loadAll(app, ctx) {
  const routesDir = path.join(__dirname, '..', 'routes');
  if (!fs.existsSync(routesDir)) {
    throw new Error(`routes/ folder not found at ${routesDir}`);
  }

  const loaded = new Map();
  const folders = fs.readdirSync(routesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .filter(d => !d.name.startsWith('_'))   // skip parked work-in-progress
    .map(d => d.name);

  for (const folder of folders) {
    const hatPath = path.join(routesDir, folder, 'index.js');
    if (!fs.existsSync(hatPath)) {
      logger.warn('hat_skipped_no_index', { folder });
      continue;
    }

    let hat;
    const t0 = Date.now();
    try {
      hat = require(hatPath);
    } catch (err) {
      logger.error('hat_load_failed', { folder, error: err.message });
      throw new Error(`Hat '${folder}' failed to load: ${err.message}`);
    }

    validateContract(hat, folder);

    if (loaded.has(hat.meta.hat)) {
      throw new Error(`Duplicate hat id: '${hat.meta.hat}' (folder: ${folder})`);
    }

    // Register routes
    try {
      hat.register(app, ctx);
    } catch (err) {
      logger.error('hat_register_failed', { hat: hat.meta.hat, error: err.message });
      throw err;
    }

    // Schedule cron jobs declaratively
    if (Array.isArray(hat.cron) && hat.cron.length > 0) {
      for (const job of hat.cron) {
        if (!job.id || !job.schedule || typeof job.handler !== 'function') {
          throw new Error(`Hat '${hat.meta.hat}' has malformed cron job: ${JSON.stringify(job)}`);
        }
        cron.schedule(job.schedule, () => safeRunCron(hat.meta.hat, job), {
          timezone: job.tz || 'Asia/Kolkata',
        });
        logger.info('cron_scheduled', { hat: hat.meta.hat, job_id: job.id, schedule: job.schedule });
      }
    }

    const load_ms = Date.now() - t0;
    if (load_ms > 100) {
      logger.warn('hat_slow_load', { hat: hat.meta.hat, load_ms });
    }
    loaded.set(hat.meta.hat, hat);
    logger.info('hat_loaded', {
      hat: hat.meta.hat,
      version: hat.meta.version,
      languages: hat.meta.languages,
      pii_tier: hat.meta.pii_tier,
      load_ms,
    });
  }

  return loaded;
}

function validateContract(hat, folder) {
  if (!hat || typeof hat !== 'object') {
    throw new Error(`Hat in '${folder}' must export an object, got ${typeof hat}`);
  }
  if (!hat.meta || typeof hat.meta !== 'object') {
    throw new Error(`Hat '${folder}' missing 'meta' object`);
  }
  for (const field of REQUIRED_META_FIELDS) {
    if (hat.meta[field] === undefined || hat.meta[field] === null) {
      throw new Error(`Hat '${folder}' missing meta.${field}`);
    }
  }
  if (!ALLOWED_PII_TIERS.includes(hat.meta.pii_tier)) {
    throw new Error(`Hat '${folder}' has invalid pii_tier '${hat.meta.pii_tier}'. Must be one of: ${ALLOWED_PII_TIERS.join(', ')}`);
  }
  if (typeof hat.register !== 'function') {
    throw new Error(`Hat '${folder}' missing register(app, ctx) function`);
  }
  if (!Array.isArray(hat.meta.languages) || hat.meta.languages.length === 0) {
    throw new Error(`Hat '${folder}' must declare meta.languages as non-empty array`);
  }
}

async function safeRunCron(hatId, job) {
  try {
    await job.handler();
    logger.info('cron_ok', { hat: hatId, job_id: job.id });
  } catch (err) {
    logger.error('cron_failed', { hat: hatId, job_id: job.id, error: err.message });
  }
}

/**
 * Build the per-hat health summary for /api/_meta/hats
 */
function buildHealthReport(loaded) {
  const hats = [];
  for (const [id, hat] of loaded.entries()) {
    let healthData = { ok: true };
    if (typeof hat.health === 'function') {
      try {
        healthData = hat.health();
      } catch (err) {
        healthData = { ok: false, error: err.message };
      }
    }
    hats.push({
      hat: id,
      version: hat.meta.version,
      languages: hat.meta.languages,
      pii_tier: hat.meta.pii_tier,
      sla: hat.meta.sla || null,
      deepseek_fallback: hat.meta.deepseek_fallback || false,
      graduation_target: hat.meta.graduation_target || null,
      ...healthData,
    });
  }
  return { hat_count: hats.length, hats };
}

module.exports = { loadAll, buildHealthReport };
