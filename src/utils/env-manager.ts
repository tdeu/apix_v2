/**
 * Environment Manager Utility
 *
 * Handles reading and writing to .env files in the user's project.
 * Preserves comments and formatting when updating values.
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export class EnvManager {
  private envPath: string;

  /**
   * Create an EnvManager instance
   * @param envPath - Path to the .env file (default: .env in current directory)
   */
  constructor(envPath: string = '.env') {
    // Resolve to absolute path from current working directory
    this.envPath = path.resolve(process.cwd(), envPath);
  }

  /**
   * Load and parse the .env file
   * @returns Object with all environment variables
   */
  async load(): Promise<Record<string, string>> {
    const env: Record<string, string> = {};

    if (await fs.pathExists(this.envPath)) {
      const content = await fs.readFile(this.envPath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        // Skip empty lines and comments
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').trim();
          // Remove surrounding quotes if present
          env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    }

    return env;
  }

  /**
   * Update .env file with new values, preserving existing content and comments
   * @param updates - Object with key-value pairs to update/add
   */
  async update(updates: Record<string, string>): Promise<void> {
    const updatedKeys = new Set<string>();
    let content = '';

    // If file exists, update existing values in place
    if (await fs.pathExists(this.envPath)) {
      const existingContent = await fs.readFile(this.envPath, 'utf-8');
      const lines = existingContent.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key] = trimmed.split('=');
          const keyName = key.trim();
          if (updates[keyName] !== undefined) {
            // Update this line with new value
            content += `${keyName}=${updates[keyName]}\n`;
            updatedKeys.add(keyName);
          } else {
            // Keep existing line
            content += line + '\n';
          }
        } else {
          // Keep comments and empty lines
          content += line + '\n';
        }
      }
    }

    // Add new keys that weren't in the existing file
    const newKeys = Object.keys(updates).filter(k => !updatedKeys.has(k));
    if (newKeys.length > 0) {
      // Add a blank line if content doesn't end with one
      if (content && !content.endsWith('\n\n')) {
        content += '\n';
      }
      content += '# Added by APIX\n';
      for (const key of newKeys) {
        content += `${key}=${updates[key]}\n`;
      }
    }

    // Ensure directory exists
    await fs.ensureDir(path.dirname(this.envPath));

    // Write the file
    await fs.writeFile(this.envPath, content.trim() + '\n');
  }

  /**
   * Get a single environment variable value
   * @param key - The environment variable name
   * @returns The value or undefined if not found
   */
  async get(key: string): Promise<string | undefined> {
    const env = await this.load();
    return env[key];
  }

  /**
   * Set a single environment variable
   * @param key - The environment variable name
   * @param value - The value to set
   */
  async set(key: string, value: string): Promise<void> {
    await this.update({ [key]: value });
  }

  /**
   * Check if a key exists in the .env file
   * @param key - The environment variable name
   * @returns True if the key exists
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined && value !== '';
  }

  /**
   * Check if multiple keys exist in the .env file
   * @param keys - Array of environment variable names
   * @returns Object with hasAll, hasSome, and missing arrays
   */
  async checkKeys(keys: string[]): Promise<{
    hasAll: boolean;
    hasSome: boolean;
    missing: string[];
    found: string[];
  }> {
    const env = await this.load();
    const found: string[] = [];
    const missing: string[] = [];

    for (const key of keys) {
      if (env[key] && env[key] !== '') {
        found.push(key);
      } else {
        missing.push(key);
      }
    }

    return {
      hasAll: missing.length === 0,
      hasSome: found.length > 0,
      missing,
      found,
    };
  }

  /**
   * Get the path to the .env file
   */
  getPath(): string {
    return this.envPath;
  }

  /**
   * Check if .env file exists
   */
  async exists(): Promise<boolean> {
    return fs.pathExists(this.envPath);
  }
}
