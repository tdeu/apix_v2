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
/**
 * Mock PublicKey class
 *
 * Represents a Solana public key (32 bytes, base58 encoded).
 */
export declare class MockPublicKey {
    private _key;
    constructor(key: string | Uint8Array | MockPublicKey);
    toString(): string;
    toBase58(): string;
    toBuffer(): Buffer;
    toBytes(): Uint8Array;
    equals(other: MockPublicKey): boolean;
    static default: MockPublicKey;
    static findProgramAddressSync(seeds: Array<Buffer | Uint8Array>, programId: MockPublicKey): [MockPublicKey, number];
    static createWithSeed(fromPublicKey: MockPublicKey, seed: string, programId: MockPublicKey): MockPublicKey;
    static isOnCurve(_pubkeyData: Uint8Array): boolean;
}
/**
 * Mock Keypair class
 *
 * Represents a Solana keypair (public + secret key).
 */
export declare class MockKeypair {
    publicKey: MockPublicKey;
    secretKey: Uint8Array;
    constructor();
    static generate(): MockKeypair;
    static fromSecretKey(secretKey: Uint8Array): MockKeypair;
    static fromSeed(seed: Uint8Array): MockKeypair;
}
/**
 * Mock Connection class
 *
 * The main connection to a Solana cluster.
 */
export declare class MockConnection {
    rpcEndpoint: string;
    commitment: string;
    constructor(endpoint: string, commitment?: string);
    getBalance(publicKey: MockPublicKey): Promise<number>;
    getLatestBlockhash(): Promise<{
        blockhash: string;
        lastValidBlockHeight: number;
    }>;
    getRecentBlockhash(): Promise<{
        blockhash: string;
        feeCalculator: {
            lamportsPerSignature: number;
        };
    }>;
    getMinimumBalanceForRentExemption(dataLength: number): Promise<number>;
    getAccountInfo(publicKey: MockPublicKey): Promise<MockAccountInfo | null>;
    getProgramAccounts(programId: MockPublicKey, _config?: any): Promise<Array<{
        pubkey: MockPublicKey;
        account: MockAccountInfo;
    }>>;
    getTokenAccountBalance(tokenAccount: MockPublicKey): Promise<{
        value: {
            amount: string;
            decimals: number;
            uiAmount: number;
        };
    }>;
    getTokenAccountsByOwner(owner: MockPublicKey, filter: {
        mint?: MockPublicKey;
        programId?: MockPublicKey;
    }): Promise<{
        value: Array<{
            pubkey: MockPublicKey;
            account: MockAccountInfo;
        }>;
    }>;
    sendTransaction(transaction: MockTransaction, signers: MockKeypair[], _options?: any): Promise<string>;
    sendRawTransaction(rawTransaction: Buffer | Uint8Array, _options?: any): Promise<string>;
    confirmTransaction(signature: string, _commitment?: string): Promise<{
        value: {
            err: null | any;
        };
    }>;
    getSignatureStatus(signature: string): Promise<{
        value: MockSignatureStatus | null;
    }>;
    getSignatureStatuses(signatures: string[]): Promise<{
        value: Array<MockSignatureStatus | null>;
    }>;
    getTransaction(signature: string, _options?: any): Promise<MockTransactionResponse | null>;
    getSlot(): Promise<number>;
    getRecentPerformanceSamples(_limit?: number): Promise<Array<{
        numTransactions: number;
        samplePeriodSecs: number;
    }>>;
    getRecentPrioritizationFees(_accounts?: MockPublicKey[]): Promise<Array<{
        slot: number;
        prioritizationFee: number;
    }>>;
}
/**
 * Mock AccountInfo
 */
export declare class MockAccountInfo {
    data: Buffer;
    executable: boolean;
    lamports: number;
    owner: MockPublicKey;
    rentEpoch: number;
    constructor();
}
/**
 * Mock SignatureStatus
 */
export declare class MockSignatureStatus {
    slot: number;
    confirmations: number | null;
    err: null | any;
    confirmationStatus: 'processed' | 'confirmed' | 'finalized';
    constructor();
}
/**
 * Mock TransactionResponse
 */
export declare class MockTransactionResponse {
    signature: string;
    slot: number;
    blockTime: number | null;
    meta: {
        err: null | any;
        fee: number;
        preBalances: number[];
        postBalances: number[];
    };
    constructor(signature?: string);
}
/**
 * Mock Transaction class
 */
export declare class MockTransaction {
    recentBlockhash: string;
    feePayer: MockPublicKey | null;
    instructions: MockTransactionInstruction[];
    signatures: Array<{
        publicKey: MockPublicKey;
        signature: Buffer | null;
    }>;
    add(...instructions: MockTransactionInstruction[]): this;
    sign(...signers: MockKeypair[]): void;
    serialize(): Buffer;
    static from(_buffer: Buffer | Uint8Array): MockTransaction;
}
/**
 * Mock VersionedTransaction
 */
export declare class MockVersionedTransaction {
    message: MockTransactionMessage;
    signatures: Uint8Array[];
    constructor(message: MockTransactionMessage);
    sign(signers: MockKeypair[]): void;
    serialize(): Uint8Array;
}
/**
 * Mock TransactionMessage
 */
export declare class MockTransactionMessage {
    payerKey: MockPublicKey;
    recentBlockhash: string;
    instructions: MockTransactionInstruction[];
    constructor();
    static compile(args: {
        payerKey: MockPublicKey;
        recentBlockhash: string;
        instructions: MockTransactionInstruction[];
    }): MockTransactionMessage;
}
/**
 * Mock TransactionInstruction
 */
export declare class MockTransactionInstruction {
    keys: Array<{
        pubkey: MockPublicKey;
        isSigner: boolean;
        isWritable: boolean;
    }>;
    programId: MockPublicKey;
    data: Buffer;
    constructor(config: {
        keys: Array<{
            pubkey: MockPublicKey;
            isSigner: boolean;
            isWritable: boolean;
        }>;
        programId: MockPublicKey;
        data?: Buffer;
    });
}
/**
 * Mock SystemProgram
 */
export declare const MockSystemProgram: {
    programId: MockPublicKey;
    createAccount(params: {
        fromPubkey: MockPublicKey;
        newAccountPubkey: MockPublicKey;
        lamports: number;
        space: number;
        programId: MockPublicKey;
    }): MockTransactionInstruction;
    transfer(params: {
        fromPubkey: MockPublicKey;
        toPubkey: MockPublicKey;
        lamports: number;
    }): MockTransactionInstruction;
    createAccountWithSeed(params: {
        fromPubkey: MockPublicKey;
        newAccountPubkey: MockPublicKey;
        basePubkey: MockPublicKey;
        seed: string;
        lamports: number;
        space: number;
        programId: MockPublicKey;
    }): MockTransactionInstruction;
};
/**
 * Mock Token Program ID
 */
export declare const TOKEN_PROGRAM_ID: MockPublicKey;
export declare const ASSOCIATED_TOKEN_PROGRAM_ID: MockPublicKey;
/**
 * LAMPORTS_PER_SOL constant
 */
export declare const LAMPORTS_PER_SOL = 1000000000;
/**
 * Cluster URL helpers
 */
export declare function clusterApiUrl(cluster: 'devnet' | 'testnet' | 'mainnet-beta'): string;
/**
 * Export all mocks as if they were the real Solana SDK
 */
declare const _default: {
    PublicKey: typeof MockPublicKey;
    Keypair: typeof MockKeypair;
    Connection: typeof MockConnection;
    Transaction: typeof MockTransaction;
    VersionedTransaction: typeof MockVersionedTransaction;
    TransactionMessage: typeof MockTransactionMessage;
    TransactionInstruction: typeof MockTransactionInstruction;
    SystemProgram: {
        programId: MockPublicKey;
        createAccount(params: {
            fromPubkey: MockPublicKey;
            newAccountPubkey: MockPublicKey;
            lamports: number;
            space: number;
            programId: MockPublicKey;
        }): MockTransactionInstruction;
        transfer(params: {
            fromPubkey: MockPublicKey;
            toPubkey: MockPublicKey;
            lamports: number;
        }): MockTransactionInstruction;
        createAccountWithSeed(params: {
            fromPubkey: MockPublicKey;
            newAccountPubkey: MockPublicKey;
            basePubkey: MockPublicKey;
            seed: string;
            lamports: number;
            space: number;
            programId: MockPublicKey;
        }): MockTransactionInstruction;
    };
    TOKEN_PROGRAM_ID: MockPublicKey;
    ASSOCIATED_TOKEN_PROGRAM_ID: MockPublicKey;
    LAMPORTS_PER_SOL: number;
    clusterApiUrl: typeof clusterApiUrl;
};
export default _default;
//# sourceMappingURL=solana-web3.mock.d.ts.map