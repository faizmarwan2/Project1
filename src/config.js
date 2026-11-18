const path = require('path');
const root = path.join(__dirname, '..');
// loader .env sederhana (tanpa dependency)
try {
  require('fs').readFileSync(path.join(root, '.env'), 'utf8').split('\n').forEach((l) => {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  });
} catch (_) {}

module.exports = {
  port: +process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  dbPath: path.resolve(root, process.env.DB_PATH || './data/attendance.db'),
  uploadDir: path.resolve(root, process.env.UPLOAD_DIR || './uploads'),
  emailDomain: process.env.EMAIL_DOMAIN || 'ethes.tech',
  hrEmail: process.env.HR_EMAIL || 'se@ethes.tech',
  hrPassword: process.env.HR_PASSWORD || 'Admin123!',
  tz: 'Asia/Jakarta',
  // aturan simulasi
  workStart: '08:00',
  lateToleranceMin: 15,
};
