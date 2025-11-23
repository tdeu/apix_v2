/**
 * Feature Mapper
 *
 * Maps features across different blockchains to find equivalents.
 * Example: Hedera HTS → Ethereum ERC-20 → Solana SPL Token
 *
 * This enables "smart equivalents" - when a feature doesn't exist on a chain,
 * we can suggest the closest alternative.
 */

import { SupportedChain, IntegrationType } from './types'

/**
 * Feature equivalent information.
 */
export interface FeatureEquivalent {
  chain: SupportedChain
  feature: string
  standard?: string
  similarity: number          // 0.0 - 1.0 (1.0 = identical functionality)
  notes: string
  limitations?: string[]
  advantages?: string[]
  implementation: string      // How to implement this equivalent
}

/**
 * Feature mapping for a specific integration type across chains.
 */
export interface FeatureMapping {
  integrationType: IntegrationType
  description: string
  implementations: Record<SupportedChain, FeatureEquivalent>
}

/**
 * Feature Mapper class.
 * Provides cross-chain feature mapping and equivalence detection.
 */
export class FeatureMapper {
  private static mappings: Map<IntegrationType, FeatureMapping> = new Map()

  /**
   * Initialize feature mappings.
   */
  static initialize(): void {
    this.registerMapping({
      integrationType: 'token',
      description: 'Fungible token creation and management',
      implementations: {
        hedera: {
          chain: 'hedera',
          feature: 'Hedera Token Service (HTS)',
          standard: 'HTS',
          similarity: 1.0,
          notes: 'Native token service with fixed fees and built-in compliance features',
          advantages: [
            'Native to the platform (no smart contract needed)',
            'Predictable fees ($0.0001 per transfer)',
            'Built-in KYC and freeze capabilities',
            'Atomic swaps supported',
          ],
          implementation: 'TokenCreateTransaction',
        },
        ethereum: {
          chain: 'ethereum',
          feature: 'ERC-20 Token Standard',
          standard: 'ERC-20',
          similarity: 0.9,
          notes: 'Smart contract-based fungible token standard',
          limitations: [
            'Requires smart contract deployment',
            'Variable gas fees ($1-50 per transaction)',
            'KYC/freeze requires custom implementation',
          ],
          advantages: [
            'Most widely adopted standard',
            'Extensive tooling and wallets',
            'Maximum composability with DeFi',
          ],
          implementation: 'Deploy ERC-20 contract via ethers.js',
        },
        solana: {
          chain: 'solana',
          feature: 'SPL Token Program',
          standard: 'SPL Token',
          similarity: 0.95,
          notes: 'Native token program with low fees',
          advantages: [
            'Native token program (minimal deployment cost)',
            'Extremely low fees ($0.00025 per transfer)',
            'High throughput (3,000 TPS)',
            'Token accounts for security',
          ],
          limitations: [
            'Requires token account creation',
            'Different model than Ethereum',
          ],
          implementation: 'spl-token create-token command',
        },
        base: {
          chain: 'base',
          feature: 'ERC-20 Token Standard (L2)',
          standard: 'ERC-20',
          similarity: 0.9,
          notes: 'Same as Ethereum but on Layer 2 with lower fees',
          advantages: [
            'Ethereum-compatible',
            'Much lower fees than Ethereum L1 ($0.01-0.05)',
            'Coinbase wallet integration',
            'Easy bridging to/from Ethereum',
          ],
          limitations: [
            'Still requires smart contract deployment',
            'Slightly higher fees than Solana/Hedera',
          ],
          implementation: 'Deploy ERC-20 contract on Base L2',
        },
      },
    })

    this.registerMapping({
      integrationType: 'nft',
      description: 'Non-fungible token (NFT) creation and management',
      implementations: {
        hedera: {
          chain: 'hedera',
          feature: 'Hedera NFT (HTS Non-Fungible)',
          standard: 'HTS NFT',
          similarity: 1.0,
          notes: 'Native NFT support via HTS with serial numbers',
          advantages: [
            'Native to the platform',
            'Predictable fees',
            'Built-in royalty support',
          ],
          implementation: 'TokenCreateTransaction with TokenType.NON_FUNGIBLE_UNIQUE',
        },
        ethereum: {
          chain: 'ethereum',
          feature: 'ERC-721 NFT Standard',
          standard: 'ERC-721',
          similarity: 0.9,
          notes: 'Standard NFT contract on Ethereum',
          advantages: [
            'Most widely adopted NFT standard',
            'Rich ecosystem and marketplaces (OpenSea, Rarible)',
            'Royalty support via ERC-2981',
          ],
          limitations: [
            'High minting costs ($50-200 per NFT on mainnet)',
            'Gas fees for transfers',
          ],
          implementation: 'Deploy ERC-721 contract',
        },
        solana: {
          chain: 'solana',
          feature: 'Metaplex NFT Standard',
          standard: 'Metaplex',
          similarity: 0.85,
          notes: 'Metaplex protocol for NFTs on Solana',
          advantages: [
            'Extremely low minting cost ($0.01 per NFT)',
            'High throughput for mass minting',
            'Candy Machine for drops',
            'Built-in royalty enforcement',
          ],
          limitations: [
            'Different metadata standard than Ethereum',
            'Smaller marketplace ecosystem',
          ],
          implementation: 'Metaplex SDK or Candy Machine',
        },
        base: {
          chain: 'base',
          feature: 'ERC-721 NFT Standard (L2)',
          standard: 'ERC-721',
          similarity: 0.9,
          notes: 'Same as Ethereum but on Layer 2',
          advantages: [
            'Ethereum-compatible',
            'Much lower minting costs ($1-5 per NFT)',
            'Bridgeable to Ethereum L1',
          ],
          implementation: 'Deploy ERC-721 contract on Base',
        },
      },
    })

    this.registerMapping({
      integrationType: 'smart-contract',
      description: 'Programmable smart contracts',
      implementations: {
        hedera: {
          chain: 'hedera',
          feature: 'Hedera Smart Contract Service',
          standard: 'Solidity',
          similarity: 1.0,
          notes: 'EVM-compatible smart contracts with predictable fees',
          advantages: [
            'EVM-compatible (Solidity)',
            'Predictable deployment and execution fees',
            'Same tooling as Ethereum (Hardhat, Foundry)',
          ],
          implementation: 'FileCreateTransaction + ContractCreateTransaction',
        },
        ethereum: {
          chain: 'ethereum',
          feature: 'Ethereum Smart Contracts',
          standard: 'Solidity',
          similarity: 1.0,
          notes: 'Original smart contract platform',
          advantages: [
            'Most mature ecosystem',
            'Extensive auditing tools',
            'Maximum composability',
          ],
          limitations: [
            'High deployment costs ($100-1000s)',
            'Variable execution costs',
          ],
          implementation: 'Deploy contract via ethers.js or Hardhat',
        },
        solana: {
          chain: 'solana',
          feature: 'Solana Programs',
          standard: 'Rust',
          similarity: 0.6,
          notes: 'Rust-based programs with different execution model',
          advantages: [
            'High performance',
            'Low execution costs',
            'Parallel transaction processing',
          ],
          limitations: [
            'Different language (Rust)',
            'Different programming model (account-based)',
            'Steeper learning curve',
          ],
          implementation: 'Anchor framework or native Rust',
        },
        base: {
          chain: 'base',
          feature: 'Base Smart Contracts',
          standard: 'Solidity',
          similarity: 1.0,
          notes: 'Same as Ethereum, fully EVM-compatible',
          advantages: [
            'Identical to Ethereum',
            'Much lower deployment and execution costs',
            'Same tooling',
          ],
          implementation: 'Deploy contract on Base L2',
        },
      },
    })

    this.registerMapping({
      integrationType: 'consensus',
      description: 'Consensus/messaging services for decentralized communication',
      implementations: {
        hedera: {
          chain: 'hedera',
          feature: 'Hedera Consensus Service (HCS)',
          standard: 'HCS',
          similarity: 1.0,
          notes: 'Native consensus service for immutable messaging and audit logs',
          advantages: [
            'Native to the platform',
            'Ordered, timestamped messages',
            'Perfect for audit logs',
            'Fixed fees per message',
          ],
          implementation: 'TopicCreateTransaction + TopicMessageSubmitTransaction',
        },
        ethereum: {
          chain: 'ethereum',
          feature: 'Smart Contract Events',
          standard: 'Event Logs',
          similarity: 0.6,
          notes: 'Smart contract event logs can be used for pub/sub patterns',
          advantages: [
            'Native to smart contracts',
            'Indexable via The Graph',
            'Can trigger off-chain actions',
          ],
          limitations: [
            'Not a true messaging service',
            'Requires smart contract',
            'Gas costs for emitting events',
            'Not ordered across contracts',
          ],
          implementation: 'Emit events from smart contracts',
        },
        solana: {
          chain: 'solana',
          feature: 'Account Data Subscriptions',
          standard: 'WebSocket Subscriptions',
          similarity: 0.5,
          notes: 'Subscribe to account data changes for pub/sub patterns',
          advantages: [
            'Real-time updates',
            'Low latency',
          ],
          limitations: [
            'Not a true consensus service',
            'Requires active subscription',
            'No built-in ordering guarantees',
          ],
          implementation: 'WebSocket account subscriptions',
        },
        base: {
          chain: 'base',
          feature: 'Smart Contract Events (L2)',
          standard: 'Event Logs',
          similarity: 0.6,
          notes: 'Same as Ethereum with lower costs',
          advantages: [
            'Lower gas costs than Ethereum L1',
            'Same tooling as Ethereum',
          ],
          limitations: [
            'Still not a true messaging service',
            'Requires smart contract',
          ],
          implementation: 'Emit events from smart contracts',
        },
      },
    })

    this.registerMapping({
      integrationType: 'wallet',
      description: 'Wallet connectivity and transaction signing',
      implementations: {
        hedera: {
          chain: 'hedera',
          feature: 'Hedera Wallets',
          similarity: 1.0,
          notes: 'HashPack, Blade, WalletConnect, MetaMask Snap',
          implementation: 'WalletConnect protocol or wallet-specific SDKs',
        },
        ethereum: {
          chain: 'ethereum',
          feature: 'Ethereum Wallets',
          similarity: 1.0,
          notes: 'MetaMask, Coinbase Wallet, WalletConnect, Ledger',
          implementation: 'ethers.js BrowserProvider or WalletConnect',
        },
        solana: {
          chain: 'solana',
          feature: 'Solana Wallets',
          similarity: 1.0,
          notes: 'Phantom, Solflare, WalletConnect',
          implementation: '@solana/wallet-adapter',
        },
        base: {
          chain: 'base',
          feature: 'Base Wallets (Ethereum-compatible)',
          similarity: 1.0,
          notes: 'Same as Ethereum (MetaMask, Coinbase Wallet, etc.)',
          implementation: 'ethers.js BrowserProvider',
        },
      },
    })
  }

  /**
   * Register a feature mapping.
   */
  private static registerMapping(mapping: FeatureMapping): void {
    this.mappings.set(mapping.integrationType, mapping)
  }

  /**
   * Get the implementation of an integration type on a specific chain.
   */
  static getImplementation(
    integrationType: IntegrationType,
    chain: SupportedChain
  ): FeatureEquivalent | null {
    const mapping = this.mappings.get(integrationType)
    if (!mapping) return null

    return mapping.implementations[chain] || null
  }

  /**
   * Find equivalent feature on a different chain.
   */
  static getEquivalent(
    sourceChain: SupportedChain,
    targetChain: SupportedChain,
    integrationType: IntegrationType
  ): FeatureEquivalent | null {
    return this.getImplementation(integrationType, targetChain)
  }

  /**
   * Get all implementations of a feature across chains.
   */
  static getAllImplementations(
    integrationType: IntegrationType
  ): Record<SupportedChain, FeatureEquivalent> | null {
    const mapping = this.mappings.get(integrationType)
    return mapping?.implementations || null
  }

  /**
   * Compare feature implementations across chains.
   */
  static compareImplementations(integrationType: IntegrationType): {
    integrationType: IntegrationType
    chains: Array<{
      chain: SupportedChain
      feature: string
      similarity: number
      pros: string[]
      cons: string[]
    }>
  } | null {
    const mapping = this.mappings.get(integrationType)
    if (!mapping) return null

    const chains = Object.entries(mapping.implementations).map(([chain, impl]) => ({
      chain: chain as SupportedChain,
      feature: impl.feature,
      similarity: impl.similarity,
      pros: impl.advantages || [],
      cons: impl.limitations || [],
    }))

    return {
      integrationType,
      chains,
    }
  }

  /**
   * Get human-readable suggestion when feature unavailable.
   */
  static getSuggestion(
    sourceChain: SupportedChain,
    targetChain: SupportedChain,
    integrationType: IntegrationType
  ): string {
    const sourceImpl = this.getImplementation(integrationType, sourceChain)
    const targetImpl = this.getImplementation(integrationType, targetChain)

    if (!sourceImpl || !targetImpl) {
      return `${integrationType} feature not available on ${targetChain}`
    }

    if (targetImpl.similarity >= 0.9) {
      return `✅ ${targetImpl.feature} on ${targetChain} is functionally equivalent to ${sourceImpl.feature}`
    } else if (targetImpl.similarity >= 0.7) {
      return `⚠️ ${targetImpl.feature} on ${targetChain} is similar but has some differences. ${targetImpl.notes}`
    } else {
      return `❌ ${targetImpl.feature} on ${targetChain} is significantly different. ${targetImpl.notes}`
    }
  }

  /**
   * Check if a feature is supported on a chain.
   */
  static isSupported(
    chain: SupportedChain,
    integrationType: IntegrationType
  ): boolean {
    return this.getImplementation(integrationType, chain) !== null
  }
}

// Initialize mappings when module loads
FeatureMapper.initialize()
