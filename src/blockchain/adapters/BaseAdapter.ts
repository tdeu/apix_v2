/**
 * Base (Coinbase L2) Blockchain Adapter
 *
 * Implements the BlockchainAdapter interface for Base by extending EthereumAdapter.
 * Base is an Ethereum L2 built on the OP Stack, so it's fully EVM-compatible.
 *
 * Key differences from Ethereum:
 * - Different chain IDs: 8453 (mainnet), 84532 (Base Sepolia)
 * - Different RPC endpoints: base.org
 * - Different block explorer: basescan.org
 * - Lower gas fees (~1/100th of Ethereum L1)
 * - Faster block times (~2 seconds)
 *
 * All other operations (ERC-20, ERC-721, contracts) work identically to Ethereum.
 */

import { EthereumAdapter } from './EthereumAdapter'
import {
  BlockchainConfiguration,
  SupportedChain,
} from '../core/types'
import { CHAIN_CAPABILITIES, CHAIN_METADATA } from '../core/ChainCapabilities'

/**
 * Base Blockchain Adapter
 *
 * Extends EthereumAdapter with Base-specific configuration.
 * All ERC-20, ERC-721, and smart contract operations are inherited.
 */
export class BaseAdapter extends EthereumAdapter {
  // Override metadata for Base
  readonly chainId: SupportedChain = 'base'
  readonly name: string = 'Base'
  readonly capabilities = CHAIN_CAPABILITIES.base

  /**
   * Override initialize to log Base-specific message.
   */
  async initialize(config: BlockchainConfiguration): Promise<void> {
    // Call parent initialization
    await super.initialize(config)

    // Update the log message to reflect Base
    console.log(
      `BaseAdapter initialized for ${this.network} with address ${this.operatorAddress}`
    )
  }

  /**
   * Get RPC URL for Base network.
   * Overrides EthereumAdapter to use Base-specific endpoints.
   */
  protected getRpcUrl(config: BlockchainConfiguration): string {
    // Use custom RPC URL if provided
    if (config.rpcUrl) {
      return config.rpcUrl
    }

    // Use chainId-specific URL from customConfig
    if (config.customConfig?.rpcUrl) {
      return config.customConfig.rpcUrl
    }

    // Default Base RPC URLs (free public endpoints)
    if (this.network === 'mainnet') {
      return 'https://mainnet.base.org'
    }
    return 'https://sepolia.base.org' // Base Sepolia testnet
  }

  /**
   * Get expected chain ID for Base network.
   * Overrides EthereumAdapter to use Base chain IDs.
   */
  protected getExpectedChainId(): number {
    const metadata = CHAIN_METADATA.base
    if (this.network === 'mainnet') {
      return metadata.chainId?.mainnet as number || 8453
    }
    return metadata.chainId?.testnet as number || 84532 // Base Sepolia
  }

  /**
   * Get block explorer URL for a transaction.
   * Overrides EthereumAdapter to use Basescan.
   */
  getExplorerUrl(txId: string): string {
    const metadata = CHAIN_METADATA.base
    const networkKey = this.network === 'mainnet' ? 'mainnet' : 'testnet'
    const baseUrl = metadata.explorerUrl[networkKey]
    return `${baseUrl}/tx/${txId}`
  }
}
