import { ProxyAgent } from 'undici';
import { HlsUtils } from '../HLSUtils.js';
import InvalidPlayList from './../exceptions/InvalidPlaylist.js';

/**
 * @category Types
 * Configuration for the internal HTTP Client.
 */
interface HttpClientOptions {
  /** Request timeout in milliseconds (Default: 10000) */
  timeout?: number;

  /** Retry strategy for transient network failures */
  retry?: {
    /** Maximum number of retry attempts */
    limit: number;
    /** Base delay in milliseconds for exponential backoff */
    delay: number;
  };

  /** Corporate proxy URL (e.g., http://proxy.corp.com:8080) */
  proxy?: string;

  /** List of hostnames that should bypass the proxy */
  noProxy?: string[];

  /**
   * Custom HTTP headers to be sent with every request.
   * Useful for Auth tokens, Cookies, or custom User-Agents.
   */
  headers?: Record<string, string>;
}
/**
 *
 * A resilient HTTP Client specifically designed for HLS streaming workloads.
 * Features include:
 * - Native fetch implementation (Node 20+)
 * - Exponential backoff retry strategy for transient 5xx/429 errors
 * - Corporate Proxy support via ProxyAgent
 * - Domain-based Proxy bypass (NO_PROXY)
 * - Automatic AbortController management for request timeouts
 * @example
 * const client = new HttpClient({
 * timeout: 5000,
 * retry: { limit: 3, delay: 1000 },
 * proxy: 'http://proxy.corp.com:8080',
 * noProxy: 'localhost,127.0.0.1,.internal.com',
 * headers: { 'x-custom-header': 'my-custom-header' }
 * });
 */
class HttpClient {
  /** Initialized request options (headers, etc.) */
  private options: RequestInit;

  private primaryOrigin: string | null = null;

  /** List of sensitive headers */
  private sensitiveHeaders: string[] = ['authorization', 'cookie', 'x-auth-token'];

  /** Max time in milliseconds before a request is aborted */
  private timeout: number;

  /** Retry configuration for transient failures */
  private retryOptions: { limit: number; delay: number };

  /** The proxy agent used for network requests, if configured */
  private dispatcher?: ProxyAgent;

  /** List of hostnames that should bypass the corporate proxy */
  private noProxy: string[] = [];

  /**
   * Creates a new HttpClient instance.
   * @param customOptions - Configuration object
   * @param customOptions.timeout - Request timeout in ms (Default: 10000)
   * @param customOptions.retry - Retry strategy settings
   * @param customOptions.proxy - Corporate proxy URL
   * @param customOptions.noProxy - Array of domains to bypass proxy
   */
  constructor(customOptions: HttpClientOptions = {}) {
    this.options = { method: 'GET', headers: { 'User-Agent': 'HLSDownloader' } };

    // Normalize headers to lowercase for safer matching
    if (customOptions.headers) {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(customOptions.headers)) {
        normalized[key.toLowerCase()] = value;
      }

      this.options.headers = { 'User-Agent': 'HLSDownloader', ...this.options.headers, ...normalized };
    }
    this.timeout = customOptions.timeout ?? 10000;
    this.retryOptions = customOptions.retry ?? { limit: 2, delay: 500 };

    // Parse bypass list (e.g., 'localhost,127.0.0.1,.internal.com')
    const noProxyEnv = process.env.NO_PROXY || process.env.no_proxy || '';
    this.noProxy =
      customOptions.noProxy ??
      noProxyEnv
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const proxyUrl = customOptions.proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxyUrl) {
      this.dispatcher = new ProxyAgent({ uri: proxyUrl });
    }
  }

  /**
   * Sets the primary origin based on the initial playlist URL.
   * @param url {string} url to set primary origin from
   */
  public setPrimaryOrigin(url: string): void {
    try {
      this.primaryOrigin = new URL(url).origin;
    } catch {
      this.primaryOrigin = null;
    }
  }
  /**
   * Get Request headers
   * @param targetUrl {string} target url to get the request for
   * @returns request headers
   */
  private getRequestHeaders(targetUrl: string): Record<string, string> {
    const currentHeaders = { ...(this.options.headers as Record<string, string>) };

    try {
      const targetOrigin = new URL(targetUrl).origin;

      // If the target is NOT the primary origin, strip sensitive headers
      if (this.primaryOrigin && targetOrigin !== this.primaryOrigin) {
        this.sensitiveHeaders.forEach(header => {
          delete currentHeaders[header];
        });
      }
    } catch {
      // If URL is invalid/relative, we keep headers as it's likely the same host
    }

    return currentHeaders;
  }

  /**
   * Determines if a given URL should ignore the configured proxy.
   * Logic matches hostnames or suffix patterns (e.g., '.internal.com').
   * @param url {string} - domain to bypass
   * @returns Boolean
   * @internal
   */
  private shouldBypassProxy(url: string): boolean {
    if (!this.dispatcher) return true;
    const hostname = new URL(url).hostname;
    return this.noProxy.some(
      pattern => hostname === pattern || (pattern.startsWith('.') && hostname.endsWith(pattern))
    );
  }

  /**
   * Core request wrapper with retry logic and timeout management.
   * Handles cleanup of AbortController timers to prevent memory leaks.
   * @throws {Error} If request fails permanently or retries are exhausted.
   * @param url {string} - url to fetch
   * @param attempt {number} [attempt=0] - retry attempt
   * @returns Fetch API Response
   * @internal
   */
  private async requestWithRetry(url: string, attempt: number = 0): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(url, {
        ...this.options,
        headers: this.getRequestHeaders(url),
        signal: controller.signal,
        // @ts-expect-error - dispatcher is node-specific
        dispatcher: this.shouldBypassProxy(url) ? undefined : this.dispatcher,
      });

      // Clear immediately after response received
      clearTimeout(timeoutId);

      if (!response.ok && (response.status >= 500 || response.status === 429) && attempt < this.retryOptions.limit) {
        return this.handleRetry(url, attempt);
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Ensure we check status for both thrown errors (like from fetch)
      // and manual error objects
      const isRetryable =
        error.name === 'AbortError' || error.name === 'TypeError' || (error.status && error.status >= 500);

      if (isRetryable && attempt < this.retryOptions.limit) {
        return this.handleRetry(url, attempt);
      }
      throw error;
    }
  }

  /**
   * Calculates exponential backoff and waits before retrying.
   * @param url {string} - url to handle retry for
   * @param attempt {number} - attempt to calculate backoff
   * @returns Fetch API Response
   * @internal
   */
  private async handleRetry(url: string, attempt: number): Promise<Response> {
    const backoff = this.retryOptions.delay * Math.pow(2, attempt);
    await HlsUtils.sleep(backoff);
    return this.requestWithRetry(url, attempt + 1);
  }

  /**
   * Fetches a playlist and validates its HLS structure.
   * @param url {string} - The M3U8 playlist URL
   * @returns The raw string content of the playlist
   * @throws {InvalidPlayList} If the response body is not a valid HLS manifest
   */
  async fetchText(url: string): Promise<string> {
    const response = await this.requestWithRetry(url);
    const body = await response.text();
    if (!HlsUtils.isValidPlaylist(body)) throw new InvalidPlayList('Invalid playlist');
    return body;
  }

  /**
   * Fetches a resource (usually a .ts segment) as a stream.
   * @param url {string} - The segment URL
   * @returns A readable stream of the resource
   * @throws {Error} If the response body is empty
   */
  async getStream(url: string): Promise<ReadableStream<Uint8Array>> {
    const response = await this.requestWithRetry(url);
    if (!response.body) throw new Error('Response body is null');
    return response.body as ReadableStream<Uint8Array>;
  }
}

/**
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc A resilient HTTP Client specifically designed for HLS streaming workloads.
 */
export default HttpClient;

export type { HttpClientOptions };
