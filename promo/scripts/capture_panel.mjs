// 4K stills of KATHERINE's panel moments (crisp zoom-ins for the promo).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SHOTS = join(resolve('.'), 'public', 'shots');
mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--mute-audio'],
});
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('astro.mentorVoice', '0');
  } catch {}
});
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const panel = page.locator('.holo-panel').first();
const shot = async (name) => {
  await page.screenshot({ path: join(SHOTS, `${name}_4k.png`) });
  await panel.screenshot({ path: join(SHOTS, `${name}_panel.png`) });
  console.log('shot', name);
};

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await wait(1500);
await page.locator('button', { hasText: 'INICIAR CAMPAÑA' }).first().click();
await wait(8000);
await shot('p_briefing');
await page.evaluate(() => {
  window.__katherine.sim().crisisDecision = 'water_priority';
});
await wait(9500);
await shot('p_decision');
await page.locator('button', { hasText: 'Sí, entiendo' }).first().click();
await wait(4500);
await shot('p_quiz');
await page.locator('button', { hasText: 'Quedarse sin aire' }).first().click();
await wait(4500);
await shot('p_correct');
await page.evaluate(() => {
  window.__katherine.sim().co2Ppm = 1500;
});
await wait(5500);
await shot('p_alarm');
await page.evaluate(() => {
  window.__katherine.sim().co2Ppm = 600;
});
await page.locator('button[title="Idioma y voz"]').click();
await wait(900);
await shot('p_settings');
await browser.close();
console.log('DONE');
