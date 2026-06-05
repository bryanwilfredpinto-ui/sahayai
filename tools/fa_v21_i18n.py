# -*- coding: utf-8 -*-
"""Inject CFOS v2.1 static UI labels (Clothing Doctor / Wedding Planner /
Office Week Planner) into strings.js for the 9 primary languages.
Short labels native in all 9; long sub-descriptions en/hi (EN fallback for the
7, the established policy). Run: python tools/fa_v21_i18n.py  then regen bundle.
"""
import re, json, io, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SP = os.path.join(ROOT, 'strings.js')

SHORT = {
 'en': {'fa.t.doctor':'🩺 Doctor','fa.d.title':"🩺 Clothing Doctor — repair, don't buy",'fa.d.item':'Which item?','fa.d.damage':'What needs fixing?','fa.d.btn':'🩺 Show me how to fix it',
        'fa.w.title':'💍 Wedding Planner — coordinate the whole family','fa.w.func':'Which function?','fa.w.role':'Your role?','fa.w.members':'Who is getting dressed?','fa.w.btn':'💍 Plan the family',
        'fa.o.title':'📅 Office Week Planner — 5 days, no repeats','fa.o.btn':'📅 Plan my week'},
 'hi': {'fa.t.doctor':'🩺 डॉक्टर','fa.d.title':'🩺 कपड़ों का डॉक्टर — मरम्मत करो, खरीदो मत','fa.d.item':'कौन-सा कपड़ा?','fa.d.damage':'क्या ठीक करना है?','fa.d.btn':'🩺 ठीक करना सिखाओ',
        'fa.w.title':'💍 शादी प्लानर — पूरे परिवार का तालमेल','fa.w.func':'कौन-सा फ़ंक्शन?','fa.w.role':'आपकी भूमिका?','fa.w.members':'किन-किन को तैयार करना है?','fa.w.btn':'💍 परिवार का प्लान बनाओ',
        'fa.o.title':'📅 ऑफ़िस सप्ताह प्लानर — 5 दिन, कोई दोहराव नहीं','fa.o.btn':'📅 मेरा हफ़्ता प्लान करो'},
 'ta': {'fa.t.doctor':'🩺 மருத்துவர்','fa.d.title':'🩺 ஆடை மருத்துவர் — பழுது பார், வாங்காதே','fa.d.item':'எந்த ஆடை?','fa.d.damage':'என்ன சரிசெய்ய வேண்டும்?','fa.d.btn':'🩺 எப்படி சரிசெய்வது காட்டு',
        'fa.w.title':'💍 திருமணத் திட்டம் — குடும்பம் முழுவதும் ஒத்திசைவு','fa.w.func':'எந்த நிகழ்வு?','fa.w.role':'உங்கள் பங்கு?','fa.w.members':'யார் தயாராகிறார்கள்?','fa.w.btn':'💍 குடும்பத்தைத் திட்டமிடு',
        'fa.o.title':'📅 அலுவலக வார திட்டம் — 5 நாட்கள், மீண்டும் இல்லை','fa.o.btn':'📅 என் வாரத்தைத் திட்டமிடு'},
 'bn': {'fa.t.doctor':'🩺 ডাক্তার','fa.d.title':'🩺 পোশাক ডাক্তার — মেরামত করুন, কিনবেন না','fa.d.item':'কোন পোশাক?','fa.d.damage':'কী ঠিক করতে হবে?','fa.d.btn':'🩺 কীভাবে ঠিক করব দেখাও',
        'fa.w.title':'💍 বিয়ের পরিকল্পনা — পুরো পরিবারের সমন্বয়','fa.w.func':'কোন অনুষ্ঠান?','fa.w.role':'আপনার ভূমিকা?','fa.w.members':'কারা তৈরি হবে?','fa.w.btn':'💍 পরিবারের পরিকল্পনা',
        'fa.o.title':'📅 অফিস সপ্তাহ পরিকল্পনা — ৫ দিন, পুনরাবৃত্তি নেই','fa.o.btn':'📅 আমার সপ্তাহ পরিকল্পনা'},
 'te': {'fa.t.doctor':'🩺 వైద్యుడు','fa.d.title':'🩺 దుస్తుల వైద్యుడు — బాగుచేయి, కొనకు','fa.d.item':'ఏ దుస్తు?','fa.d.damage':'ఏం బాగుచేయాలి?','fa.d.btn':'🩺 ఎలా బాగుచేయాలో చూపించు',
        'fa.w.title':'💍 వివాహ ప్లానర్ — కుటుంబం మొత్తం సమన్వయం','fa.w.func':'ఏ ఫంక్షన్?','fa.w.role':'మీ పాత్ర?','fa.w.members':'ఎవరు సిద్ధం అవుతారు?','fa.w.btn':'💍 కుటుంబాన్ని ప్లాన్ చేయి',
        'fa.o.title':'📅 ఆఫీస్ వారం ప్లానర్ — 5 రోజులు, పునరావృతం లేదు','fa.o.btn':'📅 నా వారాన్ని ప్లాన్ చేయి'},
 'mr': {'fa.t.doctor':'🩺 डॉक्टर','fa.d.title':'🩺 कपड्यांचा डॉक्टर — दुरुस्ती करा, विकत घेऊ नका','fa.d.item':'कोणता कपडा?','fa.d.damage':'काय दुरुस्त करायचे?','fa.d.btn':'🩺 कसे दुरुस्त करायचे दाखवा',
        'fa.w.title':'💍 लग्न नियोजक — संपूर्ण कुटुंबाचा ताळमेळ','fa.w.func':'कोणता समारंभ?','fa.w.role':'तुमची भूमिका?','fa.w.members':'कोण-कोण तयार होणार?','fa.w.btn':'💍 कुटुंबाचे नियोजन करा',
        'fa.o.title':'📅 ऑफिस आठवडा नियोजक — 5 दिवस, पुनरावृत्ती नाही','fa.o.btn':'📅 माझा आठवडा नियोजित करा'},
 'gu': {'fa.t.doctor':'🩺 ડૉક્ટર','fa.d.title':'🩺 કપડાંના ડૉક્ટર — સમારકામ કરો, ખરીદો નહીં','fa.d.item':'કયું કપડું?','fa.d.damage':'શું ઠીક કરવાનું છે?','fa.d.btn':'🩺 કેવી રીતે ઠીક કરવું બતાવો',
        'fa.w.title':'💍 લગ્ન પ્લાનર — આખા પરિવારનો તાલમેલ','fa.w.func':'કયો પ્રસંગ?','fa.w.role':'તમારી ભૂમિકા?','fa.w.members':'કોણ કોણ તૈયાર થશે?','fa.w.btn':'💍 પરિવારનું પ્લાન બનાવો',
        'fa.o.title':'📅 ઓફિસ સપ્તાહ પ્લાનર — 5 દિવસ, પુનરાવર્તન નહીં','fa.o.btn':'📅 મારું અઠવાડિયું પ્લાન કરો'},
 'kn': {'fa.t.doctor':'🩺 ವೈದ್ಯ','fa.d.title':'🩺 ಬಟ್ಟೆ ವೈದ್ಯ — ಸರಿಪಡಿಸಿ, ಕೊಳ್ಳಬೇಡಿ','fa.d.item':'ಯಾವ ಬಟ್ಟೆ?','fa.d.damage':'ಏನು ಸರಿಪಡಿಸಬೇಕು?','fa.d.btn':'🩺 ಹೇಗೆ ಸರಿಪಡಿಸುವುದು ತೋರಿಸಿ',
        'fa.w.title':'💍 ಮದುವೆ ಯೋಜಕ — ಇಡೀ ಕುಟುಂಬದ ಸಮನ್ವಯ','fa.w.func':'ಯಾವ ಸಮಾರಂಭ?','fa.w.role':'ನಿಮ್ಮ ಪಾತ್ರ?','fa.w.members':'ಯಾರು ಸಿದ್ಧವಾಗುತ್ತಾರೆ?','fa.w.btn':'💍 ಕುಟುಂಬವನ್ನು ಯೋಜಿಸಿ',
        'fa.o.title':'📅 ಕಚೇರಿ ವಾರ ಯೋಜಕ — 5 ದಿನ, ಪುನರಾವರ್ತನೆ ಇಲ್ಲ','fa.o.btn':'📅 ನನ್ನ ವಾರ ಯೋಜಿಸಿ'},
 'ml': {'fa.t.doctor':'🩺 ഡോക്ടർ','fa.d.title':'🩺 വസ്ത്ര ഡോക്ടർ — നന്നാക്കൂ, വാങ്ങരുത്','fa.d.item':'ഏത് വസ്ത്രം?','fa.d.damage':'എന്താണ് ശരിയാക്കേണ്ടത്?','fa.d.btn':'🩺 എങ്ങനെ ശരിയാക്കാം കാണിക്കൂ',
        'fa.w.title':'💍 വിവാഹ പ്ലാനർ — കുടുംബം മുഴുവൻ ഏകോപനം','fa.w.func':'ഏത് ചടങ്ങ്?','fa.w.role':'നിങ്ങളുടെ പങ്ക്?','fa.w.members':'ആരൊക്കെ ഒരുങ്ങുന്നു?','fa.w.btn':'💍 കുടുംബം പ്ലാൻ ചെയ്യൂ',
        'fa.o.title':'📅 ഓഫീസ് വാര പ്ലാനർ — 5 ദിവസം, ആവർത്തനമില്ല','fa.o.btn':'📅 എന്റെ ആഴ്ച പ്ലാൻ ചെയ്യൂ'},
}
SUB = {  # long sub-descriptions: en + hi (others fall back to en via the bundle)
 'en': {'fa.d.sub':'A torn hem or a missing button is not a reason to buy new. Pick the item and the problem — Chitti shows the tools, the steps, the time, and whether you can do it at home or need a tailor.',
        'fa.w.sub':'One family, one coordinated look — from clothes you already own. Chitti finds a shared colour theme, gives each member a role (anchor or accent), and only suggests borrowing, renting or buying for a real gap.',
        'fa.o.sub':'Five office days dressed from your wardrobe with nothing repeating. Chitti spreads your clothes across the week, adapts to each day\'s weather, and tells you honestly if the wardrobe is too small — and the one buy that fixes it.'},
 'hi': {'fa.d.sub':'फटा किनारा या टूटा बटन — नया खरीदने की वजह नहीं। कपड़ा और समस्या चुनिए — Chitti औज़ार, तरीक़ा, समय और यह बताएगी कि घर पर हो जाएगा या दर्ज़ी चाहिए।',
        'fa.w.sub':'एक परिवार, एक तालमेल वाला look — आपके अपने कपड़ों से। Chitti एक साझा रंग-थीम चुनती है, हर सदस्य को भूमिका देती है (मुख्य या साथी), और सिर्फ़ असली कमी पर उधार, किराया या खरीद सुझाती है।',
        'fa.o.sub':'पाँच ऑफ़िस दिन, आपकी अलमारी से — कोई outfit दोहराए बिना। Chitti आपके कपड़े पूरे हफ़्ते में फैलाती है, हर दिन के मौसम के हिसाब से ढालती है, और सच बताती है कि अलमारी छोटी है तो कौन-सी एक खरीद उसे ठीक करेगी।'},
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
    kv = dict(SHORT.get(lang, {}))
    kv.update(SUB.get(lang, {}))
    s, n = inject(s, lang, kv); rep[lang] = n
io.open(SP, 'w', encoding='utf-8').write(s)
print('injected v2.1 keys:', rep)
