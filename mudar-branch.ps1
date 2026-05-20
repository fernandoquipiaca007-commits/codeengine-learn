# Script para mudar a branch em todos os repositorios
# Uso: .\mudar-branch.ps1 nome-da-branch

param(
    [Parameter(Mandatory=$true)]
    [string]$BranchName
)

Write-Host "========================================"
Write-Host "  MUDANDO PARA BRANCH: $BranchName"
Write-Host "========================================"
Write-Host ""

# Frontend
Write-Host "FRONTEND (codeengine-learn)" -ForegroundColor Yellow
Set-Location $PSScriptRoot
git checkout $BranchName
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Branch alterada com sucesso" -ForegroundColor Green
} else {
    Write-Host "  ERRO - Falha ao mudar branch" -ForegroundColor Red
}
Write-Host ""

# Admin
Write-Host "ADMIN (codeengine-admin)" -ForegroundColor Yellow
Set-Location "$PSScriptRoot\admin"
git checkout $BranchName
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Branch alterada com sucesso" -ForegroundColor Green
} else {
    Write-Host "  ERRO - Falha ao mudar branch" -ForegroundColor Red
}
Write-Host ""

# Backend
Write-Host "BACKEND (codeengine-api)" -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
git checkout $BranchName
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Branch alterada com sucesso" -ForegroundColor Green
} else {
    Write-Host "  ERRO - Falha ao mudar branch" -ForegroundColor Red
}
Write-Host ""

Set-Location $PSScriptRoot
Write-Host "========================================"
Write-Host "  OPERACAO CONCLUIDA"
Write-Host "========================================"
Write-Host ""
Write-Host "Executando verificacao..." -ForegroundColor Cyan
Write-Host ""

# Executar verificacao
.\verificar-repos.ps1
