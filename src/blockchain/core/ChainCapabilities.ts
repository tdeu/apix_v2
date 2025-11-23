/**
 * Chain Capabilities System
 *
 * Defines what features each blockchain supports.
 * This allows APIX to:
 * 1. Detect what operations are available on each chain
 * 2. Provide helpful error messages when features aren't supported
 * 3. Make intelligent recommendations based on required capabilities
 */

import { SupportedChain } from './types'

/**
 * Capability flags for blockchain features.
 * Each blockchain declares what it can do.
 */
export interface ChainCapabilities {
  // Token standards
  hasNativeTokens: boolean        // HTS (Hedera), SPL (Solana)
  hasERC20: boolean                // Ethereum, Base, Polygon
  hasERC721: boolean               // NFT standard (Ethereum, Base)
  hasERC1155: boolean              // Multi-token standard

  // Smart contracts
  hasSmartContracts: boolean
  contractLanguage: 'solidity' | 'rust' | 'vyper' | 'custom' | null

  // Consensus mechanisms
  hasConsensusService: boolean     // Hedera HCS (unique)
  hasEventLogs: boolean            // Ethereum, Base (for pub/sub)

  // Account model
  accountModel: 'account-based' | 'UTXO' | 'custom'

  // Performance characteristics
  averageTPS: number               // Transactions per second
  averageFinalitySeconds: number   // Time to finality

  // Advanced features
  hasStaking: boolean
  hasGovernance: boolean
  hasMultisig: boolean

  // Token features
  hasTokenFreeze: boolean          // Hedera-specific
  hasTokenPause: boolean
  hasTokenBurn: boolean
  hasTokenMint: boolean

  // Network features
  hasPredictableFees: boolean      // Hedera (fixed fees)
  hasVariableGas: boolean          // Ethereum, Base (gas market)

  // Account features
  hasAccountCreation: boolean      // Some chains require account creation
  hasAccountAssociation: boolean   // Hedera token association
}

/**
 * Chain metadata for display and documentation.
 */
export interface ChainMetadata {
  id: SupportedChain
  name: string
  displayName: string
  description: string
  nativeToken: string
  explorerUrl: {
    mainnet: string
    testnet: string
  }
  rpcUrls: {
    mainnet: string[]
    testnet: string[]
  }
  chainId?: {
    mainnet: string | number
    testnet: string | number
  }
  documentation: string
  iconUrl?: string
}

/**
 * Predefined capabilities for each supported blockchain.
 */
export const CHAIN_CAPABILITIES: Record<SupportedChain, ChainCapabilities> = {
  hedera: {
    // Token standards
    hasNativeTokens: true,
    hasERC20: false,
    hasERC721: false,
    hasERC1155: false,

    // Smart contracts
    hasSmartContracts: true,
    contractLanguage: 'solidity',

    // Consensus
    hasConsensusService: true,
    hasEventLogs: false,

    // Account model
    accountModel: 'account-based',

    // Performance
    averageTPS: 10000,
    averageFinalitySeconds: 3,

    // Advanced features
    hasStaking: true,
    hasGovernance: false,
    hasMultisig: true,

    // Token features
    hasTokenFreeze: true,
    hasTokenPause: true,
    hasTokenBurn: true,
    hasTokenMint: true,

    // Network features
    hasPredictableFees: true,
    hasVariableGas: false,

    // Account features
    hasAccountCreation: true,
    hasAccountAssociation: true,
  },

  ethereum: {
    // Token standards
    hasNativeTokens: false,
    hasERC20: true,
    hasERC721: true,
    hasERC1155: true,

    // Smart contracts
    hasSmartContracts: true,
    contractLanguage: 'solidity',

    // Consensus
    hasConsensusService: false,
    hasEventLogs: true,

    // Account model
    accountModel: 'account-based',

    // Performance
    averageTPS: 15,
    averageFinalitySeconds: 180, // ~12-15 sec per block, need ~12-15 confirmations

    // Advanced features
    hasStaking: true,
    hasGovernance: true,
    hasMultisig: true,

    // Token features
    hasTokenFreeze: false,
    hasTokenPause: false,       // Depends on smart contract implementation
    hasTokenBurn: true,
    hasTokenMint: true,

    // Network features
    hasPredictableFees: false,
    hasVariableGas: true,

    // Account features
    hasAccountCreation: false,  // EOAs created from private key
    hasAccountAssociation: false,
  },

  solana: {
    // Token standards
    hasNativeTokens: true,       // SPL Token
    hasERC20: false,
    hasERC721: false,
    hasERC1155: false,

    // Smart contracts
    hasSmartContracts: true,
    contractLanguage: 'rust',

    // Consensus
    hasConsensusService: false,
    hasEventLogs: false,         // Uses account data instead

    // Account model
    accountModel: 'account-based',

    // Performance
    averageTPS: 3000,
    averageFinalitySeconds: 0.4,

    // Advanced features
    hasStaking: true,
    hasGovernance: true,
    hasMultisig: true,

    // Token features
    hasTokenFreeze: true,
    hasTokenPause: false,
    hasTokenBurn: true,
    hasTokenMint: true,

    // Network features
    hasPredictableFees: false,
    hasVariableGas: true,        // Variable fees based on priority

    // Account features
    hasAccountCreation: true,
    hasAccountAssociation: false,
  },

  base: {
    // Token standards (inherits from Ethereum)
    hasNativeTokens: false,
    hasERC20: true,
    hasERC721: true,
    hasERC1155: true,

    // Smart contracts
    hasSmartContracts: true,
    contractLanguage: 'solidity',

    // Consensus
    hasConsensusService: false,
    hasEventLogs: true,

    // Account model
    accountModel: 'account-based',

    // Performance (L2 improvements)
    averageTPS: 1000,
    averageFinalitySeconds: 2,

    // Advanced features
    hasStaking: false,           // L2 doesn't have native staking
    hasGovernance: true,
    hasMultisig: true,

    // Token features
    hasTokenFreeze: false,
    hasTokenPause: false,
    hasTokenBurn: true,
    hasTokenMint: true,

    // Network features
    hasPredictableFees: false,
    hasVariableGas: true,        // But much lower than Ethereum L1

    // Account features
    hasAccountCreation: false,
    hasAccountAssociation: false,
  },
}

/**
 * Chain metadata for all supported blockchains.
 */
export const CHAIN_METADATA: Record<SupportedChain, ChainMetadata> = {
  hedera: {
    id: 'hedera',
    name: 'hedera',
    displayName: 'Hedera',
    description: 'Enterprise-grade public blockchain with predictable fees and ABFT consensus',
    nativeToken: 'HBAR',
    explorerUrl: {
      mainnet: 'https://hashscan.io/mainnet',
      testnet: 'https://hashscan.io/testnet',
    },
    rpcUrls: {
      mainnet: ['https://mainnet-public.mirrornode.hedera.com'],
      testnet: ['https://testnet.mirrornode.hedera.com'],
    },
    chainId: {
      mainnet: '295',
      testnet: '296',
    },
    documentation: 'https://docs.hedera.com',
  },

  ethereum: {
    id: 'ethereum',
    name: 'ethereum',
    displayName: 'Ethereum',
    description: 'The most established smart contract platform with maximum decentralization',
    nativeToken: 'ETH',
    explorerUrl: {
      mainnet: 'https://etherscan.io',
      testnet: 'https://sepolia.etherscan.io',
    },
    rpcUrls: {
      mainnet: [
        'https://eth-mainnet.g.alchemy.com/v2/',
        'https://mainnet.infura.io/v3/',
      ],
      testnet: [
        'https://eth-sepolia.g.alchemy.com/v2/',
        'https://sepolia.infura.io/v3/',
      ],
    },
    chainId: {
      mainnet: 1,
      testnet: 11155111, // Sepolia
    },
    documentation: 'https://ethereum.org/developers',
  },

  solana: {
    id: 'solana',
    name: 'solana',
    displayName: 'Solana',
    description: 'High-performance blockchain optimized for speed and low fees',
    nativeToken: 'SOL',
    explorerUrl: {
      mainnet: 'https://explorer.solana.com',
      testnet: 'https://explorer.solana.com?cluster=devnet',
    },
    rpcUrls: {
      mainnet: ['https://api.mainnet-beta.solana.com'],
      testnet: ['https://api.devnet.solana.com'],
    },
    documentation: 'https://docs.solana.com',
  },

  base: {
    id: 'base',
    name: 'base',
    displayName: 'Base',
    description: 'Ethereum L2 by Coinbase with low fees and easy fiat on-ramps',
    nativeToken: 'ETH',
    explorerUrl: {
      mainnet: 'https://basescan.org',
      testnet: 'https://sepolia.basescan.org',
    },
    rpcUrls: {
      mainnet: ['https://mainnet.base.org'],
      testnet: ['https://sepolia.base.org'],
    },
    chainId: {
      mainnet: 8453,
      testnet: 84532, // Base Sepolia
    },
    documentation: 'https://docs.base.org',
  },
}

/**
 * Utility class for working with chain capabilities.
 */
export class ChainCapabilityDetector {
  /**
   * Get capabilities for a specific chain.
   */
  static getCapabilities(chain: SupportedChain): ChainCapabilities {
    return CHAIN_CAPABILITIES[chain]
  }

  /**
   * Get metadata for a specific chain.
   */
  static getMetadata(chain: SupportedChain): ChainMetadata {
    return CHAIN_METADATA[chain]
  }

  /**
   * Check if a chain supports a specific capability.
   */
  static hasCapability(
    chain: SupportedChain,
    capability: keyof ChainCapabilities
  ): boolean {
    return CHAIN_CAPABILITIES[chain][capability] as boolean
  }

  /**
   * Find chains that support a specific capability.
   */
  static findChainsByCapability(
    capability: keyof ChainCapabilities,
    value: any = true
  ): SupportedChain[] {
    return Object.entries(CHAIN_CAPABILITIES)
      .filter(([_, caps]) => caps[capability] === value)
      .map(([chain]) => chain as SupportedChain)
  }

  /**
   * Get human-readable capability description.
   */
  static getCapabilityDescription(capability: keyof ChainCapabilities): string {
    const descriptions: Record<string, string> = {
      hasNativeTokens: 'Native token service (e.g., HTS, SPL)',
      hasERC20: 'ERC-20 fungible token standard',
      hasERC721: 'ERC-721 NFT standard',
      hasERC1155: 'ERC-1155 multi-token standard',
      hasSmartContracts: 'Smart contract deployment',
      hasConsensusService: 'Consensus/messaging service (Hedera HCS)',
      hasEventLogs: 'Event logs for pub/sub patterns',
      hasStaking: 'Native staking functionality',
      hasGovernance: 'On-chain governance',
      hasMultisig: 'Multi-signature wallets',
      hasTokenFreeze: 'Ability to freeze token accounts',
      hasTokenPause: 'Ability to pause token operations',
      hasPredictableFees: 'Fixed, predictable transaction fees',
      hasVariableGas: 'Variable gas fees based on network demand',
    }

    return descriptions[capability] || capability
  }

  /**
   * Compare performance metrics across chains.
   */
  static comparePerformance(chains: SupportedChain[]): {
    chain: SupportedChain
    tps: number
    finality: number
  }[] {
    return chains.map(chain => ({
      chain,
      tps: CHAIN_CAPABILITIES[chain].averageTPS,
      finality: CHAIN_CAPABILITIES[chain].averageFinalitySeconds,
    }))
  }

  /**
   * Get fastest chain by TPS.
   */
  static getFastestChain(chains: SupportedChain[] = Object.keys(CHAIN_CAPABILITIES) as SupportedChain[]): SupportedChain {
    return chains.reduce((fastest, chain) => {
      const currentTPS = CHAIN_CAPABILITIES[chain].averageTPS
      const fastestTPS = CHAIN_CAPABILITIES[fastest].averageTPS
      return currentTPS > fastestTPS ? chain : fastest
    })
  }

  /**
   * Get chain with fastest finality.
   */
  static getFastestFinality(chains: SupportedChain[] = Object.keys(CHAIN_CAPABILITIES) as SupportedChain[]): SupportedChain {
    return chains.reduce((fastest, chain) => {
      const currentFinality = CHAIN_CAPABILITIES[chain].averageFinalitySeconds
      const fastestFinality = CHAIN_CAPABILITIES[fastest].averageFinalitySeconds
      return currentFinality < fastestFinality ? chain : fastest
    })
  }
}
