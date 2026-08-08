<?php
session_start();
if (!isset($_SESSION['MEMBER'])) {
    header('Location:index.php?hal=home');
    exit;
}
include_once 'koneksi.php';
include_once 'models/Pegawai.php';

csrf_check();

//1. get request element form
$nip = $_POST['nip'] ?? '';
$nama = $_POST['nama'] ?? '';
$jk = $_POST['gender'] ?? '';
$tmp = $_POST['tmp'] ?? '';
$tgl = $_POST['tgl'] ?? '';
$jab = $_POST['jabatan'] ?? '';
$div = $_POST['divisi'] ?? '';
$alamat = $_POST['alamat'] ?? '';
$email = $_POST['email'] ?? '';
$foto = $_POST['foto'] ?? '';

//2. save to array
$data = [
    $nip, // ? 1
    $nama, // ? 2
    $jk, // ? 3
    $tmp, // ? 4
    $tgl, // ? 5
    $jab, // ? 6
    $div, // ? 7
    $alamat, // ? 8
    $email, // ? 9
    $foto // ? 10
];

//3. excute button
$tombol = $_POST['proses'] ?? 'batal';

//4. create object
$model = new Pegawai();

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
    error_log('Gagal proses data pegawai: ' . $e->getMessage());
}

//4. selesai proses redirect / landing page (ada perubahan data)
header('Location:index.php?hal=pegawai');