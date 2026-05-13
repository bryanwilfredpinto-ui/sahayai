/**
 * CHITTI FEATURES — "What can Chitti do for you?" discovery substrate
 *
 * LOCKED 2026-05-14 in SAHAYAI_MASTER.md §2 / §7. Every Chitti page
 * gets a "What can Chitti do for you?" button. The button opens a
 * modal that reads its content from the per-product
 * `<folder>/skills/FEATURES.md` — NOTHING IS HARDCODED.
 *
 * Contract (per founder lock):
 *   1. "What can Chitti do for you?" button on every Chitti page.
 *   2. Reads all features aloud in the user's selected language.
 *   3. Source is `skills/FEATURES.md` — never hardcoded in JS.
 *   4. Tap any feature to "activate it" (read it aloud + show body).
 *   5. Auto-reads on first visit for blind users.
 *
 * The substrate auto-loads from chitti_a11y.js so every Chitti
 * page inherits it without per-page edits — same pattern as the
 * ISL plugin.
 *
 * Voice: defers to Chitti.a11y.speak() which routes through the
 * Voice Factory (Bhashini today, community voices later — see
 * project_voice_strategy_locked).
 *
 * Honesty: if a page has no FEATURES.md yet, the modal surfaces an
 * honest empty state — NEVER a fake feature list.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'chitti_features_v1';
  const A11Y_KEY = 'chitti_a11y_v1';
  const FEATURES_CACHE = new Map();

  // Page slug → product folder. Pulled from SAHAYAI_MASTER §4a frontend
  // ↔ folder map. Pages not listed here use no auto-mapping; they MUST
  // declare <meta name="chitti-features" content="..."> to opt in, or
  // get the honest empty state.
  const PAGE_TO_FOLDER = {
    'chitti_news': 'chitti-news',
    'chitti_medupi': 'chitti-medupi',
    'chitti_vaani': 'chitti-vaani',
    'chitti_government': 'chitti-government',
    'chitti_upi': 'chitti-upi',
    'chitti_scanner': 'chitti-scanner',
    'chitti_ca': 'chitti-ca',
    'chitti_legal': 'chitti-legal',
    'chitti_logo_video': 'chitti-logo-video',
    'chitti_voice_factory': 'chitti-voice-factory',
    'chitti_quality': 'chitti-quality',
    // chitti_fundamentals.html and chitti_complete_technical.html share
    // the chitti-shares backend, but they expose different feature
    // surfaces to the user. Each frontend now has its own FEATURES.md
    // so Discovery shows the right list per page. (SAHAYAI_MASTER §4a
    // still maps both pages to chitti-shares for backend purposes.)
    'chitti_fundamentals': 'chitti-fundamentals',
    'chitti_complete_technical': 'chitti-complete-technical',
    'chitti_isl': 'chitti-isl',
    'chitti_kirana': 'chitti-kirana',
  };

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (_) { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (_) {}
  }
  function loadA11yState() {
    try { return JSON.parse(localStorage.getItem(A11Y_KEY)) || {}; }
    catch (_) { return {}; }
  }

  // ── PAGE → FEATURES.md URL ───────────────────────────────────
  function pageSlug() {
    const segs = location.pathname.split('/').filter(Boolean);
    const last = segs[segs.length - 1] || '';
    return last.replace(/\.html?$/i, '').toLowerCase();
  }

  function featuresUrl() {
    // 1. Page-level override via meta tag — every page can pin its own
    //    FEATURES.md if the auto-map is wrong.
    const meta = document.querySelector('meta[name="chitti-features"]');
    if (meta && meta.content) return meta.content;
    // 2. Auto-map by page slug.
    const slug = pageSlug();
    const folder = PAGE_TO_FOLDER[slug];
    if (folder) return folder + '/skills/FEATURES.md';
    return null;
  }

  // ── MARKDOWN PARSER ──────────────────────────────────────────
  // Pragmatic — handles the three shapes our FEATURES.md files use:
  //   1. H2 section + H3 features (chitti-vaani style)
  //   2. H2 section + markdown table (chitti-medupi / chitti-government)
  //   3. H2 section + top-level bullets (mixed)
  // Skips housekeeping sections: "How to keep this file honest",
  // "Cross-product hooks". Inline markdown bold/links stripped.
  function stripMd(s) {
    return String(s || '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')           // images
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')         // links → text
      .replace(/`([^`]+)`/g, '$1')                     // inline code
      .replace(/\*\*([^*]+)\*\*/g, '$1')               // bold
      .replace(/\*([^*]+)\*/g, '$1')                   // italic
      .replace(/_([^_]+)_/g, '$1')                     // underline italic
      .replace(/~~([^~]+)~~/g, '$1')                   // strikethrough
      .trim();
  }

  function inferStatus(title) {
    const t = title.toLowerCase();
    if (/built|working|live|shipped/.test(t)) return 'LIVE';
    if (/planned|queued|coming|wave|next/.test(t)) return 'PLANNED';
    if (/future|roadmap|partnership|regulator/.test(t)) return 'FUTURE';
    if (/android|phase\s*2/.test(t)) return 'ANDROID';
    return 'OTHER';
  }

  const STATUS_BADGE = {
    LIVE:    { emoji: '🟢', label: 'LIVE',    color: '#16a34a' },
    PLANNED: { emoji: '🟡', label: 'PLANNED', color: '#ca8a04' },
    FUTURE:  { emoji: '🔵', label: 'FUTURE',  color: '#2563eb' },
    ANDROID: { emoji: '📱', label: 'ANDROID', color: '#7c3aed' },
    OTHER:   { emoji: '⚪', label: '',        color: '#6b7280' },
  };

  function parseFeatures(md) {
    const lines = String(md || '').split(/\r?\n/);
    const sections = [];
    let curSection = null;
    let curFeature = null;
    let inTable = false;
    let tableHeaderSeen = false;
    let tableNameIdx = 0;

    const pushFeature = () => {
      if (curFeature && curSection) {
        curSection.features.push(curFeature);
        curFeature = null;
      }
    };
    const pushSection = () => {
      pushFeature();
      if (curSection && curSection.features.length) sections.push(curSection);
      curSection = null;
    };

    for (const rawLine of lines) {
      const line = rawLine.replace(/\s+$/, '');

      const h2 = line.match(/^##\s+(.+?)\s*$/);
      if (h2) {
        pushSection();
        const title = stripMd(h2[1]);
        if (/^(how\s+to\s+keep|cross[-\s]?product|updating\s+this)/i.test(title)) {
          curSection = null;
          inTable = false;
          continue;
        }
        curSection = { title, status: inferStatus(title), features: [] };
        inTable = false;
        tableHeaderSeen = false;
        continue;
      }
      if (!curSection) continue;

      const h3 = line.match(/^###\s+(.+?)\s*$/);
      if (h3) {
        pushFeature();
        curFeature = { name: stripMd(h3[1]), body: [] };
        inTable = false;
        tableHeaderSeen = false;
        continue;
      }

      // Table rows
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const trimmed = line.trim();
        // Alignment row like `|---|---|`
        if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
          tableHeaderSeen = true;
          inTable = true;
          continue;
        }
        const cells = trimmed.slice(1, -1).split('|').map((c) => stripMd(c));
        if (!inTable) {
          // First (header) row — pick name column.
          // Prefer "Feature", else first non-empty cell.
          inTable = true;
          tableHeaderSeen = false;
          tableNameIdx = 0;
          for (let i = 0; i < cells.length; i++) {
            if (/^(feature|capability|item|action|card|service)$/i.test(cells[i])) {
              tableNameIdx = i;
              break;
            }
          }
          // If first cell is `#` or empty header, name is column 1.
          if (tableNameIdx === 0 && (/^#$/.test(cells[0]) || cells[0] === '')) {
            tableNameIdx = 1;
          }
          continue;
        }
        if (!tableHeaderSeen) {
          // We got a data row before the alignment row — skip; will
          // pick up after the alignment row arrives. (Edge case.)
          continue;
        }
        // Data row
        const name = (cells[tableNameIdx] || '').trim();
        if (!name) continue;
        const detail = cells
          .filter((_, i) => i !== tableNameIdx && cells[i])
          .join(' — ')
          .trim();
        pushFeature();
        curSection.features.push({ name, body: detail ? [detail] : [] });
        continue;
      } else if (inTable) {
        // Table ended.
        inTable = false;
        tableHeaderSeen = false;
      }

      // Top-level bullet — becomes a feature in its own right when no
      // H3 is currently open (otherwise the bullet is body of the H3).
      const bullet = line.match(/^[-*]\s+(.+?)\s*$/);
      if (bullet) {
        const text = stripMd(bullet[1]);
        if (!curFeature) {
          // Standalone bullet — first ' — ' splits name vs detail.
          let name = text, body = '';
          const dash = text.indexOf(' — ');
          if (dash > 0 && dash < 120) {
            name = text.slice(0, dash).trim();
            body = text.slice(dash + 3).trim();
          }
          if (name) curSection.features.push({ name, body: body ? [body] : [] });
          continue;
        }
        // Body bullet under the active H3 feature.
        curFeature.body.push('• ' + text);
        continue;
      }

      // Plain body text under current feature.
      if (curFeature && line.trim()) {
        const t = stripMd(line);
        if (t) curFeature.body.push(t);
      }
    }
    pushSection();
    return sections;
  }

  // ── FETCH ────────────────────────────────────────────────────
  async function fetchFeatures(url) {
    if (FEATURES_CACHE.has(url)) return FEATURES_CACHE.get(url);
    try {
      const r = await fetch(url, { cache: 'no-cache' });
      if (!r.ok) throw new Error('http ' + r.status);
      const md = await r.text();
      const parsed = parseFeatures(md);
      FEATURES_CACHE.set(url, parsed);
      return parsed;
    } catch (e) {
      FEATURES_CACHE.set(url, null);
      return null;
    }
  }

  // ── STYLES ───────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('chitti-features-css')) return;
    const css = document.createElement('style');
    css.id = 'chitti-features-css';
    css.textContent = `
      /* Floating CTA — visible on every page bottom-right */
      .chitti-features-cta {
        position: fixed; right: 18px; bottom: 18px; z-index: 9990;
        background: linear-gradient(135deg,#E86A17,#D4AF37);
        color: #fff; border: 0; border-radius: 999px;
        padding: 12px 18px; font: 700 14px/1.2 system-ui,-apple-system,sans-serif;
        box-shadow: 0 6px 18px rgba(232,106,23,.45);
        cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
      }
      .chitti-features-cta:hover, .chitti-features-cta:focus {
        outline: 3px solid #D4AF37; outline-offset: 3px;
        transform: translateY(-1px);
      }
      .chitti-features-cta .chitti-mini-logo {
        background: rgba(255,255,255,.25);
      }

      /* Compact button mirrored into the a11y bar */
      #chitti-features-bar-btn {
        background: rgba(255,255,255,.18) !important;
        border-color: rgba(255,255,255,.35) !important;
        font-weight: 700;
      }

      /* Modal */
      #chitti-features-modal {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(14,35,68,.78);
        display: flex; align-items: stretch; justify-content: center;
        padding: 20px; overflow-y: auto;
      }
      .chitti-features-card {
        background: #fff; color: #0E2344;
        border-radius: 16px; max-width: 720px; width: 100%;
        margin: auto;
        padding: 22px 22px 16px;
        box-shadow: 0 16px 48px rgba(0,0,0,.4);
        position: relative;
        font: 14px/1.55 system-ui,-apple-system,sans-serif;
      }
      .chitti-features-head {
        display: flex; align-items: center; gap: 10px;
        padding-bottom: 14px; border-bottom: 2px solid #FFE6CC;
        margin-bottom: 14px;
      }
      .chitti-features-head h2 {
        margin: 0; font-size: 20px; flex: 1; color: #0E2344;
      }
      .chitti-features-head h2 small {
        display: block; font-size: 12px; font-weight: 400; color: #6b7280;
      }
      .chitti-features-close {
        background: transparent; border: 0; font-size: 22px;
        cursor: pointer; color: #0E2344; padding: 4px 8px;
      }
      .chitti-features-actions {
        display: flex; gap: 8px; flex-wrap: wrap;
        margin-bottom: 14px;
      }
      .chitti-features-actions button {
        background: #FFF7E8; color: #0E2344;
        border: 1px solid #E86A17; border-radius: 8px;
        padding: 6px 12px; font: 600 12px system-ui,-apple-system,sans-serif;
        cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
      }
      .chitti-features-actions button:hover,
      .chitti-features-actions button:focus {
        background: #E86A17; color: #fff; outline: 2px solid #D4AF37;
      }

      .chitti-features-section {
        margin: 0 0 18px 0;
      }
      .chitti-features-section-title {
        display: flex; align-items: center; gap: 8px;
        font-weight: 800; font-size: 14px;
        color: #0E2344; margin-bottom: 8px;
      }
      .chitti-features-status {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 2px 8px; border-radius: 999px;
        font-size: 11px; font-weight: 700;
        color: #fff;
      }

      .chitti-features-list {
        list-style: none; margin: 0; padding: 0;
        display: grid; gap: 8px;
      }
      .chitti-features-item {
        background: #FAFAFA;
        border: 1px solid #E5E7EB;
        border-left: 4px solid #E86A17;
        border-radius: 8px;
        padding: 10px 12px;
        cursor: pointer;
        transition: transform .08s ease, border-color .08s ease;
      }
      .chitti-features-item:hover,
      .chitti-features-item:focus-within {
        border-color: #D4AF37; transform: translateX(2px);
        outline: none;
      }
      .chitti-features-item-head {
        display: flex; align-items: center; gap: 8px;
        font-weight: 700; color: #0E2344;
      }
      .chitti-features-item-name {
        flex: 1;
      }
      .chitti-features-item-speak {
        background: transparent; border: 0; font-size: 16px;
        cursor: pointer; color: #E86A17; padding: 0 4px;
      }
      .chitti-features-item-speak:focus,
      .chitti-features-item-speak:hover {
        outline: 2px solid #D4AF37; border-radius: 4px;
      }
      .chitti-features-item-body {
        margin-top: 6px; font-size: 13px; color: #374151;
        display: none;
      }
      .chitti-features-item.open .chitti-features-item-body {
        display: block;
      }
      .chitti-features-empty {
        background: #FFF7E8; border: 1px dashed #E86A17;
        border-radius: 10px; padding: 18px;
        text-align: center; color: #0E2344;
        font-size: 13px;
      }
      .chitti-features-empty strong { display: block; margin-bottom: 4px; }

      .chitti-features-foot {
        margin-top: 14px; padding-top: 12px;
        border-top: 1px solid #eee;
        font-size: 11px; color: #6b7280; text-align: center;
      }
      .chitti-features-foot a { color: #E86A17; text-decoration: underline; }

      body.chitti-braille .chitti-features-cta { font-size: 16px; }
      body.chitti-braille .chitti-features-item-name { font-size: 16px; }
    `;
    document.head.appendChild(css);
  }

  // ── BUTTON INJECTION ─────────────────────────────────────────
  function injectFloatingCTA() {
    if (document.getElementById('chitti-features-cta')) return;
    const btn = document.createElement('button');
    btn.id = 'chitti-features-cta';
    btn.className = 'chitti-features-cta';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-label', 'What can Chitti do for you? Open feature list');
    btn.innerHTML =
      '<span class="chitti-mini-logo" aria-hidden="true">C</span>' +
      '💡 What can Chitti do for you?';
    btn.addEventListener('click', () => openModal());
    document.body.appendChild(btn);
  }

  function injectBarButton() {
    // Mirror the CTA into the chitti_a11y bar so keyboard / screen-reader
    // users find it next to language + braille + ISL + read-page buttons.
    const bar = document.getElementById('chitti-a11y-bar');
    if (!bar || document.getElementById('chitti-features-bar-btn')) return;
    const speakBtn = bar.querySelector('#chitti-speak-page');
    const btn = document.createElement('button');
    btn.id = 'chitti-features-bar-btn';
    btn.type = 'button';
    btn.title = 'What can Chitti do for you?';
    btn.setAttribute('aria-label', 'What can Chitti do for you? Open feature list');
    btn.innerHTML = '💡 What can Chitti do?';
    btn.addEventListener('click', () => openModal());
    if (speakBtn) bar.insertBefore(btn, speakBtn);
    else bar.appendChild(btn);
  }

  // ── MODAL ────────────────────────────────────────────────────
  let LAST_FOCUS = null;

  async function openModal() {
    LAST_FOCUS = document.activeElement;
    const url = featuresUrl();
    const a11yState = loadA11yState();
    const lang = (a11yState.lang || 'en');
    const sections = url ? await fetchFeatures(url) : null;

    const old = document.getElementById('chitti-features-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'chitti-features-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'chitti-features-h2');
    document.body.appendChild(modal);

    const card = document.createElement('div');
    card.className = 'chitti-features-card';
    modal.appendChild(card);

    const titleText = 'What can Chitti do for you?';
    const subtitle = url
      ? 'Live from ' + url
      : 'No FEATURES.md mapped for this page yet';

    const head = document.createElement('div');
    head.className = 'chitti-features-head';
    head.innerHTML =
      '<span class="chitti-mini-logo" aria-hidden="true">C</span>' +
      '<h2 id="chitti-features-h2">' + escapeHtml(titleText) +
      '<small>' + escapeHtml(subtitle) + '</small></h2>';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'chitti-features-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', closeModal);
    head.appendChild(closeBtn);
    card.appendChild(head);

    const actions = document.createElement('div');
    actions.className = 'chitti-features-actions';
    const readAllBtn = document.createElement('button');
    readAllBtn.type = 'button';
    readAllBtn.setAttribute('aria-label', 'Read every feature aloud in your selected language');
    readAllBtn.innerHTML = '🔊 Read all features aloud';
    readAllBtn.addEventListener('click', () => readAll(sections, lang));
    actions.appendChild(readAllBtn);
    if (url) {
      const sourceLink = document.createElement('button');
      sourceLink.type = 'button';
      sourceLink.setAttribute('aria-label', 'Open the source FEATURES.md file in a new tab');
      sourceLink.innerHTML = '📄 View source FEATURES.md';
      sourceLink.addEventListener('click', () => window.open(url, '_blank', 'noopener'));
      actions.appendChild(sourceLink);
    }
    card.appendChild(actions);

    if (!sections || !sections.length) {
      const empty = document.createElement('div');
      empty.className = 'chitti-features-empty';
      empty.innerHTML =
        '<strong>Chitti is still mapping its features for this page.</strong>' +
        'Speak to Chitti and ask: <em>"What can you do for me?"</em>' +
        '<br/><br/>' +
        (url
          ? 'Source <code>' + escapeHtml(url) + '</code> is not available yet — ' +
            'a per-product <code>skills/FEATURES.md</code> ships per the LOCKED ' +
            'new-products process (SAHAYAI_MASTER §2a). Coming soon.'
          : 'No <code>skills/FEATURES.md</code> path is mapped for this page. ' +
            'Add <code>&lt;meta name="chitti-features" content="..."&gt;</code> ' +
            'to opt in.');
      card.appendChild(empty);
    } else {
      sections.forEach((sec) => {
        card.appendChild(renderSection(sec, lang));
      });
    }

    const foot = document.createElement('div');
    foot.className = 'chitti-features-foot';
    foot.innerHTML =
      'Source: <code>' + escapeHtml(url || '(none)') + '</code> · ' +
      'Per the locked new-products process, this list is rebuilt automatically when ' +
      'the FEATURES.md changes — nothing here is hardcoded in JavaScript.';
    card.appendChild(foot);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', escHandler);
    setTimeout(() => closeBtn.focus(), 30);

    // Auto-read for blind users on first visit.
    const persisted = loadState();
    const profile = a11yState.profile || {};
    const shouldAutoRead =
      profile.blind && !persisted.auto_read_done && sections && sections.length;
    if (shouldAutoRead) {
      persisted.auto_read_done = true;
      saveState(persisted);
      setTimeout(() => readAll(sections, lang), 400);
    }
  }

  function escHandler(e) {
    if (e.key === 'Escape') closeModal();
  }

  function closeModal() {
    const m = document.getElementById('chitti-features-modal');
    if (m) m.remove();
    document.removeEventListener('keydown', escHandler);
    cancelSpeech();
    if (LAST_FOCUS && typeof LAST_FOCUS.focus === 'function') {
      try { LAST_FOCUS.focus(); } catch (_) {}
    }
  }

  function renderSection(sec, lang) {
    const wrap = document.createElement('section');
    wrap.className = 'chitti-features-section';

    const badge = STATUS_BADGE[sec.status] || STATUS_BADGE.OTHER;
    const title = document.createElement('div');
    title.className = 'chitti-features-section-title';
    const badgeHtml = badge.label
      ? '<span class="chitti-features-status" style="background:' + badge.color + '">' +
        badge.emoji + ' ' + escapeHtml(badge.label) + '</span>'
      : '';
    title.innerHTML = badgeHtml + '<span>' + escapeHtml(sec.title) + '</span>';
    wrap.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'chitti-features-list';
    sec.features.forEach((f) => {
      list.appendChild(renderFeature(f, sec, lang));
    });
    wrap.appendChild(list);
    return wrap;
  }

  function renderFeature(f, sec, lang) {
    const li = document.createElement('li');
    li.className = 'chitti-features-item';
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'button');
    li.setAttribute('aria-expanded', 'false');

    const head = document.createElement('div');
    head.className = 'chitti-features-item-head';
    const name = document.createElement('span');
    name.className = 'chitti-features-item-name';
    name.textContent = f.name;
    head.appendChild(name);

    const speak = document.createElement('button');
    speak.type = 'button';
    speak.className = 'chitti-features-item-speak';
    speak.setAttribute('aria-label', 'Read this feature aloud — ' + f.name);
    speak.textContent = '🔊';
    speak.addEventListener('click', (e) => {
      e.stopPropagation();
      speakFeature(f, sec, lang);
    });
    head.appendChild(speak);

    li.appendChild(head);

    if (f.body && f.body.length) {
      const body = document.createElement('div');
      body.className = 'chitti-features-item-body';
      body.textContent = f.body.join(' ');
      li.appendChild(body);
    }

    const toggle = () => {
      const open = li.classList.toggle('open');
      li.setAttribute('aria-expanded', String(open));
      if (open) speakFeature(f, sec, lang);
    };
    li.addEventListener('click', toggle);
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
    return li;
  }

  // ── VOICE ────────────────────────────────────────────────────
  function speakText(text, lang) {
    if (!text) return;
    if (global.Chitti && global.Chitti.a11y && typeof global.Chitti.a11y.speak === 'function') {
      global.Chitti.a11y.speak(text, lang);
      return;
    }
    if (!global.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = bcpFor(lang);
    u.rate = 0.92;
    speechSynthesis.speak(u);
  }
  function cancelSpeech() {
    try { if (global.speechSynthesis) speechSynthesis.cancel(); } catch (_) {}
  }
  function bcpFor(code) {
    const map = { en: 'en-IN', hi: 'hi-IN', ur: 'ur-IN', bn: 'bn-IN',
      ta: 'ta-IN', te: 'te-IN', ml: 'ml-IN', kn: 'kn-IN',
      gu: 'gu-IN', mr: 'mr-IN', pa: 'pa-IN', or: 'or-IN', as: 'as-IN' };
    return map[code] || 'en-IN';
  }

  function speakFeature(f, sec, lang) {
    const badge = STATUS_BADGE[sec.status] || STATUS_BADGE.OTHER;
    const status = badge.label ? badge.label + '. ' : '';
    const body = (f.body && f.body.length) ? '. ' + f.body[0] : '';
    speakText(status + f.name + body, lang);
  }

  function readAll(sections, lang) {
    if (!sections || !sections.length) {
      speakText('Chitti is still mapping its features for this page.', lang);
      return;
    }
    cancelSpeech();
    // Build one long utterance so the browser keeps the playback queue
    // and the user can interrupt with the close button (which calls
    // cancelSpeech).
    const parts = [];
    parts.push('What can Chitti do for you. Reading features aloud.');
    sections.forEach((sec) => {
      const badge = STATUS_BADGE[sec.status] || STATUS_BADGE.OTHER;
      const status = badge.label || sec.title;
      parts.push(status + '. ' + sec.title + '.');
      sec.features.forEach((f) => parts.push(f.name + '.'));
    });
    parts.push('End of features list. Tap any feature to hear it in detail.');
    speakText(parts.join(' '), lang);
  }

  // ── UTILS ────────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── INIT ─────────────────────────────────────────────────────
  function init() {
    injectStyles();
    injectFloatingCTA();
    // Mirror the button into the a11y bar once it exists.
    if (document.getElementById('chitti-a11y-bar')) {
      injectBarButton();
    } else {
      // a11y bar is injected on chitti_a11y.init(); watch for it.
      const obs = new MutationObserver(() => {
        if (document.getElementById('chitti-a11y-bar')) {
          injectBarButton();
          obs.disconnect();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      // Stop the observer after 10s — if the bar hasn't appeared by
      // then, the floating CTA still works on its own.
      setTimeout(() => obs.disconnect(), 10000);
    }
  }

  // Public API for pages that want programmatic control.
  global.Chitti = global.Chitti || {};
  global.Chitti.features = {
    init,
    open: openModal,
    close: closeModal,
    fetch: fetchFeatures,
    parse: parseFeatures,
    featuresUrl,
    PAGE_TO_FOLDER,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
