# WORK ORDER — Dokumentasi Analisis Project A
## Build-on-demand spec (sudah dieksekusi)

| Item | Nilai |
|---|---|
| Status | **SELESAI** — `build` dieksekusi 18 November 2026; 21 dokumen (.md) + `_sources.json` dihasilkan, lalu `update` menyelaraskan hasil eksekusi QA |
| Versi Work Order | 1.0 |
| Tanggal disimpan | 18 November 2026 |
| Proyek | Project A — Workforce Attendance System |
| Root | `C:\Users\rayha\Documents\Data Kerja\Ethes Tech - Maganghub\Project A - [17-19 November 2026]\Project1` |
| Folder output | `docs/project-a/` |
| Baseline manifest | `docs/project-a/_sources.json` (75 sumber, 21 output) |
| Git | Proses `build`/`update` hanya menulis berkas — **tidak** menjalankan operasi git; commit/push dilakukan terpisah |

---

## 1. Tujuan

Menghasilkan ulang / menyempurnakan **8 deliverable analisis** (SRS, Use Case Diagram, Activity Diagram, ERD, Flowchart, Functional Requirement, User Story, Business Process Documentation) yang **sepenuhnya diturunkan dari isi project ini sendiri**:

- kode sumber yang ada (`src/`, `public/`, `test/`),
- dokumen yang ada (`docs/ETHES_TECH Project.docx` — Bab Project A, `README.md`),
- dokumen analisis yang sudah ada (`docs/project-a/*.md`).

Tidak boleh mengambil asumsi, fitur, atau referensi dari luar cakupan tersebut.

---

## 2. Batasan Keras (Constraints)

| Kode | Batasan |
|---|---|
| **C-01** | **Sumber tunggal** = repo ini + `docs/`. Tidak menambah fitur/modul yang tidak ada di kode maupun di `docs/ETHES_TECH Project.docx`. |
| **C-02** | **Tanpa git**: tidak `git add`, `commit`, `push`, branch, checkout, stash, reset. Semua perubahan hanya file lokal. |
| **C-03** | Tidak menyentuh berkas milik user: `.gitignore`, `docs/ETHES_TECH Project.docx`, `opencode.jsonc`, `src/**`, `public/**`, `test/**`. Hanya menulis di `docs/project-a/`. |
| **C-04** | Bahasa Indonesia. Diagram memakai **Mermaid** (dapat dirender di GitHub/VS Code). |
| **C-05** | Setiap klaim harus dapat ditelusuri ke file sumber (cantumkan referensi seperti `src/routes/attendance.js`). |
| **C-06** | Jika dokumen awal (`docx`) berbeda dengan kode, **catat sebagai deviasi**, jangan diam-diam memilih salah satu. |
| **C-07** | Jangan mengarang angka/SLA bisnis seolah fakta; tandai sebagai **usulan**. |
| **C-08** | Tidak mengklaim aplikasi Mobile sudah ada bila di repo tidak ada folder mobile — jelaskan sebagai klien API. |

---

## 3. Invarian Wajib (harus konsisten di SEMUA deliverable)

### I-01 — AUTH GATE: semua fitur wajib login lebih dulu ⭐

Ini invarian utama yang diminta. Pernyataan yang harus muncul konsisten di SRS, Use Case, Activity, Flowchart, FR, User Story, dan Business Process:

> **Tidak ada satu pun fitur yang dapat digunakan tanpa login.** Seluruh halaman Web HR, seluruh layar Mobile, dan seluruh endpoint API selain endpoint publik di bawah ini berada di balik autentikasi JWT. Pengguna yang belum login hanya melihat layar Login.

**Bukti di kode:**

| Lokasi | Perilaku |
|---|---|
| `src/routes/auth.js` | `POST /api/login` publik; `GET /api/me` memakai `auth` |
| `src/routes/employees.js` | `router.use(auth, requireRole('HR'))` — seluruh route butuh login + role HR |
| `src/routes/admins.js` | `router.use(auth, requireRole('HR'))` |
| `src/routes/attendance.js` | `router.use(auth)` + `requireRole('EMPLOYEE')` pada IN/OUT/today, `requireRole('HR')` pada daftar |
| `src/routes/dashboard.js` | `router.use(auth, requireRole('HR'))` |
| `src/routes/offices.js` | `router.use(auth)`; POST/PUT + `requireRole('HR')` |
| `src/middleware/auth.js` | Tanpa token → 401 `UNAUTHORIZED`; token invalid/kedaluwarsa → 401; role salah → 403 `FORBIDDEN` |
| `public/app.js` | Tanpa token tersimpan, aplikasi menampilkan `renderLogin()` (`boot()` → baris 110); API 401 → `logout()` dan kembali ke Login (baris 24); `POST /api/login` dengan role bukan HR ditolak di sisi Web ("Akun ini bukan HR. Karyawan login lewat aplikasi mobile.") |

**Satu-satunya pengecualian publik:**

| Endpoint / Aset | Alasan | Perilaku tanpa token |
|---|---|---|
| `POST /api/login` | Proses memperoleh token | 400 `VALIDATION` bila field kosong; 401 `INVALID_CREDENTIALS` bila salah |
| `GET /health` | Health check server | 200 `{ "ok": true }` |
| Aset statis Web (`/index.html`, `/app.js`, `/app.css`, favicon) | Kerangka aplikasi | Boleh dimuat, tetapi seluruh data difetch dengan token; tanpa token tampil layar Login |
| `GET /api/attendance/:id/photo/:type` | **Bukan** pengecualian — tetap wajib token | 401 tanpa token; 403 bila bukan pemilik dan bukan HR |

**Konsekuensi yang harus ditulis di setiap dokumen:**
1. Setiap use case memiliki **prakondisi: "sudah login"** (kecuali UC Login itu sendiri).
2. Setiap activity diagram dimulai dari Login / memeriksa token.
3. Setiap user story memiliki *Given* "saya sudah login" (kecuali story login).
4. Setiap endpoint pada tabel API diberi kolom peran akses; tidak ada kolom "publik" selain dua endpoint di atas.
5. Business process menempatkan login sebagai langkah pertama pada setiap proses, dan 401 sebagai exception yang mengembalikan pengguna ke Login.
6. **Pintu masuk dibedakan per peran:** Web HR hanya menerima akun `HR`; akun `EMPLOYEE` login melalui Mobile. Percobaan role yang tidak sesuai ditolak.

### I-02 — Satu pasang IN/OUT per tanggal kerja
`UNIQUE(employee_id, work_date)`; IN kedua `409 ALREADY_CHECKED_IN`; OUT kedua `409 ALREADY_CHECKED_OUT`; OUT tanpa IN `409 NOT_CHECKED_IN`.

### I-03 — Waktu server & zona tunggal
Perhitungan memakai jam server zona `Asia/Jakarta` (`src/utils/time.js`), bukan jam perangkat. Jam masuk 08:00, toleransi 15 menit; **> 08:15 = `TERLAMBAT`**, 08:15 tepat = `TEPAT_WAKTU`.

### I-04 — Tidak boleh sukses palsu (ATT-08)
Status lokal hanya berubah setelah respons 2xx terverifikasi; jaringan gagal/timeout → tampilkan error.

### I-05 — Privasi data
Employee hanya boleh membaca data & foto miliknya (`403 FORBIDDEN` untuk data orang lain).

### I-06 — Verifikasi IN/OUT
Foto kamera wajib (`400 PHOTO_REQUIRED`), koordinat GPS wajib (`400 GPS_REQUIRED`), radius office (`403 OUTSIDE_RADIUS`), office aktif wajib ada (`409 NO_OFFICE`).

### I-07 — Kebenaran kode error
Gunakan kode dan status HTTP yang benar-benar ada di `src/utils/http.js`, `src/app.js`, dan route terkait (lihat lampiran `_sources.json`). Jangan mengarang kode error.

### I-08 — Konsistensi antar dokumen
Angka FR, ID use case, ID activity, nama tabel, nama kolom, dan kode error harus identik di seluruh 8 dokumen (satu sumber kebenaran: `docs/project-a/TASK.md` ini + kode).

---

## 4. Deliverable

| ID | Deliverable | File | Cakupan wajib | DoD |
|---|---|---|---|---|
| D0 | Indeks | `README.md` | Daftar dokumen, ringkasan sistem, matriks deliverable, status | Semua tautan valid, isi ringkas akurat |
| D1 | **SRS** | `01-SRS.md` | Ruang lingkup, aktor, deskripsi umum, FR per modul (AUTH, EMP, ADM, OFF, ATT, HIS, DSH, WEB), NFR, aturan bisnis, kebutuhan data, kontrak API, kriteria UAT, traceability, **§ Auth Gate**, deviasi docx vs kode | Setiap FR punya ID, prioritas, kriteria terukur; tabel API memuat kolom peran |
| D2 | **Use Case Diagram** | `02-Use-Case-Diagram.md` | Diagram (Mermaid) seluruh use case + diagram per aktor + spesifikasi tiap UC (aktor, prakondisi **sudah login**, alur utama, alternatif, pascakondisi) + matriks aktor | Tidak ada UC tanpa prakondisi login (kecuali UC Login) |
| D3 | **Activity Diagram** | `03-Activity-Diagram.md` | Diagram aktivitas untuk setiap alur utama: login, cek status, IN, OUT, riwayat, dashboard, CRUD karyawan, office, reset password, admin HR | Setiap diagram punya titik awal & akhir, cabang error, dan cek token bila relevan |
| D4 | **ERD** | `04-ERD.md` | `erDiagram` + diagram relasi + kamus data + DDL aktual + kardinalitas + integritas + indeks + status turunan | Nama tabel/kolom sama persis dengan `src/db.js` |
| D5 | **Flowchart** | `05-Flowchart.md` | Alur sistem, state machine absensi, auth/role guard, pipeline request, resolusi filter tanggal, penentuan TERLAMBAT, agregasi dashboard, penanganan error, matriks keputusan | Tidak ada jalur yang menyatakan sukses saat respons bukan 2xx |
| D6 | **Functional Requirement** | `06-Functional-Requirement.md` | Daftar FR + prioritas + acceptance criteria (Gherkin) + status implementasi + traceability FR→file→test + daftar gap | Jumlah FR per modul konsisten dengan D1 |
| D7 | **User Story** | `07-User-Story.md` | Persona, epic, user story + Gherkin + story point, DoR/DoD, rencana sprint, matriks story→FR | Setiap story punya minimal 1 skenario Gherkin |
| D8 | **Business Process Documentation** | `08-Business-Process-Documentation.md` | As-is vs to-be, daftar proses, diagram proses (login sebagai langkah awal), RACI, SLA/KPI (tandai usulan), exception handling, retensi data, risiko, backlog perbaikan | Semua proses menyebut login + 401 sebagai exception |
| D9 | **Test Plan** | `09-Test-Plan.md` | Strategi 4 level, lingkungan, data uji, entry/exit criteria, jadwal, metrik, release gate | Entry criteria memuat cek runtime & `.env` |
| D10 | **Test Case** | `10-Test-Case.md` | Test case rinci: prasyarat, langkah, hasil diharapkan, kolom status | Setiap TC menunjuk minimal satu FR |
| D11 | **UAT** | `11-UAT.md` | Skenario penerimaan, kolom hasil aktual, rekap, tanda tangan, keputusan | Tidak ada status terisi sebelum eksekusi |
| D12 | **Traceability Matrix** | `12-Traceability-Matrix.md` | RTM FR → UC → TC → UAT + NFR → bukti + aturan pemeliharaan | 100% FR punya TC; tidak ada TC yatim |
| D13 | **Defect Management** | `13-Defect-Management.md` | Severity, priority, siklus hidup, template, "bukan defect", SLA, regresi | Setiap defect punya bukti & TC |
| D14 | **Risk Register** | `14-Risk-Register.md` | Skala P×D, register gabungan, heat map, risiko diterima, siklus tinjau | Setiap risiko punya pemicu & mitigasi |
| D15 | **Change Request Log** | `15-Change-Request-Log.md` | Baseline, klasifikasi, format CR, alur persetujuan, tabel dampak, deviasi | Tidak ada perubahan kode tanpa catatan |
| D16 | **Security Test Checklist** | `16-Security-Test-Checklist.md` | Auth gate, otorisasi, token, injeksi, unggah, konfigurasi, OWASP, observasi | Tidak ada klaim "aman" tanpa eksekusi |
| D17 | **Test Automation** | `17-Test-Automation.md` | Peta otomasi, arsitektur harness, contoh kode, tes waktu, browser, CI | Menyebut prasyarat runtime secara eksplisit |
| D18 | **Test Summary Report** | `18-Test-Summary-Report.md` | Laporan siklus terisi + template laporan harian, verdict, tanda tangan | Angka berasal dari eksekusi nyata; tanda tangan tetap kosong |
| D19 | **Glossary** | `19-Glossary.md` | Istilah domain, status vs state, kode, pola ID, istilah tertukar, satuan | Semua istilah merujuk file/kode |
| D20 | **Manifest** | `_sources.json` | Hash & mtime seluruh sumber + output | Diperbarui setiap kali `build`/`update` |

---

## 5. Rencana Eksekusi saat `build`

1. Baca `_sources.json` → pastikan tidak ada sumber berubah sejak baseline.
2. Baca ulang sumber kunci: `src/db.js`, `src/app.js`, `src/middleware/auth.js`, `src/routes/*.js`, `src/utils/*.js`, `test/attendance.test.js`, `README.md`, hasil ekstraksi `docs/ETHES_TECH Project.docx`.
3. Bangun **matriks kebenaran** internal (tabel, kolom, endpoint, peran, error code, aturan waktu) → dipakai oleh semua deliverable agar konsisten.
4. Tulis D1 (SRS) lebih dulu karena menjadi acuan ID.
5. Turunkan D2 → D3 → D5 → D4 (diagram & data), lalu D6 (FR), D7 (User Story), D8 (Business Process).
6. Susun paket QA: D9 (Test Plan) → D10 (Test Case) → D11 (UAT) → D12 (RTM) → D13 (Defect).
7. Susun register: D14 (Risiko) → D15 (CR) → D16 (Keamanan) → D17 (Otomasi) → D18 (Laporan) → D19 (Glosarium).
8. Perbarui D0 (indeks) dan D20 (manifest).
9. Jalankan **checklist verifikasi** §6.
10. Laporkan ringkasan: file, jumlah diagram, jumlah FR/UC/story/TC/UAT, dan daftar deviasi.

---

## 6. Checklist Verifikasi (self-check sebelum lapor selesai)

- [ ] Semua 19 dokumen (D1–D19) + `TASK.md` + `_sources.json` ada di `docs/project-a/`.
- [ ] Setiap blok Mermaid **lolos parser resmi** (`mermaid.parse`), bukan hanya cek tanda kurung.
- [ ] Semua use case (kecuali UC Login) menyebut "sudah login" pada prakondisi.
- [ ] Semua user story (kecuali story login) menyebut "saya sudah login" pada Given.
- [ ] Tabel endpoint menandai peran HR / EMPLOYEE / publik-dengan-keterangan.
- [ ] Tidak ada endpoint/fitur yang tidak ada di kode.
- [ ] Nama tabel & kolom = `src/db.js`.
- [ ] Kode error = `src/**` (bukan karangan).
- [ ] Jumlah FR di D1 = jumlah FR di D6 = jumlah baris FR di D12.
- [ ] Nomor UC di D2 = jumlah UC di D1.
- [ ] Setiap FR di D12 punya minimal satu TC; tidak ada TC yang tidak dirujuk.
- [ ] Jumlah TC di D10 = jumlah yang dirujuk D12.
- [ ] Jumlah UAT di D11 = jumlah yang disebut D1.
- [ ] Tidak ada sel status TC/UAT yang terisi sebelum eksekusi.
- [ ] Tidak ada kredensial/token nyata tertulis di dokumen.
- [ ] Setiap dokumen baru menyebut prasyarat runtime bila membahas eksekusi.
- [ ] Tidak ada peserta/klaim eksternal di luar repo & docs.
- [ ] Tidak ada operasi git yang dijalankan.
- [ ] `_sources.json` diperbarui.

---

## 7. Protokol `update`

Saat user menulis **"update"**:

| Langkah | Aksi |
|---|---|
| U-1 | Rekomputasi hash seluruh sumber (`src/**`, `public/**`, `test/**`, `README.md`, `package.json`, `.env.example`, `docs/ETHES_TECH Project.docx`) lalu bandingkan dengan `_sources.json`. |
| U-2 | Baca **hanya file yang berubah/baru** (hash berbeda atau tidak ada di manifest), bukan seluruh repo — ini yang menghemat waktu. |
| U-3 | Baca juga file output yang terakhir dimodifikasi bila user mengubahnya manual (bandingkan hash `outputs`). |
| U-4 | "Ingat kembali" invarian §3 dari file ini (tidak perlu membaca ulang seluruh dokumen). |
| U-5 | Tentukan deliverable terdampak lewat tabel dampak di bawah. |
| U-6 | Perbarui deliverable terdampak + `_sources.json`. |
| U-7 | Laporkan **delta**: file berubah, bagian yang diperbarui, dan yang sengaja tidak disentuh. |

**Jangan sampai terlewat:** laporkan juga file yang **tidak** berubah beserta jumlahnya, supaya tidak ada berkas yang luput dari pemeriksaan.

### 7.1 Tabel Dampak Perubahan

| File yang berubah | Deliverable yang wajib diperbarui |
|---|---|
| `src/db.js` | D4 (ERD), D1 (kebutuhan data), D5 (status turunan) |
| `src/app.js` | D1 (routing/endpoint), D5 (error handler), D6 |
| `src/middleware/auth.js` | D1 §Auth Gate, D2 (UC Login), D5 (guard), D6, D7 |
| `src/routes/auth.js` | D1, D2 UC-01, D3 AD Login |
| `src/routes/employees.js` | D1, D2 UC-03..07, D3, D6, D7 |
| `src/routes/admins.js` | D1, D2 UC-08, D3, D6 |
| `src/routes/offices.js` | D1, D2 UC-09, D3, D6 |
| `src/routes/attendance.js` | D1, D2 UC-10..15, D3, D5, D6, D7, D8 |
| `src/routes/dashboard.js` | D1, D2 UC-17, D3, D5, D6 |
| `src/utils/time.js` | D1 (aturan waktu), D5 (FC penentuan status), D8 (SLA) |
| `src/utils/filters.js` | D1 (filter tanggal), D5 (resolusi periode), D6 |
| `src/utils/geo.js` | D1 (radius), D5, D6 |
| `public/app.js` | D1 (antarmuka), D3, D6 (modul WEB), D7 |
| `test/attendance.test.js` | D6 (traceability), D1 (kriteria UAT) |
| `docs/ETHES_TECH Project.docx` | D1 (deviasi), D8 (proses bisnis), D7 (prioritas) |
| `README.md` / `package.json` | D1 (stack & cara jalan), D0 |

### 7.2 Protokol `build`

Saat user menulis **"build"**: eksekusi §5 secara penuh, lalu §6, lalu lapor.

---

## 8. Kondisi Awal (baseline saat task disimpan)

Deliverable v1.0 sudah ada di `docs/project-a/` dari sesi sebelumnya. Saat `build` dijalankan, dokumen tersebut **ditulis ulang** agar patuh penuh pada Work Order ini, khususnya:

1. **I-01 Auth Gate** belum menjadi benang merah eksplisit di semua dokumen → wajib ditambahkan/ditegaskan.
2. Konsistensi ID antar dokumen (FR ↔ UC ↔ AD ↔ story) diperketat.
3. Setiap klaim diberi rujukan file sumber.

| Output | Ukuran baseline | Catatan |
|---|---|---|
| `01-SRS.md` | 26.979 B | Perlu §Auth Gate eksplisit |
| `02-Use-Case-Diagram.md` | 19.670 B | Prakondisi login sudah ada, perlu ditegaskan |
| `03-Activity-Diagram.md` | 11.827 B | Perlu cek token di awal setiap alur |
| `04-ERD.md` | 11.571 B | Sudah sesuai skema |
| `05-Flowchart.md` | 11.260 B | Perlu auth guard sebagai FC utama |
| `06-Functional-Requirement.md` | 17.098 B | Tambah FR-AUTH-00 (gerbang login) |
| `07-User-Story.md` | 22.575 B | Given "sudah login" konsisten |
| `08-Business-Process-Documentation.md` | 21.603 B | Login sebagai langkah pertama tiap proses |
| `README.md` | 3.756 B | Perbarui indeks |

---

## 9. Catatan Gap yang Tidak Boleh Dikarang

Fakta yang harus ditulis apa adanya (bukan ditambal dengan asumsi):

| Hal | Fakta di repo |
|---|---|
| Aplikasi Mobile | Tidak ada folder/proyek mobile di repo; Mobile diperlakukan sebagai klien API sesuai `README.md` |
| Struktur folder wajib docx | `backend/`, `mobile/`, `docs/` — kondisi aktual: backend di `src/`, web di `public/`, mobile tidak ada |
| Database | SQLite (`node:sqlite`), bukan MySQL; migrasi via `PRAGMA user_version` |
| Format respons | `{ data, meta }` / `{ error: { code, message } }`, bukan `{ success, message, data, error }` |
| GPS/kamera/geofence | Disebut di luar scope wajib pada docx, tetapi **ada** di implementasi |
| Export CSV | Disebut di luar scope pada docx, tetapi **ada** di Web HR |
| UAT evidence | Belum ada berkas bukti UAT di `docs/` |
| Jumlah tes | `README.md` menulis 9; `test/attendance.test.js` berisi 10 |
| Implementasi Laravel | Ada di root (`app/`, `routes/api.php`, `public/index.php`) sejak commit `3ee2b7a`; **belum diuji**; titik masuk yang diuji tetap `npm start` (`src/server.js`) |
| Runtime mesin | Node v20.18.0 saat build; `node:sqlite` gagal; seluruh eksekusi TC tertunda sampai Node ≥ 22.13 |
| `.env` | Tidak ada di repo; kode memakai nilai cadangan (`config.js:13,19`) — wajib dibuat sebelum demo |

---

## 10. Riwayat Work Order

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2026-11-18 | Work order disimpan; menunggu prompt `build`. Aturan utama: tanpa git, sumber hanya repo + docs, semua fitur wajib login. |
| 2.0 | 2026-11-18 | Build selesai (D1–D8). Ditambah paket SA/QA D9–D19 atas permintaan pengguna. Verifikasi Mermaid memakai parser resmi. Temuan lingkungan dicatat sebagai risiko, bukan ditambal. |
| 2.1 | 2026-11-19 | ID test case diubah dari `TC-01` … `TC-61` menjadi per modul (`TC-AUTH-01` … `TC-WEB-02`), bahasa langkah/hasil disederhanakan, dan rujukan bukti suite memakai bentuk `hasil-*.json#NAMA`. Berkas xlsx diregenerasi (64 blok, 7 halaman cetak) dan seluruh dokumen QA diselaraskan. |