// API CRUD generik untuk modul kepegawaian (Supabase).
// Endpoint:
//   POST   /api/kep/:modul            -> tambah
//   PUT    /api/kep/:modul/:id        -> ubah
//   DELETE /api/kep/:modul/:id        -> hapus
//   POST   /api/kep/upload/:bucket    -> upload file (multipart)
const express = require('express');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const kepdata = require('../models/kepdata');
const menuModel = require('../models/menu');

const router = express.Router();

// Cek token CSRF (dikirim lewat header X-CSRF-Token atau body csrf_token).
function csrfOk(req) {
  const token = req.headers['x-csrf-token'] || (req.body && req.body.csrf_token);
  const stored = req.session && req.session.csrfToken;
  if (!stored || !token) return false;
  const a = Buffer.from(String(stored));
  const b = Buffer.from(String(token));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

router.use((req, res, next) => {
  if (req.method === 'GET') return next();
  if (!csrfOk(req)) {
    return res.status(403).json({ ok: false, error: 'CSRF token tidak valid. Muat ulang halaman.' });
  }
  next();
});

// Pemetaan modul -> tabel database.
const MODUL_TABLE = {
  pegawai: 'pegawai',
  presensi: 'presensi',
  surat: 'surat',
  kepangkatan: 'kepangkatan',
  gajiberkala: 'gaji_berkala',
  cuti: 'cuti',
  izincerai: 'izin_cerai',
  slks: 'slks',
  pengadaan: 'pengadaan',
  pensiun: 'pensiun',
  pindah_tugas: 'pindah_tugas',
  penempatan: 'penempatan',
  disiplin: 'disiplin',
  diklat_struktural: 'diklat_struktural',
  diklat_teknis: 'diklat_teknis',
  izin_belajar: 'izin_belajar',
  tugas_belajar: 'tugas_belajar',
  users: 'users',
  referensi: 'referensi',
  menu: 'menu',
  mutasi: 'mutasi',
  jabatan: 'jabatan_pegawai',
  sertifikasi: 'sertifikasi',
  arsip: 'arsip',
  suratkepegawaian: 'surat_kepegawaian',
  riwayat_status: 'riwayat_status'
};

// Tabel layanan baru yang relasi ke pegawai lewat pegawai_id.
// Kolom yang boleh dikirim dari form (nama pegawai di-resolve ke id).
const PEGAWAI_LINKED = {
  mutasi: ['pegawai_id', 'jenis', 'asal', 'tujuan', 'tanggal', 'nomor_sk', 'status', 'keterangan', 'dokumen'],
  jabatan_pegawai: ['pegawai_id', 'jabatan', 'jenis', 'tmt', 'nomor_sk', 'tanggal_sk', 'status', 'keterangan'],
  sertifikasi: ['pegawai_id', 'nama_sertifikasi', 'nomor', 'bidang', 'tahun', 'status', 'tunjangan', 'status_bayar', 'keterangan'],
  arsip: ['pegawai_id', 'kategori', 'nama_dokumen', 'file', 'keterangan'],
  surat_kepegawaian: ['pegawai_id', 'jenis', 'nomor', 'tanggal', 'perihal', 'isi', 'status'],
  riwayat_status: ['pegawai_id', 'status_lama', 'status_baru', 'tanggal', 'nomor_sk', 'keterangan']
};

// Cache nama -> id pegawai (60s) untuk resolve pegawai_id dari form.
let pegByName = null;
let pegTs = 0;
async function pegawaiIdByNama(nama) {
  const key = String(nama || '').trim();
  if (!key) return '';
  if (!pegByName || Date.now() - pegTs > 60000) {
    pegByName = {};
    const rows = await supabase.select('pegawai');
    rows.forEach((r) => {
      if (!pegByName[r.nama]) pegByName[r.nama] = r.id;
    });
    pegTs = Date.now();
  }
  return pegByName[key] || '';
}

// Catat riwayat perubahan status kepegawaian (pegawai_id sebagai relasi).
async function logRiwayatStatus(pegawaiId, lama, baru, tanggal, keterangan) {
  try {
    await supabase.insert('riwayat_status', {
      pegawai_id: pegawaiId,
      status_lama: lama || '',
      status_baru: baru || '',
      tanggal: tanggal || new Date().toISOString().slice(0, 10),
      keterangan: keterangan || ''
    });
  } catch (err) {
    console.error('Riwayat status gagal dicatat:', err.message);
  }
}

// Siapkan body sesuai whitelist tabel & resolve pegawai_id dari nama.
async function cleanBody(module, body) {
  const table = MODUL_TABLE[module];
  const allowed = PEGAWAI_LINKED[table];
  if (!allowed) return toDb(module, body);
  const out = {};
  allowed.forEach((k) => {
    if (body[k] !== undefined && body[k] !== '') out[k] = body[k];
  });
  if (!out.pegawai_id && body.nama) {
    const pid = await pegawaiIdByNama(body.nama);
    if (pid) out.pegawai_id = pid;
  }
  return out;
}

// Konversi field camelCase dari form -> kolom snake_case di DB.
const TO_DB = {
  gaji_berkala: { tmtLama: 'tmt_lama', tmtBerikut: 'tmt_berikut' },
  slks: { masaKerja: 'masa_kerja' },
  pensiun: { tglLahir: 'tgl_lahir' }
};

// Kolom yang hanya bisa diatur server (tidak diambil dari body).
const FORBIDDEN = ['id'];

function toDb(module, body) {
  const table = MODUL_TABLE[module];
  const map = TO_DB[table] || {};
  const out = {};
  Object.keys(body).forEach((k) => {
    if (FORBIDDEN.includes(k)) return;
    out[map[k] || k] = body[k];
  });
  return out;
}

function modulTable(modul) {
  const t = MODUL_TABLE[modul];
  if (!t) throw new Error('Modul tidak dikenal: ' + modul);
  return t;
}

// Auth sederhana: wajib login, role administrator/manager boleh ubah.
function mustAuth(req, res) {
  const m = req.session && req.session.MEMBER;
  if (!m) {
    res.status(401).json({ ok: false, error: 'Silakan login terlebih dahulu.' });
    return null;
  }
  if (m.role !== 'administrator' && m.role !== 'manager') {
    res.status(403).json({ ok: false, error: 'Anda tidak memiliki akses untuk tindakan ini.' });
    return null;
  }
  return m;
}

router.post('/upload/:bucket', async (req, res) => {
  const member = mustAuth(req, res);
  if (!member) return;

  const bucket = req.params.bucket === 'foto' ? 'pegawai-foto' : 'dokumen';
  // Upload via JSON: { filename, contentType, base64 }
  const { filename, contentType, base64 } = req.body || {};
  if (!filename || !base64) {
    return res.status(400).json({ ok: false, error: 'File belum dikirim.' });
  }
  try {
    const buf = Buffer.from(base64, 'base64');
    const url = await supabase.upload(bucket, filename, buf, contentType || 'application/octet-stream');
    kepdata.invalidateCache();
    return res.json({ ok: true, url });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/:modul', async (req, res) => {
  const member = mustAuth(req, res);
  if (!member) return;
  let table;
  try {
    table = modulTable(req.params.modul);
  } catch (err) {
    return res.status(404).json({ ok: false, error: err.message });
  }
  try {
    if (table === 'menu' && member.role !== 'administrator') {
      return res.status(403).json({ ok: false, error: 'Hanya SUPER ADMIN yang dapat mengelola menu.' });
    }
    if (table === 'menu') {
      if (req.body.parent_id === '' || req.body.parent_id === undefined) req.body.parent_id = null;
      if (req.body.urutan === '' || req.body.urutan === undefined) req.body.urutan = 0;
    }
    const payload = await cleanBody(req.params.modul, req.body);
    const row = await supabase.insert(table, payload);
    kepdata.invalidateCache();
    if (table === 'menu') menuModel.invalidateCache();
    if (table === 'pegawai' && row && row.id) {
      await logRiwayatStatus(row.id, '', row.jenis || '', '', 'Pegawai baru ditambahkan');
    }
    return res.json({ ok: true, data: row });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/:modul/:id', async (req, res) => {
  const member = mustAuth(req, res);
  if (!member) return;
  let table;
  try {
    table = modulTable(req.params.modul);
  } catch (err) {
    return res.status(404).json({ ok: false, error: err.message });
  }
  try {
    if (table === 'menu' && member.role !== 'administrator') {
      return res.status(403).json({ ok: false, error: 'Hanya SUPER ADMIN yang dapat mengelola menu.' });
    }
    if (table === 'menu') {
      if (req.body.parent_id === '' || req.body.parent_id === undefined) req.body.parent_id = null;
      if (req.body.urutan === '' || req.body.urutan === undefined) req.body.urutan = 0;
    }
    const payload = await cleanBody(req.params.modul, req.body);
    if (table === 'pegawai') {
      const old = await supabase.select('pegawai', { eq: { col: 'id', val: req.params.id } });
      const prev = (old && old[0]) || {};
      if (String(prev.jenis || '') !== String(payload.jenis || '')) {
        await logRiwayatStatus(req.params.id, prev.jenis || '', payload.jenis || '', payload.tmt || '', 'Perubahan status kepegawaian');
      }
    }
    const row = await supabase.update(table, req.params.id, payload);
    kepdata.invalidateCache();
    if (table === 'menu') menuModel.invalidateCache();
    return res.json({ ok: true, data: row });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete('/:modul/:id', async (req, res) => {
  const member = mustAuth(req, res);
  if (!member) return;
  let table;
  try {
    table = modulTable(req.params.modul);
  } catch (err) {
    return res.status(404).json({ ok: false, error: err.message });
  }
  try {
    if (table === 'menu' && member.role !== 'administrator') {
      return res.status(403).json({ ok: false, error: 'Hanya SUPER ADMIN yang dapat mengelola menu.' });
    }
    if (table === 'menu') {
      const children = await supabase.select('menu', { filters: ['parent_id=eq.' + req.params.id] });
      for (const child of children) {
        await supabase.remove('menu', child.id);
      }
    }
    await supabase.remove(table, req.params.id);
    kepdata.invalidateCache();
    if (table === 'menu') menuModel.invalidateCache();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
