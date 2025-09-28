'use client'

import { useState } from 'react'
import { ContractDecoder, DecodedTransaction, DecodedEvent, DecodedMethod } from '@/lib/contract-decoder'
import Link from 'next/link'

interface ContractInteractionDisplayProps {
  transaction: any
  receipt: any
}

export function ContractInteractionDisplay({ transaction, receipt }: ContractInteractionDisplayProps) {
  const [showRawLogs, setShowRawLogs] = useState(false)
  
  // Decode the transaction
  const decoded = ContractDecoder.decodeTransaction(transaction, receipt)
  
  if (!decoded.method && decoded.events.length === 0 && decoded.contractInteractions.length === 0) {
    return null
  }

  return (
    <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <span className="w-6 h-6 text-lime-400">🔍</span>
          <span>Contract Interactions</span>
        </h3>
        <button
          onClick={() => setShowRawLogs(!showRawLogs)}
          className="text-xs text-lime-300 hover:text-white px-2 py-1 rounded border border-lime-500/30 hover:border-lime-400/50 transition-colors"
        >
          {showRawLogs ? 'Hide Raw Logs' : 'Show Raw Logs'}
        </button>
      </div>

      {/* Method Call Section */}
      {decoded.method && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-lime-300 mb-3">Method Call</h4>
          <MethodCallDisplay method={decoded.method} transaction={transaction} />
        </div>
      )}

      {/* Contract Interactions Overview */}
      {decoded.contractInteractions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-lime-300 mb-3">
            Contracts Involved ({decoded.contractInteractions.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {decoded.contractInteractions.map((interaction, index) => (
              <ContractCard key={index} interaction={interaction} />
            ))}
          </div>
        </div>
      )}

      {/* Events Section */}
      {decoded.events.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-lime-300 mb-3">
            Events Emitted ({decoded.events.length})
          </h4>
          <div className="space-y-3">
            {decoded.events.map((event, index) => (
              <EventDisplay key={index} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Raw Logs (Collapsible) */}
      {showRawLogs && receipt?.logs && receipt.logs.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-lime-300 mb-3">
            Raw Event Logs ({receipt.logs.length})
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {receipt.logs.map((log: any, index: number) => (
              <RawLogDisplay key={index} log={log} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MethodCallDisplay({ method, transaction }: { method: DecodedMethod, transaction: any }) {
  return (
    <div className="bg-black/30 border border-lime-500/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-mono rounded border border-blue-500/30">
            {method.signature}
          </span>
          <span className="text-white font-medium">{method.name}</span>
        </div>
        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
          {method.contractName}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-lime-300">Target Contract:</span>
          <Link 
            href={`/address/${transaction.to}`}
            className="ml-2 text-lime-400 hover:text-white font-mono"
          >
            {transaction.to?.slice(0, 10)}...{transaction.to?.slice(-8)}
          </Link>
        </div>
        <div>
          <span className="text-lime-300">Value:</span>
          <span className="ml-2 text-white">
            {transaction.value ? (parseInt(transaction.value, 16) / 1e18).toFixed(6) : '0'} RITUAL
          </span>
        </div>
      </div>

      {/* TODO: Display decoded method parameters when implemented */}
      <div className="mt-3 pt-3 border-t border-lime-500/20">
        <span className="text-lime-300 text-sm">Input Data:</span>
        <div className="mt-1 p-2 bg-black/50 rounded text-xs font-mono text-gray-300 break-all max-h-20 overflow-y-auto">
          {transaction.input || '0x'}
        </div>
      </div>
    </div>
  )
}

function ContractCard({ interaction }: { interaction: any }) {
  const badgeColor = interaction.contractName.includes('Precompile') || 
                    interaction.contractName.includes('Scheduler') ||
                    interaction.contractName.includes('Wallet')
    ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'

  return (
    <div className="bg-black/30 border border-lime-500/20 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-1 text-xs rounded border ${badgeColor}`}>
          {interaction.contractName}
        </span>
        <span className="text-xs text-lime-300 capitalize">{interaction.type}</span>
      </div>
      <Link 
        href={`/address/${interaction.address}`}
        className="text-lime-400 hover:text-white font-mono text-sm"
      >
        {interaction.address}
      </Link>
    </div>
  )
}

function EventDisplay({ event }: { event: DecodedEvent }) {
  return (
    <div className="bg-black/30 border border-lime-500/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-mono rounded border border-purple-500/30">
            Event
          </span>
          <span className="text-white font-medium">{event.name}</span>
        </div>
        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
          {event.contractName}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-lime-300">Contract:</span>
          <Link 
            href={`/address/${event.address}`}
            className="ml-2 text-lime-400 hover:text-white font-mono"
          >
            {event.address.slice(0, 10)}...{event.address.slice(-8)}
          </Link>
        </div>
        <div>
          <span className="text-lime-300">Signature:</span>
          <span className="ml-2 text-gray-300 font-mono text-xs">
            {event.signature.slice(0, 10)}...
          </span>
        </div>
      </div>

      {/* TODO: Display decoded event parameters when implemented */}
    </div>
  )
}

function RawLogDisplay({ log, index }: { log: any, index: number }) {
  return (
    <div className="bg-black/50 border border-gray-500/20 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Log {index}</span>
        <Link 
          href={`/address/${log.address}`}
          className="text-lime-400 hover:text-white font-mono text-xs"
        >
          {log.address}
        </Link>
      </div>
      
      {log.topics && log.topics.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-gray-400">Topics:</span>
          <div className="mt-1 space-y-1">
            {log.topics.map((topic: string, topicIndex: number) => (
              <div key={topicIndex} className="text-xs font-mono text-gray-300 break-all">
                [{topicIndex}] {topic}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {log.data && log.data !== '0x' && (
        <div>
          <span className="text-xs text-gray-400">Data:</span>
          <div className="mt-1 text-xs font-mono text-gray-300 break-all max-h-16 overflow-y-auto">
            {log.data}
          </div>
        </div>
      )}
    </div>
  )
}
