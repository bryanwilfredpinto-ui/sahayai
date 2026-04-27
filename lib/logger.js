// ═══════════════════════════════════════════════════════════════
// lib/logger.js
// Shared winston logger instance.
// Every hat tags its logs with { hat: '<hat_id>' } via logger.child().
// At 29 hats, per-hat filtering is non-negotiable for debugging.
// ═══════════════════════════════════════════════════════════════
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'chitti-backend' },
  transports: [new winston.transports.Console()],
});

/**
 * Create a hat-scoped logger child. Use this in every hat module.
 *   const log = require('../lib/logger').forHat('guardian');
 *   log.info('alert fired', { city, temp });
 *   // → { hat: 'guardian', city: 'Indore', temp: 42, ... }
 */
logger.forHat = (hatId) => logger.child({ hat: hatId });

module.exports = logger;
