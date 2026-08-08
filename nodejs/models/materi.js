const sb = require('../config/supabase');

class Materi {
  async dataMateri() {
    return sb.select('materi');
  }

  async getMateri(id) {
    const rows = await sb.select('materi', { eq: { col: 'id', val: id } });
    return rows[0];
  }

  async ubah(data) {
    await sb.update('materi', data[1], { nama: data[0] });
  }

  async hapus(id) {
    await sb.remove('materi', id);
  }

  async input(data) {
    await sb.insert('materi', { nama: data[0] });
  }
}

module.exports = Materi;
