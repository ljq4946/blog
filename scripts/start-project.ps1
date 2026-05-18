param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$MysqlName = "blog-dev-mysql"
$MysqlPassword = "root-password"
$AdminUrl = "http://127.0.0.1:5173/admin"
$WebUrl = "http://127.0.0.1:5174/posts"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-Port([int]$Port) {
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne(1000)) {
      return $false
    }
    $client.EndConnect($async)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Wait-Port([int]$Port, [string]$Name, [int]$TimeoutSeconds = 120) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-Port $Port) {
      Write-Host "$Name is ready: http://127.0.0.1:$Port" -ForegroundColor Green
      return
    }
    Start-Sleep -Seconds 2
  }
  throw "$Name timed out. Check the service window for logs."
}

function Wait-Docker([int]$TimeoutSeconds = 120) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    & docker info *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Host "Docker is ready." -ForegroundColor Green
      return
    }
    Start-Sleep -Seconds 3
  }
  throw "Docker Desktop did not become ready in time."
}

Write-Step "Check Docker"
& docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker is not ready. Starting Docker Desktop..."
  & docker desktop start
}
Wait-Docker

Write-Step "Start MySQL"
$containerNames = & docker ps -a --format "{{.Names}}"
if ($containerNames -contains $MysqlName) {
  & docker start $MysqlName | Out-Null
} else {
  & docker run -d --name $MysqlName `
    -e MYSQL_DATABASE=blog `
    -e MYSQL_USER=blog `
    -e MYSQL_PASSWORD=blog `
    -e MYSQL_ROOT_PASSWORD=$MysqlPassword `
    -p 3306:3306 `
    mysql:8.0 | Out-Null
}

$deadline = (Get-Date).AddMinutes(2)
while ((Get-Date) -lt $deadline) {
  & cmd.exe /c "docker exec $MysqlName mysqladmin ping -h localhost -uroot -p$MysqlPassword >nul 2>nul"
  if ($LASTEXITCODE -eq 0) {
    Write-Host "MySQL is ready: localhost:3306" -ForegroundColor Green
    break
  }
  Start-Sleep -Seconds 3
}
if ((Get-Date) -ge $deadline) {
  throw "MySQL timed out. Check Docker container $MysqlName."
}

Write-Step "Start backend"
if (Test-Port 8080) {
  Write-Host "Backend is already running on port 8080. Skipping." -ForegroundColor Yellow
} else {
  Start-Process -FilePath (Join-Path $PSScriptRoot "run-backend.cmd") -WindowStyle Minimized
}

Write-Step "Start admin"
if (Test-Port 5173) {
  Write-Host "Admin is already running on port 5173. Skipping." -ForegroundColor Yellow
} else {
  Start-Process -FilePath (Join-Path $PSScriptRoot "run-admin.cmd") -WindowStyle Minimized
}

Write-Step "Start web"
if (Test-Port 5174) {
  Write-Host "Web is already running on port 5174. Skipping." -ForegroundColor Yellow
} else {
  Start-Process -FilePath (Join-Path $PSScriptRoot "run-web.cmd") -WindowStyle Minimized
}

Write-Step "Wait for ports"
Wait-Port 8080 "Backend"
Wait-Port 5173 "Admin"
Wait-Port 5174 "Web"

if (-not $NoBrowser) {
  Write-Step "Open browser"
  Start-Process $WebUrl
  Start-Process $AdminUrl
}

Write-Host ""
Write-Host "Project is running." -ForegroundColor Green
Write-Host "Web: $WebUrl"
Write-Host "Admin: $AdminUrl"
Write-Host "Backend: http://localhost:8080"
Write-Host "Admin login: 4946 / 541312"
