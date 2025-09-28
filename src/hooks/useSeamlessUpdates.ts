'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface SeamlessUpdateOptions<T> {
  initialData: T[]
  updateInterval?: number
  maxItems?: number
  enableBackgroundUpdates?: boolean
}

interface SeamlessUpdateState<T> {
  displayedItems: T[]
  pendingItems: T[]
  isUpdating: boolean
  newItemsCount: number
  hasBackgroundUpdates: boolean
}

/**
 * useSeamlessUpdates Hook
 * Manages smooth, non-jarring updates for real-time blockchain data
 */
export function useSeamlessUpdates<T extends { id?: string; hash?: string; timestamp?: number }>(
  options: SeamlessUpdateOptions<T>
) {
  const { initialData, updateInterval = 3000, maxItems = 50, enableBackgroundUpdates = true } = options
  
  const [state, setState] = useState<SeamlessUpdateState<T>>({
    displayedItems: initialData,
    pendingItems: [],
    isUpdating: false,
    newItemsCount: 0,
    hasBackgroundUpdates: false
  })

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const userActivityRef = useRef<number>(Date.now())

  // Track user activity to determine if we should update immediately or queue
  const updateUserActivity = useCallback(() => {
    userActivityRef.current = Date.now()
  }, [])

  useEffect(() => {
    const handleActivity = () => updateUserActivity()
    
    window.addEventListener('scroll', handleActivity)
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('click', handleActivity)
    
    return () => {
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('click', handleActivity)
    }
  }, [updateUserActivity])

  // Check if user is actively viewing (less than 2 seconds since last activity)
  const isUserActive = useCallback(() => {
    return Date.now() - userActivityRef.current < 2000
  }, [])

  // Add new items smoothly
  const addItems = useCallback((newItems: T[]) => {
    if (newItems.length === 0) return

    setState(prevState => {
      const isActive = isUserActive()
      
      if (!enableBackgroundUpdates || !isActive) {
        // Immediate update - merge and animate
        const mergedItems = [...newItems, ...prevState.displayedItems]
          .slice(0, maxItems)
          
        return {
          ...prevState,
          displayedItems: mergedItems,
          pendingItems: [],
          isUpdating: true,
          newItemsCount: newItems.length,
          hasBackgroundUpdates: false
        }
      } else {
        // Background update - queue for later
        return {
          ...prevState,
          pendingItems: [...newItems, ...prevState.pendingItems],
          hasBackgroundUpdates: true,
          newItemsCount: prevState.newItemsCount + newItems.length
        }
      }
    })

    // Clear update indicator after animation
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        isUpdating: false,
        newItemsCount: 0
      }))
    }, updateInterval)

  }, [enableBackgroundUpdates, isUserActive, maxItems, updateInterval])

  // Apply pending background updates
  const applyBackgroundUpdates = useCallback(() => {
    setState(prevState => {
      if (prevState.pendingItems.length === 0) return prevState

      const mergedItems = [...prevState.pendingItems, ...prevState.displayedItems]
        .slice(0, maxItems)
        
      return {
        ...prevState,
        displayedItems: mergedItems,
        pendingItems: [],
        isUpdating: true,
        hasBackgroundUpdates: false,
        newItemsCount: prevState.pendingItems.length
      }
    })
  }, [maxItems])

  // Update specific item (for status changes, etc.)
  const updateItem = useCallback((itemId: string, updates: Partial<T>) => {
    setState(prevState => ({
      ...prevState,
      displayedItems: prevState.displayedItems.map(item => 
        (item.id === itemId || item.hash === itemId) 
          ? { ...item, ...updates }
          : item
      ),
      isUpdating: true
    }))

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setState(prevState => ({ ...prevState, isUpdating: false }))
    }, 1000)
  }, [])

  // Replace all items (for complete refresh)
  const replaceItems = useCallback((newItems: T[]) => {
    setState(prevState => ({
      ...prevState,
      displayedItems: newItems.slice(0, maxItems),
      pendingItems: [],
      isUpdating: true,
      hasBackgroundUpdates: false,
      newItemsCount: 0
    }))
  }, [maxItems])

  return {
    // State
    items: state.displayedItems,
    isUpdating: state.isUpdating,
    newItemsCount: state.newItemsCount,
    hasBackgroundUpdates: state.hasBackgroundUpdates,
    pendingCount: state.pendingItems.length,
    
    // Actions
    addItems,
    updateItem,
    replaceItems,
    applyBackgroundUpdates,
    
    // Utils
    isUserActive: isUserActive()
  }
}

/**
 * useIncrementalStats Hook
 * For smooth counter updates without jarring changes
 */
interface StatValue {
  current: number
  previous: number
  trend: 'up' | 'down' | 'stable'
}

export function useIncrementalStats(initialStats: Record<string, number>) {
  const [stats, setStats] = useState<Record<string, StatValue>>(
    Object.fromEntries(
      Object.entries(initialStats).map(([key, value]) => [
        key, 
        { current: value, previous: value, trend: 'stable' }
      ])
    )
  )

  const updateStat = useCallback((key: string, newValue: number) => {
    setStats(prevStats => {
      const prevValue = prevStats[key]?.current || 0
      const trend = newValue > prevValue ? 'up' : newValue < prevValue ? 'down' : 'stable'
      
      return {
        ...prevStats,
        [key]: {
          current: newValue,
          previous: prevValue,
          trend
        }
      }
    })
  }, [])

  const updateStats = useCallback((newStats: Record<string, number>) => {
    Object.entries(newStats).forEach(([key, value]) => {
      updateStat(key, value)
    })
  }, [updateStat])

  return {
    stats,
    updateStat,
    updateStats
  }
}
