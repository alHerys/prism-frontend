import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-10-11T02:00:00Z')); });
test('requested composition and honest metric states fit desktop and breakpoint boundaries', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Lanjutkan pengadaan', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.dashboard-review,.sidebar-continuation')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Buka riwayat', exact: true })).toHaveCount(0);
  await expect(page.locator('.dashboard-metric')).toHaveCount(3);
  await expect(page.getByText('Pengadaan Selesai', { exact: true })).toHaveCount(0);
  const metric = page.locator('.dashboard-metric-featured');
  await expect(metric.locator('dd')).toHaveText('3');
  await expect(page.locator('.dashboard-metric > p')).toHaveText(['Pengadaan di ruang kerja', 'Dokumen menunggu konfirmasi', 'Hasil evaluasi tersimpan']);
  await expect(page.locator('.dashboard-metric-trend,.dashboard-trend-change')).toHaveCount(0);
  await expect(page.locator('.dashboard-grid > section').first()).toHaveClass(/dashboard-activity/);
  await expect(page.locator('#page-header-actions > a')).toHaveCount(0);
  await expect(page.locator('.dashboard-activity li')).toHaveCount(4);
  await expect(page.locator('.dashboard-activity time[datetime]')).toHaveCount(4);
  const icons = await page.locator('.dashboard-activity-icon svg').evaluateAll(elements => elements.map(e => e.innerHTML));
  expect(new Set(icons).size).toBe(4);
  for (const width of [1256,1538,1071,1024,1023,985,640,639,390]) {
    await page.setViewportSize({ width, height: 842 });
    const activity = await page.locator('.dashboard-activity').boundingBox();
    const continueCard = await page.locator('.dashboard-continue').boundingBox();
    if (width >= 640) expect(activity!.x).toBeLessThan(continueCard!.x);
    else expect(activity!.y).toBeLessThan(continueCard!.y);
    const cards = await page.locator('.dashboard-metric').evaluateAll(elements => elements.map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width }; }));
    expect(Math.abs(cards[0].width - cards[2].width)).toBeLessThan(1);
    if (width >= 640) { expect(cards[0].y).toBe(cards[2].y); expect(cards[0].x).toBeLessThan(cards[2].x); }
    else { expect(cards[0].x).toBe(cards[2].x); expect(cards[0].y).toBeLessThan(cards[2].y); }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 1256 || width === 985 || width === 390) await page.screenshot({ path: info.outputPath(`dashboard-${width}.png`), fullPage: true, animations: 'disabled' });
  }
  await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Navigasi ruang kerja' });
  await expect(drawer.locator('.sidebar-foot a')).toHaveCount(0);
  await drawer.getByRole('link', { name: 'Bantuan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bantuan', exact: true })).toBeVisible();
});

test('adding a real procurement increments the workspace count and preserves drilldowns', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  const metric = page.locator('.dashboard-metric-featured');
  await page.getByRole('region', { name: 'Lanjutkan pengadaan', exact: true }).getByRole('link', { name: 'Tambah pengadaan', exact: true }).click();
  await page.getByLabel('Nama pengadaan', { exact: true }).fill('Pengadaan statistik nyata');
  await page.getByLabel('Nomor pengadaan', { exact: true }).fill('STAT-2026-001');
  await page.getByLabel('Fungsi / unit kerja', { exact: true }).fill('Maintenance');
  await page.getByRole('button', { name: 'Buat pengadaan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pengadaan statistik nyata', exact: true })).toBeVisible();
  await page.keyboard.press('g'); await page.keyboard.press('d');
  await expect(metric.locator('dd')).toHaveText('4');
  await page.locator('.dashboard-activity li').first().getByRole('link').click();
  await expect(page.getByRole('heading', { name: 'Pengadaan statistik nyata', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\?tab=riwayat$/);
  await page.keyboard.press('g'); await page.keyboard.press('d');
  await metric.getByRole('link', { name: 'Lihat pengadaan aktif', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Pengadaan statistik nyata', exact: true })).toBeVisible();
});
