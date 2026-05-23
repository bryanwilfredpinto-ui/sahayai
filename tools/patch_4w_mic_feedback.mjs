import { readFileSync, writeFileSync } from 'node:fs';
const P = 'c:/Users/DELL/sahayai/sahayai/chitti_4wheeler.html';
let s = readFileSync(P, 'utf8');
let count = 0;

// 1. Wrap each speakText('Photo diagnose…') etc with strFor4W key.
const speakReplacements = [
  ['Photo diagnose. Engine, leak, tyre ya dashboard light ki photo lo. Chitti dekh kar batayegi.', 'ph.speak'],
  ['Sound diagnose. Engine chalu karke 10 second record karo phir Chitti se pucho.', 'sd.speak'],
  ['Fair price guard. Mechanic ne kitne ka quote diya, Chitti se check karo.', 'fp.speak'],
  ['Find mechanic. Pincode bataiye, Chitti aapke area ke trusted mechanics dhundhegi.', 'fm.speak'],
];
for (const [literal, key] of speakReplacements) {
  const needle = `<button onclick="speakText('${literal}', CURRENT_LANG)">🔊</button>`;
  const replacement = `<button onclick="speakText(strFor4W('${key}'), CURRENT_LANG)">🔊 <span data-vai-i18n="ui.suno">Suno</span></button>`;
  if (s.includes(needle)) { s = s.replace(needle, replacement); count++; }
  else console.log('MISSED:', literal.slice(0, 40));
}

// 2. Replace 5 fb-neg→feedback.html nav with sdsToggleFb + add fb-panel
const cards = [
  { key: 'mc_photo', slot: 'mc-photo' },
  { key: 'mc_sound', slot: 'mc-sound' },
  { key: 'mc_fairprice', slot: 'mc-fp' },
  { key: 'mc_mech_find', slot: 'mc-fm' },
  { key: 'mc_logbook', slot: 'mc-logbook' },
];
for (const c of cards) {
  const oldNav = `<button class="fb-neg" onclick="window.location.href='feedback.html?product=chitti_mechanic_car&card=${c.key}'">👎</button>`;
  const newToggle = `<button class="fb-neg" onclick="sdsToggleFb('${c.slot}-fb')">👎</button>`;
  if (!s.includes(oldNav)) { console.log('MISS-nav:', c.key); continue; }
  s = s.replace(oldNav, newToggle);
  count++;
  // Now insert fb-panel right after the </div> that closes the toolbar this button is inside.
  // Find the position immediately after the newToggle insertion, then locate the next </div> followed by </div>
  const idx = s.indexOf(newToggle);
  const closeToolbar = s.indexOf('</div>', idx);
  if (closeToolbar === -1) continue;
  const panel = `
    <div class="sds-fb-panel" id="${c.slot}-fb">
      <textarea id="${c.slot}-fb-text" data-vai-i18n-attr="placeholder|fb.ph" placeholder="Yeh feature kaisa raha?"></textarea>
      <button class="fb-mic-btn" onclick="fbMicListen('${c.slot}-fb-text', this)" data-vai-i18n-attr="aria-label|fb.mic.aria" aria-label="Speak feedback">🎙️ <span data-vai-i18n="fb.mic">बोलो</span></button>
      <div class="actions"><button class="cancel" onclick="sdsToggleFb('${c.slot}-fb')" data-vai-i18n="ui.cancel">रद्द</button><button onclick="sendFb('${c.key}','${c.slot}-fb-text','${c.slot}-fb')" data-vai-i18n="ui.send">भेजो</button></div>
    </div>`;
  // Insert AFTER closing div of toolbar (length 6 for "</div>")
  s = s.slice(0, closeToolbar + 6) + panel + s.slice(closeToolbar + 6);
  count++;
}

writeFileSync(P, s);
console.log('4W patched: ' + count + ' edits');
