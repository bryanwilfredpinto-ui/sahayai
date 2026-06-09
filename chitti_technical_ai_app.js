/* chitti_technical_ai_app.js
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * The controller. Wires the deterministic engine (TechEngine.generateSignal + chittiVerdict)
 * to the FOUR-CHANNEL verdict (voice · text · icon+shape · ISL), the research steals
 * (TradingView gauge · Investing.com vote tally · Tickertape mood dial · Danelfin
 * score→tap-to-explain · Screener auto pros/cons), the anti-scam Tip Shield, and the
 * paper journal. Engine decides; this file only PRESENTS — never originates a number/call.
 *
 * Hard gate (Constitution Art. 2): remove sight OR sound and the verdict is still 100%
 * recoverable. Sight-off → TTS + sonify + verdictTone + data table. Sound-off → icon+shape
 * (▲▲/▲/■/▼/▼▼) + word + % + reasons + ISL. Colour only decorates.
 */
(function (root, doc) {
  'use strict';
  var T = root.TechEngine, A = root.ChittiTechAudio, D = root.ChittiTechData,
      TS = root.ChittiTipShield, J = root.ChittiTechJournal;
  var state = { symbol: 'RELIANCE', mode: 'longterm', data: null, sig: null, cv: null };

  function $(id) { return doc.getElementById(id); }
  function set(id, html) { var el = $(id); if (el) el.innerHTML = html; }
  function show(id, on) { var el = $(id); if (el) el.style.display = on ? '' : 'none'; }
  function live(msg) { var el = $('tech-live'); if (el) { el.textContent = ''; setTimeout(function () { el.textContent = msg; }, 30); } }
  function speak(t) { if (A) A.speak(t); }

  // icon + SHAPE per verdict — meaning carried WITHOUT colour (deaf + colour-blind safe)
  var SHAPE = { BUY: '▲▲', SELL: '▼▼', WAIT: '■' };
  var WORD = { BUY: 'BUY', SELL: 'SELL', WAIT: 'WAIT / HOLD' };

  // ───────── the honest "most traders lose" rail — on EVERY verdict (Constitution Art. 4 & 8) ─────────
  function rail() {
    return '<p class="tech-rail">⚠️ <b>Most short-term traders lose money</b> (SEBI). This is education, ' +
      '<b>not advice</b>. Chitti never places an order. <span class="tech-sebi-mini">NOT SEBI REGISTERED.</span></p>';
  }

  // ───────── 1) the FOUR-CHANNEL verdict hero ─────────
  function renderVerdict() {
    var cv = state.cv, sig = state.sig; if (!cv) return;
    var dec = cv.decision; // BUY / SELL / WAIT
    var html = '<div class="verdict-hero v-' + dec.toLowerCase() + '" role="group" aria-label="Verdict for ' + state.symbol + '">' +
      '<div class="vh-shape" aria-hidden="true">' + SHAPE[dec] + '</div>' +
      '<div class="vh-main"><div class="vh-word">' + WORD[dec] + '</div>' +
      '<div class="vh-sub">' + cv.headline + ' · confidence <b>' + cv.confidence + '%</b> · risk <b>' + cv.risk + '</b></div></div>' +
      '<button type="button" class="vh-listen" id="vh-listen">🔊 Listen</button>' +
      '</div>' +
      '<p class="vh-spoken" id="vh-spoken-text">' + cv.spoken + '</p>' + rail();
    set('verdict-host', html);
    var btn = $('vh-listen');
    if (btn) btn.onclick = function () { speakVerdict(); };
    // auto-fire the audio channel so a blind user gets the verdict immediately
    speakVerdict();
    // ISL channel (deaf): attach a sign panel to the verdict box if substrate present
    try { if (root.Chitti && root.Chitti.isl && root.Chitti.isl.attach) root.Chitti.isl.attach($('verdict-host')); } catch (e) {}
    live('Verdict for ' + state.symbol + ': ' + WORD[dec] + ', confidence ' + cv.confidence + ' percent.');
  }
  function speakVerdict() {
    var cv = state.cv; if (!cv) return;
    if (A) { A.verdictTone(cv.decision); A.haptic(cv.decision === 'BUY' ? 'BUY_STRONG' : cv.decision === 'SELL' ? 'SELL_STRONG' : 'HOLD'); }
    speak(cv.spoken);
  }

  // ───────── 2) TradingView-style gauge (Strong Buy → Strong Sell) ─────────
  function gaugeBand(cv) {
    var c = cv.confidence, d = cv.decision;
    if (d === 'WAIT') return { label: 'NEUTRAL', pos: 50 };
    if (d === 'BUY') return c >= 80 ? { label: 'STRONG BUY', pos: 92 } : { label: 'BUY', pos: 70 };
    return c >= 80 ? { label: 'STRONG SELL', pos: 8 } : { label: 'SELL', pos: 30 };
  }
  function renderGauge() {
    var b = gaugeBand(state.cv);
    set('gauge-host', '<div class="gauge" role="img" aria-label="Technical rating ' + b.label + '">' +
      '<div class="gauge-scale"><span>Strong Sell</span><span>Neutral</span><span>Strong Buy</span></div>' +
      '<div class="gauge-track"><div class="gauge-needle" style="left:' + b.pos + '%"></div></div>' +
      '<div class="gauge-label">' + b.label + '</div></div>');
  }

  // ───────── 3) Investing.com-style vote tally ("11 say Buy, 2 say Sell") ─────────
  function tally(indicators) {
    var buy = 0, sell = 0, wait = 0;
    Object.keys(indicators || {}).forEach(function (k) {
      var s = indicators[k].signal;
      if (s === 'BUY') buy++; else if (s === 'SELL') sell++; else wait++;
    });
    return { buy: buy, sell: sell, wait: wait };
  }
  function renderVotes() {
    var t = tally(state.sig.indicators), total = t.buy + t.sell + t.wait;
    var spoken = t.buy + ' indicators say buy, ' + t.sell + ' say sell, ' + t.wait + ' are neutral.';
    set('votes-host', '<div class="votes" data-chitti-speak-text="' + spoken + '">' +
      '<div class="vote v-buy"><b>' + t.buy + '</b><span>say BUY ▲</span></div>' +
      '<div class="vote v-wait"><b>' + t.wait + '</b><span>NEUTRAL ■</span></div>' +
      '<div class="vote v-sell"><b>' + t.sell + '</b><span>say SELL ▼</span></div>' +
      '<p class="votes-line">' + spoken + ' (of ' + total + ' checks)</p></div>');
  }

  // ───────── 4) Tickertape-style mood dial (alignment → mood word) ─────────
  function renderMood() {
    var conf = state.sig.confluence || {};
    var pct = conf.percent || 0, bias = conf.bias || 'NEUTRAL';
    var mood = bias === 'NEUTRAL' ? 'Undecided' :
      (pct >= 100 ? ('Strongly ' + (bias === 'BULLISH' ? 'Bullish' : 'Bearish')) :
       pct >= 80 ? (bias === 'BULLISH' ? 'Bullish' : 'Bearish') :
       pct >= 60 ? ('Leaning ' + (bias === 'BULLISH' ? 'up' : 'down')) : 'Choppy / mixed');
    set('mood-host', '<div class="mood" role="img" aria-label="Market mood for ' + state.symbol + ': ' + mood + '">' +
      '<div class="mood-word">🧭 ' + mood + '</div>' +
      '<div class="mood-sub">' + (conf.bull || 0) + ' of ' + (conf.total || 0) + ' timeframes agree (' + pct + '%)</div></div>');
  }

  // ───────── 5) Danelfin/Screener-style auto Pros & Cons (tap-to-explain reasons) ─────────
  function renderReasons() {
    var rs = (state.cv && state.cv.reasons) || [];
    var pros = rs.filter(function (r) { return r.ok; }), cons = rs.filter(function (r) { return !r.ok && !r.neutral; });
    function li(r) { return '<li>' + (r.ok ? '✓ ' : '✗ ') + r.text + '</li>'; }
    set('reasons-host', '<div class="reasons">' +
      '<div class="pros"><h4>✓ For this read</h4><ul>' + (pros.length ? pros.map(li).join('') : '<li>—</li>') + '</ul></div>' +
      '<div class="cons"><h4>✗ Against / watch</h4><ul>' + (cons.length ? cons.map(li).join('') : '<li>—</li>') + '</ul></div></div>');
  }

  // ───────── 6) the trade PLAN — risk shown BEFORE reward (Constitution Art. 5) ─────────
  function renderPlan() {
    var s = state.sig;
    if (!s.stop_loss || s.signal === 'HOLD') {
      set('plan-host', '<p class="plan-none">No clean trade plan right now — ' + (s.why || 'wait for alignment') + '. Waiting is a valid decision.</p>');
      return;
    }
    var ez = s.entry_zone || {};
    var tlist = [s.target_1, s.target_2, s.target_3].filter(Boolean).map(function (t, i) {
      return '<tr><th scope="row">Target ' + (i + 1) + '</th><td>₹' + t.price + '</td><td>' + (t.rr || '') + '</td><td>' + (t.action || '') + '</td></tr>';
    }).join('');
    set('plan-host', '<table class="plan-table"><caption class="sr-only">Trade plan</caption><tbody>' +
      '<tr class="plan-risk"><th scope="row">🛑 Stop-loss (your risk first)</th><td>₹' + s.stop_loss.price + '</td><td>' + s.stop_loss.percentage + '%</td><td>' + (s.invalidation || '') + '</td></tr>' +
      '<tr><th scope="row">🎯 Entry zone</th><td colspan="3">₹' + (ez.low != null ? ez.low : s.entry_price) + ' – ₹' + (ez.high != null ? ez.high : s.entry_price) + ' (ideal ₹' + (ez.ideal != null ? ez.ideal : s.entry_price) + ')</td></tr>' +
      tlist +
      '<tr><th scope="row">⚖️ Risk : Reward</th><td colspan="3">' + (s.risk_reward_ratio || '') + (s.position_size ? ' · ' + s.position_size.shares + ' shares for ₹' + s.position_size.risk_amount + ' risk on ₹' + s.position_size.capital + ' capital' : '') + '</td></tr>' +
      '</tbody></table>' +
      '<button type="button" class="paper-btn" id="paper-log">📓 Log as PAPER trade (no real order)</button>');
    var pb = $('paper-log'); if (pb) pb.onclick = logPaper;
  }

  // ───────── 7) indicators + S/R zones + patterns (the depth, narratable) ─────────
  function renderDepth() {
    var s = state.sig, ind = s.indicators || {};
    var keep = ['Roshan Indicator', 'RSI', 'MACD', 'Stochastic', 'Williams %R', 'Bollinger Bands', 'Supertrend', 'EMA 200', 'ADX', 'VWAP'];
    var rows = keep.filter(function (k) { return ind[k]; }).map(function (k) {
      var x = ind[k]; var glyph = x.signal === 'BUY' ? '▲' : x.signal === 'SELL' ? '▼' : '■';
      return '<tr><th scope="row">' + k + '</th><td>' + (x.value != null ? x.value : '—') + '</td><td class="sig-' + x.signal.toLowerCase() + '">' + glyph + ' ' + x.signal + '</td></tr>';
    }).join('');
    set('indicators-host', '<table class="ind-table"><caption class="sr-only">Key indicators</caption>' +
      '<thead><tr><th scope="col">Indicator</th><th scope="col">Value</th><th scope="col">Read</th></tr></thead><tbody>' + rows + '</tbody></table>');

    var zones = (s.sr_zones || []).slice(0, 5).map(function (z) {
      return '<li>' + (z.type === 'R' ? '⬆ Resistance' : '⬇ Support') + ' near <b>₹' + z.price + '</b> — ' + z.strength + ' (' + z.timeframes.join('/') + ')</li>';
    }).join('');
    set('sr-host', zones ? '<ul class="sr-list">' + zones + '</ul>' : '<p>No strong support/resistance zones detected.</p>');

    var daily = state.data && (state.data.byTf.daily || state.data.byTf.weekly);
    var pat = (T.detectPatterns && daily) ? T.detectPatterns(daily).top : null;
    set('patterns-host', pat ? '<p class="pat">🔎 Pattern: <b>' + pat.name + '</b> (' + pat.dir + ', ~' + pat.reliability + '% historical reliability — not a guarantee)</p>'
      : '<p class="pat">No clear chart pattern on the latest bars.</p>');

    // BLIND channel: data table + one-sentence summary + sonify button
    if (A && daily) {
      set('chart-host', '<div class="chart-tools">' +
        '<button type="button" id="sonify-btn">🔊 Hear the price chart</button> ' +
        '<button type="button" id="summary-btn">🗣️ Describe in one line</button>' +
        '<details class="data-table-wrap"><summary>Show data as table</summary>' + A.dataTable(daily, 14) + '</details></div>');
      var sb = $('sonify-btn'); if (sb) sb.onclick = function () { sonifyEvents(daily); };
      var mb = $('summary-btn'); if (mb) { mb.onclick = function () { speak(A.summarize(daily)); }; }
    }
  }
  function sonifyEvents(daily) {
    var events = [], cl = daily.map(function (c) { return c.close; });
    var r = T.rsi(cl, 14), rl = r[r.length - 1];
    if (rl != null && rl > 70) events.push('rsi_overbought'); else if (rl != null && rl < 30) events.push('rsi_oversold');
    var m = T.macd(cl); if (m.hist[m.hist.length - 1] > 0) events.push('macd_bull'); else events.push('macd_bear');
    A.sonify(daily, { events: events });
  }

  // ───────── the main analyze flow ─────────
  function analyze() {
    var sym = state.symbol, mode = state.mode;
    var modeDef = (T.CONFLUENCE_MODES && T.CONFLUENCE_MODES[mode]) || { trend: ['monthly', 'weekly'], entry: 'daily' };
    var tfs = modeDef.trend.concat([modeDef.entry]);
    set('verdict-host', '<p class="loading">Reading ' + sym + ' …</p>');
    show('result-area', true);
    D.getCandles(sym, tfs).then(function (data) {
      state.data = data;
      set('source-badge', '<span class="src src-' + data.source + '">' + data.note + '</span>');
      var sig = T.generateSignal(data.byTf, { mode: mode, capital: J ? J.capital() : 100000, riskPercent: 2 });
      sig.symbol = sym;
      // honesty guardrail — never let a banned certainty phrase through
      var cv = T.chittiVerdict(sig);
      if (T.hasBannedPhrase && T.hasBannedPhrase(cv.spoken)) cv.spoken = cv.spoken.replace(/[^.]*guarantee[^.]*\./gi, '');
      state.sig = sig; state.cv = cv;
      if (J) J.logSignal(sig);
      renderVerdict(); renderGauge(); renderVotes(); renderMood(); renderReasons(); renderPlan(); renderDepth();
      checkCoolDown();
    });
  }

  // ───────── Tip Shield (the moat) ─────────
  function checkTip() {
    var el = $('tip-input'); if (!el) return;
    var text = el.value || '';
    // crisis safety FIRST (deterministic, no LLM)
    if (T.detectCrisis && T.detectCrisis(text)) {
      var cr = T.crisisResponse();
      set('tip-host', '<div class="crisis">' + cr.visual + '</div>');
      speak(cr.audio); if (A) A.haptic('WARNING');
      return;
    }
    var res = TS.check(text);
    set('tip-host', '<div class="tipres tip-' + res.risk.toLowerCase() + '" data-chitti-response data-chitti-section="Tip Shield">' +
      '<div class="tip-verdict">' + res.verdict + '</div>' +
      (res.flags.length ? '<ul class="tip-flags">' + res.flags.map(function (f) { return '<li>🚩 ' + f.why + ' <span class="tip-ev">("' + f.evidence + '")</span></li>'; }).join('') + '</ul>' : '') +
      '</div>');
    speak(res.spoken); if (A) A.haptic(res.risk === 'HIGH' ? 'WARNING' : 'HOLD');
    live('Tip check: ' + res.risk + ' risk. ' + res.flags.length + ' flags.');
  }

  // ───────── paper journal (confirm-gated; never a real order) ─────────
  function logPaper() {
    var s = state.sig; if (!s || !s.stop_loss) return;
    var qty = (s.position_size && s.position_size.shares) || 1;
    var doLog = function () {
      J.logPaperTrade({ symbol: state.symbol, mode: state.mode, side: s.signal, entry: s.entry_price, quantity: qty, stop: s.stop_loss.price, target: s.target_1 ? s.target_1.price : null });
      renderJournal(); speak('Logged as a paper trade. No real order was placed.');
    };
    // Golden Rule confirm gate (mute-safe). Falls back to confirm() if Vaani gate absent.
    if (typeof root.chittiConfirmAndDo === 'function') {
      root.chittiConfirmAndDo('Shall I log a PAPER ' + s.signal + ' of ' + qty + ' ' + state.symbol + ' at ₹' + s.entry_price + '? (No real order.)', doLog);
    } else if (root.confirm('Log a PAPER ' + s.signal + ' of ' + qty + ' ' + state.symbol + ' at ₹' + s.entry_price + '? No real order is placed.')) { doLog(); }
  }
  function renderJournal() {
    if (!J) return;
    var trades = J.trades();
    var rows = trades.slice(-8).reverse().map(function (t) {
      return '<tr><td>' + t.symbol + '</td><td>' + t.side + '</td><td>₹' + t.entry + '</td><td>' + t.quantity + '</td><td>' + t.status + (t.pnl != null ? ' (₹' + t.pnl + ')' : '') + '</td></tr>';
    }).join('');
    set('journal-host', trades.length ? '<table class="jrnl"><caption class="sr-only">Your paper trades</caption><thead><tr><th>Stock</th><th>Side</th><th>Entry</th><th>Qty</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table>'
      : '<p>No paper trades yet. Every trade here is practice — no real money, ever.</p>');
    var ins = J.insights();
    set('insights-host', ins.length ? '<ul class="insights">' + ins.map(function (i) { return '<li>💡 ' + i + '</li>'; }).join('') + '</ul>' : '<p class="insights-hint">Log 10+ paper trades and Chitti will show honest patterns (over-trading, best/worst setups, revenge-trading).</p>');
  }
  function checkCoolDown() {
    if (!J) return;
    var ls = J.lossSpiral();
    if (ls.isSpiral) { set('cooldown-host', '<div class="cooldown">🧊 ' + ls.message + '</div>'); speak(ls.message); if (A) A.haptic('WARNING'); }
    else set('cooldown-host', '');
  }

  // ───────── boot ─────────
  function populateSymbols() {
    var sel = $('tech-symbol'); if (!sel || !T.UNIVERSE) return;
    sel.innerHTML = T.UNIVERSE.map(function (s) { return '<option value="' + s.sym + '">' + s.sym + ' — ' + s.name + ' (' + s.tier + ')</option>'; }).join('');
    sel.value = state.symbol;
  }
  function populateModes() {
    var sel = $('tech-mode'); if (!sel || !T.CONFLUENCE_MODES) return;
    sel.innerHTML = Object.keys(T.CONFLUENCE_MODES).map(function (k) { return '<option value="' + k + '">' + T.CONFLUENCE_MODES[k].label + '</option>'; }).join('');
    sel.value = state.mode;
  }
  function init() {
    if (!T) { set('verdict-host', '<p>Engine not loaded.</p>'); return; }
    populateSymbols(); populateModes(); renderJournal();
    var ss = $('tech-symbol'); if (ss) ss.onchange = function () { state.symbol = ss.value; };
    var ms = $('tech-mode'); if (ms) ms.onchange = function () { state.mode = ms.value; };
    var ab = $('tech-analyze'); if (ab) ab.onclick = analyze;
    var tb = $('tip-check'); if (tb) tb.onclick = checkTip;
    var fb = $('journal-forget'); if (fb) fb.onclick = function () { J.forget(); renderJournal(); speak('Cleared. Chitti forgot your paper journal.'); };
  }

  root.ChittiTechApp = { init: init, analyze: analyze, checkTip: checkTip, state: state };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : null);
