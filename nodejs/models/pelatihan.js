const pool = require('../config/db');

class Pelatihan {
  async dataPelatihan() {
    const [rows] = await pool.query(
      `SELECT pel.*, peg.nama, d.nama as divisi, j.nama as jabatan, m.nama as materi
       from pelatihan pel
       inner join pegawai peg on peg.id = pel.pegawai_id
       inner join divisi d on d.id = peg.iddivisi
       inner join jabatan j on j.id = peg.idjabatan
       inner join materi m on m.id = pel.materi_id`
    );
    return rows;
  }

  async getPelatihan(id) {
    const [rows] = await pool.query(
      `SELECT pel.*, peg.nama, d.nama as divisi, j.nama as jabatan, m.nama as materi
       from pelatihan pel
       inner join pegawai peg on peg.id = pel.pegawai_id
       inner join divisi d on d.id = peg.iddivisi
       inner join jabatan j on j.id = peg.idjabatan
       inner join materi m on m.id = pel.materi_id
       WHERE pel.id = ?`,
      [id]
    );
    return rows[0];
  }

  async simpan(data) {
    const sql =
      'INSERT INTO pelatihan(pegawai_id,materi_id,tgl_mulai,tgl_akhir,keterangan) VALUES (?,?,?,?,?)';
    await pool.query(sql, data);
  }

  async ubah(data) {
    const sql =
      'UPDATE pelatihan SET pegawai_id=?,materi_id=?,tgl_mulai=?,tgl_akhir=?,keterangan=? WHERE id=?';
    await pool.query(sql, data);
  }

  async hapus(id) {
    const sql = 'DELETE FROM pelatihan WHERE id=?';
    await pool.query(sql, [id]);
  }
}

module.exports = Pelatihan;
