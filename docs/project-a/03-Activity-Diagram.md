# Activity Diagram
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi | 2.2 (tata letak ringkas) |
| Tanggal | 18 November 2026 |
| Jumlah Diagram | 15 (AD-01 … AD-15) |
| Invarian | **Semua alur dimulai dari pemeriksaan sesi/login** (`TASK.md` I-01) |
| Konvensi gambar | Jalur utama satu kolom vertikal; cabang gagal menjadi **node merah di samping** keputusan, tidak ditarik ke bawah |

> **Cara membaca:** setiap diagram dimulai dari `Mulai` lalu pemeriksaan token/peran. Hanya AD-01 yang tidak memeriksa token, karena AD-01 adalah proses **memperoleh** token. Node merah adalah **akhir alur** — pengguna kembali ke Login, bukan melanjutkan proses. Bila satu keputusan memiliki beberapa penyebab gagal, penyebabnya ditulis pada label panah dan hasilnya dipecah menjadi beberapa node merah sejajar.
>
> Warna: **biru** = mulai/selesai · **kuning** = keputusan · **merah** = jalur gagal · **abu-abu** = langkah proses.

---

## AD-01 — Login & Pembentukan Sesi

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B["Buka Web HR / Mobile"]
    B --> C["Isi email & password"]
    C --> D{"Field terisi?"}:::gate
    D -- "tidak" --> X1["400 VALIDATION"]:::err
    D -- "ya" --> E["POST /api/login"]
    E --> F{"Kredensial cocok?"}:::gate
    F -- "tidak" --> X2["401 INVALID_CREDENTIALS"]:::err
    F -- "ya" --> G{"Akun ACTIVE?"}:::gate
    G -- "tidak" --> X3["403 ACCOUNT_INACTIVE"]:::err
    G -- "ya" --> H["Terbitkan JWT<br/>sub, role, exp 12 jam"]
    H --> I{"Klien Web HR?"}:::gate
    I -- "ya" --> J{"role HR?"}:::gate
    J -- "tidak" --> X4["Tolak: akun bukan HR"]:::err
    J -- "ya" --> K["Simpan token<br/>di localStorage"]
    I -- "tidak" --> L["Simpan token<br/>di penyimpanan aman"]
    K --> M["Muat antarmuka HR"]
    L --> N["Muat beranda Employee"]
    M --> O(["Selesai — sesi aktif"]):::ok
    N --> O

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/auth.js:10-21`, `src/middleware/auth.js:7-19`, `public/app.js:62-111`.

---

## AD-02 — Membuka Aplikasi Web HR (Pemeriksaan Sesi)

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B["Muat index.html + app.js"]
    B --> C{"Token di<br/>localStorage?"}:::gate
    C -- "tidak" --> D["renderLogin()"]
    C -- "ya" --> E["GET /api/me"]
    E --> F{"HTTP 200?"}:::gate
    F -- "tidak" --> G["logout(): hapus token"]
    G --> D
    F -- "ya" --> H["Simpan profil ke variabel me"]
    H --> I{"role HR?"}:::gate
    I -- "tidak" --> G
    I -- "ya" --> J["Render halaman sesuai hash<br/>dashboard · absensi · karyawan · office"]
    J --> K["Mulai timer refresh 60 detik"]
    K --> L(["Selesai — aplikasi siap"]):::ok
    D --> L

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `public/app.js:14-31` (api + 401), `:56-60` (logout), `:107-111` (boot), `:126-133` (routing hash).

---

## AD-03 — Lihat Status Absensi Hari Ini

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token &<br/>role EMPLOYEE?"}:::gate
    B -- "token" --> X1["401"]:::err
    B -- "role" --> X2["403"]:::err
    B -- "ya" --> C["Ambil employee_id<br/>dari token"]
    C --> D{"Karyawan ACTIVE?"}:::gate
    D -- "tidak" --> X3["403 INACTIVE"]:::err
    D -- "ya" --> E["Hitung work_date<br/>Asia/Jakarta"]
    E --> F["Cari attendances<br/>employee + work_date"]
    F --> G{"Record ada?"}:::gate
    G -- "tidak" --> H["BELUM_IN<br/>can_check_in = true"]
    G -- "ya" --> I{"check_out_at<br/>terisi?"}:::gate
    I -- "ya" --> J["SUDAH_OUT<br/>can_check_out = false"]
    I -- "tidak" --> K["SUDAH_IN<br/>can_check_out = true"]
    H --> L["Kirim state, rules,<br/>daftar office"]
    J --> L
    K --> L
    L --> M["Tampilkan status<br/>+ tombol aksi"]
    M --> N(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/attendance.js:61-72`, `src/utils/time.js:7`.

---

## AD-04 — Check-in (IN)

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token &<br/>role EMPLOYEE?"}:::gate
    B -- "token" --> X1["401"]:::err
    B -- "role" --> X2["403"]:::err
    B -- "ya" --> C["Ambil foto + GPS<br/>POST check-in"]
    C --> D{"Berkas &<br/>akun valid?"}:::gate
    D -- "berkas" --> X3["400 INVALID_PHOTO"]:::err
    D -- "nonaktif" --> X4["403 INACTIVE"]:::err
    D -- "ya" --> E{"Sudah IN?"}:::gate
    E -- "ya" --> X5["409 ALREADY_IN<br/>foto dihapus"]:::err
    E -- "tidak" --> F{"Foto &<br/>koordinat valid?"}:::gate
    F -- "foto" --> X6["400 PHOTO_REQUIRED"]:::err
    F -- "koordinat" --> X7["400 GPS_REQUIRED"]:::err
    F -- "ya" --> G{"Office &<br/>radius valid?"}:::gate
    G -- "office" --> X8["409 NO_OFFICE"]:::err
    G -- "radius" --> X9["403 OUTSIDE_RADIUS"]:::err
    G -- "ya" --> H["Status 08:15 WIB<br/>INSERT attendances"]
    H --> I{"UNIQUE?"}:::gate
    I -- "ya" --> X10["409 ALREADY_IN"]:::err
    I -- "tidak" --> J["201 + SUDAH_IN<br/>+ jam masuk"]
    J --> K(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/attendance.js:32-52,75-90`, `src/utils/geo.js`, `src/utils/time.js:15-20`.

**Catatan:** multer berjalan sebelum cek status karyawan, jadi `INVALID_PHOTO` dapat muncul untuk akun nonaktif. Bila handler gagal setelah foto terunggah, `withUpload` menghapus berkas itu (`attendance.js:46-52`).

---

## AD-05 — Check-out (OUT)

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token &<br/>role EMPLOYEE?"}:::gate
    B -- "token" --> X1["401"]:::err
    B -- "role" --> X2["403"]:::err
    B -- "ya" --> C["Ambil foto + GPS<br/>POST check-out"]
    C --> D{"Berkas &<br/>akun valid?"}:::gate
    D -- "berkas" --> X3["400 INVALID_PHOTO"]:::err
    D -- "nonaktif" --> X4["403 INACTIVE"]:::err
    D -- "ya" --> E{"Record hari ini ada?"}:::gate
    E -- "tidak" --> X5["409 NOT_CHECKED_IN"]:::err
    E -- "ya" --> F{"Sudah OUT?"}:::gate
    F -- "ya" --> X6["409 ALREADY_OUT"]:::err
    F -- "tidak" --> G{"Foto &<br/>koordinat valid?"}:::gate
    G -- "foto" --> X7["400 PHOTO_REQUIRED"]:::err
    G -- "koordinat" --> X8["400 GPS_REQUIRED"]:::err
    G -- "ya" --> H{"Office &<br/>radius valid?"}:::gate
    H -- "office" --> X9["409 NO_OFFICE"]:::err
    H -- "radius" --> X10["403 OUTSIDE_RADIUS"]:::err
    H -- "ya" --> I["UPDATE check_out_at<br/>WHERE IS NULL"]
    I --> J{"changes > 0?"}:::gate
    J -- "tidak" --> X11["409 ALREADY_OUT"]:::err
    J -- "ya" --> K["200 + SUDAH_OUT<br/>+ jam keluar"]
    K --> L(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/attendance.js:93-103`.

**Catatan:** kode error lengkap adalah `ALREADY_CHECKED_OUT`; diringkas menjadi `ALREADY_OUT` hanya pada gambar agar node tetap satu baris. Teks kode penuh dipakai pada `05-Flowchart.md` FC-04 dan matriks keputusan.

---

## AD-06 — Riwayat Kehadiran (Employee & HR)

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token valid?"}:::gate
    B -- "tidak" --> X1["401"]:::err
    B -- "ya" --> C{"role?"}:::gate
    C -- "EMPLOYEE" --> D{"employee_id<br/>milik orang lain?"}:::gate
    D -- "ya" --> X2["403 FORBIDDEN"]:::err
    D -- "tidak" --> E["Paksa employee_id =<br/>pemilik token"]
    C -- "HR" --> F["Pakai employee_id<br/>dari query (opsional)"]
    E --> G["GET attendance/history"]
    F --> G
    G --> H{"Tanggal & rentang<br/>valid?"}:::gate
    H -- "tidak" --> X3["400 VALIDATION"]:::err
    H -- "ya" --> I{"Status sah?"}:::gate
    I -- "tidak" --> X4["400 VALIDATION"]:::err
    I -- "ya" --> J{"BELUM_IN &<br/>rentang > 1 hari?"}:::gate
    J -- "ya" --> X5["400 VALIDATION"]:::err
    J -- "tidak" --> K["Filter, urutan,<br/>paginasi"]
    K --> L["Query attendances<br/>+ serialize"]
    L --> M["200 data + meta"]
    M --> N["Tampilkan daftar<br/>atau empty state"]
    N --> O(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/attendance.js:109-149`, `src/utils/filters.js`.

---

## AD-07 — Daftar & Filter Absensi (HR)

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token &<br/>role HR?"}:::gate
    B -- "tidak" --> X1["401 / 403"]:::err
    B -- "ya" --> C["Buka halaman Absensi"]
    C --> D["Pilih periode, status,<br/>cari, urut, halaman"]
    D --> E["GET /api/attendance"]
    E --> F{"Tanggal & rentang<br/>valid?"}:::gate
    F -- "tidak" --> X2["400 VALIDATION"]:::err
    F -- "ya" --> G{"Status sah?"}:::gate
    G -- "tidak" --> X3["400 VALIDATION"]:::err
    G -- "ya" --> H{"BELUM_IN &<br/>rentang > 1 hari?"}:::gate
    H -- "ya" --> X4["400 VALIDATION"]:::err
    H -- "tidak" --> I{"status BELUM_IN?"}:::gate
    I -- "ya" --> J["Karyawan ACTIVE<br/>tanpa record"]
    I -- "tidak" --> K["Attendances<br/>JOIN employees"]
    J --> L["200 data + meta<br/>page, total, from, to"]
    K --> L
    L --> M["Render tabel +<br/>thumbnail + pager"]
    M --> N(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/attendance.js:109-152`, `public/app.js` halaman absensi.

---

## AD-08 — Dashboard HR

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token &<br/>role HR?"}:::gate
    B -- "tidak" --> X1["401 / 403"]:::err
    B -- "ya" --> C["GET dashboard/attendance<br/>?date="]
    C --> D{"Tanggal valid?"}:::gate
    D -- "tidak" --> X2["400 VALIDATION"]:::err
    D -- "ya" --> E["total_active =<br/>COUNT karyawan ACTIVE"]
    E --> F["Agregasi tanggal:<br/>sudah_in · tepat_waktu<br/>terlambat · belum_out · sudah_out"]
    F --> G["belum_in = max 0,<br/>total_active - sudah_in"]
    G --> H["Susun daftar terlambat,<br/>belum OUT, belum IN"]
    H --> I["Susun tren 7 hari"]
    I --> J["200 ringkasan +<br/>daftar + tren"]
    J --> K["Render 5 kartu,<br/>3 tab, grafik"]
    K --> L{"Timer 60 detik?"}:::gate
    L -- "tidak" --> M(["Selesai"]):::ok
    L -- "ya" --> N["Refresh senyap"]
    N --> O{"Request sukses?"}:::gate
    O -- "ya" --> K
    O -- "tidak" --> P["Toast gagal<br/>data lama dipertahankan"]
    P --> M

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/dashboard.js:13-38`, `public/app.js` halaman dashboard.

---

## AD-09 — Tambah Karyawan (HR)

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token &<br/>role HR?"}:::gate
    B -- "tidak" --> X1["401 / 403"]:::err
    B -- "ya" --> C["Buka form Tambah akun"]
    C --> D["Isi nama (wajib);<br/>kode, email, password opsional"]
    D --> E["POST /api/employees"]
    E --> F{"Nama terisi?"}:::gate
    F -- "tidak" --> X2["400 VALIDATION"]:::err
    F -- "ya" --> G["Buat kyNN dan email<br/>bila tidak diisi"]
    G --> H{"Email & password<br/>valid?"}:::gate
    H -- "tidak" --> X3["400 VALIDATION"]:::err
    H -- "ya" --> I{"Kode / email<br/>sudah dipakai?"}:::gate
    I -- "ya" --> X4["409 DUPLICATE"]:::err
    I -- "tidak" --> J["BEGIN"]
    J --> K["INSERT employees"]
    K --> L["INSERT users<br/>role EMPLOYEE"]
    L --> M{"Berhasil?"}:::gate
    M -- "tidak" --> X5["ROLLBACK"]:::err
    M -- "ya" --> N["COMMIT"]
    N --> O["201 + initial_password"]
    O --> P["Dialog kredensial<br/>+ tombol salin"]
    P --> Q["Muat ulang tabel"]
    Q --> R(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/employees.js:17-29,54-75`.

---

## AD-10 — Ubah Karyawan (HR)

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token &<br/>role HR?"}:::gate
    B -- "tidak" --> X1["401 / 403"]:::err
    B -- "ya" --> C["Pilih karyawan → Ubah"]
    C --> D["Form terisi data saat ini"]
    D --> E["PUT /api/employees/:id"]
    E --> F{"Karyawan ada?"}:::gate
    F -- "tidak" --> X2["404 NOT_FOUND"]:::err
    F -- "ya" --> G{"Nama, status, email,<br/>password valid?"}:::gate
    G -- "tidak" --> X3["400 VALIDATION"]:::err
    G -- "ya" --> H{"Kode / email milik<br/>karyawan lain?"}:::gate
    H -- "ya" --> X4["409 DUPLICATE"]:::err
    H -- "tidak" --> I["BEGIN"]
    I --> J["UPDATE employees"]
    J --> K["UPDATE users<br/>email, password"]
    K --> L{"Berhasil?"}:::gate
    L -- "tidak" --> X5["ROLLBACK"]:::err
    L -- "ya" --> M["COMMIT"]
    M --> N["200 + data terbaru"]
    N --> O{"Status INACTIVE?"}:::gate
    O -- "tidak" --> P["Muat ulang tabel"]
    O -- "ya" --> Q["Login & absensi berikutnya<br/>ditolak INACTIVE"]
    Q --> P
    P --> R(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/employees.js:77-101`, `src/routes/auth.js:17-18`.

---

## AD-11 — Hapus Karyawan (HR)

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token &<br/>role HR?"}:::gate
    B -- "tidak" --> X1["401 / 403"]:::err
    B -- "ya" --> C["Pilih karyawan → Hapus"]
    C --> D["Dialog konfirmasi dampak"]
    D --> E{"Dikonfirmasi?"}:::gate
    E -- "tidak" --> Z(["Batal"]):::ok
    E -- "ya" --> F{"Karyawan ada?"}:::gate
    F -- "tidak" --> X2["404 NOT_FOUND"]:::err
    F -- "ya" --> G["Kumpulkan daftar<br/>foto IN/OUT"]
    G --> H["DELETE employees<br/>cascade users + attendances"]
    H --> I["Hapus berkas foto"]
    I --> J{"Ada foto gagal<br/>dihapus?"}:::gate
    J -- "ya" --> K["200 + warning"]
    J -- "tidak" --> L["200 ok true"]
    K --> M["Toast + muat ulang tabel"]
    L --> M
    M --> N(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/employees.js:103-122`, `src/db.js:21,39`.

---

## AD-12 — Kelola Office

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token valid?"}:::gate
    B -- "tidak" --> X1["401"]:::err
    B -- "ya" --> C["GET /api/offices"]
    C --> D{"role HR?"}:::gate
    D -- "tidak" --> E["Daftar read-only"]
    E --> F(["Selesai"]):::ok
    D -- "ya" --> G["Daftar + tombol<br/>Tambah / Ubah"]
    G --> H["Isi name, address,<br/>lat, lng, radius, is_active"]
    H --> I{"Nama & koordinat<br/>valid?"}:::gate
    I -- "tidak" --> X2["400 VALIDATION"]:::err
    I -- "ya" --> J{"Radius 10-5000 m?"}:::gate
    J -- "tidak" --> X3["400 VALIDATION"]:::err
    J -- "ya" --> K{"POST atau PUT?"}:::gate
    K -- "POST" --> L["201 + office baru"]
    K -- "PUT" --> M{"Office ada?"}:::gate
    M -- "tidak" --> X4["404 NOT_FOUND"]:::err
    M -- "ya" --> N["200 + office terbaru"]
    L --> O["Muat ulang daftar"]
    N --> O
    O --> P(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/offices.js:7-41`.

---

## AD-13 — Kelola Akun HR

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token &<br/>role HR?"}:::gate
    B -- "tidak" --> X1["401 / 403"]:::err
    B -- "ya" --> C["Buka tab Admin"]
    C --> D["GET /api/admins"]
    D --> E["Tampilkan account_code,<br/>nama, email"]
    E --> F["Tambah akun HR"]
    F --> G{"Nama terisi?"}:::gate
    G -- "tidak" --> X2["400 VALIDATION"]:::err
    G -- "ya" --> H{"Email valid &<br/>belum dipakai?"}:::gate
    H -- "tidak" --> X3["400 / 409"]:::err
    H -- "ya" --> I["BEGIN IMMEDIATE"]
    I --> J["Ambil nomor HR<br/>berikutnya"]
    J --> K["INSERT users<br/>role HR"]
    K --> L{"Berhasil?"}:::gate
    L -- "tidak" --> X4["ROLLBACK"]:::err
    L -- "ya" --> M["COMMIT"]
    M --> N["201 + initial_password"]
    N --> O["Akun langsung dapat login"]
    O --> P(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/admins.js:10-51`, `src/utils/hr-code.js`.

---

## AD-14 — Reset Password Karyawan

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token &<br/>role HR?"}:::gate
    B -- "tidak" --> X1["401 / 403"]:::err
    B -- "ya" --> C["Pilih karyawan →<br/>Reset password"]
    C --> D{"Konfirmasi?"}:::gate
    D -- "tidak" --> Z(["Batal"]):::ok
    D -- "ya" --> E["POST employees/:id<br/>/reset-password"]
    E --> F{"Karyawan ada?"}:::gate
    F -- "tidak" --> X2["404 NOT_FOUND"]:::err
    F -- "ya" --> G["Generate password<br/>acak 12 karakter"]
    G --> H["UPDATE users.password_hash"]
    H --> I["200 + email + password baru"]
    I --> J["Dialog kredensial baru"]
    J --> K["Password lama tidak berlaku"]
    K --> L(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/employees.js:124-131`.

---

## AD-15 — Lihat Foto Bukti

```mermaid
flowchart TD
    A(["Mulai"]):::start --> B{"Token valid?"}:::gate
    B -- "tidak" --> X1["401"]:::err
    B -- "ya" --> C["GET attendance/:id<br/>/photo/:type"]
    C --> D{"Record absensi ada?"}:::gate
    D -- "tidak" --> X2["404 NOT_FOUND"]:::err
    D -- "ya" --> E{"Employee dan<br/>bukan pemilik?"}:::gate
    E -- "ya" --> X3["403 FORBIDDEN"]:::err
    E -- "tidak" --> F{"Berkas foto ada?"}:::gate
    F -- "tidak" --> X4["404 NOT_FOUND"]:::err
    F -- "ya" --> G["Kirim berkas gambar"]
    G --> H(["Selesai"]):::ok

    classDef start fill:#eff6ff,stroke:#2563eb,color:#1e3a8a,stroke-width:1.5px;
    classDef gate fill:#fffbeb,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef err fill:#fef2f2,stroke:#dc2626,color:#991b1b,stroke-width:1.5px;
    classDef ok fill:#ecfdf5,stroke:#059669,color:#065f46,stroke-width:1.5px;
```

**Rujukan:** `src/routes/attendance.js:154-162`.

---

## Ringkasan Titik Awal & Akhir

| Diagram | Titik awal | Cek token/role | Cabang error utama | Titik akhir |
|---|---|---|---|---|
| AD-01 Login | Buka aplikasi | — (gerbang) | 400, 401, 403 | Sesi aktif |
| AD-02 Boot Web | Muat aset | Token + `/api/me` | 401 → Login | Aplikasi siap |
| AD-03 Status hari ini | Buka beranda | Token + EMPLOYEE | 401, 403 | Status tampil |
| AD-04 Check-in | Tekan IN | Token + EMPLOYEE | 400, 403, 409 | SUDAH_IN |
| AD-05 Check-out | Tekan OUT | Token + EMPLOYEE | 400, 403, 409 | SUDAH_OUT |
| AD-06 Riwayat | Buka riwayat | Token (+ cek pemilik) | 400, 401, 403 | Daftar tampil |
| AD-07 Absensi HR | Buka absensi | Token + HR | 400, 401, 403 | Tabel tampil |
| AD-08 Dashboard | Buka dashboard | Token + HR | 400, 401, 403 | Ringkasan tampil |
| AD-09 Tambah karyawan | Form tambah | Token + HR | 400, 401, 403, 409 | Akun dibuat |
| AD-10 Ubah karyawan | Form ubah | Token + HR | 400, 404, 409 | Data tersimpan |
| AD-11 Hapus karyawan | Tombol hapus | Token + HR | 401, 404 | Data terhapus |
| AD-12 Office | Menu office | Token (+HR untuk tulis) | 400, 403, 404 | Daftar office |
| AD-13 Akun HR | Tab admin | Token + HR | 400, 409 | Akun HR dibuat |
| AD-14 Reset password | Tombol reset | Token + HR | 404 | Password baru |
| AD-15 Foto bukti | Klik thumbnail | Token | 401, 403, 404 | Gambar tampil |
