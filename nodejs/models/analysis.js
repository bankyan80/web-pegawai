const { db } = require('../config/db');
const { callCloudflareAI } = require('../config/cloudflare');

/**
 * Ambil statistik umum dari database
 */
function getStatistics() {
  try {
    const totalPegawai = db.prepare('SELECT COUNT(*) as total FROM pegawai').all()[0]?.total || 0;
    const totalDivisi = db.prepare('SELECT COUNT(*) as total FROM divisi').all()[0]?.total || 0;
    const totalJabatan = db.prepare('SELECT COUNT(*) as total FROM jabatan').all()[0]?.total || 0;
    const totalUser = db.prepare('SELECT COUNT(*) as total FROM member').all()[0]?.total || 0;

    // Distribusi pegawai per divisi
    const divisiDistribution = db.prepare(`
      SELECT d.nama, COUNT(p.id) as jumlah
      FROM divisi d
      LEFT JOIN pegawai p ON d.id = p.iddivisi
      GROUP BY d.id, d.nama
    `).all();

    // Distribusi pegawai per jabatan
    const jabatanDistribution = db.prepare(`
      SELECT j.nama, COUNT(p.id) as jumlah
      FROM jabatan j
      LEFT JOIN pegawai p ON j.id = p.idjabatan
      GROUP BY j.id, j.nama
    `).all();

    return {
      totalPegawai,
      totalDivisi,
      totalJabatan,
      totalUser,
      divisiDistribution,
      jabatanDistribution,
    };
  } catch (error) {
    console.error('Error getting statistics:', error.message);
    return null;
  }
}

/**
 * Analisis data dengan AI
 */
async function analyzeData() {
  try {
    const stats = getStatistics();
    
    if (!stats) {
      throw new Error('Failed to get statistics');
    }

    const prompt = `Analisis data kepegawaian berikut dan berikan insights:
    
Statistik:
- Total Pegawai: ${stats.totalPegawai}
- Total Divisi: ${stats.totalDivisi}
- Total Jabatan: ${stats.totalJabatan}
- Total User/Pengguna: ${stats.totalUser}

Distribusi Pegawai per Divisi:
${stats.divisiDistribution.map(d => `  - ${d.nama}: ${d.jumlah} pegawai`).join('\n')}

Distribusi Pegawai per Jabatan:
${stats.jabatanDistribution.map(j => `  - ${j.nama}: ${j.jumlah} pegawai`).join('\n')}

Berikan:
1. Ringkasan kondisi kepegawaian saat ini
2. Analisis distribusi pegawai
3. Potensi masalah atau bottleneck
4. Rekomendasi perbaikan`;

    const aiAnalysis = await callCloudflareAI(prompt, { maxTokens: 1024 });

    return {
      statistics: stats,
      aiAnalysis,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analyzing data:', error);
    throw error;
  }
}

/**
 * Audit project - cek integritas dan konsistensi data
 */
async function auditProject() {
  try {
    const issues = [];

    // Cek 1: Pegawai tanpa divisi
    const pegawaiTanpaDivisi = db.prepare(`
      SELECT COUNT(*) as total FROM pegawai WHERE iddivisi IS NULL OR iddivisi = 0
    `).all()[0]?.total || 0;
    if (pegawaiTanpaDivisi > 0) {
      issues.push(`Ditemukan ${pegawaiTanpaDivisi} pegawai tanpa divisi`);
    }

    // Cek 2: Pegawai tanpa jabatan
    const pegawaiTanpaJabatan = db.prepare(`
      SELECT COUNT(*) as total FROM pegawai WHERE idjabatan IS NULL OR idjabatan = 0
    `).all()[0]?.total || 0;
    if (pegawaiTanpaJabatan > 0) {
      issues.push(`Ditemukan ${pegawaiTanpaJabatan} pegawai tanpa jabatan`);
    }

    // Cek 3: User/Member tanpa email
    const userTanpaEmail = db.prepare(`
      SELECT COUNT(*) as total FROM member WHERE email IS NULL OR email = ''
    `).all()[0]?.total || 0;
    if (userTanpaEmail > 0) {
      issues.push(`Ditemukan ${userTanpaEmail} user tanpa email`);
    }

    // Cek 4: Pegawai dengan data incomplete
    const pegawaiIncomplete = db.prepare(`
      SELECT COUNT(*) as total FROM pegawai 
      WHERE nama IS NULL OR nip IS NULL OR alamat IS NULL OR email IS NULL
    `).all()[0]?.total || 0;
    if (pegawaiIncomplete > 0) {
      issues.push(`Ditemukan ${pegawaiIncomplete} pegawai dengan data tidak lengkap`);
    }

    // Cek 5: Divisi/Jabatan yang tidak memiliki pegawai
    const emptyDivisi = db.prepare(`
      SELECT COUNT(*) as total FROM divisi 
      WHERE id NOT IN (SELECT DISTINCT iddivisi FROM pegawai WHERE iddivisi IS NOT NULL)
    `).all()[0]?.total || 0;

    const emptyJabatan = db.prepare(`
      SELECT COUNT(*) as total FROM jabatan 
      WHERE id NOT IN (SELECT DISTINCT idjabatan FROM pegawai WHERE idjabatan IS NOT NULL)
    `).all()[0]?.total || 0;

    if (emptyDivisi > 0) {
      issues.push(`Ditemukan ${emptyDivisi} divisi yang tidak memiliki pegawai`);
    }

    if (emptyJabatan > 0) {
      issues.push(`Ditemukan ${emptyJabatan} jabatan yang tidak memiliki pegawai`);
    }

    // Generate audit report dengan AI
    const auditPrompt = `Anda adalah auditor sistem kepegawaian. Berdasarkan issues/masalah yang ditemukan berikut, berikan rekomendasi perbaikan prioritas:

Issues yang ditemukan:
${issues.length > 0 ? issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n') : 'Tidak ada issues kritis ditemukan'}

Berikan:
1. Prioritas perbaikan (Tinggi/Sedang/Rendah)
2. Action items untuk setiap issue
3. Timeline yang disarankan
4. Metrics untuk tracking perbaikan`;

    const aiAuditReport = await callCloudflareAI(auditPrompt, { maxTokens: 1024 });

    return {
      issuesFound: issues,
      issueCount: issues.length,
      aiAuditReport,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error auditing project:', error);
    throw error;
  }
}

/**
 * Generate recommendation berdasarkan data
 */
async function generateRecommendations() {
  try {
    const stats = getStatistics();
    
    if (!stats) {
      throw new Error('Failed to get statistics');
    }

    const prompt = `Sebagai konsultan HR, berikan rekomendasi strategis untuk pengembangan SDM berdasarkan data:

Total Pegawai: ${stats.totalPegawai}
Distribusi per Divisi: ${stats.divisiDistribution.map(d => `${d.nama} (${d.jumlah})`).join(', ')}
Distribusi per Jabatan: ${stats.jabatanDistribution.map(j => `${j.nama} (${j.jumlah})`).join(', ')}

Berikan:
1. Program pengembangan karyawan yang disarankan
2. Strategi rebalancing jika ada ketidakseimbangan
3. Risk assessment untuk ketenagakerjaan
4. Actionable next steps`;

    const recommendations = await callCloudflareAI(prompt, { maxTokens: 1024 });

    return {
      statistics: stats,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

module.exports = {
  getStatistics,
  analyzeData,
  auditProject,
  generateRecommendations,
};
