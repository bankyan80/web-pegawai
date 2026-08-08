(function () {
  var CFG = window.MENU_CFG || {};
  var rows = (CFG.rows || []).map(function (r) { return Object.assign({}, r); });
  var editingId = null;
  var editingGroupId = null;

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

  function headers() {
    return { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken() };
  }

  function find(id) {
    for (var i = 0; i < rows.length; i++) if (Number(rows[i].id) === Number(id)) return rows[i];
    return null;
  }

  function topLevel() {
    return rows
      .filter(function (r) { return r.parent_id === null || r.parent_id === undefined || r.parent_id === ''; })
      .sort(function (a, b) { return (Number(a.urutan) || 0) - (Number(b.urutan) || 0) || a.id - b.id; });
  }

  function childrenOf(id) {
    return rows
      .filter(function (r) { return Number(r.parent_id) === Number(id); })
      .sort(function (a, b) { return (Number(a.urutan) || 0) - (Number(b.urutan) || 0) || a.id - b.id; });
  }

  function flagsPayload(r) {
    return {
      for_administrator: r.for_administrator === true,
      for_manager: r.for_manager === true,
      for_staff: r.for_staff === true,
      publik: r.publik === true,
      status: r.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif'
    };
  }

  function put(r, payload, cb) {
    fetch('/api/kep/menu/' + r.id, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res.ok) { if (cb) cb(); }
        else toast('Gagal menyimpan: ' + (res.error || 'unknown'));
      })
      .catch(function () { toast('Terjadi kesalahan.'); });
  }

  function del(id, cb) {
    fetch('/api/kep/menu/' + id, {
      method: 'DELETE',
      headers: headers()
    })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res.ok) { if (cb) cb(); }
        else toast('Gagal menghapus: ' + (res.error || 'unknown'));
      })
      .catch(function () { toast('Terjadi kesalahan.'); });
  }

  function roleCell(r) {
    var html = '<div class="menu-roles">';
    var labels = { administrator: 'Admin', manager: 'Manager', staff: 'Staff' };
    (CFG.roles || []).forEach(function (role) {
      var checked = r['for_' + role] === true ? ' checked' : '';
      html += '<label class="menu-check"><input type="checkbox" class="menu-role" data-id="' + r.id + '" data-role="' + role + '"' + checked + ' /> ' + labels[role] + '</label>';
    });
    html += '</div>';
    return html;
  }

  function isGroup(r) {
    return rows.some(function (x) { return Number(x.parent_id) === Number(r.id); });
  }

  function render() {
    var body = document.getElementById('menuBody');
    if (!body) return;
    body.innerHTML = '';
    var top = topLevel();
    if (!top.length) {
      body.innerHTML = '<tr><td colspan="7" class="pppk-empty"><i class="fas fa-folder-open"></i>Belum ada menu. Klik "Tambah Menu".</td></tr>';
      return;
    }
    var no = 0;
    top.forEach(function (t) {
      var children = childrenOf(t.id);
      no++;
      body.appendChild(rowEl(t, no, false));
      children.forEach(function (c) {
        no++;
        body.appendChild(rowEl(c, no, true));
      });
    });
  }

  function rowEl(r, no, isChild) {
    var tr = document.createElement('tr');
    tr.setAttribute('data-id', r.id);
    var grp = isGroup(r) && !isChild;
    var label = (grp ? '<strong>' + esc(r.label) + '</strong> <span class="badge-tm badge-role-manager">Grup</span>' : esc(r.label));
    if (isChild) label = '<span class="menu-child-indent"><i class="fas fa-angle-right"></i></span> ' + label;
    var url = r.url ? '<code>' + esc(r.url) + '</code>' : '<span class="text-muted">-</span>';
    var icon = r.icon ? '<code>' + esc(r.icon) + '</code>' : '-';
    var roleHtml = roleCell(r);
    var pub = '<label class="menu-check"><input type="checkbox" class="menu-publik" data-id="' + r.id + '"' + (r.publik === true ? ' checked' : '') + ' title="Tampil tanpa login" /></label>';
    var st = '<label class="menu-check"><input type="checkbox" class="menu-status" data-id="' + r.id + '"' + (r.status !== 'Nonaktif' ? ' checked' : '') + ' title="Aktif" /> Aktif</label>';
    var up = '<button type="button" class="btn btn-sm btn-outline-secondary menu-move" data-id="' + r.id + '" data-dir="up" title="Naik"><i class="fas fa-chevron-up"></i></button>';
    var down = '<button type="button" class="btn btn-sm btn-outline-secondary menu-move" data-id="' + r.id + '" data-dir="down" title="Turun"><i class="fas fa-chevron-down"></i></button>';
    var edit = '<button type="button" class="btn btn-sm btn-outline-primary menu-edit" data-id="' + r.id + '" title="Ubah"><i class="fas fa-edit"></i> Ubah</button>';
    var hapus = '<button type="button" class="btn btn-sm btn-outline-danger menu-del" data-id="' + r.id + '" title="Hapus"><i class="fas fa-trash"></i> Hapus</button>';
    tr.innerHTML =
      '<td>' + no + '. ' + label + '</td>' +
      '<td><div>' + url + '</div><div class="text-muted small">' + icon + '</div></td>' +
      '<td>' + roleHtml + '</td>' +
      '<td class="text-center">' + pub + '</td>' +
      '<td>' + st + '</td>' +
      '<td class="text-nowrap">' + up + ' ' + down + '</td>' +
      '<td class="kep-td-act text-nowrap">' + edit + ' ' + hapus + '</td>';
    return tr;
  }

  function saveFlags(r) {
    put(r, flagsPayload(r), function () {
      toast('Hak akses menu diperbarui.');
    });
  }

  function move(r, dir) {
    var list = (r.parent_id === null || r.parent_id === undefined || r.parent_id === '') ? topLevel() : childrenOf(r.parent_id);
    var idx = -1;
    for (var i = 0; i < list.length; i++) if (Number(list[i].id) === Number(r.id)) idx = i;
    var other = dir === 'up' ? list[idx - 1] : list[idx + 1];
    if (!other) return;
    var a = r.urutan, b = other.urutan;
    r.urutan = b;
    other.urutan = a;
    put(r, { urutan: r.urutan }, function () {
      put(other, { urutan: other.urutan }, function () {
        toast('Urutan menu diubah.');
        render();
      });
    });
  }

  function popParentSelect(selected) {
    var sel = document.getElementById('menu_parent');
    if (!sel) return;
    var html = '<option value="">-- Menu Utama (tanpa induk) --</option>';
    topLevel().forEach(function (t) {
      var selAttr = String(selected) === String(t.id) ? ' selected' : '';
      html += '<option value="' + t.id + '"' + selAttr + '>' + esc(t.label) + '</option>';
    });
    sel.innerHTML = html;
  }

  function resetForm() {
    var form = document.querySelector('.menu-form');
    if (!form) return;
    form.reset();
    form.classList.remove('was-validated');
    editingId = null;
    editingGroupId = null;
    document.querySelector('.menu-modal-title').textContent = 'Tambah Menu';
    popParentSelect('');
    form.querySelector('[name="label"]').focus();
  }

  function openEdit(r) {
    editingId = r.id;
    editingGroupId = isGroup(r) ? r.id : null;
    var form = document.querySelector('.menu-form');
    form.querySelector('[name="label"]').value = r.label || '';
    form.querySelector('[name="icon"]').value = r.icon || '';
    form.querySelector('[name="url"]').value = r.url || '';
    form.querySelector('[name="parent_id"]').value = r.parent_id || '';
    form.querySelector('[name="urutan"]').value = r.urutan || 0;
    form.querySelector('[name="for_administrator"]').checked = r.for_administrator === true;
    form.querySelector('[name="for_manager"]').checked = r.for_manager === true;
    form.querySelector('[name="for_staff"]').checked = r.for_staff === true;
    form.querySelector('[name="publik"]').checked = r.publik === true;
    form.querySelector('[name="status"]').value = r.status || 'Aktif';
    document.querySelector('.menu-modal-title').textContent = 'Ubah Menu';
    popParentSelect(r.parent_id);
    $('#modalMenu').modal('show');
  }

  function collect(form) {
    var payload = {};
    Array.prototype.slice.call(form.querySelectorAll('[name]')).forEach(function (el) {
      if (el.type === 'checkbox') payload[el.name] = el.checked;
      else payload[el.name] = el.value;
    });
    payload.publik = payload.publik === true;
    payload.urutan = Number(payload.urutan) || 0;
    return payload;
  }

  function submitForm(form) {
    if (!form.checkValidity()) { form.classList.add('was-validated'); toast('Periksa isian wajib.'); return; }
    var payload = collect(form);
    var url = '/api/kep/menu';
    var method = 'POST';
    if (editingId) { url += '/' + editingId; method = 'PUT'; }
    fetch(url, { method: method, headers: headers(), body: JSON.stringify(payload) })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res.ok) {
          toast(editingId ? 'Menu berhasil diubah.' : 'Menu berhasil ditambahkan.');
          $('#modalMenu').modal('hide');
          setTimeout(function () { location.reload(); }, 600);
        } else toast('Gagal menyimpan: ' + (res.error || 'unknown'));
      })
      .catch(function () { toast('Terjadi kesalahan.'); });
  }

  function removeRow(r) {
    var note = isGroup(r) ? ' dan semua item di dalamnya' : '';
    if (!confirm('Yakin ingin menghapus menu "' + r.label + '"' + note + '?')) return;
    var kids = childrenOf(r.id);
    function afterKids() { del(r.id, function () { toast('Menu dihapus.'); setTimeout(function () { location.reload(); }, 600); }); }
    if (kids.length) {
      var left = kids.length;
      kids.forEach(function (k) {
        del(k.id, function () {
          left--;
          if (left === 0) afterKids();
        });
      });
    } else afterKids();
  }

  document.addEventListener('change', function (e) {
    var r = null;
    if (e.target.classList.contains('menu-role') || e.target.classList.contains('menu-publik') || e.target.classList.contains('menu-status')) {
      r = find(e.target.getAttribute('data-id'));
      if (!r) return;
      if (e.target.classList.contains('menu-role')) {
        var role = e.target.getAttribute('data-role');
        r['for_' + role] = e.target.checked;
      } else if (e.target.classList.contains('menu-publik')) {
        r.publik = e.target.checked;
      } else if (e.target.classList.contains('menu-status')) {
        r.status = e.target.checked ? 'Aktif' : 'Nonaktif';
      }
      saveFlags(r);
      render();
    }
  });

  document.addEventListener('click', function (e) {
    var m = e.target.closest('.menu-move');
    if (m) {
      e.preventDefault();
      var r = find(m.getAttribute('data-id'));
      if (r) move(r, m.getAttribute('data-dir'));
      return;
    }
    var ed = e.target.closest('.menu-edit');
    if (ed) {
      e.preventDefault();
      var r2 = find(ed.getAttribute('data-id'));
      if (r2) openEdit(r2);
      return;
    }
    var dd = e.target.closest('.menu-del');
    if (dd) {
      e.preventDefault();
      var r3 = find(dd.getAttribute('data-id'));
      if (r3) removeRow(r3);
      return;
    }
  });

  document.addEventListener('submit', function (e) {
    if (e.target.classList.contains('menu-form')) {
      e.preventDefault();
      submitForm(e.target);
    }
  });

  if (window.$ && $.fn && $.fn.modal) {
    $(document).on('show.bs.modal', '#modalMenu', function () {
      if (editingId) popParentSelect(find(editingId).parent_id);
    });
  }

  render();
})();
