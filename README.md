# Aplikasi Kepegawaian Berbasis Web

Aplikasi pengelolaan data kepegawaian (pegawai, divisi, jabatan, gaji, pelatihan, materi, dan user) menggunakan PHP native + MySQL (PDO), Bootstrap 4, dan Font Awesome.

## Kebutuhan

- PHP 7.4+ (disarankan PHP 8.x)
- MySQL 5.7+ / MariaDB
- Web server (Apache / XAMPP / Laragon)

## Instalasi

### Opsi A: Docker Compose (tanpa XAMPP, direkomendasikan)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) lalu jalankan.
2. Dari folder project ini, jalankan:

   ```
   docker compose up -d --build
   ```

3. Buka `http://localhost:8080/`.

Database dibuat otomatis beserta data awal (dari `dbtechmuda42.sql`) pada saat container pertama kali dibuat. Kode sumber ter-mount langsung, jadi edit file langsung terlihat tanpa perlu rebuild.

Menghentikan/mereset:
```
docker compose down        # hentikan
docker compose down -v     # hentikan + hapus database (reset ke data awal)
```

### Opsi B: XAMPP / Laragon (lokal biasa)

1. Copy folder ini ke `htdocs` web server kamu (misal `C:\xampp\htdocs\web-pegawai-master`).
2. Import skema + data awal: `dbtechmuda42.sql` lewat phpMyAdmin (atau `mysql -u root < dbtechmuda42.sql`).
3. (Opsional) Buat file `.env` dari `.env.example` dan sesuaikan kredensial database.
4. Buka `http://localhost/web-pegawai-master/`.

### Opsi C: Versi Node.js (tanpa MySQL, tanpa aplikasi pihak ketiga)

Versi Node.js (`folder nodejs/`) memakai **SQLite** lewat modul bawaan Node.js (`node:sqlite`),
jadi **tidak perlu menginstal MySQL, Docker, atau XAMPP**. Cukup Node.js 22.5+.

1. Install [Node.js](https://nodejs.org/) versi 22.5 atau lebih baru (versi 24 disarankan).
2. Jalankan:
   ```
   cd nodejs
   npm install
   npm start
   ```
3. Buka `http://localhost:3000/`.

File database `nodejs/database.sqlite` dibuat otomatis beserta data awal saat pertama kali
dijalankan (tabel + seed dari `dbtechmuda42.sql`). Untuk reset data, tinggal hapus file
`nodejs/database.sqlite` lalu jalankan ulang.

Login default (sama dengan versi PHP):

| Username | Password  | Role          |
|----------|-----------|---------------|
| admin    | admin123  | administrator |
| staff    | staff123  | staff         |

> Password awal disimpan sebagai SHA1 untuk kompatibilitas; saat login pertama kali akan otomatis di-upgrade menjadi hash bcrypt.

## Konfigurasi

Kredensial database dibaca dari environment variable (atau file `.env` di root project):

| Variable  | Default        |
|-----------|----------------|
| DB_NAME   | dbtechmuda42   |
| DB_HOST   | localhost      |
| DB_USER   | root           |
| DB_PASS   | (kosong)       |
| APP_DEBUG | 0              |

## Struktur

- `models/` — kelas OOP per entitas (CRUD + query via PDO prepared statement)
- `controller_*.php` — penanganan submit form (sudah ada autentikasi + proteksi CSRF)
- `*.php` di root — halaman tampilan, dirutekan lewat `index.php?hal=...` dengan whitelist
- `dbtechmuda42.sql` — skema database + data awal

## Catatan keamanan

- Semua input query memakai PDO prepared statement.
- Output di-escape dengan helper `e()` (htmlspecialchars) untuk mencegah XSS.
- Password memakai `password_hash` (bcrypt).
- Setiap controller memvalidasi sesi (login + role) dan token CSRF.
- Proteksi brute force login: maksimal 5 percobaan gagal per username+IP dalam 15 menit (tabel `login_attempt`).
- Security header dasar (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
- Kredensial database tidak di-hardcode (via env / `.env`), pesan error database tidak ditampilkan ke browser; error dicatat ke error log PHP.
