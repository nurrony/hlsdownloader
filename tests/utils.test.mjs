import { URL } from 'node:url';
import ProtocolNotSupported from '../src/exceptions/ProtocolNotSupported.mjs';
import { isValidPlaylist, isValidUrl, omit, parseUrl, stripFirstSlash } from './../src/utils/index.mjs';

describe('Utils', () => {
  describe('#isValidUrl', () => {
    test('should be a valid http url', () => {
      expect(isValidUrl('http://example.com')).toBeTruthy();
    });

    test('should be a valid https url', () => {
      expect(isValidUrl('https://example.com')).toBeTruthy();
    });

    test('should be a valid http url with username and password', () => {
      expect(isValidUrl('http://hello:world@example.com')).toBeTruthy();
    });

    test('should be a valid https url with username and password', () => {
      expect(isValidUrl('https://hello:world@example.com')).toBeTruthy();
    });

    test('should throw error for invalid url', () => {
      expect(() => {
        isValidUrl('htt//example.com');
      }).toThrow('Invalid URL');
    });

    test('should throw error for unsupported protocol', () => {
      expect(() => {
        isValidUrl('abc://example.com');
      }).toThrow(ProtocolNotSupported);
    });
  });

  describe('#isValidPlaylist', () => {
    test('should be able to detect valid playlist content', () => {
      const variantPlaylistContent = `#EXTM3U
      #EXT-X-ENDLIST`;
      expect(isValidPlaylist(variantPlaylistContent)).toBeTruthy();
    });

    test('should be able to detect invalid playlist content', () => {
      const variantInvalidPlaylistContent = `#EXT
      #EXT-X-ENDLIST`;
      expect(isValidPlaylist(variantInvalidPlaylistContent)).toBeFalsy();
    });
  });

  describe('#stripFirstSlash', () => {
    test('should remove first slash from aboslute file path', () => {
      expect(stripFirstSlash('/some/path/to/playlist.m3u8')).toStrictEqual('some/path/to/playlist.m3u8');
    });
  });

  describe('#parseUrl', () => {
    const aUrl = parseUrl('http://example.com') || {};
    test('should return an instance of URL', () => {
      expect(aUrl).toBeInstanceOf(URL);
    });
    test('should parse a valid url', () => {
      const { protocol, hostname } = aUrl;
      expect(protocol).toStrictEqual('http:');
      expect(hostname).toStrictEqual('example.com');
    });

    test('should throw error for invalid url', () => {
      expect(() => {
        parseUrl('htt//example.com');
      }).toThrow('Invalid URL');
    });
  });

  describe('#omit', () => {
    const subject = { a: 'a', b: 'b', c: 'c', d: 'd' };
    test('should return a trimmed down object when remove array provided', () => {
      expect(omit(subject, 'b', 'd')).toMatchObject({ a: 'a', c: 'c' });
      expect(omit(subject, ['b', 'd'])).toMatchObject({ a: 'a', c: 'c' });
      expect(omit(subject, 'b', ['d'])).toMatchObject({ a: 'a', c: 'c' });
      expect(omit(subject, ['b', ['d']])).toMatchObject({ a: 'a', c: 'c' });
    });

    test('should return same object when no omit array provided', () => {
      expect(omit(subject)).toMatchObject(subject);
    });
  });
});
