param([switch]$WithExchange, [switch]$SecondUnit)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$pythonExe = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (!(Test-Path -LiteralPath $pythonExe)) { throw 'Run the setup steps in START-HERE.md first.' }
$runtimeDir = Join-Path $PSScriptRoot '.data\runtime'
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
function Start-ServiceProcess($name, $module, $port) {
    try { Invoke-WebRequest -Uri "http://127.0.0.1:$port" -TimeoutSec 1 -ErrorAction Stop | Out-Null; Write-Host "$name is already listening on $port."; return } catch {
        if ($_.Exception.Response) { Write-Host "$name is already listening on $port."; return }
    }
    $serviceProcess = Start-Process -FilePath $pythonExe -ArgumentList @('-m','uvicorn',$module,'--host','127.0.0.1','--port',"$port") -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput "$runtimeDir\$name.out.log" -RedirectStandardError "$runtimeDir\$name.err.log"
    @{pid=$serviceProcess.Id; started=$serviceProcess.StartTime.ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath "$runtimeDir\$name.json"
    Write-Host "$name starting on port $port. Logs: $runtimeDir\$name.err.log"
}
if ($WithExchange) {
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { throw 'Open Docker Desktop, wait for its engine to run, then try again.' }
    Start-ServiceProcess 'exchange' 'backend.cloud:app' 8010
}
if ($SecondUnit) {
    $previousData = $env:KHOJ_DATA
    $previousDevice = $env:KHOJ_DEVICE
    $env:KHOJ_DATA = Join-Path $PSScriptRoot '.data\field-08'
    $env:KHOJ_DEVICE = 'FIELD-08'
    try { Start-ServiceProcess 'field-08' 'backend.app:app' 8001 }
    finally { $env:KHOJ_DATA = $previousData; $env:KHOJ_DEVICE = $previousDevice }
    Write-Host 'Open http://localhost:8001 for the second field unit.'
} else {
    Start-ServiceProcess 'field-07' 'backend.app:app' 8000
    Write-Host 'Open http://localhost:8000 for KhojSetu.'
}
Write-Host 'No Docker or Qdrant sign-in is needed. See START-HERE.md for the full explanation.'
