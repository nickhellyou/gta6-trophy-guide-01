// Leonida Trophy Guide screenshot tool: loads the guide in headless Chromium,
// stages each of the 4 shots (?view / ?trophy / ?spoilers deep links) and saves
// a real render of the app as a JPEG (1280x800, quality 82, kept under the
// 256 KiB cap). Run it with: node tools/shots.mjs
// It serves app/ itself, so no separate server is needed. Demo progress is
// seeded into localStorage before load, exactly as a reader's ticks would be.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(here, '..');
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

// Demo ticks: a reader part-way through Chapter 1 and the early grinds.
const DEMO_EARNED = [
  'Just Like Paradise', 'Paradise Lost', 'Trust', 'Cunning Stunts',
  'Master of None', 'Baited My Tackle', 'Stick Fiddler', 'Whip It Good',
  'Treat Yo Self', 'On the Spot', 'In The Beginning…', 'Ten Pin',
];

const SHOTS = [
  { n: 1, name: '1-cover.jpg', url: '/?view=checklist&spoilers=off&trophy=Positive%20Mental%20Attitude', note: 'checklist + missable guide open with sources' },
  { n: 2, name: '2-roadmap.jpg', url: '/?view=roadmap', note: 'roadmap to the platinum + 100% counts' },
  { n: 3, name: '3-spoilers.jpg', url: '/?view=checklist&spoilers=on&kind=story', note: 'spoiler setting hiding story trophies' },
  { n: 4, name: '4-missable.jpg', url: '/?view=checklist&missable=only&spoilers=off', note: 'missable filter + export/import controls' },
];

const PORT = 18082;
const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
    const file = normalize(join(appDir, rel));
    if (!file.startsWith(appDir)) { res.writeHead(403); res.end('forbidden'); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  await new Promise((r) => server.listen(PORT, r));
  await mkdir(shotsDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const results = [];
  try {
    for (const shot of SHOTS) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const errors = [];
      const external = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('request', (req) => { if (!req.url().startsWith('http://localhost')) external.push(req.url()); });
      await page.addInitScript((earned) => {
        localStorage.setItem('gta6-trophy-guide-v1', JSON.stringify(earned));
      }, DEMO_EARNED);
      await page.goto(`http://localhost:${PORT}${shot.url}`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__guideReady === true, { timeout: 15000 });
      await sleep(400);
      const file = join(shotsDir, shot.name);
      await page.screenshot({ path: file, type: 'jpeg', quality: 82 });
      const bytes = (await readFile(file)).length;
      const ok = bytes > 0 && bytes <= 262144 && errors.length === 0 && external.length === 0;
      results.push({ ...shot, bytes, errors, external, ok });
      console.log(`${ok ? 'OK  ' : 'FAIL'} ${shot.name} — ${(bytes / 1024).toFixed(0)} KiB — ${shot.note}${errors.length ? ' — ERRORS: ' + errors.slice(0, 2).join(' | ') : ''}${external.length ? ' — EXTERNAL: ' + external.slice(0, 2).join(' | ') : ''}`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} screenshots taken`);
  if (failed.length) process.exit(1);
}

main();
