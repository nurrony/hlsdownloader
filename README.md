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

- **Modern ESM**: Optimized for Node.js 20+ environments using native modules.
- **Retryable**: Built-in resilience that automatically retries failed segment requests to ensure download completion.
- **Promise Based**: Fully asynchronous API designed for seamless integration with `async/await` and modern control flows.
- **Support for HTTP/2**: Leverages multiplexing to download multiple segments over a single connection for reduced overhead.
- **Overwrite Protection**: Safeguards your local data by preventing accidental overwriting of existing files unless explicitly enabled.
- **Support for Custom HTTP Headers**: Allows injection of custom headers for handling authentication, user-agents, or session tokens.
- **Support for Custom HTTP Client**: Modular architecture that lets you swap the default engine for any custom client implementation.
- **Bring Your Own Progress Bar**: Exposed event hooks and lifecycle data allow you to hook in any CLI or GUI progress visualization.
- **Concurrent Downloads**: Maximizes bandwidth by fetching multiple HLS segments simultaneously through parallel HTTP connections.
- **Professional Docs**: Integrated JSDoc-to-HTML pipeline using TypeDoc and the Fresh theme.

---

## Installation

```bash
npm install hlsdownloader
```

## Examples

### Basic Usage

```ts
import HLSDowloader from 'hlsdownloader';

const downloader = new HLSDownloader({
  playlistURL: '[https://example.com/stream/master.m3u8](https://example.com/stream/master.m3u8)',
  destination: './downloads/my-video',
});

const summary = await downloader.startDownload();
console.log(`Downloaded ${summary.total} segments to ${summary.path}`);
```

### Using as CDN Primer

```ts
import HLSDowloader from 'hlsdownloader';

const downloader = new HLSDownloader({
  playlistURL: '[https://example.com/stream/master.m3u8](https://example.com/stream/master.m3u8)',
});

const summary = await downloader.startDownload();
console.log(`Fetching ${summary.total} segments to Edge servers`);
```

### Advanced Usage

```ts
import { HLSDownloader } from 'hlsdownloader-ts';

const downloader = new HLSDownloader({
  playlistURL: 'https://example.com/video.m3u8',
  concurrency: 10, // 10 simultaneous downloads (optional: 1)
  destination: './output', // path to downlod   (optional: '')
  overwrite: true, // Overwrite existing files. (optional: false)
});

const { total, errors } = await downloader.startDownload();

if (errors.length > 0) {
  console.error(`${errors.length} segments failed.`, errors);
}
```

HLSDownloader supports all [Ky API](https://github.com/sindresorhus/ky?tab=readme-ov-file#api) except these options given below

- uri
- url
- json
- form
- body
- method
- setHost
- isStream
- parseJson
- prefixUrl
- cookieJar
- playlistURL
- concurrency
- allowGetBody
- stringifyJson
- methodRewriting

## API Documentation

The library is organized under the `HLSDownloader` module. For full interactive documentation, visit our [Documentation](https://nurrony.github.io/hlsdownloader) site.

### HLSDownloader (Class)

The main service orchestrator for fetching HLS content.

| Method            | Returns                    | Description                           |
| ----------------- | -------------------------- | ------------------------------------- |
| `startDownload()` | `Promise<DownloadSummary>` | Begins parsing and fetching segments. |

### DownloaderOptions (Interface)

| Property    | Type       | Default       | Description                                             |
| ----------- | ---------- | ------------- | ------------------------------------------------------- |
| playlistURL | `string`   | **Required**  | The absolute URL to the M3U8 file.                      |
| destination | `string`   | `''`          | Local path to save files.                               |
| concurrency | `number`   | `os.cpus - 1` | Max parallel network requests.                          |
| overwrite   | `boolean`  | `false`       | Indicates whether existing files should be overwritten. |
| onData      | `callback` | `null`        | The local directory where files will be saved.          |
| onError     | `callback` | `null`        | The local directory where files will be saved.          |

### DownloadSummary (Interface)

| Property | Type              | Description                           | Description                        |
| -------- | ----------------- | ------------------------------------- | ---------------------------------- |
| `total`  | `number`          | Count of successfully saved segments. | The absolute URL to the M3U8 file. |
| `path`   | `string`          | The final output directory.           | Local path to save files.          |
| `errors` | `DownloadError[]` | Array of detailed failure objects.    | Max parallel network requests.     |

## Development & Contributing

Contributions are welcome! This project enforces strict quality standards to maintain 100% coverage.

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Workflow

Fork & Clone: Get the repo locally.

- Install: `npm install`
- Lint: `npm run lint` (Must pass without warnings)
- Test: `npm run test:coverage` (Must maintain 100% coverage)
- Build: `npm run build` (Generates `./dist` and bundled types)
- Docs: `npm run docs` (Generates TypeDoc HTML)

### Guidelines

- Follow the JSDoc hierarchy: Use `@module HLSDownloader` and `@category Services/Types`.
- All new features must include unit tests.
- Maintain ESM compatibility (always use file extensions in imports).

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/nurrony/hlsdownloader/issues). You can also take a look at the [contributing guide](https://github.com/nurrony/hlsdownloader/blob/main/CONTRIBUTING.md).

## Show your support

Give a ⭐️ if this project helped you!. I will be grateful if you all help me to improve this package by giving your suggestions, feature request and pull requests. I am all ears!!

## Special Thanks to

- [Ky Team](https://www.npmjs.com/package/ky)

## License

Copyright © 2026 [Nur Rony](https://github.com/nurrony).<br />
