const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { ApiError } = require('./utils/http');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'public'))); // web HR
app.get('/health', (_q, r) => r.json({ ok: true }));
app.use('/api', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/offices', require('./routes/offices'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use((_q, _r, next) => next(new ApiError(404, 'Endpoint tidak ditemukan', 'NOT_FOUND')));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) err = new ApiError(400, err.code === 'LIMIT_FILE_SIZE' ? 'Foto maksimal 5 MB' : err.message, 'INVALID_PHOTO');
  if (err.type === 'entity.parse.failed') err = new ApiError(400, 'JSON tidak valid', 'VALIDATION');
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: { code: err.code || 'INTERNAL', message: status === 500 ? 'Terjadi kesalahan server' : err.message, ...(err.extra || {}) } });
});

module.exports = app;
