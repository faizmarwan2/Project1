const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const cfg = require('../config');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { ApiError, wrap } = require('../utils/http');

router.use(auth, requireRole('HR'));

const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
const genPassword = () => crypto.randomBytes(9).toString('base64url'); // 12 karakter acak
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** email otomatis: nama.depan@ethes.tech (+angka jika bentrok) */
function generateEmail(name) {
  const parts = slug(name).split('.').filter(Boolean);
  const base = parts.slice(0, 2).join('.') || 'karyawan';
  let email = `${base}@${cfg.emailDomain}`, i = 1;
  while (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) email = `${base}${++i}@${cfg.emailDomain}`;
  return email;
}
function generateCode() {
  const seq = db.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'employees'").get()?.seq || 0;
  const r = db.prepare("SELECT MAX(CAST(SUBSTR(employee_code, 3) AS INTEGER)) n FROM employees WHERE LOWER(employee_code) GLOB 'ky[0-9]*'").get();
  return `ky${String(Math.max(seq, r.n || 0) + 1).padStart(2, '0')}`;
}
const view = (id) => db.prepare(`SELECT e.id, e.employee_code, e.name, e.status, e.created_at, u.id AS user_id, u.email
                                 FROM employees e LEFT JOIN users u ON u.employee_id = e.id WHERE e.id = ?`).get(id);

// GET /api/employees?search=&status=&page=&limit=
router.get('/', wrap((req, res) => {
  const { search, status } = req.query;
  const page = Math.max(1, +req.query.page || 1), limit = Math.min(200, Math.max(1, +req.query.limit || 20));
  const where = [], args = [];
  if (status) { if (!['ACTIVE', 'INACTIVE'].includes(status)) throw new ApiError(400, 'status tidak valid', 'VALIDATION'); where.push('e.status = ?'); args.push(status); }
  if (search) { where.push('(e.name LIKE ? OR e.employee_code LIKE ? OR u.email LIKE ?)'); args.push(...Array(3).fill(`%${search}%`)); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) c FROM employees e LEFT JOIN users u ON u.employee_id = e.id ${w}`).get(...args).c;
  const data = db.prepare(`SELECT e.id, e.employee_code, e.name, e.status, u.email FROM employees e
      LEFT JOIN users u ON u.employee_id = e.id ${w} ORDER BY e.id LIMIT ? OFFSET ?`).all(...args, limit, (page - 1) * limit);
  res.json({ data, meta: { page, limit, total, total_pages: Math.ceil(total / limit) } });
}));

router.get('/:id', wrap((req, res) => {
  const e = view(+req.params.id);
  if (!e) throw new ApiError(404, 'Karyawan tidak ditemukan', 'NOT_FOUND');
  res.json(e);
}));

// POST /api/employees { name, employee_code?, email?, password? }  -> buat karyawan + akun login
router.post('/', wrap((req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) throw new ApiError(400, 'Nama wajib diisi', 'VALIDATION');
  const code = (req.body.employee_code || generateCode()).trim();
  const email = (req.body.email || generateEmail(name)).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Format email tidak valid', 'VALIDATION');
  if (req.body.password && String(req.body.password).length < 8) throw new ApiError(400, 'Password minimal 8 karakter', 'VALIDATION');
  const plain = req.body.password || genPassword();

  if (db.prepare('SELECT 1 FROM employees WHERE employee_code = ?').get(code)) throw new ApiError(409, 'Kode karyawan sudah dipakai', 'DUPLICATE_CODE');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw new ApiError(409, 'Email sudah dipakai', 'DUPLICATE_EMAIL');

  db.exec('BEGIN');
  try {
    const e = db.prepare('INSERT INTO employees (employee_code, name) VALUES (?, ?)').run(code, String(name).trim());
    db.prepare("INSERT INTO users (employee_id, email, password_hash, role) VALUES (?, ?, ?, 'EMPLOYEE')")
      .run(e.lastInsertRowid, email, bcrypt.hashSync(plain, 10));
    db.exec('COMMIT');
    // password hanya ditampilkan SEKALI di response ini
    res.status(201).json({ ...view(+e.lastInsertRowid), initial_password: plain });
  } catch (err) { db.exec('ROLLBACK'); throw err; }
}));

// PUT /api/employees/:id { name?, employee_code?, status?, email?, password? }
router.put('/:id', wrap((req, res) => {
  const id = +req.params.id, cur = view(id);
  if (!cur) throw new ApiError(404, 'Karyawan tidak ditemukan', 'NOT_FOUND');
  const b = req.body || {};
  const name = b.name !== undefined ? String(b.name).trim() : cur.name;
  const code = b.employee_code !== undefined ? String(b.employee_code).trim() : cur.employee_code;
  const status = b.status ?? cur.status;
  const email = b.email !== undefined ? String(b.email).trim().toLowerCase() : cur.email;
  if (!name) throw new ApiError(400, 'Nama tidak boleh kosong', 'VALIDATION');
  if (!['ACTIVE', 'INACTIVE'].includes(status)) throw new ApiError(400, 'status tidak valid', 'VALIDATION');
  if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Format email tidak valid', 'VALIDATION');
  if (b.password !== undefined && String(b.password).length < 8) throw new ApiError(400, 'Password minimal 8 karakter', 'VALIDATION');
  if (db.prepare('SELECT 1 FROM employees WHERE employee_code = ? AND id <> ?').get(code, id)) throw new ApiError(409, 'Kode karyawan sudah dipakai', 'DUPLICATE_CODE');
  if (db.prepare('SELECT 1 FROM users WHERE email = ? AND id <> ?').get(email, cur.user_id)) throw new ApiError(409, 'Email sudah dipakai', 'DUPLICATE_EMAIL');

  db.exec('BEGIN');
  try {
    db.prepare('UPDATE employees SET name=?, employee_code=?, status=? WHERE id=?').run(name, code, status, id);
    db.prepare('UPDATE users SET email=? WHERE id=?').run(email, cur.user_id);
    if (b.password) db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(String(b.password), 10), cur.user_id);
    db.exec('COMMIT');
  } catch (err) { db.exec('ROLLBACK'); throw err; }
  res.json(view(id));
}));

router.delete('/:id', wrap(async (req, res) => {
  const e = view(+req.params.id);
  if (!e) throw new ApiError(404, 'Karyawan tidak ditemukan', 'NOT_FOUND');
  const photos = db.prepare('SELECT in_photo, out_photo FROM attendances WHERE employee_id = ?')
    .all(e.id).flatMap((row) => [row.in_photo, row.out_photo]).filter(Boolean);
  const deleted = db.prepare('DELETE FROM employees WHERE id = ?').run(e.id);
  if (!deleted.changes) throw new ApiError(404, 'Karyawan tidak ditemukan', 'NOT_FOUND');

  let photoCleanupFailed = false;
  for (const file of new Set(photos)) {
    try { await fs.unlink(path.join(cfg.uploadDir, 'attendance', path.basename(file))); }
    catch (err) {
      if (err.code !== 'ENOENT') { console.error('Gagal menghapus foto absensi karyawan', err); photoCleanupFailed = true; }
    }
  }
  res.json({
    ok: true,
    ...(photoCleanupFailed ? { warning: 'Karyawan sudah dihapus, tetapi sebagian foto absensi gagal dihapus.' } : {}),
  });
}));

// POST /api/employees/:id/reset-password  -> password acak baru
router.post('/:id/reset-password', wrap((req, res) => {
  const e = view(+req.params.id);
  if (!e) throw new ApiError(404, 'Karyawan tidak ditemukan', 'NOT_FOUND');
  const plain = genPassword();
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(plain, 10), e.user_id);
  res.json({ id: e.id, email: e.email, new_password: plain });
}));

module.exports = router;
