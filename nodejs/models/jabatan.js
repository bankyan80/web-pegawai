const pool = require('../config/db');

class Jabatan {
  async dataJabatan() {
    const [rows] = await pool.query('select * from jabatan');
    return rows;
  }

  async input(data) {
    const sql = 'INSERT INTO jabatan (nama) values (?)';
    await pool.query(sql, data);
  }

  async getJabatan(id) {
    const [rows] = await pool.query('select * from jabatan where id=?', [id]);
    return rows[0];
  }

  async ubah(data) {
    const sql = 'update jabatan set nama=? where id=?';
    await pool.query(sql, data);
  }

  async hapus(id) {
    const sql = 'delete from jabatan where id=?';
    await pool.query(sql, [id]);
  }
}

module.exports = Jabatan;
