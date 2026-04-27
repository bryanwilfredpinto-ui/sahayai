// ═══════════════════════════════════════════════════════════════
// routes/devops/ingestion_runner.js
// All GitHub I/O. NEVER reads/writes files in chat or laptop.
//   - commitFiles(): write scaffolded hat files into repo via Contents API
//   - dispatchIngestion(): trigger .github/workflows/chitti_ingest.yml
//   - pollWorkflow(): poll runs/jobs until conclusion
//   - notifySire(): WhatsApp via routes/whatsapp on completion
// ═══════════════════════════════════════════════════════════════
const log = require('../../lib/logger').forHat('devops_runner');

const OWNER  = process.env.GITHUB_OWNER || 'bryanwilfredpinto-ui';
const REPO   = process.env.GITHUB_REPO  || 'sahayai';
const TOKEN  = process.env.GITHUB_TOKEN;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const WORKFLOW_FILE = 'chitti_ingest.yml';

let _octokit = null;
async function getOctokit() {
  if (_octokit) return _octokit;
  if (!TOKEN) throw new Error('GITHUB_TOKEN env var missing — cannot reach GitHub.');
  const { Octokit } = require('@octokit/rest');
  _octokit = new Octokit({ auth: TOKEN });
  return _octokit;
}

// ── Commit a map of {path: content} to the repo ─────────────────
async function commitFiles(filesMap, commitMessage) {
  const octokit = await getOctokit();
  const results = [];
  for (const [filePath, content] of Object.entries(filesMap)) {
    const contentB64 = Buffer.from(content, 'utf-8').toString('base64');
    // Check if file exists (need sha for update)
    let sha = undefined;
    try {
      const existing = await octokit.repos.getContent({
        owner: OWNER, repo: REPO, path: filePath, ref: BRANCH,
      });
      if (existing && existing.data && existing.data.sha) sha = existing.data.sha;
    } catch (e) {
      if (e.status !== 404) throw e;
    }
    const r = await octokit.repos.createOrUpdateFileContents({
      owner: OWNER, repo: REPO, path: filePath,
      message: commitMessage,
      content: contentB64,
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    });
    results.push({ path: filePath, sha: r.data.content && r.data.content.sha });
    log.info('file_committed', { path: filePath });
  }
  return results;
}

// ── Delete a file (used to remove fake brain.json before push) ──
async function deleteFile(filePath, commitMessage) {
  const octokit = await getOctokit();
  try {
    const existing = await octokit.repos.getContent({
      owner: OWNER, repo: REPO, path: filePath, ref: BRANCH,
    });
    if (!existing.data || !existing.data.sha) return { ok: false, reason: 'not_found' };
    await octokit.repos.deleteFile({
      owner: OWNER, repo: REPO, path: filePath,
      message: commitMessage, sha: existing.data.sha, branch: BRANCH,
    });
    log.info('file_deleted', { path: filePath });
    return { ok: true };
  } catch (e) {
    if (e.status === 404) return { ok: false, reason: 'not_found' };
    throw e;
  }
}

// ── Dispatch GitHub Actions workflow with inputs ────────────────
async function dispatchIngestion({ specialist, ingest_script, sources }) {
  const octokit = await getOctokit();
  await octokit.actions.createWorkflowDispatch({
    owner: OWNER, repo: REPO,
    workflow_id: WORKFLOW_FILE,
    ref: BRANCH,
    inputs: {
      specialist: String(specialist || ''),
      ingest_script: String(ingest_script || ''),
      sources_json: JSON.stringify(sources || []),
    },
  });
  log.info('ingestion_dispatched', { specialist, ingest_script });
  // Find the run we just triggered (most recent for this workflow)
  await sleep(3000);
  const runs = await octokit.actions.listWorkflowRuns({
    owner: OWNER, repo: REPO, workflow_id: WORKFLOW_FILE, per_page: 5,
  });
  const recent = runs.data.workflow_runs && runs.data.workflow_runs[0];
  return {
    dispatched: true,
    run_id: recent ? recent.id : null,
    run_url: recent ? recent.html_url : null,
  };
}

// ── Poll workflow run until it completes (or timeout) ───────────
async function pollWorkflow(runId, { timeoutMs = 30 * 60 * 1000, intervalMs = 30000 } = {}) {
  if (!runId) return { ok: false, reason: 'no_run_id' };
  const octokit = await getOctokit();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const r = await octokit.actions.getWorkflowRun({
      owner: OWNER, repo: REPO, run_id: runId,
    });
    const { status, conclusion, html_url } = r.data;
    log.info('poll_tick', { run_id: runId, status, conclusion });
    if (status === 'completed') {
      return { ok: conclusion === 'success', status, conclusion, html_url };
    }
    await sleep(intervalMs);
  }
  return { ok: false, reason: 'timeout' };
}

// ── Notify Sire via WhatsApp hat (in-process HTTP-equivalent call) ─
async function notifySire(message) {
  // Per HAT_DEPLOYMENT_GUIDE Section 12: hats talk via HTTP, not require().
  // We use axios to localhost so multi-region behavior is identical.
  try {
    const axios = require('axios');
    const port = process.env.PORT || 3000;
    const sire = process.env.SIRE_WHATSAPP;
    if (!sire) {
      log.warn('sire_whatsapp_unset', {});
      return { ok: false, reason: 'SIRE_WHATSAPP unset' };
    }
    await axios.post(`http://localhost:${port}/api/whatsapp/send`, {
      to: sire, message,
    }, { timeout: 8000 });
    return { ok: true };
  } catch (e) {
    log.warn('notify_failed', { error: e.message });
    return { ok: false, error: e.message };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = {
  commitFiles,
  deleteFile,
  dispatchIngestion,
  pollWorkflow,
  notifySire,
  _config: { OWNER, REPO, BRANCH, WORKFLOW_FILE },
};
