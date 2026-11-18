const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cfg = require('../config');
const db = require('../db');
const { auth } = require('../middleware/auth');
const { ApiError, wrap } = require('../utils/http');

// POST /api/login  { email, password }
router.post('/login', wrap((req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'Email dan password wajib diisi', 'VALIDATION');
  const u = db.prepare(`SELECT u.*, e.status AS emp_status FROM users u
                        LEFT JOIN employees e ON e.id = u.employee_id WHERE u.email = ?`).get(String(email).trim().toLowerCase());
  if (!u || !bcrypt.compareSync(String(password), u.password_hash))
    throw new ApiError(401, 'Email atau password salah', 'INVALID_CREDENTIALS');
  if (u.role === 'EMPLOYEE' && u.emp_status !== 'ACTIVE')
    throw new ApiError(403, 'Akun karyawan nonaktif', 'ACCOUNT_INACTIVE');
  const token = jwt.sign({ sub: u.id, role: u.role }, cfg.jwtSecret, { expiresIn: cfg.jwtExpiresIn });
  res.json({ token, role: u.role, user: { id: u.id, email: u.email, role: u.role, employee_id: u.employee_id } });
}));

// GET /api/me
router.get('/me', auth, wrap((req, res) => {
  const emp = req.user.employee_id
    ? db.prepare('SELECT id, employee_code, name, status FROM employees WHERE id = ?').get(req.user.employee_id)
    : null;
  res.json({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, account_code: req.user.account_code, employee: emp });
}));

module.exports = router;
