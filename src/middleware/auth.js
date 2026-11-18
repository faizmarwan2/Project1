const jwt = require('jsonwebtoken');
const cfg = require('../config');
const db = require('../db');
const { ApiError } = require('../utils/http');

/** ATT-07: token hilang/tidak valid => 401 */
function auth(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Token tidak ada', 'UNAUTHORIZED'));
  let payload;
  try { payload = jwt.verify(token, cfg.jwtSecret); }
  catch { return next(new ApiError(401, 'Token tidak valid atau kedaluwarsa', 'UNAUTHORIZED')); }

  const user = db.prepare('SELECT id, employee_id, email, role FROM users WHERE id = ?').get(payload.sub);
  if (!user) return next(new ApiError(401, 'User tidak ditemukan', 'UNAUTHORIZED'));
  req.user = user;
  next();
}

const requireRole = (role) => (req, _res, next) =>
  req.user.role === role ? next() : next(new ApiError(403, 'Akses ditolak', 'FORBIDDEN'));

module.exports = { auth, requireRole };
