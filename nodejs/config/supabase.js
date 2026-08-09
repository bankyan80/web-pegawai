// Adapter Supabase ringan menggunakan fetch (Node 22+).
// Dipakai di server untuk semua akses database & storage.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dkixmotzmmioupclqpan.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const H = () => ({
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
  'Content-Type': 'application/json'
});

function param(key, val) {
  if (val === undefined || val === null || val === '') return '';
  return key + '=' + encodeURIComponent(val);
}

// Retry ringan untuk error jaringan transien (mis. Supabase sesaat tak terjangkau).
// Hanya dipakai untuk operasi SELECT yang idempotent.
async function fetchRetry(url, options, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status >= 500 && i < tries - 1) {
        lastErr = new Error('HTTP ' + res.status);
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

class Supabase {
  constructor() {
    this.url = SUPABASE_URL;
    this.ready = !!SUPABASE_SERVICE_KEY;
  }

  // SELECT baris
  async select(table, opts = {}) {
    const { columns = '*', filters = [], order, limit, eq } = opts;
    let qs = 'select=' + columns;
    (filters || []).forEach((f) => {
      qs += '&' + f;
    });
    if (eq) {
      qs += '&' + eq.col + '=eq.' + encodeURIComponent(eq.val);
    }
    if (order) qs += '&order=' + order;
    if (limit) qs += '&limit=' + limit;
    const res = await fetchRetry(this.url + '/rest/v1/' + table + '?' + qs, { headers: H() });
    if (!res.ok) throw new Error(await errText(res, 'SELECT ' + table));
    return res.json();
  }

  // INSERT satu baris, return record
  async insert(table, data) {
    const res = await fetch(this.url + '/rest/v1/' + table, {
      method: 'POST',
      headers: Object.assign(H(), { Prefer: 'return=representation' }),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await errText(res, 'INSERT ' + table));
    const rows = await res.json();
    return rows[0];
  }

  // UPDATE by id, return record
  async update(table, id, data) {
    const res = await fetch(this.url + '/rest/v1/' + table + '?id=eq.' + id, {
      method: 'PATCH',
      headers: Object.assign(H(), { Prefer: 'return=representation' }),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await errText(res, 'UPDATE ' + table));
    const rows = await res.json();
    return rows[0];
  }

  // DELETE by id
  async remove(table, id) {
    const res = await fetch(this.url + '/rest/v1/' + table + '?id=eq.' + id, {
      method: 'DELETE',
      headers: H()
    });
    if (!res.ok && res.status !== 204) throw new Error(await errText(res, 'DELETE ' + table));
    return true;
  }

  // DELETE dengan filter, contoh filters: ['username=eq.admin']
  async removeWhere(table, filters = []) {
    let qs = '';
    (filters || []).forEach((f) => {
      qs += (qs ? '&' : '?') + f;
    });
    const res = await fetch(this.url + '/rest/v1/' + table + qs, {
      method: 'DELETE',
      headers: H()
    });
    if (!res.ok && res.status !== 204) throw new Error(await errText(res, 'DELETE ' + table));
    return true;
  }

  // Upload file ke storage bucket
  async upload(bucket, path, body, contentType) {
    const res = await fetch(this.url + '/storage/v1/object/' + bucket + '/' + path, {
      method: 'PUT',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body
    });
    if (!res.ok) throw new Error(await errText(res, 'UPLOAD ' + bucket + '/' + path));
    return this.publicUrl(bucket, path);
  }

  // Hapus file dari storage
  async removeFile(bucket, path) {
    const res = await fetch(this.url + '/storage/v1/object/' + bucket + '/' + path, {
      method: 'DELETE',
      headers: H()
    });
    if (!res.ok && res.status !== 200) throw new Error(await errText(res, 'DELETE FILE'));
    return true;
  }

  publicUrl(bucket, path) {
    return this.url + '/storage/v1/object/public/' + bucket + '/' + path;
  }
}

async function errText(res, label) {
  const txt = await res.text();
  return (label || 'Supabase') + ' -> ' + res.status + ': ' + txt.slice(0, 300);
}

module.exports = new Supabase();
