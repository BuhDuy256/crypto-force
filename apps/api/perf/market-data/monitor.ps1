param([int]$TargetProcessId, [string]$OutputPath)
$ErrorActionPreference = 'Stop'
while ($true) {
    $targetProcess = Get-Process -Id $TargetProcessId -ErrorAction SilentlyContinue
    if (-not $targetProcess) { break }
    $sample = @{ utc = [DateTime]::UtcNow.ToString('o'); process = 'k6'; pid = $TargetProcessId; cpuSeconds = $targetProcess.CPU; workingSetBytes = $targetProcess.WorkingSet64; privateBytes = $targetProcess.PrivateMemorySize64 }
    [System.IO.File]::AppendAllText($OutputPath, ($sample | ConvertTo-Json -Compress) + [Environment]::NewLine)
    Start-Sleep -Seconds 1
}
