/**
 * Mock @solana/spl-token SDK for Testing
 *
 * This mock provides SPL Token functionality for testing the SolanaAdapter
 * without requiring actual network connections.
 *
 * HOW TO USE THIS MOCK:
 * ====================
 * In TestableSolanaAdapter, override loadSplToken() to return these mocks.
 */

import { generateMockSolanaAddress } from '../utils/test-helpers'

// Import mock classes from solana-web3 mock
import { MockPublicKey, MockConnection, MockKeypair } from './solana-web3.mock'

/**
 * Mock TOKEN_PROGRAM_ID
 */
export const TOKEN_PROGRAM_ID = new MockPublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
)

/**
 * Mock ASSOCIATED_TOKEN_PROGRAM_ID
 */
export const ASSOCIATED_TOKEN_PROGRAM_ID = new MockPublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
)

/**
 * Mock MINT_SIZE constant (82 bytes for mint account)
 */
export const MINT_SIZE = 82

/**
 * Mock AccountLayout size
 */
export const ACCOUNT_SIZE = 165

/**
 * Get minimum balance for rent-exempt mint
 */
export async function getMinimumBalanceForRentExemptMint(
  connection: MockConnection
): Promise<number> {
  return 1461600 // ~0.00146 SOL
}

/**
 * Get minimum balance for rent-exempt account
 */
export async function getMinimumBalanceForRentExemptAccount(
  connection: MockConnection
): Promise<number> {
  return 2039280 // ~0.00204 SOL
}

/**
 * Get or derive the associated token address
 */
export async function getAssociatedTokenAddress(
  mint: MockPublicKey,
  owner: MockPublicKey,
  allowOwnerOffCurve?: boolean,
  programId?: MockPublicKey,
  associatedTokenProgramId?: MockPublicKey
): Promise<MockPublicKey> {
  // Return a deterministic mock address based on mint and owner
  const combined = mint.toString().slice(0, 10) + owner.toString().slice(0, 10)
  return new MockPublicKey(generateMockSolanaAddress())
}

/**
 * Mock token account info
 */
export interface MockTokenAccount {
  mint: MockPublicKey
  owner: MockPublicKey
  amount: bigint
  delegateOption: number
  delegate: MockPublicKey | null
  state: number
  isNativeOption: number
  isNative: bigint
  delegatedAmount: bigint
  closeAuthorityOption: number
  closeAuthority: MockPublicKey | null
}

/**
 * Get token account info
 */
export async function getAccount(
  connection: MockConnection,
  address: MockPublicKey,
  commitment?: string,
  programId?: MockPublicKey
): Promise<MockTokenAccount> {
  // Return mock account with balance
  return {
    mint: new MockPublicKey(generateMockSolanaAddress()),
    owner: new MockPublicKey(generateMockSolanaAddress()),
    amount: BigInt(1000000000), // 1 token with 9 decimals
    delegateOption: 0,
    delegate: null,
    state: 1, // Initialized
    isNativeOption: 0,
    isNative: BigInt(0),
    delegatedAmount: BigInt(0),
    closeAuthorityOption: 0,
    closeAuthority: null,
  }
}

/**
 * Get or create associated token account
 */
export async function getOrCreateAssociatedTokenAccount(
  connection: MockConnection,
  payer: MockKeypair,
  mint: MockPublicKey,
  owner: MockPublicKey,
  allowOwnerOffCurve?: boolean,
  commitment?: string,
  confirmOptions?: any,
  programId?: MockPublicKey,
  associatedTokenProgramId?: MockPublicKey
): Promise<MockTokenAccount> {
  return getAccount(connection, await getAssociatedTokenAddress(mint, owner))
}

/**
 * Create initialize mint instruction
 */
export function createInitializeMintInstruction(
  mint: MockPublicKey,
  decimals: number,
  mintAuthority: MockPublicKey,
  freezeAuthority: MockPublicKey | null,
  programId?: MockPublicKey
): any {
  return {
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
    ],
    programId: programId || TOKEN_PROGRAM_ID,
    data: Buffer.alloc(67), // Initialize mint instruction data
  }
}

/**
 * Create initialize account instruction
 */
export function createInitializeAccountInstruction(
  account: MockPublicKey,
  mint: MockPublicKey,
  owner: MockPublicKey,
  programId?: MockPublicKey
): any {
  return {
    keys: [
      { pubkey: account, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: owner, isSigner: false, isWritable: false },
    ],
    programId: programId || TOKEN_PROGRAM_ID,
    data: Buffer.alloc(1),
  }
}

/**
 * Create associated token account instruction
 */
export function createAssociatedTokenAccountInstruction(
  payer: MockPublicKey,
  associatedToken: MockPublicKey,
  owner: MockPublicKey,
  mint: MockPublicKey,
  programId?: MockPublicKey,
  associatedTokenProgramId?: MockPublicKey
): any {
  return {
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
    ],
    programId: associatedTokenProgramId || ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.alloc(0),
  }
}

/**
 * Create mint to instruction
 */
export function createMintToInstruction(
  mint: MockPublicKey,
  destination: MockPublicKey,
  authority: MockPublicKey,
  amount: number | bigint,
  multiSigners?: MockKeypair[],
  programId?: MockPublicKey
): any {
  return {
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    programId: programId || TOKEN_PROGRAM_ID,
    data: Buffer.alloc(9), // MintTo instruction data
  }
}

/**
 * Create transfer instruction
 */
export function createTransferInstruction(
  source: MockPublicKey,
  destination: MockPublicKey,
  owner: MockPublicKey,
  amount: number | bigint,
  multiSigners?: MockKeypair[],
  programId?: MockPublicKey
): any {
  return {
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: programId || TOKEN_PROGRAM_ID,
    data: Buffer.alloc(9), // Transfer instruction data
  }
}

/**
 * Create transfer checked instruction
 */
export function createTransferCheckedInstruction(
  source: MockPublicKey,
  mint: MockPublicKey,
  destination: MockPublicKey,
  owner: MockPublicKey,
  amount: number | bigint,
  decimals: number,
  multiSigners?: MockKeypair[],
  programId?: MockPublicKey
): any {
  return {
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: programId || TOKEN_PROGRAM_ID,
    data: Buffer.alloc(10), // TransferChecked instruction data
  }
}

/**
 * Create burn instruction
 */
export function createBurnInstruction(
  account: MockPublicKey,
  mint: MockPublicKey,
  owner: MockPublicKey,
  amount: number | bigint,
  multiSigners?: MockKeypair[],
  programId?: MockPublicKey
): any {
  return {
    keys: [
      { pubkey: account, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: programId || TOKEN_PROGRAM_ID,
    data: Buffer.alloc(9), // Burn instruction data
  }
}

/**
 * Create close account instruction
 */
export function createCloseAccountInstruction(
  account: MockPublicKey,
  destination: MockPublicKey,
  authority: MockPublicKey,
  multiSigners?: MockKeypair[],
  programId?: MockPublicKey
): any {
  return {
    keys: [
      { pubkey: account, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    programId: programId || TOKEN_PROGRAM_ID,
    data: Buffer.alloc(1), // CloseAccount instruction data
  }
}

/**
 * Create set authority instruction
 */
export function createSetAuthorityInstruction(
  account: MockPublicKey,
  currentAuthority: MockPublicKey,
  authorityType: number,
  newAuthority: MockPublicKey | null,
  multiSigners?: MockKeypair[],
  programId?: MockPublicKey
): any {
  return {
    keys: [
      { pubkey: account, isSigner: false, isWritable: true },
      { pubkey: currentAuthority, isSigner: true, isWritable: false },
    ],
    programId: programId || TOKEN_PROGRAM_ID,
    data: Buffer.alloc(35), // SetAuthority instruction data
  }
}

/**
 * Create approve instruction
 */
export function createApproveInstruction(
  account: MockPublicKey,
  delegate: MockPublicKey,
  owner: MockPublicKey,
  amount: number | bigint,
  multiSigners?: MockKeypair[],
  programId?: MockPublicKey
): any {
  return {
    keys: [
      { pubkey: account, isSigner: false, isWritable: true },
      { pubkey: delegate, isSigner: false, isWritable: false },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: programId || TOKEN_PROGRAM_ID,
    data: Buffer.alloc(9), // Approve instruction data
  }
}

/**
 * Create revoke instruction
 */
export function createRevokeInstruction(
  account: MockPublicKey,
  owner: MockPublicKey,
  multiSigners?: MockKeypair[],
  programId?: MockPublicKey
): any {
  return {
    keys: [
      { pubkey: account, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: programId || TOKEN_PROGRAM_ID,
    data: Buffer.alloc(1), // Revoke instruction data
  }
}

/**
 * Mint tokens to an account
 */
export async function mintTo(
  connection: MockConnection,
  payer: MockKeypair,
  mint: MockPublicKey,
  destination: MockPublicKey,
  authority: MockKeypair | MockPublicKey,
  amount: number | bigint,
  multiSigners?: MockKeypair[],
  confirmOptions?: any,
  programId?: MockPublicKey
): Promise<string> {
  return generateMockSolanaAddress().slice(0, 88)
}

/**
 * Transfer tokens between accounts
 */
export async function transfer(
  connection: MockConnection,
  payer: MockKeypair,
  source: MockPublicKey,
  destination: MockPublicKey,
  owner: MockKeypair | MockPublicKey,
  amount: number | bigint,
  multiSigners?: MockKeypair[],
  confirmOptions?: any,
  programId?: MockPublicKey
): Promise<string> {
  return generateMockSolanaAddress().slice(0, 88)
}

/**
 * Create a new mint
 */
export async function createMint(
  connection: MockConnection,
  payer: MockKeypair,
  mintAuthority: MockPublicKey,
  freezeAuthority: MockPublicKey | null,
  decimals: number,
  keypair?: MockKeypair,
  confirmOptions?: any,
  programId?: MockPublicKey
): Promise<MockPublicKey> {
  return new MockPublicKey(generateMockSolanaAddress())
}

/**
 * Export all mocks as if they were the real SPL Token SDK
 */
export default {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  ACCOUNT_SIZE,
  getMinimumBalanceForRentExemptMint,
  getMinimumBalanceForRentExemptAccount,
  getAssociatedTokenAddress,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  createInitializeMintInstruction,
  createInitializeAccountInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferInstruction,
  createTransferCheckedInstruction,
  createBurnInstruction,
  createCloseAccountInstruction,
  createSetAuthorityInstruction,
  createApproveInstruction,
  createRevokeInstruction,
  mintTo,
  transfer,
  createMint,
}
