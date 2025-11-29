/**
 * APIX Multi-Chain Architecture Demo
 *
 * This script demonstrates the blockchain abstraction layer features
 * even though adapters aren't fully implemented yet.
 */

import { ChainRegistry } from './core/ChainRegistry'
import { ChainCapabilityDetector } from './core/ChainCapabilities'
import { FeatureMapper } from './core/FeatureMapper'
import { AdapterFactory } from './core/AdapterFactory'

console.log('================================================================================')
console.log('APIX Multi-Chain Architecture Demo')
console.log('================================================================================\n')

// 1. Chain Registry Demo
console.log('📊 CHAIN REGISTRY')
console.log('─'.repeat(80))

const allChains = ChainRegistry.getAllChains()
console.log(`\n✅ ${allChains.length} Blockchains Registered:\n`)

allChains.forEach(chain => {
  const statusEmoji = chain.status === 'stable' ? '✅' : '🚧'
  console.log(`${statusEmoji} ${chain.metadata.displayName}`)
  console.log(`   Status: ${chain.status}`)
  console.log(`   Cost: ~$${chain.estimatedCostPerTx.usd} per transaction`)
  console.log(`   TPS: ${chain.capabilities.averageTPS.toLocaleString()}`)
  console.log(`   Finality: ${chain.capabilities.averageFinalitySeconds}s`)
  console.log(`   SDK: ${chain.sdkPackages.join(', ')}`)
  console.log()
})

// 2. Chain Comparison
console.log('\n📈 CHAIN COMPARISON')
console.log('─'.repeat(80))

const comparison = ChainRegistry.compareChains(['hedera', 'ethereum', 'solana', 'base'])
console.log('\n| Chain     | TPS     | Finality | Cost/TX   | Status |')
console.log('|-----------|---------|----------|-----------|--------|')
comparison.forEach(c => {
  const tps = c.tps.toString().padEnd(7)
  const finality = `${c.finality}s`.padEnd(8)
  const cost = `$${c.costUSD}`.padEnd(9)
  const status = c.status.padEnd(6)
  console.log(`| ${c.displayName.padEnd(9)} | ${tps} | ${finality} | ${cost} | ${status} |`)
})

console.log('\n🏆 Performance Winners:')
console.log(`   Fastest TPS: ${ChainRegistry.getFastestChain()} (10,000 TPS)`)
console.log(`   Cheapest: ${ChainRegistry.getCheapestChain()} ($0.0001/tx)`)
console.log(`   Fastest Finality: ${ChainRegistry.getFastestFinalityChain()} (0.4s)`)

// 3. Capability Detection
console.log('\n\n🔍 CAPABILITY DETECTION')
console.log('─'.repeat(80))

console.log('\n✅ Chains with Native Token Services:')
const nativeTokenChains = ChainCapabilityDetector.findChainsByCapability('hasNativeTokens', true)
nativeTokenChains.forEach(chain => {
  const impl = FeatureMapper.getImplementation('token', chain)
  console.log(`   • ${chain}: ${impl?.standard} - ${impl?.feature}`)
})

console.log('\n✅ Chains with ERC-20 Support:')
const erc20Chains = ChainCapabilityDetector.findChainsByCapability('hasERC20', true)
erc20Chains.forEach(chain => {
  console.log(`   • ${chain}`)
})

console.log('\n✅ Chains with Consensus/Messaging Services:')
const consensusChains = ChainCapabilityDetector.findChainsByCapability('hasConsensusService', true)
consensusChains.forEach(chain => {
  const impl = FeatureMapper.getImplementation('consensus', chain)
  console.log(`   • ${chain}: ${impl?.feature}`)
})

// 4. Feature Mapping
console.log('\n\n🔄 FEATURE MAPPING')
console.log('─'.repeat(80))

console.log('\n💰 Token Standards Across Chains:\n')
const tokenComparison = FeatureMapper.compareImplementations('token')
tokenComparison?.chains.forEach(impl => {
  const similarityPercent = (impl.similarity * 100).toFixed(0)
  const emoji = impl.similarity >= 0.9 ? '✅' : impl.similarity >= 0.7 ? '⚠️' : '❌'
  console.log(`${emoji} ${impl.chain.padEnd(10)} - ${impl.feature}`)
  console.log(`   Similarity: ${similarityPercent}%`)
  console.log(`   Pros: ${impl.pros[0] || 'N/A'}`)
  if (impl.cons.length > 0) {
    console.log(`   Cons: ${impl.cons[0]}`)
  }
  console.log()
})

// 5. Smart Equivalents Demo
console.log('\n🧠 SMART EQUIVALENTS')
console.log('─'.repeat(80))

console.log('\n"I want to migrate from Hedera to Ethereum..."\n')

const migrations = [
  { type: 'token' as const, name: 'Fungible Tokens' },
  { type: 'nft' as const, name: 'NFTs' },
  { type: 'consensus' as const, name: 'Consensus/Messaging' },
]

migrations.forEach(({ type, name }) => {
  console.log(`${name}:`)
  const suggestion = FeatureMapper.getSuggestion('hedera', 'ethereum', type)
  console.log(`   ${suggestion}\n`)
})

// 6. Use Case Recommendations
console.log('\n💡 USE CASE RECOMMENDATIONS')
console.log('─'.repeat(80))

const useCases = [
  'High-frequency gaming platform',
  'Enterprise supply chain tracking',
  'DeFi lending protocol',
  'Consumer payment app',
  'NFT marketplace',
]

console.log()
useCases.forEach(useCase => {
  const rec = ChainRegistry.getRecommendedChain(useCase)
  console.log(`"${useCase}"`)
  console.log(`   → ${rec.chain.toUpperCase()}`)
  console.log(`   Reason: ${rec.reason}\n`)
})

// 7. Adapter Factory Demo
console.log('\n🏭 ADAPTER FACTORY')
console.log('─'.repeat(80))

async function demoAdapterFactory() {
  console.log('\n📦 Checking SDK Installation Status:\n')

  const chains: Array<'hedera' | 'ethereum' | 'solana' | 'base'> = [
    'hedera',
    'ethereum',
    'solana',
    'base',
  ]

  for (const chain of chains) {
    const instructions = await AdapterFactory.getInstallInstructions(chain)
    const statusEmoji = instructions.isInstalled ? '✅' : '❌'
    console.log(`${statusEmoji} ${chain.padEnd(10)} ${instructions.isInstalled ? 'Installed' : 'Not Installed'}`)
    if (!instructions.isInstalled) {
      console.log(`   Install: ${instructions.installCommand}`)
    }
  }

  console.log('\n🚀 Creating Adapters (will fail gracefully if SDK not installed):\n')

  for (const chain of chains) {
    try {
      const adapter = await AdapterFactory.createAdapter(chain)
      console.log(`✅ ${chain} adapter created (but not initialized)`)
    } catch (error: any) {
      if (error.code === 'INVALID_CREDENTIALS') {
        console.log(`ℹ️  ${chain} adapter: ${error.message.split('\n')[0]}`)
      } else {
        console.log(`❌ ${chain} adapter: ${error.message}`)
      }
    }
  }
}

demoAdapterFactory().then(() => {
  console.log('\n================================================================================')
  console.log('✅ Demo Complete!')
  console.log('================================================================================')
  console.log('\nKey Takeaways:')
  console.log('1. ✅ Chain Registry: 4 blockchains registered with full metadata')
  console.log('2. ✅ Capability Detection: Know what each chain supports before coding')
  console.log('3. ✅ Feature Mapping: Find equivalents across chains (HTS ↔ ERC-20 ↔ SPL)')
  console.log('4. ✅ Smart Recommendations: AI-powered chain selection based on use case')
  console.log('5. ✅ Adapter Factory: Lazy loading keeps bundle size small')
  console.log('\n🚀 Ready for Phase 1, Milestone 1.2: Implement HederaAdapter')
  console.log('================================================================================\n')
})
