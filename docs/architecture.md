# Architecture: Entrepreneur Workspace

## 1. Prinsip arsitektur

- Modular monolith untuk aplikasi web pada tahap awal.
- Cloud Firestore sebagai sumber data utama.
- Logika bisnis sensitif dijalankan di backend/Cloud Functions.
- Frontend tidak boleh menjadi sumber kebenaran untuk harga, stok, role, atau pembayaran.
- Integrasi pihak ketiga harus mempunyai status, error handling, dan retry yang aman.
- Hindari abstraksi berlebihan sebelum ada kebutuhan nyata.

## 2. Stack yang direncanakan

| Layer | Teknologi |
|---|---|
| Web | Next.js App Router + TypeScript strict |
| UI | Tailwind CSS |
| Database | Cloud Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Backend | Firebase Cloud Functions (gunakan runtime dan versi yang didukung saat implementasi) |
| Local testing | Firebase Emulator Suite |
| Tests | Unit/integration tests; Playwright untuk alur UI penting |
| Calendar | Google Calendar API |
| Spreadsheet | Google Sheets API |
| Version control | Git |
| Package manager | Pilih satu (npm disarankan awal) dan commit lockfile |

Jangan mengunci versi dependency secara membabi buta. Saat mulai, periksa versi stabil dan kompatibilitas Node.js/Firebase terkini, lalu simpan versi dan lockfile.

## 3. Hosting

Keputusan: **Vercel** (Hobby plan) untuk aplikasi Next.js App Router.
- Vercel secara otomatis mendeteksi Next.js dan menjalankan `next build` / `next start`, mendukung
  SSR, Server Actions, Server Component rendering, dan middleware tanpa konfigurasi tambahan.
- Firebase Authentication dan Cloud Firestore tetap digunakan sebagai layanan backend; keduanya
  kompatibel dengan Firebase Spark plan (tidak perlu upgrade ke Blaze).
- Firebase Admin SDK berjalan di sisi server (API routes dan Server Actions) dengan kredensial
  dari variabel lingkungan Vercel; kredensial tidak pernah muncul di klien.
- Firebase Hosting dan Firebase App Hosting tidak digunakan; `apphosting.yaml` telah dihapus,
  dan `firebase.json` tidak lagi berisi blok hosting.
- Jangan mengasumsikan seluruh fitur hosting selalu gratis. Periksa paket, kuota, billing,
  region, dan layanan yang diperlukan.
- MVP lokal harus tetap bisa diuji melalui emulator tanpa harus melakukan deployment publik.

## 4. Struktur direktori target

```text
entrepreneur-workspace/
├── .clinerules/
│   └── entrepreneur-workspace.md
├── docs/
│   ├── project.md
│   ├── architecture.md
│   ├── data-model.md
│   ├── security.md
│   ├── task.md
│   └── model-workflow.md
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (workspace)/
│   │   │   ├── dashboard/
│   │   │   ├── business/
│   │   │   ├── research/
│   │   │   ├── marketing/
│   │   │   ├── operations/
│   │   │   └── reports/
│   │   └── po/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   ├── features/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── inventory/
│   │   ├── finance/
│   │   ├── research/
│   │   ├── marketing/
│   │   ├── tasks/
│   │   └── calendar/
│   ├── lib/
│   │   ├── firebase/
│   │   ├── auth/
│   │   ├── permissions/
│   │   └── utils/
│   └── types/
├── functions/
│   └── src/
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .env.example
├── package.json
├── package-lock.json
└── README.md
```

Ini target struktur, bukan perintah untuk membuat semua file kosong sekaligus. Tambahkan direktori saat modul terkait mulai diimplementasikan.

## 5. Alur data utama

### Open PO
Public form -> validasi input -> backend function -> validasi campaign/product/price/limits -> transaksi Firestore -> order record -> dashboard.

### Inventory
Order state transition -> backend transaction -> reserve/release/deduct stock sesuai aturan fulfillment -> inventory movement record -> update summaries.

### Finance
Payment verification dan expense entry -> backend validation -> transaction records -> report queries/aggregates. Bedakan omzet, laba, piutang, kas masuk, dan kas keluar.

### Research ke Marketing
Research membuat materi dan desain konten edukasi -> konten ditandai `ready` -> Marketing memasukkan ke publishing calendar -> publikasi manual -> simpan URL dan tanggal posting.

### Google Calendar
Firestore event -> backend sync job -> Google Calendar API -> simpan external calendar/event ID dan status sync. Mulai satu arah dari aplikasi ke Google Calendar.

### Export
Pengurus memilih filter/periode -> backend memeriksa izin -> membentuk CSV/XLSX atau Google Sheet -> hasil tersedia untuk pengguna berwenang.

## 6. Implementasi Firebase (aktif) dan sisa pekerjaan

Firebase sudah dipakai sejak 24 Okt 2026 (T010 `DONE`). Lapisan repository tetap menjadi batas
antara UI/Server Actions dan database:

- **Kontrak data:** `src/features/products/repository.ts` mendefinisikan `ProductRepository`
  (`list` dengan paginasi/filter/pencarian, `getById`, `create`, `update`, `setStatus`,
  `addVariant`, `updateVariant`, `removeVariant`). Komponen dan Server Actions hanya bergantung
  pada kontrak ini.
- **Implementasi aktif:** `repository.firestore.ts` memakai **Firebase Admin SDK** di server
  (koleksi `products` + subcollection `variants`). Instance Firestore dapat diinjeksi lewat
  konstruktor sehingga test berjalan terhadap emulator. Timestamp memakai
  `FieldValue.serverTimestamp()`; `createdAt`/`createdBy` tidak pernah ditimpa.
- **Mengapa bukan Web SDK di server:** Web SDK yang dipanggil dari Server Action berjalan tanpa
  identitas pengguna, sehingga ditolak rules dan aktornya tidak dapat dipercaya. Admin SDK
  melewati Security Rules, sehingga otorisasi wajib dilakukan pemanggil (`requirePermission`).
- **Pencarian:** Firestore tidak mendukung substring match. `list()` mengambil jendela maksimal
  `SEARCH_SCAN_LIMIT = 500` dokumen lalu memfilter di memori. Bila katalog membesar, tambahkan
  search index (Algolia/Typesense) atau field pencarian ter-normalisasi.
- **Fallback lokal:** `repository.json.ts` (`.data/products.json`) dipertahankan untuk unit test
  dan pengembangan offline; UI tidak lagi memakainya.
- **Validasi server:** `src/features/products/schema.ts` (Zod) mem-parse `FormData` sebelum
  repository dipanggil; harga/HPP/status tidak pernah dipercaya dari browser. Uang disimpan
  sebagai integer IDR.
- **Otorisasi terpusat:** `src/lib/permissions/policy.ts` (matriks role → permission) dan
  `src/lib/auth/session.ts` (`getSession`, `requirePermission`). Role berasal dari custom claim
  Firebase Auth (`npm run set:role`), dan `firestore.rules` mencerminkan matriks yang sama.
  Sesi prototipe hanya aktif bila `NODE_ENV !== "production"` **dan**
  `WORKSPACE_PROTOTYPE_ROLE` diset; cookie tidak valid menghasilkan sesi anonim, bukan fallback.
  Setiap Server Action tetap memanggil `requirePermission` karena action dapat dipanggil langsung
  melalui POST.
- **Rute workspace:** karena shell memakai `usePathname()` (dan nantinya cookie autentikasi),
  grup `(workspace)` mengekspor `instant = false` sehingga dirender per request. Tinjau ulang
  setelah auth stabil agar prefetch/instant navigation bisa diaktifkan kembali.

## 7. Prinsip implementasi

- Gunakan server-only modules untuk akses admin SDK dan secret.
- Jangan mengimpor Firebase Admin SDK ke client components.
- Validasi input menggunakan skema terpusat (contoh: Zod) pada batas API/server.
- Gunakan timestamp server untuk catatan penting.
- Gunakan pagination untuk daftar pesanan dan data yang dapat membesar.
- Tambahkan indeks Firestore setelah query ditetapkan.
- Gunakan transaksi/batch atomik untuk operasi stok dan status yang saling bergantung.
- Gunakan idempotency key untuk endpoint publik yang membuat order atau memproses pembayaran.
- Integrasi eksternal harus mempunyai retry dengan backoff, pencatatan error, dan idempotency.
- Jangan menandai sinkronisasi berhasil sebelum API eksternal mengonfirmasi hasilnya.
- Perbarui dokumentasi ketika arsitektur berubah.
