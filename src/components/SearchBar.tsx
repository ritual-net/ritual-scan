'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { rethClient } from '@/lib/reth-client'

interface SearchSuggestion {
  type: 'transaction' | 'block' | 'address' | 'recent' | 'callId' | 'precompile' | 'originTx'
  value: string
  label: string
  description?: string
  metadata?: any
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Recent searches from localStorage
  const getRecentSearches = (): SearchSuggestion[] => {
    if (typeof window === 'undefined') return []
    const recent = localStorage.getItem('ritual-recent-searches')
    if (!recent) return []
    try {
      return JSON.parse(recent).map((item: any) => ({
        ...item,
        type: 'recent' as const
      }))
    } catch {
      return []
    }
  }

  const addToRecentSearches = (suggestion: SearchSuggestion) => {
    if (typeof window === 'undefined') return
    const recent = getRecentSearches().filter(item => item.value !== suggestion.value)
    recent.unshift({ ...suggestion, type: suggestion.type })
    const limited = recent.slice(0, 5) // Keep only 5 recent searches
    localStorage.setItem('ritual-recent-searches', JSON.stringify(limited))
  }

  const detectQueryType = (input: string): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = []
    const cleanInput = input.trim()

    if (!cleanInput) {
      return getRecentSearches()
    }

    // Transaction hash (0x + 64 hex chars)
    if (/^0x[a-fA-F0-9]{64}$/.test(cleanInput)) {
      suggestions.push({
        type: 'transaction',
        value: cleanInput,
        label: 'Transaction',
        description: `View transaction details`
      })
    }

    // Partial transaction hash
    if (/^0x[a-fA-F0-9]{6,63}$/.test(cleanInput)) {
      suggestions.push({
        type: 'transaction',
        value: cleanInput,
        label: 'Transaction (partial)',
        description: 'Complete the hash to search'
      })
    }

    // Address (0x + 40 hex chars)
    if (/^0x[a-fA-F0-9]{40}$/.test(cleanInput)) {
      suggestions.push({
        type: 'address',
        value: cleanInput,
        label: 'Address',
        description: 'View address details and transactions'
      })
    }

    // Partial address
    if (/^0x[a-fA-F0-9]{6,39}$/.test(cleanInput)) {
      suggestions.push({
        type: 'address',
        value: cleanInput,
        label: 'Address (partial)',
        description: 'Complete the address to search'
      })
    }

    // Block number (numeric)
    if (/^\d+$/.test(cleanInput)) {
      const blockNum = parseInt(cleanInput)
      if (blockNum >= 0) {
        suggestions.push({
          type: 'block',
          value: cleanInput,
          label: `Block #${blockNum.toLocaleString()}`,
          description: 'View block details and transactions'
        })
      }
    }

    // ENS name (.eth)
    if (/^[a-zA-Z0-9.-]+\.eth$/.test(cleanInput)) {
      suggestions.push({
        type: 'address',
        value: cleanInput,
        label: 'ENS Name',
        description: 'Resolve ENS name to address'
      })
    }

    // RITUAL CHAIN SPECIFIC SEARCHES

    // Call ID (for scheduled transactions)
    if (/^callid:(\d+)$/i.test(cleanInput)) {
      const callId = cleanInput.match(/^callid:(\d+)$/i)?.[1]
      if (callId) {
        suggestions.push({
          type: 'callId',
          value: callId,
          label: `Scheduled Job #${callId}`,
          description: 'View scheduled transaction executions'
        })
      }
    }

    // Origin Transaction (originTx:hash)
    if (/^origin:0x[a-fA-F0-9]{64}$/i.test(cleanInput)) {
      const hash = cleanInput.replace(/^origin:/i, '')
      suggestions.push({
        type: 'originTx',
        value: hash,
        label: 'Origin Transaction',
        description: 'Find transactions related to this origin'
      })
    }

    // Precompile addresses (system precompiles)
    if (/^0x0+[0-9a-fA-F]{1,3}$/.test(cleanInput)) {
      suggestions.push({
        type: 'precompile',
        value: cleanInput,
        label: 'Precompile Contract',
        description: 'View precompile contract interactions'
      })
    }

    // System accounts detection
    if (cleanInput.toLowerCase().includes('fa7e') || 
        cleanInput.toLowerCase().includes('fa8e') || 
        cleanInput.toLowerCase().includes('fa9e')) {
      suggestions.push({
        type: 'address',
        value: cleanInput,
        label: 'System Account',
        description: 'Ritual Chain system account'
      })
    }

    // Numeric Call ID without prefix
    if (/^\d{4,}$/.test(cleanInput)) {
      const callId = parseInt(cleanInput)
      if (callId > 1000) { // Likely a call ID
        suggestions.push({
          type: 'callId',
          value: cleanInput,
          label: `Call ID ${callId}`,
          description: 'Search for scheduled transactions with this Call ID'
        })
      }
    }

    return suggestions
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    const newSuggestions = detectQueryType(value)
    setSuggestions(newSuggestions)
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev === suggestions.length - 1 ? 0 : prev + 1
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev <= 0 ? suggestions.length - 1 : prev - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          performSearch(suggestions[selectedIndex])
        } else if (suggestions.length > 0) {
          performSearch(suggestions[0])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const performSearch = async (suggestion: SearchSuggestion) => {
    if (!suggestion || searching) return

    setSearching(true)
    setShowSuggestions(false)
    
    try {
      addToRecentSearches(suggestion)
      
      switch (suggestion.type) {
        case 'transaction':
          if (/^0x[a-fA-F0-9]{64}$/.test(suggestion.value)) {
            router.push(`/tx/${suggestion.value}`)
          }
          break
        case 'block':
          router.push(`/block/${suggestion.value}`)
          break
        case 'address':
          if (/^0x[a-fA-F0-9]{40}$/.test(suggestion.value)) {
            router.push(`/address/${suggestion.value}`)
          } else if (suggestion.value.endsWith('.eth')) {
            // For now, just show a message. ENS resolution would go here
            alert('ENS resolution not yet implemented')
          }
          break
        case 'recent':
          // Re-perform the recent search
          performSearch({ ...suggestion, type: suggestion.type as any })
          break
        case 'callId':
          // Search for scheduled transactions with this Call ID
          router.push(`/scheduled?callId=${suggestion.value}`)
          break
        case 'precompile':
          // Go to address page for precompile
          router.push(`/address/${suggestion.value}`)
          break
        case 'originTx':
          // Search for transactions with this origin
          router.push(`/tx/${suggestion.value}`)
          break
      }
      
      setQuery('')
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query || getRecentSearches().length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder="Search by Address / Txn Hash / Block / Call ID / Origin Tx"
          className="w-full pl-10 pr-4 py-3 bg-black/50 border border-lime-500/30 rounded-lg text-white placeholder-lime-300/60 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400 backdrop-blur-sm"
          disabled={searching}
        />
        {searching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-lime-400"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-black/95 backdrop-blur-sm border border-lime-500/30 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.value}-${index}`}
              className={`px-4 py-3 cursor-pointer border-b border-lime-500/10 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-lime-500/20'
                  : 'hover:bg-lime-500/10'
              }`}
              onClick={() => performSearch(suggestion)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      suggestion.type === 'transaction' ? 'bg-lime-800/30 text-lime-300' :
                      suggestion.type === 'block' ? 'bg-white/20 text-white' :
                      suggestion.type === 'address' ? 'bg-lime-600/30 text-lime-200' :
                      suggestion.type === 'callId' ? 'bg-purple-800/30 text-purple-300' :
                      suggestion.type === 'precompile' ? 'bg-orange-800/30 text-orange-300' :
                      suggestion.type === 'originTx' ? 'bg-blue-800/30 text-blue-300' :
                      'bg-gray-800/30 text-gray-300'
                    }`}>
                      {suggestion.type === 'recent' ? '📅' : 
                       suggestion.type === 'transaction' ? '📜' :
                       suggestion.type === 'block' ? '⏹️' :
                       suggestion.type === 'callId' ? '🔄' :
                       suggestion.type === 'precompile' ? '⚙️' :
                       suggestion.type === 'originTx' ? '🔗' : '👤'}
                      {suggestion.label}
                    </span>
                    <span className="text-white font-mono text-sm truncate">
                      {suggestion.value}
                    </span>
                  </div>
                  {suggestion.description && (
                    <p className="text-lime-300/80 text-xs mt-1">
                      {suggestion.description}
                    </p>
                  )}
                </div>
                <div className="text-lime-400 text-xs">
                  Press Enter
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
