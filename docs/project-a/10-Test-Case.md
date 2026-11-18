# Test Case
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi | 1.0 |
| Tanggal | 18 November 2026 |
| Jumlah test case | **61** (TC-01 … TC-61) |
| Acuan | `06-Functional-Requirement.md`, `01-SRS.md`, `09-Test-Plan.md` |
| Status eksekusi | **Sudah dijalankan** — 61/61 test case **Lulus** (18 November 2026); 2 temuan non-TC dicatat di §13.4 |
| Bukti | `docs/Project A - QA Test Cases.xlsx` (5 sheet) + suite otomatis dan tangkapan layar (§13.1) |

---

## 1. Konvensi

| Istilah | Arti |
|---|---|
| `<BASE>` | `http://localhost:3000` (atau port yang dipakai) |
| `<HR_TOKEN>` | Token hasil login akun HR |
| `<EMP_TOKEN>` | Token hasil login karyawan |
| `<EMP_ID>` | `employees.id` karyawan uji |
| `<ATT_ID>` | `attendances.id` |
| `<HR_PASSWORD>` | Nilai `HR_PASSWORD` dari `.env` lokal |
| Status | `Belum` · `Lulus` · `Gagal` · `Blocked` · `N/A` |

**Prasyarat umum:** server berjalan, database bersih, seed HR + office terbentuk (`09-Test-Plan.md` §4.2).

**Format hasil:** setiap TC dicatat `Lulus`/`Gagal` + bukti (`TC-<id>.json` atau `TC-<id>-*.png`). TC tanpa bukti dianggap **belum dijalankan**. Hasil aktual rinci per TC ada di `docs/Project A - QA Test Cases.xlsx` kolom *Actual Results*.

---

## 2. Smoke Test — Alur Inti (TC-01 … TC-13)

> 13 kasus ini berasal dari `test/attendance.test.js` dan menjadi **regression pack wajib** setiap ada perubahan kode.

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-01 | HR membuat karyawan + akun | FR-AUTH-01, 06; FR-EMP-01..03; FR-ADM-02 | DB bersih, seed HR | 1) `POST /api/login` HR. 2) `GET /api/me` cek `account_code`. 3) `GET /api/employees?status=INACTIVE`. 4) `POST /api/employees {"name":"Budi Santoso"}`. 5) Ulangi nama sama. 6) `POST /api/admins {"name":"HR Kedua"}` lalu login. 7) `POST /api/admins` dengan email yang sama. | Login sukses; `account_code=HR01`; daftar INACTIVE berisi data legacy; respons 201 dengan `employee_code=ky04`, `email=budi.santoso@ethes.tech`, `initial_password` ada; percobaan kedua `email=budi.santoso2@ethes.tech`, `ky05`; admin baru `HR02` dan bisa login; duplikat email 409 | Lulus |
| TC-02 | Token hilang / tidak valid | FR-AUTH-00, 04 | — | 1) `GET /api/me` tanpa header. 2) `GET /api/attendance/today` dengan `Authorization: Bearer abc`. | Keduanya `401 UNAUTHORIZED`; tidak ada data dikembalikan | Lulus |
| TC-03 | OUT tanpa IN | FR-ATT-04 | Token Employee, belum IN hari ini | `POST /api/attendance/check-out` multipart (foto + lat/lng valid) | `409 NOT_CHECKED_IN`; tidak ada record baru | Lulus |
| TC-04 | IN pertama berhasil | FR-ATT-02, 07 | Token Employee, dalam radius | `POST /api/attendance/check-in` multipart `photo`, `lat`, `lng` | `201`; `status` ∈ {`TEPAT_WAKTU`,`TERLAMBAT`}; record memuat `check_in_at`, `office_id`, `check_in.distance_m`, `photo_url` | Lulus |
| TC-05 | IN kedua ditolak | FR-ATT-03, 13 | Sudah IN hari ini | Kirim check-in lagi dengan foto baru | `409 ALREADY_CHECKED_IN`; `GET /api/attendance/history` tetap `meta.total=1`; foto baru tidak tersimpan | Lulus |
| TC-06 | OUT berhasil | FR-ATT-05 | Sudah IN, belum OUT | `POST /api/attendance/check-out` multipart valid | `200`; `check_out_at` terisi; `out_state=SUDAH_OUT` | Lulus |
| TC-07 | OUT kedua ditolak | FR-ATT-06 | Sudah OUT | Kirim OUT lagi | `409 ALREADY_CHECKED_OUT`; `check_out_at` tidak berubah | Lulus |
| TC-08 | GPS luar radius & tanpa foto | FR-ATT-08, 09, 10 | Token Employee | 1) IN dengan `lat=-6.2,lng=106.8` (luar radius). 2) IN tanpa field `photo`. | (1) `403 OUTSIDE_RADIUS` + `distance_m` & `radius_m`; (2) `400 PHOTO_REQUIRED` | Lulus |
| TC-09 | Privasi data antar karyawan | FR-AUTH-05; FR-HIS-02, 08 | Dua karyawan, satu punya absensi | 1) Employee A `POST /api/admins`. 2) `GET /api/admins`. 3) `GET /api/attendance/history?employee_id=<ID_B>`. 4) `GET /api/attendance`. 5) `GET /api/attendance/<ATT_ID>/photo/in`. | Semua `403 FORBIDDEN`; riwayat sendiri tetap dapat diakses | Lulus |
| TC-10 | Filter HR & dashboard | FR-HIS-03..07; FR-DSH-01..05 | Ada 1 absensi hari ini, ≥ 2 karyawan ACTIVE | 1) `GET /api/attendance?date=<hari_ini>`. 2) `GET /api/attendance?preset=last7&status=SUDAH_OUT`. 3) `?preset=yesterday`. 4) `?date=<hari_ini>&status=BELUM_IN`. 5) `?from=2026-02-01&to=2026-01-01`. 6) `GET /api/dashboard/attendance`. | (1) total 1. (2) total 1. (3) total 0. (4) total 1. (5) `400`. (6) `summary.sudah_in=1`, `belum_in=1`, `trend.length=7` | Lulus |
| TC-11 | Karyawan nonaktif tidak bisa login | FR-AUTH-03; FR-EMP-09 | Karyawan ACTIVE | 1) Ubah status ke `INACTIVE`. 2) Login karyawan tersebut. | `403 ACCOUNT_INACTIVE` | Lulus |
| TC-12 | Password salah untuk akun terhapus | FR-AUTH-02 | Karyawan sudah dihapus | Login dengan email karyawan terhapus | `401 INVALID_CREDENTIALS` | Lulus |
| TC-13 | Hapus karyawan + riwayat | FR-EMP-07, 10 | Karyawan punya absensi | 1) `DELETE /api/employees/<EMP_ID>`. 2) `GET` detail. 3) `GET /api/attendance?date=<hari_ini>`. 4) Tambah karyawan baru. | (1) `200 {ok:true}`. (2) `404`. (3) total 0. (4) kode berikutnya melanjutkan nomor (`ky07` pada skenario tes), bukan memakai ulang ID | Lulus |

---

## 3. Autentikasi & Otorisasi (TC-14 … TC-18)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-14 | Login field kosong | FR-AUTH-01, 02 | — | 1) `POST /api/login {}`. 2) `{"email":"x@y.z"}`. 3) `{"password":"..."}`. | Ketiganya `400 VALIDATION` dengan pesan field wajib | Lulus |
| TC-15 | Token kedaluwarsa | FR-AUTH-04, 08 | Secret JWT dari `.env` | 1) Buat token `exp` 1 detik lalu tunggu 2 detik. 2) Pakai token untuk `GET /api/me`. | `401 UNAUTHORIZED`; klien kembali ke Login | Lulus |
| TC-16 | Employee menembus endpoint HR | FR-AUTH-00, 05 | Token Employee | Panggil berurutan: `GET/POST /api/employees`, `GET/POST /api/admins`, `GET /api/dashboard/attendance`, `GET /api/attendance`. | Seluruhnya `403 FORBIDDEN`; tidak ada data yang terbaca | Lulus |
| TC-17 | Perilaku sesi di Web HR (manual) | FR-AUTH-08; FR-WEB-05 | Browser, akun Employee & HR | 1) Login dengan akun Employee. 2) Login dengan HR lalu klik Keluar. 3) Hapus/ubah token di localStorage lalu muat ulang. | (1) pesan "Akun ini bukan HR", tetap di Login, tidak ada data. (2) kembali ke Login, token terhapus, timer berhenti. (3) layar Login, tidak ada data tampil | Lulus |
| TC-18 | Profil employee | FR-AUTH-06 | Token Employee | `GET /api/me` | Memuat `id`, `email`, `role=EMPLOYEE`, `employee{id, employee_code, name, status}` | Lulus |

---

## 4. Manajemen Karyawan (TC-19 … TC-31)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-19 | Tambah karyawan nama saja | FR-EMP-01..03 | Token HR | `POST /api/employees {"name":"Citra Dewi"}` | `201`; `employee_code` pola `kyNN`; email `citra.dewi@ethes.tech`; `initial_password` 12 karakter; `status=ACTIVE`; password muncul **hanya** di respons ini | Lulus |
| TC-20 | Email otomatis bentrok | FR-EMP-02 | Sudah ada `budi.santoso@ethes.tech` | Tambah karyawan kedua dengan nama `Budi Santoso` | Email `budi.santoso2@ethes.tech` | Lulus |
| TC-21 | Kode manual duplikat | FR-EMP-05 | Sudah ada `ky01` | `POST /api/employees {"name":"Uji","employee_code":"ky01"}` | `409 DUPLICATE_CODE`; tidak ada record dibuat | Lulus |
| TC-22 | Email manual duplikat | FR-EMP-05 | Email sudah dipakai | `POST /api/employees {"name":"Uji","email":"<email_terpakai>"}` | `409 DUPLICATE_EMAIL` | Lulus |
| TC-23 | Password terlalu pendek | FR-EMP-04 | Token HR | `POST /api/employees {"name":"Uji","password":"1234567"}` dan `PUT /api/employees/<EMP_ID> {"password":"1234567"}` | Keduanya `400 VALIDATION` "Password minimal 8 karakter" | Lulus |
| TC-24 | Format email tidak valid | FR-EMP-04 | Token HR | `POST /api/employees {"name":"Uji","email":"bukan-email"}` | `400 VALIDATION` "Format email tidak valid" | Lulus |
| TC-25 | Nama kosong | FR-EMP-01 | Token HR | `POST /api/employees {"name":"   "}` | `400 VALIDATION` | Lulus |
| TC-26 | Daftar karyawan: cari, filter, paginasi | FR-EMP-06 | ≥ 5 karyawan | 1) `?search=budi`. 2) `?status=INACTIVE`. 3) `?status=SALAH`. 4) `?page=2&limit=2`. 5) `?search=%25%27%20OR%201%3D1--`. | (1)(2) hasil terfilter. (3) `400 VALIDATION`. (4) `meta.page=2`, `data.length ≤ 2`. (5) diperlakukan sebagai teks biasa, bukan injeksi; tidak ada error 500 | Lulus |
| TC-27 | Detail karyawan tidak ada | FR-EMP-07 | Token HR | `GET /api/employees/999999` | `404 NOT_FOUND` | Lulus |
| TC-28 | Ubah karyawan | FR-EMP-08 | Token HR, karyawan ada | `PUT /api/employees/<EMP_ID>` dengan nama/email/password baru | `200`; data terbaru tampil; login dengan password baru berhasil, password lama `401` | Lulus |
| TC-29 | Karyawan nonaktif tidak bisa absen | FR-EMP-09; FR-ATT-12 | Karyawan INACTIVE, token masih berlaku | `POST /api/attendance/check-in` multipart valid | `403 ACCOUNT_INACTIVE`; tidak ada record | Lulus |
| TC-30 | Reset password | FR-EMP-11 | Token HR | `POST /api/employees/<EMP_ID>/reset-password` lalu login dengan `new_password` | `200` berisi `email` + `new_password`; login baru sukses; password sebelumnya `401` | Lulus |
| TC-31 | Berkas foto ikut terhapus | FR-EMP-10 | Karyawan punya foto IN/OUT | 1) Catat jumlah berkas di `uploads/attendance`. 2) `DELETE /api/employees/<EMP_ID>`. 3) Hitung ulang. | Jumlah berkas berkurang sesuai foto karyawan; bila ada berkas gagal dihapus, respons memuat `warning` dan data tetap terhapus | Lulus |

---

## 5. Akun HR (TC-32 … TC-34)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-32 | Tambah akun HR | FR-ADM-02, 04 | Token HR | `POST /api/admins {"name":"HR Kedua"}` lalu login dengan email + `initial_password` | `201`; `account_code=HR02`; `role=HR`; login sukses; `/api/me` menunjukkan `HR02` | Lulus |
| TC-33 | Email akun HR duplikat | FR-ADM-03 | Email admin sudah ada | `POST /api/admins {"name":"Duplikat","email":"<email_admin>"}` | `409 DUPLICATE_EMAIL`; counter HR tidak bertambah | Lulus |
| TC-34 | Daftar & pencarian akun HR | FR-ADM-01 | ≥ 3 akun HR | 1) `GET /api/admins`. 2) `?search=HR02`. | (1) urut `HR01..HR03`. (2) hanya akun yang cocok | Lulus |

---

## 6. Office (TC-35 … TC-40)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-35 | Tambah office valid | FR-OFF-02 | Token HR | `POST /api/offices {"name":"Cabang","latitude":-7.43,"longitude":111.01,"radius_m":100}` | `201`; office muncul di `GET /api/offices` | Lulus |
| TC-36 | Radius di luar rentang | FR-OFF-02 | Token HR | Kirim `radius_m=5`, lalu `radius_m=5001` | Keduanya `400 VALIDATION` "radius_m harus 10-5000 meter" | Lulus |
| TC-37 | Koordinat tidak valid | FR-OFF-02 | Token HR | Kirim `latitude=91`, lalu `longitude=181`, lalu tanpa nama | Ketiganya `400 VALIDATION` | Lulus |
| TC-38 | Employee tidak boleh mengubah office | FR-OFF-01, 03; FR-AUTH-05 | Token Employee | `POST /api/offices` dan `PUT /api/offices/1` | Keduanya `403 FORBIDDEN`; `GET /api/offices` tetap boleh | Lulus |
| TC-39 | Nonaktifkan office | FR-OFF-03 | Token HR, ≥ 2 office | `PUT /api/offices/<ID> {"is_active":false}` lalu `GET /api/offices` | Office hilang dari daftar aktif | Lulus |
| TC-40 | Tidak ada office aktif | FR-ATT-11 | Semua office `is_active=0` | IN dengan foto + GPS valid | `409 NO_OFFICE` | Lulus |

---

## 7. Absensi (TC-41 … TC-48)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-41 | Status hari ini: BELUM_IN | FR-ATT-01 | Token Employee, belum absen | `GET /api/attendance/today` | `state=BELUM_IN`, `can_check_in=true`, `can_check_out=false`; `rules` memuat `work_start=08:00`, `late_tolerance_min=15`, `timezone=Asia/Jakarta`; `offices` (level atas respons) berisi office aktif | Lulus |
| TC-42 | Status hari ini: SUDAH_IN → SUDAH_OUT | FR-ATT-01 | Sudah IN | 1) `GET today` setelah IN. 2) `GET today` setelah OUT. | (1) `state=SUDAH_IN`, `can_check_in=false`, `can_check_out=true`. (2) `state=SUDAH_OUT`, keduanya `false` | Lulus |
| TC-43 | IN tanpa GPS | FR-ATT-09 | Token Employee | Kirim foto tanpa `lat`/`lng`; ulangi dengan `lat=abc` | `400 GPS_REQUIRED` | Lulus |
| TC-44 | Foto melebihi 5 MB | FR-ATT-15 | Token Employee | Kirim berkas 6 MB | `400 INVALID_PHOTO` "Foto maksimal 5 MB" | Lulus |
| TC-45 | Foto tipe tidak didukung | FR-ATT-15 | Token Employee | Kirim berkas `.txt` | `400 INVALID_PHOTO` "Foto harus JPEG/PNG/WEBP" | Lulus |
| TC-46 | Foto yatim dihapus saat ditolak | FR-ATT-14 | Token Employee, luar radius | 1) Catat jumlah berkas upload. 2) IN dari luar radius. 3) Hitung ulang. | Respons `403 OUTSIDE_RADIUS`; jumlah berkas **tidak bertambah** | Lulus |
| TC-47 | Batas waktu 08:15 vs 08:16 (unit) | FR-ATT-07 | Node.js | Jalankan `attendanceStatus` dengan `2026-11-18T01:15:00Z` (=08:15 WIB) dan `01:16:00Z` (=08:16 WIB) | 08:15 → `TEPAT_WAKTU`; 08:16 → `TERLAMBAT`. Hasil tidak bergantung zona waktu mesin | Lulus |
| TC-48 | Status tersimpan hanya dua nilai | FR-ATT-07, 13 | Ada record absensi | Periksa `SELECT status FROM attendances` dan respons API | Nilai hanya `TEPAT_WAKTU` atau `TERLAMBAT`; `BELUM_*`/`SUDAH_*` tidak pernah tersimpan sebagai `status` | Lulus |

---

## 8. Riwayat & Filter (TC-49 … TC-57)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-49 | Prioritas filter tanggal | FR-HIS-04 | Token HR, ada data | `GET /api/attendance?date=2026-11-18&from=2026-11-01&to=2026-11-30&preset=last30` | `meta.from` dan `meta.to` = `2026-11-18` (parameter `date` menang) | Lulus |
| TC-50 | Validasi rentang | FR-HIS-05 | Token HR | 1) `from=2026-02-01&to=2026-01-01`. 2) rentang 367 hari. | Keduanya `400 VALIDATION` | Lulus |
| TC-51 | Status tidak dikenal | FR-HIS-06 | Token HR | `?status=SELESAI` | `400 VALIDATION` memuat daftar status sah | Lulus |
| TC-52 | BELUM_IN pada rentang | FR-HIS-06 | Token HR | `?from=2026-11-01&to=2026-11-18&status=BELUM_IN` | `400 VALIDATION` "hanya untuk 1 tanggal" | Lulus |
| TC-53 | BELUM_IN satu tanggal | FR-HIS-06 | 2 karyawan ACTIVE, 1 belum absen | `?date=<hari_ini>&status=BELUM_IN` | Hanya karyawan ACTIVE tanpa record; setiap baris `status=BELUM_IN`, `check_in_at=null` | Lulus |
| TC-54 | Pencarian, urutan, paginasi | FR-HIS-07 | Token HR, ≥ 3 record | 1) `?search=<nama>`. 2) `?sort=asc`. 3) `?limit=500`. 4) `?page=2&limit=2`. | (1) hasil cocok. (2) urutan naik. (3) `meta.limit=200` (dibatasi). (4) `meta.page=2`, `total_pages` benar | Lulus |
| TC-55 | Riwayat employee default bulan ini | FR-HIS-01 | Token Employee | `GET /api/attendance/history` tanpa parameter | `meta.from` = awal bulan berjalan; hanya data milik sendiri | Lulus |
| TC-56 | Akses foto | FR-HIS-08 | Ada record dengan & tanpa foto | 1) Tanpa token. 2) Employee lain. 3) `type=out` pada record tanpa foto OUT. 4) `type=lain`. | (1) `401`. (2) `403`. (3) `404`. (4) `404` | Lulus |
| TC-57 | Ekspor CSV (manual) | FR-HIS-09 | Token HR, ada data | Buka Web HR → Absensi → pilih filter → Unduh CSV | Berkas `absensi-<tanggal>.csv` terunduh; kolom Tanggal, Kode, Nama, IN, OUT, Status, Jarak IN, Jarak OUT; jumlah baris sesuai filter; maksimum 5.000 | Lulus |

---

## 9. Dashboard (TC-58 … TC-59)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-58 | Format tanggal dashboard | FR-DSH-04 | Token HR | `GET /api/dashboard/attendance?date=18-11-2026` | `400 VALIDATION` | Lulus |
| TC-59 | Konsistensi dashboard vs daftar | FR-DSH-01..03, 05 | 1 absensi, 2 karyawan ACTIVE | Bandingkan `summary.sudah_in`, `belum_in`, `late`, `not_checked_out`, `not_checked_in` dengan hasil `GET /api/attendance?date=` | `sudah_in` = total daftar; `belum_in = max(0, total_active − sudah_in)`; `late` = daftar `TERLAMBAT`; `not_checked_out` = `BELUM_OUT`; `trend` 7 elemen berurutan | Lulus |

---

## 10. Web HR (TC-60 … TC-61)

| ID | Judul | FR | Prasyarat | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|---|---|---|
| TC-60 | Navigasi & empty state (manual) | FR-WEB-01, 02 | Login HR | 1) Buka `#/dashboard`, `#/absensi`, `#/karyawan`, `#/office`. 2) Terapkan filter tanpa hasil. 3) Muat ulang halaman. | Setiap hash menampilkan halaman benar; empty state muncul; setelah reload tetap pada halaman sesuai hash dan data dimuat ulang | Lulus |
| TC-61 | Dialog kredensial, toast, refresh (manual) | FR-WEB-03, 04; FR-DSH-03 | Login HR | 1) Tambah karyawan. 2) Klik tombol salin. 3) Picu error (mis. kode duplikat). 4) Diamkan dashboard 60 detik. | Dialog menampilkan kode/email/password; tombol salin menyalin ke clipboard; toast error tampil; dashboard memperbarui tanpa kehilangan data saat gagal | Lulus |

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

### 11.3 Request IN/OUT (contoh curl)

```bash
curl -X POST "$BASE/api/attendance/check-in" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -F lat=-7.4296 -F lng=111.0095 -F photo=@selfie.png
```

### 11.4 Token kedaluwarsa (TC-15)

```bash
node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({sub:1,role:'HR'},process.env.JWT_SECRET,{expiresIn:'-1s'}))"
```

Jalankan dari root proyek agar `jsonwebtoken` dan `JWT_SECRET` tersedia.

---

## 12. Ringkasan Cakupan per Modul

| Modul | Test case | Jumlah |
|---|---|---|
| Auth & sesi | TC-01, 02, 12, 14..18 | 8 |
| Karyawan | TC-19..TC-31 (+TC-01, 11, 13) | 16 |
| Akun HR | TC-32..TC-34 | 3 |
| Office | TC-35..TC-40 | 6 |
| Absensi | TC-03..TC-08, TC-29, TC-40..TC-48 | 16 |
| Riwayat & filter | TC-09, 10, TC-49..TC-57 | 11 |
| Dashboard | TC-10, TC-58, TC-59 | 3 |
| Web HR | TC-17, TC-60, TC-61 | 3 |
| **Total unik** | **TC-01 … TC-61** | **61** |

---

## 13. Catatan Eksekusi

### 13.1 Ringkasan hasil

| Suite | Cakupan | Jumlah | Hasil |
|---|---|---|---|
| Unit test repo | `test/attendance.test.js` (`node --test`) | 10 | **10 Lulus** |
| API inti | auth, karyawan, admin, absensi, dashboard | 109 | **109 Lulus** |
| API lanjutan | office, keamanan, otorisasi lintas peran | 21 | **20 Lulus**, 1 temuan (header keamanan) |
| API penutup | TC yang belum tercakup suite sebelumnya | 13 | **13 Lulus** |
| API probe | body login tidak lengkap, password 7 karakter, akun HR baru | 3 | **3 Lulus** |
| UI Web HR | alur utama, filter, CRUD, ekspor | 18 | **18 Lulus** |
| UI Web HR lanjutan | guard akses, ubah/reset/hapus, tab dashboard | 15 | **14 Lulus**, 1 temuan (TypeError konsol) |
| UI Web HR penutup | tombol salin, error form, reload per hash, auto-refresh | 4 | **4 Lulus** |

Total pemeriksaan otomatis: **193 eksekusi** dengan **191 Lulus** dan **2 temuan** (lihat §13.4). Parameter lingkungan: Windows 11, Node v22.23.2, server `src/server.js` port 3311, database & folder unggahan QA terpisah dari `data/` repo, zona Asia/Jakarta, Chrome headless 1440×900.

### 13.2 Penyimpangan pengujian

| Hal | Catatan |
|---|---|
| TC manual (TC-17, 57, 60, 61) | Dijalankan dengan browser driver (Puppeteer), bukan tangan; tangkapan layar tersimpan pada folder bukti |
| TC-03..TC-08, 29, 40..48 | Dijalankan lewat klien API karena aplikasi mobile belum ada di repo |
| TC-47 | Diuji sebagai fungsi murni (`src/utils/time.js`) agar tidak bergantung jam nyata |
| TC-31 | Cabang `warning` (berkas gagal dihapus) tidak dapat dipicu; hanya jalur sukses yang dibuktikan |
| TC-26 langkah 5 | Payload injeksi dikirim dalam bentuk ter-encode sehingga diterima sebagai teks pencarian biasa |

### 13.3 Data uji

Data uji memakai database QA terpisah. Penomoran `kyNN`, `HRnn`, dan `attendance_id` yang tercatat di kolom hasil adalah nilai aktual saat eksekusi, bukan angka yang dipaksakan.

### 13.4 Temuan di luar 61 test case

| ID | Temuan | Severity | Bukti |
|---|---|---|---|
| BUG-01 | Respons web tidak memuat header keamanan (`X-Content-Type-Options`, `X-Frame-Options`, CSP, `Referrer-Policy` semuanya tidak ada) | Medium | Sheet `AUTH` baris BUG-01 |
| BUG-02 | `TypeError: Cannot set properties of null (setting 'innerHTML')` di `public/app.js:374` ketika 401 memicu `logout()` saat daftar karyawan sedang dimuat | Low | Sheet `EMP` baris BUG-02 |

Keduanya tidak menggagalkan satu pun alur bisnis: seluruh 61 TC tetap **Lulus**. Rincian perbaikan yang disarankan ada pada kolom *Notes* di berkas xlsx dan `13-Defect-Management.md`.

### 13.5 Catatan teknis

1. **TC bergantung waktu.** TC-04, TC-10, TC-41..TC-48 menghasilkan nilai berbeda bila dijalankan sebelum/sesudah 08:15. Jam eksekusi dicatat pada kolom hasil.
2. **TC bergantung data.** Penomoran `kyNN` pada TC-13 dan TC-19 mengasumsikan jumlah karyawan tertentu. Kode aktual dicatat, bukan dipaksakan.
3. **TC manual** (TC-17, 57, 60, 61) memerlukan browser driver; bukti berupa tangkapan layar.
4. **TC-31** hanya dapat memverifikasi `warning` bila penghapusan berkas gagal — kondisi ini sulit dipicu sengaja; bila tidak terjadi, dijelaskan alasannya.
5. **Jangan mencatat kredensial** di kolom hasil. Gunakan `<HR_PASSWORD>` atau "sesuai `.env`".