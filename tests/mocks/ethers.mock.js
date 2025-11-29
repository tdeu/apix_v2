"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ethers = exports.MockTransactionReceipt = exports.MockTransactionResponse = exports.MockFeeData = exports.MockInterface = exports.MockContractFactory = exports.MockContract = exports.MockSigner = exports.MockWallet = exports.MockBrowserProvider = exports.MockJsonRpcProvider = void 0;
exports.parseEther = parseEther;
exports.formatEther = formatEther;
exports.parseUnits = parseUnits;
exports.formatUnits = formatUnits;
exports.getAddress = getAddress;
exports.isAddress = isAddress;
exports.id = id;
exports.keccak256 = keccak256;
exports.toUtf8Bytes = toUtf8Bytes;
exports.hexlify = hexlify;
const test_helpers_1 = require("../utils/test-helpers");
/**
 * Mock JsonRpcProvider
 *
 * The real JsonRpcProvider connects to an Ethereum node via JSON-RPC.
 * Our mock simulates network responses.
 */
class MockJsonRpcProvider {
    constructor(url) {
        this.url = url;
        // Determine network from URL
        if (url?.includes('sepolia')) {
            this._network = { chainId: BigInt(11155111), name: 'sepolia' };
        }
        else if (url?.includes('mainnet')) {
            this._network = { chainId: BigInt(1), name: 'mainnet' };
        }
        else if (url?.includes('base')) {
            this._network = { chainId: BigInt(84532), name: 'base-sepolia' };
        }
        else {
            this._network = { chainId: BigInt(11155111), name: 'sepolia' };
        }
    }
    async getNetwork() {
        return this._network;
    }
    async getBalance(_address) {
        // Return mock balance of 1 ETH
        return BigInt('1000000000000000000');
    }
    async getFeeData() {
        return new MockFeeData();
    }
    async getTransactionReceipt(txHash) {
        return new MockTransactionReceipt(txHash);
    }
    async getTransaction(txHash) {
        return new MockTransactionResponse(txHash);
    }
    async estimateGas(_tx) {
        // Return mock gas estimate of 21000 for simple transfer
        return BigInt(21000);
    }
    async getBlockNumber() {
        return 12345678;
    }
    async broadcastTransaction(_signedTx) {
        return new MockTransactionResponse();
    }
    destroy() {
        // Mock cleanup
    }
}
exports.MockJsonRpcProvider = MockJsonRpcProvider;
/**
 * Mock BrowserProvider (for wallet connections)
 */
class MockBrowserProvider extends MockJsonRpcProvider {
    constructor(ethereum) {
        super();
        this.ethereum = ethereum;
    }
    async getSigner() {
        return new MockSigner(this);
    }
}
exports.MockBrowserProvider = MockBrowserProvider;
/**
 * Mock Wallet class
 *
 * The real Wallet handles key management and signing.
 * Our mock stores the key and simulates signing.
 */
class MockWallet {
    constructor(privateKey, provider) {
        this.provider = null;
        // Generate deterministic address from private key (simplified)
        this.address = (0, test_helpers_1.generateMockEthAddress)();
        this.provider = provider || null;
    }
    connect(provider) {
        const wallet = new MockWallet(undefined, provider);
        wallet.address = this.address;
        return wallet;
    }
    async getAddress() {
        return this.address;
    }
    async signTransaction(tx) {
        // Return mock signed transaction
        return '0x' + 'f'.repeat(130);
    }
    async signMessage(_message) {
        // Return mock signature
        return '0x' + 'a'.repeat(130);
    }
    async sendTransaction(tx) {
        return new MockTransactionResponse();
    }
    static fromPhrase(_mnemonic, _provider) {
        return new MockWallet();
    }
    static createRandom() {
        return new MockWallet();
    }
}
exports.MockWallet = MockWallet;
/**
 * Mock Signer (abstract signer interface)
 */
class MockSigner {
    constructor(provider) {
        this.address = (0, test_helpers_1.generateMockEthAddress)();
        this.provider = provider;
    }
    async getAddress() {
        return this.address;
    }
    async signTransaction(tx) {
        return '0x' + 'f'.repeat(130);
    }
    async signMessage(_message) {
        return '0x' + 'a'.repeat(130);
    }
    async sendTransaction(tx) {
        return new MockTransactionResponse();
    }
}
exports.MockSigner = MockSigner;
/**
 * Mock Contract class
 *
 * The real Contract class interacts with deployed smart contracts.
 * Our mock simulates contract calls and transactions.
 */
class MockContract {
    constructor(address, _abi, signerOrProvider) {
        this.target = address;
        this.interface = new MockInterface(_abi);
        if (signerOrProvider instanceof MockWallet || signerOrProvider instanceof MockSigner) {
            this._signer = signerOrProvider;
            this._provider = signerOrProvider.provider;
        }
        else if (signerOrProvider instanceof MockJsonRpcProvider) {
            this._signer = null;
            this._provider = signerOrProvider;
        }
        else {
            this._signer = null;
            this._provider = null;
        }
    }
    connect(signer) {
        return new MockContract(this.target, [], signer);
    }
    async getAddress() {
        return this.target;
    }
    // Generic call method for read operations
    async staticCall(_method, ..._args) {
        return '0x' + '0'.repeat(64);
    }
    // Simulate common ERC-20 methods
    async balanceOf(_address) {
        return BigInt('1000000000000000000'); // 1 token
    }
    async totalSupply() {
        return BigInt('1000000000000000000000000'); // 1M tokens
    }
    async decimals() {
        return 18;
    }
    async name() {
        return 'Mock Token';
    }
    async symbol() {
        return 'MOCK';
    }
    async transfer(_to, _amount) {
        return new MockTransactionResponse();
    }
    async approve(_spender, _amount) {
        return new MockTransactionResponse();
    }
    // Simulate ERC-721 methods
    async ownerOf(_tokenId) {
        return (0, test_helpers_1.generateMockEthAddress)();
    }
    async tokenURI(_tokenId) {
        return 'https://example.com/token/1';
    }
    async safeMint(_to, _tokenId) {
        return new MockTransactionResponse();
    }
    async safeTransferFrom(_from, _to, _tokenId) {
        return new MockTransactionResponse();
    }
}
exports.MockContract = MockContract;
/**
 * Mock ContractFactory
 *
 * Used to deploy new contracts.
 */
class MockContractFactory {
    constructor(contractInterface, bytecode, signer) {
        this.contractInterface = contractInterface;
        this.bytecode = bytecode;
        this.signer = signer;
    }
    async deploy(..._args) {
        const address = (0, test_helpers_1.generateMockEthAddress)();
        const contract = new MockContract(address, [], this.signer);
        contract.deploymentTransaction = () => new MockTransactionResponse();
        contract.waitForDeployment = async () => contract;
        return contract;
    }
    static fromSolidity(_source, _signer) {
        return new MockContractFactory(new MockInterface([]), '0x', _signer);
    }
}
exports.MockContractFactory = MockContractFactory;
/**
 * Mock Interface class
 */
class MockInterface {
    constructor(abi) {
        this.abi = abi;
    }
    encodeFunctionData(_functionName, _args) {
        return '0x' + 'a'.repeat(8) + '0'.repeat(56);
    }
    decodeFunctionResult(_functionName, _data) {
        return [];
    }
    parseLog(_log) {
        return null;
    }
    getFunction(_nameOrSignature) {
        return { name: _nameOrSignature };
    }
}
exports.MockInterface = MockInterface;
/**
 * Mock FeeData
 */
class MockFeeData {
    constructor() {
        this.gasPrice = BigInt('20000000000'); // 20 gwei
        this.maxFeePerGas = BigInt('30000000000'); // 30 gwei
        this.maxPriorityFeePerGas = BigInt('2000000000'); // 2 gwei
    }
}
exports.MockFeeData = MockFeeData;
/**
 * Mock TransactionResponse
 */
class MockTransactionResponse {
    constructor(hash) {
        this.blockNumber = null;
        this.blockHash = null;
        this.hash = hash || (0, test_helpers_1.generateMockTxHash)();
        this.from = (0, test_helpers_1.generateMockEthAddress)();
        this.to = (0, test_helpers_1.generateMockEthAddress)();
        this.value = BigInt(0);
        this.gasLimit = BigInt(21000);
        this.gasPrice = BigInt('20000000000');
        this.nonce = 0;
    }
    async wait(_confirmations) {
        return new MockTransactionReceipt(this.hash);
    }
    async getTransaction() {
        return this;
    }
}
exports.MockTransactionResponse = MockTransactionResponse;
/**
 * Mock TransactionReceipt
 */
class MockTransactionReceipt {
    constructor(hash, contractAddress) {
        this.hash = hash || (0, test_helpers_1.generateMockTxHash)();
        this.blockNumber = 12345678;
        this.blockHash = '0x' + 'b'.repeat(64);
        this.from = (0, test_helpers_1.generateMockEthAddress)();
        this.to = (0, test_helpers_1.generateMockEthAddress)();
        this.contractAddress = contractAddress || null;
        this.status = 1; // Success
        this.gasUsed = BigInt(21000);
        this.logs = [];
    }
}
exports.MockTransactionReceipt = MockTransactionReceipt;
/**
 * Utility functions
 */
function parseEther(ether) {
    const [whole = '0', fraction = '0'] = ether.split('.');
    const paddedFraction = fraction.padEnd(18, '0').slice(0, 18);
    return BigInt(whole + paddedFraction);
}
function formatEther(wei) {
    const weiStr = wei.toString().padStart(19, '0');
    const whole = weiStr.slice(0, -18) || '0';
    const fraction = weiStr.slice(-18).replace(/0+$/, '') || '0';
    return `${whole}.${fraction}`;
}
function parseUnits(value, decimals) {
    const [whole = '0', fraction = '0'] = value.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole + paddedFraction);
}
function formatUnits(value, decimals) {
    const valueStr = value.toString().padStart(decimals + 1, '0');
    const whole = valueStr.slice(0, -decimals) || '0';
    const fraction = valueStr.slice(-decimals).replace(/0+$/, '') || '0';
    return `${whole}.${fraction}`;
}
function getAddress(address) {
    // Simple checksum simulation - in real ethers it validates and checksums
    if (!address.startsWith('0x') || address.length !== 42) {
        throw new Error(`Invalid address: ${address}`);
    }
    return address;
}
function isAddress(address) {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
}
function id(text) {
    // Simplified keccak256 hash mock
    return '0x' + 'hash'.repeat(16);
}
function keccak256(data) {
    return '0x' + 'k'.repeat(64);
}
function toUtf8Bytes(str) {
    return new TextEncoder().encode(str);
}
function hexlify(data) {
    if (typeof data === 'string')
        return data;
    return '0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
}
/**
 * Export all mocks as if they were the real ethers SDK
 */
exports.ethers = {
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
};
exports.default = {
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
};
//# sourceMappingURL=ethers.mock.js.map