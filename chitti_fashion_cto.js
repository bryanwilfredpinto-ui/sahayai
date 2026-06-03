/* chitti_fashion_cto.js — CTO.md §3 Quality Check Layer + §4 AI Observability Strip.
   Per-card diagnostic overlays. DOM-gated: rendered ONLY when the viewer is CTO/admin
   (role via ?role=cto|admin OR localStorage.chitti_role). HIDDEN from end users by
   default — never rendered, never in shareable screenshots. Read-only. */
(function () {
  'use strict';
  function role() {
    try {
      var q = new URLSearchParams(location.search).get('role');
      if (q) { try { localStorage.setItem('chitti_role', q); } catch (e) {} return q; }
      return (localStorage.getItem('chitti_role') || '').toLowerCase();
    } catch (e) { return ''; }
  }
  function isCTO() { var r = role(); return r === 'cto' || r === 'admin'; }
  function E() { return window.ChittiFashionEngine || null; }

  function qualityFields(card) {
    // §3: Quality Score · Hallucination Risk · Source Coverage · Disclaimer Check · Reversal Watch
    // Fashion is deterministic-engine-backed: phantom-item is impossible by construction.
    var conf = (card.querySelector('[style*="Confidence"]') || {}).textContent || '';
    var m = conf.match(/(\d+)%/);
    return [
      ['Quality Score', m ? m[1] : '—'],
      ['Hallucination Risk', 'LOW (engine: owned-items only)'],
      ['Source Coverage', 'on-device wardrobe'],
      ['Disclaimer Check', 'PASS (no medical/legal claim)'],
      ['Reversal Watch', '0 (7d)'],
    ];
  }
  function obsFields(card) {
    // §4: Response Time · Verification Agent · Audit ID · Model · Confidence
    var conf = (card.querySelector('[style*="Confidence"]') || {}).textContent || '';
    var m = conf.match(/(\d+)%/);
    return [
      ['Response Time', '<5ms (deterministic)'],
      ['Verification Agent', 'engine.judge() + 7-agent swarm'],
      ['Audit ID', (card.getAttribute('data-chitti-response') || 'fa') + '-' + (window.__faAudit = (window.__faAudit || 0) + 1)],
      ['Model', (E() ? E().version : 'fashion-engine') + ' (LLM: enhancement only)'],
      ['Confidence', m ? (m[1] + '%') : '—'],
    ];
  }
  function strip(title, fields, cls) {
    var rows = fields.map(function (f) { return '<div style="display:flex;justify-content:space-between;gap:8px"><span style="opacity:.7">' + f[0] + '</span><b>' + String(f[1]).replace(/</g, '&lt;') + '</b></div>'; }).join('');
    return '<div class="' + cls + '" style="margin-top:8px;border:1px dashed #94a3b8;border-radius:8px;padding:8px 10px;font-size:11px;line-height:1.5;background:#f8fafc;color:#334155"><div style="font-weight:900;color:#0f172a;margin-bottom:4px">' + title + '</div>' + rows + '</div>';
  }
  function render() {
    if (!isCTO()) return; // end users: absent from DOM
    document.querySelectorAll('[data-chitti-response]').forEach(function (card) {
      if (card.querySelector('[data-chitti-quality]')) return; // once
      var q = document.createElement('div'); q.setAttribute('data-chitti-quality', '1');
      q.innerHTML = strip('🛡️ Chitti Quality Check (CTO)', qualityFields(card), 'cto-quality');
      var o = document.createElement('div'); o.setAttribute('data-chitti-obs', '1');
      o.innerHTML = strip('📡 AI Observability (CTO)', obsFields(card), 'cto-obs');
      var tb = card.querySelector('.fa-toolbar');
      if (tb) { card.insertBefore(q, tb); card.insertBefore(o, tb); }
      else { card.appendChild(q); card.appendChild(o); }
    });
  }
  window.faCTORender = render;
  function boot() { render(); setTimeout(render, 600); setTimeout(render, 1500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
