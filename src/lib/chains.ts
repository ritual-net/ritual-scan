import { z } from 'zod'

// Chain configuration schema
export const ChainConfigSchema = z.object({
  id: z.number(),
  name: z.string(),
  displayName: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  rpcUrls: z.array(z.string()),
  blockExplorers: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })),
  apiEndpoint: z.string(),
  wsEndpoint: z.string().optional(),
  features: z.object({
    eip1559: z.boolean(),
    contractVerification: z.boolean(),
    mempool: z.boolean(),
    traces: z.boolean(),
    logs: z.boolean(),
  }),
  theme: z.object({
    primaryColor: z.string(),
    logoUrl: z.string().optional(),
  }).optional(),
})

export type ChainConfig = z.infer<typeof ChainConfigSchema>

// Supported chains configuration
export const CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: 1,
    name: 'ethereum',
    displayName: 'Ethereum Mainnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [
      'https://eth.llamarpc.com',
      'https://ethereum.publicnode.com',
    ],
    blockExplorers: [
      { name: 'Etherscan', url: 'https://etherscan.io' },
    ],
    apiEndpoint: 'https://api.etherscan.io/api',
    wsEndpoint: 'wss://eth-mainnet.g.alchemy.com/v2/ws',
    features: {
      eip1559: true,
      contractVerification: true,
      mempool: true,
      traces: true,
      logs: true,
    },
    theme: {
      primaryColor: '#3b82f6',
    },
  },
  sepolia: {
    id: 11155111,
    name: 'sepolia',
    displayName: 'Sepolia Testnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [
      'https://sepolia.infura.io/v3/',
      'https://ethereum-sepolia.publicnode.com',
    ],
    blockExplorers: [
      { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
    ],
    apiEndpoint: 'https://api-sepolia.etherscan.io/api',
    features: {
      eip1559: true,
      contractVerification: true,
      mempool: false,
      traces: true,
      logs: true,
    },
    theme: {
      primaryColor: '#10b981',
    },
  },
  polygon: {
    id: 137,
    name: 'polygon',
    displayName: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://polygon.llamarpc.com',
    ],
    blockExplorers: [
      { name: 'Polygonscan', url: 'https://polygonscan.com' },
    ],
    apiEndpoint: 'https://api.polygonscan.com/api',
    features: {
      eip1559: true,
      contractVerification: true,
      mempool: true,
      traces: true,
      logs: true,
    },
    theme: {
      primaryColor: '#8b5cf6',
    },
  },
  arbitrum: {
    id: 42161,
    name: 'arbitrum',
    displayName: 'Arbitrum One',
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.publicnode.com',
    ],
    blockExplorers: [
      { name: 'Arbiscan', url: 'https://arbiscan.io' },
    ],
    apiEndpoint: 'https://api.arbiscan.io/api',
    features: {
      eip1559: true,
      contractVerification: true,
      mempool: false,
      traces: true,
      logs: true,
    },
    theme: {
      primaryColor: '#2563eb',
    },
  },
  base: {
    id: 8453,
    name: 'base',
    displayName: 'Base',
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [
      'https://mainnet.base.org',
      'https://base.publicnode.com',
    ],
    blockExplorers: [
      { name: 'Basescan', url: 'https://basescan.org' },
    ],
    apiEndpoint: 'https://api.basescan.org/api',
    features: {
      eip1559: true,
      contractVerification: true,
      mempool: false,
      traces: true,
      logs: true,
    },
    theme: {
      primaryColor: '#0052ff',
    },
  },
  // Custom RETH configuration based on provided IPs
  reth_custom: {
    id: 1, // Assuming mainnet fork
    name: 'reth_custom',
    displayName: 'Ritual Network (Shrinenet)',
    symbol: 'RITUAL',
    decimals: 18,
    rpcUrls: [
      'http://104.196.32.199:8545',
    ],
    blockExplorers: [
      { name: 'Custom Explorer', url: 'http://104.196.32.199:3000' },
    ],
    apiEndpoint: 'http://104.196.32.199:8545',
    wsEndpoint: 'ws://104.196.32.199:8546',
    features: {
      eip1559: true,
      contractVerification: false, // Custom node might not have verification
      mempool: true,
      traces: true,
      logs: true,
    },
    theme: {
      primaryColor: '#ff6b35',
    },
  },
}

// Helper functions
export function getChainById(chainId: number): ChainConfig | undefined {
  return Object.values(CHAINS).find(chain => chain.id === chainId)
}

export function getChainByName(name: string): ChainConfig | undefined {
  return CHAINS[name]
}

export function getAllChains(): ChainConfig[] {
  return Object.values(CHAINS)
}

export function getDefaultChain(): ChainConfig {
  return CHAINS.reth_custom
}

// Chain context
export interface ChainContext {
  currentChain: ChainConfig
  switchChain: (chainName: string) => void
  availableChains: ChainConfig[]
}

// Validation helpers
export function isValidChainId(chainId: number): boolean {
  return Object.values(CHAINS).some(chain => chain.id === chainId)
}

export function normalizeChainName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_')
}
