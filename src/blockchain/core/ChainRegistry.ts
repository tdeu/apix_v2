/**
 * Chain Registry
 *
 * Central registry for all supported blockchains.
 * Provides metadata, capabilities, and chain information.
 */

import { SupportedChain, NetworkType } from './types'
import { ChainCapabilities, ChainMetadata, CHAIN_CAPABILITIES, CHAIN_METADATA } from './ChainCapabilities'

/**
 * Extended chain information including status and features.
 */
export interface ChainInfo {
  chain: SupportedChain
  metadata: ChainMetadata
  capabilities: ChainCapabilities
  status: 'stable' | 'beta' | 'alpha' | 'planned'
  sdkPackages: string[]
  estimatedCostPerTx: {
    usd: number
    nativeToken: string
  }
}

/**
 * Chain Registry - Central source of truth for blockchain information.
 */
export class ChainRegistry {
  private static chains: Map<SupportedChain, ChainInfo> = new Map()

  /**
   * Initialize the registry with all supported chains.
   */
  static initialize(): void {
    // Hedera
    this.registerChain({
      chain: 'hedera',
      metadata: CHAIN_METADATA.hedera,
      capabilities: CHAIN_CAPABILITIES.hedera,
      status: 'stable',
      sdkPackages: ['@hashgraph/sdk', 'hedera-agent-kit'],
      estimatedCostPerTx: {
        usd: 0.0001,
        nativeToken: '0.001 HBAR',
      },
    })

    // Ethereum
    this.registerChain({
      chain: 'ethereum',
      metadata: CHAIN_METADATA.ethereum,
      capabilities: CHAIN_CAPABILITIES.ethereum,
      status: 'beta',
      sdkPackages: ['ethers'],
      estimatedCostPerTx: {
        usd: 3.5,
        nativeToken: '0.0015 ETH',
      },
    })

    // Solana
    this.registerChain({
      chain: 'solana',
      metadata: CHAIN_METADATA.solana,
      capabilities: CHAIN_CAPABILITIES.solana,
      status: 'beta',
      sdkPackages: ['@solana/web3.js', '@solana/spl-token'],
      estimatedCostPerTx: {
        usd: 0.00025,
        nativeToken: '0.000005 SOL',
      },
    })

    // Base
    this.registerChain({
      chain: 'base',
      metadata: CHAIN_METADATA.base,
      capabilities: CHAIN_CAPABILITIES.base,
      status: 'beta',
      sdkPackages: ['ethers'],
      estimatedCostPerTx: {
        usd: 0.02,
        nativeToken: '0.00001 ETH',
      },
    })
  }

  /**
   * Register a blockchain in the registry.
   */
  private static registerChain(info: ChainInfo): void {
    this.chains.set(info.chain, info)
  }

  /**
   * Get information about a specific chain.
   */
  static getChain(chain: SupportedChain): ChainInfo {
    const info = this.chains.get(chain)
    if (!info) {
      throw new Error(`Chain '${chain}' not found in registry`)
    }
    return info
  }

  /**
   * Get all registered chains.
   */
  static getAllChains(): ChainInfo[] {
    return Array.from(this.chains.values())
  }

  /**
   * Get chains by status.
   */
  static getChainsByStatus(status: ChainInfo['status']): ChainInfo[] {
    return this.getAllChains().filter(chain => chain.status === status)
  }

  /**
   * Get stable (production-ready) chains.
   */
  static getStableChains(): ChainInfo[] {
    return this.getChainsByStatus('stable')
  }

  /**
   * Get chains that support a specific capability.
   */
  static getChainsByCapability(
    capability: keyof ChainCapabilities,
    value: any = true
  ): ChainInfo[] {
    return this.getAllChains().filter(
      chain => chain.capabilities[capability] === value
    )
  }

  /**
   * Get explorer URL for a transaction.
   */
  static getExplorerUrl(
    chain: SupportedChain,
    txHash: string,
    network: NetworkType = 'testnet'
  ): string {
    const info = this.getChain(chain)
    // Map devnet/localnet to testnet for explorer URLs
    const explorerNetwork = (network === 'devnet' || network === 'localnet') ? 'testnet' : network
    const baseUrl = info.metadata.explorerUrl[explorerNetwork]
    return `${baseUrl}/tx/${txHash}`
  }

  /**
   * Get RPC URL for a chain and network.
   */
  static getRPCUrl(
    chain: SupportedChain,
    network: NetworkType = 'testnet'
  ): string {
    const info = this.getChain(chain)
    // Map devnet/localnet to testnet for RPC URLs
    const rpcNetwork = (network === 'devnet' || network === 'localnet') ? 'testnet' : network
    const urls = info.metadata.rpcUrls[rpcNetwork]
    return urls[0] // Return first URL
  }

  /**
   * Get chain ID for a chain and network.
   */
  static getChainId(
    chain: SupportedChain,
    network: NetworkType = 'testnet'
  ): string | number | undefined {
    const info = this.getChain(chain)
    // Map devnet/localnet to testnet for chain IDs
    const chainIdNetwork = (network === 'devnet' || network === 'localnet') ? 'testnet' : network
    return info.metadata.chainId?.[chainIdNetwork]
  }

  /**
   * Compare chains by performance.
   */
  static compareChains(chains: SupportedChain[]): {
    chain: SupportedChain
    displayName: string
    tps: number
    finality: number
    costUSD: number
    status: string
  }[] {
    return chains.map(chain => {
      const info = this.getChain(chain)
      return {
        chain,
        displayName: info.metadata.displayName,
        tps: info.capabilities.averageTPS,
        finality: info.capabilities.averageFinalitySeconds,
        costUSD: info.estimatedCostPerTx.usd,
        status: info.status,
      }
    })
  }

  /**
   * Get recommended chain for a use case.
   * This is a simple rule-based recommendation.
   * For AI-powered recommendations, use ChainRecommendationEngine.
   */
  static getRecommendedChain(useCase: string): {
    chain: SupportedChain
    reason: string
  } {
    const lowerCase = useCase.toLowerCase()

    // Gaming / High-frequency
    if (lowerCase.includes('game') || lowerCase.includes('gaming') || lowerCase.includes('high-frequency')) {
      return {
        chain: 'solana',
        reason: 'High TPS (3,000) and fast finality (400ms) ideal for gaming',
      }
    }

    // Enterprise / Compliance
    if (lowerCase.includes('enterprise') || lowerCase.includes('compliance') || lowerCase.includes('supply chain')) {
      return {
        chain: 'hedera',
        reason: 'Enterprise governance, predictable fees, and regulatory compliance',
      }
    }

    // DeFi
    if (lowerCase.includes('defi') || lowerCase.includes('swap') || lowerCase.includes('lending')) {
      return {
        chain: 'ethereum',
        reason: 'Largest DeFi ecosystem with maximum liquidity',
      }
    }

    // Consumer apps / Payments
    if (lowerCase.includes('payment') || lowerCase.includes('consumer') || lowerCase.includes('wallet')) {
      return {
        chain: 'base',
        reason: 'Low fees, Coinbase integration, and easy fiat on-ramps',
      }
    }

    // NFTs
    if (lowerCase.includes('nft') || lowerCase.includes('collectible')) {
      return {
        chain: 'solana',
        reason: 'Low minting costs and strong NFT ecosystem (Metaplex)',
      }
    }

    // Default to Hedera (balanced)
    return {
      chain: 'hedera',
      reason: 'Balanced performance, low fees, and enterprise features',
    }
  }

  /**
   * Get fastest chain by TPS.
   */
  static getFastestChain(): SupportedChain {
    const chains = this.getAllChains()
    return chains.reduce((fastest, chain) =>
      chain.capabilities.averageTPS > fastest.capabilities.averageTPS
        ? chain
        : fastest
    ).chain
  }

  /**
   * Get most cost-effective chain.
   */
  static getCheapestChain(): SupportedChain {
    const chains = this.getAllChains()
    return chains.reduce((cheapest, chain) =>
      chain.estimatedCostPerTx.usd < cheapest.estimatedCostPerTx.usd
        ? chain
        : cheapest
    ).chain
  }

  /**
   * Get chain with fastest finality.
   */
  static getFastestFinalityChain(): SupportedChain {
    const chains = this.getAllChains()
    return chains.reduce((fastest, chain) =>
      chain.capabilities.averageFinalitySeconds < fastest.capabilities.averageFinalitySeconds
        ? chain
        : fastest
    ).chain
  }

  /**
   * Generate comparison table data.
   */
  static getComparisonTable(): {
    chain: string
    status: string
    avgFee: string
    tps: number
    finality: string
    contracts: string
    tokens: string
  }[] {
    return this.getAllChains().map(info => ({
      chain: info.metadata.displayName,
      status: info.status === 'stable' ? '✅ Stable' : '🚧 Beta',
      avgFee: `$${info.estimatedCostPerTx.usd}`,
      tps: info.capabilities.averageTPS,
      finality: `${info.capabilities.averageFinalitySeconds}s`,
      contracts: info.capabilities.hasSmartContracts
        ? `✅ ${info.capabilities.contractLanguage}`
        : '❌',
      tokens: info.capabilities.hasNativeTokens
        ? '✅ Native'
        : info.capabilities.hasERC20
        ? '✅ ERC-20'
        : '❌',
    }))
  }
}

// Initialize the registry when module loads
ChainRegistry.initialize()
