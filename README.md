HLSDownloader
==============
[![version][npm-version]][npm-url] [![dependencies][npm-dependencies]][npm-url] [![devDependencies][npm-dev-dependencies]][npm-url] [![Downloads][npm-month-downloads]][npm-url]

Downloads `m3u8` playlist and `TS` chunks for a given playlist URL.

Installation
------------
Install it via `npm`

```sh
[sudo] npm install hlsdownloader
```

Configuration
-------------
`destination` field is optional. If `destination` is not provided it just fetches the content from origin.
It can also be useful if you want to do content pre-fetching from CDN for your end viewers. If any `TS` or `m3u8`
 variant download is failed it continues downloading others and reports after finishing.

It's simple as below.

```js
var HLSDownloader = require('hlsdownloader');
var params = {
      playlistURL: 'http://example.com/hls/playlist.m3u8',
      destination:'/tmp'
};
var downloader = new HLSDownloader(params);
downloader.startDownload(function(err, msg) {
   if (err) {
     return console.log(err);
   }
   console.log(msg);
});
```
`msg` is an object with following properties

```js
//on success
{
message: 'Downloaded successfully',
playlistURL: 'your playlist url'
}
//on partial download
{
message: 'Download done with some errors',
playlistURL: 'your playlist url',
errors: [] // items url that is skipped or could not downloaded for error
}
```

I will be grateful if you all help me to improve this package by giving your suggestions, feature request and
pull requests. I am all ears!!

[npm-badge]: https://nodei.co/npm/hlsdownloader.png?compact=true
[npm-version]: https://img.shields.io/npm/v/hlsdownloader.svg?style=flat-square
[npm-dependencies]: https://img.shields.io/david/nmrony/hlsdownloader.svg?style=flat-square
[npm-dev-dependencies]: https://img.shields.io/david/dev/nmrony/hlsdownloader.svg?style=flat-square
[npm-month-downloads]: https://img.shields.io/npm/dm/hlsdownloader.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/hlsdownloader

