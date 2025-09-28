'use client'

import { useState, useEffect } from 'react'
import { rethClient, EnhancedTransaction, RitualTransactionType } from '@/lib/reth-client'
import { TransactionTypeBadge } from './TransactionTypeBadge'
import Link from 'next/link'

interface AsyncTransactionFlowProps {
  transaction: EnhancedTransaction
}

interface TransactionChain {
  userTransaction?: EnhancedTransaction
  commitmentTransaction?: EnhancedTransaction
  settlementTransaction?: EnhancedTransaction
}

export function AsyncTransactionFlow({ transaction }: AsyncTransactionFlowProps) {
  const [chain, setChain] = useState<TransactionChain>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔍 AsyncTransactionFlow mounted for transaction:', transaction.hash, 'type:', transaction.type)
    loadTransactionChain()
  }, [transaction.hash])

  const loadTransactionChain = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔗 Loading async transaction chain for:', transaction.hash)
      console.log('🔍 Transaction type:', transaction.type)
      console.log('🔍 Has commitmentTx:', !!transaction.commitmentTx)
      console.log('🔍 Has settlementTx:', !!transaction.settlementTx)
      
      const newChain: TransactionChain = {}

      // If this is a commitment transaction, load the original user transaction
      if (transaction.type === RitualTransactionType.ASYNC_COMMITMENT && transaction.originTx) {
        const userTx = await rethClient.getEnhancedTransaction(transaction.originTx)
        if (userTx) {
          newChain.userTransaction = userTx
          newChain.commitmentTransaction = transaction
          
          // Look for settlement transaction
          if (userTx.settlementTx) {
            const settlementTx = await rethClient.getEnhancedTransaction(userTx.settlementTx)
            if (settlementTx) {
              newChain.settlementTransaction = settlementTx
            }
          }
        }
      }
      
      // If this is a settlement transaction with commitmentTx, handle it specially
      else if (transaction.type === RitualTransactionType.ASYNC_SETTLEMENT && transaction.commitmentTx) {
        console.log('🔄 Settlement transaction with commitmentTx field detected')
        newChain.settlementTransaction = transaction
        
        // Load the commitment transaction
        if (transaction.commitmentTx) {
          const commitmentTx = await rethClient.getEnhancedTransaction(transaction.commitmentTx)
          if (commitmentTx) {
            console.log('✅ Found commitment transaction:', commitmentTx.hash)
            newChain.commitmentTransaction = commitmentTx
            
            // Try to find the original user transaction via the commitment's originTx
            if (commitmentTx.originTx) {
              const userTx = await rethClient.getEnhancedTransaction(commitmentTx.originTx)
              if (userTx) {
                console.log('✅ Found original user transaction:', userTx.hash)
                newChain.userTransaction = userTx
              }
            }
          } else {
            console.log('❌ Failed to load commitment transaction')
          }
        }
      }
      
      // If this is a user transaction with async fields, load related transactions
      else if (transaction.commitmentTx || transaction.settlementTx) {
        newChain.userTransaction = transaction
        
        if (transaction.commitmentTx) {
          const commitmentTx = await rethClient.getEnhancedTransaction(transaction.commitmentTx)
          if (commitmentTx) {
            newChain.commitmentTransaction = commitmentTx
          }
        }
        
        if (transaction.settlementTx) {
          const settlementTx = await rethClient.getEnhancedTransaction(transaction.settlementTx)
          if (settlementTx) {
            newChain.settlementTransaction = settlementTx
          }
        }
      }
      
      // If this is a settlement transaction, load the chain backwards
      else if (transaction.type === RitualTransactionType.ASYNC_SETTLEMENT && transaction.originTx) {
        console.log('🔄 This is a settlement transaction, loading full chain backwards...')
        const userTx = await rethClient.getEnhancedTransaction(transaction.originTx)
        if (userTx) {
          console.log('✅ Found original user transaction:', userTx.hash)
          newChain.userTransaction = userTx
          newChain.settlementTransaction = transaction
          
          if (userTx.commitmentTx) {
            console.log('🔍 Loading commitment transaction:', userTx.commitmentTx)
            const commitmentTx = await rethClient.getEnhancedTransaction(userTx.commitmentTx)
            if (commitmentTx) {
              console.log('✅ Found commitment transaction:', commitmentTx.hash)
              newChain.commitmentTransaction = commitmentTx
            } else {
              console.log('❌ Failed to load commitment transaction')
            }
          } else {
            console.log('❌ User transaction has no commitmentTx field, will show 3-step flow without commitment')
            // For now, we'll show a simplified flow without the commitment transaction
            // In a production environment, you might want to implement a more sophisticated
            // search through recent blocks to find the commitment transaction
          }
        } else {
          console.log('❌ Failed to load original user transaction')
        }
      }
      
      // Special handling: If we're viewing any transaction that might be part of an async flow
      // but the above logic didn't catch it, try to detect and reconstruct the chain
      else {
        console.log('🔍 Attempting to detect async flow from transaction context...')
        
        // Check if this transaction has async-related fields or is from system accounts
        const isAsyncRelated = 
          transaction.commitmentTx || 
          transaction.settlementTx ||
          transaction.from === '0x000000000000000000000000000000000000fa8e' || // Commitment system account
          transaction.from === '0x000000000000000000000000000000000000fa9e' || // Settlement system account
          (transaction.to && (
            transaction.to === '0x000000000000000000000000000000000000fa8e' ||
            transaction.to === '0x000000000000000000000000000000000000fa9e'
          ))
          
        if (isAsyncRelated) {
          console.log('🎯 Detected async-related transaction, attempting full reconstruction...')
          
          // This might be a commitment or settlement transaction without proper originTx
          // Try to find the user transaction by looking for transactions that reference this one
          newChain.userTransaction = transaction
          
          if (transaction.commitmentTx) {
            const commitmentTx = await rethClient.getEnhancedTransaction(transaction.commitmentTx)
            if (commitmentTx) newChain.commitmentTransaction = commitmentTx
          }
          
          if (transaction.settlementTx) {
            const settlementTx = await rethClient.getEnhancedTransaction(transaction.settlementTx)
            if (settlementTx) newChain.settlementTransaction = settlementTx
          }
        }
      }

      // Debug: Log what we found
      console.log('📊 Final async chain reconstruction results:', {
        hasUserTransaction: !!newChain.userTransaction,
        hasCommitmentTransaction: !!newChain.commitmentTransaction,
        hasSettlementTransaction: !!newChain.settlementTransaction,
        userTxHash: newChain.userTransaction?.hash,
        commitmentTxHash: newChain.commitmentTransaction?.hash,
        settlementTxHash: newChain.settlementTransaction?.hash
      })
      
      console.log('🎯 Will show commitment placeholder?', 
        !newChain.commitmentTransaction && newChain.userTransaction && newChain.settlementTransaction)

      setChain(newChain)
    } catch (err) {
      console.error('❌ Error loading async transaction chain:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transaction chain')
    } finally {
      setLoading(false)
    }
  }

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

  const hasChain = chain.userTransaction || chain.commitmentTransaction || chain.settlementTransaction

  if (!hasChain) {
    return null
  }

  return (
    <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
        <span className="w-6 h-6 text-lime-400">🔗</span>
        <span>Async Transaction Flow</span>
      </h3>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-lime-400"></div>
          <span className="ml-3 text-lime-200">Loading transaction chain...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {/* Visual Flow Diagram */}
          <div className="flex items-center justify-between relative">
            {/* User Transaction */}
            {chain.userTransaction && (
              <div className="flex-1">
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 text-sm">1</span>
                    <span className="text-blue-300 font-medium">User Transaction</span>
                  </div>
                  <TransactionTypeBadge type={chain.userTransaction.type} className="mb-2" />
                  <Link 
                    href={`/tx/${chain.userTransaction.hash}`}
                    className="text-blue-300 hover:text-white font-mono text-sm block"
                  >
                    {shortenHash(chain.userTransaction.hash)}
                  </Link>
                  <div className="text-xs text-blue-400 mt-1">
                    {formatValue(chain.userTransaction.value)} RITUAL
                  </div>
                </div>
              </div>
            )}

            {/* Arrow */}
            {chain.userTransaction && (chain.commitmentTransaction || chain.settlementTransaction) && (
              <div className="px-4">
                <div className="text-lime-400 text-2xl">→</div>
              </div>
            )}

            {/* Commitment Transaction - Show placeholder if missing but we have settlement */}
            {(chain.commitmentTransaction || (chain.userTransaction && chain.settlementTransaction)) && (
              <div className="flex-1">
                <div className={`${chain.commitmentTransaction ? 'bg-orange-900/30 border-orange-500/30' : 'bg-gray-900/30 border-gray-500/30'} border rounded-lg p-4 text-center`}>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className={`w-8 h-8 ${chain.commitmentTransaction ? 'bg-orange-500/20 text-orange-300' : 'bg-gray-500/20 text-gray-400'} rounded-full flex items-center justify-center text-sm`}>2</span>
                    <span className={`${chain.commitmentTransaction ? 'text-orange-300' : 'text-gray-400'} font-medium`}>Commitment</span>
                  </div>
                  {chain.commitmentTransaction ? (
                    <>
                      <TransactionTypeBadge type={chain.commitmentTransaction.type} className="mb-2" />
                      <Link 
                        href={`/tx/${chain.commitmentTransaction.hash}`}
                        className="text-orange-300 hover:text-white font-mono text-sm block"
                      >
                        {shortenHash(chain.commitmentTransaction.hash)}
                      </Link>
                      <div className="text-xs text-orange-400 mt-1">
                        System Account
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-gray-500/20 text-gray-400 text-xs px-2 py-1 rounded mb-2">
                        Commitment Tx
                      </div>
                      <div className="text-gray-400 font-mono text-sm">
                        Not Available
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        TEE Execution
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Arrow */}
            {(chain.commitmentTransaction || chain.userTransaction) && chain.settlementTransaction && (
              <div className="px-4">
                <div className="text-lime-400 text-2xl">→</div>
              </div>
            )}

            {/* Settlement Transaction */}
            {chain.settlementTransaction && (
              <div className="flex-1">
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-300 text-sm">3</span>
                    <span className="text-green-300 font-medium">Settlement</span>
                  </div>
                  <TransactionTypeBadge type={chain.settlementTransaction.type} className="mb-2" />
                  <Link 
                    href={`/tx/${chain.settlementTransaction.hash}`}
                    className="text-green-300 hover:text-white font-mono text-sm block"
                  >
                    {shortenHash(chain.settlementTransaction.hash)}
                  </Link>
                  <div className="text-xs text-green-400 mt-1">
                    Fee Distribution
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Flow Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {chain.userTransaction && (
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2">Phase 1: User Initiates</h4>
                <ul className="text-lime-200 space-y-1">
                  <li>• User calls async precompile</li>
                  <li>• Transaction goes to mempool</li>
                  <li>• Validator detects async call</li>
                </ul>
              </div>
            )}
            
            {chain.commitmentTransaction && (
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-orange-300 font-medium mb-2">Phase 2: Commitment</h4>
                <ul className="text-lime-200 space-y-1">
                  <li>• System creates commitment</li>
                  <li>• Executor assigned</li>
                  <li>• TEE computation begins</li>
                </ul>
              </div>
            )}
            
            {chain.settlementTransaction && (
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-green-300 font-medium mb-2">Phase 3: Settlement</h4>
                <ul className="text-lime-200 space-y-1">
                  <li>• Results included in block</li>
                  <li>• Protocol fees distributed</li>
                  <li>• Execution complete</li>
                </ul>
              </div>
            )}
          </div>

          {/* Key Participants */}
          <div className="border-t border-lime-500/20 pt-4">
            <h4 className="text-lime-300 font-medium mb-3">Key Participants</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {chain.commitmentTransaction?.executorAddress && (
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  <span className="text-lime-400">Executor:</span>
                  <Link 
                    href={`/address/${chain.commitmentTransaction.executorAddress}`}
                    className="text-lime-300 hover:text-white font-mono"
                  >
                    {shortenHash(chain.commitmentTransaction.executorAddress)}
                  </Link>
                </div>
              )}
              
              {chain.commitmentTransaction?.commitmentValidator && (
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                  <span className="text-lime-400">Commitment Validator:</span>
                  <Link 
                    href={`/address/${chain.commitmentTransaction.commitmentValidator}`}
                    className="text-lime-300 hover:text-white font-mono"
                  >
                    {shortenHash(chain.commitmentTransaction.commitmentValidator)}
                  </Link>
                </div>
              )}
              
              {chain.settlementTransaction?.inclusionValidator && (
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-lime-400">Inclusion Validator:</span>
                  <Link 
                    href={`/address/${chain.settlementTransaction.inclusionValidator}`}
                    className="text-lime-300 hover:text-white font-mono"
                  >
                    {shortenHash(chain.settlementTransaction.inclusionValidator)}
                  </Link>
                </div>
              )}
              
              {chain.commitmentTransaction?.precompileAddress && (
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-lime-400 rounded-full"></span>
                  <span className="text-lime-400">Precompile:</span>
                  <Link 
                    href={`/address/${chain.commitmentTransaction.precompileAddress}`}
                    className="text-lime-300 hover:text-white font-mono"
                  >
                    {shortenHash(chain.commitmentTransaction.precompileAddress)}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
