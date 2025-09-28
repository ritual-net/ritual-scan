'use client'

/**
 * Seamless Real-time Updates Component
 * Handles smooth, non-jarring updates for blockchain data
 */

import React, { useState, useEffect, useRef } from 'react'

interface SeamlessUpdateProps {
  children: React.ReactNode
  isUpdating?: boolean
  newItemsCount?: number
  onUpdate?: () => void
}

export function SeamlessUpdater({ children, isUpdating, newItemsCount, onUpdate }: SeamlessUpdateProps) {
  const [showPulse, setShowPulse] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isUpdating) {
      setShowPulse(true)
      const timer = setTimeout(() => setShowPulse(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isUpdating])

  return (
    <div 
      ref={containerRef}
      className={`relative transition-all duration-300 ${showPulse ? 'bg-lime-500/5 shadow-lime-500/20 shadow-lg' : ''}`}
    >
      {/* Subtle update indicator */}
      {isUpdating && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-500 via-lime-400 to-lime-500 animate-pulse" />
      )}
      
      {/* New items indicator */}
      {newItemsCount && newItemsCount > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-lime-500 text-black px-2 py-1 rounded-full text-xs font-bold animate-bounce">
            +{newItemsCount} new
          </div>
        </div>
      )}
      
      {children}
    </div>
  )
}

/**
 * Smooth List Item Component
 * For individual items that can appear/update smoothly
 */

interface SmoothItemProps {
  children: React.ReactNode
  isNew?: boolean
  isUpdated?: boolean
  delay?: number
}

export function SmoothItem({ children, isNew, isUpdated, delay = 0 }: SmoothItemProps) {
  const [show, setShow] = useState(!isNew)
  const [highlight, setHighlight] = useState(false)

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        setShow(true)
        setHighlight(true)
      }, delay)
      
      const highlightTimer = setTimeout(() => {
        setHighlight(false)
      }, delay + 3000)
      
      return () => {
        clearTimeout(timer)
        clearTimeout(highlightTimer)
      }
    }
  }, [isNew, delay])

  useEffect(() => {
    if (isUpdated) {
      setHighlight(true)
      const timer = setTimeout(() => setHighlight(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isUpdated])

  return (
    <div 
      className={`
        transition-all duration-500 ease-in-out
        ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}
        ${highlight ? 'bg-lime-500/10 border-lime-500/30 shadow-lg shadow-lime-500/20' : ''}
        ${isNew ? 'animate-fadeInDown' : ''}
      `}
    >
      {children}
    </div>
  )
}

/**
 * Real-time Counter Component
 * Updates numbers smoothly without jarring changes
 */

interface CounterProps {
  value: number
  label: string
  prefix?: string
  suffix?: string
}

export function SmoothCounter({ value, label, prefix = '', suffix = '' }: CounterProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true)
      
      // Smooth number animation
      const duration = 1000
      const steps = 30
      const increment = (value - displayValue) / steps
      let currentStep = 0
      
      const timer = setInterval(() => {
        currentStep++
        const newValue = displayValue + (increment * currentStep)
        
        if (currentStep >= steps) {
          setDisplayValue(value)
          setIsAnimating(false)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.round(newValue))
        }
      }, duration / steps)
      
      return () => clearInterval(timer)
    }
  }, [value, displayValue])

  return (
    <div className={`transition-all duration-300 ${isAnimating ? 'scale-105 text-lime-400' : ''}`}>
      <div className="text-2xl font-bold">
        {prefix}{displayValue.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-lime-200">{label}</div>
    </div>
  )
}

/**
 * Background Update Indicator
 * Shows when new data is available without forcing updates
 */

interface UpdateIndicatorProps {
  hasUpdates: boolean
  onApplyUpdates: () => void
  count: number
}

export function BackgroundUpdateIndicator({ hasUpdates, onApplyUpdates, count }: UpdateIndicatorProps) {
  if (!hasUpdates) return null

  return (
    <div className="fixed top-20 right-4 z-50 animate-slideInRight">
      <div className="bg-lime-500/20 border border-lime-500/50 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-lime-500 rounded-full animate-pulse" />
          <span className="text-lime-200 text-sm">
            {count} new item{count !== 1 ? 's' : ''} available
          </span>
          <button
            onClick={onApplyUpdates}
            className="bg-lime-500 text-black px-3 py-1 rounded text-xs font-bold hover:bg-lime-400 transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}
