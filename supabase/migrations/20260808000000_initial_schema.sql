-- =============================================================
-- Skema database Sistem Kepegawaian Timker (Supabase)
-- =============================================================

-- ---------- Referensi ----------
CREATE TABLE IF NOT EXISTS referensi (
  id BIGSERIAL PRIMARY KEY,
  kategori TEXT NOT NULL,
  kode TEXT NOT NULL,
  nama TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif'
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_referensi_kode ON referensi (kategori, kode);

-- ---------- Pegawai ----------
CREATE TABLE IF NOT EXISTS pegawai (
  id BIGSERIAL PRIMARY KEY,
  nip TEXT NOT NULL UNIQUE,
  nik TEXT,
  nama TEXT NOT NULL,
  ttl TEXT,
  jk TEXT,
  alamat TEXT,
  hp TEXT,
  email TEXT,
  jenis TEXT,
  pangkat TEXT,
  golongan TEXT,
  jabatan TEXT,
  unit TEXT,
  tmt TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  foto TEXT
);

-- ---------- Presensi ----------
CREATE TABLE IF NOT EXISTS presensi (
  id BIGSERIAL PRIMARY KEY,
  tanggal TEXT NOT NULL,
  nip TEXT,
  nama TEXT,
  masuk TEXT,
  pulang TEXT,
  status TEXT,
  ket TEXT
);

-- ---------- Surat masuk ----------
CREATE TABLE IF NOT EXISTS surat (
  id BIGSERIAL PRIMARY KEY,
  nomor TEXT,
  tanggal TEXT,
  perihal TEXT,
  pengirim TEXT,
  status TEXT
);

-- ---------- Kepangkatan ----------
CREATE TABLE IF NOT EXISTS kepangkatan (
  id BIGSERIAL PRIMARY KEY,
  nip TEXT,
  nama TEXT,
  lama TEXT,
  baru TEXT,
  tmt TEXT,
  status TEXT
);

-- ---------- Gaji berkala ----------
CREATE TABLE IF NOT EXISTS gaji_berkala (
  id BIGSERIAL PRIMARY KEY,
  nip TEXT,
  nama TEXT,
  pangkat TEXT,
  gaji TEXT,
  tmt_lama TEXT,
  tmt_berikut TEXT,
  status TEXT
);

-- ---------- Cuti ----------
CREATE TABLE IF NOT EXISTS cuti (
  id BIGSERIAL PRIMARY KEY,
  pemohon TEXT,
  jenis TEXT,
  mulai TEXT,
  selesai TEXT,
  lama TEXT,
  status TEXT
);

-- ---------- Izin cerai ----------
CREATE TABLE IF NOT EXISTS izin_cerai (
  id BIGSERIAL PRIMARY KEY,
  pegawai TEXT,
  nip TEXT,
  tanggal TEXT,
  status TEXT,
  tahapan TEXT
);

-- ---------- SLKS ----------
CREATE TABLE IF NOT EXISTS slks (
  id BIGSERIAL PRIMARY KEY,
  nip TEXT,
  nama TEXT,
  masa_kerja TEXT,
  kategori TEXT,
  tahun INTEGER,
  status TEXT
);

-- ---------- Pengadaan pegawai ----------
CREATE TABLE IF NOT EXISTS pengadaan (
  id BIGSERIAL PRIMARY KEY,
  formasi TEXT,
  jabatan TEXT,
  unit TEXT,
  jumlah INTEGER,
  terisi INTEGER,
  sisa INTEGER,
  status TEXT
);

-- ---------- Pensiun ----------
CREATE TABLE IF NOT EXISTS pensiun (
  id BIGSERIAL PRIMARY KEY,
  nip TEXT,
  nama TEXT,
  jabatan TEXT,
  tgl_lahir TEXT,
  bup TEXT,
  perkiraan TEXT,
  status TEXT
);

-- ---------- Pindah tugas ----------
CREATE TABLE IF NOT EXISTS pindah_tugas (
  id BIGSERIAL PRIMARY KEY,
  pegawai TEXT,
  asal TEXT,
  tujuan TEXT,
  tanggal TEXT,
  status TEXT
);

-- ---------- Penempatan tugas ----------
CREATE TABLE IF NOT EXISTS penempatan (
  id BIGSERIAL PRIMARY KEY,
  pegawai TEXT,
  jabatan TEXT,
  unit TEXT,
  tugas TEXT,
  tmt TEXT,
  status TEXT
);

-- ---------- Disiplin pegawai ----------
CREATE TABLE IF NOT EXISTS disiplin (
  id BIGSERIAL PRIMARY KEY,
  pegawai TEXT,
  pelanggaran TEXT,
  tanggal TEXT,
  tingkat TEXT,
  status TEXT
);

-- ---------- Diklat struktural ----------
CREATE TABLE IF NOT EXISTS diklat_struktural (
  id BIGSERIAL PRIMARY KEY,
  pegawai TEXT,
  diklat TEXT,
  penyelenggara TEXT,
  tahun INTEGER,
  durasi TEXT,
  status TEXT,
  sertifikat TEXT
);

-- ---------- Diklat teknis ----------
CREATE TABLE IF NOT EXISTS diklat_teknis (
  id BIGSERIAL PRIMARY KEY,
  pegawai TEXT,
  diklat TEXT,
  kategori TEXT,
  penyelenggara TEXT,
  tahun INTEGER,
  durasi TEXT,
  status TEXT,
  sertifikat TEXT
);

-- ---------- Izin belajar ----------
CREATE TABLE IF NOT EXISTS izin_belajar (
  id BIGSERIAL PRIMARY KEY,
  pegawai TEXT,
  pendidikan TEXT,
  prodi TEXT,
  pt TEXT,
  tahun INTEGER,
  status TEXT
);

-- ---------- Tugas belajar ----------
CREATE TABLE IF NOT EXISTS tugas_belajar (
  id BIGSERIAL PRIMARY KEY,
  pegawai TEXT,
  jenjang TEXT,
  prodi TEXT,
  pt TEXT,
  biaya TEXT,
  status TEXT
);

-- ---------- User kepegawaian (kelola user) ----------
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  nama TEXT,
  email TEXT,
  role TEXT,
  unit TEXT,
  status TEXT DEFAULT 'Aktif',
  login TEXT
);

-- ---------- Akun login aplikasi ----------
CREATE TABLE IF NOT EXISTS member (
  id BIGSERIAL PRIMARY KEY,
  fullname TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  passwors TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('administrator','staff')),
  email TEXT,
  foto TEXT
);

-- ---------- Percobaan login (anti brute-force) ----------
CREATE TABLE IF NOT EXISTS login_attempt (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  ip TEXT NOT NULL,
  attempted_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempt_user_ip ON login_attempt (username, ip);
