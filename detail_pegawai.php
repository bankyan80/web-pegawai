<?php
if (!isset($_SESSION['MEMBER'])) {
    include_once 'denied.php';
    return;
}
//tangkap request id di url
$id = isset($_GET['id']) ? $_GET['id'] : '';
$model = new Pegawai();
$peg = $model->detailPegawai([$id]);

?>

<div class="card" style="width: 20rem;">
<?php
          if (empty($peg['foto'])) {
          ?>
            <img src="public/images/no_photo.png" class="card-img-top" alt="..." />
          <?php } else {
          ?>
            <img src="public/images/<?= e($peg['foto']) ?>" class="card-img-top" alt="...">
          <?php } ?> 
    
  <div class="card-body">
    <h5 class="card-title"><?= e($peg['nama']) ?></h5>
    <p class="card-text">
        NIP : <?= e($peg['nip']) ?> <br/>
        Nama : <?= e($peg['nama']) ?> <br/>
        Jenis Kelamin : <?= e($peg['gender']) ?> <br/>
        Divisi : <?= e($peg['divisi']) ?> <br/>
        Jabatan : <?= e($peg['jabatan']) ?> <br/>
        Tempat Lahir : <?= e($peg['tempat_lahir']) ?> <br/>
        Tanggal Lahir : <?= e($peg['tanggal_lahir']) ?> <br/>
        Alamat : <?= e($peg['alamat']) ?> <br/>
        Email : <?= e($peg['email']) ?> <br/>
    </p>
    <a href="index.php?hal=pegawai" class="btn btn-primary">Go back</a>
  </div>
</div>
