'use client'

import { useState, useEffect } from 'react'
import { getDeployedContracts, GenesisScanner } from '@/lib/genesis-scanner'
import { useParticleBackground } from '@/hooks/useParticleBackground'

export default function DebugContractsPage() {
  useParticleBackground()
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    // Override console.log to capture logs
    const originalLog = console.log
    const logBuffer: string[] = []
    
    console.log = (...args) => {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
      logBuffer.push(message)
      setLogs(prev => [...prev, message])
      originalLog(...args)
    }

    const scanContracts = async () => {
      try {
        console.log('🚀 Starting manual contract scan...')
        const foundContracts = await getDeployedContracts()
        console.log('📋 Final results:', foundContracts)
        setContracts(foundContracts)
      } catch (error) {
        console.error('❌ Scan failed:', error)
      } finally {
        setLoading(false)
        // Restore console.log
        console.log = originalLog
      }
    }

    scanContracts()
  }, [])

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Debug: Genesis Contract Scanner</h1>
        
        {loading && (
          <div className="text-lime-300 mb-4">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-lime-400 mr-2"></div>
            Scanning genesis blocks for deployed contracts...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Found Contracts */}
          <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-lime-300 mb-4">
              Found Contracts ({contracts.length})
            </h2>
            
            {contracts.length === 0 && !loading ? (
              <div className="text-red-300">No contracts found in genesis blocks 0-10</div>
            ) : (
              <div className="space-y-3">
                {contracts.map((contract, index) => (
                  <div key={index} className="bg-black/30 border border-lime-500/10 rounded p-3">
                    <div className="font-mono text-lime-400 text-sm">{contract.address}</div>
                    <div className="text-white font-medium">{contract.name}</div>
                    <div className="text-gray-400 text-sm">
                      Block {contract.deployedAt} • Creator: {contract.creator?.slice(0, 10)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scan Logs */}
          <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-lime-300 mb-4">
              Scan Logs ({logs.length})
            </h2>
            
            <div className="bg-black/50 rounded p-3 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-400 text-sm">Waiting for logs...</div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`text-xs font-mono ${
                        log.includes('❌') ? 'text-red-300' :
                        log.includes('✅') ? 'text-green-300' :
                        log.includes('🔍') ? 'text-blue-300' :
                        log.includes('📦') || log.includes('📭') ? 'text-yellow-300' :
                        'text-gray-300'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manual Actions */}
        <div className="mt-6 bg-white/5 border border-lime-500/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-lime-300 mb-4">Manual Actions</h2>
          <div className="space-x-4">
            <button
              onClick={async () => {
                setLoading(true)
                setLogs([])
                const contracts = await GenesisScanner.scanGenesisDeployments()
                setContracts(contracts)
                setLoading(false)
              }}
              className="px-4 py-2 bg-lime-600 hover:bg-lime-700 text-black rounded font-medium"
            >
              Re-scan Genesis
            </button>
            
            <button
              onClick={() => {
                setLogs([])
                setContracts([])
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Clear Results
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
