<div align="center">

<p>
  <img src="docs/images/prism-logo.png" alt="PRISM logo" width="360" />
  &nbsp;&nbsp;&nbsp;
  <img src="public/pertamina.svg" alt="Pertamina Patra Niaga logo" width="240" />
</p>

# PRISM

**A desktop procurement evaluation workspace for reviewing documents, comparing prices, and preserving traceable results.**

<br />

![Platform](https://img.shields.io/badge/Platform-Desktop%20Web-086DB5?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-102D45?style=for-the-badge)
![Build](https://img.shields.io/badge/Build-Vite-65C466?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Modular-7B8794?style=for-the-badge)

</div>

---

## Table of contents

- [Project overview](#project-overview)
- [Key features](#key-features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Team](#team)

## Project overview

| Item | Details |
| --- | --- |
| Application Type | Desktop web application |
| Primary Platform | Web browser |
| Operating mode | Offline frontendnstration |
| Interface language | Indonesian |

PRISM membantu tim pengadaan memeriksa dokumen, meninjau kandidat data, mengonfirmasi nilai yang digunakan untuk evaluasi, membandingkan harga, dan menyimpan hasil yang dapat ditelusuri. Frontend ini menggunakan skenario lokal yang realistis agar seluruh alur dapat diperagakan tanpa koneksi layanan eksternal.

## Key features

| Feature | What the user can do |
| --- | --- |
| Procurement workspace | Membuat pengadaan, menambahkan vendor, dan melihat progres setiap tahap. |
| Document review | Mengunggah berkas lokal, memeriksa metadata, meninjau kandidat, menangani peringatan, dan mengulang proses. |
| HEA evaluation | Meninjau Form A5, mengoreksi nilai, mengonfirmasi preferensi, dan melihat hasil evaluasi. |
| Unequal price review | Memilih sumber harga, memeriksa pasangan item, mengoreksi data, dan melihat hasil per kategori. |
| OE data bank | Mempublikasikan data historis, mencari referensi, memeriksa kesebandingan, dan melihat statistik harga. |
| Estimation assistance | Memasukkan kebutuhan, memilih referensi, dan melihat estimasi beserta sumbernya. |
| History and snapshots | Melihat koreksi, konfirmasi, publikasi, aktivitas, dan snapshot hasil. |
| Workbook export | Mengunduh ringkasan dan rincian dari snapshot yang sedang dibuka dalam format XLSX. |

## Technology stack

| Category | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19 + TypeScript | Membangun antarmuka dan alur kerja desktop. |
| Build tool | Vite | Development server dan production build. |
| Routing | React Router | Navigasi antar modul dan tahap pengadaan. |
| UI primitives | Radix Primitives | Dialog, tab, select, dan tooltip yang dapat diakses. |
| Icons | Phosphor Icons | Ikon antarmuka yang konsisten. |
| State model | In-memory session services | Menjaga state aplikasi selama satu sesi browser. |
| Workbook | ExcelJS | Membuat ekspor XLSX dari snapshot lokal. |
| Testing | Vitest, React Testing Library, Playwright, Storybook | Unit, interaction, browser, dan component verification. |
| Backend | Belum terhubung | Frontend mengikuti batas kontrak yang disiapkan untuk integrasi berikutnya. |
| Database | Tidak digunakan | Data implementation berasal dari fixture lokal. |
| Authentication | Tidak digunakan | Login berada di luar cakupan frontend. |

## Project structure

```text
frontend/
├── public/                 # Aset dan berkas sintetis
├── src/
│   ├── app/                # Bootstrap, router, shell, dan instance sesi
│   ├── features/           # Dashboard, procurement, review, hea,
│   │                       # price-deviation, bank, history
│   ├── shared/             # UI, model sesi, formatter, snapshot, stylesheet
│   ├── services/           # Kontrak/binding React, implementation, dokumen, ekspor
│   └── fixtures/           # Registri berkas sintetis
├── tests/                  # Verifikasi browser aplikasi dan Storybook
└── scripts/                # Generator fixture dan helper fixture
```

Alur aplikasi: **halaman → hook/layanan → state sesi**. Halaman menyusun tampilan
fitur; hook mengelola draft dan tindakan melalui `SessionService`. Provider memakai
satu instance offline dengan `useSyncExternalStore`; tes memakai instance terisolasi.
Adapter lokal berbagi satu store dan hasil finansial yang sudah disiapkan. Snapshot
menyimpan salinan input saat evaluasi sehingga koreksi berikutnya tidak mengubah
hasil lama; ekspor memakai snapshot tersebut dan memuat ExcelJS saat diperlukan.
Aturan import ESLint menjaga batas `app`, `features`, `shared`, dan `services`.
Urutan import stylesheet mempertahankan cascade global dan pemuatan per route.

## Getting started

### Prerequisites

- Node.js 22 atau versi lebih baru.
- npm 10 atau versi lebih baru.
- Browser desktop modern.

### Installation

1. **Clone the repository**

   ```sh
   git clone https://github.com/[PROFILE]/[REPOSITORY].git
   ```

2. **Navigate to the frontend**

   ```sh
   cd [REPOSITORY]/frontend
   ```

3. **Install dependencies**

   ```sh
   npm ci
   ```

4. **Run the development server**

   ```sh
   npm run dev
   ```

Open the URL printed by Vite, usually `http://127.0.0.1:5173`.

### Workflow lokal

Lihat [panduan workflow](WORKFLOW-GUIDE.md) untuk unggah, review, konfirmasi,
evaluasi, dan ekspor. Berkas fixture tersedia di `public/files/`. Jalankan `npm run fixtures:prepare`
untuk menyiapkan paket fixture dan `npm run test:local-regression` untuk memeriksa
workflow melalui preview lokal.

### Verification commands

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:desktop
npm run build-storybook
npm run test:storybook:browser
```

All data and processing in the submitted frontend are local scenarios. File selection performs metadata and SHA-256 registry checks in the browser; it does not upload files or parse arbitrary documents at runtime. Reloading the page starts a new in-memory session. Financial calculations are not recomputed by the frontend export flow.

## Team

| Name | Role | Responsibilities | Contact |
| --- | --- | --- | --- |
| Trisha Malina Hanim | Product Manager | Product direction, scope, and stakeholder alignment. | Project contact |
| Novita Azka Maghfira | Software Engineer | Software implementation, technical review, and integration support. | Project contact |
| Alvianto Hery Sarborn | Software Engineer | Frontend architecture, implementation, testing, and documentation. | [@alHerys](https://github.com/alHerys) |

---

PRISM is a frontendnstration project. Backend integration, authentication, deployment configuration, and production data services are separate workstreams.
