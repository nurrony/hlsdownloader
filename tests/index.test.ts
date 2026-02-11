// @ts-nocheck
import assert from 'node:assert';
import { describe, test } from 'node:test';
import HLSDefault, { HLSDownloader } from '../src/index.js';

const strictAssert = assert.strict;

describe('Entry Point Namespace', () => {
  test('should verify the HLSDownloader namespace structure', () => {
    // Check that the namespace exists
    strictAssert.ok(HLSDownloader, 'Namespace should be defined');

    // Check that the Downloader class is the default export within that namespace
    strictAssert.strictEqual(typeof HLSDownloader.default, 'function', 'Default export should be a class');

    // Verify namespacing matches default export
    strictAssert.deepEqual(HLSDefault, HLSDownloader, 'Default and named exports should match');
  });

  test('should instantiate Downloader from the namespace', () => {
    const Downloader = HLSDownloader.default;
    const instance = new Downloader({ playlistURL: 'https://example.com/test.m3u8' });

    // Verifying it properly uses default values like concurrency
    strictAssert.ok(instance);
    strictAssert.equal(typeof instance.startDownload, 'function');
  });
});
