'use client'

import { useState, useEffect } from 'react'
import { rethClient } from '@/lib/reth-client'
import { Navigation } from '@/components/Navigation'
import { getRealtimeManager } from '@/lib/realtime-websocket'
import Link from 'next/link'

interface GasData {
  current: number
  slow: number
  standard: number
  fast: number
  instant: number
  timestamp: number
}

interface GasHistory {
  timestamp: number
  gasPrice: number
  blockNumber: number
}

export default function GasTrackerPage() {
  const [gasData, setGasData] = useState<GasData | null>(null)
  const [gasHistory, setGasHistory] = useState<GasHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recommendation, setRecommendation] = useState<string>('standard')
  useEffect(() => {
    loadGasData()
    loadGasHistory()

    // Set up real-time updates using the enhanced WebSocket manager
    const realtimeManager = getRealtimeManager()
    const unsubscribe = realtimeManager?.subscribe('gas-tracker', (update) => {
      if (update.type === 'newBlock') {
        console.log(' [Gas Tracker] New block for gas price update:', update.data)
        loadGasData() // Reload gas data when new block arrives
      }
    })

    const interval = setInterval(() => {
      loadGasData()
    }, 30000)

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      clearInterval(interval)
    }
  }, [])

  const updateGasHistory = async (blockData: any) => {
    try {
      const blockNumber = parseInt(blockData.number, 16)
      const currentGas = await rethClient.getGasPrice()
      const timestamp = Date.now()

      const newEntry: GasHistory = {
        timestamp,
        gasPrice: parseFloat(currentGas),
        blockNumber
      }

      setGasHistory(prev => {
        const updated = [newEntry, ...prev].slice(0, 100) // Keep last 100 entries
        return updated
      })
    } catch (error) {
      console.error('Error updating gas history:', error)
    }
  }

  const loadGasData = async () => {
    try {
      setLoading(true)
      setError(null)

      const currentGasPrice = await rethClient.getGasPrice()
      const current = parseFloat(currentGasPrice)

      // Calculate different speed tiers based on current price
      const gasData: GasData = {
        current,
        slow: Math.max(1, current * 0.8),     // 20% below current
        standard: current,                     // Current price
        fast: current * 1.2,                  // 20% above current
        instant: current * 1.5,               // 50% above current
        timestamp: Date.now()
      }

      setGasData(gasData)
      
      // Set recommendation based on current gas price
      if (current < 20) {
        setRecommendation('standard')
      } else if (current < 50) {
        setRecommendation('fast')
      } else {
        setRecommendation('instant')
      }

    } catch (error: any) {
      console.error('Error loading gas data:', error)
      setError(error.message || 'Failed to load gas data')
    } finally {
      setLoading(false)
    }
  }

  const loadGasHistory = async () => {
    try {
      // Get recent blocks to build gas history
      const recentBlocks = await rethClient.getRecentBlocks(20)
      const history: GasHistory[] = []

      for (const block of recentBlocks) {
        if (block.gasUsed && block.gasLimit) {
          // Estimate gas price based on block utilization
          const utilization = parseInt(block.gasUsed, 16) / parseInt(block.gasLimit, 16)
          const baseGas = await rethClient.getGasPrice()
          const estimatedGas = parseFloat(baseGas) * (0.5 + utilization)

          history.push({
            timestamp: parseInt(block.timestamp, 16) * 1000,
            gasPrice: estimatedGas,
            blockNumber: parseInt(block.number, 16)
          })
        }
      }

      setGasHistory(history.reverse()) // Oldest first
    } catch (error) {
      console.error('Error loading gas history:', error)
    }
  }

  const getConfirmationTime = (gasPrice: number): string => {
    if (gasPrice >= gasData?.instant!) return '< 15 seconds'
    if (gasPrice >= gasData?.fast!) return '< 1 minute'
    if (gasPrice >= gasData?.standard!) return '< 3 minutes'
    return '< 5 minutes'
  }

  const getGasCost = (gasPrice: number, gasLimit: number = 21000): string => {
    const cost = (gasPrice * gasLimit) / 1e9 // Convert to ETH
    return cost.toFixed(6)
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const GasPriceCard = ({
    type,
    price,
    color,
    isRecommended
  }: {
    type: string
    price: number
    color: string
    isRecommended: boolean
  }) => {
    const colorConfig = {
      green: { text: 'text-green-400', border: 'border-green-500/50 bg-green-900/10', badge: 'bg-green-600' },
      yellow: { text: 'text-yellow-400', border: 'border-yellow-500/50 bg-yellow-900/10', badge: 'bg-yellow-600' },
      orange: { text: 'text-orange-400', border: 'border-orange-500/50 bg-orange-900/10', badge: 'bg-orange-600' },
      red: { text: 'text-red-400', border: 'border-red-500/50 bg-red-900/10', badge: 'bg-red-600' }
    }[color] || { text: 'text-gray-400', border: 'border-lime-800/30', badge: 'bg-gray-600' }

    return (
      <div className={`bg-black/20 backdrop-blur-sm p-6 rounded-lg border ${
        isRecommended ? colorConfig.border : 'border-lime-800/30'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-white">{type}</h3>
          {isRecommended && (
            <span className={`${colorConfig.badge} text-white text-xs px-2 py-1 rounded`}>
              Recommended
            </span>
          )}
        </div>
        <div className={`text-3xl font-bold ${colorConfig.text} mb-1`}>
          {price.toFixed(1)} gwei
        </div>
        <div className="text-lime-300 text-sm space-y-1">
          <div>⏱️ {getConfirmationTime(price)}</div>
          <div>💰 {getGasCost(price)} ETH</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation currentPage="gas-tracker" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400"></div>
            <p className="mt-2 text-lime-200">Loading gas data from RETH...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <header className="border-b border-lime-800/30 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-lime-300">
                Ritual Explorer
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-red-400 font-semibold">Error Loading Gas Data</h3>
            <p className="text-red-300 mt-2">{error}</p>
            <button 
              onClick={loadGasData}
              className="mt-4 px-4 py-2 bg-red-800/30 text-red-300 rounded hover:bg-red-700/30 border border-red-600/30"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation currentPage="gas-tracker" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-lime-400 mb-4">
            <Link href="/" className="hover:text-lime-200">Home</Link>
            <span>→</span>
            <span className="text-white">Gas Tracker</span>
          </nav>
          
          <h1 className="text-3xl font-bold text-white mb-2">Gas Price Tracker</h1>
          <p className="text-lime-200">
            Real-time gas pricing • Updates every block • Last updated: {gasData ? formatTimestamp(gasData.timestamp) : 'Never'}
          </p>
        </div>

        {/* Current Gas Prices */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {gasData && (
            <>
              <GasPriceCard 
                type="Slow" 
                price={gasData.slow} 
                color="green" 
                isRecommended={recommendation === 'slow'} 
              />
              <GasPriceCard 
                type="Standard" 
                price={gasData.standard} 
                color="yellow" 
                isRecommended={recommendation === 'standard'} 
              />
              <GasPriceCard 
                type="Fast" 
                price={gasData.fast} 
                color="orange" 
                isRecommended={recommendation === 'fast'} 
              />
              <GasPriceCard 
                type="Instant" 
                price={gasData.instant} 
                color="red" 
                isRecommended={recommendation === 'instant'} 
              />
            </>
          )}
        </div>

        {/* Gas Calculator */}
        <div className="bg-black/20 backdrop-blur-sm shadow-lg overflow-hidden rounded-lg border border-lime-800/30 mb-8">
          <div className="px-6 py-4 border-b border-lime-800/30">
            <h3 className="text-lg font-medium text-white">Gas Cost Calculator</h3>
            <p className="text-lime-300 text-sm mt-1">Calculate transaction costs for different gas limits</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-lime-900/20 p-4 rounded-lg border border-lime-700/30">
                <div className="text-lime-300 text-sm font-medium mb-2">Simple Transfer (21,000 gas)</div>
                {gasData && (
                  <div className="space-y-1 text-sm">
                    <div className="text-green-300">Slow: {getGasCost(gasData.slow, 21000)} ETH</div>
                    <div className="text-yellow-300">Standard: {getGasCost(gasData.standard, 21000)} ETH</div>
                    <div className="text-orange-300">Fast: {getGasCost(gasData.fast, 21000)} ETH</div>
                    <div className="text-red-300">Instant: {getGasCost(gasData.instant, 21000)} ETH</div>
                  </div>
                )}
              </div>

              <div className="bg-lime-900/20 p-4 rounded-lg border border-lime-700/30">
                <div className="text-lime-300 text-sm font-medium mb-2">Token Transfer (65,000 gas)</div>
                {gasData && (
                  <div className="space-y-1 text-sm">
                    <div className="text-green-300">Slow: {getGasCost(gasData.slow, 65000)} ETH</div>
                    <div className="text-yellow-300">Standard: {getGasCost(gasData.standard, 65000)} ETH</div>
                    <div className="text-orange-300">Fast: {getGasCost(gasData.fast, 65000)} ETH</div>
                    <div className="text-red-300">Instant: {getGasCost(gasData.instant, 65000)} ETH</div>
                  </div>
                )}
              </div>

              <div className="bg-lime-900/20 p-4 rounded-lg border border-lime-700/30">
                <div className="text-lime-300 text-sm font-medium mb-2">Uniswap Swap (150,000 gas)</div>
                {gasData && (
                  <div className="space-y-1 text-sm">
                    <div className="text-green-300">Slow: {getGasCost(gasData.slow, 150000)} ETH</div>
                    <div className="text-yellow-300">Standard: {getGasCost(gasData.standard, 150000)} ETH</div>
                    <div className="text-orange-300">Fast: {getGasCost(gasData.fast, 150000)} ETH</div>
                    <div className="text-red-300">Instant: {getGasCost(gasData.instant, 150000)} ETH</div>
                  </div>
                )}
              </div>

              <div className="bg-lime-900/20 p-4 rounded-lg border border-lime-700/30">
                <div className="text-lime-300 text-sm font-medium mb-2">Complex Contract (300,000 gas)</div>
                {gasData && (
                  <div className="space-y-1 text-sm">
                    <div className="text-green-300">Slow: {getGasCost(gasData.slow, 300000)} ETH</div>
                    <div className="text-yellow-300">Standard: {getGasCost(gasData.standard, 300000)} ETH</div>
                    <div className="text-orange-300">Fast: {getGasCost(gasData.fast, 300000)} ETH</div>
                    <div className="text-red-300">Instant: {getGasCost(gasData.instant, 300000)} ETH</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gas History Chart */}
        <div className="bg-black/20 backdrop-blur-sm shadow-lg overflow-hidden rounded-lg border border-lime-800/30">
          <div className="px-6 py-4 border-b border-lime-800/30">
            <h3 className="text-lg font-medium text-white">Gas Price History</h3>
            <p className="text-lime-300 text-sm mt-1">Recent gas price trends from the last {gasHistory.length} blocks</p>
          </div>
          
          <div className="p-6">
            {gasHistory.length > 0 ? (
              <div className="h-64 flex items-end space-x-1">
                {gasHistory.map((entry, index) => {
                  const maxGas = Math.max(...gasHistory.map(h => h.gasPrice))
                  const height = (entry.gasPrice / maxGas) * 100
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-lime-500 rounded-t opacity-70 hover:opacity-100 transition-opacity relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {entry.gasPrice.toFixed(1)} gwei
                        <br />
                        Block {entry.blockNumber}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-lime-300">
                Building gas price history...
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
