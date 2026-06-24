// Gold assertions for the deterministic ISL gloss (SOV) engine (BO1).
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const E = require(path.join(__dirname, '..', 'chitti_isl_grammar.js'));

let pass = 0, fail = 0;
const g = s => E.gloss(s).glossString;
function ok(name, cond, extra = '') { if (cond) pass++; else { fail++; console.log(`❌ ${name} ${extra}`); } }
function eq(name, got, want) { ok(`${name} (got "${got}" want "${want}")`, got === want); }

// SOV reordering + pronoun mapping + drop copula/articles
eq('I want water', g('I want water'), 'ME WATER WANT');
eq('I am going to school tomorrow (time fronted, SOV)', g('I am going to school tomorrow'), 'TOMORROW ME SCHOOL GO');
eq('You are not coming (negation last)', g('You are not coming'), 'YOU COME NOT');
eq('Where are you going (WH last)', g('Where are you going?'), 'YOU GO WHERE');
eq('I do not like tea', g('I do not like tea'), 'ME TEA LIKE NOT');
eq('drop the article', g('I read the book'), 'ME BOOK READ');
eq('She teaches me', g('She teaches me'), 'SHE ME TEACH');

// Structural checks
ok('time word fronted', E.gloss('I will eat tomorrow').gloss[0] === 'TOMORROW');
ok('WH word last', (function(){ const a = E.gloss('what do you want'); return a.gloss[a.gloss.length - 1] === 'WHAT'; })());
ok('negation produces single NOT at/near end', E.gloss('I can not go').gloss.includes('NOT'));
ok('verb moved to end (SOV)', (function(){ const a = E.gloss('I eat rice'); return a.gloss[a.gloss.length - 1] === 'EAT'; })());
ok('pronoun I → ME', E.gloss('I help you').gloss.includes('ME'));
ok('articles dropped', E.gloss('a the an').glossString.trim() === '');
ok('every output carries honesty note', /not certified ISL/i.test(E.gloss('I want water').note));
ok('order tagged SOV', E.gloss('I want water').order === 'SOV');
ok('empty input safe', E.gloss('').gloss.length === 0 && E.gloss(null).gloss.length === 0);
ok('determinism', E.gloss('I want water').glossString === E.gloss('I want water').glossString);
ok('contraction expansion (don\'t)', E.gloss("I don't know").gloss.includes('NOT') && E.gloss("I don't know").gloss.includes('KNOW'));

console.log(`\n${pass}/${pass + fail} gold assertions PASS`);
process.exit(fail === 0 ? 0 : 1);
