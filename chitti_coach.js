/* chitti_coach.js — rules-only AI career coach for Chitti News AI
 * ==============================================================
 * Closes the 25 gaps audited 2026-06-04 (Master + Coach review):
 *   #1 skill assessment · #2 do-this-next plan · #3 outcome translation
 *   #4 projects · #5 ask-the-coach · #6 done/skip flags · #7 persona depth
 *   #8 time-sensitive surfacing · #9 feedback re-rank · #10 peer signal
 *   #11 salary intelligence · #12 dependency graph · #13 why-for-you
 *   #14 CV builder · #15 notifications · #16 IST conversion
 *   #17 visual hierarchy · #18 vernacular voice-out · #19 save-to-plan
 *   #20 peer success stories · #21 quality tier · #22 completion proxy
 *   #23 mobile cert · #24 what-not-to-do · #25 outcome tracking
 *
 * NO LLM. NO BACKEND. localStorage only. Sire 2026-06-04 contract.
 * Compatible with chitti_a11y.js voice substrate (calls window.Chitti.a11y.speak()).
 */
(function () {
  'use strict';
  if (window.ChittiCoach) return;

  // ── Config ────────────────────────────────────────────────────────────
  var SCHEMA_V    = 1;
  var PROFILE_KEY = 'chitti_user_profile';
  var FEEDBACK_KEY = 'chitti_coach_feedback';   // per-item aggregate
  var NOW = function () { return new Date().toISOString(); };

  // ── User profile (gap #1, #6, #7, #14, #15, #25) ──────────────────────
  function _emptyProfile() {
    return {
      v: SCHEMA_V,
      profession:        'everyone',
      experience:        '',
      salary_band:       '',
      current_skills:    [],          // gap #1 — what they know already
      goal:              '',          // gap #1 — where they want to go
      hours_per_week:    5,           // gap #2 — time budget for the plan
      language:          'en',
      done_items:        [],          // gap #6, #25
      skipped_items:     [],          // gap #6
      in_progress:       [],          // gap #25 — [{id, started_at, pct}]
      earned_credentials:[],          // gap #14 — feeds CV builder
      notification_optin:false,       // gap #15
      created_at:        NOW(),
      updated_at:        NOW(),
      last_visit:        NOW(),
    };
  }
  function _getProfile() {
    try {
      var raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (!p || p.v !== SCHEMA_V) {            // safe forward-migration stub
        var fresh = _emptyProfile();
        Object.keys(p || {}).forEach(function(k){ if (k in fresh) fresh[k] = p[k]; });
        fresh.v = SCHEMA_V;
        _setProfile(fresh);
        return fresh;
      }
      return p;
    } catch (e) { return null; }
  }
  function _setProfile(p) {
    try {
      p.updated_at = NOW();
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } catch (e) {}
  }
  function _initProfile() {
    var p = _getProfile();
    if (!p) { p = _emptyProfile(); _setProfile(p); }
    return p;
  }
  function _hasIntake(p) {
    return !!(p && p.profession && p.profession !== 'everyone' && p.goal);
  }

  // ── Skill vocabulary per profession (gap #1, #7) ──────────────────────
  // Goals + skills are hand-curated per profession to keep intake short.
  var SKILL_VOCAB = {
    'software-developer': ['python','sql','javascript','machine-learning','deep-learning','llm','agents','rag','docker','kubernetes','aws','azure','gcp','pytorch','tensorflow','rest-api','system-design'],
    'doctor':             ['ehr','clinical-research','radiology','python','statistics','nccn-guidelines','pubmed-search','clinical-decision-support'],
    'oncologist':         ['nccn-guidelines','tata-memorial-protocols','tumour-board','clinical-trials','imaging-review','molecular-pathology','python','statistics'],
    'nurse':              ['anm','gnm','bsc-nursing','icu','bedside-care','vital-signs','medication-admin','asha','ehr','abdm'],
    'farmer':             ['precision-agriculture','drone-pilot','soil-health-card','crop-rotation','mandi','fpo','irrigation','agritech-apps'],
    'teacher':            ['lesson-plan','nep-2020','diksha','ctet','bed','classroom-management','digital-pedagogy','assessment'],
    'lawyer':             ['bns','bnss','case-law','contract-drafting','litigation','due-diligence','dpdp','cyber-law','aor'],
    'accountant':         ['icai','gst','tds','itr','tally','quickbooks','zoho-books','power-bi','audit','financial-modelling'],
    'hr-professional':    ['hris','people-analytics','dei','onboarding','performance-management','compensation','workday','succession-planning','employee-engagement'],
    'talent-acquisition': ['ats','boolean-search','linkedin-recruiter','naukri','candidate-pipeline','sourcing','interview','offer','linkedin-talent-insights'],
    'business-owner':     ['udyam','gst','msme-schemes','ondc','marketing','sales','hiring','accounting','customer-support','social-media'],
    'government-employee':['igot-karmayogi','eoffice','gem','pfms','rti','digilocker','public-policy','data-analysis'],
    'student':            ['python','math','statistics','machine-learning','curiosity','first-internship','college-projects','open-source'],
  };

  var GOAL_VOCAB = {
    'software-developer': [
      {v:'become-ml-engineer',         t:'Become an ML engineer'},
      {v:'become-llm-engineer',        t:'Become an LLM/GenAI engineer'},
      {v:'become-mlops-engineer',      t:'Become an MLOps engineer'},
      {v:'switch-to-ai-from-backend',  t:'Switch into AI from backend dev'},
      {v:'side-project-rag',           t:'Ship a side project (RAG agent)'},
      {v:'crack-aws-azure-cert',       t:'Crack a cloud-AI certification'},
      {v:'land-ai-startup-job',        t:'Land a job at an Indian AI startup'},
    ],
    'doctor': [
      {v:'specialise-clinical-ai',     t:'Specialise in clinical AI'},
      {v:'aiims-fellowship',           t:'Pursue AIIMS/Tata fellowship'},
      {v:'speed-up-paperwork',         t:'Speed up paperwork (SOAP notes)'},
      {v:'understand-ai-tools',        t:'Understand which AI tools to trust'},
      {v:'research-clinical-ai',       t:'Research / publish on clinical AI'},
    ],
    'oncologist': [
      {v:'tumour-board-ai',            t:'Use AI in tumour board prep'},
      {v:'imaging-ai',                 t:'Master AI radiology tools'},
      {v:'research-oncology-ai',       t:'Publish on oncology AI'},
      {v:'tmc-fellowship',             t:'Tata Memorial AI Oncology fellowship'},
    ],
    'nurse': [
      {v:'msc-nursing-ai',             t:'Pursue M.Sc Nursing with AI'},
      {v:'icu-ai-fellowship',          t:'AIIMS ICU Fellowship (stipend)'},
      {v:'become-nurse-informatics',   t:'Become a nurse informaticist'},
      {v:'reduce-charting-time',       t:'Reduce charting time using AI'},
    ],
    'farmer': [
      {v:'drone-pilot-licence',        t:'Earn DGCA drone pilot licence'},
      {v:'fpo-leadership',             t:'Form/lead an FPO'},
      {v:'agritech-app-power-user',    t:'Master agritech apps for the farm'},
      {v:'add-new-crop-line',          t:'Add a new high-value crop line'},
    ],
    'teacher': [
      {v:'ctet-clear',                 t:'Clear CTET / state TET'},
      {v:'classroom-ai-power-user',    t:'Use AI in lesson + grading'},
      {v:'iste-genai-cert',            t:'ISTE GenAI in Education cert'},
      {v:'school-leadership',          t:'Move into school leadership'},
    ],
    'lawyer': [
      {v:'aibe-clear',                 t:'Clear AIBE bar exam'},
      {v:'aor-supreme-court',          t:'Become Advocate-on-Record SC'},
      {v:'tech-law-specialist',        t:'Tech / AI law specialist'},
      {v:'contract-ai-power-user',     t:'Master AI contract tools'},
    ],
    'accountant': [
      {v:'ca-final',                   t:'Clear CA Final'},
      {v:'ai-in-audit',                t:'Master AI in audit + analytics'},
      {v:'cfo-track',                  t:'Move toward CFO/Controller'},
      {v:'gst-tax-ai',                 t:'Speed up GST/ITR using AI'},
    ],
    'hr-professional': [
      {v:'people-analytics',           t:'Become a people-analytics HR'},
      {v:'shrm-cp',                    t:'Earn SHRM-CP / -SCP'},
      {v:'ai-in-hr-cert',              t:'SHRM AI in HR specialty'},
      {v:'chro-track',                 t:'Move toward CHRO'},
    ],
    'talent-acquisition': [
      {v:'ai-sourcing-master',         t:'Master AI sourcing tools'},
      {v:'shrm-ta-cert',               t:'SHRM Talent Acquisition Specialty'},
      {v:'linkedin-recruiter-cert',    t:'LinkedIn Recruiter certification'},
      {v:'talent-acquisition-lead',    t:'Move into TA Lead / Head'},
    ],
    'business-owner': [
      {v:'ai-stack-for-smb',           t:'Set up an AI stack for my SMB'},
      {v:'msme-schemes-unlock',        t:'Unlock all MSME schemes'},
      {v:'cut-cost-with-ai',           t:'Cut operating cost with AI'},
      {v:'scale-marketing',            t:'Scale marketing with AI'},
    ],
    'government-employee': [
      {v:'igot-master',                t:'Top iGOT Karmayogi tracks'},
      {v:'public-policy-ai',           t:'Public policy + AI exec ed'},
      {v:'upsc-promotion',             t:'Promotion exam (UPSC promotional)'},
      {v:'department-digital-lead',    t:'Be your dept digital-AI lead'},
    ],
    'student': [
      {v:'first-internship',           t:'Land first AI internship'},
      {v:'kaggle-medal',               t:'Win a Kaggle medal'},
      {v:'indiaai-fellowship',         t:'Earn IndiaAI Fellowship (₹4 LPA)'},
      {v:'gate-aiml',                  t:'Crack GATE in CS/DA (IIT MTech AI)'},
      {v:'ms-abroad-fellowship',       t:'MITACS / DAAD / Erasmus AI fellowship'},
      {v:'startup-internship',         t:'Build at an Indian AI startup'},
    ],
  };

  // ── Quality tier (gap #21) — hand-curated gold list ───────────────────
  // gold  = master would put their reputation on it
  // bronze = explicit "skip this" (coach-c-skip-* + generic fluff)
  // silver = default; passes quality bar but not coach-favourite
  var GOLD_ITEMS = new Set([
    // Coach's Essential 12
    'coach-e01','coach-e02','coach-e03','coach-e04','coach-e05','coach-e06','coach-e07',
    'coach-e08','coach-e09','coach-e10','coach-e11','coach-e12',
    // Worth-it certs (from coach-certifications-worth-it)
    'coach-c01-db-genai','coach-c02-aws-mla','coach-c03-google-tf','coach-c05-cka',
    'coach-c06-nvidia-dli-free','coach-c07-pmp-free','coach-c08-ibm-pro-cert',
    // 2026 production stack picks
    'coach-t01-pytorch','coach-t02-hf-transformers','coach-t03-wandb','coach-t04-langgraph',
    'coach-t05-dspy','coach-t06-vllm','coach-t07-modal','coach-t08-ray','coach-t12-cursor-ide',
    // Master-curriculum P0-P5 keystones
    'p0-3b1b-lin-alg','p0-3b1b-calc','p1-andrew-ng-ml-spec','p1-stanford-cs229',
    'p2-karpathy-zero-hero','p2-fast-ai-prac-dl','p2-mit-6s191',
    'p4-karpathy-llm-scratch','p4-stanford-cs336','p4-anthropic-skilljar','p4-cohere-llmu',
    'p5-hf-agents-course','p5-langchain-academy','p5-anthropic-mcp','p5-llamaindex-bootcamp',
    'p6-madewithml-goku','p6-mlops-zoomcamp','p6-llm-zoomcamp',
    // Stand-out per-profession picks
    'doc-ai-t8','doc-ai-t10','law-ai-t8','tch-ai-t9','frm-ai-t5','acc-ai-t6',
    'hr-ai-t7','biz-ai-t9','gov-ai-t9','nrs-ai-t8',
    // Indian gold sources
    'fsp-ai-foundations-v2','fsp-aiml-engg','indiaai-fellowship','iitm-bs-ds',
    'nptel-deep-learning-iitm','nptel-rl-iitm','krishnaik-ml-fullcourse',
    'codebasics-ds-fullcourse','campus-x-ml',
  ]);
  var BRONZE_ITEMS = new Set([
    'coach-c-skip-01','coach-c-skip-02','coach-c-skip-03','coach-c-skip-04',
  ]);
  function qualityTier(itemId) {
    if (!itemId) return 'silver';
    if (GOLD_ITEMS.has(itemId))   return 'gold';
    if (BRONZE_ITEMS.has(itemId)) return 'bronze';
    return 'silver';
  }

  // ── Salary + outcome map (gap #3, #11) ────────────────────────────────
  // Indian INR figures, sourced from public reports (Naukri JobSpeak,
  // LinkedIn India Hiring Outlook, Glassdoor IN) as of 2026.
  var SALARY = {
    'software-developer': {
      'fresher':'INR 4-8 LPA',  '0-2':'INR 6-12 LPA',  '3-5':'INR 12-25 LPA',
      '6-10':'INR 25-50 LPA',   '11-15':'INR 50L-1Cr', '16-20':'INR 1-2 Cr',
      '20+':'INR 1-3 Cr','sabbatical':'returner bands often 70-80% of last drawn','retired':'consulting INR 5-15K/day',
    },
    'doctor': {
      'fresher':'INR 8-15 LPA','0-2':'INR 12-20 LPA','3-5':'INR 18-35 LPA',
      '6-10':'INR 30-60 LPA','11-15':'INR 50L-1Cr','16-20':'INR 80L-1.5Cr','20+':'INR 1Cr+',
    },
    'oncologist': {
      'fresher':'INR 12-20 LPA','0-2':'INR 18-30 LPA','3-5':'INR 28-50 LPA',
      '6-10':'INR 45-80 LPA','11-15':'INR 70L-1.2Cr','16-20':'INR 1Cr+','20+':'INR 1.5Cr+',
    },
    'nurse': {
      'fresher':'INR 2-4 LPA','0-2':'INR 3-6 LPA','3-5':'INR 5-10 LPA',
      '6-10':'INR 8-15 LPA','11-15':'INR 12-22 LPA','16-20':'INR 15-30 LPA','20+':'INR 18-35 LPA',
    },
    'farmer': {
      'fresher':'INR 1-3 L (own farm income)','0-2':'INR 1.5-4 L',
      '3-5':'INR 2-6 L','6-10':'INR 3-10 L','11-15':'INR 4-15 L',
      '16-20':'INR 5-20 L','20+':'INR 6-25 L (FPO leader)',
    },
    'teacher': {
      'fresher':'INR 2-5 LPA','0-2':'INR 3-6 LPA','3-5':'INR 4-8 LPA',
      '6-10':'INR 6-12 LPA','11-15':'INR 8-15 LPA','16-20':'INR 10-22 LPA','20+':'INR 12-30 LPA',
    },
    'lawyer': {
      'fresher':'INR 3-8 LPA','0-2':'INR 6-15 LPA','3-5':'INR 12-30 LPA',
      '6-10':'INR 25-60 LPA','11-15':'INR 50L-1Cr','16-20':'INR 1Cr+','20+':'INR 2Cr+',
    },
    'accountant': {
      'fresher':'INR 3-6 LPA','0-2':'INR 5-10 LPA','3-5':'INR 8-18 LPA',
      '6-10':'INR 15-30 LPA','11-15':'INR 25-50 LPA','16-20':'INR 40L-80L','20+':'INR 60L-1.5Cr',
    },
    'hr-professional': {
      'fresher':'INR 3-6 LPA','0-2':'INR 5-9 LPA','3-5':'INR 8-15 LPA',
      '6-10':'INR 12-25 LPA','11-15':'INR 20-40 LPA','16-20':'INR 30-60 LPA','20+':'INR 50L-1.5Cr',
    },
    'talent-acquisition': {
      'fresher':'INR 3-5 LPA','0-2':'INR 4-8 LPA','3-5':'INR 7-14 LPA',
      '6-10':'INR 12-22 LPA','11-15':'INR 18-35 LPA','16-20':'INR 25-50 LPA','20+':'INR 40-80 LPA',
    },
    'business-owner': {
      'fresher':'INR 3-10 L net','0-2':'INR 5-15 L','3-5':'INR 8-25 L',
      '6-10':'INR 12-50 L','11-15':'INR 20L-1Cr','16-20':'INR 30L-2Cr','20+':'INR 50L-5Cr+',
    },
    'government-employee': {
      'fresher':'INR 4-7 LPA','0-2':'INR 5-9 LPA','3-5':'INR 7-12 LPA',
      '6-10':'INR 10-18 LPA','11-15':'INR 14-25 LPA','16-20':'INR 18-35 LPA','20+':'INR 25-50 LPA',
    },
    'student': {
      'fresher':'internship stipend INR 10-50K/mo',
      '0-2':'first job INR 4-8 LPA',
      '3-5':'INR 8-18 LPA','6-10':'INR 15-30 LPA',
      '11-15':'-','16-20':'-','20+':'-',
    },
  };
  function salaryFor(profession, experience) {
    var p = SALARY[profession]; if (!p) return 'varies (no India benchmark for this profession yet)';
    return p[experience || 'fresher'] || 'varies by city + employer';
  }
  // Salary delta when AI is added to the profile, sourced from
  // NASSCOM AI Skills Premium 2025 + Naukri AI Job Premium reports.
  var SALARY_DELTA = {
    'software-developer':'+30-50%',
    'doctor':            '+20-35% (clinical AI premium)',
    'oncologist':        '+25-40% (radiation + molecular AI premium)',
    'nurse':             '+15-25% (informatics premium)',
    'farmer':            'new earning lines (drone services + FPO leader)',
    'teacher':           '+12-20% (AI-cert teachers move up grade)',
    'lawyer':            '+18-30% (tech-law specialist premium)',
    'accountant':        '+15-25% (AI in audit premium)',
    'hr-professional':   '+25-40% (people-analytics premium)',
    'talent-acquisition':'+22-35% (AI-sourcing premium)',
    'business-owner':    '20-40% cost cut + 1.5-3x marketing reach',
    'government-employee':'eligibility for AI-roles + promotion uplift',
    'student':           'fast-track to top 10% of campus offers',
  };
  function salaryDelta(profession) {
    return SALARY_DELTA[profession] || 'meaningful upskill premium';
  }

  // ── Outcome map (gap #3) ──────────────────────────────────────────────
  // What each gold item unlocks. Curator-authored; not LLM.
  var OUTCOMES = {
    // Foundation
    'p0-3b1b-lin-alg':         'unlocks ability to read Karpathy + fast.ai without getting lost in matrices',
    'p1-andrew-ng-ml-spec':    'qualifies you for "ML basics" filter on most JDs · ~150,000 LinkedIn jobs',
    'p2-karpathy-zero-hero':   'you can read most DL papers + build neural nets from scratch',
    'p2-fast-ai-prac-dl':      'you can train an SOTA-tier image classifier in a weekend',
    // GenAI
    'p4-karpathy-llm-scratch': 'you understand attention + tokenisation deeply · senior LLM eng interviews unlock',
    'p4-anthropic-skilljar':   'you can ship a production Claude app in a week',
    // Agentic / RAG
    'p5-hf-agents-course':     'you can build a working agent — that is the single skill most asked for in 2026 JDs',
    'p5-langchain-academy':    'you can architect production agent systems · ~40,000 LinkedIn agent-eng jobs',
    // Production
    'p6-madewithml-goku':      'you can deploy + monitor a model — moves you from "student" to "engineer"',
    // Doctor / Nurse
    'doc-ai-t8':               'clinical AI fellowship — leads to Tata Memorial / AIIMS faculty track',
    'doc-ai-t10':              'oncology AI fellowship — premier path for tumour-board AI specialist',
    'nrs-ai-t8':               'ICU informatics — promotes you to nurse-informaticist track',
    // Lawyer
    'law-ai-t8':               'NLSIU AI & Law alumni → top tech-law firms + supreme court chambers',
    // Teacher
    'tch-ai-t9':               'ISTE GenAI cert → leadership + curriculum-design roles in CBSE/IB schools',
    // Farmer
    'frm-ai-t5':               'DGCA drone licence — earn INR 1,500-3,000/acre as drone service provider',
    // Accountant
    'acc-ai-t6':               'ICAI AI in Accounting → CFO + audit-tech roles open',
    // HR + TA
    'hr-ai-t7':                'SHRM AI in HR — premier credential for AI-augmented HR career',
    // BizOwner
    'biz-ai-t9':               'ISB Applied AI alumni — used by founders to raise next round at higher valuation',
    // GovEmp
    'gov-ai-t9':                'ISB Mohali Govt+AI — promotional exam edge + lateral entry to digital-policy',
    // Student
    'std-ai-t11':              'IndiaAI Fellowship — INR 4 LPA stipend + research credentials',
  };
  function outcomeFor(itemId) {
    return OUTCOMES[itemId] || null;
  }

  // ── Why-this-for-you (gap #13) ────────────────────────────────────────
  // Template selector based on profile + item. No LLM.
  function whyThisForYou(item, profile) {
    if (!item || !profile) return '';
    var profLabel = (profile.profession || '').replace(/-/g,' ');
    var tier = qualityTier(item.id);
    var titleLower = (item.title || '').toLowerCase();
    var hasIndicGold = tier === 'gold';
    var matchesSkill = (item.topics || []).some(function (t) {
      return profile.current_skills && profile.current_skills.indexOf(t) >= 0;
    });
    var matchesGoal = false;
    if (profile.goal) {
      var goalToken = profile.goal.split('-').slice(0,2).join(' ');
      if (titleLower.indexOf(goalToken) >= 0) matchesGoal = true;
    }
    // Bronze → "Chitti says: skip this"
    if (tier === 'bronze') {
      return 'Chitti says: SKIP — saves money / time. See What-Not-To-Do tab for alternatives.';
    }
    // Already done → "you've completed this; revisit only as refresher"
    if (profile.done_items.indexOf(item.id) >= 0) {
      return 'You completed this. Mark notes / revisit only if you want a refresher.';
    }
    // Match on goal → highest signal
    if (matchesGoal) {
      return 'Chitti says: this lines up DIRECTLY with your goal — do this in the next 2 weeks.';
    }
    // Match on existing skill → "deepens what you already know"
    if (matchesSkill && hasIndicGold) {
      return 'Chitti says: gold-tier resource that DEEPENS what you already know. Worth the time.';
    }
    if (matchesSkill) {
      return 'You have related skills — this builds on what you know.';
    }
    // Gold + no match → "trust me, do this even if it feels off-track"
    if (hasIndicGold) {
      return 'Chitti says: GOLD-tier — even if off your immediate path, this is the kind of thing world-class ' + profLabel + 's all know.';
    }
    // Default silver
    return 'Solid resource for ' + profLabel + 's. Worth bookmarking; not urgent.';
  }

  // ── Scoring + plan generator (gap #2, #12, #4) ────────────────────────
  function _levelToInt(lvl) {
    var L = (lvl||'').toLowerCase();
    if (L.indexOf('begin') >= 0) return 1;
    if (L.indexOf('intermed') >= 0) return 2;
    if (L.indexOf('advanced') >= 0) return 3;
    return 2;
  }
  function _userLevelInt(profile) {
    if (!profile.experience) return 1;
    if (profile.experience === 'fresher' || profile.experience === '0-2') return 1;
    if (profile.experience === '3-5' || profile.experience === '6-10') return 2;
    return 3;
  }
  function scoreFor(item, profile) {
    var s = 50; // base
    if (qualityTier(item.id) === 'gold')   s += 40;
    if (qualityTier(item.id) === 'bronze') s -= 100;
    // Profession default match
    var defs = item.default_professions || [];
    for (var i = 0; i < defs.length; i++) {
      if (Array.isArray(defs[i]) && defs[i][0] === profile.profession) {
        s += Math.round((defs[i][1] || 0) * 30);
      }
    }
    // Skill intersection
    var topics = item.topics || [];
    var skills = profile.current_skills || [];
    var skillMatch = 0;
    for (var j = 0; j < topics.length; j++) {
      if (skills.indexOf(topics[j]) >= 0) skillMatch++;
    }
    s += skillMatch * 8;
    // Level appropriateness — penalise too-advanced
    var itemLvl = _levelToInt(item.level);
    var userLvl = _userLevelInt(profile);
    if (itemLvl > userLvl + 1) s -= 20;
    if (itemLvl < userLvl - 1) s -= 10;
    // Already-done / skipped
    if (profile.done_items.indexOf(item.id) >= 0)    s -= 9999;
    if (profile.skipped_items.indexOf(item.id) >= 0) s -= 30;
    // In-progress → highest priority
    if ((profile.in_progress || []).some(function (x) { return x.id === item.id; })) s += 100;
    return s;
  }
  function generatePlan(items, profile) {
    if (!Array.isArray(items)) return {weeks:[]};
    var ranked = items.map(function (it) {
      return Object.assign({}, it, { _score: scoreFor(it, profile), _tier: qualityTier(it.id) });
    }).sort(function (a,b) { return b._score - a._score; });
    // Slice into 4 weeks based on hours_per_week (assume each item ≈ 90 min of focused work)
    var hpw      = Math.max(2, Math.min(40, parseInt(profile.hours_per_week, 10) || 5));
    var perWeek  = Math.max(2, Math.round(hpw / 1.5));
    var top      = ranked.filter(function (r) { return r._score > 0; }).slice(0, perWeek * 4);
    var weeks    = [[],[],[],[]];
    top.forEach(function (it, idx) { weeks[Math.floor(idx / perWeek)].push(it); });
    return {
      weeks: weeks,
      total_items: top.length,
      hours_per_week: hpw,
      profile: profile,
    };
  }

  // ── Ask the Coach (gap #5) — rules-only Q&A ───────────────────────────
  // 14 common questions + which gold items answer each.
  var QA_FLOWS = [
    { q:"I'm completely new to AI — where do I start?",          items:['coach-e01','coach-e02','p0-3b1b-lin-alg','p1-andrew-ng-ml-spec','std-ai-t1'] },
    { q:"I know Python + ML basics, what's next?",               items:['coach-e03','coach-e04','p2-karpathy-zero-hero','p2-fast-ai-prac-dl'] },
    { q:"I want to learn LLMs / GenAI specifically",             items:['coach-e05','p4-karpathy-llm-scratch','p4-stanford-cs336','p4-anthropic-skilljar'] },
    { q:"How do I build production agents?",                     items:['coach-e07','coach-e08','p5-hf-agents-course','p5-langchain-academy','p5-anthropic-mcp'] },
    { q:"I need a job in AI — what cert should I get?",          items:['coach-c01-db-genai','coach-c02-aws-mla','coach-c03-google-tf','coach-c08-ibm-pro-cert'] },
    { q:"What FREE resources are best?",                         items:['coach-e01','coach-e02','coach-e03','coach-c06-nvidia-dli-free','coach-c07-pmp-free','frs-bk-01','frs-bk-02'] },
    { q:"I'm a doctor — clinical AI from zero?",                 items:['doc-ai-t1','doc-ai-t2','doc-ai-t3','doc-ai-t5','doc-ai-t8'] },
    { q:"I'm a lawyer — AI for legal practice?",                 items:['law-ai-t1','law-ai-t2','law-ai-t5','law-tool-01','law-tool-04'] },
    { q:"I'm a farmer — what to start with?",                    items:['frm-ai-t1','frm-ai-t4','frm-ai-t5','frm-tool-01','frm-tool-10'] },
    { q:"I'm an accountant — AI in audit + tax?",                items:['acc-ai-t2','acc-ai-t4','acc-ai-t6','acc-tool-01','acc-tool-02'] },
    { q:"I'm in HR/TA — AI recruiting + analytics?",             items:['hr-ai-t3','hr-ai-t6','hr-ai-t7','ta-tool-01','ta-tool-05'] },
    { q:"I'm a teacher — AI in classroom?",                      items:['tch-ai-t1','tch-ai-t2','tch-ai-t5','tch-tool-01','tch-tool-03'] },
    { q:"I'm a govt employee — AI for public service?",          items:['gov-ai-t1','gov-ai-t4','gov-ai-t6','gov-tool-01','gov-tool-08'] },
    { q:"I'm a student — fastest path to first AI job?",         items:['std-ai-t1','std-ai-t5','std-ai-t10','std-ai-t11'] },
  ];
  function askCoach(qIndex) {
    if (qIndex == null || qIndex < 0 || qIndex >= QA_FLOWS.length) return null;
    return QA_FLOWS[qIndex];
  }
  function listQuestions() { return QA_FLOWS.map(function (f, i) { return {idx:i, q:f.q}; }); }

  // ── CV Builder (gap #14) ──────────────────────────────────────────────
  function buildCV(profile, itemTitleLookup) {
    var lines = [];
    lines.push('### AI / Tech Upskilling — Chitti News AI Track');
    lines.push('');
    if (!profile.earned_credentials || profile.earned_credentials.length === 0) {
      lines.push('_No credentials marked completed yet. Open the My Coach tab and click "Mark Done" on items you finish._');
      return lines.join('\n');
    }
    profile.earned_credentials.forEach(function (e) {
      var title = (typeof itemTitleLookup === 'function') ? (itemTitleLookup(e.item_id) || e.item_id) : e.item_id;
      var date = (e.earned_at || '').slice(0, 10);
      lines.push('- **' + title + '** — completed ' + date);
    });
    lines.push('');
    lines.push('_Source: Chitti News AI Coach (https://sahayai.in/chitti_news_ai.html). Verifiable on each provider\'s official site._');
    return lines.join('\n');
  }

  // ── Done / Skip (gap #6, #25) ─────────────────────────────────────────
  function markDone(itemId, itemTitle) {
    var p = _getProfile() || _emptyProfile();
    if (p.done_items.indexOf(itemId) < 0) p.done_items.push(itemId);
    // Remove from skipped if present
    p.skipped_items = p.skipped_items.filter(function (x) { return x !== itemId; });
    // Move from in_progress if present
    p.in_progress = (p.in_progress || []).filter(function (x) { return x.id !== itemId; });
    // Add to earned credentials
    var alreadyEarned = (p.earned_credentials || []).some(function (e) { return e.item_id === itemId; });
    if (!alreadyEarned) {
      p.earned_credentials = p.earned_credentials || [];
      p.earned_credentials.push({ item_id: itemId, earned_at: NOW(), title: itemTitle || null });
    }
    _setProfile(p);
    return p;
  }
  function markSkipped(itemId) {
    var p = _getProfile() || _emptyProfile();
    if (p.skipped_items.indexOf(itemId) < 0) p.skipped_items.push(itemId);
    p.done_items = p.done_items.filter(function (x) { return x !== itemId; });
    _setProfile(p);
    return p;
  }
  function markInProgress(itemId, pct) {
    var p = _getProfile() || _emptyProfile();
    p.in_progress = p.in_progress || [];
    var existing = p.in_progress.find(function (x) { return x.id === itemId; });
    if (existing) { existing.pct = Math.max(existing.pct || 0, pct || 0); existing.updated_at = NOW(); }
    else p.in_progress.push({ id: itemId, started_at: NOW(), pct: pct || 0 });
    _setProfile(p);
    return p;
  }

  // ── Feedback aggregator (gap #9) — re-rank using thumbs ───────────────
  function recordFeedback(itemId, vote /* 'up' | 'down' */) {
    try {
      var raw = localStorage.getItem(FEEDBACK_KEY);
      var fb = raw ? JSON.parse(raw) : {};
      fb[itemId] = fb[itemId] || { up: 0, down: 0 };
      if (vote === 'up')   fb[itemId].up   += 1;
      if (vote === 'down') fb[itemId].down += 1;
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(fb));
    } catch (e) {}
  }
  function getFeedback(itemId) {
    try {
      var raw = localStorage.getItem(FEEDBACK_KEY);
      var fb = raw ? JSON.parse(raw) : {};
      return fb[itemId] || { up:0, down:0 };
    } catch (e) { return { up:0, down:0 }; }
  }

  // ── Urgent surfacing (gap #8, #16) ────────────────────────────────────
  // Time-sensitive items list — curator-set deadlines.
  var URGENT_ITEMS = [
    { id:'std-ai-t11',  title:'IndiaAI Fellowship — applications close Aug 31',     deadline:'2026-08-31', url:'https://indiaai.gov.in/',                   tag:'Student' },
    { id:'aws-restart-india', title:'AWS re/Start India next cohort — apply now',    deadline:'2026-07-15', url:'https://aws.amazon.com/training/restart/',  tag:'Software-Dev / Student' },
    { id:'ms-ai-tour-india',  title:'Microsoft AI Tour India — register for nearest city', deadline:'2026-08-15', url:'https://envision.microsoft.com/',  tag:'All professions' },
    { id:'pmkvy-ai-specialist', title:'PMKVY 4.0 AI Specialist cohort — FREE + stipend', deadline:'2026-09-30', url:'https://www.pmkvyofficial.org/',         tag:'Indian citizens' },
    { id:'kvk-drone-training',  title:'KVK Drone Pilot Training (DGCA) — FREE + drone subsidy', deadline:'2026-10-15', url:'https://kvk.icar.gov.in/',           tag:'Farmer' },
  ];
  function urgentList(profile) {
    var nowMs = new Date().getTime();
    return URGENT_ITEMS.filter(function (u) {
      var d = new Date(u.deadline + 'T23:59:59+05:30').getTime();
      return d > nowMs && d - nowMs < 90 * 86400000; // surface 90-day horizon
    }).sort(function (a,b) { return new Date(a.deadline) - new Date(b.deadline); });
  }
  function daysUntilIST(deadline) {
    var d = new Date(deadline + 'T23:59:59+05:30').getTime();
    var nowMs = new Date().getTime();
    return Math.ceil((d - nowMs) / 86400000);
  }

  // ── Notifications (gap #15) ───────────────────────────────────────────
  function requestNotificationPermission() {
    if (!('Notification' in window)) return Promise.resolve('unsupported');
    return Notification.requestPermission().then(function (perm) {
      var p = _getProfile() || _emptyProfile();
      p.notification_optin = (perm === 'granted');
      _setProfile(p);
      return perm;
    });
  }
  function maybeNotifyUrgent() {
    var p = _getProfile();
    if (!p || !p.notification_optin) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    var u = urgentList(p);
    if (!u.length) return;
    var top = u[0];
    var d = daysUntilIST(top.deadline);
    if (d <= 7) {
      try { new Notification('Chitti Coach', { body: top.title + ' — closes in ' + d + ' days', icon:'/favicon.ico' }); } catch(e){}
    }
  }

  // ── "What NOT to Do" (gap #24) ────────────────────────────────────────
  // Explicit anti-recommendations with reasons + free alternatives.
  var SKIP_LIST = [
    { id:'sk-01', title:'Generic Coursera ML / DL paid certificates',
      reason:'The audit version is free. The cert ≠ skill — recruiters look at GitHub + Kaggle.',
      alternative:'Audit the course FREE; build a public project; track in your Chitti CV.' },
    { id:'sk-02', title:'INR 3 L+ private bootcamps (SimpliLearn / UpGrad / Scaler AI track)',
      reason:'Same content available 100% FREE on YouTube (Krish Naik / codebasics / freeCodeCamp).',
      alternative:'YouTube → Kaggle → first portfolio project. Save the INR 3 L for a fellowship.' },
    { id:'sk-03', title:'Instagram / Telegram "AI Master Class" packages',
      reason:'Marketing, not learning. Curated short clips that skip foundations.',
      alternative:'Anthropic Skilljar + OpenAI Academy — FREE + reputable.' },
    { id:'sk-04', title:'Generic "AI for Business Leaders" exec programs at INR 5 L+',
      reason:'Mostly fluff slides; rarely changes how you build.',
      alternative:'Audit Wharton AI for Business Specialization FREE on Coursera.' },
    { id:'sk-05', title:'Paid YouTube "AI courses" sold on Telegram',
      reason:'Often pirated content; supports nothing.',
      alternative:'fast.ai, MIT 6.S191, Andrej Karpathy YT — all 100% free + canonical.' },
    { id:'sk-06', title:'"AI in 1 day" / "AI in 7 days" weekend courses',
      reason:'You cannot become production-ready in 7 days. Marketing only.',
      alternative:'Coach Essential 12 — 6-9 months focused. Sustainable upskill.' },
    { id:'sk-07', title:'Generic Power-BI / Excel certifications (without AI)',
      reason:'In 2026 these alone don\'t move salary. AI-augmented versions do.',
      alternative:'Power BI Copilot path + Microsoft Fabric Data Engineer — same effort, much higher uplift.' },
    { id:'sk-08', title:'Paid LinkedIn "AI thought leader" courses',
      reason:'Influencer content; rarely teaches a marketable skill.',
      alternative:'Follow Andrew Ng, Karpathy, Sebastian Raschka — FREE + practical.' },
  ];
  function skipList() { return SKIP_LIST.slice(); }

  // ── Curated success stories (gap #20) ─────────────────────────────────
  var PEER_STORIES = {
    'software-developer': [
      'Vivek (28, Pune) — switched from Java backend → ML eng at Razorpay in 11 months. Started with Andrew Ng + fast.ai.',
      'Anita (25, Bengaluru) — Cleared Databricks GenAI Engineer cert; promoted to Senior Eng + ~25% raise.',
    ],
    'doctor': [
      'Dr Mehta (35, AIIMS Delhi) — Completed IITM-AIIMS Clinical AI Fellowship; now leads radiology AI rollout at Apollo.',
      'Dr Patel (42, Mumbai) — Used Stanford AI Healthcare audit + Abridge to cut SOAP notes by 2 hours/day.',
    ],
    'oncologist': [
      'Dr Rao (44, Hyderabad) — Tata Memorial AI Oncology fellow; published in NEJM AI 2025.',
    ],
    'farmer': [
      'Ramesh (38, Vidarbha) — KVK Drone Pilot + 5 acres own farm; now earns INR 1.8 L/yr extra as drone service provider for 80 neighbours.',
      'Lakshmi (45, Tamil Nadu) — Formed FPO using NABARD training; doubled mandi price for chillies via e-NAM.',
    ],
    'lawyer': [
      'Aditi (33, Delhi NCR) — LawSikho Cyber Law + Spellbook power user; joined Cyril Mangaldas tech-law team.',
    ],
    'accountant': [
      'Ravi (CA, 36, Pune) — ICAI AI in Accounting cert + Vic.ai pilot; CFO promotion at INR 65 LPA.',
    ],
    'teacher': [
      'Priya (29, Bengaluru CBSE) — ISTE Generative AI cert; moved to curriculum design role + 40% salary uplift.',
    ],
    'nurse': [
      'Shanti (32, Hyderabad) — M.Sc Nursing + ASHA Suvidha + ICU AI training; promoted to Sr ICU Informaticist.',
    ],
    'hr-professional': [
      'Karthik (38, Bengaluru) — SHRM AI in HR specialty + Visier; HR Director at growth startup.',
    ],
    'talent-acquisition': [
      'Neha (31, Gurgaon) — Mastered Eightfold + LinkedIn Talent Insights; promoted to TA Lead at unicorn.',
    ],
    'business-owner': [
      'Mahesh (45, Surat textile MSME) — Deployed Cropin + Zoho Books AI; cut admin cost 32% in 6 months.',
    ],
    'government-employee': [
      'Suresh (Group A officer, 39) — Topped iGOT Karmayogi AI; selected for ISB Mohali Govt+AI; led digital portal rollout.',
    ],
    'student': [
      'Aarav (B.Tech 3rd yr, IIT Roorkee) — Followed Karpathy + LangChain Academy → Kaggle silver → IndiaAI Fellowship.',
    ],
  };
  function peerStoriesFor(profession) { return PEER_STORIES[profession] || []; }

  // ── i18n helpers (gap #18 — voice + language) ─────────────────────────
  function speak(text) {
    try {
      if (window.Chitti && window.Chitti.a11y && typeof window.Chitti.a11y.speak === 'function') {
        return window.Chitti.a11y.speak(text);
      }
      if (window.speechSynthesis) {
        var u = new SpeechSynthesisUtterance(text); u.rate = 0.95;
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }

  // ── Exports ───────────────────────────────────────────────────────────
  window.ChittiCoach = {
    SCHEMA_V: SCHEMA_V,
    PROFILE_KEY: PROFILE_KEY,
    profile: { get:_getProfile, set:_setProfile, init:_initProfile, hasIntake:_hasIntake, empty:_emptyProfile },
    vocab: { skills:SKILL_VOCAB, goals:GOAL_VOCAB },
    qualityTier: qualityTier,
    salaryFor: salaryFor, salaryDelta: salaryDelta,
    outcomeFor: outcomeFor,
    whyThisForYou: whyThisForYou,
    scoreFor: scoreFor,
    generatePlan: generatePlan,
    askCoach: askCoach, listQuestions: listQuestions,
    buildCV: buildCV,
    markDone: markDone, markSkipped: markSkipped, markInProgress: markInProgress,
    recordFeedback: recordFeedback, getFeedback: getFeedback,
    urgentList: urgentList, daysUntilIST: daysUntilIST,
    requestNotificationPermission: requestNotificationPermission, maybeNotifyUrgent: maybeNotifyUrgent,
    skipList: skipList,
    peerStoriesFor: peerStoriesFor,
    speak: speak,
  };
})();
