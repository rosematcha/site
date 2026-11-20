import { readFileSync } from 'node:fs';

import { AxeBuilder } from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';

const entry = { id: 'fixture', name: 'Visitor', message: 'Thanks for sharing your work.', website: 'https://example.org/', date: 'November 9, 2026' };
test.beforeEach(async ({ page }) => { await page.route('**/.netlify/functions/get-guestbook-entries', route => route.fulfill({ json: [entry] })); });
async function ready(page: Page, route: string) {
  await page.goto(route); await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.fx canvas, .key[style*="--krx"]').first()).toBeAttached();
}
const routes = ['/', '/work', '/photos', '/photos/muertitos-2026', '/resume', '/guestbook', '/nope'];
for (const width of [1440, 1024, 768, 390]) {
  for (const route of routes) {
    test(`${route} renders, loads its images and passes axe at ${String(width)}px`, async ({ page }) => {
      const logged: string[] = []; page.on('console', message => { if (['error', 'warning'].includes(message.type()) && !(route === '/nope' && message.text().includes('status of 404'))) {logged.push(message.text());} });
      await page.setViewportSize({ width, height: 900 });
      await ready(page, route);
      expect(logged).toEqual([]);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const broken = await page.locator('img').evaluateAll(images => images.filter((image): image is HTMLImageElement => image instanceof HTMLImageElement).filter(image => image.complete && image.currentSrc && image.naturalWidth === 0).map(image => image.src));
      expect(broken).toEqual([]);
      const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(report.violations).toEqual([]);
    });
  }
}
test('the phone menu opens on its current row, keeps Tab inside, and closes back to its button', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const page = await context.newPage();
  await ready(page, '/work');
  const button = page.getByRole('button', { name: 'Menu, Work' });
  await button.tap(); await expect(page.locator('#menu')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Work', exact: true })).toBeFocused();
  await expect(page.locator('main')).toBeHidden();
  await page.keyboard.press('Escape'); await expect(page.locator('#menu')).toBeHidden(); await expect(button).toBeFocused();
  await context.close();
});
test('the wide nav stands once its row scrolls away, and a menu row goes to its page', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 }); await ready(page, '/');
  const button = page.locator('.bars-btn');
  await expect(button).toBeHidden();
  await page.evaluate(() => { window.scrollTo(0, 400); });
  await expect(button).toBeVisible();
  await button.click(); await page.getByRole('link', { name: 'Photos', exact: true }).click();
  await expect(page).toHaveURL(/\/photos$/); await expect(page.getByRole('heading', { level: 1 })).toHaveText('Photos');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});
test('a set shows its prints, steps them in the viewer, and Back returns to its cover', async ({ page }) => {
  await ready(page, '/photos');
  const cover = page.locator('#event-dunkin-bts-2023'); await cover.click();
  await expect(page).toHaveURL(/\/photos\/dunkin-bts-2023$/);
  await expect(page.locator('.print-b')).toHaveCount(14);
  await page.locator('.print-b').first().click(); await expect(page.locator('dialog.viewer')).toBeVisible();
  await page.keyboard.press('ArrowRight'); await expect(page.locator('.v-cap')).toContainText('2 of 14');
  await page.keyboard.press('Escape'); await expect(page.locator('dialog.viewer')).toBeHidden();
  await expect(page.locator('.print-b').nth(1)).toBeFocused();
  await page.goBack(); await expect(page).toHaveURL(/\/photos$/); await expect(cover).toBeFocused();
  await page.goForward(); await page.getByRole('link', { name: 'Back to photos' }).click();
  await expect(page).toHaveURL(/\/photos#event-dunkin-bts-2023$/); await expect(cover).toBeFocused();
});
for (const route of ['/photos/missing', '/nope']) {
  test(`${route} is Not found, with a way home`, async ({ page }) => {
    await ready(page, route);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
    await expect(page).toHaveTitle('Page not found · rosematcha · Reese Lundquist');
    await page.getByRole('link', { name: 'Go home' }).click(); await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Howdy/);
  });
}
test('a click on bare ground lights a lamp; a click on the greeting does not', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 }); await ready(page, '/');
  const lit = () => page.locator('.fx > canvas.lm').evaluateAll(maps => maps.filter(map => map instanceof HTMLElement && map.style.display !== 'none').length);
  const greeting = await page.locator('.hero h1').boundingBox(); if (!greeting) {throw new Error('No greeting');}
  await page.mouse.click(greeting.x + 30, greeting.y + 30); await page.waitForTimeout(400); expect(await lit()).toBe(0);
  await page.mouse.click(930, 600); await expect.poll(lit).toBe(1);
});
test('leaving a page takes its engine with it', async ({ page }) => {
  await ready(page, '/');
  const count = () => page.evaluate(() => [document.querySelectorAll('.cast').length, document.querySelectorAll('[data-h]').length, document.querySelectorAll('.fx-end').length]);
  const [casts, objects] = await count();
  expect(casts).toBe(objects);
  await page.getByRole('link', { name: 'Work', exact: true }).first().click(); await expect(page).toHaveURL(/\/work$/);
  await page.goBack(); await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Howdy/);
  expect(await count()).toEqual([casts, objects, 1]);
});
for (const [route, img] of [['/', '.portrait .print.on .ch.r img'], ['/photos', '.yr .ph .ch.r img']] as const) {
  test(`${route} preloads its first picture with the same candidates as its <img>`, async ({ page }) => {
    await ready(page, route);
    const link = page.locator('link[rel="preload"][as="image"]').first();
    const shown = page.locator(img).first();
    expect(await link.getAttribute('imagesrcset')).toBe(await shown.getAttribute('srcset'));
    expect(await link.getAttribute('imagesizes')).toBe(await shown.getAttribute('sizes'));
  });
}
test('real form payload, failure preservation, and guestbook rendering', async ({ page }) => {
  await ready(page, '/guestbook'); await expect(page.getByText(entry.message)).toBeVisible();
  await page.route('http://127.0.0.1:5480/', route => route.request().method() === 'POST' ? route.fulfill({ status: 200, body: 'ok' }) : route.continue());
  await page.getByLabel('Your name').fill('QA visitor'); await page.getByLabel('Message', { exact: true }).fill('Fixture submission.');
  const request = page.waitForRequest(request => request.method() === 'POST'); await page.getByRole('button', { name: 'Sign the guestbook' }).click(); const posted = await request;
  expect(posted.postData()).toContain('form-name=guestbook'); expect(posted.postData()).toContain('bot-field='); await expect(page.getByText('Thanks for signing!')).toBeVisible();
  await expect(page.locator('.gb-entry').first()).toContainText('Fixture submission.');
});
test('resume filters only experience and printing retains all sections', async ({ page }) => {
  await ready(page, '/resume'); await expect(page.locator('.role:visible')).toHaveCount(11); await page.getByRole('searchbox').fill('quickbooks'); await expect(page.locator('.role:visible')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Skills', exact: true })).toBeVisible(); await page.getByRole('searchbox').fill(''); await page.emulateMedia({ media: 'print' }); await expect(page.locator('.role:visible')).toHaveCount(11);
  await expect(page.getByRole('heading', { name: 'Education', exact: true })).toBeVisible(); await expect(page.locator('.top')).toBeHidden();
});
test('reduced motion leaves nothing running once the page settles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await ready(page, '/'); await page.waitForTimeout(600);
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
});
test('every page arrives rendered, and an unknown path is Not found with a 404', async ({ request }) => {
  const pages = await Promise.all(routes.filter(path => path !== '/nope').map(async route => { const response = await request.get(route); return [response.status(), await response.text()] as const; }));
  for (const [status, html] of pages) { expect(status).toBe(200); expect(html).toMatch(/<div id="root">(<link [^>]*>|<!--\$-->)*<div class="site p-[a-z0-9]+"/); expect(html).toMatch(/<link rel="modulepreload" crossorigin href="\/assets\/[A-Za-z]+Page-/); }
  const missing = await request.get('/nope'); expect(missing.status()).toBe(404);
  const html = await missing.text(); expect(html).toContain('Page not found</h1>'); expect(html).toContain('<title>Page not found');
  const old = await request.get('/projects', { maxRedirects: 0 }); expect(old.status()).toBe(301); expect(old.headers().location).toBe('/work');
});
test('hydration keeps the built page and attaches the engine once', async ({ page }) => {
  const logged: string[] = []; page.on('console', message => { if (['error', 'warning'].includes(message.type())) {logged.push(message.text());} });
  await ready(page, '/resume?lens=sysadmin');
  await expect(page.getByRole('button', { name: 'Sysadmin' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.role:visible')).toHaveCount(4);
  expect(await page.evaluate(() => [document.querySelectorAll('.cast').length, document.querySelectorAll('[data-h]').length, document.querySelectorAll('.fx-end').length, document.querySelectorAll('.fx > canvas.lm').length])).toEqual([await page.locator('[data-h]').count(), await page.locator('[data-h]').count(), 1, 0]);
  expect(logged).toEqual([]);
});
test('static gallery links expose metadata and a complete sitemap without JavaScript', async ({ request }) => {
  const response = await request.get('/photos/muertitos-2026');
  expect(response.ok()).toBe(true); const html = await response.text();
  expect(html).toContain('<title>Muertitos 2026');
  expect(html).toContain('/muertitos-2026/611.webp');
  const sitemap = await request.get('/sitemap.xml'); expect(sitemap.ok()).toBe(true);
  expect((await sitemap.text()).match(/<loc>/g)).toHaveLength(25);
});
test('skip navigation and malformed deep links remain usable', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await ready(page, '/work#%E0%A4');
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.keyboard.press('Enter'); await expect(page.locator('main')).toBeFocused();
  expect(errors).toEqual([]);
});

// ---- review fixes ----
test('a phone without Screen Orientation still boots the page and opens the menu', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const page = await context.newPage();
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { Object.defineProperty(Screen.prototype, 'orientation', { get: () => undefined, configurable: true }); });
  await ready(page, '/');
  await page.locator('.bars-btn').tap(); await expect(page.locator('#menu')).toBeVisible();
  expect(errors).toEqual([]); await context.close();
});
test('an arrow pressed while the viewer closes lifts no other print', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 }); await ready(page, '/photos/dunkin-bts-2023');
  await page.locator('.print-b').first().click(); await expect(page.locator('dialog.viewer')).toBeVisible();
  await page.keyboard.press('Escape'); await page.keyboard.press('ArrowRight');
  await expect(page.locator('dialog.viewer')).toBeHidden();
  await expect(page.locator('.print-b.lifted')).toHaveCount(0); await expect(page.locator('.print-b').first()).toBeFocused();
});
test('Back returns to the place and cover left, over the hash the page was opened at', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const page = await context.newPage();
  await ready(page, '/photos#event-muertitos-2026');
  const cover = page.locator('#event-cart-smashing-2023');
  await cover.evaluate(element => { element.closest('section')?.scrollIntoView(); }); await page.waitForTimeout(300);
  // (the page's own place when the cover is pressed: tap() may scroll it into view first)
  await page.evaluate(() => { document.addEventListener('click', () => { sessionStorage.setItem('y', String(scrollY)); }, { capture: true, once: true }); });
  await cover.tap(); await expect(page).toHaveURL(/cart-smashing-2023$/);
  await page.goBack(); await expect(cover).toBeFocused();
  const [y, now] = await page.evaluate(() => [Number(sessionStorage.getItem('y')), scrollY]);
  expect(y).toBeGreaterThan(900); expect(Math.abs(now - y)).toBeLessThan(2); await context.close();
});
test('a lamp left on one page starts no frames on the next', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); const w = window as unknown as { frames: number[] }; w.frames = []; window.requestAnimationFrame = callback => { w.frames.push(performance.now()); return raf(callback); }; });
  await ready(page, '/');
  await page.mouse.click(930, 600); const lit = await page.evaluate(() => performance.now()); await page.waitForTimeout(1600);
  await page.locator('.row-nav a', { hasText: 'Work' }).focus(); await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/work$/);
  await page.waitForTimeout(3500);
  // the lamp's hold ends 2.5 s after it was lit; by then the Work page has settled
  expect(await page.evaluate(start => (window as unknown as { frames: number[] }).frames.filter(t => t > start + 2400).length, lit)).toBe(0);
});
for (const path of ['/Work', '/Photos/muertitos-2026']) {
  test(`a mixed-case path (${path}) is a plain Not found that hydrates as one`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(path); expect(response?.status()).toBe(404);
    expect(await response?.text()).toContain('Page not found</h1>');
    await expect(page.locator('.key[style*="--krx"]')).toBeAttached(); await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
    expect(errors).toEqual([]);
  });
}
test('the preview serves the apps beside the site and 404s a missing file', async ({ request }) => {
  const apps = ['brahdb', 'sampleballot', 'moviemap', 'friendfinder', 'bexarvoting', 'garagesale'];
  const answers = await Promise.all(apps.map(async app => { const response = await request.get(`/${app}/`); return [response.status(), (await response.text()).includes('class="site p-')]; }));
  expect(answers).toEqual(apps.map(() => [200, false]));
  expect((await request.get('/nothing.png')).status()).toBe(404);
});
for (const app of ['sampleballot', 'bexarvoting', 'moviemap', 'friendfinder']) {
  test(`the preview moves /${app} to its slash form, where its own scripts and data load`, async ({ page }) => {
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
    const failed: string[] = [];
    page.on('response', response => { if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) {failed.push(`${String(response.status())} ${new URL(response.url()).pathname}`);} });
    await page.goto(`/${app}`, { waitUntil: 'networkidle' });
    expect(new URL(page.url()).pathname).toBe(`/${app}/`); expect(failed).toEqual([]);
  });
}
test('every srcset candidate on the photo pages names its file\'s own width', async ({ request }) => {
  const events = JSON.parse(readFileSync('src/data/photos.json', 'utf8')) as { id: string }[];
  const routes = ['/', '/photos', ...events.map(event => `/photos/${event.id}`)];
  const pages = await Promise.all(routes.map(async route => (await request.get(route)).text()));
  const candidates = new Set(pages.flatMap(html => [...html.matchAll(/srcset="([^"]+)"/gi)].flatMap(match => (match[1] ?? '').split(', '))));
  const wrong = (await Promise.all([...candidates].map(async candidate => {
    const [src = '', descriptor = ''] = candidate.split(' ');
    const { width } = await sharp(`../_site${src}`).metadata();
    return `${String(width)}w` === descriptor ? '' : `${candidate} is ${String(width)} px`;
  }))).filter(Boolean);
  expect(candidates.size).toBeGreaterThan(400); expect(wrong).toEqual([]);
});
test('turning on reduced motion while a set is open takes effect at once', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 }); await ready(page, '/photos/dunkin-bts-2023');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(page.locator('html')).toHaveClass(/\brm\b/);
  await page.locator('.print-b').first().click();
  const transition = () => page.locator('.v-fly').evaluate(element => element instanceof HTMLElement ? element.style.transition : '');
  expect(await transition()).toBe('none');
  await page.keyboard.press('ArrowRight'); await expect(page.locator('.v-cap')).toContainText('2 of 14'); expect(await transition()).toBe('none');
});
test('Forward to a photo hash brings its cover into view and focuses it', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const page = await context.newPage();
  await ready(page, '/photos/cart-smashing-2023');
  await page.getByRole('link', { name: 'Back to photos' }).click(); await expect(page).toHaveURL(/#event-cart-smashing-2023$/);
  const cover = page.locator('#event-cart-smashing-2023'); await expect(cover).toBeFocused();
  await page.goBack(); await expect(page).toHaveURL(/cart-smashing-2023$/);
  await page.goForward(); await expect(cover).toBeFocused();
  const box = await cover.boundingBox(); expect(box && box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y < 844).toBe(true);
  await context.close();
});
test('Forward to #main after Skip to content focuses main', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const page = await context.newPage();
  await ready(page, '/photos/cart-smashing-2023');
  await page.getByRole('link', { name: 'Back to photos' }).click(); await expect(page).toHaveURL(/#event-cart-smashing-2023$/);
  await page.getByRole('link', { name: 'Skip to content' }).focus(); await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused(); await page.mouse.wheel(0, 120); await page.waitForTimeout(200);
  await page.goBack(); await expect(page).toHaveURL(/#event-cart-smashing-2023$/);
  await page.goForward(); await expect(page).toHaveURL(/#main$/); await expect(page.locator('main')).toBeFocused();
  await context.close();
});
test('two entries made by plain #links keep their own places', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const page = await context.newPage();
  await ready(page, '/photos#event-muertitos-2026');
  await page.evaluate(() => { scrollTo(0, document.documentElement.scrollHeight); }); await page.waitForTimeout(300);
  const y = await page.evaluate(() => scrollY); expect(y).toBeGreaterThan(900);
  await page.evaluate(() => { document.querySelector<HTMLElement>('.skip')?.focus({ preventScroll: true }); }); await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.goBack(); await expect(page).toHaveURL(/#event-muertitos-2026$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
  await context.close();
});
