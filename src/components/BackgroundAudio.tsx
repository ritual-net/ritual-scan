'use client'
import { useState, useEffect } from 'react';
import { useBackgroundMusicOptimized } from '@/hooks/useBackgroundMusicOptimized';
import { Volume2, VolumeX, Music } from 'lucide-react';

export function BackgroundAudio() {
  const { isPlaying, isLoaded, toggle, setVolume, currentVolume } = useBackgroundMusicOptimized('/anninimouse.mp3', 0.15, {
    preload: true,
    enableWebAudio: true
  });
  const [showControls, setShowControls] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0.15);

  useEffect(() => {
    setVolume(volumeLevel);
  }, [volumeLevel, setVolume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeLevel(newVolume);
  };

  if (!isLoaded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="p-3 rounded-full bg-gray-800/50 border border-gray-600/50">
          <Music size={20} className="text-gray-500 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Main Control Button */}
      <button
        onClick={toggle}
        className={`
          p-3 rounded-full backdrop-blur-sm transition-all duration-300 transform
          ${isPlaying 
            ? 'bg-lime-500/20 border border-lime-500/50 text-lime-400 shadow-lg shadow-lime-500/20' 
            : 'bg-gray-800/50 border border-gray-600/50 text-gray-400'
          }
          hover:scale-110 hover:bg-lime-500/30 active:scale-95
        `}
        title={isPlaying ? 'Pause anninimouse' : 'Play anninimouse'}
      >
        {isPlaying ? (
          <Volume2 size={20} className="animate-pulse" />
        ) : (
          <VolumeX size={20} />
        )}
      </button>
      
      {/* Extended Controls */}
      <div className={`
        absolute bottom-full right-0 mb-2 p-3 bg-black/90 backdrop-blur-sm rounded-lg 
        border border-lime-500/20 transition-all duration-300 min-w-[200px]
        ${showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}
      `}>
        {/* Track Info */}
        <div className="text-center mb-3">
          <div className="text-lime-300 font-medium text-sm">anninimouse</div>
          <div className="text-gray-400 text-xs">Background Theme</div>
          <div className={`text-xs mt-1 ${isPlaying ? 'text-lime-400' : 'text-gray-500'}`}>
            {isPlaying ? '🎵 Playing' : '⏸️ Paused'}
          </div>
        </div>
        
        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Volume</span>
            <span className="text-xs text-lime-300">{Math.round(volumeLevel * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.05"
            value={volumeLevel}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #84cc16 0%, #84cc16 ${(volumeLevel / 0.5) * 100}%, #374151 ${(volumeLevel / 0.5) * 100}%, #374151 100%)`
            }}
          />
        </div>
        
        {/* Quick Actions */}
        <div className="flex justify-between mt-3 gap-2">
          <button
            onClick={() => setVolumeLevel(0)}
            className="text-xs px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded text-gray-300 transition-colors"
          >
            Mute
          </button>
          <button
            onClick={() => setVolumeLevel(0.15)}
            className="text-xs px-2 py-1 bg-lime-500/20 hover:bg-lime-500/30 rounded text-lime-300 transition-colors"
          >
            Default
          </button>
          <button
            onClick={() => setVolumeLevel(0.3)}
            className="text-xs px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded text-gray-300 transition-colors"
          >
            Loud
          </button>
        </div>
      </div>

      {/* Floating indicator when playing */}
      {isPlaying && (
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/50" />
      )}
    </div>
  );
}

/* Custom slider styles */
<style jsx>{`
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #84cc16;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(132, 204, 22, 0.5);
  }
  
  .slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #84cc16;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 8px rgba(132, 204, 22, 0.5);
  }
`}</style>
