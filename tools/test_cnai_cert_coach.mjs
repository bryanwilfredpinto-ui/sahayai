// Gold assertions for the 60-day certification coach engine (News AI BO5).
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const E = require(path.join(__dirname, '..', 'cnai_cert_coach.js'));

let pass = 0, fail = 0;
function ok(name, cond, extra = '') { if (cond) pass++; else { fail++; console.log(`❌ ${name} ${extra}`); } }

const plan = E.build('SHRM-CP', 'talent-acquisition');
ok('plan has exactly 60 days', plan.days.length === 60 && plan.totalDays === 60);
ok('days numbered 1..60 in order', plan.days.every((d, i) => d.day === i + 1));
ok('6 phases present', plan.phases.length === 6);
ok('day 1 = Foundations', plan.days[0].phase === 'Foundations');
ok('day 60 = Exam-ready', plan.days[59].phase === 'Exam-ready');
ok('day 25 milestone = core done', plan.days[24].milestone === 'Core concepts done');
ok('day 60 milestone = ready to sit', /Ready to sit/i.test(plan.days[59].milestone));
ok('every day is a 10-minute task', plan.days.every(d => d.minutes === 10));
ok('every 7th day is a review/rest day', plan.days[6].rest === true && plan.days[13].rest === true && plan.days[6].quiz === false);
ok('teaching days carry a quiz', plan.days[0].quiz === true && plan.days[2].quiz === true);
ok('task references the cert + profession', /SHRM-CP/.test(plan.days[0].task) && /talent-acquisition/.test(plan.days[0].task));
ok('cert name preserved', plan.cert === 'SHRM-CP');

// certFor profession mapping (real free certs)
ok('certFor farmer = Elements of AI', /Elements of AI/.test(E.certFor('farmer')));
ok('certFor developer = Agent Academy', /Agent Academy/.test(E.certFor('software-developer')));
ok('certFor unknown → sensible default', /Elements of AI/.test(E.certFor('astronaut')));
ok('build with no cert uses certFor(profession)', /Elements of AI/.test(E.build(null, 'farmer').cert));

// today()
const t1 = E.today(plan, 1);
ok('today(1) returns Day 1 of 60', t1.day === 1 && t1.of === 60 && /10-minute/.test(t1.teach));
ok('today clamps out-of-range', E.today(plan, 999).day === 60 && E.today(plan, -5).day === 1);
ok('rest day has no teach lesson', E.today(plan, 7).rest === true && E.today(plan, 7).teach === null);

// progress() + streak
const p0 = E.progress([]);
ok('progress empty → 0% , nextDay 1', p0.done === 0 && p0.percent === 0 && p0.nextDay === 1 && p0.streak === 0);
const p1 = E.progress([1, 2, 3]);
ok('progress 3 consecutive → streak 3, next 4', p1.streak === 3 && p1.nextDay === 4 && p1.done === 3);
const pGap = E.progress([1, 2, 5]);
ok('progress with gap → streak 2 (breaks at gap), next 3', pGap.streak === 2 && pGap.nextDay === 3 && pGap.done === 3);
ok('progress milestone hit at day 10', E.progress([10]).milestonesHit.some(m => m.day === 10));
const pAll = E.progress(Array.from({ length: 60 }, (_, i) => i + 1));
ok('progress all 60 → complete, 100%, streak 60', pAll.complete === true && pAll.percent === 100 && pAll.streak === 60);
ok('progress ignores out-of-range day numbers', E.progress([1, 2, 99, 0]).done === 2);

// determinism
ok('determinism: same build twice identical', JSON.stringify(E.build('X', 'y')) === JSON.stringify(E.build('X', 'y')));

console.log(`\n${pass}/${pass + fail} gold assertions PASS`);
process.exit(fail === 0 ? 0 : 1);
