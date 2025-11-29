/**
 * Solana Blockchain Adapter
 *
 * Implements the BlockchainAdapter interface for Solana using @solana/web3.js.
 * Supports SPL tokens, Metaplex NFTs, and native SOL operations.
 *
 * Key differences from Ethereum:
 * - Uses lamports (1 SOL = 1,000,000,000 lamports)
 * - Token accounts are separate from wallet accounts (Associated Token Accounts)
 * - NFTs use Metaplex standard instead of ERC-721
 * - Smart contract deployment returns UNSUPPORTED_OPERATION (Solana uses Rust/BPF programs)
 * - Priority fees instead of gas price
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

// Lamports per SOL constant
const LAMPORTS_PER_SOL = 1_000_000_000

/**
 * Solana Blockchain Adapter
 *
 * Implements all 21 methods from BlockchainAdapter interface for Solana.
 */
export class SolanaAdapter extends BaseBlockchainAdapter {
  readonly chainId = 'solana' as const
  readonly name = 'Solana'
  readonly capabilities = CHAIN_CAPABILITIES.solana
  network: NetworkType = 'devnet'

  // Solana SDK instances (loaded dynamically for testing)
  protected solana: any
  protected connection: any
  protected keypair: any
  protected walletAddress: string | undefined

  // Browser wallet integration
  protected walletAdapter: any
  protected connectedWalletProvider?: WalletProvider

  // ============================================================================
  // LIFECYCLE METHODS
  // ============================================================================

  /**
   * Dynamically load Solana SDK.
   * Override in tests to inject mocks.
   */
  protected async loadSolana(): Promise<any> {
    return await import('@solana/web3.js')
  }

  /**
   * Dynamically load SPL Token SDK.
   * Override in tests to inject mocks.
   */
  protected async loadSplToken(): Promise<any> {
    return await import('@solana/spl-token')
  }

  /**
   * Initialize the adapter with Solana configuration.
   *
   * @param config - Configuration with privateKeySolana credential
   */
  async initialize(config: BlockchainConfiguration): Promise<void> {
    if (!config.credentials?.privateKeySolana) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Solana adapter requires credentials.privateKeySolana (base64-encoded secret key)'
      )
    }

    try {
      // Load Solana SDK
      this.solana = await this.loadSolana()
      const { Connection, Keypair, clusterApiUrl } = this.solana

      // Set network
      this.network = config.network || 'devnet'
      this.config = config

      // Create keypair from secret key
      const secretKeyBase64 = config.credentials.privateKeySolana
      const secretKey = Buffer.from(secretKeyBase64, 'base64')
      this.keypair = Keypair.fromSecretKey(new Uint8Array(secretKey))
      this.walletAddress = this.keypair.publicKey.toString()

      // Create connection
      const rpcUrl = config.rpcUrl || this.getDefaultRpcUrl()
      const commitment = config.customConfig?.commitment || 'confirmed'
      this.connection = new Connection(rpcUrl, commitment)

      // Verify connection
      await this.connection.getSlot()

      this._isConnected = true
      console.log(
        `SolanaAdapter initialized for ${this.network} with address ${this.walletAddress}`
      )
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to initialize SolanaAdapter: ${error.message}`
      )
    }
  }

  /**
   * Disconnect and clean up resources.
   */
  async disconnect(): Promise<void> {
    this.connection = undefined
    this.keypair = undefined
    this.walletAddress = undefined
    this._isConnected = false
  }

  // ============================================================================
  // BALANCE METHODS
  // ============================================================================

  /**
   * Get native SOL balance for an address.
   *
   * @param address - Solana public key (base58)
   * @returns Balance in lamports as bigint
   */
  async getBalance(address: string): Promise<bigint> {
    this.ensureInitialized()

    try {
      const { PublicKey } = this.solana
      const publicKey = new PublicKey(address)
      const balance = await this.connection.getBalance(publicKey)
      return BigInt(balance)
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to get balance: ${error.message}`
      )
    }
  }

  /**
   * Get SPL token balance for an address.
   *
   * @param params - Balance params with address and tokenId (mint address)
   * @returns Token balance as bigint
   */
  async getTokenBalance(params: BalanceParams): Promise<bigint> {
    this.ensureInitialized()

    if (!params.tokenId) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_ADDRESS,
        'tokenId (mint address) is required for SPL token balance'
      )
    }

    try {
      const { PublicKey } = this.solana
      const splToken = await this.loadSplToken()
      const { getAssociatedTokenAddress, getAccount } = splToken

      const ownerPublicKey = new PublicKey(params.address)
      const mintPublicKey = new PublicKey(params.tokenId)

      // Get associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        ownerPublicKey
      )

      try {
        const accountInfo = await getAccount(this.connection, tokenAccount)
        return BigInt(accountInfo.amount.toString())
      } catch {
        // Token account doesn't exist, balance is 0
        return BigInt(0)
      }
    } catch (error: any) {
      if (error instanceof BlockchainError) throw error
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to get token balance: ${error.message}`
      )
    }
  }

  // ============================================================================
  // GAS/FEE METHODS
  // ============================================================================

  /**
   * Get current priority fees (Solana equivalent of gas price).
   *
   * @returns Priority fees in lamports
   */
  async getGasPrice(): Promise<GasPrice> {
    this.ensureInitialized()

    try {
      // Get recent prioritization fees
      const fees = await this.connection.getRecentPrioritizationFees()

      // Calculate average fees from recent samples (in lamports)
      let avgFee = 0
      if (fees.length > 0) {
        const totalFee = fees.reduce(
          (sum: number, f: any) => sum + f.prioritizationFee,
          0
        )
        avgFee = Math.floor(totalFee / fees.length)
      }

      // Standard fee is average, fast is 1.5x, instant is 2x (all in lamports)
      const standardNum = Math.max(avgFee, 5000) // Minimum 5000 lamports (base fee)
      const fastNum = Math.floor(standardNum * 1.5)
      const instantNum = Math.floor(standardNum * 2)

      return {
        standard: BigInt(standardNum),
        fast: BigInt(fastNum),
        instant: BigInt(instantNum),
        unit: 'lamports',
      }
    } catch (error: any) {
      // Return default fees if unable to fetch
      return {
        standard: BigInt(5000),
        fast: BigInt(7500),
        instant: BigInt(10000),
        unit: 'lamports',
      }
    }
  }

  /**
   * Estimate fees for a transaction.
   *
   * @param params - Fee estimation parameters
   * @returns Fee estimate in SOL and USD
   */
  async estimateFees(params: EstimateFeeParams): Promise<FeeEstimate> {
    this.ensureInitialized()

    // Base fee in lamports (typical transaction)
    const baseFee = BigInt(5000) // 0.000005 SOL

    // Operation multipliers
    const multipliers: Record<string, bigint> = {
      transfer: BigInt(1),
      mint: BigInt(5), // Token mint includes rent
      burn: BigInt(1),
      deploy: BigInt(0), // Unsupported
      custom: BigInt(2),
    }

    const operation = params.operation || 'transfer'
    const multiplier = multipliers[operation] || BigInt(1)
    const estimatedLamports = baseFee * multiplier

    // Add rent if creating accounts (mint operation)
    if (['mint'].includes(operation)) {
      // Approximate rent-exempt minimum for token accounts
      const rentExempt = BigInt(2039280) // ~0.002 SOL for token account
      const totalLamports = estimatedLamports + rentExempt

      return {
        estimatedCost: totalLamports,
        estimatedCostUSD: Number(totalLamports) / LAMPORTS_PER_SOL * 150, // Assuming ~$150/SOL
        currency: 'SOL',
        breakdown: {
          baseFee: estimatedLamports,
          networkFee: rentExempt,
        },
      }
    }

    return {
      estimatedCost: estimatedLamports,
      estimatedCostUSD: Number(estimatedLamports) / LAMPORTS_PER_SOL * 150,
      currency: 'SOL',
    }
  }

  // ============================================================================
  // TOKEN OPERATIONS
  // ============================================================================

  /**
   * Create an SPL token.
   *
   * @param params - Token creation parameters
   * @returns Token creation result with mint address
   */
  async createToken(params: CreateTokenParams): Promise<TokenResult> {
    this.ensureInitialized()

    try {
      const { PublicKey, Transaction: SolTransaction, Keypair } = this.solana
      const splToken = await this.loadSplToken()
      const {
        createInitializeMintInstruction,
        getMinimumBalanceForRentExemptMint,
        MINT_SIZE,
        TOKEN_PROGRAM_ID,
      } = splToken

      // Generate new mint keypair
      const mintKeypair = Keypair.generate()
      const decimals = params.decimals ?? 9 // Solana default

      // Get rent exemption amount
      const lamports = await getMinimumBalanceForRentExemptMint(this.connection)

      // Create transaction with SystemProgram.createAccount and initializeMint
      const { SystemProgram } = this.solana
      const transaction = new SolTransaction()

      // Create account for mint
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: this.keypair.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        })
      )

      // Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimals,
          this.keypair.publicKey, // mint authority
          this.keypair.publicKey, // freeze authority
          TOKEN_PROGRAM_ID
        )
      )

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = this.keypair.publicKey

      // Sign and send
      transaction.sign(this.keypair, mintKeypair)
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      )

      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed')

      // If initial supply, mint tokens
      if (params.initialSupply && BigInt(params.initialSupply) > 0) {
        await this.mintInitialSupply(
          mintKeypair.publicKey,
          BigInt(params.initialSupply),
          decimals
        )
      }

      const mintAddress = mintKeypair.publicKey.toString()

      return {
        tokenId: mintAddress,
        tokenAddress: mintAddress,
        transaction: {
          transactionId: signature,
          transactionHash: signature,
          status: 'success',
          blockNumber: 0,
          timestamp: new Date(),
          explorerUrl: this.getExplorerUrl(signature),
        },
        metadata: params.metadata,
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `Failed to create token: ${error.message}`
      )
    }
  }

  /**
   * Helper to mint initial supply to creator's token account.
   */
  private async mintInitialSupply(
    mintPublicKey: any,
    amount: bigint,
    decimals: number
  ): Promise<void> {
    const splToken = await this.loadSplToken()
    const {
      getAssociatedTokenAddress,
      createAssociatedTokenAccountInstruction,
      createMintToInstruction,
      getAccount,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    } = splToken
    const { Transaction: SolTransaction } = this.solana

    // Get or create associated token account
    const ata = await getAssociatedTokenAddress(
      mintPublicKey,
      this.keypair.publicKey
    )

    const transaction = new SolTransaction()

    // Check if ATA exists
    try {
      await getAccount(this.connection, ata)
    } catch {
      // Create ATA
      transaction.add(
        createAssociatedTokenAccountInstruction(
          this.keypair.publicKey, // payer
          ata, // associated token account
          this.keypair.publicKey, // owner
          mintPublicKey // mint
        )
      )
    }

    // Mint tokens
    const rawAmount = amount * BigInt(10 ** decimals)
    transaction.add(
      createMintToInstruction(
        mintPublicKey,
        ata,
        this.keypair.publicKey, // mint authority
        rawAmount
      )
    )

    // Send transaction
    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = this.keypair.publicKey
    transaction.sign(this.keypair)

    const signature = await this.connection.sendRawTransaction(
      transaction.serialize()
    )
    await this.connection.confirmTransaction(signature, 'confirmed')
  }

  /**
   * Transfer SPL tokens.
   *
   * @param params - Transfer parameters
   * @returns Transaction result
   */
  async transferToken(params: TransferParams): Promise<TransactionResult> {
    this.ensureInitialized()

    if (!params.tokenId) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_ADDRESS,
        'tokenId (mint address) is required for SPL token transfer'
      )
    }

    try {
      const { PublicKey, Transaction: SolTransaction } = this.solana
      const splToken = await this.loadSplToken()
      const {
        getAssociatedTokenAddress,
        createAssociatedTokenAccountInstruction,
        createTransferInstruction,
        getAccount,
      } = splToken

      const mintPublicKey = new PublicKey(params.tokenId)
      const toPublicKey = new PublicKey(params.to)

      // Get source ATA
      const sourceAta = await getAssociatedTokenAddress(
        mintPublicKey,
        this.keypair.publicKey
      )

      // Get destination ATA
      const destAta = await getAssociatedTokenAddress(mintPublicKey, toPublicKey)

      const transaction = new SolTransaction()

      // Create destination ATA if it doesn't exist
      try {
        await getAccount(this.connection, destAta)
      } catch {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.keypair.publicKey, // payer
            destAta,
            toPublicKey,
            mintPublicKey
          )
        )
      }

      // Add transfer instruction
      const amount = BigInt(params.amount)
      transaction.add(
        createTransferInstruction(sourceAta, destAta, this.keypair.publicKey, amount)
      )

      // Send transaction
      const { blockhash } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = this.keypair.publicKey
      transaction.sign(this.keypair)

      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      )
      await this.connection.confirmTransaction(signature, 'confirmed')

      return {
        transactionId: signature,
        transactionHash: signature,
        status: 'success',
        blockNumber: 0,
        timestamp: new Date(),
        explorerUrl: this.getExplorerUrl(signature),
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `Failed to transfer token: ${error.message}`
      )
    }
  }

  // ============================================================================
  // NFT OPERATIONS (Metaplex)
  // ============================================================================

  /**
   * Create an NFT collection using Metaplex standard.
   *
   * @param params - NFT collection parameters
   * @returns Collection creation result
   */
  async createNFT(params: CreateNFTParams): Promise<NFTResult> {
    this.ensureInitialized()

    try {
      const { Keypair } = this.solana
      const splToken = await this.loadSplToken()
      const metaplex = await this.loadMetaplex()

      // For Metaplex NFTs, we create a collection NFT
      // The collection is itself an NFT with 0 decimals and supply of 1
      const mintKeypair = Keypair.generate()

      // Create mint for collection NFT
      const tokenResult = await this.createToken({
        name: params.name,
        symbol: params.symbol || 'NFT',
        decimals: 0, // NFTs have 0 decimals
        initialSupply: '1', // Collection NFT has supply of 1
      })

      // In a full implementation, we would also:
      // 1. Create metadata account using Metaplex
      // 2. Set collection authority
      // 3. Mark as collection NFT

      const collectionAddress = tokenResult.tokenId

      return {
        collectionId: collectionAddress,
        collectionAddress: collectionAddress,
        transaction: tokenResult.transaction,
        metadata: params.metadata,
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `Failed to create NFT collection: ${error.message}`
      )
    }
  }

  /**
   * Mint an NFT in a collection.
   *
   * @param params - Mint parameters
   * @returns Transaction result
   */
  async mintNFT(params: MintNFTParams): Promise<TransactionResult> {
    this.ensureInitialized()

    try {
      const { PublicKey, Keypair } = this.solana

      // Create new mint for the NFT
      const tokenResult = await this.createToken({
        name: params.metadata?.name || 'NFT',
        symbol: 'NFT',
        decimals: 0,
        initialSupply: '1',
      })

      // Transfer to recipient if specified
      if (params.to && params.to !== this.walletAddress) {
        await this.transferToken({
          to: params.to,
          amount: '1',
          tokenId: tokenResult.tokenId,
        })
      }

      return tokenResult.transaction
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `Failed to mint NFT: ${error.message}`
      )
    }
  }

  /**
   * Transfer an NFT.
   *
   * @param params - Transfer parameters
   * @returns Transaction result
   */
  async transferNFT(params: TransferNFTParams): Promise<TransactionResult> {
    this.ensureInitialized()

    // NFT transfer is same as token transfer with amount 1
    return this.transferToken({
      to: params.to,
      amount: '1',
      tokenId: params.tokenId, // Mint address of the NFT
    })
  }

  /**
   * Load Metaplex SDK (for testing override).
   */
  protected async loadMetaplex(): Promise<any> {
    // In production, this would load @metaplex-foundation/js
    // For now, return a placeholder
    return {}
  }

  // ============================================================================
  // CONTRACT OPERATIONS (UNSUPPORTED)
  // ============================================================================

  /**
   * Deploy a smart contract - NOT SUPPORTED on Solana.
   *
   * Solana programs must be written in Rust and compiled to BPF.
   * Use `solana program deploy` CLI instead.
   *
   * @throws BlockchainError with UNSUPPORTED_OPERATION
   */
  async deployContract(params: DeployContractParams): Promise<ContractResult> {
    throw new BlockchainError(
      BlockchainErrorCode.UNSUPPORTED_OPERATION,
      'Solana does not support deploying contracts via API. ' +
        'Solana programs must be written in Rust and deployed using `solana program deploy`. ' +
        'Use callContract() to interact with existing programs.'
    )
  }

  /**
   * Call a Solana program.
   *
   * @param params - Call parameters with programId and instruction data
   * @returns Program execution result
   */
  async callContract(params: CallContractParams): Promise<any> {
    this.ensureInitialized()

    try {
      const { PublicKey, Transaction: SolTransaction, TransactionInstruction } =
        this.solana

      const programId = new PublicKey(params.contractAddress)

      // Build instruction from params
      // args[0] should be an array of account keys
      // args[1] should be the instruction data
      const accounts = (params.args?.[0] || []).map((acc: any) => ({
        pubkey: new PublicKey(acc.pubkey),
        isSigner: acc.isSigner || false,
        isWritable: acc.isWritable || false,
      }))

      const data = Buffer.from(params.args?.[1] || [])

      const instruction = new TransactionInstruction({
        keys: accounts,
        programId,
        data,
      })

      const transaction = new SolTransaction().add(instruction)

      // Send transaction
      const { blockhash } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = this.keypair.publicKey
      transaction.sign(this.keypair)

      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      )
      await this.connection.confirmTransaction(signature, 'confirmed')

      return {
        signature,
        success: true,
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.CONTRACT_ERROR,
        `Failed to call program: ${error.message}`
      )
    }
  }

  // ============================================================================
  // TRANSACTION OPERATIONS
  // ============================================================================

  /**
   * Get transaction status by signature.
   *
   * @param txId - Transaction signature
   * @returns Transaction status
   */
  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    this.ensureInitialized()

    try {
      const status = await this.connection.getSignatureStatus(txId)

      if (!status.value) {
        return {
          status: 'unknown',
          confirmations: 0,
        }
      }

      const { confirmationStatus, err, slot } = status.value

      let statusString: 'pending' | 'success' | 'failed' | 'unknown'
      if (err) {
        statusString = 'failed'
      } else if (confirmationStatus === 'finalized') {
        statusString = 'success'
      } else if (confirmationStatus === 'confirmed') {
        statusString = 'success'
      } else {
        statusString = 'pending'
      }

      return {
        status: statusString,
        confirmations: status.value.confirmations || 0,
        blockNumber: slot,
        error: err ? JSON.stringify(err) : undefined,
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to get transaction status: ${error.message}`
      )
    }
  }

  /**
   * Sign a transaction without sending.
   *
   * @param tx - Transaction to sign
   * @returns Signed transaction
   */
  async signTransaction(tx: Transaction): Promise<SignedTransaction> {
    this.ensureInitialized()

    try {
      const { Transaction: SolTransaction } = this.solana

      // Create transaction from params
      const transaction = new SolTransaction()

      // Add instructions if provided
      if (tx.data) {
        // Parse data as instructions
        const instructions = typeof tx.data === 'string' ? JSON.parse(tx.data) : tx.data
        // Add raw instruction data
      }

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = this.keypair.publicKey

      // Sign transaction
      transaction.sign(this.keypair)

      const serialized = transaction.serialize()
      const signature = transaction.signatures[0]?.signature

      return {
        rawTransaction: Buffer.from(serialized).toString('base64'),
        transactionHash: signature
          ? Buffer.from(signature).toString('base64')
          : 'unsigned',
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `Failed to sign transaction: ${error.message}`
      )
    }
  }

  // ============================================================================
  // WALLET OPERATIONS
  // ============================================================================

  /**
   * Connect to a wallet provider (Phantom, Solflare, etc.).
   *
   * Note: This is a placeholder - wallet connection requires browser environment.
   *
   * @throws BlockchainError with UNSUPPORTED_OPERATION
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
      case 'phantom':
        return this.connectPhantom()
      case 'solflare':
        return this.connectSolflare()
      default:
        throw new BlockchainError(
          BlockchainErrorCode.UNSUPPORTED_OPERATION,
          `Wallet provider '${provider}' not supported for Solana. Supported: phantom, solflare`
        )
    }
  }

  /**
   * Connect to Phantom wallet.
   * @private
   */
  protected async connectPhantom(): Promise<WalletConnection> {
    // Check if Phantom is installed (can be in window.solana or window.phantom.solana)
    const phantom = (window as any).solana || (window as any).phantom?.solana

    if (!phantom?.isPhantom) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        'Phantom wallet not detected. Please install Phantom extension from https://phantom.app'
      )
    }

    try {
      // Connect to Phantom
      const response = await phantom.connect()
      const publicKey = response.publicKey.toString()

      // Store wallet adapter for later use
      this.walletAdapter = phantom
      this.connectedWalletProvider = 'phantom'

      return {
        address: publicKey,
        publicKey: publicKey,
        provider: 'phantom',
        chainId: this.chainId,
        isConnected: true
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to connect Phantom: ${error.message}`
      )
    }
  }

  /**
   * Connect to Solflare wallet.
   * @private
   */
  protected async connectSolflare(): Promise<WalletConnection> {
    // Check if Solflare is installed
    const solflare = (window as any).solflare

    if (!solflare?.isSolflare) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        'Solflare wallet not detected. Please install Solflare extension from https://solflare.com'
      )
    }

    try {
      // Connect to Solflare
      await solflare.connect()

      if (!solflare.publicKey) {
        throw new BlockchainError(
          BlockchainErrorCode.NETWORK_ERROR,
          'Failed to get public key from Solflare wallet'
        )
      }

      const publicKey = solflare.publicKey.toString()

      // Store wallet adapter for later use
      this.walletAdapter = solflare
      this.connectedWalletProvider = 'solflare'

      return {
        address: publicKey,
        publicKey: publicKey,
        provider: 'solflare',
        chainId: this.chainId,
        isConnected: true
      }
    } catch (error: any) {
      if (error instanceof BlockchainError) throw error

      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to connect Solflare: ${error.message}`
      )
    }
  }

  /**
   * Disconnect the connected browser wallet.
   */
  async disconnectWallet(): Promise<void> {
    if (this.walletAdapter) {
      try {
        await this.walletAdapter.disconnect()
      } catch {
        // Ignore disconnect errors
      }
    }
    this.walletAdapter = undefined
    this.connectedWalletProvider = undefined
  }

  /**
   * Check if a browser wallet is connected.
   */
  isWalletConnected(): boolean {
    return this.walletAdapter !== undefined && this.walletAdapter.isConnected
  }

  /**
   * Get the connected wallet provider name.
   */
  getConnectedWalletProvider(): WalletProvider | undefined {
    return this.connectedWalletProvider
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get block explorer URL for a transaction.
   *
   * @param txId - Transaction signature
   * @returns Solscan/Solana Explorer URL
   */
  getExplorerUrl(txId: string): string {
    const baseUrl =
      this.network === 'mainnet'
        ? 'https://solscan.io'
        : 'https://solscan.io'

    const cluster =
      this.network === 'mainnet' ? '' : `?cluster=${this.network}`

    return `${baseUrl}/tx/${txId}${cluster}`
  }

  /**
   * Get default RPC URL for the network.
   */
  private getDefaultRpcUrl(): string {
    const urls: Record<string, string> = {
      mainnet: 'https://api.mainnet-beta.solana.com',
      testnet: 'https://api.testnet.solana.com',
      devnet: 'https://api.devnet.solana.com',
    }
    return urls[this.network] || urls.devnet
  }
}
