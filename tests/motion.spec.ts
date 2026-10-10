import { test, expect } from '@playwright/test';

test('primary feedback and modal motion retain final states and keyboard dismissal', async ({ page }) => {
  await page.goto('/pengadaan');
  const trigger = page.getByRole('button', { name: 'Tambah pengadaan', exact: true });
  const before = await trigger.evaluate(element => {
    const css = getComputedStyle(element);
    return { background: css.backgroundImage, duration: css.transitionDuration };
  });
  expect(before.duration.split(',').map(value => parseFloat(value))).toContain(.2);
  await trigger.hover();
  await expect.poll(() => trigger.evaluate(element => getComputedStyle(element).backgroundImage)).not.toBe(before.background);
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Tambah pengadaan', exact: true });
  await expect(dialog).toBeVisible();
  const timing = await dialog.evaluate(element => {
    const css = getComputedStyle(element);
    return { duration: css.animationDuration, easing: css.animationTimingFunction };
  });
  expect(timing.duration).toBe('0.35s');
  expect(timing.easing).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
  await expect.poll(() => dialog.evaluate(element => element.getAnimations().length)).toBe(0);
  await expect(page.getByLabel('Nama pengadaan', { exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test('drawer motion, intermediate state and reduced motion preserve navigation', async ({ page }, info) => {
  test.skip(info.project.use.viewport!.width >= 1024, 'Mobile drawer belongs below1024px.');
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Buka navigasi', exact: true });
  await trigger.click();
  const drawer = page.getByRole('dialog', { name: 'Navigasi ruang kerja' });
  const motion = await drawer.evaluate(element => {
    const css = getComputedStyle(element);
    const animation = element.getAnimations()[0];
    if (animation) { animation.pause(); animation.currentTime = 225; }
    const intermediateX = element.getBoundingClientRect().x;
    const progress = animation?.effect?.getComputedTiming().progress;
    animation?.play();
    return { duration: css.animationDuration, easing: css.animationTimingFunction, progress, intermediateX };
  });
  expect(motion.duration).toBe('0.45s');
  expect(motion.easing).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
  expect(motion.progress).not.toBeNull();
  expect(motion.intermediateX).toBeLessThan(0);
  expect(motion.intermediateX).toBeGreaterThan(-290);
  await expect.poll(() => drawer.evaluate(element => element.getAnimations().length)).toBe(0);
  expect((await drawer.boundingBox())!.x).toBe(0);
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await trigger.click();
  await expect(drawer).toBeVisible();
  expect(await drawer.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await drawer.getByRole('link', { name: 'Pengadaan', exact: true }).click();
  await expect(page).toHaveURL(/\/pengadaan$/);
  await expect(drawer).toHaveCount(0);
});

test('Bank overview collapses smoothly, reverses and respects reduced motion', async ({ page }) => {
  await page.goto('/bank');
  const overview = page.locator('.bank-overview-region');
  const documents = page.getByRole('tab', { name: 'Dokumen Historis', exact: true });
  const statistics = page.getByRole('tab', { name: 'Statistik Harga', exact: true });
  await documents.click();
  await expect(overview).toHaveAttribute('data-visible', 'true');
  await expect.poll(() => overview.evaluate(element => element.getAnimations().length)).toBe(0);
  const fullHeight = (await overview.boundingBox())!.height;
  await statistics.click();
  await expect(overview).toHaveAttribute('inert', '');
  const sample = await overview.evaluate(element => {
    const animations = element.getAnimations();
    const timings = animations.map(animation => animation.effect!.getTiming().duration);
    const easings = animations.map(animation => animation.effect!.getTiming().easing);
    for (const animation of animations) {
      animation.pause();
      const timing = animation.effect!.getTiming();
      animation.currentTime = Number(timing.duration) / 2;
    }
    const height = element.getBoundingClientRect().height;
    const opacity = Number(getComputedStyle(element).opacity);
    animations.forEach(animation => animation.play());
    return { height, opacity, timings, easings };
  });
  expect(sample.timings).toContain(200);
  expect(sample.timings).toContain(180);
  expect(sample.easings).toContain('cubic-bezier(0.22, 1, 0.36, 1)');
  expect(sample.easings).toContain('ease-out');
  expect(sample.height).toBeGreaterThan(0);
  expect(sample.height).toBeLessThan(fullHeight);
  expect(sample.opacity).toBeGreaterThan(0);
  expect(sample.opacity).toBeLessThan(1);
  await expect.poll(() => overview.evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
  // Keyboard activation remains possible while the tab moves with the collapsing
  // overview. A pointer click waits for stability and would miss rapid reversal.
  await documents.press('Enter');
  await expect(overview).toHaveAttribute('aria-hidden', 'false');
  await expect.poll(() => overview.evaluate(element => element.getAnimations().length)).toBe(0);
  expect((await overview.boundingBox())!.height).toBeCloseTo(fullHeight, 0);
  await page.getByRole('button', { name: 'Tinjau statistik referensi', exact: true }).click();
  await expect(statistics).toBeFocused();
  await expect.poll(() => overview.evaluate(element => element.getBoundingClientRect().height)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await documents.click();
  expect(await overview.evaluate(element => element.getAnimations().length)).toBe(0);
  await expect(overview).not.toHaveAttribute('inert', '');
});
