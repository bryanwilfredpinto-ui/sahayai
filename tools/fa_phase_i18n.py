# -*- coding: utf-8 -*-
"""Inject CFOS 'complete-from-our-end' static UI labels (Senior/Kids Mode,
everyday Family coordination, Sustainability observability, Size profile) into
strings.js for the 9 primary languages. Short labels native in all 9; long
sub-descriptions en/hi (EN fallback for the rest — established policy).
Run: python tools/fa_phase_i18n.py  then regen the bundle.
"""
import re, json, io, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SP = os.path.join(ROOT, 'strings.js')

SHORT = {
 'en': {'fa.sk.title':'👵🧒 Senior & Kids Mode',
        'fa.fam.title':'👨‍👩‍👧 Family — coordinate for any day','fa.fam.btn':'🎨 Coordinate the family',
        'fa.eco.title':'🌱 My impact — money & planet saved','fa.eco.btn':'🌱 Show my impact',
        'fa.sz.title':'📏 My size (cross-brand)','fa.sz.btn':'📏 Save my size'},
 'hi': {'fa.sk.title':'👵🧒 बुज़ुर्ग और बच्चों का मोड',
        'fa.fam.title':'👨‍👩‍👧 परिवार — किसी भी दिन का तालमेल','fa.fam.btn':'🎨 परिवार का तालमेल बनाओ',
        'fa.eco.title':'🌱 मेरा असर — पैसा और धरती बचाई','fa.eco.btn':'🌱 मेरा असर दिखाओ',
        'fa.sz.title':'📏 मेरा साइज़ (हर ब्रांड)','fa.sz.btn':'📏 मेरा साइज़ सहेजो'},
 'ta': {'fa.sk.title':'👵🧒 மூத்தோர் & குழந்தைகள் பயன்முறை','fa.fam.title':'👨‍👩‍👧 குடும்பம் — எந்த நாளுக்கும் ஒத்திசைவு','fa.fam.btn':'🎨 குடும்பத்தை ஒருங்கிணை','fa.eco.title':'🌱 என் தாக்கம் — பணமும் பூமியும்','fa.eco.btn':'🌱 என் தாக்கத்தைக் காட்டு','fa.sz.title':'📏 என் அளவு (அனைத்து பிராண்டும்)','fa.sz.btn':'📏 என் அளவைச் சேமி'},
 'bn': {'fa.sk.title':'👵🧒 প্রবীণ ও শিশু মোড','fa.fam.title':'👨‍👩‍👧 পরিবার — যেকোনো দিনের সমন্বয়','fa.fam.btn':'🎨 পরিবার সমন্বয় করো','fa.eco.title':'🌱 আমার প্রভাব — টাকা ও পৃথিবী','fa.eco.btn':'🌱 আমার প্রভাব দেখাও','fa.sz.title':'📏 আমার মাপ (সব ব্র্যান্ড)','fa.sz.btn':'📏 আমার মাপ সংরক্ষণ'},
 'te': {'fa.sk.title':'👵🧒 సీనియర్ & పిల్లల మోడ్','fa.fam.title':'👨‍👩‍👧 కుటుంబం — ఏ రోజుకైనా సమన్వయం','fa.fam.btn':'🎨 కుటుంబాన్ని సమన్వయం చేయి','fa.eco.title':'🌱 నా ప్రభావం — డబ్బు & భూమి','fa.eco.btn':'🌱 నా ప్రభావం చూపించు','fa.sz.title':'📏 నా సైజు (అన్ని బ్రాండ్లు)','fa.sz.btn':'📏 నా సైజు సేవ్ చేయి'},
 'mr': {'fa.sk.title':'👵🧒 ज्येष्ठ व मुले मोड','fa.fam.title':'👨‍👩‍👧 कुटुंब — कोणत्याही दिवसाचा ताळमेळ','fa.fam.btn':'🎨 कुटुंबाचा ताळमेळ करा','fa.eco.title':'🌱 माझा परिणाम — पैसा व पृथ्वी','fa.eco.btn':'🌱 माझा परिणाम दाखवा','fa.sz.title':'📏 माझा आकार (सर्व ब्रँड)','fa.sz.btn':'📏 माझा आकार जतन करा'},
 'gu': {'fa.sk.title':'👵🧒 વરિષ્ઠ અને બાળકો મોડ','fa.fam.title':'👨‍👩‍👧 પરિવાર — કોઈપણ દિવસનો તાલમેલ','fa.fam.btn':'🎨 પરિવારનો તાલમેલ કરો','fa.eco.title':'🌱 મારી અસર — પૈસા અને પૃથ્વી','fa.eco.btn':'🌱 મારી અસર બતાવો','fa.sz.title':'📏 મારું માપ (બધી બ્રાન્ડ)','fa.sz.btn':'📏 મારું માપ સાચવો'},
 'kn': {'fa.sk.title':'👵🧒 ಹಿರಿಯರು ಮತ್ತು ಮಕ್ಕಳ ಮೋಡ್','fa.fam.title':'👨‍👩‍👧 ಕುಟುಂಬ — ಯಾವ ದಿನಕ್ಕೂ ಸಮನ್ವಯ','fa.fam.btn':'🎨 ಕುಟುಂಬವನ್ನು ಸಮನ್ವಯಗೊಳಿಸಿ','fa.eco.title':'🌱 ನನ್ನ ಪ್ರಭಾವ — ಹಣ ಮತ್ತು ಭೂಮಿ','fa.eco.btn':'🌱 ನನ್ನ ಪ್ರಭಾವ ತೋರಿಸಿ','fa.sz.title':'📏 ನನ್ನ ಅಳತೆ (ಎಲ್ಲಾ ಬ್ರಾಂಡ್)','fa.sz.btn':'📏 ನನ್ನ ಅಳತೆ ಉಳಿಸಿ'},
 'ml': {'fa.sk.title':'👵🧒 മുതിർന്നവർ & കുട്ടികൾ മോഡ്','fa.fam.title':'👨‍👩‍👧 കുടുംബം — ഏത് ദിവസവും ഏകോപനം','fa.fam.btn':'🎨 കുടുംബം ഏകോപിപ്പിക്കൂ','fa.eco.title':'🌱 എന്റെ സ്വാധീനം — പണവും ഭൂമിയും','fa.eco.btn':'🌱 എന്റെ സ്വാധീനം കാണിക്കൂ','fa.sz.title':'📏 എന്റെ വലുപ്പം (എല്ലാ ബ്രാൻഡും)','fa.sz.btn':'📏 എന്റെ വലുപ്പം സേവ് ചെയ്യൂ'},
}
SUB = {
 'en': {'fa.sk.sub':"Dressing made easy for every age — adaptive, comfortable, dignified. Pick who you're styling; Chitti adapts the guidance and the outfits (easy fastenings, safe footwear, room to grow) — and never comments on anyone's body.",
        'fa.fam.sub':'One household, one coordinated look for any day — festival, function or family photo. Chitti finds a shared colour theme from everyone\'s wardrobe and gives each person a role, so the family reads together without anyone buying new.',
        'fa.eco.sub':'Every ₹0 outfit, every repair, every re-wear adds up. Chitti shows how much money and how much carbon you have saved by wearing what you already own — the Founder Rule, made visible. Stays on your device.',
        'fa.sz.sub':'Save your measurements once and Chitti gives honest size guidance across brands (Indian, US, UK, EU) — so you order the right fit and avoid returns. Numbers only, never a comment on your body.'},
 'hi': {'fa.sk.sub':'हर उम्र के लिए पहनना आसान — अनुकूल, आरामदायक, सम्मानजनक। चुनिए किसे style करना है; Chitti सलाह और outfit दोनों ढालती है (आसान fastening, सुरक्षित जूते, बढ़ने की जगह) — और किसी के शरीर पर कभी टिप्पणी नहीं करती।',
        'fa.fam.sub':'एक घर, किसी भी दिन का एक तालमेल वाला look — त्योहार, function या परिवार की photo। Chitti सबकी अलमारी से एक साझा रंग-थीम चुनती है और हर किसी को भूमिका देती है — बिना कुछ नया खरीदे पूरा परिवार एक-साथ जँचता है।',
        'fa.eco.sub':'हर ₹0 outfit, हर मरम्मत, हर बार फिर पहनना — सब जुड़ता है। Chitti दिखाती है कि जो आपके पास है उसे पहनकर आपने कितना पैसा और कितना carbon बचाया — Founder Rule, आँखों के सामने। सब इसी device पर।',
        'fa.sz.sub':'अपना माप एक बार सहेजें — Chitti हर ब्रांड (Indian, US, UK, EU) में सच्ची size सलाह देती है, ताकि सही fit मिले और return न करना पड़े। सिर्फ़ नाप, शरीर पर कोई टिप्पणी नहीं।'},
}

def inject(s, lang, kv):
    m = re.search(r'\n(\s*)' + re.escape(lang) + r':\s*\{', s)
    if not m: return s, 0
    ins = m.end()
    payload = ''.join('"%s":%s,' % (k, json.dumps(v, ensure_ascii=False)) for k, v in kv.items())
    return s[:ins] + payload + s[ins:], len(kv)

s = io.open(SP, encoding='utf-8').read()
rep = {}
for lang in ['en','hi','ta','bn','te','mr','gu','kn','ml']:
    kv = dict(SHORT.get(lang, {})); kv.update(SUB.get(lang, {}))
    # skip keys already present for this lang block (idempotent re-runs)
    s, n = inject(s, lang, kv); rep[lang] = n
io.open(SP, 'w', encoding='utf-8').write(s)
print('injected phase keys:', rep)
