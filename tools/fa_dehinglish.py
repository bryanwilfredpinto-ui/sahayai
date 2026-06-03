# -*- coding: utf-8 -*-
"""De-Hinglish: replace clearly-translatable English words inside Indic fa.* string
values with native script. Keeps documented technical/brand terms (Chitti, Vaani,
AI, LLM, DPDP, UPI, Simulator, Digital Twin) per CTO §6. Then prints residual Latin
words for transparency. Run: python tools/fa_dehinglish.py
"""
import re, io, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SP = os.path.join(ROOT, 'strings.js')
s = io.open(SP, encoding='utf-8').read()
langs = ['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml']

# translatable English -> native (word-boundary, case-insensitive on the English token)
REPL = {
 'hi': {'Outfit':'पहनावा','outfit':'पहनावा','outfits':'पहनावे','Photos':'तस्वीरें','photos':'तस्वीरें','photo':'तस्वीर','expert':'विशेषज्ञ','experts':'विशेषज्ञ','accessory':'सहायक वस्तु','accessories':'सहायक वस्तुएँ','office':'दफ़्तर','interview':'इंटरव्यू','college':'कॉलेज','premium':'प्रीमियम','Profession':'पेशा','Culture':'संस्कृति','Climate':'मौसम','Budget':'बजट'},
 'bn': {'Outfit':'পোশাক','outfit':'পোশাক','outfits':'পোশাক','Photos':'ছবি','photos':'ছবি','photo':'ছবি','expert':'বিশেষজ্ঞ','experts':'বিশেষজ্ঞ','accessory':'অনুষঙ্গ','accessories':'অনুষঙ্গ','office':'অফিস','interview':'সাক্ষাৎকার','college':'কলেজ','premium':'প্রিমিয়াম'},
 'ta': {'Outfit':'உடை','outfit':'உடை','outfits':'உடைகள்','Photos':'படங்கள்','photos':'படங்கள்','photo':'படம்','expert':'நிபுணர்','experts':'நிபுணர்கள்','accessory':'துணைப்பொருள்','accessories':'துணைப்பொருட்கள்','office':'அலுவலகம்','interview':'நேர்காணல்','college':'கல்லூரி','premium':'பிரீமியம்'},
 'te': {'Outfit':'దుస్తులు','outfit':'దుస్తులు','outfits':'దుస్తులు','Photos':'ఫోటోలు','photos':'ఫోటోలు','photo':'ఫోటో','expert':'నిపుణుడు','experts':'నిపుణులు','accessory':'అనుబంధం','accessories':'అనుబంధాలు','office':'కార్యాలయం','interview':'ఇంటర్వ్యూ','college':'కళాశాల','premium':'ప్రీమియం'},
 'mr': {'Outfit':'पोशाक','outfit':'पोशाक','outfits':'पोशाक','Photos':'फोटो','photos':'फोटो','photo':'फोटो','expert':'तज्ज्ञ','experts':'तज्ज्ञ','accessory':'सहायक वस्तू','accessories':'सहायक वस्तू','office':'कार्यालय','interview':'मुलाखत','college':'महाविद्यालय','premium':'प्रीमियम'},
 'gu': {'Outfit':'પોશાક','outfit':'પોશાક','outfits':'પોશાક','Photos':'ફોટા','photos':'ફોટા','photo':'ફોટો','expert':'નિષ્ણાત','experts':'નિષ્ણાતો','accessory':'સહાયક વસ્તુ','accessories':'સહાયક વસ્તુઓ','office':'ઓફિસ','interview':'ઇન્ટરવ્યૂ','college':'કૉલેજ','premium':'પ્રીમિયમ'},
 'kn': {'Outfit':'ಉಡುಗೆ','outfit':'ಉಡುಗೆ','outfits':'ಉಡುಗೆಗಳು','Photos':'ಫೋಟೋಗಳು','photos':'ಫೋಟೋಗಳು','photo':'ಫೋಟೋ','expert':'ತಜ್ಞ','experts':'ತಜ್ಞರು','accessory':'ಸಹಾಯಕ ವಸ್ತು','accessories':'ಸಹಾಯಕ ವಸ್ತುಗಳು','office':'ಕಚೇರಿ','interview':'ಸಂದರ್ಶನ','college':'ಕಾಲೇಜು','premium':'ಪ್ರೀಮಿಯಂ'},
 'ml': {'Outfit':'വസ്ത്രം','outfit':'വസ്ത്രം','outfits':'വസ്ത്രങ്ങൾ','Photos':'ഫോട്ടോകൾ','photos':'ഫോട്ടോകൾ','photo':'ഫോട്ടോ','expert':'വിദഗ്ധൻ','experts':'വിദഗ്ധർ','accessory':'അനുബന്ധം','accessories':'അനുബന്ധങ്ങൾ','office':'ഓഫീസ്','interview':'ഇന്റർവ്യൂ','college':'കോളേജ്','premium':'പ്രീമിയം'},
}
ALLOW = set(['Chitti','Vaani','AI','LLM','DPDP','UPI','Simulator','Digital','Twin','Fashion'])  # technical/brand per CTO §6

pos = {l: re.search(r'\n\s*' + re.escape(l) + r':\s*\{', s).start() for l in langs if re.search(r'\n\s*' + re.escape(l) + r':\s*\{', s)}
order = sorted([(p, l) for l, p in pos.items()])
out = []
prev_end = 0
new = s
# Process blocks from last to first to keep indices stable
blocks = []
for i, (p, l) in enumerate(order):
    end = order[i + 1][0] if i + 1 < len(order) else len(s)
    blocks.append((l, p, end))

valpat = re.compile(r'("fa\.[^"]+":")((?:[^"\\]|\\.)*)(")')
for l, p, end in reversed(blocks):
    block = new[p:end]
    repl = REPL.get(l, {})
    def fix(m):
        head, val, tail = m.group(1), m.group(2), m.group(3)
        for en, nat in sorted(repl.items(), key=lambda kv: -len(kv[0])):
            val = re.sub(r'(?<![A-Za-z])' + re.escape(en) + r'(?![A-Za-z])', nat, val)
        return head + val + tail
    block2 = valpat.sub(fix, block)
    new = new[:p] + block2 + new[end:]

io.open(SP, 'w', encoding='utf-8').write(new)

# residual report
s2 = io.open(SP, encoding='utf-8').read()
pos = {l: re.search(r'\n\s*' + re.escape(l) + r':\s*\{', s2).start() for l in langs}
order = sorted([(p, l) for l, p in pos.items()])
from collections import Counter
cnt = Counter()
for i, (p, l) in enumerate(order):
    end = order[i + 1][0] if i + 1 < len(order) else len(s2)
    for m in valpat.finditer(s2[p:end]):
        for w in re.findall(r'[A-Za-z][A-Za-z\-]+', m.group(2)):
            if w not in ALLOW:
                cnt[w] += 1
io.open(os.path.join(ROOT, 'tools', '_fa_residual_latin.txt'), 'w', encoding='utf-8').write('\n'.join(f'{w}\t{c}' for w, c in cnt.most_common()))
print('de-Hinglish done. Residual non-allowlisted Latin words in Indic strings:', dict(cnt.most_common(20)))
