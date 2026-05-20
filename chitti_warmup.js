/* chitti_warmup.js — cold-start warm-up banner for every Chitti page.
 *
 * Render free tier (and Railway sleeping services) cold-start in 30–60s.
 * Without a banner the first user just sees a long unexplained wait.
 *
 * Contract:
 *   1. On page load, fire a /health ping against the page's own backend.
 *   2. If the response takes > 3s OR errors, show a saffron banner with a
 *      plain-language warm-up message in the user's selected language.
 *   3. As soon as /health returns 200, auto-hide the banner.
 *   4. Never show the banner if /health responds in under 3s.
 *
 * Frontend-only. Backend unchanged. Page mapping mirrors
 * chitti-founder/backend/main.py::_FEEDBACK_API_PER_PAGE so the warm-up
 * targets the same host the page actually talks to.
 */
(function () {
  "use strict";

  if (window.__chittiWarmupLoaded) return;
  window.__chittiWarmupLoaded = true;

  // -- Page → backend mapping (mirror of chitti-founder _FEEDBACK_API_PER_PAGE)
  var BACKEND_BY_PAGE = {
    "chitti_vaani":              "https://chitti-vaani-api-production.up.railway.app",
    "chitti_medupi":             "https://chitti-medupi-api-production.up.railway.app",
    "chitti_legal":              "https://chitti-legal-api-production.up.railway.app",
    "chitti_ca":                 "https://chitti-ca-api-production.up.railway.app",
    "chitti_government":         "https://chitti-government-api-production.up.railway.app",
    "chitti_news":               "https://chitti-news-api-production.up.railway.app",
    "chitti_complete_technical": "https://chitti-shares-api-production.up.railway.app",
    "chitti_fundamentals":       "https://chitti-shares-api-production.up.railway.app",
    "chitti_complete":           "https://chitti-shares-api-production.up.railway.app",
    "chitti_scanner":            "https://chitti-vaani-api-production.up.railway.app",
    "chitti_upi":                "https://chitti-vaani-api-production.up.railway.app",
    "chitti_voice_factory":      "https://chitti-voice-factory-api-production.up.railway.app",
    "chitti_news_ai":            "https://chitti-news-ai-api-production.up.railway.app",
    "chitti_2wheeler":           "https://chitti-2wheeler-api-production.up.railway.app",
    "chitti_4wheeler":           "https://chitti-4wheeler-api-production.up.railway.app",
    "chitti_logo_video":         "https://chitti-logo-video-api-production.up.railway.app",
    "index":                     "https://chitti-vaani-api-production.up.railway.app"
  };

  // -- Translations. EN + HI explicit (per spec). Other Indian langs included
  //    so the banner matches the user's a11y profile language end-to-end.
  var MESSAGES = {
    en: "Chitti is waking up — first response may take up to 60 seconds. Please wait 🙏",
    hi: "चित्ती जाग रही है — पहला जवाब 60 सेकंड तक ले सकता है। कृपया प्रतीक्षा करें 🙏",
    bn: "চিট্টি জাগছে — প্রথম উত্তর পেতে 60 সেকেন্ড পর্যন্ত লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন 🙏",
    te: "చిత్తి మేల్కొంటోంది — మొదటి సమాధానం 60 సెకన్ల వరకు తీసుకోవచ్చు. దయచేసి వేచి ఉండండి 🙏",
    ta: "சித்தி விழித்து கொண்டிருக்கிறார் — முதல் பதிலுக்கு 60 விநாடிகள் ஆகலாம். தயவுசெய்து காத்திருக்குங்கள் 🙏",
    kn: "ಚಿತ್ತಿ ಎಚ್ಚರಗೊಳ್ಳುತ್ತಿದೆ — ಮೊದಲ ಪ್ರತಿಕ್ರಿಯೆ 60 ಸೆಕೆಂಡ್‌ಗಳಷ್ಟು ತಗೆದುಕೊಳ್ಳಬಹುದು. ದಯವಿಟ್ಟು ಕೊಡಿ 🙏",
    ml: "ചിത്തി ഉണരുന്നു — ആദ്യ പ്രതികരണത്തിന് 60 സെകൻഡ് വരെ ඎടുക്കാം. ദയവായി കാത്തിരിക്കുക 🙏",
    mr: "चित्ती जागत आहे — पहिले उत्तर 60 सेकंदापर्यंत लागू शकते. कृपया प्रतीक्षा करा 🙏",
    gu: "चित्ती जागी रही छे — पहेलो जवाब 60 सेकंड सुधी लई शके छे. कृपया प्रतीक्षा करो 🙏",
    pa: "चित्ती जाग रही है — पहिला उत्तर 60 सेकंड तक लग सकदा है। कृपया इंतजार करो 🙏",
    or: "ଚିତ୍ତୀ ଉଠୁଛି — ପ୍ରଥମ ଉତ୍ତର ଦେବାକୁ 60 ସେକେଣ୍ଡ ପର୍ଯ୍ୟନ୍ତ ଲଗିପାରେ। ଦୟାକରି அପେକ୍ଷା କରନ୍ତୁ 🙏",
    ur: "چتی جاگ رہی ہے — پہلا جواب 60 سیکنڈ تک لگ سکتا ہے۔ برائے کرم انتظار کریں 🙏"
  };

  // -- Detect page key from current pathname.
  function detectPageKey() {
    var path = (location.pathname || "").toLowerCase();
    var base = path.split("/").pop() || "";
    if (!base || base === "" || base === "index.html") return "index";
    return base.replace(/\.html?$/, "").replace(/[^a-z0-9_]/g, "");
  }

  // -- Detect language from disability profile or browser.
  function detectLang() {
    try {
      var raw = localStorage.getItem("disability_profile");
      if (raw) {
        var dp = JSON.parse(raw);
        if (dp && dp.lang && MESSAGES[dp.lang]) return dp.lang;
      }
    } catch (e) { /* ignore — bad JSON */ }
    try {
      var saved = localStorage.getItem("chitti_lang") || localStorage.getItem("lang");
      if (saved && MESSAGES[saved]) return saved;
    } catch (e) { /* ignore */ }
    var htmlLang = (document.documentElement.lang || "").toLowerCase().split("-")[0];
    if (htmlLang && MESSAGES[htmlLang]) return htmlLang;
    var navLang = (navigator.language || "en").toLowerCase().split("-")[0];
    if (MESSAGES[navLang]) return navLang;
    return "en";
  }

  function backendFor(pageKey) {
    return BACKEND_BY_PAGE[pageKey] || BACKEND_BY_PAGE["index"];
  }

  // -- Banner DOM + CSS.
  function injectStyles() {
    if (document.getElementById("chitti-warmup-styles")) return;
    var css = (
      "#chitti-warmup-banner{" +
        "position:fixed;top:0;left:0;right:0;z-index:2147483600;" +
        "background:#FF9933;color:#1a1a1a;" +
        "font-family:-apple-system,Segoe UI,Roboto,Noto Sans,Arial,sans-serif;" +
        "font-size:15px;line-height:1.4;font-weight:600;" +
        "padding:10px 16px;display:flex;align-items:center;justify-content:center;gap:10px;" +
        "box-shadow:0 2px 6px rgba(0,0,0,.18);" +
        "transform:translateY(-100%);transition:transform .25s ease-out;" +
      "}" +
      "#chitti-warmup-banner.chitti-warmup-show{transform:translateY(0)}" +
      "#chitti-warmup-banner .chitti-warmup-dots{display:inline-flex;gap:3px;margin-left:6px}" +
      "#chitti-warmup-banner .chitti-warmup-dots span{" +
        "width:6px;height:6px;border-radius:50%;background:#1a1a1a;" +
        "animation:chittiWarmupBlink 1.2s infinite ease-in-out both" +
      "}" +
      "#chitti-warmup-banner .chitti-warmup-dots span:nth-child(2){animation-delay:.2s}" +
      "#chitti-warmup-banner .chitti-warmup-dots span:nth-child(3){animation-delay:.4s}" +
      "@keyframes chittiWarmupBlink{" +
        "0%,80%,100%{opacity:.2;transform:scale(.85)}" +
        "40%{opacity:1;transform:scale(1.1)}" +
      "}"
    );
    var style = document.createElement("style");
    style.id = "chitti-warmup-styles";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function buildBanner(message) {
    var banner = document.createElement("div");
    banner.id = "chitti-warmup-banner";
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");

    var msg = document.createElement("span");
    msg.className = "chitti-warmup-msg";
    msg.textContent = message;
    banner.appendChild(msg);

    var dots = document.createElement("span");
    dots.className = "chitti-warmup-dots";
    dots.setAttribute("aria-hidden", "true");
    dots.appendChild(document.createElement("span"));
    dots.appendChild(document.createElement("span"));
    dots.appendChild(document.createElement("span"));
    banner.appendChild(dots);

    return banner;
  }

  function showBanner() {
    if (document.getElementById("chitti-warmup-banner")) return;
    injectStyles();
    var lang = detectLang();
    var message = MESSAGES[lang] || MESSAGES.en;
    var banner = buildBanner(message);
    (document.body || document.documentElement).appendChild(banner);
    requestAnimationFrame(function () { banner.classList.add("chitti-warmup-show"); });
  }

  function hideBanner() {
    var banner = document.getElementById("chitti-warmup-banner");
    if (!banner) return;
    banner.classList.remove("chitti-warmup-show");
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 300);
  }

  // -- The probe. Race a 3s timer against the /health fetch.
  function runProbe() {
    var pageKey = detectPageKey();
    var backend = backendFor(pageKey);
    if (!backend) return;
    var healthUrl = backend.replace(/\/+$/, "") + "/health";

    var bannerShown = false;
    var resolved = false;

    var showTimer = setTimeout(function () {
      if (!resolved) {
        bannerShown = true;
        showBanner();
      }
    }, 3000);

    var ac = ("AbortController" in window) ? new AbortController() : null;
    // Total ceiling — give the backend up to ~75s to wake up before we give up.
    var killTimer = setTimeout(function () {
      if (ac) try { ac.abort(); } catch (e) { /* ignore */ }
    }, 75000);

    var fetchOpts = { method: "GET", cache: "no-store", mode: "cors", credentials: "omit" };
    if (ac) fetchOpts.signal = ac.signal;

    fetch(healthUrl, fetchOpts)
      .then(function (r) {
        resolved = true;
        clearTimeout(showTimer);
        clearTimeout(killTimer);
        if (r.ok) {
          if (bannerShown) hideBanner();
        } else {
          if (!bannerShown) showBanner();
        }
      })
      .catch(function () {
        resolved = true;
        clearTimeout(showTimer);
        clearTimeout(killTimer);
        // Network/abort/cold-start failure. Keep the banner up briefly so the
        // user knows something is happening, then hide after ~8s so we don't
        // pin a stale banner if the backend never wakes.
        if (!bannerShown) showBanner();
        setTimeout(hideBanner, 8000);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runProbe, { once: true });
  } else {
    runProbe();
  }
})();
