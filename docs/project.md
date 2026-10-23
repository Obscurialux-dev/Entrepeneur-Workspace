# Project Brief: Entrepreneur Workspace

- **Project name:** Entrepreneur Workspace
- **Version:** 1.0 baseline
- **Organization:** Divisi Entrepreneur HIMA
- **Subdivisions:** Research dan Marketing
- **Status:** Planning / Foundation
- **Primary language:** Bahasa Indonesia untuk dokumentasi dan UI awal

## 1. Tujuan

Membangun satu workspace web terintegrasi untuk mengelola operasional Divisi Entrepreneur HIMA, termasuk bisnis, Open PO, pesanan, stok, keuangan operasional, riset, konten, tugas, timeline, dan kalender.

Sistem harus mengurangi pekerjaan manual, menyatukan data, menyediakan riwayat yang bisa ditelusuri, dan memberi visibilitas kepada pimpinan yang berwenang.

## 2. Prinsip produk

1. Satu aplikasi untuk Research dan Marketing.
2. Satu sumber data utama: Cloud Firestore.
3. Anggota/pelanggan mengisi formulir Open PO melalui tautan publik tanpa akun internal.
4. Pengurus masuk melalui autentikasi.
5. Ketua Entrepreneur memiliki akses administratif sesuai kebijakan.
6. Ketua HIMA dan Wakil Ketua HIMA memiliki akses pemantauan yang dibatasi.
7. Setiap PIC dapat memiliki kalender pribadi yang dihubungkan dengan kalender utama Entrepreneur.
8. Google Sheets digunakan untuk ekspor dan dokumentasi, bukan sebagai database utama.
9. Harga transaksi dan HPP historis harus disimpan sebagai snapshot.
10. Keamanan, validasi server, pengujian, dokumentasi, dan Git wajib sejak awal.

## 3. Pengguna dan akses

### Internal
- **Ketua Entrepreneur / Admin:** mengelola seluruh modul dan pengguna.
- **Research:** mengelola riset produk, riset pasar, analisis kompetitor, vendor, laporan riset, serta materi dan desain konten edukasi.
- **Marketing:** mengelola perencanaan konten promosi, kampanye, jadwal publikasi, pelaksanaan posting, dan arsip media sosial.
- **Ketua HIMA dan Wakil Ketua HIMA:** dashboard pemantauan sesuai izin yang diberikan.

Role dan permission harus ditegakkan di server/database rules, bukan hanya menyembunyikan menu di frontend.

### Publik
Anggota HIMA/pemesan dapat:
- Melihat detail Open PO yang aktif.
- Mengirim formulir pesanan.
- Mengirim data/bukti pembayaran hanya jika fitur dan kebijakan penyimpanannya telah disetujui.

Pengguna publik tidak boleh membaca koleksi internal, daftar pesanan orang lain, data keuangan, atau dokumen internal.

## 4. Pembagian kerja Research dan Marketing

### Research
- Product Research.
- Market Research.
- Competitor Analysis.
- Vendor Database.
- Research Reports.
- Educational Content Planning.
- Penyusunan materi edukasi.
- Desain/editing konten edukasi, termasuk carousel Instagram.
- Menyerahkan konten edukasi yang siap dipublikasikan ke Marketing.

### Marketing
- Content Planning untuk promosi.
- Promotional Campaigns.
- Penjadwalan konten.
- Publikasi konten ke Instagram.
- Pencatatan tautan posting dan status publikasi.
- Social Media Archive.
- Evaluasi performa konten jika data tersedia.

Jangan mengasumsikan Marketing mengerjakan desain seluruh konten edukasi. Konten promosi dapat memiliki alur produksi berbeda sesuai penugasan divisi.

## 5. Modul produk

1. Overview Dashboard.
2. Products dan Product Variants.
3. Open PO Campaigns.
4. Orders dan Payments.
5. Inventory.
6. Finance (pencatatan operasional, bukan akuntansi formal penuh pada MVP).
7. Research Workspace.
8. Marketing Workspace.
9. Tasks, Timeline, Team Calendar, dan My Calendar.
10. Reports dan Export Center.
11. User/Roles dan Google Integrations.

## 6. Open PO flow

1. Pengurus membuat kampanye PO dan memilih produk/varian.
2. Sistem menghasilkan tautan publik.
3. Pemesan mengisi formulir.
4. Backend memvalidasi status kampanye, input, harga, varian, batas pesanan, dan ketersediaan jika stok dibatasi.
5. Backend membuat pesanan di Firestore dengan nomor referensi.
6. Pesanan muncul di dashboard pengurus tanpa input ulang.
7. Pengurus memverifikasi pembayaran dan mengubah status pemenuhan pesanan.
8. Perubahan stok dan laporan keuangan mengikuti aturan status transaksi yang terdokumentasi.

Harga, total, role, status kampanye, dan stok tidak boleh dipercaya hanya berdasarkan nilai dari browser.

## 7. Status awal

### PO campaign
`draft`, `scheduled`, `active`, `closed`, `cancelled`

### Order
`pending_payment`, `paid`, `processing`, `ready`, `completed`, `cancelled`, `payment_rejected`

### Research project
`idea`, `researching`, `review`, `approved`, `rejected`, `archived`

### Content item
`idea`, `research`, `draft`, `design`, `review`, `ready`, `scheduled`, `published`, `archived`

Status dapat dikembangkan, tetapi harus konsisten antar UI, backend, dan dokumentasi.

## 8. MVP

Prioritas MVP:
1. Fondasi aplikasi dan autentikasi.
2. Role/permission dan dashboard.
3. Produk dan varian.
4. Open PO publik dan daftar pesanan.
5. Verifikasi pembayaran.
6. Inventory dan audit pergerakan stok.
7. Pencatatan transaksi operasional dan laporan dasar.
8. Research dan Marketing workflow.
9. Tasks dan timeline.
10. Ekspor CSV/XLSX.
11. Integrasi Google Calendar satu arah setelah fondasi stabil.

Integrasi dua arah Google Calendar, auto-posting Instagram, dan sinkronisasi Google Sheets otomatis adalah fitur lanjutan, bukan syarat awal MVP.

## 9. Kriteria keberhasilan

- Pesanan dari tautan publik masuk ke Firestore dan tampil di dashboard.
- Pengunjung publik tidak dapat membaca data internal.
- Perhitungan harga dilakukan/ditetapkan oleh backend.
- Pesanan duplikat akibat retry dapat dicegah dengan idempotency.
- Perubahan stok tercatat dan konsisten.
- Data historis tidak berubah saat harga produk berubah.
- Role/permission diuji.
- Data laporan dapat direkonsiliasi dengan data sumber.
- Tugas, kalender, dan ekspor berfungsi sesuai scope yang sudah diimplementasikan.
- Deployment memakai HTTPS dan tidak mengekspos secret.
