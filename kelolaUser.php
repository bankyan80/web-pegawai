<?php
if (isset($_SESSION['MEMBER']) && $_SESSION['MEMBER']['role'] == 'administrator') {

    $ar_judul = ['No', 'Fullname', 'Username', 'Role', 'Email', 'Foto', 'Action'];
?>

    <h3>Data Users</h3>
    <br />
    <a href="index.php?hal=form_user" type="button" class="btn btn-primary">Input User</a>
    <br /> <br />
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
            $model = new Login();
            $rs = $model->dataUser();
            $no = 1;
            foreach ($rs as $member) {
            ?>
                <tr>
                    <th scope="row"><?= $no ?></th>
                    <td><?= e($member['fullname']) ?></td>
                    <td><?= e($member['username']) ?></td>
                    <td><?= e($member['role']) ?></td>
                    <td><?= e($member['email']) ?></td>
                    <td>
                        <?php
                        if (empty($member['foto'])) {
                        ?>
                            <img src="public/images/no_photo.png" width="20%" />
                        <?php } else {
                        ?>
                            <img src="public/images/<?= e($member['foto']) ?>" width="20%" />
                        <?php } ?>
                    </td>
                    <td>
                        <a href="index.php?hal=form_user&idedit=<?= e($member['id']) ?>" type="button" class="btn btn-warning">Edit</a>
                    </td>
                </tr>
            <?php $no++;
            } ?>
        </tbody>
    </table>
<?php } else {
    include_once 'denied.php';
} ?>