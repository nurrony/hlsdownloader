import assert from 'node:assert';
import { describe, test } from 'node:test';
import HLSDownloaderDefault, { HLSDownloader } from '../src/index.js';

describe('HLSDownloader Namespace', () => {
  test('should export Downloader via the HLSDownloader namespace', () => {
    assert.ok(HLSDownloader, 'HLSDownloader namespace should be exported');
  });

  test('default export should match named HLSDownloader export', () => {
    assert.deepEqual(HLSDownloaderDefault, HLSDownloader, 'Default export and named export should be identical');
  });

  test('should be able to instantiate Downloader from the namespace', () => {
    const instance = new HLSDownloaderDefault({ playlistURL: 'https://example.com/test.m3u8' });
    assert.ok(instance instanceof HLSDownloaderDefault);
  });
});
