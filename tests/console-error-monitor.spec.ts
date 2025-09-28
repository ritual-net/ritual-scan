/**
 * Console Error Monitoring Test
 * Specifically designed to catch and analyze the 19+ console errors
 */

import { test, expect, Page } from '@playwright/test'

interface ErrorReport {
  page: string
  consoleErrors: string[]
  webSocketErrors: string[]
  networkErrors: string[]
  performanceMetrics: any
  screenshots: string[]
}

test.describe('Console Error Analysis - Systematic Debugging', () => {
  let errorReport: ErrorReport[] = []

  const PAGES_TO_TEST = [
    { name: 'Home', url: '/' },
    { name: 'Blocks', url: '/blocks' },
    { name: 'Transactions', url: '/transactions' },
    { name: 'Mempool', url: '/mempool' },
    { name: 'Scheduled', url: '/scheduled' },
    { name: 'Async', url: '/async' },
    { name: 'Analytics', url: '/analytics' },
    { name: 'Gas Tracker', url: '/gas-tracker' },
    { name: 'Settings', url: '/settings' }
  ]

  test('🔍 Comprehensive Console Error Analysis', async ({ page }) => {
    console.log('\n🤖 Starting systematic console error analysis...\n')

    for (const pageInfo of PAGES_TO_TEST) {
      console.log(`\n📊 Testing: ${pageInfo.name} (${pageInfo.url})`)
      
      const pageErrors: string[] = []
      const wsErrors: string[] = []
      const netErrors: string[] = []
      
      // Monitor console messages
      page.on('console', msg => {
        const text = msg.text()
        const type = msg.type()
        
        if (msg.type() === 'error') {
          pageErrors.push(`[${type.toUpperCase()}] ${text}`)
          console.log(`❌ Console Error: ${text}`)
        } else if (text.includes('WebSocket') && type === 'error') {
          wsErrors.push(`[WS_ERROR] ${text}`)
          console.log(`🔌 WebSocket Error: ${text}`)
        } else if (text.includes('Failed to fetch') || text.includes('NetworkError')) {
          netErrors.push(`[NETWORK] ${text}`)
          console.log(`🌐 Network Error: ${text}`)
        } else if (text.includes('WebSocket') || text.includes('🔗') || text.includes('📡')) {
          console.log(`🔌 WebSocket Info: ${text}`)
        }
      })

      // Monitor network failures
      page.on('response', response => {
        if (!response.ok()) {
          const error = `${response.status()} ${response.url()}`
          netErrors.push(error)
          console.log(`🌐 Network Failure: ${error}`)
        }
      })

      // Navigate to page
      const startTime = Date.now()
      await page.goto(`http://localhost:3000${pageInfo.url}`)
      
      // Wait for initial load
      await page.waitForLoadState('networkidle')
      
      // Wait for WebSocket connections and real-time updates
      await page.waitForTimeout(5000)
      
      const loadTime = Date.now() - startTime
      
      // Take screenshot if there are errors
      const screenshotPath = `test-results/console-errors-${pageInfo.name.toLowerCase()}.png`
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      })

      // Performance metrics
      const performanceMetrics = await page.evaluate(() => {
        return {
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
          memoryUsed: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0
        }
      })

      // Compile report for this page
      const report: ErrorReport = {
        page: pageInfo.name,
        consoleErrors: pageErrors,
        webSocketErrors: wsErrors,
        networkErrors: netErrors,
        performanceMetrics: { ...performanceMetrics, loadTime },
        screenshots: [screenshotPath]
      }

      errorReport.push(report)

      // Print immediate results
      console.log(`⏱️  Load Time: ${loadTime}ms`)
      console.log(`❌ Console Errors: ${pageErrors.length}`)
      console.log(`🔌 WebSocket Errors: ${wsErrors.length}`)
      console.log(`🌐 Network Errors: ${netErrors.length}`)
      
      if (pageErrors.length === 0) {
        console.log(`✅ ${pageInfo.name}: No console errors detected!`)
      } else {
        console.log(`🔍 ${pageInfo.name}: ${pageErrors.length} errors need investigation`)
      }

      // Clear listeners for next page
      page.removeAllListeners('console')
      page.removeAllListeners('response')
    }

    // Generate comprehensive report
    console.log('\n📊 FINAL CONSOLE ERROR ANALYSIS REPORT\n')
    console.log('═'.repeat(80))
    
    let totalErrors = 0
    errorReport.forEach(report => {
      totalErrors += report.consoleErrors.length
      console.log(`\n📄 ${report.page}:`)
      console.log(`   Console Errors: ${report.consoleErrors.length}`)
      console.log(`   WebSocket Errors: ${report.webSocketErrors.length}`)
      console.log(`   Network Errors: ${report.networkErrors.length}`)
      console.log(`   Load Time: ${report.performanceMetrics.loadTime}ms`)
      
      if (report.consoleErrors.length > 0) {
        console.log(`   Error Details:`)
        report.consoleErrors.forEach(error => {
          console.log(`     - ${error}`)
        })
      }
    })

    console.log('\n═'.repeat(80))
    console.log(`🎯 TOTAL CONSOLE ERRORS FOUND: ${totalErrors}`)
    console.log(`📊 PAGES TESTED: ${errorReport.length}`)
    console.log(`📸 SCREENSHOTS SAVED: test-results/`)
    console.log('═'.repeat(80))

    // Test assertions
    if (totalErrors === 0) {
      console.log('🎉 SUCCESS: No console errors detected!')
    } else if (totalErrors < 10) {
      console.log('⚠️  WARNING: Some console errors detected, but within acceptable range')
    } else {
      console.log('❌ CRITICAL: High number of console errors detected')
    }

    // Allow up to 5 total console errors across all pages
    expect(totalErrors).toBeLessThan(6)
  })

  test('🔌 WebSocket Connection Health Check', async ({ page }) => {
    console.log('\n🔍 Testing WebSocket connection health...')

    const wsMessages: string[] = []
    let wsConnected = false
    let wsErrors = 0

    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('WebSocket')) {
        wsMessages.push(text)
        if (text.includes('connected') || text.includes('✅')) {
          wsConnected = true
        }
        if (text.includes('error') || text.includes('❌')) {
          wsErrors++
        }
      }
    })

    // Test WebSocket on blocks page (most likely to have WebSocket activity)
    await page.goto('http://localhost:3000/blocks')
    await page.waitForTimeout(10000) // Wait 10 seconds for WebSocket activity

    console.log(`🔌 WebSocket Messages Captured: ${wsMessages.length}`)
    console.log(`✅ WebSocket Connected: ${wsConnected}`)
    console.log(`❌ WebSocket Errors: ${wsErrors}`)

    wsMessages.forEach(msg => {
      console.log(`   📡 ${msg}`)
    })

    // Expect WebSocket to connect with minimal errors
    expect(wsErrors).toBeLessThan(3)
    if (wsMessages.length > 0) {
      expect(wsConnected).toBeTruthy()
    }
  })
})
