#!/bin/bash

# Comprehensive Testing Setup Script
# Installs and configures all browser automation tools

set -e

echo "🤖 Setting up comprehensive browser testing environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Installing testing dependencies...${NC}"

# Install Playwright
npm install --save-dev @playwright/test playwright

echo -e "${BLUE}🌐 Installing browser binaries...${NC}"

# Install browser binaries
npx playwright install --with-deps

echo -e "${BLUE}🎭 Browser Testing Tools Comparison:${NC}"
echo ""
echo "✅ PLAYWRIGHT (Primary) - Cross-browser, real-time monitoring"
echo "   - Chrome, Firefox, Safari support"
echo "   - WebSocket monitoring"  
echo "   - Console error capture"
echo "   - Performance metrics"
echo "   - Screenshot/video capture"
echo ""
echo "🔧 PUPPETEER (Available) - Chrome-focused automation"
echo "🌲 CYPRESS (Alternative) - Developer-friendly testing"
echo "🔮 SELENIUM (Traditional) - Cross-platform standard"
echo ""

# Create test results directory
mkdir -p test-results

echo -e "${GREEN}✅ Testing setup complete!${NC}"
echo ""
echo -e "${YELLOW}🚀 Quick Start Commands:${NC}"
echo ""
echo -e "${BLUE}make test-systematic${NC}     # Run complete test suite"
echo -e "${BLUE}make test-console-errors${NC} # Analyze console errors specifically" 
echo -e "${BLUE}make test-visual${NC}         # Run tests with visible browser"
echo -e "${BLUE}make test-ui${NC}             # Interactive Playwright UI"
echo -e "${BLUE}make test-debug${NC}          # Step-by-step debugging"
echo ""
echo -e "${YELLOW}📊 Advanced Testing:${NC}"
echo ""
echo -e "${BLUE}make test-websocket${NC}      # Test WebSocket functionality"
echo -e "${BLUE}make test-performance${NC}    # Performance analysis"
echo -e "${BLUE}make test-mobile${NC}         # Mobile responsiveness"
echo -e "${BLUE}make test-browsers${NC}       # Cross-browser testing"
echo -e "${BLUE}make test-reth${NC}           # RETH network connectivity"
echo ""
echo -e "${GREEN}🎯 Ready to systematically debug your 19 console errors!${NC}"
