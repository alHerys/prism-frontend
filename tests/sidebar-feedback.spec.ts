import { test, expect } from '@playwright/test';

test('edge toggle and branded footer remain reachable at breakpoint and short-height boundaries', async ({ page }, info) => {
  await page.clock.setFixedTime(new Date('2026-10-02T02:00:00Z'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const [width, height] of [[1538,790],[1024,790],[1024,480],[1023,790],[985,842],[640,790],[639,790],[390,844],[390,480]]) {
    await page.setViewportSize({ width, height });
    const mobile = width < 1024;
    if (mobile) await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click();
    const navigation = mobile ? page.getByRole('dialog', { name: 'Navigasi ruang kerja' }) : page.locator('.sidebar');
    await expect(navigation.getByText('UMUM', { exact: true })).toHaveCount(0);
    await expect(navigation.locator('.nav-group-divider')).toHaveCSS('border-top-width', '1px');
    const footerBorder = await navigation.locator('.sidebar-organization').evaluate(e => getComputedStyle(e).borderTopColor);
    await expect(navigation.locator('.nav-group-divider')).toHaveCSS('border-top-color', footerBorder);
    if (mobile) {
      const close = navigation.getByRole('button', { name: 'Tutup navigasi', exact: true });
      const bounds = await navigation.boundingBox(); const button = await close.boundingBox();
      const logo = await navigation.locator('.brand').boundingBox();
      expect(Math.abs(button!.x + button!.width / 2 - bounds!.x - bounds!.width)).toBeLessThan(1);
      expect(Math.abs(button!.y + button!.height / 2 - logo!.y - logo!.height / 2)).toBeLessThan(1);
      await expect(close).toHaveCSS('border-radius', '12px');
      await expect(close).toHaveCSS('background-color', 'rgb(31, 79, 168)');
      if (width === 985) await page.screenshot({ path: info.outputPath('drawer-985.png'), animations: 'disabled' });
    }
    await expect(navigation.getByText('PT Pertamina Patra Niaga', { exact: true })).toBeVisible();
    await expect(navigation.getByText('Regional Kalimantan', { exact: true })).toBeVisible();
    await expect(navigation.locator(".sidebar-continuation")).toHaveCount(0);
    const stripe = navigation.locator('.sidebar-brand-stripe');
    await stripe.scrollIntoViewIfNeeded();
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
      await expect(navigation.locator('.nav-group-divider')).toBeVisible();
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
      await expect(navigation.getByRole('button', { name: 'Tutup navigasi', exact: true })).toBeInViewport();
      await navigation.getByRole('button', { name: 'Tutup navigasi', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Buka navigasi', exact: true })).toBeFocused();
      await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Buka navigasi', exact: true })).toBeFocused();
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1538, height: 790 });
  await page.getByRole('navigation', { name: 'Navigasi utama', exact: true }).getByRole('link', { name: 'Pengadaan', exact: true }).click();
  await expect(page).toHaveURL(/\/pengadaan$/);
});
