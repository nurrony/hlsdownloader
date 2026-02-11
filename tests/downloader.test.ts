// @ts-nocheck
import assert from 'node:assert';
import { cpus } from 'node:os';
import { describe, mock, test } from 'node:test';
import Downloader from './../src/Downloader.js';
import FileService from './../src/services/FileWriter.js';
import HttpClient from './../src/services/HttpClient.js';

const strictAssert = assert.strict;

describe('Downloader', () => {
  const playlistURL = 'https://example.com/master.m3u8';
  const segmentUrl = 'https://example.com/seg-1.ts';

  test('should initialize with default values when optional parameters are missing', () => {
    // Initialize with only the required parameter
    const downloader = new Downloader({ playlistURL });

    // Verify internal state matches defaults defined in constructor
    strictAssert.equal((downloader as any).playlistURL, playlistURL);
    strictAssert.equal((downloader as any).onData, undefined);
    strictAssert.equal((downloader as any).onError, undefined);

    // Verify FileService defaults passed from Downloader
    const fileService = (downloader as any).fileService;
    strictAssert.equal(fileService.destination, '');
    strictAssert.equal((fileService as any).overwrite, false);

    // Verify items array starts with the playlist URL
    strictAssert.deepEqual((downloader as any).items, [playlistURL]);

    // Verify concurrency default (cpus().length - 1, minimum 1)
    const expectedConcurrency = Math.max(1, cpus().length - 1);
    // Since p-limit doesn't expose concurrency directly easily,
    // we verify the pool exists.
    strictAssert.ok((downloader as any).pool);
  });

  test('should handle null/undefined options gracefully', () => {
    // This covers the "options || {}" logic in the constructor
    // @ts-ignore - testing runtime robustness
    const downloader = new Downloader(undefined);

    strictAssert.equal((downloader as any).playlistURL, '');
    strictAssert.equal((downloader as any).fileService.destination, '');
  });

  test('should complete disk download successfully', async t => {
    // Mock HttpClient
    t.mock.method(HttpClient.prototype, 'fetchText', async () => '#EXTM3U\nsegment.ts');
    t.mock.method(HttpClient.prototype, 'getStream', async () => new ReadableStream());

    // Mock FileService
    t.mock.method(FileService.prototype, 'canWrite', async () => true);
    t.mock.method(FileService.prototype, 'prepareDirectory', async () => '/tmp/path');
    t.mock.method(FileService.prototype, 'saveStream', async () => {});

    const onDataMock = mock.fn();
    const downloader = new Downloader({
      playlistURL,
      destination: '/downloads',
      onData: onDataMock,
    });

    const summary = await downloader.startDownload();

    strictAssert.equal(summary.total, 2); // master + segment
    strictAssert.equal(onDataMock.mock.callCount(), 2);
    strictAssert.equal(summary.message, 'Downloaded successfully');
  });

  test('should handle overwrite failure', async t => {
    t.mock.method(HttpClient.prototype, 'fetchText', async () => '#EXTM3U\nsegment.ts');
    t.mock.method(FileService.prototype, 'canWrite', async () => false);

    const downloader = new Downloader({ playlistURL, destination: '/exists' });
    const summary = await downloader.startDownload();

    strictAssert.equal(summary.errors[0].message, 'Directory already exists and overwrite is disabled');
  });

  test('should handle network-only mode (no destination)', async t => {
    t.mock.method(HttpClient.prototype, 'fetchText', async () => '#EXTM3U\nsegment.ts');
    t.mock.method(HttpClient.prototype, 'getStream', async () => new ReadableStream());

    const downloader = new Downloader({ playlistURL }); // No destination
    const summary = await downloader.startDownload();

    strictAssert.equal(summary.total, 2);
    strictAssert.equal(summary.errors.length, 0);
  });

  test('should handle variant playlists recursively', async t => {
    const fetchTextMock = t.mock.method(HttpClient.prototype, 'fetchText');
    fetchTextMock.mock.mockImplementation(async url => {
      if (url.includes('master')) return 'variant.m3u8';
      if (url.includes('variant')) return 'chunk.ts';
      return '';
    });
    t.mock.method(HttpClient.prototype, 'getStream', async () => new ReadableStream());

    const downloader = new Downloader({ playlistURL: 'https://ex.com/master.m3u8' });
    const summary = await downloader.startDownload();

    // master + variant + chunk = 3
    strictAssert.equal(summary.total, 3);
  });

  test('should trigger onError callback on failures', async t => {
    t.mock.method(HttpClient.prototype, 'fetchText', async () => {
      throw new Error('Network Fail');
    });

    const onErrorMock = mock.fn();
    const downloader = new Downloader({ playlistURL, onError: onErrorMock });

    await downloader.startDownload();
    strictAssert.equal(onErrorMock.mock.callCount(), 1);
  });

  test('processQueue (Fetch-only): should trigger onData for each item', async t => {
    // Mock fetchText to return one segment
    t.mock.method(HttpClient.prototype, 'fetchText', async () => '#EXTM3U\nsegment1.ts');

    // Mock getStream to return a dummy stream
    const mockStream = new ReadableStream();
    t.mock.method(HttpClient.prototype, 'getStream', async () => mockStream);

    const onDataMock = mock.fn();
    // Initialize WITHOUT a destination to trigger Fetch-only mode
    const downloader = new Downloader({
      playlistURL,
      onData: onDataMock,
    });

    await downloader.startDownload();

    // Should be called twice: once for playlist, once for segment1.ts
    strictAssert.equal(onDataMock.mock.callCount(), 2);
    const firstCall = onDataMock.mock.calls[0].arguments[0];
    strictAssert.equal(firstCall.url, playlistURL);
    strictAssert.ok(firstCall.total >= 2);
  });

  test('processQueue (Fetch-only): should handle stream errors', async t => {
    t.mock.method(HttpClient.prototype, 'fetchText', async () => '#EXTM3U\nsegment1.ts');

    // Force getStream to fail
    const streamError = new Error('Stream Break');
    t.mock.method(HttpClient.prototype, 'getStream', async () => {
      throw streamError;
    });

    const onErrorMock = mock.fn();
    const downloader = new Downloader({
      playlistURL,
      onError: onErrorMock,
    });

    const summary = await downloader.startDownload();

    // Verify error was caught and processed through handleError
    strictAssert.equal(onErrorMock.mock.callCount(), 2); // playlist + segment
    strictAssert.equal(summary.errors[0].message, 'Stream Break');
  });

  test('downloadFile(): success path with onData callback', async t => {
    // 1. Setup Mocks for internal services
    const mockStream = new ReadableStream();
    const mockPath = '/downloads/seg-1.ts';

    t.mock.method(HttpClient.prototype, 'getStream', async () => mockStream);
    t.mock.method(FileService.prototype, 'prepareDirectory', async () => mockPath);
    const saveStreamMock = t.mock.method(FileService.prototype, 'saveStream', async () => {});

    // 2. Setup Spy for onData
    const onDataMock = mock.fn();

    const downloader = new Downloader({
      playlistURL,
      destination: './output',
      onData: onDataMock,
    });

    // 3. Execute the private method (casting to any to access private for testing)
    await (downloader as any).downloadFile(segmentUrl);

    // 4. Assertions
    strictAssert.equal(saveStreamMock.mock.callCount(), 1);
    strictAssert.equal(onDataMock.mock.callCount(), 1);

    const callbackData = onDataMock.mock.calls[0].arguments[0];
    strictAssert.deepEqual(callbackData, {
      url: segmentUrl,
      path: mockPath,
      total: 1, // Only the playlistURL in items initially
    });
  });

  test('downloadFile(): catch block and handleError path', async t => {
    // 1. Force a failure in the first step of the try-block
    const networkError = new Error('Network Timeout');
    t.mock.method(HttpClient.prototype, 'getStream', async () => {
      throw networkError;
    });

    // 2. Setup Spy for onError (which is called by handleError)
    const onErrorMock = mock.fn();

    const downloader = new Downloader({
      playlistURL,
      onError: onErrorMock,
    });

    // 3. Execute
    await (downloader as any).downloadFile(segmentUrl);

    // 4. Assertions
    strictAssert.equal(onErrorMock.mock.callCount(), 1);
    const errorData = onErrorMock.mock.calls[0].arguments[0];
    strictAssert.equal(errorData.url, segmentUrl);
    strictAssert.equal(errorData.message, 'Network Timeout');
  });
});
