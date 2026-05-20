# ============================================
# START STRIPE SYSTEM
# ============================================
# PowerShell script to start all services

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   CODEENGINE LEARN - STRIPE SYSTEM    ║" -ForegroundColor Cyan
Write-Host "║   Starting All Services...             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  WARNING: .env.local not found!" -ForegroundColor Yellow
    Write-Host "   Please copy .env.stripe.example to .env.local" -ForegroundColor Yellow
    Write-Host "   and configure your Stripe keys." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if node_modules exists in backend
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Start Backend API Server
Write-Host "🚀 Starting Backend API Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
Start-Sleep -Seconds 2

# Start Admin Dashboard
Write-Host "🎨 Starting Admin Dashboard..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd admin; npm run dev"
Start-Sleep -Seconds 2

# Start Store Frontend
Write-Host "🛍️  Starting Store Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ALL SERVICES STARTED!                ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║   Backend API:  http://localhost:3041  ║" -ForegroundColor White
Write-Host "║   Admin Panel:  http://localhost:5180  ║" -ForegroundColor White
Write-Host "║   Store:        http://localhost:3040  ║" -ForegroundColor White
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Execute SQL schemas in Supabase" -ForegroundColor White
Write-Host "   2. Configure Stripe webhook" -ForegroundColor White
Write-Host "   3. Create a test product in Admin" -ForegroundColor White
Write-Host "   4. Test checkout in Store" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: STRIPE_INTEGRATION_COMPLETE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
