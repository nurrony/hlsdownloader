'use strict';

import { expect } from 'chai';
import sinon from 'sinon';
import request from 'request-promise';
import HLSDownloader from '../index.es2015';

describe('HLSDownloader', () => {

  describe('#constructor', () => {

    const downloader = new HLSDownloader({
      playlistURL: 'http://nmrony.local/hls/example.m3u8'
    });

    it('should throw an error', () => {
      expect(() => {
        new HLSDownloader();
      }).to.be.throw(Error);
    });

    it('should return an object', () => {
      expect(downloader).to.be.an('object').and.to.be.not.null;

    });

    it('should have all keys', () => {

      expect(downloader).to.have.all.keys(['playlistURL',
        'hostName',
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
});
