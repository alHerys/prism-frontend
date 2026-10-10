import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'node:path';
async function ready(page: Page, route: string) {
  await page.goto(route);
  await expect(page.getByText('Menyiapkan ruang kerja', { exact: true })).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}
async function profile(page: Page) {
  await ready(page, '/pengaturan');
  await page.getByLabel('Nama lengkap').fill('Rina Evaluator');
  await page.getByLabel('Email').fill('rina@example.test');
  await page.getByLabel('Peran atau jabatan').fill('Evaluator');
  await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Profil disimpan.');
}
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-10-02T02:00:00Z')); });

test('profile validates, saves, discards, protects drafts and persists UI only', async ({ page }, info) => {
  await ready(page, '/pengaturan');
  await page.getByLabel('Nama lengkap').fill('Rina Evaluator');
  await page.getByLabel('Email').fill('invalid');
  await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
  expect(await page.getByLabel('Email').evaluate((e: HTMLInputElement) => e.validity.typeMismatch)).toBe(true);
  await expect(page.locator('.workspace-avatar')).toHaveText('PR');
  await page.getByLabel('Email').fill('rina@example.test');
  await page.getByLabel('Zona waktu').selectOption('Europe/London');
  await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
  await expect(page.locator('.workspace-avatar')).toHaveText('RE');
  await page.getByLabel('Nama lengkap').fill('Draft belum disimpan');
  await page.getByRole('tab', { name: 'Tampilan', exact: true }).click();
  await page.getByRole('tab', { name: 'Profil', exact: true }).click();
  await expect(page.getByLabel('Nama lengkap')).toHaveValue('Draft belum disimpan');
  await page.getByLabel('Nama lengkap').focus();
  await page.keyboard.press('g'); await page.keyboard.press('h');
  // Typing inside form must not navigate.
  await expect(page).toHaveURL(/\/pengaturan$/);
  await page.getByRole('heading', { name: 'Pengaturan', exact: true }).click();
  await page.keyboard.press('g'); await page.keyboard.press('h');
  const guard = page.getByRole('dialog', { name: 'Perubahan profil belum disimpan' });
  await expect(guard).toBeVisible();
  await guard.getByRole('button', { name: 'Tetap di pengaturan' }).click();
  await page.getByRole('button', { name: 'Batalkan perubahan' }).click();
  await expect(page.getByLabel('Nama lengkap')).toHaveValue('Rina Evaluator');
  await page.getByLabel('Bio').fill('Draft yang dibuang saat meninggalkan halaman');
  await page.getByRole('heading', { name: 'Pengaturan', exact: true }).click();
  await page.keyboard.press('g'); await page.keyboard.press('h');
  await guard.getByRole('button', { name: 'Buang dan tinggalkan', exact: true }).click();
  await expect(page).toHaveURL(/\/bantuan$/);
  await ready(page, '/pengaturan');
  await expect(page.getByLabel('Bio')).toHaveValue('');
  await page.reload();
  await expect(page.getByLabel('Nama lengkap')).toHaveValue('Rina Evaluator');
  await ready(page, '/riwayat');
  await expect(page.locator('.history-timeline time').first()).toContainText(/GMT/);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('prism.ui-preferences.v1')!));
  expect(Object.keys(stored.preferences).sort()).toEqual(['accent','notifications','profile']);
  expect(stored.preferences.profile.timeZone).toBe('Europe/London');
  await page.screenshot({ path: info.outputPath('profile-timezone.png'), fullPage: true, animations: 'disabled' });
});

test('notification controls affect actual creation while safety errors remain visible', async ({ page }, info) => {
  await ready(page, '/pengaturan');
  await page.getByRole('tab', { name: 'Notifikasi', exact: true }).click();
  const switches = page.getByRole('switch');
  await expect(switches).toHaveCount(4);
  for (const control of await switches.all()) { await expect(control).toHaveAttribute('aria-checked','true'); await control.click(); await expect(control).toHaveAttribute('aria-checked','false'); }
  await ready(page, '/pengadaan');
  await page.getByRole('button', { name: 'Tambah pengadaan', exact: true }).click();
  await page.getByLabel('Nama pengadaan', { exact: true }).fill('Uji preferensi notifikasi');
  await page.getByLabel('Nomor pengadaan', { exact: true }).fill('PREF-001');
  await page.getByLabel('Fungsi / unit kerja', { exact: true }).fill('Maintenance');
  await page.getByRole('button', { name: 'Buat pengadaan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Uji preferensi notifikasi', exact: true })).toBeVisible();
  await expect(page.locator('.toast')).toHaveCount(0);
  // Changing preferences must not make the real created record disappear on SPA navigation.
  await page.getByRole('heading', { name: 'Uji preferensi notifikasi', exact: true }).click();
  await page.keyboard.press('g'); await page.keyboard.press('p');
  await expect(page.getByRole('link', { name: 'Uji preferensi notifikasi', exact: true })).toBeVisible();
  await ready(page, '/pengadaan/proc-terminal/review/doc-21');
  await page.getByLabel('TKDN jasa (%)').fill('25');
  await expect(page.getByRole('button', { name: 'Konfirmasi data', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('Konfirmasi diperlukan');
  await page.screenshot({ path: info.outputPath('review-safety.png'), fullPage: true, animations: 'disabled' });
});

test('all accents recolor controls and preserve semantic status colors', async ({ page }, info) => {
  await ready(page, '/pengadaan');
  const original = await page.locator('.badge.success,.badge.warning').evaluateAll(es => es.map(e => [e.textContent,getComputedStyle(e).color,getComputedStyle(e).backgroundColor]));
  for (const [label, color] of [['Forest','rgb(21, 90, 55)'],['Ocean','rgb(31, 79, 168)'],['Plum','rgb(106, 63, 176)'],['Ember','rgb(177, 73, 29)']]) {
    await ready(page, '/pengaturan');
    await page.getByRole('tab', { name: 'Tampilan', exact: true }).click();
    await page.locator('.settings-swatch-option').filter({hasText:label}).click();
    await expect.poll(() => page.getByRole('tab',{name:'Tampilan',exact:true}).evaluate(e => getComputedStyle(e).color)).toBe(color);
    await ready(page, '/pengadaan');
    expect(await page.locator('.badge.success,.badge.warning').evaluateAll(es => es.map(e => [e.textContent,getComputedStyle(e).color,getComputedStyle(e).backgroundColor]))).toEqual(original);
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-workspace-accent','ember');
  await page.screenshot({ path: info.outputPath('ember-procurement.png'), fullPage: true, animations: 'disabled' });
});

test('muted evaluation, export and publication still perform real business actions',async({page})=>{
  await ready(page,'/pengaturan');
  await page.getByRole('tab',{name:'Notifikasi',exact:true}).click();
  for(const control of await page.getByRole('switch').all()) await control.click();
  await ready(page,'/riwayat');
  await page.getByRole('tab',{name:'Hasil Evaluasi',exact:true}).click();
  const count=await page.locator('.bank-history .table tbody tr').count();
  await ready(page,'/pengadaan/proc-showcase?tab=hea');
  for(const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
  const evaluate=page.getByRole('button',{name:'Evaluasi HEA',exact:true});
  await expect(evaluate).toBeEnabled(); await evaluate.click();
  await expect(evaluate).toBeEnabled();
  await expect(page.getByRole('heading',{name:'Leaderboard HEA',exact:true})).toBeVisible();
  await expect(page.locator('.toast')).toHaveCount(0);
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'Ekspor Excel',exact:true}).click();
  expect((await download).suggestedFilename()).toMatch(/^PRISM-.*\.xlsx$/);
  await expect(page.locator('.toast')).toHaveCount(0);
  await page.getByRole('heading',{name:/Penggantian Jalur Pipa/,level:1}).click();
  await page.keyboard.press('g'); await page.keyboard.press('r');
  await page.getByRole('tab',{name:'Hasil Evaluasi',exact:true}).click();
  await expect(page.locator('.bank-history .table tbody tr')).toHaveCount(count+1);
  await ready(page,'/bank');
  await page.getByRole('button',{name:'Tambah dokumen historis',exact:true}).click();
  await page.getByLabel('Pilih OE historis').setInputFiles(path.resolve('public/files/OE-Historis-2024.xlsx'));
  await expect(page.getByRole('heading',{name:'Review dokumen historis',exact:true})).toBeVisible();
  await page.getByLabel('Fungsi',{exact:true}).first().fill('Maintenance');
  await page.getByRole('button',{name:'Simpan metadata',exact:true}).click();
  await expect(page.getByText('Metadata tersimpan. Konfirmasi dokumen sebelum publikasi.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Konfirmasi',exact:true}).click();
  await page.getByRole('button',{name:'Publikasikan',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Review dokumen historis',exact:true})).toHaveCount(0);
  await expect(page.getByText('Dokumen telah ditambahkan ke Bank Data OE.',{exact:true})).toHaveCount(0);
});

test('denied browser storage stays usable and reports session-only profile changes',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}});});
  await ready(page,'/pengaturan');
  await expect(page.getByRole('status')).toContainText('tidak dapat dimuat');
  await page.getByLabel('Nama lengkap').fill('Rina Evaluator');
  await page.getByLabel('Email').fill('rina@example.test');
  await page.getByRole('button',{name:'Simpan perubahan',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('hanya berlaku selama sesi ini');
  await expect(page.locator('.workspace-avatar')).toHaveText('RE');
  await page.reload();
  await expect(page.getByLabel('Nama lengkap')).toHaveValue('');
  await expect(page.locator('.workspace-avatar')).toHaveText('PR');
});

test('Help search intersects topics, preserves search on reset and opens multiple FAQs', async ({ page }, info) => {
  await ready(page, '/bantuan');
  await expect(page.locator('.help-faq-item')).toHaveCount(8);
  await page.getByRole('button', { name: 'Dokumen & vendor 2 artikel', exact: true }).click();
  await expect(page.locator('.help-faq-item')).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Cari artikel bantuan' }).fill('profil');
  await expect(page.getByText('Artikel belum ditemukan',{exact:true})).toBeVisible();
  await page.getByRole('button', { name: 'Tampilkan semua', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Cari artikel bantuan' })).toHaveValue('profil');
  await expect(page.locator('.help-faq-item')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Cari artikel bantuan' }).fill('');
  await page.getByRole('button', { name: 'Bagaimana membuat pengadaan?', exact: true }).click();
  await page.getByRole('button', { name: 'Bagaimana mengatur profil dan tampilan?', exact: true }).click();
  await expect(page.locator('.help-answer[data-open="true"]')).toHaveCount(2);
  await expect(page.locator('.help-answer[data-open="false"]').first()).toHaveAttribute('inert','');
  await expect(page.getByRole('button', { name: 'Mulai chat', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Email bantuan', exact: true })).toBeDisabled();
  await page.screenshot({ path: info.outputPath('help-open.png'), fullPage: true, animations: 'disabled' });
});

test('General navigation, keyboard shortcuts and UI-only Logout preserve focus and data', async ({ page }, info) => {
  await profile(page);
  await page.getByLabel('Nama lengkap').focus();
  await page.keyboard.press('Control+k');
  await expect(page.locator('.shell-search input')).toBeFocused();
  await expect(page).toHaveURL(/\/pengaturan$/);
  await page.getByRole('heading', { name: 'Pengaturan', exact: true }).click();
  await page.keyboard.press('Control+k');
  await expect(page.locator('.shell-search input')).toBeFocused();
  await page.keyboard.type('g h /');
  await expect(page).toHaveURL(/\/pengaturan$/);
  await page.getByRole('heading', { name: 'Pengaturan', exact: true }).click();
  for (const [key,path] of [['d','/'],['p','/pengadaan'],['b','/bank'],['r','/riwayat'],['s','/pengaturan'],['h','/bantuan']]) {
    await page.keyboard.press('g'); await page.keyboard.press(key);
    await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/$' : path+'$'}`));
    await expect(page.getByText('Menyiapkan ruang kerja',{exact:true})).toHaveCount(0);
  }
  await page.keyboard.press('/');
  await expect(page.getByRole('textbox',{name:'Cari artikel bantuan'})).toBeFocused();
  const narrow = info.project.use.viewport!.width < 1024;
  if (narrow) await page.getByRole('button',{name:'Buka navigasi',exact:true}).click();
  else {
    await page.getByRole('button',{name:'Ringkas navigasi',exact:true}).click();
    await expect(page.getByRole('navigation',{name:'Navigasi umum'}).getByRole('link',{name:'Pengaturan',exact:true})).toBeVisible();
  }
  const logout = page.getByRole('button',{name:'Keluar',exact:true});
  await logout.click();
  const dialog = page.getByRole('dialog',{name:'Keluar dari PRISM?'});
  await expect(dialog.getByRole('button',{name:'Tetap di PRISM'})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button',{name:'Keluar',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button',{name:'Tetap di PRISM'})).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button',{name:'Keluar',exact:true})).toBeFocused();
  await page.keyboard.press('g'); await page.keyboard.press('d');
  await expect(page).toHaveURL(/\/bantuan$/);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(narrow ? page.getByRole('button',{name:'Buka navigasi',exact:true}) : logout).toBeFocused();
  if (narrow) await page.getByRole('button',{name:'Buka navigasi',exact:true}).click();
  await logout.click();
  await dialog.getByRole('button',{name:'Keluar',exact:true}).click();
  await expect(page.locator('.toast')).toContainText('Logout belum tersedia');
  await expect(page.locator('.workspace-avatar')).toHaveText('RE');
  await expect(page).toHaveURL(/\/bantuan$/);
});

test('Help text stays readable across every accent and topic state', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const contrasts: Record<string, number[]> = {};
  for (const accent of ['Forest', 'Ocean', 'Plum', 'Ember']) {
    await ready(page, '/pengaturan');
    await page.getByRole('tab', { name: 'Tampilan', exact: true }).click();
    await page.locator('.settings-swatch-option').filter({ hasText: accent }).click();
    await ready(page, '/bantuan');
    const topic = page.locator('.help-topic').last();
    contrasts[accent] = [];
    for (const state of ['normal', 'hover', 'selected']) {
      if (state === 'normal') await page.mouse.move(0, 0);
      if (state === 'hover') await topic.hover();
      if (state === 'selected') await topic.click();
      const ratios = await topic.evaluate(element => {
        const context = document.createElement('canvas').getContext('2d')!;
        const decode = (color: string) => {
          context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1);
          return Array.from(context.getImageData(0, 0, 1, 1).data).map((v, i) => i === 3 ? v / 255 : v);
        };
        const over = (foreground: number[], background: number[]) => foreground.slice(0, 3).map((v, i) => v * foreground[3] + background[i] * (1 - foreground[3]));
        const luminance = (color: number[]) => color.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
        const ratio = (a: number[], b: number[]) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
        const bounds = (surface: Element) => {
          const background = getComputedStyle(surface).backgroundImage;
          const colors = background.match(/(?:rgba?|color)\([^)]*\)/g)!;
          const decoration = getComputedStyle(surface, '::before');
          const patternColors = decoration.backgroundImage.match(/rgba?\([^)]*\)/g)!;
          const stripe = patternColors.map(decode).sort((a, b) => b[3] - a[3])[0];
          stripe[3] *= Number(decoration.opacity);
          // Conservative brightest texture over both actual computed gradient endpoints.
          return colors.map(decode).map(color => over(stripe, color));
        };
        const foreground = decode(getComputedStyle(element.querySelector('small')!).color);
        const fill = decode(getComputedStyle(element).backgroundColor);
        const topicRatios = bounds(element.closest('.help-hero')!).map(base => {
          const background = over(fill, base);
          return ratio(over(foreground, background), background);
        });
        const contact = document.querySelector('.help-contact')!;
        const contactText = decode(getComputedStyle(contact.querySelector('p')!).color);
        return [...topicRatios, ...bounds(contact).map(background => ratio(over(contactText, background), background))];
      });
      contrasts[accent].push(...ratios);
      expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
    }
    if (accent === 'Ember') await page.screenshot({ path: info.outputPath('ember-help.png'), fullPage: true, animations: 'disabled' });
  }
  await info.attach('computed-contrast-bounds', { body: JSON.stringify(contrasts, null, 2), contentType: 'application/json' });
});

test('breakpoint boundaries have readable forms, contained dialogs and no document overflow', async ({ page }) => {
  for (const width of [375,639,640,768,1023,1024,1366,1920]) {
    await page.setViewportSize({width,height:900});
    for (const route of ['/pengaturan','/bantuan']) {
      await ready(page, route);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (route === '/pengaturan') {
        const fields = await page.locator('.settings-profile-fields input').evaluateAll(es => es.map(e => ({x:e.getBoundingClientRect().x,w:e.getBoundingClientRect().width})));
        expect(fields.every(e => e.w > 150)).toBe(true);
        expect(Math.abs(fields[0].x-fields[1].x) < 1).toBe(width < 640);
      }
    }
    if (width < 1024) await page.getByRole('button',{name:'Buka navigasi',exact:true}).click();
    await page.getByRole('button',{name:'Keluar',exact:true}).click();
    const dialog = page.getByRole('dialog',{name:'Keluar dari PRISM?'});
    await expect(dialog).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x+box.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');
  }
});

test('switch, FAQ and dialog motion have real intermediate states and reduced-motion behavior', async ({ page }) => {
  await ready(page, '/pengaturan');
  await page.getByRole('tab',{name:'Notifikasi',exact:true}).click();
  const panel = page.getByRole('tabpanel',{name:'Notifikasi',exact:true});
  await expect.poll(() => panel.evaluate(e => e.getAnimations().length), {intervals:[5,10,20]}).toBeGreaterThan(0);
  const panelMotion = await panel.evaluate(e => {
    const animations = e.getAnimations(); animations.forEach(a => { a.pause(); a.currentTime = 100; });
    const result = { opacity: Number(getComputedStyle(e).opacity), duration: getComputedStyle(e).animationDuration, easing: getComputedStyle(e).animationTimingFunction };
    animations.forEach(a => a.play()); return result;
  });
  expect(panelMotion.opacity).toBeGreaterThan(.4); expect(panelMotion.opacity).toBeLessThan(1);
  expect(panelMotion.duration).toBe('0.2s'); expect(panelMotion.easing).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
  expect(await page.getByRole('tab',{name:'Notifikasi',exact:true}).evaluate(e => getComputedStyle(e).transitionTimingFunction)).toBe('cubic-bezier(0.22, 1, 0.36, 1), cubic-bezier(0.22, 1, 0.36, 1)');
  const control = page.getByRole('switch',{name:'Pengadaan & vendor',exact:true});
  await expect.poll(() => control.locator('span').evaluate(e => new DOMMatrix(getComputedStyle(e).transform).m41)).toBe(22);
  await control.focus(); await page.keyboard.press('Space');
  await expect.poll(() => control.locator('span').evaluate(e => e.getAnimations().length), {intervals:[5,10,20]}).toBeGreaterThan(0);
  const switchMotion = await control.evaluate(e => {
    const thumb = e.firstElementChild!;
    const animations = thumb.getAnimations(); animations.forEach(a => { a.pause(); a.currentTime = 150; });
    const x = new DOMMatrix(getComputedStyle(thumb).transform).m41;
    const duration = getComputedStyle(thumb).transitionDuration;
    animations.forEach(a => a.play()); return {x,duration};
  });
  expect(switchMotion.duration).toBe('0.3s'); expect(switchMotion.x).toBeGreaterThan(0); expect(switchMotion.x).toBeLessThan(22);
  await ready(page, '/bantuan');
  const question = page.getByRole('button',{name:'Bagaimana membuat pengadaan?',exact:true});
  await question.focus(); await page.keyboard.press('Space');
  const answer = page.locator('#help-a-create');
  await expect.poll(() => answer.evaluate(e => e.getAnimations().length), {intervals:[5,10,20]}).toBeGreaterThan(0);
  const faqMotion = await answer.evaluate(e => { const animations=e.getAnimations(); animations.forEach(a=>{a.pause();a.currentTime=100;}); const opacity=Number(getComputedStyle(e).opacity); const timings=animations.map(a=>a.effect!.getTiming().duration); animations.forEach(a=>a.play()); return {opacity,timings}; });
  expect(faqMotion.timings).toContain(200); expect(faqMotion.opacity).toBeGreaterThan(0); expect(faqMotion.opacity).toBeLessThan(1);
  await page.keyboard.press('Space'); await expect(answer).toHaveAttribute('inert','');
  const narrow = (await page.evaluate(()=>innerWidth)) < 1024;
  if (narrow) await page.getByRole('button',{name:'Buka navigasi',exact:true}).click();
  await page.getByRole('button',{name:'Keluar',exact:true}).click();
  const dialog = page.getByRole('dialog',{name:'Keluar dari PRISM?'});
  expect(await dialog.evaluate(e=>getComputedStyle(e).animationDuration)).toBe('0.35s');
  expect(await dialog.evaluate(e=>getComputedStyle(e).animationTimingFunction)).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
  await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page, '/bantuan');
  await question.click();
  expect(await answer.evaluate(e=>e.getAnimations().length)).toBe(0);
});

test('static Settings and Help comparisons use stable same-content screenshots', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  for (const [route,name] of [['/pengaturan','settings'],['/bantuan','help']]) {
    await ready(page, route);
    await expect(page).toHaveScreenshot(`${name}.png`, {fullPage:true,animations:'disabled'});
    if(route==='/pengaturan') {
      for(const [tab,file] of [['Notifikasi','notifications'],['Tampilan','appearance']]) {
        await page.getByRole('tab',{name:tab,exact:true}).click();
        await expect(page).toHaveScreenshot(`${file}.png`,{fullPage:true,animations:'disabled'});
      }
    }
  }
});
