import HLSDownloader from './build/index';

const downloader = new HLSDownloader({
  playlistURL: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  concurrency: 5,
  destination: '/tmp/test',
});

const download = async () => downloader.startDownload();
console.log(await downloader.startDownload());
