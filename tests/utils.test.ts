import assert from 'node:assert';
import { describe, test } from 'node:test';
import UnsupportedProtocol from '../src/exceptions/UnsupportedProtocol.js';
import { HlsUtils } from '../src/HLSUtils.js';

describe('HLSUtils - Utility Suite', () => {
  describe('isValidUrl()', () => {
    test('should return true for each supported protocols', () => {
      assert.ok(HlsUtils.isValidUrl('https://example.com/playlist.m3u8'));
      assert.ok(HlsUtils.isValidUrl('ftp://example.com/file.ts', ['ftp:']));
      assert.ok(HlsUtils.isValidUrl('sftp://example.com/file.ts', ['sftp:']));
      assert.ok(HlsUtils.isValidUrl('http://example.com/file.ts', ['http:']));
      assert.ok(HlsUtils.isValidUrl('https://example.com/file.ts', ['https:']));
    });

    test('should throw UnsupportedProtocol for disallowed protocols', () => {
      assert.throws(
        () => HlsUtils.isValidUrl('rtsp://example.com/stream'),
        UnsupportedProtocol, // Check the class type
        'rtsp: is not supported' // Check the message with regex
      );
    });

    test('should throw TypeError for invalid URL strings', () => {
      assert.throws(() => HlsUtils.isValidUrl('not-a-url'), TypeError);
    });
  });

  describe('stripFirstSlash()', () => {
    test('should remove leading slash if present', () => {
      assert.equal(HlsUtils.stripFirstSlash('/path/to/file'), 'path/to/file');
    });

    test('should return original string if no leading slash', () => {
      assert.equal(HlsUtils.stripFirstSlash('path/to/file'), 'path/to/file');
    });
  });

  describe('isValidPlaylist()', () => {
    test('should return true for valid HLS header', () => {
      const content = '#EXTM3U\n#EXT-X-VERSION:3';
      assert.ok(HlsUtils.isValidPlaylist(content));
    });

    test('should return false for missing HLS header', () => {
      const content = 'random text file content';
      assert.equal(HlsUtils.isValidPlaylist(content), false);
    });
  });

  describe('omit()', () => {
    test('should remove specified keys from an object', () => {
      const source = { a: 1, b: 2, c: 3 };
      const result = HlsUtils.omit(source, 'a', 'c');

      assert.deepEqual(result, { b: 2 });
      assert.ok(!('a' in result));
    });

    test('should handle nested array of keys', () => {
      const source = { name: 'test', type: 'hls', id: 101 };
      const result = HlsUtils.omit(source, ['name', 'id']);

      assert.deepEqual(result, { type: 'hls' });
    });
  });

  describe('isNotFunction()', () => {
    test('should return true for non-functions', () => {
      assert.ok(HlsUtils.isNotFunction('string'));
      assert.ok(HlsUtils.isNotFunction(null));
      assert.ok(HlsUtils.isNotFunction({}));
    });

    test('should return false for functions', () => {
      assert.equal(
        HlsUtils.isNotFunction(() => {}),
        false
      );
      assert.equal(
        HlsUtils.isNotFunction(function () {}),
        false
      );
    });
  });

  describe('sleep()', () => {
    test('should resolve after approximately the specified time', async () => {
      const start = Date.now();
      const delay = 50;

      await HlsUtils.sleep(delay);

      const elapsed = Date.now() - start;

      assert.ok(elapsed >= delay - 5, `Expected elapsed time ${elapsed} to be >= ${delay}`);
    });
  });
});
