# Functional Requirement
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi | 2.0 (build) |
| Tanggal | 18 November 2026 |
| Jumlah FR | **63** (9 AUTH · 12 EMP · 4 ADM · 4 OFF · 15 ATT · 9 HIS · 5 DSH · 5 WEB) |
| Prioritas | MoSCoW: **M** Must · **S** Should · **C** Could |
| Status | **I** = terimplementasi · **P** = terimplementasi sebagian · **G** = gap |
| Sumber | `app/`, `routes/`, `database/`, `tests/`, `public/`, `docs/ETHES_TECH Project.docx` |

> Jumlah FR di dokumen ini **identik** dengan `01-SRS.md` §3 (63 butir). Setiap FR memuat rujukan berkas dan baris agar dapat diverifikasi.

---

## 1. Modul AUTH — Autentikasi & Otorisasi (9 FR)

| ID | Requirement | Pri | Status | Bukti | Tes |
|---|---|---|---|---|---|
| **FR-AUTH-00** | **Sistem menolak seluruh akses fitur sebelum login.** Semua endpoint `/api/**` selain `POST /api/login` memerlukan bearer token valid; tanpa token → `401 UNAUTHORIZED`; role salah → `403 FORBIDDEN`. | M | I | `app/Http/Middleware/JwtAuth.php:20-42`, `app/Http/Middleware/RequireRole.php:11-19`, `routes/api.php:18-67` | TC-AUTH-01 |
| FR-AUTH-01 | Login `email` + `password` mengembalikan `token`, `role`, `user`. | M | I | `app/Http/Controllers/Api/AuthController.php:22-58` | TC-AUTH-02, TC-EMP-01 |
| FR-AUTH-02 | Kredensial salah → `401 INVALID_CREDENTIALS`. | M | I | `app/Http/Controllers/Api/AuthController.php:35-37` | TC-AUTH-02, TC-AUTH-03 |
| FR-AUTH-03 | Karyawan `INACTIVE` tidak dapat login → `403 ACCOUNT_INACTIVE`. | M | I | `app/Http/Controllers/Api/AuthController.php:39-41` | TC-AUTH-04 |
| FR-AUTH-04 | Token divalidasi setiap request; hilang/tidak valid/kedaluwarsa → `401 UNAUTHORIZED`. | M | I | `app/Http/Middleware/JwtAuth.php:20-42` | TC-AUTH-01, TC-AUTH-05 |
| FR-AUTH-05 | Otorisasi per peran pada setiap endpoint. | M | I | `routes/api.php` (`role:HR`/`role:EMPLOYEE`), `app/Http/Middleware/RequireRole.php` | TC-AUTH-06, TC-AUTH-07, TC-OFF-04 |
| FR-AUTH-06 | `GET /api/me` mengembalikan profil + data karyawan terkait. | M | I | `app/Http/Controllers/Api/AuthController.php:60-82` | TC-AUTH-08, TC-EMP-01 |
| FR-AUTH-07 | Token ditandatangani secret server; masa berlaku default `12h`. | M | I | `app/Services/JwtService.php:10-15`, `app/Http/Controllers/Api/AuthController.php:43-46` | TC-AUTH-05, TC-EMP-01 |
| FR-AUTH-08 | Klien menghapus token dan kembali ke Login saat menerima 401. | M | I | `public/app.js:24,56-60` | TC-AUTH-05, TC-AUTH-09 |

**Acceptance criteria**

```gherkin
Scenario: Akses tanpa token ditolak
  Given saya belum login
  When saya memanggil GET /api/attendance/today
  Then respons HTTP 401 dengan code "UNAUTHORIZED"

Scenario: Role tidak sesuai ditolak
  Given saya login sebagai Employee
  When saya memanggil GET /api/dashboard/attendance
  Then respons HTTP 403 dengan code "FORBIDDEN"

Scenario: Web HR menampilkan hanya layar Login
  Given tidak ada token di localStorage
  When saya membuka halaman utama Web HR
  Then yang tampil hanya layar Login
  And tidak ada data absensi yang dirender
```

---

## 2. Modul EMP — Manajemen Karyawan (12 FR)

| ID | Requirement | Pri | Status | Bukti | Tes |
|---|---|---|---|---|---|
| FR-EMP-01 | Tambah karyawan cukup dengan `name`; kode otomatis `kyNN`. | M | I | `app/Http/Controllers/Api/EmployeeController.php:41-51`, `app/Http/Controllers/Api/EmployeeController.php:130-186` | TC-EMP-02, TC-EMP-08 |
| FR-EMP-02 | Email otomatis `nama.depan@ethes.tech`; bentrok diberi sufiks angka. | S | I | `app/Http/Controllers/Api/EmployeeController.php:18-39` | TC-EMP-02, TC-EMP-03 |
| FR-EMP-03 | Akun login dibuat bersamaan; password acak 12 karakter ditampilkan **sekali**. | M | I | `app/Http/Controllers/Api/EmployeeController.php:144-148`, `app/Http/Controllers/Api/EmployeeController.php:182-185` | TC-EMP-01, TC-EMP-02 |
| FR-EMP-04 | `employee_code`, `email`, `password` boleh diisi manual; password ≥ 8 karakter. | S | I | `app/Http/Controllers/Api/EmployeeController.php:137-148` | TC-EMP-06, TC-EMP-07, TC-EMP-11 |
| FR-EMP-05 | Kode duplikat → `409 DUPLICATE_CODE`; email duplikat → `409 DUPLICATE_EMAIL`. | M | I | `app/Http/Controllers/Api/EmployeeController.php:150-156` | TC-EMP-04, TC-EMP-05 |
| FR-EMP-06 | Daftar karyawan dengan `search`, `status`, `page`, `limit` (maks 200). | M | I | `app/Http/Controllers/Api/EmployeeController.php:71-118` | TC-EMP-09 |
| FR-EMP-07 | Detail karyawan per ID; tidak ada → `404 NOT_FOUND`. | M | I | `app/Http/Controllers/Api/EmployeeController.php:120-128` | TC-EMP-10, TC-EMP-14 |
| FR-EMP-08 | Ubah `name`, `employee_code`, `status`, `email`, `password`. | M | I | `app/Http/Controllers/Api/EmployeeController.php:188-248` | TC-EMP-11 |
| FR-EMP-09 | Nonaktifkan karyawan → login dan absensi ditolak. | M | I | `app/Http/Controllers/Api/EmployeeController.php:188-248`, `app/Http/Controllers/Api/AuthController.php:39-41` | TC-AUTH-04, TC-EMP-12 |
| FR-EMP-10 | Hapus karyawan → akun, riwayat, dan berkas foto ikut terhapus. | S | I | `app/Http/Controllers/Api/EmployeeController.php:250-289` | TC-EMP-14, TC-EMP-15 |
| FR-EMP-11 | Reset password → password acak baru, ditampilkan sekali. | S | I | `app/Http/Controllers/Api/EmployeeController.php:291-310` | TC-EMP-13 |
| FR-EMP-12 | Pembuatan karyawan + akun dalam satu transaksi. | M | I | `app/Http/Controllers/Api/EmployeeController.php:158-180` | TC-EMP-01, TC-EMP-02 |

**Acceptance criteria**

```gherkin
Scenario: Tambah karyawan hanya dengan nama
  Given saya sudah login sebagai HR
  When saya mengirim POST /api/employees dengan body nama saja
  Then sistem membuat employee_code "kyNN" dan email "nama.depan@ethes.tech"
  And respons 201 memuat initial_password yang hanya tampil sekali

Scenario: Email otomatis bentrok
  Given sudah ada karyawan "Budi Santoso" dengan email budi.santoso@ethes.tech
  When HR menambah karyawan kedua dengan nama sama
  Then email menjadi budi.santoso2@ethes.tech

Scenario: Karyawan dinonaktifkan
  Given karyawan berstatus ACTIVE
  When HR mengubah status menjadi INACTIVE
  Then login karyawan menghasilkan 403 ACCOUNT_INACTIVE
  And check-in karyawan menghasilkan 403 ACCOUNT_INACTIVE
```

---

## 3. Modul ADM — Akun HR (4 FR)

| ID | Requirement | Pri | Status | Bukti | Tes |
|---|---|---|---|---|---|
| FR-ADM-01 | Daftar akun HR dengan `search` + paginasi. | S | I | `app/Http/Controllers/Api/AdminController.php:40-77` | TC-ADM-03 |
| FR-ADM-02 | Tambah akun HR; `account_code` otomatis `HRNN`. | S | I | `app/Http/Controllers/Api/AdminController.php:79-131`, `app/Services/HrCodeService.php` | TC-EMP-01, TC-ADM-01 |
| FR-ADM-03 | Email akun HR duplikat → `409 DUPLICATE_EMAIL`. | M | I | `app/Http/Controllers/Api/AdminController.php:102-105` | TC-EMP-01, TC-ADM-02 |
| FR-ADM-04 | Akun HR baru langsung dapat login dan mengakses fitur HR. | M | I | `app/Http/Controllers/Api/AdminController.php:100-131` | TC-EMP-01, TC-ADM-01 |

**Acceptance criteria**

```gherkin
Scenario: Tambah akun HR kedua
  Given saya sudah login sebagai HR01
  When saya mengirim POST /api/admins dengan nama "HR Kedua"
  Then account_code yang dibuat adalah "HR02"
  And akun tersebut dapat login dan membuka dashboard

Scenario: Nomor HR tidak berulang
  Given tiga akun HR sudah ada
  When HR menambah akun keempat
  Then account_code adalah "HR04"
```

---

## 4. Modul OFF — Office & Geofence (4 FR)

| ID | Requirement | Pri | Status | Bukti | Tes |
|---|---|---|---|---|---|
| FR-OFF-01 | Semua pengguna login dapat melihat office aktif. | M | I | `app/Http/Controllers/Api/OfficeController.php:41-45` | TC-OFF-04 |
| FR-OFF-02 | HR menambah office; `name` wajib, koordinat valid, radius 10–5000 m. | M | I | `app/Http/Controllers/Api/OfficeController.php:14-52` | TC-OFF-01, TC-OFF-02, TC-OFF-03 |
| FR-OFF-03 | HR mengubah office, termasuk `is_active`. | M | I | `app/Http/Controllers/Api/OfficeController.php:54-66` | TC-OFF-04, TC-OFF-05 |
| FR-OFF-04 | Seed awal menyediakan satu office aktif. | M | I | `database/seeders/OfficeSeeder.php:17-33` | TC-OFF-01 |

**Acceptance criteria**

```gherkin
Scenario: Radius di luar rentang
  Given saya sudah login sebagai HR
  When saya mengirim radius_m = 5
  Then respons 400 VALIDATION dengan pesan "radius_m harus 10-5000 meter"

Scenario: Employee tidak boleh mengubah office
  Given saya login sebagai Employee
  When saya mengirim POST /api/offices
  Then respons 403 FORBIDDEN
```

---

## 5. Modul ATT — Absensi Harian (15 FR)

| ID | Requirement | Pri | Status | Bukti | Tes |
|---|---|---|---|---|---|
| FR-ATT-01 | `GET /api/attendance/today` mengembalikan `state`, `can_check_in`, `can_check_out`, aturan jam, daftar office. | M | I | `app/Http/Controllers/Api/AttendanceController.php:122-148` | TC-ATT-07, TC-ATT-08 |
| FR-ATT-02 | IN pertama tersimpan: `check_in_at`, status, office, koordinat, jarak, foto. | M | I | `app/Http/Controllers/Api/AttendanceController.php:150-187` | TC-ATT-01 |
| FR-ATT-03 | IN kedua → `409 ALREADY_CHECKED_IN` tanpa duplikasi. | M | I | `app/Http/Controllers/Api/AttendanceController.php:155-157`, `app/Http/Controllers/Api/AttendanceController.php:179-181` | TC-ATT-02 |
| FR-ATT-04 | OUT tanpa IN → `409 NOT_CHECKED_IN`. | M | I | `app/Http/Controllers/Api/AttendanceController.php:194-197` | TC-ATT-03 |
| FR-ATT-05 | OUT setelah IN dan belum OUT berhasil (`check_out_at` terisi). | M | I | `app/Http/Controllers/Api/AttendanceController.php:202-210` | TC-ATT-04 |
| FR-ATT-06 | OUT kedua → `409 ALREADY_CHECKED_OUT`. | M | I | `app/Http/Controllers/Api/AttendanceController.php:198-200` | TC-ATT-05 |
| FR-ATT-07 | `TEPAT_WAKTU` bila ≤ 08:15, `TERLAMBAT` bila > 08:15, memakai jam server. | M | I | `app/Services/TimeService.php:38-47` | TC-ATT-01, TC-ATT-13 |
| FR-ATT-08 | Foto wajib → `400 PHOTO_REQUIRED`. | M | I | `app/Http/Controllers/Api/AttendanceController.php:40-42` | TC-ATT-06 |
| FR-ATT-09 | Koordinat wajib & valid → `400 GPS_REQUIRED`. | M | I | `app/Http/Controllers/Api/AttendanceController.php:60-65` | TC-ATT-06, TC-ATT-09 |
| FR-ATT-10 | Di luar radius → `403 OUTSIDE_RADIUS` + `office`, `distance_m`, `radius_m`. | M | I | `app/Http/Controllers/Api/AttendanceController.php:70-98` | TC-ATT-06 |
| FR-ATT-11 | Tidak ada office aktif → `409 NO_OFFICE`. | M | I | `app/Http/Controllers/Api/AttendanceController.php:70-73` | TC-OFF-06 |
| FR-ATT-12 | Karyawan `INACTIVE` ditolak → `403 ACCOUNT_INACTIVE`. | M | I | `app/Http/Controllers/Api/AttendanceController.php:23-36` | TC-AUTH-04, TC-EMP-12 |
| FR-ATT-13 | Keunikan `(employee_id, work_date)` di level database. | M | I | `database/migrations/2014_10_12_000003_create_attendances_table.php:29` | TC-ATT-02, TC-ATT-14 |
| FR-ATT-14 | Foto yang terunggah dihapus bila request ditolak. | S | I | `app/Http/Controllers/Api/AttendanceController.php:159`, `app/Http/Controllers/Api/AttendanceController.php:173-183` | TC-ATT-12 |
| FR-ATT-15 | Foto > 5 MB atau tipe tidak didukung → `400 INVALID_PHOTO`. | S | I | `app/Http/Controllers/Api/AttendanceController.php:49-58`, `app/Exceptions/Handler.php:52-64` | TC-ATT-10, TC-ATT-11 |

**Acceptance criteria**

```gherkin
Scenario: Check-in pertama berhasil
  Given saya sudah login sebagai Employee aktif
  And saya berada dalam radius office
  When saya mengirim check-in dengan foto dan koordinat valid
  Then respons 201
  And status tersimpan TEPAT_WAKTU atau TERLAMBAT sesuai jam server
  And record memuat in_lat, in_lng, in_distance_m, in_photo

Scenario: Check-in kedua ditolak
  Given saya sudah check-in hari ini
  When saya mengirim check-in lagi dengan foto baru
  Then respons 409 ALREADY_CHECKED_IN
  And jumlah record hari ini tetap satu
  And foto yang baru diunggah dihapus

Scenario: Di luar radius
  Given office aktif beradius 100 m
  When saya check-in dari jarak 1,2 km
  Then respons 403 OUTSIDE_RADIUS
  And respons memuat distance_m dan radius_m
```

---

## 6. Modul HIS — Riwayat & Daftar Absensi (9 FR)

| ID | Requirement | Pri | Status | Bukti | Tes |
|---|---|---|---|---|---|
| FR-HIS-01 | Employee melihat riwayat sendiri; default `this_month`. | M | I | `app/Http/Controllers/Api/AttendanceController.php:366-377` | TC-HIS-07 |
| FR-HIS-02 | Employee meminta data karyawan lain → `403 FORBIDDEN`. | M | I | `app/Http/Controllers/Api/AttendanceController.php:369-372` | TC-AUTH-07 |
| FR-HIS-03 | HR melihat semua absensi; default `today`. | M | I | `routes/api.php:60` | TC-HIS-10 |
| FR-HIS-04 | Prioritas filter `date` > `from`+`to` > `preset` > default. | M | I | `app/Http/Controllers/Api/AttendanceController.php:216-249` | TC-HIS-01, TC-HIS-10 |
| FR-HIS-05 | Validasi tanggal: format, `from ≤ to`, maks 366 hari. | M | I | `app/Http/Controllers/Api/AttendanceController.php:233-246` | TC-HIS-02, TC-HIS-10 |
| FR-HIS-06 | Filter status: `TEPAT_WAKTU`, `TERLAMBAT`, `BELUM_OUT`, `SUDAH_OUT`, `BELUM_IN`. | M | I | `app/Http/Controllers/Api/AttendanceController.php:20`, `app/Http/Controllers/Api/AttendanceController.php:251-364` | TC-HIS-03, TC-HIS-04, TC-HIS-05, TC-HIS-10 |
| FR-HIS-07 | Filter `employee_id`, `search`, `sort`, paginasi (maks 200/baris). | S | I | `app/Http/Controllers/Api/AttendanceController.php:251-364` | TC-HIS-06, TC-HIS-10 |
| FR-HIS-08 | Foto IN/OUT melalui endpoint terproteksi; Employee hanya foto sendiri. | S | I | `app/Http/Controllers/Api/AttendanceController.php:384-407` | TC-AUTH-07, TC-HIS-08 |
| FR-HIS-09 | Ekspor CSV sesuai filter aktif (maks 25 halaman × 200 baris). | C | I | `public/app.js:287-300` | TC-HIS-09 |

**Acceptance criteria**

```gherkin
Scenario: Employee tidak boleh melihat data orang lain
  Given saya login sebagai Employee A
  When saya meminta riwayat dengan employee_id milik B
  Then respons 403 FORBIDDEN

Scenario: Filter BELUM_IN hanya satu tanggal
  Given saya login sebagai HR
  When saya meminta status BELUM_IN dengan rentang 7 hari
  Then respons 400 VALIDATION

Scenario: Rentang terlalu panjang
  Given saya login sebagai HR
  When saya meminta from=2025-01-01&to=2026-11-18
  Then respons 400 VALIDATION karena melebihi 366 hari
```

---

## 7. Modul DSH — Dashboard (5 FR)

| ID | Requirement | Pri | Status | Bukti | Tes |
|---|---|---|---|---|---|
| FR-DSH-01 | Ringkasan harian: total aktif, sudah IN, tepat waktu, terlambat, belum OUT, sudah OUT, belum IN. | M | I | `app/Http/Controllers/Api/DashboardController.php:23-48` | TC-HIS-10, TC-DSH-02 |
| FR-DSH-02 | Daftar terlambat, belum OUT, belum IN. | M | I | `app/Http/Controllers/Api/DashboardController.php:50-83` | TC-HIS-10, TC-DSH-02 |
| FR-DSH-03 | Tren 7 hari (sudah IN & terlambat). | S | I | `app/Http/Controllers/Api/DashboardController.php:85-100` | TC-HIS-10, TC-DSH-02 |
| FR-DSH-04 | `date` wajib `YYYY-MM-DD`, selain itu `400 VALIDATION`. | M | I | `app/Http/Controllers/Api/DashboardController.php:18-21` | TC-DSH-01 |
| FR-DSH-05 | Angka dashboard konsisten dengan daftar absensi pada tanggal yang sama. | M | I | `app/Http/Controllers/Api/DashboardController.php:25-33` vs `app/Http/Controllers/Api/AttendanceController.php:323-351` | TC-HIS-10, TC-DSH-02 |

**Acceptance criteria**

```gherkin
Scenario: Konsistensi angka dashboard
  Given tanggal D memiliki 1 absensi dan 2 karyawan ACTIVE
  When HR membuka dashboard untuk tanggal D
  Then summary.sudah_in = 1
  And summary.belum_in = 1
  And trend memiliki 7 elemen

Scenario: Format tanggal salah
  Given saya login sebagai HR
  When saya meminta dashboard dengan date=18-11-2026
  Then respons 400 VALIDATION
```

---

## 8. Modul WEB — Antarmuka HR (5 FR)

| ID | Requirement | Pri | Status | Bukti | Tes |
|---|---|---|---|---|---|
| FR-WEB-01 | Web HR disajikan sebagai berkas statis dari `public/` tanpa build. | M | I | `routes/web.php:13-19`, `public/index.html` | TC-WEB-01 |
| FR-WEB-02 | Navigasi hash: `#/dashboard`, `#/absensi`, `#/karyawan`, `#/office`. | M | I | `public/app.js:107,144-151` | TC-WEB-01 |
| FR-WEB-03 | Dialog kredensial (kode, email, password) + tombol salin. | S | I | `public/app.js:445-453` | TC-WEB-02 |
| FR-WEB-04 | Toast sukses/error untuk setiap aksi. | C | I | `public/app.js:33-36` | TC-WEB-02 |
| FR-WEB-05 | Web HR hanya menerima akun `HR`; akun lain ditolak dengan pesan. | M | I | `public/app.js:100,112` | TC-AUTH-09 |

**Acceptance criteria**

```gherkin
Scenario: Login Web HR dengan akun Employee
  Given akun berrole EMPLOYEE
  When pengguna login di Web HR
  Then Web menampilkan pesan "Akun ini bukan HR"
  And token tidak disimpan
  And dashboard tidak dirender
```

---

## 9. Traceability FR → Kode → Tes

| FR | Berkas | Titik kode | Tes otomatis |
|---|---|---|---|
| FR-AUTH-00 | `app/Http/Middleware/JwtAuth.php` | baris 7-22 | TC-AUTH-01, TC-AUTH-06 |
| FR-AUTH-01/02/03 | `app/Http/Controllers/Api/AuthController.php` | baris 10-21 | TC-AUTH-02, TC-AUTH-03, TC-AUTH-04, TC-EMP-01 |
| FR-AUTH-06 | `app/Http/Controllers/Api/AuthController.php` | baris 24-29 | TC-AUTH-08, TC-EMP-01 |
| FR-EMP-01..05, 12 | `app/Http/Controllers/Api/EmployeeController.php` | baris 14-75 | TC-EMP-01, TC-EMP-02, TC-EMP-03, TC-EMP-04, TC-EMP-05, TC-EMP-06, TC-EMP-07, TC-EMP-08, TC-EMP-11 |
| FR-EMP-08, 09 | `app/Http/Controllers/Api/EmployeeController.php` | baris 78-101 | TC-AUTH-04, TC-EMP-11, TC-EMP-12 |
| FR-EMP-10, 11 | `app/Http/Controllers/Api/EmployeeController.php` | baris 103-131 | TC-EMP-13, TC-EMP-14, TC-EMP-15 |
| FR-ADM-01..04 | `app/Http/Controllers/Api/AdminController.php` | baris 21-51 | TC-EMP-01, TC-ADM-01, TC-ADM-02, TC-ADM-03 |
| FR-OFF-01..04 | `app/Http/Controllers/Api/OfficeController.php` | baris 10-41 | TC-OFF-01, TC-OFF-02, TC-OFF-03, TC-OFF-04, TC-OFF-05 |
| FR-ATT-01 | `app/Http/Controllers/Api/AttendanceController.php` | baris 61-72 | TC-ATT-07, TC-ATT-08 |
| FR-ATT-02/03 | `app/Http/Controllers/Api/AttendanceController.php` | baris 75-90 | TC-ATT-01, TC-ATT-02 |
| FR-ATT-04..06 | `app/Http/Controllers/Api/AttendanceController.php` | baris 93-103 | TC-ATT-03, TC-ATT-04, TC-ATT-05 |
| FR-ATT-07 | `app/Services/TimeService.php` | baris 15-20 | TC-ATT-01, TC-ATT-13 |
| FR-ATT-08..15 | `app/Http/Controllers/Api/AttendanceController.php`, `app/Http/Controllers/Api/AttendanceController.php:38-109` | baris 32-52 | TC-AUTH-04, TC-EMP-12, TC-OFF-06, TC-ATT-02, TC-ATT-06, TC-ATT-09, TC-ATT-10, TC-ATT-11, TC-ATT-12, TC-ATT-14 |
| FR-HIS-01..08 | `app/Http/Controllers/Api/AttendanceController.php` | baris 109-162 | TC-AUTH-07, TC-HIS-01, TC-HIS-02, TC-HIS-03, TC-HIS-04, TC-HIS-05, TC-HIS-06, TC-HIS-07, TC-HIS-08, TC-HIS-10 |
| FR-HIS-09 | `public/app.js` | baris 287-300 | TC-HIS-09 |
| FR-DSH-01..05 | `app/Http/Controllers/Api/DashboardController.php` | baris 13-38 | TC-HIS-10, TC-DSH-01, TC-DSH-02 |
| FR-WEB-01..05 | `public/app.js` | baris 24-151 | TC-AUTH-09, TC-WEB-01, TC-WEB-02 |

### 9.1 Daftar Tes Unit (`tests/Feature/WorkforceAttendanceTest.php`)

Sepuluh tes unit di berkas itu menjadi **smoke pack** yang sama dengan `10-Test-Case.md` §2. Nama tes ditulis apa adanya seperti di berkas agar mudah dicari.

| # | Nama tes di `tests/Feature/WorkforceAttendanceTest.php` | TC fungsional | FR yang dibuktikan |
|---|---|---|---|
| 1 | `HR membuat karyawan + akun (email otomatis)` | TC-EMP-01 | FR-AUTH-01, FR-AUTH-06, FR-EMP-01..03, FR-EMP-12, FR-ADM-02, FR-ADM-04 |
| 2 | `ATT-07 token hilang/tidak valid => 401` | TC-AUTH-01 | FR-AUTH-00, FR-AUTH-04 |
| 3 | `ATT-03 OUT tanpa IN ditolak` | TC-ATT-03 | FR-ATT-04 |
| 4 | `GPS di luar radius & tanpa foto ditolak` | TC-ATT-06 | FR-ATT-08, FR-ATT-09, FR-ATT-10 |
| 5 | `ATT-01 IN pertama berhasil; ATT-02 IN kedua ditolak tanpa duplikasi` | TC-ATT-01, TC-ATT-02 | FR-ATT-02, FR-ATT-03, FR-ATT-07, FR-ATT-13 |
| 6 | `ATT-04 OUT berhasil; ATT-05 OUT kedua ditolak` | TC-ATT-04, TC-ATT-05 | FR-ATT-05, FR-ATT-06 |
| 7 | `ATT-06 employee tidak boleh lihat data orang lain` | TC-AUTH-07 | FR-AUTH-05, FR-HIS-02, FR-HIS-08 |
| 8 | `HR: filter tanggal, status, dashboard` | TC-HIS-10 | FR-HIS-03..07, FR-DSH-01..05 |
| 9 | `karyawan nonaktif tidak bisa login` | TC-AUTH-04 | FR-AUTH-03, FR-EMP-09, FR-ATT-12 |
| 10 | `HR menghapus karyawan, riwayatnya, dan tidak memakai ulang ID` | TC-EMP-14, TC-AUTH-03 | FR-EMP-07, FR-EMP-10, FR-AUTH-02 |

> Nama `ATT-01` … `ATT-07` pada kolom kedua adalah penanda di dalam berkas tes unit, **bukan** ID test case. ID test case selalu berawalan modul (`TC-ATT-01` dan seterusnya).

---

## 10. Ringkasan Prioritas

| Prioritas | Jumlah | Persentase |
|---|---|---|
| Must (M) | 49 | 77,8% |
| Should (S) | 12 | 19,0% |
| Could (C) | 2 | 3,2% |
| **Total** | **63** | 100% |

---

## 11. Status Implementasi

| Status | Jumlah | Keterangan |
|---|---|---|
| I — terimplementasi | 63 | Seluruh FR punya padanan kode |
| P — sebagian | 0 | — |
| G — gap | 0 | Gap tingkat fitur tidak ada |

**Catatan:** status "I" berarti fitur ada di kode, **bukan** berarti sudah diuji UAT formal. Bukti UAT belum tersedia (lihat §12).

---

## 12. Gap Analysis

| ID | Gap | Dampak | Usulan | Rujukan |
|---|---|---|---|---|
| GAP-01 | Struktur folder belum sesuai dokumen awal (`backend/`, `mobile/`) | Reviewer mungkin menganggap deliverable tidak lengkap | Dokumentasikan sebagai deviasi; atau restrukturisasi di luar scope build ini | `01-SRS.md` D-05 |
| GAP-02 | Aplikasi Mobile belum ada di repo | Fitur Employee hanya dapat diuji via API | Sediakan klien mobile atau bukti uji API | `README.md` baris 68 |
| GAP-03 | Bukti UAT belum ditandatangani | Klaim "siap demo" belum sah sebagai penerimaan pengguna | Hasil sudah terisi (14 Lulus, 1 Blocked); tanda tangan menunggu sesi UAT resmi | `11-UAT.md`, `docs/Project A - QA Test Cases.xlsx` |
| GAP-04 | Kode karyawan di `README.md` ditulis `EMP001`, implementasi `kyNN` | Kebingungan saat demo | Perbaiki README (di luar kewenangan build ini) | `README.md:25`, `app/Http/Controllers/Api/EmployeeController.php:44-50` |
| GAP-05 | Tidak ada pencatatan perubahan (`updated_at`) pada karyawan/office | Audit perubahan tidak dapat dilakukan | Tambah kolom bila diperlukan | `database/migrations/2014_10_12_000000_create_employees_table.php`, `database/migrations/2014_10_12_000001_create_users_table.php`, `database/migrations/2014_10_12_000002_create_offices_table.php` |
| GAP-06 | Tidak ada rate limit pada `POST /api/login` | Risiko brute force | Tambahkan pembatasan percobaan | `app/Http/Controllers/Api/AuthController.php` |
| GAP-07 | Foto disimpan di disk lokal tanpa enkripsi | Risiko kebocoran bila server diakses langsung | Pindahkan ke object storage privat | `app/Http/Controllers/Api/AttendanceController.php:38-121` |
| GAP-08 | Tidak ada endpoint hapus office | Office salah input hanya bisa dinonaktifkan | Tambahkan `DELETE` atau jelaskan sebagai keputusan | `routes/api.php:22-26` |
| GAP-09 | ~~Root repo memuat implementasi Laravel paralel di samping Node~~ **Ditutup 19 Nov 2026**: Node dihapus, hanya Laravel tersisa | Dulu dua titik masuk membingungkan | Acuan kini `php artisan serve` | `app/`, `routes/api.php`, `public/index.php` |
| GAP-10 | `README.md` menyebut 9 tes, aktual 5 metode/27 assertion | Laporan dapat salah mengutip cakupan | README ditulis ulang 19 Nov 2026 | `README.md`, `tests/Feature/WorkforceAttendanceTest.php` |

---

## 12.1 Keterbatasan yang Diakui

1. **Tidak ada shift malam.** `work_date` dihitung saat transaksi, sehingga OUT setelah tengah malam akan jatuh ke tanggal berikutnya dan ditolak `NOT_CHECKED_IN`. Ini sesuai batasan BR-01, bukan bug.
2. **Satu kantor per absensi.** `office_id` menyimpan office yang dipakai saat IN; OUT memakai validasi radius ke office terdekat saat itu.
3. **Tidak ada koreksi absensi.** Record yang salah tidak dapat diedit HR; hanya dihapus bersama karyawan.
4. **Ekspor CSV dibatasi** 25 halaman × 200 baris = 5.000 baris per unduhan.

---

## 13. Matriks FR × Use Case

| FR | UC |
|---|---|
| FR-AUTH-00..08 | UC-01, UC-02 |
| FR-EMP-01..05, 12 | UC-03 |
| FR-EMP-06, 07 | UC-04 |
| FR-EMP-08, 09 | UC-05 |
| FR-EMP-10 | UC-06 |
| FR-EMP-11 | UC-07 |
| FR-ADM-01..04 | UC-08 |
| FR-OFF-01..04 | UC-09 |
| FR-ATT-01 | UC-10 |
| FR-ATT-02..15 | UC-11, UC-12 |
| FR-HIS-01..08 | UC-13, UC-14, UC-15 |
| FR-HIS-09 | UC-16 |
| FR-DSH-01..05 | UC-17 |
| FR-WEB-01..05 | UC-01, UC-03, UC-04, UC-14, UC-17 |