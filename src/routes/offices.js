const router = require('express').Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { validCoord } = require('../utils/geo');
const { ApiError, wrap } = require('../utils/http');

router.use(auth);

// GET /api/offices  (HR & Employee: lokasi office)
router.get('/', wrap((_req, res) => {
  res.json({ data: db.prepare('SELECT * FROM offices WHERE is_active = 1 ORDER BY name').all() });
}));

function parse(b, cur = {}) {
  const o = {
    name: b.name ?? cur.name, address: b.address ?? cur.address ?? null,
    latitude: b.latitude !== undefined ? +b.latitude : cur.latitude,
    longitude: b.longitude !== undefined ? +b.longitude : cur.longitude,
    radius_m: b.radius_m !== undefined ? +b.radius_m : (cur.radius_m ?? 100),
    is_active: b.is_active !== undefined ? (b.is_active ? 1 : 0) : (cur.is_active ?? 1),
  };
  if (!o.name || !validCoord(o.latitude, o.longitude)) throw new ApiError(400, 'name, latitude, longitude wajib & valid', 'VALIDATION');
  if (!(o.radius_m >= 10 && o.radius_m <= 5000)) throw new ApiError(400, 'radius_m harus 10-5000 meter', 'VALIDATION');
  return o;
}

router.post('/', requireRole('HR'), wrap((req, res) => {
  const o = parse(req.body || {});
  const r = db.prepare('INSERT INTO offices (name,address,latitude,longitude,radius_m,is_active) VALUES (?,?,?,?,?,?)')
    .run(o.name, o.address, o.latitude, o.longitude, o.radius_m, o.is_active);
  res.status(201).json(db.prepare('SELECT * FROM offices WHERE id=?').get(r.lastInsertRowid));
}));

router.put('/:id', requireRole('HR'), wrap((req, res) => {
  const cur = db.prepare('SELECT * FROM offices WHERE id=?').get(+req.params.id);
  if (!cur) throw new ApiError(404, 'Office tidak ditemukan', 'NOT_FOUND');
  const o = parse(req.body || {}, cur);
  db.prepare('UPDATE offices SET name=?,address=?,latitude=?,longitude=?,radius_m=?,is_active=? WHERE id=?')
    .run(o.name, o.address, o.latitude, o.longitude, o.radius_m, o.is_active, cur.id);
  res.json(db.prepare('SELECT * FROM offices WHERE id=?').get(cur.id));
}));

module.exports = router;
