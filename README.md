<div align="center">

[![HLSDownloader](./assets/logo.png)](https://nurrony.github.io/hlsdownloader/)<br />

</div>

<p align="center" style="font-size: 18px;">
Downloads HLS Playlist file and TS chunks. You can use it for content pre-fetching from CDN to Edge Server for your end viewers. A high-performance, tree-shaken HLS (HTTP Live Streaming) downloader engine. Built with modern ESM architecture, providing 100% type safety and zero-waste bundling. 
</p>

<p align="center" style="font-size: 18px;">
<a href="https://www.npmjs.com/package/hlsdownloader"><b>NPM</b></a> • <a href="https://nurrony.github.io/hlsdownloader/"><b>Documentation</b></a> •  <a href="https://github.com/nurrony/hlsdownloader"><b>GitHub</b></a>
</p>

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/hlsdownloader?color=blue)](https://www.npmjs.com/package/hlsdownloader)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/nurrony/hlsdownloader/actions/workflows/ci.yaml/badge.svg?style=flat-square)](https://github.com/nurrony/hlsdownloader/actions/workflows/ci.yaml)
[![Coverage Status](https://coveralls.io/repos/github/nurrony/hlsdownloader/badge.svg?branch=main)](https://coveralls.io/github/nurrony/hlsdownloader?branch=main)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg?style=flat-square)](https://nurrony.github.io/hlsdownloader)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square) ](https://github.com/nurrony/hlsdownloader/graphs/commit-activity)
[![Semver: Badge](https://img.shields.io/badge/%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079?style=flat-square) ](https://npmjs.com/package/hlsdownloader)
[![Downloads: HLSDownloader](https://img.shields.io/npm/dm/hlsdownloader.svg?style=flat-square) ](https://npm-stat.com/charts.html?package=hlsdownloader)
[![Min Bundle Size: HLSDownloader](https://img.shields.io/bundlephobia/minzip/hlsdownloader?style=flat-square) ](https://bundlephobia.com/package/hlsdownloader@latest)
[![Known Vulnerabilities](https://snyk.io/test/github/nurrony/hlsdownloader/badge.svg)](https://snyk.io/test/github/nurrony/hlsdownloader)

</div>

> ⚠️
> <strong>This package is native [ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and no longer provides a CommonJS export. If your project uses CommonJS, you will have to [convert to ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). Please don't open issues for questions regarding CommonJS / ESM.</strong>

> ⚠️
> <strong>HLSDownloader `v2.x.x` is no longer maintained and we will not accept any backport requests.</strong>

---

## Features

- **Event Based:** Event based API
- **Modern ESM**: Optimized for Node.js 20+ environments using native modules.
- **TypeScript Native:** Built with strong typing for mission-critical applications.
- **Resilient Networking and Retryable**: Built-in resilience that automatically retries with exponential backoff of failed segment requests to ensure download completion.
- **Promise Based**: Fully asynchronous API designed for seamless integration with `async/await` and modern control flows.
- **Support for HTTP/2**: Leverages multiplexing to download multiple segments over a single connection for reduced overhead.
- **Overwrite Protection**: Safeguards your local data by preventing accidental overwriting of existing files unless explicitly enabled.
- **Support for Custom HTTP Headers**: Allows injection of custom headers for handling authentication, user-agents, or session tokens.
- **Concurrent Downloads**: Maximizes bandwidth by fetching multiple HLS segments simultaneously through parallel HTTP connections.
- **Proxy and NoProxy Support:** Proxy support and No Proxy support ([undici](https://github.com/nodejs/undici) integration).
- **Professional Docs**: Integrated JSDoc-to-HTML pipeline using TypeDoc and the Fresh theme.

> **Note: This library requires [undici](https://github.com/nodejs/undici) as a peer dependency for proxy support.**

---

## Installation

```bash
npm install hlsdownloader
```

## Examples

#### Example 1: Basic Download with Event Monitoring

This is the standard implementation for saving a remote HLS stream to a local directory.

```ts
import { HLSDownloader } from 'hlsdownloader';

async function downloadStream() {
  const downloader = new HLSDownloader({
    playlistURL: 'https://example.com/video/master.m3u8',
    destination: './downloads/my-video',
    overwrite: true,
    concurrency: 5, // Process 5 segments simultaneously
    retry: { limit: 3, delay: 1000 },
    timeout: 15000,
  });

  downloader.on('start', ({ total }) => console.log(`start downloading assets...`));

  // Listen to progress updates
  downloader.on('progress', data => {
    const percent = ((data.total / data.total) * 100).toFixed(2); // Simple logic for example
    console.log(`[Progress] Downloaded: ${data.url}`);
  });

  // Handle errors for specific segments
  downloader.on('error', err => {
    console.error(`[Segment Error] Failed to fetch ${err.url}: ${err.message}`);
  });

  // Final summary
  const summary = await downloader.startDownload();
  console.log(`Finished! Total items: ${summary.total}. Errors: ${summary.errors.length}`);
}

downloadStream();
```

#### Example 2: "Dry-Run" / CDN Priming (No File Writing)

If the destination is omitted, the library fetches streams but doesn't write to disk. This is excellent for `CDN Priming` or `validating manifest health`.

```ts
import { HLSDownloader } from 'hlsdownloader';

async function primeCDN() {
  const downloader = new HLSDownloader({
    playlistURL: 'https://cdn.provider.com/live/stream.m3u8',
    // destination is omitted -> results in memory-only stream fetch
    concurrency: 10,
    headers: {
      Authorization: 'Bearer internal-token-123',
      'X-Custom-Source': 'Prewarm-Service',
    },
  });

  downloader.on('start', ({ total }) => console.log(`Priming ${total} assets...`));

  const result = await downloader.startDownload();

  if (result.errors.length === 0) {
    console.log('CDN Cache successfully warmed.');
  } else {
    console.error('Priming failed for some chunks', result.errors);
  }
}

primeCDN();
```

#### Example 3: Corporate Proxy & Advanced Networking

If you are using behind corporate proxy, pass the proxy and no proxy configuration as follows

```ts
import { HLSDownloader } from 'hlsdownloader';

const downloader = new HLSDownloader({
  playlistURL: 'https://secure-stream.corp.internal/index.m3u8',
  destination: '/mnt/storage/archive',
  proxy: 'http://proxy.corporate.net:8080',
  noProxy: '.internal.com,localhost', // Bypass proxy for internal domains
  headers: {
    Cookie: 'session_id=abc123',
    'User-Agent': 'MediaArchiver/1.0',
  },
});

downloader.on('start', ({ total }) => console.log(`Priming ${total} assets...`));

// Listen to progress updates
downloader.on('progress', data => {
  const percent = ((data.total / data.total) * 100).toFixed(2); // Simple logic for example
  console.log(`[Progress] Downloaded: ${data.url}`);
});

// Handle errors for specific segments
downloader.on('error', err => {
  console.error(`[Segment Error] Failed to fetch ${err.url}: ${err.message}`);
});

const summary = await downloader.startDownload();
```

#### Example 4: Simple progress bar

This example demostrate a simple download progressbar. You can bring your own progress bar implementation

```ts
import { HLSDownloader } from 'hlsdownloader';

const downloader = new HLSDownloader({
  playlistURL: 'https://stream.example.com/playlist/master.m3u8',
  concurrency: 5,
  retry: { limit: 3, delay: 1000 },
  headers: { 'User-Agent': 'MyHeader' },
  timeout: 15000,
});

downloader.on('start', ({ total }) => {
  console.log(`Starting download of ${total} segments...`);
});

downloader.on('progress', ({ processed, total, url }) => {
  const percentage = Math.round((processed / total) * 100);
  const progressBar = '='.repeat(Math.floor(percentage / 5)).padEnd(20, ' ');
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`[${progressBar}] ${percentage}% | Processing: ${processed}/${total}`);
});

downloader.on('end', () => {
  process.stdout.write('\nDownload Complete!\n');
});

await downloader.startDownload();
```

## API Documentation

The library is organized under the `HLSDownloader` module. For full interactive documentation, visit our [Documentation](https://nurrony.github.io/hlsdownloader) site.

### HLSDownloader (Class)

The main service orchestrator for fetching HLS content.

| Method          | Returns                    | Description                           |
| --------------- | -------------------------- | ------------------------------------- |
| startDownload() | `Promise<DownloadSummary>` | Begins parsing and fetching segments. |

### DownloaderOptions (Interface)

| Option      | Type      | Default                  | Description                                                                                |
| ----------- | --------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| playlistURL | `string`  | Required                 | The source .m3u8 URL.                                                                      |
| destination | `string`  | undefined                | Local path to save files. Omit for "dry-run" mode.                                         |
| concurrency | `number`  | os.cpus().length         | Simultaneous segment downloads.                                                            |
| overwrite   | `boolean` | false                    | Overwrite existing files in the destination.                                               |
| headers     | `object`  | {}                       | Custom headers to pass                                                                     |
| timeout     | `number`  | 10000                    | Network request timeout in ms.                                                             |
| retry       | `object`  | { limit: 1, delay: 500 } | Exponential backoff settings.                                                              |
| proxy       | `string`  | undefined                | Corporate proxy URL. Also reads URLs for `HTTP_PROXY`, `HTTPS_PROXY` environment variables |
| noProxy     | `string`  | undefined                | Corporate No Proxy Urls. Also reads urls from `NO_PROXY` environment vriable               |

### DownloaderEvents (Interface)

| Event Name | Description                                  |
| ---------- | -------------------------------------------- |
| start      | emits when download started                  |
| progress   | emits for each segement downloded            |
| error      | emits when a segement downlod error occurred |
| end        | emits when download ended                    |

### DownloadSummary (Interface)

| Property | Type              | Description                           |
| -------- | ----------------- | ------------------------------------- |
| total    | `number`          | Count of successfully saved segments. |
| message  | `string`          | User friendly message.                |
| errors   | `DownloadError[]` | Array of detailed failure objects.    |

### SegmentDownloadedData (Interface) - emits on `progress` events

| Property  | Type     | Description                                                                |
| --------- | -------- | -------------------------------------------------------------------------- |
| url       | `string` | Original segment URL as referenced in the HLS playlist (`.m3u8`).          |
| path      | `string` | Local file system path where the segment was saved. Empty if not provided. |
| processed | `number` | Total number of segments downloaded so far.                                |
| total     | `number` | Total number of segments downloaded to download, including this one.       |

---

### SegmentDownloadErrorData (Interface) - emits on `error` events

| Property | Type     | Description                                                |
| -------- | -------- | ---------------------------------------------------------- |
| url      | `string` | Original segment URL that failed to download.              |
| name     | `string` | Error name or type (e.g., `NetworkError`, `TimeoutError`). |
| message  | `string` | Human-readable error description.                          |

## Development & Contributing

Contributions are welcome! This project enforces strict quality standards to maintain 100% coverage.

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20.0.0
- [npm](https://github.com/npm/cli) >= 10.0.0

### Workflow

Fork & Clone: Get the repo locally.

- `Install`: `npm install`
- `Test`: `npm run test` (Must pass without warnings)
- `Lint`: `npm run lint` (Must pass without warnings)
- `Build`: `npm run build` (Generates `./dist` and bundled types)
- `Docs`: `npm run docs` (Generates TypeDoc HTML)
- `Test with Coverage Report`: `npm run test:coverage` (Must maintain 100% coverage)

### Guidelines

- Follow the JSDoc hierarchy: Use `@module HLSDownloader` and `@category Services/Types`.
- All new features must include unit tests.
- Maintain ESM compatibility (always use file extensions in imports).

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/nurrony/hlsdownloader/issues). You can also take a look at the [contributing guide](https://github.com/nurrony/hlsdownloader/blob/main/CONTRIBUTING.md).

## Show your support

Give a ⭐️ if this project helped you!. I will be grateful if you all help me to improve this package by giving your suggestions, feature request and pull requests. I am all ears!!

## License

Copyright © 2026 [Nur Rony](https://github.com/nurrony).<br />
