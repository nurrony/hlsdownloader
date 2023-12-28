import { isValidUrl, parseUrl } from './utils/index.mjs';
/**
 * @class
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Main donwloader class of HLSDownloader Package
 */
class Downloader {
  /** @lends Downloader.prototype */
  /**
   * @type string[]
   * @description  items that are downloaded successfully
   */
  #items = [];

  /**
   * @type string[]
   * @description  items that are not downloaded successfully
   */
  #errors = [];

  /**
   * @type string
   * @description hostname of provided url
   */
  #hostname = '';

  /**
   * @type object
   * @description extra options to pass into <a href="https://www.npmjs.com/package/got" target="_blank">Got</a>
   */
  #options = {};

  /**
   * @type string
   * @description playlist url
   */
  #playlistURL = '';

  /**
   * @type string
   * @description Absolute path to download the TS files with corresponding playlist file
   */
  #destination = '';

  /**
   * @constructor
   * @throws TypeError
   * @throws ProtocolNotSupported
   */
  constructor({ playlistURL = '', destination = '', ...options } = {}) {
    try {
      isValidUrl(playlistURL);
      const { hostname } = parseUrl(playlistURL);

      /** @private */
      this.#hostname = hostname;

      /** @private */
      this.playlistURL = playlistURL;

      /** @private */
      this.#destination = destination;

      /** @private */
      this.#options = Object.assign({}, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * @method
   * @param {function} callback
   * @description Initiate download
   */
  startDownload(callback) {
    return 'hello';
  }
}

/**
 * @name Downloader
 * @memberof module:HLSDownloader
 */
export default Downloader;
