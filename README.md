<p align="center">
  <img src="public/prism_expand.svg" alt="PRISM" width="300" />
  <img src="public/pertamina.svg" alt="Pertamina Patra Niaga" width="210" />
</p>

# PRISM frontend

Aplikasi desktop untuk pengadaan/vendor, review dan konfirmasi dokumen, HEA,
Harga Timpang, Bank Data OE, riwayat, serta ekspor hasil yang dapat ditelusuri.
Menggunakan React 19, TypeScript, Vite, React Router, Radix, dan ExcelJS.

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

## Status integrasi

State masih dalam memori dan dimulai ulang saat reload. Adapter lokal mengenali
berkas terdaftar melalui SHA-256 dan menyediakan kandidat/hasil yang disiapkan;
parser umum dan backend belum terhubung. Persistensi dan autentikasi belum tersedia.
Perhitungan finansial otoritatif tetap berada di backend; model lokal belum
mengimplementasikan wire contract server.

Snapshot menyimpan input, sumber, revisi, hasil, dan pengecualian saat evaluasi;
koreksi berikutnya tidak mengubah hasil lama. Ekspor memakai snapshot tersebut,
menghasilkan empat sheet tanpa formula finansial, dan memuat ExcelJS saat ekspor.
Fixture sintetis dan artefak pengujian tidak membuktikan penerimaan pengguna atau
kesiapan produksi. Data internal dan artefak build tidak masuk repository.

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
