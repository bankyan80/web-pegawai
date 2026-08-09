(function () {
  var CFG = window.PPPK_CFG || {};
  var PAGE_SIZE = 8;
  var state = { page: 0, search: '', jenis: '', sekolah: '', status: '', tahun: '' };
  var editingId = null;
  var currentDokumen = '';
  var extendId = null;

  function esc(s) {
    if (window.kepEscapeHtml) return window.kepEscapeHtml(s);
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg) {
    if (window.kepToast) return window.kepToast(msg);
    alert(msg);
  }

  function csrfToken() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.getAttribute('content') : '';
  }

  function apiHeaders() {
    return { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken() };
  }

  function pick(r, a, b) { return r[a] !== undefined ? r[a] : r[b]; }

  function toRow(r) {
    return {
      id: pick(r, 'id', 'id'),
      pegawaiId: pick(r, 'pegawaiId', 'pegawai_id'),
      nip: pick(r, 'nip', 'nip'),
      nama: pick(r, 'nama', 'nama'),
      nik: pick(r, 'nik', 'nik'),
      npsn: pick(r, 'npsn', 'npsn'),
      sekolah: pick(r, 'sekolah', 'sekolah'),
      jabatan: pick(r, 'jabatan', 'jabatan'),
      jenis: pick(r, 'jenis', 'jenis'),
      nomorPerjanjian: pick(r, 'nomorPerjanjian', 'nomor_perjanjian'),
      tanggalPerjanjian: pick(r, 'tanggalPerjanjian', 'tanggal_perjanjian'),
      tanggalMulai: pick(r, 'tanggalMulai', 'tanggal_mulai'),
      tanggalBerakhir: pick(r, 'tanggalBerakhir', 'tanggal_berakhir'),
      keterangan: pick(r, 'keterangan', 'keterangan'),
      dokumen: pick(r, 'dokumen', 'dokumen'),
      status: pick(r, 'status', 'status'),
      periodeKe: pick(r, 'periodeKe', 'periode_ke'),
      sisa: pick(r, 'sisa', 'sisa'),
      aksi: pick(r, 'aksi', 'aksi'),
      oleh: pick(r, 'oleh', 'oleh'),
      createdAt: pick(r, 'createdAt', 'created_at'),
      updatedAt: pick(r, 'updatedAt', 'updated_at'),
      createdBy: pick(r, 'createdBy', 'created_by'),
      updatedBy: pick(r, 'updatedBy', 'updated_by')
    };
  }

  function today0() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function statusOf(r) {
    var t = today0();
    var m = r.tanggalMulai ? new Date(r.tanggalMulai + 'T00:00:00') : null;
    var b = r.tanggalBerakhir ? new Date(r.tanggalBerakhir + 'T00:00:00') : null;
    if (b && b.getTime() < t.getTime()) return 'BERAKHIR';
    if (m && m.getTime() > t.getTime()) return 'BELUM AKTIF';
    if (b) {
      var sisa = Math.floor((b.getTime() - t.getTime()) / 86400000);
      if (sisa <= 90) return 'SEGERA BERAKHIR';
    }
    return 'AKTIF';
  }

  function sisaOf(r) {
    var t = today0();
    var b = r.tanggalBerakhir ? new Date(r.tanggalBerakhir + 'T00:00:00') : null;
    if (!b) return null;
    return Math.floor((b.getTime() - t.getTime()) / 86400000);
  }

  var BADGE = {
    'AKTIF': 'kb-green',
    'BELUM AKTIF': 'kb-gray',
    'SEGERA BERAKHIR': 'kb-amber',
    'BERAKHIR': 'kb-red',
    'TAMBAH': 'kb-green',
    'UBAH': 'kb-blue',
    'PERPANJANG': 'kb-violet',
    'Berjalan': 'kb-blue',
    'PPPK Penuh Waktu': 'kb-blue',
    'PPPK Paruh Waktu': 'kb-cyan'
  };

  function badge(v) {
    var cls = BADGE[v] || 'kb-gray';
    return '<span class="kep-badge ' + cls + '">' + esc(v) + '</span>';
  }

  function sisaText(r) {
    var s = sisaOf(r);
    if (statusOf(r) === 'BERAKHIR') return 'Habis';
    return s === null ? '-' : s + ' hari';
  }

  function filtered() {
    var q = state.search.toLowerCase().trim();
    var all = (CFG.rows || []).map(toRow);
    var out = [];
    all.forEach(function (r) {
      if (state.jenis && r.jenis !== state.jenis) return;
      if (state.sekolah && r.sekolah !== state.sekolah) return;
      if (state.status && statusOf(r) !== state.status) return;
      if (state.tahun && r.tanggalBerakhir && r.tanggalBerakhir.slice(0, 4) !== state.tahun) return;
      if (q) {
        var hay = (r.nama + ' ' + (r.nip || '') + ' ' + (r.nik || '') + ' ' + (r.sekolah || '') + ' ' + (r.jabatan || '') + ' ' + (r.nomorPerjanjian || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return;
      }
      out.push(r);
    });
    return out;
  }

  function actMenu(r) {
    var html = '<div class="dropdown pppk-act-wrap"><button type="button" class="btn btn-sm btn-outline-primary dropdown-toggle pppk-act-toggle" data-toggle="dropdown"><i class="fas fa-cog"></i> Aksi</button><div class="dropdown-menu dropdown-menu-right pppk-act-menu">';
    html += '<a class="dropdown-item pppk-act" href="#" data-act="detail" data-id="' + r.id + '"><i class="fas fa-eye"></i> Detail</a>';
    html += '<a class="dropdown-item pppk-act" href="#" data-act="edit" data-id="' + r.id + '"><i class="fas fa-edit"></i> Edit</a>';
    if (CFG.canExtend) {
      html += '<a class="dropdown-item pppk-act" href="#" data-act="perpanjang" data-id="' + r.id + '"><i class="fas fa-hourglass-half"></i> Perpanjang Periode</a>';
    }
    if (r.dokumen) {
      html += '<a class="dropdown-item pppk-act" href="#" data-act="lihat" data-id="' + r.id + '"><i class="fas fa-file-pdf"></i> Lihat Dokumen</a>';
      html += '<a class="dropdown-item pppk-act" href="#" data-act="unduh" data-id="' + r.id + '"><i class="fas fa-download"></i> Download Dokumen</a>';
    }
    html += '<a class="dropdown-item pppk-act" href="#" data-act="riwayat" data-id="' + r.id + '"><i class="fas fa-history"></i> Riwayat</a>';
    if (CFG.canDelete) {
      html += '<div class="dropdown-divider"></div>';
      html += '<a class="dropdown-item pppk-act pppk-act-danger" href="#" data-act="hapus" data-id="' + r.id + '"><i class="fas fa-trash"></i> Hapus</a>';
    }
    html += '</div></div>';
    return html;
  }

  function render() {
    var rows = filtered();
    var body = document.getElementById('pppkBody');
    body.innerHTML = '';
    if (!rows.length) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="14" class="pppk-empty"><i class="fas fa-folder-open"></i>Belum ada data periode PPPK. Gunakan tombol "Tambah Periode" untuk menambah.</td>';
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
        '<td>' + esc(r.sekolah) + '</td>' +
        '<td>' + esc(r.jabatan) + '</td>' +
        '<td>' + badge(r.jenis) + '</td>' +
        '<td>' + 'Ke-' + esc(r.periodeKe) + '</td>' +
        '<td>' + esc(r.nomorPerjanjian) + '</td>' +
        '<td>' + esc(r.tanggalMulai) + '</td>' +
        '<td>' + esc(r.tanggalBerakhir) + '</td>' +
        '<td>' + sisaText(r) + '</td>' +
        '<td>' + badge(statusOf(r)) + '</td>' +
        '<td class="kep-td-act">' + actMenu(r) + '</td>';
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

  function popPegawaiSelect() {
    var sel = document.querySelector('.pppk-pegawai');
    if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = '<option value="">-- Pilih Pegawai --</option>';
    (CFG.options || []).forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.nama + (p.nip ? ' (' + p.nip + ')' : '');
      sel.appendChild(o);
    });
    if (cur) sel.value = cur;
  }

  function resetAddForm() {
    var form = document.querySelector('.pppk-form');
    if (!form) return;
    form.reset();
    form.removeAttribute('data-editing-id');
    editingId = null;
    currentDokumen = '';
    var title = document.querySelector('.pppk-modal-title');
    if (title) title.textContent = 'Tambah Periode PPPK';
    var sel = document.querySelector('.pppk-pegawai');
    if (sel) sel.disabled = false;
    if (CFG.isStaff) {
      var sk = form.querySelector('[name="sekolah"]');
      if (sk) sk.value = CFG.unit || '';
    }
  }

  function openEdit(r) {
    var form = document.querySelector('.pppk-form');
    if (!form) return;
    editingId = r.id;
    currentDokumen = r.dokumen || '';
    form.setAttribute('data-editing-id', r.id);
    var title = document.querySelector('.pppk-modal-title');
    if (title) title.textContent = 'Edit Periode PPPK';
    popPegawaiSelect();
    var sel = document.querySelector('.pppk-pegawai');
    if (sel) {
      sel.value = r.pegawaiId ? String(r.pegawaiId) : '';
      sel.disabled = true;
    }
    form.querySelector('[name="pegawai_id"]').value = r.pegawaiId || '';
    form.querySelector('[name="nip"]').value = r.nip || '';
    form.querySelector('[name="nama"]').value = r.nama || '';
    form.querySelector('[name="nik"]').value = r.nik || '';
    form.querySelector('[name="sekolah"]').value = r.sekolah || '';
    form.querySelector('[name="jabatan"]').value = r.jabatan || '';
    form.querySelector('[name="npsn"]').value = r.npsn || '';
    form.querySelector('[name="jenis"]').value = r.jenis || '';
    form.querySelector('[name="nomor_perjanjian"]').value = r.nomorPerjanjian || '';
    form.querySelector('[name="tanggal_perjanjian"]').value = r.tanggalPerjanjian || '';
    form.querySelector('[name="tanggal_mulai"]').value = r.tanggalMulai || '';
    form.querySelector('[name="tanggal_berakhir"]').value = r.tanggalBerakhir || '';
    form.querySelector('[name="keterangan"]').value = r.keterangan || '';
    var f = form.querySelector('[name="dokumen"]');
    if (f) f.value = '';
  }

  function uploadPdf(file, cb) {
    if (!file) return cb(null, '');
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      return cb('Dokumen harus berformat PDF.');
    }
    if (file.size > 2 * 1024 * 1024) {
      return cb('Ukuran dokumen maksimal 2 MB.');
    }
    var reader = new FileReader();
    reader.onload = function () {
      var base64 = String(reader.result).split(',')[1];
      fetch('/api/kep/upload/dokumen', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          filename: Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
          contentType: file.type || 'application/pdf',
          base64: base64
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok && res.url) cb(null, res.url);
          else cb(res.error || 'Upload gagal.');
        })
        .catch(function () { cb('Gagal mengunggah dokumen.'); });
    };
    reader.onerror = function () { cb('Gagal membaca file.'); };
    reader.readAsDataURL(file);
  }

  function collectPayload(form) {
    var payload = {};
    Array.prototype.slice.call(form.querySelectorAll('[name]')).forEach(function (el) {
      if (el.type === 'file') return;
      payload[el.name] = el.value;
    });
    return payload;
  }

  function submitForm(form) {
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      toast('Periksa kembali isian wajib.');
      return;
    }
    var mulai = form.querySelector('[name="tanggal_mulai"]').value;
    var berakhir = form.querySelector('[name="tanggal_berakhir"]').value;
    if (mulai && berakhir && mulai > berakhir) {
      toast('Tanggal mulai tidak boleh melewati tanggal berakhir.');
      return;
    }
    var file = form.querySelector('[name="dokumen"]');
    var f = file && file.files && file.files[0] ? file.files[0] : null;
    uploadPdf(f, function (err, url) {
      if (err) { toast('Gagal menyimpan: ' + err); return; }
      var payload = collectPayload(form);
      if (f) payload.dokumen = url;
      else if (editingId) payload.dokumen = currentDokumen || '';
      else payload.dokumen = '';
      var method = editingId ? 'PUT' : 'POST';
      var url2 = '/api/kep/pppk' + (editingId ? '/' + editingId : '');
      fetch(url2, { method: method, headers: apiHeaders(), body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok) {
            toast('Data periode PPPK berhasil disimpan.');
            $('#modalPppk').modal('hide');
            setTimeout(function () { location.reload(); }, 600);
          } else {
            toast('Gagal menyimpan: ' + (res.error || 'unknown'));
          }
        })
        .catch(function () { toast('Terjadi kesalahan saat menyimpan.'); });
    });
  }

  function submitExtend() {
    var form = document.querySelector('.pppk-form-perpanjang');
    if (!form) return;
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      toast('Periksa kembali isian wajib.');
      return;
    }
    var mulai = form.querySelector('[name="tanggal_mulai"]').value;
    var berakhir = form.querySelector('[name="tanggal_berakhir"]').value;
    if (mulai && berakhir && mulai > berakhir) {
      toast('Tanggal mulai tidak boleh melewati tanggal berakhir.');
      return;
    }
    var file = form.querySelector('[name="dokumen"]');
    var f = file && file.files && file.files[0] ? file.files[0] : null;
    uploadPdf(f, function (err, url) {
      if (err) { toast('Gagal memperpanjang: ' + err); return; }
      var payload = collectPayload(form);
      if (f) payload.dokumen = url;
      else payload.dokumen = '';
      fetch('/api/kep/pppk/' + extendId + '/perpanjang', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok) {
            toast('Periode PPPK berhasil diperpanjang.');
            $('#modalPppkPerpanjang').modal('hide');
            setTimeout(function () { location.reload(); }, 600);
          } else {
            toast('Gagal memperpanjang: ' + (res.error || 'unknown'));
          }
        })
        .catch(function () { toast('Terjadi kesalahan saat memperpanjang.'); });
    });
  }

  function openDetail(r) {
    var body = document.getElementById('pppkDetailBody');
    if (!body) return;
    var items = [
      ['Nama Pegawai', r.nama],
      ['NIP/NI', r.nip],
      ['NIK', r.nik],
      ['Sekolah', r.sekolah],
      ['NPSN', r.npsn],
      ['Jabatan', r.jabatan],
      ['Jenis PPPK', r.jenis],
      ['Periode Ke', r.periodeKe],
      ['Nomor Perjanjian', r.nomorPerjanjian],
      ['Tanggal Perjanjian', r.tanggalPerjanjian],
      ['Tanggal Mulai', r.tanggalMulai],
      ['Tanggal Berakhir', r.tanggalBerakhir],
      ['Sisa Periode', sisaText(r)],
      ['Status', statusOf(r)],
      ['Keterangan', r.keterangan],
      ['Dibuat Oleh', r.createdBy ? r.createdBy + ' (' + (r.createdAt || '') + ')' : ''],
      ['Diubah Oleh', r.updatedBy ? r.updatedBy + ' (' + (r.updatedAt || '') + ')' : '']
    ];
    body.innerHTML = '';
    items.forEach(function (it) {
      var tr = document.createElement('tr');
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      td1.textContent = it[0];
      td2.textContent = it[1] === undefined || it[1] === null ? '' : it[1];
      tr.appendChild(td1);
      tr.appendChild(td2);
      body.appendChild(tr);
    });
    $('#modalPppkDetail').modal('show');
  }

  function openExtend(r) {
    extendId = r.id;
    var form = document.querySelector('.pppk-form-perpanjang');
    if (!form) return;
    form.reset();
    form.classList.remove('was-validated');
    var info = document.getElementById('pppkExtendInfo');
    if (info) {
      info.innerHTML = '<strong>' + esc(r.nama) + '</strong> &mdash; periode ke-' + esc(r.periodeKe) +
        ' (' + esc(r.tanggalMulai) + ' s.d. ' + esc(r.tanggalBerakhir) + '). ' +
        'Periode lama akan disimpan sebagai riwayat.';
    }
    form.querySelector('[name="nomor_perjanjian"]').value = '';
    form.querySelector('[name="tanggal_perjanjian"]').value = '';
    form.querySelector('[name="tanggal_mulai"]').value = '';
    form.querySelector('[name="tanggal_berakhir"]').value = '';
    var f = form.querySelector('[name="dokumen"]');
    if (f) f.value = '';
    form.querySelector('[name="keterangan"]').value = '';
    $('#modalPppkPerpanjang').modal('show');
  }

  function openRiwayat(r) {
    var info = document.getElementById('pppkRiwayatInfo');
    if (info) info.innerHTML = '<strong>' + esc(r.nama) + '</strong> &mdash; riwayat seluruh periode PPPK.';
    var body = document.getElementById('pppkRiwayatBody');
    body.innerHTML = '<tr><td colspan="9" class="pppk-empty"><i class="fas fa-spinner fa-spin"></i>Memuat riwayat...</td></tr>';
    $('#modalPppkRiwayat').modal('show');
    fetch('/api/kep/pppk/' + r.id + '/riwayat', { headers: apiHeaders() })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (!res.ok) { toast('Gagal memuat riwayat: ' + (res.error || 'unknown')); return; }
        renderRiwayat(body, res);
      })
      .catch(function () { toast('Terjadi kesalahan saat memuat riwayat.'); });
  }

  function renderRiwayat(body, res) {
    var list = [];
    (res.periode || []).forEach(function (x) {
      var r = toRow(x);
      r.sumber = 'periode';
      r.aksiLabel = 'Berjalan';
      list.push(r);
    });
    (res.riwayat || []).forEach(function (x) {
      var r = toRow(x);
      r.sumber = 'riwayat';
      r.aksiLabel = r.aksi || 'UBAH';
      list.push(r);
    });
    list.sort(function (a, b) {
      var ka = (Number(a.periodeKe) || 0) * 100000 - (a.tanggalBerakhir ? new Date(a.tanggalBerakhir + 'T00:00:00').getTime() : 0);
      var kb = (Number(b.periodeKe) || 0) * 100000 - (b.tanggalBerakhir ? new Date(b.tanggalBerakhir + 'T00:00:00').getTime() : 0);
      return kb - ka;
    });
    body.innerHTML = '';
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="9" class="pppk-empty"><i class="fas fa-folder-open"></i>Belum ada riwayat.</td></tr>';
      return;
    }
    list.forEach(function (r) {
      var tr = document.createElement('tr');
      var doc = r.dokumen
        ? '<a href="' + esc(r.dokumen) + '" target="_blank" rel="noopener"><i class="fas fa-file-pdf"></i> Dokumen</a>'
        : '-';
      var st = r.sumber === 'periode' ? badge('Berjalan') : badge(r.status || r.aksiLabel);
      tr.innerHTML =
        '<td>Ke-' + esc(r.periodeKe) + '</td>' +
        '<td>' + esc(r.nomorPerjanjian) + '</td>' +
        '<td>' + esc(r.tanggalMulai) + '</td>' +
        '<td>' + esc(r.tanggalBerakhir) + '</td>' +
        '<td>' + sisaText(r) + '</td>' +
        '<td>' + st + '</td>' +
        '<td>' + doc + '</td>' +
        '<td>' + esc(r.sumber === 'periode' ? 'Berjalan' : r.aksiLabel) + '</td>' +
        '<td>' + esc(r.oleh || r.createdBy || '') + '</td>';
      body.appendChild(tr);
    });
  }

  function openDokumen(r) {
    if (!r.dokumen) { toast('Belum ada dokumen perjanjian untuk data ini.'); return; }
    window.open(r.dokumen, '_blank');
  }

  function hapus(r) {
    if (!confirm('Yakin ingin menghapus periode PPPK ini? Data riwayat tidak ikut dihapus.')) return;
    fetch('/api/kep/pppk/' + r.id, { method: 'DELETE', headers: apiHeaders() })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res.ok) {
          toast('Periode PPPK berhasil dihapus.');
          setTimeout(function () { location.reload(); }, 600);
        } else {
          toast('Gagal menghapus: ' + (res.error || 'unknown'));
        }
      })
      .catch(function () { toast('Terjadi kesalahan saat menghapus.'); });
  }

  function exportXls() {
    var rows = filtered();
    var headers = ['Nama Pegawai', 'NIP/NI', 'NIK', 'Sekolah', 'Jabatan', 'Jenis PPPK', 'Periode Ke', 'No. Perjanjian', 'Tgl. Mulai', 'Tgl. Berakhir', 'Sisa Periode', 'Status'];
    var csv = headers.join(';') + '\r\n';
    rows.forEach(function (r) {
      var vals = [
        r.nama, r.nip, r.nik, r.sekolah, r.jabatan, r.jenis,
        'Ke-' + r.periodeKe, r.nomorPerjanjian, r.tanggalMulai, r.tanggalBerakhir,
        sisaText(r), statusOf(r)
      ];
      csv += vals.map(function (v) {
        return '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"';
      }).join(';') + '\r\n';
    });
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'periode-pppk.csv';
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
    if (e.target.classList.contains('pppk-pegawai')) {
      var opt = null;
      (CFG.options || []).forEach(function (p) { if (String(p.id) === e.target.value) opt = p; });
      var form = e.target.closest('.pppk-form');
      if (opt && form) {
        form.querySelector('[name="pegawai_id"]').value = opt.id;
        form.querySelector('[name="nip"]').value = opt.nip || '';
        form.querySelector('[name="nama"]').value = opt.nama || '';
        form.querySelector('[name="nik"]').value = opt.nik || '';
        form.querySelector('[name="sekolah"]').value = opt.sekolah || '';
        form.querySelector('[name="jabatan"]').value = opt.jabatan || '';
      }
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('.pppk-reset')) {
      state = { page: 0, search: '', jenis: '', sekolah: '', status: '', tahun: '' };
      var si = document.querySelector('.pppk-search');
      if (si) si.value = '';
      document.querySelectorAll('.pppk-filter').forEach(function (s) { s.value = ''; });
      render();
    }
    if (e.target.closest('.pppk-export')) {
      exportXls();
    }
    var act = e.target.closest('.pppk-act');
    if (!act) return;
    e.preventDefault();
    var id = act.getAttribute('data-id');
    var row = null;
    (CFG.rows || []).forEach(function (x) { if (String(x.id) === String(id)) row = toRow(x); });
    if (!row) return;
    var a = act.getAttribute('data-act');
    if (a === 'detail') openDetail(row);
    else if (a === 'edit') openEdit(row);
    else if (a === 'perpanjang') openExtend(row);
    else if (a === 'lihat' || a === 'unduh') openDokumen(row);
    else if (a === 'riwayat') openRiwayat(row);
    else if (a === 'hapus') hapus(row);
  });

  document.addEventListener('submit', function (e) {
    if (e.target.classList.contains('pppk-form')) {
      e.preventDefault();
      submitForm(e.target);
    }
    if (e.target.classList.contains('pppk-form-perpanjang')) {
      e.preventDefault();
      submitExtend();
    }
  });

  $(document).on('show.bs.modal', '#modalPppk', function () {
    if (!editingId) {
      resetAddForm();
      popPegawaiSelect();
    }
  });

  $(document).on('hidden.bs.modal', '#modalPppk', function () {
    editingId = null;
  });

  function init() {
    resetAddForm();
    popPegawaiSelect();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
