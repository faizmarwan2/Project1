const fs = require('fs');
const path = require('path');
const router = require('express').Router();
const cfg = require('../config');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { ApiError, wrap } = require('../utils/http');
const { distanceM, validCoord } = require('../utils/geo');
const T = require('../utils/time');
const { dateRange, paging } = require('../utils/filters');

router.use(auth);

const STATUSES = ['TEPAT_WAKTU', 'TERLAMBAT', 'BELUM_OUT', 'SUDAH_OUT', 'BELUM_IN'];
const rmFile = (f) => { if (f) fs.unlink(f.path, () => {}); };
const round = (n) => Math.round(n * 10) / 10;

const serialize = (r) => r && ({
  id: r.id, employee_id: r.employee_id, employee_code: r.employee_code, employee_name: r.employee_name,
  work_date: r.work_date, status: r.status,
  check_in_at: r.check_in_at, check_out_at: r.check_out_at,
  out_state: r.check_out_at ? 'SUDAH_OUT' : 'BELUM_OUT',
  office_id: r.office_id,
  check_in: { lat: r.in_lat, lng: r.in_lng, distance_m: r.in_distance_m, photo_url: r.in_photo ? `/api/attendance/${r.id}/photo/in` : null },
  check_out: r.check_out_at ? { lat: r.out_lat, lng: r.out_lng, distance_m: r.out_distance_m, photo_url: r.out_photo ? `/api/attendance/${r.id}/photo/out` : null } : null,
});

const BASE = `SELECT a.*, e.employee_code, e.name AS employee_name FROM attendances a JOIN employees e ON e.id = a.employee_id`;

/** Validasi GPS + kamera, kembalikan {lat,lng,office,distance} */
function verifyGpsAndPhoto(req) {
  if (!req.file) throw new ApiError(400, 'Foto kamera wajib dilampirkan (field "photo")', 'PHOTO_REQUIRED');
  const lat = parseFloat(req.body.lat ?? req.body.latitude), lng = parseFloat(req.body.lng ?? req.body.longitude);
  if (!validCoord(lat, lng)) throw new ApiError(400, 'Koordinat GPS (lat, lng) wajib & valid', 'GPS_REQUIRED');
  const offices = db.prepare('SELECT * FROM offices WHERE is_active = 1').all();
  if (!offices.length) throw new ApiError(409, 'Belum ada lokasi office aktif', 'NO_OFFICE');
  const nearest = offices.map((o) => ({ o, d: distanceM(lat, lng, o.latitude, o.longitude) })).sort((a, b) => a.d - b.d)[0];
  if (nearest.d > nearest.o.radius_m)
    throw new ApiError(403, `Anda di luar radius office (${Math.round(nearest.d)} m dari ${nearest.o.name}, maks ${nearest.o.radius_m} m)`, 'OUTSIDE_RADIUS',
      { office: nearest.o.name, distance_m: Math.round(nearest.d), radius_m: nearest.o.radius_m });
  return { lat, lng, office: nearest.o, distance: round(nearest.d), photo: req.file.filename };
}

/** wrapper: jalankan multer, lalu handler; hapus foto jika ditolak */
const withUpload = (handler) => [
  requireRole('EMPLOYEE'),
  (req, res, next) => upload(req, res, next),
  wrap((req, res) => {
    try { return handler(req, res); } catch (e) { rmFile(req.file); throw e; }
  }),
];

function activeEmployeeId(req) {
  const e = db.prepare('SELECT id, status FROM employees WHERE id = ?').get(req.user.employee_id);
  if (!e || e.status !== 'ACTIVE') throw new ApiError(403, 'Karyawan nonaktif', 'ACCOUNT_INACTIVE');
  return e.id;
}

// GET /api/attendance/today
router.get('/today', requireRole('EMPLOYEE'), wrap((req, res) => {
  const empId = activeEmployeeId(req), today = T.workDate();
  const row = db.prepare(`${BASE} WHERE a.employee_id = ? AND a.work_date = ?`).get(empId, today);
  res.json({
    work_date: today,
    state: !row ? 'BELUM_IN' : row.check_out_at ? 'SUDAH_OUT' : 'SUDAH_IN',
    can_check_in: !row, can_check_out: !!row && !row.check_out_at,
    attendance: serialize(row),
    rules: { work_start: cfg.workStart, late_tolerance_min: cfg.lateToleranceMin, timezone: cfg.tz },
    offices: db.prepare('SELECT id,name,address,latitude,longitude,radius_m FROM offices WHERE is_active=1').all(),
  });
}));

// POST /api/attendance/check-in   multipart: photo, lat, lng
router.post('/check-in', ...withUpload((req, res) => {
  const empId = activeEmployeeId(req), now = new Date(), today = T.workDate(now);
  // ATT-02
  if (db.prepare('SELECT 1 FROM attendances WHERE employee_id=? AND work_date=?').get(empId, today))
    throw new ApiError(409, 'Anda sudah IN hari ini', 'ALREADY_CHECKED_IN');
  const g = verifyGpsAndPhoto(req);
  try {
    const r = db.prepare(`INSERT INTO attendances (employee_id, work_date, check_in_at, status, office_id, in_lat, in_lng, in_distance_m, in_photo)
                          VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(empId, today, T.nowWib(now), T.attendanceStatus(now), g.office.id, g.lat, g.lng, g.distance, g.photo);
    res.status(201).json(serialize(db.prepare(`${BASE} WHERE a.id = ?`).get(r.lastInsertRowid)));
  } catch (e) {
    if (/UNIQUE/i.test(e.message)) throw new ApiError(409, 'Anda sudah IN hari ini', 'ALREADY_CHECKED_IN'); // race-condition guard
    throw e;
  }
}));

// POST /api/attendance/check-out  multipart: photo, lat, lng
router.post('/check-out', ...withUpload((req, res) => {
  const empId = activeEmployeeId(req), now = new Date(), today = T.workDate(now);
  const row = db.prepare('SELECT * FROM attendances WHERE employee_id=? AND work_date=?').get(empId, today);
  if (!row) throw new ApiError(409, 'Belum IN hari ini, OUT ditolak', 'NOT_CHECKED_IN');          // ATT-03
  if (row.check_out_at) throw new ApiError(409, 'Anda sudah OUT hari ini', 'ALREADY_CHECKED_OUT'); // ATT-05
  const g = verifyGpsAndPhoto(req);
  const r = db.prepare(`UPDATE attendances SET check_out_at=?, out_lat=?, out_lng=?, out_distance_m=?, out_photo=?
                        WHERE id=? AND check_out_at IS NULL`).run(T.nowWib(now), g.lat, g.lng, g.distance, g.photo, row.id);
  if (!r.changes) throw new ApiError(409, 'Anda sudah OUT hari ini', 'ALREADY_CHECKED_OUT');
  res.json(serialize(db.prepare(`${BASE} WHERE a.id = ?`).get(row.id)));
}));

/**
 * Query daftar absensi (dipakai history & list HR)
 * Filter: date | from+to | preset, status, employee_id, search, sort, page, limit
 */
function listQuery(q, forcedEmployeeId, defPreset) {
  const { from, to } = dateRange(q, defPreset);
  const { page, limit, offset } = paging(q);
  const status = q.status ? String(q.status).toUpperCase() : null;
  if (status && !STATUSES.includes(status)) throw new ApiError(400, `status harus salah satu: ${STATUSES.join(', ')}`, 'VALIDATION');
  const sort = String(q.sort).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const empId = forcedEmployeeId ?? (q.employee_id ? +q.employee_id : null);

  // BELUM_IN: karyawan aktif yang tidak punya absensi (hanya untuk 1 tanggal)
  if (status === 'BELUM_IN') {
    if (from !== to) throw new ApiError(400, 'status BELUM_IN hanya untuk 1 tanggal (gunakan ?date=)', 'VALIDATION');
    const w = ["e.status = 'ACTIVE'", 'NOT EXISTS (SELECT 1 FROM attendances a WHERE a.employee_id = e.id AND a.work_date = ?)'], a = [from];
    if (empId) { w.push('e.id = ?'); a.push(empId); }
    if (q.search) { w.push('(e.name LIKE ? OR e.employee_code LIKE ?)'); a.push(`%${q.search}%`, `%${q.search}%`); }
    const total = db.prepare(`SELECT COUNT(*) c FROM employees e WHERE ${w.join(' AND ')}`).get(...a).c;
    const data = db.prepare(`SELECT e.id AS employee_id, e.employee_code, e.name AS employee_name FROM employees e WHERE ${w.join(' AND ')} ORDER BY e.name LIMIT ? OFFSET ?`)
      .all(...a, limit, offset).map((r) => ({ ...r, work_date: from, status: 'BELUM_IN', check_in_at: null, check_out_at: null }));
    return { data, meta: { page, limit, total, total_pages: Math.ceil(total / limit), from, to } };
  }

  const w = ['a.work_date BETWEEN ? AND ?'], a = [from, to];
  if (empId) { w.push('a.employee_id = ?'); a.push(empId); }
  if (q.search) { w.push('(e.name LIKE ? OR e.employee_code LIKE ?)'); a.push(`%${q.search}%`, `%${q.search}%`); }
  if (status === 'TEPAT_WAKTU' || status === 'TERLAMBAT') { w.push('a.status = ?'); a.push(status); }
  if (status === 'BELUM_OUT') w.push('a.check_out_at IS NULL');
  if (status === 'SUDAH_OUT') w.push('a.check_out_at IS NOT NULL');
  const where = w.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) c FROM attendances a JOIN employees e ON e.id=a.employee_id WHERE ${where}`).get(...a).c;
  const data = db.prepare(`${BASE} WHERE ${where} ORDER BY a.work_date ${sort}, a.check_in_at ${sort} LIMIT ? OFFSET ?`).all(...a, limit, offset).map(serialize);
  return { data, meta: { page, limit, total, total_pages: Math.ceil(total / limit), from, to } };
}

// GET /api/attendance/history  — Employee: miliknya saja (ATT-06). HR: boleh semua / per employee_id.
router.get('/history', wrap((req, res) => {
  if (req.user.role === 'EMPLOYEE') {
    if (req.query.employee_id && +req.query.employee_id !== req.user.employee_id)
      throw new ApiError(403, 'Tidak boleh melihat data karyawan lain', 'FORBIDDEN');
    return res.json(listQuery(req.query, req.user.employee_id, 'this_month'));
  }
  res.json(listQuery(req.query, null, 'today'));
}));

// GET /api/attendance  — daftar absensi untuk HR (web)
router.get('/', requireRole('HR'), wrap((req, res) => res.json(listQuery(req.query, null, 'today'))));

// GET /api/attendance/:id/photo/:type(in|out) — foto dilindungi auth
router.get('/:id/photo/:type', wrap((req, res) => {
  const row = db.prepare('SELECT * FROM attendances WHERE id = ?').get(+req.params.id);
  if (!row) throw new ApiError(404, 'Data tidak ditemukan', 'NOT_FOUND');
  if (req.user.role === 'EMPLOYEE' && row.employee_id !== req.user.employee_id) throw new ApiError(403, 'Akses ditolak', 'FORBIDDEN');
  const file = { in: row.in_photo, out: row.out_photo }[req.params.type];
  if (!file) throw new ApiError(404, 'Foto tidak ada', 'NOT_FOUND');
  res.sendFile(path.join(cfg.uploadDir, 'attendance', path.basename(file)));
}));

module.exports = router;
