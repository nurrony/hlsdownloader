// @ts-nocheck
import ky from 'ky';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import InvalidPlayList from './../src/exceptions/InvalidPlaylist.js';
import HttpClient from './../src/services/HttpClient.js';

const strictAssert = assert.strict;

describe('HttpClient', () => {
  // Mock data
  const validPlaylist = '#EXTM3U\n#EXT-X-VERSION:3';
  const invalidPlaylist = 'Not a playlist';
  const testUrl = 'https://example.com/playlist.m3u8';

  test('constructor should omit unsupported options', () => {
    const customOptions = {
      retry: { limit: 2 },
      prefixUrl: 'https://wrong-url.com', // Should be omitted
      timeout: 5000,
    };

    const client = new HttpClient(customOptions);
    const options = (client as any).options;

    strictAssert.equal(options.retry.limit, 2);
    strictAssert.strictEqual(options.prefixUrl, undefined, 'Unsupported options should be removed');
    strictAssert.equal(options.timeout, 5000);
  });

  describe('fetchText()', () => {
    test('should return text when playlist is valid', async t => {
      t.mock.method(ky, 'get', () => ({
        text: async () => validPlaylist,
      }));

      const client = new HttpClient();
      const result = await client.fetchText(testUrl);
      strictAssert.equal(result, validPlaylist);
    });

    test('should throw InvalidPlayList when content is invalid', async t => {
      t.mock.method(ky, 'get', () => ({
        text: async () => invalidPlaylist,
      }));

      const client = new HttpClient();
      await strictAssert.rejects(() => client.fetchText(testUrl), InvalidPlayList);
    });
  });

  describe('getStream()', () => {
    test('should return a ReadableStream on success', async t => {
      const mockStream = new ReadableStream();
      t.mock.method(ky, 'get', () => ({
        body: mockStream,
      }));

      const client = new HttpClient();
      const stream = await client.getStream(testUrl);
      strictAssert.ok(stream instanceof ReadableStream);
    });

    test('should throw if response body is null', async t => {
      t.mock.method(ky, 'get', () => ({
        body: null,
      }));

      const client = new HttpClient();
      await strictAssert.rejects(() => client.getStream(testUrl), /Response body is null/);
    });
  });
});
