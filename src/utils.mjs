import { ProtocolNotSupported } from './exceptions/ProtocolNotSupported.mjs';

/**
 * @description Check if the url is valid
 * @param {string} url string to check
 * @param {string[]} [protocols] supported protocols
 * @returns {boolean}
 * @throws TypeError
 * @throws ProtocolNotSupported
 */
const isValidUrl = (url, protocols = ['http:', 'https:', 'ftp:', 'sftp:']) => {
  try {
    const { protocol = '' } = new URL(url);
    if (protocol && !protocols.includes(`${protocol}`))
      throw new ProtocolNotSupported(`${protocol} not supported. Supported protocols are ${protocols.join(', ')}`);
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * @description Validate a Playlist
 * @param {string} playlistContent
 * @returns {boolean}
 */
const isValidPlaylist = (playlistContent) => {
  console.log('mes', playlistContent.match(/^#EXTM3U/im));
  return playlistContent.match(/^#EXTM3U/im) !== null;
};

export { isValidPlaylist, isValidUrl };
