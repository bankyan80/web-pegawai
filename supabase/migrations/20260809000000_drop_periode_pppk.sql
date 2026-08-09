-- =============================================================
-- Hapus tabel modul Periode PPPK (tidak terpakai).
-- Modul kini diturunkan otomatis dari Profil Pegawai.
-- Kolom member.unit tetap dipertahankan.
-- =============================================================

DROP TABLE IF EXISTS riwayat_periode_pppk;
DROP TABLE IF EXISTS periode_pppk;
DROP TABLE IF EXISTS audit_log;
