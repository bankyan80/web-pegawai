<?php
session_start();
include_once 'koneksi.php';
include_once 'models/Login.php';

csrf_check();

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

//create object
$model = new Login();

$blokir = false;
$rs = null;
try {
    $blokir = $model->terlampauiBatas($username);
    if (!$blokir) {
        $rs = $model->otentikasi($username, $password);
    }
} catch (PDOException $e) {
    error_log('Login error: ' . $e->getMessage());
}

if ($blokir) {
    echo '<script>
            alert("Terlalu banyak percobaan login. Silakan coba lagi 15 menit lagi.");
            history.go(-1);
        </script>';
    exit;
}

if (!empty($rs)) {
    try {
        $model->hapusPercobaan($username);
    } catch (PDOException $e) {
        error_log('Login error (hapus percobaan): ' . $e->getMessage());
    }
    session_regenerate_id(true);
    $_SESSION['MEMBER'] = $rs;
    header('location:index.php?hal=pegawai');
} else {
    try {
        $model->catatPercobaan($username);
    } catch (PDOException $e) {
        error_log('Login error (catat percobaan): ' . $e->getMessage());
    }
    echo '<script>
            alert("Gagal Login");
            history.go(-1);
        </script>';
}
