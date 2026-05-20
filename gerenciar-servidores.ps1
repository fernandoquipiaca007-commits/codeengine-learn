# Script para gerenciar os servidores CodeEngine
# Uso: .\gerenciar-servidores.ps1 [start|stop|status]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "status")]
    [string]$Action = "status"
)

$baseDir = $PSScriptRoot

function Start-Servers {
    Write-Host "========================================"
    Write-Host "  INICIANDO SERVIDORES"
    Write-Host "========================================"
    Write-Host ""
    
    Write-Host "Iniciando Backend (porta 3000)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\backend'; npm run dev"
    Start-Sleep -Seconds 2
    
    Write-Host "Iniciando Frontend (porta 3000)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir'; npm run dev"
    Start-Sleep -Seconds 2
    
    Write-Host "Iniciando Admin (porta 5174)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\admin'; npm run dev"
    
    Write-Host ""
    Write-Host "Servidores iniciados em janelas separadas!" -ForegroundColor Green
    Write-Host ""
    Write-Host "URLs de acesso:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:3000"
    Write-Host "  Admin:    http://localhost:5174"
    Write-Host "  Backend:  http://localhost:3000"
    Write-Host ""
}

function Stop-Servers {
    Write-Host "========================================"
    Write-Host "  PARANDO SERVIDORES"
    Write-Host "========================================"
    Write-Host ""
    
    Write-Host "Parando processos Node.js..." -ForegroundColor Yellow
    Get-Process node -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*$baseDir*"
    } | Stop-Process -Force
    
    Write-Host "Servidores parados!" -ForegroundColor Green
    Write-Host ""
}

function Show-Status {
    Write-Host "========================================"
    Write-Host "  STATUS DOS SERVIDORES"
    Write-Host "========================================"
    Write-Host ""
    
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    
    if ($nodeProcesses) {
        Write-Host "Processos Node.js em execucao:" -ForegroundColor Green
        $nodeProcesses | Format-Table Id, ProcessName, CPU, WorkingSet -AutoSize
    } else {
        Write-Host "Nenhum processo Node.js em execucao" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Testando portas..." -ForegroundColor Cyan
    
    # Testar porta 3000
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "  Porta 3000: ONLINE" -ForegroundColor Green
    } catch {
        Write-Host "  Porta 3000: OFFLINE" -ForegroundColor Red
    }
    
    # Testar porta 5174
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "  Porta 5174: ONLINE" -ForegroundColor Green
    } catch {
        Write-Host "  Porta 5174: OFFLINE" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Executar acao
switch ($Action) {
    "start" { Start-Servers }
    "stop" { Stop-Servers }
    "status" { Show-Status }
}

Write-Host "========================================"
Write-Host ""
