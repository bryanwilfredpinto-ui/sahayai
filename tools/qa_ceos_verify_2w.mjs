#!/usr/bin/env node
/** QA — CEOS/BO/Skill/SOP/Role/Gate verification of Chitti Mechanic 2W against the LIVE URL.
 * Engine-level claims tested via evaluate() (reliable despite live latency); presence via DOM. */
import { chromium } from 'playwright';
const URL = 'https://sahayai.in/chitti_mechanic_2w.html?dp_skip=1';
const b = await chromium.launch();
const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(2500);
const R = (k, v) => console.log(k + '::' + (typeof v === 'object' ? JSON.stringify(v) : v));
const E = async fn => page.evaluate(fn);

// ROLE
R('ROLE_no_bad_guarantee', await E(() => !/we guarantee|guaranteed saving|guaranteed return|guaranteed price/.test(document.body.innerText.toLowerCase())));
R('ROLE_savings_not_guarantee', await E(() => JSON.stringify(window.ChittiMech2W.savings([{ category: 'x', amount: 1 }]).risks).toLowerCase().includes('not a guarantee')));
R('ROLE_safety_first_brakes', await E(() => window.ChittiMech2W.coach('brake_soft').tier === 'mechanic'));
R('ROLE_confidence_shown', await E(() => !!window.ChittiMech2W.insuranceCompare({ idv: 60000 }).confidence));
R('ROLE_emergency_never_autodial', await E(() => /never auto-dial/i.test(window.ChittiMech2W.emergency().note + window.ChittiMech2W.emergency().summary)));
R('ROLE_disclaimer_not_substitute', await E(() => document.querySelector('.disc').innerText.toLowerCase().includes('not a substitute')));

// SKILLS 1-12
R('SK1_vault', await E(() => ['load', 'save', 'set', 'forget'].every(k => typeof window.ChittiMech2W.vault[k] === 'function')));
R('SK2_reminders', await E(() => window.ChittiMech2W.reminders({ pucExpiry: '2026-06-25' }, '2026-06-15').items.length > 0));
R('SK3_insurance_8plus', await E(() => window.ChittiMech2W.insuranceCompare({ idv: 60000 }).options.length >= 8));
R('SK4_puc_nearest_maps', await E(() => /google\.com\/maps/.test(window.ChittiMech2W.nearestQuery('puc').url)));
R('SK4_puc_distance_shown', await E(() => /\d+\s?(km|m)\b/i.test(window.ChittiMech2W.nearestQuery('puc').summary + (window.ChittiMech2W.pucStatus({}).nearest || ''))));
R('SK5_service_km_AND_months', await E(() => { const r = window.ChittiMech2W.reminders({ odoKm: 13000, lastServiceKm: 9000, lastServiceDate: '2025-11-01' }, '2026-06-15'); const s = r.items.find(i => i.kind === 'Service'); return !!s && /km/.test(s.msg) && /month/.test(s.msg); }));
R('SK6_tyre_3_options', await E(() => { const u = ['allround', 'mileage', 'durability', 'ev', 'performance', 'value']; return u.map(x => window.ChittiMech2W.tyreRecommend(x).options.length); }));
R('SK7_battery_age_life', await E(() => { const r = window.ChittiMech2W.batteryStatus({ vclass: 'scooter', batteryMonths: 20 }); return r.ageMonths != null && r.expectedLifeMonths != null; }));
R('SK8_obd_plain_and_refuse', await E(() => window.ChittiMech2W.obdLookup('P0300').found === true && window.ChittiMech2W.obdLookup('Z9').found === false));
R('SK9_scam_30pct', await E(() => window.ChittiMech2W.scamCheck({ item: 'brake shoes', quote: 3000, expectedLo: 800, expectedHi: 1500 }).scamAlert === true));
R('SK10_buyscore', await E(() => typeof window.ChittiMech2W.inspect({ expectedMarket: 42000 }).score === 'number'));
R('SK11_savings_10k', await E(() => window.ChittiMech2W.savings([]).goal === 10000));
R('SK12_langs_26_dropdown', await E(() => document.querySelectorAll('#lang-select option').length));

// SOP-specific gaps
R('SOP1_doc_upload_present', await E(() => !!document.querySelector('#bk-doc[type=file]')));
R('SOP1_ocr_extract', await E(() => /ocr|extract/i.test((window.ChittiMech2W.RULES ? '' : '') + '') ? true : false)); // engine has no OCR
R('SOP2_reminder_escalation_push_sms_voice', await E(() => { try { return typeof window.ChittiMech2W.reminders === 'function' && /sms|whatsapp|push/i.test(JSON.stringify(window.ChittiMech2W.reminders({ pucExpiry: '2026-06-20' }, '2026-06-15'))); } catch (e) { return false; } }));
R('SOP5_tyre_asks_budget', await E(() => !!document.querySelector('#ty-budget, [id*=budget]')));
R('SOP7_triage_colours', await E(() => { const t = window.ChittiMech2W.RULES.triage; return !!(t.safe.sym && t.caution.sym && t.mechanic.sym); }));
R('SOP8_crisis_keyword', await E(() => { const has108 = /108|112/.test(window.ChittiMech2W.emergency().summary); const freeText = !!document.querySelector('input[placeholder*="accident" i], textarea'); return { has108, crisisFreeText: freeText }; }));
R('SOP11_forget', await E(() => typeof window.ChittiMech2W.vault.forget === 'function'));
R('SOP12_uncertain', await E(() => /not in|describe|not.*sure|starting point/i.test(window.ChittiMech2W.obdLookup('Z9').summary + ' ' + window.ChittiMech2W.coach('low_mileage').risks.join(' '))));

// Language coverage (BO10 / Skill12 "26 languages working")
async function langcov(c) { await page.selectOption('#lang-select', c); await page.waitForTimeout(1500); return page.evaluate(() => { let t = 0, ch = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null); let n; while ((n = w.nextNode())) { if (n._chittiOrig !== undefined) { t++; if (n._chittiOrig !== n.nodeValue) ch++; } } return Math.round(ch / t * 100); }); }
R('LANG_hi_pct', await langcov('hi')); R('LANG_kn_pct', await langcov('kn')); R('LANG_ta_pct', await langcov('ta'));
await page.selectOption('#lang-select', 'en').catch(() => {});

// CEOS structure presence on live
R('CEOS_vision_visible', await E(() => /mechanic/i.test(document.querySelector('.hero h2').innerText)));
R('CEOS_personas_disability', await E(() => !!(window.Chitti && window.Chitti.a11y)));
R('CEOS_feature_tabs', await E(() => document.querySelectorAll('.tab').length));
R('CEOS_widget_boxes', await E(() => { let ok = 0; document.querySelectorAll('[data-chitti-response]').forEach(x => { const bar = x.nextElementSibling; if (bar && bar.classList.contains('chitti-fb-box-bar')) ok++; }); return ok; }));
await b.close();
