'use client'

import Link from 'next/link'
import { EnhancedTransaction, RitualTransactionType, rethClient } from '@/lib/reth-client'
import { TransactionTypeBadge, SystemAccountBadge } from './TransactionTypeBadge'

interface EnhancedTransactionDetailsProps {
  transaction: EnhancedTransaction
}

export function EnhancedTransactionDetails({ transaction }: EnhancedTransactionDetailsProps) {
  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const formatValue = (value: string) => {
    try {
      const wei = parseInt(value, 16)
      const ritual = wei / 1e18
      return ritual.toFixed(6)
    } catch {
      return '0'
    }
  }

  return (
    <div className="bg-white/5 border border-lime-500/20 rounded-lg">
      <div className="divide-y divide-lime-500/10">
        
        {/* Transaction Hash & Type */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3 text-lime-400">
            <span className="w-4 h-4">#</span>
            <span className="text-sm font-medium">Transaction Hash:</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-white font-mono text-sm">{transaction.hash}</span>
            <TransactionTypeBadge type={transaction.type} />
          </div>
        </div>

        {/* From Address */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3 text-lime-400">
            <span className="w-4 h-4">←</span>
            <span className="text-sm font-medium">From:</span>
          </div>
          <div className="flex items-center space-x-3">
            <Link href={`/address/${transaction.from}`} className="text-lime-300 hover:text-white font-mono text-sm">
              {transaction.from}
            </Link>
            <SystemAccountBadge address={transaction.from} />
          </div>
        </div>

        {/* To Address */}
        {transaction.to && (
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3 text-lime-400">
              <span className="w-4 h-4">→</span>
              <span className="text-sm font-medium">To:</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href={`/address/${transaction.to}`} className="text-lime-300 hover:text-white font-mono text-sm">
                {transaction.to}
              </Link>
              <SystemAccountBadge address={transaction.to} />
            </div>
          </div>
        )}

        {/* Value */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3 text-lime-400">
            <span className="w-4 h-4">💰</span>
            <span className="text-sm font-medium">Value:</span>
          </div>
          <div className="text-white">{formatValue(transaction.value)} RITUAL</div>
        </div>

        {/* Ritual-Specific Fields */}
        {transaction.type === RitualTransactionType.SCHEDULED && (
          <>
            {/* Scheduled Transaction Fields */}
            {transaction.originTx && (
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-3 text-lime-400">
                  <span className="w-4 h-4">🔗</span>
                  <span className="text-sm font-medium">Origin Transaction:</span>
                </div>
                <Link href={`/tx/${transaction.originTx}`} className="text-lime-300 hover:text-white font-mono text-sm">
                  {shortenHash(transaction.originTx)}
                </Link>
              </div>
            )}

            {transaction.callId !== undefined && (
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-3 text-lime-400">
                  <span className="w-4 h-4">🆔</span>
                  <span className="text-sm font-medium">Call ID:</span>
                </div>
                <div className="text-white">{transaction.callId}</div>
              </div>
            )}

            {transaction.index !== undefined && (
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-3 text-lime-400">
                  <span className="w-4 h-4">📊</span>
                  <span className="text-sm font-medium">Execution Index:</span>
                </div>
                <div className="text-white">{transaction.index}</div>
              </div>
            )}

            {transaction.frequency !== undefined && (
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-3 text-lime-400">
                  <span className="w-4 h-4">⏰</span>
                  <span className="text-sm font-medium">Frequency:</span>
                </div>
                <div className="text-white">Every {transaction.frequency} blocks</div>
              </div>
            )}
          </>
        )}

        {transaction.type === RitualTransactionType.ASYNC_COMMITMENT && (
          <>
            {/* AsyncCommitment Fields */}
            {transaction.precompileAddress && (
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-3 text-lime-400">
                  <span className="w-4 h-4">🔧</span>
                  <span className="text-sm font-medium">Precompile Address:</span>
                </div>
                <Link href={`/address/${transaction.precompileAddress}`} className="text-lime-300 hover:text-white font-mono text-sm">
                  {transaction.precompileAddress}
                </Link>
              </div>
            )}

            {transaction.executorAddress && (
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-3 text-lime-400">
                  <span className="w-4 h-4">⚡</span>
                  <span className="text-sm font-medium">Executor:</span>
                </div>
                <Link href={`/address/${transaction.executorAddress}`} className="text-lime-300 hover:text-white font-mono text-sm">
                  {transaction.executorAddress}
                </Link>
              </div>
            )}
          </>
        )}

        {transaction.type === RitualTransactionType.ASYNC_SETTLEMENT && (
          <>
            {/* AsyncSettlement Fields */}
            {transaction.totalAmount && (
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-3 text-lime-400">
                  <span className="w-4 h-4">💎</span>
                  <span className="text-sm font-medium">Total Settlement:</span>
                </div>
                <div className="text-white">{formatValue(transaction.totalAmount)} RITUAL</div>
              </div>
            )}

            {transaction.executorFee && (
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-3 text-lime-400">
                  <span className="w-4 h-4">⚡</span>
                  <span className="text-sm font-medium">Executor Fee:</span>
                </div>
                <div className="text-white">{formatValue(transaction.executorFee)} RITUAL</div>
              </div>
            )}

            {transaction.commitmentFee && (
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-3 text-lime-400">
                  <span className="w-4 h-4">📝</span>
                  <span className="text-sm font-medium">Commitment Fee:</span>
                </div>
                <div className="text-white">{formatValue(transaction.commitmentFee)} RITUAL</div>
              </div>
            )}
          </>
        )}

        {/* Async Transaction Relationships */}
        {transaction.commitmentTx && (
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3 text-lime-400">
              <span className="w-4 h-4">🔗</span>
              <span className="text-sm font-medium">Commitment Transaction:</span>
            </div>
            <Link href={`/tx/${transaction.commitmentTx}`} className="text-lime-300 hover:text-white font-mono text-sm">
              {shortenHash(transaction.commitmentTx)}
            </Link>
          </div>
        )}

        {transaction.settlementTx && (
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3 text-lime-400">
              <span className="w-4 h-4">🏦</span>
              <span className="text-sm font-medium">Settlement Transaction:</span>
            </div>
            <Link href={`/tx/${transaction.settlementTx}`} className="text-lime-300 hover:text-white font-mono text-sm">
              {shortenHash(transaction.settlementTx)}
            </Link>
          </div>
        )}

        {/* SPC Calls (Async Precompile Calls) */}
        {transaction.spcCalls && transaction.spcCalls.length > 0 && (
          <div className="px-6 py-4">
            <div className="flex items-center space-x-3 text-lime-400 mb-4">
              <span className="w-4 h-4">🔧</span>
              <span className="text-sm font-medium">Async Precompile Calls ({transaction.spcCalls.length}):</span>
            </div>
            <div className="space-y-4">
              {transaction.spcCalls.map((call, index) => (
                <div key={index} className="bg-black/30 rounded-lg p-4 border border-lime-500/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-lime-400">Precompile Address:</div>
                      <Link href={`/address/${call.address}`} className="text-lime-300 hover:text-white font-mono break-all">
                        {call.address}
                      </Link>
                    </div>
                    <div>
                      <div className="text-lime-400">Caller Address:</div>
                      <Link href={`/address/${call.callerAddress}`} className="text-lime-300 hover:text-white font-mono break-all">
                        {call.callerAddress}
                      </Link>
                    </div>
                    <div>
                      <div className="text-lime-400">Block Number:</div>
                      <div className="text-white">{call.blockNumber}</div>
                    </div>
                    <div>
                      <div className="text-lime-400">Program Counter:</div>
                      <div className="text-white">{call.programCounter}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
