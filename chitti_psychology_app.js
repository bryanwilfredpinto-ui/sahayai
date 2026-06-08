/* chitti_psychology_app.js — UI controller for Chitti Psychology.
   Wires the page to the DETERMINISTIC engine (chitti_psychology_os_engine.js).
   No network calls: the safe path is fully local. Crisis is checked FIRST on
   any free-text input. Voice-out via the a11y substrate when present. */
(function () {
  'use strict';
  var E = window.ChittiPsychologyEngine;
  if (!E) { console.error('Chitti Psychology engine not loaded'); return; }

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function speak(text) {
    try { if (window.Chitti && Chitti.a11y && Chitti.a11y.speak) Chitti.a11y.speak(text); } catch (e) {}
  }
  function render(id, html, voiceText) {
    var el = $(id); if (!el) return;
    el.innerHTML = html;
    if (voiceText) speak(voiceText);
  }

  // ── crisis card HTML (deterministic, from engine helpline config) ──
  function helplineHTML(list) {
    return list.map(function (h) {
      var tel = (h.number || '').replace(/[^0-9+]/g, '');
      return '<div class="help"><div><strong>' + esc(h.name) + '</strong><small>' + esc(h.hours || '') + ' · ' + esc(h.note || '') + '</small></div>' +
        '<a href="tel:' + esc(tel) + '">📞 ' + esc(h.number) + '</a></div>';
    }).join('');
  }
  function showCrisis(ack) {
    var list = E.helplines();
    $('crisis-helplines').innerHTML =
      (ack ? '<p style="font-weight:700;color:#8e1d17">' + esc(ack) + '</p>' : '') +
      '<p>' + esc(E.CRISIS_DISCLAIMER) + '</p>' + helplineHTML(list);
    var card = $('crisis-card');
    if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.focus && card.focus(); }
    speak('You are not alone. I am here with you. Tele-MANAS, one four four one six, is free and open all day and night.');
  }

  // ── Emotional Mirror (crisis-first) ──
  function doMirror() {
    var txt = ($('mirror-in') || {}).value || '';
    var crisis = E.detectCrisis(txt);
    if (crisis.level === 3) { showCrisis(crisis.message); return; }
    var m = E.mirrorEmotion(txt);
    var cope = E.copingFor(m.possible[0]);
    var html = '<p>' + esc(m.reflection) + '</p>' +
      '<div>' + m.possible.map(function (e) { return '<span class="em">' + esc(e) + '</span>'; }).join('') + '</div>' +
      '<p>' + esc(m.question) + '</p>' +
      '<p style="margin-top:8px"><strong>छोटे कदम / small steps:</strong></p><ul>' +
      cope.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
      '<p style="color:#475569;font-size:12.5px">' + esc(E.DISCLOSURE) + '</p>';
    render('mirror-out', html, m.reflection + ' ' + m.question);
  }

  // ── Calm Me Now ──
  function exercise(kind) {
    var x = kind === 'ground' ? E.grounding() : E.breathing(kind);
    var html = '<p><strong>' + esc(x.name) + '</strong></p><ul>' +
      x.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
      (x.rounds ? '<p>' + x.rounds + ' rounds · ' + esc(x.claim) + '</p>' : '<p>' + esc(x.claim) + '</p>');
    render('calm-out', html, x.name + '. ' + x.steps.join('. '));
  }

  // ── Coping by feeling ──
  function doCoping() {
    var c = E.copingFor(($('coping-sel') || {}).value || 'anxiety');
    var html = '<ul>' + c.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
      '<p style="color:#475569;font-size:12.5px">' + esc(c.note) + '</p>';
    render('coping-out', html, c.steps.join('. '));
  }

  // ── Psychoeducation ──
  function doEdu() {
    var p = E.psychoEd(($('edu-sel') || {}).value || 'anxiety');
    render('edu-out', '<p>' + esc(p.card) + '</p><p style="color:#475569;font-size:12.5px">' + esc(p.note) + '</p>', p.card);
  }

  // ── NVC composer ──
  function doNvc() {
    var r = E.nvcCompose({
      observation: ($('nvc-obs') || {}).value, feeling: ($('nvc-feel') || {}).value, need: ($('nvc-need') || {}).value
    });
    render('nvc-out', '<p>“' + esc(r.message) + '”</p><p style="color:#475569;font-size:12.5px">' + esc(r.frame) + ' · ' + esc(r.note) + '</p>', r.message);
  }

  // ── Parenting ──
  function doParent() {
    var g = E.parentingGuide(($('par-age') || {}).value, ($('par-beh') || {}).value);
    var html = '<p class="pill">' + esc(g.ageBand) + '</p>' +
      '<p><strong>शायद कारण / possible reasons:</strong> ' + esc(g.possibleReasons.join(', ')) + '</p>' +
      '<p>' + esc(g.guidance) + '</p>' +
      '<p><strong>बातचीत / try saying:</strong> “' + esc(g.conversation) + '”</p>' +
      '<p style="color:#475569;font-size:12.5px">' + esc(g.note) + '</p>';
    render('par-out', html, g.guidance + ' ' + g.conversation);
  }

  function on(id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); }

  function init() {
    // crisis path always rendered + reachable
    try { showCrisisStatic(); } catch (e) {}
    on('crisis-fab', 'click', function () { showCrisis(); });
    on('mirror-go', 'click', doMirror);
    on('calm-sigh', 'click', function () { exercise('sigh'); });
    on('calm-box', 'click', function () { exercise('box'); });
    on('calm-ground', 'click', function () { exercise('ground'); });
    on('coping-go', 'click', doCoping);
    on('edu-go', 'click', doEdu);
    on('nvc-go', 'click', doNvc);
    on('par-go', 'click', doParent);
  }
  // pre-fill the crisis card so helplines are visible even before any interaction
  function showCrisisStatic() {
    var box = $('crisis-helplines'); if (!box) return;
    box.innerHTML = '<p>' + esc(E.CRISIS_DISCLAIMER) + '</p>' + helplineHTML(E.helplines());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
