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
/**
 * Mock JsonRpcProvider
 *
 * The real JsonRpcProvider connects to an Ethereum node via JSON-RPC.
 * Our mock simulates network responses.
 */
export declare class MockJsonRpcProvider {
    url?: string | undefined;
    private _network;
    constructor(url?: string | undefined);
    getNetwork(): Promise<{
        chainId: bigint;
        name: string;
    }>;
    getBalance(_address: string): Promise<bigint>;
    getFeeData(): Promise<MockFeeData>;
    getTransactionReceipt(txHash: string): Promise<MockTransactionReceipt | null>;
    getTransaction(txHash: string): Promise<MockTransactionResponse | null>;
    estimateGas(_tx: any): Promise<bigint>;
    getBlockNumber(): Promise<number>;
    broadcastTransaction(_signedTx: string): Promise<MockTransactionResponse>;
    destroy(): void;
}
/**
 * Mock BrowserProvider (for wallet connections)
 */
export declare class MockBrowserProvider extends MockJsonRpcProvider {
    ethereum?: any | undefined;
    constructor(ethereum?: any | undefined);
    getSigner(): Promise<MockSigner>;
}
/**
 * Mock Wallet class
 *
 * The real Wallet handles key management and signing.
 * Our mock stores the key and simulates signing.
 */
export declare class MockWallet {
    address: string;
    provider: MockJsonRpcProvider | null;
    constructor(privateKey?: string, provider?: MockJsonRpcProvider);
    connect(provider: MockJsonRpcProvider): MockWallet;
    getAddress(): Promise<string>;
    signTransaction(tx: any): Promise<string>;
    signMessage(_message: string): Promise<string>;
    sendTransaction(tx: any): Promise<MockTransactionResponse>;
    static fromPhrase(_mnemonic: string, _provider?: MockJsonRpcProvider): MockWallet;
    static createRandom(): MockWallet;
}
/**
 * Mock Signer (abstract signer interface)
 */
export declare class MockSigner {
    address: string;
    provider: MockJsonRpcProvider;
    constructor(provider: MockJsonRpcProvider);
    getAddress(): Promise<string>;
    signTransaction(tx: any): Promise<string>;
    signMessage(_message: string): Promise<string>;
    sendTransaction(tx: any): Promise<MockTransactionResponse>;
}
/**
 * Mock Contract class
 *
 * The real Contract class interacts with deployed smart contracts.
 * Our mock simulates contract calls and transactions.
 */
export declare class MockContract {
    target: string;
    interface: MockInterface;
    private _signer;
    private _provider;
    constructor(address: string, _abi: any[], signerOrProvider?: MockWallet | MockSigner | MockJsonRpcProvider);
    connect(signer: MockWallet | MockSigner): MockContract;
    getAddress(): Promise<string>;
    [key: string]: any;
    staticCall(_method: string, ..._args: any[]): Promise<any>;
    balanceOf(_address: string): Promise<bigint>;
    totalSupply(): Promise<bigint>;
    decimals(): Promise<number>;
    name(): Promise<string>;
    symbol(): Promise<string>;
    transfer(_to: string, _amount: bigint): Promise<MockTransactionResponse>;
    approve(_spender: string, _amount: bigint): Promise<MockTransactionResponse>;
    ownerOf(_tokenId: bigint): Promise<string>;
    tokenURI(_tokenId: bigint): Promise<string>;
    safeMint(_to: string, _tokenId: bigint): Promise<MockTransactionResponse>;
    safeTransferFrom(_from: string, _to: string, _tokenId: bigint): Promise<MockTransactionResponse>;
}
/**
 * Mock ContractFactory
 *
 * Used to deploy new contracts.
 */
export declare class MockContractFactory {
    contractInterface: MockInterface;
    bytecode: string;
    signer: MockWallet | MockSigner;
    constructor(contractInterface: MockInterface, bytecode: string, signer: MockWallet | MockSigner);
    deploy(..._args: any[]): Promise<MockContract & {
        deploymentTransaction(): MockTransactionResponse;
        waitForDeployment(): Promise<MockContract>;
    }>;
    static fromSolidity(_source: string, _signer: MockWallet | MockSigner): MockContractFactory;
}
/**
 * Mock Interface class
 */
export declare class MockInterface {
    abi: any[];
    constructor(abi: any[]);
    encodeFunctionData(_functionName: string, _args?: any[]): string;
    decodeFunctionResult(_functionName: string, _data: string): any[];
    parseLog(_log: any): any;
    getFunction(_nameOrSignature: string): any;
}
/**
 * Mock FeeData
 */
export declare class MockFeeData {
    gasPrice: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
}
/**
 * Mock TransactionResponse
 */
export declare class MockTransactionResponse {
    hash: string;
    blockNumber: number | null;
    blockHash: string | null;
    from: string;
    to: string | null;
    value: bigint;
    gasLimit: bigint;
    gasPrice: bigint | null;
    nonce: number;
    constructor(hash?: string);
    wait(_confirmations?: number): Promise<MockTransactionReceipt>;
    getTransaction(): Promise<MockTransactionResponse>;
}
/**
 * Mock TransactionReceipt
 */
export declare class MockTransactionReceipt {
    hash: string;
    blockNumber: number;
    blockHash: string;
    from: string;
    to: string | null;
    contractAddress: string | null;
    status: number;
    gasUsed: bigint;
    logs: any[];
    constructor(hash?: string, contractAddress?: string);
}
/**
 * Utility functions
 */
export declare function parseEther(ether: string): bigint;
export declare function formatEther(wei: bigint): string;
export declare function parseUnits(value: string, decimals: number): bigint;
export declare function formatUnits(value: bigint, decimals: number): string;
export declare function getAddress(address: string): string;
export declare function isAddress(address: string): boolean;
export declare function id(text: string): string;
export declare function keccak256(data: string): string;
export declare function toUtf8Bytes(str: string): Uint8Array;
export declare function hexlify(data: Uint8Array | string): string;
/**
 * Export all mocks as if they were the real ethers SDK
 */
export declare const ethers: {
    JsonRpcProvider: typeof MockJsonRpcProvider;
    BrowserProvider: typeof MockBrowserProvider;
    Wallet: typeof MockWallet;
    Contract: typeof MockContract;
    ContractFactory: typeof MockContractFactory;
    Interface: typeof MockInterface;
    parseEther: typeof parseEther;
    formatEther: typeof formatEther;
    parseUnits: typeof parseUnits;
    formatUnits: typeof formatUnits;
    getAddress: typeof getAddress;
    isAddress: typeof isAddress;
    id: typeof id;
    keccak256: typeof keccak256;
    toUtf8Bytes: typeof toUtf8Bytes;
    hexlify: typeof hexlify;
};
declare const _default: {
    JsonRpcProvider: typeof MockJsonRpcProvider;
    BrowserProvider: typeof MockBrowserProvider;
    Wallet: typeof MockWallet;
    Contract: typeof MockContract;
    ContractFactory: typeof MockContractFactory;
    Interface: typeof MockInterface;
    parseEther: typeof parseEther;
    formatEther: typeof formatEther;
    parseUnits: typeof parseUnits;
    formatUnits: typeof formatUnits;
    getAddress: typeof getAddress;
    isAddress: typeof isAddress;
    id: typeof id;
    keccak256: typeof keccak256;
    toUtf8Bytes: typeof toUtf8Bytes;
    hexlify: typeof hexlify;
};
export default _default;
//# sourceMappingURL=ethers.mock.d.ts.map