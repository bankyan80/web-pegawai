const sb = require('../config/supabase');

async function semuaRelasi() {
  const [gaji, peg, divisi, jabatan] = await Promise.all([
    sb.select('gaji'),
    sb.select('pegawai_legacy'),
    sb.select('divisi'),
    sb.select('jabatan')
  ]);
  const pMap = {};
  const jMap = {};
  const dMap = {};
  peg.forEach((p) => {
    pMap[p.id] = p;
  });
  jabatan.forEach((j) => {
    jMap[j.id] = j.nama;
  });
  divisi.forEach((d) => {
    dMap[d.id] = d.nama;
  });
  return gaji.map((g) => {
    const p = pMap[g.pegawai_id] || {};
    return {
      ...g,
      nama: p.nama || '',
      nip: p.nip || '',
      foto: p.foto || '',
      divisi: dMap[p.iddivisi] || '',
      jabatan: jMap[p.idjabatan] || ''
    };
  });
}

class Gaji {
  async dataGaji() {
    return semuaRelasi();
  }

  async simpan(data) {
    const row = {
      pegawai_id: data[0] || null,
      gapok: data[1] || 0,
      tunjab: data[2] || 0,
      bpjs: data[3] || 0,
      lain2: data[4] || 0
    };
    await sb.insert('gaji', row);
  }

  async getGaji(id) {
    const rows = await sb.select('gaji', { eq: { col: 'id', val: id } });
    const g = rows[0];
    if (!g) return undefined;
    const list = await semuaRelasi();
    return list.find((x) => x.id === g.id);
  }

  async dataBelumDigaji() {
    const [peg, gaji] = await Promise.all([sb.select('pegawai_legacy'), sb.select('gaji')]);
    const sudah = new Set(gaji.map((g) => String(g.pegawai_id)));
    return peg.filter((p) => !sudah.has(String(p.id))).map((p) => ({ idp: p.id, nama: p.nama }));
  }

  async ubah(data) {
    const id = data[4];
    const row = {
      gapok: data[0] || 0,
      tunjab: data[1] || 0,
      bpjs: data[2] || 0,
      lain2: data[3] || 0
    };
    await sb.update('gaji', id, row);
  }

  async hapus(id) {
    await sb.remove('gaji', id);
  }
}

module.exports = Gaji;
