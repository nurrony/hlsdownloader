// import HLSDownloader from 'hlsdownloader' // Using ES2015 module
var HLSDownloader = require('./index').downloader // using commonJS module

const params = {
  playlistURL: 'http://ito-demo.videoguyz.com/live/playlist/587-128-215513-trace.m3u8', // change it
  destination: '/tmp' // change it
}
const downloader = new HLSDownloader(params)
downloader.startDownload((err, msg) => err ? console.log(err) : console.log(msg))
