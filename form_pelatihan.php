<?php
if (isset($_SESSION['MEMBER']) && $_SESSION['MEMBER']['role'] != 'staff') {
    //---awal proses edit data---
    //1. tangkap request idedit 
    $idedit = isset($_REQUEST['idedit']) ? $_REQUEST['idedit'] : '';
    $model = new Pelatihan();
    if (!empty($idedit)) { //modus edit data lama
        $rs = $model->getPelatihan([$idedit]);
    } else { //modus entry data baru
        $rs = [];
    }
    //---akhir proses edit data---

    //master data di radio button dan select option
    $obj1 = new Pegawai();
    $obj2 = new Materi();
    $pegawai = $obj1->dataPegawai(); //array asosiatif
    $materi = $obj2->dataMateri();
?>

    <h3>Form Pelatihan</h3>
    <form method="POST" action="controller_pelatihan.php">
        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
        <div class="form-group row">
            <label for="nama" class="col-4 col-form-label">Nama Pegawai</label>
            <div class="col-8">
                <select id="nama" name="pegawai" class="custom-select">
                    <option value="">-- Nama Pegawai --</option>
                    <?php
                    foreach ($pegawai as $peg) {
                        $sel = ($peg['id'] == $rs['pegawai_id']) ? 'selected' : '';
                    ?>
                        <option value="<?= e($peg['id']) ?>" <?= $sel ?>><?= e($peg['nama']) ?></option>
                    <?php
                    }
                    ?>
                </select>
            </div>
        </div>
        <div class="form-group row">
            <label for="nama" class="col-4 col-form-label">Materi Pelatihan</label>
            <div class="col-8">
                <select id="nama" name="materi" class="custom-select">
                    <option value="">-- Materi Pelatihan --</option>
                    <?php
                    foreach ($materi as $mat) {
                        $sel = ($mat['id'] == $rs['materi_id']) ? 'selected'  : '';
                    ?>
                        <option value="<?= e($mat['id']) ?>" <?= $sel ?>><?= e($mat['nama']) ?></option>
                    <?php
                    }
                    ?>
                </select>
            </div>
        </div>
        <div class="form-group row">
            <label class="col-4 col-form-label">Tanggal Mulai</label>
            <div class="col-8">
                <input name="tgl_mulai" value="<?= e($rs['tgl_mulai']) ?>" type="date" class="form-control">
            </div>
        </div>
        <div class="form-group row">
            <label for="tgl" class="col-4 col-form-label">Tanggal Akhir</label>
            <div class="col-8">
                <input id="tgl" name="tgl_akhir" value="<?= e($rs['tgl_akhir']) ?>" type="date" class="form-control">
            </div>
        </div>
        <div class="form-group row">
            <label for="nama" class="col-4 col-form-label">Keterangan</label>
            <div class="col-8">
                <input id="nama" name="ket" value="<?= e($rs['keterangan']) ?>" type="text" class="form-control">
            </div>
        </div>
        <div class="form-group row">
            <div class="offset-4 col-8">
                <?php
                if (empty($idedit)) { //--------modus entry data baru--------
                ?>
                    <button name="proses" value="simpan" type="submit" class="btn btn-primary">Simpan</button>
                <?php
                } else { //--------modus edit data lama--------
                ?>
                    <button name="proses" value="ubah" type="submit" class="btn btn-warning">Ubah</button>
                    <button name="proses" value="hapus" type="submit" onClick="return confirm('are you sure?')" class="btn btn-danger">Hapus</button>
                    <!-- hidden field untuk melempar idedit ke controller -->
                    <input type="hidden" name="idx" value="<?= e($idedit) ?>" />
                <?php } ?>
                <button name="proses" value="batal" type="submit" class="btn btn-info">Batal</button>
            </div>
        </div>
    </form>
<?php } else {
    include_once 'denied.php';
} ?>