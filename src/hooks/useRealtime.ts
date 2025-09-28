'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { getRealtimeManager, RealtimeUpdate, UpdateCallback } from '@/lib/realtime-websocket'

export interface RealtimeHookOptions {
  enabled?: boolean
  updateTypes?: RealtimeUpdate['type'][]
  throttleMs?: number
}

export function useRealtime(
  callback: UpdateCallback,
  options: RealtimeHookOptions = {}
) {
  const { enabled = true, updateTypes, throttleMs = 0 } = options
  const callbackRef = useRef(callback)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const componentIdRef = useRef(`comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  // Keep callback up to date
  callbackRef.current = callback

  const throttledCallback = useCallback((update: RealtimeUpdate) => {
    const now = Date.now()
    
    // Apply throttling if specified
    if (throttleMs > 0 && now - lastUpdateRef.current < throttleMs) {
      return
    }
    
    // Filter by update types if specified
    if (updateTypes && !updateTypes.includes(update.type)) {
      return
    }
    
    lastUpdateRef.current = now
    callbackRef.current(update)
  }, [updateTypes, throttleMs])

  useEffect(() => {
    if (!enabled) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      return
    }

    const manager = getRealtimeManager()
    if (manager) {
      unsubscribeRef.current = manager.subscribe(componentIdRef.current, throttledCallback)
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [enabled, throttledCallback])

  return {
    connectionStatus: getRealtimeManager()?.getConnectionStatus(),
    forceRefresh: (type: 'mempool' | 'scheduled' | 'blocks') => {
      getRealtimeManager()?.forceRefresh(type)
    }
  }
}

// Specialized hooks for common use cases
export function useBlockUpdates(callback: (blockData: any) => void, enabled = true) {
  return useRealtime(
    (update) => {
      if (update.type === 'newBlock') {
        callback(update.data)
      }
    },
    { enabled, updateTypes: ['newBlock'] }
  )
}

export function useTransactionUpdates(callback: (txData: any) => void, enabled = true) {
  return useRealtime(
    (update) => {
      if (update.type === 'newTransaction') {
        callback(update.data)
      }
    },
    { enabled, updateTypes: ['newTransaction'] }
  )
}

export function useMempoolUpdates(callback: (mempoolData: any) => void, enabled = true) {
  return useRealtime(
    (update) => {
      if (update.type === 'mempoolUpdate') {
        callback(update.data)
      }
    },
    { enabled, updateTypes: ['mempoolUpdate'], throttleMs: 1000 }
  )
}

export function useScheduledUpdates(callback: (scheduledData: any) => void, enabled = true) {
  return useRealtime(
    (update) => {
      if (update.type === 'scheduledUpdate') {
        callback(update.data)
      }
    },
    { enabled, updateTypes: ['scheduledUpdate'], throttleMs: 2000 }
  )
}

// Connection status hook
export function useRealtimeStatus() {
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    const updateStatus = () => {
      const manager = getRealtimeManager()
      if (manager) {
        setStatus(manager.getConnectionStatus())
      }
    }

    // Update status immediately
    updateStatus()

    // Update status every second
    const interval = setInterval(updateStatus, 1000)

    return () => clearInterval(interval)
  }, [])

  return status
}
