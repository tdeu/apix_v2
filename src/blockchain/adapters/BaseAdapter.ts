/**
 * Base (Coinbase L2) Blockchain Adapter
 *
 * Implements the BlockchainAdapter interface for Base.
 * To be implemented in Phase 3 (Week 3-4).
 *
 * Current Status: Placeholder
 * Note: Base is EVM-compatible and will extend/reuse EthereumAdapter logic.
 */

import { BaseBlockchainAdapter } from '../core/BlockchainAdapter'
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
  BlockchainError,
  BlockchainErrorCode,
} from '../core/types'
import { CHAIN_CAPABILITIES, CHAIN_METADATA } from '../core/ChainCapabilities'

/**
 * Base Blockchain Adapter.
 * Phase 3, Milestone 3.2 will implement this by extending EthereumAdapter.
 *
 * Base is an Ethereum L2, so most logic will be inherited from EthereumAdapter
 * with Base-specific RPC endpoints and chain IDs.
 */
export class BaseAdapter extends BaseBlockchainAdapter {
  readonly chainId = 'base' as const
  readonly name = 'Base'
  readonly capabilities = CHAIN_CAPABILITIES.base
  network: NetworkType = 'testnet'

  async initialize(config: BlockchainConfiguration): Promise<void> {
    throw new BlockchainError(
      BlockchainErrorCode.UNSUPPORTED_OPERATION,
      'BaseAdapter not yet implemented. Coming in Phase 3, Week 3-4.'
    )
  }

  async disconnect(): Promise<void> {
    this._isConnected = false
  }

  async createToken(params: CreateTokenParams): Promise<TokenResult> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async transferToken(params: TransferParams): Promise<TransactionResult> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async getTokenBalance(params: BalanceParams): Promise<bigint> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async createNFT(params: CreateNFTParams): Promise<NFTResult> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async mintNFT(params: MintNFTParams): Promise<TransactionResult> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async transferNFT(params: TransferNFTParams): Promise<TransactionResult> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async deployContract(params: DeployContractParams): Promise<ContractResult> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async callContract(params: CallContractParams): Promise<any> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async connectWallet(provider: WalletProvider): Promise<WalletConnection> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async getBalance(address: string): Promise<bigint> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async signTransaction(tx: Transaction): Promise<SignedTransaction> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async getGasPrice(): Promise<GasPrice> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async estimateFees(params: EstimateFeeParams): Promise<FeeEstimate> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    throw new BlockchainError(BlockchainErrorCode.UNSUPPORTED_OPERATION, 'Not implemented')
  }

  getExplorerUrl(txId: string): string {
    const metadata = CHAIN_METADATA.base
    const explorerNetwork = (this.network === 'devnet' || this.network === 'localnet') ? 'testnet' : this.network
    const baseUrl = metadata.explorerUrl[explorerNetwork]
    return `${baseUrl}/tx/${txId}`
  }
}
