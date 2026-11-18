process.env.DB_PATH = './data/test.db';
process.env.UPLOAD_DIR = './uploads-test';
require('fs').rmSync('./data/test.db', { force: true });
require('fs').rmSync('./data/test.db-wal', { force: true });
require('fs').rmSync('./data/test.db-shm', { force: true });

const test = require('node:test');
const assert = require('node:assert');
const { ensureSeed } = require('../src/seed');
ensureSeed();
const app = require('../src/app');

let base, server;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const OFFICE = { lat: -7.4296, lng: 111.0095 };

const api = async (method, path, { token, json, form } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  if (form) body = form;
  const r = await fetch(base + path, { method, headers, body });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const punch = ({ lat = OFFICE.lat, lng = OFFICE.lng, photo = true } = {}) => {
  const f = new FormData();
  f.append('lat', lat); f.append('lng', lng);
  if (photo) f.append('photo', new Blob([PNG], { type: 'image/png' }), 'selfie.png');
  return f;
};

let hr, emp1, emp2, e1, e2;
test.before(async () => {
  server = app.listen(0); base = `http://localhost:${server.address().port}`;
  hr = (await api('POST', '/api/login', { json: { email: 'se@ethes.tech', password: 'Admin123!' } })).body.token;
});
test.after(() => server.close());

test('HR membuat karyawan + akun (email otomatis)', async () => {
  const a = await api('POST', '/api/employees', { token: hr, json: { name: 'Budi Santoso' } });
  assert.equal(a.status, 201); assert.equal(a.body.email, 'budi.santoso@ethes.tech'); assert.ok(a.body.initial_password);
  e1 = a.body;
  const b = await api('POST', '/api/employees', { token: hr, json: { name: 'Budi Santoso' } });
  assert.equal(b.body.email, 'budi.santoso2@ethes.tech'); e2 = b.body;
  emp1 = (await api('POST', '/api/login', { json: { email: e1.email, password: e1.initial_password } })).body.token;
  emp2 = (await api('POST', '/api/login', { json: { email: e2.email, password: e2.initial_password } })).body.token;
  assert.ok(emp1 && emp2);
});

test('ATT-07 token hilang/tidak valid => 401', async () => {
  assert.equal((await api('GET', '/api/me')).status, 401);
  assert.equal((await api('GET', '/api/attendance/today', { token: 'abc' })).status, 401);
});

test('ATT-03 OUT tanpa IN ditolak', async () => {
  const r = await api('POST', '/api/attendance/check-out', { token: emp1, form: punch() });
  assert.equal(r.status, 409); assert.equal(r.body.error.code, 'NOT_CHECKED_IN');
});

test('GPS di luar radius & tanpa foto ditolak', async () => {
  const x = await api('POST', '/api/attendance/check-in', { token: emp1, form: punch({ lat: -6.2, lng: 106.8 }) }); assert.equal(x.body.error.code, 'OUTSIDE_RADIUS');
  assert.equal((await api('POST', '/api/attendance/check-in', { token: emp1, form: punch({ photo: false }) })).body.error.code, 'PHOTO_REQUIRED');
});

test('ATT-01 IN pertama berhasil; ATT-02 IN kedua ditolak tanpa duplikasi', async () => {
  const r = await api('POST', '/api/attendance/check-in', { token: emp1, form: punch() });
  assert.equal(r.status, 201); assert.ok(['TEPAT_WAKTU', 'TERLAMBAT'].includes(r.body.status));
  const r2 = await api('POST', '/api/attendance/check-in', { token: emp1, form: punch() });
  assert.equal(r2.status, 409); assert.equal(r2.body.error.code, 'ALREADY_CHECKED_IN');
  const h = await api('GET', '/api/attendance/history', { token: emp1 });
  assert.equal(h.body.meta.total, 1);
});

test('ATT-04 OUT berhasil; ATT-05 OUT kedua ditolak', async () => {
  assert.equal((await api('POST', '/api/attendance/check-out', { token: emp1, form: punch() })).status, 200);
  const r = await api('POST', '/api/attendance/check-out', { token: emp1, form: punch() });
  assert.equal(r.status, 409); assert.equal(r.body.error.code, 'ALREADY_CHECKED_OUT');
});

test('ATT-06 employee tidak boleh lihat data orang lain', async () => {
  assert.equal((await api('GET', `/api/attendance/history?employee_id=${e1.id}`, { token: emp2 })).status, 403);
  const own = await api('GET', '/api/attendance/history', { token: emp2 });
  assert.equal(own.body.meta.total, 0);
  const list = await api('GET', '/api/attendance', { token: emp1 });
  assert.equal(list.status, 403);
  const att = (await api('GET', '/api/attendance', { token: hr })).body.data[0];
  assert.equal((await api('GET', `/api/attendance/${att.id}/photo/in`, { token: emp2 })).status, 403);
});

test('HR: filter tanggal, status, dashboard', async () => {
  const today = (await api('GET', '/api/attendance/today', { token: emp1 })).body.work_date;
  assert.equal((await api('GET', `/api/attendance?date=${today}`, { token: hr })).body.meta.total, 1);
  assert.equal((await api('GET', '/api/attendance?preset=last7&status=SUDAH_OUT', { token: hr })).body.meta.total, 1);
  assert.equal((await api('GET', '/api/attendance?preset=yesterday', { token: hr })).body.meta.total, 0);
  const bi = await api('GET', `/api/attendance?date=${today}&status=BELUM_IN`, { token: hr });
  assert.equal(bi.body.meta.total, 1);
  assert.equal((await api('GET', '/api/attendance?from=2026-02-01&to=2026-01-01', { token: hr })).status, 400);
  const d = await api('GET', '/api/dashboard/attendance', { token: hr });
  assert.equal(d.body.summary.sudah_in, 1); assert.equal(d.body.summary.belum_in, 1); assert.equal(d.body.trend.length, 7);
});

test('karyawan nonaktif tidak bisa login', async () => {
  await api('PUT', `/api/employees/${e2.id}`, { token: hr, json: { status: 'INACTIVE' } });
  assert.equal((await api('POST', '/api/login', { json: { email: e2.email, password: e2.initial_password } })).status, 403);
});
