// @ts-nocheck
import assert from 'node:assert';
import { describe, test } from 'node:test';
import HLSDownloaderDefault, { HLSDownloader } from '../src/index.js';

const strictAssert = assert.strict;

describe('HLSDownloader Namespace', () => {
  test('should export Downloader via the HLSDownloader namespace', () => {
    strictAssert.ok(HLSDownloader, 'HLSDownloader namespace should be exported');
  });

  test('default export should match named HLSDownloader export', () => {
    strictAssert.deepEqual(HLSDownloaderDefault, HLSDownloader, 'Default export and named export should be identical');
  });

  test('should be able to instantiate Downloader from the namespace', () => {
    const instance = new HLSDownloaderDefault({ playlistURL: 'https://example.com/test.m3u8' });
    strictAssert.ok(instance instanceof HLSDownloaderDefault);
  });
});
