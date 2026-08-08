const pool = require('../config/db');

class Pegawai {
  async dataPegawai() {
    const [rows] = await pool.query(
      `SELECT p.*, j.nama as jabatan, d.nama as divisi
       FROM pegawai p
       inner join jabatan j on j.id = p.idjabatan
       inner join divisi d on d.id = p.iddivisi`
    );
    return rows;
  }

  async simpan(data) {
    const sql =
      'INSERT INTO pegawai(nip,nama,gender,tempat_lahir,tanggal_lahir,idjabatan,iddivisi,alamat,email,foto) VALUES (?,?,?,?,?,?,?,?,?,?)';
    await pool.query(sql, data);
  }

  async detailPegawai(id) {
    const [rows] = await pool.query(
      `SELECT p.*, j.nama as jabatan, d.nama as divisi
       FROM pegawai p
       inner join jabatan j on j.id = p.idjabatan
       inner join divisi d on d.id = p.iddivisi
       WHERE p.id = ?`,
      [id]
    );
    return rows[0];
  }

  async ubah(data) {
    const sql =
      'UPDATE pegawai SET nip=?,nama=?,gender=?,tempat_lahir=?,tanggal_lahir=?,idjabatan=?,iddivisi=?,alamat=?,email=?,foto=? WHERE id=?';
    await pool.query(sql, data);
  }

  async hapus(id) {
    const sql = 'DELETE FROM pegawai WHERE id=?';
    await pool.query(sql, [id]);
  }

  async cariPegawai(nama) {
    const [rows] = await pool.query(
      `SELECT p.*, j.nama as jabatan, d.nama as divisi
       FROM pegawai p
       inner join jabatan j on j.id = p.idjabatan
       inner join divisi d on d.id = p.iddivisi
       WHERE p.nama LIKE ?`,
      ['%' + nama + '%']
    );
    return rows;
  }

  async filterDivisi(id) {
    const [rows] = await pool.query(
      `SELECT p.*, j.nama as jabatan, d.nama as divisi
       FROM pegawai p
       inner join jabatan j on j.id = p.idjabatan
       inner join divisi d on d.id = p.iddivisi
       WHERE p.iddivisi = ?`,
      [id]
    );
    return rows;
  }

  async filterJabatan(id) {
    const [rows] = await pool.query(
      `SELECT p.*, j.nama as jabatan, d.nama as divisi
       FROM pegawai p
       inner join jabatan j on j.id = p.idjabatan
       inner join divisi d on d.id = p.iddivisi
       WHERE p.idjabatan = ?`,
      [id]
    );
    return rows;
  }
}

module.exports = Pegawai;
