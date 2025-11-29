/**
 * Mock Hedera SDK for Testing
 *
 * WHY DO WE NEED MOCKS?
 * =====================
 * When testing, we don't want to:
 * 1. Actually connect to the blockchain (slow, costs money, unreliable)
 * 2. Need real credentials
 * 3. Wait for real transactions
 *
 * Instead, we create "mock" versions that pretend to be the real thing
 * but are fast, free, and predictable.
 *
 * WHAT IS A MOCK?
 * ===============
 * A mock is a fake version of a real object that:
 * - Has the same methods as the real thing
 * - Returns predictable test data
 * - Lets us verify methods were called correctly
 * - Works instantly (no network calls)
 *
 * HOW TO USE THIS MOCK:
 * ====================
 * In your test file, import and use these mocks:
 *
 * ```typescript
 * import { mockClient, mockAccountId } from '@test-utils/mocks/hedera-sdk.mock'
 * ```
 */

import { generateMockAccountId, generateMockTokenId, generateMockTransactionId } from '../utils/test-helpers'

/**
 * Mock AccountId class
 *
 * The real AccountId class parses and validates Hedera account IDs.
 * Our mock just stores the string and provides the same interface.
 */
export class MockAccountId {
  constructor(public accountId: string) {}

  toString(): string {
    return this.accountId
  }

  static fromString(id: string): MockAccountId {
    return new MockAccountId(id)
  }
}

/**
 * Mock PrivateKey class
 *
 * The real PrivateKey handles cryptographic keys.
 * Our mock just stores the key string.
 */
export class MockPrivateKey {
  constructor(public key: string) {}

  get publicKey(): MockPublicKey {
    return new MockPublicKey(`public-${this.key}`)
  }

  toString(): string {
    return this.key
  }

  static fromString(key: string): MockPrivateKey {
    return new MockPrivateKey(key)
  }
}

/**
 * Mock PublicKey class
 */
export class MockPublicKey {
  constructor(public key: string) {}

  toString(): string {
    return this.key
  }
}

/**
 * Mock TokenId class
 */
export class MockTokenId {
  constructor(public tokenId: string) {}

  toString(): string {
    return this.tokenId
  }

  static fromString(id: string): MockTokenId {
    return new MockTokenId(id)
  }
}

/**
 * Mock TopicId class
 */
export class MockTopicId {
  constructor(public topicId: string) {}

  toString(): string {
    return this.topicId
  }

  static fromString(id: string): MockTopicId {
    return new MockTopicId(id)
  }
}

/**
 * Mock TransactionId class
 */
export class MockTransactionId {
  constructor(public txId: string) {}

  toString(): string {
    return this.txId
  }

  static fromString(id: string): MockTransactionId {
    return new MockTransactionId(id)
  }
}

/**
 * Mock Hbar class (Hedera's native cryptocurrency)
 *
 * The real Hbar class handles currency amounts and conversions.
 * Our mock stores amounts and provides basic math.
 */
export class MockHbar {
  constructor(public amount: number) {}

  toTinybars() {
    return {
      toString: () => (this.amount * 100000000).toString(),
    }
  }

  static from(amount: number): MockHbar {
    return new MockHbar(amount)
  }

  static fromTinybars(tinybars: number): MockHbar {
    return new MockHbar(tinybars / 100000000)
  }
}

/**
 * Mock Status enum
 *
 * Hedera transactions return status codes.
 */
export const MockStatus = {
  Success: 'SUCCESS',
  Unknown: 'UNKNOWN',
  Failed: 'FAILED',
}

/**
 * Mock TransactionReceipt
 *
 * After a transaction executes, you get a receipt with the results.
 */
export class MockTransactionReceipt {
  constructor(
    public tokenId: MockTokenId | null = null,
    public contractId: MockAccountId | null = null,
    public topicId: MockTopicId | null = null,
    public status: string = MockStatus.Success
  ) {}
}

/**
 * Mock TransactionResponse
 *
 * When you execute a transaction, you get a response object.
 */
export class MockTransactionResponse {
  public transactionId: MockTransactionId

  constructor(txId?: string) {
    this.transactionId = new MockTransactionId(txId || generateMockTransactionId())
  }

  async getReceipt(_client: any): Promise<MockTransactionReceipt> {
    // Simulate successful token creation
    return new MockTransactionReceipt(
      new MockTokenId(generateMockTokenId()),
      null,
      null,
      MockStatus.Success
    )
  }

  async getRecord(_client: any): Promise<any> {
    return {
      transactionId: this.transactionId,
      receipt: await this.getReceipt(_client),
    }
  }
}

/**
 * Mock AccountBalance
 *
 * Contains account balance information.
 */
export class MockAccountBalance {
  public hbars: MockHbar
  public tokens: Map<MockTokenId, any>

  constructor(hbarAmount = 100) {
    this.hbars = new MockHbar(hbarAmount)
    this.tokens = new Map()
  }
}

/**
 * Mock Transaction Classes
 *
 * These are the main transaction types we use.
 * Each has a fluent interface (methods that return 'this' for chaining).
 */

export class MockTokenCreateTransaction {
  private _tokenName = ''
  private _tokenSymbol = ''
  private _decimals = 8
  private _initialSupply = 0

  setTokenName(name: string): this {
    this._tokenName = name
    return this
  }

  setTokenSymbol(symbol: string): this {
    this._tokenSymbol = symbol
    return this
  }

  setDecimals(decimals: number): this {
    this._decimals = decimals
    return this
  }

  setInitialSupply(supply: number): this {
    this._initialSupply = supply
    return this
  }

  setTreasuryAccountId(_accountId: any): this {
    return this
  }

  setTokenType(_type: any): this {
    return this
  }

  setSupplyType(_type: any): this {
    return this
  }

  setAdminKey(_key: any): this {
    return this
  }

  setSupplyKey(_key: any): this {
    return this
  }

  setFreezeKey(_key: any): this {
    return this
  }

  setWipeKey(_key: any): this {
    return this
  }

  setFreezeDefault(_freeze: boolean): this {
    return this
  }

  setMaxTransactionFee(_fee: MockHbar): this {
    return this
  }

  async execute(_client: any): Promise<MockTransactionResponse> {
    // Simulate transaction execution
    return new MockTransactionResponse()
  }
}

export class MockTransferTransaction {
  addTokenTransfer(_tokenId: any, _accountId: any, _amount: number): this {
    return this
  }

  addNftTransfer(_tokenId: any, _serialNumber: number, _from: any, _to: any): this {
    return this
  }

  addHbarTransfer(_accountId: any, _amount: MockHbar): this {
    return this
  }

  setMaxTransactionFee(_fee: MockHbar): this {
    return this
  }

  async execute(_client: any): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }
}

export class MockTokenMintTransaction {
  setTokenId(_tokenId: any): this {
    return this
  }

  setMetadata(_metadata: Buffer[]): this {
    return this
  }

  setAmount(_amount: number): this {
    return this
  }

  setMaxTransactionFee(_fee: MockHbar): this {
    return this
  }

  async execute(_client: any): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }
}

export class MockFileCreateTransaction {
  setContents(_contents: string | Buffer): this {
    return this
  }

  setKeys(_keys: any[]): this {
    return this
  }

  setMaxTransactionFee(_fee: MockHbar): this {
    return this
  }

  async execute(_client: any): Promise<MockTransactionResponse> {
    const response = new MockTransactionResponse()
    // Add fileId to receipt
    ;(response as any).fileId = new MockAccountId(generateMockAccountId())
    return response
  }
}

export class MockContractCreateTransaction {
  setBytecodeFileId(_fileId: any): this {
    return this
  }

  setGas(_gas: number): this {
    return this
  }

  setInitialBalance(_balance: MockHbar): this {
    return this
  }

  setMaxTransactionFee(_fee: MockHbar): this {
    return this
  }

  async execute(_client: any): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }
}

export class MockContractExecuteTransaction {
  setContractId(_contractId: string): this {
    return this
  }

  setGas(_gas: number): this {
    return this
  }

  setPayableAmount(_amount: MockHbar): this {
    return this
  }

  setMaxTransactionFee(_fee: MockHbar): this {
    return this
  }

  async execute(_client: any): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }
}

export class MockTopicCreateTransaction {
  setTopicMemo(_memo: string): this {
    return this
  }

  setAdminKey(_key: any): this {
    return this
  }

  setSubmitKey(_key: any): this {
    return this
  }

  setAutoRenewPeriod(_period: number): this {
    return this
  }

  setMaxTransactionFee(_fee: MockHbar): this {
    return this
  }

  async execute(_client: any): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }
}

export class MockTopicMessageSubmitTransaction {
  setTopicId(_topicId: any): this {
    return this
  }

  setMessage(_message: string): this {
    return this
  }

  setMaxTransactionFee(_fee: MockHbar): this {
    return this
  }

  async execute(_client: any): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }
}

/**
 * Mock Query Classes
 */

export class MockAccountBalanceQuery {
  private _accountId: MockAccountId | null = null

  setAccountId(accountId: MockAccountId): this {
    this._accountId = accountId
    return this
  }

  async execute(_client: any): Promise<MockAccountBalance> {
    return new MockAccountBalance(100) // 100 HBAR
  }
}

export class MockTransactionReceiptQuery {
  setTransactionId(_txId: any): this {
    return this
  }

  async execute(_client: any): Promise<MockTransactionReceipt> {
    return new MockTransactionReceipt()
  }
}

/**
 * Mock Client
 *
 * The Client is the main connection to the Hedera network.
 * Our mock pretends to connect but doesn't actually do anything.
 */
export class MockClient {
  public operatorAccountId: MockAccountId | null = null
  public operatorPrivateKey: MockPrivateKey | null = null

  static forTestnet(): MockClient {
    return new MockClient()
  }

  static forMainnet(): MockClient {
    return new MockClient()
  }

  setOperator(accountId: MockAccountId, privateKey: MockPrivateKey): void {
    this.operatorAccountId = accountId
    this.operatorPrivateKey = privateKey
  }

  close(): void {
    // Mock close - does nothing
  }
}

/**
 * Mock Token and Contract Types
 */
export const MockTokenType = {
  FungibleCommon: 'FUNGIBLE_COMMON',
  NonFungibleUnique: 'NON_FUNGIBLE_UNIQUE',
}

export const MockTokenSupplyType = {
  Infinite: 'INFINITE',
  Finite: 'FINITE',
}

/**
 * Export all mocks as if they were the real Hedera SDK
 *
 * This allows us to replace imports in tests like:
 * jest.mock('@hashgraph/sdk', () => require('@test-utils/mocks/hedera-sdk.mock'))
 */
export default {
  Client: MockClient,
  AccountId: MockAccountId,
  PrivateKey: MockPrivateKey,
  TokenId: MockTokenId,
  TopicId: MockTopicId,
  TransactionId: MockTransactionId,
  Hbar: MockHbar,
  Status: MockStatus,
  TokenType: MockTokenType,
  TokenSupplyType: MockTokenSupplyType,
  TokenCreateTransaction: MockTokenCreateTransaction,
  TransferTransaction: MockTransferTransaction,
  TokenMintTransaction: MockTokenMintTransaction,
  FileCreateTransaction: MockFileCreateTransaction,
  ContractCreateTransaction: MockContractCreateTransaction,
  ContractExecuteTransaction: MockContractExecuteTransaction,
  TopicCreateTransaction: MockTopicCreateTransaction,
  TopicMessageSubmitTransaction: MockTopicMessageSubmitTransaction,
  AccountBalanceQuery: MockAccountBalanceQuery,
  TransactionReceiptQuery: MockTransactionReceiptQuery,
}
