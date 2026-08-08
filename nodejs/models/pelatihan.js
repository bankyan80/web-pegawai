const sb = require('../config/supabase');

async function semuaRelasi() {
  const [pel, peg, divisi, jabatan, materi] = await Promise.all([
    sb.select('pelatihan'),
    sb.select('pegawai_legacy'),
    sb.select('divisi'),
    sb.select('jabatan'),
    sb.select('materi')
  ]);
  const pMap = {};
  const jMap = {};
  const dMap = {};
  const mMap = {};
  peg.forEach((p) => {
    pMap[p.id] = p;
  });
  jabatan.forEach((j) => {
    jMap[j.id] = j.nama;
  });
  divisi.forEach((d) => {
    dMap[d.id] = d.nama;
  });
  materi.forEach((m) => {
    mMap[m.id] = m.nama;
  });
  return pel.map((x) => {
    const p = pMap[x.pegawai_id] || {};
    return {
      ...x,
      nama: p.nama || '',
      divisi: dMap[p.iddivisi] || '',
      jabatan: jMap[p.idjabatan] || '',
      materi: mMap[x.materi_id] || ''
    };
  });
}

class Pelatihan {
  async dataPelatihan() {
    return semuaRelasi();
  }

  async getPelatihan(id) {
    const rows = await sb.select('pelatihan', { eq: { col: 'id', val: id } });
    const x = rows[0];
    if (!x) return undefined;
    const list = await semuaRelasi();
    return list.find((r) => r.id === x.id);
  }

  async simpan(data) {
    const row = {
      pegawai_id: data[0] || null,
      materi_id: data[1] || null,
      tgl_mulai: data[2] || '',
      tgl_akhir: data[3] || '',
      keterangan: data[4] || ''
    };
    await sb.insert('pelatihan', row);
  }

  async ubah(data) {
    const id = data[5];
    const row = {
      pegawai_id: data[0] || null,
      materi_id: data[1] || null,
      tgl_mulai: data[2] || '',
      tgl_akhir: data[3] || '',
      keterangan: data[4] || ''
    };
    await sb.update('pelatihan', id, row);
  }

  async hapus(id) {
    await sb.remove('pelatihan', id);
  }
}

module.exports = Pelatihan;
