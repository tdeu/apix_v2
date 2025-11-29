/**
 * Window type declarations for browser wallet APIs.
 *
 * These declarations extend the global Window interface to include
 * wallet provider APIs that are injected by browser extensions.
 */

/**
 * Ethereum provider interface (EIP-1193).
 * Injected by MetaMask, Coinbase Wallet, and other EVM wallets.
 */
interface EthereumProvider {
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
  isConnected?: () => boolean
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, callback: (...args: unknown[]) => void) => void
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void
  // For chain/account changes
  selectedAddress?: string | null
  chainId?: string | null
}

/**
 * Solana provider interface.
 * Injected by Phantom, Solflare, and other Solana wallets.
 */
interface SolanaProvider {
  isPhantom?: boolean
  isSolflare?: boolean
  isConnected: boolean
  publicKey: { toString: () => string; toBase58: () => string } | null
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>
  disconnect: () => Promise<void>
  signTransaction: <T>(transaction: T) => Promise<T>
  signAllTransactions: <T>(transactions: T[]) => Promise<T[]>
  signMessage: (message: Uint8Array, display?: 'utf8' | 'hex') => Promise<{ signature: Uint8Array }>
  on: (event: string, callback: (...args: unknown[]) => void) => void
  off: (event: string, callback: (...args: unknown[]) => void) => void
}

/**
 * Extended Window interface with wallet providers.
 */
declare global {
  interface Window {
    /**
     * Ethereum provider (EIP-1193).
     * Available when MetaMask, Coinbase Wallet, or other EVM wallets are installed.
     */
    ethereum?: EthereumProvider

    /**
     * Solana provider.
     * Available when Phantom, Solflare, or other Solana wallets are installed.
     * Note: Some wallets use window.solana, others use window.phantom.solana
     */
    solana?: SolanaProvider

    /**
     * Phantom-specific namespace.
     */
    phantom?: {
      solana?: SolanaProvider
    }
  }
}

export {}

/**
 * Module declarations for optional wallet SDKs.
 * These modules are dynamically imported and may not be installed.
 */

// HashConnect - Hedera wallet connector
declare module 'hashconnect' {
  export class HashConnect {
    init(
      appMetadata: { name: string; description: string; icon: string },
      network: string,
      singleAccount: boolean
    ): Promise<any>
    pairingEvent: {
      on(callback: (data: any) => void): void
    }
    connectToLocalWallet(): void
    disconnect(): Promise<void>
  }
}

// Blade Wallet connector
declare module '@aspect-labs/blade-web3.js' {
  export enum ConnectorStrategy {
    WALLET_CONNECT = 'WALLET_CONNECT'
  }

  export class BladeConnector {
    static init(
      strategy: ConnectorStrategy,
      config: { name: string; description: string; network: string }
    ): Promise<BladeConnector>
    createSession(): Promise<{ accountIds: string[] }>
    disconnect(): Promise<void>
  }
}

// WalletConnect provider (optional)
declare module '@walletconnect/web3-provider' {
  export class WalletConnectProvider {
    constructor(config: { rpc: Record<number, string> })
    enable(): Promise<void>
  }
}

// Coinbase Wallet SDK (optional)
declare module '@coinbase/wallet-sdk' {
  export class CoinbaseWalletSDK {
    constructor(config: { appName: string; appLogoUrl?: string })
    makeWeb3Provider(): any
  }
}
