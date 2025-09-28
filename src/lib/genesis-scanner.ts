'use client'

/**
 * Genesis Block Scanner for Ritual Chain
 * Scans genesis and early blocks to find deployed contract addresses
 */

import { rethClient } from '@/lib/reth-client'

export interface DeployedContract {
  address: string
  name: string
  deployedAt: number
  transactionHash?: string
  creator?: string
}

export class GenesisScanner {
  private static deployedContracts: Map<string, DeployedContract> = new Map()
  private static scanned = false

  /**
   * Scan genesis and early blocks for contract deployments
   */
  static async scanGenesisDeployments(): Promise<DeployedContract[]> {
    if (this.scanned) {
      return Array.from(this.deployedContracts.values())
    }

    console.log('🔍 Scanning genesis and early blocks for contract deployments...')
    
    try {
      // Scan blocks 0-10 for contract deployments
      for (let blockNum = 0; blockNum <= 10; blockNum++) {
        await this.scanBlock(blockNum)
      }

      this.scanned = true
      const contracts = Array.from(this.deployedContracts.values())
      
      console.log(`✅ Found ${contracts.length} deployed contracts:`, contracts)
      return contracts
      
    } catch (error) {
      console.error('❌ Error scanning genesis deployments:', error)
      return []
    }
  }

  /**
   * Scan a specific block for contract deployments
   */
  private static async scanBlock(blockNumber: number): Promise<void> {
    try {
      console.log(`🔍 Scanning block ${blockNumber} for contracts...`)
      const block = await rethClient.getBlock(blockNumber, true)
      
      if (!block || !block.transactions) {
        console.log(`📭 Block ${blockNumber} has no transactions`)
        return
      }

      console.log(`📦 Block ${blockNumber} has ${block.transactions.length} transactions`)
      
      let contractCreations = 0
      for (const tx of block.transactions) {
        if (typeof tx === 'object' && tx.to === null) {
          contractCreations++
          console.log(`🏗️  Found contract creation in block ${blockNumber}:`, tx.hash)
          
          // This is a contract creation transaction
          const receipt = await rethClient.getTransactionReceipt(tx.hash)
          
          if (receipt && receipt.contractAddress) {
            const contractName = this.guessContractName(receipt.contractAddress, tx)
            
            console.log(`✅ Contract deployed:`, {
              address: receipt.contractAddress,
              name: contractName,
              block: blockNumber,
              creator: tx.from
            })
            
            this.deployedContracts.set(receipt.contractAddress.toLowerCase(), {
              address: receipt.contractAddress,
              name: contractName,
              deployedAt: blockNumber,
              transactionHash: tx.hash,
              creator: tx.from
            })
          }
        }
      }
      
      if (contractCreations === 0) {
        console.log(`📭 No contract creations found in block ${blockNumber}`)
      }
    } catch (error) {
      console.error(`❌ Error scanning block ${blockNumber}:`, error)
    }
  }

  /**
   * Guess contract name based on address and deployment context
   */
  private static guessContractName(address: string, deploymentTx: any): string {
    const lowerAddress = address.toLowerCase()
    
    // Check if it matches known precompile patterns
    if (lowerAddress.startsWith('0x00000000000000000000000000000000000008')) {
      const lastByte = lowerAddress.slice(-2)
      switch (lastByte) {
        case '01': return 'Async Precompile'
        case '02': return 'ONNX Inference Precompile'
        case '03': return 'Validation Precompile'
        default: return 'Unknown Precompile'
      }
    }

    // Check deployment transaction data for clues
    if (deploymentTx.input) {
      const input = deploymentTx.input.toLowerCase()
      
      // Look for common contract patterns in bytecode
      if (input.includes('7363686564756c6572')) { // "scheduler" in hex
        return 'Scheduler Contract'
      }
      if (input.includes('72697475616c77616c6c6574')) { // "ritualwallet" in hex
        return 'RitualWallet Contract'
      }
      if (input.includes('696e666572656e6365')) { // "inference" in hex
        return 'Inference Contract'
      }
    }

    // Check address ranges for common patterns
    if (lowerAddress.startsWith('0x000000000000000000000000000000000000')) {
      return 'System Contract'
    }

    return 'Unknown Contract'
  }

  /**
   * Get deployed contract by address
   */
  static getContract(address: string): DeployedContract | null {
    return this.deployedContracts.get(address.toLowerCase()) || null
  }

  /**
   * Get all contracts of a specific type
   */
  static getContractsByType(namePattern: string): DeployedContract[] {
    return Array.from(this.deployedContracts.values())
      .filter(contract => contract.name.toLowerCase().includes(namePattern.toLowerCase()))
  }

  /**
   * Check if address is a known deployed contract
   */
  static isKnownContract(address: string): boolean {
    return this.deployedContracts.has(address.toLowerCase())
  }

  /**
   * Update contract addresses in the main decoder
   */
  static async updateContractAddresses(): Promise<void> {
    const contracts = await this.scanGenesisDeployments()
    
    // Update the DEPLOYED_CONTRACTS object with actual addresses
    const updates: { [key: string]: string } = {}
    
    for (const contract of contracts) {
      switch (contract.name) {
        case 'Scheduler Contract':
          updates.SCHEDULER_CONTRACT = contract.address
          break
        case 'RitualWallet Contract':
          updates.RITUAL_WALLET = contract.address
          break
        case 'Async Precompile':
          updates.ASYNC_PRECOMPILE = contract.address
          break
        case 'ONNX Inference Precompile':
          updates.INFERENCE_PRECOMPILE = contract.address
          break
        case 'Validation Precompile':
          updates.VALIDATION_PRECOMPILE = contract.address
          break
      }
    }

    console.log('📋 Contract address updates:', updates)
    
    // TODO: Apply these updates to the DEPLOYED_CONTRACTS object
    // This would require dynamic updates to the contract decoder
  }
}

// Global cache - store results in module scope for app-wide access
let globalContractCache: DeployedContract[] | null = null
let globalScanPromise: Promise<DeployedContract[]> | null = null

/**
 * Get cached contracts or initiate scan (singleton pattern)
 */
export async function getDeployedContracts(): Promise<DeployedContract[]> {
  if (globalContractCache) {
    console.log('📋 Using cached contract list:', globalContractCache.length, 'contracts')
    return globalContractCache
  }
  
  if (globalScanPromise) {
    console.log('⏳ Scan already in progress, waiting...')
    return globalScanPromise
  }
  
  console.log('🔍 Starting genesis scan (first time)...')
  globalScanPromise = GenesisScanner.scanGenesisDeployments()
  
  try {
    globalContractCache = await globalScanPromise
    console.log('✅ Genesis scan complete, cached', globalContractCache.length, 'contracts')
    return globalContractCache
  } catch (error) {
    console.error('❌ Genesis scan failed:', error)
    globalScanPromise = null // Reset so it can be retried
    return []
  }
}

/**
 * Auto-scan on module load (run once) - only in browser
 */
if (typeof window !== 'undefined') {
  // Initiate scan but don't block module loading
  getDeployedContracts().catch(console.error)
}
