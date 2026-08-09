// API dashboard personal pegawai (read-only).
// GET /api/dashboard         -> data dasar (ringan, tampil cepat)
// GET /api/dashboard/:part   -> satu bagian yang dimuat malas (lazy load)
// Semua data dibatasi milik pegawai yang sedang login saja (server-side).
const express = require('express');
const dashboard = require('../models/dashboard');

const router = express.Router();

const LAZY_PARTS = ['pangkat', 'kgb', 'cuti', 'mutasi', 'jabatan', 'sertifikasi', 'arsip', 'surat', 'presensi', 'bup'];

function memberOf(req, res) {
  const member = req.session.MEMBER;
  if (!member) {
    res.status(401).json({ ok: false, error: 'Silakan login terlebih dahulu.' });
    return null;
  }
  return member;
}

router.get('/dashboard', async (req, res) => {
  const member = memberOf(req, res);
  if (!member) return;
  res.set('Cache-Control', 'no-store');
  try {
    const data = await dashboard.getBase(member);
    return res.json({ ok: true, data });
  } catch (err) {
    console.error('API DASHBOARD:', err.message);
    return res.status(500).json({ ok: false, error: 'Data gagal dimuat. Silakan coba lagi.' });
  }
});

router.get('/dashboard/:part', async (req, res) => {
  const member = memberOf(req, res);
  if (!member) return;
  const part = req.params.part;
  if (LAZY_PARTS.indexOf(part) === -1) {
    return res.status(404).json({ ok: false, error: 'Bagian tidak dikenal.' });
  }
  res.set('Cache-Control', 'no-store');
  try {
    const data = await dashboard.getPart(member, part);
    if (data === null) {
      return res.status(404).json({ ok: false, error: 'Bagian tidak dikenal.' });
    }
    if (data && data.found === false) {
      return res.status(403).json({ ok: false, error: 'Akun tidak terhubung dengan data pegawai.' });
    }
    return res.json({ ok: true, data });
  } catch (err) {
    console.error('API DASHBOARD ' + part + ':', err.message);
    return res.status(500).json({ ok: false, error: 'Data gagal dimuat. Silakan coba lagi.' });
  }
});

module.exports = router;
