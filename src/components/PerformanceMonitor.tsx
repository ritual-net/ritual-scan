'use client'
import { useState, useEffect, useRef } from 'react'

interface PerformanceStats {
  fps: number
  memory: number
  frameTime: number
  quality: string
}

export function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    memory: 0,
    frameTime: 0,
    quality: 'medium'
  })
  const [isVisible, setIsVisible] = useState(false)
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const frameTimesRef = useRef<number[]>([])

  useEffect(() => {
    let animationId: number

    const measurePerformance = () => {
      const now = performance.now()
      frameCountRef.current++
      
      // Calculate frame time
      const frameTime = now - lastTimeRef.current
      frameTimesRef.current.push(frameTime)
      
      // Keep only last 60 frames for average
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift()
      }
      
      // Update stats every second
      if (frameCountRef.current % 60 === 0) {
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
        const fps = Math.round(1000 / avgFrameTime)
        
        // Get memory usage if available
        const memory = (performance as any).memory 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : 0
        
        // Detect quality based on performance
        let quality = 'high'
        if (fps < 30) quality = 'low'
        else if (fps < 50) quality = 'medium'
        
        setStats({
          fps,
          memory,
          frameTime: Math.round(avgFrameTime * 100) / 100,
          quality
        })
      }
      
      lastTimeRef.current = now
      animationId = requestAnimationFrame(measurePerformance)
    }

    measurePerformance()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isVisible])

  if (!isVisible) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-black/50 text-lime-400 px-2 py-1 rounded text-xs hover:bg-black/70"
          title="Show Performance Monitor (Ctrl+Shift+P)"
        >
          📊
        </button>
      </div>
    )
  }

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400'
    if (fps >= 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-lime-500/20 rounded-lg p-3 text-xs font-mono">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lime-400 font-semibold">Performance</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white ml-2"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-300">FPS:</span>
          <span className={getFpsColor(stats.fps)}>{stats.fps}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-300">Frame:</span>
          <span className="text-blue-400">{stats.frameTime}ms</span>
        </div>
        
        {stats.memory > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-300">Memory:</span>
            <span className="text-purple-400">{stats.memory}MB</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-300">Quality:</span>
          <span className={getQualityColor(stats.quality)}>{stats.quality}</span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-gray-400 text-[10px]">
          Ctrl+Shift+P to toggle
        </div>
      </div>
    </div>
  )
}
