/**
 * Adapter Factory
 *
 * Dynamically creates blockchain adapters with lazy loading of SDKs.
 * This ensures we only load the blockchain SDK when it's actually needed,
 * keeping bundle size small and installation flexible.
 */

import { SupportedChain, BlockchainConfiguration, BlockchainError, BlockchainErrorCode } from './types'
import { BlockchainAdapter } from './BlockchainAdapter'
import { ChainCapabilityDetector } from './ChainCapabilities'

/**
 * Factory class for creating blockchain adapters.
 * Handles lazy loading of chain-specific SDKs.
 */
export class AdapterFactory {
  private static adapters: Map<SupportedChain, BlockchainAdapter> = new Map()

  /**
   * Create or retrieve a blockchain adapter.
   *
   * This method:
   * 1. Checks if adapter already exists (singleton pattern)
   * 2. Lazily imports the chain-specific SDK
   * 3. Creates and initializes the adapter
   * 4. Caches the adapter for future use
   *
   * @param chain - Which blockchain to create adapter for
   * @param config - Chain configuration (optional if adapter exists)
   * @returns Initialized blockchain adapter
   * @throws {BlockchainError} if SDK not installed or initialization fails
   */
  static async createAdapter(
    chain: SupportedChain,
    config?: BlockchainConfiguration
  ): Promise<BlockchainAdapter> {
    // Return cached adapter if it exists and is connected
    const existing = this.adapters.get(chain)
    if (existing && await existing.isConnected()) {
      return existing
    }

    // Create new adapter with lazy SDK loading
    const adapter = await this.loadAdapter(chain)

    // Initialize if config provided
    if (config) {
      await adapter.initialize(config)
    }

    // Cache the adapter
    this.adapters.set(chain, adapter)

    return adapter
  }

  /**
   * Load adapter with lazy SDK import.
   * Only imports the SDK when the adapter is first requested.
   *
   * @param chain - Which blockchain adapter to load
   * @returns Uninitialized adapter instance
   * @throws {BlockchainError} if SDK not installed
   */
  private static async loadAdapter(chain: SupportedChain): Promise<BlockchainAdapter> {
    try {
      switch (chain) {
        case 'hedera':
          return await this.loadHederaAdapter()

        case 'ethereum':
          return await this.loadEthereumAdapter()

        case 'solana':
          return await this.loadSolanaAdapter()

        case 'base':
          return await this.loadBaseAdapter()

        default:
          throw new BlockchainError(
            BlockchainErrorCode.UNSUPPORTED_OPERATION,
            `Unsupported blockchain: ${chain}`
          )
      }
    } catch (error: any) {
      // Handle missing SDK errors
      if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes('Cannot find module')) {
        throw new BlockchainError(
          BlockchainErrorCode.INVALID_CREDENTIALS,
          `${chain} SDK not installed. Please install the required dependency.`,
          {
            chain,
            installCommand: this.getInstallCommand(chain),
            originalError: error.message,
          }
        )
      }
      throw error
    }
  }

  /**
   * Lazy load Hedera adapter.
   */
  private static async loadHederaAdapter(): Promise<BlockchainAdapter> {
    try {
      // Dynamic import - only loads when Hedera is first used
      const { HederaAdapter } = await import('../adapters/HederaAdapter')
      return new HederaAdapter()
    } catch (error) {
      throw this.createSDKError('hedera', error)
    }
  }

  /**
   * Lazy load Ethereum adapter.
   */
  private static async loadEthereumAdapter(): Promise<BlockchainAdapter> {
    try {
      // Dynamic import - only loads when Ethereum is first used
      const { EthereumAdapter } = await import('../adapters/EthereumAdapter')
      return new EthereumAdapter()
    } catch (error) {
      throw this.createSDKError('ethereum', error)
    }
  }

  /**
   * Lazy load Solana adapter.
   */
  private static async loadSolanaAdapter(): Promise<BlockchainAdapter> {
    try {
      // Dynamic import - only loads when Solana is first used
      const { SolanaAdapter } = await import('../adapters/SolanaAdapter')
      return new SolanaAdapter()
    } catch (error) {
      throw this.createSDKError('solana', error)
    }
  }

  /**
   * Lazy load Base adapter.
   */
  private static async loadBaseAdapter(): Promise<BlockchainAdapter> {
    try {
      // Dynamic import - only loads when Base is first used
      const { BaseAdapter } = await import('../adapters/BaseAdapter')
      return new BaseAdapter()
    } catch (error) {
      throw this.createSDKError('base', error)
    }
  }

  /**
   * Create helpful error message for missing SDK.
   */
  private static createSDKError(chain: SupportedChain, error: any): BlockchainError {
    const errorMessage = error?.message || String(error)

    // Check if it's a module not found error
    if (errorMessage.includes('Cannot find module') || errorMessage.includes('MODULE_NOT_FOUND')) {
      return new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        `${chain.charAt(0).toUpperCase() + chain.slice(1)} SDK not installed.\n\n` +
        `To use ${chain}, please install the required SDK:\n\n` +
        `  ${this.getInstallCommand(chain)}\n\n` +
        `Or install all blockchain SDKs at once:\n\n` +
        `  npm install\n`,
        {
          chain,
          installCommand: this.getInstallCommand(chain),
          suggestion: `Run the install command above to enable ${chain} support`,
        }
      )
    }

    // Other errors (likely adapter implementation not ready)
    return new BlockchainError(
      BlockchainErrorCode.UNKNOWN,
      `Failed to load ${chain} adapter: ${errorMessage}`,
      { chain, originalError: errorMessage }
    )
  }

  /**
   * Get npm install command for a specific chain.
   */
  private static getInstallCommand(chain: SupportedChain): string {
    const commands: Record<SupportedChain, string> = {
      hedera: 'npm install @hashgraph/sdk hedera-agent-kit',
      ethereum: 'npm install ethers',
      solana: 'npm install @solana/web3.js @solana/spl-token',
      base: 'npm install ethers', // Base uses ethers.js
    }
    return commands[chain]
  }

  /**
   * Get adapter without initializing (for capability checks).
   */
  static async getAdapterMetadata(chain: SupportedChain) {
    const capabilities = ChainCapabilityDetector.getCapabilities(chain)
    const metadata = ChainCapabilityDetector.getMetadata(chain)

    return {
      chain,
      capabilities,
      metadata,
      isSDKInstalled: await this.checkSDKInstalled(chain),
    }
  }

  /**
   * Check if SDK is installed without throwing errors.
   */
  private static async checkSDKInstalled(chain: SupportedChain): Promise<boolean> {
    try {
      await this.loadAdapter(chain)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Clear cached adapters (useful for testing or network switching).
   */
  static async clearCache(chain?: SupportedChain): Promise<void> {
    if (chain) {
      const adapter = this.adapters.get(chain)
      if (adapter) {
        await adapter.disconnect()
        this.adapters.delete(chain)
      }
    } else {
      // Clear all adapters
      for (const [_, adapter] of this.adapters) {
        await adapter.disconnect()
      }
      this.adapters.clear()
    }
  }

  /**
   * Get all available chains (SDKs installed).
   */
  static async getAvailableChains(): Promise<SupportedChain[]> {
    const chains: SupportedChain[] = ['hedera', 'ethereum', 'solana', 'base']
    const available: SupportedChain[] = []

    for (const chain of chains) {
      if (await this.checkSDKInstalled(chain)) {
        available.push(chain)
      }
    }

    return available
  }

  /**
   * Auto-install prompt (for interactive CLI).
   * Returns installation instructions for missing SDKs.
   */
  static async getInstallInstructions(chain: SupportedChain): Promise<{
    chain: SupportedChain
    isInstalled: boolean
    installCommand: string
    description: string
  }> {
    const isInstalled = await this.checkSDKInstalled(chain)
    const metadata = ChainCapabilityDetector.getMetadata(chain)

    return {
      chain,
      isInstalled,
      installCommand: this.getInstallCommand(chain),
      description: metadata.description,
    }
  }
}
