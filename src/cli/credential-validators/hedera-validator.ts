/**
 * Hedera Credential Validator
 *
 * Validates Hedera credentials by attempting to query the account balance.
 */

import { ChainCredentials, NetworkType } from '../../blockchain/core/types';

export class HederaValidator {
  /**
   * Validate Hedera credentials by making a test API call
   * @param credentials - The credentials to validate
   * @param network - The network to validate against (testnet/mainnet)
   * @returns True if credentials are valid
   */
  static async validate(
    credentials: ChainCredentials,
    network: NetworkType
  ): Promise<{ valid: boolean; error?: string; accountInfo?: { balance: string } }> {
    if (!credentials.accountId || !credentials.privateKey) {
      return { valid: false, error: 'Missing accountId or privateKey' };
    }

    try {
      // Dynamic import to avoid loading SDK if not needed
      const { Client, AccountId, PrivateKey, AccountBalanceQuery } = await import('@hashgraph/sdk');

      // Create client for the appropriate network
      const client = network === 'mainnet'
        ? Client.forMainnet()
        : Client.forTestnet();

      // Parse and set operator credentials
      const accountId = AccountId.fromString(credentials.accountId);
      const privateKey = PrivateKey.fromString(credentials.privateKey);
      client.setOperator(accountId, privateKey);

      // Test with a balance query
      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);

      // Close the client
      client.close();

      return {
        valid: true,
        accountInfo: {
          balance: balance.hbars.toString(),
        },
      };
    } catch (error: any) {
      let errorMessage = error.message || 'Unknown error';

      // Provide more helpful error messages
      if (errorMessage.includes('INVALID_ACCOUNT_ID')) {
        errorMessage = 'Invalid account ID format or account does not exist';
      } else if (errorMessage.includes('INVALID_SIGNATURE')) {
        errorMessage = 'Private key does not match the account ID';
      } else if (errorMessage.includes('INSUFFICIENT_PAYER_BALANCE')) {
        errorMessage = 'Account has insufficient balance for queries';
      }

      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Validate account ID format without making network call
   * @param accountId - The account ID to validate
   * @returns True if format is valid (e.g., 0.0.12345)
   */
  static validateAccountIdFormat(accountId: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(accountId);
  }

  /**
   * Validate private key format without making network call
   * @param privateKey - The private key to validate
   * @returns True if it appears to be a valid key format
   */
  static validatePrivateKeyFormat(privateKey: string): boolean {
    // Hedera private keys are typically 64+ characters (Ed25519 or ECDSA)
    // They may be DER-encoded (longer) or raw hex
    return privateKey.length >= 64;
  }
}
