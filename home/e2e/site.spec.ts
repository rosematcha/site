import { AxeBuilder } from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

const entry = { id: 'fixture', name: 'Visitor', message: 'Thanks for sharing your work.', website: 'https://example.org/', date: 'November 9, 2026' };
test.beforeEach(async ({ page }) => { await page.route('**/.netlify/functions/get-guestbook-entries', route => route.fulfill({ json: [entry] })); });
async function ready(page: Page, route: string) { await page.goto(route); await page.evaluate(() => document.fonts.ready); await page.locator("h1").evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished))); }
for (const width of [1440, 820, 390]) {
  for (const route of ['/', '/work', '/resume', '/photos', '/guestbook']) {
    test(`${route} routes, images, headings and accessibility at ${String(width)}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await ready(page, route); await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const broken = await page.locator('img').evaluateAll(images => images.filter((image): image is HTMLImageElement => image instanceof HTMLImageElement).filter(image => image.complete && image.naturalWidth === 0).map(image => image.src));
      expect(broken).toEqual([]);
      const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(report.violations).toEqual([]);
    });
  }
}
test('desktop preview enters below the title, settles, and responds across the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await ready(page, '/work');
  const heading = await page.locator('h1').boundingBox(); const start = await page.locator('.preview-frame').boundingBox();
  expect(heading).not.toBeNull(); expect(start).not.toBeNull();
  if (!heading || !start) {throw new Error('Missing work geometry');} expect(start.y).toBeGreaterThan(heading.y + heading.height);
  await page.mouse.move(0, 0); await page.evaluate(() => { window.scrollTo(0, 160); });
  await expect.poll(async () => { const frame = await page.locator('.preview-frame').boundingBox(); const nav = await page.locator('.site-header').boundingBox(); if (!frame || !nav) {return 100;} return Math.abs(frame.y + frame.height / 2 - (nav.height + (1000 - nav.height) / 2)); }).toBeLessThan(3);
  const second = await page.locator('.featured-project').nth(1).boundingBox(); if (!second) {throw new Error('No second project');}
  await page.mouse.move(1410, second.y + second.height / 2); await expect(page.locator('.preview-frame img').last()).toHaveAttribute('alt', 'Screenshot of Ciphermaniac Events');
  await page.locator('#project-brahdb').hover(); await expect(page.locator('.preview-frame img').last()).toHaveAttribute('alt', 'Screenshot of BrahDB');
  await page.locator('#project-filmscraper').focus(); await expect(page.locator('.preview-frame img').last()).toHaveAttribute('alt', 'Screenshot of FilmScraper');
});
for (const width of [820, 390]) {
  test(`compact preview pins and follows scrolling at ${String(width)}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await ready(page, '/work');
    await page.evaluate(() => { window.scrollTo(0, 450); });
    await expect.poll(async () => page.locator('.preview-column').evaluate(element => Math.abs(element.getBoundingClientRect().top - (innerWidth >= 680 ? document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0 : 0)))).toBeLessThan(2);
    const before = await page.locator('.preview-frame img').last().getAttribute('src'); await page.evaluate(() => { window.scrollBy(0, 200); });
    await expect.poll(async () => page.locator('.preview-frame img').last().getAttribute('src')).not.toBe(before);
  });
}
test('phone spotlight and menu restore focus without scroll trapping', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, hasTouch: true, isMobile: true }); const page = await context.newPage();
  await page.route('**/.netlify/functions/get-guestbook-entries', route => route.fulfill({ json: [entry] })); await ready(page, '/work');
  const source = page.getByRole('link', { name: 'Ruby City', exact: true }); await source.tap();
  await expect(page.getByRole('dialog')).toBeVisible(); await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Visit organization' })).toHaveAttribute('href', 'https://rubycity.org/');
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0); await expect(source).toBeFocused();
  await page.evaluate(() => { window.scrollTo(0, 0); }); await page.getByRole('button', { name: 'Open menu' }).tap();
  await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeFocused(); await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused(); await context.close();
});
test('gallery keyboard viewer and browser Back return to the originating event', async ({ page }) => {
  await ready(page, '/photos'); await expect(page.locator('.event-link')).toHaveCount(15); const source = page.locator('.event-link').nth(8); const id = await source.getAttribute('id'); await source.click();
  await page.locator('.gallery-photo').first().click(); await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('ArrowRight'); await expect(page.locator('figcaption')).toContainText('2 of'); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.locator('.gallery-photo').first()).toBeFocused();
  await page.goBack(); if (!id) {throw new Error('Missing event identity');} await expect(page.locator(`#${id}`)).toBeFocused();
});
test('real form payload, failure preservation, and guestbook rendering', async ({ page }) => {
  await ready(page, '/guestbook'); await expect(page.getByText(entry.message)).toBeVisible();
  await page.route('http://127.0.0.1:5480/', route => route.request().method() === 'POST' ? route.fulfill({ status: 200, body: 'ok' }) : route.continue());
  await page.getByLabel('Your name').fill('QA visitor'); await page.getByLabel('Message', { exact: true }).fill('Fixture submission.');
  const request = page.waitForRequest(request => request.method() === 'POST'); await page.getByRole('button', { name: 'Sign the guestbook' }).click(); const posted = await request;
  expect(posted.postData()).toContain('form-name=guestbook'); expect(posted.postData()).toContain('bot-field='); await expect(page.getByText('Thanks for signing!')).toBeVisible();
});
test('resume filters only experience and printing retains all sections', async ({ page }) => {
  await ready(page, '/resume'); await expect(page.locator('.resume-job')).toHaveCount(11); await page.getByRole('searchbox').fill('quickbooks'); await expect(page.locator('.resume-job')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Skills', exact: true })).toBeVisible(); await page.getByRole('searchbox').fill(''); await page.emulateMedia({ media: 'print' }); await expect(page.locator('.resume-job')).toHaveCount(11);
  await expect(page.getByRole('heading', { name: 'Education', exact: true })).toBeVisible(); await expect(page.locator('.site-header')).toBeHidden();
});
test('reduced motion removes transitions without losing preview updates', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await ready(page, '/work'); await page.locator('.featured-project').nth(1).hover(); await expect(page.locator('.preview-frame img')).toHaveCount(1);
  await expect(page.locator('.preview-frame img')).toHaveAttribute('alt', 'Screenshot of Ciphermaniac Events'); expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
});

for (const viewport of [{ width: 390, height: 900 }, { width: 820, height: 390 }]) {
  test(`compact keyboard targets stay below the preview at ${String(viewport.width)}×${String(viewport.height)}`, async ({ page }) => {
    await page.setViewportSize(viewport); await ready(page, '/work');
    const first = page.locator('.featured-project').nth(2);
    const smaller = page.locator('#project-filmscraper');
    const last = page.locator('#project-moviemap');
    const clear = (selector: string) => page.locator(selector).evaluate(link => {
      const stage = document.querySelector('.preview-column')?.getBoundingClientRect();
      return !stage || link.getBoundingClientRect().top >= stage.bottom + 8;
    });
    await first.focus(); await expect.poll(() => clear('#project-balatro3ds')).toBe(true);
    await smaller.focus(); await expect.poll(() => clear('#project-filmscraper')).toBe(true);
    await last.focus(); await expect.poll(() => clear('#project-moviemap')).toBe(true);
  });
}

test('static gallery links expose metadata and a complete sitemap without JavaScript', async ({ request }) => {
  const response = await request.get('/photos/muertitos-2026');
  expect(response.ok()).toBe(true); const html = await response.text();
  expect(html).toContain('<title>Muertitos 2026');
  expect(html).toContain('/muertitos-2026/611.webp');
  const sitemap = await request.get('/sitemap.xml'); expect(sitemap.ok()).toBe(true);
  expect((await sitemap.text()).match(/<loc>/g)).toHaveLength(20);
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

for (const viewport of [{ width: 390, height: 500 }, { width: 820, height: 390 }]) {
  test(`spotlight content does not overlap its source at ${String(viewport.width)}×${String(viewport.height)}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
    const page = await context.newPage(); await ready(page, '/work');
    await page.getByRole('link', { name: 'Combat Power Gaming', exact: true }).tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect.poll(() => page.locator('.spotlight-note').evaluate(dialog => {
      const box = dialog.getBoundingClientRect(); const echo = dialog.querySelector('.spotlight-echo')?.getBoundingClientRect();
      return Boolean(echo && (box.top >= echo.bottom + 3 || box.bottom <= echo.top - 3) && box.top >= 0 && box.bottom <= innerHeight);
    })).toBe(true);
    await page.getByRole('button', { name: 'Close', exact: true }).click(); await expect(page.getByRole('dialog')).toHaveCount(0); await context.close();
  });
}
