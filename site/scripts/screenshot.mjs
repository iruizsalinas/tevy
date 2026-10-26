// Headless screenshots of the built site.
// Usage: node site/scripts/screenshot.mjs [baseUrl] [outDir] [path ...]
// Serve dist first, e.g. `npx vite preview --port 4173`.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const [base = 'http://localhost:4173', outDir = 'build/screens', ...paths] = process.argv.slice(2);
const targets = paths.length ? paths : ['/', '/models/norway-spruce/', '/missing-page/'];
const viewports = [
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: 'phone', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failures = 0;
for (const vp of viewports) {
  const { name: _n, width, height, ...opts } = vp;
  const context = await browser.newContext({ viewport: { width, height }, ...opts });
  for (const path of targets) {
    const page = await context.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') console.log(`[${vp.name} ${path}] ${m.type()}: ${m.text()}`);
    });
    page.on('pageerror', (e) => {
      failures++;
      console.log(`[${vp.name} ${path}] pageerror: ${e.message}`);
    });
    await page.goto(base + path, { waitUntil: 'networkidle' });
    if (await page.$('.viewer')) {
      await page.waitForSelector('.viewer.ready', { timeout: 30000 }).catch(() => {
        failures++;
        console.log(`[${vp.name} ${path}] viewer did not become ready`);
      });
      // Stop auto-rotation so shots are comparable, then let the fade-in finish.
      await page.click('button[title="Auto-rotate"]').catch(() => {});
      await page.waitForTimeout(1200);
    }
    const name = `${vp.name}${path.replace(/[^a-z0-9]+/gi, '_').replace(/_$/, '') || '_home'}`;
    await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) console.log(`[${vp.name} ${path}] horizontal overflow: ${overflow}px`);
    console.log(`wrote ${join(outDir, `${name}.png`)}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
process.exitCode = failures ? 1 : 0;
