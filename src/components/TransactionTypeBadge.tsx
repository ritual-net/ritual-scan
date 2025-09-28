import { RitualTransactionType, rethClient } from '@/lib/reth-client'

interface TransactionTypeBadgeProps {
  type: string
  className?: string
}

export function TransactionTypeBadge({ type, className = '' }: TransactionTypeBadgeProps) {
  const getTypeConfig = (txType: string) => {
    switch (txType) {
      case RitualTransactionType.LEGACY:
        return {
          label: 'Legacy',
          bgColor: 'bg-gray-500/20',
          textColor: 'text-gray-300',
          borderColor: 'border-gray-500/30'
        }
      case RitualTransactionType.EIP1559:
        return {
          label: 'EIP-1559',
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-300',
          borderColor: 'border-blue-500/30'
        }
      case RitualTransactionType.SCHEDULED:
        return {
          label: 'Scheduled',
          bgColor: 'bg-purple-500/20',
          textColor: 'text-purple-300',
          borderColor: 'border-purple-500/30'
        }
      case RitualTransactionType.ASYNC_COMMITMENT:
        return {
          label: 'Async Commit',
          bgColor: 'bg-orange-500/20',
          textColor: 'text-orange-300',
          borderColor: 'border-orange-500/30'
        }
      case RitualTransactionType.ASYNC_SETTLEMENT:
        return {
          label: 'Async Settle',
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-300',
          borderColor: 'border-green-500/30'
        }
      default:
        return {
          label: 'Unknown',
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-300',
          borderColor: 'border-red-500/30'
        }
    }
  }

  const config = getTypeConfig(type)

  return (
    <span
      className={`
        inline-flex items-center px-2 py-1 text-xs font-medium rounded border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${className}
      `}
    >
      {config.label}
    </span>
  )
}

interface SystemAccountBadgeProps {
  address: string
  className?: string
}

export function SystemAccountBadge({ address, className = '' }: SystemAccountBadgeProps) {
  if (!rethClient.isSystemAccount(address)) {
    return null
  }

  const label = rethClient.getSystemAccountLabel(address)

  return (
    <span
      className={`
        inline-flex items-center px-2 py-1 text-xs font-medium rounded border
        bg-lime-500/20 text-lime-300 border-lime-500/30
        ${className}
      `}
    >
      🤖 {label}
    </span>
  )
}
