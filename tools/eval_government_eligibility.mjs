// tools/eval_government_eligibility.mjs
// Deterministic eligibility eval — runs the same rule-engine logic the backend uses
// (services/government_eligibility.py) against evals/datasets/eligibility_cases.json.
// Pure JS port of the Python predicates so the gold-set runs with zero deps.
// Run: node tools/eval_government_eligibility.mjs
import fs from 'node:fs';
import path from 'node:path';

const seed = JSON.parse(fs.readFileSync(path.resolve('chitti-government/backend/data/schemes_seed.json'),'utf8'));
const cases = JSON.parse(fs.readFileSync(path.resolve('chitti-government/evals/datasets/eligibility_cases.json'),'utf8'));
const bySlug = Object.fromEntries(seed.map(s=>[s.slug,s]));

const intRange = (v,lo,hi)=>{ if(lo==null&&hi==null)return'skip'; if(v==null)return'unknown'; if(lo!=null&&v<lo)return'fail'; if(hi!=null&&v>hi)return'fail'; return'pass'; };
const boolReq  = (req,obs)=>{ if(req==null)return'skip'; if(obs==null)return'unknown'; return req===obs?'pass':'fail'; };
const setReq   = (allowed,obs)=>{ if(!allowed||!allowed.length)return'skip'; if(obs==null||obs==='')return'unknown'; return allowed.includes(obs)?'pass':'fail'; };
const gender   = (sg,obs)=>{ if(sg==null||sg==='any')return'skip'; if(obs==null||obs==='')return'unknown'; return obs===sg?'pass':'fail'; };
const incomeMax= (cap,obs)=>{ if(cap==null)return'skip'; if(obs==null)return'unknown'; return obs<=cap?'pass':'fail'; };
const land     = (mn,mx,obs)=>{ if(mn==null&&mx==null)return'skip'; if(obs==null)return'unknown'; if(mn!=null&&obs<mn)return'fail'; if(mx!=null&&obs>mx)return'fail'; return'pass'; };
const ru       = (req,obs)=>{ if(req==null||req==='both')return'skip'; if(obs==null||obs==='')return'unknown'; return obs===req?'pass':'fail'; };

function evaluate(s,p){
  const r=[];
  if(s.level==='state'&&s.state_code){ const o=(p.state_code||'').toUpperCase().trim(); r.push(!o?'unknown':(o===s.state_code.toUpperCase()?'pass':'fail')); }
  for(const v of [
    intRange(p.age,s.age_min,s.age_max),
    gender(s.gender,p.gender),
    incomeMax(s.income_max_annual_inr,p.income_annual_inr),
    boolReq(s.bpl_required,p.bpl),
    boolReq(s.secc_deprivation_required,p.secc_deprived),
    setReq(s.occupation&&s.occupation.length?s.occupation:null,p.occupation),
    land(s.landholding_min_ha,s.landholding_max_ha,p.landholding_ha),
    setReq(s.caste&&s.caste.length?s.caste:null,p.caste),
    boolReq(s.disability_required,p.disability),
    ru(s.rural_urban,p.rural_urban),
  ]) if(v!=='skip') r.push(v);
  if(!r.length) return'unknown';
  if(r.includes('fail')) return'ineligible';
  if(r.every(x=>x==='pass')) return'eligible';
  if(r.includes('unknown')) return'partial';
  return'eligible';
}

let pass=0, guessToElig=0;
for(const c of cases){
  const s=bySlug[c.scheme];
  if(!s){ console.log('MISS  scheme not in seed:',c.scheme); continue; }
  const got=evaluate(s,c.profile);
  const ok=got===c.expected;
  if(ok)pass++;
  // critical guardrail: a case with a missing input expecting partial must NEVER come back eligible
  if(c.expected==='partial'&&got==='eligible')guessToElig++;
  console.log((ok?'PASS':'FAIL').padEnd(5), c.id.padEnd(13), got.padEnd(11),'| exp',c.expected.padEnd(11), c.note?('· '+c.note):'');
}
console.log(`\nEligibility exact: ${pass}/${cases.length} = ${Math.round(100*pass/cases.length)}%   guess-to-eligible violations: ${guessToElig}`);
process.exit(pass===cases.length&&guessToElig===0?0:1);
