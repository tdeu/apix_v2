/**
 * Multi-Chain Integration Tests
 *
 * These tests verify that the same operations work consistently
 * across all 4 supported blockchains: Hedera, Ethereum, Solana, and Base.
 *
 * Each test suite verifies:
 * 1. All adapters implement the BlockchainAdapter interface
 * 2. Operations return consistent result structures
 * 3. Error handling is consistent across chains
 */

import { BlockchainAdapter } from '@blockchain/core/BlockchainAdapter'
import { HederaAdapter } from '@blockchain/adapters/HederaAdapter'
import { EthereumAdapter } from '@blockchain/adapters/EthereumAdapter'
import { SolanaAdapter } from '@blockchain/adapters/SolanaAdapter'
import { BaseAdapter } from '@blockchain/adapters/BaseAdapter'
import {
  BlockchainConfiguration,
  BlockchainError,
  BlockchainErrorCode,
  SupportedChain,
} from '@blockchain/core/types'
import {
  createMockEthConfig,
  createMockSolanaConfig,
  generateMockEthAddress,
  generateMockSolanaAddress,
  generateMockTxHash,
  generateMockSolanaSignature,
} from '@test-utils/test-helpers'

// Import mocks
import * as mockEthersModule from '@test-mocks/ethers.mock'
import * as mockSolanaModule from '@test-mocks/solana-web3.mock'
import * as mockSplTokenModule from '@test-mocks/spl-token.mock'

/**
 * Create mock Hedera config
 */
function createMockHederaConfig(
  overrides: Partial<BlockchainConfiguration> = {}
): BlockchainConfiguration {
  return {
    chain: 'hedera',
    network: 'testnet',
    credentials: {
      accountId: '0.0.12345',
      privateKey:
        '302e020100300506032b657004220420db484b828e64b2d8f12ce3c0a0e93a0b8cce7af1bb8f39c97732394482538e10',
    },
    ...overrides,
  }
}

/**
 * Testable EthereumAdapter with mocked ethers
 */
class TestableEthereumAdapter extends EthereumAdapter {
  protected async loadEthers(): Promise<any> {
    return {
      JsonRpcProvider: mockEthersModule.MockJsonRpcProvider,
      BrowserProvider: mockEthersModule.MockBrowserProvider,
      Wallet: mockEthersModule.MockWallet,
      Contract: mockEthersModule.MockContract,
      ContractFactory: mockEthersModule.MockContractFactory,
      Interface: mockEthersModule.MockInterface,
      parseEther: mockEthersModule.parseEther,
      formatEther: mockEthersModule.formatEther,
      parseUnits: mockEthersModule.parseUnits,
      formatUnits: mockEthersModule.formatUnits,
      getAddress: mockEthersModule.getAddress,
      isAddress: mockEthersModule.isAddress,
      id: mockEthersModule.id,
      keccak256: mockEthersModule.keccak256,
    }
  }
}

/**
 * Testable SolanaAdapter with mocked web3
 */
class TestableSolanaAdapter extends SolanaAdapter {
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

  protected async loadSplToken(): Promise<any> {
    return mockSplTokenModule
  }

  protected async loadMetaplex(): Promise<any> {
    return {}
  }
}

/**
 * Testable BaseAdapter with mocked ethers
 */
class TestableBaseAdapter extends BaseAdapter {
  protected async loadEthers(): Promise<any> {
    return {
      JsonRpcProvider: mockEthersModule.MockJsonRpcProvider,
      BrowserProvider: mockEthersModule.MockBrowserProvider,
      Wallet: mockEthersModule.MockWallet,
      Contract: mockEthersModule.MockContract,
      ContractFactory: mockEthersModule.MockContractFactory,
      Interface: mockEthersModule.MockInterface,
      parseEther: mockEthersModule.parseEther,
      formatEther: mockEthersModule.formatEther,
      parseUnits: mockEthersModule.parseUnits,
      formatUnits: mockEthersModule.formatUnits,
      getAddress: mockEthersModule.getAddress,
      isAddress: mockEthersModule.isAddress,
      id: mockEthersModule.id,
      keccak256: mockEthersModule.keccak256,
    }
  }
}

// ============================================================================
// MULTI-CHAIN INTERFACE TESTS
// ============================================================================

describe('Multi-Chain Integration Tests', () => {
  // Adapter instances for EVM and Solana (Hedera requires real SDK)
  let ethereumAdapter: TestableEthereumAdapter
  let solanaAdapter: TestableSolanaAdapter
  let baseAdapter: TestableBaseAdapter

  beforeEach(() => {
    ethereumAdapter = new TestableEthereumAdapter()
    solanaAdapter = new TestableSolanaAdapter()
    baseAdapter = new TestableBaseAdapter()
  })

  afterEach(async () => {
    // Cleanup
    if (await ethereumAdapter.isConnected()) await ethereumAdapter.disconnect()
    if (await solanaAdapter.isConnected()) await solanaAdapter.disconnect()
    if (await baseAdapter.isConnected()) await baseAdapter.disconnect()
  })

  // ==========================================================================
  // ADAPTER INTERFACE COMPLIANCE
  // ==========================================================================

  describe('Adapter Interface Compliance', () => {
    it('should have all required properties on EthereumAdapter', () => {
      expect(ethereumAdapter.chainId).toBe('ethereum')
      expect(ethereumAdapter.name).toBe('Ethereum')
      expect(ethereumAdapter.capabilities).toBeDefined()
      expect(typeof ethereumAdapter.initialize).toBe('function')
      expect(typeof ethereumAdapter.disconnect).toBe('function')
      expect(typeof ethereumAdapter.isConnected).toBe('function')
      expect(typeof ethereumAdapter.createToken).toBe('function')
      expect(typeof ethereumAdapter.transferToken).toBe('function')
      expect(typeof ethereumAdapter.getTokenBalance).toBe('function')
      expect(typeof ethereumAdapter.createNFT).toBe('function')
      expect(typeof ethereumAdapter.mintNFT).toBe('function')
      expect(typeof ethereumAdapter.transferNFT).toBe('function')
      expect(typeof ethereumAdapter.deployContract).toBe('function')
      expect(typeof ethereumAdapter.callContract).toBe('function')
      expect(typeof ethereumAdapter.connectWallet).toBe('function')
      expect(typeof ethereumAdapter.getBalance).toBe('function')
      expect(typeof ethereumAdapter.signTransaction).toBe('function')
      expect(typeof ethereumAdapter.getGasPrice).toBe('function')
      expect(typeof ethereumAdapter.estimateFees).toBe('function')
      expect(typeof ethereumAdapter.getTransactionStatus).toBe('function')
      expect(typeof ethereumAdapter.getExplorerUrl).toBe('function')
    })

    it('should have all required properties on SolanaAdapter', () => {
      expect(solanaAdapter.chainId).toBe('solana')
      expect(solanaAdapter.name).toBe('Solana')
      expect(solanaAdapter.capabilities).toBeDefined()
      expect(typeof solanaAdapter.initialize).toBe('function')
      expect(typeof solanaAdapter.disconnect).toBe('function')
      expect(typeof solanaAdapter.isConnected).toBe('function')
      expect(typeof solanaAdapter.createToken).toBe('function')
      expect(typeof solanaAdapter.transferToken).toBe('function')
      expect(typeof solanaAdapter.getTokenBalance).toBe('function')
      expect(typeof solanaAdapter.createNFT).toBe('function')
      expect(typeof solanaAdapter.mintNFT).toBe('function')
      expect(typeof solanaAdapter.transferNFT).toBe('function')
      expect(typeof solanaAdapter.deployContract).toBe('function')
      expect(typeof solanaAdapter.callContract).toBe('function')
      expect(typeof solanaAdapter.connectWallet).toBe('function')
      expect(typeof solanaAdapter.getBalance).toBe('function')
      expect(typeof solanaAdapter.signTransaction).toBe('function')
      expect(typeof solanaAdapter.getGasPrice).toBe('function')
      expect(typeof solanaAdapter.estimateFees).toBe('function')
      expect(typeof solanaAdapter.getTransactionStatus).toBe('function')
      expect(typeof solanaAdapter.getExplorerUrl).toBe('function')
    })

    it('should have all required properties on BaseAdapter', () => {
      expect(baseAdapter.chainId).toBe('base')
      expect(baseAdapter.name).toBe('Base')
      expect(baseAdapter.capabilities).toBeDefined()
      expect(typeof baseAdapter.initialize).toBe('function')
      expect(typeof baseAdapter.disconnect).toBe('function')
      expect(typeof baseAdapter.isConnected).toBe('function')
      expect(typeof baseAdapter.createToken).toBe('function')
      expect(typeof baseAdapter.transferToken).toBe('function')
      expect(typeof baseAdapter.getTokenBalance).toBe('function')
      expect(typeof baseAdapter.createNFT).toBe('function')
      expect(typeof baseAdapter.mintNFT).toBe('function')
      expect(typeof baseAdapter.transferNFT).toBe('function')
      expect(typeof baseAdapter.deployContract).toBe('function')
      expect(typeof baseAdapter.callContract).toBe('function')
      expect(typeof baseAdapter.connectWallet).toBe('function')
      expect(typeof baseAdapter.getBalance).toBe('function')
      expect(typeof baseAdapter.signTransaction).toBe('function')
      expect(typeof baseAdapter.getGasPrice).toBe('function')
      expect(typeof baseAdapter.estimateFees).toBe('function')
      expect(typeof baseAdapter.getTransactionStatus).toBe('function')
      expect(typeof baseAdapter.getExplorerUrl).toBe('function')
    })

    it('should have all required properties on HederaAdapter', () => {
      const hederaAdapter = new HederaAdapter()

      expect(hederaAdapter.chainId).toBe('hedera')
      expect(hederaAdapter.name).toBe('Hedera')
      expect(hederaAdapter.capabilities).toBeDefined()
      expect(typeof hederaAdapter.initialize).toBe('function')
      expect(typeof hederaAdapter.disconnect).toBe('function')
      expect(typeof hederaAdapter.isConnected).toBe('function')
      expect(typeof hederaAdapter.createToken).toBe('function')
      expect(typeof hederaAdapter.transferToken).toBe('function')
      expect(typeof hederaAdapter.getTokenBalance).toBe('function')
      expect(typeof hederaAdapter.createNFT).toBe('function')
      expect(typeof hederaAdapter.mintNFT).toBe('function')
      expect(typeof hederaAdapter.transferNFT).toBe('function')
      expect(typeof hederaAdapter.deployContract).toBe('function')
      expect(typeof hederaAdapter.callContract).toBe('function')
      expect(typeof hederaAdapter.connectWallet).toBe('function')
      expect(typeof hederaAdapter.getBalance).toBe('function')
      expect(typeof hederaAdapter.signTransaction).toBe('function')
      expect(typeof hederaAdapter.getGasPrice).toBe('function')
      expect(typeof hederaAdapter.estimateFees).toBe('function')
      expect(typeof hederaAdapter.getTransactionStatus).toBe('function')
      expect(typeof hederaAdapter.getExplorerUrl).toBe('function')
    })
  })

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe('Cross-Chain Initialization', () => {
    it('should initialize Ethereum adapter', async () => {
      await ethereumAdapter.initialize(createMockEthConfig())
      expect(await ethereumAdapter.isConnected()).toBe(true)
    })

    it('should initialize Solana adapter', async () => {
      await solanaAdapter.initialize(createMockSolanaConfig())
      expect(await solanaAdapter.isConnected()).toBe(true)
    })

    it('should initialize Base adapter', async () => {
      const baseConfig = createMockEthConfig({ chain: 'base' })
      await baseAdapter.initialize(baseConfig)
      expect(await baseAdapter.isConnected()).toBe(true)
    })

    it('should throw consistent error for missing credentials', async () => {
      const invalidEthConfig: BlockchainConfiguration = {
        chain: 'ethereum',
        network: 'testnet',
        credentials: {},
      }

      const invalidSolanaConfig: BlockchainConfiguration = {
        chain: 'solana',
        network: 'testnet',
        credentials: {},
      }

      await expect(ethereumAdapter.initialize(invalidEthConfig)).rejects.toThrow(BlockchainError)
      await expect(solanaAdapter.initialize(invalidSolanaConfig)).rejects.toThrow(BlockchainError)
    })
  })

  // ==========================================================================
  // BALANCE OPERATIONS
  // ==========================================================================

  describe('Cross-Chain Balance Operations', () => {
    beforeEach(async () => {
      await ethereumAdapter.initialize(createMockEthConfig())
      await solanaAdapter.initialize(createMockSolanaConfig())
      await baseAdapter.initialize(createMockEthConfig({ chain: 'base' }))
    })

    it('should return native balance as bigint on Ethereum', async () => {
      const address = generateMockEthAddress()
      const balance = await ethereumAdapter.getBalance(address)
      expect(typeof balance).toBe('bigint')
      expect(balance >= 0n).toBe(true)
    })

    it('should return native balance as bigint on Solana', async () => {
      const address = generateMockSolanaAddress()
      const balance = await solanaAdapter.getBalance(address)
      expect(typeof balance).toBe('bigint')
      expect(balance >= 0n).toBe(true)
    })

    it('should return native balance as bigint on Base', async () => {
      const address = generateMockEthAddress()
      const balance = await baseAdapter.getBalance(address)
      expect(typeof balance).toBe('bigint')
      expect(balance >= 0n).toBe(true)
    })
  })

  // ==========================================================================
  // GAS PRICE OPERATIONS
  // ==========================================================================

  describe('Cross-Chain Gas Price Operations', () => {
    beforeEach(async () => {
      await ethereumAdapter.initialize(createMockEthConfig())
      await solanaAdapter.initialize(createMockSolanaConfig())
      await baseAdapter.initialize(createMockEthConfig({ chain: 'base' }))
    })

    it('should return gas price structure on Ethereum', async () => {
      const gasPrice = await ethereumAdapter.getGasPrice()
      expect(gasPrice).toBeDefined()
      expect(gasPrice.standard).toBeDefined()
      expect(gasPrice.unit).toBeDefined()
    })

    it('should return gas price structure on Solana', async () => {
      const gasPrice = await solanaAdapter.getGasPrice()
      expect(gasPrice).toBeDefined()
      expect(gasPrice.standard).toBeDefined()
      expect(gasPrice.unit).toBeDefined()
    })

    it('should return gas price structure on Base', async () => {
      const gasPrice = await baseAdapter.getGasPrice()
      expect(gasPrice).toBeDefined()
      expect(gasPrice.standard).toBeDefined()
      expect(gasPrice.unit).toBeDefined()
    })
  })

  // ==========================================================================
  // EXPLORER URL OPERATIONS
  // ==========================================================================

  describe('Cross-Chain Explorer URL Operations', () => {
    it('should return valid explorer URL on Ethereum (mainnet)', async () => {
      await ethereumAdapter.initialize(createMockEthConfig({ network: 'mainnet' }))
      const txHash = generateMockTxHash()
      const url = ethereumAdapter.getExplorerUrl(txHash)
      expect(url).toContain('etherscan.io')
      expect(url).toContain(txHash)
    })

    it('should return valid explorer URL on Solana (mainnet)', async () => {
      await solanaAdapter.initialize(createMockSolanaConfig({ network: 'mainnet' }))
      const signature = generateMockSolanaSignature()
      const url = solanaAdapter.getExplorerUrl(signature)
      expect(url).toContain('solscan.io')
      expect(url).toContain(signature)
    })

    it('should return valid explorer URL on Base (mainnet)', async () => {
      await baseAdapter.initialize(createMockEthConfig({ chain: 'base', network: 'mainnet' }))
      const txHash = generateMockTxHash()
      const url = baseAdapter.getExplorerUrl(txHash)
      expect(url).toContain('basescan.org')
      expect(url).toContain(txHash)
    })
  })

  // ==========================================================================
  // TOKEN OPERATIONS
  // ==========================================================================

  describe('Cross-Chain Token Operations', () => {
    beforeEach(async () => {
      await ethereumAdapter.initialize(createMockEthConfig())
      await solanaAdapter.initialize(createMockSolanaConfig())
      await baseAdapter.initialize(createMockEthConfig({ chain: 'base' }))
    })

    it('should create token on Ethereum', async () => {
      const result = await ethereumAdapter.createToken({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        initialSupply: '1000000',
      })

      expect(result).toBeDefined()
      expect(result.tokenId).toBeDefined()
      expect(result.transaction).toBeDefined()
    })

    it('should create token on Solana', async () => {
      const result = await solanaAdapter.createToken({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 9,
        initialSupply: '1000000',
      })

      expect(result).toBeDefined()
      expect(result.tokenId).toBeDefined()
      expect(result.transaction).toBeDefined()
    })

    it('should create token on Base', async () => {
      const result = await baseAdapter.createToken({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        initialSupply: '1000000',
      })

      expect(result).toBeDefined()
      expect(result.tokenId).toBeDefined()
      expect(result.transaction).toBeDefined()
    })
  })

  // ==========================================================================
  // NFT OPERATIONS
  // ==========================================================================

  describe('Cross-Chain NFT Operations', () => {
    beforeEach(async () => {
      await ethereumAdapter.initialize(createMockEthConfig())
      await solanaAdapter.initialize(createMockSolanaConfig())
      await baseAdapter.initialize(createMockEthConfig({ chain: 'base' }))
    })

    it('should create NFT collection on Ethereum', async () => {
      const result = await ethereumAdapter.createNFT({
        name: 'Test Collection',
        symbol: 'TNFT',
        metadata: {
          name: 'Test NFT',
          description: 'A test NFT collection',
          image: 'https://example.com/image.png',
        },
      })

      expect(result).toBeDefined()
      expect(result.collectionId).toBeDefined()
      expect(result.transaction).toBeDefined()
    })

    it('should create NFT on Solana', async () => {
      const result = await solanaAdapter.createNFT({
        name: 'Test NFT',
        symbol: 'TNFT',
        metadata: {
          name: 'Test NFT',
          description: 'A test NFT',
          image: 'https://example.com/metadata.json',
        },
      })

      expect(result).toBeDefined()
      expect(result.collectionId).toBeDefined()
      expect(result.transaction).toBeDefined()
    })

    it('should create NFT collection on Base', async () => {
      const result = await baseAdapter.createNFT({
        name: 'Test Collection',
        symbol: 'TNFT',
        metadata: {
          name: 'Test NFT',
          description: 'A test NFT collection',
          image: 'https://example.com/image.png',
        },
      })

      expect(result).toBeDefined()
      expect(result.collectionId).toBeDefined()
      expect(result.transaction).toBeDefined()
    })
  })

  // ==========================================================================
  // CONTRACT OPERATIONS
  // ==========================================================================

  describe('Cross-Chain Contract Operations', () => {
    beforeEach(async () => {
      await ethereumAdapter.initialize(createMockEthConfig())
      await solanaAdapter.initialize(createMockSolanaConfig())
      await baseAdapter.initialize(createMockEthConfig({ chain: 'base' }))
    })

    it('should deploy contract on Ethereum', async () => {
      const result = await ethereumAdapter.deployContract({
        contractCode: '0x608060405234801561001057600080fd5b50',
      })

      expect(result).toBeDefined()
      expect(result.contractId).toBeDefined()
      expect(result.transaction).toBeDefined()
    })

    it('should return UNSUPPORTED_OPERATION for contract deploy on Solana', async () => {
      await expect(
        solanaAdapter.deployContract({
          contractCode: '0x',
        })
      ).rejects.toThrow(BlockchainError)
    })

    it('should deploy contract on Base', async () => {
      const result = await baseAdapter.deployContract({
        contractCode: '0x608060405234801561001057600080fd5b50',
      })

      expect(result).toBeDefined()
      expect(result.contractId).toBeDefined()
      expect(result.transaction).toBeDefined()
    })
  })

  // ==========================================================================
  // CAPABILITIES
  // ==========================================================================

  describe('Cross-Chain Capabilities', () => {
    it('should have consistent capability structure across chains', () => {
      const hederaAdapter = new HederaAdapter()

      // All adapters should have the same capability properties
      const capabilityKeys = [
        'hasNativeTokens',
        'hasERC20',
        'hasERC721',
        'hasSmartContracts',
        'hasConsensusService',
        'averageTPS',
        'averageFinalitySeconds',
      ]

      for (const key of capabilityKeys) {
        expect(ethereumAdapter.capabilities).toHaveProperty(key)
        expect(solanaAdapter.capabilities).toHaveProperty(key)
        expect(baseAdapter.capabilities).toHaveProperty(key)
        expect(hederaAdapter.capabilities).toHaveProperty(key)
      }
    })

    it('should report correct smart contract support', () => {
      const hederaAdapter = new HederaAdapter()

      expect(ethereumAdapter.capabilities.hasSmartContracts).toBe(true)
      expect(solanaAdapter.capabilities.hasSmartContracts).toBe(true)
      expect(baseAdapter.capabilities.hasSmartContracts).toBe(true)
      expect(hederaAdapter.capabilities.hasSmartContracts).toBe(true)
    })
  })

  // ==========================================================================
  // ERROR HANDLING CONSISTENCY
  // ==========================================================================

  describe('Cross-Chain Error Handling', () => {
    it('should throw BlockchainError for uninitialized adapter operations', async () => {
      const address = generateMockEthAddress()

      // Should throw when not initialized
      await expect(ethereumAdapter.getBalance(address)).rejects.toThrow()
      await expect(baseAdapter.getBalance(address)).rejects.toThrow()
    })

    it('should use consistent error codes across chains', () => {
      // Verify error codes exist and are strings
      expect(BlockchainErrorCode.INVALID_CREDENTIALS).toBeDefined()
      expect(BlockchainErrorCode.NETWORK_ERROR).toBeDefined()
      expect(BlockchainErrorCode.UNSUPPORTED_OPERATION).toBeDefined()
      expect(BlockchainErrorCode.INSUFFICIENT_BALANCE).toBeDefined()
      expect(BlockchainErrorCode.TRANSACTION_FAILED).toBeDefined()
    })
  })

  // ==========================================================================
  // FEE ESTIMATION
  // ==========================================================================

  describe('Cross-Chain Fee Estimation', () => {
    beforeEach(async () => {
      await ethereumAdapter.initialize(createMockEthConfig())
      await solanaAdapter.initialize(createMockSolanaConfig())
      await baseAdapter.initialize(createMockEthConfig({ chain: 'base' }))
    })

    it('should estimate fees on Ethereum', async () => {
      const estimate = await ethereumAdapter.estimateFees({
        operation: 'transfer',
        amount: '1000000000000000000',
      })

      expect(estimate).toBeDefined()
      expect(estimate.estimatedCost).toBeDefined()
      expect(estimate.currency).toBeDefined()
    })

    it('should estimate fees on Solana', async () => {
      const estimate = await solanaAdapter.estimateFees({
        operation: 'transfer',
        amount: '1000000000',
      })

      expect(estimate).toBeDefined()
      expect(estimate.estimatedCost).toBeDefined()
      expect(estimate.currency).toBeDefined()
    })

    it('should estimate fees on Base', async () => {
      const estimate = await baseAdapter.estimateFees({
        operation: 'transfer',
        amount: '1000000000000000000',
      })

      expect(estimate).toBeDefined()
      expect(estimate.estimatedCost).toBeDefined()
      expect(estimate.currency).toBeDefined()
    })
  })
})

// ============================================================================
// CHAIN-SPECIFIC FEATURE VERIFICATION
// ============================================================================

describe('Chain-Specific Feature Verification', () => {
  describe('EVM Chains (Ethereum & Base) Similarities', () => {
    let ethereumAdapter: TestableEthereumAdapter
    let baseAdapter: TestableBaseAdapter

    beforeEach(async () => {
      ethereumAdapter = new TestableEthereumAdapter()
      baseAdapter = new TestableBaseAdapter()
      await ethereumAdapter.initialize(createMockEthConfig())
      await baseAdapter.initialize(createMockEthConfig({ chain: 'base' }))
    })

    afterEach(async () => {
      await ethereumAdapter.disconnect()
      await baseAdapter.disconnect()
    })

    it('should have same ERC capabilities for both EVM chains', () => {
      expect(ethereumAdapter.capabilities.hasERC20).toBe(baseAdapter.capabilities.hasERC20)
      expect(ethereumAdapter.capabilities.hasERC721).toBe(baseAdapter.capabilities.hasERC721)
      expect(ethereumAdapter.capabilities.hasSmartContracts).toBe(
        baseAdapter.capabilities.hasSmartContracts
      )
    })

    it('should use different chain IDs', () => {
      expect(ethereumAdapter.chainId).toBe('ethereum')
      expect(baseAdapter.chainId).toBe('base')
    })

    it('should use different explorer URLs', async () => {
      await ethereumAdapter.initialize(createMockEthConfig({ network: 'mainnet' }))
      await baseAdapter.initialize(createMockEthConfig({ chain: 'base', network: 'mainnet' }))

      const txHash = generateMockTxHash()
      const ethUrl = ethereumAdapter.getExplorerUrl(txHash)
      const baseUrl = baseAdapter.getExplorerUrl(txHash)

      expect(ethUrl).toContain('etherscan.io')
      expect(baseUrl).toContain('basescan.org')
    })
  })

  describe('Non-EVM Chain (Solana) Differences', () => {
    let solanaAdapter: TestableSolanaAdapter
    let ethereumAdapter: TestableEthereumAdapter

    beforeEach(async () => {
      solanaAdapter = new TestableSolanaAdapter()
      ethereumAdapter = new TestableEthereumAdapter()
      await solanaAdapter.initialize(createMockSolanaConfig())
      await ethereumAdapter.initialize(createMockEthConfig())
    })

    afterEach(async () => {
      await solanaAdapter.disconnect()
      await ethereumAdapter.disconnect()
    })

    it('should have different token standards', () => {
      // Solana uses native tokens (SPL), Ethereum uses ERC-20
      expect(solanaAdapter.capabilities.hasNativeTokens).toBe(true)
      expect(solanaAdapter.capabilities.hasERC20).toBe(false)
      expect(ethereumAdapter.capabilities.hasNativeTokens).toBe(false)
      expect(ethereumAdapter.capabilities.hasERC20).toBe(true)
    })

    it('should have different smart contract support behavior', async () => {
      // Solana doesn't support EVM-style contract deployment
      await expect(
        solanaAdapter.deployContract({ contractCode: '0x' })
      ).rejects.toThrow(BlockchainError)

      // Ethereum does support it
      const result = await ethereumAdapter.deployContract({
        contractCode: '0x608060405234801561001057600080fd5b50',
      })
      expect(result.contractId).toBeDefined()
    })
  })
})
