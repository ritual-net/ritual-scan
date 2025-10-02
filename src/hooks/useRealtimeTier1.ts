'use client'

import { useEffect, useCallback, useState } from 'react'
import { getRealtimeManager, RealtimeUpdate } from '@/lib/realtime-websocket'

// Tier 1: Real-time gas price updates
export function useGasPriceUpdates(callback: (gasPrice: number, blockNumber: number) => void) {
  useEffect(() => {
    const manager = getRealtimeManager()
    if (!manager) return

    const unsubscribe = manager.subscribe('gas-price-updates', (update: RealtimeUpdate) => {
      if (update.type === 'gasPriceUpdate') {
        callback(update.data.gasPrice, update.data.blockNumber)
      }
    })

    return unsubscribe
  }, [callback])
}

// Tier 1: Real-time pending transaction stream
export function usePendingTransactionStream(callback: (txHash: string) => void) {
  useEffect(() => {
    const manager = getRealtimeManager()
    if (!manager) return

    const unsubscribe = manager.subscribe('pending-tx-stream', (update: RealtimeUpdate) => {
      if (update.type === 'newPendingTransaction') {
        callback(update.data.hash)
      }
    })

    return unsubscribe
  }, [callback])
}

// Tier 1: Enhanced mempool real-time updates
export function useEnhancedMempoolUpdates(callback: (mempoolData: any) => void) {
  useEffect(() => {
    const manager = getRealtimeManager()
    if (!manager) return

    const unsubscribe = manager.subscribe('enhanced-mempool', (update: RealtimeUpdate) => {
      if (update.type === 'mempoolUpdate') {
        callback(update.data)
      }
    })

    return unsubscribe
  }, [callback])
}

// Tier 1: Real-time block updates with gas price
export function useEnhancedBlockUpdates(callback: (blockData: any) => void) {
  useEffect(() => {
    const manager = getRealtimeManager()
    if (!manager) return

    const unsubscribe = manager.subscribe('enhanced-blocks', (update: RealtimeUpdate) => {
      if (update.type === 'newBlock') {
        callback(update.data)
      }
    })

    return unsubscribe
  }, [callback])
}

// Tier 1: Combined real-time stats hook
export function useRealtimeStats() {
  const [stats, setStats] = useState({
    latestBlock: 0,
    gasPrice: 0,
    pendingTxCount: 0,
    mempoolSize: 0,
    lastUpdate: 0
  })

  // Gas price updates
  useGasPriceUpdates(useCallback((gasPrice: number, blockNumber: number) => {
    setStats(prev => ({
      ...prev,
      gasPrice,
      latestBlock: blockNumber,
      lastUpdate: Date.now()
    }))
  }, []))

  // Mempool updates
  useEnhancedMempoolUpdates(useCallback((mempoolData: any) => {
    setStats(prev => ({
      ...prev,
      pendingTxCount: mempoolData.pending || 0,
      mempoolSize: mempoolData.totalSize || 0,
      lastUpdate: Date.now()
    }))
  }, []))

  // Block updates
  useEnhancedBlockUpdates(useCallback((blockData: any) => {
    setStats(prev => ({
      ...prev,
      latestBlock: parseInt(blockData.number, 16),
      gasPrice: blockData.gasPrice || prev.gasPrice,
      lastUpdate: Date.now()
    }))
  }, []))

  return stats
}

// Tier 1: Real-time transaction feed with status
export function useTransactionFeed(maxTransactions = 50) {
  const [transactions, setTransactions] = useState<Array<{
    hash: string
    status: 'pending' | 'confirmed'
    timestamp: number
    blockNumber?: number
  }>>([])

  // Pending transactions
  usePendingTransactionStream(useCallback((txHash: string) => {
    setTransactions(prev => {
      const newTx = {
        hash: txHash,
        status: 'pending' as const,
        timestamp: Date.now()
      }
      
      // Add to front, keep only maxTransactions
      const updated = [newTx, ...prev.slice(0, maxTransactions - 1)]
      return updated
    })
  }, [maxTransactions]))

  // Confirmed transactions (from blocks)
  useEnhancedBlockUpdates(useCallback((blockData: any) => {
    const blockNumber = parseInt(blockData.number, 16)
    
    setTransactions(prev => 
      prev.map(tx => {
        // Mark pending transactions as confirmed if they appear in a block
        // (This would need block transaction data to be fully accurate)
        return tx
      })
    )
  }, []))

  return transactions
}
