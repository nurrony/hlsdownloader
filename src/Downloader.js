import { createWriteStream } from 'fs';
import { access, constants, mkdir, unlink } from 'fs/promises';
import ky from 'ky';
import pLimit from 'p-limit';
import { dirname, join } from 'path';
import { Readable } from 'stream';
import { URL } from 'url';
import { InvalidPlayList } from './exceptions';
import Utils from './utils';

/**
 * HLS Playlist file extension
 * @constant
 * @type {string}
 */
const HLS_PLAYLIST_EXT = '.m3u8';

/**
 * @class
 * @memberof module:HLSDownloader
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Main donwloader class of HLSDownloader Package
 */
class Downloader {
  /** @lends Downloader.prototype */

  /**
   * @static
   * @type {object}
   * @description Default <a href="https://www.npmjs.com/package/ky" target="_blank">Ky</a> options values set by HLSDownloader
   * @default
   * <pre>
   * {
   *   retry: { limit: 0 }
   * }
   * </pre>
   */
  static defaultKyOptions = { retry: { limit: 0 } };

  /**
   * @type {object}
   * @default 1
   * @description concurrency controller
   */
  pool = pLimit(1);

  /**
   * @type {boolean}
   * @default false
   * @description concurrency controller
   */
  overwrite = false;

  /**
   * @type {string[]}
   * @default
   * <pre>
   * [
   *  'uri',
   *  'url',
   *  'json',
   *  'form',
   *  'body',
   *  'method',
   *  'setHost',
   *  'isStream',
   *  'parseJson',
   *  'prefixUrl',
   *  'cookieJar',
   *  'playlistURL',
   *  'concurrency',
   *  'allowGetBody',
   *  'stringifyJson',
   *  'methodRewriting'
   * ]
   * </pre>
   */
  static unSupportedOptions = [
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
   * @type {string[]}
   * @description items that are downloaded successfully
   */
  items = [];

  /**
   * @type {Array<{url: string, name: string, message: string}>}
   * @description items that are not downloaded successfully
   */
  errors = [];

  /**
   * @type {number=}
   * @default 1
   * @description Concurrency limit to download items
   */
  concurrency = 1;

  /**
   * @type {object=}
   * @default <pre>{}</pre>
   * @description Extra options to pass into <a href="https://www.npmjs.com/package/ky" target="_blank">Ky</a>
   */
  kyOptions = {};

  /**
   * @default ''
   * @type {string}
   * @description Playlist URL to download
   */
  playlistURL = '';

  /**
   * @default ''
   * @type {string}
   * @description Absolute path to download the TS files with corresponding playlist file
   */
  destination = '';

  /**
   * @default null
   * @type {Function | null}
   * @description Absolute path to download the TS files with corresponding playlist file
   */
  onData = null;

  /**
   * @constructor
   * @throws TypeError
   * @param {object} downloderOptions - Options to build downloader
   * @param {string} downloderOptions.playlistURL - Playlist URL to download
   * @param {number} [downloderOptions.concurrency = 1] - concurrency limit to download playlist chunk
   * @param {object} [downloderOptions.destination = ''] - Absolute path to download
   * @param {object | Function} [downloderOptions.onData = null] - onData hook
   * @param {boolean} [downloderOptions.overwrite = false] - Overwrite files toggler
   * @param {object} [downloderOptions.options = {}] - Options to override from <a href="https://www.npmjs.com/package/ky" target="_blank">Ky</a>
   * @throws ProtocolNotSupported
   */
  constructor(
    { playlistURL, destination, concurrency = 1, overwrite = false, onData = null, ...options } = {
      concurrency: 1,
      destination: '',
      playlistURL: '',
      onData: null,
      overwrite: false,
      options: {},
    }
  ) {
    try {
      this.items = [playlistURL];
      this.playlistURL = playlistURL;
      this.concurrency = concurrency;
      this.overwrite = overwrite ?? false;
      this.destination = destination ?? '';
      this.pool = pLimit(concurrency ?? 1);
      this.kyOptions = this.mergeOptions(options);
      this.onData = onData;
      // bind methods
      this.fetchItems = this.fetchItems.bind(this);
      this.downloadItem = this.downloadItem.bind(this);
      this.mergeOptions = this.mergeOptions.bind(this);
      this.fetchPlaylist = this.fetchPlaylist.bind(this);
      this.startDownload = this.startDownload.bind(this);
      this.downloadItems = this.downloadItems.bind(this);
      this.shouldOverwrite = this.shouldOverwrite.bind(this);
      this.createDirectory = this.createDirectory.bind(this);
      this.parsePlaylist = this.parsePlaylist.bind(this);
      this.processPlaylistItems = this.processPlaylistItems.bind(this);
      this.formatPlaylistContent = this.formatPlaylistContent.bind(this);

      Utils.isValidUrl(playlistURL);

      if (this.onData !== null && Utils.isNotFunction(this.onData)) {
        throw TypeError('The `onData` must be a function');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * @method
   * @memberof class:Downloader
   * @description Start the downloading process
   */
  async startDownload() {
    const { url, body: playlistContent } = await this.fetchPlaylist(this.playlistURL);
    if (this.errors.length > 0) {
      return {
        errors: this.errors,
        message: 'Unsuccessful download',
      };
    }

    let urls = this.parsePlaylist(url, playlistContent);
    this.items = [...this.items, ...urls];
    const playlists = urls.filter(url => url.toLowerCase().endsWith(HLS_PLAYLIST_EXT));
    const playlistContentPromiseResults = await Promise.allSettled(playlists.map(vUrl => this.fetchPlaylist(vUrl)));
    const playlistContents = this.formatPlaylistContent(playlistContentPromiseResults);
    urls = playlistContents.map(content => this.parsePlaylist(content?.url, content?.body)).flat();
    this.items = [...this.items, ...urls];

    await this.processPlaylistItems();

    if (this.errors.length > 0) {
      return {
        errors: this.errors,
        total: this.items.length,
        message: 'Download ended with some errors',
      };
    }

    return {
      total: this.items.length,
      playlistURL: this.playlistURL,
      message: 'Downloaded successfully',
    };
  }

  /**
   * @returns {object}
   * @param {object} options
   * @description merge options
   */
  mergeOptions(options) {
    return Object.assign(Downloader.defaultKyOptions, Utils.omit(options, ...Downloader.unSupportedOptions));
  }

  /**
   * @method
   * @param {string} playlistContent
   * @returns string[]  Array of url
   * @description Parse playlist content and index the TS chunk to download.
   */
  parsePlaylist(playlistURL, playlistContent) {
    return playlistContent
      .replace(/^#[\s\S].*/gim, '')
      .split(/\r?\n/)
      .reduce((result, item) => {
        if (item !== '') {
          const url = new URL(item, playlistURL).href;
          //@ts-ignore
          result.push(url);
        }
        return result;
      }, []);
  }

  /**
   * @async
   * @method
   * @returns {Promise<{url, body}>}
   * @description fetch playlist content
   */
  async fetchPlaylist(url) {
    try {
      const body = await ky.get(url, { ...this.kyOptions }).text();
      if (!Utils.isValidPlaylist(body)) {
        const { name, message } = new InvalidPlayList('Invalid playlist');
        this.errors.push({ url, name, message });
        return { url: '', body: '' };
      }
      return { url, body };
    } catch ({ name, message }) {
      this.errors.push({ url, name, message });
      return { url: '', body: '' };
    }
  }

  /**
   * @method
   * @description filter playlist contents
   * @param {object[]} playlistContentResults  list of fetched playlist content
   * @returns {Array<{url: string, body: string}>} list of object containing url and its content
   */
  formatPlaylistContent(playlistContentResults) {
    return playlistContentResults.reduce((contents, { status, value }) => {
      if (status.toLowerCase() === 'fulfilled' && !!value) {
        contents.push(value);
      }
      return contents;
    }, []);
  }

  /**
   * @async
   * @method
   * @returns {Promise<any>}
   * @description Process playlist items
   */
  async processPlaylistItems() {
    return (this.destination && this.downloadItems()) || this.fetchItems();
  }

  /**
   * @async
   * @method
   * @description Download each iteam
   * @param {string} item - item to download
   * @returns {Promise<any>}
   */
  async downloadItem(item) {
    try {
      const response = await ky.get(item, { ...this.kyOptions });
      const filePath = await this.createDirectory(item);
      // @ts-ignore
      const readStream = Readable.fromWeb(response.body);
      return new Promise((resolve, reject) => {
        const writeStream = createWriteStream(filePath);
        readStream.pipe(writeStream);

        readStream.on('error', error => {
          readStream.destroy();
          writeStream.destroy();
          unlink(filePath);
          reject(error);
        });

        writeStream.on('finish', () => {
          writeStream.close();
          resolve('success');
        });

        writeStream.on('error', error => {
          writeStream.destroy();
          readStream.destroy();
          reject(error);
        });
      });
    } catch ({ name, message }) {
      this.errors.push({ name, message, url: item });
    }
  }

  /**
   * @async
   * @method
   * @returns {Promise<any>}
   * @description Download playlist and items
   */
  async downloadItems() {
    try {
      if (!(await this.shouldOverwrite(this.playlistURL))) {
        const error = new Error('directory already exists');
        error.name = 'EEXIST';
        throw error;
      }
      await this.createDirectory(this.playlistURL);
      const downloaderPromises = this.items.map(url => this.pool(this.downloadItem, url));
      return Promise.allSettled(downloaderPromises);
    } catch (error) {
      this.errors.push({ url: this.playlistURL, name: error.name, message: error.message });
    }
  }

  /**
   * @async
   * @method
   * @description Fetch playlist items
   * @returns {Promise<any>}
   */
  async fetchItems() {
    return Promise.allSettled(
      this.items.map(item =>
        this.pool(async () => {
          try {
            return await ky.get(item, { ...this.kyOptions });
          } catch ({ name, message }) {
            this.errors.push({ url: item, name, message });
          }
        })
      )
    );
  }

  /**
   * @description create directory to download
   * @returns {Promise<string>} destination path
   * @param {string} url url to construct the path from
   */
  async createDirectory(url) {
    const { pathname } = Utils.parseUrl(url);
    const destDirectory = join(this.destination, dirname(pathname));
    await mkdir(destDirectory, { recursive: true });
    return join(this.destination, Utils.stripFirstSlash(pathname));
  }

  /**
   * @method
   * @param {string} url - url to build path from
   * @description Checks for overwrite flag
   * @returns {Promise<boolean>}
   */
  async shouldOverwrite(url) {
    try {
      const { pathname } = Utils.parseUrl(url);
      const destDirectory = join(this.destination, dirname(pathname));
      await access(destDirectory, constants.F_OK);
      return this.overwrite;
    } catch (error) {
      if (error.code === 'ENOENT') return true;
      throw error;
    }
  }
}

/**
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Downloads or fetch HLS Playlist and its items
 */
export default Downloader;
