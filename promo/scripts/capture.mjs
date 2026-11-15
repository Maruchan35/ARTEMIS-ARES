// Captures real AETHER-4 footage for the promo: 1080p stills + screencast clips (GPU Edge, headless).
// Usage: node scripts/capture.mjs   (game dev server on :5174, mentor bridge on :8765 for the voice/RAG label)
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = resolve('.');
const SHOTS = join(ROOT, 'public', 'shots');
const CLIPS = join(ROOT, 'public', 'clips');
const FRAMES = join(ROOT, '.frames');
// Remotion's bundled ffmpeg (called directly: no shell, so paths with spaces are safe).
const FFMPEG = join(ROOT, 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe');
for (const d of [SHOTS, CLIPS, FRAMES]) mkdirSync(d, { recursive: true });

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
});
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
// KATHERINE voice off during capture (no audio in the clips anyway) and default HD voice prefs.
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('astro.mentorVoice', '0');
  } catch {}
});
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const still = async (name) => {
  await page.screenshot({ path: join(SHOTS, `${name}.png`) });
  console.log('still', name);
};

async function clip(name, ms, action) {
  const dir = join(FRAMES, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = join(dir, `${String(frames.length).padStart(5, '0')}.jpg`);
    frames.push({ file, ts: metadata.timestamp });
    writeFileSync(file, Buffer.from(data, 'base64'));
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  const t0 = Date.now();
  await action?.();
  const left = ms - (Date.now() - t0);
  if (left > 0) await wait(left);
  await cdp.send('Page.stopScreencast');
  await cdp.detach();
  // Variable-rate frames → constant 30 fps H.264 using each frame's real duration.
  const lines = ['ffconcat version 1.0'];
  // Paths relative to the project: `npx` needs a shell on Windows and the project path has spaces.
  frames.forEach((f, i) => {
    const next = frames[i + 1]?.ts ?? f.ts + 1 / 30;
    lines.push(`file '${f.file.split(/[\\/]/).pop()}'`, `duration ${Math.max(0.001, next - f.ts).toFixed(4)}`);
  });
  lines.push(`file '${frames[frames.length - 1].file.split(/[\\/]/).pop()}'`);
  writeFileSync(join(dir, 'list.ffconcat'), lines.join('\n'));
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.ffconcat'),
    // Remotion's ffmpeg build ships without the fps/scale filters: constant rate via -fps_mode/-r instead.
    '-fps_mode', 'cfr', '-r', '30', '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    join(CLIPS, `${name}.mp4`)], { stdio: 'inherit' });
  const secs = frames.length > 1 ? frames[frames.length - 1].ts - frames[0].ts : 0;
  console.log('clip', name, frames.length, 'frames', `${(frames.length / Math.max(secs, 0.01)).toFixed(1)} fps`);
}

const btn = (text) => page.locator('button', { hasText: text }).first();
const collapseMentor = async () => {
  const b = page.locator('button[title="Minimizar"]');
  if (await b.count()) await b.first().click();
};
const expandMentor = async () => {
  const b = page.locator('button[title="Abrir a KATHERINE"]');
  if (await b.count()) await b.first().click();
};
const hold = async (key, ms) => {
  await page.keyboard.down(key);
  await wait(ms);
  await page.keyboard.up(key);
};

async function deploy(missionIndex) {
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  await wait(1500);
  await btn('SELECCIONAR MISIÓN').click();
  await wait(800);
  if (missionIndex === 0) await still('mission_select');
  // Mission cards are the buttons right after "← Volver".
  const cards = page.locator('button', { hasText: /FASE \d/ });
  await cards.nth(missionIndex).click();
  await wait(400);
  await btn('DESPLEGAR EN').click();
  await wait(7500); // world load + KATHERINE mission briefing types out
}

// ---------------------------------------------------------------- main menu
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await wait(2500);
await still('menu');
await clip('menu_idle', 4000);

// ---------------------------------------------------------------- phase 0: habitat + KATHERINE moments
await deploy(0);
await still('m0_briefing');
await collapseMentor();
await clip('m0_pan', 5000, () => hold('ArrowLeft', 4600));
await expandMentor();
await page.evaluate(() => {
  window.__katherine.sim().crisisDecision = 'water_priority';
});
await wait(9000);
await still('k_decision');
await btn('Sí, entiendo').click().catch(() => {});
await wait(4500);
await still('k_quiz');
await page.evaluate(() => {
  window.__katherine.sim().co2Ppm = 1500;
});
await wait(5000);
await still('k_alarm');
await clip('k_alarm_clip', 3500);
await page.evaluate(() => {
  window.__katherine.sim().co2Ppm = 600;
});
await page.locator('button[title="Idioma y voz"]').click();
await wait(800);
await still('k_settings');
await page.locator('button[title="Idioma y voz"]').click();
await page.keyboard.press('p');
await wait(1500);
await still('space_paper');
await page.keyboard.press('Escape');

// ---------------------------------------------------------------- phases 1-4
const names = ['m1_cockpit', 'm2_surface', 'm3_greenhouse', 'm4_storm'];
for (let i = 1; i <= 4; i++) {
  await deploy(i);
  await still(`${names[i - 1]}_briefing`);
  await collapseMentor();
  await still(names[i - 1]);
  await clip(`${names[i - 1]}_pan`, 4500, () => hold(i % 2 ? 'ArrowRight' : 'ArrowLeft', 4200));
  if (i === 2 || i === 4) {
    await page.keyboard.press('v'); // third-person EVA view
    await wait(1200);
    await still(`${names[i - 1]}_3p`);
    await clip(`${names[i - 1]}_3p_pan`, 4000, () => hold('ArrowLeft', 3800));
  }
}

await browser.close();
console.log('DONE');
