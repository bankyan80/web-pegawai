-- Kolom tambahan pegawai sesuai data dummy (pendidikan, jurusan, sekolah)
ALTER TABLE pegawai
  ADD COLUMN IF NOT EXISTS pendidikan TEXT,
  ADD COLUMN IF NOT EXISTS jurusan TEXT,
  ADD COLUMN IF NOT EXISTS sekolah TEXT;
