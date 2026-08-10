/* Dashboard Pegawai Personal — mobile single page.
   Muat data dari /api/dashboard, tampilkan skeleton, lalu render
   Card Box & Bottom Sheet. Seluruh data sudah dibatasi di backend
   per pegawai yang login. Pegawai dapat menambah/mengedit datanya
   sendiri (kecuali Arsip Presensi yang dikelola admin). */
(function () {
	'use strict';

	var DATA = null;
	var CACHE = {};            // cache per Card (dimuat malas / lazy)
	var PENDING = {};          // promise per Card yang sedang dimuat (dedupe request)
	var SD = null;             // data bagian yang sedang terbuka
	var BASE_SHEETS = { profil: 1, status: 1, pppk: 1 };
	var PRES_FILTER = { tahun: String(new Date().getFullYear()) };
	var ARSIP_FILTER = { q: '', kat: '' };
	var CUR_SHEET = '';
	var UPLOADED = {};

	// Cache persisten per-akun (sessionStorage): bertahan meski halaman
	// dimuat ulang dalam sesi yang sama, jadi Card Box tidak perlu memuat
	// data berulang. Kunci memakai username agar tidak bocor antar akun.
	function storeKey() {
		var u = (window.DASH_ME && window.DASH_ME.username) || '';
		return 'dash_' + (u || 'anon');
	}

	function persistState() {
		if (!DATA || !DATA.found) return;
		try {
			sessionStorage.setItem(storeKey(), JSON.stringify({ v: 1, data: DATA, parts: CACHE }));
		} catch (e) { /* kuota penuh / mode privat: biarkan tanpa cache */ }
	}

	function loadPersisted() {
		try {
			var raw = sessionStorage.getItem(storeKey());
			if (!raw) return null;
			var s = JSON.parse(raw);
			if (!s || s.v !== 1 || !s.data || !s.data.found) return null;
			// Pastikan data tersimpan milik pegawai yang sedang login,
			// agar tidak menampilkan data akun lain di perangkat yang sama.
			var me = window.DASH_ME || {};
			if (me.pegawai_id && String(s.data.pegawai_id) !== String(me.pegawai_id)) return null;
			return s;
		} catch (e) { return null; }
	}

	// Gabungkan cache bagian yang tersimpan bila pegawai yang sama.
	function hydrateCache() {
		var s = loadPersisted();
		if (!s || !s.parts || !s.data) return;
		if (String(s.data.pegawai_id) !== String(DATA.pegawai_id)) return;
		Object.keys(s.parts).forEach(function (k) { CACHE[k] = s.parts[k]; });
	}

	var $ = function (sel) { return document.querySelector(sel); };

	function esc(v) {
		return String(v == null ? '' : v)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}

	var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

	function fmtTanggal(v) {
		if (!v) return '-';
		var m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
		if (!m) return String(v);
		var t = new Date(+m[1], +m[2] - 1, +m[3]);
		return String(t.getDate()).padStart(2, '0') + ' ' + BULAN[t.getMonth()] + ' ' + t.getFullYear();
	}

	function badge(v, map) {
		var cls = (map && map[String(v)]) || '';
		return '<span class="dash-badge ' + cls + '">' + esc(v) + '</span>';
	}

	var STATUS_BADGE = {
		'Aktif': 'b-green', 'AKTIF': 'b-green',
		'BELUM AKTIF': 'b-gray', 'SEGERA BERAKHIR': 'b-amber', 'BERAKHIR': 'b-red',
		'BELUM LENGKAP': 'b-gray',
		'Diajukan': 'b-amber', 'Disetujui': 'b-green', 'Ditolak': 'b-red',
		'Draft': 'b-gray', 'Selesai': 'b-green', 'Diproses': 'b-blue', 'Usulan': 'b-amber'
	};

	function secTitle(t) { return '<div class="dash-sec-title">' + esc(t) + '</div>'; }

	function kv(label, value) {
		return '<div class="dash-kv"><span class="k">' + esc(label) + '</span><span class="v">' + (value == null || value === '' ? '<span class="dash-badge b-gray">-</span>' : value) + '</span></div>';
	}

	function emptyBox(msg) {
		return '<div class="dash-empty-sm"><i class="far fa-folder-open"></i><div>' + esc(msg) + '</div></div>';
	}

	function errBox() {
		return '<div class="dash-empty-sm"><i class="fas fa-exclamation-triangle"></i><div>Data gagal dimuat.<br>Silakan coba lagi.</div><button type="button" class="dash-btn" data-sheet-retry><i class="fas fa-sync-alt"></i> Coba Lagi</button></div>';
	}

	/* ---------------- Helper API & refresh ---------------- */

	function csrfToken() {
		return (window.DASH_CFG && window.DASH_CFG.csrf) || '';
	}

	function apiSelf(method, path, body) {
		return fetch('/api/self' + path, {
			method: method,
			headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken() },
			body: JSON.stringify(body || {})
		}).then(function (res) { return res.json(); });
	}

	// Fetch JSON dengan retry otomatis untuk 5xx/504 (mis. Supabase/Vercel
	// sesaat lambat saat cold start) DAN batas waktu fetch (AbortController).
	// Tanpa batas waktu, koneksi yang menggantung membuat Card Box tampil
	// "Memuat…" / skeleton selamanya. Upaya terakhir tetap mengembalikan JSON.
	function fetchJson(url, tries) {
		var maxTries = tries || 3;
		var TIMEOUT = 12000;
		function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
		function attempt(n) {
			var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
			var opts = { headers: { 'Accept': 'application/json' } };
			if (ctrl) opts.signal = ctrl.signal;
			var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT);
			return fetch(url, opts)
				.then(function (res) {
					clearTimeout(timer);
					if (res.status >= 500 && n < maxTries) {
						return delay(600 * n).then(function () { return attempt(n + 1); });
					}
					return res.json().catch(function () { return { ok: false, error: 'HTTP ' + res.status }; });
				})
				.catch(function (err) {
					clearTimeout(timer);
					if (n < maxTries) return delay(600 * n).then(function () { return attempt(n + 1); });
					throw err;
				});
		}
		return attempt(1);
	}

	function refreshBase() {
		return fetchJson('/api/dashboard').then(function (json) {
			if (json.ok && json.data && json.data.found) {
				DATA = json.data;
				persistState();
				renderHeader();
				renderInfo();
				return true;
			}
			return false;
		});
	}

	function refreshSheetData(key) {
		delete CACHE[key];
		PENDING[key] = null;
		return fetchJson('/api/dashboard/' + key).then(function (json) {
			if (json.ok && json.data) {
				CACHE[key] = json.data;
				persistState();
				return true;
			}
			return false;
		});
	}

	// Setelah simpan/hapus: segarkan hanya data dasar + bagian yang berubah,
	// bukan seluruh aplikasi (hindari request berulang).
	function afterMutate(modul) {
		var p = refreshBase();
		if (modul && modul !== 'profil' && !BASE_SHEETS[modul]) {
			p = p.then(function () { return refreshSheetData(modul); });
		}
		return p;
	}

	function reloadSheet() {
		if (CUR_SHEET && RENDERERS[CUR_SHEET]) {
			SD = BASE_SHEETS[CUR_SHEET] ? DATA : (CACHE[CUR_SHEET] || null);
			try { RENDERERS[CUR_SHEET](); }
			catch (e) { console.error('Sheet reload [' + CUR_SHEET + ']:', e); $('#sheetBody').innerHTML = errBox(); }
		}
	}

	/* ---------------- Render utama ---------------- */

	function renderHeader() {
		var h = DATA.header;
		$('#dashAvatar').innerHTML = h.foto
			? '<img src="' + esc(h.foto) + '" alt="Foto" onerror="this.src=\'/images/no_photo.png\'" />'
			: '<img src="/images/no_photo.png" alt="Foto" />';
		$('#dashName').textContent = h.nama || '-';
		$('#dashNip').textContent = h.nip || '-';
		$('#dashJabatan').textContent = h.jabatan || '-';
		$('#dashSekolah').textContent = h.unit || '-';
	}

	function renderInfo() {
		var i = DATA.identitas;
		var items = [
			{ label: 'Status', value: badge(i.status, { 'PNS': 'b-violet', 'PPPK': 'b-green', 'PPPK Paruh Waktu': 'b-cyan', 'Non-ASN': 'b-gray' }) },
			{ label: 'Jabatan', value: esc(i.jabatan || '-') },
			{ label: 'Unit Kerja', value: esc(i.unit || '-') },
			{ label: 'NUPTK', value: esc(i.nuptk || '-') }
		];
		$('#dashInfo').innerHTML = items.map(function (it) {
			return '<div class="dash-info-card"><div class="dash-info-label">' + it.label + '</div><div class="dash-info-value">' + it.value + '</div></div>';
		}).join('');
	}

	/* ---------------- Self-service: tombol & aksi item ---------------- */

	// Baris data untuk prefill form edit. Bagian lazy diambil dari cache-nya.
	function sheetRows(modul) {
		if (modul === 'profil') return null;
		return CACHE[modul] || null;
	}

	function selfToolbar(modul, label) {
		return '<div class="dash-filterbar"><button type="button" class="dash-btn primary" data-selfadd="' + modul + '"><i class="fas fa-plus"></i> ' + (label || 'Tambah Data') + '</button></div>';
	}

	function itemActions(modul, item) {
		return '<div class="dash-item-actions">' +
			'<button type="button" class="file-act ghost" data-selfedit="' + modul + '" data-id="' + item.id + '"><i class="fas fa-edit"></i> Edit</button>' +
			'<button type="button" class="file-act ghost danger" data-selfdel="' + modul + '" data-id="' + item.id + '"><i class="fas fa-trash"></i> Hapus</button>' +
			'</div>';
	}

	function showSelfForm(modul, id) {
		UPLOADED = {};
		var def = SELF_DEFS[modul];
		if (!def) return;
		var rec = null;
		var rows = sheetRows(def.data);
		if (id && rows) {
			for (var i = 0; i < rows.length; i++) {
				if (String(rows[i].id) === String(id)) { rec = rows[i]; break; }
			}
		}
		var html = '<div class="dash-form">' +
			'<div class="dash-sec-title">' + esc(id ? 'Ubah ' + def.title : 'Tambah ' + def.title) + '</div>';
		def.fields.forEach(function (f) {
			var val = rec && f.rec ? rec[f.rec] : '';
			if (f.type === 'file') {
				if (val) UPLOADED[modul + ':' + f.name] = val;
				html += '<div class="dash-form-field"><label>' + esc(f.label) + (f.optional ? '' : ' <i class="req">*</i>') + '</label>' +
					'<input type="file" data-modul="' + modul + '" data-self-file="' + f.name + '" accept="' + (f.accept || 'application/pdf,application/msword,image/*') + '" />' +
					'<div class="dash-form-file" id="selfFileDisp_' + f.name + '">' + (val ? '<span class="dash-badge b-green">Terpasang</span> <span class="file-meta">' + esc(val.split('/').pop()) + '</span>' : '<span class="file-meta">Belum ada file.</span>') + '</div></div>';
				return;
			}
			if (f.type === 'select') {
				var opts = '<option value="">— pilih —</option>';
				f.options.forEach(function (o) {
					opts += '<option value="' + esc(o) + '"' + (String(val) === String(o) ? ' selected' : '') + '>' + esc(o) + '</option>';
				});
				html += '<div class="dash-form-field"><label>' + esc(f.label) + (f.optional ? '' : ' <i class="req">*</i>') + '</label><select data-fname="' + f.name + '">' + opts + '</select></div>';
				return;
			}
			if (f.type === 'textarea') {
				html += '<div class="dash-form-field"><label>' + esc(f.label) + '</label><textarea data-fname="' + f.name + '" rows="3">' + esc(val) + '</textarea></div>';
				return;
			}
			html += '<div class="dash-form-field"><label>' + esc(f.label) + (f.optional ? '' : ' <i class="req">*</i>') + '</label>' +
				'<input type="' + (f.type || 'text') + '" data-fname="' + f.name + '" value="' + esc(val) + '"' + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + ' /></div>';
		});
		html += '<div class="dash-form-msg" id="selfFormMsg"></div>' +
			'<div class="dash-sheet-actions"><button type="button" class="dash-btn primary" data-self-save="' + modul + '"' + (id ? ' data-id="' + id + '"' : '') + '><i class="fas fa-save"></i> Simpan</button>' +
			'<button type="button" class="dash-btn" data-self-cancel><i class="fas fa-times"></i> Batal</button></div></div>';
		$('#sheetBody').innerHTML = html;
	}

	function submitSelf(modul, id, payload) {
		return apiSelf(id ? 'PUT' : 'POST', '/' + modul + (id ? '/' + id : ''), payload);
	}

	function saveSelf(modul, id) {
		var def = SELF_DEFS[modul];
		if (!def) return;
		var payload = {};
		def.fields.forEach(function (f) {
			if (f.type === 'file') {
				var u = UPLOADED[modul + ':' + f.name];
				if (u) payload[f.name] = u;
				return;
			}
			var el = $('#sheetBody').querySelector('[data-fname="' + f.name + '"]');
			var v = el ? String(el.value || '').trim() : '';
			if (v !== '') payload[f.name] = v;
		});
		var msg = $('#selfFormMsg');
		var btn = $('#sheetBody').querySelector('[data-self-save]');
		if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan…'; }
		var p;
		if (modul === 'profil') {
			var foto = UPLOADED['profil:foto'];
			var payloadProfil = {};
			def.fields.forEach(function (f) {
				if (f.type === 'file') return;
				var el = $('#sheetBody').querySelector('[data-fname="' + f.name + '"]');
				var v = el ? String(el.value || '').trim() : '';
				if (v !== '') payloadProfil[f.name] = v;
			});
			if (foto && String(foto).indexOf('data:') === 0) {
				var mime = (String(foto).match(/^data:([^;]+)/) || [])[1] || 'image/jpeg';
				var b64 = String(foto).split(',')[1] || '';
				p = apiSelf('POST', '/foto', { contentType: mime, base64: b64 })
					.then(function (res) {
						if (!res || !res.ok) throw new Error((res && res.error) || 'Foto gagal diunggah');
						return apiSelf('PUT', '/profil', payloadProfil);
					});
			} else {
				p = apiSelf('PUT', '/profil', payloadProfil);
			}
		} else p = submitSelf(modul, id, payload);
		p.then(function (res) {
			if (res && res.ok) {
				return afterMutate(modul).then(function () { reloadSheet(); });
			}
			if (msg) msg.innerHTML = '<span class="dash-badge b-red">' + esc((res && res.error) || 'Gagal menyimpan.') + '</span>';
			if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan'; }
		}).catch(function (err) {
			console.error('SELF save:', err);
			if (msg) msg.innerHTML = '<span class="dash-badge b-red">Gagal menyimpan.</span>';
			if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan'; }
		});
	}

	function delSelf(modul, id) {
		if (!window.confirm('Hapus data ini? Tindakan tidak dapat dibatalkan.')) return;
		apiSelf('DELETE', '/' + modul + '/' + id).then(function (res) {
			if (res && res.ok) { afterMutate(modul).then(reloadSheet); }
			else window.alert((res && res.error) || 'Gagal menghapus data.');
		}).catch(function (err) { console.error('SELF delete:', err); window.alert('Gagal menghapus data.'); });
	}

	/* ---------------- Definisi form self-service ---------------- */

	var SELF_DEFS = {
		profil: {
			title: 'Profil',
			data: 'profil',
			fields: [
				{ name: 'foto', label: 'Foto Profil', type: 'file', rec: 'foto', optional: true, accept: 'image/*' },
				{ name: 'jk', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'], rec: 'jk' },
				{ name: 'ttl', label: 'Tempat & Tanggal Lahir', type: 'text', rec: 'ttl', placeholder: 'cth: Bandung, 17 Agustus 1990' },
				{ name: 'alamat', label: 'Alamat', type: 'textarea', rec: 'alamat' },
				{ name: 'hp', label: 'Nomor HP', type: 'tel', rec: 'hp', placeholder: '08xxxxxxxxxx' },
				{ name: 'email', label: 'Email', type: 'email', rec: 'email' },
				{ name: 'pendidikan', label: 'Pendidikan Terakhir', type: 'select', options: ['SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'], rec: 'pendidikan' },
				{ name: 'jurusan', label: 'Program Studi', type: 'text', rec: 'jurusan' }
			]
		},
		mutasi: {
			title: 'Mutasi',
			data: 'mutasi',
			fields: [
				{ name: 'jenis', label: 'Jenis Mutasi', type: 'select', options: ['Pindah Tugas', 'Pindah Instansi', 'Mutasi Internal', 'Promosi', 'Demosi'], rec: 'jenis' },
				{ name: 'asal', label: 'Dari (Instansi/Sekolah)', type: 'text', rec: 'asal' },
				{ name: 'tujuan', label: 'Ke (Instansi/Sekolah)', type: 'text', rec: 'tujuan' },
				{ name: 'tanggal', label: 'Tanggal Mutasi', type: 'date', rec: 'tanggal' },
				{ name: 'nomor_sk', label: 'Nomor SK', type: 'text', rec: 'nomorSk', optional: true },
				{ name: 'dokumen', label: 'Dokumen', type: 'file', rec: 'dokumen', optional: true },
				{ name: 'keterangan', label: 'Keterangan', type: 'textarea', rec: 'keterangan', optional: true }
			]
		},
		jabatan: {
			title: 'Jabatan & Penugasan',
			data: 'jabatan',
			fields: [
				{ name: 'jabatan', label: 'Nama Jabatan', type: 'text', rec: 'jabatan' },
				{ name: 'jenis', label: 'Jenis', type: 'select', options: ['Utama', 'Tambahan'], rec: 'jenis' },
				{ name: 'tmt', label: 'TMT Jabatan', type: 'date', rec: 'tmt' },
				{ name: 'nomor_sk', label: 'Nomor SK', type: 'text', rec: 'nomorSk', optional: true },
				{ name: 'tanggal_sk', label: 'Tanggal SK', type: 'date', rec: 'tanggalSk', optional: true },
				{ name: 'keterangan', label: 'Keterangan', type: 'textarea', rec: 'keterangan', optional: true }
			]
		},
		sertifikasi: {
			title: 'Sertifikasi & Tunjangan',
			data: 'sertifikasi',
			fields: [
				{ name: 'nama_sertifikasi', label: 'Nama Sertifikasi', type: 'text', rec: 'nama' },
				{ name: 'bidang', label: 'Bidang Studi', type: 'text', rec: 'bidang' },
				{ name: 'nomor', label: 'Nomor Sertifikat', type: 'text', rec: 'nomor', optional: true },
				{ name: 'tahun', label: 'Tahun Sertifikasi', type: 'number', rec: 'tahun' },
				{ name: 'tunjangan', label: 'Tunjangan', type: 'text', rec: 'tunjangan', optional: true },
				{ name: 'keterangan', label: 'Keterangan', type: 'textarea', rec: 'keterangan', optional: true }
			]
		},
		cuti: {
			title: 'Cuti',
			data: 'cuti',
			fields: [
				{ name: 'jenis', label: 'Jenis Cuti', type: 'select', options: ['Cuti Tahunan', 'Cuti Besar', 'Cuti Sakit', 'Cuti Melahirkan', 'Cuti Karena Alasan Penting', 'Cuti Bersama'], rec: 'jenis' },
				{ name: 'mulai', label: 'Tanggal Mulai', type: 'date', rec: 'mulai' },
				{ name: 'selesai', label: 'Tanggal Selesai', type: 'date', rec: 'selesai' },
				{ name: 'lama', label: 'Lama Cuti (hari)', type: 'number', rec: 'lama', optional: true }
			]
		},
		surat: {
			title: 'Surat Kepegawaian',
			data: 'surat',
			fields: [
				{ name: 'jenis', label: 'Jenis Surat', type: 'text', rec: 'jenis' },
				{ name: 'nomor', label: 'Nomor Surat', type: 'text', rec: 'nomor', optional: true },
				{ name: 'tanggal', label: 'Tanggal Surat', type: 'date', rec: 'tanggal', optional: true },
				{ name: 'perihal', label: 'Perihal', type: 'text', rec: 'perihal' },
				{ name: 'isi', label: 'Isi / Keterangan', type: 'textarea', rec: 'isi', optional: true }
			]
		},
		arsip: {
			title: 'Arsip Kepegawaian',
			data: 'arsip',
			fields: [
				{ name: 'kategori', label: 'Kategori', type: 'text', rec: 'kategori' },
				{ name: 'nama_dokumen', label: 'Nama Dokumen', type: 'text', rec: 'nama_dokumen' },
				{ name: 'file', label: 'File', type: 'file', rec: 'file' },
				{ name: 'keterangan', label: 'Keterangan', type: 'textarea', rec: 'keterangan', optional: true }
			]
		}
	};

	/* ---------------- Sheet renderer per layanan ---------------- */

	function sheetProfil() {
		var p = DATA.profil;
		var identitas = kv('Nama Lengkap', esc(p.nama)) + kv('NIP', esc(p.nip)) +
			kv('NI PPPK', esc(p.nik === p.nip ? '-' : p.nik)) + kv('NIK', esc(p.nik)) +
			kv('NUPTK', esc(p.nuptk)) + kv('Tempat & Tgl Lahir', esc(p.ttl)) +
			kv('Jenis Kelamin', esc(p.jk)) + kv('Alamat', esc(p.alamat)) +
			kv('Nomor HP', esc(p.hp)) + kv('Email', esc(p.email));
		var kepeg = kv('Status Kepegawaian', badge(p.status, { 'PNS': 'b-violet', 'PPPK': 'b-green', 'PPPK Paruh Waktu': 'b-cyan', 'Non-ASN': 'b-gray' })) +
			kv('Jabatan', esc(p.jabatan)) + kv('Pangkat/Golongan', esc(p.pangkat) + ' / ' + esc(p.golongan)) +
			kv('TMT', esc(p.tmt)) + kv('Sekolah', esc(p.sekolah)) + kv('Unit Kerja', esc(p.unitKerja));
		var pend = kv('Pendidikan Terakhir', esc(p.pendidikan)) + kv('Program Studi', esc(p.jurusan)) +
			kv('Tahun Lulus', esc(p.tahunLulus));
		return selfToolbar('profil', 'Edit Profil') +
			secTitle('Identitas') + identitas + secTitle('Kepegawaian') + kepeg + secTitle('Pendidikan') + pend;
	}

	function sheetStatus() {
		var s = DATA.statusKepegawaian;
		return kv('Status', badge(s.status, { 'PNS': 'b-violet', 'PPPK': 'b-green', 'PPPK Paruh Waktu': 'b-cyan', 'Non-ASN': 'b-gray' })) +
			kv('Nomor Identitas', esc(s.nomorIdentitas)) + kv('TMT', esc(s.tmt)) +
			kv('Jabatan', esc(s.jabatan)) + kv('Unit Kerja', esc(s.unit));
	}

	function sheetPppk() {
		var p = DATA.periodePppk;
		if (!p) {
			return '<div class="dash-sec">' + emptyBox('Data periode PPPK tidak tersedia.') + '</div>';
		}
		return kv('Status PPPK', badge(p.statusKepegawaian, { 'PPPK': 'b-green', 'PPPK Paruh Waktu': 'b-cyan' })) +
			kv('TMT', esc(fmtTanggal(p.tmt))) +
			kv('Tanggal Mulai Kontrak', esc(fmtTanggal(p.tanggalMulai))) +
			kv('Tanggal Akhir Kontrak', esc(fmtTanggal(p.tanggalBerakhir))) +
			kv('Masa Kontrak', esc(p.masaLabel)) +
			kv('Periode Ke', esc(p.periodeKe == null ? '-' : p.periodeKe)) +
			kv('Sisa Kontrak', p.sisa == null ? '-' : fmtSisa(p.sisa)) +
			kv('Status Periode', badge(p.status, STATUS_BADGE));
	}

	function fmtSisa(days) {
		if (days < 0) return 'Telah berakhir';
		if (days < 365) return days + ' hari';
		var y = Math.floor(days / 365);
		var m = Math.floor((days % 365) / 30);
		return y + ' tahun ' + m + ' bulan';
	}

	function sheetPangkat() {
		var p = SD || {};
		var hasRiwayat = p.riwayat && p.riwayat.length;
		if (!p.pangkat && !p.golongan && !hasRiwayat) {
			return '<div class="dash-sec">' + emptyBox('Data pangkat belum tersedia.') + '</div>';
		}
		var out = secTitle('Pangkat Saat Ini') + kv('Pangkat/Golongan', esc(p.pangkat) + ' / ' + esc(p.golongan)) + kv('TMT Pangkat', esc(p.tmt));
		if (hasRiwayat) {
			out += secTitle('Riwayat Pangkat');
			out += p.riwayat.map(function (r) {
				return '<div class="dash-timeline"><div class="dash-tl-item"><div class="tl-title">' + esc(r.lama) + ' → ' + esc(r.baru) + '</div><div class="tl-sub">TMT: ' + esc(fmtTanggal(r.tmt)) + '</div><div class="tl-date">' + badge(r.status, STATUS_BADGE) + '</div></div></div>';
			}).join('');
		}
		return out;
	}

	function sheetKgb() {
		var k = SD || [];
		if (!k.length) {
			return '<div class="dash-sec">' + emptyBox('Data KGB belum tersedia.') + '</div>';
		}
		return k.map(function (r, i) {
			var chip = '';
			if (r.indikator === 'Jatuh Tempo') chip = '<span class="dash-chip due">Jatuh tempo</span>';
			else if (r.indikator === 'Mendekati') chip = '<span class="dash-chip near">Mendekati</span>';
			else if (r.indikator === 'Masih Jauh') chip = '<span class="dash-chip far">Masih jauh</span>';
			return '<div class="dash-sec">' + secTitle('KGB ke-' + (i + 1)) +
				kv('Gaji Pokok', esc(r.gaji)) + kv('Pangkat/Golongan', esc(r.pangkat)) +
				kv('TMT KGB', esc(fmtTanggal(r.tmtLama))) + kv('KGB Berikutnya', esc(fmtTanggal(r.tmtBerikut))) +
				kv('Indikator', chip) + kv('Status', badge(r.status, STATUS_BADGE)) + '</div>';
		}).join('');
	}

	function sheetMutasi() {
		var list = SD || [];
		var out = selfToolbar('mutasi');
		if (!list.length) {
			return out + '<div class="dash-sec">' + emptyBox('Belum ada data mutasi.') + '</div>';
		}
		return out + list.map(function (m) {
			return '<div class="dash-timeline"><div class="dash-tl-item"><div class="tl-title">' + esc(m.jenis || 'Mutasi') + '</div>' +
				'<div class="tl-sub">' + esc(m.asal) + ' → ' + esc(m.tujuan) + '</div>' +
				'<div class="tl-sub">Unit: ' + esc(m.keterangan || '-') + '</div>' +
				'<div class="tl-sub">SK: ' + esc(m.nomorSk || '-') + '</div>' +
				'<div class="tl-date">' + esc(fmtTanggal(m.tanggal)) + ' &nbsp; ' + badge(m.status, STATUS_BADGE) + '</div>' +
				(m.dokumen ? '<div class="tl-date"><a href="' + esc(m.dokumen) + '" target="_blank" rel="noopener"><i class="fas fa-paperclip"></i> Dokumen</a></div>' : '') +
				itemActions('mutasi', m) +
				'</div></div>';
		}).join('');
	}

	function sheetJabatan() {
		var j = SD || [];
		var utama = j.filter(function (x) { return /utama/i.test(x.jenis); });
		var tambahan = j.filter(function (x) { return !/utama/i.test(x.jenis); });
		var out = selfToolbar('jabatan');
		if (!j.length) {
			return out + '<div class="dash-sec">' + emptyBox('Belum ada data jabatan & penugasan.') + '</div>';
		}
		if (utama.length) {
			out += secTitle('Jabatan Utama');
			out += utama.map(jabatanCard).join('');
		}
		if (tambahan.length) {
			out += secTitle('Tugas Tambahan');
			out += tambahan.map(jabatanCard).join('');
		}
		return out;
	}

	function jabatanCard(r) {
		return '<div class="dash-sec">' +
			kv('Jabatan', esc(r.jabatan)) + kv('TMT', esc(fmtTanggal(r.tmt))) +
			kv('Nomor SK', esc(r.nomorSk)) + kv('Tanggal SK', esc(fmtTanggal(r.tanggalSk))) +
			kv('Status', badge(r.status, STATUS_BADGE)) + kv('Keterangan', esc(r.keterangan)) +
			itemActions('jabatan', r) + '</div>';
	}

	function sheetSertifikasi() {
		var list = SD || [];
		var out = selfToolbar('sertifikasi');
		if (!list.length) {
			return out + '<div class="dash-sec">' + emptyBox('Belum ada data sertifikasi & tunjangan.') + '</div>';
		}
		return out + list.map(function (s) {
			return '<div class="dash-sec">' +
				kv('Nama Sertifikasi', esc(s.nama)) + kv('Bidang Studi', esc(s.bidang)) +
				kv('Nomor Sertifikat', esc(s.nomor)) + kv('Tahun Sertifikasi', esc(s.tahun)) +
				kv('Status', badge(s.status, STATUS_BADGE)) + kv('Tunjangan', esc(s.tunjangan)) +
				kv('Status Bayar', badge(s.statusBayar, { 'Dibayar': 'b-green', 'Belum Dibayar': 'b-amber' })) +
				kv('Keterangan', esc(s.keterangan)) +
				itemActions('sertifikasi', s) + '</div>';
		}).join('');
	}

	function sheetCuti() {
		var list = SD || [];
		var out = selfToolbar('cuti');
		if (!list.length) {
			return out + '<div class="dash-sec">' + emptyBox('Belum ada data cuti.') + '</div>';
		}
		return out + list.map(function (c) {
			return '<div class="dash-sec">' +
				kv('Jenis Cuti', esc(c.jenis)) + kv('Tanggal Mulai', esc(fmtTanggal(c.mulai))) +
				kv('Tanggal Selesai', esc(fmtTanggal(c.selesai))) + kv('Lama Cuti', esc(c.lama)) +
				kv('Status', badge(c.status, STATUS_BADGE)) +
				itemActions('cuti', c) + '</div>';
		}).join('');
	}

	function sheetBup() {
		var b = SD || {};
		var out = secTitle('Batas Usia Pensiun') +
			kv('Tanggal Lahir', esc(fmtTanggal(b.tglLahir))) + kv('Status Kepegawaian', badge(b.jenis, STATUS_BADGE)) +
			kv('Usia BUP', b.usiaBup ? esc(b.usiaBup + ' tahun') : '-') +
			kv('BUP', esc(fmtTanggal(b.bup))) +
			kv('Perkiraan Tahun Pensiun', esc(b.perkiraan || '-')) +
			kv('Sisa Masa Kerja', b.sisaHari == null ? '-' : fmtSisa(b.sisaHari)) +
			kv('Status', b.status ? badge(b.status, { 'Mendekati BUP': 'b-amber', 'BUP Terlampaui': 'b-red', 'Masih Jauh': 'b-green', 'Tidak Ada BUP': 'b-gray' }) : '-');
		if (b.riwayat && b.riwayat.length) {
			out += secTitle('Riwayat Pensiun');
			out += b.riwayat.map(function (r) {
				return kv('BUP', esc(fmtTanggal(r.bup))) + kv('Perkiraan', esc(r.perkiraan)) + kv('Status', esc(r.status));
			}).join('');
		}
		return out;
	}

	/* ----- Arsip Presensi (view-only, dikelola admin) ----- */

	function presensiYears() {
		var r = DATA.presensiRange || {};
		var s = parseInt(r.startYear, 10);
		var e = parseInt(r.endYear, 10);
		var cur = new Date().getFullYear();
		if (!s || isNaN(s)) s = cur;
		if (!e || isNaN(e)) e = s;
		if (e < s) e = s;
		var out = [];
		for (var y = s; y <= e; y++) out.push(String(y));
		return out;
	}

	function presensiFileMeta(file) {
		var name = '', date = '';
		if (file) {
			var parts = file.split('/');
			name = parts[parts.length - 1] || file;
			var m = name.match(/^(\d{13})/);
			if (m) {
				var d = new Date(+m[1]);
				if (!isNaN(d.getTime())) date = String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear();
			}
		}
		return { name: name, date: date };
	}

	function presensiRangeBar() {
		var years = presensiYears();
		if (!PRES_FILTER.tahun || years.indexOf(PRES_FILTER.tahun) === -1) PRES_FILTER.tahun = years[years.length - 1];
		var pills = years.map(function (y) {
			return '<button type="button" class="pres-year' + (y === PRES_FILTER.tahun ? ' on' : '') + '" data-pres-year="' + y + '">' + y + '</button>';
		}).join('');
		var range = DATA.presensiRange && (DATA.presensiRange.startYear !== DATA.presensiRange.endYear);
		return '<div class="dash-sec-title">Arsip Presensi ' + esc(PRES_FILTER.tahun) + (range ? ' s/d ' + esc(DATA.presensiRange.endYear) + ' (hingga TMT akhir)' : '') + '</div>' +
			'<div class="dash-filterbar"><div class="pres-years">' + pills + '</div></div><div id="presList"></div>';
	}

	function presensiGrid() {
		var tahun = PRES_FILTER.tahun;
		var rows = (SD || []).filter(function (r) { return String(r.tahun) === tahun; });
		var map = {};
		rows.forEach(function (r) { map[String(r.bulan)] = r; });
		var out = '<div class="pres-grid">';
		for (var i = 0; i < 12; i++) {
			var bln = BULAN[i];
			var r = map[bln];
			var file = r && r.file;
			out += '<div class="pres-cell' + (file ? ' has' : '') + '">' +
				'<div class="pres-cell-month">' + esc(bln) + '</div>';
			if (file) {
				var meta = presensiFileMeta(file);
				out += '<div class="pres-cell-file">' +
					'<div class="file-meta">' + esc(meta.name) + '</div>' +
					'<div class="pres-cell-acts">' +
					'<button class="file-act primary" onclick="window.open(\'' + esc(file) + '\',\'_blank\')">Lihat</button>' +
					'<a class="file-act ghost" href="' + esc(file) + '" download>Download</a>' +
					'</div></div>';
			} else {
				out += '<div class="pres-cell-empty">Belum ada</div>';
			}
			out += '</div>';
		}
		out += '</div>';
		return out;
	}

	function sheetPresensi() {
		var body = $('#sheetBody');
		body.innerHTML = '<div class="dash-sec">' + presensiRangeBar() + '</div>';
		$('#presList').innerHTML = presensiGrid();
	}

	function reloadPresensiGrid() {
		var body = $('#sheetBody');
		body.innerHTML = '<div class="dash-sec">' + presensiRangeBar() + '</div>';
		$('#presList').innerHTML = presensiGrid();
	}

	/* ----- Arsip Kepegawaian ----- */

	function arsipKategoriList() {
		var set = [];
		(SD || []).forEach(function (r) { if (r.kategori && set.indexOf(r.kategori) === -1) set.push(r.kategori); });
		return set.sort();
	}

	function arsipList() {
		var rows = (SD || []).filter(function (r) {
			var q = ARSIP_FILTER.q.toLowerCase();
			if (q && (r.nama_dokumen || '').toLowerCase().indexOf(q) === -1 && (r.keterangan || '').toLowerCase().indexOf(q) === -1) return false;
			if (ARSIP_FILTER.kat && r.kategori !== ARSIP_FILTER.kat) return false;
			return true;
		});
		if (!rows.length) return emptyBox('Belum ada arsip kepegawaian.');
		return rows.map(function (r) {
			var meta = presensiFileMeta(r.file);
			return '<div class="dash-file">' +
				'<div class="file-icon"><i class="fas fa-file-alt"></i></div>' +
				'<div class="file-info"><div class="file-name">' + esc(r.nama_dokumen) + '</div>' +
				'<div class="file-meta">' + badge(r.kategori, {}) + '</div>' +
				'<div class="file-meta">' + esc(meta.name) + ' &middot; Upload: ' + esc(meta.date || '-') + '</div></div>' +
				'<div class="file-actions">' +
				(r.file ? '<button class="file-act primary" onclick="window.open(\'' + esc(r.file) + '\',\'_blank\')">Lihat</button><a class="file-act ghost" href="' + esc(r.file) + '" download style="display:inline-flex;align-items:center;text-decoration:none">Download</a>' : '') +
				itemActions('arsip', r) +
				'</div></div>';
		}).join('');
	}

	function sheetArsip() {
		var body = $('#sheetBody');
		var kats = arsipKategoriList();
		var katOpts = '<option value="">Semua Kategori</option>' + kats.map(function (k) { return '<option value="' + esc(k) + '">' + esc(k) + '</option>'; }).join('');
		body.innerHTML = selfToolbar('arsip') + '<div class="dash-sec"><div class="dash-filterbar"><div class="dash-search-wrap"><i class="fas fa-search"></i><input id="arsipSearch" type="text" placeholder="Cari dokumen..." /></div></div><div class="dash-filterbar"><select id="arsipKat">' + katOpts + '</select></div><div id="arsipList"></div></div>';
		$('#arsipList').innerHTML = arsipList();
		$('#arsipSearch').addEventListener('input', function (e) { ARSIP_FILTER.q = e.target.value; $('#arsipList').innerHTML = arsipList(); });
		$('#arsipKat').addEventListener('change', function (e) { ARSIP_FILTER.kat = e.target.value; $('#arsipList').innerHTML = arsipList(); });
	}

	function sheetSurat() {
		var list = SD || [];
		var out = selfToolbar('surat');
		if (!list.length) {
			return out + '<div class="dash-sec">' + emptyBox('Belum ada surat kepegawaian.') + '</div>';
		}
		return out + list.map(function (s) {
			return '<div class="dash-sec">' +
				kv('Jenis', esc(s.jenis)) + kv('Nomor', esc(s.nomor)) +
				kv('Tanggal', esc(fmtTanggal(s.tanggal))) + kv('Perihal', esc(s.perihal)) +
				kv('Status', badge(s.status, STATUS_BADGE)) +
				itemActions('surat', s) + '</div>';
		}).join('');
	}

	var RENDERERS = {
		profil: sheetProfil,
		status: sheetStatus,
		pppk: sheetPppk,
		pangkat: sheetPangkat,
		kgb: sheetKgb,
		mutasi: sheetMutasi,
		jabatan: sheetJabatan,
		sertifikasi: sheetSertifikasi,
		cuti: sheetCuti,
		bup: sheetBup,
		presensi: sheetPresensi,
		arsip: sheetArsip,
		surat: sheetSurat
	};

	var SHEET_TITLES = {
		profil: 'Profil Pegawai',
		status: 'Status Kepegawaian',
		pppk: 'Periode PPPK',
		pangkat: 'Pangkat',
		kgb: 'Kenalkan Gaji Berkala',
		mutasi: 'Mutasi Kepegawaian',
		jabatan: 'Jabatan & Penugasan',
		sertifikasi: 'Sertifikasi & Tunjangan',
		cuti: 'Cuti',
		bup: 'BUP / Pensiun',
		presensi: 'Arsip Presensi',
		arsip: 'Arsip Kepegawaian',
		surat: 'Surat Kepegawaian'
	};

	/* ---------------- Bottom sheet ---------------- */

	// Dukungan deep-link: /dashboard#profil langsung membuka Card Box-nya.
	function openSheetByHash() {
		var h = (location.hash || '').replace(/^#/, '');
		if (h && RENDERERS[h] && DATA) openSheet(h);
	}

	function openSheet(key) {
		CUR_SHEET = key;
		try { if (location.hash !== '#' + key) history.replaceState(null, '', '#' + key); } catch (e) {}
		var sheet = $('#dashSheet');
		$('#sheetTitle').textContent = SHEET_TITLES[key] || 'Detail';
		$('#sheetBody').innerHTML = '<div class="dash-empty-sm"><i class="fas fa-circle-notch fa-spin"></i><div>Memuat…</div></div>';
		$('#dashBackdrop').hidden = false;
		sheet.hidden = false;
		requestAnimationFrame(function () { requestAnimationFrame(function () { sheet.classList.add('open'); }); });
		renderSheet(key);
	}

	// Render sheet dari cache bila tersedia, atau muat (lazy) lalu cache.
	// Bila sedang dimuat, gunakan promise yang sama (tidak ada request ganda).
	// Ada penjaga waktu: bila data tak kunjung tiba, tampilkan kotak error
	// (bukan "Memuat…" selamanya) saat koneksi/API menggantung.
	function renderSheet(key) {
		if (!RENDERERS[key]) return;
		if (BASE_SHEETS[key]) {
			SD = DATA;
			rendererNow(key);
			return;
		}
		if (CACHE[key]) {
			SD = CACHE[key];
			rendererNow(key);
			return;
		}
		var guard = null;
		if (!PENDING[key]) {
			guard = setTimeout(function () {
				PENDING[key] = null;
				if (CUR_SHEET === key) $('#sheetBody').innerHTML = errBox();
			}, 20000);
			PENDING[key] = fetchJson('/api/dashboard/' + key, 2).then(function (json) {
				clearTimeout(guard);
				PENDING[key] = null;
				if (!json.ok || json.data == null) throw new Error(json.error || 'Gagal memuat data');
				CACHE[key] = json.data;
				persistState();
				return CACHE[key];
			}, function (err) {
				clearTimeout(guard);
				PENDING[key] = null;
				throw err;
			});
		}
		PENDING[key].then(function (data) {
			if (CUR_SHEET !== key) return;
			SD = data;
			rendererNow(key);
		}).catch(function (err) {
			console.error('Sheet load [' + key + ']:', err);
			if (CUR_SHEET === key) $('#sheetBody').innerHTML = errBox();
		});
	}

	function rendererNow(key) {
		try { RENDERERS[key](); }
		catch (e) {
			console.error('Sheet render [' + key + ']:', e);
			$('#sheetBody').innerHTML = errBox();
		}
	}

	// Muat ulang hanya data sheet yang sedang dibuka (refresh manual).
	function refreshCurrentSheet() {
		if (!CUR_SHEET || !RENDERERS[CUR_SHEET]) return;
		var key = CUR_SHEET;
		$('#sheetBody').innerHTML = '<div class="dash-empty-sm"><i class="fas fa-circle-notch fa-spin"></i><div>Memuat ulang…</div></div>';
		var p = BASE_SHEETS[key] ? refreshBase() : refreshSheetData(key);
		p.then(function (ok) {
			if (CUR_SHEET !== key) return;
			if (!ok) { $('#sheetBody').innerHTML = errBox(); return; }
			SD = BASE_SHEETS[key] ? DATA : CACHE[key];
			rendererNow(key);
		}).catch(function (err) {
			console.error('Sheet refresh [' + key + ']:', err);
			if (CUR_SHEET === key) $('#sheetBody').innerHTML = errBox();
		});
	}

	function closeSheet() {
		var sheet = $('#dashSheet');
		sheet.classList.remove('open');
		$('#dashBackdrop').hidden = true;
		try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
		setTimeout(function () { sheet.hidden = true; }, 300);
	}

	/* ---------------- Header menu ---------------- */

	function toggleMenu() {
		var pop = $('#dashMenuPop');
		pop.hidden = !pop.hidden;
	}

	/* ---------------- Init ---------------- */

	function showSkeleton() {
		$('#dashSkeleton').hidden = false;
		$('#dashContent').hidden = true;
		$('#dashError').hidden = true;
	}

	function showError() {
		$('#dashSkeleton').hidden = true;
		$('#dashContent').hidden = true;
		$('#dashError').hidden = false;
	}

	function showNotFound() {
		$('#dashContent').hidden = true;
		$('#dashSkeleton').hidden = true;
		$('#dashError').hidden = false;
		$('#dashError').querySelector('p').innerHTML = 'Akun ini tidak terhubung dengan data pegawai.<br>Silakan hubungi administrator.';
		$('#dashRetry').style.display = 'none';
	}

	function showContent() {
		$('#dashSkeleton').hidden = true;
		$('#dashError').hidden = true;
		$('#dashContent').hidden = false;
		preloadLight();
	}

	// Preload ringan bagian yang kemungkinan besar akan dibuka (Jabatan).
	// Status Kepegawaian & Periode PPPK sudah ada di data dasar, tidak
	// diulang. Tidak pernah memuat file/arsip besar di sini.
	function preloadLight() {
		if (CACHE.jabatan || PENDING.jabatan) return;
		var run = function () {
			if (CACHE.jabatan || PENDING.jabatan) return;
			PENDING.jabatan = fetchJson('/api/dashboard/jabatan').then(function (json) {
				PENDING.jabatan = null;
				if (json.ok && json.data) {
					CACHE.jabatan = json.data;
					persistState();
				}
				return null;
			}, function () { PENDING.jabatan = null; return null; });
		};
		if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 3000 });
		else setTimeout(run, 1200);
	}

	function loadData() {
		showSkeleton();
		// Jangan biarkan skeleton tampil selamanya: bila jaringan/API macet,
		// tampilkan kotak error agar pengguna bisa mencoba lagi.
		var done = false;
		var timer = setTimeout(function () {
			if (done) return;
			done = true;
			showError();
		}, 20000);
		return fetchJson('/api/dashboard', 4).then(function (json) {
			if (done) return;
			done = true;
			clearTimeout(timer);
			if (!json.ok || !json.data) throw new Error(json.error || 'Gagal memuat data');
			DATA = json.data;
			if (!DATA.found) {
				showNotFound();
				return;
			}
			hydrateCache();
			persistState();
			renderHeader();
			renderInfo();
			showContent();
		}).catch(function (err) {
			if (done) return;
			done = true;
			clearTimeout(timer);
			console.error('Dashboard load:', err);
			showError();
		});
	}

	function sheetDelegation() {
		var body = $('#sheetBody');
		body.addEventListener('click', function (ev) {
			var t = ev.target;
			while (t && t !== body && !(t.getAttribute && (t.getAttribute('data-selfadd') || t.getAttribute('data-selfedit') || t.getAttribute('data-selfdel') || t.getAttribute('data-self-save') || t.getAttribute('data-self-cancel') || t.getAttribute('data-pres-year') || t.getAttribute('data-sheet-retry')))) t = t.parentNode;
			if (!t || t === body) return;
			if (t.getAttribute('data-selfadd') !== null) { showSelfForm(t.getAttribute('data-selfadd'), null); }
			else if (t.getAttribute('data-selfedit') !== null) { showSelfForm(t.getAttribute('data-selfedit'), t.getAttribute('data-id')); }
			else if (t.getAttribute('data-selfdel') !== null) { delSelf(t.getAttribute('data-selfdel'), t.getAttribute('data-id')); }
			else if (t.getAttribute('data-self-save') !== null) { saveSelf(t.getAttribute('data-self-save'), t.getAttribute('data-id')); }
			else if (t.getAttribute('data-self-cancel') !== null) { reloadSheet(); }
			else if (t.getAttribute('data-pres-year') !== null) { PRES_FILTER.tahun = t.getAttribute('data-pres-year'); reloadPresensiGrid(); }
			else if (t.getAttribute('data-sheet-retry') !== null) { refreshCurrentSheet(); }
		});
		body.addEventListener('change', function (ev) {
			var inp = ev.target;
			var fname = inp.getAttribute && inp.getAttribute('data-self-file');
			var modul = inp.getAttribute && inp.getAttribute('data-modul');
			if (!fname || !modul) return;
			var file = inp.files && inp.files[0];
			if (!file) return;
			var reader = new FileReader();
			reader.onload = function () {
				var base64 = String(reader.result).split(',')[1];
				var disp = document.getElementById('selfFileDisp_' + fname);
				var isFoto = (modul === 'profil' && fname === 'foto');
				if (isFoto) {
					// Foto ditunda sampai tombol Simpan agar tidak mengubah
					// foto aktif bila pengguna membatalkan form.
					UPLOADED[modul + ':' + fname] = reader.result;
					if (disp) disp.innerHTML = '<span class="dash-badge b-amber">Siap disimpan</span> <span class="file-meta">' + esc(file.name) + '</span>';
					return;
				}
				apiSelf('POST', '/upload', { filename: Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_'), contentType: file.type || 'application/octet-stream', base64: base64 })
					.then(function (res) {
						if (res && res.ok && res.url) {
							UPLOADED[modul + ':' + fname] = res.url;
							if (disp) disp.innerHTML = '<span class="dash-badge b-green">Terunggah</span> <span class="file-meta">' + esc(res.url.split('/').pop()) + '</span>';
						} else if (disp) {
							disp.innerHTML = '<span class="dash-badge b-red">Gagal: ' + esc((res && res.error) || 'upload') + '</span>';
						}
					}).catch(function (err) {
						console.error('SELF upload:', err);
						if (disp) disp.innerHTML = '<span class="dash-badge b-red">Gagal mengunggah.</span>';
					});
			};
			reader.onerror = function () {
				var disp = document.getElementById('selfFileDisp_' + fname);
				if (disp) disp.innerHTML = '<span class="dash-badge b-red">Gagal membaca file.</span>';
			};
			reader.readAsDataURL(file);
		});
	}

	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('.dash-card').forEach(function (card) {
			card.addEventListener('click', function () { openSheet(card.getAttribute('data-sheet')); });
		});

		$('#dashMenuBtn').addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); });
		document.addEventListener('click', function () { var p = $('#dashMenuPop'); if (p) p.hidden = true; });
		$('#dashMenuPop').addEventListener('click', function (e) { e.stopPropagation(); });

		$('#sheetClose').addEventListener('click', closeSheet);
		$('#dashBackdrop').addEventListener('click', closeSheet);
		$('#dashRetry').addEventListener('click', loadData);
		$('#sheetRefresh').addEventListener('click', refreshCurrentSheet);
		window.addEventListener('hashchange', openSheetByHash);

		sheetDelegation();

		// Tampil instan bila data sudah tersimpan di sesi ini (Card Box
		// langsung pakai cache), lalu segarkan data dasar di latar belakang.
		var inline = !!(window.DASH_DATA && window.DASH_DATA.found);
		var saved = inline ? null : loadPersisted();
		if (inline) {
			DATA = window.DASH_DATA;
			try {
				hydrateCache();
				renderHeader();
				renderInfo();
				showContent();
				persistState();
			} catch (e) {
				console.error('Inline render:', e);
				showError();
			}
			openSheetByHash();
			return;
		}
		if (saved) {
			DATA = saved.data;
			try {
				hydrateCache();
				renderHeader();
				renderInfo();
				showContent();
			} catch (e) {
				console.error('Saved render:', e);
				showError();
				return;
			}
			openSheetByHash();
			refreshBase().then(function (ok) {
				if (!ok) return;
				persistState();
				if (CUR_SHEET && BASE_SHEETS[CUR_SHEET]) reloadSheet();
			});
			return;
		}
		loadData().then(function () { openSheetByHash(); });
	});
})();
