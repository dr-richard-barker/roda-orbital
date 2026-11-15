import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = process.env.SHOT_PORT || '4179';
const BASE_URL = `http://localhost:${PORT}`;
const OUT = path.resolve('shots');
fs.mkdirSync(OUT, { recursive: true });

const server = spawn(
  path.resolve('.tools/node/bin/node'),
  [path.resolve('node_modules/vite/bin/vite.js'), 'preview', '--port', PORT, '--strictPort'],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);

await new Promise((res, rej) => {
  const timer = setTimeout(() => rej(new Error('vite preview timeout')), 8000);
  server.stdout.on('data', (d) => {
    if (String(d).includes(PORT)) {
      clearTimeout(timer);
      res();
    }
  });
  server.stderr.on('data', (d) => process.stderr.write(d));
});

const errors = [];
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) errors.push(`http ${res.status()}: ${res.url()}`);
  });

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, '01-ginga-fight.png') });

  // Toggle P1 Maculelê machete outfit + P1 Autopilot + Touch
  await page.click('button[data-act="maculele-0"]');
  await page.click('button[data-act="auto-0"]');
  await page.click('button[data-act="touch"]');
  await new Promise((r) => setTimeout(r, 1400));
  await page.screenshot({ path: path.join(OUT, '02-maculele-auto-hitboxes.png') });

  // Turn off touch, enable Retro CRT mode for visual check
  await page.click('button[data-act="touch"]');
  await page.click('button[data-act="retro"]');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT, '03-retro-crt.png') });

  // Switch off Retro and test Play / Show Mode (Jogar na Roda) synchronized duet
  await page.click('button[data-act="retro"]');
  await page.click('button[data-act="show"]');
  await new Promise((r) => setTimeout(r, 2600));
  await page.screenshot({ path: path.join(OUT, '07-play-show-duet.png') });

  // Move Showcase 3D Animator page (Meia-Lua de Compasso with Hitboxes & Dummy)
  await page.goto(`${BASE_URL}/moves.html?move=meia_lua_compasso`, { waitUntil: 'networkidle0' });
  await page.click('#sc-hitboxes');
  await page.click('#sc-dummy');
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: path.join(OUT, '04-showcase-animator.png') });

  // Preview Armada with Pair Reply active (Cocorinha synchronized evasion right at active frame ~14)
  await page.goto(`${BASE_URL}/moves.html?move=armada`, { waitUntil: 'networkidle0' });
  await page.click('#sc-pair');
  await new Promise((r) => setTimeout(r, 240));
  await page.screenshot({ path: path.join(OUT, '08-showcase-pair-reply.png') });

  // Switch to Mudroljub / Minhoquinho Comparison Matrix tab
  await page.click('#tab-matrix');
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, '05-showcase-matrix.png') });

  // Narrow mobile viewport check for container-query responsive card matrix
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, '06-showcase-mobile.png') });

  // Editorial Tutorial page: desktop wide inline nav & tables + mobile collapsed popover & stacked tables
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(`${BASE_URL}/tutorial.html`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUT, '09-tutorial-desktop.png') });

  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 300));
  await page.click('.menu-button');
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: path.join(OUT, '10-tutorial-mobile.png') });

  // Editorial History of Capoeira page: desktop + scrolled mobile stacked table check
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(`${BASE_URL}/history.html`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUT, '11-history-desktop.png') });

  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => document.querySelector('#music')?.scrollIntoView({ behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUT, '12-history-mobile.png') });

  console.log('Screenshots saved to shots/. Errors:', errors.length);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  }
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
