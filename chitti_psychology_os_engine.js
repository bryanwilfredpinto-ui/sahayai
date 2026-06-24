/* ════════════════════════════════════════════════════════════════════════
   chitti_psychology_os_engine.js — Chitti Psychology DETERMINISTIC brain.
   Doctrine: rules are the product, the LLM enhances. The SAFETY-CRITICAL path
   (crisis detection + helpline routing) runs with ZERO LLM dependency — it is
   testable, auditable, and cannot be jailbroken the way an LLM can.

   UMD: attaches to window.ChittiPsychologyEngine in the browser AND
   module.exports in Node so tools/psychology_os_engine_test.mjs can score it.

   HARD BOUNDARY (CONSTITUTION.md): NEVER diagnose, prescribe, claim feelings,
   promise outcomes, give means, or say "you don't need help". Companion, not
   a therapist. Crisis → Tele-MANAS 14416 + family cascade, NEVER auto-dial.
   ════════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ChittiPsychologyEngine = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  // ── text normalisation: lowercase, drop apostrophes, collapse whitespace ──
  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/['’`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ════════ 1. CRISIS DETECTION — the out-of-band classifier (SAFETY) ════════
  // Multi-word PHRASES (not single words) so "tired" or "sleep" alone never
  // false-positives, but "tired of living" / "sleep forever" do. Direct +
  // indirect + vernacular (Hindi-latin + Devanagari). Re-verify the lexicon
  // quarterly; expansion is HIGH-risk (Sire-reviewed).
  var CRISIS_PHRASES = [
    // English — direct
    'dont want to live', 'do not want to live', 'want to die', 'kill myself',
    'end my life', 'end it all', 'no point in living', 'no point living',
    'better off dead', 'harm myself', 'harming myself', 'hurt myself',
    'take my own life', 'suicide', 'commit suicide',
    // English — indirect
    'sleep forever', 'if i disappeared', 'better off without me', 'tired of living',
    'cant go on', 'cannot go on', 'dont want to be here', 'wish i was dead',
    'no reason to live', 'give up on life',
    // Hindi (latin)
    'marna chahta', 'marna chahti', 'jaan de dunga', 'jaan de dungi',
    'faayda jeene', 'fayda jeene', 'nahi jee sakta', 'nahi jee sakti',
    'khatam kar dunga', 'khatam kar dungi', 'jeena nahi chahta', 'jeena nahi chahti',
    // Hindi (Devanagari)
    'जीना नहीं चाहता', 'जीना नहीं चाहती', 'मरना चाहता', 'जान दे दूंगा',
    'आत्महत्या', 'जीने का क्या फायदा'
  ];
  // milder distress (level 1) — used only to soften tone + offer helpline strip,
  // NEVER to flag crisis. Negative controls land here, which is correct.
  var DISTRESS_WORDS = [
    'sad', 'lonely', 'alone', 'stressed', 'stress', 'anxious', 'anxiety', 'depressed',
    'tired', 'cry', 'crying', 'hopeless', 'worthless', 'udaas', 'akela', 'akeli',
    'tanha', 'pareshan', 'tension', 'dukhi', 'rona'
  ];

  function detectCrisis(text, history) {
    var hay = norm(text);
    // multi-turn: also scan recent history so cumulative risk is caught
    if (Array.isArray(history)) {
      hay += ' ' + history.map(function (h) { return norm(h); }).join(' ');
    }
    var signals = CRISIS_PHRASES.filter(function (p) { return hay.indexOf(norm(p)) >= 0; });
    if (signals.length) {
      return {
        level: 3,
        signals: signals,
        action: 'crisis-escalation',
        message: 'I am here with you. You are not alone. Are you safe right now?',
        helplines: helplines((history && history.lang) || 'en'),
        note: 'NEVER diagnose, NEVER give means, NEVER auto-dial. Warm handoff + stay.'
      };
    }
    var distress = DISTRESS_WORDS.filter(function (w) { return new RegExp('\\b' + w + '\\b').test(hay) || hay.indexOf(w) >= 0; });
    return { level: distress.length ? 1 : 0, signals: distress, action: distress.length ? 'support' : 'normal' };
  }

  // ════════ 2. EMOTIONAL MIRROR — possible emotions, never asserted ════════
  var EMOTION_MAP = [
    { keys: ['ignored', 'ignoring me', 'left out', 'ignore'], emo: ['hurt', 'rejection', 'sadness', 'loneliness'] },
    { keys: ['shouted', 'yelled', 'scolded', 'unfair', 'insulted', 'felt small'], emo: ['anger', 'frustration', 'hurt'] },
    { keys: ['exam', 'board', 'interview', 'deadline', 'cant focus', 'cannot focus'], emo: ['anxiety', 'stress', 'fear'] },
    { keys: ['passed away', 'died', 'death', 'no more', 'lost my'], emo: ['grief', 'sadness'] },
    { keys: ['failed', 'my fault', 'mistake', 'fault'], emo: ['guilt', 'shame', 'sadness'] },
    { keys: ['nobody understands', 'no one understands', 'understands me', 'understand me', 'wont talk', 'not talking'], emo: ['loneliness', 'frustration', 'sadness'] },
    { keys: ['cant sleep', 'worry', 'worrying', 'money', 'tension'], emo: ['anxiety', 'stress', 'fear'] },
    { keys: ['got the job', 'i won', 'passed the', 'achieved', 'so happy', 'khush'], emo: ['joy'] },
    { keys: ['akela', 'akeli', 'tanha', 'alone', 'lonely'], emo: ['loneliness', 'sadness'] },
    { keys: ['angry', 'gussa', 'furious', 'scream', 'rage'], emo: ['anger', 'frustration'] },
    { keys: ['scared', 'afraid', 'darr', 'surgery', 'frightened'], emo: ['fear', 'anxiety'] }
  ];
  function mirrorEmotion(text) {
    var hay = norm(text);
    var hits = {};
    EMOTION_MAP.forEach(function (row) {
      row.keys.forEach(function (k) {
        if (hay.indexOf(norm(k)) >= 0) row.emo.forEach(function (e) { hits[e] = (hits[e] || 0) + 1; });
      });
    });
    var emotions = Object.keys(hits).sort(function (a, b) { return hits[b] - hits[a]; });
    if (!emotions.length) emotions = ['mixed feelings'];
    return {
      possible: emotions,                       // "possible", never asserted
      reflection: 'It sounds like there might be some ' + emotions.slice(0, 2).join(' and ') + ' here. I hear you.',
      question: 'Would you like to explore what is behind this?',
      asserted: false
    };
  }

  // ════════ 3. COPING-SKILLS BY FEELING (cited corpus) ════════
  var COPING = {
    anxiety: ['box breathing (4-4-4-4)', '5-4-3-2-1 grounding', 'name the worry, then one small controllable step'],
    fear: ['physiological sigh', '5-4-3-2-1 grounding', 'separate what is in your control from what is not'],
    anger: ['urge surfing — ride it ~10 min', 'step away + physiological sigh', 'name the unmet need underneath'],
    frustration: ['name it to tame it', 'one small doable step', 'a short pause before responding'],
    sadness: ['behavioral activation — one small kind activity', 'reach one person you trust', 'self-compassion break'],
    grief: ['let it be — there is no timeline', 'a small daily anchor', 'talk to someone who will just listen'],
    loneliness: ['reach one person today', 'reframe: recall a recent small connection', 'a routine that includes people'],
    guilt: ['self-compassion: speak to yourself as to a friend', 'separate the action from your worth', 'one repair step if possible'],
    shame: ['self-compassion break', 'common humanity — you are not the only one', 'name it without judgement'],
    stress: ['box breathing', 'fewer choices, one step', 'protect sleep tonight'],
    joy: ['savour it — name what made it good', 'share it with someone (active-constructive)'],
    'mixed feelings': ['name what you feel (use the emotion picker)', 'one slow breath', 'one small next step']
  };
  function copingFor(feeling) {
    var f = norm(feeling);
    return { feeling: f, steps: COPING[f] || COPING['mixed feelings'], note: 'Small steps. Not a cure. If it is heavy, a professional can help.' };
  }

  // ════════ 4. IN-THE-MOMENT EXERCISES (voice-first) ════════
  function breathing(kind) {
    if (norm(kind) === 'box') {
      return { name: 'Box breathing', steps: ['breathe in — 4', 'hold — 4', 'breathe out — 4', 'hold — 4'], rounds: 4, claim: 'calming' };
    }
    return { name: 'Physiological sigh', steps: ['breathe in through the nose', 'a second small sip of air in', 'a long slow breath out'], rounds: 3, claim: 'calming' };
  }
  function grounding() {
    return { name: '5-4-3-2-1 grounding', steps: ['5 things you can see', '4 things you can feel', '3 things you can hear', '2 things you can smell', '1 thing you can taste'], claim: 'helps interrupt panic' };
  }

  // ════════ 5. PSYCHOEDUCATION CARDS ════════
  var PSYCHOED = {
    anger: 'Anger is often a signal of an unmet need or a crossed boundary. It is not "bad" — it is information. The skill is the pause between feeling it and acting.',
    anxiety: 'Anxiety is the body preparing for a threat — sometimes a real one, sometimes a "what if". Slow breathing tells the body it is safe enough to think.',
    grief: 'Grief has no fixed timeline and no correct order. Waves are normal, even months later. You are not doing it wrong.',
    sleep: 'Restless nights are common under stress. A steady wind-down, a worry-time earlier in the evening, and a consistent wake-time help more than trying harder to sleep.',
    burnout: 'Burnout is exhaustion + cynicism + feeling ineffective. It builds slowly; small recovery and boundaries matter more than one big break.'
  };
  function psychoEd(topic) {
    var t = norm(topic);
    return { topic: t, card: PSYCHOED[t] || 'Feelings are information, not commands. Naming them gently is the first step.', note: 'Education, not diagnosis.' };
  }

  // ════════ 6. COMMUNICATION — NVC composer + analysis ════════
  function nvcCompose(p) {
    p = p || {};
    var msg = 'When ' + (p.observation || 'this happened') + ', I felt ' + (p.feeling || 'unsettled') +
      ' because I need ' + (p.need || 'to be heard') + '. Would you be willing to ' + (p.request || 'talk about it') + '?';
    return { message: msg, frame: 'NVC: observation · feeling · need · request', note: 'A suggestion, not the only way.' };
  }
  function analyzeCommunication(text) {
    var hay = norm(text);
    var aggressive = /\b(always|never|stupid|idiot|shut up|your fault|hate you)\b/.test(hay);
    var empathic = /\b(i understand|i hear|i feel|sorry|thank you)\b/.test(hay);
    return {
      clarity: hay.length < 280 ? 'clear enough' : 'could be shorter',
      empathy: empathic ? 'present' : 'could add warmth',
      aggression: aggressive ? 'some sharp words' : 'low',
      confidence: /\b(i think|maybe|sorry to bother)\b/.test(hay) ? 'a little tentative' : 'steady',
      rewriteHint: aggressive ? 'Try an "I" statement instead of "you always…"' : 'This reads kindly.',
      note: 'A gentle reflection, never a grade of you as a person.'
    };
  }

  // ════════ 7. RELATIONSHIP + PARENTING ════════
  function relationshipCoach(input) {
    input = input || {};
    return {
      reflect: 'It sounds like this matters to you and you are not feeling heard.',
      likelyNeed: input.need || 'to feel understood and respected',
      suggestion: 'I want to understand your perspective — can we talk when we are both calm?',
      repairPhrase: 'I think I reacted strongly. Can we try again?',
      note: 'Coaching, not couples therapy. Joint-family decisions belong to the family.'
    };
  }
  function parentingGuide(age, behaviour) {
    var a = parseInt(age, 10) || 0;
    var band = a <= 5 ? 'toddler' : a <= 12 ? 'child' : 'teenager';
    var byBand = {
      toddler: 'Toddlers test limits to learn safety. Calm, consistent, short responses work better than long explanations.',
      child: 'Children respond to connection before correction. Name the feeling, then the boundary.',
      teenager: 'Teens need autonomy + to feel respected. Curiosity ("help me understand") opens more than commands.'
    };
    return {
      ageBand: band,
      possibleReasons: ['stress', 'tiredness', 'a need for autonomy or attention'],
      guidance: byBand[band],
      conversation: 'I noticed something is up. I am on your side — want to tell me what is going on?',
      note: 'I never label your child. These are possibilities, not a diagnosis.'
    };
  }

  // ════════ 8. GOALS — WOOP + implementation intentions ════════
  function woop(p) {
    p = p || {};
    return { wish: p.wish || '', outcome: p.outcome || '', obstacle: p.obstacle || '', plan: p.plan || ('if ' + (p.obstacle || 'X') + ', then I will ' + (p.action || 'Y')) };
  }
  function ifThen(p) { p = p || {}; return { plan: 'If ' + (p.situation || 'X') + ', then I will ' + (p.action || 'Y') + '.' }; }

  // ════════ 9. HELPLINES (maintained config, in-language) ════════
  var HELPLINES = [
    { name: 'Tele-MANAS', number: '14416', alt: '1-800-891-4416', hours: '24x7', note: 'Govt of India / NIMHANS · 20 languages · free' },
    { name: 'KIRAN', number: '1800-599-0019', hours: '24x7', note: '13 languages' },
    { name: 'Vandrevala Foundation', number: '+91 99996 66555', hours: '24x7', note: 'phone + WhatsApp · 11 vernacular langs' },
    { name: 'iCall (TISS)', number: '+91 91529 87821', hours: 'Mon-Sat 10:00-20:00', note: 'phone + email' },
    { name: 'AASRA', number: '+91 98204 66726', hours: '24x7', note: 'suicide prevention' },
    { name: 'Childline', number: '1098', hours: '24x7', note: 'children' },
    { name: 'Women Helpline', number: '181', hours: '24x7', note: 'women in distress' }
  ];
  function helplines() { return HELPLINES.slice(); }

  // ════════ 10. ACCESSIBILITY CONTRACT ════════
  // Every feature must support every user mode. Returns capability flags.
  function a11ySupport(feature) {
    return { feature: norm(feature), voice: true, symbol: true, isl: true, tap: true, slow: true };
  }

  // ════════ 11. DISCLOSURE + ORCHESTRATOR ════════
  var DISCLOSURE = "I'm Chitti, an AI friend who listens — not a doctor, not a therapist.";
  var CRISIS_DISCLAIMER = 'This is AI support. For anything serious please talk to a doctor or counsellor. Tele-MANAS 14416 is free, 24x7, in your language.';

  function respond(text, ctx) {
    ctx = ctx || {};
    var crisis = detectCrisis(text, ctx.history);
    if (crisis.level === 3) {
      return {
        type: 'crisis',
        acknowledge: crisis.message,
        stay: 'I can stay with you. Would you like me to help you call someone now?',
        helplines: crisis.helplines,
        disclosure: DISCLOSURE,
        disclaimer: CRISIS_DISCLAIMER,
        diagnosed: false, autoDial: false
      };
    }
    var mirror = mirrorEmotion(text);
    var primary = mirror.possible[0];
    var resp = {
      type: 'support',
      mirror: mirror,
      coping: copingFor(primary),
      disclosure: DISCLOSURE,
      diagnosed: false
    };
    if (crisis.level >= 1) resp.helplineStrip = helplines();   // soft offer, anti-nag handled in UI
    return resp;
  }

  // ── BO3 — Stress pattern (7-day mood trend) + SOP-05 gentle escalation ──
  var TREND_DISCLAIMER = 'A mood trend is information, not a diagnosis. It does not measure any illness.';
  var TREND_NOTE = {
    improving: 'Your mood looks a little brighter than earlier this week. Small steps count.',
    declining: 'Your mood looks lower than earlier this week. Be gentle with yourself.',
    steady: 'Your mood looks fairly steady this week.'
  };
  // logs: [{date, score}] where score 1 (very low) … 5 (very good). Uses the last 7.
  function moodTrend(logs) {
    var clean = (logs || []).filter(function (e) { return e && typeof e.score === 'number'; });
    var recent = clean.slice(-7);
    var n = recent.length;
    if (n === 0) {
      return { count: 0, ready: false, note: 'Log your mood for a few days and Chitti will gently show the trend.', disclaimer: TREND_DISCLAIMER, escalate: false, diagnosed: false };
    }
    var sum = 0, i;
    for (i = 0; i < n; i++) sum += recent[i].score;
    var avg = sum / n;
    var direction = 'steady';
    if (n >= 2) {
      var splitAt = Math.ceil(n / 2), fs = 0, fc = 0, ss = 0, sc = 0;
      for (i = 0; i < n; i++) { if (i < splitAt) { fs += recent[i].score; fc++; } else { ss += recent[i].score; sc++; } }
      var firstAvg = fs / fc, secondAvg = ss / sc;
      if (secondAvg - firstAvg >= 0.3) direction = 'improving';
      else if (firstAvg - secondAvg >= 0.3) direction = 'declining';
    }
    var low = 0;                          // consecutive low days (score <= 2) ending today
    for (i = recent.length - 1; i >= 0; i--) { if (recent[i].score <= 2) low++; else break; }
    var escalate = low >= 3;              // SOP 05: 3 consecutive sad days → gentle offer
    var res = {
      count: n, ready: true, average: Math.round(avg * 10) / 10, direction: direction,
      lowStreak: low, escalate: escalate, note: TREND_NOTE[direction], disclaimer: TREND_DISCLAIMER, diagnosed: false
    };
    if (escalate) {
      res.gentleOffer = 'You’ve had a few heavy days in a row. Would you like to talk to a trained person? It can help.';
      res.helplines = helplines();
    }
    return res;
  }

  // ── BO4 — CBT thought reframing (name the distortion → 3 balanced perspectives) ──
  var DISTORTIONS = [
    { key: 'all_or_nothing', re: /\b(always|never|everything|nothing|completely|totally|no one|everyone)\b/i, label: 'All-or-nothing thinking', reframe: 'Life is rarely all-or-nothing — where is the middle ground here?' },
    { key: 'catastrophizing', re: /\b(disaster|ruined|terrible|worst|unbearable|never recover|end of (my|the)|can.?t survive)\b/i, label: 'Catastrophising', reframe: 'What is the most likely outcome — not the worst one?' },
    { key: 'mind_reading', re: /\b(they think|everyone thinks|he thinks|she thinks|they hate|nobody likes|people think|they.?ll judge)\b/i, label: 'Mind-reading', reframe: 'I can’t truly know what others think unless I ask them.' },
    { key: 'labeling', re: /\b(i.?m|i am)\s+(a\s+)?(failure|loser|stupid|worthless|idiot|useless|hopeless)\b/i, label: 'Labelling', reframe: 'I did something I’m unhappy with — that’s different from being a label.' },
    { key: 'should', re: /\b(should|must|have to|ought to|supposed to)\b/i, label: '“Should” statements', reframe: 'Could “I would prefer to” fit better than “I must”?' },
    { key: 'personalization', re: /\b(my fault|because of me|i ruined|i caused|i.?m to blame)\b/i, label: 'Personalisation', reframe: 'Many things shape an outcome — not just me.' },
    { key: 'fortune_telling', re: /\b(will fail|won.?t work|going to fail|never going to|no point|pointless|hopeless)\b/i, label: 'Fortune-telling', reframe: 'I can’t predict the future with certainty.' }
  ];
  function cbtReframe(thought) {
    var t = String(thought || '').trim();
    var found = [];
    for (var i = 0; i < DISTORTIONS.length; i++) {
      if (DISTORTIONS[i].re.test(t)) found.push({ key: DISTORTIONS[i].key, label: DISTORTIONS[i].label, reframe: DISTORTIONS[i].reframe });
    }
    found = found.slice(0, 3);
    var perspectives = [];
    for (var j = 0; j < found.length; j++) perspectives.push(found[j].reframe);
    var universal = [
      'A thought is not a fact — this is one interpretation, not the only one.',
      'What would I say to a good friend who had this exact thought?',
      'What evidence supports this thought, and what evidence does not?'
    ];
    for (var u = 0; u < universal.length && perspectives.length < 3; u++) {
      if (perspectives.indexOf(universal[u]) === -1) perspectives.push(universal[u]);
    }
    return {
      thought: t,
      distortions: found,
      perspectives: perspectives.slice(0, 3),
      question: 'Aur kya ho sakta hai? — What else could be true here?',
      note: 'A thought is not a fact. This is a gentle exercise, not therapy.',
      disclaimer: DISCLOSURE,
      diagnosed: false
    };
  }

  // ── self-check used by tests: assert an output object never violates the boundary ──
  var BANNED = [
    /you have (depression|anxiety disorder|bipolar|ptsd|a disorder|adhd|schizophrenia)/i,
    /you don.?t need help/i, /you do not need help/i,
    /take \d+\s?mg/i, /increase your dose/i, /\bprescrib/i,
    /\bi feel (sad|happy|your pain|the same)\b/i,
    /it will all be okay/i, /i guarantee/i, /this will (cure|fix) (you|your)/i
  ];
  function violatesBoundary(obj) {
    var s = JSON.stringify(obj || {}).toLowerCase();
    return BANNED.some(function (re) { return re.test(s); });
  }

  return {
    norm: norm,
    detectCrisis: detectCrisis,
    mirrorEmotion: mirrorEmotion,
    copingFor: copingFor,
    breathing: breathing,
    grounding: grounding,
    psychoEd: psychoEd,
    nvcCompose: nvcCompose,
    analyzeCommunication: analyzeCommunication,
    relationshipCoach: relationshipCoach,
    parentingGuide: parentingGuide,
    woop: woop,
    ifThen: ifThen,
    moodTrend: moodTrend,
    cbtReframe: cbtReframe,
    helplines: helplines,
    a11ySupport: a11ySupport,
    respond: respond,
    violatesBoundary: violatesBoundary,
    DISCLOSURE: DISCLOSURE,
    CRISIS_DISCLAIMER: CRISIS_DISCLAIMER,
    _lexicon: { crisis: CRISIS_PHRASES, distress: DISTRESS_WORDS }
  };
});
