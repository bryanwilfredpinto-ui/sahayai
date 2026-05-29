import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('tools/ui_audit_v2', { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const [name, vp] of [
  ['obs_375', { width: 375, height: 812 }],
  ['obs_desktop', { width: 1366, height: 900 }],
]) {
  const ctx = await browser.newContext({ viewport: vp });
  const p = await ctx.newPage();
  await p.goto('https://sahayai.in/chitti_medupi.html?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(()=>{});
  await p.waitForTimeout(7000);
  // Aggressively dismiss any modals/overlays so the badge is visible
  await p.evaluate(() => {
    document.querySelectorAll('[role="dialog"], .chitti-pwd-modal, .chitti-disability-modal').forEach(el => el.remove());
    document.querySelectorAll('[class*="prompt"], [id*="prompt"]').forEach(el => { if (getComputedStyle(el).position === 'fixed') el.remove(); });
  });
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `tools/ui_audit_v2/${name}_fold.png`, fullPage: false });
  // also show audit id from window
  const obsState = await p.evaluate(() => {
    return {
      hasObs: !!window._chittiObs,
      auditId: window._chittiObs ? window._chittiObs.auditId() : null,
      status: window._chittiObs ? window._chittiObs.status : null,
      cardCount: window._chittiObs ? window._chittiObs.cardCount : null,
      badgePresent: !!document.getElementById('chitti-obs-badge'),
    };
  });
  console.log(name, JSON.stringify(obsState));
  await ctx.close();
}
await browser.close();
