(function () {
  var CFG = window.PPPK_CFG || {};
  var PAGE_SIZE = 10;
  var state = { page: 0, search: '', kepeg: '', status: '', sekolah: '', tahun: '' };

  function esc(s) {
    if (window.kepEscapeHtml) return window.kepEscapeHtml(s);
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg) {
    if (window.kepToast) return window.kepToast(msg);
    alert(msg);
  }

  function pick(r, a, b) { return r[a] !== undefined ? r[a] : r[b]; }

  function today0() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function statusOf(r) {
    if (r.status) return r.status;
    var t = today0();
    var m = r.tanggalMulai ? new Date(r.tanggalMulai + 'T00:00:00') : null;
    var b = r.tanggalBerakhir ? new Date(r.tanggalBerakhir + 'T00:00:00') : null;
    if (!r.tanggalMulai && !r.tanggalBerakhir) return 'BELUM LENGKAP';
    if (b && b.getTime() < t.getTime()) return 'BERAKHIR';
    if (m && m.getTime() > t.getTime()) return 'BELUM AKTIF';
    if (b) {
      var sisa = Math.floor((b.getTime() - t.getTime()) / 86400000);
      if (sisa <= 90) return 'SEGERA BERAKHIR';
    }
    return 'AKTIF';
  }

  function sisaOf(r) {
    if (r.sisa !== undefined && r.sisa !== null) return r.sisa;
    var t = today0();
    var b = r.tanggalBerakhir ? new Date(r.tanggalBerakhir + 'T00:00:00') : null;
    if (!b) return null;
    return Math.floor((b.getTime() - t.getTime()) / 86400000);
  }

  function toRow(r) {
    return {
      id: pick(r, 'id', 'id'),
      nama: pick(r, 'nama', 'nama'),
      nip: pick(r, 'nip', 'nip'),
      nik: pick(r, 'nik', 'nik'),
      nuptk: pick(r, 'nuptk', 'nuptk'),
      statusKepegawaian: pick(r, 'statusKepegawaian', 'status_kepegawaian'),
      jabatan: pick(r, 'jabatan', 'jabatan'),
      sekolah: pick(r, 'sekolah', 'sekolah'),
      tmt: pick(r, 'tmt', 'tmt'),
      tanggalMulai: pick(r, 'tanggalMulai', 'tanggal_mulai'),
      tanggalBerakhir: pick(r, 'tanggalBerakhir', 'tanggal_berakhir'),
      masaLabel: pick(r, 'masaLabel', 'masa_label'),
      sisa: pick(r, 'sisa', 'sisa'),
      status: pick(r, 'status', 'status')
    };
  }

  var BADGE = {
    'AKTIF': 'kb-green',
    'BELUM AKTIF': 'kb-gray',
    'SEGERA BERAKHIR': 'kb-amber',
    'BERAKHIR': 'kb-red',
    'BELUM LENGKAP': 'kb-gray'
  };
  var BADGE_LABEL = {
    'AKTIF': 'Aktif',
    'BELUM AKTIF': 'Belum Aktif',
    'SEGERA BERAKHIR': 'Segera Berakhir',
    'BERAKHIR': 'Berakhir',
    'BELUM LENGKAP': 'Belum Lengkap'
  };

  function statusBadge(r) {
    var st = statusOf(r);
    var cls = BADGE[st] || 'kb-gray';
    return '<span class="kep-badge ' + cls + '">' + esc(BADGE_LABEL[st] || st) + '</span>';
  }

  function masaLabel(r) {
    if (statusOf(r) === 'BELUM LENGKAP') return '-';
    if (r.masaLabel) return r.masaLabel;
    if (r.tanggalMulai && r.tanggalBerakhir) {
      var a = new Date(r.tanggalMulai + 'T00:00:00');
      var b = new Date(r.tanggalBerakhir + 'T00:00:00');
      var hari = Math.round((b - a) / 86400000) + 1;
      var bulan = Math.floor(hari / 30);
      return (bulan > 0 ? bulan + ' bln ' : '') + (hari % 30) + ' hr';
    }
    return '-';
  }

  function sisaText(r) {
    if (statusOf(r) === 'BELUM LENGKAP') return '-';
    if (statusOf(r) === 'BERAKHIR') return 'Habis';
    var s = sisaOf(r);
    return s === null || s === undefined ? '-' : s + ' hari';
  }

  function filtered() {
    var q = (state.search || '').toLowerCase().trim();
    var out = [];
    (CFG.rows || []).forEach(function (x) {
      var r = toRow(x);
      if (state.kepeg && r.statusKepegawaian !== state.kepeg) return;
      if (state.status && statusOf(r) !== state.status) return;
      if (state.sekolah && r.sekolah !== state.sekolah) return;
      if (state.tahun && String(r.tmt || '').slice(0, 4) !== state.tahun) return;
      if (q) {
        var hay = (r.nama + ' ' + (r.nip || '') + ' ' + (r.nik || '') + ' ' + (r.sekolah || '') + ' ' + (r.jabatan || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return;
      }
      out.push(r);
    });
    return out;
  }

  function render() {
    var rows = filtered();
    var body = document.getElementById('pppkBody');
    body.innerHTML = '';
    if (!rows.length) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="15" class="pppk-empty"><i class="fas fa-folder-open"></i>Belum ada data pegawai PPPK. Tambahkan atau lengkapi data PPPK melalui menu Profil Pegawai.</td>';
      body.appendChild(tr);
      renderPager(0, 0);
      return;
    }
    var pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.page > pages - 1) state.page = pages - 1;
    var from = state.page * PAGE_SIZE;
    var slice = rows.slice(from, from + PAGE_SIZE);
    slice.forEach(function (r, i) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="kep-no">' + (from + i + 1) + '</td>' +
        '<td><strong>' + esc(r.nama) + '</strong></td>' +
        '<td>' + esc(r.nip) + '</td>' +
        '<td>' + esc(r.nik) + '</td>' +
        '<td>' + (r.nuptk ? esc(r.nuptk) : '-') + '</td>' +
        '<td>' + esc(r.statusKepegawaian) + '</td>' +
        '<td>' + esc(r.jabatan) + '</td>' +
        '<td>' + esc(r.sekolah) + '</td>' +
        '<td>' + (r.tmt ? esc(r.tmt) : '-') + '</td>' +
        '<td>' + (r.tanggalMulai ? esc(r.tanggalMulai) : '-') + '</td>' +
        '<td>' + (r.tanggalBerakhir ? esc(r.tanggalBerakhir) : '-') + '</td>' +
        '<td>' + esc(masaLabel(r)) + '</td>' +
        '<td>' + sisaText(r) + '</td>' +
        '<td>' + statusBadge(r) + '</td>' +
        '<td class="kep-td-act">' +
          '<a class="btn btn-sm btn-outline-primary btn-kep-sm" href="/profil-pegawai/detail/' + esc(r.id) + '"><i class="fas fa-user"></i> Profil</a> ' +
          '<button type="button" class="btn btn-sm btn-outline-secondary btn-kep-sm pppk-detail" data-id="' + esc(r.id) + '"><i class="fas fa-eye"></i> Detail</button>' +
        '</td>';
      body.appendChild(tr);
    });
    renderPager(pages, rows.length);
  }

  function renderPager(pages, total) {
    var pager = document.querySelector('.pppk-pager');
    if (!pager) return;
    pager.innerHTML = '';
    var info = document.createElement('span');
    info.className = 'kep-page-info';
    var shown = Math.min(PAGE_SIZE, total);
    info.textContent = 'Menampilkan ' + shown + ' dari ' + total + ' data';
    pager.appendChild(info);
    if (pages <= 1) return;
    function btn(label, pg, active) {
      var b = document.createElement('button');
      b.className = 'kep-page-btn' + (active ? ' active' : '');
      b.textContent = label;
      b.addEventListener('click', function () { state.page = pg; render(); });
      pager.appendChild(b);
    }
    var cur = state.page;
    if (cur > 0) btn('‹', cur - 1, false);
    var start = Math.max(0, cur - 2);
    var end = Math.min(pages - 1, cur + 2);
    for (var i = start; i <= end; i++) btn(i + 1, i, i === cur);
    if (cur < pages - 1) btn('›', cur + 1, false);
  }

  function openDetail(r) {
    var body = document.getElementById('pppkDetailBody');
    var items = [
      ['Nama Pegawai', esc(r.nama)],
      ['NIP/NI PPPK', esc(r.nip)],
      ['NIK', esc(r.nik)],
      ['NUPTK', r.nuptk ? esc(r.nuptk) : '-'],
      ['Status Kepegawaian', esc(r.statusKepegawaian)],
      ['Jabatan', esc(r.jabatan)],
      ['Unit Kerja/Sekolah', esc(r.sekolah)],
      ['TMT PPPK', r.tmt ? esc(r.tmt) : '-'],
      ['Masa Kontrak', esc(masaLabel(r))],
      ['Tanggal Mulai Kontrak', r.tanggalMulai ? esc(r.tanggalMulai) : '-'],
      ['Tanggal Akhir Kontrak', r.tanggalBerakhir ? esc(r.tanggalBerakhir) : '-'],
      ['Sisa Masa Kontrak', sisaText(r)],
      ['Status Periode', statusBadge(r)]
    ];
    body.innerHTML = items.map(function (it) {
      return '<tr><th>' + it[0] + '</th><td>' + it[1] + '</td></tr>';
    }).join('');
    $('#modalPppkDetail').modal('show');
  }

  function exportXls() {
    var rows = filtered();
    var headers = ['Nama Pegawai', 'NIP/NI', 'NIK', 'NUPTK', 'Status Kepegawaian', 'Jabatan', 'Sekolah', 'TMT', 'Tgl. Mulai Kontrak', 'Tgl. Akhir Kontrak', 'Masa Kontrak', 'Sisa Masa Kontrak', 'Status'];
    var csv = headers.join(';') + '\r\n';
    rows.forEach(function (r) {
      var vals = [
        r.nama, r.nip, r.nik, r.nuptk || '', r.statusKepegawaian, r.jabatan, r.sekolah,
        r.tmt || '', r.tanggalMulai || '', r.tanggalBerakhir || '',
        masaLabel(r), sisaText(r), statusOf(r)
      ];
      csv += vals.map(function (v) {
        return '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"';
      }).join(';') + '\r\n';
    });
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pegawai-pppk.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Data berhasil diexport ke CSV (buka dengan Excel).');
  }

  document.addEventListener('input', function (e) {
    if (e.target.classList.contains('pppk-search')) {
      state.search = e.target.value;
      state.page = 0;
      render();
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('pppk-filter')) {
      var k = e.target.getAttribute('data-key');
      if (k) { state[k] = e.target.value; state.page = 0; render(); }
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('.pppk-reset')) {
      state = { page: 0, search: '', kepeg: '', status: '', sekolah: '', tahun: '' };
      var si = document.querySelector('.pppk-search');
      if (si) si.value = '';
      document.querySelectorAll('.pppk-filter').forEach(function (s) { s.value = ''; });
      render();
    }
    if (e.target.closest('.pppk-export')) {
      exportXls();
    }
    var det = e.target.closest('.pppk-detail');
    if (det) {
      var id = det.getAttribute('data-id');
      var row = null;
      (CFG.rows || []).forEach(function (x) { if (String(x.id) === String(id)) row = toRow(x); });
      if (row) openDetail(row);
    }
  });

  function init() {
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
