'use strict'

import { expect } from 'chai'
import { downloader as HLSDownloader } from '../hlsdownloader'

describe('HLSDownloader', () => {
  let downloader

  beforeEach(() => {
    downloader = new HLSDownloader({
      playlistURL: 'http://nmrony.local/hls/example.m3u8',
      method: 'POST',
      resolveWithFullResponse: true,
      headers: {
        Authorization: 'Bearer secret-token',
        'User-Agent': 'My little demo app'
      },
      json: true,
      uri: '/hello-world',
      url: 'http://nmrony.local',
      transform () {},
      baseUrl: 'http://blah.com',
      form: 'blah blah',
      formData: 'blah blah',
      preambleCRLF: 'blah blah',
      postambleCRLF: 'blah blah',
      jsonReviver: 'blah blah',
      jsonReplacer: 'blah blah'
    })
  })

  describe('#constructor', () => {
    it('should throw an error', () => {
      expect(() => new HLSDownloader()).to.be.throw(Error)
    })

    it('should return an object', () => {
      expect(downloader).to.be.an('object').and.to.be.not.null
    })

    it('should have all keys', () => {
      expect(downloader).to.have.all.keys(['playlistURL', 'hostName', 'errors', 'items', 'options', 'destination'])
    })

    it('destination key should not be null', () => {
      downloader.destination = '/test'
      expect(downloader.destination).to.be.not.null
    })

    it('options should not contain request method key', () => {
      const options = downloader.options
      expect(options).to.not.include.keys('method')
    })

    it('options should not contain unsupported request option key', () => {
      const options = downloader.options
      expect(options).to.not.include.any.keys([
        'method',
        'uri',
        'url',
        'transform',
        'resolveWithFullResponse',
        'baseUrl',
        'form',
        'json',
        'formData',
        'preambleCRLF',
        'postambleCRLF',
        'jsonReviver',
        'jsonReplacer'
      ])
    })
  })

  describe('#parseVariantPlaylist', () => {
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
    `
    beforeEach(() => {
      downloader.parseVariantPlaylist(variantPlaylistContent)
    })

    it('should parse the correct number of items', () => {
      expect(downloader.items.length).to.equal(6)
    })

    it('should handle urls with no pathing', () => {
      expect(downloader.items[0]).to.equal('http://nmrony.local/hls/pure-relative.ts')
    })

    it('should handle urls root relative pathing', () => {
      expect(downloader.items[1]).to.equal('http://nmrony.local/other/root-relative.ts')
    })

    it('should handle urls with subdirectory pathing', () => {
      expect(downloader.items[2]).to.equal('http://nmrony.local/third/relative.ts')
    })

    it('should handle urls with absolute urls', () => {
      expect(downloader.items[3]).to.equal('http://www.example.com/other-host.ts')
    })

    it('should handle protocol relative urls', () => {
      expect(downloader.items[4]).to.equal('http://www.example.com/things/protocol-relative.ts')
    })
  })
})
