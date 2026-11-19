# Traceability Matrix (RTM)
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi | 1.0 |
| Tanggal | 18 November 2026 |
| Cakupan | 63 FR · 17 UC · 61 TC · 15 UAT |
| Sumber FR | `01-SRS.md` §3, `06-Functional-Requirement.md` |
| Status eksekusi | **Sudah dieksekusi 18 November 2026** — 61/61 TC Lulus, sehingga seluruh 63 FR berstatus `Terverifikasi` |

> **Legenda status:** `Terverifikasi` = minimal satu test case penutup FR tersebut berstatus Lulus pada eksekusi 18 November 2026 (bukti: `docs/Project A - QA Test Cases.xlsx`). Status ini menyatakan FR *terverifikasi oleh tes*, bukan *diterima pengguna* — penerimaan ada di `11-UAT.md`.
>
> Matriks ini menjawab tiga pertanyaan audit: **Apakah setiap kebutuhan punya tes? Apakah setiap tes menunjuk kebutuhan? Apakah ada kebutuhan yang hanya "diuji" oleh asumsi?**

---

## 1. Ringkasan Cakupan

| Modul | FR | FR punya TC | FR punya UAT | TC terkait |
|---|---|---|---|---|
| AUTH | 9 | 9 | 6 | `TC-AUTH-01` … `TC-AUTH-09`, `TC-EMP-01`, `TC-OFF-04` |
| EMP | 12 | 12 | 5 | `TC-EMP-01` … `TC-EMP-15`, `TC-AUTH-04` |
| ADM | 4 | 4 | 3 | `TC-ADM-01` … `TC-ADM-03`, `TC-EMP-01` |
| OFF | 4 | 4 | 4 | `TC-OFF-01` … `TC-OFF-06` |
| ATT | 15 | 15 | 10 | `TC-ATT-01` … `TC-ATT-14`, `TC-EMP-12`, `TC-OFF-06`, `TC-AUTH-04` |
| HIS | 9 | 9 | 4 | `TC-HIS-01` … `TC-HIS-10`, `TC-AUTH-07` |
| DSH | 5 | 5 | 4 | `TC-DSH-01`, `TC-DSH-02`, `TC-HIS-10` |
| WEB | 5 | 5 | 3 | `TC-WEB-01`, `TC-WEB-02`, `TC-AUTH-09` |
| **Total** | **63** | **63 (100%)** | **39 (61,9%)** | **61 TC** |

**Kesimpulan cakupan:**

- **Tidak ada FR tanpa test case** — 100% requirement dapat diverifikasi.
- **UAT tidak mencakup semua FR** — hal ini disengaja: UAT menguji alur bisnis utama (**39 FR**), sisanya diuji pada level sistem. FR yang hanya punya TC tercantum di §4.
- **Tidak ada TC tanpa FR** — setiap test case menunjuk minimal satu kebutuhan, kecuali `TC-ATT-13` (aturan waktu) dan `TC-AUTH-09`, `TC-WEB-01`, `TC-WEB-02` (perilaku antarmuka) yang menunjuk NFR.

---

## 2. Matriks per Modul

### 2.1 AUTH — Autentikasi & Otorisasi

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-AUTH-00 | M | UC-01 | TC-AUTH-01, TC-AUTH-06 | UAT-01 | Terverifikasi |
| FR-AUTH-01 | M | UC-01 | TC-EMP-01, TC-AUTH-02 | UAT-02 | Terverifikasi |
| FR-AUTH-02 | M | UC-01 | TC-AUTH-03, TC-AUTH-02 | — | Terverifikasi |
| FR-AUTH-03 | M | UC-01 | TC-AUTH-04 | — | Terverifikasi |
| FR-AUTH-04 | M | UC-01 | TC-AUTH-01, TC-AUTH-05 | UAT-10 | Terverifikasi |
| FR-AUTH-05 | M | UC-01, UC-02 | TC-AUTH-07, TC-AUTH-06, TC-OFF-04 | UAT-12 | Terverifikasi |
| FR-AUTH-06 | M | UC-02 | TC-EMP-01, TC-AUTH-08 | — | Terverifikasi |
| FR-AUTH-07 | M | UC-01 | TC-EMP-01, TC-AUTH-05 | UAT-02 | Terverifikasi |
| FR-AUTH-08 | M | UC-01 | TC-AUTH-05, TC-AUTH-09 | UAT-10, UAT-11 | Terverifikasi |

### 2.2 EMP — Manajemen Karyawan

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-EMP-01 | M | UC-03 | TC-EMP-02, TC-EMP-08 | UAT-02 | Terverifikasi |
| FR-EMP-02 | S | UC-03 | TC-EMP-02, TC-EMP-03 | UAT-02 | Terverifikasi |
| FR-EMP-03 | M | UC-03 | TC-EMP-01, TC-EMP-02 | UAT-02 | Terverifikasi |
| FR-EMP-04 | S | UC-03 | TC-EMP-06, TC-EMP-07, TC-EMP-11 | — | Terverifikasi |
| FR-EMP-05 | M | UC-03 | TC-EMP-04, TC-EMP-05 | — | Terverifikasi |
| FR-EMP-06 | M | UC-04 | TC-EMP-09 | UAT-02 | Terverifikasi |
| FR-EMP-07 | M | UC-04 | TC-EMP-14, TC-EMP-10 | — | Terverifikasi |
| FR-EMP-08 | M | UC-05 | TC-EMP-11 | — | Terverifikasi |
| FR-EMP-09 | M | UC-05 | TC-AUTH-04, TC-EMP-12 | — | Terverifikasi |
| FR-EMP-10 | S | UC-06 | TC-EMP-14, TC-EMP-15 | — | Terverifikasi |
| FR-EMP-11 | S | UC-07 | TC-EMP-13 | — | Terverifikasi |
| FR-EMP-12 | M | UC-03 | TC-EMP-01, TC-EMP-02 | UAT-02 | Terverifikasi |

### 2.3 ADM — Akun HR

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-ADM-01 | S | UC-08 | TC-ADM-03 | UAT-14 | Terverifikasi |
| FR-ADM-02 | S | UC-08 | TC-EMP-01, TC-ADM-01 | UAT-14 | Terverifikasi |
| FR-ADM-03 | M | UC-08 | TC-EMP-01, TC-ADM-02 | — | Terverifikasi |
| FR-ADM-04 | M | UC-08 | TC-EMP-01, TC-ADM-01 | UAT-14 | Terverifikasi |

### 2.4 OFF — Office & Radius

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-OFF-01 | M | UC-09 | TC-OFF-04 | UAT-13 | Terverifikasi |
| FR-OFF-02 | M | UC-09 | TC-OFF-01, TC-OFF-02, TC-OFF-03 | UAT-13 | Terverifikasi |
| FR-OFF-03 | M | UC-09 | TC-OFF-04, TC-OFF-05 | UAT-13 | Terverifikasi |
| FR-OFF-04 | M | UC-09 | TC-OFF-01 | UAT-03 | Terverifikasi |

### 2.5 ATT — Absensi

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-ATT-01 | M | UC-10 | TC-ATT-07, TC-ATT-08 | UAT-03 | Terverifikasi |
| FR-ATT-02 | M | UC-11 | TC-ATT-01 | UAT-03 | Terverifikasi |
| FR-ATT-03 | M | UC-11 | TC-ATT-02 | UAT-04 | Terverifikasi |
| FR-ATT-04 | M | UC-12 | TC-ATT-03 | — | Terverifikasi |
| FR-ATT-05 | M | UC-12 | TC-ATT-04 | UAT-05 | Terverifikasi |
| FR-ATT-06 | M | UC-12 | TC-ATT-05 | UAT-06 | Terverifikasi |
| FR-ATT-07 | M | UC-11 | TC-ATT-01, TC-ATT-13 | UAT-03 | Terverifikasi |
| FR-ATT-08 | M | UC-11 | TC-ATT-06 | UAT-03 | Terverifikasi |
| FR-ATT-09 | M | UC-11 | TC-ATT-06, TC-ATT-09 | UAT-03 | Terverifikasi |
| FR-ATT-10 | M | UC-11 | TC-ATT-06 | UAT-09 | Terverifikasi |
| FR-ATT-11 | M | UC-11 | TC-OFF-06 | — | Terverifikasi |
| FR-ATT-12 | M | UC-11 | TC-AUTH-04, TC-EMP-12 | — | Terverifikasi |
| FR-ATT-13 | M | UC-11 | TC-ATT-02, TC-ATT-14 | UAT-04 | Terverifikasi |
| FR-ATT-14 | S | UC-11 | TC-ATT-12 | — | Terverifikasi |
| FR-ATT-15 | S | UC-11 | TC-ATT-10, TC-ATT-11 | — | Terverifikasi |

### 2.6 HIS — Riwayat & Filter

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-HIS-01 | M | UC-13 | TC-HIS-07 | UAT-08 | Terverifikasi |
| FR-HIS-02 | M | UC-13 | TC-AUTH-07 | UAT-08 | Terverifikasi |
| FR-HIS-03 | M | UC-14 | TC-HIS-10 | — | Terverifikasi |
| FR-HIS-04 | M | UC-14 | TC-HIS-10, TC-HIS-01 | — | Terverifikasi |
| FR-HIS-05 | M | UC-14 | TC-HIS-10, TC-HIS-02 | — | Terverifikasi |
| FR-HIS-06 | M | UC-14 | TC-HIS-10, TC-HIS-03, TC-HIS-04, TC-HIS-05 | — | Terverifikasi |
| FR-HIS-07 | S | UC-14 | TC-HIS-10, TC-HIS-06 | — | Terverifikasi |
| FR-HIS-08 | S | UC-15 | TC-AUTH-07, TC-HIS-08 | UAT-08 | Terverifikasi |
| FR-HIS-09 | C | UC-16 | TC-HIS-09 | UAT-15 | Terverifikasi |

### 2.7 DSH — Dashboard

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-DSH-01 | M | UC-17 | TC-HIS-10, TC-DSH-02 | UAT-07 | Terverifikasi |
| FR-DSH-02 | M | UC-17 | TC-HIS-10, TC-DSH-02 | UAT-07 | Terverifikasi |
| FR-DSH-03 | S | UC-17 | TC-HIS-10, TC-DSH-02 | UAT-07 | Terverifikasi |
| FR-DSH-04 | M | UC-17 | TC-DSH-01 | — | Terverifikasi |
| FR-DSH-05 | M | UC-17 | TC-HIS-10, TC-DSH-02 | UAT-07 | Terverifikasi |

### 2.8 WEB — Antarmuka HR

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-WEB-01 | M | UC-01 | TC-WEB-01 | UAT-01 | Terverifikasi |
| FR-WEB-02 | M | UC-01 | TC-WEB-01 | — | Terverifikasi |
| FR-WEB-03 | S | UC-03 | TC-WEB-02 | UAT-02 | Terverifikasi |
| FR-WEB-04 | C | UC-01 | TC-WEB-02 | — | Terverifikasi |
| FR-WEB-05 | M | UC-01 | TC-AUTH-09 | UAT-12 | Terverifikasi |

---

## 3. Matriks Use Case → Test Case

| UC | Nama | Test Case | UAT |
|---|---|---|---|
| UC-01 | Login & Sesi | TC-EMP-01, TC-AUTH-02, TC-AUTH-05, TC-AUTH-09 | UAT-01, UAT-10, UAT-12 |
| UC-02 | Lihat Profil | TC-AUTH-08 | — |
| UC-03 | Tambah Karyawan | TC-EMP-01, `TC-EMP-02` … `TC-EMP-08` | UAT-02 |
| UC-04 | Lihat Daftar Karyawan | TC-EMP-09, TC-EMP-10 | UAT-02 |
| UC-05 | Ubah Karyawan | TC-EMP-11, TC-EMP-12 | — |
| UC-06 | Hapus Karyawan | TC-EMP-14, TC-EMP-15 | — |
| UC-07 | Reset Password | TC-EMP-13 | — |
| UC-08 | Kelola Akun HR | TC-ADM-01, TC-ADM-02, TC-ADM-03 | UAT-14 |
| UC-09 | Kelola Office | `TC-OFF-01` … `TC-OFF-05` | UAT-13 |
| UC-10 | Status Hari Ini | TC-ATT-07, TC-ATT-08 | UAT-03 |
| UC-11 | Check-in | TC-ATT-01, TC-ATT-02, TC-ATT-06, TC-OFF-06, `TC-ATT-09` … `TC-ATT-13` | UAT-03, UAT-04, UAT-09 |
| UC-12 | Check-out | TC-ATT-03, TC-ATT-04, TC-ATT-05 | UAT-05, UAT-06 |
| UC-13 | Riwayat Pribadi | TC-AUTH-07, TC-HIS-07 | UAT-08 |
| UC-14 | Daftar & Filter Absensi | TC-HIS-10, `TC-HIS-01` … `TC-HIS-06` | UAT-07 |
| UC-15 | Lihat Foto Bukti | TC-AUTH-07, TC-HIS-08 | UAT-08 |
| UC-16 | Ekspor CSV | TC-HIS-09 | UAT-15 |
| UC-17 | Dashboard | TC-HIS-10, TC-DSH-01, TC-DSH-02 | UAT-07 |

**Cakupan UC:** 17/17 memiliki minimal satu test case.

---

## 4. FR yang Hanya Diuji Test Case (Tanpa UAT)

| FR | Alasan tidak masuk UAT | TC |
|---|---|---|
| FR-AUTH-02 | Kasus negatif login tidak perlu didemokan ke pengguna | TC-AUTH-03, TC-AUTH-02 |
| FR-AUTH-03 | Sensitif; cukup diuji sistem (nonaktifkan akun) | TC-AUTH-04 |
| FR-AUTH-06 | Profil hanya informasi pendukung | TC-AUTH-08 |
| FR-EMP-04, 05 | Validasi input & duplikasi bersifat teknis | `TC-EMP-04` … `TC-EMP-07`, TC-EMP-11 |
| FR-EMP-07, 08, 09, 10, 11 | Operasional HR, bukan alur demo utama | TC-EMP-14, `TC-EMP-10` … `TC-EMP-15` |
| FR-ADM-03 | Kasus negatif duplikasi email | TC-ADM-02 |
| FR-ATT-04, 11, 14, 15 | Kondisi tepi (OUT tanpa IN, tanpa office, foto yatim, berkas besar) | TC-ATT-03, TC-OFF-06, `TC-ATT-10` … `TC-ATT-12` |
| FR-HIS-05, 06, 07 | Validasi filter & paginasi | `TC-HIS-02` … `TC-HIS-06` |
| FR-DSH-04 | Validasi format tanggal | TC-DSH-01 |
| FR-WEB-02, 04 | Perilaku antarmuka pendukung | TC-WEB-01, TC-WEB-02 |

**Catatan:** daftar ini bukan celah berbahaya, melainkan pembagian level pengujian. Bila mentor ingin UAT menutup semua FR, tambahkan skenario pada `11-UAT.md` — jangan menghapus TC.

---

## 5. NFR → Bukti

| NFR | Bukti | Cara verifikasi |
|---|---|---|
| NFR-01, 02 | TC-ATT-01, TC-ATT-04 (catat durasi), TC-HIS-10 | Ukur waktu respons saat eksekusi |
| NFR-03 | TC-ATT-02 | Kirim dua IN bersamaan; satu 201, satu 409 |
| NFR-04 | TC-EMP-01, TC-EMP-02 | Periksa DB: `password_hash` berawalan `$2`; tidak ada plaintext |
| NFR-05 | TC-AUTH-01, TC-AUTH-06, TC-AUTH-09 | Seluruh endpoint terproteksi |
| NFR-06 | TC-AUTH-07, TC-HIS-08 | 403 untuk pihak lain |
| NFR-07 | Tinjauan berkas | `.env` tidak ikut ter-commit |
| NFR-08 | TC-AUTH-09, TC-WEB-02 | Tidak ada status sukses saat gagal |
| NFR-09 | TC-ATT-02, TC-ATT-14 | Unique constraint |
| NFR-10 | TC-WEB-01 | Loading, error, empty state ada |
| NFR-11 | TC-WEB-01 | Alur inti ≤ 3 klik (manual) |
| NFR-12 | Tinjauan struktur | `routes/`, `app/Http/Middleware/`, `app/Services/` terpisah |
| NFR-13 | Eksekusi `composer install && php artisan serve` | Berhasil di PHP 8.5.12 / Laravel 10 |
| NFR-14 | TC-WEB-02 (error 500) | Log server mencatat |
| NFR-15 | `php artisan test` | Dijalankan dan hasilnya dicatat |
| NFR-16 | TC-AUTH-09, TC-WEB-01 | Pesan berbahasa Indonesia |
| NFR-17 | TC-ATT-13 | Batas waktu konsisten dengan `Asia/Jakarta` |

---

## 6. Aturan Pemeliharaan Matriks

1. **FR baru** → wajib menambah minimal satu TC dan satu baris di sini.
2. **TC baru** → wajib menunjuk FR; bila menguji NFR, tulis kode NFR.
3. **TC dihapus** → periksa apakah ada FR yang kehilangan bukti; bila ya, ganti TC pengganti.
4. **Defect diperbaiki** → tambahkan TC regresi dan hubungkan ke FR yang sama.
5. **Status** hanya diubah setelah eksekusi nyata dengan bukti tersimpan.

---

## 7. Perintah Pemeriksaan Cepat

```bash
# 1. Jalankan seluruh tes otomatis
php artisan test

# 2. Hitung FR di dokumen (harus 63)
grep -o 'FR-[A-Z]*-[0-9][0-9]' docs/project-a/01-SRS.md | sort -u | wc -l
grep -o 'FR-[A-Z]*-[0-9][0-9]' docs/project-a/06-Functional-Requirement.md | sort -u | wc -l

# 3. Hitung test case (harus 61)
grep -o 'TC-[A-Z]*-[0-9][0-9]' docs/project-a/10-Test-Case.md | sort -u | wc -l

# 4. Hitung UAT (harus 15)
grep -o 'UAT-[0-9][0-9]' docs/project-a/11-UAT.md | sort -u | wc -l
```

> Pada PowerShell, gunakan `Select-String` + `Measure-Object` atau jalankan melalui Git Bash/WSL.