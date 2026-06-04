/* chitti_fashion_coach.js — Fashion Career Coach. Deterministic (no LLM): maps a
   user's goal to a curated ladder of REAL free / low-cost courses, certifications,
   tools and a first step. Resources are real, well-known, and cost-tagged honestly.
   Built for our users: Tier-2/3, budget-first, four-user accessible. v20260604 */
(function () {
  'use strict';
  // cost tags: FREE · AUDIT (free to learn, pay only for cert) · GOVT (free, Indian govt) · LOW (low-cost ₹)
  var R = {
    // shared building blocks (real resources)
    colour: { t: 'Colour theory & matching', p: 'YouTube — Justine Leconte', cost: 'FREE', url: 'https://youtube.com/@JustineLeconte' },
    fashionAsDesign: { t: 'Fashion as Design', p: 'Coursera · MoMA', cost: 'AUDIT', url: 'https://www.coursera.org/learn/fashion-design' },
    alisonFashion: { t: 'Fashion & Image styling (free certificate)', p: 'Alison', cost: 'FREE', url: 'https://alison.com/courses/fashion' },
    nsdc: { t: 'Fashion / Apparel skilling + certificate', p: 'Skill India Digital (Govt)', cost: 'GOVT', url: 'https://www.skillindiadigital.gov.in' },
    swayam: { t: 'Design & textiles courses', p: 'SWAYAM / NPTEL (Govt)', cost: 'GOVT', url: 'https://swayam.gov.in' },
    canva: { t: 'Canva Design School + free design tool', p: 'Canva', cost: 'FREE', url: 'https://www.canva.com/learn/' },
    sewing: { t: 'Sewing & alterations basics', p: 'YouTube — Made to Sew / WithWendy', cost: 'FREE', url: 'https://youtube.com/@WithWendy' },
    pattern: { t: 'Pattern-making fundamentals', p: 'YouTube + Alison', cost: 'FREE', url: 'https://alison.com/courses/pattern-making' },
    googleDM: { t: 'Digital marketing fundamentals (cert)', p: 'Google Digital Garage', cost: 'FREE', url: 'https://learndigital.withgoogle.com' },
    metaBlueprint: { t: 'Social media / content (free certs)', p: 'Meta Blueprint', cost: 'FREE', url: 'https://www.facebook.com/business/learn' },
    photography: { t: 'Phone product photography', p: 'YouTube + Canva guides', cost: 'FREE', url: 'https://www.canva.com/learn/product-photography/' },
    meeshoSell: { t: 'Sell online (no GST needed to start)', p: 'Meesho / Flipkart Samarth seller academy', cost: 'FREE', url: 'https://supplier.meesho.com' },
    gst: { t: 'GST + small-business basics', p: 'Skill India + ClearTax free guides', cost: 'GOVT', url: 'https://www.skillindiadigital.gov.in' },
    sustainable: { t: 'Sustainable & thrift styling', p: 'Coursera (audit) + YouTube', cost: 'AUDIT', url: 'https://www.coursera.org/courses?query=sustainable%20fashion' },
    udemyLow: { t: 'Fashion styling masterclass', p: 'Udemy (watch for ₹ sales)', cost: 'LOW', url: 'https://www.udemy.com/courses/search/?q=fashion%20styling' },
    aiTools: { t: 'AI for design (image + ideas)', p: 'Canva Magic / free AI tools', cost: 'FREE', url: 'https://www.canva.com/ai-image-generator/' },
  };
  function step(skills, courses, certs, tools, first) { return { skills: skills, courses: courses, certs: certs, tools: tools, first: first }; }
  var ROLES = [
    { id: 'stylist', emoji: '💅', en: 'Personal stylist', plan: step(
      ['Colour & contrast', 'Body proportion (garment terms)', 'Occasion dressing', 'Capsule wardrobe'],
      [R.colour, R.fashionAsDesign, R.alisonFashion], [R.alisonFashion, R.nsdc], [R.canva, R.aiTools],
      'startBuildBook') },
    { id: 'tailor', emoji: '✂️', en: 'Tailor / boutique', plan: step(
      ['Pattern-making', 'Alterations & fit', 'Customer styling', 'Sell online'],
      [R.pattern, R.sewing, R.nsdc], [R.nsdc, R.alisonFashion], [R.canva, R.meeshoSell],
      'startBoutique') },
    { id: 'student', emoji: '🎓', en: 'Fashion student', plan: step(
      ['Design fundamentals', 'Sketching & portfolio', 'Textiles', 'Software'],
      [R.fashionAsDesign, R.swayam, R.canva], [R.swayam, R.alisonFashion], [R.canva, R.aiTools],
      'startPortfolio') },
    { id: 'creator', emoji: '📸', en: 'Content creator', plan: step(
      ['Phone photography', 'Content & captions', 'Social growth', 'Personal brand'],
      [R.photography, R.metaBlueprint, R.googleDM], [R.metaBlueprint, R.googleDM], [R.canva, R.aiTools],
      'startContent') },
    { id: 'reseller', emoji: '🛍️', en: 'Reseller / thrift', plan: step(
      ['Sourcing & pricing', 'Product photography', 'Sell online', 'Sustainable styling'],
      [R.meeshoSell, R.photography, R.sustainable], [R.googleDM, R.nsdc], [R.canva, R.meeshoSell],
      'startReselling') },
    { id: 'home', emoji: '🏠', en: 'Earn from home', plan: step(
      ['One sellable skill', 'Sell online (no shop)', 'Pricing & basics', 'WhatsApp orders'],
      [R.sewing, R.meeshoSell, R.gst], [R.nsdc, R.alisonFashion], [R.canva, R.meeshoSell],
      'startHome') },
  ];
  var CH = {
    en: { title: 'Become a fashion pro — free / low-cost', pick: 'Pick your goal:', skills: 'Skills to build', courses: 'Learn (free / low-cost)', certs: 'Free / govt certificates', tools: 'Free tools', first: 'Your first step this week', cost: { FREE: 'FREE', AUDIT: 'FREE to learn', GOVT: 'GOVT · FREE', LOW: 'LOW ₹' }, open: 'Open →',
      startBuildBook: 'Style 1 friend for free, photograph the before/after, start a small portfolio.', startBoutique: 'List 5 of your stitched pieces on Meesho with clean phone photos.', startPortfolio: 'Make a 5-page Canva portfolio of your sketches this week.', startContent: 'Post 3 outfit reels using clothes you already own.', startReselling: 'Photograph 10 items on a plain wall and list them online.', startHome: 'Pick ONE skill, finish one free Alison course, take 5 orders on WhatsApp.' },
    hi: { title: 'फैशन प्रो बनें — मुफ़्त / कम खर्च', pick: 'अपना लक्ष्य चुनें:', skills: 'सीखने योग्य कौशल', courses: 'सीखें (मुफ़्त / कम खर्च)', certs: 'मुफ़्त / सरकारी प्रमाणपत्र', tools: 'मुफ़्त औज़ार', first: 'इस हफ़्ते आपका पहला क़दम', cost: { FREE: 'मुफ़्त', AUDIT: 'सीखना मुफ़्त', GOVT: 'सरकारी · मुफ़्त', LOW: 'कम ₹' }, open: 'खोलें →',
      startBuildBook: 'एक दोस्त को मुफ़्त style करें, before/after फ़ोटो लें, छोटा portfolio शुरू करें।', startBoutique: 'अपने सिले 5 कपड़े साफ़ फ़ोटो के साथ Meesho पर डालें।', startPortfolio: 'इस हफ़्ते अपने sketches का 5-पेज Canva portfolio बनाएं।', startContent: 'अपने मौजूदा कपड़ों से 3 outfit reels पोस्ट करें।', startReselling: '10 चीज़ें सादी दीवार पर फ़ोटो लेकर online डालें।', startHome: 'एक कौशल चुनें, एक मुफ़्त Alison कोर्स पूरा करें, WhatsApp पर 5 ऑर्डर लें।' },
  };
  function L() { try { return localStorage.getItem('chitti_vaani_lang') || 'hi'; } catch (e) { return 'hi'; } }
  function ch(k, lang) { lang = lang || L(); var b = CH[lang] || CH.en; return (b[k] != null ? b[k] : CH.en[k]); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function roleName(role, lang) { return role['en']; } // role names kept English (proper-noun-ish); emoji carries meaning

  function renderRoles(hostId, onPick) {
    var host = document.getElementById(hostId); if (!host) return;
    host.innerHTML = '<div style="font-size:13.5px;font-weight:800;color:#000080;margin-bottom:8px">' + esc(ch('pick')) + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
      ROLES.map(function (r) { return '<button class="fa-chip" style="flex-direction:column;min-height:78px;display:flex;align-items:center;justify-content:center;gap:4px" data-role="' + r.id + '"><span style="font-size:26px">' + r.emoji + '</span><span style="font-size:11px;font-weight:800">' + esc(r.en) + '</span></button>'; }).join('') +
      '</div><div id="fa-coach-plan" class="fa-result"></div>';
    host.querySelectorAll('[data-role]').forEach(function (b) { b.addEventListener('click', function () { onPick(b.getAttribute('data-role')); }); });
  }
  function resLine(item, lang) {
    var tag = ch('cost', lang)[item.cost] || item.cost;
    var col = item.cost === 'LOW' ? '#b45309' : '#138808';
    return '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;padding:6px 0;border-bottom:1px dashed #eee">' +
      '<div style="font-size:13px"><b>' + esc(item.t) + '</b><div style="font-size:11px;color:#777">' + esc(item.p) + '</div></div>' +
      '<div style="text-align:right;white-space:nowrap"><span style="font-size:10px;font-weight:900;color:' + col + '">' + esc(tag) + '</span>' +
      (item.url ? ' · <a href="' + item.url + '" target="_blank" rel="noopener" style="font-size:11px;color:#000080;font-weight:800">' + esc(ch('open', lang)) + '</a>' : '') + '</div></div>';
  }
  function section(title, items, lang) { return '<div style="margin-top:10px"><div style="font-weight:900;color:#000080;font-size:13.5px">' + esc(title) + '</div>' + items.map(function (i) { return resLine(i, lang); }).join('') + '</div>'; }
  function renderPlan(role, hostId, lang) {
    lang = lang || L();
    var r = ROLES.filter(function (x) { return x.id === role; })[0]; if (!r) return '';
    var p = r.plan;
    var skills = '<div style="margin-top:8px"><div style="font-weight:900;color:#000080;font-size:13.5px">' + esc(ch('skills', lang)) + '</div><div style="font-size:13px;color:#444;margin-top:4px">' + p.skills.map(esc).join(' · ') + '</div></div>';
    var first = '<div class="fa-tier free" style="margin-top:10px"><span class="lab">🚀 ' + esc(ch('first', lang)) + '</span><div>' + esc(ch(p.first, lang)) + '</div></div>';
    var html = '<div class="sds-card" style="margin-top:10px"><div style="font-weight:900;color:#000080;font-size:15px">' + r.emoji + ' ' + esc(r.en) + '</div>' +
      skills + section(ch('courses', lang), p.courses, lang) + section(ch('certs', lang), p.certs, lang) + section(ch('tools', lang), p.tools, lang) + first + '</div>';
    var host = document.getElementById(hostId); if (host) { host.innerHTML = html; }
    return html;
  }
  function spoken(role, lang) { var r = ROLES.filter(function (x) { return x.id === role; })[0]; if (!r) return ''; return r.en + '. ' + ch('first', lang).replace(/^[^:]*:?/, '') ; }
  window.FashionCoach = { roles: ROLES, renderRoles: renderRoles, renderPlan: renderPlan, ch: ch, spoken: function (role, lang) { var r = ROLES.filter(function (x) { return x.id === role; })[0]; return r ? (r.en + ' — ' + ch(r.plan.first, lang)) : ''; } };
})();
