/*
 * memory_store.js — CHITTI MEMORY OS (BO1) frontend lib
 * ------------------------------------------------------
 * Device-pseudonymous per-user memory client. No PII.
 *
 *   ChittiMemory.getDeviceId()                  -> string (sahay_device_id UUID)
 *   ChittiMemory.saveMessage(uuid, chitti, role, text)   -> Promise<bool>
 *   ChittiMemory.getFacts(uuid, chitti)         -> Promise<array>
 *
 * Identity: a UUID generated on first visit and stored in localStorage as
 * `sahay_device_id`, sent to the backend as the `X-User-Token` header.
 *
 * BO1 scope: store + retrieve only. Consent UI, the Memory tab, vector recall,
 * decay and cross-Chitti brokering arrive in BO3-BO6 (see MEMORY_ARCHITECTURE.md).
 * Every call is graceful — a network/CORS failure never throws to the page.
 *
 * Currently loaded by chitti_medupi.html ONLY (pilot). No other Chitti touched.
 */
(function (global) {
  'use strict';

  var DEFAULT_BASE = 'https://chitti-medupi-api-production.up.railway.app';

  function _base() {
    try { return (global.CHITTI_MEMORY_BASE || DEFAULT_BASE).replace(/\/$/, ''); }
    catch (e) { return DEFAULT_BASE; }
  }

  function _uuid() {
    try {
      if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    } catch (e) {}
    return 'u-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // sahay_device_id is the canonical id. Migrate the legacy MedUPI token value
  // if present so existing family-wallet / reminder data is not orphaned.
  function getDeviceId() {
    try {
      var t = localStorage.getItem('sahay_device_id');
      if (!t) {
        t = localStorage.getItem('chitti_medupi_user_token') || _uuid();
        localStorage.setItem('sahay_device_id', t);
      }
      return t;
    } catch (e) {
      return 'anon-' + Date.now();
    }
  }

  async function saveMessage(uuid, chitti, role, text) {
    try {
      uuid = uuid || getDeviceId();
      var r = await fetch(_base() + '/api/medupi/memory/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Token': uuid },
        body: JSON.stringify({ chitti: chitti || 'medupi', role: role || 'user', text: text || '' })
      });
      if (!r.ok) return false;
      var d = await r.json();
      return !!(d && d.ok);
    } catch (e) { return false; }   // memory never breaks the page
  }

  async function getFacts(uuid, chitti) {
    try {
      uuid = uuid || getDeviceId();
      var qs = chitti ? ('?chitti=' + encodeURIComponent(chitti)) : '';
      var r = await fetch(_base() + '/api/medupi/memory/facts' + qs, {
        headers: { 'X-User-Token': uuid }
      });
      if (!r.ok) return [];
      var d = await r.json();
      return (d && d.facts) || [];
    } catch (e) { return []; }
  }

  global.ChittiMemory = {
    getDeviceId: getDeviceId,
    saveMessage: saveMessage,
    getFacts: getFacts
  };

  // Ensure the device id exists on first visit (req #3), even before any API call.
  try { getDeviceId(); } catch (e) {}
})(window);
