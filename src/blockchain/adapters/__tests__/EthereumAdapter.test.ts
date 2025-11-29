/**
 * EthereumAdapter Tests
 *
 * Tests for the Ethereum blockchain adapter using mock ethers.js.
 * Follows the same patterns as HederaAdapter.test.ts.
 */

import { EthereumAdapter } from '../EthereumAdapter'
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
 * TestableEthereumAdapter - Exposes protected methods for testing.
 */
class TestableEthereumAdapter extends EthereumAdapter {
  // Override loadEthers to return our mock with proper structure
  protected async loadEthers(): Promise<any> {
    // Return the mock module with classes accessible as ethers.X
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
}

describe('EthereumAdapter', () => {
  let adapter: TestableEthereumAdapter
  let config: BlockchainConfiguration

  beforeEach(() => {
    adapter = new TestableEthereumAdapter()
    config = createMockEthConfig()
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
      expect(adapter.testProvider).toBeDefined()
      expect(adapter.testWallet).toBeDefined()
      expect(adapter.testOperatorAddress).toBeDefined()
    })

    it('should set network from config', async () => {
      const mainnetConfig = createMockEthConfig({ network: 'mainnet' })
      await adapter.initialize(mainnetConfig)

      expect(adapter.network).toBe('mainnet')
    })

    it('should throw error without privateKey', async () => {
      const invalidConfig: BlockchainConfiguration = {
        chain: 'ethereum',
        network: 'testnet',
        credentials: {},
      }

      await expect(adapter.initialize(invalidConfig)).rejects.toThrow(
        BlockchainError
      )
    })

    it('should use custom RPC URL when provided', async () => {
      const customConfig = createMockEthConfig({
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
  // METADATA TESTS
  // ============================================================================

  describe('metadata', () => {
    it('should have correct chainId', () => {
      expect(adapter.chainId).toBe('ethereum')
    })

    it('should have correct name', () => {
      expect(adapter.name).toBe('Ethereum')
    })

    it('should have capabilities defined', () => {
      expect(adapter.capabilities).toBeDefined()
      expect(adapter.capabilities.hasERC20).toBe(true)
      expect(adapter.capabilities.hasERC721).toBe(true)
      expect(adapter.capabilities.hasSmartContracts).toBe(true)
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
      const address = generateMockEthAddress()
      const balance = await adapter.getBalance(address)

      expect(typeof balance).toBe('bigint')
      expect(balance).toBeGreaterThanOrEqual(BigInt(0))
    })

    it('should throw when not initialized', async () => {
      await adapter.disconnect()

      await expect(adapter.getBalance(generateMockEthAddress())).rejects.toThrow(
        'not initialized'
      )
    })
  })

  describe('getTokenBalance()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should return token balance for valid address and token', async () => {
      const tokenAddress = generateMockEthAddress()
      const userAddress = generateMockEthAddress()

      const balance = await adapter.getTokenBalance({
        address: userAddress,
        tokenId: tokenAddress,
      })

      expect(typeof balance).toBe('bigint')
    })

    it('should throw without tokenId', async () => {
      await expect(
        adapter.getTokenBalance({
          address: generateMockEthAddress(),
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

    it('should return gas price structure', async () => {
      const gasPrice = await adapter.getGasPrice()

      expect(gasPrice).toHaveProperty('standard')
      expect(gasPrice).toHaveProperty('fast')
      expect(gasPrice).toHaveProperty('instant')
      expect(gasPrice).toHaveProperty('unit')
      expect(gasPrice.unit).toBe('wei')
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
      expect(estimate.currency).toBe('ETH')
    })

    it('should estimate higher fees for deploy', async () => {
      const transferEstimate = await adapter.estimateFees({ operation: 'transfer' })
      const deployEstimate = await adapter.estimateFees({ operation: 'deploy' })

      expect(deployEstimate.estimatedCost).toBeGreaterThan(
        transferEstimate.estimatedCost
      )
    })
  })

  // ============================================================================
  // TOKEN CREATION TESTS
  // ============================================================================

  describe('createToken()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should create ERC-20 token', async () => {
      const result = await adapter.createToken({
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
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
        decimals: 18,
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

    it('should throw without tokenId', async () => {
      await expect(
        adapter.transferToken({
          to: generateMockEthAddress(),
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

    it('should create ERC-721 collection', async () => {
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

    it('should mint NFT to collection', async () => {
      const result = await adapter.mintNFT({
        collectionId: generateMockEthAddress(),
        to: generateMockEthAddress(),
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
        tokenId: generateMockEthAddress(), // Collection address
        to: generateMockEthAddress(),
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

    it('should deploy contract with bytecode', async () => {
      const result = await adapter.deployContract({
        contractCode: '0x608060405234801561001057600080fd5b50',
      })

      expect(result).toHaveProperty('contractId')
      expect(result).toHaveProperty('contractAddress')
      expect(result).toHaveProperty('transaction')
    })

    it('should deploy contract with JSON artifact', async () => {
      const artifact = JSON.stringify({
        abi: [{ type: 'constructor', inputs: [] }],
        bytecode: '0x608060405234801561001057600080fd5b50',
      })

      const result = await adapter.deployContract({
        contractCode: artifact,
      })

      expect(result).toHaveProperty('contractId')
      expect(result.abi).toBeDefined()
    })
  })

  describe('callContract()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
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

  // ============================================================================
  // TRANSACTION TESTS
  // ============================================================================

  describe('getTransactionStatus()', () => {
    beforeEach(async () => {
      await adapter.initialize(config)
    })

    it('should return transaction status', async () => {
      const txHash = generateMockTxHash()
      const status = await adapter.getTransactionStatus(txHash)

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
        to: generateMockEthAddress(),
        value: BigInt(1000000000000000),
      })

      expect(signedTx).toHaveProperty('rawTransaction')
      expect(signedTx).toHaveProperty('transactionHash')
    })
  })

  // ============================================================================
  // EXPLORER URL TESTS
  // ============================================================================

  describe('getExplorerUrl()', () => {
    it('should return testnet explorer URL by default', () => {
      const txHash = generateMockTxHash()
      const url = adapter.getExplorerUrl(txHash)

      expect(url).toContain('sepolia.etherscan.io')
      expect(url).toContain(txHash)
    })

    it('should return mainnet explorer URL', async () => {
      const mainnetConfig = createMockEthConfig({ network: 'mainnet' })
      await adapter.initialize(mainnetConfig)

      const txHash = generateMockTxHash()
      const url = adapter.getExplorerUrl(txHash)

      expect(url).toContain('etherscan.io')
      expect(url).not.toContain('sepolia')
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
