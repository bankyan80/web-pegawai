$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'

function Get-Csrf([string]$html) {
  if ($html -match 'name="csrf-token" content="([a-f0-9]+)"') { return $matches[1] }
  if ($html -match 'name="csrf_token" value="([a-f0-9]+)"') { return $matches[1] }
  return ''
}

function Login([string]$user, [string]$pass) {
  $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $resp1 = Invoke-WebRequest -Uri "$base/?hal=home" -WebSession $s -UseBasicParsing
  $csrf = Get-Csrf $resp1.Content
  $body = @{ csrf_token = $csrf; username = $user; password = $pass }
  Invoke-WebRequest -Uri "$base/controller/login" -Method Post -WebSession $s -Body $body -ContentType 'application/x-www-form-urlencoded' -MaximumRedirection 0 -ErrorAction SilentlyContinue | Out-Null
  return $s
}

function Show($label, $code, $hit) {
  $ok = ($code -eq 200) -and ($hit -match 'Status Kepegawaian|Layanan Kepegawaian|Menampilkan|kep-table|Mutasi Kepegawaian')
  Write-Output ('{0,-34} HTTP {1}  {2}' -f $label, $code, $(if ($ok) { 'OK' } else { 'CHECK' }))
}

Write-Output '===== STAFF (RIFAN MAULANA) ====='
$s = Login '199612172024211011' '211011'

$r = Invoke-WebRequest -Uri "$base/status-kepegawaian" -WebSession $s -UseBasicParsing
Show 'status-kepegawaian (staff)' $r.StatusCode ($r.Content -join '')

# Navbar staff: harus ada Kepegawaian/Profil/Periode/Status, TIDAK ada menu layanan
$nav = $r.Content -join ''
Write-Output ('  navbar Kepegawaian   : ' + $nav.Contains('Kepegawaian'))
Write-Output ('  navbar Profil Pegawai: ' + $nav.Contains('Profil Pegawai'))
Write-Output ('  navbar Periode PPPK  : ' + $nav.Contains('Periode PPPK'))
Write-Output ('  navbar Status KP     : ' + $nav.Contains('Status Kepegawaian'))
Write-Output ('  navbar ada Layanan?  : ' + $nav.Contains('Kenaikan Pangkat'))
Write-Output ('  data RIFAN muncul?   : ' + $nav.Contains('RIFAN MAULANA'))

# Staff dilarang ke /mutasi (harus redirect -> bukan 200)
try {
  $rn = Invoke-WebRequest -Uri "$base/mutasi" -WebSession $s -UseBasicParsing
  Write-Output ('  staff->/mutasi       : HTTP ' + $rn.StatusCode + ' (harusnya redirect, bukan 200)')
} catch {
  Write-Output ('  staff->/mutasi       : redirect OK (' + $_.Exception.Response.StatusCode.value__ + ')')
}

Write-Output ''
Write-Output '===== MANAGER (smoke) ====='
$m = Login 'smoke.manager' 'smoke12345'

$pages = @('status-kepegawaian','mutasi','jabatan-penugasan','sertifikasi-tunjangan','arsip-kepegawaian','surat-kepegawaian','riwayat-status')
foreach ($p in $pages) {
  $resp = Invoke-WebRequest -Uri "$base/$p" -WebSession $m -UseBasicParsing
  Show ("$p (manager)") $resp.StatusCode (($resp.Content -join ''))
}

$navM = (Invoke-WebRequest -Uri "$base/status-kepegawaian" -WebSession $m -UseBasicParsing).Content -join ''
Write-Output ('  navbar Layanan KP : ' + $navM.Contains('Layanan Kepegawaian'))
Write-Output ('  navbar Mutasi     : ' + $navM.Contains('Mutasi Kepegawaian'))
Write-Output ('  navbar Sertifikasi: ' + $navM.Contains('Sertifikasi'))
Write-Output ('  navbar Surat KP   : ' + $navM.Contains('Surat Kepegawaian'))
Write-Output ('  navbar Riwayat    : ' + $navM.Contains('Riwayat Status'))
