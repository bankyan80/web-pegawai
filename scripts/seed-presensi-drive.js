// Menjalankan ulang arsip presensi dari Google Drive:
//   1) menghapus SEMUA file PDF yang pernah diupload (bucket "dokumen"),
//   2) mengosongkan tabel "presensi",
//   3) mengisi ulang tabel "presensi" dengan tautan Google Drive per nama pegawai.
//
// Penggunaan:
//   node scripts/seed-presensi-drive.js
//
// Kredensial dibaca dari nodejs/.env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
// Data arsip diambil dari scripts/presensi-drive-seed.json (dibuat dari
// drive_absensi_pppk_links.csv). Regenerasi:
//   1) download ulang CSV dari Google Drive -> drive_absensi_pppk_links.csv
//   2) jalankan generator lalu jalankan script ini.
const fs = require('fs');
const path = require('path');

// Baca variabel dari nodejs/.env secara manual (node_modules dotenv ada di nodejs/).
const envPath = path.join(__dirname, '..', 'nodejs', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((ln) => {
    const m = ln.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  });
}

const URL = process.env.SUPABASE_URL || 'https://dkixmotzmmioupclqpan.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di nodejs/.env');
  process.exit(1);
}

const H = () => ({ apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' });

async function main() {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'presensi-drive-seed.json'), 'utf8'));

  // 1) Daftar semua file di bucket "dokumen" lalu hapus satu per satu.
  const listRes = await fetch(URL + '/storage/v1/object/list/dokumen', {
    method: 'POST',
    headers: H(),
    body: JSON.stringify({ prefix: '', limit: 1000, offset: 0 })
  });
  const files = await listRes.json();
  console.log('File di bucket dokumen:', files.length);
  let deleted = 0;
  for (const f of files) {
    // Catatan: DELETE storage tidak boleh menyertakan Content-Type
    // application/json tanpa body (ditolak Fastify 400).
    const r = await fetch(URL + '/storage/v1/object/dokumen/' + encodeURIComponent(f.name), {
      method: 'DELETE',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
    });
    if (r.ok || r.status === 200) deleted++;
    else console.warn('  gagal hapus:', f.name, r.status, (await r.text()).slice(0, 120));
  }
  console.log('File PDF dihapus:', deleted);

  // 2) Kosongkan tabel presensi.
  const delRows = await fetch(URL + '/rest/v1/presensi?id=not.is.null', { method: 'DELETE', headers: H() });
  await delRows.text();
  console.log('Baris presensi lama dihapus (HTTP', delRows.status + ')');

  // 3) Insert seed ulang (batch 100 baris).
  let inserted = 0;
  const chunk = 100;
  for (let i = 0; i < seed.rows.length; i += chunk) {
    const slice = seed.rows.slice(i, i + chunk);
    const r = await fetch(URL + '/rest/v1/presensi', {
      method: 'POST',
      headers: Object.assign(H(), { Prefer: 'return=minimal' }),
      body: JSON.stringify(slice)
    });
    if (!r.ok) throw new Error('INSERT gagal: ' + (await r.text()).slice(0, 300));
    inserted += slice.length;
  }
  console.log('Baris presensi baru:', inserted);
  console.log('Selesai. Arsip Google Drive tahun', seed.tahun + ':', seed.rows.length, 'baris.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
