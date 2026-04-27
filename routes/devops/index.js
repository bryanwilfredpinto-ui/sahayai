// ═══════════════════════════════════════════════════════════════
// HAT: devops
// Chitti DevOps — domain-agnostic specialist installer.
// "Deploy Chitti [NAME] from [DOMAIN]" → classify → scaffold →
//  Phase 5a approval → commit to GitHub → dispatch cloud ingestion → notify.
//
// Constitutional rules enforced (per CHITTI_HANDOVER):
//   - GITHUB_TOKEN lives ONLY as Render env var
//   - Ingestion runs on cloud (GitHub Action), NEVER on Sire's laptop
//   - No fake JSON: scaffolded brains have qa_pairs:[] and pillars marked "not yet ingested"
//   - Phase 5a approval gate before commit
//   - Acts on behalf of Sire using Sire's own GitHub via PAT
// ═══════════════════════════════════════════════════════════════
const log = require('../../lib/logger').forHat('devops');
const {
  parseInstallCommand,
  buildPlan,
  scaffoldHat,
} = require('./handlers');
const runner = require('./ingestion_runner');

// In-memory job store (v1; v2 → DB). Job lifecycle:
//   pending_approval → approved → committing → dispatching → ingesting → live | failed
const JOBS = new Map();

function newJobId() {
  return 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

const FALLBACK = {
  en: 'Chitti DevOps is briefly unavailable. Try again in a moment.',
  hi: 'Chitti DevOps सेवा अभी उपलब्ध नहीं है। कुछ देर बाद कोशिश करें।',
  bn: 'Chitti DevOps পরিষেবা সাময়িকভাবে অনুপলব্ধ। একটু পরে চেষ্টা করুন।',
};

module.exports = {
  meta: {
    hat: 'devops',
    version: '1.0.0',
    owner: 'sire',
    description: 'Domain-agnostic specialist installer. Phase-gate protocol enforced.',
    languages: ['*'],
    sla: { p99_ms: 2000, availability: 0.99 },
    pii_tier: 'safe',          // command text only; no user PII flows here
    deepseek_fallback: false,  // deterministic; no LLM in DevOps itself
    graduation_target: null,
    sources: ['domain_rules.json', 'GitHub Contents API', 'GitHub Actions API'],
  },

  register(app, ctx) {

    // ── 1. POST /api/devops/install ─────────────────────────────
    // Body: { command: "Deploy Chitti CA from Tax & GST" }
    // Returns: plan + job_id; awaits Phase 5a approval before any commit.
    app.post('/api/devops/install', async (req, res) => {
      try {
        const { command } = req.body || {};
        const parsed = parseInstallCommand(command);
        if (!parsed.ok) {
          return res.status(400).json({ error: parsed.error });
        }
        const planResult = buildPlan(parsed);
        if (!planResult.ok) {
          return res.status(400).json({ error: planResult.error });
        }
        const job_id = newJobId();
        const job = {
          job_id,
          state: 'pending_approval',
          parsed,
          plan: planResult.plan,
          created_at: new Date().toISOString(),
          history: [{ ts: new Date().toISOString(), state: 'pending_approval' }],
        };
        JOBS.set(job_id, job);
        log.info('install_planned', { job_id, name: parsed.name, category: planResult.plan.category });

        return res.json({
          ok: true,
          job_id,
          state: 'pending_approval',
          phase: '5a_approval_required',
          approve_with: `POST /api/devops/approve/${job_id}  body: { go: true }`,
          plan: planResult.plan,
          honest_note: 'No files committed. No workflow dispatched. Awaiting Sire GO.',
        });
      } catch (err) {
        log.error('install_failed', { error: err.message });
        res.status(503).json({ error: FALLBACK.en, detail: err.message });
      }
    });

    // ── 2. GET /api/devops/status/:job_id ───────────────────────
    app.get('/api/devops/status/:job_id', (req, res) => {
      const job = JOBS.get(req.params.job_id);
      if (!job) return res.status(404).json({ error: 'job_id not found' });
      res.json({
        job_id: job.job_id,
        state: job.state,
        plan: job.plan,
        history: job.history,
        run_url: job.run_url || null,
        error: job.error || null,
      });
    });

    // ── 3. POST /api/devops/approve/:job_id ─────────────────────
    // Body: { go: true }   ← the single Yes/No Phase 5a gate
    app.post('/api/devops/approve/:job_id', async (req, res) => {
      const job = JOBS.get(req.params.job_id);
      if (!job) return res.status(404).json({ error: 'job_id not found' });
      if (job.state !== 'pending_approval') {
        return res.status(409).json({ error: `job is in state '${job.state}', not pending_approval` });
      }
      const go = req.body && req.body.go === true;
      if (!go) {
        job.state = 'cancelled';
        job.history.push({ ts: new Date().toISOString(), state: 'cancelled' });
        return res.json({ ok: true, job_id: job.job_id, state: 'cancelled' });
      }
      // Approved — kick off the rest async, return immediately
      job.state = 'approved';
      job.history.push({ ts: new Date().toISOString(), state: 'approved' });
      res.json({
        ok: true,
        job_id: job.job_id,
        state: 'approved',
        next: `Use GET /api/devops/status/${job.job_id} to follow progress. Sire will be pinged on WhatsApp when ingestion completes.`,
      });
      // Fire-and-forget the deployment pipeline
      runDeployPipeline(job, ctx).catch(err => {
        log.error('pipeline_crashed', { job_id: job.job_id, error: err.message });
        job.state = 'failed';
        job.error = err.message;
        job.history.push({ ts: new Date().toISOString(), state: 'failed', error: err.message });
      });
    });

    // ── 4. GET /api/devops/jobs (debug/inspection) ──────────────
    app.get('/api/devops/jobs', (req, res) => {
      const list = Array.from(JOBS.values()).map(j => ({
        job_id: j.job_id, state: j.state, name: j.plan && j.plan.name, created_at: j.created_at,
      }));
      res.json({ count: list.length, jobs: list });
    });
  },

  fallback: FALLBACK,

  health() {
    const states = {};
    for (const j of JOBS.values()) states[j.state] = (states[j.state] || 0) + 1;
    return {
      ok: true,
      endpoints: [
        'POST /api/devops/install',
        'GET  /api/devops/status/:job_id',
        'POST /api/devops/approve/:job_id',
        'GET  /api/devops/jobs',
      ],
      jobs_total: JOBS.size,
      jobs_by_state: states,
      github_token_present: Boolean(process.env.GITHUB_TOKEN),
    };
  },
};

// ═══════════════════════════════════════════════════════════════
// The deployment pipeline (runs after approval; async)
// ═══════════════════════════════════════════════════════════════
async function runDeployPipeline(job, ctx) {
  const { plan } = job;

  // Phase 5b — scaffold + commit hat files
  job.state = 'committing';
  job.history.push({ ts: new Date().toISOString(), state: 'committing' });
  const files = scaffoldHat(plan);

  // Special case: if installing 'bangla' and the fake brain exists, delete it first
  // (handover Section 5.1 — "Delete routes/bangla/brain.json before pushing real artifacts")
  if (plan.name === 'bangla') {
    try { await runner.deleteFile('routes/bangla/brain.json', 'devops: remove fake brain before real ingestion'); }
    catch (e) { log.warn('delete_fake_skipped', { error: e.message }); }
  }
  const commitMsg = `devops: scaffold ${plan.category} specialist '${plan.name}' [job ${job.job_id}]`;
  await runner.commitFiles(files, commitMsg);

  // Phase 5c — dispatch ingestion workflow (knowledge specialists only)
  if (plan.category === 'knowledge' && plan.ingest_script) {
    job.state = 'dispatching';
    job.history.push({ ts: new Date().toISOString(), state: 'dispatching' });
    const dispatch = await runner.dispatchIngestion({
      specialist: plan.name,
      ingest_script: plan.ingest_script,
      sources: plan.sources_planned,
    });
    job.run_id = dispatch.run_id;
    job.run_url = dispatch.run_url;

    job.state = 'ingesting';
    job.history.push({ ts: new Date().toISOString(), state: 'ingesting', run_url: dispatch.run_url });
    const result = await runner.pollWorkflow(dispatch.run_id);
    if (!result.ok) {
      job.state = 'failed';
      job.error = `ingestion ${result.reason || result.conclusion}`;
      job.history.push({ ts: new Date().toISOString(), state: 'failed', error: job.error });
      await runner.notifySire(`Chitti ${plan.name} install FAILED at ingestion. See ${result.html_url || job.run_url}`);
      return;
    }
  }

  // Phase 5d — live
  job.state = 'live';
  job.history.push({ ts: new Date().toISOString(), state: 'live' });
  await runner.notifySire(`Chitti ${plan.name} is LIVE at /api/${plan.name}/...`);
  log.info('hat_live', { name: plan.name, job_id: job.job_id });
}
