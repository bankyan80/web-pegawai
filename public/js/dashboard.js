/* Dashboard Pegawai Personal — mobile single page.
   Muat data dari /api/dashboard, tampilkan skeleton, lalu render
   Card Box & Bottom Sheet. Seluruh data sudah dibatasi di backend
   per pegawai yang login. */
(function () {
	'use strict';

	var DATA = null;
	var PRES_FILTER = { tahun: '', bulan: '' };
	var ARSIP_FILTER = { q: '', kat: '' };

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
		return '<div class="dash-empty-sm"><i class="fas fa-exclamation-triangle"></i><div>Data gagal dimuat.<br>Silakan coba lagi.</div><button class="dash-btn" onclick="window.location.reload()"><i class="fas fa-sync-alt"></i> Coba Lagi</button></div>';
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
		return secTitle('Identitas') + identitas + secTitle('Kepegawaian') + kepeg + secTitle('Pendidikan') + pend;
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
		var p = DATA.pangkat;
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
		if (!DATA.kgb.length) {
			return '<div class="dash-sec">' + emptyBox('Data KGB belum tersedia.') + '</div>';
		}
		return DATA.kgb.map(function (r, i) {
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
		if (!DATA.mutasi.length) {
			return '<div class="dash-sec">' + emptyBox('Belum ada data mutasi.') + '</div>';
		}
		return DATA.mutasi.map(function (m) {
			return '<div class="dash-timeline"><div class="dash-tl-item"><div class="tl-title">' + esc(m.jenis || 'Mutasi') + '</div>' +
				'<div class="tl-sub">' + esc(m.asal) + ' → ' + esc(m.tujuan) + '</div>' +
				'<div class="tl-sub">Unit: ' + esc(m.keterangan || '-') + '</div>' +
				'<div class="tl-sub">SK: ' + esc(m.nomorSk || '-') + '</div>' +
				'<div class="tl-date">' + esc(fmtTanggal(m.tanggal)) + ' &nbsp; ' + badge(m.status, STATUS_BADGE) + '</div>' +
				(m.dokumen ? '<div class="tl-date"><a href="' + esc(m.dokumen) + '" target="_blank" rel="noopener"><i class="fas fa-paperclip"></i> Dokumen</a></div>' : '') +
				'</div></div>';
		}).join('');
	}

	function sheetJabatan() {
		var j = DATA.jabatan;
		var utama = j.filter(function (x) { return /utama/i.test(x.jenis); });
		var tambahan = j.filter(function (x) { return !/utama/i.test(x.jenis); });
		if (!j.length) {
			return '<div class="dash-sec">' + emptyBox('Belum ada data jabatan & penugasan.') + '</div>';
		}
		var out = '';
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
			kv('Status', badge(r.status, STATUS_BADGE)) + kv('Keterangan', esc(r.keterangan)) + '</div>';
	}

	function sheetSertifikasi() {
		if (!DATA.sertifikasi.length) {
			return '<div class="dash-sec">' + emptyBox('Belum ada data sertifikasi & tunjangan.') + '</div>';
		}
		return DATA.sertifikasi.map(function (s) {
			return '<div class="dash-sec">' +
				kv('Nama Sertifikasi', esc(s.nama)) + kv('Bidang Studi', esc(s.bidang)) +
				kv('Nomor Sertifikat', esc(s.nomor)) + kv('Tahun Sertifikasi', esc(s.tahun)) +
				kv('Status', badge(s.status, STATUS_BADGE)) + kv('Tunjangan', esc(s.tunjangan)) +
				kv('Status Bayar', badge(s.statusBayar, { 'Dibayar': 'b-green', 'Belum Dibayar': 'b-amber' })) +
				kv('Keterangan', esc(s.keterangan)) + '</div>';
		}).join('');
	}

	function sheetCuti() {
		if (!DATA.cuti.length) {
			return '<div class="dash-sec">' + emptyBox('Belum ada data cuti.') + '</div>';
		}
		return DATA.cuti.map(function (c) {
			return '<div class="dash-sec">' +
				kv('Jenis Cuti', esc(c.jenis)) + kv('Tanggal Mulai', esc(fmtTanggal(c.mulai))) +
				kv('Tanggal Selesai', esc(fmtTanggal(c.selesai))) + kv('Lama Cuti', esc(c.lama)) +
				kv('Status', badge(c.status, STATUS_BADGE)) + '</div>';
		}).join('');
	}

	function sheetBup() {
		var b = DATA.bup;
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

	/* ----- Arsip Presensi ----- */

	function presensiTahunList() {
		var set = [];
		DATA.presensi.forEach(function (r) { if (r.tahun && set.indexOf(r.tahun) === -1) set.push(r.tahun); });
		return set.sort().reverse();
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

	function presensiFilterBar() {
		var thn = presensiTahunList();
		var thnOpts = '<option value="">Semua Tahun</option>' + thn.map(function (t) { return '<option value="' + esc(t) + '"' + (PRES_FILTER.tahun === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('');
		var blnOpts = '<option value="">Semua Bulan</option>' + BULAN.map(function (b, i) { return '<option value="' + esc(b) + '"' + (PRES_FILTER.bulan === b ? ' selected' : '') + '>' + esc(b) + '</option>'; }).join('');
		return '<div class="dash-filterbar"><select id="presFilterTahun">' + thnOpts + '</select><select id="presFilterBulan">' + blnOpts + '</select></div><div id="presList"></div>';
	}

	function presensiList() {
		var rows = DATA.presensi.filter(function (r) {
			if (PRES_FILTER.tahun && r.tahun !== PRES_FILTER.tahun) return false;
			if (PRES_FILTER.bulan && r.bulan !== PRES_FILTER.bulan) return false;
			return true;
		});
		if (!rows.length) return emptyBox('Belum ada arsip presensi.');
		return rows.map(function (r) {
			var meta = presensiFileMeta(r.file);
			return '<div class="dash-file">' +
				'<div class="file-icon"><i class="fas fa-file-pdf"></i></div>' +
				'<div class="file-info"><div class="file-name">' + esc(r.bulan + ' ' + r.tahun) + '</div>' +
				'<div class="file-meta">' + esc(meta.name) + ' &middot; Upload: ' + esc(meta.date || '-') + ' &middot; PDF</div>' +
				'<div class="file-meta">Status: ' + badge('Tersedia', { 'Tersedia': 'b-green' }) + '</div></div>' +
				'<div class="file-actions">' +
				(r.file ? '<button class="file-act primary" onclick="window.open(\'' + esc(r.file) + '\',\'_blank\')">Lihat</button><a class="file-act ghost" href="' + esc(r.file) + '" download style="display:inline-flex;align-items:center;text-decoration:none">Download</a>' : '') +
				'</div></div>';
		}).join('');
	}

	function sheetPresensi() {
		var body = $('#sheetBody');
		body.innerHTML = '<div class="dash-sec">' + presensiFilterBar() + '</div>';
		$('#presList').innerHTML = presensiList();
		$('#presFilterTahun').addEventListener('change', function (e) { PRES_FILTER.tahun = e.target.value; $('#presList').innerHTML = presensiList(); });
		$('#presFilterBulan').addEventListener('change', function (e) { PRES_FILTER.bulan = e.target.value; $('#presList').innerHTML = presensiList(); });
	}

	/* ----- Arsip Kepegawaian ----- */

	function arsipKategoriList() {
		var set = [];
		DATA.arsip.forEach(function (r) { if (r.kategori && set.indexOf(r.kategori) === -1) set.push(r.kategori); });
		return set.sort();
	}

	function arsipList() {
		var rows = DATA.arsip.filter(function (r) {
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
				'</div></div>';
		}).join('');
	}

	function sheetArsip() {
		var body = $('#sheetBody');
		var kats = arsipKategoriList();
		var katOpts = '<option value="">Semua Kategori</option>' + kats.map(function (k) { return '<option value="' + esc(k) + '">' + esc(k) + '</option>'; }).join('');
		body.innerHTML = '<div class="dash-sec"><div class="dash-filterbar"><div class="dash-search-wrap"><i class="fas fa-search"></i><input id="arsipSearch" type="text" placeholder="Cari dokumen..." /></div></div><div class="dash-filterbar"><select id="arsipKat">' + katOpts + '</select></div><div id="arsipList"></div></div>';
		$('#arsipList').innerHTML = arsipList();
		$('#arsipSearch').addEventListener('input', function (e) { ARSIP_FILTER.q = e.target.value; $('#arsipList').innerHTML = arsipList(); });
		$('#arsipKat').addEventListener('change', function (e) { ARSIP_FILTER.kat = e.target.value; $('#arsipList').innerHTML = arsipList(); });
	}

	function sheetSurat() {
		if (!DATA.surat.length) {
			return '<div class="dash-sec">' + emptyBox('Belum ada surat kepegawaian.') + '</div>';
		}
		return DATA.surat.map(function (s) {
			return '<div class="dash-sec">' +
				kv('Jenis', esc(s.jenis)) + kv('Nomor', esc(s.nomor)) +
				kv('Tanggal', esc(fmtTanggal(s.tanggal))) + kv('Perihal', esc(s.perihal)) +
				kv('Status', badge(s.status, STATUS_BADGE)) + '</div>';
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

	function openSheet(key) {
		var sheet = $('#dashSheet');
		$('#sheetTitle').textContent = SHEET_TITLES[key] || 'Detail';
		$('#sheetBody').innerHTML = '<div class="dash-empty-sm"><i class="fas fa-circle-notch fa-spin"></i><div>Memuat…</div></div>';
		$('#dashBackdrop').hidden = false;
		sheet.hidden = false;
		requestAnimationFrame(function () { requestAnimationFrame(function () { sheet.classList.add('open'); }); });
		if (RENDERERS[key]) {
			try {
				RENDERERS[key]();
			} catch (e) {
				console.error('Sheet render [' + key + ']:', e);
				$('#sheetBody').innerHTML = errBox();
			}
		}
	}

	function closeSheet() {
		var sheet = $('#dashSheet');
		sheet.classList.remove('open');
		$('#dashBackdrop').hidden = true;
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

	function showContent() {
		$('#dashSkeleton').hidden = true;
		$('#dashError').hidden = true;
		$('#dashContent').hidden = false;
	}

	function loadData() {
		showSkeleton();
		fetch('/api/dashboard', { headers: { 'Accept': 'application/json' } })
			.then(function (res) {
				if (!res.ok) throw new Error('HTTP ' + res.status);
				return res.json();
			})
			.then(function (json) {
				if (!json.ok || !json.data) throw new Error(json.error || 'Gagal memuat data');
				DATA = json.data;
				if (!DATA.found) {
					$('#dashContent').hidden = true;
					$('#dashSkeleton').hidden = true;
					$('#dashError').hidden = false;
					$('#dashError').querySelector('p').innerHTML = 'Akun ini tidak terhubung dengan data pegawai.<br>Silakan hubungi administrator.';
					$('#dashRetry').style.display = 'none';
					return;
				}
				renderHeader();
				renderInfo();
				showContent();
			})
			.catch(function (err) {
				console.error('Dashboard load:', err);
				showError();
			});
	}

	document.addEventListener('DOMContentLoaded', function () {
		// Delegasi klik kartu layanan
		document.querySelectorAll('.dash-card').forEach(function (card) {
			card.addEventListener('click', function () { openSheet(card.getAttribute('data-sheet')); });
		});

		$('#dashMenuBtn').addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); });
		document.addEventListener('click', function () { var p = $('#dashMenuPop'); if (p) p.hidden = true; });
		$('#dashMenuPop').addEventListener('click', function (e) { e.stopPropagation(); });

		$('#sheetClose').addEventListener('click', closeSheet);
		$('#dashBackdrop').addEventListener('click', closeSheet);
		$('#dashRetry').addEventListener('click', loadData);

		loadData();
	});
})();
