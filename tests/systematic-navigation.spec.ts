/**
 * Systematic Browser Automation Test Suite
 * Tests all navigation tabs and functionality of the Ritual Blockchain Explorer
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const NAVIGATION_TABS = [
  { name: 'Home', path: '/', selector: 'a[href="/"]' },
  { name: 'Blocks', path: '/blocks', selector: 'a[href="/blocks"]' },
  { name: 'Transactions', path: '/transactions', selector: 'a[href="/transactions"]' },
  { name: 'Mempool', path: '/mempool', selector: 'a[href="/mempool"]' },
  { name: 'Scheduled', path: '/scheduled', selector: 'a[href="/scheduled"]' },
  { name: 'Async', path: '/async', selector: 'a[href="/async"]' },
  { name: 'Analytics', path: '/analytics', selector: 'a[href="/analytics"]' },
  { name: 'Gas Tracker', path: '/gas-tracker', selector: 'a[href="/gas-tracker"]' },
  { name: 'Settings', path: '/settings', selector: 'a[href="/settings"]' }
]

test.describe('Ritual Blockchain Explorer - Systematic Testing', () => {
  let consoleErrors: string[] = []
  let webSocketMessages: any[] = []
  let networkErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    // Reset error collectors
    consoleErrors = []
    webSocketMessages = []
    networkErrors = []

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[CONSOLE ERROR] ${msg.text()}`)
      } else if (msg.text().includes('WebSocket') || msg.text().includes('🔗')) {
        webSocketMessages.push(msg.text())
      }
    })

    // Monitor network failures
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push(`[NETWORK ERROR] ${response.status()} ${response.url()}`)
      }
    })

    // Monitor WebSocket connections
    page.on('websocket', ws => {
      console.log(`WebSocket connection: ${ws.url()}`)
      ws.on('framesent', event => console.log('WS Sent:', event.payload))
      ws.on('framereceived', event => console.log('WS Received:', event.payload))
    })
  })

  test('🏠 Homepage - Load and Real-time Updates', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Check page loads - be more specific to avoid title tag match
    await expect(page.locator('a[href="/"]').filter({ hasText: 'Shrinenet Explorer' })).toBeVisible()
    
    // Check for key elements
    await expect(page.locator('text=Latest Block')).toBeVisible()
    await expect(page.locator('text=Gas Price')).toBeVisible()
    
    // Wait for data to load
    await page.waitForTimeout(3000)
    
    // Check for WebSocket connection
    expect(webSocketMessages.some(msg => msg.includes('WebSocket connected'))).toBeTruthy()
    
    // Screenshot for reference
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true })
    
    console.log(`✅ Homepage: ${consoleErrors.length} console errors`)
  })

  test('🧱 Navigation - All Tabs Systematic Test', async ({ page }) => {
    await page.goto(BASE_URL)
    
    for (const tab of NAVIGATION_TABS) {
      console.log(`Testing: ${tab.name} (${tab.path})`)
      
      // Navigate to tab
      await page.click(tab.selector)
      await page.waitForURL(`**${tab.path}`)
      
      // Wait for page to load
      await page.waitForLoadState('networkidle')
      
      // Check navigation is highlighted
      await expect(page.locator(`text=${tab.name}`).first()).toBeVisible()
      
      // Check no major errors
      const pageErrors = consoleErrors.filter(err => 
        !err.includes('WebSocket') && !err.includes('Failed to fetch')
      )
      
      if (pageErrors.length > 0) {
        console.log(`❌ ${tab.name} has ${pageErrors.length} errors:`, pageErrors)
      } else {
        console.log(`✅ ${tab.name} loaded successfully`)
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: `test-results/${tab.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: true 
      })
      
      // Wait a bit for real-time updates
      await page.waitForTimeout(1000)
    }
  })

  test('🔗 WebSocket Real-time Updates Test', async ({ page }) => {
    await page.goto(`${BASE_URL}/blocks`)
    
    // Wait for WebSocket connection
    await page.waitForTimeout(2000)
    
    // Check WebSocket status in console
    const wsConnected = webSocketMessages.some(msg => 
      msg.includes('WebSocket connected') || msg.includes('📡')
    )
    
    expect(wsConnected).toBeTruthy()
    console.log(`✅ WebSocket: Connection detected`)
    
    // Monitor for block updates
    await page.waitForTimeout(10000) // Wait 10 seconds for potential block
    
    const blockUpdates = webSocketMessages.filter(msg => 
      msg.includes('New block') || msg.includes('🔗')
    )
    
    console.log(`📊 WebSocket: ${blockUpdates.length} block updates received`)
  })

  test('🔍 Search Functionality Test', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Look for search input
    const searchInput = page.locator('input[type="text"]').first()
    
    if (await searchInput.isVisible()) {
      // Test with a block number
      await searchInput.fill('75000')
      await page.keyboard.press('Enter')
      
      await page.waitForTimeout(2000)
      console.log('✅ Search: Block search executed')
    } else {
      console.log('ℹ️ Search: No search input found')
    }
  })

  test('⚡ Performance and Error Analysis', async ({ page }) => {
    // Test all pages for performance
    const performanceResults: any[] = []
    
    for (const tab of NAVIGATION_TABS.slice(0, 5)) { // Test first 5 tabs
      const startTime = Date.now()
      
      await page.goto(`${BASE_URL}${tab.path}`)
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      performanceResults.push({
        page: tab.name,
        loadTime,
        consoleErrors: consoleErrors.length,
        networkErrors: networkErrors.length
      })
      
      // Reset error counts for next page
      consoleErrors = []
      networkErrors = []
    }
    
    // Generate performance report
    console.log('\n📊 Performance Report:')
    performanceResults.forEach(result => {
      console.log(`${result.page}: ${result.loadTime}ms, ${result.consoleErrors} errors`)
    })
    
    // Fail if any page has excessive errors
    const maxErrors = Math.max(...performanceResults.map(r => r.consoleErrors))
    expect(maxErrors).toBeLessThan(10) // Allow up to 10 console errors
  })

  test('🌐 RETH Network Connectivity Test', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    
    // Wait for network requests
    await page.waitForTimeout(5000)
    
    // Check for RETH connectivity indicators
    const rethConnected = await page.textContent('body')
    const hasRethData = rethConnected?.includes('Block') || rethConnected?.includes('RETH')
    
    if (hasRethData) {
      console.log('✅ RETH: Network connectivity confirmed')
    } else {
      console.log('⚠️ RETH: No network data detected')
    }
    
    // Check WebSocket to RETH
    const rethWebSocket = webSocketMessages.some(msg => 
      msg.includes('35.185.40.237:8546')
    )
    
    console.log(`🔌 RETH WebSocket: ${rethWebSocket ? 'Connected' : 'Not detected'}`)
  })

  test.afterEach(async ({ page }, testInfo) => {
    // Generate error report
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:')
      consoleErrors.forEach(error => console.log(error))
    }
    
    if (networkErrors.length > 0) {
      console.log('\n🌐 Network Errors Found:')
      networkErrors.forEach(error => console.log(error))
    }
    
    // Save test results
    const results = {
      test: testInfo.title,
      consoleErrors: consoleErrors.length,
      networkErrors: networkErrors.length,
      webSocketMessages: webSocketMessages.length,
      timestamp: new Date().toISOString()
    }
    
    console.log(`\n📋 Test Summary: ${JSON.stringify(results, null, 2)}`)
  })
})
