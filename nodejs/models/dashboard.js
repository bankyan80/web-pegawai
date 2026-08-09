// Data dashboard personal pegawai (single page mobile).
// Semua query DB dibatasi per pegawai yang login (server-side).
// Pegawai diidentifikasi lewat pegawai_id/nip/nik dari session, bukan input client.
const supabase = require('../config/supabase');

const BULAN_INDO = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function segJenis(j) {
  const s = String(j || '');
  if (/paruh waktu/i.test(s)) return 'PPPK Paruh Waktu';
  if (/pppk/i.test(s)) return 'PPPK';
  if (/^pns$/i.test(s.trim())) return 'PNS';
  return 'Non-ASN';
}

function isPppk(j) {
  return /pppk/i.test(String(j || ''));
}

function isPppkParuhWaktu(j) {
  return /paruh waktu/i.test(String(j || ''));
}

// ---------- Derivation Periode PPPK (sama dengan halaman Periode PPPK) ----------
function pppkToday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function pppkMasaTahun(jenis) {
  return /paruh waktu/i.test(String(jenis || '')) ? 1 : 5;
}

function pppkValidTmt(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '').trim());
}

function pppkPeriodeKe(tmt, masa, today) {
  if (!pppkValidTmt(tmt)) return null;
  const m = String(tmt).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const base = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  let ke = 1;
  for (;;) {
    const s = new Date(base);
    s.setUTCFullYear(s.getUTCFullYear() + (ke - 1) * masa);
    const startDate = new Date(s.toISOString().slice(0, 10) + 'T00:00:00');
    if (startDate > today) break;
    const e = new Date(base);
    e.setUTCFullYear(e.getUTCFullYear() + ke * masa);
    const endDate = new Date(e.toISOString().slice(0, 10) + 'T00:00:00');
    if (today <= endDate) return ke;
    ke++;
    if (ke > 500) return ke;
  }
  return ke;
}

function pppkPeriodeRentang(tmt, masa, today) {
  if (!pppkValidTmt(tmt)) return null;
  const m = String(tmt).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const base = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  let ke = 1;
  for (;;) {
    const s = new Date(base);
    s.setUTCFullYear(s.getUTCFullYear() + (ke - 1) * masa);
    const e = new Date(base);
    e.setUTCFullYear(e.getUTCFullYear() + ke * masa);
    const endDate = new Date(e.toISOString().slice(0, 10) + 'T00:00:00');
    if (today <= endDate) {
      return { mulai: s.toISOString().slice(0, 10), akhir: e.toISOString().slice(0, 10) };
    }
    ke++;
    if (ke > 500) return { mulai: s.toISOString().slice(0, 10), akhir: e.toISOString().slice(0, 10) };
  }
}

function buildPeriodePppk(pegawai) {
  if (!isPppk(pegawai.jenis)) return null;
  const today = pppkToday();
  const masa = pppkMasaTahun(pegawai.jenis);
  const tmt = pppkValidTmt(pegawai.tmt) ? String(pegawai.tmt).slice(0, 10) : '';
  let tanggalMulai = tmt;
  let tanggalBerakhir = '';
  let sisa = null;
  let status = 'BELUM LENGKAP';
  let periodeKe = null;
  if (tmt) {
    const rentang = pppkPeriodeRentang(tmt, masa, today);
    if (rentang) {
      tanggalMulai = rentang.mulai;
      tanggalBerakhir = rentang.akhir;
    }
    periodeKe = pppkPeriodeKe(tmt, masa, today);
    const md = new Date(tmt + 'T00:00:00');
    const bd = new Date(tanggalBerakhir + 'T00:00:00');
    sisa = Math.floor((bd - today) / 86400000);
    if (bd < today) status = 'BERAKHIR';
    else if (md > today) status = 'BELUM AKTIF';
    else if (sisa <= 90) status = 'SEGERA BERAKHIR';
    else status = 'AKTIF';
  }
  return {
    statusKepegawaian: isPppkParuhWaktu(pegawai.jenis) ? 'PPPK Paruh Waktu' : 'PPPK',
    masaTahun: masa,
    masaLabel: masa + ' Tahun',
    periodeKe,
    tmt,
    tanggalMulai,
    tanggalBerakhir,
    sisa,
    status
  };
}

// ---------- BUP / Pensiun ----------
function parseTgl(v) {
  const s = String(v || '').trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return null;
}

function formatTgl(date) {
  if (!date) return '';
  return String(date.getDate()).padStart(2, '0') + ' ' + BULAN_INDO[date.getMonth()] + ' ' + date.getFullYear();
}

function buildBup(pegawai) {
  const lahir = parseTgl(pegawai.ttl);
  const jenis = String(pegawai.jenis || '');
  const isPns = /^pns$/i.test(jenis.trim());
  const usiaBup = isPns ? 58 : isPppk(jenis) ? 60 : null;
  let bupDate = null;
  if (lahir && usiaBup) {
    bupDate = new Date(lahir.getFullYear() + usiaBup, lahir.getMonth(), lahir.getDate());
  }
  const now = new Date();
  let sisaHari = null;
  let status = '';
  if (bupDate) {
    sisaHari = Math.floor((bupDate - now) / 86400000);
    status = sisaHari < 0 ? 'BUP Terlampaui' : sisaHari <= 730 ? 'Mendekati BUP' : 'Masih Jauh';
  } else if (jenis) {
    status = 'Tidak Ada BUP';
  }
  return {
    tglLahir: pegawai.ttl || '',
    jenis,
    usiaBup,
    bup: bupDate ? bupDate.toISOString().slice(0, 10) : '',
    perkiraan: bupDate ? bupDate.getFullYear() : '',
    sisaHari,
    status
  };
}

// ---------- Indikator KGB ----------
function kgbIndikator(tmtBerikut) {
  const m = String(tmtBerikut || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  const now = new Date();
  const months = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
  if (months <= 3) return 'Jatuh Tempo';
  if (months <= 12) return 'Mendekati';
  return 'Masih Jauh';
}

// Query tabel service dengan scope per pegawai.
async function selScoped(table, opts) {
  try {
    return await supabase.select(table, opts);
  } catch (err) {
    console.error('DASHBOARD load ' + table + ':', err.message);
    return [];
  }
}

// Query tabel yang direlasikan lewat nip/nama (legacy) dengan scope per pegawai.
// Dipisah per kolom (bukan or()) karena nama dapat mengandung koma.
async function selByName(tab, nip, nama) {
  const jobs = [];
  if (nip) jobs.push(selScoped(tab, { filters: ['nip=eq.' + encodeURIComponent(nip)] }));
  if (nama) jobs.push(selScoped(tab, { filters: ['nama=eq.' + encodeURIComponent(nama)] }));
  const results = await Promise.all(jobs);
  const seen = new Set();
  const out = [];
  results.forEach((rows) => {
    rows.forEach((r) => {
      if (seen.has(r.id)) return;
      seen.add(r.id);
      out.push(r);
    });
  });
  return out;
}

// Ambil seluruh data personal milik satu pegawai.
// 'member' adalah sesi login (role staff/pegawai).
// Data dipecah: 'base' (ringan, dimuat saat halaman tampil) dan per-Card
// yang dimuat malas (lazy load) agar dashboard mobile tampil cepat tanpa
// mengulang query yang tidak diperlukan.
// Hasil di-cache per pegawai (TTL pendek) agar kunjungan berulang pada
// instance hangat tidak mengulang query Supabase.
const CACHE_TTL = 60000;
const cache = {};

function cacheGet(key) {
  const hit = cache[key];
  if (hit && Date.now() - hit.ts <= CACHE_TTL) return hit.data;
  return undefined;
}

function cacheSet(key, data) {
  cache[key] = { data, ts: Date.now() };
}

function buildPresensiRange(pegawai) {
  const curYear = new Date().getFullYear();
  const pppk = buildPeriodePppk(pegawai);
  let endYear = curYear;
  if (pppk && pppk.tanggalBerakhir) {
    const y = parseInt(String(pppk.tanggalBerakhir).slice(0, 4), 10);
    if (y) endYear = y;
  }
  const startYear = Math.min(curYear, endYear);
  return { startYear, endYear };
}

async function resolvePegawai(member) {
  const username = String((member && member.username) || '').trim();
  const pid = member && member.pegawai_id;

  let pegawai = null;
  if (pid) {
    const rows = await supabase.select('pegawai', { eq: { col: 'id', val: pid } }).catch(() => []);
    pegawai = rows[0];
  }
  if (!pegawai && username) {
    const u = encodeURIComponent(username);
    const rows = await supabase
      .select('pegawai', { filters: ['or=(nip.eq.' + u + ',nik.eq.' + u + ')'] })
      .catch(() => []);
    pegawai = rows[0];
  }
  return pegawai || null;
}

function buildBase(pegawai) {
  const id = pegawai.id;
  const nama = String(pegawai.nama || '');
  const nip = String(pegawai.nip || '');
  const status = segJenis(pegawai.jenis);
  const unit = pegawai.unit || pegawai.sekolah || '';

  return {
    found: true,
    pegawai_id: id,
    header: {
      nama,
      nip,
      nik: pegawai.nik || '',
      jenis: pegawai.jenis || '',
      status,
      jabatan: pegawai.jabatan || '',
      unit,
      foto: pegawai.foto || ''
    },
    identitas: {
      status,
      jabatan: pegawai.jabatan || '',
      unit,
      nuptk: pegawai.nuptk || ''
    },
    profil: {
      nama,
      nip,
      nik: pegawai.nik || '',
      nuptk: pegawai.nuptk || '',
      ttl: pegawai.ttl || '',
      jk: pegawai.jk || '',
      alamat: pegawai.alamat || '',
      hp: pegawai.hp || '',
      email: pegawai.email || '',
      status,
      jabatan: pegawai.jabatan || '',
      pangkat: pegawai.pangkat || '',
      golongan: pegawai.golongan || '',
      tmt: pegawai.tmt || '',
      sekolah: unit,
      unitKerja: pegawai.unit || '',
      pendidikan: pegawai.pendidikan || '',
      jurusan: pegawai.jurusan || '',
      tahunLulus: pegawai.tahun_lulus || ''
    },
    statusKepegawaian: {
      status,
      nomorIdentitas: nip,
      tmt: pegawai.tmt || '',
      jabatan: pegawai.jabatan || '',
      unit
    },
    periodePppk: buildPeriodePppk(pegawai),
    presensiRange: buildPresensiRange(pegawai)
  };
}

// Muat satu bagian data yang dimuat malas (lazy). Mengembalikan null untuk
// bagian yang tidak dikenal.
async function loadPart(part, pegawai) {
  const id = pegawai.id;
  const nama = String(pegawai.nama || '');
  const nip = String(pegawai.nip || '');

  switch (part) {
    case 'pangkat': {
      const rows = nip ? await selScoped('kepangkatan', { filters: ['nip=eq.' + encodeURIComponent(nip)] }) : [];
      return {
        pangkat: pegawai.pangkat || '',
        golongan: pegawai.golongan || '',
        tmt: pegawai.tmt || '',
        riwayat: rows.map((r) => ({
          lama: r.lama || '',
          baru: r.baru || '',
          tmt: r.tmt || '',
          status: r.status || ''
        }))
      };
    }
    case 'kgb': {
      const rows = nip ? await selScoped('gaji_berkala', { filters: ['nip=eq.' + encodeURIComponent(nip)] }) : [];
      return rows.map((r) => ({
        gaji: r.gaji || '',
        pangkat: r.pangkat || '',
        tmtLama: r.tmt_lama || '',
        tmtBerikut: r.tmt_berikut || '',
        status: r.status || '',
        indikator: kgbIndikator(r.tmt_berikut)
      }));
    }
    case 'cuti': {
      const rows = nama ? await selScoped('cuti', { filters: ['pemohon=eq.' + encodeURIComponent(nama)] }) : [];
      return rows.map((r) => ({
        id: r.id,
        pemohon: r.pemohon || '',
        jenis: r.jenis || '',
        mulai: r.mulai || '',
        selesai: r.selesai || '',
        lama: r.lama || '',
        status: r.status || ''
      }));
    }
    case 'mutasi': {
      const rows = await selScoped('mutasi', { eq: { col: 'pegawai_id', val: id } });
      return rows.map((r) => ({
        id: r.id,
        jenis: r.jenis || '',
        asal: r.asal || '',
        tujuan: r.tujuan || '',
        tanggal: r.tanggal || '',
        nomorSk: r.nomor_sk || '',
        status: r.status || '',
        keterangan: r.keterangan || '',
        dokumen: r.dokumen || ''
      }));
    }
    case 'jabatan': {
      const rows = await selScoped('jabatan_pegawai', { eq: { col: 'pegawai_id', val: id } });
      return rows.map((r) => ({
        id: r.id,
        jabatan: r.jabatan || '',
        jenis: r.jenis || '',
        tmt: r.tmt || '',
        nomorSk: r.nomor_sk || '',
        tanggalSk: r.tanggal_sk || '',
        status: r.status || '',
        keterangan: r.keterangan || ''
      }));
    }
    case 'sertifikasi': {
      const rows = await selScoped('sertifikasi', { eq: { col: 'pegawai_id', val: id } });
      return rows.map((r) => ({
        id: r.id,
        nama: r.nama_sertifikasi || '',
        nomor: r.nomor || '',
        bidang: r.bidang || '',
        tahun: r.tahun || '',
        status: r.status || '',
        tunjangan: r.tunjangan || '',
        statusBayar: r.status_bayar || '',
        keterangan: r.keterangan || ''
      }));
    }
    case 'arsip': {
      const rows = await selScoped('arsip', { eq: { col: 'pegawai_id', val: id } });
      return rows.map((r) => ({
        id: r.id,
        kategori: r.kategori || '',
        nama_dokumen: r.nama_dokumen || '',
        file: r.file || '',
        keterangan: r.keterangan || '',
        created_at: r.created_at || ''
      }));
    }
    case 'surat': {
      const rows = await selScoped('surat_kepegawaian', { eq: { col: 'pegawai_id', val: id } });
      return rows.map((r) => ({
        id: r.id,
        jenis: r.jenis || '',
        nomor: r.nomor || '',
        tanggal: r.tanggal || '',
        perihal: r.perihal || '',
        isi: r.isi || '',
        status: r.status || ''
      }));
    }
    case 'presensi': {
      const rows = await selByName('presensi', nip, nama);
      return rows.map((r) => ({
        id: r.id,
        nama: r.nama || '',
        nip: r.nip || '',
        tahun: r.tahun || '',
        bulan: r.bulan || '',
        file: r.file || '',
        keterangan: r.keterangan || ''
      }));
    }
    case 'bup': {
      const rows = await selByName('pensiun', nip, nama);
      return Object.assign(buildBup(pegawai), {
        riwayat: rows.map((r) => ({
          bup: r.bup || '',
          perkiraan: r.perkiraan || '',
          status: r.status || ''
        }))
      });
    }
    default:
      return null;
  }
}

async function getBase(member) {
  const pegawai = await resolvePegawai(member);
  if (!pegawai) return { found: false };

  const key = 'b' + pegawai.id;
  const hit = cacheGet(key);
  if (hit) return hit;

  const data = buildBase(pegawai);
  cacheSet(key, data);
  return data;
}

async function getPart(member, part) {
  const pegawai = await resolvePegawai(member);
  if (!pegawai) return { found: false };

  const key = 'p' + pegawai.id + ':' + part;
  const hit = cacheGet(key);
  if (hit !== undefined) return hit;

  const data = await loadPart(part, pegawai);
  if (data === null) return null;
  cacheSet(key, data);
  return data;
}

function invalidateCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}

module.exports = { getBase, getPart, invalidateCache, resolvePegawai, segJenis, formatTgl };
