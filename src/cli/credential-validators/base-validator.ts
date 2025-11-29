/**
 * Base Credential Validator
 *
 * Validates Base (Coinbase L2) credentials.
 * Base is EVM-compatible, so it reuses most of the Ethereum validation logic
 * but with Base-specific RPC endpoints.
 */

import { ChainCredentials, NetworkType } from '../../blockchain/core/types';

export class BaseValidator {
  /**
   * Get the RPC URL for Base network
   */
  private static getRpcUrl(credentials: ChainCredentials, network: NetworkType): string {
    // Check for custom RPC URL first
    if (credentials.customConfig?.rpcUrl) {
      return credentials.customConfig.rpcUrl;
    }

    // Check for Infura (Base support)
    if (credentials.infuraKey) {
      return network === 'mainnet'
        ? `https://base-mainnet.infura.io/v3/${credentials.infuraKey}`
        : `https://base-sepolia.infura.io/v3/${credentials.infuraKey}`;
    }

    // Check for Alchemy (Base support)
    if (credentials.alchemyKey) {
      return network === 'mainnet'
        ? `https://base-mainnet.g.alchemy.com/v2/${credentials.alchemyKey}`
        : `https://base-sepolia.g.alchemy.com/v2/${credentials.alchemyKey}`;
    }

    // Fall back to free public RPCs
    return network === 'mainnet'
      ? 'https://mainnet.base.org'
      : 'https://sepolia.base.org';
  }

  /**
   * Validate Base credentials by making a test API call
   * @param credentials - The credentials to validate
   * @param network - The network to validate against
   * @returns Validation result with account info or error
   */
  static async validate(
    credentials: ChainCredentials,
    network: NetworkType
  ): Promise<{ valid: boolean; error?: string; accountInfo?: { address: string; balance: string } }> {
    if (!credentials.privateKeyEVM) {
      return { valid: false, error: 'Missing private key (privateKeyEVM)' };
    }

    const rpcUrl = this.getRpcUrl(credentials, network);

    try {
      // Dynamic import to avoid loading ethers if not needed
      const { ethers } = await import('ethers');

      // Create provider
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Normalize private key (add 0x prefix if missing)
      let privateKey = credentials.privateKeyEVM;
      if (!privateKey.startsWith('0x')) {
        privateKey = `0x${privateKey}`;
      }

      // Create wallet
      const wallet = new ethers.Wallet(privateKey, provider);

      // Test with balance query
      const balance = await provider.getBalance(wallet.address);

      return {
        valid: true,
        accountInfo: {
          address: wallet.address,
          balance: ethers.formatEther(balance) + ' ETH',
        },
      };
    } catch (error: any) {
      let errorMessage = error.message || 'Unknown error';

      // Provide more helpful error messages
      if (errorMessage.includes('invalid private key')) {
        errorMessage = 'Invalid private key format';
      } else if (errorMessage.includes('could not detect network')) {
        errorMessage = 'Could not connect to Base RPC - check your configuration';
      } else if (errorMessage.includes('bad response')) {
        errorMessage = 'Invalid response from RPC provider - API key may be invalid';
      }

      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Validate private key format without making network call
   * @param privateKey - The private key to validate
   * @returns True if format appears valid (64 hex chars with optional 0x prefix)
   */
  static validatePrivateKeyFormat(privateKey: string): boolean {
    const key = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    return /^[0-9a-fA-F]{64}$/.test(key);
  }
}
