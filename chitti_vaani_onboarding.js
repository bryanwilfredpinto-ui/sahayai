/* chitti_vaani_onboarding.js
 * 🎖️ World Class Chitti Vaani — Commando Discipline. Zero Excuses.
 *
 * Onboarding: a first-time user must understand Chitti Vaani in 60 seconds — no video, no docs.
 * Mirrors the Chitti Technical onboarding pattern (chitti_technical_ai_onboarding.js): a
 * "🚀 How to use Chitti — in 60 seconds" card grid (each card has 🔊 Listen + a ▶ Try that opens
 * that part of the app), a 🎯 icon legend, and a 🎓 "First time here?" persona picker that runs a
 * guided tour. Voice-first (every card speaks; auto-reads for blind users via the Disability
 * Profile). Shows on first visit; reopen anytime via the header "How to use" button.
 *
 * Golden Rule (SAHAYAI §2g): the ▶ Try buttons ONLY navigate to a tab — they never trigger a
 * side-effecting action (call/SMS/UPI/lock/…). Chitti always asks "Shall I?" first; onboarding
 * never bypasses that gate.
 *
 * Self-contained: injects its own CSS, so no edit to the page stylesheet is needed.
 * Exposes window.ChittiVaaniOnboard.
 */
(function (root, doc) {
  'use strict';
  var KEY = 'chitti_vaani_onboarded_v1';

  function $(id) { return doc.getElementById(id); }
  function lang() { try { return root.localStorage.getItem('chitti_vaani_lang') || 'hi'; } catch (e) { return 'hi'; } }
  function speak(t) {
    try { if (typeof root.speakText === 'function') return root.speakText(t, lang()); } catch (e) {}
    try { if (root.Chitti && root.Chitti.a11y && root.Chitti.a11y.speak) return root.Chitti.a11y.speak(t); } catch (e) {}
  }
  function go(tab) { try { if (typeof root.vaiSwitchTab === 'function') root.vaiSwitchTab(tab); } catch (e) {} }
  function isBlind() {
    var keys = ['disability_profile', 'chitti_disability_profile'];
    for (var i = 0; i < keys.length; i++) {
      try {
        var p = JSON.parse(root.localStorage.getItem(keys[i]) || '{}');
        if (p && (p.blind || (p.profiles && p.profiles.blind) || (p.needs && p.needs.indexOf && p.needs.indexOf('blind') !== -1))) return true;
      } catch (e) {}
    }
    return false;
  }

  // Vaani's six surfaces. ▶ Try = navigate only (Golden Rule safe).
  var CARDS = [
    { id: 'talk', emoji: '🎙️', title: 'Talk to Chitti', tab: 'talk',
      what: 'Tap the green mic and speak in your own language. Chitti listens, thinks, and reads the answer back aloud.',
      bullets: ['Voice in + voice out', '9 Indian languages', 'Ask anything — prices, health, schemes, news'],
      steps: 'Open Talk → tap the green mic → speak.', tryLabel: '▶ Try: open Talk' },
    { id: 'act', emoji: '⚡', title: 'Chitti can act for you', tab: 'act',
      what: 'Chitti can call, message, pay, lock your phone, open the camera and more — but it ALWAYS asks “Shall I?” first and never acts on its own.',
      bullets: ['Call · SMS · WhatsApp · UPI', 'Lock · silent · flashlight · camera', 'Maps · alarm · reminders'],
      steps: 'Open Actions → pick what you need → say “haan” to confirm.', tryLabel: '▶ Try: open Actions' },
    { id: 'circle', emoji: '👨‍👩‍👧', title: 'Your Circle', tab: 'circle',
      what: 'Add the family you trust. In an emergency Chitti rings your Circle — your family — and never the police.',
      bullets: ['Trusted family contacts', 'Family cascade in emergencies', 'You stay in control'],
      steps: 'Open Circle → add a family member.', tryLabel: '▶ Try: open Circle' },
    { id: 'vault', emoji: '🔒', title: 'Keys Vault', tab: 'vault',
      what: 'Keep documents and passwords safe on your own phone — locked with your fingerprint. They never leave your device.',
      bullets: ['Aadhaar, PAN, policies, passwords', 'Biometric lock', '“Chitti forget” wipes it anytime'],
      steps: 'Open Vault → add a document or password.', tryLabel: '▶ Try: open Vault' },
    { id: 'sos', emoji: '🆘', title: 'Emergency', tab: 'sos',
      what: 'Say “bachao” or “madad”, or tap SOS. Chitti raises the alarm — even on silent — and alerts your family. It never auto-dials the police.',
      bullets: ['Works even on silent mode', 'Alerts your Circle first', 'Never auto-dials 100 / 112'],
      steps: 'Open Emergency to see how the alarm + family cascade work.', tryLabel: '▶ Try: open Emergency' },
    { id: 'settings', emoji: '⚙️', title: 'Settings', tab: 'settings',
      what: 'Change your language, voice speed and text size, or turn on Grandparent mode — three big buttons and large font for elders.',
      bullets: ['26 Indian languages', 'Voice speed + font size', 'Grandparent mode'],
      steps: 'Open Settings → choose your language and comfort.', tryLabel: '▶ Try: open Settings' }
  ];

  var ICONS = [
    ['🔊', 'Read this box aloud'], ['🤖 / ▶', 'Chitti explains it in simple language'],
    ['👍', 'This helped me'], ['👎', 'This was wrong — tell Chitti why'],
    ['✏️', 'Write or speak feedback'], ['🎙️', 'Talk to Chitti'],
    ['🌐', 'Change language (26 Indian languages)'], ['🤟', 'Indian Sign Language'],
    ['🆘', 'Emergency — alerts your family, never the police']
  ];

  // Guided tour personas. Each opens a relevant tab and speaks a short intro.
  var PERSONAS = [
    { emoji: '🧓', label: 'Elderly parent', tab: 'settings', intro: 'Welcome. I opened Settings — turn on Grandparent mode for three big buttons and large text. Then tap the green mic and just talk to me in your language.' },
    { emoji: '🦯', label: 'I cannot see', tab: 'talk', intro: 'Welcome. Chitti is voice-first. Tap anywhere and I will read it aloud. Tap the green mic and speak — I will listen, think, and read the answer back to you.' },
    { emoji: '🤟', label: 'I am Deaf / use ISL', tab: 'talk', intro: 'Welcome. Every answer is shown in text with symbols, and the Indian Sign Language panel signs it for you. You never need to hear anything.' },
    { emoji: '🔇', label: 'I cannot speak', tab: 'act', intro: 'Welcome. You can do everything by tapping — no voice needed. When Chitti asks “Shall I?”, just tap Yes or No.' },
    { emoji: '📱', label: 'New to smartphones', tab: 'talk', intro: 'Welcome. This is easy. Tap the big green microphone and say what you need — like “call my son” or “what is the price of paracetamol”. Chitti does the rest, and always asks before doing anything.' }
  ];

  function injectCSS() {
    if ($('chitti-vaani-ob-css')) return;
    var css = '' +
      '#onboarding-host .ob{background:#fff;border:2px solid var(--vai-saffron,#E86A17);border-radius:16px;padding:16px;margin:6px 0 16px}' +
      '#onboarding-host .ob-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
      '#onboarding-host .ob-head h2{margin:0;color:var(--vai-navy,#0E2344);font-size:1.2rem}' +
      '#onboarding-host .ob-head h2 span{font-weight:400;color:#5b637a;font-size:.9rem}' +
      '#onboarding-host .ob-head-btns{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}' +
      '#onboarding-host .ob-head-btns button{min-height:44px;padding:8px 14px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;border:2px solid var(--vai-navy,#0E2344);background:var(--vai-navy,#0E2344);color:#fff}' +
      '#onboarding-host .ob-head-btns button.ghost{background:#fff;color:var(--vai-navy,#0E2344)}' +
      '#onboarding-host .ob-intro{color:#1A1A1A;margin:8px 0 12px}' +
      '#onboarding-host .ob-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}' +
      '#onboarding-host .ob-card{border:1px solid #e3e6ee;border-radius:12px;padding:12px;background:#F8F4EE;display:flex;flex-direction:column}' +
      '#onboarding-host .ob-card-h{display:flex;align-items:center;gap:8px}' +
      '#onboarding-host .ob-card-h h4{margin:0;color:var(--vai-navy,#0E2344);font-size:1.02rem;flex:1}' +
      '#onboarding-host .ob-emoji{font-size:1.4rem}' +
      '#onboarding-host .ob-listen{min-height:44px;min-width:44px;padding:6px 10px;background:#fff;color:var(--vai-navy,#0E2344);border:2px solid var(--vai-navy,#0E2344);border-radius:10px;cursor:pointer}' +
      '#onboarding-host .ob-what{margin:8px 0;font-size:.92rem;color:#1A1A1A}' +
      '#onboarding-host .ob-bul{margin:0 0 8px;padding-left:18px;font-size:.88rem;color:#333}' +
      '#onboarding-host .ob-bul li{margin:2px 0}' +
      '#onboarding-host .ob-steps{font-size:.85rem;background:#fff;border-left:4px solid var(--vai-green,#16a34a);padding:6px 8px;border-radius:6px;margin:0 0 10px;color:#1A1A1A}' +
      '#onboarding-host .ob-try{margin-top:auto;min-height:44px;padding:8px 14px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;background:var(--vai-green,#16a34a);color:#fff;border:2px solid #0f7a36}' +
      '#onboarding-host .ob-legend{margin-top:14px;background:#eef;border-radius:12px;padding:12px}' +
      '#onboarding-host .ob-legend h3,#onboarding-host .ob-personas h3{margin:0 0 8px;color:var(--vai-navy,#0E2344);font-size:1.02rem}' +
      '#onboarding-host .ob-legend td{border:0;padding:4px 10px 4px 0}' +
      '#onboarding-host .ob-ic{font-size:1.2rem;white-space:nowrap}' +
      '#onboarding-host .ob-personas{margin-top:14px;background:#fff3e0;border-radius:12px;padding:12px}' +
      '#onboarding-host .ob-persona-row{display:flex;gap:8px;flex-wrap:wrap}' +
      '#onboarding-host .ob-persona{min-height:44px;padding:8px 14px;border-radius:10px;background:#fff;color:var(--vai-navy,#0E2344);border:2px solid var(--vai-saffron,#E86A17);font-weight:700;cursor:pointer;font-family:inherit}';
    var s = doc.createElement('style'); s.id = 'chitti-vaani-ob-css'; s.textContent = css; doc.head.appendChild(s);
  }

  function cardHTML(c) {
    return '<div class="ob-card" data-ob="' + c.id + '"><div class="ob-card-h"><span class="ob-emoji" aria-hidden="true">' + c.emoji + '</span><h4>' + c.title + '</h4>' +
      '<button type="button" class="ob-listen" data-ob-listen="' + c.id + '" aria-label="Listen to ' + c.title + '">🔊</button></div>' +
      '<p class="ob-what">' + c.what + '</p><ul class="ob-bul">' + c.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>' +
      '<p class="ob-steps"><b>How:</b> ' + c.steps + '</p>' +
      '<button type="button" class="ob-try" data-ob-try="' + c.id + '">' + c.tryLabel + '</button></div>';
  }

  function render() {
    var host = $('onboarding-host'); if (!host) return;
    injectCSS();
    host.innerHTML = '<section class="ob" role="region" aria-label="How to use Chitti Vaani">' +
      '<div class="ob-head"><h2>🚀 How to use Chitti <span>— in 60 seconds</span></h2>' +
      '<div class="ob-head-btns"><button type="button" id="vob-readall">🔊 Read this to me</button><button type="button" id="vob-dismiss" class="ghost">✓ Got it</button></div></div>' +
      '<p class="ob-intro">Chitti is your voice-first dost — <b>speak in your language</b> and it helps with money, health, government, news and more. It coaches and protects; it <b>always asks before it acts</b>. Here is what each part does:</p>' +
      '<div class="ob-grid">' + CARDS.map(cardHTML).join('') + '</div>' +
      '<div class="ob-legend" role="region" aria-label="What the icons mean"><h3>🎯 What do these icons mean?</h3><table><tbody>' +
        ICONS.map(function (i) { return '<tr><td class="ob-ic">' + i[0] + '</td><td>' + i[1] + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="ob-personas" role="region" aria-label="First time here? Choose your style"><h3>🎓 First time here? Pick one — Chitti gives you a guided tour:</h3><div class="ob-persona-row">' +
        PERSONAS.map(function (p, i) { return '<button type="button" class="ob-persona" data-ob-persona="' + i + '"><span aria-hidden="true">' + p.emoji + '</span> ' + p.label + '</button>'; }).join('') + '</div></div>' +
      '</section>';
    Array.prototype.forEach.call(host.querySelectorAll('[data-ob-try]'), function (b) { b.onclick = function () { var c = CARDS.filter(function (x) { return x.id === b.getAttribute('data-ob-try'); })[0]; if (c) { hide(); go(c.tab); speak(c.title + '. ' + c.what); } }; });
    Array.prototype.forEach.call(host.querySelectorAll('[data-ob-listen]'), function (b) { b.onclick = function () { var c = CARDS.filter(function (x) { return x.id === b.getAttribute('data-ob-listen'); })[0]; if (c) speak(c.title + '. ' + c.what + ' ' + c.steps); }; });
    Array.prototype.forEach.call(host.querySelectorAll('[data-ob-persona]'), function (b) { b.onclick = function () { tour(PERSONAS[+b.getAttribute('data-ob-persona')]); }; });
    var rd = $('vob-readall'); if (rd) rd.onclick = readAll;
    var dm = $('vob-dismiss'); if (dm) dm.onclick = function () { hide(); speak('Okay. Tap “How to use” at the top any time.'); };
  }

  function readAll() {
    speak('How to use Chitti, in 60 seconds. ' + CARDS.map(function (c) { return c.title + ': ' + c.what; }).join(' ') +
      ' The icons: the speaker reads aloud, the robot explains simply, thumbs up and down give feedback, the pencil sends feedback, the mic talks to Chitti, and SOS alerts your family.');
  }

  function tour(p) { hide(); go(p.tab); speak(p.intro); }

  function show() { var h = $('onboarding-host'); if (!h) return; render(); h.style.display = ''; try { h.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} if (isBlind()) setTimeout(readAll, 600); }
  function hide() { var h = $('onboarding-host'); if (h) h.style.display = 'none'; try { root.localStorage.setItem(KEY, '1'); } catch (e) {} }
  function toggle() { var h = $('onboarding-host'); if (h && (h.style.display === 'none' || !h.innerHTML)) show(); else hide(); }

  function init() {
    var open = $('ob-open'); if (open) { open.onclick = function (e) { try { e.preventDefault(); } catch (x) {} toggle(); return false; }; }
    var seen = false; try { seen = !!root.localStorage.getItem(KEY); } catch (e) {}
    var h = $('onboarding-host');
    // Only auto-open on first visit AND after the user has accepted the consent gate,
    // so it never fights the Terms overlay.
    var consented = false; try { consented = root.localStorage.getItem('chitti_vaani_consent_given') === '1'; } catch (e) {}
    if (!seen && consented) show(); else if (h) h.style.display = 'none';
  }

  root.ChittiVaaniOnboard = { show: show, hide: hide, toggle: toggle, init: init };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { setTimeout(init, 400); }); else setTimeout(init, 400);
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : null);
