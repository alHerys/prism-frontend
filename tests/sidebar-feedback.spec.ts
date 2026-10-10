import { test, expect } from '@playwright/test';

test('edge toggle and branded footer remain reachable at breakpoint and short-height boundaries', async ({ page }, info) => {
  await page.clock.setFixedTime(new Date('2026-10-02T02:00:00Z'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const [width, height] of [[1538,790],[1024,790],[1024,480],[1023,790],[640,790],[639,790],[390,844],[390,480]]) {
    await page.setViewportSize({ width, height });
    const mobile = width < 1024;
    if (mobile) await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click();
    const navigation = mobile ? page.getByRole('dialog', { name: 'Navigasi ruang kerja' }) : page.locator('.sidebar');
    await expect(navigation.getByText('PT Pertamina Patra Niaga', { exact: true })).toBeVisible();
    await expect(navigation.getByText('Regional Kalimantan', { exact: true })).toBeVisible();
    const continuation = navigation.getByRole('link', { name: '4 dokumen perlu ditinjau', exact: true });
    await continuation.scrollIntoViewIfNeeded();
    await expect(continuation).toBeInViewport();
    const stripe = navigation.locator('.sidebar-brand-stripe');
    await expect(stripe).toBeInViewport();
    const colors = await stripe.evaluate(e => getComputedStyle(e).backgroundImage);
    expect(colors).toContain('rgb(8, 109, 181)'); expect(colors).toContain('rgb(170, 194, 55)'); expect(colors).toContain('rgb(234, 30, 48)');
    if (!mobile) {
      const toggle = page.getByRole('button', { name: 'Ringkas navigasi', exact: true });
      const bounds = await navigation.boundingBox(); const button = await toggle.boundingBox();
      expect(Math.abs(button!.x + button!.width / 2 - bounds!.x - bounds!.width)).toBeLessThan(1);
      await navigation.locator('.brand').scrollIntoViewIfNeeded();
      const logo = await navigation.locator('.brand').boundingBox();
      expect(Math.abs(button!.y + button!.height / 2 - logo!.y - logo!.height / 2)).toBeLessThan(1);
      if (height === 790) await page.screenshot({ path: info.outputPath(`sidebar-${width}.png`), animations: 'disabled' });
      await toggle.focus(); await page.keyboard.press('Enter');
      const expand = page.getByRole('button', { name: 'Perluas navigasi', exact: true });
      await expect(expand).toBeFocused(); await expect(expand).toHaveAttribute('aria-expanded', 'false');
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      // Let the existing shell width transition finish before capturing its endpoint.
      await expect.poll(() => page.locator('.workspace').evaluate(e => {
        const bounds = e.getBoundingClientRect();
        return Math.abs(bounds.right - innerWidth + 12) < 1 && getComputedStyle(e).marginLeft === '88px';
      })).toBe(true);
      await navigation.locator('.logo-symbol').scrollIntoViewIfNeeded();
      await expect(navigation.locator('.logo-symbol')).toBeInViewport();
      await navigation.locator('.logo-symbol').evaluate(e => (e as HTMLImageElement).decode());
      if (width === 1538) await page.screenshot({ path: info.outputPath('sidebar-collapsed.png'), animations: 'disabled' });
      await page.keyboard.press('Enter'); await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    } else {
      if (width === 390 && height === 844) await page.screenshot({ path: info.outputPath('sidebar-phone.png'), animations: 'disabled' });
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Buka navigasi', exact: true })).toBeFocused();
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1538, height: 790 });
  await page.locator('.sidebar-continuation').click();
  await expect(page).toHaveURL(/\/pengadaan$/);
});
