/* chitti_observability.js — real-time AI observability for every Chitti page
 * ============================================================================
 * 🎖️ World Class Chitti Observability — Commando Discipline. Zero Excuses.
 *
 * Sire-spec 2026-05-29 (see CHITTI_OBSERVABILITY_SPEC.md). Transforms the
 * on-demand audit (tools/audit_per_chitti.mjs, run by hand) into always-on
 * telemetry with a live footer badge.
 *
 * Four features wired:
 *   1. Response Time Tracking  — performance.now() wrappers + P50/P95/P99
 *   2. Verification Agent       — 5 checks every 5 s, Active/Degraded/Failed
 *   3. Audit ID                 — CH-YYYYMMDD-XXXX, localStorage, 24 h TTL
 *   4. Feedback Learning Loop   — every backend POST carries audit_id
 *
 * Auto-loaded by chitti_a11y.js. Listens for chitti:langchange. Fail-soft
 * everywhere — backend down ≠ badge breaks; badge missing ≠ page breaks.
 *
 * 4-user contract (per chitti-cto/CTO.md §UI Rules):
 *   👁️ Blind     — 🔊 reads status aloud in user's language
 *   🦻 Deaf      — visual ✅⚠️❌ pill + Active/Degraded/Failed text
 *   🤫 Mute      — ✏️ text feedback; 🎙️ voice feedback when SR available
 *   📖 Illiterate — symbol-coded; voice readout in their language
 *
 * Per-box widget — the badge IS a Chitti box (per CTO.md §Mandatory 5):
 *   🔊 speaker · 🤖 Chitti icon · 👍 👎 · ✏️🎙️ · 🌐 (defers to page lang selector)
 *
 * Performance budget: < 0.2 % CPU on 2017 Android. Verification loop runs
 * every 5 s; heartbeat batches every 30 s; no work between ticks.
 * ============================================================================
 */
(function () {
  if (window.__chittiObsLoaded) return;
  window.__chittiObsLoaded = true;

  // ── Config ─────────────────────────────────────────────────────────────
  var API = window.CHITTI_OBS_API ||
            'https://chitti-shares-api-production.up.railway.app';
  // Remote telemetry is OPT-IN. Without an explicit window.CHITTI_OBS_API the
  // collector lives on chitti-shares-api, which sends no CORS header for these
  // endpoints — so cross-origin pages were logging a CORS error on every tick
  // (Sire 2026-06-04). The badge runs 100% locally (runChecks); the network
  // POST/GET only add a central dashboard. Default = local-only, zero console noise.
  var OBS_REMOTE = !!window.CHITTI_OBS_API;
  var AUDIT_KEY = 'chitti_audit_id';
  var AUDIT_TTL_MS = 24 * 60 * 60 * 1000;     // 24 h rolling
  var SAMPLES_KEY = 'chitti_obs_samples_v1';   // localStorage ring buffer
  var SAMPLES_MAX = 200;
  var SLOW_OP_MS = 3000;                       // >3 s → log as slow op
  var TICK_MS = 5000;                          // verification + badge refresh
  var HEARTBEAT_MS = 30000;                    // 30 s batched heartbeat

  // ── Audit ID — CH-YYYYMMDD-XXXX (24 h TTL) ────────────────────────────
  function newAuditId() {
    var d = new Date();
    var ymd = d.getFullYear().toString() +
              String(d.getMonth() + 1).padStart(2, '0') +
              String(d.getDate()).padStart(2, '0');
    var hash = (Date.now().toString(36) + Math.random().toString(36).slice(2))
               .slice(-4).toUpperCase();
    return 'CH-' + ymd + '-' + hash;
  }
  var AUDIT_ID = (function () {
    try {
      var raw = localStorage.getItem(AUDIT_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && p.id && (Date.now() - p.t) < AUDIT_TTL_MS) {
          // refresh TTL
          localStorage.setItem(AUDIT_KEY, JSON.stringify({ id: p.id, t: Date.now() }));
          return p.id;
        }
      }
    } catch (e) {}
    var id = newAuditId();
    try { localStorage.setItem(AUDIT_KEY, JSON.stringify({ id: id, t: Date.now() })); } catch (e) {}
    return id;
  })();

  // Device fingerprint — NOT PII. Hash of UA + screen + lang.
  function deviceFp() {
    var s = (navigator.userAgent || '') + '|' +
            (screen.width || 0) + 'x' + (screen.height || 0) + '|' +
            (navigator.language || '');
    var h = 5381;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) + h) ^ s.charCodeAt(i); }
    return 'fp_' + (h >>> 0).toString(36);
  }
  var DEVICE_FP = deviceFp();
  var USER_TOKEN = (function () {
    try { return localStorage.getItem('chitti_user_token') || ''; } catch (e) { return ''; }
  })();
  var PAGE = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');

  // ── Latency ring buffer ───────────────────────────────────────────────
  var samples = []; // [{ ms, kind, ts }, ...]
  try {
    samples = JSON.parse(localStorage.getItem(SAMPLES_KEY) || '[]') || [];
  } catch (e) {}
  function pushSample(ms, kind) {
    samples.push({ ms: ms | 0, kind: kind || 'translation', ts: Date.now() });
    if (samples.length > SAMPLES_MAX) samples = samples.slice(-SAMPLES_MAX);
    try { localStorage.setItem(SAMPLES_KEY, JSON.stringify(samples)); } catch (e) {}
  }
  function percentile(arr, p) {
    if (!arr.length) return null;
    var s = arr.slice().sort(function (a, b) { return a - b; });
    var i = Math.max(0, Math.min(s.length - 1, Math.floor(s.length * p / 100)));
    return s[i];
  }
  function latencyStats() {
    // Only consider last 100 samples for live stats
    var recent = samples.slice(-100).map(function (s) { return s.ms; });
    return {
      n:   recent.length,
      p50: percentile(recent, 50),
      p95: percentile(recent, 95),
      p99: percentile(recent, 99),
      last: recent.length ? recent[recent.length - 1] : null,
    };
  }

  // ── POST helpers (fail-soft) ──────────────────────────────────────────
  function post(path, payload) {
    if (!OBS_REMOTE) return; // local-only by default — no cross-origin telemetry
    try {
      fetch(API + path, {
        method: 'POST', mode: 'cors', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({
          audit_id: AUDIT_ID, page: PAGE,
          device_fp: DEVICE_FP, user_token: USER_TOKEN,
        }, payload)),
      }).catch(function () {});
    } catch (e) {}
  }

  // ── Public: record a translation latency (called from chitti_lang_runtime.js) ─
  window._chittiObs = window._chittiObs || {};
  window._chittiObs.recordLatency = function (ms, kind, meta) {
    if (typeof ms !== 'number' || ms < 0) return;
    pushSample(ms, kind);
    if (ms >= SLOW_OP_MS) {
      post('/api/observability/slow_op', {
        elapsed_ms:  ms,
        kind:        kind || 'translation',
        box_id:      (meta && meta.box_id) || null,
        text_length: (meta && meta.text_length) || null,
        source_lang: (meta && meta.source_lang) || 'en',
        target_lang: (meta && meta.target_lang) || (document.documentElement.lang || 'en'),
      });
    }
  };
  window._chittiObs.auditId = function () { return AUDIT_ID; };

  // ── Verification Agent — 5 checks every 5 s ───────────────────────────
  var lastBreach = {}; // dedupe alerts: { check_name: minuteStamp }
  function fireAlert(check_name, severity, observed, threshold) {
    var minute = Math.floor(Date.now() / 60000);
    if (lastBreach[check_name] === minute) return; // dedupe within minute
    lastBreach[check_name] = minute;
    post('/api/observability/alert', {
      check_name: check_name, severity: severity,
      observed_value: String(observed), threshold: String(threshold),
    });
  }

  var llmLastOk = Date.now(); // updated when callBackend succeeds
  var llmLastErr = 0;
  window._chittiObs.recordLLM = function (okFlag) {
    if (okFlag) llmLastOk = Date.now(); else llmLastErr = Date.now();
  };

  function runChecks() {
    var status = 'active';
    var breaches = 0;

    // Check 1 — card detection (sane number of widgets-eligible elements)
    var cardCount = document.querySelectorAll(
      '.chitti-response, [data-chitti-response], .section-card, .scan-action, ' +
      '.feature-card, .action-card, .metric-card, .ind-card, .art-card'
    ).length;
    // FIX 2026-06-09: the old baseline ratcheted to the ALL-TIME max and never
    // recovered, so once a feed loaded many cards then cleared (news backend
    // down, view switched), the page was falsely "Degraded" forever. Now the
    // baseline DECAYS toward the current count, and a drop must persist for 2
    // consecutive cycles before it counts as a breach (debounce transients).
    var low = window.__obsLastCardCount && cardCount < window.__obsLastCardCount * 0.7;
    window.__obsCardLowStreak = low ? (window.__obsCardLowStreak || 0) + 1 : 0;
    if (low && window.__obsCardLowStreak >= 2) {
      fireAlert('card_detection', 'degraded',
        cardCount, '≥ ' + Math.round(window.__obsLastCardCount * 0.7));
      breaches++;
    }
    // Decaying baseline: tracks the recent norm, not the all-time peak.
    window.__obsLastCardCount = Math.max(cardCount, Math.round((window.__obsLastCardCount || 0) * 0.9));

    // Check 2 — translation completeness (in non-English session, ≥ 95 % of
    // chitti-response cards should NOT contain raw English >= 3 chars)
    var lang = (document.documentElement.lang || 'en').toLowerCase();
    var translated = cardCount; // assume all translated if English
    if (lang && lang !== 'en') {
      var allCards = document.querySelectorAll('.chitti-response, [data-chitti-response]');
      var untranslated = 0;
      allCards.forEach(function (el) {
        var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        // Brand / indicator skip (mirrors chitti_lang_runtime.js skip-list)
        if (/^(Chitti|Vaani|MedUPI|RSI|MACD|EMA|SEBI|NSE|BSE|RBI|GST)/i.test(t)) return;
        var latinChars = (t.match(/[A-Za-z]/g) || []).length;
        if (latinChars >= 12 && t.length > 20) untranslated++;
      });
      translated = Math.max(0, allCards.length - untranslated);
      if (allCards.length > 0 && untranslated / allCards.length > 0.05) {
        fireAlert('translation_completeness', 'degraded',
          Math.round(100 * untranslated / allCards.length) + '% untranslated',
          '≤ 5%');
        breaches++;
      }
    }

    // Check 3 — widget attachment (every chitti-response should have a bar)
    var withBox = document.querySelectorAll('[data-chitti-response], .chitti-response');
    var attached = 0;
    withBox.forEach(function (el) {
      // feedback-widget.js sibling bar
      var sib = el.nextElementSibling;
      if (sib && sib.classList && sib.classList.contains('chitti-fb-box-bar')) { attached++; return; }
      // chitti_card_widget.js inner bar
      if (el.querySelector('.chitti-card-widget, .pro-card-widget')) { attached++; return; }
    });
    if (withBox.length > 5 && attached / withBox.length < 0.95) {
      fireAlert('widget_attachment', 'degraded',
        Math.round(100 * attached / withBox.length) + '% attached',
        '≥ 95%');
      breaches++;
    }

    // Check 4 — LLM endpoint reachable (last 60 s)
    var sinceOk = Date.now() - llmLastOk;
    var sinceErr = Date.now() - llmLastErr;
    if (sinceErr < 60000 && sinceErr < sinceOk) {
      fireAlert('llm_reachable', 'failed', 'last error ' + Math.round(sinceErr / 1000) + 's ago', '< 60s');
      status = 'failed';
      breaches++;
    }

    // Check 5 — cache hygiene (PRUNE stale old-version keys; do NOT degrade).
    // FIX 2026-06-09: the old check fired "degraded" whenever ANY older
    // chitti_xlate_v* key lingered in localStorage. But stale translation
    // caches are NORMAL for any returning user (they accumulate across deploys)
    // — a fresh browser was "active", a returning user was falsely "Degraded"
    // forever. Old caches are not corruption; just garbage-collect them and
    // stay healthy. (Reproduced: stale key -> degraded; prune -> active.)
    var expectedPrefix = 'chitti_xlate_v2_20260529';
    try {
      var staleKeys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('chitti_xlate_v') === 0 && k.indexOf(expectedPrefix) !== 0) staleKeys.push(k);
      }
      staleKeys.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    } catch (e) {}

    if (status !== 'failed') {
      status = breaches === 0 ? 'active' : 'degraded';
    }
    window._chittiObs.cardCount = cardCount;
    window._chittiObs.translated = translated;
    window._chittiObs.attached = attached;
    window._chittiObs.totalBoxes = withBox.length;
    window._chittiObs.status = status;
    window._chittiObs.breaches = breaches;
    return status;
  }

  // ── Badge — fixed-position footer (bottom-left, mirrors FAB on right) ──
  var badgeEl = null;
  var expanded = false;
  function ensureBadge() {
    if (badgeEl) return badgeEl;
    badgeEl = document.createElement('div');
    badgeEl.id = 'chitti-obs-badge';
    badgeEl.setAttribute('role', 'status');
    badgeEl.setAttribute('aria-live', 'polite');
    badgeEl.setAttribute('aria-label', 'Chitti AI Observability — live status');
    badgeEl.setAttribute('data-chitti-no-translate', '1'); // values change live; skip translation pass
    // Collapsed-by-default at top-right (below the language selector at
    // top:14px which has height ~40px). Expands on tap to the full panel.
    // Always visible, never competes with the cluster of bottom FABs.
    // 2026-05-29 Sire: badge must be always visible, never obscured.
    badgeEl.style.cssText = [
      'position:fixed', 'top:64px', 'right:8px', 'z-index:97',
      'background:#fff', 'border:2px solid #FF9933', 'border-radius:20px',
      'padding:6px 12px', 'font-family:Inter,system-ui,sans-serif',
      'font-size:11px', 'color:#0E2344', 'box-shadow:0 4px 12px rgba(14,35,68,.20)',
      'cursor:pointer', 'user-select:none',
      'transition:all .25s ease',
      'display:flex', 'align-items:center', 'gap:6px',
    ].join(';');
    badgeEl.innerHTML = renderBadge('active');
    badgeEl.addEventListener('click', toggleExpand);
    document.body.appendChild(badgeEl);
    injectStyle();
    return badgeEl;
  }

  function injectStyle() {
    if (document.getElementById('chitti-obs-style')) return;
    var s = document.createElement('style');
    s.id = 'chitti-obs-style';
    s.textContent =
      '#chitti-obs-badge.expanded{border-radius:12px;padding:12px 14px;min-width:260px;max-width:320px;display:block}' +
      '#chitti-obs-badge .obs-line{display:flex;justify-content:space-between;gap:8px;line-height:1.5}' +
      '#chitti-obs-badge .obs-line .lbl{color:#666;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.04em}' +
      '#chitti-obs-badge .obs-line .val{font-weight:700;color:#0E2344}' +
      '#chitti-obs-badge .obs-pill{display:inline-block;padding:2px 8px;border-radius:10px;font-weight:800;font-size:10px;letter-spacing:.04em;white-space:nowrap}' +
      '#chitti-obs-badge .obs-pill.active{background:#dcfce7;color:#0a5a04}' +
      '#chitti-obs-badge .obs-pill.degraded{background:#FFF1D6;color:#8A3A00;border:1px solid #B34700}' +
      '#chitti-obs-badge .obs-pill.failed{background:#fee2e2;color:#CC0000;border:1px solid #CC0000}' +
      '#chitti-obs-badge .obs-head{display:flex;align-items:center;gap:6px;margin-bottom:4px}' +
      '#chitti-obs-badge .obs-head .ttl{font-size:10px;font-weight:800;color:#FF9933;text-transform:uppercase;letter-spacing:.06em}' +
      '#chitti-obs-badge .obs-widget{display:flex;gap:4px;margin-top:8px;padding-top:8px;border-top:1px dashed #FF9933}' +
      '#chitti-obs-badge .obs-widget button{background:transparent;border:1px solid #FF9933;border-radius:14px;width:28px;height:28px;font-size:13px;cursor:pointer;padding:0;line-height:1}' +
      '#chitti-obs-badge .obs-widget button:hover{background:#FFF1D6}' +
      '#chitti-obs-badge .obs-mini{display:flex;align-items:center;gap:6px;white-space:nowrap}' +
      '@media (max-width: 420px){#chitti-obs-badge{font-size:10px;top:60px;right:6px;padding:5px 10px}}';
    document.head.appendChild(s);
  }

  function t(key, fallback) {
    // Defer to chitti_lang.js T-table if available; else fallback English.
    if (window.Chitti && window.Chitti.lang && typeof window.Chitti.lang.t === 'function') {
      try { var v = window.Chitti.lang.t(key); if (v && v !== key) return v; } catch (e) {}
    }
    return fallback;
  }

  function renderBadge(status) {
    var stats = latencyStats();
    var rt = stats.last ? Math.round(stats.last) + ' ms' : '— ms';
    var p95 = stats.p95 ? Math.round(stats.p95) + ' ms' : '—';
    var fb = window._chittiObsFeedbackCount || 0;
    var cards5m = window._chittiObsCards5m || 0;
    var alerts5m = window._chittiObsAlerts5m || 0;
    var pillCls = status;
    var pillTxt = status === 'active' ? 'Active ✅'
                : status === 'degraded' ? 'Degraded ⚠️'
                : 'Failed ❌';
    var head =
      '<div class="obs-head">' +
        '<span style="font-size:13px">🔍</span>' +
        '<span class="ttl">AI Observability — LIVE</span>' +
      '</div>';
    if (!expanded) {
      // Collapsed pill: emoji + status + audit-id-short. Tap to expand.
      var auditShort = AUDIT_ID.slice(-4);
      return '<span class="obs-mini" aria-label="AI Observability ' + pillTxt + ' audit ID ending ' + auditShort + '">' +
               '<span style="font-size:14px">🔍</span>' +
               '<span class="obs-pill ' + pillCls + '">' + pillTxt + '</span>' +
               '<span style="font-family:monospace;font-size:10px;color:#666">#' + auditShort + '</span>' +
             '</span>';
    }
    return head +
      '<div class="obs-line"><span class="lbl">Response Time</span><span class="val">' + rt + '</span></div>' +
      '<div class="obs-line"><span class="lbl">P95 latency</span><span class="val">' + p95 + '</span></div>' +
      '<div class="obs-line"><span class="lbl">Verification Agent</span><span class="obs-pill ' + pillCls + '">' + pillTxt + '</span></div>' +
      '<div class="obs-line"><span class="lbl">Audit ID</span><span class="val" style="font-family:monospace;font-size:10px;cursor:copy" title="Tap to copy" onclick="event.stopPropagation();(navigator.clipboard&&navigator.clipboard.writeText(\'' + AUDIT_ID + '\'))">' + AUDIT_ID + '</span></div>' +
      '<div class="obs-line"><span class="lbl">Feedback Learning</span><span class="val">Enabled (' + fb + ')</span></div>' +
      '<div class="obs-line"><span class="lbl">Last 5 min</span><span class="val">' + cards5m + ' cards · ' + alerts5m + ' fails</span></div>' +
      '<div class="obs-widget" role="group" aria-label="Chitti observability box widget">' +
        '<button aria-label="Read status aloud" onclick="event.stopPropagation();window._chittiObs.speak()">🔊</button>' +
        '<button aria-label="Ask Chitti about status" onclick="event.stopPropagation();window._chittiObs.explain()">🤖</button>' +
        '<button aria-label="Status was helpful" onclick="event.stopPropagation();window._chittiObs.fb(1)">👍</button>' +
        '<button aria-label="Something wrong with status" onclick="event.stopPropagation();window._chittiObs.fb(0)">👎</button>' +
        '<button aria-label="Write feedback" onclick="event.stopPropagation();window._chittiObs.fbText()">✏️</button>' +
        '<button aria-label="Speak feedback" onclick="event.stopPropagation();window._chittiObs.fbMic()">🎙️</button>' +
      '</div>';
  }

  function toggleExpand(ev) {
    if (ev) ev.stopPropagation();
    expanded = !expanded;
    if (badgeEl) {
      badgeEl.classList.toggle('expanded', expanded);
      badgeEl.innerHTML = renderBadge(window._chittiObs.status || 'active');
    }
  }

  // ── Widget-button actions (badge IS a Chitti box) ─────────────────────
  window._chittiObs.speak = function () {
    var stats = latencyStats();
    var msg = 'Chitti AI Observability. ' +
              (window._chittiObs.status === 'active'  ? 'Status active.' :
               window._chittiObs.status === 'degraded' ? 'Status degraded.' :
               'Status failed.') +
              ' Response time ' + (stats.last || 0) + ' milliseconds. ' +
              'Audit I D ' + AUDIT_ID + '. ';
    try {
      if (window.speechSynthesis) {
        var u = new SpeechSynthesisUtterance(msg);
        u.lang = (document.documentElement.lang || 'en') + '-IN';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  };

  window._chittiObs.explain = function () {
    alert('Chitti AI Observability badge — shows live translation health: response time, verification agent status, your audit ID, and feedback samples collected. Tap to expand.');
  };

  window._chittiObs.fb = function (up) {
    fetch('https://chitti-vaani-api-production.up.railway.app/api/feedback/collect', {
      method: 'POST', mode: 'cors', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'chitti_observability', box_id: 'chitti-obs-badge',
        kind: up ? 'up' : 'down', audit_id: AUDIT_ID, page: PAGE,
      }),
    }).catch(function () {});
  };

  window._chittiObs.fbText = function () {
    var txt = window.prompt('Feedback on Chitti observability:');
    if (!txt || !txt.trim()) return;
    fetch('https://chitti-vaani-api-production.up.railway.app/api/feedback/collect', {
      method: 'POST', mode: 'cors', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'chitti_observability', box_id: 'chitti-obs-badge',
        kind: 'text', text: txt, audit_id: AUDIT_ID, page: PAGE,
      }),
    }).catch(function () {});
  };

  window._chittiObs.fbMic = function () {
    try {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { alert('Voice not supported on this device. Tap ✏️ to type instead.'); return; }
      var rec = new SR();
      rec.lang = (document.documentElement.lang || 'en') + '-IN';
      rec.onresult = function (ev) {
        var text = (ev.results[0][0].transcript || '').trim();
        if (text) {
          fetch('https://chitti-vaani-api-production.up.railway.app/api/feedback/collect', {
            method: 'POST', mode: 'cors', cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: 'chitti_observability', box_id: 'chitti-obs-badge',
              kind: 'voice', text: text, audit_id: AUDIT_ID, page: PAGE,
            }),
          }).catch(function () {});
        }
      };
      rec.start();
    } catch (e) {}
  };

  // ── Heartbeat (every 30 s) — also pulls /dashboard for live 5-min counts ─
  function heartbeat() {
    var stats = latencyStats();
    post('/api/observability/heartbeat', {
      status:           window._chittiObs.status || 'active',
      cards_detected:   window._chittiObs.cardCount || 0,
      cards_translated: window._chittiObs.translated || 0,
      widgets_attached: window._chittiObs.attached || 0,
      latency_p50_ms:   stats.p50,
      latency_p95_ms:   stats.p95,
      latency_p99_ms:   stats.p99,
    });
    // also pull aggregate badge data (opt-in only — see OBS_REMOTE)
    if (!OBS_REMOTE) return;
    try {
      fetch(API + '/api/observability/dashboard', { mode: 'cors', cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d) return;
          window._chittiObsCards5m = d.cards_5m || 0;
          window._chittiObsAlerts5m = d.alerts_5m || 0;
        }).catch(function () {});
      fetch(API + '/api/observability/feedback_summary', { mode: 'cors', cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d) return;
          window._chittiObsFeedbackCount = d.samples_last_7d || 0;
        }).catch(function () {});
    } catch (e) {}
  }

  // ── Tick loop ─────────────────────────────────────────────────────────
  function tick() {
    var status = runChecks();
    var el = ensureBadge();
    el.innerHTML = renderBadge(status);
  }

  // ── Boot ──────────────────────────────────────────────────────────────
  function boot() {
    ensureBadge();
    tick();
    heartbeat();
    setInterval(tick, TICK_MS);
    setInterval(heartbeat, HEARTBEAT_MS);
    // re-render badge when language changes
    document.addEventListener('chitti:langchange', function () {
      if (badgeEl) badgeEl.innerHTML = renderBadge(window._chittiObs.status || 'active');
    });
    window.addEventListener('chitti:langchange', function () {
      if (badgeEl) badgeEl.innerHTML = renderBadge(window._chittiObs.status || 'active');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
