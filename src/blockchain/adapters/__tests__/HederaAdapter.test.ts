/**
 * HederaAdapter Unit Tests
 *
 * WHAT ARE UNIT TESTS?
 * ====================
 * Unit tests check that individual pieces of code (units) work correctly.
 * Each test is independent and tests one specific thing.
 *
 * WHY DO WE TEST?
 * ===============
 * 1. **Confidence**: Know your code works before deploying
 * 2. **Documentation**: Tests show how code should be used
 * 3. **Regression Prevention**: Catch bugs when changing code
 * 4. **Design Feedback**: Hard-to-test code is usually poorly designed
 *
 * TEST STRUCTURE (AAA Pattern)
 * ============================
 * Each test follows this pattern:
 * 1. **Arrange**: Set up test data and conditions
 * 2. **Act**: Execute the code being tested
 * 3. **Assert**: Verify the results are correct
 *
 * JEST BASICS
 * ===========
 * - `describe()`: Groups related tests together
 * - `it()` or `test()`: Defines a single test
 * - `expect()`: Makes assertions about values
 * - `beforeEach()`: Runs before each test (setup)
 * - `afterEach()`: Runs after each test (cleanup)
 */

import { HederaAdapter } from '../HederaAdapter'
import { BlockchainErrorCode } from '@blockchain/core/types'
import {
  createMockConfig,
  generateMockAccountId,
  generateMockTokenId,
  expectToThrow,
} from '@test-utils/test-helpers'

/**
 * Mock the Hedera SDK
 *
 * WHY: We don't want tests to actually connect to Hedera network.
 * HOW: Jest replaces real imports with our mock versions.
 *
 * This must be at the top of the file, before any imports that use the SDK.
 */
jest.mock('@hashgraph/sdk', () => require('@test-utils/../mocks/hedera-sdk.mock').default)

/**
 * Main test suite for HederaAdapter
 *
 * `describe()` groups related tests together.
 * This creates a test suite called "HederaAdapter"
 */
describe('HederaAdapter', () => {
  // Declare variables we'll use across multiple tests
  let adapter: HederaAdapter

  /**
   * beforeEach() runs before EVERY test in this describe block
   *
   * WHY: Each test should start with a fresh adapter instance.
   * This ensures tests don't affect each other.
   */
  beforeEach(() => {
    // Create a new adapter before each test
    adapter = new HederaAdapter()
  })

  /**
   * afterEach() runs after EVERY test in this describe block
   *
   * WHY: Clean up resources to prevent memory leaks.
   */
  afterEach(async () => {
    // Disconnect the adapter if it was connected
    if (adapter) {
      await adapter.disconnect()
    }
  })

  /**
   * Nested describe block for initialization tests
   *
   * WHY: Group tests by functionality for better organization.
   */
  describe('initialize()', () => {
    /**
     * Test: Successful initialization
     *
     * WHAT: Verify adapter can be initialized with valid config
     * WHY: This is the first thing users will do
     */
    it('should initialize successfully with valid credentials', async () => {
      // ARRANGE: Create a valid configuration
      const config = createMockConfig({
        network: 'testnet',
        credentials: {
          accountId: '0.0.12345',
          privateKey: '302e020100300506032b657004220420' + '0'.repeat(64),
        },
      })

      // ACT: Initialize the adapter
      await adapter.initialize(config)

      // ASSERT: Verify adapter is connected
      expect(await adapter.isConnected()).toBe(true)
      expect(adapter.network).toBe('testnet')
    })

    /**
     * Test: Initialization with missing credentials
     *
     * WHAT: Verify adapter rejects invalid config
     * WHY: We need to handle errors gracefully
     */
    it('should throw error when credentials are missing', async () => {
      // ARRANGE: Create config without credentials
      const config = createMockConfig({
        credentials: undefined as any,
      })

      // ACT & ASSERT: Expect initialization to throw
      await expectToThrow(
        () => adapter.initialize(config),
        'requires accountId and privateKey'
      )

      // Verify adapter is NOT connected
      expect(await adapter.isConnected()).toBe(false)
    })

    /**
     * Test: Initialization with invalid network
     *
     * WHAT: Verify adapter rejects invalid network
     * WHY: Only testnet and mainnet are supported
     */
    it('should throw error for unsupported network', async () => {
      // ARRANGE: Create config with invalid network
      const config = createMockConfig({
        network: 'invalid-network' as any,
      })

      // ACT & ASSERT
      await expectToThrow(
        () => adapter.initialize(config),
        'Unsupported network'
      )
    })

    /**
     * Test: Initialize for mainnet
     *
     * WHAT: Verify adapter can connect to mainnet
     * WHY: Users will deploy to mainnet eventually
     */
    it('should initialize successfully for mainnet', async () => {
      // ARRANGE
      const config = createMockConfig({
        network: 'mainnet',
      })

      // ACT
      await adapter.initialize(config)

      // ASSERT
      expect(await adapter.isConnected()).toBe(true)
      expect(adapter.network).toBe('mainnet')
    })
  })

  /**
   * Test suite for token operations
   */
  describe('createToken()', () => {
    /**
     * Setup: Initialize adapter before each token test
     */
    beforeEach(async () => {
      const config = createMockConfig()
      await adapter.initialize(config)
    })

    /**
     * Test: Create a basic token
     *
     * WHAT: Verify we can create a fungible token
     * WHY: Token creation is a core feature
     */
    it('should create a fungible token successfully', async () => {
      // ARRANGE: Define token parameters
      const tokenParams = {
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 8,
        initialSupply: BigInt(1000000),
      }

      // ACT: Create the token
      const result = await adapter.createToken(tokenParams)

      // ASSERT: Verify the result
      expect(result.tokenId).toBeDefined()
      expect(result.tokenAddress).toBeDefined()
      expect(result.transaction).toBeDefined()
      expect(result.transaction.status).toBe('success')
      expect(result.transaction.transactionHash).toBeDefined()
      expect(result.transaction.explorerUrl).toContain('hashscan.io')
    })

    /**
     * Test: Create token with metadata
     *
     * WHAT: Verify we can pass custom fields
     * WHY: Users may want to customize token settings
     */
    it('should create token with custom metadata', async () => {
      // ARRANGE
      const tokenParams = {
        name: 'Custom Token',
        symbol: 'CUSTOM',
        decimals: 6,
        initialSupply: BigInt(5000000),
        metadata: {
          description: 'A custom test token',
          customFields: {
            adminKey: true,
            supplyKey: true,
            freezeKey: false,
          },
        },
      }

      // ACT
      const result = await adapter.createToken(tokenParams)

      // ASSERT
      expect(result.tokenId).toBeDefined()
      expect(result.metadata).toEqual(tokenParams.metadata)
    })

    /**
     * Test: Error handling when not initialized
     *
     * WHAT: Verify error when trying to use uninitialized adapter
     * WHY: Prevent cryptic errors
     */
    it('should throw error when adapter is not initialized', async () => {
      // ARRANGE: Create a new uninitialized adapter
      const uninitializedAdapter = new HederaAdapter()

      // ACT & ASSERT
      await expectToThrow(
        () =>
          uninitializedAdapter.createToken({
            name: 'Test',
            symbol: 'TST',
            decimals: 8,
            initialSupply: BigInt(1000),
          }),
        'not initialized'
      )
    })
  })

  /**
   * Test suite for token transfers
   */
  describe('transferToken()', () => {
    beforeEach(async () => {
      const config = createMockConfig()
      await adapter.initialize(config)
    })

    it('should transfer tokens successfully', async () => {
      // ARRANGE
      const transferParams = {
        to: generateMockAccountId(),
        amount: BigInt(100),
        tokenId: generateMockTokenId(),
      }

      // ACT
      const result = await adapter.transferToken(transferParams)

      // ASSERT
      expect(result.transactionHash).toBeDefined()
      expect(result.status).toBe('success')
      expect(result.explorerUrl).toContain('hashscan.io')
    })

    it('should throw error when tokenId is missing', async () => {
      // ARRANGE
      const invalidParams = {
        to: generateMockAccountId(),
        amount: BigInt(100),
        // tokenId missing!
      } as any

      // ACT & ASSERT
      await expectToThrow(
        () => adapter.transferToken(invalidParams),
        'Token ID is required'
      )
    })
  })

  /**
   * Test suite for balance queries
   */
  describe('getBalance()', () => {
    beforeEach(async () => {
      const config = createMockConfig()
      await adapter.initialize(config)
    })

    it('should get HBAR balance for an account', async () => {
      // ARRANGE
      const accountId = generateMockAccountId()

      // ACT
      const balance = await adapter.getBalance(accountId)

      // ASSERT
      expect(balance).toBeDefined()
      expect(typeof balance).toBe('bigint')
      expect(balance).toBeGreaterThanOrEqual(BigInt(0))
    })
  })

  /**
   * Test suite for token balance queries
   */
  describe('getTokenBalance()', () => {
    beforeEach(async () => {
      const config = createMockConfig()
      await adapter.initialize(config)
    })

    it('should get token balance for an account', async () => {
      // ARRANGE
      const balanceParams = {
        address: generateMockAccountId(),
        tokenId: generateMockTokenId(),
      }

      // ACT
      const balance = await adapter.getTokenBalance(balanceParams)

      // ASSERT
      expect(balance).toBeDefined()
      expect(typeof balance).toBe('bigint')
    })
  })

  /**
   * Test suite for NFT operations
   */
  describe('NFT operations', () => {
    beforeEach(async () => {
      const config = createMockConfig()
      await adapter.initialize(config)
    })

    describe('createNFT()', () => {
      it('should create an NFT collection successfully', async () => {
        // ARRANGE
        const nftParams = {
          name: 'Test NFT Collection',
          symbol: 'TNFT',
          metadata: {
            name: 'Test NFT',
            description: 'A test NFT collection',
            image: 'https://example.com/image.png',
          },
        }

        // ACT
        const result = await adapter.createNFT(nftParams)

        // ASSERT
        expect(result.collectionId).toBeDefined()
        expect(result.collectionAddress).toBeDefined()
        expect(result.transaction).toBeDefined()
        expect(result.transaction.status).toBe('success')
      })
    })

    describe('mintNFT()', () => {
      it('should mint an NFT to a collection', async () => {
        // ARRANGE
        const mintParams = {
          collectionId: generateMockTokenId(),
          to: generateMockAccountId(),
          metadata: {
            name: 'Test NFT #1',
            description: 'First NFT in collection',
            image: 'https://example.com/nft1.png',
          },
        }

        // ACT
        const result = await adapter.mintNFT(mintParams)

        // ASSERT
        expect(result.transactionHash).toBeDefined()
        expect(result.status).toBe('success')
      })
    })

    describe('transferNFT()', () => {
      it('should transfer an NFT between accounts', async () => {
        // ARRANGE
        const transferParams = {
          to: generateMockAccountId(),
          tokenId: generateMockTokenId(),
          nftId: 1,
        }

        // ACT
        const result = await adapter.transferNFT(transferParams)

        // ASSERT
        expect(result.transactionHash).toBeDefined()
        expect(result.status).toBe('success')
      })
    })
  })

  /**
   * Test suite for disconnect
   */
  describe('disconnect()', () => {
    it('should disconnect successfully', async () => {
      // ARRANGE: Initialize first
      const config = createMockConfig()
      await adapter.initialize(config)
      expect(await adapter.isConnected()).toBe(true)

      // ACT: Disconnect
      await adapter.disconnect()

      // ASSERT: Should no longer be connected
      expect(await adapter.isConnected()).toBe(false)
    })

    it('should be safe to call disconnect multiple times', async () => {
      // ARRANGE
      const config = createMockConfig()
      await adapter.initialize(config)

      // ACT: Disconnect twice
      await adapter.disconnect()
      await adapter.disconnect() // Should not throw

      // ASSERT
      expect(await adapter.isConnected()).toBe(false)
    })
  })

  /**
   * Test suite for explorer URLs
   */
  describe('getExplorerUrl()', () => {
    it('should generate correct testnet explorer URL', () => {
      // ARRANGE
      adapter.network = 'testnet'
      const txId = '0.0.12345@1234567890.123456789'

      // ACT
      const url = adapter.getExplorerUrl(txId)

      // ASSERT
      expect(url).toContain('hashscan.io/testnet')
      expect(url).toContain('transaction')
      expect(url).toContain(txId)
    })

    it('should generate correct mainnet explorer URL', () => {
      // ARRANGE
      adapter.network = 'mainnet'
      const txId = '0.0.12345@1234567890.123456789'

      // ACT
      const url = adapter.getExplorerUrl(txId)

      // ASSERT
      expect(url).toContain('hashscan.io/mainnet')
      expect(url).toContain('transaction')
    })
  })

  /**
   * Test suite for gas/fee estimation
   */
  describe('estimateFees()', () => {
    beforeEach(async () => {
      const config = createMockConfig()
      await adapter.initialize(config)
    })

    it('should estimate fees for transfer operation', async () => {
      // ARRANGE
      const params = {
        operation: 'transfer' as const,
      }

      // ACT
      const estimate = await adapter.estimateFees(params)

      // ASSERT
      expect(estimate.estimatedCost).toBeDefined()
      expect(typeof estimate.estimatedCost).toBe('bigint')
      expect(estimate.currency).toBe('HBAR')
      expect(estimate.breakdown).toBeDefined()
    })

    it('should estimate fees for deploy operation', async () => {
      // ARRANGE
      const params = {
        operation: 'deploy' as const,
      }

      // ACT
      const estimate = await adapter.estimateFees(params)

      // ASSERT
      expect(estimate.estimatedCost).toBeGreaterThan(BigInt(0))
      // Deploy should be more expensive than transfer
      const transferEstimate = await adapter.estimateFees({ operation: 'transfer' })
      expect(estimate.estimatedCost).toBeGreaterThan(transferEstimate.estimatedCost)
    })
  })
})

/**
 * TESTING BEST PRACTICES DEMONSTRATED IN THIS FILE:
 * ==================================================
 *
 * 1. **Clear Test Names**: Each test name describes WHAT is being tested
 *    ✅ "should create a fungible token successfully"
 *    ❌ "test1"
 *
 * 2. **AAA Pattern**: Arrange, Act, Assert sections are clearly marked
 *
 * 3. **Test One Thing**: Each test focuses on one specific behavior
 *
 * 4. **Independent Tests**: Tests don't depend on each other
 *    - Each uses beforeEach() for fresh setup
 *    - Tests can run in any order
 *
 * 5. **Good Assertions**:
 *    ✅ expect(result.tokenId).toBeDefined()
 *    ✅ expect(balance).toBeGreaterThanOrEqual(BigInt(0))
 *    ❌ expect(true).toBe(true) // Too vague
 *
 * 6. **Test Both Success and Failure**:
 *    - Test happy path (things work correctly)
 *    - Test sad path (errors are handled properly)
 *
 * 7. **Use Mocks**: Don't connect to real blockchain in tests
 *
 * 8. **Descriptive Comments**: Explain WHY tests exist, not just WHAT they do
 */
