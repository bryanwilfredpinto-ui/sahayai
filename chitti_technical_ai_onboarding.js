/* chitti_technical_ai_onboarding.js
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * Onboarding: a first-time user must understand the product in 60 seconds — no video, no docs.
 * Renders "🚀 How to use" demo cards (each with a real ▶ Try it that drives the actual feature),
 * a 🎯 icon legend, and a 🎓 "First time here?" persona picker that runs a guided tour. Voice-first
 * (every card has 🔊 Listen; auto-reads for blind users via the Disability Profile). Shows on first
 * visit; reopen anytime via the header "🎓 How to use" button. window.ChittiOnboard.
 */
(function (root, doc) {
  'use strict';
  var KEY = 'chitti_tech_onboarded_v1';
  function A() { return root.ChittiTechAudio; }
  function app() { return root.ChittiTechApp; }
  function speak(t) { var a = A(); if (a && a.speak) return a.speak(t); try { if (root.Chitti && root.Chitti.a11y && root.Chitti.a11y.speak) root.Chitti.a11y.speak(t); } catch (e) {} }
  function $(id) { return doc.getElementById(id); }
  function setSel(id, v) { var e = $(id); if (e) { e.value = v; try { e.dispatchEvent(new Event('change')); } catch (x) {} } }
  function go(tab) { var a = app(); if (a && a.selectTab) a.selectTab(tab); }
  function isBlind() { try { var p = JSON.parse(root.localStorage.getItem('chitti_disability_profile') || '{}'); return !!(p && (p.blind || (p.profiles && p.profiles.blind))); } catch (e) { return false; } }

  var CARDS = [
    { id: 'read', emoji: '📊', title: 'Read a Stock', what: 'Chitti analyses any NSE stock for you and tells you — in plain words, by voice — what the chart is saying.',
      bullets: ['RSI · MACD · Roshan Indicator', 'Trend + multi-timeframe view', 'A clear BUY / SELL / WAIT read'],
      steps: 'Pick RELIANCE → tap “Read it” → tap 🔊 Listen.', tryLabel: '▶ Try: read RELIANCE',
      action: function () { setSel('tech-symbol', 'RELIANCE'); setSel('tech-mode', 'longterm'); go('tab-read'); var b = $('tech-analyze'); if (b) b.click(); } },
    { id: 'screener', emoji: '🔍', title: 'Screener', what: 'Find stocks matching Chitti’s rules across the market — ranked, not random.',
      bullets: ['Strong momentum', 'Roshan BUY', 'Multi-timeframe bullish / high confidence'],
      steps: 'Open Screener → tap “Scan”.', tryLabel: '▶ Try: scan the market',
      action: function () { go('tab-screener'); var b = $('scr-run'); if (b) b.click(); } },
    { id: 'watchlist', emoji: '👁️', title: 'Watchlist', what: 'Track the stocks you care about. Chitti shows live price, signal and alerts — but never acts on its own.',
      bullets: ['Reliance · TCS · Infosys', 'Alerts on trend change / new signal', 'Live price + day move'],
      steps: 'Open Watchlist → add a stock.', tryLabel: '▶ Try: open watchlist',
      action: function () { go('tab-watchlist'); } },
    { id: 'backtest', emoji: '📈', title: 'Backtest', what: 'Test the rules on real history (no look-ahead) and see how honest the signals were.',
      bullets: ['Win rate · profit factor', 'Drawdown · expectancy', 'Calibration — is Chitti over-confident?'],
      steps: 'Open Backtest → tap “Run backtest”.', tryLabel: '▶ Try: backtest RELIANCE',
      action: function () { go('tab-backtest'); setSel('bt-symbol', 'RELIANCE'); var b = $('bt-run'); if (b) b.click(); } },
    { id: 'tip', emoji: '🛡️', title: 'Check a Tip', what: 'Got a “stock tip” on WhatsApp? Paste it — Chitti checks it for scam patterns and never tells you to buy.',
      bullets: ['Spots “guaranteed”, “sure-shot”, urgency', 'Flags unregistered tipsters', 'Protects first-time investors'],
      steps: 'Open Check a Tip → paste a message → tap “Check”.', tryLabel: '▶ Try: check a scam tip',
      action: function () { go('tab-tip'); var t = $('tip-input'); if (t) t.value = 'Buy XYZ now! guaranteed double in 2 days, sure-shot, join our VIP telegram'; var b = $('tip-check'); if (b) b.click(); } },
    { id: 'journal', emoji: '📒', title: 'Journal', what: 'Practice with PAPER trades — no real money, ever. Chitti logs each one and shows honest patterns.',
      bullets: ['Entry · exit · profit/loss', 'Over-trading + best/worst setups', '“Chitti forget” wipes it anytime'],
      steps: 'Open Journal to see your practice trades.', tryLabel: '▶ Try: open journal',
      action: function () { go('tab-journal'); } }
  ];

  var ICONS = [
    ['🔊', 'Read this box aloud'], ['🤖 / ▶', 'Chitti explains it in simple language'],
    ['👍', 'This helped me'], ['👎', 'This was wrong — tell Chitti why'],
    ['✏️', 'Write or speak feedback'], ['🎙️', 'Talk to Chitti (in the feedback bar)'],
    ['🌐', 'Change language (26 Indian languages)'], ['⏱', 'Change the chart timeframe']
  ];

  var PERSONAS = [
    { emoji: '🟢', label: 'Beginner Investor', mode: 'longterm', sym: 'RELIANCE', intro: 'Welcome. You are a beginner, so I picked Reliance on the long-term view — the calmest way to start. Tap Listen to hear my read. Green double-up means strength, red double-down means weakness.' },
    { emoji: '🔵', label: 'Swing Trader', mode: 'swing', sym: 'TCS', intro: 'Swing trader — I set the weekly-and-daily view on TCS. Watch the confidence number and the stop-loss; never trade without one.' },
    { emoji: '🟠', label: 'Intraday Trader', mode: 'daytrader', sym: 'RELIANCE', intro: 'Intraday — I set the faster timeframes. Remember: most short-term traders lose money. Chitti shows the read; it never tells you to buy.' },
    { emoji: '🟣', label: 'Long-Term Investor', mode: 'longterm', sym: 'INFY', intro: 'Long-term investor — monthly and weekly trend on Infosys. Look at the big picture, not the daily noise.' },
    { emoji: '⚫', label: 'Learn Technical Analysis', mode: 'longterm', sym: 'RELIANCE', intro: 'Let us learn. I will read Reliance and show the indicators. Tap any indicator’s 🔊 to hear what RSI, MACD and the Roshan Indicator mean.' }
  ];

  function cardHTML(c) {
    return '<div class="ob-card" data-ob="' + c.id + '"><div class="ob-card-h"><span class="ob-emoji" aria-hidden="true">' + c.emoji + '</span><h4>' + c.title + '</h4>' +
      '<button type="button" class="ob-listen" data-ob-listen="' + c.id + '" aria-label="Listen to ' + c.title + '">🔊</button></div>' +
      '<p class="ob-what">' + c.what + '</p><ul class="ob-bul">' + c.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>' +
      '<p class="ob-steps"><b>How:</b> ' + c.steps + '</p>' +
      '<button type="button" class="ob-try" data-ob-try="' + c.id + '">' + c.tryLabel + '</button></div>';
  }

  function render() {
    var host = $('onboarding-host'); if (!host) return;
    var html = '<section class="ob" role="region" aria-label="How to use Chitti Technicals">' +
      '<div class="ob-head"><h2>🚀 How to use Chitti Technical <span>— in 60 seconds</span></h2>' +
      '<div class="ob-head-btns"><button type="button" id="ob-readall">🔊 Read this to me</button><button type="button" id="ob-dismiss" class="ghost">✓ Got it</button></div></div>' +
      '<p class="ob-intro">Chitti reads any Indian stock for you — <b>by voice, in your language</b>. It coaches; it never gambles for you. Here is what each part does:</p>' +
      '<div class="ob-grid">' + CARDS.map(cardHTML).join('') + '</div>' +
      '<div class="ob-legend" role="region" aria-label="What the icons mean"><h3>🎯 What do these icons mean?</h3><table><tbody>' +
        ICONS.map(function (i) { return '<tr><td class="ob-ic">' + i[0] + '</td><td>' + i[1] + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="ob-personas" role="region" aria-label="First time here? Choose your style"><h3>🎓 First time here? Pick one — Chitti gives you a guided tour:</h3><div class="ob-persona-row">' +
        PERSONAS.map(function (p, i) { return '<button type="button" class="ob-persona" data-ob-persona="' + i + '"><span aria-hidden="true">' + p.emoji + '</span> ' + p.label + '</button>'; }).join('') + '</div></div>' +
      '</section>';
    host.innerHTML = html;
    // wire
    Array.prototype.forEach.call(host.querySelectorAll('[data-ob-try]'), function (b) { b.onclick = function () { var c = CARDS.filter(function (x) { return x.id === b.getAttribute('data-ob-try'); })[0]; if (c) { hide(); try { c.action(); } catch (e) {} speak(c.title + '. ' + c.what); } }; });
    Array.prototype.forEach.call(host.querySelectorAll('[data-ob-listen]'), function (b) { b.onclick = function () { var c = CARDS.filter(function (x) { return x.id === b.getAttribute('data-ob-listen'); })[0]; if (c) speak(c.title + '. ' + c.what + ' ' + c.steps); }; });
    Array.prototype.forEach.call(host.querySelectorAll('[data-ob-persona]'), function (b) { b.onclick = function () { tour(PERSONAS[+b.getAttribute('data-ob-persona')]); }; });
    var rd = $('ob-readall'); if (rd) rd.onclick = readAll;
    var dm = $('ob-dismiss'); if (dm) dm.onclick = function () { hide(); speak('Okay. Tap “How to use” at the top any time.'); };
  }

  function readAll() {
    var txt = 'How to use Chitti Technical. ' + CARDS.map(function (c) { return c.title + ': ' + c.what; }).join(' ') +
      ' The icons: 🔊 reads aloud, the robot explains simply, thumbs up and down give feedback, the pencil sends feedback, the mic talks to Chitti.';
    speak(txt);
  }

  function tour(p) {
    hide();
    setSel('tech-symbol', p.sym); setSel('tech-mode', p.mode); go('tab-read');
    var b = $('tech-analyze'); if (b) b.click();
    speak(p.intro);
    var live = $('tech-live'); if (live) { live.textContent = ''; setTimeout(function () { live.textContent = p.label + ' tour started. ' + p.intro; }, 40); }
  }

  function show() { var h = $('onboarding-host'); if (!h) return; render(); h.style.display = ''; if (isBlind()) setTimeout(readAll, 600); }
  function hide() { var h = $('onboarding-host'); if (h) h.style.display = 'none'; try { root.localStorage.setItem(KEY, '1'); } catch (e) {} }
  function toggle() { var h = $('onboarding-host'); if (h && h.style.display === 'none') show(); else hide(); }

  function init() {
    var open = $('ob-open'); if (open) open.onclick = function () { var h = $('onboarding-host'); if (h && (h.style.display === 'none' || !h.innerHTML)) show(); else hide(); };
    var seen = false; try { seen = !!root.localStorage.getItem(KEY); } catch (e) {}
    if (!seen) show(); else { var h = $('onboarding-host'); if (h) h.style.display = 'none'; }
  }

  root.ChittiOnboard = { show: show, hide: hide, toggle: toggle, init: init };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { setTimeout(init, 300); }); else setTimeout(init, 300);
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : null);
