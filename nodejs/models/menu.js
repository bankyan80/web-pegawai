// Model menu dinamis: membaca tabel menu dari Supabase, menyusun struktur
// navbar sesuai role member, dan menyediakan data untuk halaman Kelola Menu.
const sb = require('../config/supabase');

let cache = null;
let cacheTs = 0;
const TTL = 30000;

async function all() {
  if (cache && Date.now() - cacheTs <= TTL) return cache;
  const rows = await sb.select('menu', { order: 'urutan.asc,id.asc' });
  cache = rows;
  cacheTs = Date.now();
  return rows;
}

function invalidateCache() {
  cache = null;
  cacheTs = 0;
}

// Susun menu navbar untuk seorang member (atau tamu bila member null).
// - Baris tanpa parent_id = entri utama (grup atau tautan tunggal).
// - Grup (punya anak) hanya dirender bila member login dan ada >= 1 anak
//   yang boleh dilihat role tersebut.
// - Tautan tunggal dirender bila publik (tanpa login) atau member & flag role.
function forRole(rows, member) {
  const role = member ? member.role : '';
  const isChildVisible = (c) =>
    c.status !== 'Nonaktif' && !!member && c['for_' + role] === true;
  const isSelfVisible = (t) =>
    t.status !== 'Nonaktif' && (t.publik === true || (!!member && t['for_' + role] === true));

  const out = [];
  (rows || []).forEach((t) => {
    if (t.parent_id !== null && t.parent_id !== undefined) return;
    const children = (rows || [])
      .filter((c) => Number(c.parent_id) === Number(t.id) && isChildVisible(c))
      .sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));
    const isGroup = (rows || []).some((c) => Number(c.parent_id) === Number(t.id));
    if (isGroup) {
      if (member && children.length) {
        out.push({ id: t.id, label: t.label, icon: t.icon, children: children.map((c) => ({ id: c.id, label: c.label, url: c.url, icon: c.icon })) });
      }
    } else if (isSelfVisible(t)) {
      out.push({ id: t.id, label: t.label, url: t.url, icon: t.icon, children: [] });
    }
  });
  return out;
}

module.exports = { all, forRole, invalidateCache };
