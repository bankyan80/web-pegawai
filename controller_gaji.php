<?php
session_start();
if (!isset($_SESSION['MEMBER']) || $_SESSION['MEMBER']['role'] == 'staff') {
    header('Location:index.php?hal=home');
    exit;
}
include_once 'koneksi.php';
include_once 'models/Gaji.php';

csrf_check();

$nama = $_POST['nama'] ?? '';
$gapok = $_POST['gapok'] ?? '';
$tunjab = $_POST['tunjab'] ?? '';
$bpjs = $_POST['bpjs'] ?? '';
$lain2 = $_POST['lain2'] ?? '';

$data = [
  $nama, $gapok, $tunjab, $bpjs, $lain2
];
$data2 = [
  $gapok, $tunjab, $bpjs, $lain2
];
$tombol = $_POST['proses'] ?? 'batal';

$model = new Gaji();

try {
    if ($tombol == 'simpan') { //simpan adalah value dari button submit
        $model->simpan($data);
    } else if ($tombol == 'ubah') {
        $data2[] = $_POST['idx'] ?? '';
        $model->ubah($data2);
    } else if ($tombol == 'hapus') {
        unset($data); //hapus ? di atas
        $id = [$_POST['idx'] ?? ''];
        $model->hapus($id);
    }
} catch (PDOException $e) {
    error_log('Gagal proses data gaji: ' . $e->getMessage());
}
//4. selesai proses redirect / landing page (ada perubahan data)
header('Location:index.php?hal=gaji');
