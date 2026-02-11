import ky, { Options } from 'ky';
import InvalidPlayList from './../exceptions/InvalidPlaylist.js';
import { Utils } from './../utils.js';

/**
 * @class HttpClient
 * @memberof module:HLSDownloader
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Manages file system operations including directory creation, path resolution, and stream persistence.
 */
class HttpClient {
  /** @type {Options} Stores the sanitized ky options. */
  private options: Options;

  /** @static {object} Default ky retry and timeout settings. */
  static defaultKyOptions: Options = { retry: { limit: 0 } };

  /**
   * @type {string[]}
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
   * @constructor
   * @param {object} customOptions - User-provided ky configuration options.
   */
  constructor(customOptions: Record<string, any> = {}) {
    this.options = Object.assign(
      {},
      HttpClient.defaultKyOptions,
      Utils.omit(customOptions, ...(HttpClient.unSupportedOptions as any))
    );
  }

  /**
   * @method
   * @memberof class:HttpClient
   * @description Fetches content as plain text and validates it as a valid HLS playlist.
   * @param {string} url - The URL to fetch.
   * @throws {InvalidPlayList} Throws if content fails HLS validation.
   * @returns {Promise<string>} The validated playlist body.
   */
  async fetchText(url: string): Promise<string> {
    const body = await ky.get(url, { ...this.options }).text();
    if (!Utils.isValidPlaylist(body)) {
      throw new InvalidPlayList('Invalid playlist');
    }
    return body;
  }

  /**
   * @method
   * @memberof class:HttpClient
   * @description Fetches a resource and returns its body as a stream.
   * @param {string} url - The URL of the segment or file.
   * @returns {Promise<ReadableStream<Uint8Array>>} The response body stream.
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
