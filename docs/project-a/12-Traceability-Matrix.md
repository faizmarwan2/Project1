# Traceability Matrix (RTM)
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi | 1.0 |
| Tanggal | 18 November 2026 |
| Cakupan | 63 FR · 17 UC · 61 TC · 15 UAT |
| Sumber FR | `01-SRS.md` §3, `06-Functional-Requirement.md` |
| Status eksekusi | **Belum dijalankan** (seluruh kolom Status = `Belum`) |

> Matriks ini menjawab tiga pertanyaan audit: **Apakah setiap kebutuhan punya tes? Apakah setiap tes menunjuk kebutuhan? Apakah ada kebutuhan yang hanya "diuji" oleh asumsi?**

---

## 1. Ringkasan Cakupan

| Modul | FR | FR punya TC | FR punya UAT | TC terkait |
|---|---|---|---|---|
| AUTH | 9 | 9 | 6 | TC-01, 02, 12, 14..18 |
| EMP | 12 | 12 | 5 | TC-01, 11, 13, 19..31 |
| ADM | 4 | 4 | 3 | TC-01, 32..34 |
| OFF | 4 | 4 | 4 | TC-35..40 |
| ATT | 15 | 15 | 10 | TC-03..08, 11, 29, 40..48 |
| HIS | 9 | 9 | 4 | TC-09, 10, 49..57 |
| DSH | 5 | 5 | 4 | TC-10, 58, 59 |
| WEB | 5 | 5 | 3 | TC-17, 60, 61 |
| **Total** | **63** | **63 (100%)** | **39 (61,9%)** | **61 TC** |

**Kesimpulan cakupan:**

- **Tidak ada FR tanpa test case** — 100% requirement dapat diverifikasi.
- **UAT tidak mencakup semua FR** — hal ini disengaja: UAT menguji alur bisnis utama (**39 FR**), sisanya diuji pada level sistem. FR yang hanya punya TC tercantum di §4.
- **Tidak ada TC tanpa FR** — setiap test case menunjuk minimal satu kebutuhan, kecuali TC-47/48 (aturan waktu) dan TC-17/60/61 (perilaku antarmuka) yang menunjuk NFR.

---

## 2. Matriks per Modul

### 2.1 AUTH — Autentikasi & Otorisasi

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-AUTH-00 | M | UC-01 | TC-02, TC-16 | UAT-01 | Belum |
| FR-AUTH-01 | M | UC-01 | TC-01, TC-14 | UAT-02 | Belum |
| FR-AUTH-02 | M | UC-01 | TC-12, TC-14 | — | Belum |
| FR-AUTH-03 | M | UC-01 | TC-11 | — | Belum |
| FR-AUTH-04 | M | UC-01 | TC-02, TC-15 | UAT-10 | Belum |
| FR-AUTH-05 | M | UC-01, UC-02 | TC-09, TC-16, TC-38 | UAT-12 | Belum |
| FR-AUTH-06 | M | UC-02 | TC-01, TC-18 | — | Belum |
| FR-AUTH-07 | M | UC-01 | TC-01, TC-15 | UAT-02 | Belum |
| FR-AUTH-08 | M | UC-01 | TC-15, TC-17 | UAT-10, UAT-11 | Belum |

### 2.2 EMP — Manajemen Karyawan

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-EMP-01 | M | UC-03 | TC-19, TC-25 | UAT-02 | Belum |
| FR-EMP-02 | S | UC-03 | TC-19, TC-20 | UAT-02 | Belum |
| FR-EMP-03 | M | UC-03 | TC-01, TC-19 | UAT-02 | Belum |
| FR-EMP-04 | S | UC-03 | TC-23, TC-24, TC-28 | — | Belum |
| FR-EMP-05 | M | UC-03 | TC-21, TC-22 | — | Belum |
| FR-EMP-06 | M | UC-04 | TC-26 | UAT-02 | Belum |
| FR-EMP-07 | M | UC-04 | TC-13, TC-27 | — | Belum |
| FR-EMP-08 | M | UC-05 | TC-28 | — | Belum |
| FR-EMP-09 | M | UC-05 | TC-11, TC-29 | — | Belum |
| FR-EMP-10 | S | UC-06 | TC-13, TC-31 | — | Belum |
| FR-EMP-11 | S | UC-07 | TC-30 | — | Belum |
| FR-EMP-12 | M | UC-03 | TC-01, TC-19 | UAT-02 | Belum |

### 2.3 ADM — Akun HR

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-ADM-01 | S | UC-08 | TC-34 | UAT-14 | Belum |
| FR-ADM-02 | S | UC-08 | TC-01, TC-32 | UAT-14 | Belum |
| FR-ADM-03 | M | UC-08 | TC-01, TC-33 | — | Belum |
| FR-ADM-04 | M | UC-08 | TC-01, TC-32 | UAT-14 | Belum |

### 2.4 OFF — Office & Radius

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-OFF-01 | M | UC-09 | TC-38 | UAT-13 | Belum |
| FR-OFF-02 | M | UC-09 | TC-35, TC-36, TC-37 | UAT-13 | Belum |
| FR-OFF-03 | M | UC-09 | TC-38, TC-39 | UAT-13 | Belum |
| FR-OFF-04 | M | UC-09 | TC-35 | UAT-03 | Belum |

### 2.5 ATT — Absensi

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-ATT-01 | M | UC-10 | TC-41, TC-42 | UAT-03 | Belum |
| FR-ATT-02 | M | UC-11 | TC-04 | UAT-03 | Belum |
| FR-ATT-03 | M | UC-11 | TC-05 | UAT-04 | Belum |
| FR-ATT-04 | M | UC-12 | TC-03 | — | Belum |
| FR-ATT-05 | M | UC-12 | TC-06 | UAT-05 | Belum |
| FR-ATT-06 | M | UC-12 | TC-07 | UAT-06 | Belum |
| FR-ATT-07 | M | UC-11 | TC-04, TC-47 | UAT-03 | Belum |
| FR-ATT-08 | M | UC-11 | TC-08 | UAT-03 | Belum |
| FR-ATT-09 | M | UC-11 | TC-08, TC-43 | UAT-03 | Belum |
| FR-ATT-10 | M | UC-11 | TC-08 | UAT-09 | Belum |
| FR-ATT-11 | M | UC-11 | TC-40 | — | Belum |
| FR-ATT-12 | M | UC-11 | TC-11, TC-29 | — | Belum |
| FR-ATT-13 | M | UC-11 | TC-05, TC-48 | UAT-04 | Belum |
| FR-ATT-14 | S | UC-11 | TC-46 | — | Belum |
| FR-ATT-15 | S | UC-11 | TC-44, TC-45 | — | Belum |

### 2.6 HIS — Riwayat & Filter

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-HIS-01 | M | UC-13 | TC-55 | UAT-08 | Belum |
| FR-HIS-02 | M | UC-13 | TC-09 | UAT-08 | Belum |
| FR-HIS-03 | M | UC-14 | TC-10 | — | Belum |
| FR-HIS-04 | M | UC-14 | TC-10, TC-49 | — | Belum |
| FR-HIS-05 | M | UC-14 | TC-10, TC-50 | — | Belum |
| FR-HIS-06 | M | UC-14 | TC-10, TC-51, TC-52, TC-53 | — | Belum |
| FR-HIS-07 | S | UC-14 | TC-10, TC-54 | — | Belum |
| FR-HIS-08 | S | UC-15 | TC-09, TC-56 | UAT-08 | Belum |
| FR-HIS-09 | C | UC-16 | TC-57 | UAT-15 | Belum |

### 2.7 DSH — Dashboard

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-DSH-01 | M | UC-17 | TC-10, TC-59 | UAT-07 | Belum |
| FR-DSH-02 | M | UC-17 | TC-10, TC-59 | UAT-07 | Belum |
| FR-DSH-03 | S | UC-17 | TC-10, TC-59 | UAT-07 | Belum |
| FR-DSH-04 | M | UC-17 | TC-58 | — | Belum |
| FR-DSH-05 | M | UC-17 | TC-10, TC-59 | UAT-07 | Belum |

### 2.8 WEB — Antarmuka HR

| FR | Pri | UC | Test Case | UAT | Status |
|---|---|---|---|---|---|
| FR-WEB-01 | M | UC-01 | TC-60 | UAT-01 | Belum |
| FR-WEB-02 | M | UC-01 | TC-60 | — | Belum |
| FR-WEB-03 | S | UC-03 | TC-61 | UAT-02 | Belum |
| FR-WEB-04 | C | UC-01 | TC-61 | — | Belum |
| FR-WEB-05 | M | UC-01 | TC-17 | UAT-12 | Belum |

---

## 3. Matriks Use Case → Test Case

| UC | Nama | Test Case | UAT |
|---|---|---|---|
| UC-01 | Login & Sesi | TC-01, TC-14, TC-15, TC-17 | UAT-01, UAT-10, UAT-12 |
| UC-02 | Lihat Profil | TC-18 | — |
| UC-03 | Tambah Karyawan | TC-01, TC-19..TC-25 | UAT-02 |
| UC-04 | Lihat Daftar Karyawan | TC-26, TC-27 | UAT-02 |
| UC-05 | Ubah Karyawan | TC-28, TC-29 | — |
| UC-06 | Hapus Karyawan | TC-13, TC-31 | — |
| UC-07 | Reset Password | TC-30 | — |
| UC-08 | Kelola Akun HR | TC-32, TC-33, TC-34 | UAT-14 |
| UC-09 | Kelola Office | TC-35..TC-39 | UAT-13 |
| UC-10 | Status Hari Ini | TC-41, TC-42 | UAT-03 |
| UC-11 | Check-in | TC-04, TC-05, TC-08, TC-40, TC-43..TC-47 | UAT-03, UAT-04, UAT-09 |
| UC-12 | Check-out | TC-03, TC-06, TC-07 | UAT-05, UAT-06 |
| UC-13 | Riwayat Pribadi | TC-09, TC-55 | UAT-08 |
| UC-14 | Daftar & Filter Absensi | TC-10, TC-49..TC-54 | UAT-07 |
| UC-15 | Lihat Foto Bukti | TC-09, TC-56 | UAT-08 |
| UC-16 | Ekspor CSV | TC-57 | UAT-15 |
| UC-17 | Dashboard | TC-10, TC-58, TC-59 | UAT-07 |

**Cakupan UC:** 17/17 memiliki minimal satu test case.

---

## 4. FR yang Hanya Diuji Test Case (Tanpa UAT)

| FR | Alasan tidak masuk UAT | TC |
|---|---|---|
| FR-AUTH-02 | Kasus negatif login tidak perlu didemokan ke pengguna | TC-12, TC-14 |
| FR-AUTH-03 | Sensitif; cukup diuji sistem (nonaktifkan akun) | TC-11 |
| FR-AUTH-06 | Profil hanya informasi pendukung | TC-18 |
| FR-EMP-04, 05 | Validasi input & duplikasi bersifat teknis | TC-21..TC-24, TC-28 |
| FR-EMP-07, 08, 09, 10, 11 | Operasional HR, bukan alur demo utama | TC-13, TC-27..TC-31 |
| FR-ADM-03 | Kasus negatif duplikasi email | TC-33 |
| FR-ATT-04, 11, 14, 15 | Kondisi tepi (OUT tanpa IN, tanpa office, foto yatim, berkas besar) | TC-03, TC-40, TC-44..TC-46 |
| FR-HIS-05, 06, 07 | Validasi filter & paginasi | TC-50..TC-54 |
| FR-DSH-04 | Validasi format tanggal | TC-58 |
| FR-WEB-02, 04 | Perilaku antarmuka pendukung | TC-60, TC-61 |

**Catatan:** daftar ini bukan celah berbahaya, melainkan pembagian level pengujian. Bila mentor ingin UAT menutup semua FR, tambahkan skenario pada `11-UAT.md` — jangan menghapus TC.

---

## 5. NFR → Bukti

| NFR | Bukti | Cara verifikasi |
|---|---|---|
| NFR-01, 02 | TC-04, TC-06 (catat durasi), TC-10 | Ukur waktu respons saat eksekusi |
| NFR-03 | TC-05 | Kirim dua IN bersamaan; satu 201, satu 409 |
| NFR-04 | TC-01, TC-19 | Periksa DB: `password_hash` berawalan `$2`; tidak ada plaintext |
| NFR-05 | TC-02, TC-16, TC-17 | Seluruh endpoint terproteksi |
| NFR-06 | TC-09, TC-56 | 403 untuk pihak lain |
| NFR-07 | Tinjauan berkas | `.env` tidak ikut ter-commit |
| NFR-08 | TC-17, TC-61 | Tidak ada status sukses saat gagal |
| NFR-09 | TC-05, TC-48 | Unique constraint |
| NFR-10 | TC-60 | Loading, error, empty state ada |
| NFR-11 | TC-60 | Alur inti ≤ 3 klik (manual) |
| NFR-12 | Tinjauan struktur | `routes/`, `middleware/`, `utils/` terpisah |
| NFR-13 | Eksekusi `npm install && npm start` | Berhasil di Node 22.13+ |
| NFR-14 | TC-61 (error 500) | Log server mencatat |
| NFR-15 | `npm test` | Dijalankan dan hasilnya dicatat |
| NFR-16 | TC-17, TC-60 | Pesan berbahasa Indonesia |
| NFR-17 | TC-47 | Batas waktu konsisten dengan `Asia/Jakarta` |

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
npm test

# 2. Hitung FR di dokumen (harus 63)
grep -o 'FR-[A-Z]*-[0-9][0-9]' docs/project-a/01-SRS.md | sort -u | wc -l
grep -o 'FR-[A-Z]*-[0-9][0-9]' docs/project-a/06-Functional-Requirement.md | sort -u | wc -l

# 3. Hitung test case (harus 61)
grep -o 'TC-[0-9][0-9]' docs/project-a/10-Test-Case.md | sort -u | wc -l

# 4. Hitung UAT (harus 15)
grep -o 'UAT-[0-9][0-9]' docs/project-a/11-UAT.md | sort -u | wc -l
```

> Pada PowerShell, gunakan `Select-String` + `Measure-Object` atau jalankan melalui Git Bash/WSL.