// Loader data modul kepegawaian dari Supabase.
// Menghasilkan objek data yang dibaca routes/pages.js.
// Menggunakan cache per-tabel dengan lazy load: hanya tabel yang
// diminta (via argumen getKepData) yang diambil dari Supabase.
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
  'users',
  'sertifikasi',
  'mutasi',
  'jabatan_pegawai',
  'arsip',
  'riwayat_status',
  'surat_kepegawaian'
];

const CACHE_TTL = 60000;

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

// Reverse: key views -> nama tabel.
const VIEW_TO_TABLE = {};
Object.keys(TABLE_KEYS).forEach((t) => {
  VIEW_TO_TABLE[TABLE_KEYS[t]] = t;
});

// Key snake_case -> nama properti yang dipakai views (camelCase).
const RENAME = {
  gaji_berkala: { tmt_lama: 'tmtLama', tmt_berikut: 'tmtBerikut' },
  slks: { masa_kerja: 'masaKerja' },
  pensiun: { tgl_lahir: 'tglLahir' }
};

// Key turunan (bukan tabel).
const LIST_KEYS = ['unitKerja', 'jabatanList', 'pangkatList', 'golonganList', 'jenisPegawaiList', 'jenisCuti'];

const cache = {};

function toView(table, row) {
  const map = RENAME[table] || {};
  const out = {};
  Object.keys(row).forEach((k) => {
    out[map[k] || k] = row[k];
  });
  return out;
}

async function loadTable(name) {
  const key = 'table:' + name;
  const hit = cache[key];
  if (hit && Date.now() - hit.ts <= CACHE_TTL) return hit.data;
  let data = [];
  try {
    data = (await supabase.select(name, { order: 'id.asc' })).map((r) => toView(name, r));
  } catch (err) {
    console.error('KEPDATA load ' + name + ':', err.message);
  }
  cache[key] = { data, ts: Date.now() };
  return data;
}

async function loadReferensi() {
  const key = 'referensi';
  const hit = cache[key];
  if (hit && Date.now() - hit.ts <= CACHE_TTL) return hit.data;
  const rows = await loadTable('referensi');
  const ref = {};
  rows.forEach((r) => {
    if (!ref[r.kategori]) ref[r.kategori] = [];
    ref[r.kategori].push({ id: r.id, kode: r.kode, nama: r.nama, status: r.status });
  });
  cache[key] = { data: ref, ts: Date.now() };
  return ref;
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

function tableFor(key) {
  if (TABLES.indexOf(key) !== -1) return key;
  return VIEW_TO_TABLE[key] || null;
}

function detailPegawai(id, pegawaiRows, extras) {
  const rows = pegawaiRows || [];
  const p = rows.find((x) => Number(x.id) === Number(id)) || rows[0];
  if (!p) return null;
  const ex = extras || {};
  const byPegawai = (t) => (ex[t] || []).filter((x) => Number(x.pegawai_id) === Number(p.id));
  return {
    ...p,
    pendidikan: byPegawai('pendidikan').map((x) => ({
      id: x.id,
      jenjang: x.jenjang,
      jurusan: x.jurusan,
      nama_sekolah: x.nama_sekolah,
      tahun_lulus: x.tahun_lulus,
      ipk: x.ipk,
      keterangan: x.keterangan
    })),
    riwayatPangkat: byPegawai('riwayat_pangkat').map((x) => ({
      id: x.id,
      pangkat: x.pangkat,
      golongan: x.golongan,
      tmt: x.tmt,
      nomor_sk: x.nomor_sk,
      keterangan: x.keterangan
    })),
    riwayatJabatan: byPegawai('jabatan_pegawai').map((x) => ({
      id: x.id,
      jabatan: x.jabatan,
      jenis: x.jenis,
      tmt: x.tmt,
      nomor_sk: x.nomor_sk,
      tanggal_sk: x.tanggal_sk,
      status: x.status,
      keterangan: x.keterangan
    })),
    diklat: byPegawai('diklat_pegawai').map((x) => ({
      id: x.id,
      jenis: x.jenis,
      nama_diklat: x.nama_diklat,
      penyelenggara: x.penyelenggara,
      tahun: x.tahun,
      durasi: x.durasi,
      keterangan: x.keterangan
    })),
    dokumen: byPegawai('arsip').map((x) => ({
      id: x.id,
      kategori: x.kategori,
      nama_dokumen: x.nama_dokumen,
      file: x.file,
      keterangan: x.keterangan
    }))
  };
}

// Tabel pendukung detail pegawai (riwayat yang bisa dikelola pegawai sendiri).
const DETAIL_TABLES = ['pendidikan', 'riwayat_pangkat', 'diklat_pegawai', 'jabatan_pegawai', 'arsip'];

// getKepData(keys): keys = daftar key yang dibutuhkan halaman
// (nama tabel, key views, atau key turunan). Tanpa argumen -> load semua.
async function getKepData(keys) {
  const need = keys && keys.length ? keys : TABLES.slice();
  const want = new Set(need);
  const wantsRef = want.has('referensi') || LIST_KEYS.some((k) => want.has(k));
  const wantsPegawai = want.has('pegawai') || want.has('detailPegawai') || want.has('kartuPegawai');
  const wantsDetail = want.has('detailPegawai');

  const out = {};

  const tables = new Set();
  need.forEach((k) => {
    const t = tableFor(k);
    if (t) tables.add(t);
  });
  if (wantsPegawai) tables.add('pegawai');
  if (wantsDetail) DETAIL_TABLES.forEach((t) => tables.add(t));

  let pegawaiRows = [];
  await Promise.all([...tables].map(async (t) => {
    const rows = await loadTable(t);
    const vk = TABLE_KEYS[t] || t;
    if (want.has(vk) || want.has(t)) out[vk] = rows;
    if (t === 'pegawai') {
      pegawaiRows = rows;
      if (want.has('kartuPegawai')) {
        out.kartuPegawai = rows.slice(0, 10).map((p) => ({ ...p, qr: 'KRP-' + String(p.nip).slice(-6) }));
      }
    }
    if (wantsDetail && DETAIL_TABLES.indexOf(t) !== -1) out['__' + t] = rows;
  }));

  if (wantsDetail) {
    out.detailPegawai = (id) => detailPegawai(id, pegawaiRows, {
      pendidikan: out.__pendidikan,
      riwayat_pangkat: out.__riwayat_pangkat,
      diklat_pegawai: out.__diklat_pegawai,
      jabatan_pegawai: out.__jabatan_pegawai,
      arsip: out.__arsip
    });
  }

  if (wantsRef) {
    const ref = await loadReferensi();
    if (want.has('referensi')) out.referensi = ref;
    const lists = listsFromRef(ref);
    LIST_KEYS.forEach((k) => {
      if (want.has(k)) out[k] = lists[k];
    });
  }

  return out;
}

// Hapus semua cache (dipanggil setelah CRUD agar refresh berikutnya akurat).
function invalidateCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}

module.exports = { getKepData, invalidateCache };
