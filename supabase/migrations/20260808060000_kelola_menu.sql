-- =============================================================
-- Modul Kelola Menu: tabel menu dinamis + seed menu yang sudah ada
-- Menu dirender di navbar dan diatur hak aksesnya per peran
-- (administrator / staff).
-- =============================================================

CREATE TABLE IF NOT EXISTS menu (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT,
  label TEXT NOT NULL,
  url TEXT,
  icon TEXT,
  urutan INTEGER DEFAULT 0,
  for_administrator BOOLEAN DEFAULT TRUE,
  for_manager BOOLEAN DEFAULT TRUE,
  for_staff BOOLEAN DEFAULT TRUE,
  publik BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Aktif',
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_menu_parent ON menu (parent_id, urutan);

INSERT INTO menu (id, parent_id, label, url, icon, urutan, for_administrator, for_manager, for_staff, publik, status) VALUES
  -- Menu utama (tanpa induk)
  (1,  NULL, 'Home',             '/?hal=home',      'fa-home',        1, TRUE,  TRUE,  TRUE,  TRUE,  'Aktif'),
  (50, NULL, 'Kepegawaian',      NULL,              'fa-briefcase',   2, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),
  (2,  NULL, 'Master Data',      NULL,              'fa-database',    3, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),
  (5,  NULL, 'Pengembangan Pegawai', NULL,          'fa-graduation-cap', 4, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (6,  NULL, 'Tentang Kami',     '/?hal=aboutus',   'fa-address-book', 5, TRUE, TRUE,  TRUE,  TRUE,  'Aktif'),

  -- Kepegawaian (root modul kepegawaian)
  (10, 50,  'Profil Pegawai',    '/profil-pegawai', 'fa-user',        1, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),
  (3,  50,  'Layanan Kepegawaian', NULL,            'fa-folder-open', 2, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),
  (27, 50,  'Periode PPPK',      '/periode-pppk',   'fa-file-signature', 3, TRUE, TRUE, TRUE,  FALSE, 'Aktif'),
  (4,  50,  'Status Kepegawaian', NULL,             'fa-user-tag',    4, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),

  -- Layanan Kepegawaian
  (22, 3,   'Kenaikan Pangkat',  '/kepangkatan',    'fa-award',        1, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (23, 3,   'Kenaikan Gaji Berkala', '/gaji-berkala', 'fa-file-invoice', 2, TRUE, TRUE,  FALSE, FALSE, 'Aktif'),
  (62, 3,   'Mutasi Kepegawaian', '/mutasi',         'fa-exchange-alt', 3, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (63, 3,   'Jabatan & Penugasan','/jabatan-penugasan', 'fa-user-tie', 4, TRUE, TRUE,  FALSE, FALSE, 'Aktif'),
  (64, 3,   'Sertifikasi & Tunjangan','/sertifikasi-tunjangan', 'fa-certificate', 5, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (24, 3,   'Cuti',               '/izin-cuti',      'fa-plane',       6, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (31, 3,   'BUP / Pensiun',      '/pensiun',        'fa-user-minus',  7, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (67, 3,   'Arsip Kepegawaian',  '/arsip-kepegawaian', 'fa-archive',  8, TRUE, TRUE,  FALSE, FALSE, 'Aktif'),
  (68, 3,   'Surat Kepegawaian',  '/surat-kepegawaian', 'fa-envelope-open-text', 9, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (20, 3,   'Inbox surat',        '/inbox-surat',    'fa-inbox',       10, TRUE, TRUE, TRUE,  FALSE, 'Aktif'),
  (25, 3,   'Izin Cerai',         '/izin-cerai',     'fa-file-signature', 12, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (26, 3,   'SLKS',               '/slks',           'fa-chart-line',  13, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (30, 3,   'Pengadaan Pegawai',  '/pengadaan-pegawai', 'fa-user-plus', 14, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (32, 3,   'Pindah tugas',       '/pindah-tugas',   'fa-exchange-alt', 15, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (33, 3,   'Penempatan tugas',   '/penempatan-tugas', 'fa-map-marker-alt', 16, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (34, 3,   'Disiplin pegawai',   '/disiplin-pegawai', 'fa-gavel',     17, TRUE, TRUE, FALSE, FALSE, 'Aktif'),

  -- Status Kepegawaian
  (70, 4,   'Semua Pegawai',      '/status-kepegawaian',                   'fa-users',         1, TRUE, TRUE, TRUE,  FALSE, 'Aktif'),
  (71, 4,   'PNS',                '/status-kepegawaian?jenis=PNS',         'fa-id-badge',      2, TRUE, TRUE, TRUE,  FALSE, 'Aktif'),
  (72, 4,   'PPPK',               '/status-kepegawaian?jenis=PPPK',        'fa-user-graduate', 3, TRUE, TRUE, TRUE,  FALSE, 'Aktif'),
  (73, 4,   'PPPK Paruh Waktu',   '/status-kepegawaian?jenis=PPPK%20Paruh%20Waktu', 'fa-user-clock', 4, TRUE, TRUE, TRUE, FALSE, 'Aktif'),
  (74, 4,   'Non-ASN',            '/status-kepegawaian?jenis=Non-ASN',     'fa-user',         5, TRUE, TRUE, TRUE,  FALSE, 'Aktif'),
  (75, 4,   'Riwayat Status',     '/riwayat-status',                       'fa-history',      6, TRUE, TRUE, FALSE, FALSE, 'Aktif'),

  -- Master Data
  (11, 2,   'Presensi',          '/presensi',       'fa-fingerprint', 1, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),
  (12, 2,   'Referensi data',    '/referensi-data', 'fa-list',        2, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (13, 2,   'Kelola user',       '/kelola-user',    'fa-users',       3, TRUE,  FALSE, FALSE, FALSE, 'Aktif'),
  (14, 2,   'Kelola Menu',       '/kelola-menu',    'fa-bars',        4, TRUE,  FALSE, FALSE, FALSE, 'Aktif'),

  -- Pengembangan Pegawai
  (40, 5,   'Diklat Struktural', '/diklat-struktural', 'fa-award',     1, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (41, 5,   'Diklat Teknis',     '/diklat-teknis',  'fa-cogs',        2, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (42, 5,   'Izin belajar',      '/izin-belajar',   'fa-book-open',   3, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (43, 5,   'Tugas belajar',     '/tugas-belajar',  'fa-graduation-cap', 4, TRUE, TRUE, FALSE, FALSE, 'Aktif');

SELECT setval(pg_get_serial_sequence('menu', 'id'), (SELECT COALESCE(MAX(id), 1) FROM menu));
