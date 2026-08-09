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
// Mendukung menu bertingkat (grup di dalam grup):
// - Baris tanpa parent_id = entri utama (grup atau tautan tunggal).
// - Grup hanya dirender bila ada >= 1 anak yang boleh dilihat role tersebut.
// - Tautan tunggal dirender bila publik (tanpa login) atau member & flag role.
function forRole(rows, member) {
  const role = member ? member.role : '';
  const isChildVisible = (c) =>
    c.status !== 'Nonaktif' && !!member && c['for_' + role] === true;
  const isSelfVisible = (t) =>
    t.status !== 'Nonaktif' && (t.publik === true || (!!member && t['for_' + role] === true));

  // Rekursif membangun node. 'top' = node di level teratas.
  function build(node, depth) {
    if (depth > 8) return null;
    const kids = (rows || [])
      .filter((c) => Number(c.parent_id) === Number(node.id) && isChildVisible(c))
      .sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));
    const kidViews = kids.map((k) => build(k, depth + 1)).filter(Boolean);
    if (kidViews.length) {
      return { id: node.id, label: node.label, icon: node.icon, children: kidViews };
    }
    if (depth === 0) {
      if (isSelfVisible(node)) {
        return { id: node.id, label: node.label, url: node.url, icon: node.icon, children: [] };
      }
      return null;
    }
    // Anak yang tidak punya anak lagi: hanya dirender bila punya tautan.
    if (node.url) {
      return { id: node.id, label: node.label, url: node.url, icon: node.icon, children: [] };
    }
    return null;
  }

  const tops = (rows || [])
    .filter((t) => t.parent_id === null || t.parent_id === undefined)
    .sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));
  return tops.map((t) => build(t, 0)).filter(Boolean);
}

module.exports = { all, forRole, invalidateCache };
