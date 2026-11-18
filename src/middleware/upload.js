const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const cfg = require('../config');
const { ApiError } = require('../utils/http');

fs.mkdirSync(path.join(cfg.uploadDir, 'attendance'), { recursive: true });

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

/** Foto kamera (field "photo"), maks 5 MB, hanya gambar */
module.exports = multer({
  storage: multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, path.join(cfg.uploadDir, 'attendance')),
    filename: (_r, f, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[f.mimetype] || '.jpg'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_r, f, cb) => (ALLOWED[f.mimetype] ? cb(null, true) : cb(new ApiError(400, 'Foto harus JPEG/PNG/WEBP', 'INVALID_PHOTO'))),
}).single('photo');
