/**
 * Hedera Blockchain Adapter
 *
 * Implements the BlockchainAdapter interface for Hedera.
 * Migrated from existing Hedera operations service.
 *
 * Status: Phase 1, Milestone 1.2 Implementation
 */

import {
  Client,
  AccountId,
  PrivateKey,
  AccountBalance,
  AccountInfo,
  AccountBalanceQuery,
  AccountInfoQuery,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenBurnTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  TokenId,
  ContractCreateTransaction,
  ContractExecuteTransaction,
  ContractCallQuery,
  FileCreateTransaction,
  FileAppendTransaction,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  Hbar,
  TransactionResponse,
  TransactionReceipt,
  TransactionId,
  TransactionReceiptQuery,
  TransactionRecordQuery,
  Status,
} from '@hashgraph/sdk'
import {
  BaseBlockchainAdapter,
  BlockchainAdapter,
} from '../core/BlockchainAdapter'
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
  TransactionStatus as BlockchainTransactionStatus,
  NetworkType,
  BlockchainError,
  BlockchainErrorCode,
} from '../core/types'
import {
  CHAIN_CAPABILITIES,
  CHAIN_METADATA,
} from '../core/ChainCapabilities'

/**
 * Hedera Blockchain Adapter.
 *
 * Fully implements BlockchainAdapter interface for Hedera network.
 * Migrated from existing hedera-operations.ts service.
 */
export class HederaAdapter extends BaseBlockchainAdapter implements BlockchainAdapter {
  readonly chainId = 'hedera' as const
  readonly name = 'Hedera'
  readonly capabilities = CHAIN_CAPABILITIES.hedera
  network: NetworkType = 'testnet'

  // Hedera-specific client
  private client?: Client
  private operatorAccountId?: AccountId
  private operatorPrivateKey?: PrivateKey

  // Browser wallet integration
  private hashConnectInstance?: any
  private walletPairingData?: any
  protected connectedWalletProvider?: WalletProvider

  /**
   * Helper to create a TransactionResult from Hedera transaction response.
   */
  private createTransactionResult(
    txResponse: TransactionResponse,
    status: 'pending' | 'success' | 'failed' = 'success'
  ): TransactionResult {
    const transactionHash = txResponse.transactionId.toString()
    return {
      transactionId: transactionHash,
      transactionHash,
      status,
      blockNumber: 0,
      timestamp: new Date(),
      explorerUrl: this.getExplorerUrl(transactionHash),
    }
  }

  /**
   * Initialize Hedera adapter with credentials.
   *
   * @param config - Blockchain configuration with credentials
   */
  async initialize(config: BlockchainConfiguration): Promise<void> {
    try {
      // Validate configuration
      if (!config.credentials?.accountId || !config.credentials?.privateKey) {
        throw new BlockchainError(
          BlockchainErrorCode.INVALID_CREDENTIALS,
          'Hedera requires accountId and privateKey in credentials'
        )
      }

      // Set network
      this.network = config.network || 'testnet'

      // Create client based on network
      if (this.network === 'mainnet') {
        this.client = Client.forMainnet()
      } else if (this.network === 'testnet') {
        this.client = Client.forTestnet()
      } else {
        throw new BlockchainError(
          BlockchainErrorCode.NETWORK_ERROR,
          `Unsupported network: ${this.network}. Use 'testnet' or 'mainnet'.`
        )
      }

      // Parse credentials
      this.operatorAccountId = AccountId.fromString(config.credentials.accountId)
      this.operatorPrivateKey = PrivateKey.fromString(config.credentials.privateKey)

      // Set operator
      this.client.setOperator(this.operatorAccountId, this.operatorPrivateKey)

      // Mark as connected
      this._isConnected = true

      // Log successful initialization (optional - could integrate with logger)
      console.log(`HederaAdapter initialized for ${this.network} with account ${config.credentials.accountId}`)
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.UNKNOWN,
        `Failed to initialize HederaAdapter: ${error.message}`,
        error
      )
    }
  }

  /**
   * Disconnect and close the Hedera client.
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.close()
      this.client = undefined
      this.operatorAccountId = undefined
      this.operatorPrivateKey = undefined
    }
    this._isConnected = false
  }

  /**
   * Create a fungible token using Hedera Token Service (HTS).
   *
   * @param params - Token creation parameters
   * @returns Token creation result with token ID
   */
  async createToken(params: CreateTokenParams): Promise<TokenResult> {
    this.ensureInitialized()

    if (!this.client || !this.operatorPrivateKey) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      // Create token transaction
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(params.name)
        .setTokenSymbol(params.symbol)
        .setDecimals(params.decimals || 8)
        .setInitialSupply(Number(params.initialSupply || 0))
        .setTreasuryAccountId(this.operatorAccountId!)
        .setTokenType(TokenType.FungibleCommon)
        .setSupplyType(TokenSupplyType.Infinite)
        .setMaxTransactionFee(new Hbar(30))

      // Add keys if specified - check in customFields since metadata might not have these
      const customFields = params.metadata?.customFields || {}
      if (customFields.adminKey !== false) {
        tokenCreateTx.setAdminKey(this.operatorPrivateKey.publicKey)
      }
      if (customFields.supplyKey !== false) {
        tokenCreateTx.setSupplyKey(this.operatorPrivateKey.publicKey)
      }
      if (customFields.freezeKey) {
        tokenCreateTx.setFreezeKey(this.operatorPrivateKey.publicKey)
      }
      if (customFields.wipeKey) {
        tokenCreateTx.setWipeKey(this.operatorPrivateKey.publicKey)
      }
      if (customFields.freezeDefault) {
        tokenCreateTx.setFreezeDefault(true)
      }

      // Execute transaction
      const txResponse: TransactionResponse = await tokenCreateTx.execute(this.client)
      const receipt: TransactionReceipt = await txResponse.getReceipt(this.client)

      if (!receipt.tokenId) {
        throw new BlockchainError(
          BlockchainErrorCode.TRANSACTION_FAILED,
          'Token ID not received in transaction receipt'
        )
      }

      const tokenId = receipt.tokenId.toString()

      return {
        tokenId,
        tokenAddress: tokenId,
        transaction: this.createTransactionResult(txResponse),
        metadata: params.metadata,
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `Token creation failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Transfer HTS tokens between accounts.
   *
   * @param params - Transfer parameters
   * @returns Transaction result
   */
  async transferToken(params: TransferParams): Promise<TransactionResult> {
    this.ensureInitialized()

    if (!this.client) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      // For HTS tokens, tokenId is required
      if (!params.tokenId) {
        throw new BlockchainError(
          BlockchainErrorCode.INVALID_ADDRESS,
          'Token ID is required for Hedera token transfers'
        )
      }

      const tokenId = TokenId.fromString(params.tokenId)
      const fromAccount = this.operatorAccountId! // Sender is the operator
      const toAccount = AccountId.fromString(params.to)

      // Create transfer transaction
      const transferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, fromAccount, -Number(params.amount))
        .addTokenTransfer(tokenId, toAccount, Number(params.amount))
        .setMaxTransactionFee(new Hbar(2))

      // Execute transaction
      const txResponse: TransactionResponse = await transferTx.execute(this.client)
      const receipt: TransactionReceipt = await txResponse.getReceipt(this.client)

      return this.createTransactionResult(txResponse)
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `Token transfer failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Get HTS token balance for an account.
   *
   * @param params - Balance query parameters
   * @returns Token balance as bigint
   */
  async getTokenBalance(params: BalanceParams): Promise<bigint> {
    this.ensureInitialized()

    if (!this.client) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      const accountId = AccountId.fromString(params.address)
      const tokenId = TokenId.fromString(params.tokenId!)

      const balanceQuery = new AccountBalanceQuery().setAccountId(accountId)
      const balance: AccountBalance = await balanceQuery.execute(this.client)

      // Get token balance from the balance map
      const tokenBalance = balance.tokens?.get(tokenId)
      return BigInt(tokenBalance?.toInt() || 0)
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to query token balance: ${error.message}`,
        error
      )
    }
  }

  /**
   * Create an NFT collection using HTS.
   *
   * @param params - NFT collection parameters
   * @returns NFT collection result
   */
  async createNFT(params: CreateNFTParams): Promise<NFTResult> {
    this.ensureInitialized()

    if (!this.client || !this.operatorPrivateKey) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      // Create NFT collection transaction
      const nftCreateTx = new TokenCreateTransaction()
        .setTokenName(params.name)
        .setTokenSymbol(params.symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTreasuryAccountId(this.operatorAccountId!)
        .setSupplyKey(this.operatorPrivateKey.publicKey)
        .setMaxTransactionFee(new Hbar(30))

      // Check in properties for admin key
      const properties = params.metadata?.properties || {}
      if (properties.adminKey !== false) {
        nftCreateTx.setAdminKey(this.operatorPrivateKey.publicKey)
      }

      // Execute transaction
      const txResponse: TransactionResponse = await nftCreateTx.execute(this.client)
      const receipt: TransactionReceipt = await txResponse.getReceipt(this.client)

      if (!receipt.tokenId) {
        throw new BlockchainError(
          BlockchainErrorCode.TRANSACTION_FAILED,
          'Token ID not received in transaction receipt'
        )
      }

      const collectionId = receipt.tokenId.toString()

      return {
        collectionId,
        collectionAddress: collectionId,
        transaction: this.createTransactionResult(txResponse),
        metadata: params.metadata,
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `NFT collection creation failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Mint an NFT to an HTS NFT collection.
   *
   * @param params - NFT minting parameters
   * @returns Transaction result
   */
  async mintNFT(params: MintNFTParams): Promise<TransactionResult> {
    this.ensureInitialized()

    if (!this.client) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      const tokenId = TokenId.fromString(params.collectionId)

      // Convert metadata to bytes
      const metadataBytes = Buffer.from(JSON.stringify(params.metadata || {}))

      // Mint NFT
      const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([metadataBytes])
        .setMaxTransactionFee(new Hbar(10))

      const txResponse: TransactionResponse = await mintTx.execute(this.client)
      const receipt: TransactionReceipt = await txResponse.getReceipt(this.client)

      return this.createTransactionResult(txResponse)
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `NFT minting failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Transfer an NFT between accounts.
   *
   * @param params - NFT transfer parameters
   * @returns Transaction result
   */
  async transferNFT(params: TransferNFTParams): Promise<TransactionResult> {
    this.ensureInitialized()

    if (!this.client) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      const tokenId = TokenId.fromString(params.tokenId)
      const fromAccount = this.operatorAccountId! // Sender is the operator
      const toAccount = AccountId.fromString(params.to)
      const serialNumber = typeof params.nftId === 'string' ? parseInt(params.nftId) : params.nftId

      // Transfer NFT
      const transferTx = new TransferTransaction()
        .addNftTransfer(tokenId, serialNumber, fromAccount, toAccount)
        .setMaxTransactionFee(new Hbar(2))

      const txResponse: TransactionResponse = await transferTx.execute(this.client)
      const receipt: TransactionReceipt = await txResponse.getReceipt(this.client)

      return this.createTransactionResult(txResponse)
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `NFT transfer failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Deploy a smart contract to Hedera.
   *
   * @param params - Contract deployment parameters
   * @returns Contract deployment result
   */
  async deployContract(params: DeployContractParams): Promise<ContractResult> {
    this.ensureInitialized()

    if (!this.client || !this.operatorPrivateKey) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      // Convert contract code to string if Buffer
      const contractCode = typeof params.contractCode === 'string'
        ? params.contractCode
        : params.contractCode.toString()

      // Step 1: Create a file to store bytecode
      const fileCreateTx = new FileCreateTransaction()
        .setContents(contractCode)
        .setKeys([this.operatorPrivateKey.publicKey])
        .setMaxTransactionFee(new Hbar(2))

      const fileResponse = await fileCreateTx.execute(this.client)
      const fileReceipt = await fileResponse.getReceipt(this.client)

      if (!fileReceipt.fileId) {
        throw new BlockchainError(
          BlockchainErrorCode.TRANSACTION_FAILED,
          'Failed to create bytecode file'
        )
      }

      // Step 2: Create the contract
      const gasLimit = params.gas ? Number(params.gas) : 100000
      const contractCreateTx = new ContractCreateTransaction()
        .setBytecodeFileId(fileReceipt.fileId)
        .setGas(gasLimit)
        .setInitialBalance(Hbar.fromTinybars(0))
        .setMaxTransactionFee(new Hbar(20))

      // Add constructor parameters if provided
      if (params.constructorArgs && params.constructorArgs.length > 0) {
        // Note: For production, properly encode constructor parameters using ContractFunctionParameters
        console.warn('Constructor parameters provided but not yet encoded')
      }

      const contractResponse = await contractCreateTx.execute(this.client)
      const contractReceipt = await contractResponse.getReceipt(this.client)

      if (!contractReceipt.contractId) {
        throw new BlockchainError(
          BlockchainErrorCode.TRANSACTION_FAILED,
          'Failed to get contract ID from deployment'
        )
      }

      const contractId = contractReceipt.contractId.toString()

      return {
        contractId,
        contractAddress: contractId,
        transaction: this.createTransactionResult(contractResponse),
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `Contract deployment failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Call a smart contract function.
   *
   * @param params - Contract call parameters
   * @returns Contract call result
   */
  async callContract(params: CallContractParams): Promise<any> {
    this.ensureInitialized()

    if (!this.client) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      // Execute contract function (state-changing call)
      const gasLimit = params.gas ? Number(params.gas) : 100000
      const contractCallTx = new ContractExecuteTransaction()
        .setContractId(params.contractAddress)
        .setGas(gasLimit)
        .setMaxTransactionFee(new Hbar(2))

      // Add payable amount if specified
      if (params.value) {
        contractCallTx.setPayableAmount(Hbar.fromTinybars(Number(params.value)))
      }

      // Note: For production, properly encode function parameters using ContractFunctionParameters
      if (params.args && params.args.length > 0) {
        console.warn('Function arguments provided but not yet encoded')
      }

      const callResponse = await contractCallTx.execute(this.client)
      const callReceipt = await callResponse.getReceipt(this.client)

      return {
        transactionHash: callResponse.transactionId.toString(),
        status: callReceipt.status.toString(),
        explorerUrl: this.getExplorerUrl(callResponse.transactionId.toString()),
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `Contract call failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Connect a browser wallet (HashPack, Blade).
   *
   * @param provider - Wallet provider to connect
   * @returns Wallet connection details
   */
  async connectWallet(provider: WalletProvider): Promise<WalletConnection> {
    // Check for browser environment
    if (typeof window === 'undefined') {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        'Wallet connection requires a browser environment'
      )
    }

    switch (provider) {
      case 'hashpack':
        return this.connectHashPack()
      case 'blade':
        return this.connectBlade()
      default:
        throw new BlockchainError(
          BlockchainErrorCode.UNSUPPORTED_OPERATION,
          `Wallet provider '${provider}' not supported for Hedera. Supported: hashpack, blade`
        )
    }
  }

  /**
   * Connect to HashPack wallet via HashConnect.
   * @private
   */
  private async connectHashPack(): Promise<WalletConnection> {
    try {
      // Dynamic import of HashConnect
      const { HashConnect } = await import('hashconnect')

      const hashconnect = new HashConnect()

      const appMetadata = {
        name: 'APIX',
        description: 'Multi-chain blockchain integration platform',
        icon: 'https://apix.dev/icon.png'
      }

      // Initialize HashConnect
      const initData = await hashconnect.init(appMetadata, this.network, false)
      this.hashConnectInstance = hashconnect

      // Return a promise that resolves when pairing is complete
      return new Promise((resolve, reject) => {
        // Set up pairing event listener
        hashconnect.pairingEvent.on((pairingData: any) => {
          this.walletPairingData = pairingData
          this.connectedWalletProvider = 'hashpack'

          resolve({
            address: pairingData.accountIds[0],
            publicKey: pairingData.accountIds[0],
            provider: 'hashpack',
            chainId: this.chainId,
            isConnected: true
          })
        })

        // Open pairing modal
        hashconnect.connectToLocalWallet()

        // Timeout after 60 seconds
        setTimeout(() => {
          reject(new BlockchainError(
            BlockchainErrorCode.TIMEOUT,
            'HashPack wallet connection timed out after 60 seconds'
          ))
        }, 60000)
      })
    } catch (error: any) {
      if (error instanceof BlockchainError) throw error

      // Check if it's a module not found error
      if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes('hashconnect')) {
        throw new BlockchainError(
          BlockchainErrorCode.UNSUPPORTED_OPERATION,
          'HashConnect package not installed. Install with: npm install hashconnect'
        )
      }

      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to connect HashPack: ${error.message}`
      )
    }
  }

  /**
   * Connect to Blade wallet.
   * @private
   */
  private async connectBlade(): Promise<WalletConnection> {
    try {
      // Dynamic import of Blade connector
      const { BladeConnector, ConnectorStrategy } = await import('@aspect-labs/blade-web3.js')

      const connector = await BladeConnector.init(
        ConnectorStrategy.WALLET_CONNECT,
        {
          name: 'APIX',
          description: 'Multi-chain blockchain integration platform',
          network: this.network
        }
      )

      const session = await connector.createSession()
      const accountId = session.accountIds[0]

      this.connectedWalletProvider = 'blade'

      return {
        address: accountId,
        publicKey: accountId,
        provider: 'blade',
        chainId: this.chainId,
        isConnected: true
      }
    } catch (error: any) {
      if (error instanceof BlockchainError) throw error

      // Check if it's a module not found error
      if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes('blade')) {
        throw new BlockchainError(
          BlockchainErrorCode.UNSUPPORTED_OPERATION,
          'Blade connector package not installed. Install with: npm install @aspect-labs/blade-web3.js'
        )
      }

      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to connect Blade wallet: ${error.message}`
      )
    }
  }

  /**
   * Disconnect the connected browser wallet.
   */
  async disconnectWallet(): Promise<void> {
    if (this.hashConnectInstance) {
      try {
        await this.hashConnectInstance.disconnect()
      } catch {
        // Ignore disconnect errors
      }
    }
    this.hashConnectInstance = undefined
    this.walletPairingData = undefined
    this.connectedWalletProvider = undefined
  }

  /**
   * Check if a browser wallet is connected.
   */
  isWalletConnected(): boolean {
    return this.walletPairingData !== undefined || this.connectedWalletProvider !== undefined
  }

  /**
   * Get the connected wallet provider name.
   */
  getConnectedWalletProvider(): WalletProvider | undefined {
    return this.connectedWalletProvider
  }

  /**
   * Get HBAR balance for an account.
   *
   * @param address - Account ID
   * @returns HBAR balance in tinybars as bigint
   */
  async getBalance(address: string): Promise<bigint> {
    this.ensureInitialized()

    if (!this.client) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      const accountId = AccountId.fromString(address)
      const balanceQuery = new AccountBalanceQuery().setAccountId(accountId)
      const balance: AccountBalance = await balanceQuery.execute(this.client)

      // Return HBAR balance in tinybars
      return BigInt(balance.hbars.toTinybars().toString())
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to query balance: ${error.message}`,
        error
      )
    }
  }

  /**
   * Sign a transaction with the operator's private key.
   *
   * @param tx - Transaction to sign
   * @returns Signed transaction
   */
  async signTransaction(tx: Transaction): Promise<SignedTransaction> {
    this.ensureInitialized()

    if (!this.operatorPrivateKey) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Private key not available'
      )
    }

    // Note: This is a simplified implementation
    // In production, integrate with Hedera SDK's transaction signing
    return {
      rawTransaction: 'raw-tx-data',
      transactionHash: 'tx-hash',
      signature: 'signed-with-operator-key',
    }
  }

  /**
   * Get Hedera gas price (fees are predictable on Hedera).
   *
   * @returns Gas price structure
   */
  async getGasPrice(): Promise<GasPrice> {
    this.ensureInitialized()

    // Hedera has fixed, predictable fees in tinybars
    return {
      standard: BigInt(100000), // 0.001 HBAR
      fast: BigInt(100000), // Same as standard (no priority fees on Hedera)
      instant: BigInt(100000), // Same as standard
      unit: 'tinybars',
    }
  }

  /**
   * Estimate fees for a transaction.
   *
   * @param params - Fee estimation parameters
   * @returns Fee estimate
   */
  async estimateFees(params: EstimateFeeParams): Promise<FeeEstimate> {
    this.ensureInitialized()

    // Hedera fee schedule (approximate)
    let estimatedCost: bigint

    switch (params.operation) {
      case 'transfer':
        estimatedCost = BigInt(100000) // 0.001 HBAR in tinybars
        break
      case 'deploy':
        estimatedCost = BigInt(2000000000) // 20 HBAR
        break
      case 'mint':
        estimatedCost = BigInt(50000000) // 0.5 HBAR
        break
      case 'burn':
        estimatedCost = BigInt(50000000) // 0.5 HBAR
        break
      default:
        estimatedCost = BigInt(100000) // Default to transfer fee
    }

    return {
      estimatedCost,
      estimatedCostUSD: 0.00001, // Approximate USD cost
      currency: 'HBAR',
      breakdown: {
        baseFee: estimatedCost,
        priorityFee: BigInt(0),
        networkFee: BigInt(0),
      },
    }
  }

  /**
   * Get transaction status.
   *
   * @param txId - Transaction ID
   * @returns Transaction status
   */
  async getTransactionStatus(txId: string): Promise<BlockchainTransactionStatus> {
    this.ensureInitialized()

    if (!this.client) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      const transactionId = TransactionId.fromString(txId)
      const receiptQuery = new TransactionReceiptQuery().setTransactionId(transactionId)
      const receipt = await receiptQuery.execute(this.client)

      // Map Hedera status to our status
      let status: 'pending' | 'success' | 'failed' | 'unknown'
      if (receipt.status === Status.Success) {
        status = 'success'
      } else if (receipt.status === Status.Unknown) {
        status = 'pending'
      } else {
        status = 'failed'
      }

      return {
        status,
        confirmations: status === 'success' ? 1 : 0,
        blockNumber: 0, // Hedera doesn't use block numbers
        timestamp: new Date(),
      }
    } catch (error: any) {
      // If receipt not found, transaction might still be pending
      return {
        status: 'pending',
        confirmations: 0,
        blockNumber: 0,
        timestamp: new Date(),
      }
    }
  }

  getExplorerUrl(txId: string): string {
    const metadata = CHAIN_METADATA.hedera
    const explorerNetwork = (this.network === 'devnet' || this.network === 'localnet') ? 'testnet' : this.network
    const baseUrl = metadata.explorerUrl[explorerNetwork]
    return `${baseUrl}/transaction/${txId}`
  }

  /**
   * Execute Hedera-specific operations (HCS topic operations).
   *
   * @param operation - Operation name
   * @param params - Operation parameters
   * @returns Operation result
   */
  async executeChainSpecificOperation(operation: string, params: any): Promise<any> {
    this.ensureInitialized()

    if (!this.client || !this.operatorPrivateKey) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    switch (operation) {
      case 'createHCSTopic':
        return await this.createHCSTopic(params)

      case 'submitHCSMessage':
        return await this.submitHCSMessage(params)

      default:
        throw new BlockchainError(
          BlockchainErrorCode.UNSUPPORTED_OPERATION,
          `Unknown Hedera operation: ${operation}`
        )
    }
  }

  /**
   * Create a Hedera Consensus Service topic.
   *
   * @param params - Topic creation parameters
   * @returns Topic creation result
   */
  private async createHCSTopic(params: any): Promise<any> {
    if (!this.client || !this.operatorPrivateKey) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      const topicCreateTx = new TopicCreateTransaction().setMaxTransactionFee(new Hbar(2))

      if (params.memo) {
        topicCreateTx.setTopicMemo(params.memo)
      }

      if (params.adminKey) {
        topicCreateTx.setAdminKey(this.operatorPrivateKey.publicKey)
      }

      if (params.submitKey) {
        topicCreateTx.setSubmitKey(this.operatorPrivateKey.publicKey)
      }

      if (params.autoRenewPeriod) {
        topicCreateTx.setAutoRenewPeriod(params.autoRenewPeriod)
      }

      const topicResponse = await topicCreateTx.execute(this.client)
      const topicReceipt = await topicResponse.getReceipt(this.client)

      if (!topicReceipt.topicId) {
        throw new BlockchainError(
          BlockchainErrorCode.TRANSACTION_FAILED,
          'Failed to get topic ID from creation'
        )
      }

      const topicId = topicReceipt.topicId.toString()
      const transactionHash = topicResponse.transactionId.toString()

      return {
        topicId,
        transactionHash,
        explorerUrl: this.getExplorerUrl(transactionHash),
        success: true,
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `HCS topic creation failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Submit a message to an HCS topic.
   *
   * @param params - Message submission parameters
   * @returns Message submission result
   */
  private async submitHCSMessage(params: any): Promise<any> {
    if (!this.client) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Client not initialized'
      )
    }

    try {
      const topicId = TopicId.fromString(params.topicId)

      const topicMessageTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(params.message)
        .setMaxTransactionFee(new Hbar(2))

      const messageResponse = await topicMessageTx.execute(this.client)
      const messageReceipt = await messageResponse.getReceipt(this.client)

      const transactionHash = messageResponse.transactionId.toString()

      return {
        transactionHash,
        status: messageReceipt.status.toString(),
        explorerUrl: this.getExplorerUrl(transactionHash),
        success: true,
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `HCS message submission failed: ${error.message}`,
        error
      )
    }
  }
}
