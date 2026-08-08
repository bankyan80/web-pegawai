// Loader data modul kepegawaian dari Supabase.
// Menghasilkan objek data yang dibaca routes/pages.js.
const supabase = require('../config/supabase');

const TABLES = [
  'pegawai',
  'presensi',
  'surat',
  'kepangkatan',
  'gaji_berkala',
  'cuti',
  'izin_cerai',
  'slks',
  'pengadaan',
  'pensiun',
  'pindah_tugas',
  'penempatan',
  'disiplin',
  'diklat_struktural',
  'diklat_teknis',
  'izin_belajar',
  'tugas_belajar',
  'users'
];

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 5000;

// Pemetaan nama tabel (snake_case) -> key yang dipakai views (camelCase).
const TABLE_KEYS = {
  gaji_berkala: 'gajiBerkala',
  izin_cerai: 'izinCerai',
  pindah_tugas: 'pindahTugas',
  diklat_struktural: 'diklatStruktural',
  diklat_teknis: 'diklatTeknis',
  izin_belajar: 'izinBelajar',
  tugas_belajar: 'tugasBelajar'
};

// Key snake_case -> nama properti yang dipakai views (camelCase).
const RENAME = {
  gaji_berkala: { tmt_lama: 'tmtLama', tmt_berikut: 'tmtBerikut' },
  slks: { masa_kerja: 'masaKerja' },
  pensiun: { tgl_lahir: 'tglLahir' }
};

function toView(table, row) {
  const map = RENAME[table] || {};
  const out = {};
  Object.keys(row).forEach((k) => {
    out[map[k] || k] = row[k];
  });
  return out;
}

async function loadAll() {
  const results = {};
  await Promise.all(
    TABLES.map(async (t) => {
      try {
        results[t] = (await supabase.select(t, { order: 'id.asc' })).map((r) => toView(t, r));
      } catch (err) {
        console.error('KEPDATA load ' + t + ':', err.message);
        results[t] = [];
      }
    })
  );
  return results;
}

async function getKepData() {
  const now = Date.now();
  if (!cache || now - cacheTime > CACHE_TTL) {
    const data = await loadAll();
    const ref = await loadReferensi();
    const lists = listsFromRef(ref);
    const out = {};
    TABLES.forEach((t) => {
      out[TABLE_KEYS[t] || t] = data[t];
    });
    cache = {
      ...out,
      // List referensi dari Supabase
      referensi: ref,
      // Detail pegawai dibangun dari baris pegawai
      detailPegawai: detailPegawai,
      // Kartu pegawai (10 pertama)
      kartuPegawai: data.pegawai.slice(0, 10).map((p) => ({ ...p, qr: 'KRP-' + String(p.nip).slice(-6) })),
      // List pilihan form dari tabel referensi
      unitKerja: lists.unitKerja,
      jabatanList: lists.jabatanList,
      pangkatList: lists.pangkatList,
      golonganList: lists.golonganList,
      jenisPegawaiList: lists.jenisPegawaiList,
      jenisCuti: lists.jenisCuti
    };
    cacheTime = now;
  }
  return cache;
}

async function loadReferensi() {
  try {
    const rows = await supabase.select('referensi', { order: 'kode.asc' });
    const ref = {};
    rows.forEach((r) => {
      if (!ref[r.kategori]) ref[r.kategori] = [];
      ref[r.kategori].push({ id: r.id, kode: r.kode, nama: r.nama, status: r.status });
    });
    return ref;
  } catch (err) {
    console.error('KEPDATA referensi:', err.message);
    return {};
  }
}

// List statis pilihan form dibangun dari tabel referensi.
function listsFromRef(ref) {
  const byName = (kat) => (ref[kat] || []).filter((r) => r.status === 'Aktif').map((r) => r.nama);
  const golongan = (ref['golongan'] || []).filter((r) => r.status === 'Aktif');
  return {
    unitKerja: byName('unit'),
    jabatanList: byName('jabatan'),
    pangkatList: golongan.map((r) => r.nama),
    golonganList: golongan.map((r) => r.kode),
    jenisPegawaiList: byName('jenisPegawai'),
    jenisCuti: byName('jenisCuti')
  };
}

function detailPegawai(id) {
  if (!cache || !cache.pegawai) return null;
  const p = cache.pegawai.find((x) => Number(x.id) === Number(id)) || cache.pegawai[0];
  if (!p) return null;
  const nama = String(p.nama || '');
  const unit = String(p.unit || '');
  return {
    ...p,
    pendidikan: [
      { jenjang: p.pendidikan, jurusan: p.jurusan, sekolah: p.sekolah, tahun: '' },
      { jenjang: 'SMA', jurusan: 'IPA', sekolah: 'SMA ' + unit.split(' ')[0], tahun: '' }
    ],
    riwayatPangkat: [
      { pangkat: p.pangkat, golongan: p.golongan, tmt: p.tmt, sk: '' },
      { pangkat: 'Penata Muda', golongan: 'III/a', tmt: '', sk: '' }
    ],
    riwayatJabatan: [
      { jabatan: p.jabatan, unit: p.unit, tmt: '' },
      { jabatan: 'Fungsional Umum', unit: p.unit, tmt: '' }
    ],
    diklat: [
      { nama: 'Diklat Kepemimpinan', tahun: '', status: 'Selesai' },
      { nama: 'Diklat Teknis', tahun: '', status: 'Selesai' }
    ],
    dokumen: [
      { nama: 'Ijazah ' + p.pendidikan, jenis: 'Ijazah', status: 'Lengkap' },
      { nama: 'SK ' + p.pangkat, jenis: 'SK Pangkat', status: 'Lengkap' },
      { nama: 'KTP', jenis: 'KTP', status: 'Lengkap' }
    ]
  };
}

// Set cache langsung (mis. setelah CRUD) agar refresh berikutnya akurat.
function invalidateCache() {
  cache = null;
  cacheTime = 0;
}

module.exports = { getKepData, invalidateCache, detailPegawai };
