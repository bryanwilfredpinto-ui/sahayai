/**
 * Refactor mb/mc KYV renderers to use strFor() for section titles + labels.
 * Refactor speakText() literal prompts in cards to use strFor() keys.
 * Tag Launching-Soon card titles + subs with data-vai-i18n.
 */
import { readFileSync, writeFileSync } from 'node:fs';

function patch(P, V) {
  let s = readFileSync(P, 'utf8');
  let count = 0;

  // KYV renderer section titles — replace hard-coded strings
  const sectionMap = [
    [`'🔧 Anatomy — har part ka role'`, `strFor('kyv.sec.anatomy')`],
    [`'🛢️ Consumables — kya, kab, kitne ka, kahaan se'`, `strFor('kyv.sec.consumables')`],
    [`'🔧 Anatomy — har part ka role + kahaan'`, `strFor('kyv.sec.anatomy')`],
    [`'✨ Saaf-safai — store ya ghar par'`, `strFor('kyv.sec.cleaning')`],
    [`'🧰 Toolkit — kya khud rakhna'`, `strFor('kyv.sec.toolkit')`],
    [`'🚨 Awaaz · gandh · light — decoded'`, `strFor('kyv.sec.warnings')`],
    [`'🚨 Dashboard light · awaaz · gandh — decoded'`, `strFor('kyv.sec.warnings')`],
    [`'📅 Saal bhar ka care + paisa-bachao guide'`, `strFor('kyv.sec.calendar')`],
  ];
  for (const [from, to] of sectionMap) {
    // We need to wrap with a template literal — e.g. `'<div...>${strFor('...')}</div>'`
    // But the existing code uses string concatenation. Find: '<div class="kyv-section-title">🔧 Anatomy — har part ka role</div>'
    // We replace the LITERAL TITLE PART. Format: h += '<div class="kyv-section-title">' + EXPR + '</div>';
    // Find the source line and replace.
    // The hard-coded version: h += '<div class="kyv-section-title">🔧 Anatomy — har part ka role</div>';
    const literal = `h += '<div class="kyv-section-title">` + from.slice(1, -1) + `</div>';`;
    const repl = `h += '<div class="kyv-section-title">' + ` + to + ` + '</div>';`;
    if (s.includes(literal)) { s = s.replace(literal, repl); count++; }
  }

  // KYV stats labels — these come from a stats array. Refactor.
  const statsOldRe = /const stats = \[\s*\['Engine'[^]]*?\];/;
  if (statsOldRe.test(s)) {
    // 2W variant
    s = s.replace(
      /const stats = \[\s*\['Engine', \(j\.engine_cc\?j\.engine_cc\+' cc':'-'\)\], \['Type', \(j\.engine_type\|\|'-'\)\],\s*\['BHP', \(j\.bhp\|\|'-'\)\], \['Torque', \(\(j\.torque_nm\|\|'-'\)\+' Nm'\)\],\s*\['Tank', \(\(j\.fuel_tank_l\|\|'-'\)\+' L'\)\], \['Mileage', j\.rated_mileage\|\|'-'\],\s*\['Service', j\.service_interval\|\|'-'\]\s*\];/,
      `const stats = [
    [strFor('kyv.stat.engine'), (j.engine_cc?j.engine_cc+' cc':'-')], [strFor('kyv.stat.type'), (j.engine_type||'-')],
    [strFor('kyv.stat.bhp'), (j.bhp||'-')], [strFor('kyv.stat.torque'), ((j.torque_nm||'-')+' Nm')],
    [strFor('kyv.stat.tank'), ((j.fuel_tank_l||'-')+' L')], [strFor('kyv.stat.mileage'), j.rated_mileage||'-'],
    [strFor('kyv.stat.service'), j.service_interval||'-']
  ];`
    );
    count++;
    // 4W variant has Fuel instead of Type
    s = s.replace(
      /const stats = \[\s*\['Engine', \(j\.engine_cc\?j\.engine_cc\+' cc':'-'\)\], \['Fuel', \(j\.engine_type\|\|'-'\)\],\s*\['BHP', \(j\.bhp\|\|'-'\)\], \['Torque', \(\(j\.torque_nm\|\|'-'\)\+' Nm'\)\],\s*\['Tank', \(\(j\.fuel_tank_l\|\|'-'\)\+' L'\)\], \['Mileage', j\.rated_mileage\|\|'-'\],\s*\['Service', j\.service_interval\|\|'-'\]\s*\];/,
      `const stats = [
    [strFor('kyv.stat.engine'), (j.engine_cc?j.engine_cc+' cc':'-')], [strFor('kyv.stat.fuel'), (j.engine_type||'-')],
    [strFor('kyv.stat.bhp'), (j.bhp||'-')], [strFor('kyv.stat.torque'), ((j.torque_nm||'-')+' Nm')],
    [strFor('kyv.stat.tank'), ((j.fuel_tank_l||'-')+' L')], [strFor('kyv.stat.mileage'), j.rated_mileage||'-'],
    [strFor('kyv.stat.service'), j.service_interval||'-']
  ];`
    );
    count++;
  }

  // KYV ki khaas baatein subtitle
  s = s.replace(/' ki khaas baatein'/g, ` + ' ' + strFor('kyv.sec.known')`);
  count++;

  // Subtle labels in renderer
  s = s.replace(/'<b>💸 Service cost benchmark:<\/b><br>'/, "'<b>💸 ' + strFor('kyv.cost.lbl') + ':</b><br>'");
  s = s.replace(/'Local mechanic: ₹'/, "strFor('kyv.cost.local') + ' ₹'");
  s = s.replace(/' · Authorised: ₹'/, "' · ' + strFor('kyv.cost.auth') + ' ₹'");
  s = s.replace(/'<b>🌧️ Monsoon:<\/b> '/, "'<b>🌧️ ' + strFor('kyv.season.monsoon') + ':</b> '");
  s = s.replace(/'<b>☀️ Summer:<\/b> '/, "'<b>☀️ ' + strFor('kyv.season.summer') + ':</b> '");
  s = s.replace(/'<b>❄️ Winter:<\/b> '/, "'<b>❄️ ' + strFor('kyv.season.winter') + ':</b> '");
  s = s.replace(/'<b>💰 Resale prep:<\/b><ul>'/, "'<b>💰 ' + strFor('kyv.resale') + ':</b><ul>'");
  s = s.replace(/'<b>🎙️ Pre-ride 30-sec check:<\/b><ol>'/, "'<b>🎙️ ' + strFor('kyv.preride') + ':</b><ol>'");
  s = s.replace(/'<b>🎙️ Pre-drive 30-sec check:<\/b><ol>'/, "'<b>🎙️ ' + strFor('kyv.predrive') + ':</b><ol>'");

  writeFileSync(P, s);
  return count;
}

const c2w = patch('c:/Users/DELL/sahayai/sahayai/chitti_2wheeler.html', 'mb');
const c4w = patch('c:/Users/DELL/sahayai/sahayai/chitti_4wheeler.html', 'mc');
console.log('2W refactor edits:', c2w);
console.log('4W refactor edits:', c4w);
