const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const cfg = require('../config');
const db = require('../db');
const nextHrCode = require('../utils/hr-code');
const { auth, requireRole } = require('../middleware/auth');
const { ApiError, wrap } = require('../utils/http');

router.use(auth, requireRole('HR'));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
const generateEmail = (name) => {
  const base = slug(name).split('.').filter(Boolean).slice(0, 2).join('.') || 'admin';
  let email = `${base}@${cfg.emailDomain}`, i = 1;
  while (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) email = `${base}${++i}@${cfg.emailDomain}`;
  return email;
};

router.get('/', wrap((req, res) => {
  const search = String(req.query.search || '').trim();
  const page = Math.max(1, +req.query.page || 1), limit = Math.min(200, Math.max(1, +req.query.limit || 20));
  const where = search ? 'role = ? AND (account_code LIKE ? OR email LIKE ?)' : 'role = ?';
  const args = search ? ['HR', `%${search}%`, `%${search}%`] : ['HR'];
  const total = db.prepare(`SELECT COUNT(*) c FROM users WHERE ${where}`).get(...args).c;
  const data = db.prepare(`SELECT account_code, COALESCE(name, email) AS name, email FROM users WHERE ${where} ORDER BY id LIMIT ? OFFSET ?`)
    .all(...args, limit, (page - 1) * limit);
  res.json({ data, meta: { page, limit, total, total_pages: Math.ceil(total / limit) } });
}));

router.post('/', wrap((req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  if (!name) throw new ApiError(400, 'Nama wajib diisi', 'VALIDATION');
  const email = String(body.email || generateEmail(name)).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Format email tidak valid', 'VALIDATION');
  if (body.password && String(body.password).length < 8) throw new ApiError(400, 'Password minimal 8 karakter', 'VALIDATION');
  const password = body.password ? String(body.password) : crypto.randomBytes(9).toString('base64url');

  db.exec('BEGIN IMMEDIATE');
  let accountCode;
  try {
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw new ApiError(409, 'Email sudah dipakai', 'DUPLICATE_EMAIL');
    accountCode = nextHrCode();
    db.prepare("INSERT INTO users (account_code, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'HR')")
      .run(accountCode, name, email, bcrypt.hashSync(password, 10));
    db.exec('COMMIT');
  } catch (err) { db.exec('ROLLBACK'); throw err; }
  res.status(201).json({ account_code: accountCode, name, email, role: 'HR', initial_password: password });
}));

module.exports = router;
