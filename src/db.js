const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const cfg = require('./config');

fs.mkdirSync(path.dirname(cfg.dbPath), { recursive: true });
const db = new DatabaseSync(cfg.dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  name TEXT,
  account_code TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('HR','EMPLOYEE'))
);
CREATE TABLE IF NOT EXISTS offices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS attendances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date TEXT NOT NULL,
  check_in_at TEXT,
  check_out_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('TEPAT_WAKTU','TERLAMBAT')),
  office_id INTEGER REFERENCES offices(id),
  in_lat REAL, in_lng REAL, in_distance_m REAL, in_photo TEXT,
  out_lat REAL, out_lng REAL, out_distance_m REAL, out_photo TEXT,
  UNIQUE (employee_id, work_date)
);
CREATE INDEX IF NOT EXISTS idx_att_date ON attendances(work_date);
`);

if (db.prepare('PRAGMA user_version').get().user_version < 1) {
  db.exec('BEGIN IMMEDIATE');
  try {
    if (db.prepare('PRAGMA user_version').get().user_version < 1) {
      const employees = db.prepare('SELECT id FROM employees ORDER BY id').all();
      const updateCode = db.prepare('UPDATE employees SET employee_code = ? WHERE id = ?');
      employees.forEach(({ id }) => updateCode.run(`__migration_${crypto.randomUUID()}__`, id));
      employees.forEach(({ id }, index) => updateCode.run(`ky${String(index + 1).padStart(2, '0')}`, id));
      db.exec('PRAGMA user_version = 1');
    }
    db.exec('COMMIT');
  } catch (err) { db.exec('ROLLBACK'); throw err; }
}

if (db.prepare('PRAGMA user_version').get().user_version < 2) {
  db.exec('BEGIN IMMEDIATE');
  try {
    if (db.prepare('PRAGMA user_version').get().user_version < 2) {
      if (!db.prepare('PRAGMA table_info(users)').all().some((column) => column.name === 'account_code')) {
        db.exec('ALTER TABLE users ADD COLUMN account_code TEXT');
      }
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_account_code ON users(account_code)');
      const admins = db.prepare("SELECT id FROM users WHERE role = 'HR' ORDER BY id").all();
      const updateCode = db.prepare('UPDATE users SET account_code = ? WHERE id = ?');
      admins.forEach(({ id }, index) => updateCode.run(`HR${String(index + 1).padStart(2, '0')}`, id));
      db.exec('CREATE TABLE IF NOT EXISTS hr_code_sequence (id INTEGER PRIMARY KEY CHECK (id = 1), seq INTEGER NOT NULL)');
      db.prepare('INSERT OR REPLACE INTO hr_code_sequence (id, seq) VALUES (1, ?)').run(admins.length);
      db.exec('PRAGMA user_version = 2');
    }
    db.exec('COMMIT');
  } catch (err) { db.exec('ROLLBACK'); throw err; }
}

if (db.prepare('PRAGMA user_version').get().user_version < 3) {
  db.exec('BEGIN IMMEDIATE');
  try {
    if (db.prepare('PRAGMA user_version').get().user_version < 3) {
      if (!db.prepare('PRAGMA table_info(users)').all().some((column) => column.name === 'name')) {
        db.exec('ALTER TABLE users ADD COLUMN name TEXT');
      }
      db.exec('PRAGMA user_version = 3');
    }
    db.exec('COMMIT');
  } catch (err) { db.exec('ROLLBACK'); throw err; }
}

module.exports = db;
