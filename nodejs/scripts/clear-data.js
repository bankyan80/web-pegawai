/* eslint-disable no-console */
// Bersihkan semua data contoh & legacy dari Supabase.
// Tabel `member` (akun login) TIDAK dikosongkan agar aplikasi tetap bisa diakses.
// Usage: node nodejs/scripts/clear-data.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dkixmotzmmioupclqpan.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY belum diset. Atur di nodejs/.env');
  process.exit(1);
}

const H = () => ({
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
  'Content-Type': 'application/json'
});

const TABLES = [
  // Data modul kepegawaian (contoh)
  'pegawai',
  'presensi',
  'surat',
  'kepangkatan',
  'gaji_berkala',
  'cuti',
  'izin_cerai',
  'slks',
  'pengadaan',
  'pensiun',
  'pindah_tugas',
  'penempatan',
  'disiplin',
  'diklat_struktural',
  'diklat_teknis',
  'izin_belajar',
  'tugas_belajar',
  'users',
  'referensi',
  // Data modul legacy
  'divisi',
  'jabatan',
  'materi',
  'pegawai_legacy',
  'pelatihan',
  'gaji',
  // Percobaan login
  'login_attempt'
];

async function kosongkan(table) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=gt.0', {
    method: 'DELETE',
    headers: H()
  });
  if (!res.ok && res.status !== 204) {
    const txt = await res.text();
    throw new Error('DELETE ' + table + ' -> ' + res.status + ': ' + txt.slice(0, 200));
  }
  console.log('  Kosongkan ' + table + ': OK');
}

(async () => {
  console.log('Membersihkan data di', SUPABASE_URL);
  for (const t of TABLES) {
    await kosongkan(t);
  }
  console.log('Selesai. Tabel member (akun login) dipertahankan.');
})().catch((e) => {
  console.error('Gagal:', e.message);
  process.exit(1);
});
