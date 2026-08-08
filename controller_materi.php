<?php
session_start();
if (!isset($_SESSION['MEMBER']) || $_SESSION['MEMBER']['role'] == 'staff') {
    header('Location:index.php?hal=home');
    exit;
}
include_once 'koneksi.php';
include_once 'models/Materi.php';

csrf_check();

//1. get request form
$nama = $_POST['nama'] ?? '';
//2. save to array data
$data = [$nama]; //tanda tanya pertama
//3. excecution button
$tombol = $_POST['proses'] ?? 'batal';
//create object
$model = new Materi();

try {
    switch ($tombol) {
        case 'simpan':
            $model->input($data);
            break;
        case 'ubah':
            $data[] = $_POST['idx'] ?? ''; // tangkap hidden field tanda tanya kedua di model
            $model->ubah($data);
            break;
        case 'hapus':
            unset($data); //hapus ? di atas
            $id = [$_POST['idx'] ?? '']; //tangkap hidden field di form u/ where id = ?
            $model->hapus($id);
            break;
    }
} catch (PDOException $e) {
    error_log('Gagal proses data materi: ' . $e->getMessage());
}
//4. landing page
header('location:index.php?hal=materi');
