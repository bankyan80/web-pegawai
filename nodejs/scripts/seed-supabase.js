/* eslint-disable no-console */
// Seed data dummy ke Supabase via REST API (PostgREST).
// Idempotent: kosongkan tabel dulu, lalu insert.
// Usage: node nodejs/scripts/seed-supabase.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const D = require('../dummy-data');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dkixmotzmmioupclqpan.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY belum diset. Atur di nodejs/.env');
  process.exit(1);
}

// Pemetaan key data dummy (camelCase) -> kolom tabel (snake_case).
const KEYMAP = {
  gaji_berkala: { tmtLama: 'tmt_lama', tmtBerikut: 'tmt_berikut' },
  slks: { masaKerja: 'masa_kerja' },
  pensiun: { tglLahir: 'tgl_lahir' }
};

const snake = (t, row) => {
  const map = KEYMAP[t] || {};
  const out = {};
  Object.keys(row).forEach((k) => {
    if (k === 'id') return;
    const v = row[k];
    out[map[k] || k] = v === undefined ? '' : v;
  });
  return out;
};

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
  const mapped = rows.map((r) => snake(table, r));
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
    method: 'POST',
    headers: Object.assign(H(), { Prefer: 'return=minimal' }),
    body: JSON.stringify(mapped)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('INSERT ' + table + ' -> ' + res.status + ': ' + txt.slice(0, 300));
  }
  console.log('  ' + table + ': ' + mapped.length + ' baris');
}

(async () => {
  console.log('Seeding ke', SUPABASE_URL);

  const refs = [];
  Object.keys(D.referensi).forEach((kategori) => {
    D.referensi[kategori].forEach((r, i) => refs.push({ kategori, kode: r.kode || (kategori.toUpperCase().slice(0, 3) + '-' + String(i + 1).padStart(2, '0')), nama: r.nama, status: r.status }));
  });

  const plan = [
    ['referensi', refs],
    ['pegawai', D.pegawai],
    ['presensi', D.presensi],
    ['surat', D.surat],
    ['kepangkatan', D.kepangkatan],
    ['gaji_berkala', D.gajiBerkala],
    ['cuti', D.cuti],
    ['izin_cerai', D.izinCerai],
    ['slks', D.slks],
    ['pengadaan', D.pengadaan],
    ['pensiun', D.pensiun],
    ['pindah_tugas', D.pindahTugas],
    ['penempatan', D.penempatan],
    ['disiplin', D.disiplin],
    ['diklat_struktural', D.diklatStruktural],
    ['diklat_teknis', D.diklatTeknis],
    ['izin_belajar', D.izinBelajar],
    ['tugas_belajar', D.tugasBelajar],
    ['users', D.users]
  ];

  for (const [t, rows] of plan) {
    await kosongkan(t);
    await insertAll(t, rows);
  }

  console.log('Selesai.');
})().catch((e) => {
  console.error('Seed gagal:', e.message);
  process.exit(1);
});
