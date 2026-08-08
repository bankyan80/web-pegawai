<?php
class Login
{
    //member1 var
    private $koneksi;
    //member2 constructor
    public function __construct()
    {
        global $dbh; //panggil var instance pdo
        $this->koneksi = $dbh;
    }
    //member3 fungsi2 otentikasi user
    public function otentikasi($username, $password)
    {
        $sql = "SELECT * FROM member WHERE username=?";
        $ps = $this->koneksi->prepare($sql);
        $ps->execute([$username]);
        $rs = $ps->fetch();
        if (!$rs) {
            return null;
        }
        if (password_verify($password, $rs['passwors'])) {
            return $rs;
        }
        //hash lama SHA1: verifikasi lalu upgrade ke bcrypt
        if (sha1($password) === $rs['passwors']) {
            $this->gantiPassword($rs['id'], $password);
            return $rs;
        }
        return null;
    }
    private function gantiPassword($id, $password)
    {
        $sql = "UPDATE member SET passwors=? WHERE id=?";
        $ps = $this->koneksi->prepare($sql);
        $ps->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
    }
    public function dataUser()
    {
        $sql = "select * from member";
        //prepare statement PDO
        $ps = $this->koneksi->prepare($sql); //persiapan
        $ps->execute(); //eksekusi
        $rs = $ps->fetchAll(); // ambil seluruh baris data
        return $rs;
    }
    public function getUser($data)
    {
        $sql = "select * from member where id=?";
        //prepare statement PDO
        $ps = $this->koneksi->prepare($sql); //persiapan
        $ps->execute($data); //eksekusi
        $rs = $ps->fetch(); // ambil satu baris data yang mau diedit
        return $rs;
    }
    public function simpan($data)
    {
        //$data: [fullname, username, pwd, role, email, foto]
        $sql = "INSERT INTO member(fullname,username,passwors,role,email,foto)
                    VALUES (?,?,?,?,?,?)";
        $ps = $this->koneksi->prepare($sql);
        $data[2] = password_hash($data[2], PASSWORD_DEFAULT);
        $ps->execute($data);
    }
    public function ubah($data, $id)
    {
        //$data: [fullname, username, pwd, role, email, foto]
        if (empty($data[2])) { //pwd dikosongkan => password tidak diubah
            $sql = "update member set fullname=?, username=?, role=?, email=?, foto=? where id=?";
            $ps = $this->koneksi->prepare($sql);
            $ps->execute([$data[0], $data[1], $data[3], $data[4], $data[5], $id]);
        } else {
            $sql = "update member set fullname=?, username=?, passwors=?, role=?, email=?, foto=? where id=?";
            $ps = $this->koneksi->prepare($sql);
            $ps->execute([$data[0], $data[1], password_hash($data[2], PASSWORD_DEFAULT), $data[3], $data[4], $data[5], $id]);
        }
    }
    public function hapus($id)
    {
        $sql = "delete from member where id=?";
        //prepare statement PDO
        $ps = $this->koneksi->prepare($sql); //persiapan
        $ps->execute($id); //eksekusi
    }
    //--------- proteksi brute force login ----------
    public function terlampauiBatas($username)
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $sql = "SELECT COUNT(*) FROM login_attempt
                    WHERE username=? AND ip=?
                    AND attempted_at > (NOW() - INTERVAL 15 MINUTE)";
        $ps = $this->koneksi->prepare($sql);
        $ps->execute([$username, $ip]);
        return (int) $ps->fetchColumn() >= 5;
    }
    public function catatPercobaan($username)
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $sql = "INSERT INTO login_attempt(username, ip, attempted_at) VALUES (?,?,NOW())";
        $ps = $this->koneksi->prepare($sql);
        $ps->execute([$username, $ip]);
    }
    public function hapusPercobaan($username)
    {
        $sql = "DELETE FROM login_attempt WHERE username=?";
        $ps = $this->koneksi->prepare($sql);
        $ps->execute([$username]);
    }
}
