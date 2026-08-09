// API self-service pegawai.
// Pegawai hanya dapat menambah/mengubah/menghapus DATA MILIK SENDIRI.
// Identitas pegawai di-resolve server-side dari session (bukan input client).
//   PUT    /api/self/profil            -> ubah data profil sendiri
//   POST   /api/self/foto              -> unggah foto profil sendiri
//   POST   /api/self/upload            -> unggah dokumen (arsip/surat/mutasi)
//   POST   /api/self/:modul            -> tambah data layanan sendiri
//   PUT    /api/self/:modul/:id        -> ubah data sendiri
//   DELETE /api/self/:modul/:id        -> hapus data sendiri
// Modul yang tersedia: mutasi, jabatan, sertifikasi, cuti, surat, arsip.
// Arsip presensi TIDAK dapat diubah oleh pegawai (dikelola admin).
const express = require('express');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const dashboard = require('../models/dashboard');

const router = express.Router();

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

// Resolve pegawai milik pengguna yang login. 401/403 jika tidak valid.
async function ownPegawai(req, res) {
  const member = req.session && req.session.MEMBER;
  if (!member) {
    res.status(401).json({ ok: false, error: 'Silakan login terlebih dahulu.' });
    return null;
  }
  const pegawai = await dashboard.resolvePegawai(member);
  if (!pegawai) {
    res.status(403).json({ ok: false, error: 'Akun tidak terhubung dengan data pegawai.' });
    return null;
  }
  return pegawai;
}

// Definisisi modul layanan yang boleh dikelola pegawai sendiri.
// Kolom status tidak diambil dari client (nilai default saat tambah, tetap saat ubah).
const SELF_MODUL = {
  mutasi: {
    table: 'mutasi',
    rel: 'pegawai_id',
    defaults: { status: 'Diajukan' },
    cols: ['jenis', 'asal', 'tujuan', 'tanggal', 'nomor_sk', 'keterangan', 'dokumen']
  },
  jabatan: {
    table: 'jabatan_pegawai',
    rel: 'pegawai_id',
    defaults: { status: 'Aktif' },
    cols: ['jabatan', 'jenis', 'tmt', 'nomor_sk', 'tanggal_sk', 'keterangan']
  },
  sertifikasi: {
    table: 'sertifikasi',
    rel: 'pegawai_id',
    defaults: { status: 'Aktif', status_bayar: 'Belum Dibayar' },
    cols: ['nama_sertifikasi', 'nomor', 'bidang', 'tahun', 'tunjangan', 'keterangan']
  },
  cuti: {
    table: 'cuti',
    rel: 'pemohon',
    defaults: { status: 'Diajukan' },
    cols: ['jenis', 'mulai', 'selesai', 'lama']
  },
  surat: {
    table: 'surat_kepegawaian',
    rel: 'pegawai_id',
    defaults: { status: 'Draft' },
    cols: ['jenis', 'nomor', 'tanggal', 'perihal', 'isi']
  },
  arsip: {
    table: 'arsip',
    rel: 'pegawai_id',
    defaults: {},
    cols: ['kategori', 'nama_dokumen', 'file', 'keterangan']
  }
};

const PROFIL_FIELDS = ['jk', 'ttl', 'alamat', 'hp', 'email', 'pendidikan', 'jurusan'];

function cleanSelf(def, body, pegawai) {
  const out = {};
  def.cols.forEach((k) => {
    if (body[k] !== undefined && body[k] !== '') out[k] = body[k];
  });
  if (def.rel === 'pemohon') out.pemohon = pegawai.nama || '';
  else out.pegawai_id = pegawai.id;
  return out;
}

async function assertOwn(def, id, pegawai) {
  const rows = await supabase.select(def.table, { eq: { col: 'id', val: id } });
  const row = rows[0];
  if (!row) {
    const e = new Error('Data tidak ditemukan.');
    e.status = 404;
    throw e;
  }
  if (def.rel === 'pemohon') {
    if (String(row.pemohon || '') !== String(pegawai.nama || '')) {
      const e = new Error('Anda tidak berhak mengubah data ini.');
      e.status = 403;
      throw e;
    }
  } else if (Number(row.pegawai_id) !== Number(pegawai.id)) {
    const e = new Error('Anda tidak berhak mengubah data ini.');
    e.status = 403;
    throw e;
  }
  return row;
}

function modulDef(modul) {
  const def = SELF_MODUL[modul];
  if (!def) {
    const e = new Error('Modul tidak dikenal.');
    e.status = 404;
    throw e;
  }
  return def;
}

// Ubah profil sendiri.
router.put('/profil', async (req, res) => {
  const pegawai = await ownPegawai(req, res);
  if (!pegawai) return;

  const payload = {};
  PROFIL_FIELDS.forEach((k) => {
    if (req.body[k] !== undefined && req.body[k] !== '') payload[k] = req.body[k];
  });
  if (!Object.keys(payload).length) {
    return res.json({ ok: true, data: pegawai });
  }
  try {
    await supabase.update('pegawai', pegawai.id, payload);
    dashboard.invalidateCache();
    return res.json({ ok: true });
  } catch (err) {
    console.error('API SELF profil:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Unggah foto profil sendiri.
router.post('/foto', async (req, res) => {
  const pegawai = await ownPegawai(req, res);
  if (!pegawai) return;

  const { contentType, base64 } = req.body || {};
  if (!base64) {
    return res.status(400).json({ ok: false, error: 'File belum dikirim.' });
  }
  try {
    const mime = contentType || 'image/jpeg';
    const ext = (mime.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 4) || 'jpg';
    const filename = 'foto-' + pegawai.id + '-' + Date.now() + '.' + ext;
    const url = await supabase.upload('pegawai-foto', filename, Buffer.from(base64, 'base64'), mime);
    await supabase.update('pegawai', pegawai.id, { foto: url });
    if (req.session.MEMBER) req.session.MEMBER.foto = url;
    dashboard.invalidateCache();
    return res.json({ ok: true, url });
  } catch (err) {
    console.error('API SELF foto:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Unggah dokumen milik sendiri (untuk arsip/surat/mutasi).
router.post('/upload', async (req, res) => {
  const pegawai = await ownPegawai(req, res);
  if (!pegawai) return;

  const { filename, contentType, base64 } = req.body || {};
  if (!filename || !base64) {
    return res.status(400).json({ ok: false, error: 'File belum dikirim.' });
  }
  try {
    const safe = Date.now() + '-' + String(filename).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const url = await supabase.upload('dokumen', safe, Buffer.from(base64, 'base64'), contentType || 'application/octet-stream');
    return res.json({ ok: true, url });
  } catch (err) {
    console.error('API SELF upload:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/:modul', async (req, res) => {
  const pegawai = await ownPegawai(req, res);
  if (!pegawai) return;
  let def;
  try {
    def = modulDef(req.params.modul);
  } catch (err) {
    return res.status(err.status || 404).json({ ok: false, error: err.message });
  }
  try {
    const payload = Object.assign({}, def.defaults, cleanSelf(def, req.body, pegawai));
    const row = await supabase.insert(def.table, payload);
    dashboard.invalidateCache();
    return res.json({ ok: true, data: row });
  } catch (err) {
    console.error('API SELF insert ' + req.params.modul + ':', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/:modul/:id', async (req, res) => {
  const pegawai = await ownPegawai(req, res);
  if (!pegawai) return;
  let def;
  try {
    def = modulDef(req.params.modul);
  } catch (err) {
    return res.status(err.status || 404).json({ ok: false, error: err.message });
  }
  try {
    await assertOwn(def, req.params.id, pegawai);
    const payload = cleanSelf(def, req.body, pegawai);
    await supabase.update(def.table, req.params.id, payload);
    dashboard.invalidateCache();
    return res.json({ ok: true });
  } catch (err) {
    console.error('API SELF update ' + req.params.modul + ':', err.message);
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
});

router.delete('/:modul/:id', async (req, res) => {
  const pegawai = await ownPegawai(req, res);
  if (!pegawai) return;
  let def;
  try {
    def = modulDef(req.params.modul);
  } catch (err) {
    return res.status(err.status || 404).json({ ok: false, error: err.message });
  }
  try {
    await assertOwn(def, req.params.id, pegawai);
    await supabase.remove(def.table, req.params.id);
    dashboard.invalidateCache();
    return res.json({ ok: true });
  } catch (err) {
    console.error('API SELF delete ' + req.params.modul + ':', err.message);
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
