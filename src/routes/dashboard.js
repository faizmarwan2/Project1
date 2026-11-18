const router = require('express').Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { wrap, ApiError } = require('../utils/http');
const T = require('../utils/time');

router.use(auth, requireRole('HR'));

/**
 * GET /api/dashboard/attendance?date=YYYY-MM-DD   (default: hari ini)
 * -> ringkasan hari itu, daftar terlambat / belum OUT / belum IN, dan tren 7 hari terakhir
 */
router.get('/attendance', wrap((req, res) => {
  const date = req.query.date || T.workDate();
  if (!T.isDate(date)) throw new ApiError(400, 'Format tanggal harus YYYY-MM-DD', 'VALIDATION');
  const totalActive = db.prepare("SELECT COUNT(*) c FROM employees WHERE status='ACTIVE'").get().c;
  const s = db.prepare(`SELECT COUNT(*) sudah_in,
      COALESCE(SUM(status='TEPAT_WAKTU'),0) tepat_waktu, COALESCE(SUM(status='TERLAMBAT'),0) terlambat,
      COALESCE(SUM(check_out_at IS NULL),0) belum_out, COALESCE(SUM(check_out_at IS NOT NULL),0) sudah_out
      FROM attendances WHERE work_date = ?`).get(date);
  const cols = 'a.id, e.employee_code, e.name, a.check_in_at, a.check_out_at, a.status';
  const join = 'FROM attendances a JOIN employees e ON e.id = a.employee_id';
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = T.addDays(date, -i);
    const t = db.prepare(`SELECT COUNT(*) sudah_in, COALESCE(SUM(status='TERLAMBAT'),0) terlambat FROM attendances WHERE work_date = ?`).get(d);
    trend.push({ date: d, sudah_in: t.sudah_in, terlambat: t.terlambat });
  }
  res.json({
    date, total_active_employees: totalActive,
    summary: { ...s, belum_in: Math.max(0, totalActive - s.sudah_in) },
    late: db.prepare(`SELECT ${cols} ${join} WHERE a.work_date=? AND a.status='TERLAMBAT' ORDER BY a.check_in_at`).all(date),
    not_checked_out: db.prepare(`SELECT ${cols} ${join} WHERE a.work_date=? AND a.check_out_at IS NULL ORDER BY a.check_in_at`).all(date),
    not_checked_in: db.prepare(`SELECT e.id, e.employee_code, e.name FROM employees e WHERE e.status='ACTIVE'
        AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.employee_id=e.id AND a.work_date=?) ORDER BY e.name`).all(date),
    trend,
  });
}));

module.exports = router;
