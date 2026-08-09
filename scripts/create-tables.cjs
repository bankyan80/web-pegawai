const fs = require('fs');
const path = require('path');

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = 'dkixmotzmmioupclqpan';
const API = 'https://api.supabase.com/v1/projects/' + REF + '/database/query';

if (!TOKEN) {
  console.error('Set SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

async function q(sql) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  const t = await r.text();
  if (!r.ok) throw new Error(r.status + ': ' + t.slice(0, 400));
  return t;
}

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20260809020000_modul_kepegawaian.sql'), 'utf8');
  const res = await q(sql);
  console.log('DDL OK:', res.slice(0, 200));
})();
