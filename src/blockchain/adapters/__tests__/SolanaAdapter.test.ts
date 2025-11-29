/**
 * SolanaAdapter Tests
 *
 * Tests for the Solana blockchain adapter using mock @solana/web3.js and @solana/spl-token.
 * Follows the same patterns as HederaAdapter.test.ts and EthereumAdapter.test.ts.
 */

import { SolanaAdapter } from '../SolanaAdapter'
import {
  BlockchainConfiguration,
  BlockchainError,
  BlockchainErrorCode,
  NetworkType,
} from '@blockchain/core/types'
import {
  createMockSolanaConfig,
  generateMockSolanaAddress,
  generateMockSolanaSignature,
} from '@test-utils/test-helpers'

// Import mock modules
import * as mockSolanaModule from '@test-mocks/solana-web3.mock'
import * as mockSplTokenModule from '@test-mocks/spl-token.mock'

/**
 * TestableSolanaAdapter - Exposes protected methods for testing.
 */
class TestableSolanaAdapter extends SolanaAdapter {
  // Override loadSolana to return our mock with proper structure
  protected async loadSolana(): Promise<any> {
    return {
      Connection: mockSolanaModule.MockConnection,
      Keypair: mockSolanaModule.MockKeypair,
      PublicKey: mockSolanaModule.MockPublicKey,
      Transaction: mockSolanaModule.MockTransaction,
      VersionedTransaction: mockSolanaModule.MockVersionedTransaction,
      TransactionMessage: mockSolanaModule.MockTransactionMessage,
      TransactionInstruction: mockSolanaModule.MockTransactionInstruction,
      SystemProgram: mockSolanaModule.MockSystemProgram,
      LAMPORTS_PER_SOL: mockSolanaModule.LAMPORTS_PER_SOL,
      clusterApiUrl: mockSolanaModule.clusterApiUrl,
    }
  }

  // Override loadSplToken to return our mock
  protected async loadSplToken(): Promise<any> {
    return mockSplTokenModule
  }

  // Override loadMetaplex to return mock
  protected async loadMetaplex(): Promise<any> {
    return {}
  }

  // Expose protected members for testing
  public get testConnection() {
    return this.connection
  }

  public get testKeypair() {
    return this.keypair
  }

  public get testWalletAddress() {
    return this.walletAddress
  }
}

describe('SolanaAdapter', () => {
  let adapter: TestableSolanaAdapter
  let config: BlockchainConfiguration

  beforeEach(() => {
    adapter = new TestableSolanaAdapter()
    config = createMockSolanaConfig()
  })

  afterEach(async () => {
    if (await adapter.isConnected()) {
      await adapter.disconnect()
    }
  })

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('initialize()', () => {
    it('should initialize successfully with valid config', async () => {
      await adapter.initialize(config)

      expect(await adapter.isConnected()).toBe(true)
      expect(adapter.testConnection).toBeDefined()
      expect(adapter.testKeypair).toBeDefined()
      expect(adapter.testWalletAddress).toBeDefined()
    })

    it('should set network from config', async () => {
      const mainnetConfig = createMockSolanaConfig({ network: 'mainnet' })
      await adapter.initialize(mainnetConfig)

      expect(adapter.network).toBe('mainnet')
    })

    it('should throw error without privateKeySolana', async () => {
      const invalidConfig: BlockchainConfiguration = {
        chain: 'solana',
        network: 'testnet',
        credentials: {},
      }

      await expect(adapter.initialize(invalidConfig)).rejects.toThrow(
        BlockchainError
      )
    })

    it('should use custom RPC URL when provided', async () => {
      const customConfig = createMockSolanaConfig({
        rpcUrl: 'https://custom-rpc.example.com',
      })

      await adapter.initialize(customConfig)
      expect(await adapter.isConnected()).toBe(true)
    })
  })

  describe('disconnect()', () => {
    it('should disconnect successfully', async () => {
      await adapter.initialize(config)
      expect(await adapter.isConnected()).toBe(true)

      await adapter.disconnect()
      expect(await adapter.isConnected()).toBe(false)
      expect(adapter.testConnection).toBeUndefined()
      expect(adapter.testKeypair).toBeUndefined()
    })

    it('should be idempotent (safe to call multiple times)', async () => {
      await adapter.initialize(config)
      await adapter.disconnect()
      await adapter.disconnect() // Should not throw

      expect(await adapter.isConnected()).toBe(false)
    })
  })

  describe('isConnected()', () => {
    it('should return false before initialization', async () => {
      expect(await adapter.isConnected()).toBe(false)
    })

    it('should return true after initialization', async () => {
      await adapter.initialize(config)
      expect(await adapter.isConnected()).toBe(true)
    })
  })

  // ============================================================================
  // METADATA TESTS
  // ============================================================================

  describe('metadata', () => {
    it('should have correct chainId', () => {
      expect(adapter.chainId).toBe('solana')
    })

    it('should have correct name', () => {
      expect(adapter.name).toBe('Solana')
    })

    it('should have capabilities defined', () => {
      expect(adapter.capabilities).toBeDefined()
      expect(adapter.capabilities.hasNativeTokens).toBe(true) // SPL Tokens
      expect(adapter.capabilities.contractLanguage).toBe('rust')
    })
  })

  // ============================================================================
  // BALANCE TESTS
  // ============================================================================

  describe('getBalance()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should return balance for valid address', async () => {
      const address = generateMockSolanaAddress()
      const balance = await adapter.getBalance(address)

      expect(typeof balance).toBe('bigint')
      expect(balance).toBeGreaterThanOrEqual(BigInt(0))
    })

    it('should throw when not initialized', async () => {
      await adapter.disconnect()

      await expect(adapter.getBalance(generateMockSolanaAddress())).rejects.toThrow(
        'not initialized'
      )
    })
  })

  describe('getTokenBalance()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should return token balance for valid address and token', async () => {
      const mintAddress = generateMockSolanaAddress()
      const userAddress = generateMockSolanaAddress()

      const balance = await adapter.getTokenBalance({
        address: userAddress,
        tokenId: mintAddress,
      })

      expect(typeof balance).toBe('bigint')
    })

    it('should throw without tokenId', async () => {
      await expect(
        adapter.getTokenBalance({
          address: generateMockSolanaAddress(),
        })
      ).rejects.toThrow('tokenId')
    })
  })

  // ============================================================================
  // GAS PRICE TESTS
  // ============================================================================

  describe('getGasPrice()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should return priority fee structure', async () => {
      const gasPrice = await adapter.getGasPrice()

      expect(gasPrice).toHaveProperty('standard')
      expect(gasPrice).toHaveProperty('fast')
      expect(gasPrice).toHaveProperty('instant')
      expect(gasPrice).toHaveProperty('unit')
      expect(gasPrice.unit).toBe('lamports')
    })

    it('should have fast > standard', async () => {
      const gasPrice = await adapter.getGasPrice()

      expect(gasPrice.fast).toBeGreaterThan(gasPrice.standard)
      expect(gasPrice.instant).toBeGreaterThan(gasPrice.fast)
    })
  })

  describe('estimateFees()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should estimate fees for transfer', async () => {
      const estimate = await adapter.estimateFees({ operation: 'transfer' })

      expect(estimate).toHaveProperty('estimatedCost')
      expect(estimate).toHaveProperty('estimatedCostUSD')
      expect(estimate).toHaveProperty('currency')
      expect(estimate.currency).toBe('SOL')
    })

    it('should estimate higher fees for mint operation', async () => {
      const transferEstimate = await adapter.estimateFees({ operation: 'transfer' })
      const mintEstimate = await adapter.estimateFees({ operation: 'mint' })

      // Mint should cost more than transfer (includes rent)
      expect(mintEstimate.estimatedCost).toBeGreaterThan(transferEstimate.estimatedCost)
    })
  })

  // ============================================================================
  // TOKEN CREATION TESTS
  // ============================================================================

  describe('createToken()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should create SPL token', async () => {
      const result = await adapter.createToken({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 9,
        initialSupply: '1000000',
      })

      expect(result).toHaveProperty('tokenId')
      expect(result).toHaveProperty('tokenAddress')
      expect(result).toHaveProperty('transaction')
      expect(result.tokenId).toBeTruthy()
      expect(result.transaction.status).toBe('success')
    })

    it('should include metadata in result', async () => {
      const metadata = { description: 'Test description' }
      const result = await adapter.createToken({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 9,
        initialSupply: '1000000',
        metadata,
      })

      expect(result.metadata).toEqual(metadata)
    })
  })

  describe('transferToken()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should transfer SPL tokens', async () => {
      const result = await adapter.transferToken({
        to: generateMockSolanaAddress(),
        amount: '1000',
        tokenId: generateMockSolanaAddress(),
      })

      expect(result).toHaveProperty('transactionId')
      expect(result).toHaveProperty('transactionHash')
      expect(result).toHaveProperty('status')
    })

    it('should throw without tokenId', async () => {
      await expect(
        adapter.transferToken({
          to: generateMockSolanaAddress(),
          amount: '1000',
        })
      ).rejects.toThrow('tokenId')
    })
  })

  // ============================================================================
  // NFT TESTS
  // ============================================================================

  describe('createNFT()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should create NFT collection', async () => {
      const result = await adapter.createNFT({
        name: 'Test NFT Collection',
        symbol: 'TNFT',
        metadata: {
          name: 'Test NFT',
          image: 'https://example.com/image.png',
        },
      })

      expect(result).toHaveProperty('collectionId')
      expect(result).toHaveProperty('collectionAddress')
      expect(result).toHaveProperty('transaction')
      expect(result.transaction.status).toBe('success')
    })
  })

  describe('mintNFT()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should mint NFT', async () => {
      const result = await adapter.mintNFT({
        collectionId: generateMockSolanaAddress(),
        to: generateMockSolanaAddress(),
        metadata: {
          name: 'Test NFT #1',
          image: 'https://example.com/nft1.png',
        },
      })

      expect(result).toHaveProperty('transactionId')
      expect(result).toHaveProperty('transactionHash')
    })
  })

  describe('transferNFT()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should transfer NFT', async () => {
      const result = await adapter.transferNFT({
        tokenId: generateMockSolanaAddress(), // Mint address
        to: generateMockSolanaAddress(),
        nftId: '1',
      })

      expect(result).toHaveProperty('transactionId')
      expect(result).toHaveProperty('status')
    })
  })

  // ============================================================================
  // CONTRACT TESTS
  // ============================================================================

  describe('deployContract()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should throw UNSUPPORTED_OPERATION', async () => {
      await expect(
        adapter.deployContract({
          contractCode: '0x...',
        })
      ).rejects.toThrow(BlockchainError)

      try {
        await adapter.deployContract({ contractCode: '0x...' })
      } catch (error: any) {
        expect(error.code).toBe(BlockchainErrorCode.UNSUPPORTED_OPERATION)
        expect(error.message).toContain('Rust')
      }
    })
  })

  describe('callContract()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should call Solana program', async () => {
      const result = await adapter.callContract({
        contractAddress: generateMockSolanaAddress(), // Program ID
        methodName: 'execute',
        args: [
          [{ pubkey: generateMockSolanaAddress(), isSigner: false, isWritable: true }],
          [], // Empty instruction data
        ],
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // TRANSACTION TESTS
  // ============================================================================

  describe('getTransactionStatus()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should return transaction status', async () => {
      const signature = generateMockSolanaSignature()
      const status = await adapter.getTransactionStatus(signature)

      expect(status).toHaveProperty('status')
      expect(status).toHaveProperty('confirmations')
      expect(['pending', 'success', 'failed', 'unknown']).toContain(status.status)
    })
  })

  describe('signTransaction()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should sign transaction', async () => {
      const signedTx = await adapter.signTransaction({
        to: generateMockSolanaAddress(),
        value: BigInt(1000000000), // 1 SOL in lamports
      })

      expect(signedTx).toHaveProperty('rawTransaction')
      expect(signedTx).toHaveProperty('transactionHash')
    })
  })

  // ============================================================================
  // EXPLORER URL TESTS
  // ============================================================================

  describe('getExplorerUrl()', () => {
    it('should return devnet explorer URL by default', () => {
      const signature = generateMockSolanaSignature()
      const url = adapter.getExplorerUrl(signature)

      expect(url).toContain('solscan.io')
      expect(url).toContain(signature)
      expect(url).toContain('cluster=devnet')
    })

    it('should return mainnet explorer URL', async () => {
      const mainnetConfig = createMockSolanaConfig({ network: 'mainnet' })
      await adapter.initialize(mainnetConfig)

      const signature = generateMockSolanaSignature()
      const url = adapter.getExplorerUrl(signature)

      expect(url).toContain('solscan.io')
      expect(url).not.toContain('cluster=')
    })
  })

  // ============================================================================
  // WALLET CONNECTION TESTS
  // ============================================================================

  describe('connectWallet()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should throw unsupported operation (not implemented yet)', async () => {
      await expect(adapter.connectWallet('phantom')).rejects.toThrow(
        BlockchainError
      )
    })
  })
})
