<p align="center">
  <img src="public/prism_expand.svg" alt="PRISM" width="300" />
  <img src="public/pertamina.svg" alt="Pertamina Patra Niaga" width="210" />
</p>

# PRISM frontend

Aplikasi desktop untuk pengadaan/vendor, review dan konfirmasi dokumen, HEA,
Harga Timpang, Bank Data OE, riwayat, serta ekspor hasil yang dapat ditelusuri.
Menggunakan React 19, TypeScript, Vite, React Router, Radix, ExcelJS, dan JSZip.

## Struktur dan dependensi

```text
src/
  app/                    bootstrap, provider, router, layout
  modules/                procurement, documents, hea, price-deviation,
                          historical-prices, evaluations
  pages/                  dashboard, history, komposisi pengadaan
  infrastructure/         adapter local dan browser
  shared/                 kernel, UI, formatting, styles
```

Alur **halaman → hook → use case/port → state sesi** memisahkan presentation dari
aturan domain dan adapter. Modul memiliki `domain`, `application`, `presentation`,
serta `infrastructure` ketika diperlukan. Satu runtime lokal menyediakan query
immutable per modul melalui `useSyncExternalStore`; tes menyuntikkan runtime
terisolasi. Shared tidak mengimpor modul bisnis. ESLint menjaga batas import dan
siklus.

## Menjalankan dan memeriksa

Gunakan Node.js 22+ dan npm 10+ dari direktori frontend:

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Untuk browser: jalankan `npm run preview -- --port 5175`, lalu
`npm run test:desktop` dan `npm run test:local-regression`. Untuk komponen:
konfigurasi Storybook lokal eksternal, `npm run build-storybook`, `npm run storybook`, lalu
`npm run test:storybook:browser`. Ukuran yang diverifikasi: 1366×768 dan 1920×1080.
Petunjuk dan ukuran bundle di [pengujian](tests/README.md).
`npm run fixtures:prepare` menyiapkan paket pengujian dari bytes asli
`public/files/`.

## Pengadaan Pertamina lokal

`npm run dev` otomatis memakai paket Pertamina jika register sumber lokal tersedia.
Tanpa berkas lokal, perintah ini menjalankan runtime sintetis.
`npm run dev:standard` selalu memilih runtime sintetis.

`npm run demo:pertamina` juga memverifikasi empat sumber terdaftar dan referensi lokal,
menyiapkan katalog privat di `../data-pertamina/demo/pertamina-v1/`, kemudian
menjalankan aplikasi di `http://127.0.0.1:5173`. Sumber asli dibaca tanpa diubah.
Python hanya diperlukan saat menyiapkan paket; runtime browser tidak memanggil
backend, provider AI, atau layanan Python. `PRISM_PYTHON` dapat memilih executable
Python dan `PRISM_DEMO_PORT` mengganti port lokal; jika port terpakai, Vite memilih port berikutnya.
Anda juga dapat menggunakan `npm run dev -- --port 5180`.

Tiga pengadaan memakai kode PGD-001 (unggah dari awal), PGD-002 (A5/OE tersedia),
dan PGD-003 (sumber dan hasil lengkap). Form A5 dikenali berdasarkan SHA-256,
bukan nama berkas. Simpan langsung mengonfirmasi nilai. HEA dihitung ulang dari
A5 dan preferensi tersimpan menggunakan konteks decimal.js 50 digit. Hasil lama
tetap immutable; penyimpanan identik tidak membuat hasil duplikat. Harga Timpang
memakai hasil referensi yang disiapkan; koreksi tabel OE/penawaran tidak mengubah
evaluasi. Data sesi hilang setelah reload.

Katalog, PDF/XLSX asli dan hasil internal tetap berada di luar Git. Server lokal
hanya menyajikan aset pada allowlist. Build tanpa konfigurasi paket memakai
runtime sintetis dan tidak menyertakan data Pertamina.
Perhitungan lokal bukan implementasi wire contract backend atau persistensi.

## Deployment Vercel dengan data terpisah dari GitHub

Kode repository ini dapat diimpor sebagai proyek Vite di Vercel. Gunakan root
repository frontend, Build Command `npm run build`, dan Output Directory `dist`.
Konfigurasi SPA mendukung URL pengadaan langsung dan refresh halaman.

Setelah menjalankan aplikasi lokal untuk menyiapkan katalog, buat paket:

```sh
npm run package:pertamina
```

Paket JSON ditulis ke `../data-pertamina/demo/pertamina-deployment.json`, di luar
repository. Unggah paket tersebut ke penyimpanan HTTPS pilihan Anda. URL unduhan
harus mengembalikan bytes berkas langsung, bukan halaman preview. URL bertanda
tangan boleh digunakan jika masa berlakunya mencakup waktu build berikutnya.
Jangan unggah paket ke GitHub.

Pada pengaturan Environment Variables Vercel, isi untuk Preview/Production:

- `PRISM_PERTAMINA_PACKAGE_URL`: URL HTTPS unduhan paket.
- `PRISM_PERTAMINA_PACKAGE_SHA256`: hash yang dicetak oleh perintah pembuatan paket.

Lakukan redeploy setelah mengubah konfigurasi. Build mengambil dan memverifikasi
paket serta hash keempat sumber, kemudian menyertakan aset dalam hasil deployment.
Python dan akses workspace lokal tidak diperlukan di Vercel. URL penyimpanan
hanya digunakan saat build dan tidak disertakan dalam JavaScript browser.
Jika unduhan/hash gagal, build gagal agar data yang salah tidak ditampilkan.
Tanpa variabel paket, deployment memakai data sintetis.

Data dan berkas sumber dalam deployment dapat diakses pengunjung situs. Menjaga
paket di luar GitHub tidak membatasi akses ke data yang ditampilkan Vercel.
Jika diperlukan, aktifkan pembatasan akses deployment sesuai konfigurasi akun.
Penyimpanan aplikasi tetap in-memory; refresh mengembalikan tiga skenario awal.
Kode ini tidak otomatis melakukan push atau deployment.
Lihat [panduan Vite di Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Estimasi Bank Data OE

Bank Data langsung menampilkan kebutuhan estimasi tanpa tab dokumen, pencarian,
atau statistik harga. Seluruh referensi dengan satuan yang sama digunakan otomatis.
Harga satuan estimasi adalah median semua harga tersebut; untuk jumlah genap,
median adalah rata-rata dua nilai tengah. Total adalah median dikalikan kuantitas.
Perhitungan lokal memakai string desimal dan konteks decimal.js terisolasi.
Tidak ada referensi dengan satuan cocok akan menonaktifkan aksi estimasi.
Unggah, review metadata, konfirmasi, dan publikasi dokumen tetap tersedia.

Daftar Pengadaan menampilkan Pengadaan, Vendor, serta aksi buka. Riwayat hanya
menampilkan Aktivitas dan Statistik Aktivitas; hasil HEA/Harga Timpang dan ekspornya
tetap tersedia pada ruang kerja pengadaan. Snapshot tersimpan tidak dihapus.

## Status integrasi

State masih dalam memori dan dimulai ulang saat reload. Adapter lokal mengenali
berkas terdaftar melalui SHA-256 dan menyediakan kandidat/hasil yang disiapkan;
OE memiliki parser XLSX lokal khusus struktur detail referensi; parser dokumen
lain dan backend kalkulasi belum terhubung. Persistensi dan autentikasi belum tersedia.
Perhitungan finansial otoritatif tetap berada di backend; model lokal belum
mengimplementasikan wire contract server.

Snapshot menyimpan input, sumber, revisi, hasil, dan pengecualian saat evaluasi;
koreksi berikutnya tidak mengubah hasil lama. Ekspor memakai snapshot tersebut,
menghasilkan empat sheet tanpa formula finansial, dan memuat ExcelJS saat ekspor.
Fixture sintetis dan artefak pengujian tidak membuktikan penerimaan pengguna atau
kesiapan produksi. Data internal dan artefak build tidak masuk repository.

## Preview dan review Owner Estimate

**Lihat** membuka spreadsheet read-only dengan No., Uraian Pekerjaan, serta
Jumlah Harga Material/Jasa. Pencarian mempertahankan induk, kategori dapat
dibuka/ditutup, dan header/dua kolom awal sticky di dalam area scroll.
Di bawah 900px, lebar minimum tabel 576px mempertahankan Arial 14px dan memakai
horizontal scrolling; desktop menggunakan lebar minimum 900px.

Ikon pensil memasuki Mode Edit dengan pemilihan sel, double-click/Enter/ketik
untuk mengedit, Tab/Shift+Tab antar-sel, Enter/Shift+Enter antar-baris, dan Escape
untuk membatalkan sel aktif. **Simpan Perubahan** memvalidasi seluruh draft,
menyimpan dan mengonfirmasi dalam satu operasi, lalu kembali ke Mode Lihat.
Draft mempertahankan revisi saat edit dimulai. Keluar dengan perubahan memakai
dialog Simpan/Buang/Lanjut Mengedit; refresh/tutup tab memakai peringatan native.
Subtotal/total berasal dari dokumen dan tidak dihitung ulang. Harga satuan serta
snapshot evaluasi lama tidak berubah oleh edit Jumlah Harga.

Unggah/Ganti OE membaca bytes XLSX nyata, mendeteksi header detail tanpa
bergantung pada nama sheet, dan meminta pilihan bila ada beberapa tabel.
Kosong, nol, cache rumus kosong dan cache tidak tersedia dibedakan. Rumus serta
tautan eksternal tidak dijalankan. Nilai tak tersedia wajib diisi atau ditandai
kosong oleh evaluator sebelum konfirmasi; peringatan sumber diperiksa inline.
Batas teknis: berkas 10 MiB, 2.000 bagian ZIP, total XML yang dibaca 50 MiB,
10.000 baris unik dan 200.000 sel per worksheet. Struktur yang berbeda atau
berkas rusak ditolak tanpa penggantian dengan data sintetis. Sumber asli dan kandidat dipertahankan;
dokumen yang dihapus/diganti menjadi arsip read-only dalam sesi.

`npm run test:oe` memeriksa browser desktop/ponsel. Verifikasi referensi lokal
opsional (tanpa menyalin isinya ke Git):

```sh
PRISM_OE_REFERENCE=/absolute/path/OE.xlsx npm test -- src/infrastructure/owner-estimate/parser.test.ts
```

## Impor vendor melalui Form A5

Panel Identitas & vendor menerima beberapa PDF melalui drag-and-drop atau
**Unggah Form A5**. Review batch memiliki satu tab per PDF, viewer native browser,
koreksi identitas/nilai, pilihan konflik, dan konfirmasi per dokumen. Vendor baru
hanya muncul setelah konfirmasi. Batas awal: 10 PDF per batch, 10 MiB per PDF,
dan dua request ekstraksi bersamaan. Seluruh data impor bersifat sementara;
reload penuh menghapusnya. Tombol utama **Tambah vendor** membuka popup unggah
beberapa PDF yang mendukung drag-and-drop. Pengisian manual tetap tersedia
melalui opsi sekunder di popup tersebut.

Frontend mengirim bytes PDF ke `POST {baseUrl}/form-a5/extractions` dengan header
`Content-Type: application/pdf` dan `X-Document-Filename` yang di-encode.
`VITE_DOCUMENT_API_URL` mengatur alamat layanan publik, default `/api`.
Vite development mem-proxy `/api` ke `http://127.0.0.1:8000` dan menghapus prefix
`/api`; deployment/preview memerlukan reverse proxy atau alamat layanan yang
mendukung origin frontend. Jangan memasukkan API key ke variabel frontend.

Respons harus memuat `sha256`, `candidate`, dan `warnings`. Kandidat menyediakan
`vendor_name`, `vendor_quote`, serta `hpb`, `hpj`, `knb`, `tkdn_barang`, `tkdn_jasa`;
setiap field numerik memuat decimal string/null `value`, string/null `quote`,
dan nomor halaman/null `page`. TKDN berupa rasio 0–1. Frontend memvalidasi respons
serta hash sumber dan tidak mengganti kegagalan backend dengan hasil palsu.
Kredensial/model/provider dikonfigurasi di backend pada tahap integrasi berikutnya.

Ekstraksi dipisahkan dari publikasi vendor melalui port application. Sumber asli,
kandidat, koreksi dan bukti sumber dipertahankan dalam sesi. Nilai impor tidak
memakai hasil kalkulasi fixture; evaluasinya belum tersedia sampai backend
kalkulasi diintegrasikan. `npm run test:intake` menguji alur dengan transport HTTP
uji eksplisit, bukan panggilan LLM nyata.
