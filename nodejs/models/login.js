const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class Login {
  async otentikasi(username, password) {
    const [rows] = await pool.query('SELECT * FROM member WHERE username=?', [username]);
    const rs = rows[0];
    if (!rs) {
      return null;
    }
    const sha1Hash = crypto.createHash('sha1').update(password).digest('hex');
    const bcryptMatch = rs.passwors.startsWith('$2') && bcryptCompare(password, rs.passwors);
    if (bcryptMatch) {
      return rs;
    }
    if (sha1Hash === rs.passwors) {
      await this.gantiPassword(rs.id, password);
      return rs;
    }
    return null;
  }

  async gantiPassword(id, password) {
    const sql = 'UPDATE member SET passwors=? WHERE id=?';
    await pool.query(sql, [bcrypt.hashSync(password, 10), id]);
  }

  async dataUser() {
    const [rows] = await pool.query('select * from member');
    return rows;
  }

  async getUser(id) {
    const [rows] = await pool.query('select * from member where id=?', [id]);
    return rows[0];
  }

  async simpan(data) {
    const sql =
      'INSERT INTO member(fullname,username,passwors,role,email,foto) VALUES (?,?,?,?,?,?)';
    const values = [data[0], data[1], bcrypt.hashSync(data[2], 10), data[3], data[4], data[5]];
    await pool.query(sql, values);
  }

  async ubah(data, id) {
    if (!data[2]) {
      const sql = 'update member set fullname=?, username=?, role=?, email=?, foto=? where id=?';
      await pool.query(sql, [data[0], data[1], data[3], data[4], data[5], id]);
    } else {
      const sql =
        'update member set fullname=?, username=?, passwors=?, role=?, email=?, foto=? where id=?';
      await pool.query(sql, [
        data[0],
        data[1],
        bcrypt.hashSync(data[2], 10),
        data[3],
        data[4],
        data[5],
        id
      ]);
    }
  }

  async hapus(id) {
    const sql = 'delete from member where id=?';
    await pool.query(sql, [id]);
  }

  async terlampauiBatas(username, ip) {
    const sql = `SELECT COUNT(*) as total FROM login_attempt
                 WHERE username=? AND ip=?
                 AND attempted_at > datetime('now','localtime','-15 minutes')`;
    const [rows] = await pool.query(sql, [username, ip]);
    return parseInt(rows[0].total, 10) >= 5;
  }

  async catatPercobaan(username, ip) {
    const sql = "INSERT INTO login_attempt(username, ip, attempted_at) VALUES (?,?,datetime('now','localtime'))";
    await pool.query(sql, [username, ip]);
  }

  async hapusPercobaan(username) {
    const sql = 'DELETE FROM login_attempt WHERE username=?';
    await pool.query(sql, [username]);
  }
}

function bcryptCompare(password, hash) {
  try {
    return bcrypt.compareSync(password, hash);
  } catch (e) {
    return false;
  }
}

module.exports = Login;
