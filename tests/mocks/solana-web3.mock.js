"use strict";
/**
 * Mock Solana Web3.js SDK for Testing
 *
 * WHY DO WE NEED MOCKS?
 * =====================
 * When testing, we don't want to:
 * 1. Actually connect to Solana network (slow, costs SOL, unreliable)
 * 2. Need real private keys
 * 3. Wait for real transactions to confirm
 *
 * Instead, we create "mock" versions that pretend to be the real thing
 * but are fast, free, and predictable.
 *
 * HOW TO USE THIS MOCK:
 * ====================
 * In your test file, import and use these mocks:
 *
 * ```typescript
 * jest.mock('@solana/web3.js', () => require('@test-utils/mocks/solana-web3.mock'))
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LAMPORTS_PER_SOL = exports.ASSOCIATED_TOKEN_PROGRAM_ID = exports.TOKEN_PROGRAM_ID = exports.MockSystemProgram = exports.MockTransactionInstruction = exports.MockTransactionMessage = exports.MockVersionedTransaction = exports.MockTransaction = exports.MockTransactionResponse = exports.MockSignatureStatus = exports.MockAccountInfo = exports.MockConnection = exports.MockKeypair = exports.MockPublicKey = void 0;
exports.clusterApiUrl = clusterApiUrl;
const test_helpers_1 = require("../utils/test-helpers");
/**
 * Mock PublicKey class
 *
 * Represents a Solana public key (32 bytes, base58 encoded).
 */
class MockPublicKey {
    constructor(key) {
        if (key instanceof MockPublicKey) {
            this._key = key._key;
        }
        else if (key instanceof Uint8Array) {
            this._key = (0, test_helpers_1.generateMockSolanaAddress)();
        }
        else {
            this._key = key;
        }
    }
    toString() {
        return this._key;
    }
    toBase58() {
        return this._key;
    }
    toBuffer() {
        return Buffer.from(this._key);
    }
    toBytes() {
        return new Uint8Array(32).fill(1);
    }
    equals(other) {
        return this._key === other._key;
    }
    static findProgramAddressSync(seeds, programId) {
        return [new MockPublicKey((0, test_helpers_1.generateMockSolanaAddress)()), 255];
    }
    static createWithSeed(fromPublicKey, seed, programId) {
        return new MockPublicKey((0, test_helpers_1.generateMockSolanaAddress)());
    }
    static isOnCurve(_pubkeyData) {
        return true;
    }
}
exports.MockPublicKey = MockPublicKey;
MockPublicKey.default = new MockPublicKey('11111111111111111111111111111111');
/**
 * Mock Keypair class
 *
 * Represents a Solana keypair (public + secret key).
 */
class MockKeypair {
    constructor() {
        this.publicKey = new MockPublicKey((0, test_helpers_1.generateMockSolanaAddress)());
        this.secretKey = new Uint8Array(64).fill(1);
    }
    static generate() {
        return new MockKeypair();
    }
    static fromSecretKey(secretKey) {
        return new MockKeypair();
    }
    static fromSeed(seed) {
        return new MockKeypair();
    }
}
exports.MockKeypair = MockKeypair;
/**
 * Mock Connection class
 *
 * The main connection to a Solana cluster.
 */
class MockConnection {
    constructor(endpoint, commitment = 'confirmed') {
        this.rpcEndpoint = endpoint;
        this.commitment = commitment;
    }
    async getBalance(publicKey) {
        // Return mock balance of 1 SOL in lamports
        return 1000000000;
    }
    async getLatestBlockhash() {
        return {
            blockhash: 'mock-blockhash-' + Date.now().toString(36),
            lastValidBlockHeight: 123456789,
        };
    }
    async getRecentBlockhash() {
        return {
            blockhash: 'mock-blockhash-' + Date.now().toString(36),
            feeCalculator: { lamportsPerSignature: 5000 },
        };
    }
    async getMinimumBalanceForRentExemption(dataLength) {
        // Simplified rent calculation
        return Math.max(890880, dataLength * 6960 + 890880);
    }
    async getAccountInfo(publicKey) {
        return new MockAccountInfo();
    }
    async getProgramAccounts(programId, _config) {
        return [];
    }
    async getTokenAccountBalance(tokenAccount) {
        return {
            value: {
                amount: '1000000000',
                decimals: 9,
                uiAmount: 1.0,
            },
        };
    }
    async getTokenAccountsByOwner(owner, filter) {
        return { value: [] };
    }
    async sendTransaction(transaction, signers, _options) {
        return (0, test_helpers_1.generateMockSolanaSignature)();
    }
    async sendRawTransaction(rawTransaction, _options) {
        return (0, test_helpers_1.generateMockSolanaSignature)();
    }
    async confirmTransaction(signature, _commitment) {
        return { value: { err: null } };
    }
    async getSignatureStatus(signature) {
        return {
            value: new MockSignatureStatus(),
        };
    }
    async getSignatureStatuses(signatures) {
        return {
            value: signatures.map(() => new MockSignatureStatus()),
        };
    }
    async getTransaction(signature, _options) {
        return new MockTransactionResponse(signature);
    }
    async getSlot() {
        return 123456789;
    }
    async getRecentPerformanceSamples(_limit) {
        return [
            { numTransactions: 3000, samplePeriodSecs: 60 },
        ];
    }
    async getRecentPrioritizationFees(_accounts) {
        return [
            { slot: 123456789, prioritizationFee: 1000 },
        ];
    }
}
exports.MockConnection = MockConnection;
/**
 * Mock AccountInfo
 */
class MockAccountInfo {
    constructor() {
        this.data = Buffer.alloc(0);
        this.executable = false;
        this.lamports = 1000000000;
        this.owner = new MockPublicKey('11111111111111111111111111111111');
        this.rentEpoch = 0;
    }
}
exports.MockAccountInfo = MockAccountInfo;
/**
 * Mock SignatureStatus
 */
class MockSignatureStatus {
    constructor() {
        this.slot = 123456789;
        this.confirmations = 32;
        this.err = null;
        this.confirmationStatus = 'finalized';
    }
}
exports.MockSignatureStatus = MockSignatureStatus;
/**
 * Mock TransactionResponse
 */
class MockTransactionResponse {
    constructor(signature) {
        this.signature = signature || (0, test_helpers_1.generateMockSolanaSignature)();
        this.slot = 123456789;
        this.blockTime = Math.floor(Date.now() / 1000);
        this.meta = {
            err: null,
            fee: 5000,
            preBalances: [1000000000],
            postBalances: [999995000],
        };
    }
}
exports.MockTransactionResponse = MockTransactionResponse;
/**
 * Mock Transaction class
 */
class MockTransaction {
    constructor() {
        this.recentBlockhash = '';
        this.feePayer = null;
        this.instructions = [];
        this.signatures = [];
    }
    add(...instructions) {
        this.instructions.push(...instructions);
        return this;
    }
    sign(...signers) {
        for (const signer of signers) {
            this.signatures.push({
                publicKey: signer.publicKey,
                signature: Buffer.alloc(64).fill(1),
            });
        }
    }
    serialize() {
        return Buffer.alloc(256).fill(1);
    }
    static from(_buffer) {
        return new MockTransaction();
    }
}
exports.MockTransaction = MockTransaction;
/**
 * Mock VersionedTransaction
 */
class MockVersionedTransaction {
    constructor(message) {
        this.message = message;
        this.signatures = [];
    }
    sign(signers) {
        this.signatures = signers.map(() => new Uint8Array(64).fill(1));
    }
    serialize() {
        return new Uint8Array(256).fill(1);
    }
}
exports.MockVersionedTransaction = MockVersionedTransaction;
/**
 * Mock TransactionMessage
 */
class MockTransactionMessage {
    constructor() {
        this.payerKey = new MockPublicKey((0, test_helpers_1.generateMockSolanaAddress)());
        this.recentBlockhash = 'mock-blockhash';
        this.instructions = [];
    }
    static compile(args) {
        const message = new MockTransactionMessage();
        message.payerKey = args.payerKey;
        message.recentBlockhash = args.recentBlockhash;
        message.instructions = args.instructions;
        return message;
    }
}
exports.MockTransactionMessage = MockTransactionMessage;
/**
 * Mock TransactionInstruction
 */
class MockTransactionInstruction {
    constructor(config) {
        this.keys = config.keys;
        this.programId = config.programId;
        this.data = config.data || Buffer.alloc(0);
    }
}
exports.MockTransactionInstruction = MockTransactionInstruction;
/**
 * Mock SystemProgram
 */
exports.MockSystemProgram = {
    programId: new MockPublicKey('11111111111111111111111111111111'),
    createAccount(params) {
        return new MockTransactionInstruction({
            keys: [
                { pubkey: params.fromPubkey, isSigner: true, isWritable: true },
                { pubkey: params.newAccountPubkey, isSigner: true, isWritable: true },
            ],
            programId: this.programId,
        });
    },
    transfer(params) {
        return new MockTransactionInstruction({
            keys: [
                { pubkey: params.fromPubkey, isSigner: true, isWritable: true },
                { pubkey: params.toPubkey, isSigner: false, isWritable: true },
            ],
            programId: this.programId,
        });
    },
    createAccountWithSeed(params) {
        return new MockTransactionInstruction({
            keys: [
                { pubkey: params.fromPubkey, isSigner: true, isWritable: true },
                { pubkey: params.newAccountPubkey, isSigner: false, isWritable: true },
            ],
            programId: this.programId,
        });
    },
};
/**
 * Mock Token Program ID
 */
exports.TOKEN_PROGRAM_ID = new MockPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
exports.ASSOCIATED_TOKEN_PROGRAM_ID = new MockPublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
/**
 * LAMPORTS_PER_SOL constant
 */
exports.LAMPORTS_PER_SOL = 1000000000;
/**
 * Cluster URL helpers
 */
function clusterApiUrl(cluster) {
    const urls = {
        devnet: 'https://api.devnet.solana.com',
        testnet: 'https://api.testnet.solana.com',
        'mainnet-beta': 'https://api.mainnet-beta.solana.com',
    };
    return urls[cluster] || urls.devnet;
}
/**
 * Export all mocks as if they were the real Solana SDK
 */
exports.default = {
    PublicKey: MockPublicKey,
    Keypair: MockKeypair,
    Connection: MockConnection,
    Transaction: MockTransaction,
    VersionedTransaction: MockVersionedTransaction,
    TransactionMessage: MockTransactionMessage,
    TransactionInstruction: MockTransactionInstruction,
    SystemProgram: exports.MockSystemProgram,
    TOKEN_PROGRAM_ID: exports.TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID: exports.ASSOCIATED_TOKEN_PROGRAM_ID,
    LAMPORTS_PER_SOL: exports.LAMPORTS_PER_SOL,
    clusterApiUrl,
};
//# sourceMappingURL=solana-web3.mock.js.map