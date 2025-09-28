import { z } from 'zod'

// Base hex string validation
export const HexStringSchema = z.string().regex(/^0x[a-fA-F0-9]+$/)
export const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/)
export const HashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/)

// Pagination contract
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  total: z.number().int().min(0).optional(),
  hasNext: z.boolean().optional(),
  hasPrev: z.boolean().optional(),
})

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: PaginationSchema,
  })

// Gas pricing
export const GasNowSchema = z.object({
  slow: z.number(),
  standard: z.number(),
  fast: z.number(),
  instant: z.number(),
  timestamp: z.number(),
})

// Transaction Log
export const LogSchema = z.object({
  address: AddressSchema,
  topics: z.array(HexStringSchema),
  data: HexStringSchema,
  blockNumber: z.number(),
  transactionHash: HashSchema,
  transactionIndex: z.number(),
  blockHash: HashSchema,
  logIndex: z.number(),
  removed: z.boolean().optional(),
})

// Transaction
export const TransactionSchema = z.object({
  hash: HashSchema,
  blockHash: HashSchema.nullable(),
  blockNumber: z.number().nullable(),
  transactionIndex: z.number().nullable(),
  from: AddressSchema,
  to: AddressSchema.nullable(),
  value: z.string(), // BigNumber as string
  gas: z.string(),
  gasPrice: z.string(),
  maxFeePerGas: z.string().optional(),
  maxPriorityFeePerGas: z.string().optional(),
  input: HexStringSchema,
  nonce: z.number(),
  type: z.number().optional(),
  accessList: z.array(z.object({
    address: AddressSchema,
    storageKeys: z.array(HexStringSchema),
  })).optional(),
  chainId: z.number().optional(),
  status: z.enum(['pending', 'success', 'failed']).optional(),
  gasUsed: z.string().optional(),
  effectiveGasPrice: z.string().optional(),
  logs: z.array(LogSchema).optional(),
  logsBloom: HexStringSchema.optional(),
  timestamp: z.number().optional(),
})

// Block
export const BlockSchema = z.object({
  number: z.number(),
  hash: HashSchema,
  parentHash: HashSchema,
  nonce: HexStringSchema.optional(),
  sha3Uncles: HashSchema,
  logsBloom: HexStringSchema,
  transactionsRoot: HashSchema,
  stateRoot: HashSchema,
  receiptsRoot: HashSchema,
  miner: AddressSchema, // Actually the validator in PoS
  difficulty: z.string(),
  totalDifficulty: z.string(),
  extraData: HexStringSchema,
  size: z.number(),
  gasLimit: z.string(),
  gasUsed: z.string(),
  timestamp: z.number(),
  transactions: z.array(z.union([HashSchema, TransactionSchema])),
  uncles: z.array(HashSchema),
  baseFeePerGas: z.string().optional(),
  withdrawals: z.array(z.object({
    index: z.number(),
    validatorIndex: z.number(),
    address: AddressSchema,
    amount: z.string(),
  })).optional(),
})

// Contract metadata
export const ContractMetaSchema = z.object({
  address: AddressSchema,
  name: z.string().optional(),
  symbol: z.string().optional(),
  decimals: z.number().optional(),
  totalSupply: z.string().optional(),
  contractType: z.enum(['erc20', 'erc721', 'erc1155', 'other']).optional(),
  verified: z.boolean(),
  sourceCode: z.string().optional(),
  abi: z.array(z.unknown()).optional(), // JSON ABI
  compilationDetails: z.object({
    compiler: z.string(),
    version: z.string(),
    optimization: z.boolean(),
    runs: z.number().optional(),
  }).optional(),
  proxy: z.object({
    isProxy: z.boolean(),
    implementation: AddressSchema.optional(),
    proxyType: z.string().optional(),
  }).optional(),
})

// Token summary
export const TokenSummarySchema = z.object({
  address: AddressSchema,
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  totalSupply: z.string(),
  holders: z.number().optional(),
  transfers: z.number().optional(),
  price: z.object({
    usd: z.number().optional(),
    ritual: z.number().optional(),
    change24h: z.number().optional(),
  }).optional(),
  marketCap: z.number().optional(),
  volume24h: z.number().optional(),
})

// Address portfolio/balance
export const AddressPortfolioSchema = z.object({
  address: AddressSchema,
  balance: z.string(), // RITUAL balance as string
  balanceUsd: z.number().optional(),
  nonce: z.number(),
  txCount: z.number(),
  tokens: z.array(z.object({
    address: AddressSchema,
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    balance: z.string(),
    balanceUsd: z.number().optional(),
  })).optional(),
  nfts: z.array(z.object({
    address: AddressSchema,
    tokenId: z.string(),
    name: z.string().optional(),
    image: z.string().optional(),
    collection: z.string().optional(),
  })).optional(),
  tags: z.array(z.string()).optional(),
  nameTag: z.string().optional(),
})

// Search result types
export const SearchResultSchema = z.object({
  type: z.enum(['transaction', 'block', 'address', 'token', 'contract']),
  value: z.string(),
  label: z.string().optional(),
  metadata: z.unknown().optional(),
})

// API Response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    }).optional(),
    timestamp: z.number(),
  })

// Export type inference helpers
export type Pagination = z.infer<typeof PaginationSchema>
export type PaginatedResponse<T> = {
  data: T[]
  pagination: Pagination
}
export type GasNow = z.infer<typeof GasNowSchema>
export type Log = z.infer<typeof LogSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type Block = z.infer<typeof BlockSchema>
export type ContractMeta = z.infer<typeof ContractMetaSchema>
export type TokenSummary = z.infer<typeof TokenSummarySchema>
export type AddressPortfolio = z.infer<typeof AddressPortfolioSchema>
export type SearchResult = z.infer<typeof SearchResultSchema>
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: number
}
