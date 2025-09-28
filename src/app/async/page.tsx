'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { rethClient, RitualTransactionType, SYSTEM_ACCOUNTS } from '@/lib/reth-client'
import { useTransactionUpdates, useRealtimeStatus } from '@/hooks/useRealtime'
import { TransactionTypeBadge, SystemAccountBadge } from '@/components/TransactionTypeBadge'
import Link from 'next/link'

interface AsyncTransaction {
  hash: string
  type: string
  from: string
  to?: string
  value: string
  blockNumber: string
  timestamp?: string
  originTx?: string
  commitmentTx?: string
  settlementTx?: string
  precompileAddress?: string
  executorAddress?: string
}

export default function AsyncPage() {
  const [asyncTransactions, setAsyncTransactions] = useState<AsyncTransaction[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'commitment' | 'settlement'>('all')
  const [isPending, startTransition] = useTransition()
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)
  
  const realtimeStatus = useRealtimeStatus()

  // Real-time transaction updates
  useTransactionUpdates((txData) => {
    console.log('🔄 New async transaction received:', txData.hash)
    loadAsyncTransactions()
  })

  useEffect(() => {
    loadAsyncTransactions()
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadAsyncTransactions, 15000)
    
    return () => clearInterval(interval)
  }, [])

  const loadAsyncTransactions = async () => {
    try {
      setError(null)
      
      // Get recent blocks and filter for async transactions
      const recentBlocks = await rethClient.getRecentBlocks(10)
      const asyncTxs: AsyncTransaction[] = []
      
      for (const block of recentBlocks) {
        if (block.transactions && Array.isArray(block.transactions)) {
          // Use direct transactions from block like transactions page
          for (const tx of block.transactions.slice(0, 10)) {
            if (typeof tx === 'object' && tx.hash) {
              // STRICT async filtering - only actual async commitment/settlement transactions
              if (tx && (
                  tx.type === RitualTransactionType.ASYNC_COMMITMENT ||
                  tx.type === RitualTransactionType.ASYNC_SETTLEMENT ||
                  // Only include if it has BOTH commitment/settlement fields AND is from/to ASYNC system accounts
                  (tx.commitmentTx && (
                    tx.from === SYSTEM_ACCOUNTS.ASYNC_COMMITMENT ||
                    tx.from === SYSTEM_ACCOUNTS.ASYNC_SETTLEMENT ||
                    (tx.to && (tx.to === SYSTEM_ACCOUNTS.ASYNC_COMMITMENT || tx.to === SYSTEM_ACCOUNTS.ASYNC_SETTLEMENT))
                  )) ||
                  (tx.settlementTx && (
                    tx.from === SYSTEM_ACCOUNTS.ASYNC_COMMITMENT ||
                    tx.from === SYSTEM_ACCOUNTS.ASYNC_SETTLEMENT ||
                    (tx.to && (tx.to === SYSTEM_ACCOUNTS.ASYNC_COMMITMENT || tx.to === SYSTEM_ACCOUNTS.ASYNC_SETTLEMENT))
                  ))
                )) {
                  asyncTxs.push(tx as AsyncTransaction)
                }
            }
          }
        }
      }
      
      setAsyncTransactions(asyncTxs.slice(0, 20))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load async transactions')
    } finally {
      setInitialLoading(false)
    }
  }

  const filteredTransactions = asyncTransactions.filter(tx => {
    if (filter === 'all') return true
    if (filter === 'commitment') return tx.type === RitualTransactionType.ASYNC_COMMITMENT
    if (filter === 'settlement') return tx.type === RitualTransactionType.ASYNC_SETTLEMENT
    return true
  })

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const formatValue = (value: string) => {
    try {
      if (!value || value === '0x0') return '0'
      const wei = parseInt(value, 16)
      const ritual = wei / 1e18
      return ritual.toFixed(6)
    } catch {
      return '0'
    }
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
              <span className="text-white border-b-2 border-lime-400 px-3 py-2 text-sm font-medium">
                Async
              </span>
              <Link href="/analytics" className="text-lime-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Analytics
              </Link>
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
            <span className="text-white">Async Transactions</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">Async Transactions</h1>
                {realtimeStatus && (
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                    realtimeStatus.isConnected 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      realtimeStatus.isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`}></div>
                    <span>{realtimeStatus.isConnected ? 'LIVE' : 'OFFLINE'}</span>
                  </div>
                )}
              </div>
              <p className="text-lime-200">
                Ritual Chain async execution transactions (Types 0x11 & 0x12)
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 bg-black/50 border border-lime-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
              >
                <option value="all">All Async</option>
                <option value="commitment">Commitments (0x11)</option>
                <option value="settlement">Settlements (0x12)</option>
              </select>
              <button 
                onClick={loadAsyncTransactions}
                disabled={initialLoading || isUpdating}
                className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 disabled:opacity-50 transition-colors"
              >
                {initialLoading ? 'Loading...' : isUpdating ? 'Updating...' : 'Refresh Async Transactions'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-8">
            <h3 className="text-red-400 font-semibold">Error Loading Async Transactions</h3>
            <p className="text-red-300 mt-2">{error}</p>
          </div>
        )}

        {/* Async Transactions List */}
        <div className="bg-white/5 border border-lime-500/20 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-lime-500/20 flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">
              Async Transactions ({filteredTransactions.length})
            </h3>
            <div className="text-sm text-lime-300">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          {initialLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mb-4"></div>
              <p className="text-lime-200">Loading async transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lime-300">No async transactions found</p>
              <p className="text-lime-400 text-sm mt-2">
                Async transactions (Types 0x11, 0x12) will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-lime-500/10">
              {filteredTransactions.map((tx, index) => (
                <div key={tx.hash || index} className="px-6 py-4 hover:bg-lime-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                          tx.type === RitualTransactionType.ASYNC_COMMITMENT 
                            ? 'bg-orange-500/20 border-orange-500/30' 
                            : 'bg-green-500/20 border-green-500/30'
                        }`}>
                          <span className={`text-xs ${
                            tx.type === RitualTransactionType.ASYNC_COMMITMENT 
                              ? 'text-orange-300' 
                              : 'text-green-300'
                          }`}>
                            {tx.type === RitualTransactionType.ASYNC_COMMITMENT ? 'AC' : 'AS'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <Link 
                            href={`/tx/${tx.hash}`}
                            className="text-lime-300 hover:text-white font-mono text-sm truncate transition-colors"
                          >
                            {shortenHash(tx.hash)}
                          </Link>
                          <TransactionTypeBadge type={tx.type} />
                          <SystemAccountBadge address={tx.from} />
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-lime-400">
                          <span>From: {shortenHash(tx.from)}</span>
                          {tx.to && <span>To: {shortenHash(tx.to)}</span>}
                          {tx.executorAddress && <span>Executor: {shortenHash(tx.executorAddress)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-sm font-medium text-white">
                        {formatValue(tx.value)} RITUAL
                      </span>
                      {tx.blockNumber && (
                        <span className="text-xs text-lime-400">
                          Block #{parseInt(tx.blockNumber, 16).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredTransactions.length > 0 && (
            <div className="px-6 py-4 bg-black/50 border-t border-lime-500/20 text-center">
              <p className="text-sm text-lime-300">
                Showing {filteredTransactions.length} async transactions
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
