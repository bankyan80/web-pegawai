// Data dummy terpusat untuk modul kepegawaian.
// Seluruh halaman submenu membaca data dari file ini sehingga mudah
// diganti dengan database/API di tahap berikutnya.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function pad(n, l) { return String(n).padStart(l, '0'); }
function tang(fmt) {
  const y = 1985 + Math.floor(rand() * 35);
  const m = 1 + Math.floor(rand() * 12);
  const d = 1 + Math.floor(rand() * 28);
  if (fmt === 'id') return pad(d, 2) + '/' + pad(m, 2) + '/' + y;
  return y + '-' + pad(m, 2) + '-' + pad(d, 2);
}

const namaDepan = ['Andi', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hendra', 'Intan', 'Joko', 'Kartika', 'Lukman', 'Maya', 'Nanda', 'Oki', 'Putri', 'Rahmat', 'Sari', 'Taufik', 'Yuni', 'Agus', 'Bambang', 'Rina', 'Slamet', 'Wahyu', 'Dian', 'Ratna', 'Iwan', 'Nurul', 'Hasan'];
const namaBelakang = ['Pratama', 'Wijaya', 'Santoso', 'Kusuma', 'Hidayat', 'Ramadhan', 'Nugraha', 'Saputra', 'Lestari', 'Maulana', 'Anggraini', 'Setiawan', 'Utami', 'Purnama', 'Hartono', 'Dewanti', 'Susanto', 'Rahayu', 'Firmansyah', 'Wulandari'];

const unitKerja = ['Sekretariat Dinas', 'Bidang Mutasi', 'Bidang Pengembangan', 'Bidang Penilaian Kinerja', 'Bidang Kesejahteraan', 'Bidang Data & Sistem', 'Subbagian Umum', 'Subbagian Keuangan'];
const jabatanList = ['Kepala Dinas', 'Sekretaris Dinas', 'Kepala Bidang Mutasi', 'Kepala Bidang Pengembangan', 'Kepala Bidang Penilaian', 'Kepala Bidang Kesejahteraan', 'Kepala Bidang Data', 'Kasubbag Umum', 'Kasubbag Keuangan', 'Analis Kepegawaian', 'Pranata Komputer', 'Pengelola Kepegawaian', 'Pengadministrasi Umum', 'Staf Ahli', 'Fungsional Umum'];
const pangkatList = [
  'Juru', 'Pengatur Muda', 'Pengatur Muda Tk. I', 'Pengatur', 'Pengatur Tk. I',
  'Penata Muda', 'Penata Muda Tk. I', 'Penata', 'Penata Tk. I',
  'Pembina', 'Pembina Tk. I', 'Pembina Utama Muda', 'Pembina Utama Madya', 'Pembina Utama'
];
const golonganList = ['I/a', 'I/b', 'I/c', 'I/d', 'II/a', 'II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'];
const jenisPegawaiList = ['PNS', 'PPPK', 'PPPK Paruh Waktu', 'Honorer'];
const statusPegawaiList = ['Aktif', 'Aktif', 'Aktif', 'Aktif', 'Cuti', 'Pensiun'];
const statusRecord = ['Aktif', 'Nonaktif'];

function makeNip(i) {
  const y = 1980 + Math.floor(rand() * 15);
  const m = pad(1 + Math.floor(rand() * 12), 2);
  const d = pad(1 + Math.floor(rand() * 28), 2);
  const no = pad(1000 + i * 137, 6);
  return '19' + (y - 19) + m + d + '20' + pad(i % 8, 2) + '0' + no;
}

const pegawai = [];
for (let i = 0; i < 30; i++) {
  const nama = (i % 2 === 0 ? 'dr. ' : '') + pick(namaDepan) + ' ' + pick(namaBelakang) + (i % 3 === 0 ? ', S.Sos.' : '');
  const jenis = jenisPegawaiList[Math.floor(rand() * 3.4)];
  const pangkat = pick(pangkatList);
  const golongan = pick(golonganList.slice(8));
  pegawai.push({
    id: i + 1,
    nip: makeNip(i),
    nik: '33' + pad(1000000000 + i * 123456, 14),
    nama,
    ttl: pick(['Bandung', 'Jakarta', 'Surabaya', 'Yogyakarta', 'Semarang', 'Medan', 'Banjarmasin', 'Makassar', 'Denpasar', 'Palembang']) + ', ' + tang('id'),
    jk: i % 2 === 0 ? 'Laki-laki' : 'Perempuan',
    alamat: 'Jl. ' + pick(['Merdeka', 'Sudirman', 'Ahmad Yani', 'Diponegoro', 'Gatot Subroto', 'Pahlawan']) + ' No. ' + (i + 3) + ', ' + pick(['Bandung', 'Jakarta', 'Bogor', 'Depok', 'Bekasi', 'Tangerang']),
    hp: '0812' + pad(1000000 + i * 76543, 8),
    email: 'pegawai' + (i + 1) + '@mail.test',
    jenis,
    pangkat,
    golongan,
    jabatan: jabatanList[i % jabatanList.length],
    unit: unitKerja[i % unitKerja.length],
    tmt: tang(),
    status: statusPegawaiList[Math.floor(rand() * statusPegawaiList.length)],
    pendidikan: pick(['SMA', 'D3', 'S1', 'S2', 'S3']),
    jurusan: pick(['Ilmu Administrasi', 'Manajemen', 'Hukum', 'Teknik Informatika', 'Akuntansi', 'Kebijakan Publik']),
    sekolah: pick(['Universitas Padjajaran', 'Universitas Indonesia', 'IPDN', 'Universitas Gadjah Mada', 'Universitas Diponegoro', 'STIA LAN'])
  });
}

const users = [
  { username: 'superadmin', nama: 'Administrator Sistem', email: 'superadmin@mail.test', role: 'Super Admin', unit: 'Sekretariat Dinas', status: 'Aktif', login: '2026-08-07 08:12:31' },
  { username: 'admin1', nama: 'Dewi Anggraini, S.Sos', email: 'admin1@mail.test', role: 'Admin Kepegawaian', unit: 'Bidang Data & Sistem', status: 'Aktif', login: '2026-08-08 07:45:10' },
  { username: 'op1', nama: 'Rina Saputra', email: 'op1@mail.test', role: 'Operator', unit: 'Bidang Mutasi', status: 'Aktif', login: '2026-08-07 16:20:44' },
  { username: 'op2', nama: 'Slamet Purnama', email: 'op2@mail.test', role: 'Operator', unit: 'Subbagian Umum', status: 'Nonaktif', login: '2026-07-30 10:05:12' },
  { username: 'peg01', nama: 'Andi Pratama, S.Sos', email: 'peg01@mail.test', role: 'Pegawai', unit: 'Bidang Mutasi', status: 'Aktif', login: '2026-08-06 13:33:55' },
  { username: 'peg02', nama: 'Citra Lestari', email: 'peg02@mail.test', role: 'Pegawai', unit: 'Bidang Pengembangan', status: 'Aktif', login: '2026-08-05 09:01:02' },
  { username: 'audit', nama: 'Budi Santoso', email: 'audit@mail.test', role: 'Admin Kepegawaian', unit: 'Bidang Penilaian Kinerja', status: 'Aktif', login: '2026-08-08 06:58:19' }
];

const presensi = [
  { tanggal: '2026-08-07', nip: '199004152010011002', nama: 'Citra Lestari, S.Kom', masuk: '07:58', pulang: '16:02', status: 'Hadir', ket: '-' },
  { tanggal: '2026-08-07', nip: '198703222012021003', nama: 'Hendra Wijaya', masuk: '08:12', pulang: '16:30', status: 'Hadir', ket: '-' },
  { tanggal: '2026-08-07', nip: '1992081032014011004', nama: 'Kartika Hidayat, S.Sos', masuk: '07:45', pulang: '15:55', status: 'Hadir', ket: '-' },
  { tanggal: '2026-08-07', nip: '198510052009011005', nama: 'Lukman Maulana', masuk: '-', pulang: '-', status: 'Izin', ket: 'Izin keluarga' },
  { tanggal: '2026-08-07', nip: '199112132017041006', nama: 'Maya Ramadhan', masuk: '07:50', pulang: '16:10', status: 'Hadir', ket: '-' },
  { tanggal: '2026-08-08', nip: '199004152010011002', nama: 'Citra Lestari, S.Kom', masuk: '08:20', pulang: '16:40', status: 'Hadir', ket: 'Terlambat 20 menit' },
  { tanggal: '2026-08-08', nip: '198703222012021003', nama: 'Hendra Wijaya', masuk: '07:59', pulang: '16:05', status: 'Hadir', ket: '-' },
  { tanggal: '2026-08-08', nip: '198605302011021008', nama: 'Oki Nugraha', masuk: '-', pulang: '-', status: 'Cuti', ket: 'Cuti tahunan' },
  { tanggal: '2026-08-08', nip: '1992081032014011004', nama: 'Kartika Hidayat, S.Sos', masuk: '08:01', pulang: '16:22', status: 'Hadir', ket: '-' },
  { tanggal: '2026-08-08', nip: '198201122011011009', nama: 'Putri Kusuma', masuk: '10:30', pulang: '-', status: 'Dinas Luar', ket: 'Rapat koordinasi' },
  { tanggal: '2026-08-08', nip: '198910252015021010', nama: 'Rahmat Maulana', masuk: '-', pulang: '-', status: 'Sakit', ket: 'Surat dokter terlampir' },
  { tanggal: '2026-08-08', nip: '198312192011011011', nama: 'Sari Hartono', masuk: '-', pulang: '-', status: 'Alpa', ket: 'Tanpa keterangan' }
];

const referensi = {
  jabatan: [
    { kode: 'JBT-01', nama: 'Kepala Dinas', status: 'Aktif' },
    { kode: 'JBT-02', nama: 'Sekretaris Dinas', status: 'Aktif' },
    { kode: 'JBT-03', nama: 'Kepala Bidang Mutasi', status: 'Aktif' },
    { kode: 'JBT-04', nama: 'Kepala Bidang Pengembangan', status: 'Aktif' },
    { kode: 'JBT-05', nama: 'Analis Kepegawaian', status: 'Aktif' },
    { kode: 'JBT-06', nama: 'Pranata Komputer', status: 'Aktif' },
    { kode: 'JBT-07', nama: 'Pengadministrasi Umum', status: 'Nonaktif' }
  ],
  golongan: pangkatList.slice(0, 12).map((p, i) => ({ kode: golonganList[8 + i], nama: p, status: 'Aktif' })),
  unit: unitKerja.map((u, i) => ({ kode: 'UNT-' + pad(i + 1, 2), nama: u, status: 'Aktif' })),
  jenisPegawai: jenisPegawaiList.map((j, i) => ({ kode: 'JP-' + pad(i + 1, 2), nama: j, status: 'Aktif' })),
  statusPegawai: statusRecord.map((s, i) => ({ kode: 'SP-' + pad(i + 1, 2), nama: s, status: 'Aktif' })),
  pendidikan: ['SMA', 'D3', 'S1', 'S2', 'S3', 'SLB'].map((p, i) => ({ kode: 'PDD-' + pad(i + 1, 2), nama: p, status: 'Aktif' })),
  jenisDiklat: ['Diklat Struktural', 'Diklat Teknis', 'Diklat Fungsional', 'Diklat Prajabatan'].map((d, i) => ({ kode: 'DIK-' + pad(i + 1, 2), nama: d, status: 'Aktif' })),
  jenisCuti: ['Cuti Tahunan', 'Cuti Sakit', 'Cuti Melahirkan', 'Cuti Alasan Penting', 'Cuti Besar', 'Cuti di Luar Tanggungan Negara'].map((c, i) => ({ kode: 'CT-' + pad(i + 1, 2), nama: c, status: 'Aktif' })),
  jenisDokumen: ['KTP', 'KK', 'Ijazah', 'SK CPNS', 'SK PNS', 'SK Pangkat', 'SK Jabatan', 'Sertifikat Diklat'].map((d, i) => ({ kode: 'DOC-' + pad(i + 1, 2), nama: d, status: 'Aktif' }))
};

const surat = [
  { nomor: '800/112/BKPP', tanggal: '2026-08-05', perihal: 'Permohonan Cuti Tahunan', pengirim: 'Kartika Hidayat, S.Sos', status: 'Belum Dibaca' },
  { nomor: '821/045/BKPP', tanggal: '2026-08-05', perihal: 'Usulan Kenaikan Pangkat', pengirim: 'Bidang Mutasi', status: 'Diproses' },
  { nomor: '802/231/BKPP', tanggal: '2026-08-04', perihal: 'Dispensasi Dinas Luar', pengirim: 'Putri Kusuma', status: 'Selesai' },
  { nomor: '824/017/BKPP', tanggal: '2026-08-04', perihal: 'Permohonan Data Kepegawaian', pengirim: 'Dinas Pendidikan', status: 'Diproses' },
  { nomor: '811/098/BKPP', tanggal: '2026-08-03', perihal: 'Pengajuan SLKS 30 Tahun', pengirim: 'Hendra Wijaya', status: 'Belum Dibaca' },
  { nomor: '805/150/BKPP', tanggal: '2026-08-02', perihal: 'Usulan Pensiun', pengirim: 'Bidang Mutasi', status: 'Selesai' },
  { nomor: '830/073/BKPP', tanggal: '2026-08-01', perihal: 'Klarifikasi Dokumen PNS', pengirim: 'BKN', status: 'Selesai' },
  { nomor: '826/211/BKPP', tanggal: '2026-07-31', perihal: 'Pengajuan Izin Belajar', pengirim: 'Maya Ramadhan', status: 'Diproses' },
  { nomor: '812/064/BKPP', tanggal: '2026-07-30', perihal: 'Surat Tugas Penempatan', pengirim: 'Kepala Dinas', status: 'Arsip' },
  { nomor: '800/301/BKPP', tanggal: '2026-07-29', perihal: 'Permohonan Pindah Tugas', pengirim: 'Oki Nugraha', status: 'Selesai' }
];

const kartuPegawai = pegawai.slice(0, 10).map((p) => ({
  ...p,
  qr: 'KRP-' + p.nip.slice(-6)
}));

const kepangkatan = [
  { nip: '198505102010011002', nama: 'Citra Lestari, S.Kom', lama: 'Penata Muda', baru: 'Penata Muda Tk. I', tmt: '2026-09-01', status: 'Selesai' },
  { nip: '198703222012021003', nama: 'Hendra Wijaya', lama: 'Penata', baru: 'Penata Tk. I', tmt: '2026-10-01', status: 'Dalam Proses' },
  { nip: '199004152010011002', nama: 'Andi Pratama, S.Sos', lama: 'Penata Muda Tk. I', baru: 'Penata', tmt: '2027-01-01', status: 'Dalam Proses' },
  { nip: '198605302011021008', nama: 'Oki Nugraha', lama: 'Pengatur', baru: 'Pengatur Tk. I', tmt: '2026-08-15', status: 'Selesai' },
  { nip: '1992081032014011004', nama: 'Kartika Hidayat, S.Sos', lama: 'Penata Muda', baru: 'Penata Muda Tk. I', tmt: '2026-12-01', status: 'Usulan' },
  { nip: '198201122011011009', nama: 'Putri Kusuma', lama: 'Pembina', baru: 'Pembina Tk. I', tmt: '2026-07-01', status: 'Selesai' },
  { nip: '198910252015021010', nama: 'Rahmat Maulana', lama: 'Penata Muda', baru: 'Penata Muda Tk. I', tmt: '2027-03-01', status: 'Usulan' },
  { nip: '198312192011011011', nama: 'Sari Hartono', lama: 'Penata Tk. I', baru: 'Pembina', tmt: '2026-11-01', status: 'Dalam Proses' },
  { nip: '198607082015021012', nama: 'Taufik Firmansyah', lama: 'Pengatur Muda', baru: 'Pengatur', tmt: '2026-09-15', status: 'Selesai' },
  { nip: '199012062016011013', nama: 'Yuni Wulandari', lama: 'Penata Muda Tk. I', baru: 'Penata', tmt: '2027-02-01', status: 'Usulan' }
];

const gajiBerkala = [
  { nip: '198505102010011002', nama: 'Citra Lestari, S.Kom', pangkat: 'Penata Muda', gaji: '3.750.000', tmtLama: '2021-09-01', tmtBerikut: '2026-09-01', status: 'Bulan Ini' },
  { nip: '198703222012021003', nama: 'Hendra Wijaya', pangkat: 'Penata', gaji: '4.450.000', tmtLama: '2021-10-01', tmtBerikut: '2026-10-01', status: 'Akan Naik' },
  { nip: '199004152010011002', nama: 'Andi Pratama, S.Sos', pangkat: 'Penata Muda Tk. I', gaji: '3.950.000', tmtLama: '2022-01-01', tmtBerikut: '2027-01-01', status: 'Akan Naik' },
  { nip: '198605302011021008', nama: 'Oki Nugraha', pangkat: 'Pengatur', gaji: '3.150.000', tmtLama: '2021-08-15', tmtBerikut: '2026-08-15', status: 'Sudah Diproses' },
  { nip: '1992081032014011004', nama: 'Kartika Hidayat, S.Sos', pangkat: 'Penata Muda', gaji: '3.750.000', tmtLama: '2021-12-01', tmtBerikut: '2026-12-01', status: 'Akan Naik' },
  { nip: '198201122011011009', nama: 'Putri Kusuma', pangkat: 'Pembina', gaji: '5.250.000', tmtLama: '2021-07-01', tmtBerikut: '2026-07-01', status: 'Terlambat' },
  { nip: '198910252015021010', nama: 'Rahmat Maulana', pangkat: 'Penata Muda', gaji: '3.750.000', tmtLama: '2022-03-01', tmtBerikut: '2027-03-01', status: 'Akan Naik' },
  { nip: '198312192011011011', nama: 'Sari Hartono', pangkat: 'Penata Tk. I', gaji: '4.850.000', tmtLama: '2021-11-01', tmtBerikut: '2026-11-01', status: 'Akan Naik' },
  { nip: '198607082015021012', nama: 'Taufik Firmansyah', pangkat: 'Pengatur', gaji: '3.150.000', tmtLama: '2021-09-15', tmtBerikut: '2026-09-15', status: 'Bulan Ini' },
  { nip: '199012062016011013', nama: 'Yuni Wulandari', pangkat: 'Penata Muda Tk. I', gaji: '3.950.000', tmtLama: '2022-02-01', tmtBerikut: '2027-02-01', status: 'Akan Naik' }
];

const jenisCutiAll = ['Cuti Tahunan', 'Cuti Sakit', 'Cuti Melahirkan', 'Cuti Alasan Penting', 'Cuti Besar', 'Cuti di Luar Tanggungan Negara'];
const cuti = [
  { pemohon: 'Kartika Hidayat, S.Sos', jenis: 'Cuti Tahunan', mulai: '2026-08-10', selesai: '2026-08-14', lama: '5 hari', status: 'Diajukan' },
  { pemohon: 'Oki Nugraha', jenis: 'Cuti Tahunan', mulai: '2026-08-08', selesai: '2026-08-12', lama: '5 hari', status: 'Disetujui' },
  { pemohon: 'Rahmat Maulana', jenis: 'Cuti Sakit', mulai: '2026-08-08', selesai: '2026-08-10', lama: '3 hari', status: 'Disetujui' },
  { pemohon: 'Maya Ramadhan', jenis: 'Cuti Melahirkan', mulai: '2026-07-20', selesai: '2026-10-20', lama: '90 hari', status: 'Disetujui' },
  { pemohon: 'Putri Kusuma', jenis: 'Cuti Alasan Penting', mulai: '2026-08-01', selesai: '2026-08-03', lama: '3 hari', status: 'Selesai' },
  { pemohon: 'Yuni Wulandari', jenis: 'Cuti Besar', mulai: '2026-09-01', selesai: '2026-11-30', lama: '90 hari', status: 'Diajukan' },
  { pemohon: 'Taufik Firmansyah', jenis: 'Cuti Tahunan', mulai: '2026-08-15', selesai: '2026-08-19', lama: '5 hari', status: 'Ditolak' },
  { pemohon: 'Sari Hartono', jenis: 'Cuti di Luar Tanggungan Negara', mulai: '2026-08-01', selesai: '2027-07-31', lama: '1 tahun', status: 'Diajukan' },
  { pemohon: 'Hendra Wijaya', jenis: 'Cuti Sakit', mulai: '2026-07-28', selesai: '2026-07-30', lama: '3 hari', status: 'Selesai' },
  { pemohon: 'Citra Lestari, S.Kom', jenis: 'Cuti Tahunan', mulai: '2026-08-20', selesai: '2026-08-24', lama: '5 hari', status: 'Disetujui' }
];

const izinCerai = [
  { pegawai: 'Rahmat Maulana', nip: '198910252015021010', tanggal: '2026-08-03', status: 'Pengajuan', tahapan: 'Pengajuan' },
  { pegawai: 'Putri Kusuma', nip: '198201122011011009', tanggal: '2026-07-25', status: 'Verifikasi', tahapan: 'Verifikasi' },
  { pegawai: 'Taufik Firmansyah', nip: '198607082015021012', tanggal: '2026-07-10', status: 'Pemeriksaan', tahapan: 'Pemeriksaan' },
  { pegawai: 'Oki Nugraha', nip: '198605302011021008', tanggal: '2026-06-18', status: 'Persetujuan', tahapan: 'Persetujuan' },
  { pegawai: 'Hendra Wijaya', nip: '198703222012021003', tanggal: '2026-05-02', status: 'Selesai', tahapan: 'Selesai' }
];

const slks = [
  { nip: '198201122011011009', nama: 'Putri Kusuma', masaKerja: '30 tahun', kategori: '30 Tahun', tahun: 2026, status: 'Diajukan' },
  { nip: '198505102010011002', nama: 'Citra Lestari, S.Kom', masaKerja: '20 tahun', kategori: '20 Tahun', tahun: 2026, status: 'Diverifikasi' },
  { nip: '198312192011011011', nama: 'Sari Hartono', masaKerja: '20 tahun', kategori: '20 Tahun', tahun: 2026, status: 'Diajukan' },
  { nip: '198703222012021003', nama: 'Hendra Wijaya', masaKerja: '10 tahun', kategori: '10 Tahun', tahun: 2025, status: 'Diterima' },
  { nip: '199004152010011002', nama: 'Andi Pratama, S.Sos', masaKerja: '10 tahun', kategori: '10 Tahun', tahun: 2025, status: 'Diterima' },
  { nip: '198605302011021008', nama: 'Oki Nugraha', masaKerja: '10 tahun', kategori: '10 Tahun', tahun: 2026, status: 'Diajukan' },
  { nip: '198910252015021010', nama: 'Rahmat Maulana', masaKerja: '10 tahun', kategori: '10 Tahun', tahun: 2026, status: 'Diverifikasi' }
];

const pengadaan = [
  { formasi: 'Formasi 2025', jabatan: 'Analis Kepegawaian', unit: 'Bidang Data & Sistem', jumlah: 5, terisi: 3, sisa: 2, status: 'Penempatan' },
  { formasi: 'Formasi 2025', jabatan: 'Pranata Komputer', unit: 'Bidang Data & Sistem', jumlah: 3, terisi: 2, sisa: 1, status: 'Diterima' },
  { formasi: 'Formasi 2025', jabatan: 'Pengelola Kepegawaian', unit: 'Bidang Mutasi', jumlah: 4, terisi: 1, sisa: 3, status: 'Seleksi' },
  { formasi: 'Formasi 2026', jabatan: 'Fungsional Umum', unit: 'Subbagian Umum', jumlah: 8, terisi: 0, sisa: 8, status: 'Usulan' },
  { formasi: 'Formasi 2026', jabatan: 'Analis Kinerja', unit: 'Bidang Penilaian Kinerja', jumlah: 2, terisi: 0, sisa: 2, status: 'Usulan' },
  { formasi: 'Formasi 2024', jabatan: 'Pengadministrasi Umum', unit: 'Subbagian Umum', jumlah: 3, terisi: 3, sisa: 0, status: 'Diterima' }
];

const pensiun = [
  { nip: '196012052011011009', nama: 'Putri Kusuma', jabatan: 'Kepala Bidang', tglLahir: '1960-12-05', bup: '60 Tahun', perkiraan: '2026-12-05', status: 'Bulan Ini' },
  { nip: '196203142011011011', nama: 'Sari Hartono', jabatan: 'Kasubbag Umum', tglLahir: '1962-03-14', bup: '60 Tahun', perkiraan: '2027-03-14', status: '1 Tahun Lagi' },
  { nip: '196605102010011002', nama: 'Citra Lestari, S.Kom', jabatan: 'Analis Kepegawaian', tglLahir: '1966-05-10', bup: '60 Tahun', perkiraan: '2027-05-10', status: '1 Tahun Lagi' },
  { nip: '196403222012021003', nama: 'Hendra Wijaya', jabatan: 'Pranata Komputer', tglLahir: '1964-03-22', bup: '60 Tahun', perkiraan: '2028-03-22', status: '2 Tahun Lagi' },
  { nip: '196505152012021008', nama: 'Oki Nugraha', jabatan: 'Pengelola Kepegawaian', tglLahir: '1965-05-15', bup: '60 Tahun', perkiraan: '2028-05-15', status: '2 Tahun Lagi' },
  { nip: '195912202011011010', nama: 'Rahmat Maulana', jabatan: 'Kepala Bidang', tglLahir: '1959-12-20', bup: '60 Tahun', perkiraan: '2026-12-20', status: 'Sudah Diproses' },
  { nip: '196108082012021012', nama: 'Taufik Firmansyah', jabatan: 'Kasubbag Keuangan', tglLahir: '1961-08-08', bup: '60 Tahun', perkiraan: '2027-08-08', status: '1 Tahun Lagi' },
  { nip: '196706062016011013', nama: 'Yuni Wulandari', jabatan: 'Fungsional Umum', tglLahir: '1967-06-06', bup: '60 Tahun', perkiraan: '2029-06-06', status: '2 Tahun Lagi' }
];

const pindahTugas = [
  { pegawai: 'Oki Nugraha', asal: 'Subbagian Umum', tujuan: 'Bidang Mutasi', tanggal: '2026-08-01', status: 'Persetujuan' },
  { pegawai: 'Sari Hartono', asal: 'Bidang Pengembangan', tujuan: 'Subbagian Umum', tanggal: '2026-07-20', status: 'SK' },
  { pegawai: 'Maya Ramadhan', asal: 'Bidang Mutasi', tujuan: 'Bidang Kesejahteraan', tanggal: '2026-07-05', status: 'Verifikasi' },
  { pegawai: 'Taufik Firmansyah', asal: 'Bidang Data & Sistem', tujuan: 'Bidang Penilaian Kinerja', tanggal: '2026-06-15', status: 'Selesai' },
  { pegawai: 'Yuni Wulandari', asal: 'Bidang Kesejahteraan', tujuan: 'Bidang Pengembangan', tanggal: '2026-05-30', status: 'Selesai' }
];

const penempatan = [
  { pegawai: 'Andi Pratama, S.Sos', jabatan: 'Kepala Bidang Mutasi', unit: 'Bidang Mutasi', tugas: 'Pengelolaan mutasi PNS', tmt: '2024-01-02', status: 'Aktif' },
  { pegawai: 'Citra Lestari, S.Kom', jabatan: 'Analis Kepegawaian', unit: 'Bidang Data & Sistem', tugas: 'Analisis data kepegawaian', tmt: '2023-06-01', status: 'Aktif' },
  { pegawai: 'Hendra Wijaya', jabatan: 'Pranata Komputer', unit: 'Bidang Data & Sistem', tugas: 'Pengelolaan SIMPEG', tmt: '2022-09-15', status: 'Aktif' },
  { pegawai: 'Kartika Hidayat, S.Sos', jabatan: 'Pengelola Kepegawaian', unit: 'Bidang Mutasi', tugas: 'Usulan kenaikan pangkat', tmt: '2025-02-10', status: 'Aktif' },
  { pegawai: 'Lukman Maulana', jabatan: 'Kasubbag Umum', unit: 'Subbagian Umum', tugas: 'Administrasi umum', tmt: '2021-08-01', status: 'Cuti' },
  { pegawai: 'Maya Ramadhan', jabatan: 'Pengadministrasi Umum', unit: 'Bidang Kesejahteraan', tugas: 'Pelayanan kesejahteraan', tmt: '2024-05-20', status: 'Aktif' }
];

const disiplin = [
  { pegawai: 'Rahmat Maulana', pelanggaran: 'Terlambat berulang', tanggal: '2026-08-05', tingkat: 'Ringan', status: 'Pemeriksaan' },
  { pegawai: 'Sari Hartono', pelanggaran: 'Meninggalkan tugas', tanggal: '2026-07-28', tingkat: 'Sedang', status: 'Pembinaan' },
  { pegawai: 'Oki Nugraha', pelanggaran: 'Tidak mengikuti apel', tanggal: '2026-07-15', tingkat: 'Ringan', status: 'Peringatan' },
  { pegawai: 'Taufik Firmansyah', pelanggaran: 'Penyalahgunaan wewenang', tanggal: '2026-06-10', tingkat: 'Berat', status: 'Keputusan' },
  { pegawai: 'Yuni Wulandari', pelanggaran: 'Pelanggaran kode etik', tanggal: '2026-05-22', tingkat: 'Sedang', status: 'Selesai' },
  { pegawai: 'Putri Kusuma', pelanggaran: 'Terlambat berulang', tanggal: '2026-04-18', tingkat: 'Ringan', status: 'Selesai' }
];

const diklatStruktural = [
  { pegawai: 'Putri Kusuma', diklat: 'Diklatpim Tk. III', penyelenggara: 'BPSDM', tahun: 2023, durasi: '3 bulan', status: 'Selesai', sertifikat: 'Ada' },
  { pegawai: 'Andi Pratama, S.Sos', diklat: 'Diklatpim Tk. IV', penyelenggara: 'BPSDM', tahun: 2021, durasi: '2 bulan', status: 'Selesai', sertifikat: 'Ada' },
  { pegawai: 'Citra Lestari, S.Kom', diklat: 'Diklatpim Tk. IV', penyelenggara: 'BPSDM', tahun: 2022, durasi: '2 bulan', status: 'Selesai', sertifikat: 'Ada' },
  { pegawai: 'Hendra Wijaya', diklat: 'Diklatpim Tk. III', penyelenggara: 'BPSDM', tahun: 2024, durasi: '3 bulan', status: 'Berjalan', sertifikat: 'Belum' },
  { pegawai: 'Oki Nugraha', diklat: 'Diklatpim Tk. IV', penyelenggara: 'Pemda', tahun: 2020, durasi: '2 bulan', status: 'Selesai', sertifikat: 'Ada' },
  { pegawai: 'Sari Hartono', diklat: 'Diklatpim Tk. III', penyelenggara: 'BPSDM', tahun: 2019, durasi: '3 bulan', status: 'Selesai', sertifikat: 'Ada' }
];

const diklatTeknis = [
  { pegawai: 'Citra Lestari, S.Kom', diklat: 'Analisis Jabatan', kategori: 'Teknis Administrasi', penyelenggara: 'BPSDM', tahun: 2024, durasi: '5 hari', status: 'Selesai', sertifikat: 'Ada' },
  { pegawai: 'Hendra Wijaya', diklat: 'Teknis Pengelolaan SIMPEG', kategori: 'Teknis IT', penyelenggara: 'BKN', tahun: 2025, durasi: '7 hari', status: 'Selesai', sertifikat: 'Ada' },
  { pegawai: 'Kartika Hidayat, S.Sos', diklat: 'Manajemen Kepegawaian', kategori: 'Teknis Kepegawaian', penyelenggara: 'BKN', tahun: 2023, durasi: '5 hari', status: 'Selesai', sertifikat: 'Ada' },
  { pegawai: 'Lukman Maulana', diklat: 'Sistem Informasi Manajemen', kategori: 'Teknis IT', penyelenggara: 'Pemda', tahun: 2024, durasi: '3 hari', status: 'Berjalan', sertifikat: 'Belum' },
  { pegawai: 'Maya Ramadhan', diklat: 'Pelayanan Prima', kategori: 'Teknis Administrasi', penyelenggara: 'BPSDM', tahun: 2022, durasi: '3 hari', status: 'Selesai', sertifikat: 'Ada' },
  { pegawai: 'Rahmat Maulana', diklat: 'Perencanaan Kinerja', kategori: 'Teknis Manajemen', penyelenggara: 'Pemda', tahun: 2025, durasi: '4 hari', status: 'Selesai', sertifikat: 'Ada' },
  { pegawai: 'Sari Hartono', diklat: 'Keuangan Daerah', kategori: 'Teknis Administrasi', penyelenggara: 'BPKP', tahun: 2023, durasi: '5 hari', status: 'Selesai', sertifikat: 'Ada' },
  { pegawai: 'Yuni Wulandari', diklat: 'Public Speaking', kategori: 'Lainnya', penyelenggara: 'BPSDM', tahun: 2024, durasi: '2 hari', status: 'Selesai', sertifikat: 'Ada' }
];

const izinBelajar = [
  { pegawai: 'Maya Ramadhan', pendidikan: 'S2', prodi: 'Ilmu Administrasi', pt: 'Universitas Indonesia', tahun: 2026, status: 'Persetujuan' },
  { pegawai: 'Rahmat Maulana', pendidikan: 'S2', prodi: 'Kebijakan Publik', pt: 'Universitas Gadjah Mada', tahun: 2025, status: 'Izin Terbit' },
  { pegawai: 'Yuni Wulandari', pendidikan: 'S1', prodi: 'Hukum', pt: 'Universitas Padjajaran', tahun: 2026, status: 'Verifikasi' },
  { pegawai: 'Taufik Firmansyah', pendidikan: 'S1', prodi: 'Manajemen', pt: 'STIA LAN', tahun: 2024, status: 'Selesai' },
  { pegawai: 'Putri Kusuma', pendidikan: 'S2', prodi: 'Administrasi Negara', pt: 'IPDN', tahun: 2023, status: 'Selesai' },
  { pegawai: 'Hendra Wijaya', pendidikan: 'S1', prodi: 'Teknik Informatika', pt: 'Universitas Diponegoro', tahun: 2026, status: 'Pengajuan' }
];

const tugasBelajar = [
  { pegawai: 'Kartika Hidayat, S.Sos', jenjang: 'S2', prodi: 'Ilmu Administrasi', pt: 'Universitas Indonesia', biaya: 'APBN', status: 'Sedang Belajar' },
  { pegawai: 'Lukman Maulana', jenjang: 'S2', prodi: 'Manajemen Pendidikan', pt: 'Universitas Gadjah Mada', biaya: 'Mandiri', status: 'Disetujui' },
  { pegawai: 'Maya Ramadhan', jenjang: 'S1', prodi: 'Hukum', pt: 'Universitas Padjajaran', biaya: 'APBD', status: 'Verifikasi' },
  { pegawai: 'Sari Hartono', jenjang: 'S2', prodi: 'Keuangan Daerah', pt: 'Universitas Diponegoro', biaya: 'APBN', status: 'Sedang Belajar' },
  { pegawai: 'Rahmat Maulana', jenjang: 'S2', prodi: 'Kebijakan Publik', pt: 'UGM', biaya: 'Mandiri', status: 'Selesai' },
  { pegawai: 'Yuni Wulandari', jenjang: 'S3', prodi: 'Administrasi Publik', pt: 'Universitas Indonesia', biaya: 'APBN', status: 'Pengajuan' }
];

function detailPegawai(id) {
  const p = pegawai.find((x) => x.id === id) || pegawai[0];
  const r = mulberry32(100 + p.id);
  const pkPick = (arr) => arr[Math.floor(r() * arr.length)];
  const tgl = () => {
    const y = 2005 + Math.floor(r() * 18);
    const m = 1 + Math.floor(r() * 12);
    const d = 1 + Math.floor(r() * 28);
    return y + '-' + pad(m, 2) + '-' + pad(d, 2);
  };
  const tahun = () => 2005 + Math.floor(r() * 18);
  return {
    ...p,
    pendidikan: [
      { jenjang: p.pendidikan, jurusan: p.jurusan, sekolah: p.sekolah, tahun: tahun() },
      { jenjang: 'SMA', jurusan: 'IPA', sekolah: 'SMA Negeri ' + (1 + (p.id % 5)) + ' ' + p.unit.split(' ')[0], tahun: tahun() - 4 }
    ],
    riwayatPangkat: [
      { pangkat: p.pangkat, golongan: p.golongan, tmt: p.tmt, sk: 'SK ' + (82000 + p.id) },
      { pangkat: 'Penata Muda', golongan: 'III/a', tmt: tgl(), sk: 'SK ' + (74000 + p.id) }
    ],
    riwayatJabatan: [
      { jabatan: p.jabatan, unit: p.unit, tmt: tgl() },
      { jabatan: 'Fungsional Umum', unit: pkPick(unitKerja), tmt: tgl() }
    ],
    diklat: [
      { nama: 'Diklat Kepemimpinan', tahun: tahun(), status: 'Selesai' },
      { nama: 'Diklat Teknis ' + pkPick(['Manajemen', 'IT', 'Administrasi']), tahun: tahun(), status: 'Selesai' }
    ],
    dokumen: [
      { nama: 'Ijazah ' + p.pendidikan, jenis: 'Ijazah', status: 'Lengkap' },
      { nama: 'SK ' + p.pangkat, jenis: 'SK Pangkat', status: 'Lengkap' },
      { nama: 'KTP', jenis: 'KTP', status: 'Lengkap' }
    ]
  };
}

module.exports = {
  detailPegawai,
  pegawai,
  users,
  presensi,
  referensi,
  surat,
  kartuPegawai,
  kepangkatan,
  gajiBerkala,
  jenisCuti: jenisCutiAll,
  cuti,
  izinCerai,
  slks,
  pengadaan,
  pensiun,
  pindahTugas,
  penempatan,
  disiplin,
  diklatStruktural,
  diklatTeknis,
  izinBelajar,
  tugasBelajar,
  unitKerja,
  jabatanList,
  pangkatList,
  golonganList,
  jenisPegawaiList
};
