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

Evaluasi pilihan hosting sebelum deployment:
- Firebase Hosting cocok untuk aset statis dan konfigurasi yang sesuai.
- Next.js dengan server-side features mungkin memerlukan Firebase App Hosting atau deployment backend yang mendukungnya.
- Jangan mengasumsikan seluruh fitur hosting/backend selalu gratis. Periksa paket, kuota, billing, region, dan layanan yang diperlukan.
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

## 6. Prinsip implementasi

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
