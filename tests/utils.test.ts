import assert from 'node:assert';
import { describe, test } from 'node:test';
import UnsupportedProtocol from '../src/exceptions/UnsupportedProtocol.js';
import { Utils } from '../src/HLSUtils.js';

describe('HLSUtils', () => {
  describe('isValidUrl()', () => {
    test('should return true for each supported protocols', () => {
      assert.ok(Utils.isValidUrl('https://example.com/playlist.m3u8'));
      assert.ok(Utils.isValidUrl('ftp://example.com/file.ts', ['ftp:']));
      assert.ok(Utils.isValidUrl('sftp://example.com/file.ts', ['sftp:']));
      assert.ok(Utils.isValidUrl('http://example.com/file.ts', ['http:']));
      assert.ok(Utils.isValidUrl('https://example.com/file.ts', ['https:']));
    });

    test('should throw UnsupportedProtocol for disallowed protocols', () => {
      assert.throws(
        () => Utils.isValidUrl('rtsp://example.com/stream'),
        UnsupportedProtocol, // Check the class type
        'rtsp: is not supported' // Check the message with regex
      );
    });

    test('should throw TypeError for invalid URL strings', () => {
      assert.throws(() => Utils.isValidUrl('not-a-url'), TypeError);
    });
  });

  describe('stripFirstSlash()', () => {
    test('should remove leading slash if present', () => {
      assert.equal(Utils.stripFirstSlash('/path/to/file'), 'path/to/file');
    });

    test('should return original string if no leading slash', () => {
      assert.equal(Utils.stripFirstSlash('path/to/file'), 'path/to/file');
    });
  });

  describe('isValidPlaylist()', () => {
    test('should return true for valid HLS header', () => {
      const content = '#EXTM3U\n#EXT-X-VERSION:3';
      assert.ok(Utils.isValidPlaylist(content));
    });

    test('should return false for missing HLS header', () => {
      const content = 'random text file content';
      assert.equal(Utils.isValidPlaylist(content), false);
    });
  });

  describe('omit()', () => {
    test('should remove specified keys from an object', () => {
      const source = { a: 1, b: 2, c: 3 };
      const result = Utils.omit(source, 'a', 'c');

      assert.deepEqual(result, { b: 2 });
      assert.ok(!('a' in result));
    });

    test('should handle nested array of keys', () => {
      const source = { name: 'test', type: 'hls', id: 101 };
      const result = Utils.omit(source, ['name', 'id']);

      assert.deepEqual(result, { type: 'hls' });
    });
  });

  describe('isNotFunction()', () => {
    test('should return true for non-functions', () => {
      assert.ok(Utils.isNotFunction('string'));
      assert.ok(Utils.isNotFunction(null));
      assert.ok(Utils.isNotFunction({}));
    });

    test('should return false for functions', () => {
      assert.equal(
        Utils.isNotFunction(() => {}),
        false
      );
      assert.equal(
        Utils.isNotFunction(function () {}),
        false
      );
    });
  });
});
