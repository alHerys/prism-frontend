import { test, expect } from '@playwright/test';

test('simplified review and vendor headers fit all layout boundaries with readable icon returns', async ({ page }, info) => {
  await page.clock.setFixedTime(new Date('2026-10-11T02:00:00Z'));
  for (const width of [390,639,640,1023,1024,1090,1199,1200,1521]) {
    await page.setViewportSize({ width, height: 842 });
    for (const route of ['vendor/vendor-nusa', 'review/doc-21', 'review/doc-24']) {
      await page.goto('/pengadaan/proc-terminal/' + route);
      const back = route.startsWith('review') ? page.locator('.review-back') : page.getByRole('button', {name: 'Tutup dokumen vendor', exact: true});
      await expect(back).toBeVisible();
      if (route.startsWith('review')) {
        await expect(back).toHaveText('');
        await expect(back).toHaveAccessibleName(/Kembali/);
        expect((await back.boundingBox())!.width).toBe(48);
      } else await expect(page.getByRole('dialog')).toBeVisible();
      if (route.startsWith('review')) {
        await expect(page.getByRole('button', { name: 'Simpan perubahan', exact: true })).toHaveCount(0);
        await expect(page.getByText(/Nilai awal:/)).toHaveCount(0);
        await expect(page.locator('.review-source .evidence,.review-save-state,.review-document-identity p')).toHaveCount(0);
        await expect(page.getByText('Periksa pasangan', { exact: true })).toHaveCount(0);
        await expect(page.locator('.review-source')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Konfirmasi data', exact: true })).toBeVisible();
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      if (width === 390 || width === 1521) await page.screenshot({ path: info.outputPath(`${route.replaceAll('/', '-')}-${width}.png`), fullPage: true, animations: 'disabled', mask: [page.locator('iframe')] });
      if (route === 'review/doc-21' && width === 390) {
        await page.getByRole('button', { name: 'Tutup bukti sumber', exact: true }).click();
        await page.screenshot({ path: info.outputPath('review-editor-390.png'), animations: 'disabled' });
      }
      if (route === 'vendor/vendor-nusa') { await back.click(); await expect(page).toHaveURL(/\?tab=ringkasan$/); }
    }
    if (width === 390 || width === 1521) {
      await page.goto('/pengadaan/proc-tank');
      await expect(page.locator('.stage-vendors .vendor-collection-heading p')).toHaveText('Tambahkan vendor dan periksa dokumennya sebelum evaluasi.');
      const trigger = page.getByRole('button', { name: 'Tambah vendor', exact: true });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Tambah vendor', exact: true });
      await expect(dialog.locator(':scope > p')).toHaveCount(0);
      await expect(dialog).not.toHaveAttribute('aria-describedby');
      await expect(page.getByLabel('Nama badan usaha')).toBeFocused();
      await page.screenshot({ path: info.outputPath(`vendor-dialog-${width}.png`), animations: 'disabled' });
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
    await page.goto('/pengadaan/proc-terminal?tab=dokumen');
    const overview = page.locator('.procurement-document-overview');
    await expect(overview.locator('> section').first()).toContainText('Unggah Owner Estimate (OE)');
    await expect(overview.locator('> section').first().locator('.upload-document-options,.panel-header .badge')).toHaveCount(0);
    const owner = await overview.locator('> section').first().boundingBox();
    const vendors = await overview.locator('> section').nth(1).boundingBox();
    if (width >= 1200) expect(owner!.x).toBeLessThan(vendors!.x);
    else expect(owner!.y).toBeLessThan(vendors!.y);
    if (width === 390 || width === 1521) await page.screenshot({ path: info.outputPath(`documents-${width}.png`), fullPage: true, animations: 'disabled' });
  }
});
