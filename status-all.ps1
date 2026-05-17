# Check Status of All CodeEngine Repositories

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CODEENGINE STATUS ALL REPOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Check-Repository {
    param(
        [string]$Path,
        [string]$Name
    )
    
    Write-Host "Repository: $Name" -ForegroundColor Yellow
    Write-Host "Directory: $Path" -ForegroundColor Gray
    
    if (Test-Path $Path) {
        Push-Location $Path
        
        $branch = git branch --show-current
        Write-Host "Branch: $branch" -ForegroundColor Cyan
        
        $remote = git remote get-url origin
        Write-Host "Remote: $remote" -ForegroundColor Cyan
        
        $status = git status --porcelain
        if ($status) {
            $changes = ($status | Measure-Object).Count
            Write-Host "Status: $changes file(s) modified" -ForegroundColor Yellow
            
            Write-Host "Files:" -ForegroundColor Gray
            git status --short | ForEach-Object {
                Write-Host "  $_" -ForegroundColor Gray
            }
        } else {
            Write-Host "Status: Clean (no changes)" -ForegroundColor Green
        }
        
        $unpushed = git log origin/$branch..$branch --oneline 2>$null
        if ($unpushed) {
            $count = ($unpushed | Measure-Object).Count
            Write-Host "Unpushed commits: $count" -ForegroundColor Yellow
        } else {
            Write-Host "Commits: Synced with origin" -ForegroundColor Green
        }
        
        Pop-Location
    } else {
        Write-Host "Directory not found!" -ForegroundColor Red
    }
    
    Write-Host ""
}

Check-Repository -Path "c:\Users\Dell\Documents\codeengine1.2" -Name "codeengine-learn (Frontend)"
Check-Repository -Path "c:\Users\Dell\Documents\codeengine1.2\admin" -Name "codeengine-admin (Admin Panel)"
Check-Repository -Path "c:\Users\Dell\Documents\codeengine1.2\backend" -Name "codeengine-api (Backend)"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification complete!" -ForegroundColor Green
