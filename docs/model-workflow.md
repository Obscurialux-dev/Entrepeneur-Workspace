## Saat model utama mencapai limit

Jangan menganggap perpindahan model otomatis. Jika provider/model yang dipakai Cline tidak memiliki routing fallback yang dikonfigurasi dan diuji, lakukan langkah berikut:

1. Simpan atau ringkas konteks task aktif.
2. Catat task ID dan file yang sudah berubah.
3. Pastikan perubahan penting disimpan di Git atau working tree.
4. Ganti model/provider di selector Cline ke model cadangan yang sudah dikonfigurasi.
5. Berikan ringkasan konteks, tujuan task, acceptance criteria, perintah test, dan batasan yang sama.
6. Minta model baru memeriksa diff dan status repository sebelum melanjutkan.
7. Jangan mengulangi operasi berisiko atau menghapus perubahan yang belum ditinjau.

Jangan pernah meminta model untuk mencetak API keys atau secrets.

## Aturan kerja lintas model

Setiap model wajib:
- membaca `.clinerules/entrepreneur-workspace.md`;
- membaca `docs/project.md`, `docs/architecture.md`, dan task terkait;
- mengerjakan satu task terdefinisi;
- memeriksa file sebelum mengedit;
- menjalankan lint, typecheck, test, atau build yang relevan;
- melaporkan file yang diubah, hasil test, risiko, dan langkah berikutnya;
- memperbarui `docs/task.md` hanya berdasarkan pekerjaan yang benar-benar selesai.

Model cadangan tidak boleh mengubah keputusan arsitektur atau scope tanpa menjelaskan alasannya dan meminta persetujuan.
