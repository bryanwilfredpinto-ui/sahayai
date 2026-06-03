# -*- coding: utf-8 -*-
"""Generate chitti_fashion_i18n.js — a SELF-CONTAINED, guarded fashion i18n bundle.
Extracts all fa.* keys per language from strings.js so the page never depends on a
(possibly stale-cached) shared strings.js. The apply()/guard() functions NEVER write
a raw key — they fall back lang -> en -> original HTML text.
Run: python tools/fa_gen_i18n_bundle.py
"""
import re, io, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = io.open(os.path.join(ROOT, 'strings.js'), encoding='utf-8').read()
langs = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml']
pos = {}
for l in langs:
    m = re.search(r'\n\s*' + re.escape(l) + r':\s*\{', s)
    if m:
        pos[l] = m.start()
order = sorted([(p, l) for l, p in pos.items()])
FA = {}
pair = re.compile(r'"(fa\.[^"]+)":"((?:[^"\\]|\\.)*)"')
for i, (p, l) in enumerate(order):
    end = order[i + 1][0] if i + 1 < len(order) else len(s)
    block = s[p:end]
    d = {}
    for m in pair.finditer(block):
        v = m.group(2).replace('\\"', '"').replace('\\/', '/')
        d[m.group(1)] = v
    FA[l] = d
counts = {l: len(FA.get(l, {})) for l in langs}

js = []
js.append('/* chitti_fashion_i18n.js - SELF-CONTAINED fashion UI translations + guarded apply.')
js.append('   Never writes a raw i18n key: falls back lang -> en -> original HTML text. v20260604 */')
js.append('(function(){')
js.append('"use strict";')
js.append('var FA_I18N = ' + json.dumps(FA, ensure_ascii=False) + ';')
js.append('window.FA_I18N = FA_I18N;')
js.append('function apply(lang){')
js.append('  var d = FA_I18N[lang] || {}, en = FA_I18N.en || {};')
js.append("  var nodes = document.querySelectorAll('[data-vai-i18n]');")
js.append('  for (var i=0;i<nodes.length;i++){')
js.append("    var el = nodes[i], k = el.getAttribute('data-vai-i18n');")
js.append("    if (!el.getAttribute('data-i18n-orig')) el.setAttribute('data-i18n-orig', el.textContent);")
js.append('    var v = d[k] || en[k];')
js.append('    if (v) { el.textContent = v; }')
js.append("    else if ((el.textContent||'').trim() === k) { el.textContent = el.getAttribute('data-i18n-orig'); }")
js.append('  }')
js.append('}')
js.append('window.faI18nApply = apply;')
js.append('function curLang(){ try{ return localStorage.getItem("chitti_vaani_lang")||"hi"; }catch(e){ return "hi"; } }')
js.append('function guard(){')
js.append("  var nodes = document.querySelectorAll('[data-vai-i18n]'); var lang = curLang();")
js.append('  for (var i=0;i<nodes.length;i++){')
js.append("    var el = nodes[i], k = el.getAttribute('data-vai-i18n');")
js.append("    if ((el.textContent||'').trim() === k){")
js.append("      var v = (FA_I18N[lang]||{})[k] || (FA_I18N.en||{})[k] || el.getAttribute('data-i18n-orig') || '';")
js.append('      if (v) el.textContent = v;')
js.append('    }')
js.append('  }')
js.append('}')
js.append('window.faI18nGuard = guard;')
js.append('function boot(){ var l = curLang(); apply(l); setTimeout(function(){ apply(l); guard(); }, 250); setTimeout(guard, 900); }')
js.append("if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();")
js.append("window.addEventListener('chitti:langchange', function(e){ var l=(e&&e.detail&&e.detail.lang)||curLang(); apply(l); setTimeout(guard,120); });")
js.append('})();')
io.open(os.path.join(ROOT, 'chitti_fashion_i18n.js'), 'w', encoding='utf-8').write('\n'.join(js))
print('FA_I18N counts:', counts)
