const sb = require('../config/supabase');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class Login {
  async otentikasi(username, password) {
    const rows = await sb.select('member', { filters: ['username=eq.' + encodeURIComponent(username)] });
    const rs = rows[0];
    if (rs) {
      // Check bcrypt hash (async)
      if (rs.passwors.startsWith('$2')) {
        try {
          const bcryptMatch = await bcrypt.compare(password, rs.passwors);
          if (bcryptMatch) {
            return rs;
          }
        } catch (err) {
          console.error('Bcrypt compare error:', err.message);
        }
      }
      
      // Fallback: Check SHA1 hash (legacy)
      const sha1Hash = crypto.createHash('sha1').update(password).digest('hex');
      if (sha1Hash === rs.passwors) {
        await this.gantiPassword(rs.id, password);
        return rs;
      }
      
      return null;
    }
    return this.otentikasiPegawai(username, password);
  }

  // Login pegawai: username = NIP atau NIK, password = 6 digit terakhir NIP/NIK.
  async otentikasiPegawai(username, password) {
    const u = String(username || '').trim();
    if (!/^[0-9]{6,}$/.test(u)) return null;
    const rows = await sb.select('pegawai', {
      filters: ['or=(nip.eq.' + u + ',nik.eq.' + u + ')']
    });
    const p = rows[0];
    if (!p) return null;
    const expected = u === String(p.nip) ? String(p.nip).slice(-6) : String(p.nik).slice(-6);
    if (!expected || password !== expected) return null;
    return {
      id: p.id,
      fullname: p.nama,
      username: String(p.nip || u),
      role: 'staff',
      email: p.email || '',
      foto: p.foto || '',
      unit: p.sekolah || p.unit || '',
      pegawai_id: p.id,
      loginAs: 'pegawai'
    };
  }

  async gantiPassword(id, password) {
    await sb.update('member', id, { passwors: bcrypt.hashSync(password, 10) });
  }

  async dataUser() {
    return sb.select('member');
  }

  async getUser(id) {
    const rows = await sb.select('member', { eq: { col: 'id', val: id } });
    return rows[0];
  }

  async simpan(data) {
    const row = {
      fullname: data[0],
      username: data[1],
      passwors: bcrypt.hashSync(data[2], 10),
      role: data[3],
      email: data[4],
      foto: data[5]
    };
    await sb.insert('member', row);
  }

  async ubah(data, id) {
    if (!data[2]) {
      await sb.update('member', id, {
        fullname: data[0],
        username: data[1],
        role: data[3],
        email: data[4],
        foto: data[5]
      });
    } else {
      await sb.update('member', id, {
        fullname: data[0],
        username: data[1],
        passwors: bcrypt.hashSync(data[2], 10),
        role: data[3],
        email: data[4],
        foto: data[5]
      });
    }
  }

  async hapus(id) {
    await sb.remove('member', id);
  }

  async terlampauiBatas(username, ip) {
    const rows = await sb.select('login_attempt', {
      filters: [
        'username=eq.' + encodeURIComponent(username),
        'ip=eq.' + encodeURIComponent(ip)
      ]
    });
    const cutoff = Date.now() - 15 * 60 * 1000;
    const withinWindow = rows.filter((r) => new Date(r.attempted_at).getTime() >= cutoff);
    return withinWindow.length >= 5;
  }

  async catatPercobaan(username, ip) {
    await sb.insert('login_attempt', {
      username,
      ip,
      attempted_at: new Date().toISOString()
    });
  }

  async hapusPercobaan(username) {
    await sb.removeWhere('login_attempt', ['username=eq.' + encodeURIComponent(username)]);
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
