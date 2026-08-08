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

  document.addEventListener('input', function (e) {
    if (e.target.classList.contains('kep-search-input')) {
      var tid = e.target.getAttribute('data-table');
      if (!state[tid]) state[tid] = { page: 0, search: '', filters: {} };
      state[tid].search = e.target.value;
      applyTable(tid, 0);
    }
    if (e.target.classList.contains('kep-import')) {
      kepToast(e.target.getAttribute('data-toast') || 'Import berhasil diproses.');
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
      if (confirm('Yakin ingin menghapus data ini?')) {
        tr.remove();
        if (tid) applyTable(tid);
        kepToast('Data berhasil dihapus (demo).');
      }
    } else if (act === 'edit') {
      openEditModal(actBtn, record);
    } else if (act === 'detail') {
      openDetailModal(tr);
    } else if (act === 'cetak') {
      window.print();
    } else {
      kepToast('Aksi "' + act + '" berhasil diproses (demo).');
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
    Object.keys(record || {}).forEach(function (name) {
      var input = modal.querySelector('[name="' + name + '"]');
      if (input) input.value = record[name];
    });
    $(modal).modal('show');
  }

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

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.classList.contains('kep-form')) return;
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      kepToast('Periksa kembali isian wajib.');
      return;
    }
    kepToast('Data berhasil disimpan (demo).');
    var modal = document.getElementById(form.getAttribute('data-modal'));
    if (modal) $(modal).modal('hide');
    form.reset();
    form.classList.remove('was-validated');
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
    if (confirm('Yakin ingin menghapus pegawai ini?')) {
      kepToast('Data pegawai dihapus (demo).');
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    initTables();
  });
  if (document.readyState !== 'loading') initTables();
})();
