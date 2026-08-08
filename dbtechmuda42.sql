-- Aplikasi Kepegawaian - Skema Database MySQL
-- Import file ini ke phpMyAdmin / mysql client, lalu login dengan user default di bawah.

CREATE DATABASE IF NOT EXISTS dbtechmuda42
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE dbtechmuda42;

-- ---------- MASTER ----------
CREATE TABLE IF NOT EXISTS divisi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jabatan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- ---------- MEMBER (user login) ----------
CREATE TABLE IF NOT EXISTS member (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(150) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    passwors VARCHAR(255) NOT NULL,
    role ENUM('administrator','manager','staff') NOT NULL DEFAULT 'staff',
    email VARCHAR(100),
    foto VARCHAR(255)
) ENGINE=InnoDB;

-- ---------- PEGAWAI ----------
CREATE TABLE IF NOT EXISTS pegawai (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nip VARCHAR(50) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    gender VARCHAR(10),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    idjabatan INT,
    iddivisi INT,
    alamat TEXT,
    email VARCHAR(100),
    foto VARCHAR(255),
    CONSTRAINT fk_pegawai_jabatan FOREIGN KEY (idjabatan) REFERENCES jabatan(id),
    CONSTRAINT fk_pegawai_divisi  FOREIGN KEY (iddivisi)  REFERENCES divisi(id)
) ENGINE=InnoDB;

-- ---------- MATERI ----------
CREATE TABLE IF NOT EXISTS materi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

-- ---------- PELATIHAN ----------
CREATE TABLE IF NOT EXISTS pelatihan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pegawai_id INT,
    materi_id INT,
    tgl_mulai DATE,
    tgl_akhir DATE,
    keterangan VARCHAR(255),
    CONSTRAINT fk_pelatihan_pegawai FOREIGN KEY (pegawai_id) REFERENCES pegawai(id),
    CONSTRAINT fk_pelatihan_materi  FOREIGN KEY (materi_id)  REFERENCES materi(id)
) ENGINE=InnoDB;

-- ---------- GAJI ----------
CREATE TABLE IF NOT EXISTS gaji (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pegawai_id INT,
    gapok DECIMAL(12,2),
    tunjab DECIMAL(12,2),
    bpjs DECIMAL(12,2),
    lain2 DECIMAL(12,2),
    CONSTRAINT fk_gaji_pegawai FOREIGN KEY (pegawai_id) REFERENCES pegawai(id)
) ENGINE=InnoDB;

-- ---------- LOGIN ATTEMPT (proteksi brute force) ----------
CREATE TABLE IF NOT EXISTS login_attempt (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    attempted_at DATETIME NOT NULL
) ENGINE=InnoDB;
CREATE INDEX idx_login_attempt_user_ip ON login_attempt (username, ip);

-- ---------- DATA AWAL ----------
INSERT INTO divisi (nama) VALUES
('IT'), ('HRD'), ('Finance'), ('Marketing');

INSERT INTO jabatan (nama) VALUES
('Manager'), ('Supervisor'), ('Staff');

-- password default: admin / Admin@Kepegawaian2026!  ;  staff / Staff@Kepegawaian2026!
-- disimpan sebagai hash bcrypt (cost 10). Ganti password segera setelah login pertama.
INSERT INTO member (fullname, username, passwors, role, email) VALUES
('Administrator', 'admin', '$2a$10$.fwMF80gegS4m.P79l/HoOz/mpO6uzME8tBfqYWQuxTt16FMno8lW', 'administrator', 'admin@example.com'),
('Staff Umum',     'staff', '$2a$10$8IVL373IPO/AY6LhHbIFrOw4E8zsm5s5jTdRQZNyAz/ehteA5KP9q', 'staff',         'staff@example.com');

INSERT INTO pegawai (nip, nama, gender, tempat_lahir, tanggal_lahir, idjabatan, iddivisi, alamat, email, foto) VALUES
('P001', 'Budi Santoso', 'L', 'Jakarta', '1990-05-12', 3, 1, 'Jl. Merdeka No.1, Jakarta', 'budi@example.com', ''),
('P002', 'Siti Aminah',  'P', 'Bandung', '1992-08-23', 2, 2, 'Jl. Asia Afrika No.5, Bandung', 'siti@example.com', ''),
('P003', 'Agus Wijaya',  'L', 'Surabaya','1988-01-30', 1, 1, 'Jl. Pemuda No.9, Surabaya', 'agus@example.com', '');

INSERT INTO materi (nama) VALUES
('Pelatihan Bootstrap 4'),
('Pelatihan PHP OOP');

INSERT INTO pelatihan (pegawai_id, materi_id, tgl_mulai, tgl_akhir, keterangan) VALUES
(1, 1, '2026-01-10', '2026-01-14', 'Dasar Bootstrap 4'),
(2, 2, '2026-02-01', '2026-02-05', 'PHP OOP lanjutan');

INSERT INTO gaji (pegawai_id, gapok, tunjab, bpjs, lain2) VALUES
(1, 5000000, 1500000, 400000, 200000),
(2, 4000000, 1000000, 350000, 150000);
