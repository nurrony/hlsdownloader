import { URL } from 'node:url';
import UnsupportedProtocol from './exceptions/UnsupportedProtocol.js';

/**
 * @category Utils
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @description Static utility helper for HLS operations and URL validation.
 */
export class HlsUtils {
  /**
   * Validates if the provided string is a properly formatted URL with supported protocols.
   * @param url - The URL string to validate.
   * @param protocols - An array of allowed protocols.
   * @throws {UnsupportedProtocol} If the protocol is not in the allowed list.
   * @returns `true` if valid.
   */
  static isValidUrl(
    url: string,
    protocols: string[] = ['http:', 'https:', 'ftp:', 'sftp:']
  ): boolean | UnsupportedProtocol {
    const { protocol } = new URL(url);
    if (protocol && !protocols.includes(protocol)) {
      throw new UnsupportedProtocol(`${protocol} is not supported. Supported protocols are ${protocols.join(', ')}`);
    }
    return true;
  }

  /**
   * Removes the leading slash from a pathname for safe path joining.
   * @param url - The string to strip.
   * @returns The string without a leading slash.
   */
  static stripFirstSlash(url: string): string {
    return url.startsWith('/') ? url.substring(1) : url;
  }

  /**
   * Checks if the content starts with the mandatory HLS #EXTM3U tag.
   * @param content - The raw manifest string.
   * @returns `true` if it contains the HLS header.
   */
  static isValidPlaylist(content: string): boolean {
    return /^#EXTM3U/im.test(content);
  }

  /**
   * Utility to create a URL object from a string.
   * @param url - The URL string to parse.
   * @returns A native Node/Web URL object.
   */
  static parseUrl(url: string): URL {
    return new URL(url);
  }

  /**
   * Filters out specific keys from an object.
   * @param subject - The source object.
   * @param keys - The keys to remove.
   * @returns A new object excluding the specified keys.
   */
  static omit<T extends Record<string, any>, K extends keyof T>(subject: T, ...keys: (K | K[])[]): Omit<T, K> {
    const keysToRemove = new Set(keys.flat());
    return Object.fromEntries(Object.entries(subject).filter(([key]) => !keysToRemove.has(key as K))) as Omit<T, K>;
  }

  /**
   * Validation check to ensure provided hooks are executable functions.
   * @param fn - The value to check.
   * @returns `true` if the value is NOT a function.
   */
  static isNotFunction(fn: unknown): boolean {
    return typeof fn !== 'function';
  }

  /**
   * Promise-based delay for retries and throttling
   * @param ms {number}- time to sleep in microseconds
   * @returns Promise<any>
   */
  static async sleep(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
