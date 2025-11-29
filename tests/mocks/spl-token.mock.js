"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCOUNT_SIZE = exports.MINT_SIZE = exports.ASSOCIATED_TOKEN_PROGRAM_ID = exports.TOKEN_PROGRAM_ID = void 0;
exports.getMinimumBalanceForRentExemptMint = getMinimumBalanceForRentExemptMint;
exports.getMinimumBalanceForRentExemptAccount = getMinimumBalanceForRentExemptAccount;
exports.getAssociatedTokenAddress = getAssociatedTokenAddress;
exports.getAccount = getAccount;
exports.getOrCreateAssociatedTokenAccount = getOrCreateAssociatedTokenAccount;
exports.createInitializeMintInstruction = createInitializeMintInstruction;
exports.createInitializeAccountInstruction = createInitializeAccountInstruction;
exports.createAssociatedTokenAccountInstruction = createAssociatedTokenAccountInstruction;
exports.createMintToInstruction = createMintToInstruction;
exports.createTransferInstruction = createTransferInstruction;
exports.createTransferCheckedInstruction = createTransferCheckedInstruction;
exports.createBurnInstruction = createBurnInstruction;
exports.createCloseAccountInstruction = createCloseAccountInstruction;
exports.createSetAuthorityInstruction = createSetAuthorityInstruction;
exports.createApproveInstruction = createApproveInstruction;
exports.createRevokeInstruction = createRevokeInstruction;
exports.mintTo = mintTo;
exports.transfer = transfer;
exports.createMint = createMint;
const test_helpers_1 = require("../utils/test-helpers");
// Import mock classes from solana-web3 mock
const solana_web3_mock_1 = require("./solana-web3.mock");
/**
 * Mock TOKEN_PROGRAM_ID
 */
exports.TOKEN_PROGRAM_ID = new solana_web3_mock_1.MockPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
/**
 * Mock ASSOCIATED_TOKEN_PROGRAM_ID
 */
exports.ASSOCIATED_TOKEN_PROGRAM_ID = new solana_web3_mock_1.MockPublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
/**
 * Mock MINT_SIZE constant (82 bytes for mint account)
 */
exports.MINT_SIZE = 82;
/**
 * Mock AccountLayout size
 */
exports.ACCOUNT_SIZE = 165;
/**
 * Get minimum balance for rent-exempt mint
 */
async function getMinimumBalanceForRentExemptMint(connection) {
    return 1461600; // ~0.00146 SOL
}
/**
 * Get minimum balance for rent-exempt account
 */
async function getMinimumBalanceForRentExemptAccount(connection) {
    return 2039280; // ~0.00204 SOL
}
/**
 * Get or derive the associated token address
 */
async function getAssociatedTokenAddress(mint, owner, allowOwnerOffCurve, programId, associatedTokenProgramId) {
    // Return a deterministic mock address based on mint and owner
    const combined = mint.toString().slice(0, 10) + owner.toString().slice(0, 10);
    return new solana_web3_mock_1.MockPublicKey((0, test_helpers_1.generateMockSolanaAddress)());
}
/**
 * Get token account info
 */
async function getAccount(connection, address, commitment, programId) {
    // Return mock account with balance
    return {
        mint: new solana_web3_mock_1.MockPublicKey((0, test_helpers_1.generateMockSolanaAddress)()),
        owner: new solana_web3_mock_1.MockPublicKey((0, test_helpers_1.generateMockSolanaAddress)()),
        amount: BigInt(1000000000), // 1 token with 9 decimals
        delegateOption: 0,
        delegate: null,
        state: 1, // Initialized
        isNativeOption: 0,
        isNative: BigInt(0),
        delegatedAmount: BigInt(0),
        closeAuthorityOption: 0,
        closeAuthority: null,
    };
}
/**
 * Get or create associated token account
 */
async function getOrCreateAssociatedTokenAccount(connection, payer, mint, owner, allowOwnerOffCurve, commitment, confirmOptions, programId, associatedTokenProgramId) {
    return getAccount(connection, await getAssociatedTokenAddress(mint, owner));
}
/**
 * Create initialize mint instruction
 */
function createInitializeMintInstruction(mint, decimals, mintAuthority, freezeAuthority, programId) {
    return {
        keys: [
            { pubkey: mint, isSigner: false, isWritable: true },
        ],
        programId: programId || exports.TOKEN_PROGRAM_ID,
        data: Buffer.alloc(67), // Initialize mint instruction data
    };
}
/**
 * Create initialize account instruction
 */
function createInitializeAccountInstruction(account, mint, owner, programId) {
    return {
        keys: [
            { pubkey: account, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: owner, isSigner: false, isWritable: false },
        ],
        programId: programId || exports.TOKEN_PROGRAM_ID,
        data: Buffer.alloc(1),
    };
}
/**
 * Create associated token account instruction
 */
function createAssociatedTokenAccountInstruction(payer, associatedToken, owner, mint, programId, associatedTokenProgramId) {
    return {
        keys: [
            { pubkey: payer, isSigner: true, isWritable: true },
            { pubkey: associatedToken, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: false, isWritable: false },
            { pubkey: mint, isSigner: false, isWritable: false },
        ],
        programId: associatedTokenProgramId || exports.ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.alloc(0),
    };
}
/**
 * Create mint to instruction
 */
function createMintToInstruction(mint, destination, authority, amount, multiSigners, programId) {
    return {
        keys: [
            { pubkey: mint, isSigner: false, isWritable: true },
            { pubkey: destination, isSigner: false, isWritable: true },
            { pubkey: authority, isSigner: true, isWritable: false },
        ],
        programId: programId || exports.TOKEN_PROGRAM_ID,
        data: Buffer.alloc(9), // MintTo instruction data
    };
}
/**
 * Create transfer instruction
 */
function createTransferInstruction(source, destination, owner, amount, multiSigners, programId) {
    return {
        keys: [
            { pubkey: source, isSigner: false, isWritable: true },
            { pubkey: destination, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: false },
        ],
        programId: programId || exports.TOKEN_PROGRAM_ID,
        data: Buffer.alloc(9), // Transfer instruction data
    };
}
/**
 * Create transfer checked instruction
 */
function createTransferCheckedInstruction(source, mint, destination, owner, amount, decimals, multiSigners, programId) {
    return {
        keys: [
            { pubkey: source, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: destination, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: false },
        ],
        programId: programId || exports.TOKEN_PROGRAM_ID,
        data: Buffer.alloc(10), // TransferChecked instruction data
    };
}
/**
 * Create burn instruction
 */
function createBurnInstruction(account, mint, owner, amount, multiSigners, programId) {
    return {
        keys: [
            { pubkey: account, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: false },
        ],
        programId: programId || exports.TOKEN_PROGRAM_ID,
        data: Buffer.alloc(9), // Burn instruction data
    };
}
/**
 * Create close account instruction
 */
function createCloseAccountInstruction(account, destination, authority, multiSigners, programId) {
    return {
        keys: [
            { pubkey: account, isSigner: false, isWritable: true },
            { pubkey: destination, isSigner: false, isWritable: true },
            { pubkey: authority, isSigner: true, isWritable: false },
        ],
        programId: programId || exports.TOKEN_PROGRAM_ID,
        data: Buffer.alloc(1), // CloseAccount instruction data
    };
}
/**
 * Create set authority instruction
 */
function createSetAuthorityInstruction(account, currentAuthority, authorityType, newAuthority, multiSigners, programId) {
    return {
        keys: [
            { pubkey: account, isSigner: false, isWritable: true },
            { pubkey: currentAuthority, isSigner: true, isWritable: false },
        ],
        programId: programId || exports.TOKEN_PROGRAM_ID,
        data: Buffer.alloc(35), // SetAuthority instruction data
    };
}
/**
 * Create approve instruction
 */
function createApproveInstruction(account, delegate, owner, amount, multiSigners, programId) {
    return {
        keys: [
            { pubkey: account, isSigner: false, isWritable: true },
            { pubkey: delegate, isSigner: false, isWritable: false },
            { pubkey: owner, isSigner: true, isWritable: false },
        ],
        programId: programId || exports.TOKEN_PROGRAM_ID,
        data: Buffer.alloc(9), // Approve instruction data
    };
}
/**
 * Create revoke instruction
 */
function createRevokeInstruction(account, owner, multiSigners, programId) {
    return {
        keys: [
            { pubkey: account, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: false },
        ],
        programId: programId || exports.TOKEN_PROGRAM_ID,
        data: Buffer.alloc(1), // Revoke instruction data
    };
}
/**
 * Mint tokens to an account
 */
async function mintTo(connection, payer, mint, destination, authority, amount, multiSigners, confirmOptions, programId) {
    return (0, test_helpers_1.generateMockSolanaAddress)().slice(0, 88);
}
/**
 * Transfer tokens between accounts
 */
async function transfer(connection, payer, source, destination, owner, amount, multiSigners, confirmOptions, programId) {
    return (0, test_helpers_1.generateMockSolanaAddress)().slice(0, 88);
}
/**
 * Create a new mint
 */
async function createMint(connection, payer, mintAuthority, freezeAuthority, decimals, keypair, confirmOptions, programId) {
    return new solana_web3_mock_1.MockPublicKey((0, test_helpers_1.generateMockSolanaAddress)());
}
/**
 * Export all mocks as if they were the real SPL Token SDK
 */
exports.default = {
    TOKEN_PROGRAM_ID: exports.TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID: exports.ASSOCIATED_TOKEN_PROGRAM_ID,
    MINT_SIZE: exports.MINT_SIZE,
    ACCOUNT_SIZE: exports.ACCOUNT_SIZE,
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
};
//# sourceMappingURL=spl-token.mock.js.map