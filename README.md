<h1 align="left">HLSDownloader 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/hlsdownloader" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/hlsdownloader.svg">
  </a>
  <a href="https://www.npmjs.com/package/hlsdownloader" target="_blank">
    <img src="https://img.shields.io/badge/node-%3E%3D18-blue.svg" />
  </a>
  <a href="https://nurrony.github.io/hlsdownloader" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://codecov.io/gh/nurrony/hlsdownloader" > 
    <img src="https://codecov.io/gh/nurrony/hlsdownloader/graph/badge.svg?token=er50RqLH6T"/> 
  </a>
  <a href="https://github.com/nurrony/hlsdownloader/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/nurrony/hlsdownloader/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/nurrony/hlsdownloader" />
  </a>
  <a href="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079" target="_blank">
    <img alt="Semver: Badge" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079" />
  </a>
  <a href="https://twitter.com/nmrony" target="_blank">
    <img alt="Twitter: nmrony" src="https://img.shields.io/twitter/follow/nmrony.svg?style=social" />
  </a>

</p>

Downloads HLS Playlist file and TS chunks. It is useful if you want to do content pre-fetching from CDN for your end viewers.

> ⚠️
> <strong>This package is native [ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and no longer provides a CommonJS export. If your project uses CommonJS, you will have to [convert to ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). Please don't open issues for questions regarding CommonJS / ESM.</strong>

> ⚠️ HLSDownloader v2.x.x is no longer maintained and we will not accept any backport requests.

## Features

- Retryable
- Support for HTTP/2
- Overwrite protection
- Support for custom HTTP Headers
- Support for custom HTTP Client
- Bring your own progress bar for download
- Concurrent download segments with multiple http connections

## Prerequisites

- node >=18.x.x
- npm >= 9.x.x

## Installation

It is pretty straight forward

```sh
# using npm
npm install --save hlsdownloader
# or with yarn
yarn add hlsdownloader
# or pnpm
pnpm install hlsdownloader
```

## How to use

`destination` field is optional. If `destination` is not provided it just fetches the content from origin.
It can also be useful if you want to do content pre-fetching from CDN for your end viewers. If any `TS` or `m3u8`
variant download is failed it continues downloading others and reports after finishing.

It's simple as below.

```js
import HLSDownloader from 'hlsdownloader';

const options = {
  playlistURL: 'http://example.com/path/to/your/playlist.m3u8', // change it
  destination: '/tmp', // change it (optional: default '')
  concurrency: 10, // change it (optional: default = 1),
  overwrite: true, // change it (optional: default = false)
};
const downloader = new HLSDownloader(options);
downloader.startDownload().then(response => console.log(response));
```

> ℹ️ Check [example.js](example.js) for working example

```js
// on success
{
  total: <number>,
  playlistURL: 'your playlist url'
  message: 'Downloaded successfully',
}

// on partial download
{
  total: <number>,
  playlistURL: 'your playlist url',
  message: 'Download done with some errors',
  errors: [] // items url that is skipped or could not downloaded for error
}
```

## Advance Usage

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

It also disable retry failed request that you can easily override

## 🧪 Running Tests

```sh
npm test
```

To run it on watch mode

```sh
npm run test:watch
```

## Generate Documentations

```sh
npm docs:gen
```

## Authors

👤 **Nur Rony**

- Website: [nurrony.github.io](https://nurrony.github.io)
- Twitter: [@nmrony](https://twitter.com/nmrony)
- Github: [@nurrony](https://github.com/nurrony)
- LinkedIn: [@nmrony](https://linkedin.com/in/nmrony)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/nurrony/hlsdownloader/issues). You can also take a look at the [contributing guide](https://github.com/nurrony/hlsdownloader/blob/master/CONTRIBUTING.md).

## Show your support

Give a ⭐️ if this project helped you!. I will be grateful if you all help me to improve this package by giving your suggestions, feature request and pull requests. I am all ears!!

## Special Thanks to

- [Ky Team](https://www.npmjs.com/package/ky)

## 📝 License

Copyright © 2023 [Nur Rony](https://github.com/nurrony).<br />
This project is [MIT](https://github.com/nurrony/hlsdownloader/blob/master/LICENSE) licensed.
