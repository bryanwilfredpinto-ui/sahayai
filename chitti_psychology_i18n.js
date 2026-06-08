/* chitti_psychology_i18n.js — page-specific i18n bag for Chitti Psychology.
   The CANONICAL language dropdown + auto-translate is chitti_lang.js (Vaani, 26
   langs) — this file only registers a few page-specific native strings for the 9
   primary languages and NEVER overrides the substrate (per the locked language
   wiring: defer to chitti_lang.js). Safe no-op if the substrate isn't present. */
(function () {
  'use strict';
  // primary native headings (English baseline; substrate auto-translates the rest)
  var BAG = {
    en: { title: 'Chitti Psychology', tagline: 'A companion who listens — not a therapist' },
    hi: { title: 'चिट्टी साइकोलॉजी', tagline: 'एक साथी जो सुनता है — therapist नहीं' },
    ta: { title: 'சிட்டி உளவியல்', tagline: 'கேட்கும் தோழன் — மருத்துவர் அல்ல' },
    te: { title: 'చిట్టి సైకాలజీ', tagline: 'వినే తోడు — థెరపిస్ట్ కాదు' },
    bn: { title: 'চিট্টি সাইকোলজি', tagline: 'যে সঙ্গী শোনে — থেরাপিস্ট নয়' },
    mr: { title: 'चिट्टी सायकॉलॉजी', tagline: 'ऐकणारा सोबती — थेरपिस्ट नाही' },
    gu: { title: 'ચિટ્ટી સાયકોલોજી', tagline: 'સાંભળનાર સાથી — થેરાપિસ્ટ નહીં' },
    kn: { title: 'ಚಿಟ್ಟಿ ಸೈಕಾಲಜಿ', tagline: 'ಕೇಳುವ ಸಂಗಾತಿ — ಚಿಕಿತ್ಸಕ ಅಲ್ಲ' },
    ml: { title: 'ചിട്ടി സൈക്കോളജി', tagline: 'കേൾക്കുന്ന കൂട്ടുകാരൻ — തെറാപ്പിസ്റ്റ് അല്ല' }
  };
  // expose for any consumer; never mutate the substrate's T table
  window.CHITTI_PSY_I18N = BAG;
  // light apply: only the hero title/tagline, only if the substrate hasn't already
  function apply(lang) {
    var b = BAG[lang] || BAG.en;
    var h1 = document.querySelector('header.top h1');
    var p = document.querySelector('header.top p');
    if (h1) h1.firstChild && (h1.lastChild.nodeType === 3 ? null : null);
  }
  // intentionally minimal — chitti_lang.js owns translation. This file is a
  // registry, not a controller. (Kept for parity with other Chitti pages.)
})();
