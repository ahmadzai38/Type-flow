/**
 * End-to-end smoke test + performance measurements against the production build.
 *
 *   npm run build && npm run e2e
 *
 * Starts `vite preview`, drives a real Chromium with Playwright, and checks:
 *  - the full typing flow (words, time, code), results and statistics pages
 *  - no console errors, no requests to other origins
 *  - offline reload through the service worker
 *  - input-to-frame latency, JS heap, DOM nodes and listeners across many restarts
 * Writes perf-report.json and screenshots to docs/screenshots/.
 *
 * Set CHROMIUM_PATH to use a specific Chromium binary.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 4179;
const URL = `http://localhost:${PORT}/`;
const SHOTS = 'docs/screenshots';
mkdirSync(SHOTS, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe', detached: true });
const stopServer = () => {
  try {
    process.kill(-server.pid, 'SIGTERM'); // the whole process group (npx + vite)
  } catch {
    /* already stopped */
  }
};
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview server did not start')), 20000);
  server.stdout.on('data', (d) => {
    if (String(d).includes(String(PORT))) {
      clearTimeout(t);
      resolve();
    }
  });
});

const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
};

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'],
});
const context = await browser.newContext({ viewport: { width: 1366, height: 820 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const consoleErrors = [];
const foreignRequests = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(String(e)));
page.on('request', (r) => {
  const u = r.url();
  if (!u.startsWith(URL) && !u.startsWith('data:')) foreignRequests.push(u);
});

const cdp = await context.newCDPSession(page);
await cdp.send('Performance.enable');
const metrics = async () => {
  await cdp.send('HeapProfiler.collectGarbage');
  const { metrics: m } = await cdp.send('Performance.getMetrics');
  const get = (n) => m.find((x) => x.name === n)?.value ?? 0;
  return {
    jsHeapUsedMB: +(get('JSHeapUsedSize') / 1048576).toFixed(2),
    jsHeapTotalMB: +(get('JSHeapTotalSize') / 1048576).toFixed(2),
    domNodes: get('Nodes'),
    listeners: get('JSEventListeners'),
  };
};

/** Installs a latency probe: keydown → next animation frame (≈ input-to-paint). */
const installProbe = () =>
  page.evaluate(() => {
    window.__lat = [];
    if (window.__probe) return;
    window.__probe = true;
    window.__handler = [];
    let start = 0;
    window.addEventListener(
      'keydown',
      (e) => {
        const t0 = e.timeStamp;
        start = performance.now();
        requestAnimationFrame(() => window.__lat.push(performance.now() - t0));
      },
      true,
    );
    // Bubble phase on window runs after React has processed and committed the keystroke.
    window.addEventListener('keydown', () => window.__handler.push(performance.now() - start));
  });
const stats = (arr) => {
  arr.sort((a, b) => a - b);
  const q = (p) => +arr[Math.min(arr.length - 1, Math.floor(p * arr.length))].toFixed(2);
  return { samples: arr.length, medianMs: q(0.5), p95Ms: q(0.95), maxMs: +arr[arr.length - 1].toFixed(2) };
};
const latency = async () => {
  const { lat, handler } = await page.evaluate(() => ({ lat: window.__lat.splice(0), handler: window.__handler.splice(0) }));
  return { keydownToNextFrame: stats(lat), keystrokeProcessing: stats(handler) };
};
const passage = () => page.$eval('.tf-text', (el) => el.textContent.replace(/↵/g, ''));
const typeText = async (text, delay = 12) => {
  for (const ch of text) {
    if (ch === '\n') await page.keyboard.press('Enter');
    else await page.keyboard.type(ch);
    if (delay) await page.waitForTimeout(delay);
  }
};

const t0 = Date.now();
await page.goto(URL, { waitUntil: 'load' });
const loadTiming = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  return {
    domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
    loadMs: Math.round(nav.loadEventEnd),
    firstContentfulPaintMs: fcp ? Math.round(fcp.startTime) : null,
    transferredKB: Math.round(
      performance.getEntriesByType('resource').reduce((a, r) => a + r.transferSize, nav.transferSize) / 1024,
    ),
  };
});
check((await page.title()).includes('TypeFlow'), 'page loads with title');
const afterLoad = await metrics();
await page.getByLabel(/typing input/i).focus();
await typeText((await passage()).slice(0, 22), 30);
await page.mouse.move(10, 10);
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/test-midnight.png` });
await page.getByRole('button', { name: /restart with a new passage/i }).click();

// ---- words mode full run
await page.getByRole('button', { name: 'words', exact: true }).click();
await page.getByRole('button', { name: '25', exact: true }).click();
await installProbe();
const wordsText = await passage();
await typeText(wordsText, 25);
await page.getByRole('heading', { name: /test results/i }).waitFor({ timeout: 5000 });
check(true, 'words test completes and shows results');
const wordsLatency = await latency();
const wpmShown = await page.locator('text=wpm').first().isVisible();
check(wpmShown, 'results show WPM');
await page.waitForTimeout(500);
await page.mouse.move(820, 260);
await page.waitForTimeout(100);
await page.screenshot({ path: `${SHOTS}/results.png` });

// ---- mistakes and corrections
await page.getByRole('button', { name: /next test/i }).click();
const t2 = await passage();
await typeText(t2.slice(0, 3));
await page.keyboard.type('#');
check((await page.locator('.tf-c2, .tf-extra').count()) === 1, 'incorrect character is marked');
await page.keyboard.press('Backspace');
check((await page.locator('.tf-c2, .tf-extra').count()) === 0, 'backspace corrects the mistake');

// ---- Tab + Enter restart
await page.keyboard.press('Tab');
await page.keyboard.press('Enter');
check((await page.locator('.tf-c1').count()) === 0, 'Tab + Enter restarts the test');

// ---- code mode
await page.getByRole('button', { name: 'code', exact: true }).click();
await page.getByRole('button', { name: 'typescript', exact: true }).click();
const code = await passage();
await typeText(code, 5);
await page.getByRole('heading', { name: /test results/i }).waitFor({ timeout: 5000 });
const codeAcc = await page.locator('div:has(> div:text-is("accuracy"))').textContent();
check(/100%/.test(codeAcc ?? ''), 'code test with auto-indent completes at 100% accuracy');

// ---- time mode: long fast session
await page.getByRole('button', { name: /next test/i }).click();
await page.getByRole('button', { name: 'time', exact: true }).click();
await page.getByRole('button', { name: '15', exact: true }).click();
await installProbe();
const timeStart = Date.now();
let typed = 0;
while (Date.now() - timeStart < 14000) {
  const text = await page.$eval('.tf-text', (el) => {
    const states = [...el.querySelectorAll('[data-i]')];
    const idx = states.findIndex((s) => s.className === 'tf-c0');
    return states.slice(idx, idx + 40).map((s) => s.textContent).join('');
  });
  await typeText(text, 0);
  typed += text.length;
}
await page.getByRole('heading', { name: /test results/i }).waitFor({ timeout: 5000 });
const timeLatency = await latency();
check(typed > 300, `time mode keeps generating words (${typed} chars typed at full speed)`);
const durationText = await page.locator('dt:has-text("time") + dd').textContent();
check(durationText?.trim() === '15s', `time test lasted exactly 15s (shown: ${durationText})`);

// ---- stats page
await page.getByRole('button', { name: /statistics/i }).click();
await page.getByText('Your statistics').waitFor();
await page.waitForTimeout(400);
check((await page.locator('text=tests completed').count()) === 1, 'statistics page renders');
await page.screenshot({ path: `${SHOTS}/stats.png`, fullPage: true });

// ---- memory / leak check: 30 restarts
await page.getByRole('button', { name: /practice/i }).click();
await page.getByRole('button', { name: 'words', exact: true }).click();
const beforeCycles = await metrics();
for (let i = 0; i < 30; i++) {
  const p = await passage();
  await typeText(p.slice(0, 10), 0);
  await page.getByRole('button', { name: /restart with a new passage/i }).click();
}
const afterCycles = await metrics();
check(afterCycles.listeners <= beforeCycles.listeners + 5, `no event-listener growth after 30 restarts (${beforeCycles.listeners} → ${afterCycles.listeners})`);
check(afterCycles.domNodes <= beforeCycles.domNodes * 1.3 + 200, `no DOM node growth after 30 restarts (${beforeCycles.domNodes} → ${afterCycles.domNodes})`);

// ---- themes
for (const theme of ['light', 'ocean', 'forest', 'sepia', 'contrast']) {
  await page.evaluate((t) => {
    const s = JSON.parse(localStorage.getItem('typeflow:settings:v1'));
    s.theme = t;
    s.test.mode = 'time';
    localStorage.setItem('typeflow:settings:v1', JSON.stringify(s));
  }, theme);
  await page.reload();
  await page.locator('.tf-text').waitFor();
  await typeText((await passage()).slice(0, 22), 30);
  await page.mouse.move(10, 10);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/test-${theme}.png` });
}

// ---- mobile layout
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await mobile.goto(URL);
await mobile.locator('.tf-text').waitFor();
await mobile.waitForTimeout(400);
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
check(!overflow, 'no horizontal scroll on a 390px phone');
await mobile.screenshot({ path: `${SHOTS}/mobile.png` });
await mobile.close();

// ---- offline via service worker
await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
await page.reload();
await page.evaluate(() => navigator.serviceWorker.ready);
stopServer();
await new Promise((r) => setTimeout(r, 800));
const serverDown = await fetch(URL).then(() => false, () => true);
check(serverDown, 'preview server stopped (simulating no network)');
await page.reload();
check((await page.locator('.tf-text').count()) === 1, 'app reloads offline from the service worker cache');

check(consoleErrors.length === 0, `no console errors (${consoleErrors.length})`);
check(foreignRequests.length === 0, `no requests to other origins (${foreignRequests.length})`);

const report = {
  date: new Date().toISOString(),
  browser: `Chromium ${browser.version()} (headless)`,
  load: loadTiming,
  memory: { afterLoad, beforeRestartCycles: beforeCycles, after30RestartCycles: afterCycles },
  latency: { wordsTest: wordsLatency, timeTestFullSpeed: timeLatency },
  consoleErrors,
  foreignRequests,
  failures,
  totalSeconds: Math.round((Date.now() - t0) / 1000),
};
writeFileSync('perf-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
stopServer();
process.exit(failures.length ? 1 : 0);
