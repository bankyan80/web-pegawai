# Setup Checklist - Cloudflare AI Integration

## ✅ Langkah Setup (5 menit)

### Step 1: Dapatkan Cloudflare Credentials
- [ ] Daftar/login ke https://dash.cloudflare.com
- [ ] Salin **Account ID** dari dashboard (sidebar kanan)
- [ ] Buat API Token:
  - Buka My Profile → API Tokens
  - Create Token → Copy

### Step 2: Update Environment Variables
- [ ] Buka `nodejs/.env` (atau copy dari `.env.example`)
- [ ] Isi credentials:
  ```env
  CLOUDFLARE_ACCOUNT_ID=<paste account id>
  CLOUDFLARE_API_TOKEN=<paste api token>
  ```
- [ ] Simpan file

### Step 3: Restart Server
```bash
# Di folder nodejs/
npm start
# atau
node app.js
```

### Step 4: Test Integration
```bash
# 1. Login ke aplikasi di browser
# http://localhost:3000

# 2. Sebagai admin, test endpoint:
curl http://localhost:3000/api/analysis/statistics

# 3. Test AI analysis:
curl http://localhost:3000/api/analysis/analyze
```

---

## 📊 Available Endpoints

| Endpoint | Method | Akses | Deskripsi |
|----------|--------|-------|-----------|
| `/api/analysis/statistics` | GET | Login | Statistik dasar (tanpa AI) |
| `/api/analysis/analyze` | GET | Admin | Analisis data dengan AI |
| `/api/analysis/audit` | GET | Admin | Audit integritas data |
| `/api/analysis/recommendations` | GET | Admin | Rekomendasi pengembangan SDM |
| `/api/analysis/full-report` | GET | Admin | Semua laporan dalam satu call |

---

## 🔧 Troubleshooting

| Error | Solusi |
|-------|--------|
| "Cloudflare AI not configured" | Pastikan `.env` ada dan lengkap |
| "Unauthorized" | Login terlebih dahulu |
| "Forbidden. Admin access" | User harus role `administrator` |
| "Invalid token" | Verify token di Cloudflare dashboard |
| Slow/Timeout | Normal, AI processing butuh 5-30 detik |

---

## 📁 Files Added

```
✓ nodejs/config/cloudflare.js  - Config & API wrapper
✓ nodejs/models/analysis.js    - Service layer
✓ nodejs/routes/analysis.js    - API endpoints
✓ nodejs/.env.example          - Updated
✓ CLOUDFLARE_AI_DOCS.md        - Full documentation
✓ SETUP_CHECKLIST.md           - This file
```

---

## 🚀 Quick Start Example

```javascript
// Di JavaScript/browser console setelah login sebagai admin:

// Ambil statistik
fetch('/api/analysis/statistics')
  .then(r => r.json())
  .then(d => console.log('Stats:', d.data));

// Ambil analisis lengkap
fetch('/api/analysis/full-report')
  .then(r => r.json())
  .then(d => console.log('Report:', d.data));
```

---

## ❓ FAQ

**Q: Apakah ini gratis?**  
A: Cloudflare Workers AI memiliki free tier. Cek: https://developers.cloudflare.com/workers-ai/platform/pricing/

**Q: Berapa lama processing AI?**  
A: Biasanya 5-30 detik tergantung model dan data size

**Q: Bisa pakai model AI lain?**  
A: Ya, ubah `CLOUDFLARE_MODEL_ID` di `.env` (list model: https://developers.cloudflare.com/workers-ai/models/)

**Q: Aman untuk data sensitif?**  
A: Data dikirim ke Cloudflare servers. Review privacy policy dan gunakan untuk non-sensitive data saja.

**Q: Bisa schedule audit otomatis?**  
A: Ya, bisa buat cron job atau background task yang call endpoints ini

---

## 📞 Support

- Docs lengkap: [CLOUDFLARE_AI_DOCS.md](CLOUDFLARE_AI_DOCS.md)
- Cloudflare Docs: https://developers.cloudflare.com/workers-ai/
- Error logs: Check `nodejs` server console

---

**Setup Date**: 2026-08-08  
**Status**: ✅ Ready to use
