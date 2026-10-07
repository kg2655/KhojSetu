param([switch]$WithExchange, [switch]$SecondUnit)
$ErrorActionPreference = 'Stop'
$checks = @()
function Test-Endpoint($name, $url, $kind) {
    try {
        $headers = @{}
        if ($kind -eq 'gateway' -and $env:KHOJ_SYNC_TOKEN) { $headers['Authorization'] = "Bearer $env:KHOJ_SYNC_TOKEN" }
        $body = Invoke-RestMethod -Uri $url -Headers $headers -TimeoutSec 15
        if ($kind -eq 'field') {
            if (!$body.device -or !$body.engine -or $null -eq $body.records) { throw 'Unexpected field-service response.' }
            $detail = "$($body.device): $(@($body.records).Count) records; $($body.pending) pending; $($body.conflicts) conflicts; field mode $($body.fieldMode)"
        } else {
            if ($body.status -ne 'ready' -or $body.engine -ne 'Qdrant Server') { throw 'Unexpected gateway response.' }
            $detail = 'Gateway and Qdrant Server respond.'
        }
        [pscustomobject]@{Check=$name;Ready=$true;Detail=$detail}
    } catch {
        [pscustomobject]@{Check=$name;Ready=$false;Detail="Unavailable or unexpected service at $url. Check startup logs."}
    }
}
$checks += [pscustomobject]@{Check='Built interface';Ready=(Test-Path -LiteralPath (Join-Path $PSScriptRoot 'dist/index.html'));Detail='Run npm ci and npm run build if missing.'}
$checks += [pscustomobject]@{Check='Local model cache';Ready=(Test-Path -LiteralPath (Join-Path $PSScriptRoot '.models'));Detail='Cache directory check only; a ready field app confirms the model loaded.'}
$checks += Test-Endpoint 'Field unit' 'http://127.0.0.1:8000/api/state' 'field'
if ($SecondUnit) { $checks += Test-Endpoint 'Second field unit' 'http://127.0.0.1:8001/api/state' 'field' }
if ($WithExchange) {
    $gatewayUrl = if ($env:KHOJ_SYNC_URL) { $env:KHOJ_SYNC_URL.TrimEnd('/') } else { 'http://127.0.0.1:8010' }
    $checks += Test-Endpoint 'Shared gateway' "$gatewayUrl/health" 'gateway'
}
$checks | Format-Table -AutoSize -Wrap
Write-Host 'Read-only checks: no records, queues or sharing settings were changed.'
Write-Host 'Also rehearse a local search, camera/upload and an approved exchange; readiness is not an end-to-end test.'
if ($checks | Where-Object { !$_.Ready }) {
    Write-Host 'Start local memory: .\Start-KhojSetu.ps1'
    Write-Host 'Start exchange after opening Docker: .\Start-KhojSetu.ps1 -WithExchange'
    Write-Host 'Start the separate local unit: .\Start-KhojSetu.ps1 -SecondUnit'
    exit 1
}
exit 0
