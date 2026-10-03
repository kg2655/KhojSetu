$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$runtimeDir = Join-Path $PSScriptRoot '.data\runtime'
if (Test-Path -LiteralPath $runtimeDir) {
    foreach ($stateFile in Get-ChildItem -LiteralPath $runtimeDir -Filter '*.json') {
        $state = Get-Content -LiteralPath $stateFile.FullName | ConvertFrom-Json
        $serviceProcess = Get-Process -Id $state.pid -ErrorAction SilentlyContinue
        $recordedStart = ([datetime]$state.started).ToUniversalTime()
        if ($serviceProcess -and $serviceProcess.StartTime.ToUniversalTime().Ticks -eq $recordedStart.Ticks) {
            # Windows venv Python can launch a child interpreter. Stop that child too.
            $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $($serviceProcess.Id)" |
                Where-Object { $_.Name -eq 'python.exe' -and $_.CommandLine -match 'uvicorn backend\.(app|cloud):app' }
            foreach ($child in $children) { Stop-Process -Id $child.ProcessId -ErrorAction SilentlyContinue }
            Stop-Process -Id $serviceProcess.Id -ErrorAction SilentlyContinue
            Write-Host "Stopped $($stateFile.BaseName)."
        }
    }
}
docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { docker compose stop }
Write-Host 'Project services stopped. Field memory and the Docker database volume are preserved. You can quit Docker Desktop when no other projects need it.'
