<?php
if (isset($_SESSION['MEMBER']) && $_SESSION['MEMBER']['role'] != 'staff') {
  $ar_judul = ['No', 'Nama Divisi', 'Action'];
?>
  <a href="index.php?hal=form_divisi" type="button" class="btn btn-primary">Input Data</a>
  <br />
  <h3>Data Divisi</h3>
  <table class="table table-sm table-dark">
    <thead>
      <tr>
        <?php
        foreach ($ar_judul as $jdl) {
        ?>
          <th scope="col"><?= $jdl ?></th>
        <?php } ?>
      </tr>
    </thead>
    <tbody>
      <?php
      //ciptakan object
      $model = new Divisi();
      $rs = $model->dataDivisi();
      $no = 1;
      foreach ($rs as $div) {
      ?>
        <tr>
          <th scope="row"><?= $no ?></th>
          <td><?= e($div['nama']) ?></td>
          <td>
            <a href="index.php?hal=form_divisi&idedit=<?= e($div['id']) ?>" type="button" class="btn btn-warning">Edit</a>
          </td>
        </tr>
      <?php $no++;
      } ?>
    </tbody>
  </table>
<?php } else {
  include_once 'denied.php';
}
?>