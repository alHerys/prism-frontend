<div align="center">

<img src="public/pertamina-symbol.png" alt="PRISM logo" width="180" />

# PRISM

**A desktop procurement evaluation workspace for reviewing documents, comparing prices, and preserving traceable results.**

<br />

![Platform](https://img.shields.io/badge/Platform-Desktop%20Web-086DB5?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-102D45?style=for-the-badge)
![Build](https://img.shields.io/badge/Build-Vite-65C466?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-Offline%20Demo-7B8794?style=for-the-badge)

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
| Operating mode | Offline frontend demonstration |
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
| State model | In-memory session services | Menjaga state demo selama satu sesi browser. |
| Workbook | ExcelJS | Membuat ekspor XLSX dari snapshot lokal. |
| Testing | Vitest, React Testing Library, Playwright, Storybook | Unit, interaction, browser, dan component verification. |
| Backend | Belum terhubung | Frontend mengikuti batas kontrak yang disiapkan untuk integrasi berikutnya. |
| Database | Tidak digunakan | Data demo berasal dari fixture lokal. |
| Authentication | Tidak digunakan | Login berada di luar cakupan frontend demo. |

## Project structure

```text
frontend/
├── public/
│   ├── files/              # Berkas fixture yang dapat dipilih pengguna
│   └── pertamina*.{svg,png} # Identitas visual aplikasi
├── src/
│   ├── domain/              # Tipe, aturan sesi, revisi, konfirmasi, dan snapshot
│   ├── export/              # Pembuatan workbook XLSX
│   ├── fixtures/            # Registri berkas, bukti, dan skenario lokal
│   ├── pages/               # Dashboard dan halaman modul pengadaan
│   ├── services/            # Pengenalan berkas dan layanan simulasi
│   ├── components.tsx       # Komponen UI bersama
│   └── App.tsx              # Shell dan routing aplikasi
├── tests/                   # Browser dan Storybook acceptance tests
├── scripts/                 # Generator fixture dan helper acceptance
├── package.json
└── vite.config.ts
```

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

### Verification commands

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:desktop
npm run storybook
```

All data and processing in the submitted frontend are local scenarios. File selection performs metadata and SHA-256 registry checks in the browser; it does not upload files or parse arbitrary documents at runtime. Reloading the page starts a new in-memory session. Financial calculations are not recomputed by the frontend export flow.

## Team

| Name | Role | Responsibilities | Contact |
| --- | --- | --- | --- |
| Hery | Project Coordinator | Product direction, review, and acceptance. | Project owner |
| Alvianto Hery Sarborn | Software Engineer | Frontend architecture, implementation, testing, and documentation. | Repository maintainer |

---

PRISM is a frontend demonstration project. Backend integration, authentication, deployment configuration, and production data services are separate workstreams.
