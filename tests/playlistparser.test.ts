// @ts-nocheck
import assert from 'node:assert';
import { describe, test } from 'node:test';
import playlistParser from '../src/services/PlaylistParser.js';

const strictAssert = assert.strict;

describe('PlaylistParser', () => {
  describe('isPlaylist()', () => {
    test('should return true for .m3u8 extensions', () => {
      strictAssert.ok(playlistParser.isPlaylist('http://example.com/video.m3u8'));
    });

    test('should be case-insensitive', () => {
      strictAssert.ok(playlistParser.isPlaylist('HTTP://EXAMPLE.COM/VIDEO.M3U8'));
    });

    test('should return false for non-playlist extensions', () => {
      strictAssert.equal(playlistParser.isPlaylist('http://example.com/video.mp4'), false);
      strictAssert.equal(playlistParser.isPlaylist('http://example.com/video.ts'), false);
    });
  });

  describe('parse()', () => {
    const baseUrl = 'https://media.example.com/hls/';
    const manifestContent = `
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
segment1.ts
#EXTINF:10.5,
https://external.com/segment2.ts
#EXTINF:9.8,
/absolute/path/segment3.ts
    `.trim();

    test('should extract absolute URLs and resolve relative paths', () => {
      const results = playlistParser.parse(baseUrl, manifestContent);

      strictAssert.equal(results.length, 3, 'Should have extracted 3 segments');

      // Relative path resolution
      strictAssert.equal(results[0], 'https://media.example.com/hls/segment1.ts');

      // Full URL preservation
      strictAssert.equal(results[1], 'https://external.com/segment2.ts');

      // Absolute path resolution (relative to host root)
      strictAssert.equal(results[2], 'https://media.example.com/absolute/path/segment3.ts');
    });

    test('should filter out all lines starting with # (HLS tags)', () => {
      const results = playlistParser.parse(baseUrl, manifestContent);
      const hasTags = results.some(url => url.includes('#EXT'));

      strictAssert.equal(hasTags, false, 'No HLS tags should be present in the results');
    });

    test('should handle empty or whitespace-only lines', () => {
      const contentWithGaps = '#EXTM3U\n\nsegment.ts\n   \nnext.ts';
      const results = playlistParser.parse(baseUrl, contentWithGaps);

      strictAssert.equal(results.length, 2);
      strictAssert.equal(results[0], 'https://media.example.com/hls/segment.ts');
    });
  });
});
