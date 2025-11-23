# APIX Blockchain Abstraction Layer

**Multi-Chain Adapter Pattern for Blockchain-Agnostic Development**

This module provides a unified interface for interacting with multiple blockchains (Hedera, Ethereum, Solana, Base) through a consistent, type-safe API.

---

## 📐 Architecture

### Core Principles

1. **Chain-Agnostic**: Same API works across all blockchains
2. **Type-Safe**: Full TypeScript support with proper types
3. **Extensible**: Easy to add new blockchains (2-3 days per chain)
4. **Lazy Loading**: SDKs only loaded when needed (keeps bundle small)
5. **Error-Handled**: Consistent error handling across chains

### Directory Structure

```
src/blockchain/
├── core/                           # Core abstraction layer
│   ├── types.ts                    # Chain-agnostic type definitions
│   ├── BlockchainAdapter.ts        # Base adapter interface
│   ├── ChainCapabilities.ts        # Capability detection system
│   ├── AdapterFactory.ts           # Dynamic adapter creation with lazy loading
│   ├── ChainRegistry.ts            # Chain metadata and information
│   ├── FeatureMapper.ts            # Cross-chain feature equivalents
│   └── index.ts                    # Module exports
│
├── adapters/                       # Chain-specific implementations
│   ├── HederaAdapter.ts            # Hedera blockchain adapter
│   ├── EthereumAdapter.ts          # Ethereum blockchain adapter
│   ├── SolanaAdapter.ts            # Solana blockchain adapter
│   └── BaseAdapter.ts              # Base L2 blockchain adapter
│
├── services/                       # Chain-specific service implementations (to be added)
├── analytics/                      # Real-time chain metrics (to be added)
└── wallets/                        # Multi-chain wallet providers (to be added)
```

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { AdapterFactory, SupportedChain } from './blockchain/core'

// Create adapter for a specific chain
const adapter = await AdapterFactory.createAdapter('hedera', {
  chain: 'hedera',
  network: 'testnet',
  credentials: {
    accountId: process.env.HEDERA_ACCOUNT_ID,
    privateKey: process.env.HEDERA_PRIVATE_KEY,
  },
})

// Create a token (works identically across all chains)
const tokenResult = await adapter.createToken({
  name: 'My Token',
  symbol: 'MTK',
  decimals: 18,
  initialSupply: '1000000',
})

console.log(`Token created: ${tokenResult.tokenId}`)
console.log(`Explorer: ${tokenResult.transaction.explorerUrl}`)
```

### Switching Chains

```typescript
// Same code works on Ethereum
const ethAdapter = await AdapterFactory.createAdapter('ethereum', {
  chain: 'ethereum',
  network: 'testnet', // Sepolia
  credentials: {
    privateKeyEVM: process.env.ETHEREUM_PRIVATE_KEY,
  },
  rpcUrl: process.env.ETHEREUM_RPC_URL,
})

// Identical API!
const ethTokenResult = await ethAdapter.createToken({
  name: 'My Token',
  symbol: 'MTK',
  decimals: 18,
  initialSupply: '1000000',
})
```

---

## 📦 Implementation Status

| Component | Status | Description |
|-----------|--------|-------------|
| **Core Types** | ✅ Complete | Chain-agnostic type system |
| **BlockchainAdapter** | ✅ Complete | Base adapter interface |
| **ChainCapabilities** | ✅ Complete | Capability detection |
| **AdapterFactory** | ✅ Complete | Lazy loading factory |
| **ChainRegistry** | ✅ Complete | Chain metadata |
| **FeatureMapper** | ✅ Complete | Cross-chain equivalents |
| **HederaAdapter** | 🚧 Placeholder | Phase 1, Milestone 1.2 |
| **EthereumAdapter** | 🚧 Placeholder | Phase 1, Milestone 1.3 |
| **SolanaAdapter** | 🚧 Placeholder | Phase 3, Milestone 3.1 |
| **BaseAdapter** | 🚧 Placeholder | Phase 3, Milestone 3.2 |

---

## 🔧 Core API

### Adapter Interface

All blockchains implement the same interface:

```typescript
interface BlockchainAdapter {
  // Metadata
  readonly chainId: SupportedChain
  readonly name: string
  readonly network: NetworkType
  readonly capabilities: ChainCapabilities

  // Lifecycle
  initialize(config: BlockchainConfiguration): Promise<void>
  disconnect(): Promise<void>
  isConnected(): Promise<boolean>

  // Token Operations
  createToken(params: CreateTokenParams): Promise<TokenResult>
  transferToken(params: TransferParams): Promise<TransactionResult>
  getTokenBalance(params: BalanceParams): Promise<bigint>

  // NFT Operations
  createNFT(params: CreateNFTParams): Promise<NFTResult>
  mintNFT(params: MintNFTParams): Promise<TransactionResult>
  transferNFT(params: TransferNFTParams): Promise<TransactionResult>

  // Smart Contract Operations
  deployContract(params: DeployContractParams): Promise<ContractResult>
  callContract(params: CallContractParams): Promise<any>

  // Wallet Operations
  connectWallet(provider: WalletProvider): Promise<WalletConnection>
  getBalance(address: string): Promise<bigint>
  signTransaction(tx: Transaction): Promise<SignedTransaction>

  // Network Operations
  getGasPrice(): Promise<GasPrice>
  estimateFees(params: EstimateFeeParams): Promise<FeeEstimate>
  getTransactionStatus(txId: string): Promise<TransactionStatus>
  getExplorerUrl(txId: string): string

  // Chain-Specific (escape hatch)
  executeChainSpecificOperation(operation: string, params: any): Promise<any>
}
```

### Supported Operations

| Operation | Hedera | Ethereum | Solana | Base |
|-----------|--------|----------|--------|------|
| Create Token | ✅ HTS | ✅ ERC-20 | ✅ SPL | ✅ ERC-20 |
| Create NFT | ✅ HTS NFT | ✅ ERC-721 | ✅ Metaplex | ✅ ERC-721 |
| Deploy Contract | ✅ Solidity | ✅ Solidity | ✅ Rust | ✅ Solidity |
| Wallet Connect | ✅ HashPack | ✅ MetaMask | ✅ Phantom | ✅ Coinbase |
| Consensus/Events | ✅ HCS | ⚠️ Event Logs | ⚠️ Subscriptions | ⚠️ Event Logs |

✅ = Native support | ⚠️ = Equivalent feature (different implementation)

---

## 🧩 Capability Detection

Each chain declares its capabilities:

```typescript
import { ChainCapabilityDetector } from './blockchain/core'

// Check if a chain supports a feature
const hasNativeTokens = ChainCapabilityDetector.hasCapability('hedera', 'hasNativeTokens')
// true (Hedera has HTS)

const hasERC20 = ChainCapabilityDetector.hasCapability('ethereum', 'hasERC20')
// true (Ethereum supports ERC-20)

// Find chains that support a capability
const chainsWithNativeTokens = ChainCapabilityDetector.findChainsByCapability('hasNativeTokens')
// ['hedera', 'solana']

// Get full capabilities
const hederaCaps = ChainCapabilityDetector.getCapabilities('hedera')
console.log(hederaCaps)
// {
//   hasNativeTokens: true,
//   hasERC20: false,
//   hasSmartContracts: true,
//   averageTPS: 10000,
//   averageFinalitySeconds: 3,
//   ...
// }
```

---

## 🔄 Feature Mapping

When a feature doesn't exist on a chain, find the closest equivalent:

```typescript
import { FeatureMapper } from './blockchain/core'

// Get implementation of 'token' on Ethereum
const impl = FeatureMapper.getImplementation('token', 'ethereum')
console.log(impl)
// {
//   chain: 'ethereum',
//   feature: 'ERC-20 Token Standard',
//   standard: 'ERC-20',
//   similarity: 0.9, // 90% similar to Hedera HTS
//   notes: 'Smart contract-based fungible token standard',
//   implementation: 'Deploy ERC-20 contract via ethers.js'
// }

// Compare implementations across chains
const comparison = FeatureMapper.compareImplementations('token')
console.log(comparison)
// {
//   integrationType: 'token',
//   chains: [
//     { chain: 'hedera', feature: 'HTS', similarity: 1.0, pros: [...], cons: [...] },
//     { chain: 'ethereum', feature: 'ERC-20', similarity: 0.9, pros: [...], cons: [...] },
//     ...
//   ]
// }

// Get suggestion when migrating
const suggestion = FeatureMapper.getSuggestion('hedera', 'ethereum', 'consensus')
// "⚠️ Smart Contract Events on ethereum is similar but has some differences.
//  Smart contract event logs can be used for pub/sub patterns"
```

---

## 🏭 Adapter Factory & Lazy Loading

The `AdapterFactory` handles dynamic adapter creation with lazy SDK loading:

```typescript
import { AdapterFactory } from './blockchain/core'

// Create adapter (only loads SDK when first used)
const adapter = await AdapterFactory.createAdapter('ethereum', config)

// Check if SDK is installed (without loading)
const available = await AdapterFactory.getAvailableChains()
console.log(available) // ['hedera'] (only if SDKs installed)

// Get install instructions
const instructions = await AdapterFactory.getInstallInstructions('ethereum')
console.log(instructions)
// {
//   chain: 'ethereum',
//   isInstalled: false,
//   installCommand: 'npm install ethers',
//   description: 'The most established smart contract platform...'
// }
```

### Error Handling

If an SDK is not installed:

```typescript
try {
  const adapter = await AdapterFactory.createAdapter('ethereum')
} catch (error) {
  if (error.code === 'INVALID_CREDENTIALS') {
    console.error(error.message)
    // "Ethereum SDK not installed.
    //  To use ethereum, please install the required SDK:
    //    npm install ethers"
  }
}
```

---

## 📊 Chain Registry

Access chain metadata and compare chains:

```typescript
import { ChainRegistry } from './blockchain/core'

// Get chain information
const hederaInfo = ChainRegistry.getChain('hedera')
console.log(hederaInfo)
// {
//   chain: 'hedera',
//   metadata: { displayName: 'Hedera', nativeToken: 'HBAR', ... },
//   capabilities: { ... },
//   status: 'stable',
//   estimatedCostPerTx: { usd: 0.0001, nativeToken: '0.001 HBAR' }
// }

// Compare chains
const comparison = ChainRegistry.compareChains(['hedera', 'ethereum', 'solana'])
console.log(comparison)
// [
//   { chain: 'hedera', tps: 10000, finality: 3, costUSD: 0.0001, ... },
//   { chain: 'ethereum', tps: 15, finality: 180, costUSD: 3.5, ... },
//   { chain: 'solana', tps: 3000, finality: 0.4, costUSD: 0.00025, ... }
// ]

// Get fastest/cheapest chain
const fastest = ChainRegistry.getFastestChain() // 'hedera' (10,000 TPS)
const cheapest = ChainRegistry.getCheapestChain() // 'hedera' ($0.0001)
const quickestFinality = ChainRegistry.getFastestFinalityChain() // 'solana' (0.4s)

// Get recommendation (simple rule-based)
const rec = ChainRegistry.getRecommendedChain('Enterprise supply chain')
// { chain: 'hedera', reason: 'Enterprise governance, predictable fees...' }
```

---

## 🔐 Type Safety

All operations are fully typed:

```typescript
import { CreateTokenParams, TokenResult } from './blockchain/core'

const params: CreateTokenParams = {
  name: 'My Token',
  symbol: 'MTK',
  decimals: 18,
  initialSupply: '1000000',
  mintable: true,
  burnable: true,
  metadata: {
    description: 'A test token',
    image: 'https://example.com/image.png',
  },
}

const result: TokenResult = await adapter.createToken(params)
//    ^? TokenResult {
//         tokenId: string
//         tokenAddress?: string
//         transaction: TransactionResult
//         metadata?: TokenMetadata
//       }
```

---

## ⚠️ Error Handling

Consistent error handling across all chains:

```typescript
import { BlockchainError, BlockchainErrorCode } from './blockchain/core'

try {
  await adapter.transferToken({
    to: '0x...',
    amount: '1000',
    tokenId: 'token123',
  })
} catch (error) {
  if (error instanceof BlockchainError) {
    switch (error.code) {
      case BlockchainErrorCode.INSUFFICIENT_BALANCE:
        console.error('Not enough balance')
        break
      case BlockchainErrorCode.INVALID_ADDRESS:
        console.error('Invalid recipient address')
        break
      case BlockchainErrorCode.NETWORK_ERROR:
        console.error('Network connection failed')
        break
      default:
        console.error(`Blockchain error: ${error.message}`)
    }
  }
}
```

---

## 🛠️ Adding a New Blockchain

To add a new blockchain (e.g., Polygon):

### 1. Add to SupportedChain Type

```typescript
// src/blockchain/core/types.ts
export type SupportedChain =
  | 'hedera'
  | 'ethereum'
  | 'solana'
  | 'base'
  | 'polygon' // NEW
```

### 2. Add Capabilities

```typescript
// src/blockchain/core/ChainCapabilities.ts
export const CHAIN_CAPABILITIES: Record<SupportedChain, ChainCapabilities> = {
  // ... existing chains
  polygon: {
    hasNativeTokens: false,
    hasERC20: true,
    averageTPS: 7000,
    // ... other capabilities
  },
}
```

### 3. Add Metadata

```typescript
// src/blockchain/core/ChainCapabilities.ts
export const CHAIN_METADATA: Record<SupportedChain, ChainMetadata> = {
  // ... existing chains
  polygon: {
    id: 'polygon',
    name: 'polygon',
    displayName: 'Polygon',
    nativeToken: 'MATIC',
    explorerUrl: {
      mainnet: 'https://polygonscan.com',
      testnet: 'https://mumbai.polygonscan.com',
    },
    // ... other metadata
  },
}
```

### 4. Create Adapter

```typescript
// src/blockchain/adapters/PolygonAdapter.ts
export class PolygonAdapter extends BaseBlockchainAdapter {
  readonly chainId = 'polygon' as const
  readonly name = 'Polygon'
  readonly capabilities = CHAIN_CAPABILITIES.polygon

  async initialize(config: BlockchainConfiguration): Promise<void> {
    // Polygon initialization (similar to Ethereum)
  }

  // Implement all BlockchainAdapter methods...
}
```

### 5. Add to Factory

```typescript
// src/blockchain/core/AdapterFactory.ts
case 'polygon':
  return await this.loadPolygonAdapter()
```

### 6. Add Feature Mappings

```typescript
// src/blockchain/core/FeatureMapper.ts
// Add polygon to token mapping, NFT mapping, etc.
```

**Total Time**: ~16 hours (2 days) per blockchain

---

## 📖 Next Steps

1. **Phase 1, Milestone 1.2** (Week 1): Implement HederaAdapter
2. **Phase 1, Milestone 1.3** (Week 1): Implement EthereumAdapter
3. **Phase 3, Milestone 3.1** (Week 3): Implement SolanaAdapter
4. **Phase 3, Milestone 3.2** (Week 3-4): Implement BaseAdapter

See [MULTI_CHAIN_ARCHITECTURE_PLAN.md](../../MULTI_CHAIN_ARCHITECTURE_PLAN.md) for full roadmap.

---

## 🤝 Contributing

Contributions welcome! To add a new blockchain adapter:

1. Follow the "Adding a New Blockchain" guide above
2. Write comprehensive tests
3. Update documentation
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
