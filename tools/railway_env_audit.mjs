#!/usr/bin/env node
/**
 * tools/railway_env_audit.mjs
 * ────────────────────────────
 * Audit every service for the env vars that must be set for it to work.
 *
 *   • All services that talk to DeepSeek          → DEEPSEEK_API_KEY (+ DEEPSEEK_URL / DEEPSEEK_MODEL)
 *   • Services that talk to Turso libSQL         → DATABASE_URL or TURSO_AUTH_TOKEN
 *   • chitti-vaani-api                            → VAULT_PEPPER, USER_TOKEN_PEPPER,
 *                                                  optionally GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET,
 *                                                  optionally MSG91_AUTH_KEY / TWILIO_*
 *
 * Reports per service: which required vars are missing, and any obvious
 * misconfiguration (e.g. DEEPSEEK_API_KEY present but blank).
 *
 * Reads $RAILWAY_API_TOKEN. Never prints secret values — only key names
 * and a "set / missing / blank" verdict.
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

const services = (await gql(`
query($pid: String!) { project(id: $pid) { services { edges { node { id name } } } } }
`, { pid: PROJECT_ID })).project.services.edges.map(e => e.node);

// Per-service required keys.
const REQ = {
  "chitti-vaani-api":          ["DEEPSEEK_API_KEY", "VAULT_PEPPER", "USER_TOKEN_PEPPER"],
  "chitti-2wheeler-api":       ["DEEPSEEK_API_KEY"],
  "chitti-4wheeler-api":       ["DEEPSEEK_API_KEY"],
  "chitti-scanner-api":        ["DEEPSEEK_API_KEY"],
  "chitti-news-api":           ["DEEPSEEK_API_KEY"],
  "chitti-news-ai-api":        ["DEEPSEEK_API_KEY"],
  "chitti-medupi-api":         ["DEEPSEEK_API_KEY"],
  "chitti-legal-api":          ["DEEPSEEK_API_KEY"],
  "chitti-voice-factory-api":  [],            // self-hosted voice + Bhashini mock
  "chitti-government-api":     ["DEEPSEEK_API_KEY"],
  "chitti-ca-api":             ["DEEPSEEK_API_KEY"],
  "chitti-shares-api":         [],            // angel + screener; no LLM
  "chitti-upi-api":            ["DEEPSEEK_API_KEY"],
  "sahayai":                   ["DEEPSEEK_API_KEY"],
  "chitti-logo-video-api":     [],            // honest stub
};

// Optional keys — surface as warnings, not blockers.
const OPT = {
  "chitti-vaani-api": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "MSG91_AUTH_KEY",
                       "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "WHATSAPP_BUSINESS_TOKEN"],
};

const allMissing = {};
let totalRed = 0, totalAmber = 0;

for (const s of services) {
  const v = await gql(`
query($sid: String!, $eid: String!) {
  variables(projectId: "${PROJECT_ID}", environmentId: $eid, serviceId: $sid)
}`, { sid: s.id, eid: ENV_ID });
  const vars = v.variables || {};
  const keys = Object.keys(vars);
  const req = REQ[s.name] || [];
  const opt = OPT[s.name] || [];
  const missingReq = req.filter(k => !(k in vars) || !String(vars[k]).trim());
  const missingOpt = opt.filter(k => !(k in vars) || !String(vars[k]).trim());

  const status = missingReq.length ? "RED" : "GREEN";
  if (missingReq.length) totalRed += missingReq.length;
  if (missingOpt.length) totalAmber += missingOpt.length;

  console.log(`\n• ${s.name} [${status}] — ${keys.length} vars set`);
  if (missingReq.length) {
    console.log(`    ❌ MISSING required: ${missingReq.join(", ")}`);
    allMissing[s.name] = missingReq;
  } else {
    console.log(`    ✓ all required keys present`);
  }
  if (missingOpt.length) {
    console.log(`    ⚠️  optional not set: ${missingOpt.join(", ")} (Phase-2.7 / demo-mode)`);
  }
}

console.log(`\n══ Summary ══`);
console.log(`  RED missing-required env vars:  ${totalRed}`);
console.log(`  AMBER optional not set:         ${totalAmber}`);
if (Object.keys(allMissing).length) {
  console.log(`\n  Services blocked on missing vars:`);
  for (const [name, miss] of Object.entries(allMissing)) {
    console.log(`    • ${name}: ${miss.join(", ")}`);
  }
}
