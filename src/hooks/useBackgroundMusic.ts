'use client'
import { useEffect, useRef, useState } from 'react';

export function useBackgroundMusic(src: string, volume = 0.2) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(src);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    audioRef.current.preload = 'auto';
    
    const audio = audioRef.current;
    
    const handleCanPlay = () => {
      setIsLoaded(true);
      console.log('🎵 Background music loaded and ready');
    };

    const handleLoadError = (e: any) => {
      console.warn('🎵 Failed to load background music:', e);
    };

    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('error', handleLoadError);
    
    // Auto-play attempt (will be blocked by most browsers)
    const attemptAutoPlay = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
        console.log('🎵 Auto-play successful');
      } catch (error) {
        console.log('🎵 Auto-play blocked, waiting for user interaction');
        
        // Set up click listener for first user interaction
        const playOnFirstClick = async () => {
          try {
            await audio.play();
            setIsPlaying(true);
            console.log('🎵 Music started after user interaction');
            document.removeEventListener('click', playOnFirstClick);
            document.removeEventListener('keydown', playOnFirstClick);
            document.removeEventListener('touchstart', playOnFirstClick);
          } catch (playError) {
            console.warn('🎵 Failed to play after user interaction:', playError);
          }
        };
        
        document.addEventListener('click', playOnFirstClick);
        document.addEventListener('keydown', playOnFirstClick);
        document.addEventListener('touchstart', playOnFirstClick);
        
        // Cleanup function will remove these listeners
        return () => {
          document.removeEventListener('click', playOnFirstClick);
          document.removeEventListener('keydown', playOnFirstClick);
          document.removeEventListener('touchstart', playOnFirstClick);
        };
      }
    };

    // Try auto-play after a short delay
    const autoPlayTimer = setTimeout(attemptAutoPlay, 1000);
    
    return () => {
      clearTimeout(autoPlayTimer);
      audio.pause();
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('error', handleLoadError);
    };
  }, [src, volume]);

  const toggle = async () => {
    if (audioRef.current && isLoaded) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
          console.log('🎵 Music paused');
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
          console.log('🎵 Music resumed');
        }
      } catch (error) {
        console.warn('🎵 Toggle failed:', error);
      }
    }
  };

  const setVolume = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  };

  return { 
    isPlaying, 
    isLoaded, 
    toggle, 
    setVolume,
    currentVolume: audioRef.current?.volume || volume
  };
}
