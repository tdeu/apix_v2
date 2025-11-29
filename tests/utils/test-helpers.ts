/**
 * Test Helpers for APIX v2
 *
 * This file contains utility functions that make writing tests easier.
 * These helpers reduce code duplication and make tests more readable.
 *
 * @example
 * import { createMockConfig, waitFor } from '@test-utils/test-helpers'
 */

import { BlockchainConfiguration, NetworkType } from '@blockchain/core/types'

/**
 * Creates a mock blockchain configuration for testing.
 *
 * WHY: Most tests need a configuration object to initialize adapters.
 * Instead of creating this object in every test, use this helper.
 *
 * @param overrides - Override default values with custom ones
 * @returns A complete BlockchainConfiguration object
 *
 * @example
 * // Use default values
 * const config = createMockConfig()
 *
 * // Override specific values
 * const mainnetConfig = createMockConfig({ network: 'mainnet' })
 */
export function createMockConfig(
  overrides: Partial<BlockchainConfiguration> = {}
): BlockchainConfiguration {
  return {
    chain: 'hedera',
    network: 'testnet' as NetworkType,
    credentials: {
      accountId: '0.0.12345',
      privateKey: '302e020100300506032b657004220420' + '0'.repeat(64),
    },
    ...overrides,
  }
}

/**
 * Creates a mock Ethereum blockchain configuration for testing.
 *
 * WHY: Ethereum adapter tests need a valid configuration object.
 * This helper provides sensible defaults for Ethereum/EVM chains.
 *
 * @param overrides - Override default values with custom ones
 * @returns A complete BlockchainConfiguration object for Ethereum
 *
 * @example
 * // Use default values (Sepolia testnet)
 * const config = createMockEthConfig()
 *
 * // Override for mainnet
 * const mainnetConfig = createMockEthConfig({ network: 'mainnet' })
 */
export function createMockEthConfig(
  overrides: Partial<BlockchainConfiguration> = {}
): BlockchainConfiguration {
  return {
    chain: 'ethereum',
    network: 'testnet' as NetworkType,
    credentials: {
      privateKeyEVM: '0x' + '1'.repeat(64), // Mock private key
    },
    rpcUrl: 'https://sepolia.infura.io/v3/mock-api-key',
    customConfig: {
      chainId: 11155111, // Sepolia
    },
    ...overrides,
  }
}

/**
 * Creates a mock Solana blockchain configuration for testing.
 *
 * WHY: Solana adapter tests need a valid configuration object.
 * This helper provides sensible defaults for Solana.
 *
 * @param overrides - Override default values with custom ones
 * @returns A complete BlockchainConfiguration object for Solana
 *
 * @example
 * // Use default values (devnet)
 * const config = createMockSolanaConfig()
 *
 * // Override for mainnet
 * const mainnetConfig = createMockSolanaConfig({ network: 'mainnet' })
 */
export function createMockSolanaConfig(
  overrides: Partial<BlockchainConfiguration> = {}
): BlockchainConfiguration {
  return {
    chain: 'solana',
    network: 'testnet' as NetworkType,
    credentials: {
      privateKeySolana: Buffer.from(new Uint8Array(64).fill(1)).toString('base64'), // Mock secret key
    },
    rpcUrl: 'https://api.devnet.solana.com',
    customConfig: {
      commitment: 'confirmed',
    },
    ...overrides,
  }
}

/**
 * Creates a mock Base blockchain configuration for testing.
 *
 * WHY: Base adapter tests need a valid configuration object.
 * Base is an L2 that uses the same format as Ethereum.
 *
 * @param overrides - Override default values with custom ones
 * @returns A complete BlockchainConfiguration object for Base
 *
 * @example
 * // Use default values (Base Sepolia testnet)
 * const config = createMockBaseConfig()
 */
export function createMockBaseConfig(
  overrides: Partial<BlockchainConfiguration> = {}
): BlockchainConfiguration {
  return {
    chain: 'base',
    network: 'testnet' as NetworkType,
    credentials: {
      privateKeyEVM: '0x' + '1'.repeat(64), // Mock private key
    },
    rpcUrl: 'https://sepolia.base.org',
    customConfig: {
      chainId: 84532, // Base Sepolia
    },
    ...overrides,
  }
}

/**
 * Waits for a condition to be true or times out.
 *
 * WHY: Sometimes we need to wait for async operations to complete.
 * This helper polls a condition function until it returns true.
 *
 * @param condition - Function that returns true when condition is met
 * @param timeout - Maximum time to wait in milliseconds (default: 5000ms)
 * @param interval - How often to check condition in milliseconds (default: 100ms)
 *
 * @example
 * // Wait for a value to change
 * await waitFor(() => myVariable === 'expected-value')
 *
 * // Wait with custom timeout
 * await waitFor(() => apiCalled, 10000, 200)
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout: Condition not met within ${timeout}ms`)
    }
    await sleep(interval)
  }
}

/**
 * Sleeps for a specified duration.
 *
 * WHY: Sometimes tests need to wait for a specific amount of time.
 *
 * @param ms - Milliseconds to sleep
 *
 * @example
 * await sleep(1000) // Wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Creates a spy function that tracks its calls.
 *
 * WHY: We often need to verify that functions were called with specific arguments.
 * A spy tracks all calls without changing the function's behavior.
 *
 * @param implementation - Optional function to execute when spy is called
 * @returns A spy function with call tracking
 *
 * @example
 * const spy = createSpy()
 * spy('hello', 123)
 * expect(spy.calls).toEqual([['hello', 123]])
 * expect(spy.callCount).toBe(1)
 */
export function createSpy<T extends (...args: any[]) => any>(
  implementation?: T
): T & { calls: any[][]; callCount: number; reset: () => void } {
  const calls: any[][] = []

  const spy = ((...args: any[]) => {
    calls.push(args)
    return implementation?.(...args)
  }) as any

  spy.calls = calls
  Object.defineProperty(spy, 'callCount', {
    get: () => calls.length,
  })
  spy.reset = () => {
    calls.length = 0
  }

  return spy
}

/**
 * Generates a random Hedera account ID for testing.
 *
 * WHY: Tests often need valid-looking account IDs but don't need real ones.
 *
 * @param shard - Optional shard number (default: 0)
 * @param realm - Optional realm number (default: 0)
 * @returns A Hedera account ID string like "0.0.12345"
 *
 * @example
 * const accountId = generateMockAccountId() // "0.0.87654"
 */
export function generateMockAccountId(shard = 0, realm = 0): string {
  const num = Math.floor(Math.random() * 1000000) + 10000
  return `${shard}.${realm}.${num}`
}

/**
 * Generates a random Hedera transaction ID for testing.
 *
 * WHY: Tests need valid-looking transaction IDs.
 *
 * @param accountId - Optional account ID (generates random if not provided)
 * @returns A Hedera transaction ID string like "0.0.12345@1234567890.123456789"
 *
 * @example
 * const txId = generateMockTransactionId() // "0.0.12345@1638360000.123456789"
 */
export function generateMockTransactionId(accountId?: string): string {
  const acct = accountId || generateMockAccountId()
  const seconds = Math.floor(Date.now() / 1000)
  const nanos = Math.floor(Math.random() * 1000000000)
  return `${acct}@${seconds}.${nanos}`
}

/**
 * Generates a random token ID for testing.
 *
 * WHY: Tests need valid-looking token IDs.
 *
 * @returns A Hedera token ID string like "0.0.54321"
 *
 * @example
 * const tokenId = generateMockTokenId() // "0.0.54321"
 */
export function generateMockTokenId(): string {
  return generateMockAccountId(0, 0)
}

/**
 * Generates a random Ethereum address for testing.
 *
 * WHY: Tests often need valid-looking Ethereum addresses but don't need real ones.
 *
 * @returns An Ethereum address string like "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
 *
 * @example
 * const address = generateMockEthAddress() // "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
 */
export function generateMockEthAddress(): string {
  const chars = '0123456789abcdef'
  let address = '0x'
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)]
  }
  return address
}

/**
 * Generates a random Ethereum transaction hash for testing.
 *
 * WHY: Tests need valid-looking transaction hashes.
 *
 * @returns An Ethereum transaction hash string like "0x..."
 *
 * @example
 * const txHash = generateMockTxHash() // "0x742d35Cc6634C0532925a3b844Bc..."
 */
export function generateMockTxHash(): string {
  const chars = '0123456789abcdef'
  let hash = '0x'
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)]
  }
  return hash
}

/**
 * Generates a random Solana address (public key) for testing.
 *
 * WHY: Tests often need valid-looking Solana addresses but don't need real ones.
 * Solana addresses are base58-encoded 32-byte public keys.
 *
 * @returns A Solana address string like "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
 *
 * @example
 * const address = generateMockSolanaAddress()
 */
export function generateMockSolanaAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let address = ''
  for (let i = 0; i < 44; i++) {
    address += chars[Math.floor(Math.random() * chars.length)]
  }
  return address
}

/**
 * Generates a random Solana transaction signature for testing.
 *
 * WHY: Tests need valid-looking transaction signatures.
 * Solana signatures are base58-encoded 64-byte signatures.
 *
 * @returns A Solana transaction signature string
 *
 * @example
 * const signature = generateMockSolanaSignature()
 */
export function generateMockSolanaSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let signature = ''
  for (let i = 0; i < 88; i++) {
    signature += chars[Math.floor(Math.random() * chars.length)]
  }
  return signature
}

/**
 * Asserts that a function throws an error with a specific message.
 *
 * WHY: We need to test error handling, but async errors are tricky.
 * This helper makes it easy to test both sync and async errors.
 *
 * @param fn - Function that should throw
 * @param expectedMessage - Expected error message (can be partial match)
 *
 * @example
 * // Test sync function
 * await expectToThrow(
 *   () => validateInput(''),
 *   'Input cannot be empty'
 * )
 *
 * // Test async function
 * await expectToThrow(
 *   async () => await fetchData(),
 *   'Network error'
 * )
 */
export async function expectToThrow(
  fn: () => any | Promise<any>,
  expectedMessage?: string
): Promise<void> {
  let error: Error | null = null

  try {
    await fn()
  } catch (e) {
    error = e as Error
  }

  if (!error) {
    throw new Error('Expected function to throw an error, but it did not')
  }

  if (expectedMessage && !error.message.includes(expectedMessage)) {
    throw new Error(
      `Expected error message to include "${expectedMessage}", ` +
        `but got "${error.message}"`
    )
  }
}

/**
 * Creates a mock transaction response for testing.
 *
 * WHY: Many tests need to simulate blockchain transaction responses.
 *
 * @param overrides - Override default values
 * @returns A mock transaction response object
 *
 * @example
 * const txResponse = createMockTransactionResponse({
 *   transactionHash: 'custom-hash'
 * })
 */
export function createMockTransactionResponse(overrides: any = {}) {
  return {
    transactionId: generateMockTransactionId(),
    transactionHash: generateMockTransactionId(),
    status: 'success' as const,
    blockNumber: 0,
    timestamp: new Date(),
    explorerUrl: 'https://hashscan.io/testnet/transaction/test',
    ...overrides,
  }
}

/**
 * Captures console output during a test.
 *
 * WHY: Sometimes we need to verify that code logs specific messages.
 *
 * @param fn - Function to execute while capturing console
 * @returns Object with captured logs
 *
 * @example
 * const { logs, errors } = await captureConsole(async () => {
 *   console.log('test message')
 *   console.error('error message')
 * })
 * expect(logs).toContain('test message')
 * expect(errors).toContain('error message')
 */
export async function captureConsole(
  fn: () => any | Promise<any>
): Promise<{ logs: string[]; errors: string[]; warns: string[] }> {
  const logs: string[] = []
  const errors: string[] = []
  const warns: string[] = []

  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  console.log = (...args) => logs.push(args.join(' '))
  console.error = (...args) => errors.push(args.join(' '))
  console.warn = (...args) => warns.push(args.join(' '))

  try {
    await fn()
  } finally {
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn
  }

  return { logs, errors, warns }
}

/**
 * Converts bigint to a human-readable token amount.
 *
 * WHY: Token amounts are stored as bigints (tinybars, wei, etc.)
 * but are easier to read as decimals (HBAR, ETH, etc.)
 *
 * @param amount - Amount in smallest unit (tinybars, wei, etc.)
 * @param decimals - Number of decimal places (default: 8 for HBAR)
 * @returns Human-readable amount as string
 *
 * @example
 * const hbar = formatTokenAmount(BigInt(100000000), 8) // "1.00000000"
 * const eth = formatTokenAmount(BigInt(1000000000000000000), 18) // "1.000..."
 */
export function formatTokenAmount(amount: bigint, decimals = 8): string {
  const divisor = BigInt(10 ** decimals)
  const whole = amount / divisor
  const fraction = amount % divisor
  const fractionStr = fraction.toString().padStart(decimals, '0')
  return `${whole}.${fractionStr}`
}

/**
 * Parses a human-readable token amount to bigint.
 *
 * WHY: Tests often use human-readable amounts but adapters need bigints.
 *
 * @param amount - Amount as string or number
 * @param decimals - Number of decimal places (default: 8 for HBAR)
 * @returns Amount in smallest unit as bigint
 *
 * @example
 * const tinybars = parseTokenAmount('1.5', 8) // BigInt(150000000)
 * const wei = parseTokenAmount('0.1', 18) // BigInt(100000000000000000)
 */
export function parseTokenAmount(amount: string | number, decimals = 8): bigint {
  const amountStr = amount.toString()
  const [whole = '0', fraction = '0'] = amountStr.split('.')
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(whole + paddedFraction)
}
