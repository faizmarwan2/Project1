# Lembar UAT (User Acceptance Test)
## Project A — Workforce Attendance System

| Item | Nilai |
|---|---|
| Versi | 1.0 |
| Tanggal | 18 November 2026 |
| Skenario | 15 (UAT-01 … UAT-15) |
| Penguji | Mentor / perwakilan pengguna |
| Pendamping | QA Engineer, System Analyst |
| Status | **Sudah diisi dari eksekusi QA** — 14 Lulus, 1 Blocked (UAT-11), 0 Gagal |

> **Cara membaca lembar ini.** Kolom "Hasil aktual", "Status", dan "Bukti" diisi dari eksekusi nyata yang terdokumentasi di `10-Test-Case.md` dan `docs/Project A - QA Test Cases.xlsx` — bukan dari perkiraan. Kolom tanda tangan dan keputusan akhir **masih kosong** dan hanya boleh diisi pada sesi UAT resmi bersama penguji. Dengan demikian lembar ini mencatat *kesiapan* sistem, bukan keputusan penerimaan pengguna.
>
> **Cara membaca kolom Bukti.** Rujukan berawalan `TC-` adalah **test case fungsional** (`10-Test-Case.md`). Rujukan berbentuk `hasil-*.json#NAMA` adalah **satu butir eksekusi otomatis** di dalam berkas hasil tersebut — nama itu milik suite otomatis, bukan test case fungsional.

---

## 1. Tujuan UAT

Membuktikan bahwa sistem memenuhi kebutuhan pengguna nyata — bukan sekadar lolos test case teknis — dengan penekanan pada:

1. Semua fitur hanya dapat dipakai setelah login.
2. Karyawan dapat absen dengan bukti foto dan lokasi.
3. HR dapat memantau dan merekap kehadiran.
4. Data antar karyawan tidak saling bocor.

---

## 2. Peserta

| Peran | Nama | Instansi/Divisi | Kehadiran |
|---|---|---|---|
| Penguji utama | | | |
| Perwakilan HR | | | |
| Perwakilan karyawan | | | |
| QA Engineer | | | |
| System Analyst | | | |
| Notulis | | | |

---

## 3. Lingkungan & Persiapan

| Item | Nilai | Terpenuhi |
|---|---|---|
| Server berjalan (`GET /health` = 200) | | ☐ |
| Database bersih + seed HR & office | | ☐ |
| Akun HR tersedia | | ☐ |
| Akun karyawan uji (2 orang) tersedia | | ☐ |
| Ponsel dengan GPS & kamera | | ☐ |
| Browser desktop | | ☐ |
| Proyektor/layar untuk demo | | ☐ |
| Folder bukti `uat-evidence/` | | ☐ |

**Catatan penting:** aplikasi mobile **belum ada di repo**. Alur karyawan (UAT-03..UAT-06, UAT-09, UAT-11) dijalankan dengan **klien API** (curl/Postman) atau Web sementara, dan hal ini **harus dijelaskan kepada penguji sebelum sesi dimulai**.

---

## 4. Skenario UAT

### UAT-01 — Akses tanpa login ditolak

| Atribut | Detail |
|---|---|
| FR | FR-AUTH-00, 04 |
| Aktor | Penguji |
| Prakondisi | Tidak ada token di browser |
| Langkah | 1) Buka alamat Web HR. 2) Amati layar. 3) Coba buka `#/dashboard` langsung. 4) Panggil `GET /api/attendance/today` tanpa token. |
| Hasil diharapkan | Hanya layar Login tampil; tidak ada data; API membalas `401 UNAUTHORIZED` |
| Hasil aktual | Layar hanya menampilkan Login; akses langsung `#/karyawan` tanpa token diarahkan ke Login dan tabel tidak dirender; `GET /api/attendance/today` tanpa token dibalas `401 UNAUTHORIZED`. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-AUTH-01`, `TC-WEB-01` — `hasil-ui.json#WEB-01`, `hasil-ui2.json#WEBX-01`, `hasil-api.json#AUTH-07` |

### UAT-02 — HR menambah karyawan

| Atribut | Detail |
|---|---|
| FR | FR-EMP-01..03, 06 |
| Aktor | HR |
| Prakondisi | Login sebagai HR |
| Langkah | 1) Buka Karyawan → Tambah akun. 2) Isi nama "Budi Santoso". 3) Simpan. 4) Catat kode, email, password awal. 5) Cari "budi" di daftar. |
| Hasil diharapkan | Karyawan muncul; kode otomatis; email `budi.santoso@ethes.tech`; password awal tampil **sekali**; pencarian menemukan data |
| Hasil aktual | Karyawan tersimpan dan muncul di daftar; kode otomatis `kyNN`; email otomatis `nama@ethes.tech` (bila bentrok diberi akhiran angka); password awal 12 karakter tampil sekali pada dialog kredensial; pencarian menemukan data. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-EMP-01`, `TC-EMP-02`, `TC-EMP-03`, `TC-EMP-09`, `TC-WEB-02` — `hasil-ui.json#WEB-09`, `hasil-ui.json#WEB-10`, `hasil-api.json#AUTH-17`, `hasil-api.json#EMP-01`, `hasil-api.json#EMP-23` |

### UAT-03 — Karyawan check-in

| Atribut | Detail |
|---|---|
| FR | FR-ATT-02, 07, 08, 09, 10 |
| Aktor | Karyawan |
| Prakondisi | Login karyawan; berada dalam radius office |
| Langkah | 1) Buka status hari ini. 2) Tekan IN. 3) Ambil foto & izinkan lokasi. 4) Kirim. |
| Hasil diharapkan | Muncul `SUDAH_IN` beserta jam masuk; status `TEPAT_WAKTU` atau `TERLAMBAT`; foto dan jarak tersimpan |
| Hasil aktual | `state=SUDAH_IN`, `check_in_at` terisi, status `TERLAMBAT` (eksekusi pukul 22:29 WIB — di luar jam kerja), `distance_m=0`, foto tersimpan dan dapat diambil kembali. Dijalankan lewat klien API. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-ATT-01`, `TC-ATT-06`, `TC-ATT-09`, `TC-ATT-13` — `hasil-api.json#MOB-05`, `hasil-api.json#MOB-13`, `hasil-api.json#ATT-23` |

### UAT-04 — Check-in kedua ditolak

| Atribut | Detail |
|---|---|
| FR | FR-ATT-03, 13 |
| Aktor | Karyawan |
| Prakondisi | Sudah IN hari ini |
| Langkah | Tekan IN lagi; lampirkan foto baru. |
| Hasil diharapkan | Pesan "sudah IN"; tidak ada record baru; riwayat tetap satu baris |
| Hasil aktual | IN kedua dibalas `409 ALREADY_CHECKED_IN`; jumlah baris tetap 1; dua permintaan paralel menghasilkan tepat satu 201 dan satu 409. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-ATT-02`, `TC-ATT-14` — `hasil-api.json#MOB-07`, `hasil-api.json#ATT-03`, `hasil-api.json#ATT-21` |

### UAT-05 — Karyawan check-out

| Atribut | Detail |
|---|---|
| FR | FR-ATT-05 |
| Aktor | Karyawan |
| Prakondisi | Sudah IN, belum OUT, dalam radius |
| Langkah | Tekan OUT; ambil foto & lokasi; kirim. |
| Hasil diharapkan | Status `SUDAH_OUT`; jam keluar tampil |
| Hasil aktual | `state=SUDAH_OUT`, `check_out_at` terisi, `out.distance_m` tercatat. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-ATT-04` — `hasil-api.json#MOB-08`, `hasil-api.json#ATT-04` |

### UAT-06 — Check-out kedua ditolak

| Atribut | Detail |
|---|---|
| FR | FR-ATT-06 |
| Aktor | Karyawan |
| Prakondisi | Sudah OUT |
| Langkah | Tekan OUT lagi. |
| Hasil diharapkan | Pesan "sudah OUT"; jam keluar tidak berubah |
| Hasil aktual | OUT kedua dibalas `409 ALREADY_CHECKED_OUT`; `check_out_at` tidak berubah. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-ATT-05` — `hasil-api.json#MOB-10`, `hasil-api.json#ATT-05` |

### UAT-07 — Dashboard HR

| Atribut | Detail |
|---|---|
| FR | FR-DSH-01..05 |
| Aktor | HR |
| Prakondisi | Ada minimal satu absensi hari ini |
| Langkah | 1) Buka Dashboard. 2) Cocokkan angka dengan menu Absensi tanggal yang sama. 3) Buka tab Terlambat / Belum OUT / Belum IN. |
| Hasil diharapkan | Angka konsisten dengan daftar; ketiga tab berisi data yang sesuai; tren 7 hari tampil |
| Hasil aktual | Angka dashboard konsisten dengan daftar absensi tanggal yang sama (`sudah_in` 4 = 4 baris; pada eksekusi lain 13 = 13); tab Terlambat/Belum OUT/Belum IN berisi data yang sesuai; tren 7 titik tampil dan angkanya sama dengan hitungan DB. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-DSH-01`, `TC-DSH-02`, `TC-HIS-10` — `hasil-api.json#DSHF-01` … `hasil-api.json#DSHF-10`, `hasil-ui.json#WEB-04`, `hasil-ui2.json#WEBX-10` |

### UAT-08 — Riwayat karyawan

| Atribut | Detail |
|---|---|
| FR | FR-HIS-01, 02 |
| Aktor | Karyawan |
| Prakondisi | Login karyawan yang punya riwayat |
| Langkah | 1) Buka riwayat. 2) Coba minta data karyawan lain (lewat klien API: `?employee_id=<orang lain>`). |
| Hasil diharapkan | Hanya data sendiri yang tampil; permintaan data orang lain ditolak `403` |
| Hasil aktual | Riwayat hanya berisi data pemilik token; permintaan `?employee_id=<orang lain>` dibalas `403 FORBIDDEN` tanpa data. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-HIS-07`, `TC-AUTH-07` — `hasil-api.json#MOB-11`, `hasil-api.json#MOB-12`, `hasil-api.json#ATT-06` |

### UAT-09 — Absensi di luar radius

| Atribut | Detail |
|---|---|
| FR | FR-ATT-10 |
| Aktor | Karyawan |
| Prakondisi | Login; berada di luar radius |
| Langkah | Coba IN dari lokasi jauh. |
| Hasil diharapkan | Ditolak dengan pesan yang menyebut nama office, jarak, dan radius maksimum |
| Hasil aktual | Ditolak `403 OUTSIDE_RADIUS` dengan pesan yang menyebut nama office, jarak (`distance_m`) dan radius (`radius_m`). |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-ATT-06` — `hasil-api.json#MOB-19` |

### UAT-10 — Token kedaluwarsa

| Atribut | Detail |
|---|---|
| FR | FR-AUTH-04, 08 |
| Aktor | Karyawan / HR |
| Prakondisi | Token tidak valid atau kedaluwarsa |
| Langkah | Gunakan token lama/rusak lalu buka halaman data. |
| Hasil diharapkan | Kembali ke layar Login; tidak ada data yang tampil; tidak ada status berhasil |
| Hasil aktual | Token kedaluwarsa/rusak: API membalas `401 UNAUTHORIZED`; Web HR kembali ke Login dan token dibersihkan. Catatan: bila sesi berakhir saat daftar sedang dimuat, konsol mencatat `TypeError` (BUG-02) — tampilan tetap kembali ke Login. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-AUTH-01`, `TC-AUTH-05`, `TC-AUTH-09` — `hasil-api.json#AUTH-10`, `hasil-ui.json#WEB-15`, `hasil-ui2.json#WEBX-04`; BUG-02 |

### UAT-11 — Jaringan gagal saat check-in

| Atribut | Detail |
|---|---|
| FR | NFR-08 (ATT-08) |
| Aktor | Karyawan |
| Prakondisi | Login; siap melakukan IN |
| Langkah | 1) Putuskan koneksi. 2) Tekan IN. 3) Sambungkan kembali dan periksa status. |
| Hasil diharapkan | Muncul pesan tidak bisa terhubung; status tetap `BELUM_IN`; tidak ada tanda berhasil |
| Hasil aktual | Tidak dijalankan: aplikasi mobile belum ada di repo, sehingga kondisi "jaringan putus di perangkat" tidak dapat disimulasikan pada klien nyata. Rencana: diuji saat aplikasi mobile tersedia. |
| Status | ☐ Lulus ☐ Gagal ☑ Blocked |
| Bukti | — |

### UAT-12 — Web HR menolak akun karyawan

| Atribut | Detail |
|---|---|
| FR | FR-WEB-05; FR-AUTH-05 |
| Aktor | Karyawan |
| Prakondisi | Akun karyawan aktif |
| Langkah | Login di Web HR dengan akun karyawan. |
| Hasil diharapkan | Pesan "Akun ini bukan HR…"; tetap di Login; Dashboard tidak terbuka |
| Hasil aktual | Login akun karyawan di Web HR menampilkan "Akun ini bukan HR. Karyawan login lewat aplikasi mobile."; tetap di layar Login; menu HR tidak tampil dan tidak ada data yang terbuka. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-AUTH-09` — `hasil-ui2.json#WEBX-03`, `hasil-ui2.json#WEBX-04` |

### UAT-13 — Kelola office & radius

| Atribut | Detail |
|---|---|
| FR | FR-OFF-01..04 |
| Aktor | HR |
| Prakondisi | Login HR |
| Langkah | 1) Tambah office dengan koordinat & radius 100 m. 2) Ubah radius menjadi 150 m. 3) Nonaktifkan office. 4) Coba simpan radius 5 m. |
| Hasil diharapkan | Office tersimpan; perubahan radius berlaku; office nonaktif hilang dari daftar aktif; radius 5 m ditolak dengan pesan validasi |
| Hasil aktual | Office baru tersimpan (`201`, `radius_m=150`, aktif); perubahan radius berlaku (`200`, radius 200); office nonaktif hilang dari daftar aktif lalu muncul lagi saat diaktifkan; radius 5 m ditolak `400 VALIDATION` "radius_m harus 10-5000 meter". Dijalankan lewat API; halaman Office di Web HR tampil normal. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-OFF-01` … `TC-OFF-05` — `hasil-extra.json#EMP-01` … `hasil-extra.json#EMP-12`, `hasil-ui.json#WEB-12` |

### UAT-14 — Tambah akun HR

| Atribut | Detail |
|---|---|
| FR | FR-ADM-01..04 |
| Aktor | HR |
| Prakondisi | Login sebagai HR01 |
| Langkah | 1) Buka tab Admin. 2) Tambah akun HR baru. 3) Catat `account_code` & password awal. 4) Login dengan akun baru. |
| Hasil diharapkan | `account_code` berikutnya (`HR02`); akun baru dapat login dan membuka Dashboard |
| Hasil aktual | Akun HR baru dibuat dengan `account_code=HR02` (uji lain HR05, HR06) dan password awal 12 karakter; akun baru dapat login (`role=HR`) dan `/api/me` menunjukkan kode yang sama. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-ADM-01`, `TC-ADM-02`, `TC-ADM-03`, `TC-EMP-01` — `hasil-api.json#EMP-20`, `hasil-ui2.json#WEBX-09`, `hasil-probes.json#EMP-03` |

### UAT-15 — Ekspor CSV

| Atribut | Detail |
|---|---|
| FR | FR-HIS-09 |
| Aktor | HR |
| Prakondisi | Login HR; ada data absensi |
| Langkah | 1) Buka Absensi. 2) Pilih filter. 3) Klik Unduh CSV. 4) Buka berkas. |
| Hasil diharapkan | Berkas terunduh; kolom lengkap; baris sesuai filter |
| Hasil aktual | Berkas `absensi-<tanggal>.csv` terunduh dengan kolom Tanggal, Kode, Nama, IN, OUT, Status, Jarak IN (m), Jarak OUT (m); jumlah baris mengikuti filter (6 baris pada filter 7 hari); nama berisi `=1+1` ditulis `'=1+1` sehingga aman dari formula injection. |
| Status | ☑ Lulus ☐ Gagal ☐ Blocked |
| Bukti | `TC-HIS-09` — `hasil-ui.json#WEB-13`, `hasil-ui2.json#WEBX-11` |

---

## 5. Rekap Hasil

| Status | Jumlah | Persentase |
|---|---|---|
| Lulus | 14 | 93,3% |
| Gagal | 0 | 0% |
| Blocked | 1 | 6,7% |
| Tidak dijalankan | 0 | 0% |
| **Total** | **15** | 100% |

**Kriteria diterima:**

- [x] Semua UAT prioritas tinggi (UAT-01, 03, 04, 05, 07, 12) **Lulus**.
- [x] Tidak ada UAT berstatus Gagal tanpa defect tercatat.
- [x] Tidak ada UAT berstatus Blocked tanpa penjelasan (lihat UAT-11).

---

## 6. Defect yang Ditemukan Saat UAT

| No | UAT | Deskripsi | Severity | ID Defect | Status |
|---|---|---|---|---|---|
| 1 | UAT-10 | `TypeError: Cannot set properties of null (setting 'innerHTML')` di `public/app.js:374` ketika 401 memicu `logout()` saat daftar karyawan sedang dimuat. UX tetap kembali ke Login. | Low | BUG-02 | Terbuka |
| 2 | UAT-01, UAT-10 | Respons web tidak memuat header keamanan (`X-Content-Type-Options`, `X-Frame-Options`, CSP, `Referrer-Policy`). Tidak memengaruhi alur bisnis. | Medium | BUG-01 | Terbuka |
| 3 | — | Tidak ada defect fungsional lain; 61 test case Lulus. | — | — | — |

Aturan penomoran dan klasifikasi ada di `13-Defect-Management.md`.

---

## 7. Catatan & Kesepakatan

| Hal | Isi |
|---|---|
| Penyimpangan dari skenario | UAT-03..UAT-06, UAT-08, UAT-09 dijalankan lewat klien API karena aplikasi mobile belum ada di repo; UAT-13 langkah tambah/ubah office dijalankan lewat API, halaman Office hanya diverifikasi tampil. |
| Fitur yang disepakati ditunda | |
| Risiko yang diterima penguji | Menunggu sesi UAT resmi. |
| Tanggal UAT ulang (bila ada) | |

---

## 8. Tanda Tangan

| Peran | Nama | Tanda tangan | Tanggal |
|---|---|---|---|
| Penguji utama (Mentor) | | | |
| Perwakilan HR | | | |
| Perwakilan Karyawan | | | |
| QA Engineer | | | |
| System Analyst | | | |

**Keputusan akhir:**

☐ **Diterima** — layak demo/operasi terbatas
☐ **Diterima dengan catatan** — defect tertentu harus diperbaiki dalam tenggat yang disepakati
☐ **Ditolak** — perlu perbaikan dan UAT ulang

Alasan/keterangan:

---

## 9. Lampiran — Pemetaan UAT ke FR

| UAT | FR yang dibuktikan |
|---|---|
| UAT-01 | FR-AUTH-00, FR-AUTH-04, FR-WEB-01 |
| UAT-02 | FR-AUTH-01, FR-AUTH-07, FR-EMP-01, FR-EMP-02, FR-EMP-03, FR-EMP-06, FR-EMP-12, FR-WEB-03 |
| UAT-03 | FR-ATT-01, FR-ATT-02, FR-ATT-07, FR-ATT-08, FR-ATT-09, FR-ATT-10, FR-OFF-04 |
| UAT-04 | FR-ATT-03, FR-ATT-13 |
| UAT-05 | FR-ATT-05 |
| UAT-06 | FR-ATT-06 |
| UAT-07 | FR-DSH-01, FR-DSH-02, FR-DSH-03, FR-DSH-05 |
| UAT-08 | FR-HIS-01, FR-HIS-02, FR-HIS-08 |
| UAT-09 | FR-ATT-10 |
| UAT-10 | FR-AUTH-04, FR-AUTH-08 |
| UAT-11 | NFR-08 (ATT-08) |
| UAT-12 | FR-AUTH-05, FR-WEB-05 |
| UAT-13 | FR-OFF-01, FR-OFF-02, FR-OFF-03, FR-OFF-04 |
| UAT-14 | FR-ADM-01, FR-ADM-02, FR-ADM-04 |
| UAT-15 | FR-HIS-09 |

**Cakupan:** 15 skenario membuktikan **39 FR unik (61,9%)** — yaitu alur bisnis yang akan didemokan. FR lain dibuktikan pada level test case (`10-Test-Case.md`), bukan UAT. Daftar FR yang hanya tercakup test case ada di `12-Traceability-Matrix.md` §4.

**Catatan:** FR-OFF-04 (seed office) terbukti tidak langsung — office seed dipakai pada UAT-03/09 dan ditambah pada UAT-13.