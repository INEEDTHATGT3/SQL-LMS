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
  # Free models, tried in order. A provider error (outage, rate limit) does not count as an attempt:
  # the lane moves to the next model; when all fail in a row it backs off 5 minutes.
  [string[]]$Models = @('opencode/nemotron-3-ultra-free', 'opencode/beam-free', 'opencode/big-pickle',
                        'opencode/glm-5.3-flash-free', 'opencode/deepseek-v4.1-flash-free', 'opencode/mimo-v2.6-flash-free',
                        'opencode/longcat-2.5-preview-free', 'opencode/space-bunny-free', 'opencode/nemotron-3.5-super-vl-free'),
  [int]$StallMinutes = 10,
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
$script:mi = ($Lane - 1) % 2   # lanes start on different models to spread load
function Model { $Models[$script:mi % $Models.Count] }
function Board([string[]]$a) { (& node jobs/status.mjs @a 2>$null | Select-Object -Last 1).Trim() }

# Run one OpenCode session headless. Output goes to a log file that this pane tails live.
# We wait on the opencode process itself (not its output pipe), so a dev server or browser a
# session leaves behind cannot freeze the lane; such leftovers are killed afterwards.
function Show-New([string]$file, [ref]$pos) {
  if (-not (Test-Path $file)) { return }
  $fs = [System.IO.File]::Open($file, 'Open', 'Read', 'ReadWrite')
  try {
    if ($fs.Length -gt $pos.Value) {
      $fs.Seek($pos.Value, 'Begin') | Out-Null
      $buf = New-Object byte[] ($fs.Length - $pos.Value)
      $n = $fs.Read($buf, 0, $buf.Length)
      $pos.Value += $n
      [Console]::Out.Write([System.Text.Encoding]::UTF8.GetString($buf, 0, $n))
    }
  } finally { $fs.Close() }
}
function Invoke-OpenCode([string]$agent, [string]$model, [string]$id, [int]$try, [string]$prompt) {
  $out = Join-Path $logs "$id-$agent-$try.log"
  $err = "$out.err"
  Log "$agent $id (try $try) with $model -> $out"
  $started = Get-Date
  $argLine = "run --auto --agent $agent -m $model --title `"$id $agent try $try`" `"$($prompt.Replace('"', "'"))`""
  $empty = Join-Path $logs 'empty-stdin.txt'
  if (-not (Test-Path $empty)) { New-Item -ItemType File $empty | Out-Null }
  # stdin must be an empty file: with redirected output, `opencode run` otherwise waits on stdin
  $p = Start-Process -FilePath 'opencode' -ArgumentList $argLine -NoNewWindow -PassThru `
        -RedirectStandardInput $empty -RedirectStandardOutput $out -RedirectStandardError $err
  $pos = [long]0; $epos = [long]0; $stalled = $false
  $deadline = $started.AddMinutes($MaxMinutes); $lastGrowth = Get-Date; $lastSize = -1
  while (-not $p.HasExited) {
    Show-New $out ([ref]$pos); Show-New $err ([ref]$epos)
    $size = $pos + $epos
    if ($size -ne $lastSize) { $lastSize = $size; $lastGrowth = Get-Date }
    if ((Get-Date) -gt $deadline) { Log "$id $agent hit $MaxMinutes min; killing the session"; taskkill /F /T /PID $p.Id | Out-Null; break }
    if (((Get-Date) - $lastGrowth).TotalMinutes -gt $StallMinutes) {
      Log "$id $agent produced no output for $StallMinutes min on $model (model stalled); killing the session"
      taskkill /F /T /PID $p.Id | Out-Null; $stalled = $true; break
    }
    Start-Sleep -Seconds 2
  }
  Show-New $out ([ref]$pos); Show-New $err ([ref]$epos)
  $text = (Get-Content $out, $err -Raw -ErrorAction SilentlyContinue) -join "`n"
  $script:providerError = $stalled -or ($text.Length -lt 4000) -and ($text -match 'Internal Server Error|Too Many Requests|rate limit|\b429\b|\b50[234]\b|overloaded|FreeTier|free tier|ECONNRESET|fetch failed|Service Unavailable|Bad Gateway')
  if ($script:providerError) { Log "$id $agent hit a provider error on $model; not counted as an attempt" }
  # leftovers a session may have spawned despite the rules (dev servers, browsers)
  Get-CimInstance Win32_Process | Where-Object {
    $_.CreationDate -gt $started -and $_.CommandLine -match 'vite(?!.*\bbuild\b)|agent-browser|playwright|npm(\.cmd)?"? run (dev|preview)'
  } | ForEach-Object { Log "killing leftover process $($_.ProcessId) $($_.Name)"; taskkill /F /T /PID $_.ProcessId 2>$null | Out-Null }
}

# Run a session; on provider errors rotate models (and back off after a full cycle) until a real session happens.
function Invoke-Robust([string]$agent, [string]$id, [int]$try, [string]$prompt) {
  $fails = 0
  while ($true) {
    Invoke-OpenCode $agent (Model) $id $try $prompt
    if (-not $script:providerError) { return }
    $fails++; $script:mi++
    if ($fails % $Models.Count -eq 0) { Log "all $($Models.Count) models failed in a row; backing off 5 minutes"; Start-Sleep -Seconds 300 }
    else { Log "switching to $(Model)" }
  }
}

if ($StartDelaySeconds -gt 0) { Log "waiting $StartDelaySeconds s so lanes don't claim at the same moment"; Start-Sleep $StartDelaySeconds }
Log "lane started (models: $($Models -join ', ')$(if ($Code) { "; only $Code" }))"
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
    Invoke-Robust 'mechanic' $id $tries[$id] $prompt
    $status = Board @('get', $id)
    if ($status -eq 'doing') { Log "$id still doing after the session (timeout or unfinished); will retry"; continue }
  }

  if ($status -eq 'review') {
    Invoke-Robust 'inspector' $id ([int]$tries[$id]) "Inspect job card $id. Follow your inspector instructions and AGENTS.md exactly. End by running node jobs/status.mjs set $id done or node jobs/status.mjs set $id doing with your notes."
    $status = Board @('get', $id)
    if ($status -eq 'review') {
      Log "$id inspector gave no verdict; sending it back to the mechanic"
      Board @('set', $id, 'doing', "lane ${Lane}: inspector session ended without a verdict") | Out-Null
    }
  }
  Log "$id is now $(Board @('get', $id))"
}
Log 'lane stopped'
