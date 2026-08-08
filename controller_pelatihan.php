<?php
session_start();
if (!isset($_SESSION['MEMBER']) || $_SESSION['MEMBER']['role'] == 'staff') {
    header('Location:index.php?hal=home');
    exit;
}
include_once 'koneksi.php';
include_once 'models/Pelatihan.php';

csrf_check();

//1. get request element form
$peg = $_POST['pegawai'] ?? '';
$mat = $_POST['materi'] ?? '';
$tgl_m = $_POST['tgl_mulai'] ?? '';
$tgl_a = $_POST['tgl_akhir'] ?? '';
$ket = $_POST['ket'] ?? '';


//2. save to array
$data = [
    $peg, // ? 1
    $mat, // ? 2
    $tgl_m, // ? 3
    $tgl_a, // ? 4
    $ket // ? 5
];

//3. excute button
$tombol = $_POST['proses'] ?? 'batal';

//4. create object
$model = new Pelatihan();

try {
    if ($tombol == 'simpan') { //simpan adalah value dari button submit
        $model->simpan($data);
    } else if ($tombol == 'ubah') {
        $data[] = $_POST['idx'] ?? ''; //tangkap hidden field dari form u/ ? 11 klausa where id
        $model->ubah($data);
    } else if ($tombol == 'hapus') {
        unset($data); //hapus ? di atas
        $id = [$_POST['idx'] ?? ''];
        $model->hapus($id);
    }
} catch (PDOException $e) {
    error_log('Gagal proses data pelatihan: ' . $e->getMessage());
}

//4. selesai proses redirect / landing page (ada perubahan data)
header('Location:index.php?hal=pelatihan');
