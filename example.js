import HLSDownloader from './build/index';

// for fetching
let downloader = new HLSDownloader({
  playlistURL: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
});

const download = async () => downloader.startDownload();
console.log(await downloader.startDownload());

// download HLS resoruces
downloader = new HLSDownloader({
  playlistURL: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  destination: '/tmp/tests',
});

// with 5 parallel download
downloader = new HLSDownloader({
  concurrency: 5,
  destination: '/tmp/tests',
  playlistURL: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
});

// force overwrite
downloader = new HLSDownloader({
  concurrency: 5,
  overwrite: true,
  destination: '/tmp/tests',
  playlistURL: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
});

// passing ky option
downloader = new HLSDownloader({
  concurrency: 5,
  overwrite: true,
  destination: '/tmp/tests',
  playlistURL: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  retry: { limit: 0 },
});
