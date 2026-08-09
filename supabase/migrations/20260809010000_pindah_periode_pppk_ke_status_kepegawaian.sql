-- =============================================================
-- Pindahkan menu 'Periode PPPK' dari Layanan Kepegawaian
-- ke grup Status Kepegawaian (urutan 6, setelah Disiplin pegawai).
-- =============================================================

UPDATE menu
   SET parent_id = 4, urutan = 6
 WHERE id = 27
   AND label = 'Periode PPPK';
