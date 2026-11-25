param([int]$TargetProcessId, [string]$OutputPath, [string]$ProcessName = 'k6')
$ErrorActionPreference = 'Stop'
while ($true) {
    $targetProcess = Get-Process -Id $TargetProcessId -ErrorAction SilentlyContinue
    if (-not $targetProcess) { break }
    $sample = @{ utc = [DateTime]::UtcNow.ToString('o'); process = $ProcessName; pid = $TargetProcessId; cpuSeconds = $targetProcess.CPU; workingSetBytes = $targetProcess.WorkingSet64; privateBytes = $targetProcess.PrivateMemorySize64 }
    [System.IO.File]::AppendAllText($OutputPath, ($sample | ConvertTo-Json -Compress) + [Environment]::NewLine)
    Start-Sleep -Seconds 1
}
