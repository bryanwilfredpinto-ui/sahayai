#!/usr/bin/env node
/* tools/test_cnai_i18n_bo6.mjs — BO6: 11-language UI_STRINGS completeness,
 * technical-term preservation, applyLanguage/autoDetect, accessibility srLang.
 * Deterministic, no DOM. Run: node tools/test_cnai_i18n_bo6.mjs */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const I18N = require(resolve(ROOT, 'cnai_i18n.js'));
const A11Y = require(resolve(ROOT, 'cnai_accessibility.js'));
let pass = 0, fail = 0; const fails = [];
const ok = (n, c, d) => { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } };

console.log('\n=== BO6 — 11-LANGUAGE i18n + ACCESSIBILITY ===\n');

const LANGS = ['en', 'hi', 'te', 'kn', 'ta', 'bn', 'mr', 'gu', 'ml', 'pa', 'or'];

// 1. All 11 languages present.
ok('langs:11-present', I18N.listLangs().length === 11 && LANGS.every(l => I18N.listLangs().includes(l)), I18N.listLangs().join(','));

// 2. COMPLETENESS — every language has every key (no missing string).
const miss = I18N.missingKeys();
ok('keys:no-missing', Object.keys(miss).length === 0, Object.keys(miss).length ? JSON.stringify(miss) : I18N.KEYS.length + ' keys × 11 langs complete');
for (const l of LANGS) ok('keys:complete:' + l, !(l in miss), (I18N.UI_STRINGS[l] ? Object.keys(I18N.UI_STRINGS[l]).length : 0) + ' keys');

// 3. Non-English actually differs from English (real translation, not copy).
for (const l of LANGS.filter(x => x !== 'en')) {
  ok('translated:' + l, I18N.t('news_refresh', l) !== I18N.t('news_refresh', 'en') && I18N.t('coach_cta', l) !== I18N.t('coach_cta', 'en'));
}

// 4. Technical terms preserved in English across all languages.
for (const l of LANGS) {
  ok('tech:AI-kept:' + l, /AI/.test(I18N.t('nav_news', l)), I18N.t('nav_news', l));
  ok('tech:AgenticAI-kept:' + l, /Agentic AI/.test(I18N.t('roadmap_placeholder', l)), I18N.t('roadmap_placeholder', l));
}

// 5. applyLanguage works headless (no DOM) and persists; unknown → en.
ok('apply:returns-lang', I18N.applyLanguage('ta') === 'ta');
ok('apply:unknown→en', I18N.applyLanguage('zz') === 'en');
ok('apply:no-throw-headless', (() => { try { I18N.applyLanguage('kn'); return true; } catch (e) { return false; } })());

// 6. autoDetect returns a supported language (or en/hi fallback).
ok('autodetect:supported', I18N.listLangs().includes(I18N.autoDetect()), I18N.autoDetect());

// 7. t() fallback to English for an unknown key.
ok('t:fallback-key', I18N.t('nonexistent_key', 'hi') === 'nonexistent_key');

// 8. Accessibility: srLang maps all 11 langs to a BCP-47 voice code.
ok('a11y:srlang-11', LANGS.every(l => /^[a-z]{2}-IN$/.test(A11Y.srLang(l))), LANGS.map(l => A11Y.srLang(l)).join(','));
ok('a11y:srlang-fallback', A11Y.srLang('zz') === 'en-IN');
ok('a11y:functions', typeof A11Y.setSeniorMode === 'function' && typeof A11Y.announce === 'function' && typeof A11Y.ensureSkipLink === 'function' && typeof A11Y.auditTouchTargets === 'function');
ok('a11y:headless-safe', (() => { try { A11Y.announce('x'); A11Y.setSeniorMode(true); A11Y.ensureSkipLink(); A11Y.speak('hi', 'hi'); return A11Y.auditTouchTargets().length === 0; } catch (e) { return false; } })());

console.log('\n----------------------------------------');
console.log('BO6 i18n + a11y: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
