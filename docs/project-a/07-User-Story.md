# User Story & Product Backlog
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi | 2.0 (build) |
| Tanggal | 18 November 2026 |
| Persona | 3 |
| Epic | 7 |
| User Story | **32** |
| Total Story Point | **92** |
| Invarian | **Setiap story berawal dari "saya sudah login"**, kecuali US-01 (login itu sendiri) |

---

## 1. Persona

### P-01 — Rina, HR Admin

| Atribut | Keterangan |
|---|---|
| Peran | HR Admin (`role = HR`) |
| Perangkat | Laptop, browser modern, Web HR |
| Tujuan | Memastikan data karyawan benar dan kehadiran harian terpantau |
| Frustrasi | Rekap manual di spreadsheet, lupa password karyawan, tidak tahu siapa yang belum absen |
| Frekuensi | Setiap pagi dan akhir bulan |
| Kutipan | "Saya butuh tahu dalam 10 detik: siapa yang terlambat dan siapa yang belum masuk." |

### P-02 — Budi, Karyawan Lapangan

| Atribut | Keterangan |
|---|---|
| Peran | Employee (`role = EMPLOYEE`) |
| Perangkat | Ponsel Android, koneksi tidak selalu stabil |
| Tujuan | Absen cepat sebelum 08:00 tanpa antre |
| Frustrasi | Sinyal lemah, kamera lambat, tidak yakin absennya tercatat |
| Frekuensi | 2× per hari kerja |
| Kutipan | "Kalau sudah muncul jam masuknya, berarti berhasil, kan?" |

### P-03 — Pak Andi, Mentor / Penguji

| Atribut | Keterangan |
|---|---|
| Peran | Reviewer eksternal |
| Perangkat | Laptop |
| Tujuan | Menilai kesesuaian requirement, aturan bisnis, dan bukti uji |
| Frustrasi | Dokumen dan kode tidak sinkron |
| Frekuensi | Akhir periode magang |
| Kutipan | "Tunjukkan aturannya, tunjukkan kodenya, tunjukkan buktinya." |

---

## 2. Epic

| ID | Epic | Story | Poin | FR utama |
|---|---|---|---|---|
| EP-01 | Akses & Sesi | US-01..US-05 | 12 | FR-AUTH-00..08, FR-WEB-05 |
| EP-02 | Manajemen Karyawan | US-06..US-11 | 18 | FR-EMP-01..12 |
| EP-03 | Akun HR | US-12..US-13 | 5 | FR-ADM-01..04 |
| EP-04 | Office & Radius | US-14..US-16 | 6 | FR-OFF-01..04 |
| EP-05 | Absensi Harian | US-17..US-22 | 22 | FR-ATT-01..15 |
| EP-06 | Riwayat & Bukti | US-23..US-27 | 16 | FR-HIS-01..09 |
| EP-07 | Dashboard & Kualitas | US-28..US-32 | 13 | FR-DSH-01..05, NFR-08 |
| **Total** | **7 epic** | **32 story** | **92** | **63 FR** |

---

## 3. User Story

### EP-01 — Akses & Sesi

#### US-01 — Login ke sistem

> **Sebagai** HR Admin atau Employee
> **Saya ingin** masuk dengan email dan password
> **Agar** saya dapat menggunakan fitur sesuai peran saya

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 5 |
| FR | FR-AUTH-01, FR-AUTH-02, FR-AUTH-07 |
| UC | UC-01 |
| Prakondisi | Akun terdaftar; Employee berstatus `ACTIVE` |

```gherkin
Scenario: Login berhasil sebagai HR
  Given saya berada di layar Login
  When saya mengisi email dan password yang benar
  Then saya menerima token
  And saya diarahkan ke Dashboard Web HR

Scenario: Password salah
  Given saya berada di layar Login
  When saya mengisi password yang salah
  Then muncul pesan "Email atau password salah"
  And saya tetap di layar Login

Scenario: Field kosong
  Given saya berada di layar Login
  When saya menekan Masuk tanpa mengisi field
  Then muncul pesan bahwa email dan password perlu diisi
```

#### US-02 — Melihat profil saya

> **Sebagai** pengguna yang sudah login
> **Saya ingin** melihat profil dan kode akun saya
> **Agar** saya tahu identitas yang sedang aktif

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 2 |
| FR | FR-AUTH-06 |
| UC | UC-02 |

```gherkin
Scenario: Profil HR
  Given saya sudah login sebagai HR01
  When saya membuka profil
  Then saya melihat account_code "HR01" dan email saya

Scenario: Profil karyawan
  Given saya sudah login sebagai Employee
  When saya membuka profil
  Then saya melihat employee_code dan status karyawan saya
```

#### US-03 — Keluar dari sistem

> **Sebagai** pengguna yang sudah login
> **Saya ingin** keluar dengan satu tombol
> **Agar** orang lain tidak memakai sesi saya

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 1 |
| FR | FR-AUTH-08 |
| UC | UC-01 (A6) |

```gherkin
Scenario: Logout
  Given saya sudah login
  When saya menekan tombol Keluar
  Then token dihapus dari perangkat
  And layar Login ditampilkan
  And permintaan data berikutnya tidak membawa token
```

#### US-04 — Dikembalikan ke Login saat sesi berakhir

> **Sebagai** pengguna yang sudah login
> **Saya ingin** diberi tahu saat sesi berakhir
> **Agar** saya tidak mengira data sudah tersimpan

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 2 |
| FR | FR-AUTH-04, FR-AUTH-08 |
| UC | UC-01 (A5) |

```gherkin
Scenario: Token kedaluwarsa
  Given saya sudah login dengan token kedaluwarsa
  When saya membuka halaman data
  Then sistem menerima 401 UNAUTHORIZED
  And saya dikembalikan ke layar Login
```

#### US-05 — Web HR hanya untuk HR

> **Sebagai** pemilik sistem
> **Saya ingin** Web HR menolak akun karyawan
> **Agar** antarmuka HR tidak disalahgunakan

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 2 |
| FR | FR-WEB-05, FR-AUTH-05 |
| UC | UC-01 (A4) |

```gherkin
Scenario: Akun Employee mencoba Web HR
  Given saya sudah login sebagai Employee di aplikasi mobile
  When saya mencoba login di Web HR dengan akun yang sama
  Then muncul pesan "Akun ini bukan HR"
  And token tidak disimpan
  And Dashboard tidak dirender
```

---

### EP-02 — Manajemen Karyawan

#### US-06 — Menambah karyawan

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** menambah karyawan hanya dengan nama
> **Agar** akun dan kode dibuat otomatis tanpa salah ketik

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 5 |
| FR | FR-EMP-01, FR-EMP-02, FR-EMP-03, FR-EMP-12 |
| UC | UC-03 |

```gherkin
Scenario: Tambah dengan nama saja
  Given saya sudah login sebagai HR
  When saya menambah karyawan bernama "Budi Santoso"
  Then kode "kyNN" dan email "budi.santoso@ethes.tech" dibuat otomatis
  And password awal ditampilkan satu kali
  And karyawan muncul di daftar

Scenario: Header Authorization tidak dikirim
  Given saya belum login
  When saya mengirim POST /api/employees
  Then respons 401 UNAUTHORIZED
  And tidak ada karyawan yang dibuat
```

#### US-07 — Mencari karyawan

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** mencari karyawan berdasarkan nama, kode, atau email
> **Agar** saya menemukan data dengan cepat

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 3 |
| FR | FR-EMP-06, FR-EMP-07 |
| UC | UC-04 |

```gherkin
Scenario: Cari berdasarkan nama
  Given saya sudah login sebagai HR
  When saya mengetik "budi" pada kolom pencarian
  Then daftar hanya menampilkan karyawan yang cocok

Scenario: Filter status
  Given saya sudah login sebagai HR
  When saya memilih status INACTIVE
  Then daftar hanya menampilkan karyawan nonaktif
```

#### US-08 — Mengubah data karyawan

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** memperbaiki nama, kode, email, atau password karyawan
> **Agar** data tetap akurat

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 3 |
| FR | FR-EMP-08 |
| UC | UC-05 |

```gherkin
Scenario: Ubah nama
  Given saya sudah login sebagai HR
  When saya mengubah nama karyawan lalu menyimpan
  Then nama baru tersimpan
  And tabel menampilkan nama terbaru

Scenario: Email milik karyawan lain
  Given email sudah dipakai karyawan lain
  When saya menyimpan email tersebut
  Then respons 409 DUPLICATE_EMAIL
```

#### US-09 — Menonaktifkan karyawan

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** menonaktifkan karyawan yang sudah keluar
> **Agar** ia tidak dapat absen lagi tanpa menghapus riwayatnya

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 2 |
| FR | FR-EMP-09, FR-ATT-12 |
| UC | UC-05 (A3) |

```gherkin
Scenario: Karyawan nonaktif tidak bisa login
  Given saya sudah login sebagai HR
  When saya mengubah status karyawan menjadi INACTIVE
  Then karyawan tersebut gagal login dengan 403 ACCOUNT_INACTIVE
  And check-in-nya ditolak dengan 403 ACCOUNT_INACTIVE
```

#### US-10 — Menghapus karyawan

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** menghapus karyawan beserta riwayat dan fotonya
> **Agar** data tidak menumpuk

| Atribut | Nilai |
|---|---|
| Prioritas | S |
| Poin | 3 |
| FR | FR-EMP-10 |
| UC | UC-06 |

```gherkin
Scenario: Hapus karyawan
  Given saya sudah login sebagai HR
  And karyawan memiliki riwayat absensi
  When saya menghapus karyawan tersebut
  Then akun, riwayat, dan foto terhapus
  And respons 200 dengan ok true

Scenario: Sebagian foto gagal dihapus
  Given berkas foto tidak dapat dihapus
  When saya menghapus karyawan
  Then data tetap terhapus
  And respons memuat warning
```

#### US-11 — Mereset password karyawan

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** mereset password karyawan
> **Agar** karyawan dapat masuk lagi tanpa menunggu

| Atribut | Nilai |
|---|---|
| Prioritas | S |
| Poin | 2 |
| FR | FR-EMP-11 |
| UC | UC-07 |

```gherkin
Scenario: Reset password
  Given saya sudah login sebagai HR
  When saya mereset password karyawan
  Then password acak baru ditampilkan satu kali
  And password lama tidak berlaku
```

---

### EP-03 — Akun HR

#### US-12 — Melihat daftar akun HR

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** melihat daftar akun HR
> **Agar** saya tahu siapa saja yang punya akses

| Atribut | Nilai |
|---|---|
| Prioritas | S |
| Poin | 2 |
| FR | FR-ADM-01 |
| UC | UC-08 |

```gherkin
Scenario: Daftar akun HR
  Given saya sudah login sebagai HR
  When saya membuka tab Admin
  Then saya melihat account_code, nama, dan email setiap akun HR
```

#### US-13 — Menambah akun HR

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** menambah akun HR baru
> **Agar** pekerjaan dapat dibagi

| Atribut | Nilai |
|---|---|
| Prioritas | S |
| Poin | 3 |
| FR | FR-ADM-02, FR-ADM-03, FR-ADM-04 |
| UC | UC-08 |

```gherkin
Scenario: Akun HR kedua
  Given saya sudah login sebagai HR01
  When saya menambah akun HR baru
  Then account_code "HR02" dibuat
  And akun tersebut dapat login dan membuka Dashboard

Scenario: Email sudah dipakai
  Given email tersebut milik akun lain
  When saya menambah akun HR dengan email itu
  Then respons 409 DUPLICATE_EMAIL
```

---

### EP-04 — Office & Radius

#### US-14 — Melihat lokasi office

> **Sebagai** pengguna yang sudah login
> **Saya ingin** melihat daftar office beserta radiusnya
> **Agar** saya tahu batas lokasi absen

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 1 |
| FR | FR-OFF-01 |
| UC | UC-09 |

```gherkin
Scenario: Employee melihat office
  Given saya sudah login sebagai Employee
  When saya membuka daftar office
  Then saya melihat nama, alamat, koordinat, dan radius office aktif
```

#### US-15 — Menambah office

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** menambah office dengan koordinat dan radius
> **Agar** absensi hanya sah di lokasi yang benar

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 3 |
| FR | FR-OFF-02 |
| UC | UC-09 |

```gherkin
Scenario: Tambah office valid
  Given saya sudah login sebagai HR
  When saya menambah office dengan koordinat valid dan radius 100 m
  Then office tersimpan dan muncul di daftar aktif

Scenario: Radius tidak valid
  Given saya sudah login sebagai HR
  When saya mengisi radius 5 meter
  Then respons 400 VALIDATION
```

#### US-16 — Mengubah atau menonaktifkan office

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** memperbarui office atau menonaktifkannya
> **Agar** perubahan lokasi tidak mengganggu absensi

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 2 |
| FR | FR-OFF-03 |
| UC | UC-09 |

```gherkin
Scenario: Nonaktifkan office
  Given saya sudah login sebagai HR
  When saya menetapkan is_active = 0
  Then office hilang dari daftar aktif
  And office tersebut tidak dipakai validasi radius

Scenario: Employee mencoba mengubah office
  Given saya login sebagai Employee
  When saya mengirim PUT /api/offices/1
  Then respons 403 FORBIDDEN
```

---

### EP-05 — Absensi Harian

#### US-17 — Melihat status absensi hari ini

> **Sebagai** Employee yang sudah login
> **Saya ingin** melihat status dan tombol yang tersedia
> **Agar** saya tahu harus IN atau OUT

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 3 |
| FR | FR-ATT-01 |
| UC | UC-10 |

```gherkin
Scenario: Belum absen
  Given saya sudah login sebagai Employee aktif
  And saya belum absen hari ini
  Then status yang tampil adalah BELUM_IN
  And tombol IN aktif

Scenario: Sudah IN
  Given saya sudah check-in hari ini
  Then status yang tampil adalah SUDAH_IN
  And tombol OUT aktif
```

#### US-18 — Check-in dengan foto dan GPS

> **Sebagai** Employee yang sudah login
> **Saya ingin** check-in dengan foto dan lokasi
> **Agar** kehadiran saya tercatat sah

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 8 |
| FR | FR-ATT-02, FR-ATT-07, FR-ATT-08, FR-ATT-09, FR-ATT-10 |
| UC | UC-11 |

```gherkin
Scenario: Check-in berhasil
  Given saya sudah login sebagai Employee aktif
  And saya berada dalam radius office
  When saya mengirim foto dan koordinat
  Then respons 201 dengan status TEPAT_WAKTU atau TERLAMBAT
  And jam masuk tampil di layar

Scenario: Di luar radius
  Given saya berada 1,2 km dari office beradius 100 m
  When saya check-in
  Then respons 403 OUTSIDE_RADIUS
  And pesan menampilkan jarak dan radius

Scenario: Tanpa foto
  Given saya tidak melampirkan foto
  When saya check-in
  Then respons 400 PHOTO_REQUIRED
```

#### US-19 — Check-in kedua ditolak

> **Sebagai** Employee yang sudah login
> **Saya ingin** diberi tahu bila sudah absen masuk
> **Agar** tidak ada data ganda

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 2 |
| FR | FR-ATT-03, FR-ATT-13 |
| UC | UC-11 (A1, A7) |

```gherkin
Scenario: IN kedua
  Given saya sudah login sebagai Employee
  And saya sudah check-in hari ini
  When saya menekan IN lagi
  Then respons 409 ALREADY_CHECKED_IN
  And jumlah record hari ini tetap satu
```

#### US-20 — Check-out

> **Sebagai** Employee yang sudah login
> **Saya ingin** check-out dengan foto dan GPS
> **Agar** jam pulang saya tercatat

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 5 |
| FR | FR-ATT-05 |
| UC | UC-12 |

```gherkin
Scenario: OUT berhasil
  Given saya sudah login dan sudah IN hari ini
  And saya belum OUT
  When saya mengirim foto dan koordinat
  Then respons 200
  And status berubah menjadi SUDAH_OUT
  And jam keluar tampil
```

#### US-21 — Check-out tanpa check-in ditolak

> **Sebagai** Employee yang sudah login
> **Saya ingin** diberi tahu bila belum absen masuk
> **Agar** saya tidak mengira sudah absen

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 2 |
| FR | FR-ATT-04 |
| UC | UC-12 (A1) |

```gherkin
Scenario: OUT tanpa IN
  Given saya sudah login sebagai Employee
  And saya belum check-in hari ini
  When saya menekan OUT
  Then respons 409 NOT_CHECKED_IN
  And tidak ada record yang dibuat
```

#### US-22 — Check-out kedua ditolak

> **Sebagai** Employee yang sudah login
> **Saya ingin** diberi tahu bila sudah absen pulang
> **Agar** data tidak tertimpa

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 2 |
| FR | FR-ATT-06 |
| UC | UC-12 (A2, A4) |

```gherkin
Scenario: OUT kedua
  Given saya sudah login sebagai Employee
  And saya sudah check-out hari ini
  When saya menekan OUT lagi
  Then respons 409 ALREADY_CHECKED_OUT
  And check_out_at tidak berubah
```

---

### EP-06 — Riwayat & Bukti

#### US-23 — Melihat riwayat pribadi

> **Sebagai** Employee yang sudah login
> **Saya ingin** melihat riwayat absensi saya
> **Agar** saya dapat memeriksa kehadiran sendiri

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 3 |
| FR | FR-HIS-01, FR-HIS-04, FR-HIS-07 |
| UC | UC-13 |

```gherkin
Scenario: Riwayat bulan ini
  Given saya sudah login sebagai Employee
  When saya membuka riwayat
  Then saya melihat absensi bulan berjalan
  And hanya data milik saya

Scenario: Riwayat kosong
  Given saya belum pernah absen
  When saya membuka riwayat
  Then tampil empty state
```

#### US-24 — Privasi data antar karyawan

> **Sebagai** Employee yang sudah login
> **Saya ingin** data saya tidak dapat dibuka karyawan lain
> **Agar** privasi terjaga

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 2 |
| FR | FR-HIS-02, FR-HIS-08 |
| UC | UC-13 (A1), UC-15 (A3) |

```gherkin
Scenario: Meminta data orang lain
  Given saya sudah login sebagai Employee A
  When saya meminta riwayat dengan employee_id milik B
  Then respons 403 FORBIDDEN

Scenario: Membuka foto orang lain
  Given saya sudah login sebagai Employee A
  When saya membuka foto absensi milik B
  Then respons 403 FORBIDDEN
```

#### US-25 — Daftar dan filter absensi untuk HR

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** memfilter absensi per tanggal, status, dan nama
> **Agar** saya dapat menindaklanjuti keterlambatan

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 5 |
| FR | FR-HIS-03, FR-HIS-04, FR-HIS-05, FR-HIS-06, FR-HIS-07 |
| UC | UC-14 |

```gherkin
Scenario: Filter satu tanggal
  Given saya sudah login sebagai HR
  When saya memilih tanggal hari ini
  Then daftar hanya memuat absensi tanggal tersebut

Scenario: Filter status TERLAMBAT
  Given saya sudah login sebagai HR
  When saya memilih status TERLAMBAT
  Then hanya karyawan terlambat yang tampil

Scenario: Rentang terbalik
  Given saya mengisi from lebih besar dari to
  Then respons 400 VALIDATION
```

#### US-26 — Melihat foto bukti

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** melihat foto check-in dan check-out
> **Agar** saya dapat memverifikasi kehadiran

| Atribut | Nilai |
|---|---|
| Prioritas | S |
| Poin | 3 |
| FR | FR-HIS-08 |
| UC | UC-15 |

```gherkin
Scenario: HR membuka foto
  Given saya sudah login sebagai HR
  When saya mengklik thumbnail absensi
  Then foto IN tampil

Scenario: Foto tidak ada
  Given record tidak memiliki foto OUT
  When saya meminta foto OUT
  Then respons 404 NOT_FOUND
```

#### US-27 — Ekspor CSV

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** mengunduh absensi sesuai filter
> **Agar** saya dapat melaporkannya

| Atribut | Nilai |
|---|---|
| Prioritas | C |
| Poin | 3 |
| FR | FR-HIS-09 |
| UC | UC-16 |

```gherkin
Scenario: Unduh CSV
  Given saya sudah login sebagai HR
  And saya sudah memilih filter
  When saya menekan Unduh CSV
  Then berkas absensi-<tanggal>.csv terunduh
  And isinya sesuai filter

Scenario: Gagal mengambil data
  Given server tidak merespons
  When saya menekan Unduh CSV
  Then muncul toast error
  And tidak ada berkas yang terunduh
```

---

### EP-07 — Dashboard & Kualitas

#### US-28 — Melihat ringkasan harian

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** melihat ringkasan kehadiran hari ini
> **Agar** saya tahu kondisi pagi ini dalam sekali lihat

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 3 |
| FR | FR-DSH-01, FR-DSH-02 |
| UC | UC-17 |

```gherkin
Scenario: Ringkasan hari ini
  Given saya sudah login sebagai HR
  When saya membuka Dashboard
  Then saya melihat sudah IN, tepat waktu, terlambat, belum OUT, dan belum IN
  And saya melihat daftar terlambat, belum OUT, dan belum IN
```

#### US-29 — Melihat tren 7 hari

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** melihat tren kehadiran seminggu
> **Agar** saya dapat menilai pola keterlambatan

| Atribut | Nilai |
|---|---|
| Prioritas | S |
| Poin | 2 |
| FR | FR-DSH-03 |
| UC | UC-17 |

```gherkin
Scenario: Tren tujuh hari
  Given saya sudah login sebagai HR
  When saya membuka Dashboard
  Then grafik menampilkan 7 titik tanggal berurutan
  And setiap titik memuat sudah_in dan terlambat
```

#### US-30 — Angka dashboard konsisten

> **Sebagai** HR Admin yang sudah login
> **Saya ingin** angka dashboard sama dengan daftar absensi
> **Agar** saya percaya pada laporan

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 2 |
| FR | FR-DSH-05 |
| UC | UC-17 |

```gherkin
Scenario: Konsistensi
  Given saya sudah login sebagai HR
  And tanggal D memiliki 1 absensi dan 2 karyawan ACTIVE
  When saya membuka Dashboard tanggal D
  Then sudah_in = 1 dan belum_in = 1
  And daftar absensi tanggal D juga memuat 1 baris
```

#### US-31 — Tidak ada sukses palsu

> **Sebagai** Employee yang sudah login
> **Saya ingin** hanya melihat status berhasil bila server benar-benar menyimpan
> **Agar** saya tidak tercatat bohong

| Atribut | Nilai |
|---|---|
| Prioritas | M |
| Poin | 3 |
| FR | NFR-08 (ATT-08) |
| UC | UC-11 (A9), UC-12 (A4) |

```gherkin
Scenario: Jaringan gagal saat IN
  Given saya sudah login
  When saya menekan IN dan koneksi terputus
  Then muncul pesan tidak bisa terhubung ke server
  And status lokal tetap BELUM_IN
  And tidak ada tanda berhasil

Scenario: Server membalas 500
  Given saya sudah login
  When server membalas 500
  Then muncul pesan kesalahan server
  And status lokal tidak berubah
```

#### US-32 — Pesan radius yang informatif

> **Sebagai** Employee yang sudah login
> **Saya ingin** tahu jarak saya terhadap office
> **Agar** saya dapat mendekat dan mencoba lagi

| Atribut | Nilai |
|---|---|
| Prioritas | S |
| Poin | 3 |
| FR | FR-ATT-10, FR-ATT-11 |
| UC | UC-11 (A4, A5) |

```gherkin
Scenario: Di luar radius
  Given saya sudah login sebagai Employee
  And saya check-in dari luar radius
  When server menolak
  Then pesan memuat nama office, jarak saya, dan radius maksimum

Scenario: Tidak ada office aktif
  Given saya sudah login sebagai Employee
  And semua office dinonaktifkan
  When saya check-in
  Then respons 409 NO_OFFICE
  And saya diarahkan menghubungi HR
```

---

## 4. Definition of Ready (DoR)

Sebuah story siap dikerjakan bila:

- [ ] Memiliki ID dan format "Sebagai / Saya ingin / Agar".
- [ ] Memuat minimal 1 skenario Gherkin.
- [ ] Merujuk minimal 1 FR di `06-Functional-Requirement.md`.
- [ ] Menyebutkan perilaku saat belum login atau saat 401.
- [ ] Tidak bergantung pada fitur yang belum ada (mis. mobile belum tersedia → diuji via API).
- [ ] Story point ≤ 8.

## 5. Definition of Done (DoD)

- [ ] Kode ada di `app/`, `routes/`, atau `public/` dan konsisten dengan pola yang ada.
- [ ] Endpoint terlindungi middleware `jwt.auth` (+ `role:` bila perlu).
- [ ] Semua cabang error memakai kode yang terdaftar di `01-SRS.md` §11.
- [ ] Tidak ada status lokal berubah saat respons bukan 2xx.
- [ ] `php artisan test` dijalankan dan hasilnya dilaporkan.
- [ ] Dokumen terkait (`01`–`08`) diperbarui bila perilaku berubah.
- [ ] Bukti uji (perintah + hasil) dicatat untuk UAT.

---

## 6. Rencana Sprint 17–19 November 2026

Asumsi: 1 pengembang, 3 hari kerja, kapasitas ±30 poin/hari efektif namun dipakai 92 poin karena banyak story sudah berjalan.

### Sprint 1 — 17 November (Fondasi & Akses)

| Story | Poin | Fokus |
|---|---|---|
| US-01 Login | 5 | Auth gate |
| US-02 Profil | 2 | `/api/me` |
| US-03 Logout | 1 | Klien |
| US-04 Sesi berakhir | 2 | 401 handling |
| US-05 Web HR hanya HR | 2 | Guard klien |
| US-06 Tambah karyawan | 5 | Transaksi + kode otomatis |
| US-07 Cari karyawan | 3 | Filter + paginasi |
| US-08 Ubah karyawan | 3 | Validasi + duplikasi |
| **Total** | **23** | EP-01, EP-02 |

### Sprint 2 — 18 November (Absensi Inti)

| Story | Poin | Fokus |
|---|---|---|
| US-09 Nonaktifkan karyawan | 2 | Status gate |
| US-10 Hapus karyawan | 3 | Cascade + foto |
| US-11 Reset password | 2 | Kredensial |
| US-12 Daftar akun HR | 2 | `/api/admins` |
| US-13 Tambah akun HR | 3 | Counter HR |
| US-14 Lihat office | 1 | Read-only |
| US-15 Tambah office | 3 | Validasi radius |
| US-16 Ubah office | 2 | is_active |
| US-17 Status hari ini | 3 | State turunan |
| US-18 Check-in | 8 | Foto + GPS + radius |
| **Total** | **29** | EP-02..EP-05 |

### Sprint 3 — 19 November (Riwayat, Dashboard, Bukti)

| Story | Poin | Fokus |
|---|---|---|
| US-19 IN kedua ditolak | 2 | Unique guard |
| US-20 Check-out | 5 | Update guard |
| US-21 OUT tanpa IN | 2 | State check |
| US-22 OUT kedua | 2 | Race guard |
| US-23 Riwayat pribadi | 3 | Forced employee_id |
| US-24 Privasi data | 2 | 403 |
| US-25 Filter absensi HR | 5 | dateRange + status |
| US-26 Foto bukti | 3 | Protected file |
| US-27 Ekspor CSV | 3 | Klien |
| US-28 Ringkasan dashboard | 3 | Agregasi |
| US-29 Tren 7 hari | 2 | Loop tanggal |
| US-30 Konsistensi angka | 2 | Verifikasi |
| US-31 Tidak sukses palsu | 3 | Klien |
| US-32 Pesan radius | 3 | Extra error |
| **Total** | **40** | EP-05..EP-07 |

### 6.1 Ringkasan Kapasitas

| Hari | Story | Poin | Kumulatif |
|---|---|---|---|
| 17 Nov | 8 | 23 | 23 |
| 18 Nov | 10 | 29 | 52 |
| 19 Nov | 14 | 40 | 92 |

### 6.2 Risiko Jadwal

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Mobile belum ada | US-18..US-22 hanya teruji via API | Siapkan koleksi request/Postman sebagai bukti |
| UAT belum dijadwalkan | Klaim "siap" tanpa bukti | Sisipkan sesi UAT 30 menit di akhir hari ke-3 |
| Perubahan requirement mendadak | Scope bertambah | Semua tambahan masuk backlog, bukan sprint berjalan |

---

## 7. Matriks Story × FR × UC

| Story | FR | UC | Poin |
|---|---|---|---|
| US-01 | FR-AUTH-01, 02, 07 | UC-01 | 5 |
| US-02 | FR-AUTH-06 | UC-02 | 2 |
| US-03 | FR-AUTH-08 | UC-01 | 1 |
| US-04 | FR-AUTH-04, 08 | UC-01 | 2 |
| US-05 | FR-WEB-05, FR-AUTH-05 | UC-01 | 2 |
| US-06 | FR-EMP-01, 02, 03, 12 | UC-03 | 5 |
| US-07 | FR-EMP-06, 07 | UC-04 | 3 |
| US-08 | FR-EMP-08 | UC-05 | 3 |
| US-09 | FR-EMP-09, FR-ATT-12 | UC-05 | 2 |
| US-10 | FR-EMP-10 | UC-06 | 3 |
| US-11 | FR-EMP-11 | UC-07 | 2 |
| US-12 | FR-ADM-01 | UC-08 | 2 |
| US-13 | FR-ADM-02, 03, 04 | UC-08 | 3 |
| US-14 | FR-OFF-01 | UC-09 | 1 |
| US-15 | FR-OFF-02 | UC-09 | 3 |
| US-16 | FR-OFF-03 | UC-09 | 2 |
| US-17 | FR-ATT-01 | UC-10 | 3 |
| US-18 | FR-ATT-02, 07, 08, 09, 10 | UC-11 | 8 |
| US-19 | FR-ATT-03, 13 | UC-11 | 2 |
| US-20 | FR-ATT-05 | UC-12 | 5 |
| US-21 | FR-ATT-04 | UC-12 | 2 |
| US-22 | FR-ATT-06 | UC-12 | 2 |
| US-23 | FR-HIS-01, 04, 07 | UC-13 | 3 |
| US-24 | FR-HIS-02, 08 | UC-13, UC-15 | 2 |
| US-25 | FR-HIS-03..07 | UC-14 | 5 |
| US-26 | FR-HIS-08 | UC-15 | 3 |
| US-27 | FR-HIS-09 | UC-16 | 3 |
| US-28 | FR-DSH-01, 02 | UC-17 | 3 |
| US-29 | FR-DSH-03 | UC-17 | 2 |
| US-30 | FR-DSH-05 | UC-17 | 2 |
| US-31 | NFR-08 | UC-11, UC-12 | 3 |
| US-32 | FR-ATT-10, 11 | UC-11 | 3 |

**Cakupan:** seluruh 63 FR terpetakan. FR yang tidak muncul eksplisit di kolom di atas tercakup sebagai kriteria tambahan pada story terkait:

| FR | Story penanggung |
|---|---|
| FR-EMP-04, FR-EMP-05 | US-06 (input manual + duplikasi) |
| FR-OFF-04 | US-14 (office seed tampil di daftar) |
| FR-ATT-14, FR-ATT-15 | US-18 (foto wajib, validasi berkas) |
| FR-DSH-04 | US-28 (validasi tanggal dashboard) |
| FR-HIS-05 | US-25 (validasi rentang) |
| FR-WEB-01, FR-WEB-02, FR-WEB-03, FR-WEB-04 | US-05, US-06, US-27 (kerangka Web, navigasi, dialog kredensial, toast) |

---

## 8. Catatan Backlog di Luar Sprint

| Ide | Alasan ditunda |
|---|---|
| Aplikasi mobile native | Belum ada di repo; butuh keputusan tech stack |
| Koreksi absensi oleh HR | Mengubah data historis, butuh kebijakan audit |
| Shift malam | Mengubah model `work_date` |
| Notifikasi pengingat absen | Butuh kanal push/WA |
| Ekspor PDF | Di luar scope dokumen awal |
| Rate limit login | Perbaikan keamanan, bukan fitur demo |