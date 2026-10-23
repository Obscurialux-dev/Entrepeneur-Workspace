# Task Backlog

Status: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`

Aturan: kerjakan satu task kecil atau satu kelompok task yang saling bergantung. Sebelum menandai `DONE`, jalankan pemeriksaan yang relevan, ringkas perubahan, dan perbarui dokumentasi.

## Phase 0 — Planning dan repository

- [x] **T001 — Inspect environment** (`DONE`)
  - Periksa OS, Node.js, npm, Git, dan versi tooling yang tersedia.
  - Jangan instal atau upgrade global tanpa alasan.
  - Laporkan temuan dan rekomendasi versi kompatibel.
  - Acceptance: versi dan status lingkungan dicatat.
  - Temuan (14 Okt 2026, tanpa instalasi/perubahan apa pun selain update task.md ini):
    - **OS:** Ubuntu 26.04.1 LTS, x86_64, kernel 7.0.0-31.
    - **Node.js:** v22.22.1 (paket apt `nodejs`), **npm** 9.2.0 (paket apt `npm`), npx 9.2.0, corepack 0.24.0. Memenuhi syarat Next.js 16 (Node >= 20.9) dan firebase-tools 15.x (Node 20/22/24).
    - **Git:** 2.53.0; identitas repo terkonfigurasi; branch `main`, **tanpa remote**; 1 commit `222a687` "Initial commit from Create Next App".
    - **Tooling lain:** VS Code 1.137.0, python3, curl, wget tersedia; registry npmjs.org terjangkau (ada jaringan).
    - **Tidak tersedia:** Java (Wajib untuk Firebase Emulator Suite — butuh JRE >= 11), Firebase CLI global (cukup `npx firebase-tools` / devDependency), Docker, yarn/pnpm/bun. Tidak ada instalasi global yang dilakukan.
    - **Status repo:** kerangka Next.js di commit HEAD (`package.json` dengan `next@16.3.5`, React 19.2.8, Tailwind v4, TypeScript strict, ESLint 9, `package-lock.json` lockfileVersion 3) **terhapus di working tree (unstaged)**; `docs/` untracked; `README.md` dimodifikasi; `.gitignore` ikut terhapus; `node_modules` tidak ada.
    - **`.clinerules/entrepreneur-workspace.md`** belum ada di workspace; tersedia di `/home/obscurialux/Downloads/entrepreneur-workspace-cline-docs/.clinerules/` (salin saat T003).
    - **Rekomendasi versi kompatibel:** Next.js 16.x (latest saat inspeksi: 16.4.0), React 19.x, Tailwind CSS v4, TypeScript 5 strict, ESLint 9, npm sebagai package manager dengan `package-lock.json` di-commit.
    - **Keprihatinan kompatibilitas / tindak lanjut:** (1) pasang JRE >= 11 (mis. `sudo apt install openjdk-17-jre-headless`) sebelum T010/T014 — butuh persetujuan karena instalasi sistem; (2) npm 9.2.0 lebih lama dari npm bawaan Node 22 — pertimbangkan upgrade lokal sebelum `npm install`; (3) di T002 putuskan: pulihkan kerangka dari HEAD vs scaffold baru `next@16.4.0`, tanpa menghapus `README.md`/`docs/`.

- [x] **T002 — Initialize repository** (`DONE`)
  - Keputusan: pulihkan kerangka Next.js dari commit HEAD (`222a687`), bukan scaffold baru.
  - 18 file kerangka dipulihkan satu per satu via `git restore --worktree` (`.gitignore`, `AGENTS.md`, `CLAUDE.md`, `eslint.config.mjs`, `next.config.ts`, `package.json`, `package-lock.json`, `postcss.config.mjs`, `public/*.svg`, `src/app/*`, `tsconfig.json`). `README.md` dan `docs/` tidak disentuh; tidak ada `git clean`/`reset`; tidak ada file untracked yang dihapus.
  - `package.json` konsisten dengan `package-lock.json` (lockfileVersion 3; name/version/deps cocok; 438 paket terkunci: next 16.3.5, react 19.2.8, tailwindcss 4.3.3, typescript 5.9.3, eslint 9.39.5). Lockfile identik dengan HEAD sehingga sudah ter-commit.
  - `npm ci` sukses (371 paket terpasang, exit 0). Catatan: warning deprecation npm untuk eslint@9.39.5 (dipakai oleh `eslint-config-next@16.3.5`; tidak diubah).
  - Hasil pemeriksaan: `npm run lint` lulus (exit 0); `npm run build` lulus (exit 0, TypeScript check lulus di dalam build); dev server berjalan (HTTP 200 di localhost:3000, ready 642ms). Tidak ada script `typecheck`/`test` di `package.json` (dilaporkan, tidak ditambahkan); `npx tsc --noEmit` mandiri gagal pada tipe global `LayoutProps` yang dibuat Next.js di `.next/types` — perilaku normal scaffold Next 16, bukan error kode.
  - `.gitignore` ada dan mengabaikan `.env*` (baris 34) serta `*.tsbuildinfo`; tidak ada secret/env yang ter-track Git. Catatan T004: `.env*` juga mengabaikan `.env.example` — perlu negasi `!.env.example` saat T004.
  - `README.md`: hanya menambahkan satu seksi `## Setup pengembangan lokal` (prasyarat + perintah npm) sesuai acceptance "README memiliki instruksi setup"; seksi lain dipertahankan.
  - Tidak ada Java/Firebase CLI/npm global yang diinstal; tidak ada modul aplikasi (auth/Firestore/dashboard) yang diimplementasikan.

- [x] **T003 — Add project docs and rules** (`DONE`)
  - `docs/project.md`, `architecture.md`, `data-model.md`, `security.md`, `task.md`, `model-workflow.md` dipertahankan (dibaca ulang sebelum T010).
  - `.clinerules/entrepreneur-workspace.md` disalin dari `/home/obscurialux/Downloads/entrepreneur-workspace-cline-docs/.clinerules/` (verifikasi `diff` identik, 63 baris).
  - Baseline dokumentasi di-commit: README (dengan instruksi setup), `docs/`, `.clinerules/`.

- [x] **T004 — Add environment template** (`DONE`)
  - `.env.example` dibuat: placeholder config web publik Firebase, `FIREBASE_SERVICE_ACCOUNT_KEY` (server-only), dan flag emulator. Tidak ada nilai asli/secret.
  - `.gitignore`: `.env*` dipertahankan dan ditambahkan negasi `!.env.example`. Verifikasi `git check-ignore`: `.env.example` tidak di-ignore; `.env`, `.env.local`, `.env.production` di-ignore.

## Phase 1 — App foundation

- [ ] **T010 — Firebase client/server setup** (`TODO`)
  - Pisahkan konfigurasi Firebase client dan Admin SDK.
  - Tambahkan konfigurasi emulator.
  - Acceptance: aplikasi dapat berjalan lokal tanpa membocorkan Admin credentials ke client.

- [x] **T011 — Shared UI shell** (`DONE`)
  - Buat layout responsif, sidebar, header, breadcrumb, loading/error states.
  - Gunakan UI yang konsisten dan aksesibel.
  - Acceptance: halaman workspace mempunyai navigasi dasar yang berfungsi.
  - Implementasi:
    - `src/app/(workspace)/layout.tsx` memasang `WorkspaceLayout` + `navItems`; shell berisi sidebar sticky/kollapsibel, drawer mobile dengan overlay dan tombol menu di header, header dengan judul terderivasi dari rute, breadcrumb, serta `loading.tsx` dan `error.tsx` tingkat grup.
    - `src/components/layout/*`: `sidebar.tsx` (navigasi bertingkat, `aria-current`, `aria-expanded`, state aktif), `header.tsx` (menu mobile, aksi, identitas pengguna), `breadcrumb.tsx` (Beranda → seksi → halaman), `workspace-layout.tsx`.
    - `src/lib/navigation.tsx` menjadi sumber tunggal struktur navigasi; seluruh rute anak punya halaman placeholder agar tidak 404.
    - Primitif UI (`button`, `card`, `input`, `label`, `badge`) memakai token desain di `globals.css` (light + dark, `--input` ditambahkan) dan bisa dirender dari Server Component.
    - Halaman publik `/po` memakai shell terpisah tanpa sidebar internal.
  - Verifikasi: `npx tsc --noEmit` bersih; `npm run lint` bersih; `npm run build` sukses (28 rute statis); smoke test dev server: `/` → 307 ke `/dashboard`, `/dashboard` 200, `/po` 200.
  - Batasan: belum ada autentikasi/otorisasi (T012–T014), data masih placeholder lokal, Firebase belum diinisialisasi (T010 sengaja ditunda).

- [ ] **T012 — Authentication** (`TODO`)
  - Implementasikan login/logout dan proteksi route internal.
  - Jangan mengizinkan self-signup internal secara default.
  - Acceptance: pengguna anonim tidak dapat membuka workspace internal.

- [ ] **T013 — Role and permission checks** (`TODO`)
  - Implementasikan role `entrepreneur_admin`, `research`, `marketing`, `executive_viewer`.
  - Tegakkan di server dan Firestore Rules.
  - Acceptance: tes positif dan negatif untuk setiap role lulus.

- [ ] **T014 — Firestore rules baseline** (`TODO`)
  - Buat rules deny-by-default.
  - Tambahkan test dengan Firebase Emulator Suite.
  - Acceptance: akses publik/internal sesuai `security.md`.

- [ ] **T015 — Dashboard shell** (`TODO`)
  - Buat placeholder dashboard dengan komponen dan query yang belum memuat data sensitif.
  - Acceptance: UI responsif dan state loading/error/empty tersedia.

## Phase 2 — Product and Open PO

- [ ] **T020 — Product CRUD** (`TODO`)
  - Buat produk dan varian, validasi harga integer IDR.
  - Acceptance: CRUD sesuai role dan ada test validasi.

- [ ] **T021 — PO campaign management** (`TODO`)
  - Buat draft, schedule, activate, close campaign.
  - Acceptance: status dan waktu campaign divalidasi server.

- [ ] **T022 — Public PO page** (`TODO`)
  - Render hanya informasi publik campaign aktif.
  - Acceptance: halaman publik tidak membaca koleksi privat.

- [ ] **T023 — Public order submission endpoint** (`TODO`)
  - Validasi input, hitung total di server, idempotency, dan kebijakan stok.
  - Acceptance: request manipulatif ditolak; retry tidak membuat duplikat.

- [ ] **T024 — Orders dashboard** (`TODO`)
  - List, pagination, filter, detail order, status.
  - Acceptance: order dari public form muncul tanpa input manual.

- [ ] **T025 — Payment verification** (`TODO`)
  - Verifikasi oleh role yang berwenang, bukti pembayaran privat, audit log.
  - Acceptance: perubahan status tercatat dan hanya role yang berwenang dapat memverifikasi.

## Phase 3 — Inventory and finance

- [ ] **T030 — Inventory model and movement log** (`TODO`)
  - Tetapkan model stok per varian dan kebijakan reservasi.
  - Acceptance: semua perubahan stok mempunyai movement record.

- [ ] **T031 — Atomic stock operations** (`TODO`)
  - Terapkan transaksi atomik untuk reservasi/release/deduction.
  - Acceptance: tes pemesanan bersamaan tidak oversell pada mode stok terbatas.

- [ ] **T032 — Finance transactions** (`TODO`)
  - Catat pemasukan, biaya, HPP, refund sesuai aturan status.
  - Acceptance: pending order tidak dianggap kas masuk.

- [ ] **T033 — Sales and finance reports** (`TODO`)
  - Omzet, HPP, laba kotor, biaya, kas masuk/keluar, piutang.
  - Acceptance: laporan bisa direkonsiliasi dengan transaksi sumber.

## Phase 4 — Research and Marketing

- [ ] **T040 — Vendor database** (`TODO`)
- [ ] **T041 — Research projects and reports** (`TODO`)
- [ ] **T042 — Content items and asset links** (`TODO`)
- [ ] **T043 — Marketing planning and campaigns** (`TODO`)
- [ ] **T044 — Publishing calendar and archive** (`TODO`)
- [ ] **T045 — Research-to-Marketing handoff** (`TODO`)
  - Acceptance: materi edukasi yang siap dari Research dapat dijadwalkan Marketing tanpa duplikasi data.

## Phase 5 — Tasks and calendar

- [ ] **T050 — Tasks and assignments** (`TODO`)
- [ ] **T051 — Team timeline and calendar UI** (`TODO`)
- [ ] **T052 — Google OAuth connection design** (`TODO`)
  - Tetapkan ownership kalender, scope minimal, token storage, revoke flow.
- [ ] **T053 — One-way Calendar sync** (`TODO`)
  - Firestore event ke Google Calendar, simpan event ID, retry idempotent.
  - Acceptance: update event tidak membuat duplikat.

## Phase 6 — Reporting and launch

- [ ] **T060 — CSV export** (`TODO`)
- [ ] **T061 — XLSX / Google Sheets integration decision** (`TODO`)
- [ ] **T062 — Executive dashboard** (`TODO`)
- [ ] **T063 — End-to-end tests** (`TODO`)
- [ ] **T064 — Production security review** (`TODO`)
- [ ] **T065 — Deployment and operations guide** (`TODO`)

## Current next task

**T010 — Firebase client/server setup** (menunggu keputusan untuk membuka kembali penundaan Firebase).
Jika Firebase masih ditunda, lanjutkan ke **T012/T015**: rancang alur autentikasi dan role di `docs/security.md`, lalu lengkapi empty state dashboard. Jangan menandai T010–T014 `DONE` sebelum Firebase Emulator Suite benar-benar berjalan dan tes rules dijalankan.

Jangan langsung membangun seluruh aplikasi. Kerjakan satu task dalam satu waktu.
