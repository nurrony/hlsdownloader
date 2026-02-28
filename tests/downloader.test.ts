import assert from 'node:assert';
import { describe, mock, test } from 'node:test';
import Downloader from './../src/Downloader.js';
import { HlsUtils } from './../src/HLSUtils.js';
import FileService from './../src/services/FileWriter.js';
import HttpClient from './../src/services/HttpClient.js';
import PlaylistParser from './../src/services/PlaylistParser.js';

describe('Downloader', () => {
  const playlistURL = 'https://example.com/master.m3u8';
  const segmentUrl = 'https://example.com/seg-1.ts';

  describe('constructor', () => {
    test('should initialize and inherit from EventEmitter', () => {
      const downloader = new Downloader({ playlistURL });
      assert.strictEqual(typeof downloader.on, 'function');
      assert.strictEqual(typeof downloader.emit, 'function');
    });
    test('should initialize with default values when optional parameters are missing', () => {
      // Initialize with only the required parameter
      const downloader = new Downloader({ playlistURL });

      const items = (downloader as any).items;

      assert.ok(items instanceof Set, 'Items should be an instance of Set');

      // Verify internal state matches defaults defined in constructor
      assert.equal((downloader as any).playlistURL, playlistURL);

      // Verify FileService defaults passed from Downloader
      const fileService = (downloader as any).fileService;
      assert.equal(fileService.destination, '');
      assert.equal((fileService as any).overwrite, false);

      // Verify items array starts with the playlist URL
      assert.strictEqual(items.size, 1);
      assert.ok(items.has(playlistURL), 'Set should contain the playlist URL');

      assert.ok((downloader as any).concurrency > 0);
      assert.ok((downloader as any).pool);
    });

    test('should handle null/undefined options gracefully', () => {
      // This covers the "options || {}" logic in the constructor
      // @ts-expect-error - testing runtime robustness
      const downloader = new Downloader(undefined);

      assert.equal((downloader as any).playlistURL, '');
      assert.equal((downloader as any).fileService.destination, '');
    });
  });

  describe('processQueue', () => {
    test('should handle stream errors', async t => {
      t.mock.method(HttpClient.prototype, 'fetchText', async () => '#EXTM3U\nsegment1.ts');

      // Force getStream to fail
      const streamError = new Error('Stream Break');
      t.mock.method(HttpClient.prototype, 'getStream', async () => {
        throw streamError;
      });

      const downloader = new Downloader({
        playlistURL,
      });

      const summary = await downloader.startDownload();
      assert.equal(summary.errors[0].message, 'Stream Break');
    });
    test('should handle master playlist fetch failure', async t => {
      t.mock.method(HttpClient.prototype, 'fetchText', async () => {
        throw new Error('404 Not Found');
      });

      const downloader = new Downloader({ playlistURL });

      // This satisfies the EventEmitter requirements and lets the test continue
      const errorEvents: any[] = [];
      downloader.on('error', err => {
        errorEvents.push(err);
      });

      const summary = await downloader.startDownload();

      assert.strictEqual(summary.errors.length, 1);
      assert.strictEqual(summary.errors[0].message, '404 Not Found');
      assert.strictEqual(errorEvents.length, 1, 'Should have emitted exactly one error event');
      assert.strictEqual(errorEvents[0].message, '404 Not Found');
    });

    test('should capture segment-specific errors without failing the whole job', async t => {
      t.mock.method(HttpClient.prototype, 'fetchText', async () => '#EXTM3U\nseg1.ts\nseg2.ts');
      t.mock.method(PlaylistParser, 'parse', () => ['https://ex.com/seg1.ts', 'https://ex.com/seg2.ts']);

      // Fail only one segment
      let callCount = 0;
      t.mock.method(HttpClient.prototype, 'getStream', async () => {
        callCount++;
        if (callCount === 2) throw new Error('Segment Timeout');
        return new ReadableStream();
      });

      const downloader = new Downloader({ playlistURL });
      const errorSpy = mock.fn();
      downloader.on('error', errorSpy);

      const summary = await downloader.startDownload();

      assert.strictEqual(summary.errors.length, 1);
      assert.strictEqual(errorSpy.mock.callCount(), 1);
      assert.strictEqual(summary.errors[0].message, 'Segment Timeout');
    });

    test('should handle variant playlists recursively', async t => {
      const fetchTextMock = t.mock.method(HttpClient.prototype, 'fetchText');
      fetchTextMock.mock.mockImplementation(async url => {
        if (url.includes('master')) return 'variant.m3u8';
        if (url.includes('variant')) return 'chunk.ts';
        return '#EXTM3U';
      });

      t.mock.method(PlaylistParser, 'isPlaylist', (url: string) => url.endsWith('.m3u8'));
      t.mock.method(PlaylistParser, 'parse', (url: string, content: string) => {
        if (content === 'variant.m3u8') return ['https://ex.com/variant.m3u8'];
        if (content === 'chunk.ts') return ['https://ex.com/chunk.ts'];
        return [];
      });

      const downloader = new Downloader({ playlistURL: 'https://ex.com/master.m3u8' });
      const summary = await downloader.startDownload();

      // items: master (init) + variant (from master) + chunk (from variant) = 3
      assert.strictEqual(summary.total, 3);
    });
  });

  describe('Disk-Downlaod', () => {
    test('should emit "error" and stop if directory is not writable', async t => {
      t.mock.method(HttpClient.prototype, 'fetchText', async () => '#EXTM3U');
      t.mock.method(FileService.prototype, 'canWrite', async () => false);

      const downloader = new Downloader({ playlistURL, destination: '/protected' });
      let capturedError: any;
      downloader.on('error', err => {
        capturedError = err;
      });

      await downloader.startDownload();

      assert.strictEqual(capturedError.message, 'Directory already exists and overwrite is disabled');
    });

    test('should emit "start", "progress", and "end" on successful completion', async t => {
      // 1. Setup Mocks
      t.mock.method(HlsUtils, 'isValidUrl', () => true);
      t.mock.method(HttpClient.prototype, 'fetchText', async () => '#EXTM3U\nsegment.ts');
      t.mock.method(PlaylistParser, 'parse', () => [segmentUrl]);
      t.mock.method(FileService.prototype, 'canWrite', async () => true);
      t.mock.method(HttpClient.prototype, 'getStream', async () => new ReadableStream());
      t.mock.method(FileService.prototype, 'prepareDirectory', async () => '/tmp/path');
      t.mock.method(FileService.prototype, 'saveStream', async () => {});

      const downloader = new Downloader({
        playlistURL,
        destination: '/downloads',
      });

      const events: string[] = [];
      downloader.on('start', () => events.push('start'));
      downloader.on('progress', () => events.push('progress'));
      downloader.on('end', () => events.push('end'));

      const summary = await downloader.startDownload();

      // 2. Assertions
      assert.deepStrictEqual(events, ['start', 'progress', 'progress', 'end']); // Progress for manifest + segment
      assert.strictEqual(summary.total, 2);
      assert.strictEqual(summary.errors.length, 0);
    });

    test('should cover catch block in downloadFile when a segment fails', async t => {
      const playlistURL = 'https://example.com/master.m3u8';
      const segmentUrl = 'https://example.com/segment.ts';

      // 1. Setup mocks
      t.mock.method(HttpClient.prototype, 'fetchText', async () => '#EXTM3U\nsegment.ts');
      t.mock.method(PlaylistParser, 'parse', () => [segmentUrl]);
      t.mock.method(FileService.prototype, 'canWrite', async () => true);
      t.mock.method(FileService.prototype, 'prepareDirectory', async () => '/tmp/seg.ts');
      t.mock.method(FileService.prototype, 'saveStream', async () => {});

      // 2. Surgical Mock: The first call (manifest) succeeds, second (segment) fails
      let streamCallCount = 0;
      t.mock.method(HttpClient.prototype, 'getStream', async () => {
        streamCallCount++;
        if (streamCallCount === 2) {
          // This hits the 'catch' block in downloadFile
          throw new Error('Segment Download Failed');
        }
        return new ReadableStream();
      });

      const downloader = new Downloader({ playlistURL, destination: '/downloads' });

      // Handle the error event to prevent process exit
      const errorSpy = t.mock.fn();
      downloader.on('error', errorSpy);

      const summary = await downloader.startDownload();

      assert.strictEqual(summary.errors.length, 1, 'Should record the single segment failure');
      assert.strictEqual(summary.errors[0].message, 'Segment Download Failed');
      assert.strictEqual(errorSpy.mock.callCount(), 1);
    });
  });

  describe('Fetch-Only', () => {
    test('should process segments as streams without writing to disk', async t => {
      t.mock.method(HttpClient.prototype, 'fetchText', async () => '#EXTM3U\nseg.ts');
      t.mock.method(HttpClient.prototype, 'getStream', async () => new ReadableStream());

      const downloader = new Downloader({ playlistURL }); // No destination
      const progressSpy = mock.fn();
      downloader.on('progress', progressSpy);

      const summary = await downloader.startDownload();

      assert.strictEqual(summary.total, 2);
      assert.strictEqual(progressSpy.mock.callCount(), 2);
    });
  });
});
