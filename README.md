# PRISM Frontend

Demo produk desktop berbahasa Indonesia. Frontend berjalan mandiri dengan data
sintetis, pengenalan berkas lokal, dan hasil yang telah disiapkan. **Belum terintegrasi
dengan backend, parser, atau provider AI.** State hanya berada di memori; reload
memulai sesi baru. Tidak ada file/nilai finansial di localStorage.

## Menjalankan

Dengan Node.js 22+ dan npm:

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Preview lokal: http://127.0.0.1:5173. Pada mesin Codex ini Node/npm berasal dari
runtime bundel; tidak ada instalasi Node global. Vite development membutuhkan
izin membuka port lokal. Build berada di `dist/`; belum dideploy.

## Mencoba alur

1. Buka **Penggantian Jalur Pipa Terminal** → **HEA**. Periksa Form A5 Nusa lalu
   konfirmasi. Pada Borneo, cocokkan bukti dan koreksi TKDN jasa menjadi **35%**,
   simpan, verifikasi peringatan, lalu konfirmasi.
2. Isi preferensi barang **15%**, jasa **7,5%**; simpan dan konfirmasi. Pilih kedua
   Form A5 lalu evaluasi. Buka input/jejak sumber dan ekspor Excel.
3. Di **Harga Timpang**, pilih OE dan penawaran Nusa. Periksa kedua dokumen,
   pilih **Harga satuan material dan jasa**, simpan dan konfirmasi. Dua pasangan
   valid menghasilkan hasil parsial; katup belum dipasangkan. Centang katup pada
   review untuk mencoba hasil lengkap. Input koreksi di luar skenario ditolak.
4. **Bank Data OE → Pencarian Referensi**: pilih tiga OE historis 2024–2026 dan
   nyatakan sebanding setelah memeriksa sumber. Buka statistik dan ekspor.
5. **Bantuan Estimasi**: uraian **Pengecatan tangki**, satuan **m²**, kuantitas
   **1**, **10**, atau **100**. Hasil memakai referensi terpilih dan nilai siap saji.
6. Tambah pengadaan/vendor dan unggah berkas nyata dari `public/files/`. File
   dikenal melalui SHA-256; pengubahan nama tidak mengubah hasil pengenalan.
   Nama sama dengan isi berbeda tidak diterima. PDF Form A5, XLSX OE/penawaran,
   maksimal 10 MiB. File di luar registri ditolak tanpa hasil dokumen lain.
7. Tambah OE historis dari `public/files/`, lengkapi fungsi/periode sesuai sumber,
   simpan, konfirmasi, publikasi. Lihat draft, sumber, aktivitas, dan snapshot di
   **Riwayat & Statistik**.

Berkas dapat disalin ke folder lain untuk pemilih file/drag-and-drop. Delapan
berkas disiapkan secara sintetis; tidak berisi dokumen internal Pertamina.
Registry dan asal berkas: `src/fixtures/README.md`.

## Batas dan struktur

- `src/pages/`: shell dan flow UI, formulir/review.
- `src/domain/`: state sesi, revisi/konfirmasi, skenario, snapshot immutable.
- `src/services/registry.ts`: validasi metadata dan SHA-256 lokal.
- `src/fixtures/`: registri/bukti sintetis.
- `src/export/`: XLSX dari snapshot yang dibuka; tanpa mesin finansial/formula.
- `DESIGN.md`: sistem tampilan; `BACKEND-BOUNDARY.md`: batas kontrak/migrasi.

Semua proses pembacaan, pencocokan, evaluasi, statistik dan bantuan estimasi adalah
skenario lokal. Tidak ada parser runtime. Pemeriksaan metadata bukan validasi
keamanan dokumen lengkap. Angka disimpan sebagai string desimal; pembulatan
rupiah hanya untuk presentasi, nilai penuh dipertahankan dalam snapshot/ekspor.

Model daftar pengadaan, fungsi/nomor, Bank Data, estimasi, riwayat lintas modul dan
ekspor bersifat sementara. Domain simulation mengikuti prinsip kontrak backend,
namun **bukan adapter wire API**. Integrasi perlu paket tersendiri dan izin Hery.
Backend tetap dibekukan pada `a29aaa6`. Tidak ada merge/push/deployment.

## Verifikasi

Vitest/RTL mencakup hash, batas unggah, revisi, konfirmasi, peringatan, skenario,
snapshot, preferensi, sumber PD, Bank/statistik dan round-trip XLSX. Acceptance
browser menguji pengadaan/upload/review/HEA/PD/Bank/estimasi/riwayat dan download
XLSX, serta memantau tidak adanya request backend/provider. Screenshot desktop
1366×768 dan 1920×1080 disimpan lokal di `.impeccable/review/` (gitignored).
Lihat `ACCEPTANCE.md` untuk hasil aktual dan batas verifikasi.

### Tampilan ruang kerja

Navigasi dapat diringkas melalui tombol pada tepi sidebar. Pencarian header membuka
daftar pengadaan yang sesuai tanpa memulai ulang sesi. Dalam detail pengadaan,
bilah alur memberi akses vendor, dokumen, evaluasi dan hasil. Antrean pemeriksaan
pada Ringkasan membuka review sumber/nilai langsung.

## Redesign PRISM dan workbench komponen

Tampilan desktop mengikuti komposisi PRISM: header kontekstual, banner pekerjaan
berikutnya, status, antrean/aktivitas, tabel dengan pencarian, kesiapan, sorting dan
pagination. Review memakai halaman fokus; hasil HEA/Harga Timpang tampil sebelum
persiapan ketika snapshot tersedia. SourcePanel, UploadZone, Field, Button, Badge,
PageTabs, SelectField, Hint dan state UI digunakan bersama. Ikon Phosphor diimpor
melalui subpath bertipe; Radix menangani dialog/tab/select/tooltip. Halaman dimuat
secara lazy dan ExcelJS tetap dimuat saat ekspor. Motion CSS mengikuti reduced motion.

```sh
npm run dev -- --port 5175 --strictPort
npm run test:desktop:update  # baseline lokal pertama; periksa gambarnya
npm run test:desktop         # perbandingan terhadap baseline lokal
npm run storybook            # http://127.0.0.1:6006
npm run build-storybook
npm run test:storybook:browser
```

Playwright memakai Chrome macOS yang sudah tersedia; `PRISM_BROWSER_PATH` dapat
mengganti executable. `PRISM_PREVIEW_URL` mengganti origin pengujian. Lihat
`tests/README.md`; goldens/traces tidak masuk repository. Script acceptance lama
dipertahankan sebagai bukti historis, sedangkan runner `tests/desktop.spec.ts`
adalah entry point untuk redesign terbaru. Storybook hanya perangkat pengembangan,
bukan navigasi aplikasi. Tidak ada target mobile.
