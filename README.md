HLSDownloader
--------------
Downloads `m3u8` playlist and `TS` chunks for a given playlist URL.

Installation
=============
Install it via `npm`

```sh
[sudo] npm install hlsdownloader
```

Configuration
=============
It's simple as below

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

