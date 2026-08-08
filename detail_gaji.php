<?php
if (!isset($_SESSION['MEMBER']) || $_SESSION['MEMBER']['role'] == 'staff') {
    include_once 'denied.php';
    return;
}
//tangkap request id di url
$id = isset($_GET['id']) ? $_GET['id'] : '';
$model = new Gaji();
$gaji = $model->getGaji([$id]);
?>

<div class="card" style="width: 20rem;">
  <?php
  if (empty($gaji['foto'])) {
  ?>
    <img src="public/images/no_photo.png" class="card-img-top" alt="..." />
  <?php } else {
  ?>
    <img src="public/images/<?= e($gaji['foto']) ?>" class="card-img-top" alt="...">
  <?php } ?>
  <div class="card-body">
    <h5 class="card-title"><?= e($gaji['nama']) ?></h5>
    <p class="card-text">
      <?php
      $ar_judul = [
        'NIP' => $gaji['nip'], 'Divisi' => $gaji['divisi'], 'Jabatan' => $gaji['jabatan'],
        'Gaji Pokok' => $gaji['gapok'], 'Tunjangan Jabatan' => $gaji['tunjab'],
        'BPJS' => $gaji['bpjs'], 'Lain-Lain' => $gaji['lain2']
      ];
      ?>
      <table cellpadding="5">
        <?php
        foreach ($ar_judul as $k => $v) {
        ?>
          <tr>
            <td><?= e($k) ?></td>
            <td><?= e($v) ?></td>
          </tr>
        <?php } ?>
      </table>
    </p>
    <a href="index.php?hal=gaji" class="btn btn-primary">Go back</a>
  </div>
</div>