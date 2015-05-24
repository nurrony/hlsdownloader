'use strict';

var expect = require('chai').expect;
var HLSDownloader = require('../');

describe('HLSDownloader', function() {

  describe('#constructor', function() {
    it('should throw an error', function() {
      expect(function() {
        new HLSDownloader();
      }).to.be.throw(Error);
    });

    it('should return an object', function() {
      var downloader = new HLSDownloader({
        playlistURL: 'http://nmrony.local/hls/example.m3u8'
      });
      expect(downloader).to.be.an('object').and.to.be.not.null;

    });

    it('should have all keys', function() {
      var downloader = new HLSDownloader({
        playlistURL: 'http://nmrony.local/hls/example.m3u8'
      });
      expect(downloader).to.have.all.keys(['playlistURL',
        'hostName',
        'errors',
        'items',
        'destination'
      ]);
    });

    it('destination key should not be null', function() {
      var downloader = new HLSDownloader({
        playlistURL: 'http://nmrony.local/hls/example.m3u8',
        destination: '/test'
      });
      expect(downloader.destination).to.be.not.null;
    });
  });

  describe('#startDownload', function() {
  });
});
