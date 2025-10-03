'use client'

import { useState, useEffect, useCallback } from 'react'
import { rethClient } from '@/lib/reth-client'
import { Navigation } from '@/components/Navigation'
import { getRealtimeManager } from '@/lib/realtime-websocket'
import Link from 'next/link'
import { useParticleBackground } from '@/hooks/useParticleBackground'

interface ValidatorStats {
  address: string
  blocksProposed: number
  blocksValidated: number
  stake: string
  healthStatus: 'active' | 'inactive' | 'warning'
  lastBlockNumber: number
  lastBlockTime: number
  percentage: number
}

export default function ValidatorsPage() {
  useParticleBackground()
  const [validators, setValidators] = useState<ValidatorStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalBlocks, setTotalBlocks] = useState(0)
  const [blockRange, setBlockRange] = useState({ start: 0, end: 0 })
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadValidators()
    
    // Subscribe to real-time updates
    const realtimeManager = getRealtimeManager()
    const unsubscribe = realtimeManager?.subscribe('validators-page', (update) => {
      if (update.type === 'newBlock') {
        console.log('🔍 [Validators] New block received, updating stats')
        // Refresh validator stats when new blocks arrive
        setTimeout(() => loadValidators(), 2000)
      }
    })

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadValidators()
    }, 30000)

    return () => {
      if (unsubscribe) unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadValidators = async () => {
    try {
      setError(null)
      
      // Get latest block number
      const latestBlockNumber = await rethClient.getLatestBlockNumber()
      
      // Fetch last 100 blocks to analyze validator activity (reduced for faster loading)
      const blocksToAnalyze = Math.min(100, latestBlockNumber)
      const startBlock = Math.max(0, latestBlockNumber - blocksToAnalyze)
      
      setBlockRange({ start: startBlock, end: latestBlockNumber })
      setTotalBlocks(blocksToAnalyze)
      
      // Fetch blocks in batches to avoid overwhelming the RPC
      const validatorMap = new Map<string, {
        blocksProposed: number
        lastBlockNumber: number
        lastBlockTime: number
      }>()
      
      const batchSize = 10 // Very small batch size to avoid rate limiting
      const batches = Math.ceil(blocksToAnalyze / batchSize)
      
      console.log(`📊 Starting to fetch ${blocksToAnalyze} blocks in ${batches} batches...`)
      
      for (let i = 0; i < batches; i++) {
        if (i % 5 === 0) {
          console.log(`📦 Processing batch ${i + 1}/${batches}...`)
        }
        const batchStart = latestBlockNumber - (i * batchSize)
        const batchEnd = Math.max(startBlock, batchStart - batchSize)
        
        const promises = []
        for (let blockNum = batchStart; blockNum > batchEnd && blockNum >= startBlock; blockNum--) {
          promises.push(rethClient.getBlock(blockNum, false))
        }
        
        try {
          const blocks = await Promise.all(promises)
          
          blocks.forEach(block => {
            if (block && block.miner) {
              const validator = block.miner.toLowerCase()
              const blockNum = parseInt(block.number, 16)
              const blockTime = parseInt(block.timestamp, 16)
              
              if (!validatorMap.has(validator)) {
                validatorMap.set(validator, {
                  blocksProposed: 0,
                  lastBlockNumber: blockNum,
                  lastBlockTime: blockTime
                })
              }
              
              const stats = validatorMap.get(validator)!
              stats.blocksProposed++
              
              // Update last block if this is more recent
              if (blockNum > stats.lastBlockNumber) {
                stats.lastBlockNumber = blockNum
                stats.lastBlockTime = blockTime
              }
            }
          })
          
          // Update UI progressively every 3 batches (30 blocks)
          if (i % 3 === 0 && i > 0) {
            const validatorStats: ValidatorStats[] = Array.from(validatorMap.entries()).map(([address, stats]) => {
              const blocksAnalyzedSoFar = (i + 1) * batchSize
              const percentage = (stats.blocksProposed / blocksAnalyzedSoFar) * 100
              const blocksSinceLastProposal = latestBlockNumber - stats.lastBlockNumber
              let healthStatus: 'active' | 'inactive' | 'warning' = 'active'
              
              if (blocksSinceLastProposal > 100) {
                healthStatus = 'inactive'
              } else if (blocksSinceLastProposal > 50) {
                healthStatus = 'warning'
              }
              
              return {
                address,
                blocksProposed: stats.blocksProposed,
                blocksValidated: stats.blocksProposed,
                stake: percentage.toFixed(2) + '%',
                healthStatus,
                lastBlockNumber: stats.lastBlockNumber,
                lastBlockTime: stats.lastBlockTime,
                percentage
              }
            })
            
            validatorStats.sort((a, b) => b.blocksProposed - a.blocksProposed)
            setValidators(validatorStats)
          }
        } catch (error) {
          console.warn(`Failed to fetch batch ${i}:`, error)
        }
        
        // Add a longer delay between batches to avoid rate limiting
        if (i < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      console.log(`✅ Completed fetching all blocks. Found ${validatorMap.size} validators.`)
      
      // Convert map to array and calculate additional metrics
      const validatorStats: ValidatorStats[] = Array.from(validatorMap.entries()).map(([address, stats]) => {
        const percentage = (stats.blocksProposed / blocksToAnalyze) * 100
        
        // Determine health status
        const blocksSinceLastProposal = latestBlockNumber - stats.lastBlockNumber
        let healthStatus: 'active' | 'inactive' | 'warning' = 'active'
        
        if (blocksSinceLastProposal > 100) {
          healthStatus = 'inactive'
        } else if (blocksSinceLastProposal > 50) {
          healthStatus = 'warning'
        }
        
        return {
          address,
          blocksProposed: stats.blocksProposed,
          blocksValidated: stats.blocksProposed, // In PoS, proposed = validated
          stake: percentage.toFixed(2) + '%', // Using percentage as stake proxy
          healthStatus,
          lastBlockNumber: stats.lastBlockNumber,
          lastBlockTime: stats.lastBlockTime,
          percentage
        }
      })
      
      // Sort by blocks proposed (descending)
      validatorStats.sort((a, b) => b.blocksProposed - a.blocksProposed)
      
      setValidators(validatorStats)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Failed to load validators:', err)
      setError(err instanceof Error ? err.message : 'Failed to load validators')
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400'
      case 'warning':
        return 'text-yellow-400'
      case 'inactive':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getHealthStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'inactive':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation currentPage="validators" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-lime-400 mb-2">
            Validators
          </h1>
          <p className="text-lime-300/70">
            Network validators and their performance metrics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-lime-500/5 border border-lime-500/20 rounded-lg p-4">
            <div className="text-lime-300/70 text-sm mb-1">Total Validators</div>
            <div className="text-2xl font-bold text-white">{validators.length}</div>
          </div>
          
          <div className="bg-lime-500/5 border border-lime-500/20 rounded-lg p-4">
            <div className="text-lime-300/70 text-sm mb-1">Blocks Analyzed</div>
            <div className="text-2xl font-bold text-white">{totalBlocks.toLocaleString()}</div>
          </div>
          
          <div className="bg-lime-500/5 border border-lime-500/20 rounded-lg p-4">
            <div className="text-lime-300/70 text-sm mb-1">Active Validators</div>
            <div className="text-2xl font-bold text-green-400">
              {validators.filter(v => v.healthStatus === 'active').length}
            </div>
          </div>
          
          <div className="bg-lime-500/5 border border-lime-500/20 rounded-lg p-4">
            <div className="text-lime-300/70 text-sm mb-1">Last Update</div>
            <div className="text-sm font-medium text-white">
              {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
            <p className="mt-4 text-lime-300/70">Loading validator data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Validators Table */}
        {!loading && !error && validators.length > 0 && (
          <div className="bg-black/50 border border-lime-500/20 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-lime-500/10 border-b border-lime-500/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">
                      Validator Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">
                      Blocks Proposed
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">
                      Blocks Validated
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">
                      Activity Share
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">
                      Last Block
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">
                      Health Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lime-500/10">
                  {validators.map((validator, index) => (
                    <tr 
                      key={validator.address}
                      className="hover:bg-lime-500/5 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-lime-300">
                          #{index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/address/${validator.address}`}
                          className="text-lime-300 hover:text-white font-mono text-sm transition-colors"
                        >
                          {validator.address.slice(0, 10)}...{validator.address.slice(-8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-medium">
                          {validator.blocksProposed.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-medium">
                          {validator.blocksValidated.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-white font-medium mr-2">
                            {validator.stake}
                          </div>
                          <div className="w-24 bg-lime-500/10 rounded-full h-2">
                            <div 
                              className="bg-lime-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, validator.percentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-lime-300/70">
                          <Link 
                            href={`/block/${validator.lastBlockNumber}`}
                            className="hover:text-white transition-colors"
                          >
                            #{validator.lastBlockNumber}
                          </Link>
                          <div className="text-xs text-lime-300/50 mt-1">
                            {formatTimestamp(validator.lastBlockTime)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getHealthStatusBadge(validator.healthStatus)}`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${validator.healthStatus === 'active' ? 'bg-green-400' : validator.healthStatus === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                          {validator.healthStatus.charAt(0).toUpperCase() + validator.healthStatus.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Footer */}
        {!loading && !error && validators.length > 0 && (
          <div className="mt-6 text-center text-sm text-lime-300/50">
            <p>
              Showing validator statistics for blocks {blockRange.start.toLocaleString()} to {blockRange.end.toLocaleString()}
            </p>
            <p className="mt-1">
              Data updates automatically every 30 seconds
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
