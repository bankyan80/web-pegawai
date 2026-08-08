# Cloudflare AI Integration - Dokumentasi

## Overview
Integrasi ini memungkinkan Anda untuk menganalisis data kepegawaian dan melakukan audit project menggunakan AI Cloudflare. Fitur ini membantu dalam:

1. **Analisis Data Kepegawaian** - Insights tentang distribusi pegawai, divisi, dan jabatan
2. **Audit Project** - Pemeriksaan integritas data dan identifikasi masalah
3. **Rekomendasi Pengembangan SDM** - Saran strategis untuk pengembangan karyawan
4. **Laporan Lengkap** - Kombinasi semua analisis dalam satu laporan komprehensif

---

## Setup & Konfigurasi

### 1. Dapatkan Credentials Cloudflare

a. **Daftar/Login ke Cloudflare**: https://dash.cloudflare.com
   
b. **Ambil Account ID**:
   - Buka dashboard Cloudflare
   - Cari **Account ID** (biasanya di sidebar kanan bagian "Account details")
   
c. **Buat API Token**:
   - Buka **My Profile** → **API Tokens**
   - Klik **Create Token**
   - Pilih template **"Edit Cloudflare Workers"** atau buat custom dengan permissions:
     - `AI:Read` dan `AI:Write`
   - Copy token yang dihasilkan

### 2. Setup Environment Variables

Salin file `.env.example` menjadi `.env`:
```bash
cp nodejs/.env.example nodejs/.env
```

Edit `nodejs/.env` dan isi credentials Cloudflare:
```env
CLOUDFLARE_ACCOUNT_ID=xxxx...
CLOUDFLARE_API_TOKEN=xxxx...
CLOUDFLARE_MODEL_ID=@cf/meta/llama-2-7b-chat-int8
```

### 3. Install Dependencies (jika diperlukan)
```bash
cd nodejs
npm install
```

---

## API Endpoints

Semua endpoint memerlukan user login. Endpoints tertentu memerlukan role `administrator`.

### Base URL
```
http://localhost:3000/api/analysis
```

---

### 1. GET `/api/analysis/statistics`
**Akses**: Login user (semua role)

Mengambil statistik umum kepegawaian tanpa AI.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalPegawai": 150,
    "totalDivisi": 5,
    "totalJabatan": 12,
    "totalUser": 25,
    "divisiDistribution": [
      { "nama": "IT", "jumlah": 30 },
      { "nama": "HR", "jumlah": 20 }
    ],
    "jabatanDistribution": [
      { "nama": "Manager", "jumlah": 10 },
      { "nama": "Staff", "jumlah": 140 }
    ]
  },
  "timestamp": "2026-08-08T10:30:00.000Z"
}
```

---

### 2. GET `/api/analysis/analyze`
**Akses**: Admin only

Analisis data kepegawaian menggunakan AI Cloudflare.

**Features**:
- Ringkasan kondisi kepegawaian
- Analisis distribusi pegawai
- Identifikasi potensi masalah
- Rekomendasi perbaikan

**Response**:
```json
{
  "success": true,
  "data": {
    "statistics": { /* sama seperti /statistics */ },
    "aiAnalysis": "Berdasarkan data kepegawaian, organisasi Anda memiliki...",
    "timestamp": "2026-08-08T10:30:00.000Z"
  }
}
```

---

### 3. GET `/api/analysis/audit`
**Akses**: Admin only

Audit project untuk mengidentifikasi issue integritas data.

**Pemeriksaan yang dilakukan**:
- ✓ Pegawai tanpa divisi
- ✓ Pegawai tanpa jabatan
- ✓ User tanpa email
- ✓ Pegawai dengan data tidak lengkap
- ✓ Divisi/Jabatan kosong (tidak memiliki pegawai)

**Response**:
```json
{
  "success": true,
  "data": {
    "issuesFound": [
      "Ditemukan 5 pegawai tanpa divisi",
      "Ditemukan 2 pegawai tanpa jabatan"
    ],
    "issueCount": 2,
    "aiAuditReport": "Berdasarkan audit, prioritas perbaikan adalah...",
    "timestamp": "2026-08-08T10:30:00.000Z"
  }
}
```

---

### 4. GET `/api/analysis/recommendations`
**Akses**: Admin only

Generate rekomendasi pengembangan SDM berbasis AI.

**Response**:
```json
{
  "success": true,
  "data": {
    "statistics": { /* sama seperti /statistics */ },
    "recommendations": "Rekomendasi strategis untuk pengembangan SDM...",
    "timestamp": "2026-08-08T10:30:00.000Z"
  }
}
```

---

### 5. GET `/api/analysis/full-report`
**Akses**: Admin only

Generate laporan lengkap: statistik + analisis + audit + rekomendasi dalam satu call.

**Response**:
```json
{
  "success": true,
  "data": {
    "statistics": { /* statistik umum */ },
    "analysis": { /* hasil analisis AI */ },
    "audit": { /* hasil audit */ },
    "recommendations": { /* rekomendasi SDM */ }
  },
  "generatedAt": "2026-08-08T10:30:00.000Z"
}
```

---

## Contoh Penggunaan

### JavaScript/Fetch
```javascript
// Ambil analisis data
const response = await fetch('/api/analysis/analyze', {
  method: 'GET',
  credentials: 'include'  // untuk cookies session
});

const result = await response.json();
if (result.success) {
  console.log('Statistik:', result.data.statistics);
  console.log('Analisis AI:', result.data.aiAnalysis);
}
```

### cURL
```bash
# Statistik
curl http://localhost:3000/api/analysis/statistics

# Audit
curl http://localhost:3000/api/analysis/audit

# Full Report
curl http://localhost:3000/api/analysis/full-report
```

### Python
```python
import requests

# Pastikan sudah login di browser terlebih dahulu
session = requests.Session()

# Ambil full report
response = session.get('http://localhost:3000/api/analysis/full-report')
report = response.json()
print(report['data']['audit']['aiAuditReport'])
```

---

## Troubleshooting

### Error: "Cloudflare AI not configured"
**Solusi**: 
- Pastikan `.env` file ada dan berisi `CLOUDFLARE_ACCOUNT_ID` dan `CLOUDFLARE_API_TOKEN`
- Restart server setelah update `.env`

### Error: "Unauthorized"
**Solusi**:
- Login ke aplikasi terlebih dahulu
- Gunakan cookies session dalam request

### Error: "Forbidden. Admin access required"
**Solusi**:
- User yang login harus memiliki role `administrator`
- Ubah role user di menu kelolaUser

### Cloudflare API Error: "Invalid token"
**Solusi**:
- Verifikasi `CLOUDFLARE_API_TOKEN` di `.env`
- Pastikan token memiliki permissions untuk AI
- Token mungkin sudah expired, buat yang baru

### Timeout atau Slow Response
**Penyebab**:
- AI processing memerlukan waktu (normal: 5-30 detik)
- Increase timeout di client jika diperlukan
- Cloudflare rate limiting mungkin aktif

---

## Files yang Ditambahkan

```
nodejs/
  ├── config/
  │   └── cloudflare.js          # Konfigurasi & wrapper API
  ├── models/
  │   └── analysis.js            # Service untuk analisis & audit
  ├── routes/
  │   └── analysis.js            # API endpoints
  └── .env.example               # (Updated) Contoh konfigurasi
```

---

## Security Considerations

1. **API Token**: Jangan commit `.env` ke git! Gunakan `.gitignore`
2. **Admin Only**: Endpoints analisis hanya bisa diakses admin
3. **Authentication**: Semua endpoint memerlukan login
4. **Rate Limiting**: Cloudflare API memiliki rate limits
5. **Data Privacy**: Jangan kirim data sensitif berlebihan ke AI

---

## Performance Tips

1. **Cache Results**: Simpan hasil laporan untuk mengurangi API calls
2. **Batch Operations**: Gunakan `/full-report` daripada multiple calls
3. **Off-peak**: Jalankan audit saat traffic rendah
4. **Monitoring**: Catat response time untuk optimization

---

## Next Steps

1. Setup `.env` dengan credentials Cloudflare
2. Test endpoint `/api/analysis/statistics` (tidak perlu AI)
3. Test `/api/analysis/analyze` dengan admin user
4. Integrate ke dashboard atau UI admin
5. Monitor error logs dan optimize

---

## Support & Resources

- Cloudflare AI Docs: https://developers.cloudflare.com/workers-ai/
- Cloudflare API Docs: https://developers.cloudflare.com/api/
- Model Details: https://developers.cloudflare.com/workers-ai/models/

---

**Last Updated**: 2026-08-08  
**Version**: 1.0.0
