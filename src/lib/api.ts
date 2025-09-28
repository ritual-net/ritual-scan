import { QueryClient } from '@tanstack/react-query'
import { 
  ApiResponseSchema, 
  Block, 
  Transaction, 
  AddressPortfolio, 
  ContractMeta, 
  TokenSummary, 
  GasNow,
  SearchResult,
  PaginatedResponse,
  Log,
  BlockSchema,
  TransactionSchema,
  AddressPortfolioSchema,
  ContractMetaSchema,
  TokenSummarySchema,
  GasNowSchema,
  SearchResultSchema,
  PaginatedResponseSchema,
  LogSchema,
} from './schemas'
import { ChainConfig } from './chains'
import { z } from 'zod'

// Error taxonomy
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, details?: unknown) {
    super('NETWORK_ERROR', message, undefined, details)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends ApiError {
  constructor() {
    super('RATE_LIMIT', 'Rate limit exceeded', 429)
    this.name = 'RateLimitError'
  }
}

// API Client Configuration
export interface ApiClientConfig {
  baseUrl: string
  timeout: number
  retries: number
  apiKey?: string
  chain: ChainConfig
}

// Generic API fetch wrapper with error handling and retries
export class ApiClient {
  private config: ApiClientConfig

  constructor(config: ApiClientConfig) {
    this.config = config
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    retries = this.config.retries
  ): Promise<T> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 429) {
          throw new RateLimitError()
        }
        if (response.status === 404) {
          throw new NotFoundError(url)
        }
        throw new ApiError(
          'HTTP_ERROR',
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }

      const data = await response.json()
      return data
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error
      }

      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return this.fetchWithRetry(url, options, retries - 1)
        }
        throw new NetworkError('Request timeout')
      }

      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return this.fetchWithRetry(url, options, retries - 1)
      }

      const message = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Unknown network error'
      throw new NetworkError(`Network error: ${message}`, error)
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(endpoint, this.config.baseUrl)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      })
    }

    if (this.config.apiKey) {
      url.searchParams.set('apikey', this.config.apiKey)
    }

    return url.toString()
  }

  // Generic fetch method with validation
  async fetch<T>(
    endpoint: string,
    schema: z.ZodSchema<T>,
    params?: Record<string, unknown>,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params)
    const data = await this.fetchWithRetry<unknown>(url, options)
    
    try {
      return schema.parse(data)
    } catch (error) {
      throw new ValidationError('Response validation failed', error)
    }
  }

  // Specific API methods
  async getBlock(blockNumber: number | 'latest'): Promise<Block> {
    return this.fetch(
      '/api',
      ApiResponseSchema(BlockSchema).transform(r => r.data!),
      {
        module: 'proxy',
        action: 'eth_getBlockByNumber',
        tag: blockNumber === 'latest' ? 'latest' : `0x${blockNumber.toString(16)}`,
        boolean: true,
      }
    )
  }

  async getTransaction(txHash: string): Promise<Transaction> {
    return this.fetch(
      '/api',
      ApiResponseSchema(TransactionSchema).transform(r => r.data!),
      {
        module: 'proxy',
        action: 'eth_getTransactionByHash',
        txhash: txHash,
      }
    )
  }

  async getTransactionReceipt(txHash: string): Promise<unknown> {
    return this.fetch(
      '/api',
      z.unknown(),
      {
        module: 'proxy',
        action: 'eth_getTransactionReceipt',
        txhash: txHash,
      }
    )
  }

  async getAddressBalance(address: string): Promise<AddressPortfolio> {
    return this.fetch(
      '/api',
      ApiResponseSchema(AddressPortfolioSchema).transform(r => r.data!),
      {
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
      }
    )
  }

  async getAddressTransactions(
    address: string,
    page = 1,
    offset = 20
  ): Promise<PaginatedResponse<Transaction>> {
    return this.fetch(
      '/api',
      PaginatedResponseSchema(TransactionSchema),
      {
        module: 'account',
        action: 'txlist',
        address,
        startblock: 0,
        endblock: 99999999,
        page,
        offset,
        sort: 'desc',
      }
    )
  }

  async getContractMeta(address: string): Promise<ContractMeta> {
    return this.fetch(
      '/api',
      ApiResponseSchema(ContractMetaSchema).transform(r => r.data!),
      {
        module: 'contract',
        action: 'getsourcecode',
        address,
      }
    )
  }

  async getTokenInfo(address: string): Promise<TokenSummary> {
    return this.fetch(
      '/api',
      ApiResponseSchema(TokenSummarySchema).transform(r => r.data!),
      {
        module: 'token',
        action: 'tokeninfo',
        contractaddress: address,
      }
    )
  }

  async getGasOracle(): Promise<GasNow> {
    return this.fetch(
      '/api',
      ApiResponseSchema(GasNowSchema).transform(r => r.data!),
      {
        module: 'gastracker',
        action: 'gasoracle',
      }
    )
  }

  async getLogs(
    address?: string,
    fromBlock?: number,
    toBlock?: number,
    topics?: string[]
  ): Promise<Log[]> {
    return this.fetch(
      '/api',
      z.array(LogSchema),
      {
        module: 'logs',
        action: 'getLogs',
        fromBlock: fromBlock ? `0x${fromBlock.toString(16)}` : 'earliest',
        toBlock: toBlock ? `0x${toBlock.toString(16)}` : 'latest',
        address,
        topic0: topics?.[0],
        topic1: topics?.[1],
        topic2: topics?.[2],
        topic3: topics?.[3],
      }
    )
  }

  async search(query: string): Promise<SearchResult[]> {
    // Implement search logic based on query format
    const results: SearchResult[] = []

    // Check if it's a transaction hash
    if (/^0x[a-fA-F0-9]{64}$/.test(query)) {
      try {
        await this.getTransaction(query)
        results.push({
          type: 'transaction',
          value: query,
          label: 'Transaction',
        })
      } catch (error) {
        // Not a valid transaction
      }
    }

    // Check if it's an address
    if (/^0x[a-fA-F0-9]{40}$/.test(query)) {
      results.push({
        type: 'address',
        value: query,
        label: 'Address',
      })
    }

    // Check if it's a block number
    if (/^\d+$/.test(query)) {
      const blockNumber = parseInt(query)
      try {
        await this.getBlock(blockNumber)
        results.push({
          type: 'block',
          value: query,
          label: `Block #${blockNumber}`,
        })
      } catch (error) {
        // Not a valid block
      }
    }

    return results
  }
}

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof NotFoundError) return false
        if (error instanceof ValidationError) return false
        return failureCount < 3
      },
    },
  },
})

// Query keys factory
export const queryKeys = {
  all: ['api'] as const,
  blocks: () => [...queryKeys.all, 'blocks'] as const,
  block: (number: number | 'latest') => [...queryKeys.blocks(), number] as const,
  transactions: () => [...queryKeys.all, 'transactions'] as const,
  transaction: (hash: string) => [...queryKeys.transactions(), hash] as const,
  addresses: () => [...queryKeys.all, 'addresses'] as const,
  address: (address: string) => [...queryKeys.addresses(), address] as const,
  addressTransactions: (address: string, page: number) => 
    [...queryKeys.address(address), 'transactions', page] as const,
  contracts: () => [...queryKeys.all, 'contracts'] as const,
  contract: (address: string) => [...queryKeys.contracts(), address] as const,
  tokens: () => [...queryKeys.all, 'tokens'] as const,
  token: (address: string) => [...queryKeys.tokens(), address] as const,
  gas: () => [...queryKeys.all, 'gas'] as const,
  search: (query: string) => [...queryKeys.all, 'search', query] as const,
}

// API client factory
export function createApiClient(chain: ChainConfig, apiKey?: string): ApiClient {
  return new ApiClient({
    baseUrl: chain.apiEndpoint,
    timeout: 10000,
    retries: 2,
    apiKey,
    chain,
  })
}
