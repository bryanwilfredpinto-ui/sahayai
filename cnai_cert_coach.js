/*!
 * cnai_cert_coach.js — Chitti News AI BO5
 * Deterministic 60-day certification coaching engine. RULES ARE THE PRODUCT.
 *
 * Builds a fixed Day 1–60 structure for any certification (6 phases →
 * Foundations · Core · Practice · Capstone · Revision · Exam-ready), schedules a
 * 10-minute task per day with weekly review days + milestones, and tracks
 * progress + streak. The deterministic STRUCTURE is the engine; the lesson PROSE
 * is taught by Chitti (DeepSeek) at runtime in the user's language using their
 * profession as the analogy (honest COMING SOON where the key is absent — never
 * fabricated). No certification is invented (Art-4/Art-6); links go to the real cert.
 *
 * Works in browser (window.CnaiCertCoach) and Node (tests).
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  if (root) root.CnaiCertCoach = mod;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  var PHASES = [
    { key: 'foundations', label: 'Foundations', from: 1, to: 10 },
    { key: 'core', label: 'Core concepts', from: 11, to: 25 },
    { key: 'practice', label: 'Hands-on practice', from: 26, to: 40 },
    { key: 'capstone', label: 'Capstone project', from: 41, to: 50 },
    { key: 'revision', label: 'Revision & mock tests', from: 51, to: 57 },
    { key: 'exam', label: 'Exam-ready', from: 58, to: 60 }
  ];

  var MILESTONES = {
    10: 'Foundations complete', 25: 'Core concepts done', 40: 'Practice complete',
    50: 'Capstone shipped', 57: 'Mock tests cleared', 60: 'Ready to sit the certification'
  };

  // Profession → a recommended FREE certification (from CEOS Section 24). Honest, real certs only.
  var CERT_FOR = {
    'talent-acquisition': 'SHRM-CP (free study path)', 'hr-professional': 'SHRM-CP (free study path)', 'hr': 'SHRM-CP (free study path)',
    'farmer': 'Elements of AI (Helsinki — free)', 'doctor': 'AI in Medicine (Stanford — free audit)',
    'software-developer': 'Agentic AI (Agent Academy — free)', 'developer': 'Agentic AI (Agent Academy — free)',
    'driver': 'Google Digital Marketing (free)', 'logistics': 'Google Digital Marketing (free)',
    'teacher': 'AI for Education (Microsoft — free)', 'accountant': 'GST Practitioner (GSTN — free)',
    'homemaker': 'Meesho Selling (free)', 'student': 'Elements of AI (Helsinki — free)',
    'shopkeeper': 'Digital Payments (NPCI — free)'
  };

  function certFor(profession) {
    var p = String(profession || '').trim().toLowerCase().replace(/\s+/g, '-');
    return CERT_FOR[p] || 'Elements of AI (Helsinki — free)';
  }

  function phaseOf(day) {
    for (var i = 0; i < PHASES.length; i++) if (day >= PHASES[i].from && day <= PHASES[i].to) return PHASES[i];
    return PHASES[PHASES.length - 1];
  }

  function taskFor(phaseKey, day, cert, profession) {
    var prof = profession || 'your work';
    var byPhase = {
      foundations: 'Learn one core term of ' + cert + ' and explain it using a ' + prof + ' example.',
      core: 'Study one key concept of ' + cert + '; write 2 lines on how it maps to ' + prof + '.',
      practice: 'Do one small hands-on exercise for ' + cert + ' (a real example from ' + prof + ').',
      capstone: 'Build one piece of your capstone project that proves a ' + cert + ' skill.',
      revision: 'Re-do the 2 hardest topics and take a short mock quiz for ' + cert + '.',
      exam: 'Final review + register / confirm your seat for ' + cert + '.'
    };
    return byPhase[phaseKey] || ('Spend 10 minutes on ' + cert + '.');
  }

  /** build(cert, profession) → fixed 60-day plan. */
  function build(cert, profession) {
    var certName = (cert && String(cert).trim()) || certFor(profession);
    var days = [];
    for (var d = 1; d <= 60; d++) {
      var ph = phaseOf(d);
      var rest = (d % 7 === 0);                       // every 7th day = lighter review
      days.push({
        day: d,
        week: Math.ceil(d / 7),
        phase: ph.label,
        phaseKey: ph.key,
        rest: rest,
        title: rest ? ('Week ' + Math.ceil(d / 7) + ' review') : (ph.label + ' — Day ' + d),
        task: rest ? ('Recap week ' + Math.ceil(d / 7) + ': re-do the 2 hardest concepts, no new material.') : taskFor(ph.key, d, certName, profession),
        minutes: 10,
        quiz: !rest,                                  // every teaching day ends in a 2-question quiz
        milestone: MILESTONES[d] || null
      });
    }
    return { cert: certName, profession: profession || null, totalDays: 60, phases: PHASES.slice(), days: days,
      note: 'The 60-day structure is fixed and deterministic. Chitti teaches each day in your language using your profession as the analogy; certification links always go to the real, free source.' };
  }

  /** today(plan, dayNum) → the day card + framing. Clamps to 1..60. */
  function today(plan, dayNum) {
    if (!plan || !plan.days) return null;
    var n = Math.max(1, Math.min(60, parseInt(dayNum, 10) || 1));
    var day = plan.days[n - 1];
    return {
      day: day.day, of: 60, phase: day.phase, title: day.title, task: day.task,
      minutes: day.minutes, quiz: day.quiz, rest: day.rest, milestone: day.milestone,
      teach: day.rest ? null : ('Aaj ka 10-minute lesson: ' + day.task),
      cert: plan.cert
    };
  }

  /** progress(done) → {done,total,percent,streak,nextDay,milestonesHit}. done = array of completed day-numbers. */
  function progress(done) {
    var set = {}, list = (done || []).filter(function (x) { return x >= 1 && x <= 60; });
    list.forEach(function (x) { set[x] = true; });
    var count = Object.keys(set).length;
    var streak = 0;                                   // consecutive days completed from Day 1
    for (var i = 1; i <= 60; i++) { if (set[i]) streak++; else break; }
    var nextDay = null;
    for (var j = 1; j <= 60; j++) { if (!set[j]) { nextDay = j; break; } }
    var milestonesHit = [];
    Object.keys(MILESTONES).forEach(function (k) { if (set[k]) milestonesHit.push({ day: +k, label: MILESTONES[k] }); });
    milestonesHit.sort(function (a, b) { return a.day - b.day; });
    return { done: count, total: 60, percent: Math.round((count / 60) * 100), streak: streak,
      nextDay: nextDay, complete: count === 60, milestonesHit: milestonesHit };
  }

  return { build: build, today: today, progress: progress, certFor: certFor, PHASES: PHASES, MILESTONES: MILESTONES, VERSION: '1.0.0' };
});
