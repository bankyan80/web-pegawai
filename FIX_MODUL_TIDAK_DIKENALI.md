# 🔧 Fix: "Modul tidak dikenali saat penyimpanan" - Batch Upload Error

**Status**: Issue diagnosis + comprehensive fix  
**Date**: 2026-08-08

---

## ❌ Possible Root Causes

| Cause | Symptom | Solution |
|-------|---------|----------|
| **Browser Cache** | Error persists after code fix | Hard refresh (Ctrl+Shift+R) |
| **data-table attribute missing** | Console shows `data-table: ""` | Reload page, check network cache disabled |
| **Staff user** | No upload button visible | Use admin account (role: administrator) |
| **JavaScript not updated** | Console shows old tableModul logic | Clear site data in DevTools |

---

## ✅ Complete Fix Steps

### Step 1: Force Server to Serve Fresh Files
Open terminal:
```bash
# Restart Node.js server
cd c:\Users\Bank Yan\web-pegawai-master\nodejs
npm start
# Should see: Server berjalan di http://localhost:3000
```

Wait 3-5 seconds for server to fully start.

---

### Step 2: Clear Browser Cache Aggressively

**Option A: Chrome/Edge DevTools (RECOMMENDED)**
1. Open browser: `http://localhost:3000`
2. Press **F12** to open DevTools
3. Right-click on refresh button → Select **"Empty cache and hard refresh"**
4. **Keep DevTools open** (important for debugging)
5. Go to **Settings** (⚙️ icon, top right of DevTools)
6. Check: **"Disable cache (while DevTools is open)"** ✓

**Option B: Manual Cache Clear**
1. Press **Ctrl + Shift + Delete** (Windows)
2. Select "All time"
3. Check: Cookies and other site data ✓
4. Click "Clear data"
5. Close all tabs to `localhost:3000`
6. Open fresh tab: `http://localhost:3000`

---

### Step 3: Verify You're Logged In As Admin

1. Go to home page: `http://localhost:3000`
2. Should see "Welcome, admin" (or your admin name)
3. If logged in as "staff", login again with admin credentials:
   - Username: **admin**
   - Password: **admin123**

**Why**: Staff users cannot upload (no upload button shown)

---

### Step 4: Test Upload - WITH CONSOLE OPEN

1. **Keep DevTools open** (F12)
2. Go to: `http://localhost:3000/?hal=presensi` or click Presensi menu
3. Find **"Upload PDF"** button (should be visible for admin)
4. Click it → Modal opens
5. **Watch Console tab** (F12 → Console)

**You should see**:
```
[KEP] Form submit detected {dataTable: "tblPrs0", dataModal: "modPrs0"}
[KEP] tableModul("tblPrs0") → matched tblPrs pattern → presensi
[KEP] Module recognized: presensi
```

**If error instead**:
```
[KEP] ERROR: Module tidak dikenali!
```

Then screenshot console and report.

---

### Step 5: Fill Form & Upload

Once modal open with console watching:

1. **Nama Pegawai**: Select any name from dropdown
2. **Tahun**: Auto-filled
3. **Batch bulan**: 
   - Click "Tambah Bulan" button
   - Select: **Januari** (or any month)
   - Upload: Select a PDF file
4. **Keterangan**: Optional
5. Click **"Simpan"** button

**Watch console** for:
- ✅ `[KEP] Form submit detected...`
- ✅ `[KEP] Module recognized: presensi`
- ✅ File upload progress logs
- ✅ Toast: "Data berhasil disimpan"
- ✅ Page auto-reload (after 600ms)

---

## 🧪 Debug Console Commands

If error occurs, paste these in Console (F12):

### Check 1: Verify Function Exists
```javascript
console.log('tableModul function:', typeof tableModul);
console.log('Test: tableModul("tblPrs0") =', tableModul("tblPrs0"));
```

### Check 2: Check Form Attributes
```javascript
var form = document.querySelector('form.kep-form');
if (form) {
  console.log('Form found!');
  console.log('  data-table:', form.getAttribute('data-table'));
  console.log('  data-modal:', form.getAttribute('data-modal'));
  console.log('  has batch-wrap:', form.querySelector('.kep-batch-wrap') ? 'YES' : 'NO');
} else {
  console.log('ERROR: No form.kep-form found!');
}
```

### Check 3: Check All Forms
```javascript
var forms = document.querySelectorAll('form.kep-form');
console.log('Total forms:', forms.length);
forms.forEach((f, i) => {
  console.log('Form ' + i + ': data-table="' + f.getAttribute('data-table') + '"');
});
```

### Check 4: Force Test
```javascript
// Manually test tableModul with various inputs
var testIds = ['tblPrs0', 'tblPrs1', 'modPrs0', 'modPrs1', '', 'unknown'];
testIds.forEach(id => {
  console.log('tableModul("' + id + '") → "' + tableModul(id) + '"');
});
```

---

## 🎯 Expected vs Actual

### ✅ SUCCESS Output
```
Server berjalan di http://localhost:3000

[Browser Console]:
[KEP] Form submit detected {dataTable: "tblPrs0", dataModal: "modPrs0"}
[KEP] tableModul("tblPrs0") → matched tblPrs pattern → presensi
[KEP] Module recognized: presensi

[Toast notification]:
"Data berhasil disimpan."

[Page]:
Reloads automatically after 600ms
Data appears in table
```

### ❌ FAILURE Output
```
[Browser Console]:
[KEP] ERROR: Module tidak dikenali! {
  dataTable: "",
  dataModal: "modPrs0",
  ...
}

[Toast]:
"❌ Modul tidak dikenali. Buka console (F12) untuk details. Refresh halaman dan coba lagi."

[Problem]:
data-table is EMPTY - not being passed from backend
```

---

## 🔍 Troubleshooting

### Issue: Still getting error after hard refresh?

**Check 1: Server really restarted?**
```bash
# In another terminal, check if process is running
tasklist | find "node"
# Should show: node.exe running
```

**Check 2: Is it cached at OS level?**
```bash
# Clear entire Node.js module cache
cd nodejs
del node_modules\.cache -recurse
npm start
```

**Check 3: Is modal.table even being sent from backend?**
View page source (Ctrl+U) and search for:
```
data-table="tblPrs
```
If not found, modal.table is undefined in backend!

**Check 4: Test with different browser**
Try Firefox or Edge in case Chrome cache is persistent.

---

## 📋 Information to Report If Still Failing

If issue persists, provide:
1. **Screenshot of console output** when error occurs
2. **Console output of Check 1-4** debug commands
3. **Your user role**: Admin or Staff?
4. **What year are you trying to upload to**: 2024? 2025? 2026?
5. **Browser version**: Chrome? Firefox? Edge?
6. **Server output**: Any error messages in terminal?

---

## 📝 Files Modified

- [public/js/kep.js](public/js/kep.js)
  - Added `console.log()` statements for debugging
  - Added fallback logic: infer table ID from modal ID if data-table empty
  - Exported `tableModul` to `window` object for global access
  - Line 48-78: Enhanced tableModul() function
  - Line 685-725: Enhanced form submit handler with debugging

- [nodejs/routes/pages.js](nodejs/routes/pages.js)
  - No changes needed (modal.table correctly set to tid)

- [nodejs/views/partials/kep_modal.ejs](nodejs/views/partials/kep_modal.ejs)
  - No changes needed (data-table attribute rendered correctly)

---

## ✅ Expected After Fix

1. ✅ Admin can upload multiple months of presensi data
2. ✅ Upload completes without "modul tidak dikenali" error
3. ✅ Can upload multiple times (berkelanjutan) in same session
4. ✅ Page reloads and data appears in table
5. ✅ No console errors related to tableModul

---

**Status**: Ready to test  
**Next**: Follow steps above and report console output if issues persist
