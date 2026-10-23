# Security Baseline

## 1. Prinsip

- Deny by default.
- Public hanya dapat melakukan operasi yang secara eksplisit diizinkan.
- Role dan permission divalidasi di server/database.
- Secret tidak boleh masuk ke repository.
- Data pribadi dan bukti pembayaran hanya dapat diakses pengguna yang berwenang.
- Semua endpoint publik harus memvalidasi input.
- Perubahan penting harus dapat diaudit.

## 2. Authentication dan authorization

- Gunakan Firebase Authentication untuk pengguna internal.
- Akun internal harus dibuat/diaktifkan oleh admin.
- Role disimpan melalui proses administratif tepercaya atau custom claims yang ditetapkan server.
- Jangan menerima role dari request client sebagai bukti otorisasi.
- Pastikan server-side route/API juga memeriksa identitas dan izin.
- Executive viewer hanya mendapat akses baca pada data yang disetujui.
- UI hiding bukan kontrol keamanan.

## 3. Public Open PO

- Publik hanya boleh membaca data kampanye yang memang aktif dan field publik yang diperlukan.
- Jangan memberi akses publik untuk query semua dokumen `orders`.
- Pembuatan order sebaiknya melalui backend callable/HTTP function.
- Validasi campaign masih aktif, waktu buka/tutup, product/variant aktif, quantity, batas pesanan, dan kebijakan stok di server.
- Hitung harga dan total di server.
- Terapkan idempotency untuk mencegah pesanan ganda.
- Terapkan pembatasan penyalahgunaan, validasi format, batas ukuran request, dan strategi anti-spam.
- Jangan membocorkan apakah NIM/kontak tertentu sudah terdaftar kecuali memang diperlukan.
- Upload bukti pembayaran harus mempunyai batas tipe/ukuran dan aturan akses ketat.

## 4. Inventory dan finance

- Perubahan stok dilakukan melalui backend dan operasi atomik.
- Jangan mengizinkan client menulis langsung nilai stok akhir tanpa validasi.
- Catat alasan, aktor, waktu, dan referensi transaksi untuk perubahan stok.
- Verifikasi pembayaran memerlukan role yang berwenang.
- Jangan menganggap order `pending_payment` sebagai kas masuk.
- Simpan snapshot harga/HPP untuk menjaga laporan historis.
- Hindari penghapusan permanen transaksi yang sudah dipakai dalam laporan; gunakan status pembatalan/refund dan audit trail.

## 5. Secret dan Google OAuth

- Simpan API keys, OAuth client secret, refresh token, dan service credentials di secret manager/environment backend yang sesuai.
- Jangan commit `.env`, service account JSON, token, atau file credential.
- `.env.example` hanya berisi nama variabel dan placeholder.
- Minta scope Google paling minimal yang dibutuhkan.
- Berikan pengguna pilihan kalender yang ingin dihubungkan.
- Sediakan mekanisme mencabut koneksi dan menangani token kedaluwarsa.
- Jangan mencetak token atau informasi pribadi ke log.

## 6. File uploads

- Validasi MIME type dan ukuran file di server.
- Gunakan path yang tidak mudah ditebak.
- Batasi read/write berdasarkan role dan kepemilikan.
- Hindari URL download permanen untuk berkas sensitif.
- Jangan mengizinkan upload file executable atau format yang tidak diperlukan.

## 7. Testing wajib

- Pengguna anonim tidak dapat membaca orders.
- Pengguna anonim hanya dapat membuat order melalui alur yang disetujui.
- Research tidak dapat mengubah role admin.
- Marketing tidak dapat mengubah data finance jika tidak diberi izin.
- Executive viewer tidak dapat menulis data.
- Pengguna tidak dapat mengubah harga melalui request.
- Dua pesanan bersamaan tidak menyebabkan overselling ketika stok dibatasi.
- Retry request tidak membuat order duplikat.
- Berkas privat tidak dapat diakses tanpa izin.
- Rules diuji dengan Firebase Emulator Suite sebelum deployment.
