const sb = require('../config/supabase');

const TABLE = 'pegawai_legacy';

async function semuaRelasi() {
  const [peg, jabatan, divisi] = await Promise.all([
    sb.select(TABLE),
    sb.select('jabatan'),
    sb.select('divisi')
  ]);
  const jMap = {};
  const dMap = {};
  jabatan.forEach((j) => {
    jMap[j.id] = j.nama;
  });
  divisi.forEach((d) => {
    dMap[d.id] = d.nama;
  });
  return peg.map((p) => ({
    ...p,
    jabatan: jMap[p.idjabatan] || '',
    divisi: dMap[p.iddivisi] || ''
  }));
}

class Pegawai {
  async dataPegawai() {
    return semuaRelasi();
  }

  async simpan(data) {
    const row = {
      nip: data[0],
      nama: data[1],
      gender: data[2],
      tempat_lahir: data[3],
      tanggal_lahir: data[4],
      idjabatan: data[5] || null,
      iddivisi: data[6] || null,
      alamat: data[7],
      email: data[8],
      foto: data[9]
    };
    await sb.insert(TABLE, row);
  }

  async detailPegawai(id) {
    const rows = await sb.select(TABLE, { eq: { col: 'id', val: id } });
    const p = rows[0];
    if (!p) return undefined;
    const list = await semuaRelasi();
    return list.find((x) => x.id === p.id);
  }

  async ubah(data) {
    const id = data[10];
    const row = {
      nip: data[0],
      nama: data[1],
      gender: data[2],
      tempat_lahir: data[3],
      tanggal_lahir: data[4],
      idjabatan: data[5] || null,
      iddivisi: data[6] || null,
      alamat: data[7],
      email: data[8],
      foto: data[9]
    };
    await sb.update(TABLE, id, row);
  }

  async hapus(id) {
    await sb.remove(TABLE, id);
  }

  async cariPegawai(nama) {
    const rows = await sb.select(TABLE, {
      filters: ['nama=ilike.' + encodeURIComponent('%' + nama + '%')]
    });
    const list = await semuaRelasi();
    const ids = new Set(rows.map((r) => r.id));
    return list.filter((x) => ids.has(x.id));
  }

  async filterDivisi(id) {
    const rows = await sb.select(TABLE, { eq: { col: 'iddivisi', val: id } });
    const list = await semuaRelasi();
    const ids = new Set(rows.map((r) => r.id));
    return list.filter((x) => ids.has(x.id));
  }

  async filterJabatan(id) {
    const rows = await sb.select(TABLE, { eq: { col: 'idjabatan', val: id } });
    const list = await semuaRelasi();
    const ids = new Set(rows.map((r) => r.id));
    return list.filter((x) => ids.has(x.id));
  }
}

module.exports = Pegawai;
