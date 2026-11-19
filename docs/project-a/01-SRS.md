# Software Requirement Specification (SRS)
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi | 2.2 (build) |
| Tanggal | 19 November 2026 |
| Produk | Workforce Attendance System — Tim A |
| Acuan | `docs/ETHES_TECH Project.docx` (Bab 1, 3, 4, 5) · `README.md` · kode `app/` + `routes/api.php` · `database/` · Web `public/` · tes `tests/Feature/` |
| Folder | `docs/project-a/` |
| Status | Final draft untuk review mentor |

**Dokumen turunan:** `02` Use Case · `03` Activity · `04` ERD · `05` Flowchart · `06` Functional Requirement · `07` User Story · `08` Business Process.
**Work order & invarian:** `TASK.md`.

---

## 0. Aturan Utama: Semua Fitur Wajib Login (Auth Gate)

> **Tidak ada satu pun fitur yang dapat digunakan tanpa login terlebih dahulu.**

Pernyataan di atas bukan saran desain, melainkan perilaku yang sudah berjalan di kode dan menjadi invarian yang mengikat seluruh dokumen dalam paket ini.

### 0.1 Bukti Implementasi

| Lapisan | Berkas | Perilaku |
|---|---|---|
| Middleware | `app/Http/Middleware/JwtAuth.php:20-42` | Membaca header `Authorization: Bearer <token>`. Tidak ada token → `401 UNAUTHORIZED`. Token gagal diverifikasi → `401 UNAUTHORIZED`. User tidak ditemukan → `401`. |
| Middleware | `app/Http/Middleware/RequireRole.php:11-19` | `role:<peran>` → role tidak sesuai → `403 FORBIDDEN`. |
| Route HR | `routes/api.php:29-32`, `routes/api.php:35-42`, `routes/api.php:64-66` | Grup `role:HR` — seluruh route butuh login **dan** role HR. |
| Route absensi | `routes/api.php:45-60` | Grup `jwt.auth`; `role:EMPLOYEE` pada `today`, `check-in`, `check-out`; `role:HR` pada daftar absensi. |
| Route office | `routes/api.php:22-26` | `GET` terbuka untuk user login; POST/PUT di grup `role:HR`. |
| Web HR | `public/app.js:111` | Tanpa token tersimpan → `renderLogin()`; seluruh halaman lain tidak dirender. |
| Web HR | `public/app.js:24` | Respons `401` (selain `/login`) → `logout()`, kembali ke layar Login. |
| Web HR | `public/app.js:100,112` | Akun dengan role bukan `HR` ditolak di Web: "Akun ini bukan HR. Karyawan login lewat aplikasi mobile." |
| Web HR | `public/app.js:56-59` | Tombol "Keluar" menghapus token, menghentikan timer, menutup modal, menampilkan Login. |

> **Catatan (19 Nov 2026):** repo kini hanya memuat **satu** implementasi, yaitu Laravel 10
> (`app/`, `routes/api.php`). Implementasi Node yang menjadi baseline pengujian 18 Nov 2026
> sudah dihapus; seluruh rujukan baris di tabel di atas sudah dipetakan ke kode Laravel.
> Alias middleware didaftarkan di `app/Http/Kernel.php:66-67`.

### 0.2 Satu-satunya Pengecualian

| Endpoint / Aset | Status | Tanpa token |
|---|---|---|
| `POST /api/login` | Publik | Bisa dipanggil; 400 `VALIDATION` bila field kosong, 401 `INVALID_CREDENTIALS` bila salah |
| `GET /health` | Publik | `200 { "ok": true }` |
| Aset statis Web (`/index.html`, `/app.js`, `/app.css`, favicon) | Publik (kerangka UI) | Boleh dimuat, tetapi **tidak ada data** yang tampil; layar Login yang dirender |
| Semua endpoint `/api/**` lainnya | **Terproteksi** | `401 UNAUTHORIZED` |

Endpoint foto `GET /api/attendance/:id/photo/:type` **bukan** pengecualian: tetap memerlukan token, dan role `EMPLOYEE` hanya boleh mengakses foto miliknya (`app/Http/Controllers/Api/AttendanceController.php:373-397`).

### 0.3 Konsekuensi pada Seluruh Dokumen

1. Setiap use case memiliki **prakondisi "sudah login"** — kecuali UC-01 (login itu sendiri).
2. Setiap activity diagram dimulai dengan pemeriksaan token / layar Login.
3. Setiap user story memakai *Given* "saya sudah login" — kecuali story login.
4. Setiap endpoint pada §7.1 memiliki kolom peran; tidak ada kolom "publik" selain §0.2.
5. Business process menempatkan login sebagai langkah pertama, dan `401` sebagai exception yang mengembalikan pengguna ke Login.

---

## 1. Pendahuluan

### 1.1 Tujuan
Menetapkan kebutuhan perangkat lunak **Workforce Attendance System** secara lengkap dan dapat diuji, sebagai baseline bagi engineering, QA, dan mentor.

### 1.2 Ruang Lingkup
Sistem mencatat kehadiran harian karyawan dengan dua antarmuka:

| Antarmuka | Pengguna | Sumber di repo |
|---|---|---|
| **Web HR** | HR Admin | `public/index.html`, `public/app.js`, `public/app.css` (vanilla JS, tanpa build) |
| **Mobile Employee** | Employee | **Belum ada proyek mobile di repo ini.** Mobile diperlakukan sebagai klien REST API (lihat `README.md` baris 68). |

Fitur dalam ruang lingkup:

1. Autentikasi JWT + otorisasi berbasis peran.
2. Manajemen karyawan (CRUD, reset password, pembuatan akun otomatis).
3. Manajemen akun HR Admin.
4. Manajemen lokasi office + radius geofence.
5. Absensi harian: satu pasang IN/OUT per tanggal kerja.
6. Status ketepatan waktu dari jam server `Asia/Jakarta`.
7. Riwayat kehadiran dengan filter, pencarian, urutan, paginasi.
8. Dashboard ringkasan harian + tren 7 hari.
9. Verifikasi foto kamera + koordinat GPS + radius office.
10. Ekspor CSV daftar absensi.

**Di luar ruang lingkup (tidak ada di kode, tidak dikerjakan):** shift malam, lembur, cuti/izin, approval, payroll, notifikasi push, ekspor PDF, deployment produksi, biometrik.

### 1.3 Definisi

| Istilah | Definisi |
|---|---|
| **IN / Check-in** | Pencatatan kedatangan pada tanggal kerja |
| **OUT / Check-out** | Pencatatan kepulangan pada tanggal kerja yang sama |
| **work_date** | Tanggal kerja `YYYY-MM-DD` pada zona `Asia/Jakarta` |
| **TEPAT_WAKTU** | Check-in pada atau sebelum 08:15 WIB |
| **TERLAMBAT** | Check-in setelah 08:15 WIB |
| **BELUM_IN** | Status turunan: karyawan aktif tanpa record absensi pada tanggal tersebut |
| **BELUM_OUT** | Status turunan: sudah IN, `check_out_at` masih NULL |
| **SUDAH_OUT** | Status turunan: `check_out_at` terisi |
| **Office** | Lokasi kerja dengan koordinat + radius (meter) |
| **Geofence** | Batas radius; absensi di luar radius ditolak |
| **JWT** | Token bearer pada header `Authorization` |
| **Auth Gate** | Kewajiban login sebelum mengakses fitur apa pun (§0) |

### 1.4 Referensi

| Kode | Referensi |
|---|---|
| REF-01 | `docs/ETHES_TECH Project.docx` — Project A + business rules ATT-01..ATT-08 |
| REF-02 | `README.md` — kontrak endpoint & aturan bisnis |
| REF-03 | `database/migrations/` — skema basis data |
| REF-04 | `tests/Feature/WorkforceAttendanceTest.php` — tes otomatis |
| REF-05 | `public/app.js` — antarmuka Web HR |
| REF-06 | `TASK.md` — work order & invarian |

---

## 2. Deskripsi Umum

### 2.1 Perspektif Produk

```mermaid
flowchart TB
    WEB["Web HR (public/)"]
    MOB["Mobile Employee"]

    subgraph PUB["Tanpa login (publik)"]
        LG["POST /api/login"]
        HC["GET /health"]
    end

    ST["Aset statis<br/>index.html · app.js · app.css"]

    subgraph GATE["AUTH GATE — wajib token"]
        MW["middleware jwt.auth<br/>token tidak valid → 401"]
        RG["middleware role<br/>peran salah → 403"]
    end

    E1["/api/me · /api/offices · /api/attendance/*"]
    E2["/api/employees · /api/admins · /api/dashboard<br/>(khusus HR)"]
    DB[("SQLite: users · employees · offices<br/>attendances · hr_code_sequence")]
    DENY["Permintaan ditolak<br/>klien kembali ke Login"]:::err

    WEB --> LG
    MOB --> LG
    WEB -. "aset" .-> ST
    LG -- "token" --> MW
    MW --> RG
    RG --> E1
    RG --> E2
    E1 --> DB
    E2 --> DB
    RG -. "401 / 403" .-> DENY

    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef cli fill:#f8fafc,stroke:#475569,color:#1e293b,stroke-width:1.5px;
    class WEB,MOB cli;
    style PUB fill:#f0fdf4,stroke:#16a34a
    style GATE fill:#fffbeb,stroke:#d97706
    style DENY fill:#fef2f2
```

> **Baca diagram:** hanya kotak hijau yang dapat diakses tanpa token. Semua permintaan lain melewati kotak kuning (`jwt.auth` → `role`) sebelum mencapai endpoint. Jalur putus-putus ke kotak merah adalah akhir alur untuk token/peran yang tidak sah.

Web HR disajikan sebagai berkas statis dari `public/` oleh server yang sama (`routes/web.php:14-20`), tanpa proses build.

### 2.2 Aktor

| Aktor | Jumlah | Antarmuka | Hak Akses |
|---|---|---|---|
| **HR Admin** (`role = HR`) | 1–5 | Web HR | Seluruh fitur HR: karyawan, admin, office, absensi, dashboard |
| **Employee** (`role = EMPLOYEE`) | ±100 | Mobile (klien API) | Status hari ini, IN, OUT, riwayat sendiri, foto sendiri, profil |

Tidak ada aktor ketiga. Tidak ada akses anonim ke data apa pun.

### 2.3 Fungsi Utama

| No | Fungsi | Aktor | Wajib Login |
|---|---|---|---|
| F-01 | Login & mengelola sesi | Semua | — (gerbangnya sendiri) |
| F-02 | Melihat profil sendiri | Semua | ✔ |
| F-03 | Menambah karyawan + akun | HR | ✔ |
| F-04 | Melihat/mencari karyawan | HR | ✔ |
| F-05 | Mengubah karyawan / menonaktifkan | HR | ✔ |
| F-06 | Menghapus karyawan | HR | ✔ |
| F-07 | Reset password karyawan | HR | ✔ |
| F-08 | Mengelola akun HR | HR | ✔ |
| F-09 | Mengelola office + radius | HR (Employee: lihat) | ✔ |
| F-10 | Melihat status hari ini | Employee | ✔ |
| F-11 | Check-in | Employee | ✔ |
| F-12 | Check-out | Employee | ✔ |
| F-13 | Riwayat kehadiran sendiri | Employee | ✔ |
| F-14 | Daftar & filter absensi | HR | ✔ |
| F-15 | Lihat foto bukti | HR, Employee (sendiri) | ✔ |
| F-16 | Ekspor CSV | HR | ✔ |
| F-17 | Dashboard + tren | HR | ✔ |

### 2.4 Batasan Umum

| Kode | Batasan |
|---|---|
| BR-01 | Satu pasang IN/OUT per karyawan per tanggal kerja; shift malam di luar scope |
| BR-02 | Waktu memakai jam server, bukan jam perangkat |
| BR-03 | Zona tunggal `Asia/Jakarta` (`app/Services/TimeService.php:10`) |
| BR-04 | Jam masuk 08:00, toleransi 15 menit (`app/Services/TimeService.php:11-12`) |
| BR-05 | Employee tidak boleh mengakses data karyawan lain |
| BR-06 | Token hilang/tidak valid → 401; klien kembali ke login |
| BR-07 | Kegagalan request/timeout tidak boleh tampil sebagai sukses |
| BR-08 | Kredensial demo bukan untuk produksi; `.env` tidak di-commit |
| BR-09 | Foto wajib, JPEG/PNG/WEBP, maks 5 MB (`app/Http/Controllers/Api/AttendanceController.php:38-109`) |
| BR-10 | Koordinat wajib valid: `abs(lat) ≤ 90`, `abs(lng) ≤ 180` (`app/Services/GeoService.php:22-25`) |
| BR-11 | Absensi harus di dalam radius salah satu office aktif |
| BR-12 | Karyawan `INACTIVE` tidak boleh login maupun absensi |

### 2.5 Asumsi dan Ketergantungan

| Kode | Asumsi |
|---|---|
| AS-01 | Perangkat karyawan memiliki GPS & kamera serta izin diberikan |
| AS-02 | Koneksi internet tersedia saat IN/OUT |
| AS-03 | Minimal satu office aktif terdaftar sebelum absensi |
| AS-04 | Data karyawan diinput HR melalui Web |
| AS-05 | Server dapat dikonversi ke zona `Asia/Jakarta` |

---

## 3. Kebutuhan Fungsional

Prioritas: **M** = Must, **S** = Should, **C** = Could. Rujukan kode disertakan agar dapat diverifikasi.

### 3.1 Modul AUTH

| ID | Kebutuhan | Prioritas | Rujukan |
|---|---|---|---|
| **FR-AUTH-00** | **Sistem wajib menolak seluruh akses fitur sebelum login.** Semua endpoint `/api/**` kecuali `POST /api/login` memerlukan bearer token valid; tanpa token → `401 UNAUTHORIZED`; role tidak sesuai → `403 FORBIDDEN`. | M | `app/Http/Middleware/JwtAuth.php`, `routes/api.php:18` |
| FR-AUTH-01 | Login `email` + `password` → `token`, `role`, `user`. | M | `app/Http/Controllers/Api/AuthController.php:22-58` |
| FR-AUTH-02 | Kredensial salah → `401 INVALID_CREDENTIALS`. | M | `app/Http/Controllers/Api/AuthController.php:35-37` |
| FR-AUTH-03 | Karyawan `INACTIVE` tidak bisa login → `403 ACCOUNT_INACTIVE`. | M | `app/Http/Controllers/Api/AuthController.php:39-41` |
| FR-AUTH-04 | Token divalidasi tiap request; tidak ada/tidak valid/kedaluwarsa → `401 UNAUTHORIZED`. | M | `app/Http/Middleware/JwtAuth.php:20-42` |
| FR-AUTH-05 | Otorisasi per peran pada setiap endpoint. | M | `middleware('role:...')` di `routes/api.php`, `app/Http/Middleware/RequireRole.php:11-19` |
| FR-AUTH-06 | `GET /api/me` mengembalikan profil + data karyawan terkait. | M | `app/Http/Controllers/Api/AuthController.php:60-82` |
| FR-AUTH-07 | Token ditandatangani secret server, masa berlaku default `12h`. | M | `app/Services/JwtService.php:10-15`, `app/Http/Controllers/Api/AuthController.php:43-46` |
| FR-AUTH-08 | Klien menghapus token dan kembali ke Login saat menerima 401. | M | `public/app.js:24,56-60` |

**Kriteria penerimaan FR-AUTH-00**

```gherkin
Scenario: Akses endpoint tanpa token ditolak
  Given saya belum login dan tidak memiliki token
  When saya memanggil GET /api/attendance/today
  Then sistem mengembalikan HTTP 401 dengan code "UNAUTHORIZED"

Scenario: Akses fitur HR dengan role Employee ditolak
  Given saya login sebagai Employee
  When saya memanggil GET /api/dashboard/attendance
  Then sistem mengembalikan HTTP 403 dengan code "FORBIDDEN"

Scenario: Web HR tidak menampilkan data sebelum login
  Given tidak ada token di penyimpanan browser
  When saya membuka halaman utama Web HR
  Then yang tampil hanya layar Login
  And tidak ada permintaan data yang mengembalikan isi
```

### 3.2 Modul EMP

| ID | Kebutuhan | Prioritas | Rujukan |
|---|---|---|---|
| FR-EMP-01 | Tambah karyawan dengan `name` saja; kode otomatis `kyNN`. | M | `app/Http/Controllers/Api/EmployeeController.php:41-51`, `app/Http/Controllers/Api/EmployeeController.php:130-186` |
| FR-EMP-02 | Email otomatis `nama.depan@ethes.tech`; bentrok diberi sufiks angka. | S | `app/Http/Controllers/Api/EmployeeController.php:18-39` |
| FR-EMP-03 | Akun login dibuat bersamaan; password acak 12 karakter ditampilkan **sekali**. | M | `app/Http/Controllers/Api/EmployeeController.php:144-148`, `app/Http/Controllers/Api/EmployeeController.php:182-185` |
| FR-EMP-04 | `employee_code`, `email`, `password` boleh diisi manual; password ≥ 8. | S | `app/Http/Controllers/Api/EmployeeController.php:137-148` |
| FR-EMP-05 | Kode duplikat → `409 DUPLICATE_CODE`; email duplikat → `409 DUPLICATE_EMAIL`. | M | `app/Http/Controllers/Api/EmployeeController.php:150-156` |
| FR-EMP-06 | Daftar karyawan: `search`, `status`, `page`, `limit` (maks 200). | M | `app/Http/Controllers/Api/EmployeeController.php:71-118` |
| FR-EMP-07 | Detail karyawan per ID; tidak ada → `404 NOT_FOUND`. | M | `app/Http/Controllers/Api/EmployeeController.php:120-128` |
| FR-EMP-08 | Ubah `name`, `employee_code`, `status`, `email`, `password`. | M | `app/Http/Controllers/Api/EmployeeController.php:188-248` |
| FR-EMP-09 | Nonaktifkan karyawan → tidak bisa login & absensi. | M | `app/Http/Controllers/Api/EmployeeController.php:188-248`, `app/Http/Controllers/Api/AuthController.php:39-41` |
| FR-EMP-10 | Hapus karyawan → akun, riwayat, dan foto ikut terhapus. | S | `app/Http/Controllers/Api/EmployeeController.php:250-289` |
| FR-EMP-11 | Reset password → password acak baru, tampil sekali. | S | `app/Http/Controllers/Api/EmployeeController.php:291-310` |
| FR-EMP-12 | Pembuatan karyawan + akun dalam satu transaksi. | M | `app/Http/Controllers/Api/EmployeeController.php:158-180` |

### 3.3 Modul ADM

| ID | Kebutuhan | Prioritas | Rujukan |
|---|---|---|---|
| FR-ADM-01 | Daftar akun HR dengan `search` + paginasi. | S | `app/Http/Controllers/Api/AdminController.php:40-77` |
| FR-ADM-02 | Tambah akun HR; `account_code` otomatis `HRNN`. | S | `app/Http/Controllers/Api/AdminController.php:79-131`, `app/Services/HrCodeService.php` |
| FR-ADM-03 | Email akun HR duplikat → `409 DUPLICATE_EMAIL`. | M | `app/Http/Controllers/Api/AdminController.php:102-105` |
| FR-ADM-04 | Akun HR baru langsung bisa login dan mengakses fitur HR. | M | `app/Http/Controllers/Api/AdminController.php:100-131`, `app/Http/Controllers/Api/AttendanceController.php:139-177` |

### 3.4 Modul OFF

| ID | Kebutuhan | Prioritas | Rujukan |
|---|---|---|---|
| FR-OFF-01 | Semua pengguna login dapat melihat office aktif. | M | `app/Http/Controllers/Api/OfficeController.php:41-45` |
| FR-OFF-02 | HR dapat menambah office; `name` wajib, koordinat valid, radius 10–5000 m. | M | `app/Http/Controllers/Api/OfficeController.php:14-52` |
| FR-OFF-03 | HR dapat mengubah office, termasuk `is_active`. | M | `app/Http/Controllers/Api/OfficeController.php:54-66` |
| FR-OFF-04 | Seed awal menyediakan satu office aktif. | M | `database/seeders/OfficeSeeder.php:17-31` |

### 3.5 Modul ATT

| ID | Kebutuhan | Prioritas | Rujukan |
|---|---|---|---|
| FR-ATT-01 | `GET /api/attendance/today` → `state` (`BELUM_IN`/`SUDAH_IN`/`SUDAH_OUT`), `can_check_in`, `can_check_out`, aturan jam, daftar office. | M | `app/Http/Controllers/Api/AttendanceController.php:122-148` |
| FR-ATT-02 | IN pertama tersimpan (`check_in_at`, status, office, koordinat, jarak, foto). | M | `app/Http/Controllers/Api/AttendanceController.php:150-187` |
| FR-ATT-03 | IN kedua → `409 ALREADY_CHECKED_IN` tanpa duplikasi. | M | `app/Http/Controllers/Api/AttendanceController.php:155-157`, `app/Http/Controllers/Api/AttendanceController.php:179-181` |
| FR-ATT-04 | OUT tanpa IN → `409 NOT_CHECKED_IN`. | M | `app/Http/Controllers/Api/AttendanceController.php:194-197` |
| FR-ATT-05 | OUT setelah IN dan belum OUT berhasil. | M | `app/Http/Controllers/Api/AttendanceController.php:202-210` |
| FR-ATT-06 | OUT kedua → `409 ALREADY_CHECKED_OUT`. | M | `app/Http/Controllers/Api/AttendanceController.php:198-200` |
| FR-ATT-07 | Status `TEPAT_WAKTU` bila ≤ 08:15, `TERLAMBAT` bila > 08:15, dari jam server. | M | `app/Services/TimeService.php:38-47` |
| FR-ATT-08 | Foto wajib → `400 PHOTO_REQUIRED` bila tidak ada. | M | `app/Http/Controllers/Api/AttendanceController.php:40-42` |
| FR-ATT-09 | Koordinat wajib & valid → `400 GPS_REQUIRED`. | M | `app/Http/Controllers/Api/AttendanceController.php:60-65` |
| FR-ATT-10 | Di luar radius → `403 OUTSIDE_RADIUS` + `{office, distance_m, radius_m}`. | M | `app/Http/Controllers/Api/AttendanceController.php:70-98` |
| FR-ATT-11 | Tidak ada office aktif → `409 NO_OFFICE`. | M | `app/Http/Controllers/Api/AttendanceController.php:70-73` |
| FR-ATT-12 | Karyawan `INACTIVE` ditolak → `403 ACCOUNT_INACTIVE`. | M | `app/Http/Controllers/Api/AttendanceController.php:23-36` |
| FR-ATT-13 | Keunikan `(employee_id, work_date)` di level database. | M | `database/migrations/2014_10_12_000003_create_attendances_table.php:29` |
| FR-ATT-14 | Foto yang sudah terunggah dihapus bila request ditolak. | S | `app/Http/Controllers/Api/AttendanceController.php:159`, `app/Http/Controllers/Api/AttendanceController.php:173-183` |
| FR-ATT-15 | Foto > 5 MB atau tipe tidak didukung → `400 INVALID_PHOTO`. | S | `app/Http/Controllers/Api/AttendanceController.php:49-58`, `app/Exceptions/Handler.php:52-64` |

### 3.6 Modul HIS

| ID | Kebutuhan | Prioritas | Rujukan |
|---|---|---|---|
| FR-HIS-01 | Employee melihat riwayat sendiri; default `this_month`. | M | `app/Http/Controllers/Api/AttendanceController.php:366-377` |
| FR-HIS-02 | Employee meminta data karyawan lain → `403 FORBIDDEN`. | M | `app/Http/Controllers/Api/AttendanceController.php:369-372` |
| FR-HIS-03 | HR melihat semua absensi; default `today`. | M | `routes/api.php:60` |
| FR-HIS-04 | Prioritas filter `date` > `from`+`to` > `preset` > default. | M | `app/Http/Controllers/Api/AttendanceController.php:216-249` |
| FR-HIS-05 | Validasi tanggal: format, `from ≤ to`, maks 366 hari. | M | `app/Http/Controllers/Api/AttendanceController.php:233-246` |
| FR-HIS-06 | Filter status `TEPAT_WAKTU`, `TERLAMBAT`, `BELUM_OUT`, `SUDAH_OUT`, `BELUM_IN`. | M | `app/Http/Controllers/Api/AttendanceController.php:20`, `app/Http/Controllers/Api/AttendanceController.php:251-364` |
| FR-HIS-07 | Filter `employee_id`, `search`, `sort`, paginasi. | S | `app/Http/Controllers/Api/AttendanceController.php:251-364` |
| FR-HIS-08 | Foto IN/OUT via endpoint terproteksi; Employee hanya foto sendiri. | S | `app/Http/Controllers/Api/AttendanceController.php:384-407` |
| FR-HIS-09 | Ekspor CSV sesuai filter aktif (maks 25 halaman × 200 baris). | C | `public/app.js:287-300` |

### 3.7 Modul DSH

| ID | Kebutuhan | Prioritas | Rujukan |
|---|---|---|---|
| FR-DSH-01 | Ringkasan harian: total aktif, sudah IN, tepat waktu, terlambat, belum OUT, sudah OUT, belum IN. | M | `app/Http/Controllers/Api/DashboardController.php:23-48` |
| FR-DSH-02 | Daftar terlambat, belum OUT, belum IN. | M | `app/Http/Controllers/Api/DashboardController.php:50-83` |
| FR-DSH-03 | Tren 7 hari (sudah IN & terlambat). | S | `app/Http/Controllers/Api/DashboardController.php:85-100` |
| FR-DSH-04 | `date` wajib `YYYY-MM-DD`, selain itu `400 VALIDATION`. | M | `app/Http/Controllers/Api/DashboardController.php:18-21` |
| FR-DSH-05 | Angka dashboard konsisten dengan daftar absensi tanggal yang sama. | M | `app/Http/Controllers/Api/DashboardController.php:25-33` vs `app/Http/Controllers/Api/AttendanceController.php:323-351` |

### 3.8 Modul WEB

| ID | Kebutuhan | Prioritas | Rujukan |
|---|---|---|---|
| FR-WEB-01 | Web HR disajikan tanpa build dari `public/`. | M | `routes/web.php:13-19`, `public/index.html` |
| FR-WEB-02 | Navigasi hash: `#/dashboard`, `#/absensi`, `#/karyawan`, `#/office`. | M | `public/app.js:107,144-151` |
| FR-WEB-03 | Dialog kredensial (kode, email, password) + tombol salin. | S | `public/app.js:445-453` |
| FR-WEB-04 | Toast sukses/error untuk setiap aksi. | C | `public/app.js:33-36` |
| FR-WEB-05 | Web HR hanya menerima akun `HR`; akun lain ditolak dengan pesan. | M | `public/app.js:100,112` |

---

## 4. Kebutuhan Non-Fungsional

| ID | Kategori | Kebutuhan | Target |
|---|---|---|---|
| NFR-01 | Performance | Endpoint baca pada 100 karyawan | ≤ 500 ms p95 |
| NFR-02 | Performance | IN/OUT termasuk unggah foto | ≤ 2 s p95 |
| NFR-03 | Concurrency | IN bersamaan untuk karyawan & tanggal sama | Tepat satu 201, sisanya 409 |
| NFR-04 | Security | Password disimpan sebagai hash bcrypt cost 10 | Tidak ada plaintext di DB/log |
| NFR-05 | Security | **Semua endpoint selain §0.2 terproteksi** | 100% diuji |
| NFR-06 | Security | Foto hanya untuk pemilik atau HR | 403 untuk pihak lain |
| NFR-07 | Security | Secret & kredensial tidak di-commit | `.env` di `.gitignore` |
| NFR-08 | Reliability | Tidak ada sukses palsu | UI error, data tidak berubah |
| NFR-09 | Consistency | Satu record per `(employee_id, work_date)` | Unique constraint aktif |
| NFR-10 | Usability | Loading, error, empty state di setiap layar data | Ketiganya ada |
| NFR-11 | Usability | Alur inti ≤ 3 klik dari menu | Diverifikasi manual |
| NFR-12 | Maintainability | Pemisahan route/middleware/util | Struktur konsisten |
| NFR-13 | Portability | PHP 8.1+ tanpa native build | `composer install` lalu `php artisan serve` sukses |
| NFR-14 | Observability | Error 5xx tercatat di log | `app/Exceptions/Handler.php:23-66` |
| NFR-15 | Testability | ATT-01..07 tercakup tes otomatis | `php artisan test` lulus |
| NFR-16 | Localization | Bahasa antarmuka & pesan error | Bahasa Indonesia |
| NFR-17 | Time Integrity | Zona `Asia/Jakarta` terpusat | `app/Services/TimeService.php:10-12` |

---

## 5. Aturan Bisnis

| Kode | Aturan | Perilaku | HTTP | Error Code |
|---|---|---|---|---|
| ATT-01 | IN pertama pada tanggal kerja | Check-in disimpan | 201 | — |
| ATT-02 | IN kedua pada tanggal yang sama | Ditolak tanpa duplikasi | 409 | `ALREADY_CHECKED_IN` |
| ATT-03 | OUT tanpa IN | Ditolak | 409 | `NOT_CHECKED_IN` |
| ATT-04 | OUT setelah IN dan belum OUT | Check-out disimpan | 200 | — |
| ATT-05 | OUT kedua | Ditolak | 409 | `ALREADY_CHECKED_OUT` |
| ATT-06 | Employee melihat data orang lain | Tidak diizinkan | 403 | `FORBIDDEN` |
| ATT-07 | Token hilang/tidak valid | Kembali ke login | 401 | `UNAUTHORIZED` |
| ATT-08 | Request gagal/timeout | Error, tidak sukses palsu | — | — |
| BR-04 | > 08:15 WIB | `TERLAMBAT` | — | — |
| BR-09 | Foto tidak ada / tidak valid | Ditolak | 400 | `PHOTO_REQUIRED` / `INVALID_PHOTO` |
| BR-10 | GPS tidak ada / tidak valid | Ditolak | 400 | `GPS_REQUIRED` |
| BR-11 | Di luar radius office | Ditolak + info jarak | 403 | `OUTSIDE_RADIUS` |
| BR-12 | Karyawan nonaktif | Login & absensi ditolak | 403 | `ACCOUNT_INACTIVE` |
| BR-13 | Tidak ada office aktif | Absensi ditolak | 409 | `NO_OFFICE` |

---

## 6. Kebutuhan Data

| Entitas | Deskripsi | Kunci Unik |
|---|---|---|
| `employees` | Data induk karyawan | `employee_code` |
| `users` | Akun login (HR & Employee) | `email`, `account_code` (index unik) |
| `offices` | Lokasi kerja + radius | — |
| `attendances` | Transaksi absensi harian | `(employee_id, work_date)` |
| `hr_code_sequence` | Counter nomor akun HR | `id = 1` |

Integritas: `attendances.employee_id` → `employees.id` `ON DELETE CASCADE`; `users.employee_id` → `employees.id` `ON DELETE SET NULL`; `attendances.office_id` → `offices.id` `ON DELETE SET NULL` (`database/migrations/2014_10_12_000001_create_users_table.php:16`, `..._000003_create_attendances_table.php:15,20`). Foreign key SQLite diaktifkan lewat `foreign_key_constraints` (`config/database.php:43`, default `true`); mode jurnal memakai bawaan SQLite (`delete`), bukan WAL. Detail pada `04-ERD.md`.

---

## 7. Kebutuhan Antarmuka Eksternal

### 7.1 Kontrak API

Seluruh endpoint di bawah `/api` memerlukan header `Authorization: Bearer <token>`, kecuali yang ditandai **Publik**.

| # | Method | Path | Peran | Akses | Ringkasan |
|---|---|---|---|---|---|
| 1 | POST | `/api/login` | Publik | Tanpa token | Autentikasi, terbitkan token |
| 2 | GET | `/api/me` | HR, Employee | Login | Profil pengguna |
| 3 | GET | `/api/admins` | HR | Login + HR | Daftar akun HR |
| 4 | POST | `/api/admins` | HR | Login + HR | Tambah akun HR |
| 5 | GET | `/api/employees` | HR | Login + HR | Daftar karyawan + filter |
| 6 | GET | `/api/employees/:id` | HR | Login + HR | Detail karyawan |
| 7 | POST | `/api/employees` | HR | Login + HR | Tambah karyawan + akun |
| 8 | PUT | `/api/employees/:id` | HR | Login + HR | Ubah karyawan |
| 9 | DELETE | `/api/employees/:id` | HR | Login + HR | Hapus karyawan + data terkait |
| 10 | POST | `/api/employees/:id/reset-password` | HR | Login + HR | Reset password |
| 11 | GET | `/api/offices` | HR, Employee | Login | Daftar office aktif |
| 12 | POST | `/api/offices` | HR | Login + HR | Tambah office |
| 13 | PUT | `/api/offices/:id` | HR | Login + HR | Ubah office |
| 14 | GET | `/api/attendance/today` | Employee | Login + Employee | Status hari ini |
| 15 | POST | `/api/attendance/check-in` | Employee | Login + Employee | IN (multipart) |
| 16 | POST | `/api/attendance/check-out` | Employee | Login + Employee | OUT (multipart) |
| 17 | GET | `/api/attendance/history` | Employee, HR | Login | Riwayat (Employee: sendiri) |
| 18 | GET | `/api/attendance` | HR | Login + HR | Daftar absensi semua |
| 19 | GET | `/api/attendance/:id/photo/:type` | Pemilik, HR | Login | Foto `in`/`out` |
| 20 | GET | `/api/dashboard/attendance` | HR | Login + HR | Ringkasan + tren 7 hari |
| — | GET | `/health` | Publik | Tanpa token | Health check |

**Jumlah:** 20 endpoint API — 1 publik (login), 19 terproteksi.

### 7.2 Format Respons

Sukses (tunggal):
```json
{ "id": 1, "work_date": "2026-11-18", "status": "TEPAT_WAKTU" }
```

Sukses (daftar):
```json
{ "data": [], "meta": { "page": 1, "limit": 20, "total": 0, "total_pages": 0, "from": "2026-11-18", "to": "2026-11-18" } }
```

Gagal (`app/Exceptions/Handler.php:23-66`):
```json
{ "error": { "code": "ALREADY_CHECKED_IN", "message": "Anda sudah IN hari ini" } }
```

### 7.3 Kode Status HTTP

| Status | Penggunaan |
|---|---|
| 200 | Berhasil |
| 201 | Resource dibuat |
| 400 | Input/berkas tidak valid |
| 401 | Belum login, token tidak valid/kedaluwarsa |
| 403 | Tidak berhak / di luar radius / akun nonaktif |
| 404 | Resource tidak ditemukan |
| 409 | Konflik aturan bisnis / duplikasi |
| 500 | Kesalahan server |

> **Catatan (D-11):** docx menyarankan `422` untuk input tidak valid; implementasi konsisten memakai **`400`** dengan `error.code = VALIDATION` / `PHOTO_REQUIRED` / `GPS_REQUIRED`. `409` dipakai untuk konflik aturan bisnis, sesuai docx.

### 7.4 Antarmuka Pengguna

**Web HR** (`public/`): Login (khusus HR) · Dashboard · Absensi · Karyawan (tab Karyawan/Admin) · Office. Semua halaman setelah Login berada di balik Auth Gate.

**Mobile Employee** (klien API, belum ada di repo): Login · Beranda (status + tombol IN/OUT) · Kamera/konfirmasi · Riwayat · Profil.

---

## 8. Traceability

| Sumber | Kebutuhan | FR | UC | Tes |
|---|---|---|---|---|
| — | Semua fitur wajib login | FR-AUTH-00, FR-AUTH-04, FR-AUTH-05 | UC-01, UC-02 | TC-AUTH-01, TC-EMP-01 |
| ATT-01 | IN pertama berhasil | FR-ATT-02, FR-ATT-07 | UC-11 | TC-ATT-01 |
| ATT-02 | IN kedua ditolak | FR-ATT-03, FR-ATT-13 | UC-11 | TC-ATT-02 |
| ATT-03 | OUT tanpa IN ditolak | FR-ATT-04 | UC-12 | TC-ATT-03 |
| ATT-04 | OUT setelah IN berhasil | FR-ATT-05 | UC-12 | TC-ATT-04 |
| ATT-05 | OUT kedua ditolak | FR-ATT-06 | UC-12 | TC-ATT-05 |
| ATT-06 | Data orang lain ditolak | FR-HIS-02, FR-AUTH-05 | UC-13 | TC-AUTH-07 |
| ATT-07 | Token tidak valid → 401 | FR-AUTH-04, FR-AUTH-08 | UC-01 | TC-AUTH-01 |
| ATT-08 | Tidak ada sukses palsu | NFR-08 | UC-11, UC-12 | TC-AUTH-09, TC-WEB-02 |
| Demo 1.5 | HR tambah karyawan | FR-EMP-01..03 | UC-03 | TC-EMP-01, TC-EMP-02 |
| Demo 1.5 | Riwayat & dashboard konsisten | FR-DSH-05 | UC-17 | TC-HIS-10, TC-DSH-02 |

---

## 9. Kriteria Penerimaan (UAT)

| ID | Skenario | Hasil yang Diharapkan |
|---|---|---|
| UAT-01 | Akses dashboard tanpa login | Ditolak 401 / hanya layar Login tampil |
| UAT-02 | HR menambah karyawan lewat Web | Muncul di daftar; kode & email otomatis; password awal tampil sekali |
| UAT-03 | Karyawan login lalu IN | Status `SUDAH_IN`; record menyimpan foto, koordinat, jarak |
| UAT-04 | Karyawan mencoba IN kedua | Pesan "sudah IN"; tidak ada record baru |
| UAT-05 | Karyawan OUT | Status `SUDAH_OUT`; `check_out_at` terisi |
| UAT-06 | Karyawan mencoba OUT kedua | Pesan "sudah OUT"; data tidak berubah |
| UAT-07 | HR membuka Dashboard | Angka sudah IN/terlambat/belum OUT sesuai daftar absensi |
| UAT-08 | Karyawan membuka riwayat | Hanya data sendiri; sama dengan dashboard HR |
| UAT-09 | Absensi di luar radius | Ditolak dengan pesan jarak & radius |
| UAT-10 | Token kedaluwarsa | Klien kembali ke Login |
| UAT-11 | Server/jaringan gagal saat IN | Tampil error; tidak ada status sukses |
| UAT-12 | Web HR dengan akun Employee | Ditolak: "Akun ini bukan HR…" |
| UAT-13 | HR mengelola office & radius | Office tersimpan; radius di luar 10–5000 m ditolak; office nonaktif hilang dari daftar |
| UAT-14 | HR menambah akun HR | `account_code` berikutnya (`HR02`); akun baru dapat login dan membuka Dashboard |
| UAT-15 | HR mengunduh CSV | Berkas terunduh dengan kolom lengkap dan baris sesuai filter |

---

## 10. Catatan Deviasi Dokumen Awal vs Implementasi

| No | Dokumen Awal | Implementasi | Status |
|---|---|---|---|
| D-01 | MySQL + migrations + seeder framework | SQLite + migrasi Laravel (`database/migrations/`) dan seeder (`database/seeders/`) | Perbedaan teknis; constraint setara |
| D-02 | GPS, kamera, geofencing di *scope tidak wajib* | Diimplementasikan (foto + radius) | Fitur tambahan |
| D-03 | Endpoint `GET/POST/PUT /api/employees` | Ditambah `DELETE`, `reset-password`, `/api/admins` | Perlu pembaruan API contract |
| D-04 | Format respons `{success, message, data, error}` | `{data, meta}` / `{error:{code,message}}` | Perbedaan kontrak |
| D-05 | Struktur `backend/`, `mobile/`, `docs/` | Backend di `app/` + `routes/api.php`, Web di `public/`, **mobile belum ada** | Gap struktur |
| D-06 | Export di luar scope | Tersedia CSV (`public/app.js:287-300`) | Fitur tambahan |
| D-07 | Login disebut sebagai "login demo" | Login penuh dengan JWT + role guard, dan menjadi gerbang semua fitur | Lebih ketat dari dokumen |
| D-08 | `README.md:25` menyebut kode karyawan `EMP001` | Implementasi memakai `kyNN` (`app/Http/Controllers/Api/EmployeeController.php:44-50`) | Perbaiki README saat ada kesempatan |
| D-09 | `README.md` menyebut "9 tes" | `tests/Feature/WorkforceAttendanceTest.php` berisi **5** metode `test_*` | Acuan jumlah tes = kode, bukan README |
| D-10 | Docx hanya menyebut satu tumpukan teknologi | Implementasi tunggal **Laravel 10** (`app/` + `routes/api.php`). Node/Express yang menjadi baseline uji 18 Nov 2026 sudah dihapus pada cleanup 19 Nov 2026 | Repo kini satu tumpukan; angka QA tetap tercatat sebagai hasil siklus Node |
| D-11 | Docx menetapkan `422` untuk input tidak valid dan `409` untuk konflik | Implementasi memakai `400 VALIDATION` untuk input tidak valid (`EmployeeController.php:134-150,201-216`, `OfficeController.php:54-66`, `AuthController.php:28`) dan `409` untuk konflik (`AttendanceController.php:139-177`) | Perbedaan kode status |
| D-12 | Fakta repo (bukan deviasi docx) | Riwayat: implementasi Laravel (commit `3ee2b7a`) pernah berdampingan dengan Node. **Sudah disatukan**; Laravel menyediakan 20 endpoint API + `/health` (`routes/api.php`), gerbang `jwt.auth` (`routes/api.php:18`) dan peran `role:HR`/`role:EMPLOYEE` (`app/Http/Middleware/RequireRole.php`), 5 tes fitur, serta seeder akun HR (`database/seeders/HrSeeder.php`) | Kontrak API §7.1 berlaku; angka eksekusi QA tetap milik siklus Node |

---

## 11. Lampiran — Error Code

| Code | HTTP | Arti | Sumber |
|---|---|---|---|
| `VALIDATION` | 400 | Input tidak valid | berbagai route |
| `INVALID_PHOTO` | 400 | Tipe berkas tidak didukung / > 5 MB | `app/Http/Controllers/Api/AttendanceController.php:38-121`, `app/Exceptions/Handler.php:52-64` |
| `PHOTO_REQUIRED` | 400 | Foto kamera tidak dilampirkan | `app/Http/Controllers/Api/AttendanceController.php:40-42` |
| `GPS_REQUIRED` | 400 | Koordinat tidak ada/tidak valid | `app/Http/Controllers/Api/AttendanceController.php:63-65` |
| `INVALID_CREDENTIALS` | 401 | Email/password salah | `app/Http/Controllers/Api/AuthController.php:35-37` |
| `UNAUTHORIZED` | 401 | Token tidak ada/tidak valid/kedaluwarsa | `app/Http/Middleware/JwtAuth.php` |
| `FORBIDDEN` | 403 | Peran tidak berhak / data orang lain | `app/Http/Middleware/RequireRole.php:11-19`, `app/Http/Controllers/Api/AttendanceController.php:370-372`, `app/Http/Controllers/Api/AttendanceController.php:391-394` |
| `ACCOUNT_INACTIVE` | 403 | Karyawan nonaktif | `app/Http/Controllers/Api/AuthController.php:39-41`, `app/Http/Controllers/Api/AttendanceController.php:31-33` |
| `OUTSIDE_RADIUS` | 403 | Di luar radius office | `app/Http/Controllers/Api/AttendanceController.php:86-98` |
| `NOT_FOUND` | 404 | Resource tidak ditemukan | route terkait, `app/Exceptions/Handler.php:29-38` |
| `DUPLICATE_CODE` | 409 | Kode karyawan dipakai | `app/Http/Controllers/Api/EmployeeController.php:150-152`, `app/Http/Controllers/Api/EmployeeController.php:216-218` |
| `DUPLICATE_EMAIL` | 409 | Email dipakai | `app/Http/Controllers/Api/EmployeeController.php:154-156`, `app/Http/Controllers/Api/EmployeeController.php:220-222`, `app/Http/Controllers/Api/AdminController.php:102-105` |
| `ALREADY_CHECKED_IN` | 409 | Sudah IN hari ini | `app/Http/Controllers/Api/AttendanceController.php:155-157`, `app/Http/Controllers/Api/AttendanceController.php:179-181` |
| `NOT_CHECKED_IN` | 409 | Belum IN | `app/Http/Controllers/Api/AttendanceController.php:195-197` |
| `ALREADY_CHECKED_OUT` | 409 | Sudah OUT | `app/Http/Controllers/Api/AttendanceController.php:198-200` |
| `NO_OFFICE` | 409 | Tidak ada office aktif | `app/Http/Controllers/Api/AttendanceController.php:71-73` |
| `INTERNAL` | 500 | Kesalahan server | `app/Exceptions/Handler.php:52-64` |