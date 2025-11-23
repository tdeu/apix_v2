# APIX Multi-Blockchain Architecture Plan

**Version**: 1.0
**Date**: 2025-11-23
**Timeline**: 3-4 weeks (phased rollout)
**Objective**: Transform APIX from Hedera-only to blockchain-agnostic platform supporting Hedera, Ethereum, Solana, Base, with extensible architecture for any future blockchain.

---

## 🎯 Core Principles

### 1. **Chain Agnostic Architecture**
- No blockchain should be favored in code or UX
- Adding a new chain requires ONLY: Adapter implementation + Templates (2-3 days max)
- Core framework never needs modification for new chains

### 2. **Extensibility First**
- Architecture must support ANY blockchain (EVM, non-EVM, account-based, UTXO)
- Plugin-ready design for future chains (Polygon, Avalanche, Cosmos, etc.)
- No hard-coded chain assumptions in core logic

### 3. **AI-Powered Intelligence**
- Chain selection driven by user requirements, not developer bias
- Real-time cost/performance data informs recommendations
- Educational approach: explain WHY a chain was recommended

### 4. **Production-Ready Quality**
- Each chain integration must be fully tested on testnets
- Comprehensive documentation per chain
- Error handling with helpful, chain-specific guidance

---

## 📐 Architecture Overview

### Core Abstraction: Adapter Pattern

```typescript
/**
 * Base interface that ALL blockchains must implement.
 * This is the contract that makes APIX chain-agnostic.
 */
interface BlockchainAdapter {
  // Metadata
  readonly chainId: string
  readonly name: string
  readonly network: 'mainnet' | 'testnet' | 'devnet'
  readonly capabilities: ChainCapabilities

  // Lifecycle
  initialize(config: ChainConfiguration): Promise<void>
  disconnect(): Promise<void>

  // Token Operations (Universal)
  createToken(params: CreateTokenParams): Promise<TokenResult>
  transferToken(params: TransferParams): Promise<TransactionResult>
  getTokenBalance(params: BalanceParams): Promise<BigNumber>

  // NFT Operations (Universal)
  createNFT(params: CreateNFTParams): Promise<NFTResult>
  mintNFT(params: MintNFTParams): Promise<TransactionResult>
  transferNFT(params: TransferNFTParams): Promise<TransactionResult>

  // Smart Contract Operations (Universal)
  deployContract(params: DeployContractParams): Promise<ContractResult>
  callContract(params: CallContractParams): Promise<any>

  // Wallet Operations (Universal)
  connectWallet(provider: WalletProvider): Promise<WalletConnection>
  getBalance(address: string): Promise<BigNumber>
  signTransaction(tx: Transaction): Promise<SignedTransaction>

  // Network Operations (Universal)
  getGasPrice(): Promise<GasPrice>
  estimateFees(params: EstimateFeeParams): Promise<FeeEstimate>
  getTransactionStatus(txId: string): Promise<TransactionStatus>

  // Chain-Specific Operations (Optional)
  executeChainSpecificOperation(operation: string, params: any): Promise<any>
}

/**
 * Capabilities flag system.
 * Allows chains to declare what they support.
 */
interface ChainCapabilities {
  // Token standards
  hasNativeTokens: boolean        // HTS (Hedera), SPL (Solana), ERC-20 (Ethereum)
  hasERC20: boolean                // Ethereum, Base, Polygon
  hasERC721: boolean               // NFT standard
  hasERC1155: boolean              // Multi-token standard

  // Smart contracts
  hasSmartContracts: boolean
  contractLanguage: 'solidity' | 'rust' | 'vyper' | 'custom' | null

  // Consensus mechanisms
  hasConsensusService: boolean     // Hedera-specific
  hasEventLogs: boolean            // Ethereum, Base

  // Account model
  accountModel: 'account-based' | 'UTXO' | 'custom'

  // Performance characteristics
  averageTPS: number
  averageFinalitySeconds: number

  // Advanced features
  hasStaking: boolean
  hasGovernance: boolean
  hasMultisig: boolean
}
```

---

## 🏗️ Project Structure

### New Directory Architecture

```
apix_v2/
├── src/
│   ├── blockchain/                        # NEW: Core blockchain abstraction
│   │   ├── core/
│   │   │   ├── BlockchainAdapter.ts       # Base interface (100% complete before any chain work)
│   │   │   ├── ChainCapabilities.ts       # Capability detection system
│   │   │   ├── AdapterFactory.ts          # Dynamic adapter instantiation
│   │   │   ├── ChainRegistry.ts           # Registry of all available chains
│   │   │   ├── FeatureMapper.ts           # Cross-chain feature equivalents
│   │   │   └── types.ts                   # Chain-agnostic type definitions
│   │   │
│   │   ├── adapters/                      # Chain implementations
│   │   │   ├── HederaAdapter.ts           # Phase 1: Refactor existing
│   │   │   ├── EthereumAdapter.ts         # Phase 1: New
│   │   │   ├── SolanaAdapter.ts           # Phase 2: New
│   │   │   ├── BaseAdapter.ts             # Phase 2: New (extends Ethereum)
│   │   │   └── [future]/                  # Polygon, Avalanche, etc.
│   │   │
│   │   ├── services/                      # Chain-specific service implementations
│   │   │   ├── hedera/
│   │   │   │   ├── HederaTokenService.ts
│   │   │   │   ├── HederaConsensusService.ts
│   │   │   │   ├── HederaSmartContractService.ts
│   │   │   │   └── HederaWalletService.ts
│   │   │   ├── ethereum/
│   │   │   │   ├── EthereumTokenService.ts
│   │   │   │   ├── EthereumContractService.ts
│   │   │   │   └── EthereumWalletService.ts
│   │   │   ├── solana/
│   │   │   │   ├── SolanaTokenService.ts
│   │   │   │   ├── SolanaProgramService.ts
│   │   │   │   └── SolanaWalletService.ts
│   │   │   └── base/
│   │   │       └── [inherits from ethereum/]
│   │   │
│   │   ├── analytics/                     # Real-time chain data
│   │   │   ├── LiveChainMetrics.ts        # Gas price, TPS, network status
│   │   │   ├── CostComparison.ts          # Cross-chain cost analysis
│   │   │   ├── PerformanceMonitor.ts      # Speed, finality tracking
│   │   │   └── providers/                 # API integrations
│   │   │       ├── EthereumGasProvider.ts # Etherscan, Gas Station
│   │   │       ├── SolanaFeeProvider.ts   # getRecentPrioritizationFees
│   │   │       ├── HederaMirrorProvider.ts
│   │   │       └── BaseGasProvider.ts
│   │   │
│   │   └── wallets/                       # Multi-chain wallet abstraction
│   │       ├── WalletAdapter.ts           # Universal wallet interface
│   │       ├── providers/
│   │       │   ├── MetaMaskProvider.ts    # Ethereum, Base
│   │       │   ├── PhantomProvider.ts     # Solana
│   │       │   ├── HashPackProvider.ts    # Hedera
│   │       │   ├── BladeProvider.ts       # Hedera
│   │       │   ├── CoinbaseWalletProvider.ts # Ethereum, Base
│   │       │   └── WalletConnectProvider.ts  # Multi-chain
│   │       └── WalletRegistry.ts
│   │
│   ├── ai/
│   │   ├── chain-selection/               # NEW: AI-powered chain recommendations
│   │   │   ├── ChainRecommendationEngine.ts
│   │   │   ├── UseCaseClassifier.ts       # Categorize user requirements
│   │   │   ├── ScoringAlgorithm.ts        # Multi-factor chain scoring
│   │   │   ├── QuestionnaireEngine.ts     # Interactive requirement gathering
│   │   │   └── NLPAnalyzer.ts             # Natural language processing
│   │   │
│   │   ├── classifiers/                   # EXISTING: Enterprise classification
│   │   ├── composition/                   # EXISTING: Code composition
│   │   ├── conversation/                  # EXISTING: Conversational AI
│   │   └── [other existing AI modules]
│   │
│   ├── config/                            # NEW: Multi-chain configuration
│   │   ├── ChainConfigurationManager.ts   # Unified config loader
│   │   ├── EnvironmentValidator.ts        # Per-chain env validation
│   │   └── chain-configs/
│   │       ├── hedera.config.ts
│   │       ├── ethereum.config.ts
│   │       ├── solana.config.ts
│   │       └── base.config.ts
│   │
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── recommend-chain.ts         # NEW: AI chain recommendation
│   │   │   ├── compare-chains.ts          # NEW: Side-by-side comparison
│   │   │   ├── switch-chain.ts            # NEW: Migrate between chains
│   │   │   ├── analyze.ts                 # UPDATED: Multi-chain analysis
│   │   │   ├── add.ts                     # UPDATED: Chain-aware integration
│   │   │   └── [other existing commands]
│   │   │
│   │   └── ui/                            # NEW: Interactive chain selection UI
│   │       ├── ChainSelector.ts           # Interactive menu
│   │       ├── ComparisonTable.ts         # Cost/speed/feature table
│   │       └── QuestionnaireUI.ts         # AI questionnaire interface
│   │
│   ├── templates/                         # EXISTING: Template engine
│   │   └── template-engine.ts             # UPDATED: Chain-aware rendering
│   │
│   └── types/
│       ├── blockchain.ts                  # NEW: Chain-agnostic types
│       ├── index.ts                       # UPDATED: Remove Hedera-specific types
│       └── [other existing types]
│
├── templates/                             # REFACTORED: Chain-specific templates
│   ├── _shared/                           # NEW: Chain-agnostic components
│   │   ├── wallet-connect/
│   │   ├── transaction-status/
│   │   ├── balance-display/
│   │   └── error-handling/
│   │
│   ├── hedera/                            # EXISTING: Hedera-specific
│   │   ├── token/
│   │   │   ├── hts-create.ts.hbs
│   │   │   ├── hts-transfer.ts.hbs
│   │   │   └── hts-info.ts.hbs
│   │   ├── smart-contract/
│   │   ├── consensus-service/
│   │   └── wallet/
│   │
│   ├── ethereum/                          # NEW: Ethereum-specific
│   │   ├── token/
│   │   │   ├── erc20-create.ts.hbs
│   │   │   ├── erc20-transfer.ts.hbs
│   │   │   └── erc20-approve.ts.hbs
│   │   ├── nft/
│   │   │   ├── erc721-create.ts.hbs
│   │   │   └── erc1155-create.ts.hbs
│   │   ├── smart-contract/
│   │   │   ├── contract-deploy.ts.hbs
│   │   │   └── contract-interact.ts.hbs
│   │   └── wallet/
│   │       ├── metamask-connect.ts.hbs
│   │       └── walletconnect.ts.hbs
│   │
│   ├── solana/                            # NEW: Solana-specific
│   │   ├── token/
│   │   │   ├── spl-token-create.ts.hbs
│   │   │   └── spl-token-transfer.ts.hbs
│   │   ├── nft/
│   │   │   └── metaplex-nft-create.ts.hbs
│   │   ├── program/
│   │   │   └── anchor-program-deploy.ts.hbs
│   │   └── wallet/
│   │       └── phantom-connect.ts.hbs
│   │
│   ├── base/                              # NEW: Base L2 (mostly inherits ethereum)
│   │   ├── token/                         # Symlinks to ethereum/ or overrides
│   │   ├── smart-contract/
│   │   └── wallet/
│   │       └── coinbase-wallet-connect.ts.hbs
│   │
│   └── enterprise-variants/               # EXISTING: Industry-specific
│       └── [keep existing structure]
│
├── lib/
│   └── hedera/                            # EXISTING: Keep for compatibility
│       └── [existing Hedera operations]
│
├── tests/
│   ├── blockchain/                        # NEW: Adapter tests
│   │   ├── adapters/
│   │   │   ├── hedera.test.ts
│   │   │   ├── ethereum.test.ts
│   │   │   ├── solana.test.ts
│   │   │   └── base.test.ts
│   │   ├── integration/
│   │   │   ├── token-creation.test.ts     # Test all chains
│   │   │   ├── wallet-connection.test.ts
│   │   │   └── contract-deployment.test.ts
│   │   └── mocks/
│   │       └── MockBlockchainAdapter.ts
│   │
│   └── ai/
│       └── chain-recommendation.test.ts   # NEW: AI recommendation tests
│
├── docs/                                  # NEW: Comprehensive documentation
│   ├── architecture/
│   │   ├── adapter-pattern.md
│   │   ├── adding-new-chains.md           # Step-by-step guide
│   │   └── feature-mapping.md
│   ├── chains/
│   │   ├── hedera.md
│   │   ├── ethereum.md
│   │   ├── solana.md
│   │   ├── base.md
│   │   └── comparison.md
│   └── migration/
│       └── hedera-to-multi-chain.md       # Migration guide for existing users
│
├── .env.example                           # UPDATED: All chain credentials
├── package.json                           # UPDATED: Dependencies for all chains
└── MULTI_CHAIN_ARCHITECTURE_PLAN.md      # This file

```

---

## 📦 Type System: Chain-Agnostic Foundation

### Core Types (`src/blockchain/core/types.ts`)

```typescript
/**
 * Supported blockchain identifiers.
 * Adding a new chain = add to this union.
 */
export type SupportedChain =
  | 'hedera'
  | 'ethereum'
  | 'solana'
  | 'base'
  // Future: 'polygon' | 'avalanche' | 'cosmos' | 'arbitrum' | ...

/**
 * Universal integration types (chain-agnostic).
 * Maps to chain-specific implementations via FeatureMapper.
 */
export type IntegrationType =
  | 'token'              // HTS, ERC-20, SPL Token
  | 'nft'                // ERC-721, Metaplex NFT
  | 'smart-contract'     // Solidity, Rust, etc.
  | 'wallet'             // Multi-wallet support
  | 'consensus'          // Hedera HCS, Ethereum events, Solana account data
  | 'defi'               // Future: DEX, lending, staking

/**
 * Network environment.
 */
export type NetworkType = 'mainnet' | 'testnet' | 'devnet' | 'localnet'

/**
 * Blockchain configuration (unified across all chains).
 */
export interface BlockchainConfiguration {
  chain: SupportedChain
  network: NetworkType
  credentials: ChainCredentials
  rpcUrl?: string
  mirrorNodeUrl?: string  // Hedera-specific (optional)
  customConfig?: Record<string, any>
}

/**
 * Chain-specific credentials.
 * Each chain adapter extracts what it needs.
 */
export interface ChainCredentials {
  // Hedera
  accountId?: string
  privateKey?: string

  // Ethereum/Base
  privateKeyEVM?: string
  infuraKey?: string
  alchemyKey?: string

  // Solana
  keypairPath?: string
  privateKeySolana?: string

  // Universal
  mnemonic?: string
  walletProvider?: WalletProvider
}

/**
 * Token creation parameters (universal).
 * Adapter translates to chain-specific format.
 */
export interface CreateTokenParams {
  name: string
  symbol: string
  decimals: number
  initialSupply: string | bigint
  mintable?: boolean
  burnable?: boolean
  pausable?: boolean
  metadata?: TokenMetadata
}

/**
 * Token metadata (universal).
 */
export interface TokenMetadata {
  description?: string
  image?: string
  externalUrl?: string
  attributes?: Array<{ trait_type: string; value: string | number }>
}

/**
 * Transaction result (universal).
 */
export interface TransactionResult {
  transactionId: string
  transactionHash: string
  status: 'pending' | 'success' | 'failed'
  blockNumber?: number
  timestamp: Date
  explorerUrl: string
  gasUsed?: bigint
  gasPriceGwei?: number
  costUSD?: number
}

/**
 * Gas price (chain-agnostic).
 */
export interface GasPrice {
  standard: bigint
  fast: bigint
  instant: bigint
  unit: 'gwei' | 'lamports' | 'tinybars'
}

/**
 * Fee estimate (universal).
 */
export interface FeeEstimate {
  estimatedCost: bigint
  estimatedCostUSD: number
  currency: string
  breakdown?: {
    baseFee?: bigint
    priorityFee?: bigint
    networkFee?: bigint
  }
}
```

### Feature Mapping System

```typescript
/**
 * Maps generic integration types to chain-specific implementations.
 *
 * Example:
 *   'token' → Hedera: HTS
 *           → Ethereum: ERC-20
 *           → Solana: SPL Token
 */
export class FeatureMapper {
  private mappings: Map<SupportedChain, ChainFeatureMap>

  /**
   * Get chain-specific implementation for a generic integration type.
   */
  getImplementation(
    chain: SupportedChain,
    integrationType: IntegrationType
  ): ChainFeatureImplementation {
    // Returns chain-specific details
  }

  /**
   * Get equivalent feature on target chain.
   *
   * Example:
   *   getEquivalent('hedera', 'consensus', 'ethereum')
   *   → Returns: { type: 'event-logs', similarity: 0.6, notes: '...' }
   */
  getEquivalent(
    sourceChain: SupportedChain,
    feature: string,
    targetChain: SupportedChain
  ): FeatureEquivalent | null {
    // Returns closest equivalent or null if none exists
  }

  /**
   * Check if a feature is supported on a chain.
   */
  isSupported(
    chain: SupportedChain,
    integrationType: IntegrationType
  ): boolean {
    // Returns true/false
  }
}

interface ChainFeatureMap {
  token: {
    standard: string           // 'HTS', 'ERC-20', 'SPL Token'
    templatePath: string
    serviceName: string
    documentation: string
  }
  nft: { /* ... */ }
  'smart-contract': { /* ... */ }
  // ...
}

interface FeatureEquivalent {
  type: string
  similarity: number          // 0.0 - 1.0
  notes: string
  limitations?: string[]
}
```

---

## 🔧 Implementation Phases

### **Phase 1: Foundation & Core Abstraction (Week 1)**

#### Milestone 1.1: Core Interface Definition
**Duration**: 2 days

**Tasks**:
1. Create `src/blockchain/core/BlockchainAdapter.ts`
   - Define complete interface (all methods, all signatures)
   - Comprehensive JSDoc documentation
   - Include optional chain-specific methods

2. Create `src/blockchain/core/ChainCapabilities.ts`
   - Capability flags system
   - Capability detection helpers
   - Validation logic

3. Create `src/blockchain/core/types.ts`
   - All chain-agnostic types
   - Replace Hedera-specific types in `src/types/index.ts`
   - Ensure backward compatibility

4. Create `src/blockchain/core/AdapterFactory.ts`
   - Dynamic adapter instantiation
   - Lazy loading of chain SDKs
   - Error handling for missing dependencies

5. Create `src/blockchain/core/ChainRegistry.ts`
   - Registry of all supported chains
   - Chain metadata (name, icon, explorer URLs)
   - Network configurations

6. Create `src/blockchain/core/FeatureMapper.ts`
   - Feature equivalence matrix
   - Cross-chain mapping logic
   - Similarity scoring

**Validation**:
- ✅ All types compile without errors
- ✅ Interface is comprehensive (covers 80%+ use cases)
- ✅ No Hedera-specific assumptions in core types

---

#### Milestone 1.2: Hedera Adapter (Refactoring)
**Duration**: 2 days

**Tasks**:
1. Create `src/blockchain/adapters/HederaAdapter.ts`
   - Implement `BlockchainAdapter` interface
   - Migrate logic from `src/services/hedera-operations.ts`
   - Migrate logic from `lib/hedera/`

2. Create chain-specific services:
   - `src/blockchain/services/hedera/HederaTokenService.ts`
   - `src/blockchain/services/hedera/HederaConsensusService.ts`
   - `src/blockchain/services/hedera/HederaSmartContractService.ts`
   - `src/blockchain/services/hedera/HederaWalletService.ts`

3. Update wallet integration:
   - `src/blockchain/wallets/providers/HashPackProvider.ts`
   - `src/blockchain/wallets/providers/BladeProvider.ts`

4. Define Hedera capabilities:
   ```typescript
   const hederaCapabilities: ChainCapabilities = {
     hasNativeTokens: true,
     hasERC20: false,
     hasERC721: false,
     hasSmartContracts: true,
     contractLanguage: 'solidity',
     hasConsensusService: true,
     hasEventLogs: false,
     accountModel: 'account-based',
     averageTPS: 10000,
     averageFinalitySeconds: 3,
     hasStaking: true,
     hasGovernance: false,
     hasMultisig: true
   }
   ```

**Validation**:
- ✅ All existing Hedera functionality works via adapter
- ✅ No breaking changes to existing APIX users
- ✅ HederaAdapter passes unit tests

---

#### Milestone 1.3: Ethereum Adapter
**Duration**: 3 days

**Tasks**:
1. Install dependencies:
   ```bash
   npm install ethers@^6.0.0 --save-optional
   ```

2. Create `src/blockchain/adapters/EthereumAdapter.ts`
   - Implement `BlockchainAdapter` interface
   - Use ethers.js v6
   - Support Ethereum mainnet & testnets (Sepolia, Goerli)

3. Create chain-specific services:
   - `src/blockchain/services/ethereum/EthereumTokenService.ts` (ERC-20, ERC-721, ERC-1155)
   - `src/blockchain/services/ethereum/EthereumContractService.ts` (deployment, interaction)
   - `src/blockchain/services/ethereum/EthereumWalletService.ts`

4. Create wallet providers:
   - `src/blockchain/wallets/providers/MetaMaskProvider.ts`
   - `src/blockchain/wallets/providers/WalletConnectProvider.ts`
   - `src/blockchain/wallets/providers/CoinbaseWalletProvider.ts`

5. Create templates:
   - `templates/ethereum/token/erc20-create.ts.hbs`
   - `templates/ethereum/token/erc20-transfer.ts.hbs`
   - `templates/ethereum/nft/erc721-create.ts.hbs`
   - `templates/ethereum/smart-contract/contract-deploy.ts.hbs`
   - `templates/ethereum/wallet/metamask-connect.ts.hbs`

6. Define Ethereum capabilities:
   ```typescript
   const ethereumCapabilities: ChainCapabilities = {
     hasNativeTokens: false,
     hasERC20: true,
     hasERC721: true,
     hasERC1155: true,
     hasSmartContracts: true,
     contractLanguage: 'solidity',
     hasConsensusService: false,
     hasEventLogs: true,
     accountModel: 'account-based',
     averageTPS: 15,
     averageFinalitySeconds: 180,
     hasStaking: true,
     hasGovernance: true,
     hasMultisig: true
   }
   ```

**Validation**:
- ✅ Create ERC-20 token on Sepolia testnet
- ✅ Deploy smart contract on Sepolia
- ✅ Connect MetaMask wallet
- ✅ All operations return standardized `TransactionResult`

---

### **Phase 2: AI Chain Selection & Analytics (Week 2)**

#### Milestone 2.1: Live Chain Metrics
**Duration**: 2 days

**Tasks**:
1. Create `src/blockchain/analytics/LiveChainMetrics.ts`
   - Real-time gas price fetching
   - TPS monitoring
   - Network status checks
   - Caching layer (1-hour TTL)

2. Create gas/fee providers:
   - `src/blockchain/analytics/providers/EthereumGasProvider.ts`
     - Integration: Etherscan Gas Tracker API
     - Fallback: EtherScan Gas Oracle

   - `src/blockchain/analytics/providers/HederaMirrorProvider.ts`
     - Integration: Hedera Mirror Node API
     - Fee schedule parsing

   - `src/blockchain/analytics/providers/SolanaFeeProvider.ts`
     - Integration: `getRecentPrioritizationFees` RPC method
     - Fallback: Static estimates

3. Create `src/blockchain/analytics/CostComparison.ts`
   - Cross-chain cost comparison
   - USD conversion (using CoinGecko/CoinMarketCap API)
   - Cost projections (daily/monthly usage estimates)

4. Create `src/blockchain/analytics/PerformanceMonitor.ts`
   - Transaction finality tracking
   - Network congestion detection
   - Historical performance data

**Validation**:
- ✅ Fetch live Ethereum gas prices (< 2 seconds)
- ✅ Fetch Hedera fees from mirror node
- ✅ Cache persists for 1 hour
- ✅ Graceful fallback to static data if APIs fail

---

#### Milestone 2.2: AI Recommendation Engine
**Duration**: 3 days

**Tasks**:
1. Create `src/ai/chain-selection/UseCaseClassifier.ts`
   - Categorize user requirements:
     - DeFi (DEX, lending, yield farming)
     - NFT (marketplaces, collections, gaming)
     - Payments (P2P, merchant, remittances)
     - Gaming (in-game assets, high TPS)
     - Enterprise (compliance, private networks)
     - Social (social tokens, community rewards)

2. Create `src/ai/chain-selection/QuestionnaireEngine.ts`
   - Interactive CLI questionnaire:
     ```
     1. What are you building?
        [ ] DeFi application
        [ ] NFT project
        [ ] Payment system
        [ ] Gaming platform
        [ ] Enterprise solution
        [ ] Other (describe)

     2. What's your priority?
        [ ] Lowest cost
        [ ] Highest speed
        [ ] Maximum decentralization
        [ ] Best developer tools
        [ ] Regulatory compliance

     3. Expected transaction volume?
        [ ] < 100/day
        [ ] 100-1,000/day
        [ ] 1,000-10,000/day
        [ ] > 10,000/day

     4. Budget for gas/fees?
        [ ] < $10/month
        [ ] $10-100/month
        [ ] $100-1,000/month
        [ ] > $1,000/month

     5. Tell us more (natural language):
        [Free text input for NLP analysis]
     ```

3. Create `src/ai/chain-selection/NLPAnalyzer.ts`
   - Use existing AI infrastructure (OpenAI/Anthropic/Groq)
   - Extract requirements from natural language:
     - Keywords: "fast", "cheap", "enterprise", "NFT", etc.
     - Context understanding
     - Sentiment analysis

4. Create `src/ai/chain-selection/ScoringAlgorithm.ts`
   - Multi-factor scoring:
     ```typescript
     interface ChainScore {
       chain: SupportedChain
       totalScore: number
       breakdown: {
         costScore: number          // Weight: 30%
         speedScore: number          // Weight: 25%
         ecosystemScore: number      // Weight: 20%
         useCaseFitScore: number     // Weight: 15%
         decentralizationScore: number // Weight: 10%
       }
       reasoning: string[]
       warnings: string[]
     }
     ```
   - Weighted scoring based on user priorities
   - Confidence level (0.0 - 1.0)

5. Create `src/ai/chain-selection/ChainRecommendationEngine.ts`
   - Orchestrate: Questionnaire → NLP → Live metrics → Scoring
   - Generate human-readable explanation:
     ```
     ✅ Recommended: Solana

     Why Solana?
     • Cost: ~$0.00025 per transaction (98% cheaper than Ethereum)
     • Speed: 3,000 TPS, 400ms finality (200x faster than Ethereum)
     • Use case fit: Excellent for gaming (high TPS, low latency)
     • Ecosystem: Strong gaming community, Metaplex for NFTs

     ⚠️ Considerations:
     • Newer chain (less mature than Ethereum)
     • Occasional network congestion during peak times

     Alternatives:
     • Hedera: Lower fees, enterprise-grade, but smaller ecosystem
     • Ethereum: Most mature, but higher costs ($5-50/tx)
     ```

**Validation**:
- ✅ Questionnaire completes in < 2 minutes
- ✅ AI recommendation matches manual analysis (80%+ accuracy)
- ✅ Live cost data integrated into recommendations
- ✅ Explanation is clear and educational

---

#### Milestone 2.3: CLI Integration
**Duration**: 2 days

**Tasks**:
1. Create `src/cli/commands/recommend-chain.ts`
   ```bash
   apix recommend-chain

   # With flags
   apix recommend-chain --use-case defi --priority cost
   apix recommend-chain --interactive  # Full questionnaire
   ```

2. Create `src/cli/commands/compare-chains.ts`
   ```bash
   apix compare-chains

   # Output: Side-by-side table
   ┌──────────────┬──────────┬──────────┬─────────┬──────┐
   │ Chain        │ Gas/Fee  │ TPS      │ Finality│ Lang │
   ├──────────────┼──────────┼──────────┼─────────┼──────┤
   │ Hedera       │ $0.0001  │ 10,000   │ 3s      │ Sol  │
   │ Ethereum     │ $5.20    │ 15       │ 3min    │ Sol  │
   │ Solana       │ $0.00025 │ 3,000    │ 0.4s    │ Rust │
   │ Base         │ $0.10    │ 1,000    │ 2s      │ Sol  │
   └──────────────┴──────────┴──────────┴─────────┴──────┘
   ```

3. Create `src/cli/ui/ChainSelector.ts`
   - Interactive menu (if `--chain` not specified):
     ```
     How would you like to choose a blockchain?

     ❯ Let AI recommend (based on your needs)
       Compare all chains (see cost/speed table)
       Manual selection (I know which chain I want)
     ```

4. Create `src/cli/ui/ComparisonTable.ts`
   - Formatted table with live data
   - Color coding (green = best, red = worst)
   - Sortable by column

5. Create `src/cli/ui/QuestionnaireUI.ts`
   - Interactive prompts
   - Progress indicator
   - Validation

6. Update existing commands:
   - `src/cli/commands/analyze.ts`:
     - Detect integrations for ALL chains
     - Show which chains are already configured

   - `src/cli/commands/add.ts`:
     - Add `--chain` flag (required or interactive prompt)
     - Chain-specific validation
     - Template selection based on chain

**Validation**:
- ✅ `apix recommend-chain` completes successfully
- ✅ `apix compare-chains` shows live data
- ✅ Interactive menu works correctly
- ✅ All commands support `--chain` flag

---

### **Phase 3: Solana & Base Adapters (Week 3)**

#### Milestone 3.1: Solana Adapter
**Duration**: 3 days

**Tasks**:
1. Install dependencies:
   ```bash
   npm install @solana/web3.js @solana/spl-token --save-optional
   npm install @metaplex-foundation/js --save-optional
   ```

2. Create `src/blockchain/adapters/SolanaAdapter.ts`
   - Implement `BlockchainAdapter` interface
   - Use @solana/web3.js
   - Support mainnet-beta, devnet, testnet

3. Create chain-specific services:
   - `src/blockchain/services/solana/SolanaTokenService.ts` (SPL Token)
   - `src/blockchain/services/solana/SolanaProgramService.ts` (deployment)
   - `src/blockchain/services/solana/SolanaWalletService.ts`

4. Create wallet providers:
   - `src/blockchain/wallets/providers/PhantomProvider.ts`
   - `src/blockchain/wallets/providers/SolflareProvider.ts`

5. Create templates:
   - `templates/solana/token/spl-token-create.ts.hbs`
   - `templates/solana/token/spl-token-transfer.ts.hbs`
   - `templates/solana/nft/metaplex-nft-create.ts.hbs`
   - `templates/solana/program/anchor-program-deploy.ts.hbs`
   - `templates/solana/wallet/phantom-connect.ts.hbs`

6. Define Solana capabilities:
   ```typescript
   const solanaCapabilities: ChainCapabilities = {
     hasNativeTokens: true,
     hasERC20: false,
     hasERC721: false,
     hasSmartContracts: true,
     contractLanguage: 'rust',
     hasConsensusService: false,
     hasEventLogs: false,
     accountModel: 'account-based',
     averageTPS: 3000,
     averageFinalitySeconds: 0.4,
     hasStaking: true,
     hasGovernance: true,
     hasMultisig: true
   }
   ```

**Validation**:
- ✅ Create SPL token on devnet
- ✅ Deploy Solana program
- ✅ Connect Phantom wallet
- ✅ All operations return standardized `TransactionResult`

---

#### Milestone 3.2: Base Adapter
**Duration**: 2 days

**Tasks**:
1. Create `src/blockchain/adapters/BaseAdapter.ts`
   - Extend `EthereumAdapter` (Base is EVM-compatible L2)
   - Override RPC URLs (Base mainnet, Base Sepolia testnet)
   - Override explorer URLs (Basescan)

2. Create chain-specific service overrides (if needed):
   - Most services inherit from Ethereum
   - Add Base-specific optimizations (cheaper L2 fees)

3. Create wallet provider:
   - `src/blockchain/wallets/providers/CoinbaseWalletProvider.ts` (Base-optimized)

4. Create templates:
   - `templates/base/` (mostly symlinks/copies from `ethereum/`)
   - Base-specific examples with Coinbase integrations

5. Define Base capabilities:
   ```typescript
   const baseCapabilities: ChainCapabilities = {
     ...ethereumCapabilities,  // Inherits Ethereum capabilities
     averageTPS: 1000,          // Higher than Ethereum L1
     averageFinalitySeconds: 2, // Faster than Ethereum L1
   }
   ```

**Validation**:
- ✅ Deploy ERC-20 on Base Sepolia
- ✅ Connect Coinbase Wallet
- ✅ Gas fees significantly lower than Ethereum mainnet

---

#### Milestone 3.3: Template Refactoring
**Duration**: 2 days

**Tasks**:
1. Create shared templates:
   - `templates/_shared/wallet-connect/UniversalWalletConnect.tsx.hbs`
   - `templates/_shared/transaction-status/TransactionStatus.tsx.hbs`
   - `templates/_shared/balance-display/BalanceDisplay.tsx.hbs`
   - `templates/_shared/error-handling/ErrorBoundary.tsx.hbs`

2. Update `src/templates/template-engine.ts`:
   - Add `chain: SupportedChain` parameter
   - Chain-aware template selection logic:
     ```typescript
     // Example: User requests 'token' integration
     if (chain === 'hedera') {
       templatePath = 'templates/hedera/token/hts-create.ts.hbs'
     } else if (chain === 'ethereum') {
       templatePath = 'templates/ethereum/token/erc20-create.ts.hbs'
     } else if (chain === 'solana') {
       templatePath = 'templates/solana/token/spl-token-create.ts.hbs'
     }
     ```
   - Shared template injection

3. Update all existing templates:
   - Add chain context to template data
   - Conditional rendering based on framework AND chain
   - Consistent naming conventions

4. Create template tests:
   - Test all chain + framework combinations
   - Validate TypeScript compilation
   - Ensure no hardcoded chain assumptions

**Validation**:
- ✅ Generate Next.js + Hedera token integration
- ✅ Generate React + Ethereum ERC-20 integration
- ✅ Generate Express + Solana SPL token integration
- ✅ All generated code compiles without errors

---

### **Phase 4: Integration & Testing (Week 4)**

#### Milestone 4.1: Configuration Management
**Duration**: 2 days

**Tasks**:
1. Update `.env.example`:
   ```bash
   # AI Provider (existing)
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-...

   # Hedera Configuration
   HEDERA_ACCOUNT_ID=0.0.12345
   HEDERA_PRIVATE_KEY=302e...
   HEDERA_NETWORK=testnet
   HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

   # Ethereum Configuration
   ETHEREUM_PRIVATE_KEY=0x...
   ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY
   ETHEREUM_NETWORK=sepolia
   ETHEREUM_INFURA_KEY=...
   ETHEREUM_ALCHEMY_KEY=...

   # Solana Configuration
   SOLANA_PRIVATE_KEY=[...]
   SOLANA_RPC_URL=https://api.devnet.solana.com
   SOLANA_NETWORK=devnet

   # Base Configuration
   BASE_PRIVATE_KEY=0x...
   BASE_RPC_URL=https://sepolia.base.org
   BASE_NETWORK=base-sepolia

   # Analytics APIs
   ETHERSCAN_API_KEY=...
   COINMARKETCAP_API_KEY=...
   ```

2. Create `src/config/ChainConfigurationManager.ts`:
   - Parse chain-specific env vars
   - Validate required credentials per chain
   - Network detection (mainnet/testnet)
   - Error messages for missing config

3. Create chain config files:
   - `src/config/chain-configs/hedera.config.ts`
   - `src/config/chain-configs/ethereum.config.ts`
   - `src/config/chain-configs/solana.config.ts`
   - `src/config/chain-configs/base.config.ts`

4. Create `src/config/EnvironmentValidator.ts`:
   - Validate credentials before blockchain operations
   - Check RPC connectivity
   - Warn about mainnet usage

**Validation**:
- ✅ Missing env vars produce helpful error messages
- ✅ Invalid credentials detected before operations
- ✅ Multi-chain .env works correctly

---

#### Milestone 4.2: Unit & Integration Tests
**Duration**: 3 days

**Tasks**:
1. Adapter unit tests:
   - `tests/blockchain/adapters/hedera.test.ts`
   - `tests/blockchain/adapters/ethereum.test.ts`
   - `tests/blockchain/adapters/solana.test.ts`
   - `tests/blockchain/adapters/base.test.ts`
   - Mock all blockchain SDK calls
   - Test error handling
   - Test capability detection

2. Integration tests (real testnets):
   - `tests/blockchain/integration/token-creation.test.ts`:
     - Create token on all 4 chains
     - Verify via explorers
     - Compare gas costs

   - `tests/blockchain/integration/wallet-connection.test.ts`:
     - Test all wallet providers
     - Test multi-chain switching

   - `tests/blockchain/integration/contract-deployment.test.ts`:
     - Deploy contracts on Hedera, Ethereum, Base
     - Deploy program on Solana
     - Verify deployments

3. AI recommendation tests:
   - `tests/ai/chain-recommendation.test.ts`:
     - Test questionnaire logic
     - Test scoring algorithm
     - Test edge cases (conflicting requirements)
     - Mock live API calls

4. Template generation tests:
   - `tests/templates/generation.test.ts`:
     - Generate code for all chains
     - All frameworks (Next.js, React, Express, Vue)
     - Validate TypeScript compilation
     - Validate runtime execution (basic smoke tests)

5. E2E CLI tests:
   - `tests/cli/e2e.test.ts`:
     - Test full workflows:
       1. `apix recommend-chain` → Select Ethereum
       2. `apix add token --chain ethereum` → Generate ERC-20
       3. `apix validate --testnet` → Verify integration
     - Test all commands with all chains

**Validation**:
- ✅ 90%+ code coverage
- ✅ All unit tests pass
- ✅ Integration tests succeed on testnets
- ✅ E2E workflows complete successfully

---

#### Milestone 4.3: Documentation
**Duration**: 2 days

**Tasks**:
1. Update `README.md`:
   - Remove aspirational multi-chain claims
   - Add real status indicators:
     ```
     | Chain     | Status | Token | NFT | Smart Contract | Wallet |
     |-----------|--------|-------|-----|----------------|--------|
     | Hedera    | ✅     | ✅    | ✅  | ✅             | ✅     |
     | Ethereum  | ✅     | ✅    | ✅  | ✅             | ✅     |
     | Solana    | ✅     | ✅    | ✅  | ✅             | ✅     |
     | Base      | ✅     | ✅    | ✅  | ✅             | ✅     |
     ```
   - Multi-chain examples
   - Quick start for each chain

2. Create `docs/architecture/adapter-pattern.md`:
   - Explain architecture
   - Diagram of adapter pattern
   - Code examples

3. Create `docs/architecture/adding-new-chains.md`:
   - Step-by-step guide to add a new chain
   - Checklist:
     ```
     [ ] Implement BlockchainAdapter interface
     [ ] Create chain-specific services
     [ ] Add templates
     [ ] Define capabilities
     [ ] Create tests
     [ ] Update documentation
     ```
   - Estimated time: 2-3 days

4. Create chain-specific docs:
   - `docs/chains/hedera.md`
   - `docs/chains/ethereum.md`
   - `docs/chains/solana.md`
   - `docs/chains/base.md`
   - Each includes:
     - Overview
     - Supported features
     - Configuration
     - Examples
     - Troubleshooting

5. Create `docs/chains/comparison.md`:
   - Feature comparison matrix
   - Cost comparison
   - Speed comparison
   - Use case recommendations

6. Create `docs/migration/hedera-to-multi-chain.md`:
   - Guide for existing Hedera-only APIX users
   - Breaking changes (if any)
   - Migration steps
   - FAQ

7. Update CLI help text:
   - All commands include `--chain` flag documentation
   - Examples for each chain
   - Link to online docs

**Validation**:
- ✅ Documentation is comprehensive
- ✅ All examples work correctly
- ✅ Migration guide tested with real project

---

#### Milestone 4.4: Polish & Release Preparation
**Duration**: 1 day

**Tasks**:
1. Error handling improvements:
   - Chain-specific error messages
   - Helpful suggestions:
     ```
     ❌ Error: Hedera Consensus Service not available on Ethereum

     💡 Suggestion: Use event logs for similar functionality:
        apix add smart-contract --chain ethereum
        # Then use contract.on('EventName', ...) for pub/sub
     ```
   - Network detection errors
   - Wallet connection errors

2. Performance optimizations:
   - Lazy load blockchain SDKs (only when needed)
   - Cache chain metadata
   - Optimize template rendering

3. UX improvements:
   - Progress indicators for long operations
   - Colored output (green = success, red = error, yellow = warning)
   - Success messages with explorer links
   - ASCII art for chain logos (optional)

4. Update `package.json`:
   - Update description: "Enterprise AI-powered multi-blockchain development assistant"
   - Update version: `2.0.0-beta.1`
   - Update dependencies
   - Add optional dependencies for chains

5. Create `CHANGELOG.md`:
   - Document all changes
   - Migration notes
   - Known issues

**Validation**:
- ✅ All error messages are helpful
- ✅ Performance is acceptable (< 5s for most operations)
- ✅ UX is polished and professional

---

## 🧪 Testing Strategy

### Unit Tests
- **Coverage target**: 90%+
- **Tools**: Jest, ts-jest
- **Mock**: All blockchain SDK calls
- **Test files**: `tests/blockchain/adapters/*.test.ts`

### Integration Tests
- **Testnets**:
  - Hedera: testnet
  - Ethereum: Sepolia
  - Solana: devnet
  - Base: Base Sepolia
- **Real operations**: Token creation, transfers, deployments
- **Cost**: Minimal (testnets are free)

### E2E Tests
- **Full CLI workflows**
- **All commands, all chains**
- **Automated via CI/CD**

### Manual Testing Checklist
```
[ ] Hedera token creation (testnet)
[ ] Ethereum ERC-20 deployment (Sepolia)
[ ] Solana SPL token creation (devnet)
[ ] Base ERC-20 deployment (Base Sepolia)
[ ] MetaMask connection (Ethereum)
[ ] Phantom connection (Solana)
[ ] HashPack connection (Hedera)
[ ] AI chain recommendation (DeFi use case)
[ ] AI chain recommendation (Gaming use case)
[ ] Live gas price fetching
[ ] Template generation (Next.js + Hedera)
[ ] Template generation (React + Ethereum)
[ ] Migration from Hedera-only to multi-chain
```

---

## 📊 Success Metrics

### Week 1 (Foundation)
- ✅ `BlockchainAdapter` interface complete
- ✅ HederaAdapter working (backward compatible)
- ✅ EthereumAdapter working
- ✅ Type system refactored

### Week 2 (AI & Analytics)
- ✅ Live gas prices fetching (all chains)
- ✅ AI recommendation engine functional
- ✅ `apix recommend-chain` command working
- ✅ `apix compare-chains` command working

### Week 3 (Solana & Base)
- ✅ SolanaAdapter working
- ✅ BaseAdapter working
- ✅ Templates refactored for all chains
- ✅ All CLI commands support `--chain` flag

### Week 4 (Testing & Docs)
- ✅ 90%+ test coverage
- ✅ All integration tests pass on testnets
- ✅ Documentation complete
- ✅ Migration guide published
- ✅ Ready for beta release

---

## 🚀 Future Extensibility

### Adding a New Blockchain (Example: Polygon)

**Estimated time**: 2-3 days

**Steps**:
1. **Create adapter** (4 hours):
   ```typescript
   // src/blockchain/adapters/PolygonAdapter.ts
   export class PolygonAdapter extends EthereumAdapter {
     // Override RPC URLs, chain ID, explorer
   }
   ```

2. **Define capabilities** (30 minutes):
   ```typescript
   const polygonCapabilities: ChainCapabilities = {
     ...ethereumCapabilities,
     averageTPS: 7000,
     averageFinalitySeconds: 2,
   }
   ```

3. **Create templates** (4 hours):
   - Can inherit from Ethereum templates
   - Add Polygon-specific examples

4. **Add to registry** (15 minutes):
   ```typescript
   // src/blockchain/core/ChainRegistry.ts
   registerChain({
     id: 'polygon',
     name: 'Polygon',
     adapter: PolygonAdapter,
     capabilities: polygonCapabilities,
     // ...
   })
   ```

5. **Update types** (15 minutes):
   ```typescript
   type SupportedChain = 'hedera' | 'ethereum' | 'solana' | 'base' | 'polygon'
   ```

6. **Add gas provider** (2 hours):
   ```typescript
   // src/blockchain/analytics/providers/PolygonGasProvider.ts
   // Use Polygon Gas Station API
   ```

7. **Create tests** (4 hours):
   - Unit tests
   - Integration tests on Mumbai testnet

8. **Documentation** (2 hours):
   - `docs/chains/polygon.md`
   - Update comparison table

**Total**: ~16 hours (2 days)

**No changes needed**:
- ✅ Core `BlockchainAdapter` interface
- ✅ `AdapterFactory`
- ✅ CLI commands
- ✅ AI recommendation engine (auto-includes new chain)
- ✅ Template engine

---

### Supported Future Chains (Roadmap)
- **Polygon** (EVM, easy - extends Ethereum)
- **Avalanche** (EVM, easy - extends Ethereum)
- **Arbitrum** (EVM L2, easy - extends Ethereum)
- **Optimism** (EVM L2, easy - extends Ethereum)
- **Cosmos** (Tendermint, medium - new adapter)
- **Polkadot** (Substrate, medium - new adapter)
- **Cardano** (UTXO, hard - very different model)
- **Tezos** (Account-based, medium)
- **NEAR** (Sharded, medium)

**Estimate**: 1 new chain per week at steady state.

---

## 🛠️ Dependencies & SDK Management

### Dependency Strategy: Lazy Loading

**Why**:
- Bundle size: 4 chain SDKs = 1MB+
- Most users only use 1-2 chains
- Optional dependencies allow selective installation

**Implementation**:
```json
// package.json
{
  "dependencies": {
    // Core (always installed)
    "commander": "^11.0.0",
    "chalk": "^5.3.0",
    "inquirer": "^9.2.0",
    "openai": "^4.20.0"
  },
  "optionalDependencies": {
    // Blockchain SDKs (lazy loaded)
    "@hashgraph/sdk": "^2.40.0",
    "hedera-agent-kit": "^3.0.0",
    "ethers": "^6.0.0",
    "@solana/web3.js": "^1.87.0",
    "@solana/spl-token": "^0.3.9",
    "@metaplex-foundation/js": "^0.19.0"
  }
}
```

**Lazy loading logic**:
```typescript
// src/blockchain/core/AdapterFactory.ts
async createAdapter(chain: SupportedChain): Promise<BlockchainAdapter> {
  switch (chain) {
    case 'hedera':
      // Check if SDK installed
      try {
        await import('@hashgraph/sdk')
      } catch {
        throw new Error('Hedera SDK not installed. Run: npm install @hashgraph/sdk')
      }
      return new HederaAdapter()

    case 'ethereum':
      try {
        await import('ethers')
      } catch {
        throw new Error('ethers.js not installed. Run: npm install ethers')
      }
      return new EthereumAdapter()

    // ... other chains
  }
}
```

**User experience**:
```bash
$ apix add token --chain ethereum
❌ Error: ethers.js not installed

💡 Install Ethereum SDK:
   npm install ethers

   Or install all chain SDKs:
   npm install

[Auto-install? Y/n] _
```

---

## 📝 Configuration Examples

### Single `.env` File (Multi-Chain)

```bash
# ===================================
# APIX Multi-Chain Configuration
# ===================================

# AI Provider (required for chain recommendations)
AI_PROVIDER=openai                    # 'openai' | 'anthropic' | 'groq'
OPENAI_API_KEY=sk-proj-...
# ANTHROPIC_API_KEY=sk-ant-...
# GROQ_API_KEY=gsk_...

# Analytics APIs (optional, for live gas prices)
ETHERSCAN_API_KEY=YOUR_KEY_HERE
COINMARKETCAP_API_KEY=YOUR_KEY_HERE

# ===================================
# Hedera Configuration
# ===================================
HEDERA_ACCOUNT_ID=0.0.12345
HEDERA_PRIVATE_KEY=302e020100300506032b6570...
HEDERA_NETWORK=testnet                # 'mainnet' | 'testnet'
HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

# ===================================
# Ethereum Configuration
# ===================================
ETHEREUM_PRIVATE_KEY=0xabcdef1234567890...
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY
ETHEREUM_NETWORK=sepolia              # 'mainnet' | 'sepolia' | 'goerli'
ETHEREUM_INFURA_KEY=your_infura_key
ETHEREUM_ALCHEMY_KEY=your_alchemy_key

# ===================================
# Solana Configuration
# ===================================
SOLANA_PRIVATE_KEY=[123,45,67,89,...]  # Array format or base58
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet                 # 'mainnet-beta' | 'devnet' | 'testnet'

# ===================================
# Base Configuration (L2)
# ===================================
BASE_PRIVATE_KEY=0xabcdef1234567890...
BASE_RPC_URL=https://sepolia.base.org
BASE_NETWORK=base-sepolia             # 'base' | 'base-sepolia'
```

### Environment Validation

```typescript
// src/config/EnvironmentValidator.ts
export class EnvironmentValidator {
  validateChainConfig(chain: SupportedChain): ValidationResult {
    switch (chain) {
      case 'hedera':
        return this.validateHedera()
      case 'ethereum':
        return this.validateEthereum()
      case 'solana':
        return this.validateSolana()
      case 'base':
        return this.validateBase()
    }
  }

  private validateHedera(): ValidationResult {
    const required = ['HEDERA_ACCOUNT_ID', 'HEDERA_PRIVATE_KEY', 'HEDERA_NETWORK']
    const missing = required.filter(key => !process.env[key])

    if (missing.length > 0) {
      return {
        valid: false,
        errors: [
          `Missing Hedera configuration: ${missing.join(', ')}`,
          'Add to .env file:',
          '  HEDERA_ACCOUNT_ID=0.0.12345',
          '  HEDERA_PRIVATE_KEY=302e...',
          '  HEDERA_NETWORK=testnet'
        ]
      }
    }

    // Validate format
    if (!/^0\.0\.\d+$/.test(process.env.HEDERA_ACCOUNT_ID!)) {
      return {
        valid: false,
        errors: ['Invalid HEDERA_ACCOUNT_ID format. Expected: 0.0.12345']
      }
    }

    return { valid: true }
  }

  // ... similar for other chains
}
```

---

## 🎨 CLI UX Examples

### Example 1: AI Chain Recommendation

```bash
$ apix recommend-chain

╔══════════════════════════════════════════════════════════╗
║  APIX Multi-Chain Recommendation Engine                 ║
╚══════════════════════════════════════════════════════════╝

Let's find the perfect blockchain for your project!

❓ What are you building?
   ❯ DeFi application
     NFT project
     Payment system
     Gaming platform
     Enterprise solution
     Other (describe)

❓ What's your priority?
   ❯ Lowest cost
     Highest speed
     Maximum decentralization
     Best developer tools
     Regulatory compliance

❓ Expected transaction volume?
   ❯ < 100/day
     100-1,000/day
     1,000-10,000/day
     > 10,000/day

❓ Tell us more about your project (optional):
   ▸ _

Analyzing... (fetching live gas prices)

┌────────────────────────────────────────────────────────┐
│ ✅ Recommended: Solana                                 │
├────────────────────────────────────────────────────────┤
│ Why Solana?                                            │
│ • Cost: ~$0.00025 per transaction                      │
│ • Speed: 3,000 TPS, 400ms finality                     │
│ • Gaming fit: Excellent for high-frequency operations  │
│ • Ecosystem: Strong gaming community, Unity SDK        │
│                                                         │
│ ⚠️  Considerations:                                     │
│ • Newer chain (less mature than Ethereum)              │
│ • Occasional network congestion during peak times      │
└────────────────────────────────────────────────────────┘

Alternative Options:
  2. Hedera  (Score: 82/100) - Lower fees, enterprise-grade
  3. Base    (Score: 75/100) - Ethereum L2, Coinbase integration
  4. Ethereum (Score: 65/100) - Most mature, higher costs

❓ Proceed with Solana? [Y/n] _
```

---

### Example 2: Chain Comparison

```bash
$ apix compare-chains

╔══════════════════════════════════════════════════════════╗
║  Multi-Chain Comparison (Live Data)                     ║
╚══════════════════════════════════════════════════════════╝

Last updated: 2025-11-23 14:32:15 UTC

┌────────────┬──────────────┬────────────┬───────────┬────────────┬─────────┐
│ Chain      │ Gas/Fee      │ TPS        │ Finality  │ Language   │ Wallets │
├────────────┼──────────────┼────────────┼───────────┼────────────┼─────────┤
│ Base       │ $0.10   🟢   │ 1,000  🟡  │ 2s    🟢  │ Solidity   │ 4       │
│ Ethereum   │ $5.20   🔴   │ 15     🔴  │ 3min  🔴  │ Solidity   │ 10+     │
│ Hedera     │ $0.0001 🟢   │ 10,000 🟢  │ 3s    🟢  │ Solidity   │ 3       │
│ Solana     │ $0.00025 🟢  │ 3,000  🟢  │ 0.4s  🟢  │ Rust       │ 5       │
└────────────┴──────────────┴────────────┴───────────┴────────────┴─────────┘

💡 Use Case Recommendations:
   • DeFi       → Ethereum (most mature ecosystem)
   • Gaming     → Solana (high TPS, low latency)
   • Enterprise → Hedera (compliance, fixed fees)
   • Payments   → Base (low fees, Coinbase integration)

❓ Want AI-powered personalized recommendation? [Y/n] _
```

---

### Example 3: Adding Integration (Chain Selection)

```bash
$ apix add token

╔══════════════════════════════════════════════════════════╗
║  Add Token Integration                                   ║
╚══════════════════════════════════════════════════════════╝

❓ How would you like to choose a blockchain?

   ❯ Let AI recommend (based on your needs)
     Compare all chains (see cost/speed table)
     Manual selection (I know which chain I want)

[User selects: Manual selection]

❓ Select blockchain:

   ❯ Base
     Ethereum
     Hedera
     Solana

[User selects: Ethereum]

Analyzing project... ━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

✅ Detected: Next.js 14.0.0
✅ Using TypeScript
✅ State: React Context

❓ Token details:
   Name:   My Token
   Symbol: MTK
   Supply: 1000000
   Decimals: 18

Generating Ethereum ERC-20 integration... ━━━━━━━━━━━━━━━ 100%

✅ Created Files:
   📄 src/contexts/EthereumContext.tsx
   📄 src/hooks/useERC20Token.ts
   📄 src/utils/ethereum-client.ts
   📄 src/contracts/MyToken.sol
   📄 scripts/deploy-token.ts

📦 Dependencies Added:
   • ethers@^6.0.0
   • @rainbow-me/rainbowkit@^2.0.0

📚 Next Steps:
   1. Configure Ethereum credentials in .env:
      ETHEREUM_PRIVATE_KEY=0x...
      ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...

   2. Deploy your token:
      npm run deploy:token

   3. Validate integration:
      apix validate --chain ethereum --testnet

🔗 Documentation: https://docs.apix.dev/chains/ethereum
```

---

## 🔒 Security Considerations

### Private Key Management
- **Never log private keys**
- **.env validation**: Check keys aren't committed to git
- **Mainnet warnings**: Explicit confirmation before mainnet operations
- **Key rotation**: Support for multiple accounts

### API Key Security
- **Rate limiting**: Cache API responses (1-hour TTL)
- **Fallback data**: Use static estimates if APIs fail
- **No sensitive data in logs**

### Smart Contract Security
- **Template audits**: All contract templates reviewed for common vulnerabilities
- **Security warnings**: Inform users about unaudited contracts
- **Testnet first**: Always recommend testnet testing before mainnet

---

## 📈 Performance Targets

### CLI Response Times
- `apix recommend-chain`: < 10 seconds (including AI + live APIs)
- `apix compare-chains`: < 3 seconds (cached data)
- `apix add token --chain <chain>`: < 5 seconds (template generation)
- `apix analyze`: < 2 seconds (project analysis)

### Bundle Size
- Core APIX: < 5MB
- Per-chain SDK (lazy loaded):
  - Hedera: ~500KB
  - Ethereum (ethers): ~200KB
  - Solana: ~350KB
  - Base: ~200KB (shares ethers)

### API Caching
- Gas prices: 1-hour cache
- Chain metadata: Session cache
- AI recommendations: No cache (always fresh)

---

## 🎯 Definition of Done

### Per-Chain Integration Checklist

```
Chain: _______________

Core Implementation:
[ ] BlockchainAdapter implemented
[ ] All required methods functional
[ ] Chain capabilities defined
[ ] Wallet providers implemented

Templates:
[ ] Token creation template
[ ] Token transfer template
[ ] NFT creation template (if applicable)
[ ] Smart contract deployment template
[ ] Wallet connection template (all frameworks: Next.js, React, Express, Vue)

Testing:
[ ] Unit tests (90%+ coverage)
[ ] Integration tests (real testnet)
[ ] E2E CLI workflow
[ ] Template compilation tests

Documentation:
[ ] Chain-specific docs (docs/chains/<chain>.md)
[ ] Configuration examples
[ ] Troubleshooting guide
[ ] Updated comparison table

Analytics:
[ ] Live gas/fee provider implemented
[ ] Cost comparison working
[ ] Performance metrics tracked

AI Integration:
[ ] Chain included in recommendation engine
[ ] Use case mappings defined
[ ] Scoring algorithm calibrated

Validation:
[ ] Real testnet token created
[ ] Real testnet contract deployed (if applicable)
[ ] Wallet connection verified
[ ] Explorer links working
```

---

## 🚦 Release Strategy

### Beta Release (v2.0.0-beta.1)
**Timeline**: End of Week 4

**Includes**:
- ✅ All 4 chains (Hedera, Ethereum, Solana, Base)
- ✅ AI chain recommendation
- ✅ Live gas price data
- ✅ Complete documentation
- ✅ Migration guide

**Known Limitations**:
- Some advanced features may be chain-specific
- Limited wallet provider support (1-2 per chain)
- Beta-quality error messages

### Stable Release (v2.0.0)
**Timeline**: 2-3 weeks after beta

**Improvements based on beta feedback**:
- Bug fixes
- UX refinements
- Performance optimizations
- Additional wallet providers
- Additional templates

### Future Releases (v2.1+)
- Additional chains (Polygon, Avalanche, etc.)
- Advanced features (staking, governance, bridges)
- Web UI (Electron app?)
- VSCode extension

---

## 🎓 Learning Resources (for Development)

### Hedera
- Docs: https://docs.hedera.com
- SDK: https://github.com/hashgraph/hedera-sdk-js
- Agent Kit: https://github.com/hashgraph/hedera-agent-kit

### Ethereum
- Docs: https://ethereum.org/developers
- ethers.js: https://docs.ethers.org/v6/
- Hardhat: https://hardhat.org

### Solana
- Docs: https://solana.com/docs
- Web3.js: https://solana-labs.github.io/solana-web3.js/
- Anchor: https://www.anchor-lang.com

### Base
- Docs: https://docs.base.org
- Coinbase SDK: https://docs.cdp.coinbase.com

---

## 📞 Support & Maintenance

### Issue Tracking
- GitHub Issues for bugs
- GitHub Discussions for features
- Discord community (future)

### Versioning
- Semantic versioning: MAJOR.MINOR.PATCH
- Beta releases: X.Y.Z-beta.N
- Breaking changes: MAJOR version bump

### Maintenance Plan
- Weekly dependency updates
- Monthly security audits
- Quarterly chain SDK updates
- As-needed template updates (when frameworks change)

---

## 🏁 Conclusion

This architecture plan provides a **solid, extensible foundation** for APIX to become a true multi-blockchain platform. Key principles:

1. **Chain-agnostic core** - No favoritism, no hard-coded assumptions
2. **Extensible by design** - Adding new chains takes 2-3 days, no core changes
3. **AI-powered intelligence** - Smart recommendations based on real requirements
4. **Production-ready quality** - Comprehensive testing, documentation, error handling
5. **Developer-friendly UX** - Interactive, educational, helpful

**Estimated total effort**: 3-4 weeks (160-200 hours)
**Result**: Production-ready multi-blockchain CLI with 4 fully-integrated chains and intelligent chain selection.

Ready to build the future of blockchain development tools! 🚀

---

**Next Steps**:
1. Review and approve this plan
2. Set up project tracking (GitHub Projects)
3. Begin Phase 1, Milestone 1.1: Core Interface Definition
4. Weekly progress reviews
5. Beta release at end of Week 4

**Questions? Feedback?** Let's align before starting development!
