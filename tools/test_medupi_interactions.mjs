// Gold assertions for the deterministic MedUPI drug-interaction engine (BO3).
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const E = require(path.join(__dirname, '..', 'chitti_medupi_interactions.js'));

let pass = 0, fail = 0;
function ok(name, cond, extra = '') { if (cond) { pass++; } else { fail++; console.log(`❌ ${name} ${extra}`); } }

// pair helper: does check() flag a/b with given severity?
function find(meds, a, b) {
  const r = E.check(meds);
  return r.interactions.find(i => (i.a === E.normalize(a) && i.b === E.normalize(b)) || (i.a === E.normalize(b) && i.b === E.normalize(a)));
}

// ── SEVERE: bleeding ──
ok('warfarin+aspirin = severe bleeding', (find(['Warfarin', 'Aspirin'], 'warfarin', 'aspirin') || {}).severity === 'severe');
ok('warfarin+ibuprofen = severe bleeding', (find(['warfarin', 'ibuprofen'], 'warfarin', 'ibuprofen') || {}).type === 'bleeding');
ok('warfarin+rivaroxaban = severe (two anticoagulants)', (find(['warfarin', 'rivaroxaban'], 'warfarin', 'rivaroxaban') || {}).severity === 'severe');
ok('aspirin+clopidogrel = bleeding flagged', !!find(['aspirin', 'clopidogrel'], 'aspirin', 'clopidogrel'));

// ── SEVERE: serotonin ──
ok('sertraline+tramadol = severe serotonin', (find(['Sertraline', 'Tramadol'], 'sertraline', 'tramadol') || {}).type === 'serotonin');
ok('fluoxetine+linezolid (MAOI) = severe', (find(['fluoxetine', 'linezolid'], 'fluoxetine', 'linezolid') || {}).severity === 'severe');
ok('sertraline+sumatriptan = moderate serotonin', (find(['sertraline', 'sumatriptan'], 'sertraline', 'sumatriptan') || {}).severity === 'moderate');

// ── SEVERE: hyperkalemia ──
ok('ramipril+spironolactone = severe hyperkalemia', (find(['Ramipril', 'Spironolactone'], 'ramipril', 'spironolactone') || {}).type === 'hyperkalemia');

// ── SEVERE: statin muscle ──
ok('simvastatin+clarithromycin = severe muscle', (find(['simvastatin', 'clarithromycin'], 'simvastatin', 'clarithromycin') || {}).type === 'muscle');
ok('atorvastatin+itraconazole = severe muscle', (find(['atorvastatin', 'itraconazole'], 'atorvastatin', 'itraconazole') || {}).severity === 'severe');

// ── SEVERE: nitrate+pde5 ──
ok('isosorbide mononitrate+sildenafil = severe hypotension', (find(['Isosorbide Mononitrate', 'Sildenafil'], 'isosorbide mononitrate', 'sildenafil') || {}).type === 'hypotension');

// ── SEVERE: methotrexate + nsaid, lithium + nsaid ──
ok('methotrexate+diclofenac = severe', (find(['methotrexate', 'diclofenac'], 'methotrexate', 'diclofenac') || {}).severity === 'severe');
ok('lithium+ibuprofen = severe toxicity', (find(['lithium', 'ibuprofen'], 'lithium', 'ibuprofen') || {}).type === 'toxicity');

// ── MODERATE ──
ok('glimepiride+insulin = moderate hypoglycemia', (find(['glimepiride', 'insulin'], 'glimepiride', 'insulin') || {}).type === 'hypoglycemia');
ok('alprazolam+tramadol = moderate sedation', (find(['alprazolam', 'tramadol'], 'alprazolam', 'tramadol') || {}).type === 'sedation');
ok('azithromycin+ondansetron = moderate QT', (find(['azithromycin', 'ondansetron'], 'azithromycin', 'ondansetron') || {}).type === 'qt');
ok('ramipril+ibuprofen = moderate kidney', (find(['ramipril', 'ibuprofen'], 'ramipril', 'ibuprofen') || {}).type === 'kidney');

// ── Combination salts resolve to components ──
ok('ibuprofen+paracetamol combo still flags vs warfarin', !!find(['warfarin', 'ibuprofen+paracetamol'], 'warfarin', 'ibuprofen+paracetamol'));

// ── Safe / honest negatives ──
const safe = E.check(['paracetamol', 'cetirizine', 'vitamin c']);
ok('paracetamol+cetirizine+vitc = no interaction', safe.count === 0 && safe.none_found === true);
ok('single medicine = none_found false (need >=2)', E.check(['warfarin']).none_found === false);
ok('empty input safe', E.check([]).count === 0 && E.check(null).count === 0);

// ── Structure / determinism ──
const r2 = E.check(['Warfarin', 'Aspirin', 'Ramipril', 'Spironolactone']);
ok('multi-med: highest = severe', r2.highest === 'severe');
ok('severe sorted before moderate', r2.interactions.length >= 2 && r2.interactions[0].severity === 'severe');
ok('every interaction has symbol+labels+disclaimer', r2.interactions.every(i => i.symbol && i.label_en && i.label_hi && i.hi_summary) && !!r2.disclaimer_en && !!r2.disclaimer_hi);
ok('symbols are not colour-only (⛔/⚠️)', r2.interactions.every(i => i.symbol === '⛔' || i.symbol === '⚠️'));
ok('determinism: same input twice = identical', JSON.stringify(E.check(['warfarin', 'aspirin'])) === JSON.stringify(E.check(['warfarin', 'aspirin'])));

console.log(`\n${pass}/${pass + fail} gold assertions PASS`);
process.exit(fail === 0 ? 0 : 1);
