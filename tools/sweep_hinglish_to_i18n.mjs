/**
 * Replace every literal Hinglish/Hindi/English speakText() call + bubble HTML
 * literal + alert() literal with a strFor() i18n lookup. Sire 2026-05-23:
 * "If one word is in wrong language — they are lost."
 *
 * Each replacement records the i18n key + the English baseline so the
 * companion inject script can populate all 9 languages.
 */
import { readFileSync, writeFileSync } from 'node:fs';

// ── Replacement map for 2W ──
const MAP_2W = [
  // speakText literals
  [`speakText('कम से कम बनाने वाली कंपनी, मॉडल और reg number डालिए।', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.min_fields'), CURRENT_LANG)`, 'mb.speak.min_fields'],
  [`speakText('बाइक सेव हो गई। ' + b.make + ' ' + b.model + ', ' + b.reg, CURRENT_LANG)`, `speakText(strFor2W('mb.speak.saved') + ' ' + b.make + ' ' + b.model + ', ' + b.reg, CURRENT_LANG)`, 'mb.speak.saved'],
  [`speakText('Demo bharo: Hero Splendor UP32 AB 1234, 2018, laal.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.demo'), CURRENT_LANG)`, 'mb.speak.demo'],
  [`speakText('इस browser में voice support नहीं है। टाइप करके भेजें।', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.no_voice'), CURRENT_LANG)`, 'mb.speak.no_voice'],
  [`speakText('Voice शुरू नहीं हो पायी। टाइप करके भेजें।', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.voice_failed'), CURRENT_LANG)`, 'mb.speak.voice_failed'],
  [`speakText('Chitti को बताइए क्या तकलीफ़ है।', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.tell_problem'), CURRENT_LANG)`, 'mb.speak.tell_problem'],
  [`speakText('Feedback bhej diya, dhanyavaad.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.fb_sent'), CURRENT_LANG)`, 'mb.speak.fb_sent'],
  [`speakText('Pehle error code likhiye.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.obd_need_code'), CURRENT_LANG)`, 'mb.speak.obd_need_code'],
  [`speakText('Nayi bike slot. Form bhar ke save karein.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.new_slot'), CURRENT_LANG)`, 'mb.speak.new_slot'],
  [`speakText('Kya kaam hua yeh likhiye.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.log_what'), CURRENT_LANG)`, 'mb.speak.log_what'],
  [`speakText('Service entry save ho gayi. Total ' + list.length + ' entries.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.log_saved') + ' ' + list.length, CURRENT_LANG)`, 'mb.speak.log_saved'],
  [`speakText('Abhi koi service entry nahi.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.log_empty'), CURRENT_LANG)`, 'mb.speak.log_empty'],
  [`speakText('Total ' + list.length + ' service entries. Kul ' + total + ' rupiye kharch.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.log_total') + ' ' + list.length + '. ' + total + ' ' + strFor2W('mb.speak.rupiye_kharch'), CURRENT_LANG)`, 'mb.speak.log_total'],
  [`speakText('Demo entry add ho gayi.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.demo_added'), CURRENT_LANG)`, 'mb.speak.demo_added'],
  [`speakText('Emergency. Chitti family ko call kar rahi hai. 112 ko NAHI.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.sos'), CURRENT_LANG)`, 'mb.speak.sos'],
  [`speakText('Pre-trip check shuru. Har item tick karein.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.trip_start'), CURRENT_LANG)`, 'mb.speak.trip_start'],
  [`speakText('Sab tick. Bike ready hai. Safe ride.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.trip_done'), CURRENT_LANG)`, 'mb.speak.trip_done'],
  [`speakText('Awaaz ka description likhiye.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.sound_need_desc'), CURRENT_LANG)`, 'mb.speak.sound_need_desc'],
  [`speakText('Kya kaam aur kitne ka quote bataiye.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.fp_need_input'), CURRENT_LANG)`, 'mb.speak.fp_need_input'],
  [`speakText('Pehle apni bike save karein. Chitti research nahi kar sakti.', CURRENT_LANG)`, `speakText(strFor2W('mb.speak.kyv_need_save'), CURRENT_LANG)`, 'mb.speak.kyv_need_save'],

  // Bubble HTML literals — extract inner text
  [`'<div class="sds-bubble chitti"><span class="who">Chitti soch rahi hai…</span></div>'`, `'<div class="sds-bubble chitti"><span class="who">' + strFor2W('mb.bubble.thinking') + '</span></div>'`, 'mb.bubble.thinking'],
  [`'<div class="sds-bubble warn">Chitti se code abhi nahi mila — phir try karein.</div>'`, `'<div class="sds-bubble warn">' + strFor2W('mb.bubble.code_fail') + '</div>'`, 'mb.bubble.code_fail'],
  [`'<div class="sds-bubble warn">Chitti photo se nahi samajh paayi. Description likh kar Chitti se Ask karein.</div>'`, `'<div class="sds-bubble warn">' + strFor2W('mb.bubble.photo_fail') + '</div>'`, 'mb.bubble.photo_fail'],
  [`'<div class="sds-bubble chitti"><span class="who">Chitti sun rahi hai…</span></div>'`, `'<div class="sds-bubble chitti"><span class="who">' + strFor2W('mb.bubble.listening') + '</span></div>'`, 'mb.bubble.listening'],
  [`'<div class="sds-bubble warn">Chitti samajh nahi paayi. Phir try karein.</div>'`, `'<div class="sds-bubble warn">' + strFor2W('mb.bubble.sound_fail') + '</div>'`, 'mb.bubble.sound_fail'],
  [`'<div class="sds-bubble warn">Chitti samajh nahi paayi.</div>'`, `'<div class="sds-bubble warn">' + strFor2W('mb.bubble.fp_fail') + '</div>'`, 'mb.bubble.fp_fail'],
  [`'<div class="sds-bubble warn">Network error.</div>'`, `'<div class="sds-bubble warn">' + strFor2W('err.network_short') + '</div>'`, 'err.network_short'],
  [`'<div class="sds-bubble warn">Network error. Phir try karein.</div>'`, `'<div class="sds-bubble warn">' + strFor2W('err.network_retry') + '</div>'`, 'err.network_retry'],
  [`'<div class="sds-bubble chitti">Chitti dekh rahi hai…</div>'`, `'<div class="sds-bubble chitti">' + strFor2W('mb.bubble.seeing') + '</div>'`, 'mb.bubble.seeing'],
  [`'<div class="sds-bubble chitti">Chitti pre-trip check kar rahi hai…</div>'`, `'<div class="sds-bubble chitti">' + strFor2W('mb.bubble.pretrip') + '</div>'`, 'mb.bubble.pretrip'],
  [`'<div class="sds-bubble chitti">Chitti dhund rahi hai…</div>'`, `'<div class="sds-bubble chitti">' + strFor2W('mb.bubble.searching') + '</div>'`, 'mb.bubble.searching'],

  // Bubble who-spans
  [`'<div class="sds-bubble chitti"><span class="who">क्या करें?</span>'`, `'<div class="sds-bubble chitti"><span class="who">' + strFor2W('mb.bubble.what_to_do') + '</span>'`, 'mb.bubble.what_to_do'],
  [`'<div class="sds-bubble chitti"><span class="who">Riding</span>'`, `'<div class="sds-bubble chitti"><span class="who">' + strFor2W('mb.bubble.riding') + '</span>'`, 'mb.bubble.riding'],
  [`'<div class="sds-bubble chitti"><span class="who">Driving</span>'`, `'<div class="sds-bubble chitti"><span class="who">' + strFor2W('mb.bubble.driving') + '</span>'`, 'mb.bubble.driving'],
  // Trip verdict
  [`'✅ <b>GO — bike trip ke liye taiyaar hai.</b>'`, `('✅ <b>' + strFor2W('mb.trip.go') + '</b>')`, 'mb.trip.go'],
  [`done + ' / ' + total + ' done. Aur ' + (total - done) + ' baki.'`, `done + ' / ' + total + ' ' + strFor2W('mb.trip.done_word') + '. ' + (total - done) + ' ' + strFor2W('mb.trip.baki') + '.'`, 'mb.trip.done_word'],
  // 💰 fair price text — "Bargain to ₹X"
  [`'<div class="sds-bubble chitti"><b>Bargain to ₹' + parsed.bargain_to_inr + '</b></div>'`, `'<div class="sds-bubble chitti"><b>' + strFor2W('mb.fp.bargain_to') + ' ₹' + parsed.bargain_to_inr + '</b></div>'`, 'mb.fp.bargain_to'],
  // "Fair range"
  [`'<div class="mb-fairprice">💰 Fair range: ₹'`, `'<div class="mb-fairprice">💰 ' + strFor2W('mb.fp.fair_range') + ' ₹'`, 'mb.fp.fair_range'],
  // "Fair price"
  [`'<div class="mb-fairprice">💰 Fair price: ₹'`, `'<div class="mb-fairprice">💰 ' + strFor2W('mb.fp.fair_price') + ' ₹'`, 'mb.fp.fair_price'],
  // "Aapke area ke mechanics"
  [`'<div class="sds-bubble chitti"><span class="who">📍 ' + escapeHtml(parsed.area || pincode || 'aapke area') + '</span></div>'`, `'<div class="sds-bubble chitti"><span class="who">📍 ' + escapeHtml(parsed.area || pincode || strFor2W('mb.fm.your_area')) + '</span></div>'`, 'mb.fm.your_area'],
  // safe to ride bubbles
  [`'✅ Safe to ride to nearest mechanic'`, `strFor2W('mb.safe.ride_ok')`, 'mb.safe.ride_ok'],
  [`'❌ Do not ride — call for help'`, `strFor2W('mb.safe.ride_no')`, 'mb.safe.ride_no'],
  [`'✅ Safe to ride to mechanic'`, `strFor2W('mb.safe.ride_ok_short')`, 'mb.safe.ride_ok_short'],
  // photo verdict labels
  [`'🔧 DIY'`, `strFor2W('mb.verdict.diy')`, 'mb.verdict.diy'],
  [`'🏪 Mechanic'`, `strFor2W('mb.verdict.mechanic')`, 'mb.verdict.mechanic'],
  // photo "Photo dekhi"
  [`(parsed.what || 'Photo dekhi')`, `(parsed.what || strFor2W('mb.photo.saw'))`, 'mb.photo.saw'],
  [`(parsed.sound_id || 'Awaaz pehchani')`, `(parsed.sound_id || strFor2W('mb.sound.recognised'))`, 'mb.sound.recognised'],
  // sound recorder status
  [`'🔴 Recording... (10 sec)'`, `strFor2W('mb.sound.recording')`, 'mb.sound.recording'],
  [`'🔴 Recording… (10 sec)'`, `strFor2W('mb.sound.recording')`, null],
  [`'✅ Recorded — describe the sound below'`, `strFor2W('mb.sound.recorded')`, 'mb.sound.recorded'],
  [`'✅ Recorded — sound describe karein'`, `strFor2W('mb.sound.recorded')`, null],
  [`'❌ Mic access denied.'`, `strFor2W('mb.sound.mic_denied')`, 'mb.sound.mic_denied'],
  [`'❌ Mic access nahi mila. Browser permissions check karein.'`, `strFor2W('mb.sound.mic_denied')`, null],
  [`'🔴 Phir record'`, `strFor2W('mb.sound.again')`, 'mb.sound.again'],
  [`'⏹ Stop'`, `strFor2W('mb.sound.stop')`, 'mb.sound.stop'],
  // KYV vote prompts
  [`'Vote noted — Chitti is khabar pahuncha rahi hai.'`, `strFor2W('mb.soon.voted')`, 'mb.soon.voted'],
  [`'Theek hai — yeh nahi banayenge.'`, `strFor2W('mb.soon.nope')`, 'mb.soon.nope'],
  // Helmet
  [`window.open('https://www.google.com/maps/search/bike+mechanic+near+me'`, `window.open('https://www.google.com/maps/search/bike+mechanic+near+me'`, null],
];

const MAP_4W = [
  [`speakText('कम से कम make, model और reg number डालिए।', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.min_fields'), CURRENT_LANG)`, 'mc.speak.min_fields'],
  [`speakText('गाड़ी सेव हो गई। ' + c.make + ' ' + c.model + ', ' + c.reg, CURRENT_LANG)`, `speakText(strFor4W('mc.speak.saved') + ' ' + c.make + ' ' + c.model + ', ' + c.reg, CURRENT_LANG)`, 'mc.speak.saved'],
  [`speakText('Demo bharo: Maruti Swift VXi DL3 CAB 5678, 2020, safed.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.demo'), CURRENT_LANG)`, 'mc.speak.demo'],
  [`speakText('Voice support nahi hai. टाइप करें.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.no_voice'), CURRENT_LANG)`, 'mc.speak.no_voice'],
  [`speakText('Voice शुरू नहीं हो पायी। टाइप करें।', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.voice_failed'), CURRENT_LANG)`, 'mc.speak.voice_failed'],
  [`speakText('Chitti को बताइए क्या तकलीफ़ है।', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.tell_problem'), CURRENT_LANG)`, 'mc.speak.tell_problem'],
  [`speakText('Feedback bhej diya, dhanyavaad.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.fb_sent'), CURRENT_LANG)`, 'mc.speak.fb_sent'],
  [`speakText('Pehle error code likhiye.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.obd_need_code'), CURRENT_LANG)`, 'mc.speak.obd_need_code'],
  [`speakText('Nayi gaadi slot. Form bhar ke save karein.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.new_slot'), CURRENT_LANG)`, 'mc.speak.new_slot'],
  [`speakText('Kya kaam hua yeh likhiye.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.log_what'), CURRENT_LANG)`, 'mc.speak.log_what'],
  [`speakText('Service entry save ho gayi. Total ' + list.length + ' entries.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.log_saved') + ' ' + list.length, CURRENT_LANG)`, 'mc.speak.log_saved'],
  [`speakText('Abhi koi service entry nahi.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.log_empty'), CURRENT_LANG)`, 'mc.speak.log_empty'],
  [`speakText('Total ' + list.length + ' service entries. Kul ' + total + ' rupiye kharch.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.log_total') + ' ' + list.length + '. ' + total + ' ' + strFor4W('mc.speak.rupiye_kharch'), CURRENT_LANG)`, 'mc.speak.log_total'],
  [`speakText('Demo entry add ho gayi.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.demo_added'), CURRENT_LANG)`, 'mc.speak.demo_added'],
  [`speakText('Emergency. Chitti family ko call kar rahi hai. 112 ko NAHI.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.sos'), CURRENT_LANG)`, 'mc.speak.sos'],
  [`speakText('Pre-drive check shuru. Har item tick karein.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.trip_start'), CURRENT_LANG)`, 'mc.speak.trip_start'],
  [`speakText('Sab tick. Gaadi ready hai. Safe drive.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.trip_done'), CURRENT_LANG)`, 'mc.speak.trip_done'],
  [`speakText('Awaaz ka description likhiye.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.sound_need_desc'), CURRENT_LANG)`, 'mc.speak.sound_need_desc'],
  [`speakText('Kya kaam aur kitne ka quote bataiye.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.fp_need_input'), CURRENT_LANG)`, 'mc.speak.fp_need_input'],
  [`speakText('Pehle apni gaadi save karein. Chitti research nahi kar sakti.', CURRENT_LANG)`, `speakText(strFor4W('mc.speak.kyv_need_save'), CURRENT_LANG)`, 'mc.speak.kyv_need_save'],
  [`speakText('Vote noted — Chitti is khabar pahuncha rahi hai.'`, `speakText(strFor4W('mc.soon.voted')`, 'mc.soon.voted'],
  [`speakText('Theek hai — yeh nahi banayenge.'`, `speakText(strFor4W('mc.soon.nope')`, 'mc.soon.nope'],

  // Bubble HTML literals — same keys reused via mc-prefixed
  [`'<div class="sds-bubble chitti"><span class="who">Chitti soch rahi hai…</span></div>'`, `'<div class="sds-bubble chitti"><span class="who">' + strFor4W('mc.bubble.thinking') + '</span></div>'`, 'mc.bubble.thinking'],
  [`'<div class="sds-bubble warn">Chitti se code abhi nahi mila — phir try karein.</div>'`, `'<div class="sds-bubble warn">' + strFor4W('mc.bubble.code_fail') + '</div>'`, 'mc.bubble.code_fail'],
  [`'<div class="sds-bubble warn">Chitti photo se nahi samajh paayi. Description likh kar Chitti se Ask karein.</div>'`, `'<div class="sds-bubble warn">' + strFor4W('mc.bubble.photo_fail') + '</div>'`, 'mc.bubble.photo_fail'],
  [`'<div class="sds-bubble chitti"><span class="who">Chitti sun rahi hai…</span></div>'`, `'<div class="sds-bubble chitti"><span class="who">' + strFor4W('mc.bubble.listening') + '</span></div>'`, 'mc.bubble.listening'],
  [`'<div class="sds-bubble warn">Chitti samajh nahi paayi.</div>'`, `'<div class="sds-bubble warn">' + strFor4W('mc.bubble.fp_fail') + '</div>'`, 'mc.bubble.fp_fail'],
  [`'<div class="sds-bubble chitti">Chitti dekh rahi hai…</div>'`, `'<div class="sds-bubble chitti">' + strFor4W('mc.bubble.seeing') + '</div>'`, 'mc.bubble.seeing'],
  [`'<div class="sds-bubble chitti">Chitti pre-drive check kar rahi hai…</div>'`, `'<div class="sds-bubble chitti">' + strFor4W('mc.bubble.predrive') + '</div>'`, 'mc.bubble.predrive'],
  [`'<div class="sds-bubble chitti">Chitti dhund rahi hai…</div>'`, `'<div class="sds-bubble chitti">' + strFor4W('mc.bubble.searching') + '</div>'`, 'mc.bubble.searching'],

  [`'<div class="sds-bubble chitti"><span class="who">क्या करें?</span>'`, `'<div class="sds-bubble chitti"><span class="who">' + strFor4W('mc.bubble.what_to_do') + '</span>'`, 'mc.bubble.what_to_do'],
  [`'<div class="sds-bubble chitti"><span class="who">Driving</span>'`, `'<div class="sds-bubble chitti"><span class="who">' + strFor4W('mc.bubble.driving') + '</span>'`, 'mc.bubble.driving'],
  [`'✅ <b>GO — gaadi trip ke liye taiyaar hai.</b>'`, `('✅ <b>' + strFor4W('mc.trip.go') + '</b>')`, 'mc.trip.go'],
  [`done + ' / ' + total + ' done. Aur ' + (total - done) + ' baki.'`, `done + ' / ' + total + ' ' + strFor4W('mc.trip.done_word') + '. ' + (total - done) + ' ' + strFor4W('mc.trip.baki') + '.'`, 'mc.trip.done_word'],

  [`'<div class="sds-bubble chitti"><b>Bargain to ₹' + parsed.bargain_to_inr + '</b></div>'`, `'<div class="sds-bubble chitti"><b>' + strFor4W('mc.fp.bargain_to') + ' ₹' + parsed.bargain_to_inr + '</b></div>'`, 'mc.fp.bargain_to'],
  [`'<div class="mc-fairprice">💰 Fair range: ₹'`, `'<div class="mc-fairprice">💰 ' + strFor4W('mc.fp.fair_range') + ' ₹'`, 'mc.fp.fair_range'],
  [`'<div class="mc-fairprice">💰 Fair price: ₹'`, `'<div class="mc-fairprice">💰 ' + strFor4W('mc.fp.fair_price') + ' ₹'`, 'mc.fp.fair_price'],
  [`'<div class="sds-bubble chitti"><span class="who">📍 ' + escapeHtmlMc(parsed.area || pincode || 'aapke area') + '</span></div>'`, `'<div class="sds-bubble chitti"><span class="who">📍 ' + escapeHtmlMc(parsed.area || pincode || strFor4W('mc.fm.your_area')) + '</span></div>'`, 'mc.fm.your_area'],
  [`'✅ Safe to drive to workshop'`, `strFor4W('mc.safe.drive_ok')`, 'mc.safe.drive_ok'],
  [`'❌ Do not drive — tow it'`, `strFor4W('mc.safe.drive_no')`, 'mc.safe.drive_no'],

  [`(parsed.what || 'Photo dekhi')`, `(parsed.what || strFor4W('mc.photo.saw'))`, 'mc.photo.saw'],
  [`(parsed.sound_id || 'Awaaz pehchani')`, `(parsed.sound_id || strFor4W('mc.sound.recognised'))`, 'mc.sound.recognised'],
  [`'🔴 Recording… (10 sec)'`, `strFor4W('mc.sound.recording')`, 'mc.sound.recording'],
  [`'✅ Recorded — sound describe karein'`, `strFor4W('mc.sound.recorded')`, 'mc.sound.recorded'],
  [`'❌ Mic access nahi mila.'`, `strFor4W('mc.sound.mic_denied')`, 'mc.sound.mic_denied'],
  [`'🔴 Phir record'`, `strFor4W('mc.sound.again')`, 'mc.sound.again'],
  [`'⏹ Stop'`, `strFor4W('mc.sound.stop')`, 'mc.sound.stop'],
];

function applyMap(P, map) {
  let s = readFileSync(P, 'utf8');
  let hits = 0, misses = [];
  for (const [from, to] of map) {
    if (s.includes(from)) { s = s.split(from).join(to); hits++; }
    else { misses.push(from.slice(0, 70)); }
  }
  writeFileSync(P, s);
  return { hits, misses };
}

const r2 = applyMap('c:/Users/DELL/sahayai/sahayai/chitti_2wheeler.html', MAP_2W);
console.log('2W sweep: ' + r2.hits + ' hits.');
if (r2.misses.length) { console.log('2W misses:'); r2.misses.forEach(m => console.log('  ' + m)); }

const r4 = applyMap('c:/Users/DELL/sahayai/sahayai/chitti_4wheeler.html', MAP_4W);
console.log('4W sweep: ' + r4.hits + ' hits.');
if (r4.misses.length) { console.log('4W misses:'); r4.misses.forEach(m => console.log('  ' + m)); }
