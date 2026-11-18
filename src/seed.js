const bcrypt = require('bcryptjs');
const cfg = require('./config');
const db = require('./db');
const nextHrCode = require('./utils/hr-code');

function ensureSeed() {
  if (!db.prepare("SELECT 1 FROM users WHERE role='HR'").get()) {
    db.prepare("INSERT INTO users (account_code, email, password_hash, role) VALUES (?,?,?, 'HR')")
      .run(nextHrCode(), cfg.hrEmail.toLowerCase(), bcrypt.hashSync(cfg.hrPassword, 10));
    console.log(`[seed] HR admin: ${cfg.hrEmail} / ${cfg.hrPassword}`);
  }
  if (!db.prepare('SELECT 1 FROM offices').get()) {
    // GANTI koordinat ini dengan lokasi kantor sebenarnya (Google Maps -> klik kanan -> salin koordinat)
    db.prepare('INSERT INTO offices (name,address,latitude,longitude,radius_m) VALUES (?,?,?,?,?)')
      .run('Kantor Pusat', 'Jl. Contoh No. 1', -7.4296, 111.0095, 100);
    console.log('[seed] Office demo dibuat (Sragen) — ubah lewat PUT /api/offices/:id');
  }
}
module.exports = { ensureSeed };
if (require.main === module) ensureSeed();
