// Leonida Trophy Guide playtest: drives the real app in headless Chromium and
// checks the tracker's behaviour end to end. Run it with: node tools/playtest.mjs
// Exits 0 when every step passes, 1 otherwise.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(here, '..');
const appDir = join(repoRoot, 'app');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const PORT = 18083;
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

const results = [];
function step(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const external = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', (req) => { if (!req.url().startsWith('http://localhost')) external.push(req.url()); });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__guideReady === true, { timeout: 15000 });
    await sleep(300);

    step('app loads with no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
    step('no network request leaves localhost', external.length === 0, external.slice(0, 2).join(' | '));

    const rows = await page.$$eval('#trophies li', (els) => els.length);
    step('all 55 trophies listed', rows === 55, `${rows} rows`);
    const progress = await page.textContent('#earnedCount');
    step('progress starts at 0 / 55', progress.trim() === '0 / 55', progress.trim());

    // Tick a trophy: progress moves and survives a reload.
    await page.click('#trophies li:first-child input[type="checkbox"]');
    await sleep(200);
    const afterTick = await page.textContent('#earnedCount');
    step('ticking updates progress', afterTick.trim() === '1 / 55', afterTick.trim());
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.__guideReady === true, { timeout: 15000 });
    const afterReload = await page.textContent('#earnedCount');
    step('progress persists across reload', afterReload.trim() === '1 / 55', afterReload.trim());
    // Untick again so the next checks start clean.
    await page.click('#trophies li:first-child input[type="checkbox"]');

    // Story filter: 12 trophies.
    await page.selectOption('#kind', 'story');
    await sleep(200);
    const storyRows = await page.$$eval('#trophies li', (els) => els.length);
    step('story filter shows 12', storyRows === 12, `${storyRows} rows`);
    await page.selectOption('#kind', 'all');

    // Missable filter: exactly 1.
    await page.check('#missableOnly');
    await sleep(200);
    const missRows = await page.$$eval('#trophies li', (els) => els.length);
    const missName = await page.textContent('#trophies li .tname');
    step('missable filter shows exactly Positive Mental Attitude', missRows === 1 && missName.includes('Positive Mental Attitude'), `${missRows} rows: ${missName}`);
    await page.uncheck('#missableOnly');

    // Search.
    await page.fill('#search', 'bank vault');
    await sleep(200);
    const searchRows = await page.$$eval('#trophies li', (els) => els.length);
    step('search finds the vault trophy', searchRows >= 1, `${searchRows} rows`);
    await page.fill('#search', '');

    // Spoiler setting hides story names until earned.
    await page.check('#spoilers');
    await page.selectOption('#kind', 'story');
    await sleep(200);
    const masked = await page.$$eval('#trophies li .tname', (els) => els.map((e) => e.textContent));
    step('spoilers mask story names', masked.every((n) => n === 'Hidden story trophy'), masked.slice(0, 3).join(' | '));
    await page.selectOption('#kind', 'all');
    await page.uncheck('#spoilers');

    // Detail panel: guide + sources for the selected trophy.
    await page.goto(`http://localhost:${PORT}/?spoilers=off&trophy=Positive%20Mental%20Attitude`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__guideReady === true, { timeout: 15000 });
    const detailText = await page.textContent('#detail');
    step('detail shows guide and sources', detailText.includes('balcony') && detailText.includes('Sources for this guide'), detailText.slice(0, 120));
    step('detail flags the missable warning', detailText.includes('Missable'), '');

    // Roadmap renders 6 stages.
    const stages = await page.$$eval('#stages li', (els) => els.length);
    step('roadmap has 6 stages', stages === 6, `${stages} stages`);

    // Export button exists; import input exists.
    const hasExport = await page.$('#exportBtn') !== null;
    const hasImport = await page.$('#importFile') !== null;
    step('export and import controls present', hasExport && hasImport, '');

    // Online filter: honest empty state.
    await page.selectOption('#kind', 'online');
    await sleep(200);
    const emptyText = await page.textContent('#empty');
    step('online filter says no online trophies', emptyText.includes('No online trophies'), emptyText.slice(0, 80));
  } finally {
    await browser.close();
    server.close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} playtest steps passed`);
  if (failed.length || errors.length || external.length) process.exit(1);
}

main();
