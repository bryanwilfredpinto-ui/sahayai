#!/usr/bin/env node
/**
 * tools/railway_deploy_status.mjs
 * ────────────────────────────────
 * For each service, print the latest deployment + status. Used to verify
 * that a config change (env var / rootDirectory / builder) actually
 * triggered a successful re-deploy.
 */
const TOKEN = process.env.RAILWAY_API_TOKEN;
if (!TOKEN) { console.error("RAILWAY_API_TOKEN not set"); process.exit(2); }
const PROJECT_ID = "4247ae58-d5ae-4fa4-be19-80118393351f";
const ENV_ID     = "3132a518-2bbc-44d3-933d-7c5ea9055f9f";

async function gql(query, variables = {}) {
  const r = await fetch("https://backboard.railway.com/graphql/v2", {
    method: "POST",
    headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) { console.error(JSON.stringify(j.errors, null, 2)); throw new Error("graphql error"); }
  return j.data;
}

const list = await gql(`
query($pid: String!) {
  project(id: $pid) {
    services {
      edges {
        node {
          name id
          deployments(first: 1) {
            edges { node { id status createdAt staticUrl } }
          }
        }
      }
    }
  }
}`, { pid: PROJECT_ID });

const rows = list.project.services.edges.map(e => ({
  name: e.node.name,
  dep: e.node.deployments.edges[0]?.node || null,
})).sort((a, b) => a.name.localeCompare(b.name));

console.log("\n# Latest deployment status\n");
for (const r of rows) {
  const d = r.dep;
  if (!d) { console.log(`  ${r.name.padEnd(28)} — no deployments`); continue; }
  const since = Math.round((Date.now() - new Date(d.createdAt).getTime()) / 60000);
  console.log(`  ${r.name.padEnd(28)} ${(d.status || "?").padEnd(14)} ${since}m ago  ${d.id}`);
}
