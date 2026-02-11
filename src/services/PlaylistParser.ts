import { URL } from 'node:url';

/**
 * @class PlaylistParser
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Logic for parsing HLS manifest files and handling URL resolution for segments.
 * @memberof module:HLSDownloader
 */
class PlaylistParser {
  /**
   * HLS Playlist file extension
   * @constant {string}
   * @memberof module:HLSDownloader
   */
  static HLS_PLAYLIST_EXT: string = '.m3u8';

  /**
   * @method
   * @memberof class:PlaylistParser
   * @description Extracts absolute URLs from HLS playlist content.
   *
   * @param   {string}  baseUrl - The base URL used to resolve relative paths found in the playlist.
   * @param   {string}  content - The raw string content of the HLS manifest.
   *
   * @return  {string[]} An array of absolute URLs extracted from the manifest.
   */
  parse(baseUrl: string, content: string): string[] {
    return content
      .replace(/^#[\s\S].*/gim, '')
      .split(/\r?\n/)
      .filter((line: string) => line.trim() !== '')
      .map((item: string) => new URL(item, baseUrl).href);
  }

  /**
   * @method
   * @memberof class:PlaylistParser
   * @description Checks if a given URL points to an HLS playlist based on its extension.
   * @param {string}  url - The URL to check.
   *
   * @return {boolean} True if the URL ends with the HLS playlist extension.
   */
  isPlaylist(url: string): boolean {
    return url.toLowerCase().endsWith(PlaylistParser.HLS_PLAYLIST_EXT);
  }
}

export default new PlaylistParser();
