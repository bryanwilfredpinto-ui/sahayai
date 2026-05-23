/* ──────────────────────────────────────────────────────────────────
 * chitti_bottom_nav.js — UNIFIED bottom nav across all Chitti pages
 * Locked 2026-05-23 per Sire Priority-2 step 2.
 *
 * Five tabs (identical on every page so the user always knows where
 * they are):
 *
 *   🎤 Vaani    → chitti_vaani.html
 *   ⚡ Karo     → chitti_medupi.html      (Hindi "Karo" = "Do")
 *   🗄️ Vault   → chitti_health_file.html
 *   👨‍👩‍👧 Parivaar → chitti_health_file.html#family   (Family profiles)
 *   ⚙️ Settings → chitti_vaani.html#settings
 *
 * Visual contract (rendered via .chitti-bharat-bottom-nav in
 * chitti_theme.css):
 *   - Navy (#000080) background, 56px tall, fixed at the bottom
 *   - Active icon: saffron (#FF9933) + saffron bottom border
 *   - Inactive icon: 60% white
 *   - 5 equal columns, 48×48 minimum tap target
 *
 * Auto-injection contract:
 *   - The substrate self-bootstraps on DOMContentLoaded.
 *   - It detects the current page via location.pathname + #hash and
 *     marks the matching tab .active.
 *   - It adds body.chitti-has-bottom-nav (theme.css adds 68px bottom
 *     padding when this class is present).
 *   - Labels translate via localStorage.chitti_vaani_lang. Default fall-
 *     back chain: requested lang → Hindi → English (per Sire's
 *     "never English fallback for Hindi users" contract — Hindi sits
 *     between).
 *
 * Auto-hides on pages that explicitly opt out via:
 *   <meta name="chitti-bottom-nav" content="off">
 *
 * Opt-out is the right escape hatch for:
 *   - Modal-only pages (chitti_offline.html / chitti_isl.html demos)
 *   - Pages that already render a bespoke bottom-tab UI (Vaani's vai-
 *     tabbar continues to work alongside this substrate but pages can
 *     opt out if the double bottom-bar conflicts).
 *
 * Cross-page sync:
 *   - Listens to window 'chitti:langchange' (fired by chitti_lang.js +
 *     chitti_health_file's hfSetLanguage) and re-renders labels.
 * ────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';
  if (window.__chittiBottomNavLoaded) return;
  window.__chittiBottomNavLoaded = true;

  var STORAGE_KEY = 'chitti_vaani_lang';

  // Five-tab manifest. `slug` is used to mark the active tab; `match`
  // is the substring tested against location.pathname.
  var TABS = [
    { slug: 'vaani',    icon: '🎤', href: 'chitti_vaani.html',
      match: ['chitti_vaani.html'] },
    { slug: 'karo',     icon: '⚡', href: 'chitti_medupi.html',
      match: ['chitti_medupi.html', 'chitti_scanner.html', 'chitti_upi.html'] },
    { slug: 'vault',    icon: '🗄️', href: 'chitti_health_file.html',
      match: ['chitti_health_file.html'] },
    { slug: 'parivaar', icon: '👨‍👩‍👧', href: 'chitti_health_file.html#profile',
      match: [] },  // never auto-active — explicit hash entry only
    { slug: 'settings', icon: '⚙️', href: 'chitti_vaani.html#settings',
      match: [] },  // never auto-active — explicit hash entry only
  ];

  // Label translations. Hindi is the default fallback (per Sire's
  // "never English fallback for Hindi users"). Other languages fall
  // through to Hindi until per-language strings land.
  var LABELS = {
    en: { vaani: 'Vaani', karo: 'Do',    vault: 'Vault', parivaar: 'Family',  settings: 'Settings' },
    hi: { vaani: 'वाणी',  karo: 'करो',  vault: 'वॉल्ट', parivaar: 'परिवार', settings: 'सेटिंग्स' },
    bn: { vaani: 'বাণী', karo: 'করো', vault: 'ভল্ট',  parivaar: 'পরিবার', settings: 'সেটিংস' },
    ta: { vaani: 'வாணி', karo: 'செய்', vault: 'பெட்டகம்', parivaar: 'குடும்பம்', settings: 'அமைப்புகள்' },
    te: { vaani: 'వాణి', karo: 'చేయి', vault: 'వాల్ట్', parivaar: 'కుటుంబం',  settings: 'సెట్టింగ్‌లు' },
    mr: { vaani: 'वाणी', karo: 'करा', vault: 'व्हॉल्ट', parivaar: 'परिवार', settings: 'सेटिंग्ज' },
    gu: { vaani: 'વાણી', karo: 'કરો', vault: 'વોલ્ટ', parivaar: 'પરિવાર', settings: 'સેટિંગ્સ' },
    kn: { vaani: 'ವಾಣಿ', karo: 'ಮಾಡು', vault: 'ವಾಲ್ಟ್', parivaar: 'ಕುಟುಂಬ', settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
    ml: { vaani: 'വാണി', karo: 'ചെയ്യൂ', vault: 'വാൾട്ട്', parivaar: 'കുടുംബം', settings: 'സെറ്റിങ്ങുകൾ' },
    pa: { vaani: 'ਵਾਣੀ', karo: 'ਕਰੋ', vault: 'ਵਾਲਟ', parivaar: 'ਪਰਿਵਾਰ', settings: 'ਸੈਟਿੰਗਜ਼' },
  };

  function getLang() {
    try { return localStorage.getItem(STORAGE_KEY) || 'hi'; }
    catch (e) { return 'hi'; }
  }
  function label(slug) {
    var lang = getLang();
    var bag = LABELS[lang] || LABELS.hi;
    return bag[slug] || LABELS.hi[slug] || LABELS.en[slug] || slug;
  }

  // Opt-out check
  function isOptedOut() {
    var meta = document.querySelector('meta[name="chitti-bottom-nav"]');
    return meta && /^(off|disabled|no|false)$/i.test((meta.getAttribute('content') || '').trim());
  }

  // Identify the page so we can mark the active tab. Match on the
  // basename of pathname so /chitti_vaani.html and /some/path/chitti_vaani.html
  // both work.
  function currentPagename() {
    var p = (location.pathname || '').toLowerCase();
    var hash = (location.hash || '').toLowerCase();
    // Hash overrides path: chitti_health_file.html#profile → Parivaar
    if (hash === '#profile' || hash === '#family' || hash === '#parivaar') return '__hash_profile__';
    if (hash === '#settings') return '__hash_settings__';
    return p;
  }

  function activeSlug() {
    var p = currentPagename();
    if (p === '__hash_profile__')  return 'parivaar';
    if (p === '__hash_settings__') return 'settings';
    for (var i = 0; i < TABS.length; i++) {
      var t = TABS[i];
      for (var j = 0; j < t.match.length; j++) {
        if (p.indexOf(t.match[j].toLowerCase()) !== -1) return t.slug;
      }
    }
    return null;  // no auto-active tab on this page
  }

  function render() {
    if (isOptedOut()) return;
    if (document.getElementById('chitti-bharat-bottom-nav')) return;  // idempotent

    var nav = document.createElement('nav');
    nav.id = 'chitti-bharat-bottom-nav';
    nav.className = 'chitti-bharat-bottom-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Chitti family navigation');

    var active = activeSlug();
    nav.innerHTML = TABS.map(function (t) {
      var isActive = (t.slug === active);
      return [
        '<a href="' + t.href + '" data-slug="' + t.slug + '"',
        '   aria-label="' + label(t.slug) + '"',
        '   aria-current="' + (isActive ? 'page' : 'false') + '"',
        '   class="' + (isActive ? 'active' : '') + '">',
        '  <span class="ico" aria-hidden="true">' + t.icon + '</span>',
        '  <span class="lbl">' + label(t.slug) + '</span>',
        '</a>',
      ].join('');
    }).join('');

    document.body.appendChild(nav);
    document.body.classList.add('chitti-has-bottom-nav');
  }

  function refreshLabels() {
    var nav = document.getElementById('chitti-bharat-bottom-nav');
    if (!nav) return;
    nav.querySelectorAll('a[data-slug]').forEach(function (a) {
      var slug = a.getAttribute('data-slug');
      var lbl = label(slug);
      a.setAttribute('aria-label', lbl);
      var span = a.querySelector('.lbl');
      if (span) span.textContent = lbl;
    });
  }

  function refreshActive() {
    var nav = document.getElementById('chitti-bharat-bottom-nav');
    if (!nav) return;
    var active = activeSlug();
    nav.querySelectorAll('a[data-slug]').forEach(function (a) {
      var isActive = (a.getAttribute('data-slug') === active);
      a.classList.toggle('active', isActive);
      a.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
  // Language updates
  window.addEventListener('chitti:langchange', refreshLabels);
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) refreshLabels();
  });
  // Hash changes (e.g. user lands on chitti_health_file.html#profile)
  window.addEventListener('hashchange', refreshActive);

  // Public API for explicit page authors (e.g. SPA-style tabbed pages
  // that want to force-highlight a different slug).
  window.ChittiBottomNav = {
    refresh: render,
    refreshLabels: refreshLabels,
    setActive: function (slug) {
      var nav = document.getElementById('chitti-bharat-bottom-nav');
      if (!nav) return;
      nav.querySelectorAll('a[data-slug]').forEach(function (a) {
        var isActive = (a.getAttribute('data-slug') === slug);
        a.classList.toggle('active', isActive);
        a.setAttribute('aria-current', isActive ? 'page' : 'false');
      });
    },
  };
})();
