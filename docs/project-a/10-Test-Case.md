# Test Case
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi | 2.0 |
| Tanggal | 18 November 2026 |
| Jumlah test case | **61**, dikelompokkan per modul |
| Pola ID | `TC-<MODUL>-<NN>` — contoh `TC-ATT-03` = modul Absensi, kasus ke-3 |
| Acuan | `06-Functional-Requirement.md`, `01-SRS.md`, `09-Test-Plan.md` |
| Status eksekusi | **Sudah dijalankan** — 61/61 test case **Lulus** (18 November 2026); 3 temuan di luar TC dicatat di §13.4 |
| Bukti | `docs/Project A - QA Test Cases.xlsx` (5 sheet) + suite otomatis dan tangkapan layar (§13.1) |

---

## 1. Konvensi

| Istilah | Arti |
|---|---|
| `<BASE>` | `http://localhost:8000` (atau port `php artisan serve --port=...`) |
| `<HR_TOKEN>` | Token hasil login akun HR |
| `<EMP_TOKEN>` | Token hasil login karyawan |
| `<EMP_ID>` | `employees.id` karyawan uji |
| `<ATT_ID>` | `attendances.id` |
| `<HR_PASSWORD>` | Nilai `HR_PASSWORD` dari `.env` lokal |
| Status | `Belum` · `Lulus` · `Gagal` · `Blocked` · `N/A` |

**Prasyarat umum:** server berjalan, database bersih, seed HR + office terbentuk (`09-Test-Plan.md` §4.2).

**Format hasil:** setiap TC dicatat `Lulus`/`Gagal` + bukti (`TC-<MOD>-<NN>.json` atau `TC-<MOD>-<NN>-*.png`). TC tanpa bukti dianggap **belum dijalankan**. Hasil aktual rinci per TC ada di `docs/Project A - QA Test Cases.xlsx` kolom *Actual Results*.

### 1.1 Cara membaca ID

ID test case mengikuti modul tempat kasus itu dibahas, bukan nomor urut dokumen. Awalan menunjukkan modul, dua digit terakhir menunjukkan urutan di dalam modul tersebut.

| Awalan | Modul | Rentang ID | Jumlah |
|---|---|---|---|
| `TC-AUTH` | Autentikasi, otorisasi & sesi | `TC-AUTH-01` … `TC-AUTH-09` | 9 |
| `TC-EMP` | Manajemen karyawan | `TC-EMP-01` … `TC-EMP-15` | 15 |
| `TC-ADM` | Akun HR | `TC-ADM-01` … `TC-ADM-03` | 3 |
| `TC-OFF` | Office & radius | `TC-OFF-01` … `TC-OFF-06` | 6 |
| `TC-ATT` | Absensi masuk/pulang | `TC-ATT-01` … `TC-ATT-14` | 14 |
| `TC-HIS` | Riwayat, filter & ekspor | `TC-HIS-01` … `TC-HIS-10` | 10 |
| `TC-DSH` | Dashboard | `TC-DSH-01` … `TC-DSH-02` | 2 |
| `TC-WEB` | Web HR (antarmuka) | `TC-WEB-01` … `TC-WEB-02` | 2 |
| | **Total** | | **61** |

> Dua penanda lain sering muncul berdampingan dengan ID test case dan **bukan** test case: `ST-nn` = butir checklist keamanan (`16-Security-Test-Checklist.md`), `UAT-nn` = skenario penerimaan pengguna (`11-UAT.md`). Pada kolom bukti, rujukan berbentuk `hasil-*.json#AUTH-01` menunjuk butir dengan `id` `TC-AUTH-01` di dalam berkas hasil suite otomatis; penulisannya sengaja tanpa awalan `TC-` agar tidak tertukar dengan ID test case fungsional pada dokumen ini.
>
> Padanan ID lama (`TC-01` … `TC-61`) ke ID baru ada di §14, agar dokumen versi sebelumnya tetap bisa dilacak.

---

## 2. Smoke Pack — Alur Inti (13 TC)

> 13 kasus ini berasal dari `tests/Feature/WorkforceAttendanceTest.php` dan menjadi **regression pack wajib** setiap ada perubahan kode. Kasusnya didefinisikan pada bab modul masing-masing; tabel berikut hanya daftar rujukan agar tidak ada duplikasi.

| Urutan | ID | Fokus | Didefinisikan di |
|---|---|---|---|
| 1 | `TC-EMP-01` | HR login lalu membuat karyawan dan akun HR | §4 |
| 2 | `TC-AUTH-01` | Permintaan tanpa token ditolak | §3 |
| 3 | `TC-ATT-01` | Absen masuk pertama berhasil | §7 |
| 4 | `TC-ATT-02` | Absen masuk kedua ditolak | §7 |
| 5 | `TC-ATT-04` | Absen pulang berhasil | §7 |
| 6 | `TC-ATT-05` | Absen pulang kedua ditolak | §7 |
| 7 | `TC-ATT-03` | Absen pulang tanpa absen masuk | §7 |
| 8 | `TC-ATT-06` | Absen di luar radius / tanpa foto | §7 |
| 9 | `TC-AUTH-07` | Data karyawan lain tidak bisa diakses | §3 |
| 10 | `TC-HIS-10` | Filter daftar absensi HR + ringkasan dashboard | §8 |
| 11 | `TC-AUTH-04` | Akun nonaktif tidak bisa login | §3 |
| 12 | `TC-AUTH-03` | Password salah / akun sudah dihapus | §3 |
| 13 | `TC-EMP-14` | Hapus karyawan beserta riwayatnya | §4 |

---

## 3. AUTH — Autentikasi, Otorisasi & Sesi (9)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-AUTH-01 | Permintaan tanpa token ditolak | FR-AUTH-00, 04 | — | 1) Buka `/api/me` tanpa header Authorization. 2) Buka `/api/attendance/today` dengan token asal (`Bearer abc`). | Keduanya dijawab `401 UNAUTHORIZED`; tidak ada data yang dikirim. | Lulus |
| TC-AUTH-02 | Login dengan isian kosong | FR-AUTH-01, 02 | — | 1) Login tanpa isian. 2) Login hanya dengan email. 3) Login hanya dengan password. | Ketiganya ditolak `400 VALIDATION` dengan pesan bahwa email dan password wajib diisi; tidak ada token yang terbit. | Lulus |
| TC-AUTH-03 | Password salah atau akun sudah dihapus | FR-AUTH-02 | Ada karyawan yang sudah dihapus | 1) Login dengan email karyawan yang sudah dihapus. 2) Login dengan password salah. | Keduanya ditolak `401 INVALID_CREDENTIALS` dengan pesan "Email atau password salah"; tidak ada token. | Lulus |
| TC-AUTH-04 | Akun nonaktif tidak bisa login | FR-AUTH-03; FR-EMP-09 | Karyawan berstatus ACTIVE | 1) HR mengubah status karyawan menjadi INACTIVE. 2) Karyawan itu mencoba login. | Login ditolak `403 ACCOUNT_INACTIVE`; tidak ada token yang terbit. | Lulus |
| TC-AUTH-05 | Token kedaluwarsa | FR-AUTH-04, 07, 08 | Secret JWT dari `.env` | 1) Buat token dengan masa berlaku 1 detik, tunggu 2 detik. 2) Pakai token itu untuk membuka `/api/me`. | Ditolak `401 UNAUTHORIZED`; di Web HR pengguna kembali ke layar Login. | Lulus |
| TC-AUTH-06 | Karyawan tidak boleh membuka menu HR | FR-AUTH-00, 05 | Token karyawan | Dengan token karyawan, panggil berurutan: daftar & tambah karyawan, daftar & tambah akun HR, ringkasan dashboard, daftar absensi. | Semua permintaan dijawab `403 FORBIDDEN`; tidak ada data yang terbaca. | Lulus |
| TC-AUTH-07 | Data karyawan lain tidak bisa diakses | FR-AUTH-05; FR-HIS-02, 08 | Dua karyawan, salah satunya punya absensi | Dengan token karyawan A: 1) Tambah akun HR. 2) Buka daftar akun HR. 3) Buka riwayat absensi karyawan B. 4) Buka daftar absensi semua karyawan. 5) Buka foto milik karyawan B. | Semua ditolak `403 FORBIDDEN`; riwayat milik sendiri tetap bisa dibuka. | Lulus |
| TC-AUTH-08 | Profil karyawan yang sedang login | FR-AUTH-06 | Token karyawan | Buka `/api/me`. | Respons memuat `id`, `email`, `role=EMPLOYEE`, serta data karyawan (`id`, `employee_code`, `name`, `status`). | Lulus |
| TC-AUTH-09 | Sesi di Web HR (manual) | FR-AUTH-08; FR-WEB-05 | Browser, akun karyawan & HR | 1) Login Web HR dengan akun karyawan. 2) Login sebagai HR lalu klik Keluar. 3) Rusak token di localStorage, lalu muat ulang halaman. | (1) Muncul pesan "Akun ini bukan HR" dan tetap di Login. (2) Kembali ke Login, token terhapus. (3) Layar Login tampil dan tidak ada data yang dirender. | Lulus |

---

## 4. EMP — Manajemen Karyawan (15)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-EMP-01 | Alur inti: HR membuat karyawan dan akun HR | FR-AUTH-01, 06; FR-EMP-01..03, 12; FR-ADM-02, 04 | Database bersih, akun HR dari seed | 1) Login sebagai HR, lalu buka profil sendiri. 2) Lihat daftar karyawan nonaktif. 3) Tambah karyawan hanya dengan nama "Budi Santoso". 4) Ulangi dengan nama yang sama. 5) Tambah akun HR "HR Kedua", lalu login dengan akun baru. 6) Tambah akun HR dengan email yang sudah dipakai. | Login berhasil dengan kode akun `HR01`; daftar nonaktif memuat data lama; karyawan baru berkode `ky04`, email `budi.santoso@ethes.tech`, dan punya password awal; percobaan kedua memberi `ky05` dan `budi.santoso2@ethes.tech`; akun HR baru berkode `HR02` dan bisa login; email ganda ditolak `409`. | Lulus |
| TC-EMP-02 | Tambah karyawan hanya dengan nama | FR-EMP-01..03, 12 | Token HR | Tambah karyawan "Citra Dewi" tanpa mengisi kode, email, atau password. | Data tersimpan (`201`); kode otomatis `kyNN`, email `citra.dewi@ethes.tech`, password awal 12 karakter, status ACTIVE. Password hanya muncul pada respons ini. | Lulus |
| TC-EMP-03 | Email otomatis yang bentrok | FR-EMP-02 | Sudah ada `budi.santoso@ethes.tech` | Tambah karyawan kedua dengan nama "Budi Santoso". | Email otomatis menjadi `budi.santoso2@ethes.tech`; karyawan tetap tersimpan. | Lulus |
| TC-EMP-04 | Kode karyawan duplikat | FR-EMP-05 | Sudah ada kode `ky01` | Tambah karyawan dengan kode manual `ky01`. | Ditolak `409 DUPLICATE_CODE`; tidak ada data baru. | Lulus |
| TC-EMP-05 | Email karyawan duplikat | FR-EMP-05 | Email sudah dipakai | Tambah karyawan dengan email milik karyawan lain. | Ditolak `409 DUPLICATE_EMAIL`; tidak ada data baru. | Lulus |
| TC-EMP-06 | Password terlalu pendek | FR-EMP-04 | Token HR | 1) Tambah karyawan dengan password 7 karakter. 2) Ubah karyawan dengan password 7 karakter. | Keduanya ditolak `400 VALIDATION` "Password minimal 8 karakter". | Lulus |
| TC-EMP-07 | Format email tidak valid | FR-EMP-04 | Token HR | Tambah karyawan dengan email `bukan-email`. | Ditolak `400 VALIDATION` "Format email tidak valid". | Lulus |
| TC-EMP-08 | Nama kosong | FR-EMP-01 | Token HR | 1) Tambah karyawan dengan nama berisi spasi saja. 2) Kosongkan nama saat mengubah karyawan. | Keduanya ditolak `400 VALIDATION` "Nama wajib diisi"; data lama tidak berubah. | Lulus |
| TC-EMP-09 | Daftar karyawan: cari, saring, halaman | FR-EMP-06 | Minimal 5 karyawan | 1) Cari sebagian nama. 2) Saring status INACTIVE. 3) Kirim status yang tidak dikenal. 4) Buka halaman 2 dengan 2 data per halaman. 5) Cari teks yang menyerupai perintah SQL. | (1)(2) Hasil sesuai saringan. (3) Ditolak `400 VALIDATION`. (4) Halaman 2 berisi paling banyak 2 data. (5) Diperlakukan sebagai teks biasa, bukan perintah SQL; tidak ada error server. | Lulus |
| TC-EMP-10 | Detail karyawan yang tidak ada | FR-EMP-07 | Token HR | Buka detail karyawan dengan ID 999999. | Dijawab `404 NOT_FOUND`. | Lulus |
| TC-EMP-11 | Ubah data karyawan | FR-EMP-08 | Token HR, karyawan tersedia | Ubah nama, email, dan password karyawan. | Perubahan tersimpan (`200`) dan tampil di Web HR; login dengan password baru berhasil, password lama ditolak `401`. | Lulus |
| TC-EMP-12 | Karyawan nonaktif tidak bisa absen | FR-EMP-09; FR-ATT-12 | Karyawan INACTIVE, token lama masih berlaku | Karyawan tersebut mencoba absen masuk dengan foto dan lokasi yang sah. | Ditolak `403 ACCOUNT_INACTIVE`; tidak ada data absensi baru. | Lulus |
| TC-EMP-13 | Reset password karyawan | FR-EMP-11 | Token HR | Reset password, lalu login memakai password baru. | Respons `200` memuat email dan password baru; login berhasil, password sebelumnya ditolak `401`. | Lulus |
| TC-EMP-14 | Hapus karyawan beserta riwayatnya | FR-EMP-07, 10 | Karyawan punya riwayat absensi | 1) Hapus karyawan. 2) Buka detailnya. 3) Lihat daftar absensi hari itu. 4) Tambah karyawan baru. | (1) Terhapus (`200`). (2) Dijawab `404`. (3) Riwayatnya ikut hilang (total 0). (4) Kode berikutnya melanjutkan urutan (`ky07` pada skenario uji), tidak memakai ulang kode lama. | Lulus |
| TC-EMP-15 | Foto ikut terhapus saat karyawan dihapus | FR-EMP-10 | Karyawan punya foto masuk dan pulang | 1) Hitung berkas foto di folder unggahan. 2) Hapus karyawan. 3) Hitung ulang. | Jumlah berkas berkurang sesuai foto milik karyawan; bila ada berkas gagal dihapus, respons memuat peringatan dan data tetap terhapus. | Lulus |

---

## 5. ADM — Akun HR (3)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-ADM-01 | Tambah akun HR | FR-ADM-02, 04 | Token HR | Tambah akun HR "HR Kedua", lalu login dengan email dan password awalnya. | Tersimpan (`201`) dengan kode `HR02` dan role HR; login berhasil dan profil menunjukkan `HR02`. | Lulus |
| TC-ADM-02 | Email akun HR duplikat | FR-ADM-03 | Email akun HR sudah dipakai | Tambah akun HR dengan email yang sudah dipakai. | Ditolak `409 DUPLICATE_EMAIL`; nomor urut akun HR tidak bertambah. | Lulus |
| TC-ADM-03 | Daftar & pencarian akun HR | FR-ADM-01 | Minimal 3 akun HR | 1) Buka daftar akun HR. 2) Cari "HR02". | (1) Urut `HR01` sampai `HR03`. (2) Hanya akun yang cocok yang tampil. | Lulus |

---

## 6. OFF — Office & Radius (6)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-OFF-01 | Tambah office | FR-OFF-02, 04 | Token HR | Tambah office "Cabang" dengan koordinat dan radius 100 meter. | Tersimpan (`201`) dan langsung muncul di daftar office. | Lulus |
| TC-OFF-02 | Radius di luar batas | FR-OFF-02 | Token HR | Simpan office dengan radius 5 meter, lalu 5001 meter. | Keduanya ditolak `400 VALIDATION` "radius_m harus 10-5000 meter". | Lulus |
| TC-OFF-03 | Koordinat tidak valid | FR-OFF-02 | Token HR | 1) Simpan office dengan lintang 91. 2) Simpan dengan bujur 181. 3) Simpan tanpa nama. | Ketiganya ditolak `400 VALIDATION`. | Lulus |
| TC-OFF-04 | Karyawan tidak boleh mengubah office | FR-OFF-01, 03; FR-AUTH-05 | Token karyawan | Dengan token karyawan: tambah office, ubah office, lalu buka daftar office. | Tambah dan ubah ditolak `403 FORBIDDEN`; daftar office tetap boleh dibaca. | Lulus |
| TC-OFF-05 | Menonaktifkan office | FR-OFF-03 | Token HR, minimal 2 office | Nonaktifkan satu office, lalu buka daftar office. | Office itu hilang dari daftar aktif; muncul lagi setelah diaktifkan kembali. | Lulus |
| TC-OFF-06 | Tidak ada office aktif | FR-ATT-11 | Semua office dinonaktifkan | Karyawan absen masuk dengan foto dan lokasi yang sah. | Ditolak `409 NO_OFFICE`; tidak ada data absensi baru. | Lulus |

---

## 7. ATT — Absensi Masuk/Pulang (14)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-ATT-01 | Absen masuk pertama berhasil | FR-ATT-02, 07 | Token karyawan, berada di dalam radius | Absen masuk dengan foto dan lokasi. | Tersimpan (`201`) dengan status `TEPAT_WAKTU` atau `TERLAMBAT`, memuat waktu masuk, office, jarak (`distance_m`), dan tautan foto. | Lulus |
| TC-ATT-02 | Absen masuk kedua ditolak | FR-ATT-03, 13 | Sudah absen masuk hari ini | Absen masuk lagi dengan foto baru. | Ditolak `409 ALREADY_CHECKED_IN`; riwayat tetap 1 data; foto baru tidak tersimpan. | Lulus |
| TC-ATT-03 | Absen pulang tanpa absen masuk | FR-ATT-04 | Token karyawan, belum absen masuk | Karyawan absen pulang dengan foto dan lokasi. | Ditolak `409 NOT_CHECKED_IN`; tidak ada data absensi baru. | Lulus |
| TC-ATT-04 | Absen pulang berhasil | FR-ATT-05 | Sudah absen masuk, belum pulang | Absen pulang dengan foto dan lokasi. | Berhasil (`200`); waktu pulang terisi dan status menjadi `SUDAH_OUT`. | Lulus |
| TC-ATT-05 | Absen pulang kedua ditolak | FR-ATT-06 | Sudah absen pulang | Absen pulang sekali lagi. | Ditolak `409 ALREADY_CHECKED_OUT`; waktu pulang tidak berubah. | Lulus |
| TC-ATT-06 | Lokasi di luar radius & foto tidak ada | FR-ATT-08, 09, 10 | Token karyawan | 1) Absen masuk dari lokasi jauh di luar radius. 2) Absen masuk tanpa melampirkan foto. | (1) Ditolak `403 OUTSIDE_RADIUS` disertai jarak dan radius kantor. (2) Ditolak `400 PHOTO_REQUIRED`. | Lulus |
| TC-ATT-07 | Status hari ini: belum absen | FR-ATT-01 | Token karyawan, belum absen | Buka status hari ini (`/api/attendance/today`). | `state=BELUM_IN`, boleh absen masuk, belum boleh pulang; aturan jam kerja 08:00, toleransi 15 menit, zona Asia/Jakarta; daftar office aktif ikut tampil. | Lulus |
| TC-ATT-08 | Status berubah setelah masuk dan pulang | FR-ATT-01 | Sudah absen masuk | 1) Buka status hari ini setelah absen masuk. 2) Buka lagi setelah absen pulang. | (1) `SUDAH_IN`: tidak bisa masuk lagi, bisa pulang. (2) `SUDAH_OUT`: keduanya tidak bisa. | Lulus |
| TC-ATT-09 | Absen tanpa lokasi | FR-ATT-09 | Token karyawan | 1) Absen masuk dengan foto tetapi tanpa koordinat. 2) Kirim koordinat yang bukan angka. | Ditolak `400 GPS_REQUIRED`. | Lulus |
| TC-ATT-10 | Foto melebihi 5 MB | FR-ATT-15 | Token karyawan | Absen masuk dengan berkas foto berukuran 6 MB. | Ditolak `400 INVALID_PHOTO` "Foto maksimal 5 MB". | Lulus |
| TC-ATT-11 | Jenis foto tidak didukung | FR-ATT-15 | Token karyawan | Absen masuk dengan berkas teks (`.txt`). | Ditolak `400 INVALID_PHOTO` "Foto harus JPEG/PNG/WEBP". | Lulus |
| TC-ATT-12 | Foto yatim dibersihkan saat ditolak | FR-ATT-14 | Token karyawan, di luar radius | 1) Hitung berkas di folder unggahan. 2) Absen masuk dari luar radius. 3) Hitung ulang. | Ditolak `403 OUTSIDE_RADIUS`; jumlah berkas tidak bertambah (foto tidak tertinggal). | Lulus |
| TC-ATT-13 | Batas waktu 08:15 vs 08:16 (unit) | FR-ATT-07 | PHP/Laravel | Jalankan `TimeService::attendanceStatus()` untuk pukul 08:15 dan 08:16 WIB. | 08:15 masih `TEPAT_WAKTU`; 08:16 `TERLAMBAT`; hasil tidak bergantung zona waktu mesin. | Lulus |
| TC-ATT-14 | Hanya dua status yang tersimpan | FR-ATT-07, 13 | Ada data absensi | Periksa nilai status di database dan pada respons API. | Database hanya berisi `TEPAT_WAKTU` atau `TERLAMBAT`; status turunan (`BELUM_IN`, `BELUM_OUT`, `SUDAH_OUT`) hanya muncul pada respons dan tidak tersimpan. | Lulus |

---

## 8. HIS — Riwayat, Filter & Ekspor (10)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-HIS-01 | Prioritas filter tanggal | FR-HIS-04 | Token HR, ada data | Kirim sekaligus `date`, rentang `from`–`to`, dan `preset`. | Yang dipakai adalah `date`: `meta.from` dan `meta.to` sama dengan tanggal tersebut. | Lulus |
| TC-HIS-02 | Rentang tanggal tidak sah | FR-HIS-05 | Token HR | 1) Tanggal awal lebih baru daripada tanggal akhir. 2) Rentang 367 hari. | Keduanya ditolak `400 VALIDATION`. | Lulus |
| TC-HIS-03 | Status tidak dikenal | FR-HIS-06 | Token HR | Saring dengan status "SELESAI". | Ditolak `400 VALIDATION` disertai daftar status yang sah. | Lulus |
| TC-HIS-04 | Status BELUM_IN untuk rentang tanggal | FR-HIS-06 | Token HR | Saring status `BELUM_IN` memakai rentang tanggal. | Ditolak `400 VALIDATION`: status `BELUM_IN` hanya untuk satu tanggal. | Lulus |
| TC-HIS-05 | Status BELUM_IN untuk satu tanggal | FR-HIS-06 | 2 karyawan ACTIVE, 1 belum absen | Saring status `BELUM_IN` untuk hari ini. | Hanya karyawan ACTIVE yang belum punya data; setiap baris `status=BELUM_IN` dengan waktu masuk kosong. | Lulus |
| TC-HIS-06 | Pencarian, urutan, halaman | FR-HIS-07 | Token HR, minimal 3 data | 1) Cari nama. 2) Urutkan menaik. 3) Minta 500 data per halaman. 4) Buka halaman 2 dengan 2 data per halaman. | (1) Hasil cocok. (2) Urutan menaik. (3) Dibatasi maksimal 200 per halaman. (4) Halaman dan jumlah halaman sesuai. | Lulus |
| TC-HIS-07 | Riwayat karyawan default bulan ini | FR-HIS-01 | Token karyawan | Buka riwayat absensi tanpa filter. | Rentang otomatis dari awal bulan berjalan sampai hari ini; hanya data milik sendiri. | Lulus |
| TC-HIS-08 | Akses foto absensi | FR-HIS-08 | Ada data dengan dan tanpa foto | 1) Buka foto tanpa token. 2) Buka foto milik karyawan lain. 3) Minta foto pulang pada data yang belum absen pulang. 4) Minta jenis foto yang tidak dikenal. | (1) `401`. (2) `403`. (3) `404`. (4) `404`. | Lulus |
| TC-HIS-09 | Ekspor CSV (manual) | FR-HIS-09 | Token HR, ada data | Di Web HR buka Absensi, pilih filter, lalu klik Unduh CSV. | Berkas `absensi-<tanggal>.csv` terunduh dengan kolom Tanggal, Kode, Nama, IN, OUT, Status, Jarak IN, Jarak OUT; jumlah baris sesuai filter; maksimal 5.000 baris. | Lulus |
| TC-HIS-10 | Filter daftar absensi HR & ringkasan dashboard | FR-HIS-03..07; FR-DSH-01..05 | Ada 1 absensi hari ini, minimal 2 karyawan ACTIVE | 1) Buka daftar absensi hari ini. 2) Saring 7 hari terakhir yang sudah pulang. 3) Saring "kemarin". 4) Saring yang belum absen masuk hari ini. 5) Kirim rentang tanggal terbalik. 6) Buka ringkasan dashboard. | (1) 1 data. (2) 1 data. (3) 0 data. (4) 1 data. (5) Ditolak `400`. (6) sudah masuk 1, belum masuk 1, tren 7 hari. | Lulus |

---

## 9. DSH — Dashboard (2)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-DSH-01 | Format tanggal dashboard | FR-DSH-04 | Token HR | Buka dashboard dengan tanggal `18-11-2026`. | Ditolak `400 VALIDATION` karena format tanggal harus `YYYY-MM-DD`. | Lulus |
| TC-DSH-02 | Ringkasan dashboard sama dengan daftar | FR-DSH-01..03, 05 | 1 absensi, 2 karyawan ACTIVE | Bandingkan angka ringkasan dashboard dengan hasil daftar absensi tanggal yang sama. | `sudah_in` sama dengan jumlah daftar; `belum_in` = jumlah karyawan aktif dikurangi yang sudah masuk (tidak negatif); `late` sama dengan daftar TERLAMBAT; `not_checked_out` sama dengan daftar BELUM_OUT; grafik tren berisi 7 hari berurutan. | Lulus |

---

## 10. WEB — Antarmuka Web HR (2)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-WEB-01 | Navigasi & tampilan data kosong (manual) | FR-WEB-01, 02 | Login HR | 1) Buka menu Dashboard, Absensi, Karyawan, Office. 2) Terapkan filter yang tidak punya hasil. 3) Muat ulang halaman. | Setiap menu menampilkan halaman yang benar; pesan data kosong muncul; setelah dimuat ulang tetap di halaman yang sama dan data dimuat lagi. | Lulus |
| TC-WEB-02 | Dialog kredensial, notifikasi, pembaruan otomatis (manual) | FR-WEB-03, 04; FR-DSH-03 | Login HR | 1) Tambah karyawan. 2) Klik tombol salin. 3) Picu kesalahan (kode duplikat). 4) Diamkan dashboard 60 detik. | Dialog menampilkan kode, email, dan password; tombol salin menyalin ke clipboard; notifikasi kesalahan tampil; dashboard memperbarui angka tanpa kehilangan data. | Lulus |

---

## 11. Data Uji

### 11.1 Foto PNG 1×1 (TD-01)

```
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
```

Simpan sebagai `selfie.png` (decode base64) atau gunakan berkas gambar apa pun.

### 11.2 Berkas 6 MB (TD-03)

```powershell
$bytes = New-Object byte[] (6 * 1024 * 1024)
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[System.IO.File]::WriteAllBytes("$PWD\big.png", $bytes)
```

### 11.3 Permintaan absen masuk/pulang (contoh curl)

```bash
curl -X POST "$BASE/api/attendance/check-in" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -F lat=-7.4296 -F lng=111.0095 -F photo=@selfie.png
```

### 11.4 Token kedaluwarsa (TC-AUTH-05)

```bash
php -r '
  $secret = getenv("JWT_SECRET") ?: "ganti-dengan-secret-panjang-dan-acak";
  $b64 = fn($s) => rtrim(strtr(base64_encode($s), "+/", "-_"), "=");
  $h = $b64(json_encode(["alg" => "HS256", "typ" => "JWT"]));
  $p = $b64(json_encode(["sub" => 1, "role" => "HR", "iat" => time() - 120, "exp" => time() - 60]));
  echo "$h.$p." . $b64(hash_hmac("sha256", "$h.$p", $secret, true)) . PHP_EOL;
'
```

Jalankan dari root proyek; `JWT_SECRET` harus sama dengan yang dipakai server agar tanda tangan sah tetapi `exp` sudah lewat (401).

---

## 12. Ringkasan Cakupan per Modul

| Modul | Rentang ID | Jumlah | FR modul ini | FR lintas modul |
|---|---|---|---|---|
| Autentikasi & sesi | `TC-AUTH-01` … `TC-AUTH-09` | 9 | FR-AUTH-00 … FR-AUTH-08 | FR-ATT-12, FR-EMP-09, FR-HIS-02, FR-HIS-08, FR-WEB-05 |
| Manajemen karyawan | `TC-EMP-01` … `TC-EMP-15` | 15 | FR-EMP-01 … FR-EMP-12 | FR-ADM-02, FR-ADM-03, FR-ADM-04, FR-ATT-12, FR-AUTH-01, FR-AUTH-06, FR-AUTH-07 |
| Akun HR | `TC-ADM-01` … `TC-ADM-03` | 3 | FR-ADM-01 … FR-ADM-04 | — |
| Office & radius | `TC-OFF-01` … `TC-OFF-06` | 6 | FR-OFF-01 … FR-OFF-04 | FR-ATT-11, FR-AUTH-05 |
| Absensi | `TC-ATT-01` … `TC-ATT-14` | 14 | FR-ATT-01 … FR-ATT-10, FR-ATT-13 … FR-ATT-15 | — |
| Riwayat & filter | `TC-HIS-01` … `TC-HIS-10` | 10 | FR-HIS-01, FR-HIS-03 … FR-HIS-09 | FR-DSH-01 … FR-DSH-03, FR-DSH-05 |
| Dashboard | `TC-DSH-01` … `TC-DSH-02` | 2 | FR-DSH-01 … FR-DSH-05 | — |
| Web HR | `TC-WEB-01` … `TC-WEB-02` | 2 | FR-WEB-01 … FR-WEB-04 | — |
| **Total** | **`TC-AUTH-01` … `TC-WEB-02`** | **61** | **63 FR (gabungan seluruh baris)** | |

> Satu test case dapat menutup beberapa modul (mis. `TC-EMP-01` juga menyentuh AUTH dan ADM). Setiap TC tetap dihitung **sekali**, pada modul tempat kasus itu didefinisikan.
>
> Empat FR baru tertutup lewat TC modul lain: FR-ATT-11 (`TC-OFF-06`), FR-ATT-12 (`TC-EMP-12`, `TC-AUTH-04`), FR-HIS-02 (`TC-AUTH-07`), dan FR-WEB-05 (`TC-AUTH-09`). Pemetaan lengkap per FR ada di `12-Traceability-Matrix.md` §2.

---

## 13. Catatan Eksekusi

### 13.1 Ringkasan hasil

| Suite | Cakupan | Jumlah | Hasil |
|---|---|---|---|
| Unit test repo | `test/attendance.test.js` (Node, siklus 18 Nov 2026) | 10 | **10 Lulus** |
| API inti | auth, karyawan, admin, absensi, dashboard | 109 | **109 Lulus** |
| API lanjutan | office, keamanan, otorisasi lintas peran | 21 | **20 Lulus**, 1 temuan (header keamanan) |
| API penutup | TC yang belum tercakup suite sebelumnya | 13 | **13 Lulus** |
| API probe | isian login tidak lengkap, password 7 karakter, akun HR baru | 3 | **3 Lulus** |
| UI Web HR | alur utama, filter, CRUD, ekspor | 18 | **18 Lulus** |
| UI Web HR lanjutan | pembatasan akses, ubah/reset/hapus, tab dashboard | 15 | **14 Lulus**, 1 temuan (TypeError konsol) |
| UI Web HR penutup | tombol salin, error form, muat ulang per menu, pembaruan otomatis | 4 | **4 Lulus** |

Total pemeriksaan otomatis: **193 eksekusi** dengan **191 Lulus** dan **2 temuan** (lihat §13.4). Parameter lingkungan siklus ini: Windows 11, Node v22.23.2 (implementasi Node yang kini dihapus), server port 3311, database & folder unggahan QA terpisah dari repo, zona Asia/Jakarta, Chrome headless 1440×900. Verifikasi Laravel terpisah (5/5 tes fitur) ada di `17-Test-Automation.md` §0.1a.

### 13.2 Penyimpangan pengujian

| Hal | Catatan |
|---|---|
| TC manual (`TC-AUTH-09`, `TC-HIS-09`, `TC-WEB-01`, `TC-WEB-02`) | Dijalankan dengan browser driver (Puppeteer), bukan tangan; tangkapan layar tersimpan pada folder bukti |
| `TC-ATT-01` … `TC-ATT-14`, `TC-EMP-12`, `TC-OFF-06` | Dijalankan lewat klien API karena aplikasi mobile belum ada di repo |
| `TC-ATT-13` | Diuji sebagai fungsi murni (`app/Services/TimeService.php`) agar tidak bergantung jam nyata |
| `TC-EMP-15` | Cabang peringatan (berkas gagal dihapus) tidak dapat dipicu; hanya jalur sukses yang dibuktikan |
| `TC-EMP-09` langkah 5 | Payload injeksi dikirim dalam bentuk ter-encode sehingga diterima sebagai teks pencarian biasa |

### 13.3 Data uji

Data uji memakai database QA terpisah. Penomoran `kyNN`, `HRnn`, dan `attendance_id` yang tercatat di kolom hasil adalah nilai aktual saat eksekusi, bukan angka yang dipaksakan.

### 13.4 Temuan di luar 61 test case

| ID | Temuan | Severity | Bukti |
|---|---|---|---|
| BUG-01 | Respons web tidak memuat header keamanan (`X-Content-Type-Options`, `X-Frame-Options`, CSP, `Referrer-Policy` semuanya tidak ada) | Medium | Sheet `AUTH` baris BUG-01; `hasil-extra.json#AUTH-18` |
| BUG-02 | `TypeError: Cannot set properties of null (setting 'innerHTML')` di `public/app.js:374` ketika 401 memicu `logout()` saat daftar karyawan sedang dimuat | Low | Sheet `EMP` baris BUG-02; `hasil-ui2.json#WEBX-15` |
| BUG-03 | `database/seeders/` (siklus Node) mencetak email dan password HR ke stdout saat seeding; **ditutup 19 Nov 2026** pada seeder Laravel | High | Sheet `AUTH` baris BUG-03; `hasil-sec2.json#ST-25` |

Ketiganya tidak menggagalkan satu pun alur bisnis: seluruh 61 TC tetap **Lulus**. BUG-03 sudah ditutup; BUG-01 dan BUG-02 masih terbuka. Rincian perbaikan yang disarankan ada pada kolom *Notes* di berkas xlsx dan `13-Defect-Management.md`.

### 13.5 Catatan teknis

1. **TC bergantung waktu.** `TC-ATT-01`, `TC-HIS-10`, `TC-ATT-07` … `TC-ATT-14` menghasilkan nilai berbeda bila dijalankan sebelum/sesudah 08:15. Jam eksekusi dicatat pada kolom hasil.
2. **TC bergantung data.** Penomoran `kyNN` pada `TC-EMP-14` dan `TC-EMP-02` mengasumsikan jumlah karyawan tertentu. Kode aktual dicatat, bukan dipaksakan.
3. **TC manual** (`TC-AUTH-09`, `TC-HIS-09`, `TC-WEB-01`, `TC-WEB-02`) memerlukan browser driver; bukti berupa tangkapan layar.
4. **`TC-EMP-15`** hanya dapat memverifikasi peringatan bila penghapusan berkas gagal — kondisi ini sulit dipicu sengaja; bila tidak terjadi, dijelaskan alasannya.
5. **Jangan mencatat kredensial** di kolom hasil. Gunakan `<HR_PASSWORD>` atau "sesuai `.env`".

### 13.6 Pemetaan sheet pada berkas xlsx

Berkas `docs/Project A - QA Test Cases.xlsx` memakai lima sheet dengan nama template yang **sudah ditentukan** (bukan nama modul). Karena ID test case sekarang mengikuti modul, satu sheet dapat memuat blok dari beberapa modul.

| Sheet | Nama template (tetap) | Blok TC yang ditulis di dalamnya |
|---|---|---|
| `AUTH` | Auth & Authorization | `TC-AUTH-01` … `TC-AUTH-09`, `TC-EMP-01` |
| `EMP` | CRUD Employee, HR Account & Office | `TC-EMP-02` … `TC-EMP-15`, `TC-ADM-01` … `TC-ADM-03`, `TC-OFF-01` … `TC-OFF-05` |
| `DSHF` | HR Dashboard | `TC-DSH-01`, `TC-DSH-02`, `TC-HIS-10` |
| `MOB` | Employee Attendance (mobile API) | `TC-ATT-01` … `TC-ATT-14`, `TC-EMP-12`, `TC-OFF-06` |
| `ATT` | Attendance History, Filter, Export & Web HR | `TC-HIS-01` … `TC-HIS-09`, `TC-WEB-01`, `TC-WEB-02` |

Total 64 blok = 61 test case + 3 temuan (`BUG-01` … `BUG-03`). Untuk mencari satu TC, gunakan kolom **Test Case ID** pada tiap sheet — bukan nama sheet-nya.

---

## 14. Padanan ID Lama ke ID Baru

Tabel ini hanya untuk melacak dokumen versi 1.0. Dokumen lain sudah memakai ID baru.

| ID lama | ID baru | ID lama | ID baru |
|---|---|---|---|
| TC-01 | `TC-EMP-01` | TC-31 | `TC-EMP-15` |
| TC-02 | `TC-AUTH-01` | TC-32 | `TC-ADM-01` |
| TC-03 | `TC-ATT-03` | TC-33 | `TC-ADM-02` |
| TC-04 | `TC-ATT-01` | TC-34 | `TC-ADM-03` |
| TC-05 | `TC-ATT-02` | TC-35 | `TC-OFF-01` |
| TC-06 | `TC-ATT-04` | TC-36 | `TC-OFF-02` |
| TC-07 | `TC-ATT-05` | TC-37 | `TC-OFF-03` |
| TC-08 | `TC-ATT-06` | TC-38 | `TC-OFF-04` |
| TC-09 | `TC-AUTH-07` | TC-39 | `TC-OFF-05` |
| TC-10 | `TC-HIS-10` | TC-40 | `TC-OFF-06` |
| TC-11 | `TC-AUTH-04` | TC-41 | `TC-ATT-07` |
| TC-12 | `TC-AUTH-03` | TC-42 | `TC-ATT-08` |
| TC-13 | `TC-EMP-14` | TC-43 | `TC-ATT-09` |
| TC-14 | `TC-AUTH-02` | TC-44 | `TC-ATT-10` |
| TC-15 | `TC-AUTH-05` | TC-45 | `TC-ATT-11` |
| TC-16 | `TC-AUTH-06` | TC-46 | `TC-ATT-12` |
| TC-17 | `TC-AUTH-09` | TC-47 | `TC-ATT-13` |
| TC-18 | `TC-AUTH-08` | TC-48 | `TC-ATT-14` |
| TC-19 | `TC-EMP-02` | TC-49 | `TC-HIS-01` |
| TC-20 | `TC-EMP-03` | TC-50 | `TC-HIS-02` |
| TC-21 | `TC-EMP-04` | TC-51 | `TC-HIS-03` |
| TC-22 | `TC-EMP-05` | TC-52 | `TC-HIS-04` |
| TC-23 | `TC-EMP-06` | TC-53 | `TC-HIS-05` |
| TC-24 | `TC-EMP-07` | TC-54 | `TC-HIS-06` |
| TC-25 | `TC-EMP-08` | TC-55 | `TC-HIS-07` |
| TC-26 | `TC-EMP-09` | TC-56 | `TC-HIS-08` |
| TC-27 | `TC-EMP-10` | TC-57 | `TC-HIS-09` |
| TC-28 | `TC-EMP-11` | TC-58 | `TC-DSH-01` |
| TC-29 | `TC-EMP-12` | TC-59 | `TC-DSH-02` |
| TC-30 | `TC-EMP-13` | TC-60 | `TC-WEB-01` |
| | | TC-61 | `TC-WEB-02` |
