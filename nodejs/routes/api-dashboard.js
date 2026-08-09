// API dashboard personal pegawai (read-only).
// GET /api/dashboard -> data milik pegawai yang sedang login saja.
const express = require('express');
const dashboard = require('../models/dashboard');

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  const member = req.session.MEMBER;
  if (!member) {
    return res.status(401).json({ ok: false, error: 'Silakan login terlebih dahulu.' });
  }
  res.set('Cache-Control', 'no-store');
  try {
    const data = await dashboard.getPersonalData(member);
    return res.json({ ok: true, data });
  } catch (err) {
    console.error('API DASHBOARD:', err.message);
    return res.status(500).json({ ok: false, error: 'Data gagal dimuat. Silakan coba lagi.' });
  }
});

module.exports = router;
