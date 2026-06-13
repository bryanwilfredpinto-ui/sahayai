/* chitti_technical_ai_app.js
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * The controller. Wires the deterministic engine (TechEngine) to every face:
 *   READ (4-channel verdict · gauge · vote tally · mood · pros/cons · risk plan · CHART ·
 *         indicator picker · timeframe picker · refresh) + SCREENER + WATCHLIST/ALERTS +
 *         BACKTEST/SCORECARD + TIP SHIELD + PAPER JOURNAL.
 * Engine decides; this file only PRESENTS — never originates a number/call. Constitution Art.2:
 * remove sight OR sound, the verdict is still 100% recoverable.
 */
(function (root, doc) {
  'use strict';
  var T = root.TechEngine, A = root.ChittiTechAudio, D = root.ChittiTechData,
      TS = root.ChittiTipShield, J = root.ChittiTechJournal, CH = root.ChittiTechChart;
  var DEFAULT_INDS = ['Roshan Indicator', 'RSI', 'MACD', 'Stochastic', 'Williams %R', 'Bollinger Bands', 'Supertrend', 'EMA 200', 'ADX', 'VWAP'];
  var ALL_TFS = ['monthly', 'weekly', 'daily', '4h', '1h', '15m'];
  var state = { symbol: 'RELIANCE', mode: 'longterm', data: null, sig: null, cv: null, inds: DEFAULT_INDS.slice(), tfs: [], watch: [], chartTf: 'daily', chartInds: ['EMA 20', 'EMA 50', 'RSI'] };
  var CHART_TFS = [['monthly', 'Monthly'], ['weekly', 'Weekly'], ['daily', 'Daily'], ['4h', '4 Hour'], ['1h', '1 Hour'], ['15m', '15 Min'], ['5m', '5 Min'], ['1m', '1 Min']];

  function $(id) { return doc.getElementById(id); }
  function set(id, html) { var el = $(id); if (el) el.innerHTML = html; }
  function show(id, on) { var el = $(id); if (el) el.style.display = on ? '' : 'none'; }
  function live(msg) { var el = $('tech-live'); if (el) { el.textContent = ''; setTimeout(function () { el.textContent = msg; }, 30); } }
  function speak(t) { if (A) A.speak(t); }
  var SHAPE = { BUY: '▲▲', SELL: '▼▼', WAIT: '■' }, WORD = { BUY: 'BUY', SELL: 'SELL', WAIT: 'WAIT / HOLD' };

  function rail() {
    return '<p class="tech-rail">⚠️ <b>Most short-term traders lose money</b> (SEBI). This is education, ' +
      '<b>not advice</b>. Chitti never places an order. <span class="tech-sebi-mini">NOT SEBI REGISTERED.</span></p>';
  }

  // ───────── READ: the four-channel verdict ─────────
  function renderVerdict() {
    var cv = state.cv; if (!cv) return; var dec = cv.decision;
    set('verdict-host', '<div class="verdict-hero v-' + dec.toLowerCase() + '" role="group" aria-label="Verdict for ' + state.symbol + '">' +
      '<div class="vh-shape" aria-hidden="true">' + SHAPE[dec] + '</div>' +
      '<div class="vh-main"><div class="vh-word">' + WORD[dec] + '</div>' +
      '<div class="vh-sub">' + cv.headline + ' · confidence <b>' + cv.confidence + '%</b> · risk <b>' + cv.risk + '</b></div></div>' +
      '<button type="button" class="vh-listen" id="vh-listen">🔊 Listen</button>' +
      '<button type="button" class="vh-isl" id="vh-isl" aria-expanded="false" aria-controls="isl-panel-host" ' +
        'aria-label="Show Indian Sign Language translation" title="Indian Sign Language">🤟 ISL</button></div>' +
      '<p class="vh-spoken" id="vh-spoken-text">' + cv.spoken + '</p>' +
      '<p class="vh-vernacular" id="vh-vernacular" translate="no" hidden></p>' +
      '<div id="isl-panel-host" hidden></div>' + rail());
    var btn = $('vh-listen'); if (btn) btn.onclick = speakVerdict;
    var islBtn = $('vh-isl'); if (islBtn) islBtn.onclick = toggleIsl;
    renderVernacular();
    wireLangRerender();
    speakVerdict();
    live('Verdict for ' + state.symbol + ': ' + WORD[dec] + ', confidence ' + cv.confidence + ' percent.');
  }
  function speakVerdict() { var cv = state.cv; if (!cv) return; if (A) { A.verdictTone(cv.decision); A.haptic(cv.decision === 'BUY' ? 'BUY_STRONG' : cv.decision === 'SELL' ? 'SELL_STRONG' : 'HOLD'); } speak(cv.spoken); }

  // G2 — vernacular verdict NLG. When the UI language is not English and
  // DeepSeek (BO12) is Sire-blocked, render a template-based in-language
  // verdict from the engine's structured fields. Proper nouns stay English.
  function renderVernacular() {
    var host = $('vh-vernacular'); if (!host) return;
    var L = root.Chitti && root.Chitti.lang, cv = state.cv, s = state.sig;
    var lang = (L && L.current && L.current()) || 'en';
    if (!cv || !L || typeof L.verdictNLG !== 'function' || lang === 'en') { host.innerHTML = ''; host.hidden = true; return; }
    var rsi = (s && s.indicators && s.indicators.RSI && s.indicators.RSI.value != null) ? s.indicators.RSI.value : null;
    host.innerHTML = L.verdictNLG({
      decision: cv.decision, strong: cv.confidence >= 80, symbol: state.symbol, rsi: rsi,
      trend: s ? s.trend : null,
      stopPrice: (s && s.stop_loss) ? s.stop_loss.price : null,
      stopPct: (s && s.stop_loss) ? s.stop_loss.percentage : null,
      demo: !!(state.data && state.data.source === 'demo'), lang: lang
    });
    host.hidden = false;
  }
  var _langReWired = false;
  function wireLangRerender() {
    if (_langReWired) return; var sel = $('lang-select'); if (!sel) return;
    // addEventListener does not clobber chitti_lang.js's own onchange handler.
    sel.addEventListener('change', function () { setTimeout(renderVernacular, 60); });
    _langReWired = true;
  }

  // ISL four-channel: fingerspell the symbol + verdict + key indicator names.
  // Fingerspell only — compound terms (RSI/MACD/EMA) are spelled, never signed.
  function toggleIsl() {
    var host = $('isl-panel-host'), b = $('vh-isl'); if (!host) return;
    var open = host.hidden;
    host.hidden = !open;
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) { host.innerHTML = ''; return; }
    var dec = (state.cv && state.cv.decision) || 'WAIT';
    var words = [state.symbol, dec, 'RSI', 'MACD', 'EMA'];
    try {
      if (root.Chitti && root.Chitti.isl && root.Chitti.isl.spellWords) root.Chitti.isl.spellWords(host, words, { title: 'ISL — ' + state.symbol + ' verdict' });
      else host.innerHTML = '<p>ISL: ' + words.join(' · ').toUpperCase().split('').join(' ') + '</p>';
    } catch (e) { host.innerHTML = '<p>ISL unavailable.</p>'; }
  }

  function gaugeBand(cv) { var c = cv.confidence, d = cv.decision; if (d === 'WAIT') return { label: 'NEUTRAL', pos: 50 }; if (d === 'BUY') return c >= 80 ? { label: 'STRONG BUY', pos: 92 } : { label: 'BUY', pos: 70 }; return c >= 80 ? { label: 'STRONG SELL', pos: 8 } : { label: 'SELL', pos: 30 }; }
  function renderGauge() { var b = gaugeBand(state.cv); set('gauge-host', '<div class="gauge" role="img" aria-label="Technical rating ' + b.label + '"><div class="gauge-scale"><span>Strong Sell</span><span>Neutral</span><span>Strong Buy</span></div><div class="gauge-track"><div class="gauge-needle" style="left:' + b.pos + '%"></div></div><div class="gauge-label">' + b.label + '</div></div>'); }

  function tally(ind) { var buy = 0, sell = 0, wait = 0; Object.keys(ind || {}).forEach(function (k) { var s = ind[k].signal; if (s === 'BUY') buy++; else if (s === 'SELL') sell++; else wait++; }); return { buy: buy, sell: sell, wait: wait }; }
  function renderVotes() { var t = tally(state.sig.indicators), total = t.buy + t.sell + t.wait; var spoken = t.buy + ' indicators say buy, ' + t.sell + ' say sell, ' + t.wait + ' are neutral.'; set('votes-host', '<div class="votes"><div class="vote v-buy"><b>' + t.buy + '</b><span>say BUY ▲</span></div><div class="vote v-wait"><b>' + t.wait + '</b><span>NEUTRAL ■</span></div><div class="vote v-sell"><b>' + t.sell + '</b><span>say SELL ▼</span></div><p class="votes-line">' + spoken + ' (of ' + total + ' checks)</p></div>'); }

  function renderMood() { var conf = state.sig.confluence || {}, pct = conf.percent || 0, bias = conf.bias || 'NEUTRAL'; var mood = bias === 'NEUTRAL' ? 'Undecided' : (pct >= 100 ? ('Strongly ' + (bias === 'BULLISH' ? 'Bullish' : 'Bearish')) : pct >= 80 ? (bias === 'BULLISH' ? 'Bullish' : 'Bearish') : pct >= 60 ? ('Leaning ' + (bias === 'BULLISH' ? 'up' : 'down')) : 'Choppy / mixed'); set('mood-host', '<div class="mood" role="img" aria-label="Market mood for ' + state.symbol + ': ' + mood + '"><div class="mood-word">🧭 ' + mood + '</div><div class="mood-sub">' + (conf.bull || 0) + ' of ' + (conf.total || 0) + ' timeframes agree (' + pct + '%)</div></div>'); }

  function renderReasons() { var rs = (state.cv && state.cv.reasons) || []; var pros = rs.filter(function (r) { return r.ok; }), cons = rs.filter(function (r) { return !r.ok && !r.neutral; }); function li(r) { return '<li>' + (r.ok ? '✓ ' : '✗ ') + r.text + '</li>'; } set('reasons-host', '<div class="reasons"><div class="pros"><h4>✓ For this read</h4><ul>' + (pros.length ? pros.map(li).join('') : '<li>—</li>') + '</ul></div><div class="cons"><h4>✗ Against / watch</h4><ul>' + (cons.length ? cons.map(li).join('') : '<li>—</li>') + '</ul></div></div>'); }

  // SOP 5 — Primary view · Alternative view · Invalidation. SOP 1 — show the volume check + its confidence effect.
  function renderViews() {
    var cv = state.cv, s = state.sig; if (!cv || !cv.views) { set('views-host', ''); return; }
    var vw = cv.views, vol = cv.volume || {};
    var volCls = vol.confirmed === true ? 'vol-ok' : (vol.confirmed === false ? 'vol-no' : 'vol-na');
    var volIcon = vol.confirmed === true ? '✅' : (vol.confirmed === false ? '⚠️' : '➖');
    var cut = (s && s.confidence_before_volume != null && cv.confidence != null && s.confidence_before_volume !== cv.confidence) ? ' <i>(confidence ' + s.confidence_before_volume + '% → ' + cv.confidence + '% on volume)</i>' : '';
    set('views-host', '<div class="views">' +
      '<div class="view-row view-primary"><b>📌 Primary view</b><p>' + vw.primary + '</p></div>' +
      '<div class="view-row view-alt"><b>🔄 Alternative view</b><p>' + vw.alternative + '</p></div>' +
      '<div class="view-row view-inval"><b>🛑 What would make this view wrong</b><p>' + vw.invalidation + '</p></div>' +
      '<div class="view-vol ' + volCls + '">' + volIcon + ' <b>Volume check:</b> ' + (vol.note || 'not available') + cut + '</div>' +
      '</div>');
  }

  function renderPlan() {
    var s = state.sig;
    if (!s.stop_loss || s.signal === 'HOLD') { set('plan-host', '<p class="plan-none">No clean trade plan right now — ' + (s.why || 'wait for alignment') + '. Waiting is a valid decision.</p>'); return; }
    var ez = s.entry_zone || {}, tlist = [s.target_1, s.target_2, s.target_3].filter(Boolean).map(function (t, i) { return '<tr><th scope="row">Target ' + (i + 1) + '</th><td>₹' + t.price + '</td><td>' + (t.rr || '') + '</td><td>' + (t.action || '') + '</td></tr>'; }).join('');
    set('plan-host', '<table class="plan-table"><caption class="sr-only">Trade plan</caption><tbody><tr class="plan-risk"><th scope="row">🛑 Stop-loss (your risk first)</th><td>₹' + s.stop_loss.price + '</td><td>' + s.stop_loss.percentage + '%</td><td>' + (s.invalidation || '') + '</td></tr><tr><th scope="row">🎯 Entry zone</th><td colspan="3">₹' + (ez.low != null ? ez.low : s.entry_price) + ' – ₹' + (ez.high != null ? ez.high : s.entry_price) + ' (ideal ₹' + (ez.ideal != null ? ez.ideal : s.entry_price) + ')</td></tr>' + tlist + '<tr><th scope="row">⚖️ Risk : Reward</th><td colspan="3">' + (s.risk_reward_ratio || '') + (s.position_size ? ' · ' + s.position_size.shares + ' shares for ₹' + s.position_size.risk_amount + ' risk on ₹' + s.position_size.capital + ' capital' : '') + '</td></tr></tbody></table><button type="button" class="paper-btn" id="paper-log">📓 Log as PAPER trade (no real order)</button>');
    var pb = $('paper-log'); if (pb) pb.onclick = logPaper;
  }

  // ───────── READ: CHART (TradingView heart) + indicator picker + depth ─────────
  function chartLevels() {
    var s = state.sig, levels = []; if (!s) return levels;
    (s.sr_zones || []).slice(0, 4).forEach(function (z) { levels.push({ price: z.price, color: z.type === 'R' ? '#C0341D' : '#138808', label: (z.type === 'R' ? 'R ' : 'S ') + z.price }); });
    if (s.stop_loss) levels.push({ price: s.stop_loss.price, color: '#C0341D', dash: [2, 2], label: 'SL ' + s.stop_loss.price });
    if (s.entry_price) levels.push({ price: s.entry_price, color: '#000080', dash: [], label: 'Entry ' + s.entry_price });
    if (s.target_1) levels.push({ price: s.target_1.price, color: '#0c5e06', dash: [2, 2], label: 'T1 ' + s.target_1.price });
    return levels;
  }
  function drawChartCandles(candles, source, tf, note) {
    var cv = $('tech-canvas'); if (!cv || !CH) return;
    if (!candles || !candles.length) { set('chart-tf-src', '<span class="src src-demo">⚠️ ' + (note || (tf + ' not available')) + '</span>'); return; }
    state._chartCandles = candles; state._chartSrc = source; state._chartTfNote = note;
    CH.draw(cv, candles, { symbol: state.symbol + ' · ' + tf, levels: tf === 'daily' ? chartLevels() : [], indicators: state.chartInds });
    set('chart-tf-src', '<span class="src src-' + (source === 'demo' ? 'demo' : 'live') + '">' + (note || (source + ' ' + tf)) + ' · ' + candles.length + ' bars</span>');
  }
  function redrawChart() { if (state._chartCandles) drawChartCandles(state._chartCandles, state._chartSrc, state.chartTf, state._chartTfNote); }
  function populateChartInds() {
    var host = $('chart-ind-host'); if (!host || !CH) return;
    if (host.childNodes.length) return; // build once
    var html = '<div class="ob-grp">On the price</div>' + CH.OVERLAY_KEYS.map(function (k) { var on = state.chartInds.indexOf(k) >= 0; return '<label><input type="checkbox" data-ci="' + k + '"' + (on ? ' checked' : '') + '> ' + k + '</label>'; }).join('') +
      '<div class="ob-grp">Separate pane</div>' + CH.PANE_KEYS.map(function (k) { var on = state.chartInds.indexOf(k) >= 0; return '<label><input type="checkbox" data-ci="' + k + '"' + (on ? ' checked' : '') + '> ' + k + '</label>'; }).join('');
    host.innerHTML = html;
    Array.prototype.forEach.call(host.querySelectorAll('input[data-ci]'), function (cb) {
      cb.onchange = function () { var k = cb.getAttribute('data-ci'); if (cb.checked) { if (state.chartInds.indexOf(k) < 0) state.chartInds.push(k); } else state.chartInds = state.chartInds.filter(function (x) { return x !== k; }); redrawChart(); };
    });
  }
  function drawChartTf(tf) {
    state.chartTf = tf; var sel = $('chart-tf'); if (sel && sel.value !== tf) sel.value = tf;
    if (!CH) return;
    // already-fetched TFs from the analyze call (monthly/weekly/daily) → draw instantly
    if (state.data && state.data.byTf[tf] && (tf === 'monthly' || tf === 'weekly' || tf === 'daily')) {
      var isLive = state.data.liveTfs.indexOf(tf) >= 0;
      drawChartCandles(state.data.byTf[tf], isLive ? 'live' : 'demo', tf, (isLive ? '🟢 LIVE ' : '🟠 DEMO ') + tf); return;
    }
    set('chart-tf-src', '<span class="loading">loading ' + tf + ' …</span>');
    D.getChartTf(state.symbol, tf).then(function (res) { drawChartCandles(res.candles, res.source, tf, res.note); });
  }
  function populateChartTf() {
    var sel = $('chart-tf'); if (!sel) return;
    if (!sel.options.length) { sel.innerHTML = CHART_TFS.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join(''); sel.onchange = function () { drawChartTf(sel.value); }; }
    sel.value = 'daily';
  }
  function renderChart() { populateChartTf(); populateChartInds(); drawChartTf('daily'); }
  function renderIndicatorPicker() {
    if (!T.INDICATOR_NAMES) return;
    var html = '<details class="ind-picker"><summary>⚙️ Choose indicators (' + state.inds.length + ' of ' + T.INDICATOR_NAMES.length + ')</summary><div class="ind-grid">' +
      T.INDICATOR_NAMES.map(function (nm) { var on = state.inds.indexOf(nm) >= 0; return '<label><input type="checkbox" data-ind="' + nm + '"' + (on ? ' checked' : '') + '> ' + nm + '</label>'; }).join('') + '</div></details>';
    set('indicator-picker-host', html);
    Array.prototype.forEach.call(doc.querySelectorAll('#indicator-picker-host input[data-ind]'), function (cb) {
      // Update the table + the summary count in place. Do NOT rebuild the whole
      // picker — re-setting innerHTML recreates the <details> closed, which on a
      // phone slams the list shut on every tap (looked like "tap does nothing"
      // and made the other ~29 indicators unreachable).
      cb.onchange = function () {
        var nm = cb.getAttribute('data-ind');
        if (cb.checked) { if (state.inds.indexOf(nm) < 0) state.inds.push(nm); }
        else state.inds = state.inds.filter(function (x) { return x !== nm; });
        renderIndicators();
        var sum = doc.querySelector('#indicator-picker-host .ind-picker > summary');
        if (sum) sum.textContent = '⚙️ Choose indicators (' + state.inds.length + ' of ' + T.INDICATOR_NAMES.length + ')';
      };
    });
  }
  function renderTfPicker() {
    var html = '<details class="tf-picker"><summary>⏱ Timeframes (default: ' + state.mode + ' preset)</summary><div class="tf-grid">' +
      ALL_TFS.map(function (tf) { var on = state.tfs.indexOf(tf) >= 0; return '<label><input type="checkbox" data-tf="' + tf + '"' + (on ? ' checked' : '') + '> ' + tf + '</label>'; }).join('') + '<p class="tf-hint">Tick 2+ to override the preset, then Refresh.</p></div></details>';
    set('tf-picker-host', html);
    Array.prototype.forEach.call(doc.querySelectorAll('#tf-picker-host input[data-tf]'), function (cb) {
      cb.onchange = function () { var tf = cb.getAttribute('data-tf'); if (cb.checked) { if (state.tfs.indexOf(tf) < 0) state.tfs.push(tf); } else state.tfs = state.tfs.filter(function (x) { return x !== tf; }); };
    });
  }
  function renderIndicators() {
    var ind = state.sig.indicators || {};
    var rows = state.inds.filter(function (k) { return ind[k]; }).map(function (k) { var x = ind[k]; var glyph = x.signal === 'BUY' ? '▲' : x.signal === 'SELL' ? '▼' : '■'; return '<tr><th scope="row">' + k + '</th><td>' + (x.value != null ? x.value : '—') + '</td><td class="sig-' + x.signal.toLowerCase() + '">' + glyph + ' ' + x.signal + '</td></tr>'; }).join('');
    set('indicators-host', '<table class="ind-table"><caption class="sr-only">Chosen indicators</caption><thead><tr><th scope="col">Indicator</th><th scope="col">Value</th><th scope="col">Read</th></tr></thead><tbody>' + (rows || '<tr><td colspan="3">No indicators selected.</td></tr>') + '</tbody></table>');
  }
  function renderDepth() {
    var s = state.sig;
    renderChart(); renderIndicatorPicker(); renderTfPicker(); renderIndicators();
    var zones = (s.sr_zones || []).slice(0, 5).map(function (z) { return '<li>' + (z.type === 'R' ? '⬆ Resistance' : '⬇ Support') + ' near <b>₹' + z.price + '</b> — ' + z.strength + ' (' + z.timeframes.join('/') + ')</li>'; }).join('');
    set('sr-host', zones ? '<ul class="sr-list">' + zones + '</ul>' : '<p>No strong support/resistance zones detected.</p>');
    var daily = state.data && (state.data.byTf.daily || state.data.byTf.weekly);
    var pat = (T.detectPatterns && daily) ? T.detectPatterns(daily).top : null;
    set('patterns-host', pat ? '<p class="pat">🔎 Pattern: <b>' + pat.name + '</b> (' + pat.dir + ', ~' + pat.reliability + '% historical reliability — not a guarantee)</p>' : '<p class="pat">No clear chart pattern on the latest bars.</p>');
    if (A && daily) {
      set('chart-tools-host', '<button type="button" id="sonify-btn">🔊 Hear the price chart</button> <button type="button" id="summary-btn">🗣️ Describe in one line</button><details class="data-table-wrap"><summary>Show data as table</summary>' + A.dataTable(daily, 14) + '</details>');
      var sb = $('sonify-btn'); if (sb) sb.onclick = function () { sonifyEvents(daily); };
      var mb = $('summary-btn'); if (mb) mb.onclick = function () { speak(A.summarize(daily)); };
    }
  }
  function sonifyEvents(daily) { var events = [], cl = daily.map(function (c) { return c.close; }); var r = T.rsi(cl, 14), rl = r[r.length - 1]; if (rl != null && rl > 70) events.push('rsi_overbought'); else if (rl != null && rl < 30) events.push('rsi_oversold'); var m = T.macd(cl); if (m.hist[m.hist.length - 1] > 0) events.push('macd_bull'); else events.push('macd_bear'); A.sonify(daily, { events: events }); }

  // ───────── the main analyze flow ─────────
  function analyze() {
    var sym = state.symbol, mode = state.mode;
    var modeDef = (T.CONFLUENCE_MODES && T.CONFLUENCE_MODES[mode]) || { trend: ['monthly', 'weekly'], entry: 'daily' };
    var useTfs = state.tfs.length >= 2 ? state.tfs.slice() : modeDef.trend.concat([modeDef.entry]);
    set('verdict-host', '<p class="loading">Reading ' + sym + ' …</p>'); show('result-area', true);
    D.getCandles(sym, useTfs).then(function (data) {
      state.data = data;
      set('source-badge', '<span class="src src-' + data.source + '">' + data.note + '</span>');
      var opts = { mode: mode, capital: J ? J.capital() : 100000, riskPercent: 2 };
      if (state.tfs.length >= 2) opts.tfs = state.tfs.slice();
      var sig = T.generateSignal(data.byTf, opts); sig.symbol = sym;
      var cv = T.chittiVerdict(sig);
      if (T.hasBannedPhrase && T.hasBannedPhrase(cv.spoken)) cv.spoken = cv.spoken.replace(/[^.]*guarantee[^.]*\./gi, '');
      state.sig = sig; state.cv = cv;
      if (J) J.logSignal(sig);
      renderVerdict(); renderGauge(); renderVotes(); renderMood(); renderReasons(); renderViews(); renderPlan(); renderDepth(); checkCoolDown();
    });
  }

  // ───────── SCREENER (TechEngine.screen) ─────────
  function runScreener() {
    var verdict = $('scr-verdict') ? $('scr-verdict').value : '';
    var tier = $('scr-tier') ? $('scr-tier').value : '';
    var universe = T.UNIVERSE.filter(function (s) { return !tier || s.tier === tier; }).slice(0, 12); // cap for live perf
    set('screener-host', '<p class="loading">Scanning ' + universe.length + ' stocks with LIVE NSE data … (a few seconds)</p>');
    Promise.all(universe.map(function (stock) {
      return D.getDaily(stock.sym, 200).then(function (d) {
        var v = T.tfVerdict(d.candles); var rosh = (v.indicators && v.indicators['Roshan Indicator']) ? v.indicators['Roshan Indicator'].signal : null;
        return { stock: stock, verdict: v.verdict, trend: v.trend, conf: Math.round(Math.min(1, Math.abs(v.lean) + v.strength) * 100), roshan: rosh, source: d.source };
      }).catch(function () { return null; });
    })).then(function (rows) {
      rows = rows.filter(Boolean);
      if (verdict) rows = rows.filter(function (r) { return r.verdict === verdict; });
      rows.sort(function (a, b) { return b.conf - a.conf; });
      var liveN = rows.filter(function (r) { return r.source === 'live'; }).length;
      var body = rows.map(function (r) {
        var g = r.verdict === 'BUY' ? '▲' : r.verdict === 'SELL' ? '▼' : '■';
        return '<tr><td><button type="button" class="scr-pick" data-sym="' + r.stock.sym + '">' + r.stock.sym + '</button></td><td>' + r.stock.tier + '</td><td class="sig-' + r.verdict.toLowerCase() + '">' + g + ' ' + r.verdict + '</td><td>' + r.conf + '</td><td>' + r.trend + '</td><td>' + (r.source === 'live' ? '🟢' : '🟠') + '</td></tr>';
      }).join('');
      set('screener-host', '<p class="scr-count"><span class="src src-' + (liveN === rows.length ? 'live' : liveN ? 'mixed' : 'demo') + '">' + liveN + '/' + rows.length + ' LIVE</span> setups, ranked by alignment. Tap a stock to read it. <b>Not a buy list</b> — most traders lose.</p><table class="scr-table"><thead><tr><th>Stock</th><th>Tier</th><th>Read</th><th>Conf</th><th>Trend</th><th>Data</th></tr></thead><tbody>' + (body || '<tr><td colspan="6">No setups match.</td></tr>') + '</tbody></table>');
      Array.prototype.forEach.call(doc.querySelectorAll('.scr-pick'), function (b) { b.onclick = function () { state.symbol = b.getAttribute('data-sym'); var ss = $('tech-symbol'); if (ss) ss.value = state.symbol; selectTab('tab-read'); analyze(); }; });
      live(rows.length + ' setups scanned with live data.');
    });
  }

  // ───────── WATCHLIST + ALERTS (TechEngine.evaluateWatch) ─────────
  function loadWatch() { try { state.watch = JSON.parse(root.localStorage.getItem('chitti_tech_watch_v1') || '[]'); } catch (e) { state.watch = []; } }
  function saveWatch() { try { root.localStorage.setItem('chitti_tech_watch_v1', JSON.stringify(state.watch)); } catch (e) {} }
  function addWatch() { var sym = $('watch-sym') ? $('watch-sym').value : ''; var lvl = $('watch-level') ? parseFloat($('watch-level').value) : null; if (!sym) return; if (!state.watch.some(function (w) { return w.sym === sym; })) state.watch.push({ sym: sym, level: isFinite(lvl) ? lvl : null, dir: 'above' }); saveWatch(); renderWatchlist(); }
  function renderWatchlist() {
    if (!state.watch.length) { set('watchlist-host', '<p>No stocks watched yet. Add one above. Alerts inform you — Chitti never acts on its own.</p>'); return; }
    set('watchlist-host', '<p class="loading">Fetching LIVE prices …</p>');
    Promise.all(state.watch.map(function (w) {
      return D.getCandles(w.sym, ['monthly', 'weekly', 'daily']).then(function (d) { return { w: w, r: T.evaluateWatch(w, d.byTf, {}), source: d.source }; }).catch(function () { return { w: w, r: T.evaluateWatch(w, T.genAllTf(w.sym), {}), source: 'demo' }; });
    })).then(function (list) {
      var liveN = list.filter(function (x) { return x.source === 'live'; }).length;
      var rows = list.map(function (x) {
        var w = x.w, r = x.r, g = r.signal === 'BUY' ? '▲' : r.signal === 'SELL' ? '▼' : '■';
        var al = (r.alerts || []).map(function (a) { return a.type === 'signal' ? (a.dir + ' signal') : a.type === 'level' ? ('crossed ' + a.dir + ' ' + a.level) : a.type === 'pattern' ? a.name : a.type; }).join(', ');
        return '<tr><td><button type="button" class="wl-pick" data-sym="' + w.sym + '">' + w.sym + '</button></td><td>₹' + (r.price != null ? r.price : '—') + ' ' + (x.source === 'live' ? '🟢' : '🟠') + '</td><td>' + r.dayChangePct + '%</td><td class="sig-' + r.signal.toLowerCase() + '">' + g + ' ' + r.signal + ' (' + r.confidence + ')</td><td>' + (al || '—') + '</td><td><button type="button" class="wl-del" data-sym="' + w.sym + '">✕</button></td></tr>';
      }).join('');
      set('watchlist-host', '<p class="scr-count"><span class="src src-' + (liveN === list.length ? 'live' : liveN ? 'mixed' : 'demo') + '">' + liveN + '/' + list.length + ' LIVE</span></p><table class="wl-table"><thead><tr><th>Stock</th><th>Price</th><th>Day</th><th>Signal</th><th>Alerts</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>');
      Array.prototype.forEach.call(doc.querySelectorAll('.wl-pick'), function (b) { b.onclick = function () { state.symbol = b.getAttribute('data-sym'); var ss = $('tech-symbol'); if (ss) ss.value = state.symbol; selectTab('tab-read'); analyze(); }; });
      Array.prototype.forEach.call(doc.querySelectorAll('.wl-del'), function (b) { b.onclick = function () { var s = b.getAttribute('data-sym'); state.watch = state.watch.filter(function (w) { return w.sym !== s; }); saveWatch(); renderWatchlist(); }; });
    });
  }

  // ───────── BACKTEST / SCORECARD (TechEngine.backtest + scorecard + calibration) ─────────
  function runBacktest() {
    var sym = $('bt-symbol') ? $('bt-symbol').value : state.symbol;
    set('backtest-host', '<p class="loading">Fetching LIVE history, then walking it (no look-ahead) …</p>');
    D.getDaily(sym, 320).then(function (dd) {
      var daily = dd.candles, srcBadge = dd.source === 'live' ? '🟢 LIVE NSE' : '🟠 DEMO data';
      var results = T.backtest(daily, { lookahead: 40, start: 60 });
      var sc = T.scorecard(results), cal = T.calibration(results);
      set('backtest-host', '<div class="bt-card"><h4>' + sym + ' — deterministic backtest <span class="src src-' + (dd.source === 'live' ? 'live' : 'demo') + '">' + srcBadge + '</span></h4>' +
        '<table class="bt-table"><tbody>' +
        '<tr><th>Resolved trades</th><td>' + sc.sample + '</td></tr>' +
        '<tr><th>Win rate</th><td>' + sc.winRate + '%</td></tr>' +
        '<tr><th>Profit factor</th><td>' + sc.profitFactor + '</td></tr>' +
        '<tr><th>Expectancy (R/trade)</th><td>' + sc.expectancy + '</td></tr>' +
        '<tr><th>Max drawdown (R)</th><td>' + sc.maxDrawdownR + '</td></tr>' +
        '<tr><th>Confidence calibration</th><td>' + (cal.verdict) + (cal.ece != null ? ' (ECE ' + cal.ece + ')' : '') + '</td></tr>' +
        '<tr><th>Go / No-Go</th><td><b>' + sc.goNoGo + '</b> ' + (sc.note || '') + '</td></tr>' +
        '</tbody></table>' +
        '<p class="tech-rail">⚠️ Backtest on DEMO data, no costs of emotion. <b>Past performance does not predict the future. Most short-term traders lose money.</b> Not advice. NOT SEBI REGISTERED.</p></div>');
      speak(sym + ' backtest: win rate ' + sc.winRate + ' percent over ' + sc.sample + ' trades. ' + sc.goNoGo + '. Remember, past performance does not predict the future.');
    });
  }

  // ───────── TIP SHIELD ─────────
  function checkTip() {
    var el = $('tip-input'); if (!el) return; var text = el.value || '';
    if (T.detectCrisis && T.detectCrisis(text)) { var cr = T.crisisResponse(); set('tip-host', '<div class="crisis">' + cr.visual + '</div>'); speak(cr.audio); if (A) A.haptic('WARNING'); return; }
    var res = TS.check(text);
    set('tip-host', '<div class="tipres tip-' + res.risk.toLowerCase() + '" data-chitti-response data-chitti-section="Tip Shield"><div class="tip-verdict">' + res.verdict + '</div>' + (res.flags.length ? '<ul class="tip-flags">' + res.flags.map(function (f) { return '<li>🚩 ' + f.why + ' <span class="tip-ev">("' + f.evidence + '")</span></li>'; }).join('') + '</ul>' : '') + '</div>');
    speak(res.spoken); if (A) A.haptic(res.risk === 'HIGH' ? 'WARNING' : 'HOLD'); live('Tip check: ' + res.risk + ' risk. ' + res.flags.length + ' flags.');
  }

  // ───────── PAPER JOURNAL ─────────
  function logPaper() {
    var s = state.sig; if (!s || !s.stop_loss) return; var qty = (s.position_size && s.position_size.shares) || 1;
    var doLog = function () { J.logPaperTrade({ symbol: state.symbol, mode: state.mode, side: s.signal, entry: s.entry_price, quantity: qty, stop: s.stop_loss.price, target: s.target_1 ? s.target_1.price : null }); renderJournal(); speak('Logged as a paper trade. No real order was placed.'); };
    if (typeof root.chittiConfirmAndDo === 'function') root.chittiConfirmAndDo('Shall I log a PAPER ' + s.signal + ' of ' + qty + ' ' + state.symbol + ' at ₹' + s.entry_price + '? (No real order.)', doLog);
    else if (root.confirm('Log a PAPER ' + s.signal + ' of ' + qty + ' ' + state.symbol + ' at ₹' + s.entry_price + '? No real order is placed.')) doLog();
  }
  function renderJournal() {
    if (!J) return; var trades = J.trades();
    var rows = trades.slice(-8).reverse().map(function (t) {
      var reflected = t.lesson || t.mistake_category || t.emotion || t.improvement;
      var refl = reflected ? '<tr class="jrnl-refl-row"><td colspan="6"><div class="jrnl-refl"><b>🧠 Emotion:</b> ' + (t.emotion || '—') + ' · <b>⚠️ Mistake:</b> ' + (t.mistake_category || '—') + '<br><b>📖 Lesson:</b> ' + (t.lesson || '—') + '<br><b>🎯 Improve:</b> ' + (t.improvement || '—') + '</div></td></tr>' : '';
      return '<tr><td>' + t.symbol + '</td><td>' + t.side + '</td><td>₹' + t.entry + '</td><td>' + t.quantity + '</td><td>' + t.status + (t.pnl != null ? ' (₹' + t.pnl + ')' : '') + '</td><td><button type="button" class="jrnl-reflect" data-tid="' + t.trade_id + '">📝 ' + (reflected ? 'Edit' : 'Reflect') + '</button></td></tr>' + refl;
    }).join('');
    set('journal-host', trades.length ? '<table class="jrnl"><caption class="sr-only">Your paper trades</caption><thead><tr><th>Stock</th><th>Side</th><th>Entry</th><th>Qty</th><th>Status</th><th>SOP 8</th></tr></thead><tbody>' + rows + '</tbody></table><div id="reflect-host"></div>' : '<p>No paper trades yet. Every trade here is practice — no real money, ever.</p>');
    var jh = $('journal-host'); if (jh) Array.prototype.forEach.call(jh.querySelectorAll('.jrnl-reflect'), function (b) { b.onclick = function () { openReflect(b.getAttribute('data-tid')); }; });
    var ins = J.insights(), ms = J.mistakeSummary ? J.mistakeSummary() : [];
    var msHtml = ms.length ? '<p class="insights-hint">🔁 Repeated mistakes: ' + ms.map(function (m) { return m.category + ' ×' + m.count; }).join(' · ') + '</p>' : '';
    set('insights-host', (ins.length ? '<ul class="insights">' + ins.map(function (i) { return '<li>💡 ' + i + '</li>'; }).join('') + '</ul>' : '<p class="insights-hint">Log 10+ paper trades and Chitti will show honest patterns (over-trading, best/worst setups, revenge-trading).</p>') + msHtml);
  }
  // SOP 8 — reflection form: Lesson Learned · Mistake Category · Emotional State · Improvement Action
  function openReflect(tid) {
    var t = (J.trades().filter(function (x) { return x.trade_id === tid; })[0]) || {};
    var mc = (J.MISTAKE_CATEGORIES || []).map(function (m) { return '<option' + (t.mistake_category === m ? ' selected' : '') + '>' + m + '</option>'; }).join('');
    var em = (J.EMOTIONS || []).map(function (e) { return '<option' + (t.emotion === e ? ' selected' : '') + '>' + e + '</option>'; }).join('');
    set('reflect-host', '<div class="reflect-form" role="group" aria-label="Reflect on this trade">' +
      '<h4>📝 Reflect — ' + (t.symbol || '') + ' ' + (t.side || '') + ' (no real money)</h4>' +
      '<label for="rf-emotion">🧠 Emotional state</label><select id="rf-emotion">' + em + '</select>' +
      '<label for="rf-mistake">⚠️ Mistake category</label><select id="rf-mistake">' + mc + '</select>' +
      '<label for="rf-lesson">📖 Lesson learned</label><textarea id="rf-lesson" rows="2">' + (t.lesson || '') + '</textarea>' +
      '<label for="rf-improve">🎯 Improvement action (what I will do next time)</label><textarea id="rf-improve" rows="2">' + (t.improvement || '') + '</textarea>' +
      '<button type="button" id="rf-save">✓ Save reflection</button></div>');
    var sb = $('rf-save'); if (sb) sb.onclick = function () { saveReflect(tid); };
  }
  function saveReflect(tid) {
    if (!J || !J.reflect) return;
    J.reflect(tid, { emotion: ($('rf-emotion') || {}).value || '', mistake_category: ($('rf-mistake') || {}).value || '', lesson: ($('rf-lesson') || {}).value || '', improvement: ($('rf-improve') || {}).value || '' });
    set('reflect-host', ''); renderJournal();
    speak('Reflection saved. Lesson and mistake recorded for this paper trade.');
    live('Reflection saved.');
  }
  function checkCoolDown() { if (!J) return; var ls = J.lossSpiral(); if (ls.isSpiral) { set('cooldown-host', '<div class="cooldown">🧊 ' + ls.message + '</div>'); speak(ls.message); if (A) A.haptic('WARNING'); } else set('cooldown-host', ''); }

  // ───────── tabs + boot ─────────
  function selectTab(id) {
    var tabs = [['tab-read', 'panel-read'], ['tab-screener', 'panel-screener'], ['tab-watchlist', 'panel-watchlist'], ['tab-backtest', 'panel-backtest'], ['tab-tip', 'panel-tip'], ['tab-journal', 'panel-journal']];
    tabs.forEach(function (t) { var tab = $(t[0]), pan = $(t[1]); if (!tab || !pan) return; var on = t[0] === id; tab.setAttribute('aria-selected', on ? 'true' : 'false'); pan.classList.toggle('active', on); if (on) pan.removeAttribute('hidden'); else pan.setAttribute('hidden', ''); });
  }
  function populateSymbols(selId) { var sel = $(selId); if (!sel || !T.UNIVERSE) return; sel.innerHTML = T.UNIVERSE.map(function (s) { return '<option value="' + s.sym + '">' + s.sym + ' — ' + s.name + ' (' + s.tier + ')</option>'; }).join(''); }
  function populateModes(selId) { var sel = $(selId); if (!sel || !T.CONFLUENCE_MODES) return; sel.innerHTML = Object.keys(T.CONFLUENCE_MODES).map(function (k) { return '<option value="' + k + '">' + T.CONFLUENCE_MODES[k].label + '</option>'; }).join(''); }

  function init() {
    if (!T) { set('verdict-host', '<p>Engine not loaded.</p>'); return; }
    populateSymbols('tech-symbol'); populateModes('tech-mode'); populateSymbols('bt-symbol'); populateModes('scr-mode');
    var ss = $('tech-symbol'); if (ss) { ss.value = state.symbol; ss.onchange = function () { state.symbol = ss.value; }; }
    var ms = $('tech-mode'); if (ms) { ms.value = state.mode; ms.onchange = function () { state.mode = ms.value; }; }
    var ab = $('tech-analyze'); if (ab) ab.onclick = analyze;
    var rb = $('tech-refresh'); if (rb) rb.onclick = analyze;
    var tb = $('tip-check'); if (tb) tb.onclick = checkTip;
    var fb = $('journal-forget'); if (fb) fb.onclick = function () { J.forget(); renderJournal(); speak('Cleared. Chitti forgot your paper journal.'); };
    var sb = $('scr-run'); if (sb) sb.onclick = runScreener;
    var wb = $('watch-add'); if (wb) wb.onclick = addWatch;
    var ws = $('watch-sym'); if (ws) populateSymbols('watch-sym');
    var bb = $('bt-run'); if (bb) bb.onclick = runBacktest;
    // tab wiring
    [['tab-read'], ['tab-screener'], ['tab-watchlist'], ['tab-backtest'], ['tab-tip'], ['tab-journal']].forEach(function (t) { var el = $(t[0]); if (el) el.onclick = function () { selectTab(t[0]); if (t[0] === 'tab-watchlist') renderWatchlist(); }; });
    loadWatch(); renderJournal();
  }
  root.ChittiTechApp = { init: init, analyze: analyze, runScreener: runScreener, runBacktest: runBacktest, selectTab: selectTab, renderJournal: renderJournal, openReflect: openReflect, state: state };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : null);
