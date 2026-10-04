# Berkas dan skenario frontend

Seluruh berkas dalam `public/files/` dibuat independen untuk pengujian frontend.
Tidak ada data Pertamina, tanda tangan asli, atau dokumen internal yang digunakan.
Nama penyedia, dokumen, serta nilai merupakan data sintetis. Aplikasi tidak menjalankan
parser atau perhitungan finansial; hash berkas terdaftar memilih kandidat dan hasil
skenario yang telah disiapkan. Keterangan ini merupakan dokumentasi pengembang,
bukan label pada UI atau laporan.

## Sumber

- `a5-nusa`: HPB 1.000.000.000; HPJ 300.000.000; KNB 25.000.000; TKDN 40%/30%.
- `a5-borneo`: HPB 1.040.000.000; HPJ 320.000.000; KNB 18.000.000; TKDN 50%/35%.
- `oe-terminal`, `bid-nusa`, `bid-borneo`: pipa baja, pemasangan pipa dan katup gate;
  harga satuan serta lokasi sheet/sel dicatat dalam registri.
- `history-2024`–`history-2026`: pengecatan tangki, m², harga 85.000/90.000/95.000.

Fixture peringatan Borneo meminta pemeriksaan TKDN jasa; penawaran Borneo mempunyai
dua kelompok harga untuk pengujian pemilihan eksplisit. Referensi 2024 sendiri
merupakan skenario pengamatan tunggal/data tidak memadai.

## Regenerasi

Jalankan `scripts/generate-pdf-fixtures.py` dengan Python bundled yang menyediakan
reportlab, lalu `scripts/generate-workbook-fixtures.mjs` dengan Node bundled dan
`@oai/artifact-tool`. Script kedua menulis enam workbook dan memperbarui SHA-256
seluruh delapan berkas dalam `file-registry.json`. File hasil inspeksi `.inspect.ndjson`
adalah keluaran alat dan tidak perlu disimpan dalam aset publik.

Regenerasi workbook dapat mengubah hash. Commit berkas dan registri bersama;
fingerprint yang tidak cocok ditolak oleh layanan upload. Tidak ada fallback nama
berkas atau hasil finansial untuk nilai bebas di luar skenario.

## Ekspor

`src/modules/evaluations/infrastructure/workbook.ts` memakai ExcelJS yang dimuat saat dibutuhkan. Nilai hasil
ditulis sebagai string agar seluruh digit desimal snapshot dipertahankan. Workbook
tidak memuat formula atau menjalankan evaluasi ulang. Ekspor selalu memakai snapshot
yang dibuka, bukan kondisi draft terbaru. Unduhan dipicu lokal; tidak ada upload jaringan.

Persentase terhadap OE memakai rasio tersimpan `percentageAgainstOE` (1,25 menjadi
125%), bukan selisih relatif `deviation` (0,25). Konversi tampilan hanya menggeser
representasi desimal secara tekstual, tanpa membagi/menghitung harga atau klasifikasi.
Statistik Bank Data diekspor hanya jika sudah tersedia dalam snapshot.
