import { readFileSync, writeFileSync } from 'node:fs';
const P = 'c:/Users/DELL/sahayai/sahayai/chitti_2wheeler.html';
let s = readFileSync(P, 'utf8');
let count = 0;

// The 2W file already uses strFor2W in 4 places I added, but the original speakText('OBD2 scan…',...) buttons
// and other prompts use bare Hindi/English literals. Wrap them all.

const speakReplacements = [
  ['Apni bike ka make, model, reg number aur saal Chitti ko bataiye', 'mb.speak.form'],
  ['OBD2 scan. Error code likhiye, Chitti use plain Hindi mein samjhayegi.', 'mb.speak.obd'],
  // Photo/Sound/FP/FM already use strFor2W in their 🔊 buttons (we added them in stage 1 — these are inside fb-panel/sub-cards)
];
for (const [literal, key] of speakReplacements) {
  const needle = `speakText('${literal}', CURRENT_LANG)`;
  const replacement = `speakText(strFor2W('${key}'), CURRENT_LANG)`;
  if (s.includes(needle)) { s = s.replace(needle, replacement); count++; }
  else console.log('MISS:', literal.slice(0, 50));
}

writeFileSync(P, s);
console.log('2W patched: ' + count + ' speak prompts');
