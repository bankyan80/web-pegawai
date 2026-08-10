-- 2026-08-10: Presensi diubah menjadi ARSIP berbasis Google Drive.
--
-- Semua PDF yang sebelumnya diupload ke bucket "dokumen" telah DIHAPUS dan
-- tabel `presensi` dikosongkan, lalu diisi ulang dengan tautan Google Drive
-- sesuai nama pegawai masing-masing (Januari s/d Juni 2026).
--
-- Tabel `presensi` TIDAK lagi menampung file upload; kolom `file` kini
-- menyimpan tautan Google Drive:
--   https://drive.google.com/file/d/<id>/view
--
-- Untuk memperbarui arsip (mis. setelah mengunggah PDF baru di Drive):
--   1) perbarui drive_absensi_pppk_links.csv dari folder Google Drive,
--   2) regenerasi scripts/presensi-drive-seed.json,
--   3) jalankan:  node scripts/seed-presensi-drive.js
--
-- Skema tabel tetap sama (lihat 20260808040000_presensi_arsip.sql).

CREATE TABLE IF NOT EXISTS presensi (
  id BIGSERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  nip TEXT,
  tahun TEXT,
  bulan TEXT,
  file TEXT,
  keterangan TEXT
);
