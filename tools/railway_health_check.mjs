#!/usr/bin/env node
/**
 * tools/railway_health_check.mjs
 * ───────────────────────────────
 * Hit /health on every Railway service in elegant-radiance (in parallel)
 * + capture response body. Verdict per service: GREEN (200 + JSON-ish body)
 * / RED (anything else) / NO_DOMAIN.
 *
 * Reads $RAILWAY_API_TOKEN. Exit code = number of RED services.
 */
const TOKEN = process.env.RAILWAY_API_TOKEN;
if (!TOKEN) { console.error("RAILWAY_API_TOKEN not set"); process.exit(2); }
const PROJECT_ID = "4247ae58-d5ae-4fa4-be19-80118393351f";

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
          name
          serviceInstances { edges { node { domains { serviceDomains { domain } customDomains { domain } } } } }
        }
      }
    }
  }
}`, { pid: PROJECT_ID });

const services = list.project.services.edges
  .map(e => ({
    name: e.node.name,
    domain: e.node.serviceInstances.edges[0]?.node.domains?.customDomains?.[0]?.domain
         || e.node.serviceInstances.edges[0]?.node.domains?.serviceDomains?.[0]?.domain
         || null,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const probeAll = await Promise.all(services.map(async (s) => {
  if (!s.domain) return { ...s, code: 0, body: "", verdict: "NO_DOMAIN" };
  const url = "https://" + s.domain + "/health";
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 12000);
    const r = await fetch(url, { signal: c.signal });
    clearTimeout(t);
    const body = (await r.text()).slice(0, 120);
    const ok = r.status === 200 && /\{.*ok|true|status/i.test(body);
    return { ...s, code: r.status, body, verdict: ok ? "GREEN" : "RED" };
  } catch (e) {
    return { ...s, code: 0, body: String(e.message), verdict: "RED" };
  }
}));

console.log("\n# Health-check — 15 services\n");
let green = 0, red = 0, noDomain = 0;
for (const p of probeAll) {
  const tag = p.verdict === "GREEN" ? "OK" : (p.verdict === "RED" ? "RED" : "NO_DOMAIN");
  if (p.verdict === "GREEN") green++;
  else if (p.verdict === "RED") red++;
  else noDomain++;
  const url = p.domain ? `https://${p.domain}/health` : "(no domain)";
  console.log(`  [${tag.padEnd(8)}] ${p.name.padEnd(28)} ${p.code} ${url}`);
  if (p.body && p.body.length) console.log(`              body: ${p.body.replace(/\s+/g, " ")}`);
}
console.log(`\n  Summary: ${green} GREEN · ${red} RED · ${noDomain} NO_DOMAIN`);
process.exit(red);
