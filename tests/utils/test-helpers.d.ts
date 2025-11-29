/**
 * Test Helpers for APIX v2
 *
 * This file contains utility functions that make writing tests easier.
 * These helpers reduce code duplication and make tests more readable.
 *
 * @example
 * import { createMockConfig, waitFor } from '@test-utils/test-helpers'
 */
import { BlockchainConfiguration } from '@blockchain/core/types';
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
export declare function createMockConfig(overrides?: Partial<BlockchainConfiguration>): BlockchainConfiguration;
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
export declare function createMockEthConfig(overrides?: Partial<BlockchainConfiguration>): BlockchainConfiguration;
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
export declare function createMockSolanaConfig(overrides?: Partial<BlockchainConfiguration>): BlockchainConfiguration;
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
export declare function createMockBaseConfig(overrides?: Partial<BlockchainConfiguration>): BlockchainConfiguration;
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
export declare function waitFor(condition: () => boolean, timeout?: number, interval?: number): Promise<void>;
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
export declare function sleep(ms: number): Promise<void>;
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
export declare function createSpy<T extends (...args: any[]) => any>(implementation?: T): T & {
    calls: any[][];
    callCount: number;
    reset: () => void;
};
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
export declare function generateMockAccountId(shard?: number, realm?: number): string;
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
export declare function generateMockTransactionId(accountId?: string): string;
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
export declare function generateMockTokenId(): string;
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
export declare function generateMockEthAddress(): string;
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
export declare function generateMockTxHash(): string;
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
export declare function generateMockSolanaAddress(): string;
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
export declare function generateMockSolanaSignature(): string;
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
export declare function expectToThrow(fn: () => any | Promise<any>, expectedMessage?: string): Promise<void>;
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
export declare function createMockTransactionResponse(overrides?: any): any;
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
export declare function captureConsole(fn: () => any | Promise<any>): Promise<{
    logs: string[];
    errors: string[];
    warns: string[];
}>;
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
export declare function formatTokenAmount(amount: bigint, decimals?: number): string;
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
export declare function parseTokenAmount(amount: string | number, decimals?: number): bigint;
//# sourceMappingURL=test-helpers.d.ts.map