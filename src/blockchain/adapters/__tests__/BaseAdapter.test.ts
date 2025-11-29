/**
 * BaseAdapter Tests
 *
 * Tests for the Base blockchain adapter which extends EthereumAdapter.
 * Base is an Ethereum L2, so most operations are inherited from EthereumAdapter.
 * These tests verify Base-specific configuration: chain IDs, RPC URLs, and explorer URLs.
 */

import { BaseAdapter } from '../BaseAdapter'
import {
  BlockchainConfiguration,
  BlockchainError,
  BlockchainErrorCode,
  NetworkType,
} from '@blockchain/core/types'
import {
  createMockEthConfig,
  generateMockEthAddress,
  generateMockTxHash,
} from '@test-utils/test-helpers'

// Import mock ethers classes
import * as mockEthersModule from '@test-mocks/ethers.mock'

/**
 * Helper to create Base-specific config
 */
function createMockBaseConfig(
  overrides: Partial<BlockchainConfiguration> = {}
): BlockchainConfiguration {
  const baseConfig = createMockEthConfig(overrides)
  return {
    ...baseConfig,
    chain: 'base',
  }
}

/**
 * TestableBaseAdapter - Exposes protected methods for testing.
 * Extends BaseAdapter and overrides loadEthers to inject mocks.
 */
class TestableBaseAdapter extends BaseAdapter {
  // Override loadEthers to return our mock with proper structure
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

  // Expose protected members for testing
  public get testProvider() {
    return this.provider
  }

  public get testWallet() {
    return this.wallet
  }

  public get testOperatorAddress() {
    return this.operatorAddress
  }

  // Expose protected method for testing
  public testGetRpcUrl(config: BlockchainConfiguration): string {
    return this.getRpcUrl(config)
  }

  public testGetExpectedChainId(): number {
    return this.getExpectedChainId()
  }
}

describe('BaseAdapter', () => {
  let adapter: TestableBaseAdapter
  let config: BlockchainConfiguration

  beforeEach(() => {
    adapter = new TestableBaseAdapter()
    config = createMockBaseConfig()
  })

  afterEach(async () => {
    if (await adapter.isConnected()) {
      await adapter.disconnect()
    }
  })

  // ============================================================================
  // METADATA TESTS (Base-specific)
  // ============================================================================

  describe('metadata', () => {
    it('should have correct chainId', () => {
      expect(adapter.chainId).toBe('base')
    })

    it('should have correct name', () => {
      expect(adapter.name).toBe('Base')
    })

    it('should have capabilities defined', () => {
      expect(adapter.capabilities).toBeDefined()
      expect(adapter.capabilities.hasERC20).toBe(true)
      expect(adapter.capabilities.hasERC721).toBe(true)
      expect(adapter.capabilities.hasSmartContracts).toBe(true)
    })
  })

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('initialize()', () => {
    it('should initialize successfully with valid config', async () => {
      await adapter.initialize(config)

      expect(await adapter.isConnected()).toBe(true)
      expect(adapter.testProvider).toBeDefined()
      expect(adapter.testWallet).toBeDefined()
      expect(adapter.testOperatorAddress).toBeDefined()
    })

    it('should set network from config', async () => {
      const mainnetConfig = createMockBaseConfig({ network: 'mainnet' })
      await adapter.initialize(mainnetConfig)

      expect(adapter.network).toBe('mainnet')
    })

    it('should throw error without privateKey', async () => {
      const invalidConfig: BlockchainConfiguration = {
        chain: 'base',
        network: 'testnet',
        credentials: {},
      }

      await expect(adapter.initialize(invalidConfig)).rejects.toThrow(
        BlockchainError
      )
    })

    it('should use custom RPC URL when provided', async () => {
      const customConfig = createMockBaseConfig({
        rpcUrl: 'https://custom-base-rpc.example.com',
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
      expect(adapter.testProvider).toBeUndefined()
      expect(adapter.testWallet).toBeUndefined()
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
  // RPC URL TESTS (Base-specific)
  // ============================================================================

  describe('getRpcUrl()', () => {
    it('should return Base Sepolia URL for testnet after initialization', async () => {
      // Note: getRpcUrl depends on this.network which is set during initialize
      // The mock config includes a custom rpcUrl, so we test the fallback logic indirectly
      const testnetConfig = createMockBaseConfig({ network: 'testnet' })

      // Remove rpcUrl to test default endpoint selection
      delete testnetConfig.rpcUrl

      await adapter.initialize(testnetConfig)

      // After init, the adapter should have used the Base Sepolia URL
      // We can verify the network was set correctly
      expect(adapter.network).toBe('testnet')
      expect(adapter.testGetExpectedChainId()).toBe(84532) // Base Sepolia
    })

    it('should return Base mainnet URL for mainnet after initialization', async () => {
      const mainnetConfig = createMockBaseConfig({ network: 'mainnet' })
      delete mainnetConfig.rpcUrl

      await adapter.initialize(mainnetConfig)

      expect(adapter.network).toBe('mainnet')
      expect(adapter.testGetExpectedChainId()).toBe(8453) // Base mainnet
    })

    it('should use custom RPC URL when provided', async () => {
      const customUrl = 'https://my-custom-base-rpc.com'
      const customConfig = createMockBaseConfig({ rpcUrl: customUrl })

      // Custom RPC URL takes priority - test this before init
      const rpcUrl = adapter.testGetRpcUrl(customConfig)
      expect(rpcUrl).toBe(customUrl)
    })

    it('should use customConfig.rpcUrl when provided', async () => {
      const customUrl = 'https://my-custom-base-rpc.com'
      const customConfig = createMockBaseConfig({
        customConfig: { rpcUrl: customUrl },
      })

      // Remove the top-level rpcUrl so customConfig takes effect
      delete customConfig.rpcUrl

      const rpcUrl = adapter.testGetRpcUrl(customConfig)
      expect(rpcUrl).toBe(customUrl)
    })
  })

  // ============================================================================
  // CHAIN ID TESTS (Base-specific)
  // ============================================================================

  describe('getExpectedChainId()', () => {
    it('should return 84532 for testnet (Base Sepolia)', async () => {
      const testnetConfig = createMockBaseConfig({ network: 'testnet' })
      await adapter.initialize(testnetConfig)

      expect(adapter.testGetExpectedChainId()).toBe(84532)
    })

    it('should return 8453 for mainnet', async () => {
      const mainnetConfig = createMockBaseConfig({ network: 'mainnet' })
      await adapter.initialize(mainnetConfig)

      expect(adapter.testGetExpectedChainId()).toBe(8453)
    })
  })

  // ============================================================================
  // EXPLORER URL TESTS (Base-specific)
  // ============================================================================

  describe('getExplorerUrl()', () => {
    it('should return testnet Basescan URL by default', () => {
      const txHash = generateMockTxHash()
      const url = adapter.getExplorerUrl(txHash)

      expect(url).toContain('basescan.org')
      expect(url).toContain(txHash)
    })

    it('should return mainnet Basescan URL', async () => {
      const mainnetConfig = createMockBaseConfig({ network: 'mainnet' })
      await adapter.initialize(mainnetConfig)

      const txHash = generateMockTxHash()
      const url = adapter.getExplorerUrl(txHash)

      expect(url).toContain('basescan.org')
      expect(url).toContain(txHash)
    })

    it('should format transaction URL correctly', async () => {
      const txHash = '0x1234567890abcdef'
      const url = adapter.getExplorerUrl(txHash)

      expect(url).toContain('/tx/')
      expect(url).toContain(txHash)
    })
  })

  // ============================================================================
  // INHERITED FUNCTIONALITY TESTS
  // ============================================================================

  describe('inherited ERC-20 operations', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should get balance', async () => {
      const address = generateMockEthAddress()
      const balance = await adapter.getBalance(address)

      expect(typeof balance).toBe('bigint')
      expect(balance).toBeGreaterThanOrEqual(BigInt(0))
    })

    it('should get token balance', async () => {
      const tokenAddress = generateMockEthAddress()
      const userAddress = generateMockEthAddress()

      const balance = await adapter.getTokenBalance({
        address: userAddress,
        tokenId: tokenAddress,
      })

      expect(typeof balance).toBe('bigint')
    })

    it('should create ERC-20 token', async () => {
      const result = await adapter.createToken({
        name: 'Base Test Token',
        symbol: 'BTT',
        decimals: 18,
        initialSupply: '1000000',
      })

      expect(result).toHaveProperty('tokenId')
      expect(result).toHaveProperty('tokenAddress')
      expect(result).toHaveProperty('transaction')
      expect(result.transaction.status).toBe('success')
    })

    it('should transfer ERC-20 tokens', async () => {
      const result = await adapter.transferToken({
        to: generateMockEthAddress(),
        amount: '1000',
        tokenId: generateMockEthAddress(),
      })

      expect(result).toHaveProperty('transactionId')
      expect(result).toHaveProperty('transactionHash')
      expect(result).toHaveProperty('status')
    })
  })

  describe('inherited ERC-721 operations', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should create ERC-721 collection', async () => {
      const result = await adapter.createNFT({
        name: 'Base NFT Collection',
        symbol: 'BNFT',
        metadata: {
          name: 'Base NFT',
          image: 'https://example.com/image.png',
        },
      })

      expect(result).toHaveProperty('collectionId')
      expect(result).toHaveProperty('collectionAddress')
      expect(result).toHaveProperty('transaction')
      expect(result.transaction.status).toBe('success')
    })

    it('should mint NFT', async () => {
      const result = await adapter.mintNFT({
        collectionId: generateMockEthAddress(),
        to: generateMockEthAddress(),
        metadata: {
          name: 'Base NFT #1',
          image: 'https://example.com/nft1.png',
        },
      })

      expect(result).toHaveProperty('transactionId')
      expect(result).toHaveProperty('transactionHash')
    })

    it('should transfer NFT', async () => {
      const result = await adapter.transferNFT({
        tokenId: generateMockEthAddress(),
        to: generateMockEthAddress(),
        nftId: '1',
      })

      expect(result).toHaveProperty('transactionId')
      expect(result).toHaveProperty('status')
    })
  })

  describe('inherited smart contract operations', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should deploy contract', async () => {
      const result = await adapter.deployContract({
        contractCode: '0x608060405234801561001057600080fd5b50',
      })

      expect(result).toHaveProperty('contractId')
      expect(result).toHaveProperty('contractAddress')
      expect(result).toHaveProperty('transaction')
    })

    it('should call contract method', async () => {
      const result = await adapter.callContract({
        contractAddress: generateMockEthAddress(),
        methodName: 'balanceOf',
        args: [
          { abi: ['function balanceOf(address) view returns (uint256)'] },
          generateMockEthAddress(),
        ],
      })

      expect(result).toBeDefined()
    })
  })

  describe('inherited gas operations', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should get gas price', async () => {
      const gasPrice = await adapter.getGasPrice()

      expect(gasPrice).toHaveProperty('standard')
      expect(gasPrice).toHaveProperty('fast')
      expect(gasPrice).toHaveProperty('instant')
      expect(gasPrice).toHaveProperty('unit')
      expect(gasPrice.unit).toBe('wei')
    })

    it('should estimate fees', async () => {
      const estimate = await adapter.estimateFees({ operation: 'transfer' })

      expect(estimate).toHaveProperty('estimatedCost')
      expect(estimate).toHaveProperty('estimatedCostUSD')
      expect(estimate).toHaveProperty('currency')
      expect(estimate.currency).toBe('ETH')
    })
  })

  describe('inherited transaction operations', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should get transaction status', async () => {
      const txHash = generateMockTxHash()
      const status = await adapter.getTransactionStatus(txHash)

      expect(status).toHaveProperty('status')
      expect(status).toHaveProperty('confirmations')
      expect(['pending', 'success', 'failed', 'unknown']).toContain(status.status)
    })

    it('should sign transaction', async () => {
      const signedTx = await adapter.signTransaction({
        to: generateMockEthAddress(),
        value: BigInt(1000000000000000),
      })

      expect(signedTx).toHaveProperty('rawTransaction')
      expect(signedTx).toHaveProperty('transactionHash')
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
      await expect(adapter.connectWallet('metamask')).rejects.toThrow(
        BlockchainError
      )
    })
  })
})
