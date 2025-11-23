/**
 * BlockchainAdapter Interface
 *
 * This is the CORE interface that ALL blockchains must implement.
 * It provides a unified API across Hedera, Ethereum, Solana, Base, and any future chains.
 *
 * Design Principles:
 * 1. Chain-agnostic: Methods work identically across all blockchains
 * 2. Type-safe: Full TypeScript support with proper return types
 * 3. Extensible: Easy to add new chains without modifying core code
 * 4. Error-handled: Consistent error handling across chains
 */

import {
  BlockchainConfiguration,
  CreateTokenParams,
  TokenResult,
  CreateNFTParams,
  NFTResult,
  MintNFTParams,
  TransferParams,
  TransferNFTParams,
  TransactionResult,
  BalanceParams,
  DeployContractParams,
  ContractResult,
  CallContractParams,
  WalletProvider,
  WalletConnection,
  Transaction,
  SignedTransaction,
  GasPrice,
  EstimateFeeParams,
  FeeEstimate,
  TransactionStatus,
  NetworkType,
  SupportedChain,
} from './types'
import { ChainCapabilities } from './ChainCapabilities'

/**
 * Base interface that ALL blockchain adapters must implement.
 *
 * Each blockchain (Hedera, Ethereum, Solana, Base) will create a class
 * that implements this interface, translating these universal operations
 * into chain-specific SDK calls.
 */
export interface BlockchainAdapter {
  // ============================================================================
  // METADATA & LIFECYCLE
  // ============================================================================

  /**
   * Unique identifier for this blockchain.
   */
  readonly chainId: SupportedChain

  /**
   * Human-readable name of the blockchain.
   */
  readonly name: string

  /**
   * Current network (mainnet, testnet, devnet).
   */
  readonly network: NetworkType

  /**
   * Capabilities this blockchain supports.
   * Used for feature detection and validation.
   */
  readonly capabilities: ChainCapabilities

  /**
   * Initialize the adapter with configuration.
   * Must be called before any blockchain operations.
   *
   * @param config - Chain-specific configuration
   * @throws {BlockchainError} if initialization fails
   */
  initialize(config: BlockchainConfiguration): Promise<void>

  /**
   * Disconnect and clean up resources.
   */
  disconnect(): Promise<void>

  /**
   * Check if the adapter is properly initialized and connected.
   */
  isConnected(): Promise<boolean>

  // ============================================================================
  // TOKEN OPERATIONS (Universal)
  // ============================================================================

  /**
   * Create a fungible token.
   *
   * Chain-specific implementations:
   * - Hedera: TokenCreateTransaction (HTS)
   * - Ethereum/Base: Deploy ERC-20 contract
   * - Solana: create_token instruction (SPL)
   *
   * @param params - Token creation parameters
   * @returns Token creation result with token ID/address
   * @throws {BlockchainError} if creation fails
   */
  createToken(params: CreateTokenParams): Promise<TokenResult>

  /**
   * Transfer fungible tokens from one account to another.
   *
   * @param params - Transfer parameters (to, amount, tokenId)
   * @returns Transaction result
   * @throws {BlockchainError} if transfer fails
   */
  transferToken(params: TransferParams): Promise<TransactionResult>

  /**
   * Get token balance for an address.
   *
   * @param params - Balance query parameters
   * @returns Balance as bigint
   * @throws {BlockchainError} if query fails
   */
  getTokenBalance(params: BalanceParams): Promise<bigint>

  // ============================================================================
  // NFT OPERATIONS (Universal)
  // ============================================================================

  /**
   * Create an NFT collection.
   *
   * Chain-specific implementations:
   * - Hedera: TokenCreateTransaction with TokenType.NON_FUNGIBLE_UNIQUE
   * - Ethereum/Base: Deploy ERC-721 or ERC-1155 contract
   * - Solana: Create Metaplex collection
   *
   * @param params - NFT collection creation parameters
   * @returns NFT collection creation result
   * @throws {BlockchainError} if creation fails or not supported
   */
  createNFT(params: CreateNFTParams): Promise<NFTResult>

  /**
   * Mint an NFT in an existing collection.
   *
   * @param params - Mint parameters (collectionId, to, metadata)
   * @returns Transaction result
   * @throws {BlockchainError} if minting fails
   */
  mintNFT(params: MintNFTParams): Promise<TransactionResult>

  /**
   * Transfer an NFT from one account to another.
   *
   * @param params - NFT transfer parameters
   * @returns Transaction result
   * @throws {BlockchainError} if transfer fails
   */
  transferNFT(params: TransferNFTParams): Promise<TransactionResult>

  // ============================================================================
  // SMART CONTRACT OPERATIONS (Universal)
  // ============================================================================

  /**
   * Deploy a smart contract.
   *
   * Chain-specific implementations:
   * - Hedera: FileCreateTransaction + ContractCreateTransaction
   * - Ethereum/Base: Deploy contract via ethers.js
   * - Solana: Deploy program via solana-program-deploy
   *
   * @param params - Contract deployment parameters
   * @returns Contract deployment result with address/ID
   * @throws {BlockchainError} if deployment fails or not supported
   */
  deployContract(params: DeployContractParams): Promise<ContractResult>

  /**
   * Call a smart contract method.
   *
   * @param params - Contract call parameters
   * @returns Result from the contract call
   * @throws {BlockchainError} if call fails
   */
  callContract(params: CallContractParams): Promise<any>

  // ============================================================================
  // WALLET OPERATIONS (Universal)
  // ============================================================================

  /**
   * Connect to a wallet provider.
   *
   * Chain-specific implementations:
   * - Hedera: HashPack, Blade, WalletConnect
   * - Ethereum/Base: MetaMask, Coinbase Wallet, WalletConnect
   * - Solana: Phantom, Solflare
   *
   * @param provider - Wallet provider type
   * @returns Wallet connection information
   * @throws {BlockchainError} if connection fails
   */
  connectWallet(provider: WalletProvider): Promise<WalletConnection>

  /**
   * Get native token balance for an address (HBAR, ETH, SOL).
   *
   * @param address - Account address
   * @returns Balance in native token units
   * @throws {BlockchainError} if query fails
   */
  getBalance(address: string): Promise<bigint>

  /**
   * Sign a transaction with the connected wallet.
   *
   * @param tx - Transaction to sign
   * @returns Signed transaction
   * @throws {BlockchainError} if signing fails
   */
  signTransaction(tx: Transaction): Promise<SignedTransaction>

  // ============================================================================
  // NETWORK OPERATIONS (Universal)
  // ============================================================================

  /**
   * Get current gas prices / transaction fees.
   *
   * Chain-specific implementations:
   * - Hedera: Fixed fee schedule from mirror node
   * - Ethereum/Base: Gas price from RPC (baseFee + priorityFee)
   * - Solana: Recent prioritization fees
   *
   * @returns Current gas prices in chain-native units
   * @throws {BlockchainError} if query fails
   */
  getGasPrice(): Promise<GasPrice>

  /**
   * Estimate fees for a transaction.
   *
   * @param params - Fee estimation parameters
   * @returns Fee estimate in native token and USD
   * @throws {BlockchainError} if estimation fails
   */
  estimateFees(params: EstimateFeeParams): Promise<FeeEstimate>

  /**
   * Get transaction status by transaction ID/hash.
   *
   * @param txId - Transaction ID or hash
   * @returns Transaction status information
   * @throws {BlockchainError} if query fails
   */
  getTransactionStatus(txId: string): Promise<TransactionStatus>

  /**
   * Get block explorer URL for a transaction.
   *
   * @param txId - Transaction ID or hash
   * @returns URL to view transaction on block explorer
   */
  getExplorerUrl(txId: string): string

  // ============================================================================
  // CHAIN-SPECIFIC OPERATIONS (Optional)
  // ============================================================================

  /**
   * Execute a chain-specific operation that doesn't fit the universal interface.
   *
   * Examples:
   * - Hedera: Create HCS topic, submit consensus message
   * - Ethereum: Interact with specific DeFi protocols
   * - Solana: Create token account, interact with Anchor programs
   *
   * This is an escape hatch for operations that are truly chain-specific.
   * Use sparingly - most operations should use the universal interface above.
   *
   * @param operation - Operation identifier (e.g., 'createHCSTopic')
   * @param params - Operation-specific parameters
   * @returns Operation-specific result
   * @throws {BlockchainError} if operation fails or not supported
   */
  executeChainSpecificOperation(operation: string, params: any): Promise<any>
}

/**
 * Abstract base class that provides common functionality for all adapters.
 * Concrete adapters (HederaAdapter, EthereumAdapter, etc.) extend this.
 */
export abstract class BaseBlockchainAdapter implements BlockchainAdapter {
  // Metadata (to be set by concrete adapters)
  abstract readonly chainId: SupportedChain
  abstract readonly name: string
  abstract network: NetworkType
  abstract readonly capabilities: ChainCapabilities

  // Connection state
  protected _isConnected: boolean = false
  protected config?: BlockchainConfiguration

  // Abstract methods that MUST be implemented by concrete adapters
  abstract initialize(config: BlockchainConfiguration): Promise<void>
  abstract disconnect(): Promise<void>
  abstract createToken(params: CreateTokenParams): Promise<TokenResult>
  abstract transferToken(params: TransferParams): Promise<TransactionResult>
  abstract getTokenBalance(params: BalanceParams): Promise<bigint>
  abstract createNFT(params: CreateNFTParams): Promise<NFTResult>
  abstract mintNFT(params: MintNFTParams): Promise<TransactionResult>
  abstract transferNFT(params: TransferNFTParams): Promise<TransactionResult>
  abstract deployContract(params: DeployContractParams): Promise<ContractResult>
  abstract callContract(params: CallContractParams): Promise<any>
  abstract connectWallet(provider: WalletProvider): Promise<WalletConnection>
  abstract getBalance(address: string): Promise<bigint>
  abstract signTransaction(tx: Transaction): Promise<SignedTransaction>
  abstract getGasPrice(): Promise<GasPrice>
  abstract estimateFees(params: EstimateFeeParams): Promise<FeeEstimate>
  abstract getTransactionStatus(txId: string): Promise<TransactionStatus>
  abstract getExplorerUrl(txId: string): string

  // Default implementation for chain-specific operations
  async executeChainSpecificOperation(operation: string, params: any): Promise<any> {
    throw new Error(
      `Chain-specific operation '${operation}' not implemented for ${this.name}`
    )
  }

  // Common helper: Check if connected
  async isConnected(): Promise<boolean> {
    return this._isConnected
  }

  // Common helper: Validate initialization
  protected ensureInitialized(): void {
    if (!this._isConnected) {
      throw new Error(`${this.name} adapter not initialized. Call initialize() first.`)
    }
  }

  // Common helper: Validate capability
  protected ensureCapability(capability: keyof ChainCapabilities, operation: string): void {
    if (!this.capabilities[capability]) {
      throw new Error(
        `${this.name} does not support ${operation}. ` +
        `Required capability: ${capability}`
      )
    }
  }
}
