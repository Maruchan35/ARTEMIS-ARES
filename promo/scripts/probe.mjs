// Quick probe: can Edge (headless) render the game's WebGL fast enough for capture?
import { chromium } from 'playwright-core';

const headless = process.argv[2] !== 'headed';
const browser = await chromium.launch({
  channel: 'msedge',
  headless,
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const info = await page.evaluate(async () => {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'n/a';
  let n = 0;
  const t0 = performance.now();
  await new Promise((r) => {
    const tick = () => (performance.now() - t0 < 2000 ? (n++, requestAnimationFrame(tick)) : r());
    requestAnimationFrame(tick);
  });
  return { renderer, fps: Math.round(n / 2) };
});
console.log(headless ? 'headless' : 'headed', JSON.stringify(info));
await page.screenshot({ path: 'public/shots/probe_menu.png' });
await browser.close();
