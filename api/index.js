module.exports = require('../nodejs/app');

// Batasi durasi maksimum function (Vercel): default 10s terlalu pendek untuk
// cold start + koneksi Supabase saat database bangun dari pause (penyebab 504).
module.exports.config = { maxDuration: 60 };
