/* chitti_fashion_app.js — Chitti Fashion controller (BO0 extract 2026-06-06).
   The tested fa* controller (QA 50/50) lifted verbatim from the old inline <script>
   so the rebuilt-from-scratch chitti_fashion.html shell can load it as a module.
   Language is now Vaani-canonical: chitti_lang.js owns #lang-select; we listen to chitti:langchange. */
/* ════════════════════════════════════════════════════════════════════════
   Chitti Fashion — CFOS v1.0 client. Spec: chitti-fashion/PRD.md + ARCHITECTURE.md
   - Reasoning: DeepSeek via chitti-vaani-api /api/vaani/ask (mode=ask)
   - Wardrobe: IndexedDB on-device only; only TEXT descriptions leave the device
   - Swarm: one round-trip returns 7 agent scores + teach + tiers (JSON)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const API_BASE = 'https://chitti-vaani-api-production.up.railway.app';
const LANGS = ['hi','en','bn','ta','te','mr','gu','kn','ml'];
let CURRENT_LANG = 'hi';
const PROFILE_KEY = 'chitti_fashion_profile_v1';
let PROFILE = (function(){ try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch(e){ return {}; } })();

/* ---------- language ---------- */
function faDetectLang(){
  try {
    if (window.Chitti && Chitti.a11y && Chitti.a11y.lang && Chitti.a11y.lang.current) return Chitti.a11y.lang.current;
  } catch(e){}
  if (PROFILE.lang && LANGS.includes(PROFILE.lang)) return PROFILE.lang;
  const n = (navigator.language || 'hi').split('-')[0];
  return LANGS.includes(n) ? n : 'hi';
}
function faChangeLang(v){
  CURRENT_LANG = LANGS.includes(v) ? v : 'en'; // cousins -> English baseline (locked policy); voice-out stays in-language
  PROFILE.lang = CURRENT_LANG; faSaveProfile();
  document.documentElement.lang = CURRENT_LANG;
  try { localStorage.setItem('chitti_vaani_lang', CURRENT_LANG); } catch(e){}
  // self-contained guarded i18n (never shows a raw key); platform translator as secondary
  try { if (typeof window.faI18nApply === 'function') window.faI18nApply(CURRENT_LANG); } catch(e){}
  try { if (typeof window.updateAllStrings === 'function') window.updateAllStrings(CURRENT_LANG); } catch(e){}
  try { if (typeof window.faI18nGuard === 'function') setTimeout(window.faI18nGuard, 60); } catch(e){}
  // NOTE: do NOT dispatch chitti:langchange here — chitti_lang.js owns #lang-select and
  // dispatches it on change (Vaani-canonical); we are the LISTENER (see faWireLangVaani).
  try { if (window.Chitti && Chitti.a11y && Chitti.a11y.setLang) Chitti.a11y.setLang(CURRENT_LANG); } catch(e){}
  // re-render dynamic sections in the new language
  try { faRenderWearers(); faRenderTwin(); } catch(e){}
}
function faSaveProfile(){ try { localStorage.setItem(PROFILE_KEY, JSON.stringify(PROFILE)); } catch(e){} }

/* ---------- speech ---------- */
function faSpeak(text){
  if (!text) return;
  try {
    if (window.Chitti && Chitti.a11y && typeof Chitti.a11y.speak === 'function') { Chitti.a11y.speak(text, CURRENT_LANG); return; }
    if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(text); u.lang = (CURRENT_LANG === 'en' ? 'en-IN' : CURRENT_LANG + '-IN'); speechSynthesis.speak(u); }
  } catch(e){}
}
function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function faLastText(hostId){ const h = document.getElementById(hostId); return h ? (h.dataset.spoken || h.textContent || '').trim() : ''; }

/* ---------- onboarding ---------- */
function faSetGender(g, btn){
  PROFILE.gender = g; faSaveProfile();
  document.querySelectorAll('#fa-onboard .opts button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  setTimeout(() => { const o = document.getElementById('fa-onboard'); if (o) o.style.display = 'none'; }, 350);
}
function faMaybeOnboard(){
  if (!PROFILE.gender) { const o = document.getElementById('fa-onboard'); if (o) o.style.display = 'block'; }
}

/* ---------- tabs ---------- */
function faTab(name, btn){
  document.querySelectorAll('.fa-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('fa-panel-' + name); if (panel) panel.classList.add('active');
  document.querySelectorAll('.fa-tabbar button').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
  if (btn) { btn.classList.add('active'); btn.setAttribute('aria-selected', 'true'); }
  // lazy-init the CFOS v2.1 cards when their tab opens
  try {
    if (name === 'more') { faDoctorInit(); faWeekInit(); }
    if (name === 'occasion') faWeddingInit();
    if (name === 'family') { faModeInit(); faFamilyInit(); faSizeInit(); }
  } catch(e){}
}

/* ════════ WARDROBE — IndexedDB (on-device only) ════════ */
const DB_NAME = 'chitti_fashion_almari', STORE = 'items';
let _db = null;
function faDB(){
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }); };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}
async function faAllItemsRaw(){
  try {
    const db = await faDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      tx.onsuccess = () => resolve(tx.result || []); tx.onerror = () => reject(tx.error);
    });
  } catch(e){ return []; }
}
/* Family Mode: items carry a `wearer` id; faAllItems() returns the active wearer's items.
   Legacy items with no wearer belong to the default 'me' wearer. */
async function faAllItems(){
  const all = await faAllItemsRaw();
  const w = faCurrentWearer();
  return all.filter(i => (i.wearer || 'me') === w);
}
async function faPutItem(item){ const db = await faDB(); return new Promise((res, rej) => { const tx = db.transaction(STORE, 'readwrite').objectStore(STORE).put(item); tx.onsuccess = () => res(); tx.onerror = () => rej(tx.error); }); }
async function faDelItem(id){ const db = await faDB(); return new Promise((res, rej) => { const tx = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id); tx.onsuccess = () => res(); tx.onerror = () => rej(tx.error); }); }

/* add modal */
let _pendingPhoto = null, _pendingColour = '';
function faOpenAdd(){ _pendingPhoto = null; _pendingColour = '';
  document.getElementById('fa-add-preview').textContent = '👗';
  document.getElementById('fa-add-colour').value = '';
  document.querySelectorAll('#fa-add-occasions .fa-chip').forEach(c => c.classList.remove('on'));
  document.getElementById('fa-add').classList.add('shown');
}
function faCloseAdd(){ document.getElementById('fa-add').classList.remove('shown'); }
document.addEventListener('change', function(e){
  if (e.target && e.target.id === 'fa-add-file') faReadPhoto(e.target.files[0]);
});
document.addEventListener('click', function(e){
  if (e.target && e.target.classList.contains('fa-chip') && e.target.closest('#fa-add-occasions')) e.target.classList.toggle('on');
});
function faReadPhoto(file){
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      // downscale to ~480 long-side for on-device storage
      const canvas = document.getElementById('fa-cam-canvas');
      const scale = Math.min(480 / Math.max(img.width, img.height), 1);
      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      _pendingPhoto = canvas.toDataURL('image/jpeg', 0.8);
      _pendingColour = faDetectColour(ctx, canvas.width, canvas.height);
      document.getElementById('fa-add-preview').innerHTML = '<img alt="preview" src="' + _pendingPhoto + '">';
      const cInput = document.getElementById('fa-add-colour'); if (!cInput.value) cInput.value = _pendingColour;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
let _pendingHex = '';
function faRgbHex(r,g,b){ const h=x=>('0'+x.toString(16)).slice(-2); return '#'+h(r)+h(g)+h(b); }
function faDetectColour(ctx, w, h){
  try {
    const sx = Math.floor(w/2 - 20), sy = Math.floor(h/2 - 20);
    const d = ctx.getImageData(Math.max(0,sx), Math.max(0,sy), 40, 40).data;
    let r=0,g=0,b=0,n=0; for (let i=0;i<d.length;i+=4){ r+=d[i]; g+=d[i+1]; b+=d[i+2]; n++; }
    r=Math.round(r/n); g=Math.round(g/n); b=Math.round(b/n);
    _pendingHex = faRgbHex(r,g,b);   // REAL colour for the engine's colour science
    return faColourName(r,g,b);
  } catch(e){ _pendingHex=''; return ''; }
}
function faColourName(r,g,b){
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  if (max-min < 28){ if (max>200) return 'सफ़ेद'; if (max<60) return 'काला'; return 'ग्रे'; }
  if (r>g && r>b) return (g>120?'नारंगी':'लाल');
  if (g>r && g>b) return 'हरा';
  if (b>r && b>g) return 'नीला';
  if (r>150 && g>120 && b<100) return 'पीला';
  return 'mixed';
}
async function faSaveItem(){
  const occ = Array.from(document.querySelectorAll('#fa-add-occasions .fa-chip.on')).map(c => c.dataset.occ);
  const fabricEl = document.getElementById('fa-add-fabric'), patternEl = document.getElementById('fa-add-pattern'), costEl = document.getElementById('fa-add-cost');
  const item = {
    id: (crypto.randomUUID ? crypto.randomUUID() : 'it-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7)),
    photo: _pendingPhoto || '',
    category: document.getElementById('fa-add-cat').value,
    colour: (document.getElementById('fa-add-colour').value || _pendingColour || '').trim(),
    hex: _pendingHex || '',                          // real colour for colour-science (gap P0#2)
    fabric: fabricEl ? fabricEl.value : '',           // fabric/season (gap P0#4)
    pattern: patternEl ? patternEl.value : 'solid',   // pattern-mixing (gap P0#4)
    cost: costEl ? (parseInt(costEl.value||'0',10)||0) : 0,  // cost-per-wear (sustainability)
    wears: 0,
    occasions: occ.length ? occ : ['casual'],
    last_worn: null,
    wearer: faCurrentWearer(),
    added_at: new Date().toISOString()
  };
  await faPutItem(item);
  faCloseAdd();
  faRenderWardrobe();
  try { faRenderTwin(); } catch(e){}
  faSpeak(CURRENT_LANG === 'en' ? 'Added to your wardrobe' : 'अलमारी में जोड़ दिया');
}
async function faRenderWardrobe(){
  const items = await faAllItems();
  const cnt = { top:0, bottom:0, outfit:0, footwear:0, jewellery:0, other:0 };
  items.forEach(i => { if (cnt[i.category] != null) cnt[i.category]++; else if (i.category==='dupatta'||i.category==='bag') cnt.other++; });
  document.getElementById('fa-n-top').textContent = cnt.top;
  document.getElementById('fa-n-bottom').textContent = cnt.bottom;
  document.getElementById('fa-n-outfit').textContent = cnt.outfit;
  document.getElementById('fa-n-foot').textContent = cnt.footwear;
  document.getElementById('fa-n-jewel').textContent = cnt.jewellery;
  document.getElementById('fa-n-other').textContent = cnt.other;
  document.getElementById('fa-almari-empty').style.display = items.length ? 'none' : 'block';

  // rare-worn (sustainability) — > 6 months
  const sixMo = Date.now() - 1000*60*60*24*182;
  const rare = items.filter(i => { const t = i.last_worn ? Date.parse(i.last_worn) : Date.parse(i.added_at); return t && t < sixMo; });
  const ra = document.getElementById('fa-rare-alert');
  if (rare.length){ ra.style.display = 'block'; ra.textContent = '♻️ ' + rare.length + ' कपड़े 6 महीने से नहीं पहने — Chitti इन्हें फिर से style कर सकती है। (खरीदने से अच्छा, जो है उसे पहनें।)'; }
  else ra.style.display = 'none';

  // grid
  const grid = document.getElementById('fa-grid');
  grid.innerHTML = items.map(i =>
    '<div class="fa-tile">' +
      (i.photo ? '<img alt="' + esc(i.category) + '" src="' + i.photo + '">' : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:34px">👕</div>') +
      '<span class="badge">' + esc(i.colour || i.category) + '</span>' +
      '<button class="x" aria-label="हटाओ" onclick="faRemove(\'' + i.id + '\')">✕</button>' +
    '</div>'
  ).join('');
}
async function faRemove(id){ await faDelItem(id); faRenderWardrobe(); try { faRenderTwin(); } catch(e){} }

/* wardrobe as TEXT snapshot (only this leaves the device) */
async function faWardrobeText(){
  const items = await faAllItems();
  if (!items.length) return '';
  return items.map(i => i.id + ':' + i.category + ':' + (i.colour||'?') + ':' + (i.occasions||[]).join('/')).join(' | ');
}
function faStatsSpoken(){
  return (CURRENT_LANG === 'en' ? 'Your wardrobe: ' : 'आपकी अलमारी: ') +
    document.getElementById('fa-n-top').textContent + ' tops, ' +
    document.getElementById('fa-n-bottom').textContent + ' bottoms, ' +
    document.getElementById('fa-n-foot').textContent + ' footwear.';
}
function faHeroSpoken(){ const h = document.getElementById('fa-dressme-result'); return (h && h.dataset.spoken) || 'आज क्या पहनूँ — Chitti आपकी अलमारी से outfit बनाएगी।'; }

/* ════════ DeepSeek call (single round-trip) ════════ */
async function faAsk(prompt){
  const r = await fetch(API_BASE + '/api/vaani/ask', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: prompt, language: CURRENT_LANG, mode: 'ask' })
  });
  if (!r.ok) throw new Error('http ' + r.status);
  const j = await r.json();
  return (j.answer || j.text || j.response || j.reply || '').trim();
}
function faParseJSON(s){
  if (!s) return null;
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch(e){ return null; }
}
const BODY_POSITIVE_RULE =
  'You are Chitti — a warm, body-positive Indian fashion stylist. NEVER comment on the user\'s body, size, shape, weight, height or skin tone. ONLY talk about the clothing (cut, colour, fit, fabric, drape). Be budget-first: prefer outfits from what the user already owns. Celebrate every region, religion, gender, age and ability. Reply in language code: ' + ' ';

/* one-language-at-a-time labels (no Hinglish — CTO §5) */
const FA_L = {
  en: { experts:'9 experts say', open:'(open)', a_fashion:'👗 Style', a_color:'🎨 Colour', a_occasion:'🎉 Occasion', a_comfort:'😌 Comfort', a_access:'♿ For everyone', a_sustain:'♻️ Sustainability', a_budget:'💸 Budget', a_climate:'🌦️ Climate', a_cultural:'🪔 Cultural', a_conf:'✨ Confidence', trend:'📈 Trend (info only — does not change the verdict): ', why_q:'🎓 Why, Chitti? (learn)', why:'Why', benefits:'Benefits', tradeoffs:'Trade-offs', alts:'Alternatives', free:'✅ Free (from your wardrobe · ₹0)', cheap:'💸 Budget option', premium:'⭐ Premium' },
  hi: { experts:'9 experts की राय', open:'(खोलें)', a_fashion:'👗 Style', a_color:'🎨 रंग', a_occasion:'🎉 मौक़ा', a_comfort:'😌 आराम', a_access:'♿ सबके लिए', a_sustain:'♻️ टिकाऊपन', a_budget:'💸 बजट', a_climate:'🌦️ मौसम', a_cultural:'🪔 सांस्कृतिक', a_conf:'✨ आत्मविश्वास', trend:'📈 Trend (सिर्फ़ जानकारी, राय नहीं बदलती): ', why_q:'🎓 Chitti क्यों? (समझिए)', why:'क्यों', benefits:'फ़ायदे', tradeoffs:'समझौते', alts:'और विकल्प', free:'✅ मुफ़्त (आपकी अलमारी से · ₹0)', cheap:'💸 सस्ता विकल्प', premium:'⭐ Premium' },
};
var L_MAP = { a_fashion:['agent','fashion'], a_color:['agent','color'], a_occasion:['agent','occasion'], a_comfort:['agent','comfort'], a_access:['agent','accessibility'], a_sustain:['agent','sustainability'], a_budget:['agent','budget'], a_climate:['agent','climate'], a_cultural:['agent','cultural'], a_conf:['agent','confidence'], experts:['chrome','experts'], open:['chrome','open'], trend:['chrome','trend'], why_q:['chrome','whyq'], why:['chrome','why'], benefits:['chrome','benefits'], tradeoffs:['chrome','tradeoffs'], alts:['chrome','alts'], free:['chrome','free'], cheap:['chrome','cheap'], premium:['chrome','premium'] };
function L(k){
  var FD = window.FashionDyn;
  if (FD && L_MAP[k]) { var g = L_MAP[k]; var v = (g[0]==='agent') ? FD.agent(g[1]) : FD.chrome(g[1]); if (v) return v; }
  const b = FA_L[CURRENT_LANG === 'en' ? 'en' : 'hi']; return (b && b[k]) || FA_L.en[k] || k;
}
function faAgentRow(name, label, obj){
  if (!obj) return '';
  return '<div class="row"><span class="ag">' + label + '</span><span class="sc">' + esc(obj.score) + '/10</span><span class="wh">' + esc(obj.why || '') + '</span></div>';
}
function faRenderSwarm(j){
  const a = j.agents || {};
  let rows = '';
  rows += faAgentRow('fashion', L('a_fashion'), a.fashion);
  rows += faAgentRow('color', L('a_color'), a.color);
  rows += faAgentRow('occasion', L('a_occasion'), a.occasion);
  rows += faAgentRow('comfort', L('a_comfort'), a.comfort);
  rows += faAgentRow('accessibility', L('a_access'), a.accessibility);
  rows += faAgentRow('sustainability', L('a_sustain'), a.sustainability);
  rows += faAgentRow('budget', L('a_budget'), a.budget);
  rows += faAgentRow('climate', L('a_climate'), a.climate);
  rows += faAgentRow('cultural', L('a_cultural'), a.cultural);
  const overall = (j.overall != null ? j.overall : '—');
  let html =
    '<div class="fa-swarm">' +
      '<div class="head" onclick="this.nextElementSibling.classList.toggle(\'open\')">' +
        '<span>🤝 ' + L('experts') + ' <span style="font-weight:600;opacity:.8">' + L('open') + '</span></span>' +
        '<span class="score">' + esc(overall) + '/10</span>' +
      '</div>' +
      '<div class="rows">' + (rows || '<div class="row"><span class="wh">—</span></div>') + '</div>' +
      (j.trend_note ? '<div class="trend">' + L('trend') + esc(j.trend_note) + '</div>' : '') +
    '</div>';
  if (j.teach){
    const t = j.teach;
    html += '<details class="fa-teach"><summary>' + L('why_q') + '</summary><div class="t">' +
      (t.why ? '<p><b>' + L('why') + ':</b> ' + esc(t.why) + '</p>' : '') +
      (t.benefits ? '<p><b>' + L('benefits') + ':</b> ' + esc(t.benefits) + '</p>' : '') +
      (t.tradeoffs ? '<p><b>' + L('tradeoffs') + ':</b> ' + esc(t.tradeoffs) + '</p>' : '') +
      (t.alternatives ? '<p><b>' + L('alts') + ':</b> ' + esc(t.alternatives) + '</p>' : '') +
    '</div></details>';
  }
  if (j.tiers){
    const ti = j.tiers;
    html += '<div class="fa-tiers">' +
      (ti.free ? '<div class="fa-tier free"><span class="lab">' + L('free') + '</span><div>' + esc(ti.free) + '</div></div>' : '') +
      (ti.budget ? '<div class="fa-tier budget"><span class="lab">' + L('cheap') + '</span><div>' + esc(ti.budget) + '</div></div>' : '') +
      (ti.premium ? '<div class="fa-tier premium"><span class="lab">' + L('premium') + '</span><div>' + esc(ti.premium) + '</div></div>' : '') +
    '</div>';
  }
  return html;
}

function faLoading(hostId, msg){
  const h = document.getElementById(hostId);
  h.innerHTML = '<div class="sds-card" style="border:1.5px solid #FFD9B0"><span class="fa-spin"></span> ' + esc(msg) + '</div>';
  faSpeak(CURRENT_LANG === 'en' ? 'Chitti is thinking' : 'Chitti सोच रही है');
}
function faError(hostId){
  const h = document.getElementById(hostId);
  const msg = CURRENT_LANG === 'en'
    ? 'Chitti could not reach the server. Please try again in a moment.'
    : 'Chitti को server से जवाब नहीं मिला। थोड़ी देर में फिर कोशिश करें।';
  h.innerHTML = '<div class="sds-card" style="border:1.5px solid #fca5a5;background:#fef2f2">⚠️ ' + esc(msg) + '</div>';
  h.dataset.spoken = msg; faSpeak(msg);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ════════ engine helpers — deterministic, no LLM needed ════════ */
function faEngine(){ return (window.ChittiFashionEngine || null); }
var _faModeLens = '';   // Senior/Kids adaptive lens — overrides age_band across all flows when set
function faCtx(extra){
  const w = (faWearers().find(x => x.id === faCurrentWearer()) || {});
  return Object.assign({ gender: PROFILE.gender, age_band: (_faModeLens || w.band), season: PROFILE.season, culture: PROFILE.culture, profile: (PROFILE.disability || {}) }, extra || {});
}
function faConfBadge(c){
  const col = c >= 80 ? '#138808' : (c >= 60 ? '#b45309' : '#b91c1c');
  const lbl = faDyn() ? faDyn().chrome('conf') : 'Confidence';
  return '<span style="display:inline-block;background:'+col+';color:#fff;font-size:11px;font-weight:900;border-radius:999px;padding:2px 9px">' + esc(lbl) + ' ' + c + '%</span>';
}
function faDyn(){ return window.FashionDyn || null; }
function faLocExplain(rec){
  const FD = faDyn(); if (!FD) return rec.explain || '';
  const occ = FD.occ(rec.occasion); const harm = rec.harmony ? FD.harm(rec.harmony) : '';
  return FD.tmpl('reads', { occ: occ, band: (rec.band!=null?rec.band:''), harm: harm }, CURRENT_LANG);
}
function faLocReasons(rec){
  const FD = faDyn(); if (!FD || !rec.checks) return (rec.reasons||[]).map(r=>esc(r)).join(' · ');
  const out = []; ['occasion','color','weather','budget','accessibility'].forEach(k => { if (k in rec.checks) out.push((rec.checks[k]?'✓ ':'✗ ') + FD.conf(k==='color'?'color':k)); });
  return out.map(r=>'<span style="font-size:11px;color:#555;margin-right:8px">'+esc(r)+'</span>').join('');
}
function faLocFlags(rec){
  const FD = faDyn();
  return (rec.judge && rec.judge.flags || []).map(f => {
    const axis = FD ? FD.judgeAxis(f.axis) : f.axis;
    const msg = (FD && f.code) ? FD.judgeMsg(f.code) : (f.msg||'');
    return '<div style="font-size:12px;color:#b45309;margin-top:4px">⚠️ ' + esc(axis) + ': ' + esc(msg) + '</div>';
  }).join('');
}
function faRenderOutfitCard(rec, byId){
  const FD = faDyn();
  const tiles = rec.items.map(it => '<div class="p">' + (it.photo ? '<img alt="" src="' + it.photo + '">' : '👕') + '<span class="role">' + esc(faDyn() ? faDyn().cat(it.category) : it.category) + '</span></div>').join('');
  const title = FD ? FD.occ(rec.occasion) : (rec.occasion||'').replace('-',' ');
  return '<div class="fa-outfit"><div class="title">' + esc(title) + ' · ' + faConfBadge(rec.confidence) + '</div>' +
    '<div class="pieces">' + (tiles || '<div class="p">👕</div>') + '</div>' +
    '<div class="why">' + esc(faLocExplain(rec)) + '</div>' +
    '<div style="margin-top:4px">' + faLocReasons(rec) + '</div>' + faLocFlags(rec) + '</div>';
}

/* ════════ HERO · Dress Me From What I Own (engine-first, LLM-optional) ════════ */
async function faDressMe(){
  const btn = document.getElementById('fa-dressme'); btn.disabled = true;
  const host = 'fa-dressme-result';
  const items = await faAllItems();
  const E = faEngine();
  if (!items.length){
    const m = CURRENT_LANG === 'en'
      ? 'First add a few clothes in the Almari tab — then Chitti will build outfits for you. 🎙️'
      : 'पहले 🧺 अलमारी में कुछ कपड़े जोड़ें — फिर Chitti आपके लिए outfit बनाएगी। 🎙️';
    document.getElementById(host).innerHTML = '<div class="sds-card">🧺 ' + esc(m) + '</div>';
    document.getElementById(host).dataset.spoken = m; faSpeak(m); btn.disabled = false; return;
  }
  // DETERMINISTIC first — this WORKS even when DeepSeek is down (doctrine: rules are the product).
  let html = '', spoken = '';
  if (E){
    const recs = E.recommend(items, faCtx({ max: 3, liked: faLikedProfile() }));
    if (recs.length){
      window._faLastItems = recs[0].items;  // learning loop: 👍 records this outfit
      recs.forEach(r => { html += faRenderOutfitCard(r); spoken += r.occasion + ' outfit, confidence ' + r.confidence + '%: ' + r.items.map(it => (it.colour||'') + ' ' + it.category).join(', ') + '. ' + (r.explain||'') + ' '; });
    }
  }
  if (!html){
    const m = CURRENT_LANG === 'en' ? 'Add at least a top and a bottom so Chitti can pair an outfit.' : 'कम से कम एक ऊपर और एक नीचे का कपड़ा जोड़ें — फिर Chitti जोड़ी बनाएगी।';
    html = '<div class="sds-card">🧺 ' + esc(m) + '</div>'; spoken = m;
  }
  document.getElementById(host).innerHTML = html;
  document.getElementById(host).dataset.spoken = spoken; faSpeak(spoken);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
  btn.disabled = false;
}

/* ════════ Outfit Simulator — build up to 30 from owned items ════════ */
async function faSimulate(){
  const host = 'fa-week-result';
  const items = await faAllItems(); const E = faEngine();
  if (!items.length || !E){ const m = CURRENT_LANG==='en'?'Add clothes first.':'पहले कपड़े जोड़ें।'; document.getElementById(host).innerHTML='<div class="sds-card">🧺 '+esc(m)+'</div>'; document.getElementById(host).dataset.spoken=m; faSpeak(m); return; }
  const built = E.buildOutfits(items, { max: 30 });
  if (!built.count){ const m = CURRENT_LANG==='en'?'Add a top + bottom (or a full outfit) + footwear to unlock combinations.':'एक ऊपर + एक नीचे (या पूरा पहनावा) + जूते जोड़ें — फिर combinations बनेंगे।'; document.getElementById(host).innerHTML='<div class="sds-card">🧺 '+esc(m)+'</div>'; document.getElementById(host).dataset.spoken=m; faSpeak(m); return; }
  const FD = faDyn();
  let html = '<div style="font-weight:800;color:#138808;margin-bottom:8px">✨ ' + (FD ? FD.tmpl('built', { n: built.count }, CURRENT_LANG) : (built.count + ' outfits — ₹0')) + '</div>';
  if (built.outfits[0]) window._faLastItems = built.outfits[0].items;
  built.outfits.forEach(o => { html += faRenderOutfitCard({ items: o.items, occasion: o.occasion, band: null, confidence: o.score, harmony: o.harmony, checks: null, reasons: [], explain: '', judge: {flags:[]} }); });
  const h = document.getElementById(host); h.innerHTML = html;
  const sp = FD ? FD.tmpl('made', { n: built.count }, CURRENT_LANG) : ('Built ' + built.count + ' outfits');
  h.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ════════ Wardrobe ROI — "buying X unlocks N outfits" ════════ */
async function faROI(){
  const host = 'fa-roi-result';
  const items = await faAllItems(); const E = faEngine();
  if (!items.length || !E){ const m = CURRENT_LANG==='en'?'Add clothes first.':'पहले कपड़े जोड़ें।'; document.getElementById(host).innerHTML='<div class="sds-card">🧺 '+esc(m)+'</div>'; document.getElementById(host).dataset.spoken=m; faSpeak(m); return; }
  // candidate gap items to test (cheap, versatile basics)
  const candidates = [
    { category:'bottom', colour:'beige', desc:'beige chinos' },
    { category:'top', colour:'white', desc:'white shirt' },
    { category:'footwear', colour:'brown', desc:'brown loafers' },
    { category:'bottom', colour:'black', desc:'black trousers' },
    { category:'top', colour:'navy', desc:'navy blazer' },
  ];
  const rois = candidates.map(c => E.wardrobeROI(items, c)).filter(r => r.unlocked > 0).sort((a,b)=>b.unlocked-a.unlocked).slice(0,3);
  let html, sp;
  if (!rois.length){ html = '<div class="sds-card">'+(CURRENT_LANG==='en'?'Your wardrobe already pairs well — no single buy adds many new outfits. Reuse what you own. ♻️':'आपकी अलमारी पहले से अच्छी जोड़ी बनाती है — कुछ नया खरीदने की ज़रूरत नहीं। जो है उसे पहनें। ♻️')+'</div>'; sp = html; }
  else {
    html = rois.map(r => '<div class="fa-tier budget"><span class="lab">🛒 ' + esc(r.candidate.colour + ' ' + r.candidate.category) + '</span><div>' + (CURRENT_LANG==='en' ? ('+' + r.unlocked + ' new outfits unlocked (you have ' + r.before + ' now → ' + r.after + ')') : ('+' + r.unlocked + ' नए outfit खुलेंगे (अभी ' + r.before + ' → ' + r.after + ')')) + '</div></div>').join('');
    html = '<div class="fa-tiers">' + html + '</div>';
    sp = (CURRENT_LANG==='en'?('Best value buy: '+rois[0].candidate.colour+' '+rois[0].candidate.category+', unlocks '+rois[0].unlocked+' new outfits'):('सबसे फ़ायदेमंद: '+rois[0].candidate.colour+' '+rois[0].candidate.category+', '+rois[0].unlocked+' नए outfit'));
  }
  const h = document.getElementById(host); h.innerHTML = html; h.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ════════ More: Wardrobe Audit · Travel Packing · Emergency (deterministic, localized) ════════ */
function faMoreT(key, vars){ const FD = faDyn(); return FD ? FD.more(key, vars) : key; }
async function faAudit(){
  const host = 'fa-audit-result'; const items = await faAllItems(); const E = faEngine();
  if (!items.length){ const m = faMoreT('add_first'); document.getElementById(host).innerHTML='<div class="sds-card">🧺 '+esc(m)+'</div>'; document.getElementById(host).dataset.spoken=m; return; }
  const cnt = {}; items.forEach(i => cnt[i.category] = (cnt[i.category]||0)+1);
  const sixMo = Date.now() - 1000*60*60*24*182;
  const rare = items.filter(i => { const t = i.last_worn ? Date.parse(i.last_worn) : Date.parse(i.added_at); return t && t < sixMo; });
  const built = E ? E.buildOutfits(items, { max: 1000 }).count : 0;
  // gaps
  const gaps = [];
  if ((cnt.bottom||0) < (cnt.top||0) - 1) gaps.push(faMoreT('gap_bottom'));
  if (!(cnt.footwear)) gaps.push(faMoreT('gap_footwear'));
  // cost-per-wear (sustainability — CFOS v2.0 skill_08)
  const costed = items.filter(i => (i.cost||0) > 0);
  let cpwLine = '';
  if (costed.length){ const tc = costed.reduce((a,i)=>a+(i.cost||0),0); const tw = costed.reduce((a,i)=>a+(i.wears||0),0); const cpw = tw>0?Math.round(tc/tw):tc; cpwLine = '₹'+cpw+' '+faMoreT('per_wear')+' ('+costed.length+' '+faMoreT('items')+', ₹'+tc+')'; }
  // best ROI buy + shopping links (gap P1#7) — Founder Rule: this is the LAST option
  let roiLine = '', best = null;
  if (E){ const cands = [{category:'bottom',colour:'beige',desc:'beige chinos'},{category:'top',colour:'white',desc:'white shirt'},{category:'footwear',colour:'brown',desc:'brown loafers'}]; best = cands.map(c=>E.wardrobeROI(items,c)).sort((a,b)=>b.unlocked-a.unlocked)[0]; if (best && best.unlocked>0) roiLine = faMoreT('roi', { item: (faDyn()?(best.candidate.colour+' '+best.candidate.category):best.candidate.desc), n: best.unlocked }); }
  const shopQ = best ? encodeURIComponent(best.candidate.colour+' '+best.candidate.category) : '';
  let html = '<div class="fa-tiers">' +
    '<div class="fa-tier"><span class="lab">🧬 '+faMoreT('total')+'</span><div>'+items.length+' · '+built+' '+faMoreT('outfits')+'</div></div>' +
    (cpwLine?'<div class="fa-tier free"><span class="lab">♻️ '+faMoreT('cpw')+'</span><div>'+esc(cpwLine)+'</div></div>':'') +
    (gaps.length?'<div class="fa-tier budget"><span class="lab">⚠️ '+faMoreT('gaps')+'</span><div>'+esc(gaps.join(' · '))+'</div></div>':'') +
    (rare.length?'<div class="fa-tier"><span class="lab">♻️ '+faMoreT('rare')+'</span><div>'+rare.length+' — '+faMoreT('reuse_ladder')+'</div></div>':'') +
    (roiLine?'<div class="fa-tier budget"><span class="lab">🛒 '+faMoreT('best_buy')+' ('+faMoreT('last_option')+')</span><div>'+esc(roiLine)+
      (shopQ?'<div style="margin-top:6px;font-size:12px">🔎 <a href="https://www.meesho.com/search?q='+shopQ+'" target="_blank" rel="noopener" style="color:#000080;font-weight:700">Meesho</a> · <a href="https://www.myntra.com/'+shopQ+'" target="_blank" rel="noopener" style="color:#000080;font-weight:700">Myntra</a> · <a href="https://www.ajio.com/search/?text='+shopQ+'" target="_blank" rel="noopener" style="color:#000080;font-weight:700">Ajio</a></div>':'')+
      '</div></div>':'') +
  '</div>';
  const h = document.getElementById(host); h.innerHTML = html; const sp = items.length+' '+faMoreT('total')+', '+built+' '+faMoreT('outfits'); h.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}
async function faPacking(){
  const host = 'fa-pack-result'; const items = await faAllItems(); const E = faEngine();
  const days = Math.max(1, Math.min(14, parseInt(document.getElementById('fa-pack-days').value||'3',10)));
  if (!items.length || !E){ const m = faMoreT('add_first'); document.getElementById(host).innerHTML='<div class="sds-card">🧺 '+esc(m)+'</div>'; document.getElementById(host).dataset.spoken=m; return; }
  // capsule: pick a minimal set of tops/bottoms/footwear that maximises outfits
  const tops = items.filter(i=>i.category==='top').slice(0, Math.min(3, Math.ceil(days/2)+1));
  const bottoms = items.filter(i=>i.category==='bottom').slice(0, Math.min(2, Math.ceil(days/3)+1));
  const foot = items.filter(i=>i.category==='footwear').slice(0,2);
  const extra = items.filter(i=>['outfit','jewellery','dupatta','bag'].indexOf(i.category)>=0).slice(0,2);
  const capsule = tops.concat(bottoms, foot, extra);
  const combos = E.buildOutfits(capsule, { max: 30 }).count;
  const list = capsule.map(i => '<div class="p" style="font-size:10px;padding:2px">'+(i.photo?'<img alt="" src="'+i.photo+'">':'👕')+'<span class="role">'+esc(faDyn()?faDyn().cat(i.category):i.category)+'</span></div>').join('');
  let html = '<div class="fa-outfit"><div class="title">🧳 '+faMoreT('pack_for', { days: days })+' · '+combos+' '+faMoreT('outfits')+'</div>' +
    '<div class="why">'+esc(faMoreT('pack_why', { n: capsule.length, c: combos }))+'</div>' +
    '<div class="pieces" style="grid-template-columns:repeat(5,1fr)">'+list+'</div></div>';
  const h = document.getElementById(host); h.innerHTML = html; const sp = faMoreT('pack_for', { days: days })+', '+capsule.length+' '+faMoreT('items'); h.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}
async function faEmergency(){
  const host = 'fa-emrg-result'; const items = await faAllItems(); const E = faEngine();
  if (!items.length || !E){ const m = faMoreT('add_first'); document.getElementById(host).innerHTML='<div class="sds-card">🧺 '+esc(m)+'</div>'; document.getElementById(host).dataset.spoken=m; return; }
  const recs = E.recommend(items, faCtx({ max: 1 }));
  if (!recs.length){ const m = faMoreT('need_more'); document.getElementById(host).innerHTML='<div class="sds-card">🧺 '+esc(m)+'</div>'; document.getElementById(host).dataset.spoken=m; return; }
  const r = recs[0]; window._faLastItems = r.items;
  const h = document.getElementById(host);
  h.innerHTML = '<div style="font-weight:800;color:#138808;margin-bottom:6px">⚡ '+faMoreT('go')+'</div>' + faRenderOutfitCard(r);
  const FD = faDyn(); const names = r.items.map(it => (it.colour?it.colour+' ':'')+it.category).join(', ');
  const sp = faMoreT('go') + ': ' + names; h.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ════════ Outfit Review / Describe (7-agent swarm) ════════ */
let _selectedReviewOcc = '';
function faBuildOccChips(hostId, onPick){
  const EMO = { office:'🏢', interview:'🎯', college:'🎓', wedding:'💍', festive:'🪔', religious:'🛕', date:'💖', travel:'✈️', funeral:'🕊️', family:'👨‍👩‍👧', casual:'🙂' };
  const codes = ['office','interview','college','wedding','festive','religious','date','travel','funeral','family','casual'];
  const FD = faDyn();
  const host = document.getElementById(hostId);
  host.innerHTML = codes.map(code => '<span class="fa-chip" data-occ="' + code + '">' + EMO[code] + ' ' + esc(FD ? FD.occ(code) : code) + '</span>').join('');
  host.querySelectorAll('.fa-chip').forEach(c => c.addEventListener('click', () => {
    host.querySelectorAll('.fa-chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); onPick(c.dataset.occ);
  }));
}
/* text -> items parser (so the engine can review free-typed outfits) */
const FA_BAND_ORDER = ['casual','smart-casual','business-casual','formal','festive','wedding'];
function faBandIdx(o){ const i = FA_BAND_ORDER.indexOf(o); return i < 0 ? 0 : i; }
function faParseOutfit(text){
  const COLS = ['blue','navy','white','black','grey','gray','beige','cream','brown','maroon','red','green','olive','yellow','pink','gold','नीला','सफ़ेद','सफेद','काला','ग्रे','भूरा','मरून','लाल','हरा','पीला','गुलाबी','सुनहरा'];
  const CATS = [['footwear',/sneaker|loafer|oxford|sandal|jutti|heel|shoe|chappal|जूत|सैंडल|चप्पल/i],['outfit',/saree|sari|sherwani|lehenga|suit|kurta\s*set|anarkali|gown|साड़ी|शेरवानी|सूट/i],['jewellery',/earring|jhumka|studs|necklace|kada|watch|jewel|ज़ेवर|बाली/i],['dupatta',/dupatta|scarf|stole|दुपट्टा/i],['bottom',/jean|pant|trouser|chino|palazzo|skirt|churidar|leggings|पैंट|जींस|पजामा/i],['top',/shirt|tee|t-shirt|tshirt|kurta|kurti|blazer|top|hoodie|sweater|jacket|कुर्ता|शर्ट|टॉप/i]];
  return text.split(/[,;+]|और|aur/i).map(s => s.trim()).filter(Boolean).map(seg => {
    const low = seg.toLowerCase();
    let category = 'top'; for (const [c, re] of CATS) if (re.test(low)) { category = c; break; }
    let colour = ''; for (const c of COLS) if (low.indexOf(c) >= 0) { colour = c; break; }
    return { category, colour, desc: seg };
  });
}
function faEngineSwarmJSON(items, ctx){
  const E = faEngine(); const occ = E.classifyOccasion(items); const h = E.colorHarmony(items);
  const seas = E.seasonalSuitability(items, (ctx||{}).season); const j = E.judge(items, ctx);
  const occOK = !ctx.occasion || occ.occasion === ctx.occasion;
  const conf = E.confidence({ occasion: occOK, color: h.score >= 0.7, weather: seas.score >= 1, budget: true, accessibility: j.pass });
  const s = (x) => Math.max(2, Math.min(10, Math.round(x)));
  const FD = faDyn();
  const occName = FD ? FD.occ(occ.occasion) : occ.occasion;
  const flag0 = (FD && j.flags[0] && j.flags[0].code) ? FD.judgeMsg(j.flags[0].code) : (j.flags[0] && j.flags[0].msg || '');
  const nChecks = conf.reasons.filter(r=>r[0]==='✓').length;
  // CFOS v2.0 swarm: 9 voting specialists (3 added — Sustainability/Climate/Cultural — from real engine signals)
  const versatile = items.filter(it => E.colourFamily(it.colour) === 'neutral' || E.fabricSeason(it) === 'all').length;
  const cFlag = (j.flags || []).find(f => f.axis === 'cultural');
  const agents = {
    fashion: { score: s(h.score*5 + occ.band), why: occName },
    color: { score: s(h.score*10), why: FD ? FD.harm(h.type) : h.why },
    occasion: { score: s(occOK ? 9 : 5), why: occName },
    comfort: { score: s(seas.score*8 + 2), why: (FD && seas.score<1) ? FD.judgeMsg('season_mismatch') : (FD ? FD.conf('weather') : seas.why) },
    accessibility: { score: s(j.pass ? 9 : 5), why: j.pass ? (FD?FD.conf('accessibility'):'ok') : flag0 },
    sustainability: { score: s(7 + versatile), why: FD ? FD.agentWhy('sustain') : 're-wearable — cost-per-wear drops' },
    budget: { score: 10, why: FD ? FD.chrome('free') : '₹0' },
    climate: { score: s(seas.score*10), why: (FD && seas.score<1) ? FD.judgeMsg('season_mismatch') : (FD ? FD.agentWhy('climate_ok') : 'fabric suits the season') },
    cultural: { score: s(cFlag ? 5 : 9), why: cFlag ? (FD ? FD.judgeMsg(cFlag.code) : cFlag.msg) : (FD ? FD.agentWhy('cultural_ok') : 'respects the occasion') },
    confidence: { score: s(conf.confidence/10), why: nChecks + ' ' + (FD ? FD.chrome('checks_pass') : 'checks pass') },
  };
  // 9 CFOS voting specialists (Trend is advisory-only, excluded from the mean — trust over virality)
  const VOTERS = ['fashion','color','occasion','comfort','accessibility','sustainability','budget','climate','cultural'];
  const overall = Math.round((VOTERS.reduce((a,k)=>a+agents[k].score,0)/VOTERS.length)*10)/10;
  const teachWhy = FD ? FD.tmpl('reads', { occ: occName, band: (occ.band!=null?occ.band:''), harm: FD.harm(h.type) }, CURRENT_LANG) : E.explain(items, ctx);
  const tiers = { free: FD ? FD.chrome('free') : 'Free · ₹0' };
  if (!j.pass && j.flags[0]) tiers.budget = flag0;
  return { overall, agents, teach: { why: teachWhy, tradeoffs: h.type === 'competing' ? (FD?FD.harm('competing'):'') : '' }, tiers, trend_note: '', _judge: j };
}
async function faReview(){
  const host = 'fa-review-result';
  const outfit = (document.getElementById('fa-review-text').value || '').trim();
  if (!outfit){ faSpeak(CURRENT_LANG==='en'?'Tell me what you are wearing':'बताइए आप क्या पहन रहे हैं'); document.getElementById('fa-review-text').focus(); return; }
  const E = faEngine();
  const items = faParseOutfit(outfit);
  if (!E || !items.length){ const m = CURRENT_LANG==='en'?'Tell me your outfit, e.g. "blue shirt, black pants, brown shoes".':'अपना outfit बताइए, जैसे "नीली शर्ट, काली पैंट, भूरे जूते"।'; document.getElementById(host).innerHTML='<div class="sds-card">'+esc(m)+'</div>'; document.getElementById(host).dataset.spoken=m; faSpeak(m); return; }
  const j = faEngineSwarmJSON(items, faCtx({ occasion: _selectedReviewOcc || null }));
  // verdict vs the selected occasion
  const FD = faDyn();
  let verdict = '';
  if (_selectedReviewOcc){ const occ = E.classifyOccasion(items); const d = faBandIdx(occ.occasion) - faBandIdx(_selectedReviewOcc); const oc = FD ? FD.occ(_selectedReviewOcc) : _selectedReviewOcc; const key = d===0?'just':(d>0?'over':'under'); verdict = FD ? FD.tmpl(key, { occ: oc }, CURRENT_LANG) : ((d===0?'✅ just right for ':(d>0?'⬆️ over-dressed for ':'⬇️ too casual for ')) + oc); }
  const flags = faLocFlags({ judge: j._judge });
  const h = document.getElementById(host);
  h.innerHTML = '<div class="sds-card">' +
    (verdict ? '<div style="font-weight:800;color:#000080;margin-bottom:6px">' + esc(verdict) + '</div>' : '') + faRenderSwarm(j) + flags + '</div>';
  const sp = (verdict || '') + '. ' + (FD ? FD.tmpl('overall', { n: j.overall }, CURRENT_LANG) : ('Overall ' + j.overall + '/10')) + ' ' + (j.teach.why||'');
  h.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}
async function faDescribeMine(){
  // Blind-user hero: deterministic — pick one owned outfit and describe it aloud + suitability.
  const host = 'fa-review-result';
  const items = await faAllItems(); const E = faEngine();
  if (!items.length || !E){ const m = CURRENT_LANG==='en'?'Add clothes to your Almari so Chitti can describe an outfit for you.':'अलमारी में कपड़े जोड़ें — फिर Chitti आपका outfit बोलकर बताएगी।'; document.getElementById(host).innerHTML='<div class="sds-card">'+esc(m)+'</div>'; document.getElementById(host).dataset.spoken=m; faSpeak(m); return; }
  const recs = E.recommend(items, faCtx({ max: 1 }));
  if (!recs.length){ const m = CURRENT_LANG==='en'?'Add at least a top and a bottom and Chitti will describe an outfit.':'कम से कम एक ऊपर और एक नीचे का कपड़ा जोड़ें।'; document.getElementById(host).innerHTML='<div class="sds-card">'+esc(m)+'</div>'; document.getElementById(host).dataset.spoken=m; faSpeak(m); return; }
  const r = recs[0]; window._faLastItems = r.items;
  const names = r.items.map(it => (it.colour ? it.colour + ' ' : '') + it.category).join(', ');
  const FD = faDyn();
  let text = (CURRENT_LANG==='en'
    ? ('You can wear: ' + names + '. This reads ' + r.occasion + ' and is good to go.')
    : ('आप पहन सकते हैं: ' + names + '। यह ' + r.occasion + ' के लिए सही है।'));
  if (FD) { text = FD.tmpl('wear', { items: names, occ: FD.occ(r.occasion) }, CURRENT_LANG); }
  const h=document.getElementById(host); h.innerHTML='<div class="sds-card">👁️ '+esc(text)+'</div>'; h.dataset.spoken=text; faSpeak(text);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ════════ Occasion + Weather ════════ */
let _selectedOcc = '';
async function faOccasion(){
  const host = 'fa-occasion-result';
  const extra = (document.getElementById('fa-occasion-text').value || '').trim();
  const occ = _selectedOcc || extra;
  if (!occ){ faSpeak(CURRENT_LANG==='en'?'Pick an occasion':'मौक़ा चुनिए'); return; }
  const E = faEngine(); const items = await faAllItems();
  // map UI occasion -> engine band target
  const TMAP = { office:'business-casual', interview:'smart-casual', college:'casual', wedding:'wedding', festive:'festive', religious:'festive', date:'smart-casual', travel:'casual', funeral:'formal', family:'smart-casual', casual:'casual' };
  const target = TMAP[_selectedOcc] || null;
  if (E && items.length){
    const recs = E.recommend(items, faCtx({ occasion: target, max: 3 }));
    if (recs.length){
      let html = '', sp = (CURRENT_LANG==='en'?'For ':'') + (_selectedOcc||occ) + (CURRENT_LANG==='en'?', from your wardrobe: ':' के लिए, आपकी अलमारी से: ');
      if (recs[0]) window._faLastItems = recs[0].items;
      recs.forEach(r => { html += faRenderOutfitCard(r); sp += r.items.map(it=>(it.colour||'')+' '+it.category).join(', ') + '. '; });
      const h = document.getElementById(host); h.innerHTML = html; h.dataset.spoken = sp; faSpeak(sp);
      try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){} return;
    }
  }
  // no wardrobe -> honest deterministic guidance per occasion
  const GUIDE = {
    office:'Clean, calibrated to your city — Mumbai smart-casual, Delhi more formal, Bangalore relaxed. A pressed shirt + chinos reads professional.',
    interview:'Smart-casual to formal — neat shirt, dark trousers, closed shoes. Calibrated, not over-dressed.',
    wedding:'Festive-traditional — kurta/sherwani or saree/lehenga; comfort for long hours.',
    festive:'Bright/jewel tones with one statement accessory; respect the festival.',
    funeral:'White or muted, simple, somber. No bright colours or heavy jewellery.',
    religious:'Modest, covered, traditional and respectful to the place of worship.',
    date:'Smart-casual you feel confident in; one polished detail.',
    travel:'Comfortable, breathable, layered for the climate.',
    family:'Smart-casual, comfortable, festive if it is a function.',
    college:'Comfortable, current-enough, peer-appropriate — from what you own.',
    casual:'Comfort + a clean pairing from what you own.',
  };
  const g = GUIDE[_selectedOcc] || GUIDE.casual;
  const m = (CURRENT_LANG==='en'?('For '+(_selectedOcc||occ)+': '+g+' Add clothes to your Almari and Chitti will build it from what you own.'):('इस मौक़े के लिए: '+g+' अलमारी में कपड़े जोड़ें — फिर Chitti आपके अपने कपड़ों से बनाएगी।'));
  const h = document.getElementById(host); h.innerHTML = '<div class="sds-card">🎉 '+esc(m)+'</div>'; h.dataset.spoken = m; faSpeak(m);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}
async function faWeather(){
  const host = 'fa-occasion-result';
  let city = PROFILE.city || '';
  try { if (!city && window.Chitti && Chitti.location && Chitti.location.get){ const loc = await Chitti.location.get(); city = (loc && (loc.city || loc.pincode)) || ''; } } catch(e){}
  // deterministic season inference (month-free: use profile.season if set, else ask)
  const season = PROFILE.season || '';
  const items = await faAllItems(); const E = faEngine();
  let advice;
  if (season === 'summer') advice = CURRENT_LANG==='en'?'Hot weather — light cotton/linen, breathable, light colours, sandals. Avoid wool/heavy layers.':'गर्मी — हल्का cotton/linen, हल्के रंग, sandals। ऊनी/भारी कपड़े नहीं।';
  else if (season === 'winter') advice = CURRENT_LANG==='en'?'Cold weather — layers, a jacket/sweater, closed shoes, darker tones hold warmth.':'ठंड — layers, jacket/sweater, बंद जूते, गहरे रंग।';
  else advice = CURRENT_LANG==='en'?'Moderate — a light layer you can remove; cotton blends work all day.':'मिला-जुला — हल्की layer जो उतार सकें; cotton blends दिन भर ठीक।';
  let extra = '';
  if (E && items.length && season){ const seas = E.seasonalSuitability(items, season); extra = ' ' + seas.why + '.'; }
  if (!season) advice = (CURRENT_LANG==='en'?'Set your climate in the Family → Fashion Digital Twin (hot/cold/moderate) and Chitti will tailor fabric + layers.':'Family → Fashion Digital Twin में मौसम चुनें (गर्म/ठंडा) — Chitti कपड़े और layer बताएगी।');
  const m = (city ? (city + ': ') : '') + advice + extra;
  const h = document.getElementById(host); h.innerHTML = '<div class="sds-card">☁️ '+esc(m)+'</div>'; h.dataset.spoken = m; faSpeak(m);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ════════ Budget tiers (Free from wardrobe = deterministic) ════════ */
async function faBudget(){
  const host = 'fa-budget-result';
  const need = (document.getElementById('fa-budget-text').value || '').trim();
  if (!need){ faSpeak(CURRENT_LANG==='en'?'What do you need?':'क्या चाहिए?'); return; }
  const E = faEngine(); const items = await faAllItems();
  // FREE tier: can the wardrobe already cover it? show owned options deterministically.
  let freeText;
  if (E && items.length){ const built = E.buildOutfits(items, { max: 3 });
    freeText = built.count ? ((CURRENT_LANG==='en'?'You can already make ':'आप पहले से ')+built.count+(CURRENT_LANG==='en'?' outfits from what you own — pair those before buying. ₹0.':' outfit अपने कपड़ों से बना सकते हैं — खरीदने से पहले इन्हें पहनें। ₹0।')) : (CURRENT_LANG==='en'?'Pair what you own first.':'पहले जो है उसे जोड़ें।'); }
  else freeText = CURRENT_LANG==='en'?'Add your wardrobe — most needs are already solvable from what you own. ₹0.':'अपनी अलमारी जोड़ें — ज़्यादातर ज़रूरतें आपके अपने कपड़ों से पूरी हो जाती हैं। ₹0।';
  const j = { tiers: {
    free: freeText,
    budget: (CURRENT_LANG==='en'?'If you must buy: Meesho ~₹250–500 or local market (try-on + bargain). Honest: local is often cheapest.':'अगर खरीदना ही हो: Meesho ~₹250–500 या local market (try-on + मोल-भाव)। सच: local अक्सर सबसे सस्ता।'),
    premium: (CURRENT_LANG==='en'?'Myntra / Ajio ~₹699–1499 for better fabric + return policy.':'Myntra / Ajio ~₹699–1499 बेहतर fabric + return के लिए।'),
  }, teach: { why: (CURRENT_LANG==='en'?'Start free because a well-fitting owned piece beats a cheap new one.':'मुफ़्त से शुरू करें — अच्छी fit वाला अपना कपड़ा सस्ते नए से बेहतर है।') } };
  const h = document.getElementById(host);
  h.innerHTML = '<div class="sds-card">' + faRenderSwarm(j) + '</div>';
  h.dataset.spoken = j.tiers.free; faSpeak(j.tiers.free);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ════════ Learn (teach mode) — deterministic explainer + LLM optional ════════ */
const FA_LESSONS = [
  [/blue|navy|नीला/i, { en:'Blue is a cool neutral-friendly anchor. Why: it pairs with white, grey, beige and most warm accents. Benefit: hard to get wrong. Example: navy + white + brown reads instantly polished.', hi:'नीला एक ठंडा, neutral-दोस्त रंग है। क्यों: सफ़ेद, ग्रे, भूरे और गर्म रंगों के साथ जँचता है। फ़ायदा: ग़लत होना मुश्किल। उदाहरण: navy + सफ़ेद + भूरा तुरंत polished लगता है।' }],
  [/colour|color|रंग|match/i, { en:'Colours match when one is the hero and the rest are neutral anchors. Why: two bright colours compete for attention. Benefit: the outfit looks intentional. Example: one red kurta + cream bottoms + cream dupatta.', hi:'रंग तब जँचते हैं जब एक hero हो और बाक़ी neutral। क्यों: दो चटक रंग ध्यान के लिए लड़ते हैं। फ़ायदा: outfit सोचा-समझा लगता है। उदाहरण: एक लाल कुर्ता + cream नीचे + cream दुपट्टा।' }],
  [/shoe|footwear|जूत/i, { en:'Footwear sets formality. Why: sneakers read casual, loafers smart-casual, oxfords formal. Benefit: the right shoe calibrates the whole look. Example: blazer + sneakers = deliberately business-casual.', hi:'जूते formality तय करते हैं। क्यों: sneakers casual, loafers smart-casual, oxfords formal। फ़ायदा: सही जूता पूरे look को सेट करता है। उदाहरण: blazer + sneakers = जान-बूझकर business-casual।' }],
  [/wedding|festive|शादी|त्योहार/i, { en:'Festive dressing uses jewel tones + one statement piece. Why: occasions reward richness, not clash. Benefit: you fit the celebration. Example: maroon + gold accents, one bold jhumka.', hi:'त्योहार में jewel रंग + एक statement piece। क्यों: मौक़े richness चाहते हैं, टकराव नहीं। फ़ायदा: आप celebration में घुल जाते हैं। उदाहरण: मरून + सुनहरे accents, एक bold झुमका।' }],
];
async function faLearn(){
  const host = 'fa-learn-result';
  const q = (document.getElementById('fa-learn-text').value || '').trim();
  if (!q){ faSpeak(CURRENT_LANG==='en'?'Ask me anything about style':'style के बारे में कुछ पूछिए'); return; }
  // deterministic lesson first (works offline / LLM-down)
  let lesson = null;
  for (const [re, txt] of FA_LESSONS) if (re.test(q)) { lesson = txt; break; }
  if (lesson){ const t = lesson[CURRENT_LANG==='en'?'en':'hi'] || lesson.en; const h=document.getElementById(host); h.innerHTML='<div class="sds-card">🎓 '+esc(t)+'</div>'; h.dataset.spoken=t; faSpeak(t); try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){} return; }
  const m = (CURRENT_LANG==='en'?'Try asking about colours, footwear, matching, or festive dressing — Chitti teaches the principle. (Richer answers return when the AI link is funded.)':'रंग, जूते, matching या त्योहार के बारे में पूछें — Chitti सिद्धांत समझाती है।');
  const h=document.getElementById(host); h.innerHTML='<div class="sds-card">🎓 '+esc(m)+'</div>'; h.dataset.spoken=m; faSpeak(m);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ════════ Explain (🤖) + Feedback (👍/👎) ════════ */
function faExplain(cardId){
  const card = document.querySelector('[data-chitti-response="' + cardId + '"]');
  const section = card ? (card.getAttribute('data-chitti-section') || '') : '';
  faSpeak(CURRENT_LANG==='en' ? ('Chitti will explain: ' + section) : ('Chitti समझाएगी: ' + section));
  try { if (window.ChittiFeedback && ChittiFeedback.explain) ChittiFeedback.explain(cardId); } catch(e){}
}
/* ════════ Learning loop (gap P1#9) — 👍/👎 on an outfit biases future picks ════════ */
function faLikedProfile(){ return (PROFILE.liked && (PROFILE.liked.colours || PROFILE.liked.cats)) ? PROFILE.liked : {}; }
function faImpactLedger(){ PROFILE.impact = PROFILE.impact || { repairs: 0, reuses: 0 }; return PROFILE.impact; }
function faBumpImpact(key, n){ const L = faImpactLedger(); L[key] = Math.max(0, (L[key] || 0) + (n || 1)); faSaveProfile(); }
function faLearnFromOutfit(items, dir){
  if (!items || !items.length) return; const E = faEngine(); if (!E) return;
  if (dir > 0) faBumpImpact('reuses', 1);   // a 👍 on an own-wardrobe outfit = a re-wear intent (Founder Rule)
  PROFILE.liked = PROFILE.liked || { colours:{}, cats:{} };
  items.forEach(it => { const fam = E.analyseColour(it.hex, it.colour).family; const d = dir>0?1:-1;
    PROFILE.liked.colours[fam] = Math.max(0, (PROFILE.liked.colours[fam]||0) + d);
    PROFILE.liked.cats[it.category] = Math.max(0, (PROFILE.liked.cats[it.category]||0) + d);
  });
  faSaveProfile();
  try { faRenderTwin(); } catch(e){}
}
async function faFeedback(card, dir){
  if (dir === 1){ faSpeak(CURRENT_LANG==='en'?'Thank you — I will remember this':'धन्यवाद — Chitti याद रखेगी'); }
  else { faSpeak(CURRENT_LANG==='en'?'Sorry — I will learn from this. What was wrong?':'माफ़ कीजिए — Chitti इससे सीखेगी। क्या ग़लत था?'); }
  // learn from outfit-bearing cards
  if (['fa_today','fa_review','fa_occasion','fa_week','fa_emrg'].indexOf(card) >= 0) faLearnFromOutfit(window._faLastItems, dir);
  try {
    await fetch(API_BASE + '/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chitti: 'chitti_fashion', card: card, vote: dir, language: CURRENT_LANG })
    });
  } catch(e){}
}

/* ════════ Family Mode (per-wearer wardrobes, on-device) ════════ */
function faWearers(){
  if (!Array.isArray(PROFILE.wearers) || !PROFILE.wearers.length)
    PROFILE.wearers = [{ id:'me', name: (CURRENT_LANG==='en'?'Me':'मैं'), band:'adult' }];
  return PROFILE.wearers;
}
function faCurrentWearer(){ return PROFILE.activeWearer || 'me'; }
function faSetWearer(id){ PROFILE.activeWearer = id; faSaveProfile(); faRenderWardrobe(); faRenderTwin(); }
function faAddWearer(){
  const name = (prompt(CURRENT_LANG==='en'?'New family member name:':'नए सदस्य का नाम:') || '').trim();
  if (!name) return;
  const band = (prompt(CURRENT_LANG==='en'?'Age group? child / teen / adult / senior':'उम्र? child / teen / adult / senior','adult') || 'adult').trim().toLowerCase();
  const id = 'w-' + Date.now().toString(36);
  faWearers().push({ id, name, band: ['child','teen','adult','senior'].includes(band)?band:'adult' });
  PROFILE.activeWearer = id; faSaveProfile();
  faRenderWearers(); faRenderWardrobe(); faRenderTwin();
  faSpeak(CURRENT_LANG==='en'?('Added '+name):(name+' जोड़ दिया'));
}
function faRenderWearers(){
  const sel = document.getElementById('fa-wearer'); if (!sel) return;
  const cur = faCurrentWearer();
  sel.innerHTML = faWearers().map(w => '<option value="'+w.id+'"'+(w.id===cur?' selected':'')+'>'+esc(w.name)+' ('+esc(w.band)+')</option>').join('');
}
function faWearerSpoken(){
  const w = faWearers().find(x => x.id === faCurrentWearer());
  return (CURRENT_LANG==='en'?'Now styling: ':'अभी style कर रही हूँ: ') + (w?w.name:'') ;
}

/* ════════ Fashion Digital Twin (on-device style profile) ════════ */
function faTwinSet(key, val){ PROFILE[key] = val; faSaveProfile(); faRenderTwin(); faSpeak(CURRENT_LANG==='en'?'Saved':'सेव कर दिया'); }
function faTwinHydrate(){
  const map = { 'fa-twin-prof':'profession','fa-twin-cult':'culture','fa-twin-clim':'season','fa-twin-budget':'budget','fa-twin-tone':'tone','fa-twin-fit':'fit' };
  Object.keys(map).forEach(id => { const el = document.getElementById(id); if (el && PROFILE[map[id]]) el.value = PROFILE[map[id]]; });
}
async function faRenderTwin(){
  const host = document.getElementById('fa-twin-body'); if (!host) return;
  const items = await faAllItems();
  if (!items.length){
    const m = CURRENT_LANG==='en'?'Add clothes to your Almari — Chitti will build your Fashion Twin automatically.':'अलमारी में कपड़े जोड़ें — Chitti आपका Fashion Twin ख़ुद बना देगी।';
    host.innerHTML = '<div style="font-size:14px;color:#666">🧬 '+esc(m)+'</div>'; host.dataset.spoken = m; return;
  }
  const colours = {}, cats = {};
  items.forEach(i => { if (i.colour) colours[i.colour]=(colours[i.colour]||0)+1; cats[i.category]=(cats[i.category]||0)+1; });
  const topColours = Object.entries(colours).sort((a,b)=>b[1]-a[1]).slice(0,4).map(c=>c[0]);
  const liked = (PROFILE.liked_styles||[]).slice(-5);
  const gaps = [];
  if ((cats.bottom||0) < (cats.top||0) - 2) gaps.push(CURRENT_LANG==='en'?'more bottoms unlock more outfits':'और नीचे के कपड़े = ज़्यादा outfit');
  if (!(cats.footwear)) gaps.push(CURRENT_LANG==='en'?'add footwear':'जूते जोड़ें');
  const spoken = (CURRENT_LANG==='en'?'Your Fashion Twin: ':'आपका Fashion Twin: ') +
    items.length + (CURRENT_LANG==='en'?' items, favourite colours ':' चीज़ें, पसंदीदा रंग ') + (topColours.join(', ')||'—');
  const prof = [PROFILE.profession, PROFILE.culture, PROFILE.season, PROFILE.budget && (PROFILE.budget+' budget'), PROFILE.tone && (PROFILE.tone+' undertone'), PROFILE.fit && (PROFILE.fit+' fit')].filter(Boolean);
  // My Colours — personal palette from real hex (gap P0#2)
  const E2 = faEngine(); let palTier = '';
  if (E2 && items.some(i=>i.hex)){ const ds = E2.deriveSeason(items); const pal = E2.paletteFor(ds.season);
    const sName = CURRENT_LANG==='en' ? ({warm:'warm',cool:'cool',neutral:'balanced'}[ds.season]||ds.season) : ({warm:'गर्म',cool:'ठंडे',neutral:'संतुलित'}[ds.season]||ds.season);
    const note = CURRENT_LANG==='en' ? pal.note : (ds.season==='warm'?'गर्म रंग (mustard, rust, cream, gold) आप पर खिलते हैं':ds.season==='cool'?'ठंडे रंग (navy, teal, grey, true white) आप पर जँचते हैं':'ज़्यादातर रंग चलते हैं — neutral से anchor करें');
    palTier = '<div class="fa-tier free"><span class="lab">🎨 '+(CURRENT_LANG==='en'?'My Colours':'मेरे रंग')+'</span><div>'+(CURRENT_LANG==='en'?('Your palette leans '+sName+'. '):(sName+' पैलेट। '))+esc(note)+'</div></div>'; }
  // learned likes from the feedback loop
  let learned = []; try { const lc = (PROFILE.liked && PROFILE.liked.colours)||{}; learned = Object.keys(lc).filter(k=>lc[k]>0).sort((a,b)=>lc[b]-lc[a]).slice(0,3); } catch(e){}
  host.innerHTML =
    '<div class="fa-tiers">' +
      '<div class="fa-tier"><span class="lab">🧬 '+(CURRENT_LANG==='en'?'Items owned':'कुल चीज़ें')+'</span><div>'+items.length+'</div></div>' +
      '<div class="fa-tier"><span class="lab">🎨 '+(CURRENT_LANG==='en'?'Your palette':'आपके रंग')+'</span><div>'+(esc(topColours.join(' · '))||'—')+'</div></div>' +
      palTier +
      (learned.length?'<div class="fa-tier"><span class="lab">🧠 '+(CURRENT_LANG==='en'?'Chitti learned you like':'Chitti ने सीखा आपको पसंद है')+'</span><div>'+esc(learned.join(' · '))+'</div></div>':'') +
      (prof.length?'<div class="fa-tier"><span class="lab">👤 '+(CURRENT_LANG==='en'?'Style profile':'आपकी पहचान')+'</span><div>'+esc(prof.join(' · '))+'</div></div>':'') +
      (liked.length?'<div class="fa-tier"><span class="lab">⭐ '+(CURRENT_LANG==='en'?'You liked':'आपको पसंद आया')+'</span><div>'+esc(liked.join(' · '))+'</div></div>':'') +
      (gaps.length?'<div class="fa-tier budget"><span class="lab">♻️ '+(CURRENT_LANG==='en'?'To unlock more':'और outfit के लिए')+'</span><div>'+esc(gaps.join(' · '))+'</div></div>':'') +
    '</div>';
  host.dataset.spoken = spoken;
}

/* ════════ Build my week — multi-occasion generation from owned items ════════ */
async function faBuildMyWeek(){
  const host = 'fa-week-result';
  const wardrobe = await faWardrobeText();
  if (!wardrobe){ const m = CURRENT_LANG==='en'?'Add clothes to your Almari first.':'पहले अलमारी में कपड़े जोड़ें।'; document.getElementById(host).innerHTML='<div class="sds-card">🧺 '+esc(m)+'</div>'; document.getElementById(host).dataset.spoken=m; faSpeak(m); return; }
  faLoading(host, CURRENT_LANG==='en'?'Building one outfit per occasion…':'हर मौक़े के लिए एक outfit बना रही हूँ…');
  const w = faWearers().find(x=>x.id===faCurrentWearer());
  const prompt = BODY_POSITIVE_RULE + CURRENT_LANG +
    '. Wearer age group: ' + (w?w.band:'adult') + ', gender pref: ' + (PROFILE.gender||'unspecified') + '. ' +
    'From these OWNED items only [' + wardrobe + '], build ONE complete outfit for EACH occasion: office, interview, wedding, casual, travel. ' +
    'Use ONLY item ids from the list — never invent an item. Return STRICT JSON: ' +
    '{"week":[{"occasion":"office","item_ids":["id"],"why":"one warm line"},{"occasion":"interview",...},{"occasion":"wedding",...},{"occasion":"casual",...},{"occasion":"travel",...}]}. ' +
    'If an occasion truly cannot be met from owned items, set item_ids:[] and say so honestly in why.';
  try {
    const ans = await faAsk(prompt);
    const j = faParseJSON(ans);
    const items = await faAllItems(); const byId = {}; items.forEach(i => byId[i.id]=i);
    const h = document.getElementById(host);
    if (!j || !Array.isArray(j.week)){ h.innerHTML='<div class="sds-card">'+esc(ans||'—')+'</div>'; h.dataset.spoken=ans; faSpeak(ans); }
    else {
      const labels = {office:'🏢 office',interview:'🎯 interview',wedding:'💍 शादी',casual:'🙂 casual',travel:'✈️ travel'};
      let html='', spoken='';
      j.week.forEach(o => {
        const valid = (o.item_ids||[]).filter(id => byId[id]);
        const tiles = valid.map(id => '<div class="p">'+(byId[id].photo?'<img alt="" src="'+byId[id].photo+'">':'👕')+'<span class="role">'+esc(faDyn()?faDyn().cat(byId[id].category):byId[id].category)+'</span></div>').join('');
        html += '<div class="fa-outfit"><div class="title">'+esc(labels[o.occasion]||o.occasion)+'</div>'+
          '<div class="why">'+esc(o.why||'')+'</div>'+
          '<div class="pieces">'+(tiles||'<div class="p" style="font-size:11px;padding:4px">'+(CURRENT_LANG==='en'?'add items':'कपड़े जोड़ें')+'</div>')+'</div></div>';
        spoken += (labels[o.occasion]||o.occasion)+': '+(valid.map(id=>byId[id].colour+' '+byId[id].category).join(', ')||'—')+'. ';
      });
      h.innerHTML = html; h.dataset.spoken = spoken; faSpeak(spoken);
    }
    try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
  } catch(e){ faError(host); }
}

/* ════════ language dropdown guard — never let labels render blank ════════ */
/* native · Latin so the label is legible even if an Indic font fails to render */
var FA_LANG_NAMES = { en:'English', hi:'हिन्दी · Hindi', bn:'বাংলা · Bangla', ta:'தமிழ் · Tamil', te:'తెలుగు · Telugu', mr:'मराठी · Marathi', gu:'ગુજરાતી · Gujarati', kn:'ಕನ್ನಡ · Kannada', ml:'മലയാളം · Malayalam', pa:'ਪੰਜਾਬੀ · Punjabi', or:'ଓଡ଼ିଆ · Odia', as:'অসমীয়া · Assamese', ur:'اردو · Urdu', sa:'संस्कृतम् · Sanskrit', mai:'मैथिली · Maithili', kok:'कोंकणी · Konkani', doi:'डोगरी · Dogri', ks:'کٲشُر · Kashmiri', ne:'नेपाली · Nepali', sd:'سنڌي · Sindhi', mni:'Manipuri', sat:'Santali', bho:'भोजपुरी · Bhojpuri', raj:'राजस्थानी · Rajasthani', kru:'कुड़ुख़ · Kurukh', hoc:'हो · Ho', tcy:'ತುಳು · Tulu', kfy:'Kumaoni', brx:'बड़ो · Bodo' };
/* ════════ LANGUAGE — Vaani-canonical (chitti_lang.js owns #lang-select) ════════
   BO2: chitti_lang.js populates the dropdown with all native languages + wires its
   own onchange (which DOM-translates + dispatches chitti:langchange). We LISTEN to
   that event and apply Fashion's native i18n bundle. We do NOT build options or attach
   an onchange ourselves (that was the old bug — it fought chitti_lang.js → blank/stuck
   dropdown). faFixLangLabels is now only a SAFETY NET: if chitti_lang.js never loaded,
   make sure the 9 primary languages still exist so the control is never empty. */
var _faLangWired = false;
function faWireLangVaani(){
  if (_faLangWired) return; _faLangWired = true;
  // listen to the canonical event (chitti_lang.js dispatches on document, bubbles to window)
  window.addEventListener('chitti:langchange', function(e){
    var lang = (e && e.detail && e.detail.lang) || faDetectLang();
    if (lang === CURRENT_LANG) { /* still re-apply bundle for safety */ }
    faChangeLang(lang);
  });
  document.addEventListener('chitti:langchange', function(e){
    var lang = (e && e.detail && e.detail.lang); if (lang && lang !== CURRENT_LANG) faChangeLang(lang);
  });
}
function faFixLangLabels(){
  var sel = document.getElementById('lang-select'); if (!sel) return;
  // SAFETY NET only — if chitti_lang.js populated (>=9 options), leave it alone.
  if (sel.options.length < 9) {
    var have = {}; for (var i=0;i<sel.options.length;i++) have[sel.options[i].value]=1;
    ['en','hi','bn','ta','te','mr','gu','kn','ml','pa','or','as','ur','ta','sa'].forEach(function(code){
      if (!have[code]) { var o=document.createElement('option'); o.value=code; o.textContent=FA_LANG_NAMES[code]||code; sel.appendChild(o); have[code]=1; }
    });
  }
  if (CURRENT_LANG && sel.value !== CURRENT_LANG) sel.value = CURRENT_LANG;
}
var _faLangBusy = false;

/* ════════════════════════════════════════════════════════════════════
   CFOS v2.1 — Clothing Doctor · Wedding Planner · Office Week Planner
   Deterministic (no API). Engine: diagnoseRepair / planWedding / planWeek.
   ════════════════════════════════════════════════════════════════════ */
async function faGetItem(id){ const all = await faAllItemsRaw(); return all.find(x => x.id === id) || null; }
function faChipRow(hostId, opts, multi, onPick){
  const host = document.getElementById(hostId); if (!host) return;
  host.innerHTML = opts.map(o => '<span class="fa-chip' + (o.on ? ' on' : '') + '" data-code="' + o.code + '">' + o.label + '</span>').join('');
  host.querySelectorAll('.fa-chip').forEach(c => c.addEventListener('click', () => {
    if (multi) { c.classList.toggle('on'); }
    else { host.querySelectorAll('.fa-chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); }
    if (onPick) onPick(c.dataset.code, c.classList.contains('on'));
  }));
}

/* ── 🩺 Clothing Doctor ── */
let _docItem = '', _docDamage = '';
async function faDoctorInit(){
  const E = faEngine(); const FD = faDyn(); if (!E) return;
  const items = await faAllItems();
  const sel = document.getElementById('fa-doc-item');
  if (sel){
    const placeholder = CURRENT_LANG === 'en' ? '— pick an item —' : '— कपड़ा चुनें —';
    sel.innerHTML = '<option value="">' + placeholder + '</option>' + items.map(i =>
      '<option value="' + i.id + '">' + esc((i.colour ? i.colour + ' ' : '') + i.category + (i.condition === 'needs_repair' ? ' 🩺' : '')) + '</option>').join('');
    sel.onchange = () => { _docItem = sel.value; };
  }
  const codes = E.repairCodes();
  faChipRow('fa-doc-damage', codes.map(c => ({ code: c, label: FD ? FD.repair('dmg_' + c) : c })), false, code => { _docDamage = code; });
}
async function faDiagnose(){
  const host = document.getElementById('fa-doc-result'); const E = faEngine(); const FD = faDyn();
  if (!E) return;
  if (!_docDamage){ const m = CURRENT_LANG==='en'?'Tap what needs fixing.':'क्या ठीक करना है — चुनिए।'; host.innerHTML='<div class="sds-card">🩺 '+esc(m)+'</div>'; host.dataset.spoken=m; faSpeak(m); return; }
  const d = E.diagnoseRepair(_docDamage); if (!d) return;
  const diffWord = FD ? FD.repair(d.difficulty) : d.difficulty;
  const diffCol = d.difficulty === 'easy' ? '#138808' : (d.difficulty === 'medium' ? '#b45309' : '#b91c1c');
  const steps = d.steps.map((s, i) => '<li>' + esc(FD ? FD.repair(s) : s) + ' <button class="fa-spk" aria-label="🔊" onclick="faSpeak(this.previousSibling.textContent||\'\')">🔊</button></li>').join('');
  const verdict = d.diy ? (FD ? FD.repair('diy_yes') : '✅ You can do this at home') + (d.tailor ? ' ' + (FD ? FD.repair('tailor_too') : '') : '')
                        : (FD ? FD.repair('diy_no') : '🧵 Best done by a tailor');
  const toolsLbl = FD ? FD.repair('tools') : 'You need'; const stepsLbl = FD ? FD.repair('steps') : 'Steps'; const minLbl = FD ? FD.repair('minutes') : 'min';
  const tailorLink = d.tailor ? '<div class="fa-row-btns"><a class="fa-btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/tailor+near+me">' + (FD ? FD.repair('find_tailor') : '🔎 Find a tailor near me') + '</a></div>' : '';
  const markBtns = _docItem
    ? '<div class="fa-row-btns"><button class="fa-btn" onclick="faMarkRepair()">' + (FD ? FD.repair('mark_repair') : '🩺 Mark: needs repair') + '</button>'
      + '<button class="fa-btn" onclick="faMarkRepaired()">' + (FD ? FD.repair('mark_repaired') : '✅ Mark: repaired') + '</button></div>'
    : '';
  const dmgLabel = FD ? FD.repair('dmg_' + _docDamage) : _docDamage;
  host.innerHTML = '<div class="fa-outfit"><div class="title">🩺 ' + esc(FD ? FD.repair('plan_title') : 'Repair plan') + ' — ' + esc(dmgLabel) + '</div>' +
    '<div style="margin:6px 0"><span style="display:inline-block;background:' + diffCol + ';color:#fff;font-size:11px;font-weight:900;border-radius:999px;padding:2px 9px">' + esc(diffWord) + '</span>' +
    (d.minutes ? ' <span style="font-size:12px;color:#555">⏱️ ' + d.minutes + ' ' + esc(minLbl) + '</span>' : '') + '</div>' +
    '<div class="why"><b>' + esc(toolsLbl) + ':</b> ' + esc(d.tools.join(', ')) + '</div>' +
    '<div style="margin-top:6px"><b>' + esc(stepsLbl) + ':</b><ol style="margin:6px 0 0 18px;line-height:1.7;font-size:13.5px">' + steps + '</ol></div>' +
    '<div style="margin-top:8px;font-weight:700;color:' + (d.diy ? '#138808' : '#b45309') + '">' + esc(verdict) + '</div>' +
    '<div style="margin-top:4px;font-size:12px;color:#000080">♻️ ' + esc(FD ? FD.repair('ladder_note') : 'Repair before you buy — Founder Rule.') + '</div>' +
    tailorLink + markBtns + '</div>';
  const sp = (FD ? FD.repair('plan_title') : 'Repair plan') + '. ' + diffWord + ', ' + d.minutes + ' ' + minLbl + '. ' + d.steps.map(s => FD ? FD.repair(s) : s).join('. ') + '. ' + verdict;
  host.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}
async function faMarkRepair(){
  if (!_docItem || !_docDamage) return;
  const it = await faGetItem(_docItem); if (!it) return;
  it.condition = 'needs_repair'; it.damage = [_docDamage]; await faPutItem(it);
  faSpeak(CURRENT_LANG==='en'?'Marked as needs repair. Chitti will not style it until you fix it.':'मरम्मत के लिए चिह्नित। ठीक होने तक Chitti इसे style नहीं करेगी।');
  faDoctorInit(); try { faRenderWardrobe(); } catch(e){}
}
async function faMarkRepaired(){
  if (!_docItem) return;
  const it = await faGetItem(_docItem); if (!it) return;
  if (it.condition === 'needs_repair') faBumpImpact('repairs', 1);   // fixed, not rebought (Founder Rule)
  it.condition = 'good'; it.damage = []; await faPutItem(it);
  faSpeak(CURRENT_LANG==='en'?'Marked repaired — back in your outfits.':'ठीक हो गया — फिर से आपके outfit में।');
  faDoctorInit(); try { faRenderWardrobe(); } catch(e){}
}

/* ── 💍 Wedding Planner ── */
let _wedFunc = 'wedding', _wedRole = 'own', _wedMembers = null;
function faWeddingInit(){
  const FD = faDyn();
  faChipRow('fa-wed-func', ['mehendi','sangeet','wedding','reception'].map(c => ({ code: c, label: FD ? FD.wedding('fn_' + c) : c, on: c === _wedFunc })), false, c => { _wedFunc = c; });
  faChipRow('fa-wed-role', ['own','sibling','friend','colleague'].map(c => ({ code: c, label: FD ? FD.wedding('role_' + c) : c, on: c === _wedRole })), false, c => { _wedRole = c; });
  const wearers = faWearers();
  if (!_wedMembers) _wedMembers = new Set(wearers.map(w => w.id));
  faChipRow('fa-wed-members', wearers.map(w => ({ code: w.id, label: '👤 ' + esc(w.name), on: _wedMembers.has(w.id) })), true, (id, on) => { if (on) _wedMembers.add(id); else _wedMembers.delete(id); });
}
// shared family-coordination renderer (used by Wedding Planner AND everyday Family coordination)
function faRenderCoordPlan(plan, host, headEmoji, headText){
  const FD = faDyn(); const wearers = faWearers();
  const nameOf = id => (wearers.find(w => w.id === id) || {}).name || id;
  const themeNote = FD ? FD.wedding(plan.familyPalette.undertone) : plan.familyPalette.note;
  const regionTip = (plan.familyPalette.regionCode && FD) ? FD.region(plan.familyPalette.regionCode) : '';
  let html = '<div class="fa-outfit"><div class="title">' + headEmoji + ' ' + esc(headText) + '</div>' +
    '<div class="why">🎨 ' + esc(FD ? FD.wedding('theme') : 'Family theme') + ': ' + esc(themeNote) + '</div>' +
    (regionTip ? '<div class="why" style="margin-top:4px">🪔 ' + esc(regionTip) + '</div>' : '') +
    '<div style="margin-top:4px">' + faConfBadge(plan.coordinationScore) + ' <span style="font-size:11px;color:#555">' + esc(FD ? FD.wedding('coordination') : 'Coordination') + '</span></div></div>';
  plan.perMember.forEach(pm => {
    const roleLbl = FD ? FD.wedding(pm.role) : pm.role;
    html += '<div style="margin-top:8px"><div style="font-weight:800;color:#000080;margin-bottom:2px">👤 ' + esc(nameOf(pm.wearer_id)) + ' · ' + esc(roleLbl) + '</div>';
    if (pm.outfit){ html += faRenderOutfitCard(pm.outfit); }
    else {
      const g = pm.gaps[0] || { ladder: ['buy'], code: 'no_match' };
      const ladder = g.ladder.map(step => FD ? FD.wedding(step) : step);
      const gapKey = g.code === 'no_festive' ? 'gap_no_festive' : 'gap_no_match';
      let line = (FD ? FD.wedding(gapKey) : 'No suitable outfit yet') + ' → ' + ladder.join(' · ');
      if (g.borrowFrom) line += ' (' + (FD ? FD.wedding('borrow_from') : 'borrow from') + ' ' + esc(nameOf(g.borrowFrom)) + ')';
      html += '<div class="fa-tier budget"><span class="lab">♻️</span><div>' + esc(line) + '</div></div>';
    }
    html += '</div>';
  });
  host.innerHTML = html;
  const sp = esc(headText) + '. ' + (FD ? FD.wedding('theme') : 'Theme') + ' ' + themeNote + '. ' +
    plan.perMember.map(pm => nameOf(pm.wearer_id) + ': ' + (pm.outfit ? (FD ? FD.wedding(pm.role) : pm.role) + ', ' + pm.outfit.items.map(it => (it.colour||'') + ' ' + it.category).join(', ') : (FD ? FD.wedding('gap_no_match') : 'gap'))).join('. ');
  host.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}
async function faGatherFamily(memberSet){
  const wearers = faWearers();
  const memberIds = (memberSet && memberSet.size) ? Array.from(memberSet) : wearers.map(w => w.id);
  const bandOf = id => (wearers.find(w => w.id === id) || {}).band;
  const raw = await faAllItemsRaw();
  const wardrobes = {}; memberIds.forEach(id => { wardrobes[id] = raw.filter(i => (i.wearer || 'me') === id); });
  const totalItems = memberIds.reduce((n, id) => n + wardrobes[id].length, 0);
  return { memberIds, wardrobes, totalItems, members: memberIds.map(id => ({ wearer_id: id, ageBand: bandOf(id) })) };
}
async function faWedding(){
  const host = document.getElementById('fa-wed-result'); const E = faEngine(); const FD = faDyn();
  if (!E) return;
  const g = await faGatherFamily(_wedMembers);
  if (!g.totalItems){ const m = CURRENT_LANG==='en'?'Add festive clothes for the family in the Almari + Family tabs first.':'पहले अलमारी + परिवार tab में त्योहारी कपड़े जोड़ें।'; host.innerHTML='<div class="sds-card">💍 '+esc(m)+'</div>'; host.dataset.spoken=m; faSpeak(m); return; }
  const plan = E.planWedding({ function: _wedFunc, role: _wedRole, season: PROFILE.season, culture: PROFILE.culture, members: g.members }, g.wardrobes);
  const headText = (FD ? FD.wedding('plan_title') : 'Family wedding plan') + ' · ' + (FD ? FD.wedding('fn_' + _wedFunc) : _wedFunc);
  faRenderCoordPlan(plan, host, '💍', headText);
}
/* ── 👨‍👩‍👧 Everyday Family coordination (any occasion) ── */
let _famOcc = '', _famMembers = null;
function faFamilyInit(){
  faBuildOccChips('fa-fam-occ', v => { _famOcc = v; });
  const wearers = faWearers();
  if (!_famMembers) _famMembers = new Set(wearers.map(w => w.id));
  faChipRow('fa-fam-members', wearers.map(w => ({ code: w.id, label: '👤 ' + esc(w.name), on: _famMembers.has(w.id) })), true, (id, on) => { if (on) _famMembers.add(id); else _famMembers.delete(id); });
}
async function faFamilyCoordinate(){
  const host = document.getElementById('fa-fam-result'); const E = faEngine(); const FD = faDyn();
  if (!E) return;
  const g = await faGatherFamily(_famMembers);
  if (!g.totalItems){ const m = CURRENT_LANG==='en'?'Add clothes for the family in the Almari + Family tabs first.':'पहले अलमारी + परिवार tab में कपड़े जोड़ें।'; host.innerHTML='<div class="sds-card">👨‍👩‍👧 '+esc(m)+'</div>'; host.dataset.spoken=m; faSpeak(m); return; }
  const occ = _famOcc || 'family';
  const plan = E.planFamily({ occasion: occ, season: PROFILE.season, culture: PROFILE.culture, members: g.members }, g.wardrobes);
  const headText = (FD ? FD.occ(occ) : occ);
  faRenderCoordPlan(plan, host, '👨‍👩‍👧', headText);
}

/* ── 📅 Office Week Planner ── */
const FA_WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri'];
function faWeekInit(){
  const FD = faDyn(); const host = document.getElementById('fa-week-rows'); if (!host || host.dataset.built) return;
  const dc = [['casual','dc_casual'],['smart','dc_smart'],['formal','dc_formal']];
  const wx = [['mod','wx_mod'],['hot','wx_hot'],['cold','wx_cold']];
  host.innerHTML = FA_WEEK_DAYS.map(day => {
    const dayLbl = FD ? FD.week(day) : day;
    const dcOpts = dc.map(([v, k]) => '<option value="' + v + '"' + (v === 'smart' ? ' selected' : '') + '>' + (FD ? FD.week(k) : v) + '</option>').join('');
    const wxOpts = wx.map(([v, k]) => '<option value="' + v + '">' + (FD ? FD.week(k) : v) + '</option>').join('');
    return '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">' +
      '<span style="min-width:74px;font-weight:700;font-size:13px">' + esc(dayLbl) + '</span>' +
      '<select class="fa-week-dc" data-day="' + day + '" style="flex:1;min-height:40px">' + dcOpts + '</select>' +
      '<select class="fa-week-wx" data-day="' + day + '" style="flex:1;min-height:40px">' + wxOpts + '</select></div>';
  }).join('');
  host.dataset.built = '1';
}
async function faOfficeWeek(){
  const host = document.getElementById('fa-office-result'); const E = faEngine(); const FD = faDyn();
  if (!E) return;
  const items = await faAllItems();
  if (!items.length){ const m = faMoreT('add_first'); host.innerHTML='<div class="sds-card">📅 '+esc(m)+'</div>'; host.dataset.spoken=m; faSpeak(m); return; }
  const dcs = document.querySelectorAll('.fa-week-dc'); const wxs = document.querySelectorAll('.fa-week-wx');
  const days = FA_WEEK_DAYS.map((day, i) => ({ day: day, dressCode: (dcs[i] ? dcs[i].value : 'smart'), weather: (wxs[i] ? wxs[i].value : 'mod') }));
  const plan = E.planWeek(items, days);
  if (!plan.days.some(d => d.outfit)){ const m = CURRENT_LANG==='en'?'Add a top + a bottom (and footwear) so Chitti can build office outfits.':'एक ऊपर + एक नीचे (और जूते) जोड़ें — फिर office outfit बनेंगे।'; host.innerHTML='<div class="sds-card">📅 '+esc(m)+'</div>'; host.dataset.spoken=m; faSpeak(m); return; }
  let html = '<div style="font-weight:800;color:#138808;margin-bottom:6px">📅 ' + esc(FD ? FD.week('plan_title') : 'Your office week') + '</div>';
  plan.days.forEach(d => {
    const dayLbl = FD ? FD.week(d.day) : d.day;
    html += '<div style="margin-top:6px"><div style="font-weight:800;color:#000080">' + esc(dayLbl) + (d.reused ? ' · <span style="font-size:11px;color:#b45309">' + esc(FD ? FD.week('reused') : '♻️ reused') + '</span>' : '') + '</div>';
    if (d.outfit) html += faRenderOutfitCard({ items: d.outfit.items, occasion: d.outfit.occasion, band: null, confidence: d.outfit.score, harmony: d.outfit.harmony, checks: null, reasons: [], explain: '', judge: { flags: [] } });
    html += '</div>';
  });
  html += '<div class="fa-tier free" style="margin-top:8px"><span class="lab">' + esc(FD ? FD.week('variety') : 'Variety') + '</span><div>' + plan.variety + '%</div></div>';
  if (plan.honest) html += '<div class="fa-tier budget"><span class="lab">🛒</span><div>' + esc(FD ? FD.week('honest_tip') : plan.honest) + '</div></div>';
  host.innerHTML = html;
  const sp = (FD ? FD.week('plan_title') : 'Office week') + '. ' + plan.days.filter(d=>d.outfit).map(d => (FD?FD.week(d.day):d.day) + ': ' + d.outfit.items.map(it => (it.colour||'') + ' ' + it.category).join(', ')).join('. ') + '. ' + (FD ? FD.week('variety') : 'Variety') + ' ' + plan.variety + '%';
  host.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ── 🌱 My impact — Founder Rule made visible (deterministic, on-device) ── */
async function faImpact(){
  const host = document.getElementById('fa-impact-result'); const E = faEngine(); const FD = faDyn();
  if (!E) return;
  const items = await faAllItems();
  const st = E.impactStats(items, faImpactLedger());
  const T = k => FD ? FD.impact(k) : k;
  const tiers = [];
  tiers.push('<div class="fa-tier free"><span class="lab">✅ ' + esc(T('outfits')) + '</span><div>' + st.outfits + ' · ₹0</div></div>');
  if (st.repairs) tiers.push('<div class="fa-tier free"><span class="lab">🩺 ' + esc(T('repairs')) + '</span><div>' + st.repairs + '</div></div>');
  if (st.moneySaved) tiers.push('<div class="fa-tier free"><span class="lab">💰 ' + esc(T('money')) + '</span><div>~₹' + st.moneySaved + '</div></div>');
  if (st.carbonSaved) tiers.push('<div class="fa-tier free"><span class="lab">🌍 ' + esc(T('carbon')) + '</span><div>~' + st.carbonSaved + ' kg CO₂</div></div>');
  if (st.costPerWear != null) tiers.push('<div class="fa-tier"><span class="lab">♻️ ' + esc(T('cpw')) + '</span><div>₹' + st.costPerWear + '</div></div>');
  if (st.wardrobeValue) tiers.push('<div class="fa-tier"><span class="lab">🧬 ' + esc(T('value')) + '</span><div>₹' + st.wardrobeValue + '</div></div>');
  const empty = (!st.repairs && !st.moneySaved && st.outfits === 0);
  let html = '<div class="fa-outfit"><div class="title">🌱 ' + esc(T('title')) + '</div>' +
    (empty ? '<div class="why">' + esc(T('none')) + '</div>' : '<div class="fa-tiers">' + tiers.join('') + '</div>' +
      '<div style="margin-top:6px;font-size:12px;color:#000080">♻️ ' + esc(T('note')) + '</div>') + '</div>';
  host.innerHTML = html;
  const sp = T('title') + '. ' + st.outfits + ' ' + T('outfits') + '. ' +
    (st.repairs ? st.repairs + ' ' + T('repairs') + ', ~₹' + st.moneySaved + ' ' + T('money') + ', ~' + st.carbonSaved + ' kg ' + T('carbon') + '.' : '');
  host.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ── 📏 My size — cross-brand guidance (deterministic, on-device) ── */
function faSizeInit(){
  const FD = faDyn();
  const ask = document.getElementById('fa-size-ask'); if (ask) ask.textContent = FD ? FD.size('ask') : '';
  const sel = document.getElementById('fa-size-base');
  if (sel && !sel.dataset.built){ sel.innerHTML = '<option value="">—</option>' + ['XS','S','M','L','XL','XXL'].map(s => '<option value="' + s + '">' + s + '</option>').join(''); sel.dataset.built = '1'; }
  // restore saved
  if (PROFILE.size){ const c = document.getElementById('fa-size-chest'); if (c && PROFILE.size.chestCm) c.value = PROFILE.size.chestCm; if (sel && PROFILE.size.base) sel.value = PROFILE.size.base; }
}
function faSizeGuide(){
  const host = document.getElementById('fa-size-result'); const E = faEngine(); const FD = faDyn();
  if (!E) return;
  const chest = parseInt((document.getElementById('fa-size-chest').value || '0'), 10) || 0;
  const base = document.getElementById('fa-size-base').value || '';
  const m = chest ? { chestCm: chest } : (base ? { base: base } : null);
  const g = m ? E.sizeGuide(m) : null;
  if (!g){ const msg = CURRENT_LANG==='en'?'Enter your chest in cm or pick a base size.':'अपना सीना cm में डालें या base size चुनें।'; host.innerHTML='<div class="sds-card">📏 '+esc(msg)+'</div>'; host.dataset.spoken=msg; faSpeak(msg); return; }
  PROFILE.size = { chestCm: chest || null, base: base || g.size }; faSaveProfile();
  const T = k => FD ? FD.size(k) : k;
  const rows = [['', T('your'), g.size], [T('india'), '', g.india], [T('us'), '', g.us], [T('uk'), '', g.uk], [T('eu'), '', g.eu]];
  let html = '<div class="fa-outfit"><div class="title">📏 ' + esc(T('your')) + ': ' + esc(g.size) + '</div>' +
    '<div class="fa-tiers">' +
    '<div class="fa-tier"><span class="lab">🇮🇳 ' + esc(T('india')) + '</span><div>' + esc(g.india) + '</div></div>' +
    '<div class="fa-tier"><span class="lab">🇺🇸 ' + esc(T('us')) + '</span><div>' + esc(g.us) + '</div></div>' +
    '<div class="fa-tier"><span class="lab">🇬🇧 ' + esc(T('uk')) + '</span><div>' + esc(g.uk) + '</div></div>' +
    '<div class="fa-tier"><span class="lab">🇪🇺 ' + esc(T('eu')) + '</span><div>' + esc(g.eu) + '</div></div>' +
    '</div><div class="why" style="margin-top:6px">ℹ️ ' + esc(T('note')) + '</div>' +
    '<div style="font-size:11px;color:#138808;margin-top:4px">✅ ' + esc(T('saved')) + '</div></div>';
  host.innerHTML = html;
  const sp = T('your') + ' ' + g.size + '. ' + T('india') + ' ' + g.india + ', ' + T('us') + ' ' + g.us + ', ' + T('uk') + ' ' + g.uk + ', ' + g.eu + '. ' + T('note');
  host.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ── 👵🧒 Senior & Kids Mode (adaptive dressing lens) ── */
function faModeInit(){
  const FD = faDyn();
  faChipRow('fa-mode-chips', ['senior','child','teen','adult'].map(c => ({ code: c, label: FD ? FD.mode(c) : c, on: (_faModeLens || 'adult') === c })), false, faModeLens);
}
async function faModeLens(band){
  _faModeLens = (band === 'adult') ? '' : band;
  const host = document.getElementById('fa-mode-result'); const E = faEngine(); const FD = faDyn();
  if (!E) return;
  const g = E.modeGuidance(band, PROFILE.disability || {});
  const title = FD ? FD.mode('title') : 'Dressing made easy';
  let html = '<div class="fa-outfit"><div class="title">' + (FD ? FD.mode(band) : band) + ' · ' + esc(title) + '</div>';
  if (!g.tips.length){ html += '<div class="why">' + esc(FD ? FD.mode('none') : 'No special adaptations — style as usual.') + '</div>'; }
  else {
    html += '<ul style="margin:6px 0 0 18px;line-height:1.7;font-size:13.5px">' +
      g.tips.map(t => '<li>' + esc(FD ? FD.mode(t) : t) + ' <button class="fa-spk" aria-label="🔊" onclick="faSpeak(this.previousSibling.textContent||\'\')">🔊</button></li>').join('') + '</ul>';
  }
  html += '</div>';
  // adapted outfits from the wardrobe under this lens (judge adds senior/child adaptations)
  const items = await faAllItems();
  if (items.length){
    const recs = E.recommend(items, faCtx({ max: 2 }));
    if (recs.length){ window._faLastItems = recs[0].items; recs.forEach(r => { html += faRenderOutfitCard(r); }); }
  }
  host.innerHTML = html;
  const sp = (FD ? FD.mode(band) : band) + '. ' + title + '. ' + g.tips.map(t => FD ? FD.mode(t) : t).join('. ');
  host.dataset.spoken = sp; faSpeak(sp);
  try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
}

/* ════════ boot ════════ */
function faWireLive(){
  document.querySelectorAll('.fa-result, #fa-coach-plan, #fa-twin-body').forEach(function(el){
    if (el && !el.getAttribute('aria-live')) { el.setAttribute('aria-live', 'polite'); el.setAttribute('role', 'status'); el.setAttribute('aria-atomic', 'false'); }
  });
}
function faBoot(){
  CURRENT_LANG = faDetectLang();
  document.documentElement.lang = CURRENT_LANG;
  // BO1 blind-first: every result host is an aria-live region so screen readers
  // announce results the moment they render (not only via TTS). role=status = polite.
  // Re-swept after init to catch dynamically-created hosts (e.g. the coach plan).
  faWireLive(); setTimeout(faWireLive, 1500);
  const sel = document.getElementById('lang-select'); if (sel) sel.value = CURRENT_LANG;
  faMaybeOnboard();
  try { localStorage.setItem('chitti_vaani_lang', CURRENT_LANG); } catch(e){}
  try { if (typeof window.faI18nApply === 'function') window.faI18nApply(CURRENT_LANG); } catch(e){}
  try { if (typeof window.updateAllStrings === 'function') window.updateAllStrings(CURRENT_LANG); } catch(e){}
  try { if (typeof window.faI18nGuard === 'function') { setTimeout(window.faI18nGuard, 100); setTimeout(window.faI18nGuard, 600); } } catch(e){}
  faRenderWearers();
  faTwinHydrate();
  faRenderWardrobe();
  faRenderTwin();
  faBuildOccChips('fa-review-occasions', v => { _selectedReviewOcc = v; });
  faBuildOccChips('fa-occasion-chips', v => { _selectedOcc = v; });
  try { faDoctorInit(); faWeekInit(); faWeddingInit(); faModeInit(); faFamilyInit(); faSizeInit(); } catch(e){}
  faInitCoach();
  // BO2 language — Vaani-canonical: wire the chitti:langchange listener once; chitti_lang.js
  // owns + populates #lang-select. faFixLangLabels is only a delayed SAFETY NET (does nothing
  // if chitti_lang.js already populated ≥9 options).
  faWireLangVaani();
  setTimeout(faFixLangLabels, 1500); setTimeout(faFixLangLabels, 3000);
}
function faInitCoach(){
  try {
    if (!window.FashionCoach) { setTimeout(faInitCoach, 300); return; }
    window.FashionCoach.renderRoles('fa-coach-host', function(role){
      window.FashionCoach.renderPlan(role, 'fa-coach-plan', CURRENT_LANG);
      faSpeak(window.FashionCoach.spoken(role, CURRENT_LANG));
      try { if (window.ChittiFeedback && ChittiFeedback.scan) ChittiFeedback.scan(); } catch(e){}
    });
  } catch(e){}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', faBoot);
else faBoot();
