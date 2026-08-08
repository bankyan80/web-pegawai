<?php
session_start();
if (!isset($_SESSION['MEMBER']) || $_SESSION['MEMBER']['role'] != 'administrator') {
    header('Location:index.php?hal=home');
    exit;
}
include_once 'koneksi.php';
include_once 'models/Login.php';

csrf_check();

//1. get request form
$fname = $_POST['fname'] ?? '';
$uname = $_POST['uname'] ?? '';
$pwd = $_POST['pwd'] ?? '';
$role = $_POST['role'] ?? 'staff';
$email = $_POST['email'] ?? '';
$foto = $_POST['foto'] ?? '';

//2. save to array data
$data = [$fname, $uname, $pwd, $role, $email, $foto]; //tanda tanya pertama
//3. excecution button
$tombol = $_POST['proses'] ?? 'batal';
//create object
$model = new Login();

try {
    switch ($tombol) {
        case 'simpan':
            $model->simpan($data);
            break;
        case 'ubah':
            $model->ubah($data, $_POST['idx'] ?? '');
            break;
        case 'hapus':
            unset($data); //hapus ? di atas
            $id = [$_POST['idx'] ?? '']; //tangkap hidden field di form u/ where id = ?
            $model->hapus($id);
            break;
    }
} catch (PDOException $e) {
    error_log('Gagal proses data user: ' . $e->getMessage());
}
//4. landing page
header('location:index.php?hal=kelolaUser');
