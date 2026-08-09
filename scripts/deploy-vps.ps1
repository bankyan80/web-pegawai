# Deploy otomatis ke VPS (Docker).
# Mengirim isi repo (hanya file yang ter-commit, TANPA secret) ke server,
# lalu membangun & menjalankan ulang container Docker.
#
# Prasyarat:
#   1. Docker + compose plugin terpasang di VPS.
#   2. SSH key sudah terpasang (ssh-copy-id) sehingga koneksi non-interaktif.
#   3. Di server sudah ada <AppDir>/nodejs/.env (isi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET).
#      Mode -Prod juga butuh <AppDir>/Caddyfile (salin dari Caddyfile.example).
#
# Contoh:
#   .\scripts\deploy-vps.ps1 -Vps root@203.0.113.5
#   .\scripts\deploy-vps.ps1 -Vps root@203.0.113.5 -AppDir /opt/web-pegawai -Prod
#   $env:VPS_HOST = 'root@203.0.113.5'; .\scripts\deploy-vps.ps1

[CmdletBinding()]
param(
    [string]$Vps = $env:VPS_HOST,
    [string]$AppDir = '/opt/web-pegawai',
    [switch]$Prod,
    [string]$DockerCmd = 'docker compose',
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

if (-not $Vps) { $Vps = Read-Host 'VPS (mis. root@203.0.113.5)' }
if (-not $Vps) { throw 'VPS host wajib diisi (mis. root@203.0.113.5).' }

$dirty = git status --porcelain | Where-Object { $_ -notmatch '^\?\? (nodejs/\.env|Caddyfile|\.env\.local)$' }
if ($dirty) {
    Write-Warning 'Ada perubahan yang belum di-commit. Deploy hanya mengirim isi HEAD (commit terakhir).'
}

Write-Host '==> Membuat arsip HEAD (git archive, tanpa secret)...'
$tar = Join-Path $env:TEMP ("web-pegawai-" + (Get-Date -Format 'yyyyMMddHHmmss') + ".tar")
git archive --format=tar HEAD -o $tar
if ($LASTEXITCODE -ne 0) { throw 'git archive gagal.' }
$sizeMb = [math]::Round((Get-Item $tar).Length / 1MB, 1)
Write-Host ("    Arsip: {0} MB" -f $sizeMb)

$composeArgs = '-f docker-compose.yml'
if ($Prod) { $composeArgs = '-f docker-compose.yml -f docker-compose.prod.yml' }

$remote = @'
set -e
mkdir -p "@APP@"
cd "@APP@"
tar xf /tmp/web-pegawai.tar
rm -f /tmp/web-pegawai.tar
if [ ! -f nodejs/.env ]; then
  echo "ERROR: nodejs/.env belum ada di server (@APP@/nodejs/.env)."
  echo "Salin dari lokal: scp nodejs/.env @VPS@:@APP@/nodejs/.env"
  exit 1
fi
if [ "@PROD@" = "1" ] && [ ! -f Caddyfile ]; then
  echo "ERROR: Caddyfile belum ada di server. Salin: scp Caddyfile.example @VPS@:@APP@/Caddyfile lalu ubah domain."
  exit 1
fi
echo '==> Membangun & menjalankan ulang container...'
@DOCKER@ @COMPOSE@ up -d --build
echo '==> Status:'
@DOCKER@ @COMPOSE@ ps
'@
$remote = $remote.Replace('@APP@', $AppDir)
$remote = $remote.Replace('@VPS@', $Vps)
$remote = $remote.Replace('@DOCKER@', $DockerCmd)
$remote = $remote.Replace('@COMPOSE@', $composeArgs)
$remote = $remote.Replace('@PROD@', $(if ($Prod) { '1' } else { '0' }))

if ($DryRun) {
    Write-Host ''
    Write-Host '==> DRY RUN - tidak mengeksekusi apa pun. Perintah yang akan dijalankan:'
    Write-Host ("scp -o StrictHostKeyChecking=accept-new `"$tar`" ${Vps}:/tmp/web-pegawai.tar")
    Write-Host ('ssh -o StrictHostKeyChecking=accept-new ' + $Vps)
    Write-Host '--- perintah di server ---'
    Write-Host $remote
    Remove-Item $tar -Force -ErrorAction SilentlyContinue
    exit 0
}

Write-Host "==> Mengirim arsip ke ${Vps} ..."
scp -o StrictHostKeyChecking=accept-new "$tar" "${Vps}:/tmp/web-pegawai.tar"
if ($LASTEXITCODE -ne 0) { Remove-Item $tar -Force; throw 'scp gagal mengirim arsip.' }

Write-Host "==> Mengekstrak & deploy di ${Vps}:${AppDir} ..."
ssh -o StrictHostKeyChecking=accept-new $Vps $remote
$code = $LASTEXITCODE
Remove-Item $tar -Force -ErrorAction SilentlyContinue
if ($code -ne 0) { throw "Deploy di server gagal (kode $code)." }

Write-Host ''
Write-Host '==> Selesai. Cek aplikasi:'
if ($Prod) {
    Write-Host '    https://<domain Anda>/'
} else {
    Write-Host "    http://<IP_SERVER>:3000/  (atau sesuai port di docker-compose.yml)"
}
Write-Host '(Pastikan firewall VPS membuka port 80/443 bila memakai Caddy, atau port 3000 untuk uji.)'
