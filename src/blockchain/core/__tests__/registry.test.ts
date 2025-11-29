/**
 * Tests for Chain Registry
 */

import { ChainRegistry } from '../ChainRegistry'

describe('ChainRegistry', () => {
  describe('Chain Information', () => {
    test('should get chain info', () => {
      const hederaInfo = ChainRegistry.getChain('hedera')
      expect(hederaInfo.chain).toBe('hedera')
      expect(hederaInfo.status).toBe('stable')
      expect(hederaInfo.sdkPackages).toContain('@hashgraph/sdk')
      expect(hederaInfo.estimatedCostPerTx.usd).toBe(0.0001)
    })

    test('should get all chains', () => {
      const allChains = ChainRegistry.getAllChains()
      expect(allChains.length).toBe(4)
      expect(allChains.map(c => c.chain)).toContain('hedera')
      expect(allChains.map(c => c.chain)).toContain('ethereum')
      expect(allChains.map(c => c.chain)).toContain('solana')
      expect(allChains.map(c => c.chain)).toContain('base')
    })

    test('should get stable chains', () => {
      const stableChains = ChainRegistry.getStableChains()
      expect(stableChains.length).toBeGreaterThan(0)
      expect(stableChains[0].status).toBe('stable')
    })
  })

  describe('Chain Comparison', () => {
    test('should compare chains by performance', () => {
      const comparison = ChainRegistry.compareChains(['hedera', 'ethereum', 'solana'])
      expect(comparison.length).toBe(3)

      const hedera = comparison.find(c => c.chain === 'hedera')
      expect(hedera?.tps).toBe(10000)
      expect(hedera?.finality).toBe(3)
      expect(hedera?.costUSD).toBe(0.0001)

      const ethereum = comparison.find(c => c.chain === 'ethereum')
      expect(ethereum?.tps).toBe(15)
      expect(ethereum?.costUSD).toBe(3.5)
    })

    test('should identify fastest chain', () => {
      const fastest = ChainRegistry.getFastestChain()
      expect(fastest).toBe('hedera')
    })

    test('should identify cheapest chain', () => {
      const cheapest = ChainRegistry.getCheapestChain()
      expect(cheapest).toBe('hedera')
    })

    test('should identify fastest finality', () => {
      const fastestFinality = ChainRegistry.getFastestFinalityChain()
      expect(fastestFinality).toBe('solana')
    })
  })

  describe('URL Utilities', () => {
    test('should generate explorer URLs', () => {
      const hederaUrl = ChainRegistry.getExplorerUrl('hedera', '0.0.12345-123456', 'testnet')
      expect(hederaUrl).toContain('hashscan.io')
      expect(hederaUrl).toContain('testnet')
      expect(hederaUrl).toContain('0.0.12345-123456')

      const ethUrl = ChainRegistry.getExplorerUrl('ethereum', '0xabc123', 'mainnet')
      expect(ethUrl).toContain('etherscan.io')
      expect(ethUrl).toContain('0xabc123')
    })

    test('should get RPC URLs', () => {
      const hederaRpc = ChainRegistry.getRPCUrl('hedera', 'testnet')
      expect(hederaRpc).toContain('mirrornode.hedera.com')

      const ethRpc = ChainRegistry.getRPCUrl('ethereum', 'testnet')
      expect(ethRpc).toContain('sepolia')
    })

    test('should get chain IDs', () => {
      const ethMainnetId = ChainRegistry.getChainId('ethereum', 'mainnet')
      expect(ethMainnetId).toBe(1)

      const ethSepoliaId = ChainRegistry.getChainId('ethereum', 'testnet')
      expect(ethSepoliaId).toBe(11155111)

      const baseMainnetId = ChainRegistry.getChainId('base', 'mainnet')
      expect(baseMainnetId).toBe(8453)
    })
  })

  describe('Use Case Recommendations', () => {
    test('should recommend chain for gaming', () => {
      const rec = ChainRegistry.getRecommendedChain('gaming platform')
      expect(rec.chain).toBe('solana')
      expect(rec.reason).toContain('High TPS')
    })

    test('should recommend chain for enterprise', () => {
      const rec = ChainRegistry.getRecommendedChain('enterprise supply chain')
      expect(rec.chain).toBe('hedera')
      expect(rec.reason).toContain('Enterprise')
    })

    test('should recommend chain for DeFi', () => {
      const rec = ChainRegistry.getRecommendedChain('DeFi lending protocol')
      expect(rec.chain).toBe('ethereum')
      expect(rec.reason).toContain('DeFi')
    })

    test('should recommend chain for payments', () => {
      const rec = ChainRegistry.getRecommendedChain('payment system')
      expect(rec.chain).toBe('base')
      expect(rec.reason).toContain('Coinbase')
    })
  })

  describe('Comparison Table', () => {
    test('should generate comparison table data', () => {
      const table = ChainRegistry.getComparisonTable()
      expect(table.length).toBe(4)

      const hedera = table.find(row => row.chain === 'Hedera')
      expect(hedera?.status).toBe('✅ Stable')
      expect(hedera?.avgFee).toBe('$0.0001')
      expect(hedera?.tps).toBe(10000)
      expect(hedera?.contracts).toContain('solidity')
    })
  })
})
