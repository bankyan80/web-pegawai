const pool = require('../config/db');

class Gaji {
  async dataGaji() {
    const [rows] = await pool.query(
      `SELECT g.*, p.nama, p.nip, d.nama as divisi, j.nama as jabatan
       FROM gaji g
       INNER JOIN pegawai p ON p.id = g.pegawai_id
       INNER JOIN divisi d ON d.id = p.iddivisi
       INNER JOIN jabatan j ON j.id = p.idjabatan`
    );
    return rows;
  }

  async simpan(data) {
    const sql = 'INSERT INTO gaji(pegawai_id,gapok,tunjab,bpjs,lain2) VALUES (?,?,?,?,?)';
    await pool.query(sql, data);
  }

  async getGaji(id) {
    const [rows] = await pool.query(
      `SELECT g.*, p.nip, p.nama, p.foto, d.nama as divisi, j.nama as jabatan
       FROM gaji g
       INNER JOIN pegawai p ON p.id = g.pegawai_id
       INNER JOIN divisi d ON d.id = p.iddivisi
       INNER JOIN jabatan j ON j.id = p.idjabatan
       WHERE g.id = ?`,
      [id]
    );
    return rows[0];
  }

  async dataBelumDigaji() {
    const [rows] = await pool.query(
      `SELECT pegawai.id as idp, pegawai.nama
       FROM pegawai
       LEFT JOIN gaji ON pegawai.id = gaji.pegawai_id
       WHERE gaji.pegawai_id IS NULL`
    );
    return rows;
  }

  async ubah(data) {
    const sql = 'UPDATE gaji SET gapok=?,tunjab=?,bpjs=?,lain2=? WHERE id=?';
    await pool.query(sql, data);
  }

  async hapus(id) {
    const sql = 'DELETE FROM gaji WHERE id=?';
    await pool.query(sql, [id]);
  }
}

module.exports = Gaji;
