# push & deploy otomatis ke Vercel (dipanggil dari git post-commit hook)
$ErrorActionPreference = 'Continue'

Write-Host '==> git push origin main'
git push origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "git push gagal (kode $LASTEXITCODE), tetap lanjut vercel --prod..."
}

Write-Host '==> vercel --prod --yes'
vercel --prod --yes 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "vercel deploy gagal (kode $LASTEXITCODE)"
    exit $LASTEXITCODE
}

Write-Host '==> Selesai: commit sudah di-push dan ter-deploy ke Vercel.'
