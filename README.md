# Aplikasi Kepegawaian Berbasis Web

Aplikasi pengelolaan data kepegawaian (pegawai, presensi, kepangkatan, gaji, cuti, diklat, pensiun, dan lainnya) tersedia dalam dua implementasi: **Node.js/Express (utama, SQLite)** dan **PHP native + MySQL (legacy)**. Bootstrap 4 + Font Awesome.

## Opsi 1: Versi Node.js (utama, tanpa MySQL/Docker)

Versi Node.js (folder `nodejs/`) memakai **SQLite** lewat modul bawaan Node.js (`node:sqlite`),
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
dijalankan. Untuk reset data, hapus file `nodejs/database.sqlite` lalu jalankan ulang.

Login default:

| Username | Password              | Role          |
|----------|-----------------------|---------------|
| admin    | `Admin@Kepegawaian2026!` | administrator |
| staff    | `Staff@Kepegawaian2026!` | staff         |

> Password disimpan sebagai hash bcrypt. **Segera ganti password default setelah login pertama.**

## Opsi 2: Deploy ke Vercel

Proyek dikonfigurasi untuk serverless Vercel (lihat `vercel.json` + `api/index.js`):

1. Pasang dependensi di root:
   ```
   npm install
   ```
2. Atur environment di Vercel:
   - `SESSION_SECRET` — secret panjang acak untuk session cookie (wajib)
   - `NODE_ENV=production` (default Vercel)
3. Deploy:
   ```
   vercel --prod --yes
   ```

Catatan khusus serverless:
- Session memakai `cookie-session` (stateless) agar bertahan antar lambda invocation.
- SQLite ditulis ke `/tmp/database.sqlite` (**ephemeral**) — data dummy di-reseed setiap cold start. Untuk penyimpanan permanen gunakan DB eksternal (MySQL/Postgres) dengan variabel `DB_FILE`/koneksi DB.

## Opsi 3: Versi PHP + MySQL (legacy)

### Via Docker Compose (tanpa XAMPP, direkomendasikan)

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

### Via XAMPP / Laragon (lokal biasa)

1. Copy folder ini ke `htdocs` web server kamu (misal `C:\xampp\htdocs\web-pegawai-master`).
2. Import skema + data awal: `dbtechmuda42.sql` lewat phpMyAdmin (atau `mysql -u root < dbtechmuda42.sql`).
3. (Opsional) Buat file `.env` dari `.env.example` dan sesuaikan kredensial database.
4. Buka `http://localhost/web-pegawai-master/`.

Login default versi PHP sama dengan Node.js (lihat tabel di atas; `dbtechmuda42.sql` sudah berisi hash bcrypt).

## Konfigurasi

Kredensial database dibaca dari environment variable (atau file `.env` di root project):

| Variable  | Default          |
|-----------|------------------|
| DB_NAME   | dbtechmuda42     |
| DB_HOST   | localhost        |
| DB_USER   | root             |
| DB_PASS   | (kosong)         |
| APP_DEBUG | 0 (debug hanya aktif di non-production) |
| SESSION_SECRET | (wajib set di Vercel) |

## Struktur

- `nodejs/` — implementasi utama Node.js/Express:
  - `app.js` — bootstrap Express, cookie-session, export app untuk serverless
  - `routes/pages.js` — halaman 20 modul + middleware auth (requireLogin/requireStaff/requireAdmin)
  - `routes/controllers.js` — penanganan submit login
  - `config/db.js` — SQLite (node:sqlite) + seed data
  - `models/` — query DB (selalu parameterized)
  - `views/` — template EJS (partials + layout)
- `api/index.js` + `vercel.json` — adapter deployment Vercel (catch-all ke Express)
- `models/` (root) — kelas OOP PHP per entitas (CRUD via PDO prepared statement)
- `controller_*.php` — penanganan submit form PHP (autentikasi + proteksi CSRF)
- `*.php` di root — halaman tampilan PHP, dirutekan lewat `index.php?hal=...` dengan whitelist
- `dbtechmuda42.sql` — skema database MySQL + data awal

## Catatan keamanan

- Semua input query memakai prepared statement (PDO PHP / parameterized SQLite Node) — anti SQL injection.
- Output di-escape dengan helper `e()`/`<%=` (htmlspecialchars) untuk mencegah XSS.
- Password memakai bcrypt (`bcryptjs`).
- Login dibatasi rate-limit: maksimal 5 percobaan gagal per username+IP dalam 15 menit.
- Semua 20 route modul butuh login; modul pengelolaan data butuh role non-staff; `/kelola-user` khusus administrator.
- Security header (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) + HSTS dari Vercel.
- Kredensial tidak di-hardcode (via env / `.env`), `.env*`, database, dan `node_modules` masuk `.gitignore`.
- Pesan error database tidak ditampilkan ke browser di produksi (hanya aktif dengan `APP_DEBUG=1` dan non-production).
