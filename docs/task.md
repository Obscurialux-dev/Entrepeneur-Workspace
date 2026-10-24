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

- [x] **T010 — Firebase client/server setup** (`DONE`)
  - Pisahkan konfigurasi Firebase client dan Admin SDK.
  - Tambahkan konfigurasi emulator.
  - Acceptance: aplikasi dapat berjalan lokal tanpa membocorkan Admin credentials ke client.
  - Implementasi (24 Okt 2026):
    - `src/lib/firebase/config.ts`: config web publik + `missingFirebaseEnv()` /
      `assertFirebaseConfig()` yang melaporkan **semua** variabel hilang sekaligus (nama saja,
      tanpa nilai). `isFirebaseEmulator()` dan `emulatorHosts()` membaca `*_EMULATOR_HOST`.
    - `src/lib/firebase/client.ts`: Web SDK (app/auth/firestore) + `connectAuthEmulator` /
      `connectFirestoreEmulator` hanya di browser. Tidak mengimpor apa pun dari Admin SDK.
    - `src/lib/firebase/admin.ts`: Admin SDK server-only; memakai emulator bila
      `FIRESTORE_EMULATOR_HOST`/`FIREBASE_AUTH_EMULATOR_HOST` diset, selain itu service account
      dari env. `getAdminDb`/`getAdminAuth` adalah singleton.
    - `firebase.json` (firestore :8080, auth :9099, rules + indexes) dan `firestore.indexes.json`
      (composite `status ASC + updatedAt DESC`).
    - `npm run check:env` (`scripts/check-env.mjs`) memvalidasi env tanpa mencetak nilai dan keluar
      non-zero bila wajib belum diisi. Diverifikasi: `.env.local` → "OK".
  - Catatan keamanan: `.env.example` sempat berisi **nilai asli** (private key service account dan
    OAuth client secret) di working tree. File sudah dikembalikan ke placeholder; nilai asli hanya
    ada di `.env.local` (di-ignore Git). Nilai tersebut **tidak** pernah masuk commit, tetapi
    sebaiknya dirotasi karena pernah tersimpan di berkas yang tracked.

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

- [x] **T012 — Authentication** (`DONE`)
  - Implementasikan login/logout dan proteksi route internal.
  - Jangan mengizinkan self-signup internal secara default (akun dibuat/diaktifkan admin;
    role diberikan lewat `npm run set:role`).
  - Acceptance: pengguna anonim tidak dapat membuka workspace internal.
  - Selesai (24 Okt 2026):
    - `POST /api/auth/session` memverifikasi ID token (`verifyIdToken`) lalu membuat session cookie
      httpOnly 5 hari; `POST /api/auth/logout` mencabut refresh token (Admin SDK) dan menghapus cookie.
    - `src/proxy.ts` (konvensi Next 16, menggantikan `middleware.ts` yang deprecated) mengarahkan
      permintaan tanpa cookie sesi pada rute internal ke `/login?callbackUrl=...`.
    - Grup `(workspace)` memverifikasi sesi per request dan mengarahkan anonim ke `/login`.
    - Sesi anonim tidak mendapat izin apa pun (`can(null, ...)` === false).
  - Diperbaiki (sesi ini): alur login diganti dari Google OAuth popup menjadi **Firebase Authentication
    email/sandi** (`signInWithEmailAndPassword`) di `/login`, tombol Keluar pada header workspace yang
    memanggil `signOut()` + `POST /api/auth/logout`, dan Google OAuth dihapus dari alur login.
    Tidak ada self-signup: "Belum memiliki akses? Hubungi admin" diarahkan ke pembuatan akun oleh admin.
    Prototipe `WORKSPACE_PROTOTYPE_ROLE` hanya aktif di non-produksi, tidak memberikan akses produksi.
    Integrasi Google Cloud (Calendar API) dipertahankan terpisah dari autentikasi aplikasi.
  - Build produksi lulus (`npm run build`, exit 0), lint lulus, tes unit policy lulus.

- [x] **T013 — Role and permission checks** (`DONE`)
  - Implementasikan role `entrepreneur_admin`, `research`, `marketing`, `executive_viewer`.
  - Tegakkan di server dan Firestore Rules.
  - Acceptance: tes positif dan negatif untuk setiap role lulus.
  - `src/lib/permissions/policy.ts` adalah satu-satunya sumber matriks role → permission (8
    permission); `can()` sekarang menolak `null`/role tak dikenal, dan `ForbiddenError` menerima
    `ActorRole` (`Role | "anonymous"`).
  - `src/lib/auth/session.ts` menjadi chokepoint otorisasi: `getSession()` memverifikasi cookie
    Firebase, mengambil role dari custom claim, dan **tidak** jatuh ke sesi prototipe bila cookie
    ada tetapi tidak valid (celah bypass yang ditemukan dan diperbaiki pada sesi ini). Fallback
    prototipe hanya aktif bila `NODE_ENV !== "production"` **dan** `WORKSPACE_PROTOTYPE_ROLE` diset.
  - Penetapan role: `npm run set:role -- <uid|email> <role>` (`scripts/set-role.mjs`) memakai
    `setCustomUserClaims` + `revokeRefreshTokens`. Diverifikasi terhadap Auth emulator: claim
    `{"role":"research"}` tersimpan dan terbaca.
  - Firestore Rules menegakkan matriks yang sama, termasuk **marketing tidak boleh menulis produk**
    (sebelumnya rules lebih longgar daripada policy; sudah diselaraskan).
  - Test lulus: 8 unit test policy (`npm test`) + 11 kasus rules per role (`npm run test:emulator`).

- [x] **T014 — Firestore rules baseline** (`DONE`)
  - Buat rules deny-by-default.
  - Tambahkan test dengan Firebase Emulator Suite.
  - Acceptance: akses publik/internal sesuai `security.md`.
  - `firestore.rules`: deny-by-default, produk/varian berbasis role dengan validasi tipe (harga/HPP
    integer >= 0, status resmi) dan audit field immutable (`createdAt`/`createdBy`), serta `users`
    tidak dapat menaikkan `role`/`permissions`/`disabled` sendiri.
  - Test: `src/lib/firebase/firestore.rules.emulator.test.ts` memakai `@firebase/rules-unit-testing`
    (10 kasus: anonim ditolak, viewer baca saja, research boleh tulis, marketing baca saja, validasi
    create, createdBy palsu, update createdAt, hapus hanya admin, varian, profil pengguna).
  - `npm run test:emulator` menjalankan seluruh suite terhadap emulator; hasil: 80 test lulus
    (54 non-emulator + 15 integrasi repository Firestore + 11 rules termasuk parent).
  - Lingkungan: firebase-tools 15 mensyaratkan JDK >= 21 (Java 17 yang terpasang ditolak). Verifikasi
    memakai JDK 21 lokal di `~/.cache/ew-jdk21/jdk-21.0.13+9` melalui `JAVA_HOME`; tidak ada
    instalasi sistem.

- [ ] **T015 — Dashboard shell** (`TODO`)
  - Buat placeholder dashboard dengan komponen dan query yang belum memuat data sensitif.
  - Acceptance: UI responsif dan state loading/error/empty tersedia.

## Phase 2 — Product and Open PO

- [x] **T020 — Product CRUD** (`DONE`)
  - Buat produk dan varian, validasi harga integer IDR.
  - Acceptance: CRUD sesuai role dan ada test validasi.
  - Selesai:
    - Domain + aturan bisnis: `src/features/products/types.ts` (status resmi, harga efektif varian,
      margin) dan `money.ts` (parser IDR: menerima `95000`, `95.000`, `Rp 95.000`; menolak desimal,
      teks, negatif, dan nilai di luar batas).
    - Validasi server Zod: `schema.ts` untuk create/update produk, varian, dan query daftar.
    - Persistensi: `ProductRepository` (kontrak) + `JsonProductRepository` di `.data/products.json`
      dengan penulisan diserialisasi/atomic; SKU unik (case-insensitive), `createdAt`/`createdBy`
      tidak berubah saat update.
    - Server Actions: `createProductAction`, `updateProductAction`, `setProductStatusAction`,
      `addVariantAction`, `updateVariantAction`, `removeVariantAction` — semuanya memanggil
      `requirePermission` dan memakai `revalidatePath`.
    - UI: daftar produk dengan pencarian, filter status, paginasi, badge status, margin; form
      tambah/edit dengan pesan validasi per field; panel status; manajer varian (tambah, ubah,
      hapus) dengan mode baca-saja untuk role tanpa izin; empty state; skeleton; banner
      "mode prototipe" yang eksplisit.
    - Test: 35 test (`npm test`) lulus — money (5), schema validasi (11), repository (13),
      permission policy (6).
    - Verifikasi HTTP nyata: create produk via Server Action (POST progresif) membuat record
      integer IDR dengan `createdBy` dari sesi; input harga desimal dan SKU duplikat ditolak
      dengan pesan field; tambah varian tersimpan; role `executive_viewer` ditolak di server
      dan hanya melihat mode baca-saja.
  - Migrasi persistensi ke Firestore (24 Okt 2026):
    - `src/features/products/repository.firestore.ts` mengimplementasikan seluruh
      `ProductRepository` memakai **Firebase Admin SDK** (server-side). Sebelumnya memakai Web SDK
      dari Server Action, yang berarti request tanpa identitas dan akan ditolak rules.
    - `src/features/products/repository.firestore.mapping.ts`: pemetaan dokumen → domain,
      penulisan `FieldValue.serverTimestamp()`, normalisasi SKU, pencarian name/SKU/category.
    - `create`/`update` memakai `ref.set`/`ref.update` sehingga `createdAt`/`createdBy` tidak
      pernah tertimpa; SKU unik dijaga dengan query + pemeriksaan duplikat.
    - Halaman daftar dan detail produk kini membaca dari `repository.firestore.ts`
      (sebelumnya masih `repository.json.ts`, sehingga tulisan Firestore tidak terlihat di UI).
    - Pencarian tetap di memori (Firestore tidak punya substring match) dengan batas
      `SEARCH_SCAN_LIMIT = 500` dokumen; paginasi memakai `offset`+`limit`.
    - Test: 17 unit test mapping + 14 test integrasi repository terhadap emulator Firestore
      (CRUD, SKU duplikat, paginasi, filter status, pencarian, varian, NOT_FOUND).
    - `JsonProductRepository` dipertahankan beserta 13 test sebagai fallback lokal/rujukan kontrak,
      tetapi tidak lagi dipakai oleh UI.
  - Batasan tersisa: pencarian hanya atas jendela 500 dokumen (butuh search index bila katalog
    besar), belum ada halaman riwayat/audit, dan UI belum diuji interaktif terhadap emulator
    (verifikasi sesi ini: `npm run build` + test emulator).

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

**T012 — Authentication (selesaikan)**: verifikasi alur Google sign-in end-to-end dengan OAuth
client nyata (`/login` → `/api/auth/session` → cookie `__session`), tambahkan tombol logout pada
header workspace, dan batasi domain email internal. Selebihnya sudah selesai dan diuji pada sesi
24 Okt 2026: T010, T013, T014, dan T020 berstatus `DONE`.

Setelah T012, lanjut **T021 — PO campaign management** langsung di atas Firestore memakai pola
`repository.firestore.ts`. Keputusan Firebase sudah diambil: dipakai sekarang.

Catatan operasional:

- Emulator: `JAVA_HOME=<jdk-21> npm run test:emulator` (firebase-tools 15 menolak Java < 21).
- Role: `npm run set:role -- <uid|email> <role>`; tidak ada self-signup internal.
- Env: `npm run check:env` mencetak nama variabel yang hilang tanpa membocorkan nilai.
- Rotasi kredensial: private key service account dan OAuth client secret pernah tersimpan di
  `.env.example` pada working tree (tidak pernah masuk commit). Rotasi tetap disarankan.

Jangan langsung membangun seluruh aplikasi. Kerjakan satu task dalam satu waktu.
