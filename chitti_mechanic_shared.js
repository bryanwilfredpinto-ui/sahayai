/* chitti_mechanic_shared.js — shared substrate for chitti_2wheeler.html +
 * chitti_4wheeler.html. Two SEPARATE Chittis (per Sire's locked rule), but
 * common substrate is allowed (same as chitti_a11y.js, feedback-widget.js).
 *
 * 2026-05-23: per Sire — every box must have voice-mic feedback option +
 * the speak prompts read in the user's selected language.
 */
(function(){
  'use strict';

  // ── strFor(key) — proxy to strings.js with safe fallback ──
  // 2W and 4W both call strFor2W() / strFor4W() for parity but they share
  // implementation: read from window.VAI_STRINGS[CURRENT_LANG] || .en.
  function strFor(key, lang){
    var L = lang || window.CURRENT_LANG || 'hi';
    var bag = (window.VAI_STRINGS && (window.VAI_STRINGS[L] || window.VAI_STRINGS.en)) || {};
    return (Object.prototype.hasOwnProperty.call(bag, key) ? bag[key]
         : (window.VAI_STRINGS && window.VAI_STRINGS.en && window.VAI_STRINGS.en[key])
         || key);
  }
  window.strFor2W = strFor;
  window.strFor4W = strFor;
  window.strForVehicle = strFor; // alias

  // ── Voice feedback (mic) — Web Speech API to populate a textarea ──
  // Used by the inline 👎 feedback panels: user taps 🎙️ and dictates in
  // their language. Falls back gracefully if browser lacks SpeechRecognition.
  var __FB_RECOG = null;
  var __FB_TARGET_ID = null;
  function bcp47(lang) {
    return ({
      hi:'hi-IN', en:'en-IN', ta:'ta-IN', te:'te-IN', bn:'bn-IN',
      mr:'mr-IN', gu:'gu-IN', kn:'kn-IN', ml:'ml-IN', pa:'pa-IN',
      or:'or-IN', as:'as-IN', ur:'ur-IN', sa:'sa-IN', ne:'ne-IN',
      mai:'hi-IN', kok:'hi-IN', doi:'hi-IN', ks:'hi-IN', sd:'hi-IN',
      mni:'hi-IN', sat:'hi-IN', bho:'hi-IN', raj:'hi-IN', kru:'hi-IN', hoc:'hi-IN'
    })[lang] || 'en-IN';
  }
  window.fbMicListen = function(targetId, btn){
    var lang = window.CURRENT_LANG || 'hi';
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      if (typeof window.speakText === 'function') window.speakText(strFor('fb.mic.unavailable'), lang);
      alert(strFor('fb.mic.unavailable'));
      return;
    }
    // Toggle if already listening
    if (__FB_RECOG) {
      try { __FB_RECOG.stop(); } catch(e){}
      __FB_RECOG = null;
      if (btn) btn.classList.remove('listening');
      return;
    }
    var r = new SR();
    r.lang = bcp47(lang);
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    __FB_RECOG = r;
    __FB_TARGET_ID = targetId;
    if (btn) btn.classList.add('listening');
    var finalText = '';
    r.onresult = function(e){
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      var target = document.getElementById(targetId);
      if (target) target.value = (finalText + interim).trim();
    };
    r.onend = function(){
      __FB_RECOG = null;
      if (btn) btn.classList.remove('listening');
    };
    r.onerror = function(){
      __FB_RECOG = null;
      if (btn) btn.classList.remove('listening');
    };
    try { r.start(); } catch(e) { __FB_RECOG = null; if (btn) btn.classList.remove('listening'); }
  };

  // ── Style the mic button + listening state ──
  if (!document.getElementById('chitti-fb-mic-styles')) {
    var style = document.createElement('style');
    style.id = 'chitti-fb-mic-styles';
    style.textContent = '.fb-mic-btn{background:#fff;border:1.5px solid var(--sds-line,#e5e7eb);border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;margin-top:6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;min-height:38px}.fb-mic-btn.listening{background:#fee2e2;border-color:#dc2626;color:#b91c1c;animation:fb-mic-pulse 1.2s ease-in-out infinite}@keyframes fb-mic-pulse{0%,100%{opacity:1}50%{opacity:.55}}';
    document.head.appendChild(style);
  }
})();
