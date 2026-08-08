const pool = require('../config/db');

class Divisi {
  async dataDivisi() {
    const [rows] = await pool.query('select * from divisi');
    return rows;
  }

  async input(data) {
    const sql = 'insert into divisi (nama) values (?)';
    await pool.query(sql, data);
  }

  async getDivisi(id) {
    const [rows] = await pool.query('select * from divisi where id=?', [id]);
    return rows[0];
  }

  async ubah(data) {
    const sql = 'update divisi set nama=? where id=?';
    await pool.query(sql, data);
  }

  async hapus(id) {
    const sql = 'delete from divisi where id=?';
    await pool.query(sql, [id]);
  }
}

module.exports = Divisi;
