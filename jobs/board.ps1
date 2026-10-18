<# Live job board for watching the lanes: refreshes every 30 s. #>
Set-Location (Split-Path -Parent $PSScriptRoot)
$Host.UI.RawUI.WindowTitle = 'Job board'
while ($true) {
  Clear-Host
  Write-Host "JOB BOARD  $(Get-Date -Format 'HH:mm:ss')   (refreshes every 30 s; Ctrl-C to stop)" -ForegroundColor Yellow
  node jobs/status.mjs
  Write-Host "`nLast lane events:" -ForegroundColor Yellow
  Get-ChildItem jobs/logs/lane-*.log -ErrorAction SilentlyContinue | ForEach-Object { Get-Content $_ -Tail 2 }
  Start-Sleep -Seconds 30
}
