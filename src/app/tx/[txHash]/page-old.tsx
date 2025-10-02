'use client'

import { useState, useEffect } from 'react'
import { rethClient, EnhancedTransaction, RitualTransactionType } from '@/lib/reth-client'
import { TransactionTypeBadge, SystemAccountBadge } from '@/components/TransactionTypeBadge'
import { EnhancedTransactionDetails } from '@/components/EnhancedTransactionDetails'
import { AsyncTransactionFlow } from '@/components/AsyncTransactionFlow'
import Link from 'next/link'

interface TransactionDetail {
  hash: string
  blockHash: string
  blockNumber: string
  transactionIndex: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  gasUsed?: string
  status?: string
  input: string
  nonce: string
  type: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  chainId?: string
}

interface TransactionReceipt {
  status: string
  gasUsed: string
  contractAddress?: string
  logs: any[]
}

interface PageProps {
  params: {
    txHash: string
  }
}

export default function TransactionDetailPage({ params }: PageProps) {
  const [transaction, setTransaction] = useState<EnhancedTransaction | null>(null)
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTransactionDetails()
  }, [params.txHash])

  const loadTransactionDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use enhanced transaction method to get Ritual-specific fields
      const [txData, receiptData] = await Promise.all([
        rethClient.getEnhancedTransaction(params.txHash),
        rethClient.getTransactionReceipt(params.txHash).catch(() => null) // Receipt might not exist
      ])
      
      if (!txData) {
        throw new Error('Transaction not found')
      }
      
      setTransaction(txData)
      setReceipt(receiptData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transaction details')
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: string) => {
    if (!value || value === '0x0') return '0 RITUAL'
    try {
      const wei = parseInt(value, 16)
      const ritual = wei / 1e18
      return `${ritual.toFixed(6)} RITUAL`
    } catch {
      return '0 RITUAL'
    }
  }

  const formatGas = (gas: string) => {
    if (!gas) return '0'
    try {
      const gasNum = parseInt(gas, 16)
      return gasNum.toLocaleString()
    } catch {
      return '0'
    }
  }

  const formatGasPrice = (gasPrice: string) => {
    if (!gasPrice) return '0 gwei'
    try {
      const wei = parseInt(gasPrice, 16)
      const gwei = wei / 1e9
      return `${gwei.toFixed(2)} gwei`
    } catch {
      return '0 gwei'
    }
  }

  const getTransactionStatus = () => {
    if (!receipt) return { status: 'Pending', color: 'yellow' }
    const status = parseInt(receipt.status, 16)
    return status === 1 
      ? { status: 'Success', color: 'green' } 
      : { status: 'Failed', color: 'red' }
  }

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900">
        <header className="border-b border-purple-800/30 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-purple-300">
                ⚡ Ritual Explorer
              </Link>
              <nav className="flex space-x-8">
                <Link href="/" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Home</Link>
                <Link href="/blocks" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Blocks</Link>
                <Link href="/transactions" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Transactions</Link>
                <Link href="/analytics" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Analytics</Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <p className="mt-2 text-purple-200">Loading transaction from RETH...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900">
        <header className="border-b border-purple-800/30 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-purple-300">
                ⚡ Ritual Explorer
              </Link>
              <nav className="flex space-x-8">
                <Link href="/" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Home</Link>
                <Link href="/blocks" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Blocks</Link>
                <Link href="/transactions" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Transactions</Link>
                <Link href="/analytics" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Analytics</Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-red-400 font-semibold">Error Loading Transaction</h3>
            <p className="text-red-300 mt-2">{error}</p>
            <button 
              onClick={loadTransactionDetails}
              className="mt-4 px-4 py-2 bg-red-800/30 text-red-300 rounded hover:bg-red-700/30 border border-red-600/30"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-purple-200">Transaction not found</p>
        </main>
      </div>
    )
  }

  const txStatus = getTransactionStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900">
      <header className="border-b border-purple-800/30 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-purple-300">
                ⚡ Ritual Explorer
              </Link>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-800/30 text-purple-200 border border-purple-600/30">
                RETH Live
              </span>
            </div>
            <nav className="flex space-x-8">
              <Link href="/" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Home</Link>
              <Link href="/blocks" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Blocks</Link>
              <Link href="/transactions" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Transactions</Link>
              <Link href="/analytics" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Analytics</Link>
              <Link href="/api/health" className="text-purple-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Health</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-purple-400 mb-4">
            <Link href="/" className="hover:text-purple-200">Home</Link>
            <span>→</span>
            <Link href="/transactions" className="hover:text-purple-200">Transactions</Link>
            <span>→</span>
            <span className="text-white">Transaction</span>
          </nav>
          
          <h1 className="text-3xl font-bold text-white">Transaction Details</h1>
          <p className="text-purple-200 mt-2">
            Real-time data from RETH node • Status: 
            <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
              txStatus.color === 'green' ? 'bg-green-800/30 text-green-300 border border-green-600/30' :
              txStatus.color === 'red' ? 'bg-red-800/30 text-red-300 border border-red-600/30' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {txStatus.status}
            </span>
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Transaction Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Complete details for transaction {shortenHash(transaction.hash)}
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Transaction Hash</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono break-all">
                  {transaction.hash}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    txStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                    txStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {txStatus.status}
                  </span>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Block</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <Link 
                    href={`/block/${parseInt(transaction.blockNumber, 16)}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    #{parseInt(transaction.blockNumber, 16).toLocaleString()}
                  </Link>
                  <span className="ml-2 text-gray-500">
                    (Position: {transaction.transactionIndex ? parseInt(transaction.transactionIndex, 16) : 'N/A'})
                  </span>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">From</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono break-all">
                  {transaction.from}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">To</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono break-all">
                  {transaction.to || 'Contract Creation'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Value</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className="text-lg font-semibold">{formatValue(transaction.value)}</span>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Gas Limit</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatGas(transaction.gas)}
                </dd>
              </div>
              {receipt && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Gas Used</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatGas(receipt.gasUsed)}
                    <span className="ml-2 text-gray-500">
                      ({((parseInt(receipt.gasUsed, 16) / parseInt(transaction.gas, 16)) * 100).toFixed(2)}%)
                    </span>
                  </dd>
                </div>
              )}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Gas Price</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatGasPrice(transaction.gasPrice)}
                </dd>
              </div>
              {transaction.maxFeePerGas && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Max Fee Per Gas</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatGasPrice(transaction.maxFeePerGas)}
                  </dd>
                </div>
              )}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Nonce</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {parseInt(transaction.nonce, 16)}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Transaction Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  Type {parseInt(transaction.type, 16)}
                </dd>
              </div>
              {transaction.input && transaction.input !== '0x' && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Input Data</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="bg-gray-100 p-3 rounded font-mono text-xs break-all max-h-32 overflow-y-auto">
                      {transaction.input}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Async Transaction Flow Visualization */}
        {transaction && (
          transaction.type === RitualTransactionType.ASYNC_COMMITMENT ||
          transaction.type === RitualTransactionType.ASYNC_SETTLEMENT ||
          transaction.commitmentTx ||
          transaction.settlementTx
        ) && (
          <AsyncTransactionFlow transaction={transaction} />
        )}

        {/* Logs Section */}
        {receipt && receipt.logs && receipt.logs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Event Logs ({receipt.logs.length})
            </h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <p className="text-sm text-gray-500">
                  Events emitted by this transaction
                </p>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {receipt.logs.map((log: any, index: number) => (
                    <li key={index} className="px-4 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">Log {index}</div>
                        <div className="mt-1 text-gray-600">
                          <span className="font-mono">{log.address}</span>
                        </div>
                        {log.topics && log.topics.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">Topics:</div>
                            {log.topics.map((topic: string, topicIndex: number) => (
                              <div key={topicIndex} className="font-mono text-xs bg-gray-100 p-1 rounded mb-1 break-all">
                                {topic}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
