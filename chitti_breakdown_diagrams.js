/* chitti_breakdown_diagrams.js — Roadside Self-Fix LOCATOR diagrams (OFFLINE, no network).
 * Loaded by chitti_2wheeler.html (BIKE) + chitti_4wheeler.html (CAR), referenced by
 * chitti_breakdown_kb.js scenario steps. Pure inline SVG. The #1 reason a roadside self-fix
 * fails is the stranded user can NOT find the part — these diagrams point a big arrow at it.
 *
 * Palette: Saffron #FF9933 · Navy #000080 · Green #138808 · Danger red #ef4444 · Grey context.
 * §6 technical terms (RES, 12V, HV, MIN, MAX, +, −) stay as symbols/English inside the SVG and
 * the caption. Every other word in the caption is a real 9-language translation, native script.
 *
 * API (window.ChittiBreakdownDiagrams):
 *   get(key)        → { svg, label:{en,hi,ta,te,bn,mr,gu,kn,ml} } | null
 *   render(key, fn) → HTML string: SVG + translatable caption. fn(labelObj) picks the language;
 *                     if fn is omitted, English caption is used. SVG carries role="img" + <title>
 *                     + aria-label (English) for screen readers.
 *   keys()          → array of all diagram keys.
 */
(function () {
  'use strict';

  var C = {
    saffron: '#FF9933',
    navy: '#000080',
    green: '#138808',
    red: '#ef4444',
    grey: '#9ca3af',
    greyD: '#4b5563',
    greyL: '#e5e7eb',
    ink: '#111827',
    paper: '#ffffff'
  };

  // Short lang helper: L(en,hi,ta,te,bn,mr,gu,kn,ml)
  function L(en, hi, ta, te, bn, mr, gu, kn, ml) {
    return { en: en, hi: hi, ta: ta, te: te, bn: bn, mr: mr, gu: gu, kn: kn, ml: ml };
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Wrap raw inner SVG markup into a labelled, accessible <svg>. `alt` = English a11y text.
  function svg(alt, inner) {
    var tid = 't' + (Math.random().toString(36).slice(2, 8));
    return '<svg viewBox="0 0 320 200" width="100%" preserveAspectRatio="xMidYMid meet" ' +
      'xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="' + tid + '" ' +
      'aria-label="' + esc(alt) + '" style="max-width:320px;display:block;background:' + C.paper + '">' +
      '<title id="' + tid + '">' + esc(alt) + '</title>' + inner + '</svg>';
  }

  // Reusable bits ----------------------------------------------------------
  // Big saffron "look here" arrow pointing from (x1,y1) toward target (x2,y2).
  function arrow(x1, y1, x2, y2, col) {
    col = col || C.saffron;
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + col + '" stroke-width="5" stroke-linecap="round" marker-end="url(#ar_' +
      col.replace('#', '') + ')"/>';
  }
  // arrowhead defs for a given colour
  function ahead(col) {
    return '<marker id="ar_' + col.replace('#', '') + '" viewBox="0 0 10 10" refX="8" refY="5" ' +
      'markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M0 0L10 5L0 10z" fill="' + col + '"/></marker>';
  }
  function ringHi(cx, cy, r, col) {
    col = col || C.saffron;
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + col +
      '" stroke-width="4" stroke-dasharray="6 5"/>';
  }
  function txt(x, y, s, opts) {
    opts = opts || {};
    return '<text x="' + x + '" y="' + y + '" font-family="Arial,Helvetica,sans-serif" font-size="' +
      (opts.size || 13) + '" font-weight="' + (opts.weight || 'bold') + '" fill="' +
      (opts.fill || C.ink) + '" text-anchor="' + (opts.anchor || 'start') + '">' + esc(s) + '</text>';
  }

  // ── DIAGRAM DEFINITIONS ─────────────────────────────────────────────────
  var D = {};

  // 1) fuel_tap — carb petcock OFF / ON / RES
  D.fuel_tap = {
    label: L(
      'Fuel tap — turn down to RES (reserve)',
      'फ्यूल टैप — नीचे RES (रिज़र्व) पर घुमाएँ',
      'எரிபொருள் டேப் — கீழே RES (ரிசர்வ்) பக்கம் திருப்பவும்',
      'ఫ్యూయెల్ ట్యాప్ — కిందికి RES (రిజర్వ్) వైపు తిప్పండి',
      'ফুয়েল ট্যাপ — নিচে RES (রিজার্ভ) দিকে ঘোরান',
      'फ्यूएल टॅप — खाली RES (रिझर्व्ह) कडे फिरवा',
      'ફ્યુઅલ ટૅપ — નીચે RES (રિઝર્વ) તરફ ફેરવો',
      'ಫ್ಯೂಯಲ್ ಟ್ಯಾಪ್ — ಕೆಳಗೆ RES (ರಿಸರ್ವ್) ಕಡೆ ತಿರುಗಿಸಿ',
      'ഫ്യൂവൽ ടാപ്പ് — താഴേക്ക് RES (റിസർവ്) വശത്തേക്ക് തിരിക്കുക'),
    inner:
      ahead(C.saffron) +
      // tank underside + tap body
      '<path d="M70 36 H250 a14 14 0 0 1 14 14 V70 H56 V50 a14 14 0 0 1 14 -14 z" fill="' + C.greyL + '" stroke="' + C.greyD + '" stroke-width="2"/>' +
      '<rect x="138" y="70" width="44" height="40" rx="5" fill="' + C.navy + '"/>' +
      // lever pointing down to RES
      '<circle cx="160" cy="90" r="9" fill="' + C.paper + '"/>' +
      '<rect x="155" y="90" width="10" height="34" rx="4" fill="' + C.saffron + '" stroke="' + C.ink + '" stroke-width="1.5"/>' +
      // position labels around tap
      txt(108, 95, 'OFF', { fill: C.greyD, anchor: 'end' }) +
      txt(212, 95, 'ON', { fill: C.greyD }) +
      txt(160, 150, 'RES', { fill: C.green, anchor: 'middle', size: 15 }) +
      ringHi(160, 110, 26, C.saffron) +
      arrow(250, 150, 192, 118, C.saffron) +
      txt(255, 156, '←', { fill: C.saffron, size: 1 })
  };

  // 2) kill_switch — handlebar red run/stop
  D.kill_switch = {
    label: L(
      'Kill switch — flip the red switch to RUN (down)',
      'किल स्विच — लाल स्विच को RUN (नीचे) करें',
      'கில் ஸ்விட்ச் — சிவப்பு ஸ்விட்சை RUN (கீழே) வைக்கவும்',
      'కిల్ స్విచ్ — ఎరుపు స్విచ్‌ను RUN (కింద) పెట్టండి',
      'কিল সুইচ — লাল সুইচ RUN (নিচে) করুন',
      'किल स्विच — लाल स्विच RUN (खाली) करा',
      'કિલ સ્વિચ — લાલ સ્વિચ RUN (નીચે) કરો',
      'ಕಿಲ್ ಸ್ವಿಚ್ — ಕೆಂಪು ಸ್ವಿಚ್ ಅನ್ನು RUN (ಕೆಳಗೆ) ಮಾಡಿ',
      'കിൽ സ്വിച്ച് — ചുവന്ന സ്വിച്ച് RUN (താഴെ) ആക്കുക'),
    inner:
      ahead(C.saffron) +
      // handlebar
      '<rect x="20" y="120" width="280" height="16" rx="8" fill="' + C.greyD + '"/>' +
      '<rect x="40" y="108" width="60" height="40" rx="8" fill="' + C.ink + '"/>' +
      // switch housing (right cluster)
      '<rect x="150" y="78" width="92" height="58" rx="9" fill="#1f2937" stroke="' + C.greyD + '" stroke-width="2"/>' +
      // red rocker switch
      '<rect x="172" y="92" width="48" height="30" rx="5" fill="' + C.red + '" stroke="' + C.ink + '" stroke-width="2"/>' +
      txt(196, 90, 'STOP', { fill: C.red, anchor: 'middle', size: 10 }) +
      txt(196, 134, 'RUN', { fill: C.green, anchor: 'middle', size: 11 }) +
      // big O / | universal symbols on rocker
      '<circle cx="186" cy="100" r="4" fill="none" stroke="' + C.paper + '" stroke-width="2"/>' +
      '<line x1="206" y1="112" x2="206" y2="120" stroke="' + C.paper + '" stroke-width="2.5"/>' +
      ringHi(196, 107, 34, C.saffron) +
      arrow(280, 48, 232, 92, C.saffron)
  };

  // 3) side_stand — up (ride) vs down (parked)
  D.side_stand = {
    label: L(
      'Side stand must be UP before it will start',
      'चालू होने से पहले साइड स्टैंड ऊपर करें',
      'ஸ்டார்ட் ஆவதற்கு முன் சைடு ஸ்டாண்டை மேலே போடவும்',
      'స్టార్ట్ అయ్యే ముందు సైడ్ స్టాండ్‌ను పైకి ఎత్తండి',
      'স্টার্ট হওয়ার আগে সাইড স্ট্যান্ড উপরে তুলুন',
      'सुरू होण्याआधी साइड स्टँड वर करा',
      'ચાલુ થાય તે પહેલાં સાઇડ સ્ટેન્ડ ઉપર કરો',
      'ಸ್ಟಾರ್ಟ್ ಆಗುವ ಮೊದಲು ಸೈಡ್ ಸ್ಟ್ಯಾಂಡ್ ಮೇಲಕ್ಕೆ ಮಾಡಿ',
      'സ്റ്റാർട്ട് ആകുന്നതിന് മുമ്പ് സൈഡ് സ്റ്റാൻഡ് മുകളിലേക്ക് ഉയർത്തുക'),
    inner:
      ahead(C.green) +
      // ground
      '<line x1="0" y1="170" x2="320" y2="170" stroke="' + C.greyD + '" stroke-width="3"/>' +
      // bike body hint + footpeg pivot
      '<rect x="120" y="60" width="120" height="20" rx="10" fill="' + C.greyL + '" stroke="' + C.greyD + '" stroke-width="2"/>' +
      '<circle cx="150" cy="92" r="6" fill="' + C.ink + '"/>' +
      // DOWN stand (red, bad) on the left
      '<line x1="100" y1="92" x2="78" y2="168" stroke="' + C.red + '" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="100" cy="92" r="6" fill="' + C.red + '"/>' +
      txt(70, 186, '✕ DOWN', { fill: C.red, anchor: 'middle', size: 12 }) +
      // UP stand (green, good) folded along the frame on the right
      '<line x1="150" y1="92" x2="210" y2="100" stroke="' + C.green + '" stroke-width="8" stroke-linecap="round"/>' +
      txt(214, 96, '✓ UP', { fill: C.green, size: 12 }) +
      arrow(238, 130, 200, 102, C.green)
  };

  // 4) battery_terminals — + red, − black, arrows to bolts
  D.battery_terminals = {
    label: L(
      'Battery — + is red, − is black; tighten the bolts',
      'बैटरी — + लाल, − काला; बोल्ट कसें',
      'பேட்டரி — + சிவப்பு, − கருப்பு; போல்ட்டை இறுக்கவும்',
      'బ్యాటరీ — + ఎరుపు, − నలుపు; బోల్ట్‌లను బిగించండి',
      'ব্যাটারি — + লাল, − কালো; বোল্ট শক্ত করুন',
      'बॅटरी — + लाल, − काळा; बोल्ट घट्ट करा',
      'બેટરી — + લાલ, − કાળો; બોલ્ટ કસો',
      'ಬ್ಯಾಟರಿ — + ಕೆಂಪು, − ಕಪ್ಪು; ಬೋಲ್ಟ್‌ಗಳನ್ನು ಬಿಗಿಗೊಳಿಸಿ',
      'ബാറ്ററി — + ചുവപ്പ്, − കറുപ്പ്; ബോൾട്ടുകൾ മുറുക്കുക'),
    inner:
      ahead(C.red) + ahead(C.ink) +
      '<rect x="70" y="70" width="180" height="90" rx="8" fill="' + C.greyL + '" stroke="' + C.greyD + '" stroke-width="2"/>' +
      '<rect x="70" y="70" width="180" height="16" rx="6" fill="' + C.greyD + '"/>' +
      // + terminal (red)
      '<rect x="92" y="56" width="26" height="22" rx="4" fill="' + C.red + '"/>' +
      '<circle cx="105" cy="67" r="6" fill="' + C.ink + '"/>' +
      txt(105, 50, '+', { fill: C.red, anchor: 'middle', size: 20 }) +
      // − terminal (black)
      '<rect x="202" y="56" width="26" height="22" rx="4" fill="' + C.ink + '"/>' +
      '<circle cx="215" cy="67" r="6" fill="' + C.greyL + '"/>' +
      txt(215, 50, '−', { fill: C.ink, anchor: 'middle', size: 22 }) +
      txt(160, 125, '12V', { fill: C.navy, anchor: 'middle', size: 16 }) +
      arrow(125, 110, 108, 78, C.red) +
      arrow(195, 110, 212, 78, C.ink)
  };

  // 5) fuse_box — good vs blown (broken metal strip)
  D.fuse_box = {
    label: L(
      'Fuse box — a blown fuse has a broken metal strip',
      'फ्यूज़ बॉक्स — उड़े फ्यूज़ की धातु पट्टी टूटी होती है',
      'ஃப்யூஸ் பெட்டி — அடித்த ஃப்யூஸின் உலோகப் பட்டை உடைந்திருக்கும்',
      'ఫ్యూజ్ బాక్స్ — కాలిన ఫ్యూజ్‌లో లోహపు పట్టీ తెగి ఉంటుంది',
      'ফিউজ বক্স — পুড়ে যাওয়া ফিউজের ধাতব পাত ভাঙা থাকে',
      'फ्यूज बॉक्स — उडालेल्या फ्यूजची धातूची पट्टी तुटलेली असते',
      'ફ્યુઝ બોક્સ — ઊડેલા ફ્યુઝની ધાતુની પટ્ટી તૂટેલી હોય છે',
      'ಫ್ಯೂಸ್ ಬಾಕ್ಸ್ — ಹೊಡೆದ ಫ್ಯೂಸ್‌ನ ಲೋಹದ ಪಟ್ಟಿ ತುಂಡಾಗಿರುತ್ತದೆ',
      'ഫ്യൂസ് ബോക്സ് — കത്തിയ ഫ്യൂസിന്റെ ലോഹപ്പട്ടി പൊട്ടിയിരിക്കും'),
    inner:
      ahead(C.red) +
      '<rect x="40" y="40" width="240" height="120" rx="8" fill="#1f2937" stroke="' + C.ink + '" stroke-width="2"/>' +
      // GOOD fuse (left) — saffron body, continuous strip
      '<rect x="78" y="66" width="52" height="68" rx="6" fill="' + C.saffron + '" stroke="' + C.ink + '" stroke-width="2"/>' +
      '<path d="M90 78 L90 96 L118 104 L118 122" fill="none" stroke="' + C.ink + '" stroke-width="3"/>' +
      txt(104, 150, '✓ OK', { fill: C.green, anchor: 'middle', size: 12 }) +
      // BLOWN fuse (right) — grey body, BROKEN strip with gap
      '<rect x="190" y="66" width="52" height="68" rx="6" fill="' + C.grey + '" stroke="' + C.ink + '" stroke-width="2"/>' +
      '<path d="M202 78 L202 94 L210 100" fill="none" stroke="' + C.ink + '" stroke-width="3"/>' +
      '<path d="M230 122 L230 108 L224 104" fill="none" stroke="' + C.ink + '" stroke-width="3"/>' +
      txt(216, 100, '✕', { fill: C.red, anchor: 'middle', size: 16 }) +
      txt(216, 150, 'BLOWN', { fill: C.red, anchor: 'middle', size: 11 }) +
      arrow(250, 188, 224, 138, C.red) +
      '<line x1="40" y1="188" x2="40" y2="188" stroke="none"/>'
  };

  // 6) jumper_hookup — RED +→+, BLACK −→bare metal, order 1-2-3-4
  D.jumper_hookup = {
    label: L(
      'Jump start order: 1 RED+ dead, 2 RED+ good, 3 BLACK− good, 4 BLACK− bare metal',
      'जम्प स्टार्ट क्रम: 1 लाल+ डेड, 2 लाल+ अच्छी, 3 काला− अच्छी, 4 काला− नंगी धातु',
      'ஜம்ப் ஸ்டார்ட் வரிசை: 1 சிவப்பு+ டெட், 2 சிவப்பு+ நல்லது, 3 கருப்பு− நல்லது, 4 கருப்பு− வெறும் உலோகம்',
      'జంప్ స్టార్ట్ క్రమం: 1 ఎరుపు+ డెడ్, 2 ఎరుపు+ మంచిది, 3 నలుపు− మంచిది, 4 నలుపు− ఖాళీ లోహం',
      'জাম্প স্টার্ট ক্রম: 1 লাল+ ডেড, 2 লাল+ ভালো, 3 কালো− ভালো, 4 কালো− খালি ধাতু',
      'जम्प स्टार्ट क्रम: 1 लाल+ डेड, 2 लाल+ चांगली, 3 काळा− चांगली, 4 काळा− उघडी धातू',
      'જમ્પ સ્ટાર્ટ ક્રમ: 1 લાલ+ ડેડ, 2 લાલ+ સારી, 3 કાળો− સારી, 4 કાળો− ખુલ્લી ધાતુ',
      'ಜಂಪ್ ಸ್ಟಾರ್ಟ್ ಕ್ರಮ: 1 ಕೆಂಪು+ ಡೆಡ್, 2 ಕೆಂಪು+ ಒಳ್ಳೆಯದು, 3 ಕಪ್ಪು− ಒಳ್ಳೆಯದು, 4 ಕಪ್ಪು− ಬರಿ ಲೋಹ',
      'ജമ്പ് സ്റ്റാർട്ട് ക്രമം: 1 ചുവപ്പ്+ ഡെഡ്, 2 ചുവപ്പ്+ നല്ലത്, 3 കറുപ്പ്− നല്ലത്, 4 കറുപ്പ്− തുറന്ന ലോഹം'),
    inner:
      // DEAD battery (left), GOOD battery (right)
      '<rect x="20" y="96" width="110" height="70" rx="6" fill="' + C.greyL + '" stroke="' + C.greyD + '" stroke-width="2"/>' +
      '<rect x="190" y="96" width="110" height="70" rx="6" fill="' + C.greyL + '" stroke="' + C.greyD + '" stroke-width="2"/>' +
      txt(75, 160, 'DEAD', { fill: C.greyD, anchor: 'middle', size: 11 }) +
      txt(245, 160, 'GOOD', { fill: C.green, anchor: 'middle', size: 11 }) +
      // terminals: dead +(40,96) -(110,96)   good +(210,96) -(280,96)
      '<rect x="34" y="84" width="14" height="14" fill="' + C.red + '"/>' + txt(41, 80, '+', { fill: C.red, anchor: 'middle', size: 14 }) +
      '<rect x="103" y="84" width="14" height="14" fill="' + C.ink + '"/>' + txt(110, 80, '−', { fill: C.ink, anchor: 'middle', size: 16 }) +
      '<rect x="203" y="84" width="14" height="14" fill="' + C.red + '"/>' + txt(210, 80, '+', { fill: C.red, anchor: 'middle', size: 14 }) +
      '<rect x="273" y="84" width="14" height="14" fill="' + C.ink + '"/>' + txt(280, 80, '−', { fill: C.ink, anchor: 'middle', size: 16 }) +
      // RED cable +→+  (curved over the top)
      '<path d="M41 84 C 60 30, 200 30, 210 84" fill="none" stroke="' + C.red + '" stroke-width="5" stroke-linecap="round"/>' +
      // BLACK cable: good −  →  bare metal (engine block bracket on dead side)
      '<rect x="60" y="150" width="36" height="24" rx="3" fill="' + C.greyD + '"/>' + txt(78, 190, 'bare metal', { fill: C.greyD, anchor: 'middle', size: 10 }) +
      '<path d="M280 98 C 300 140, 130 130, 92 154" fill="none" stroke="' + C.ink + '" stroke-width="5" stroke-linecap="round"/>' +
      // numbered order badges
      badge(41, 70, '1', C.red) + badge(210, 70, '2', C.red) +
      badge(280, 70, '3', C.ink) + badge(86, 144, '4', C.ink)
  };

  // numbered circular badge helper (used by jumper_hookup)
  function badge(cx, cy, n, col) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="11" fill="' + C.paper + '" stroke="' + col +
      '" stroke-width="2.5"/>' + txt(cx, cy + 5, n, { fill: col, anchor: 'middle', size: 14 });
  }

  // 7) jack_point — sill jacking point: NOT here / here
  D.jack_point = {
    label: L(
      'Jack only at the marked sill point — never on plastic/floor',
      'जैक सिर्फ़ निशान वाले सिल पॉइंट पर — प्लास्टिक/फ़र्श पर कभी नहीं',
      'ஜாக்கை குறிக்கப்பட்ட சில் புள்ளியில் மட்டும் — பிளாஸ்டிக்/தரையில் வேண்டாம்',
      'జాక్‌ను గుర్తు ఉన్న సిల్ పాయింట్‌లోనే — ప్లాస్టిక్/నేలపై వద్దు',
      'জ্যাক শুধু চিহ্নিত সিল পয়েন্টে — প্লাস্টিক/মেঝেতে নয়',
      'जॅक फक्त खूण असलेल्या सिल पॉइंटवर — प्लास्टिक/जमिनीवर नको',
      'જૅક માત્ર નિશાનવાળા સિલ પોઇન્ટ પર — પ્લાસ્ટિક/ફ્લોર પર નહીં',
      'ಜ್ಯಾಕ್ ಅನ್ನು ಗುರುತಿನ ಸಿಲ್ ಪಾಯಿಂಟ್‌ನಲ್ಲೇ — ಪ್ಲಾಸ್ಟಿಕ್/ನೆಲದ ಮೇಲೆ ಬೇಡ',
      'ജാക്ക് അടയാളപ്പെടുത്തിയ സിൽ പോയിന്റിൽ മാത്രം — പ്ലാസ്റ്റിക്/തറയിൽ വേണ്ട'),
    inner:
      ahead(C.green) + ahead(C.red) +
      '<line x1="0" y1="178" x2="320" y2="178" stroke="' + C.greyD + '" stroke-width="3"/>' +
      // car body side profile + sill
      '<path d="M30 110 C 60 60, 120 50, 160 50 C 220 50, 270 70, 290 110 L290 132 L30 132 Z" fill="' + C.greyL + '" stroke="' + C.greyD + '" stroke-width="2"/>' +
      // wheels
      '<circle cx="90" cy="138" r="20" fill="' + C.ink + '"/><circle cx="90" cy="138" r="8" fill="' + C.greyL + '"/>' +
      '<circle cx="232" cy="138" r="20" fill="' + C.ink + '"/><circle cx="232" cy="138" r="8" fill="' + C.greyL + '"/>' +
      // reinforced sill jack point (behind front wheel) — notch + correct mark
      '<rect x="118" y="124" width="22" height="10" fill="' + C.navy + '"/>' +
      '<rect x="124" y="120" width="10" height="4" fill="' + C.green + '"/>' +
      // jack under the correct point
      '<path d="M129 178 L121 156 L137 156 Z" fill="' + C.saffron + '" stroke="' + C.ink + '" stroke-width="1.5"/>' +
      txt(129, 150, '✓', { fill: C.green, anchor: 'middle', size: 14 }) +
      arrow(150, 196, 132, 156, C.green) +
      // WRONG spot under floor pan (middle) — red X
      txt(186, 150, '✕', { fill: C.red, anchor: 'middle', size: 16 }) +
      arrow(196, 96, 184, 130, C.red)
  };

  // 8) coolant_reservoir — MIN/MAX lines, open only when cool
  D.coolant_reservoir = {
    label: L(
      'Coolant tank — fill between MIN and MAX; open only when engine is cool',
      'कूलेंट टैंक — MIN और MAX के बीच भरें; इंजन ठंडा होने पर ही खोलें',
      'கூலன்ட் டேங்க் — MIN, MAX இடையே நிரப்பவும்; இன்ஜின் குளிர்ந்த பின்னரே திறக்கவும்',
      'కూలెంట్ ట్యాంక్ — MIN, MAX మధ్య నింపండి; ఇంజన్ చల్లబడ్డాకే తెరవండి',
      'কুল্যান্ট ট্যাঙ্ক — MIN ও MAX-এর মাঝে ভরুন; ইঞ্জিন ঠান্ডা হলেই খুলুন',
      'कूलंट टँक — MIN आणि MAX दरम्यान भरा; इंजिन थंड झाल्यावरच उघडा',
      'કૂલન્ટ ટેન્ક — MIN અને MAX વચ્ચે ભરો; એન્જિન ઠંડું થાય ત્યારે જ ખોલો',
      'ಕೂಲೆಂಟ್ ಟ್ಯಾಂಕ್ — MIN ಮತ್ತು MAX ನಡುವೆ ತುಂಬಿ; ಇಂಜಿನ್ ತಣ್ಣಗಾದ ಮೇಲೆಯೇ ತೆರೆಯಿರಿ',
      'കൂളന്റ് ടാങ്ക് — MIN-നും MAX-നും ഇടയിൽ നിറയ്ക്കുക; എഞ്ചിൻ തണുത്ത ശേഷം മാത്രം തുറക്കുക'),
    inner:
      ahead(C.saffron) +
      // engine bay frame
      '<rect x="10" y="40" width="300" height="150" rx="8" fill="#f3f4f6" stroke="' + C.greyD + '" stroke-width="2"/>' +
      // engine block hint
      '<rect x="24" y="120" width="120" height="60" rx="6" fill="' + C.greyL + '" stroke="' + C.grey + '" stroke-width="2"/>' +
      '<rect x="50" y="104" width="20" height="18" fill="' + C.grey + '"/>' +
      // translucent reservoir on the right
      '<rect x="196" y="70" width="80" height="100" rx="8" fill="#cfe8ff" stroke="' + C.navy + '" stroke-width="2"/>' +
      '<rect x="222" y="56" width="28" height="16" rx="4" fill="' + C.navy + '"/>' +
      // fluid level
      '<rect x="198" y="120" width="76" height="48" rx="6" fill="' + C.green + '" opacity="0.5"/>' +
      // MAX + MIN lines
      '<line x1="196" y1="96" x2="276" y2="96" stroke="' + C.ink + '" stroke-width="2"/>' + txt(282, 100, 'MAX', { fill: C.ink, size: 11 }) +
      '<line x1="196" y1="144" x2="276" y2="144" stroke="' + C.ink + '" stroke-width="2"/>' + txt(282, 148, 'MIN', { fill: C.ink, size: 11 }) +
      ringHi(236, 120, 56, C.saffron) +
      arrow(150, 60, 196, 84, C.saffron) +
      // cool-only warning
      txt(100, 70, '❄ cool only', { fill: C.red, anchor: 'middle', size: 12 })
  };

  // 9) chain_adjust — axle + adjuster bolts + 2-3cm slack
  D.chain_adjust = {
    label: L(
      'Chain slack 2–3 cm — set with the rear axle adjuster bolts',
      'चेन ढीलापन 2–3 cm — पीछे एक्सल एडजस्टर बोल्ट से सेट करें',
      'செயின் தளர்வு 2–3 cm — பின் ஆக்சில் அட்ஜஸ்டர் போல்ட்டால் சரிசெய்யவும்',
      'చైన్ వదులు 2–3 cm — వెనుక ఆక్సిల్ అడ్జస్టర్ బోల్ట్‌తో సెట్ చేయండి',
      'চেইন ঢিলে 2–3 cm — পিছনের অ্যাক্সেল অ্যাডজাস্টার বোল্ট দিয়ে সেট করুন',
      'चेन ढिलाई 2–3 cm — मागील अॅक्सल अॅडजस्टर बोल्टने सेट करा',
      'ચેઇન ઢીલાશ 2–3 cm — પાછળના એક્સલ એડજસ્ટર બોલ્ટથી સેટ કરો',
      'ಚೈನ್ ಸಡಿಲ 2–3 cm — ಹಿಂದಿನ ಆಕ್ಸಲ್ ಅಡ್ಜಸ್ಟರ್ ಬೋಲ್ಟ್‌ನಿಂದ ಸೆಟ್ ಮಾಡಿ',
      'ചെയിൻ അയവ് 2–3 cm — പിന്നിലെ ആക്സിൽ അഡ്ജസ്റ്റർ ബോൾട്ട് കൊണ്ട് സെറ്റ് ചെയ്യുക'),
    inner:
      ahead(C.saffron) +
      // rear wheel
      '<circle cx="110" cy="120" r="58" fill="none" stroke="' + C.ink + '" stroke-width="8"/>' +
      '<circle cx="110" cy="120" r="36" fill="none" stroke="' + C.grey + '" stroke-width="3"/>' +
      // sprocket + axle
      '<circle cx="110" cy="120" r="22" fill="' + C.greyL + '" stroke="' + C.greyD + '" stroke-width="2"/>' +
      '<circle cx="110" cy="120" r="6" fill="' + C.ink + '"/>' +
      // swingarm to front
      '<rect x="110" y="116" width="160" height="8" rx="4" fill="' + C.greyD + '"/>' +
      // chain (top + sagging bottom run)
      '<line x1="110" y1="98" x2="270" y2="100" stroke="' + C.navy + '" stroke-width="4"/>' +
      '<path d="M110 142 Q 190 168 270 130" fill="none" stroke="' + C.navy + '" stroke-width="4"/>' +
      // slack measure
      '<line x1="190" y1="142" x2="190" y2="160" stroke="' + C.green + '" stroke-width="2"/>' +
      txt(190, 178, '2–3 cm', { fill: C.green, anchor: 'middle', size: 12 }) +
      // adjuster bolt at axle
      '<rect x="250" y="108" width="20" height="24" rx="3" fill="' + C.saffron + '" stroke="' + C.ink + '" stroke-width="1.5"/>' +
      arrow(296, 70, 270, 108, C.saffron) +
      txt(300, 66, 'bolt', { fill: C.saffron, anchor: 'end', size: 11 })
  };

  // 10) shift_lock — auto gear lever shift-lock-release slot
  D.shift_lock = {
    label: L(
      'Shift-lock release — press the slot near P to move the gear lever',
      'शिफ्ट-लॉक रिलीज़ — गियर हिलाने के लिए P के पास स्लॉट दबाएँ',
      'ஷிஃப்ட்-லாக் ரிலீஸ் — கியரை நகர்த்த P அருகே உள்ள ஸ்லாட்டை அழுத்தவும்',
      'షిఫ్ట్-లాక్ రిలీజ్ — గేర్ కదపడానికి P దగ్గర స్లాట్ నొక్కండి',
      'শিফট-লক রিলিজ — গিয়ার নাড়াতে P-এর কাছে স্লট চাপুন',
      'शिफ्ट-लॉक रिलीज — गिअर हलवण्यासाठी P जवळचा स्लॉट दाबा',
      'શિફ્ટ-લૉક રિલીઝ — ગિયર ખસેડવા P પાસેનો સ્લોટ દબાવો',
      'ಶಿಫ್ಟ್-ಲಾಕ್ ರಿಲೀಸ್ — ಗೇರ್ ಸರಿಸಲು P ಬಳಿಯ ಸ್ಲಾಟ್ ಒತ್ತಿ',
      'ഷിഫ്റ്റ്-ലോക്ക് റിലീസ് — ഗിയർ നീക്കാൻ P-ക്ക് അടുത്തുള്ള സ്ലോട്ട് അമർത്തുക'),
    inner:
      ahead(C.saffron) +
      // console panel
      '<rect x="80" y="36" width="160" height="150" rx="12" fill="#1f2937" stroke="' + C.ink + '" stroke-width="2"/>' +
      // PRND gate
      '<rect x="150" y="52" width="20" height="118" rx="10" fill="#374151"/>' +
      txt(140, 64, 'P', { fill: C.paper, anchor: 'end', size: 13 }) +
      txt(140, 92, 'R', { fill: C.paper, anchor: 'end', size: 13 }) +
      txt(140, 120, 'N', { fill: C.paper, anchor: 'end', size: 13 }) +
      txt(140, 148, 'D', { fill: C.paper, anchor: 'end', size: 13 }) +
      // gear knob at P
      '<rect x="152" y="48" width="16" height="20" rx="6" fill="' + C.greyL + '"/>' +
      '<circle cx="160" cy="44" r="12" fill="' + C.navy + '"/>' +
      // shift-lock release slot (small cap) just right of P
      '<rect x="182" y="56" width="22" height="14" rx="3" fill="' + C.saffron + '" stroke="' + C.ink + '" stroke-width="1.5"/>' +
      txt(193, 66, '▢', { fill: C.ink, anchor: 'middle', size: 10 }) +
      ringHi(193, 63, 22, C.saffron) +
      arrow(266, 90, 216, 64, C.saffron) +
      txt(270, 96, 'press', { fill: C.saffron, anchor: 'start', size: 11 })
  };

  // 11) fob_key — hidden mechanical key sliding out
  D.fob_key = {
    label: L(
      'Key fob — slide the latch to pull out the hidden metal key',
      'की फ़ॉब — छिपी धातु चाबी निकालने के लिए लैच खिसकाएँ',
      'கீ ஃபாப் — மறைந்த உலோக சாவியை எடுக்க லாட்சை நகர்த்தவும்',
      'కీ ఫాబ్ — దాగిన లోహపు తాళంచెవి తీయడానికి లాచ్ జరపండి',
      'কী ফব — লুকানো ধাতব চাবি বের করতে ল্যাচ সরান',
      'की फॉब — लपलेली धातूची किल्ली काढण्यासाठी लॅच सरकवा',
      'કી ફોબ — છુપાયેલી ધાતુની ચાવી કાઢવા લૅચ સરકાવો',
      'ಕೀ ಫಾಬ್ — ಮರೆಯಾದ ಲೋಹದ ಕೀಲಿ ತೆಗೆಯಲು ಲ್ಯಾಚ್ ಸರಿಸಿ',
      'കീ ഫോബ് — മറഞ്ഞിരിക്കുന്ന ലോഹ താക്കോൽ പുറത്തെടുക്കാൻ ലാച്ച് നീക്കുക'),
    inner:
      ahead(C.saffron) +
      // fob body
      '<rect x="60" y="62" width="120" height="80" rx="16" fill="' + C.navy + '" stroke="' + C.ink + '" stroke-width="2"/>' +
      '<circle cx="90" cy="92" r="10" fill="' + C.saffron + '"/>' +
      '<circle cx="90" cy="118" r="10" fill="' + C.greyL + '"/>' +
      // latch (top)
      '<rect x="150" y="58" width="22" height="14" rx="4" fill="' + C.saffron + '" stroke="' + C.ink + '" stroke-width="1.5"/>' +
      arrow(150, 36, 162, 58, C.saffron) +
      txt(146, 34, 'slide', { fill: C.saffron, anchor: 'end', size: 11 }) +
      // hidden mechanical key sliding out of the right end
      '<rect x="180" y="92" width="40" height="18" rx="3" fill="' + C.grey + '" stroke="' + C.greyD + '" stroke-width="1.5"/>' +
      '<path d="M220 92 L268 96 L268 106 L220 110 Z" fill="' + C.grey + '" stroke="' + C.greyD + '" stroke-width="1.5"/>' +
      '<path d="M256 106 l4 8 l4 -8 z" fill="' + C.grey + '"/>' +
      '<path d="M268 96 l8 0 l0 4 l-4 0 l0 4 l-4 0 z" fill="' + C.greyD + '"/>' +
      ringHi(238, 101, 40, C.saffron)
  };

  // 12) aux_battery_ev — small 12V battery, NOT the orange HV pack
  D.aux_battery_ev = {
    label: L(
      'EV — jump the small 12V battery only, never the orange HV pack',
      'EV — सिर्फ़ छोटी 12V बैटरी जम्प करें, नारंगी HV पैक कभी नहीं',
      'EV — சிறிய 12V பேட்டரியை மட்டும் ஜம்ப் செய்யவும், ஆரஞ்சு HV பேக் வேண்டாம்',
      'EV — చిన్న 12V బ్యాటరీని మాత్రమే జంప్ చేయండి, నారింజ HV ప్యాక్ వద్దు',
      'EV — শুধু ছোট 12V ব্যাটারি জাম্প করুন, কমলা HV প্যাক নয়',
      'EV — फक्त छोटी 12V बॅटरी जम्प करा, नारंगी HV पॅक नको',
      'EV — માત્ર નાની 12V બેટરી જમ્પ કરો, નારંગી HV પેક નહીં',
      'EV — ಸಣ್ಣ 12V ಬ್ಯಾಟರಿಯನ್ನು ಮಾತ್ರ ಜಂಪ್ ಮಾಡಿ, ಕಿತ್ತಳೆ HV ಪ್ಯಾಕ್ ಬೇಡ',
      'EV — ചെറിയ 12V ബാറ്ററി മാത്രം ജമ്പ് ചെയ്യുക, ഓറഞ്ച് HV പായ്ക്ക് വേണ്ട'),
    inner:
      ahead(C.green) + ahead(C.red) +
      '<rect x="10" y="40" width="300" height="150" rx="8" fill="#f3f4f6" stroke="' + C.greyD + '" stroke-width="2"/>' +
      // big orange HV pack (danger — do NOT touch)
      '<rect x="150" y="96" width="140" height="80" rx="6" fill="' + C.saffron + '" stroke="' + C.red + '" stroke-width="3"/>' +
      txt(220, 132, 'HV', { fill: C.ink, anchor: 'middle', size: 22 }) +
      txt(220, 152, '✕ do not touch', { fill: C.red, anchor: 'middle', size: 11 }) +
      '<line x1="150" y1="96" x2="290" y2="176" stroke="' + C.red + '" stroke-width="2" opacity="0.5"/>' +
      // small 12V aux battery (correct)
      '<rect x="36" y="100" width="80" height="56" rx="5" fill="' + C.greyL + '" stroke="' + C.green + '" stroke-width="3"/>' +
      '<rect x="46" y="92" width="12" height="10" fill="' + C.red + '"/>' + txt(52, 88, '+', { fill: C.red, anchor: 'middle', size: 12 }) +
      '<rect x="94" y="92" width="12" height="10" fill="' + C.ink + '"/>' + txt(100, 88, '−', { fill: C.ink, anchor: 'middle', size: 14 }) +
      txt(76, 134, '12V', { fill: C.navy, anchor: 'middle', size: 16 }) +
      txt(76, 172, '✓', { fill: C.green, anchor: 'middle', size: 16 }) +
      arrow(76, 196, 76, 158, C.green)
  };

  // 13) charge_port_ev — EV charge port location
  D.charge_port_ev = {
    label: L(
      'EV charge port — open the flap and plug the connector in here',
      'EV चार्ज पोर्ट — फ्लैप खोलें और यहाँ कनेक्टर लगाएँ',
      'EV சார்ஜ் போர்ட் — மூடியைத் திறந்து இங்கே கனெக்டரை செருகவும்',
      'EV ఛార్జ్ పోర్ట్ — ఫ్లాప్ తెరిచి ఇక్కడ కనెక్టర్ పెట్టండి',
      'EV চার্জ পোর্ট — ফ্ল্যাপ খুলে এখানে কানেক্টর লাগান',
      'EV चार्ज पोर्ट — फ्लॅप उघडा आणि इथे कनेक्टर लावा',
      'EV ચાર્જ પોર્ટ — ફ્લૅપ ખોલો અને અહીં કનેક્ટર લગાવો',
      'EV ಚಾರ್ಜ್ ಪೋರ್ಟ್ — ಫ್ಲ್ಯಾಪ್ ತೆರೆದು ಇಲ್ಲಿ ಕನೆಕ್ಟರ್ ಸಿಕ್ಕಿಸಿ',
      'EV ചാർജ് പോർട്ട് — ഫ്ലാപ്പ് തുറന്ന് ഇവിടെ കണക്ടർ കുത്തുക'),
    inner:
      ahead(C.green) +
      '<line x1="0" y1="178" x2="320" y2="178" stroke="' + C.greyD + '" stroke-width="3"/>' +
      // car body
      '<path d="M30 110 C 60 58, 120 48, 160 48 C 220 48, 270 68, 292 110 L292 132 L30 132 Z" fill="' + C.greyL + '" stroke="' + C.greyD + '" stroke-width="2"/>' +
      '<circle cx="92" cy="138" r="20" fill="' + C.ink + '"/><circle cx="92" cy="138" r="8" fill="' + C.greyL + '"/>' +
      '<circle cx="234" cy="138" r="20" fill="' + C.ink + '"/><circle cx="234" cy="138" r="8" fill="' + C.greyL + '"/>' +
      // open charge flap + port (front fender area)
      '<rect x="54" y="86" width="34" height="30" rx="4" fill="' + C.navy + '" stroke="' + C.ink + '" stroke-width="2"/>' +
      '<circle cx="71" cy="101" r="11" fill="#1f2937" stroke="' + C.paper + '" stroke-width="1.5"/>' +
      // pins in the port
      '<circle cx="66" cy="97" r="2.4" fill="' + C.green + '"/><circle cx="76" cy="97" r="2.4" fill="' + C.green + '"/>' +
      '<circle cx="66" cy="105" r="2.4" fill="' + C.green + '"/><circle cx="76" cy="105" r="2.4" fill="' + C.green + '"/>' +
      '<circle cx="71" cy="101" r="2.4" fill="' + C.green + '"/>' +
      // open flap leaf
      '<rect x="30" y="78" width="22" height="30" rx="3" fill="#cbd5e1" stroke="' + C.greyD + '" stroke-width="1.5" transform="rotate(-18 41 93)"/>' +
      ringHi(71, 101, 24, C.green) +
      arrow(150, 80, 96, 98, C.green) +
      txt(156, 76, 'plug here', { fill: C.green, anchor: 'start', size: 12 })
  };

  // ── PUBLIC API ──────────────────────────────────────────────────────────
  function get(key) {
    var d = D[key];
    if (!d) return null;
    return { svg: svg(d.label.en, d.inner), label: d.label };
  }

  function render(key, langFn) {
    var d = D[key];
    if (!d) return '';
    var caption = (typeof langFn === 'function' ? langFn(d.label) : null) || d.label.en;
    return '<figure class="chitti-bd-diagram" style="margin:0;display:inline-block;max-width:320px">' +
      svg(d.label.en, d.inner) +
      '<figcaption style="font:13px/1.4 Arial,Helvetica,sans-serif;color:' + C.ink +
      ';padding:6px 4px 2px">' + esc(caption) + '</figcaption></figure>';
  }

  function keys() { return Object.keys(D); }

  var API = { get: get, render: render, keys: keys };

  if (typeof window !== 'undefined') {
    window.ChittiBreakdownDiagrams = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
