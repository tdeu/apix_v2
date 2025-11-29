/**
 * Tests for Chain Capabilities System
 */

import {
  ChainCapabilityDetector,
  CHAIN_CAPABILITIES,
  CHAIN_METADATA,
} from '../ChainCapabilities'

describe('ChainCapabilities', () => {
  describe('Chain Metadata', () => {
    test('should have metadata for all supported chains', () => {
      expect(CHAIN_METADATA.hedera).toBeDefined()
      expect(CHAIN_METADATA.ethereum).toBeDefined()
      expect(CHAIN_METADATA.solana).toBeDefined()
      expect(CHAIN_METADATA.base).toBeDefined()
    })

    test('should have correct native tokens', () => {
      expect(CHAIN_METADATA.hedera.nativeToken).toBe('HBAR')
      expect(CHAIN_METADATA.ethereum.nativeToken).toBe('ETH')
      expect(CHAIN_METADATA.solana.nativeToken).toBe('SOL')
      expect(CHAIN_METADATA.base.nativeToken).toBe('ETH')
    })

    test('should have explorer URLs for mainnet and testnet', () => {
      expect(CHAIN_METADATA.hedera.explorerUrl.mainnet).toContain('hashscan.io')
      expect(CHAIN_METADATA.hedera.explorerUrl.testnet).toContain('hashscan.io')
      expect(CHAIN_METADATA.ethereum.explorerUrl.mainnet).toContain('etherscan.io')
      expect(CHAIN_METADATA.solana.explorerUrl.mainnet).toContain('explorer.solana.com')
      expect(CHAIN_METADATA.base.explorerUrl.mainnet).toContain('basescan.org')
    })
  })

  describe('Capability Detection', () => {
    test('should get capabilities for each chain', () => {
      const hederaCaps = ChainCapabilityDetector.getCapabilities('hedera')
      expect(hederaCaps.hasNativeTokens).toBe(true)
      expect(hederaCaps.hasERC20).toBe(false)
      expect(hederaCaps.hasConsensusService).toBe(true)

      const ethCaps = ChainCapabilityDetector.getCapabilities('ethereum')
      expect(ethCaps.hasNativeTokens).toBe(false)
      expect(ethCaps.hasERC20).toBe(true)
      expect(ethCaps.hasConsensusService).toBe(false)

      const solCaps = ChainCapabilityDetector.getCapabilities('solana')
      expect(solCaps.hasNativeTokens).toBe(true)
      expect(solCaps.contractLanguage).toBe('rust')
    })

    test('should check if chain has specific capability', () => {
      expect(ChainCapabilityDetector.hasCapability('hedera', 'hasNativeTokens')).toBe(true)
      expect(ChainCapabilityDetector.hasCapability('ethereum', 'hasERC20')).toBe(true)
      expect(ChainCapabilityDetector.hasCapability('solana', 'hasERC721')).toBe(false)
    })

    test('should find chains by capability', () => {
      const nativeTokenChains = ChainCapabilityDetector.findChainsByCapability('hasNativeTokens', true)
      expect(nativeTokenChains).toContain('hedera')
      expect(nativeTokenChains).toContain('solana')
      expect(nativeTokenChains).not.toContain('ethereum')

      const erc20Chains = ChainCapabilityDetector.findChainsByCapability('hasERC20', true)
      expect(erc20Chains).toContain('ethereum')
      expect(erc20Chains).toContain('base')
      expect(erc20Chains).not.toContain('hedera')
    })
  })

  describe('Performance Comparison', () => {
    test('should compare performance metrics', () => {
      const comparison = ChainCapabilityDetector.comparePerformance([
        'hedera',
        'ethereum',
        'solana',
      ])

      expect(comparison.length).toBe(3)
      expect(comparison[0].chain).toBe('hedera')
      expect(comparison[0].tps).toBe(10000)
      expect(comparison[0].finality).toBe(3)
    })

    test('should identify fastest chain by TPS', () => {
      const fastest = ChainCapabilityDetector.getFastestChain()
      expect(fastest).toBe('hedera') // 10,000 TPS
    })

    test('should identify fastest finality', () => {
      const fastestFinality = ChainCapabilityDetector.getFastestFinality()
      expect(fastestFinality).toBe('solana') // 0.4 seconds
    })
  })

  describe('Capability Descriptions', () => {
    test('should provide human-readable descriptions', () => {
      const desc = ChainCapabilityDetector.getCapabilityDescription('hasNativeTokens')
      expect(desc).toContain('Native token service')
    })
  })
})
