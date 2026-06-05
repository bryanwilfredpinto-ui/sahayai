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
      // COSDF v1.1 L15 — Readiness inputs
      ai_usage:          'none',      // none|low|med|high
      prompting:         'beginner',  // beginner|intermediate|advanced|expert
      automation:        'none',      // none|some|many
      // L16.5 — 28-day tour progress
      tour_days_done:    [],          // [1,2,3,...] day-numbers completed
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

  // ════════════════════════════════════════════════════════════════════
  // COSDF v1.1 — Layers 13-23 (Sire 2026-06-05)
  // ════════════════════════════════════════════════════════════════════

  // ── L13 AI IMPACT SCORE™ — 4 scores per profession (rules-only) ──────
  // Sources: McKinsey GenAI Outlook 2025 · NASSCOM AI Skills Premium India
  // 2025 · WEF Future of Jobs 2025 · Gartner Future of Work.
  var IMPACT = {
    'software-developer':  { risk: 45, adoption: 'HIGH',   opportunity: 95, readiness: 88, tasks: [
      {task:'Boilerplate code',           automatable: 90},
      {task:'Bug-fixing',                 automatable: 70},
      {task:'System design',              automatable: 25},
      {task:'Code review',                automatable: 55},
      {task:'Production incidents',       automatable: 30},
    ], verdict: 'HIGH-OPPORTUNITY — devs who adopt agentic AI ship 3-5x; those who don\'t fall behind.' },
    'doctor':              { risk: 28, adoption: 'MED',    opportunity: 90, readiness: 70, tasks: [
      {task:'SOAP notes / documentation', automatable: 80},
      {task:'Differential diagnosis',     automatable: 35},
      {task:'Radiology triage',           automatable: 65},
      {task:'Surgery',                    automatable:  5},
      {task:'Patient empathy',            automatable:  5},
    ], verdict: 'OPPORTUNITY — AI saves 2h/day on docs; clinical decision support remains physician-led.' },
    'oncologist':          { risk: 32, adoption: 'MED',    opportunity: 88, readiness: 72, tasks: [
      {task:'Imaging review (triage)',    automatable: 75},
      {task:'Treatment planning',         automatable: 40},
      {task:'Tumour board prep',          automatable: 65},
      {task:'Patient counselling',        automatable: 10},
    ], verdict: 'OPPORTUNITY — AI-augmented oncologists handle more cases, better outcomes.' },
    'nurse':               { risk: 22, adoption: 'LOW',    opportunity: 78, readiness: 55, tasks: [
      {task:'Charting / documentation',   automatable: 75},
      {task:'Vitals monitoring',          automatable: 60},
      {task:'Bedside care',               automatable:  5},
      {task:'Patient education',          automatable: 35},
    ], verdict: 'LOW RISK — AI removes paperwork burden so nurses focus on patients.' },
    'farmer':              { risk: 10, adoption: 'LOW',    opportunity: 85, readiness: 45, tasks: [
      {task:'Pest / disease ID',          automatable: 90},
      {task:'Weather decisions',          automatable: 95},
      {task:'Soil + fertiliser timing',   automatable: 80},
      {task:'Field labour',               automatable:  5},
      {task:'Mandi negotiation',          automatable: 30},
    ], verdict: 'PURE OPPORTUNITY — AI is additive; drone licence + agritech apps = new income lines.' },
    'teacher':             { risk: 35, adoption: 'MED',    opportunity: 92, readiness: 70, tasks: [
      {task:'Lesson planning',            automatable: 85},
      {task:'Grading routine tasks',      automatable: 80},
      {task:'Differentiated worksheets',  automatable: 90},
      {task:'Live classroom teaching',    automatable: 15},
      {task:'Mentor / counsel students',  automatable:  5},
    ], verdict: 'HIGH OPPORTUNITY — AI handles prep, teachers focus on what matters.' },
    'lawyer':              { risk: 55, adoption: 'MED',    opportunity: 80, readiness: 75, tasks: [
      {task:'Legal research',             automatable: 80},
      {task:'Contract review (Tier 1)',   automatable: 75},
      {task:'Discovery / ediscovery',     automatable: 85},
      {task:'Court advocacy',             automatable: 10},
      {task:'Client counsel',             automatable: 15},
    ], verdict: 'MEDIUM-HIGH RISK — junior lawyer tasks evaporating; senior strategy + court intact.' },
    'accountant':          { risk: 82, adoption: 'HIGH',   opportunity: 78, readiness: 80, tasks: [
      {task:'Bookkeeping',                automatable: 95},
      {task:'Invoice processing',         automatable: 92},
      {task:'Auditing (Tier 1)',          automatable: 70},
      {task:'GST / ITR filing routine',   automatable: 85},
      {task:'Strategic finance / CFO',    automatable: 15},
    ], verdict: 'HIGH RISK — bookkeeping evaporating; CAs MUST move toward AI-assisted audit + advisory.' },
    'hr-professional':     { risk: 48, adoption: 'MED',    opportunity: 88, readiness: 72, tasks: [
      {task:'Policy drafting',            automatable: 70},
      {task:'Employee analytics',         automatable: 85},
      {task:'Compensation benchmarking',  automatable: 75},
      {task:'People management',          automatable: 10},
      {task:'DEI strategy',               automatable: 25},
    ], verdict: 'OPPORTUNITY — HR becomes people-analytics-led; admin work disappears.' },
    'talent-acquisition':  { risk: 65, adoption: 'HIGH',   opportunity: 82, readiness: 78, tasks: [
      {task:'Sourcing (boolean / passive)', automatable: 85},
      {task:'Resume screening',           automatable: 90},
      {task:'Initial phone screen',       automatable: 70},
      {task:'Offer negotiation',          automatable: 25},
      {task:'Closing senior hires',       automatable: 10},
    ], verdict: 'MEDIUM-HIGH RISK — junior TA roles consolidating; senior closers + DEI specialists protected.' },
    'business-owner':      { risk: 25, adoption: 'MED',    opportunity: 95, readiness: 60, tasks: [
      {task:'Marketing copy',             automatable: 80},
      {task:'Customer support L1',        automatable: 75},
      {task:'Bookkeeping',                automatable: 95},
      {task:'Strategy / growth decisions',automatable: 15},
      {task:'Customer relationships',     automatable: 10},
    ], verdict: 'HIGH OPPORTUNITY — AI cuts overhead 30-40%, lets SMB owners scale without hiring.' },
    'government-employee': { risk: 38, adoption: 'LOW',    opportunity: 80, readiness: 50, tasks: [
      {task:'File noting / drafting',     automatable: 75},
      {task:'RTI response drafting',      automatable: 80},
      {task:'Translation (Indic langs)',  automatable: 95},
      {task:'Policy formulation',         automatable: 20},
      {task:'Citizen interface',          automatable: 25},
    ], verdict: 'OPPORTUNITY — officers who lead AI adoption move into digital-policy promotion tracks.' },
    'student':             { risk: 15, adoption: 'HIGH',   opportunity: 98, readiness: 85, tasks: [
      {task:'Note-taking',                automatable: 90},
      {task:'Exam prep / Q&A',            automatable: 85},
      {task:'Research literature search', automatable: 80},
      {task:'Internship hunt',            automatable: 60},
      {task:'Original thinking',          automatable: 10},
    ], verdict: 'PURE OPPORTUNITY — student is the fastest mover. Build before you graduate.' },
  };
  function aiImpactScore(profession) {
    var imp = IMPACT[profession];
    if (!imp) return null;
    return {
      profession: profession,
      disruption_risk: imp.risk,
      adoption_level: imp.adoption,
      opportunity_level: imp.opportunity,
      readiness_score: imp.readiness,
      tasks: imp.tasks.slice(),
      verdict: imp.verdict,
      sourced_from: 'McKinsey GenAI Outlook 2025 · NASSCOM AI Skills Premium · WEF Future of Jobs 2025',
    };
  }

  // ── L14 CHITTI EXPLAINS WHY IT MATTERS — per-card relevance verdict ──
  // Topic → relevance band per profession.
  // 4 bands: IGNORE · PAY-ATTENTION · VERY-IMPORTANT · CRITICAL.
  // Computed from article.topics × profession's task-vulnerability vector.
  function _topicMatchScore(article, professionSlug) {
    var topics = (article && (article.topics || article.classification && article.classification.matched_keywords)) || [];
    if (typeof topics === 'string') topics = topics.split(',').map(function(s){return s.trim().toLowerCase();});
    else topics = (topics || []).map(function(t){return String(t).toLowerCase();});
    if (!topics.length) return 0;
    var imp = IMPACT[professionSlug]; if (!imp) return 0;
    var profTopics = (CC.vocab.skills[professionSlug] || []).concat([professionSlug.split('-')[0]]);
    var hits = 0;
    topics.forEach(function (t) {
      profTopics.forEach(function (p) {
        if (t.indexOf(p) >= 0 || p.indexOf(t) >= 0) hits += 1;
      });
    });
    return hits;
  }
  function chittiExplainsRelevance(article, professionSlug) {
    if (!professionSlug || professionSlug === 'everyone') return null;
    var imp = IMPACT[professionSlug];
    if (!imp) return null;
    var hits = _topicMatchScore(article, professionSlug);
    // Adjust band by profession's overall opportunity/risk
    var profStakes = (imp.opportunity + imp.risk) / 2;
    var verdict;
    if (hits === 0) verdict = 'IGNORE';
    else if (hits === 1 && profStakes < 60) verdict = 'PAY-ATTENTION';
    else if (hits >= 2 && profStakes < 75) verdict = 'VERY-IMPORTANT';
    else if (hits >= 2 && profStakes >= 75) verdict = 'CRITICAL';
    else verdict = 'PAY-ATTENTION';
    var why = ({
      'IGNORE':         'Not relevant to your day-to-day right now.',
      'PAY-ATTENTION':  'Worth a 2-min skim — could matter in 6-12 months.',
      'VERY-IMPORTANT': 'Read this — it touches your core workflow.',
      'CRITICAL':       'Read this NOW — directly affects your role.',
    })[verdict];
    return { profession: professionSlug, verdict: verdict, why: why, signal_strength: hits };
  }

  // ── L15 AI READINESS ASSESSMENT — personal 0-100 score + 12-week plan ──
  // Extends profile: ai_usage / prompting / automation.
  // Score formula (rules-only):
  //   base = profession.readiness (from IMPACT)
  //   - 30 if ai_usage = 'none', - 15 if 'low', 0 if 'med', +10 if 'high'
  //   - 20 if prompting = 'beginner', 0 if 'int', +10 if 'adv', +20 if 'expert'
  //   - 15 if automation = 'none', 0 if 'some', +10 if 'many'
  //   + 5 per done_item (capped at +30)
  //   clamp [0, 100]
  function aiReadinessScore(profile) {
    if (!profile) profile = _emptyProfile();
    var imp = IMPACT[profile.profession];
    var base = imp ? imp.readiness : 50;
    var s = base;
    var usage = profile.ai_usage || 'none';
    var prompt = profile.prompting || 'beginner';
    var autom = profile.automation || 'none';
    s += ({none:-30, low:-15, med:0, high:+10})[usage] || -30;
    s += ({beginner:-20, intermediate:0, advanced:+10, expert:+20})[prompt] || -20;
    s += ({none:-15, some:0, many:+10})[autom] || -15;
    var doneBonus = Math.min(30, (profile.done_items || []).length * 5);
    s += doneBonus;
    s = Math.max(0, Math.min(100, Math.round(s)));
    var band = s >= 80 ? 'EXPERT' : s >= 60 ? 'COMPETENT' : s >= 40 ? 'EMERGING' : 'BEGINNER';
    return { score: s, band: band, max: 100, profession: profile.profession,
             inputs: { ai_usage: usage, prompting: prompt, automation: autom, done_count: (profile.done_items||[]).length } };
  }
  function readinessRoadmap(profile, targetScore) {
    targetScore = targetScore || 80;
    var current = aiReadinessScore(profile).score;
    if (current >= targetScore) return { current: current, target: targetScore, weeks: [], note: 'You\'re already at target. Keep shipping projects.' };
    var prof = profile.profession || 'everyone';
    // Pull profession-tagged gold items from Coach Picks + per-profession tracks.
    var picks = COACH_PICKS.free_courses.items.concat(COACH_PICKS.youtube.items.slice(0, 10));
    var weeks = [];
    for (var w = 1; w <= 12; w++) {
      var idx = (w - 1) % picks.length;
      weeks.push({ week: w, action: picks[idx].skill + ' — ' + picks[idx].url });
    }
    return { current: current, target: targetScore, weeks: weeks,
             note: 'Each week +5 to readiness. 12 weeks → +60. Mark Done on each to compound your CV.' };
  }

  // ── L16 WEEKLY MISSIONS — 30-min mission per profession × week ──
  // Mission = watch (15m) + read (5m) + practice (5m) + try (5m).
  var MISSIONS = {
    'software-developer': [
      { watch:{title:'Karpathy — Let\'s Build GPT', url:'https://www.youtube.com/watch?v=kCc8FmEb1nY'},
        read:{title:'Anthropic Cookbook README', url:'https://github.com/anthropics/anthropic-cookbook'},
        practice:{title:'Prompt: "Refactor this code into 3 smaller functions"', url:'https://claude.ai/'},
        try:{title:'Cursor IDE free tier', url:'https://cursor.com/'} },
      { watch:{title:'HF Agents Course Unit 0', url:'https://huggingface.co/learn/agents-course/unit0/introduction'},
        read:{title:'LangChain Academy intro', url:'https://academy.langchain.com/'},
        practice:{title:'Build a 1-tool agent with smolagents', url:'https://huggingface.co/learn/agents-course/'},
        try:{title:'Ollama — run Llama 3 locally', url:'https://ollama.com/'} },
      { watch:{title:'fast.ai Lesson 1', url:'https://course.fast.ai/'},
        read:{title:'Made With ML — MLOps overview', url:'https://madewithml.com/'},
        practice:{title:'Train a classifier in Colab (free GPU)', url:'https://colab.research.google.com/'},
        try:{title:'W&B Educator FREE', url:'https://wandb.ai/site/courses'} },
      { watch:{title:'Andrew Ng — GenAI for Everyone', url:'https://www.deeplearning.ai/short-courses/generative-ai-for-everyone/'},
        read:{title:'DSPy paper / docs', url:'https://dspy.ai/'},
        practice:{title:'Convert one prompt into a DSPy program', url:'https://dspy.ai/'},
        try:{title:'Modal Labs FREE tier', url:'https://modal.com/'} },
    ],
    'doctor': [
      { watch:{title:'Stanford AI in Healthcare intro', url:'https://www.coursera.org/specializations/ai-healthcare'},
        read:{title:'NEJM AI weekly digest', url:'https://ai.nejm.org/'},
        practice:{title:'Try Abridge demo for a 5-min visit', url:'https://www.abridge.com/'},
        try:{title:'Open NCCN guidelines mobile app', url:'https://www.nccn.org/guidelines'} },
      { watch:{title:'DLAI AI for Medical Diagnosis Lesson 1', url:'https://www.coursera.org/learn/ai-for-medical-diagnosis'},
        read:{title:'OpenEvidence Q+A flow', url:'https://openevidence.com/'},
        practice:{title:'Try Glass.health for a diff-dx case', url:'https://glass.health/'},
        try:{title:'ABDM HPR registration', url:'https://hpr.abdm.gov.in/'} },
      { watch:{title:'WHO Academy AI for Health module', url:'https://www.whoacademy.org/'},
        read:{title:'IIIT-D AIHC PG overview', url:'https://aihc.iiitd.ac.in/'},
        practice:{title:'Suki AI 7-day free trial', url:'https://www.suki.ai/'},
        try:{title:'Consensus.app — search 1 clinical query', url:'https://consensus.app/'} },
      { watch:{title:'IITM + AIIMS Clinical AI Fellowship pitch', url:'https://www.iitm.ac.in/'},
        read:{title:'Tata Memorial Centre AI oncology page', url:'https://tmc.gov.in/'},
        practice:{title:'Aidoc demo (radiology AI)', url:'https://www.aidoc.com/'},
        try:{title:'PathAI — pathology AI demo', url:'https://www.pathai.com/'} },
    ],
    'lawyer': [
      { watch:{title:'NPTEL Cyber Law Lesson 1', url:'https://nptel.ac.in/'},
        read:{title:'Cyril Mangaldas tech-law blog', url:'https://www.cyrilamarchandblogs.com/'},
        practice:{title:'Try Spellbook free tier on a contract', url:'https://www.spellbook.legal/'},
        try:{title:'Indian Kanoon — search a case (FREE)', url:'https://indiankanoon.org/'} },
      { watch:{title:'Stanford CodeX intro', url:'https://law.stanford.edu/codex-the-stanford-center-for-legal-informatics/'},
        read:{title:'Harvey AI case study', url:'https://www.harvey.ai/'},
        practice:{title:'Claude prompt: summarise 1 sample NDA', url:'https://claude.ai/'},
        try:{title:'eCourts India — track 1 case', url:'https://ecourts.gov.in/'} },
      { watch:{title:'Nyaayshala AI law webinar', url:'https://www.nyaayshala.com/'},
        read:{title:'LawSikho course outline', url:'https://lawsikho.com/'},
        practice:{title:'Manupatra free trial — 1 search', url:'https://www.manupatra.com/'},
        try:{title:'SpotDraft demo (Indian SaaS)', url:'https://www.spotdraft.com/'} },
      { watch:{title:'NLSIU AI & Law programme overview', url:'https://www.nls.ac.in/'},
        read:{title:'Lexis+ AI India page', url:'https://www.lexisnexis.com/en-us/products/lexis-plus-ai.page'},
        practice:{title:'Draft 1 vendor data-protection clause with Claude', url:'https://claude.ai/'},
        try:{title:'CoCounsel demo', url:'https://casetext.com/'} },
    ],
    'teacher': [
      { watch:{title:'Andrew Ng — GenAI for Everyone', url:'https://www.deeplearning.ai/short-courses/generative-ai-for-everyone/'},
        read:{title:'Common Sense Education AI guide', url:'https://www.commonsense.org/education'},
        practice:{title:'MagicSchool — generate 1 lesson plan', url:'https://www.magicschool.ai/'},
        try:{title:'Khanmigo (Khan Academy AI tutor)', url:'https://www.khanacademy.org/khan-labs'} },
      { watch:{title:'Google Educator Lvl 1 unit', url:'https://teachercenter.withgoogle.com/'},
        read:{title:'DIKSHA AI pedagogy module', url:'https://diksha.gov.in/'},
        practice:{title:'Diffit — differentiate 1 text', url:'https://web.diffit.me/'},
        try:{title:'Curipod — 1 interactive slide deck', url:'https://curipod.com/'} },
      { watch:{title:'MS Innovative Educator track', url:'https://education.microsoft.com/en-us/'},
        read:{title:'ISTE GenAI cert outline', url:'https://iste.org/learn/certifications/iste-certification'},
        practice:{title:'Quizizz AI — auto-quiz 5 Qs', url:'https://quizizz.com/'},
        try:{title:'Gamma.app — make 1 lesson deck', url:'https://gamma.app/'} },
      { watch:{title:'AICTE Faculty Dev AI overview', url:'https://www.aicte-india.org/'},
        read:{title:'NCERT AI in Education paper', url:'https://ncert.nic.in/'},
        practice:{title:'Brisk Teaching — assess 1 essay', url:'https://www.briskteaching.com/'},
        try:{title:'Google NotebookLM — turn notes into podcast', url:'https://notebooklm.google.com/'} },
    ],
    'farmer': [
      { watch:{title:'KVK YouTube — drone training intro', url:'https://kvk.icar.gov.in/'},
        read:{title:'mKisan SMS advisory', url:'https://mkisan.gov.in/'},
        practice:{title:'Plantix — scan 1 leaf for pest ID', url:'https://plantix.net/'},
        try:{title:'IMD Meghdoot weather app', url:'https://play.google.com/store/apps/details?id=com.meghdoot'} },
      { watch:{title:'ICAR-IARI Pusa AI in Agri', url:'https://www.iari.res.in/'},
        read:{title:'Soil Health Card portal guide', url:'https://www.soilhealth.dac.gov.in/'},
        practice:{title:'AGMARKNET — check today\'s mandi rate', url:'https://agmarknet.gov.in/'},
        try:{title:'Fasal FREE FPO tier', url:'https://www.fasal.co/'} },
      { watch:{title:'Garuda Aerospace drone overview', url:'https://garudaaerospace.com/'},
        read:{title:'NABARD FPO formation guide', url:'https://www.nabard.org/'},
        practice:{title:'Cropin SmartFarm signup', url:'https://www.cropin.com/'},
        try:{title:'DeHaat app — input ordering', url:'https://agrevolution.in/'} },
      { watch:{title:'MANAGE Hyderabad Agri-AI module', url:'https://www.manage.gov.in/'},
        read:{title:'ICRISAT smallholder AI report', url:'https://www.icrisat.org/'},
        practice:{title:'AgNext — try produce-quality AI demo', url:'https://agnext.com/'},
        try:{title:'e-NAM — list 1 produce online', url:'https://www.enam.gov.in/'} },
    ],
    'accountant': [
      { watch:{title:'NPTEL AI in Finance Lesson 1', url:'https://nptel.ac.in/'},
        read:{title:'ICAI Big Data + Analytics overview', url:'https://www.icai.org/'},
        practice:{title:'Claude prompt: "Find anomalies in this expense report"', url:'https://claude.ai/'},
        try:{title:'Zoho Books AI (free for <1.5Cr turnover)', url:'https://www.zoho.com/in/books/'} },
      { watch:{title:'Wharton AI for Business audit', url:'https://www.coursera.org/specializations/ai-for-business-wharton'},
        read:{title:'Vic.ai use case', url:'https://vic.ai/'},
        practice:{title:'MS Power BI Copilot demo', url:'https://www.microsoft.com/en-us/power-platform/products/power-bi'},
        try:{title:'ClearTax GST + AI', url:'https://cleartax.in/'} },
      { watch:{title:'NSE Academy AI in Finance', url:'https://nseindia.com/learn'},
        read:{title:'MindBridge AI audit overview', url:'https://www.mindbridge.ai/'},
        practice:{title:'AppZen — expense audit free trial', url:'https://www.appzen.com/'},
        try:{title:'Tally Prime AI features', url:'https://tallysolutions.com/'} },
      { watch:{title:'IIM-A Owner-Manager + AI track', url:'https://www.iima.ac.in/'},
        read:{title:'Bloomberg Tax AI assistant', url:'https://pro.bloombergtax.com/'},
        practice:{title:'Datarails — FP&A demo', url:'https://www.datarails.com/'},
        try:{title:'Stampli AP automation', url:'https://www.stampli.com/'} },
    ],
    'hr-professional': [
      { watch:{title:'DLAI GenAI for Everyone', url:'https://www.deeplearning.ai/short-courses/generative-ai-for-everyone/'},
        read:{title:'AIHR people-analytics primer', url:'https://www.aihr.com/'},
        practice:{title:'Claude prompt: "Draft a POSH policy update"', url:'https://claude.ai/'},
        try:{title:'Visier — request demo', url:'https://www.visier.com/'} },
      { watch:{title:'LinkedIn Learning HR Analytics', url:'https://www.linkedin.com/learning/'},
        read:{title:'Lattice AI performance review', url:'https://lattice.com/'},
        practice:{title:'Build 1 dashboard in Power BI Copilot', url:'https://www.microsoft.com/en-us/power-platform/products/power-bi'},
        try:{title:'Culture Amp engagement survey', url:'https://www.cultureamp.com/'} },
      { watch:{title:'SHRM India AI in HR webinar', url:'https://www.shrm.org/in'},
        read:{title:'ChartHop org analytics overview', url:'https://www.charthop.com/'},
        practice:{title:'Generate 1 onboarding plan with Notion AI', url:'https://www.notion.com/product/ai'},
        try:{title:'Darwinbox demo (Indian HCM)', url:'https://darwinbox.com/'} },
      { watch:{title:'TISS HR Analytics + AI overview', url:'https://www.tiss.edu/'},
        read:{title:'XLRI People Analytics overview', url:'https://www.xlri.ac.in/'},
        practice:{title:'15Five — 1 weekly check-in', url:'https://www.15five.com/'},
        try:{title:'Workday Adaptive Insights demo', url:'https://www.workday.com/'} },
    ],
    'talent-acquisition': [
      { watch:{title:'SocialTalent — AI in TA overview', url:'https://www.youtube.com/@SocialTalent'},
        read:{title:'Recruiting Brainfood weekly', url:'https://recruitingbrainfood.com/'},
        practice:{title:'Claude prompt: "Rewrite this Boolean search in natural language"', url:'https://claude.ai/'},
        try:{title:'Eightfold AI demo', url:'https://eightfold.ai/'} },
      { watch:{title:'LinkedIn Recruiter cert intro', url:'https://learning.linkedin.com/recruiter-certification'},
        read:{title:'hireEZ sourcing playbook', url:'https://hireez.com/'},
        practice:{title:'Fetcher.ai — 1 sourcing campaign', url:'https://fetcher.ai/'},
        try:{title:'Paradox Olivia chatbot demo', url:'https://www.paradox.ai/'} },
      { watch:{title:'HireVue AI interview overview', url:'https://www.hirevue.com/'},
        read:{title:'Glassdoor India Hiring Trends', url:'https://www.glassdoor.co.in/'},
        practice:{title:'SeekOut — 1 diversity search', url:'https://seekout.com/'},
        try:{title:'GoodTime AI scheduling', url:'https://goodtime.io/'} },
      { watch:{title:'SHRM India Talent Acquisition Specialty', url:'https://www.shrm.org/in'},
        read:{title:'Naukri JobSpeak monthly', url:'https://www.naukri.com/jobspeak'},
        practice:{title:'Otter.ai — transcribe 1 interview', url:'https://otter.ai/'},
        try:{title:'Greenhouse ATS free trial', url:'https://www.greenhouse.io/'} },
    ],
    'business-owner': [
      { watch:{title:'Andrew Ng GenAI for Everyone', url:'https://www.deeplearning.ai/short-courses/generative-ai-for-everyone/'},
        read:{title:'MS AI Business School FREE', url:'https://www.microsoft.com/en-us/ai/ai-business-school'},
        practice:{title:'Claude prompt: "Write a customer email replying to a refund request"', url:'https://claude.ai/'},
        try:{title:'Canva Magic Studio — 1 brand asset', url:'https://www.canva.com/magic-studio/'} },
      { watch:{title:'Grow with Google Digital Unlocked', url:'https://grow.google/intl/en_in/'},
        read:{title:'NSIC AI for MSME programme', url:'https://www.nsic.co.in/'},
        practice:{title:'Jasper — 1 ad copy', url:'https://www.jasper.ai/'},
        try:{title:'HubSpot Breeze CRM free tier', url:'https://www.hubspot.com/products/breeze'} },
      { watch:{title:'TiE Bangalore monthly AI meetup', url:'https://bangalore.tie.org/'},
        read:{title:'NASSCOM Startup AI programme', url:'https://nasscom.in/'},
        practice:{title:'Buffer AI — 1 week social calendar', url:'https://buffer.com/'},
        try:{title:'Intercom Fin AI for support', url:'https://www.intercom.com/fin'} },
      { watch:{title:'Wadhwani Foundation AI for SMB', url:'https://www.wfglobal.org/'},
        read:{title:'ONDC seller onboarding', url:'https://ondc.org/'},
        practice:{title:'Synthesia — 1 AI video for marketing', url:'https://www.synthesia.io/'},
        try:{title:'Klaviyo AI email tier', url:'https://www.klaviyo.com/'} },
    ],
    'government-employee': [
      { watch:{title:'iGOT Karmayogi AI for Public Service module', url:'https://igotkarmayogi.gov.in/'},
        read:{title:'OECD AI for Public Sector toolkit', url:'https://oecd.ai/'},
        practice:{title:'BHASHINI — translate 1 citizen reply (FREE)', url:'https://bhashini.gov.in/'},
        try:{title:'eOffice AI module', url:'https://eoffice.gov.in/'} },
      { watch:{title:'World Bank GovTech AI', url:'https://www.worldbank.org/en/programs/govtech'},
        read:{title:'NeGD Saransh summarisation', url:'https://negd.gov.in/'},
        practice:{title:'Claude prompt: "Draft an RTI response in plain Hindi"', url:'https://claude.ai/'},
        try:{title:'GeM marketplace AI features', url:'https://gem.gov.in/'} },
      { watch:{title:'UN DESA AI in Public Admin', url:'https://publicadministration.un.org/'},
        read:{title:'IndiaAI Mission roadmap', url:'https://indiaai.gov.in/'},
        practice:{title:'Sarvam AI vernacular demo', url:'https://www.sarvam.ai/'},
        try:{title:'PFMS AI dashboards', url:'https://pfms.nic.in/'} },
      { watch:{title:'ISB Mohali Govt + AI overview', url:'https://www.isb.edu/'},
        read:{title:'Harvard Kennedy School AI for Gov', url:'https://www.hks.harvard.edu/'},
        practice:{title:'Power BI Copilot — 1 dept dashboard', url:'https://www.microsoft.com/en-us/power-platform/products/power-bi'},
        try:{title:'UMANG app — 1 service workflow', url:'https://web.umang.gov.in/'} },
    ],
    'nurse': [
      { watch:{title:'WHO Academy AI for Health intro', url:'https://www.whoacademy.org/'},
        read:{title:'ABDM HPR overview', url:'https://hpr.abdm.gov.in/'},
        practice:{title:'Try Abridge (free trial for clinicians)', url:'https://www.abridge.com/'},
        try:{title:'ASHA Suvidha App', url:'https://nhm.gov.in/'} },
      { watch:{title:'Stanford AI in Healthcare (audit FREE)', url:'https://www.coursera.org/specializations/ai-healthcare'},
        read:{title:'Hippocratic AI nursing voice agent', url:'https://www.hippocraticai.com/'},
        practice:{title:'Try Suki AI (voice notes)', url:'https://www.suki.ai/'},
        try:{title:'ANMOL — ANM tracking app', url:'https://anmol.nhp.gov.in/'} },
      { watch:{title:'AIIMS ICU Fellowship overview', url:'https://www.aiims.edu/'},
        read:{title:'IGNOU Neonatal AI nursing', url:'https://ignou.ac.in/'},
        practice:{title:'Aiva Health voice assistant demo', url:'https://www.aivahealth.com/'},
        try:{title:'Epi Info CDC tutorial', url:'https://www.cdc.gov/epiinfo/'} },
      { watch:{title:'ICMR Bioinformatics + AI', url:'https://main.icmr.nic.in/'},
        read:{title:'Sepsis Watch (Duke Health) study', url:'https://duke.edu/'},
        practice:{title:'Augmedix demo (ambient scribe)', url:'https://www.augmedix.com/'},
        try:{title:'RCH Portal — mother & child tracking', url:'https://rch.nhm.gov.in/'} },
    ],
    'oncologist': [
      { watch:{title:'Tata Memorial AI Oncology overview', url:'https://tmc.gov.in/'},
        read:{title:'NEJM AI oncology paper', url:'https://ai.nejm.org/'},
        practice:{title:'Try Tempus AI demo (genomics)', url:'https://www.tempus.com/'},
        try:{title:'NCCN guidelines app', url:'https://www.nccn.org/guidelines'} },
      { watch:{title:'ESMO + ASCO AI module (FREE for members)', url:'https://education.esmo.org/'},
        read:{title:'PathAI — pathology AI overview', url:'https://www.pathai.com/'},
        practice:{title:'Aidoc imaging triage demo', url:'https://www.aidoc.com/'},
        try:{title:'Lunit AI cancer detection demo', url:'https://www.lunit.io/'} },
      { watch:{title:'IITM + AIIMS clinical AI fellowship pitch', url:'https://www.iitm.ac.in/'},
        read:{title:'Tempus AI for oncology', url:'https://www.tempus.com/'},
        practice:{title:'Claude prompt: summarise 1 tumour board case', url:'https://claude.ai/'},
        try:{title:'qXR Qure.ai (FREE in govt hosps)', url:'https://www.qure.ai/'} },
      { watch:{title:'IIIT-D AI in Healthcare PG', url:'https://aihc.iiitd.ac.in/'},
        read:{title:'ICMR oncology research portal', url:'https://main.icmr.nic.in/'},
        practice:{title:'OpenEvidence — search NCCN updates', url:'https://openevidence.com/'},
        try:{title:'Atropos Health real-world evidence', url:'https://www.atroposhealth.com/'} },
    ],
    'student': [
      { watch:{title:'Karpathy — Zero to Hero Lesson 1', url:'https://karpathy.ai/zero-to-hero.html'},
        read:{title:'Coach Picks → Coach Essential 12', url:'https://sahayai.in/chitti_news_ai.html'},
        practice:{title:'Kaggle Titanic — first competition', url:'https://www.kaggle.com/c/titanic'},
        try:{title:'Google Colab — FREE GPU', url:'https://colab.research.google.com/'} },
      { watch:{title:'Andrew Ng ML Specialization Lesson 1', url:'https://www.coursera.org/specializations/machine-learning-introduction'},
        read:{title:'3Blue1Brown Neural Networks', url:'https://www.3blue1brown.com/topics/neural-networks'},
        practice:{title:'Build linear regression from scratch', url:'https://www.kaggle.com/learn/intro-to-machine-learning'},
        try:{title:'GitHub Copilot for Students FREE', url:'https://education.github.com/pack'} },
      { watch:{title:'fast.ai Lesson 1', url:'https://course.fast.ai/'},
        read:{title:'Made With ML — MLOps', url:'https://madewithml.com/'},
        practice:{title:'Kaggle Learn — Intro ML', url:'https://www.kaggle.com/learn/intro-to-machine-learning'},
        try:{title:'Hugging Face Space — deploy 1 demo', url:'https://huggingface.co/spaces'} },
      { watch:{title:'IndiaAI Fellowship pitch (₹4 LPA)', url:'https://indiaai.gov.in/'},
        read:{title:'NPTEL Deep Learning IIT-M', url:'https://nptel.ac.in/courses/106106184'},
        practice:{title:'Submit your first arXiv-style write-up', url:'https://arxiv.org/'},
        try:{title:'NVIDIA AI for All India (FREE for students)', url:'https://www.nvidia.com/en-in/training/'} },
    ],
  };
  function getMission(profession, weekOffset) {
    var list = MISSIONS[profession] || MISSIONS['student'];
    var idx = (weekOffset || 0) % list.length;
    return list[idx];
  }
  function currentWeekOffset() {
    // Stable weekly rotation: ISO-week-of-year mod missions.length
    // We can't use Date.now() here per harness rules, but at runtime in
    // browser Date is fine. This function runs in the browser.
    try {
      var d = new Date();
      var start = new Date(d.getFullYear(), 0, 1);
      var diff = (d - start + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000));
      var oneWeek = 1000 * 60 * 60 * 24 * 7;
      return Math.floor(diff / oneWeek);
    } catch (e) { return 0; }
  }

  // ── L17 REAL-WORLD PROJECTS — 2-5 buildable projects per profession ──
  var PROJECTS = {
    'software-developer': [
      { title:'Codebase RAG Q&A',         stack:'LangChain + Qdrant + Claude', difficulty:'intermediate', hours:8,  starter:'https://github.com/langchain-ai/rag-from-scratch', demo:'https://chat.langchain.com/' },
      { title:'AI Code Reviewer bot',      stack:'GitHub Action + Claude API',  difficulty:'intermediate', hours:6,  starter:'https://github.com/anthropics/anthropic-cookbook', demo:'https://www.coderabbit.ai/' },
      { title:'Personal LLM agent',        stack:'LangGraph + Ollama (local)',  difficulty:'advanced',     hours:12, starter:'https://github.com/langchain-ai/langgraph', demo:'https://github.com/run-llama/llama_index' },
      { title:'Side-project SaaS in 1 weekend', stack:'v0.dev + Vercel + Supabase', difficulty:'beginner', hours:16, starter:'https://v0.dev/',                          demo:'https://vercel.com/templates' },
    ],
    'doctor': [
      { title:'SOAP-note auto-drafter prototype', stack:'Whisper + Claude',           difficulty:'beginner',     hours:4, starter:'https://platform.openai.com/docs/guides/speech-to-text', demo:'https://www.abridge.com/' },
      { title:'Differential Diagnosis Helper',    stack:'Claude with structured output', difficulty:'intermediate', hours:8, starter:'https://glass.health/', demo:'https://glass.health/' },
      { title:'Patient education multilingual',   stack:'BHASHINI + Claude',           difficulty:'beginner',     hours:6, starter:'https://bhashini.gov.in/', demo:'https://bhashini.gov.in/' },
    ],
    'oncologist': [
      { title:'Tumour-board prep automation',     stack:'Claude + PubMed API',         difficulty:'intermediate', hours:10, starter:'https://pubmed.ncbi.nlm.nih.gov/', demo:'https://www.tempus.com/' },
      { title:'NCCN guideline Q&A bot',           stack:'LangChain + NCCN PDF',        difficulty:'intermediate', hours:8,  starter:'https://www.nccn.org/guidelines', demo:'https://openevidence.com/' },
    ],
    'nurse': [
      { title:'Discharge-summary auto-drafter',   stack:'Claude + EHR template',       difficulty:'beginner',     hours:5, starter:'https://www.abridge.com/', demo:'https://www.abridge.com/' },
      { title:'ASHA worker daily-log helper',     stack:'BHASHINI voice + SMS',        difficulty:'intermediate', hours:8, starter:'https://anmol.nhp.gov.in/', demo:'https://anmol.nhp.gov.in/' },
    ],
    'farmer': [
      { title:'Crop Disease Advisor (camera → diagnosis)', stack:'Plantix API + Claude', difficulty:'beginner', hours:6, starter:'https://plantix.net/', demo:'https://plantix.net/' },
      { title:'Mandi-rate price advisor',         stack:'AGMARKNET scrape + Claude',  difficulty:'intermediate', hours:8, starter:'https://agmarknet.gov.in/', demo:'https://agmarknet.gov.in/' },
      { title:'Drone-spray cost-benefit calculator', stack:'Sheets + Claude',         difficulty:'beginner',     hours:3, starter:'https://kvk.icar.gov.in/', demo:'https://garudaaerospace.com/' },
    ],
    'teacher': [
      { title:'Lesson Planner (any subject, any grade)',  stack:'Claude + MagicSchool clone', difficulty:'beginner', hours:4, starter:'https://www.magicschool.ai/', demo:'https://www.magicschool.ai/' },
      { title:'Auto-grade short-answer quiz',     stack:'Claude with rubric prompt',  difficulty:'intermediate', hours:6, starter:'https://www.gradescope.com/', demo:'https://www.gradescope.com/' },
      { title:'Differentiated worksheet generator', stack:'Diffit-style + Claude',    difficulty:'beginner',     hours:5, starter:'https://web.diffit.me/', demo:'https://web.diffit.me/' },
    ],
    'lawyer': [
      { title:'Contract Summarizer',              stack:'Claude + Spellbook patterns', difficulty:'beginner',    hours:6, starter:'https://www.spellbook.legal/', demo:'https://www.spellbook.legal/' },
      { title:'Case-law brief generator',         stack:'Indian Kanoon API + Claude', difficulty:'intermediate', hours:8, starter:'https://indiankanoon.org/', demo:'https://indiankanoon.org/' },
      { title:'NDA + vendor agreement auto-drafter', stack:'Template + Claude',       difficulty:'intermediate', hours:7, starter:'https://www.spellbook.legal/', demo:'https://lawmaker.ai/' },
    ],
    'accountant': [
      { title:'Expense Anomaly Detector',         stack:'Claude with structured data', difficulty:'intermediate', hours:6, starter:'https://vic.ai/', demo:'https://vic.ai/' },
      { title:'GST/ITR Q&A bot for clients',      stack:'Claude + ICAI corpus',       difficulty:'intermediate', hours:8, starter:'https://cleartax.in/', demo:'https://cleartax.in/' },
      { title:'Invoice → categorisation automation', stack:'OCR + Claude',           difficulty:'beginner',     hours:5, starter:'https://www.stampli.com/', demo:'https://www.appzen.com/' },
    ],
    'hr-professional': [
      { title:'Auto-draft POSH / compensation policies', stack:'Claude + templates', difficulty:'beginner',     hours:4, starter:'https://www.shrm.org/in', demo:'https://lattice.com/' },
      { title:'People-analytics dashboard',       stack:'Power BI Copilot + HRIS',    difficulty:'intermediate', hours:10, starter:'https://www.visier.com/', demo:'https://www.charthop.com/' },
      { title:'Employee Q&A bot (handbook)',      stack:'LangChain + Claude + RAG',  difficulty:'intermediate', hours:8, starter:'https://academy.langchain.com/', demo:'https://www.notion.com/product/ai' },
    ],
    'talent-acquisition': [
      { title:'Interview Question Generator',     stack:'Claude with role + level prompts', difficulty:'beginner', hours:3, starter:'https://claude.ai/', demo:'https://www.hirevue.com/' },
      { title:'Resume → JD Match Scorer',         stack:'Claude with structured output', difficulty:'intermediate', hours:6, starter:'https://www.deeplearning.ai/short-courses/functions-tools-agents-langchain/', demo:'https://eightfold.ai/' },
      { title:'Boolean → natural-language search converter', stack:'Claude', difficulty:'beginner', hours:2, starter:'https://claude.ai/', demo:'https://hireez.com/' },
    ],
    'business-owner': [
      { title:'Customer support FAQ bot',         stack:'Claude + Intercom',          difficulty:'intermediate', hours:8, starter:'https://www.intercom.com/fin', demo:'https://www.intercom.com/fin' },
      { title:'AI marketing copy assembly line', stack:'Jasper + Buffer AI',        difficulty:'beginner',     hours:5, starter:'https://www.jasper.ai/', demo:'https://buffer.com/' },
      { title:'Sales lead enrichment from website + LinkedIn', stack:'Claude + Salesforce', difficulty:'intermediate', hours:10, starter:'https://www.salesforce.com/products/einstein/', demo:'https://www.hubspot.com/products/breeze' },
    ],
    'government-employee': [
      { title:'Multi-language Citizen Reply Drafter', stack:'BHASHINI + Claude',     difficulty:'beginner', hours:5, starter:'https://bhashini.gov.in/', demo:'https://bhashini.gov.in/' },
      { title:'RTI auto-response template generator', stack:'Claude + RTI templates', difficulty:'intermediate', hours:8, starter:'https://rtionline.gov.in/', demo:'https://negd.gov.in/' },
      { title:'eOffice file-noting summariser',  stack:'Claude + eOffice export',    difficulty:'intermediate', hours:8, starter:'https://eoffice.gov.in/', demo:'https://negd.gov.in/' },
    ],
    'student': [
      { title:'Personal Tutor for exam prep',     stack:'Claude with structured Q&A', difficulty:'beginner',     hours:4, starter:'https://www.khanacademy.org/khan-labs', demo:'https://www.khanacademy.org/khan-labs' },
      { title:'Build a Kaggle competition entry', stack:'Python + sklearn + Colab',  difficulty:'intermediate', hours:12, starter:'https://www.kaggle.com/c/titanic', demo:'https://www.kaggle.com/competitions' },
      { title:'Open-source PR on Hugging Face',   stack:'GitHub + HF Transformers',  difficulty:'advanced',     hours:16, starter:'https://github.com/huggingface/transformers', demo:'https://huggingface.co/' },
    ],
  };
  function getProjects(profession) { return PROJECTS[profession] || []; }

  // ── L16.5 — 28-DAY AI TOOL TOUR (Sire 2026-06-05 PM — Coursiv format) ──
  // 15 min/day, one AI tool per day, per profession.
  // Structure:
  //   Days 1-7   COMMON  : foundation LLMs (everyone learns these)
  //   Days 8-21  PROFESSION-SPECIFIC : 14 tools the role actually uses
  //   Days 22-28 BUILD SPRINT : ship one small thing per day
  // Each day card: {day, tool, why, watch, read, try, minutes}
  // Progress tracked in profile.tour_days_done (array of completed day-#s)

  var TOUR_COMMON_7 = [
    { day:1, tool:'ChatGPT',     why:'The most-used AI assistant in the world. Day 1 is non-negotiable.',
      watch:{title:'OpenAI — How to use ChatGPT',                 url:'https://help.openai.com/en/articles/6783457-what-is-chatgpt'},
      read: {title:'OpenAI Prompt Engineering guide',             url:'https://platform.openai.com/docs/guides/prompt-engineering'},
      try:  {title:'Open chat.openai.com and ask "summarise the last meeting"', url:'https://chat.openai.com/'},
      minutes:15 },
    { day:2, tool:'Claude',      why:'Best at long documents, careful reasoning, refusing unsafe asks.',
      watch:{title:'Anthropic — Intro to Claude',                 url:'https://docs.anthropic.com/en/docs/intro-to-claude'},
      read: {title:'Anthropic Prompting overview',                url:'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview'},
      try:  {title:'Paste a 10-page PDF into claude.ai, ask "summarise + 3 risks"', url:'https://claude.ai/'},
      minutes:15 },
    { day:3, tool:'Gemini',      why:'Strongest in Indian languages + Google ecosystem (Docs/Sheets/Gmail).',
      watch:{title:'Google — Gemini overview',                    url:'https://blog.google/products/gemini/'},
      read: {title:'Gemini for Workspace user guide',             url:'https://workspace.google.com/solutions/ai/'},
      try:  {title:'In Gmail/Docs, click ✨ "Help me write" — try in Hindi/Tamil too', url:'https://gemini.google.com/'},
      minutes:15 },
    { day:4, tool:'Perplexity',  why:'Search engine that cites sources. Kills "hallucinated facts".',
      watch:{title:'Perplexity — How it works',                   url:'https://www.youtube.com/@perplexityai'},
      read: {title:'Perplexity — Citation feature',               url:'https://www.perplexity.ai/hub/about'},
      try:  {title:'Ask "what changed in GST rules in 2025?" — check every citation', url:'https://www.perplexity.ai/'},
      minutes:15 },
    { day:5, tool:'DeepSeek',    why:'Free + open. Strong reasoning. Indian devs love it.',
      watch:{title:'DeepSeek — V3 overview',                      url:'https://www.deepseek.com/'},
      read: {title:'DeepSeek API docs',                           url:'https://api-docs.deepseek.com/'},
      try:  {title:'Open chat.deepseek.com — try "explain backprop like I am 12"', url:'https://chat.deepseek.com/'},
      minutes:15 },
    { day:6, tool:'Microsoft Copilot', why:'AI inside Word, Excel, PowerPoint, Outlook, Teams — already on your PC at work.',
      watch:{title:'MS Copilot — quickstart',                     url:'https://www.microsoft.com/en-us/microsoft-copilot'},
      read: {title:'Copilot Lab — prompts library',               url:'https://copilot.cloud.microsoft/en-us/prompts'},
      try:  {title:'In Excel: "Show me which months had above-average sales"', url:'https://copilot.microsoft.com/'},
      minutes:15 },
    { day:7, tool:'Grok',        why:'Real-time X (Twitter) data + spicy answers. Free for X Premium.',
      watch:{title:'xAI — Grok intro',                            url:'https://x.ai/'},
      read: {title:'Grok How-to (xAI)',                           url:'https://x.ai/grok'},
      try:  {title:'Ask Grok "what is trending in [your industry] today on X"', url:'https://grok.com/'},
      minutes:15 },
  ];

  var TOUR_BUILD_7 = [
    { day:22, tool:'Build #1 — One-page CV revamp',
      why:'Apply Days 1-7 to your own CV. Use ChatGPT to rewrite + Claude to refine + Gemini to translate to your mother tongue.',
      try:{title:'Open ChatGPT — paste current CV + JD you want — "rewrite the CV for this JD"', url:'https://chat.openai.com/'}, minutes:15 },
    { day:23, tool:'Build #2 — Cold outreach email',
      why:'5 personalised cold emails to your dream company. Claude writes, you polish.',
      try:{title:'In Claude: "Write 5 cold outreach emails to hiring managers at [Company X]"', url:'https://claude.ai/'}, minutes:15 },
    { day:24, tool:'Build #3 — Daily-standup automation',
      why:'Use Otter.ai to transcribe + Claude to summarise + Gmail Copilot to send.',
      try:{title:'Otter.ai — record standup, paste transcript into Claude, send via Gmail', url:'https://otter.ai/'}, minutes:15 },
    { day:25, tool:'Build #4 — Auto-generate one social-media post',
      why:'Canva AI + Buffer AI = one post per day for a week without breaking sweat.',
      try:{title:'Canva Magic Studio — make 1 LinkedIn post about your AI journey', url:'https://www.canva.com/magic-studio/'}, minutes:15 },
    { day:26, tool:'Build #5 — Personal knowledge base',
      why:'Notion AI Q&A on all your notes. Or NotebookLM. Pick one.',
      try:{title:'Google NotebookLM — upload your notes, ask questions', url:'https://notebooklm.google.com/'}, minutes:15 },
    { day:27, tool:'Build #6 — A working AI agent',
      why:'Smolagents (HuggingFace) or LangGraph — your first agent that does ONE useful thing.',
      try:{title:'HF Agents Course — build a 1-tool agent', url:'https://huggingface.co/learn/agents-course/unit0/introduction'}, minutes:15 },
    { day:28, tool:'Build #7 — Ship + share your story',
      why:'Write a LinkedIn post: "I learned 21 AI tools in 28 days. Here are the 3 that changed my work." Get certificate.',
      try:{title:'LinkedIn post + tag #ChittiNewsAI — claim your Chitti certificate', url:'https://www.linkedin.com/'}, minutes:15 },
  ];

  // 14-day profession-specific tour (Days 8-21)
  var TOUR_PROFESSION_14 = {
    'software-developer': [
      { day:8,  tool:'Cursor IDE',      why:'AI-native IDE. Codebase-aware completions. Free tier.',
        watch:{title:'Cursor — Get started',                       url:'https://docs.cursor.com/'},
        try:  {title:'Open Cursor, ask Cmd-K to refactor a function in your repo', url:'https://cursor.com/'}, minutes:15 },
      { day:9,  tool:'GitHub Copilot',  why:'40% of code at MS/Google is now AI-assisted. Free for students + open-source.',
        watch:{title:'GitHub Copilot — overview',                  url:'https://docs.github.com/en/copilot/quickstart'},
        try:  {title:'Install Copilot in VS Code, accept 1 multi-line suggestion in your repo', url:'https://github.com/features/copilot'}, minutes:15 },
      { day:10, tool:'v0.dev',          why:'Vercel AI — describe UI in English, get React + Tailwind code.',
        try:  {title:'Build "a pricing-table component, dark mode, 3 tiers" in v0', url:'https://v0.dev/'}, minutes:15 },
      { day:11, tool:'Bolt.new',        why:'Build + deploy a working web app from a single prompt.',
        try:  {title:'Build "a todo list with login" — Bolt deploys it for you', url:'https://bolt.new/'}, minutes:15 },
      { day:12, tool:'LangChain + LangGraph', why:'Standard for building multi-step LLM apps.',
        read:{title:'LangChain Academy intro',                     url:'https://academy.langchain.com/'},
        try: {title:'Walk Lesson 1 — chain ChatGPT to a tool',     url:'https://academy.langchain.com/'}, minutes:15 },
      { day:13, tool:'Ollama',          why:'Run Llama/Qwen/Mistral locally — no API costs, full privacy.',
        try:{title:'Install Ollama → run "ollama run llama3" → ask it a question', url:'https://ollama.com/'}, minutes:15 },
      { day:14, tool:'Hugging Face',    why:'The GitHub for AI models. Spaces = free GPU demos.',
        try:{title:'Sign up at huggingface.co → run 1 Space demo', url:'https://huggingface.co/'}, minutes:15 },
      { day:15, tool:'Replicate',       why:'Run any open-source model via API — 1 line of code.',
        try:{title:'Open replicate.com — run 1 image-generation model', url:'https://replicate.com/'}, minutes:15 },
      { day:16, tool:'Lovable',         why:'AI-built full-stack apps with auth, DB, deploy.',
        try:{title:'Build "a startup landing page with email capture"', url:'https://lovable.dev/'}, minutes:15 },
      { day:17, tool:'CodeRabbit',      why:'AI PR reviewer. Free for open-source.',
        try:{title:'Install CodeRabbit GH App on your repo — get auto-review on next PR', url:'https://www.coderabbit.ai/'}, minutes:15 },
      { day:18, tool:'aider',           why:'AI pair-programmer in your terminal. Used by Linux + curl maintainers.',
        try:{title:'pip install aider-chat → aider --model claude-3-5-sonnet', url:'https://aider.chat/'}, minutes:15 },
      { day:19, tool:'Modal Labs',      why:'Serverless GPU for any model. Free credits.',
        try:{title:'Sign up modal.com — deploy 1 model endpoint', url:'https://modal.com/'}, minutes:15 },
      { day:20, tool:'Weights & Biases', why:'Standard ML experiment tracker. Free for individuals.',
        try:{title:'wandb.ai — Lesson 1 of MLOps course', url:'https://wandb.ai/site/courses'}, minutes:15 },
      { day:21, tool:'DSPy',            why:'Convert prompts into compiled programs. Stanford.',
        try:{title:'dspy.ai — walk first tutorial', url:'https://dspy.ai/'}, minutes:15 },
    ],
    'doctor': [
      { day:8,  tool:'OpenEvidence',   why:'Free, evidence-graded answers from latest clinical literature.', try:{title:'Search 1 clinical query', url:'https://openevidence.com/'}, minutes:15 },
      { day:9,  tool:'Glass.health',   why:'Differential-diagnosis assistant. Used in US hospitals.',         try:{title:'Try one diff-dx case', url:'https://glass.health/'}, minutes:15 },
      { day:10, tool:'Abridge',         why:'Ambient AI scribe — saves 2h/day on notes.',                    try:{title:'Free clinician trial', url:'https://www.abridge.com/'}, minutes:15 },
      { day:11, tool:'Suki AI',         why:'Voice-based note + EHR writer. 7-day free trial.',              try:{title:'Suki demo', url:'https://www.suki.ai/'}, minutes:15 },
      { day:12, tool:'Consensus.app',   why:'Search 200M papers, get evidence-graded answers.',              try:{title:'Search 1 clinical question', url:'https://consensus.app/'}, minutes:15 },
      { day:13, tool:'NCCN Guidelines', why:'Free mobile app — latest oncology + 60 more domains.',          try:{title:'Install NCCN app', url:'https://www.nccn.org/guidelines'}, minutes:15 },
      { day:14, tool:'BHASHINI',        why:'Govt of India — free translation for patient education.',       try:{title:'Translate 1 discharge note', url:'https://bhashini.gov.in/'}, minutes:15 },
      { day:15, tool:'Aidoc',           why:'AI imaging triage — used in 1000+ hospitals.',                  try:{title:'Aidoc demo', url:'https://www.aidoc.com/'}, minutes:15 },
      { day:16, tool:'PathAI',          why:'AI pathology — increases dx accuracy.',                         try:{title:'PathAI demo', url:'https://www.pathai.com/'}, minutes:15 },
      { day:17, tool:'Qure.ai',         why:'Indian — free in govt hospitals. Chest X-ray AI.',              try:{title:'Qure.ai qXR page', url:'https://www.qure.ai/'}, minutes:15 },
      { day:18, tool:'Augmedix',        why:'Real-time ambient scribe via app.',                             try:{title:'Augmedix demo', url:'https://www.augmedix.com/'}, minutes:15 },
      { day:19, tool:'Hippocratic AI',  why:'Voice agent for patient follow-ups.',                           try:{title:'Hippocratic demo', url:'https://www.hippocraticai.com/'}, minutes:15 },
      { day:20, tool:'Tempus AI',       why:'Oncology + genomics decision support.',                         try:{title:'Tempus demo', url:'https://www.tempus.com/'}, minutes:15 },
      { day:21, tool:'NEJM AI',         why:'Weekly digest of AI in clinical practice.',                     try:{title:'Subscribe', url:'https://ai.nejm.org/'}, minutes:15 },
    ],
    'oncologist': [
      { day:8, tool:'OpenEvidence', why:'Latest NCCN guideline Q&A.',   try:{title:'Search "HER2+ MBC first-line"', url:'https://openevidence.com/'}, minutes:15 },
      { day:9, tool:'NCCN Guidelines app', why:'Free, latest, every cancer.', try:{title:'Install NCCN mobile', url:'https://www.nccn.org/guidelines'}, minutes:15 },
      { day:10, tool:'Tempus AI', why:'Genomics + AI treatment matching.', try:{title:'Tempus walkthrough', url:'https://www.tempus.com/'}, minutes:15 },
      { day:11, tool:'PathAI', why:'AI pathology review.', try:{title:'PathAI demo', url:'https://www.pathai.com/'}, minutes:15 },
      { day:12, tool:'Aidoc', why:'AI radiology triage.', try:{title:'Aidoc demo', url:'https://www.aidoc.com/'}, minutes:15 },
      { day:13, tool:'Lunit', why:'AI cancer detection (used in 40+ countries).', try:{title:'Lunit demo', url:'https://www.lunit.io/'}, minutes:15 },
      { day:14, tool:'Qure.ai qXR', why:'Free in Indian govt hospitals.', try:{title:'Try qXR', url:'https://www.qure.ai/'}, minutes:15 },
      { day:15, tool:'Atropos Health', why:'Real-world evidence on demand.', try:{title:'Atropos walkthrough', url:'https://www.atroposhealth.com/'}, minutes:15 },
      { day:16, tool:'PubMed + Claude', why:'Paste 1 paper into Claude, ask "what is the clinical takeaway"', try:{title:'Claude pubmed-paper digest', url:'https://claude.ai/'}, minutes:15 },
      { day:17, tool:'NEJM AI', why:'Weekly oncology AI digest.', try:{title:'Subscribe', url:'https://ai.nejm.org/'}, minutes:15 },
      { day:18, tool:'ESMO + ASCO AI module', why:'Free for members.', try:{title:'ESMO AI module', url:'https://education.esmo.org/'}, minutes:15 },
      { day:19, tool:'Tata Memorial AI', why:'Indian — TMC AI oncology fellowship + decision tools.', try:{title:'TMC AI page', url:'https://tmc.gov.in/'}, minutes:15 },
      { day:20, tool:'IndiaAI Mission', why:'Govt of India — AI grants + research.', try:{title:'IndiaAI portal', url:'https://indiaai.gov.in/'}, minutes:15 },
      { day:21, tool:'Stanford AI in Healthcare', why:'Audit FREE on Coursera.', try:{title:'Enrol audit', url:'https://www.coursera.org/specializations/ai-healthcare'}, minutes:15 },
    ],
    'nurse': [
      { day:8, tool:'Abridge', why:'Ambient scribe for nurse charting.', try:{title:'Abridge clinician trial', url:'https://www.abridge.com/'}, minutes:15 },
      { day:9, tool:'Suki AI', why:'Voice-to-EHR notes.', try:{title:'Suki demo', url:'https://www.suki.ai/'}, minutes:15 },
      { day:10, tool:'Hippocratic AI', why:'Patient follow-up voice agent.', try:{title:'Hippocratic overview', url:'https://www.hippocraticai.com/'}, minutes:15 },
      { day:11, tool:'BHASHINI', why:'Free Indic translation for patient handouts.', try:{title:'Translate 1 handout', url:'https://bhashini.gov.in/'}, minutes:15 },
      { day:12, tool:'ANMOL app', why:'ANM tracking app (Govt of India).', try:{title:'ANMOL', url:'https://anmol.nhp.gov.in/'}, minutes:15 },
      { day:13, tool:'RCH Portal', why:'Mother + child tracking.', try:{title:'RCH portal', url:'https://rch.nhp.gov.in/'}, minutes:15 },
      { day:14, tool:'Augmedix', why:'Real-time ambient scribe.', try:{title:'Augmedix demo', url:'https://www.augmedix.com/'}, minutes:15 },
      { day:15, tool:'Aiva Health', why:'Voice assistant for nurses.', try:{title:'Aiva demo', url:'https://www.aivahealth.com/'}, minutes:15 },
      { day:16, tool:'CDC Epi Info', why:'Free outbreak investigation tool.', try:{title:'Epi Info', url:'https://www.cdc.gov/epiinfo/'}, minutes:15 },
      { day:17, tool:'WHO Academy AI', why:'Free WHO course on AI for Health.', try:{title:'Enrol', url:'https://www.whoacademy.org/'}, minutes:15 },
      { day:18, tool:'Stanford AI in Healthcare', why:'Audit FREE on Coursera.', try:{title:'Enrol audit', url:'https://www.coursera.org/specializations/ai-healthcare'}, minutes:15 },
      { day:19, tool:'ABDM HPR registration', why:'Indian Health Practitioner Registry.', try:{title:'Register', url:'https://hpr.abdm.gov.in/'}, minutes:15 },
      { day:20, tool:'Aidoc (read-only)', why:'AI imaging triage — understand workflow.', try:{title:'Aidoc demo', url:'https://www.aidoc.com/'}, minutes:15 },
      { day:21, tool:'IGNOU Neonatal AI nursing', why:'Indian — affordable PG.', try:{title:'IGNOU', url:'https://ignou.ac.in/'}, minutes:15 },
    ],
    'farmer': [
      { day:8, tool:'Plantix', why:'Camera-based pest/disease ID. 25+ langs.', try:{title:'Install + scan 1 leaf', url:'https://plantix.net/'}, minutes:15 },
      { day:9, tool:'Meghdoot', why:'IMD weather + advisory (free, Govt of India).', try:{title:'Install Meghdoot', url:'https://play.google.com/store/apps/details?id=com.meghdoot'}, minutes:15 },
      { day:10, tool:'AGMARKNET', why:'Real-time mandi prices across India.', try:{title:'Check today\'s prices', url:'https://agmarknet.gov.in/'}, minutes:15 },
      { day:11, tool:'Fasal', why:'AI for FPOs. Free FPO tier.', try:{title:'Fasal signup', url:'https://www.fasal.co/'}, minutes:15 },
      { day:12, tool:'Cropin SmartFarm', why:'Crop monitoring + advisory.', try:{title:'Cropin signup', url:'https://www.cropin.com/'}, minutes:15 },
      { day:13, tool:'DeHaat app', why:'Inputs + advisory + market access.', try:{title:'DeHaat app', url:'https://agrevolution.in/'}, minutes:15 },
      { day:14, tool:'Garuda Aerospace', why:'Drone service operator network.', try:{title:'Garuda overview', url:'https://garudaaerospace.com/'}, minutes:15 },
      { day:15, tool:'Soil Health Card portal', why:'Govt of India — free soil testing.', try:{title:'Portal', url:'https://www.soilhealth.dac.gov.in/'}, minutes:15 },
      { day:16, tool:'e-NAM', why:'Online mandi — sell direct.', try:{title:'Register', url:'https://www.enam.gov.in/'}, minutes:15 },
      { day:17, tool:'mKisan SMS advisory', why:'Free SMS advisory.', try:{title:'Subscribe', url:'https://mkisan.gov.in/'}, minutes:15 },
      { day:18, tool:'KVK Drone Pilot training', why:'DGCA-certified drone licence. FREE.', try:{title:'KVK', url:'https://kvk.icar.gov.in/'}, minutes:15 },
      { day:19, tool:'NABARD FPO portal', why:'Form/grow an FPO with NABARD support.', try:{title:'NABARD', url:'https://www.nabard.org/'}, minutes:15 },
      { day:20, tool:'AgNext', why:'AI for produce quality assessment.', try:{title:'AgNext demo', url:'https://agnext.com/'}, minutes:15 },
      { day:21, tool:'ICAR-IARI AI in Agri', why:'Govt research + extension.', try:{title:'IARI', url:'https://www.iari.res.in/'}, minutes:15 },
    ],
    'teacher': [
      { day:8, tool:'MagicSchool', why:'Auto-generate lesson plans + worksheets.', try:{title:'Generate 1 lesson', url:'https://www.magicschool.ai/'}, minutes:15 },
      { day:9, tool:'Khanmigo', why:'Khan Academy AI tutor for students.', try:{title:'Try Khanmigo', url:'https://www.khanacademy.org/khan-labs'}, minutes:15 },
      { day:10, tool:'Diffit', why:'Differentiate 1 text into 3 reading levels.', try:{title:'Try Diffit', url:'https://web.diffit.me/'}, minutes:15 },
      { day:11, tool:'Curipod', why:'Interactive slide decks with AI.', try:{title:'1 deck in 5 min', url:'https://curipod.com/'}, minutes:15 },
      { day:12, tool:'Quizizz AI', why:'Auto-generate quizzes from any topic.', try:{title:'Make 1 quiz', url:'https://quizizz.com/'}, minutes:15 },
      { day:13, tool:'Brisk Teaching', why:'Browser extension — assess essays.', try:{title:'Install Brisk', url:'https://www.briskteaching.com/'}, minutes:15 },
      { day:14, tool:'Google NotebookLM', why:'Turn notes into podcast + Q&A.', try:{title:'Try NotebookLM', url:'https://notebooklm.google.com/'}, minutes:15 },
      { day:15, tool:'Gamma.app', why:'AI deck generator.', try:{title:'1 lesson deck', url:'https://gamma.app/'}, minutes:15 },
      { day:16, tool:'DIKSHA platform', why:'Govt of India — free AI pedagogy modules.', try:{title:'DIKSHA', url:'https://diksha.gov.in/'}, minutes:15 },
      { day:17, tool:'AICTE Faculty Dev AI', why:'AICTE — free AI training for teachers.', try:{title:'AICTE portal', url:'https://www.aicte-india.org/'}, minutes:15 },
      { day:18, tool:'ISTE GenAI cert', why:'International standard.', try:{title:'ISTE cert', url:'https://iste.org/learn/certifications/iste-certification'}, minutes:15 },
      { day:19, tool:'MS Innovative Educator', why:'Free MS track.', try:{title:'MS Educator', url:'https://education.microsoft.com/en-us/'}, minutes:15 },
      { day:20, tool:'Google Educator Lvl 1', why:'Free Google cert.', try:{title:'Enrol', url:'https://teachercenter.withgoogle.com/'}, minutes:15 },
      { day:21, tool:'Common Sense Education AI', why:'Classroom-ready AI guides.', try:{title:'AI guides', url:'https://www.commonsense.org/education'}, minutes:15 },
    ],
    'lawyer': [
      { day:8, tool:'Indian Kanoon', why:'Free — India case-law search.', try:{title:'Search 1 case', url:'https://indiankanoon.org/'}, minutes:15 },
      { day:9, tool:'Spellbook', why:'AI contract review in Word.', try:{title:'Spellbook trial', url:'https://www.spellbook.legal/'}, minutes:15 },
      { day:10, tool:'Harvey AI', why:'Top BigLaw AI assistant.', try:{title:'Harvey overview', url:'https://www.harvey.ai/'}, minutes:15 },
      { day:11, tool:'CoCounsel (Casetext)', why:'AI legal research.', try:{title:'CoCounsel demo', url:'https://casetext.com/'}, minutes:15 },
      { day:12, tool:'SpotDraft', why:'Indian — CLM with AI.', try:{title:'SpotDraft demo', url:'https://www.spotdraft.com/'}, minutes:15 },
      { day:13, tool:'eCourts India', why:'Track any Indian court case.', try:{title:'eCourts', url:'https://ecourts.gov.in/'}, minutes:15 },
      { day:14, tool:'Manupatra', why:'Indian legal database — free trial.', try:{title:'Manupatra trial', url:'https://www.manupatra.com/'}, minutes:15 },
      { day:15, tool:'Lexis+ AI India', why:'AI-powered case research.', try:{title:'Lexis+ AI', url:'https://www.lexisnexis.com/en-us/products/lexis-plus-ai.page'}, minutes:15 },
      { day:16, tool:'Lawmaker.ai', why:'AI contract drafting.', try:{title:'Lawmaker demo', url:'https://lawmaker.ai/'}, minutes:15 },
      { day:17, tool:'NPTEL Cyber Law', why:'IIT — free PG cert (8 weeks).', try:{title:'Enrol NPTEL', url:'https://nptel.ac.in/'}, minutes:15 },
      { day:18, tool:'LawSikho courses', why:'Indian — specialised AI/legal-tech tracks.', try:{title:'LawSikho', url:'https://lawsikho.com/'}, minutes:15 },
      { day:19, tool:'Stanford CodeX', why:'Top legal-AI research centre.', try:{title:'CodeX', url:'https://law.stanford.edu/codex-the-stanford-center-for-legal-informatics/'}, minutes:15 },
      { day:20, tool:'Cyril Mangaldas tech-law blog', why:'Indian tech-law thought leadership.', try:{title:'Subscribe', url:'https://www.cyrilamarchandblogs.com/'}, minutes:15 },
      { day:21, tool:'NLSIU AI & Law', why:'Top Indian law-school AI track.', try:{title:'NLSIU', url:'https://www.nls.ac.in/'}, minutes:15 },
    ],
    'accountant': [
      { day:8, tool:'Zoho Books AI', why:'AI bookkeeping. Free for <1.5Cr turnover.', try:{title:'Zoho Books', url:'https://www.zoho.com/in/books/'}, minutes:15 },
      { day:9, tool:'ClearTax', why:'AI for GST + ITR filing.', try:{title:'ClearTax', url:'https://cleartax.in/'}, minutes:15 },
      { day:10, tool:'Vic.ai', why:'AI invoice processing.', try:{title:'Vic demo', url:'https://vic.ai/'}, minutes:15 },
      { day:11, tool:'MindBridge AI', why:'AI audit — find anomalies.', try:{title:'MindBridge', url:'https://www.mindbridge.ai/'}, minutes:15 },
      { day:12, tool:'AppZen', why:'AI expense audit.', try:{title:'AppZen demo', url:'https://www.appzen.com/'}, minutes:15 },
      { day:13, tool:'Stampli', why:'AI AP automation.', try:{title:'Stampli', url:'https://www.stampli.com/'}, minutes:15 },
      { day:14, tool:'Datarails', why:'FP&A automation.', try:{title:'Datarails', url:'https://www.datarails.com/'}, minutes:15 },
      { day:15, tool:'Tally Prime AI', why:'India\'s leading ERP — AI features.', try:{title:'Tally AI', url:'https://tallysolutions.com/'}, minutes:15 },
      { day:16, tool:'MS Power BI Copilot', why:'Natural-language data analysis.', try:{title:'Power BI Copilot', url:'https://www.microsoft.com/en-us/power-platform/products/power-bi'}, minutes:15 },
      { day:17, tool:'Bloomberg Tax AI', why:'Pro-grade tax research.', try:{title:'Bloomberg Tax', url:'https://pro.bloombergtax.com/'}, minutes:15 },
      { day:18, tool:'ICAI Big Data + Analytics', why:'ICAI cert for CAs.', try:{title:'ICAI portal', url:'https://www.icai.org/'}, minutes:15 },
      { day:19, tool:'NPTEL AI in Finance', why:'IIT — free 8-week cert.', try:{title:'Enrol NPTEL', url:'https://nptel.ac.in/'}, minutes:15 },
      { day:20, tool:'Wharton AI for Business', why:'Coursera audit FREE.', try:{title:'Audit', url:'https://www.coursera.org/specializations/ai-for-business-wharton'}, minutes:15 },
      { day:21, tool:'NSE Academy AI in Finance', why:'Indian — markets + AI.', try:{title:'NSE Academy', url:'https://nseindia.com/learn'}, minutes:15 },
    ],
    'hr-professional': [
      { day:8, tool:'Lattice AI', why:'AI-powered performance reviews.', try:{title:'Lattice', url:'https://lattice.com/'}, minutes:15 },
      { day:9, tool:'Culture Amp', why:'Engagement + people analytics.', try:{title:'Culture Amp', url:'https://www.cultureamp.com/'}, minutes:15 },
      { day:10, tool:'Visier', why:'People analytics platform.', try:{title:'Visier demo', url:'https://www.visier.com/'}, minutes:15 },
      { day:11, tool:'ChartHop', why:'Org analytics + insights.', try:{title:'ChartHop demo', url:'https://www.charthop.com/'}, minutes:15 },
      { day:12, tool:'Darwinbox', why:'Indian HCM with AI.', try:{title:'Darwinbox demo', url:'https://darwinbox.com/'}, minutes:15 },
      { day:13, tool:'15Five', why:'Continuous performance + AI insights.', try:{title:'15Five', url:'https://www.15five.com/'}, minutes:15 },
      { day:14, tool:'Workday Adaptive', why:'AI workforce planning.', try:{title:'Workday demo', url:'https://www.workday.com/'}, minutes:15 },
      { day:15, tool:'AIHR people-analytics', why:'AIHR primer — free.', try:{title:'AIHR', url:'https://www.aihr.com/'}, minutes:15 },
      { day:16, tool:'Notion AI for HR', why:'Onboarding + policy docs.', try:{title:'Notion AI', url:'https://www.notion.com/product/ai'}, minutes:15 },
      { day:17, tool:'SHRM India AI track', why:'AI in HR specialty cert.', try:{title:'SHRM India', url:'https://www.shrm.org/in'}, minutes:15 },
      { day:18, tool:'LinkedIn Learning HR Analytics', why:'Free with LinkedIn Premium.', try:{title:'LL HR Analytics', url:'https://www.linkedin.com/learning/'}, minutes:15 },
      { day:19, tool:'TISS HR Analytics + AI', why:'Indian PG cert.', try:{title:'TISS', url:'https://www.tiss.edu/'}, minutes:15 },
      { day:20, tool:'XLRI People Analytics', why:'XLRI exec ed.', try:{title:'XLRI', url:'https://www.xlri.ac.in/'}, minutes:15 },
      { day:21, tool:'MS Power BI Copilot for HR', why:'Build 1 HR dashboard with AI.', try:{title:'Power BI', url:'https://www.microsoft.com/en-us/power-platform/products/power-bi'}, minutes:15 },
    ],
    'talent-acquisition': [
      { day:8, tool:'Eightfold AI', why:'AI talent intelligence platform.', try:{title:'Eightfold demo', url:'https://eightfold.ai/'}, minutes:15 },
      { day:9, tool:'hireEZ', why:'AI sourcing — passive candidate finder.', try:{title:'hireEZ', url:'https://hireez.com/'}, minutes:15 },
      { day:10, tool:'SeekOut', why:'Diversity-focused AI sourcing.', try:{title:'SeekOut', url:'https://seekout.com/'}, minutes:15 },
      { day:11, tool:'Paradox Olivia', why:'Conversational AI hiring assistant.', try:{title:'Paradox', url:'https://www.paradox.ai/'}, minutes:15 },
      { day:12, tool:'Fetcher.ai', why:'AI outbound sourcing campaigns.', try:{title:'Fetcher', url:'https://fetcher.ai/'}, minutes:15 },
      { day:13, tool:'HireVue', why:'AI video interviewing.', try:{title:'HireVue', url:'https://www.hirevue.com/'}, minutes:15 },
      { day:14, tool:'Greenhouse ATS', why:'Top ATS — free trial.', try:{title:'Greenhouse', url:'https://www.greenhouse.io/'}, minutes:15 },
      { day:15, tool:'Otter.ai', why:'Auto-transcribe + summarise interviews.', try:{title:'Otter', url:'https://otter.ai/'}, minutes:15 },
      { day:16, tool:'GoodTime AI', why:'Auto-schedule interviews.', try:{title:'GoodTime', url:'https://goodtime.io/'}, minutes:15 },
      { day:17, tool:'Naukri JobSpeak', why:'Indian hiring trends data.', try:{title:'Naukri JobSpeak', url:'https://www.naukri.com/jobspeak'}, minutes:15 },
      { day:18, tool:'LinkedIn Recruiter cert', why:'Free with licence.', try:{title:'LL Recruiter cert', url:'https://learning.linkedin.com/recruiter-certification'}, minutes:15 },
      { day:19, tool:'Recruiting Brainfood', why:'Weekly TA newsletter.', try:{title:'Subscribe', url:'https://recruitingbrainfood.com/'}, minutes:15 },
      { day:20, tool:'SHRM India TA Specialty', why:'AI in TA specialty cert.', try:{title:'SHRM TA', url:'https://www.shrm.org/in'}, minutes:15 },
      { day:21, tool:'Glassdoor India Hiring Trends', why:'Indian benchmarking data.', try:{title:'Glassdoor IN', url:'https://www.glassdoor.co.in/'}, minutes:15 },
    ],
    'business-owner': [
      { day:8, tool:'Canva Magic Studio', why:'AI design for marketing.', try:{title:'Canva AI', url:'https://www.canva.com/magic-studio/'}, minutes:15 },
      { day:9, tool:'Jasper', why:'AI copy generator for ads.', try:{title:'Jasper', url:'https://www.jasper.ai/'}, minutes:15 },
      { day:10, tool:'HubSpot Breeze CRM', why:'AI CRM free tier.', try:{title:'Breeze CRM', url:'https://www.hubspot.com/products/breeze'}, minutes:15 },
      { day:11, tool:'Intercom Fin AI', why:'AI customer support.', try:{title:'Fin AI', url:'https://www.intercom.com/fin'}, minutes:15 },
      { day:12, tool:'Buffer AI', why:'Schedule + auto-generate social posts.', try:{title:'Buffer', url:'https://buffer.com/'}, minutes:15 },
      { day:13, tool:'Klaviyo AI', why:'AI email marketing.', try:{title:'Klaviyo', url:'https://www.klaviyo.com/'}, minutes:15 },
      { day:14, tool:'Synthesia', why:'AI video for marketing.', try:{title:'Synthesia', url:'https://www.synthesia.io/'}, minutes:15 },
      { day:15, tool:'ONDC seller', why:'Indian — sell on ONDC network.', try:{title:'ONDC', url:'https://ondc.org/'}, minutes:15 },
      { day:16, tool:'MS AI Business School', why:'FREE foundational course.', try:{title:'AI Business School', url:'https://www.microsoft.com/en-us/ai/ai-business-school'}, minutes:15 },
      { day:17, tool:'Grow with Google Digital Unlocked', why:'Free certified courses.', try:{title:'Grow with Google', url:'https://grow.google/intl/en_in/'}, minutes:15 },
      { day:18, tool:'NSIC AI for MSME', why:'Govt of India — free MSME programmes.', try:{title:'NSIC', url:'https://www.nsic.co.in/'}, minutes:15 },
      { day:19, tool:'TiE Bangalore AI meetup', why:'Network with AI founders.', try:{title:'TiE Bangalore', url:'https://bangalore.tie.org/'}, minutes:15 },
      { day:20, tool:'Wadhwani Foundation AI for SMB', why:'India-focused SMB AI.', try:{title:'Wadhwani', url:'https://www.wfglobal.org/'}, minutes:15 },
      { day:21, tool:'NASSCOM Startup AI', why:'Indian — startup + AI.', try:{title:'NASSCOM', url:'https://nasscom.in/'}, minutes:15 },
    ],
    'government-employee': [
      { day:8, tool:'BHASHINI', why:'Govt of India — free 22-lang translation.', try:{title:'BHASHINI', url:'https://bhashini.gov.in/'}, minutes:15 },
      { day:9, tool:'Sarvam AI', why:'Indian — vernacular LLM.', try:{title:'Sarvam', url:'https://www.sarvam.ai/'}, minutes:15 },
      { day:10, tool:'iGOT Karmayogi AI', why:'Govt of India — mandatory AI training.', try:{title:'iGOT', url:'https://igotkarmayogi.gov.in/'}, minutes:15 },
      { day:11, tool:'NeGD Saransh', why:'AI summarisation for govt files.', try:{title:'NeGD', url:'https://negd.gov.in/'}, minutes:15 },
      { day:12, tool:'eOffice AI module', why:'AI for file noting + drafting.', try:{title:'eOffice', url:'https://eoffice.gov.in/'}, minutes:15 },
      { day:13, tool:'GeM marketplace AI', why:'AI features for procurement.', try:{title:'GeM', url:'https://gem.gov.in/'}, minutes:15 },
      { day:14, tool:'PFMS AI dashboards', why:'AI for public finance management.', try:{title:'PFMS', url:'https://pfms.nic.in/'}, minutes:15 },
      { day:15, tool:'UMANG app', why:'Citizen service workflows.', try:{title:'UMANG', url:'https://web.umang.gov.in/'}, minutes:15 },
      { day:16, tool:'IndiaAI Mission portal', why:'Govt of India AI strategy.', try:{title:'IndiaAI portal', url:'https://indiaai.gov.in/'}, minutes:15 },
      { day:17, tool:'OECD AI for Public Sector', why:'International framework.', try:{title:'OECD AI', url:'https://oecd.ai/'}, minutes:15 },
      { day:18, tool:'World Bank GovTech AI', why:'GovTech case studies.', try:{title:'World Bank GovTech', url:'https://www.worldbank.org/en/programs/govtech'}, minutes:15 },
      { day:19, tool:'UN DESA AI in Public Admin', why:'UN frameworks.', try:{title:'UN DESA', url:'https://publicadministration.un.org/'}, minutes:15 },
      { day:20, tool:'Harvard Kennedy School AI for Gov', why:'Top exec ed.', try:{title:'Harvard Kennedy', url:'https://www.hks.harvard.edu/'}, minutes:15 },
      { day:21, tool:'ISB Mohali Govt + AI', why:'Indian B-school — public-sector AI track.', try:{title:'ISB', url:'https://www.isb.edu/'}, minutes:15 },
    ],
    'student': [
      { day:8, tool:'GitHub Copilot for Students', why:'FREE for verified students.', try:{title:'Apply', url:'https://education.github.com/pack'}, minutes:15 },
      { day:9, tool:'Google Colab', why:'FREE GPU notebook for ML experiments.', try:{title:'Colab', url:'https://colab.research.google.com/'}, minutes:15 },
      { day:10, tool:'Kaggle', why:'Compete + learn ML — free.', try:{title:'Kaggle Titanic', url:'https://www.kaggle.com/c/titanic'}, minutes:15 },
      { day:11, tool:'Hugging Face Spaces', why:'Deploy your first AI demo for free.', try:{title:'HF Spaces', url:'https://huggingface.co/spaces'}, minutes:15 },
      { day:12, tool:'fast.ai Lesson 1', why:'Best practical DL course. FREE.', try:{title:'Enrol', url:'https://course.fast.ai/'}, minutes:15 },
      { day:13, tool:'Karpathy Zero-to-Hero', why:'Build GPT from scratch.', try:{title:'Zero to Hero', url:'https://karpathy.ai/zero-to-hero.html'}, minutes:15 },
      { day:14, tool:'NPTEL Deep Learning IIT-M', why:'IIT-Madras free course.', try:{title:'NPTEL DL', url:'https://nptel.ac.in/courses/106106184'}, minutes:15 },
      { day:15, tool:'3Blue1Brown Neural Networks', why:'Intuitive math foundations.', try:{title:'3B1B NN', url:'https://www.3blue1brown.com/topics/neural-networks'}, minutes:15 },
      { day:16, tool:'Made With ML', why:'MLOps end-to-end.', try:{title:'Made With ML', url:'https://madewithml.com/'}, minutes:15 },
      { day:17, tool:'IndiaAI Fellowship', why:'₹4 LPA, top Indian institutions.', try:{title:'Apply', url:'https://indiaai.gov.in/'}, minutes:15 },
      { day:18, tool:'NVIDIA AI for All India', why:'FREE for Indian students.', try:{title:'NVIDIA', url:'https://www.nvidia.com/en-in/training/'}, minutes:15 },
      { day:19, tool:'HF Agents Course', why:'Build your first AI agent.', try:{title:'Agents Course', url:'https://huggingface.co/learn/agents-course/'}, minutes:15 },
      { day:20, tool:'DLAI GenAI Specialization', why:'Andrew Ng — audit FREE.', try:{title:'Enrol audit', url:'https://www.deeplearning.ai/short-courses/generative-ai-for-everyone/'}, minutes:15 },
      { day:21, tool:'IIIT-D AIHC PG (career path)', why:'AI in healthcare PG.', try:{title:'IIIT-D AIHC', url:'https://aihc.iiitd.ac.in/'}, minutes:15 },
    ],
  };

  function getToolTour(profession) {
    var mid = TOUR_PROFESSION_14[profession] || TOUR_PROFESSION_14['student'];
    return {
      profession: profession,
      total_days: 28,
      common_7: TOUR_COMMON_7,
      profession_14: mid,
      build_7: TOUR_BUILD_7,
      promise: '15 minutes a day. 28 days. Week 1: you\'ll feel unstoppable. Week 2: you\'ll know more than 90% of your colleagues. Month 1: certificate.',
    };
  }

  // ── L16.6 — SIX CURRICULA REGISTRY (Sire 2026-06-05 PM ship-all-six) ──
  // Each curriculum: { id, name, emoji, days_count, promise, generator(prof) }
  // Generator returns array of day cards using existing TOOL_TOURS data
  // plus a few small additions for phone-only and advanced-build tracks.

  // Sire's 2026-06-05 screenshot — Days 8-18 from Coursiv's "AI Certificate
  // in 28 Days" ad. Real product URLs verified.
  var TOUR_CREATIVE_11 = [
    { day:8,  tool:'Lovable',     why:'Build a full-stack app with auth + DB + deploy from one prompt. AI app builder used by 1M+ devs.',
      watch:{title:'Lovable — Get started',                       url:'https://docs.lovable.dev/'},
      try:  {title:'Build "a landing page for my AI side-project" — deploys instantly', url:'https://lovable.dev/'}, minutes:15 },
    { day:9,  tool:'Manus',       why:'Autonomous AI agent that browses the web, writes code, plans trips, fills forms — without you watching.',
      watch:{title:'Manus — How it works',                        url:'https://manus.im/'},
      try:  {title:'Ask Manus to "research the top 5 AI tools for [your role] + summarise"', url:'https://manus.im/'}, minutes:15 },
    { day:10, tool:'Nano Banana (Gemini Image)', why:'Google\'s fastest image generator — folded into Gemini. State-of-the-art editing + composition.',
      watch:{title:'Gemini Image generation',                     url:'https://gemini.google.com/'},
      try:  {title:'Gemini -> "generate an image of [my pitch deck cover idea]"', url:'https://gemini.google.com/'}, minutes:15 },
    { day:11, tool:'Leonardo AI', why:'Pro-grade image generator. Used by marketing + game-dev teams for assets.',
      watch:{title:'Leonardo AI — Quickstart',                    url:'https://leonardo.ai/learn'},
      try:  {title:'Generate 1 brand-asset image in Leonardo (free 150 tokens/day)', url:'https://leonardo.ai/'}, minutes:15 },
    { day:12, tool:'Meta AI',     why:'Free, fast, conversational. Lives inside WhatsApp + Instagram + Messenger — already on your phone.',
      watch:{title:'Meta AI overview',                            url:'https://www.meta.ai/'},
      try:  {title:'Open WhatsApp -> Meta AI -> ask "what changed in my industry this week?"', url:'https://www.meta.ai/'}, minutes:15 },
    { day:13, tool:'AssemblyAI',  why:'Speech-to-text + speaker-detection API. Powers podcast transcription + meeting analysis.',
      watch:{title:'AssemblyAI — Quickstart',                     url:'https://www.assemblyai.com/docs/'},
      try:  {title:'Use AssemblyAI playground to transcribe any audio file', url:'https://www.assemblyai.com/'}, minutes:15 },
    { day:14, tool:'Canva AI (Magic Studio)', why:'AI design — text-to-image, magic-write, magic-edit, presentations in seconds. FREE tier.',
      watch:{title:'Canva Magic Studio — overview',               url:'https://www.canva.com/magic-studio/'},
      try:  {title:'Generate "an Instagram carousel about my career win" with Magic Studio', url:'https://www.canva.com/magic-studio/'}, minutes:15 },
    { day:15, tool:'Veo 3',       why:'Google DeepMind\'s state-of-the-art text-to-video (now with audio). Coming to consumers via Gemini.',
      watch:{title:'Veo 3 — Google DeepMind',                     url:'https://deepmind.google/technologies/veo/'},
      try:  {title:'Gemini Advanced -> "generate a 10-second video of [your idea]"', url:'https://deepmind.google/technologies/veo/'}, minutes:15 },
    { day:16, tool:'Sora 2',      why:'OpenAI\'s text-to-video. Generate cinema-quality clips from one prompt.',
      watch:{title:'Sora — OpenAI overview',                      url:'https://openai.com/sora'},
      try:  {title:'Open openai.com/sora — generate 1 short clip', url:'https://openai.com/sora'}, minutes:15 },
    { day:17, tool:'Kimi (Moonshot)', why:'Chinese AI lab. 2M-token context window. Free. Strong for long documents.',
      watch:{title:'Kimi overview',                               url:'https://kimi.ai/'},
      try:  {title:'Paste a 200-page PDF into kimi.ai — ask "summarise + 5 risks"', url:'https://kimi.ai/'}, minutes:15 },
    { day:18, tool:'Kling',       why:'Kuaishou (China) — text-to-video competitor to Sora. Strong motion + physics.',
      watch:{title:'Kling AI — Overview',                         url:'https://klingai.com/'},
      try:  {title:'Generate 1 short video at klingai.com', url:'https://klingai.com/'}, minutes:15 },
  ];

  var PHONE_ONLY_5 = [
    { day:1, tool:'ChatGPT mobile app', why:'Same ChatGPT, fully mobile. Voice input works in Hindi/Tamil/Telugu/Bengali too.',
      try:{title:'Install ChatGPT app, tap mic, ask in your mother tongue', url:'https://chat.openai.com/'}, minutes:15 },
    { day:2, tool:'Gemini app',         why:'Google\'s AI in your language — best Indic-lang support on mobile.',
      try:{title:'Install Gemini app, ask "summarise today\'s news in Hindi"', url:'https://gemini.google.com/'}, minutes:15 },
    { day:3, tool:'BHASHINI',           why:'Govt of India — free 22-language translation. Works on basic phones.',
      try:{title:'Install BHASHINI app, translate 1 message from English -> your language', url:'https://bhashini.gov.in/'}, minutes:15 },
    { day:4, tool:'Sarvam AI',          why:'Indian-built LLM. Strongest for vernacular voice + chat.',
      try:{title:'Open sarvam.ai chat — ask anything in your language', url:'https://www.sarvam.ai/'}, minutes:15 },
    { day:5, tool:'WhatsApp + AI bots', why:'Save 91+ WhatsApp AI bots as contacts; chat with AI without any app.',
      try:{title:'Search "WhatsApp Meta AI" — open + start a chat', url:'https://www.whatsapp.com/'}, minutes:15 },
  ];

  var ADVANCED_BUILD_7 = [
    { day:1, tool:'Build A — Production RAG bot',     why:'Combine LangChain + Qdrant + Claude on YOUR own corpus.',
      try:{title:'Walk the LangChain RAG tutorial end-to-end', url:'https://academy.langchain.com/'}, minutes:15 },
    { day:2, tool:'Build B — Multi-tool agent',       why:'Smolagents or LangGraph agent that uses 3+ tools in sequence.',
      try:{title:'HF Agents Course Unit 1', url:'https://huggingface.co/learn/agents-course/unit1/introduction'}, minutes:15 },
    { day:3, tool:'Build C — Fine-tune your own model', why:'LoRA-fine-tune a 3B model on your domain in Colab.',
      try:{title:'Hugging Face PEFT LoRA tutorial', url:'https://huggingface.co/docs/peft/conceptual_guides/lora'}, minutes:15 },
    { day:4, tool:'Build D — Deploy to production',   why:'Ship your agent to Modal Labs or Vercel — public URL.',
      try:{title:'Modal Labs FREE deploy', url:'https://modal.com/'}, minutes:15 },
    { day:5, tool:'Build E — Evaluation harness',     why:'W&B Weave or LangSmith — measure quality, not just vibes.',
      try:{title:'LangSmith eval quickstart', url:'https://docs.smith.langchain.com/'}, minutes:15 },
    { day:6, tool:'Build F — Open-source 1 PR',       why:'Pick any HF Transformers issue tagged "good first issue" + PR it.',
      try:{title:'HF Transformers issues', url:'https://github.com/huggingface/transformers/issues?q=is%3Aopen+is%3Aissue+label%3A%22Good+First+Issue%22'}, minutes:15 },
    { day:7, tool:'Build G — Showcase',               why:'LinkedIn carousel + YouTube short. Tag #ChittiBuilders.',
      try:{title:'LinkedIn post + Gamma deck of your 7 builds', url:'https://gamma.app/'}, minutes:15 },
  ];

  // Sector-to-profession map for Industry Sprint
  var SECTOR_MAP = {
    'healthcare':     ['doctor','oncologist','nurse'],
    'bfsi':           ['accountant','lawyer','business-owner'],
    'public-sector':  ['government-employee','lawyer','accountant'],
    'education':      ['teacher','student'],
    'agritech':       ['farmer','business-owner','government-employee'],
    'tech':           ['software-developer','student'],
    'people':         ['hr-professional','talent-acquisition','business-owner'],
  };

  function _idxClamp(arr, i) { return arr[i % arr.length]; }

  var CURRICULA = [
    {
      id: '28-day-tour', name: '28-Day AI Tool Tour', emoji: '🎓', days_count: 28,
      promise: 'The flagship. 15 min/day for 4 weeks. Week 1 foundation, Weeks 2-3 your role, Week 4 build. Certificate at end.',
      generator: function (prof) {
        var mid = TOUR_PROFESSION_14[prof] || TOUR_PROFESSION_14['student'];
        return TOUR_COMMON_7.concat(mid, TOUR_BUILD_7).map(function (d, i) {
          return Object.assign({}, d, { day: i + 1 });
        });
      },
    },
    {
      id: '18-day-coursiv-match', name: '18-Day Foundation (Creative + LLMs)', emoji: '🎬', days_count: 18,
      promise: 'Covers the 18 tools from the viral "AI Certificate in 28 days" Coursiv ad. Day 1-7 the 7 foundation LLMs, Day 8-18 creative + image + video + speech AI (Lovable / Manus / Nano Banana / Leonardo / Meta AI / AssemblyAI / Canva AI / Veo 3 / Sora 2 / Kimi / Kling).',
      generator: function (prof) {
        return TOUR_COMMON_7.concat(TOUR_CREATIVE_11).map(function (d, i) {
          return Object.assign({}, d, { day: i + 1 });
        });
      },
    },
    {
      id: '7-day-sprint', name: '7-Day AI Sprint', emoji: '🏃', days_count: 7,
      promise: 'Quick wins. The 7 highest-impact tools — 4 universal + 3 role-specific. For busy weeks.',
      generator: function (prof) {
        var mid = TOUR_PROFESSION_14[prof] || TOUR_PROFESSION_14['student'];
        // 4 must-have universals + top 3 profession tools
        var seq = TOUR_COMMON_7.slice(0, 4).concat(mid.slice(0, 3));
        return seq.map(function (d, i) { return Object.assign({}, d, { day: i + 1 }); });
      },
    },
    {
      id: '90-day-pro', name: '90-Day AI Pro', emoji: '🎯', days_count: 90,
      promise: 'Deep mastery. 3 months. Foundation > Profession deep-dive (Level 1, 2, 3 reps) > Build sprint > Advanced agents. Portfolio-ready.',
      generator: function (prof) {
        var mid = TOUR_PROFESSION_14[prof] || TOUR_PROFESSION_14['student'];
        var days = [];
        // Days 1-7: Foundation common
        TOUR_COMMON_7.forEach(function (d) { days.push(d); });
        // Days 8-49: 3 reps of the 14 profession tools (rep1: try, rep2: build with, rep3: teach others)
        ['Use it','Build with it','Automate with it'].forEach(function (level) {
          mid.forEach(function (d) {
            days.push(Object.assign({}, d, {
              tool: d.tool + ' (Level: ' + level + ')',
              why: '[' + level + '] ' + (d.why || ''),
            }));
          });
        });
        // Days 50-56: 7-day build sprint
        TOUR_BUILD_7.forEach(function (d) { days.push(d); });
        // Days 57-77: 21 days advanced — re-iterate top 7 prof tools at expert level, then 7 of build_7 with own data, then last 7 = advanced 7-day build
        mid.slice(0, 7).forEach(function (d) {
          days.push(Object.assign({}, d, {
            tool: d.tool + ' (Expert)',
            why: '[Expert] Integrate this into your daily workflow + measure impact.',
          }));
        });
        TOUR_BUILD_7.forEach(function (d) {
          days.push(Object.assign({}, d, {
            tool: d.tool.replace('Build #', 'Build #v2-'),
            why: '[Reps] Repeat with your own data this time.',
          }));
        });
        ADVANCED_BUILD_7.forEach(function (d) { days.push(d); });
        // Days 78-90: weave in the 11 creative AI tools (image/video/speech/agent)
        TOUR_CREATIVE_11.slice(0, 12).forEach(function (d) {
          days.push(Object.assign({}, d, {
            tool: d.tool + ' (Apply to your role)',
            why: '[Creative AI] Use this on a real ' + (prof ? prof.replace(/-/g, ' ') : 'work') + ' deliverable today.',
          }));
        });
        days.push({ day:90, tool:'Build H — 90-Day Portfolio + Demo Day',
          why:'Write your 90-day story. Tag #ChittiNewsAI #AICareerCoach. Get certificate.',
          try:{title:'Gamma deck + LinkedIn long-form + YouTube reel', url:'https://gamma.app/'}, minutes:15 });
        return days.slice(0, 90).map(function (d, i) { return Object.assign({}, d, { day: i + 1 }); });
      },
    },
    {
      id: '5-day-phone-only', name: '5-Day Phone-Only AI', emoji: '📱', days_count: 5,
      promise: 'For users without laptops. WhatsApp + browser + camera only. Indic-language first. No paid apps.',
      generator: function (prof) {
        return PHONE_ONLY_5.map(function (d, i) { return Object.assign({}, d, { day: i + 1 }); });
      },
    },
    {
      id: '14-day-build', name: '14-Day Build Sprint', emoji: '🛠️', days_count: 14,
      promise: 'For AI-fluent users. 14 ship-able projects. From CV-revamp Day 1 to production RAG-agent Day 14.',
      generator: function (prof) {
        return TOUR_BUILD_7.concat(ADVANCED_BUILD_7).map(function (d, i) { return Object.assign({}, d, { day: i + 1 }); });
      },
    },
    {
      id: 'team-tour', name: 'Team Tour (Manager-led)', emoji: '👥', days_count: 14,
      promise: 'For managers onboarding their team. Days 1-7 everyone does Foundation. Days 8-14 collaborative build. Manager tracks team progress.',
      generator: function (prof) {
        var mid = TOUR_PROFESSION_14[prof] || TOUR_PROFESSION_14['student'];
        var days = TOUR_COMMON_7.slice();
        // Days 8-14: team-collaboration framing for prof tools + final demo
        mid.slice(0, 6).forEach(function (d) {
          days.push(Object.assign({}, d, {
            tool: d.tool + ' (Team Drill)',
            why: '[Team] Each team member tries this tool + shares 1 prompt that worked in standup.',
          }));
        });
        days.push({ day:14, tool:'Team Demo Day', why:'Each team member ships 1 use case. Manager assembles a team-portfolio deck.',
          try:{title:'Gamma — team deck template', url:'https://gamma.app/'}, minutes:15 });
        return days.slice(0, 14).map(function (d, i) { return Object.assign({}, d, { day: i + 1 }); });
      },
    },
    {
      id: 'industry-sprint', name: 'Industry Sprint (21 days)', emoji: '🏢', days_count: 21,
      promise: 'For a whole sector. Cross-pollinate tools across the 3 most-related professions. Healthcare / BFSI / Public Sector / Education / Agritech / Tech / People.',
      generator: function (prof) {
        // Find which sector the profession belongs to
        var sector = null;
        Object.keys(SECTOR_MAP).forEach(function (s) {
          if (SECTOR_MAP[s].indexOf(prof) >= 0 && !sector) sector = s;
        });
        if (!sector) sector = 'tech';
        var profsInSector = SECTOR_MAP[sector];
        var days = TOUR_COMMON_7.slice();    // 7 foundation
        // 14 from the 3 related professions — take top 5/5/4 from each
        var allProfTools = [];
        profsInSector.forEach(function (p, idx) {
          var pTools = (TOUR_PROFESSION_14[p] || []).slice(0, idx === 2 ? 4 : 5);
          pTools.forEach(function (d) {
            allProfTools.push(Object.assign({}, d, {
              tool: d.tool + ' (' + p.replace(/-/g, ' ') + ' lens)',
            }));
          });
        });
        days = days.concat(allProfTools.slice(0, 14));
        return days.slice(0, 21).map(function (d, i) { return Object.assign({}, d, { day: i + 1 }); });
      },
    },
  ];

  function getCurricula() {
    return CURRICULA.map(function (c) {
      return { id: c.id, name: c.name, emoji: c.emoji, days_count: c.days_count, promise: c.promise };
    });
  }
  function getCurriculumDays(id, profession) {
    var c = CURRICULA.filter(function (x) { return x.id === id; })[0];
    if (!c) return [];
    return c.generator(profession || 'student');
  }
  function _curriculumDoneKey(id) { return 'curric_' + id.replace(/[^a-z0-9]/g, '_') + '_days'; }
  function getCurriculumProgress(id, profile) {
    if (!profile) profile = _emptyProfile();
    var key = _curriculumDoneKey(id);
    var done = profile[key] || [];
    var c = CURRICULA.filter(function (x) { return x.id === id; })[0];
    var total = c ? c.days_count : 0;
    var nextDay = 1;
    for (var d = 1; d <= total; d++) { if (done.indexOf(d) < 0) { nextDay = d; break; } if (d === total) nextDay = total + 1; }
    return { id: id, done: done.slice(), done_count: done.length, total: total, next_day: nextDay, certified: total > 0 && done.length >= total };
  }
  function markCurriculumDayDone(id, day) {
    var p = _getProfile() || _emptyProfile();
    var key = _curriculumDoneKey(id);
    if (!p[key]) p[key] = [];
    var n = parseInt(day, 10);
    var c = CURRICULA.filter(function (x) { return x.id === id; })[0];
    var total = c ? c.days_count : 0;
    if (n >= 1 && n <= total && p[key].indexOf(n) < 0) p[key].push(n);
    _setProfile(p);
    return getCurriculumProgress(id, p);
  }
  function getTourDayProgress(profile) {
    if (!profile) profile = _emptyProfile();
    var done = profile.tour_days_done || [];
    var nextDay = 1;
    for (var d = 1; d <= 28; d++) { if (done.indexOf(d) < 0) { nextDay = d; break; } if (d === 28) nextDay = 29; }
    return { done: done.slice(), done_count: done.length, next_day: nextDay, certified: done.length >= 28 };
  }
  function markTourDayDone(day) {
    var p = _getProfile() || _emptyProfile();
    if (!p.tour_days_done) p.tour_days_done = [];
    var n = parseInt(day, 10);
    if (n >= 1 && n <= 28 && p.tour_days_done.indexOf(n) < 0) { p.tour_days_done.push(n); }
    _setProfile(p);
    return getTourDayProgress(p);
  }

  // ── L18 JOBS RADAR — news topic → jobs → certs → tools → project ──
  var JOBS_RADAR_RULES = [
    { keyword:'healthcare ai',   jobs:['Clinical AI specialist','Radiology AI eng','Medical-coding AI'], cert:'WHO Academy AI for Health (FREE)', tool:'Aidoc / Abridge / Suki AI', project:'SOAP-note auto-drafter' },
    { keyword:'radiology',       jobs:['Radiology AI eng','PACS specialist'],                        cert:'Stanford AI in Healthcare (audit FREE)', tool:'Aidoc / Annalise / Lunit', project:'Differential Dx Helper' },
    { keyword:'oncology',        jobs:['Oncology AI fellow','Tumor-board analyst'],                  cert:'Tata Memorial AI Oncology fellowship', tool:'Tempus AI / PathAI', project:'Tumour-board prep automation' },
    { keyword:'legal ai',        jobs:['Legal-tech specialist','Contract review AI eng'],            cert:'NPTEL Cyber Law (FREE)',                tool:'Harvey / CoCounsel / Spellbook', project:'Contract Summarizer' },
    { keyword:'finance ai',      jobs:['AI Finance Analyst','FP&A AI eng'],                          cert:'NPTEL AI in Finance (FREE)',            tool:'Vic.ai / Datarails',  project:'Expense Anomaly Detector' },
    { keyword:'audit',           jobs:['AI Auditor','Continuous-audit specialist'],                  cert:'ICAI Big Data + Analytics',             tool:'MindBridge / AuditBoard', project:'GST/ITR Q&A bot' },
    { keyword:'recruiting',      jobs:['AI Sourcer','TA Lead — automation'],                         cert:'LinkedIn Recruiter Cert (FREE w/ licence)', tool:'Eightfold / hireEZ / SeekOut', project:'Resume → JD Match Scorer' },
    { keyword:'people analytics',jobs:['People-analytics HR','HR Data Lead'],                        cert:'SHRM AI in HR specialty',               tool:'Visier / ChartHop',     project:'People-analytics dashboard' },
    { keyword:'ai in education', jobs:['EdTech AI specialist','Curriculum AI designer'],             cert:'ISTE GenAI in Education',               tool:'MagicSchool / Khanmigo', project:'Lesson Planner' },
    { keyword:'agritech',        jobs:['AgriTech specialist','Drone-service operator'],              cert:'KVK Drone Pilot DGCA (FREE)',           tool:'Plantix / Fasal / Cropin', project:'Crop Disease Advisor' },
    { keyword:'public sector',   jobs:['Govt AI policy lead','Digital-service designer'],            cert:'iGOT Karmayogi AI (FREE)',              tool:'BHASHINI / NeGD Saransh', project:'Multi-lang Citizen Reply Drafter' },
    { keyword:'gen ai',          jobs:['GenAI engineer','LLM Application engineer','AI agent eng'],   cert:'Databricks GenAI Engineer Associate',   tool:'Cursor / Claude / LangGraph', project:'Personal LLM agent' },
    { keyword:'agents',          jobs:['AI Agent engineer','Multi-agent orchestrator'],              cert:'HF Agents Course completion',           tool:'LangGraph / smolagents', project:'Personal LLM agent' },
    { keyword:'rag',             jobs:['RAG engineer','Enterprise-search AI eng'],                   cert:'DLAI RAG short course',                 tool:'Pinecone / Weaviate / Qdrant', project:'Codebase RAG Q&A' },
  ];
  function jobsRadarFor(article) {
    if (!article) return [];
    var hay = ((article.title || '') + ' ' + (article.summary || '') + ' ' + (article.topics || '')).toLowerCase();
    var hits = [];
    JOBS_RADAR_RULES.forEach(function (r) { if (hay.indexOf(r.keyword) >= 0) hits.push(r); });
    return hits;
  }

  // ── L21 TOOL COMPARISON LAB ─────────────────────────────────────────
  var COMPARISONS = [
    { id:'harvey-vs-cocounsel', title:'Harvey vs CoCounsel (for Lawyers)',
      a:'Harvey AI', b:'Casetext CoCounsel',
      dimensions:[
        {dim:'Price',             a:'Enterprise', b:'Starter from INR 2 L/yr'},
        {dim:'Legal Research',    a:'★★★★★',     b:'★★★★'},
        {dim:'Contract Review',   a:'★★★★',       b:'★★★★★'},
        {dim:'India case-law',    a:'Limited',    b:'Limited'},
      ],
      verdicts:{ 'BigLaw / Tier-1':'Harvey', 'Small / mid firms':'CoCounsel', 'India-only practice':'Use Indian Kanoon + Manupatra + Claude' } },
    { id:'gpt-vs-claude-vs-gemini-teachers', title:'ChatGPT vs Claude vs Gemini (for Teachers)',
      a:'ChatGPT', b:'Claude + Gemini',
      dimensions:[
        {dim:'Lesson planning',   a:'★★★★',      b:'Claude ★★★★★ / Gemini ★★★★★'},
        {dim:'Multimodal images', a:'★★★★',      b:'Claude ★★★★ / Gemini ★★★★★'},
        {dim:'Indic languages',   a:'★★★',       b:'Claude ★★★★ / Gemini ★★★★★'},
        {dim:'FREE tier',         a:'Yes',       b:'Claude Yes / Gemini Yes'},
      ],
      verdicts:{ 'Hindi/Tamil teacher':'Gemini', 'STEM teacher':'Claude', 'Arts/Lang teacher':'ChatGPT' } },
    { id:'gpt-vs-claude-vs-gemini-doctors', title:'ChatGPT vs Claude vs Gemini (for Doctors)',
      a:'ChatGPT', b:'Claude + Gemini',
      dimensions:[
        {dim:'Clinical reasoning', a:'★★★★',     b:'Claude ★★★★★ / Gemini ★★★★'},
        {dim:'Citation honesty',   a:'★★★',      b:'Claude ★★★★★ / Gemini ★★★★'},
        {dim:'PubMed search',      a:'★★★',      b:'Claude ★★★★ / Gemini ★★★★★ (Deep Research)'},
      ],
      verdicts:{ 'Differential Dx':'Claude', 'Literature search':'Gemini Deep Research', 'Quick Q&A':'ChatGPT' } },
    { id:'gpt-vs-claude-vs-gemini-hr', title:'ChatGPT vs Claude vs Gemini (for HR)',
      a:'ChatGPT', b:'Claude + Gemini',
      dimensions:[
        {dim:'Policy drafting',   a:'★★★★',     b:'Claude ★★★★★ / Gemini ★★★★'},
        {dim:'Cultural nuance (India)', a:'★★★', b:'Claude ★★★★ / Gemini ★★★★'},
        {dim:'Survey/feedback synthesis', a:'★★★★', b:'Claude ★★★★★ / Gemini ★★★★'},
      ],
      verdicts:{ 'Indian HR policy':'Claude', 'Global HR':'Claude', 'Quick FAQs':'ChatGPT' } },
    { id:'cursor-vs-windsurf', title:'Cursor vs Windsurf (for Developers)',
      a:'Cursor', b:'Windsurf (Codeium)',
      dimensions:[
        {dim:'Codebase context',    a:'★★★★★',  b:'★★★★'},
        {dim:'Agent mode',          a:'★★★★',   b:'★★★★★'},
        {dim:'Price (FREE tier)',   a:'Yes',    b:'Yes (more generous)'},
      ],
      verdicts:{ 'Solo dev':'Cursor', 'Team / agentic tasks':'Windsurf', 'Trying first time':'Either — both FREE tiers' } },
    { id:'eightfold-vs-paradox', title:'Eightfold vs Paradox (for TA)',
      a:'Eightfold AI', b:'Paradox Olivia',
      dimensions:[
        {dim:'AI sourcing',          a:'★★★★★', b:'★★★'},
        {dim:'Conversational hiring', a:'★★★',  b:'★★★★★'},
        {dim:'Indian market fit',     a:'★★★★',  b:'★★★'},
      ],
      verdicts:{ 'Volume hiring':'Paradox', 'Senior + DEI':'Eightfold', 'India SMB':'Naukri Recruiter + Claude' } },
  ];
  function getComparisons() { return COMPARISONS.slice(); }

  // ── L22 FUTURE FORECAST™ — 3-year per-profession trajectory ─────────
  var FORECAST = {
    'software-developer': [
      {year:2026, theme:'Agentic IDEs become default', risk:'Low',    opp:'Very High'},
      {year:2027, theme:'AI-generated entire features ship', risk:'Med', opp:'Very High'},
      {year:2028, theme:'Senior devs become AI orchestrators', risk:'Med', opp:'Very High'},
    ],
    'doctor': [
      {year:2026, theme:'Ambient AI scribes become standard', risk:'Low', opp:'High'},
      {year:2027, theme:'Radiology + path AI triage routine', risk:'Low', opp:'Very High'},
      {year:2028, theme:'CDSS embedded in EHR everywhere',     risk:'Med', opp:'Very High'},
    ],
    'oncologist': [
      {year:2026, theme:'AI tumour-board prep mainstream', risk:'Low', opp:'High'},
      {year:2027, theme:'Genomics + AI treatment matching', risk:'Low', opp:'Very High'},
      {year:2028, theme:'AI predicts immunotherapy response', risk:'Med', opp:'Very High'},
    ],
    'nurse': [
      {year:2026, theme:'Voice-charting eliminates 50% paperwork', risk:'Low', opp:'High'},
      {year:2027, theme:'AI vitals alerts standard in ICU',         risk:'Low', opp:'Very High'},
      {year:2028, theme:'Nurse-informatics becomes promotion track', risk:'Low', opp:'Very High'},
    ],
    'farmer': [
      {year:2026, theme:'Drone spraying spreads to 10% farmers', risk:'Very Low', opp:'High'},
      {year:2027, theme:'AI pest-disease ID universal via phone', risk:'Very Low', opp:'Very High'},
      {year:2028, theme:'Climate-smart agri AI mandatory for subsidies', risk:'Low', opp:'Very High'},
    ],
    'teacher': [
      {year:2026, theme:'AI tutor adoption (Khanmigo) — supplements teaching', risk:'Low',  opp:'High'},
      {year:2027, theme:'Automated grading mainstream',                         risk:'Low',  opp:'Very High'},
      {year:2028, theme:'Personalised curriculum auto-generated',               risk:'Med',  opp:'Very High'},
    ],
    'lawyer': [
      {year:2026, theme:'AI drafts 50% of contracts', risk:'Med', opp:'High'},
      {year:2027, theme:'Junior associates replaced by AI agents', risk:'High', opp:'Med'},
      {year:2028, theme:'AI court-strategy assistants standard',   risk:'Med',  opp:'Very High'},
    ],
    'accountant': [
      {year:2026, theme:'Bookkeeping fully automated for SMBs', risk:'High',      opp:'Med'},
      {year:2027, theme:'Continuous audit replaces sampling',    risk:'Very High', opp:'High'},
      {year:2028, theme:'CAs move into advisory + CFO tracks',   risk:'High',      opp:'Very High'},
    ],
    'hr-professional': [
      {year:2026, theme:'People-analytics becomes table stakes', risk:'Med',  opp:'High'},
      {year:2027, theme:'AI compensation + performance loops',    risk:'Med',  opp:'Very High'},
      {year:2028, theme:'HRBP role redefined around AI insight', risk:'High', opp:'Very High'},
    ],
    'talent-acquisition': [
      {year:2026, theme:'AI sourcing replaces Boolean search',     risk:'High',     opp:'High'},
      {year:2027, theme:'AI conducts first-round interviews',      risk:'High',     opp:'Med'},
      {year:2028, theme:'TA Lead role consolidates 3-5 jobs',      risk:'Very High', opp:'Very High'},
    ],
    'business-owner': [
      {year:2026, theme:'AI cuts 30-40% operating cost', risk:'Low', opp:'Very High'},
      {year:2027, theme:'AI customer support standard',  risk:'Low', opp:'Very High'},
      {year:2028, theme:'Solo founders run 10-person businesses', risk:'Low', opp:'Very High'},
    ],
    'government-employee': [
      {year:2026, theme:'iGOT Karmayogi AI tracks mandatory', risk:'Low', opp:'High'},
      {year:2027, theme:'AI-augmented decision support in files', risk:'Med', opp:'Very High'},
      {year:2028, theme:'Digital-policy officers in every dept',  risk:'Low', opp:'Very High'},
    ],
    'student': [
      {year:2026, theme:'AI tutors standard in college', risk:'Very Low', opp:'Very High'},
      {year:2027, theme:'Portfolio (GitHub + Kaggle + projects) > marks',  risk:'Very Low', opp:'Very High'},
      {year:2028, theme:'AI-native graduates command 2-3x salary premium', risk:'Very Low', opp:'Very High'},
    ],
  };
  function getForecast(profession) { return FORECAST[profession] || []; }

  // ── L17.5 PROMPT LIBRARY — copy-paste prompts per profession ─────────
  var PROMPTS = {
    'software-developer': [
      'Refactor this code into three smaller pure functions and explain the trade-offs.',
      'Given this stack trace, what are the 3 most likely root causes?',
      'Write a step-by-step migration plan from REST to GraphQL for this schema.',
      'Generate a system-design interview answer for "design Uber"; structure: requirements → API → data model → bottlenecks → trade-offs.',
      'Review this PR and surface security risks (OWASP Top-10 lens).',
    ],
    'doctor': [
      'Suggest 3 differential diagnoses for chest pain with fever in a 45-year-old male; include red flags.',
      'Summarise this patient\'s 5-year history into a one-page round handoff.',
      'Compare 3 first-line antihypertensives for a diabetic patient; cite Indian guidelines.',
      'Translate this discharge summary into simple Hindi for the family.',
      'Draft an empathetic explanation of stage-3 cancer diagnosis to the patient.',
    ],
    'oncologist': [
      'Summarise NCCN v2025 first-line therapy for HER2+ metastatic breast cancer.',
      'Given this tumour profile, list 3 immunotherapy candidates + trial citations.',
      'Draft a tumour-board presentation summary for case ID XX (de-identified).',
      'Compare this Indian patient cost-of-care across 3 oncology regimens.',
    ],
    'nurse': [
      'Generate a discharge plan for a 5-year-old with pneumonia, in plain Hindi.',
      'Build a 12-h ICU vitals monitoring checklist for a post-op cardiac patient.',
      'Translate this medication schedule into Tamil for the family.',
      'Draft an empathic explanation of sepsis to the patient\'s relative.',
    ],
    'farmer': [
      'Should I spray today? Conditions: wind 12 km/h, temp 32°C, humidity 70%, cotton crop.',
      'My cotton leaves have yellow spots — what disease? (Will paste a photo.)',
      'Calculate fertiliser cost for 5 acres of paddy in Vidarbha at current mandi rates.',
      'Translate this farming advisory into Marathi.',
    ],
    'teacher': [
      'Create a lesson plan for 8th-grade science on photosynthesis (60 min, ICSE syllabus).',
      'Generate 5 quiz questions on fractions with answer key (Class 6).',
      'Build a differentiated worksheet for 3 reading levels on the same chapter.',
      'Draft a parent-teacher meeting email re: behavioural concern — tone supportive, factual.',
      'Convert this English passage into 3 reading-level variants for differentiated instruction.',
    ],
    'lawyer': [
      'Find Indian case-law on AI copyright infringement; cite court + year.',
      'Draft a data-protection clause for a vendor contract under DPDP 2023.',
      'Summarise this 40-page contract; flag indemnity + termination + IP clauses.',
      'Compare BNS Sec 318 (cheating) vs the old IPC 420 — what changed?',
      'Generate a notice-reply skeleton for a tenant eviction case in Maharashtra.',
    ],
    'accountant': [
      'Analyse this expense report for anomalies (column: amount, vendor, date, category).',
      'Draft an audit programme for revenue recognition under Ind AS 115.',
      'Reconcile this GSTR-2A vs GSTR-3B mismatch and flag risk items.',
      'Generate ITR section-wise input checklist for a salaried + freelance income filer.',
      'Build a 12-month cash-flow projection from these monthly P&Ls.',
    ],
    'hr-professional': [
      'Draft a POSH policy update aligned with 2025 Supreme Court guidance.',
      'Build a compensation benchmark question set for software-eng roles in Bangalore.',
      'Summarise this 600-response engagement survey into 5 themes + recommendations.',
      'Generate an exit-interview question set focused on attrition causes (manager / pay / growth).',
      'Draft a return-to-office communication that anticipates employee concerns.',
    ],
    'talent-acquisition': [
      'Rewrite this Boolean search as a natural-language sourcing prompt.',
      'Score this resume against this JD on a 1-10 scale across 5 dimensions.',
      'Generate 10 behavioural interview questions for a Senior PM role.',
      'Draft a personalised outreach to a passive candidate — short, specific, no-fluff.',
      'Convert this rejection email to one that invites future application.',
    ],
    'business-owner': [
      'Write a customer email replying to a refund request — empathetic, policy-aligned.',
      'Generate a 30-day social-media content calendar for an Indian D2C kurta brand.',
      'Draft a 1-page investor update for a seed-stage SaaS startup.',
      'Build a comparison table: 3 vendor quotes for the same scope; recommend best fit.',
      'Convert this customer review into 3 actionable product improvements.',
    ],
    'government-employee': [
      'Draft an RTI response to this query in plain Hindi within 30-day SLA.',
      'Summarise this 50-page cabinet note into a 1-page executive brief.',
      'Translate this scheme guideline into Tamil for citizen distribution.',
      'Generate a file-noting for approving a tender within GFR 2017 rules.',
      'Draft a press release announcing a new scheme launch (under 250 words).',
    ],
    'student': [
      'Explain backpropagation like I\'m 12 years old; then like I\'m a CS undergrad.',
      'Quiz me on linear algebra fundamentals — 10 Qs, then grade me.',
      'Help me write a SOP for MS in AI at IIT-Madras; I have GPA 8.2 and 1 Kaggle medal.',
      'Build a 24-month roadmap from B.Tech 2nd year to first AI job — month-by-month.',
      'Translate this Karpathy lecture transcript into Hindi for my notes.',
    ],
  };
  function getPrompts(profession) { return PROMPTS[profession] || []; }

  // ── L23 PROFESSION HUB — assemble all 10 sub-sections in one object ─
  function buildHub(profession, profile) {
    if (!profession) profession = (profile && profile.profession) || 'student';
    return {
      profession: profession,
      impact:     aiImpactScore(profession),
      readiness:  aiReadinessScore(profile || _emptyProfile()),
      mission:    getMission(profession, currentWeekOffset()),
      projects:   getProjects(profession),
      prompts:    getPrompts(profession),
      comparisons: COMPARISONS.filter(function(c){
        return c.id.indexOf(profession.split('-')[0]) >= 0
          || c.title.toLowerCase().indexOf(profession.replace(/-/g,' ')) >= 0
          || c.id.indexOf('gpt-vs-claude') >= 0;  // generic LLM comparisons apply to all
      }),
      forecast:   getForecast(profession),
      verdict:    (aiImpactScore(profession) || {}).verdict || '',
    };
  }

  // ── Coach Picks — ONE per skill, scannable Instagram-post format ─────
  // Sire 2026-06-05: "see how I get recommendations vs how u give"
  // Format: { sub, items: [ {skill, url, tag, lang?} ] }
  // sub = visual section header in the UI
  var COACH_PICKS = {
    youtube: {
      title: '📺 YouTube — ONE channel per skill',
      sub:   'Indian + Hindi + global picks. Subscribe + binge.',
      items: [
        {skill:'SQL',                   url:'https://youtube.com/@joeyblue1',        tag:'global'},
        {skill:'SQL (Hindi)',           url:'https://youtube.com/@ApnaCollegeOfficial', tag:'Hindi'},
        {skill:'Excel',                 url:'https://youtube.com/@excelisfun',       tag:'global'},
        {skill:'Statistics',            url:'https://youtube.com/@statquest',        tag:'global'},
        {skill:'Math',                  url:'https://youtube.com/@3blue1brown',      tag:'global'},
        {skill:'Python (Hindi)',        url:'https://youtube.com/@CodeWithHarry',    tag:'Hindi'},
        {skill:'Python (English)',      url:'https://youtube.com/@BroCodez',         tag:'global'},
        {skill:'Java',                  url:'https://youtube.com/@Telusko',          tag:'Indian'},
        {skill:'JavaScript',            url:'https://youtube.com/@Fireship',         tag:'global'},
        {skill:'Web Dev (modern)',      url:'https://youtube.com/@WebDevSimplified', tag:'global'},
        {skill:'Cursor / AI IDE',       url:'https://youtube.com/@t3dotgg',          tag:'global'},
        {skill:'Git',                   url:'https://youtube.com/@NetNinja',         tag:'global'},
        {skill:'Linux',                 url:'https://youtube.com/@LearnLinuxTV',     tag:'global'},
        {skill:'Docker / DevOps',       url:'https://youtube.com/@TechWorldwithNana',tag:'global'},
        {skill:'Kubernetes',            url:'https://youtube.com/@KodeKloud',        tag:'global'},
        {skill:'AWS',                   url:'https://youtube.com/@beabetterdev',     tag:'global'},
        {skill:'Azure',                 url:'https://youtube.com/@JohnSavill',       tag:'global'},
        {skill:'Data Analysis',         url:'https://youtube.com/@AlexTheAnalyst',   tag:'global'},
        {skill:'Data Engineering',      url:'https://youtube.com/@SeattleDataGuy',   tag:'global'},
        {skill:'Machine Learning',      url:'https://youtube.com/@krishnaik06',      tag:'Indian #1'},
        {skill:'Deep Learning',         url:'https://youtube.com/@AndrejKarpathy',   tag:'global GOLD'},
        {skill:'Computer Vision',       url:'https://youtube.com/@sentdex',          tag:'global'},
        {skill:'NLP',                   url:'https://youtube.com/@codebasics',       tag:'Indian'},
        {skill:'Reinforcement Learning',url:'https://youtube.com/@Google_DeepMind',  tag:'global'},
        {skill:'PyTorch',               url:'https://youtube.com/@mrdbourke',        tag:'global'},
        {skill:'TensorFlow',            url:'https://youtube.com/@TensorFlow',       tag:'vendor'},
        {skill:'Generative AI (Hindi)', url:'https://youtube.com/@sunnysavita10',    tag:'Hindi'},
        {skill:'GenAI tools daily',     url:'https://youtube.com/@matthew_berman',   tag:'global'},
        {skill:'LLM from scratch',      url:'https://youtube.com/@AndrejKarpathy',   tag:'global GOLD'},
        {skill:'LangChain / Agents',    url:'https://youtube.com/@LangChain',        tag:'vendor'},
        {skill:'RAG hands-on',          url:'https://youtube.com/@1littlecoder',     tag:'global'},
        {skill:'Open-source LLMs',      url:'https://youtube.com/@AIAnytime',        tag:'Indian'},
        {skill:'Prompt Engineering',    url:'https://youtube.com/@AIJasonZ',         tag:'global'},
        {skill:'AI Agents (local)',     url:'https://youtube.com/@ColeMedin',        tag:'global'},
        {skill:'DS Hindi (100-day ML)', url:'https://youtube.com/@campusx-official', tag:'Hindi'},
        {skill:'All-domain Hindi',      url:'https://youtube.com/@WsCubeTech',       tag:'Hindi'},
        {skill:'Full Data Science',     url:'https://youtube.com/@iNeuroniNtelligence',tag:'Indian'},
        {skill:'University: Stanford',  url:'https://youtube.com/@stanfordonline',   tag:'GOLD'},
        {skill:'University: MIT',       url:'https://youtube.com/@mitocw',           tag:'GOLD'},
        {skill:'University: Harvard CS50',url:'https://youtube.com/@cs50',           tag:'GOLD'},
        {skill:'All-in-one bootcamps',  url:'https://youtube.com/@freecodecamp',     tag:'global GOLD'},
        {skill:'AI paper reviews',      url:'https://youtube.com/@YannicKilcher',    tag:'advanced'},
        {skill:'AI explainer 2-min',    url:'https://youtube.com/@TwoMinutePapers',  tag:'global'},
        {skill:'AI conversations',      url:'https://youtube.com/@lexfridman',       tag:'global'},
        {skill:'Productivity / habits', url:'https://youtube.com/@aliabdaal',        tag:'global'},
      ],
    },
    free_courses: {
      title: '🎓 Free Courses — ONE per skill',
      sub:   'Audit-free or fully open. Bookmark + complete in order.',
      items: [
        {skill:'ML foundations',        url:'https://www.coursera.org/specializations/machine-learning-introduction', tag:'Andrew Ng audit FREE'},
        {skill:'Deep Learning practical',url:'https://course.fast.ai/',              tag:'fast.ai FREE'},
        {skill:'Build LLM from scratch',url:'https://stanford-cs336.github.io/',     tag:'Stanford CS336 FREE'},
        {skill:'Karpathy Zero-to-Hero', url:'https://karpathy.ai/zero-to-hero.html', tag:'GOLD FREE'},
        {skill:'NLP deep',              url:'https://web.stanford.edu/class/cs224n/',tag:'Stanford CS224N FREE'},
        {skill:'Computer Vision',       url:'http://cs231n.stanford.edu/',           tag:'Stanford CS231N FREE'},
        {skill:'Intro to Deep Learning',url:'http://introtodeeplearning.com/',       tag:'MIT 6.S191 FREE'},
        {skill:'Reinforcement Learning',url:'https://huggingface.co/learn/deep-rl-course', tag:'HF FREE'},
        {skill:'HF NLP Course',         url:'https://huggingface.co/learn/nlp-course',     tag:'HF FREE'},
        {skill:'HF Agents Course',      url:'https://huggingface.co/learn/agents-course/unit0/introduction', tag:'HF FREE'},
        {skill:'LangChain Academy',     url:'https://academy.langchain.com/',        tag:'vendor FREE'},
        {skill:'Anthropic Skilljar',    url:'https://anthropic.skilljar.com/',       tag:'vendor FREE'},
        {skill:'Cohere LLM University', url:'https://docs.cohere.com/page/llmu',     tag:'vendor FREE'},
        {skill:'MLOps Zoomcamp',        url:'https://github.com/DataTalksClub/mlops-zoomcamp', tag:'DataTalks FREE'},
        {skill:'LLM Zoomcamp',          url:'https://github.com/DataTalksClub/llm-zoomcamp',   tag:'DataTalks FREE'},
        {skill:'Made With ML',          url:'https://madewithml.com/',               tag:'Goku FREE'},
        {skill:'Kaggle Learn micro',    url:'https://www.kaggle.com/learn',          tag:'FREE 12 courses'},
        {skill:'Google ML Crash Course',url:'https://developers.google.com/machine-learning/crash-course', tag:'Google FREE'},
        {skill:'PyTorch (Bourke 26h)',  url:'https://www.youtube.com/watch?v=Z_ikDlimN6A', tag:'YT FREE'},
        {skill:'TF Developer Cert prep',url:'https://www.tensorflow.org/certificate',tag:'study FREE'},
        {skill:'Harvard CS50P (Python)',url:'https://cs50.harvard.edu/python/',      tag:'Harvard FREE'},
        {skill:'SQL hands-on',          url:'https://mode.com/sql-tutorial/',        tag:'Mode FREE'},
        {skill:'NPTEL Deep Learning',   url:'https://nptel.ac.in/courses/106106184', tag:'IIT Madras FREE'},
        {skill:'NPTEL NLP',             url:'https://nptel.ac.in/courses/106105158', tag:'IIT KGP FREE'},
        {skill:'NPTEL RL',              url:'https://nptel.ac.in/courses/106106143', tag:'IIT Madras FREE'},
        {skill:'For Doctors',           url:'https://www.coursera.org/specializations/ai-healthcare', tag:'Stanford audit FREE'},
        {skill:'For Lawyers',           url:'https://nptel.ac.in/',                  tag:'NPTEL Cyber Law FREE'},
        {skill:'For Teachers',          url:'https://teachercenter.withgoogle.com/certifications', tag:'Google Educator FREE'},
        {skill:'For Accountants',       url:'https://nptel.ac.in/',                  tag:'NPTEL AI in Finance FREE'},
        {skill:'For Farmers',           url:'https://kvk.icar.gov.in/',              tag:'KVK FREE + stipend'},
        {skill:'For Nurses',            url:'https://www.whoacademy.org/',           tag:'WHO Academy FREE'},
        {skill:'For Govt employees',    url:'https://igotkarmayogi.gov.in/',         tag:'iGOT FREE'},
      ],
    },
    corporate: {
      title: '🏢 Corporate AI Academies — ONE entry point each',
      sub:   'Vendor-funded skilling. All FREE or have FREE tiers.',
      items: [
        {skill:'Google Cloud',          url:'https://www.cloudskillsboost.google/paths/118', tag:'GenAI Learning Path FREE'},
        {skill:'Google Career Certs',   url:'https://www.coursera.org/google-career-certificates', tag:'FREE via Karunya/JBEC (India)'},
        {skill:'IBM',                   url:'https://skillsbuild.org/',              tag:'SkillsBuild FREE for students'},
        {skill:'IBM Coursera Pro',      url:'https://www.coursera.org/professional-certificates/ai-engineer', tag:'AI Engineering Pro FREE via Karunya'},
        {skill:'Microsoft',             url:'https://envision.microsoft.com/',       tag:'AI Tour India FREE annual'},
        {skill:'Microsoft Learn',       url:'https://learn.microsoft.com/en-us/training/ai/',    tag:'AI School FREE'},
        {skill:'AWS',                   url:'https://aws.amazon.com/education/awseducate/', tag:'Educate FREE 100hr GPU'},
        {skill:'AWS re/Start',          url:'https://aws.amazon.com/training/restart/', tag:'FREE 12-week bootcamp'},
        {skill:'Meta',                  url:'https://www.coursera.org/professional-certificates/meta-front-end-developer', tag:'FE/BE Pro Certs FREE via Karunya'},
        {skill:'Anthropic',             url:'https://anthropic.skilljar.com/',       tag:'Skilljar FREE + Cookbook'},
        {skill:'OpenAI',                url:'https://academy.openai.com/',           tag:'Academy + Cookbook FREE'},
        {skill:'NVIDIA',                url:'https://learn.nvidia.com/',             tag:'DLI mostly FREE'},
        {skill:'HuggingFace',           url:'https://huggingface.co/learn',          tag:'NLP + Agents FREE'},
        {skill:'Cohere',                url:'https://docs.cohere.com/page/llmu',     tag:'LLM University FREE'},
        {skill:'Mistral',               url:'https://docs.mistral.ai/',              tag:'La Plateforme docs FREE'},
        {skill:'Databricks',            url:'https://www.databricks.com/learn',      tag:'Academy + GenAI Engineer cert'},
        {skill:'Snowflake',             url:'https://learn.snowflake.com/',          tag:'SnowPro study FREE'},
        {skill:'LangChain',             url:'https://academy.langchain.com/',        tag:'Academy FREE'},
        {skill:'LlamaIndex',            url:'https://docs.llamaindex.ai/',           tag:'Bootcamp FREE'},
        {skill:'Pinecone',              url:'https://www.pinecone.io/learn/',        tag:'Vector DB Learning Center FREE'},
        {skill:'Weights & Biases',      url:'https://wandb.ai/site/courses',         tag:'Educator FREE'},
        {skill:'GitHub (for students)', url:'https://education.github.com/pack',     tag:'Copilot Pro FREE'},
      ],
    },
    govt: {
      title: '🇮🇳 Govt Skill India / National AI Programs',
      sub:   'FREE for Indian citizens. Most include stipend on completion.',
      items: [
        {skill:'NASSCOM FutureSkills Prime (AI Foundations)', url:'https://futureskillsprime.in/', tag:'MeitY-funded FREE'},
        {skill:'NIELIT (PG Diploma in AIML)', url:'https://www.nielit.gov.in/', tag:'Govt-subsidised'},
        {skill:'AICTE Train-the-Trainer in AI', url:'https://www.aicte-india.org/', tag:'FREE for AICTE faculty'},
        {skill:'PMKVY 4.0 AI Specialist',     url:'https://www.pmkvyofficial.org/', tag:'FREE + stipend'},
        {skill:'iGOT Karmayogi (govt employees)', url:'https://igotkarmayogi.gov.in/', tag:'FREE mandatory'},
        {skill:'IndiaAI Fellowship (researchers)', url:'https://indiaai.gov.in/',  tag:'FREE + INR 4 LPA stipend'},
        {skill:'IndiaAI Datasets Platform',   url:'https://indiaai.gov.in/datasets', tag:'FREE access'},
        {skill:'IndiaAI Compute (GPU)',       url:'https://indiaai.gov.in/',       tag:'Subsidised'},
        {skill:'MyGov AI for All',            url:'https://www.mygov.in/',         tag:'FREE for citizens'},
        {skill:'ISRO IIRS Geospatial AI',     url:'https://www.iirs.gov.in/EDUSAT-News', tag:'FREE online + cert'},
        {skill:'C-DAC PGDAI / HPC + AI',      url:'https://www.cdac.in/',          tag:'govt rate (low)'},
        {skill:'DRDO Young Scientist (AI)',   url:'https://www.drdo.gov.in/',      tag:'FREE + stipend'},
        {skill:'KVK Drone Pilot (DGCA)',      url:'https://kvk.icar.gov.in/',      tag:'FREE + drone subsidy'},
        {skill:'Skill India Digital',         url:'https://www.skillindiadigital.gov.in/', tag:'FREE'},
        {skill:'Atal Tinkering Labs (schools)',url:'https://aim.gov.in/atl.php',    tag:'FREE for ATL schools'},
        {skill:'NSE Pathshala (finance + AI)', url:'https://www.nseindia.com/learn',tag:'FREE base modules'},
        {skill:'BFSI Sector Skill Council',   url:'https://bfsissc.com/',          tag:'FREE under PMKVY'},
        {skill:'BHASHINI translation (vernacular AI)', url:'https://bhashini.gov.in/', tag:'FREE for citizens'},
      ],
    },
    free_certs: {
      title: '🏅 Free Certifications — ONE per skill (₹0 lifetime)',
      sub:   'Real credentials at zero or near-zero cost. Mark Done in Coach to add to your CV.',
      items: [
        {skill:'AI Foundations cert',   url:'https://futureskillsprime.in/',         tag:'NASSCOM FREE'},
        {skill:'GenAI cert (Indian)',   url:'https://www.coursera.org/learn/generative-ai-for-everyone', tag:'DeepLearning.AI FREE audit'},
        {skill:'NVIDIA DLI badges',     url:'https://learn.nvidia.com/',             tag:'FREE'},
        {skill:'Google Cloud GenAI Leader prep', url:'https://www.cloudskillsboost.google/paths/118', tag:'study FREE'},
        {skill:'Google Career Certs',   url:'https://www.coursera.org/google-career-certificates', tag:'FREE via Karunya'},
        {skill:'IBM SkillsBuild AI badges', url:'https://skillsbuild.org/',         tag:'FREE for students'},
        {skill:'IBM Data Science Pro',  url:'https://www.coursera.org/professional-certificates/ibm-data-science', tag:'FREE via Karunya'},
        {skill:'AWS Cloud Practitioner study', url:'https://aws.amazon.com/training/restart/', tag:'study FREE'},
        {skill:'Anthropic Skilljar badges', url:'https://anthropic.skilljar.com/', tag:'FREE'},
        {skill:'HF Course completion',  url:'https://huggingface.co/learn',          tag:'FREE badge per course'},
        {skill:'DeepLearning.AI short courses', url:'https://www.deeplearning.ai/short-courses/', tag:'70+ FREE'},
        {skill:'Kaggle Learn',          url:'https://www.kaggle.com/learn',          tag:'12 micro-courses FREE'},
        {skill:'fast.ai completion',    url:'https://course.fast.ai/',               tag:'FREE'},
        {skill:'LinkedIn Recruiter Cert',url:'https://learning.linkedin.com/recruiter-certification', tag:'FREE with license'},
        {skill:'Khan Academy Math',     url:'https://www.khanacademy.org/',          tag:'FREE'},
        {skill:'freeCodeCamp Certs',    url:'https://www.freecodecamp.org/',         tag:'FREE (Responsive Web / Data Viz / Python / etc)'},
        {skill:'Google for Education Educator', url:'https://teachercenter.withgoogle.com/certifications', tag:'Self-study FREE'},
        {skill:'Microsoft Innovative Educator (MIE)', url:'https://education.microsoft.com/en-us/', tag:'FREE for educators'},
      ],
    },
    ai_tools: {
      title: '🛠️ AI Tools — ONE per workflow (what replaces the old thing)',
      sub:   'Excel, PPT, Word, Postman, VS Code... AI alternatives that working pros use today.',
      items: [
        {skill:'PowerPoint → AI decks', url:'https://gamma.app/',                    tag:'Gamma.app FREE tier'},
        {skill:'PPT (alt)',             url:'https://tome.app/',                     tag:'Tome'},
        {skill:'Word → AI docs',        url:'https://www.notion.com/product/ai',     tag:'Notion AI'},
        {skill:'Excel → AI analytics',  url:'https://www.microsoft.com/en-us/microsoft-365/copilot', tag:'Power BI + Copilot'},
        {skill:'Excel HR analytics',    url:'https://www.visier.com/',               tag:'Visier'},
        {skill:'Excel finance models',  url:'https://www.datarails.com/',            tag:'Datarails'},
        {skill:'VS Code → AI IDE',      url:'https://cursor.com/',                   tag:'Cursor FREE tier'},
        {skill:'Stack Overflow',        url:'https://www.perplexity.ai/',            tag:'Perplexity'},
        {skill:'Postman',               url:'https://www.usebruno.com/',             tag:'Bruno open-source'},
        {skill:'Boolean recruiter search',url:'https://eightfold.ai/',               tag:'Eightfold AI'},
        {skill:'Recruiter scheduling',  url:'https://goodtime.io/',                  tag:'GoodTime'},
        {skill:'Phone screening',       url:'https://www.paradox.ai/',               tag:'Paradox Olivia'},
        {skill:'CRM data entry',        url:'https://www.hubspot.com/products/breeze',tag:'HubSpot Breeze'},
        {skill:'Email marketing',       url:'https://www.klaviyo.com/',              tag:'Klaviyo AI'},
        {skill:'Customer support L1',   url:'https://www.intercom.com/fin',          tag:'Intercom Fin'},
        {skill:'Social media',          url:'https://buffer.com/',                   tag:'Buffer AI'},
        {skill:'Marketing copy',        url:'https://www.jasper.ai/',                tag:'Jasper'},
        {skill:'AI design',             url:'https://www.canva.com/magic-studio/',   tag:'Canva Magic'},
        {skill:'AI video avatars',      url:'https://www.synthesia.io/',             tag:'Synthesia'},
        {skill:'AI voiceovers',         url:'https://elevenlabs.io/',                tag:'ElevenLabs'},
        {skill:'SOAP notes (doctor)',   url:'https://www.abridge.com/',              tag:'Abridge'},
        {skill:'Radiology triage',      url:'https://www.aidoc.com/',                tag:'Aidoc'},
        {skill:'Westlaw / Lexis (legal)',url:'https://www.harvey.ai/',               tag:'Harvey AI'},
        {skill:'Contract review',       url:'https://www.spellbook.legal/',          tag:'Spellbook'},
        {skill:'Indian Kanoon search',  url:'https://indiankanoon.org/',             tag:'FREE'},
        {skill:'Tally manual entry',    url:'https://vic.ai/',                       tag:'Vic.ai'},
        {skill:'Audit (sampling)',      url:'https://www.mindbridge.ai/',            tag:'MindBridge'},
        {skill:'GST / ITR (Indian)',    url:'https://cleartax.in/',                  tag:'ClearTax + AI'},
        {skill:'Indian SMB accounting', url:'https://www.zoho.com/in/books/',        tag:'Zoho Books AI'},
        {skill:'Teacher lesson plans',  url:'https://www.magicschool.ai/',           tag:'MagicSchool FREE tier'},
        {skill:'AI-tutor for students', url:'https://www.khanacademy.org/khan-labs', tag:'Khanmigo'},
        {skill:'Mandi prices (farmer)', url:'https://agmarknet.gov.in/',             tag:'AGMARKNET FREE govt'},
        {skill:'Weather (farmer)',      url:'https://play.google.com/store/apps/details?id=com.meghdoot', tag:'Meghdoot IMD FREE'},
        {skill:'Pest detection',        url:'https://plantix.net/',                  tag:'Plantix'},
        {skill:'Drone farm',            url:'https://garudaaerospace.com/',          tag:'Garuda / DroneAcharya'},
        {skill:'Govt file processing',  url:'https://eoffice.gov.in/',               tag:'eOffice AI module FREE govt'},
        {skill:'Indic translation',     url:'https://bhashini.gov.in/',              tag:'BHASHINI FREE govt'},
        {skill:'Code review',           url:'https://www.coderabbit.ai/',            tag:'CodeRabbit'},
        {skill:'Local LLM (try-first)', url:'https://ollama.com/',                   tag:'Ollama FREE'},
      ],
    },
  };
  function coachPicks(category) {
    if (category) return COACH_PICKS[category] || null;
    return COACH_PICKS;
  }

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
    coachPicks: coachPicks,
    // COSDF v1.1 — Layers 13-23
    impact: aiImpactScore,
    relevance: chittiExplainsRelevance,
    readiness: aiReadinessScore,
    readinessRoadmap: readinessRoadmap,
    mission: getMission,
    currentWeekOffset: currentWeekOffset,
    projects: getProjects,
    jobsRadar: jobsRadarFor,
    comparisons: getComparisons,
    forecast: getForecast,
    prompts: getPrompts,
    buildHub: buildHub,
    // L16.5 — 28-day tour
    tour: getToolTour,
    tourProgress: getTourDayProgress,
    markTourDayDone: markTourDayDone,
    // L16.6 — 7 curricula (28-day flagship + 18-day Coursiv-match + 7-day sprint + 90-day pro + 5-day phone + 14-day build + team + industry)
    curricula: getCurricula,
    curriculumDays: getCurriculumDays,
    curriculumProgress: getCurriculumProgress,
    markCurriculumDayDone: markCurriculumDayDone,
  };
})();
