-- Presensi diubah menjadi arsip PDF per pegawai per tahun & bulan.
-- Struktur: folder tahunan -> file bulanan (PDF) yang diupload admin,
-- pegawai dapat melihat/mengunduh file miliknya sendiri.
DROP TABLE IF EXISTS presensi;
CREATE TABLE presensi (
  id BIGSERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  nip TEXT,
  tahun TEXT,
  bulan TEXT,
  file TEXT,
  keterangan TEXT
);
