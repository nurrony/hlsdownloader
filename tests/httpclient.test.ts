import assert from 'node:assert';
import { describe, test } from 'node:test';
import { ProxyAgent } from 'undici';
import InvalidPlayList from './../src/exceptions/InvalidPlaylist.js';
import { HlsUtils } from './../src/HLSUtils.js';
import HttpClient from './../src/services/HttpClient.js';

describe('HttpClient', () => {
  const testUrl = 'https://example.com/playlist.m3u8';
  const internalUrl = 'https://localhost/playlist.m3u8';
  const validPlaylist = '#EXTM3U\n#EXT-X-VERSION:3';

  describe('Proxy Bypass and Edge Cases', () => {
    test('should bypass dispatcher for noProxy matches', async t => {
      const mockFetch = t.mock.method(global, 'fetch', async () => new Response('#EXTM3U'));

      const client = new HttpClient({
        proxy: 'http://corp-proxy:8080',
        noProxy: ['localhost'],
      });

      // 1. External Call (Should use proxy)
      await client.fetchText(testUrl);
      // @ts-expect-error never occurs
      assert.ok(mockFetch.mock.calls[0].arguments[1].dispatcher instanceof ProxyAgent);

      // 2. Internal Call (Should NOT use proxy)
      await client.fetchText(internalUrl);
      // @ts-expect-error never occurs
      assert.strictEqual(mockFetch.mock.calls[1].arguments[1].dispatcher, undefined);
    });

    test('should handle environment-based noProxy patterns', _ => {
      process.env.NO_PROXY = '.internal.com, 127.0.0.1';
      const client = new HttpClient({ proxy: 'http://proxy' });

      // Test helper logic directly for coverage
      assert.strictEqual((client as any).shouldBypassProxy('https://api.internal.com/test'), true);
      assert.strictEqual((client as any).shouldBypassProxy('https://google.com'), false);

      delete process.env.NO_PROXY;
    });
  });

  describe('fetchText()', () => {
    test('should return content when playlist is valid', async t => {
      t.mock.method(global, 'fetch', async () => new Response(validPlaylist));

      const client = new HttpClient();
      const result = await client.fetchText(testUrl);

      assert.strictEqual(result, validPlaylist);
    });

    test('should throw InvalidPlayList when HLS validation fails', async t => {
      t.mock.method(global, 'fetch', async () => new Response('INVALID CONTENT'));

      const client = new HttpClient();
      await assert.rejects(() => client.fetchText(testUrl), InvalidPlayList, 'Should have validated the M3U8 header');
    });
  });

  describe('getStream()', () => {
    test('should return a ReadableStream on successful request', async t => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      });

      t.mock.method(global, 'fetch', async () => new Response(mockStream));

      const client = new HttpClient();
      const stream = await client.getStream(testUrl);

      assert.ok(stream instanceof ReadableStream);
    });

    test('should throw Error when response body is null (Edge Case)', async t => {
      // Some specialized responses or 204 No Content might have a null body
      t.mock.method(global, 'fetch', async () => new Response(null));

      const client = new HttpClient();
      await assert.rejects(() => client.getStream(testUrl), /Response body is null/);
    });
  });

  describe('requestWithRetry', () => {
    const testUrl = 'https://example.com/playlist.m3u8';
    const setupClient = () => {
      const client = new HttpClient({ retry: { limit: 1, delay: 0 } });
      return client;
    };

    test('should retry and succeed without hanging the event loop', async t => {
      let fetchCalls = 0;

      // 1. Mock fetch to fail once then succeed
      t.mock.method(global, 'fetch', async () => {
        fetchCalls++;
        if (fetchCalls === 1) return new Response(null, { status: 500 });
        return new Response('#EXTM3U');
      });

      const client = new HttpClient({ retry: { limit: 1, delay: 1000 } });

      // This bypasses the need for t.mock.timers and prevents the hang
      t.mock.method(HlsUtils, 'sleep', async () => Promise.resolve());

      const result = await client.fetchText(testUrl);

      assert.strictEqual(result, '#EXTM3U');
      assert.strictEqual(fetchCalls, 2);
    });

    test('should throw after exhausting all retries', async t => {
      t.mock.method(global, 'fetch', async () => {
        return new Response(null, { status: 502 });
      });

      const client = new HttpClient({ retry: { limit: 2, delay: 500 } });
      t.mock.method(HlsUtils, 'sleep', async () => Promise.resolve());

      await assert.rejects(() => client.fetchText(testUrl));
    });

    test('Branch: Retry on 429 (Too Many Requests)', async t => {
      let calls = 0;
      t.mock.method(global, 'fetch', async () => {
        calls++;
        if (calls === 1) return new Response(null, { status: 429 });
        return new Response('#EXTM3U');
      });

      t.mock.method(HlsUtils, 'sleep', async () => Promise.resolve());

      const client = setupClient();
      await client.fetchText(testUrl);
      assert.strictEqual(calls, 2, 'Should retry once on 429');
    });

    test('Branch: Retry on 500 (Server Error)', async t => {
      let calls = 0;
      t.mock.method(global, 'fetch', async () => {
        calls++;
        if (calls === 1) return new Response(null, { status: 500 });
        return new Response('#EXTM3U');
      });

      t.mock.method(HlsUtils, 'sleep', async () => Promise.resolve());

      const client = setupClient();
      await client.fetchText(testUrl);
      assert.strictEqual(calls, 2, 'Should retry once on 500');
    });

    test('Branch: Do NOT retry on 404 (Not Found)', async t => {
      let calls = 0;
      t.mock.method(global, 'fetch', async () => {
        calls++;
        return new Response(null, { status: 404 });
      });

      t.mock.method(HlsUtils, 'sleep', async () => Promise.resolve());

      const client = setupClient();
      // It should throw immediately without retrying
      await assert.rejects(() => client.fetchText(testUrl));
      assert.strictEqual(calls, 1, 'Should NOT retry on 404');
    });

    test('Branch: Exhaust limit (attempt >= limit)', async t => {
      let calls = 0;
      t.mock.method(global, 'fetch', async () => {
        calls++;
        return new Response(null, { status: 503 });
      });

      t.mock.method(HlsUtils, 'sleep', async () => Promise.resolve());

      const client = setupClient(); // limit is 1
      await assert.rejects(() => client.fetchText(testUrl));

      // 1 initial + 1 retry = 2 calls total
      assert.strictEqual(calls, 2, 'Should stop after exhausting limit');
    });

    test('catch block: should retry on AbortError (Timeout)', async t => {
      let calls = 0;
      t.mock.method(global, 'fetch', async () => {
        calls++;
        if (calls === 1) {
          const err = new Error('timeout');
          err.name = 'AbortError';
          throw err;
        }
        return new Response('#EXTM3U');
      });

      t.mock.method(HlsUtils, 'sleep', async () => Promise.resolve());

      const client = setupClient();
      const result = await client.fetchText(testUrl);
      assert.strictEqual(calls, 2);
      assert.strictEqual(result, '#EXTM3U');
    });

    test('catch block: should retry on TypeError (Network Failure)', async t => {
      let calls = 0;
      t.mock.method(global, 'fetch', async () => {
        calls++;
        if (calls === 1) throw new TypeError('Failed to fetch');
        return new Response('#EXTM3U');
      });

      t.mock.method(HlsUtils, 'sleep', async () => Promise.resolve());
      const client = setupClient();
      await client.fetchText(testUrl);
      assert.strictEqual(calls, 2);
    });

    test('catch block: should retry on error with status >= 500', async t => {
      let calls = 0;
      t.mock.method(global, 'fetch', async () => {
        calls++;
        if (calls === 1) {
          // Simulating a thrown error that carries a status code
          const err: any = new Error('Server Error');
          err.status = 503;
          throw err;
        }
        return new Response('#EXTM3U');
      });

      t.mock.method(HlsUtils, 'sleep', async () => Promise.resolve());

      const client = setupClient();
      await client.fetchText(testUrl);
      assert.strictEqual(calls, 2);
    });

    test('catch block: should NOT retry and throw on 400 errors', async t => {
      t.mock.method(global, 'fetch', async () => {
        const err: any = new Error('Bad Request');
        err.status = 400;
        throw err;
      });

      t.mock.method(HlsUtils, 'sleep', async () => Promise.resolve());

      const client = setupClient();
      await assert.rejects(
        () => client.fetchText(testUrl),
        (err: any) => {
          return err.status === 400;
        }
      );
    });
  });
});
