#!/usr/bin/env node
/**
 * tools/railway_audit.mjs
 * ───────────────────────
 * Single-pass audit of every Railway service in the elegant-radiance
 * project. For each service, prints:
 *   • builder (NIXPACKS / RAILPACK / DOCKERFILE)
 *   • startCommand
 *   • healthcheckPath
 *   • source repo (if any) + auto-deploy trigger
 *   • domain
 *   • current /health status
 *
 * Reads $RAILWAY_API_TOKEN from the environment — never logs the token.
 *
 * Usage:
 *   RAILWAY_API_TOKEN=... node tools/railway_audit.mjs
 */
const TOKEN = process.env.RAILWAY_API_TOKEN;
if (!TOKEN) { console.error("RAILWAY_API_TOKEN not set"); process.exit(2); }
const PROJECT_ID = "4247ae58-d5ae-4fa4-be19-80118393351f"; // elegant-radiance
const ENV_ID     = "3132a518-2bbc-44d3-933d-7c5ea9055f9f"; // production

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

const listQuery = `
query($pid: String!) {
  project(id: $pid) {
    name
    services {
      edges {
        node {
          id
          name
          serviceInstances {
            edges {
              node {
                id
                builder
                buildCommand
                startCommand
                healthcheckPath
                rootDirectory
                source { repo image }
                domains {
                  serviceDomains { domain }
                  customDomains { domain }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

const probe = async (url) => {
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 10000);
    const r = await fetch(url, { signal: c.signal });
    clearTimeout(t);
    let body = ""; try { body = (await r.text()).slice(0, 80); } catch (e) {}
    return { code: r.status, body };
  } catch (e) { return { code: 0, body: String(e.message).slice(0, 80) }; }
};

const data = await gql(listQuery, { pid: PROJECT_ID });
const services = data.project.services.edges.map(e => e.node)
  .sort((a, b) => a.name.localeCompare(b.name));

console.log(`\n# Railway audit — project: ${data.project.name} (${services.length} services)\n`);

const want = [
  "chitti-vaani-api", "chitti-4wheeler-api", "chitti-2wheeler-api",
  "chitti-scanner-api", "chitti-news-api", "chitti-news-ai-api",
  "chitti-medupi-api", "chitti-legal-api", "chitti-voice-factory-api",
  "chitti-government-api", "chitti-ca-api", "chitti-shares-api",
  "chitti-upi-api", "sahayai", "chitti-logo-video-api",
];
const have = new Set(services.map(s => s.name));
console.log("== Coverage ==");
for (const w of want) console.log(`  ${have.has(w) ? "✓" : "✗"} ${w}`);
const extras = services.map(s => s.name).filter(n => !want.includes(n));
if (extras.length) console.log("  extras: " + extras.join(", "));

console.log("\n== Per-service state ==");
const rows = [];
for (const s of services) {
  const inst = s.serviceInstances.edges[0]?.node;
  if (!inst) { rows.push({ name: s.name, note: "no instance" }); continue; }
  const dom = inst.domains?.serviceDomains?.[0]?.domain;
  const url = dom ? `https://${dom}` : null;
  const health = url ? await probe(url + "/health") : { code: "-", body: "no domain" };
  const root  = url ? await probe(url + "/") : { code: "-", body: "no domain" };
  rows.push({
    name: s.name, id: s.id, instId: inst.id,
    builder: inst.builder, root: inst.rootDirectory || "(repo root)",
    start: (inst.startCommand || "").slice(0, 60),
    hcPath: inst.healthcheckPath || "/",
    repo: inst.source?.repo || "(none)", image: inst.source?.image || "",
    url, healthCode: health.code, healthBody: health.body, rootCode: root.code,
  });
}
for (const r of rows) {
  console.log(`\n• ${r.name}`);
  console.log(`    id          ${r.id}`);
  console.log(`    builder     ${r.builder}`);
  console.log(`    root        ${r.root}`);
  console.log(`    start       ${r.start || "(default)"}`);
  console.log(`    healthcheck ${r.hcPath}`);
  console.log(`    repo        ${r.repo}`);
  if (r.image) console.log(`    image       ${r.image}`);
  console.log(`    domain      ${r.url || "(none)"}`);
  console.log(`    /health     ${r.healthCode} ${r.healthBody ? "— " + r.healthBody.replace(/\n/g, " ") : ""}`);
  console.log(`    /           ${r.rootCode}`);
}

// Summary
const greenHealth = rows.filter(r => r.healthCode === 200).length;
const railpack = rows.filter(r => r.builder === "RAILPACK").length;
const nixpacks = rows.filter(r => r.builder === "NIXPACKS").length;
const docker   = rows.filter(r => r.builder === "DOCKERFILE").length;
const linked   = rows.filter(r => r.repo && r.repo !== "(none)").length;
console.log(`\n== Summary ==`);
console.log(`  services:         ${rows.length}`);
console.log(`  /health = 200:    ${greenHealth}`);
console.log(`  builder NIXPACKS: ${nixpacks}`);
console.log(`  builder RAILPACK: ${railpack}`);
console.log(`  builder DOCKERFILE: ${docker}`);
console.log(`  linked to GitHub: ${linked}`);
