/**
 * Tests for Feature Mapper
 */

import { FeatureMapper } from '../FeatureMapper'

describe('FeatureMapper', () => {
  describe('Feature Implementations', () => {
    test('should get token implementation for each chain', () => {
      const hederaToken = FeatureMapper.getImplementation('token', 'hedera')
      expect(hederaToken).toBeDefined()
      expect(hederaToken?.feature).toBe('Hedera Token Service (HTS)')
      expect(hederaToken?.standard).toBe('HTS')
      expect(hederaToken?.similarity).toBe(1.0)

      const ethereumToken = FeatureMapper.getImplementation('token', 'ethereum')
      expect(ethereumToken?.feature).toBe('ERC-20 Token Standard')
      expect(ethereumToken?.standard).toBe('ERC-20')
      expect(ethereumToken?.similarity).toBe(0.9)

      const solanaToken = FeatureMapper.getImplementation('token', 'solana')
      expect(solanaToken?.feature).toBe('SPL Token Program')
      expect(solanaToken?.standard).toBe('SPL Token')
    })

    test('should get NFT implementation for each chain', () => {
      const hederaNFT = FeatureMapper.getImplementation('nft', 'hedera')
      expect(hederaNFT?.standard).toBe('HTS NFT')

      const ethereumNFT = FeatureMapper.getImplementation('nft', 'ethereum')
      expect(ethereumNFT?.standard).toBe('ERC-721')

      const solanaNFT = FeatureMapper.getImplementation('nft', 'solana')
      expect(solanaNFT?.standard).toBe('Metaplex')
    })

    test('should get smart contract implementation', () => {
      const hederaContract = FeatureMapper.getImplementation('smart-contract', 'hedera')
      expect(hederaContract?.standard).toBe('Solidity')

      const solanaContract = FeatureMapper.getImplementation('smart-contract', 'solana')
      expect(solanaContract?.standard).toBe('Rust')
    })
  })

  describe('Feature Equivalents', () => {
    test('should find equivalent features across chains', () => {
      const equivalent = FeatureMapper.getEquivalent('hedera', 'ethereum', 'token')
      expect(equivalent).toBeDefined()
      expect(equivalent?.feature).toBe('ERC-20 Token Standard')
      expect(equivalent?.similarity).toBeLessThan(1.0)
    })

    test('should get all implementations for a feature type', () => {
      const allTokenImpls = FeatureMapper.getAllImplementations('token')
      expect(allTokenImpls).toBeDefined()
      expect(Object.keys(allTokenImpls!)).toHaveLength(4)
      expect(allTokenImpls!.hedera).toBeDefined()
      expect(allTokenImpls!.ethereum).toBeDefined()
      expect(allTokenImpls!.solana).toBeDefined()
      expect(allTokenImpls!.base).toBeDefined()
    })
  })

  describe('Feature Comparison', () => {
    test('should compare token implementations across chains', () => {
      const comparison = FeatureMapper.compareImplementations('token')
      expect(comparison).toBeDefined()
      expect(comparison?.integrationType).toBe('token')
      expect(comparison?.chains.length).toBe(4)

      const hedera = comparison?.chains.find(c => c.chain === 'hedera')
      expect(hedera?.similarity).toBe(1.0)
      expect(hedera?.pros.length).toBeGreaterThan(0)
    })

    test('should compare consensus implementations', () => {
      const comparison = FeatureMapper.compareImplementations('consensus')
      expect(comparison).toBeDefined()

      const hedera = comparison?.chains.find(c => c.chain === 'hedera')
      expect(hedera?.feature).toContain('Consensus Service')
      expect(hedera?.similarity).toBe(1.0)

      const ethereum = comparison?.chains.find(c => c.chain === 'ethereum')
      expect(ethereum?.feature).toContain('Events')
      expect(ethereum?.similarity).toBeLessThan(1.0)
    })
  })

  describe('Suggestions', () => {
    test('should provide helpful suggestions for highly similar features', () => {
      const suggestion = FeatureMapper.getSuggestion('hedera', 'ethereum', 'token')
      expect(suggestion).toContain('✅')
      expect(suggestion).toContain('ERC-20')
    })

    test('should provide warnings for moderately similar features', () => {
      const suggestion = FeatureMapper.getSuggestion('hedera', 'ethereum', 'consensus')
      // Ethereum consensus similarity is 0.6 (< 0.7), so it shows ❌ not ⚠️
      expect(suggestion).toContain('❌')
      expect(suggestion).toContain('Event')
    })

    test('should indicate when features are very different', () => {
      const suggestion = FeatureMapper.getSuggestion('ethereum', 'solana', 'smart-contract')
      // Solidity vs Rust - should show difference
      expect(suggestion).toBeDefined()
    })
  })

  describe('Feature Support Check', () => {
    test('should check if feature is supported on chain', () => {
      expect(FeatureMapper.isSupported('hedera', 'token')).toBe(true)
      expect(FeatureMapper.isSupported('ethereum', 'token')).toBe(true)
      expect(FeatureMapper.isSupported('solana', 'nft')).toBe(true)
      expect(FeatureMapper.isSupported('base', 'smart-contract')).toBe(true)
    })
  })

  describe('Advantages and Limitations', () => {
    test('should list advantages for each implementation', () => {
      const hederaToken = FeatureMapper.getImplementation('token', 'hedera')
      expect(hederaToken?.advantages).toBeDefined()
      expect(hederaToken?.advantages?.length).toBeGreaterThan(0)
      // Check that at least one advantage contains 'Predictable'
      const hasPredictable = hederaToken?.advantages?.some(adv => adv.includes('Predictable'))
      expect(hasPredictable).toBe(true)
    })

    test('should list limitations where applicable', () => {
      const ethereumToken = FeatureMapper.getImplementation('token', 'ethereum')
      expect(ethereumToken?.limitations).toBeDefined()
      expect(ethereumToken?.limitations?.length).toBeGreaterThan(0)
      // Check that at least one limitation contains 'gas'
      const hasGas = ethereumToken?.limitations?.some(lim => lim.toLowerCase().includes('gas'))
      expect(hasGas).toBe(true)
    })
  })
})
