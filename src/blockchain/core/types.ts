/**
 * Chain-Agnostic Type Definitions
 *
 * This file contains all blockchain-agnostic types that work across
 * Hedera, Ethereum, Solana, Base, and any future blockchain integrations.
 */

/**
 * Supported blockchain identifiers.
 * Adding a new chain = add to this union type.
 */
export type SupportedChain =
  | 'hedera'
  | 'ethereum'
  | 'solana'
  | 'base'
  // Future chains can be added here:
  // | 'polygon'
  // | 'avalanche'
  // | 'arbitrum'
  // | 'optimism'

/**
 * Universal integration types (chain-agnostic).
 * Maps to chain-specific implementations via FeatureMapper.
 */
export type IntegrationType =
  | 'token'              // HTS (Hedera), ERC-20 (Ethereum), SPL Token (Solana)
  | 'nft'                // ERC-721, Metaplex NFT, Hedera NFT
  | 'smart-contract'     // Solidity, Rust programs, etc.
  | 'wallet'             // Multi-wallet support
  | 'consensus'          // Hedera HCS, Ethereum events, Solana account data
  | 'defi'               // Future: DEX, lending, staking

/**
 * Network environment types.
 */
export type NetworkType = 'mainnet' | 'testnet' | 'devnet' | 'localnet'

/**
 * Blockchain configuration (unified across all chains).
 */
export interface BlockchainConfiguration {
  chain: SupportedChain
  network: NetworkType
  credentials: ChainCredentials
  rpcUrl?: string
  mirrorNodeUrl?: string  // Hedera-specific (optional)
  customConfig?: Record<string, any>
}

/**
 * Chain-specific credentials.
 * Each chain adapter extracts what it needs from this unified structure.
 */
export interface ChainCredentials {
  // Hedera
  accountId?: string
  privateKey?: string

  // Ethereum/Base (EVM)
  privateKeyEVM?: string
  infuraKey?: string
  alchemyKey?: string

  // Solana
  keypairPath?: string
  privateKeySolana?: string

  // Universal
  mnemonic?: string
  walletProvider?: WalletProvider
}

/**
 * Wallet provider types across all chains.
 */
export type WalletProvider =
  // Hedera
  | 'hashpack'
  | 'blade'
  // Ethereum/Base
  | 'metamask'
  | 'walletconnect'
  | 'coinbase-wallet'
  // Solana
  | 'phantom'
  | 'solflare'
  // Universal
  | 'custom'

/**
 * Token creation parameters (universal).
 * Adapter translates to chain-specific format.
 */
export interface CreateTokenParams {
  name: string
  symbol: string
  decimals: number
  initialSupply: string | bigint
  mintable?: boolean
  burnable?: boolean
  pausable?: boolean
  freezable?: boolean          // Hedera-specific (optional on others)
  metadata?: TokenMetadata
  customConfig?: Record<string, any>  // Chain-specific parameters
}

/**
 * Token metadata (universal).
 * Compatible with ERC-20, HTS, SPL Token standards.
 */
export interface TokenMetadata {
  description?: string
  image?: string
  externalUrl?: string
  attributes?: Array<{ trait_type: string; value: string | number }>
  customFields?: Record<string, any>
}

/**
 * NFT creation parameters (universal).
 */
export interface CreateNFTParams {
  name: string
  symbol: string
  collectionSize?: number
  royaltyPercentage?: number
  royaltyRecipient?: string
  metadata: NFTMetadata
  customConfig?: Record<string, any>
}

/**
 * NFT metadata (universal).
 * Compatible with ERC-721, ERC-1155, Metaplex standards.
 */
export interface NFTMetadata {
  name: string
  description?: string
  image: string
  animationUrl?: string
  externalUrl?: string
  attributes?: Array<{ trait_type: string; value: string | number }>
  properties?: Record<string, any>
}

/**
 * Token transfer parameters (universal).
 */
export interface TransferParams {
  to: string
  amount: string | bigint
  tokenId?: string
  memo?: string
}

/**
 * NFT transfer parameters (universal).
 */
export interface TransferNFTParams {
  to: string
  tokenId: string
  nftId: string | number
  memo?: string
}

/**
 * Balance query parameters (universal).
 */
export interface BalanceParams {
  address: string
  tokenId?: string
}

/**
 * Smart contract deployment parameters (universal).
 */
export interface DeployContractParams {
  contractCode: string | Buffer
  constructorArgs?: any[]
  gas?: bigint
  gasPrice?: bigint
  value?: bigint
  customConfig?: Record<string, any>
}

/**
 * Smart contract call parameters (universal).
 */
export interface CallContractParams {
  contractAddress: string
  methodName: string
  args?: any[]
  gas?: bigint
  value?: bigint
}

/**
 * Transaction result (universal).
 * Standardized across all blockchains.
 */
export interface TransactionResult {
  transactionId: string
  transactionHash: string
  status: 'pending' | 'success' | 'failed'
  blockNumber?: number
  timestamp: Date
  explorerUrl: string
  gasUsed?: bigint
  gasPriceGwei?: number
  costUSD?: number
  customData?: Record<string, any>
}

/**
 * Token creation result (universal).
 */
export interface TokenResult {
  tokenId: string
  tokenAddress?: string        // Ethereum/Base
  transaction: TransactionResult
  metadata?: TokenMetadata
}

/**
 * NFT creation result (universal).
 */
export interface NFTResult {
  collectionId: string
  collectionAddress?: string   // Ethereum/Base
  transaction: TransactionResult
  metadata?: NFTMetadata
}

/**
 * Contract deployment result (universal).
 */
export interface ContractResult {
  contractId: string
  contractAddress?: string
  transaction: TransactionResult
  abi?: any[]
}

/**
 * Transaction status (universal).
 */
export interface TransactionStatus {
  status: 'pending' | 'success' | 'failed' | 'unknown'
  confirmations: number
  blockNumber?: number
  timestamp?: Date
  error?: string
}

/**
 * Gas price information (chain-agnostic).
 */
export interface GasPrice {
  standard: bigint
  fast: bigint
  instant: bigint
  unit: 'gwei' | 'lamports' | 'tinybars' | 'wei'
}

/**
 * Fee estimate (universal).
 */
export interface FeeEstimate {
  estimatedCost: bigint
  estimatedCostUSD: number
  currency: string
  breakdown?: {
    baseFee?: bigint
    priorityFee?: bigint
    networkFee?: bigint
  }
}

/**
 * Wallet connection result (universal).
 */
export interface WalletConnection {
  address: string
  publicKey?: string
  provider: WalletProvider
  chainId?: string
  isConnected: boolean
}

/**
 * Transaction to sign (universal).
 */
export interface Transaction {
  to: string
  from?: string
  value?: bigint
  data?: string
  gas?: bigint
  gasPrice?: bigint
  nonce?: number
  chainId?: string
}

/**
 * Signed transaction (universal).
 */
export interface SignedTransaction {
  rawTransaction: string
  transactionHash: string
  signature?: string
}

/**
 * Fee estimation parameters.
 */
export interface EstimateFeeParams {
  operation: 'transfer' | 'deploy' | 'mint' | 'burn' | 'custom'
  amount?: string | bigint
  contractSize?: number
  complexity?: 'simple' | 'medium' | 'complex'
}

/**
 * Mint NFT parameters (universal).
 */
export interface MintNFTParams {
  collectionId: string
  to: string
  metadata: NFTMetadata
  amount?: number              // For ERC-1155
}

/**
 * Error types for blockchain operations.
 */
export enum BlockchainErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom blockchain error.
 */
export class BlockchainError extends Error {
  constructor(
    public code: BlockchainErrorCode,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'BlockchainError'
  }
}
