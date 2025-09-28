'use client'
import { useState, useEffect } from 'react'
import { rethClient } from '@/lib/reth-client'
import { Navigation } from '@/components/Navigation'
import { getRealtimeManager } from '@/lib/realtime-websocket'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'

interface BlockchainStats {
  latestBlock: number
  gasPrice: number
  recentTransactions: any[]
  recentBlocks: any[]
}

export default function HomePage() {
  const [stats, setStats] = useState<BlockchainStats>({
    latestBlock: 0,
    gasPrice: 0,
    recentTransactions: [],
    recentBlocks: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
    
    // Set up realtime updates using the enhanced WebSocket manager
    const realtimeManager = getRealtimeManager()
    const unsubscribe = realtimeManager?.subscribe('homepage', (update) => {
      if (update.type === 'newBlock') {
        console.log('📊 [Homepage] New block received:', update.data)
        loadStats() // Reload stats when new block arrives
      }
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [latestBlockNumber, gasPrice, recentBlocks] = await Promise.all([
        rethClient.getLatestBlockNumber(),
        rethClient.getGasPrice(),
        rethClient.getRecentBlocks(10)
      ])
      
      // Get real recent transactions from latest blocks
      const recentTransactions: any[] = []
      console.log('🔍 Loading recent transactions from', recentBlocks.length, 'blocks')
      console.log('🔍 Recent blocks:', recentBlocks.map(b => `${b.number}(${b.transactions?.length || 0} txs)`))
      
      for (const block of recentBlocks.slice(0, 3)) { // Only check first 3 blocks for faster loading
        if (block.transactions && Array.isArray(block.transactions) && block.transactions.length > 0) {
          console.log(`📦 Block ${block.number} has ${block.transactions.length} transactions`)
          
          // Transactions are already full objects when includeTransactions=true
          for (const tx of block.transactions.slice(0, 3)) {
            if (tx && typeof tx === 'object' && tx.hash) {
              console.log(`✅ Processing transaction object: ${tx.hash}`)
              recentTransactions.push({
                ...tx,
                timestamp: block.timestamp || Date.now() / 1000
              })
              console.log(`✅ Added transaction ${tx.hash.slice(0, 10)}... from block ${block.number}`)
              if (recentTransactions.length >= 10) break
            } else if (typeof tx === 'string' && tx.startsWith('0x')) {
              // Fallback: if we get hashes instead of objects, fetch them
              try {
                console.log(`🔄 Fetching transaction hash: ${tx}`)
                const txData = await rethClient.getTransaction(tx)
                if (txData && txData.hash) {
                  recentTransactions.push({
                    ...txData,
                    timestamp: block.timestamp || Date.now() / 1000
                  })
                  console.log(`✅ Added fetched transaction ${txData.hash.slice(0, 10)}... from block ${block.number}`)
                  if (recentTransactions.length >= 10) break
                }
              } catch (txError) {
                console.warn(`❌ Failed to fetch transaction ${tx}:`, txError)
              }
            } else {
              console.warn(`⚠️ Invalid transaction format:`, typeof tx, tx)
            }
          }
          if (recentTransactions.length >= 10) break
        } else {
          console.log(`📦 Block ${block.number} has no transactions or invalid transaction format`)
          console.log(`📦 Block transactions data:`, block.transactions)
        }
      }
      
      console.log(`📊 Final transaction count: ${recentTransactions.length}`)
      
      setStats({
        latestBlock: latestBlockNumber,
        gasPrice: parseInt(gasPrice) || 0,
        recentTransactions: recentTransactions,
        recentBlocks: recentBlocks
      })
    } catch (err) {
      console.error('Error loading stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load blockchain data')
      // Set safe defaults on error
      setStats({
        latestBlock: 0,
        gasPrice: 0,
        recentTransactions: [],
        recentBlocks: []
      })
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: string) => {
    if (!value || value === '0x0') return '0'
    try {
      const wei = parseInt(value, 16)
      const eth = wei / 1e18
      return eth.toFixed(4)
    } catch {
      return '0'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      // Parse hex timestamp from RETH 
      const timestampValue = parseInt(timestamp, 16)
      
      // RETH appears to return timestamps in milliseconds, not seconds
      // Check if the value is reasonable for milliseconds (> year 2020)
      const date = timestampValue > 1577836800000 ? 
        new Date(timestampValue) : // Already milliseconds
        new Date(timestampValue * 1000) // Convert seconds to milliseconds
      
      const now = new Date()
      const diff = Math.abs(now.getTime() - date.getTime())
      const seconds = Math.floor(diff / 1000)
      
      // Validate the timestamp is reasonable (not too far in future/past)
      if (seconds > 86400 * 365 * 2) { // More than 2 years
        return 'Invalid time'
      }
      
      if (seconds < 60) return `${seconds}s ago`
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
      return `${Math.floor(seconds / 86400)}d ago`
    } catch (e) {
      console.error('Error parsing timestamp:', timestamp, e)
      return 'Unknown time'
    }
  }

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }
  return (
    <div className="min-h-screen bg-black">
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black via-lime-500/10 to-black border-b border-lime-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">The Ritual Network Blockchain Explorer</h1>
            <div className="flex justify-center">
              <SearchBar />
            </div>
          </div>
        </div>
      </div>

      <main className="bg-black">
        {error && (
          <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mx-4 mt-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">Warning</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-300">
                  Failed to connect to RETH nodes: {error}
                </p>
                <button 
                  onClick={loadStats}
                  className="mt-2 px-3 py-1 bg-red-800/30 text-red-300 text-xs rounded hover:bg-red-700/30 border border-red-600/30"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Price Banner */}
        <div className="bg-white/5 border-b border-lime-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-between text-sm">
              <div className="flex items-center space-x-6">
                <div className="text-lime-300">
                  RITUAL Price: <span className="text-white font-medium">N/A</span>
                </div>
                <div className="text-lime-300">
                  Gas: <span className="text-white font-medium">{loading ? '...' : `${stats.gasPrice} Gwei`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-black/50 border border-lime-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-lime-400">RITUAL PRICE</div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-white">N/A</div>
                  <div className="text-sm text-lime-300">Price not available</div>
                </div>
              </div>
              
              <div className="bg-black/50 border border-lime-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-lime-400">RECENT TRANSACTIONS</div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-white">{loading ? '...' : stats.recentTransactions.length.toLocaleString()}</div>
                  <div className="text-sm text-lime-300">From last 3 blocks</div>
                </div>
              </div>

              <div className="bg-black/50 border border-lime-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-lime-400">MED GAS PRICE</div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-white">{loading ? '...' : `${stats.gasPrice} Gwei`}</div>
                  <div className="text-sm text-lime-300">($0.01)</div>
                </div>
              </div>

              <div className="bg-black/50 border border-lime-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-lime-400">LAST FINALIZED BLOCK</div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-white">{loading ? '...' : stats.latestBlock.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Blocks and Transactions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Latest Blocks */}
            <div className="bg-white/5 border border-lime-500/20 rounded-lg overflow-hidden">
              <div className="bg-black/50 px-6 py-4 border-b border-lime-500/20">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white">Latest Blocks</h3>
                  <button className="text-lime-300 text-sm hover:text-white">Customize</button>
                </div>
              </div>
              
              <div className="divide-y divide-lime-500/10">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-lime-400"></div>
                    <p className="mt-2 text-lime-200 text-sm">Loading blocks...</p>
                  </div>
                ) : (
                  stats.recentBlocks.slice(0, 5).map((block: any, index: number) => {
                    try {
                      const blockNumber = block.number ? parseInt(block.number, 16) : index;
                      return (
                        <div key={`block-${blockNumber}-${index}`} className="p-4 hover:bg-lime-500/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-lime-500/20 rounded flex items-center justify-center">
                                <span className="text-lime-300 text-xs font-mono">Bk</span>
                              </div>
                              <div>
                                <Link 
                                  href={`/block/${blockNumber}`}
                                  className="text-lime-300 hover:text-white font-medium"
                                >
                                  {blockNumber.toLocaleString()}
                                </Link>
                                <p className="text-sm text-white">
                                  {block.timestamp ? formatTimestamp(block.timestamp) : 'Recent'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-lime-300">
                                Validator {block.miner ? `${block.miner.slice(0, 10)}...` : 'Unknown'}
                              </p>
                              <p className="text-sm text-white">
                                {(block.transactions && block.transactions.length) || 0} txns
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      console.error('Error rendering block:', e);
                      return (
                        <div key={`error-block-${index}`} className="p-4 text-red-400">
                          Error rendering block {index}
                        </div>
                      );
                    }
                  })
                )}
              </div>
              
              <div className="bg-black/50 px-6 py-3 border-t border-lime-500/20">
                <Link href="/blocks" className="text-lime-300 text-sm hover:text-white">
                  View all blocks
                </Link>
              </div>
            </div>

            {/* Latest Transactions */}
            <div className="bg-white/5 border border-lime-500/20 rounded-lg overflow-hidden">
              <div className="bg-black/50 px-6 py-4 border-b border-lime-500/20">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white">Latest Transactions</h3>
                  <button className="text-lime-300 text-sm hover:text-white">Customize</button>
                </div>
              </div>
              
              <div className="divide-y divide-lime-500/10">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-lime-400"></div>
                    <p className="mt-2 text-lime-200 text-sm">Loading transactions...</p>
                  </div>
                ) : stats.recentTransactions.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-lime-200 text-sm">No recent transactions found</p>
                    <p className="text-gray-400 text-xs mt-1">Transactions from the last 3 blocks will appear here</p>
                  </div>
                ) : (
                  stats.recentTransactions.slice(0, 5).map((tx: any, index: number) => {
                    try {
                      return (
                        <div key={`tx-${tx.hash || index}`} className="p-4 hover:bg-lime-500/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-lime-500/20 rounded flex items-center justify-center">
                                <span className="text-lime-300 text-xs font-mono">Tx</span>
                              </div>
                              <div>
                                <Link 
                                  href={`/tx/${tx.hash || '0x0'}`}
                                  className="text-lime-300 hover:text-white font-mono text-sm"
                                >
                                  {tx.hash ? shortenHash(tx.hash) : `Tx ${index + 1}`}
                                </Link>
                                <p className="text-sm text-white">
                                  {tx.timestamp ? formatTimestamp(typeof tx.timestamp === 'string' ? tx.timestamp : `0x${tx.timestamp.toString(16)}`) : 'Recent'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-lime-300">
                                From {tx.from ? `${tx.from.slice(0, 10)}...` : 'Unknown'}
                              </p>
                              <p className="text-sm font-medium text-white">
                                {tx.value && tx.value !== '0x0' ? 
                                  `${(parseInt(tx.value, 16) / 1e18).toFixed(4)} RITUAL` : 
                                  '0 RITUAL'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      console.error('Error rendering transaction:', e);
                      return (
                        <div key={`error-tx-${index}`} className="p-4 text-red-400">
                          Error rendering transaction {index}
                        </div>
                      );
                    }
                  })
                )}
              </div>
              
              <div className="bg-black/50 px-6 py-3 border-t border-lime-500/20">
                <Link href="/transactions" className="text-lime-300 text-sm hover:text-white">
                  View all transactions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
