import HLSDownloader from './../src';

describe('Dowloader', () => {
  const options = {
    playlistURL: 'http://nmrony.local/hls/example.m3u8',
    url: 'http://nmrony.local/hls/example.m3u8',
    method: 'POST',
    headers: {
      Authorization: 'Bearer secret-token',
      'User-Agent': 'My little demo app',
    },
    json: true,
    form: true,
    body: true,
    setHost: true,
    isStream: true,
    parseJson: true,
    prefixUrl: true,
    cookieJar: true,
    allowGetBody: true,
    stringifyJson: true,
    methodRewriting: true,
  };
  describe('#constructor', () => {
    it('should throw an error for empty call', () => {
      expect(() => {
        new HLSDownloader();
      }).toThrow('Invalid URL');
    });

    it('should have all properties with default values when provided playlistURL only', () => {
      const downloader = new HLSDownloader({ playlistURL: 'http://nmrony.local/hls/example.m3u8' });
      expect(downloader).not.toBeNull();
      expect(downloader).toBeInstanceOf(HLSDownloader);
      expect(downloader.kyOptions).not.toBeUndefined();
      expect(downloader).toHaveProperty('errors', []);
      expect(downloader).toHaveProperty('concurrency', 1);
      expect(downloader).toHaveProperty('items', ['http://nmrony.local/hls/example.m3u8']);
      expect(downloader).toHaveProperty('playlistURL', 'http://nmrony.local/hls/example.m3u8');
    });

    it('should not contain unsupported ky options when options are provided', () => {
      const downloader = new HLSDownloader({ concurrency: 5, playlistURL: 'http://nmrony.local/hls/example.m3u8' });
      expect(downloader.concurrency).not.toBeNull();
      expect(downloader).toHaveProperty('concurrency', 5);
    });

    it('should not contain unsupported ky options when options are provided', () => {
      const downloader = new HLSDownloader({ options, playlistURL: 'http://nmrony.local/hls/example.m3u8' });
      expect(downloader).not.toBeNull();
      expect(downloader).toBeInstanceOf(HLSDownloader);
      expect(downloader.kyOptions).toEqual(expect.not.arrayContaining(HLSDownloader.unSupportedOptions));
    });

    it('destination key should be set properly if provided', () => {
      const downloader = new HLSDownloader({
        options,
        destination: '/tmp',
        playlistURL: 'http://nmrony.local/hls/example.m3u8',
      });
      expect(downloader.destination).not.toBeNull();
      expect(downloader.destination).toEqual('/tmp');
      expect(downloader.destination).not.toStrictEqual('');
    });

    it('should not contain request url key in options', () => {
      const downloader = new HLSDownloader({ options, playlistURL: 'http://nmrony.local/hls/example.m3u8' });
      expect(downloader.kyOptions).not.toContain('url');
    });

    it('should not contain request method key in options', () => {
      const downloader = new HLSDownloader({ options, playlistURL: 'http://nmrony.local/hls/example.m3u8' });
      expect(downloader.kyOptions).not.toContain('method');
    });

    it('should contains default options', () => {
      const downloader = new HLSDownloader({ options, playlistURL: 'http://nmrony.local/hls/example.m3u8' });
      expect(downloader.kyOptions).toMatchObject(HLSDownloader.defaultKyOptions);
    });

    it('should override default options when provided', () => {
      const downloader = new HLSDownloader({
        ...options,
        retry: { limit: 10 },
        timeout: { request: 1000 },
        playlistURL: 'http://nmrony.local/hls/example.m3u8',
      });
      expect(downloader.kyOptions).toEqual(expect.not.arrayContaining(HLSDownloader.unSupportedOptions));
      expect(downloader.kyOptions).toMatchObject({ timeout: { request: 1000 }, retry: { limit: 10 } });
    });
  });

  describe('#mergeOptions', () => {
    let downloader = null;
    beforeAll(() => {
      downloader = new HLSDownloader({ playlistURL: 'http://nmrony.local/hls/example.m3u8', options });
    });

    it('should return only default options for no override', () => {
      expect(downloader.mergeOptions(options)).toMatchObject(HLSDownloader.defaultKyOptions);
    });

    it('should return options with provided override', () => {
      const newOptions = Object.assign({}, options, {
        retry: { limit: 10 },
        timeout: { request: 1000 },
      });
      expect(downloader.mergeOptions(newOptions)).toMatchObject({
        retry: { limit: 10 },
        timeout: { request: 1000 },
      });
    });
  });

  describe('#parseVariantPlaylist', () => {
    let items = [];
    // do not indent it
    const variantPlaylistContent = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:9.00900,
pure-relative.ts
#EXTINF:9.00900,
/other/root-relative.ts
#EXTINF:9.00900,
../third/relative.ts
#EXTINF:9.00900,
http://www.example.com/other-host.ts
#EXTINF:9.00900,
//www.example.com/things/protocol-relative.ts
#EXT-X-ENDLIST
`;
    beforeAll(() => {
      const downloader = new HLSDownloader({ concurrency: 5, playlistURL: 'http://nmrony.local/hls/example.m3u8' });
      items = downloader.parsePlaylist('http://nmrony.local/hls/example.m3u8', variantPlaylistContent);
    });

    it('should parse the correct number of items', () => {
      expect(items.length).toStrictEqual(5);
    });

    it('should handle urls with no pathing', () => {
      expect(items[0]).toStrictEqual('http://nmrony.local/hls/pure-relative.ts');
    });

    it('should handle urls root relative pathing', () => {
      expect(items[1]).toStrictEqual('http://nmrony.local/other/root-relative.ts');
    });

    it('should handle urls with subdirectory pathing', () => {
      expect(items[2]).toStrictEqual('http://nmrony.local/third/relative.ts');
    });

    it('should handle urls with absolute urls', () => {
      expect(items[3]).toStrictEqual('http://www.example.com/other-host.ts');
    });

    it('should handle protocol relative urls', () => {
      expect(items[4]).toStrictEqual('http://www.example.com/things/protocol-relative.ts');
    });
  });

  // describe('#startDwonload', () => {
  //   let downloader;
  //   beforeAll(() => {
  //     downloader = new HLSDownloader({ playlistURL: 'http://nmrony.local/hls/example.m3u8' });
  //     downloader.startDownload();
  //   });
  // });
});
