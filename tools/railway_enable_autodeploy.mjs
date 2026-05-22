#!/usr/bin/env node
/**
 * tools/railway_enable_autodeploy.mjs
 * ────────────────────────────────────
 * For every Railway service in elegant-radiance, set:
 *   • source.repo = "bryanwilfredpinto-ui/sahayai"
 *   • rootDirectory = "/<chitti-folder>/backend"
 *   • builder = NIXPACKS
 *   • healthcheckPath = "/health"
 *   • startCommand = "gunicorn main:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60"
 *
 * This connects each service to the GitHub repo and triggers auto-deploys
 * on every push to main — no more manual CLI uploads needed.
 *
 * Idempotent — safe to re-run. Reads $RAILWAY_API_TOKEN; never logs it.
 *
 * Usage:
 *   RAILWAY_API_TOKEN=… node tools/railway_enable_autodeploy.mjs [--dry]
 */
const TOKEN = process.env.RAILWAY_API_TOKEN;
if (!TOKEN) { console.error("RAILWAY_API_TOKEN not set"); process.exit(2); }
const DRY = process.argv.includes("--dry");
const PROJECT_ID = "4247ae58-d5ae-4fa4-be19-80118393351f";
const ENV_ID     = "3132a518-2bbc-44d3-933d-7c5ea9055f9f";
const REPO       = "bryanwilfredpinto-ui/sahayai";
const BRANCH     = "main";

// Map every Railway service name → its repo backend folder (from
// chitti-* directory layout). sahayai is the founder backend.
const ROOT = {
  "chitti-vaani-api":          "/chitti-vaani/backend",
  "chitti-2wheeler-api":       "/chitti-2wheeler/backend",
  "chitti-4wheeler-api":       "/chitti-4wheeler/backend",
  "chitti-scanner-api":        "/chitti-scanner/backend",
  "chitti-news-api":           "/chitti-news/backend",
  "chitti-news-ai-api":        "/chitti-news-ai/backend",
  "chitti-medupi-api":         "/chitti-medupi/backend",
  "chitti-legal-api":          "/chitti-legal/backend",
  "chitti-voice-factory-api":  "/chitti-voice-factory/backend",
  "chitti-government-api":     "/chitti-government/backend",
  "chitti-ca-api":             "/chitti-ca/backend",
  "chitti-shares-api":         "/chitti-shares/backend",
  "chitti-upi-api":            "/chitti-upi/backend",
  "sahayai":                   "/chitti-founder/backend",
  "chitti-logo-video-api":     "/chitti-logo-video/backend",
};

async function gql(query, variables = {}) {
  const r = await fetch("https://backboard.railway.com/graphql/v2", {
    method: "POST",
    headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) {
    console.error(JSON.stringify(j.errors, null, 2));
    throw new Error("graphql error");
  }
  return j.data;
}

const list = await gql(`
query($pid: String!) {
  project(id: $pid) {
    services {
      edges {
        node {
          id name
          serviceInstances {
            edges {
              node { id builder rootDirectory startCommand healthcheckPath source { repo } }
            }
          }
        }
      }
    }
  }
}`, { pid: PROJECT_ID });

const services = list.project.services.edges.map(e => e.node);
console.log(`\nFound ${services.length} services in elegant-radiance.\n`);

// Conservative plan: 14/15 services are already serving /health = 200 on
// their current builder (RAILPACK / NIXPACKS). We do NOT change builder
// or startCommand — only set rootDirectory + the GitHub source so future
// pushes auto-deploy. If a service breaks after this, the per-service
// builder/start can be fixed individually.
const wanted = (name) => ({
  rootDirectory: ROOT[name] || null,
  source: { repo: REPO },
});

let updated = 0, skipped = 0, errored = 0;
for (const s of services) {
  if (!ROOT[s.name]) { console.log(`  ⏭️  ${s.name} (no mapping)`); skipped++; continue; }
  const inst = s.serviceInstances.edges[0]?.node;
  if (!inst) { console.log(`  ⏭️  ${s.name} (no instance)`); skipped++; continue; }
  const want = wanted(s.name);
  const needsRepo = (inst.source?.repo || "") !== want.source.repo;
  const needsRoot = (inst.rootDirectory || "") !== want.rootDirectory;
  if (!needsRepo && !needsRoot) { console.log(`  ✓  ${s.name} (already correct)`); skipped++; continue; }
  console.log(`  ▸ ${s.name} (root: ${inst.rootDirectory || "(none)"} → ${want.rootDirectory}, repo: ${inst.source?.repo || "(none)"} → ${want.source.repo})`);
  if (DRY) { skipped++; continue; }
  // Step 1: connect the service to GitHub (deploymentTrigger = GITHUB_PUSH
  // is set automatically when serviceConnect is called with a repo+branch).
  if (needsRepo) {
    try {
      await gql(`
mutation($sid: String!, $repo: String!, $branch: String!) {
  serviceConnect(id: $sid, input: { repo: $repo, branch: $branch }) { id }
}`, { sid: s.id, repo: REPO, branch: BRANCH });
    } catch (e) {
      console.error(`    ✗ serviceConnect failed: ${e.message}`);
      errored++; continue;
    }
  }
  // Step 2: set rootDirectory ONLY. Do not touch builder/startCommand —
  // 14/15 services are currently working with RAILPACK and we don't want
  // to risk breaking them to gain auto-deploy.
  if (needsRoot) {
    try {
      await gql(`
mutation($sid: String!, $eid: String!, $input: ServiceInstanceUpdateInput!) {
  serviceInstanceUpdate(serviceId: $sid, environmentId: $eid, input: $input)
}`, {
        sid: s.id, eid: ENV_ID,
        input: { rootDirectory: want.rootDirectory },
      });
    } catch (e) {
      console.error(`    ✗ serviceInstanceUpdate failed: ${e.message}`);
      errored++; continue;
    }
  }
  updated++;
  console.log(`    ✓ updated`);
}

console.log(`\nDone. updated=${updated} skipped=${skipped} errored=${errored}\n`);
