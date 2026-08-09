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
  menu: 'menu'
};

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

// ---------- Modul khusus: Periode PPPK ----------
// Role: administrator (SUPER ADMIN) penuh, manager (ADMIN KECAMATAN) tanpa
// hapus, staff (OPERATOR SEKOLAH) hanya untuk sekolahnya sendiri.
const PPPK_ROLES = ['administrator', 'manager', 'staff'];

function nowIso() {
  return new Date().toISOString();
}

function actorName(member) {
  return member.nama || member.username || member.role || '';
}

function pppkMember(req, res) {
  const m = req.session && req.session.MEMBER;
  if (!m) {
    res.status(401).json({ ok: false, error: 'Silakan login terlebih dahulu.' });
    return null;
  }
  return m;
}

async function pppkFetchRow(id) {
  const rows = await supabase.select('periode_pppk', { eq: { col: 'id', val: id }, order: 'id.asc' });
  return rows[0] || null;
}

// Pastikan referensi pegawai & data turunannya (nip/nama/nik) konsisten
// dengan tabel pegawai. Return pesan error, atau null bila valid.
async function pegawaiMustMatch(body) {
  const id = body.pegawai_id;
  if (id === undefined || id === null || id === '') return null;
  const rows = await supabase.select('pegawai', { eq: { col: 'id', val: id } });
  const peg = rows[0];
  if (!peg) return 'Pegawai tidak ditemukan.';
  if (body.nip !== undefined && String(body.nip || '') !== String(peg.nip || '')) {
    return 'NIP tidak sesuai dengan data pegawai.';
  }
  if (body.nama !== undefined && String(body.nama || '') !== String(peg.nama || '')) {
    return 'Nama tidak sesuai dengan data pegawai.';
  }
  if (body.nik !== undefined && String(body.nik || '') !== String(peg.nik || '')) {
    return 'NIK tidak sesuai dengan data pegawai.';
  }
  return null;
}

// Simpan snapshot satu periode ke tabel riwayat (periode lama tidak pernah
// dihapus, selalu tersimpan sebagai riwayat).
async function pppkRiwayat(periodeId, pegawaiId, row, aksi, member) {
  const snap = {
    periode_id: periodeId,
    pegawai_id: pegawaiId,
    periode_ke: row.periode_ke,
    nip: row.nip,
    nama: row.nama,
    nik: row.nik,
    npsn: row.npsn,
    sekolah: row.sekolah,
    jabatan: row.jabatan,
    jenis: row.jenis,
    nomor_perjanjian: row.nomor_perjanjian,
    tanggal_perjanjian: row.tanggal_perjanjian,
    tanggal_mulai: row.tanggal_mulai,
    tanggal_berakhir: row.tanggal_berakhir,
    keterangan: row.keterangan,
    dokumen: row.dokumen,
    status: row.status,
    aksi,
    oleh: actorName(member),
    created_at: nowIso(),
    updated_at: nowIso()
  };
  return supabase.insert('riwayat_periode_pppk', snap);
}

async function audit(modul, aksi, recordId, detail, member) {
  try {
    await supabase.insert('audit_log', {
      modul,
      aksi,
      record_id: String(recordId),
      detail: detail || '',
      oleh: actorName(member),
      role: member.role,
      created_at: nowIso()
    });
  } catch (err) {
    console.error('AUDIT ' + modul + ':', err.message);
  }
}

router.post('/pppk', async (req, res) => {
  const member = pppkMember(req, res);
  if (!member) return;
  if (PPPK_ROLES.indexOf(member.role) === -1) {
    return res.status(403).json({ ok: false, error: 'Anda tidak memiliki akses untuk tindakan ini.' });
  }
  const body = req.body || {};
  let sekolah = String(body.sekolah || '');
  if (member.role === 'staff') {
    if (!member.unit) {
      return res.status(403).json({ ok: false, error: 'Akun Anda belum memiliki unit/sekolah.' });
    }
    sekolah = member.unit;
  }
  const mErr = await pegawaiMustMatch(body);
  if (mErr) return res.status(400).json({ ok: false, error: mErr });
  const data = {
    pegawai_id: body.pegawai_id || null,
    nip: body.nip || '',
    nama: body.nama || '',
    nik: body.nik || '',
    npsn: body.npsn || '',
    sekolah,
    jabatan: body.jabatan || '',
    jenis: body.jenis || '',
    nomor_perjanjian: body.nomor_perjanjian || '',
    tanggal_perjanjian: body.tanggal_perjanjian || '',
    tanggal_mulai: body.tanggal_mulai || '',
    tanggal_berakhir: body.tanggal_berakhir || '',
    keterangan: body.keterangan || '',
    dokumen: body.dokumen || '',
    status: 'AKTIF',
    periode_ke: Number(body.periode_ke) || 1,
    created_at: nowIso(),
    updated_at: nowIso(),
    created_by: actorName(member),
    updated_by: actorName(member)
  };
  try {
    const row = await supabase.insert('periode_pppk', data);
    await pppkRiwayat(row.id, row.pegawai_id, row, 'TAMBAH', member);
    await audit('periode_pppk', 'TAMBAH', row.id, 'Periode PPPK #' + row.id + ' (' + row.nama + ')', member);
    kepdata.invalidateCache();
    return res.json({ ok: true, data: row });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/pppk/:id', async (req, res) => {
  const member = pppkMember(req, res);
  if (!member) return;
  const body = req.body || {};
  try {
    const old = await pppkFetchRow(req.params.id);
    if (!old) return res.status(404).json({ ok: false, error: 'Data periode tidak ditemukan.' });
    if (member.role === 'administrator' || member.role === 'manager') {
      // ok
    } else if (member.role === 'staff') {
      if (!member.unit || old.sekolah !== member.unit) {
        return res.status(403).json({ ok: false, error: 'Anda hanya dapat mengubah data sekolah Anda.' });
      }
    } else {
      return res.status(403).json({ ok: false, error: 'Anda tidak memiliki akses untuk tindakan ini.' });
    }
    const data = {
      pegawai_id: body.pegawai_id !== undefined ? body.pegawai_id : old.pegawai_id,
      nip: body.nip !== undefined ? body.nip : old.nip,
      nama: body.nama !== undefined ? body.nama : old.nama,
      nik: body.nik !== undefined ? body.nik : old.nik,
      npsn: body.npsn !== undefined ? body.npsn : old.npsn,
      sekolah: body.sekolah !== undefined ? body.sekolah : old.sekolah,
      jabatan: body.jabatan !== undefined ? body.jabatan : old.jabatan,
      jenis: body.jenis !== undefined ? body.jenis : old.jenis,
      nomor_perjanjian: body.nomor_perjanjian !== undefined ? body.nomor_perjanjian : old.nomor_perjanjian,
      tanggal_perjanjian: body.tanggal_perjanjian !== undefined ? body.tanggal_perjanjian : old.tanggal_perjanjian,
      tanggal_mulai: body.tanggal_mulai !== undefined ? body.tanggal_mulai : old.tanggal_mulai,
      tanggal_berakhir: body.tanggal_berakhir !== undefined ? body.tanggal_berakhir : old.tanggal_berakhir,
      keterangan: body.keterangan !== undefined ? body.keterangan : old.keterangan,
      dokumen: body.dokumen !== undefined ? body.dokumen : old.dokumen,
      status: body.status !== undefined ? body.status : old.status,
      periode_ke: body.periode_ke !== undefined ? Number(body.periode_ke) : old.periode_ke,
      updated_at: nowIso(),
      updated_by: actorName(member)
    };
    if (member.role === 'staff') {
      data.sekolah = member.unit;
    }
    const mErr = await pegawaiMustMatch(body);
    if (mErr) return res.status(400).json({ ok: false, error: mErr });
    const row = await supabase.update('periode_pppk', req.params.id, data);
    await pppkRiwayat(row.id, row.pegawai_id, row, 'UBAH', member);
    await audit('periode_pppk', 'UBAH', row.id, 'Periode PPPK #' + row.id + ' (' + row.nama + ')', member);
    kepdata.invalidateCache();
    return res.json({ ok: true, data: row });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete('/pppk/:id', async (req, res) => {
  const member = pppkMember(req, res);
  if (!member) return;
  if (member.role !== 'administrator') {
    return res.status(403).json({ ok: false, error: 'Hanya SUPER ADMIN yang dapat menghapus periode PPPK.' });
  }
  try {
    const old = await pppkFetchRow(req.params.id);
    if (!old) return res.status(404).json({ ok: false, error: 'Data periode tidak ditemukan.' });
    await supabase.remove('periode_pppk', req.params.id);
    await audit('periode_pppk', 'HAPUS', req.params.id, 'Periode PPPK #' + req.params.id + ' (' + old.nama + ')', member);
    kepdata.invalidateCache();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/pppk/:id/perpanjang', async (req, res) => {
  const member = pppkMember(req, res);
  if (!member) return;
  if (member.role !== 'administrator' && member.role !== 'manager') {
    return res.status(403).json({ ok: false, error: 'Hanya SUPER ADMIN / ADMIN KECAMATAN yang dapat memperpanjang periode PPPK.' });
  }
  const body = req.body || {};
  try {
    const old = await pppkFetchRow(req.params.id);
    if (!old) return res.status(404).json({ ok: false, error: 'Data periode tidak ditemukan.' });
    if (!body.tanggal_mulai || !body.tanggal_berakhir) {
      return res.status(400).json({ ok: false, error: 'Tanggal mulai dan berakhir periode baru wajib diisi.' });
    }
    // Periode lama dipindahkan ke riwayat (tidak pernah dihapus).
    await pppkRiwayat(old.id, old.pegawai_id, old, 'PERPANJANG', member);
    const next = {
      pegawai_id: old.pegawai_id,
      nip: old.nip,
      nama: old.nama,
      nik: old.nik,
      npsn: old.npsn,
      sekolah: old.sekolah,
      jabatan: old.jabatan,
      jenis: old.jenis,
      nomor_perjanjian: body.nomor_perjanjian || old.nomor_perjanjian,
      tanggal_perjanjian: body.tanggal_perjanjian || '',
      tanggal_mulai: body.tanggal_mulai,
      tanggal_berakhir: body.tanggal_berakhir,
      keterangan: body.keterangan || old.keterangan,
      dokumen: body.dokumen || old.dokumen,
      status: 'AKTIF',
      periode_ke: (Number(old.periode_ke) || 1) + 1,
      created_at: nowIso(),
      updated_at: nowIso(),
      created_by: actorName(member),
      updated_by: actorName(member)
    };
    const row = await supabase.insert('periode_pppk', next);
    await pppkRiwayat(row.id, row.pegawai_id, row, 'TAMBAH', member);
    await audit('periode_pppk', 'PERPANJANG', row.id, 'Periode #' + old.id + ' -> #' + row.id + ' (' + row.nama + ')', member);
    kepdata.invalidateCache();
    return res.json({ ok: true, data: row });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/pppk/:id/riwayat', async (req, res) => {
  const member = pppkMember(req, res);
  if (!member) return;
  try {
    const cur = await pppkFetchRow(req.params.id);
    if (!cur) return res.status(404).json({ ok: false, error: 'Data periode tidak ditemukan.' });
    if (member.role === 'staff' && (!member.unit || cur.sekolah !== member.unit)) {
      return res.status(403).json({ ok: false, error: 'Anda hanya dapat melihat riwayat data sekolah Anda.' });
    }
    const periode = await supabase.select('periode_pppk', { eq: { col: 'pegawai_id', val: cur.pegawai_id }, order: 'periode_ke.desc' });
    const riwayat = await supabase.select('riwayat_periode_pppk', { eq: { col: 'pegawai_id', val: cur.pegawai_id }, order: 'id.desc' });
    return res.json({ ok: true, periode, riwayat });
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
    const row = await supabase.insert(table, toDb(req.params.modul, req.body));
    kepdata.invalidateCache();
    if (table === 'menu') menuModel.invalidateCache();
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
    const row = await supabase.update(table, req.params.id, toDb(req.params.modul, req.body));
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
