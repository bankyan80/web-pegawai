const express = require('express');
const {
  getStatistics,
  analyzeData,
  auditProject,
  generateRecommendations,
} = require('../models/analysis');

const router = express.Router();

/**
 * Middleware untuk mengecek user login dan role
 */
function requireLogin(req, res, next) {
  if (!req.session.MEMBER) {
    return res.status(401).json({ error: 'Unauthorized. Please login first.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.MEMBER || req.session.MEMBER.role !== 'administrator') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  next();
}

/**
 * GET /api/analysis/statistics
 * Ambil statistik umum kepegawaian
 */
router.get('/statistics', requireLogin, (req, res) => {
  try {
    const stats = getStatistics();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analysis/analyze
 * Analisis data dengan AI Cloudflare
 */
router.get('/analyze', requireAdmin, async (req, res) => {
  try {
    const result = await analyzeData();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analysis/audit
 * Audit project dan cek integritas data
 */
router.get('/audit', requireAdmin, async (req, res) => {
  try {
    const result = await auditProject();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analysis/recommendations
 * Generate rekomendasi pengembangan SDM
 */
router.get('/recommendations', requireAdmin, async (req, res) => {
  try {
    const result = await generateRecommendations();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analysis/full-report
 * Generate laporan lengkap: statistik + analisis + audit + rekomendasi
 */
router.get('/full-report', requireAdmin, async (req, res) => {
  try {
    const statistics = getStatistics();
    const analysis = await analyzeData();
    const audit = await auditProject();
    const recommendations = await generateRecommendations();

    res.json({
      success: true,
      data: {
        statistics,
        analysis,
        audit,
        recommendations,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
