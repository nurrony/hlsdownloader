import { ProtocolNotSupported } from './../exceptions/index.mjs';

/**
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
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @description Strip first slash from a url / path
 * @param  {String} url URL to strip the slash
 * @return {String} Stripped url
 */
const stripFirstSlash = url => url.substring(0, 1).replace('/', '') + url.substring(1);

/**
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @description Validate a Playlist
 * @param {string} playlistContent Content of playlist file
 * @returns {boolean}
 */
const isValidPlaylist = playlistContent => playlistContent.match(/^#EXTM3U/im) !== null;

/**
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @description Validate a Playlist
 * @param {string} url url to parse
 * @returns {object}
 * @throws TypeError
 */
const parseUrl = url => new URL(url);

/**
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @description omit given keys from an object.
 * @param {any} keys keys to remove from the object
 * @param {object} subject object to remove the keys form
 * @returns {object}
 */
const omit = (subject, ...keys) => {
  const keysToRemove = new Set(keys.flat());
  return Object.fromEntries(Object.entries(subject).filter(([key]) => !keysToRemove.has(key)));
};

/**
 * @lends HLSDownloaderUtils
 * @memberof modules:HLSDownloaderUtils
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @requires ./exceptions/ProtocolNotSupported.mjs
 */
export { isValidPlaylist, isValidUrl, omit, parseUrl, stripFirstSlash };
