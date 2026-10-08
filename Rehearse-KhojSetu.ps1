param([ValidateSet('Start','Fresh','Stop','Status')][string]$Action='Start')
$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$pythonExe=Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
$base=Join-Path $PSScriptRoot '.data\rehearsals'
$current=Join-Path $base 'current.json'
function Stop-Rehearsal($session) {
    foreach($item in $session.processes) {
        $process=Get-Process -Id $item.pid -ErrorAction SilentlyContinue
        if($process -and $process.StartTime.ToUniversalTime() -eq ([datetime]$item.started).ToUniversalTime()) {
            # The venv launcher may have a Python child; verify its command before stopping it.
            Get-CimInstance Win32_Process -Filter "ParentProcessId = $($item.pid)" | Where-Object { $_.Name -match '^python' -and $_.CommandLine -like '*uvicorn*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -ErrorAction SilentlyContinue }
            Stop-Process -Id $item.pid -ErrorAction SilentlyContinue
        }
    }
}
$session=if(Test-Path -LiteralPath $current){Get-Content -Raw -LiteralPath $current|ConvertFrom-Json}else{$null}
if($Action -eq 'Stop') { if($session){Stop-Rehearsal $session}; Write-Host 'Rehearsal stopped. All saved sessions and main field records retained.'; exit }
if($Action -eq 'Status') { if($session){$session|ConvertTo-Json -Depth 6}else{Write-Host 'No rehearsal created yet.'}; exit }
if(!(Test-Path -LiteralPath $pythonExe)){throw 'Complete START-HERE.md setup first.'}
if(!(Test-Path -LiteralPath (Join-Path $PSScriptRoot 'dist\index.html'))){throw 'Run npm ci and npm run build first.'}
if($session){Stop-Rehearsal $session; Start-Sleep -Milliseconds 800}
foreach($port in @(8002,8003,8012)) {
    $listener=Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if($listener){throw "Port $port is occupied. Stop its owning service before rehearsing. No process was killed."}
}
docker compose up -d
if($LASTEXITCODE -ne 0){throw 'Start Docker Desktop and wait for the engine, then retry.'}
New-Item -ItemType Directory -Path $base -Force|Out-Null
if(!$session -or $Action -eq 'Fresh') {
    $runId=(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[guid]::NewGuid().ToString('N').Substring(0,6)
    $session=[pscustomobject]@{run=$runId;directory=(Join-Path $base $runId);collection="khojsetu_rehearsal_$($runId.Replace('-','_'))";processes=@()}
}
New-Item -ItemType Directory -Path $session.directory -Force|Out-Null
$session.processes=@()
$names=@('KHOJ_DATA','KHOJ_DEVICE','KHOJ_SYNC_URL','KHOJ_SYNC_TOKEN','KHOJ_CLOUD_DATA','KHOJ_COLLECTION','QDRANT_URL','QDRANT_API_KEY')
$previous=@{}
foreach($name in $names){$previous[$name]=[Environment]::GetEnvironmentVariable($name,'Process')}
function Save-Session { $session|ConvertTo-Json -Depth 6|Set-Content -LiteralPath $current }
function Launch($name,$module,$port,$health) {
    $proc=Start-Process -FilePath $pythonExe -ArgumentList @('-m','uvicorn',$module,'--host','127.0.0.1','--port',"$port") -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $session.directory "$name.out.log") -RedirectStandardError (Join-Path $session.directory "$name.err.log")
    $session.processes+=@{name=$name;pid=$proc.Id;started=$proc.StartTime.ToUniversalTime().ToString('o');port=$port}
    Save-Session
    for($attempt=0;$attempt -lt 45;$attempt++) {
        try {$response=Invoke-RestMethod "http://127.0.0.1:$port/$health" -TimeoutSec 2; if($response.device -or $response.status -eq 'ready'){return}}catch{}
        if($proc.HasExited){throw "$name exited. Read $($session.directory)\$name.err.log"}
        Start-Sleep -Seconds 1
    }
    throw "$name did not become ready. Read its log in $($session.directory)."
}
try {
    $env:KHOJ_SYNC_TOKEN='';$env:QDRANT_API_KEY='';$env:QDRANT_URL='http://127.0.0.1:6333'
    $env:KHOJ_COLLECTION=$session.collection
    $env:KHOJ_CLOUD_DATA=Join-Path $session.directory 'cloud'
    $env:KHOJ_SYNC_URL='http://127.0.0.1:8012'
    Launch 'gateway' 'backend.cloud:app' 8012 'health'
    foreach($unit in @(@('a','REHEARSAL-A',8002),@('b','REHEARSAL-B',8003))) {
        $env:KHOJ_DATA=Join-Path $session.directory $unit[0];$env:KHOJ_DEVICE=$unit[1]
        Launch $unit[0] 'backend.app:app' $unit[2] 'api/state'
    }
    $state=Invoke-RestMethod 'http://127.0.0.1:8002/api/state'
    if(@($state.records).Count -eq 0) {
        $pack=Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'public\reference-pack-met-materials.json')
        Invoke-RestMethod 'http://127.0.0.1:8002/api/reference-packs' -Method Post -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($pack))|Out-Null
    }
    Write-Host 'READY: A http://localhost:8002 | B http://localhost:8003'
    Write-Host 'A starts with 8 museum notes; B starts empty. Both are separate from your main notebook.'
    Write-Host 'Fresh creates another empty session, preserving previous sessions and main data.'
    Write-Host 'Stop: .\Rehearse-KhojSetu.ps1 Stop | Resume: .\Rehearse-KhojSetu.ps1 Start'
} catch { Stop-Rehearsal $session; throw }
finally {foreach($name in $names){[Environment]::SetEnvironmentVariable($name,$previous[$name],'Process')}}

