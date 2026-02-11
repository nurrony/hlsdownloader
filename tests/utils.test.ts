//@ts-nocheck
import assert from 'node:assert';
import { describe, test } from 'node:test';
import UnsupportedProtocol from '../src/exceptions/UnsupportedProtocol.js';
import { Utils } from '../src/utils.js';

const strictAssert = assert.strict;

describe('HLSUtils', () => {
  describe('isValidUrl()', () => {
    test('should return true for supported protocols', () => {
      strictAssert.ok(Utils.isValidUrl('https://example.com/playlist.m3u8'));
      strictAssert.ok(Utils.isValidUrl('ftp://example.com/file.ts', ['ftp:']));
    });

    test('should throw UnsupportedProtocol for disallowed protocols', () => {
      assert.throws(
        () => Utils.isValidUrl('rtsp://example.com/stream'),
        UnsupportedProtocol, // Check the class type
        /rtsp: is not supported/ // Check the message with regex
      );
    });

    test('should throw TypeError for invalid URL strings', () => {
      strictAssert.throws(() => Utils.isValidUrl('not-a-url'), TypeError);
    });
  });

  describe('stripFirstSlash()', () => {
    test('should remove leading slash if present', () => {
      strictAssert.equal(Utils.stripFirstSlash('/path/to/file'), 'path/to/file');
    });

    test('should return original string if no leading slash', () => {
      strictAssert.equal(Utils.stripFirstSlash('path/to/file'), 'path/to/file');
    });
  });

  describe('isValidPlaylist()', () => {
    test('should return true for valid HLS header', () => {
      const content = '#EXTM3U\n#EXT-X-VERSION:3';
      strictAssert.ok(Utils.isValidPlaylist(content));
    });

    test('should return false for missing HLS header', () => {
      const content = 'random text file content';
      strictAssert.equal(Utils.isValidPlaylist(content), false);
    });
  });

  describe('omit()', () => {
    test('should remove specified keys from an object', () => {
      const source = { a: 1, b: 2, c: 3 };
      const result = Utils.omit(source, 'a', 'c');

      strictAssert.deepEqual(result, { b: 2 });
      strictAssert.ok(!('a' in result));
    });

    test('should handle nested array of keys', () => {
      const source = { name: 'test', type: 'hls', id: 101 };
      // @ts-ignore - testing runtime flatten logic
      const result = Utils.omit(source, ['name', 'id']);

      strictAssert.deepEqual(result, { type: 'hls' });
    });
  });

  describe('isNotFunction()', () => {
    test('should return true for non-functions', () => {
      strictAssert.ok(Utils.isNotFunction('string'));
      strictAssert.ok(Utils.isNotFunction(null));
      strictAssert.ok(Utils.isNotFunction({}));
    });

    test('should return false for functions', () => {
      strictAssert.equal(
        Utils.isNotFunction(() => {}),
        false
      );
      strictAssert.equal(
        Utils.isNotFunction(function () {}),
        false
      );
    });
  });
});
