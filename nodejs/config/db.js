const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const DB_FILE = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : process.env.VERCEL
    ? '/tmp/database.sqlite'
    : path.join(__dirname, '..', 'database.sqlite');

const db = new DatabaseSync(DB_FILE);

db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA journal_mode = WAL');

const schema = `
CREATE TABLE IF NOT EXISTS divisi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS jabatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS member (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullname TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  passwors TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('administrator','manager','staff')),
  email TEXT,
  foto TEXT
);
CREATE TABLE IF NOT EXISTS pegawai (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nip TEXT NOT NULL,
  nama TEXT NOT NULL,
  gender TEXT,
  tempat_lahir TEXT,
  tanggal_lahir TEXT,
  idjabatan INTEGER,
  iddivisi INTEGER,
  alamat TEXT,
  email TEXT,
  foto TEXT,
  FOREIGN KEY (idjabatan) REFERENCES jabatan(id),
  FOREIGN KEY (iddivisi) REFERENCES divisi(id)
);
CREATE TABLE IF NOT EXISTS materi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pelatihan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pegawai_id INTEGER,
  materi_id INTEGER,
  tgl_mulai TEXT,
  tgl_akhir TEXT,
  keterangan TEXT,
  FOREIGN KEY (pegawai_id) REFERENCES pegawai(id),
  FOREIGN KEY (materi_id) REFERENCES materi(id)
);
CREATE TABLE IF NOT EXISTS gaji (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pegawai_id INTEGER,
  gapok NUMERIC,
  tunjab NUMERIC,
  bpjs NUMERIC,
  lain2 NUMERIC,
  FOREIGN KEY (pegawai_id) REFERENCES pegawai(id)
);
CREATE TABLE IF NOT EXISTS login_attempt (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  ip TEXT NOT NULL,
  attempted_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempt_user_ip ON login_attempt (username, ip);
`;
db.exec(schema);

function seed() {
  const sha1 = (v) => crypto.createHash('sha1').update(v).digest('hex');
  const count = (t) => db.prepare('SELECT COUNT(*) c FROM ' + t).get().c;

  if (count('divisi') === 0) {
    const st = db.prepare('INSERT INTO divisi (nama) VALUES (?)');
    ['IT', 'HRD', 'Finance', 'Marketing'].forEach((n) => st.run(n));
  }
  if (count('jabatan') === 0) {
    const st = db.prepare('INSERT INTO jabatan (nama) VALUES (?)');
    ['Manager', 'Supervisor', 'Staff'].forEach((n) => st.run(n));
  }
  if (count('member') === 0) {
    const st = db.prepare(
      'INSERT INTO member (fullname, username, passwors, role, email) VALUES (?,?,?,?,?)'
    );
    st.run('Administrator', 'admin', sha1('admin123'), 'administrator', 'admin@example.com');
    st.run('Staff Umum', 'staff', sha1('staff123'), 'staff', 'staff@example.com');
  }
  if (count('pegawai') === 0) {
    const st = db.prepare(
      'INSERT INTO pegawai (nip,nama,gender,tempat_lahir,tanggal_lahir,idjabatan,iddivisi,alamat,email,foto) VALUES (?,?,?,?,?,?,?,?,?,?)'
    );
    st.run('P001', 'Budi Santoso', 'L', 'Jakarta', '1990-05-12', 3, 1, 'Jl. Merdeka No.1, Jakarta', 'budi@example.com', '');
    st.run('P002', 'Siti Aminah', 'P', 'Bandung', '1992-08-23', 2, 2, 'Jl. Asia Afrika No.5, Bandung', 'siti@example.com', '');
    st.run('P003', 'Agus Wijaya', 'L', 'Surabaya', '1988-01-30', 1, 1, 'Jl. Pemuda No.9, Surabaya', 'agus@example.com', '');
  }
  if (count('materi') === 0) {
    const st = db.prepare('INSERT INTO materi (nama) VALUES (?)');
    ['Pelatihan Bootstrap 4', 'Pelatihan PHP OOP'].forEach((n) => st.run(n));
  }
  if (count('pelatihan') === 0) {
    const st = db.prepare(
      'INSERT INTO pelatihan (pegawai_id,materi_id,tgl_mulai,tgl_akhir,keterangan) VALUES (?,?,?,?,?)'
    );
    st.run(1, 1, '2026-01-10', '2026-01-14', 'Dasar Bootstrap 4');
    st.run(2, 2, '2026-02-01', '2026-02-05', 'PHP OOP lanjutan');
  }
  if (count('gaji') === 0) {
    const st = db.prepare(
      'INSERT INTO gaji (pegawai_id,gapok,tunjab,bpjs,lain2) VALUES (?,?,?,?,?)'
    );
    st.run(1, 5000000, 1500000, 400000, 200000);
    st.run(2, 4000000, 1000000, 350000, 150000);
  }
}
seed();

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  const kind = sql.trim().toLowerCase().split(/[\s(]/)[0];
  if (kind === 'select') {
    return [stmt.all(...params), []];
  }
  const info = stmt.run(...params);
  return [
    { affectedRows: Number(info.changes), insertId: Number(info.lastInsertRowid), fieldCount: 0 },
    []
  ];
}

const pool = { query };

module.exports = pool;
module.exports.db = db;
module.exports.DB_FILE = DB_FILE;
