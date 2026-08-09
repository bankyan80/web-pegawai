// Terapkan restruktur menu "Kepegawaian" ke Supabase via PostgREST.
// Dibuat agar idempotent: mengupdate baris yang sudah ada (by id, lalu by label),
// dan menginsert baris baru bila belum ada (id auto dari DB).
const fs = require('fs');
const path = require('path');
const envTxt = fs.readFileSync(path.join(__dirname, '..', 'nodejs', '.env'), 'utf8');
const env = {};
envTxt.split(/\r?\n/).forEach((l) => {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
});
const SUPABASE_URL = env.SUPABASE_URL || 'https://dkixmotzmmioupclqpan.supabase.co';
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!KEY) {
  console.error('Tidak ada SUPABASE_SERVICE_ROLE_KEY di nodejs/.env');
  process.exit(1);
}
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const J = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch (e) { return { _text: t }; } };
const url = (p) => SUPABASE_URL + '/rest/v1/' + p;

async function getAll() {
  const r = await fetch(url('menu?select=*&order=id.asc'), { headers: H });
  if (!r.ok) throw new Error('GET menu -> ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
}

async function patch(id, data) {
  const r = await fetch(url('menu?id=eq.' + id), { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(data) });
  if (!r.ok && r.status !== 204) throw new Error('PATCH ' + id + ' -> ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const rows = await J(r);
  return (rows && rows[0]) || null;
}

async function insert(data) {
  const r = await fetch(url('menu'), { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(data) });
  if (!r.ok) throw new Error('POST menu -> ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return (await r.json())[0];
}

(async () => {
  const rows = await getAll();
  const byId = {};
  const byLabel = {};
  rows.forEach((r) => { byId[r.id] = r; byLabel[r.label] = r; });

  // Upsert: pakai id bila ada, kalau tidak cari by label, terakhir insert.
  async function upsert(meta) {
    const { id, label, data, onlyExisting } = meta;
    let row = id !== undefined ? byId[id] : null;
    if (!row) row = byLabel[label] || null;
    if (row) {
      const updated = await patch(row.id, data);
      byId[row.id] = updated || row;
      return { id: row.id, created: false };
    }
    if (onlyExisting) return { id: null, created: false };
    const created = await insert(data);
    byId[created.id] = created;
    byLabel[created.label] = created;
    return { id: created.id, created: true };
  }

  const log = [];

  // 1. Root Kepegawaian (dicari by label, bukan by id, agar tak bentrok dgn id auto)
  const root = await upsert({
    label: 'Kepegawaian',
    data: { parent_id: null, label: 'Kepegawaian', url: null, icon: 'fa-briefcase', urutan: 2, for_administrator: true, for_manager: true, for_staff: true, publik: false, status: 'Aktif' }
  });
  log.push(['root Kepegawaian', root.id, root.created ? 'baru' : 'update']);
  const R = root.id;

  // 2. Anak langsung Kepegawaian
  const move = [
    { id: 10, label: 'Profil Pegawai', urutan: 1 },
    { id: 3, label: 'Layanan Kepegawaian', urutan: 2 },
    { id: 27, label: 'Periode PPPK', urutan: 3 },
    { id: 4, label: 'Status Kepegawaian', urutan: 4 }
  ];
  for (const m of move) {
    const r = await upsert({
      id: m.id, label: m.label,
      data: { parent_id: R, label: m.label, urutan: m.urutan, status: 'Aktif', for_administrator: true, for_manager: true, for_staff: true, publik: false }
    });
    log.push([m.label, r.id, r.created ? 'baru' : 'update']);
  }

  // 3. Layanan Kepegawaian (id 3): 9 layanan
  const layanan = [
    { id: 22, label: 'Kenaikan Pangkat', url: '/kepangkatan', icon: 'fa-award', urutan: 1 },
    { id: 23, label: 'Kenaikan Gaji Berkala', url: '/gaji-berkala', icon: 'fa-file-invoice', urutan: 2 },
    { label: 'Mutasi Kepegawaian', url: '/mutasi', icon: 'fa-exchange-alt', urutan: 3 },
    { label: 'Jabatan & Penugasan', url: '/jabatan-penugasan', icon: 'fa-user-tie', urutan: 4 },
    { label: 'Sertifikasi & Tunjangan', url: '/sertifikasi-tunjangan', icon: 'fa-certificate', urutan: 5 },
    { id: 24, label: 'Cuti', url: '/izin-cuti', icon: 'fa-plane', urutan: 6 },
    { id: 31, label: 'BUP / Pensiun', url: '/pensiun', icon: 'fa-user-minus', urutan: 7 },
    { label: 'Arsip Kepegawaian', url: '/arsip-kepegawaian', icon: 'fa-archive', urutan: 8 },
    { label: 'Surat Kepegawaian', url: '/surat-kepegawaian', icon: 'fa-envelope-open-text', urutan: 9 }
  ];
  for (const l of layanan) {
    const r = await upsert({
      id: l.id, label: l.label,
      data: { parent_id: 3, label: l.label, url: l.url, icon: l.icon, urutan: l.urutan, status: 'Aktif', for_administrator: true, for_manager: true, for_staff: false, publik: false }
    });
    log.push(['Layanan > ' + l.label, r.id, r.created ? 'baru' : 'update']);
  }

  // Layanan lama tetap di bawah Layanan Kepegawaian (urutan menyusul, 10+).
  const layananLama = [
    { id: 20, label: 'Inbox surat', urutan: 10 },
    { id: 21, label: 'Kartu Pegawai', urutan: 11 },
    { id: 25, label: 'Izin Cerai', urutan: 12 },
    { id: 26, label: 'SLKS', urutan: 13 },
    { id: 30, label: 'Pengadaan Pegawai', urutan: 14 },
    { id: 32, label: 'Pindah tugas', urutan: 15 },
    { id: 33, label: 'Penempatan tugas', urutan: 16 },
    { id: 34, label: 'Disiplin pegawai', urutan: 17 }
  ];
  for (const l of layananLama) {
    const r = await upsert({ id: l.id, label: l.label, data: { parent_id: 3, urutan: l.urutan, status: 'Aktif' }, onlyExisting: true });
    if (r.id) log.push(['Layanan > ' + l.label, r.id, r.created ? 'baru' : 'update']);
  }

  // 4. Status Kepegawaian (id 4)
  const status = [
    { label: 'Semua Pegawai', url: '/status-kepegawaian', icon: 'fa-users', urutan: 1, staff: true },
    { label: 'PNS', url: '/status-kepegawaian?jenis=PNS', icon: 'fa-id-badge', urutan: 2, staff: true },
    { label: 'PPPK', url: '/status-kepegawaian?jenis=PPPK', icon: 'fa-user-graduate', urutan: 3, staff: true },
    { label: 'PPPK Paruh Waktu', url: '/status-kepegawaian?jenis=PPPK%20Paruh%20Waktu', icon: 'fa-user-clock', urutan: 4, staff: true },
    { label: 'Non-ASN', url: '/status-kepegawaian?jenis=Non-ASN', icon: 'fa-user', urutan: 5, staff: true },
    { label: 'Riwayat Status', url: '/riwayat-status', icon: 'fa-history', urutan: 6, staff: false }
  ];
  for (const s of status) {
    const r = await upsert({
      id: s.id, label: s.label,
      data: { parent_id: 4, label: s.label, url: s.url, icon: s.icon, urutan: s.urutan, status: 'Aktif', for_administrator: true, for_manager: true, for_staff: s.staff, publik: false }
    });
    log.push(['Status > ' + s.label, r.id, r.created ? 'baru' : 'update']);
  }

  console.log('=== HASIL RESTRUKTUR MENU ===');
  log.forEach((l) => console.log(' ' + l[0] + '  (id ' + l[1] + ')  ' + l[2]));

  // Verifikasi pohon
  const after = await getAll();
  console.log('\n=== STRUKTUR BARU (parent_id -> anak) ===');
  const parents = after.filter((r) => r.parent_id === null).sort((a, b) => a.urutan - b.urutan);
  parents.forEach((p) => {
    console.log('* ' + p.label + ' (id ' + p.id + ')');
    const kids = after.filter((c) => Number(c.parent_id) === Number(p.id)).sort((a, b) => a.urutan - b.urutan);
    kids.forEach((c) => console.log('    - ' + c.label + '  [' + c.url + ']'));
  });
})().catch((err) => { console.error(err); process.exit(1); });
