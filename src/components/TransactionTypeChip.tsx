import { RitualTransactionType } from '@/lib/reth-client'

interface TransactionTypeChipProps {
  type: string
  size?: 'small' | 'medium'
}

export function TransactionTypeChip({ type, size = 'small' }: TransactionTypeChipProps) {
  const getTypeInfo = (txType: string) => {
    switch (txType) {
      case RitualTransactionType.LEGACY:
      case '0x0':
        return {
          label: 'Legacy',
          color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
          shortLabel: 'L'
        }
      case RitualTransactionType.EIP1559:
      case '0x2':
        return {
          label: 'EIP-1559',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          shortLabel: '1559'
        }
      case RitualTransactionType.SCHEDULED:
      case '0x10':
        return {
          label: 'Scheduled',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          shortLabel: 'S'
        }
      case RitualTransactionType.ASYNC_COMMITMENT:
      case '0x11':
        return {
          label: 'Async Commit',
          color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          shortLabel: 'AC'
        }
      case RitualTransactionType.ASYNC_SETTLEMENT:
      case '0x12':
        return {
          label: 'Async Settle',
          color: 'bg-green-500/20 text-green-300 border-green-500/30',
          shortLabel: 'AS'
        }
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          shortLabel: '?'
        }
    }
  }

  const typeInfo = getTypeInfo(type)
  const sizeClasses = size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span 
      className={`inline-flex items-center ${sizeClasses} rounded-full font-medium border ${typeInfo.color}`}
      title={`Transaction Type: ${typeInfo.label} (${type})`}
    >
      {typeInfo.shortLabel}
    </span>
  )
}

// Helper component for transaction type legend
export function TransactionTypeLegend() {
  const types = [
    { type: '0x0', label: 'Legacy (0x0)' },
    { type: '0x2', label: 'EIP-1559 (0x2)' },
    { type: '0x10', label: 'Scheduled (0x10)' },
    { type: '0x11', label: 'Async Commit (0x11)' },
    { type: '0x12', label: 'Async Settle (0x12)' }
  ]

  return (
    <div className="flex flex-wrap items-center space-x-4 text-sm">
      <span className="text-lime-400 font-medium">Types:</span>
      {types.map(({ type, label }) => (
        <div key={type} className="flex items-center space-x-2">
          <TransactionTypeChip type={type} />
          <span className="text-lime-300">{label}</span>
        </div>
      ))}
    </div>
  )
}
