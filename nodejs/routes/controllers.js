const express = require('express');
const csrfCheck = require('../middleware/csrf');

const Login = require('../models/login');
const Pegawai = require('../models/pegawai');
const Divisi = require('../models/divisi');
const Jabatan = require('../models/jabatan');
const Gaji = require('../models/gaji');
const Pelatihan = require('../models/pelatihan');
const Materi = require('../models/materi');

const router = express.Router();

router.post('/login', async (req, res) => {
  if (!csrfCheck(req, res)) return;

  const username = req.body.username || '';
  const password = req.body.password || '';
  const ip = req.ip;

  const model = new Login();
  try {
    const blokir = await model.terlampauiBatas(username, ip);
    if (blokir) {
      return res.redirect('/?hal=form_login&blocked=1');
    }
    const rs = await model.otentikasi(username, password);
    if (rs) {
      await model.hapusPercobaan(username);
      req.session.MEMBER = {
        id: rs.id,
        fullname: rs.fullname,
        username: rs.username,
        role: rs.role,
        email: rs.email,
        foto: rs.foto
      };
      res.redirect('/?hal=home');
    } else {
      await model.catatPercobaan(username, ip);
      res.redirect('/?hal=form_login&error=1');
    }
  } catch (e) {
    console.error('Login error:', e.message);
    res.redirect('/?hal=form_login&error=1');
  }
});

router.post('/pegawai', async (req, res) => {
  if (!req.session.MEMBER) return res.redirect('/?hal=home');
  if (!csrfCheck(req, res)) return;

  const data = [
    req.body.nip || '',
    req.body.nama || '',
    req.body.gender || '',
    req.body.tmp || '',
    req.body.tgl || '',
    req.body.jabatan || '',
    req.body.divisi || '',
    req.body.alamat || '',
    req.body.email || '',
    req.body.foto || ''
  ];

  const tombol = req.body.proses || 'batal';
  const model = new Pegawai();

  try {
    if (tombol === 'simpan') {
      await model.simpan(data);
    } else if (tombol === 'ubah') {
      data.push(req.body.idx || '');
      await model.ubah(data);
    } else if (tombol === 'hapus') {
      await model.hapus(req.body.idx || '');
    }
  } catch (e) {
    console.error('Gagal proses data pegawai:', e.message);
  }
  res.redirect('/?hal=pegawai');
});

router.post('/divisi', async (req, res) => {
  if (!req.session.MEMBER || req.session.MEMBER.role === 'staff') return res.redirect('/?hal=home');
  if (!csrfCheck(req, res)) return;

  const data = [req.body.nama || ''];
  const tombol = req.body.proses || 'batal';
  const model = new Divisi();

  try {
    if (tombol === 'simpan') {
      await model.input(data);
    } else if (tombol === 'ubah') {
      data.push(req.body.idx || '');
      await model.ubah(data);
    } else if (tombol === 'hapus') {
      await model.hapus(req.body.idx || '');
    }
  } catch (e) {
    console.error('Gagal proses data divisi:', e.message);
  }
  res.redirect('/?hal=divisi');
});

router.post('/jabatan', async (req, res) => {
  if (!req.session.MEMBER || req.session.MEMBER.role === 'staff') return res.redirect('/?hal=home');
  if (!csrfCheck(req, res)) return;

  const data = [req.body.nama || ''];
  const tombol = req.body.proses || 'batal';
  const model = new Jabatan();

  try {
    if (tombol === 'simpan') {
      await model.input(data);
    } else if (tombol === 'ubah') {
      data.push(req.body.idx || '');
      await model.ubah(data);
    } else if (tombol === 'hapus') {
      await model.hapus(req.body.idx || '');
    }
  } catch (e) {
    console.error('Gagal proses data jabatan:', e.message);
  }
  res.redirect('/?hal=jabatan');
});

router.post('/gaji', async (req, res) => {
  if (!req.session.MEMBER || req.session.MEMBER.role === 'staff') return res.redirect('/?hal=home');
  if (!csrfCheck(req, res)) return;

  const nama = req.body.nama || '';
  const gapok = req.body.gapok || '';
  const tunjab = req.body.tunjab || '';
  const bpjs = req.body.bpjs || '';
  const lain2 = req.body.lain2 || '';

  const data = [nama, gapok, tunjab, bpjs, lain2];
  const data2 = [gapok, tunjab, bpjs, lain2];
  const tombol = req.body.proses || 'batal';
  const model = new Gaji();

  try {
    if (tombol === 'simpan') {
      await model.simpan(data);
    } else if (tombol === 'ubah') {
      data2.push(req.body.idx || '');
      await model.ubah(data2);
    } else if (tombol === 'hapus') {
      await model.hapus(req.body.idx || '');
    }
  } catch (e) {
    console.error('Gagal proses data gaji:', e.message);
  }
  res.redirect('/?hal=gaji');
});

router.post('/pelatihan', async (req, res) => {
  if (!req.session.MEMBER || req.session.MEMBER.role === 'staff') return res.redirect('/?hal=home');
  if (!csrfCheck(req, res)) return;

  const data = [
    req.body.pegawai || '',
    req.body.materi || '',
    req.body.tgl_mulai || '',
    req.body.tgl_akhir || '',
    req.body.ket || ''
  ];

  const tombol = req.body.proses || 'batal';
  const model = new Pelatihan();

  try {
    if (tombol === 'simpan') {
      await model.simpan(data);
    } else if (tombol === 'ubah') {
      data.push(req.body.idx || '');
      await model.ubah(data);
    } else if (tombol === 'hapus') {
      await model.hapus(req.body.idx || '');
    }
  } catch (e) {
    console.error('Gagal proses data pelatihan:', e.message);
  }
  res.redirect('/?hal=pelatihan');
});

router.post('/materi', async (req, res) => {
  if (!req.session.MEMBER || req.session.MEMBER.role === 'staff') return res.redirect('/?hal=home');
  if (!csrfCheck(req, res)) return;

  const data = [req.body.nama || ''];
  const tombol = req.body.proses || 'batal';
  const model = new Materi();

  try {
    if (tombol === 'simpan') {
      await model.input(data);
    } else if (tombol === 'ubah') {
      data.push(req.body.idx || '');
      await model.ubah(data);
    } else if (tombol === 'hapus') {
      await model.hapus(req.body.idx || '');
    }
  } catch (e) {
    console.error('Gagal proses data materi:', e.message);
  }
  res.redirect('/?hal=materi');
});

router.post('/user', async (req, res) => {
  if (!req.session.MEMBER || req.session.MEMBER.role !== 'administrator') return res.redirect('/?hal=home');
  if (!csrfCheck(req, res)) return;

  const data = [
    req.body.fname || '',
    req.body.uname || '',
    req.body.pwd || '',
    req.body.role || 'staff',
    req.body.email || '',
    req.body.foto || ''
  ];

  const tombol = req.body.proses || 'batal';
  const model = new Login();

  try {
    if (tombol === 'simpan') {
      await model.simpan(data);
    } else if (tombol === 'ubah') {
      await model.ubah(data, req.body.idx || '');
    } else if (tombol === 'hapus') {
      await model.hapus(req.body.idx || '');
    }
  } catch (e) {
    console.error('Gagal proses data user:', e.message);
  }
  res.redirect('/?hal=kelolaUser');
});

module.exports = router;
