/**
 * Ethereum Blockchain Adapter
 *
 * Implements the BlockchainAdapter interface for Ethereum using ethers.js v6.
 * Supports ERC-20 tokens, ERC-721 NFTs, and smart contract operations.
 *
 * Status: M2 Implementation
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
  SupportedChain,
  BlockchainError,
  BlockchainErrorCode,
} from '../core/types'
import { CHAIN_CAPABILITIES, CHAIN_METADATA } from '../core/ChainCapabilities'

// Import contract ABIs
import ERC20ABI from '../contracts/ERC20.json'
import ERC721ABI from '../contracts/ERC721.json'

// ethers.js v6 types - we'll use dynamic imports for the actual SDK
// This allows us to use mocks in tests
interface EthersProvider {
  getNetwork(): Promise<{ chainId: bigint; name: string }>
  getBalance(address: string): Promise<bigint>
  getFeeData(): Promise<{ gasPrice: bigint | null; maxFeePerGas: bigint | null; maxPriorityFeePerGas: bigint | null }>
  getTransactionReceipt(txHash: string): Promise<any | null>
  getTransaction(txHash: string): Promise<any | null>
  estimateGas(tx: any): Promise<bigint>
  getBlockNumber(): Promise<number>
  destroy?(): void
}

interface EthersWallet {
  address: string
  provider: EthersProvider | null
  connect(provider: EthersProvider): EthersWallet
  getAddress(): Promise<string>
  signTransaction(tx: any): Promise<string>
  signMessage(message: string): Promise<string>
  sendTransaction(tx: any): Promise<any>
}

interface EthersContract {
  target: string
  getAddress(): Promise<string>
  balanceOf(address: string): Promise<bigint>
  transfer(to: string, amount: bigint): Promise<any>
  safeMint?(to: string, tokenId: bigint): Promise<any>
  safeTransferFrom?(from: string, to: string, tokenId: bigint): Promise<any>
  [key: string]: any
}

interface EthersContractFactory {
  deploy(...args: any[]): Promise<EthersContract & { deploymentTransaction(): any; waitForDeployment(): Promise<EthersContract> }>
}

/**
 * Ethereum Blockchain Adapter.
 *
 * Fully implements BlockchainAdapter interface for Ethereum network.
 * Uses ethers.js v6 for blockchain interactions.
 */
export class EthereumAdapter extends BaseBlockchainAdapter {
  readonly chainId: SupportedChain = 'ethereum'
  readonly name: string = 'Ethereum'
  readonly capabilities = CHAIN_CAPABILITIES.ethereum
  network: NetworkType = 'testnet'

  // Ethereum-specific members
  protected provider?: EthersProvider
  protected wallet?: EthersWallet
  protected operatorAddress?: string

  // Browser wallet integration
  protected browserProvider?: EthersProvider
  protected browserSigner?: EthersWallet
  protected connectedWalletProvider?: WalletProvider

  // ethers.js module reference (loaded dynamically for test mocking)
  protected ethers: any

  /**
   * Initialize Ethereum adapter with configuration.
   *
   * @param config - Blockchain configuration with credentials
   */
  async initialize(config: BlockchainConfiguration): Promise<void> {
    try {
      // Load ethers dynamically (allows test mocking)
      this.ethers = await this.loadEthers()

      // Validate configuration
      if (!config.credentials?.privateKeyEVM && !config.credentials?.privateKey) {
        throw new BlockchainError(
          BlockchainErrorCode.INVALID_CREDENTIALS,
          'Ethereum requires privateKeyEVM or privateKey in credentials'
        )
      }

      // Set network
      this.network = config.network || 'testnet'

      // Determine RPC URL
      const rpcUrl = this.getRpcUrl(config)

      // Create provider
      const provider = new this.ethers.JsonRpcProvider(rpcUrl)
      this.provider = provider

      // Verify network connection
      const network = await provider.getNetwork()
      const expectedChainId = this.getExpectedChainId()

      if (network.chainId !== BigInt(expectedChainId)) {
        console.warn(
          `Warning: Connected to chain ${network.chainId}, expected ${expectedChainId}`
        )
      }

      // Create wallet from private key
      const privateKey = config.credentials.privateKeyEVM || config.credentials.privateKey
      const wallet = new this.ethers.Wallet(privateKey, provider)
      this.wallet = wallet
      this.operatorAddress = await wallet.getAddress()

      // Mark as connected
      this._isConnected = true
      this.config = config

      console.log(
        `EthereumAdapter initialized for ${this.network} with address ${this.operatorAddress}`
      )
    } catch (error: any) {
      if (error instanceof BlockchainError) throw error
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to initialize EthereumAdapter: ${error.message}`,
        error
      )
    }
  }

  /**
   * Load ethers.js module (allows test mocking).
   */
  protected async loadEthers(): Promise<any> {
    // In tests, this can be mocked
    try {
      return await import('ethers')
    } catch {
      // If ethers is not installed, throw helpful error
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        'ethers.js not installed. Run: npm install ethers'
      )
    }
  }

  /**
   * Get RPC URL based on configuration.
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

    // Default public RPC URLs
    const metadata = CHAIN_METADATA.ethereum
    if (this.network === 'mainnet') {
      return 'https://eth.llamarpc.com' // Free public RPC
    }
    return 'https://rpc.sepolia.org' // Free Sepolia RPC
  }

  /**
   * Get expected chain ID for current network.
   */
  protected getExpectedChainId(): number {
    const metadata = CHAIN_METADATA.ethereum
    if (this.network === 'mainnet') {
      return metadata.chainId?.mainnet as number || 1
    }
    return metadata.chainId?.testnet as number || 11155111 // Sepolia
  }

  /**
   * Disconnect and clean up resources.
   */
  async disconnect(): Promise<void> {
    if (this.provider && 'destroy' in this.provider) {
      (this.provider as any).destroy()
    }
    this.provider = undefined
    this.wallet = undefined
    this.operatorAddress = undefined
    this._isConnected = false
  }

  /**
   * Helper to create a TransactionResult from Ethereum transaction response.
   */
  protected createTransactionResult(
    txResponse: any,
    status: 'pending' | 'success' | 'failed' = 'success'
  ): TransactionResult {
    return {
      transactionId: txResponse.hash,
      transactionHash: txResponse.hash,
      status,
      blockNumber: txResponse.blockNumber || 0,
      timestamp: new Date(),
      explorerUrl: this.getExplorerUrl(txResponse.hash),
      gasUsed: txResponse.gasUsed ? BigInt(txResponse.gasUsed) : undefined,
    }
  }

  /**
   * Create an ERC-20 fungible token.
   *
   * @param params - Token creation parameters
   * @returns Token creation result with contract address
   */
  async createToken(params: CreateTokenParams): Promise<TokenResult> {
    this.ensureInitialized()

    if (!this.wallet || !this.provider) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Wallet not initialized'
      )
    }

    try {
      // Create contract factory
      const factory = new this.ethers.ContractFactory(
        ERC20ABI.abi,
        ERC20ABI.bytecode,
        this.wallet
      )

      // Calculate initial supply with decimals
      const decimals = params.decimals || 18
      const initialSupply = BigInt(params.initialSupply || 0) * BigInt(10 ** decimals)

      // Deploy contract
      const contract = await factory.deploy(
        params.name,
        params.symbol,
        decimals,
        initialSupply
      )

      // Wait for deployment
      await contract.waitForDeployment()
      const contractAddress = await contract.getAddress()
      const deployTx = contract.deploymentTransaction()

      return {
        tokenId: contractAddress,
        tokenAddress: contractAddress,
        transaction: this.createTransactionResult(deployTx),
        metadata: params.metadata,
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `ERC-20 token creation failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Transfer ERC-20 tokens between accounts.
   *
   * @param params - Transfer parameters
   * @returns Transaction result
   */
  async transferToken(params: TransferParams): Promise<TransactionResult> {
    this.ensureInitialized()

    if (!this.wallet || !this.provider) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Wallet not initialized'
      )
    }

    try {
      if (!params.tokenId) {
        throw new BlockchainError(
          BlockchainErrorCode.INVALID_ADDRESS,
          'Token contract address (tokenId) is required for ERC-20 transfers'
        )
      }

      // Connect to token contract
      const contract = new this.ethers.Contract(
        params.tokenId,
        ERC20ABI.abi,
        this.wallet
      )

      // Execute transfer
      const tx = await contract.transfer(params.to, BigInt(params.amount))
      const receipt = await tx.wait()

      return this.createTransactionResult(receipt)
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `ERC-20 transfer failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Get ERC-20 token balance for an address.
   *
   * @param params - Balance query parameters
   * @returns Token balance as bigint
   */
  async getTokenBalance(params: BalanceParams): Promise<bigint> {
    this.ensureInitialized()

    if (!this.provider) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Provider not initialized'
      )
    }

    try {
      if (!params.tokenId) {
        throw new BlockchainError(
          BlockchainErrorCode.INVALID_ADDRESS,
          'Token contract address (tokenId) is required'
        )
      }

      // Connect to token contract (read-only)
      const contract = new this.ethers.Contract(
        params.tokenId,
        ERC20ABI.abi,
        this.provider
      )

      const balance = await contract.balanceOf(params.address)
      return BigInt(balance)
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to query token balance: ${error.message}`,
        error
      )
    }
  }

  /**
   * Create an ERC-721 NFT collection.
   *
   * @param params - NFT collection parameters
   * @returns NFT collection result
   */
  async createNFT(params: CreateNFTParams): Promise<NFTResult> {
    this.ensureInitialized()

    if (!this.wallet || !this.provider) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Wallet not initialized'
      )
    }

    try {
      // Create contract factory
      const factory = new this.ethers.ContractFactory(
        ERC721ABI.abi,
        ERC721ABI.bytecode,
        this.wallet
      )

      // Deploy contract
      const contract = await factory.deploy(params.name, params.symbol)

      // Wait for deployment
      await contract.waitForDeployment()
      const contractAddress = await contract.getAddress()
      const deployTx = contract.deploymentTransaction()

      return {
        collectionId: contractAddress,
        collectionAddress: contractAddress,
        transaction: this.createTransactionResult(deployTx),
        metadata: params.metadata,
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `ERC-721 collection creation failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Mint an NFT to an ERC-721 collection.
   *
   * @param params - NFT minting parameters
   * @returns Transaction result
   */
  async mintNFT(params: MintNFTParams): Promise<TransactionResult> {
    this.ensureInitialized()

    if (!this.wallet || !this.provider) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Wallet not initialized'
      )
    }

    try {
      // Connect to NFT contract
      const contract = new this.ethers.Contract(
        params.collectionId,
        ERC721ABI.abi,
        this.wallet
      )

      // Generate token ID (in production, this might be tracked on-chain)
      const tokenId = BigInt(Date.now())

      // Mint NFT
      const tx = await contract.safeMint(params.to, tokenId)
      const receipt = await tx.wait()

      return {
        ...this.createTransactionResult(receipt),
        customData: { tokenId: tokenId.toString() },
      }
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

    if (!this.wallet || !this.operatorAddress) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Wallet not initialized'
      )
    }

    try {
      // Connect to NFT contract
      const contract = new this.ethers.Contract(
        params.tokenId, // Collection address
        ERC721ABI.abi,
        this.wallet
      )

      // Transfer NFT
      const nftId = typeof params.nftId === 'string' ? BigInt(params.nftId) : BigInt(params.nftId)
      const tx = await contract.safeTransferFrom(
        this.operatorAddress,
        params.to,
        nftId
      )
      const receipt = await tx.wait()

      return this.createTransactionResult(receipt)
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `NFT transfer failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Deploy a smart contract to Ethereum.
   *
   * @param params - Contract deployment parameters
   * @returns Contract deployment result
   */
  async deployContract(params: DeployContractParams): Promise<ContractResult> {
    this.ensureInitialized()

    if (!this.wallet || !this.provider) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Wallet not initialized'
      )
    }

    try {
      // Parse contract code (expects JSON with abi and bytecode)
      let abi: any[]
      let bytecode: string

      if (typeof params.contractCode === 'string') {
        try {
          const parsed = JSON.parse(params.contractCode)
          abi = parsed.abi
          bytecode = parsed.bytecode
        } catch {
          // Assume it's raw bytecode
          abi = []
          bytecode = params.contractCode
        }
      } else {
        // Buffer - assume raw bytecode
        abi = []
        bytecode = '0x' + params.contractCode.toString('hex')
      }

      // Create contract factory
      const factory = new this.ethers.ContractFactory(abi, bytecode, this.wallet)

      // Deploy with constructor args if provided
      const contract = params.constructorArgs
        ? await factory.deploy(...params.constructorArgs)
        : await factory.deploy()

      // Wait for deployment
      await contract.waitForDeployment()
      const contractAddress = await contract.getAddress()
      const deployTx = contract.deploymentTransaction()

      return {
        contractId: contractAddress,
        contractAddress,
        transaction: this.createTransactionResult(deployTx),
        abi,
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

    if (!this.wallet || !this.provider) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Wallet not initialized'
      )
    }

    try {
      // For generic contract calls, we need the ABI from customConfig
      const abi = params.args?.[0]?.abi || [
        `function ${params.methodName}() external`,
      ]

      // Connect to contract
      const contract = new this.ethers.Contract(
        params.contractAddress,
        abi,
        this.wallet
      )

      // Call the method
      const args = params.args?.slice(1) || []
      const result = await contract[params.methodName](...args)

      // If it's a transaction, wait for it
      if (result && typeof result.wait === 'function') {
        const receipt = await result.wait()
        return {
          transactionHash: receipt.hash,
          result: receipt,
          explorerUrl: this.getExplorerUrl(receipt.hash),
        }
      }

      return result
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `Contract call failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Connect a browser wallet (MetaMask, WalletConnect, Coinbase Wallet).
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
      case 'metamask':
        return this.connectMetaMask()
      case 'walletconnect':
        return this.connectWalletConnect()
      case 'coinbase-wallet':
        return this.connectCoinbaseWallet()
      default:
        throw new BlockchainError(
          BlockchainErrorCode.UNSUPPORTED_OPERATION,
          `Wallet provider '${provider}' not supported for ${this.name}. Supported: metamask, walletconnect, coinbase-wallet`
        )
    }
  }

  /**
   * Connect to MetaMask wallet.
   * @private
   */
  protected async connectMetaMask(): Promise<WalletConnection> {
    // Ensure ethers is loaded
    if (!this.ethers) {
      this.ethers = await this.loadEthers()
    }

    // Check if MetaMask is installed
    if (!window.ethereum?.isMetaMask) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        'MetaMask not detected. Please install MetaMask extension.'
      )
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[]

      if (!accounts || accounts.length === 0) {
        throw new BlockchainError(
          BlockchainErrorCode.INVALID_CREDENTIALS,
          'No accounts found. Please unlock MetaMask.'
        )
      }

      // Create BrowserProvider and signer
      const { BrowserProvider } = this.ethers
      const browserProvider = new BrowserProvider(window.ethereum)
      const signer = await browserProvider.getSigner()
      const address = await signer.getAddress()

      // Store for later use
      this.browserProvider = browserProvider
      this.browserSigner = signer
      this.connectedWalletProvider = 'metamask'

      return {
        address,
        publicKey: address,
        provider: 'metamask',
        chainId: this.chainId,
        isConnected: true
      }
    } catch (error: any) {
      if (error instanceof BlockchainError) throw error

      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to connect MetaMask: ${error.message}`
      )
    }
  }

  /**
   * Connect via WalletConnect.
   * @private
   */
  protected async connectWalletConnect(): Promise<WalletConnection> {
    // WalletConnect requires additional package - provide helpful error
    throw new BlockchainError(
      BlockchainErrorCode.UNSUPPORTED_OPERATION,
      'WalletConnect integration requires @walletconnect/web3-provider package. Install with: npm install @walletconnect/web3-provider'
    )
  }

  /**
   * Connect to Coinbase Wallet.
   * @private
   */
  protected async connectCoinbaseWallet(): Promise<WalletConnection> {
    // Ensure ethers is loaded
    if (!this.ethers) {
      this.ethers = await this.loadEthers()
    }

    // Check if Coinbase Wallet is available
    if (!window.ethereum?.isCoinbaseWallet && !window.ethereum) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        'Coinbase Wallet not detected. Please install Coinbase Wallet extension.'
      )
    }

    try {
      // Request account access
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts'
      }) as string[]

      if (!accounts || accounts.length === 0) {
        throw new BlockchainError(
          BlockchainErrorCode.INVALID_CREDENTIALS,
          'No accounts found. Please unlock Coinbase Wallet.'
        )
      }

      // Create BrowserProvider and signer
      const { BrowserProvider } = this.ethers
      const browserProvider = new BrowserProvider(window.ethereum)
      const signer = await browserProvider.getSigner()
      const address = await signer.getAddress()

      // Store for later use
      this.browserProvider = browserProvider
      this.browserSigner = signer
      this.connectedWalletProvider = 'coinbase-wallet'

      return {
        address,
        publicKey: address,
        provider: 'coinbase-wallet',
        chainId: this.chainId,
        isConnected: true
      }
    } catch (error: any) {
      if (error instanceof BlockchainError) throw error

      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to connect Coinbase Wallet: ${error.message}`
      )
    }
  }

  /**
   * Disconnect the connected browser wallet.
   */
  async disconnectWallet(): Promise<void> {
    this.browserProvider = undefined
    this.browserSigner = undefined
    this.connectedWalletProvider = undefined
  }

  /**
   * Check if a browser wallet is connected.
   */
  isWalletConnected(): boolean {
    return this.browserSigner !== undefined
  }

  /**
   * Get the connected wallet provider name.
   */
  getConnectedWalletProvider(): WalletProvider | undefined {
    return this.connectedWalletProvider
  }

  /**
   * Get ETH balance for an address.
   *
   * @param address - Ethereum address
   * @returns ETH balance in wei as bigint
   */
  async getBalance(address: string): Promise<bigint> {
    this.ensureInitialized()

    if (!this.provider) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Provider not initialized'
      )
    }

    try {
      const balance = await this.provider.getBalance(address)
      return BigInt(balance)
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to query balance: ${error.message}`,
        error
      )
    }
  }

  /**
   * Sign a transaction with the wallet's private key.
   *
   * @param tx - Transaction to sign
   * @returns Signed transaction
   */
  async signTransaction(tx: Transaction): Promise<SignedTransaction> {
    this.ensureInitialized()

    if (!this.wallet) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Wallet not available'
      )
    }

    try {
      const signedTx = await this.wallet.signTransaction({
        to: tx.to,
        from: tx.from || this.operatorAddress,
        value: tx.value,
        data: tx.data,
        gasLimit: tx.gas,
        gasPrice: tx.gasPrice,
        nonce: tx.nonce,
      })

      // Calculate transaction hash
      const txHash = this.ethers.keccak256(signedTx)

      return {
        rawTransaction: signedTx,
        transactionHash: txHash,
        signature: signedTx,
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        `Transaction signing failed: ${error.message}`,
        error
      )
    }
  }

  /**
   * Get current gas prices.
   *
   * @returns Gas price structure
   */
  async getGasPrice(): Promise<GasPrice> {
    this.ensureInitialized()

    if (!this.provider) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Provider not initialized'
      )
    }

    try {
      const feeData = await this.provider.getFeeData()

      // Use maxFeePerGas for EIP-1559 or fallback to gasPrice
      const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || BigInt(20000000000)
      const priorityFee = feeData.maxPriorityFeePerGas || BigInt(2000000000)

      return {
        standard: gasPrice,
        fast: gasPrice + priorityFee,
        instant: gasPrice + priorityFee * BigInt(2),
        unit: 'wei',
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to query gas price: ${error.message}`,
        error
      )
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

    if (!this.provider) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Provider not initialized'
      )
    }

    try {
      const gasPrice = await this.getGasPrice()

      // Estimate gas based on operation type
      let estimatedGas: bigint
      switch (params.operation) {
        case 'transfer':
          estimatedGas = BigInt(21000) // Simple ETH transfer
          break
        case 'deploy':
          estimatedGas = BigInt(params.contractSize || 500000)
          break
        case 'mint':
          estimatedGas = BigInt(100000) // NFT mint
          break
        default:
          estimatedGas = BigInt(50000) // Generic operation
      }

      const estimatedCost = gasPrice.standard * estimatedGas

      // Rough USD estimate (assuming ETH ~$2000)
      const ethCost = Number(estimatedCost) / 1e18
      const estimatedCostUSD = ethCost * 2000

      return {
        estimatedCost,
        estimatedCostUSD,
        currency: 'ETH',
        breakdown: {
          baseFee: gasPrice.standard,
          priorityFee: gasPrice.fast - gasPrice.standard,
          networkFee: estimatedCost,
        },
      }
    } catch (error: any) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        `Failed to estimate fees: ${error.message}`,
        error
      )
    }
  }

  /**
   * Get transaction status.
   *
   * @param txId - Transaction hash
   * @returns Transaction status
   */
  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    this.ensureInitialized()

    if (!this.provider) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_CREDENTIALS,
        'Provider not initialized'
      )
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txId)

      if (!receipt) {
        // Transaction not yet mined
        const tx = await this.provider.getTransaction(txId)
        if (tx) {
          return {
            status: 'pending',
            confirmations: 0,
          }
        }
        return {
          status: 'unknown',
          confirmations: 0,
        }
      }

      // Calculate confirmations
      const currentBlock = await this.provider.getBlockNumber()
      const confirmations = receipt.blockNumber
        ? currentBlock - receipt.blockNumber + 1
        : 0

      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        confirmations,
        blockNumber: receipt.blockNumber,
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        status: 'unknown',
        confirmations: 0,
        error: error.message,
      }
    }
  }

  /**
   * Get block explorer URL for a transaction.
   *
   * @param txId - Transaction hash
   * @returns Explorer URL
   */
  getExplorerUrl(txId: string): string {
    const metadata = CHAIN_METADATA.ethereum
    const networkKey = this.network === 'mainnet' ? 'mainnet' : 'testnet'
    const baseUrl = metadata.explorerUrl[networkKey]
    return `${baseUrl}/tx/${txId}`
  }
}
