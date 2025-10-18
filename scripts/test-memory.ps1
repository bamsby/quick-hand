# Memory Integration Test Runner for Windows
# This script sets up and runs Playwright tests for mem0.ai memory integration

Write-Host "🧠 QuickHand Memory Integration Test Runner" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if required tools are installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    exit 1
}

if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js and npm are available" -ForegroundColor Green

# Check if Playwright is installed
try {
    npx playwright --version | Out-Null
    Write-Host "✅ Playwright is ready" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Playwright..." -ForegroundColor Yellow
    npm install @playwright/test
    npx playwright install
}

# Check if app is running
Write-Host "🌐 Checking if app is running on localhost:8081..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ App is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  App is not running. Please start it with 'npm start'" -ForegroundColor Yellow
    Write-Host "Then press Enter to continue..." -ForegroundColor Yellow
    Read-Host
}

# Check environment variables
Write-Host "🔧 Checking environment setup..." -ForegroundColor Yellow

if (-not $env:MEM0_API_KEY) {
    Write-Host "⚠️  MEM0_API_KEY not set in environment" -ForegroundColor Yellow
    Write-Host "Make sure to set it in your Supabase Edge Function secrets" -ForegroundColor Yellow
}

Write-Host "🚀 Running memory integration tests..." -ForegroundColor Cyan

# Run the tests
npx playwright test tests/memory-integration.spec.ts --reporter=html

# Check test results
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All memory integration tests passed!" -ForegroundColor Green
    Write-Host "📊 View detailed results: npx playwright show-report" -ForegroundColor Cyan
} else {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    Write-Host "📊 View detailed results: npx playwright show-report" -ForegroundColor Cyan
    Write-Host "🐛 Debug with: npx playwright test tests/memory-integration.spec.ts --debug" -ForegroundColor Cyan
}

Write-Host "🏁 Test run complete" -ForegroundColor Cyan
