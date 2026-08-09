-- =============================================================
-- Modul Kelola Menu: tabel menu dinamis + seed menu yang sudah ada
-- Menu dirender di navbar dan diatur hak aksesnya per peran
-- (administrator / manager / staff).
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
  (2,  NULL, 'Master Data',      NULL,              'fa-database',    2, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),
  (3,  NULL, 'Layanan Kepegawaian', NULL,           'fa-folder-open', 3, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),
  (4,  NULL, 'Status Kepegawaian', NULL,            'fa-user-tag',    4, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (5,  NULL, 'Pengembangan Pegawai', NULL,          'fa-graduation-cap', 5, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (6,  NULL, 'Tentang Kami',     '/?hal=aboutus',   'fa-address-book', 6, TRUE, TRUE,  TRUE,  TRUE,  'Aktif'),

  -- Master Data
  (10, 2,   'Profil pegawai',    '/profil-pegawai', 'fa-user',        1, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),
  (11, 2,   'Presensi',          '/presensi',       'fa-fingerprint', 2, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),
  (12, 2,   'Referensi data',    '/referensi-data', 'fa-list',        3, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (13, 2,   'Kelola user',       '/kelola-user',    'fa-users',       4, TRUE,  FALSE, FALSE, FALSE, 'Aktif'),
  (14, 2,   'Kelola Menu',       '/kelola-menu',    'fa-bars',        5, TRUE,  FALSE, FALSE, FALSE, 'Aktif'),

  -- Layanan Kepegawaian
  (20, 3,   'Inbox surat',       '/inbox-surat',    'fa-inbox',       1, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),
  (21, 3,   'Kartu Pegawai',     '/kartu-pegawai',  'fa-id-card',     2, TRUE,  TRUE,  TRUE,  FALSE, 'Aktif'),
  (22, 3,   'Kepangkatan',       '/kepangkatan',    'fa-award',       3, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (23, 3,   'Gaji Berkala',      '/gaji-berkala',   'fa-file-invoice', 4, TRUE, TRUE,  FALSE, FALSE, 'Aktif'),
  (24, 3,   'Izin Cuti',         '/izin-cuti',      'fa-plane',       5, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (25, 3,   'Izin Cerai',        '/izin-cerai',     'fa-file-signature', 6, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (26, 3,   'SLKS',              '/slks',           'fa-chart-line',  7, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),

  -- Status Kepegawaian
  (30, 4,   'Pengadaan Pegawai', '/pengadaan-pegawai', 'fa-user-plus', 1, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (31, 4,   'Pensiun',           '/pensiun',        'fa-user-minus',  2, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (32, 4,   'Pindah tugas',      '/pindah-tugas',   'fa-exchange-alt', 3, TRUE, TRUE,  FALSE, FALSE, 'Aktif'),
  (33, 4,   'Penempatan tugas',  '/penempatan-tugas', 'fa-map-marker-alt', 4, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (34, 4,   'Disiplin pegawai',  '/disiplin-pegawai', 'fa-gavel',     5, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (27, 4,   'Periode PPPK',      '/periode-pppk',   'fa-file-signature', 6, TRUE, TRUE, TRUE,  FALSE, 'Aktif'),

  -- Pengembangan Pegawai
  (40, 5,   'Diklat Struktural', '/diklat-struktural', 'fa-award',     1, TRUE, TRUE, FALSE, FALSE, 'Aktif'),
  (41, 5,   'Diklat Teknis',     '/diklat-teknis',  'fa-cogs',        2, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (42, 5,   'Izin belajar',      '/izin-belajar',   'fa-book-open',   3, TRUE,  TRUE,  FALSE, FALSE, 'Aktif'),
  (43, 5,   'Tugas belajar',     '/tugas-belajar',  'fa-graduation-cap', 4, TRUE, TRUE, FALSE, FALSE, 'Aktif');

SELECT setval(pg_get_serial_sequence('menu', 'id'), (SELECT COALESCE(MAX(id), 1) FROM menu));
