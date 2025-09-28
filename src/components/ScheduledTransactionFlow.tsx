'use client'

interface ScheduledTransactionFlowProps {
  transaction: any
  compact?: boolean
}

export function ScheduledTransactionFlow({ transaction, compact = false }: ScheduledTransactionFlowProps) {
  if (!transaction || transaction.type !== '0x10') {
    return null
  }

  return (
    <div className="bg-white/5 border border-lime-500/20 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
        <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-500/20 text-purple-300 rounded-full text-xs mr-2">
          S
        </span>
        Scheduled Transaction Flow
      </h3>

      <div className="space-y-4">
        {/* Flow Diagram */}
        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
          {/* User Creates Schedule */}
          <div className="flex-shrink-0 text-center">
            <div className="w-16 h-16 bg-blue-500/20 border-2 border-blue-500/30 rounded-lg flex items-center justify-center mb-2">
              <span className="text-blue-300 text-xs font-semibold">USER</span>
            </div>
            <div className="text-xs text-blue-300 font-medium">Create Schedule</div>
            <div className="text-xs text-lime-400 mt-1">Origin Transaction</div>
          </div>

          <div className="flex-shrink-0 text-lime-400">
            <svg className="w-8 h-4" fill="currentColor" viewBox="0 0 20 8">
              <path d="M0 4h16m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          {/* Scheduled in Pool */}
          <div className="flex-shrink-0 text-center">
            <div className="w-16 h-16 bg-purple-500/20 border-2 border-purple-500/30 rounded-lg flex items-center justify-center mb-2">
              <span className="text-purple-300 text-xs font-semibold">POOL</span>
            </div>
            <div className="text-xs text-purple-300 font-medium">Scheduled Pool</div>
            <div className="text-xs text-lime-400 mt-1">
              Call ID: {transaction.callId || 'N/A'}
            </div>
          </div>

          <div className="flex-shrink-0 text-lime-400">
            <svg className="w-8 h-4" fill="currentColor" viewBox="0 0 20 8">
              <path d="M0 4h16m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          {/* Execution */}
          <div className="flex-shrink-0 text-center">
            <div className="w-16 h-16 bg-green-500/20 border-2 border-green-500/30 rounded-lg flex items-center justify-center mb-2">
              <span className="text-green-300 text-xs font-semibold">EXEC</span>
            </div>
            <div className="text-xs text-green-300 font-medium">Execute Job</div>
            <div className="text-xs text-lime-400 mt-1">
              {transaction.frequency ? `Every ${transaction.frequency} blocks` : 'Scheduled'}
            </div>
          </div>
        </div>

        {/* Flow Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2">Schedule Creation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-lime-400">Transaction:</span>
                <span className="text-white font-mono">{transaction.hash?.slice(0, 10)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lime-400">From:</span>
                <span className="text-white font-mono">{transaction.from?.slice(0, 10)}...</span>
              </div>
              {transaction.originTx && (
                <div className="flex justify-between">
                  <span className="text-lime-400">Origin:</span>
                  <span className="text-white font-mono">{transaction.originTx.slice(0, 10)}...</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="text-purple-300 font-medium mb-2">Schedule Pool</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-lime-400">Call ID:</span>
                <span className="text-white">{transaction.callId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lime-400">Index:</span>
                <span className="text-white">{transaction.index || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lime-400">Status:</span>
                <span className="text-purple-300">Scheduled</span>
              </div>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="text-green-300 font-medium mb-2">Execution</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-lime-400">Frequency:</span>
                <span className="text-white">
                  {transaction.frequency ? `${transaction.frequency} blocks` : 'Once'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-lime-400">Block:</span>
                <span className="text-white">
                  {transaction.blockNumber ? parseInt(transaction.blockNumber, 16) : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-lime-400">System:</span>
                <span className="text-green-300">0x...fa7e</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="bg-black/30 border border-lime-500/10 rounded-lg p-4">
          <h4 className="text-lime-300 font-medium mb-2">Schedule Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-lime-400">Scheduled System Account:</span>
              <div className="text-white font-mono mt-1 break-all">
                0x000000000000000000000000000000000000fa7e
              </div>
            </div>
            {transaction.precompileAddress && (
              <div>
                <span className="text-lime-400">Precompile Contract:</span>
                <div className="text-white font-mono mt-1 break-all">
                  {transaction.precompileAddress}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Execution Notes */}
        <div className="text-xs text-lime-400 bg-lime-500/5 border border-lime-500/20 rounded-lg p-3">
          <div className="font-medium mb-1">📝 Scheduled Transaction Notes:</div>
          <ul className="space-y-1">
            <li>• Scheduled transactions execute automatically at specified intervals</li>
            <li>• Call ID tracks the scheduled job across multiple executions</li>
            <li>• Execution frequency determines how often the job runs (in blocks)</li>
            <li>• System account (0x...fa7e) handles the automated execution</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
