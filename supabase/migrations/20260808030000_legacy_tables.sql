-- Tabel legacy (aplikasi lama) dipindah ke Supabase.
-- tabel divisi, jabatan, materi, pelatihan, gaji, pegawai_legacy
CREATE TABLE IF NOT EXISTS divisi (
  id BIGSERIAL PRIMARY KEY,
  nama TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jabatan (
  id BIGSERIAL PRIMARY KEY,
  nama TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS materi (
  id BIGSERIAL PRIMARY KEY,
  nama TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pelatihan (
  id BIGSERIAL PRIMARY KEY,
  pegawai_id INTEGER,
  materi_id INTEGER,
  tgl_mulai TEXT,
  tgl_akhir TEXT,
  keterangan TEXT
);

CREATE TABLE IF NOT EXISTS gaji (
  id BIGSERIAL PRIMARY KEY,
  pegawai_id INTEGER,
  gapok NUMERIC,
  tunjab NUMERIC,
  bpjs NUMERIC,
  lain2 NUMERIC
);

-- Pegawai legacy (skema lama dengan relasi divisi/jabatan)
CREATE TABLE IF NOT EXISTS pegawai_legacy (
  id BIGSERIAL PRIMARY KEY,
  nip TEXT,
  nama TEXT NOT NULL,
  gender TEXT,
  tempat_lahir TEXT,
  tanggal_lahir TEXT,
  idjabatan INTEGER,
  iddivisi INTEGER,
  alamat TEXT,
  email TEXT,
  foto TEXT
);
