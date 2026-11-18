# Project A — Workforce Attendance (Backend API)

Node.js 22.13+ · Express · SQLite (`node:sqlite`, tanpa native build) · JWT · bcrypt · multer.

## Jalankan
```bash
npm install
cp .env.example .env     # ubah JWT_SECRET
npm start                # http://localhost:3000
npm test                 # 9 tes: ATT-01..07 + GPS/kamera + filter
```
Saat pertama jalan otomatis dibuat: akun HR `se@ethes.tech` / `Admin123!` (ubah di `.env`) dan 1 office demo.
**Ganti koordinat office** lewat `PUT /api/offices/1` agar sesuai lokasi kantor sebenarnya.

## Format error
`{ "error": { "code": "ALREADY_CHECKED_IN", "message": "..." } }`

## Endpoint
| Method | Path | Role | Keterangan |
|---|---|---|---|
| POST | /api/login | – | `{email,password}` → `{token,role,user}` |
| GET | /api/me | semua | profil + data karyawan |
| GET | /api/employees | HR | `?search=&status=ACTIVE\|INACTIVE&page=&limit=` |
| GET | /api/employees/:id | HR | detail |
| POST | /api/employees | HR | `{name}` saja cukup → kode `EMP001` & email `nama.depan@ethes.tech` dibuat otomatis, password acak (`initial_password`, tampil sekali). Boleh isi `employee_code`, `email`, `password` manual |
| PUT | /api/employees/:id | HR | `name, employee_code, status, email, password` |
| POST | /api/employees/:id/reset-password | HR | password acak baru |
| GET | /api/offices | semua | lokasi office (lat, lng, radius) |
| POST/PUT | /api/offices[/:id] | HR | kelola office: `name,address,latitude,longitude,radius_m` |
| GET | /api/attendance/today | Employee | state `BELUM_IN/SUDAH_IN/SUDAH_OUT`, aturan jam, office |
| POST | /api/attendance/check-in | Employee | **multipart**: `photo` (file kamera), `lat`, `lng` |
| POST | /api/attendance/check-out | Employee | multipart sama |
| GET | /api/attendance/history | Employee/HR | Employee: hanya miliknya |
| GET | /api/attendance | HR | daftar semua absensi |
| GET | /api/attendance/:id/photo/in\|out | pemilik/HR | foto (wajib token) |
| GET | /api/dashboard/attendance | HR | `?date=` ringkasan + terlambat/belum OUT/belum IN + tren 7 hari |

## Filter tanggal (HR list & history)
Prioritas: `date` > `from`+`to` > `preset` > default.
- `?date=2026-11-17` — satu hari
- `?from=2026-11-01&to=2026-11-17` — rentang (maks 366 hari)
- `?preset=today|yesterday|this_week|last7|last30|this_month|last_month`
- Default: HR → `today`, Employee history → `this_month`

Filter lain: `status=TEPAT_WAKTU|TERLAMBAT|BELUM_OUT|SUDAH_OUT|BELUM_IN` (BELUM_IN hanya untuk 1 tanggal),
`employee_id`, `search` (nama/kode), `sort=asc|desc`, `page`, `limit`.

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

Waktu memakai server, zona Asia/Jakarta. Jam masuk 08:00, toleransi 15 menit: lewat 08:15 → `TERLAMBAT`.

## Contoh
```bash
TOKEN=$(curl -s localhost:3000/api/login -H 'Content-Type: application/json' \
  -d '{"email":"budi.santoso@ethes.tech","password":"..."}' | jq -r .token)
curl -X POST localhost:3000/api/attendance/check-in -H "Authorization: Bearer $TOKEN" \
  -F lat=-7.4296 -F lng=111.0095 -F photo=@selfie.jpg
```
Mobile: ambil `lat/lng` dari GPS perangkat dan `photo` dari kamera (kamera depan), kirim sebagai `multipart/form-data`.

## Web HR
Dibuka di `http://localhost:3000` setelah `npm start` (file statis di folder `public/`, tanpa build).
Menu: Dashboard, Absensi (filter + foto + GPS + CSV), Karyawan (CRUD + reset password), Office (lokasi & radius).
