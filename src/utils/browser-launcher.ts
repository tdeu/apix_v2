/**
 * Browser Launcher Utility
 *
 * Cross-platform utility to open URLs in the user's default browser.
 * Used by the credential setup wizard to redirect users to blockchain portals.
 */

import { exec } from 'child_process';
import { platform } from 'os';

export class BrowserLauncher {
  /**
   * Open a URL in the user's default browser.
   * Works on macOS, Windows, and Linux.
   *
   * @param url - The URL to open
   * @returns Promise that resolves when browser is launched (doesn't wait for browser to close)
   */
  static async open(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      let command: string;

      switch (platform()) {
        case 'darwin': // macOS
          command = `open "${url}"`;
          break;
        case 'win32': // Windows
          command = `start "" "${url}"`;
          break;
        default: // Linux and others
          command = `xdg-open "${url}"`;
          break;
      }

      exec(command, (error) => {
        if (error) {
          // Don't throw - browser opening is not critical
          // User can manually navigate to the URL
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Get the platform-specific message about opening browser
   */
  static getPlatformHint(): string {
    switch (platform()) {
      case 'darwin':
        return 'Opening in your default browser...';
      case 'win32':
        return 'Opening in your default browser...';
      default:
        return 'Opening in your default browser (requires xdg-open)...';
    }
  }
}
