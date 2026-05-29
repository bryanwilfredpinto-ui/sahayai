/* tools/audit_per_chitti.mjs — Sire's audit, rebuilt clean. */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'https://sahayai.in';
const LANG = 'bn';
const OUT  = 'tools/audit_out';
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: 'Vaani',         url: '/chitti_vaani.html'              },
  { name: 'MedUPI',        url: '/chitti_medupi.html'             },
  { name: 'CA',            url: '/chitti_ca.html'                 },
  { name: 'Legal',         url: '/chitti_legal.html'              },
  { name: 'Government',    url: '/chitti_government.html'         },
  { name: 'News',          url: '/chitti_news.html'               },
  { name: 'News AI',       url: '/chitti_news_ai.html'            },
  { name: 'UPI',           url: '/chitti_upi.html'                },
  { name: 'Scanner',       url: '/chitti_scanner.html'            },
  { name: 'Shares Tech',   url: '/chitti_complete_technical.html' },
  { name: 'Shares Fund',   url: '/chitti_fundamentals.html'       },
  { name: 'Voice Factory', url: '/chitti_voice_factory.html'      },
  { name: '2-Wheeler',     url: '/chitti_2wheeler.html'           },
  { name: '4-Wheeler',     url: '/chitti_4wheeler.html'           },
  { name: 'Logo & Video',  url: '/chitti_logo_video.html'         },
  { name: 'Fashion',       url: '/chitti_fashion.html'            },
  { name: 'Health File',   url: '/chitti_health_file.html'        },
  { name: 'ISL',           url: '/chitti_isl.html'                },
];

// This runs INSIDE the page via page.evaluate(audit)
function audit() {
  const SKIP = new Set(['PDF','QR','UPI','GST','RBI','SEBI','API','HTML','CSS','LIVE','HD','AI','YouTube','WhatsApp','Chitti','Vaani','MedUPI','SMS','NSE','BSE']);
  function isLatin(s) {
    if (!s) return false;
    const t = s.replace(/\s+/g,' ').trim();
    if (t.length < 3) return false;
    if (SKIP.has(t)) return false;
    const latin = (t.match(/[A-Za-z]/g) || []).length;
    return latin >= 3;
  }
  const SEL = [
    '.pro-card','.scan-action','.feature-card','.action-card','[data-chitti-card]',
    '.scheme-card','.act-card','.kv-card','.cat-card','.med-card',
    '.art-card','.section-card','.rule-card','.sample-card',
    '.cap-card','.course-card',
    '.cv-card','.ind-card','.insight-card','.learn-card','.metric-card',
    '.scan-card','.coming-soon-card',
    '.sds-card','.sds-health-card','.mb-soon-card','.mc-soon-card',
    '.platform-tile','.fa-tile','.na-cert-card','.try-card','.success-card-preview'
  ].join(', ');
  const seen = new Set();
  const cards = [];
  document.querySelectorAll(SEL).forEach(el => {
    if (seen.has(el)) return;
    // skip if any ancestor already counted
    let a = el.parentElement;
    while (a && a !== document.body) {
      if (seen.has(a)) return;
      a = a.parentElement;
    }
    const lbl = el.querySelector('.lbl, .label, .name, .title, h1, h2, h3, h4, h5, h6');
    if (!lbl) return;
    const labelText = (lbl.textContent || '').replace(/\s+/g,' ').trim();
    if (!labelText || labelText.length < 2) return;
    const html = el.innerHTML || '';
    seen.add(el);
    cards.push({
      label: labelText.slice(0, 60),
      isLatin: isLatin(labelText),
      hasSpeaker:   /🔊/.test(html),
      hasChitti:    /🤖/.test(html),
      hasThumbUp:   /👍/.test(html),
      hasThumbDown: /👎/.test(html),
      hasPencil:    /✏️/.test(html) || /🎙️/.test(html),
    });
  });
  cards.forEach(c => {
    c.widgetCount = (c.hasSpeaker?1:0)+(c.hasChitti?1:0)+(c.hasThumbUp?1:0)+(c.hasThumbDown?1:0)+(c.hasPencil?1:0);
  });
  return {
    cards: cards.slice(0, 30),
    total: cards.length,
    docLang: document.documentElement.lang || 'en',
    hasLangSelect: !!document.querySelector('select#lang-select, select#lang, select[aria-label="Language"]'),
    hasLangRuntime: !!(window.Chitti && window.Chitti.langRuntime),
    hasCardWidget: !!(window.Chitti && window.Chitti.cardWidget),
  };
}

async function auditPage(browser, p) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  try {
    const url = BASE + p.url + '?cb=' + Date.now();
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!resp || resp.status() >= 400) {
      await ctx.close();
      return { ...p, error: 'HTTP ' + (resp ? resp.status() : 'no-response') };
    }
    await page.waitForTimeout(4000);
    const en = await page.evaluate(audit);
    if (!en.hasLangSelect) {
      await ctx.close();
      return { ...p, en, bn: null, error: 'no lang selector' };
    }
    await page.selectOption('select#lang-select, select#lang, select[aria-label="Language"]', LANG);
    await page.waitForTimeout(12000);
    const bn = await page.evaluate(audit);
    await page.screenshot({ path: `${OUT}/${p.name.replace(/\W+/g,'_')}_bn.png`, fullPage: false });
    await ctx.close();
    return { ...p, en, bn };
  } catch (e) {
    await ctx.close();
    return { ...p, error: e.message.slice(0, 150) };
  }
}

function md(rows) {
  let out = '';
  out += '# 🎖️ CTO CHITTI AUDIT — 2026-05-29 (per Chitti, per box)\n\n';
  out += '**World Class. Commando Discipline. Zero Excuses.**\n\n';
  out += '> This Chitti is someone’s lifeline. Build it like your family depends on it. Because someone’s family does.\n\n';
  out += 'Test: each page loaded headless against `' + BASE + '`, cache-busted, switched to Bengali, 12s wait.\n\n';
  out += '## Verdict legend\n';
  out += '- ✅ CLOSED — translates to Bengali AND has all 5 widget icons\n';
  out += '- 🟡 PARTIAL — translation OR widget missing on some cards\n';
  out += '- 🔴 OPEN — neither translation nor widget on any card\n';
  out += '- ⚪ NO CARDS — page has no action-card-pattern elements\n\n';
  out += '## Per-Chitti summary\n\n';
  out += '| Chitti | Cards | Translated | Widget complete (5 icons) | Overall |\n';
  out += '|--------|-------|------------|---------------------------|--------|\n';
  for (const r of rows) {
    if (r.error) { out += '| ' + r.name + ' | — | — | — | 🔴 ' + r.error + ' |\n'; continue; }
    const enC = r.en?.cards || [];
    const bnC = r.bn?.cards || [];
    let tr = 0, wf = 0;
    for (let i=0; i<enC.length; i++) {
      const b = bnC[i];
      if (b && !b.isLatin) tr++;
      if (b && b.widgetCount === 5) wf++;
    }
    const N = enC.length;
    const tPct = N ? Math.round(100*tr/N) : 0;
    const wPct = N ? Math.round(100*wf/N) : 0;
    const overall = N === 0 ? '⚪ NO CARDS'
                  : (tr === N && wf === N) ? '✅ CLOSED'
                  : (tr === 0 && wf === 0) ? '🔴 OPEN'
                  : '🟡 PARTIAL';
    out += '| ' + r.name + ' | ' + N + ' | ' + tr + '/' + N + ' (' + tPct + '%) | ' + wf + '/' + N + ' (' + wPct + '%) | ' + overall + ' |\n';
  }
  out += '\n---\n\n## Per-card detail\n\n';
  for (const r of rows) {
    if (r.error) { out += '### ' + r.name + '\n\n_Error: ' + r.error + '_\n\n'; continue; }
    out += '### ' + r.name + '\n\n';
    const enC = r.en?.cards || [];
    const bnC = r.bn?.cards || [];
    if (enC.length === 0) { out += '_No action-card-pattern elements detected._\n\n'; continue; }
    out += '| # | English label | Bengali label | Translated | 🔊 | 🤖 | 👍 | 👎 | ✏️🎙️ |\n';
    out += '|---|---------------|---------------|:---:|:--:|:--:|:--:|:--:|:--:|\n';
    enC.forEach((c, i) => {
      const b = bnC[i] || {};
      const tr = (b.isLatin === false) ? '✅' : (b.isLatin === true ? '🔴' : '—');
      const wic = w => w ? '✅' : '🔴';
      const esc = s => (s || '').replace(/\|/g,'\\|');
      out += '| ' + (i+1) + ' | ' + esc(c.label) + ' | ' + esc(b.label) + ' | ' + tr + ' | ' + wic(b.hasSpeaker) + ' | ' + wic(b.hasChitti) + ' | ' + wic(b.hasThumbUp) + ' | ' + wic(b.hasThumbDown) + ' | ' + wic(b.hasPencil) + ' |\n';
    });
    out += '\n';
  }
  out += '---\n\n> **World Class Chitti CTO — Commando Discipline. Zero Excuses.**\n';
  return out;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const all = [];
  for (const p of PAGES) {
    console.log('Auditing', p.name);
    all.push(await auditPage(browser, p));
  }
  await browser.close();
  writeFileSync(OUT + '/raw.json', JSON.stringify(all, null, 2));
  writeFileSync('CTO_CHITTI_AUDIT_2026-05-29.md', md(all));
  console.log('Done. CTO_CHITTI_AUDIT_2026-05-29.md');
})();
