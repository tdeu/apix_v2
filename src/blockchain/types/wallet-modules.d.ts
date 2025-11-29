/**
 * Module declarations for optional wallet SDKs.
 *
 * These modules are dynamically imported at runtime and may not be installed.
 * These declarations allow TypeScript to compile without the actual packages.
 */

// HashConnect - Hedera wallet connector
declare module 'hashconnect' {
  export interface HashConnectAppMetadata {
    name: string
    description: string
    icon: string
  }

  export interface PairingData {
    accountIds: string[]
    network: string
    topic: string
  }

  export class HashConnect {
    init(
      appMetadata: HashConnectAppMetadata,
      network: string,
      singleAccount: boolean
    ): Promise<{ topic: string; pairingString: string }>

    pairingEvent: {
      on(callback: (data: PairingData) => void): void
      off(callback: (data: PairingData) => void): void
    }

    connectToLocalWallet(): void
    disconnect(): Promise<void>
  }
}

// Blade Wallet connector
declare module '@aspect-labs/blade-web3.js' {
  export enum ConnectorStrategy {
    WALLET_CONNECT = 'WALLET_CONNECT',
    EXTENSION = 'EXTENSION'
  }

  export interface BladeConfig {
    name: string
    description: string
    network: string
  }

  export interface BladeSession {
    accountIds: string[]
    network: string
  }

  export class BladeConnector {
    static init(
      strategy: ConnectorStrategy,
      config: BladeConfig
    ): Promise<BladeConnector>

    createSession(): Promise<BladeSession>
    disconnect(): Promise<void>
    getAccountId(): string | null
  }
}

// WalletConnect provider (optional)
declare module '@walletconnect/web3-provider' {
  export interface WalletConnectProviderOptions {
    rpc: Record<number, string>
    chainId?: number
    bridge?: string
  }

  export class WalletConnectProvider {
    constructor(options: WalletConnectProviderOptions)
    enable(): Promise<string[]>
    disconnect(): Promise<void>
    on(event: string, callback: (...args: any[]) => void): void
  }
}

// Coinbase Wallet SDK (optional)
declare module '@coinbase/wallet-sdk' {
  export interface CoinbaseWalletSDKOptions {
    appName: string
    appLogoUrl?: string
    darkMode?: boolean
  }

  export class CoinbaseWalletSDK {
    constructor(options: CoinbaseWalletSDKOptions)
    makeWeb3Provider(chainId?: number): any
    disconnect(): void
  }
}

// Solflare wallet adapter (optional)
declare module '@solana/wallet-adapter-solflare' {
  export class SolflareWalletAdapter {
    publicKey: { toString(): string; toBase58(): string } | null
    connected: boolean
    connect(): Promise<void>
    disconnect(): Promise<void>
    signTransaction<T>(transaction: T): Promise<T>
    signAllTransactions<T>(transactions: T[]): Promise<T[]>
    signMessage(message: Uint8Array): Promise<Uint8Array>
  }
}
