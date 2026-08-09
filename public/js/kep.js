(function () {
  function kepToast(msg) {
    var wrap = document.querySelector('.kep-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'kep-toast-wrap';
      document.body.appendChild(wrap);
    }
    var t = document.createElement('div');
    t.className = 'kep-toast';
    t.innerHTML = '<i class="fas fa-check-circle"></i><span>' + msg + '</span>';
    wrap.appendChild(t);
    setTimeout(function () {
      t.classList.add('kep-hide');
      setTimeout(function () { t.remove(); }, 300);
    }, 2500);
  }
  window.kepToast = kepToast;

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  window.kepEscapeHtml = escapeHtml;

  var PAGE_SIZE = 8;
  var state = {};

  var TABLE_MODUL = {
    tblPegawai: 'pegawai',
    tblPresensi: 'presensi',
    tblUser: 'users',
    tblSurat: 'surat',
    tblRw: 'kepangkatan',
    tblUsl: 'kepangkatan',
    tblPro: 'kepangkatan',
    tblSel: 'kepangkatan',
    tblGaji: 'gajiberkala',
    tblCuti: 'cuti',
    tblCerai: 'izincerai',
    tblSlks: 'slks',
    tblPengadaan: 'pengadaan',
    tblPensiun: 'pensiun',
    tblPindah: 'pindah_tugas',
    tblTempat: 'penempatan',
    tblDisiplin: 'disiplin',
    tblDiklatS: 'diklat_struktural',
    tblDiklatT: 'diklat_teknis',
    tblBelajar: 'izin_belajar',
    tblTugas: 'tugas_belajar'
  };

  function tableModul(tid) {
    // Debug logging
    if (typeof tid === 'string' && tid.length === 0) {
      console.warn('[KEP] tableModul: tid is empty string, checking form context...');
    }
    
    if (TABLE_MODUL[tid]) {
      console.log('[KEP] tableModul("' + tid + '") → found in TABLE_MODUL: ' + TABLE_MODUL[tid]);
      return TABLE_MODUL[tid];
    }
    
    // Check prefix patterns
    if (tid && tid.indexOf('tblRef') === 0) return 'referensi';
    if (tid && tid.indexOf('tblPrs') === 0) {
      console.log('[KEP] tableModul("' + tid + '") → matched tblPrs pattern → presensi');
      return 'presensi';
    }
    if (tid && tid.indexOf('modPrs') === 0) {
      console.log('[KEP] tableModul("' + tid + '") → matched modPrs pattern → presensi');
      return 'presensi';
    }
    if (tid && tid.indexOf('tblPppk') === 0) return 'periode_pppk';
    if (tid && tid.indexOf('modPppk') === 0) return 'periode_pppk';
    
    console.error('[KEP] tableModul("' + tid + '") → NO MATCH! Returning empty string');
    return '';
  }
  
  // Expose to window for debugging
  window.tableModul = tableModul;

  function csrfToken() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.getAttribute('content') : '';
  }

  function apiHeaders() {
    return { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken() };
  }

  function uploadFile(bucket, file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var base64 = String(reader.result).split(',')[1];
      fetch('/api/kep/upload/' + bucket, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          filename: Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
          contentType: file.type || 'application/octet-stream',
          base64: base64
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok && res.url) cb(null, res.url);
          else cb(res.error || 'Upload gagal');
        })
        .catch(function (err) { cb(err); });
    };
    reader.onerror = function () { cb('Gagal membaca file.'); };
    reader.readAsDataURL(file);
  }

  function getRows(tid) {
    var tbl = document.querySelector('table#' + CSS.escape(tid));
    return tbl ? Array.prototype.slice.call(tbl.querySelectorAll('tbody tr')) : [];
  }

  function applyTable(tid, forcePage) {
    var tbl = document.querySelector('table#' + CSS.escape(tid));
    if (!tbl) return;
    if (!state[tid]) state[tid] = { page: 0, search: '', filters: {} };

    var st = state[tid];
    var rows = getRows(tid);
    var q = st.search.toLowerCase().trim();
    var searchInput = document.querySelector('.kep-search-input[data-table="' + tid + '"]');

    rows.forEach(function (tr) {
      var show = true;
      var txt = tr.textContent.toLowerCase();
      if (q && txt.indexOf(q) === -1) show = false;
      Object.keys(st.filters).forEach(function (col) {
        var val = st.filters[col];
        if (!val) return;
        var cell = tr.querySelector('td[data-col="' + col + '"]');
        if (!cell || cell.textContent.trim() !== val) show = false;
      });
      tr.style.display = show ? '' : 'none';
    });

    var visible = rows.filter(function (tr) { return tr.style.display !== 'none'; });
    var pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    if (st.page > pages - 1) st.page = 0;
    if (forcePage !== undefined) st.page = forcePage;

    visible.forEach(function (tr, i) {
      tr.style.display = (i >= st.page * PAGE_SIZE && i < (st.page + 1) * PAGE_SIZE) ? '' : 'none';
    });

    var noCells = tbl.querySelectorAll('tbody tr td.kep-no');
    noCells.forEach(function (td) {
      var tr = td.closest('tr');
      td.textContent = tr.style.display === 'none' ? '' : (visible.indexOf(tr) + 1);
    });

    var pager = document.querySelector('.kep-pager[data-table="' + tid + '"]');
    if (pager) renderPager(pager, tid, st.page, pages, visible.length, rows.length);
  }

  function renderPager(pager, tid, cur, pages, shown, total) {
    pager.innerHTML = '';
    var info = document.createElement('span');
    info.className = 'kep-page-info';
    info.textContent = 'Menampilkan ' + shown + ' dari ' + total + ' data';
    pager.appendChild(info);

    if (pages <= 1) return;

    function btn(label, pg, active) {
      var b = document.createElement('button');
      b.className = 'kep-page-btn' + (active ? ' active' : '');
      b.textContent = label;
      b.addEventListener('click', function () { applyTable(tid, pg); });
      pager.appendChild(b);
    }

    if (cur > 0) btn('‹', cur - 1, false);
    var start = Math.max(0, cur - 2);
    var end = Math.min(pages - 1, cur + 2);
    for (var i = start; i <= end; i++) btn(i + 1, i, i === cur);
    if (cur < pages - 1) btn('›', cur + 1, false);
  }

  function initTables() {
    document.querySelectorAll('table.kep-table').forEach(function (tbl) {
      var tid = tbl.id;
      if (!tid) return;
      applyTable(tid);
    });
  }

  // Auto buka modal edit bila URL membawa ?edit=<id> (mis. dari halaman detail).
  function autoOpenEditFromUrl() {
    var m = /[?&]edit=(\d+)/.exec(window.location.search || '');
    if (!m) return;
    var id = m[1];
    var tbl = document.getElementById('tblPegawai');
    if (!tbl) return;
    var rows = Array.prototype.slice.call(tbl.querySelectorAll('tbody tr'));
    for (var i = 0; i < rows.length; i++) {
      var rec = {};
      try { rec = JSON.parse(rows[i].getAttribute('data-record') || '{}'); } catch (e) {}
      if (String(rec.id) === id) {
        var btn = rows[i].querySelector('.kep-act[data-act="edit"]');
        if (btn) {
          openEditModal(btn, rec);
          if (history && history.replaceState) {
            history.replaceState({}, '', window.location.pathname + window.location.hash);
          }
        }
        break;
      }
    }
  }

  document.addEventListener('input', function (e) {
    if (e.target.classList.contains('kep-search-input')) {
      var tid = e.target.getAttribute('data-table');
      if (!state[tid]) state[tid] = { page: 0, search: '', filters: {} };
      state[tid].search = e.target.value;
      applyTable(tid, 0);
    }
    if (e.target.classList.contains('kep-import')) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      uploadFile('dokumen', f, function (err, url) {
        if (err) {
          kepToast('Upload gagal: ' + err);
        } else {
          kepToast('File berhasil diunggah ke storage.');
        }
      });
      e.target.value = '';
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('kep-filter') && e.target.id !== 'kartuPilih') {
      var tid = e.target.getAttribute('data-table');
      var col = e.target.getAttribute('data-col');
      if (!state[tid]) state[tid] = { page: 0, search: '', filters: {} };
      state[tid].filters[col] = e.target.value;
      applyTable(tid, 0);
    }
  });

  document.addEventListener('click', function (e) {
    var actBtn = e.target.closest('.kep-act[data-act]');
    if (!actBtn) return;
    var act = actBtn.getAttribute('data-act');
    var tid = actBtn.getAttribute('data-table');
    var tr = actBtn.closest('tr');
    var record = {};
    try { record = JSON.parse(tr.getAttribute('data-record') || '{}'); } catch (err) {}

    if (act === 'hapus') {
      var modul = tableModul(tid);
      if (!modul || !record.id) {
        kepToast('Data ini tidak dapat dihapus.');
        return;
      }
      if (confirm('Yakin ingin menghapus data ini?')) {
        fetch('/api/kep/' + modul + '/' + record.id, { method: 'DELETE', headers: apiHeaders() })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.ok) {
              kepToast('Data berhasil dihapus.');
              setTimeout(function () { location.reload(); }, 600);
            } else {
              kepToast('Gagal menghapus: ' + (res.error || 'unknown'));
            }
          })
          .catch(function () { kepToast('Terjadi kesalahan saat menghapus.'); });
      }
    } else if (act === 'edit') {
      openEditModal(actBtn, record);
    } else if (act === 'detail') {
      openDetailModal(tr);
    } else if (act === 'cetak') {
      window.print();
    } else if (act === 'unduh') {
      var fileUrl = record.file || '';
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      } else {
        kepToast('Belum ada file PDF untuk data ini.');
      }
    } else {
      kepToast('Aksi "' + act + '" berhasil diproses.');
    }
  });

  function openEditModal(btn, record) {
    var modalId = btn.getAttribute('data-modal');
    var modal = modalId && document.getElementById(modalId);
    if (!modal) {
      kepToast('Form edit belum tersedia untuk data ini.');
      return;
    }
    var title = modal.querySelector('.kep-modal-title');
    if (title) title.textContent = 'Edit Data';
    var form = modal.querySelector('.kep-form');
    if (form) form.setAttribute('data-editing-id', record.id || '');
    Object.keys(record || {}).forEach(function (name) {
      var input = modal.querySelector('[name="' + name + '"]');
      if (!input || input.type === 'file') return;
      var val = record[name];
      if (val === null || val === undefined) val = '';
      input.value = val;
      // Bila <select> tidak punya opsi yang cocok, pertahankan nilai lama agar
      // tidak ikut terhapus saat disimpan (data referensi bisa saja berbeda).
      if (input.tagName === 'SELECT' && String(val) !== '' && input.value !== String(val)) {
        var opt = document.createElement('option');
        opt.value = String(val);
        opt.textContent = String(val) + ' (data lama)';
        input.appendChild(opt);
        input.value = String(val);
      }
    });
    syncSearchableInputs(modal);
    populateBatchForEdit(modal, record);
    $(modal).modal('show');
  }

  // Saat modal dibuka via tombol "Tambah" (bukan Edit), reset status edit & judul.
  $(document).on('show.bs.modal', '.modal', function () {
    initSearchable(this);
    var form = this.querySelector('.kep-form');
    if (!form) return;
    if (form.getAttribute('data-editing-id')) return;
    var title = this.querySelector('.kep-modal-title');
    var ori = this.getAttribute('data-title-ori');
    if (title && ori) title.textContent = ori;
    Array.prototype.slice.call(this.querySelectorAll('select[data-searchable]')).forEach(function (sel) {
      if (sel._kepSearch) {
        sel._kepSearch.input.value = '';
        sel._kepSearch.close();
      }
    });
    resetBatchWrap(this);
  });
  $(document).on('hidden.bs.modal', '.modal', function () {
    var form = this.querySelector('.kep-form');
    if (form) form.removeAttribute('data-editing-id');
  });

  function openDetailModal(tr) {
    var modal = document.getElementById('kepDetailModal');
    if (!modal) return;
    var tbl = tr.closest('table');
    var headers = Array.prototype.slice.call(tbl.querySelectorAll('thead th'));
    var cells = Array.prototype.slice.call(tr.querySelectorAll('td'));
    var body = modal.querySelector('#kepDetailBody');
    body.innerHTML = '';
    headers.forEach(function (th, i) {
      if (i === 0 || i === headers.length - 1) return;
      var cell = cells[i];
      if (!cell) return;
      var row = document.createElement('tr');
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      td1.textContent = th.textContent.trim();
      td2.textContent = cell.textContent.trim();
      row.appendChild(td1);
      row.appendChild(td2);
      body.appendChild(row);
    });
    var nameCell = tr.querySelector('td');
    var title = modal.querySelector('.kep-detail-title');
    if (title) title.textContent = 'Detail Data';
    $(modal).modal('show');
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('.kep-detail-print')) {
      var modal = document.getElementById('kepDetailModal');
      if (modal) $(modal).modal('hide');
      window.print();
    }
    var pbtn = e.target.closest('.kep-print');
    if (pbtn) window.print();
  });

  // Auto-fill NIP saat memilih nama pegawai pada modal (data atribut nip-map).
  document.addEventListener('change', function (e) {
    var sel = e.target.closest('select[name="nama"]');
    if (!sel) return;
    var form = sel.closest('.kep-form');
    if (!form) return;
    var map = {};
    try { map = JSON.parse(form.getAttribute('data-nip-map') || '{}'); } catch (err) {}
    var nipInput = form.querySelector('input[name="nip"]');
    if (nipInput && map[sel.value]) nipInput.value = map[sel.value];
  });

  // Ubah <select data-searchable> menjadi pilihan dengan pencarian (typeahead).
  function enhanceSearchableSelect(sel) {
    if (sel.getAttribute('data-enhanced') === '1') return;
    sel.setAttribute('data-enhanced', '1');

    var wrap = document.createElement('div');
    wrap.className = 'kep-searchable';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control kep-searchable-input';
    input.placeholder = 'Ketik nama untuk mencari...';
    input.setAttribute('autocomplete', 'off');

    var dd = document.createElement('div');
    dd.className = 'kep-searchable-dd';

    wrap.appendChild(input);
    wrap.appendChild(dd);
    sel.parentNode.insertBefore(wrap, sel);
    sel.style.display = 'none';

    function close() { dd.style.display = 'none'; }

    var api = { input: input, dd: dd, close: close };

    function opts() {
      return Array.prototype.slice.call(sel.options).filter(function (o) { return o.value !== ''; });
    }

    function itemFor(option) {
      var item = document.createElement('div');
      item.className = 'kep-searchable-item';
      item.textContent = option.text;
      item.addEventListener('mousedown', function (ev) {
        ev.preventDefault();
        pick(option);
      });
      return item;
    }

    function render(q) {
      var needle = String(q || '').toLowerCase();
      var list = opts().filter(function (o) { return o.text.toLowerCase().indexOf(needle) !== -1; });
      dd.innerHTML = '';
      if (!list.length) {
        var empty = document.createElement('div');
        empty.className = 'kep-searchable-empty';
        empty.textContent = 'Tidak ada nama yang cocok';
        dd.appendChild(empty);
        dd.style.display = 'block';
        return;
      }
      list.forEach(function (o) { dd.appendChild(itemFor(o)); });
      dd.style.display = 'block';
    }

    function pick(o) {
      sel.value = o.value;
      input.value = o.text;
      close();
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function syncFromSelect() {
      var o = sel.selectedOptions && sel.selectedOptions[0];
      input.value = o && o.value ? o.text : '';
    }

    api.sync = syncFromSelect;

    input.addEventListener('focus', function () { render(input.value); });
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(dd.querySelectorAll('.kep-searchable-item'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (items.length) {
          var cur = Math.max(0, items.indexOf(document.activeElement));
          var next = (e.key === 'ArrowDown') ? (cur + 1) % items.length : (cur - 1 + items.length) % items.length;
          items.forEach(function (it) { it.classList.remove('active'); });
          items[next].classList.add('active');
          items[next].focus();
        }
        e.preventDefault();
      } else if (e.key === 'Enter') {
        var active = dd.querySelector('.kep-searchable-item.active') || items[0];
        if (active) {
          var match = opts().filter(function (o) { return o.text === active.textContent; })[0];
          if (match) pick(match);
        }
        e.preventDefault();
      } else if (e.key === 'Escape') {
        close();
        e.preventDefault();
      }
    });
    input.addEventListener('blur', function () { setTimeout(close, 150); });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });

    sel._kepSearch = api;
    return api;
  }

  function initSearchable(scope) {
    var sels = scope
      ? Array.prototype.slice.call(scope.querySelectorAll('select[data-searchable]'))
      : Array.prototype.slice.call(document.querySelectorAll('select[data-searchable]'));
    sels.forEach(enhanceSearchableSelect);
  }

  function syncSearchableInputs(scope) {
    Array.prototype.slice.call(scope.querySelectorAll('select[data-searchable]')).forEach(function (sel) {
      if (sel._kepSearch) sel._kepSearch.sync();
    });
  }

  var BULAN_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function bulanFromFilename(name) {
    var up = String(name || '').toUpperCase();
    for (var i = 0; i < BULAN_NAMES.length; i++) {
      if (up.indexOf(BULAN_NAMES[i].toUpperCase()) !== -1) return BULAN_NAMES[i];
    }
    return '';
  }

  // Tambah/hapus baris pada form batch (banyak Bulan+File).
  document.addEventListener('click', function (e) {
    var addBtn = e.target.closest('.kep-batch-add');
    if (addBtn) {
      var wrap = addBtn.closest('.kep-batch-wrap');
      var proto = wrap.querySelector('.kep-batch-row');
      var row = proto.cloneNode(true);
      var bsel = row.querySelector('.kep-batch-bulan');
      if (bsel) bsel.value = '';
      var fin = row.querySelector('.kep-batch-file');
      if (fin) fin.value = '';
      wrap.querySelector('.kep-batch-rows').appendChild(row);
      return;
    }
    var rmBtn = e.target.closest('.kep-batch-remove');
    if (rmBtn) {
      var wrap2 = rmBtn.closest('.kep-batch-wrap');
      var row2 = rmBtn.closest('.kep-batch-row');
      if (wrap2.querySelectorAll('.kep-batch-row').length > 1) {
        row2.parentNode.removeChild(row2);
      } else {
        var bsel2 = row2.querySelector('.kep-batch-bulan');
        if (bsel2) bsel2.value = '';
        var fin2 = row2.querySelector('.kep-batch-file');
        if (fin2) fin2.value = '';
      }
    }
  });

  // Saat memilih file PDF, isi Bulan otomatis dari nama file.
  document.addEventListener('change', function (e) {
    var fin = e.target.closest('.kep-batch-file');
    if (!fin) return;
    var row = fin.closest('.kep-batch-row');
    if (!row) return;
    var bsel = row.querySelector('.kep-batch-bulan');
    if (!bsel || bsel.value) return;
    var f = fin.files && fin.files[0];
    if (!f) return;
    var bulan = bulanFromFilename(f.name);
    if (bulan) bsel.value = bulan;
  });

  function resetBatchWrap(scope) {
    Array.prototype.slice.call(scope.querySelectorAll('.kep-batch-wrap')).forEach(function (wrap) {
      wrap.removeAttribute('data-existing');
      var rows = wrap.querySelectorAll('.kep-batch-row');
      for (var i = 1; i < rows.length; i++) rows[i].parentNode.removeChild(rows[i]);
      var r0 = wrap.querySelector('.kep-batch-row');
      if (r0) {
        var bsel = r0.querySelector('.kep-batch-bulan');
        if (bsel) bsel.value = '';
        var fin = r0.querySelector('.kep-batch-file');
        if (fin) fin.value = '';
      }
      var note = wrap.querySelector('.kep-batch-note');
      if (note) note.style.display = '';
      var addBtn = wrap.querySelector('.kep-batch-add');
      if (addBtn) addBtn.style.display = '';
    });
  }

  function populateBatchForEdit(modal, record) {
    var wrap = modal.querySelector('.kep-batch-wrap');
    if (!wrap) return;
    var rows = wrap.querySelectorAll('.kep-batch-row');
    for (var i = 1; i < rows.length; i++) rows[i].parentNode.removeChild(rows[i]);
    var r0 = wrap.querySelector('.kep-batch-row');
    if (r0) {
      var bsel = r0.querySelector('.kep-batch-bulan');
      if (bsel) bsel.value = record.bulan || '';
    }
    var existing = {};
    if (record.bulan) existing[record.bulan] = record.file || '';
    wrap.setAttribute('data-existing', JSON.stringify(existing));
    var note = wrap.querySelector('.kep-batch-note');
    if (note) note.style.display = record.file ? 'none' : '';
    var addBtn = wrap.querySelector('.kep-batch-add');
    if (addBtn) addBtn.style.display = 'none';
  }

  function submitBatch(form, modul, editingId) {
    var wrap = form.querySelector('.kep-batch-wrap');
    var rows = Array.prototype.slice.call(wrap.querySelectorAll('.kep-batch-row'));
    var nama = form.querySelector('select[name="nama"]');
    var nip = form.querySelector('input[name="nip"]');
    var tahun = form.querySelector('input[name="tahun"]');
    var ket = form.querySelector('textarea[name="keterangan"]');

    if (!nama || !nama.value) {
      kepToast('Pilih nama pegawai.');
      return;
    }

    var existing = {};
    try { existing = JSON.parse(wrap.getAttribute('data-existing') || '{}'); } catch (err) {}

    var bulanSet = {};
    var hasData = false;
    var dup = '';
    rows.forEach(function (row) {
      var bulan = row.querySelector('.kep-batch-bulan').value;
      var hasFile = row.querySelector('.kep-batch-file').files && row.querySelector('.kep-batch-file').files[0];
      if (!bulan) return;
      if (bulanSet[bulan]) {
        dup = bulan;
      } else {
        bulanSet[bulan] = true;
        if (hasFile || existing[bulan]) hasData = true;
      }
    });
    if (dup) {
      kepToast('Bulan "' + dup + '" dipilih lebih dari sekali.');
      return;
    }
    if (!hasData) {
      kepToast('Pilih minimal satu bulan beserta file PDF-nya.');
      return;
    }

    var rowsToSubmit = rows.filter(function (row) {
      var bulan = row.querySelector('.kep-batch-bulan').value;
      var hasFile = row.querySelector('.kep-batch-file').files && row.querySelector('.kep-batch-file').files[0];
      return bulan && (hasFile || existing[bulan]);
    });
    if (editingId && rowsToSubmit.length > 1) rowsToSubmit = rowsToSubmit.slice(0, 1);

    var tasks = rowsToSubmit.map(function (row) {
      var bulan = row.querySelector('.kep-batch-bulan').value;
      var fin = row.querySelector('.kep-batch-file');
      var payload = {
        nama: nama.value,
        nip: nip.value,
        tahun: tahun.value,
        bulan: bulan,
        keterangan: ket ? ket.value : '',
        file: existing[bulan] || ''
      };
      return new Promise(function (resolve) {
        if (fin.files && fin.files[0]) {
          uploadFile('dokumen', fin.files[0], function (err, url) {
            if (err) resolve({ ok: false, error: 'Upload ' + bulan + ' gagal: ' + err });
            else { payload.file = url; resolve({ ok: true, payload: payload }); }
          });
        } else {
          resolve({ ok: true, payload: payload });
        }
      });
    });

    Promise.all(tasks).then(function (results) {
      for (var i = 0; i < results.length; i++) {
        if (!results[i].ok) { kepToast(results[i].error); return; }
      }
      var calls = results.map(function (r) {
        var url = '/api/kep/' + modul + (editingId ? '/' + editingId : '');
        var method = editingId ? 'PUT' : 'POST';
        return fetch(url, { method: method, headers: apiHeaders(), body: JSON.stringify(r.payload) })
          .then(function (r2) { return r2.json(); });
      });
      Promise.all(calls).then(function (ress) {
        for (var j = 0; j < ress.length; j++) {
          if (!ress[j].ok) { kepToast('Gagal menyimpan: ' + (ress[j].error || 'unknown')); return; }
        }
        kepToast('Data berhasil disimpan.');
        var modal = document.getElementById(form.getAttribute('data-modal'));
        if (modal) $(modal).modal('hide');
        form.reset();
        form.classList.remove('was-validated');
        form.removeAttribute('data-editing-id');
        setTimeout(function () { location.reload(); }, 600);
      }).catch(function () { kepToast('Terjadi kesalahan saat menyimpan.'); });
    });
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.classList.contains('kep-form')) return;
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      kepToast('Periksa kembali isian wajib.');
      return;
    }

    var dataTable = form.getAttribute('data-table');
    var dataModal = form.getAttribute('data-modal') || '';
    console.log('[KEP] Form submit detected', { dataTable, dataModal });
    
    // Fallback: if data-table is empty, try to infer from data-modal
    if (!dataTable && dataModal) {
      console.warn('[KEP] data-table is empty, attempting fallback from data-modal: ' + dataModal);
      // Try to infer table ID from modal ID
      if (dataModal.indexOf('modPrs') === 0) {
        dataTable = dataModal.replace('modPrs', 'tblPrs');
        console.log('[KEP] Fallback table ID: ' + dataTable);
      } else if (dataModal.indexOf('modPppk') === 0) {
        dataTable = dataModal.replace('modPppk', 'tblPppk');
        console.log('[KEP] Fallback table ID: ' + dataTable);
      }
    }
    
    var modul = tableModul(dataTable);
    var editingId = form.getAttribute('data-editing-id') || '';
    if (!modul) {
      console.error('[KEP] ERROR: Module tidak dikenali!', {
        dataTable: dataTable,
        dataModal: dataModal,
        formId: form.id,
        batchWrap: form.querySelector('.kep-batch-wrap') ? 'YES' : 'NO'
      });
      kepToast('❌ Modul tidak dikenali. Buka console (F12) untuk details. Refresh halaman dan coba lagi.');
      return;
    }
    
    console.log('[KEP] Module recognized: ' + modul);

    if (form.querySelector('.kep-batch-wrap')) {
      submitBatch(form, modul, editingId);
      return;
    }

    var filePromises = [];
    var fileFields = Array.prototype.slice.call(form.querySelectorAll('input[type="file"]'));
    fileFields.forEach(function (f) {
      if (f.files && f.files.length) {
        var bucket = (f.getAttribute('name') === 'foto') ? 'foto' : 'dokumen';
        filePromises.push(
          new Promise(function (resolve) {
            uploadFile(bucket, f.files[0], function (err, url) {
              if (err) { resolve({ name: f.getAttribute('name'), value: '', error: err }); }
              else { resolve({ name: f.getAttribute('name'), value: url }); }
            });
          })
        );
      }
    });

    var payload = {};
    Array.prototype.slice.call(form.querySelectorAll('[name]')).forEach(function (el) {
      var name = el.getAttribute('name');
      if (el.type === 'file') return;
      payload[name] = el.value;
    });

    Promise.all(filePromises).then(function (results) {
      for (var i = 0; i < results.length; i++) {
        if (results[i].error) {
          kepToast('Upload gagal: ' + results[i].error);
          return;
        }
        payload[results[i].name] = results[i].value;
      }

      var url = '/api/kep/' + modul + (editingId ? '/' + editingId : '');
      var method = editingId ? 'PUT' : 'POST';
      fetch(url, {
        method: method,
        headers: apiHeaders(),
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok) {
            kepToast('Data berhasil disimpan.');
            var modal = document.getElementById(form.getAttribute('data-modal'));
            if (modal) $(modal).modal('hide');
            form.reset();
            form.classList.remove('was-validated');
            form.removeAttribute('data-editing-id');
            setTimeout(function () { location.reload(); }, 600);
          } else {
            kepToast('Gagal menyimpan: ' + (res.error || 'unknown'));
          }
        })
        .catch(function () { kepToast('Terjadi kesalahan saat menyimpan.'); });
    });
  });

  document.addEventListener('click', function (e) {
    var exp = e.target.closest('.kep-export');
    if (!exp) return;
    var tid = exp.getAttribute('data-table');
    var tbl = document.querySelector('table#' + CSS.escape(tid));
    if (!tbl) return;
    var rows = getRows(tid).filter(function (tr) { return tr.style.display !== 'none'; });
    var headers = Array.prototype.slice.call(tbl.querySelectorAll('thead th')).map(function (th) { return th.textContent.trim(); });
    var csv = headers.join(';') + '\r\n';
    rows.forEach(function (tr) {
      var vals = Array.prototype.slice.call(tr.querySelectorAll('td')).map(function (td) {
        return '"' + td.textContent.trim().replace(/"/g, '""') + '"';
      });
      csv += vals.join(';') + '\r\n';
    });
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tid + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    kepToast('Data berhasil diexport ke CSV.');
  });

  document.addEventListener('click', function (e) {
    var del = e.target.closest('.kep-hapus-single');
    if (!del) return;
    var id = del.getAttribute('data-id');
    if (!id) {
      kepToast('Data ini tidak dapat dihapus dari sini.');
      return;
    }
    if (confirm('Yakin ingin menghapus pegawai ini?')) {
      fetch('/api/kep/pegawai/' + id, { method: 'DELETE', headers: apiHeaders() })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok) {
            kepToast('Pegawai berhasil dihapus.');
            setTimeout(function () { location.href = '/profil-pegawai'; }, 600);
          } else {
            kepToast('Gagal menghapus: ' + (res.error || 'unknown'));
          }
        })
        .catch(function () { kepToast('Terjadi kesalahan saat menghapus.'); });
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    initTables();
    autoOpenEditFromUrl();
  });
  if (document.readyState !== 'loading') {
    initTables();
    autoOpenEditFromUrl();
  }
})();
