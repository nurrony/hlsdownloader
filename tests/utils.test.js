import { URL } from 'url';
import { ProtocolNotSupported } from '../src/exceptions';
import Utils from './../src/utils';

describe('Utils', () => {
  describe('#isValidUrl', () => {
    test('should be a valid http url', () => {
      expect(Utils.isValidUrl('http://example.com')).toBeTruthy();
    });

    test('should be a valid https url', () => {
      expect(Utils.isValidUrl('https://example.com')).toBeTruthy();
    });

    test('should be a valid http url with username and password', () => {
      expect(Utils.isValidUrl('http://hello:world@example.com')).toBeTruthy();
    });

    test('should be a valid https url with username and password', () => {
      expect(Utils.isValidUrl('https://hello:world@example.com')).toBeTruthy();
    });

    test('should throw error for invalid url', () => {
      expect(() => {
        Utils.isValidUrl('htt//example.com');
      }).toThrow('Invalid URL');
    });

    test('should throw error for unsupported protocol', () => {
      expect(() => {
        Utils.isValidUrl('abc://example.com');
      }).toThrow(ProtocolNotSupported);
    });
  });

  describe('#isValidPlaylist', () => {
    test('should be able to detect valid playlist content', () => {
      const variantPlaylistContent = `#EXTM3U
      #EXT-X-ENDLIST`;
      expect(Utils.isValidPlaylist(variantPlaylistContent)).toBeTruthy();
    });

    test('should be able to detect invalid playlist content', () => {
      const variantInvalidPlaylistContent = `#EXT
      #EXT-X-ENDLIST`;
      expect(Utils.isValidPlaylist(variantInvalidPlaylistContent)).toBeFalsy();
    });
  });

  describe('#stripFirstSlash', () => {
    test('should remove first slash from aboslute file path', () => {
      expect(Utils.stripFirstSlash('/some/path/to/playlist.m3u8')).toStrictEqual('some/path/to/playlist.m3u8');
    });
  });

  describe('#parseUrl', () => {
    const aUrl = Utils.parseUrl('http://example.com') || {};
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
        Utils.parseUrl('htt//example.com');
      }).toThrow('Invalid URL');
    });
  });

  describe('#omit', () => {
    const subject = { a: 'a', b: 'b', c: 'c', d: 'd' };
    test('should return a trimmed down object when remove array provided', () => {
      expect(Utils.omit(subject, 'b', 'd')).toMatchObject({ a: 'a', c: 'c' });
      expect(Utils.omit(subject, ['b', 'd'])).toMatchObject({ a: 'a', c: 'c' });
      expect(Utils.omit(subject, 'b', ['d'])).toMatchObject({ a: 'a', c: 'c' });
      expect(Utils.omit(subject, ['b', ['d']])).toMatchObject({ a: 'a', c: 'c' });
    });

    test('should return same object when no omit array provided', () => {
      expect(Utils.omit(subject)).toMatchObject(subject);
    });
  });

  describe('isNotFunction', () => {
    test('should return falsy if function provided', () => {
      const subject = () => {};
      expect(Utils.isNotFunction(subject)).toBeFalsy();
    });

    test('to be truthy if fuction not provided', () => {
      const subject = 'NotAFunctionButString';
      expect(Utils.isNotFunction(subject)).toBeTruthy();
    });
  });
});
