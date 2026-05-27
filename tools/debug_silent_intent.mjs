import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const page = await (await b.newContext({ viewport:{width:375,height:812}})).newPage();
await page.goto('http://127.0.0.1:8765/', { waitUntil: 'domcontentloaded' }).catch(()=>{});
await page.evaluate(() => {
  localStorage.setItem('disability_profile', JSON.stringify({ skipped: true }));
  localStorage.setItem('chitti_vaani_consent_given', '1');
});
await page.goto('http://127.0.0.1:8765/chitti_vaani.html', { waitUntil:'networkidle' });
await page.waitForTimeout(2000);
try { await page.locator('#chitti-disability-profile-modal .chitti-dp-close').click({ timeout: 1500 }); } catch(e){}
await page.waitForTimeout(300);

// Test multiple silent variants
const variants = ['Phone silent karo', 'silent karo', 'silent', 'phone silent', 'Phone silent karo!'];
for (const v of variants) {
  const r = await page.evaluate((utt) => {
    // Reset state.
    try {
      window._chittiConfirmInFlight = false;
      const overlay = document.getElementById('chitti-confirm-overlay');
      const q = document.getElementById('chitti-confirm-q');
      if (overlay) overlay.classList.add('hidden');
      if (q) q.textContent = '…';
    } catch(e){}
    const handled = (typeof routeVoiceIntent === 'function') ? routeVoiceIntent(utt) : false;
    const qEl = document.getElementById('chitti-confirm-q');
    const overlay = document.getElementById('chitti-confirm-overlay');
    return {
      utt,
      handled,
      qText: qEl ? qEl.textContent : 'NO_Q_ELEM',
      overlayHidden: overlay ? overlay.classList.contains('hidden') : 'NO_OVERLAY',
      currentLang: typeof CURRENT_LANG !== 'undefined' ? CURRENT_LANG : 'undef',
    };
  }, v);
  console.log(JSON.stringify(r));
}
await b.close();
