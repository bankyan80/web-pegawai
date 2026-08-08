const sb = require('../config/supabase');

class Divisi {
  async dataDivisi() {
    return sb.select('divisi');
  }

  async input(data) {
    await sb.insert('divisi', { nama: data[0] });
  }

  async getDivisi(id) {
    const rows = await sb.select('divisi', { eq: { col: 'id', val: id } });
    return rows[0];
  }

  async ubah(data) {
    await sb.update('divisi', data[1], { nama: data[0] });
  }

  async hapus(id) {
    await sb.remove('divisi', id);
  }
}

module.exports = Divisi;
