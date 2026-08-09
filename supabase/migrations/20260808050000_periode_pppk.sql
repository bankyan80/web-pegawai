-- =============================================================
-- Kolom unit (sekolah) untuk akun login.
-- (Tabel periode_pppk, riwayat_periode_pppk, dan audit_log dihapus
-- dari kode karena modul periode PPPK kini diturunkan otomatis dari
-- Profil Pegawai. Kolom unit dipertahankan untuk filter staf.)
-- =============================================================
ALTER TABLE member ADD COLUMN IF NOT EXISTS unit TEXT;
