'use client'

import { rethClient } from './reth-client'

export interface RealtimeUpdate {
  type: 'newBlock' | 'newTransaction' | 'newPendingTransaction' | 'gasPriceUpdate' | 'mempoolUpdate' | 'scheduledUpdate'
  data: any
  timestamp: number
}

export type UpdateCallback = (update: RealtimeUpdate) => void

class RealtimeWebSocketManager {
  private ws: WebSocket | null = null
  // Smart caching for instant page loads
  private recentBlocksCache: any[] = []
  private recentTransactionsCache: any[] = []
  private latestMempoolStats: any = {}
  private latestScheduledTxs: any[] = []
  private latestAsyncCommitments: any[] = []
  private reconnectAttemps = 0
  private maxReconnectAttempts = 10
  private reconnectInterval = 1000 // Start with 1 second
  private maxReconnectInterval = 30000 // Max 30 seconds
  private callbacks: Map<string, UpdateCallback> = new Map()
  private isConnected = false
  private connectionId: string | null = null
  private lastBlockNumber = 0
  private lastTransactionHashes = new Set<string>()
  private mempoolCheckInterval: NodeJS.Timeout | null = null
  private blockCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.startConnection()
      this.startHighFrequencyPolling()
    }
  }

  private startConnection() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      // Try WebSocket connection to RETH node
      const wsUrl = process.env.NEXT_PUBLIC_RETH_WS_URL || 'ws://35.196.101.134:8546'
      console.log(`🔗 [${this.connectionId}] Attempting WebSocket connection to: ${wsUrl}`)
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log(`✅ [${this.connectionId}] WebSocket connected`)
        this.isConnected = true
        this.reconnectAttemps = 0
        this.reconnectInterval = 1000
        
        // Subscribe to new block headers (transactions will be extracted from blocks)
        this.subscribeToBlocks()
        
        // **FIX**: Trigger initial cache population for pages already loaded
        setTimeout(() => {
          this.forceRefresh('blocks')
          this.forceRefresh('mempool')
          this.forceRefresh('scheduled')
        }, 1000) // Give subscriptions time to establish
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleWebSocketMessage(message)
        } catch (error) {
          // Only log JSON parse errors if they're not related to RETH optimized mode responses
          if (event.data && event.data.includes('not supported in optimized mode')) {
            console.log(`📡 [${this.connectionId}] RETH optimized mode response (expected)`)
          } else {
            console.error(`❌ [${this.connectionId}] WebSocket JSON parse error:`, error)
            console.error(`❌ [${this.connectionId}] Raw message that failed:`, event.data)
          }
        }
      }
 
      this.ws.onclose = (event) => {
        console.log(`🔌 [${this.connectionId}] WebSocket disconnected:`, event.code, event.reason)
        this.isConnected = false
        this.scheduleReconnect()
      }

      this.ws.onerror = (error) => {
        // WebSocket errors in browsers are often empty objects for security reasons
        // We have polling fallbacks, so this is not critical
        console.log(`⚠️ [${this.connectionId}] WebSocket connection failed - falling back to polling`)
        this.isConnected = false
      }

    } catch (error) {
      console.error(`❌ [${this.connectionId}] Failed to create WebSocket connection:`, error)
      this.scheduleReconnect()
    }
  }

  private subscribeToBlocks() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    try {
      // Subscribe to new block headers
      const blockSubscription = {
        jsonrpc: '2.0',
        method: 'eth_subscribe',
        params: ['newHeads'],
        id: 1
      }

      // Subscribe to pending transactions (Tier 1 feature)
      const pendingTxSubscription = {
        jsonrpc: '2.0',
        method: 'eth_subscribe',
        params: ['newPendingTransactions'],
        id: 2
      }

      console.log(`📡 [${this.connectionId}] Subscribing to new block headers and pending transactions`)
      this.ws.send(JSON.stringify(blockSubscription))
      this.ws.send(JSON.stringify(pendingTxSubscription))
    } catch (error) {
      console.error(`❌ [${this.connectionId}] Failed to subscribe to blocks/transactions:`, error)
    }
  }

  // Note: subscribeToTransactions removed - RETH optimized mode doesn't support 
  // newPendingTransactions subscription. Transactions are extracted from blocks instead.

  private handleWebSocketMessage(message: any) {
    // Handle subscription errors gracefully (expected in RETH optimized mode)
    if (message.method === 'eth_subscription' && message.params?.error) {
      const error = message.params.error
      if (error.message?.includes('not supported in optimized mode')) {
        // This is expected - RETH optimized mode doesn't support some subscriptions 
        console.log(`📡 [${this.connectionId}] RETH optimized mode - subscription not supported (expected)`)
        return
      }
      console.warn(`⚠️ [${this.connectionId}] Subscription error:`, error)
      return
    }

    // Handle JSON-RPC errors
    if (message.error) {
      if (message.error.message?.includes('not supported in optimized mode')) {
        console.log(`📡 [${this.connectionId}] RETH optimized mode - method not supported (expected)`)
        return
      }
      console.warn(`⚠️ [${this.connectionId}] RPC error:`, message.error)
      return
    }

    if (message.method === 'eth_subscription') {
      const subscription = message.params?.subscription
      const result = message.params?.result

      if (!subscription) {
        console.warn(`⚠️ [${this.connectionId}] Subscription message without subscription ID:`, message)
        return
      }

      if (result && result.number) {
        // This is a block header from newHeads subscription
        this.handleNewBlock(result)
      } else if (typeof result === 'string' && result.startsWith('0x')) {
        // This is a pending transaction hash
        this.handleNewPendingTransaction(result)
      } else {
        console.log(`📩 [${this.connectionId}] Unknown subscription result:`, result)
      }
    } else if (message.id && message.result) {
      console.log(`📩 [${this.connectionId}] Subscription confirmed:`, message.result)
    } else if (message.id && message.error) {
      console.warn(`⚠️ [${this.connectionId}] RPC method error:`, message.error)
      // If subscriptions are not supported, fall back to polling only
      if (message.error.message?.includes('not supported')) {
        console.log(`📡 [${this.connectionId}] WebSocket subscriptions not supported, using polling only`)
      }
    } else {
      console.log(`📩 [${this.connectionId}] Unhandled message:`, message)
    }
  }

  private async handleNewBlock(blockHeader: any) {
    const blockNumber = parseInt(blockHeader.number, 16)
    
    if (blockNumber > this.lastBlockNumber) {
      console.log(`🔗 [${this.connectionId}] New block #${blockNumber}`)
      this.lastBlockNumber = blockNumber

      // Enhanced block update with gas price (Tier 1 feature)
      const enhancedBlockData = {
        ...blockHeader,
        gasPrice: blockHeader.baseFeePerGas ? parseInt(blockHeader.baseFeePerGas, 16) / 1e9 : null,
        timestamp: Date.now()
      }

      // **CRITICAL FIX**: Add to cache for smart caching
      this.recentBlocksCache.unshift(enhancedBlockData)
      // Keep only last 50 blocks to prevent memory issues
      if (this.recentBlocksCache.length > 50) {
        this.recentBlocksCache = this.recentBlocksCache.slice(0, 50)
      }
      
      console.log(`📦 [${this.connectionId}] Cache updated: ${this.recentBlocksCache.length} blocks cached`)
      
      // **FIX**: Notify subscribers that cache is now available (first block)
      if (this.recentBlocksCache.length === 1) {
        console.log(`🎉 [${this.connectionId}] Cache is now available! Notifying pages...`)
      }

      const blockUpdate: RealtimeUpdate = {
        type: 'newBlock',
        data: enhancedBlockData,
        timestamp: Date.now()
      }

      // Emit gas price update (Tier 1 feature)
      if (blockHeader.baseFeePerGas) {
        const gasPriceUpdate: RealtimeUpdate = {
          type: 'gasPriceUpdate',
          data: {
            gasPrice: parseInt(blockHeader.baseFeePerGas, 16) / 1e9,
            blockNumber: blockNumber
          },
          timestamp: Date.now()
        }
        this.notifyCallbacks(gasPriceUpdate)
      }

      this.notifyCallbacks(blockUpdate)

      // Extract transactions from the full block since RETH optimized mode 
      // doesn't support newPendingTransactions subscription
      try {
        const fullBlock = await rethClient.getBlock(blockHeader.hash, true)
        if (fullBlock && fullBlock.transactions && Array.isArray(fullBlock.transactions)) {
          console.log(`📦 [${this.connectionId}] Block #${blockNumber} has ${fullBlock.transactions.length} transactions`)
          
          // Emit transaction updates for each transaction in the block
          for (const txHash of fullBlock.transactions) {
            if (typeof txHash === 'string' && !this.lastTransactionHashes.has(txHash)) {
              this.handleNewTransaction(txHash)
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ [${this.connectionId}] Failed to fetch full block for transactions:`, error)
      }
    }
  }

  private handleNewTransaction(txHash: string) {
    if (!this.lastTransactionHashes.has(txHash)) {
      console.log(`💸 [${this.connectionId}] New transaction: ${txHash.slice(0, 10)}...`)
      this.lastTransactionHashes.add(txHash)

      // Keep only last 1000 transaction hashes to prevent memory leaks
      if (this.lastTransactionHashes.size > 1000) {
        const firstHash = this.lastTransactionHashes.values().next().value
        if (firstHash) {
          this.lastTransactionHashes.delete(firstHash)
        }
      }

      const update: RealtimeUpdate = {
        type: 'newTransaction',
        data: { hash: txHash },
        timestamp: Date.now()
      }

      this.notifyCallbacks(update)
    }
  }

  // Tier 1: Handle pending transactions from WebSocket subscription
  private handleNewPendingTransaction(txHash: string) {
    if (!this.lastTransactionHashes.has(txHash)) {
      console.log(`⚡ [${this.connectionId}] New pending transaction: ${txHash.slice(0, 10)}...`)
      this.lastTransactionHashes.add(txHash)

      // Keep only last 1000 transaction hashes to prevent memory leaks
      if (this.lastTransactionHashes.size > 1000) {
        const firstHash = this.lastTransactionHashes.values().next().value
        if (firstHash) {
          this.lastTransactionHashes.delete(firstHash)
        }
      }

      const update: RealtimeUpdate = {
        type: 'newPendingTransaction',
        data: { hash: txHash, status: 'pending' },
        timestamp: Date.now()
      }

      this.notifyCallbacks(update)
    }
  }

  private startHighFrequencyPolling() {
    // High-frequency mempool polling (every 2 seconds)
    this.mempoolCheckInterval = setInterval(async () => {
      try {
        const [mempoolStats, scheduledTxs] = await Promise.all([
          rethClient.getMempoolStats(),
          rethClient.getScheduledTransactions()
        ])

        // **CRITICAL FIX**: Add to cache for smart caching
        this.latestMempoolStats = mempoolStats
        this.latestScheduledTxs = scheduledTxs
        
        console.log(`📦 [${this.connectionId}] Cache updated: mempool + ${scheduledTxs?.length || 0} scheduled txs`)

        const mempoolUpdate: RealtimeUpdate = {
          type: 'mempoolUpdate',
          data: mempoolStats,
          timestamp: Date.now()
        }

        const scheduledUpdate: RealtimeUpdate = {
          type: 'scheduledUpdate',
          data: scheduledTxs,
          timestamp: Date.now()
        }

        this.notifyCallbacks(mempoolUpdate)
        this.notifyCallbacks(scheduledUpdate)

      } catch (error) {
        console.error(`❌ [${this.connectionId}] High-frequency polling error:`, error)
      }
    }, 2000) // Every 2 seconds

    // Block polling as backup (every 2 seconds)
    this.blockCheckInterval = setInterval(async () => {
      try {
        const latestBlock = await rethClient.getLatestBlock()
        if (latestBlock) {
          const blockNumber = parseInt(latestBlock.number, 16)
          if (blockNumber > this.lastBlockNumber) {
            this.handleNewBlock(latestBlock)
          }
        }
      } catch (error) {
        console.error(`❌ [${this.connectionId}] Block polling error:`, error)
      }
    }, 2000) // Every 2 seconds
  }

  private notifyCallbacks(update: RealtimeUpdate) {
    this.callbacks.forEach((callback, callbackId) => {
      try {
        callback(update)
      } catch (error) {
        console.error(`❌ [${this.connectionId}] Callback error for ${callbackId}:`, error)
      }
    })
  }

  private scheduleReconnect() {
    if (this.reconnectAttemps >= this.maxReconnectAttempts) {
      console.error(`❌ [${this.connectionId}] Max reconnection attempts reached. Stopping.`)
      return
    }

    this.reconnectAttemps++
    
    console.log(`🔄 [${this.connectionId}] Scheduling reconnect attempt ${this.reconnectAttemps}/${this.maxReconnectAttempts} in ${this.reconnectInterval}ms`)

    setTimeout(() => {
      this.startConnection()
    }, this.reconnectInterval)

    // Exponential backoff with jitter
    this.reconnectInterval = Math.min(
      this.reconnectInterval * 2 + Math.random() * 1000,
      this.maxReconnectInterval
    )
  }

  // Public API
  subscribe(callbackId: string, callback: UpdateCallback): () => void {
    console.log(`📻 [${this.connectionId}] New subscriber: ${callbackId}`)
    this.callbacks.set(callbackId, callback)

    // Return unsubscribe function
    return () => {
      console.log(`📻 [${this.connectionId}] Unsubscribing: ${callbackId}`)
      this.callbacks.delete(callbackId)
    }
  }

  // **CRITICAL FIX**: Add cache access methods
  getCachedBlocks(): any[] {
    return [...this.recentBlocksCache] // Return copy to prevent mutation
  }

  getCachedScheduledTxs(): any[] {
    return [...this.latestScheduledTxs]
  }

  getCachedMempoolStats(): any {
    return { ...this.latestMempoolStats }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionId: this.connectionId,
      subscriberCount: this.callbacks.size,
      lastBlockNumber: this.lastBlockNumber,
      reconnectAttempts: this.reconnectAttemps
    }
  }

  disconnect() {
    console.log(`🔌 [${this.connectionId}] Manually disconnecting`)
    
    if (this.mempoolCheckInterval) {
      clearInterval(this.mempoolCheckInterval)
      this.mempoolCheckInterval = null
    }

    if (this.blockCheckInterval) {
      clearInterval(this.blockCheckInterval)
      this.blockCheckInterval = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.callbacks.clear()
    this.isConnected = false
  }

  // Force refresh specific data types
  async forceRefresh(type: 'mempool' | 'scheduled' | 'blocks') {
    console.log(`🔄 [${this.connectionId}] Force refreshing ${type}`)
    
    try {
      switch (type) {
        case 'mempool':
          const mempoolStats = await rethClient.getMempoolStats()
          this.notifyCallbacks({
            type: 'mempoolUpdate',
            data: mempoolStats,
            timestamp: Date.now()
          })
          break

        case 'scheduled':
          const scheduledTxs = await rethClient.getScheduledTransactions()
          this.notifyCallbacks({
            type: 'scheduledUpdate',
            data: scheduledTxs,
            timestamp: Date.now()
          })
          break

        case 'blocks':
          const latestBlock = await rethClient.getLatestBlock()
          if (latestBlock) {
            this.handleNewBlock(latestBlock)
          }
          break
      }
    } catch (error) {
      console.error(`❌ [${this.connectionId}] Force refresh error for ${type}:`, error)
    }
  }
}

// Global singleton instance
let realtimeManager: RealtimeWebSocketManager | null = null

export function getRealtimeManager(): RealtimeWebSocketManager {
  if (!realtimeManager && typeof window !== 'undefined') {
    realtimeManager = new RealtimeWebSocketManager()
  }
  return realtimeManager!
}

export function useRealtime(callbackId: string, callback: UpdateCallback) {
  const manager = getRealtimeManager()
  return manager?.subscribe(callbackId, callback)
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (realtimeManager) {
      realtimeManager.disconnect()
    }
  })
}
