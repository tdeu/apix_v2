/**
 * Wallet Service Abstraction
 *
 * Provides a unified interface for wallet operations across all supported chains.
 * Each chain has its own supported wallets, and this service helps discover
 * and manage wallet connections.
 */

import { WalletProvider, WalletConnection, SupportedChain } from '../core/types'

/**
 * Wallet service interface for common wallet operations.
 */
export interface WalletService {
  /**
   * Connect to a wallet provider.
   */
  connect(provider: WalletProvider): Promise<WalletConnection>

  /**
   * Disconnect from the current wallet.
   */
  disconnect(): Promise<void>

  /**
   * Check if a wallet is currently connected.
   */
  isConnected(): boolean

  /**
   * Get the connected wallet address.
   */
  getAddress(): string | null

  /**
   * Sign a message with the connected wallet.
   */
  signMessage(message: string): Promise<string>
}

/**
 * Wallet metadata for display purposes.
 */
export interface WalletMetadata {
  /** Display name of the wallet */
  name: string
  /** Short description */
  description: string
  /** URL to wallet logo/icon */
  iconUrl: string
  /** URL to wallet website */
  websiteUrl: string
  /** URL to install the wallet extension */
  installUrl: string
}

/**
 * Get metadata for supported wallets.
 */
export const WALLET_METADATA: Record<WalletProvider, WalletMetadata> = {
  // Hedera wallets
  hashpack: {
    name: 'HashPack',
    description: 'The leading Hedera wallet',
    iconUrl: 'https://www.hashpack.app/favicon.ico',
    websiteUrl: 'https://www.hashpack.app',
    installUrl: 'https://www.hashpack.app/download'
  },
  blade: {
    name: 'Blade Wallet',
    description: 'Next-generation Hedera wallet',
    iconUrl: 'https://bladewallet.io/favicon.ico',
    websiteUrl: 'https://bladewallet.io',
    installUrl: 'https://bladewallet.io'
  },

  // Ethereum/Base wallets
  metamask: {
    name: 'MetaMask',
    description: 'The most popular Ethereum wallet',
    iconUrl: 'https://metamask.io/icons/icon-48x48.png',
    websiteUrl: 'https://metamask.io',
    installUrl: 'https://metamask.io/download'
  },
  walletconnect: {
    name: 'WalletConnect',
    description: 'Connect with mobile wallets',
    iconUrl: 'https://walletconnect.org/favicon.ico',
    websiteUrl: 'https://walletconnect.org',
    installUrl: 'https://walletconnect.org'
  },
  'coinbase-wallet': {
    name: 'Coinbase Wallet',
    description: 'Self-custody crypto wallet by Coinbase',
    iconUrl: 'https://www.coinbase.com/favicon.ico',
    websiteUrl: 'https://www.coinbase.com/wallet',
    installUrl: 'https://www.coinbase.com/wallet/downloads'
  },

  // Solana wallets
  phantom: {
    name: 'Phantom',
    description: 'The most popular Solana wallet',
    iconUrl: 'https://phantom.app/favicon.ico',
    websiteUrl: 'https://phantom.app',
    installUrl: 'https://phantom.app/download'
  },
  solflare: {
    name: 'Solflare',
    description: 'Secure Solana wallet',
    iconUrl: 'https://solflare.com/favicon.ico',
    websiteUrl: 'https://solflare.com',
    installUrl: 'https://solflare.com'
  },

  // Custom provider
  custom: {
    name: 'Custom Wallet',
    description: 'Custom wallet provider',
    iconUrl: '',
    websiteUrl: '',
    installUrl: ''
  }
}

/**
 * Factory for getting supported wallets by chain.
 */
export class WalletServiceFactory {
  /**
   * Get list of supported wallet providers for a chain.
   *
   * @param chain - The blockchain to get wallets for
   * @returns Array of supported wallet providers
   */
  static getSupportedWallets(chain: SupportedChain): WalletProvider[] {
    switch (chain) {
      case 'hedera':
        return ['hashpack', 'blade']
      case 'ethereum':
        return ['metamask', 'walletconnect', 'coinbase-wallet']
      case 'base':
        return ['metamask', 'walletconnect', 'coinbase-wallet']
      case 'solana':
        return ['phantom', 'solflare']
      default:
        return []
    }
  }

  /**
   * Get metadata for a wallet provider.
   *
   * @param provider - The wallet provider
   * @returns Wallet metadata or undefined if not found
   */
  static getWalletMetadata(provider: WalletProvider): WalletMetadata | undefined {
    return WALLET_METADATA[provider]
  }

  /**
   * Check if a wallet provider is supported for a chain.
   *
   * @param chain - The blockchain
   * @param provider - The wallet provider
   * @returns True if the wallet is supported
   */
  static isWalletSupported(chain: SupportedChain, provider: WalletProvider): boolean {
    const supported = this.getSupportedWallets(chain)
    return supported.includes(provider)
  }

  /**
   * Check if a wallet is available in the browser.
   * This checks if the wallet extension is installed.
   *
   * @param provider - The wallet provider to check
   * @returns True if the wallet is available
   */
  static isWalletAvailable(provider: WalletProvider): boolean {
    if (typeof window === 'undefined') return false

    switch (provider) {
      case 'metamask':
        return !!(window as any).ethereum?.isMetaMask
      case 'coinbase-wallet':
        return !!(window as any).ethereum?.isCoinbaseWallet || !!(window as any).coinbaseWalletExtension
      case 'phantom':
        return !!(window as any).solana?.isPhantom || !!(window as any).phantom?.solana?.isPhantom
      case 'solflare':
        return !!(window as any).solflare?.isSolflare
      case 'walletconnect':
        return true // WalletConnect doesn't require an extension
      case 'hashpack':
        return true // HashPack uses MetaMask Snaps or mobile deep linking
      case 'blade':
        return true // Blade uses WalletConnect
      default:
        return false
    }
  }

  /**
   * Get available wallets for a chain (installed in browser).
   *
   * @param chain - The blockchain to get available wallets for
   * @returns Array of available wallet providers
   */
  static getAvailableWallets(chain: SupportedChain): WalletProvider[] {
    const supported = this.getSupportedWallets(chain)
    return supported.filter(provider => this.isWalletAvailable(provider))
  }
}

/**
 * Export wallet providers and metadata for convenience.
 */
export { WalletProvider, WalletConnection }
