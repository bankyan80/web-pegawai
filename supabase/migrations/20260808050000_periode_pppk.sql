-- =============================================================
-- Modul Periode PPPK + riwayat + audit log
-- Satu pegawai dapat memiliki banyak periode PPPK.
-- Periode lama tidak dihapus; tersimpan sebagai riwayat.
-- =============================================================

-- ---------- Periode PPPK ----------
CREATE TABLE IF NOT EXISTS periode_pppk (
  id BIGSERIAL PRIMARY KEY,
  pegawai_id BIGINT,
  nip TEXT,
  nama TEXT,
  nik TEXT,
  npsn TEXT,
  sekolah TEXT,
  jabatan TEXT,
  jenis TEXT,
  nomor_perjanjian TEXT,
  tanggal_perjanjian TEXT,
  tanggal_mulai TEXT,
  tanggal_berakhir TEXT,
  keterangan TEXT,
  dokumen TEXT,
  status TEXT,
  periode_ke INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_periode_pppk_pegawai ON periode_pppk (pegawai_id);

-- ---------- Riwayat periode PPPK (audit perubahan) ----------
CREATE TABLE IF NOT EXISTS riwayat_periode_pppk (
  id BIGSERIAL PRIMARY KEY,
  periode_id BIGINT,
  pegawai_id BIGINT,
  periode_ke INTEGER,
  nip TEXT,
  nama TEXT,
  nik TEXT,
  npsn TEXT,
  sekolah TEXT,
  jabatan TEXT,
  jenis TEXT,
  nomor_perjanjian TEXT,
  tanggal_perjanjian TEXT,
  tanggal_mulai TEXT,
  tanggal_berakhir TEXT,
  keterangan TEXT,
  dokumen TEXT,
  status TEXT,
  aksi TEXT,
  oleh TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_riwayat_pppk_pegawai ON riwayat_periode_pppk (pegawai_id);

-- ---------- Audit log umum ----------
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  modul TEXT,
  aksi TEXT,
  record_id TEXT,
  detail TEXT,
  oleh TEXT,
  role TEXT,
  created_at TEXT
);

-- ---------- Kolom unit (sekolah) untuk akun login ----------
ALTER TABLE member ADD COLUMN IF NOT EXISTS unit TEXT;
