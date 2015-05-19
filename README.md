HLSDownloader
==============
Downloads `m3u8` playlist and `TS` chunks for a given playlist URL.

Installation
------------
Install it via `npm`

```sh
[sudo] npm install hlsdownloader
```

Configuration
-------------
`destination` is optional. If `destination` is not provided it won't do nothing. It can also be useful if you want
to do CDN content pre-fetching for your end viewers. It's simple as below

```sh
var HLSDownloader = require('hlsdownloader');
var params = {
      playlistURL: 'http://example.com/hls/playlist.m3u8',
      destination:'/tmp'
};
var downloader = new HLSDownloader(params);
downloader.startDownload(function(err, msg){
   if(err){
     console.log(err);
   }
   console.log(msg);
});
```

I will be grateful if you all help me to improve this package giving your suggestions, feature request and pull requests.
I am all ears!!