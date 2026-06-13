/* cnai_onboarding.js
 * Chitti News AI — "How to use" onboarding card.
 *
 * A first-time user must understand the product in 60 seconds — no video, no docs.
 * Renders "🎓 How to use Chitti News AI" demo cards (each with a real ▶ Try that drives
 * the actual feature), a 🎯 icon legend, and example-persona buttons that pre-fill the
 * one-question profession entry ("I am a ___ for the last ___ years") and run the flow.
 * Voice-first: every card has 🔊 Listen; auto-reads for blind users via the Disability
 * Profile. Shows on first visit; reopen anytime via the header "🎓 How to use" button.
 *
 * Mirrors chitti_technical_ai_onboarding.js (same .ob* CSS contract). window.CNAIOnboard.
 */
(function (root, doc) {
  'use strict';
  var KEY = 'cnai_onboarded_v1';

  function $(id) { return doc.getElementById(id); }
  function speak(t) {
    try { if (root.Chitti && root.Chitti.a11y && root.Chitti.a11y.speak) return root.Chitti.a11y.speak(t); } catch (e) {}
    try { var u = new root.SpeechSynthesisUtterance(t); u.rate = 0.95; root.speechSynthesis.cancel(); root.speechSynthesis.speak(u); } catch (e) {}
  }
  function scrollTo(id) { try { if (root.ccScroll) return root.ccScroll(id); } catch (e) {} var el = $(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function isBlind() {
    try {
      var raw = root.localStorage.getItem('disability_profile') || root.localStorage.getItem('chitti_disability_profile') || '{}';
      var p = JSON.parse(raw);
      return !!(p && (p.blind || p.illiterate || (p.profiles && (p.profiles.blind || p.profiles.illiterate))));
    } catch (e) { return false; }
  }
  // Pre-fill the one-question entry and run it (so "Try" demonstrates the whole flow).
  function fillAsk(role, years) {
    try {
      var r = $('ask-role'); if (r) r.value = role;
      var y = $('ask-years'); if (y) y.value = years;
      if (root.cnaiAskSubmit) root.cnaiAskSubmit();
    } catch (e) {}
  }

  // Each card maps to a real section + action in the new IA.
  var CARDS = [
    { id: 'ask', emoji: '🙏', title: 'Tell Chitti about you', what: 'Say or type one line — "I am a ___ for the last ___ years". Chitti personalises everything to YOUR job. Any profession works.',
      bullets: ['Type, or tap 🎙️ and just say it', 'Works for any role — farmer to developer', 'Stored on your phone only'],
      steps: 'Fill the sentence at the top → tap "Show me my AI world".', tryLabel: '▶ Try: I am a Teacher · 12 yrs',
      action: function () { fillAsk('Teacher', 12); scrollTo('ask-section'); } },
    { id: 'news', emoji: '📰', title: 'Your AI news', what: 'The AI stories that actually matter to your job — most urgent first, with one line on why it matters to YOU.',
      bullets: ['🔴 Critical / 🟡 Important flags', 'Why this matters to your field', 'Real sources · tap to listen'],
      steps: 'Scroll to "Your AI news" → tap 🔊 on any card.', tryLabel: '▶ Try: see my news',
      action: function () { scrollTo('news-section'); } },
    { id: 'upgrade', emoji: '⭐', title: 'Your AI upgrade path', what: 'Which FREE AI tools and certificates to adopt — in order — to upgrade the work you already do.',
      bullets: ['Tap the tools you use today', 'Free tools + free certs, first', 'Tuned to your years of experience'],
      steps: 'Open "Your AI upgrade path" → tap your tools → Build.', tryLabel: '▶ Try: build my upgrade path',
      action: function () { scrollTo('upgrade-section'); } },
    { id: 'roadmap', emoji: '🗺️', title: 'Learn anything', what: 'Tell Chitti any skill — Chitti builds an ordered, foundations-first roadmap with free YouTube videos.',
      bullets: ['Any skill, any language', 'Right order — never a link dump', 'Free resources first'],
      steps: 'Learn deeper → 🗺️ Roadmap → type a skill.', tryLabel: '▶ Try: roadmap for Python',
      action: function () { scrollTo('learn-hub'); try { root.cnaiLearnTab && root.cnaiLearnTab('roadmap'); root.cnaiRoadmapBuild && root.cnaiRoadmapBuild('python'); } catch (e) {} } },
    { id: 'courses', emoji: '🆓', title: 'Free courses', what: 'Chitti finds FREE courses first — Govt of India, Google, Microsoft, NVIDIA. Paid only if nothing free fits, and it tells you why.',
      bullets: ['Free-first, always', 'Real providers + real links', 'Certificate: yes / no / fee shown'],
      steps: 'Learn deeper → 🆓 Free Courses → type a topic.', tryLabel: '▶ Try: free AI courses',
      action: function () { scrollTo('learn-hub'); try { root.cnaiLearnTab && root.cnaiLearnTab('courses'); root.cnaiCoursesBuild && root.cnaiCoursesBuild('artificial intelligence'); } catch (e) {} } },
    { id: 'analogy', emoji: '🧠', title: 'Teach me — my way', what: 'Pick a hard concept and an analogy you love — cricket, farming, cooking. Chitti explains it your way, and where the analogy breaks down.',
      bullets: ['Cricket · farming · cooking · Bollywood', 'Always tells you where it breaks', 'Never teaches a wrong model'],
      steps: 'Learn deeper → 🧠 Teach Me → pick concept + analogy.', tryLabel: '▶ Try: explain in cricket terms',
      action: function () { scrollTo('learn-hub'); try { root.cnaiLearnTab && root.cnaiLearnTab('analogy'); root.cnaiAnalogyGo && root.cnaiAnalogyGo(); } catch (e) {} } },
    { id: 'swarm', emoji: '🐝', title: 'Chitti Swarm', what: 'Give one big goal. Many helpers each learn one part, then combine into one roadmap and find links you would miss alone.',
      bullets: ['Many helpers, one goal', 'Cross-topic connections', 'Combined into one roadmap'],
      steps: 'Learn deeper → 🐝 Swarm → give a big goal.', tryLabel: '▶ Try: send the swarm',
      action: function () { scrollTo('learn-hub'); try { root.cnaiLearnTab && root.cnaiLearnTab('swarm'); var f = $('swarm-form'); if (f) f.dispatchEvent(new Event('submit', { cancelable: true })); } catch (e) {} } }
  ];

  var ICONS = [
    ['🔊', 'Read this box aloud'], ['🤖 / ▶', 'Chitti explains it in simple language'],
    ['👍', 'This helped me'], ['👎', 'This was wrong — tell Chitti why'],
    ['✏️', 'Write or speak feedback'], ['🎙️', 'Talk to Chitti (speak instead of type)'],
    ['🌐', 'Change language (26 Indian languages)'], ['🆓', 'This option is free'], ['💳', 'This option is paid']
  ];

  // Example professions — tapping fills the one-question entry and runs the flow.
  var PERSONAS = [
    { emoji: '🎯', role: 'Talent Acquisition', years: 20, label: 'Talent Acquisition · 20 yrs' },
    { emoji: '💻', role: 'Java Developer', years: 20, label: 'Java Developer · 20 yrs' },
    { emoji: '🌾', role: 'Farmer', years: 2, label: 'Farmer · 2 yrs' },
    { emoji: '🩹', role: 'Nurse', years: 8, label: 'Nurse · 8 yrs' },
    { emoji: '📚', role: 'Teacher', years: 12, label: 'Teacher · 12 yrs' }
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
    var html = '<section class="ob" role="region" aria-label="How to use Chitti News AI">' +
      '<div class="ob-head"><h2>🎓 How to use Chitti News AI <span>— in 60 seconds</span></h2>' +
      '<div class="ob-head-btns"><button type="button" id="cnai-ob-readall">🔊 Read this to me</button><button type="button" id="cnai-ob-dismiss" class="ghost">✓ Got it</button></div></div>' +
      '<p class="ob-intro">Tell Chitti your job in one line — <b>by voice, in your language</b>. Chitti then shows the AI news that matters to YOU and a free-first plan to upgrade your skills. Here is what each part does:</p>' +
      '<div class="ob-grid">' + CARDS.map(cardHTML).join('') + '</div>' +
      '<div class="ob-legend" role="region" aria-label="What the icons mean"><h3>🎯 What do these icons mean?</h3><table><tbody>' +
        ICONS.map(function (i) { return '<tr><td class="ob-ic">' + i[0] + '</td><td>' + i[1] + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="ob-personas" role="region" aria-label="First time here? Try an example profession"><h3>🎓 First time here? Tap an example — Chitti personalises everything:</h3><div class="ob-persona-row">' +
        PERSONAS.map(function (p, i) { return '<button type="button" class="ob-persona" data-ob-persona="' + i + '"><span aria-hidden="true">' + p.emoji + '</span> ' + p.label + '</button>'; }).join('') + '</div></div>' +
      '</section>';
    host.innerHTML = html;
    // wire
    Array.prototype.forEach.call(host.querySelectorAll('[data-ob-try]'), function (b) { b.onclick = function () { var c = CARDS.filter(function (x) { return x.id === b.getAttribute('data-ob-try'); })[0]; if (c) { hide(); try { c.action(); } catch (e) {} speak(c.title + '. ' + c.what); } }; });
    Array.prototype.forEach.call(host.querySelectorAll('[data-ob-listen]'), function (b) { b.onclick = function () { var c = CARDS.filter(function (x) { return x.id === b.getAttribute('data-ob-listen'); })[0]; if (c) speak(c.title + '. ' + c.what + ' ' + c.steps); }; });
    Array.prototype.forEach.call(host.querySelectorAll('[data-ob-persona]'), function (b) { b.onclick = function () { var p = PERSONAS[+b.getAttribute('data-ob-persona')]; hide(); fillAsk(p.role, p.years); speak('Personalising Chitti for a ' + p.role + ' with ' + p.years + ' years.'); }; });
    var rd = $('cnai-ob-readall'); if (rd) rd.onclick = readAll;
    var dm = $('cnai-ob-dismiss'); if (dm) dm.onclick = function () { hide(); speak('Okay. Tap "How to use" at the top any time.'); };
    try { if (root.ChittiFeedback && root.ChittiFeedback.scan) root.ChittiFeedback.scan(host); } catch (e) {}
  }

  function readAll() {
    var txt = 'How to use Chitti News AI. ' + CARDS.map(function (c) { return c.title + ': ' + c.what; }).join(' ') +
      ' The icons: speaker reads aloud, the robot explains simply, thumbs up and down give feedback, the pencil sends feedback, the mic lets you talk to Chitti.';
    speak(txt);
  }

  function show() { var h = $('onboarding-host'); if (!h) return; render(); h.style.display = ''; if (isBlind()) setTimeout(readAll, 700); }
  function hide() { var h = $('onboarding-host'); if (h) h.style.display = 'none'; try { root.localStorage.setItem(KEY, '1'); } catch (e) {} }
  function toggle() { var h = $('onboarding-host'); if (h && (h.style.display === 'none' || !h.innerHTML)) show(); else hide(); }

  function init() {
    var open = $('cnai-ob-open'); if (open) open.onclick = toggle;
    var seen = false; try { seen = !!root.localStorage.getItem(KEY); } catch (e) {}
    if (!seen) show(); else { var h = $('onboarding-host'); if (h) h.style.display = 'none'; }
  }

  root.CNAIOnboard = { show: show, hide: hide, toggle: toggle, init: init };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { setTimeout(init, 300); }); else setTimeout(init, 300);
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : null);
