<div class="row">
		<div class="col-md-9">
			<?php
			//route: hanya file2 yang terdaftar yang boleh di-include
			$route = [
				'home' => 'home.php',
				'aboutus' => 'aboutus.php',
				'form_login' => 'form_login.php',
				'pegawai' => 'pegawai.php',
				'form_pegawai' => 'form_pegawai.php',
				'detail_pegawai' => 'detail_pegawai.php',
				'divisi' => 'divisi.php',
				'form_divisi' => 'form_divisi.php',
				'jabatan' => 'jabatan.php',
				'form_jabatan' => 'form_jabatan.php',
				'gaji' => 'gaji.php',
				'form_gaji' => 'form_gaji.php',
				'detail_gaji' => 'detail_gaji.php',
				'pelatihan' => 'pelatihan.php',
				'form_pelatihan' => 'form_pelatihan.php',
				'materi' => 'materi.php',
				'form_materi' => 'form_materi.php',
				'kelolaUser' => 'kelolaUser.php',
				'form_user' => 'form_user.php',
				'profile' => 'profile.php',
			];
			//tangkap request dari url/menu
			$hal = isset($_GET['hal']) ? $_GET['hal'] : 'home';
			if (isset($route[$hal])) {
				include_once $route[$hal];
			} else {
				include_once 'home.php';
			}
			?>
		</div>