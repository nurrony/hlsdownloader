import { jest } from '@jest/globals';
import { rimraf } from 'rimraf';
import Utils from '../src/utils';
import HLSDownloader from './../src';

const fail = (reason = 'fail was called in a test.') => {
  throw new Error(reason);
};

describe('Dowloader', () => {
  let downloader;
  let fetchSpy;
  let isValidPlaylistSpy;

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

  const validPlaylistContent = `#EXTM3U
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

  const invalidPlaylistContent = `
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:9.00900,
pure-relative.ts
#EXT-X-ENDLIST
  `;

  beforeAll(() => {
    isValidPlaylistSpy = jest.spyOn(Utils, 'isValidPlaylist');
    fetchSpy = jest.spyOn(global, 'fetch');
    jest.resetModules();
  });

  beforeEach(() => {
    downloader = new HLSDownloader({ concurrency: 5, playlistURL: 'http://nmrony.local/hls/example.m3u8', options });
  });

  afterAll(() => {
    jest.clearAllMocks();
  });
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

    it('should set onData hook to null if not provided', () => {
      const downloaderParams = { ...options, playlistURL: 'http://nmrony.local/hls/example.m3u8' };
      const downloader = new HLSDownloader(downloaderParams);
      expect(downloader.onData).toBeNull();
    });

    it('should configure onData hook if provided', () => {
      const downloaderParams = { ...options, playlistURL: 'http://nmrony.local/hls/example.m3u8', onData: () => { } };
      const downloader = new HLSDownloader(downloaderParams);
      expect(downloader.onData).not.toBeNull();
    });

    it('should throw error onData hook is not function', () => {
      const downloaderParams = {
        ...options,
        playlistURL: 'http://nmrony.local/hls/example.m3u8',
        onData: 'NotAFunction',
      };

      expect(() => {
        const downloader = new HLSDownloader(downloaderParams);
      }).toThrow('The `onData` must be a function');
    });

    it('should set onError hook to null if not provided', () => {
      const downloaderParams = { ...options, playlistURL: 'http://nmrony.local/hls/example.m3u8' };
      const downloader = new HLSDownloader(downloaderParams);
      expect(downloader.onError).toBeNull();
    });

    it('should configure onError hook if provided', () => {
      const downloaderParams = { ...options, playlistURL: 'http://nmrony.local/hls/example.m3u8', onError: () => { } };
      const downloader = new HLSDownloader(downloaderParams);
      expect(downloader.onError).not.toBeNull();
    });

    it('should throw error onError hook is not function', () => {
      const downloaderParams = {
        ...options,
        playlistURL: 'http://nmrony.local/hls/example.m3u8',
        onError: 'NotAFunction',
      };

      expect(() => {
        const downloader = new HLSDownloader(downloaderParams);
      }).toThrow('The `onError` must be a function');
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

  describe('#parsePlaylist', () => {
    let items = [];

    beforeEach(() => {
      items = downloader.parsePlaylist('http://nmrony.local/hls/example.m3u8', validPlaylistContent);
    });

    it('should parse the correct number of items', () => {
      expect(items.length).toStrictEqual(6);
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

  describe('#fetchPlaylist', () => {
    it('should fetch playlist fine with valid content', async () => {
      fetchSpy.mockResolvedValue(Promise.resolve(new Response(validPlaylistContent)));
      const { url, body } = await downloader.fetchPlaylist('http://nmrony.local/hls/playlist.m3u8');
      expect(body).toStrictEqual(validPlaylistContent);
      expect(Utils.isValidPlaylist).toHaveBeenCalled();
      expect(isValidPlaylistSpy(validPlaylistContent)).toBeTruthy();
      expect(url).toStrictEqual('http://nmrony.local/hls/playlist.m3u8');
    });

    it('should report error for invalid playlist content', async () => {
      fetchSpy.mockResolvedValue(Promise.resolve(new Response(invalidPlaylistContent)));
      await downloader.fetchPlaylist('http://nmrony.local/hls/playlist.m3u8');
      expect(isValidPlaylistSpy).toHaveBeenCalled();
      expect(isValidPlaylistSpy).toHaveBeenCalledTimes(1);
      expect(downloader.errors.length).toStrictEqual(1);
      expect(isValidPlaylistSpy(invalidPlaylistContent)).toBeFalsy();
    });

    it('should report error for http errors', async () => {
      try {
        await downloader.fetchPlaylist('http://nmrony.local/hls/playlist.m3u8');
        fail('404');
      } catch (error) {
        expect(downloader.errors.length).toStrictEqual(1);
        expect(error.message).toStrictEqual('404');
      }
    });
  });

  describe('#formatPlaylistContent', () => {
    let result = [];
    const fetchedData = [
      { status: 'fulfilled', value: 'http://nmrony.local/hls/1.ts' },
      { status: 'fulfilled', value: 'http://nmrony.local/hls/2.ts' },
      { status: 'rejected', reason: 'http://nmrony.local/hls/3.ts' },
    ];
    beforeEach(() => {
      result = downloader.formatPlaylistContent(fetchedData);
    });

    it('should process fulfilled items fine', () => {
      expect(result.length).toEqual(2);
    });
  });

  describe('#startDwonload', () => {
    let fetchPlaylistSpy = null;
    let parsePlaylistSpy = null;
    let downloadItemSpy = null;
    let downloadItemsSpy = null;
    let processPlaylistItemsSpy = null;
    const destination = '/tmp/test';

    beforeEach(() => {
      fetchPlaylistSpy = jest.spyOn(downloader, 'fetchPlaylist');
      downloadItemSpy = jest.spyOn(downloader, 'downloadItem');
      downloadItemsSpy = jest.spyOn(downloader, 'downloadItems');
      parsePlaylistSpy = jest.spyOn(downloader, 'parsePlaylist');
      processPlaylistItemsSpy = jest.spyOn(downloader, 'processPlaylistItems');
    });

    afterEach(() => {
      downloadItemSpy.mockReset();
      downloadItemsSpy.mockReset();
      fetchPlaylistSpy.mockReset();
      parsePlaylistSpy.mockReset();
      processPlaylistItemsSpy.mockReset();
    });

    afterAll(async () => { });

    it('should return empty error for http or invalid playlist', async () => {
      let result = null;
      fetchSpy.mockRejectedValueOnce(new Error('404'));
      try {
        result = await downloader.startDownload();
        fail('Invalid Playlist');
      } catch (error) {
        expect(fetchPlaylistSpy).toHaveBeenCalled();
        expect(fetchPlaylistSpy).toHaveBeenCalledTimes(1);
        expect(fetchPlaylistSpy).toHaveReturnedTimes(1);
        expect(downloader.errors.length).toBeGreaterThan(0);
        expect(error.message).toStrictEqual('Invalid Playlist');
      }
    });

    it('should fetch items for valid url', async () => {
      fetchSpy.mockResolvedValue(Promise.resolve(new Response(validPlaylistContent)));
      await downloader.startDownload();
      expect(fetchPlaylistSpy).toHaveBeenCalled();
      expect(parsePlaylistSpy).toHaveBeenCalled();
      expect(processPlaylistItemsSpy).toHaveBeenCalled();
      expect(fetchPlaylistSpy).toHaveBeenCalledTimes(2);
      expect(parsePlaylistSpy).toHaveBeenCalledTimes(2);
      expect(downloader.errors.length).toStrictEqual(1);
    });

    it('should report error with invalid content', async () => {
      fetchSpy.mockResolvedValue(Promise.resolve(new Response(invalidPlaylistContent)));
      await downloader.startDownload();
      expect(fetchPlaylistSpy).toHaveBeenCalled();
      expect(fetchPlaylistSpy).toHaveBeenCalledTimes(1);
      expect(downloader.errors.length).toBeGreaterThan(0);
    });

    it('should report error with invalid content', async () => {
      fetchSpy.mockResolvedValue(Promise.resolve(new Response(invalidPlaylistContent)));
      await downloader.startDownload();
      expect(fetchPlaylistSpy).toHaveBeenCalled();
      expect(fetchPlaylistSpy).toHaveBeenCalledTimes(1);
      expect(downloader.errors.length).toBeGreaterThan(0);
    });

    it('should download items for valid url', async () => {
      downloader = new HLSDownloader({
        destination,
        concurrency: 5,
        overwrite: true,
        playlistURL: 'http://nmrony.local/hls/example.m3u8',
      });
      fetchSpy.mockResolvedValue(Promise.resolve(new Response(validPlaylistContent)));
      await downloader.startDownload();
      // expect(fetchPlaylistSpy).toHaveBeenCalled();
      // expect(parsePlaylistSpy).toHaveBeenCalled();
      // expect(processPlaylistItemsSpy).toHaveBeenCalled();
      // expect(fetchPlaylistSpy).toHaveBeenCalledTimes(2);
      // expect(parsePlaylistSpy).toHaveBeenCalledTimes(2);
      // expect(downloader.errors.length).toStrictEqual(0);
    });

    it('should not download items for valid url', async () => {
      downloader = new HLSDownloader({
        destination,
        concurrency: 5,
        overwrite: false,
        playlistURL: 'http://nmrony.local/hls/example.m3u8',
      });
      fetchSpy.mockResolvedValue(Promise.resolve(new Response(validPlaylistContent)));
      await downloader.startDownload();
      expect(fetchPlaylistSpy).not.toHaveBeenCalled();
      expect(parsePlaylistSpy).not.toHaveBeenCalled();
      expect(processPlaylistItemsSpy).not.toHaveBeenCalled();
      await rimraf(destination);
    });
  });
});
