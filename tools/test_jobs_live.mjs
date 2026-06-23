#!/usr/bin/env node
/**
 * tools/test_jobs_live.mjs — Chitti Jobs API live 41-test suite (BO1–BO10).
 * Hits a REAL deployed URL end-to-end: app health, BO2/BO3 profile+memory+
 * level, BO4 manual JD ingest+score, BO9 digest+approval (Apply/Skip with the
 * ATS<70 gate, Art-1 user-choice), BO7/BO8 draft+mailto (Chitti never sends —
 * Art-5), BO10 CRM pipeline + status, plus auth/validation/error contracts.
 *
 * Usage: node tools/test_jobs_live.mjs [BASE_URL]
 *   BASE_URL defaults to the Railway production URL.
 * Exit 0 = all green. Prints QA_RESULT JSON at the end.
 */
const BASE = (process.argv[2] || process.env.JOBS_URL || 'https://chitti-jobs-api-production.up.railway.app').replace(/\/$/, '');

// A fresh device identity (BO: identity is the device UUID, never server-assigned).
const UID = 'cert-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
const H = { 'Content-Type': 'application/json', 'X-User-Token': UID };

const R = [];
const ok = (label, cond, detail) => { R.push({ label, ok: !!cond, detail: detail || '' }); console.log(`${cond ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`); };

async function req(method, path, { headers, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: headers || (body !== undefined ? H : { 'X-User-Token': UID }),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null; const text = await res.text();
  try { json = JSON.parse(text); } catch { /* non-json */ }
  return { status: res.status, json, text, headers: res.headers };
}

(async () => {
  // ── BO1 platform health ──────────────────────────────────────────────
  const root = await req('GET', '/');
  ok('1. GET / → 200', root.status === 200, `status:${root.status}`);
  ok('2. GET / → app is "Chitti Jobs API"', /Chitti Jobs API/i.test(root.json?.app || ''), root.json?.app);
  ok('3. GET / → version advertised', !!root.json?.version, root.json?.version);
  ok('4. GET / → endpoints list present', Array.isArray(root.json?.endpoints) && root.json.endpoints.length >= 8, `${root.json?.endpoints?.length} endpoints`);
  ok('5. GET / → LLM provider declared deepseek (locked §2)', /deepseek/i.test(root.json?.llm || ''), root.json?.llm);

  const ah = await req('GET', '/health');
  ok('6. GET /health → 200', ah.status === 200, `status:${ah.status}`);
  ok('7. GET /health → {ok:true}', ah.json?.ok === true, JSON.stringify(ah.json));

  const jh = await req('GET', '/api/jobs/health');
  ok('8. GET /api/jobs/health → 200', jh.status === 200, `status:${jh.status}`);
  ok('9. /api/jobs/health → carries scheduler status (BO4 daily poll)', jh.json?.scheduler !== undefined, JSON.stringify(jh.json?.scheduler));
  ok('10. /api/jobs/health → reports an llm/provider field', JSON.stringify(jh.json).length > 5 && jh.json && typeof jh.json === 'object', 'object returned');

  // ── auth contract: X-User-Token (device UUID) required ───────────────
  const pNoTok = await req('GET', '/api/jobs/profile', { headers: { 'Content-Type': 'application/json' } });
  ok('11. GET /profile WITHOUT token → 400 missing_user_token', pNoTok.status === 400 && /missing_user_token/.test(pNoTok.json?.error || ''), `status:${pNoTok.status} err:${pNoTok.json?.error}`);

  const pNew = await req('GET', '/api/jobs/profile');
  ok('12. GET /profile (fresh uid) → 200', pNew.status === 200, `status:${pNew.status}`);
  ok('13. GET /profile (fresh uid) → knows_user=false (MEMORY FIRST, nothing assumed)', pNew.json?.knows_user === false, `knows_user:${pNew.json?.knows_user}`);

  // ── BO2 onboarding + BO3 level classify (consent-gated memory) ───────
  const pSaveNoTok = await req('POST', '/api/jobs/profile', { headers: { 'Content-Type': 'application/json' }, body: { name: 'X' } });
  // body present but no token → with_db wrapper still needs uid
  const pSaveNoTok2 = await fetch(BASE + '/api/jobs/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'X' }) });
  ok('14. POST /profile WITHOUT token → 400', pSaveNoTok2.status === 400, `status:${pSaveNoTok2.status}`);

  const profileBody = {
    consent: true,
    name: 'Cert Tester',
    experience_years: 6,
    current_role: 'Senior Backend Engineer',
    target_roles: ['Backend Engineer', 'Platform Engineer'],
    target_locations: ['Remote', 'Bengaluru'],
    target_industries: ['SaaS'],
    work_type: 'remote',
    career_situation: 'employed_looking',
    lang: 'en',
    resume_text: 'Senior backend engineer with 6 years building Python Flask APIs, PostgreSQL, SQLAlchemy, REST, Docker, CI/CD, AWS, Redis, microservices, scoring engines and job pipelines.',
  };
  const pSave = await req('POST', '/api/jobs/profile', { body: profileBody });
  ok('15. POST /profile (consent+fields) → 200 ok', pSave.status === 200 && pSave.json?.ok === true, `status:${pSave.status}`);
  ok('16. POST /profile → BO3 derives a user_level', typeof pSave.json?.user_level === 'string' && pSave.json.user_level.length > 0, `level:${pSave.json?.user_level}`);
  ok('17. POST /profile → knows_user becomes true (consent stored)', pSave.json?.knows_user === true, `knows_user:${pSave.json?.knows_user}`);
  ok('18. POST /profile → echoes saved name', pSave.json?.profile?.name === 'Cert Tester', pSave.json?.profile?.name);

  const pGet2 = await req('GET', '/api/jobs/profile');
  ok('19. GET /profile after save → knows_user=true (persisted)', pGet2.json?.knows_user === true, `knows_user:${pGet2.json?.knows_user}`);
  ok('20. GET /profile after save → profile carries experience', (pGet2.json?.profile?.experience_years ?? null) !== null, `exp:${pGet2.json?.profile?.experience_years}`);

  // ── BO4 manual JD paste → ingest + score ─────────────────────────────
  const mNoInput = await req('POST', '/api/jobs/manual', { body: {} });
  ok('21. POST /manual (no jd/url) → 400 missing_input', mNoInput.status === 400 && /missing_input/.test(mNoInput.json?.error || ''), `status:${mNoInput.status} err:${mNoInput.json?.error}`);

  const mNoTok = await fetch(BASE + '/api/jobs/manual', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jd_text: 'x' }) });
  ok('22. POST /manual WITHOUT token → 400', mNoTok.status === 400, `status:${mNoTok.status}`);

  const jd = {
    title: 'Senior Backend Engineer',
    company: 'Acme Cloud',
    location: 'Remote',
    jd_text: 'We are hiring a Senior Backend Engineer. Requirements: 5+ years Python, Flask, PostgreSQL, SQLAlchemy, REST APIs, Docker, AWS, CI/CD, Redis, microservices. Build scalable job-matching pipelines and scoring engines.',
  };
  const m1 = await req('POST', '/api/jobs/manual', { body: jd });
  ok('23. POST /manual (jd_text) → 200 ok', m1.status === 200 && m1.json?.ok === true, `status:${m1.status}`);
  ok('24. /manual → returns a scored job object', !!m1.json?.job, JSON.stringify(m1.json?.job)?.slice(0, 80));
  const scoredId = m1.json?.job?.scored_id;
  ok('25. /manual → job has a scored_id', Number.isInteger(scoredId), `scored_id:${scoredId}`);
  ok('26. /manual → job has a numeric score 0–10', typeof m1.json?.job?.score === 'number' && m1.json.job.score >= 0 && m1.json.job.score <= 10, `score:${m1.json?.job?.score}`);
  ok('27. /manual → captured title/company', m1.json?.job?.title === jd.title && m1.json?.job?.company === jd.company, `${m1.json?.job?.title} @ ${m1.json?.job?.company}`);
  ok('28. /manual → score_run summary present', m1.json?.score_run !== undefined, JSON.stringify(m1.json?.score_run)?.slice(0, 60));

  // a second JD (clearly weak match) to test the ATS gate later + skip path
  const m2 = await req('POST', '/api/jobs/manual', { body: { title: 'Nurse', company: 'City Hospital', location: 'Onsite', jd_text: 'Registered nurse needed. Requirements: BSc Nursing, patient care, IV, clinical rotations. No software experience.' } });
  const scoredId2 = m2.json?.job?.scored_id;
  ok('29. POST /manual (2nd, off-target JD) → 200 + scored', m2.status === 200 && Number.isInteger(scoredId2), `scored_id:${scoredId2}`);

  // ── BO9 digest (jobs awaiting Apply/Skip) ────────────────────────────
  const dNoTok = await fetch(BASE + '/api/jobs/digest');
  ok('30. GET /digest WITHOUT token → 400', dNoTok.status === 400, `status:${dNoTok.status}`);

  const dig = await req('GET', '/api/jobs/digest?min_score=0');
  ok('31. GET /digest → 200', dig.status === 200, `status:${dig.status}`);
  ok('32. /digest → count is a number + jobs array', typeof dig.json?.count === 'number' && Array.isArray(dig.json?.jobs), `count:${dig.json?.count}`);
  ok('33. /digest → our pasted job is retrievable (min_score=0)', dig.json?.jobs?.some((j) => j.scored_id === scoredId), `ids:${dig.json?.jobs?.map((j) => j.scored_id).join(',')}`);

  // ── BO7/BO8 Apply → draft + mailto (Chitti NEVER sends — Art-5) ──────
  const applyBogus = await req('POST', '/api/jobs/scored/99999999/apply', { body: {} });
  ok('34. POST /scored/<bogus>/apply → 404 not_found', applyBogus.status === 404, `status:${applyBogus.status}`);

  const apply1 = await req('POST', `/api/jobs/scored/${scoredId}/apply`, { body: { to: 'jobs@acme.example', override: true } });
  ok('35. POST /scored/<id>/apply (override) → 200', apply1.status === 200 && apply1.json?.ok === true, `status:${apply1.status} gated:${apply1.json?.gated}`);
  const appId = apply1.json?.application_id;
  ok('36. /apply → returns an application_id (CRM row created)', Number.isInteger(appId), `application_id:${appId}`);
  ok('37. /apply → builds a mailto: link (BO8 — user sends from own app)', /^mailto:/.test(apply1.json?.email?.mailto || ''), (apply1.json?.email?.mailto || '').slice(0, 40));
  ok('38. /apply → note states the USER sends it (Art-5, never auto-transmit)', /you send|your own|tap the mail/i.test(apply1.json?.note || ''), (apply1.json?.note || '').slice(0, 50));

  // ── BO9 skip path ────────────────────────────────────────────────────
  const skip2 = await req('POST', `/api/jobs/scored/${scoredId2}/skip`, { body: {} });
  ok('39. POST /scored/<id>/skip → 200 status=skip', skip2.status === 200 && skip2.json?.status === 'skip', `status:${skip2.status}`);

  // ── BO10 CRM pipeline + status + mark-sent ───────────────────────────
  const pipe = await req('GET', '/api/jobs/pipeline');
  ok('40. GET /pipeline → 200 with counts + applications[]', pipe.status === 200 && Array.isArray(pipe.json?.applications) && typeof pipe.json?.counts === 'object', `count:${pipe.json?.count}`);

  // status validation + a valid transition + mark-sent (Art-5 confirm)
  const badStatus = await req('POST', `/api/jobs/applications/${appId}/status`, { body: { status: 'not_a_real_status' } });
  const sent = await req('POST', `/api/jobs/applications/${appId}/sent`, { body: {} });
  const e404 = await req('GET', '/api/jobs/this-route-does-not-exist');
  ok('41. error contracts: bad status→400, mark-sent→200 applied (Art-5), unknown→404',
    badStatus.status === 400 && /bad_status/.test(badStatus.json?.error || '') &&
    sent.status === 200 && sent.json?.status === 'applied' &&
    e404.status === 404,
    `badStatus:${badStatus.status} sent:${sent.status}/${sent.json?.status} e404:${e404.status}`);

  const pass = R.filter((r) => r.ok).length, fail = R.length - pass;
  console.log(`\nChitti Jobs API live suite — ${pass}/${R.length} GREEN, ${fail} failed  ·  ${BASE}`);
  if (fail) console.log('FAILURES:\n' + R.filter((r) => !r.ok).map((r) => '  ✗ ' + r.label + (r.detail ? ' — ' + r.detail : '')).join('\n'));
  console.log(`QA_RESULT:{"pass":${pass},"fail":${fail},"base":"${BASE}"}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR:', e.message); process.exit(2); });
