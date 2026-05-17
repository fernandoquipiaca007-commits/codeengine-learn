# 🚀 Push All Branches - CodeEngine Multi-Repo
# Este script faz push das branches main e develop de todos os 3 repositórios

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PUSH ALL BRANCHES - MULTI REPO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$hasErrors = $false

function Push-AllBranches {
    param(
        [string]$Path,
        [string]$Name
    )
    
    Write-Host "Repository: $Name" -ForegroundColor Yellow
    Write-Host "Directory: $Path" -ForegroundColor Gray
    
    if (Test-Path $Path) {
        Push-Location $Path
        
        # Verificar remote
        $remote = git remote get-url origin 2>$null
        if ($remote) {
            Write-Host "Remote: $remote" -ForegroundColor Cyan
            
            # Push main
            Write-Host "Pushing main..." -ForegroundColor Cyan
            git checkout main 2>$null
            git push -u origin main
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  main pushed successfully" -ForegroundColor Green
            } else {
                Write-Host "  Error pushing main" -ForegroundColor Red
                $script:hasErrors = $true
            }
            
            # Push develop
            Write-Host "Pushing develop..." -ForegroundColor Cyan
            git checkout develop 2>$null
            git push -u origin develop
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  develop pushed successfully" -ForegroundColor Green
            } else {
                Write-Host "  Error pushing develop" -ForegroundColor Red
                $script:hasErrors = $true
            }
            
            # Voltar para main
            git checkout main 2>$null
            
        } else {
            Write-Host "No remote configured!" -ForegroundColor Red
            $script:hasErrors = $true
        }
        
        Pop-Location
    } else {
        Write-Host "Directory not found!" -ForegroundColor Red
        $script:hasErrors = $true
    }
    
    Write-Host ""
}

# Push dos 3 repositórios
Push-AllBranches -Path "c:\Users\Dell\Documents\codeengine1.2" -Name "codeengine-learn (Frontend)"
Push-AllBranches -Path "c:\Users\Dell\Documents\codeengine1.2\admin" -Name "codeengine-admin (Admin Panel)"
Push-AllBranches -Path "c:\Users\Dell\Documents\codeengine1.2\backend" -Name "codeengine-api (Backend)"

Write-Host "========================================" -ForegroundColor Cyan
if ($hasErrors) {
    Write-Host "Completed with errors" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure the GitHub repos exist" -ForegroundColor Gray
    Write-Host "2. Check your authentication (use Personal Access Token)" -ForegroundColor Gray
    Write-Host "3. Verify remote URLs are correct" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "All branches pushed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Configure branch protection on GitHub" -ForegroundColor Gray
    Write-Host "2. Set up CI/CD workflows" -ForegroundColor Gray
    Write-Host "3. Add collaborators if needed" -ForegroundColor Gray
    exit 0
}
