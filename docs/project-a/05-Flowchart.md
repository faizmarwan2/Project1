# Flowchart Sistem
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi | 2.1 (perbaikan tata letak) |
| Tanggal | 18 November 2026 |
| Jumlah Flowchart | 11 (FC-01 … FC-11) |
| Sumber logika | `src/app.js`, `src/middleware/*`, `src/routes/*`, `src/utils/*`, `public/app.js` |
| Invarian | **Tidak ada jalur sukses tanpa login** (`TASK.md` I-01) dan **tidak ada sukses palsu** (ATT-08) |
| Konvensi gambar | Satu arah baca; cabang gagal berakhir di node merah dan tidak ditarik kembali ke jalur utama |

---

## FC-01 — Peta Alur Sistem (Utama)

```mermaid
flowchart TD
    START(["Pengguna membuka sistem"]):::start --> Q1{"Punya token valid?"}:::gate
    Q1 -- "tidak" --> LOGIN["Layar Login<br/>POST /api/login"]
    LOGIN --> OK{"Kredensial benar<br/>& akun aktif?"}:::gate
    OK -- "tidak, ulangi" --> LOGIN
    OK -- "ya" --> TOKEN["Terima token JWT<br/>berlaku 12 jam"]
    Q1 -- "ya, sesi tersimpan" --> ROLE
    TOKEN --> ROLE{"Peran pengguna?"}:::gate

    ROLE -- "HR" --> HRHUB["Menu Web HR<br/>dashboard · absensi · karyawan<br/>akun HR · office"]
    ROLE -- "EMPLOYEE" --> EMPHUB["Menu Employee<br/>status hari ini · check-in<br/>check-out · riwayat"]

    HRHUB --> API["API Express<br/>auth + requireRole"]
    EMPHUB --> API
    API --> DB[("SQLite<br/>5 tabel")]
    API -. "401 / 403" .-> X["Permintaan ditolak<br/>klien kembali ke Login"]:::err

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
```

> **Cara baca:** semua jalur bertemu di satu titik — **Peran pengguna** — lalu masuk ke API yang sama. Tidak ada cabang dari "Pengguna membuka sistem" menuju menu tanpa melewati layar Login. Rincian tiap menu beserta endpoint-nya ada di `02-Use-Case-Diagram.md` §2 dan `04-ERD.md`.

---

## FC-02 — Auth Gate (Middleware)

```mermaid
flowchart TD
    REQ(["Request masuk /api/**"]):::start --> PUB{"Path publik?<br/>/api/login · /health"}:::gate
    PUB -- "ya" --> OPEN["Handler publik<br/>tanpa token"]
    PUB -- "tidak" --> H{"Header Authorization<br/>diawali 'Bearer '?"}:::gate
    H -- "tidak" --> E1["401 UNAUTHORIZED<br/>token tidak ada"]:::err
    H -- "ya" --> V{"jwt.verify berhasil?"}:::gate
    V -- "tidak" --> E2["401 UNAUTHORIZED<br/>tidak valid / kedaluwarsa"]:::err
    V -- "ya" --> U{"User dengan sub itu<br/>masih ada?"}:::gate
    U -- "tidak" --> E3["401 UNAUTHORIZED<br/>user tidak ditemukan"]:::err
    U -- "ya" --> SET["req.user = id, employee_id,<br/>name, account_code, email, role"]
    SET --> R{"Route memakai<br/>requireRole?"}:::gate
    R -- "tidak" --> NEXT["Lanjut ke handler"]
    R -- "ya" --> RC{"role sesuai?"}:::gate
    RC -- "tidak" --> E4["403 FORBIDDEN"]:::err
    RC -- "ya" --> NEXT
    NEXT --> RES(["200 atau 4xx dari handler"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/middleware/auth.js:7-22`, `src/app.js:13-18`.

---

## FC-03 — State Machine Absensi

```mermaid
stateDiagram-v2
    [*] --> BELUM_IN : hari kerja dimulai
    BELUM_IN --> SUDAH_IN : check-in sukses 201
    BELUM_IN --> BELUM_IN : 400 / 403 / 409
    SUDAH_IN --> SUDAH_OUT : check-out sukses 200
    SUDAH_IN --> SUDAH_IN : OUT 409
    SUDAH_OUT --> SUDAH_OUT : OUT ulang 409
    SUDAH_OUT --> [*] : hari berakhir
```

| Dari | Aksi | Hasil | HTTP | Efek data |
|---|---|---|---|---|
| `BELUM_IN` | IN valid | `SUDAH_IN` | 201 | Baris baru |
| `BELUM_IN` | OUT | tetap | 409 | Tidak ada |
| `SUDAH_IN` | IN lagi | tetap | 409 | Tidak ada |
| `SUDAH_IN` | OUT valid | `SUDAH_OUT` | 200 | `check_out_at` terisi |
| `SUDAH_OUT` | OUT lagi | tetap | 409 | Tidak ada |

---

## FC-04 — Pipeline Request Check-in / Check-out

```mermaid
flowchart TD
    A(["POST check-in / check-out"]):::start --> B{"auth: token valid?"}:::gate
    B -- "tidak" --> X1["401 UNAUTHORIZED"]:::err
    B -- "ya" --> C{"requireRole EMPLOYEE?"}:::gate
    C -- "tidak" --> X2["403 FORBIDDEN"]:::err
    C -- "ya" --> D{"multer: berkas valid?<br/>JPEG/PNG/WEBP <= 5 MB"}:::gate
    D -- "tidak" --> X3["400 INVALID_PHOTO"]:::err
    D -- "ya" --> E{"Karyawan ACTIVE?"}:::gate
    E -- "tidak" --> X4["403 ACCOUNT_INACTIVE"]:::err
    E -- "ya" --> F{"State absensi<br/>hari ini valid?"}:::gate
    F -- "tidak" --> X5["409 ALREADY_CHECKED_IN /<br/>NOT_CHECKED_IN /<br/>ALREADY_CHECKED_OUT"]:::err
    F -- "ya" --> G{"Foto & koordinat valid?"}:::gate
    G -- "foto tidak ada" --> X6["400 PHOTO_REQUIRED"]:::err
    G -- "koordinat salah" --> X7["400 GPS_REQUIRED"]:::err
    G -- "ya" --> H{"Office aktif &<br/>dalam radius?"}:::gate
    H -- "tidak ada office" --> X8["409 NO_OFFICE"]:::err
    H -- "di luar radius" --> X9["403 OUTSIDE_RADIUS<br/>+ distance_m, radius_m"]:::err
    H -- "ya" --> I["INSERT / UPDATE<br/>dengan guard"]
    I --> J{"Constraint / changes?"}:::gate
    J -- "gagal" --> X10["409 konflik"]:::err
    J -- "sukses" --> K(["201 / 200 + data absensi"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Catatan:** bila handler melempar error setelah foto terunggah, `withUpload` menghapus berkas tersebut (`attendance.js:46-52`), sehingga tidak ada foto yatim.

---

## FC-05 — Penentuan Status TEPAT_WAKTU / TERLAMBAT

```mermaid
flowchart TD
    A(["Saat IN"]):::start --> B["now = new Date()"]
    B --> C["Konversi ke zona Asia/Jakarta"]
    C --> D["minutesOfDay = jam * 60 + menit"]
    D --> E["limit = 08:00 + 15 menit = 495"]
    E --> F{"minutesOfDay > 495?"}:::gate
    F -- "ya" --> G["status = TERLAMBAT"]
    F -- "tidak" --> H["status = TEPAT_WAKTU"]
    G --> I["Simpan ke attendances.status"]
    H --> I
    I --> J(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Tabel batas waktu (WIB):**

| Jam check-in | Hasil |
|---|---|
| 07:59 | `TEPAT_WAKTU` |
| 08:00 | `TEPAT_WAKTU` |
| 08:15 | `TEPAT_WAKTU` |
| 08:16 | `TERLAMBAT` |
| 09:30 | `TERLAMBAT` |

**Rujukan:** `src/config.js:22-23`, `src/utils/time.js:10-20`.

---

## FC-06 — Resolusi Filter Tanggal

```mermaid
flowchart TD
    A(["Query daftar absensi"]):::start --> B{"Ada ?date="}:::gate
    B -- "ya" --> C["from = to = date"]
    B -- "tidak" --> D{"Ada ?from= atau ?to="}:::gate
    D -- "ya" --> E["from = from atau to<br/>to = to atau from"]
    D -- "tidak" --> F{"Ada ?preset="}:::gate
    F -- "ya" --> G["resolvePreset(preset)"]
    F -- "tidak" --> H["Preset default<br/>HR: today · Employee: this_month"]
    G --> V
    H --> V
    C --> V
    E --> V
    V{"Preset dikenal &<br/>format YYYY-MM-DD valid?"}:::gate
    V -- "tidak" --> X1["400 VALIDATION"]:::err
    V -- "ya" --> W{"from <= to?"}:::gate
    W -- "tidak" --> X2["400 VALIDATION"]:::err
    W -- "ya" --> Y{"Selisih <= 366 hari?"}:::gate
    Y -- "tidak" --> X3["400 VALIDATION"]:::err
    Y -- "ya" --> Z["Kembalikan from, to"]
    Z --> S(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Preset yang sah:** `today`, `yesterday`, `this_week`, `last7`, `last30`, `this_month`, `last_month` (`src/utils/time.js:31-51`).

---

## FC-07 — Filter Status Daftar Absensi

```mermaid
flowchart LR
    A(["status dari query"]):::start --> B{"diisi?"}:::gate
    B -- "tidak" --> Z["Tanpa filter status"]
    B -- "ya" --> C["Uppercase"]
    C --> D{"Termasuk 5 nilai sah?"}:::gate
    D -- "tidak" --> X1["400 VALIDATION"]:::err
    D -- "ya" --> E{"Nilai status?"}:::gate
    E -- "BELUM_IN" --> F{"from == to?"}:::gate
    F -- "tidak" --> X2["400 VALIDATION"]:::err
    F -- "ya" --> G["Karyawan ACTIVE<br/>tanpa record"]
    E -- "TEPAT_WAKTU<br/>TERLAMBAT" --> H["WHERE a.status = ?"]
    E -- "BELUM_OUT" --> I["WHERE check_out_at IS NULL"]
    E -- "SUDAH_OUT" --> J["WHERE check_out_at IS NOT NULL"]
    G --> M
    H --> M
    I --> M
    J --> M
    Z --> M
    M["data + meta"] --> N(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/attendance.js:112-134`.

---

## FC-08 — Agregasi Dashboard

```mermaid
flowchart TD
    A(["GET /api/dashboard/attendance"]):::start --> B{"date valid?"}:::gate
    B -- "tidak" --> X1["400 VALIDATION"]:::err
    B -- "ya" --> C["total_active =<br/>COUNT karyawan ACTIVE"]
    C --> D["Agregasi tanggal:<br/>sudah_in · tepat_waktu · terlambat<br/>belum_out · sudah_out"]
    D --> E["belum_in = max 0,<br/>total_active - sudah_in"]
    E --> F["Susun 3 daftar:<br/>terlambat · belum OUT · belum IN"]
    F --> G["Hitung tren 7 hari"]
    G --> H["Kirim ringkasan<br/>+ 3 daftar + tren"]
    H --> I(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/dashboard.js:13-38`.

---

## FC-09 — Siklus Hidup Karyawan & Akun

```mermaid
flowchart TD
    A(["HR tambah karyawan"]):::start --> B["Validasi nama,<br/>email, password"]
    B --> C{"Lolos?"}:::gate
    C -- "tidak" --> X1["400 / 409"]:::err
    C -- "ya" --> D["BEGIN"]
    D --> E["INSERT employees<br/>status ACTIVE"]
    E --> F["INSERT users<br/>role EMPLOYEE"]
    F --> G{"COMMIT berhasil?"}:::gate
    G -- "tidak" --> X2["ROLLBACK"]:::err
    G -- "ya" --> H["Tampilkan password awal<br/>satu kali"]
    H --> I{"Tindakan berikutnya?"}:::gate
    I -- "nonaktifkan" --> J["status INACTIVE<br/>login & absensi ditolak"]:::warn
    I -- "reset password" --> K["Password acak baru<br/>disimpan sebagai hash"]:::warn
    I -- "hapus" --> L["DELETE employees<br/>CASCADE users + attendances"]:::warn
    L --> M["Hapus berkas foto"]
    M --> N(["Selesai"]):::ok
    J --> N
    K --> N

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
    classDef warn fill:#fff7ed,stroke:#ea580c,color:#9a3412,stroke-width:1.5px;
```

---

## FC-10 — Penanganan Error Terpusat

```mermaid
flowchart TD
    A(["Error dari route / middleware"]):::start --> B{"MulterError?"}:::gate
    B -- "LIMIT_FILE_SIZE" --> C["400 INVALID_PHOTO<br/>foto maksimal 5 MB"]
    B -- "lainnya" --> D["400 INVALID_PHOTO"]
    B -- "bukan" --> E{"JSON parse gagal?"}:::gate
    E -- "ya" --> F["400 VALIDATION<br/>JSON tidak valid"]
    E -- "tidak" --> G{"err.status ada?"}:::gate
    G -- "ya" --> H["Pakai status & code<br/>dari ApiError"]
    G -- "tidak" --> I["500 INTERNAL"]
    I --> J["console.error"]
    H --> K["JSON error code + message<br/>+ extra bila ada"]
    J --> K
    K --> L(["Respons terkirim"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Bentuk respons error** (`src/app.js:28`):

```json
{ "error": { "code": "OUTSIDE_RADIUS", "message": "Anda di luar radius office ...", "office": "Kantor Pusat", "distance_m": 1200, "radius_m": 100 } }
```

---

## FC-11 — Perilaku Klien Saat Gagal (ATT-08)

```mermaid
flowchart TD
    A(["Pengguna menekan aksi"]):::start --> B["Tampilkan status loading"]
    B --> C["fetch ke API"]
    C --> D{"Jaringan / server<br/>dapat dihubungi?"}:::gate
    D -- "tidak" --> E["Pesan: tidak bisa<br/>terhubung ke server"]
    D -- "ya" --> F{"HTTP 2xx?"}:::gate
    F -- "401" --> G["logout, kembali ke Login"]
    F -- "4xx / 5xx" --> H["Baca error.message"]
    F -- "ya" --> I["Perbarui tampilan<br/>& data lokal"]
    E --> J["Status lokal tidak berubah"]
    H --> J
    J --> K["Tetap di layar semula<br/>+ pesan error"]
    I --> L(["Selesai"]):::ok
    K --> L
    G --> L

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Prinsip:** status lokal hanya berubah setelah respons 2xx terverifikasi. Timeout, koneksi putus, dan 5xx **tidak** boleh menampilkan "berhasil" (`public/app.js:14-29`).

---

## Matriks Keputusan Lengkap

| # | Kondisi | Endpoint | HTTP | Error code | Data berubah? |
|---|---|---|---|---|---|
| 1 | Tanpa token | semua kecuali login/health | 401 | `UNAUTHORIZED` | Tidak |
| 2 | Token kedaluwarsa | semua terproteksi | 401 | `UNAUTHORIZED` | Tidak |
| 3 | Role Employee akses HR | `/api/employees`, `/api/admins`, `/api/dashboard`, `/api/attendance` | 403 | `FORBIDDEN` | Tidak |
| 4 | Employee lihat data orang lain | `/api/attendance/history?employee_id=` | 403 | `FORBIDDEN` | Tidak |
| 5 | Employee lihat foto orang lain | `/api/attendance/:id/photo/:type` | 403 | `FORBIDDEN` | Tidak |
| 6 | IN tanpa foto | `/api/attendance/check-in` | 400 | `PHOTO_REQUIRED` | Tidak; foto yatim dihapus |
| 7 | Foto > 5 MB / tipe salah | check-in / check-out | 400 | `INVALID_PHOTO` | Tidak |
| 8 | GPS tidak valid | check-in / check-out | 400 | `GPS_REQUIRED` | Tidak |
| 9 | Di luar radius | check-in / check-out | 403 | `OUTSIDE_RADIUS` | Tidak |
| 10 | Tidak ada office aktif | check-in / check-out | 409 | `NO_OFFICE` | Tidak |
| 11 | IN kedua | `/api/attendance/check-in` | 409 | `ALREADY_CHECKED_IN` | Tidak |
| 12 | OUT tanpa IN | `/api/attendance/check-out` | 409 | `NOT_CHECKED_IN` | Tidak |
| 13 | OUT kedua | `/api/attendance/check-out` | 409 | `ALREADY_CHECKED_OUT` | Tidak |
| 14 | Karyawan nonaktif | login, today, IN, OUT | 403 | `ACCOUNT_INACTIVE` | Tidak |
| 15 | Kode karyawan dipakai | `POST/PUT /api/employees` | 409 | `DUPLICATE_CODE` | Tidak |
| 16 | Email dipakai | employees / admins | 409 | `DUPLICATE_EMAIL` | Tidak |
| 17 | Format tanggal salah | daftar & dashboard | 400 | `VALIDATION` | Tidak |
| 18 | `from` > `to` | daftar | 400 | `VALIDATION` | Tidak |
| 19 | Rentang > 366 hari | daftar | 400 | `VALIDATION` | Tidak |
| 20 | `BELUM_IN` pada rentang > 1 hari | daftar | 400 | `VALIDATION` | Tidak |
| 21 | Resource tidak ada | detail/office/foto | 404 | `NOT_FOUND` | Tidak |
| 22 | Server error | semua | 500 | `INTERNAL` | Tidak |

---

## Titik Rawan & Mitigasi

| # | Titik rawan | Mitigasi di kode |
|---|---|---|
| R-01 | Dua IN bersamaan | `UNIQUE (employee_id, work_date)` + tangkap error UNIQUE → 409 |
| R-02 | Dua OUT bersamaan | `UPDATE ... WHERE id = ? AND check_out_at IS NULL` + cek `changes` |
| R-03 | Foto terunggah padahal request ditolak | `withUpload` memanggil `rmFile` saat handler melempar error |
| R-04 | Nomor HR ganda | `BEGIN IMMEDIATE` + `UPDATE ... RETURNING seq` |
| R-05 | Email ganda karena balapan | `UNIQUE` pada `users.email` + cek awal |
| R-06 | Perubahan radius setelah absensi | Jarak disimpan per transaksi (`in_distance_m`, `out_distance_m`) |
| R-07 | Klien tampak sukses padahal gagal | Status lokal hanya berubah pada 2xx (`public/app.js:14-29`) |
| R-08 | Token bocor lewat URL | Token hanya di header `Authorization`, bukan query string |