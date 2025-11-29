/**
 * Credential Setup Wizard
 *
 * Guides users through setting up blockchain credentials for their selected chain.
 * This wizard is triggered when generating code, ensuring credentials are ready
 * before creating integration files.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { SupportedChain, NetworkType, ChainCredentials } from '../blockchain/core/types';
import { EnvManager } from '../utils/env-manager';
import { BrowserLauncher } from '../utils/browser-launcher';
import {
  HederaValidator,
  EthereumValidator,
  SolanaValidator,
  BaseValidator,
} from './credential-validators';

/**
 * Result of credential setup
 */
export interface CredentialSetupResult {
  success: boolean;
  skipped: boolean;
  credentials?: ChainCredentials;
  error?: string;
}

/**
 * Information about a blockchain portal
 */
export interface ChainPortalInfo {
  name: string;
  url: string;
  description: string;
  requiredEnvVars: string[];
  optionalEnvVars?: string[];
}

/**
 * Portal information for each supported chain
 */
const CHAIN_PORTALS: Record<SupportedChain, ChainPortalInfo> = {
  hedera: {
    name: 'Hedera Portal',
    url: 'https://portal.hedera.com',
    description: 'Create a testnet/mainnet account to get your Account ID and Private Key',
    requiredEnvVars: ['HEDERA_ACCOUNT_ID', 'HEDERA_PRIVATE_KEY'],
  },
  ethereum: {
    name: 'Infura or Alchemy',
    url: 'https://app.infura.io',
    description: 'Get an API key for Ethereum RPC access',
    requiredEnvVars: ['ETH_PRIVATE_KEY'],
    optionalEnvVars: ['INFURA_API_KEY', 'ALCHEMY_API_KEY', 'ETH_RPC_URL'],
  },
  solana: {
    name: 'Solana Keypair',
    url: '', // Generated locally
    description: 'Generate or import a Solana keypair',
    requiredEnvVars: ['SOLANA_PRIVATE_KEY'],
  },
  base: {
    name: 'Base (via Infura/Alchemy)',
    url: 'https://app.infura.io',
    description: 'Get an API key for Base RPC access (EVM-compatible)',
    requiredEnvVars: ['BASE_PRIVATE_KEY'],
    optionalEnvVars: ['INFURA_API_KEY', 'ALCHEMY_API_KEY', 'BASE_RPC_URL'],
  },
};

/**
 * Credential Setup Wizard Class
 */
export class CredentialSetup {
  private chain: SupportedChain;
  private network: NetworkType;
  private envManager: EnvManager;

  constructor(chain: SupportedChain, network: NetworkType) {
    this.chain = chain;
    this.network = network;
    this.envManager = new EnvManager();
  }

  /**
   * Run the credential setup wizard
   */
  async runSetup(): Promise<CredentialSetupResult> {
    const portal = CHAIN_PORTALS[this.chain];

    console.log();
    console.log(chalk.cyan.bold(`🔐 Credential Setup for ${this.chain.charAt(0).toUpperCase() + this.chain.slice(1)}`));
    console.log(chalk.gray(`   Network: ${this.network}`));
    console.log();

    // Step 1: Check if credentials already exist
    const existingCheck = await this.checkExistingCredentials();

    if (existingCheck.hasAll) {
      // Validate existing credentials
      const spinner = ora(chalk.gray('Validating existing credentials...')).start();
      const validation = await this.validateCredentials(existingCheck.credentials);

      if (validation.valid) {
        spinner.succeed(chalk.green('Existing credentials validated!'));
        if (validation.accountInfo) {
          this.showAccountInfo(validation.accountInfo);
        }
        return { success: true, skipped: false, credentials: existingCheck.credentials };
      } else {
        spinner.fail(chalk.yellow(`Existing credentials invalid: ${validation.error}`));
        console.log(chalk.gray('   Let\'s set up new credentials.'));
        console.log();
      }
    } else if (existingCheck.hasSome) {
      console.log(chalk.yellow('⚠️  Partial credentials found. Let\'s complete the setup.'));
      console.log(chalk.gray(`   Missing: ${existingCheck.missing.join(', ')}`));
      console.log();
    }

    // Step 2: Ask user if they want to set up credentials now
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: chalk.cyan('Set up credentials now?'),
      default: true,
    }]);

    if (!proceed) {
      console.log(chalk.gray('   You can set up credentials later before generating code.'));
      return { success: false, skipped: true };
    }

    // Step 3: Run chain-specific setup with retry loop
    let credentials: ChainCredentials | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!credentials && attempts < maxAttempts) {
      attempts++;

      try {
        credentials = await this.runChainSpecificSetup();

        // Step 4: Validate credentials
        const spinner = ora(chalk.gray('Validating credentials...')).start();
        const validation = await this.validateCredentials(credentials);

        if (validation.valid) {
          spinner.succeed(chalk.green('Credentials validated!'));

          if (validation.accountInfo) {
            this.showAccountInfo(validation.accountInfo);
          }

          // Step 5: Save to .env file
          await this.saveCredentials(credentials);

          return { success: true, skipped: false, credentials };
        } else {
          spinner.fail(chalk.red(`Validation failed: ${validation.error}`));

          // Ask if they want to retry
          const { retry } = await inquirer.prompt([{
            type: 'confirm',
            name: 'retry',
            message: chalk.cyan('Would you like to try again?'),
            default: true,
          }]);

          if (!retry) {
            return { success: false, skipped: false, error: validation.error };
          }

          credentials = null; // Reset for retry
        }
      } catch (error: any) {
        console.log(chalk.red(`   Error: ${error.message}`));

        const { retry } = await inquirer.prompt([{
          type: 'confirm',
          name: 'retry',
          message: chalk.cyan('Would you like to try again?'),
          default: true,
        }]);

        if (!retry) {
          return { success: false, skipped: false, error: error.message };
        }
      }
    }

    return { success: false, skipped: false, error: 'Maximum retry attempts reached' };
  }

  /**
   * Check for existing credentials in .env
   */
  private async checkExistingCredentials(): Promise<{
    hasAll: boolean;
    hasSome: boolean;
    missing: string[];
    credentials: ChainCredentials;
  }> {
    const portal = CHAIN_PORTALS[this.chain];
    const result = await this.envManager.checkKeys(portal.requiredEnvVars);

    // Build credentials object from found values
    const credentials: ChainCredentials = {};
    const env = await this.envManager.load();

    // Map env vars to credential fields
    switch (this.chain) {
      case 'hedera':
        credentials.accountId = env.HEDERA_ACCOUNT_ID;
        credentials.privateKey = env.HEDERA_PRIVATE_KEY;
        break;
      case 'ethereum':
        credentials.privateKeyEVM = env.ETH_PRIVATE_KEY;
        credentials.infuraKey = env.INFURA_API_KEY;
        credentials.alchemyKey = env.ALCHEMY_API_KEY;
        if (env.ETH_RPC_URL) {
          credentials.customConfig = { rpcUrl: env.ETH_RPC_URL };
        }
        break;
      case 'solana':
        credentials.privateKeySolana = env.SOLANA_PRIVATE_KEY;
        break;
      case 'base':
        credentials.privateKeyEVM = env.BASE_PRIVATE_KEY;
        credentials.infuraKey = env.INFURA_API_KEY;
        credentials.alchemyKey = env.ALCHEMY_API_KEY;
        if (env.BASE_RPC_URL) {
          credentials.customConfig = { rpcUrl: env.BASE_RPC_URL };
        }
        break;
    }

    return {
      hasAll: result.hasAll,
      hasSome: result.hasSome,
      missing: result.missing,
      credentials,
    };
  }

  /**
   * Run chain-specific setup wizard
   */
  private async runChainSpecificSetup(): Promise<ChainCredentials> {
    switch (this.chain) {
      case 'hedera':
        return this.setupHedera();
      case 'ethereum':
        return this.setupEthereum();
      case 'solana':
        return this.setupSolana();
      case 'base':
        return this.setupBase();
      default:
        throw new Error(`Unsupported chain: ${this.chain}`);
    }
  }

  /**
   * Hedera credential setup
   */
  private async setupHedera(): Promise<ChainCredentials> {
    const portal = CHAIN_PORTALS.hedera;

    console.log(chalk.white.bold(`\n📋 ${portal.name} Setup`));
    console.log(chalk.gray(`   ${portal.description}`));
    console.log();

    // Offer to open browser
    const { openBrowser } = await inquirer.prompt([{
      type: 'confirm',
      name: 'openBrowser',
      message: chalk.cyan(`Open ${portal.url} in your browser?`),
      default: true,
    }]);

    if (openBrowser) {
      const opened = await BrowserLauncher.open(portal.url);
      if (opened) {
        console.log(chalk.gray(`   ${BrowserLauncher.getPlatformHint()}`));
      } else {
        console.log(chalk.yellow(`   Could not open browser. Please visit: ${portal.url}`));
      }

      console.log();
      console.log(chalk.gray('   Create or access your Hedera account, then come back here.'));

      await inquirer.prompt([{
        type: 'input',
        name: 'continue',
        message: chalk.cyan('Press Enter when ready...'),
      }]);
    }

    // Collect Account ID
    const { accountId } = await inquirer.prompt([{
      type: 'input',
      name: 'accountId',
      message: chalk.cyan('Hedera Account ID (e.g., 0.0.12345):'),
      validate: (input: string) => {
        if (!HederaValidator.validateAccountIdFormat(input)) {
          return 'Invalid format. Use format: 0.0.12345';
        }
        return true;
      },
    }]);

    // Collect Private Key
    const { privateKey } = await inquirer.prompt([{
      type: 'password',
      name: 'privateKey',
      message: chalk.cyan('Hedera Private Key:'),
      mask: '*',
      validate: (input: string) => {
        if (!HederaValidator.validatePrivateKeyFormat(input)) {
          return 'Private key seems too short (expected 64+ characters)';
        }
        return true;
      },
    }]);

    return { accountId, privateKey };
  }

  /**
   * Ethereum credential setup
   */
  private async setupEthereum(): Promise<ChainCredentials> {
    const portal = CHAIN_PORTALS.ethereum;

    console.log(chalk.white.bold(`\n📋 ${portal.name} Setup`));
    console.log(chalk.gray(`   ${portal.description}`));
    console.log();

    // Choose RPC provider
    const { provider } = await inquirer.prompt([{
      type: 'list',
      name: 'provider',
      message: chalk.cyan('Which RPC provider would you like to use?'),
      choices: [
        { name: '🔷 Infura (recommended)', value: 'infura' },
        { name: '⚗️  Alchemy', value: 'alchemy' },
        { name: '🔧 Custom RPC URL', value: 'custom' },
      ],
    }]);

    const credentials: ChainCredentials = {};

    if (provider === 'infura') {
      const { openBrowser } = await inquirer.prompt([{
        type: 'confirm',
        name: 'openBrowser',
        message: chalk.cyan('Open https://app.infura.io in your browser?'),
        default: true,
      }]);

      if (openBrowser) {
        await BrowserLauncher.open('https://app.infura.io');
        console.log(chalk.gray('   Create an account and get your API key.'));
        await inquirer.prompt([{
          type: 'input',
          name: 'continue',
          message: chalk.cyan('Press Enter when ready...'),
        }]);
      }

      const { infuraKey } = await inquirer.prompt([{
        type: 'input',
        name: 'infuraKey',
        message: chalk.cyan('Infura API Key:'),
        validate: (input: string) => EthereumValidator.validateApiKeyFormat(input) || 'API key seems too short',
      }]);

      credentials.infuraKey = infuraKey;

    } else if (provider === 'alchemy') {
      const { openBrowser } = await inquirer.prompt([{
        type: 'confirm',
        name: 'openBrowser',
        message: chalk.cyan('Open https://dashboard.alchemy.com in your browser?'),
        default: true,
      }]);

      if (openBrowser) {
        await BrowserLauncher.open('https://dashboard.alchemy.com');
        console.log(chalk.gray('   Create an account and get your API key.'));
        await inquirer.prompt([{
          type: 'input',
          name: 'continue',
          message: chalk.cyan('Press Enter when ready...'),
        }]);
      }

      const { alchemyKey } = await inquirer.prompt([{
        type: 'input',
        name: 'alchemyKey',
        message: chalk.cyan('Alchemy API Key:'),
        validate: (input: string) => EthereumValidator.validateApiKeyFormat(input) || 'API key seems too short',
      }]);

      credentials.alchemyKey = alchemyKey;

    } else {
      // Custom RPC
      const { rpcUrl } = await inquirer.prompt([{
        type: 'input',
        name: 'rpcUrl',
        message: chalk.cyan('Custom RPC URL:'),
        validate: (input: string) => input.startsWith('http') || 'Must be a valid URL starting with http',
      }]);

      credentials.customConfig = { rpcUrl };
    }

    // Collect Private Key
    console.log();
    console.log(chalk.gray('   Now enter your Ethereum wallet private key.'));
    console.log(chalk.yellow('   ⚠️  Never share this! APIX stores it locally in .env only.'));

    const { privateKeyEVM } = await inquirer.prompt([{
      type: 'password',
      name: 'privateKeyEVM',
      message: chalk.cyan('Private Key (with or without 0x prefix):'),
      mask: '*',
      validate: (input: string) => {
        if (!EthereumValidator.validatePrivateKeyFormat(input)) {
          return 'Invalid private key (expected 64 hex characters)';
        }
        return true;
      },
    }]);

    credentials.privateKeyEVM = privateKeyEVM;

    return credentials;
  }

  /**
   * Solana credential setup
   */
  private async setupSolana(): Promise<ChainCredentials> {
    console.log(chalk.white.bold('\n📋 Solana Keypair Setup'));
    console.log();

    const { method } = await inquirer.prompt([{
      type: 'list',
      name: 'method',
      message: chalk.cyan('How would you like to set up your Solana keypair?'),
      choices: [
        { name: '✨ Generate a new keypair', value: 'generate' },
        { name: '📥 Import existing (base64 secret key)', value: 'import' },
        { name: '📁 Import from keypair file', value: 'file' },
      ],
    }]);

    if (method === 'generate') {
      const spinner = ora(chalk.gray('Generating new Solana keypair...')).start();

      try {
        const keypair = await SolanaValidator.generateKeypair();
        spinner.succeed(chalk.green('New keypair generated!'));

        console.log();
        console.log(chalk.white.bold('   Your Solana Public Key:'));
        console.log(chalk.cyan(`   ${keypair.publicKey}`));
        console.log();

        // Auto-airdrop on testnet/devnet
        if (this.network === 'devnet' || this.network === 'testnet') {
          const { doAirdrop } = await inquirer.prompt([{
            type: 'confirm',
            name: 'doAirdrop',
            message: chalk.cyan(`Request 2 SOL airdrop on ${this.network}?`),
            default: true,
          }]);

          if (doAirdrop) {
            const airdropSpinner = ora(chalk.gray('Requesting airdrop...')).start();
            const airdropResult = await SolanaValidator.requestAirdrop(keypair.publicKey, this.network, 2);

            if (airdropResult.success) {
              airdropSpinner.succeed(chalk.green('Airdrop successful! 2 SOL received.'));
            } else {
              airdropSpinner.warn(chalk.yellow(`Airdrop failed: ${airdropResult.error}`));
              console.log(chalk.gray(`   You can manually airdrop with: solana airdrop 2 ${keypair.publicKey} --url ${this.network}`));
            }
          }
        } else {
          console.log(chalk.yellow('   Note: This is mainnet - you\'ll need to fund this account with real SOL.'));
        }

        return { privateKeySolana: keypair.privateKeyBase64 };

      } catch (error: any) {
        spinner.fail(chalk.red('Failed to generate keypair'));
        throw error;
      }

    } else if (method === 'import') {
      const { privateKeySolana } = await inquirer.prompt([{
        type: 'password',
        name: 'privateKeySolana',
        message: chalk.cyan('Base64-encoded secret key:'),
        mask: '*',
        validate: (input: string) => {
          if (!SolanaValidator.validatePrivateKeyFormat(input)) {
            return 'Invalid format (expected base64-encoded 64-byte secret key)';
          }
          return true;
        },
      }]);

      return { privateKeySolana };

    } else {
      // Import from file
      const { keypairPath } = await inquirer.prompt([{
        type: 'input',
        name: 'keypairPath',
        message: chalk.cyan('Path to keypair JSON file:'),
        default: '~/.config/solana/id.json',
      }]);

      return { keypairPath };
    }
  }

  /**
   * Base credential setup (reuses Ethereum flow with Base-specific messaging)
   */
  private async setupBase(): Promise<ChainCredentials> {
    console.log(chalk.white.bold('\n📋 Base (L2) Setup'));
    console.log(chalk.gray('   Base is EVM-compatible - uses the same credentials as Ethereum.'));
    console.log();

    // Reuse Ethereum setup
    const credentials = await this.setupEthereum();

    return credentials;
  }

  /**
   * Validate credentials against the blockchain
   */
  private async validateCredentials(credentials: ChainCredentials): Promise<{
    valid: boolean;
    error?: string;
    accountInfo?: Record<string, string>;
  }> {
    switch (this.chain) {
      case 'hedera':
        return HederaValidator.validate(credentials, this.network);
      case 'ethereum':
        return EthereumValidator.validate(credentials, this.network);
      case 'solana':
        return SolanaValidator.validate(credentials, this.network);
      case 'base':
        return BaseValidator.validate(credentials, this.network);
      default:
        return { valid: false, error: `Unsupported chain: ${this.chain}` };
    }
  }

  /**
   * Save credentials to .env file
   */
  private async saveCredentials(credentials: ChainCredentials): Promise<void> {
    const updates: Record<string, string> = {};

    switch (this.chain) {
      case 'hedera':
        if (credentials.accountId) updates.HEDERA_ACCOUNT_ID = credentials.accountId;
        if (credentials.privateKey) updates.HEDERA_PRIVATE_KEY = credentials.privateKey;
        break;

      case 'ethereum':
        if (credentials.privateKeyEVM) updates.ETH_PRIVATE_KEY = credentials.privateKeyEVM;
        if (credentials.infuraKey) updates.INFURA_API_KEY = credentials.infuraKey;
        if (credentials.alchemyKey) updates.ALCHEMY_API_KEY = credentials.alchemyKey;
        if (credentials.customConfig?.rpcUrl) updates.ETH_RPC_URL = credentials.customConfig.rpcUrl;
        break;

      case 'solana':
        if (credentials.privateKeySolana) updates.SOLANA_PRIVATE_KEY = credentials.privateKeySolana;
        break;

      case 'base':
        if (credentials.privateKeyEVM) updates.BASE_PRIVATE_KEY = credentials.privateKeyEVM;
        if (credentials.infuraKey) updates.INFURA_API_KEY = credentials.infuraKey;
        if (credentials.alchemyKey) updates.ALCHEMY_API_KEY = credentials.alchemyKey;
        if (credentials.customConfig?.rpcUrl) updates.BASE_RPC_URL = credentials.customConfig.rpcUrl;
        break;
    }

    await this.envManager.update(updates);

    console.log();
    console.log(chalk.green('   ✓ Credentials saved to .env'));
    console.log(chalk.gray(`     ${this.envManager.getPath()}`));
  }

  /**
   * Display account info after validation
   */
  private showAccountInfo(info: Record<string, string>): void {
    console.log();
    console.log(chalk.white.bold('   Account Info:'));
    for (const [key, value] of Object.entries(info)) {
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      console.log(chalk.gray(`   ${label}: `) + chalk.cyan(value));
    }
  }
}
