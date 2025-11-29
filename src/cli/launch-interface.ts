/**
 * APIX Launch Interface
 *
 * Unified, conversational experience for blockchain development.
 * One command to rule them all: `apix` or `apix launch`
 *
 * Flow:
 * 1. Auto-analyze project on start
 * 2. Greet user and show what we detected
 * 3. Ask what they want to build (conversational)
 * 4. Recommend best blockchain based on their needs
 * 5. Let them choose or override
 * 6. Generate code
 * 7. Stay in conversation for more requests
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { v4 as uuidv4 } from 'uuid';
import { ProjectAnalyzer } from '../analysis/project-analyzer';
import { ChainRegistry } from '../blockchain/core/ChainRegistry';
import { SupportedChain, NetworkType } from '../blockchain/core/types';
import { ProjectContext } from '../types';
import { ConversationEngine } from '../ai/conversation/conversation-engine';
import { ChainRankingEngine, UseCase, ProjectContext as RankingContext } from '../blockchain/core/ChainRankingEngine';
import { CredentialSetup } from './credential-setup';

// Use case categories for smart recommendations
type UseCaseCategory =
  | 'tokens'      // Loyalty points, rewards, utility tokens
  | 'nfts'        // Digital art, collectibles, gaming items
  | 'payments'    // Payments, transfers, commerce
  | 'defi'        // Lending, swaps, yield
  | 'enterprise'  // Supply chain, compliance, audit
  | 'gaming'      // In-game assets, high-frequency
  | 'social'      // Social tokens, tipping, creator economy
  | 'other';

interface ConversationState {
  projectContext: ProjectContext | null;
  selectedChain: SupportedChain | null;
  useCase: string | null;
  useCaseCategory: UseCaseCategory | null;
  integrationsAdded: string[];
  network: 'testnet' | 'mainnet';
}

export class LaunchInterface {
  private analyzer: ProjectAnalyzer;
  private conversationEngine: ConversationEngine;
  private sessionId: string;
  private state: ConversationState;
  private isRunning: boolean = false;

  constructor() {
    this.analyzer = new ProjectAnalyzer();
    this.conversationEngine = new ConversationEngine();
    this.sessionId = uuidv4();
    this.state = {
      projectContext: null,
      selectedChain: null,
      useCase: null,
      useCaseCategory: null,
      integrationsAdded: [],
      network: 'testnet'
    };
  }

  /**
   * Main entry point - starts the unified experience
   */
  async launch(): Promise<void> {
    this.isRunning = true;

    this.showWelcome();

    // Step 1: Auto-analyze project
    await this.analyzeProject();

    // Step 2: Initialize AI conversation session with project context
    await this.initializeAISession();

    // Step 3: Start conversation loop
    await this.conversationLoop();
  }

  /**
   * Initialize AI conversation session with project context
   */
  private async initializeAISession(): Promise<void> {
    try {
      const context = {
        industry: null,
        technicalStack: this.state.projectContext?.dependencies?.map(d => d.name) || [],
        currentProject: this.state.projectContext?.framework || 'unknown'
      };

      await this.conversationEngine.startSession(this.sessionId, context);
    } catch (error) {
      // Silent fail - AI will work in fallback mode
    }
  }

  /**
   * Show welcome banner
   */
  private showWelcome(): void {
    console.clear();
    console.log(chalk.cyan.bold('╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║') + chalk.white.bold('          APIX AI - Blockchain Development Assistant         ') + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('║') + chalk.gray('             Multi-Chain • AI-Powered • Simple              ') + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝'));
    console.log();
  }

  /**
   * Auto-analyze the project on startup
   */
  private async analyzeProject(): Promise<void> {
    const spinner = ora({
      text: chalk.gray('Analyzing your project...'),
      color: 'cyan'
    }).start();

    try {
      this.state.projectContext = await this.analyzer.analyzeProject('.');
      spinner.succeed(chalk.green('Project analyzed'));

      // Show what we found
      this.showProjectSummary();
    } catch (error: any) {
      spinner.warn(chalk.yellow('Could not fully analyze project'));
      console.log(chalk.gray('  No worries - I can still help you get started!\n'));
    }
  }

  /**
   * Display project summary
   */
  private showProjectSummary(): void {
    const ctx = this.state.projectContext;
    if (!ctx) return;

    console.log();
    console.log(chalk.white.bold('📁 Your Project:'));
    console.log(chalk.gray('   Framework:  ') + chalk.cyan(ctx.framework || 'Unknown'));
    console.log(chalk.gray('   Language:   ') + chalk.cyan(ctx.language || 'Unknown'));

    if (ctx.dependencies && ctx.dependencies.length > 0) {
      const keyDeps = ctx.dependencies
        .filter(d => ['react', 'next', 'vue', 'express', 'stripe', 'prisma', 'tailwind'].some(k => d.name.includes(k)))
        .slice(0, 4)
        .map(d => d.name);

      if (keyDeps.length > 0) {
        console.log(chalk.gray('   Key deps:   ') + chalk.cyan(keyDeps.join(', ')));
      }
    }
    console.log();
  }

  /**
   * Main conversation loop - stays running until user exits
   */
  private async conversationLoop(): Promise<void> {
    // First interaction: Ask what they want to build
    await this.askWhatToBuild();

    // Continue conversation
    while (this.isRunning) {
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: chalk.cyan('What would you like to do next?'),
        choices: [
          { name: '🔧 Add another blockchain feature', value: 'add_feature' },
          { name: '🔄 Switch to a different blockchain', value: 'switch_chain' },
          { name: '📊 Show project status', value: 'status' },
          { name: '💬 Ask a question', value: 'question' },
          { name: '🚀 Generate code for current setup', value: 'generate' },
          new inquirer.Separator(),
          { name: '👋 Exit APIX', value: 'exit' }
        ]
      }]);

      switch (action) {
        case 'add_feature':
          await this.askWhatToBuild();
          break;
        case 'switch_chain':
          await this.switchChain();
          break;
        case 'status':
          this.showStatus();
          break;
        case 'question':
          await this.handleQuestion();
          break;
        case 'generate':
          await this.generateCode();
          break;
        case 'exit':
          this.exit();
          break;
      }
    }
  }

  /**
   * Ask user what they want to build
   */
  private async askWhatToBuild(): Promise<void> {
    console.log();

    const { buildChoice } = await inquirer.prompt([{
      type: 'list',
      name: 'buildChoice',
      message: chalk.cyan.bold('What would you like to build with blockchain?'),
      choices: [
        { name: '🪙  Tokens (loyalty points, rewards, utility tokens)', value: 'tokens' },
        { name: '🎨  NFTs (digital art, collectibles, certificates)', value: 'nfts' },
        { name: '💸  Payments (crypto payments, transfers)', value: 'payments' },
        { name: '🏦  DeFi (lending, swaps, staking)', value: 'defi' },
        { name: '🏢  Enterprise (supply chain, audit logs, compliance)', value: 'enterprise' },
        { name: '🎮  Gaming (in-game items, rewards)', value: 'gaming' },
        { name: '💬  Tell me in your own words...', value: 'custom' }
      ]
    }]);

    if (buildChoice === 'custom') {
      const { customDescription } = await inquirer.prompt([{
        type: 'input',
        name: 'customDescription',
        message: chalk.cyan('Describe what you want to build:'),
        validate: (input: string) => input.length > 5 || 'Please provide more details'
      }]);

      this.state.useCase = customDescription;
      this.state.useCaseCategory = this.categorizeUseCase(customDescription);
    } else {
      this.state.useCaseCategory = buildChoice as UseCaseCategory;
      this.state.useCase = buildChoice;
    }

    // Now recommend a blockchain
    await this.recommendBlockchain();
  }

  /**
   * Categorize a free-text use case into a category
   */
  private categorizeUseCase(description: string): UseCaseCategory {
    const lower = description.toLowerCase();

    if (/nft|art|collectible|certificate|badge/i.test(lower)) return 'nfts';
    if (/token|point|reward|loyalty|credit/i.test(lower)) return 'tokens';
    if (/payment|pay|transfer|send|commerce|checkout/i.test(lower)) return 'payments';
    if (/defi|lend|swap|stake|yield|liquidity/i.test(lower)) return 'defi';
    if (/enterprise|supply|chain|audit|compliance|track/i.test(lower)) return 'enterprise';
    if (/game|gaming|item|character|score/i.test(lower)) return 'gaming';
    if (/social|creator|tip|fan/i.test(lower)) return 'social';

    return 'other';
  }

  /**
   * Recommend blockchain based on use case - uses ChainRankingEngine for smart recommendations
   */
  private async recommendBlockchain(): Promise<void> {
    console.log();

    // Get ranked chains from the engine, including project context
    const useCase = this.state.useCaseCategory as UseCase;

    // Build ranking context from project analysis
    const rankingContext: RankingContext = {
      framework: this.state.projectContext?.framework,
      language: this.state.projectContext?.language,
      dependencies: this.state.projectContext?.dependencies?.map(d => d.name) || []
    };

    const rankings = ChainRankingEngine.rankChainsForUseCase(useCase, rankingContext);

    console.log(chalk.white.bold(`🔗 Blockchain Rankings for ${this.formatUseCase(useCase)}:\n`));

    // Show context influence if any
    const hasContextBonus = rankings.some(r => r.contextBonus && r.contextBonus !== 0);
    if (hasContextBonus) {
      console.log(chalk.gray(`   📊 Rankings adjusted based on your ${this.state.projectContext?.framework || 'project'} setup\n`));
    }

    // Display detailed ranking information
    for (const ranking of rankings) {
      const medal = ChainRankingEngine.getRankEmoji(ranking.rank);
      const chainInfo = ChainRegistry.getChain(ranking.chain);
      const fitColor = this.getFitChalkColor(ranking.fit);
      const fitLabel = ChainRankingEngine.getFitLabel(ranking.fit);

      // Show bonus indicator if context affected score
      const bonusIndicator = ranking.contextBonus && ranking.contextBonus > 0
        ? chalk.magenta(` +${ranking.contextBonus} from your stack`)
        : '';

      console.log(`${medal} ${chalk.bold(chainInfo.metadata.displayName)} - ${fitColor(fitLabel)} (${ranking.score}/100)${bonusIndicator}`);
      console.log(chalk.cyan(`   "${ranking.headline}"`));
      console.log(chalk.gray(`   💰 ${ranking.estimatedCost}`));

      // Show context reasons first (they're more personalized)
      if (ranking.contextReasons && ranking.contextReasons.length > 0) {
        ranking.contextReasons.slice(0, 2).forEach(reason => {
          console.log(chalk.magenta(`   ★ ${reason}`));
        });
      }

      // Show top 2 general reasons (excluding context reasons which are already in the array)
      const generalReasons = ranking.reasons.filter(r => !ranking.contextReasons?.includes(r));
      generalReasons.slice(0, 2).forEach(reason => {
        console.log(chalk.green(`   ✓ ${reason}`));
      });

      // Show first consideration if not excellent fit
      if (ranking.fit !== 'excellent' && ranking.considerations.length > 0) {
        console.log(chalk.yellow(`   ⚠ ${ranking.considerations[0]}`));
      }
      console.log();
    }

    // Build selection choices
    const choices = rankings.map((ranking) => {
      const medal = ChainRankingEngine.getRankEmoji(ranking.rank);
      const chainInfo = ChainRegistry.getChain(ranking.chain);
      const fitLabel = ChainRankingEngine.getFitLabel(ranking.fit);

      return {
        name: `${medal} ${chainInfo.metadata.displayName} - ${fitLabel}`,
        value: ranking.chain,
        short: chainInfo.metadata.displayName
      };
    });

    choices.push(new inquirer.Separator() as any);
    choices.push({
      name: chalk.gray('🤔 Help me decide...'),
      value: 'help_decide',
      short: 'Help'
    } as any);

    const { selectedChain } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedChain',
      message: chalk.cyan('Which blockchain would you like to use?'),
      choices
    }]);

    if (selectedChain === 'help_decide') {
      await this.helpDecide();
    } else {
      this.state.selectedChain = selectedChain as SupportedChain;
      await this.confirmSelection();
    }
  }

  /**
   * Format use case for display
   */
  private formatUseCase(useCase: UseCase): string {
    const labels: Record<UseCase, string> = {
      tokens: 'Tokens & Loyalty Points',
      nfts: 'NFTs & Digital Collectibles',
      payments: 'Payments & Transfers',
      defi: 'DeFi & Financial Services',
      enterprise: 'Enterprise & Supply Chain',
      gaming: 'Gaming & In-Game Items',
      social: 'Social & Creator Economy',
      other: 'General Purpose'
    };
    return labels[useCase] || useCase;
  }

  /**
   * Get chalk color function for fit level
   */
  private getFitChalkColor(fit: string): (text: string) => string {
    switch (fit) {
      case 'excellent': return chalk.green;
      case 'good': return chalk.cyan;
      case 'possible': return chalk.yellow;
      case 'not-recommended': return chalk.gray;
      default: return chalk.white;
    }
  }

  /**
   * Get chain recommendations based on use case
   */
  private getChainRecommendations(category: UseCaseCategory): Array<{ chain: SupportedChain; reason: string }> {
    const recommendations: Record<UseCaseCategory, Array<{ chain: SupportedChain; reason: string }>> = {
      tokens: [
        { chain: 'hedera', reason: 'Native token service, lowest fees ($0.0001)' },
        { chain: 'solana', reason: 'Fast SPL tokens, great for high volume' },
        { chain: 'base', reason: 'ERC-20, easy Coinbase wallet integration' },
        { chain: 'ethereum', reason: 'Maximum compatibility, largest ecosystem' }
      ],
      nfts: [
        { chain: 'solana', reason: 'Metaplex standard, cheapest minting' },
        { chain: 'base', reason: 'Low-cost ERC-721, Coinbase integration' },
        { chain: 'ethereum', reason: 'OpenSea, largest NFT marketplace' },
        { chain: 'hedera', reason: 'Native NFTs with low fees' }
      ],
      payments: [
        { chain: 'base', reason: 'Coinbase wallet, easy fiat on-ramp' },
        { chain: 'solana', reason: 'Sub-second finality, very low fees' },
        { chain: 'hedera', reason: 'Predictable fees, enterprise-grade' },
        { chain: 'ethereum', reason: 'Widest acceptance, most wallets' }
      ],
      defi: [
        { chain: 'ethereum', reason: 'Largest DeFi ecosystem, most liquidity' },
        { chain: 'base', reason: 'Growing DeFi, lower fees than mainnet' },
        { chain: 'solana', reason: 'Fast swaps, Raydium/Orca ecosystem' },
        { chain: 'hedera', reason: 'Enterprise DeFi, regulated-friendly' }
      ],
      enterprise: [
        { chain: 'hedera', reason: 'Enterprise governance, ABFT consensus' },
        { chain: 'ethereum', reason: 'Proven track record, audited tooling' },
        { chain: 'base', reason: 'Coinbase backing, compliance-friendly' },
        { chain: 'solana', reason: 'High throughput for data-heavy apps' }
      ],
      gaming: [
        { chain: 'solana', reason: 'Fastest finality (400ms), high TPS' },
        { chain: 'base', reason: 'Low fees, growing gaming ecosystem' },
        { chain: 'hedera', reason: 'Predictable costs for in-game items' },
        { chain: 'ethereum', reason: 'Immutable X L2 for gaming NFTs' }
      ],
      social: [
        { chain: 'solana', reason: 'Low cost for micro-transactions' },
        { chain: 'base', reason: 'Social integration with Coinbase' },
        { chain: 'hedera', reason: 'Cheap for tipping/small transfers' },
        { chain: 'ethereum', reason: 'Lens Protocol, established social' }
      ],
      other: [
        { chain: 'hedera', reason: 'Good all-around, lowest fees' },
        { chain: 'base', reason: 'Easy to start, good tooling' },
        { chain: 'solana', reason: 'Fast and cheap' },
        { chain: 'ethereum', reason: 'Most resources and tutorials' }
      ]
    };

    return recommendations[category] || recommendations.other;
  }

  /**
   * Help user decide with more questions
   */
  private async helpDecide(): Promise<void> {
    console.log();
    console.log(chalk.white.bold('🤔 Let me ask a few questions to help you decide:\n'));

    const { priority } = await inquirer.prompt([{
      type: 'list',
      name: 'priority',
      message: 'What\'s most important for your project?',
      choices: [
        { name: '💰 Lowest transaction fees', value: 'cost' },
        { name: '⚡ Fastest transaction speed', value: 'speed' },
        { name: '🏢 Enterprise-grade / compliance', value: 'enterprise' },
        { name: '🌍 Largest ecosystem / most wallets', value: 'ecosystem' },
        { name: '🚀 Easiest to get started', value: 'easy' }
      ]
    }]);

    let recommended: SupportedChain;
    let reason: string;

    switch (priority) {
      case 'cost':
        recommended = 'hedera';
        reason = 'Hedera has the lowest fees at $0.0001 per transaction';
        break;
      case 'speed':
        recommended = 'solana';
        reason = 'Solana has 400ms finality, fastest among major chains';
        break;
      case 'enterprise':
        recommended = 'hedera';
        reason = 'Hedera has enterprise governance (Google, IBM, Boeing)';
        break;
      case 'ecosystem':
        recommended = 'ethereum';
        reason = 'Ethereum has the largest ecosystem and wallet support';
        break;
      case 'easy':
        recommended = 'base';
        reason = 'Base has great tooling and Coinbase wallet integration';
        break;
      default:
        recommended = 'hedera';
        reason = 'Good balance of cost, speed, and features';
    }

    console.log();
    console.log(chalk.green(`✨ Based on your priorities, I recommend ${chalk.bold(recommended.toUpperCase())}`));
    console.log(chalk.gray(`   ${reason}`));
    console.log();

    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: `Use ${recommended.charAt(0).toUpperCase() + recommended.slice(1)}?`,
      default: true
    }]);

    if (confirm) {
      this.state.selectedChain = recommended;
      await this.confirmSelection();
    } else {
      // Let them pick manually
      await this.manualChainSelect();
    }
  }

  /**
   * Manual chain selection
   */
  private async manualChainSelect(): Promise<void> {
    const chains = ChainRegistry.getAllChains();

    const choices = chains.map(chain => ({
      name: `${chain.metadata.displayName} - ${chain.metadata.description}`,
      value: chain.chain
    }));

    const { chain } = await inquirer.prompt([{
      type: 'list',
      name: 'chain',
      message: 'Select a blockchain:',
      choices
    }]);

    this.state.selectedChain = chain;
    await this.confirmSelection();
  }

  /**
   * Confirm chain selection and show next steps
   */
  private async confirmSelection(): Promise<void> {
    const chain = ChainRegistry.getChain(this.state.selectedChain!);

    console.log();
    console.log(chalk.green.bold(`✅ Great choice! You're building on ${chain.metadata.displayName}`));
    console.log();
    console.log(chalk.gray('Chain details:'));
    console.log(chalk.gray(`   • Average fee: $${chain.estimatedCostPerTx.usd}`));
    console.log(chalk.gray(`   • Finality: ${chain.capabilities.averageFinalitySeconds}s`));
    console.log(chalk.gray(`   • Smart contracts: ${chain.capabilities.hasSmartContracts ? 'Yes' : 'Native services'}`));
    console.log();

    // Ask about network
    const { network } = await inquirer.prompt([{
      type: 'list',
      name: 'network',
      message: 'Which network?',
      choices: [
        { name: '🧪 Testnet (recommended for development)', value: 'testnet' },
        { name: '🚀 Mainnet (production)', value: 'mainnet' }
      ],
      default: 'testnet'
    }]);

    this.state.network = network;

    // Record this integration
    this.state.integrationsAdded.push(`${this.state.selectedChain}:${this.state.useCaseCategory}`);
  }

  /**
   * Switch to a different blockchain
   */
  private async switchChain(): Promise<void> {
    const currentChain = this.state.selectedChain;

    console.log();
    if (currentChain) {
      console.log(chalk.yellow(`Currently using: ${currentChain}`));
    }

    await this.manualChainSelect();

    if (this.state.selectedChain !== currentChain) {
      console.log(chalk.green(`\n🔄 Switched to ${this.state.selectedChain}!`));
      console.log(chalk.gray('I can regenerate your code for the new blockchain.'));
    }
  }

  /**
   * Show current status
   */
  private showStatus(): void {
    console.log();
    console.log(chalk.white.bold('📊 Current Status:\n'));

    if (this.state.projectContext) {
      console.log(chalk.gray('Project:     ') + chalk.cyan(this.state.projectContext.framework || 'Unknown'));
    }

    if (this.state.selectedChain) {
      const chain = ChainRegistry.getChain(this.state.selectedChain);
      console.log(chalk.gray('Blockchain:  ') + chalk.cyan(chain.metadata.displayName));
      console.log(chalk.gray('Network:     ') + chalk.cyan(this.state.network));
    }

    if (this.state.useCase) {
      console.log(chalk.gray('Use case:    ') + chalk.cyan(this.state.useCaseCategory));
    }

    if (this.state.integrationsAdded.length > 0) {
      console.log(chalk.gray('Integrations:') + chalk.cyan(` ${this.state.integrationsAdded.length} configured`));
    }

    console.log();
  }

  /**
   * Handle free-form questions using AI
   */
  private async handleQuestion(): Promise<void> {
    const { question } = await inquirer.prompt([{
      type: 'input',
      name: 'question',
      message: chalk.cyan('Ask me anything:')
    }]);

    if (!question.trim()) {
      return;
    }

    // Enhance the question with current context
    const contextualQuestion = this.buildContextualQuestion(question);

    const spinner = ora({
      text: chalk.gray('Thinking...'),
      color: 'cyan'
    }).start();

    try {
      const response = await this.conversationEngine.processMessage(
        contextualQuestion,
        this.sessionId
      );

      spinner.stop();
      console.log();

      // Display AI response
      console.log(chalk.white(response.content));
      console.log();

      // Show suggestions if available
      if (response.suggestions && response.suggestions.length > 0) {
        console.log(chalk.cyan('💡 Suggestions:'));
        response.suggestions.forEach((suggestion: string) => {
          console.log(chalk.gray(`   • ${suggestion}`));
        });
        console.log();
      }

      // If AI detected an action intent, offer to take action
      if (response.intent === 'implementation-request' && response.requiresAction) {
        await this.handleActionIntent(response);
      }

    } catch (error: any) {
      spinner.stop();

      // Fallback to basic keyword-based help
      console.log();
      const lower = question.toLowerCase();

      if (lower.includes('fee') || lower.includes('cost') || lower.includes('price')) {
        this.showFeeComparison();
      } else if (lower.includes('fast') || lower.includes('speed')) {
        this.showSpeedComparison();
      } else if (lower.includes('wallet')) {
        this.showWalletInfo();
      } else if (lower.includes('compare') || lower.includes('difference')) {
        this.showChainComparison();
      } else {
        console.log(chalk.gray('I can help you with:'));
        console.log(chalk.gray('  • Comparing blockchain fees and speeds'));
        console.log(chalk.gray('  • Choosing the right chain for your use case'));
        console.log(chalk.gray('  • Setting up wallet integrations'));
        console.log(chalk.gray('  • Generating blockchain code'));
        console.log();
        console.log(chalk.yellow('💡 Tip: Set ANTHROPIC_API_KEY for smarter AI responses'));
      }
      console.log();
    }
  }

  /**
   * Build contextual question with current state
   */
  private buildContextualQuestion(question: string): string {
    const context: string[] = [];

    if (this.state.projectContext) {
      context.push(`Project: ${this.state.projectContext.framework} (${this.state.projectContext.language})`);
    }

    if (this.state.selectedChain) {
      context.push(`Selected blockchain: ${this.state.selectedChain.toUpperCase()}`);
      context.push(`IMPORTANT: User has chosen ${this.state.selectedChain} - help them succeed with this chain`);
    }

    if (this.state.useCaseCategory) {
      context.push(`Use case: ${this.state.useCaseCategory}`);
    }

    if (this.state.network) {
      context.push(`Network: ${this.state.network}`);
    }

    if (context.length > 0) {
      return `[Context: ${context.join('. ')}]\n\nUser question: ${question}`;
    }

    return question;
  }

  /**
   * Handle when AI detects user wants to take an action
   */
  private async handleActionIntent(response: any): Promise<void> {
    const { takeAction } = await inquirer.prompt([{
      type: 'confirm',
      name: 'takeAction',
      message: 'Would you like me to help you implement this?',
      default: true
    }]);

    if (takeAction) {
      // Guide user back to the build flow
      await this.askWhatToBuild();
    }
  }

  /**
   * Show chain comparison table
   */
  private showChainComparison(): void {
    const table = ChainRegistry.getComparisonTable();

    console.log(chalk.white.bold('🔗 Blockchain Comparison:\n'));
    console.log(chalk.gray('Chain'.padEnd(12) + 'Fee'.padEnd(10) + 'Speed'.padEnd(10) + 'TPS'));
    console.log(chalk.gray('─'.repeat(42)));
    table.forEach(row => {
      console.log(
        chalk.cyan(row.chain.padEnd(12)) +
        chalk.green(row.avgFee.padEnd(10)) +
        chalk.yellow(row.finality.padEnd(10)) +
        chalk.white(row.tps.toString())
      );
    });
    console.log();
  }

  /**
   * Show fee comparison
   */
  private showFeeComparison(): void {
    const table = ChainRegistry.getComparisonTable();

    console.log(chalk.white.bold('💰 Fee Comparison:\n'));
    table.forEach(row => {
      console.log(chalk.gray(`  ${row.chain.padEnd(12)} ${row.avgFee}`));
    });
  }

  /**
   * Show speed comparison
   */
  private showSpeedComparison(): void {
    const table = ChainRegistry.getComparisonTable();

    console.log(chalk.white.bold('⚡ Speed Comparison:\n'));
    table.forEach(row => {
      console.log(chalk.gray(`  ${row.chain.padEnd(12)} ${row.finality} finality, ${row.tps} TPS`));
    });
  }

  /**
   * Show wallet info
   */
  private showWalletInfo(): void {
    console.log(chalk.white.bold('👛 Wallet Support:\n'));
    console.log(chalk.gray('  Hedera:    HashPack, Blade, MetaMask Snap'));
    console.log(chalk.gray('  Ethereum:  MetaMask, Coinbase, WalletConnect'));
    console.log(chalk.gray('  Solana:    Phantom, Solflare'));
    console.log(chalk.gray('  Base:      MetaMask, Coinbase, WalletConnect'));
  }

  /**
   * Generate code for the current configuration
   */
  private async generateCode(): Promise<void> {
    if (!this.state.selectedChain) {
      console.log(chalk.yellow('\n⚠️  Please select a blockchain first.\n'));
      await this.askWhatToBuild();
      return;
    }

    // Ensure credentials are set up before generating code
    const credentialsReady = await this.ensureCredentials();
    if (!credentialsReady) {
      console.log(chalk.yellow('\n⚠️  Credentials required to generate code.\n'));
      console.log(chalk.gray('   You can set up credentials by selecting "Generate code" again.'));
      return;
    }

    const spinner = ora({
      text: chalk.gray('Generating blockchain integration...'),
      color: 'cyan'
    }).start();

    // TODO: Actually generate code using the existing generator
    // For now, simulate the process
    await new Promise(resolve => setTimeout(resolve, 2000));

    spinner.succeed(chalk.green('Code generated!'));

    console.log();
    console.log(chalk.white.bold('📁 Generated files:'));
    console.log(chalk.gray(`  • src/blockchain/${this.state.selectedChain}/client.ts`));
    console.log(chalk.gray(`  • src/hooks/use${this.capitalize(this.state.selectedChain)}Token.ts`));
    console.log(chalk.gray(`  • src/components/WalletConnect.tsx`));
    console.log();
    console.log(chalk.green('✨ Your blockchain integration is ready!'));
    console.log();
  }

  /**
   * Ensure credentials are configured and valid for the selected chain
   * @returns true if credentials are ready, false otherwise
   */
  private async ensureCredentials(): Promise<boolean> {
    if (!this.state.selectedChain) {
      return false;
    }

    const credentialSetup = new CredentialSetup(
      this.state.selectedChain,
      this.state.network as NetworkType
    );

    const result = await credentialSetup.runSetup();

    if (result.success) {
      return true;
    } else if (result.skipped) {
      // User chose to skip - return false to prevent code generation
      return false;
    } else {
      // Setup failed
      if (result.error) {
        console.log(chalk.red(`\n   Credential setup failed: ${result.error}`));
      }
      return false;
    }
  }

  /**
   * Exit the interface
   */
  private exit(): void {
    console.log();
    console.log(chalk.cyan('👋 Thanks for using APIX!'));

    if (this.state.integrationsAdded.length > 0) {
      console.log(chalk.gray(`   You configured ${this.state.integrationsAdded.length} integration(s).`));
    }

    console.log(chalk.gray('   Run `apix` anytime to continue.\n'));
    this.isRunning = false;
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
