const express = require('express');

const Login = require('../models/login');
const Pegawai = require('../models/pegawai');
const Divisi = require('../models/divisi');
const Jabatan = require('../models/jabatan');
const Gaji = require('../models/gaji');
const Pelatihan = require('../models/pelatihan');
const Materi = require('../models/materi');
const kepdata = require('../models/kepdata');
const menuModel = require('../models/menu');

const router = express.Router();

const routes = {
  home: 'home',
  aboutus: 'aboutus',
  form_login: 'login_form',
  pegawai: 'pegawai',
  form_pegawai: 'form_pegawai',
  detail_pegawai: 'detail_pegawai',
  divisi: 'divisi',
  form_divisi: 'form_divisi',
  jabatan: 'jabatan',
  form_jabatan: 'form_jabatan',
  gaji: 'gaji',
  form_gaji: 'form_gaji',
  detail_gaji: 'detail_gaji',
  pelatihan: 'pelatihan',
  form_pelatihan: 'form_pelatihan',
  materi: 'materi',
  form_materi: 'form_materi',
  kelolaUser: 'kelolaUser',
  form_user: 'form_user',
  profile: 'profile',
  analytics: 'analytics'
};

const auth = {
  pegawai: 'login',
  form_pegawai: 'login',
  detail_pegawai: 'login',
  profile: 'login',
  divisi: 'staff',
  form_divisi: 'staff',
  jabatan: 'staff',
  form_jabatan: 'staff',
  gaji: 'staff',
  form_gaji: 'staff',
  detail_gaji: 'staff',
  pelatihan: 'staff',
  form_pelatihan: 'staff',
  materi: 'staff',
  form_materi: 'staff',
  kelolaUser: 'admin',
  form_user: 'admin',
  analytics: 'admin'
};

function renderPage(res, req, view, locals) {
  const pageLocals = Object.assign({}, locals, {
    divisiList: locals.sidebarData.divisiList,
    jabatanList: locals.sidebarData.jabatanList
  });
  res.render('pages/' + view, pageLocals, (err, html) => {
    if (err) {
      console.error('RENDER ERROR [' + view + ']:', err);
      return res.status(500).send('Terjadi kesalahan saat merender halaman.');
    }
    res.render('layout', Object.assign({}, pageLocals, { body: html }));
  });
}

router.get('/', async (req, res, next) => {
  const hal = req.query.hal || 'home';
  const view = routes[hal] || 'home';
  const need = auth[hal];
  const member = req.session.MEMBER;

  let sidebarData = { divisiList: [], jabatanList: [] };
  try {
    const divisiModel = new Divisi();
    const jabatanModel = new Jabatan();
    sidebarData = {
      divisiList: await divisiModel.dataDivisi(),
      jabatanList: await jabatanModel.dataJabatan()
    };
  } catch (err) {
    return next(err);
  }

  const base = {
    csrf: req.session.csrfToken,
    query: req.query,
    member,
    sidebarData
  };

  if (need === 'login' && !member) {
    return renderPage(res, req, 'denied', base);
  }
  if (need === 'staff' && (!member || member.role === 'staff')) {
    return renderPage(res, req, 'denied', base);
  }
  if (need === 'admin' && (!member || member.role !== 'administrator')) {
    return renderPage(res, req, 'denied', base);
  }

  const pegawaiModel = new Pegawai();
  const loginModel = new Login();
  const gajiModel = new Gaji();
  const pelatihanModel = new Pelatihan();
  const materiModel = new Materi();

  try {
    switch (view) {
      case 'home': {
        base.jumlahPegawai = (await pegawaiModel.dataPegawai()).length;
        break;
      }
      case 'pegawai': {
        const nama = req.query.nama || '';
        const id = req.query.id || '';
        const idx = req.query.idx || '';
        let rs;
        if (nama) {
          rs = await pegawaiModel.cariPegawai(nama);
        } else if (id) {
          rs = await pegawaiModel.filterDivisi(id);
        } else if (idx) {
          rs = await pegawaiModel.filterJabatan(idx);
        } else {
          rs = await pegawaiModel.dataPegawai();
        }
        base.rs = rs;
        break;
      }
      case 'form_pegawai': {
        base.rs = req.query.idedit
          ? (await pegawaiModel.detailPegawai(req.query.idedit)) || {}
          : {};
        break;
      }
      case 'detail_pegawai': {
        base.peg = (await pegawaiModel.detailPegawai(req.query.id || '')) || {};
        break;
      }
      case 'divisi': {
        base.rs = await new Divisi().dataDivisi();
        break;
      }
      case 'form_divisi': {
        base.rs = req.query.idedit ? (await new Divisi().getDivisi(req.query.idedit)) || {} : {};
        break;
      }
      case 'jabatan': {
        base.rs = await new Jabatan().dataJabatan();
        break;
      }
      case 'form_jabatan': {
        base.rs = req.query.idedit ? (await new Jabatan().getJabatan(req.query.idedit)) || {} : {};
        break;
      }
      case 'gaji': {
        base.rs = await gajiModel.dataGaji();
        break;
      }
      case 'form_gaji': {
        base.rs = req.query.idedit ? (await gajiModel.getGaji(req.query.idedit)) || {} : {};
        base.pegawai = await pegawaiModel.dataPegawai();
        base.belumGaji = await gajiModel.dataBelumDigaji();
        break;
      }
      case 'detail_gaji': {
        base.gaji = (await gajiModel.getGaji(req.query.id || '')) || {};
        break;
      }
      case 'pelatihan': {
        base.rs = await pelatihanModel.dataPelatihan();
        base.pegawai = await pegawaiModel.dataPegawai();
        base.materi = await materiModel.dataMateri();
        base.idedit = '';
        base.record = {};
        break;
      }
      case 'form_pelatihan': {
        base.rs = req.query.idedit
          ? (await pelatihanModel.getPelatihan(req.query.idedit)) || {}
          : {};
        base.pegawai = await pegawaiModel.dataPegawai();
        base.materi = await materiModel.dataMateri();
        base.idedit = req.query.idedit || '';
        base.record = base.rs;
        break;
      }
      case 'materi': {
        base.rs = await materiModel.dataMateri();
        break;
      }
      case 'form_materi': {
        base.rs = req.query.idedit ? (await materiModel.getMateri(req.query.idedit)) || {} : {};
        break;
      }
      case 'kelolaUser': {
        base.rs = await loginModel.dataUser();
        break;
      }
      case 'form_user': {
        base.rs = req.query.idedit ? (await loginModel.getUser(req.query.idedit)) || {} : {};
        break;
      }
      case 'profile': {
        base.profil = (await loginModel.getUser(member.id)) || {};
        break;
      }
    }
  } catch (err) {
    return next(err);
  }

  return renderPage(res, req, view, base);
});

router.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/?hal=home');
});

async function renderModul(res, req, view, cfg) {
  const member = req.session.MEMBER;

  let sidebarData = { divisiList: [], jabatanList: [] };
  try {
    const divisiModel = new Divisi();
    const jabatanModel = new Jabatan();
    sidebarData = {
      divisiList: await divisiModel.dataDivisi(),
      jabatanList: await jabatanModel.dataJabatan()
    };
  } catch (err) {
    sidebarData = { divisiList: [], jabatanList: [] };
  }

  const base = Object.assign({
    stats: null,
    tree: null,
    modal: null,
    primaryBtn: null,
    desc: null,
    tabs: null,
    workflow: null,
    steps: null,
    toolbar: null,
    table: null,
    kartu: null,
    pegawai: null,
    p: null
  }, cfg, {
    csrf: req.session.csrfToken,
    query: req.query,
    member,
    sidebarData
  });

  return renderPage(res, req, view, base);
}

const KB = {
  'Aktif': 'kb-blue',
  'Hadir': 'kb-green',
  'Izin': 'kb-amber',
  'Cuti': 'kb-violet',
  'Dinas Luar': 'kb-cyan',
  'Sakit': 'kb-red',
  'Alpa': 'kb-gray',
  'Diajukan': 'kb-amber',
  'Disetujui': 'kb-green',
  'Ditolak': 'kb-red',
  'Selesai': 'kb-green',
  'Usulan': 'kb-amber',
  'Dalam Proses': 'kb-blue',
  'Diproses': 'kb-blue',
  'Belum Dibaca': 'kb-amber',
  'Arsip': 'kb-gray',
  'Akan Naik': 'kb-blue',
  'Bulan Ini': 'kb-amber',
  'Sudah Diproses': 'kb-green',
  'Terlambat': 'kb-red',
  'Pengajuan': 'kb-amber',
  'Verifikasi': 'kb-blue',
  'Pemeriksaan': 'kb-violet',
  'Persetujuan': 'kb-blue',
  'SK': 'kb-cyan',
  'Laporan': 'kb-gray',
  'Pembinaan': 'kb-violet',
  'Keputusan': 'kb-amber',
  'Peringatan': 'kb-red',
  'Berjalan': 'kb-blue',
  'Ada': 'kb-green',
  'Belum': 'kb-amber',
  'Lengkap': 'kb-green',
  'Diterima': 'kb-green',
  'Diverifikasi': 'kb-blue',
  'Seleksi': 'kb-violet',
  'Penempatan': 'kb-cyan',
  'Formasi': 'kb-gray',
  'Sedang Belajar': 'kb-blue',
  'Izin Terbit': 'kb-green',
  'PNS': 'kb-blue',
  'PPPK': 'kb-violet',
  'PPPK Paruh Waktu': 'kb-cyan',
  'Honorer': 'kb-gray',
  'Nonaktif': 'kb-gray',
  'AKTIF': 'kb-green',
  'BELUM AKTIF': 'kb-gray',
  'SEGERA BERAKHIR': 'kb-amber',
  'BERAKHIR': 'kb-red'
};
function kepBadge(v) {
  const cls = KB[String(v)] || 'kb-gray';
  return '<span class="kep-badge ' + cls + '">' + v + '</span>';
}
function countBy(arr, key, val) {
  return arr.filter((x) => x[key] === val).length;
}
function isPppk(jenis) {
  return /pppk/i.test(String(jenis || ''));
}
function isPppkParuhWaktu(jenis) {
  return /paruh waktu/i.test(String(jenis || ''));
}

function requireLogin(req, res, next) {
  if (!req.session.MEMBER) {
    return res.redirect('/?hal=form_login');
  }
  return next();
}

function requireStaff(req, res, next) {
  if (!req.session.MEMBER) {
    return res.redirect('/?hal=form_login');
  }
  if (req.session.MEMBER.role === 'staff') {
    return res.redirect('/?hal=home');
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session.MEMBER) {
    return res.redirect('/?hal=form_login');
  }
  if (req.session.MEMBER.role !== 'administrator') {
    return res.redirect('/?hal=home');
  }
  return next();
}

// Modul yang bisa diakses semua role yang sudah login
router.use([
  '/profil-pegawai',
  '/presensi',
  '/inbox-surat',
  '/kartu-pegawai',
  '/periode-pppk'
], requireLogin);

// Modul pengelolaan data (role staff tidak boleh)
router.use([
  '/referensi-data',
  '/kepangkatan',
  '/gaji-berkala',
  '/izin-cuti',
  '/izin-cerai',
  '/slks',
  '/pengadaan-pegawai',
  '/pensiun',
  '/pindah-tugas',
  '/penempatan-tugas',
  '/disiplin-pegawai',
  '/diklat-struktural',
  '/diklat-teknis',
  '/izin-belajar',
  '/tugas-belajar'
], requireStaff);

// Modul khusus administrator
router.use(['/kelola-user', '/kelola-menu'], requireAdmin);

router.get('/profil-pegawai', async (req, res, next) => {
  const D = await kepdata.getKepData(['pegawai', 'unitKerja', 'jabatanList', 'pangkatList', 'golonganList', 'jenisPegawaiList']);
  const rows = D.pegawai.map((p) => [p.nip, p.nama, p.jenis, p.jabatan, p.unit, p.status]);
  const records = D.pegawai.map((p) => ({
    id: p.id, nip: p.nip, nik: p.nik, nama: p.nama, ttl: p.ttl, jk: p.jk, alamat: p.alamat,
    hp: p.hp, email: p.email, jenis: p.jenis, pangkat: p.pangkat, golongan: p.golongan,
    jabatan: p.jabatan, unit: p.unit, tmt: p.tmt, status: p.status
  }));
  const cfg = {
    breadcrumb: ['Master Data', 'Profil Pegawai'],
    title: 'Profil Pegawai',
    desc: 'Kelola dan lihat data profil seluruh pegawai',
    primaryBtn: { label: 'Tambah Pegawai', modal: 'modalPegawai', icon: 'fa-user-plus' },
    stats: [
      { label: 'Total Pegawai', value: D.pegawai.length, icon: 'fa-users', color: 'blue' },
      { label: 'PNS', value: countBy(D.pegawai, 'jenis', 'PNS'), icon: 'fa-user-tie', color: 'violet' },
      { label: 'PPPK', value: D.pegawai.filter((x) => isPppk(x.jenis) && !isPppkParuhWaktu(x.jenis)).length, icon: 'fa-user-graduate', color: 'green' },
      { label: 'PPPK Paruh Waktu', value: D.pegawai.filter((x) => isPppk(x.jenis) && isPppkParuhWaktu(x.jenis)).length, icon: 'fa-user-clock', color: 'cyan' },
      { label: 'Honorer', value: countBy(D.pegawai, 'jenis', 'Honorer'), icon: 'fa-user-cog', color: 'amber' }
    ],
    toolbar: {
      search: { table: 'tblPegawai', placeholder: 'Cari nama/NIP' },
      filters: [
        { table: 'tblPegawai', col: 2, label: 'Filter Jenis Pegawai', options: D.jenisPegawaiList }
      ],
      buttons: [
        { type: 'export', table: 'tblPegawai', label: 'Export', icon: 'fa-file-export' },
        { type: 'print', label: 'Cetak', icon: 'fa-print' }
      ]
    },
    table: {
      id: 'tblPegawai',
      columns: [
        { label: 'NIP' },
        { label: 'Nama Pegawai' },
        { label: 'Jenis Pegawai', format: kepBadge },
        { label: 'Jabatan' },
        { label: 'Unit Kerja' },
        { label: 'Status', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Lihat' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalPegawai' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalPegawai',
      title: 'Tambah Pegawai',
      table: 'tblPegawai',
      fields: [
        { name: 'nama', label: 'Nama Lengkap', required: true },
        { name: 'nip', label: 'NIP', required: true },
        { name: 'nik', label: 'NIK', required: true },
        { name: 'ttl', label: 'Tempat/Tgl Lahir' },
        { name: 'jk', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'] },
        { name: 'alamat', label: 'Alamat', type: 'textarea' },
        { name: 'hp', label: 'No. HP' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'jenis', label: 'Jenis Pegawai', type: 'select', options: D.jenisPegawaiList, required: true },
        { name: 'pangkat', label: 'Pangkat', type: 'select', options: D.pangkatList },
        { name: 'golongan', label: 'Golongan', type: 'select', options: D.golonganList },
        { name: 'jabatan', label: 'Jabatan', type: 'select', options: D.jabatanList },
        { name: 'unit', label: 'Unit Kerja', type: 'select', options: D.unitKerja },
        { name: 'tmt', label: 'TMT', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Cuti', 'Pensiun', 'Nonaktif'] },
        { name: 'foto', label: 'Foto (opsional)', type: 'file' }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

router.get('/profil-pegawai/detail/:id', async (req, res, next) => {
  const D = await kepdata.getKepData(['detailPegawai']);
  const p = D.detailPegawai(parseInt(req.params.id, 10));
  if (!p) {
    return res.redirect('/profil-pegawai');
  }
  const cfg = {
    breadcrumb: ['Master Data', 'Profil Pegawai', 'Detail'],
    title: p.nama,
    desc: 'NIP ' + p.nip + ' — ' + p.unit,
    p
  };
  return renderModul(res, req, 'kep_profil_detail', cfg);
});

const BULAN_INDO = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function pdfLink(v) {
  if (!v) {
    return '<span class="text-muted">Belum upload</span>';
  }
  return '<a class="btn btn-sm btn-outline-primary" target="_blank" rel="noopener" href="' + v + '"><i class="fas fa-file-pdf text-danger"></i> Buka PDF</a>';
}

router.get('/presensi', async (req, res, next) => {
  const D = await kepdata.getKepData(['presensi', 'pegawai']);
  const member = req.session.MEMBER;
  const isStaff = member && member.role === 'staff';
  const fullname = member ? String(member.fullname || '').trim().toLowerCase() : '';

  // Staff hanya melihat arsip presensi miliknya (cocok dengan nama login).
  let list = D.presensi;
  if (isStaff) {
    list = D.presensi.filter((r) => String(r.nama || '').trim().toLowerCase() === fullname);
  }

  // Kelompokkan sebagai "folder tahunan".
  const tahunSet = [];
  list.forEach((r) => {
    if (r.tahun && tahunSet.indexOf(r.tahun) === -1) tahunSet.push(r.tahun);
  });
  if (!tahunSet.length) tahunSet.push(String(new Date().getFullYear()));
  tahunSet.sort().reverse();

  const recordsByTahun = {};
  list.forEach((r) => {
    if (!recordsByTahun[r.tahun]) recordsByTahun[r.tahun] = [];
    recordsByTahun[r.tahun].push({
      id: r.id,
      nama: r.nama,
      nip: r.nip,
      tahun: r.tahun,
      bulan: r.bulan,
      file: r.file || '',
      keterangan: r.keterangan || ''
    });
  });

  const tabs = tahunSet.map((tahun, ti) => {
    const tid = 'tblPrs' + ti;
    const mid = 'modPrs' + ti;
    const recs = recordsByTahun[tahun] || [];
    const rows = recs.map((r) => [r.nama, r.nip, r.bulan, r.file, r.keterangan]);
    return {
      id: 'tabPrs' + ti,
      label: 'Tahun ' + tahun,
      icon: 'fa-folder',
      toolbar: {
        search: { table: tid, placeholder: 'Cari nama/NIP' },
        filters: [
          { table: tid, col: 2, label: 'Filter Bulan', options: BULAN_INDO }
        ],
        buttons: isStaff
          ? [{ type: 'print', label: 'Cetak', icon: 'fa-print' }]
          : [
              { type: 'modal', modal: mid, label: 'Upload PDF', icon: 'fa-upload' },
              { type: 'print', label: 'Cetak', icon: 'fa-print' },
              { type: 'export', table: tid, label: 'Export', icon: 'fa-file-export' }
            ]
      },
      table: {
        id: tid,
        columns: [
          { label: 'Nama Pegawai' },
          { label: 'NIP' },
          { label: 'Bulan' },
          { label: 'File Presensi', format: (v) => pdfLink(v) },
          { label: 'Keterangan' }
        ],
        rows,
        records: recs,
        actions: isStaff
          ? [{ act: 'detail', icon: 'fa-eye', label: 'Lihat' }, { act: 'unduh', icon: 'fa-download', label: 'Unduh' }]
          : [
              { act: 'detail', icon: 'fa-eye', label: 'Lihat' },
              { act: 'unduh', icon: 'fa-download', label: 'Unduh' },
              { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: mid },
              { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
            ]
      },
      modal: isStaff ? null : {
        id: mid,
        title: 'Upload PDF Presensi - Tahun ' + tahun,
        table: tid,
        nipMap: D.pegawai.reduce((acc, p) => { acc[p.nama] = p.nip; return acc; }, {}),
        fields: [
          { name: 'nama', label: 'Nama Pegawai', type: 'select', options: D.pegawai.map((p) => p.nama), searchable: true, required: true },
          { name: 'nip', label: 'NIP' },
          { name: 'tahun', type: 'hidden', value: tahun },
          { name: 'keterangan', label: 'Keterangan', type: 'textarea' },
          { name: 'berkas', label: 'Daftar Bulan & File PDF', type: 'batch', span: 12, months: BULAN_INDO }
        ]
      }
    };
  });

  const cfg = {
    breadcrumb: ['Master Data', 'Presensi'],
    title: 'Arsip Presensi Pegawai',
    desc: 'Folder presensi tahunan berisi file PDF presensi bulanan per pegawai',
    tabs
  };
  return renderModul(res, req, 'kep_tabs', cfg);
});

router.get('/referensi-data', async (req, res, next) => {
  const D = await kepdata.getKepData(['referensi']);
  const defs = [
    { key: 'jabatan', label: 'Jabatan', icon: 'fa-briefcase' },
    { key: 'golongan', label: 'Pangkat/Golongan', icon: 'fa-layer-group' },
    { key: 'unit', label: 'Unit Kerja', icon: 'fa-building' },
    { key: 'jenisPegawai', label: 'Jenis Pegawai', icon: 'fa-user-tag' },
    { key: 'statusPegawai', label: 'Status Pegawai', icon: 'fa-user-check' },
    { key: 'pendidikan', label: 'Pendidikan', icon: 'fa-graduation-cap' },
    { key: 'jenisDiklat', label: 'Jenis Diklat', icon: 'fa-chalkboard-teacher' },
    { key: 'jenisCuti', label: 'Jenis Cuti', icon: 'fa-plane' },
    { key: 'jenisDokumen', label: 'Jenis Dokumen', icon: 'fa-folder-open' }
  ];
  const tabs = defs.map((d, i) => {
    const tid = 'tblRef' + i;
    const mid = 'modRef' + i;
    const data = D.referensi[d.key] || [];
    return {
      id: 'tabRef' + i,
      label: d.label,
      icon: d.icon,
      toolbar: {
        search: { table: tid, placeholder: 'Cari referensi' },
        filters: [],
        buttons: [
          { type: 'modal', modal: mid, label: 'Tambah Data', icon: 'fa-plus' },
          { type: 'export', table: tid, label: 'Export', icon: 'fa-file-export' }
        ]
      },
      table: {
        id: tid,
        columns: [
          { label: 'Kode' },
          { label: 'Nama Referensi' },
          { label: 'Status', format: kepBadge }
        ],
        rows: data.map((x) => [x.kode, x.nama, x.status]),
        records: data.map((x) => ({ id: x.id, kode: x.kode, nama: x.nama, status: x.status })),
        actions: [
          { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: mid },
          { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
        ]
      },
      modal: {
        id: mid,
        title: 'Tambah ' + d.label,
        table: tid,
        fields: [
          { name: 'kategori', type: 'hidden', value: d.key },
          { name: 'kode', label: 'Kode', required: true },
          { name: 'nama', label: 'Nama Referensi', required: true },
          { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] }
        ]
      }
    };
  });
  const cfg = {
    breadcrumb: ['Master Data', 'Referensi Data'],
    title: 'Referensi Data',
    desc: 'Master referensi yang digunakan dalam sistem kepegawaian',
    tabs
  };
  return renderModul(res, req, 'kep_tabs', cfg);
});

router.get('/kelola-user', async (req, res, next) => {
  const D = await kepdata.getKepData(['users', 'unitKerja']);
  const rows = D.users.map((u) => [u.username, u.nama, u.role, u.unit, u.status, u.login]);
  const records = D.users.map((u) => ({ id: u.id, username: u.username, nama: u.nama, email: u.email, role: u.role, unit: u.unit, status: u.status, password: '' }));
  const admin = D.users.filter((u) => u.role !== 'Pegawai').length;
  const op = D.users.filter((u) => u.role === 'Operator').length;
  const cfg = {
    breadcrumb: ['Master Data', 'Kelola User'],
    title: 'Kelola User',
    desc: 'Manajemen pengguna sistem kepegawaian',
    primaryBtn: { label: 'Tambah User', modal: 'modalUser', icon: 'fa-user-plus' },
    stats: [
      { label: 'Total User', value: D.users.length, icon: 'fa-users', color: 'blue' },
      { label: 'Aktif', value: countBy(D.users, 'status', 'Aktif'), icon: 'fa-user-check', color: 'green' },
      { label: 'Nonaktif', value: countBy(D.users, 'status', 'Nonaktif'), icon: 'fa-user-times', color: 'gray' },
      { label: 'Admin', value: admin, icon: 'fa-user-shield', color: 'violet' },
      { label: 'Operator', value: op, icon: 'fa-user-cog', color: 'cyan' }
    ],
    toolbar: {
      search: { table: 'tblUser', placeholder: 'Cari nama/username' },
      filters: [
        { table: 'tblUser', col: 2, label: 'Filter Role', options: ['Super Admin', 'Admin Kepegawaian', 'Operator', 'Pegawai'] },
        { table: 'tblUser', col: 4, label: 'Filter Status', options: ['Aktif', 'Nonaktif'] }
      ],
      buttons: [
        { type: 'export', table: 'tblUser', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblUser',
      columns: [
        { label: 'Username' },
        { label: 'Nama' },
        { label: 'Role', format: kepBadge },
        { label: 'Unit Kerja' },
        { label: 'Status', format: kepBadge },
        { label: 'Login Terakhir' }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalUser' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalUser',
      title: 'Tambah User',
      table: 'tblUser',
      fields: [
        { name: 'nama', label: 'Nama', required: true },
        { name: 'username', label: 'Username', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'role', label: 'Role', type: 'select', options: ['Super Admin', 'Admin Kepegawaian', 'Operator', 'Pegawai'], required: true },
        { name: 'unit', label: 'Unit Kerja', type: 'select', options: D.unitKerja },
        { name: 'password', label: 'Password', required: true },
        { name: 'konfirmasi', label: 'Konfirmasi Password', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

router.get('/inbox-surat', async (req, res, next) => {
  const D = await kepdata.getKepData(['surat']);
  const rows = D.surat.map((s) => [s.nomor, s.tanggal, s.perihal, s.pengirim, s.status]);
  const records = D.surat.map((s) => ({ id: s.id, nomor: s.nomor, tanggal: s.tanggal, perihal: s.perihal, pengirim: s.pengirim, status: s.status }));
  const cfg = {
    breadcrumb: ['Layanan Kepegawaian', 'Inbox Surat'],
    title: 'Inbox Surat',
    desc: 'Kelola surat masuk kepegawaian',
    primaryBtn: { label: 'Surat Masuk', modal: 'modalSurat', icon: 'fa-envelope-open-text' },
    stats: [
      { label: 'Semua', value: D.surat.length, icon: 'fa-envelope', color: 'blue' },
      { label: 'Belum Dibaca', value: countBy(D.surat, 'status', 'Belum Dibaca'), icon: 'fa-envelope', color: 'amber' },
      { label: 'Diproses', value: countBy(D.surat, 'status', 'Diproses'), icon: 'fa-cogs', color: 'cyan' },
      { label: 'Selesai', value: countBy(D.surat, 'status', 'Selesai'), icon: 'fa-check-circle', color: 'green' },
      { label: 'Arsip', value: countBy(D.surat, 'status', 'Arsip'), icon: 'fa-archive', color: 'gray' }
    ],
    toolbar: {
      search: { table: 'tblSurat', placeholder: 'Cari nomor/perihal' },
      filters: [
        { table: 'tblSurat', col: 4, label: 'Filter Status', options: ['Belum Dibaca', 'Diproses', 'Selesai', 'Arsip'] }
      ],
      buttons: [
        { type: 'file', label: 'Upload PDF', icon: 'fa-file-pdf' },
        { act: 'disposisi', label: 'Disposisi', icon: 'fa-share' },
        { act: 'download', label: 'Download', icon: 'fa-download' },
        { type: 'export', table: 'tblSurat', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblSurat',
      columns: [
        { label: 'Nomor Surat' },
        { label: 'Tanggal' },
        { label: 'Perihal' },
        { label: 'Pengirim' },
        { label: 'Status', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalSurat' },
        { act: 'download', icon: 'fa-download', label: 'Download' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalSurat',
      title: 'Tambah Surat Masuk',
      table: 'tblSurat',
      fields: [
        { name: 'nomor', label: 'Nomor Surat', required: true },
        { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
        { name: 'perihal', label: 'Perihal', required: true },
        { name: 'pengirim', label: 'Pengirim', required: true },
        { name: 'file', label: 'Upload PDF', type: 'file' },
        { name: 'status', label: 'Status', type: 'select', options: ['Belum Dibaca', 'Diproses', 'Selesai', 'Arsip'] }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

router.get('/kartu-pegawai', async (req, res, next) => {
  const D = await kepdata.getKepData(['kartuPegawai']);
  const cfg = {
    breadcrumb: ['Layanan Kepegawaian', 'Kartu Pegawai'],
    title: 'Kartu Pegawai',
    desc: 'Cari pegawai dan cetak kartu identitas kepegawaian',
    list: D.kartuPegawai
  };
  return renderModul(res, req, 'kep_kartu', cfg);
});

router.get('/kepangkatan', async (req, res, next) => {
  const D = await kepdata.getKepData(['kepangkatan', 'pegawai', 'pangkatList', 'golonganList']);
  const cols = [
    { label: 'NIP' },
    { label: 'Nama' },
    { label: 'Pangkat Lama' },
    { label: 'Pangkat Baru' },
    { label: 'TMT' },
    { label: 'Status', format: kepBadge }
  ];
  const mk = (list, tid) => ({
    id: tid,
    columns: cols,
    rows: list.map((x) => [x.nip, x.nama, x.lama, x.baru, x.tmt, x.status]),
    records: list.map((x) => ({ pegawai: x.nama, pangkatLama: x.lama, pangkatBaru: x.baru, tmt: x.tmt, nomorSk: 'SK-' + x.nip.slice(-4), tanggalSk: x.tmt, status: x.status })),
    actions: [
      { act: 'detail', icon: 'fa-eye', label: 'Detail' },
      { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
    ]
  });
  const tabs = [
    { id: 'tabRw', label: 'Riwayat Pangkat', icon: 'fa-history', toolbar: { search: { table: 'tblRw', placeholder: 'Cari NIP/nama' }, filters: [], buttons: [{ type: 'export', table: 'tblRw', label: 'Export', icon: 'fa-file-export' }] }, table: mk(D.kepangkatan, 'tblRw') },
    { id: 'tabUsl', label: 'Usulan Kenaikan', icon: 'fa-file-signature', toolbar: { search: { table: 'tblUsl', placeholder: 'Cari NIP/nama' }, filters: [], buttons: [{ type: 'export', table: 'tblUsl', label: 'Export', icon: 'fa-file-export' }] }, table: mk(D.kepangkatan.filter((x) => x.status === 'Usulan'), 'tblUsl') },
    { id: 'tabPro', label: 'Dalam Proses', icon: 'fa-spinner', toolbar: { search: { table: 'tblPro', placeholder: 'Cari NIP/nama' }, filters: [], buttons: [{ type: 'export', table: 'tblPro', label: 'Export', icon: 'fa-file-export' }] }, table: mk(D.kepangkatan.filter((x) => x.status === 'Dalam Proses'), 'tblPro') },
    { id: 'tabSel', label: 'Selesai', icon: 'fa-check-circle', toolbar: { search: { table: 'tblSel', placeholder: 'Cari NIP/nama' }, filters: [], buttons: [{ type: 'export', table: 'tblSel', label: 'Export', icon: 'fa-file-export' }] }, table: mk(D.kepangkatan.filter((x) => x.status === 'Selesai'), 'tblSel') }
  ];
  const cfg = {
    breadcrumb: ['Layanan Kepegawaian', 'Kepangkatan'],
    title: 'Kepangkatan',
    desc: 'Riwayat pangkat dan usulan kenaikan pangkat pegawai',
    primaryBtn: { label: 'Usulan Kenaikan', modal: 'modalPangkat', icon: 'fa-plus' },
    tabs,
    modal: {
      id: 'modalPangkat',
      title: 'Form Usulan Kenaikan Pangkat',
      table: 'tblRw',
      fields: [
        { name: 'pegawai', label: 'Pegawai', type: 'select', options: D.pegawai.map((p) => p.nama), required: true },
        { name: 'pangkatLama', label: 'Pangkat Lama', type: 'select', options: D.pangkatList },
        { name: 'pangkatBaru', label: 'Pangkat Baru', type: 'select', options: D.pangkatList, required: true },
        { name: 'golongan', label: 'Golongan', type: 'select', options: D.golonganList },
        { name: 'tmt', label: 'TMT', type: 'date', required: true },
        { name: 'nomorSk', label: 'Nomor SK' },
        { name: 'tanggalSk', label: 'Tanggal SK', type: 'date' },
        { name: 'file', label: 'Upload SK', type: 'file' },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' }
      ]
    }
  };
  return renderModul(res, req, 'kep_tabs', cfg);
});

router.get('/gaji-berkala', async (req, res, next) => {
  const D = await kepdata.getKepData(['gajiBerkala', 'pangkatList']);
  const rows = D.gajiBerkala.map((g) => [g.nip, g.nama, g.pangkat, g.gaji, g.tmtLama, g.tmtBerikut, g.status]);
  const records = D.gajiBerkala.map((g) => ({ id: g.id, nip: g.nip, nama: g.nama, pangkat: g.pangkat, gaji: g.gaji, tmtLama: g.tmtLama, tmtBerikut: g.tmtBerikut, status: g.status }));
  const cfg = {
    breadcrumb: ['Layanan Kepegawaian', 'Gaji Berkala'],
    title: 'Gaji Berkala',
    desc: 'Pengelolaan kenaikan gaji berkala pegawai',
    stats: [
      { label: 'Akan Naik', value: countBy(D.gajiBerkala, 'status', 'Akan Naik'), icon: 'fa-calendar-day', color: 'blue' },
      { label: 'Bulan Ini', value: countBy(D.gajiBerkala, 'status', 'Bulan Ini'), icon: 'fa-calendar-check', color: 'amber' },
      { label: 'Sudah Diproses', value: countBy(D.gajiBerkala, 'status', 'Sudah Diproses'), icon: 'fa-check-double', color: 'green' },
      { label: 'Terlambat', value: countBy(D.gajiBerkala, 'status', 'Terlambat'), icon: 'fa-exclamation-triangle', color: 'red' }
    ],
    toolbar: {
      search: { table: 'tblGaji', placeholder: 'Cari NIP/nama' },
      filters: [
        { table: 'tblGaji', col: 6, label: 'Filter Status', options: ['Akan Naik', 'Bulan Ini', 'Sudah Diproses', 'Terlambat'] }
      ],
      buttons: [
        { type: 'export', table: 'tblGaji', label: 'Export', icon: 'fa-file-export' },
        { type: 'print', label: 'Cetak', icon: 'fa-print' }
      ]
    },
    table: {
      id: 'tblGaji',
      columns: [
        { label: 'NIP' },
        { label: 'Nama' },
        { label: 'Pangkat' },
        { label: 'Gaji Pokok', format: (v) => 'Rp ' + v },
        { label: 'TMT KGB Lama' },
        { label: 'TMT KGB Berikutnya' },
        { label: 'Status', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalGaji' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalGaji',
      title: 'Tambah Gaji Berkala',
      table: 'tblGaji',
      fields: [
        { name: 'nip', label: 'NIP', required: true },
        { name: 'nama', label: 'Nama', required: true },
        { name: 'pangkat', label: 'Pangkat', type: 'select', options: D.pangkatList },
        { name: 'gaji', label: 'Gaji Pokok', required: true },
        { name: 'tmtLama', label: 'TMT KGB Lama', type: 'date' },
        { name: 'tmtBerikut', label: 'TMT KGB Berikutnya', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Akan Naik', 'Bulan Ini', 'Sudah Diproses', 'Terlambat'] }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

router.get('/izin-cuti', async (req, res, next) => {
  const D = await kepdata.getKepData(['cuti', 'jenisCuti', 'pegawai']);
  const rows = D.cuti.map((c) => [c.pemohon, c.jenis, c.mulai, c.selesai, c.lama, c.status]);
  const records = D.cuti.map((c) => ({ id: c.id, pemohon: c.pemohon, jenis: c.jenis, mulai: c.mulai, selesai: c.selesai, lama: c.lama, status: c.status }));
  const cfg = {
    breadcrumb: ['Layanan Kepegawaian', 'Izin Cuti'],
    title: 'Izin Cuti',
    desc: 'Pengajuan dan persetujuan cuti pegawai',
    primaryBtn: { label: 'Ajukan Cuti', modal: 'modalCuti', icon: 'fa-plane' },
    stats: [
      { label: 'Diajukan', value: countBy(D.cuti, 'status', 'Diajukan'), icon: 'fa-hourglass-half', color: 'amber' },
      { label: 'Disetujui', value: countBy(D.cuti, 'status', 'Disetujui'), icon: 'fa-check-circle', color: 'green' },
      { label: 'Ditolak', value: countBy(D.cuti, 'status', 'Ditolak'), icon: 'fa-times-circle', color: 'red' },
      { label: 'Selesai', value: countBy(D.cuti, 'status', 'Selesai'), icon: 'fa-flag-checkered', color: 'blue' }
    ],
    toolbar: {
      search: { table: 'tblCuti', placeholder: 'Cari pemohon' },
      filters: [
        { table: 'tblCuti', col: 1, label: 'Filter Jenis Cuti', options: D.jenisCuti },
        { table: 'tblCuti', col: 5, label: 'Filter Status', options: ['Diajukan', 'Disetujui', 'Ditolak', 'Selesai'] }
      ],
      buttons: [
        { type: 'export', table: 'tblCuti', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblCuti',
      columns: [
        { label: 'Pemohon' },
        { label: 'Jenis Cuti', format: kepBadge },
        { label: 'Mulai' },
        { label: 'Selesai' },
        { label: 'Lama', format: (v) => '<strong>' + v + '</strong>' },
        { label: 'Status', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalCuti' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalCuti',
      title: 'Pengajuan Cuti',
      table: 'tblCuti',
      fields: [
        { name: 'pemohon', label: 'Pemohon', type: 'select', options: D.pegawai.map((p) => p.nama), required: true },
        { name: 'jenis', label: 'Jenis Cuti', type: 'select', options: D.jenisCuti, required: true },
        { name: 'mulai', label: 'Mulai', type: 'date', required: true },
        { name: 'selesai', label: 'Selesai', type: 'date', required: true },
        { name: 'lama', label: 'Lama Cuti' },
        { name: 'alasan', label: 'Alasan', type: 'textarea', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Diajukan', 'Disetujui', 'Ditolak', 'Selesai'] }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

router.get('/izin-cerai', async (req, res, next) => {
  const D = await kepdata.getKepData(['izinCerai', 'pegawai']);
  const rows = D.izinCerai.map((x) => [x.pegawai, x.nip, x.tanggal, x.status, x.tahapan]);
  const records = D.izinCerai.map((x) => ({ id: x.id, pegawai: x.pegawai, nip: x.nip, tanggal: x.tanggal, status: x.status }));
  const cfg = {
    breadcrumb: ['Layanan Kepegawaian', 'Izin Cerai'],
    title: 'Izin Cerai',
    desc: 'Administrasi izin perceraian pegawai',
    primaryBtn: { label: 'Ajukan Izin Cerai', modal: 'modalCerai', icon: 'fa-plus' },
    steps: [
      { label: 'Pengajuan', icon: 'fa-file-import', active: true },
      { label: 'Verifikasi', icon: 'fa-search' },
      { label: 'Pemeriksaan', icon: 'fa-clipboard-check' },
      { label: 'Persetujuan', icon: 'fa-check-double' },
      { label: 'Selesai', icon: 'fa-flag-checkered' }
    ],
    toolbar: {
      search: { table: 'tblCerai', placeholder: 'Cari pegawai/NIP' },
      filters: [
        { table: 'tblCerai', col: 3, label: 'Filter Status', options: ['Pengajuan', 'Verifikasi', 'Pemeriksaan', 'Persetujuan', 'Selesai'] }
      ],
      buttons: [
        { type: 'export', table: 'tblCerai', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblCerai',
      columns: [
        { label: 'Pegawai' },
        { label: 'NIP' },
        { label: 'Tanggal Pengajuan' },
        { label: 'Status', format: kepBadge },
        { label: 'Tahapan', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalCerai' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalCerai',
      title: 'Pengajuan Izin Cerai',
      table: 'tblCerai',
      fields: [
        { name: 'pegawai', label: 'Pegawai', type: 'select', options: D.pegawai.map((p) => p.nama), required: true },
        { name: 'nip', label: 'NIP', required: true },
        { name: 'tanggal', label: 'Tanggal Pengajuan', type: 'date', required: true },
        { name: 'alasan', label: 'Alasan', type: 'textarea', required: true },
        { name: 'file', label: 'Dokumen Pendukung', type: 'file' },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' }
      ]
    }
  };
  return renderModul(res, req, 'kep_workflow', cfg);
});

router.get('/slks', async (req, res, next) => {
  const D = await kepdata.getKepData(['slks', 'pegawai']);
  const rows = D.slks.map((s) => [s.nip, s.nama, s.masaKerja, s.kategori, s.tahun, s.status]);
  const records = D.slks.map((s) => ({ id: s.id, nip: s.nip, nama: s.nama, masaKerja: s.masaKerja, kategori: s.kategori, tahun: s.tahun, status: s.status }));
  const cfg = {
    breadcrumb: ['Layanan Kepegawaian', 'SLKS'],
    title: 'Satya Lencana Karya Satya',
    desc: 'Pengelolaan usulan penghargaan Satya Lencana Karya Satya',
    primaryBtn: { label: 'Usulan SLKS', modal: 'modalSlks', icon: 'fa-award' },
    stats: [
      { label: '10 Tahun', value: countBy(D.slks, 'kategori', '10 Tahun'), icon: 'fa-medal', color: 'blue' },
      { label: '20 Tahun', value: countBy(D.slks, 'kategori', '20 Tahun'), icon: 'fa-medal', color: 'cyan' },
      { label: '30 Tahun', value: countBy(D.slks, 'kategori', '30 Tahun'), icon: 'fa-medal', color: 'violet' }
    ],
    toolbar: {
      search: { table: 'tblSlks', placeholder: 'Cari NIP/nama' },
      filters: [
        { table: 'tblSlks', col: 3, label: 'Filter Kategori', options: ['10 Tahun', '20 Tahun', '30 Tahun'] },
        { table: 'tblSlks', col: 5, label: 'Filter Status', options: ['Diajukan', 'Diverifikasi', 'Diterima'] }
      ],
      buttons: [
        { act: 'verifikasi', label: 'Verifikasi', icon: 'fa-check-double' },
        { type: 'file', label: 'Upload Dokumen', icon: 'fa-upload' },
        { type: 'print', label: 'Cetak', icon: 'fa-print' },
        { type: 'export', table: 'tblSlks', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblSlks',
      columns: [
        { label: 'NIP' },
        { label: 'Nama' },
        { label: 'Masa Kerja', format: (v) => '<strong>' + v + '</strong>' },
        { label: 'Kategori', format: kepBadge },
        { label: 'Tahun' },
        { label: 'Status', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalSlks' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalSlks',
      title: 'Usulan SLKS',
      table: 'tblSlks',
      fields: [
        { name: 'nama', label: 'Nama Pegawai', type: 'select', options: D.pegawai.map((p) => p.nama), required: true },
        { name: 'nip', label: 'NIP', required: true },
        { name: 'masaKerja', label: 'Masa Kerja' },
        { name: 'kategori', label: 'Kategori', type: 'select', options: ['10 Tahun', '20 Tahun', '30 Tahun'], required: true },
        { name: 'tahun', label: 'Tahun', type: 'number', required: true },
        { name: 'file', label: 'Upload Dokumen', type: 'file' },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

router.get('/pengadaan-pegawai', async (req, res, next) => {
  const D = await kepdata.getKepData(['pengadaan', 'jabatanList', 'unitKerja']);
  const rows = D.pengadaan.map((p) => [p.formasi, p.jabatan, p.unit, p.jumlah, p.terisi, p.sisa, p.status]);
  const records = D.pengadaan.map((p) => ({ id: p.id, formasi: p.formasi, jabatan: p.jabatan, unit: p.unit, jumlah: p.jumlah, terisi: p.terisi, status: p.status }));
  const cfg = {
    breadcrumb: ['Status Kepegawaian', 'Pengadaan Pegawai'],
    title: 'Pengadaan Pegawai',
    desc: 'Formasi, usulan, seleksi, dan penempatan pegawai',
    primaryBtn: { label: 'Tambah Formasi', modal: 'modalPengadaan', icon: 'fa-plus' },
    stats: [
      { label: 'Formasi', value: D.pengadaan.length, icon: 'fa-table', color: 'blue' },
      { label: 'Usulan', value: countBy(D.pengadaan, 'status', 'Usulan'), icon: 'fa-file-import', color: 'amber' },
      { label: 'Seleksi', value: countBy(D.pengadaan, 'status', 'Seleksi'), icon: 'fa-user-check', color: 'violet' },
      { label: 'Diterima', value: countBy(D.pengadaan, 'status', 'Diterima'), icon: 'fa-check-circle', color: 'green' },
      { label: 'Penempatan', value: countBy(D.pengadaan, 'status', 'Penempatan'), icon: 'fa-map-marker-alt', color: 'cyan' }
    ],
    toolbar: {
      search: { table: 'tblPengadaan', placeholder: 'Cari formasi/jabatan' },
      filters: [
        { table: 'tblPengadaan', col: 0, label: 'Filter Formasi', options: ['Formasi 2024', 'Formasi 2025', 'Formasi 2026'] },
        { table: 'tblPengadaan', col: 6, label: 'Filter Status', options: ['Usulan', 'Seleksi', 'Diterima', 'Penempatan'] }
      ],
      buttons: [
        { type: 'export', table: 'tblPengadaan', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblPengadaan',
      columns: [
        { label: 'Formasi', format: kepBadge },
        { label: 'Jabatan' },
        { label: 'Unit Kerja' },
        { label: 'Jumlah', format: (v) => '<strong>' + v + '</strong>' },
        { label: 'Terisi' },
        { label: 'Sisa', format: (v) => (v > 0 ? '<span class="kep-badge kb-amber">' + v + '</span>' : '<span class="kep-badge kb-green">0</span>') },
        { label: 'Status', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalPengadaan' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalPengadaan',
      title: 'Tambah Formasi',
      table: 'tblPengadaan',
      fields: [
        { name: 'formasi', label: 'Formasi', type: 'select', options: ['Formasi 2024', 'Formasi 2025', 'Formasi 2026'], required: true },
        { name: 'jabatan', label: 'Jabatan', type: 'select', options: D.jabatanList, required: true },
        { name: 'unit', label: 'Unit Kerja', type: 'select', options: D.unitKerja },
        { name: 'jumlah', label: 'Jumlah', type: 'number', required: true },
        { name: 'terisi', label: 'Terisi', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['Usulan', 'Seleksi', 'Diterima', 'Penempatan'] }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

router.get('/pensiun', async (req, res, next) => {
  const D = await kepdata.getKepData(['pensiun']);
  const rows = D.pensiun.map((p) => [p.nip, p.nama, p.jabatan, p.tglLahir, p.bup, p.perkiraan, p.status]);
  const records = D.pensiun.map((p) => ({ id: p.id, nip: p.nip, nama: p.nama, jabatan: p.jabatan, tglLahir: p.tglLahir, status: p.status }));
  const cfg = {
    breadcrumb: ['Status Kepegawaian', 'Pensiun'],
    title: 'Pensiun',
    desc: 'Monitoring masa persiapan pensiun pegawai',
    stats: [
      { label: 'Pensiun Tahun Ini', value: countBy(D.pensiun, 'status', 'Bulan Ini'), icon: 'fa-hourglass-end', color: 'red' },
      { label: '1 Tahun Lagi', value: countBy(D.pensiun, 'status', '1 Tahun Lagi'), icon: 'fa-calendar-day', color: 'amber' },
      { label: '2 Tahun Lagi', value: countBy(D.pensiun, 'status', '2 Tahun Lagi'), icon: 'fa-calendar-week', color: 'blue' },
      { label: 'Sudah Diproses', value: countBy(D.pensiun, 'status', 'Sudah Diproses'), icon: 'fa-check-double', color: 'green' }
    ],
    toolbar: {
      search: { table: 'tblPensiun', placeholder: 'Cari NIP/nama' },
      filters: [
        { table: 'tblPensiun', col: 6, label: 'Filter Status', options: ['Bulan Ini', '1 Tahun Lagi', '2 Tahun Lagi', 'Sudah Diproses'] }
      ],
      buttons: [
        { type: 'export', table: 'tblPensiun', label: 'Export', icon: 'fa-file-export' },
        { type: 'print', label: 'Cetak', icon: 'fa-print' }
      ]
    },
    table: {
      id: 'tblPensiun',
      columns: [
        { label: 'NIP' },
        { label: 'Nama' },
        { label: 'Jabatan' },
        { label: 'Tanggal Lahir' },
        { label: 'BUP' },
        { label: 'Perkiraan Pensiun' },
        { label: 'Status', format: (v) => {
          const m = { 'Bulan Ini': 'kb-red', '1 Tahun Lagi': 'kb-amber', '2 Tahun Lagi': 'kb-blue', 'Sudah Diproses': 'kb-green' };
          return '<span class="kep-badge ' + (m[v] || 'kb-gray') + '">' + v + '</span>';
        } }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

router.get('/pindah-tugas', async (req, res, next) => {
  const D = await kepdata.getKepData(['pindahTugas', 'pegawai', 'unitKerja']);
  const rows = D.pindahTugas.map((x) => [x.pegawai, x.asal, x.tujuan, x.tanggal, x.status]);
  const records = D.pindahTugas.map((x) => ({ id: x.id, pegawai: x.pegawai, asal: x.asal, tujuan: x.tujuan, tanggal: x.tanggal, status: x.status }));
  const cfg = {
    breadcrumb: ['Status Kepegawaian', 'Pindah Tugas'],
    title: 'Pindah Tugas',
    desc: 'Pengajuan dan persetujuan pindah tugas pegawai',
    primaryBtn: { label: 'Ajukan Pindah', modal: 'modalPindah', icon: 'fa-exchange-alt' },
    steps: [
      { label: 'Pengajuan', icon: 'fa-file-import', active: true },
      { label: 'Verifikasi', icon: 'fa-search' },
      { label: 'Persetujuan', icon: 'fa-check-double' },
      { label: 'SK', icon: 'fa-file-signature' },
      { label: 'Selesai', icon: 'fa-flag-checkered' }
    ],
    toolbar: {
      search: { table: 'tblPindah', placeholder: 'Cari pegawai' },
      filters: [
        { table: 'tblPindah', col: 4, label: 'Filter Status', options: ['Pengajuan', 'Verifikasi', 'Persetujuan', 'SK', 'Selesai'] }
      ],
      buttons: [
        { type: 'export', table: 'tblPindah', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblPindah',
      columns: [
        { label: 'Pegawai' },
        { label: 'Unit Asal' },
        { label: 'Unit Tujuan' },
        { label: 'Tanggal Pengajuan' },
        { label: 'Status', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalPindah' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalPindah',
      title: 'Pengajuan Pindah Tugas',
      table: 'tblPindah',
      fields: [
        { name: 'pegawai', label: 'Pegawai', type: 'select', options: D.pegawai.map((p) => p.nama), required: true },
        { name: 'asal', label: 'Unit Asal', type: 'select', options: D.unitKerja, required: true },
        { name: 'tujuan', label: 'Unit Tujuan', type: 'select', options: D.unitKerja, required: true },
        { name: 'tanggal', label: 'Tanggal Pengajuan', type: 'date', required: true },
        { name: 'alasan', label: 'Alasan', type: 'textarea' }
      ]
    }
  };
  return renderModul(res, req, 'kep_workflow', cfg);
});

router.get('/penempatan-tugas', async (req, res, next) => {
  const D = await kepdata.getKepData(['penempatan', 'pegawai', 'jabatanList', 'unitKerja']);
  const rows = D.penempatan.map((x) => [x.pegawai, x.jabatan, x.unit, x.tugas, x.tmt, x.status]);
  const records = D.penempatan.map((x) => ({ id: x.id, pegawai: x.pegawai, jabatan: x.jabatan, unit: x.unit, tugas: x.tugas, tmt: x.tmt, status: x.status }));
  const cfg = {
    breadcrumb: ['Status Kepegawaian', 'Penempatan Tugas'],
    title: 'Penempatan Tugas',
    desc: 'Pengaturan penempatan pegawai pada unit kerja',
    primaryBtn: { label: 'Tambah Penempatan', modal: 'modalTempat', icon: 'fa-map-marker-alt' },
    tree: (function () {
      const p = D.penempatan[0] || {};
      return [
        { label: 'Unit Kerja', value: p.unit || '-', icon: 'fa-building', color1: '#4f46e5', color2: '#7c3aed' },
        { label: 'Jabatan', value: p.jabatan || '-', icon: 'fa-briefcase', color1: '#06b6d4', color2: '#3b82f6' },
        { label: 'Pegawai', value: p.pegawai || '-', icon: 'fa-user-tie', color1: '#10b981', color2: '#14b8a6' }
      ];
    })(),
    toolbar: {
      search: { table: 'tblTempat', placeholder: 'Cari pegawai' },
      filters: [
        { table: 'tblTempat', col: 2, label: 'Filter Unit', options: D.unitKerja },
        { table: 'tblTempat', col: 5, label: 'Filter Status', options: ['Aktif', 'Cuti'] }
      ],
      buttons: [
        { type: 'export', table: 'tblTempat', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblTempat',
      columns: [
        { label: 'Pegawai' },
        { label: 'Jabatan' },
        { label: 'Unit Kerja' },
        { label: 'Tugas' },
        { label: 'TMT' },
        { label: 'Status', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalTempat' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalTempat',
      title: 'Tambah Penempatan',
      table: 'tblTempat',
      fields: [
        { name: 'pegawai', label: 'Pegawai', type: 'select', options: D.pegawai.map((p) => p.nama), required: true },
        { name: 'jabatan', label: 'Jabatan', type: 'select', options: D.jabatanList, required: true },
        { name: 'unit', label: 'Unit Kerja', type: 'select', options: D.unitKerja, required: true },
        { name: 'tugas', label: 'Tugas', required: true },
        { name: 'tmt', label: 'TMT', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Cuti'] }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

router.get('/disiplin-pegawai', async (req, res, next) => {
  const D = await kepdata.getKepData(['disiplin', 'pegawai']);
  const rows = D.disiplin.map((x) => [x.pegawai, x.pelanggaran, x.tanggal, x.tingkat, x.status]);
  const records = D.disiplin.map((x) => ({ id: x.id, pegawai: x.pegawai, pelanggaran: x.pelanggaran, tanggal: x.tanggal, tingkat: x.tingkat, status: x.status }));
  const inProcess = D.disiplin.filter((x) => ['Pemeriksaan', 'Pembinaan', 'Keputusan'].includes(x.status)).length;
  const cfg = {
    breadcrumb: ['Status Kepegawaian', 'Disiplin Pegawai'],
    title: 'Disiplin Pegawai',
    desc: 'Penanganan pelanggaran dan penegakan disiplin pegawai',
    primaryBtn: { label: 'Tambah Kasus', modal: 'modalDisiplin', icon: 'fa-gavel' },
    stats: [
      { label: 'Total Kasus', value: D.disiplin.length, icon: 'fa-folder-open', color: 'blue' },
      { label: 'Dalam Pemeriksaan', value: inProcess, icon: 'fa-search', color: 'violet' },
      { label: 'Selesai', value: countBy(D.disiplin, 'status', 'Selesai'), icon: 'fa-check-circle', color: 'green' },
      { label: 'Peringatan', value: countBy(D.disiplin, 'status', 'Peringatan'), icon: 'fa-exclamation-triangle', color: 'red' }
    ],
    steps: [
      { label: 'Laporan', icon: 'fa-file-import', active: true },
      { label: 'Pemeriksaan', icon: 'fa-search' },
      { label: 'Pembinaan', icon: 'fa-hands-helping' },
      { label: 'Keputusan', icon: 'fa-gavel' },
      { label: 'Selesai', icon: 'fa-flag-checkered' }
    ],
    toolbar: {
      search: { table: 'tblDisiplin', placeholder: 'Cari pegawai' },
      filters: [
        { table: 'tblDisiplin', col: 4, label: 'Filter Status', options: ['Pemeriksaan', 'Pembinaan', 'Keputusan', 'Peringatan', 'Selesai'] }
      ],
      buttons: [
        { type: 'export', table: 'tblDisiplin', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblDisiplin',
      columns: [
        { label: 'Pegawai' },
        { label: 'Jenis Pelanggaran' },
        { label: 'Tanggal' },
        { label: 'Tingkat', format: kepBadge },
        { label: 'Status', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalDisiplin' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalDisiplin',
      title: 'Tambah Kasus Disiplin',
      table: 'tblDisiplin',
      fields: [
        { name: 'pegawai', label: 'Pegawai', type: 'select', options: D.pegawai.map((p) => p.nama), required: true },
        { name: 'pelanggaran', label: 'Jenis Pelanggaran', required: true },
        { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
        { name: 'tingkat', label: 'Tingkat', type: 'select', options: ['Ringan', 'Sedang', 'Berat'], required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Pemeriksaan', 'Pembinaan', 'Keputusan', 'Peringatan', 'Selesai'] },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' }
      ]
    }
  };
  return renderModul(res, req, 'kep_workflow', cfg);
});

router.get('/diklat-struktural', async (req, res, next) => {
  const D = await kepdata.getKepData(['diklatStruktural', 'pegawai']);
  const rows = D.diklatStruktural.map((x) => [x.pegawai, x.diklat, x.penyelenggara, x.tahun, x.durasi, x.status, x.sertifikat]);
  const records = D.diklatStruktural.map((x) => ({ id: x.id, pegawai: x.pegawai, diklat: x.diklat, penyelenggara: x.penyelenggara, tahun: x.tahun, durasi: x.durasi, status: x.status, sertifikat: x.sertifikat }));
  const cfg = {
    breadcrumb: ['Pengembangan Pegawai', 'Diklat Struktural'],
    title: 'Diklat Struktural',
    desc: 'Diklat kepemimpinan struktural pegawai',
    primaryBtn: { label: 'Tambah Diklat', modal: 'modalDiklatS', icon: 'fa-plus' },
    toolbar: {
      search: { table: 'tblDiklatS', placeholder: 'Cari pegawai/nama diklat' },
      filters: [
        { table: 'tblDiklatS', col: 5, label: 'Filter Status', options: ['Selesai', 'Berjalan'] }
      ],
      buttons: [
        { type: 'file', label: 'Upload Sertifikat', icon: 'fa-upload' },
        { type: 'export', table: 'tblDiklatS', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblDiklatS',
      columns: [
        { label: 'Pegawai' },
        { label: 'Nama Diklat' },
        { label: 'Penyelenggara' },
        { label: 'Tahun', format: (v) => '<strong>' + v + '</strong>' },
        { label: 'Durasi' },
        { label: 'Status', format: kepBadge },
        { label: 'Sertifikat', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalDiklatS' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalDiklatS',
      title: 'Tambah Diklat Struktural',
      table: 'tblDiklatS',
      fields: [
        { name: 'pegawai', label: 'Pegawai', type: 'select', options: D.pegawai.map((p) => p.nama), required: true },
        { name: 'diklat', label: 'Nama Diklat', required: true },
        { name: 'penyelenggara', label: 'Penyelenggara', required: true },
        { name: 'tahun', label: 'Tahun', type: 'number', required: true },
        { name: 'durasi', label: 'Durasi' },
        { name: 'status', label: 'Status', type: 'select', options: ['Selesai', 'Berjalan'] },
        { name: 'sertifikat', label: 'Sertifikat', type: 'select', options: ['Ada', 'Belum'] }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

router.get('/diklat-teknis', async (req, res, next) => {
  const D = await kepdata.getKepData(['diklatTeknis', 'pegawai']);
  const rows = D.diklatTeknis.map((x) => [x.pegawai, x.diklat, x.kategori, x.penyelenggara, x.tahun, x.durasi, x.status, x.sertifikat]);
  const records = D.diklatTeknis.map((x) => ({ id: x.id, pegawai: x.pegawai, diklat: x.diklat, kategori: x.kategori, penyelenggara: x.penyelenggara, tahun: x.tahun, durasi: x.durasi, status: x.status, sertifikat: x.sertifikat }));
  const cfg = {
    breadcrumb: ['Pengembangan Pegawai', 'Diklat Teknis'],
    title: 'Diklat Teknis',
    desc: 'Pelatihan teknis dan fungsional pegawai',
    primaryBtn: { label: 'Tambah Diklat', modal: 'modalDiklatT', icon: 'fa-plus' },
    toolbar: {
      search: { table: 'tblDiklatT', placeholder: 'Cari pegawai/nama diklat' },
      filters: [
        { table: 'tblDiklatT', col: 2, label: 'Filter Kategori', options: ['Teknis Pendidikan', 'Teknis Administrasi', 'Teknis IT', 'Teknis Manajemen', 'Teknis Kepegawaian', 'Lainnya'] },
        { table: 'tblDiklatT', col: 6, label: 'Filter Status', options: ['Selesai', 'Berjalan'] }
      ],
      buttons: [
        { type: 'file', label: 'Upload Sertifikat', icon: 'fa-upload' },
        { type: 'export', table: 'tblDiklatT', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblDiklatT',
      columns: [
        { label: 'Pegawai' },
        { label: 'Nama Diklat' },
        { label: 'Kategori', format: kepBadge },
        { label: 'Penyelenggara' },
        { label: 'Tahun', format: (v) => '<strong>' + v + '</strong>' },
        { label: 'Durasi' },
        { label: 'Status', format: kepBadge },
        { label: 'Sertifikat', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalDiklatT' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalDiklatT',
      title: 'Tambah Diklat Teknis',
      table: 'tblDiklatT',
      fields: [
        { name: 'pegawai', label: 'Pegawai', type: 'select', options: D.pegawai.map((p) => p.nama), required: true },
        { name: 'diklat', label: 'Nama Diklat', required: true },
        { name: 'kategori', label: 'Kategori', type: 'select', options: ['Teknis Pendidikan', 'Teknis Administrasi', 'Teknis IT', 'Teknis Manajemen', 'Teknis Kepegawaian', 'Lainnya'] },
        { name: 'penyelenggara', label: 'Penyelenggara', required: true },
        { name: 'tahun', label: 'Tahun', type: 'number', required: true },
        { name: 'durasi', label: 'Durasi' },
        { name: 'status', label: 'Status', type: 'select', options: ['Selesai', 'Berjalan'] },
        { name: 'sertifikat', label: 'Sertifikat', type: 'select', options: ['Ada', 'Belum'] }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

router.get('/izin-belajar', async (req, res, next) => {
  const D = await kepdata.getKepData(['izinBelajar', 'pegawai']);
  const rows = D.izinBelajar.map((x) => [x.pegawai, x.pendidikan, x.prodi, x.pt, x.tahun, x.status]);
  const records = D.izinBelajar.map((x) => ({ id: x.id, pegawai: x.pegawai, pendidikan: x.pendidikan, prodi: x.prodi, pt: x.pt, tahun: x.tahun, status: x.status }));
  const cfg = {
    breadcrumb: ['Pengembangan Pegawai', 'Izin Belajar'],
    title: 'Izin Belajar',
    desc: 'Pengajuan izin belajar pegawai',
    primaryBtn: { label: 'Ajukan Izin Belajar', modal: 'modalBelajar', icon: 'fa-book-open' },
    steps: [
      { label: 'Pengajuan', icon: 'fa-file-import', active: true },
      { label: 'Verifikasi', icon: 'fa-search' },
      { label: 'Persetujuan', icon: 'fa-check-double' },
      { label: 'Izin Terbit', icon: 'fa-file-signature' },
      { label: 'Selesai', icon: 'fa-flag-checkered' }
    ],
    toolbar: {
      search: { table: 'tblBelajar', placeholder: 'Cari pegawai' },
      filters: [
        { table: 'tblBelajar', col: 5, label: 'Filter Status', options: ['Pengajuan', 'Verifikasi', 'Persetujuan', 'Izin Terbit', 'Selesai'] }
      ],
      buttons: [
        { type: 'export', table: 'tblBelajar', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblBelajar',
      columns: [
        { label: 'Pegawai' },
        { label: 'Pendidikan', format: kepBadge },
        { label: 'Program Studi' },
        { label: 'Perguruan Tinggi' },
        { label: 'Tahun', format: (v) => '<strong>' + v + '</strong>' },
        { label: 'Status', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalBelajar' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalBelajar',
      title: 'Pengajuan Izin Belajar',
      table: 'tblBelajar',
      fields: [
        { name: 'pegawai', label: 'Pegawai', type: 'select', options: D.pegawai.map((p) => p.nama), required: true },
        { name: 'pendidikan', label: 'Pendidikan', type: 'select', options: ['SMA', 'D3', 'S1', 'S2', 'S3'] },
        { name: 'prodi', label: 'Program Studi', required: true },
        { name: 'pt', label: 'Perguruan Tinggi', required: true },
        { name: 'tahun', label: 'Tahun', type: 'number', required: true },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' }
      ]
    }
  };
  return renderModul(res, req, 'kep_workflow', cfg);
});

router.get('/tugas-belajar', async (req, res, next) => {
  const D = await kepdata.getKepData(['tugasBelajar', 'pegawai']);
  const rows = D.tugasBelajar.map((x) => [x.pegawai, x.jenjang, x.prodi, x.pt, x.biaya, x.status]);
  const records = D.tugasBelajar.map((x) => ({ id: x.id, pegawai: x.pegawai, jenjang: x.jenjang, prodi: x.prodi, pt: x.pt, biaya: x.biaya, status: x.status }));
  const cfg = {
    breadcrumb: ['Pengembangan Pegawai', 'Tugas Belajar'],
    title: 'Tugas Belajar',
    desc: 'Pengajuan tugas belajar pegawai',
    primaryBtn: { label: 'Ajukan Tugas Belajar', modal: 'modalTugas', icon: 'fa-graduation-cap' },
    toolbar: {
      search: { table: 'tblTugas', placeholder: 'Cari pegawai' },
      filters: [
        { table: 'tblTugas', col: 5, label: 'Filter Status', options: ['Pengajuan', 'Verifikasi', 'Disetujui', 'Sedang Belajar', 'Selesai'] }
      ],
      buttons: [
        { type: 'export', table: 'tblTugas', label: 'Export', icon: 'fa-file-export' }
      ]
    },
    table: {
      id: 'tblTugas',
      columns: [
        { label: 'Pegawai' },
        { label: 'Jenjang', format: kepBadge },
        { label: 'Program Studi' },
        { label: 'Perguruan Tinggi' },
        { label: 'Sumber Biaya', format: kepBadge },
        { label: 'Status', format: kepBadge }
      ],
      rows,
      records,
      actions: [
        { act: 'detail', icon: 'fa-eye', label: 'Detail' },
        { act: 'edit', icon: 'fa-edit', label: 'Edit', modal: 'modalTugas' },
        { act: 'hapus', icon: 'fa-trash', label: 'Hapus' }
      ]
    },
    modal: {
      id: 'modalTugas',
      title: 'Pengajuan Tugas Belajar',
      table: 'tblTugas',
      fields: [
        { name: 'pegawai', label: 'Pegawai', type: 'select', options: D.pegawai.map((p) => p.nama), required: true },
        { name: 'jenjang', label: 'Jenjang', type: 'select', options: ['SMA', 'D3', 'S1', 'S2', 'S3'] },
        { name: 'prodi', label: 'Program Studi', required: true },
        { name: 'pt', label: 'Perguruan Tinggi', required: true },
        { name: 'biaya', label: 'Sumber Biaya', type: 'select', options: ['APBN', 'APBD', 'Mandiri'] },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea' }
      ]
    }
  };
  return renderModul(res, req, 'kep_table', cfg);
});

// ---------- Periode PPPK ----------
function pppkToday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

router.get('/periode-pppk', async (req, res, next) => {
  const member = req.session.MEMBER;
  const D = await kepdata.getKepData(['pegawai']);
  const role = member ? member.role : '';
  const unit = member ? String(member.unit || '') : '';

  const today = pppkToday();

  function pppkMasaTahun(jenis) {
    return /paruh waktu/i.test(String(jenis || '')) ? 1 : 5;
  }

  function pppkValidTmt(v) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '').trim());
  }

  function pppkHitungBerakhir(mulai, masa) {
    const m = String(mulai || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return '';
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    d.setUTCFullYear(d.getUTCFullYear() + masa);
    return d.toISOString().slice(0, 10);
  }

  // Periode ke-berapa yang sedang berjalan, dihitung menumpuk dari TMT:
  // periode ke-1 = TMT s.d. TMT+masa, ke-2 = TMT+masa s.d. TMT+2*masa, dst.
  // Artinya pegawai yang statusnya BERAKHIR sudah berada di periode berikutnya.
  function pppkPeriodeKe(tmt, masa, today) {
    if (!pppkValidTmt(tmt)) return null;
    const m = String(tmt).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const base = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    let ke = 1;
    for (;;) {
      const s = new Date(base);
      s.setUTCFullYear(s.getUTCFullYear() + (ke - 1) * masa);
      const startDate = new Date(s.toISOString().slice(0, 10) + 'T00:00:00');
      if (startDate > today) break;
      const e = new Date(base);
      e.setUTCFullYear(e.getUTCFullYear() + ke * masa);
      const endDate = new Date(e.toISOString().slice(0, 10) + 'T00:00:00');
      if (today <= endDate) return ke;
      ke++;
      if (ke > 500) return ke;
    }
    return ke;
  }

  // Single source of truth: seluruh periode diturunkan dari Profil Pegawai.
  let list = (D.pegawai || [])
    .filter((p) => /pppk/i.test(String(p.jenis || '')))
    .map((p) => {
      const masa = pppkMasaTahun(p.jenis);
      const tmt = pppkValidTmt(p.tmt) ? String(p.tmt).slice(0, 10) : '';
      const berakhir = tmt ? pppkHitungBerakhir(tmt, masa) : '';
      let sisa = null;
      let status = 'BELUM LENGKAP';
      if (tmt && berakhir) {
        const md = new Date(tmt + 'T00:00:00');
        const bd = new Date(berakhir + 'T00:00:00');
        sisa = Math.floor((bd - today) / 86400000);
        if (bd < today) status = 'BERAKHIR';
        else if (md > today) status = 'BELUM AKTIF';
        else if (sisa <= 90) status = 'SEGERA BERAKHIR';
        else status = 'AKTIF';
      }
      return {
        id: p.id,
        nama: p.nama,
        nip: p.nip,
        nik: p.nik,
        nuptk: '',
        statusKepegawaian: isPppkParuhWaktu(p.jenis) ? 'PPPK Paruh Waktu' : 'PPPK',
        jabatan: p.jabatan,
        sekolah: p.unit || p.sekolah || '',
        tmt,
        masaTahun: masa,
        masaLabel: masa + ' Tahun',
        periodeKe: tmt ? pppkPeriodeKe(tmt, masa, today) : null,
        tanggalMulai: tmt,
        tanggalBerakhir: berakhir,
        sisa,
        status
      };
    });

  if (role === 'staff') {
    list = list.filter((x) => x.sekolah === unit);
  }
  list.sort((a, b) => {
    const ta = a.tanggalBerakhir ? new Date(a.tanggalBerakhir + 'T00:00:00').getTime() : Infinity;
    const tb = b.tanggalBerakhir ? new Date(b.tanggalBerakhir + 'T00:00:00').getTime() : Infinity;
    return ta - tb;
  });

  const kepegList = ['PPPK', 'PPPK Paruh Waktu'];
  const statusList = ['AKTIF', 'BELUM AKTIF', 'SEGERA BERAKHIR', 'BERAKHIR', 'BELUM LENGKAP'];
  const sekolahSet = new Set();
  const tahunSet = new Set();
  list.forEach((x) => {
    if (x.sekolah) sekolahSet.add(x.sekolah);
    if (x.tmt) tahunSet.add(x.tmt.slice(0, 4));
  });

  const cfg = {
    breadcrumb: ['Layanan Kepegawaian', 'Periode PPPK'],
    title: 'Periode PPPK',
    desc: 'Daftar periode masa kerja PPPK diturunkan otomatis dari Profil Pegawai',
    pppk: {
      rows: list,
      kepegList,
      statusList,
      sekolahList: Array.from(sekolahSet),
      tahunList: Array.from(tahunSet).sort()
    }
  };
  return renderModul(res, req, 'kep_pppk', cfg);
});

router.get('/kelola-menu', async (req, res, next) => {
  try {
    const rows = await menuModel.all();
    const cfg = {
      breadcrumb: ['Master Data', 'Kelola Menu'],
      title: 'Kelola Menu',
      desc: 'Atur menu aplikasi dan hak akses tampilnya untuk tiap peran.',
      primaryBtn: { label: 'Tambah Menu', modal: 'modalMenu', icon: 'fa-plus' },
      menuRows: rows
    };
    return renderModul(res, req, 'kelola_menu', cfg);
  } catch (err) {
    return next(err);
  }
});

// Analytics & Audit Route
router.get('/analytics', async (req, res, next) => {
  if (!req.session.MEMBER) {
    return res.redirect('/?hal=form_login');
  }
  if (req.session.MEMBER.role !== 'administrator') {
    return res.render('pages/denied');
  }
  try {
    res.render('pages/analytics', {
      title: 'Analytics & Audit',
      MEMBER: req.session.MEMBER
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
