# Quick Test untuk "Modul tidak dikenali" Error

## 🚀 Fastest Fix (3 langkah):

### 1. Restart Server
```bash
cd c:\Users\Bank Yan\web-pegawai-master\nodejs
npm start
```

### 2. Hard Refresh Browser
- Tekan: **Ctrl + Shift + R** (Windows) atau **Cmd + Shift + R** (Mac)
- Keep pressing sampai data berubah
- Or: Buka DevTools (F12) → Settings (⚙️) → Check "Disable cache"

### 3. Test Upload
- Go to: http://localhost:3000/?hal=presensi
- Click "Upload PDF" button
- Fill form & click "Simpan"
- Open Console (F12) → watch for "[KEP]" messages
- ✅ If success: "Data berhasil disimpan"
- ❌ If error: Screenshot console and send

---

## 📍 Debug Console (Paste di F12 → Console):

```javascript
// Quick diagnostic
console.log('1. Module function:', typeof window.tableModul);
console.log('2. Test tblPrs0:', window.tableModul?.('tblPrs0'));
var f = document.querySelector('form.kep-form');
console.log('3. Form data-table:', f?.getAttribute('data-table'));
console.log('4. Has batch:', f?.querySelector('.kep-batch-wrap') ? 'YES' : 'NO');
```

Expected output:
```
1. Module function: function
2. Test tblPrs0: presensi
3. Form data-table: tblPrs0
4. Has batch: YES
```

If any different, report the output!

---

## 📄 Full Guide:
See [FIX_MODUL_TIDAK_DIKENALI.md](FIX_MODUL_TIDAK_DIKENALI.md) for complete steps
