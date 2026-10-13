# Desktop acceptance

Run the frontend preview at `http://127.0.0.1:5175`, then `npm run test:desktop`.
`PRISM_PREVIEW_URL` overrides that URL; `PRISM_BROWSER_PATH` overrides the local
Chrome executable. This suite uses the installed `@playwright/test` runner and
Chrome, with desktop projects at 1366×768 and 1920×1080, Indonesian locale,
Jakarta timezone and reduced motion. It does not cover mobile.

The browser starts with fresh production synthetic state for each test. The
fixed Date controls screenshot timestamps while processing timers remain live.
Nonlocal requests are blocked; the full evaluation flow also asserts no outbound
HTTP requests or browser errors. Native Chrome PDF resources are allowed. File upload uses independent registered public PDF
bytes through the actual input and SHA-256 recognition path. Exported XLSX files
are opened with ExcelJS and checked for exact HEA output, percentage strings,
partial exclusions and source values. These checks verify the prepared frontend
scenario, not a backend parser, financial implementation or evaluator acceptance.

Screenshots use Playwright `expect(page).toHaveScreenshot`. Local baselines live
in `test-results/snapshots/{project}/prism-*.png`; traces, failed captures and
XLSX downloads live in `test-results/playwright/`. Those folders are
ignored by Git. Create a first local baseline with `npm run test:desktop:update`,
inspect the images, then rerun `npm run test:desktop` to verify comparison. Updating
an image is not evidence of visual acceptance; changes still require inspection.
The same Chrome/browser, fonts and platform should be used when comparing images.
The native PDF embed is masked in layout captures; upload/review tests assert
its registered source URL, PDF response and review values. Freeze baselines before refactoring and compare afterward;
do not update them to hide interface changes.

Coverage includes sidebar collapse, all main result pages, mandatory confirmation,
warning acknowledgement, explicit price groups, partial results, real upload
failure/recovery, dirty navigation save/discard, Radix keyboard focus trapping,
reduced and active motion, and real procurement search/sort/pagination.

For final verification prefer the built Vite preview, so development hot reload
cannot reset the prepared in-memory state during a flow. After starting Storybook
at port 6006, `npm run test:storybook:browser` runs a separate smoke suite over all
ten component stories at both desktop sizes. It checks Select/Tabs, the long table
and filter, file selection, dialog keyboard focus/Escape and error retry. Override
`PRISM_STORYBOOK_URL` if needed. The first long-table baseline can be created with
`npm run test:storybook:browser -- --update-snapshots` and inspected locally.

Architecture verification uses isolated `ApplicationProviders` and module providers, navigation
remounts, preserved formatter variants, revision/confirmation checks, subscriber
isolation and immutable historical snapshots. A fixed-clock fingerprint checks all
original seeded values, IDs, event order and prepared snapshots. Browser coverage
also compares computed styles on direct routes and navigation, retains tab drafts,
and checks that ExcelJS loads when exporting. `prism/architecture` in ESLint guards
static/type imports, re-exports, literal dynamic imports, layer violations, browser globals and cycles; tests can construct isolated adapters. Node suites exercise domain/application without DOM.

Production bundle measurement (Vite, minified kB; gzip in parentheses):

| JavaScript | Before | After |
| --- | ---: | ---: |
| Entry | 514.16 (161.73) | 502.93 (159.75) |
| ExcelJS, deferred | 936.98 (270.74) | 936.98 (270.74) |
| All JS chunks combined | 1572.95 (473.28) | 1577.15 (476.62) |

Combined sizes include lazy chunks; they are not initial-page transfer sizes.
The emitted CSS is byte-identical to the frozen baseline. All fixture bytes and
registry fingerprints are unchanged. The entry shrank; additional lazy modules
increased the combined transfer slightly. Obsolete acceptance runners were removed.

Verified on 4 October 2026: typecheck, ESLint, 71 unit/interaction/Node tests,
application build and Storybook build; 14 desktop, four local-workflow and two
Storybook browser tests pass at both sizes without updating screenshots.
`npm run fixtures:prepare` validates eight originals and creates the ignored
`fixture-kit/`. `PRISM_WORKFLOW_GUIDE` dapat menambahkan panduan lokal eksternal
sebagai `PANDUAN-WORKFLOW.md`; panduan tidak diperlukan untuk menyiapkan bytes. Tooling tests validate commands, links,
output names and copied fingerprints. Konfigurasi Storybook memakai `PRISM_STORYBOOK_CONFIG_DIR` atau pengaturan Git
lokal `prism.storybookConfigDir`; konfigurasi tidak disertakan dalam repository.

## Perubahan dokumen pengadaan

`npm run test:procurement` memeriksa card OE, penggantian dan konfirmasi ulang,
penghapusan dengan konfirmasi/batal, sumber lama melalui navigasi browser,
unggahan gagal, metadata header, serta chip dokumen pada Petak/Tabel vendor.
Alur kini memiliki tiga tahap. Identitas, vendor dan OE berada pada tahap
Identitas & vendor; URL lama `tab=dokumen` dialihkan ke `tab=ringkasan`.
Buka dokumen membuka modal vendor berisi Form A5 dan Penawaran Harga: kartu
berkas menuju review, sedangkan bagian kosong menerima unggahan. Kembali dari
review membuka modal vendor terkait. URL `/pengadaan/:id/vendor/:vendorId` lama
mengarah ke workspace dengan parameter `vendor`. Suite mencakup kedua berkas
tersedia, satu tersedia, keduanya kosong, serta unggahan PDF/XLSX dari modal.
Suite memakai 1366×768, 1520×842, 1920×1080, 2053×972, 705×842 dan 390×844; screenshot observasi
disimpan di `test-results/procurement-documents/`, tanpa mengubah golden lama.
Gunakan `PRISM_PREVIEW_URL` untuk memilih URL preview build lokal.

## Review Form A5

`npm run test:review` memeriksa embed PDF bawaan browser dan respons sumber PDF,
header nama file, drawer desktop/ponsel, fokus keyboard/Escape, animasi aktif dan
reduced motion, serta draft saat panel dibuka/tutup. Suite juga memeriksa navigasi,
konfirmasi evaluator dan acknowledgement A5 di dialog konfirmasi, bukan drawer.
Penghapusan A5/Penawaran Harga memerlukan persetujuan eksplisit, mempertahankan
dokumen lain milik vendor, dan mengembalikan slot unggah. Metadata OE diperiksa
sebagai dua baris berikon untuk tanggal dan jam. Di bawah 900px drawer mengambang dari
kanan dan tertutup saat halaman pertama dibuka; desktop membagi area PDF/drawer.
Ukuran yang diperiksa: 1366×768, 1920×1080, 1368×695 dan 390×844. Screenshot berada
di `test-results/review-source/`; baseline lama tidak diperbarui. Capture layout tidak dijadikan bukti isi plugin PDF: respons bytes sumber
diperiksa terpisah. Native viewer tetap mengikuti dukungan browser yang dipakai.
Kontrol zoom/cetak/unduh mengikuti viewer browser, bukan kode aplikasi.
Pengujian memakai data sintetis frontend lokal; konfirmasi tetap wajib.

## Evaluasi pengadaan ringkas

`npm run test:evaluation` memeriksa halaman evaluasi ringkas pada desktop dan
ponsel: dua tahap pengadaan, satu aksi simpan/konfirmasi/evaluasi preferensi,
evaluasi seluruh A5 aktif terkonfirmasi, penghapusan A5 menghasilkan hasil
parsial, dan ekspor Excel tetap menyimpan vendor serta sumber. Tautan lama
`tab=riwayat` dialihkan ke evaluasi dengan parameter snapshot dipertahankan.
Tahap riwayat pengadaan dihapus dari UI; data snapshot/aktivitas tetap disimpan.
Preferensi berada di kiri dan sticky pada desktop (mulai 1024px), lalu ditumpuk
di atas hasil pada layar lebih kecil. Tes scroll memeriksa posisi sticky nyata.
Leaderboard memakai urutan snapshot tanpa filter/sorting, dengan tautan PDF
berdasarkan identitas sumber snapshot. Kondisi kosong, tautan dokumen native,
tombol Lihat Detail dan ekspor Excel juga diperiksa. Tombol preferensi kini
berlabel Simpan; aksi simpan/konfirmasi/hitung tetap sama. Kembali dari sumber
PDF mempertahankan halaman evaluasi dan parameter hasil asal. Harga Timpang
hanya menampilkan hasil tersimpan, tanpa pemilihan sumber/tombol hitung.
Ringkasan Barang/Jasa berupa dua card dan jumlah Produk/timpang dipisahkan
berikon. Pengecualian tetap tersimpan dalam snapshot dan laporan Excel.

## Impor Form A5 bertab

`npm run test:intake` memakai Chrome pada 1376×695 dan 390×844. Transport ekstraksi
di-intercept secara eksplisit dengan PDF sintetis dan respons kontrak uji.
Skenario mencakup popup Tambah vendor (multi-PDF, drag-and-drop, batal/Escape dan
fokus kembali), lima kandidat/konfirmasi per tab, draft persen desimal, keyboard,
blob PDF asli yang tetap tersedia setelah publikasi, konflik nama dan hash,
penggantian A5 dengan Penawaran Harga tetap ada, retry per file, drop pada card
vendor dan hilangnya batch setelah reload. Screenshot observasi berada di
`test-results/a5-intake/`; tidak ada golden yang diperbarui.

Unit tests memeriksa antrean dua request, pembatalan/hasil terlambat, hash mismatch,
field kosong, acknowledgement, query immutable, publikasi atomik, revisi stale,
dan kontrak/error/timeout HTTP. Respons uji tidak membuktikan akurasi Gemini;
provider asli dan backend tidak diubah atau dijalankan oleh suite ini.
