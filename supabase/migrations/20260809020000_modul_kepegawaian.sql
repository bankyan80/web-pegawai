-- =============================================================
-- Modul Kepegawaian Sekolah Negeri (Layanan Kepegawaian + Status)
-- Bagian 1: TABEL BARU.
-- Bagian restruktur menu diterapkan via REST (state DB live) dan
-- tercatat di seed 20260808060000_kelola_menu.sql.
-- =============================================================

-- Semua tabel memakai pegawai_id sebagai relasi ke tabel pegawai
-- (single source of truth: nama/nip/unit diturunkan dari pegawai).

CREATE TABLE IF NOT EXISTS sertifikasi (
  id BIGSERIAL PRIMARY KEY,
  pegawai_id BIGINT,
  nama_sertifikasi TEXT,
  nomor TEXT,
  bidang TEXT,
  tahun TEXT,
  status TEXT DEFAULT 'Aktif',
  tunjangan TEXT,
  status_bayar TEXT DEFAULT 'Belum Dibayar',
  keterangan TEXT,
  created_at TEXT DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sertifikasi_pegawai ON sertifikasi (pegawai_id);

CREATE TABLE IF NOT EXISTS mutasi (
  id BIGSERIAL PRIMARY KEY,
  pegawai_id BIGINT,
  jenis TEXT,
  asal TEXT,
  tujuan TEXT,
  tanggal TEXT,
  nomor_sk TEXT,
  status TEXT DEFAULT 'Diajukan',
  keterangan TEXT,
  dokumen TEXT,
  created_at TEXT DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mutasi_pegawai ON mutasi (pegawai_id);

CREATE TABLE IF NOT EXISTS jabatan_pegawai (
  id BIGSERIAL PRIMARY KEY,
  pegawai_id BIGINT,
  jabatan TEXT,
  jenis TEXT DEFAULT 'Utama',
  tmt TEXT,
  nomor_sk TEXT,
  tanggal_sk TEXT,
  status TEXT DEFAULT 'Aktif',
  keterangan TEXT,
  created_at TEXT DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jabatan_pegawai_pegawai ON jabatan_pegawai (pegawai_id);

CREATE TABLE IF NOT EXISTS arsip (
  id BIGSERIAL PRIMARY KEY,
  pegawai_id BIGINT,
  kategori TEXT,
  nama_dokumen TEXT,
  file TEXT,
  keterangan TEXT,
  created_at TEXT DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_arsip_pegawai ON arsip (pegawai_id);

CREATE TABLE IF NOT EXISTS riwayat_status (
  id BIGSERIAL PRIMARY KEY,
  pegawai_id BIGINT,
  status_lama TEXT,
  status_baru TEXT,
  tanggal TEXT,
  nomor_sk TEXT,
  keterangan TEXT,
  created_at TEXT DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_riwayat_status_pegawai ON riwayat_status (pegawai_id);

CREATE TABLE IF NOT EXISTS surat_kepegawaian (
  id BIGSERIAL PRIMARY KEY,
  pegawai_id BIGINT,
  jenis TEXT,
  nomor TEXT,
  tanggal TEXT,
  perihal TEXT,
  isi TEXT,
  status TEXT DEFAULT 'Draft',
  created_at TEXT DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_surat_kepegawaian_pegawai ON surat_kepegawaian (pegawai_id);
