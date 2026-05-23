import { readFileSync, writeFileSync } from 'node:fs';

function patch2W() {
  const P = 'c:/Users/DELL/sahayai/sahayai/chitti_2wheeler.html';
  let s = readFileSync(P, 'utf8');
  let c = 0;

  // Header pieces
  const r1 = '<span class="mb-soon-flag">🔜 Launching Soon</span>';
  if (s.includes(r1)) { s = s.replace(r1, '<span class="mb-soon-flag" data-vai-i18n="ls.flag">🔜 Launching Soon</span>'); c++; }
  const r2 = '<span class="mb-soon-tag">Chitti Special</span>';
  if (s.includes(r2)) { s = s.replace(r2, '<span class="mb-soon-tag" data-vai-i18n="ls.tag">Chitti Special</span>'); c++; }
  const r3 = '<span class="mb-soon-phase">Phase 2</span>';
  if (s.includes(r3)) { s = s.replace(r3, '<span class="mb-soon-phase" data-vai-i18n="ls.phase2">Phase 2</span>'); c++; }

  // 4 items
  const items = [
    { titleOld: '<div class="mb-soon-title">🔧 OBD2 for Bikes ',
      titleNew: '<div class="mb-soon-title" data-vai-i18n="ls.obd2_bike.title">🔧 OBD2 for Bikes</div><div style="display:inline-block">' ,
      subOld: '<div class="mb-soon-sub">Bluetooth device se seedha engine error code padhega Chitti. Aap se sirf "haan" kaha to mechanic ke paas le jaane se pehle hi diagnosis ho jayega.</div>',
      subNew: '<div class="mb-soon-sub" data-vai-i18n="ls.obd2_bike.sub">Bluetooth device se seedha engine error code padhega Chitti. Aap se sirf "haan" kaha to mechanic ke paas le jaane se pehle hi diagnosis ho jayega.</div>' },
    { titleOld: '<div class="mb-soon-title">📐 Chain Tension Meter</div>',
      titleNew: '<div class="mb-soon-title" data-vai-i18n="ls.chain_meter.title">📐 Chain Tension Meter</div>',
      subOld: '<div class="mb-soon-sub">Camera se chain ka tension check — koi guess work nahi. Slack zyada ya kam — Chitti exact bata degi.</div>',
      subNew: '<div class="mb-soon-sub" data-vai-i18n="ls.chain_meter.sub">Camera se chain ka tension check — koi guess work nahi. Slack zyada ya kam — Chitti exact bata degi.</div>' },
    { titleOld: '<div class="mb-soon-title">🛞 Tyre Pressure AI</div>',
      titleNew: '<div class="mb-soon-title" data-vai-i18n="ls.tyre_ai.title">🛞 Tyre Pressure AI</div>',
      subOld: '<div class="mb-soon-sub">Tyre ki photo se wear pattern detect karega Chitti. Front-back balance, alignment, pressure — sab ek photo se.</div>',
      subNew: '<div class="mb-soon-sub" data-vai-i18n="ls.tyre_ai.sub">Tyre ki photo se wear pattern detect karega Chitti. Front-back balance, alignment, pressure — sab ek photo se.</div>' },
    { titleOld: '<div class="mb-soon-title">🤝 Community Mechanic Reviews</div>',
      titleNew: '<div class="mb-soon-title" data-vai-i18n="ls.mech_reviews.title">🤝 Community Mechanic Reviews</div>',
      subOld: '<div class="mb-soon-sub">Aapke area ke trusted mechanics — 100+ riders ne unka kaam confirm kiya hai. Dhokha mat khao.</div>',
      subNew: '<div class="mb-soon-sub" data-vai-i18n="ls.mech_reviews.sub">Aapke area ke trusted mechanics — 100+ riders ne unka kaam confirm kiya hai. Dhokha mat khao.</div>' },
  ];
  for (const it of items) {
    if (s.includes(it.titleOld)) { s = s.replace(it.titleOld, it.titleNew); c++; } else console.log('2W miss title:', it.titleOld.slice(0,60));
    if (s.includes(it.subOld)) { s = s.replace(it.subOld, it.subNew); c++; } else console.log('2W miss sub:', it.subOld.slice(0,60));
  }
  writeFileSync(P, s);
  return c;
}

function patch4W() {
  const P = 'c:/Users/DELL/sahayai/sahayai/chitti_4wheeler.html';
  let s = readFileSync(P, 'utf8');
  let c = 0;

  const r1 = '<span class="mc-soon-flag">🔜 Launching Soon</span>';
  if (s.includes(r1)) { s = s.replace(r1, '<span class="mc-soon-flag" data-vai-i18n="ls.flag">🔜 Launching Soon</span>'); c++; }
  const r2 = '<span class="mc-soon-tag">Chitti Special</span>';
  if (s.includes(r2)) { s = s.replace(r2, '<span class="mc-soon-tag" data-vai-i18n="ls.tag">Chitti Special</span>'); c++; }

  // 4W LS items
  const items4 = [
    ['<div class="mc-soon-title">🔌 Bluetooth OBD2 Live</div>', '<div class="mc-soon-title" data-vai-i18n="ls.obd2_live.title">🔌 Bluetooth OBD2 Live</div>'],
    ['<div class="mc-soon-title">💰 Fair Price Guard</div>', '<div class="mc-soon-title" data-vai-i18n="ls.fair_price.title">💰 Fair Price Guard</div>'],
    ['<div class="mc-soon-title">✅ Confirmed Fix Database</div>', '<div class="mc-soon-title" data-vai-i18n="ls.confirmed_fix.title">✅ Confirmed Fix Database</div>'],
    ['<div class="mc-soon-title">🚗 Drive Score</div>', '<div class="mc-soon-title" data-vai-i18n="ls.drive_score.title">🚗 Drive Score</div>'],
  ];
  for (const [from, to] of items4) {
    if (s.includes(from)) { s = s.replace(from, to); c++; } else console.log('4W miss title:', from.slice(0,60));
  }

  // Subs — find them by mc-soon-sub class lines
  const subs4 = [
    { test: 'Bluetooth dongle (ELM327)', key:'ls.obd2_live.sub' },
    { test: 'Mechanic ne quote diya', key:'ls.fair_price.sub' },
    { test: 'iss code se 1247', key:'ls.confirmed_fix.sub' },
    { test: 'AI sun ke', key:'ls.drive_score.sub' },
  ];
  for (const item of subs4) {
    const re = new RegExp('<div class="mc-soon-sub">([^<]*' + item.test.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^<]*)</div>');
    const m = s.match(re);
    if (m) {
      s = s.replace(m[0], '<div class="mc-soon-sub" data-vai-i18n="' + item.key + '">' + m[1] + '</div>');
      c++;
    } else console.log('4W miss sub key:', item.key);
  }

  writeFileSync(P, s);
  return c;
}

console.log('2W:', patch2W());
console.log('4W:', patch4W());
