'use client'

import { useState, useEffect, use } from 'react'
import { rethClient } from '@/lib/reth-client'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { TransactionTypeBadge } from '@/components/TransactionTypeBadge'

interface ScheduledTransaction {
  type: string
  hash: string
  originTx: string
  callId: number
  index: number
  maxBlock: number
  initialBlock: number
  frequency: number
  to?: string
  value: string
  gas: string
  from: string
}

interface ScheduledPageProps {
  searchParams?: Promise<{
    callId?: string
  }>
}

export default function ScheduledPage({ searchParams }: ScheduledPageProps) {
  const [scheduledTxs, setScheduledTxs] = useState<ScheduledTransaction[]>([])
  const [filteredTxs, setFilteredTxs] = useState<ScheduledTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fix Next.js 15 searchParams issue - unwrap the promise
  const params = searchParams ? use(searchParams) : {}
  const [searchCallId, setSearchCallId] = useState(params?.callId || '')

  useEffect(() => {
    loadScheduledTransactions()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadScheduledTransactions, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const loadScheduledTransactions = async () => {
    try {
      setError(null)
      const scheduled = await rethClient.getScheduledTransactions()
      setScheduledTxs(scheduled)
      filterTransactions(scheduled, searchCallId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled transactions')
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = (transactions: ScheduledTransaction[], callIdFilter: string) => {
    if (!callIdFilter.trim()) {
      setFilteredTxs(transactions)
      return
    }

    const filtered = transactions.filter(tx => 
      tx.callId.toString().includes(callIdFilter.trim())
    )
    setFilteredTxs(filtered)
  }

  useEffect(() => {
    filterTransactions(scheduledTxs, searchCallId)
  }, [scheduledTxs, searchCallId])

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

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const getTimeSinceLastUpdate = () => {
    const now = new Date()
    return `Last updated: ${now.toLocaleTimeString()}`
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation currentPage="scheduled" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-lime-400 mb-4">
            <Link href="/" className="hover:text-lime-200">Home</Link>
            <span>→</span>
            <span className="text-white">Scheduled Transactions</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Scheduled Transactions Pool</h1>
              <p className="text-lime-200">
                Pending scheduled transactions waiting for execution
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchCallId}
                  onChange={(e) => setSearchCallId(e.target.value)}
                  placeholder="Filter by Call ID..."
                  className="px-3 py-2 bg-black/50 border border-lime-500/30 rounded-md text-white placeholder-lime-300/60 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400 w-48"
                />
                {searchCallId && (
                  <button
                    onClick={() => setSearchCallId('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-lime-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button 
                onClick={loadScheduledTransactions}
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
            <h3 className="text-red-400 font-semibold">Error Loading Scheduled Transactions</h3>
            <p className="text-red-300 mt-2">{error}</p>
          </div>
        )}

        {/* Scheduled Transactions List */}
        <div className="bg-white/5 border border-lime-500/20 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-lime-500/20 flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Pending Scheduled Transactions</h3>
            <div className="text-sm text-lime-300">
              {getTimeSinceLastUpdate()}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mb-4"></div>
              <p className="text-lime-200">Loading scheduled transactions...</p>
            </div>
          ) : filteredTxs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lime-300">No scheduled transactions found in pool</p>
              <p className="text-lime-400 text-sm mt-2">
                Scheduled transactions appear here when waiting for execution
              </p>
            </div>
          ) : (
            <div className="divide-y divide-lime-500/10">
              {filteredTxs.map((tx, index) => (
                <div key={tx.hash || index} className="px-6 py-4 hover:bg-lime-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-lime-500/20 rounded-lg flex items-center justify-center border border-lime-500/30">
                          <span className="text-lime-300 text-xs">Sched</span>
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
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-lime-400">
                          <span>Call ID: {tx.callId}</span>
                          <span>Index: {tx.index}</span>
                          <span>Freq: {tx.frequency} blocks</span>
                          {tx.to && <span>To: {shortenHash(tx.to)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-sm font-medium text-white">
                        {formatValue(tx.value)} RITUAL
                      </span>
                      <span className="text-xs text-lime-400">
                        Max Block: {tx.maxBlock.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredTxs.length > 0 && (
            <div className="px-6 py-4 bg-black/50 border-t border-lime-500/20 text-center">
              <p className="text-sm text-lime-300">
                Showing {filteredTxs.length} scheduled transactions 
                {searchCallId && ` matching Call ID "${searchCallId}"`}
                {scheduledTxs.length !== filteredTxs.length && ` (${scheduledTxs.length} total)`}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
