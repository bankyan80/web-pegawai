const sb = require('../config/supabase');

class Jabatan {
  async dataJabatan() {
    return sb.select('jabatan');
  }

  async input(data) {
    await sb.insert('jabatan', { nama: data[0] });
  }

  async getJabatan(id) {
    const rows = await sb.select('jabatan', { eq: { col: 'id', val: id } });
    return rows[0];
  }

  async ubah(data) {
    await sb.update('jabatan', data[1], { nama: data[0] });
  }

  async hapus(id) {
    await sb.remove('jabatan', id);
  }
}

module.exports = Jabatan;
