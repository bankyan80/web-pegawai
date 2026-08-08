/* eslint-disable no-console */
// Seed data modul legacy (aplikasi lama) ke Supabase.
// Idempotent: kosongkan tabel dulu, lalu insert.
// Usage: node nodejs/scripts/seed-legacy.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');

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

async function kosongkan(table) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=gt.0', {
    method: 'DELETE',
    headers: H()
  });
  if (!res.ok && res.status !== 204) {
    const txt = await res.text();
    throw new Error('DELETE ' + table + ' -> ' + res.status + ': ' + txt.slice(0, 200));
  }
}

async function insertAll(table, rows) {
  if (!rows.length) return;
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
    method: 'POST',
    headers: Object.assign(H(), { Prefer: 'return=minimal' }),
    body: JSON.stringify(rows)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('INSERT ' + table + ' -> ' + res.status + ': ' + txt.slice(0, 300));
  }
  console.log('  ' + table + ': ' + rows.length + ' baris');
}

(async () => {
  console.log('Seeding modul legacy ke', SUPABASE_URL);

  const divisi = ['IT', 'HRD', 'Finance', 'Marketing'].map((n) => ({ nama: n }));
  const jabatan = ['Manager', 'Supervisor', 'Staff'].map((n) => ({ nama: n }));
  const materi = ['Pelatihan Bootstrap 4', 'Pelatihan PHP OOP'].map((n) => ({ nama: n }));

  const member = [
    {
      fullname: 'Administrator',
      username: 'admin',
      passwors: bcrypt.hashSync('Admin@Kepegawaian2026!', 10),
      role: 'administrator',
      email: 'admin@example.com',
      foto: ''
    },
    {
      fullname: 'Staff Umum',
      username: 'staff',
      passwors: bcrypt.hashSync('Staff@Kepegawaian2026!', 10),
      role: 'staff',
      email: 'staff@example.com',
      foto: ''
    }
  ];

  // id divisi: 1 IT, 2 HRD, 3 Finance, 4 Marketing
  // id jabatan: 1 Manager, 2 Supervisor, 3 Staff
  const pegawaiLegacy = [
    { nip: 'P001', nama: 'Budi Santoso', gender: 'L', tempat_lahir: 'Jakarta', tanggal_lahir: '1990-05-12', idjabatan: 3, iddivisi: 1, alamat: 'Jl. Merdeka No.1, Jakarta', email: 'budi@example.com', foto: '' },
    { nip: 'P002', nama: 'Siti Aminah', gender: 'P', tempat_lahir: 'Bandung', tanggal_lahir: '1992-08-23', idjabatan: 2, iddivisi: 2, alamat: 'Jl. Asia Afrika No.5, Bandung', email: 'siti@example.com', foto: '' },
    { nip: 'P003', nama: 'Agus Wijaya', gender: 'L', tempat_lahir: 'Surabaya', tanggal_lahir: '1988-01-30', idjabatan: 1, iddivisi: 1, alamat: 'Jl. Pemuda No.9, Surabaya', email: 'agus@example.com', foto: '' }
  ];

  const pelatihan = [
    { pegawai_id: 1, materi_id: 1, tgl_mulai: '2026-01-10', tgl_akhir: '2026-01-14', keterangan: 'Dasar Bootstrap 4' },
    { pegawai_id: 2, materi_id: 2, tgl_mulai: '2026-02-01', tgl_akhir: '2026-02-05', keterangan: 'PHP OOP lanjutan' }
  ];

  const gaji = [
    { pegawai_id: 1, gapok: 5000000, tunjab: 1500000, bpjs: 400000, lain2: 200000 },
    { pegawai_id: 2, gapok: 4000000, tunjab: 1000000, bpjs: 350000, lain2: 150000 }
  ];

  const plan = [
    ['divisi', divisi],
    ['jabatan', jabatan],
    ['materi', materi],
    ['member', member],
    ['pegawai_legacy', pegawaiLegacy],
    ['pelatihan', pelatihan],
    ['gaji', gaji]
  ];

  for (const [t, rows] of plan) {
    await kosongkan(t);
    await insertAll(t, rows);
  }

  await kosongkan('login_attempt');

  console.log('Selesai.');
})().catch((e) => {
  console.error('Seed gagal:', e.message);
  process.exit(1);
});
