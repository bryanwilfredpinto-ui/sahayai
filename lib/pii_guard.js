// ═══════════════════════════════════════════════════════════════
// lib/pii_guard.js
// Centralized enforcement of Sire's Pillar 5 ruling.
// PII-safety-critical fields NEVER leave Sahay infra. Hardcoded.
// Not configurable. Not overridable. The constitutional firewall.
// ═══════════════════════════════════════════════════════════════
const logger = require('./logger').forHat('pii_guard');

// Sire-ratified denylist. Adding to this list = constitutional change, not a config edit.
const PII_SAFETY_CRITICAL = new Set([
  'aadhaar', 'aadhar',
  'pan',
  'passport',
  'phone', 'phone_number', 'mobile',
  'sms_number', 'whatsapp_number',
  'email',
  'address', 'home_address', 'exact_address',
  'lat_exact', 'lon_exact', 'live_location', 'real_time_location',
  'blood_group',
  'allergies',
  'emergency_contacts',
  'medical_conditions',
  'medications',
  'biometric_data',
  'device_id', 'imei', 'advertising_id',
]);

class PIIViolation extends Error {
  constructor(field, hat) {
    super(`PII denylist violation: '${field}' from hat '${hat}' attempted to cross to external service`);
    this.name = 'PIIViolation';
    this.field = field;
    this.hat = hat;
  }
}

/**
 * Recursively scrub a payload. If any key in the denylist is present,
 * raise PIIViolation. The hat's pii_tier determines what's allowed.
 *
 * @param {Object} payload - the data about to leave Sahay infra
 * @param {string} hatId - which hat is sending it
 * @param {'safe'|'sensitive'|'critical'} hatTier - hat's declared tier
 * @returns the scrubbed payload (or throws)
 */
function enforce(payload, hatId, hatTier) {
  if (hatTier === 'critical') {
    throw new PIIViolation('hat_tier_critical_cannot_leave', hatId);
  }
  return walk(payload, hatId, '');
}

function walk(node, hatId, path) {
  if (Array.isArray(node)) {
    return node.map((v, i) => walk(v, hatId, `${path}[${i}]`));
  }
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      if (PII_SAFETY_CRITICAL.has(key.toLowerCase())) {
        logger.error('pii_violation_blocked', { hat: hatId, path: `${path}.${key}` });
        throw new PIIViolation(`${path}.${key}`, hatId);
      }
    }
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = walk(v, hatId, `${path}.${k}`);
    }
    return out;
  }
  return node;
}

module.exports = { enforce, PIIViolation, PII_SAFETY_CRITICAL };
