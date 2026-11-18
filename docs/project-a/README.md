# Dokumentasi Analisis — Project A (Workforce Attendance)

Folder ini berisi paket dokumen analisis dan desain untuk **Project A — Workforce Attendance System**, yang seluruhnya diturunkan dari isi project ini:

- kode sumber: `src/` (Express API), `public/` (Web HR), `test/`
- dokumen awal: `docs/ETHES_TECH Project.docx` (Bab 1 Project A, Bab 3–5 standar engineering)
- kontrak yang dinyatakan repo: `README.md`
- work order: `TASK.md` (batasan, invarian, protokol `build`/`update`)

Semua diagram memakai **Mermaid** sehingga dapat dirender langsung di GitHub, GitLab, VS Code, atau [mermaid.live](https://mermaid.live).

---

## Invarian Utama — Semua Fitur Wajib Login

> **Tidak ada satu pun fitur yang dapat digunakan tanpa login terlebih dahulu.**

Hal ini bukan usulan, melainkan perilaku yang sudah berjalan dan menjadi benang merah seluruh dokumen:

| Lapisan | Bukti |
|---|---|
| API HR | `router.use(auth, requireRole('HR'))` pada `employees`, `admins`, `dashboard` |
| API absensi | `router.use(auth)`; `requireRole('EMPLOYEE')` untuk today/IN/OUT |
| API office | `router.use(auth)`; tulis hanya `HR` |
| Web HR | Tanpa token → layar Login; respons 401 → `logout()` |
| Web HR | Akun non-HR ditolak: "Akun ini bukan HR…" |

Pengecualian publik hanya: `POST /api/login`, `GET /health`, dan aset statis Web (kerangka UI tanpa data). Endpoint foto **tetap wajib token**.

---

## Daftar Dokumen

| # | Dokumen | Isi | Jumlah |
|---|---|---|---|
| 1 | [`01-SRS.md`](./01-SRS.md) | Ruang lingkup, aktor, **§0 Auth Gate**, FR per modul, NFR, aturan bisnis, kebutuhan data, kontrak 20 endpoint, traceability, 15 kriteria UAT, deviasi | 63 FR · 17 NFR |
| 2 | [`02-Use-Case-Diagram.md`](./02-Use-Case-Diagram.md) | Diagram auth gate, diagram utama, diagram per aktor, spesifikasi UC lengkap, matriks aktor | 17 UC |
| 3 | [`03-Activity-Diagram.md`](./03-Activity-Diagram.md) | Activity diagram tiap alur, semua dimulai dari cek token | 15 diagram |
| 4 | [`04-ERD.md`](./04-ERD.md) | ERD, relasi, kamus data, DDL aktual, indeks, normalisasi, status turunan | 5 tabel |
| 5 | [`05-Flowchart.md`](./05-Flowchart.md) | Peta sistem, auth guard, state machine, pipeline request, filter, error, matriks keputusan | 11 flowchart · 22 keputusan |
| 6 | [`06-Functional-Requirement.md`](./06-Functional-Requirement.md) | 63 FR dengan prioritas, status, acceptance criteria, traceability ke kode & tes, gap analysis | 63 FR · 13 TC |
| 7 | [`07-User-Story.md`](./07-User-Story.md) | Persona, 7 epic, 32 story dengan Gherkin, DoR/DoD, rencana sprint 17–19 Nov | 32 story · 92 poin |
| 8 | [`08-Business-Process-Documentation.md`](./08-Business-Process-Documentation.md) | As-is vs to-be, 7 proses, sequence diagram, RACI, SLA/KPI usulan, exception, retensi, risiko | 7 proses · 14 exception |
| 9 | [`09-Test-Plan.md`](./09-Test-Plan.md) | Strategi & level tes, lingkungan, data uji, entry/exit criteria, jadwal, metrik, checklist kesiapan demo | 4 level tes |
| 10 | [`10-Test-Case.md`](./10-Test-Case.md) | 61 test case rinci: langkah, prasyarat, hasil diharapkan, kolom status eksekusi | 61 TC |
| 11 | [`11-UAT.md`](./11-UAT.md) | Lembar UAT 15 skenario, kolom hasil aktual, rekap, tanda tangan, keputusan akhir | 15 UAT |
| 12 | [`12-Traceability-Matrix.md`](./12-Traceability-Matrix.md) | RTM FR → UC → TC → UAT, cakupan per modul, NFR → bukti, aturan pemeliharaan | 63 FR · 61 TC |
| 13 | [`13-Defect-Management.md`](./13-Defect-Management.md) | Severity & priority, siklus hidup, template laporan, daftar "bukan defect", SLA, regresi, metrik | 4 tingkat severity |
| 14 | [`14-Risk-Register.md`](./14-Risk-Register.md) | Register risiko gabungan, skala P×D, heat map, 5 risiko teratas, risiko diterima, siklus peninjauan | 22 risiko |
| 15 | [`15-Change-Request-Log.md`](./15-Change-Request-Log.md) | Baseline, klasifikasi perubahan, format CR, alur persetujuan, tabel dampak, deviasi D-01..D-10 | 0 CR formal |
| 16 | [`16-Security-Test-Checklist.md`](./16-Security-Test-Checklist.md) | Auth gate, otorisasi, token, injeksi, unggah berkas, konfigurasi, temuan statis, pemetaan OWASP | 44 pemeriksaan · 10 observasi |
| 17 | [`17-Test-Automation.md`](./17-Test-Automation.md) | Peta otomasi 61 TC, arsitektur harness, contoh kode `node:test`, tes waktu, browser, CI | 57 dapat diotomasi |
| 18 | [`18-Test-Summary-Report.md`](./18-Test-Summary-Report.md) | Template laporan siklus + laporan harian, ringkasan eksekusi, verdict, tanda tangan | 1 template |
| 19 | [`19-Glossary.md`](./19-Glossary.md) | Istilah domain, status vs state, peran & kode, pola ID, istilah sering tertukar, satuan, kode error | ±90 istilah |
| — | [`TASK.md`](./TASK.md) | Work order: batasan, invarian, protokol `build`/`update` | — |
| — | [`_sources.json`](./_sources.json) | Manifest hash + mtime seluruh sumber & output | — |

---

## Ringkasan Sistem

| Aspek | Keterangan |
|---|---|
| Aktor | HR Admin (Web), Employee (Mobile/klien API) |
| Stack | Node.js 22.13+ · Express · SQLite (`node:sqlite`) · JWT · bcrypt · multer |
| Jam kerja | 08:00 WIB, toleransi 15 menit → **lewat 08:15 = `TERLAMBAT`** |
| Zona waktu | `Asia/Jakarta`, dihitung dari jam server (`src/utils/time.js`) |
| Aturan inti | Satu pasang IN/OUT per karyawan per tanggal (`UNIQUE employee_id, work_date`) |
| Verifikasi | Foto kamera (≤ 5 MB) + koordinat GPS + radius office (10–5000 m) |
| Status tersimpan | Hanya `TEPAT_WAKTU` / `TERLAMBAT` |
| Status turunan | `BELUM_IN`, `BELUM_OUT`, `SUDAH_OUT` |
| Endpoint | 20 endpoint API (1 publik, 19 terproteksi) + `/health` |
| Data | 5 tabel: `employees`, `users`, `offices`, `attendances`, `hr_code_sequence` |

---

## Alur Baca yang Disarankan

1. **Memahami aturan akses:** `01-SRS.md` §0 → `02-Use-Case-Diagram.md` §1
2. **Memahami kebutuhan:** `01-SRS.md` §3 → `06-Functional-Requirement.md`
3. **Memahami alur:** `02` → `03-Activity-Diagram.md` → `05-Flowchart.md`
4. **Memahami data:** `04-ERD.md`
5. **Merencanakan kerja:** `07-User-Story.md`
6. **Presentasi ke mentor/bisnis:** `08-Business-Process-Documentation.md`

---

## Paket Kerja System Analyst & Quality Assurance

### Untuk System Analyst

| Kebutuhan | Dokumen |
|---|---|
| Menjelaskan kebutuhan ke pengembang/mentor | `01-SRS.md` → `06-Functional-Requirement.md` |
| Menjaga konsistensi ID & alur | `02`, `03`, `05` (UC → AD → FC) |
| Menjelaskan data & aturan | `04-ERD.md` + `01-SRS.md` §5 |
| Menyusun rencana kerja | `07-User-Story.md` |
| Menjelaskan proses ke bisnis | `08-Business-Process-Documentation.md` |
| Menilai dampak perubahan | `TASK.md` §7.1 + `15-Change-Request-Log.md` |
| Memantau risiko | `14-Risk-Register.md` |
| Menyamakan istilah | `19-Glossary.md` |

### Untuk Quality Assurance

| Tahap | Dokumen | Keluaran |
|---|---|---|
| Perencanaan | `09-Test-Plan.md` | Lingkup, lingkungan, jadwal, entry/exit criteria |
| Eksekusi | `10-Test-Case.md` | Status per TC + bukti |
| Penerimaan pengguna | `11-UAT.md` | Lembar ditandatangani |
| Audit cakupan | `12-Traceability-Matrix.md` | 63/63 FR punya TC |
| Penanganan temuan | `13-Defect-Management.md` | `BUG-YYYYMMDD-NN` + regresi |
| Pemeriksaan keamanan | `16-Security-Test-Checklist.md` | 44 pemeriksaan + observasi |
| Otomasi | `17-Test-Automation.md` | Peta otomasi + contoh harness |
| Pelaporan | `18-Test-Summary-Report.md` | Verdict siklus + tanda tangan |

**Urutan kerja harian QA:**

```
pagi   : siapkan environment bersih → smoke TC-01..TC-13
siang  : eksekusi TC sesuai jadwal → catat bukti
sore   : triage defect 15 menit → perbarui RTM & laporan
akhir  : jalankan UAT → tanda tangan → putuskan siap/tidak siap demo
```

> **Status paket QA:** rencana, test case, dan lembar UAT sudah siap, tetapi **belum dieksekusi**. Tidak ada status "lulus" yang diklaim di dokumen mana pun sampai kolom hasil diisi dengan bukti nyata.

---

## Prasyarat Sebelum Menjalankan Apa Pun

| Hal | Syarat | Kondisi saat dokumen dibuat |
|---|---|---|
| Node.js | **≥ 22.13** (`node:sqlite`) | **v20.18.0** → `node:sqlite` gagal, server tidak dapat dijalankan |
| `.env` | Ada, `JWT_SECRET` acak, `HR_PASSWORD` diganti | **Belum ada**; kode memakai nilai cadangan |
| Titik masuk | `npm start` (`src/server.js`) | Jangan memakai `php artisan serve` — skeleton Laravel tidak dipakai |
| Database uji | `DB_PATH` + `UPLOAD_DIR` terpisah | Wajib agar data demo tidak tercampur |

Rincian: `14-Risk-Register.md` RISK-01/RISK-02/RISK-03 dan `09-Test-Plan.md` §4.2.

---

## Catatan Deviasi: Dokumen Awal vs Implementasi

Perbedaan dicatat apa adanya, tidak ditambal dengan asumsi. Rincian di `01-SRS.md` §10.

| No | Butir | Dokumen awal | Implementasi |
|---|---|---|---|
| D-01 | Basis data | MySQL + migrations/seeder | SQLite `node:sqlite`, migrasi `PRAGMA user_version` 1→3 |
| D-02 | GPS/kamera/geofence | Di luar scope wajib | Diimplementasikan (foto wajib + radius) |
| D-03 | Endpoint karyawan | GET/POST/PUT | Ditambah DELETE, reset-password, `/api/admins` |
| D-04 | Format respons | `{success, message, data, error}` | `{data, meta}` / `{error:{code,message}}` |
| D-05 | Struktur folder | `backend/`, `mobile/`, `docs/` | Backend di `src/`, Web di `public/`, **mobile belum ada** |
| D-06 | Export | Di luar scope | CSV tersedia di Web HR |
| D-07 | Login | Disebut "login demo" | JWT + role guard, menjadi gerbang semua fitur |
| D-08 | Kode karyawan di `README.md` | Ditulis `EMP001` | Aktual `kyNN` (`ky01`, `ky02`, …) |
| D-09 | Jumlah tes di `README.md` | Ditulis "9 tes" | Aktual 10 `test(...)` di `test/attendance.test.js` |
| D-10 | Tumpukan teknologi | Docx menyebut satu stack | Root juga berisi skeleton Laravel 10 (tidak dipakai); Project A = Node `src/` |

---

## Gap yang Diakui

| ID | Gap | Dampak |
|---|---|---|
| GAP-01 | Struktur folder belum sesuai dokumen awal | Deliverable tampak tidak lengkap |
| GAP-02 | Aplikasi Mobile belum ada di repo | Fitur Employee hanya teruji via API |
| GAP-03 | Belum ada berkas bukti UAT | Klaim kesiapan belum terdokumentasi |
| GAP-04 | README menulis `EMP001` | Kebingungan saat demo |
| GAP-05 | Tidak ada `updated_at` | Audit perubahan tidak tersedia |
| GAP-06 | Belum ada rate limit login | Risiko brute force |
| GAP-07 | Foto di disk lokal tanpa enkripsi | Risiko kebocoran |
| GAP-08 | Tidak ada endpoint hapus office | Salah input hanya bisa dinonaktifkan |
| GAP-09 | Skeleton Laravel 10 di root, tidak dipakai | Dua titik masuk membingungkan; `public/index.php` tersaji sebagai berkas statis |
| GAP-10 | README menyebut 9 tes, aktual 10 | Laporan dapat salah mengutip cakupan |

---

## Cara Memverifikasi Diagram

Seluruh diagram dapat diperiksa ulang tanpa membuka browser:

```powershell
# 1) Render satu diagram ke SVG (gagal = ada error sintaks/render)
npx -y @mermaid-js/mermaid-cli -i .\04-ERD.md -o erd.svg

# 2) Ekstrak blok mermaid lalu parse dengan pustaka mermaid
#    (contoh skrip ada di 17-Test-Automation.md §13)
```

**Hasil pemeriksaan terakhir (18 November 2026):**

| Metode | Hasil |
|---|---|
| `mermaid.parse()` — Mermaid 12.3.0 | 51/51 blok lolos |
| `mmdc` render ke SVG — Mermaid CLI 11.17.1 + Chrome | 51/51 SVG dihasilkan, tanpa penanda `Syntax error` |
| Keseimbangan `[]`, `()`, `{}`, kutip | bersih |

> Render berhasil berarti **sintaks dan tata letak dasar** valid. Ia tidak menilai apakah isi diagram benar — itu tugas tinjauan manusia terhadap `01-SRS.md`.

---

## Status Dokumen

| Item | Nilai |
|---|---|
| Versi | 2.1 |
| Tanggal | 18 November 2026 |
| Penyusun | Analyst |
| Baseline kode | Branch `main`, commit `0925970` |
| Baseline sumber | `_sources.json` — 30 berkas sumber |
| Jumlah dokumen | 19 dokumen + `TASK.md` + manifest |
| Blok Mermaid | 51, seluruhnya lolos **parse Mermaid 12.3.0** dan **render SVG Mermaid CLI 11.17.1** tanpa error |
| Status | Siap review mentor |