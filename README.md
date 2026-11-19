# Project A — Workforce Attendance (Laravel)

Aplikasi absensi karyawan berbasis GPS + kamera. Backend **Laravel 10** (PHP 8.1+),
database SQLite, autentikasi JWT, dan Web HR berupa berkas statis di `public/`.

## Stack

| Bagian | Teknologi |
|---|---|
| Framework | Laravel 10 (`app/`, `routes/`, `database/`) |
| Database | SQLite (`database/database.sqlite`) |
| Autentikasi | JWT HS256 (`App\Services\JwtService`, middleware `jwt.auth`) |
| Hash password | `Hash::make` (bcrypt) |
| Web HR | Berkas statis `public/index.html` + `public/app.js` (tanpa build) |

## Menjalankan

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Buat berkas database SQLite kosong, lalu jalankan migrasi dan seeder:

```bash
# Windows (PowerShell)
New-Item -ItemType File -Path database/database.sqlite -Force

# Linux/macOS
touch database/database.sqlite

php artisan migrate
php artisan db:seed
php artisan serve      # http://localhost:8000
```

`db:seed` menjalankan `HrSeeder` dan `OfficeSeeder`:

- **Akun HR pertama** — email dari `HR_EMAIL`, password dari `HR_PASSWORD` (lihat `.env`).
  Seeder tidak mencetak password ke log; buka `.env` bila lupa.
- **Satu office demo** di Sragen (`-7.4296, 111.0095`, radius 100 m).
  **Ganti koordinat ini** dengan lokasi kantor sebenarnya lewat `PUT /api/offices/{id}`
  (Google Maps → klik kanan → salin koordinat).

Seeder bersifat idempoten: aman dijalankan berulang, tidak menduplikasi data.

### Tes

```bash
php artisan test
```

## Format error

```json
{ "error": { "code": "ALREADY_CHECKED_IN", "message": "..." } }
```

## Endpoint

| Method | Path | Role | Keterangan |
|---|---|---|---|
| GET | `/api/health` | — | health check |
| POST | `/api/login` | — | `{email,password}` → `{token,role,user}` |
| GET | `/api/me` | semua | profil + data karyawan |
| GET | `/api/employees` | HR | `?search=&status=ACTIVE\|INACTIVE&page=&limit=` |
| GET | `/api/employees/{id}` | HR | detail |
| POST | `/api/employees` | HR | `{name}` saja cukup → kode `kyNN` (mis. `ky01`) & email `nama.depan@ethes.tech` dibuat otomatis, password acak (`initial_password`, tampil sekali). Boleh isi `employee_code`, `email`, `password` manual |
| PUT | `/api/employees/{id}` | HR | `name, employee_code, status, email, password` |
| DELETE | `/api/employees/{id}` | HR | hapus karyawan + riwayatnya |
| POST | `/api/employees/{id}/reset-password` | HR | password acak baru |
| GET | `/api/offices` | semua | lokasi office (lat, lng, radius) |
| POST/PUT | `/api/offices[/{id}]` | HR | kelola office: `name,address,latitude,longitude,radius_m,is_active` |
| GET | `/api/admins` | HR | daftar akun HR |
| POST | `/api/admins` | HR | buat akun HR baru |
| GET | `/api/attendance/today` | Employee | state `BELUM_IN/SUDAH_IN/SUDAH_OUT`, aturan jam, office |
| POST | `/api/attendance/check-in` | Employee | **multipart**: `photo` (file kamera), `lat`, `lng` |
| POST | `/api/attendance/check-out` | Employee | multipart sama |
| GET | `/api/attendance/history` | Employee/HR | Employee: hanya miliknya |
| GET | `/api/attendance` | HR | daftar semua absensi |
| GET | `/api/attendance/{id}/photo/in\|out` | pemilik/HR | foto (wajib token) |
| GET | `/api/dashboard/attendance` | HR | `?date=` ringkasan + terlambat/belum OUT/belum IN + tren 7 hari |

Semua endpoint di bawah `/api` **kecuali** `/api/health` dan `/api/login`
memerlukan header `Authorization: Bearer <token>`.

## Filter tanggal (HR list & history)

Prioritas: `date` > `from`+`to` > `preset` > default.

- `?date=2026-11-17` — satu hari
- `?from=2026-11-01&to=2026-11-17` — rentang (maks 366 hari)
- `?preset=today|yesterday|this_week|last7|last30|this_month|last_month`
- Default: HR → `today`, Employee history → `this_month`

Filter lain: `status=TEPAT_WAKTU|TERLAMBAT|BELUM_OUT|SUDAH_OUT|BELUM_IN`
(`BELUM_IN` hanya untuk 1 tanggal), `employee_id`, `search` (nama/kode),
`sort=asc|desc`, `page`, `limit`.

## Aturan bisnis

| Kode | Hasil |
|---|---|
| ATT-02 IN kedua | 409 `ALREADY_CHECKED_IN` (unique `employee_id+work_date` juga menjaga race condition) |
| ATT-03 OUT tanpa IN | 409 `NOT_CHECKED_IN` |
| ATT-05 OUT kedua | 409 `ALREADY_CHECKED_OUT` |
| ATT-06 data orang lain | 403 `FORBIDDEN` |
| ATT-07 token salah | 401 `UNAUTHORIZED` → Mobile kembali ke login |
| GPS di luar radius | 403 `OUTSIDE_RADIUS` (jarak Haversine ke office terdekat) |
| Tanpa foto / GPS | 400 `PHOTO_REQUIRED` / `GPS_REQUIRED` |
| Foto bukan JPEG/PNG/WEBP atau > 5 MB | 400 `INVALID_PHOTO` (diperiksa dari MIME nyata, bukan nama berkas) |

Waktu memakai jam server, zona `Asia/Jakarta`. Jam masuk 08:00, toleransi 15 menit:
lewat 08:15 → `TERLAMBAT`.

## Contoh

```bash
TOKEN=$(curl -s localhost:8000/api/login -H 'Content-Type: application/json' \
  -d '{"email":"budi.santoso@ethes.tech","password":"..."}' | jq -r .token)

curl -X POST localhost:8000/api/attendance/check-in -H "Authorization: Bearer $TOKEN" \
  -F lat=-7.4296 -F lng=111.0095 -F photo=@selfie.jpg
```

Mobile: ambil `lat/lng` dari GPS perangkat dan `photo` dari kamera (kamera depan),
kirim sebagai `multipart/form-data`.

## Web HR

Dibuka di `http://localhost:8000` setelah `php artisan serve`
(berkas statis di `public/`, disajikan oleh `routes/web.php`, tanpa proses build).

Menu: Dashboard, Absensi (filter + foto + GPS + CSV), Karyawan (CRUD + reset password),
Office (lokasi & radius), Admin (akun HR).

> Catatan keamanan: `.env` tidak pernah di-commit. Ganti `JWT_SECRET` dan
> `HR_PASSWORD` sebelum dipakai di luar lingkungan lokal.
