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
import { MockPublicKey, MockConnection, MockKeypair } from './solana-web3.mock';
/**
 * Mock TOKEN_PROGRAM_ID
 */
export declare const TOKEN_PROGRAM_ID: MockPublicKey;
/**
 * Mock ASSOCIATED_TOKEN_PROGRAM_ID
 */
export declare const ASSOCIATED_TOKEN_PROGRAM_ID: MockPublicKey;
/**
 * Mock MINT_SIZE constant (82 bytes for mint account)
 */
export declare const MINT_SIZE = 82;
/**
 * Mock AccountLayout size
 */
export declare const ACCOUNT_SIZE = 165;
/**
 * Get minimum balance for rent-exempt mint
 */
export declare function getMinimumBalanceForRentExemptMint(connection: MockConnection): Promise<number>;
/**
 * Get minimum balance for rent-exempt account
 */
export declare function getMinimumBalanceForRentExemptAccount(connection: MockConnection): Promise<number>;
/**
 * Get or derive the associated token address
 */
export declare function getAssociatedTokenAddress(mint: MockPublicKey, owner: MockPublicKey, allowOwnerOffCurve?: boolean, programId?: MockPublicKey, associatedTokenProgramId?: MockPublicKey): Promise<MockPublicKey>;
/**
 * Mock token account info
 */
export interface MockTokenAccount {
    mint: MockPublicKey;
    owner: MockPublicKey;
    amount: bigint;
    delegateOption: number;
    delegate: MockPublicKey | null;
    state: number;
    isNativeOption: number;
    isNative: bigint;
    delegatedAmount: bigint;
    closeAuthorityOption: number;
    closeAuthority: MockPublicKey | null;
}
/**
 * Get token account info
 */
export declare function getAccount(connection: MockConnection, address: MockPublicKey, commitment?: string, programId?: MockPublicKey): Promise<MockTokenAccount>;
/**
 * Get or create associated token account
 */
export declare function getOrCreateAssociatedTokenAccount(connection: MockConnection, payer: MockKeypair, mint: MockPublicKey, owner: MockPublicKey, allowOwnerOffCurve?: boolean, commitment?: string, confirmOptions?: any, programId?: MockPublicKey, associatedTokenProgramId?: MockPublicKey): Promise<MockTokenAccount>;
/**
 * Create initialize mint instruction
 */
export declare function createInitializeMintInstruction(mint: MockPublicKey, decimals: number, mintAuthority: MockPublicKey, freezeAuthority: MockPublicKey | null, programId?: MockPublicKey): any;
/**
 * Create initialize account instruction
 */
export declare function createInitializeAccountInstruction(account: MockPublicKey, mint: MockPublicKey, owner: MockPublicKey, programId?: MockPublicKey): any;
/**
 * Create associated token account instruction
 */
export declare function createAssociatedTokenAccountInstruction(payer: MockPublicKey, associatedToken: MockPublicKey, owner: MockPublicKey, mint: MockPublicKey, programId?: MockPublicKey, associatedTokenProgramId?: MockPublicKey): any;
/**
 * Create mint to instruction
 */
export declare function createMintToInstruction(mint: MockPublicKey, destination: MockPublicKey, authority: MockPublicKey, amount: number | bigint, multiSigners?: MockKeypair[], programId?: MockPublicKey): any;
/**
 * Create transfer instruction
 */
export declare function createTransferInstruction(source: MockPublicKey, destination: MockPublicKey, owner: MockPublicKey, amount: number | bigint, multiSigners?: MockKeypair[], programId?: MockPublicKey): any;
/**
 * Create transfer checked instruction
 */
export declare function createTransferCheckedInstruction(source: MockPublicKey, mint: MockPublicKey, destination: MockPublicKey, owner: MockPublicKey, amount: number | bigint, decimals: number, multiSigners?: MockKeypair[], programId?: MockPublicKey): any;
/**
 * Create burn instruction
 */
export declare function createBurnInstruction(account: MockPublicKey, mint: MockPublicKey, owner: MockPublicKey, amount: number | bigint, multiSigners?: MockKeypair[], programId?: MockPublicKey): any;
/**
 * Create close account instruction
 */
export declare function createCloseAccountInstruction(account: MockPublicKey, destination: MockPublicKey, authority: MockPublicKey, multiSigners?: MockKeypair[], programId?: MockPublicKey): any;
/**
 * Create set authority instruction
 */
export declare function createSetAuthorityInstruction(account: MockPublicKey, currentAuthority: MockPublicKey, authorityType: number, newAuthority: MockPublicKey | null, multiSigners?: MockKeypair[], programId?: MockPublicKey): any;
/**
 * Create approve instruction
 */
export declare function createApproveInstruction(account: MockPublicKey, delegate: MockPublicKey, owner: MockPublicKey, amount: number | bigint, multiSigners?: MockKeypair[], programId?: MockPublicKey): any;
/**
 * Create revoke instruction
 */
export declare function createRevokeInstruction(account: MockPublicKey, owner: MockPublicKey, multiSigners?: MockKeypair[], programId?: MockPublicKey): any;
/**
 * Mint tokens to an account
 */
export declare function mintTo(connection: MockConnection, payer: MockKeypair, mint: MockPublicKey, destination: MockPublicKey, authority: MockKeypair | MockPublicKey, amount: number | bigint, multiSigners?: MockKeypair[], confirmOptions?: any, programId?: MockPublicKey): Promise<string>;
/**
 * Transfer tokens between accounts
 */
export declare function transfer(connection: MockConnection, payer: MockKeypair, source: MockPublicKey, destination: MockPublicKey, owner: MockKeypair | MockPublicKey, amount: number | bigint, multiSigners?: MockKeypair[], confirmOptions?: any, programId?: MockPublicKey): Promise<string>;
/**
 * Create a new mint
 */
export declare function createMint(connection: MockConnection, payer: MockKeypair, mintAuthority: MockPublicKey, freezeAuthority: MockPublicKey | null, decimals: number, keypair?: MockKeypair, confirmOptions?: any, programId?: MockPublicKey): Promise<MockPublicKey>;
/**
 * Export all mocks as if they were the real SPL Token SDK
 */
declare const _default: {
    TOKEN_PROGRAM_ID: MockPublicKey;
    ASSOCIATED_TOKEN_PROGRAM_ID: MockPublicKey;
    MINT_SIZE: number;
    ACCOUNT_SIZE: number;
    getMinimumBalanceForRentExemptMint: typeof getMinimumBalanceForRentExemptMint;
    getMinimumBalanceForRentExemptAccount: typeof getMinimumBalanceForRentExemptAccount;
    getAssociatedTokenAddress: typeof getAssociatedTokenAddress;
    getAccount: typeof getAccount;
    getOrCreateAssociatedTokenAccount: typeof getOrCreateAssociatedTokenAccount;
    createInitializeMintInstruction: typeof createInitializeMintInstruction;
    createInitializeAccountInstruction: typeof createInitializeAccountInstruction;
    createAssociatedTokenAccountInstruction: typeof createAssociatedTokenAccountInstruction;
    createMintToInstruction: typeof createMintToInstruction;
    createTransferInstruction: typeof createTransferInstruction;
    createTransferCheckedInstruction: typeof createTransferCheckedInstruction;
    createBurnInstruction: typeof createBurnInstruction;
    createCloseAccountInstruction: typeof createCloseAccountInstruction;
    createSetAuthorityInstruction: typeof createSetAuthorityInstruction;
    createApproveInstruction: typeof createApproveInstruction;
    createRevokeInstruction: typeof createRevokeInstruction;
    mintTo: typeof mintTo;
    transfer: typeof transfer;
    createMint: typeof createMint;
};
export default _default;
//# sourceMappingURL=spl-token.mock.d.ts.map