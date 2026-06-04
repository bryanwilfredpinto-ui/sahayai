/* ════════════════════════════════════════════════════════════════════════
   chitti_obd_ble.js — Real OBD2 live-read via Web Bluetooth (ELM327)
   for Chitti Car Doctor (4w) + Bike Doctor (2w).

   Self-contained IIFE → window.ChittiOBD = { isSupported, open }.

   - isSupported(): navigator.bluetooth present.
   - open(opts): in-page overlay. Connect a Bluetooth ELM327 adapter, run the
     init handshake, read live Mode-01 PIDs (RPM / coolant / speed / voltage)
     + stored Mode-03 DTCs, render in cards, POST DTCs to the page car backend
     /api/4w/obd/snapshot for plain-language interpretation (online only).

   Honest fallback: if navigator.bluetooth is absent (iPhone / desktop /
   headless) a clear panel tells the user to use Symptom mode instead.
   NEVER fabricates interpretations. All BLE calls in try/catch — never crashes
   the host page.

   Nordic UART service 6e400001-... (most BLE ELM327 clones expose this).
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── i18n: pure-native-script resolver ─────────────────────────────── */
  function L(o) {
    var k = (window.CURRENT_LANG || 'en').toLowerCase().split('-')[0];
    return o[k] || o.en;
  }

  var T = {
    title: {
      en: 'Live OBD2 (Bluetooth)', hi: 'लाइव OBD2 (ब्लूटूथ)', ta: 'நேரடி OBD2 (புளூடூத்)',
      te: 'లైవ్ OBD2 (బ్లూటూత్)', bn: 'লাইভ OBD2 (ব্লুটুথ)', mr: 'लाइव्ह OBD2 (ब्लूटूथ)',
      gu: 'લાઇવ OBD2 (બ્લૂટૂથ)', kn: 'ಲೈವ್ OBD2 (ಬ್ಲೂಟೂತ್)', ml: 'ലൈവ് OBD2 (ബ്ലൂടൂത്ത്)'
    },
    explain: {
      en: 'An OBD2 adapter reads your engine directly. Plug a Bluetooth ELM327 into the port under the dashboard, then tap Connect.',
      hi: 'OBD2 अडैप्टर सीधे आपके इंजन को पढ़ता है। डैशबोर्ड के नीचे वाले पोर्ट में ब्लूटूथ ELM327 लगाएं, फिर कनेक्ट दबाएं।',
      ta: 'OBD2 அடாப்டர் உங்கள் இன்ஜினை நேரடியாக படிக்கிறது. டாஷ்போர்டுக்கு கீழே உள்ள போர்ட்டில் புளூடூத் ELM327 செருகி, பின்னர் இணை என அழுத்தவும்.',
      te: 'OBD2 అడాప్టర్ మీ ఇంజిన్‌ను నేరుగా చదువుతుంది. డాష్‌బోర్డ్ కింద ఉన్న పోర్ట్‌లో బ్లూటూత్ ELM327 ప్లగ్ చేసి, తర్వాత కనెక్ట్ నొక్కండి.',
      bn: 'OBD2 অ্যাডাপ্টার সরাসরি আপনার ইঞ্জিন পড়ে। ড্যাশবোর্ডের নিচের পোর্টে একটি ব্লুটুথ ELM327 লাগান, তারপর কানেক্ট চাপুন।',
      mr: 'OBD2 अडॅप्टर थेट तुमचे इंजिन वाचतो. डॅशबोर्डखालील पोर्टमध्ये ब्लूटूथ ELM327 लावा, मग कनेक्ट दाबा.',
      gu: 'OBD2 એડેપ્ટર સીધું તમારા એન્જિનને વાંચે છે. ડેશબોર્ડ નીચેના પોર્ટમાં બ્લૂટૂથ ELM327 લગાવો, પછી કનેક્ટ દબાવો.',
      kn: 'OBD2 ಅಡಾಪ್ಟರ್ ನೇರವಾಗಿ ನಿಮ್ಮ ಎಂಜಿನ್ ಅನ್ನು ಓದುತ್ತದೆ. ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಕೆಳಗಿನ ಪೋರ್ಟ್‌ಗೆ ಬ್ಲೂಟೂತ್ ELM327 ಸಿಕ್ಕಿಸಿ, ನಂತರ ಕನೆಕ್ಟ್ ಒತ್ತಿ.',
      ml: 'OBD2 അഡാപ്റ്റർ നിങ്ങളുടെ എഞ്ചിൻ നേരിട്ട് വായിക്കുന്നു. ഡാഷ്‌ബോർഡിന് താഴെയുള്ള പോർട്ടിൽ ഒരു ബ്ലൂടൂത്ത് ELM327 പ്ലഗ് ചെയ്ത് കണക്റ്റ് അമർത്തുക.'
    },
    bikeNote: {
      en: 'OBD ports are mostly on cars and advanced bikes. Many older bikes have no port — use Symptom mode if your bike has none.',
      hi: 'OBD पोर्ट ज़्यादातर कारों और एडवांस बाइकों में होते हैं। कई पुरानी बाइकों में पोर्ट नहीं होता — न हो तो लक्षण मोड इस्तेमाल करें।',
      ta: 'OBD போர்ட்கள் பெரும்பாலும் கார்கள் மற்றும் மேம்பட்ட பைக்குகளில் உள்ளன. பழைய பைக்குகளில் போர்ட் இல்லாவிட்டால் அறிகுறி பயன்முறையைப் பயன்படுத்தவும்.',
      te: 'OBD పోర్ట్‌లు ఎక్కువగా కార్లు మరియు అడ్వాన్స్‌డ్ బైక్‌లలో ఉంటాయి. పోర్ట్ లేకపోతే సింప్టమ్ మోడ్‌ను వాడండి.',
      bn: 'OBD পোর্ট বেশিরভাগ গাড়ি ও উন্নত বাইকে থাকে। পোর্ট না থাকলে সিম্পটম মোড ব্যবহার করুন।',
      mr: 'OBD पोर्ट बहुतेक कार आणि प्रगत बाइकमध्ये असतात. पोर्ट नसल्यास लक्षण मोड वापरा.',
      gu: 'OBD પોર્ટ મોટેભાગે કાર અને એડવાન્સ બાઇકમાં હોય છે. પોર્ટ ન હોય તો સિમ્પ્ટમ મોડ વાપરો.',
      kn: 'OBD ಪೋರ್ಟ್‌ಗಳು ಹೆಚ್ಚಾಗಿ ಕಾರು ಮತ್ತು ಸುಧಾರಿತ ಬೈಕ್‌ಗಳಲ್ಲಿ ಇರುತ್ತವೆ. ಪೋರ್ಟ್ ಇಲ್ಲದಿದ್ದರೆ ಸಿಂಪ್ಟಮ್ ಮೋಡ್ ಬಳಸಿ.',
      ml: 'OBD പോർട്ടുകൾ കൂടുതലും കാറുകളിലും നൂതന ബൈക്കുകളിലുമാണ്. പോർട്ട് ഇല്ലെങ്കിൽ സിംപ്റ്റം മോഡ് ഉപയോഗിക്കുക.'
    },
    connect: {
      en: '🔌 Connect adapter', hi: '🔌 अडैप्टर कनेक्ट करें', ta: '🔌 அடாப்டரை இணை',
      te: '🔌 అడాప్టర్ కనెక్ట్ చేయండి', bn: '🔌 অ্যাডাপ্টার কানেক্ট করুন', mr: '🔌 अडॅप्टर कनेक्ट करा',
      gu: '🔌 એડેપ્ટર કનેક્ટ કરો', kn: '🔌 ಅಡಾಪ್ಟರ್ ಕನೆಕ್ಟ್ ಮಾಡಿ', ml: '🔌 അഡാപ്റ്റർ കണക്റ്റ് ചെയ്യുക'
    },
    connected: {
      en: 'Connected', hi: 'कनेक्ट हो गया', ta: 'இணைக்கப்பட்டது', te: 'కనెక్ట్ అయింది',
      bn: 'কানেক্ট হয়েছে', mr: 'कनेक्ट झाले', gu: 'કનેક્ટ થયું', kn: 'ಕನೆಕ್ಟ್ ಆಯಿತು', ml: 'കണക്റ്റ് ആയി'
    },
    reading: {
      en: 'Reading…', hi: 'पढ़ रहे हैं…', ta: 'படிக்கிறது…', te: 'చదువుతోంది…',
      bn: 'পড়া হচ্ছে…', mr: 'वाचत आहे…', gu: 'વાંચી રહ્યું છે…', kn: 'ಓದುತ್ತಿದೆ…', ml: 'വായിക്കുന്നു…'
    },
    liveData: {
      en: 'Live data', hi: 'लाइव डेटा', ta: 'நேரடி தரவு', te: 'లైవ్ డేటా',
      bn: 'লাইভ ডেটা', mr: 'लाइव्ह डेटा', gu: 'લાઇવ ડેટા', kn: 'ಲೈವ್ ಡೇಟಾ', ml: 'ലൈവ് ഡാറ്റ'
    },
    troubleCodes: {
      en: 'Trouble codes', hi: 'ट्रबल कोड', ta: 'பிழை குறியீடுகள்', te: 'ట్రబుల్ కోడ్‌లు',
      bn: 'ট্রাবল কোড', mr: 'ट्रबल कोड', gu: 'ટ્રબલ કોડ', kn: 'ಟ್ರಬಲ್ ಕೋಡ್‌ಗಳು', ml: 'ട്രബിൾ കോഡുകൾ'
    },
    noCodes: {
      en: 'No codes — all clear', hi: 'कोई कोड नहीं — सब ठीक', ta: 'குறியீடு இல்லை — அனைத்தும் சரி',
      te: 'కోడ్‌లు లేవు — అంతా బాగుంది', bn: 'কোনো কোড নেই — সব ঠিক', mr: 'कोड नाही — सर्व ठीक',
      gu: 'કોઈ કોડ નથી — બધું બરાબર', kn: 'ಕೋಡ್‌ಗಳಿಲ್ಲ — ಎಲ್ಲಾ ಸರಿ', ml: 'കോഡുകളില്ല — എല്ലാം ശരി'
    },
    notSupported: {
      en: 'Live OBD needs Chrome on Android + a Bluetooth ELM327 adapter. On iPhone or desktop, use Symptom mode instead.',
      hi: 'लाइव OBD के लिए Android पर Chrome + ब्लूटूथ ELM327 अडैप्टर चाहिए। iPhone या डेस्कटॉप पर लक्षण मोड इस्तेमाल करें।',
      ta: 'நேரடி OBD-க்கு Android-இல் Chrome + புளூடூத் ELM327 அடாப்டர் தேவை. iPhone அல்லது டெஸ்க்டாப்பில் அறிகுறி பயன்முறையைப் பயன்படுத்தவும்.',
      te: 'లైవ్ OBD కోసం Android లో Chrome + బ్లూటూత్ ELM327 అడాప్టర్ అవసరం. iPhone లేదా డెస్క్‌టాప్‌లో సింప్టమ్ మోడ్ వాడండి.',
      bn: 'লাইভ OBD-র জন্য Android-এ Chrome + ব্লুটুথ ELM327 অ্যাডাপ্টার দরকার। iPhone বা ডেস্কটপে সিম্পটম মোড ব্যবহার করুন।',
      mr: 'लाइव्ह OBD साठी Android वर Chrome + ब्लूटूथ ELM327 अडॅप्टर हवे. iPhone किंवा डेस्कटॉपवर लक्षण मोड वापरा.',
      gu: 'લાઇવ OBD માટે Android પર Chrome + બ્લૂટૂથ ELM327 એડેપ્ટર જોઈએ. iPhone કે ડેસ્કટોપ પર સિમ્પ્ટમ મોડ વાપરો.',
      kn: 'ಲೈವ್ OBD ಗೆ Android ನಲ್ಲಿ Chrome + ಬ್ಲೂಟೂತ್ ELM327 ಅಡಾಪ್ಟರ್ ಬೇಕು. iPhone ಅಥವಾ ಡೆಸ್ಕ್‌ಟಾಪ್‌ನಲ್ಲಿ ಸಿಂಪ್ಟಮ್ ಮೋಡ್ ಬಳಸಿ.',
      ml: 'ലൈവ് OBD-ക്ക് Android-ൽ Chrome + ബ്ലൂടൂത്ത് ELM327 അഡാപ്റ്റർ വേണം. iPhone അല്ലെങ്കിൽ ഡെസ്ക്ടോപ്പിൽ സിംപ്റ്റം മോഡ് ഉപയോഗിക്കുക.'
    },
    connectToInterpret: {
      en: 'Connect to interpret', hi: 'समझाने के लिए कनेक्ट करें', ta: 'விளக்க இணையவும்',
      te: 'వివరించడానికి కనెక్ట్ అవ్వండి', bn: 'ব্যাখ্যা করতে কানেক্ট করুন', mr: 'समजावण्यासाठी कनेक्ट करा',
      gu: 'સમજાવવા કનેક્ટ કરો', kn: 'ವಿವರಿಸಲು ಕನೆಕ್ಟ್ ಮಾಡಿ', ml: 'വ്യാഖ്യാനിക്കാൻ കണക്റ്റ് ചെയ്യുക'
    },
    rpm:   { en: 'RPM', hi: 'RPM', ta: 'RPM', te: 'RPM', bn: 'RPM', mr: 'RPM', gu: 'RPM', kn: 'RPM', ml: 'RPM' },
    coolant: {
      en: 'Coolant', hi: 'कूलेंट', ta: 'குளிரூட்டி', te: 'కూలెంట్', bn: 'কুল্যান্ট',
      mr: 'कूलंट', gu: 'કૂલન્ટ', kn: 'ಕೂಲೆಂಟ್', ml: 'കൂളന്റ്'
    },
    speed: {
      en: 'Speed', hi: 'गति', ta: 'வேகம்', te: 'వేగం', bn: 'গতি',
      mr: 'वेग', gu: 'ઝડપ', kn: 'ವೇಗ', ml: 'വേഗത'
    },
    voltage: {
      en: 'Voltage', hi: 'वोल्टेज', ta: 'மின்னழுத்தம்', te: 'వోల్టేజ్', bn: 'ভোল্টেজ',
      mr: 'व्होल्टेज', gu: 'વોલ્ટેજ', kn: 'ವೋಲ್ಟೇಜ್', ml: 'വോൾട്ടേജ്'
    },
    close: {
      en: 'Close', hi: 'बंद करें', ta: 'மூடு', te: 'మూసివేయండి', bn: 'বন্ধ করুন',
      mr: 'बंद करा', gu: 'બંધ કરો', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കുക'
    },
    waiting: {
      en: 'No reading yet', hi: 'अभी कोई रीडिंग नहीं', ta: 'இன்னும் அளவீடு இல்லை',
      te: 'ఇంకా రీడింగ్ లేదు', bn: 'এখনো রিডিং নেই', mr: 'अजून रीडिंग नाही',
      gu: 'હજુ રીડિંગ નથી', kn: 'ಇನ್ನೂ ರೀಡಿಂಗ್ ಇಲ್ಲ', ml: 'ഇതുവരെ റീഡിംഗ് ഇല്ല'
    }
  };

  /* ── Web Bluetooth UUIDs ───────────────────────────────────────────── */
  var NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  var NUS_RX      = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // write to ELM327 (phone→device, "RX" of device)
  var NUS_TX      = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // notify from ELM327 (device→phone, "TX" of device)
  var SPP_SERVICE = '00001101-0000-1000-8000-00805f9b34fb'; // classic Serial Port Profile (optional service)
  var FFE0_SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb'; // HM-10 style (very common on cheap ELM327)
  var FFE1_CHAR    = '0000ffe1-0000-1000-8000-00805f9b34fb';

  /* ── module state ──────────────────────────────────────────────────── */
  var st = {
    opts: null, overlay: null, root: null, vehicle: '4w',
    device: null, server: null, rxChar: null, txChar: null,
    buf: '', pending: null, live: {}, dtcs: null, interp: null,
    phase: 'idle' // idle | connecting | reading | done | error
  };

  /* ── styles (scoped, injected once) ────────────────────────────────── */
  function injectStyle() {
    if (document.getElementById('chitti-obd-style')) return;
    var s = document.createElement('style');
    s.id = 'chitti-obd-style';
    s.textContent = [
      '.cobd-ov{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.55);display:flex;align-items:flex-end;justify-content:center;font-family:inherit;-webkit-tap-highlight-color:transparent}',
      '@media(min-width:560px){.cobd-ov{align-items:center}}',
      '.cobd-panel{width:100%;max-width:440px;max-height:92vh;overflow:auto;background:#fff;border-radius:20px 20px 0 0;box-shadow:0 -8px 40px rgba(0,0,0,.3)}',
      '@media(min-width:560px){.cobd-panel{border-radius:20px}}',
      '.cobd-hd{position:sticky;top:0;display:flex;align-items:center;gap:10px;padding:16px 16px 12px;background:linear-gradient(180deg,#FF9933,#fff 140%);border-bottom:3px solid #138808}',
      '.cobd-hd h3{margin:0;font-size:18px;font-weight:900;color:#0a1a3f;flex:1;line-height:1.25}',
      '.cobd-x{min-width:48px;min-height:48px;border:0;background:rgba(255,255,255,.7);border-radius:12px;font-size:22px;cursor:pointer;color:#0a1a3f;font-weight:900}',
      '.cobd-body{padding:14px 16px 22px}',
      '.cobd-explain{font-size:15px;line-height:1.55;color:#1f2937;margin:0 0 14px;background:#f1f5ff;border:1.5px solid #c7d2fe;border-radius:14px;padding:12px 14px}',
      '.cobd-note{font-size:13px;line-height:1.5;color:#78350f;background:#fff8e1;border:1.5px solid #fcd34d;border-radius:12px;padding:10px 12px;margin:0 0 14px}',
      '.cobd-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;border:0;border-radius:14px;font-size:17px;font-weight:900;cursor:pointer;background:#138808;color:#fff;box-shadow:0 2px 0 #0c5c05}',
      '.cobd-btn:active{transform:translateY(1px);box-shadow:0 1px 0 #0c5c05}',
      '.cobd-btn[disabled]{opacity:.55;cursor:default;box-shadow:none}',
      '.cobd-btn.sec{background:#0a1a3f;box-shadow:0 2px 0 #050d22}',
      '.cobd-status{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:800;margin:14px 0 6px;color:#0a1a3f}',
      '.cobd-dot{width:11px;height:11px;border-radius:50%;background:#cbd5e1;flex:none}',
      '.cobd-dot.on{background:#138808;box-shadow:0 0 0 4px rgba(19,136,8,.18)}',
      '.cobd-dot.busy{background:#FF9933;box-shadow:0 0 0 4px rgba(255,153,51,.2)}',
      '.cobd-dot.err{background:#dc2626;box-shadow:0 0 0 4px rgba(220,38,38,.18)}',
      '.cobd-spin{width:16px;height:16px;border:3px solid #fcd34d;border-top-color:#FF9933;border-radius:50%;display:inline-block;animation:cobdspin .8s linear infinite}',
      '@keyframes cobdspin{to{transform:rotate(360deg)}}',
      '.cobd-sect{font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#0a1a3f;margin:18px 0 8px}',
      '.cobd-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.cobd-cell{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:12px 12px;min-height:74px;display:flex;flex-direction:column;gap:3px}',
      '.cobd-cell .lbl{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#64748b}',
      '.cobd-cell .val{font-size:24px;font-weight:900;color:#0a1a3f;line-height:1.1}',
      '.cobd-cell .val small{font-size:13px;font-weight:800;color:#64748b}',
      '.cobd-dtc{display:flex;flex-direction:column;gap:8px}',
      '.cobd-dtc-row{background:#fff;border:1.5px solid #fca5a5;border-left:5px solid #dc2626;border-radius:12px;padding:10px 12px}',
      '.cobd-dtc-row .code{font-size:17px;font-weight:900;color:#7f1d1d;letter-spacing:.06em}',
      '.cobd-dtc-row .desc{font-size:14px;color:#1f2937;margin-top:3px;line-height:1.5}',
      '.cobd-dtc-row .desc.pending{color:#92400e;font-style:italic}',
      '.cobd-clear{background:#dcfce7;border:1.5px solid #86efac;border-radius:12px;padding:12px 14px;font-size:15px;font-weight:800;color:#14532d}',
      '.cobd-err{background:#fee2e2;border:1.5px solid #fca5a5;border-radius:12px;padding:12px 14px;font-size:14px;color:#7f1d1d;line-height:1.5;margin-top:12px;word-break:break-word}',
      '.cobd-unsupported{font-size:15px;line-height:1.6;color:#1f2937;background:#fff8e1;border:1.5px solid #fcd34d;border-radius:14px;padding:14px 16px;margin-bottom:16px}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── public: support check ─────────────────────────────────────────── */
  function isSupported() {
    return !!(navigator && navigator.bluetooth && typeof navigator.bluetooth.requestDevice === 'function');
  }

  /* ── DOM helpers ───────────────────────────────────────────────────── */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── overlay shell ─────────────────────────────────────────────────── */
  function buildShell() {
    injectStyle();
    var ov = el('div', 'cobd-ov');
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', L(T.title));
    var panel = el('div', 'cobd-panel');
    var hd = el('div', 'cobd-hd');
    var h3 = el('h3'); h3.textContent = L(T.title);
    var x = el('button', 'cobd-x', '✕'); x.setAttribute('aria-label', L(T.close));
    x.onclick = close;
    hd.appendChild(h3); hd.appendChild(x);
    var body = el('div', 'cobd-body');
    panel.appendChild(hd); panel.appendChild(body);
    ov.appendChild(panel);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    st.overlay = ov; st.root = body; st._h3 = h3; st._x = x;
    document.body.appendChild(ov);
    return body;
  }

  /* ── render: not-supported honest panel ────────────────────────────── */
  function renderUnsupported() {
    var b = st.root; b.innerHTML = '';
    b.appendChild(el('div', 'cobd-unsupported', esc(L(T.notSupported))));
    var btn = el('button', 'cobd-btn sec'); btn.textContent = L(T.close);
    btn.onclick = close;
    b.appendChild(btn);
  }

  /* ── render: main connect/live screen ──────────────────────────────── */
  function render() {
    var b = st.root; if (!b) return;
    b.innerHTML = '';
    st._h3 && (st._h3.textContent = L(T.title));
    st._x && st._x.setAttribute('aria-label', L(T.close));

    b.appendChild(el('p', 'cobd-explain', esc(L(T.explain))));
    if (st.vehicle === '2w') b.appendChild(el('div', 'cobd-note', esc(L(T.bikeNote))));

    // connect button
    var connect = el('button', 'cobd-btn');
    connect.textContent = L(T.connect);
    if (st.phase === 'connecting' || st.phase === 'reading') connect.setAttribute('disabled', '');
    connect.onclick = onConnect;
    b.appendChild(connect);

    // status line
    if (st.phase !== 'idle') {
      var status = el('div', 'cobd-status');
      var dot = el('span', 'cobd-dot');
      var label = '';
      if (st.phase === 'connecting') { dot.classList.add('busy'); label = L(T.reading); }
      else if (st.phase === 'reading') { dot.classList.add('busy'); label = L(T.reading); }
      else if (st.phase === 'done') { dot.classList.add('on'); label = L(T.connected); }
      else if (st.phase === 'error') { dot.classList.add('err'); label = L(T.connected); }
      status.appendChild(dot);
      var ls = el('span'); ls.textContent = label; status.appendChild(ls);
      if (st.phase === 'connecting' || st.phase === 'reading') status.appendChild(el('span', 'cobd-spin'));
      b.appendChild(status);
    }

    // live data cards
    if (st.phase === 'reading' || st.phase === 'done') {
      b.appendChild(el('div', 'cobd-sect', esc(L(T.liveData))));
      var grid = el('div', 'cobd-grid');
      grid.appendChild(cell(L(T.rpm), st.live.rpm != null ? st.live.rpm + ' <small>RPM</small>' : '—'));
      grid.appendChild(cell(L(T.coolant), st.live.coolant != null ? st.live.coolant + ' <small>°C</small>' : '—'));
      grid.appendChild(cell(L(T.speed), st.live.speed != null ? st.live.speed + ' <small>km/h</small>' : '—'));
      grid.appendChild(cell(L(T.voltage), st.live.voltage != null ? st.live.voltage + ' <small>V</small>' : '—'));
      b.appendChild(grid);

      // DTC section
      b.appendChild(el('div', 'cobd-sect', esc(L(T.troubleCodes))));
      if (st.dtcs == null) {
        b.appendChild(el('div', 'cobd-cell', esc(L(T.waiting))));
      } else if (st.dtcs.length === 0) {
        b.appendChild(el('div', 'cobd-clear', '✅ ' + esc(L(T.noCodes))));
      } else {
        var wrap = el('div', 'cobd-dtc');
        st.dtcs.forEach(function (code) {
          var row = el('div', 'cobd-dtc-row');
          row.appendChild(el('div', 'code', esc(code)));
          var interp = st.interp && st.interp[code];
          if (interp) row.appendChild(el('div', 'desc', esc(interp)));
          else row.appendChild(el('div', 'desc pending', esc(L(T.connectToInterpret))));
          wrap.appendChild(row);
        });
        b.appendChild(wrap);
      }
    }

    // error surface
    if (st.error) b.appendChild(el('div', 'cobd-err', '⚠️ ' + esc(st.error)));
  }

  function cell(lbl, valHtml) {
    var c = el('div', 'cobd-cell');
    c.appendChild(el('div', 'lbl', esc(lbl)));
    c.appendChild(el('div', 'val', valHtml));
    return c;
  }

  /* ── BLE: connect + handshake + read ───────────────────────────────── */
  function onConnect() {
    if (!isSupported()) { renderUnsupported(); return; }
    st.error = null; st.phase = 'connecting'; render();
    runConnect().catch(function (e) {
      // requestDevice rejects with NotFoundError when the user cancels chooser
      var name = e && e.name;
      if (name === 'NotFoundError' || /cancel/i.test(String(e && e.message))) {
        // graceful: user dismissed the picker → back to idle, no scary error
        st.phase = 'idle'; st.error = null;
      } else {
        st.phase = 'error';
        st.error = (e && (e.message || e.name)) ? (e.message || e.name) : String(e);
      }
      render();
    });
  }

  function getEncoder() { return new TextEncoder(); }

  async function runConnect() {
    // 1) choose device
    var device;
    var optionalServices = [NUS_SERVICE, FFE0_SERVICE, SPP_SERVICE];
    var filters = [{ namePrefix: 'OBD' }, { namePrefix: 'OBDII' }, { namePrefix: 'ELM' },
                   { namePrefix: 'Vlink' }, { namePrefix: 'V-LINK' }, { namePrefix: 'IOS-Vlink' }];
    try {
      device = await navigator.bluetooth.requestDevice({ filters: filters, optionalServices: optionalServices });
    } catch (e) {
      if (e && (e.name === 'NotFoundError')) {
        // either user cancelled OR no name matched — retry once accepting all
        device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: optionalServices });
      } else { throw e; }
    }
    st.device = device;
    if (device.addEventListener) {
      device.addEventListener('gattserverdisconnected', function () {
        if (st.phase !== 'idle') { st.phase = 'error'; st.error = 'Adapter disconnected'; render(); }
      });
    }

    // 2) connect GATT
    var server = await device.gatt.connect();
    st.server = server;

    // 3) discover UART rx/tx — try Nordic UART, then HM-10 FFE0
    var rx = null, tx = null;
    try {
      var svc = await server.getPrimaryService(NUS_SERVICE);
      rx = await svc.getCharacteristic(NUS_RX);
      tx = await svc.getCharacteristic(NUS_TX);
    } catch (e1) {
      // HM-10 / FFE0: single characteristic FFE1 is both write + notify
      var svc2 = await server.getPrimaryService(FFE0_SERVICE);
      var c = await svc2.getCharacteristic(FFE1_CHAR);
      rx = c; tx = c;
    }
    st.rxChar = rx; st.txChar = tx;

    // 4) subscribe to notifications (frames terminate with '>')
    st.buf = '';
    await tx.startNotifications();
    tx.addEventListener('characteristicvaluechanged', onNotify);

    // 5) ELM327 init handshake
    st.phase = 'reading'; render();
    await cmd('ATZ');   // reset
    await cmd('ATE0');  // echo off
    await cmd('ATL0');  // linefeeds off
    await cmd('ATSP0'); // auto protocol

    // 6) live PIDs (ATRV first — purely the adapter, always answers)
    var voltage = await cmd('ATRV');
    st.live.voltage = parseVoltage(voltage);

    var rpmR = await cmd('010C'); st.live.rpm = parseRPM(rpmR); render();
    var clR  = await cmd('0105'); st.live.coolant = parseCoolant(clR); render();
    var spR  = await cmd('010D'); st.live.speed = parseSpeed(spR); render();

    // 7) stored DTCs (Mode 03)
    var dtcR = await cmd('03');
    st.dtcs = parseDTCs(dtcR);

    st.phase = 'done'; render();

    // 8) interpret DTCs via backend (online only) — never fabricate
    if (st.dtcs && st.dtcs.length) interpretDTCs(st.dtcs);
  }

  /* ── ELM327 write+read one command, resolve on '>' prompt ──────────── */
  function cmd(s) {
    return new Promise(function (resolve, reject) {
      if (!st.rxChar) { reject(new Error('no rx characteristic')); return; }
      st.buf = '';
      var done = false;
      var timer = setTimeout(function () {
        if (done) return; done = true; st.pending = null;
        // honest: return whatever we got rather than hang forever
        resolve(st.buf);
      }, 4500);
      st.pending = function () {
        if (done) return; done = true; clearTimeout(timer); st.pending = null;
        resolve(st.buf);
      };
      try {
        var data = getEncoder().encode(s + '\r');
        var w = st.rxChar.writeValueWithoutResponse
          ? st.rxChar.writeValueWithoutResponse(data)
          : st.rxChar.writeValue(data);
        Promise.resolve(w).catch(function (e) {
          if (done) return; done = true; clearTimeout(timer); st.pending = null; reject(e);
        });
      } catch (e) {
        if (done) return; done = true; clearTimeout(timer); st.pending = null; reject(e);
      }
    });
  }

  function onNotify(ev) {
    try {
      var v = ev.target.value; // DataView
      var s = '';
      for (var i = 0; i < v.byteLength; i++) s += String.fromCharCode(v.getUint8(i));
      st.buf += s;
      if (st.buf.indexOf('>') !== -1 && st.pending) st.pending();
    } catch (e) { /* ignore malformed frame */ }
  }

  /* ── parsers (standard SAE PID formulas) ───────────────────────────── */
  // Pull hex data bytes that follow a given Mode-01 response header (e.g. "41 0C ..").
  function dataBytes(raw, modeByte, pid) {
    if (!raw) return null;
    // normalise: strip prompt, ATcommand echoes, whitespace; keep hex
    var clean = raw.replace(/[\r\n>]/g, ' ').replace(/SEARCHING\.?\.?\.?/gi, ' ')
      .replace(/[^0-9A-Fa-f ]/g, ' ').trim().toUpperCase();
    var toks = clean.split(/\s+/).filter(Boolean);
    var hdr = modeByte.toUpperCase(); // '41'
    var pidU = pid.toUpperCase();     // '0C'
    for (var i = 0; i < toks.length - 1; i++) {
      if (toks[i] === hdr && toks[i + 1] === pidU) {
        return toks.slice(i + 2).map(function (h) { return parseInt(h, 16); });
      }
    }
    return null;
  }
  function parseRPM(raw) {
    var d = dataBytes(raw, '41', '0C'); if (!d || d.length < 2) return null;
    return Math.round(((d[0] * 256) + d[1]) / 4);
  }
  function parseCoolant(raw) {
    var d = dataBytes(raw, '41', '05'); if (!d || d.length < 1) return null;
    return d[0] - 40;
  }
  function parseSpeed(raw) {
    var d = dataBytes(raw, '41', '0D'); if (!d || d.length < 1) return null;
    return d[0];
  }
  function parseVoltage(raw) {
    if (!raw) return null;
    var m = String(raw).match(/(\d+(?:\.\d+)?)\s*V?/i);
    return m ? parseFloat(m[1]) : null;
  }
  // Mode 03 → array of Pxxxx/Cxxxx/Bxxxx/Uxxxx codes. '43' header then pairs of bytes.
  function parseDTCs(raw) {
    if (!raw) return [];
    if (/NO DATA|UNABLE/i.test(raw)) return [];
    var clean = raw.replace(/[\r\n>]/g, ' ').replace(/SEARCHING\.?\.?\.?/gi, ' ')
      .replace(/[^0-9A-Fa-f ]/g, ' ').trim().toUpperCase();
    var toks = clean.split(/\s+/).filter(Boolean);
    var idx = toks.indexOf('43');
    if (idx === -1) return [];
    var pairBytes = toks.slice(idx + 1);
    var codes = [];
    for (var i = 0; i + 1 < pairBytes.length; i += 2) {
      var a = parseInt(pairBytes[i], 16), bb = parseInt(pairBytes[i + 1], 16);
      if (isNaN(a) || isNaN(bb)) continue;
      if (a === 0 && bb === 0) continue; // padding / no code
      var sys = ['P', 'C', 'B', 'U'][(a >> 6) & 0x03];
      var d1 = (a >> 4) & 0x03;
      var d2 = a & 0x0F;
      var code = sys + String(d1) + d2.toString(16).toUpperCase() +
                 ((bb >> 4) & 0x0F).toString(16).toUpperCase() +
                 (bb & 0x0F).toString(16).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /* ── interpret DTCs via the car backend (online only, never fabricate) ─ */
  function apiBase() {
    if (typeof window.API_BASE === 'string' && window.API_BASE) return window.API_BASE;
    try { if (typeof API_BASE === 'string' && API_BASE) return API_BASE; } catch (e) {}
    return null;
  }
  function interpretDTCs(codes) {
    var online = (typeof navigator.onLine === 'undefined') ? true : navigator.onLine;
    var base = apiBase();
    if (!online || !base) { render(); return; } // leave honest "connect to interpret" note
    var url = base.replace(/\/+$/, '') + '/api/4w/obd/snapshot';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle: st.vehicle, codes: codes,
        live: st.live, language: (window.CURRENT_LANG || 'en')
      })
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
      .then(function (j) {
        // accept {interpretations:{P0420:"..."}} or {codes:[{code,plain}]}
        var map = {};
        if (j && j.interpretations && typeof j.interpretations === 'object') map = j.interpretations;
        else if (j && Array.isArray(j.codes)) j.codes.forEach(function (c) { if (c && c.code) map[c.code] = c.plain || c.text || c.meaning; });
        else if (j && Array.isArray(j.results)) j.results.forEach(function (c) { if (c && c.code) map[c.code] = c.plain || c.text || c.meaning; });
        st.interp = map; render();
      })
      .catch(function () { /* honest fallback: keep raw codes + "connect to interpret" */ render(); });
  }

  /* ── public: open ──────────────────────────────────────────────────── */
  function open(opts) {
    opts = opts || {};
    st.opts = opts;
    st.vehicle = (opts.vehicle === '2w') ? '2w' : '4w';
    st.device = null; st.server = null; st.rxChar = null; st.txChar = null;
    st.buf = ''; st.pending = null; st.live = {}; st.dtcs = null; st.interp = null;
    st.error = null; st.phase = 'idle';

    buildShell();
    if (!isSupported()) renderUnsupported();
    else render();
  }

  /* ── close + GATT cleanup ──────────────────────────────────────────── */
  function close() {
    try {
      if (st.txChar) { try { st.txChar.removeEventListener('characteristicvaluechanged', onNotify); } catch (e) {} }
      if (st.txChar && st.txChar.stopNotifications) { try { st.txChar.stopNotifications(); } catch (e) {} }
      if (st.server && st.server.connected && st.server.disconnect) { try { st.server.disconnect(); } catch (e) {} }
      else if (st.device && st.device.gatt && st.device.gatt.connected) { try { st.device.gatt.disconnect(); } catch (e) {} }
    } catch (e) { /* never throw on close */ }
    st.server = null; st.rxChar = null; st.txChar = null; st.pending = null;
    if (st.overlay && st.overlay.parentNode) st.overlay.parentNode.removeChild(st.overlay);
    st.overlay = null; st.root = null; st._h3 = null; st._x = null;
    st.phase = 'idle';
  }

  /* ── re-render on language change ──────────────────────────────────── */
  window.addEventListener('chitti:langchange', function () {
    if (!st.overlay || !st.root) return;
    if (!isSupported()) { renderUnsupported(); st._h3 && (st._h3.textContent = L(T.title)); return; }
    render();
  });

  window.ChittiOBD = { isSupported: isSupported, open: open };
})();
