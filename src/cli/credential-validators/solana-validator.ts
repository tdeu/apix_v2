/**
 * Solana Credential Validator
 *
 * Validates Solana credentials by attempting to query the account balance.
 * Supports keypair generation and airdrop for testnet/devnet.
 */

import { ChainCredentials, NetworkType } from '../../blockchain/core/types';
import * as fs from 'fs-extra';
import * as path from 'path';

export class SolanaValidator {
  /**
   * Get the cluster URL for the network
   */
  private static getClusterUrl(network: NetworkType, customRpc?: string): string {
    if (customRpc) {
      return customRpc;
    }

    switch (network) {
      case 'mainnet':
        return 'https://api.mainnet-beta.solana.com';
      case 'testnet':
        return 'https://api.testnet.solana.com';
      case 'devnet':
      default:
        return 'https://api.devnet.solana.com';
    }
  }

  /**
   * Validate Solana credentials by making a test API call
   * @param credentials - The credentials to validate
   * @param network - The network to validate against
   * @returns Validation result with account info or error
   */
  static async validate(
    credentials: ChainCredentials,
    network: NetworkType
  ): Promise<{ valid: boolean; error?: string; accountInfo?: { publicKey: string; balance: string } }> {
    if (!credentials.privateKeySolana && !credentials.keypairPath) {
      return { valid: false, error: 'Missing Solana private key or keypair path' };
    }

    try {
      // Dynamic import to avoid loading SDK if not needed
      const { Connection, Keypair, LAMPORTS_PER_SOL } = await import('@solana/web3.js');

      // Get keypair from credentials
      let keypair: InstanceType<typeof Keypair>;

      if (credentials.privateKeySolana) {
        // Parse base64-encoded secret key
        const secretKey = Buffer.from(credentials.privateKeySolana, 'base64');
        keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
      } else if (credentials.keypairPath) {
        // Load from file
        const resolvedPath = credentials.keypairPath.startsWith('~')
          ? path.join(process.env.HOME || process.env.USERPROFILE || '', credentials.keypairPath.slice(1))
          : credentials.keypairPath;

        if (!await fs.pathExists(resolvedPath)) {
          return { valid: false, error: `Keypair file not found: ${resolvedPath}` };
        }

        const keypairData = await fs.readJson(resolvedPath);
        keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
      } else {
        return { valid: false, error: 'No valid credential source' };
      }

      // Create connection
      const clusterUrl = this.getClusterUrl(network, credentials.customConfig?.rpcUrl);
      const connection = new Connection(clusterUrl, 'confirmed');

      // Test with balance query
      const balance = await connection.getBalance(keypair.publicKey);

      return {
        valid: true,
        accountInfo: {
          publicKey: keypair.publicKey.toString(),
          balance: (balance / LAMPORTS_PER_SOL).toFixed(4) + ' SOL',
        },
      };
    } catch (error: any) {
      let errorMessage = error.message || 'Unknown error';

      // Provide more helpful error messages
      if (errorMessage.includes('Invalid secret key')) {
        errorMessage = 'Invalid private key format (expected base64-encoded 64-byte secret key)';
      } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
        errorMessage = 'Could not connect to Solana RPC - check network connectivity';
      }

      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Generate a new Solana keypair
   * @returns The generated keypair info including base64 secret key
   */
  static async generateKeypair(): Promise<{
    publicKey: string;
    privateKeyBase64: string;
  }> {
    const { Keypair } = await import('@solana/web3.js');

    const keypair = Keypair.generate();
    const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');

    return {
      publicKey: keypair.publicKey.toString(),
      privateKeyBase64,
    };
  }

  /**
   * Request an airdrop of SOL on devnet/testnet
   * @param publicKey - The public key to receive the airdrop
   * @param network - The network (must be devnet or testnet)
   * @param amount - Amount in SOL (default: 2)
   * @returns Result of the airdrop request
   */
  static async requestAirdrop(
    publicKey: string,
    network: NetworkType,
    amount: number = 2
  ): Promise<{ success: boolean; error?: string; signature?: string }> {
    if (network === 'mainnet') {
      return { success: false, error: 'Airdrops are not available on mainnet' };
    }

    try {
      const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');

      const clusterUrl = this.getClusterUrl(network);
      const connection = new Connection(clusterUrl, 'confirmed');

      const pubKey = new PublicKey(publicKey);
      const signature = await connection.requestAirdrop(pubKey, amount * LAMPORTS_PER_SOL);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      return { success: true, signature };
    } catch (error: any) {
      let errorMessage = error.message || 'Unknown error';

      if (errorMessage.includes('Too Many Requests')) {
        errorMessage = 'Airdrop rate limited - try again in a few seconds';
      } else if (errorMessage.includes('airdrop request exceeds')) {
        errorMessage = 'Airdrop amount exceeds limit - try a smaller amount';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Validate private key format without making network call
   * @param privateKey - Base64-encoded secret key
   * @returns True if it appears to be valid
   */
  static validatePrivateKeyFormat(privateKey: string): boolean {
    try {
      const decoded = Buffer.from(privateKey, 'base64');
      return decoded.length === 64;
    } catch {
      return false;
    }
  }
}
