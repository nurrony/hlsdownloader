import HLSDownloader from 'hlsdownloader' // Using ES2015 module
// var HLSDownloader = require('hlsdownloader').downloader // using commonJS module

const params = {
  playlistURL: 'http://example.com/url/to/your/hls.m3u8', // change it
  destination: '/tmp' // change it
}
const downloader = new HLSDownloader(params)
downloader.startDownload((err, msg) => err ? console.log(err) : console.log(msg))
