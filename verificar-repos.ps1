# Script para verificar o status de todos os repositorios CodeEngine
# Uso: .\verificar-repos.ps1

Write-Host "========================================"
Write-Host "  VERIFICACAO DOS REPOSITORIOS"
Write-Host "========================================"
Write-Host ""

# Frontend
Write-Host "FRONTEND (codeengine-learn)" -ForegroundColor Yellow
Set-Location $PSScriptRoot
git status
Write-Host ""

# Admin
Write-Host "ADMIN (codeengine-admin)" -ForegroundColor Yellow
Set-Location "$PSScriptRoot\admin"
git status
Write-Host ""

# Backend
Write-Host "BACKEND (codeengine-api)" -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
git status
Write-Host ""

Set-Location $PSScriptRoot
Write-Host "========================================"
Write-Host "  VERIFICACAO CONCLUIDA"
Write-Host "========================================"
