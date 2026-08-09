# Panduan Deployment — Web Pegawai (Node.js/Express + Supabase)

**Status**: Siap produksi (Vercel live, Docker/VPS siap).
**Arsitektur**:
- Aplikasi: Node.js/Express (`nodejs/`, entry `nodejs/app.js`), aset statis di `public/`.
- Database & file storage: **Supabase cloud** (tidak perlu MySQL/SQLite lokal).
- Analisis AI: Cloudflare Workers AI (opsional, lewati jika tidak dipakai).

Kredensial disimpan di `nodejs/.env` (contoh: `nodejs/.env.example`). File ini
**tidak boleh di-commit** (sudah dilindungi `.gitignore` & `.dockerignore`).

---

## Opsi 1 — Docker (disarankan)

### 1. Siapkan `.env`
```bash
cp nodejs/.env.example nodejs/.env
# isi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET (acak!)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Jalankan (tanpa HTTPS, cukup untuk uji)
```bash
docker compose up -d --build
# Aplikasi di http://IP_SERVER:3000
```

### 3. Produksi dengan HTTPS otomatis (Caddy + Let's Encrypt)
```bash
cp Caddyfile.example Caddyfile
# ubah "contoh.com" menjadi domain Anda (record A domain -> IP VPS)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
`docker-compose.prod.yml` menambahkan Caddy di depan aplikasi (app hanya
terekspos di `127.0.0.1:3000`), sertifikat HTTPS diperbarui otomatis.

### Update aplikasi
```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Deploy otomatis dari Windows (script)
`scripts/deploy-vps.ps1` mengirim isi repo (hanya file ter-commit, tanpa secret) ke
VPS lalu membangun ulang container:
```powershell
.\scripts\deploy-vps.ps1 -Vps root@203.0.113.5            # uji di :3000
.\scripts\deploy-vps.ps1 -Vps root@203.0.113.5 -Prod      # dengan Caddy HTTPS
.\scripts\deploy-vps.ps1 -Vps root@203.0.113.5 -DryRun    # lihat perintah tanpa eksekusi
```
Prasyarat: SSH key sudah terpasang (`ssh-copy-id`), `nodejs/.env` ada di server
(untuk `-Prod` juga `Caddyfile`). Sekali saja sediakan file tersebut di VPS —
script tidak akan menimpanya.

### Log
```bash
docker logs -f pegawai_web
```

---

## Opsi 2 — Node.js langsung di VPS (PM2)

```bash
# Prasyarat: Node.js v22+ dan git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2

# Deploy
git clone <repo-url> && cd web-pegawai-master
cp nodejs/.env.example nodejs/.env   # lalu isi kredensialnya
cd nodejs
npm install --omit=dev
pm2 start app.js --name web-pegawai
pm2 save && pm2 startup
```

Update:
```bash
cd web-pegawai-master && git pull
cd nodejs && npm install --omit=dev
pm2 restart web-pegawai
```

---

## Opsi 3 — Vercel (serverless, kondisi saat ini)

```bash
vercel --prod
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SESSION_SECRET
vercel env add CLOUDFLARE_ACCOUNT_ID
vercel env add CLOUDFLARE_API_TOKEN
```
Catatan: serverless (Vercel) memiliki cold start ±0,5–1,5 detik. Untuk respons
tercepat yang konsisten, gunakan Opsi 1/2 (server tetap).

---

## HTTPS

- **Caddy** (paling mudah): otomatis ambil/perbarui sertifikat, lihat `Caddyfile.example`.
- **nginx + certbot**:
  ```nginx
  server {
    server_name contoh.com;
    location / { proxy_pass http://127.0.0.1:3000;
                 proxy_set_header Host $host;
                 proxy_set_header X-Real-IP $remote_addr;
                 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                 proxy_set_header X-Forwarded-Proto $scheme; }
  }
  ```
  lalu `sudo certbot --nginx`.
- **Cloudflare proxy**: aktifkan "Flexible/Full" di dashboard Cloudflare dan arahkan origin ke VPS.

---

## Keamanan

- [ ] `SESSION_SECRET` nilai acak (lihat Opsi 1, langkah 1).
- [ ] `nodejs/.env` jangan pernah di-commit.
- [ ] Supabase Service Role Key hanya untuk server (jangan bocor ke browser).
- [ ] Wajib HTTPS di produksi.
- [ ] Disarankan: `express-rate-limit` untuk API.

---

## Backup (Supabase)

Database & Storage di-backup dari dashboard Supabase (Project Settings → Backup /
Storage). Back up juga `nodejs/.env` secara aman (mis. `gpg -c nodejs/.env`).

---

## Troubleshooting

- **Server tidak jalan / port sibuk**: `lsof -i :3000`, hentikan PID, cek `node -v` (22+).
- **Error koneksi Supabase**: pastikan `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` benar,
  dan IP VPS tidak diblokir firewall. Uji: `curl -I <SUPABASE_URL>/rest/v1/`.
- **Aset statis 404 di Docker**: pastikan `PUBLIC_ROOT=/app/public` (sudah di Dockerfile/compose).
- **Halaman lambat di serverless**: pindah ke Opsi 1/2 (tidak ada cold start).

---

**Status**: ✅ Siap produksi — pilih Opsi 1 (Docker, disarankan), Opsi 2 (PM2), atau Opsi 3 (Vercel).
