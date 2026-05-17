# Push All CodeEngine Repositories

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CODEENGINE PUSH ALL REPOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$hasErrors = $false

function Push-Repository {
    param(
        [string]$Path,
        [string]$Name
    )
    
    Write-Host "Processing: $Name" -ForegroundColor Yellow
    Write-Host "Directory: $Path" -ForegroundColor Gray
    
    if (Test-Path $Path) {
        Push-Location $Path
        
        $status = git status --porcelain
        
        if ($status) {
            Write-Host "Changes detected" -ForegroundColor Green
            
            git add .
            
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            git commit -m "chore: update $timestamp"
            
            Write-Host "Pushing..." -ForegroundColor Cyan
            git push
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Push completed successfully!" -ForegroundColor Green
            } else {
                Write-Host "Error pushing" -ForegroundColor Red
                $script:hasErrors = $true
            }
        } else {
            Write-Host "No changes to commit" -ForegroundColor Gray
        }
        
        Pop-Location
    } else {
        Write-Host "Directory not found!" -ForegroundColor Red
        $script:hasErrors = $true
    }
    
    Write-Host ""
}

Push-Repository -Path "c:\Users\Dell\Documents\codeengine1.2" -Name "codeengine-learn (Frontend)"
Push-Repository -Path "c:\Users\Dell\Documents\codeengine1.2\admin" -Name "codeengine-admin (Admin Panel)"
Push-Repository -Path "c:\Users\Dell\Documents\codeengine1.2\backend" -Name "codeengine-api (Backend)"

Write-Host "========================================" -ForegroundColor Cyan
if ($hasErrors) {
    Write-Host "Completed with errors" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "All repositories updated!" -ForegroundColor Green
    exit 0
}
