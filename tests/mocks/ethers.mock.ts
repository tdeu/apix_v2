/**
 * Mock ethers.js v6 SDK for Testing
 *
 * WHY DO WE NEED MOCKS?
 * =====================
 * When testing, we don't want to:
 * 1. Actually connect to Ethereum network (slow, costs gas, unreliable)
 * 2. Need real private keys or API keys
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
 * jest.mock('ethers', () => require('@test-utils/mocks/ethers.mock'))
 * ```
 */

import { generateMockEthAddress, generateMockTxHash } from '../utils/test-helpers'

/**
 * Mock JsonRpcProvider
 *
 * The real JsonRpcProvider connects to an Ethereum node via JSON-RPC.
 * Our mock simulates network responses.
 */
export class MockJsonRpcProvider {
  private _network: { chainId: bigint; name: string }

  constructor(public url?: string) {
    // Determine network from URL
    if (url?.includes('sepolia')) {
      this._network = { chainId: BigInt(11155111), name: 'sepolia' }
    } else if (url?.includes('mainnet')) {
      this._network = { chainId: BigInt(1), name: 'mainnet' }
    } else if (url?.includes('base')) {
      this._network = { chainId: BigInt(84532), name: 'base-sepolia' }
    } else {
      this._network = { chainId: BigInt(11155111), name: 'sepolia' }
    }
  }

  async getNetwork(): Promise<{ chainId: bigint; name: string }> {
    return this._network
  }

  async getBalance(_address: string): Promise<bigint> {
    // Return mock balance of 1 ETH
    return BigInt('1000000000000000000')
  }

  async getFeeData(): Promise<MockFeeData> {
    return new MockFeeData()
  }

  async getTransactionReceipt(txHash: string): Promise<MockTransactionReceipt | null> {
    return new MockTransactionReceipt(txHash)
  }

  async getTransaction(txHash: string): Promise<MockTransactionResponse | null> {
    return new MockTransactionResponse(txHash)
  }

  async estimateGas(_tx: any): Promise<bigint> {
    // Return mock gas estimate of 21000 for simple transfer
    return BigInt(21000)
  }

  async getBlockNumber(): Promise<number> {
    return 12345678
  }

  async broadcastTransaction(_signedTx: string): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }

  destroy(): void {
    // Mock cleanup
  }
}

/**
 * Mock BrowserProvider (for wallet connections)
 */
export class MockBrowserProvider extends MockJsonRpcProvider {
  constructor(public ethereum?: any) {
    super()
  }

  async getSigner(): Promise<MockSigner> {
    return new MockSigner(this)
  }
}

/**
 * Mock Wallet class
 *
 * The real Wallet handles key management and signing.
 * Our mock stores the key and simulates signing.
 */
export class MockWallet {
  public address: string
  public provider: MockJsonRpcProvider | null = null

  constructor(privateKey?: string, provider?: MockJsonRpcProvider) {
    // Generate deterministic address from private key (simplified)
    this.address = generateMockEthAddress()
    this.provider = provider || null
  }

  connect(provider: MockJsonRpcProvider): MockWallet {
    const wallet = new MockWallet(undefined, provider)
    wallet.address = this.address
    return wallet
  }

  async getAddress(): Promise<string> {
    return this.address
  }

  async signTransaction(tx: any): Promise<string> {
    // Return mock signed transaction
    return '0x' + 'f'.repeat(130)
  }

  async signMessage(_message: string): Promise<string> {
    // Return mock signature
    return '0x' + 'a'.repeat(130)
  }

  async sendTransaction(tx: any): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }

  static fromPhrase(_mnemonic: string, _provider?: MockJsonRpcProvider): MockWallet {
    return new MockWallet()
  }

  static createRandom(): MockWallet {
    return new MockWallet()
  }
}

/**
 * Mock Signer (abstract signer interface)
 */
export class MockSigner {
  public address: string
  public provider: MockJsonRpcProvider

  constructor(provider: MockJsonRpcProvider) {
    this.address = generateMockEthAddress()
    this.provider = provider
  }

  async getAddress(): Promise<string> {
    return this.address
  }

  async signTransaction(tx: any): Promise<string> {
    return '0x' + 'f'.repeat(130)
  }

  async signMessage(_message: string): Promise<string> {
    return '0x' + 'a'.repeat(130)
  }

  async sendTransaction(tx: any): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }
}

/**
 * Mock Contract class
 *
 * The real Contract class interacts with deployed smart contracts.
 * Our mock simulates contract calls and transactions.
 */
export class MockContract {
  public target: string
  public interface: MockInterface
  private _signer: MockWallet | MockSigner | null
  private _provider: MockJsonRpcProvider | null

  constructor(
    address: string,
    _abi: any[],
    signerOrProvider?: MockWallet | MockSigner | MockJsonRpcProvider
  ) {
    this.target = address
    this.interface = new MockInterface(_abi)

    if (signerOrProvider instanceof MockWallet || signerOrProvider instanceof MockSigner) {
      this._signer = signerOrProvider
      this._provider = signerOrProvider.provider
    } else if (signerOrProvider instanceof MockJsonRpcProvider) {
      this._signer = null
      this._provider = signerOrProvider
    } else {
      this._signer = null
      this._provider = null
    }
  }

  connect(signer: MockWallet | MockSigner): MockContract {
    return new MockContract(this.target, [], signer)
  }

  async getAddress(): Promise<string> {
    return this.target
  }

  // Dynamic method calls (for contract functions)
  [key: string]: any

  // Generic call method for read operations
  async staticCall(_method: string, ..._args: any[]): Promise<any> {
    return '0x' + '0'.repeat(64)
  }

  // Simulate common ERC-20 methods
  async balanceOf(_address: string): Promise<bigint> {
    return BigInt('1000000000000000000') // 1 token
  }

  async totalSupply(): Promise<bigint> {
    return BigInt('1000000000000000000000000') // 1M tokens
  }

  async decimals(): Promise<number> {
    return 18
  }

  async name(): Promise<string> {
    return 'Mock Token'
  }

  async symbol(): Promise<string> {
    return 'MOCK'
  }

  async transfer(_to: string, _amount: bigint): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }

  async approve(_spender: string, _amount: bigint): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }

  // Simulate ERC-721 methods
  async ownerOf(_tokenId: bigint): Promise<string> {
    return generateMockEthAddress()
  }

  async tokenURI(_tokenId: bigint): Promise<string> {
    return 'https://example.com/token/1'
  }

  async safeMint(_to: string, _tokenId: bigint): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }

  async safeTransferFrom(_from: string, _to: string, _tokenId: bigint): Promise<MockTransactionResponse> {
    return new MockTransactionResponse()
  }
}

/**
 * Mock ContractFactory
 *
 * Used to deploy new contracts.
 */
export class MockContractFactory {
  public contractInterface: MockInterface
  public bytecode: string
  public signer: MockWallet | MockSigner

  constructor(
    contractInterface: MockInterface,
    bytecode: string,
    signer: MockWallet | MockSigner
  ) {
    this.contractInterface = contractInterface
    this.bytecode = bytecode
    this.signer = signer
  }

  async deploy(..._args: any[]): Promise<MockContract & { deploymentTransaction(): MockTransactionResponse; waitForDeployment(): Promise<MockContract> }> {
    const address = generateMockEthAddress()
    const contract = new MockContract(address, [], this.signer) as MockContract & {
      deploymentTransaction(): MockTransactionResponse
      waitForDeployment(): Promise<MockContract>
    }

    contract.deploymentTransaction = () => new MockTransactionResponse()
    contract.waitForDeployment = async () => contract

    return contract
  }

  static fromSolidity(_source: string, _signer: MockWallet | MockSigner): MockContractFactory {
    return new MockContractFactory(new MockInterface([]), '0x', _signer)
  }
}

/**
 * Mock Interface class
 */
export class MockInterface {
  constructor(public abi: any[]) {}

  encodeFunctionData(_functionName: string, _args?: any[]): string {
    return '0x' + 'a'.repeat(8) + '0'.repeat(56)
  }

  decodeFunctionResult(_functionName: string, _data: string): any[] {
    return []
  }

  parseLog(_log: any): any {
    return null
  }

  getFunction(_nameOrSignature: string): any {
    return { name: _nameOrSignature }
  }
}

/**
 * Mock FeeData
 */
export class MockFeeData {
  public gasPrice: bigint = BigInt('20000000000') // 20 gwei
  public maxFeePerGas: bigint = BigInt('30000000000') // 30 gwei
  public maxPriorityFeePerGas: bigint = BigInt('2000000000') // 2 gwei
}

/**
 * Mock TransactionResponse
 */
export class MockTransactionResponse {
  public hash: string
  public blockNumber: number | null = null
  public blockHash: string | null = null
  public from: string
  public to: string | null
  public value: bigint
  public gasLimit: bigint
  public gasPrice: bigint | null
  public nonce: number

  constructor(hash?: string) {
    this.hash = hash || generateMockTxHash()
    this.from = generateMockEthAddress()
    this.to = generateMockEthAddress()
    this.value = BigInt(0)
    this.gasLimit = BigInt(21000)
    this.gasPrice = BigInt('20000000000')
    this.nonce = 0
  }

  async wait(_confirmations?: number): Promise<MockTransactionReceipt> {
    return new MockTransactionReceipt(this.hash)
  }

  async getTransaction(): Promise<MockTransactionResponse> {
    return this
  }
}

/**
 * Mock TransactionReceipt
 */
export class MockTransactionReceipt {
  public hash: string
  public blockNumber: number
  public blockHash: string
  public from: string
  public to: string | null
  public contractAddress: string | null
  public status: number
  public gasUsed: bigint
  public logs: any[]

  constructor(hash?: string, contractAddress?: string) {
    this.hash = hash || generateMockTxHash()
    this.blockNumber = 12345678
    this.blockHash = '0x' + 'b'.repeat(64)
    this.from = generateMockEthAddress()
    this.to = generateMockEthAddress()
    this.contractAddress = contractAddress || null
    this.status = 1 // Success
    this.gasUsed = BigInt(21000)
    this.logs = []
  }
}

/**
 * Utility functions
 */
export function parseEther(ether: string): bigint {
  const [whole = '0', fraction = '0'] = ether.split('.')
  const paddedFraction = fraction.padEnd(18, '0').slice(0, 18)
  return BigInt(whole + paddedFraction)
}

export function formatEther(wei: bigint): string {
  const weiStr = wei.toString().padStart(19, '0')
  const whole = weiStr.slice(0, -18) || '0'
  const fraction = weiStr.slice(-18).replace(/0+$/, '') || '0'
  return `${whole}.${fraction}`
}

export function parseUnits(value: string, decimals: number): bigint {
  const [whole = '0', fraction = '0'] = value.split('.')
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(whole + paddedFraction)
}

export function formatUnits(value: bigint, decimals: number): string {
  const valueStr = value.toString().padStart(decimals + 1, '0')
  const whole = valueStr.slice(0, -decimals) || '0'
  const fraction = valueStr.slice(-decimals).replace(/0+$/, '') || '0'
  return `${whole}.${fraction}`
}

export function getAddress(address: string): string {
  // Simple checksum simulation - in real ethers it validates and checksums
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error(`Invalid address: ${address}`)
  }
  return address
}

export function isAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address)
}

export function id(text: string): string {
  // Simplified keccak256 hash mock
  return '0x' + 'hash'.repeat(16)
}

export function keccak256(data: string): string {
  return '0x' + 'k'.repeat(64)
}

export function toUtf8Bytes(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

export function hexlify(data: Uint8Array | string): string {
  if (typeof data === 'string') return data
  return '0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Export all mocks as if they were the real ethers SDK
 */
export const ethers = {
  JsonRpcProvider: MockJsonRpcProvider,
  BrowserProvider: MockBrowserProvider,
  Wallet: MockWallet,
  Contract: MockContract,
  ContractFactory: MockContractFactory,
  Interface: MockInterface,
  parseEther,
  formatEther,
  parseUnits,
  formatUnits,
  getAddress,
  isAddress,
  id,
  keccak256,
  toUtf8Bytes,
  hexlify,
}

export default {
  JsonRpcProvider: MockJsonRpcProvider,
  BrowserProvider: MockBrowserProvider,
  Wallet: MockWallet,
  Contract: MockContract,
  ContractFactory: MockContractFactory,
  Interface: MockInterface,
  parseEther,
  formatEther,
  parseUnits,
  formatUnits,
  getAddress,
  isAddress,
  id,
  keccak256,
  toUtf8Bytes,
  hexlify,
}
