# -*- coding: utf-8 -*-
"""Inject the 'More' tab static UI labels (Wardrobe Audit / Travel Packing /
Emergency) into strings.js for the 9 primary languages. Short labels native in
all 9; long sub-descriptions en/hi (EN fallback for the 7, consistent policy).
Run: python tools/fa_more_i18n.py
"""
import re, json, io, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SP = os.path.join(ROOT, 'strings.js')

SHORT = {
 'en': {'fa.t.more':'✨ More','fa.m.audit':'Wardrobe Audit','fa.m.audit_btn':'🔍 Audit my wardrobe','fa.m.pack':'Travel Packing','fa.m.pack_btn':'🧳 Build packing list','fa.m.emrg':'Quick outfit','fa.m.emrg_btn':'⚡ Give me one now'},
 'hi': {'fa.t.more':'✨ और','fa.m.audit':'अलमारी की जाँच','fa.m.audit_btn':'🔍 मेरी अलमारी जाँचो','fa.m.pack':'यात्रा पैकिंग','fa.m.pack_btn':'🧳 पैकिंग सूची बनाओ','fa.m.emrg':'तुरंत पहनावा','fa.m.emrg_btn':'⚡ अभी एक outfit दो'},
 'ta': {'fa.t.more':'✨ மேலும்','fa.m.audit':'அலமாரி சோதனை','fa.m.audit_btn':'🔍 என் அலமாரியைச் சோதி','fa.m.pack':'பயணப் பேக்கிங்','fa.m.pack_btn':'🧳 பேக்கிங் பட்டியல்','fa.m.emrg':'விரைவு உடை','fa.m.emrg_btn':'⚡ இப்போது ஒன்று தா'},
 'bn': {'fa.t.more':'✨ আরও','fa.m.audit':'আলমারি যাচাই','fa.m.audit_btn':'🔍 আমার আলমারি যাচাই','fa.m.pack':'ভ্রমণ প্যাকিং','fa.m.pack_btn':'🧳 প্যাকিং তালিকা','fa.m.emrg':'দ্রুত পোশাক','fa.m.emrg_btn':'⚡ এখনই একটি দাও'},
 'te': {'fa.t.more':'✨ మరిన్ని','fa.m.audit':'అలమారా తనిఖీ','fa.m.audit_btn':'🔍 నా అలమారాను తనిఖీ చేయి','fa.m.pack':'ప్రయాణ ప్యాకింగ్','fa.m.pack_btn':'🧳 ప్యాకింగ్ జాబితా','fa.m.emrg':'త్వరిత దుస్తులు','fa.m.emrg_btn':'⚡ ఇప్పుడు ఒకటి ఇవ్వు'},
 'mr': {'fa.t.more':'✨ अधिक','fa.m.audit':'अलमारी तपासणी','fa.m.audit_btn':'🔍 माझी अलमारी तपासा','fa.m.pack':'प्रवास पॅकिंग','fa.m.pack_btn':'🧳 पॅकिंग यादी','fa.m.emrg':'झटपट पोशाक','fa.m.emrg_btn':'⚡ आता एक द्या'},
 'gu': {'fa.t.more':'✨ વધુ','fa.m.audit':'અલમારી તપાસ','fa.m.audit_btn':'🔍 મારી અલમારી તપાસો','fa.m.pack':'મુસાફરી પૅકિંગ','fa.m.pack_btn':'🧳 પૅકિંગ યાદી','fa.m.emrg':'ઝડપી પોશાક','fa.m.emrg_btn':'⚡ હમણાં એક આપો'},
 'kn': {'fa.t.more':'✨ ಇನ್ನಷ್ಟು','fa.m.audit':'ಅಲಮಾರಿ ಪರಿಶೀಲನೆ','fa.m.audit_btn':'🔍 ನನ್ನ ಅಲಮಾರಿ ಪರಿಶೀಲಿಸಿ','fa.m.pack':'ಪ್ರಯಾಣ ಪ್ಯಾಕಿಂಗ್','fa.m.pack_btn':'🧳 ಪ್ಯಾಕಿಂಗ್ ಪಟ್ಟಿ','fa.m.emrg':'ತ್ವರಿತ ಉಡುಗೆ','fa.m.emrg_btn':'⚡ ಈಗ ಒಂದು ಕೊಡು'},
 'ml': {'fa.t.more':'✨ കൂടുതൽ','fa.m.audit':'അലമാര പരിശോധന','fa.m.audit_btn':'🔍 എന്റെ അലമാര പരിശോധിക്കൂ','fa.m.pack':'യാത്രാ പാക്കിംഗ്','fa.m.pack_btn':'🧳 പാക്കിംഗ് പട്ടിക','fa.m.emrg':'പെട്ടെന്നുള്ള വസ്ത്രം','fa.m.emrg_btn':'⚡ ഇപ്പോൾ ഒന്ന് തരൂ'},
}
SUB = {  # long sub-descriptions: en + hi (others fall back to en via strFor)
 'en': {'fa.m.audit_sub':'Chitti audits your wardrobe — what is missing, what pairs, which clothes you have not worn in months.','fa.m.pack_sub':'How many days? Chitti builds a mix-and-match packing list from your wardrobe — fewer clothes, more outfits.','fa.m.emrg_sub':'Five minutes to leave? Chitti instantly picks one ready outfit from your wardrobe.'},
 'hi': {'fa.m.audit_sub':'Chitti आपकी अलमारी जाँचती है — किस चीज़ की कमी है, क्या जोड़ी बनती है, कौन-से कपड़े महीनों से नहीं पहने।','fa.m.pack_sub':'कितने दिन की यात्रा? Chitti आपकी अलमारी से mix-and-match पैकिंग सूची बनाएगी — कम कपड़े, ज़्यादा पहनावे।','fa.m.emrg_sub':'5 मिनट में निकलना है? Chitti आपकी अलमारी से एक तैयार पहनावा तुरंत चुनेगी।'},
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
print('injected more-tab keys:', rep)
