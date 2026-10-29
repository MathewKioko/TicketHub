$ErrorActionPreference = 'Stop'

$dir = 'C:\Users\ZBOOK\Documents\TicketHub'
$log   = Join-Path $dir 'dev.log'
$err   = Join-Path $dir 'dev_err.log'
$script = 'cd /d "' + $dir + '" && tsx.cmd watch server.ts'

$proc = Start-Process -FilePath 'cmd' -ArgumentList $script -RedirectStandardOutput $log -RedirectStandardError $err -PassThru

Write-Output ('started pid{0}' -f $proc.Id)
Write-Output ('log: {0}' -f $log)
Write-Output ('waiting...  (pid{0})' -f $proc.Id)
