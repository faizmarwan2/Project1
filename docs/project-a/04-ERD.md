# Entity Relationship Diagram (ERD)
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi | 2.2 (build) |
| Tanggal | 19 November 2026 |
| DBMS | SQLite 3 (Laravel `pdo_sqlite`) |
| Sumber skema | `database/migrations/`, seeder `database/seeders/` |
| Tabel | 5 (`employees`, `users`, `offices`, `attendances`, `hr_code_sequence`) |
| Invarian akses | Seluruh data hanya dapat dibaca melalui API yang mensyaratkan login (`TASK.md` I-01) |

---

## 1. Diagram ERD

```mermaid
erDiagram
    EMPLOYEES ||--o| USERS : "memiliki akun login"
    EMPLOYEES ||--o{ ATTENDANCES : "mencatat absensi"
    OFFICES   ||--o{ ATTENDANCES : "menjadi lokasi absensi"

    EMPLOYEES {
        INTEGER id PK "AUTOINCREMENT"
        TEXT    employee_code UK "NOT NULL, format kyNN"
        TEXT    name "NOT NULL"
        TEXT    status "NOT NULL, ACTIVE atau INACTIVE, default ACTIVE"
        TEXT    created_at "NOT NULL, datetime now"
    }

    USERS {
        INTEGER id PK "AUTOINCREMENT"
        INTEGER employee_id FK "NULL untuk akun HR, CASCADE on delete"
        TEXT    name "NULL, nama tampilan akun HR"
        TEXT    account_code UK "NULL untuk employee, HRNN untuk HR"
        TEXT    email UK "NOT NULL, disimpan huruf kecil"
        TEXT    password_hash "NOT NULL, bcrypt cost 10"
        TEXT    role "NOT NULL, HR atau EMPLOYEE"
    }

    OFFICES {
        INTEGER id PK "AUTOINCREMENT"
        TEXT    name "NOT NULL"
        TEXT    address "NULL"
        REAL    latitude "NOT NULL"
        REAL    longitude "NOT NULL"
        INTEGER radius_m "NOT NULL default 100, rentang 10-5000"
        INTEGER is_active "NOT NULL default 1, 1 aktif 0 nonaktif"
    }

    ATTENDANCES {
        INTEGER id PK "AUTOINCREMENT"
        INTEGER employee_id FK "NOT NULL, CASCADE on delete"
        TEXT    work_date "NOT NULL, YYYY-MM-DD zona Asia/Jakarta"
        TEXT    check_in_at "NULL sampai IN, ISO +07:00"
        TEXT    check_out_at "NULL sampai OUT"
        TEXT    status "NOT NULL, TEPAT_WAKTU atau TERLAMBAT"
        INTEGER office_id FK "NULL, office tempat IN"
        REAL    in_lat "NULL"
        REAL    in_lng "NULL"
        REAL    in_distance_m "NULL, jarak meter dibulatkan 1 desimal"
        TEXT    in_photo "NULL, nama berkas foto IN"
        REAL    out_lat "NULL"
        REAL    out_lng "NULL"
        REAL    out_distance_m "NULL"
        TEXT    out_photo "NULL, nama berkas foto OUT"
    }

    HR_CODE_SEQUENCE {
        INTEGER id PK "selalu 1, CHECK id = 1"
        INTEGER seq "NOT NULL, nomor HR terakhir"
    }
```

> **Catatan:** `HR_CODE_SEQUENCE` tidak memiliki relasi FK; ia hanya counter untuk membentuk `account_code` `HRNN` secara atomik (`app/Services/HrCodeService.php`). Karena itu tabel ini berdiri sendiri di diagram.

---

## 2. Diagram Relasi (Kardinalitas)

```mermaid
flowchart LR
    E["employees<br/>1 baris per karyawan"]
    U["users<br/>akun login"]
    O["offices<br/>lokasi + radius"]
    A["attendances<br/>1 baris per karyawan per tanggal"]
    S["hr_code_sequence<br/>counter HR"]

    E -- "1 : 0..1<br/>employee_id" --> U
    E -- "1 : 0..N<br/>employee_id" --> A
    O -- "1 : 0..N<br/>office_id" --> A
    S -. "tanpa FK<br/>hanya counter" .-> U
```

### 2.1 Penjelasan Kardinalitas

| Relasi | Kardinalitas | Aturan | Bukti |
|---|---|---|---|
| `employees` → `users` | 1 : 0..1 | Satu karyawan punya paling banyak satu akun; akun HR boleh tanpa karyawan (`employee_id` NULL) | `users.employee_id` nullable `REFERENCES employees(id) ON DELETE CASCADE` |
| `employees` → `attendances` | 1 : 0..N | Satu karyawan punya banyak absensi, maksimal **satu per `work_date`** | `UNIQUE (employee_id, work_date)` |
| `offices` → `attendances` | 1 : 0..N | Satu office dipakai banyak absensi; office yang dinonaktifkan tetap tersimpan di record lama | `attendances.office_id` tanpa `ON DELETE`, `offices.is_active` |
| `hr_code_sequence` | — | Satu baris (`id = 1`) menyimpan nomor HR terakhir | `CHECK (id = 1)` |

### 2.2 Perilaku Penghapusan

| Aksi | Dampak | Bukti |
|---|---|---|
| Hapus karyawan | `users` dan `attendances` ikut terhapus (CASCADE); berkas foto dihapus manual | `app/Http/Controllers/Api/EmployeeController.php:250-290` |
| Hapus office | **Tidak disediakan endpoint hapus**; hanya `is_active = 0` | `app/Http/Controllers/Api/OfficeController.php` tidak punya `DELETE` |
| Nonaktifkan karyawan | Data tetap ada; login & absensi ditolak | `app/Http/Controllers/Api/EmployeeController.php:188-248`, `app/Http/Controllers/Api/AuthController.php:39-41`, `app/Http/Controllers/Api/AttendanceController.php:23-36` |

---

## 3. Kamus Data

### 3.1 `employees`

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | INTEGER | tidak | AUTOINCREMENT | PK |
| `employee_code` | TEXT | tidak | — | UK; `kyNN` (dua digit, melanjutkan nomor terbesar) |
| `name` | TEXT | tidak | — | Nama lengkap |
| `status` | TEXT | tidak | `ACTIVE` | `CHECK (status IN ('ACTIVE','INACTIVE'))` |
| `created_at` | TEXT | tidak | `datetime('now')` | Waktu pembuatan (UTC SQLite) |

**Aturan:** kode dibuat `kyNN` dari `max(seq, MAX(kode numerik)) + 1` (`app/Http/Controllers/Api/EmployeeController.php:41-51`).

### 3.2 `users`

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | INTEGER | tidak | AUTOINCREMENT | PK |
| `employee_id` | INTEGER | ya | — | FK → `employees.id`, CASCADE |
| `name` | TEXT | ya | — | Nama tampilan; dipakai akun HR |
| `account_code` | TEXT | ya | — | UK parsial; `HRNN` untuk HR, NULL untuk employee |
| `email` | TEXT | tidak | — | UK; disimpan `toLowerCase()` |
| `password_hash` | TEXT | tidak | — | bcrypt `hashSync(..., 10)` |
| `role` | TEXT | tidak | — | `CHECK (role IN ('HR','EMPLOYEE'))` |

**Catatan migrasi:** `account_code` ditambahkan pada `user_version` 2 dan `name` pada `user_version` 3 (`database/migrations/2014_10_12_000001_create_users_table.php:14-18`); akun HR lama dinomori ulang `HR01..HRNN`.

### 3.3 `offices`

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | INTEGER | tidak | AUTOINCREMENT | PK |
| `name` | TEXT | tidak | — | Nama lokasi |
| `address` | TEXT | ya | — | Alamat bebas |
| `latitude` | REAL | tidak | — | −90 … 90 |
| `longitude` | REAL | tidak | — | −180 … 180 |
| `radius_m` | INTEGER | tidak | 100 | 10 … 5000 meter |
| `is_active` | INTEGER | tidak | 1 | 1 = aktif, 0 = nonaktif |

**Validasi:** `app/Http/Controllers/Api/OfficeController.php:54-66`; koordinat memakai `validCoord` (`app/Services/GeoService.php:22-25`).

### 3.4 `attendances`

| Kolom | Tipe | Null | Keterangan |
|---|---|---|---|
| `id` | INTEGER | tidak | PK |
| `employee_id` | INTEGER | tidak | FK → `employees.id`, CASCADE |
| `work_date` | TEXT | tidak | `YYYY-MM-DD` hasil `T.workDate()` zona `Asia/Jakarta` |
| `check_in_at` | TEXT | ya | ISO dengan offset `+07:00` (`T.nowWib`) |
| `check_out_at` | TEXT | ya | ISO `+07:00` |
| `status` | TEXT | tidak | `TEPAT_WAKTU` atau `TERLAMBAT`, dihitung saat IN |
| `office_id` | INTEGER | ya | Office yang dipakai saat IN |
| `in_lat`, `in_lng` | REAL | ya | Koordinat IN |
| `in_distance_m` | REAL | ya | Jarak Haversine, 1 desimal |
| `in_photo` | TEXT | ya | Nama berkas di `uploads/attendance/` |
| `out_lat`, `out_lng` | REAL | ya | Koordinat OUT |
| `out_distance_m` | REAL | ya | Jarak Haversine OUT |
| `out_photo` | TEXT | ya | Nama berkas foto OUT |

**Unique:** `UNIQUE (employee_id, work_date)` — penjaga utama ATT-02 dan race condition (`database/migrations/2014_10_12_000003_create_attendances_table.php:29`, `app/Http/Controllers/Api/AttendanceController.php:179-181`).

### 3.5 `hr_code_sequence`

| Kolom | Tipe | Null | Keterangan |
|---|---|---|---|
| `id` | INTEGER | tidak | PK, `CHECK (id = 1)` |
| `seq` | INTEGER | tidak | Nomor HR terakhir yang dipakai |

**Mekanisme:** `UPDATE hr_code_sequence SET seq = seq + 1 WHERE id = 1 RETURNING seq` di dalam `BEGIN IMMEDIATE`, lalu dibentuk `HR%02d` (`app/Services/HrCodeService.php`).

---

## 4. Status Turunan (Tidak Disimpan)

Hanya **dua** nilai status yang benar-benar tersimpan di kolom `attendances.status`. Nilai lain dihitung saat query.

| Status | Sumber | Rumus | Bukti |
|---|---|---|---|
| `TEPAT_WAKTU` | Tersimpan | `jam_server <= 08:15` | `app/Services/TimeService.php:38-47` |
| `TERLAMBAT` | Tersimpan | `jam_server > 08:15` | `app/Services/TimeService.php:38-47` |
| `BELUM_IN` | Turunan | Karyawan `ACTIVE` tanpa baris `attendances` pada tanggal itu | `app/Http/Controllers/Api/AttendanceController.php:271-308`, `app/Http/Controllers/Api/DashboardController.php:78-83` |
| `BELUM_OUT` | Turunan | `check_out_at IS NULL` | `app/Http/Controllers/Api/AttendanceController.php:339-340` |
| `SUDAH_OUT` | Turunan | `check_out_at IS NOT NULL` | `app/Http/Controllers/Api/AttendanceController.php:341-342` |
| `out_state` | Turunan | `SUDAH_OUT` / `BELUM_OUT` per baris | `app/Models/Attendance.php:64` |

```mermaid
stateDiagram-v2
    [*] --> BELUM_IN : karyawan ACTIVE, belum ada baris
    BELUM_IN --> SUDAH_IN : POST check-in berhasil
    SUDAH_IN --> SUDAH_OUT : POST check-out berhasil
    SUDAH_OUT --> [*] : hari selesai
    note right of SUDAH_IN
        status tersimpan: TEPAT_WAKTU / TERLAMBAT
        out_state: BELUM_OUT
    end note
    note right of SUDAH_OUT
        out_state: SUDAH_OUT
    end note
```

---

## 5. DDL Aktual

```sql
-- Hasil nyata `php artisan migrate` (skema dibuat oleh database/migrations/)
CREATE TABLE "employees" (
  "id" integer primary key autoincrement not null,
  "employee_code" varchar not null,
  "name" varchar not null,
  "status" varchar not null default 'ACTIVE',
  "created_at" datetime not null default CURRENT_TIMESTAMP
);

CREATE TABLE "users" (
  "id" integer primary key autoincrement not null,
  "employee_id" integer,
  "name" varchar,
  "account_code" varchar,
  "email" varchar not null,
  "password_hash" varchar not null,
  "role" varchar not null,
  foreign key("employee_id") references "employees"("id") on delete set null
);

CREATE TABLE "offices" (
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "address" text,
  "latitude" float not null,
  "longitude" float not null,
  "radius_m" integer not null default '100',
  "is_active" integer not null default '1'
);

CREATE TABLE "attendances" (
  "id" integer primary key autoincrement not null,
  "employee_id" integer not null,
  "work_date" varchar not null,
  "check_in_at" varchar,
  "check_out_at" varchar,
  "status" varchar not null,
  "office_id" integer,
  "in_lat" float, "in_lng" float, "in_distance_m" float, "in_photo" varchar,
  "out_lat" float, "out_lng" float, "out_distance_m" float, "out_photo" varchar,
  foreign key("employee_id") references "employees"("id") on delete cascade,
  foreign key("office_id") references "offices"("id") on delete set null
);

CREATE TABLE "hr_code_sequence" (
  "id" integer primary key autoincrement not null,
  "seq" integer not null default '0'
);

-- Indeks dari migrasi
CREATE UNIQUE INDEX "employees_employee_code_unique" ON "employees"("employee_code");
CREATE UNIQUE INDEX "users_email_unique" ON "users"("email");
CREATE UNIQUE INDEX "users_account_code_unique" ON "users"("account_code");
CREATE UNIQUE INDEX "attendances_employee_id_work_date_unique" ON "attendances"("employee_id","work_date");
CREATE INDEX "attendances_work_date_index" ON "attendances"("work_date");
```

> **Catatan:** tidak ada `CHECK` constraint pada `status`/`role` di Laravel; validasi nilai dilakukan di lapisan aplikasi (`app/Http/Controllers/Api/*.php`). Foreign key SQLite aktif karena `foreign_key_constraints` (`config/database.php:43`); `PRAGMA user_version` tidak dipakai — versi skema dilacak tabel `migrations`.

---

## 6. Indeks & Kinerja

| Indeks | Kolom | Tujuan |
|---|---|---|
| `attendances_work_date_index` | `attendances.work_date` | Filter tanggal & agregasi dashboard |
| `attendances_employee_id_work_date_unique` | `(employee_id, work_date)` | UNIQUE, sekaligus jalur baca status hari ini |
| `users_email_unique` | `users.email` | Login |
| `users_account_code_unique` | `users.account_code` | Pencarian akun HR |
| `employees_employee_code_unique` | `employees.employee_code` | Duplikasi kode |

Query utama yang dilayani:

| Query | Dipakai oleh | Indeks |
|---|---|---|
| `WHERE employee_id = ? AND work_date = ?` | status hari ini, IN, OUT | UNIQUE komposit |
| `WHERE work_date BETWEEN ? AND ?` | daftar & riwayat | `attendances_work_date_index` |
| `JOIN employees` + `LIKE` nama/kode | pencarian | scan terbatas, dataset kecil |
| `GROUP BY work_date` (tren) | dashboard | `attendances_work_date_index` |

---

## 7. Normalisasi

| Bentuk | Status | Catatan |
|---|---|---|
| 1NF | Terpenuhi | Semua kolom atomik; tidak ada kolom berulang |
| 2NF | Terpenuhi | Semua tabel memakai PK tunggal; tidak ada dependensi parsial |
| 3NF | Terpenuhi | `office_id` dan `employee_id` disimpan sebagai FK, bukan duplikasi nama |
| Denormalisasi sadar | `in_distance_m`, `out_distance_m` | Jarak dihitung saat transaksi dan disimpan sebagai bukti historis, karena radius office dapat berubah |
| Denormalisasi sadar | `attendances.status` | Status ketepatan waktu dibekukan saat IN agar perubahan aturan jam tidak mengubah riwayat |

**Tidak ada kolom `updated_at`** pada `employees`/`offices`; perubahan tidak dilacak waktu. Ini keterbatasan yang dicatat, bukan fitur.

---

## 8. Konsistensi dengan Dokumen Awal

| Butir | Dokumen Awal | Implementasi | Status |
|---|---|---|---|
| DBMS | MySQL | SQLite (`pdo_sqlite`) | Deviasi D-01 |
| Migrasi | Framework migrations | Migrasi Laravel (`database/migrations/`) | Deviasi D-01 |
| Tabel | karyawan, absensi, kantor, users | Ditambah `hr_code_sequence` | Tambahan teknis |
| Foto | Tidak dirancang | `in_photo`, `out_photo` + berkas fisik | Deviasi D-02 |
| Koordinat | Tidak dirancang | `in_lat/lng`, `out_lat/lng`, jarak | Deviasi D-02 |

Detail deviasi lain ada di `01-SRS.md` §10.

---

## 9. Catatan Implementasi

1. **Foto disimpan sebagai nama berkas**, bukan BLOB. Direktori `uploads/attendance` (`base_path('uploads/attendance')`, `app/Http/Controllers/Api/AttendanceController.php:101-118`).
2. **Hapus karyawan** menghapus baris lebih dulu, lalu berkas foto; kegagalan hapus berkas tidak membatalkan penghapusan data (`app/Http/Controllers/Api/EmployeeController.php:250-289`).
3. **Tidak ada tabel sesi**; JWT bersifat stateless. Logout hanya menghapus token di klien.
4. **Zona waktu** tidak disimpan per baris. `work_date` dan `check_*_at` sudah dalam WIB, sehingga riwayat tetap terbaca benar meski server berpindah zona.
5. **`attendances.status` NOT NULL** dan hanya menerima dua nilai (`TEPAT_WAKTU`/`TERLAMBAT`) karena diisi `TimeService::attendanceStatus()`; status `BELUM_*` tidak pernah masuk database.