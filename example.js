import HLSDownloader from './build/index';

// for fetching only
let downloader = new HLSDownloader({
  playlistURL: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
});

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

// passing onData hook
downloader = new HLSDownloader({
  concurrency: 5,
  overwrite: true,
  destination: '/tmp/tests',
  playlistURL: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  retry: { limit: 0 },
  onData: function (data) {
    console.log(
      'downloaded item = ',
      data.url,
      ', total items to download',
      data.totalItems,
      ', downloaded path =',
      data.path
    );
  },
});

// passing onError hook
downloader = new HLSDownloader({
  concurrency: 5,
  overwrite: true,
  destination: '/tmp/tests',
  playlistURL: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  retry: { limit: 0 },
  onError: function (error) {
    console.log({ ...error });
  },
});
