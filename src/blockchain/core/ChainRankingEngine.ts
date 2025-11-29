/**
 * Chain Ranking Engine
 *
 * Intelligently ranks blockchains based on use case.
 * Provides personalized recommendations with specific reasons.
 */

import { SupportedChain } from './types';
import { ChainRegistry } from './ChainRegistry';

// Use case categories
export type UseCase =
  | 'tokens'      // Loyalty points, rewards, utility tokens
  | 'nfts'        // Digital art, collectibles, certificates
  | 'payments'    // Crypto payments, transfers
  | 'defi'        // Lending, swaps, staking
  | 'enterprise'  // Supply chain, audit logs, compliance
  | 'gaming'      // In-game items, rewards
  | 'social'      // Social tokens, tipping
  | 'other';

// Chain ranking result
export interface ChainRanking {
  chain: SupportedChain;
  rank: number;
  score: number;              // 0-100
  fit: 'excellent' | 'good' | 'possible' | 'not-recommended';
  headline: string;           // Short tagline for this use case
  reasons: string[];          // Why this chain for this use case
  considerations: string[];   // Things to be aware of
  estimatedCost: string;      // Cost estimate for this use case
  contextBonus?: number;      // Bonus/penalty from project context
  contextReasons?: string[];  // Why context affected the score
}

// Project context for smart ranking
export interface ProjectContext {
  framework?: string;         // react, next, node, vue, etc.
  language?: string;          // typescript, javascript, python, etc.
  dependencies?: string[];    // List of dependency names
}

// Scoring matrix: chain -> use case -> score (0-100)
const CHAIN_USE_CASE_SCORES: Record<SupportedChain, Record<UseCase, number>> = {
  hedera: {
    tokens: 95,      // Native HTS, lowest fees
    nfts: 70,        // Supports NFTs but smaller ecosystem
    payments: 85,    // Fast, cheap, predictable
    defi: 50,        // Limited DeFi ecosystem
    enterprise: 98,  // Built for enterprise
    gaming: 75,      // Good speed, low fees
    social: 80,      // Cheap micro-transactions
    other: 85
  },
  ethereum: {
    tokens: 90,      // ERC-20 standard, most widely accepted
    nfts: 85,        // OpenSea, largest marketplace
    payments: 60,    // High fees, but most accepted
    defi: 98,        // Largest DeFi ecosystem
    enterprise: 80,  // Proven, but expensive
    gaming: 50,      // Too slow/expensive for gaming
    social: 60,      // High fees for micro-tx
    other: 80
  },
  solana: {
    tokens: 85,      // SPL tokens, fast and cheap
    nfts: 95,        // Metaplex, cheapest minting
    payments: 90,    // Sub-second, very cheap
    defi: 80,        // Growing DeFi (Raydium, Orca)
    enterprise: 55,  // Less enterprise focus
    gaming: 98,      // Best for gaming (speed + cost)
    social: 90,      // Perfect for micro-transactions
    other: 80
  },
  base: {
    tokens: 85,      // ERC-20 compatible, low fees
    nfts: 80,        // Growing ecosystem, Coinbase
    payments: 95,    // Coinbase integration, fiat on-ramp
    defi: 75,        // Growing DeFi ecosystem
    enterprise: 70,  // Coinbase backing adds credibility
    gaming: 80,      // Good balance of speed/cost
    social: 85,      // Good for social apps
    other: 80
  }
};

// Use-case-specific descriptions for each chain
const CHAIN_USE_CASE_DETAILS: Record<SupportedChain, Record<UseCase, {
  headline: string;
  reasons: string[];
  considerations: string[];
  costEstimate: string;
}>> = {
  hedera: {
    tokens: {
      headline: 'Native token service with lowest fees',
      reasons: [
        'Native HTS (Hedera Token Service) - no smart contracts needed',
        'Fixed $0.0001 per transaction - predictable costs',
        'Built-in compliance features (KYC, freeze, clawback)',
        'Enterprise governance (Google, IBM, Boeing)'
      ],
      considerations: [
        'Smaller DeFi ecosystem for token liquidity',
        'Less wallet support than Ethereum'
      ],
      costEstimate: 'Token creation: ~$1 | Transfers: $0.0001'
    },
    nfts: {
      headline: 'Low-cost NFTs with enterprise features',
      reasons: [
        'Native NFT support via HTS',
        'Lowest minting costs ($0.05 per NFT)',
        'Built-in royalty enforcement'
      ],
      considerations: [
        'Smaller NFT marketplace ecosystem',
        'Less collector base than Ethereum/Solana',
        'Fewer NFT tools and platforms'
      ],
      costEstimate: 'Mint: ~$0.05 | Transfer: $0.0001'
    },
    payments: {
      headline: 'Enterprise-grade payments with predictable fees',
      reasons: [
        'Fixed $0.0001 transaction fee',
        '3-5 second finality',
        'Carbon-negative network',
        'Regulatory-friendly design'
      ],
      considerations: [
        'Fewer payment gateway integrations',
        'Less mainstream wallet support'
      ],
      costEstimate: 'Per payment: $0.0001 (fixed)'
    },
    defi: {
      headline: 'Emerging DeFi with enterprise focus',
      reasons: [
        'Lower fees than Ethereum mainnet',
        'SaucerSwap and other DEXes available'
      ],
      considerations: [
        'Much smaller DeFi ecosystem',
        'Limited liquidity compared to Ethereum',
        'Fewer DeFi protocols available'
      ],
      costEstimate: 'Swap: ~$0.01 | Liquidity: ~$0.05'
    },
    enterprise: {
      headline: 'Built for enterprise from the ground up',
      reasons: [
        'Governed by Fortune 500 companies',
        'ABFT consensus (bank-grade security)',
        'Predictable, fixed transaction fees',
        'Built-in compliance (SOC2, GDPR ready)',
        'Hedera Consensus Service for audit trails'
      ],
      considerations: [
        'Requires enterprise mindset shift to DLT'
      ],
      costEstimate: 'Audit log entry: $0.0001 | Smart contract: ~$1'
    },
    gaming: {
      headline: 'Fast and cheap for in-game assets',
      reasons: [
        '3-5 second finality',
        'Predictable low costs for items',
        'Native token support for currencies'
      ],
      considerations: [
        'Smaller gaming ecosystem',
        'Fewer game SDKs available'
      ],
      costEstimate: 'Item mint: ~$0.05 | Transfer: $0.0001'
    },
    social: {
      headline: 'Affordable micro-transactions',
      reasons: [
        '$0.0001 per transaction enables tipping',
        'Hedera Consensus Service for social feeds'
      ],
      considerations: [
        'Less social app ecosystem',
        'Fewer integrations'
      ],
      costEstimate: 'Tip/Like: $0.0001'
    },
    other: {
      headline: 'Versatile enterprise blockchain',
      reasons: [
        'Good all-around performance',
        'Lowest transaction fees',
        'Enterprise-ready'
      ],
      considerations: [
        'Evaluate based on specific needs'
      ],
      costEstimate: 'Varies by use case'
    }
  },

  ethereum: {
    tokens: {
      headline: 'The gold standard for tokens (ERC-20)',
      reasons: [
        'ERC-20 is the most widely accepted token standard',
        'Maximum liquidity and exchange listings',
        'Most wallets support Ethereum tokens',
        'Largest developer ecosystem'
      ],
      considerations: [
        'High gas fees ($1-10 per transfer)',
        'Variable costs make budgeting hard',
        'Consider L2s (Base, Arbitrum) for lower fees'
      ],
      costEstimate: 'Token creation: $50-200 | Transfer: $1-10'
    },
    nfts: {
      headline: 'Largest NFT marketplace ecosystem',
      reasons: [
        'OpenSea, Blur, and major marketplaces',
        'Largest collector base',
        'ERC-721 is the standard',
        'Most established provenance'
      ],
      considerations: [
        'High minting costs ($5-50 per NFT)',
        'Gas fees can spike during demand',
        'Consider L2s for cheaper minting'
      ],
      costEstimate: 'Mint: $5-50 | Transfer: $2-10'
    },
    payments: {
      headline: 'Most widely accepted, but expensive',
      reasons: [
        'Accepted by most crypto payment processors',
        'Highest trust and recognition',
        'Most wallet options'
      ],
      considerations: [
        'High fees make small payments impractical',
        '12-15 second finality',
        'Better for large transactions'
      ],
      costEstimate: 'Per payment: $1-10 (variable)'
    },
    defi: {
      headline: 'The home of DeFi - maximum liquidity',
      reasons: [
        'Uniswap, Aave, Compound - all major protocols',
        'Deepest liquidity pools',
        'Most battle-tested smart contracts',
        'Widest protocol integrations'
      ],
      considerations: [
        'High gas fees for transactions',
        'MEV (front-running) concerns',
        'Complex for beginners'
      ],
      costEstimate: 'Swap: $5-30 | Lending: $10-50'
    },
    enterprise: {
      headline: 'Proven track record, premium cost',
      reasons: [
        'Most audited and battle-tested',
        'Largest talent pool',
        'Regulatory clarity in many jurisdictions',
        'Enterprise Ethereum Alliance support'
      ],
      considerations: [
        'High operational costs',
        'Scalability limitations on mainnet',
        'Consider L2s or private chains'
      ],
      costEstimate: 'Smart contract deploy: $100-500'
    },
    gaming: {
      headline: 'Not ideal for gaming (slow, expensive)',
      reasons: [
        'Immutable X L2 available for gaming',
        'Strong NFT infrastructure'
      ],
      considerations: [
        'Too slow for real-time gaming (12s blocks)',
        'Too expensive for frequent transactions',
        'Use L2s like Immutable X instead'
      ],
      costEstimate: 'Not recommended for direct use'
    },
    social: {
      headline: 'Lens Protocol, but high fees',
      reasons: [
        'Lens Protocol for decentralized social',
        'Strong identity solutions'
      ],
      considerations: [
        'Fees too high for micro-transactions',
        'Better suited for high-value social actions'
      ],
      costEstimate: 'Post: $1-5 (impractical for most)'
    },
    other: {
      headline: 'Most established, highest fees',
      reasons: [
        'Largest ecosystem',
        'Most developer resources',
        'Widest adoption'
      ],
      considerations: [
        'High costs',
        'Consider L2s for better economics'
      ],
      costEstimate: 'Varies, generally $1-50 per tx'
    }
  },

  solana: {
    tokens: {
      headline: 'Fast SPL tokens with low fees',
      reasons: [
        'SPL token standard - fast and cheap',
        'Growing DeFi ecosystem for liquidity',
        '400ms finality for quick confirmations'
      ],
      considerations: [
        'Less wallet support than Ethereum',
        'Past network stability issues (improving)',
        'Different tooling than EVM chains'
      ],
      costEstimate: 'Token creation: ~$0.01 | Transfer: $0.00025'
    },
    nfts: {
      headline: 'The best choice for NFTs - cheapest minting',
      reasons: [
        'Metaplex standard - industry proven',
        'Minting costs under $0.01',
        'Magic Eden, Tensor marketplaces',
        'Compressed NFTs for even lower costs',
        'Strong creator community'
      ],
      considerations: [
        'Smaller collector base than Ethereum',
        'Less mainstream recognition'
      ],
      costEstimate: 'Mint: $0.01-0.05 | Compressed: $0.0001'
    },
    payments: {
      headline: 'Lightning fast, nearly free payments',
      reasons: [
        '400ms finality - near instant',
        '$0.00025 per transaction',
        'Solana Pay for merchant integration',
        'Great for high-volume, low-value payments'
      ],
      considerations: [
        'Less mainstream merchant adoption',
        'Fewer fiat on-ramps than Base'
      ],
      costEstimate: 'Per payment: $0.00025'
    },
    defi: {
      headline: 'Fast-growing DeFi ecosystem',
      reasons: [
        'Raydium, Orca, Jupiter aggregator',
        'Fast execution for trading',
        'Low fees enable more strategies'
      ],
      considerations: [
        'Less liquidity than Ethereum',
        'Fewer established protocols',
        'Past exploit incidents'
      ],
      costEstimate: 'Swap: $0.001 | Liquidity: $0.01'
    },
    enterprise: {
      headline: 'Speed-focused, less enterprise features',
      reasons: [
        'High throughput for data-heavy apps',
        'Low costs for high-volume operations'
      ],
      considerations: [
        'Less enterprise governance',
        'Past network outages raise concerns',
        'Fewer compliance tools',
        'Less regulatory clarity'
      ],
      costEstimate: 'Transaction: $0.00025'
    },
    gaming: {
      headline: 'Perfect for gaming - fastest and cheapest',
      reasons: [
        '400ms finality - real-time viable',
        '3,000+ TPS capacity',
        'Cheapest in-game transactions',
        'Growing gaming ecosystem',
        'Star Atlas, Aurory and more'
      ],
      considerations: [
        'Need to handle network congestion',
        'Different development paradigm'
      ],
      costEstimate: 'In-game action: $0.00025'
    },
    social: {
      headline: 'Ideal for social - fast, cheap micro-tx',
      reasons: [
        'Perfect for likes, tips, reactions',
        'Sub-second confirmation',
        'Negligible costs per action'
      ],
      considerations: [
        'Less social protocol infrastructure',
        'Building from scratch more likely'
      ],
      costEstimate: 'Social action: $0.00025'
    },
    other: {
      headline: 'High performance, low cost',
      reasons: [
        'Best raw performance',
        'Lowest fees for high volume',
        'Active developer community'
      ],
      considerations: [
        'Different from EVM ecosystem',
        'Learning curve for Rust'
      ],
      costEstimate: '$0.00025 per transaction'
    }
  },

  base: {
    tokens: {
      headline: 'ERC-20 compatible with Coinbase integration',
      reasons: [
        'Full ERC-20 compatibility',
        'Much lower fees than Ethereum mainnet',
        'Easy Coinbase wallet onboarding',
        'Ethereum security via L2'
      ],
      considerations: [
        'Newer chain, smaller ecosystem',
        'Less liquidity than mainnet'
      ],
      costEstimate: 'Token creation: $1-5 | Transfer: $0.01-0.05'
    },
    nfts: {
      headline: 'Affordable NFTs with Coinbase reach',
      reasons: [
        'Low minting costs ($0.10-0.50)',
        'Coinbase wallet integration',
        'Access to Coinbase user base',
        'ERC-721 compatible'
      ],
      considerations: [
        'Smaller marketplace ecosystem',
        'Less established than Ethereum/Solana'
      ],
      costEstimate: 'Mint: $0.10-0.50 | Transfer: $0.01'
    },
    payments: {
      headline: 'Best for payments - Coinbase + fiat on-ramp',
      reasons: [
        'Direct Coinbase integration',
        'Easy fiat on/off ramps',
        'Low fees ($0.01-0.05)',
        'Familiar Ethereum tooling',
        'USDC native support'
      ],
      considerations: [
        'Centralization concerns (Coinbase)',
        'Newer ecosystem'
      ],
      costEstimate: 'Per payment: $0.01-0.05'
    },
    defi: {
      headline: 'Growing DeFi with Ethereum compatibility',
      reasons: [
        'Uniswap, Aave deploying on Base',
        'Lower fees than mainnet',
        'Familiar EVM tooling'
      ],
      considerations: [
        'Less liquidity than mainnet',
        'Fewer protocols (but growing fast)'
      ],
      costEstimate: 'Swap: $0.05-0.20'
    },
    enterprise: {
      headline: 'Coinbase backing adds credibility',
      reasons: [
        'Coinbase is publicly traded, regulated',
        'Familiar Ethereum tooling',
        'Lower costs than mainnet'
      ],
      considerations: [
        'Centralization around Coinbase',
        'Less battle-tested than mainnet',
        'Newer regulatory landscape'
      ],
      costEstimate: 'Contract deploy: $5-20'
    },
    gaming: {
      headline: 'Good balance for casual gaming',
      reasons: [
        'Low enough fees for gaming',
        '2-3 second finality',
        'Easy onboarding via Coinbase'
      ],
      considerations: [
        'Not as fast as Solana',
        'Smaller gaming ecosystem'
      ],
      costEstimate: 'In-game action: $0.01-0.05'
    },
    social: {
      headline: 'Social with easy onboarding',
      reasons: [
        'Coinbase wallet = easy user onboarding',
        'Low fees for social actions',
        'Farcaster integration'
      ],
      considerations: [
        'Still building social infrastructure'
      ],
      costEstimate: 'Social action: $0.01-0.05'
    },
    other: {
      headline: 'Ethereum L2 with Coinbase backing',
      reasons: [
        'Best of Ethereum with lower fees',
        'Strong institutional backing',
        'Easy mainstream onboarding'
      ],
      considerations: [
        'Relatively new',
        'Dependent on Coinbase'
      ],
      costEstimate: '$0.01-0.05 per transaction'
    }
  }
};

// SDK/Framework support by chain
// Scores: 10 = excellent native support, 5 = good support, 0 = basic/community, -5 = limited
const SDK_SUPPORT: Record<SupportedChain, {
  frameworks: Record<string, number>;
  languages: Record<string, number>;
  relatedDeps: Record<string, { bonus: number; reason: string }>;
}> = {
  ethereum: {
    frameworks: {
      react: 10,      // ethers.js, wagmi, web3-react all excellent
      next: 10,       // Same as React
      vue: 8,         // Good vue-dapp support
      node: 10,       // ethers.js, web3.js excellent
      express: 10,
      python: 8,      // web3.py is mature
    },
    languages: {
      typescript: 10, // Full types for ethers, wagmi
      javascript: 10,
      python: 8,
    },
    relatedDeps: {
      'ethers': { bonus: 15, reason: 'Already using ethers.js - perfect for Ethereum/Base' },
      'web3': { bonus: 15, reason: 'Already using web3.js - perfect for Ethereum/Base' },
      'wagmi': { bonus: 15, reason: 'Already using wagmi - perfect for Ethereum/Base' },
      '@stripe/stripe-js': { bonus: 5, reason: 'Stripe integration pairs well with Base for fiat on-ramp' },
      'viem': { bonus: 15, reason: 'Already using viem - perfect for Ethereum/Base' },
    }
  },
  base: {
    frameworks: {
      react: 10,      // Same as Ethereum (EVM)
      next: 10,
      vue: 8,
      node: 10,
      express: 10,
      python: 8,
    },
    languages: {
      typescript: 10,
      javascript: 10,
      python: 8,
    },
    relatedDeps: {
      'ethers': { bonus: 15, reason: 'Already using ethers.js - works seamlessly with Base' },
      'web3': { bonus: 15, reason: 'Already using web3.js - works seamlessly with Base' },
      'wagmi': { bonus: 15, reason: 'Already using wagmi - works seamlessly with Base' },
      '@stripe/stripe-js': { bonus: 10, reason: 'Stripe + Base = great payment experience with fiat on-ramp' },
      '@stripe/react-stripe-js': { bonus: 10, reason: 'Stripe + Base = seamless payments with Coinbase integration' },
      'viem': { bonus: 15, reason: 'Already using viem - works seamlessly with Base' },
    }
  },
  solana: {
    frameworks: {
      react: 8,       // @solana/wallet-adapter-react good
      next: 8,
      vue: 5,         // Less mature
      node: 8,        // @solana/web3.js good
      express: 8,
      python: 6,      // solana-py exists but less mature
    },
    languages: {
      typescript: 8,  // Good types but not as complete as ethers
      javascript: 8,
      python: 5,      // Less mature
      rust: 10,       // Native Solana development
    },
    relatedDeps: {
      '@solana/web3.js': { bonus: 20, reason: 'Already using Solana SDK - perfect match!' },
      '@solana/wallet-adapter-react': { bonus: 20, reason: 'Already using Solana wallet adapter' },
      '@metaplex-foundation/js': { bonus: 15, reason: 'Already using Metaplex - great for NFTs' },
    }
  },
  hedera: {
    frameworks: {
      react: 6,       // hashconnect available
      next: 6,
      vue: 4,         // Limited
      node: 8,        // @hashgraph/sdk good
      express: 8,
      python: 5,      // hedera-sdk-py exists
      java: 10,       // Native enterprise SDK
    },
    languages: {
      typescript: 7,  // Types available
      javascript: 7,
      python: 5,
      java: 10,       // Best SDK
    },
    relatedDeps: {
      '@hashgraph/sdk': { bonus: 20, reason: 'Already using Hedera SDK - perfect match!' },
      'hashconnect': { bonus: 15, reason: 'Already using HashConnect - great for Hedera' },
    }
  }
};

/**
 * Chain Ranking Engine
 */
export class ChainRankingEngine {

  /**
   * Get ranked chains for a specific use case
   * @param useCase The use case category
   * @param context Optional project context to influence rankings
   */
  static rankChainsForUseCase(useCase: UseCase, context?: ProjectContext): ChainRanking[] {
    const chains: SupportedChain[] = ['hedera', 'ethereum', 'solana', 'base'];

    const rankings: ChainRanking[] = chains.map(chain => {
      const baseScore = CHAIN_USE_CASE_SCORES[chain][useCase];
      const details = CHAIN_USE_CASE_DETAILS[chain][useCase];

      // Calculate context bonus
      const { bonus: contextBonus, reasons: contextReasons } = context
        ? this.calculateContextBonus(chain, context)
        : { bonus: 0, reasons: [] };

      // Final score (capped at 100)
      const finalScore = Math.min(100, baseScore + contextBonus);

      return {
        chain,
        rank: 0, // Will be set after sorting
        score: finalScore,
        fit: this.scoreToFit(finalScore),
        headline: details.headline,
        reasons: [...details.reasons, ...contextReasons],
        considerations: details.considerations,
        estimatedCost: details.costEstimate,
        contextBonus,
        contextReasons
      };
    });

    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);

    // Assign ranks
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return rankings;
  }

  /**
   * Calculate bonus/penalty based on project context
   */
  private static calculateContextBonus(
    chain: SupportedChain,
    context: ProjectContext
  ): { bonus: number; reasons: string[] } {
    let bonus = 0;
    const reasons: string[] = [];
    const support = SDK_SUPPORT[chain];

    // Framework bonus
    if (context.framework) {
      const frameworkLower = context.framework.toLowerCase();
      const frameworkScore = support.frameworks[frameworkLower] ?? 5;

      if (frameworkScore >= 10) {
        bonus += 5;
        reasons.push(`Excellent ${context.framework} SDK support`);
      } else if (frameworkScore >= 8) {
        bonus += 3;
        reasons.push(`Good ${context.framework} SDK available`);
      } else if (frameworkScore <= 4) {
        bonus -= 5;
        reasons.push(`Limited ${context.framework} SDK support`);
      }
    }

    // Language bonus
    if (context.language) {
      const langLower = context.language.toLowerCase();
      const langScore = support.languages[langLower] ?? 5;

      if (langScore >= 10) {
        bonus += 3;
        reasons.push(`Full ${context.language} type definitions`);
      } else if (langScore <= 4) {
        bonus -= 3;
      }
    }

    // Dependency bonuses (strongest signal)
    if (context.dependencies) {
      for (const dep of context.dependencies) {
        const depInfo = support.relatedDeps[dep];
        if (depInfo) {
          bonus += depInfo.bonus;
          reasons.push(depInfo.reason);
        }
      }
    }

    return { bonus, reasons };
  }

  /**
   * Convert score to fit category
   */
  private static scoreToFit(score: number): ChainRanking['fit'] {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'possible';
    return 'not-recommended';
  }

  /**
   * Get the best chain for a use case
   */
  static getBestChainForUseCase(useCase: UseCase): ChainRanking {
    const rankings = this.rankChainsForUseCase(useCase);
    return rankings[0];
  }

  /**
   * Get ranking medal emoji
   */
  static getRankEmoji(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '  ';
    }
  }

  /**
   * Get fit color for display
   */
  static getFitColor(fit: ChainRanking['fit']): string {
    switch (fit) {
      case 'excellent': return 'green';
      case 'good': return 'cyan';
      case 'possible': return 'yellow';
      case 'not-recommended': return 'gray';
    }
  }

  /**
   * Get fit label
   */
  static getFitLabel(fit: ChainRanking['fit']): string {
    switch (fit) {
      case 'excellent': return 'Excellent fit';
      case 'good': return 'Good fit';
      case 'possible': return 'Possible';
      case 'not-recommended': return 'Not recommended';
    }
  }
}
