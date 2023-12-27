import { ProtocolNotSupported } from './../exceptions/index.mjs';

/**
 * @method
 * @memberof module:HLSDownloaderUtils
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @description Check if the url is valid
 * @param {string} url string to check
 * @param {string[]} [protocols] supported protocols
 * @returns {boolean}
 * @throws TypeError
 * @throws ProtocolNotSupported
 */
const isValidUrl = (url, protocols = ['http:', 'https:', 'ftp:', 'sftp:']) => {
  try {
    const { protocol } = new URL(url);
    if (protocol && !protocols.includes(`${protocol}`))
      throw new ProtocolNotSupported(`${protocol} is not supported. Supported protocols are ${protocols.join(', ')}`);
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * @method
 * @memberof module:HLSDownloaderUtils
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @description Strip first slash from a url / path
 * @param  {String} url URL to strip the slash
 * @return {String} Stripped url
 */
const stripFirstSlash = url => url.substring(0, 1).replace('/', '') + url.substring(1);

/**
 * @method
 * @memberof module:HLSDownloaderUtils
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @description Validate a Playlist
 * @param {string} playlistContent
 * @returns {boolean}
 */
const isValidPlaylist = playlistContent => playlistContent.match(/^#EXTM3U/im) !== null;

/**
 * Util modules for HLSDownloader
 * @module Utils
 * @file utils.mjs
 * @fileOverview ### Utility Module ###
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @requires ./exceptions/ProtocolNotSupported.mjs
 */
export { isValidPlaylist, isValidUrl, stripFirstSlash };
