#!/bin/bash

# Memory Integration Test Runner
# This script sets up and runs Playwright tests for mem0.ai memory integration

echo "🧠 QuickHand Memory Integration Test Runner"
echo "=========================================="

# Check if required tools are installed
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ Node.js and npm are available"

# Check if Playwright is installed
if ! npx playwright --version &> /dev/null; then
    echo "📦 Installing Playwright..."
    npm install @playwright/test
    npx playwright install
fi

echo "✅ Playwright is ready"

# Check if app is running
echo "🌐 Checking if app is running on localhost:8081..."
if curl -s http://localhost:8081 > /dev/null; then
    echo "✅ App is running"
else
    echo "⚠️  App is not running. Starting Expo..."
    echo "Please run 'npm start' in another terminal and wait for the app to load"
    echo "Then press Enter to continue..."
    read -r
fi

# Check environment variables
echo "🔧 Checking environment setup..."

if [ -z "$MEM0_API_KEY" ]; then
    echo "⚠️  MEM0_API_KEY not set in environment"
    echo "Make sure to set it in your Supabase Edge Function secrets"
fi

echo "🚀 Running memory integration tests..."

# Run the tests
npx playwright test tests/memory-integration.spec.ts --reporter=html

# Check test results
if [ $? -eq 0 ]; then
    echo "✅ All memory integration tests passed!"
    echo "📊 View detailed results: npx playwright show-report"
else
    echo "❌ Some tests failed"
    echo "📊 View detailed results: npx playwright show-report"
    echo "🐛 Debug with: npx playwright test tests/memory-integration.spec.ts --debug"
fi

echo "🏁 Test run complete"
