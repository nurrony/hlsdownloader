import ky, { Options } from 'ky';
import { HlsUtils } from '../HLSUtils.js';
import InvalidPlayList from './../exceptions/InvalidPlaylist.js';

/**
 * @category Services
 * @author Nur Rony<pro.nmrony@gmail.com>
 * Internal service wrapper for handling specialized HLS network requests via `ky`.
 */
class HttpClient {
  /** Stores the sanitized ky options. */
  private options: Options;

  static defaultKyOptions: Options = { retry: { limit: 0 } };

  /**
   */
  static unSupportedOptions: string[] = [
    'uri',
    'url',
    'json',
    'form',
    'body',
    'method',
    'setHost',
    'isStream',
    'parseJson',
    'prefixUrl',
    'cookieJar',
    'playlistURL',
    'concurrency',
    'allowGetBody',
    'stringifyJson',
    'methodRewriting',
  ];

  /**
   * Constructor of HttpClient
   * @param customOptions - User-provided ky configuration options.
   */
  constructor(customOptions: Record<string, any> = {}) {
    this.options = Object.assign(
      {},
      HttpClient.defaultKyOptions,
      HlsUtils.omit(customOptions, ...(HttpClient.unSupportedOptions as any))
    );
  }

  /**
   * Fetches content as plain text and validates it as a valid HLS playlist.
   * @param url - The URL to fetch.
   * @throws {InvalidPlayList} Throws if content fails HLS validation.
   * @returns The validated playlist body.
   */
  async fetchText(url: string): Promise<string> {
    const body = await ky.get(url, { ...this.options }).text();
    if (!HlsUtils.isValidPlaylist(body)) {
      throw new InvalidPlayList('Invalid playlist');
    }
    return body;
  }

  /**
   * Fetches a resource and returns its body as a stream.
   * @param url - The URL of the segment or file.
   * @returns The response body stream.
   */
  async getStream(url: string): Promise<ReadableStream<Uint8Array>> {
    const response = await ky.get(url, { ...this.options });
    if (!response.body) {
      throw new Error('Response body is null');
    }
    return response.body;
  }
}

export default HttpClient;
