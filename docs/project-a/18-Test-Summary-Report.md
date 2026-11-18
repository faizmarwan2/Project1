# Test Summary Report (Template)
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi template | 1.0 |
| Tanggal | 18 November 2026 |
| Kode laporan | `QA-RPT-<YYYYMMDD>-<NN>` |
| Digunakan pada | Penutupan setiap siklus tes dan sebelum keputusan demo |
| Pemilik | QA Engineer |
| Penerima | Mentor, System Analyst, Developer |

> Berkas ini adalah **template**. Angka di §9 adalah contoh pengisian yang menyatakan **belum ada eksekusi** — bukan hasil nyata. Jangan menyalinnya sebagai laporan final tanpa mengganti isinya dengan data sebenarnya.

---

## 1. Kapan Laporan Ini Dibuat

```mermaid
flowchart LR
    A["Siklus tes dimulai"] --> B["Laporan harian<br/>§11"]
    B --> C{"Siklus<br/>selesai?"}
    C -- "belum" --> B
    C -- "ya" --> D["Susun laporan ringkas<br/>§2-§10"]
    D --> E{"Exit criteria<br/>terpenuhi?"}
    E -- "ya" --> F["Siap demo<br/>+ tanda tangan"]
    E -- "tidak" --> G["Tidak siap<br/>+ rencana perbaikan"]
    F --> H(["Arsip"])
    G --> H
```

| Waktu | Keluaran |
|---|---|
| Setiap akhir hari | Laporan harian (§11) |
| Akhir siklus | Laporan ringkas (§2–§10) |
| Sebelum demo | Verdict + tanda tangan (§10) |
| Setelah demo | Tambahan catatan temuan lapangan |

---

## 2. Identitas Laporan

| Field | Isi |
|---|---|
| Kode laporan | `QA-RPT-________-__` |
| Tanggal | |
| Siklus ke- | |
| Periode tes | ____ s/d ____ |
| Penyusun | |
| Build / commit | |
| Lingkungan | OS: ____ · Node: ____ · Browser: ____ |
| Database | `DB_PATH`: ____ (bersih? ya/tidak) |
| Dokumen acuan | `01-SRS.md` v____, `10-Test-Case.md` v____ |

---

## 3. Ringkasan Eksekusi

| Modul | TC tersedia | Dijalankan | Lulus | Gagal | Blocked | Belum | % eksekusi |
|---|---|---|---|---|---|---|---|
| AUTH | 8 | | | | | | |
| EMP | 16 | | | | | | |
| ADM | 3 | | | | | | |
| OFF | 6 | | | | | | |
| ATT | 16 | | | | | | |
| HIS | 11 | | | | | | |
| DSH | 3 | | | | | | |
| WEB | 3 | | | | | | |
| **Total** | **61** | | | | | | |

> Catatan: jumlah per modul mengikuti `10-Test-Case.md` §12 (TC dihitung sekali walau menutup beberapa modul).

---

## 4. Ringkasan Defect

| Severity | Ditemukan | Ditutup | Terbuka | Ditunda |
|---|---|---|---|---|
| S1 Kritis | | | | |
| S2 Tinggi | | | | |
| S3 Sedang | | | | |
| S4 Rendah | | | | |
| **Total** | | | | |

| ID | Judul | Severity | Status | FR | TC |
|---|---|---|---|---|---|
| | | | | | |

**Defect terbuka yang memengaruhi keputusan:**

| ID | Alasan belum ditutup | Workaround | Disetujui oleh |
|---|---|---|---|
| | | | |

---

## 5. Cakupan

| Ukuran | Nilai | Target | Status |
|---|---|---|---|
| FR memiliki minimal 1 TC | 63 / 63 | 100% | Terpenuhi (dari RTM, bukan eksekusi) |
| TC dieksekusi | __ / 61 | ≥ 95% | |
| Pass rate | __ % | ≥ 90% | |
| UAT dijalankan | __ / 15 | 15 | |
| Bukti tersimpan | __ / __ | 100% | |
| Security checklist dijalankan | __ / 44 | 100% untuk kategori A & B | |

---

## 6. Hasil UAT

| Status | Jumlah |
|---|---|
| Lulus | |
| Gagal | |
| Blocked | |
| Tidak dijalankan | |
| **Total** | **15** |

| Keputusan penguji | Pilihan |
|---|---|
| Diterima | ☐ |
| Diterima dengan catatan | ☐ |
| Ditolak | ☐ |

---

## 7. Status Risiko Saat Penutupan

| ID | Risiko | Tingkat awal | Tingkat akhir | Catatan |
|---|---|---|---|---|
| RISK-01 | Runtime Node < 22.13 | Kritis | | |
| RISK-02 | Tanpa `.env` (secret cadangan) | Kritis | | |
| RISK-18 | Mobile tidak ada | Kritis | | |
| | | | | |

Rujukan lengkap: `14-Risk-Register.md`.

---

## 8. Keterbatasan yang Diakui pada Siklus Ini

| Hal | Dampak pada kesimpulan |
|---|---|
| Aplikasi mobile tidak ada | Alur Employee hanya terbukti di level API, bukan di perangkat |
| UAT dijalankan internal (bila demikian) | Penerimaan pengguna belum sah |
| Uji beban tidak dilakukan | Klaim performa hanya berdasarkan sampel kecil |
| Uji penetrasi tidak dilakukan | Klaim keamanan terbatas pada checklist |
| Node belum memenuhi syarat | Seluruh hasil tertunda |

**Aturan:** keterbatasan **wajib** disebut. Laporan tanpa bagian ini dianggap tidak lengkap.

---

## 9. Contoh Pengisian — Kondisi Saat Ini (Belum Dieksekusi)

> Contoh ini menggambarkan keadaan sebenarnya saat dokumen dibuat. Berguna sebagai titik awal pengisian.

| Field | Isi |
|---|---|
| Kode laporan | `QA-RPT-20261118-00` |
| Tanggal | 2026-11-18 |
| Build | Branch `main`, commit `0925970` |
| Node | v20.18.0 — **tidak memenuhi** `>=22.13` |
| `.env` | Tidak ada |
| TC dijalankan | 0 / 61 |
| UAT dijalankan | 0 / 15 |
| Security checklist | 0 / 44 (baru tinjauan statis) |
| Keputusan | **Belum dapat diputuskan** |

**Alasan:** `require('node:sqlite')` gagal pada Node 20.18 (`ERR_UNKNOWN_BUILTIN_MODULE`), sehingga server tidak dapat dijalankan. Lihat RISK-01.

**Tindakan yang harus dilakukan lebih dulu:**

1. Pasang Node 22.13+.
2. Buat `.env` dari `.env.example`; isi `JWT_SECRET` acak dan `HR_PASSWORD` baru.
3. Jalankan `npm test` (10 tes) dan simpan keluaran.
4. Baru mulai eksekusi TC-01..TC-13.

---

## 10. Verdict & Tanda Tangan

### 10.1 Checklist Exit Criteria

| Kriteria | Ambang | Terpenuhi |
|---|---|---|
| TC dieksekusi | ≥ 95% | ☐ |
| Pass rate | ≥ 90% | ☐ |
| Defect S1 terbuka | 0 | ☐ |
| Defect S2 terbuka | ≤ 1 dengan workaround | ☐ |
| UAT prioritas tinggi lulus | 100% | ☐ |
| Bukti tersimpan | 100% | ☐ |
| Security kategori A & B lulus | 100% | ☐ |

### 10.2 Keputusan

| Pilihan | Arti |
|---|---|
| ☐ **Siap demo** | Semua kriteria terpenuhi |
| ☐ **Siap dengan catatan** | Kriteria utama terpenuhi; defect tertentu diterima dengan tenggat |
| ☐ **Tidak siap** | Ada kriteria gagal; perlu perbaikan & siklus ulang |

Alasan:

| Peran | Nama | Tanda tangan | Tanggal |
|---|---|---|---|
| QA Engineer | | | |
| System Analyst | | | |
| Developer | | | |
| Mentor / pemilik produk | | | |

---

## 11. Template Laporan Harian

```
QA-RPT-HARIAN  Tanggal: 2026-11-__   Build: ____________
Node: ______   DB: ______ (bersih: ya/tidak)

Dijalankan : __ TC
Lulus      : __
Gagal      : __  -> BUG-______ (S_), BUG-______ (S_)
Blocked    : __  -> alasan: ______
Security   : __ / 44

Defect baru hari ini:
  - BUG-______ : ______________________ (S_/P_)

Risiko berubah:
  - RISK-__ : ______ -> ______

Rencana besok:
  1. ______
  2. ______

Kendala:
  - ______
```

---

## 12. Penyimpanan & Penamaan

| Berkas | Nama | Lokasi usulan |
|---|---|---|
| Laporan siklus | `QA-RPT-YYYYMMDD-NN.md` | `docs/project-a/reports/` |
| Bukti TC | `TC-NN-<ringkas>.png` / `.json` | `docs/project-a/evidence/` |
| Bukti UAT | `UAT-NN-<ringkas>.mp4` | `docs/project-a/evidence/` |
| Log otomasi | `run-YYYYMMDD-HHMM.txt` | `docs/project-a/evidence/` |

**Aturan:** bukti disimpan bersama laporan, bukan di folder pribadi. Laporan tanpa bukti dianggap draf.

---

## 13. Hubungan dengan Dokumen Lain

| Dokumen | Peran |
|---|---|
| `09-Test-Plan.md` | Menetapkan strategi & exit criteria yang dinilai di sini |
| `10-Test-Case.md` | Sumber angka eksekusi |
| `11-UAT.md` | Sumber hasil penerimaan |
| `12-Traceability-Matrix.md` | Sumber cakupan FR |
| `13-Defect-Management.md` | Sumber daftar defect |
| `14-Risk-Register.md` | Sumber status risiko |
| `16-Security-Test-Checklist.md` | Sumber hasil keamanan |
| `17-Test-Automation.md` | Sumber hasil otomasi |

Dokumen ini juga menjadi **bukti untuk menutup GAP-03** (belum ada berkas bukti UAT) setelah diisi dengan hasil nyata.