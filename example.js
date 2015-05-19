var HLSDownloader = require('./index');
var params = {
  playlistURL: 'http://nmrony.local/hls/playlist.m3u8', // change it
  destination:'/tmp' // change it
};
var downloader = new HLSDownloader(params);
downloader.startDownload(function(err, msg){
  if (err) {
    return console.log(err);
  }
  console.log(msg);
});
