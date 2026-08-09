# Persiapan sekali-pakai VPS untuk deploy Docker (jalankan SATU KALI sebelum deploy-vps.ps1).
# Asumsi: koneksi sebagai root@<IP> (atau user dengan sudo tanpa password).
#
# Yang dilakukan:
#   1. Install & aktifkan Docker (lewat get.docker.com) bila belum ada.
#   2. Buat <AppDir>/nodejs dan unggah nodejs/.env dari lokal bila belum ada.
#      Otomatis menambah SESSION_SECRET (acak) bila belum terisi.
#   3. (opsional, -Caddy) Sediakan Caddyfile dari Caddyfile.example + ganti domain.
#   4. Buka port 80/443 di ufw bila tersedia.
#
# Contoh:
#   .\scripts\setup-vps.ps1 -Vps root@203.0.113.5
#   .\scripts\setup-vps.ps1 -Vps root@203.0.113.5 -Caddy -Domain webpegawai.com

[CmdletBinding()]
param(
    [string]$Vps = $env:VPS_HOST,
    [string]$AppDir = '/opt/web-pegawai',
    [switch]$Caddy,
    [string]$Domain = 'contoh.com',
    [string]$LocalEnv = 'nodejs\.env',
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

if (-not $Vps) { $Vps = Read-Host 'VPS (mis. root@203.0.113.5)' }
if (-not $Vps) { throw 'VPS host wajib diisi (mis. root@203.0.113.5).' }
if (-not (Test-Path $LocalEnv)) { throw "File .env lokal tidak ditemukan: $LocalEnv (butuh SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)." }

$sshOpt = '-o StrictHostKeyChecking=accept-new'

if ($DryRun) {
    Write-Host ''
    Write-Host '==> DRY RUN - tidak terhubung ke server. Perintah yang akan dijalankan:'
    Write-Host ('ssh ' + $sshOpt + ' ' + $Vps + ' <script install docker>')
    Write-Host '   ...'
    Write-Host ('scp ' + $sshOpt + ' ' + $LocalEnv + ' ' + $Vps + ':' + $AppDir + '/nodejs/.env')
    if ($Caddy) {
        Write-Host ('scp ' + $sshOpt + ' Caddyfile.example ' + $Vps + ':' + $AppDir + '/Caddyfile')
        Write-Host ('sed -i "s/contoh\.com/' + $Domain + '/g" ' + $AppDir + '/Caddyfile')
    }
    Write-Host '   ufw allow 80/tcp; ufw allow 443/tcp; ufw --force enable'
    exit 0
}

Write-Host "==> 1/4 Memeriksa koneksi & menginstal Docker di ${Vps} ..."
$bootstrap = @'
if command -v docker >/dev/null 2>&1; then
  echo '    docker sudah terpasang'
else
  echo '    menginstal Docker (get.docker.com)...'
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true
if docker compose version >/dev/null 2>&1; then
  echo '    compose plugin: OK'
else
  echo '    WARNING: compose plugin belum terpasang - jalankan ulang setelah login baru.'
fi
'@
ssh $sshOpt $Vps $bootstrap
if ($LASTEXITCODE -ne 0) { throw 'Gagal menyiapkan Docker di server.' }

Write-Host "==> 2/4 Menyiapkan direktori & nodejs/.env di ${AppDir} ..."
$dirScript = "mkdir -p `"$AppDir/nodejs`""
ssh $sshOpt $Vps $dirScript
if ($LASTEXITCODE -ne 0) { throw "Gagal membuat direktori $AppDir." }

$hasEnv = (ssh $sshOpt $Vps "test -f `"$AppDir/nodejs/.env`" && echo EXISTS || echo MISSING" | Out-String).Trim()
if ($hasEnv -eq 'EXISTS') {
    Write-Host '    nodejs/.env sudah ada - tidak menimpa.'
} else {
    Write-Host "    mengunggah nodejs/.env dari lokal ..."
    scp $sshOpt "$LocalEnv" "${Vps}:${AppDir}/nodejs/.env"
    if ($LASTEXITCODE -ne 0) { throw 'scp nodejs/.env gagal.' }
}

Write-Host '    memastikan SESSION_SECRET terisi ...'
$secret = if (Get-Command node -ErrorAction SilentlyContinue) {
    (node -e "console.log(require('crypto').randomBytes(32).toString('hex'))").Trim()
} else {
    ([guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N'))
}
$addSecret = "grep -q '^SESSION_SECRET=' `"$AppDir/nodejs/.env`" || echo 'SESSION_SECRET=$secret' >> `"$AppDir/nodejs/.env`""
ssh $sshOpt $Vps $addSecret
if ($LASTEXITCODE -ne 0) { throw 'Gagal menambah SESSION_SECRET.' }

if ($Caddy) {
    Write-Host "==> 3/4 Menyiapkan Caddyfile (domain: $Domain) ..."
    $hasCaddy = (ssh $sshOpt $Vps "test -f `"$AppDir/Caddyfile`" && echo EXISTS || echo MISSING" | Out-String).Trim()
    if ($hasCaddy -eq 'EXISTS') {
        Write-Host '    Caddyfile sudah ada - tidak menimpa.'
    } else {
        scp $sshOpt Caddyfile.example "${Vps}:${AppDir}/Caddyfile"
        if ($LASTEXITCODE -ne 0) { throw 'scp Caddyfile gagal.' }
        $setDomain = "sed -i 's/contoh\.com/$Domain/g' `"$AppDir/Caddyfile`""
        ssh $sshOpt $Vps $setDomain
        if ($LASTEXITCODE -ne 0) { throw 'Gagal mengatur domain di Caddyfile.' }
    }
} else {
    Write-Host '==> 3/4 Lewati Caddyfile (pakai -Caddy -Domain bila ingin HTTPS otomatis).'
}

Write-Host "==> 4/4 Membuka port firewall (80/443) ..."
$firewall = @'
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw --force enable >/dev/null
  echo '    ufw: port 80/443 dibuka.'
else
  echo '    ufw tidak ada - buka port 80/443 manual di panel firewall VPS.'
fi
'@
ssh $sshOpt $Vps $firewall
if ($LASTEXITCODE -ne 0) { throw 'Gagal mengatur firewall.' }

Write-Host ''
Write-Host '==> Selesai. Sekarang jalankan deploy:'
if ($Caddy) {
    Write-Host "    .\scripts\deploy-vps.ps1 -Vps $Vps -Prod"
} else {
    Write-Host "    .\scripts\deploy-vps.ps1 -Vps $Vps   (lalu uji di http://<IP>:3000/)"
}
Write-Host '(Pastikan record A domain menunjuk ke IP VPS bila memakai Caddy.)'
