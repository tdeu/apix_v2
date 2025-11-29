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

import { generateMockSolanaAddress, generateMockSolanaSignature } from '../utils/test-helpers'

/**
 * Mock PublicKey class
 *
 * Represents a Solana public key (32 bytes, base58 encoded).
 */
export class MockPublicKey {
  private _key: string

  constructor(key: string | Uint8Array | MockPublicKey) {
    if (key instanceof MockPublicKey) {
      this._key = key._key
    } else if (key instanceof Uint8Array) {
      this._key = generateMockSolanaAddress()
    } else {
      this._key = key
    }
  }

  toString(): string {
    return this._key
  }

  toBase58(): string {
    return this._key
  }

  toBuffer(): Buffer {
    return Buffer.from(this._key)
  }

  toBytes(): Uint8Array {
    return new Uint8Array(32).fill(1)
  }

  equals(other: MockPublicKey): boolean {
    return this._key === other._key
  }

  static default = new MockPublicKey('11111111111111111111111111111111')

  static findProgramAddressSync(
    seeds: Array<Buffer | Uint8Array>,
    programId: MockPublicKey
  ): [MockPublicKey, number] {
    return [new MockPublicKey(generateMockSolanaAddress()), 255]
  }

  static createWithSeed(
    fromPublicKey: MockPublicKey,
    seed: string,
    programId: MockPublicKey
  ): MockPublicKey {
    return new MockPublicKey(generateMockSolanaAddress())
  }

  static isOnCurve(_pubkeyData: Uint8Array): boolean {
    return true
  }
}

/**
 * Mock Keypair class
 *
 * Represents a Solana keypair (public + secret key).
 */
export class MockKeypair {
  public publicKey: MockPublicKey
  public secretKey: Uint8Array

  constructor() {
    this.publicKey = new MockPublicKey(generateMockSolanaAddress())
    this.secretKey = new Uint8Array(64).fill(1)
  }

  static generate(): MockKeypair {
    return new MockKeypair()
  }

  static fromSecretKey(secretKey: Uint8Array): MockKeypair {
    return new MockKeypair()
  }

  static fromSeed(seed: Uint8Array): MockKeypair {
    return new MockKeypair()
  }
}

/**
 * Mock Connection class
 *
 * The main connection to a Solana cluster.
 */
export class MockConnection {
  public rpcEndpoint: string
  public commitment: string

  constructor(endpoint: string, commitment: string = 'confirmed') {
    this.rpcEndpoint = endpoint
    this.commitment = commitment
  }

  async getBalance(publicKey: MockPublicKey): Promise<number> {
    // Return mock balance of 1 SOL in lamports
    return 1000000000
  }

  async getLatestBlockhash(): Promise<{
    blockhash: string
    lastValidBlockHeight: number
  }> {
    return {
      blockhash: 'mock-blockhash-' + Date.now().toString(36),
      lastValidBlockHeight: 123456789,
    }
  }

  async getRecentBlockhash(): Promise<{
    blockhash: string
    feeCalculator: { lamportsPerSignature: number }
  }> {
    return {
      blockhash: 'mock-blockhash-' + Date.now().toString(36),
      feeCalculator: { lamportsPerSignature: 5000 },
    }
  }

  async getMinimumBalanceForRentExemption(dataLength: number): Promise<number> {
    // Simplified rent calculation
    return Math.max(890880, dataLength * 6960 + 890880)
  }

  async getAccountInfo(
    publicKey: MockPublicKey
  ): Promise<MockAccountInfo | null> {
    return new MockAccountInfo()
  }

  async getProgramAccounts(
    programId: MockPublicKey,
    _config?: any
  ): Promise<Array<{ pubkey: MockPublicKey; account: MockAccountInfo }>> {
    return []
  }

  async getTokenAccountBalance(
    tokenAccount: MockPublicKey
  ): Promise<{ value: { amount: string; decimals: number; uiAmount: number } }> {
    return {
      value: {
        amount: '1000000000',
        decimals: 9,
        uiAmount: 1.0,
      },
    }
  }

  async getTokenAccountsByOwner(
    owner: MockPublicKey,
    filter: { mint?: MockPublicKey; programId?: MockPublicKey }
  ): Promise<{ value: Array<{ pubkey: MockPublicKey; account: MockAccountInfo }> }> {
    return { value: [] }
  }

  async sendTransaction(
    transaction: MockTransaction,
    signers: MockKeypair[],
    _options?: any
  ): Promise<string> {
    return generateMockSolanaSignature()
  }

  async sendRawTransaction(
    rawTransaction: Buffer | Uint8Array,
    _options?: any
  ): Promise<string> {
    return generateMockSolanaSignature()
  }

  async confirmTransaction(
    signature: string,
    _commitment?: string
  ): Promise<{ value: { err: null | any } }> {
    return { value: { err: null } }
  }

  async getSignatureStatus(
    signature: string
  ): Promise<{ value: MockSignatureStatus | null }> {
    return {
      value: new MockSignatureStatus(),
    }
  }

  async getSignatureStatuses(
    signatures: string[]
  ): Promise<{ value: Array<MockSignatureStatus | null> }> {
    return {
      value: signatures.map(() => new MockSignatureStatus()),
    }
  }

  async getTransaction(
    signature: string,
    _options?: any
  ): Promise<MockTransactionResponse | null> {
    return new MockTransactionResponse(signature)
  }

  async getSlot(): Promise<number> {
    return 123456789
  }

  async getRecentPerformanceSamples(
    _limit?: number
  ): Promise<Array<{ numTransactions: number; samplePeriodSecs: number }>> {
    return [
      { numTransactions: 3000, samplePeriodSecs: 60 },
    ]
  }

  async getRecentPrioritizationFees(
    _accounts?: MockPublicKey[]
  ): Promise<Array<{ slot: number; prioritizationFee: number }>> {
    return [
      { slot: 123456789, prioritizationFee: 1000 },
    ]
  }
}

/**
 * Mock AccountInfo
 */
export class MockAccountInfo {
  public data: Buffer
  public executable: boolean
  public lamports: number
  public owner: MockPublicKey
  public rentEpoch: number

  constructor() {
    this.data = Buffer.alloc(0)
    this.executable = false
    this.lamports = 1000000000
    this.owner = new MockPublicKey('11111111111111111111111111111111')
    this.rentEpoch = 0
  }
}

/**
 * Mock SignatureStatus
 */
export class MockSignatureStatus {
  public slot: number
  public confirmations: number | null
  public err: null | any
  public confirmationStatus: 'processed' | 'confirmed' | 'finalized'

  constructor() {
    this.slot = 123456789
    this.confirmations = 32
    this.err = null
    this.confirmationStatus = 'finalized'
  }
}

/**
 * Mock TransactionResponse
 */
export class MockTransactionResponse {
  public signature: string
  public slot: number
  public blockTime: number | null
  public meta: {
    err: null | any
    fee: number
    preBalances: number[]
    postBalances: number[]
  }

  constructor(signature?: string) {
    this.signature = signature || generateMockSolanaSignature()
    this.slot = 123456789
    this.blockTime = Math.floor(Date.now() / 1000)
    this.meta = {
      err: null,
      fee: 5000,
      preBalances: [1000000000],
      postBalances: [999995000],
    }
  }
}

/**
 * Mock Transaction class
 */
export class MockTransaction {
  public recentBlockhash: string = ''
  public feePayer: MockPublicKey | null = null
  public instructions: MockTransactionInstruction[] = []
  public signatures: Array<{ publicKey: MockPublicKey; signature: Buffer | null }> = []

  add(...instructions: MockTransactionInstruction[]): this {
    this.instructions.push(...instructions)
    return this
  }

  sign(...signers: MockKeypair[]): void {
    for (const signer of signers) {
      this.signatures.push({
        publicKey: signer.publicKey,
        signature: Buffer.alloc(64).fill(1),
      })
    }
  }

  serialize(): Buffer {
    return Buffer.alloc(256).fill(1)
  }

  static from(_buffer: Buffer | Uint8Array): MockTransaction {
    return new MockTransaction()
  }
}

/**
 * Mock VersionedTransaction
 */
export class MockVersionedTransaction {
  public message: MockTransactionMessage
  public signatures: Uint8Array[]

  constructor(message: MockTransactionMessage) {
    this.message = message
    this.signatures = []
  }

  sign(signers: MockKeypair[]): void {
    this.signatures = signers.map(() => new Uint8Array(64).fill(1))
  }

  serialize(): Uint8Array {
    return new Uint8Array(256).fill(1)
  }
}

/**
 * Mock TransactionMessage
 */
export class MockTransactionMessage {
  public payerKey: MockPublicKey
  public recentBlockhash: string
  public instructions: MockTransactionInstruction[]

  constructor() {
    this.payerKey = new MockPublicKey(generateMockSolanaAddress())
    this.recentBlockhash = 'mock-blockhash'
    this.instructions = []
  }

  static compile(args: {
    payerKey: MockPublicKey
    recentBlockhash: string
    instructions: MockTransactionInstruction[]
  }): MockTransactionMessage {
    const message = new MockTransactionMessage()
    message.payerKey = args.payerKey
    message.recentBlockhash = args.recentBlockhash
    message.instructions = args.instructions
    return message
  }
}

/**
 * Mock TransactionInstruction
 */
export class MockTransactionInstruction {
  public keys: Array<{
    pubkey: MockPublicKey
    isSigner: boolean
    isWritable: boolean
  }>
  public programId: MockPublicKey
  public data: Buffer

  constructor(config: {
    keys: Array<{ pubkey: MockPublicKey; isSigner: boolean; isWritable: boolean }>
    programId: MockPublicKey
    data?: Buffer
  }) {
    this.keys = config.keys
    this.programId = config.programId
    this.data = config.data || Buffer.alloc(0)
  }
}

/**
 * Mock SystemProgram
 */
export const MockSystemProgram = {
  programId: new MockPublicKey('11111111111111111111111111111111'),

  createAccount(params: {
    fromPubkey: MockPublicKey
    newAccountPubkey: MockPublicKey
    lamports: number
    space: number
    programId: MockPublicKey
  }): MockTransactionInstruction {
    return new MockTransactionInstruction({
      keys: [
        { pubkey: params.fromPubkey, isSigner: true, isWritable: true },
        { pubkey: params.newAccountPubkey, isSigner: true, isWritable: true },
      ],
      programId: this.programId,
    })
  },

  transfer(params: {
    fromPubkey: MockPublicKey
    toPubkey: MockPublicKey
    lamports: number
  }): MockTransactionInstruction {
    return new MockTransactionInstruction({
      keys: [
        { pubkey: params.fromPubkey, isSigner: true, isWritable: true },
        { pubkey: params.toPubkey, isSigner: false, isWritable: true },
      ],
      programId: this.programId,
    })
  },

  createAccountWithSeed(params: {
    fromPubkey: MockPublicKey
    newAccountPubkey: MockPublicKey
    basePubkey: MockPublicKey
    seed: string
    lamports: number
    space: number
    programId: MockPublicKey
  }): MockTransactionInstruction {
    return new MockTransactionInstruction({
      keys: [
        { pubkey: params.fromPubkey, isSigner: true, isWritable: true },
        { pubkey: params.newAccountPubkey, isSigner: false, isWritable: true },
      ],
      programId: this.programId,
    })
  },
}

/**
 * Mock Token Program ID
 */
export const TOKEN_PROGRAM_ID = new MockPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
export const ASSOCIATED_TOKEN_PROGRAM_ID = new MockPublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

/**
 * LAMPORTS_PER_SOL constant
 */
export const LAMPORTS_PER_SOL = 1000000000

/**
 * Cluster URL helpers
 */
export function clusterApiUrl(cluster: 'devnet' | 'testnet' | 'mainnet-beta'): string {
  const urls: Record<string, string> = {
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com',
    'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  }
  return urls[cluster] || urls.devnet
}

/**
 * Export all mocks as if they were the real Solana SDK
 */
export default {
  PublicKey: MockPublicKey,
  Keypair: MockKeypair,
  Connection: MockConnection,
  Transaction: MockTransaction,
  VersionedTransaction: MockVersionedTransaction,
  TransactionMessage: MockTransactionMessage,
  TransactionInstruction: MockTransactionInstruction,
  SystemProgram: MockSystemProgram,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
}
