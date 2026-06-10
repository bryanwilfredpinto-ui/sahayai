/* chitti_technical_ai_journal.js
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * PAPER-ONLY dual journal (Constitution Art. 3 & 11). Logs every signal Chitti showed
 * (system journal) and every PAPER trade the user chose to record (user journal) into
 * localStorage — on-device, DPDP-clean, "Chitti forget" wipes it. NEVER places a real
 * order. Records winners AND losers honestly, then asks the engine for honest insights
 * (TechEngine.aiInsights) and the loss-spiral cool-down (TechEngine.detectLossSpiral).
 *
 * window.ChittiTechJournal = { logSignal, logPaperTrade, closePaperTrade, trades, signals,
 *   insights, lossSpiral, forget, capital }
 */
(function (root) {
  'use strict';
  var SKEY = 'chitti_tech_signals_v1', TKEY = 'chitti_tech_papertrades_v1', CKEY = 'chitti_tech_capital_v1';

  function read(k) { try { return JSON.parse(root.localStorage.getItem(k) || '[]'); } catch (e) { return []; } }
  function write(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function capital() { try { return Number(root.localStorage.getItem(CKEY)) || 100000; } catch (e) { return 100000; } }
  function setCapital(v) { try { root.localStorage.setItem(CKEY, String(v)); } catch (e) {} }
  function id(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e4); }
  function nowISO() { try { return new Date().toISOString(); } catch (e) { return ''; } }

  // SYSTEM journal — every verdict Chitti generated (audit trail, honest reckoning later)
  function logSignal(sig) {
    var rows = read(SKEY);
    rows.push({ signal_id: id('SIG'), at: nowISO(), symbol: sig.symbol || '', mode: sig.mode || '',
      verdict: sig.signal || sig.verdict || 'HOLD', confidence: sig.confidence || 0,
      entry: sig.entry_price != null ? sig.entry_price : null,
      stop: sig.stop_loss ? sig.stop_loss.price : null,
      t1: sig.target_1 ? sig.target_1.price : null,
      confluence: sig.confluence_score || null, outcome: 'PENDING' });
    write(SKEY, rows.slice(-500));
    return rows[rows.length - 1].signal_id;
  }

  // SOP 8 — reflection vocabulary for Mistake Category + Emotional State (deterministic dropdowns)
  var MISTAKE_CATEGORIES = ['None — followed the plan', 'No stop-loss', 'Moved/ignored my stop', 'Chased the entry (FOMO)',
    'Oversized position', 'Revenge trade', 'Ignored the trend / higher timeframe', 'Cut a winner too early',
    'Held a loser too long', 'No volume confirmation', 'Acted on a tip'];
  var EMOTIONS = ['Calm / disciplined', 'FOMO', 'Fear', 'Greed', 'Revenge', 'Anxious', 'Overconfident', 'Bored'];

  // USER journal — a PAPER trade the user chose to log (never a real order)
  function logPaperTrade(t) {
    var rows = read(TKEY);
    rows.push({ trade_id: id('TRD'), signal_id: t.signal_id || null, at: nowISO(),
      symbol: t.symbol || '', mode: t.mode || '', side: t.side || t.direction || 'BUY',
      entry: Number(t.entry) || null, quantity: Number(t.quantity) || 0,
      stop: t.stop != null ? Number(t.stop) : null, target: t.target != null ? Number(t.target) : null,
      exit: null, exit_reason: null, pnl: null, status: 'OPEN', paper: true,
      // SOP 8 reflection fields (filled on close/reflect)
      emotion: t.emotion || null, lesson: null, mistake_category: null, improvement: null });
    write(TKEY, rows);
    return rows[rows.length - 1].trade_id;
  }

  // SOP 8 — capture Lesson Learned · Mistake Category · Emotional State · Improvement Action
  function reflect(trade_id, fields) {
    fields = fields || {}; var rows = read(TKEY), changed = false;
    rows.forEach(function (r) {
      if (r.trade_id === trade_id) {
        if (fields.lesson != null) r.lesson = String(fields.lesson);
        if (fields.mistake_category != null) r.mistake_category = String(fields.mistake_category);
        if (fields.emotion != null) r.emotion = String(fields.emotion);
        if (fields.improvement != null) r.improvement = String(fields.improvement);
        r.reflected_at = nowISO(); changed = true;
      }
    });
    if (changed) write(TKEY, rows);
    return changed;
  }

  // honest roll-up of the mistakes the user keeps repeating (deterministic, from the reflections)
  function mistakeSummary() {
    var counts = {}; read(TKEY).forEach(function (r) { if (r.mistake_category && !/^None/.test(r.mistake_category)) counts[r.mistake_category] = (counts[r.mistake_category] || 0) + 1; });
    return Object.keys(counts).map(function (k) { return { category: k, count: counts[k] }; }).sort(function (a, b) { return b.count - a.count; });
  }

  function closePaperTrade(trade_id, exit, reason, reflectFields) {
    var rows = read(TKEY), changed = false;
    rows.forEach(function (r) {
      if (r.trade_id === trade_id && r.status === 'OPEN') {
        r.exit = Number(exit); r.exit_reason = reason || 'MANUAL';
        var dir = r.side === 'SELL' ? -1 : 1;
        r.pnl = Math.round((r.exit - r.entry) * dir * (r.quantity || 0));
        r.status = 'CLOSED'; changed = true;
        if (reflectFields) { var f = reflectFields; if (f.lesson != null) r.lesson = String(f.lesson); if (f.mistake_category != null) r.mistake_category = String(f.mistake_category); if (f.emotion != null) r.emotion = String(f.emotion); if (f.improvement != null) r.improvement = String(f.improvement); r.reflected_at = nowISO(); }
      }
    });
    if (changed) write(TKEY, rows);
    return changed;
  }

  function trades() { return read(TKEY); }
  function signals() { return read(SKEY); }
  function closedTrades() { return read(TKEY).filter(function (t) { return t.status === 'CLOSED'; }); }

  // honest insights after ≥10 closed paper trades — deterministic, from the engine (no LLM)
  function insights() {
    var T = root.TechEngine;
    if (!T || !T.aiInsights) return [];
    return T.aiInsights(closedTrades());
  }
  // mandatory cool-down if the user is in a loss spiral (3 losers summing > 5% of capital)
  function lossSpiral() {
    var T = root.TechEngine;
    if (!T || !T.detectLossSpiral) return { isSpiral: false };
    return T.detectLossSpiral(closedTrades(), capital());
  }

  function forget() { write(SKEY, []); write(TKEY, []); }

  root.ChittiTechJournal = {
    logSignal: logSignal, logPaperTrade: logPaperTrade, closePaperTrade: closePaperTrade,
    reflect: reflect, mistakeSummary: mistakeSummary,
    MISTAKE_CATEGORIES: MISTAKE_CATEGORIES, EMOTIONS: EMOTIONS,
    trades: trades, signals: signals, closedTrades: closedTrades,
    insights: insights, lossSpiral: lossSpiral, forget: forget,
    capital: capital, setCapital: setCapital
  };
})(typeof window !== 'undefined' ? window : this);
