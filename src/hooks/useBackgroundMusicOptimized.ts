'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

interface UseBackgroundMusicOptions {
  preload?: boolean
  enableWebAudio?: boolean
  bufferSize?: number
}

export function useBackgroundMusicOptimized(
  src: string, 
  defaultVolume: number = 0.15,
  options: UseBackgroundMusicOptions = {}
) {
  const { 
    preload = true, 
    enableWebAudio = false, // Web Audio API for better performance
    bufferSize = 4096 
  } = options
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentVolume, setCurrentVolume] = useState(defaultVolume)

  // Load saved play state from localStorage on mount
  useEffect(() => {
    const savedPlayState = localStorage.getItem('backgroundMusicPlaying');
    if (savedPlayState !== null) {
      setIsPlaying(JSON.parse(savedPlayState));
    }
  }, []);
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize audio system
  const initializeAudio = useCallback(async () => {
    if (isInitializedRef.current) return
    
    try {
      if (enableWebAudio && window.AudioContext) {
        // Use Web Audio API for better performance
        audioContextRef.current = new AudioContext()
        gainNodeRef.current = audioContextRef.current.createGain()
        gainNodeRef.current.connect(audioContextRef.current.destination)
        gainNodeRef.current.gain.value = currentVolume
        
        // Load and decode audio
        const response = await fetch(src)
        const arrayBuffer = await response.arrayBuffer()
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer)
        
        setIsLoaded(true)
      } else {
        // Fallback to HTML5 Audio with optimizations
        audioRef.current = new Audio()
        audioRef.current.src = src
        audioRef.current.loop = true
        audioRef.current.volume = currentVolume
        audioRef.current.preload = preload ? 'auto' : 'metadata'
        
        // Optimize for performance
        audioRef.current.crossOrigin = 'anonymous'
        
        const handleCanPlay = () => {
          setIsLoaded(true)
          audioRef.current?.removeEventListener('canplaythrough', handleCanPlay)
        }
        
        const handleError = (e: Event) => {
          console.warn('Audio loading failed:', e)
          audioRef.current?.removeEventListener('error', handleError)
        }
        
        audioRef.current.addEventListener('canplaythrough', handleCanPlay)
        audioRef.current.addEventListener('error', handleError)
        
        if (preload) {
          audioRef.current.load()
        }
      }
      
      isInitializedRef.current = true
    } catch (error) {
      console.warn('Audio initialization failed:', error)
    }
  }, [src, currentVolume, enableWebAudio, preload])

  // Optimized play function
  const play = useCallback(async () => {
    if (!isInitializedRef.current) {
      await initializeAudio()
    }
    
    try {
      if (enableWebAudio && audioContextRef.current && audioBufferRef.current && gainNodeRef.current) {
        // Stop current source if playing
        if (sourceRef.current) {
          sourceRef.current.stop()
        }
        
        // Create new source
        sourceRef.current = audioContextRef.current.createBufferSource()
        sourceRef.current.buffer = audioBufferRef.current
        sourceRef.current.loop = true
        sourceRef.current.connect(gainNodeRef.current)
        
        // Resume context if suspended (browser autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume()
        }
        
        sourceRef.current.start()
        setIsPlaying(true)
      } else if (audioRef.current) {
        await audioRef.current.play()
        setIsPlaying(true)
        localStorage.setItem('backgroundMusicPlaying', 'true');
      }
    } catch (error) {
      console.warn('Audio play failed:', error)
    }
  }, [enableWebAudio])

  // Optimized pause function
  const pause = useCallback(async () => {
    try {
      if (enableWebAudio && sourceRef.current) {
        sourceRef.current.stop()
        sourceRef.current = null
        setIsPlaying(false)
        localStorage.setItem('backgroundMusicPlaying', 'false');
      } else if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
        localStorage.setItem('backgroundMusicPlaying', 'false');
      }
    } catch (error) {
      console.warn('Audio pause failed:', error)
    }
  }, [enableWebAudio])

  // Toggle play/pause
  const toggle = useCallback(() => {
    const newPlayState = !isPlaying;
    if (isPlaying) {
      pause()
    } else {
      play()
    }
    // Save play state to localStorage
    localStorage.setItem('backgroundMusicPlaying', JSON.stringify(newPlayState));
  }, [isPlaying, play, pause])

  // Optimized volume control
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    setCurrentVolume(clampedVolume)
    
    if (enableWebAudio && gainNodeRef.current) {
      // Smooth volume changes to prevent audio pops
      gainNodeRef.current.gain.setTargetAtTime(clampedVolume, audioContextRef.current!.currentTime, 0.1)
    } else if (audioRef.current) {
      audioRef.current.volume = clampedVolume
    }
  }, [enableWebAudio])

  // Auto-play on user interaction (optimized)
  useEffect(() => {
    if (!isLoaded) return
    
    let hasInteracted = false
    
    const handleInteraction = () => {
      if (!hasInteracted && !isPlaying) {
        hasInteracted = true
        play()
        // Remove listeners after first interaction for performance
        document.removeEventListener('click', handleInteraction)
        document.removeEventListener('keydown', handleInteraction)
        document.removeEventListener('touchstart', handleInteraction)
      }
    }
    
    // Use passive listeners for better performance
    document.addEventListener('click', handleInteraction, { passive: true })
    document.addEventListener('keydown', handleInteraction, { passive: true })
    document.addEventListener('touchstart', handleInteraction, { passive: true })
    
    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [isLoaded, isPlaying, play])

  // Initialize on mount
  useEffect(() => {
    if (preload) {
      initializeAudio()
    }
  }, [initializeAudio, preload])

  // Cleanup
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  return {
    isPlaying,
    isLoaded,
    currentVolume,
    toggle,
    play,
    pause,
    setVolume
  }
}
