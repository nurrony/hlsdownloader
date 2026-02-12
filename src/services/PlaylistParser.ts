import { URL } from 'node:url';

/**
 * @category Services
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Logic for parsing HLS manifest files and handling URL resolution for segments.
 */
class PlaylistParser {
  /**
   * HLS Playlist file extension
   */
  static HLS_PLAYLIST_EXT: string = '.m3u8';

  /**
   * Extracts absolute URLs from HLS playlist content.
   * @param  baseUrl - The base URL used to resolve relative paths found in the playlist.
   * @param  content - The raw string content of the HLS manifest.
   * @returns An array of absolute URLs extracted from the manifest.
   */
  parse(baseUrl: string, content: string): string[] {
    return content
      .replace(/^#[\s\S].*/gim, '')
      .split(/\r?\n/)
      .filter((line: string) => line.trim() !== '')
      .map((item: string) => new URL(item, baseUrl).href);
  }

  /**
   * Checks if a given URL points to an HLS playlist based on its extension.
   * @param  url - The URL to check.
   * @returns True if the URL ends with the HLS playlist extension.
   */
  isPlaylist(url: string): boolean {
    return url.toLowerCase().endsWith(PlaylistParser.HLS_PLAYLIST_EXT);
  }
}

export default new PlaylistParser();
