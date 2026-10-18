<#
  Lane driver: runs OpenCode job cards unattended, one card at a time per lane.
  Start several lanes in separate terminals:  & .\jobs\drive.ps1 -Lane 1
  Each loop: claim a card (jobs/status.mjs claim) -> mechanic -> inspector -> repeat.
  A card failing inspection is retried; after -MaxAttempts it is set blocked for Claude/Dhruv.
  Logs: jobs/logs/lane-<n>.log (summary) and jobs/logs/<ID>-<agent>-<try>.log (full OpenCode output).
  Free models run anonymously: OpenCode data lives in %LOCALAPPDATA%\opencode-free, so an expired
  personal API key in ~/.local/share/opencode is not used. Stop a lane with Ctrl-C.
#>
param(
  [int]$Lane = 1,
  [string]$Model = 'opencode/big-pickle',
  [string]$InspectModel = 'opencode/big-pickle',
  [string]$Code = '',
  [int]$MaxAttempts = 3,
  [int]$MaxMinutes = 120,
  [int]$StartDelaySeconds = 0
)
$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
$env:XDG_DATA_HOME = Join-Path $env:LOCALAPPDATA 'opencode-free'
$env:PYTHONUTF8 = '1'
$logs = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force $logs | Out-Null
$laneLog = Join-Path $logs "lane-$Lane.log"
$Host.UI.RawUI.WindowTitle = "OpenCode lane $Lane"

function Log([string]$m) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [lane $Lane] $m"
  Write-Host $line -ForegroundColor Cyan
  Add-Content -Path $laneLog -Value $line
}
function Board([string[]]$a) { (& node jobs/status.mjs @a 2>$null | Select-Object -Last 1).Trim() }

# Run one OpenCode session headless; kill it (whole process tree) after MaxMinutes.
function Invoke-OpenCode([string]$agent, [string]$model, [string]$id, [int]$try, [string]$prompt) {
  $out = Join-Path $logs "$id-$agent-$try.log"
  Log "$agent $id (try $try) with $model -> $out"
  $me = $PID
  $watch = Start-Job -ArgumentList $me, $MaxMinutes -ScriptBlock {
    param($parent, $mins)
    Start-Sleep -Seconds ($mins * 60)
    Get-CimInstance Win32_Process -Filter "ParentProcessId=$parent AND Name='opencode.exe'" |
      ForEach-Object { taskkill /F /T /PID $_.ProcessId | Out-Null }
  }
  & opencode run --auto --agent $agent -m $model --title "$id $agent try $try" $prompt 2>&1 |
    Tee-Object -FilePath $out | Out-Host
  Stop-Job $watch -ErrorAction SilentlyContinue; Remove-Job $watch -Force -ErrorAction SilentlyContinue
}

if ($StartDelaySeconds -gt 0) { Log "waiting $StartDelaySeconds s so lanes don't claim at the same moment"; Start-Sleep $StartDelaySeconds }
Log "lane started (model $Model, inspector $InspectModel$(if ($Code) { ", only $Code" }))"
$tries = @{}
$idle = 0

while ($true) {
  $id = Board @('claim', "$Lane", $Code)
  if ($id -eq 'none') { Log 'nothing left this lane can run: board finished, or the rest is blocked/waiting on review. Lane exits.'; break }
  if ($id -eq 'wait' -or -not $id) {
    if ($idle % 10 -eq 0) { Log 'waiting: other lanes hold the cards this one depends on' }
    $idle++; Start-Sleep -Seconds 120; continue
  }
  $idle = 0
  $status = Board @('get', $id)

  if ($status -eq 'doing') {
    $tries[$id] = 1 + [int]$tries[$id]
    if ($tries[$id] -gt $MaxAttempts) {
      Board @('set', $id, 'blocked', "lane $Lane gave up after $MaxAttempts mechanic attempts; needs Claude or Dhruv (see jobs/logs/$id-*.log)") | Out-Null
      Log "$id blocked after $MaxAttempts attempts"; continue
    }
    $prompt = "Work job card $id. Follow your mechanic instructions and AGENTS.md exactly. This is attempt $($tries[$id]) of $MaxAttempts; if the card's Report already has inspector notes or a previous partial Report, fix those points first and keep what already works. Finish by running node jobs/status.mjs set $id review followed by a one-line summary in quotes."
    Invoke-OpenCode 'mechanic' $Model $id $tries[$id] $prompt
    $status = Board @('get', $id)
    if ($status -eq 'doing') { Log "$id still doing after the session (timeout or unfinished); will retry"; continue }
  }

  if ($status -eq 'review') {
    Invoke-OpenCode 'inspector' $InspectModel $id ([int]$tries[$id]) "Inspect job card $id. Follow your inspector instructions and AGENTS.md exactly. End by running node jobs/status.mjs set $id done or node jobs/status.mjs set $id doing with your notes."
    $status = Board @('get', $id)
    if ($status -eq 'review') {
      Log "$id inspector gave no verdict; sending it back to the mechanic"
      Board @('set', $id, 'doing', "lane $Lane: inspector session ended without a verdict") | Out-Null
    }
  }
  Log "$id is now $(Board @('get', $id))"
}
Log 'lane stopped'
