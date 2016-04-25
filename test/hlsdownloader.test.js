'use strict';

import { expect } from 'chai';
import sinon from 'sinon';
import request from 'request-promise';
import {downloader as HLSDownloader, buildURL} from '../hlsdownloader';

describe('HLSDownloader', () => {

  const downloader = new HLSDownloader({
    playlistURL: 'http://nmrony.local/hls/example.m3u8'
  });

  describe('#constructor', () => {
    it('should throw an error', () => {
      expect(() => new HLSDownloader()).to.be.throw(Error);
    });

    it('should return an object', () => {
      expect(downloader).to.be.an('object').and.to.be.not.null;

    });

    it('should have all keys', () => {
      expect(downloader).to.have.all.keys(['playlistURL',
        'hostName',
        'hostURL',
        'errors',
        'items',
        'destination'
      ]);
    });

    it('destination key should not be null', () => {
      downloader.destination = '/test';
      expect(downloader.destination).to.be.not.null;
    });
  });

  describe('#buildURL', () => {
    it('should parse absolute url', () => {
      const input = 'http://nmrony.local/hls/playlist.m3u8';
      const output = buildURL(input, downloader.hostURL);
      expect(output).to.be.equal(input);
    });

    it('should parse absolute url with queryString', () => {
      const input = 'http://nmrony.local/hls/playlist.m3u8?assetId=blah-blah&videoId=blah-blah';
      const output = buildURL(input, downloader.hostURL);
      expect(output).to.be.equal(input);
    });

    it('should parse relative url with leading slash', () => {
      const input = '/streaming/index/playlist.m3u8';
      const output = buildURL(input, downloader.hostURL);
      expect(output).to.be.equal('http://nmrony.local/streaming/index/playlist.m3u8');
    });

    it('should parse relative url with leading slash and QueryString', () => {
      const input = '/streaming/index/playlist.m3u8?assetId=blah-blah&videoId=blah-blah';
      const output = buildURL(input, downloader.hostURL);
      expect(output).to.be.equal('http://nmrony.local/streaming/index/playlist.m3u8' +
        '?assetId=blah-blah&videoId=blah-blah');
    });

    it('should parse relative url without leading slash', () => {
      const input = 'streaming/index/playlist.m3u8';
      const output = buildURL(input, downloader.hostURL);
      expect(output).to.be.equal('http://nmrony.local/streaming/index/playlist.m3u8');
    });

    it('should parse relative url without leading slashand QueryString', () => {
      const input = '/streaming/index/playlist.m3u8?assetId=blah-blah&videoId=blah-blah';
      const output = buildURL(input, downloader.hostURL);
      expect(output).to.be.equal('http://nmrony.local/streaming/index/playlist.m3u8?assetId=blah-blah&videoId=blah-blah');
    });

    it('should preserve ts or variant playlist host', () => {
      const input = 'http://super.hls.provider:8080/streaming/index/playlist.m3u8?assetId=blah-blah&videoId=blah-blah';
      const output = buildURL(input, downloader.hostURL);
      expect(output).to.be.equal('http://super.hls.provider:8080/streaming/index/playlist.m3u8?assetId=blah-blah&videoId=blah-blah');
    });

  });
});
