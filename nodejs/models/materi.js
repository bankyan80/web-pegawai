const pool = require('../config/db');

class Materi {
  async dataMateri() {
    const [rows] = await pool.query('select * from materi');
    return rows;
  }

  async getMateri(id) {
    const [rows] = await pool.query('select * from materi where id=?', [id]);
    return rows[0];
  }

  async ubah(data) {
    const sql = 'update materi set nama=? where id=?';
    await pool.query(sql, data);
  }

  async hapus(id) {
    const sql = 'delete from materi where id=?';
    await pool.query(sql, [id]);
  }

  async input(data) {
    const sql = 'insert into materi (nama) values (?)';
    await pool.query(sql, data);
  }
}

module.exports = Materi;
