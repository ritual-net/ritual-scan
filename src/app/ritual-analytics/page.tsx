'use client'

import { useState, useEffect } from 'react'
import { rethClient, RitualTransactionType } from '@/lib/reth-client'
import Link from 'next/link'

interface RitualAnalytics {
  totalTransactions: number
  asyncTransactions: number
  scheduledTransactions: number
  systemTransactions: number
  asyncAdoptionRate: number
  activeScheduledJobs: number
  avgSettlementTime: number
  totalProtocolFees: number
  executorEarnings: number
  validatorEarnings: number
  precompileUsage: { [address: string]: number }
  transactionTypeDistribution: { [type: string]: number }
  scheduledJobSuccessRate: number
  recentActivity: {
    timestamp: number
    asyncTxs: number
    scheduledTxs: number
    systemTxs: number
  }[]
}

export default function RitualAnalyticsPage() {
  const [analytics, setAnalytics] = useState<RitualAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h')

  useEffect(() => {
    loadAnalytics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000)
    
    return () => clearInterval(interval)
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate analytics data since we don't have a dedicated analytics API
      const mockAnalytics: RitualAnalytics = {
        totalTransactions: 156742,
        asyncTransactions: 12483,
        scheduledTransactions: 3847,
        systemTransactions: 16330,
        asyncAdoptionRate: 7.97,
        activeScheduledJobs: 234,
        avgSettlementTime: 2.3,
        totalProtocolFees: 45.67,
        executorEarnings: 23.45,
        validatorEarnings: 22.22,
        precompileUsage: {
          '0x0000000000000000000000000000000000000801': 8934,
          '0x0000000000000000000000000000000000000802': 2156,
          '0x0000000000000000000000000000000000000803': 1393
        },
        transactionTypeDistribution: {
          'Legacy (0x0)': 89456,
          'EIP-1559 (0x2)': 50986,
          'Scheduled (0x10)': 3847,
          'AsyncCommitment (0x11)': 6241,
          'AsyncSettlement (0x12)': 6242
        },
        scheduledJobSuccessRate: 98.4,
        recentActivity: [
          { timestamp: Date.now() - 3600000, asyncTxs: 45, scheduledTxs: 12, systemTxs: 57 },
          { timestamp: Date.now() - 7200000, asyncTxs: 38, scheduledTxs: 15, systemTxs: 53 },
          { timestamp: Date.now() - 10800000, asyncTxs: 52, scheduledTxs: 8, systemTxs: 60 },
          { timestamp: Date.now() - 14400000, asyncTxs: 41, scheduledTxs: 11, systemTxs: 52 }
        ]
      }
      
      setAnalytics(mockAnalytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`
  }

  const formatTokenAmount = (amount: number) => {
    return `${amount.toFixed(2)} RITUAL`
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-lime-500/20 bg-black/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-lime-400 hover:text-lime-300 transition-colors">
                Ritual Explorer
              </Link>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lime-500/20 text-lime-300 border border-lime-500/30">
                Shrinenet
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-lime-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="/blocks" className="text-lime-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Blocks
              </Link>
              <Link href="/transactions" className="text-lime-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Transactions
              </Link>
              <Link href="/mempool" className="text-lime-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Mempool
              </Link>
              <Link href="/scheduled" className="text-lime-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Scheduled  
              </Link>
              <Link href="/analytics" className="text-lime-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Analytics
              </Link>
              <span className="text-white border-b-2 border-lime-400 px-3 py-2 text-sm font-medium">
                Ritual Analytics
              </span>
              <Link href="/gas-tracker" className="text-lime-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Gas Tracker
              </Link>
              <Link href="/settings" className="text-lime-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-lime-400 mb-4">
            <Link href="/" className="hover:text-lime-200">Home</Link>
            <span>→</span>
            <span className="text-white">Ritual Analytics</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Ritual Chain Analytics</h1>
              <p className="text-lime-200">
                Advanced analytics for Ritual Chain features including async execution and scheduled transactions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 bg-black/50 border border-lime-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
              <button 
                onClick={loadAnalytics}
                disabled={loading}
                className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-8">
            <h3 className="text-red-400 font-semibold">Error Loading Analytics</h3>
            <p className="text-red-300 mt-2">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mr-3"></div>
            <span className="text-lime-200">Loading Ritual Chain analytics...</span>
          </div>
        ) : analytics && (
          <div className="space-y-8">
            
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-lime-400">Async Adoption Rate</p>
                    <p className="text-2xl font-bold text-white">{formatPercentage(analytics.asyncAdoptionRate)}</p>
                  </div>
                  <div className="w-12 h-12 bg-lime-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lime-300 text-xl">⚡</span>
                  </div>
                </div>
                <p className="text-xs text-lime-300/80 mt-2">
                  {formatNumber(analytics.asyncTransactions)} of {formatNumber(analytics.totalTransactions)} transactions
                </p>
              </div>

              <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-lime-400">Active Scheduled Jobs</p>
                    <p className="text-2xl font-bold text-white">{formatNumber(analytics.activeScheduledJobs)}</p>
                  </div>
                  <div className="w-12 h-12 bg-lime-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lime-300 text-xl">🔄</span>
                  </div>
                </div>
                <p className="text-xs text-lime-300/80 mt-2">
                  {formatPercentage(analytics.scheduledJobSuccessRate)} success rate
                </p>
              </div>

              <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-lime-400">Avg Settlement Time</p>
                    <p className="text-2xl font-bold text-white">{analytics.avgSettlementTime} blocks</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-orange-300 text-xl">⏱️</span>
                  </div>
                </div>
                <p className="text-xs text-lime-300/80 mt-2">
                  Time from commitment to settlement
                </p>
              </div>

              <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-lime-400">Protocol Fees</p>
                    <p className="text-2xl font-bold text-white">{formatTokenAmount(analytics.totalProtocolFees)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-green-300 text-xl">💰</span>
                  </div>
                </div>
                <p className="text-xs text-lime-300/80 mt-2">
                  Total fees collected
                </p>
              </div>
            </div>

            {/* Transaction Type Distribution */}
            <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Transaction Type Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(analytics.transactionTypeDistribution).map(([type, count]) => (
                  <div key={type} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-lime-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-lime-300 text-2xl">
                        {type.includes('Legacy') ? '📜' :
                         type.includes('EIP-1559') ? '🆕' :
                         type.includes('Scheduled') ? '🔄' :
                         type.includes('AsyncCommitment') ? '📋' : '✅'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white">{formatNumber(count)}</p>
                    <p className="text-xs text-lime-400">{type}</p>
                    <p className="text-xs text-lime-300/80">
                      {formatPercentage((count / analytics.totalTransactions) * 100)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Protocol Fee Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Protocol Fee Distribution</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-lime-400 rounded-full"></div>
                      <span className="text-lime-300">Executor Earnings</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatTokenAmount(analytics.executorEarnings)}</p>
                      <p className="text-xs text-lime-400">
                        {formatPercentage((analytics.executorEarnings / analytics.totalProtocolFees) * 100)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                      <span className="text-lime-300">Validator Earnings</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatTokenAmount(analytics.validatorEarnings)}</p>
                      <p className="text-xs text-lime-400">
                        {formatPercentage((analytics.validatorEarnings / analytics.totalProtocolFees) * 100)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Top Precompiles</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.precompileUsage)
                    .sort(([,a], [,b]) => b - a)
                    .map(([address, usage]) => (
                      <div key={address} className="flex items-center justify-between">
                        <div>
                          <Link 
                            href={`/address/${address}`}
                            className="text-sm text-lime-300 hover:text-white font-mono"
                          >
                            {address.slice(0, 10)}...{address.slice(-8)}
                          </Link>
                          <p className="text-xs text-lime-400">
                            {address === '0x0000000000000000000000000000000000000801' ? 'Async Precompile' :
                             address === '0x0000000000000000000000000000000000000802' ? 'Oracle Precompile' :
                             'Custom Precompile'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{formatNumber(usage)}</p>
                          <p className="text-xs text-lime-400">calls</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* System Accounts Activity */}
            <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">System Account Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-lime-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lime-300 text-2xl">🤖</span>
                  </div>
                  <h4 className="text-lime-300 font-medium">Scheduled System</h4>
                  <p className="text-xs text-lime-400 mb-2">0x...fa7e</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(analytics.scheduledTransactions)}</p>
                  <p className="text-xs text-lime-300/80">executions</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-orange-300 text-2xl">📋</span>
                  </div>
                  <h4 className="text-lime-300 font-medium">Commitment System</h4>
                  <p className="text-xs text-lime-400 mb-2">0x...fa8e</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(Math.floor(analytics.asyncTransactions / 2))}</p>
                  <p className="text-xs text-lime-300/80">commitments</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-green-300 text-2xl">✅</span>
                  </div>
                  <h4 className="text-lime-300 font-medium">Settlement System</h4>
                  <p className="text-xs text-lime-400 mb-2">0x...fa9e</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(Math.floor(analytics.asyncTransactions / 2))}</p>
                  <p className="text-xs text-lime-300/80">settlements</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
